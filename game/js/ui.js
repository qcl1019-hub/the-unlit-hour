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
  ctx.font = '14px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'WASD / Arrows move \u00B7 Shift sneak \u00B7 Click pivot turn screen \u00B7 E interact \u00B7 R restart \u00B7 Esc pause \u00B7 M mute',
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
  // Moderate dim so cones and courtyard remain clearly readable behind the panel.
  ctx.fillStyle = rndColorAlpha(COLORS.background, 0.36);
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

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

function drawOverlay(ctx, game) {
  if (!game) return;
  const state = game.state;
  if (state === 'title') {
    drawTitle(ctx, game);
  } else if (state === 'playing') {
    const hints = game.hints || [];
    for (let i = 0; i < hints.length; i++) {
      const h = hints[i];
      if (h.until === undefined || h.until === null || (game.time || 0) <= h.until) {
        drawHint(ctx, h, game);
      }
    }
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
