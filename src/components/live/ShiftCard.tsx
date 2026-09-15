"use client";
import { formatDuration } from "@/domain/clock";
import type { LiveTotals } from "@/domain/live";
import { useLongPress } from "@/hooks/useLongPress";

export function ShiftCard({ name, on, totals, showRealTime, onToggle, onLongPress }: {
  name: string; on: boolean; totals: LiveTotals; showRealTime: boolean; onToggle: () => void; onLongPress: () => void;
}) {
  const { fired: firedRef, handlers } = useLongPress(onLongPress);
  return (
    <div className="px-4">
      <button
        aria-pressed={on}
        {...handlers}
        onClick={() => { if (firedRef.current) { firedRef.current = false; return; } onToggle(); }}
        className={`w-full rounded-3xl p-5 text-left shadow-lg transition-colors ${on ? "bg-emerald-600" : "bg-slate-800"}`}
      >
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold">{name}</span>
          <span className={`text-lg font-black tracking-wide ${on ? "text-white" : "text-slate-400"}`}>{on ? "ON ICE" : "OFF ICE"}</span>
        </div>
        <div className="mt-2 font-mono text-xl tabular-nums">
          shift {formatDuration(totals.currentShiftClockSec)} · total {formatDuration(totals.totalClockSec)}
          {showRealTime && <span className="text-slate-300"> · real {formatDuration(totals.totalRealSec)}</span>}
        </div>
        <div className="text-slate-300">
          {totals.shiftCount} shifts · avg {formatDuration(totals.shiftCount ? totals.totalClockSec / totals.shiftCount : 0)}
        </div>
      </button>
    </div>
  );
}
