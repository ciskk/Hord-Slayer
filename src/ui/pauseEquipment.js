// Presentation only: special weapons do not all live in player.weapons.
export function getPauseEquipment(player) {
  const entries = new Map();
  for (const [key, item] of player.inventory?.weapons || []) {
    const type = key.toUpperCase();
    entries.set(type, { type, level: item.level || 1 });
  }
  for (const weapon of player.weapons || []) {
    entries.set(weapon.type, { type: weapon.type, level: weapon.count || 1 });
  }
  for (const [type, level] of [['AXE', player.axeCount], ['AURA', player.auraLvl], ['ORBITALS', player.orbitals]]) {
    if (level > 0) entries.set(type, { type, level });
  }
  const evolved = { SWORD: 'evolvedSword', AXE: 'evolvedAxe', STAFF: 'evolvedStaff', POTION: 'evolvedPotion', HAMMER: 'evolvedHammer', AURA: 'evolvedAura', ORBITALS: 'evolvedOrbitals' };
  return [...entries.values()].map(entry => ({ ...entry, evolved: !!player[evolved[entry.type]] }));
}
