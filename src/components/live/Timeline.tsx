"use client";
import { useState } from "react";
import { EVENT_LABELS } from "@/domain/events";
import { formatClock } from "@/domain/clock";
import type { TimelineEntry } from "@/domain/reducer";
import type { RosterEntry } from "@/db/schema";
import { AnnotateSheet } from "./AnnotateSheet";

const ANNOTATABLE = new Set(["moment", "goal", "assist"]);

function describeEvent(e: TimelineEntry["event"]): string {
  const bits = [EVENT_LABELS[e.type]];
  if (e.payload?.label) bits.push(e.payload.label);
  if (e.payload?.minutes) bits.push(`${e.payload.minutes} min`);
  if (e.payload?.teammate) bits.push(`w/ ${e.payload.teammate}`);
  if (e.payload?.note) bits.push(`— ${e.payload.note}`);
  return bits.join(" ");
}

export function Timeline({ entries, roster, limit, onDelete, onRestore, onAnnotate }: {
  entries: TimelineEntry[]; roster: RosterEntry[]; limit?: number;
  onDelete: (seq: number) => void; onRestore: (undoSeq: number) => void;
  onAnnotate: (eventId: string, patch: { note?: string; teammate?: string }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<TimelineEntry | undefined>();
  const newestFirst = [...entries].reverse();
  const shown = limit && !expanded ? newestFirst.slice(0, limit) : newestFirst;
  return (
    <div className="px-4">
      <ul className="divide-y divide-slate-800">
        {shown.map(({ event, undone, undoneBy }) => (
          <li key={event.seq} className={`flex items-center gap-2 py-2 ${undone ? "text-slate-500 line-through" : ""}`}>
            <span className="w-20 shrink-0 font-mono text-sm tabular-nums">P{event.clock.period} {formatClock(event.clock.secRemaining)}</span>
            <span className="flex-1 truncate">{describeEvent(event)}</span>
            {!undone && ANNOTATABLE.has(event.type) && (
              <button className="px-2 text-sky-400" onClick={() => setEditing({ event, undone, undoneBy })}>Note</button>
            )}
            {undone && undoneBy !== undefined
              ? <button className="px-2 text-emerald-400 no-underline" onClick={() => onRestore(undoneBy)}>Restore</button>
              : <button className="px-2 text-rose-400" onClick={() => onDelete(event.seq)}>Delete</button>}
          </li>
        ))}
        {entries.length === 0 && <li className="py-2 text-slate-500">Nothing yet.</li>}
      </ul>
      {limit && entries.length > limit && (
        <button className="w-full py-2 text-slate-400" onClick={() => setExpanded((x) => !x)}>
          {expanded ? "Show less" : `Show all (${entries.length})`}
        </button>
      )}
      <AnnotateSheet open={!!editing} entry={editing} roster={roster} onClose={() => setEditing(undefined)}
        onSave={(patch) => { if (editing) onAnnotate(editing.event.id, patch); }} />
    </div>
  );
}
