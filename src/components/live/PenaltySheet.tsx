"use client";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";

export function PenaltySheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (minutes: number) => void }) {
  const pick = (m: number) => { onPick(m); onClose(); };
  return (
    <Sheet open={open} onClose={onClose} title="Penalty minutes">
      <div className="grid grid-cols-2 gap-2">
        {[2, 4, 5, 10].map((m) => <Button key={m} size="lg" onClick={() => pick(m)}>{m} min</Button>)}
        <Button size="lg" variant="ghost" className="col-span-2" onClick={() => pick(0)}>No time (just count it)</Button>
      </div>
    </Sheet>
  );
}
