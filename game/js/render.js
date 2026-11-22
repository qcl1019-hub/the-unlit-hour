// Pure 2D canvas renderer for the lantern-lit canal town, cached terrain, people figures, lamp pools, cones, and HUD.

const RENDER_STYLE = {
  wallFrontH: 10, cartFrontH: 8, umbraOffset: 6,
  patrolDotRadius: 1.4, patrolDotStep: 8, chevronSpacing: 128,
  screenLength: 92, screenThickness: 12, screenPivotRadius: 5,
  lampPoolRadius: TILE * 2, lanternGlowRadius: 16,
  coneEdgeWidth: 1.5, suspiciousEdgeWidth: 2.5, alertEdgeAlpha: 0.92,
  playerHiddenAlpha: 0.55, playerGlowRadius: 26,
  coverDash: [6, 4], coverAlpha: 0.7, coverLineWidth: 2.5,
  hudHeight: 34, hudMargin: 10, hudFontSize: 18, hiddenBadgeHeight: 24,
};

const ART = {
  nightBg: '#080C1A', nightEdge: '#050712',
  cobbleA: '#11182C', cobbleB: '#141C32', cobbleSeam: '#0E1426',
  flagA: '#12192E', flagB: '#151E35', flagSeam: '#0F1528',
  canalTop: '#09182A', canalBot: '#0E2640', canalLip: '#4B5978', canalLipShade: '#26314A',
  bridgePlankA: '#3B2F24', bridgePlankB: '#443629', bridgeRail: '#6B5234', bridgeRailHi: '#8A6A44',
  slateA: '#2B3554', slateB: '#313D5F', slateSeam: '#232C47', roofRidge: '#57668C',
  wallBase: '#111629', windowWarm: '#FFE3A8', windowSill: '#151C32',
  awningA: '#7A2E2E', awningB: '#D9C7A3', awningShade: '#531E1E',
  wheel: '#1B130E', wheelHub: '#7A5638', lampCap: '#1A2136',
  guardCloak: '#876A41', watchHood: '#3D3024', staff: '#7B5836', boot: '#1D1814',
  hand: '#DFC39B', wrenShade: '#88A2C8', wrenStrap: '#8A6A44',
  pebbleFill: '#CBD4E3', pebbleShade: '#69768E',
};

let rndCacheKey = '';
let rndFloorCache = null;
let rndWallsCache = null;

