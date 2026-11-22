# Screenshot Capture & Reproduction Guide

All four entry screenshots in `screenshots/` are deterministic `1280×480` PNG renders of `game/index.html?shot=1` through `?shot=4` (mapped in `../shots.json`). In shot mode, `game/js/game.js` adds class `shot` to `<html>`, skips `requestAnimationFrame`, seeds `mulberry32(1337)`, runs `applyShot(game, N)` from `game/js/shots.js` (enabling Field Notes + callouts on shots 1–3 and disabling them on shot 4), renders one frame, sets `window.__shotReady = true` and `window.__SHOT_READY = true`, and sets `document.title = 'READY'`.

## Prerequisites

- Desktop Google Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`
- Node.js 22.18 or newer
- Run from repository root `D:\the-unlit-hour`
- Always pass `--do-not-de-elevate` when launching Chrome from an elevated shell on Windows

## Gemini A-2 Capture Method & Reproducible Windows Commands

Gemini A-2 captured `screenshots/01-overview.png` through `04-delivered.png` with `Start-Process -NoNewWindow -Wait -PassThru` invoking `chrome.exe` using `--headless=new --do-not-de-elevate --force-device-scale-factor=1 --window-size=1280,480 --hide-scrollbars --virtual-time-budget=5000 --screenshot=...`. Independent recapture with a unique `--user-data-dir` per capture and `Start-Process -Wait` produces byte-identical PNGs.

Using a dedicated temporary `--user-data-dir` per capture prevents profile-lock collisions and ensures clean deterministic runs in PowerShell:

```powershell
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$shots = @(
  @{ n = 1; file = "01-overview.png" },
  @{ n = 2; file = "02-turn-the-screen.png" },
  @{ n = 3; file = "03-close-call.png" },
  @{ n = 4; file = "04-delivered.png" }
)
$tempRoot = [System.IO.Path]::GetFullPath($env:TEMP).TrimEnd('\') + '\'
$profileRoot = Join-Path $tempRoot ("unlit-shot-profiles-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $profileRoot, "D:\the-unlit-hour\screenshots" | Out-Null

foreach ($s in $shots) {
  $profileDir = Join-Path $profileRoot ("shot-" + $s.n)
  New-Item -ItemType Directory -Force -Path $profileDir | Out-Null
  try {
    $out = "D:\the-unlit-hour\screenshots\$($s.file)"
    $url = "file:///D:/the-unlit-hour/game/index.html?shot=$($s.n)"
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
    if ($proc.ExitCode -ne 0) { throw "Chrome failed on shot $($s.n) with exit $($proc.ExitCode)" }
  } finally {
    $resolvedProfile = [System.IO.Path]::GetFullPath($profileDir)
    $resolvedRoot = [System.IO.Path]::GetFullPath($profileRoot).TrimEnd('\') + '\'
    if ($resolvedProfile.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
      Remove-Item -LiteralPath $resolvedProfile -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
}
```

Equivalent individual commands (run from `D:\the-unlit-hour`, using unique `--user-data-dir` paths if a default profile is active):

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --do-not-de-elevate --user-data-dir="$env:TEMP\unlit-shot-1" --no-first-run --no-default-browser-check --force-device-scale-factor=1 --window-size=1280,480 --hide-scrollbars --virtual-time-budget=5000 --screenshot="D:\the-unlit-hour\screenshots\01-overview.png" "file:///D:/the-unlit-hour/game/index.html?shot=1"
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --do-not-de-elevate --user-data-dir="$env:TEMP\unlit-shot-2" --no-first-run --no-default-browser-check --force-device-scale-factor=1 --window-size=1280,480 --hide-scrollbars --virtual-time-budget=5000 --screenshot="D:\the-unlit-hour\screenshots\02-turn-the-screen.png" "file:///D:/the-unlit-hour/game/index.html?shot=2"
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --do-not-de-elevate --user-data-dir="$env:TEMP\unlit-shot-3" --no-first-run --no-default-browser-check --force-device-scale-factor=1 --window-size=1280,480 --hide-scrollbars --virtual-time-budget=5000 --screenshot="D:\the-unlit-hour\screenshots\03-close-call.png" "file:///D:/the-unlit-hour/game/index.html?shot=3"
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --do-not-de-elevate --user-data-dir="$env:TEMP\unlit-shot-4" --no-first-run --no-default-browser-check --force-device-scale-factor=1 --window-size=1280,480 --hide-scrollbars --virtual-time-budget=5000 --screenshot="D:\the-unlit-hour\screenshots\04-delivered.png" "file:///D:/the-unlit-hour/game/index.html?shot=4"
```

## Post-Capture Verification (README Reproduction Path)

1. **Headless readiness assertion & clean console/network check** for all four `?shot=1..4` URLs (`--do-not-de-elevate` handled inside `tools/browser-check.mjs`):
   ```powershell
   1..4 | ForEach-Object {
     node tools/browser-check.mjs --url "file:///D:/the-unlit-hour/game/index.html?shot=$_" --wait 500 --eval "(() => { if (window.__shotReady !== true || window.__SHOT_READY !== true || document.title !== 'READY') throw new Error('Shot not ready'); return { ready: true, title: document.title, shot: window.__unlit.shot, state: window.__unlit.state }; })()"
     if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
   }
   ```
2. **PNG header, exact `1280×480` dimension, count (`3–4`), and `<= 262,144` byte cap check**:
   ```powershell
   node tools/check-shots.mjs
   ```
3. **25% shrink & cover check**: Open `tools/contact.html` in a browser (or capture it in headless Chrome) to inspect all four thumbnails at `320×120` side by side and `01-overview.png` at `768×288`. Never post-edit captured PNGs; if anything fails size or legibility, adjust `game/js/shots.js` or `game/js/render.js` and recapture.
