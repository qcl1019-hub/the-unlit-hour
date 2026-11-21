# CONTRACT — THE UNLIT HOUR

Author: Claude (designer / reviewer). Version 1, 2026-11-21 ~21:00 UTC.
This file is binding for GPT, Gemini A and Gemini B. If something here is wrong or blocks you, write it in
`docs/team/REQUESTS.md` (who, what, why) and keep working on what you can; do not silently deviate.
Order of authority: kit (`RULES.txt`, `competition.yaml`) > this contract > `UNLIT-BOUNTY-PROMPT.txt` (the "spec") > anything else.

---------------------------------------------------------------------------------------------------
## 0. Decisions already made (do not reopen)

| Topic | Decision | Why |
|---|---|---|
| Entry route | GitHub repo `qcl1019-hub/the-unlit-hour`, branch `main`. `.makefun/owner.json` stays in every commit, never edited, never printed. | User's wallet is a browser wallet (no keypair file) |
| Scripts | Classic `<script src="js/...">` only. No modules, no import/export, no import map. | Spec; kit allows it |
| Runs from | BOTH `file://` double-click AND `node serve.ts` → `http://localhost:8080`. Test both. | Spec says file://, kit says "any static HTTP server" |
| Screenshots | 4 PNG, exactly 1280x480, each ≤ 262144 bytes, names `01-overview.png` `02-turn-the-screen.png` `03-close-call.png` `04-delivered.png` (cover = 01). | Spec; kit allows long side ≤1280, short side ≥480 |
| LICENSE | MIT, "The Unlit Hour contributors" (+ make.fun line already there). Do not change. | User decision |
| README | Root `README.md` MUST carry the three live make.fun badges (section 9). | Kit check `repo_readme` |
| main.ts | Kit file with GPT's own edits; must stay deterministic (two runs, `cmp` identical). | Kit: ≥1 authored line |
| Starter files | `game/src/`, starter `game/index.html` content and `screenshots/*.jpg` are removed/replaced in Step 1 (GPT). | They are the kit's demo game |
| Commits | ONLY GPT runs git. Geminis never commit. One commit per accepted step/task, message `Step N: ...` or `TASK-<who>-<n>: ...`. Never force-push, never rewrite history. | One clean history |
| Transcripts | Never delete/edit any session log. Every agent's code must be written by that agent's own tool calls (no copy-paste of code between agents; a line re-typed from another agent's output counts as "copied" against us). | Kit transcript gate `thinking_reproduces` / `thinking_own_work` |

Deviation from the spec's FILE LAYOUT (one, deliberate): the three level maps live in `game/js/level-data.js`
(Gemini B), loaded right before `levels.js` (GPT, `parseLevel` / `validateLevel`). Reason: two agents must not
edit the same file at the same time. Everything else follows the spec layout.

---------------------------------------------------------------------------------------------------
## 1. File ownership (edit ONLY your own files)

| Owner | Files |
|---|---|
| GPT | `game/index.html`, `game/js/util.js`, `game/js/levels.js`, `game/js/grid.js`, `game/js/screens.js`, `game/js/vision.js`, `game/js/guard.js`, `game/js/player.js`, `game/js/game.js`, `main.ts`, `.gitignore`, `tools/logic-test.mjs`, `tools/playthrough.mjs`, `docs/team/STATUS.md`, `docs/team/SESSIONS.md`, `docs/team/REQUESTS.md`, `docs/team/reports/GPT-*.md` |
| Gemini A | `game/style.css`, `game/js/render.js`, `game/js/ui.js`, `game/js/shots.js`, `screenshots/*.png`, `tools/render-preview.html`, `docs/team/reports/GEMINI-A-*.md` |
| Gemini B | `game/js/level-data.js`, `game/js/audio.js`, `tools/check-shots.mjs`, `tools/contact.html`, `tools/shoot.md`, `tools/browser-check.mjs`, `shots.json`, `README.md`, `docs/team/reports/GEMINI-B-*.md` |
| Claude | `docs/team/CONTRACT.md`, `docs/team/TASK-*.md`, `docs/team/REVIEW-*.md` |
| Nobody | `vendor/makefun-game.ts` (byte-identical to kit), `.makefun/owner.json`, `LICENSE`, `serve.ts`, `transcripts/` (user exports) |

Need a change in someone else's file → `docs/team/REQUESTS.md`. GPT relays and decides small ones; design
questions → `NEEDS CLAUDE:` in STATUS.md.

---------------------------------------------------------------------------------------------------
## 2. Script load order (game/index.html)

```html
<canvas id="game" width="1280" height="480" aria-label="THE UNLIT HOUR"></canvas>
<script src="js/util.js"></script>
<script src="js/level-data.js"></script>
<script src="js/levels.js"></script>
<script src="js/grid.js"></script>
<script src="js/screens.js"></script>
<script src="js/vision.js"></script>
<script src="js/guard.js"></script>
<script src="js/player.js"></script>
<script src="js/audio.js"></script>
<script src="js/render.js"></script>
<script src="js/ui.js"></script>
<script src="js/shots.js"></script>
<script src="js/game.js"></script>
```
plus `<link rel="stylesheet" href="style.css">`. Nothing else: no inline script, no favicon link, no fonts.

### Global-scope rules (all files are classic scripts sharing ONE global scope)
- Public API = top-level `function`, `class` and `const` declarations with the exact names below. Use clear,
  descriptive names: the judge sees file names + first declarations (criterion 5, "structure").
- Every OTHER top-level name must start with the file's prefix to avoid collisions
  (`util`, `lvl`, `grid`, `scr`, `vis`, `grd`, `ply`, `sfx`, `rnd`, `ui`, `shot`, `game`), e.g. `function rndCapsulePath()`.
  A duplicate top-level `const`/`class`/`let` across files is a fatal SyntaxError.
- NO top-level side effects except in `game.js` (its boot). Other files only declare. No DOM/canvas/AudioContext
  access at load time. This lets `tools/logic-test.mjs` load util/level-data/levels/grid/screens/vision/guard/player
  in a Node `vm` context with no browser.
- First line of every file: a one-line `//` comment saying the file's single job.
- Code must parse as an ES module too (kit `js_parses`): strict-mode clean, no `with`, no octal literals, no
  duplicate params.
- FORBIDDEN anywhere under `game/`: the substrings `http`, `fetch(`, `XMLHttpRequest`, `WebSocket`, `import `,
  `type="module"`; `Math.random`; `Date.now`; `new Date`; `eval`; `new Function`; `setInterval`. `performance.now()`
  is allowed ONLY inside `game.js`'s requestAnimationFrame loop for frame timing, never in shot mode.
  (Note: an SVG namespace string or a URL in a comment also contains "http" — don't.)
- Source budget: all of `game/` source ≤ 140 KB total so the whole source fits the dossier's 160 KiB text cap.

---------------------------------------------------------------------------------------------------
## 3. Units and conventions

- World position: pixels, floats, origin top-left of the canvas, y down. `x ∈ [0,1280)`, `y ∈ [0,480)`.
- Tile coordinates: integers `tx ∈ [0,40)`, `ty ∈ [0,15)`. Tile `(tx,ty)` covers pixels `[tx*32, tx*32+32)`.
  Tile center = `(tx*32+16, ty*32+16)`. Out-of-map tiles: not walkable, sight-blocking.
- Angles: radians, `0` = east (+x), `+π/2` = south (+y) (clockwise on screen). Level data uses degrees where noted.
- Speeds in the spec are tiles/second; convert with `* TILE`.
- Time: seconds. Simulation advances ONLY through `game.step(DT)` with `DT = 1/60`.
- Randomness: ONLY `game.rng` (a `mulberry32` function). Seeded with `SHOT_SEED = 1337` in every mode (normal play
  too). Render code never calls the rng: per-entity random values (lantern flicker phase, ripple phase) are drawn
  once at level load (`game.loadLevel`) and stored on the entity (`guard.flickerPhase`, `level.ripplePhase`).

---------------------------------------------------------------------------------------------------
## 4. util.js (GPT) — exact contents

```js
const TILE = 32, COLS = 40, ROWS = 15, WIDTH = 1280, HEIGHT = 480;
const DT = 1 / 60;
const SHOT_SEED = 1337;
const DEG = Math.PI / 180;

const TUNING = {
  coneHalfAngle: 35 * DEG, coneRange: 256, coneRays: 80,
  exposureMax: 100, exposureFall: 35, exposureBase: 60, exposureNear: 140, sneakExposureMult: 0.6,
  guardPatrolSpeed: 1.6, guardSuspiciousSpeed: 0.8, guardAlertSpeed: 3.0,   // tiles/s
  guardTurnRate: 240 * DEG,                                                   // rad/s, smooth turning
  sweepAmplitude: 40 * DEG, sweepPeriod: 2.4,
  searchTime: 4, catchDistance: 0.6,                                          // s, tiles
  alertRepathInterval: 0.25,                                                  // s
  playerWalk: 2.4, playerSneak: 1.4, playerRadius: 10, guardRadius: 11,       // tiles/s, px
  screenReach: 3, screenSwing: 0.35, tooFarHintTime: 1.2, screenShakeTime: 0.25, // tiles, s
  stepIntervalWalk: 0.36, stepIntervalSneak: 0.6, guardStepInterval: 0.5, guardStepHearing: 12, // s, tiles
  pars: [45, 75, 100],
};

const COLORS = {
  background: '#0B1020',
  floor: '#141B2E', floorSeam: '#18203A',
  wallTop: '#3A466B', wallEdge: '#4A5568', wallFront: '#1E2540',
  cartTop: '#7A5638', cartBase: '#5A3E2B', cartFront: '#3E2A1D',
  umbra: 'rgba(0,0,0,0.35)',
  canal: '#0E2236', canalRipple: '#163352', lanternReflection: 'rgba(255,214,150,0.25)',
  bridge: '#3B2F24', bridgeSeam: '#2A2119',            // bridgeSeam: chosen here ("darker plank seams")
  screenPanel: '#8A6A44', screenLattice: '#6B5234', screenPivot: '#D8B67A',
  lampPost: '#2A3350', lampGlow: '#FFE3A8',
  coneStops: ['rgba(255,240,210,0.45)', 'rgba(255,196,110,0.30)', 'rgba(255,196,110,0)'], // at 0, 0.35, 1
  coneEdge: '#FFC46E', coneEdgeAlpha: 0.8,
  alertConeStops: ['rgba(255,220,210,0.45)', 'rgba(255,90,78,0.32)', 'rgba(255,90,78,0)'],
  alertConeEdge: '#FF5A4E',
  guardBody: '#C9A56A', guardOutline: '#5C4628',       // guardOutline: chosen here ("darker outline")
  lantern: '#FFE3A8',
  player: '#E8F1FF', playerOutline: '#0B1020',
  hidden: '#7FD1FF',
  patrolDots: 'rgba(255,196,110,0.18)',
  letter: '#F6E7C1', letterGlint: '#FFD36E',           // letterGlint: chosen here ("small gold glint")
  exitDim: '#2E6B60', exitLit: '#7FFFD4',
  hudBg: 'rgba(11,16,32,0.72)', hudText: '#EDEDED',
  seen: '#FFC46E', alert: '#FF5A4E',
};
const FONT = 'system-ui, sans-serif';

function mulberry32(seed) { /* standard mulberry32, returns () => float in [0,1) */ }
function clamp(v, lo, hi) {}
function lerp(a, b, t) {}
function angleDiff(a, b) {}        // signed shortest b - a, in (-π, π]
function tileCenter(tx, ty) {}     // -> {x, y} px
function pixelToTile(px) {}        // -> Math.floor(px / TILE)
function distance(ax, ay, bx, by) {}
```
Gemini A may need more drawing constants (sizes, alphas): define them in `render.js` as `const RENDER_STYLE = {...}`,
but every COLOR comes from `COLORS` (new colors → REQUESTS.md).

---------------------------------------------------------------------------------------------------
## 5. Level data and validation

### level-data.js (Gemini B)
```js
const LEVELS = [
  { name: 'Night Market', par: 45,
    map: [ /* 15 strings × 40 chars */ ],
    guards: [ { waypoints: [ { x: 5, y: 3, wait: 1.5 }, { x: 20, y: 3, wait: 1, face: 90 } ] } ],
    screens: [ { x: 12, y: 6, orientation: 'NS' } ],
    hints: [ { text: "Stay out of the lantern light.", x: 3, y: 2 }, { text: "Click a screen's pivot to turn it.", x: 10, y: 6 } ] },
  { name: 'Canal Quarter', par: 75, ... },
  { name: 'Gatehouse Court', par: 100, ... },
];
```
- Tile legend exactly as spec: `# . C ~ = S L P K X`.
- Waypoints: tile coords; `wait` seconds in [1, 2]; optional `face` (degrees, 0 = east, 90 = south) = base facing
  of the sweep at that waypoint (default: direction of arrival). Route is a LOOP (last → first).
- Screens: `x,y` = pivot tile (must be an `S` in the map); `orientation` `'NS'` or `'EW'` = starting orientation.
- `hints` optional (level 1 only): one-time capsules; `x,y` tile where the capsule is anchored.

### levels.js (GPT)
`parseLevel(def, index) -> level`:
```
{ index, number: index+1, name, par, rows: string[15] (copy of map),
  start: {tx,ty}, letter: {tx,ty}, exit: {tx,ty},
  lamps: [{tx,ty}], guards: def.guards, screens: def.screens, hints: def.hints || [] }
```
`tileAt(level, tx, ty) -> char` lives in grid.js (out of map → `'#'`). `P K X` tiles behave as `.`.

`validateLevel(level)` THROWS `Error('Level <n> <name>: <reason>')` unless ALL hold:
1. exactly 15 rows, each exactly 40 chars, only legend chars;
2. exactly one `P`, one `K`, one `X`;
3. every screen pivot is an `S`; number of `S` == number of screens; for both orientations, the 2 non-pivot tiles
   are in the map and are `.` (not P/K/X/walls/canal);
4. P → K → X reachable (player walkability, 4-neighbour BFS) for AT LEAST ONE combination of screen orientations
   (try all 2^n combinations, n ≤ 3);
5. every waypoint is on a walkable tile and not on any screen tile (either orientation);
6. every consecutive waypoint pair, including last → first, is BFS-reachable when ALL tiles of ALL screens in
   BOTH orientations count as blocked (so routes can never cross a screen tile);
7. `wait` within [1, 2].
`validateAllLevels()` validates every entry of `LEVELS` at startup; `game.js` shows the thrown message on screen
(state `'error'`, `drawLevelError`). Test hook: `?breaklevel=1` makes game.js validate a copy of level 1 with its
first row cut to 39 chars, to prove the error screen works.

---------------------------------------------------------------------------------------------------
## 6. Logic API (GPT). `world = { level, screens }` (screens = `LatticeScreen[]`)

### grid.js
| Function | Returns |
|---|---|
| `tileAt(level, tx, ty)` | char; out of map `'#'` |
| `isSightBlocking(world, tx, ty)` | `#`, `C`, out of map, or a CURRENT screen tile |
| `isWalkable(world, tx, ty)` | `. = P K X` and not a current screen tile (`S` pivot is always covered by its own panel) |
| `castRay(world, x0, y0, angle, maxDist)` | `{x, y, dist, blocked}` — DDA tile traversal, stops at the first sight-blocking tile's boundary |
| `hasLineOfSight(world, x0, y0, x1, y1)` | bool (DDA) |
| `findPath(world, fromTx, fromTy, toTx, toTy, isPassable?)` | array of `{tx,ty}` from the first step after `from` to `to` inclusive; `[]` if from == to; `null` if unreachable. 4-neighbour BFS, deterministic neighbour order E, S, W, N. Default passable = `isWalkable`. |

### screens.js — `class LatticeScreen`
- `constructor(def)` → `tx, ty, orientation ('NS'|'EW'), angle` (visual radians: EW = 0, NS = π/2), `swinging`
  (bool), `swingT` (0..1), `shakeT` (s left), `fromAngle`, `toAngle`.
- `tiles(orientation = this.orientation)` → 3 `{tx,ty}` (pivot ± 1 along the orientation).
- `allTiles()` → the 5 distinct tiles of both orientations.
- `canRotate(world, player, guards)` → `{ ok, reason: null | 'busy' | 'far' | 'occupied' }`. `far`: distance from
  player center to pivot center > `screenReach * TILE`. `occupied`: any target tile overlaps the player's circle
  or any guard's circle.
- `rotate()` → starts the 0.35 s swing (+90°, clockwise). Blocking stays on the OLD orientation until the swing
  ends; then `orientation` flips.
- `shake()` → sets `shakeT = screenShakeTime`.
- `update(dt)`.
Click flow (game.js): click on a pivot tile → `canRotate` → ok: `rotate()` + `sfx.creak()`; `far`: hint
"Too far to reach" for 1.2 s; `occupied`/`busy`: `shake()` + `sfx.thud()`.

### vision.js
- `castVisionCone(world, guard)` → `{ origin: {x,y}, points: [{x,y} × 80] }`; rays evenly from
  `facing - half` to `facing + half` inclusive, each `castRay(..., coneRange)`. Polygon = origin + points.
- `pointInCone(world, guard, x, y)` → bool: `|angleDiff(facing, angleTo)| ≤ half`, distance ≤ 256,
  `hasLineOfSight`. Detection uses the PLAYER CENTER.

### guard.js — `class Guard`
- Fields read by others: `x, y, facing, state ('PATROL'|'SUSPICIOUS'|'ALERT'|'SEARCH'|'RETURN'), cone`
  (latest `castVisionCone` result, refreshed every tick by `update`), `seesPlayer` (bool this tick),
  `lastSeen` `{tx,ty}|null`, `path` (current BFS path, tiles), `route` (array of `{x,y}` px: the full patrol loop
  following BFS paths between waypoints, for drawing), `flickerPhase`, `stepTimer`.
- `constructor(def, world, rng)`; starts at waypoint 0 in PATROL.
- `setState(name, opts)` — the ONLY way state changes (shots.js uses it too); plays nothing itself, returns the
  previous state. Game reacts to transitions (sounds, timesSeen).
- `update(dt, world, player, exposure)`; transition table (evaluated after the exposure update of the same tick):

| From | Condition | To |
|---|---|---|
| PATROL / RETURN / SEARCH | sees player AND exposure > 0 | SUSPICIOUS |
| any but ALERT | sees player AND exposure ≥ 100 | ALERT (game: `timesSeen += 1`, `sfx.alert()`) |
| SUSPICIOUS | exposure == 0 | RETURN (→ PATROL at once if already on its route) |
| ALERT | within `catchDistance` tiles of player (center to center) | game state `'caught'` |
| ALERT | reached `lastSeen` tile center and does not see player | SEARCH |
| ALERT | no BFS path to `lastSeen` | SEARCH (at its current tile) |
| SEARCH | 4 s elapsed (facing sweeps one full turn) | RETURN |
| RETURN | reached nearest waypoint (BFS) | PATROL (continue from that waypoint) |

  PATROL: walk BFS path between waypoints at 1.6 tiles/s, facing turns toward travel direction at
  `guardTurnRate`; at each waypoint wait `wait` s, facing = base ± 40° on a sine of period 2.4 s.
  SUSPICIOUS: turn toward the player; move toward `lastSeen` at 0.8 tiles/s; "?" shown.
  ALERT: `lastSeen` = player tile while seen; BFS to it at 3.0 tiles/s, re-path every 0.25 s or when `lastSeen`
  changes; "!" shown; red cone. Only an ALERT guard catches.

### player.js — `class Player`
- Fields: `x, y, radius (10), sneaking, moving, facing, stepTimer, hidden`.
- `move(world, input, dt)` — input = `{ dx, dy, sneak }` (dx, dy ∈ {-1,0,1}; diagonal normalised);
  axis-separated circle-vs-tile collision (move X, resolve, move Y, resolve) → sliding.
- `coverTileNearby(world)` → array of `{tx, ty, kind: 'wall'|'cart'|'screen', screenIndex}` for cover tiles in
  the 3×3 block around the player's center tile. Cover = `#`, `C`, current screen tiles.
- `isHidden(world, guards)` → not inside any guard's cone (`pointInCone`) AND `coverTileNearby(...).length > 0`.
  Display only; it changes nothing in detection.
- `interact(world, game)` → `'letter'` when the letter is not taken and the player's center tile is within
  Chebyshev distance 1 of K; `'exit'` when the letter is taken and the center tile is X; else `null`.

### game.js — `class Game` (state read by render/ui/shots)
```
state: 'title'|'playing'|'paused'|'caught'|'results'|'ending'|'error'
errorMessage, levelIndex, level, world, player, guards[], screens[]
exposure (0..100), seenBy (guard|null: nearest seeing guard), hasLetter, timesSeen, elapsed (s, level timer)
time (s, total sim time, drives animations), rng, shot (0 or 1..4), muted
hints: [{ text, x, y (px anchor), until (time) }], hover: { screen: LatticeScreen|null, inReach: bool },
mouse: {x, y} (canvas px), results: { title, time, timesSeen, stars, par, completed: [b,b,b] } | null
unlocked: [b,b,b], titleSelection (0..2), sfx (Sfx)
```
Methods: `loadLevel(index)` (fresh run of a level; draws per-entity phases from `rng`), `restartLevel()`,
`step(dt)` (one fixed tick of whatever the state is; order: input → player.move → screens.update → exposure →
guards.update → catch / interact checks → timers/hints), `render()` (calls `renderFrame(ctx, game)` then the ui
overlay for the state), `boot()`.
Exposure (one global meter): `rate = (60 + 140 * (1 - d/256)) * (sneaking ? 0.6 : 1)` per s, `d` = distance to
the nearest guard that sees the player; else `-35` per s; clamp [0, 100].
Stars: 3 = timesSeen 0 and time ≤ par; 2 = timesSeen 0; 1 otherwise. Results title "DELIVERED UNSEEN" iff
timesSeen == 0 else "DELIVERED". Progress save: `localStorage` key `unlitHour.progress`, every access in
try/catch, never required.
Keys (`event.code`): WASD/arrows move, Shift sneak, E interact, R restart (playing/paused/caught), Esc pause toggle,
M mute, Enter confirm, 1-3 + arrows on title for level select. Click: screens.
Test hooks: `window.__unlit = game` (always). `?shot=N` shot mode, `?breaklevel=1` error-screen test.
Shot mode: add class `shot` to `<html>`, never start the rAF loop, `applyShot(game, N)`, `render()` once, then
`window.__shotReady = true; window.__SHOT_READY = true; document.title = 'READY'`.

---------------------------------------------------------------------------------------------------
## 7. Render / UI / shots API (Gemini A)

Everything draws on the single 2D context of the 1280×480 canvas (backing store always exactly 1280×480; CSS scales).
Every function is pure drawing: reads `game`, never mutates it, never calls `game.rng`.

render.js:
- `renderFrame(ctx, game)` — the ONLY render entry game.js calls while a level is visible (also under pause/
  caught/results overlays). Gemini A decides the internal order; recommended: background → `drawLevel` (floor,
  seams, canal, bridges) → `drawPatrolRoutes` → `drawWater` (level 2 reflections) → `drawCones` →
  `drawWallFaces` (umbras, walls, carts, lamps, 2.5D faces) → `drawEntities` (letter, exit, screens incl.
  swing arc + shake + hover ring, ALERT path + last-seen marker, guards + "?"/"!", player) → `drawCoverOutline`
  → `drawHiddenBadge` → `drawHud`.
- `drawCapsule(ctx, text, x, y, opts)` shared capsule helper (ui.js uses it).
ui.js: `drawTitle(ctx, game)`, `drawPause`, `drawCaught`, `drawResults`, `drawEnding`, `drawHint`,
`drawLevelError(ctx, message)`, and `drawOverlay(ctx, game)` = dispatch by `game.state` (game.js calls it after
`renderFrame`; on `'title'`/`'ending'`/`'error'` game.js calls only `drawOverlay`).
shots.js: `const SHOTS = { 1: {...}, 2: {...}, 3: {...}, 4: {...} }`, `applyShot(game, n)`: loads the level,
places player/guards/screens/state via public fields and `guard.setState`, then advances with `game.step(DT)` a
fixed number of ticks. Never uses anything but `game.rng`.
Visual spec = spec section ART DIRECTION + THE FOUR SCREENSHOTS, word for word. Remember the judge sees the
cover at most 768×288 and the other three far smaller: contrast and outlines must survive that.

---------------------------------------------------------------------------------------------------
## 8. Audio API (Gemini B) — `class Sfx`

`constructor({ silent })` (silent = shot mode: every method is a no-op). `unlock()` — create the AudioContext; game
calls it on the first keydown/click ONLY. Before unlock every method is a silent no-op (no warnings).
`step(sneaking)`, `guardStep(pan, gain)` (pan −1..1, gain 0..1; game calls it for each moving guard every
0.5 s, gain falling to 0 at 12 tiles — "footsteps that tell you where a guard is"), `creak()`, `thud()`,
`suspect()`, `alert()`, `chime()`, `gate()`, `startAmbience()`, `stopAmbience()`, `setMuted(bool)`, `muted`.
WebAudio synthesis only (oscillators, filtered noise from a generated buffer). The noise buffer may use its own
local mulberry32 (never Math.random).

---------------------------------------------------------------------------------------------------
## 9. README (Gemini B, later task) — required by the kit

Must contain, as images each wrapped in a link to `https://make.fun/c/best-stealth-game-20261121-1759`:
`https://make.fun/badge/best-stealth-game-20261121-1759.svg`,
`https://make.fun/badge/best-stealth-game-20261121-1759/qcl1019-hub/the-unlit-hour/rank.svg`,
`https://make.fun/badge/best-stealth-game-20261121-1759/qcl1019-hub/the-unlit-hour/reward.svg`.
(README is outside game/, so the "no http in game/" rule does not apply to it.)

---------------------------------------------------------------------------------------------------
## 10. Delivery format and evidence

- Each delivery = a report `docs/team/reports/<WHO>-<n>.md` with: files touched; the exact commands run; their
  exit codes and the relevant output (pasted, not summarised); screenshots of the result (saved under
  `docs/team/evidence/`, never under game/ or screenshots/); what is NOT done or not tested.
- "Passed" only for a check that was actually run. Never weaken a check to make it pass.
- GPT verifies every Gemini delivery itself (runs the checks again) before committing it.
- Chrome command lines always include `--do-not-de-elevate` (VS Code runs elevated).
- Timeline target (UTC): Gate 1 (logic, after Step 5) ~23:30 · SUBMIT 1 (Step 9) ~01:30 · FINAL ~04:30 ·
  deadline 05:59 hard.
