import { describe, it, expect } from "vitest";
import { deriveGameState, type GameRules } from "./reducer";
import { liveTotals, penaltyRemainingSec, shouldAutoEndPeriod } from "./live";
import type { EventPayload, EventType, GameEvent } from "./events";

const rules: GameRules = { periodCount: 3, periodLengthSec: 900 };
let seq = 0;
function ev(type: EventType, period: number, sec: number, wall: number, payload?: EventPayload): GameEvent {
  seq += 1;
  return { id: `e${seq}`, gameId: "g", seq, wallTime: wall * 1000, clock: { period, secRemaining: sec }, type, payload };
}

describe("liveTotals", () => {
  it("adds the open shift as of now, using the running clock", () => {
    seq = 0;
    const s = deriveGameState([
      ev("shift_on", 1, 900, 0), ev("shift_off", 1, 860, 40),      // 40s closed
      ev("clock_start", 1, 860, 100), ev("shift_on", 1, 850, 110),  // open at 850
    ], rules);
    const t = liveTotals(s, rules, 140_000); // clock now reads 860 - 40 = 820
    expect(t).toEqual({ currentShiftClockSec: 30, currentShiftRealSec: 30, totalClockSec: 70, totalRealSec: 70, shiftCount: 2 });
  });
  it("open shift does not accrue clock time while paused", () => {
    seq = 0;
    const s = deriveGameState([ev("shift_on", 1, 900, 0)], rules);
    const t = liveTotals(s, rules, 60_000);
    expect(t.currentShiftClockSec).toBe(0);
    expect(t.currentShiftRealSec).toBe(60);
  });
  it("with no open shift reports closed totals only", () => {
    seq = 0;
    const s = deriveGameState([ev("shift_on", 1, 900, 0), ev("shift_off", 1, 880, 20)], rules);
    expect(liveTotals(s, rules, 999_000)).toEqual({ currentShiftClockSec: 0, currentShiftRealSec: 0, totalClockSec: 20, totalRealSec: 20, shiftCount: 1 });
  });
});

describe("penaltyRemainingSec", () => {
  it("is undefined without a penalty", () => {
    seq = 0;
    expect(penaltyRemainingSec(deriveGameState([], rules), rules, 0)).toBeUndefined();
  });
  it("counts down on the game clock and clamps at zero", () => {
    seq = 0;
    const s = deriveGameState([ev("clock_start", 1, 900, 0), ev("penalty", 1, 880, 20, { minutes: 2 })], rules);
    expect(penaltyRemainingSec(s, rules, 50_000)).toBe(90);   // 30s served
    expect(penaltyRemainingSec(s, rules, 500_000)).toBe(0);
  });
  it("carries across a period boundary", () => {
    seq = 0;
    const s = deriveGameState([
      ev("clock_start", 1, 30, 0), ev("penalty", 1, 30, 0, { minutes: 2 }),
      ev("period_end", 1, 0, 30), ev("clock_start", 2, 900, 100),
    ], rules);
    expect(penaltyRemainingSec(s, rules, 110_000)).toBe(120 - 30 - 10);
  });
});

describe("shouldAutoEndPeriod", () => {
  it("fires at 0 when running", () => {
    seq = 0;
    const s = deriveGameState([ev("clock_start", 1, 5, 0)], rules);
    expect(shouldAutoEndPeriod(s, 5_000, 0)).toEqual({ fire: true, nextLastEnded: 1 });
  });
  it("doesn't re-fire for same period while display is 0", () => {
    seq = 0;
    const s = deriveGameState([ev("clock_start", 1, 5, 0)], rules);
    expect(shouldAutoEndPeriod(s, 5_000, 1)).toEqual({ fire: false, nextLastEnded: 1 });
  });
  it("re-arms after clock_set with time left", () => {
    seq = 0;
    const s = deriveGameState([ev("clock_start", 1, 5, 0), ev("clock_set", 1, 100, 5)], rules);
    expect(shouldAutoEndPeriod(s, 5_000, 1)).toEqual({ fire: false, nextLastEnded: 0 });
  });
});
