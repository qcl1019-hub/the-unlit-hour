// Exercise the shipped classic scripts in one VM, with no browser or external packages.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const canvas = { getContext: () => ({ fillRect() {} }), addEventListener() {} };
const context = vm.createContext({
  URLSearchParams,
  document: { getElementById: () => canvas },
  window: {
    location: { search: '' },
    addEventListener() {},
    requestAnimationFrame() {},
    localStorage: { getItem: () => null, setItem() {} },
  },
});
const scripts = ['util', 'level-data', 'levels', 'grid', 'screens', 'vision', 'guard', 'player', 'game'];
for (const name of scripts) {
  const file = new URL(`../game/js/${name}.js`, import.meta.url);
  vm.runInContext(readFileSync(file, 'utf8'), context, { filename: file.pathname });
}
const {
  COLS, ROWS, TILE, DEG, DT, TUNING, Game, Guard, LatticeScreen, Player,
  advanceExposure, exposureRate, mulberry32, tileCenter, isWalkable, castRay, hasLineOfSight,
  pointInCone, castVisionCone, findPath, parseLevel, validateLevel, validateAllLevels,
} = vm.runInContext(`({
  COLS, ROWS, TILE, DEG, DT, TUNING, Game, Guard, LatticeScreen, Player,
  advanceExposure, exposureRate, mulberry32, tileCenter, isWalkable, castRay, hasLineOfSight,
  pointInCone, castVisionCone, findPath, parseLevel, validateLevel, validateAllLevels
})`, context);

let passed = 0;
let failed = 0;
function test(name, run) {
  try {
    run();
    console.log(`PASS ${name}`);
    passed++;
  } catch (error) {
    console.error(`FAIL ${name} — ${error.message}`);
    failed++;
  }
}
function close(actual, expected, epsilon = 1e-8) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${expected}, got ${actual}`);
}
function setTile(def, x, y, tile) {
  const row = def.map[y];
  def.map[y] = row.slice(0, x) + tile + row.slice(x + 1);
}
function fixture() {
  const map = Array.from({ length: ROWS }, (_, y) =>
    y === 0 || y === ROWS - 1 ? '#'.repeat(COLS) : `#${'.'.repeat(COLS - 2)}#`);
  const def = { name: 'Test Town', par: 45, map, screens: [], guards: [] };
  setTile(def, 2, 2, 'P');
  setTile(def, 4, 2, 'K');
  setTile(def, 6, 2, 'X');
  return def;
}
function worldFrom(def = fixture()) {
  const level = parseLevel(def, 0);
  return { level, screens: def.screens.map(screen => new LatticeScreen(screen)) };
}
function screenFixture() {
  const def = fixture();
  setTile(def, 10, 7, 'S');
  def.screens.push({ x: 10, y: 7, orientation: 'NS' });
  return def;
}
function route(...tiles) {
  return { waypoints: tiles.map(([x, y, face]) => ({ x, y, wait: 1, face })) };
}
function guardFixture(def = fixture()) {
  const world = worldFrom(def);
  return { world, guard: new Guard(route([8, 6, 0], [9, 6, 0]), world, mulberry32(7)) };
}
function ticks(count, update) {
  for (let i = 0; i < count; i++) update();
}

test('exposure at 0, 128, and 256 px, walking and sneaking', () => {
  for (const [d, rate] of [[0, 200], [128, 130], [256, 60]]) {
    close(exposureRate(d, false), rate);
    close(exposureRate(d, true), rate * 0.6);
  }
});
test('exposure decays by 35/s and clamps at 0 and 100', () => {
  close(advanceExposure(90, Infinity, false, 1), 55);
  close(advanceExposure(90, null, true, 1), 55);
  assert.equal(advanceExposure(2, Infinity, false, 1), 0);
  assert.equal(advanceExposure(98, 128, false, DT), 100);
});

