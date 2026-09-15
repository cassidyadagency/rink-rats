"use client";
import { useState } from "react";
import type { RosterEntry, Team } from "@/db/schema";
import type { Position } from "@/domain/events";
import * as repo from "@/db/repo";
import { Button } from "@/components/ui/Button";

export function RosterEditor({ team }: { team: Team }) {
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const [position, setPosition] = useState<Position>("F");

  async function add() {
    if (!name.trim()) return;
    const entry: RosterEntry = { name: name.trim(), jersey: Number(jersey) || 0, position };
    await repo.updateTeam(team.id, { roster: [...team.roster, entry].sort((a, b) => a.jersey - b.jersey) });
    setName(""); setJersey("");
  }
  async function remove(i: number) {
    await repo.updateTeam(team.id, { roster: team.roster.filter((_, idx) => idx !== i) });
  }

  return (
    <section className="p-4">
      <h2 className="mb-2 text-sm font-semibold uppercase text-slate-400">Roster (optional)</h2>
      <ul className="mb-3 divide-y divide-slate-800">
        {team.roster.map((r, i) => (
          <li key={`${r.jersey}-${r.name}`} className="flex items-center justify-between py-2">
            <span>#{r.jersey} {r.name} <span className="text-slate-500">{r.position}</span></span>
            <button aria-label={`Remove ${r.name}`} className="px-3 text-rose-400" onClick={() => remove(i)}>✕</button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input className="w-16 rounded-xl bg-slate-800 px-2 py-3" placeholder="#" inputMode="numeric" value={jersey} onChange={(e) => setJersey(e.target.value)} />
        <input className="flex-1 rounded-xl bg-slate-800 px-3 py-3" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="rounded-xl bg-slate-800 px-2" value={position} onChange={(e) => setPosition(e.target.value as Position)} aria-label="Position">
          <option>F</option><option>D</option><option>G</option>
        </select>
        <Button type="button" variant="primary" onClick={add}>Add</Button>
      </div>
    </section>
  );
}
