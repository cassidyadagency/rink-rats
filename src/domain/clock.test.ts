import { describe, it, expect } from "vitest";
import { displaySeconds, clockElapsed, formatClock, formatDuration, type ClockState } from "./clock";

const running: ClockState = { period: 1, secRemaining: 600, running: true, anchorWallTime: 10_000 };
const paused: ClockState = { period: 1, secRemaining: 600, running: false, anchorWallTime: 10_000 };

describe("displaySeconds", () => {
  it("returns secRemaining when paused regardless of now", () => {
    expect(displaySeconds(paused, 99_999)).toBe(600);
  });
  it("counts down from the anchor while running", () => {
    expect(displaySeconds(running, 10_000)).toBe(600);
    expect(displaySeconds(running, 25_000)).toBe(585);
  });
  it("never goes below zero", () => {
    expect(displaySeconds(running, 10_000 + 700_000)).toBe(0);
  });
});

describe("clockElapsed", () => {
  it("is the difference within a period", () => {
    expect(clockElapsed({ period: 2, secRemaining: 500 }, { period: 2, secRemaining: 440 }, 900)).toBe(60);
  });
  it("spans period boundaries", () => {
    // 30s left in P1, then 900s of P2, then 100s into P3
    expect(clockElapsed({ period: 1, secRemaining: 30 }, { period: 3, secRemaining: 800 }, 900)).toBe(30 + 900 + 100);
  });
  it("is zero when to is before from", () => {
    expect(clockElapsed({ period: 1, secRemaining: 100 }, { period: 1, secRemaining: 200 }, 900)).toBe(0);
  });
});

describe("formatting", () => {
  it("formatClock rounds up", () => {
    expect(formatClock(0.4)).toBe("0:01");
    expect(formatClock(754)).toBe("12:34");
    expect(formatClock(0)).toBe("0:00");
  });
  it("formatDuration rounds down", () => {
    expect(formatDuration(59.9)).toBe("0:59");
    expect(formatDuration(378)).toBe("6:18");
  });
});
