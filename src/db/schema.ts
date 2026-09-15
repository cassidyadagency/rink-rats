import Dexie, { type EntityTable } from "dexie";
import type { EventType, GameEvent, Position } from "@/domain/events";

export interface RosterEntry {
  name: string;
  jersey: number;
  position: Position;
}

export interface Team {
  id: string;
  name: string;
  season: string;
  periodCount: number;
  periodLengthSec: number;
  stopTime: boolean;
  roster: RosterEntry[];
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  jersey: number;
  position: Position;
  teamId: string;
  createdAt: number;
}

export type GameStatus = "setup" | "live" | "final";

export interface Game {
  id: string;
  playerId: string;
  teamId: string;
  opponent: string;
  /** YYYY-MM-DD */
  date: string;
  status: GameStatus;
  settings: { visibleEvents: EventType[]; periodCount?: number; periodLengthSec?: number; stopTime?: boolean };
  note?: string;
  createdAt: number;
  finalizedAt?: number;
}

export interface Settings {
  id: "app";
  showRealTime: boolean;
  customTags: string[];
}

export const TEAM_DEFAULTS = { periodCount: 3, periodLengthSec: 900, stopTime: true } as const;
export const DEFAULT_TAGS = ["Great pass", "Hustle", "Strong D", "Blocked shot"];
export const DEFAULT_SETTINGS: Settings = { id: "app", showRealTime: false, customTags: [] };

export function defaultVisibleEvents(position: Position): EventType[] {
  return position === "G"
    ? ["save", "goal_against", "penalty", "tag", "moment"]
    : ["goal", "assist", "shot", "penalty", "tag", "moment"];
}

export class RinkRatsDB extends Dexie {
  teams!: EntityTable<Team, "id">;
  players!: EntityTable<Player, "id">;
  games!: EntityTable<Game, "id">;
  events!: EntityTable<GameEvent, "id">;
  settings!: EntityTable<Settings, "id">;

  constructor() {
    super("rink-rats");
    this.version(1).stores({
      teams: "id",
      players: "id, teamId",
      games: "id, playerId, teamId, createdAt",
      events: "id, gameId, [gameId+seq]",
      settings: "id",
    });
  }
}

export const db = new RinkRatsDB();
