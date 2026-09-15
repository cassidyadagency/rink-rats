import { describe, it, expect, beforeEach } from "vitest";
import { deriveGameState, type GameRules } from "./reducer";
import type { EventPayload, EventType, GameEvent } from "./events";

const rules: GameRules = { periodCount: 3, periodLengthSec: 900 };
let seq = 0;
beforeEach(() => { seq = 0; });

/** wall is in seconds for readability; stored as ms */
function ev(type: EventType, period: number, sec: number, wall: number, payload?: EventPayload): GameEvent {
  seq += 1;
  return { id: `e${seq}`, gameId: "g", seq, wallTime: wall * 1000, clock: { period, secRemaining: sec }, type, payload };
}

describe("initial state", () => {
  it("starts in period 1 at full length, paused, off ice", () => {
    const s = deriveGameState([], rules);
    expect(s.clock).toMatchObject({ period: 1, secRemaining: 900, running: false });
    expect(s.shift.on).toBe(false);
    expect(s.shifts.count).toBe(0);
    expect(s.iceTime.byPeriod).toHaveLength(3);
    expect(s.isFinalPeriodComplete).toBe(false);
  });
});

describe("clock events", () => {
  it("start sets running with anchor; pause stops at stamped time", () => {
    const s = deriveGameState([ev("clock_start", 1, 900, 0), ev("clock_pause", 1, 870, 30)], rules);
    expect(s.clock).toEqual({ period: 1, secRemaining: 870, running: false, anchorWallTime: 0 });
  });
  it("clock_set overrides period and time and re-anchors", () => {
    const s = deriveGameState([ev("clock_start", 1, 900, 0), ev("clock_set", 2, 500, 40)], rules);
    expect(s.clock).toEqual({ period: 2, secRemaining: 500, running: true, anchorWallTime: 40_000 });
  });
  it("period_end advances to the next period, paused at full length", () => {
    const s = deriveGameState([ev("period_end", 1, 0, 900)], rules);
    expect(s.clock).toMatchObject({ period: 2, secRemaining: 900, running: false });
  });
  it("final period_end completes the game and ignores further clock_start", () => {
    const s = deriveGameState([ev("period_end", 3, 0, 2700), ev("clock_start", 3, 0, 2710)], rules);
    expect(s.isFinalPeriodComplete).toBe(true);
    expect(s.clock.running).toBe(false);
  });
  it("ignores events out of order by sorting on seq", () => {
    const events = [ev("clock_start", 1, 900, 0), ev("clock_pause", 1, 870, 30)];
    const s = deriveGameState([events[1], events[0]], rules);
    expect(s.clock.running).toBe(false);
  });
});

describe("shifts", () => {
  it("clock time excludes a pause; real time includes it", () => {
    const s = deriveGameState([
      ev("clock_start", 1, 900, 0),
      ev("shift_on", 1, 900, 0),
      ev("clock_pause", 1, 870, 30),
      ev("clock_start", 1, 870, 50),
      ev("shift_off", 1, 840, 80),
    ], rules);
    expect(s.shifts.count).toBe(1);
    expect(s.shifts.list[0]).toMatchObject({ clockSec: 60, realSec: 80, closedBy: "shift_off", period: 1 });
    expect(s.iceTime).toMatchObject({ clockSec: 60, realSec: 80 });
    expect(s.iceTime.byPeriod[0]).toEqual({ clockSec: 60, realSec: 80 });
    expect(s.shift.on).toBe(false);
  });
  it("exposes an open shift", () => {
    const s = deriveGameState([ev("clock_start", 1, 900, 0), ev("shift_on", 1, 880, 20)], rules);
    expect(s.shift).toEqual({ on: true, startedAt: { seq: 2, stamp: { period: 1, secRemaining: 880 }, wallTime: 20_000 } });
    expect(s.shifts.count).toBe(0);
  });
  it("a shift open at period_end closes at 0:00 in that period", () => {
    const s = deriveGameState([ev("clock_start", 1, 20, 0), ev("shift_on", 1, 20, 0), ev("period_end", 1, 0, 20)], rules);
    expect(s.shifts.list[0]).toMatchObject({ clockSec: 20, realSec: 20, closedBy: "period_end", period: 1 });
    expect(s.shift.on).toBe(false);
  });
  it("back-dated shift_on yields the corrected duration", () => {
    const s = deriveGameState([ev("clock_start", 1, 900, 0), ev("shift_on", 1, 850, 100), ev("shift_off", 1, 800, 150)], rules);
    expect(s.shifts.list[0].clockSec).toBe(50);
  });
  it("clock_set mid-shift is reflected because stamps are authoritative", () => {
    const s = deriveGameState([
      ev("clock_start", 1, 800, 0),
      ev("shift_on", 1, 800, 0),
      ev("clock_set", 1, 750, 10),
      ev("shift_off", 1, 700, 60),
    ], rules);
    expect(s.shifts.list[0].clockSec).toBe(100);
  });
  it("computes count, average and longest", () => {
    const s = deriveGameState([
      ev("shift_on", 1, 900, 0), ev("shift_off", 1, 860, 40),
      ev("shift_on", 1, 800, 100), ev("shift_off", 1, 740, 160),
    ], rules);
    expect(s.shifts).toMatchObject({ count: 2, avgClockSec: 50, longestClockSec: 60 });
  });
  it("double shift_on is ignored; shift_off with no open shift is ignored", () => {
    const s = deriveGameState([ev("shift_off", 1, 900, 0), ev("shift_on", 1, 890, 10), ev("shift_on", 1, 880, 20)], rules);
    expect(s.shift.startedAt?.seq).toBe(2);
    expect(s.shifts.count).toBe(0);
  });
});

