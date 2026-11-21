// Shared dimensions, palette, tuning, and deterministic math for the canal town.
const TILE = 32, COLS = 40, ROWS = 15, WIDTH = 1280, HEIGHT = 480;
const DT = 1 / 60;
const SHOT_SEED = 1337;
const DEG = Math.PI / 180;
const TUNING = {
  coneHalfAngle: 35 * DEG, coneRange: 256, coneRays: 80,
  exposureMax: 100, exposureFall: 35, exposureBase: 60, exposureNear: 140, sneakExposureMult: 0.6,
  guardPatrolSpeed: 1.6, guardSuspiciousSpeed: 0.8, guardAlertSpeed: 3.0,
  guardTurnRate: 240 * DEG, sweepAmplitude: 40 * DEG, sweepPeriod: 2.4,
  searchTime: 4, catchDistance: 0.6, alertRepathInterval: 0.25,
  playerWalk: 2.4, playerSneak: 1.4, playerRadius: 10, guardRadius: 11,
  screenReach: 3, screenSwing: 0.35, tooFarHintTime: 1.2, screenShakeTime: 0.25,
  stepIntervalWalk: 0.36, stepIntervalSneak: 0.6, guardStepInterval: 0.5, guardStepHearing: 12,
  pars: [45, 75, 100],
};
const COLORS = {
  background: '#0B1020', floor: '#141B2E', floorSeam: '#18203A',
  wallTop: '#3A466B', wallEdge: '#4A5568', wallFront: '#1E2540',
  cartTop: '#7A5638', cartBase: '#5A3E2B', cartFront: '#3E2A1D', umbra: 'rgba(0,0,0,0.35)',
  canal: '#0E2236', canalRipple: '#163352', lanternReflection: 'rgba(255,214,150,0.25)',
  bridge: '#3B2F24', bridgeSeam: '#2A2119', screenPanel: '#8A6A44', screenLattice: '#6B5234',
  screenPivot: '#D8B67A', lampPost: '#2A3350', lampGlow: '#FFE3A8',
  coneStops: ['rgba(255,240,210,0.45)', 'rgba(255,196,110,0.30)', 'rgba(255,196,110,0)'],
  coneEdge: '#FFC46E', coneEdgeAlpha: 0.8,
  alertConeStops: ['rgba(255,220,210,0.45)', 'rgba(255,90,78,0.32)', 'rgba(255,90,78,0)'],
  alertConeEdge: '#FF5A4E', guardBody: '#C9A56A', guardOutline: '#5C4628', lantern: '#FFE3A8',
  player: '#E8F1FF', playerOutline: '#0B1020', hidden: '#7FD1FF', patrolDots: 'rgba(255,196,110,0.18)',
  letter: '#F6E7C1', letterGlint: '#FFD36E', exitDim: '#2E6B60', exitLit: '#7FFFD4',
  hudBg: 'rgba(11,16,32,0.72)', hudText: '#EDEDED', seen: '#FFC46E', alert: '#FF5A4E',
};
const FONT = 'system-ui, sans-serif';
function mulberry32(seed) {
  let utilState = seed >>> 0;
  return function () {
    utilState = (utilState + 0x6D2B79F5) >>> 0;
    let value = utilState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function angleDiff(a, b) {
  let value = (b - a) % (2 * Math.PI);
  if (value <= -Math.PI) value += 2 * Math.PI;
  if (value > Math.PI) value -= 2 * Math.PI;
  return value;
}
function tileCenter(tx, ty) { return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 }; }
function pixelToTile(px) { return Math.floor(px / TILE); }
function distance(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }
