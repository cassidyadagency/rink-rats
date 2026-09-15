# Rink Rats v1 — Design Spec

**Date:** 2026-09-14
**Status:** Approved for planning

## 1. Purpose

A phone-first app that lets a hockey parent record what their kid does during a game in one tap and get their eyes back on the ice. It answers three questions at a glance: *is my kid on the ice, how long have they been out, and what just happened?*

Users are one parent plus a handful of other parents on the same junior hockey team. No accounts, no server, no store listing.

## 2. Scope

### In scope (v1)

- **"My kid" mode only.** One child tracked per game.
- Multiple kid profiles per phone, each tied to a team. Pick the kid when starting a game.
- Game clock with Play/Pause as the source of truth for ice time; clock can be corrected to match the scoreboard.
- Shift on/off with clock-time and real-time durations; back-dated corrections.
- Events: Goal, Assist, Shot, Penalty, Save, Goal Against, positive Tags, Moment bookmark. Every event button can be hidden.
- One-tap Undo of the last stat/shift/tag event; full timeline with delete/adjust.
- Postgame card (summary + parent note) shareable as an image.
- Installable PWA that works fully offline.
- JSON export/import of all data as backup.

### Out of scope (v1)

Team mode (full roster on ice, line changes), accounts/sync, live follow-along for family, two kids in the same game, sports other than hockey, plus/minus, faceoffs, native app packaging.

## 3. Decisions made

| Decision | Choice | Why |
|---|---|---|
| Tracking mode | My kid first | Simplest to make reliable; team mode reuses the same event model later |
| Platform | Next.js PWA | Share a link, add to home screen, offline via service worker, no store review; server layer available for v2 sync |
| Data | Local-only (IndexedDB) | No backend to build or pay for; sync in v2 ships event logs |
| Ice time | Game clock with Play/Pause | Matches what coaches and kids mean by "ice time"; real elapsed time stored but not shown by default |
| Stats | Goal, Assist, Shot, Penalty, Save, Goal Against, Tags | Small reliable set; goalie buttons only appear when the kid's position is G |
| Roster | Lightweight, optional | Only used to attribute goals/assists to teammates; groundwork for team mode |
| Periods | Configurable count and length (default 3 × 15:00), count-down clock | Junior leagues vary; count-down mirrors the scoreboard |

## 4. Data model

Stored in IndexedDB via Dexie. All ids are UUIDs.

### `players`

```ts
{ id, firstName, lastName, jersey: number, position: 'F' | 'D' | 'G', teamId, createdAt }
```

### `teams`

```ts
{
  id, name, season,
  periodCount: number,        // default 3
  periodLengthSec: number,    // default 900
  stopTime: boolean,          // default true; false = running time, Pause hidden
  roster: { name: string; jersey: number; position: 'F' | 'D' | 'G' }[]  // optional, may be empty
}
```

### `games`

```ts
{
  id, playerId, teamId, opponent, date,
  status: 'setup' | 'live' | 'final',
  settings: { visibleEvents: EventType[] },
  note?: string,
  createdAt, finalizedAt?
}
```

### `events` — append-only log, the source of truth for everything in a game

```ts
{
  id, gameId,
  seq: number,                 // strictly increasing within a game, assigned on write
  wallTime: number,            // Date.now() when recorded
  clock: { period: number; secRemaining: number },  // game clock at that moment
  type:
    | 'clock_start' | 'clock_pause' | 'clock_set' | 'period_end'
    | 'shift_on' | 'shift_off'
    | 'goal' | 'assist' | 'shot' | 'penalty' | 'save' | 'goal_against'
    | 'tag' | 'moment'
    | 'undo',
  payload?: {
    minutes?: number;          // penalty
    label?: string;            // tag
    note?: string;             // moment
    teammate?: string;         // goal/assist attribution (roster name)
    targetSeq?: number;        // undo
  }
}
```

Derived state (ice time, stats, timeline, postgame card) is always computed by replaying the log through a pure reducer. Nothing derived is persisted.

Why append-only:

- Undo is an event referencing a `targetSeq`; the reducer skips the target. Undo of an undo restores it.
- Corrections ("came on 30 seconds ago") are ordinary events with a back-dated `clock`.
- The timeline is the log itself.
- v2 sync is shipping event logs, not reconciling mutable state.

## 5. Clock and shift semantics

### Game clock

State: `{ period, secRemaining, running }`. The reducer stores an **anchor** (`secRemaining` at the `wallTime` the clock last started). Display time = `anchor.secRemaining − (now − anchor.wallTime)` while running, clamped at 0. This is correct after the phone sleeps or the tab is backgrounded; nothing is lost between ticks.

