"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, DEFAULT_SETTINGS, DEFAULT_TAGS } from "@/db/schema";
import * as repo from "@/db/repo";
import type { EventType } from "@/domain/events";
import { displaySeconds } from "@/domain/clock";
import { liveTotals, penaltyRemainingSec, shouldAutoEndPeriod } from "@/domain/live";
import { useLiveGame } from "@/hooks/useLiveGame";
import { useGameActions } from "@/hooks/useGameActions";
import { useNow } from "@/hooks/useNow";
import { useWakeLock } from "@/hooks/useWakeLock";
import { QueryGate } from "@/components/QueryGate";
import { useToast } from "@/components/ui/Toast";
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
  const { game, team, player, rules, stopTime, state, loading } = useLiveGame(id);
  const settings = useLiveQuery(() => db.settings.get("app").then((x) => x ?? DEFAULT_SETTINGS), []);
  const actions = useGameActions(id, state, rules?.periodLengthSec ?? 900);
  const toast = useToast();
  const active = !!state && (state.clock.running || state.shift.on || !!state.penalty);
  const now = useNow(active);
  useWakeLock(true);

  const [sheet, setSheet] = useState<"tag" | "penalty" | "backdate" | null>(null);
  const [clockSnap, setClockSnap] = useState<{ period: number; sec: number } | null>(null);
  const endedPeriod = useRef(0);

  useEffect(() => { if (game?.status === "final") router.replace(`/game/card?id=${id}`); }, [game?.status, id, router]);

  // Auto period end when the running clock reaches 0:00. `endPeriod` is a
  // fresh function every render (destructured from `actions`, a new object
  // each render) and this effect is meant to run every tick — `now` is a dep
  // specifically so it re-checks the clock each tick. Double-firing (and
  // failing to re-arm after a clock_set puts time back on a period already
  // marked ended) is handled by shouldAutoEndPeriod via the endedPeriod ref,
  // not by limiting how often the effect itself runs.
  const { endPeriod } = actions;
  useEffect(() => {
    if (!state) return;
    const { fire, nextLastEnded } = shouldAutoEndPeriod(state, now, endedPeriod.current);
    endedPeriod.current = nextLastEnded;
    if (fire) endPeriod();
  }, [state, now, endPeriod]);

  if (loading || !game || !team || !player || !rules || stopTime === undefined || !state || !settings) return null;
  const s = state;

  const totals = liveTotals(state, rules, now);
  const penaltyLeft = penaltyRemainingSec(state, rules, now);
  const tags = [...DEFAULT_TAGS, ...settings.customTags];

  const onEvent = (type: EventType) => {
    if (type === "penalty") setSheet("penalty");
    else if (type === "tag") setSheet("tag");
    else actions.record(type);
  };

  const endGame = async () => {
    if (!confirm("End game and build the postgame card?")) return;
    if (s.shift.on) await actions.toggleShift();
    if (s.clock.running) await actions.pause();
    try {
      await repo.updateGame(id, { status: "final", finalizedAt: Date.now() });
      router.replace(`/game/card?id=${id}`);
    } catch {
      toast.show("Couldn't save, try again");
    }
  };

  const annotate = async (eventId: string, patch: { note?: string; teammate?: string }) => {
    try {
      await repo.annotateEvent(eventId, patch);
    } catch {
      toast.show("Couldn't save, try again");
    }
  };

  return (
    <main className="safe-b safe-t flex min-h-dvh flex-col gap-3 pb-6">
      <div className="flex items-center justify-between px-4">
        <button onClick={() => router.push(`/player?id=${player.id}`)} className="text-slate-400">‹ Back</button>
        <button onClick={endGame} className="text-rose-300">End game</button>
      </div>
      <LiveClock clock={state.clock} now={now} opponent={game.opponent}
        onTap={() => setClockSnap({ period: state.clock.period, sec: Math.round(displaySeconds(state.clock, Date.now())) })} />
      <PlayPauseButton running={state.clock.running} disabled={state.isFinalPeriodComplete} stopTime={stopTime} onPlay={actions.play} onPause={actions.pause} />
      <PenaltyBanner remainingSec={penaltyLeft} onBackOnIce={actions.toggleShift} />
      <ShiftCard name={playerName(player)} on={state.shift.on} totals={totals} showRealTime={settings.showRealTime}
        onToggle={actions.toggleShift} onLongPress={() => setSheet("backdate")} />
      <EventGrid visibleEvents={game.settings.visibleEvents} position={player.position} onEvent={onEvent} />
      <UndoButton last={state.lastUndoable} onUndo={actions.undoLast} />
      <Timeline entries={state.timeline} roster={team.roster} limit={3}
        onDelete={actions.undoSeq} onRestore={actions.undoSeq} onAnnotate={annotate} />

      <ClockSetSheet open={clockSnap !== null} initialPeriod={clockSnap?.period ?? 1} initialSec={clockSnap?.sec ?? 0}
        periodCount={rules.periodCount} periodLengthSec={rules.periodLengthSec}
        onClose={() => setClockSnap(null)} onSet={actions.setClock} onEndPeriod={actions.endPeriod} />
      <TagSheet open={sheet === "tag"} tags={tags} onClose={() => setSheet(null)} onPick={(label) => actions.record("tag", { label }, undefined, label)} />
      <PenaltySheet open={sheet === "penalty"} onClose={() => setSheet(null)} onPick={(minutes) => actions.record("penalty", { minutes })} />
      <BackdateSheet open={sheet === "backdate"} on={state.shift.on} onClose={() => setSheet(null)} onPick={actions.backdatedShift} />
    </main>
  );
}

export default function LiveGamePage() {
  return <QueryGate><LiveInner /></QueryGate>;
}
