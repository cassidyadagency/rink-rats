import type { ClockStamp } from "./events";

export interface ClockState {
  period: number;
  secRemaining: number;
  running: boolean;
  /** wallTime at which secRemaining was true; meaningful only while running */
  anchorWallTime: number;
}

export function displaySeconds(clock: ClockState, now: number): number {
  if (!clock.running) return clock.secRemaining;
  return Math.min(clock.secRemaining, Math.max(0, clock.secRemaining - (now - clock.anchorWallTime) / 1000));
}

export function stampAt(clock: ClockState, now: number): ClockStamp {
  return { period: clock.period, secRemaining: displaySeconds(clock, now) };
}

export function clockElapsed(from: ClockStamp, to: ClockStamp, periodLengthSec: number): number {
  if (to.period < from.period) return 0;
  if (to.period === from.period) return Math.max(0, from.secRemaining - to.secRemaining);
  const fullPeriods = to.period - from.period - 1;
  return from.secRemaining + fullPeriods * periodLengthSec + (periodLengthSec - to.secRemaining);
}

function mmss(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatClock(sec: number): string {
  return mmss(Math.max(0, Math.ceil(sec)));
}

export function formatDuration(sec: number): string {
  return mmss(Math.max(0, Math.floor(sec)));
}