for (const tile of ['#', 'C', 'S', '~', '=', 'L', '.']) {
  test(`DDA rays and line of sight through tile ${tile}`, () => {
    const def = fixture();
    setTile(def, 10, 7, tile);
    if (tile === 'S') def.screens.push({ x: 10, y: 7, orientation: 'NS' });
    const world = worldFrom(def);
    const start = tileCenter(8, 7), end = tileCenter(12, 7);
    const blocked = ['#', 'C', 'S'].includes(tile);
    const ray = castRay(world, start.x, start.y, 0, 4 * TILE);
    assert.equal(ray.blocked, blocked);
    close(ray.dist, blocked ? 1.5 * TILE : 4 * TILE);
    assert.equal(hasLineOfSight(world, start.x, start.y, end.x, end.y), !blocked);
  });
}
test('cone ray count, angular and range boundaries, and cart occlusion', () => {
  const def = fixture();
  const guard = { ...tileCenter(8, 7), facing: 0 };
  const world = worldFrom(def);
  const probe = (length, angle) => pointInCone(world, guard,
    guard.x + length * Math.cos(angle * DEG), guard.y + length * Math.sin(angle * DEG));
  assert.equal(castVisionCone(world, guard).points.length, 80);
  assert.equal(probe(120, 34), true);
  assert.equal(probe(120, 36), false);
  assert.equal(probe(255, 0), true);
  assert.equal(probe(257, 0), false);
  setTile(def, 10, 7, 'C');
  assert.equal(pointInCone(worldFrom(def), guard, guard.x + 120, guard.y), false);
});

test('BFS takes a shortest path with deterministic E, S, W, N ties', () => {
  const path = findPath(worldFrom(), 8, 7, 10, 9);
  assert.deepEqual(Array.from(path, ({ tx, ty }) => [tx, ty]), [[9, 7], [10, 7], [10, 8], [10, 9]]);
  assert.equal(findPath(worldFrom(), 8, 7, 8, 7).length, 0);
});
test('BFS returns null when walled off and follows the current screen orientation', () => {
  const def = fixture();
  for (let y = 1; y < ROWS - 1; y++) setTile(def, 15, y, '#');
  assert.equal(findPath(worldFrom(def), 8, 7, 20, 7), null);
  const world = worldFrom(screenFixture());
  assert.equal(findPath(world, 8, 6, 12, 6).length, 6);
  world.screens[0].orientation = 'EW';
  assert.equal(findPath(world, 8, 6, 12, 6).length, 4);
});

