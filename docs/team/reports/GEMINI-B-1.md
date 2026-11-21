# GEMINI-B-1 Delivery Report

Owner: Gemini B  
Task: `docs/team/TASK-GEMINI-B-1.md` (Contract v1)

## 1. Files Touched (Assigned Only)

- `game/js/level-data.js` — `const LEVELS` for all 3 levels (`Night Market`, `Canal Quarter`, `Gatehouse Court`).
- `game/js/audio.js` — `class Sfx` synthesized WebAudio sound effects and ambient bed (plus `sfxMulberry32` helper).
- `tools/check-shots.mjs` — PNG signature/IHDR (`1280x480`), file size (`<= 262144` bytes), and count (`3-4`) validator.
- `tools/contact.html` — 25% thumbnail strip (`320x120` x 4) and `768x288` cover view (`../screenshots/*.png`, no network).
- `tools/browser-check.mjs` — Headless Chrome CDP checker (`--do-not-de-elevate`, console error/warning, uncaught exceptions, outside network requests, `--wait`, `--keys`, `--eval`, kills Chrome on exit).
- `shots.json` — Updated to the 4 project entries (`01-overview.png` `?shot=1` through `04-delivered.png` `?shot=4`).
- `docs/team/reports/GEMINI-B-1.md` — This report.

## 2. Intended Unseen Routes (for Playthrough & Validation)

### Level 1 — Night Market (`par: 45`)
- **Key coordinates**: `P=(1,7)`, `S1=(10,7)` (`NS`), `K=(28,7)`, `X=(38,7)`. Guard 0 loop: `(14,6) -> (25,6) -> (25,8) -> (14,8)` (`wait: 1.2`).
- **Short route (with screen)**: Walk east `(1,7) -> (8,7)`, click pivot `S1 (10,7)` to rotate `NS -> EW` (opens `(10,6)` and `(10,8)`). Slip north through `(10,6) -> (11,3)` behind the north cart row (`y=4`, `x=14..15, 18..19, 22..23, 26..27`). Move east along `y=3` to `(28,3)`. When Guard 0 moves west toward `x=14` (beyond 8-tile cone range), drop south `(28,3) -> (28,7)`, press `E` at `K (28,7)`, then walk east `(28,7) -> (38,7)` and press `E` at `X (38,7)`.
- **Long shadow route (without screen)**: Walk `(1,7) -> (8,7) -> (8,12)` into the south shadow alley (`y=12..13`, shielded by wall `y=11`, `x=10..29`), move east to `(30,12) -> (30,7)`, wait until Guard 0 moves west toward `x=14`, pick up `K (28,7)` (`E`), and exit `X (38,7)` (`E`).

### Level 2 — Canal Quarter (`par: 75`)
- **Key coordinates**: `P=(1,7)`, `S1=(10,11)` (`NS`), `S2=(32,7)` (`NS`), `K=(19,7)`, `X=(38,7)`. Canal `~` at `x=23..24` (plus south quay `y=13..14, x=14..24`); north bridge `=` at `(23..24, 3..4)`, south bridge `=` at `(23..24, 11..12)`. Guard 0 (north bridge): `(14,3) -> (30,3) -> (30,4) -> (14,4)`. Guard 1 (south bank): `(14,11) <-> (21,11)`.
- **Quiet route**: Move `(1,7) -> (9,10)` (within reach of `S1 (10,11)` and adjacent to `S1` for `HIDDEN`). When Guard 1 walks east toward `(21,11)`, click `S1 (10,11)` to rotate `NS -> EW` (opens `(10,10)` and `(10,12)`). Pass through `(10,10) -> (13,8)` behind carts `(15..16,5)` and `(18..19,5)`, pause at `(19,6)` while Guard 0 crosses east past `x=28`, step to `(19,7)` and press `E` for `K`. Slip south-east `(19,7) -> (22,12)` once Guard 1 walks west toward `(14,11)`, cross the south bridge `(22,12) -> (25,12)`, walk north-east `(26,12) -> (31,8)` while Guard 0 is on the west bank, click `S2 (32,7)` to rotate `NS -> EW`, pass `(32,8) -> (38,7)`, and press `E` at `X (38,7)`.