function rndHash(tx, ty, salt) {
  let h = ((tx * 374761393) ^ (ty * 668265263) ^ ((salt || 0) * 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function rndColorAlpha(color, alpha) {
  if (typeof color === 'string' && color.charAt(0) === '#' && color.length === 7) {
    return 'rgba(' + parseInt(color.slice(1, 3), 16) + ',' + parseInt(color.slice(3, 5), 16) + ',' + parseInt(color.slice(5, 7), 16) + ',' + alpha + ')';
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

function rndGlow(ctx, x, y, r0, r1, color, a0, a1) {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  g.addColorStop(0, rndColorAlpha(color, a0));
  if (a1 !== undefined) g.addColorStop(0.5, rndColorAlpha(color, a1));
  g.addColorStop(1, rndColorAlpha(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r1, 0, Math.PI * 2);
  ctx.fill();
}

function rndLevelKey(level) {
  const rows = level.rows || level.map || [];
  return (level.index || 0) + ':' + (level.name || '') + ':' + rows.length + ':' + (rows[0] || '') + ':' + (rows[7] || '');
}

function rndPaintStaticFloor(ctx, level) {
  const isCourt = level.index === 2 || level.number === 3;
  ctx.fillStyle = isCourt ? ART.flagSeam : ART.cobbleSeam;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const ch = rndTileAt(level, tx, ty);
      if (ch === '~' || ch === '=' || ch === '#') continue;
      const x = tx * TILE, y = ty * TILE;
      if (isCourt) {
        const splitV = rndHash(tx, ty, 3) > 0.45;
        ctx.fillStyle = rndHash(tx, ty, 1) > 0.5 ? ART.flagB : ART.flagA;
        ctx.fillRect(x + 1, y + 1, splitV ? 15 : 30, splitV ? 30 : 15);
        ctx.fillStyle = rndHash(tx, ty, 2) > 0.5 ? ART.flagB : ART.flagA;
        ctx.fillRect(x + (splitV ? 17 : 1), y + (splitV ? 1 : 17), splitV ? 14 : 30, splitV ? 30 : 14);
      } else {
        // Low-contrast 2-shade offset cobblestones for clean illustrated feel and small PNGs.
        for (let row = 0; row < 2; row++) {
          const ry = y + row * 16 + 1;
          const segs = row === 0 ? [[x + 1, 15], [x + 17, 14]] : [[x + 1, 7], [x + 9, 15], [x + 25, 6]];
          for (let s = 0; s < segs.length; s++) {
            ctx.fillStyle = rndHash(tx * 3 + s, ty * 2 + row, 7) > 0.52 ? ART.cobbleB : ART.cobbleA;
            ctx.fillRect(segs[s][0], ry, segs[s][1], 14);
          }
        }
      }
    }
  }

  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const ch = rndTileAt(level, tx, ty), x = tx * TILE, y = ty * TILE;
      if (ch === '~') {
        ctx.fillStyle = ty < 5 ? ART.canalTop : (ty < 10 ? COLORS.canal : ART.canalBot);
        ctx.fillRect(x, y, TILE, TILE);
        const isW = function (ox, oy) { const c = rndTileAt(level, tx + ox, ty + oy); return c !== '~' && c !== '='; };
        if (isW(0, -1)) { ctx.fillStyle = ART.canalLip; ctx.fillRect(x, y, TILE, 3); ctx.fillStyle = ART.canalLipShade; ctx.fillRect(x, y + 3, TILE, 2); }
        if (isW(0, 1)) { ctx.fillStyle = ART.canalLip; ctx.fillRect(x, y + TILE - 3, TILE, 3); }
        if (isW(-1, 0)) { ctx.fillStyle = ART.canalLip; ctx.fillRect(x, y, 3, TILE); ctx.fillStyle = ART.canalLipShade; ctx.fillRect(x + 3, y, 2, TILE); }
        if (isW(1, 0)) { ctx.fillStyle = ART.canalLip; ctx.fillRect(x + TILE - 3, y, 3, TILE); ctx.fillStyle = ART.canalLipShade; ctx.fillRect(x + TILE - 5, y, 2, TILE); }
      } else if (ch === '=') {
        ctx.fillStyle = ART.bridgePlankA;
        ctx.fillRect(x, y, TILE, TILE);
        for (let p = 0; p < 5; p++) {
          if ((p + tx) % 2 === 0) { ctx.fillStyle = ART.bridgePlankB; ctx.fillRect(x, y + p * 6 + 1, TILE, 5); }
          ctx.fillStyle = COLORS.bridgeSeam; ctx.fillRect(x, y + p * 6, TILE, 1);
        }
        ctx.fillStyle = COLORS.bridgeSeam; ctx.fillRect(x + 3, y + 3, 2, 2); ctx.fillRect(x + TILE - 5, y + 15, 2, 2);
        if (rndTileAt(level, tx, ty - 1) === '~') { ctx.fillStyle = ART.bridgeRail; ctx.fillRect(x, y, TILE, 3); ctx.fillStyle = ART.bridgeRailHi; ctx.fillRect(x, y, TILE, 1); }
        if (rndTileAt(level, tx, ty + 1) === '~') { ctx.fillStyle = ART.bridgeRail; ctx.fillRect(x, y + TILE - 3, TILE, 3); ctx.fillStyle = ART.bridgeRailHi; ctx.fillRect(x, y + TILE - 3, TILE, 1); }
      }
    }
  }
}

function rndPaintStall(ctx, x, y, tx, ty) {
  const fH = RENDER_STYLE.cartFrontH, cw = TILE - 4, ch = TILE - 4, topH = ch - fH;
  const flip = rndHash(tx, ty, 19) > 0.5 ? 1 : 0;
  ctx.fillStyle = COLORS.cartBase; ctx.fillRect(x + 2, y + 2, cw, ch);
  const sw = cw / 5;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = ((i + flip) % 2 === 0) ? ART.awningA : ART.awningB;
    ctx.fillRect(x + 2 + Math.floor(i * sw), y + 2, Math.ceil(sw), topH - 2);
  }
  ctx.fillStyle = ART.awningShade; ctx.fillRect(x + 2, y + topH, cw, 2);
  ctx.fillStyle = COLORS.cartFront; ctx.fillRect(x + 2, y + TILE - 2 - fH, cw, fH);
  const wy = y + TILE - 7;
  ctx.fillStyle = ART.wheel; ctx.fillRect(x + 5, wy, 5, 5); ctx.fillRect(x + TILE - 10, wy, 5, 5);
  ctx.fillStyle = ART.wheelHub; ctx.fillRect(x + 7, wy + 2, 1, 1); ctx.fillRect(x + TILE - 8, wy + 2, 1, 1);
  ctx.strokeStyle = COLORS.playerOutline; ctx.lineWidth = 1; ctx.strokeRect(x + 2.5, y + 2.5, cw - 1, ch - 1);
}

function rndPaintStaticWalls(ctx, level) {
  const uOff = RENDER_STYLE.umbraOffset, fH = RENDER_STYLE.wallFrontH;
  ctx.fillStyle = COLORS.umbra;
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const ch = rndTileAt(level, tx, ty);
      if (ch === '#') {
        const x = tx * TILE, y = ty * TILE;
        if (rndTileAt(level, tx, ty + 1) !== '#') ctx.fillRect(x + uOff, y + TILE, TILE - uOff, uOff);
        if (rndTileAt(level, tx + 1, ty) !== '#') ctx.fillRect(x + TILE, y + uOff, uOff, TILE - uOff);
        if (rndTileAt(level, tx + 1, ty + 1) !== '#') ctx.fillRect(x + TILE, y + TILE, uOff, uOff);
      } else if (ch === 'C') {
        ctx.fillRect(tx * TILE + 2 + uOff, ty * TILE + 2 + uOff, TILE - 4, TILE - 4);
      }
    }
  }

  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (rndTileAt(level, tx, ty) !== '#') continue;
      const x = tx * TILE, y = ty * TILE;
      const openBelow = ty + 1 < ROWS && rndTileAt(level, tx, ty + 1) !== '#';
      const openAbove = ty > 0 && rndTileAt(level, tx, ty - 1) !== '#';
      const wL = tx > 0 && rndTileAt(level, tx - 1, ty) === '#';
      const wR = tx + 1 < COLS && rndTileAt(level, tx + 1, ty) === '#';
      const wU = ty > 0 && rndTileAt(level, tx, ty - 1) === '#';
      const wD = ty + 1 < ROWS && rndTileAt(level, tx, ty + 1) === '#';
      const topH = openBelow ? (TILE - fH) : TILE;

      ctx.fillStyle = ART.slateA; ctx.fillRect(x, y, TILE, topH);
      for (let ry = 0; ry < topH - 2; ry += 7) {
        const rowIdx = Math.floor(ry / 7), h = Math.min(7, topH - ry), shift = (rowIdx % 2) * 8;
        for (let sx = -shift; sx < TILE; sx += 16) {
          const rx = Math.max(0, sx), rw = Math.min(TILE, sx + 16) - rx;
          if (rw > 0 && rndHash(tx * 2 + Math.floor((sx + 16) / 16), ty * 4 + rowIdx, 11) > 0.5) {
            ctx.fillStyle = ART.slateB; ctx.fillRect(x + rx, y + ry, rw, h);
          }
        }
        ctx.fillStyle = ART.slateSeam; ctx.fillRect(x, y + ry + h - 1, TILE, 1);
      }

      ctx.fillStyle = ART.roofRidge;
      if (wL && wR && !wU && !wD) ctx.fillRect(x, y + Math.floor(topH * 0.45), TILE, 2);
      else if (wU && wD && !wL && !wR) ctx.fillRect(x + 15, y, 2, topH);
      if (openAbove || ty === 0) { ctx.fillStyle = COLORS.wallEdge; ctx.fillRect(x, y, TILE, 1); }

      if (openBelow) {
        const fy = y + topH;
        ctx.fillStyle = COLORS.wallFront; ctx.fillRect(x, fy, TILE, fH);
        ctx.fillStyle = COLORS.wallEdge; ctx.fillRect(x, fy - 1, TILE, 1);
        ctx.fillStyle = ART.wallBase; ctx.fillRect(x, fy + fH - 2, TILE, 2);
        const roll = rndHash(tx, ty, 29);
        if (roll > 0.48) {
          const wx = x + (roll > 0.74 ? 19 : 9), wy = fy + 2;
          ctx.fillStyle = ART.windowSill; ctx.fillRect(wx - 1, wy - 1, 5, 7);
          ctx.fillStyle = rndColorAlpha(ART.windowWarm, 0.52); ctx.fillRect(wx, wy, 3, 5);
        }
      }
    }
  }

  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) { if (rndTileAt(level, tx, ty) === 'C') rndPaintStall(ctx, tx * TILE, ty * TILE, tx, ty); }
  }
}

function rndEnsureStaticCache(level) {
  if (typeof document === 'undefined' || !level) return false;
  const key = rndLevelKey(level);
  if (key === rndCacheKey && rndFloorCache && rndWallsCache) return true;
  if (!rndFloorCache) { rndFloorCache = document.createElement('canvas'); rndFloorCache.width = WIDTH; rndFloorCache.height = HEIGHT; }
  if (!rndWallsCache) { rndWallsCache = document.createElement('canvas'); rndWallsCache.width = WIDTH; rndWallsCache.height = HEIGHT; }
  const fCtx = rndFloorCache.getContext('2d'); fCtx.clearRect(0, 0, WIDTH, HEIGHT); rndPaintStaticFloor(fCtx, level);
  const wCtx = rndWallsCache.getContext('2d'); wCtx.clearRect(0, 0, WIDTH, HEIGHT); rndPaintStaticWalls(wCtx, level);
  rndCacheKey = key;
  return true;
}

