// Replay the three zero-exposure routes using the game's fixed-step input handler.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const routes = [
  'D200 S125 D525 W50 A25 W50 E5 D225 W25 E5',
  'D200 W100 D200 S75 D25 E5 D100 W50 D125 W25 D100 W50 D175 S150 E5',
  'D100 S125 D300 W50 D25 W50 E5 D350 S100 D150 W125 E5',
];

function replay(game, dt, routes, drawFrames) {
  const results = [];
  const verify = (actual, expected, label) => {
    if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
  };
  const step = () => game.step(dt);
  const draw = () => { if (drawFrames) game.render(); };
  const enter = () => {
    game.pressed.add('Enter');
    step();
    draw();
  };

  verify(game.state, 'title', 'initial state');
  enter();
  for (const [index, route] of routes.entries()) {
    verify(game.state, 'playing', 'level start');
    verify(game.levelIndex, index, 'level index');
    let peakExposure = 0;
    for (const run of route.split(' ')) {
      const code = `Key${run[0]}`;
      const frames = Number(run.slice(1));
      game.keys.clear();
      if (code === 'KeyE') game.pressed.add(code);
      else game.keys.add(code);
      for (let frame = 0; frame < frames; frame++) {
        step();
        peakExposure = Math.max(peakExposure, game.exposure);
        if (frame % 15 === 0) draw();
      }
    }
    draw();
    verify(game.state, 'results', game.level.name);
    verify(game.results.title, 'DELIVERED UNSEEN', 'results title');
    verify(game.results.timesSeen, 0, 'alerts');
    verify(peakExposure, 0, 'peak exposure');
    verify(game.results.stars, 3, 'stars');
    results.push(`PASS ${game.level.name}: ${game.results.time.toFixed(2)}s, peak exposure ${peakExposure}, alerts ${game.results.timesSeen}, stars ${game.results.stars}`);
    enter();
  }
  verify(game.state, 'ending', 'final delivery');
  enter();
  verify(game.state, 'title', 'ending dismissal');
  verify(game.unlocked.every(Boolean), true, 'level selection');
  results.push('PASS title → all three deliveries → ending → title');
  return results;
}

const args = process.argv.slice(2);
if (args.length === 0) {
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
  const scripts = ['util', 'level-data', 'levels', 'grid', 'screens', 'vision', 'guard', 'player', 'audio', 'game'];
  for (const script of scripts) {
    const file = new URL(`../game/js/${script}.js`, import.meta.url);
    vm.runInContext(readFileSync(file, 'utf8'), context, { filename: file.pathname });
  }
  const { game, DT } = vm.runInContext('({ game: window.__unlit, DT })', context);
  for (const line of replay(game, DT, routes, false)) console.log(line);
} else if (args.length === 2 && args[0] === '--url') {
  const checker = fileURLToPath(new URL('browser-check.mjs', import.meta.url));
  const expression = `(${replay})(window.__unlit, DT, ${JSON.stringify(routes)}, true)`;
  const result = spawnSync(process.execPath, [checker, '--url', args[1], '--eval', expression], { stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} else {
  console.error('Usage: node tools/playthrough.mjs [--url <game index URL>]');
  process.exitCode = 2;
}