for (const state of ['PATROL', 'RETURN', 'SEARCH']) {
  test(`${state} sees positive exposure and becomes SUSPICIOUS`, () => {
    const { world, guard } = guardFixture();
    guard.setState(state);
    guard.update(DT, world, tileCenter(12, 6), 20);
    assert.equal(guard.state, 'SUSPICIOUS');
    assert.equal(guard.seesPlayer, true);
    assert.equal(guard.lastSeen.tx, 12);
  });
}
for (const state of ['PATROL', 'SUSPICIOUS', 'RETURN', 'SEARCH']) {
  test(`${state} sees full exposure and becomes ALERT`, () => {
    const { world, guard } = guardFixture();
    guard.setState(state);
    guard.update(DT, world, tileCenter(12, 6), 100);
    assert.equal(guard.state, 'ALERT');
    assert.equal(guard.caughtPlayer, false);
    close(guard.x, tileCenter(8, 6).x + TUNING.guardAlertSpeed * TILE * DT);
  });
}
test('SUSPICIOUS at zero exposure returns to PATROL at its waypoint', () => {
  const { world, guard } = guardFixture();
  const states = [];
  const change = guard.setState.bind(guard);
  guard.setState = name => {
    states.push(name);
    return change(name);
  };
  guard.setState('SUSPICIOUS');
  guard.update(DT, world, tileCenter(2, 6), 0);
  assert.deepEqual(states, ['SUSPICIOUS', 'RETURN', 'PATROL']);
});
test('ALERT reaches last-seen center, sweeps 4 s in SEARCH, and returns by BFS', () => {
  const { world, guard } = guardFixture();
  const player = tileCenter(2, 6);
  guard.setState('ALERT', { lastSeen: { tx: 10, ty: 6 } });
  for (let i = 0; i < 120 && guard.state === 'ALERT'; i++) guard.update(DT, world, player, 40);
  assert.equal(guard.state, 'SEARCH');
  close(guard.x, tileCenter(10, 6).x);
  const startFacing = guard.facing;
  ticks(239, () => guard.update(DT, world, player, 0));
  assert.equal(guard.state, 'SEARCH');
  guard.update(DT, world, player, 0);
  assert.equal(guard.state, 'RETURN');
  close(guard.facing - startFacing, 2 * Math.PI);
  ticks(60, () => guard.update(DT, world, player, 0));
  assert.equal(guard.state, 'PATROL');
  close(guard.x, tileCenter(9, 6).x);
});
test('ALERT without a route to last-seen tile searches where it stands', () => {
  const def = fixture();
  for (let y = 1; y < ROWS - 1; y++) setTile(def, 15, y, '#');
  const { world, guard } = guardFixture(def);
  guard.setState('ALERT', { lastSeen: { tx: 20, ty: 6 } });
  guard.update(DT, world, tileCenter(20, 6), 99);
  assert.equal(guard.state, 'SEARCH');
  close(guard.x, tileCenter(8, 6).x);
});
test('only ALERT catches within 0.6 tiles', () => {
  for (const state of ['PATROL', 'SUSPICIOUS', 'ALERT', 'SEARCH', 'RETURN']) {
    const { world, guard } = guardFixture();
    guard.setState(state, { lastSeen: { tx: 8, ty: 6 } });
    guard.update(DT, world, { x: guard.x + 0.59 * TILE, y: guard.y }, 25);
    assert.equal(guard.caughtPlayer, state === 'ALERT', state);
  }
  const { world, guard } = guardFixture();
  guard.setState('ALERT');
  guard.update(DT, world, { x: guard.x + 0.7 * TILE, y: guard.y }, 100);
  assert.equal(guard.caughtPlayer, false);
});
test('real game ticks count each ALERT entry once and switch to CAUGHT', () => {
  const def = fixture();
  def.guards.push(route([8, 6, 0], [9, 6, 0]));
  const game = new Game(canvas);
  game.levels = [parseLevel(def, 0)];
  game.loadLevel(0);
  const guard = game.guards[0];
  Object.assign(game.player, tileCenter(14, 6));
  game.step(DT);
  assert.equal(guard.state, 'SUSPICIOUS');
  assert.ok(game.exposure > 0);
  for (let i = 0; i < 120 && guard.state !== 'ALERT'; i++) game.step(DT);
  assert.equal(guard.state, 'ALERT');
  assert.equal(game.timesSeen, 1);
  ticks(10, () => game.step(DT));
  assert.equal(game.timesSeen, 1);
  guard.setState('RETURN');
  game.step(DT);
  assert.equal(guard.state, 'ALERT');
  assert.equal(game.timesSeen, 2);
  game.player.x = guard.x + 0.5 * TILE;
  game.player.y = guard.y;
  game.step(DT);
  assert.equal(game.state, 'caught');
  assert.equal(game.timesSeen, 2);
});

test('screen reach uses 3 tiles and checks circle overlap for both actors', () => {
  const world = worldFrom(screenFixture()), [screen] = world.screens;
  const center = tileCenter(screen.tx, screen.ty);
  const player = { x: center.x, y: center.y + 3.01 * TILE, radius: TUNING.playerRadius };
  assert.equal(screen.canRotate(world, player, []).reason, 'far');
  player.y = center.y + 2.99 * TILE;
  assert.equal(screen.canRotate(world, player, []).ok, true);
  const near = { x: 11.5 * TILE, y: 8 * TILE + 3, radius: TUNING.playerRadius };
  assert.equal(screen.canRotate(world, near, []).reason, 'occupied');
  assert.equal(screen.canRotate(world, player, [near]).reason, 'occupied');
});
test('screen blocks its old tiles until the final swing tick', () => {
  const world = worldFrom(screenFixture()), [screen] = world.screens;
  screen.rotate();
  ticks(20, () => screen.update(DT));
  assert.equal(screen.swinging, true);
  assert.equal(isWalkable(world, 10, 6), false);
  assert.equal(isWalkable(world, 11, 7), true);
  screen.update(DT);
  assert.equal(screen.swinging, false);
  assert.equal(isWalkable(world, 10, 6), true);
  assert.equal(isWalkable(world, 11, 7), false);
  close(screen.angle, Math.PI);
});
test('a late obstruction stops a turning screen before it traps an actor', () => {
  const world = worldFrom(screenFixture()), [screen] = world.screens;
  const player = { ...tileCenter(11, 8), radius: TUNING.playerRadius };
  assert.equal(screen.canRotate(world, player, []).ok, true);
  screen.rotate();
  ticks(20, () => screen.update(DT, player));
  Object.assign(player, tileCenter(11, 7));
  assert.equal(screen.update(DT, player), 'occupied');
  assert.equal(screen.swinging, false);
  assert.equal(screen.orientation, 'NS');
  assert.equal(isWalkable(world, 11, 7), true);
});

