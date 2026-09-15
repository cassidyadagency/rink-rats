"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { AppHeader } from "@/components/AppHeader";
import { QueryGate } from "@/components/QueryGate";
import { playerName } from "@/lib/format";

function PlayerInner() {
  const id = useSearchParams().get("id") ?? "";
  const player = useLiveQuery(() => db.players.get(id), [id]);
  const team = useLiveQuery(() => (player ? db.teams.get(player.teamId) : undefined), [player?.teamId]);
  const games = useLiveQuery(() => db.games.where("playerId").equals(id).reverse().sortBy("createdAt"), [id]) ?? [];
  if (!player) return <div className="p-6 text-slate-400">Player not found.</div>;
  const live = games.find((g) => g.status === "live");
  return (
    <main className="safe-b">
      <AppHeader title={playerName(player)} back="/" right={<Link href={`/team?id=${player.teamId}`} className="text-slate-400">{team?.name ?? "Team"}</Link>} />
      <div className="p-4">
        {live ? (
          <Link href={`/game/live?id=${live.id}`} className="block rounded-2xl bg-emerald-500 p-5 text-center text-xl font-bold">Resume game vs {live.opponent}</Link>
        ) : (
          <Link href={`/game/new?playerId=${player.id}`} className="block rounded-2xl bg-sky-500 p-5 text-center text-xl font-bold">New game</Link>
        )}
      </div>
      <h2 className="px-4 pt-2 text-sm font-semibold uppercase text-slate-400">Games</h2>
      <ul className="space-y-2 p-4">
        {games.filter((g) => g.status === "final").map((g) => (
          <li key={g.id}>
            <Link href={`/game/card?id=${g.id}`} className="flex justify-between rounded-2xl bg-slate-900 p-4">
              <span className="font-semibold">vs {g.opponent}</span>
              <span className="text-slate-400">{g.date}</span>
            </Link>
          </li>
        ))}
        {games.length === 0 && <li className="text-slate-500">No games yet.</li>}
      </ul>
    </main>
  );
}

export default function PlayerPage() {
  return <QueryGate><PlayerInner /></QueryGate>;
}
