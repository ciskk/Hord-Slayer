/**
 * src/entities/player/inventory.js
 * Gerenciador de Inventário de Armas, Passivas e Níveis de Itens do Jogador.
 */

let defaultPlayer = null;

/**
 * Define o jogador padrão para operações de inventário quando o objeto player não for passado explicitamente.
 */
export function setInventoryPlayer(p) {
  defaultPlayer = p;
}

function resolvePlayer(arg) {
  if (arg && typeof arg === 'object' && !Array.isArray(arg) && (arg.inventory || arg.weapons)) {
    return arg;
  }
  return defaultPlayer;
}

export function registerWeaponInInventory(arg1, arg2, arg3 = 1, arg4 = {}) {
  let targetPlayer;
  let weaponId;
  let level;
  let extraData;

  if (typeof arg1 === 'string') {
    // Chamado como: registerWeaponInInventory(weaponId, level = 1, extraData = {})
    targetPlayer = defaultPlayer;
    weaponId = arg1;
    level = typeof arg2 === 'number' ? arg2 : 1;
    extraData = (typeof arg3 === 'object' && arg3 !== null) ? arg3 : (arg4 || {});
  } else {
    // Chamado como: registerWeaponInInventory(player, weaponId, level = 1, extraData = {})
    targetPlayer = resolvePlayer(arg1);
    weaponId = arg2;
    level = typeof arg3 === 'number' ? arg3 : 1;
    extraData = (typeof arg4 === 'object' && arg4 !== null) ? arg4 : {};
  }

  if (!targetPlayer) return;

  if (!targetPlayer.inventory) {
    targetPlayer.inventory = { weapons: new Map(), passives: new Map() };
  }
  const existing = targetPlayer.inventory.weapons.get(weaponId);
  if (existing) {
    existing.level = Math.max(existing.level, level);
    Object.assign(existing, extraData);
  } else {
    targetPlayer.inventory.weapons.set(weaponId, {
      id: weaponId,
      level,
      ...extraData
    });
  }
}

export function registerPassiveInInventory(arg1, arg2, arg3 = 1, arg4 = {}) {
  let targetPlayer;
  let passiveId;
  let stacks;
  let extraData;

  if (typeof arg1 === 'string') {
    // Chamado como: registerPassiveInInventory(passiveId, stacks = 1, extraData = {})
    targetPlayer = defaultPlayer;
    passiveId = arg1;
    stacks = typeof arg2 === 'number' ? arg2 : 1;
    extraData = (typeof arg3 === 'object' && arg3 !== null) ? arg3 : (arg4 || {});
  } else {
    // Chamado como: registerPassiveInInventory(player, passiveId, stacks = 1, extraData = {})
    targetPlayer = resolvePlayer(arg1);
    passiveId = arg2;
    stacks = typeof arg3 === 'number' ? arg3 : 1;
    extraData = (typeof arg4 === 'object' && arg4 !== null) ? arg4 : {};
  }

  if (!targetPlayer) return;

  if (!targetPlayer.inventory) {
    targetPlayer.inventory = { weapons: new Map(), passives: new Map() };
  }
  const existing = targetPlayer.inventory.passives.get(passiveId);
  if (existing) {
    existing.level = (existing.level || 1) + stacks;
    Object.assign(existing, extraData);
  } else {
    targetPlayer.inventory.passives.set(passiveId, {
      id: passiveId,
      level: stacks,
      ...extraData
    });
  }
}

export function hasInventoryItem(arg1, arg2) {
  let targetPlayer;
  let itemId;
  if (typeof arg1 === 'string') {
    targetPlayer = defaultPlayer;
    itemId = arg1;
  } else {
    targetPlayer = resolvePlayer(arg1);
    itemId = arg2;
  }
  if (!targetPlayer || !targetPlayer.inventory) return false;
  return targetPlayer.inventory.weapons.has(itemId) || targetPlayer.inventory.passives.has(itemId);
}

export function getInventoryItemLevel(arg1, arg2) {
  let targetPlayer;
  let itemId;
  if (typeof arg1 === 'string') {
    targetPlayer = defaultPlayer;
    itemId = arg1;
  } else {
    targetPlayer = resolvePlayer(arg1);
    itemId = arg2;
  }
  if (!targetPlayer || !targetPlayer.inventory) return 0;
  const w = targetPlayer.inventory.weapons.get(itemId);
  if (w) return w.level || 1;
  const p = targetPlayer.inventory.passives.get(itemId);
  if (p) return p.level || 1;
  return 0;
}
