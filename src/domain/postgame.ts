import type { StatEvent } from "./events";
import type { GameState } from "./reducer";

export interface PostgameSummary {
  iceTimeClockSec: number;
  iceTimeRealSec: number;
  byPeriodClockSec: number[];
  shiftCount: number;
  avgShiftSec: number;
  longestShiftSec: number;
  stats: Record<StatEvent, number>;
  tagCounts: { label: string; count: number }[];
  moments: { seq: number; period: number; secRemaining: number; note?: string }[];
}

export function summarize(state: GameState): PostgameSummary {
  const counts = new Map<string, number>();
  for (const t of state.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const tagCounts = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  return {
    iceTimeClockSec: state.iceTime.clockSec,
    iceTimeRealSec: state.iceTime.realSec,
    byPeriodClockSec: state.iceTime.byPeriod.map((p) => p.clockSec),
    shiftCount: state.shifts.count,
    avgShiftSec: state.shifts.avgClockSec,
    longestShiftSec: state.shifts.longestClockSec,
    stats: state.stats,
    tagCounts,
    moments: state.moments.map((m) => ({ seq: m.seq, period: m.clock.period, secRemaining: m.clock.secRemaining, note: m.payload?.note })),
  };
}