describe("penalty", () => {
  it("closes the open shift and records penalty state", () => {
    const s = deriveGameState([ev("shift_on", 1, 900, 0), ev("penalty", 1, 850, 50, { minutes: 2 })], rules);
    expect(s.shift.on).toBe(false);
    expect(s.shifts.list[0]).toMatchObject({ clockSec: 50, closedBy: "penalty" });
    expect(s.penalty).toEqual({ seq: 2, startedAt: { period: 1, secRemaining: 850 }, minutes: 2 });
    expect(s.stats.penalty).toBe(1);
  });
  it("shift_on clears the penalty", () => {
    const s = deriveGameState([ev("penalty", 1, 850, 50, { minutes: 2 }), ev("shift_on", 1, 730, 170)], rules);
    expect(s.penalty).toBeUndefined();
  });
  it("a zero-minute penalty is counted but does not start a countdown", () => {
    const s = deriveGameState([ev("penalty", 1, 850, 50, { minutes: 0 })], rules);
    expect(s.stats.penalty).toBe(1);
    expect(s.penalty).toBeUndefined();
  });
});

describe("undo", () => {
  it("undoing shift_on removes the shift; undoing that undo restores it", () => {
    const base = [ev("shift_on", 1, 900, 0), ev("shift_off", 1, 860, 40)];
    const undo1 = ev("undo", 1, 860, 41, { targetSeq: 1 });
    expect(deriveGameState([...base, undo1], rules).shifts.count).toBe(0);
    const undo2 = ev("undo", 1, 860, 42, { targetSeq: 3 });
    expect(deriveGameState([...base, undo1, undo2], rules).shifts.count).toBe(1);
  });
  it("undoing a penalty restores the shift it closed", () => {
    const s = deriveGameState([
      ev("shift_on", 1, 900, 0), ev("penalty", 1, 850, 50, { minutes: 2 }), ev("undo", 1, 850, 51, { targetSeq: 2 }),
    ], rules);
    expect(s.shift.on).toBe(true);
    expect(s.penalty).toBeUndefined();
    expect(s.stats.penalty).toBe(0);
  });
  it("ignores undo with a missing target and a second undo of the same target", () => {
    const s = deriveGameState([
      ev("shot", 1, 900, 0), ev("undo", 1, 900, 1, { targetSeq: 99 }),
      ev("undo", 1, 900, 2, { targetSeq: 1 }), ev("undo", 1, 900, 3, { targetSeq: 1 }),
    ], rules);
    expect(s.stats.shot).toBe(0);
    expect(s.timeline[0]).toMatchObject({ undone: true, undoneBy: 3 });
  });
  it("lastUndoable skips clock events and undone events", () => {
    const s = deriveGameState([
      ev("shot", 1, 900, 0), ev("goal", 1, 880, 20), ev("undo", 1, 880, 21, { targetSeq: 2 }), ev("clock_pause", 1, 870, 30),
    ], rules);
    expect(s.lastUndoable?.seq).toBe(1);
  });
});

describe("stats, tags, moments, timeline", () => {
  it("counts stat events, collects tags and moments", () => {
    const s = deriveGameState([
      ev("goal", 1, 800, 0), ev("assist", 1, 700, 0), ev("shot", 1, 600, 0), ev("shot", 1, 500, 0),
      ev("save", 1, 400, 0), ev("goal_against", 1, 300, 0),
      ev("tag", 1, 200, 0, { label: "Hustle" }), ev("moment", 1, 100, 0),
    ], rules);
    expect(s.stats).toEqual({ goal: 1, assist: 1, shot: 2, penalty: 0, save: 1, goal_against: 1 });
    expect(s.tags).toEqual(["Hustle"]);
    expect(s.moments.map((m) => m.seq)).toEqual([8]);
  });
  it("timeline lists non-undo events in order with undone flags", () => {
    const s = deriveGameState([ev("shot", 1, 900, 0), ev("undo", 1, 900, 1, { targetSeq: 1 }), ev("goal", 1, 800, 2)], rules);
    expect(s.timeline.map((t) => [t.event.seq, t.undone])).toEqual([[1, true], [3, false]]);
  });
  it("ignores unknown event types", () => {
    const bad = { ...ev("shot", 1, 900, 0), type: "faceoff" as EventType };
    expect(() => deriveGameState([bad], rules)).not.toThrow();
  });
  it("splits ice time by period", () => {
    const s = deriveGameState([
      ev("shift_on", 1, 100, 0), ev("shift_off", 1, 40, 60),
      ev("period_end", 1, 0, 100),
      ev("shift_on", 2, 900, 200), ev("shift_off", 2, 870, 230),
    ], rules);
    expect(s.iceTime.byPeriod.map((p) => p.clockSec)).toEqual([60, 30, 0]);
    expect(s.iceTime.clockSec).toBe(90);
  });
});
