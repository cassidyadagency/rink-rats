"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_SETTINGS, DEFAULT_TAGS } from "@/db/schema";
import * as repo from "@/db/repo";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { playerName } from "@/lib/format";
import { backupFilename, parseBackup, shareOrDownload } from "@/lib/backup";

export default function SettingsPage() {
  const toast = useToast();
  const players = useLiveQuery(() => db.players.toArray(), []) ?? [];
  const teams = useLiveQuery(() => db.teams.toArray(), []) ?? [];
  const settings = useLiveQuery(() => db.settings.get("app").then((x) => x ?? DEFAULT_SETTINGS), []);
  const [newTag, setNewTag] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function exportData() {
    try {
      const backup = await repo.exportAll();
      const file = new File([JSON.stringify(backup, null, 2)], backupFilename(), { type: "application/json" });
      toast.show((await shareOrDownload(file)) === "shared" ? "Shared" : "Downloaded");
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return;
      toast.show("Couldn't export");
    }
  }
  async function importData(file: File) {
    try {
      const counts = await repo.importAll(parseBackup(await file.text()));
      toast.show(`Imported ${counts.games} games`);
    } catch (e) {
      toast.show((e as Error).message);
    }
  }
  async function deletePlayer(id: string, name: string) {
    if (!confirm(`Delete ${name} and all their games?`)) return;
    try {
      await repo.deletePlayer(id);
    } catch {
      toast.show("Couldn't delete");
    }
  }
  async function addTag() {
    const label = newTag.trim();
    if (!label || !settings) return;
    await repo.updateSettings({ customTags: [...settings.customTags, label] });
    setNewTag("");
  }

  if (!settings) return null;
  return (
    <main className="safe-b space-y-6 pb-8">
      <AppHeader title="Settings" back="/" />

      <section className="px-4">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-400">Players</h2>
        <ul className="divide-y divide-slate-800 rounded-2xl bg-slate-900">
          {players.map((p) => (
            <li key={p.id} className="flex items-center justify-between p-3">
              <Link href={`/player/edit?id=${p.id}`} className="font-semibold">{playerName(p)}</Link>
              <button className="px-3 text-rose-400" onClick={() => deletePlayer(p.id, playerName(p))}>Delete</button>
            </li>
          ))}
        </ul>
        <Link href="/player/new" className="mt-2 block text-sky-400">+ Add player</Link>
      </section>

      <section className="px-4">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-400">Teams</h2>
        <ul className="divide-y divide-slate-800 rounded-2xl bg-slate-900">
          {teams.map((t) => (
            <li key={t.id} className="p-3"><Link href={`/team?id=${t.id}`} className="font-semibold">{t.name}</Link> <span className="text-slate-500">{t.periodCount} × {t.periodLengthSec / 60} min</span></li>
          ))}
        </ul>
      </section>

      <section className="px-4">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-400">Tracking</h2>
        <label className="flex items-center gap-3 rounded-2xl bg-slate-900 p-3 text-lg">
          <input type="checkbox" className="h-6 w-6" checked={settings.showRealTime} onChange={(e) => repo.updateSettings({ showRealTime: e.target.checked })} />
          Show real elapsed time alongside clock time
        </label>
        <div className="mt-3 rounded-2xl bg-slate-900 p-3">
          <div className="mb-2 text-slate-400">Tags: {[...DEFAULT_TAGS, ...settings.customTags].join(" · ")}</div>
          <div className="flex gap-2">
            <input className="flex-1 rounded-xl bg-slate-800 px-3 py-2" placeholder="Custom tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
            <Button type="button" onClick={addTag}>Add</Button>
          </div>
        </div>
      </section>

      <section className="space-y-2 px-4">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-400">Backup</h2>
        <Button size="xl" onClick={exportData}>Export all data (JSON)</Button>
        <Button size="xl" onClick={() => fileInput.current?.click()}>Import backup</Button>
        <input ref={fileInput} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
      </section>
    </main>
  );
}
