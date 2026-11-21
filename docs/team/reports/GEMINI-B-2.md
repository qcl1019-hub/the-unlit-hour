# GEMINI-B-2 Delivery Report

Owner: Gemini B  
Scope: `README.md`, `tools/shoot.md`, `docs/team/reports/GEMINI-B-2.md` (docs only; Contract v1 §9 & §10)

## 1. Files Touched (Assigned Docs Only)

- `README.md` — Finalized root documentation: three make.fun live badges wrapped in competition links, game overview, Node.js `22.18 or newer` requirement, `file://` double-click & `node serve.ts` launch instructions, full controls table, clickable links to `screenshots/01-overview.png` .. `04-delivered.png`, optional live browser playthrough command (`node tools/playthrough.mjs --url file:///D:/the-unlit-hour/game/index.html`), and two-run byte-for-byte `main.ts` packaging check using two fresh uniquely named output directories while preserving/restoring `MAKEFUN_OUTPUT_DIR`.
- `tools/shoot.md` — Finalized screenshot capture guide (draft status removed): records Gemini A-2's `Start-Process -NoNewWindow -Wait -PassThru` capture flags (`--do-not-de-elevate`, `--headless=new`, `--force-device-scale-factor=1`, `--window-size=1280,480`, `--hide-scrollbars`, `--virtual-time-budget=5000`), provides a reliable Windows loop with quoted `"--user-data-dir=..."` (space-safe under `Start-Process`) + `Start-Process -Wait` + root-verified `Remove-Item -LiteralPath` cleanup, documents the headless `?shot=1..4` readiness assertion (`__shotReady`, `__SHOT_READY`, `document.title === 'READY'`), `node tools/check-shots.mjs`, and `tools/contact.html` check.
- `docs/team/reports/GEMINI-B-2.md` — This updated delivery report.

No other agents' files (`game/`, `screenshots/`, etc.) were edited; no `git`, push, upload, or submit commands were run; no raw logs were altered.

## 2. Checks Run & Actual Outputs

### A. Screenshot Header, Size, and Count Check (`tools/check-shots.mjs`)
Command:
```powershell
node tools/check-shots.mjs
```
Exit code: `0`
Output:
```text
PASS 01-overview.png 1280x480 113592B
PASS 02-turn-the-screen.png 1280x480 107433B
PASS 03-close-call.png 1280x480 109239B
PASS 04-delivered.png 1280x480 96693B
```

### B. Full Live Browser Zero-Exposure Playthrough (`tools/playthrough.mjs --url`)
Command:
```powershell
node tools/playthrough.mjs --url file:///D:/the-unlit-hour/game/index.html
```
Exit code: `0`
Output:
```text
EVAL: ["PASS Night Market: 20.52s, peak exposure 0, alerts 0, stars 3","PASS Canal Quarter: 23.02s, peak exposure 0, alerts 0, stars 3","PASS Gatehouse Court: 23.02s, peak exposure 0, alerts 0, stars 3","PASS title → all three deliveries → ending → title"]
URL: file:///D:/the-unlit-hour/game/index.html
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
```

### C. Headless Readiness Assertions (`?shot=1..4`) & `tools/contact.html` Browser Check
Command:
```powershell
1..4 | ForEach-Object { node tools/browser-check.mjs --url "file:///D:/the-unlit-hour/game/index.html?shot=$_" --wait 500 --eval "(() => { if (window.__shotReady !== true || window.__SHOT_READY !== true || document.title !== 'READY') throw new Error('Shot not ready'); return { ready: true, title: document.title, shot: window.__unlit.shot, state: window.__unlit.state }; })()"; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }; node tools/browser-check.mjs --url file:///D:/the-unlit-hour/tools/contact.html --wait 500
```
Exit code: `0`
Output:
```text
EVAL: {"ready":true,"title":"READY","shot":1,"state":"playing"}
URL: file:///D:/the-unlit-hour/game/index.html?shot=1
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
EVAL: {"ready":true,"title":"READY","shot":2,"state":"playing"}
URL: file:///D:/the-unlit-hour/game/index.html?shot=2
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
EVAL: {"ready":true,"title":"READY","shot":3,"state":"playing"}
URL: file:///D:/the-unlit-hour/game/index.html?shot=3
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
EVAL: {"ready":true,"title":"READY","shot":4,"state":"results"}
URL: file:///D:/the-unlit-hour/game/index.html?shot=4
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
URL: file:///D:/the-unlit-hour/tools/contact.html
CONSOLE_ISSUES: 0
EXCEPTIONS: 0
OUTSIDE_REQUESTS: 0
```

