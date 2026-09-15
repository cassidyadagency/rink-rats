# Rink Rats

Phone-first PWA for hockey parents: track one kid's shifts, ice time, and a handful of stats with one tap, then share a postgame card. Local-only in v1 — no accounts, no server.

Design spec: `docs/superpowers/specs/2026-09-14-rink-rats-v1-design.md`

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest (watch); `npm test -- --run` for one pass
npm run typecheck
npm run build      # static export to out/
npm run icons      # regenerate PNG icons from public/icon.svg
```

## How it works

- `src/domain/` — pure TypeScript. `deriveGameState(events, rules)` replays an append-only event log into clock, shifts, ice time, stats, timeline. No React or browser imports (enforced by `purity.test.ts`).
- `src/db/` — Dexie (IndexedDB) tables `teams`, `players`, `games`, `events`, `settings`; `appendEvent` assigns `seq` in a transaction. Games snapshot the team's period rules (`periodCount`, `periodLengthSec`, `stopTime`) into `game.settings` at creation, so later team-setting changes don't alter a game already in progress or finished; `useLiveGame` falls back to the team's current values for games created before the snapshot existed.
- `src/hooks/` — `useLiveGame` (Dexie liveQuery → reducer), `useGameActions` (stamps events with the current clock), `useNow` (clock ticking), `useWakeLock`.
- `src/app/` — static routes; ids travel as query params so every page is a precachable HTML file.
- `sw/sw.js` — offline service worker source (precache routes + hashed assets; network-first for HTML with cache fallback). `public/sw.js` is generated from it by `npm run build`'s `prebuild` step (`scripts/stamp-sw.mjs`), which stamps the cache name with a fresh build id so each deploy gets its own cache; `public/sw.js` is gitignored and not tracked.

## Ice time

Clock time is the number on the scoreboard: the big Play/Pause mirrors it, and a shift only accrues while the clock runs. Real elapsed time is stored too (Settings → "Show real elapsed time"). Tap the clock digits to correct it after a missed whistle.

## Device checklist (before each deploy)

1. Install to home screen on iPhone (Safari → Share → Add to Home Screen) and Android (Chrome → Install).
2. Airplane mode → open the app → start a game → force-quit → reopen: the game resumes with the clock where it should be.
3. Leave the live screen up for a three-minute shift: the screen stays awake.
4. End a game → Share card: iOS share sheet shows the PNG; Android offers the same.
5. Settings → Export: a JSON file is shared/downloaded. Import it on another device: players and games appear.
6. Long-press the player card: the back-date sheet opens and the following tap does not toggle the shift.
7. Tap Delete on a timeline row, then Restore: the row is struck through and comes back.

## Deploy

Vercel, zero config (`output: 'export'`). `npm i -g vercel && vercel` from the repo root for a preview; `vercel --prod` to promote.

## Not in v1

Team mode, accounts/sync, live follow-along, two kids in one game. Re-timing an existing timeline event (delete it and re-record, or long-press the player card to back-date a shift). The event log and `domain/` boundary are designed so these bolt on without a rewrite.
