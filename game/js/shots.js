// Deterministic screenshot scenes (SHOTS 1-4) built via the public Game API and fixed DT ticks.

const SHOT_ROUTE_3 = 'D100 S125 D300 W50 D25 W50 E5 D350 S100 D150 W125 E5';

const SHOTS = {
  1: {
    name: '01-overview',
    levelIndex: 1,
    ticks: 12,
    setup: function (game) {
      game.loadLevel(1);
      game.time = 1.6;
      game.elapsed = 14.2;
      game.fieldNotes = true;
      game.pebbles = 2;
      game.exposure = 34;

      // Douse the lamp post at (18, 2) near Wren and the north watchman while keeping the other lamps lit.
      const douseIdx = game.level.lamps.findIndex((lamp) => lamp.tx === 18 && lamp.ty === 2);
      if (douseIdx >= 0 && Array.isArray(game.level.lampsLit)) {
        game.level.lampsLit[douseIdx] = false;
      }

      // Wren HIDDEN in the shadow of cart (16, 5), right at the rim of the north watchman's cone.
      const wrenPos = tileCenter(16, 6);
      game.player.x = wrenPos.x;
      game.player.y = wrenPos.y;
      game.player.facing = -Math.PI / 4;

      // North watchman in INVESTIGATE ("?") walking toward a pebble that just landed at (20, 4).
      const pebblePos = tileCenter(20, 4);
      const north = game.guards[0];
      shotPlaceGuard(north, 14, 3, 10 * DEG);
      north.setState('INVESTIGATE', { noiseTarget: { tx: 20, ty: 4 } });
      north.facing = 10 * DEG;
      north.sweepBase = 10 * DEG;
      north.path = findPath(game.world, 14, 3, 20, 4) || [];

      // South watchman walking west with footstep rings, cone cut flat by the west lattice screen.
      const south = game.guards[1];
      shotPlaceGuard(south, 16, 11, Math.PI);
      south.setState('PATROL', { waypoint: 1 });
      south.walkingPatrol = true;
      south.waypoint = 0;
      south.path = findPath(game.world, 16, 11, 14, 11) || [];
      south.facing = Math.PI;

      game.pebble = {
        fromX: wrenPos.x,
        fromY: wrenPos.y,
        x: pebblePos.x,
        y: pebblePos.y,
        t: 1,
        landedAt: game.time,
      };
      game.noises = [
        { x: pebblePos.x, y: pebblePos.y, radius: 6 * TILE, born: game.time },
        { x: south.x, y: south.y, radius: 2.5 * TILE, born: game.time - 0.1 },
      ];

      const letterPos = tileCenter(game.level.letter.tx, game.level.letter.ty);
      game.callouts = [
        { text: 'YOU: hidden at the edge of the light', x: 340, y: 270, toX: wrenPos.x, toY: wrenPos.y },
        { text: 'Pebble: he goes to look', x: 790, y: 74, toX: pebblePos.x, toY: pebblePos.y },
        { text: 'THE SEALED LETTER', x: 624, y: 312, toX: letterPos.x, toY: letterPos.y },
      ];

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
      game.fieldNotes = true;

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

      game.callouts = [
        { text: 'Turning the screen cuts his light', x: 472, y: 422, toX: pivot.x, toY: pivot.y },
      ];
    },
  },

  3: {
    name: '03-close-call',
    levelIndex: 2,
    ticks: 1,
    setup: function (game) {
      game.loadLevel(2);
      game.time = 3.2;
      game.elapsed = 41.5;
      game.hasLetter = true;
      game.timesSeen = 1;
      game.exposure = 58.8;
      game.fieldNotes = true;

      // Wren holds the letter right at the southern rim of the north watchman's gold cone, sneaking east.
      const wrenPos = tileCenter(24, 6);
      game.player.x = wrenPos.x - 8;
      game.player.y = wrenPos.y + 5;
      game.player.facing = 0;
      game.keys.add('ShiftLeft');

      // Watchman 0 (north courtyard): sees Wren right at the southern rim of its cone -> SUSPICIOUS ("?").
      const north = game.guards[0];
      shotPlaceGuard(north, 19, 5, -21 * DEG);
      north.setState('PATROL', { waypoint: 1 });
      north.facing = -21 * DEG;
      north.sweepBase = -21 * DEG;

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

      game.callouts = [
        { text: '! ALERT: running to where you were seen', x: 470, y: 215, toX: south.x, toY: south.y },
        { text: 'SEEN: back to the shadow', x: 870, y: 155, toX: game.player.x, toY: game.player.y },
      ];

      game.mouse = { x: -1, y: -1 };
    },
  },

  4: {
    name: '04-delivered',
    levelIndex: 2,
    ticks: 0,
    finishOnLastTick: false,
    setup: function (game) {
      game.completed = [true, true, false];
      game.unlocked = [true, true, true];
      game.loadLevel(2);
      game.fieldNotes = false;
      game.callouts = [];
      game.mouse = { x: -1, y: -1 };

      // Replay the actual zero-exposure Gatehouse Court route via Game.step(DT) so trail and stats are genuine.
      const tokens = SHOT_ROUTE_3.split(' ');
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const code = 'Key' + token[0];
        const frames = Number(token.slice(1));
        game.keys.clear();
        if (code === 'KeyE') game.pressed.add(code);
        else game.keys.add(code);
        for (let f = 0; f < frames; f++) {
          game.step(DT);
        }
      }
      game.keys.clear();
      game.pressed.clear();
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
