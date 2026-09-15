"use client";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import type { TimelineEntry } from "@/domain/reducer";
import type { RosterEntry } from "@/db/schema";

/**
 * Owns the note/teammate state, initialized fresh from props each time it
 * mounts. Sheet unmounts its children while closed, and AnnotateSheet keys
 * this component on the entry's event id, so reopening (or switching to a
 * different entry) always starts from that entry's current annotation
 * instead of stale local state — without setState-in-effect.
 */
function AnnotateForm({ entry, roster, onClose, onSave }: {
  entry: TimelineEntry; roster: RosterEntry[]; onClose: () => void;
  onSave: (patch: { note?: string; teammate?: string }) => void;
}) {
  const [note, setNote] = useState(entry.event.payload?.note ?? "");
  const [teammate, setTeammate] = useState<string | undefined>(entry.event.payload?.teammate);
  const isGoalOrAssist = entry.event.type === "goal" || entry.event.type === "assist";
  return (
    <>
      {isGoalOrAssist && roster.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {roster.map((r) => (
            <button key={`${r.jersey}-${r.name}`} onClick={() => setTeammate(teammate === r.name ? undefined : r.name)}
              className={`rounded-full px-4 py-2 ${teammate === r.name ? "bg-sky-500" : "bg-slate-800"}`}>#{r.jersey} {r.name}</button>
          ))}
        </div>
      )}
      <textarea className="mb-3 w-full rounded-xl bg-slate-800 p-3 text-lg" rows={3} placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button variant="primary" size="xl" onClick={() => { onSave({ note: note.trim() || undefined, teammate }); onClose(); }}>Save</Button>
    </>
  );
}

export function AnnotateSheet({ open, entry, roster, onClose, onSave }: {
  open: boolean; entry?: TimelineEntry; roster: RosterEntry[]; onClose: () => void;
  onSave: (patch: { note?: string; teammate?: string }) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={entry?.event.type === "moment" ? "What happened?" : "Add details"}>
      {entry && <AnnotateForm key={entry.event.id} entry={entry} roster={roster} onClose={onClose} onSave={onSave} />}
    </Sheet>
  );
}
