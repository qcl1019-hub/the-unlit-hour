# GPT Gate 1 review evidence

Implemented `game/index.html`, `levels.js`, `guard.js`, and `game.js`. Integrated the handoff versions of `util.js`, `grid.js`, `screens.js`, `vision.js`, and `player.js`. Added `tools/logic-test.mjs` and `tools/playthrough.mjs`. The shared exposure functions are `exposureRate` and `advanceExposure` in `player.js`.

Removed the seven tracked kit scripts in `game/src/` and `screenshots/1-start.jpg`, `2-play.jpg`, and `3-end.jpg`. The ten files matched Step 0. The scoped `git rm` of those exact paths returned 0 in the resumed session. The earlier rejections are recorded in the transfer note.

## Logic and full replay

```powershell
node tools/logic-test.mjs
node tools/playthrough.mjs
```

Both exited 0. The first command reports each assertion independently.

```text
Logic checks: 42 passed, 0 failed
PASS Night Market: 20.52s, peak exposure 0, alerts 0, stars 3
PASS Canal Quarter: 23.02s, peak exposure 0, alerts 0, stars 3
PASS Gatehouse Court: 23.02s, peak exposure 0, alerts 0, stars 3
PASS title → all three deliveries → ending → title
```

The replay advances the actual Game with keyboard input at 60 ticks per second. Peak exposure is sampled on every tick. At the end of a screen swing, the game rechecks occupancy so a character entering during the swing cannot be trapped. A late obstruction restores the previous angle and plays the same feedback as a blocked click.

## Browser integration

```powershell
node tools/browser-check.mjs --url file:///D:/the-unlit-hour/game/index.html --wait 300 --keys 'Enter:120,KeyD:500,Escape:120,KeyM:120,Escape:120,KeyR:120' --eval 'JSON.stringify({state:__unlit.state,name:__unlit.level.name,audio:__unlit.sfx.ctx?.state,muted:__unlit.muted,canvas:[__unlit.canvas.width,__unlit.canvas.height]})'
node tools/browser-check.mjs --url 'file:///D:/the-unlit-hour/game/index.html?breaklevel=1' --wait 500 --eval 'JSON.stringify({state:__unlit.state,message:__unlit.errorMessage})'
node tools/browser-check.mjs --url http://localhost:8080/ --wait 400 --keys 'Enter:150,KeyD:500' --eval 'JSON.stringify({state:__unlit.state,level:__unlit.level.name,exposure:__unlit.exposure,x:__unlit.player.x})'
```

Each reached the expected game state and logged zero uncaught exceptions and zero outside requests. Exit 1 is expected at this checkpoint because `shots.js` awaits A-2 and the HTTP server also returned 404 for Chrome’s implicit favicon request.

```text
FILE keyboard: state=playing, name=Night Market, audio=running, muted=true, canvas=[1280,480]
FILE synthetic pointer/click: start=[NS,true,true], end=[EW,false], state=playing, audioContextCreated=false
FILE breaklevel: state=error, message=Level 1 Night Market: map must contain 15 rows of 40 valid tiles
HTTP keyboard: state=playing, level=Night Market, exposure=0, x=85.12000000000003
```

The malformed-level overlay is captured in `docs/team/evidence/GPT-gate1-invalid-level.png` (1280×480).

## Gemini delivery review

- B (`089c3f7`). Re-ran `node D:/unlit-scratch/b-check.mjs`, `node D:/unlit-scratch/check-files.mjs`, the PNG checker on a good and deliberately wrong-sized set, and the browser check on the scratch HTML and audio harness. The wrong-sized set returned 1. The good set and both browser runs returned 0. The actual gameplay replay verifies each map is completable with zero exposure.
- A (`066ef26`). Re-ran `tools/browser-check.mjs` against the play, title and results mock previews. Each returned 0. Recaptured all three Chrome previews at 1280×480, and each PNG matched the delivered preview byte for byte. Inspected the 320×120 thumbnails. Cones, cover and the courier are distinguishable. The unlit exit and small HUD text are the quietest elements.
- Project scripts passed strict module syntax parsing. The runtime file scan found zero forbidden substrings.

## Local transcript probe

From the kit directory, ran `node cli/makefun.mjs bundle --no-discover --no-superbot-attest --dry-run --json` with `MAKEFUN_OFFLINE=1`, the two explicit Codex rollout files, both Antigravity conversation directories and their four saved stream files. Exit 0. It identified both native Antigravity conversations and both Codex rollouts. The two initial PowerShell stream files use UTF-16LE and the kit skipped them. The native conversations and the resume streams are preserved. The kit reported the two native Antigravity protobuf usage records as unread and the build cost as unknown. The Claude session, redaction file and complete run record still need to be included before a full local bundle and authored-line check.

## Pending

Claude’s Gate 1 logic review. Screenshot mode and the final four PNGs, live badge README, clean full-game browser console, final reproducible build and transcript gate. All work remains local.
