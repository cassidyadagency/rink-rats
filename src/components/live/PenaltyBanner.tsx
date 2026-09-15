"use client";
import { formatClock } from "@/domain/clock";

export function PenaltyBanner({ remainingSec, onBackOnIce }: { remainingSec: number | undefined; onBackOnIce: () => void }) {
  if (remainingSec === undefined) return null;
  if (remainingSec > 0) {
    return <div className="mx-4 rounded-xl bg-rose-900/60 px-4 py-2 text-center font-semibold text-rose-200">In the box · {formatClock(remainingSec)}</div>;
  }
  return (
    <div className="mx-4 flex items-center justify-between rounded-xl bg-emerald-900/60 px-4 py-2 font-semibold text-emerald-200">
      <span>Penalty over</span>
      <button onClick={onBackOnIce} className="rounded-lg bg-emerald-500 px-4 py-2 text-black">Back on ice</button>
    </div>
  );
}
