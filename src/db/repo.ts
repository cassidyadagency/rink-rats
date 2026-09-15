import Dexie from "dexie";
import type { EventDraft, GameEvent } from "@/domain/events";
import { db, DEFAULT_SETTINGS, type Game, type Player, type Settings, type Team } from "./schema";

const uuid = () => crypto.randomUUID();

// ---- teams ----
export async function createTeam(input: Omit<Team, "id">): Promise<Team> {
  const team: Team = { ...input, id: uuid() };
  await db.teams.add(team);
  return team;
}
export function updateTeam(id: string, patch: Partial<Team>) {
  return db.teams.update(id, patch);
}
export async function deleteTeam(id: string) {
  await db.transaction("rw", db.teams, db.players, db.games, db.events, async () => {
    const players = await db.players.where("teamId").equals(id).toArray();
    for (const p of players) await deletePlayer(p.id);
    await db.teams.delete(id);
  });
}

// ---- players ----
export async function createPlayer(input: Omit<Player, "id" | "createdAt">): Promise<Player> {
  const player: Player = { ...input, id: uuid(), createdAt: Date.now() };
  await db.players.add(player);
  return player;
}
export function updatePlayer(id: string, patch: Partial<Player>) {
  return db.players.update(id, patch);
}
export async function deletePlayer(id: string) {
  await db.transaction("rw", db.players, db.games, db.events, async () => {
    const games = await db.games.where("playerId").equals(id).toArray();
    for (const g of games) await deleteGame(g.id);
    await db.players.delete(id);
  });
}

// ---- games ----
export async function createGame(input: Omit<Game, "id" | "createdAt" | "status">): Promise<Game> {
  const game: Game = { ...input, id: uuid(), status: "live", createdAt: Date.now() };
  await db.games.add(game);
  return game;
}
export function updateGame(id: string, patch: Partial<Game>) {
  return db.games.update(id, patch);
}
export async function deleteGame(id: string) {
  await db.transaction("rw", db.games, db.events, async () => {
    await db.events.where("gameId").equals(id).delete();
    await db.games.delete(id);
  });
}

// ---- events ----
export function appendEvent(gameId: string, draft: EventDraft): Promise<GameEvent> {
  return db.transaction("rw", db.events, async () => {
    const last = await db.events.where("[gameId+seq]").between([gameId, Dexie.minKey], [gameId, Dexie.maxKey]).last();
    const event: GameEvent = { ...draft, id: uuid(), gameId, seq: (last?.seq ?? 0) + 1 };
    await db.events.add(event);
    return event;
  });
}
export function listEvents(gameId: string): Promise<GameEvent[]> {
  return db.events.where("[gameId+seq]").between([gameId, Dexie.minKey], [gameId, Dexie.maxKey]).toArray();
}

// ---- settings ----
export async function getSettings(): Promise<Settings> {
  const existing = await db.settings.get("app");
  if (existing) return existing;
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}
export async function updateSettings(patch: Partial<Omit<Settings, "id">>) {
  const current = await getSettings();
  await db.settings.put({ ...current, ...patch });
}

// ---- backup ----
export interface Backup {
  version: 1;
  exportedAt: string;
  teams: Team[];
  players: Player[];
  games: Game[];
  events: GameEvent[];
  settings: Settings;
}

export async function exportAll(): Promise<Backup> {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    teams: await db.teams.toArray(),
    players: await db.players.toArray(),
    games: await db.games.toArray(),
    events: await db.events.toArray(),
    settings: await getSettings(),
  };
}

export async function importAll(backup: Backup) {
  if (!backup || backup.version !== 1) throw new Error("Unsupported backup version");
  for (const key of ["teams", "players", "games", "events"] as const) {
    if (!Array.isArray(backup[key])) throw new Error(`Invalid backup: ${key} missing`);
  }
  await db.transaction("rw", db.teams, db.players, db.games, db.events, db.settings, async () => {
    await db.teams.bulkPut(backup.teams);
    await db.players.bulkPut(backup.players);
    await db.games.bulkPut(backup.games);
    await db.events.bulkPut(backup.events);
    if (backup.settings) await db.settings.put({ ...backup.settings, id: "app" });
  });
  return { teams: backup.teams.length, players: backup.players.length, games: backup.games.length, events: backup.events.length };
}
