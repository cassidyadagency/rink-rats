"use client";
import { useState, type FormEvent } from "react";
import type { Team } from "@/db/schema";
import * as repo from "@/db/repo";
import { Button } from "@/components/ui/Button";

const field = "w-full rounded-xl bg-slate-800 px-3 py-3 text-lg";

export function TeamForm({ team, onSaved }: { team: Team; onSaved: () => void }) {
  const [name, setName] = useState(team.name);
  const [season, setSeason] = useState(team.season);
  const [periodCount, setPeriodCount] = useState(team.periodCount.toString());
  const [periodMin, setPeriodMin] = useState((team.periodLengthSec / 60).toString());
  const [stopTime, setStopTime] = useState(team.stopTime);

  async function submit(e: FormEvent) {
    e.preventDefault();
    await repo.updateTeam(team.id, {
      name: name.trim(), season: season.trim(),
      periodCount: Math.max(1, Number(periodCount) || 3),
      periodLengthSec: Math.max(60, Math.round((Number(periodMin) || 15) * 60)),
      stopTime,
    });
    onSaved();
  }

  return (
    <form onSubmit={submit} className="space-y-4 p-4">
      <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name" required />
      <input className={field} value={season} onChange={(e) => setSeason(e.target.value)} placeholder="Season (e.g. 2026-27)" />
      <label className="block text-slate-400">Periods
        <input className={field} inputMode="numeric" value={periodCount} onChange={(e) => setPeriodCount(e.target.value)} />
      </label>
      <label className="block text-slate-400">Period length (minutes)
        <input className={field} inputMode="decimal" value={periodMin} onChange={(e) => setPeriodMin(e.target.value)} />
      </label>
      <label className="flex items-center gap-3 text-lg">
        <input type="checkbox" className="h-6 w-6" checked={stopTime} onChange={(e) => setStopTime(e.target.checked)} />
        Stop time (clock pauses on whistles)
      </label>
      <Button type="submit" variant="primary" size="xl">Save team</Button>
    </form>
  );
}
