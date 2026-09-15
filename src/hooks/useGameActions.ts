"use client";
import { useCallback } from "react";
import * as repo from "@/db/repo";
import { EVENT_LABELS, type ClockStamp, type EventPayload, type EventType } from "@/domain/events";
import { stampAt } from "@/domain/clock";
import type { GameState } from "@/domain/reducer";
import { useToast } from "@/components/ui/Toast";
import { haptic } from "@/lib/haptic";

export function useGameActions(gameId: string, state: GameState | undefined, periodLengthSec: number) {
  const toast = useToast();

  const record = useCallback(async (type: EventType, payload?: EventPayload, clock?: ClockStamp, label?: string) => {
    if (!state) return;
    haptic();
    try {
      await repo.appendEvent(gameId, { type, payload, wallTime: Date.now(), clock: clock ?? stampAt(state.clock, Date.now()) });
      toast.show(label ?? EVENT_LABELS[type]);
    } catch {
      toast.show("Couldn't save, try again");
    }
  }, [gameId, state, toast]);

  const play = () => record("clock_start");
  const pause = () => record("clock_pause");
  const setClock = (period: number, secRemaining: number) => record("clock_set", undefined, { period, secRemaining });
  const endPeriod = async () => {
    if (!state) return;
    const stamp = stampAt(state.clock, Date.now());
    if (state.clock.running) await record("clock_pause", undefined, stamp);
    await record("period_end", undefined, stamp, `End of period ${state.clock.period}`);
  };
  const toggleShift = () => record(state?.shift.on ? "shift_off" : "shift_on");
  const backdatedShift = (secAgo: number) => {
    if (!state) return Promise.resolve();
    const now = stampAt(state.clock, Date.now());
    const stamp = { period: now.period, secRemaining: Math.min(periodLengthSec, now.secRemaining + secAgo) };
    return record(state.shift.on ? "shift_off" : "shift_on", undefined, stamp);
  };
  const undoSeq = (seq: number) => record("undo", { targetSeq: seq }, undefined, "Undone");
  const undoLast = () => (state?.lastUndoable ? undoSeq(state.lastUndoable.seq) : Promise.resolve());

  return { record, play, pause, setClock, endPeriod, toggleShift, backdatedShift, undoLast, undoSeq };
}

export type GameActions = ReturnType<typeof useGameActions>;
