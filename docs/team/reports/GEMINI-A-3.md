# GEMINI-A-3 Delivery Report — Illustrated Art, People Figures (Art 5), G6 Lamp Pools, G2, G3, Noise Rings & Pebbles

Owner: Gemini A  
Task: `docs/team/TASK-POLISH-1.md` — `Gemini A — art` (including updated Art item 5: ~1.4× people figures + exported `drawWatchmanFigure` / `drawCourierFigure`), `G6` (2-tile warm lamp pools when `level.lampsLit[i]` is true; dark post with smoke curl when false), `G2` (vignette pulse + SUSPICIOUS cone pulse), `G3` (route chevrons + waypoint wait labels), old-A-list item 3 (noise rings, pebble flight/landing, `"?"` for `INVESTIGATE`, HUD pebble dots), and PNG budget `≤ 230,000 B` for all four shots.  
Completed: 2026-11-22 ~05:15 UTC (10 minutes before 05:25 UTC code freeze).

## 1. Files Touched

Only assigned Gemini A files + evidence/report were modified (no `git` commands run; no other agents' files or `screenshots/*.png` touched):

| File | Size (bytes) | Summary |
|---|---:|---|
| `game/js/render.js` | 49,396 | Upgraded pure 2D renderer with `const ART`, deterministic `rndHash(tx, ty, salt)` (zero RNG), offscreen static floor/walls caches baked once per level, exported `drawWatchmanFigure(ctx, guard, time)` and `drawCourierFigure(ctx, player, time, hasLetter)`, G6 lamp pools & doused smoke curls, G2, G3, noise rings, pebbles, and HUD pebble dots. |
| `game/style.css` | 862 | Inspected and verified clean (no edits needed; zero forbidden substrings). |
| `docs/team/evidence/a3-shots/01-overview.png` | 209,457 | Post-upgrade 1280×480 test capture of `?shot=1` (`≤ 230,000 B`, `byte_equal=True`). |
| `docs/team/evidence/a3-shots/02-turn-the-screen.png` | 210,361 | Post-upgrade 1280×480 test capture of `?shot=2` (`≤ 230,000 B`, `byte_equal=True`). |
| `docs/team/evidence/a3-shots/03-close-call.png` | 208,517 | Post-upgrade 1280×480 test capture of `?shot=3` (`≤ 230,000 B`, `byte_equal=True`). |
| `docs/team/evidence/a3-shots/04-delivered.png` | 173,160 | Post-upgrade 1280×480 test capture of `?shot=4` (`≤ 230,000 B`, `byte_equal=True`). |
| `docs/team/evidence/A-3-before-768x288.png` | — | Before cover (`screenshots/01-overview.png`) downscaled to 768×288. |
| `docs/team/evidence/A-3-after-768x288.png` | — | After cover (`a3-shots/01-overview.png`) downscaled to 768×288. |
| `docs/team/evidence/A-3-before-crop-100pct.png` | — | Before cover 100% crop (`500×300` at `x=380, y=80`). |
| `docs/team/evidence/A-3-after-crop-100pct.png` | — | After cover 100% crop (`500×300` at `x=380, y=80`). |
| `docs/team/reports/GEMINI-A-3.md` | — | This delivery report. |

## 2. Implemented Features (`game/js/render.js`)

1. **Art Item 5 — People-Shaped Characters (~1.4× visual radius, hitboxes & cone center unchanged)**:
   - Exported pure top-level helpers **`drawWatchmanFigure(ctx, guard, time)`** and **`drawCourierFigure(ctx, player, time, hasLetter)`** (used directly by `drawEntities` AND callable at mini scale by Gemini B's `FIELD NOTES` legend via `ctx.scale`).
   - **Watchman (~15 px visual reach)**: dark hood + tan coat (`COLORS.guardBody`) with wide shoulders ellipse, head ahead of shoulders, animated alternating boots while `guard.moving`, wooden staff with brass tip held in left hand, right arm extended forward holding the glowing lantern at the hand (cone origin stays at `guard.x, guard.y`), `1.8 px` dark outlines. `"?"` badge shown for both `SUSPICIOUS` and `INVESTIGATE`, `"!"` for `ALERT`.
   - **Wren (~14 px visual reach)**: pale cloak (`COLORS.player`) with wide shoulders, head ahead of shoulders, animated alternating feet while `player.moving`, hands, trailing cyan scarf tail (`COLORS.hidden`), diagonal satchel strap + pouch, and small cream sealed letter (`COLORS.letter` + gold wax dot) on the satchel when `hasLetter` is true. `HIDDEN` state draws the body at `0.55` alpha with faint cyan halo and full-alpha `2 px` `#7FD1FF` outlines.
2. **G6 — Douse the Lamps (`game.level.lampsLit[index]`)**:
   - Supersedes the older decorative-glow-only rule: lit lamps cast a stepped flat warm pool (`radius = 2 * TILE = 64 px`) in `'screen'` blend plus a subtle dashed `64 px` perimeter cue so players immediately see the 2-tile lamplight zone (and stepped flat discs keep PNGs ~30 KB smaller than smooth 64 px radial gradients).
   - Doused lamps (`lampsLit[i] === false`) cast NO floor pool (and no water reflections), rendering as a dark cast-iron post with a thin rising two-strand smoke curl driven by `game.time`.
3. **Art Items 1–4, Static Caching & PNG Budget Optimization (`≤ 230,000 B`)**:
   - Offscreen `1280×480` static floor (`rndFloorCache`) and buildings/stalls (`rndWallsCache`) baked ONCE per level using deterministic `rndHash(tx, ty, salt)` (zero `game.rng` calls, zero DOM access at load time).
   - Night + `'screen'` cone light contrast; flat 2-shade low-contrast cobblestones (levels 1–2) and flagstones (level 3); stone canal lips & plank bridges with twin rails; slate-shingled roofs with ridges, 10 px south facades with warm windows, and 6 px umbras; striped burgundy/cream market stalls with wheels.
   - Replacing full-edge smooth vignette gradients and 64 px smooth lamp gradients with flat stepped translucent shapes dropped shots 1–3 from `~233–249 KB` down to **`208–210 KB`** (and shot 4 to **`173 KB`**) while preserving crisp illustrated art.
4. **G2, G3 & Old-A Item 3**:
   - **G2**: perimeter vignette pulses amber when `exposure > 0` and seen (red once any guard is `ALERT`); `SUSPICIOUS` cone edge thickens (`2.5–2.95 px`) and pulses smoothly.
   - **G3**: direction chevrons every ~4 tiles (`128 px`) on dotted patrol loops + waypoint wait labels (`1.5s`, `1s`, `1.2s`, `2s`, bold 12 px at 0.6 alpha, nudged cleanly away from guard badges).
   - **Old-A Item 3**: expanding `game.noises` rings (1 s fade, double ring on pebble waves, red for ALERT guards), `game.pebble` flight arc & landed stone, `"?"` for `INVESTIGATE`, and 3 HUD pebble dots next to the letter icon.

## 3. Checks Run and Actual Outputs

### 3.1 Final Repeat Captures (`≤ 230,000 B`, Byte-Identical), `check-shots.mjs`, and Cover Crops

Command:

```powershell
$outDir = "D:\the-unlit-hour\docs\team\evidence\a3-shots"
$repDir = Join-Path $env:TEMP "unlit-a3-v3"
New-Item -ItemType Directory -Force -Path $outDir, $repDir | Out-Null
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$shots = @(@{ n=1; file="01-overview.png" }, @{ n=2; file="02-turn-the-screen.png" }, @{ n=3; file="03-close-call.png" }, @{ n=4; file="04-delivered.png" })
foreach ($s in $shots) {
  $out1 = Join-Path $outDir $s.file; $out2 = Join-Path $repDir $s.file
  $url = "file:///D:/the-unlit-hour/game/index.html?shot=$($s.n)"
  $p1 = Start-Process -FilePath $chrome -ArgumentList @("--headless=new","--do-not-de-elevate","--force-device-scale-factor=1","--window-size=1280,480","--hide-scrollbars","--virtual-time-budget=5000","--screenshot=$out1",$url) -NoNewWindow -Wait -PassThru
  $p2 = Start-Process -FilePath $chrome -ArgumentList @("--headless=new","--do-not-de-elevate","--force-device-scale-factor=1","--window-size=1280,480","--hide-scrollbars","--virtual-time-budget=5000","--screenshot=$out2",$url) -NoNewWindow -Wait -PassThru
  $h1 = (Get-FileHash -Algorithm SHA256 $out1).Hash; $h2 = (Get-FileHash -Algorithm SHA256 $out2).Hash; $len = (Get-Item $out1).Length
  Write-Output "A3V3 shot=$($s.n) ($($s.file)): exit1=$($p1.ExitCode) exit2=$($p2.ExitCode) bytes=$len le230000=$($len -le 230000) byte_equal=$($h1 -eq $h2) sha256=$h1"
}
node D:\the-unlit-hour\tools\check-shots.mjs $outDir
Write-Output "CHECK_SHOTS_EXIT=$LASTEXITCODE"
```

Exit code: `0`

Pasted output:

```text
209457 bytes written to file D:\the-unlit-hour\docs\team\evidence\a3-shots\01-overview.png
209457 bytes written to file C:\Users\ADMINI~1\AppData\Local\Temp\unlit-a3-v3\01-overview.png
A3V3 shot=1 (01-overview.png): exit1=0 exit2=0 bytes=209457 le230000=True byte_equal=True sha256=8E2A088A2ED57DCACB15933323865944DF61F8826153381F9B749DB1964222ED
210361 bytes written to file D:\the-unlit-hour\docs\team\evidence\a3-shots\02-turn-the-screen.png
210361 bytes written to file C:\Users\ADMINI~1\AppData\Local\Temp\unlit-a3-v3\02-turn-the-screen.png
A3V3 shot=2 (02-turn-the-screen.png): exit1=0 exit2=0 bytes=210361 le230000=True byte_equal=True sha256=C811BC2F3A19B6556AC127AD4CD2890FD078AE2D2C538EB8FFBBD22F074D1684
208517 bytes written to file D:\the-unlit-hour\docs\team\evidence\a3-shots\03-close-call.png
208517 bytes written to file C:\Users\ADMINI~1\AppData\Local\Temp\unlit-a3-v3\03-close-call.png
A3V3 shot=3 (03-close-call.png): exit1=0 exit2=0 bytes=208517 le230000=True byte_equal=True sha256=734C59F0D7297F6964E61D56F81CBF8B488B8AC83CB367C155BB801A001B0024
173160 bytes written to file D:\the-unlit-hour\docs\team\evidence\a3-shots\04-delivered.png
173160 bytes written to file C:\Users\ADMINI~1\AppData\Local\Temp\unlit-a3-v3\04-delivered.png
A3V3 shot=4 (04-delivered.png): exit1=0 exit2=0 bytes=173160 le230000=True byte_equal=True sha256=CF2799C8CEFF1283BE24FCE92AF86DD97619EC3ACB47836E1402D47111615A4E
PASS 01-overview.png 1280x480 209457B
PASS 02-turn-the-screen.png 1280x480 210361B
PASS 03-close-call.png 1280x480 208517B
PASS 04-delivered.png 1280x480 173160B
CHECK_SHOTS_EXIT=0
CROPS_OK
```

### 3.2 Forbidden-Substring Grep, VM No-DOM Export Check, Strict Parse, and `browser-check.mjs`

Command:

```powershell
Write-Output "RENDER_BYTES=$((Get-Item D:\the-unlit-hour\game\js\render.js).Length) GAME_TOTAL_BYTES=$((Get-ChildItem -Recurse -File D:\the-unlit-hour\game | Measure-Object Length -Sum).Sum)"
$files = @("D:\the-unlit-hour\game\style.css", "D:\the-unlit-hour\game\js\render.js")
$patterns = @("http", "fetch(", "XMLHttpRequest", "WebSocket", "import ", 'type="module"', "Math.random", "Date.now", "new Date", "eval", "new Function", "setInterval", "performance.now")
$hits = @()
foreach ($p in $patterns) { $m = Select-String -Path $files -SimpleMatch -Pattern $p; if ($m) { $hits += $m } }
Write-Output "FORBIDDEN_GREP_HITS=$($hits.Count)"

@'
import fs from 'node:fs';
import vm from 'node:vm';
const files = ['game/js/util.js','game/js/level-data.js','game/js/levels.js','game/js/grid.js','game/js/screens.js','game/js/vision.js','game/js/guard.js','game/js/player.js','game/js/render.js'];
const ctx = vm.createContext({});
for (const f of files) vm.runInContext(fs.readFileSync('D:/the-unlit-hour/' + f, 'utf8'), ctx, { filename: f });
const expected = ['RENDER_STYLE','ART','renderFrame','drawLevel','drawWallFaces','drawPatrolRoutes','drawWater','drawCones','drawEntities','drawCoverOutline','drawHiddenBadge','drawHud','drawCapsule','drawWatchmanFigure','drawCourierFigure'];
console.log('VM_LOAD_NO_DOM: OK missing=' + JSON.stringify(expected.filter(k => vm.runInContext('typeof ' + k, ctx) === 'undefined')));
const code = fs.readFileSync('D:/the-unlit-hour/game/js/render.js', 'utf8');
new Function('"use strict";\n' + code);
console.log('RENDER_STRICT_PARSE=OK bytes=' + Buffer.byteLength(code, 'utf8'));
'@ | node --input-type=module -
Write-Output "NODE_EXIT=$LASTEXITCODE"

foreach ($n in 1..4) {
  node D:\the-unlit-hour\tools\browser-check.mjs --url "file:///D:/the-unlit-hour/game/index.html?shot=$n" --wait 250 --eval '({title:document.title, shotReady:window.__shotReady, SHOT_READY:window.__SHOT_READY, lampsLit:window.__unlit?.level?.lampsLit})'
  Write-Output "BROWSER_SHOT_$n=$LASTEXITCODE"
}
node D:\the-unlit-hour\tools\browser-check.mjs --url "file:///D:/the-unlit-hour/game/index.html" --wait 250 --eval '({title:document.title, state:window.__unlit?.state})'
Write-Output "BROWSER_INDEX=$LASTEXITCODE"
```

Exit code: `0`

Pasted output:

```text
RENDER_BYTES=49396 GAME_TOTAL_BYTES=149736
FORBIDDEN_GREP_HITS=0
VM_LOAD_NO_DOM: OK missing=[]
RENDER_STRICT_PARSE=OK bytes=49396
NODE_EXIT=0
EVAL: {"title":"READY","shotReady":true,"SHOT_READY":true,"lampsLit":[true,false,true,true,true,true]}
URL: file:///D:/the-unlit-hour/game/index.html?shot=1
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
BROWSER_SHOT_1=0
EVAL: {"title":"READY","shotReady":true,"SHOT_READY":true,"lampsLit":[true,true,true,true,true,true]}
URL: file:///D:/the-unlit-hour/game/index.html?shot=2
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
BROWSER_SHOT_2=0
EVAL: {"title":"READY","shotReady":true,"SHOT_READY":true,"lampsLit":[true,true,true,true,true,true]}
URL: file:///D:/the-unlit-hour/game/index.html?shot=3
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
BROWSER_SHOT_3=0
EVAL: {"title":"READY","shotReady":true,"SHOT_READY":true,"lampsLit":[true,true,true,true,true,true]}
URL: file:///D:/the-unlit-hour/game/index.html?shot=4
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
BROWSER_SHOT_4=0
EVAL: {"title":"THE UNLIT HOUR","state":"title"}
URL: file:///D:/the-unlit-hour/game/index.html
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
BROWSER_INDEX=0
```

Note on source size: total `game/` across all agents is `149,736 B` (~146.2 KiB, comfortably under the kit's 160 KiB = 163,840 B dossier text cap; GPT's final check will confirm exact dossier bytes).

## 4. Before / After Cover Visual Comparison (`100%` and `768×288`)

Evidence files inspected directly:
- Before 768×288: `docs/team/evidence/A-3-before-768x288.png`
- After 768×288: `docs/team/evidence/A-3-after-768x288.png`
- Before 100% crop (`500×300`): `docs/team/evidence/A-3-before-crop-100pct.png`
- After 100% crop (`500×300`): `docs/team/evidence/A-3-after-crop-100pct.png`

Visual assessment:
- **People figures (Art 5)**: Both watchmen (tan coat, dark hood, wooden staff, forward-held glowing lantern, boots) and Wren (pale cloak, trailing cyan scarf, satchel strap, translucent cyan-outlined HIDDEN look, cream letter on satchel in shot 3) clearly read as top-down human figures at both 100% and 768×288, and match the mini legend icons in `FIELD NOTES` via `drawWatchmanFigure` / `drawCourierFigure`.
- **G6 Lamp pools & doused smoke**: Lit lamps cast crisp 2-tile (`64 px`) stepped warm pools that immediately read as lit danger zones against dark cobblestones, while the doused lamp in the center-north of shot 1 shows a dark post with a rising smoke curl and zero floor pool.
- **Overall readability**: Safe shadow vs. lantern light contrast, striped market stalls, slate roofs with warm windows, canal lips/bridges, pebble noise ring, patrol chevrons/timing labels, G2 red vignette/pulsing SUSPICIOUS edge, and G8 route trail in shot 4 all stay crisp while every PNG stays ≤ `210,361 B` (`≤ 230,000 B`).

## 5. Not Done / Not Tested by Gemini A

- Final recapture into `screenshots/01-overview.png`..`04-delivered.png` (reserved for GPT's 05:25–05:35 recapture + commit).
- `node tools/logic-test.mjs`, `node tools/playthrough.mjs`, `serve.ts` HTTP check, and `node main.ts` determinism check (GPT's 05:25–05:35 checklist).
- Mid-flight pebble arc (`t < 1`) and animated leg stride across consecutive frames (code-checked and strict-parsed; static shot captures show single fixed ticks).
