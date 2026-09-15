"use client";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";

export function BackdateSheet({ open, on, onClose, onPick }: { open: boolean; on: boolean; onClose: () => void; onPick: (secAgo: number) => void }) {
  const pick = (s: number) => { onPick(s); onClose(); };
  return (
    <Sheet open={open} onClose={onClose} title={on ? "Went off…" : "Came on…"}>
      <div className="grid grid-cols-2 gap-2">
        {([[15, "15s ago"], [30, "30s ago"], [60, "1 min ago"], [120, "2 min ago"]] as const).map(([s, label]) => (
          <Button key={s} size="lg" onClick={() => pick(s)}>{label}</Button>
        ))}
      </div>
    </Sheet>
  );
}
