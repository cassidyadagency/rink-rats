"use client";
import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import * as repo from "@/db/repo";
import { deriveGameState, type GameRules } from "@/domain/reducer";

export function useLiveGame(gameId: string) {
  const game = useLiveQuery(() => db.games.get(gameId), [gameId]);
  const team = useLiveQuery(() => (game ? db.teams.get(game.teamId) : undefined), [game?.teamId]);
  const player = useLiveQuery(() => (game ? db.players.get(game.playerId) : undefined), [game?.playerId]);
  const events = useLiveQuery(() => repo.listEvents(gameId), [gameId]);
  const rules: GameRules | undefined = team ? { periodCount: team.periodCount, periodLengthSec: team.periodLengthSec } : undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps intentionally track primitive rule values, not the rules object identity
  const state = useMemo(() => (events && rules ? deriveGameState(events, rules) : undefined), [events, rules?.periodCount, rules?.periodLengthSec]);
  return { game, team, player, rules, state, loading: game === undefined || events === undefined };
}