- **Play / Pause** emits `clock_start` / `clock_pause`.
- **Correct clock**: tap the digits → numeric pad → `clock_set { period, secRemaining }`. Used to re-sync with the scoreboard.
- **Period end**: when display time hits 0:00 the UI emits `clock_pause` then `period_end`; the next Play starts the next period at full length. Can also be triggered manually. After the last period, Play is disabled and End Game is offered.
- **Running time** (`team.stopTime === false`): Pause is hidden; clock runs continuously once started.

### Shift

- Tapping the player card toggles `shift_on` / `shift_off`.
- **Clock-time duration** = clock seconds elapsed while the clock was running between on and off. **Real-time duration** = `wallTime` delta. Both derived; clock time is what the UI shows unless the user turns on "show real time" in settings.
- A shift stays "on" through a pause (kid is still on the ice during a whistle) but does not accrue clock time.
- A shift that is on at `period_end` is closed at 0:00 and reported in that period; the kid is treated as off at the start of the next period.
- **Penalty** with minutes emits `shift_off` immediately and shows a countdown badge. When it expires the UI prompts "Back on ice?" rather than auto-toggling.

### Corrections

- Long-press the shift toggle → "Came on 30s ago / 1 min ago / custom" → emits `shift_on` or `shift_off` with a back-dated `clock`.
- Any event in the timeline can be deleted (emits `undo`) or re-timed (emits `undo` plus a replacement event).

### Undo

One large button undoes the last non-clock event (shift, stat, tag, moment). Label shows what it will undo. Clock events are not covered — un-pausing is just pressing Play; a wrong `clock_set` is fixed with another `clock_set` or via the timeline.

### Derived state contract (`deriveGameState(events, team)`)

```ts
{
  clock: { period, secRemaining, running, anchorWallTime },
  shift: { on: boolean; startedAt?: { period, secRemaining, wallTime } },
  iceTime: { clockSec, realSec, byPeriod: { clockSec, realSec }[] },
  shifts: { count, avgClockSec, longestClockSec, list: Shift[] },
  stats: Record<EventType, number>,
  penalty?: { endsAtClock, endsAtWall },
  timeline: TimelineEntry[],       // ordered, with undone entries flagged
  lastUndoable?: Event,
  isFinalPeriodComplete: boolean
}
```

## 6. Screens

All screens are phone-first; primary controls sit in the lower two-thirds of the screen.

### Home (`/`)

> Routing note: the app is built as a Next.js static export so every route is a precachable HTML file. Ids travel as query params (`?id=`) rather than dynamic path segments.

List of kid profiles (name, jersey, team). Tap → that player's page (New game / game history). Gear → Settings. Empty state on first run leads straight into "Add your player".

### Game setup (`/game/new?playerId=`)

Opponent, date (defaults now), period count/length (defaults from team), visible event buttons (defaults from the last game for that player). "Start game" creates the game with `status: 'live'` and opens the live screen.

### Live game (`/game/live?id=`)

```
┌────────────────────────────────┐
│  P2   12:34        vs Hawks    │  tap clock digits to correct
│  ▶ PLAY / ❚❚ PAUSE (full-width)│  ~64px tall, colour flips with state
├────────────────────────────────┤
│  ┌──────────────────────────┐  │
│  │  #17 Jake      ON ICE    │  │  card = shift toggle; green on / grey off
│  │  shift 0:42 · total 6:18 │  │  long-press = back-dated on/off
│  │  3 shifts · avg 0:51     │  │
│  └──────────────────────────┘  │
├────────────────────────────────┤
│  GOAL   ASSIST   SHOT          │  event grid, 2–3 per row
│  PENALTY  SAVE   GOAL AGN      │  goalie row only when position = G
│  ★ TAG   📍 MOMENT             │
├────────────────────────────────┤
│  ↶ UNDO  "Shot (P2 12:41)"     │  label = what it will undo
├────────────────────────────────┤
│  Timeline (last 3, tap ▲ more) │
└────────────────────────────────┘
```

Rules:

- Every event is one tap: haptic (`navigator.vibrate` where available) and a one-second toast. No confirmation dialogs.
- **Tag** opens a bottom sheet of chips (Great pass, Hustle, Strong D, Blocked shot, + custom); tapping a chip records and closes.
- **Moment** records the clock time instantly; the note is added later from the timeline.
- **Goal / Assist** record instantly; teammate attribution is optional, added from the timeline.
- Screen stays awake via the Wake Lock API while the game is live.
- Header "End game" → single confirm → `status: 'final'` → postgame card.

