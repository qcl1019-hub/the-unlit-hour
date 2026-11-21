// Pivoting lattice panels retain their collision tiles until their swing ends.
function scrCircleOverlapsTile(entity, tile, fallbackRadius) {
  const x = clamp(entity.x, tile.tx * TILE, (tile.tx + 1) * TILE);
  const y = clamp(entity.y, tile.ty * TILE, (tile.ty + 1) * TILE);
  const radius = entity.radius || fallbackRadius;
  return (entity.x - x) ** 2 + (entity.y - y) ** 2 < radius ** 2;
}
class LatticeScreen {
  constructor(def) {
    this.tx = def.x; this.ty = def.y; this.orientation = def.orientation;
    this.angle = this.orientation === 'EW' ? 0 : Math.PI / 2;
    this.swinging = false; this.swingT = 0; this.shakeT = 0;
    this.fromAngle = this.angle; this.toAngle = this.angle;
  }
  tiles(orientation = this.orientation) {
    return [-1, 0, 1].map(offset => ({ tx: this.tx + (orientation === 'EW' ? offset : 0), ty: this.ty + (orientation === 'NS' ? offset : 0) }));
  }
  allTiles() { return [...this.tiles('NS'), ...this.tiles('EW').filter(tile => tile.tx !== this.tx)]; }
  canRotate(world, player, guards) {
    if (this.swinging) return { ok: false, reason: 'busy' };
    const pivot = tileCenter(this.tx, this.ty);
    if (distance(player.x, player.y, pivot.x, pivot.y) > TUNING.screenReach * TILE) return { ok: false, reason: 'far' };
    if (this.scrTargetOccupied(player, guards)) return { ok: false, reason: 'occupied' };
    return { ok: true, reason: null };
  }
  scrTargetOccupied(player, guards) {
    const target = this.tiles(this.orientation === 'NS' ? 'EW' : 'NS');
    return target.some(tile => scrCircleOverlapsTile(player, tile, TUNING.playerRadius) ||
      guards.some(guard => scrCircleOverlapsTile(guard, tile, TUNING.guardRadius)));
  }
  rotate() {
    if (this.swinging) return;
    this.fromAngle = this.angle; this.toAngle = this.angle + Math.PI / 2;
    this.swingT = 0; this.swinging = true;
  }
  shake() { this.shakeT = TUNING.screenShakeTime; }
  update(dt, player, guards = []) {
    this.shakeT = Math.max(0, this.shakeT - dt);
    if (!this.swinging) return;
    this.swingT = Math.min(1, this.swingT + dt / TUNING.screenSwing);
    this.angle = lerp(this.fromAngle, this.toAngle, this.swingT * this.swingT * (3 - 2 * this.swingT));
    if (this.swingT >= 1 - 1e-9) {
      if (player && this.scrTargetOccupied(player, guards)) {
        this.angle = this.fromAngle;
        this.swinging = false;
        this.swingT = 0;
        this.shake();
        return 'occupied';
      }
      this.angle = this.toAngle; this.orientation = this.orientation === 'NS' ? 'EW' : 'NS';
      this.swinging = false; this.swingT = 1;
    }
  }
}
