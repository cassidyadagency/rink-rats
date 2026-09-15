import { describe, it, expect, beforeEach } from "vitest";
import { db, defaultVisibleEvents } from "./schema";
import * as repo from "./repo";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

async function seedPlayer() {
  const team = await repo.createTeam({ name: "Hawks", season: "2026-27", periodCount: 3, periodLengthSec: 900, stopTime: true, roster: [] });
  const player = await repo.createPlayer({ firstName: "Jake", lastName: "C", jersey: 17, position: "F", teamId: team.id });
  return { team, player };
}

describe("appendEvent", () => {
  it("assigns strictly increasing seq under concurrent appends", async () => {
    const { team, player } = await seedPlayer();
    const game = await repo.createGame({ playerId: player.id, teamId: team.id, opponent: "Bears", date: "2026-09-14", settings: { visibleEvents: [] } });
    const drafts = Array.from({ length: 20 }, (_, i) => ({ type: "shot" as const, wallTime: i, clock: { period: 1, secRemaining: 900 - i } }));
    const written = await Promise.all(drafts.map((d) => repo.appendEvent(game.id, d)));
    const seqs = written.map((e) => e.seq).sort((a, b) => a - b);
    expect(seqs).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    const listed = await repo.listEvents(game.id);
    expect(listed.map((e) => e.seq)).toEqual(seqs);
  });
});

describe("cascades", () => {
  it("deleting a player removes its games and events", async () => {
    const { team, player } = await seedPlayer();
    const game = await repo.createGame({ playerId: player.id, teamId: team.id, opponent: "Bears", date: "2026-09-14", settings: { visibleEvents: [] } });
    await repo.appendEvent(game.id, { type: "shot", wallTime: 0, clock: { period: 1, secRemaining: 900 } });
    await repo.deletePlayer(player.id);
    expect(await db.games.count()).toBe(0);
    expect(await db.events.count()).toBe(0);
  });

  it("deleting a team removes its players, games and events", async () => {
    const { team, player } = await seedPlayer();
    const game = await repo.createGame({ playerId: player.id, teamId: team.id, opponent: "Bears", date: "2026-09-14", settings: { visibleEvents: [] } });
    await repo.appendEvent(game.id, { type: "shot", wallTime: 0, clock: { period: 1, secRemaining: 900 } });
    await repo.deleteTeam(team.id);
    expect(await db.teams.count()).toBe(0);
    expect(await db.players.count()).toBe(0);
    expect(await db.games.count()).toBe(0);
    expect(await db.events.count()).toBe(0);
  });
});

describe("settings", () => {
  it("creates defaults on first read", async () => {
    expect(await repo.getSettings()).toEqual({ id: "app", showRealTime: false, customTags: [] });
    await repo.updateSettings({ showRealTime: true });
    expect((await repo.getSettings()).showRealTime).toBe(true);
  });
});

describe("defaultVisibleEvents", () => {
  it("differs for goalies", () => {
    expect(defaultVisibleEvents("F")).toEqual(["goal", "assist", "shot", "penalty", "tag", "moment"]);
    expect(defaultVisibleEvents("G")).toEqual(["save", "goal_against", "penalty", "tag", "moment"]);
  });
});

describe("annotateEvent", () => {
  it("merges note and teammate into payload", async () => {
    const { team, player } = await seedPlayer();
    const game = await repo.createGame({ playerId: player.id, teamId: team.id, opponent: "Bears", date: "2026-09-14", settings: { visibleEvents: [] } });
    const e = await repo.appendEvent(game.id, { type: "goal", wallTime: 0, clock: { period: 1, secRemaining: 900 } });
    await repo.annotateEvent(e.id, { teammate: "Sam" });
    await repo.annotateEvent(e.id, { note: "Top shelf" });
    expect((await db.events.get(e.id))?.payload).toEqual({ teammate: "Sam", note: "Top shelf" });
  });
});

describe("export / import", () => {
  it("round-trips without duplicating ids", async () => {
    const { team, player } = await seedPlayer();
    const game = await repo.createGame({ playerId: player.id, teamId: team.id, opponent: "Bears", date: "2026-09-14", settings: { visibleEvents: [] } });
    await repo.appendEvent(game.id, { type: "goal", wallTime: 0, clock: { period: 1, secRemaining: 900 } });
    const backup = await repo.exportAll();
    expect(backup.version).toBe(1);
    const counts = await repo.importAll(backup);
    expect(counts).toEqual({ teams: 1, players: 1, games: 1, events: 1 });
    expect(await db.events.count()).toBe(1);
    expect(await db.players.count()).toBe(1);
  });
  it("rejects malformed input without writing", async () => {
    await expect(repo.importAll({ version: 2 } as never)).rejects.toThrow(/unsupported|invalid/i);
    expect(await db.teams.count()).toBe(0);
  });
});
