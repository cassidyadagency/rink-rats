import { clockElapsed, displaySeconds, stampAt } from "./clock";
import type { GameRules, GameState } from "./reducer";

export interface LiveTotals {
  currentShiftClockSec: number;
  currentShiftRealSec: number;
  totalClockSec: number;
  totalRealSec: number;
  shiftCount: number;
}

export function liveTotals(state: GameState, rules: GameRules, now: number): LiveTotals {
  const open = state.shift.startedAt;
  const currentShiftClockSec = open ? clockElapsed(open.stamp, stampAt(state.clock, now), rules.periodLengthSec) : 0;
  const currentShiftRealSec = open ? Math.max(0, (now - open.wallTime) / 1000) : 0;
  return {
    currentShiftClockSec,
    currentShiftRealSec,
    totalClockSec: state.iceTime.clockSec + currentShiftClockSec,
    totalRealSec: state.iceTime.realSec + currentShiftRealSec,
    shiftCount: state.shifts.count + (open ? 1 : 0),
  };
}

export function penaltyRemainingSec(state: GameState, rules: GameRules, now: number): number | undefined {
  if (!state.penalty) return undefined;
  const served = clockElapsed(state.penalty.startedAt, stampAt(state.clock, now), rules.periodLengthSec);
  return Math.max(0, state.penalty.minutes * 60 - served);
}

export interface AutoEndDecision {
  /** Whether the caller should invoke `endPeriod()` this tick. */
  fire: boolean;
  /** The value the caller's "last period auto-ended" guard should hold next. */
  nextLastEnded: number;
}

/**
 * Pure decision for the live page's auto period-end effect: given the
 * current clock, the wall-clock `now`, and the period the guard last fired
 * for (`lastEnded`), decides whether to call `endPeriod()` this tick and
 * what the guard should become.
 *
 * - Not running: no change, no fire.
 * - Running with time left: re-arms the guard (resets it to 0) so a
 *   `clock_set` back into a period with time remaining can auto-end again.
 * - Running at 0:00 for a period already recorded in `lastEnded`: no
 *   re-fire.
 * - Running at 0:00 for a new period: fire, and record that period.
 */
export function shouldAutoEndPeriod(state: GameState, now: number, lastEnded: number): AutoEndDecision {
  const { clock } = state;
  if (!clock.running) return { fire: false, nextLastEnded: lastEnded };
  if (displaySeconds(clock, now) > 0) return { fire: false, nextLastEnded: 0 };
  if (lastEnded === clock.period) return { fire: false, nextLastEnded: lastEnded };
  return { fire: true, nextLastEnded: clock.period };
}
