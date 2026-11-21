# TASK-GEMINI-A-1 — style.css, render.js, ui.js (+ preview page)

Owner: Gemini A. Read `docs/team/CONTRACT.md` and the spec `C:\Users\Public\zhuma-handoff\UNLIT-BOUNTY-PROMPT.txt`
(sections ART DIRECTION, THE FOUR SCREENSHOTS, HARDENING RULES) first.
Edit ONLY: `game/style.css`, `game/js/render.js`, `game/js/ui.js`, `tools/render-preview.html`,
`docs/team/evidence/A-1-*.png`, `docs/team/reports/GEMINI-A-1.md`. Never run git. Never touch other files.
Write every line of code yourself with your own edit tools (no copying code from other agents' files into yours).

## Deliver
1. `game/style.css`: body background `#0B1020`, margin 0, no scrollbars; canvas centered and letterboxed at
   1280:480 at any window size (CSS only; the backing store stays 1280×480). `html.shot` → canvas exactly
   1280×480 at (0,0), no letterbox, no scaling.
2. `game/js/render.js`: `renderFrame`, `drawLevel`, `drawWallFaces`, `drawPatrolRoutes`, `drawWater`, `drawCones`,
   `drawEntities`, `drawCoverOutline`, `drawHiddenBadge`, `drawHud`, `drawCapsule` — signatures and data per
   CONTRACT §6–7, colors ONLY from `COLORS`, all art direction rules of the spec: 2.5D wall/cart front faces,
   6 px umbras, radial cone gradient with the exact stops, edge line, hard-edged shadows from the ray polygon,
   ALERT red cone, guard body + lantern glow + "?" / "!", player normal / HIDDEN look, HIDDEN badge with a
   closed-eye icon (≥18 px), dashed cyan cover outline, dotted patrol loops (2 px dots every 8 px, under
   everything but the floor), level-2 lantern reflections on canal tiles (3-4 short sine lines per reflection,
   slow drift driven by `game.time`), letter + glint, exit dim / glowing with pulse, screens with lattice lines,
   pivot dot, swing interpolation (`screen.angle` during `swinging`) + faint rotation arc while swinging +
   `shakeT` jitter, hover ring when `game.hover.screen` and `inReach`, ALERT guard's dotted path to a last-seen
   marker. HUD: two capsules only (top-left title "THE UNLIT HOUR · <n> <Level Name>", top-right letter icon,
   exposure bar 0-100, status HIDDEN / SEEN / ALERT-red / blank), ≤36 px high, never full-width bars.
3. `game/js/ui.js`: `drawTitle`, `drawPause`, `drawCaught`, `drawResults`, `drawEnding`, `drawHint`,
   `drawLevelError`, `drawOverlay` — texts exactly as the spec (title line, controls line, level select 1-3 with
   locked ones dimmed, "Press Enter"; "Paused — Esc resume · R restart · M mute"; "Caught — press R to try again";
   results with DELIVERED UNSEEN / DELIVERED, time, times seen, stars, par, 1·2·3 strip; ending line
   "The town sleeps. You were never here.").
4. `tools/render-preview.html`: loads `../game/js/util.js`, `../game/js/level-data.js` (if present — Gemini B is
   writing it in parallel; until then use a small inline 40×15 test map in the preview page only),
   `../game/js/render.js`, `../game/js/ui.js`, builds a MOCK `game` object with the exact CONTRACT §6 field names
   (2 guards with hand-made cone polygons, one ALERT; player HIDDEN; one screen mid-swing; hints) and draws it.
   It is your workbench until GPT's logic exists. No network, no modules.

## Checks you must run and paste in your report
- Headless capture of the preview at 1280×480:
  `"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --do-not-de-elevate --force-device-scale-factor=1 --window-size=1280,480 --hide-scrollbars --virtual-time-budget=3000 --screenshot=D:\the-unlit-hour\docs\team\evidence\A-1-preview.png "file:///D:/the-unlit-hour/tools/render-preview.html"`
  plus one with the title overlay and one with the results overlay (query parameters on the preview page).
- A 25 % version (320×120) of each capture: look at it and state honestly whether cones, player, cover, HIDDEN
  badge and exit are identifiable.
- Grep `game/style.css game/js/render.js game/js/ui.js` for: `http`, `fetch(`, `XMLHttpRequest`, `WebSocket`,
  `import `, `type="module"`, `Math.random`, `Date.now`, `performance.now` → must be zero hits; paste the command
  and output.
- No top-level side effects (only declarations) in render.js / ui.js.

Report: `docs/team/reports/GEMINI-A-1.md` (CONTRACT §10). Next task (A-2) will be shots.js and the four screenshots.
