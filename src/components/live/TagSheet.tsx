"use client";
import { Sheet } from "@/components/ui/Sheet";

export function TagSheet({ open, tags, onClose, onPick }: { open: boolean; tags: string[]; onClose: () => void; onPick: (label: string) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Tag this moment">
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <button key={t} onClick={() => { onPick(t); onClose(); }} className="rounded-full bg-slate-800 px-5 py-3 text-lg font-semibold active:bg-sky-600">{t}</button>
        ))}
      </div>
    </Sheet>
  );
}