const invalidLevels = [
  ['row shape and legend', /15 rows of 40 valid tiles/, def => { def.map[0] = def.map[0].slice(1); }],
  ['unique P/K/X', /exactly one P/, def => setTile(def, 3, 3, 'P')],
  ['screen geometry', /screen needs floor/, def => {
    setTile(def, 10, 7, 'S');
    setTile(def, 10, 6, 'C');
    def.screens.push({ x: 10, y: 7, orientation: 'NS' });
  }],
  ['player route', /must connect/, def => {
    setTile(def, 1, 2, '#');
    setTile(def, 3, 2, '#');
    setTile(def, 2, 1, '#');
    setTile(def, 2, 3, '#');
  }],
  ['walkable waypoints clear of both orientations', /guard waypoints/, def => {
    setTile(def, 10, 7, 'S');
    def.screens.push({ x: 10, y: 7, orientation: 'NS' });
    def.guards.push(route([11, 7], [12, 7]));
  }],
  ['all patrol legs connect', /guard patrol leg/, def => {
    for (let y = 1; y < ROWS - 1; y++) setTile(def, 20, y, '#');
    def.guards.push(route([18, 8], [22, 8]));
  }],
  ['waypoint wait bounds', /wait must be within/, def => {
    def.guards.push(route([18, 8], [19, 8]));
    def.guards[0].waypoints[1].wait = 2.01;
  }],
];
for (const [name, message, mutate] of invalidLevels) {
  test(`level validation rejects invalid ${name}`, () => {
    const def = fixture();
    mutate(def);
    assert.throws(() => validateLevel(parseLevel(def, 0)), message);
  });
}
test('all three shipped levels pass validation in script load order', () => {
  assert.deepEqual(Array.from(validateAllLevels(), level => level.name),
    ['Night Market', 'Canal Quarter', 'Gatehouse Court']);
});

for (const tile of ['#', 'C', '~', 'L', 'S']) {
  test(`player circle cannot cross tile ${tile}`, () => {
    const def = fixture();
    if (tile === 'S') {
      setTile(def, 10, 7, 'S');
      def.screens.push({ x: 10, y: 7, orientation: 'NS' });
    } else {
      setTile(def, 10, 7, tile);
    }
    const world = worldFrom(def);
    const player = new Player({ tx: 9, ty: 7 });
    ticks(60, () => player.move(world, { dx: 1, dy: 0 }, DT));
    assert.ok(player.x <= 10 * TILE - TUNING.playerRadius + 1e-8);
  });
}
test('diagonal player movement slides along a wall', () => {
  const def = fixture();
  for (let y = 4; y <= 12; y++) setTile(def, 10, y, '#');
  const world = worldFrom(def);
  const player = new Player({ tx: 9, ty: 7 });
  const startY = player.y;
  ticks(60, () => player.move(world, { dx: 1, dy: 1 }, DT));
  assert.ok(player.x <= 10 * TILE - TUNING.playerRadius + 1e-8);
  close(player.y - startY, 2.4 * TILE / Math.sqrt(2));
});
test('walk speed is 2.4 tiles/s and sneak speed is 1.4 tiles/s', () => {
  for (const sneak of [false, true]) {
    const player = new Player({ tx: 9, ty: 7 });
    const world = worldFrom();
    const startX = player.x;
    ticks(60, () => player.move(world, { dx: 1, dy: 0, sneak }, DT));
    close(player.x - startX, (sneak ? 1.4 : 2.4) * TILE);
  }
});

console.log(`Logic checks: ${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