function drawCapsule(ctx, text, x, y, opts) {
  const o = opts || {};
  const font = o.font || ('bold ' + RENDER_STYLE.hudFontSize + 'px ' + FONT);
  const padX = o.padX !== undefined ? o.padX : 16, padY = o.padY !== undefined ? o.padY : 8;
  const align = o.align || 'center', valign = o.valign || 'middle';
  ctx.save();
  ctx.font = font;
  const m = /(\d+)px/.exec(font), fontPx = m ? parseInt(m[1], 10) : 18;
  const w = o.width !== undefined ? o.width : Math.ceil(ctx.measureText(text).width + padX * 2);
  const h = o.height !== undefined ? o.height : Math.ceil(fontPx + padY * 2);
  const radius = o.radius !== undefined ? o.radius : h / 2;
  let bx = align === 'center' ? x - w / 2 : (align === 'right' ? x - w : x);
  let by = valign === 'middle' ? y - h / 2 : (valign === 'bottom' ? y - h : y);
  if (o.clampToCanvas) { bx = clamp(bx, 10, WIDTH - w - 10); by = clamp(by, 10, HEIGHT - h - 10); }
  rndRoundedRectPath(ctx, bx, by, w, h, radius);
  ctx.fillStyle = o.bg || COLORS.hudBg; ctx.fill();
  const ba = o.borderAlpha !== undefined ? o.borderAlpha : 0.45;
  if (ba > 0) { ctx.strokeStyle = rndColorAlpha(o.borderColor || COLORS.wallEdge, ba); ctx.lineWidth = o.borderWidth || 1.5; ctx.stroke(); }
  ctx.fillStyle = o.color || COLORS.hudText; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + w / 2, by + h / 2 + 0.5);
  ctx.restore();
  return { x: bx, y: by, w: w, h: h };
}

function drawLevel(ctx, game) {
  const level = game.level, time = game.time || 0, ripplePhase = (level && level.ripplePhase) || 0;
  if (rndEnsureStaticCache(level)) ctx.drawImage(rndFloorCache, 0, 0);
  else rndPaintStaticFloor(ctx, level);

  ctx.save();
  ctx.strokeStyle = COLORS.canalRipple; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (rndTileAt(level, tx, ty) !== '~') continue;
      const x = tx * TILE, y = ty * TILE, drift = Math.sin(time * 0.9 + ripplePhase + tx * 0.7 + ty * 1.1) * 3;
      ctx.moveTo(x + 5 + drift, y + 10.5); ctx.lineTo(x + 21 + drift, y + 10.5);
      ctx.moveTo(x + 9 - drift * 0.8, y + 22.5); ctx.lineTo(x + 26 - drift * 0.8, y + 22.5);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawPatrolRoutes(ctx, game) {
  const guards = game.guards || [];
  const step = RENDER_STYLE.patrolDotStep, dotR = RENDER_STYLE.patrolDotRadius, chevStep = RENDER_STYLE.chevronSpacing;
  ctx.save();
  for (let i = 0; i < guards.length; i++) {
    const guard = guards[i], route = guard.route;
    if (!route || route.length < 2) continue;
    ctx.fillStyle = COLORS.patrolDots;
    let carry = 0, chevDist = chevStep * 0.45;
    const chevrons = [];
    for (let j = 0; j < route.length; j++) {
      const a = route[j], b = route[(j + 1) % route.length], segLen = distance(a.x, a.y, b.x, b.y);
      if (segLen < 0.001) continue;
      const ux = (b.x - a.x) / segLen, uy = (b.y - a.y) / segLen;
      let d = carry;
      while (d < segLen) { ctx.beginPath(); ctx.arc(a.x + ux * d, a.y + uy * d, dotR, 0, Math.PI * 2); ctx.fill(); d += step; }
      carry = d - segLen;
      let cd = chevDist;
      while (cd < segLen) { chevrons.push({ x: a.x + ux * cd, y: a.y + uy * cd, ux: ux, uy: uy }); cd += chevStep; }
      chevDist = cd - segLen;
    }
    if (chevrons.length) {
      ctx.strokeStyle = rndColorAlpha(COLORS.coneEdge, 0.36); ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let c = 0; c < chevrons.length; c++) {
        const ch = chevrons[c], px = -ch.uy, py = ch.ux, tx = ch.x + ch.ux * 3.5, ty = ch.y + ch.uy * 3.5;
        ctx.moveTo(tx - ch.ux * 5.5 + px * 3.5, ty - ch.uy * 5.5 + py * 3.5); ctx.lineTo(tx, ty); ctx.lineTo(tx - ch.ux * 5.5 - px * 3.5, ty - ch.uy * 5.5 - py * 3.5);
      }
      ctx.stroke();
    }
    const waypoints = guard.waypoints || [];
    if (waypoints.length) {
      ctx.font = 'bold 12px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let w = 0; w < waypoints.length; w++) {
        const wp = waypoints[w], num = Number(wp.wait);
        if (!Number.isFinite(num) || num <= 0) continue;
        const label = (Math.round(num * 10) / 10) + 's', c = tileCenter(wp.x, wp.y);
        let lx = clamp(c.x, 24, WIDTH - 24), ly = clamp(c.y - 14, 52, HEIGHT - 16), clash = false;
        for (let g = 0; g < guards.length; g++) { if (distance(guards[g].x, guards[g].y, lx, ly) < 28) { clash = true; break; } }
        if (clash) ly = clamp(c.y + 18, 52, HEIGHT - 16);
        ctx.fillStyle = rndColorAlpha(COLORS.background, 0.65); ctx.fillText(label, lx + 1, ly + 1);
        ctx.fillStyle = rndColorAlpha(COLORS.coneEdge, 0.6); ctx.fillText(label, lx, ly);
      }
    }
  }
  ctx.restore();
}

