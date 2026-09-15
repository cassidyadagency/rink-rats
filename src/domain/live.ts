import { clockElapsed, stampAt } from "./clock";
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
