// Tile queries, deterministic paths, and exact DDA visibility through the town.
function tileAt(level, tx, ty) {
  return Number.isInteger(tx) && Number.isInteger(ty) && tx >= 0 && ty >= 0 && tx < COLS && ty < ROWS
    ? level.rows[ty][tx] : '#';
}
function gridScreenAt(world, tx, ty) {
  return world.screens.some(screen => screen.orientation === 'EW'
    ? screen.ty === ty && Math.abs(screen.tx - tx) <= 1
    : screen.tx === tx && Math.abs(screen.ty - ty) <= 1);
}
function isSightBlocking(world, tx, ty) {
  const tile = tileAt(world.level, tx, ty);
  return tile === '#' || tile === 'C' || gridScreenAt(world, tx, ty);
}
function isWalkable(world, tx, ty) {
  return '.=PKX'.includes(tileAt(world.level, tx, ty)) && !gridScreenAt(world, tx, ty);
}
function castRay(world, x0, y0, angle, maxDist) {
  const dx = Math.cos(angle), dy = Math.sin(angle);
  let tx = pixelToTile(x0), ty = pixelToTile(y0);
  if (isSightBlocking(world, tx, ty)) return { x: x0, y: y0, dist: 0, blocked: true };
  const stepX = dx >= 0 ? 1 : -1, stepY = dy >= 0 ? 1 : -1;
  const deltaX = Math.abs(dx) < 1e-12 ? Infinity : TILE / Math.abs(dx);
  const deltaY = Math.abs(dy) < 1e-12 ? Infinity : TILE / Math.abs(dy);
  let nextX = deltaX === Infinity ? Infinity : ((stepX > 0 ? (tx + 1) * TILE : tx * TILE) - x0) / dx;
  let nextY = deltaY === Infinity ? Infinity : ((stepY > 0 ? (ty + 1) * TILE : ty * TILE) - y0) / dy;
  for (let iteration = 0; iteration < COLS + ROWS + 8; iteration++) {
    const hit = Math.min(nextX, nextY);
    if (hit > maxDist) break;
    if (Math.abs(nextX - nextY) < 1e-9) {
      if (isSightBlocking(world, tx + stepX, ty) || isSightBlocking(world, tx, ty + stepY))
        return { x: x0 + dx * hit, y: y0 + dy * hit, dist: hit, blocked: true };
      tx += stepX; ty += stepY; nextX += deltaX; nextY += deltaY;
    } else if (nextX < nextY) { tx += stepX; nextX += deltaX; }
    else { ty += stepY; nextY += deltaY; }
    if (isSightBlocking(world, tx, ty))
      return { x: x0 + dx * hit, y: y0 + dy * hit, dist: hit, blocked: true };
  }
  return { x: x0 + dx * maxDist, y: y0 + dy * maxDist, dist: maxDist, blocked: false };
}
function hasLineOfSight(world, x0, y0, x1, y1) {
  const length = distance(x0, y0, x1, y1);
  if (length < 1e-9) return !isSightBlocking(world, pixelToTile(x0), pixelToTile(y0));
  const ray = castRay(world, x0, y0, Math.atan2(y1 - y0, x1 - x0), length);
  return !ray.blocked || ray.dist >= length - 1e-7;
}
function findPath(world, fromTx, fromTy, toTx, toTy, isPassable) {
  const passable = isPassable || ((tx, ty) => isWalkable(world, tx, ty));
  if (!passable(fromTx, fromTy) || !passable(toTx, toTy)) return null;
  if (fromTx === toTx && fromTy === toTy) return [];
  const start = fromTy * COLS + fromTx, target = toTy * COLS + toTx;
  const parents = new Int16Array(COLS * ROWS); parents.fill(-1); parents[start] = start;
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head], x = current % COLS, y = Math.floor(current / COLS);
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || !passable(nx, ny)) continue;
      const next = ny * COLS + nx;
      if (parents[next] !== -1) continue;
      parents[next] = current;
      if (next === target) {
        const path = []; let at = target;
        while (at !== start) { path.push({ tx: at % COLS, ty: Math.floor(at / COLS) }); at = parents[at]; }
        return path.reverse();
      }
      queue.push(next);
    }
  }
  return null;
}
