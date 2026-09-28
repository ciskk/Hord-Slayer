import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawPlayerCharacter } from '../src/render/playerRenderer.js';
import { renderHeroModel } from '../src/render/heroes/index.js';
import { drawKragdorAxes } from '../src/render/kragdorAxes.js';
import { player, setSelectedHeroKey } from '../src/entities/player.js';
import { setMainCtx } from '../src/state/gameState.js';
import { bullets } from '../src/state/collections.js';
import { SYNERGIES } from '../src/config/items.js';

// Capture the actual Canvas paint commands, including cached orbital sprites.
function recordingContext() {
  const paints = [];
  const sprites = [];
  const context = new Proxy({ globalAlpha: 1 }, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'createLinearGradient' || key === 'createRadialGradient') {
        return () => ({ addColorStop() {} });
      }
      if (key === 'drawImage') return sprite => sprites.push(sprite);
      return () => {};
    },
    set(target, key, value) {
      target[key] = value;
      if (key === 'fillStyle' || key === 'strokeStyle') paints.push(value);
      return true;
    }
  });
  return { context, paints, sprites };
}

for (const [hero, flag, id, evolvedColor, attack] of [
  ['KNIGHT', 'evolvedHammer', 'evolved_hammer', '#3d1c06', 'HAMMER_SLAM'],
  ['MAGE', 'evolvedStaff', 'evolved_staff', '#581c18', 'STAFF'],
  ['ROGUE', 'evolvedSword', 'evolved_sword', '#f1c40f', 'SWORD'],
  ['ALCHEMIST', 'evolvedPotion', 'evolved_potion', '#a29bfe', 'POTION']
]) {
  test(`${hero}: acquiring evolution updates the arena model in idle, attack and ultimate poses`, () => {
    setSelectedHeroKey(hero);
    Object.assign(player, { iFrames: 0, berserkTimer: 0, invisTimer: 0, dashDuration: 0, ignisDashDuration: 0 });
    for (const pose of ['idle', 'attack', 'ultimate']) {
      bullets.length = 0;
      if (pose === 'attack') bullets.push({ type: attack, life: 50, maxLife: 100 });
      Object.assign(player, {
        staffCastTimer: pose === 'attack' ? 10 : 0,
        potionThrowTimer: pose === 'attack' ? 10 : 0,
        alchemistSkillTimer: pose === 'ultimate' ? 60 : 0,
        invisTimer: pose === 'ultimate' && hero === 'ROGUE' ? 90 : 0,
        isPhasing: pose === 'ultimate' && hero === 'ROGUE',
        dashDuration: pose === 'ultimate' && hero === 'KNIGHT' ? 10 : 0,
        ignisDashDuration: pose === 'ultimate' && hero === 'MAGE' ? 10 : 0,
        [flag]: false
      });
      const base = recordingContext();
      setMainCtx(base.context);
      drawPlayerCharacter();
      SYNERGIES.find(s => s.id === id).apply(player);
      const evolved = recordingContext();
      setMainCtx(evolved.context);
      drawPlayerCharacter();
      assert.ok(evolved.paints.includes(evolvedColor), `${pose}: evolved weapon material must be drawn`);
      assert.notDeepEqual(evolved.paints, base.paints, `${pose}: evolution must change the model`);
    }
    bullets.length = 0;
  });
}

test('Kragdor: evolution changes dorsal and cached orbital blades, including during fury', () => {
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement() {
      const recording = recordingContext();
      return { paints: recording.paints, getContext: () => recording.context };
    }
  };
  try {
    for (const berserkTimer of [0, 90]) {
      const state = { x: 0, y: 0, axeCount: 3, axeAngle: 0, berserkTimer };
      const base = recordingContext();
      drawKragdorAxes(base.context, state);
      SYNERGIES.find(s => s.id === 'evolved_axe').apply(state);
      const evolved = recordingContext();
      drawKragdorAxes(evolved.context, state);
      assert.notEqual(base.sprites[0], evolved.sprites[0]);
      assert.ok(!base.sprites[0].paints.includes('#b84a16'));
      assert.ok(evolved.sprites[0].paints.includes('#b84a16'));
      const repeated = recordingContext();
      drawKragdorAxes(repeated.context, state);
      assert.equal(repeated.sprites[0], evolved.sprites[0], 'reuse evolved sprite cache');
      const dorsal = recordingContext();
      renderHeroModel(dorsal.context, 'BARBARIAN', state);
      assert.ok(dorsal.paints.includes('#b84a16'));
    }
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
