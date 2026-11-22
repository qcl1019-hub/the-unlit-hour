# REVIEW-1 — Gate 1 (logic) + Gate 2 (before SUBMIT 1)

Reviewer: Claude, 2026-11-21 ~22:20 UTC, on commit 6b6feb4.
Verdict: **PASS with 3 blockers before the user submits.** Game quality is good enough for submission 1.

## What I re-ran myself (not taken from reports)
| Check | Result |
|---|---|
| grep game/ for http, fetch(, XMLHttpRequest, WebSocket, `import `, type="module", Math.random, Date.now, new Date, eval(, new Function, setInterval, performance.now | 0 hits |
| `cmp vendor/makefun-game.ts <kit>/starter/vendor/makefun-game.ts` | identical |
| `node tools/check-shots.mjs` | 4 × PASS, 1280×480, 96–114 KB, exit 0 |
| `node tools/logic-test.mjs` | 42 passed, 0 failed, exit 0 |
| `node tools/browser-check.mjs` on the packaged run1 game (file://), Enter + moves | state playing, 0 console issues, 0 exceptions, 0 outside requests, exit 0 |
| README badges | all three badge URLs present |
| game/ size | 15 files, 112 KB (whole source fits the 160 KiB dossier text) |

## Gate 1 — logic (read guard.js, vision.js, exposureRate/advanceExposure)
- Exposure formula `(60 + 140(1 − d/256)) × 0.6 if sneaking`, −35/s, clamp 0..100: correct, shared by game and test.
- Cone: 80 rays from facing−35° to +35° inclusive, range 256, DDA; detection = angle + distance + LOS on the player
  center: correct.
- States: PATROL/RETURN/SEARCH → SUSPICIOUS on sight with exposure > 0; ALERT at 100 while seen, `enteredAlert`
  only on a real state change (timesSeen counts once per entry); SUSPICIOUS → RETURN at 0; ALERT → SEARCH at the
  last-seen tile or when no path; SEARCH 4 s full turn → RETURN → PATROL at the nearest waypoint; only ALERT
  catches, at 0.6 tiles. Matches CONTRACT §6.
- No logic blocker.

## Gate 2 — screenshots (looked at all four at full size)
All four show what the spec asks: cover = Canal Quarter with two gold cones (one notched by carts), dotted loops,
canal + both bridges, both screens, letter at center, dim exit east, Wren HIDDEN with badge and dashed outline,
HUD capsules. 02 swing arc + ring + flat cut; 03 "?" + ~60 % SEEN + red ALERT cone, "!", path to the marker,
exit lit; 04 DELIVERED UNSEEN, 3 stars, 68.4 s < 100, 1·2·3 lit. Accepted as they are.

## BLOCKERS (do these before asking the user to submit)
1. **HTTP favicon 404.** Add `<link rel="icon" href="data:,">` to `game/index.html` (a data: URI passes the kit's
   references row). Re-run the HTTP playthrough (0 console errors), `node main.ts` twice + cmp, check-shots.
   Screenshots need no recapture (index.html change does not change the render) — but confirm one `?shot=1`
   recapture is still byte-identical to the committed PNG.
2. **Full transcript bundle + kit `check` with `--transcripts`.** Not run yet; this is the biggest remaining risk
   (authored-lines ≥ 30 %, unwritten ≤ 40 %, run record, in-window timestamps). Include: both Codex sessions (the
   first one is the parent of the transfer session — both must be uploaded), both Antigravity sessions, and
   Claude: `C:\Users\Antigravity2\.claude\projects\C--Users-Antigravity2\6fd6aa3e-f6e0-480a-be62-c1ca194c0294.jsonl`.
   Redaction: `--redact-file C:\Users\Public\zhuma-handoff\redact.txt` (the user writes it; never print it). Put the
   bundle OUTSIDE the repo. Paste the check output (every row) in STATUS.md. If any row fails: stop and write
   `NEEDS CLAUDE:` with the output.
3. **Push and verify.** After 1–2 pass and are committed: ask the user to double-click `unlit-github-push.cmd`,
   then `git ls-remote origin main` must equal the local HEAD. Only then ask the user to submit.

## Not blockers — after submission 1, if time allows (in this order)
a. Shot 03: the spec says Wren "at the EDGE of one cone"; she is well inside it. Move her to the rim.
b. Cover (01): the east third is empty floor. Consider a camera-neutral fix in the scene only (e.g. time the
   north-bridge watchman so his cone points east into that space) — do not move map geometry for it.
c. The automatic unseen routes finish in 20–23 s against pars of 45/75/100: fine for "finishable unseen", but tell
   me if levels 2–3 can really be crossed that fast by a human — if so, the patrols may be too easy to read.

Next: write the 3 blockers' evidence in STATUS.md with `NEEDS CLAUDE: Gate 2 recheck` (I only need the outputs).
