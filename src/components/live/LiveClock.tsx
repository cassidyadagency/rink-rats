"use client";
import { displaySeconds, formatClock, type ClockState } from "@/domain/clock";

export function LiveClock({ clock, now, opponent, onTap }: { clock: ClockState; now: number; opponent: string; onTap: () => void }) {
  return (
    <button aria-label="Correct clock" onClick={onTap} className="flex w-full items-baseline justify-between px-4 py-2 text-left">
      <span className="text-lg font-semibold text-slate-400">P{clock.period}</span>
      <span className={`font-mono text-5xl font-bold tabular-nums ${clock.running ? "text-white" : "text-slate-400"}`}>{formatClock(displaySeconds(clock, now))}</span>
      <span className="max-w-[30%] truncate text-lg text-slate-400">vs {opponent}</span>
    </button>
  );
}
