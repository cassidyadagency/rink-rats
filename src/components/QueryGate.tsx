"use client";
import { Suspense, type ReactNode } from "react";

export function QueryGate({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="p-6 text-slate-400">Loading…</div>}>{children}</Suspense>;
}
