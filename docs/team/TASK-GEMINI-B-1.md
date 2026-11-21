# TASK-GEMINI-B-1 — level maps, audio, tools

Owner: Gemini B. Read `docs/team/CONTRACT.md` and the spec `C:\Users\Public\zhuma-handoff\UNLIT-BOUNTY-PROMPT.txt`
(sections WORLD RULES, LEVELS, SOUND, THE FOUR SCREENSHOTS, HARDENING RULES) first.
Edit ONLY: `game/js/level-data.js`, `game/js/audio.js`, `tools/check-shots.mjs`, `tools/contact.html`,
`tools/browser-check.mjs`, `shots.json`, `docs/team/reports/GEMINI-B-1.md`. Never run git. Never touch other files.
Write every line yourself with your own edit tools; all names, maps and sounds original.

## 1. `game/js/level-data.js` — `const LEVELS` (CONTRACT §5 format), three levels
Design for fun AND for the screenshots:
- **1 Night Market** (tutorial, par 45): market street, two rows of carts, one watchman looping past them, one
  screen guarding the short route; the long route stays safe in shadow. `hints` for the two tutorial lines.
- **2 Canal Quarter** (par 75): canal (`~`) across the middle, two bridges (`=`); two watchmen (one crossing the
  north bridge, one on the south bank); two screens. Turning the WEST screen opens the quiet route. Required by
  screenshot 01: P at the west edge directly beside a wall (so Wren starts HIDDEN); K near the center; X at the east
  edge; at least one cart placed so that a cone is visibly clipped by it during the patrol; both bridges visible.
  Screenshot 02 needs the south-bank watchman's cone cut flat by the west screen.
- **3 Gatehouse Court** (par 100): walled courtyard with arcades (rows of pillars), three watchmen (one pausing at the
  gate with a wide sweep — use `face` toward the courtyard and `wait: 2`), two screens; the letter in the most exposed
  spot (center of the courtyard), still reachable unseen with patience.
- Every rule of CONTRACT §5 must hold (exactly one P/K/X; screen tiles `.` in both orientations; guard routes never
  touch any tile a screen covers in either orientation; waypoints walkable; loop closed; wait in [1,2]).
- A few `L` lamp posts for mood; they block movement, not sight.
- Each level must be finishable without ever being seen AND it must be easy to lose by walking into light.
Since GPT's `validateLevel` may not exist yet: write a throwaway checker OUTSIDE the repo (e.g.
`D:\unlit-scratch\b-check.mjs`) for the rules above and run it; paste its output. In the report, for each level
write the intended unseen route in words + tile coordinates (GPT will turn it into an automatic playthrough).

## 2. `game/js/audio.js` — `class Sfx` (CONTRACT §8)
All sounds synthesized; quiet, warm, not harsh. `step` filtered noise tick (quieter when sneaking), `guardStep`
panned and distance-scaled, `creak` (wooden, ~0.35 s), `thud` (soft low), `suspect` (soft rising tone), `alert`
(short sting), `chime` (letter), `gate` (opening chord), ambience (very quiet low drone + an occasional distant
water lap, scheduled from the audio clock, not setInterval). No AudioContext before `unlock()`; silent mode no-op.
Noise from a local mulberry32, never Math.random.

## 3. Tools (Node standard library only, no npm installs)
- `tools/check-shots.mjs`: for each `screenshots/*.png`, read the PNG signature + IHDR, require exactly 1280×480
  and ≤ 262144 bytes; also require 3–4 images total; print one line per file; exit 1 on any failure.
- `tools/contact.html`: the four screenshots at 25 % (320×120 each) side by side, plus the cover alone at 768×288
  (what the judge sees). Relative paths `../screenshots/...`. No network.
- `tools/browser-check.mjs`: open a URL in headless Chrome
  (`C:\Program Files\Google\Chrome\Application\chrome.exe`, ALWAYS with `--do-not-de-elevate`,
  `--headless=new`, `--remote-debugging-port=<free port>`, a temp `--user-data-dir`), drive it through the Chrome
  DevTools Protocol with Node's built-in `WebSocket`, enable Runtime/Log/Network, wait N ms (arg), and report:
  every console message of level error/warning, every uncaught exception, every network request whose URL is not
  `file:` or `data:` (for http mode: not `http://localhost:<port>/`). Optional `--keys "KeyW:500,ShiftLeft+KeyD:800"`
  to send key presses (for later play tests) and `--eval "<js>"` to print a value (e.g.
  `JSON.stringify(window.__unlit.state)`). Exit 1 on any error/exception/outside request. Usage:
  `node tools/browser-check.mjs --url file:///D:/the-unlit-hour/game/index.html --wait 3000`.
  Test it now on `tools/contact.html` or any small local page and paste the output; kill Chrome on exit.
- `shots.json`: the 4 entries `{ "name": "01-overview.png", "query": "?shot=1" }` … `04-delivered.png` `?shot=4`.

## Checks to paste in the report
Your map checker output; `node tools/check-shots.mjs` on a temporary folder of test PNGs (one good, one wrong size)
showing both pass and fail; browser-check output; grep of `game/js/level-data.js game/js/audio.js` for `http`,
`fetch(`, `XMLHttpRequest`, `WebSocket`, `import `, `type="module"`, `Math.random`, `Date.now`,
`performance.now`, `setInterval` → zero hits. Report: `docs/team/reports/GEMINI-B-1.md` (CONTRACT §10).
Next task (B-2): tools/shoot.md and README.md.
