"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_SETTINGS, DEFAULT_TAGS } from "@/db/schema";
import * as repo from "@/db/repo";
import type { EventType } from "@/domain/events";
import { displaySeconds } from "@/domain/clock";
import { liveTotals, penaltyRemainingSec } from "@/domain/live";
import { useLiveGame } from "@/hooks/useLiveGame";
import { useGameActions } from "@/hooks/useGameActions";
import { useNow } from "@/hooks/useNow";
import { useWakeLock } from "@/hooks/useWakeLock";
import { QueryGate } from "@/components/QueryGate";
import { LiveClock } from "@/components/live/LiveClock";
import { PlayPauseButton } from "@/components/live/PlayPauseButton";
import { ClockSetSheet } from "@/components/live/ClockSetSheet";
import { ShiftCard } from "@/components/live/ShiftCard";
import { EventGrid } from "@/components/live/EventGrid";
import { TagSheet } from "@/components/live/TagSheet";
import { PenaltySheet } from "@/components/live/PenaltySheet";
import { BackdateSheet } from "@/components/live/BackdateSheet";
import { UndoButton } from "@/components/live/UndoButton";
import { Timeline } from "@/components/live/Timeline";
import { PenaltyBanner } from "@/components/live/PenaltyBanner";
import { playerName } from "@/lib/format";

function LiveInner() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const { game, team, player, rules, state, loading } = useLiveGame(id);
  const settings = useLiveQuery(() => db.settings.get("app").then((x) => x ?? DEFAULT_SETTINGS), []);
  const actions = useGameActions(id, state, rules?.periodLengthSec ?? 900);
  const active = !!state && (state.clock.running || state.shift.on || !!state.penalty);
  const now = useNow(active);
  useWakeLock(true);

  const [sheet, setSheet] = useState<"clock" | "tag" | "penalty" | "backdate" | null>(null);
  const endedPeriod = useRef(0);

  useEffect(() => { if (game?.status === "final") router.replace(`/game/card?id=${id}`); }, [game?.status, id, router]);

  // Auto period end when the running clock reaches 0:00. `endPeriod` is
  // destructured out of `actions` (a fresh object every render) so the
  // effect's deps stay referentially stable and this doesn't re-fire every
  // tick; the endedPeriod ref still guards against calling it twice for the
  // same period.
  const { endPeriod } = actions;
  useEffect(() => {
    if (!state || !state.clock.running) return;
    if (displaySeconds(state.clock, now) > 0) return;
    if (endedPeriod.current === state.clock.period) return;
    endedPeriod.current = state.clock.period;
    endPeriod();
  }, [state, now, endPeriod]);

  if (loading || !game || !team || !player || !rules || !state || !settings) return null;

  const totals = liveTotals(state, rules, now);
  const penaltyLeft = penaltyRemainingSec(state, rules, now);
  const tags = [...DEFAULT_TAGS, ...settings.customTags];

  const onEvent = (type: EventType) => {
    if (type === "penalty") setSheet("penalty");
    else if (type === "tag") setSheet("tag");
    else actions.record(type);
  };

  async function endGame() {
    if (!confirm("End game and build the postgame card?")) return;
    if (state!.clock.running) await actions.pause();
    await repo.updateGame(id, { status: "final", finalizedAt: Date.now() });
    router.replace(`/game/card?id=${id}`);
  }

  return (
    <main className="safe-b safe-t flex min-h-dvh flex-col gap-3 pb-6">
      <div className="flex items-center justify-between px-4">
        <button onClick={() => router.push(`/player?id=${player.id}`)} className="text-slate-400">‹ Back</button>
        <button onClick={endGame} className="text-rose-300">End game</button>
      </div>
      <LiveClock clock={state.clock} now={now} opponent={game.opponent} onTap={() => setSheet("clock")} />
      <PlayPauseButton running={state.clock.running} disabled={state.isFinalPeriodComplete} stopTime={team.stopTime} onPlay={actions.play} onPause={actions.pause} />
      <PenaltyBanner remainingSec={penaltyLeft} onBackOnIce={actions.toggleShift} />
      <ShiftCard name={playerName(player)} on={state.shift.on} totals={totals} showRealTime={settings.showRealTime}
        onToggle={actions.toggleShift} onLongPress={() => setSheet("backdate")} />
      <EventGrid visibleEvents={game.settings.visibleEvents} position={player.position} onEvent={onEvent} />
      <UndoButton last={state.lastUndoable} onUndo={actions.undoLast} />
      <Timeline entries={state.timeline} roster={team.roster} limit={3}
        onDelete={actions.undoSeq} onRestore={actions.undoSeq} onAnnotate={repo.annotateEvent} />

      <ClockSetSheet open={sheet === "clock"} initialPeriod={state.clock.period} initialSec={Math.round(displaySeconds(state.clock, now))}
        periodCount={rules.periodCount} periodLengthSec={rules.periodLengthSec}
        onClose={() => setSheet(null)} onSet={actions.setClock} onEndPeriod={actions.endPeriod} />
      <TagSheet open={sheet === "tag"} tags={tags} onClose={() => setSheet(null)} onPick={(label) => actions.record("tag", { label }, undefined, label)} />
      <PenaltySheet open={sheet === "penalty"} onClose={() => setSheet(null)} onPick={(minutes) => actions.record("penalty", { minutes })} />
      <BackdateSheet open={sheet === "backdate"} on={state.shift.on} onClose={() => setSheet(null)} onPick={actions.backdatedShift} />
    </main>
  );
}

export default function LiveGamePage() {
  return <QueryGate><LiveInner /></QueryGate>;
}
