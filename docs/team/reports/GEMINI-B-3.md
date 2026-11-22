# GEMINI-B-3 Delivery Report — Polish Scenes, Field Notes, Callouts, Barks, Objective, Route Trail, Audio, and Docs

Owner: Gemini B  
Task: `docs/team/TASK-POLISH-1.md` (G1 `drawBarks`, G2 `heartbeat`, G6 `douse` + legend + cover, G7 `drawObjective`, G8 results trail + Shot 04 replay, `drawWatchmanFigure`/`drawCourierFigure` legend icons with fallback, `pebble`, `drawFieldNotes`, `drawCallouts`, docs)

## 1. Files Touched (Assigned Only)

- `game/js/audio.js` — Added `Sfx.pebble()` (two quiet stone clicks), `Sfx.heartbeat(intensity)` (exposure-scaled low double-pulse), and `Sfx.douse()` (filtered noise hiss + fading tone). All silent/pre-unlock no-ops, zero forbidden APIs.
- `game/js/ui.js` —
  - Updated `drawTitle` controls line to include `'Click pivot screen / floor pebble'` and `'H field notes'`.
  - Added `UI_FIELD_NOTE_ROWS` (8 rows, including G6 `'Lamplight: seen from afar — press E to douse'`), `uiDrawNoteIcon` (shares `drawWatchmanFigure` / `drawCourierFigure` at `{x:0,y:0,facing:0,moving:false}` in a scaled mini-canvas with fallback until A's exports land), `uiCollectProtectedCircles`, `uiBoxIsSafe`, `uiPickFieldNotesBox`, and `drawFieldNotes(ctx, game)` (uses the default per-level box whenever clear of player, guards, letter, and exit; otherwise selects a safe corner/edge candidate and omits the panel only if no candidate fits).
  - Added G7 `drawObjective(ctx, game)` (`'Fetch the sealed letter — unseen'` / `'Reach the Canal Gate — unseen'`, bold `17px`, centered top capsule).
  - Added `drawCallouts(ctx, game)` and G1 `drawBarks(ctx, game)`, wired into `drawOverlay`.
  - Added G8 route replay in `drawResults(ctx, game)` drawing `game.trail` as a thin dotted cyan path with start and exit markers behind the results panel.
- `game/js/shots.js` —
  - **Shot `1` (`01-overview`)**: Level 2 cover with `game.level.lampsLit[1] = false` (lamp at `(18, 2)` doused near Wren/north watchman while other lamps remain lit), landed pebble via `game.pebble` (`t: 1`, `landedAt: game.time`) at `(20, 4)`, north watchman `INVESTIGATE` (`"?"`), Wren `HIDDEN` at `(16, 6)` behind cart `(16, 5)` at the cone rim (`exposure ~27%` falling), south watchman walking west with footstep ring and screen-cut cone, `fieldNotes: true`, and 3 callouts.
  - **Shot `2` (`02-turn-the-screen`)**: Mid-swing screen + `HIDDEN`, `fieldNotes: true`, callout `'Turning the screen cuts his light'`.
  - **Shot `3` (`03-close-call`)**: Advances `ticks: 1` from `exposure: 58.8` with Wren at `(776, 213)` and north watchman at `(19, 5)` facing `-21°` so Wren ends at the visible southern cone rim (`angleOffDeg: 30.7°`, `rimPx: 11.6 px`, `exposure: 59.9%`, `sees: true`, `SUSPICIOUS` `"?"` + `"Hm? Who's there?"` bark), `ALERT` watchman (`!`), `fieldNotes: true`, and 2 callouts.
  - **Shot `4` (`04-delivered`)**: Replays the exact zero-exposure Gatehouse Court input sequence from `tools/playthrough.mjs` (`D100 S125 D300 W50 D25 W50 E5 D350 S100 D150 W125 E5`) via `Game.step(DT)`, producing `state === 'results'`, `DELIVERED UNSEEN`, `time: 23.0 s`, `timesSeen: 0`, `stars: 3`, and a genuine 93-point `game.trail`, with `fieldNotes: false` and `callouts: []`.
- `README.md` & `tools/shoot.md` — Updated for pebbles, `INVESTIGATE`, barks, `H` Field Notes, G6 lamp dousing, G7 objective, G8 results trail, and `douse()`/`pebble()`/`heartbeat()` audio.
- `shots.json` — Verified unchanged and matching `?shot=1..4`.
- `docs/team/evidence/B-3-cover-60pct.png`, `B-3-shot1.png`, `B-3-shot4.png` — Visual evidence (`768×288` cover downscale and `1280×480` shots 1 & 4).
- `docs/team/reports/GEMINI-B-3.md` — This report.

No `git` commands were run; `screenshots/` was not overwritten; no session logs were altered.

## 2. Checks Run & Actual Outputs

### A. Forbidden-Substring Grep, Strict Parse, VM Load, `Sfx` Checks, Doc Links, `logic-test.mjs`, `playthrough.mjs`, Live WebAudio, & `main.ts`
Exit code: `0`
```text
FORBIDDEN_GREP_HITS=0
VM_AND_SFX_OK drawFieldNotes=function drawCallouts=function drawBarks=function drawObjective=function applyShot=function preCtx=null
BADGE OK: https://make.fun/badge/best-stealth-game-20261121-1759.svg
BADGE OK: https://make.fun/badge/best-stealth-game-20261121-1759/qcl1019-hub/the-unlit-hour/rank.svg
BADGE OK: https://make.fun/badge/best-stealth-game-20261121-1759/qcl1019-hub/the-unlit-hour/reward.svg
README_LINK OK: ... (22/22 links OK)
LINK_PATH_ERRORS=0
Logic checks: 55 passed, 0 failed
PASS Night Market: 20.52s, peak exposure 0, alerts 0, stars 3
PASS Canal Quarter: 23.02s, peak exposure 0, alerts 0, stars 3
PASS Gatehouse Court: 23.02s, peak exposure 0, alerts 0, stars 3
PASS title → all three deliveries → ending → title
EVAL: "{\"preCtxNull\":true,\"unlocked\":true,\"muted\":false}" (incl. pebble, heartbeat, douse)
CONSOLE_ISSUES: 0  EXCEPTIONS: 0  OUTSIDE_REQUESTS: 0
DOSSIER_BYTES=718265 DOSSIER_TEXT_CHARS=148353
```

### B. Headless Chrome `?shot=1..4` Readiness & G6/G7/G8 State Check
Exit code: `0`
```text
=== SHOT 1 ===
EVAL: {"title":"READY","shotReady":true,"SHOT_READY":true,"state":"playing","level":"Canal Quarter","exposure":27,"pebbles":2,"pebbleT":1,"lampsLit":[true,false,true,true,true,true],"trailLen":1,"fieldNotes":true,"callouts":3,"hasLetter":false,"hidden":true,"guards":["INVESTIGATE","PATROL"],"results":null}
CONSOLE_ISSUES: 0  EXCEPTIONS: 0  OUTSIDE_REQUESTS: 0
=== SHOT 2 ===
EVAL: {"title":"READY","shotReady":true,"SHOT_READY":true,"state":"playing","level":"Canal Quarter","exposure":0,"pebbles":3,"lampsLit":[true,true,true,true,true,true],"trailLen":1,"fieldNotes":true,"callouts":1,"hasLetter":false,"hidden":true,"guards":["PATROL","PATROL"],"results":null}
CONSOLE_ISSUES: 0  EXCEPTIONS: 0  OUTSIDE_REQUESTS: 0
=== SHOT 3 ===
EVAL: {"title":"READY","shotReady":true,"SHOT_READY":true,"state":"playing","level":"Gatehouse Court","exposure":58.3,"pebbles":3,"lampsLit":[true,true,true,true,true,true],"trailLen":1,"fieldNotes":true,"callouts":2,"hasLetter":true,"hidden":false,"guards":["SUSPICIOUS","ALERT","PATROL"],"results":null}
CONSOLE_ISSUES: 0  EXCEPTIONS: 0  OUTSIDE_REQUESTS: 0
=== SHOT 4 ===
EVAL: {"title":"READY","shotReady":true,"SHOT_READY":true,"state":"results","level":"Gatehouse Court","exposure":0,"pebbles":3,"lampsLit":[true,true,true,true,true,true],"trailLen":93,"fieldNotes":false,"callouts":0,"hasLetter":true,"hidden":true,"guards":["PATROL","PATROL","PATROL"],"results":{"title":"DELIVERED UNSEEN","time":23.01666666666664,"timesSeen":0,"stars":3,"par":100,"completed":[true,true,true]}}
CONSOLE_ISSUES: 0  EXCEPTIONS: 0  OUTSIDE_REQUESTS: 0
```

### C. Repeat Determinism Capture & `tools/check-shots.mjs`
Captured twice into `D:\unlit-scratch\polish-1` and `D:\unlit-scratch\polish-2`, exit code `0`:
```text
SHOT 1 (01-overview.png): bytes=199576 byte_equal=True
SHOT 2 (02-turn-the-screen.png): bytes=197041 byte_equal=True
SHOT 3 (03-close-call.png): bytes=201908 byte_equal=True
SHOT 4 (04-delivered.png): bytes=170569 byte_equal=True
PASS 01-overview.png 1280x480 199576B
PASS 02-turn-the-screen.png 1280x480 197041B
PASS 03-close-call.png 1280x480 201908B
PASS 04-delivered.png 1280x480 170569B
CHECK_SHOTS_EXIT=0
COVER_60PCT: 768x288 bytes=247144
```

### D. Field Notes Dynamic Safe-Placement Check (`D:/unlit-scratch/b3-fieldnotes-test.mjs` & Live Play)
Exit code: `0`
```text
FIELD_NOTES_SAFE_PLACEMENT_OK L2_default=806,274 L2_fallback=786,54 L3_default=200,332 crowded=null
Logic checks: 55 passed, 0 failed
PASS Night Market: 20.52s, peak exposure 0, alerts 0, stars 3
PASS Canal Quarter: 23.02s, peak exposure 0, alerts 0, stars 3
PASS Gatehouse Court: 23.02s, peak exposure 0, alerts 0, stars 3
PASS title → all three deliveries → ending → title
```

### E. Final Shot `03` Rim Probe & Recapture Verification
Command:
```powershell
node tools/browser-check.mjs --url "file:///D:/the-unlit-hour/game/index.html?shot=3" --wait 400 --eval "(() => { const g = window.__unlit, n = g.guards[0], p = g.player; const d = Math.hypot(p.x - n.x, p.y - n.y); const a = Math.atan2(p.y - n.y, p.x - n.x); const diff = Math.abs(angleDiff(n.facing, a)) / DEG; const rimPx = d * Math.sin(Math.max(0, 35 - diff) * DEG); return { ready: window.__shotReady, title: document.title, state: g.state, exposure: Math.round(g.exposure * 10) / 10, sees: n.seesPlayer, guardState: n.state, dist: Math.round(d * 10) / 10, angleOffDeg: Math.round(diff * 10) / 10, rimPx: Math.round(rimPx * 10) / 10, guards: g.guards.map(x => x.state), bark: g.barks.map(b => b.text) }; })()"
```
Exit code: `0`
```text
EVAL: {"ready":true,"title":"READY","state":"playing","exposure":59.9,"sees":true,"guardState":"SUSPICIOUS","dist":156,"angleOffDeg":30.7,"rimPx":11.6,"guards":["SUSPICIOUS","ALERT","PATROL"],"bark":["Hm? Who's there?"]}
CONSOLE_ISSUES: 0  EXCEPTIONS: 0  OUTSIDE_REQUESTS: 0
```
Recapture & live play check (`Enter` + `KeyD` + `KeyH`, exit code `0`):
```text
SHOT 3 (03-close-call.png): bytes=204829 byte_equal=True
PASS 01-overview.png 1280x480 199576B
PASS 02-turn-the-screen.png 1280x480 197041B
PASS 03-close-call.png 1280x480 204829B
PASS 04-delivered.png 1280x480 170569B
EVAL: "{\"state\":\"playing\",\"playing\":true,\"fieldNotes\":true}"
CONSOLE_ISSUES: 0  EXCEPTIONS: 0  OUTSIDE_REQUESTS: 0
```

## 3. Visual Inspection & Remaining Hand-off

- **`docs/team/evidence/B-3-cover-60pct.png` (`768×288`)**: Top objective capsule (`Fetch the sealed letter — unseen`), `HIDDEN` HUD + `2/3` pebbles + `27%` exposure, landed pebble dot inside expanding noise ring, north watchman (`?`), Wren `HIDDEN` at cone rim, callouts, and all 8 `FIELD NOTES` rows (including `'Lamplight: seen from afar — press E to douse'`) read cleanly at 60% scale.
- **`docs/team/evidence/B-3-shot4.png`**: Shows the real 93-sample dotted cyan replay trail from west start `(1, 7)` through the south arcade to `K`, back out the south arcade, and up to the glowing east exit `X` with start/end markers around the `DELIVERED UNSEEN` 3-star results panel.
- **Note**: `drawWatchmanFigure` / `drawCourierFigure` legend icon hooks and `lampsLit[1] = false` doused-lamp state are active in `ui.js` / `shots.js`; their visual figure silhouettes and doused-lamp smoke curl appear automatically as Gemini A lands `render.js` art items 5 & G6 before the 05:25 freeze for GPT's final recapture into `screenshots/`.
