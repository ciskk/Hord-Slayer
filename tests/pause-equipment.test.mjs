import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPauseEquipment } from '../src/ui/pauseEquipment.js';

test('pause includes Kragdor axes even without projectile weapons', () => {
  const player = { weapons: [], axeCount: 3, evolvedAxe: true, inventory: { weapons: new Map([['AXE', { level: 1 }]]) } };
  assert.deepEqual(getPauseEquipment(player), [{ type: 'AXE', level: 3, evolved: true }]);
});

test('pause normalizes special weapons and uses current levels without duplicates', () => {
  const player = {
    weapons: [{ type: 'SWORD', count: 4 }], auraLvl: 5, orbitals: 3,
    evolvedAura: true, evolvedOrbitals: true,
    inventory: { weapons: new Map([['SWORD', { level: 1 }], ['aura', { level: 1 }], ['orbitals', { level: 1 }]]) }
  };
  assert.deepEqual(getPauseEquipment(player), [
    { type: 'SWORD', level: 4, evolved: false },
    { type: 'AURA', level: 5, evolved: true },
    { type: 'ORBITALS', level: 3, evolved: true }
  ]);
  assert.equal(player.inventory.weapons.get('aura').level, 1);
});
