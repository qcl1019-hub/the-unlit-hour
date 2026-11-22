# THE UNLIT HOUR

[![Competition](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![Rank](https://make.fun/badge/best-stealth-game-20261121-1759/qcl1019-hub/the-unlit-hour/rank.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![Reward](https://make.fun/badge/best-stealth-game-20261121-1759/qcl1019-hub/the-unlit-hour/reward.svg)](https://make.fun/c/best-stealth-game-20261121-1759)

A top-down stealth game built in pure HTML5 Canvas and vanilla JavaScript for the [make.fun Best Stealth Game](https://make.fun/c/best-stealth-game-20261121-1759) competition.

You play as **Wren**, a courier crossing a lantern-lit canal town after curfew. Slip past patrolling watchmen, rotate 3-tile lattice screens to reshape sightlines and open quiet lanes, retrieve **THE SEALED LETTER**, and reach the **CANAL GATE** unseen.

## Features

- **Three handcrafted levels**: `1 Night Market` (par 45 s), `2 Canal Quarter` (par 75 s), and `3 Gatehouse Court` (par 100 s), each validated at startup and completable with zero alerts.
- **Real-time DDA vision cones**: 80-ray visibility wedges (`35°` half-angle, `256 px` range) clipped cleanly by walls, carts, and lattice screens, passing freely over canal water.
- **Rotatable lattice screens**: Click any pivot within 3 tiles to swing a 3-tile screen `90°`, cutting off lantern beams or opening guarded shortcuts (blocked if occupied by Wren or a watchman).
- **Pebble distraction**: Click any walkable floor tile within 6 tiles and line of sight to toss a pebble (3 per level), creating a noise ring that draws nearby watchmen (`PATROL` / `RETURN` / `SEARCH`) to investigate.
- **Six-state watchmen & exposure meter**: `PATROL` → `INVESTIGATE` (`?`) / `SUSPICIOUS` (`?`) → `ALERT` (`!`, BFS pursuit) → `SEARCH` → `RETURN`, with guard speech barks and a continuous global exposure meter (`0–100`) that fills slower while sneaking.
- **Lamplight & dousing**: Lit lamp posts cast warm pools that reveal Wren from `1.6×` cone range (`410 px` instead of `256 px`); press `E` beside a lit lamp to douse it for the run (at the cost of a 4-tile noise ring).
- **Toggleable Field Notes & objective cue**: Press `H` during play to display or hide the compact Field Notes legend; a small top objective capsule tracks whether Wren is fetching the letter or heading for the gate, and the results overlay replays your sampled route trail.
- **Synthesized WebAudio**: Procedural footsteps (with stereo-panned, distance-scaled watchman steps), wooden screen creaks, blocked thuds, stone pebble clicks, lamp douse hiss, exposure-reactive heartbeat, chimes, gate chords, and nocturnal canal ambience with zero audio asset files.
- **Zero dependencies & offline-ready**: Plain classic `<script src="js/...">` tags, zero external network requests, zero bundlers.

## How to Run

### Option 1 — Double-click (`file://`)

Open [`game/index.html`](game/index.html) directly in a desktop browser (such as Chrome). No build step or local server is required.

### Option 2 — Local static server (`node serve.ts`)

Requires Node.js 22.18 or newer:

```powershell
node serve.ts
```

Then open `http://localhost:8080` in your browser.

## Controls

| Input | Action |
|---|---|
| `W` `A` `S` `D` or `Arrow` keys | Move |
| `Shift` (hold) | Sneak (slower pace, `0.6×` exposure buildup) |
| `Left Click` on screen pivot | Rotate lattice screen `90°` (within 3 tiles) |
| `Left Click` on walkable floor | Toss a pebble (within 6 tiles & LOS, 3 per level) to distract nearby watchmen |
| `E` | Pick up the Sealed Letter (adjacent) / Exit via Canal Gate (with letter) / Douse a nearby lit lamp |
| `H` | Toggle Field Notes legend overlay |
| `R` | Restart current level |
| `Esc` | Pause / Resume |
| `M` | Mute / Unmute synthesized WebAudio |
| `Enter` | Start / Confirm / Next level |
| `1`–`3` or `Arrow` keys (Title) | Select unlocked level |

## Screenshots & Reproduction

The entry includes four deterministic `1280×480` PNG screenshots defined in [`shots.json`](shots.json) and rendered via the game's built-in `?shot=1..4` mode (seeded with `SHOT_SEED = 1337`, fixed `1/60 s` simulation steps, no `rAF` loop):

| File | Query | Scene |
|---|---|---|
| [`screenshots/01-overview.png`](screenshots/01-overview.png) | `?shot=1` | Cover — Level 2 (`Canal Quarter`) with Wren `HIDDEN` at the cone rim, a doused lamp nearby + lit lamps, north watchman in `INVESTIGATE` toward a landed pebble, south watchman's cone cut by the west screen, callouts, and Field Notes |
| [`screenshots/02-turn-the-screen.png`](screenshots/02-turn-the-screen.png) | `?shot=2` | Level 2 west lattice screen caught mid-swing, cutting the south-bank watchman's cone flat while Wren hides behind it |
| [`screenshots/03-close-call.png`](screenshots/03-close-call.png) | `?shot=3` | Level 3 (`Gatehouse Court`) close call with Wren at the `?` cone rim carrying the letter (`SEEN`), an `ALERT` watchman (`!`) in pursuit, callouts, and Field Notes |
| [`screenshots/04-delivered.png`](screenshots/04-delivered.png) | `?shot=4` | Level 3 `DELIVERED UNSEEN` results panel (3 stars, under par, `1·2·3` strip) over the dimmed courtyard and dotted cyan replay trail |

To reproduce the captures in headless Chrome and verify size/thumbnail readability, see [`tools/shoot.md`](tools/shoot.md), [`tools/check-shots.mjs`](tools/check-shots.mjs), and [`tools/contact.html`](tools/contact.html).

## Validation & Packaging

Run the repository verification scripts with Node.js 22.18 or newer:

```powershell
# Logic unit suite and full 3-level zero-exposure playthrough (Node VM and optional live browser replay)
node tools/logic-test.mjs
node tools/playthrough.mjs
node tools/playthrough.mjs --url file:///D:/the-unlit-hour/game/index.html

# Headless Chrome console / exception / zero-outside-network check
node tools/browser-check.mjs --url file:///D:/the-unlit-hour/game/index.html --wait 3000

# Screenshot format, 1280x480 dimension, and <= 262,144 byte check
node tools/check-shots.mjs

# Deterministic packaging build check: two fresh unique output dirs compared byte-for-byte (preserves MAKEFUN_OUTPUT_DIR)
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
```

## Project Layout

- [`game/index.html`](game/index.html), [`game/style.css`](game/style.css), `game/js/` — Game source (classic scripts, `1280×480` canvas)
- [`serve.ts`](serve.ts) — Zero-dependency Node static file server for `game/`
- [`main.ts`](main.ts), [`vendor/makefun-game.ts`](vendor/makefun-game.ts) — Deterministic entry packager and vendored competition SDK
- [`shots.json`](shots.json), [`tools/shoot.md`](tools/shoot.md), [`tools/check-shots.mjs`](tools/check-shots.mjs), [`tools/contact.html`](tools/contact.html), [`tools/browser-check.mjs`](tools/browser-check.mjs) — Screenshot capture spec and verification tools
- [`tools/logic-test.mjs`](tools/logic-test.mjs), [`tools/playthrough.mjs`](tools/playthrough.mjs) — Automated logic and full-game playthrough tests
- [`LICENSE`](LICENSE) — MIT License
