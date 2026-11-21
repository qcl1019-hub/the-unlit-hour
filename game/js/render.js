// Pure 2D canvas renderer for the canal town, vision cones, entities, stealth indicators, and HUD.

const RENDER_STYLE = {
  wallFrontH: 10,
  cartFrontH: 8,
  umbraOffset: 6,
  patrolDotRadius: 1.4,
  patrolDotStep: 8,
  screenLength: 92,
  screenThickness: 12,
  screenPivotRadius: 5,
  lampGlowRadius: 30,
  lanternGlowRadius: 16,
  coneEdgeWidth: 1.5,
  alertEdgeAlpha: 0.9,
  playerHiddenAlpha: 0.55,
  playerGlowRadius: 24,
  coverDash: [6, 4],
  coverAlpha: 0.7,
  coverLineWidth: 2.5,
  hudHeight: 34,
  hudMargin: 10,
  hudFontSize: 18,
  hiddenBadgeHeight: 24,
};

function rndColorAlpha(color, alpha) {
  if (typeof color === 'string' && color.charAt(0) === '#' && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }
  return color;
}

function rndTileAt(level, tx, ty) {
  if (!level) return '#';
  const rows = level.rows || level.map;
  if (!rows || ty < 0 || ty >= rows.length || tx < 0 || tx >= rows[ty].length) return '#';
  return rows[ty][tx];
}

function rndRoundedRectPath(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function drawCapsule(ctx, text, x, y, opts) {
  const o = opts || {};
  const font = o.font || ('bold ' + RENDER_STYLE.hudFontSize + 'px ' + FONT);
  const color = o.color || COLORS.hudText;
  const bg = o.bg || COLORS.hudBg;
  const borderColor = o.borderColor || COLORS.wallEdge;
  const borderAlpha = o.borderAlpha !== undefined ? o.borderAlpha : 0.45;
  const padX = o.padX !== undefined ? o.padX : 16;
  const padY = o.padY !== undefined ? o.padY : 8;
  const align = o.align || 'center';
  const valign = o.valign || 'middle';

  ctx.save();
  ctx.font = font;
  const metrics = ctx.measureText(text);
  const textW = metrics.width;
  const fontSizeMatch = /(\d+)px/.exec(font);
  const fontPx = fontSizeMatch ? parseInt(fontSizeMatch[1], 10) : 18;
  const w = o.width !== undefined ? o.width : Math.ceil(textW + padX * 2);
  const h = o.height !== undefined ? o.height : Math.ceil(fontPx + padY * 2);
  const radius = o.radius !== undefined ? o.radius : h / 2;

  let bx = x;
  if (align === 'center') bx = x - w / 2;
  else if (align === 'right') bx = x - w;

  let by = y;
  if (valign === 'middle') by = y - h / 2;
  else if (valign === 'bottom') by = y - h;

  if (o.clampToCanvas) {
    bx = clamp(bx, 10, WIDTH - w - 10);
    by = clamp(by, 10, HEIGHT - h - 10);
  }

  rndRoundedRectPath(ctx, bx, by, w, h, radius);
  ctx.fillStyle = bg;
  ctx.fill();

  if (borderAlpha > 0) {
    ctx.strokeStyle = rndColorAlpha(borderColor, borderAlpha);
    ctx.lineWidth = o.borderWidth !== undefined ? o.borderWidth : 1.5;
    ctx.stroke();
  }

  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + w / 2, by + h / 2 + 0.5);
  ctx.restore();

  return { x: bx, y: by, w: w, h: h };
}

function drawLevel(ctx, game) {
  const level = game.level;
  const time = game.time || 0;
  const ripplePhase = (level && level.ripplePhase) || 0;

  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle 1 px street tile seams.
  ctx.strokeStyle = COLORS.floorSeam;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let tx = 1; tx < COLS; tx++) {
    const px = tx * TILE + 0.5;
    ctx.moveTo(px, 0);
    ctx.lineTo(px, HEIGHT);
  }
  for (let ty = 1; ty < ROWS; ty++) {
    const py = ty * TILE + 0.5;
    ctx.moveTo(0, py);
    ctx.lineTo(WIDTH, py);
  }
  ctx.stroke();

  // Canal tiles and wooden plank bridges.
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const ch = rndTileAt(level, tx, ty);
      const x = tx * TILE;
      const y = ty * TILE;
      if (ch === '~') {
        ctx.fillStyle = COLORS.canal;
        ctx.fillRect(x, y, TILE, TILE);

        // Canal subtle horizontal ripple lines.
        ctx.strokeStyle = COLORS.canalRipple;
        ctx.lineWidth = 1;
        const drift = Math.sin(time * 0.9 + ripplePhase + tx * 0.7 + ty * 1.1) * 3;
        ctx.beginPath();
        ctx.moveTo(x + 4 + drift, y + 9.5);
        ctx.lineTo(x + 22 + drift, y + 9.5);
        ctx.moveTo(x + 9 - drift * 0.8, y + 21.5);
        ctx.lineTo(x + 27 - drift * 0.8, y + 21.5);
        ctx.stroke();
      } else if (ch === '=') {
        ctx.fillStyle = COLORS.bridge;
        ctx.fillRect(x, y, TILE, TILE);

        // Horizontal plank seams and subtle wooden bridge rails.
        ctx.strokeStyle = COLORS.bridgeSeam;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let py = 6; py < TILE; py += 6) {
          ctx.moveTo(x, y + py + 0.5);
          ctx.lineTo(x + TILE, y + py + 0.5);
        }
        ctx.stroke();

        ctx.fillStyle = COLORS.screenLattice;
        if (rndTileAt(level, tx, ty - 1) === '~') {
          ctx.fillRect(x, y, TILE, 2);
        }
        if (rndTileAt(level, tx, ty + 1) === '~') {
          ctx.fillRect(x, y + TILE - 2, TILE, 2);
        }
      }
    }
  }
}

