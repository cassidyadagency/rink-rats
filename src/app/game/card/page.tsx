"use client";
import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { toBlob } from "html-to-image";
import { db, DEFAULT_SETTINGS } from "@/db/schema";
import * as repo from "@/db/repo";
import { summarize } from "@/domain/postgame";
import { useLiveGame } from "@/hooks/useLiveGame";
import { useGameActions } from "@/hooks/useGameActions";
import { QueryGate } from "@/components/QueryGate";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { PostgameCard } from "@/components/PostgameCard";
import { Timeline } from "@/components/live/Timeline";
import { playerName } from "@/lib/format";
import { shareOrDownload } from "@/lib/backup";

function CardInner() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const toast = useToast();
  const { game, team, player, rules, state } = useLiveGame(id);
  const settings = useLiveQuery(() => db.settings.get("app").then((x) => x ?? DEFAULT_SETTINGS), []);
  const actions = useGameActions(id, state, rules?.periodLengthSec ?? 900);
  const [tab, setTab] = useState<"card" | "timeline">("card");
  const [note, setNote] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!game || !team || !player || !state || !settings) return null;
  const g = game;
  const summary = summarize(state);
  const currentNote = note ?? g.note ?? "";

  async function share() {
    if (!cardRef.current) return;
    try {
      const blob = await toBlob(cardRef.current, { pixelRatio: 2, backgroundColor: "#0f172a" });
      if (!blob) throw new Error("Could not render card");
      const file = new File([blob], `rink-rats-${g.date}-vs-${g.opponent.replace(/\s+/g, "-")}.png`, { type: "image/png" });
      toast.show((await shareOrDownload(file)) === "shared" ? "Shared" : "Saved");
    } catch (e) {
      toast.show((e as Error).message);
    }
  }

  return (
    <main className="safe-b pb-8">
      <AppHeader title={`vs ${g.opponent}`} back={`/player?id=${player.id}`} />
      <div className="mx-4 mb-4 grid grid-cols-2 rounded-xl bg-slate-900 p-1">
        {(["card", "timeline"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg py-2 font-semibold capitalize ${tab === t ? "bg-slate-700" : "text-slate-400"}`}>{t}</button>
        ))}
      </div>

      {tab === "card" ? (
        <div className="space-y-4 px-4">
          <div className="overflow-x-auto"><div ref={cardRef}>
            <PostgameCard playerLabel={playerName(player)} teamName={team.name} opponent={g.opponent} date={g.date}
              summary={summary} note={currentNote || undefined} showRealTime={settings.showRealTime} />
          </div></div>
          <textarea className="w-full rounded-xl bg-slate-800 p-3 text-lg" rows={2} placeholder="Parent note (shows on the card)"
            value={currentNote} onChange={(e) => setNote(e.target.value)} onBlur={() => repo.updateGame(id, { note: currentNote.trim() || undefined })} />
          <Button variant="primary" size="xl" onClick={share}>Share card</Button>
          <Button size="xl" onClick={() => router.push(`/player?id=${player.id}`)}>Done</Button>
        </div>
      ) : (
        <Timeline entries={state.timeline} roster={team.roster} onDelete={actions.undoSeq} onRestore={actions.undoSeq} onAnnotate={repo.annotateEvent} />
      )}
    </main>
  );
}

export default function CardPage() {
  return <QueryGate><CardInner /></QueryGate>;
}
