# Local release verification

The original Antigravity conversations delivered the four capture scenes and the player-facing documentation. GPT independently verified the artifacts, added a Chrome mode to `tools/playthrough.mjs`, and kept Claude review pending in `STATUS.md`.

## Full playthrough

```powershell
node tools/logic-test.mjs
node tools/playthrough.mjs
node tools/playthrough.mjs --url file:///D:/the-unlit-hour/game/index.html
node tools/playthrough.mjs --url file:///D:/unlit-scratch/gpt-release-package-20261121-135413/run1/game/index.html
```

All commands exited 0. Both Chrome runs reported `CONSOLE_ISSUES: 0`, `EXCEPTIONS: 0`, and `OUTSIDE_REQUESTS: 0`.

```text
Logic checks: 42 passed, 0 failed
PASS Night Market: 20.52s, peak exposure 0, alerts 0, stars 3
PASS Canal Quarter: 23.02s, peak exposure 0, alerts 0, stars 3
PASS Gatehouse Court: 23.02s, peak exposure 0, alerts 0, stars 3
PASS title → all three deliveries → ending → title
```

`node serve.ts` and `node tools/playthrough.mjs --url http://localhost:8080/` completed the same replay. The browser checker exited 1 with one console error for Chrome’s implicit `/favicon.ico` request. Exceptions and outside requests were both zero. The entry retains the contract’s exact HTML without a favicon link.

## Captures and source

`node tools/check-shots.mjs` exited 0 for exactly four PNGs at 1280×480. Headless Chrome confirmed both READY flags, title `READY`, and zero console issues, exceptions, or outside requests for each scene. Shot 2 had the west screen mid-swing with Wren hidden. Shot 3 measured 58.3 exposure and both SUSPICIOUS and ALERT guards. Shot 4 reached the three-star results state.

```text
PASS 01-overview.png 1280x480 113592B
PASS 02-turn-the-screen.png 1280x480 107433B
PASS 03-close-call.png 1280x480 109239B
PASS 04-delivered.png 1280x480 96693B
SOURCE CLEAN: 13 strict-parse scripts; 112138 source bytes
```

Recaptured all four scenes into `D:/unlit-scratch/gpt-release-capture-20261121-135344` using the Chrome flags in the A-2 report and separate temporary profiles. `cmp -s` confirmed every recapture matched its committed PNG. Opened `tools/contact.html` at 320×120 per thumbnail and 768×288 for the cover. Cones, courier, cover and exit read in the thumbnail layout. The small `HIDDEN` badge is easiest to read at cover size. `node D:/unlit-scratch/b2-check.mjs` verified the three competition badge links and the local README paths.

## Two identical packages

```powershell
$env:MAKEFUN_OUTPUT_DIR = 'D:/unlit-scratch/gpt-release-package-20261121-135413/run1'
node main.ts
$env:MAKEFUN_OUTPUT_DIR = 'D:/unlit-scratch/gpt-release-package-20261121-135413/run2'
node main.ts
```

Both exited 0. Compared the sorted relative file lists and then ran `cmp -s` on every output file. Separately compared all 19 packaged game and screenshot files with the workspace tree and compared `vendor/makefun-game.ts` with the official kit copy. All comparisons succeeded.

```text
PACKAGES MATCH: 20 files; 686636 dossier bytes
SHA-256 898F001B25B2E7F20854474EC3C6E949651F3A0E8EFAFFFA7C0878300157F96B
VENDOR MATCHES KIT
```

## Submission prerequisites

Claude has no new REVIEW file in the workspace. The offline transcript dry-run identifies both Antigravity sessions and both Codex rollouts, with the Antigravity CLI version verified by `agy.exe --version` as `1.5.14`. The full record still needs Claude’s original session and the personal redaction file. Kit diagnostics require the earlier Codex tools `codex_apps`, `cua_repl`, and `node_repl` to be declared in the complete run record. The native Antigravity token totals remain unread by this kit. The complete transcript bundle and authored-line check are pending. All repository and release artifacts remain local.
