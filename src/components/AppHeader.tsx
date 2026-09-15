import Link from "next/link";
import type { ReactNode } from "react";

export function AppHeader({ title, back, right }: { title: string; back?: string; right?: ReactNode }) {
  return (
    <header className="safe-t flex h-14 items-center gap-3 px-4">
      {back && <Link href={back} aria-label="Back" className="text-2xl">‹</Link>}
      <h1 className="flex-1 truncate text-xl font-bold">{title}</h1>
      {right}
    </header>
  );
}
