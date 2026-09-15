"use client";
import { useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, TEAM_DEFAULTS, type Player } from "@/db/schema";
import type { Position } from "@/domain/events";
import * as repo from "@/db/repo";
import { Button } from "@/components/ui/Button";

const field = "w-full rounded-xl bg-slate-800 px-3 py-3 text-lg";

export function PlayerForm({ initial, onSaved }: { initial?: Player; onSaved: (p: Player) => void }) {
  const teams = useLiveQuery(() => db.teams.toArray(), []) ?? [];
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [jersey, setJersey] = useState(initial?.jersey?.toString() ?? "");
  const [position, setPosition] = useState<Position>(initial?.position ?? "F");
  const [teamId, setTeamId] = useState(initial?.teamId ?? "new");
  const [newTeam, setNewTeam] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    let tid = teamId;
    if (tid === "new") {
      const t = await repo.createTeam({ name: newTeam.trim() || "My team", season: "", roster: [], ...TEAM_DEFAULTS });
      tid = t.id;
    }
    const data = { firstName: firstName.trim(), lastName: lastName.trim(), jersey: Number(jersey) || 0, position, teamId: tid };
    if (initial) {
      await repo.updatePlayer(initial.id, data);
      onSaved({ ...initial, ...data });
    } else {
      onSaved(await repo.createPlayer(data));
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 p-4">
      <input className={field} placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      <input className={field} placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      <input className={field} placeholder="Jersey #" inputMode="numeric" value={jersey} onChange={(e) => setJersey(e.target.value)} required />
      <div className="grid grid-cols-3 gap-2">
        {(["F", "D", "G"] as Position[]).map((p) => (
          <Button key={p} type="button" variant={position === p ? "primary" : "secondary"} onClick={() => setPosition(p)}>
            {p === "F" ? "Forward" : p === "D" ? "Defense" : "Goalie"}
          </Button>
        ))}
      </div>
      <select className={field} value={teamId} onChange={(e) => setTeamId(e.target.value)} aria-label="Team">
        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        <option value="new">New team…</option>
      </select>
      {teamId === "new" && <input className={field} placeholder="Team name" value={newTeam} onChange={(e) => setNewTeam(e.target.value)} />}
      <Button type="submit" variant="primary" size="xl" disabled={saving}>{initial ? "Save" : "Add player"}</Button>
    </form>
  );
}
