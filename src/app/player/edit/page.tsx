"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { AppHeader } from "@/components/AppHeader";
import { QueryGate } from "@/components/QueryGate";
import { PlayerForm } from "@/components/PlayerForm";

function EditInner() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const player = useLiveQuery(() => db.players.get(id), [id]);
  if (!player) return <div className="p-6 text-slate-400">Player not found.</div>;
  return (
    <main className="safe-b">
      <AppHeader title="Edit player" back="/settings" />
      <PlayerForm initial={player} onSaved={() => router.back()} />
    </main>
  );
}

export default function EditPlayerPage() {
  return <QueryGate><EditInner /></QueryGate>;
}
