# GEMINI-A-2 Delivery Report — shots.js and Four Real Screenshots

Owner: Gemini A  
Scope: Parallel local delivery preparation for A-2 (`game/js/shots.js`, `screenshots/01-overview.png`..`04-delivered.png`, minimal renderer polish in `game/js/render.js`, contact sheet evidence, and verification). Note: Claude Gate 1 review is still pending; this report does not imply Claude approval.  
Date: 2026-11-21

## 1. Files Touched

Only assigned Gemini A files were created/edited (no `git` commands run; no other agents' files modified; no uploads/pushes/submissions):

| File | Size (bytes) | Purpose |
|---|---:|---|
| `game/js/shots.js` | 6,098 | Declares `SHOTS` (1–4) and `applyShot(game, n)` using the real `Game`, `Guard`, `Player`, `LatticeScreen`, and `findPath` APIs with fixed `DT` ticks and `mulberry32(SHOT_SEED)` only. |
| `game/js/render.js` | 36,028 | Small polish (+2 lines): skip `drawCoverOutline` and `drawHiddenBadge` when `game.state === 'results'` so the glowing exit gate stays clean under the results overlay (`04-delivered.png`). |
| `screenshots/01-overview.png` | 113,592 | Unmodified 1280×480 headless Chrome capture of `game/index.html?shot=1`. |
| `screenshots/02-turn-the-screen.png` | 107,433 | Unmodified 1280×480 headless Chrome capture of `game/index.html?shot=2`. |
| `screenshots/03-close-call.png` | 109,239 | Unmodified 1280×480 headless Chrome capture of `game/index.html?shot=3`. |
| `screenshots/04-delivered.png` | 96,693 | Unmodified 1280×480 headless Chrome capture of `game/index.html?shot=4`. |
| `docs/team/evidence/A-2-contact.png` | 161,572 | Headless Chrome capture of `tools/contact.html` (all 4 screenshots at 25% `320×120` + cover `01-overview.png` at `768×288`). |
| `docs/team/reports/GEMINI-A-2.md` | — | This delivery report. |

## 2. Exact Capture Commands, Repeat Byte-Equality Check, Contact Capture, and `check-shots.mjs`

Individual headless Chrome capture commands (exact flags used for each shot):

```powershell
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --do-not-de-elevate --force-device-scale-factor=1 --window-size=1280,480 --hide-scrollbars --virtual-time-budget=5000 --screenshot=D:\the-unlit-hour\screenshots\01-overview.png "file:///D:/the-unlit-hour/game/index.html?shot=1"
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --do-not-de-elevate --force-device-scale-factor=1 --window-size=1280,480 --hide-scrollbars --virtual-time-budget=5000 --screenshot=D:\the-unlit-hour\screenshots\02-turn-the-screen.png "file:///D:/the-unlit-hour/game/index.html?shot=2"
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --do-not-de-elevate --force-device-scale-factor=1 --window-size=1280,480 --hide-scrollbars --virtual-time-budget=5000 --screenshot=D:\the-unlit-hour\screenshots\03-close-call.png "file:///D:/the-unlit-hour/game/index.html?shot=3"
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --do-not-de-elevate --force-device-scale-factor=1 --window-size=1280,480 --hide-scrollbars --virtual-time-budget=5000 --screenshot=D:\the-unlit-hour\screenshots\04-delivered.png "file:///D:/the-unlit-hour/game/index.html?shot=4"
```

Exact PowerShell verification script executed after final edits (captures each shot twice into `screenshots/` and `$env:TEMP\unlit-shot-repeat\`, compares byte lengths and SHA-256 hashes, captures `tools/contact.html`, and runs `tools/check-shots.mjs`):

```powershell
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$shots = @(
  @{ n = 1; file = "01-overview.png" },
  @{ n = 2; file = "02-turn-the-screen.png" },
  @{ n = 3; file = "03-close-call.png" },
  @{ n = 4; file = "04-delivered.png" }
)
$repeatDir = Join-Path $env:TEMP "unlit-shot-repeat"
New-Item -ItemType Directory -Force -Path $repeatDir | Out-Null

foreach ($s in $shots) {
  $out1 = "D:\the-unlit-hour\screenshots\$($s.file)"
  $out2 = Join-Path $repeatDir $s.file
  $url = "file:///D:/the-unlit-hour/game/index.html?shot=$($s.n)"
  $a1 = @("--headless=new","--do-not-de-elevate","--force-device-scale-factor=1","--window-size=1280,480","--hide-scrollbars","--virtual-time-budget=5000","--screenshot=$out1",$url)
  $a2 = @("--headless=new","--do-not-de-elevate","--force-device-scale-factor=1","--window-size=1280,480","--hide-scrollbars","--virtual-time-budget=5000","--screenshot=$out2",$url)
  $p1 = Start-Process -FilePath $chrome -ArgumentList $a1 -NoNewWindow -Wait -PassThru
  $p2 = Start-Process -FilePath $chrome -ArgumentList $a2 -NoNewWindow -Wait -PassThru
  $h1 = (Get-FileHash -Algorithm SHA256 $out1).Hash
  $h2 = (Get-FileHash -Algorithm SHA256 $out2).Hash
  $b1 = [System.IO.File]::ReadAllBytes($out1)
  $b2 = [System.IO.File]::ReadAllBytes($out2)
  $same = ($b1.Length -eq $b2.Length) -and ($h1 -eq $h2)
  Write-Output "SHOT $($s.n) ($($s.file)): exit1=$($p1.ExitCode) exit2=$($p2.ExitCode) bytes=$($b1.Length) byte_equal=$same sha256=$h1"
}

$contactOut = "D:\the-unlit-hour\docs\team\evidence\A-2-contact.png"
$pC = Start-Process -FilePath $chrome -ArgumentList @("--headless=new","--do-not-de-elevate","--force-device-scale-factor=1","--window-size=1400,620","--hide-scrollbars","--virtual-time-budget=3000","--screenshot=$contactOut","file:///D:/the-unlit-hour/tools/contact.html") -NoNewWindow -Wait -PassThru
Write-Output "CONTACT_CAPTURE: exit=$($pC.ExitCode) bytes=$((Get-Item $contactOut).Length)"

node D:\the-unlit-hour\tools\check-shots.mjs D:\the-unlit-hour\screenshots
Write-Output "CHECK_SHOTS_EXIT=$LASTEXITCODE"
```

Exit code: `0`

Pasted output:

```text
113592 bytes written to file D:\the-unlit-hour\screenshots\01-overview.png
113592 bytes written to file C:\Users\ADMINI~1\AppData\Local\Temp\unlit-shot-repeat\01-overview.png
SHOT 1 (01-overview.png): exit1=0 exit2=0 bytes=113592 byte_equal=True sha256=7052A1119B49D7FD2B84467D40EB532FA6B73F5748D3137611AF7B8FAD019F99
107433 bytes written to file D:\the-unlit-hour\screenshots\02-turn-the-screen.png
107433 bytes written to file C:\Users\ADMINI~1\AppData\Local\Temp\unlit-shot-repeat\02-turn-the-screen.png
SHOT 2 (02-turn-the-screen.png): exit1=0 exit2=0 bytes=107433 byte_equal=True sha256=F4118F9ABAEFD5B2498C6F069EF4150B42CD923329D023A13618F38F0A35ACA0
109239 bytes written to file D:\the-unlit-hour\screenshots\03-close-call.png
109239 bytes written to file C:\Users\ADMINI~1\AppData\Local\Temp\unlit-shot-repeat\03-close-call.png
SHOT 3 (03-close-call.png): exit1=0 exit2=0 bytes=109239 byte_equal=True sha256=8A6D93490A487344384BEB714F9283884C158E21E261A53012302E967418F47F
96693 bytes written to file D:\the-unlit-hour\screenshots\04-delivered.png
96693 bytes written to file C:\Users\ADMINI~1\AppData\Local\Temp\unlit-shot-repeat\04-delivered.png
SHOT 4 (04-delivered.png): exit1=0 exit2=0 bytes=96693 byte_equal=True sha256=B38E59398527B91242E68427FB81824F2214CFDD7B7D6A9AF17CA0E892F75828
161572 bytes written to file D:\the-unlit-hour\docs\team\evidence\A-2-contact.png
CONTACT_CAPTURE: exit=0 bytes=161572
PASS 01-overview.png 1280x480 113592B
PASS 02-turn-the-screen.png 1280x480 107433B
PASS 03-close-call.png 1280x480 109239B
PASS 04-delivered.png 1280x480 96693B
CHECK_SHOTS_EXIT=0
```

## 3. Forbidden-Substring Grep, VM No-DOM Load, Strict Parse, READY Flags, and Clean `file://` Console Check

Exact command run:

```powershell
$files = @("D:\the-unlit-hour\game\style.css", "D:\the-unlit-hour\game\js\render.js", "D:\the-unlit-hour\game\js\ui.js", "D:\the-unlit-hour\game\js\shots.js")
$patterns = @("http", "fetch(", "XMLHttpRequest", "WebSocket", "import ", 'type="module"', "Math.random", "Date.now", "new Date", "eval", "new Function", "setInterval", "performance.now")
$hits = @()
foreach ($p in $patterns) {
  $m = Select-String -Path $files -SimpleMatch -Pattern $p
  if ($m) { $hits += $m }
}
Write-Output "FORBIDDEN_GREP_HITS=$($hits.Count)"

@'
import fs from 'node:fs';
import vm from 'node:vm';

const files = [
  'game/js/util.js','game/js/level-data.js','game/js/levels.js','game/js/grid.js',
  'game/js/screens.js','game/js/vision.js','game/js/guard.js','game/js/player.js',
  'game/js/render.js','game/js/ui.js','game/js/shots.js'
];
const ctx = vm.createContext({});
for (const f of files) {
  vm.runInContext(fs.readFileSync('D:/the-unlit-hour/' + f, 'utf8'), ctx, { filename: f });
}
console.log('VM_LOAD_ALL_NO_DOM: SHOTS=' + vm.runInContext('typeof SHOTS', ctx) + ' applyShot=' + vm.runInContext('typeof applyShot', ctx));
const code = fs.readFileSync('D:/the-unlit-hour/game/js/shots.js', 'utf8');
new Function('"use strict";\n' + code);
console.log('SHOTS_STRICT_PARSE=OK bytes=' + Buffer.byteLength(code, 'utf8'));
'@ | node --input-type=module -
Write-Output "NODE_EXIT=$LASTEXITCODE"

$evalExpr = '({title:document.title, shotReady:window.__shotReady, SHOT_READY:window.__SHOT_READY, state:window.__unlit?.state, level:window.__unlit?.level?.name, exposure:Math.round((window.__unlit?.exposure||0)*10)/10, hasLetter:window.__unlit?.hasLetter, hidden:window.__unlit?.player?.hidden, guards:window.__unlit?.guards?.map(g=>g.state), swinging:window.__unlit?.screens?.map(s=>s.swinging), hoverInReach:window.__unlit?.hover?.inReach, results:window.__unlit?.results})'
foreach ($n in 1..4) {
  Write-Output "=== SHOT $n ==="
  node D:\the-unlit-hour\tools\browser-check.mjs --url "file:///D:/the-unlit-hour/game/index.html?shot=$n" --wait 300 --eval $evalExpr
  Write-Output "EXIT=$LASTEXITCODE"
}
Write-Output "=== NORMAL PLAY (file://) ==="
node D:\the-unlit-hour\tools\browser-check.mjs --url "file:///D:/the-unlit-hour/game/index.html" --wait 300 --eval '({title:document.title, state:window.__unlit?.state, levels:window.__unlit?.levels?.length})'
Write-Output "EXIT=$LASTEXITCODE"
```

Exit code: `0`

Pasted output:

```text
FORBIDDEN_GREP_HITS=0
VM_LOAD_ALL_NO_DOM: SHOTS=object applyShot=function
SHOTS_STRICT_PARSE=OK bytes=6098
NODE_EXIT=0
=== SHOT 1 ===
EVAL: {"title":"READY","shotReady":true,"SHOT_READY":true,"state":"playing","level":"Canal Quarter","exposure":0,"hasLetter":false,"hidden":true,"guards":["PATROL","PATROL"],"swinging":[false,false],"hoverInReach":false,"results":null}
URL: file:///D:/the-unlit-hour/game/index.html?shot=1
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
EXIT=0
=== SHOT 2 ===
EVAL: {"title":"READY","shotReady":true,"SHOT_READY":true,"state":"playing","level":"Canal Quarter","exposure":0,"hasLetter":false,"hidden":true,"guards":["PATROL","PATROL"],"swinging":[true,false],"hoverInReach":true,"results":null}
URL: file:///D:/the-unlit-hour/game/index.html?shot=2
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
EXIT=0
=== SHOT 3 ===
EVAL: {"title":"READY","shotReady":true,"SHOT_READY":true,"state":"playing","level":"Gatehouse Court","exposure":58.3,"hasLetter":true,"hidden":false,"guards":["SUSPICIOUS","ALERT","PATROL"],"swinging":[false,false],"hoverInReach":false,"results":null}
URL: file:///D:/the-unlit-hour/game/index.html?shot=3
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
EXIT=0
=== SHOT 4 ===
EVAL: {"title":"READY","shotReady":true,"SHOT_READY":true,"state":"results","level":"Gatehouse Court","exposure":0,"hasLetter":true,"hidden":true,"guards":["PATROL","PATROL","PATROL"],"swinging":[false,false],"hoverInReach":false,"results":{"title":"DELIVERED UNSEEN","time":68.39999999999999,"timesSeen":0,"stars":3,"par":100,"completed":[true,true,true]}}
URL: file:///D:/the-unlit-hour/game/index.html?shot=4
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
EXIT=0
=== NORMAL PLAY (file://) ===
EVAL: {"title":"THE UNLIT HOUR","state":"title","levels":3}
URL: file:///D:/the-unlit-hour/game/index.html
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
EXIT=0
```

## 4. Total `game/` Source Size Check

Command:

```powershell
Get-ChildItem -Recurse -File D:\the-unlit-hour\game\js, D:\the-unlit-hour\game\style.css, D:\the-unlit-hour\game\index.html | Select-Object Name, Length; (Get-ChildItem -Recurse -File D:\the-unlit-hour\game\js, D:\the-unlit-hour\game\style.css, D:\the-unlit-hour\game\index.html | Measure-Object Length -Sum).Sum
```

Exit code: `0`

Pasted output:

```text
Name          Length
----          ------
audio.js       13004
game.js        13223
grid.js         3605
guard.js        7665
level-data.js   4122
levels.js       3817
player.js       3059
render.js      36028
screens.js      2590
shots.js        6098
ui.js          13624
util.js         2871
vision.js        781
style.css        862
index.html       789
112138
```

Total `game/` source size is 112,138 bytes (~109.5 KiB), well below the 140 KB contract cap.

## 5. Honest Visual Check (Full 1280×480 + 25% `320×120` Contact Sheet + `768×288` Cover)

All four PNGs in `screenshots/` and the contact sheet capture `docs/team/evidence/A-2-contact.png` (`tools/contact.html`) were inspected directly:

- **`01-overview.png` (`113,592 B`)**:
  - Level 2 Canal Quarter full map; both watchmen mid-patrol with warm gold cones, north cone cleanly clipped by the row-5 carts with sharp hard-edged shadows and no grazing corner spike; both dotted patrol loops; canal with drifting golden sine reflections and both plank bridges; both lattice screens; glinting letter at center; dim teal exit at east edge; 2.5D walls and carts with umbras; Wren at west start with cyan HIDDEN look, closed-eye `HIDDEN` badge, and dashed wall outline. HUD shows `THE UNLIT HOUR · 2 Canal Quarter`, empty letter icon, exposure 0, status `HIDDEN`.
  - **At 25% (`320×120`) and Cover (`768×288`)**: Cones, Wren, dashed wall cover outline, `HIDDEN` badge, glinting letter, canal/bridges, and screens are all clearly identifiable; the dim exit at the east edge is recognizable though deliberately subdued before taking the letter.
- **`02-turn-the-screen.png` (`107,433 B`)**:
  - Level 2; west screen caught mid-swing with faint rotation arc and unobstructed glowing cursor ring on its pivot; south-bank watchman's gold cone cut flat by the screen; Wren in the clear NW pocket behind the screen (`HIDDEN`, cyan look, `HIDDEN` badge above, dashed outline around the screen and adjacent pillar); exposure 0.
  - **At 25% (`320×120`)**: Flat-cut cone, angled lattice screen with pivot ring and arc, Wren, cover outline, and `HIDDEN` badge remain crisp and clearly separated.
- **`03-close-call.png` (`109,239 B`)**:
  - Level 3 Gatehouse Court; Wren holding the letter (filled HUD letter icon) inside the outer lower portion of the north watchman's gold cone with `?` above it (`exposure: 58.3%`, red `SEEN` status); south watchman `ALERT` with crimson cone, `!`, and red dotted BFS path to the red `X` last-seen marker; east gatehouse watchman patrolling beside the glowing `#7FFFD4` exit.
  - **At 25% (`320×120`)**: Red ALERT cone vs gold SUSPICIOUS cone, `!` and `?` markers, red dotted chase path to `X`, Wren, filled HUD letter icon + red exposure bar + `SEEN`, and glowing mint exit all read unmistakably.
- **`04-delivered.png` (`96,693 B`)**:
  - Level 3 results overlay over dimmed courtyard: `DELIVERED UNSEEN`, 3 gold stars, `Time 68.4 s · Par 100 s · Times seen 0`, `1 · 2 · 3` all lit in mint; all three watchmen's gold cones, courtyard columns, and the glowing exit at the east edge remain clearly readable behind the translucent panel.
  - **At 25% (`320×120`)**: Headline, stars, lit `1 · 2 · 3` strip, framing cones, and glowing east exit all stay sharp.

## 6. Not Done / Not Tested Yet

- **HTTP static server (`node serve.ts` → `http://localhost:8080`)**: Not tested in this task (tested `file://` URLs via headless Chrome and `tools/browser-check.mjs`).
- **`tools/shoot.md` / `shots.json` / `README.md`**: Owned by Gemini B per `CONTRACT.md` §1; untouched by Gemini A.
- **Full interactive keyboard/mouse playthrough & `main.ts` dossier determinism check**: Owned by GPT; not run here.
- **Claude Gate 1 / A-2 review and git commits**: Pending GPT verification and Claude review; no git commands were executed.
