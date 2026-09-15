"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { AppHeader } from "@/components/AppHeader";
import { playerName } from "@/lib/format";

export default function Home() {
  const players = useLiveQuery(
    () => db.players.toArray().then((list) => list.sort((a, b) => a.createdAt - b.createdAt)),
    []
  );
  const teams = useLiveQuery(() => db.teams.toArray(), []);
  const teamName = (id: string) => teams?.find((t) => t.id === id)?.name ?? "";
  if (!players) return null;
  return (
    <main className="safe-b">
      <AppHeader title="Rink Rats" right={<Link href="/settings" aria-label="Settings" className="text-2xl">⚙︎</Link>} />
      {players.length === 0 ? (
        <div className="p-6 text-center">
          <p className="mb-6 text-slate-400">Set up your player once, then track every game in one tap.</p>
          <Link href="/player/new" className="inline-block rounded-2xl bg-sky-500 px-6 py-4 text-lg font-semibold">Add your player</Link>
        </div>
      ) : (
        <ul className="space-y-3 p-4">
          {players.map((p) => (
            <li key={p.id}>
              <Link href={`/player?id=${p.id}`} className="block rounded-2xl bg-slate-900 p-4 active:bg-slate-800">
                <div className="text-xl font-bold">{playerName(p)}</div>
                <div className="text-slate-400">{teamName(p.teamId)}</div>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/player/new" className="block rounded-2xl border border-dashed border-slate-700 p-4 text-center text-slate-400">+ Add another player</Link>
          </li>
        </ul>
      )}
    </main>
  );
}