function drawWater(ctx, game) {
  const level = game.level;
  if (!level || (level.number !== 2 && level.index !== 1)) return;
  const time = game.time || 0, ripplePhase = level.ripplePhase || 0, lights = [];
  const guards = game.guards || [];
  for (let i = 0; i < guards.length; i++) lights.push({ x: guards[i].x, y: guards[i].y, range: 185 });
  const lamps = level.lamps || [];
  for (let i = 0; i < lamps.length; i++) {
    if (level.lampsLit && level.lampsLit[i] === false) continue;
    const lc = tileCenter(lamps[i].tx, lamps[i].ty);
    lights.push({ x: lc.x, y: lc.y, range: 145 });
  }
  ctx.save();
  ctx.strokeStyle = COLORS.lanternReflection; ctx.lineWidth = 1; ctx.lineCap = 'round';
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (rndTileAt(level, tx, ty) !== '~') continue;
      const cx = tx * TILE + 16, cy = ty * TILE + 16;
      let near = false;
      for (let li = 0; li < lights.length; li++) { if (distance(cx, cy, lights[li].x, lights[li].y) <= lights[li].range) { near = true; break; } }
      if (!near) continue;
      const x0 = tx * TILE, y0 = ty * TILE, count = 3 + ((tx + ty) % 2 === 0 ? 1 : 0);
      for (let k = 0; k < count; k++) {
        const phase = ripplePhase + tx * 0.9 + ty * 1.3 + k * 2.1, driftX = Math.sin(time * 0.95 + phase) * 3;
        const segLen = 8 + ((tx * 3 + ty + k * 5) % 7), startX = x0 + 6 + ((k * 7 + tx * 5) % 9) + driftX, baseY = y0 + 6 + k * 7;
        ctx.beginPath();
        for (let sx = 0; sx <= segLen; sx += 3) {
          const px = clamp(startX + sx, x0 + 3, x0 + TILE - 3), py = baseY + Math.sin(time * 1.9 + phase + sx * 0.45) * 0.9;
          if (sx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function rndDrawLampPools(ctx, game) {
  const level = game.level;
  if (!level || !level.lamps || !level.lamps.length) return;
  const { lamps, lampsLit } = level;
  const radius = RENDER_STYLE.lampPoolRadius;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < lamps.length; i++) {
    if (lampsLit && lampsLit[i] === false) continue;
    const center = tileCenter(lamps[i].tx, lamps[i].ty);
    const glow = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
    glow.addColorStop(0, 'rgba(255,214,150,0.22)');
    glow.addColorStop(1, 'rgba(255,214,150,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(center.x - radius, center.y - radius, radius * 2, radius * 2);
  }
  ctx.restore();
}

function drawCones(ctx, game) {
  const guards = game.guards || [], time = game.time || 0;
  ctx.save();
  for (let i = 0; i < guards.length; i++) {
    const guard = guards[i], cone = guard.cone;
    if (!cone || !cone.origin || !cone.points || cone.points.length < 2) continue;
    const isAlert = guard.state === 'ALERT', isSusp = guard.state === 'SUSPICIOUS';
    const stops = isAlert ? COLORS.alertConeStops : COLORS.coneStops;
    const edgeColor = isAlert ? COLORS.alertConeEdge : COLORS.coneEdge;
    const range = TUNING.coneRange * (0.97 + 0.03 * Math.sin(time * 8.5 + (guard.flickerPhase || 0)));

    ctx.beginPath();
    ctx.moveTo(cone.origin.x, cone.origin.y);
    for (let p = 0; p < cone.points.length; p++) ctx.lineTo(cone.points[p].x, cone.points[p].y);
    ctx.closePath();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const lift = ctx.createRadialGradient(cone.origin.x, cone.origin.y, 0, cone.origin.x, cone.origin.y, range);
    const lt = isAlert ? COLORS.alert : COLORS.lantern;
    lift.addColorStop(0, rndColorAlpha(lt, 0.32)); lift.addColorStop(0.45, rndColorAlpha(lt, 0.16)); lift.addColorStop(1, rndColorAlpha(lt, 0));
    ctx.fillStyle = lift; ctx.fill();
    ctx.restore();

    const grad = ctx.createRadialGradient(cone.origin.x, cone.origin.y, 0, cone.origin.x, cone.origin.y, range);
    grad.addColorStop(0, stops[0]); grad.addColorStop(0.35, stops[1]); grad.addColorStop(1, stops[2]);
    ctx.fillStyle = grad; ctx.fill();

    let edgeW = RENDER_STYLE.coneEdgeWidth, edgeA = isAlert ? RENDER_STYLE.alertEdgeAlpha : COLORS.coneEdgeAlpha;
    if (isSusp) {
      const sp = 0.5 + 0.5 * Math.sin(time * 6.5 + (guard.flickerPhase || 0));
      edgeW = RENDER_STYLE.suspiciousEdgeWidth + sp * 0.45;
      edgeA = 0.78 + sp * 0.22;
    }
    ctx.strokeStyle = rndColorAlpha(edgeColor, edgeA); ctx.lineWidth = edgeW; ctx.lineJoin = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

function rndDrawNoises(ctx, game) {
  const noises = game.noises || [];
  if (!noises.length) return;
  const time = game.time || 0, guards = game.guards || [];
  ctx.save();
  ctx.lineWidth = 1.5;
  for (let i = 0; i < noises.length; i++) {
    const n = noises[i];
    if (!n || typeof n.born !== 'number') continue;
    const age = time - n.born;
    if (age < 0 || age >= 1) continue;
    const alpha = 0.42 * (1 - age), ease = 1 - (1 - age) * (1 - age);
    const r = lerp(5, n.radius || TILE * 2.5, ease);
    let isAlertRing = Boolean(n.alert || n.state === 'ALERT' || n.kind === 'alert');
    if (!isAlertRing) {
      for (let g = 0; g < guards.length; g++) {
        if (guards[g].state === 'ALERT' && distance(guards[g].x, guards[g].y, n.x, n.y) <= TILE * 1.4) { isAlertRing = true; break; }
      }
    }
    const ringColor = isAlertRing ? COLORS.alert : COLORS.lantern;
    ctx.strokeStyle = rndColorAlpha(ringColor, alpha);
    ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.stroke();
    if ((n.radius || 0) >= TILE * 4 && r > 18) {
      ctx.strokeStyle = rndColorAlpha(ringColor, alpha * 0.65);
      ctx.beginPath(); ctx.arc(n.x, n.y, r * 0.6, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.restore();
}

function rndDrawLampPost(ctx, tx, ty, lit) {
  const c = tileCenter(tx, ty);
  ctx.save();
  // Cast-iron lamp post + octagonal cap.
  ctx.fillStyle = COLORS.umbra; ctx.beginPath(); ctx.arc(c.x + 2, c.y + 2, 5.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.lampPost; ctx.beginPath(); ctx.arc(c.x, c.y, 5.4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.wallEdge; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = ART.lampCap; ctx.beginPath(); ctx.arc(c.x, c.y, 3.6, 0, Math.PI * 2); ctx.fill();

  if (lit) {
    ctx.fillStyle = COLORS.lampGlow;
    ctx.beginPath(); ctx.arc(c.x, c.y, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawWallFaces(ctx, game) {
  const level = game.level;
  ctx.save();
  if (rndEnsureStaticCache(level)) ctx.drawImage(rndWallsCache, 0, 0);
  else rndPaintStaticWalls(ctx, level);

  const lamps = level.lamps, lampsLit = level.lampsLit;
  if (lamps && lamps.length) {
    for (let i = 0; i < lamps.length; i++) {
      const lit = !lampsLit || lampsLit[i] !== false;
      rndDrawLampPost(ctx, lamps[i].tx, lamps[i].ty, lit);
    }
  } else {
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) { if (rndTileAt(level, tx, ty) === 'L') rndDrawLampPost(ctx, tx, ty, true); }
    }
  }
  ctx.restore();
}

function drawWatchmanFigure(ctx, guard, time) {
  if (!guard) return;
  const facing = guard.facing || 0, moving = Boolean(guard.moving), isAlert = guard.state === 'ALERT';
  const phase = (guard.flickerPhase || 0), t = time || 0;
  const stride = moving ? Math.sin(t * 10 + phase) * 4.5 : 0;
  const flicker = 1 + 0.06 * Math.sin(t * 9 + phase);

  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.rotate(facing);

  // Soft ground shadow under the ~15 px figure.
  ctx.fillStyle = COLORS.umbra;
  ctx.beginPath(); ctx.ellipse(2, 2.5, 11, 14.5, 0, 0, Math.PI * 2); ctx.fill();

  // Alternating feet (boots) peeking beneath coat when walking.
  ctx.fillStyle = ART.boot; ctx.strokeStyle = COLORS.playerOutline; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(stride, -5.2, 4.2, 2.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-stride, 5.2, 4.2, 2.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Short wooden staff / pole held along the left side.
  ctx.strokeStyle = COLORS.playerOutline; ctx.lineWidth = 4.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-11, -11.5); ctx.lineTo(13, -10.5); ctx.stroke();
  ctx.strokeStyle = ART.staff; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(-11, -11.5); ctx.lineTo(13, -10.5); ctx.stroke();
  ctx.fillStyle = COLORS.screenPivot; ctx.beginPath(); ctx.arc(13, -10.5, 1.5, 0, Math.PI * 2); ctx.fill();

  // Wide shoulders ellipse across facing direction (tan watchman coat).
  ctx.fillStyle = COLORS.guardBody; ctx.strokeStyle = COLORS.playerOutline; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.ellipse(-0.5, 0, 7.6, 13.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Darker coat mantle / trim over back shoulders.
  ctx.fillStyle = ART.guardCloak;
  ctx.beginPath(); ctx.ellipse(-3, 0, 4.6, 10.6, 0, Math.PI * 0.45, Math.PI * 1.55, false); ctx.closePath(); ctx.fill();

  // Left hand gripping the staff; right arm + hand held forward with lantern.
  ctx.fillStyle = ART.hand; ctx.strokeStyle = COLORS.playerOutline; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(2.5, -10.8, 2.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.strokeStyle = COLORS.playerOutline; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(3, 9.5); ctx.lineTo(11, 7.2); ctx.stroke();
  ctx.strokeStyle = COLORS.guardBody; ctx.lineWidth = 2.8;
  ctx.beginPath(); ctx.moveTo(3, 9.5); ctx.lineTo(11, 7.2); ctx.stroke();

  ctx.fillStyle = ART.hand; ctx.strokeStyle = COLORS.playerOutline; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(11.5, 7, 2.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Lantern at the forward hand (warm glow here; vision cone origin stays at guard center).
  const lx = 14.8, ly = 6.8;
  rndGlow(ctx, lx, ly, 1, RENDER_STYLE.lanternGlowRadius * flicker, isAlert ? COLORS.alert : COLORS.lantern, 0.62, 0.2);
  ctx.fillStyle = COLORS.lantern; ctx.beginPath(); ctx.arc(lx, ly, 3.8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.guardOutline; ctx.lineWidth = 1.3; ctx.stroke();

  // Dark hooded head slightly ahead of shoulders.
  ctx.fillStyle = ART.watchHood; ctx.strokeStyle = COLORS.playerOutline; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(2.4, 0, 6.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = COLORS.guardOutline; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-2.5, 0); ctx.lineTo(1.5, -2.5); ctx.moveTo(-2.5, 0); ctx.lineTo(1.5, 2.5); ctx.stroke();

  ctx.restore();
}

function drawCourierFigure(ctx, player, time, hasLetter) {
  if (!player) return;
  const facing = typeof player.facing === 'number' ? player.facing : 0;
  const moving = Boolean(player.moving), hidden = Boolean(player.hidden), t = time || 0;
  const stride = moving ? Math.sin(t * 11.5) * 4.4 : 0;
  const scarfWave = Math.sin(t * 5.2 + (moving ? 1.2 : 0)) * 2.2;
  const outline = hidden ? COLORS.hidden : COLORS.playerOutline;
  const outlineW = hidden ? 2 : 1.7;

  ctx.save();
  if (hidden) rndGlow(ctx, player.x, player.y, 4, RENDER_STYLE.playerGlowRadius, COLORS.hidden, 0.36);

  ctx.translate(player.x, player.y);
  ctx.rotate(facing);

  if (!hidden) {
    ctx.fillStyle = COLORS.umbra;
    ctx.beginPath(); ctx.ellipse(2, 2.5, 10, 13, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Trailing cyan scarf tail behind Wren.
  ctx.save();
  if (hidden) ctx.globalAlpha = 0.85;
  ctx.fillStyle = COLORS.hidden; ctx.strokeStyle = outline; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-4, 1);
  ctx.quadraticCurveTo(-10, 3.5 + scarfWave * 0.5, -15, 5 + scarfWave);
  ctx.lineTo(-13.5, 8.5 + scarfWave * 0.7);
  ctx.quadraticCurveTo(-8.5, 6.5, -3.5, 4.5);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();

  // Body parts (translucent at 0.55 alpha when HIDDEN, with crisp full-alpha outlines).
  ctx.save();
  if (hidden) ctx.globalAlpha = RENDER_STYLE.playerHiddenAlpha;

  // Alternating feet while moving.
  ctx.fillStyle = ART.boot;
  ctx.beginPath(); ctx.ellipse(stride, -4.4, 3.8, 2.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-stride, 4.4, 3.8, 2.3, 0, 0, Math.PI * 2); ctx.fill();

  // Wide cloaked shoulders ellipse (~14 px visual reach).
  ctx.fillStyle = COLORS.player;
  ctx.beginPath(); ctx.ellipse(-0.5, 0, 7, 12.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ART.wrenShade;
  ctx.beginPath(); ctx.ellipse(-2.8, 0, 4.2, 9.6, 0, Math.PI * 0.45, Math.PI * 1.55, false); ctx.closePath(); ctx.fill();

  // Courier satchel strap + leather pouch on hip.
  ctx.strokeStyle = ART.wrenStrap; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(-3.5, -8.5); ctx.lineTo(3.5, 7.8); ctx.stroke();
  ctx.fillStyle = ART.wrenStrap;
  ctx.fillRect(-5.5, -11.5, 6, 4.5);

  // Two hands slightly forward of shoulders.
  ctx.fillStyle = ART.hand;
  ctx.beginPath(); ctx.arc(5.8, -8.2, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5.8, 8.2, 2.4, 0, Math.PI * 2); ctx.fill();

  // Head slightly ahead of shoulders + cyan scarf collar.
  ctx.strokeStyle = COLORS.hidden; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.arc(1.2, 0, 6.2, Math.PI * 0.65, Math.PI * 1.35, false); ctx.stroke();
  ctx.fillStyle = COLORS.player;
  ctx.beginPath(); ctx.arc(2.4, 0, 5.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Crisp full-alpha outlines (dark normally; 2 px cyan when HIDDEN) so Wren pops against any floor.
  ctx.strokeStyle = outline; ctx.lineWidth = outlineW;
  ctx.beginPath(); ctx.ellipse(stride, -4.4, 3.8, 2.3, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-stride, 4.4, 3.8, 2.3, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-0.5, 0, 7, 12.2, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(5.8, -8.2, 2.4, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(5.8, 8.2, 2.4, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(2.4, 0, 5.6, 0, Math.PI * 2); ctx.stroke();

  // When holding the sealed letter, show a small cream letter tucked on the satchel.
  if (hasLetter) {
    ctx.fillStyle = COLORS.letter; ctx.fillRect(-6, -12.5, 7.5, 5.5);
    ctx.strokeStyle = COLORS.playerOutline; ctx.lineWidth = 1; ctx.strokeRect(-6, -12.5, 7.5, 5.5);
    ctx.fillStyle = COLORS.letterGlint; ctx.beginPath(); ctx.arc(-2.2, -9.8, 1.3, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

function rndDrawExit(ctx, exitTile, hasLetter, time) {
  if (!exitTile) return;
  const c = tileCenter(exitTile.tx, exitTile.ty), pulse = 0.5 + 0.5 * Math.sin(time * 3.8);
  ctx.save();
  if (hasLetter) rndGlow(ctx, c.x, c.y, 2, 24 + pulse * 6, COLORS.exitLit, 0.44 + pulse * 0.14, 0.16);
  const gateColor = hasLetter ? COLORS.exitLit : COLORS.exitDim;
  rndRoundedRectPath(ctx, exitTile.tx * TILE + 3, exitTile.ty * TILE + 3, TILE - 6, TILE - 6, 4);
  ctx.fillStyle = rndColorAlpha(gateColor, hasLetter ? 0.3 : 0.22); ctx.fill();
  ctx.strokeStyle = gateColor; ctx.lineWidth = hasLetter ? 2.5 : 2; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(c.x - 5, c.y - 6); ctx.lineTo(c.x + 2, c.y); ctx.lineTo(c.x - 5, c.y + 6);
  ctx.moveTo(c.x + 1, c.y - 6); ctx.lineTo(c.x + 8, c.y); ctx.lineTo(c.x + 1, c.y + 6);
  ctx.strokeStyle = gateColor; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}

function rndDrawLetter(ctx, letterTile, time) {
  if (!letterTile) return;
  const c = tileCenter(letterTile.tx, letterTile.ty), glint = 0.55 + 0.45 * Math.sin(time * 4.5);
  ctx.save();
  rndGlow(ctx, c.x, c.y, 1, 16 + glint * 3, COLORS.letterGlint, 0.36);
  const ew = 18, eh = 13;
  ctx.fillStyle = COLORS.letter; ctx.fillRect(c.x - ew / 2, c.y - eh / 2, ew, eh);
  ctx.strokeStyle = COLORS.playerOutline; ctx.lineWidth = 1.5; ctx.strokeRect(c.x - ew / 2, c.y - eh / 2, ew, eh);
  ctx.beginPath();
  ctx.moveTo(c.x - ew / 2 + 1, c.y - eh / 2 + 1); ctx.lineTo(c.x, c.y + 1); ctx.lineTo(c.x + ew / 2 - 1, c.y - eh / 2 + 1);
  ctx.strokeStyle = COLORS.screenLattice; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = COLORS.letterGlint; ctx.beginPath(); ctx.arc(c.x, c.y + 1, 2.4, 0, Math.PI * 2); ctx.fill();
  const gx = c.x + ew / 2 + 1, gy = c.y - eh / 2 - 1, arm = 3.5 + glint * 2.5;
  ctx.strokeStyle = COLORS.letterGlint; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(gx - arm, gy); ctx.lineTo(gx + arm, gy); ctx.moveTo(gx, gy - arm); ctx.lineTo(gx, gy + arm); ctx.stroke();
  ctx.restore();
}

function rndDrawPebble(ctx, pebble) {
  if (!pebble) return;
  const t = clamp(typeof pebble.t === 'number' ? pebble.t : 1, 0, 1);
  ctx.save();
  if (t < 1 && typeof pebble.fromX === 'number' && typeof pebble.fromY === 'number') {
    const arcH = 26;
    ctx.strokeStyle = rndColorAlpha(ART.pebbleFill, 0.45); ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(pebble.fromX, pebble.fromY);
    ctx.quadraticCurveTo((pebble.fromX + pebble.x) * 0.5, (pebble.fromY + pebble.y) * 0.5 - arcH, pebble.x, pebble.y);
    ctx.stroke(); ctx.setLineDash([]);
    const gx = lerp(pebble.fromX, pebble.x, t), gy = lerp(pebble.fromY, pebble.y, t), lift = Math.sin(t * Math.PI) * arcH;
    ctx.fillStyle = COLORS.umbra; ctx.beginPath(); ctx.arc(gx, gy + 2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ART.pebbleFill; ctx.beginPath(); ctx.arc(gx, gy - lift, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COLORS.playerOutline; ctx.lineWidth = 1; ctx.stroke();
  } else {
    ctx.fillStyle = COLORS.umbra; ctx.beginPath(); ctx.arc(pebble.x + 1, pebble.y + 1.5, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ART.pebbleFill; ctx.beginPath(); ctx.arc(pebble.x, pebble.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COLORS.playerOutline; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.restore();
}

function rndDrawScreen(ctx, screen, hover, time) {
  const c = tileCenter(screen.tx, screen.ty);
  const angle = typeof screen.angle === 'number' ? screen.angle : (screen.orientation === 'NS' ? Math.PI / 2 : 0);
  const halfLen = RENDER_STYLE.screenLength / 2, halfThick = RENDER_STYLE.screenThickness / 2;
  let shakeX = 0, shakeY = 0;
  if (screen.shakeT > 0) {
    const amp = 3.2 * clamp(screen.shakeT / TUNING.screenShakeTime, 0, 1), wave = Math.sin(screen.shakeT * 58);
    shakeX = -Math.sin(angle) * wave * amp; shakeY = Math.cos(angle) * wave * amp;
  }
  ctx.save();
  if (screen.swinging && typeof screen.fromAngle === 'number' && typeof screen.toAngle === 'number') {
    const arcR = halfLen - 2, ccw = screen.toAngle < screen.fromAngle;
    for (let side = 0; side < 2; side++) {
      const off = side * Math.PI;
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.arc(c.x, c.y, arcR, screen.fromAngle + off, angle + off, ccw); ctx.closePath();
      ctx.fillStyle = rndColorAlpha(COLORS.screenPivot, 0.14); ctx.fill();
      ctx.beginPath(); ctx.arc(c.x, c.y, arcR, screen.fromAngle + off, screen.toAngle + off, ccw);
      ctx.strokeStyle = rndColorAlpha(COLORS.screenPivot, 0.55); ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  ctx.save();
  ctx.translate(c.x + shakeX, c.y + shakeY); ctx.rotate(angle);
  ctx.fillStyle = COLORS.umbra; ctx.fillRect(-halfLen + 3, -halfThick + 3, RENDER_STYLE.screenLength, RENDER_STYLE.screenThickness);
  ctx.fillStyle = COLORS.screenPanel; ctx.fillRect(-halfLen, -halfThick, RENDER_STYLE.screenLength, RENDER_STYLE.screenThickness);
  ctx.strokeStyle = COLORS.screenLattice; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-halfLen + 2, 0); ctx.lineTo(halfLen - 2, 0);
  for (let lx = -halfLen + 8; lx <= halfLen - 8; lx += 10) {
    ctx.moveTo(lx - 4, -halfThick + 1); ctx.lineTo(lx + 4, halfThick - 1);
    ctx.moveTo(lx + 4, -halfThick + 1); ctx.lineTo(lx - 4, halfThick - 1);
  }
  ctx.stroke();
  ctx.strokeStyle = COLORS.playerOutline; ctx.lineWidth = 1.5; ctx.strokeRect(-halfLen, -halfThick, RENDER_STYLE.screenLength, RENDER_STYLE.screenThickness);
  ctx.restore();

  ctx.fillStyle = COLORS.screenPivot; ctx.beginPath(); ctx.arc(c.x, c.y, RENDER_STYLE.screenPivotRadius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.playerOutline; ctx.lineWidth = 1.5; ctx.stroke();

  if (hover && hover.screen === screen && hover.inReach) {
    const ringR = 11.5 + Math.sin(time * 5.2) * 1.2;
    ctx.beginPath(); ctx.arc(c.x, c.y, ringR, 0, Math.PI * 2); ctx.strokeStyle = COLORS.lampGlow; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.beginPath(); ctx.arc(c.x, c.y, ringR + 4.5, 0, Math.PI * 2); ctx.strokeStyle = rndColorAlpha(COLORS.screenPivot, 0.5); ctx.lineWidth = 1.5; ctx.stroke();
  }
  ctx.restore();
}

function rndDrawAlertPath(ctx, guard) {
  if (guard.state !== 'ALERT') return;
  const path = guard.path || [], lastSeen = guard.lastSeen || (path.length ? path[path.length - 1] : null);
  if (!lastSeen) return;
  const target = tileCenter(lastSeen.tx, lastSeen.ty);
  ctx.save();
  ctx.beginPath(); ctx.moveTo(guard.x, guard.y);
  if (path.length) { for (let i = 0; i < path.length; i++) { const pt = tileCenter(path[i].tx, path[i].ty); ctx.lineTo(pt.x, pt.y); } }
  else ctx.lineTo(target.x, target.y);
  ctx.strokeStyle = rndColorAlpha(COLORS.alert, 0.85); ctx.lineWidth = 2.5; ctx.setLineDash([4, 6]); ctx.lineCap = 'round'; ctx.stroke(); ctx.setLineDash([]);

  ctx.fillStyle = rndColorAlpha(COLORS.alert, 0.2); ctx.beginPath(); ctx.arc(target.x, target.y, 10, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.alert; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(target.x, target.y, 10, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(target.x - 4.5, target.y - 4.5); ctx.lineTo(target.x + 4.5, target.y + 4.5);
  ctx.moveTo(target.x + 4.5, target.y - 4.5); ctx.lineTo(target.x - 4.5, target.y + 4.5); ctx.stroke();
  ctx.restore();
}

function rndDrawGuardBadge(ctx, guard) {
  if (guard.state !== 'SUSPICIOUS' && guard.state !== 'INVESTIGATE' && guard.state !== 'ALERT') return;
  const isAlert = guard.state === 'ALERT', sym = isAlert ? '!' : '?', bc = isAlert ? COLORS.alert : COLORS.seen;
  const by = Math.max(18, guard.y - 28), bx = clamp(guard.x, 16, WIDTH - 16);
  ctx.save();
  ctx.fillStyle = COLORS.hudBg; ctx.beginPath(); ctx.arc(bx, by, 11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = bc; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = bc; ctx.font = 'bold 16px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(sym, bx, by + 1);
  ctx.restore();
}

function drawEntities(ctx, game) {
  const level = game.level, time = game.time || 0, screens = game.screens || [], guards = game.guards || [];
  rndDrawExit(ctx, level.exit, Boolean(game.hasLetter), time);
  if (!game.hasLetter) rndDrawLetter(ctx, level.letter, time);
  for (let i = 0; i < screens.length; i++) rndDrawScreen(ctx, screens[i], game.hover, time);
  rndDrawPebble(ctx, game.pebble);
  for (let i = 0; i < guards.length; i++) rndDrawAlertPath(ctx, guards[i]);
  for (let i = 0; i < guards.length; i++) {
    drawWatchmanFigure(ctx, guards[i], time);
    rndDrawGuardBadge(ctx, guards[i]);
  }
  drawCourierFigure(ctx, game.player, time, Boolean(game.hasLetter));
}

function drawCoverOutline(ctx, game) {
  const player = game.player;
  if (!player || !player.hidden) return;
  const covers = (typeof player.coverTileNearby === 'function' && game.world)
    ? (player.coverTileNearby(game.world) || [])
    : (Array.isArray(player.coverTiles) ? player.coverTiles : []);
  if (!covers.length) return;
  const screens = game.screens || [], drawnScreens = {}, tileMap = {}, tileList = [];
  for (let i = 0; i < covers.length; i++) {
    const item = covers[i];
    if (item.kind === 'screen' && item.screenIndex >= 0 && screens[item.screenIndex]) drawnScreens[item.screenIndex] = true;
    else { const key = item.tx + ',' + item.ty; if (!tileMap[key]) { tileMap[key] = item; tileList.push(item); } }
  }
  ctx.save();
  ctx.strokeStyle = rndColorAlpha(COLORS.hidden, RENDER_STYLE.coverAlpha);
  ctx.lineWidth = RENDER_STYLE.coverLineWidth; ctx.setLineDash(RENDER_STYLE.coverDash); ctx.lineCap = 'round';
  for (let i = 0; i < tileList.length; i++) {
    const t = tileList[i], x = t.tx * TILE + 1.5, y = t.ty * TILE + 1.5, w = TILE - 3, h = TILE - 3;
    ctx.beginPath();
    if (!tileMap[t.tx + ',' + (t.ty - 1)]) { ctx.moveTo(x, y); ctx.lineTo(x + w, y); }
    if (!tileMap[t.tx + ',' + (t.ty + 1)]) { ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); }
    if (!tileMap[(t.tx - 1) + ',' + t.ty]) { ctx.moveTo(x, y); ctx.lineTo(x, y + h); }
    if (!tileMap[(t.tx + 1) + ',' + t.ty]) { ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); }
    ctx.stroke();
  }
  for (const idxStr in drawnScreens) {
    const sc = screens[Number(idxStr)], c = tileCenter(sc.tx, sc.ty);
    const angle = typeof sc.angle === 'number' ? sc.angle : (sc.orientation === 'NS' ? Math.PI / 2 : 0);
    const hl = RENDER_STYLE.screenLength / 2 + 4, ht = RENDER_STYLE.screenThickness / 2 + 4;
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(angle);
    rndRoundedRectPath(ctx, -hl, -ht, hl * 2, ht * 2, 5); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}

function drawHiddenBadge(ctx, game) {
  const player = game.player;
  if (!player || !player.hidden) return;
  const badgeH = RENDER_STYLE.hiddenBadgeHeight, label = 'HIDDEN';
  ctx.save();
  ctx.font = 'bold 14px ' + FONT;
  const iconW = 18, gap = 6, padX = 10, w = Math.ceil(padX * 2 + iconW + gap + ctx.measureText(label).width);
  let bx = player.x - w / 2, by = player.y - 16 - badgeH - 6;
  if (by < 48) by = player.y + 22;
  bx = clamp(bx, 10, WIDTH - w - 10); by = clamp(by, 10, HEIGHT - badgeH - 10);

  rndRoundedRectPath(ctx, bx, by, w, badgeH, badgeH / 2);
  ctx.fillStyle = COLORS.hudBg; ctx.fill();
  ctx.strokeStyle = rndColorAlpha(COLORS.hidden, 0.85); ctx.lineWidth = 1.5; ctx.stroke();

  const ex = bx + padX + iconW / 2, ey = by + badgeH / 2 - 1;
  ctx.strokeStyle = COLORS.hidden; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(ex, ey - 2, 7.5, Math.PI * 0.16, Math.PI * 0.84, false); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ex - 5, ey + 3.5); ctx.lineTo(ex - 7, ey + 6.5);
  ctx.moveTo(ex, ey + 5.5); ctx.lineTo(ex, ey + 8.5);
  ctx.moveTo(ex + 5, ey + 3.5); ctx.lineTo(ex + 7, ey + 6.5); ctx.stroke();

  ctx.fillStyle = COLORS.hidden; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(label, bx + padX + iconW + gap, by + badgeH / 2 + 0.5);
  ctx.restore();
}

function rndDrawFlatFrame(ctx, colorHex, alpha, depth) {
  ctx.fillStyle = rndColorAlpha(colorHex, alpha);
  ctx.fillRect(0, 0, WIDTH, depth);
  ctx.fillRect(0, HEIGHT - depth, WIDTH, depth);
  ctx.fillRect(0, depth, depth, HEIGHT - depth * 2);
  ctx.fillRect(WIDTH - depth, depth, depth, HEIGHT - depth * 2);
}

function rndDrawVignette(ctx, game) {
  const time = game.time || 0, exposure = clamp(game.exposure || 0, 0, TUNING.exposureMax), guards = game.guards || [];
  let anyAlert = false;
  for (let i = 0; i < guards.length; i++) { if (guards[i].state === 'ALERT') { anyAlert = true; break; } }
  ctx.save();
  rndDrawFlatFrame(ctx, ART.nightEdge, 0.18, 28);
  rndDrawFlatFrame(ctx, ART.nightEdge, 0.2, 12);
  if (exposure > 0 && (Boolean(game.seenBy) || anyAlert) && game.state === 'playing') {
    const ratio = exposure / TUNING.exposureMax;
    const pulse = 0.72 + 0.28 * Math.sin(time * (4.5 + ratio * 5.5));
    const strength = (0.12 + ratio * 0.24) * pulse, tint = anyAlert ? COLORS.alert : COLORS.seen;
    rndDrawFlatFrame(ctx, tint, strength * 0.55, 34);
    rndDrawFlatFrame(ctx, tint, strength, 14);
  }
  ctx.restore();
}

function rndDrawLetterIcon(ctx, x, y, w, h, filled) {
  ctx.save();
  if (filled) {
    ctx.fillStyle = COLORS.letter; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = COLORS.letterGlint; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
    ctx.beginPath(); ctx.moveTo(x + 1, y + 1); ctx.lineTo(x + w / 2, y + h * 0.58); ctx.lineTo(x + w - 1, y + 1);
    ctx.strokeStyle = COLORS.screenLattice; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.fillStyle = COLORS.letterGlint; ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.58, 2.2, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.strokeStyle = rndColorAlpha(COLORS.hudText, 0.55); ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
    ctx.beginPath(); ctx.moveTo(x + 1, y + 1); ctx.lineTo(x + w / 2, y + h * 0.55); ctx.lineTo(x + w - 1, y + 1);
    ctx.strokeStyle = rndColorAlpha(COLORS.hudText, 0.42); ctx.lineWidth = 1.2; ctx.stroke();
  }
  ctx.restore();
}

function rndDrawPebbleDots(ctx, x, cy, count) {
  const filled = clamp(typeof count === 'number' ? count : 3, 0, 3);
  ctx.save();
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.arc(x + 4 + i * 10, cy, 3.4, 0, Math.PI * 2);
    if (i < filled) { ctx.fillStyle = ART.pebbleFill; ctx.fill(); ctx.strokeStyle = ART.pebbleShade; ctx.lineWidth = 1; ctx.stroke(); }
    else { ctx.strokeStyle = rndColorAlpha(ART.pebbleFill, 0.35); ctx.lineWidth = 1.2; ctx.stroke(); }
  }
  ctx.restore();
}

function drawHud(ctx, game) {
  const level = game.level;
  if (!level) return;
  const h = RENDER_STYLE.hudHeight, m = RENDER_STYLE.hudMargin, font = 'bold ' + RENDER_STYLE.hudFontSize + 'px ' + FONT;
  const num = level.number || ((game.levelIndex || 0) + 1);
  drawCapsule(ctx, 'THE UNLIT HOUR \u00B7 ' + num + ' ' + level.name, m, m, {
    align: 'left', valign: 'top', height: h, font: font, padX: 16, borderColor: COLORS.wallEdge, borderAlpha: 0.45,
  });

  const guards = game.guards || [];
  let anyAlert = false;
  for (let i = 0; i < guards.length; i++) { if (guards[i].state === 'ALERT') { anyAlert = true; break; } }
  const exposure = clamp(game.exposure || 0, 0, TUNING.exposureMax), ratio = exposure / TUNING.exposureMax;
  let statusText = '', statusColor = COLORS.hudText;
  if (anyAlert || exposure >= TUNING.exposureMax) { statusText = 'SEEN'; statusColor = COLORS.alert; }
  else if (game.player && game.player.hidden) { statusText = 'HIDDEN'; statusColor = COLORS.hidden; }
  else if (exposure > 0) { statusText = 'SEEN'; statusColor = COLORS.seen; }

  ctx.save();
  ctx.font = font;
  const statusW = statusText ? Math.ceil(ctx.measureText(statusText).width) : 0;
  const iconW = 22, iconH = 15, pebbleW = 28, barW = 88, barH = 10, gap = 11, padX = 14;
  const totalW = padX * 2 + iconW + gap + pebbleW + gap + barW + (statusW > 0 ? gap + statusW : 0);
  const rx = WIDTH - m - totalW, ry = m;

  rndRoundedRectPath(ctx, rx, ry, totalW, h, h / 2);
  ctx.fillStyle = COLORS.hudBg; ctx.fill();
  ctx.strokeStyle = rndColorAlpha(anyAlert ? COLORS.alert : COLORS.wallEdge, anyAlert ? 0.8 : 0.45);
  ctx.lineWidth = 1.5; ctx.stroke();

  let cx = rx + padX;
  rndDrawLetterIcon(ctx, cx, ry + (h - iconH) / 2, iconW, iconH, Boolean(game.hasLetter));
  cx += iconW + gap;
  rndDrawPebbleDots(ctx, cx, ry + h / 2, game.pebbles);
  cx += pebbleW + gap;

  const barY = ry + (h - barH) / 2;
  rndRoundedRectPath(ctx, cx, barY, barW, barH, barH / 2);
  ctx.fillStyle = COLORS.wallFront; ctx.fill();
  ctx.strokeStyle = rndColorAlpha(COLORS.wallEdge, 0.65); ctx.lineWidth = 1; ctx.stroke();
  if (ratio > 0) {
    rndRoundedRectPath(ctx, cx, barY, Math.max(4, barW * ratio), barH, barH / 2);
    ctx.fillStyle = (anyAlert || exposure >= TUNING.exposureMax) ? COLORS.alert : COLORS.seen; ctx.fill();
  }
  cx += barW + gap;
  if (statusText) { ctx.fillStyle = statusColor; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(statusText, cx, ry + h / 2 + 0.5); }
  ctx.restore();
}

function renderFrame(ctx, game) {
  ctx.fillStyle = ART.nightBg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (!game || !game.level) return;

  drawLevel(ctx, game);
  drawPatrolRoutes(ctx, game);
  drawWater(ctx, game);
  rndDrawLampPools(ctx, game);
  drawCones(ctx, game);
  rndDrawNoises(ctx, game);
  drawWallFaces(ctx, game);
  drawEntities(ctx, game);
  if (game.state !== 'results') {
    drawCoverOutline(ctx, game);
    drawHiddenBadge(ctx, game);
  }
  rndDrawVignette(ctx, game);
  drawHud(ctx, game);
}
