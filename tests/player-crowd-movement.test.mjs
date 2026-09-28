import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveWorldPhysics } from '../src/systems/physics.js';
import { rebuildSpatialGrid } from '../src/core/spatialGrid.js';
import { vortexCarrierBehavior } from '../src/systems/enemyLifecycle/behaviors/vortexCarrier.js';

const hero = () => ({ x: 0, y: 0, radius: 14, speed: 3.2, vx: 3.2, vy: 0, facing: 1 });
const mob = (extra = {}) => ({ x: 20, y: 0, radius: 14, hp: 100, baseType: 'ZOMBIE', combatState: 'CHASE', ...extra });

for (const combatState of ['CHASE', 'WINDUP', 'STRIKE', 'RECOVERY']) {
  for (const isElite of [false, true]) {
    test(`contact preserves player movement: ${combatState}, elite=${isElite}`, () => {
      const player = hero();
      const enemy = mob({ combatState, isElite });
      rebuildSpatialGrid([enemy]);
      resolveWorldPhysics(player, [enemy], 1);
      assert.deepEqual(player, hero());
      assert.ok(Math.hypot(enemy.x - player.x, enemy.y - player.y) >= 28);
    });
  }
}

test('crossing a dense crowd preserves the full intended displacement', () => {
  const player = hero();
  const enemies = Array.from({ length: 24 }, (_, i) => mob({
    x: 10 + (i % 6) * 12, y: (Math.floor(i / 6) - 1.5) * 12,
    combatState: i % 2 ? 'WINDUP' : 'CHASE', isElite: i % 3 === 0,
  }));
  for (let frame = 0; frame < 30; frame++) {
    player.x += player.vx;
    rebuildSpatialGrid(enemies);
    resolveWorldPhysics(player, enemies, 1);
  }
  assert.ok(Math.abs(player.x - 96) < 1e-9);
  assert.equal(player.y, 0);
});

for (const kind of ['isBoss', 'isMiniBoss']) {
  test(`${kind} remains a solid obstacle`, () => {
    const player = hero();
    const enemy = mob({ [kind]: true });
    rebuildSpatialGrid([enemy]);
    resolveWorldPhysics(player, [enemy], 1);
    assert.equal(enemy.x, 20);
    assert.equal(player.x, -8);
  });
}

test('vortex carrier proximity alone does not pull the player', () => {
  const player = hero();
  vortexCarrierBehavior(mob({ x: 100 }), 1, Math.PI, 1, { player, voidVortices: [] });
  assert.deepEqual(player, hero());
});