### Postgame card (`/game/card?id=`)

Kid name and jersey, opponent, date, ice time (clock), shifts / avg / longest, per-period bar, stat line, tags, moments with notes, editable parent note. **Share** renders the card to a PNG (canvas) and uses the Web Share API, falling back to download. **Done** returns to the player's history. Full timeline is a second tab on this screen.

### Settings (`/settings`)

Players and teams (including roster), default visible events, default period settings, stop-time vs running-time, "show real time" toggle, Export JSON, Import JSON.

## 7. Architecture

Next.js App Router with `output: 'export'`, TypeScript strict, Tailwind. All routes are client-rendered static HTML; no server code in v1.

```
src/
  domain/          pure TS, no React or browser imports
    events.ts      event types, factories, type guards
    clock.ts       anchor math, display time, formatting
    reducer.ts     deriveGameState
    postgame.ts    card summary from derived state
  db/
    schema.ts      Dexie tables and versioned migrations
    repo.ts        CRUD for players/teams/games, appendEvent, export/import
  hooks/
    useLiveGame.ts     liveQuery on events → deriveGameState
    useClockDisplay.ts ticks the display from the anchor
    useWakeLock.ts
  components/      LiveClock, PlayPauseButton, ShiftCard, EventGrid, TagSheet,
                   UndoButton, Timeline, PostgameCard, ...
  app/             routes listed in §6
```

`domain/` is the deep module. The UI never computes ice time or stats; it appends events and re-derives. Team mode later means adding `playerId` to shift events and running the reducer per player.

### Data flow for a tap

Button → `repo.appendEvent(gameId, event)` (Dexie transaction assigns `seq`) → `useLiveGame` re-reads via `liveQuery` → `deriveGameState` → render. Single direction; there is no in-memory game state that can drift from storage. If the app is killed mid-game, reopening the live route replays the log and resumes, clock included.

### Clock rendering

`useClockDisplay` updates at 4 Hz (rAF-throttled) while running and recomputes immediately on `visibilitychange`. The period-end transition is detected here and dispatched as events.

### Offline / PWA

A small hand-written service worker (`public/sw.js`) precaches every exported route plus the `/_next/static` assets they reference, and serves cache-first. `manifest.json` with `display: standalone`, icons, theme colour. New service workers install in the background and activate on next launch — never mid-game.

### Backup

Settings → Export JSON (all tables) via Web Share API or download. Import merges by id and never duplicates.

### Error handling

- IndexedDB write failure → toast "Couldn't save, try again"; nothing is shown as recorded.
- Reducer ignores unknown event types and `undo` events whose `targetSeq` does not exist.
- Corrupt or partial import → reject the whole file with a message; existing data untouched.

### Deployment

Vercel, default Next.js settings (static export), no environment variables in v1.

## 8. Testing

### Domain (Vitest)

`reducer.ts`, table-driven:

- on → pause → resume → off: clock time excludes the pause, real time includes it
- shift spanning a period end closes at 0:00 and next period starts off
- penalty emits shift off and countdown
- undo of `shift_on` removes the shift; undo of that undo restores it
- back-dated `shift_on` yields the expected duration
- `clock_set` mid-shift adjusts totals correctly
- unknown event types and dangling undo targets are ignored

`clock.ts`: display after N seconds, after a pause, after `clock_set`, never below 0.

`postgame.ts`: summary counts match a hand-built log.

### Storage (Vitest + `fake-indexeddb`)

- `appendEvent` assigns strictly increasing `seq` under concurrent appends
- export → import round-trips all tables without duplicating ids
- one scaffolded schema-migration test (v1 → v2)

### Components (Vitest + Testing Library, targeted)

- `EventGrid` shows goalie buttons only for position G and hides events not in `visibleEvents`
- `UndoButton` label reflects `lastUndoable`
- `ShiftCard` reflects on/off derived state

### Manual device checklist (README, before each deploy)

1. Install to home screen on iPhone and Android.
2. Airplane mode → start a game → kill app → reopen: game resumes, clock correct.
3. Screen stays awake through a three-minute shift.
4. Share produces an image in the iOS share sheet.

## 9. Future (not designed here)

Team mode, accounts and event-log sync, live follow-along for invited family, multiple kids per game. The append-only event model and `domain/` boundary are the only v1 choices made with these in mind.
