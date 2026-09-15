import { describe, it, expect } from "vitest";
import { deriveGameState } from "./reducer";
import { summarize } from "./postgame";
import type { EventPayload, EventType, GameEvent } from "./events";

let seq = 0;
function ev(type: EventType, period: number, sec: number, wall: number, payload?: EventPayload): GameEvent {
  seq += 1;
  return { id: `e${seq}`, gameId: "g", seq, wallTime: wall * 1000, clock: { period, secRemaining: sec }, type, payload };
}

describe("summarize", () => {
  it("matches a hand-built log", () => {
    seq = 0;
    const s = deriveGameState([
      ev("shift_on", 1, 900, 0), ev("shift_off", 1, 840, 60),
      ev("goal", 1, 850, 50), ev("shot", 1, 850, 50), ev("shot", 1, 700, 200),
      ev("tag", 1, 600, 300, { label: "Hustle" }), ev("tag", 1, 500, 400, { label: "Hustle" }), ev("tag", 1, 450, 450, { label: "Great pass" }),
      ev("moment", 2, 700, 1000, { note: "Nice rush" }),
      ev("period_end", 1, 0, 900), ev("shift_on", 2, 800, 1100), ev("shift_off", 2, 770, 1130),
    ], { periodCount: 3, periodLengthSec: 900 });
    expect(summarize(s)).toEqual({
      iceTimeClockSec: 90,
      iceTimeRealSec: 90,
      byPeriodClockSec: [60, 30, 0],
      shiftCount: 2,
      avgShiftSec: 45,
      longestShiftSec: 60,
      stats: { goal: 1, assist: 0, shot: 2, penalty: 0, save: 0, goal_against: 0 },
      tagCounts: [{ label: "Hustle", count: 2 }, { label: "Great pass", count: 1 }],
      moments: [{ seq: 9, period: 2, secRemaining: 700, note: "Nice rush" }],
    });
  });
});