function drawPatrolRoutes(ctx, game) {
  const guards = game.guards || [];
  ctx.save();
  ctx.fillStyle = COLORS.patrolDots;
  const step = RENDER_STYLE.patrolDotStep;
  const dotR = RENDER_STYLE.patrolDotRadius;

  for (let i = 0; i < guards.length; i++) {
    const route = guards[i].route;
    if (!route || route.length < 2) continue;

    let carry = 0;
    for (let j = 0; j < route.length; j++) {
      const a = route[j];
      const b = route[(j + 1) % route.length];
      const segLen = distance(a.x, a.y, b.x, b.y);
      if (segLen < 0.001) continue;
      const ux = (b.x - a.x) / segLen;
      const uy = (b.y - a.y) / segLen;

      let d = carry;
      while (d < segLen) {
        const px = a.x + ux * d;
        const py = a.y + uy * d;
        ctx.beginPath();
        ctx.arc(px, py, dotR, 0, Math.PI * 2);
        ctx.fill();
        d += step;
      }
      carry = d - segLen;
    }
  }
  ctx.restore();
}

function drawWater(ctx, game) {
  const level = game.level;
  if (!level) return;
  const isCanalLevel = level.number === 2 || level.index === 1;
  if (!isCanalLevel) return;

  const time = game.time || 0;
  const ripplePhase = level.ripplePhase || 0;
  const lights = [];
  const guards = game.guards || [];
  for (let i = 0; i < guards.length; i++) {
    lights.push({ x: guards[i].x, y: guards[i].y, range: 185 });
  }
  const lamps = level.lamps || [];
  for (let i = 0; i < lamps.length; i++) {
    const lc = tileCenter(lamps[i].tx, lamps[i].ty);
    lights.push({ x: lc.x, y: lc.y, range: 145 });
  }

  ctx.save();
  ctx.strokeStyle = COLORS.lanternReflection;
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';

  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (rndTileAt(level, tx, ty) !== '~') continue;
      const cx = tx * TILE + TILE / 2;
      const cy = ty * TILE + TILE / 2;

      let near = false;
      for (let li = 0; li < lights.length; li++) {
        if (distance(cx, cy, lights[li].x, lights[li].y) <= lights[li].range) {
          near = true;
          break;
        }
      }
      if (!near) continue;

      const x0 = tx * TILE;
      const y0 = ty * TILE;
      const count = 3 + ((tx + ty) % 2 === 0 ? 1 : 0);
      for (let k = 0; k < count; k++) {
        const phase = ripplePhase + tx * 0.9 + ty * 1.3 + k * 2.1;
        const driftX = Math.sin(time * 0.95 + phase) * 3;
        const segLen = 8 + ((tx * 3 + ty + k * 5) % 7);
        const startX = x0 + 6 + ((k * 7 + tx * 5) % 9) + driftX;
        const baseY = y0 + 6 + k * 7;

        ctx.beginPath();
        for (let sx = 0; sx <= segLen; sx += 3) {
          const px = clamp(startX + sx, x0 + 3, x0 + TILE - 3);
          const py = baseY + Math.sin(time * 1.9 + phase + sx * 0.45) * 0.9;
          if (sx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawCones(ctx, game) {
  const guards = game.guards || [];
  const time = game.time || 0;

  ctx.save();
  for (let i = 0; i < guards.length; i++) {
    const guard = guards[i];
    const cone = guard.cone;
    if (!cone || !cone.origin || !cone.points || cone.points.length < 2) continue;

    const isAlert = guard.state === 'ALERT';
    const stops = isAlert ? COLORS.alertConeStops : COLORS.coneStops;
    const edgeColor = isAlert ? COLORS.alertConeEdge : COLORS.coneEdge;
    const edgeAlpha = isAlert ? RENDER_STYLE.alertEdgeAlpha : COLORS.coneEdgeAlpha;
    const flicker = 0.97 + 0.03 * Math.sin(time * 8.5 + (guard.flickerPhase || 0));

    ctx.beginPath();
    ctx.moveTo(cone.origin.x, cone.origin.y);
    for (let p = 0; p < cone.points.length; p++) {
      ctx.lineTo(cone.points[p].x, cone.points[p].y);
    }
    ctx.closePath();

    const grad = ctx.createRadialGradient(
      cone.origin.x, cone.origin.y, 0,
      cone.origin.x, cone.origin.y, TUNING.coneRange * flicker
    );
    grad.addColorStop(0, stops[0]);
    grad.addColorStop(0.35, stops[1]);
    grad.addColorStop(1, stops[2]);

    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = rndColorAlpha(edgeColor, edgeAlpha);
    ctx.lineWidth = RENDER_STYLE.coneEdgeWidth;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

function rndDrawCart(ctx, x, y) {
  const fH = RENDER_STYLE.cartFrontH;
  const inset = 2;
  const cw = TILE - inset * 2;
  const ch = TILE - inset * 2;

  // Base body.
  ctx.fillStyle = COLORS.cartBase;
  ctx.fillRect(x + inset, y + inset, cw, ch);

  // Top surface (above the 8 px south front face).
  ctx.fillStyle = COLORS.cartTop;
  ctx.fillRect(x + inset + 2, y + inset + 1, cw - 4, ch - fH - 2);

  // Subtle plank cross-line on top.
  ctx.strokeStyle = COLORS.cartBase;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + inset + 2, y + inset + 9.5);
  ctx.lineTo(x + TILE - inset - 2, y + inset + 9.5);
  ctx.stroke();

  // 2.5D south front face (8 px tall).
  ctx.fillStyle = COLORS.cartFront;
  ctx.fillRect(x + inset, y + TILE - inset - fH, cw, fH);
}

function rndDrawLamp(ctx, tx, ty, time) {
  const c = tileCenter(tx, ty);
  const phase = tx * 1.9 + ty * 2.7;
  const pulse = 1 + 0.05 * Math.sin(time * 6.2 + phase);
  const glowR = RENDER_STYLE.lampGlowRadius * pulse;

  const grad = ctx.createRadialGradient(c.x, c.y, 1, c.x, c.y, glowR);
  grad.addColorStop(0, rndColorAlpha(COLORS.lampGlow, 0.34));
  grad.addColorStop(0.45, rndColorAlpha(COLORS.lampGlow, 0.14));
  grad.addColorStop(1, rndColorAlpha(COLORS.lampGlow, 0));

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c.x, c.y, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Post base.
  ctx.fillStyle = COLORS.lampPost;
  ctx.beginPath();
  ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.wallEdge;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Warm bulb center.
  ctx.fillStyle = COLORS.lampGlow;
  ctx.beginPath();
  ctx.arc(c.x, c.y, 2.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawWallFaces(ctx, game) {
  const level = game.level;
  const time = game.time || 0;
  const uOff = RENDER_STYLE.umbraOffset;
  const fH = RENDER_STYLE.wallFrontH;

  ctx.save();

  // Pass 1: 6 px down-right drop-shadow umbras cast by walls and carts onto open floor.
  ctx.fillStyle = COLORS.umbra;
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const ch = rndTileAt(level, tx, ty);
      if (ch === '#') {
        const x = tx * TILE;
        const y = ty * TILE;
        const southOpen = rndTileAt(level, tx, ty + 1) !== '#';
        const eastOpen = rndTileAt(level, tx + 1, ty) !== '#';
        const seOpen = rndTileAt(level, tx + 1, ty + 1) !== '#';
        if (southOpen) {
          ctx.fillRect(x + uOff, y + TILE, TILE - uOff, uOff);
        }
        if (eastOpen) {
          ctx.fillRect(x + TILE, y + uOff, uOff, TILE - uOff);
        }
        if (seOpen) {
          ctx.fillRect(x + TILE, y + TILE, uOff, uOff);
        }
      } else if (ch === 'C') {
        ctx.fillRect(tx * TILE + 2 + uOff, ty * TILE + 2 + uOff, TILE - 4, TILE - 4);
      }
    }
  }

  // Pass 2: Walls with 2.5D top face, 1 px top edge, and 10 px south front face when open floor is below.
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (rndTileAt(level, tx, ty) !== '#') continue;
      const x = tx * TILE;
      const y = ty * TILE;
      const openBelow = ty + 1 < ROWS && rndTileAt(level, tx, ty + 1) !== '#';
      const openAbove = ty > 0 && rndTileAt(level, tx, ty - 1) !== '#';

      if (openBelow) {
        const topH = TILE - fH;
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(x, y, TILE, topH);

        ctx.fillStyle = COLORS.wallFront;
        ctx.fillRect(x, y + topH, TILE, fH);

        // 1 px top bevel edge separating wall top and south front face.
        ctx.fillStyle = COLORS.wallEdge;
        ctx.fillRect(x, y + topH - 1, TILE, 1);
      } else {
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(x, y, TILE, TILE);
      }

      if (openAbove || ty === 0) {
        ctx.fillStyle = COLORS.wallEdge;
        ctx.fillRect(x, y, TILE, 1);
      }
    }
  }

  // Pass 3: Carts/crates and decorative lamp posts.
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const ch = rndTileAt(level, tx, ty);
      if (ch === 'C') {
        rndDrawCart(ctx, tx * TILE, ty * TILE);
      } else if (ch === 'L') {
        rndDrawLamp(ctx, tx, ty, time);
      }
    }
  }

  ctx.restore();
}

function rndDrawExit(ctx, exitTile, hasLetter, time) {
  if (!exitTile) return;
  const c = tileCenter(exitTile.tx, exitTile.ty);
  const pulse = 0.5 + 0.5 * Math.sin(time * 3.8);

  ctx.save();
  if (hasLetter) {
    const glowR = 24 + pulse * 6;
    const grad = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, glowR);
    grad.addColorStop(0, rndColorAlpha(COLORS.exitLit, 0.42 + pulse * 0.14));
    grad.addColorStop(0.55, rndColorAlpha(COLORS.exitLit, 0.16));
    grad.addColorStop(1, rndColorAlpha(COLORS.exitLit, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x, c.y, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  const gateColor = hasLetter ? COLORS.exitLit : COLORS.exitDim;
  const x = exitTile.tx * TILE + 3;
  const y = exitTile.ty * TILE + 3;
  const size = TILE - 6;

  // Canal gate threshold frame.
  rndRoundedRectPath(ctx, x, y, size, size, 4);
  ctx.fillStyle = rndColorAlpha(gateColor, hasLetter ? 0.3 : 0.22);
  ctx.fill();
  ctx.strokeStyle = gateColor;
  ctx.lineWidth = hasLetter ? 2.5 : 2;
  ctx.stroke();

  // Inner arch / double gate doors + directional chevron.
  ctx.beginPath();
  ctx.moveTo(c.x - 5, c.y - 6);
  ctx.lineTo(c.x + 2, c.y);
  ctx.lineTo(c.x - 5, c.y + 6);
  ctx.moveTo(c.x + 1, c.y - 6);
  ctx.lineTo(c.x + 8, c.y);
  ctx.lineTo(c.x + 1, c.y + 6);
  ctx.strokeStyle = gateColor;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.restore();
}

function rndDrawLetter(ctx, letterTile, time) {
  if (!letterTile) return;
  const c = tileCenter(letterTile.tx, letterTile.ty);
  const glint = 0.55 + 0.45 * Math.sin(time * 4.5);

  ctx.save();
  // Soft golden aura so the objective reads at 25% shrink.
  const auraR = 16 + glint * 3;
  const grad = ctx.createRadialGradient(c.x, c.y, 1, c.x, c.y, auraR);
  grad.addColorStop(0, rndColorAlpha(COLORS.letterGlint, 0.34));
  grad.addColorStop(1, rndColorAlpha(COLORS.letterGlint, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c.x, c.y, auraR, 0, Math.PI * 2);
  ctx.fill();

  // Sealed parchment envelope.
  const ew = 18;
  const eh = 13;
  ctx.fillStyle = COLORS.letter;
  ctx.fillRect(c.x - ew / 2, c.y - eh / 2, ew, eh);
  ctx.strokeStyle = COLORS.playerOutline;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(c.x - ew / 2, c.y - eh / 2, ew, eh);

  // Envelope flap lines.
  ctx.beginPath();
  ctx.moveTo(c.x - ew / 2 + 1, c.y - eh / 2 + 1);
  ctx.lineTo(c.x, c.y + 1);
  ctx.lineTo(c.x + ew / 2 - 1, c.y - eh / 2 + 1);
  ctx.strokeStyle = COLORS.screenLattice;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Gold wax seal.
  ctx.fillStyle = COLORS.letterGlint;
  ctx.beginPath();
  ctx.arc(c.x, c.y + 1, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Small 4-point gold glint at top-right corner.
  const gx = c.x + ew / 2 + 1;
  const gy = c.y - eh / 2 - 1;
  const arm = 3.5 + glint * 2.5;
  ctx.strokeStyle = COLORS.letterGlint;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(gx - arm, gy);
  ctx.lineTo(gx + arm, gy);
  ctx.moveTo(gx, gy - arm);
  ctx.lineTo(gx, gy + arm);
  ctx.stroke();

  ctx.restore();
}

function rndDrawScreen(ctx, screen, hover, time) {
  const c = tileCenter(screen.tx, screen.ty);
  const angle = typeof screen.angle === 'number'
    ? screen.angle
    : (screen.orientation === 'NS' ? Math.PI / 2 : 0);
  const halfLen = RENDER_STYLE.screenLength / 2;
  const halfThick = RENDER_STYLE.screenThickness / 2;

  let shakeX = 0;
  let shakeY = 0;
  if (screen.shakeT > 0) {
    const amp = 3.2 * clamp(screen.shakeT / TUNING.screenShakeTime, 0, 1);
    const wave = Math.sin(screen.shakeT * 58);
    shakeX = -Math.sin(angle) * wave * amp;
    shakeY = Math.cos(angle) * wave * amp;
  }

  ctx.save();

  // Faint rotation arc and sweep trail while swinging.
  if (screen.swinging && typeof screen.fromAngle === 'number' && typeof screen.toAngle === 'number') {
    const arcR = halfLen - 2;
    const ccw = screen.toAngle < screen.fromAngle;

    for (let side = 0; side < 2; side++) {
      const offset = side * Math.PI;
      // Faint swept wedge between fromAngle and current angle.
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.arc(c.x, c.y, arcR, screen.fromAngle + offset, angle + offset, ccw);
      ctx.closePath();
      ctx.fillStyle = rndColorAlpha(COLORS.screenPivot, 0.14);
      ctx.fill();

      // Dashed quarter-circle rotation arc showing full swing path.
      ctx.beginPath();
      ctx.arc(c.x, c.y, arcR, screen.fromAngle + offset, screen.toAngle + offset, ccw);
      ctx.strokeStyle = rndColorAlpha(COLORS.screenPivot, 0.52);
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Panel body rotated around pivot.
  ctx.save();
  ctx.translate(c.x + shakeX, c.y + shakeY);
  ctx.rotate(angle);

  // Subtle drop shadow under screen panel.
  ctx.fillStyle = COLORS.umbra;
  ctx.fillRect(-halfLen + 3, -halfThick + 3, RENDER_STYLE.screenLength, RENDER_STYLE.screenThickness);

  // Main wooden panel.
  ctx.fillStyle = COLORS.screenPanel;
  ctx.fillRect(-halfLen, -halfThick, RENDER_STYLE.screenLength, RENDER_STYLE.screenThickness);

  // Lattice cross-lines.
  ctx.strokeStyle = COLORS.screenLattice;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-halfLen + 2, 0);
  ctx.lineTo(halfLen - 2, 0);
  for (let lx = -halfLen + 8; lx <= halfLen - 8; lx += 10) {
    ctx.moveTo(lx - 4, -halfThick + 1);
    ctx.lineTo(lx + 4, halfThick - 1);
    ctx.moveTo(lx + 4, -halfThick + 1);
    ctx.lineTo(lx - 4, halfThick - 1);
  }
  ctx.stroke();

  // Panel outer frame.
  ctx.strokeStyle = COLORS.playerOutline;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-halfLen, -halfThick, RENDER_STYLE.screenLength, RENDER_STYLE.screenThickness);
  ctx.restore();

  // Pivot dot (radius 5).
  ctx.fillStyle = COLORS.screenPivot;
  ctx.beginPath();
  ctx.arc(c.x, c.y, RENDER_STYLE.screenPivotRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.playerOutline;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Cursor highlight ring when hovered and within reach.
  if (hover && hover.screen === screen && hover.inReach) {
    const ringR = 11.5 + Math.sin(time * 5.2) * 1.2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.lampGlow;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(c.x, c.y, ringR + 4.5, 0, Math.PI * 2);
    ctx.strokeStyle = rndColorAlpha(COLORS.screenPivot, 0.5);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

function rndDrawAlertPath(ctx, guard) {
  if (guard.state !== 'ALERT') return;
  const path = guard.path || [];
  const lastSeen = guard.lastSeen || (path.length > 0 ? path[path.length - 1] : null);
  if (!lastSeen) return;

  const target = tileCenter(lastSeen.tx, lastSeen.ty);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  if (path.length > 0) {
    for (let i = 0; i < path.length; i++) {
      const pt = tileCenter(path[i].tx, path[i].ty);
      ctx.lineTo(pt.x, pt.y);
    }
  } else {
    ctx.lineTo(target.x, target.y);
  }
  ctx.strokeStyle = rndColorAlpha(COLORS.alert, 0.85);
  ctx.lineWidth = 2.5;
  ctx.setLineDash([4, 6]);
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.setLineDash([]);

  // Last-seen marker ring + cross.
  ctx.fillStyle = rndColorAlpha(COLORS.alert, 0.2);
  ctx.beginPath();
  ctx.arc(target.x, target.y, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = COLORS.alert;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(target.x, target.y, 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(target.x - 4.5, target.y - 4.5);
  ctx.lineTo(target.x + 4.5, target.y + 4.5);
  ctx.moveTo(target.x + 4.5, target.y - 4.5);
  ctx.lineTo(target.x - 4.5, target.y + 4.5);
  ctx.stroke();
  ctx.restore();
}

function rndDrawGuard(ctx, guard, time) {
  const r = TUNING.guardRadius;
  const facing = guard.facing || 0;
  const isAlert = guard.state === 'ALERT';
  const flicker = 1 + 0.06 * Math.sin(time * 9 + (guard.flickerPhase || 0));

  ctx.save();

  // Body circle + darker outline.
  ctx.fillStyle = COLORS.guardBody;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.guardOutline;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Small lantern held slightly toward facing direction.
  const lx = guard.x + Math.cos(facing) * (r * 0.65);
  const ly = guard.y + Math.sin(facing) * (r * 0.65);
  const glowR = RENDER_STYLE.lanternGlowRadius * flicker;
  const glowColor = isAlert ? COLORS.alert : COLORS.lantern;
  const grad = ctx.createRadialGradient(lx, ly, 1, lx, ly, glowR);
  grad.addColorStop(0, rndColorAlpha(glowColor, 0.55));
  grad.addColorStop(0.5, rndColorAlpha(glowColor, 0.18));
  grad.addColorStop(1, rndColorAlpha(glowColor, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(lx, ly, glowR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.lantern;
  ctx.beginPath();
  ctx.arc(lx, ly, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.guardOutline;
  ctx.lineWidth = 1;
  ctx.stroke();

  // State indicator badge above watchman ("?" for SUSPICIOUS, "!" for ALERT).
  if (guard.state === 'SUSPICIOUS' || guard.state === 'ALERT') {
    const sym = isAlert ? '!' : '?';
    const badgeColor = isAlert ? COLORS.alert : COLORS.seen;
    const by = Math.max(18, guard.y - r - 15);
    const bx = clamp(guard.x, 16, WIDTH - 16);

    ctx.fillStyle = COLORS.hudBg;
    ctx.beginPath();
    ctx.arc(bx, by, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = badgeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = badgeColor;
    ctx.font = 'bold 16px ' + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sym, bx, by + 1);
  }

  ctx.restore();
}

function rndDrawPlayer(ctx, player) {
  if (!player) return;
  const r = player.radius || TUNING.playerRadius;
  const hidden = Boolean(player.hidden);

  ctx.save();
  if (hidden) {
    // Faint cyan glow around hidden courier.
    const glowR = RENDER_STYLE.playerGlowRadius;
    const grad = ctx.createRadialGradient(player.x, player.y, r * 0.4, player.x, player.y, glowR);
    grad.addColorStop(0, rndColorAlpha(COLORS.hidden, 0.34));
    grad.addColorStop(1, rndColorAlpha(COLORS.hidden, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Semi-transparent body.
    ctx.globalAlpha = RENDER_STYLE.playerHiddenAlpha;
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Crisp 2 px cyan outline.
    ctx.globalAlpha = 1;
    ctx.strokeStyle = COLORS.hidden;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLORS.playerOutline;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Subtle facing dot so Wren's direction reads cleanly.
  if (typeof player.facing === 'number') {
    const fx = player.x + Math.cos(player.facing) * (r * 0.48);
    const fy = player.y + Math.sin(player.facing) * (r * 0.48);
    ctx.fillStyle = hidden ? COLORS.hidden : COLORS.playerOutline;
    ctx.beginPath();
    ctx.arc(fx, fy, 1.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawEntities(ctx, game) {
  const level = game.level;
  const time = game.time || 0;
  const screens = game.screens || [];
  const guards = game.guards || [];

  // Objective markers: exit gate and sealed letter.
  rndDrawExit(ctx, level.exit, Boolean(game.hasLetter), time);
  if (!game.hasLetter) {
    rndDrawLetter(ctx, level.letter, time);
  }

  // Lattice screens.
  for (let i = 0; i < screens.length; i++) {
    rndDrawScreen(ctx, screens[i], game.hover, time);
  }

  // ALERT guard dotted chase paths and last-seen markers (drawn beneath actors).
  for (let i = 0; i < guards.length; i++) {
    rndDrawAlertPath(ctx, guards[i]);
  }

  // Watchmen.
  for (let i = 0; i < guards.length; i++) {
    rndDrawGuard(ctx, guards[i], time);
  }

  // Wren (the player).
  rndDrawPlayer(ctx, game.player);
}

function rndCoverTiles(game) {
  const player = game.player;
  if (!player) return [];
  if (typeof player.coverTileNearby === 'function' && game.world) {
    return player.coverTileNearby(game.world) || [];
  }
  if (Array.isArray(player.coverTiles)) {
    return player.coverTiles;
  }

  // Fallback 3x3 scan when preview mocks do not provide coverTileNearby.
  const out = [];
  const ptx = pixelToTile(player.x);
  const pty = pixelToTile(player.y);
  const screens = game.screens || [];

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = ptx + dx;
      const ty = pty + dy;
      const ch = rndTileAt(game.level, tx, ty);
      if (ch === '#') {
        out.push({ tx: tx, ty: ty, kind: 'wall', screenIndex: -1 });
        continue;
      }
      if (ch === 'C') {
        out.push({ tx: tx, ty: ty, kind: 'cart', screenIndex: -1 });
        continue;
      }
      for (let si = 0; si < screens.length; si++) {
        const sc = screens[si];
        const tiles = typeof sc.tiles === 'function'
          ? sc.tiles()
          : (sc.orientation === 'NS'
            ? [{ tx: sc.tx, ty: sc.ty - 1 }, { tx: sc.tx, ty: sc.ty }, { tx: sc.tx, ty: sc.ty + 1 }]
            : [{ tx: sc.tx - 1, ty: sc.ty }, { tx: sc.tx, ty: sc.ty }, { tx: sc.tx + 1, ty: sc.ty }]);
        for (let k = 0; k < tiles.length; k++) {
          if (tiles[k].tx === tx && tiles[k].ty === ty) {
            out.push({ tx: tx, ty: ty, kind: 'screen', screenIndex: si });
            break;
          }
        }
      }
    }
  }
  return out;
}

function drawCoverOutline(ctx, game) {
  const player = game.player;
  if (!player || !player.hidden) return;

  const covers = rndCoverTiles(game);
  if (!covers.length) return;

  const screens = game.screens || [];
  const drawnScreens = {};
  const tileMap = {};
  const tileList = [];

  for (let i = 0; i < covers.length; i++) {
    const item = covers[i];
    if (item.kind === 'screen' && item.screenIndex >= 0 && screens[item.screenIndex]) {
      drawnScreens[item.screenIndex] = true;
    } else {
      const key = item.tx + ',' + item.ty;
      if (!tileMap[key]) {
        tileMap[key] = item;
        tileList.push(item);
      }
    }
  }

  ctx.save();
  ctx.strokeStyle = rndColorAlpha(COLORS.hidden, RENDER_STYLE.coverAlpha);
  ctx.lineWidth = RENDER_STYLE.coverLineWidth;
  ctx.setLineDash(RENDER_STYLE.coverDash);
  ctx.lineCap = 'round';

  // Outline adjacent wall / cart tiles along their outer perimeter edges.
  for (let i = 0; i < tileList.length; i++) {
    const t = tileList[i];
    const x = t.tx * TILE + 1.5;
    const y = t.ty * TILE + 1.5;
    const w = TILE - 3;
    const h = TILE - 3;

    ctx.beginPath();
    if (!tileMap[(t.tx) + ',' + (t.ty - 1)]) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
    }
    if (!tileMap[(t.tx) + ',' + (t.ty + 1)]) {
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w, y + h);
    }
    if (!tileMap[(t.tx - 1) + ',' + (t.ty)]) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + h);
    }
    if (!tileMap[(t.tx + 1) + ',' + (t.ty)]) {
      ctx.moveTo(x + w, y);
      ctx.lineTo(x + w, y + h);
    }
    ctx.stroke();
  }

  // Outline each adjacent lattice screen rotated with its current angle.
  for (const idxStr in drawnScreens) {
    const sc = screens[Number(idxStr)];
    const c = tileCenter(sc.tx, sc.ty);
    const angle = typeof sc.angle === 'number'
      ? sc.angle
      : (sc.orientation === 'NS' ? Math.PI / 2 : 0);
    const halfLen = RENDER_STYLE.screenLength / 2 + 4;
    const halfThick = RENDER_STYLE.screenThickness / 2 + 4;

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(angle);
    rndRoundedRectPath(ctx, -halfLen, -halfThick, halfLen * 2, halfThick * 2, 5);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function rndDrawEyeIcon(ctx, cx, cy) {
  ctx.save();
  ctx.strokeStyle = COLORS.hidden;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  // Closed eyelid curve.
  ctx.beginPath();
  ctx.arc(cx, cy - 2, 7.5, Math.PI * 0.16, Math.PI * 0.84, false);
  ctx.stroke();

  // Three crisp downward eyelashes.
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy + 3.5);
  ctx.lineTo(cx - 7, cy + 6.5);
  ctx.moveTo(cx, cy + 5.5);
  ctx.lineTo(cx, cy + 8.5);
  ctx.moveTo(cx + 5, cy + 3.5);
  ctx.lineTo(cx + 7, cy + 6.5);
  ctx.stroke();
  ctx.restore();
}

function drawHiddenBadge(ctx, game) {
  const player = game.player;
  if (!player || !player.hidden) return;

  const badgeH = RENDER_STYLE.hiddenBadgeHeight;
  const label = 'HIDDEN';

  ctx.save();
  ctx.font = 'bold 14px ' + FONT;
  const textW = ctx.measureText(label).width;
  const iconW = 18;
  const gap = 6;
  const padX = 10;
  const w = Math.ceil(padX * 2 + iconW + gap + textW);

  let bx = player.x - w / 2;
  let by = player.y - (player.radius || TUNING.playerRadius) - badgeH - 8;
  if (by < 48) {
    by = player.y + (player.radius || TUNING.playerRadius) + 8;
  }
  bx = clamp(bx, 10, WIDTH - w - 10);
  by = clamp(by, 10, HEIGHT - badgeH - 10);

  rndRoundedRectPath(ctx, bx, by, w, badgeH, badgeH / 2);
  ctx.fillStyle = COLORS.hudBg;
  ctx.fill();
  ctx.strokeStyle = rndColorAlpha(COLORS.hidden, 0.85);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  rndDrawEyeIcon(ctx, bx + padX + iconW / 2, by + badgeH / 2 - 1);

  ctx.fillStyle = COLORS.hidden;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, bx + padX + iconW + gap, by + badgeH / 2 + 0.5);
  ctx.restore();
}

function rndDrawLetterIcon(ctx, x, y, w, h, filled) {
  ctx.save();
  if (filled) {
    ctx.fillStyle = COLORS.letter;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = COLORS.letterGlint;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);

    ctx.beginPath();
    ctx.moveTo(x + 1, y + 1);
    ctx.lineTo(x + w / 2, y + h * 0.58);
    ctx.lineTo(x + w - 1, y + 1);
    ctx.strokeStyle = COLORS.screenLattice;
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.fillStyle = COLORS.letterGlint;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.58, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = rndColorAlpha(COLORS.hudText, 0.55);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);

    ctx.beginPath();
    ctx.moveTo(x + 1, y + 1);
    ctx.lineTo(x + w / 2, y + h * 0.55);
    ctx.lineTo(x + w - 1, y + 1);
    ctx.strokeStyle = rndColorAlpha(COLORS.hudText, 0.42);
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawHud(ctx, game) {
  const level = game.level;
  if (!level) return;

  const h = RENDER_STYLE.hudHeight;
  const m = RENDER_STYLE.hudMargin;
  const font = 'bold ' + RENDER_STYLE.hudFontSize + 'px ' + FONT;

  // Top-left capsule: "THE UNLIT HOUR · <n> <Level Name>".
  const num = level.number || ((game.levelIndex || 0) + 1);
  const titleText = 'THE UNLIT HOUR \u00B7 ' + num + ' ' + level.name;
  drawCapsule(ctx, titleText, m, m, {
    align: 'left',
    valign: 'top',
    height: h,
    font: font,
    padX: 16,
    borderColor: COLORS.wallEdge,
    borderAlpha: 0.45,
  });

  // Top-right capsule: letter icon, exposure bar (0-100), status text.
  const guards = game.guards || [];
  let anyAlert = false;
  for (let i = 0; i < guards.length; i++) {
    if (guards[i].state === 'ALERT') {
      anyAlert = true;
      break;
    }
  }

  const exposure = clamp(game.exposure || 0, 0, TUNING.exposureMax);
  const ratio = exposure / TUNING.exposureMax;
  let statusText = '';
  let statusColor = COLORS.hudText;
  if (anyAlert || exposure >= TUNING.exposureMax) {
    statusText = 'SEEN';
    statusColor = COLORS.alert;
  } else if (exposure > 0) {
    statusText = 'SEEN';
    statusColor = COLORS.seen;
  } else if (game.player && game.player.hidden) {
    statusText = 'HIDDEN';
    statusColor = COLORS.hidden;
  }

  ctx.save();
  ctx.font = font;
  const statusW = statusText ? Math.ceil(ctx.measureText(statusText).width) : 0;
  const iconW = 22;
  const iconH = 15;
  const barW = 92;
  const barH = 10;
  const gap = 12;
  const padX = 14;
  const totalW = padX * 2 + iconW + gap + barW + (statusW > 0 ? gap + statusW : 0);
  const rx = WIDTH - m - totalW;
  const ry = m;

  rndRoundedRectPath(ctx, rx, ry, totalW, h, h / 2);
  ctx.fillStyle = COLORS.hudBg;
  ctx.fill();
  ctx.strokeStyle = rndColorAlpha(anyAlert ? COLORS.alert : COLORS.wallEdge, anyAlert ? 0.8 : 0.45);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Letter icon.
  let cursorX = rx + padX;
  rndDrawLetterIcon(ctx, cursorX, ry + (h - iconH) / 2, iconW, iconH, Boolean(game.hasLetter));
  cursorX += iconW + gap;

  // Exposure bar (0-100).
  const barY = ry + (h - barH) / 2;
  rndRoundedRectPath(ctx, cursorX, barY, barW, barH, barH / 2);
  ctx.fillStyle = COLORS.wallFront;
  ctx.fill();
  ctx.strokeStyle = rndColorAlpha(COLORS.wallEdge, 0.65);
  ctx.lineWidth = 1;
  ctx.stroke();

  if (ratio > 0) {
    const fillW = Math.max(4, barW * ratio);
    rndRoundedRectPath(ctx, cursorX, barY, fillW, barH, barH / 2);
    ctx.fillStyle = (anyAlert || exposure >= TUNING.exposureMax) ? COLORS.alert : COLORS.seen;
    ctx.fill();
  }
  cursorX += barW + gap;

  // Status text ("HIDDEN" cyan / "SEEN" amber, red once ALERT / blank).
  if (statusText) {
    ctx.fillStyle = statusColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(statusText, cursorX, ry + h / 2 + 0.5);
  }
  ctx.restore();
}

function renderFrame(ctx, game) {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (!game || !game.level) return;

  drawLevel(ctx, game);
  drawPatrolRoutes(ctx, game);
  drawWater(ctx, game);
  drawCones(ctx, game);
  drawWallFaces(ctx, game);
  drawEntities(ctx, game);
  if (game.state !== 'results') {
    drawCoverOutline(ctx, game);
    drawHiddenBadge(ctx, game);
  }
  drawHud(ctx, game);
}
