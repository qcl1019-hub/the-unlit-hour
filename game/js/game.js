// Run the fixed-step town simulation and connect it to the canvas and controls.
const gameControlCodes = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
  'ShiftLeft', 'ShiftRight', 'KeyE', 'KeyR', 'Escape', 'KeyM', 'KeyH', 'Enter',
  'Digit1', 'Digit2', 'Digit3',
]);
const gameProgressKey = 'unlitHour.progress';
const gamePebbleRange = 6 * TILE;
const gamePebbleFlight = 0.4;
const gameGuardBarks = {
  SUSPICIOUS: "Hm? Who's there?",
  INVESTIGATE: 'What was that?',
  ALERT: 'There! Stop!',
  SEARCH: 'Where did you go…',
};

class Game {
  constructor(canvas, query = new URLSearchParams()) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'title';
    this.errorMessage = '';
    this.levelIndex = 0;
    this.level = null;
    this.world = null;
    this.player = null;
    this.guards = [];
    this.screens = [];
    this.exposure = 0;
    this.seenBy = null;
    this.hasLetter = false;
    this.timesSeen = 0;
    this.elapsed = 0;
    this.time = 0;
    this.rng = mulberry32(SHOT_SEED);
    this.shot = /^[1-4]$/.test(query.get('shot')) ? Number(query.get('shot')) : 0;
    this.muted = false;
    this.hints = [];
    this.hover = { screen: null, inReach: false };
    this.mouse = { x: -1, y: -1 };
    this.results = null;
    this.completed = [false, false, false];
    this.unlocked = [true, false, false];
    this.titleSelection = 0;
    this.keys = new Set();
    this.pressed = new Set();
    this.clicks = [];
    this.gameResetFieldState();
    this.sfx = typeof Sfx === 'function' ? new Sfx({ silent: Boolean(this.shot) }) : null;
    this.query = query;
  }

  gameResetFieldState() {
    this.fieldNotes = false;
    this.pebbles = 3;
    this.pebble = null;
    this.flyingPebbles = [];
    this.noises = [];
    this.callouts = [];
    this.barks = [];
    this.heartbeatIn = 0;
    this.trail = [];
    this.trailSampleIn = 0.25;
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.level = { ...this.levels[index], ripplePhase: this.rng() * Math.PI * 2 };
    this.level.lampsLit = this.level.lamps.map(() => true);
    this.screens = this.level.screens.map(def => new LatticeScreen(def));
    this.world = { level: this.level, screens: this.screens };
    this.player = new Player(this.level.start);
    this.guards = this.level.guards.map(def => new Guard(def, this.world, this.rng));
    this.player.hidden = this.player.isHidden(this.world, this.guards);
    this.exposure = 0;
    this.seenBy = null;
    this.hasLetter = false;
    this.timesSeen = 0;
    this.elapsed = 0;
    this.gameResetFieldState();
    this.trail.push({ x: this.player.x, y: this.player.y });
    this.hints = [];
    this.shownHints = new Set();
    this.results = null;
    this.state = 'playing';
    this.gameUpdateHover();
    this.sfx?.startAmbience();
  }

  restartLevel() {
    this.loadLevel(this.levelIndex);
  }

  gameRestoreProgress() {
    try {
      const completed = JSON.parse(window.localStorage.getItem(gameProgressKey));
      if (Array.isArray(completed)) {
        this.completed = this.completed.map((_, index) => completed[index] === true);
      }
    } catch {
      // A blocked or invalid save leaves the default progress available.
    }
    this.unlocked = [true, this.completed[0], this.completed[1]];
  }

  gameFinishLevel() {
    const last = this.trail.at(-1);
    if (last?.x !== this.player.x || last?.y !== this.player.y) {
      this.trail.push({ x: this.player.x, y: this.player.y });
    }
    const unseen = this.timesSeen === 0;
    this.completed[this.levelIndex] = true;
    this.unlocked = [true, this.completed[0], this.completed[1]];
    this.results = {
      title: unseen ? 'DELIVERED UNSEEN' : 'DELIVERED',
      time: this.elapsed,
      timesSeen: this.timesSeen,
      stars: unseen ? (this.elapsed <= this.level.par + 1e-9 ? 3 : 2) : 1,
      par: this.level.par,
      completed: this.completed.slice(),
    };
    if (!this.shot) {
      try {
        window.localStorage.setItem(gameProgressKey, JSON.stringify(this.completed));
      } catch {
        // The current run keeps its progress when local storage is unavailable.
      }
    }
    this.state = 'results';
    this.sfx?.gate();
  }

  gamePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * WIDTH / rect.width,
      y: (event.clientY - rect.top) * HEIGHT / rect.height,
    };
  }

  gameAttachInput() {
    const unlockSound = event => {
      if (!event.isTrusted || window.navigator.userActivation?.isActive === false) return;
      this.sfx?.unlock();
      if (this.state === 'playing') this.sfx?.startAmbience();
      window.removeEventListener('keydown', unlockSound);
      window.removeEventListener('click', unlockSound);
    };
    window.addEventListener('keydown', unlockSound);
    window.addEventListener('click', unlockSound);
    window.addEventListener('keydown', event => {
      if (!gameControlCodes.has(event.code) || event.ctrlKey || event.altKey || event.metaKey) return;
      event.preventDefault();
      if (!event.repeat && !this.keys.has(event.code)) this.pressed.add(event.code);
      this.keys.add(event.code);
    });
    window.addEventListener('keyup', event => this.keys.delete(event.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.pressed.clear();
      this.clicks.length = 0;
    });
    this.canvas.addEventListener('pointermove', event => { this.mouse = this.gamePointer(event); });
    this.canvas.addEventListener('pointerleave', () => { this.mouse = { x: -1, y: -1 }; });
    this.canvas.addEventListener('click', event => {
      this.mouse = this.gamePointer(event);
      this.clicks.push(this.mouse);
    });
  }

  gameUpdateHover() {
    const tx = pixelToTile(this.mouse.x), ty = pixelToTile(this.mouse.y);
    const screen = this.screens.find(panel => panel.tx === tx && panel.ty === ty) || null;
    let inReach = false;
    if (screen) {
      const pivot = tileCenter(tx, ty);
      inReach = distance(this.player.x, this.player.y, pivot.x, pivot.y) <= TUNING.screenReach * TILE;
    }
    this.hover = { screen, inReach };
  }

  gameTurnScreen(point) {
    const tx = pixelToTile(point.x), ty = pixelToTile(point.y);
    const screen = this.screens.find(panel => panel.tx === tx && panel.ty === ty);
    if (!screen) return;
    const { ok, reason } = screen.canRotate(this.world, this.player, this.guards);
    if (ok) {
      screen.rotate();
      this.sfx?.creak();
    } else if (reason === 'far') {
      const center = tileCenter(tx, ty);
      const text = 'Too far to reach';
      this.hints = this.hints.filter(hint => hint.text !== text);
      this.hints.push({ text, ...center, until: this.time + TUNING.tooFarHintTime });
    } else {
      screen.shake();
      this.sfx?.thud();
    }
    return true;
  }

  gameTossPebble(point) {
    if (this.pebbles <= 0) return false;
    const tx = pixelToTile(point.x), ty = pixelToTile(point.y);
    const target = tileCenter(tx, ty);
    const { x, y } = this.player;
    if (!isWalkable(this.world, tx, ty) ||
        distance(x, y, target.x, target.y) > gamePebbleRange ||
        !hasLineOfSight(this.world, x, y, target.x, target.y)) return false;

    this.pebbles--;
    this.pebble = { fromX: x, fromY: y, x: target.x, y: target.y, t: 0, landedAt: null };
    this.flyingPebbles.push(this.pebble);
    return true;
  }

  gameUpdatePebble(dt) {
    if (!this.flyingPebbles.length) return;
    for (const pebble of this.flyingPebbles) {
      pebble.t = Math.min(1, pebble.t + dt / gamePebbleFlight);
      if (pebble.t >= 1 - 1e-9) this.gameLandPebble(pebble, this.time + dt);
    }
    this.flyingPebbles = this.flyingPebbles.filter(pebble => pebble.landedAt === null);
  }

  gameLandPebble(pebble, landedAt) {
    pebble.t = 1;
    pebble.landedAt = landedAt;
    this.sfx?.pebble?.();
    const noiseTarget = { tx: pixelToTile(pebble.x), ty: pixelToTile(pebble.y) };
    this.gameEmitNoise(pebble.x, pebble.y, gamePebbleRange, landedAt, [noiseTarget]);
  }

  gameDouseLamp() {
    const tx = pixelToTile(this.player.x), ty = pixelToTile(this.player.y);
    const index = this.level.lamps.findIndex((tile, i) => this.level.lampsLit[i] &&
      Math.abs(tile.tx - tx) + Math.abs(tile.ty - ty) === 1);
    if (index === -1) return;

    this.level.lampsLit[index] = false;
    const lamp = this.level.lamps[index];
    const center = tileCenter(lamp.tx, lamp.ty);
    this.sfx?.douse?.();
    // The lamp post blocks movement, so a guard approaches from a reachable side.
    const sides = [
      { tx: lamp.tx + 1, ty: lamp.ty },
      { tx: lamp.tx, ty: lamp.ty + 1 },
      { tx: lamp.tx - 1, ty: lamp.ty },
      { tx: lamp.tx, ty: lamp.ty - 1 },
    ];
    this.gameEmitNoise(center.x, center.y, 4 * TILE, this.time, sides);
  }

  gameEmitNoise(x, y, radius, born, targets) {
    this.noises.push({ x, y, radius, born });
    for (const guard of this.guards) {
      if (!['PATROL', 'RETURN', 'SEARCH'].includes(guard.state) ||
          distance(guard.x, guard.y, x, y) > radius) continue;
      let noiseTarget = null, bestLength = Infinity;
      for (const tile of targets) {
        const path = guard.grdPathTo(this.world, tile.tx, tile.ty);
        if (path !== null && path.length < bestLength) {
          noiseTarget = tile;
          bestLength = path.length;
        }
      }
      if (!noiseTarget) continue;
      guard.setState('INVESTIGATE', { noiseTarget });
      this.gameBark(guard, gameGuardBarks.INVESTIGATE);
    }
  }

  gameBark(guard, text) {
    if (!text) return;
    this.barks = this.barks.filter(bark => bark.guard !== guard);
    this.barks.push({ guard, text, until: this.time + 1.6 });
  }

  gameStepTitle(pressed) {
    this.unlocked.forEach((unlocked, index) => {
      if (unlocked && pressed.has(`Digit${index + 1}`)) this.titleSelection = index;
    });
    const forward = pressed.has('ArrowRight') || pressed.has('ArrowDown');
    const back = pressed.has('ArrowLeft') || pressed.has('ArrowUp');
    if (forward !== back) {
      const choices = this.unlocked.flatMap((unlocked, index) => unlocked ? [index] : []);
      const current = choices.indexOf(this.titleSelection);
      this.titleSelection = choices[(current + (forward ? 1 : -1) + choices.length) % choices.length];
    }
    if (pressed.has('Enter')) this.loadLevel(this.titleSelection);
  }

  gameUpdateExposure(dt) {
    let nearest = Infinity;
    this.seenBy = null;
    for (const guard of this.guards) {
      const length = distance(this.player.x, this.player.y, guard.x, guard.y);
      if (length < nearest && pointInCone(this.world, guard, this.player.x, this.player.y)) {
        nearest = length;
        this.seenBy = guard;
      }
    }
    this.exposure = advanceExposure(this.exposure, nearest, this.player.sneaking, dt);
  }

  gameUpdateHeartbeat(dt) {
    this.heartbeatIn = Math.max(0, this.heartbeatIn - dt);
    if (!this.seenBy || this.exposure <= 0 || this.heartbeatIn > 0) return;
    const intensity = this.exposure / TUNING.exposureMax;
    this.sfx?.heartbeat?.(intensity);
    this.heartbeatIn = 1 - 0.4 * intensity;
  }

  gameUpdateFootsteps(dt) {
    const player = this.player;
    if (player.moving) {
      const interval = player.sneaking ? TUNING.stepIntervalSneak : TUNING.stepIntervalWalk;
      player.stepTimer += dt;
      if (player.stepTimer + 1e-9 >= interval) {
        player.stepTimer = Math.max(0, player.stepTimer - interval);
        this.sfx?.step(player.sneaking);
      }
    } else {
      player.stepTimer = 0;
    }
    for (const guard of this.guards) {
      if (!guard.moving) {
        guard.stepTimer = 0;
        continue;
      }
      guard.stepTimer += dt;
      if (guard.stepTimer + 1e-9 < TUNING.guardStepInterval) continue;
      guard.stepTimer = Math.max(0, guard.stepTimer - TUNING.guardStepInterval);
      this.noises.push({ x: guard.x, y: guard.y, radius: 2.5 * TILE, born: this.time, alert: guard.state === 'ALERT' });
      const hearing = TUNING.guardStepHearing * TILE;
      const gain = 1 - distance(guard.x, guard.y, player.x, player.y) / hearing;
      if (gain > 0) this.sfx?.guardStep(clamp((guard.x - player.x) / hearing, -1, 1), gain);
    }
  }

  gameUpdateHints() {
    this.hints = this.hints.filter(hint => hint.until > this.time);
    this.level.hints.forEach((hint, index) => {
      if (this.shownHints.has(index)) return;
      const center = tileCenter(hint.x, hint.y);
      if (distance(this.player.x, this.player.y, center.x, center.y) > 3 * TILE) return;
      this.shownHints.add(index);
      this.hints.push({ text: hint.text, ...center, until: this.time + 4 });
    });
  }

  step(dt) {
    const pressed = this.pressed, clicks = this.clicks;
    this.pressed = new Set();
    this.clicks = [];
    if (this.state === 'error') return;
    if (pressed.has('KeyM')) {
      this.muted = !this.muted;
      this.sfx?.setMuted(this.muted);
    }
    if (this.state === 'title') {
      this.time += dt;
      this.gameStepTitle(pressed);
      return;
    }
    if (this.state === 'ending') {
      this.time += dt;
      if (pressed.has('Enter')) this.state = 'title';
      return;
    }
    if (this.state === 'results') {
      if (pressed.has('Enter')) {
        if (this.levelIndex + 1 < this.levels.length) this.loadLevel(this.levelIndex + 1);
        else {
          this.state = 'ending';
          this.sfx?.stopAmbience();
        }
      }
      return;
    }
    if (pressed.has('KeyR')) {
      this.restartLevel();
      return;
    }
    if (this.state === 'caught') return;
    if (pressed.has('Escape')) {
      this.state = this.state === 'playing' ? 'paused' : 'playing';
      return;
    }
    if (this.state !== 'playing') return;
    if (pressed.has('KeyH')) this.fieldNotes = !this.fieldNotes;

    for (const point of clicks) {
      if (!this.gameTurnScreen(point)) this.gameTossPebble(point);
    }
    const held = (a, b) => Number(this.keys.has(a) || this.keys.has(b));
    this.player.move(this.world, {
      dx: held('KeyD', 'ArrowRight') - held('KeyA', 'ArrowLeft'),
      dy: held('KeyS', 'ArrowDown') - held('KeyW', 'ArrowUp'),
      sneak: Boolean(held('ShiftLeft', 'ShiftRight')),
    }, dt);
    for (const screen of this.screens) {
      if (screen.update(dt, this.player, this.guards) === 'occupied') this.sfx?.thud();
    }
    this.gameUpdatePebble(dt);
    this.gameUpdateExposure(dt);
    this.gameUpdateHeartbeat(dt);
    for (const guard of this.guards) {
      const previous = guard.state;
      guard.update(dt, this.world, this.player, this.exposure);
      if (guard.enteredAlert) {
        this.timesSeen++;
        this.sfx?.alert();
      } else if (guard.state === 'SUSPICIOUS' && previous !== 'SUSPICIOUS') {
        this.sfx?.suspect();
      }
      if (previous !== guard.state) {
        const calming = ['SUSPICIOUS', 'SEARCH'].includes(previous) &&
          (guard.state === 'RETURN' || guard.state === 'PATROL');
        this.gameBark(guard, calming ? 'Just the wind.' : gameGuardBarks[guard.state]);
      }
    }
    this.player.hidden = this.player.isHidden(this.world, this.guards);
    if (this.guards.some(guard => guard.caughtPlayer)) this.state = 'caught';
    const interaction = this.state === 'playing' && pressed.has('KeyE') ? this.player.interact(this.world, this) : null;
    if (interaction === 'letter') {
      this.hasLetter = true;
      this.sfx?.chime();
    }
    if (this.state === 'playing' && pressed.has('KeyE') && !interaction) this.gameDouseLamp();
    this.time += dt;
    this.elapsed += dt;
    this.trailSampleIn -= dt;
    if (this.trailSampleIn <= 1e-9) {
      this.trail.push({ x: this.player.x, y: this.player.y });
      this.trailSampleIn += 0.25;
    }
    this.noises = this.noises.filter(noise => this.time - noise.born < 1);
    this.barks = this.barks.filter(bark => bark.until > this.time);
    this.gameUpdateHints();
    this.gameUpdateHover();
    this.gameUpdateFootsteps(dt);
    if (interaction === 'exit') this.gameFinishLevel();
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const levelVisible = this.level && ['playing', 'paused', 'caught', 'results'].includes(this.state);
    if (levelVisible && typeof renderFrame === 'function') renderFrame(ctx, this);
    if (typeof drawOverlay === 'function') {
      drawOverlay(ctx, this);
    } else if (this.state === 'error') {
      ctx.font = `20px ${FONT}`;
      ctx.fillStyle = COLORS.hudText;
      ctx.textAlign = 'center';
      ctx.fillText(this.errorMessage, WIDTH / 2, HEIGHT / 2, WIDTH - 64);
    }
  }

  boot() {
    window.__unlit = this;
    if (this.shot) document.documentElement.classList.add('shot');
    try {
      const defs = this.query.get('breaklevel') === '1' ? LEVELS.map((def, index) => index === 0
        ? { ...def, map: [def.map[0].slice(0, -1), ...def.map.slice(1)] }
        : def) : LEVELS;
      this.levels = validateAllLevels(defs);
    } catch (error) {
      this.state = 'error';
      this.errorMessage = error.message;
      this.render();
      return;
    }
    if (this.shot) {
      if (typeof applyShot !== 'function') return this.render();
      applyShot(this, this.shot);
      this.render();
      window.__shotReady = true;
      window.__SHOT_READY = true;
      document.title = 'READY';
      return;
    }
    this.gameRestoreProgress();
    this.gameAttachInput();
    this.render();
    let lastFrame = null;
    let accumulator = 0;
    const frame = timestamp => {
      const delta = lastFrame === null ? 0 : Math.max(0, (timestamp - lastFrame) / 1000);
      lastFrame = timestamp;
      accumulator = Math.min(accumulator + delta, DT * 5);
      let ticks = 0;
      while (accumulator + 1e-9 >= DT && ticks < 5) {
        this.step(DT);
        accumulator = Math.max(0, accumulator - DT);
        ticks++;
      }
      this.render();
      window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);
  }
}

const gameInstance = new Game(document.getElementById('game'), new URLSearchParams(window.location.search));
gameInstance.boot();
