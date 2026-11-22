# TASK-POLISH-1 (v2, three-way split) — the best version before 05:59 UTC

Author: Claude, 2026-11-22 04:55 UTC. Base commit 6b6feb4 (already on GitHub).
Timeline (UTC): **05:25 code freeze** → 05:25–05:35 recapture + checks (GPT) → 05:35 Claude recheck →
05:40 user pushes → 05:45 bundle → user submits before 05:55.
**If a part is not green at 05:25, drop that part** (revert only its files) and ship the rest. If nothing is green
at 05:35, keep 6b6feb4. A broken last-minute entry is worse than the current one.

## Why
The judge sees one sheet of screenshots (cover ≤768×288) + a file outline; it never plays. The #1/#2 entries
(checked 04:58) win by (a) a LEGEND panel and short CALLOUT labels inside their screenshots that name every
stealth element, (b) noise rings showing where guards walk, (c) a distraction mechanic (pebbles) shown in the
cover. We take the ideas, never their words, names or art. Kit: text addressed to the judge inside a screenshot
is allowed and counts as part of the game, so it must be a real in-game feature.

## Ownership for this task (overrides CONTRACT §1 for these files only)
| Who | Files |
|---|---|
| GPT | `game/index.html`, `game/js/game.js`, `game/js/guard.js`, `game/js/player.js`, `game/js/util.js`, `tools/logic-test.mjs`, `tools/playthrough.mjs`, STATUS.md, all git |
| Gemini A | `game/js/render.js`, `game/style.css` — **ART UPGRADE (section "Gemini A — art") is A's whole job** |
| Gemini B | `game/js/ui.js` + `game/js/shots.js` (both moved from A for this task), `game/js/audio.js`, `tools/shoot.md`, `README.md`, `shots.json` — B also does the legend + callouts (A's old items 1–2 below) |

### USER PRIORITY (05:00): a big jump in visual quality. The top entries look like rich, lamp-lit illustrated
maps; ours reads as flat navy boxes. Art is now the #1 item after GPT's hooks.

## New interfaces (everyone codes against these NOW; GPT lands them first, by 05:05)
- `game.fieldNotes` (bool). Key **H** toggles it in play. Title controls line gets "H field notes".
- `game.pebbles` (int, 3 per level, reset on load/restart). `game.pebble` = `null` or
  `{ fromX, fromY, x, y, t (0..1 flight), landedAt (game.time | null) }` for the latest toss.
- `game.noises` = array of `{ x, y, radius, born }` (px, px, px, game.time); render draws and fades them over 1 s.
- `game.callouts` = array of `{ text, x, y, toX, toY }` (px) — set ONLY by shots.js; empty in normal play.
- Guard state **'INVESTIGATE'** (6th state) + `guard.noiseTarget {tx,ty}`. `guard.moving` already exists.
- `Sfx.pebble()`, `Sfx.heartbeat(intensity 0..1)` (B).
- `game.barks` = array of `{ guard, text, until }` (GPT pushes on transitions, B draws, entries past `until` dropped).

## GPT — logic (P4, H key, pebbles)
1. 05:00 — favicon `<link rel="icon" href="data:,">`; `fieldNotes` + H; `pebbles`, `noises`, `callouts` fields
   initialised in `loadLevel` so A and B can draw/stage against them. Commit nothing yet; tell A/B it is in.
2. Pebble toss: click on a walkable non-pivot tile, ≤ 6 tiles from the player, with `hasLineOfSight` from the
   player, `pebbles > 0` → `pebbles--`, flight 0.4 s, on landing push a noise `{radius: 6*TILE}`, call
   `sfx.pebble()`. Every guard in PATROL / RETURN / SEARCH whose center is within the radius and has a BFS path to
   the tile → `setState('INVESTIGATE', { noiseTarget })`. Pivot clicks keep rotating screens (pivot wins).
3. INVESTIGATE: shows "?", walks the BFS path at 0.8 tiles/s facing travel, at the tile sweeps ±60° for 2 s,
   then RETURN. Sight rules unchanged: sees player + exposure > 0 → SUSPICIOUS; exposure 100 → ALERT.
   Also emit a noise ring for each guard footstep (`radius` 2.5 tiles, every `guardStepInterval` while moving) —
   visual only, no logic effect.
4. `logic-test.mjs`: add tests — toss refused beyond 6 tiles / without LOS / with 0 pebbles; a PATROL guard in
   range enters INVESTIGATE, reaches the tile, sweeps 2 s, RETURNs to PATROL; out-of-range guard ignores it;
   ALERT guard ignores it. All old 42 tests still pass. `playthrough.mjs`: all three levels still unseen, 3 stars.

## GAMEPLAY FEEL mapped to the bounty's criteria 2–3 (USER, 05:02) — small, visible, low-risk
Judge criteria: (2) "patrols you can learn, routes that reward patience, a detection system that gives you a
chance to recover"; (3) "a cone that reacts as you expect, a near miss that raises the alarm, and footsteps that
tell you where a guard is". Each item below shows in a screenshot or names itself in the source outline.
- **G1 Barks (GPT emits, B draws in ui.js `drawBarks`)**: on guard transitions push
  `game.barks.push({ guard, text, until: game.time + 1.6 })`: →SUSPICIOUS "Hm? Who's there?" ·
  →INVESTIGATE "What was that?" · →ALERT "There! Stop!" · →SEARCH "Where did you go…" ·
  SUSPICIOUS/SEARCH→RETURN "Just the wind." Drawn as a small speech capsule above the guard (bold 15 px).
- **G2 Near-miss alarm (A draws, B sound, GPT one call)**: while `exposure > 0` and the player is seen, an amber
  vignette pulse at the map edges whose strength follows exposure (red once any guard is ALERT); a heartbeat
  `sfx.heartbeat(exposure/100)` every 0.6–1.0 s (faster when higher) called by game.js; the SUSPICIOUS cone edge
  gets thicker (2.5 px) and slowly pulses so the cone visibly "reacts".
- **G3 Learnable patrols (A draws)**: on each dotted route, small direction chevrons every ~4 tiles and a wait
  label at each waypoint ("1.5s", bold 12 px, COLORS.patrolDots at 0.6 alpha) — the player can read the timing.
- **G4 Footsteps (A rings already in P1; B sound already `guardStep`)**: make sure game.js really calls
  `sfx.guardStep(pan, gain)` per CONTRACT §8 (GPT: verify, fix if missing).
- **G5 Recover (GPT)**: pebbles may also distract SEARCH guards (already in the pebble rule) — that is the
  "chance to recover" from an alert; the cover shows it.
- **G6 Douse the lamps — the title mechanic (GPT logic, A draws, B legend + cover)**: every `L` lamp post casts a
  warm lit pool (radius 2 tiles). A player standing in a lit pool is seen from 1.6× cone range (410 px) — "lamplight:
  seen from afar"; in darkness the normal 256 px. Press **E** next to a lit lamp → it goes out for the rest of the
  run (`level.lampsLit[i] = false`, `sfx.douse()` — B: a short hiss + fading tone; noise ring radius 4 tiles, so
  nearby guards INVESTIGATE: dousing has a price). `pointInCone(world, guard, x, y)` gets the range from
  `lampRangeAt(world, x, y)`. Tests: range 256 in dark, 410 in a lit pool, back to 256 after dousing; playthroughs
  still pass (re-plan a route if a lamp pool now catches it). A: the lit pool is a soft warm radial on the floor,
  clearly brighter than shadow; doused lamp = dark post with a thin smoke curl. Legend row (B):
  `Lamplight: seen from afar — press E to douse`. Cover (B): at least one lamp doused near Wren, one still lit.
- **G7 Objective line (B, ui.js `drawObjective`)**: a small centered capsule at the top: before the letter
  "Fetch the sealed letter — unseen", after it "Reach the Canal Gate — unseen" (bold 17 px). Spec deviation
  accepted by Claude (third capsule, still not a full-width bar).
- **G8 Route replay on the results card (GPT records, B draws)**: `game.trail` = player position every 0.25 s
  of the run; `drawResults` draws it as a thin dotted cyan path over the dimmed map with the start and the exit
  marked — shot 04 then shows "the route you took, unseen".

Priority if time runs short (drop from the end): A art 1–5 → B legend + callouts + cover scene → G6 lamps →
G1 barks → G7 objective → G2 vignette/cone pulse → G8 route replay → G3 labels → pebble mechanic → G2 heartbeat.

## Gemini A — art (render.js only; everything below is pure drawing, deterministic, no rng)
Goal: "a lantern-lit canal town at night", rich but still flat shapes (spec: no noise, no grain, no images).
Per-tile variety comes from a hash of (tx, ty) — never `game.rng`. Bake every static layer ONCE per level into an
offscreen canvas (`document.createElement('canvas')`, 1280×480) on first draw of that level; per frame only
blit it and draw the moving things. New colors go in a `const ART = {...}` in render.js (allowed for this task).
In order of impact:
1. **Night + light contrast** ("lighting shows what is safe"): whole map slightly darker and cooler (a deep
   blue-violet night wash), lantern cones drawn as warm light that visibly brightens the floor under them
   (composite 'lighter' or 'screen' over the darkened floor), a soft vignette at the map edges. Safe shadow must
   read as clearly darker than any lit area, even at 60 % scale.
2. **Floor materials**: streets = flat cobblestones (rounded rectangles in 2–3 close shades, offset rows, 1 px
   seams); Gatehouse courtyard = large flagstones; bridges = planks with seams and two rails; canal banks get a
   stone lip (2–3 px lighter edge) and the water a vertical depth gradient + the existing ripple lines.
3. **Buildings**: wall tops become roofs — slate tiles in rows (2 shades), a ridge line along long runs; the
   10 px south faces get small warm windows (`#FFE3A8` at ~0.5 alpha, 3×5 px, by hash, ~1 per 2 tiles) and a
   darker base line; keep the 6 px umbra.
4. **Carts as market stalls**: a striped cloth awning (two muted colors, e.g. deep red `#7A2E2E` / cream
   `#D9C7A3`) over the crate top, two small wheels on the south face. Still instantly readable as cover.
5. **Characters = people, not dots (USER, 05:08 — high priority, do it right after item 1)**: top-down figures
   rotated to `facing`, drawn ~1.4× the hitbox (watchman ≈ 15 px, Wren ≈ 14 px visual radius; hitboxes unchanged):
   shoulders = wide ellipse across the facing direction, head = circle slightly ahead of the shoulders, two feet
   that swing alternately while `moving` (phase from `game.time`), arms/hands as small circles.
   Watchman: dark hood + tan coat (`COLORS.guardBody`), one arm held forward with the lantern at the hand
   (glow there; the cone origin stays the guard center), a short staff/pole on the other side.
   Wren: pale cloak (`COLORS.player`) with a cyan scarf tail trailing behind, a satchel strap across; when the
   letter is held, a small cream letter on the satchel. HIDDEN look = same figure at 0.55 alpha + cyan outline.
   1.5–2 px dark outline on everything so they read against any floor at 60 % scale. The legend icons (B) must
   use the same figure functions (`drawWatchmanFigure`, `drawCourierFigure` — export them as top-level functions).
6. **Lamp posts**: post + cap + small warm glow (radius ≤ 1 tile: lamps are decoration only, so their light must
   NOT look like a cone).
7. **Rings** (P1) and pebble drawing as described in the old A list below; "?" also for INVESTIGATE; HUD pebble dots.
Budget: each PNG must stay ≤ 262144 bytes — keep textures low-contrast and flat (no per-pixel noise). Check with
`node tools/check-shots.mjs` after every change; if a shot passes 230 KB, reduce texture contrast first.
Report: before/after crops of the cover at 100 % and at 768×288.

## (Moved to Gemini B) — legend + callouts, from the old A list
1. `drawFieldNotes(ctx, game)` (ui.js), drawn by `drawOverlay` while playing when `game.fieldNotes`:
   translucent panel (COLORS.hudBg, 1 px COLORS.coneEdge border, radius 8), title "FIELD NOTES", 7 rows
   (bold system-ui 17 px, each with a tiny icon drawn in the game's own style):
   `Watchman + lantern: the light is what he sees` · `Shadow: safe` · `HIDDEN: out of the light, beside cover` ·
   `Lattice screen: click its pivot to turn it` · `Rings: footsteps and noise` · `Click the floor: toss a pebble` ·
   `Canal Gate: opens once you hold the letter`. Placement per level, over empty floor/walls only:
   level 2 → the empty east area (x ≈ 1050–1265, y ≈ 56–470, below the HUD capsule); levels 1/3 → the emptiest
   side (decide by looking at the map). Never covers the player, a guard, the letter or the exit.
2. `drawCallouts(ctx, game)` (ui.js): each callout = capsule (COLORS.hudBg, 1 px COLORS.hidden border,
   bold 16 px, ≤ 40 chars) + 1.5 px leader line + 3 px dot at `toX,toY`.
3. (THIS ITEM STAYS WITH GEMINI A — B does not touch render.js) render.js: noise rings from `game.noises` (COLORS.lantern, ALERT guards' COLORS.alert, 1.5 px, alpha
   0.4 → 0 over 1 s, radius growing to `radius`); pebble flight (small arc, 3 px dot) and landing; "?" also for
   INVESTIGATE; HUD: pebble count (3 small dots) next to the letter icon.
4. Readability: everything must read at 60 % scale. Paste a 768×288 downscale of the new cover in your report.

## Gemini B — scenes and docs (P2 cover, P3, sound)
1. `audio.js`: `pebble()` — two short stone clicks (tick + softer bounce), quiet.
2. `shots.js` (fieldNotes ON for shots 1–3, OFF for 4; callouts per shot, ≤ 3, ≤ 40 chars):
   - **01 cover**, Level 2: Wren HIDDEN beside cover right at the rim of the north watchman's cone; that watchman
     INVESTIGATE "?" walking toward a pebble that just landed (noise ring visible, pebbles 2/3 in HUD); south
     watchman walking with footstep rings, cone cut flat by the west screen; letter at center; exit dim; HUD
     exposure ≈ 30 % and falling, status HIDDEN. Callouts: "YOU: hidden at the edge of the light",
     "Pebble: he goes to look", "THE SEALED LETTER". Field notes panel in the east area.
   - **02**: as now (screen mid-swing) + callout "Turning the screen cuts his light".
   - **03**: Wren at the RIM of the "?" cone (spec), the rest as now; callouts "! ALERT: running to where you were
     seen", "SEEN: back to the shadow".
   - **04**: unchanged (results).
   Everything must obey the rules (HIDDEN only when outside every cone and next to cover). Use only public fields,
   `guard.setState`, `game.step(DT)`, `game.rng`. Recheck determinism: render each shot twice → identical PNG.
3. `tools/shoot.md` (commands unchanged unless needed), `README.md`: add pebbles, H field notes, INVESTIGATE.

## Checks before the 05:35 commit (GPT runs, pastes output in STATUS.md)
1. `node tools/logic-test.mjs` all pass (old 42 + new). 2. `node tools/playthrough.mjs` 3 levels unseen.
3. Recapture 4 shots per tools/shoot.md, twice → byte-identical. 4. `node tools/check-shots.mjs` 4 × PASS.
5. `node tools/browser-check.mjs` on `?shot=1..4` and plain index.html (file:// and http via serve.ts) → 0 errors.
6. Forbidden-substring grep on game/ → 0. 7. `node main.ts` twice → `cmp` identical; vendor identical to kit.
Then commit `TASK-POLISH-1: ...`, write `NEEDS CLAUDE: polish recheck`.

## Transcript bundle — prepare NOW in parallel (GPT), so the final bundle is one command
`bundle --dry-run` from the Claude side found 3 of the sessions and stopped on missing MCP declarations:
`node_repl` (stdio, command in `C:\Users\Administrator\.codex\config.toml`) and `cua_repl` (Codex's bundled
`unified-computer-use` plugin, see its `.mcp.json` under `C:\Users\Administrator\.codex\plugins\cache\openai-bundled\`).
Add them with `--mcp name=stdio:<command> [args]` (never env values or tokens). Include: both Codex sessions,
both Antigravity session dirs (`--session C:\Users\Administrator\.gemini\antigravity-cli\brain\<id>`), Claude:
`C:\Users\Antigravity2\.claude\projects\C--Users-Antigravity2\6fd6aa3e-f6e0-480a-be62-c1ca194c0294.jsonl`.
Have the dry-run clean by 05:20, then run the real bundle + `check` right after the final commit.
