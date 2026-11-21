# TASK-GPT-1 — Steps 1–5 (logic) + dispatch + transcript check

Owner: GPT (main session). Follow `CONTRACT.md` exactly. Your files: see CONTRACT §1.

## 0. Dispatch first (before you write code)
1. Start Gemini A with `docs/team/TASK-GEMINI-A-1.md` and Gemini B with `docs/team/TASK-GEMINI-B-1.md`
   (Antigravity CLI, A = 4n high, B = 4h high), working dir `D:\the-unlit-hour`. Tell each: read CONTRACT.md first,
   touch only its own files, never run git, write its report to `docs/team/reports/GEMINI-<A|B>-1.md`.
2. Record both raw session ids / log paths in `SESSIONS.md` the moment you have them.

## 1. Step 1 — skeleton
- Delete the kit demo: `game/src/`, `screenshots/*.jpg`. Write `game/index.html` (CONTRACT §2), `util.js` (§4),
  `game.js` (fixed 1/60 loop with accumulator, max 5 ticks per frame; input; letterbox-aware mouse mapping; boot;
  states; `window.__unlit`). Until Gemini A delivers, game.js must still run if `renderFrame`/`drawOverlay` are
  missing: `typeof renderFrame === 'function'` guard, fill navy.
- A minimal `game/style.css` is Gemini A's; if it is not there yet, do NOT write it — request it.
- Accept: double-click shows a navy canvas letterboxed at 1280:480, zero console errors (use Gemini B's
  `tools/browser-check.mjs` once delivered; until then check by hand and say so).

## 2. Step 2 — levels
- `levels.js`: `parseLevel`, `validateLevel` (all 7 rules of CONTRACT §5), `validateAllLevels`, error state and
  `?breaklevel=1`.
- Until Gemini B's `level-data.js` arrives, test with fixtures inside `tools/logic-test.mjs` only (not in game/).
- Accept: three levels validate; `?breaklevel=1` shows the error on screen.

## 3. Steps 3–5 — player, grid, vision, screens, guards
Implement CONTRACT §6 exactly (grid.js, player.js, vision.js, screens.js, guard.js, exposure + transitions in
game.js). Screens are Step 6 in the spec, but write `screens.js` now: grid/vision/guards need current screen tiles.

## 4. tools/logic-test.mjs (the evidence for Gate 1)
Node, standard library only: load util, level-data, levels, grid, screens, vision, guard, player into one
`vm` context (in load order) and assert, printing one line per test and exiting 1 on any failure:
1. Exposure formula: d = 0, 128, 256; walking and sneaking; fall of 35/s; clamp 0..100 (call the same function
   game.js uses — put it in game.js only if it can be loaded too, otherwise in player.js/guard.js as
   `exposureRate(d, sneaking)`; tell me where).
2. `castRay`/`hasLineOfSight`: blocked by `#`, `C`, a current screen tile; NOT blocked by `~ = L .`.
3. Cone: 80 points; a point at 34° in / 36° out; 255 px in / 257 px out; behind a cart → not seen.
4. `findPath`: shortest length on a fixture, deterministic, `null` when walled off, respects current screens.
5. Every guard transition row of CONTRACT §6, each driven by a scripted scenario (place player, step the sim),
   including: ALERT increments timesSeen once per entry; SEARCH lasts 4 s then RETURN; RETURN → PATROL;
   CAUGHT within 0.6 tiles only from ALERT.
6. Screens: `far` at 3.01 tiles, ok at 2.99; `occupied` when the player circle overlaps a target tile; blocking
   switches only at swing end.
7. `validateLevel` throws for each broken fixture (one per rule) and passes all three real levels.
8. Player: cannot enter `# C ~ L` or a current screen tile; slides along a wall; walk 2.4 / sneak 1.4 tiles/s.

## 5. Accept Gemini deliveries
For each Gemini report: re-run its checks yourself, look at its files (ownership respected, forbidden-substring
grep on game/), then commit as `TASK-GEMINI-<A|B>-1: ...`. If something fails, send it back with the exact failure.

## 6. Transcript compatibility (do this right after the first Gemini delivery — it decides the whole team plan)
1. Read `node cli/makefun.mjs bundle --help` and `check --help` in the kit folder. Before running anything,
   find out whether `bundle` or `check` sends transcript content over the network. If it does: STOP, write it in
   STATUS.md, ask the user.
2. If local only: bundle a COPY of the current sessions (yours + both Gemini sessions; ask the user for Claude's log
   path) into a file outside the repo, with personal details redacted via `--redact-file
   C:\Users\Public\zhuma-handoff\redact.txt` (the user writes that file; never print it). Run `check` on the
   current commit.
3. Report in STATUS.md: whether each session was parsed, its harness/model, whether usage was found, and the
   authored-lines share. If the Gemini (Antigravity) sessions are not recognised, write
   `NEEDS CLAUDE: Gemini transcripts not recognised` and stop dispatching new Gemini work.

## 7. Stop point
When Step 5 acceptance holds (meter fills in light; "?" → "!" → chase; escape → SEARCH → RETURN; touching an ALERT
guard = CAUGHT) and `node tools/logic-test.mjs` passes: commit, write in STATUS.md
`NEEDS CLAUDE: Gate 1 logic review` with the commit sha and the test output, and tell the user
"请告诉 Claude：看 STATUS.md". Do NOT push.
