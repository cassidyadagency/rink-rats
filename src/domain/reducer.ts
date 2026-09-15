import { type ClockStamp, type GameEvent, type StatEvent, STAT_EVENTS, isStatEvent, isUndoable } from "./events";
import { type ClockState, clockElapsed } from "./clock";

export interface GameRules {
  periodCount: number;
  periodLengthSec: number;
}

export interface Shift {
  period: number;
  onSeq: number;
  on: ClockStamp;
  onWall: number;
  off: ClockStamp;
  offWall: number;
  clockSec: number;
  realSec: number;
  closedBy: "shift_off" | "penalty" | "period_end";
}

export interface OpenShift {
  seq: number;
  stamp: ClockStamp;
  wallTime: number;
}

export interface TimelineEntry {
  event: GameEvent;
  undone: boolean;
  undoneBy?: number;
}

export interface PenaltyState {
  seq: number;
  startedAt: ClockStamp;
  minutes: number;
}

export interface PeriodTime {
  clockSec: number;
  realSec: number;
}

export interface GameState {
  clock: ClockState;
  shift: { on: boolean; startedAt?: OpenShift };
  iceTime: { clockSec: number; realSec: number; byPeriod: PeriodTime[] };
  shifts: { count: number; avgClockSec: number; longestClockSec: number; list: Shift[] };
  stats: Record<StatEvent, number>;
  tags: string[];
  moments: GameEvent[];
  penalty?: PenaltyState;
  timeline: TimelineEntry[];
  lastUndoable?: GameEvent;
  isFinalPeriodComplete: boolean;
}

export function initialClock(rules: GameRules): ClockState {
  return { period: 1, secRemaining: rules.periodLengthSec, running: false, anchorWallTime: 0 };
}

/** Map of undone event seq → the seq of the undo event that removed it. */
function resolveUndos(sorted: GameEvent[]): Map<number, number> {
  const bySeq = new Map(sorted.map((e) => [e.seq, e]));
  const undoneBy = new Map<number, number>();
  for (const e of sorted) {
    if (e.type !== "undo") continue;
    const targetSeq = e.payload?.targetSeq;
    if (targetSeq === undefined) continue;
    const target = bySeq.get(targetSeq);
    if (!target) continue;
    if (target.type === "undo") {
      const restored = target.payload?.targetSeq;
      if (restored !== undefined && undoneBy.get(restored) === target.seq) undoneBy.delete(restored);
    } else if (!undoneBy.has(targetSeq)) {
      undoneBy.set(targetSeq, e.seq);
    }
  }
  return undoneBy;
}

export function deriveGameState(events: GameEvent[], rules: GameRules): GameState {
  const sorted = [...events].sort((a, b) => a.seq - b.seq);
  const undoneBy = resolveUndos(sorted);

  let clock = initialClock(rules);
  let open: OpenShift | undefined;
  let penalty: PenaltyState | undefined;
  let isFinalPeriodComplete = false;
  const shifts: Shift[] = [];
  const stats = Object.fromEntries(STAT_EVENTS.map((s) => [s, 0])) as Record<StatEvent, number>;
  const tags: string[] = [];
  const moments: GameEvent[] = [];

  const closeShift = (off: ClockStamp, offWall: number, closedBy: Shift["closedBy"]) => {
    if (!open) return;
    shifts.push({
      period: open.stamp.period,
      onSeq: open.seq,
      on: open.stamp,
      onWall: open.wallTime,
      off,
      offWall,
      clockSec: clockElapsed(open.stamp, off, rules.periodLengthSec),
      realSec: Math.max(0, (offWall - open.wallTime) / 1000),
      closedBy,
    });
    open = undefined;
  };

  for (const e of sorted) {
    if (e.type === "undo" || undoneBy.has(e.seq)) continue;
    switch (e.type) {
      case "clock_start":
        if (isFinalPeriodComplete) break;
        clock = { period: e.clock.period, secRemaining: e.clock.secRemaining, running: true, anchorWallTime: e.wallTime };
        break;
      case "clock_pause":
        clock = { ...clock, period: e.clock.period, secRemaining: e.clock.secRemaining, running: false };
        break;
      case "clock_set":
        clock = { ...clock, period: e.clock.period, secRemaining: e.clock.secRemaining, anchorWallTime: e.wallTime };
        isFinalPeriodComplete = false;
        break;
      case "period_end":
        closeShift({ period: e.clock.period, secRemaining: 0 }, e.wallTime, "period_end");
        if (e.clock.period >= rules.periodCount) {
          clock = { period: e.clock.period, secRemaining: 0, running: false, anchorWallTime: e.wallTime };
          isFinalPeriodComplete = true;
        } else {
          clock = { period: e.clock.period + 1, secRemaining: rules.periodLengthSec, running: false, anchorWallTime: e.wallTime };
        }
        break;
      case "shift_on":
        if (!open) {
          open = { seq: e.seq, stamp: e.clock, wallTime: e.wallTime };
          penalty = undefined;
        }
        break;
      case "shift_off":
        closeShift(e.clock, e.wallTime, "shift_off");
        break;
      case "penalty": {
        stats.penalty += 1;
        const minutes = e.payload?.minutes ?? 0;
        if (minutes > 0) {
          closeShift(e.clock, e.wallTime, "penalty");
          penalty = { seq: e.seq, startedAt: e.clock, minutes };
        }
        break;
      }
      case "tag":
        if (e.payload?.label) tags.push(e.payload.label);
        break;
      case "moment":
        moments.push(e);
        break;
      default:
        if (isStatEvent(e.type)) stats[e.type] += 1;
    }
  }

  const periodCount = Math.max(rules.periodCount, ...shifts.map((s) => s.period));
  const byPeriod: PeriodTime[] = Array.from({ length: periodCount }, () => ({ clockSec: 0, realSec: 0 }));
  for (const s of shifts) {
    byPeriod[s.period - 1].clockSec += s.clockSec;
    byPeriod[s.period - 1].realSec += s.realSec;
  }
  const clockSec = shifts.reduce((a, s) => a + s.clockSec, 0);
  const realSec = shifts.reduce((a, s) => a + s.realSec, 0);

  const timeline: TimelineEntry[] = sorted
    .filter((e) => e.type !== "undo")
    .map((e) => ({ event: e, undone: undoneBy.has(e.seq), undoneBy: undoneBy.get(e.seq) }));

  const lastUndoable = [...sorted].reverse().find((e) => isUndoable(e.type) && !undoneBy.has(e.seq));

  return {
    clock,
    shift: open ? { on: true, startedAt: open } : { on: false },
    iceTime: { clockSec, realSec, byPeriod },
    shifts: {
      count: shifts.length,
      avgClockSec: shifts.length ? clockSec / shifts.length : 0,
      longestClockSec: shifts.reduce((m, s) => Math.max(m, s.clockSec), 0),
      list: shifts,
    },
    stats,
    tags,
    moments,
    penalty,
    timeline,
    lastUndoable,
    isFinalPeriodComplete,
  };
}