### D. Reproducible Two-Run `main.ts` Packaging (Fresh Unique Output Dirs + Env Restore) & Space-Path `Start-Process` Check
Command (README packaging snippet tested with sentinel `MAKEFUN_OUTPUT_DIR=D:\sentinel-keep`):
```powershell
$env:MAKEFUN_OUTPUT_DIR = "D:\sentinel-keep"
$prevOutDir = $env:MAKEFUN_OUTPUT_DIR
$runId = [guid]::NewGuid().ToString("N")
$out1 = Join-Path $env:TEMP "unlit-out-$runId-1"
$out2 = Join-Path $env:TEMP "unlit-out-$runId-2"
try {
  $env:MAKEFUN_OUTPUT_DIR = $out1; node main.ts
  if ($LASTEXITCODE -ne 0) { throw "main.ts run 1 failed" }
  $env:MAKEFUN_OUTPUT_DIR = $out2; node main.ts
  if ($LASTEXITCODE -ne 0) { throw "main.ts run 2 failed" }
  node --input-type=module -e "import fs from 'node:fs'; import path from 'node:path'; const d1=process.argv[1], d2=process.argv[2]; const walk=(d,b=d)=>fs.readdirSync(d,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name),b):[path.relative(b,path.join(d,e.name))]); const a=walk(d1), c=walk(d2); if(JSON.stringify(a)!==JSON.stringify(c)) throw new Error('File list mismatch'); for(const f of a){ const b1=fs.readFileSync(path.join(d1,f)), b2=fs.readFileSync(path.join(d2,f)); if(!b1.equals(b2)) throw new Error('Byte mismatch: '+f); } console.log('DETERMINISTIC_OK files='+a.length);" "$out1" "$out2"
} finally {
  if ($null -eq $prevOutDir) { Remove-Item Env:MAKEFUN_OUTPUT_DIR -ErrorAction SilentlyContinue } else { $env:MAKEFUN_OUTPUT_DIR = $prevOutDir }
}
"RESTORED_ENV=$($env:MAKEFUN_OUTPUT_DIR)"
Remove-Item Env:MAKEFUN_OUTPUT_DIR -ErrorAction SilentlyContinue
```
Exit code: `0`
```text
DETERMINISTIC_OK files=20
RESTORED_ENV=D:\sentinel-keep
```

