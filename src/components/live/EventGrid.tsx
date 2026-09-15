"use client";
import { EVENT_LABELS, GOALIE_EVENTS, type EventType, type Position } from "@/domain/events";

const ORDER: EventType[] = ["goal", "assist", "shot", "penalty", "save", "goal_against", "tag", "moment"];
const ICON: Partial<Record<EventType, string>> = { tag: "★ ", moment: "📍 " };

export function EventGrid({ visibleEvents, position, onEvent }: { visibleEvents: EventType[]; position: Position; onEvent: (t: EventType) => void }) {
  const shown = ORDER.filter((t) => visibleEvents.includes(t) && (position === "G" || !(GOALIE_EVENTS as readonly string[]).includes(t)));
  return (
    <div className="grid grid-cols-3 gap-2 px-4">
      {shown.map((t) => (
        <button key={t} onClick={() => onEvent(t)} className="h-16 rounded-2xl bg-slate-800 text-lg font-bold active:bg-sky-600">
          {ICON[t]}{EVENT_LABELS[t]}
        </button>
      ))}
    </div>
  );
}