### Level 3 — Gatehouse Court (`par: 100`)
- **Key coordinates**: `P=(1,7)`, `S1=(6,7)` (`NS`), `S2=(33,7)` (`NS`), `K=(19,7)`, `X=(38,7)`. Arcade pillars (`#`) along `y=3` and `y=11` at `x=9,12,15,18,21,24,27,30`. Guard 0: `(10,5) <-> (28,5)`. Guard 1: `(28,9) <-> (10,9)`. Guard 2 (gatehouse): `(35,7)` (`wait: 2, face: 180`) `-> (36,3) -> (36,11)`.
- **Unseen route**: From `P (1,7)`, enter the north arcade `(5,2) -> (6,2) -> (19,2)` behind the `y=3` pillars. Wait at `(19,2)` until Guard 0 is at `(10,5)` (`face: 180`) and Guard 1 is at `(28,9)` (`face: 0`) (or the opposite phase `(28,5)` / `(10,9)`), leaving center `K (19,7)` outside both 8-tile cones. Move `(19,2) -> (19,7)`, press `E` at `K`, and immediately return to `(19,2)`. Walk east along the north arcade `(19,2) -> (31,2)`, wait until Guard 2 walks down to `(36,11)` (`9 > 8` tiles away from `y=2`), pass `(33,2) -> (38,2)` and move south along `(38,2) -> (38,7)` (shielded by cart `(37,5)` and behind Guard 2's west-facing sweep) to `X (38,7)` (`E`).

## 3. Checks Run & Actual Outputs

### A. Scratch Map Validator (`D:/unlit-scratch/b-check.mjs`)
Command:
```powershell
node D:/unlit-scratch/b-check.mjs
```
Exit code: `0`
Output:
```text
PASS Level 1 Night Market: P=(1,7) K=(28,7) X=(38,7) screens=1 guards=1 validCombos=NS(51), EW(39)
PASS Level 2 Canal Quarter: P=(1,7) K=(19,7) X=(38,7) screens=2 guards=2 validCombos=NS/NS(57), EW/NS(55), NS/EW(51), EW/EW(49)
PASS Level 3 Gatehouse Court: P=(1,7) K=(19,7) X=(38,7) screens=2 guards=3 validCombos=NS/NS(57), EW/NS(49), NS/EW(49), EW/EW(41)
```
*(Checks: 15x40 dimensions, legend chars, single P/K/X, `S` count and `.` non-pivot tiles in both orientations, disjoint screen tiles, `P->K->X` BFS reachability, waypoint walkability and `wait` in `[1,2]`, guard loop BFS avoiding all screen tiles in both orientations and under gameplay E/S/W/N BFS for every orientation mask.)*

### B. Screenshot Validator (`tools/check-shots.mjs`) on Temporary PNGs
Command:
```powershell
node D:/unlit-scratch/make-test-pngs.mjs; node tools/check-shots.mjs D:/unlit-scratch/test-shots; echo "EXIT=$LASTEXITCODE"
```
Exit code of `check-shots.mjs`: `1` (as expected due to `03-wrong-size.png`)
Output:
```text
Generated test PNGs in D:/unlit-scratch/test-shots
PASS 01-good.png 1280x480 2909B
PASS 02-good.png 1280x480 2909B
FAIL 03-wrong-size.png (1949B): dimensions 640x480 !== 1280x480
EXIT=1
```

### C. Headless Chrome Browser Check (`tools/browser-check.mjs`)
1. Clean local HTML page with `--keys` and `--eval`:
Command:
```powershell
node tools/browser-check.mjs --url file:///D:/unlit-scratch/ok.html --wait 500 --keys "KeyW:100,ShiftLeft+KeyD:100" --eval "JSON.stringify(window.__testVal)"
```
Exit code: `0`
Output:
```text
EVAL: "{\"ok\":true,\"width\":1280}"
URL: file:///D:/unlit-scratch/ok.html
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
```

2. Live WebAudio `Sfx` verification in Chrome (pre-unlock no-op + post-`KeyE` `unlock()`, `startAmbience()`, all SFX methods, `setMuted`, `stopAmbience()`):
Command:
```powershell
node tools/browser-check.mjs --url file:///D:/unlit-scratch/audio-test.html --wait 400 --keys "KeyE:120" --eval "JSON.stringify(window.__audioResult)"
```
Exit code: `0`
Output:
```text
EVAL: "{\"preCtxNull\":true,\"unlocked\":true,\"muted\":false}"
URL: file:///D:/unlit-scratch/audio-test.html
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
```

### D. Forbidden Substring Grep, Syntax & JSON Checks
Command (grep):
```powershell
$hits = Select-String -Path game/js/level-data.js, game/js/audio.js -SimpleMatch -Pattern 'http','fetch(','XMLHttpRequest','WebSocket','import ','type="module"','Math.random','Date.now','performance.now','setInterval'; if ($hits) { $hits; exit 1 } else { "GREP_HITS=0" }
```
Exit code: `0`
Output:
```text
GREP_HITS=0
```

Command (strict parse, Node `vm` `Sfx` silent/pre-unlock no-op, `node --check`, `shots.json`):
```powershell
node D:/unlit-scratch/check-files.mjs; node --check tools/check-shots.mjs; node --check tools/browser-check.mjs; node --check game/js/level-data.js; node --check game/js/audio.js; node -e "console.log('SHOTS_JSON_COUNT=' + JSON.parse(require('fs').readFileSync('shots.json','utf8')).length)"
```
Exit code: `0`
Output:
```text
CLEAN & STRICT-PARSE OK: game/js/level-data.js (4122 bytes)
CLEAN & STRICT-PARSE OK: game/js/audio.js (13004 bytes)
FORBIDDEN_HITS=0
SFX_NODE_NOOP_OK silent=true preUnlockCtx=null
SHOTS_JSON_COUNT=4
```

## 4. Not Done / Not Tested

- **Full game boot & live playthrough (`game/index.html`, `game/js/game.js`, `render.js`, `ui.js`, `shots.js`)**: Not tested here because `game/js/game.js`, `game/js/levels.js`, `game/js/guard.js`, `game/js/render.js`, `game/js/ui.js`, `game/js/shots.js`, and updated `game/index.html` are owned by GPT and Gemini A and are not complete yet.
- **Actual `screenshots/*.png` validation & `tools/contact.html` 25% shrink test**: Not run against `screenshots/` yet because Gemini A's 4 PNG captures (`01-overview.png` .. `04-delivered.png`) do not exist yet (`screenshots/` currently holds starter `.jpg` files).
- **Audio subjective listening**: `audio.js` executed in headless Chrome with zero console/exception issues, and `silent` / pre-unlock paths were verified, but speaker output was not listened to by ear.
- **Next task (`TASK-GEMINI-B-2`)**: `tools/shoot.md` and `README.md` are deferred to the later task as specified.
