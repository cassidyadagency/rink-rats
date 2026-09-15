export type Position = "F" | "D" | "G";

export type ClockEventType = "clock_start" | "clock_pause" | "clock_set" | "period_end";
export type ShiftEventType = "shift_on" | "shift_off";
export type StatEvent = "goal" | "assist" | "shot" | "penalty" | "save" | "goal_against";
export type EventType = ClockEventType | ShiftEventType | StatEvent | "tag" | "moment" | "undo";

export interface ClockStamp {
  period: number;
  secRemaining: number;
}

export interface EventPayload {
  minutes?: number;
  label?: string;
  note?: string;
  teammate?: string;
  targetSeq?: number;
}

export interface GameEvent {
  id: string;
  gameId: string;
  seq: number;
  wallTime: number;
  clock: ClockStamp;
  type: EventType;
  payload?: EventPayload;
}

export type EventDraft = Omit<GameEvent, "id" | "gameId" | "seq">;

export const CLOCK_EVENTS: readonly EventType[] = ["clock_start", "clock_pause", "clock_set", "period_end"];
export const STAT_EVENTS: readonly StatEvent[] = ["goal", "assist", "shot", "penalty", "save", "goal_against"];
export const GOALIE_EVENTS: readonly StatEvent[] = ["save", "goal_against"];
export const UNDOABLE_EVENTS: readonly EventType[] = ["shift_on", "shift_off", ...STAT_EVENTS, "tag", "moment"];

export const EVENT_LABELS: Record<EventType, string> = {
  clock_start: "Clock start",
  clock_pause: "Clock pause",
  clock_set: "Clock set",
  period_end: "Period end",
  shift_on: "On ice",
  shift_off: "Off ice",
  goal: "Goal",
  assist: "Assist",
  shot: "Shot",
  penalty: "Penalty",
  save: "Save",
  goal_against: "Goal Agn",
  tag: "Tag",
  moment: "Moment",
  undo: "Undo",
};

export function isUndoable(type: EventType): boolean {
  return UNDOABLE_EVENTS.includes(type);
}

export function isStatEvent(type: EventType): type is StatEvent {
  return (STAT_EVENTS as readonly string[]).includes(type);
}
