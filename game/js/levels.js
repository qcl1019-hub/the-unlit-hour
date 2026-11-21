// Parse town layouts and verify routes against every screen orientation.
function parseLevel(def, index) {
  const level = {
    index, number: index + 1, name: def.name, par: def.par,
    rows: Array.isArray(def.map) ? def.map.slice() : [],
    start: null, letter: null, exit: null, lamps: [],
    guards: def.guards, screens: def.screens, hints: def.hints || [],
  };
  level.rows.forEach((row, ty) => {
    if (typeof row !== 'string') return;
    for (let tx = 0; tx < row.length; tx++) {
      const tile = { tx, ty };
      switch (row[tx]) {
        case 'P': level.start = tile; break;
        case 'K': level.letter = tile; break;
        case 'X': level.exit = tile; break;
        case 'L': level.lamps.push(tile); break;
      }
    }
  });
  return level;
}

function validateLevel(level) {
  const fail = reason => { throw new Error(`Level ${level.number} ${level.name}: ${reason}`); };
  if (level.rows.length !== ROWS ||
      level.rows.some(row => typeof row !== 'string' || !/^[#.C~=SLPKX]{40}$/.test(row))) {
    fail(`map must contain ${ROWS} rows of ${COLS} valid tiles`);
  }
  const tiles = level.rows.join('');
  if (['P', 'K', 'X'].some(marker => tiles.split(marker).length !== 2)) {
    fail('map must contain exactly one P, one K, and one X');
  }
  const pivots = new Set();
  const world = { level, screens: [] };
  if (level.screens.length > 3 || level.screens.length !== tiles.split('S').length - 1) {
    fail('each S needs precisely one screen, with at most three screens');
  }
  for (const def of level.screens) {
    const pivot = def.y * COLS + def.x;
    if (tileAt(level, def.x, def.y) !== 'S' || pivots.has(pivot)) fail('invalid or duplicate screen pivot');
    if (def.orientation !== 'NS' && def.orientation !== 'EW') fail('invalid screen orientation');
    pivots.add(pivot);
    const screen = new LatticeScreen(def);
    if (screen.allTiles().some(({ tx, ty }) =>
      (tx !== def.x || ty !== def.y) && tileAt(level, tx, ty) !== '.')) {
      fail('screen needs floor on both sides of both orientations');
    }
    world.screens.push(screen);
  }

  const { start, letter, exit } = level;
  let reachable = false;
  for (let mask = 0; mask < 2 ** world.screens.length && !reachable; mask++) {
    world.screens.forEach((screen, index) => {
      screen.orientation = mask & (1 << index) ? 'NS' : 'EW';
    });
    reachable = findPath(world, start.tx, start.ty, letter.tx, letter.ty) !== null &&
      findPath(world, letter.tx, letter.ty, exit.tx, exit.ty) !== null;
  }
  if (!reachable) fail('P, K, and X must connect in at least one screen configuration');

  for (const { waypoints } of level.guards) {
    if (!waypoints.length || waypoints.some(point => !lvlPatrolPassable(world, point.x, point.y))) {
      fail('guard waypoints must be walkable and clear of both screen orientations');
    }
    waypoints.forEach((point, index) => {
      const next = waypoints[(index + 1) % waypoints.length];
      if (lvlPatrolPath(world, point.x, point.y, next.x, next.y) === null) {
        fail('every guard patrol leg must connect clear of both screen orientations');
      }
      if (!Number.isFinite(point.wait) || point.wait < 1 || point.wait > 2) {
        fail('guard waypoint wait must be within 1–2 seconds');
      }
    });
  }
}

function lvlPatrolPassable(world, tx, ty) {
  return isWalkable(world, tx, ty) &&
    !world.screens.some(screen => screen.allTiles().some(tile => tile.tx === tx && tile.ty === ty));
}

function lvlPatrolPath(world, fromTx, fromTy, toTx, toTy) {
  return findPath(world, fromTx, fromTy, toTx, toTy, (tx, ty) => lvlPatrolPassable(world, tx, ty));
}

function validateAllLevels(defs = LEVELS) {
  return defs.map((def, index) => {
    const level = parseLevel(def, index);
    validateLevel(level);
    return level;
  });
}
