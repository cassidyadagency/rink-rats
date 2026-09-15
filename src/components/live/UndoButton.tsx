"use client";
import { EVENT_LABELS, type GameEvent } from "@/domain/events";
import { formatClock } from "@/domain/clock";

export function UndoButton({ last, onUndo }: { last?: GameEvent; onUndo: () => void }) {
  return (
    <div className="px-4">
      <button disabled={!last} onClick={onUndo} className="h-14 w-full rounded-2xl bg-slate-900 text-lg font-semibold text-rose-300 disabled:opacity-40">
        ↶ Undo {last ? `${EVENT_LABELS[last.type]} (P${last.clock.period} ${formatClock(last.clock.secRemaining)})` : ""}
      </button>
    </div>
  );
}