Command (`tools/shoot.md` `Start-Process` with quoted `--user-data-dir` containing spaces + root-verified `Remove-Item -LiteralPath`, output written outside repo to `D:\unlit-scratch\space-shot-1.png` without overwriting `screenshots/`):
```powershell
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$tempRoot = "D:\unlit-scratch"
$profileRoot = Join-Path $tempRoot ("space profiles " + [guid]::NewGuid().ToString("N"))
$profileDir = Join-Path $profileRoot "shot 1"
$out = "D:\unlit-scratch\space-shot-1.png"
New-Item -ItemType Directory -Force -Path $profileDir | Out-Null
try {
  $url = "file:///D:/the-unlit-hour/game/index.html?shot=1"
  $args = @(
    "--headless=new",
    "--do-not-de-elevate",
    "`"--user-data-dir=$profileDir`"",
    "--no-first-run",
    "--no-default-browser-check",
    "--force-device-scale-factor=1",
    "--window-size=1280,480",
    "--hide-scrollbars",
    "--virtual-time-budget=5000",
    "`"--screenshot=$out`"",
    "`"$url`""
  )
  $proc = Start-Process -FilePath $chrome -ArgumentList $args -NoNewWindow -Wait -PassThru
  if ($proc.ExitCode -ne 0) { throw "Chrome failed with exit $($proc.ExitCode)" }
} finally {
  $resolvedProfile = [System.IO.Path]::GetFullPath($profileDir)
  $resolvedRoot = [System.IO.Path]::GetFullPath($profileRoot).TrimEnd('\') + '\'
  if ($resolvedProfile.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    Remove-Item -LiteralPath $resolvedProfile -Recurse -Force -ErrorAction SilentlyContinue
  }
}
$eq = [System.IO.File]::ReadAllBytes($out).Length -eq [System.IO.File]::ReadAllBytes("D:\the-unlit-hour\screenshots\01-overview.png").Length -and ((Get-FileHash -Algorithm SHA256 $out).Hash -eq (Get-FileHash -Algorithm SHA256 "D:\the-unlit-hour\screenshots\01-overview.png").Hash)
"SPACE_PROFILE_TEST bytes=$((Get-Item $out).Length) byte_equal=$eq profile_removed=$(-not (Test-Path -LiteralPath $profileDir))"
```
Exit code: `0`
```text
113592 bytes written to file D:\unlit-scratch\space-shot-1.png
SPACE_PROFILE_TEST bytes=113592 byte_equal=True profile_removed=True
```

### E. Badges, Local Markdown Links, and `tools/shoot.md` Flag/Path Check
Command:
```powershell
node D:/unlit-scratch/b2-check.mjs
```
Exit code: `0`
Output:
```text
BADGE OK: https://make.fun/badge/best-stealth-game-20261121-1759.svg
BADGE OK: https://make.fun/badge/best-stealth-game-20261121-1759/qcl1019-hub/the-unlit-hour/rank.svg
BADGE OK: https://make.fun/badge/best-stealth-game-20261121-1759/qcl1019-hub/the-unlit-hour/reward.svg
README_LINK OK: game/index.html
README_LINK OK: shots.json
README_LINK OK: screenshots/01-overview.png
README_LINK OK: screenshots/02-turn-the-screen.png
README_LINK OK: screenshots/03-close-call.png
README_LINK OK: screenshots/04-delivered.png
README_LINK OK: tools/shoot.md
README_LINK OK: tools/check-shots.mjs
README_LINK OK: tools/contact.html
README_LINK OK: game/index.html
README_LINK OK: game/style.css
README_LINK OK: serve.ts
README_LINK OK: main.ts
README_LINK OK: vendor/makefun-game.ts
README_LINK OK: shots.json
README_LINK OK: tools/shoot.md
README_LINK OK: tools/check-shots.mjs
README_LINK OK: tools/contact.html
README_LINK OK: tools/browser-check.mjs
README_LINK OK: tools/logic-test.mjs
README_LINK OK: tools/playthrough.mjs
README_LINK OK: LICENSE
SHOT_SYNC 01-overview.png ?shot=1: readme=true shoot=true
SHOT_SYNC 02-turn-the-screen.png ?shot=2: readme=true shoot=true
SHOT_SYNC 03-close-call.png ?shot=3: readme=true shoot=true
SHOT_SYNC 04-delivered.png ?shot=4: readme=true shoot=true
SHOOT_FLAG --headless=new: count=6
SHOOT_FLAG --do-not-de-elevate: count=8
SHOOT_FLAG --force-device-scale-factor=1: count=6
SHOOT_FLAG --window-size=1280,480: count=6
SHOOT_FLAG --hide-scrollbars: count=6
SHOOT_FLAG --virtual-time-budget=5000: count=6
SHOOT_FLAG --screenshot=: count=6
PATH_STATE game/index.html: exists=true
PATH_STATE game/js/game.js: exists=true
PATH_STATE tools/browser-check.mjs: exists=true
PATH_STATE tools/check-shots.mjs: exists=true
PATH_STATE tools/contact.html: exists=true
PATH_STATE shots.json: exists=true
PATH_STATE game/js/shots.js: exists=true
PATH_STATE docs/team/reports/GEMINI-A-2.md: exists=true
PATH_STATE screenshots: exists=true
LINK_PATH_ERRORS=0
```

## 3. Not Tested in This Report

- **Remote badge SVG HTTP fetch**: Verified exact badge URLs and link wrapping locally per `CONTRACT.md` §9; did not fetch `https://make.fun/...` over the network.
- **HTTP server (`node serve.ts`) manual play**: Covered in `GPT-GATE-1.md` and documented in `README.md`; this B-2 finalization pass re-verified `file://` shots, `tools/contact.html`, `tools/playthrough.mjs --url`, `tools/check-shots.mjs`, and `main.ts` determinism.
