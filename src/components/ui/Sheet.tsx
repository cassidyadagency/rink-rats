"use client";
import type { ReactNode } from "react";

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/60" onClick={onClose}>
      <div role="dialog" aria-label={title} className="safe-b w-full rounded-t-3xl bg-slate-900 p-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-lg font-bold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
