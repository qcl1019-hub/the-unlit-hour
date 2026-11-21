// Courier movement, cover, interaction, and the shared exposure calculation.
function exposureRate(d, sneaking) {
  if (d === null || d === undefined || !Number.isFinite(d)) return -TUNING.exposureFall;
  return (TUNING.exposureBase + TUNING.exposureNear * (1 - clamp(d, 0, TUNING.coneRange) / TUNING.coneRange)) * (sneaking ? TUNING.sneakExposureMult : 1);
}
function advanceExposure(value, d, sneaking, dt) { return clamp(value + exposureRate(d, sneaking) * dt, 0, TUNING.exposureMax); }
function plyBlocked(world, x, y, radius) {
  for (let ty = pixelToTile(y - radius); ty <= pixelToTile(y + radius); ty++) {
    for (let tx = pixelToTile(x - radius); tx <= pixelToTile(x + radius); tx++) {
      if (isWalkable(world, tx, ty)) continue;
      const nearX = clamp(x, tx * TILE, (tx + 1) * TILE), nearY = clamp(y, ty * TILE, (ty + 1) * TILE);
      if ((x - nearX) ** 2 + (y - nearY) ** 2 < radius ** 2 - 1e-7) return true;
    }
  }
  return false;
}
class Player {
  constructor(start) {
    const center = tileCenter(start.tx, start.ty);
    this.x = center.x; this.y = center.y; this.radius = TUNING.playerRadius;
    this.sneaking = false; this.moving = false; this.facing = 0; this.stepTimer = 0; this.hidden = false;
  }
  move(world, input, dt) {
    this.sneaking = !!input.sneak; this.moving = false;
    const norm = Math.hypot(input.dx, input.dy);
    if (!norm) return;
    const speed = (this.sneaking ? TUNING.playerSneak : TUNING.playerWalk) * TILE;
    const dx = input.dx / norm * speed * dt, dy = input.dy / norm * speed * dt;
    this.facing = Math.atan2(dy, dx);
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 3));
    for (let step = 0; step < steps; step++) {
      if (!plyBlocked(world, this.x + dx / steps, this.y, this.radius)) { this.x += dx / steps; this.moving = this.moving || Math.abs(dx) > 0; }
      if (!plyBlocked(world, this.x, this.y + dy / steps, this.radius)) { this.y += dy / steps; this.moving = this.moving || Math.abs(dy) > 0; }
    }
  }
  coverTileNearby(world) {
    const tiles = [], cx = pixelToTile(this.x), cy = pixelToTile(this.y);
    for (let ty = cy - 1; ty <= cy + 1; ty++) for (let tx = cx - 1; tx <= cx + 1; tx++) {
      const screenIndex = world.screens.findIndex(screen => screen.tiles().some(tile => tile.tx === tx && tile.ty === ty));
      const tile = tileAt(world.level, tx, ty);
      const kind = screenIndex >= 0 ? 'screen' : tile === '#' ? 'wall' : tile === 'C' ? 'cart' : null;
      if (kind) tiles.push({ tx, ty, kind, screenIndex });
    }
    return tiles;
  }
  isHidden(world, guards) { return !guards.some(guard => pointInCone(world, guard, this.x, this.y)) && this.coverTileNearby(world).length > 0; }
  interact(world, game) {
    const tx = pixelToTile(this.x), ty = pixelToTile(this.y), level = world.level;
    if (!game.hasLetter && Math.max(Math.abs(tx - level.letter.tx), Math.abs(ty - level.letter.ty)) <= 1) return 'letter';
    if (game.hasLetter && tx === level.exit.tx && ty === level.exit.ty) return 'exit';
    return null;
  }
}
