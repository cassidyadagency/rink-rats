import { formatClock, formatDuration } from "@/domain/clock";
import { EVENT_LABELS, STAT_EVENTS } from "@/domain/events";
import type { PostgameSummary } from "@/domain/postgame";

const PLURAL: Record<string, string> = { goal: "Goals", assist: "Assists", shot: "Shots", penalty: "Penalties", save: "Saves", goal_against: "Goals Agn" };

export function PostgameCard({ playerLabel, teamName, opponent, date, summary, note, showRealTime }: {
  playerLabel: string; teamName: string; opponent: string; date: string; summary: PostgameSummary;
  note?: string; showRealTime: boolean;
}) {
  const stats = STAT_EVENTS.filter((s) => summary.stats[s] > 0);
  const maxPeriod = Math.max(1, ...summary.byPeriodClockSec);
  return (
    <div data-testid="postgame-card" className="w-[360px] rounded-3xl bg-slate-900 p-5 text-slate-50">
      <div className="text-2xl font-black">{playerLabel}</div>
      <div className="text-slate-400">{teamName} vs {opponent} · {date}</div>

      <div className="mt-4 flex items-end gap-2">
        <span className="font-mono text-6xl font-bold tabular-nums">{formatDuration(summary.iceTimeClockSec)}</span>
        <span className="pb-2 text-slate-400">ice time{showRealTime && ` · ${formatDuration(summary.iceTimeRealSec)} real`}</span>
      </div>
      <div className="mt-1 text-slate-300">
        {summary.shiftCount} shifts · avg {formatDuration(summary.avgShiftSec)} · longest {formatDuration(summary.longestShiftSec)}
      </div>

      <div className="mt-4 space-y-1">
        {summary.byPeriodClockSec.map((sec, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-6 text-slate-400">P{i + 1}</span>
            <div className="h-3 flex-1 rounded bg-slate-800"><div className="h-3 rounded bg-sky-500" style={{ width: `${(sec / maxPeriod) * 100}%` }} /></div>
            <span className="w-12 text-right font-mono tabular-nums">{formatDuration(sec)}</span>
          </div>
        ))}
      </div>

      {stats.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3 text-lg font-semibold">
          {stats.map((s) => <span key={s}>{summary.stats[s]} {summary.stats[s] === 1 ? EVENT_LABELS[s] : PLURAL[s]}</span>)}
        </div>
      )}

      {summary.tagCounts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {summary.tagCounts.map((t) => <span key={t.label} className="rounded-full bg-slate-800 px-3 py-1 text-sm">★ {t.label}{t.count > 1 ? ` ×${t.count}` : ""}</span>)}
        </div>
      )}

      {summary.moments.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {summary.moments.map((m) => <li key={m.seq}>📍 P{m.period} {formatClock(m.secRemaining)} {m.note ?? ""}</li>)}
        </ul>
      )}

      {note && <p className="mt-4 border-t border-slate-800 pt-3 italic text-slate-300">{note}</p>}
      <div className="mt-4 text-right text-xs text-slate-600">Rink Rats</div>
    </div>
  );
}
