// Overlay screens and hint capsules for title, pause, caught, results, ending, and error states.

function uiFormatSeconds(sec) {
  const safe = Math.max(0, Number(sec) || 0);
  return safe.toFixed(1) + ' s';
}

function uiDrawStar(ctx, cx, cy, outerR, innerR, filled) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = (i % 2 === 0) ? outerR : innerR;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  if (filled) {
    ctx.fillStyle = COLORS.letterGlint;
    ctx.fill();
    ctx.strokeStyle = COLORS.seen;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    ctx.fillStyle = COLORS.wallFront;
    ctx.fill();
    ctx.strokeStyle = COLORS.wallEdge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

function uiDrawLevelStrip(ctx, cx, cy, completed) {
  const done = completed || [false, false, false];
  const spacing = 54;
  const r = 14;

  ctx.save();
  // Connecting dots between 1, 2, 3.
  ctx.fillStyle = COLORS.wallEdge;
  for (let i = 0; i < 2; i++) {
    const mx = cx + (i - 0.5) * spacing;
    ctx.beginPath();
    ctx.arc(mx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 3; i++) {
    const x = cx + (i - 1) * spacing;
    const lit = Boolean(done[i]);

    if (lit) {
      const grad = ctx.createRadialGradient(x, cy, 2, x, cy, r + 9);
      grad.addColorStop(0, rndColorAlpha(COLORS.exitLit, 0.35));
      grad.addColorStop(1, rndColorAlpha(COLORS.exitLit, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, cy, r + 9, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(x, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = lit ? COLORS.exitLit : COLORS.wallFront;
    ctx.fill();
    ctx.strokeStyle = lit ? COLORS.exitLit : COLORS.exitDim;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = lit ? COLORS.background : COLORS.hudText;
    ctx.font = 'bold 15px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), x, cy + 0.5);
  }
  ctx.restore();
}

function uiWrapLines(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const test = line ? (line + ' ' + words[i]) : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = words[i];
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function uiDrawBackdrop(ctx, time) {
  ctx.save();
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle architectural tile grid in the dark.
  ctx.strokeStyle = rndColorAlpha(COLORS.floorSeam, 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = TILE; x < WIDTH; x += TILE) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, HEIGHT);
  }
  for (let y = TILE; y < HEIGHT; y += TILE) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(WIDTH, y + 0.5);
  }
  ctx.stroke();

  // Atmospheric lantern beam sweeping subtly from left side.
  const sweep = -0.05 + Math.sin((time || 0) * 0.45) * 0.08;
  const ox = 110;
  const oy = HEIGHT * 0.52;
  const range = 580;
  const half = 22 * DEG;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.arc(ox, oy, range, sweep - half, sweep + half, false);
  ctx.closePath();

  const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, range);
  grad.addColorStop(0, COLORS.coneStops[0]);
  grad.addColorStop(0.35, COLORS.coneStops[1]);
  grad.addColorStop(1, COLORS.coneStops[2]);
  ctx.fillStyle = grad;
  ctx.fill();

  // Canal water band along bottom edge.
  const canalY = HEIGHT - 54;
  ctx.fillStyle = COLORS.canal;
  ctx.fillRect(0, canalY, WIDTH, 54);
  ctx.strokeStyle = COLORS.lanternReflection;
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const rx = 140 + i * 130 + Math.sin((time || 0) * 1.1 + i * 1.4) * 8;
    const ry = canalY + 14 + (i % 3) * 12;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 42, ry);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTitle(ctx, game) {
  const time = (game && game.time) || 0;
  uiDrawBackdrop(ctx, time);

  const unlocked = (game && game.unlocked) || [true, false, false];
  const selected = (game && typeof game.titleSelection === 'number') ? game.titleSelection : 0;
  const defaultNames = ['Night Market', 'Canal Quarter', 'Gatehouse Court'];
  const names = [];
  for (let i = 0; i < 3; i++) {
    if (typeof LEVELS !== 'undefined' && LEVELS[i] && LEVELS[i].name) {
      names.push(LEVELS[i].name);
    } else {
      names.push(defaultNames[i]);
    }
  }

  ctx.save();
  // Main title.
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 46px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('THE UNLIT HOUR', WIDTH / 2, 92);

  // Thin warm gold accent rule.
  ctx.fillStyle = COLORS.seen;
  ctx.fillRect(WIDTH / 2 - 120, 124, 240, 2);

  // Tagline.
  ctx.fillStyle = COLORS.letter;
  ctx.font = '19px ' + FONT;
  ctx.fillText('A courier. A letter. A town that must not see you.', WIDTH / 2, 154);

  // Level select cards 1-3.
  const cardW = 248;
  const cardH = 62;
  const cardGap = 22;
  const startX = WIDTH / 2 - (cardW * 3 + cardGap * 2) / 2;
  const cardY = 196;

  for (let i = 0; i < 3; i++) {
    const cx = startX + i * (cardW + cardGap);
    const isUnlocked = Boolean(unlocked[i]);
    const isSelected = i === selected;

    ctx.save();
    if (!isUnlocked) ctx.globalAlpha = 0.42;

    rndRoundedRectPath(ctx, cx, cardY, cardW, cardH, 12);
    ctx.fillStyle = COLORS.hudBg;
    ctx.fill();
    ctx.strokeStyle = isSelected ? COLORS.seen : (isUnlocked ? COLORS.wallEdge : COLORS.wallFront);
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.stroke();

    ctx.fillStyle = isSelected ? COLORS.seen : COLORS.hudText;
    ctx.font = 'bold 16px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((i + 1) + ' \u00B7 ' + names[i], cx + cardW / 2, cardY + 23);

    ctx.fillStyle = isUnlocked ? COLORS.exitLit : COLORS.hudText;
    ctx.font = '13px ' + FONT;
    ctx.fillText(isUnlocked ? (isSelected ? 'Selected' : 'Unlocked') : 'Locked', cx + cardW / 2, cardY + 44);
    ctx.restore();
  }

  // Controls line.
  ctx.fillStyle = rndColorAlpha(COLORS.hudText, 0.82);
  ctx.font = '13px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'WASD / Arrows move \u00B7 Shift sneak \u00B7 Click pivot screen / floor pebble \u00B7 E interact \u00B7 H field notes \u00B7 R restart \u00B7 Esc pause \u00B7 M mute',
    WIDTH / 2,
    296
  );

  // "Press Enter" call to action capsule.
  const pulse = 0.72 + 0.28 * Math.sin(time * 3.4);
  drawCapsule(ctx, 'Press Enter', WIDTH / 2, 356, {
    font: 'bold 20px ' + FONT,
    color: COLORS.hudText,
    borderColor: COLORS.seen,
    borderAlpha: pulse,
    borderWidth: 2,
    height: 44,
    padX: 30,
  });
  ctx.restore();
}

function drawPause(ctx, game) {
  ctx.save();
  ctx.fillStyle = rndColorAlpha(COLORS.background, 0.45);
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawCapsule(ctx, 'Paused \u2014 Esc resume \u00B7 R restart \u00B7 M mute', WIDTH / 2, HEIGHT / 2, {
    font: 'bold 20px ' + FONT,
    color: COLORS.hudText,
    borderColor: COLORS.seen,
    borderAlpha: 0.75,
    borderWidth: 2,
    height: 48,
    padX: 26,
  });

  if (game && game.muted) {
    drawCapsule(ctx, 'Audio muted', WIDTH / 2, HEIGHT / 2 + 44, {
      font: 'bold 14px ' + FONT,
      color: COLORS.seen,
      borderColor: COLORS.wallEdge,
      borderAlpha: 0.5,
      height: 28,
      padX: 16,
    });
  }
  ctx.restore();
}

function drawCaught(ctx, game) {
  ctx.save();
  ctx.fillStyle = rndColorAlpha(COLORS.background, 0.44);
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawCapsule(ctx, 'Caught \u2014 press R to try again', WIDTH / 2, HEIGHT / 2, {
    font: 'bold 22px ' + FONT,
    color: COLORS.alert,
    borderColor: COLORS.alert,
    borderAlpha: 0.9,
    borderWidth: 2,
    height: 52,
    padX: 28,
  });
  ctx.restore();
}

function drawResults(ctx, game) {
  const res = (game && game.results) || {};
  const timesSeen = res.timesSeen !== undefined ? res.timesSeen : ((game && game.timesSeen) || 0);
  const elapsed = res.time !== undefined ? res.time : ((game && game.elapsed) || 0);
  const par = res.par !== undefined ? res.par : ((game && game.level && game.level.par) || 45);
  const unseen = timesSeen === 0;
  const title = res.title || (unseen ? 'DELIVERED UNSEEN' : 'DELIVERED');
  const stars = res.stars !== undefined
    ? res.stars
    : (unseen ? (elapsed <= par ? 3 : 2) : 1);
  const completed = res.completed || [true, false, false];

  ctx.save();
  // Moderate dim so cones, courtyard, and route replay remain clearly readable behind the panel.
  ctx.fillStyle = rndColorAlpha(COLORS.background, 0.36);
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // G8: thin dotted cyan trail of the player's actual run with start and exit marked.
  const trail = game && Array.isArray(game.trail) ? game.trail : [];
  if (trail.length >= 2) {
    ctx.save();
    ctx.strokeStyle = rndColorAlpha(COLORS.hidden, 0.78);
    ctx.lineWidth = 2.2;
    ctx.setLineDash([2, 6]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length; i++) {
      ctx.lineTo(trail[i].x, trail[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    const startPt = trail[0];
    ctx.fillStyle = COLORS.hudBg;
    ctx.strokeStyle = COLORS.hidden;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(startPt.x, startPt.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const endPt = trail[trail.length - 1];
    ctx.fillStyle = COLORS.exitLit;
    ctx.strokeStyle = COLORS.playerOutline;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(endPt.x, endPt.y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  const panelW = 470;
  const panelH = 282;
  const px = (WIDTH - panelW) / 2;
  const py = (HEIGHT - panelH) / 2;

  rndRoundedRectPath(ctx, px, py, panelW, panelH, 16);
  ctx.fillStyle = COLORS.hudBg;
  ctx.fill();
  ctx.strokeStyle = unseen ? COLORS.exitLit : COLORS.seen;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Headline.
  ctx.fillStyle = unseen ? COLORS.exitLit : COLORS.seen;
  ctx.font = 'bold 28px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, WIDTH / 2, py + 42);

  // Stars (1..3).
  for (let i = 0; i < 3; i++) {
    uiDrawStar(ctx, WIDTH / 2 + (i - 1) * 44, py + 88, 16, 7, i < stars);
  }

  // Stats row: Time, Par, Times seen.
  const statsY = py + 138;
  ctx.font = 'bold 17px ' + FONT;
  ctx.fillStyle = COLORS.hudText;
  ctx.fillText(
    'Time ' + uiFormatSeconds(elapsed) + '   \u00B7   Par ' + par + ' s   \u00B7   Times seen ' + timesSeen,
    WIDTH / 2,
    statsY
  );

  // Level completion strip 1 · 2 · 3.
  uiDrawLevelStrip(ctx, WIDTH / 2, py + 194, completed);

  // Action footer.
  const isLast = game && game.levelIndex >= 2;
  const nextLabel = isLast ? 'Press Enter to finish' : 'Press Enter for next level';
  ctx.fillStyle = rndColorAlpha(COLORS.hudText, 0.86);
  ctx.font = 'bold 15px ' + FONT;
  ctx.fillText(nextLabel, WIDTH / 2, py + 248);

  ctx.restore();
}

function drawEnding(ctx, game) {
  const time = (game && game.time) || 0;
  uiDrawBackdrop(ctx, time);

  ctx.save();
  ctx.fillStyle = COLORS.letter;
  ctx.font = 'bold 30px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('The town sleeps. You were never here.', WIDTH / 2, HEIGHT / 2 - 38);

  uiDrawLevelStrip(ctx, WIDTH / 2, HEIGHT / 2 + 24, [true, true, true]);

  drawCapsule(ctx, 'Press Enter', WIDTH / 2, HEIGHT / 2 + 92, {
    font: 'bold 18px ' + FONT,
    color: COLORS.hudText,
    borderColor: COLORS.exitLit,
    borderAlpha: 0.75,
    height: 40,
    padX: 26,
  });
  ctx.restore();
}

function drawHint(ctx, hint, game) {
  if (!hint) return;
  // Support drawHint(ctx, game) defensive call shape as well as drawHint(ctx, hint, game).
  if (!hint.text && Array.isArray(hint.hints)) {
    const g = hint;
    for (let i = 0; i < g.hints.length; i++) {
      const h = g.hints[i];
      if (h.until === undefined || h.until === null || (g.time || 0) <= h.until) {
        drawHint(ctx, h, g);
      }
    }
    return;
  }

  let alpha = 1;
  if (hint.until !== undefined && hint.until !== null && game && typeof game.time === 'number') {
    const left = hint.until - game.time;
    if (left <= 0) return;
    if (left < 0.25) alpha = clamp(left / 0.25, 0, 1);
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  drawCapsule(ctx, hint.text, hint.x, hint.y, {
    align: 'center',
    valign: 'middle',
    font: 'bold 14px ' + FONT,
    color: COLORS.hudText,
    borderColor: COLORS.seen,
    borderAlpha: 0.78,
    height: 28,
    padX: 14,
    clampToCanvas: true,
  });
  ctx.restore();
}

function drawLevelError(ctx, message) {
  ctx.save();
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const boxW = 760;
  const boxH = 210;
  const bx = (WIDTH - boxW) / 2;
  const by = (HEIGHT - boxH) / 2;

  rndRoundedRectPath(ctx, bx, by, boxW, boxH, 14);
  ctx.fillStyle = COLORS.hudBg;
  ctx.fill();
  ctx.strokeStyle = COLORS.alert;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = COLORS.alert;
  ctx.font = 'bold 22px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LEVEL VALIDATION ERROR', WIDTH / 2, by + 44);

  ctx.fillStyle = COLORS.hudText;
  ctx.font = '16px ' + FONT;
  const lines = uiWrapLines(ctx, String(message || 'Invalid level definition.'), boxW - 60);
  for (let i = 0; i < lines.length && i < 5; i++) {
    ctx.fillText(lines[i], WIDTH / 2, by + 96 + i * 24);
  }
  ctx.restore();
}

const UI_FIELD_NOTE_ROWS = [
  { kind: 'watchman', text: 'Watchman + lantern: the light is what he sees' },
  { kind: 'shadow', text: 'Shadow: safe' },
  { kind: 'hidden', text: 'HIDDEN: out of the light, beside cover' },
  { kind: 'screen', text: 'Lattice screen: click its pivot to turn it' },
  { kind: 'rings', text: 'Rings: footsteps and noise' },
  { kind: 'pebble', text: 'Click the floor: toss a pebble' },
  { kind: 'lamp', text: 'Lamplight: seen from afar \u2014 press E to douse' },
  { kind: 'gate', text: 'Canal Gate: opens once you hold the letter' },
];

function uiDrawNoteIcon(ctx, kind, cx, cy) {
  ctx.save();
  if (kind === 'watchman') {
    ctx.fillStyle = rndColorAlpha(COLORS.coneEdge, 0.36);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 12, cy - 5.5);
    ctx.lineTo(cx + 12, cy + 5.5);
    ctx.closePath();
    ctx.fill();
    if (typeof drawWatchmanFigure === 'function') {
      ctx.save();
      ctx.translate(cx - 2, cy);
      ctx.scale(0.55, 0.55);
      drawWatchmanFigure(ctx, { x: 0, y: 0, facing: 0, moving: false, state: 'PATROL', flickerPhase: 0 }, 0);
      ctx.restore();
    } else {
      ctx.fillStyle = COLORS.guardBody;
      ctx.strokeStyle = COLORS.guardOutline;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx - 3, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = COLORS.lantern;
      ctx.beginPath();
      ctx.arc(cx + 2, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'shadow') {
    rndRoundedRectPath(ctx, cx - 7, cy - 7, 14, 14, 3);
    ctx.fillStyle = COLORS.floor;
    ctx.fill();
    ctx.strokeStyle = COLORS.wallEdge;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  } else if (kind === 'hidden') {
    ctx.strokeStyle = COLORS.hidden;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 7);
    ctx.lineTo(cx - 7, cy + 7);
    ctx.stroke();
    ctx.setLineDash([]);
    if (typeof drawCourierFigure === 'function') {
      ctx.save();
      ctx.translate(cx + 2, cy);
      ctx.scale(0.55, 0.55);
      drawCourierFigure(ctx, { x: 0, y: 0, facing: 0, moving: false, hidden: true, radius: TUNING.playerRadius }, 0, false);
      ctx.restore();
    } else {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = COLORS.player;
      ctx.beginPath();
      ctx.arc(cx + 2, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.stroke();
    }
  } else if (kind === 'screen') {
    ctx.fillStyle = COLORS.screenPanel;
    ctx.fillRect(cx - 2.5, cy - 8, 5, 16);
    ctx.fillStyle = COLORS.screenPivot;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'rings') {
    ctx.strokeStyle = COLORS.lantern;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === 'pebble') {
    ctx.strokeStyle = rndColorAlpha(COLORS.letter, 0.7);
    ctx.lineWidth = 1.3;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy + 4);
    ctx.quadraticCurveTo(cx, cy - 8, cx + 6, cy + 3);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COLORS.letter;
    ctx.beginPath();
    ctx.arc(cx + 6, cy + 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'lamp') {
    const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, 9);
    grad.addColorStop(0, rndColorAlpha(COLORS.lampGlow, 0.65));
    grad.addColorStop(1, rndColorAlpha(COLORS.lampGlow, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.lampPost;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.lampGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'gate') {
    rndRoundedRectPath(ctx, cx - 6, cy - 7, 12, 14, 2);
    ctx.fillStyle = rndColorAlpha(COLORS.exitLit, 0.25);
    ctx.fill();
    ctx.strokeStyle = COLORS.exitLit;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }
  ctx.restore();
}

function drawObjective(ctx, game) {
  if (!game || game.state !== 'playing') return;
  const text = game.hasLetter ? 'Reach the Canal Gate \u2014 unseen' : 'Fetch the sealed letter \u2014 unseen';
  drawCapsule(ctx, text, WIDTH / 2, 10, {
    align: 'center',
    valign: 'top',
    font: 'bold 17px ' + FONT,
    color: COLORS.hudText,
    borderColor: game.hasLetter ? COLORS.exitLit : COLORS.letterGlint,
    borderAlpha: 0.72,
    height: 34,
    padX: 16,
  });
}

function uiCollectProtectedCircles(game) {
  const out = [];
  const p = game.player;
  if (p) out.push({ x: p.x, y: p.y, r: (p.radius || TUNING.playerRadius) + 12 });
  const guards = game.guards || [];
  for (let i = 0; i < guards.length; i++) {
    out.push({ x: guards[i].x, y: guards[i].y, r: (TUNING.guardRadius || 11) + 14 });
  }
  const level = game.level;
  if (level) {
    if (!game.hasLetter && level.letter) {
      const lc = tileCenter(level.letter.tx, level.letter.ty);
      out.push({ x: lc.x, y: lc.y, r: 22 });
    }
    if (level.exit) {
      const ec = tileCenter(level.exit.tx, level.exit.ty);
      out.push({ x: ec.x, y: ec.y, r: 22 });
    }
  }
  return out;
}

function uiBoxIsSafe(box, circles) {
  if (box.x < 10 || box.x + box.w > WIDTH - 10 || box.y < 52 || box.y + box.h > HEIGHT - 8) {
    return false;
  }
  for (let i = 0; i < circles.length; i++) {
    const c = circles[i];
    const nx = clamp(c.x, box.x, box.x + box.w);
    const ny = clamp(c.y, box.y, box.y + box.h);
    const dx = c.x - nx;
    const dy = c.y - ny;
    if (dx * dx + dy * dy <= c.r * c.r) return false;
  }
  return true;
}

function uiPickFieldNotesBox(game) {
  const levelIdx = typeof game.levelIndex === 'number' ? game.levelIndex : 0;
  const circles = uiCollectProtectedCircles(game);
  const singleW = 462;
  const singleH = 198;
  const twoW = 870;
  const twoH = 138;
  const singleBoxes = [
    { x: 806, y: 274, w: singleW, h: singleH, twoCol: false },
    { x: 786, y: 54, w: 420, h: singleH, twoCol: false },
    { x: 12, y: 274, w: 420, h: singleH, twoCol: false },
    { x: 12, y: 54, w: 420, h: singleH, twoCol: false },
    { x: 806, y: 54, w: singleW, h: singleH, twoCol: false },
    { x: 12, y: 274, w: singleW, h: singleH, twoCol: false },
    { x: 12, y: 54, w: singleW, h: singleH, twoCol: false },
    { x: 409, y: 274, w: 420, h: singleH, twoCol: false },
    { x: 409, y: 54, w: 420, h: singleH, twoCol: false },
  ];
  const twoBoxes = [
    { x: 200, y: 332, w: twoW, h: twoH, twoCol: true },
    { x: 200, y: 54, w: twoW, h: twoH, twoCol: true },
    { x: 12, y: 332, w: twoW, h: twoH, twoCol: true },
    { x: 398, y: 332, w: twoW, h: twoH, twoCol: true },
    { x: 12, y: 54, w: twoW, h: twoH, twoCol: true },
    { x: 398, y: 54, w: twoW, h: twoH, twoCol: true },
  ];
  const candidates = levelIdx === 2
    ? twoBoxes.concat(singleBoxes)
    : singleBoxes.concat(twoBoxes);

  for (let i = 0; i < candidates.length; i++) {
    if (uiBoxIsSafe(candidates[i], circles)) return candidates[i];
  }
  return null;
}

function drawFieldNotes(ctx, game) {
  if (!game || !game.fieldNotes) return;
  const box = uiPickFieldNotesBox(game);
  if (!box) return;
  const twoCol = box.twoCol;

  ctx.save();
  rndRoundedRectPath(ctx, box.x, box.y, box.w, box.h, 8);
  ctx.fillStyle = COLORS.hudBg;
  ctx.fill();
  ctx.strokeStyle = COLORS.coneEdge;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = COLORS.coneEdge;
  ctx.font = 'bold 14px ' + FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('FIELD NOTES', box.x + 14, box.y + 15);

  ctx.font = 'bold 17px ' + FONT;
  ctx.fillStyle = COLORS.hudText;

  if (twoCol) {
    const colW = (box.w - 36) / 2;
    for (let i = 0; i < UI_FIELD_NOTE_ROWS.length; i++) {
      const row = UI_FIELD_NOTE_ROWS[i];
      const col = i < 4 ? 0 : 1;
      const rIdx = col === 0 ? i : i - 4;
      const rx = box.x + 14 + col * (colW + 12);
      const ry = box.y + 40 + rIdx * 24;
      uiDrawNoteIcon(ctx, row.kind, rx + 9, ry);
      ctx.fillText(row.text, rx + 26, ry + 0.5, colW - 28);
    }
  } else {
    const textMaxW = box.w - 48;
    for (let i = 0; i < UI_FIELD_NOTE_ROWS.length; i++) {
      const row = UI_FIELD_NOTE_ROWS[i];
      const ry = box.y + 37 + i * 19.5;
      uiDrawNoteIcon(ctx, row.kind, box.x + 22, ry);
      ctx.fillText(row.text, box.x + 40, ry + 0.5, textMaxW);
    }
  }
  ctx.restore();
}

function drawCallouts(ctx, game) {
  const list = (game && game.callouts) || [];
  if (!list.length) return;

  ctx.save();
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (!c || !c.text) continue;
    const label = String(c.text).slice(0, 40);
    if (typeof c.toX === 'number' && typeof c.toY === 'number') {
      ctx.strokeStyle = COLORS.hidden;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.toX, c.toY);
      ctx.stroke();

      ctx.fillStyle = COLORS.hidden;
      ctx.beginPath();
      ctx.arc(c.toX, c.toY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.playerOutline;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    drawCapsule(ctx, label, c.x, c.y, {
      align: 'center',
      valign: 'middle',
      font: 'bold 16px ' + FONT,
      color: COLORS.hudText,
      bg: COLORS.hudBg,
      borderColor: COLORS.hidden,
      borderAlpha: 0.92,
      borderWidth: 1,
      height: 30,
      padX: 12,
      clampToCanvas: true,
    });
  }
  ctx.restore();
}

function drawBarks(ctx, game) {
  const barks = (game && game.barks) || [];
  if (!barks.length) return;
  const now = (game && game.time) || 0;

  for (let i = 0; i < barks.length; i++) {
    const b = barks[i];
    if (!b || !b.guard || !b.text) continue;
    if (typeof b.until === 'number' && now > b.until) continue;
    const left = typeof b.until === 'number' ? b.until - now : 1;
    const alpha = left < 0.25 ? clamp(left / 0.25, 0, 1) : 1;
    const bx = clamp(b.guard.x, 76, WIDTH - 76);
    const by = Math.max(22, b.guard.y - (TUNING.guardRadius || 11) - 38);
    const st = b.guard.state;
    const borderColor = st === 'ALERT' ? COLORS.alert : (st === 'SUSPICIOUS' || st === 'INVESTIGATE' ? COLORS.seen : COLORS.wallEdge);

    ctx.save();
    ctx.globalAlpha = alpha;
    drawCapsule(ctx, b.text, bx, by, {
      align: 'center',
      valign: 'middle',
      font: 'bold 15px ' + FONT,
      color: COLORS.hudText,
      borderColor: borderColor,
      borderAlpha: 0.9,
      height: 26,
      padX: 10,
      clampToCanvas: true,
    });
    ctx.restore();
  }
}

function drawOverlay(ctx, game) {
  if (!game) return;
  const state = game.state;
  if (state === 'title') {
    drawTitle(ctx, game);
  } else if (state === 'playing') {
    drawObjective(ctx, game);
    drawBarks(ctx, game);
    drawFieldNotes(ctx, game);
    const hints = game.hints || [];
    for (let i = 0; i < hints.length; i++) {
      const h = hints[i];
      if (h.until === undefined || h.until === null || (game.time || 0) <= h.until) {
        drawHint(ctx, h, game);
      }
    }
    drawCallouts(ctx, game);
  } else if (state === 'paused') {
    drawPause(ctx, game);
  } else if (state === 'caught') {
    drawCaught(ctx, game);
  } else if (state === 'results') {
    drawResults(ctx, game);
  } else if (state === 'ending') {
    drawEnding(ctx, game);
  } else if (state === 'error') {
    drawLevelError(ctx, game.errorMessage);
  }
}
