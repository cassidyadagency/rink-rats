"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { AppHeader } from "@/components/AppHeader";
import { QueryGate } from "@/components/QueryGate";
import { TeamForm } from "@/components/TeamForm";
import { RosterEditor } from "@/components/RosterEditor";

function TeamInner() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const team = useLiveQuery(() => db.teams.get(id), [id]);
  if (!team) return <div className="p-6 text-slate-400">Team not found.</div>;
  return (
    <main className="safe-b">
      <AppHeader title={team.name} back="/" />
      <TeamForm team={team} onSaved={() => router.back()} />
      <RosterEditor team={team} />
    </main>
  );
}

export default function TeamPage() {
  return <QueryGate><TeamInner /></QueryGate>;
}
