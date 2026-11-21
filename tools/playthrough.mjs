// Replay the three zero-exposure routes using the game's fixed-step input handler.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const routes = [
  'D200 S125 D525 W50 A25 W50 E5 D225 W25 E5',
  'D200 W100 D200 S75 D25 E5 D100 W50 D125 W25 D100 W50 D175 S150 E5',
  'D100 S125 D300 W50 D25 W50 E5 D350 S100 D150 W125 E5',
];
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
function press(code) {
  game.pressed.add(code);
  game.step(DT);
}

assert.equal(game.state, 'title');
press('Enter');
for (const [index, route] of routes.entries()) {
  assert.equal(game.state, 'playing');
  assert.equal(game.levelIndex, index);
  let peakExposure = 0;
  for (const run of route.split(' ')) {
    const code = `Key${run[0]}`;
    const frames = Number(run.slice(1));
    game.keys.clear();
    if (code === 'KeyE') game.pressed.add(code);
    else game.keys.add(code);
    for (let frame = 0; frame < frames; frame++) {
      game.step(DT);
      peakExposure = Math.max(peakExposure, game.exposure);
    }
  }
  assert.equal(game.state, 'results', game.level.name);
  assert.equal(game.results.title, 'DELIVERED UNSEEN');
  assert.equal(game.results.timesSeen, 0);
  assert.equal(peakExposure, 0);
  assert.equal(game.results.stars, 3);
  console.log(`PASS ${game.level.name}: ${game.results.time.toFixed(2)}s, peak exposure ${peakExposure}, alerts ${game.results.timesSeen}, stars ${game.results.stars}`);
  press('Enter');
}
assert.equal(game.state, 'ending');
press('Enter');
assert.equal(game.state, 'title');
assert.ok(game.unlocked.every(Boolean));
console.log('PASS title → all three deliveries → ending → title');
