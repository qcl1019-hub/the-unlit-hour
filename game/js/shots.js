// Deterministic screenshot scenes (SHOTS 1-4) built via the public Game API and fixed DT ticks.

const SHOTS = {
  1: {
    name: '01-overview',
    levelIndex: 1,
    ticks: 12,
    setup: function (game) {
      game.loadLevel(1);
      game.time = 1.6;
      game.elapsed = 14.2;

      // North watchman mid-patrol heading west so its gold cone is cleanly clipped by the row-5 carts.
      const north = game.guards[0];
      shotPlaceGuard(north, 20, 4, 165 * DEG);
      north.setState('PATROL', { waypoint: 3 });
      north.walkingPatrol = true;
      north.waypoint = 0;
      north.path = findPath(game.world, 20, 4, 14, 4) || [];
      north.facing = 158 * DEG;

      // South watchman mid-patrol heading east across the south bank toward the south bridge.
      const south = game.guards[1];
      shotPlaceGuard(south, 16, 11, 0);
      south.setState('PATROL', { waypoint: 0 });
      south.walkingPatrol = true;
      south.waypoint = 1;
      south.path = findPath(game.world, 16, 11, 21, 11) || [];
      south.facing = 0;

      // Wren stays at the west start (1, 7), hidden beside the west wall.
      game.player.facing = 0;
      game.mouse = { x: -1, y: -1 };
    },
  },

  2: {
    name: '02-turn-the-screen',
    levelIndex: 1,
    ticks: 10,
    setup: function (game) {
      game.loadLevel(1);
      game.time = 2.4;
      game.elapsed = 22.8;

      // North watchman patrolling east across the north bridge.
      const north = game.guards[0];
      shotPlaceGuard(north, 24, 3, 0);
      north.setState('PATROL', { waypoint: 0 });
      north.walkingPatrol = true;
      north.waypoint = 1;
      north.path = findPath(game.world, 24, 3, 30, 3) || [];
      north.facing = 0;

      // South watchman walking west toward the west screen, whose NS panel cuts its cone flat.
      const south = game.guards[1];
      shotPlaceGuard(south, 16, 11, Math.PI);
      south.setState('PATROL', { waypoint: 1 });
      south.walkingPatrol = true;
      south.waypoint = 0;
      south.path = findPath(game.world, 16, 11, 14, 11) || [];
      south.facing = Math.PI;

      // Place Wren in the clear NW quadrant behind the screen so the swinging blade and pivot ring stay unobstructed.
      const wrenPos = tileCenter(9, 10);
      game.player.x = wrenPos.x - 4;
      game.player.y = wrenPos.y;
      game.player.facing = Math.PI / 4;

      const pivot = tileCenter(game.screens[0].tx, game.screens[0].ty);
      game.mouse = { x: pivot.x, y: pivot.y };
      game.clicks.push({ x: pivot.x, y: pivot.y });
    },
  },

  3: {
    name: '03-close-call',
    levelIndex: 2,
    ticks: 6,
    setup: function (game) {
      game.loadLevel(2);
      game.time = 3.2;
      game.elapsed = 41.5;
      game.hasLetter = true;
      game.timesSeen = 1;
      game.exposure = 53;

      // Wren holds the letter right at the southern edge of the north watchman's gold cone, sneaking east.
      const wrenPos = tileCenter(25, 6);
      game.player.x = wrenPos.x + 8;
      game.player.y = wrenPos.y + 10;
      game.player.facing = 0;
      game.keys.add('ShiftLeft');

      // Watchman 0 (north courtyard): sees Wren right at the southern edge of its cone -> SUSPICIOUS ("?").
      const north = game.guards[0];
      shotPlaceGuard(north, 19, 5, -20 * DEG);
      north.setState('PATROL', { waypoint: 1 });
      north.facing = -20 * DEG;
      north.sweepBase = -20 * DEG;

      // Watchman 1 (south courtyard): ALERT with red cone, "!", and BFS dotted path to the letter spot.
      const south = game.guards[1];
      shotPlaceGuard(south, 12, 9, -18 * DEG);
      south.setState('ALERT', { lastSeen: { tx: 19, ty: 7 } });
      south.facing = -18 * DEG;

      // Watchman 2 (gatehouse): patrolling near the glowing east exit.
      const gate = game.guards[2];
      shotPlaceGuard(gate, 35, 7, 150 * DEG);
      gate.setState('PATROL', { waypoint: 0 });
      gate.facing = 150 * DEG;
      gate.sweepBase = 150 * DEG;

      game.mouse = { x: -1, y: -1 };
    },
  },

  4: {
    name: '04-delivered',
    levelIndex: 2,
    ticks: 8,
    finishOnLastTick: true,
    setup: function (game) {
      game.completed = [true, true, false];
      game.unlocked = [true, true, true];
      game.loadLevel(2);
      game.time = 4.0;
      game.elapsed = 68.25;
      game.hasLetter = true;
      game.timesSeen = 0;
      game.exposure = 0;

      // Position courtyard watchmen so their gold cones frame the results panel cleanly.
      const north = game.guards[0];
      shotPlaceGuard(north, 10, 5, 16 * DEG);
      north.setState('PATROL', { waypoint: 0 });
      north.facing = 16 * DEG;
      north.sweepBase = 16 * DEG;

      const south = game.guards[1];
      shotPlaceGuard(south, 28, 9, -162 * DEG);
      south.setState('PATROL', { waypoint: 0 });
      south.facing = -162 * DEG;
      south.sweepBase = -162 * DEG;

      const gate = game.guards[2];
      shotPlaceGuard(gate, 35, 7, 155 * DEG);
      gate.setState('PATROL', { waypoint: 0 });
      gate.facing = 155 * DEG;
      gate.sweepBase = 155 * DEG;

      // Stand on the glowing exit tile so pressing E finishes the level cleanly.
      const exitPos = tileCenter(game.level.exit.tx, game.level.exit.ty);
      game.player.x = exitPos.x;
      game.player.y = exitPos.y;
      game.player.facing = 0;
      game.mouse = { x: -1, y: -1 };
    },
  },
};

function shotPlaceGuard(guard, tx, ty, facing) {
  const pos = tileCenter(tx, ty);
  guard.x = pos.x;
  guard.y = pos.y;
  guard.facing = facing;
  guard.path = [];
  guard.lastSeen = null;
}

function shotAdvanceTicks(game, count) {
  for (let i = 0; i < count; i++) {
    game.step(DT);
  }
}

function applyShot(game, n) {
  const spec = SHOTS[n];
  if (!spec) {
    throw new Error('Unknown shot number: ' + n);
  }
  game.rng = mulberry32(SHOT_SEED);
  game.keys.clear();
  game.pressed.clear();
  game.clicks.length = 0;
  spec.setup(game);
  shotAdvanceTicks(game, spec.ticks);
  if (spec.finishOnLastTick) {
    game.pressed.add('KeyE');
    game.step(DT);
  }
  game.keys.clear();
  game.pressed.clear();
  game.clicks.length = 0;
}
