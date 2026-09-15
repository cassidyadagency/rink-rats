"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, defaultVisibleEvents, type Player, type Team } from "@/db/schema";
import * as repo from "@/db/repo";
import { EVENT_LABELS, GOALIE_EVENTS, type EventType } from "@/domain/events";
import { AppHeader } from "@/components/AppHeader";
import { QueryGate } from "@/components/QueryGate";
import { Button } from "@/components/ui/Button";
import { todayISO } from "@/lib/format";

const ALL: EventType[] = ["goal", "assist", "shot", "penalty", "save", "goal_against", "tag", "moment"];
const field = "w-full rounded-xl bg-slate-800 px-3 py-3 text-lg";

function NewGameForm({ player, team, initialVisible }: { player: Player; team: Team; initialVisible: EventType[] }) {
  const playerId = player.id;
  const router = useRouter();
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState(todayISO());
  const [visible, setVisible] = useState<EventType[]>(initialVisible);
  const [starting, setStarting] = useState(false);

  const choices = ALL.filter((t) => player.position === "G" || !(GOALIE_EVENTS as readonly string[]).includes(t));
  const toggle = (t: EventType) => setVisible((v) => (v.includes(t) ? v.filter((x) => x !== t) : [...v, t]));

  async function start() {
    setStarting(true);
    const game = await repo.createGame({ playerId, teamId: team.id, opponent: opponent.trim() || "Opponent", date, settings: { visibleEvents: visible } });
    router.replace(`/game/live?id=${game.id}`);
  }

  return (
    <main className="safe-b space-y-4 p-4">
      <AppHeader title="New game" back={`/player?id=${playerId}`} />
      <input className={field} placeholder="Opponent" value={opponent} onChange={(e) => setOpponent(e.target.value)} autoFocus />
      <input className={field} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="text-slate-400">{team.periodCount} periods × {team.periodLengthSec / 60} min · {team.stopTime ? "stop time" : "running time"} (change in team settings)</div>
      <div>
        <div className="mb-2 text-sm font-semibold uppercase text-slate-400">Buttons to show</div>
        <div className="grid grid-cols-3 gap-2">
          {choices.map((t) => (
            <Button key={t} type="button" variant={visible.includes(t) ? "primary" : "secondary"} onClick={() => toggle(t)}>{EVENT_LABELS[t]}</Button>
          ))}
        </div>
      </div>
      <Button variant="primary" size="xl" onClick={start} disabled={starting}>Start game</Button>
    </main>
  );
}

function NewGameInner() {
  const playerId = useSearchParams().get("playerId") ?? "";
  const player = useLiveQuery(() => db.players.get(playerId), [playerId]);
  const team = useLiveQuery(() => (player ? db.teams.get(player.teamId) : undefined), [player?.teamId]);
  const lastGame = useLiveQuery(
    () =>
      db.games
        .where("playerId")
        .equals(playerId)
        .reverse()
        .sortBy("createdAt")
        .then((g) => g.find((x) => x.status === "final") ?? null),
    [playerId],
  );

  if (!player || !team || lastGame === undefined) return null;
  const initialVisible = lastGame?.settings.visibleEvents ?? defaultVisibleEvents(player.position);

  return <NewGameForm key={player.id} player={player} team={team} initialVisible={initialVisible} />;
}

export default function NewGamePage() {
  return <QueryGate><NewGameInner /></QueryGate>;
}
