import { applyUpgradeEffect, hasteImprovesCooldown } from './upgradeEffects.js';
import { getUpgradePresentation } from '../i18n/upgradePresentation.js';
import { t } from '../i18n/index.js';
import { AXE_MAX_COUNT } from './axes.js';
import { player, selectedHeroKey, registerWeaponInInventory, registerPassiveInInventory, addPersistentGold, getNextLevelXp } from '../entities/player.js';
import { getAvailableSynergies } from './items.js';

function applyCardEffect(id, state) {
  const pactEffects = id.startsWith('destiny_')
    ? getUpgradePresentation(id, state).effects.map(({ text, ...effect }) => effect)
    : null;
  applyUpgradeEffect(id, state);
  if (pactEffects) state.destinyPacts.at(-1).effects = pactEffects;
}

export const upgradesPool = [
  // --- Aprimoramentos do Machado (Kragdor) ---
  {
    id: 'axe_speed',
    category: 'WEAPON',
    get title() { return t('upgrades.axe_speed.title'); },
    rarity: "card-rare",
    get badge() { return t('upgrades.axe_speed.badge'); },
    get desc() { return t('upgrades.axe_speed.description'); },
    getStat: () => getUpgradePresentation('axe_speed', player).summary,
    get stat() { return getUpgradePresentation('axe_speed', player).summary; },
    getPresentation: () => getUpgradePresentation('axe_speed', player),
    apply: () => {
      applyCardEffect('axe_speed', player);
    },
    isAvailable: () => !player.evolvedAxe && player.axeCount > 0
  },
  {
    id: 'axe_extra',
    category: 'WEAPON',
    get title() { return t('upgrades.axe_extra.title'); },
    rarity: "card-legendary",
    get badge() { return t('upgrades.axe_extra.badge'); },
    get desc() { return t('upgrades.axe_extra.description'); },
    getStat: () => getUpgradePresentation('axe_extra', player).summary,
    get stat() { return getUpgradePresentation('axe_extra', player).summary; },
    getPresentation: () => getUpgradePresentation('axe_extra', player),
    apply: () => {
      applyCardEffect('axe_extra', player);
      registerWeaponInInventory('AXE', player.axeCount);
    },
    isAvailable: () => !player.evolvedAxe && (player.axeCount || 0) > 0 && (player.axeCount || 0) < AXE_MAX_COUNT
  },
  {
    id: 'axe_radius',
    category: 'WEAPON',
    get title() { return t('upgrades.axe_radius.title'); },
    rarity: "card-rare",
    get badge() { return t('upgrades.axe_radius.badge'); },
    get desc() { return t('upgrades.axe_radius.description'); },
    getStat: () => getUpgradePresentation('axe_radius', player).summary,
    get stat() { return getUpgradePresentation('axe_radius', player).summary; },
    getPresentation: () => getUpgradePresentation('axe_radius', player),
    apply: () => {
      applyCardEffect('axe_radius', player);
    },
    isAvailable: () => !player.evolvedAxe && player.axeCount > 0
  },

  // --- Aprimoramentos das Poções (Valéria) ---
  {
    id: 'potion_volley',
    category: 'WEAPON',
    get title() { return t('upgrades.potion_volley.title'); },
    rarity: "card-legendary",
    get badge() { return t('upgrades.potion_volley.badge'); },
    get desc() { return t('upgrades.potion_volley.description'); },
    getStat: () => getUpgradePresentation('potion_volley', player).summary,
    get stat() { return getUpgradePresentation('potion_volley', player).summary; },
    getPresentation: () => getUpgradePresentation('potion_volley', player),
    apply: () => {
      applyCardEffect('potion_volley', player);
      registerWeaponInInventory('POTION', player.weapons.find(w => w.type === 'POTION').count);
    },
    isAvailable: () => {
      const w = player.weapons.find(wp => wp.type === 'POTION');
      return !player.evolvedPotion && !!w && (w.count || 1) < 4;
    }
  },
  {
    id: 'potion_potency',
    category: 'WEAPON',
    get title() { return t('upgrades.potion_potency.title'); },
    rarity: "card-rare",
    get badge() { return t('upgrades.potion_potency.badge'); },
    get desc() { return t('upgrades.potion_potency.description'); },
    getStat: () => getUpgradePresentation('potion_potency', player).summary,
    get stat() { return getUpgradePresentation('potion_potency', player).summary; },
    getPresentation: () => getUpgradePresentation('potion_potency', player),
    apply: () => {
      applyCardEffect('potion_potency', player);
    },
    isAvailable: () => !player.evolvedPotion && player.weapons.some(w => w.type === 'POTION')
  },

  // --- Aprimoramentos do Cajado (Ignis) ---
  {
    id: 'staff_projectiles',
    category: 'WEAPON',
    get title() { return t('upgrades.staff_projectiles.title'); },
    rarity: "card-rare",
    get badge() { return t('upgrades.staff_projectiles.badge'); },
    get desc() { return t('upgrades.staff_projectiles.description'); },
    getStat: () => getUpgradePresentation('staff_projectiles', player).summary,
    get stat() { return getUpgradePresentation('staff_projectiles', player).summary; },
    getPresentation: () => getUpgradePresentation('staff_projectiles', player),
    apply: () => {
      applyCardEffect('staff_projectiles', player);
      registerWeaponInInventory('STAFF', player.weapons.find(w => w.type === 'STAFF').count);
    },
    isAvailable: () => {
      const w = player.weapons.find(wp => wp.type === 'STAFF');
      return !player.evolvedStaff && !!w && (w.count || 1) < 5;
    }
  },
  {
    id: 'staff_pierce',
    category: 'WEAPON',
    get title() { return t('upgrades.staff_pierce.title'); },
    rarity: "card-rare",
    get badge() { return t('upgrades.staff_pierce.badge'); },
    get desc() { return t('upgrades.staff_pierce.description'); },
    getStat: () => getUpgradePresentation('staff_pierce', player).summary,
    get stat() { return getUpgradePresentation('staff_pierce', player).summary; },
    getPresentation: () => getUpgradePresentation('staff_pierce', player),
    apply: () => {
      applyCardEffect('staff_pierce', player);
    },
    isAvailable: () => !player.evolvedStaff && player.weapons.some(w => w.type === 'STAFF') && (player.staffPierceBonus || 0) < 3
  },

  // --- Aprimoramentos das Espadas (Kael) ---
  {
    id: 'sword_extra',
    category: 'WEAPON',
    get title() { return t('upgrades.sword_extra.title'); },
    rarity: "card-rare",
    get badge() { return t('upgrades.sword_extra.badge'); },
    get desc() { return t('upgrades.sword_extra.description'); },
    getStat: () => getUpgradePresentation('sword_extra', player).summary,
    get stat() { return getUpgradePresentation('sword_extra', player).summary; },
    getPresentation: () => getUpgradePresentation('sword_extra', player),
    apply: () => {
      applyCardEffect('sword_extra', player);
      registerWeaponInInventory('SWORD', player.weapons.find(w => w.type === 'SWORD').count);
    },
    isAvailable: () => {
      const w = player.weapons.find(wp => wp.type === 'SWORD');
      return !player.evolvedSword && !!w && (w.count || 1) < 5;
    }
  },
  {
    id: 'sword_speed',
    category: 'WEAPON',
    get title() { return t('upgrades.sword_speed.title'); },
    rarity: "card-rare",
    get badge() { return t('upgrades.sword_speed.badge'); },
    get desc() { return t('upgrades.sword_speed.description'); },
    getStat: () => getUpgradePresentation('sword_speed', player).summary,
    get stat() { return getUpgradePresentation('sword_speed', player).summary; },
    getPresentation: () => getUpgradePresentation('sword_speed', player),
    apply: () => {
      applyCardEffect('sword_speed', player);
    },
    isAvailable: () => !player.evolvedSword && player.weapons.some(w => w.type === 'SWORD')
  },

  // --- Aprimoramentos do Martelo (Sir Roland) ---
  {
    id: 'hammer_crush',
    category: 'WEAPON',
    get title() { return t('upgrades.hammer_crush.title'); },
    rarity: "card-rare",
    get badge() { return t('upgrades.hammer_crush.badge'); },
    get desc() { return t('upgrades.hammer_crush.description'); },
    getStat: () => getUpgradePresentation('hammer_crush', player).summary,
    get stat() { return getUpgradePresentation('hammer_crush', player).summary; },
    getPresentation: () => getUpgradePresentation('hammer_crush', player),
    apply: () => {
      applyCardEffect('hammer_crush', player);
      registerWeaponInInventory('HAMMER', player.weapons.find(w => w.type === 'HAMMER').count);
    },
    isAvailable: () => {
      const w = player.weapons.find(wp => wp.type === 'HAMMER');
      return !player.evolvedHammer && !!w && (w.count || 1) < 4;
    }
  },
  {
    id: 'hammer_impact',
    category: 'WEAPON',
    get title() { return t('upgrades.hammer_impact.title'); },
    rarity: "card-rare",
    get badge() { return t('upgrades.hammer_impact.badge'); },
    get desc() { return t('upgrades.hammer_impact.description'); },
    getStat: () => getUpgradePresentation('hammer_impact', player).summary,
    get stat() { return getUpgradePresentation('hammer_impact', player).summary; },
    getPresentation: () => getUpgradePresentation('hammer_impact', player),
    apply: () => {
      applyCardEffect('hammer_impact', player);
    },
    isAvailable: () => !player.evolvedHammer && player.weapons.some(w => w.type === 'HAMMER')
  },

  // --- Passivas Universais de Atributos (Infinitas na Run) ---
  {
    id: 'frost_passive',
    category: 'PASSIVE',
    get title() { return t('upgrades.frost_passive.title'); },
    rarity: "card-rare",
    get badge() { return t('upgrades.frost_passive.badge'); },
    get desc() { return t('upgrades.frost_passive.description'); },
    getStat: () => getUpgradePresentation('frost_passive', player).summary,
    get stat() { return getUpgradePresentation('frost_passive', player).summary; },
    getPresentation: () => getUpgradePresentation('frost_passive', player),
    apply: () => {
      applyCardEffect('frost_passive', player);
      registerPassiveInInventory('frost_passive', 1, { stacks: player.frostCardCount });
    },
    isAvailable: () => true
  },
  {
    id: 'dmg',
    category: 'PASSIVE',
    get title() { return t('upgrades.dmg.title'); },
    rarity: "card-common",
    get badge() { return t('upgrades.dmg.badge'); },
    get desc() { return t('upgrades.dmg.description'); },
    getStat: () => getUpgradePresentation('dmg', player).summary,
    get stat() { return getUpgradePresentation('dmg', player).summary; },
    getPresentation: () => getUpgradePresentation('dmg', player),
    apply: () => {
      applyCardEffect('dmg', player);
      registerPassiveInInventory('dmg', 1, { stacks: player.damageCardCount });
    },
    isAvailable: () => true
  },
  {
    id: 'haste',
    category: 'PASSIVE',
    get title() { return t('upgrades.haste.title'); },
    rarity: "card-rare",
    get badge() { return t('upgrades.haste.badge'); },
    get desc() { return t(hasteImprovesCooldown(player) ? 'upgrades.haste.description' : 'cards.hasteDamage'); },
    getStat: () => getUpgradePresentation('haste', player).summary,
    get stat() { return getUpgradePresentation('haste', player).summary; },
    getPresentation: () => getUpgradePresentation('haste', player),
    apply: () => {
      applyCardEffect('haste', player);
      registerPassiveInInventory('haste', 1, { stacks: player.hasteCardCount });
    },
    isAvailable: () => selectedHeroKey !== 'BARBARIAN'
  },
  {
    id: 'ult_cooldown',
    category: 'PASSIVE',
    get title() { return t('upgrades.ult_cooldown.title'); },
    rarity: "card-rare",
    get badge() { return t('upgrades.ult_cooldown.badge'); },
    get desc() { return t('upgrades.ult_cooldown.description'); },
    getStat: () => getUpgradePresentation('ult_cooldown', player).summary,
    get stat() { return getUpgradePresentation('ult_cooldown', player).summary; },
    getPresentation: () => getUpgradePresentation('ult_cooldown', player),
    apply: () => {
      applyCardEffect('ult_cooldown', player);
      registerPassiveInInventory('ult_cooldown', 1, { stacks: player.ultCooldownCount });
    },
    isAvailable: () => (player.skillMaxCd || 420) > 60
  },
  {
    id: 'wings',
    category: 'PASSIVE',
    get title() { return t('upgrades.wings.title'); },
    rarity: "card-common",
    get badge() { return t('upgrades.wings.badge'); },
    get desc() { return t('upgrades.wings.description'); },
    getStat: () => getUpgradePresentation('wings', player).summary,
    get stat() { return getUpgradePresentation('wings', player).summary; },
    getPresentation: () => getUpgradePresentation('wings', player),
    apply: () => {
      applyCardEffect('wings', player);
      registerPassiveInInventory('wings', 1, { stacks: player.wingsCardCount });
    },
    isAvailable: () => true
  },
  {
    id: 'crit',
    category: 'PASSIVE',
    get title() { return t('upgrades.crit.title'); },
    rarity: "card-rare",
    get badge() { return t('upgrades.crit.badge'); },
    get desc() { return t('upgrades.crit.description'); },
    getStat: () => getUpgradePresentation('crit', player).summary,
    get stat() { return getUpgradePresentation('crit', player).summary; },
    getPresentation: () => getUpgradePresentation('crit', player),
    apply: () => {
      applyCardEffect('crit', player);
      registerPassiveInInventory('crit', 1, { stacks: player.critCardCount });
    },
    isAvailable: () => true
  },
  {
    id: 'magnet',
    category: 'PASSIVE',
    get title() { return t('upgrades.magnet.title'); },
    rarity: "card-common",
    get badge() { return t('upgrades.magnet.badge'); },
    get desc() { return t('upgrades.magnet.description'); },
    getStat: () => getUpgradePresentation('magnet', player).summary,
    get stat() { return getUpgradePresentation('magnet', player).summary; },
    getPresentation: () => getUpgradePresentation('magnet', player),
    apply: () => {
      applyCardEffect('magnet', player);
      registerPassiveInInventory('magnet', 1, { stacks: player.magnetCardCount });
    },
    isAvailable: () => true
  },
  {
    id: 'aura',
    category: 'WEAPON',
    get title() { return t('upgrades.aura.title'); },
    rarity: "card-rare",
    get badge() { return t('upgrades.aura.badge'); },
    get desc() { return t('upgrades.aura.description'); },
    getStat: () => getUpgradePresentation('aura', player).summary,
    get stat() { return getUpgradePresentation('aura', player).summary; },
    getPresentation: () => getUpgradePresentation('aura', player),
    apply: () => {
      applyCardEffect('aura', player);
      registerWeaponInInventory('aura', player.auraLvl);
    },
    isAvailable: () => (player.auraLvl || 0) < 5 && !player.evolvedAura
  },
  {
    id: 'orbitals',
    category: 'WEAPON',
    get title() { return t('upgrades.orbitals.title'); },
    rarity: "card-rare",
    get badge() { return t('upgrades.orbitals.badge'); },
    get desc() { return t('upgrades.orbitals.description'); },
    getStat: () => getUpgradePresentation('orbitals', player).summary,
    get stat() { return getUpgradePresentation('orbitals', player).summary; },
    getPresentation: () => getUpgradePresentation('orbitals', player),
    apply: () => {
      applyCardEffect('orbitals', player);
      registerWeaponInInventory('orbitals', player.orbitals);
    },
    isAvailable: () => (player.orbitals || 0) < 3 && !player.evolvedOrbitals
  },
  {
    id: 'armor',
    category: 'PASSIVE',
    get title() { return t('upgrades.armor.title'); },
    rarity: "card-common",
    get badge() { return t('upgrades.armor.badge'); },
    get desc() { return t('upgrades.armor.description'); },
    getStat: () => getUpgradePresentation('armor', player).summary,
    get stat() { return getUpgradePresentation('armor', player).summary; },
    getPresentation: () => getUpgradePresentation('armor', player),
    apply: () => {
      applyCardEffect('armor', player);
      registerPassiveInInventory('armor', 1, { stacks: player.armorCardCount });
    },
    isAvailable: () => true
  },
  {
    id: 'heal',
    category: 'UTILITY',
    get title() { return t('upgrades.heal.title'); },
    rarity: "card-common",
    get badge() { return t('upgrades.heal.badge'); },
    get desc() { return t('upgrades.heal.description'); },
    getStat: () => getUpgradePresentation('heal', player).summary,
    get stat() { return getUpgradePresentation('heal', player).summary; },
    getPresentation: () => getUpgradePresentation('heal', player),
    apply: () => {
      applyCardEffect('heal', player);
    },
    isAvailable: () => player.hp < player.maxHp * 0.95
  }
];

// ============================================================================
// CARTAS DO DESTINO (PACTOS AMALDIÇOADOS DE ALTO IMPACTO)
// ============================================================================
export const destinyCardsPool = [
  {
    id: 'destiny_berserker',
    category: 'PACT',
    isDestinyCard: true,
    get title() { return t('upgrades.destiny_berserker.title'); },
    rarity: "card-cursed",
    get badge() { return t('upgrades.destiny_berserker.badge'); },
    get desc() { return t('upgrades.destiny_berserker.description'); },
    get bonusText() { return t('upgrades.destiny_berserker.bonusText'); },
    get penaltyText() { return t('upgrades.destiny_berserker.penaltyText'); },
    getStat: () => getUpgradePresentation('destiny_berserker', player).summary,
    get stat() { return getUpgradePresentation('destiny_berserker', player).summary; },
    getPresentation: () => getUpgradePresentation('destiny_berserker', player),
    apply: () => {
      applyCardEffect('destiny_berserker', player);
    },
    isAvailable: () => !player.destinyPacts || !player.destinyPacts.some(p => p.id === 'destiny_berserker')
  },
  {
    id: 'destiny_titan',
    category: 'PACT',
    isDestinyCard: true,
    get title() { return t('upgrades.destiny_titan.title'); },
    rarity: "card-cursed",
    get badge() { return t('upgrades.destiny_titan.badge'); },
    get desc() { return t('upgrades.destiny_titan.description'); },
    get bonusText() { return t('upgrades.destiny_titan.bonusText'); },
    get penaltyText() { return t('upgrades.destiny_titan.penaltyText'); },
    getStat: () => getUpgradePresentation('destiny_titan', player).summary,
    get stat() { return getUpgradePresentation('destiny_titan', player).summary; },
    getPresentation: () => getUpgradePresentation('destiny_titan', player),
    apply: () => {
      applyCardEffect('destiny_titan', player);
    },
    isAvailable: () => !player.destinyPacts || !player.destinyPacts.some(p => p.id === 'destiny_titan')
  },
  {
    id: 'destiny_arcane_frenzy',
    category: 'PACT',
    isDestinyCard: true,
    get title() { return t('upgrades.destiny_arcane_frenzy.title'); },
    rarity: "card-cursed",
    get badge() { return t('upgrades.destiny_arcane_frenzy.badge'); },
    get desc() { return t('upgrades.destiny_arcane_frenzy.description'); },
    get bonusText() { return t('upgrades.destiny_arcane_frenzy.bonusText'); },
    get penaltyText() { return t('upgrades.destiny_arcane_frenzy.penaltyText'); },
    getStat: () => getUpgradePresentation('destiny_arcane_frenzy', player).summary,
    get stat() { return getUpgradePresentation('destiny_arcane_frenzy', player).summary; },
    getPresentation: () => getUpgradePresentation('destiny_arcane_frenzy', player),
    apply: () => {
      applyCardEffect('destiny_arcane_frenzy', player);
    },
    isAvailable: () => !player.destinyPacts || !player.destinyPacts.some(p => p.id === 'destiny_arcane_frenzy')
  },
  {
    id: 'destiny_midas',
    category: 'PACT',
    isDestinyCard: true,
    get title() { return t('upgrades.destiny_midas.title'); },
    rarity: "card-cursed",
    get badge() { return t('upgrades.destiny_midas.badge'); },
    get desc() { return t('upgrades.destiny_midas.description'); },
    get bonusText() { return t('upgrades.destiny_midas.bonusText'); },
    get penaltyText() { return t('upgrades.destiny_midas.penaltyText'); },
    getStat: () => getUpgradePresentation('destiny_midas', player).summary,
    get stat() { return getUpgradePresentation('destiny_midas', player).summary; },
    getPresentation: () => getUpgradePresentation('destiny_midas', player),
    apply: () => {
      applyCardEffect('destiny_midas', player);
    },
    isAvailable: () => !player.destinyPacts || !player.destinyPacts.some(p => p.id === 'destiny_midas')
  },
  {
    id: 'destiny_executioner',
    category: 'PACT',
    isDestinyCard: true,
    get title() { return t('upgrades.destiny_executioner.title'); },
    rarity: "card-cursed",
    get badge() { return t('upgrades.destiny_executioner.badge'); },
    get desc() { return t('upgrades.destiny_executioner.description'); },
    get bonusText() { return t('upgrades.destiny_executioner.bonusText'); },
    get penaltyText() { return t('upgrades.destiny_executioner.penaltyText'); },
    getStat: () => getUpgradePresentation('destiny_executioner', player).summary,
    get stat() { return getUpgradePresentation('destiny_executioner', player).summary; },
    getPresentation: () => getUpgradePresentation('destiny_executioner', player),
    apply: () => {
      applyCardEffect('destiny_executioner', player);
    },
    isAvailable: () => !player.destinyPacts || !player.destinyPacts.some(p => p.id === 'destiny_executioner')
  },
  {
    id: 'destiny_spectral',
    category: 'PACT',
    isDestinyCard: true,
    get title() { return t('upgrades.destiny_spectral.title'); },
    rarity: "card-cursed",
    get badge() { return t('upgrades.destiny_spectral.badge'); },
    get desc() { return t('upgrades.destiny_spectral.description'); },
    get bonusText() { return t('upgrades.destiny_spectral.bonusText'); },
    get penaltyText() { return t('upgrades.destiny_spectral.penaltyText'); },
    getStat: () => getUpgradePresentation('destiny_spectral', player).summary,
    get stat() { return getUpgradePresentation('destiny_spectral', player).summary; },
    getPresentation: () => getUpgradePresentation('destiny_spectral', player),
    apply: () => {
      applyCardEffect('destiny_spectral', player);
    },
    isAvailable: () => !player.destinyPacts || !player.destinyPacts.some(p => p.id === 'destiny_spectral')
  },
  {
    id: 'destiny_temporal_rift',
    category: 'PACT',
    isDestinyCard: true,
    get title() { return t('upgrades.destiny_temporal_rift.title'); },
    rarity: "card-cursed",
    get badge() { return t('upgrades.destiny_temporal_rift.badge'); },
    get desc() { return t('upgrades.destiny_temporal_rift.description'); },
    get bonusText() { return t('upgrades.destiny_temporal_rift.bonusText'); },
    get penaltyText() { return t('upgrades.destiny_temporal_rift.penaltyText'); },
    getStat: () => getUpgradePresentation('destiny_temporal_rift', player).summary,
    get stat() { return getUpgradePresentation('destiny_temporal_rift', player).summary; },
    getPresentation: () => getUpgradePresentation('destiny_temporal_rift', player),
    apply: () => {
      applyCardEffect('destiny_temporal_rift', player);
    },
    isAvailable: () => player.skillMaxCd > 120 && (!player.destinyPacts || !player.destinyPacts.some(p => p.id === 'destiny_temporal_rift'))
  }
];

export const BLESSING_UPGRADE = {
  id: 'blessing',
  category: 'UTILITY',
  get title() { return t('upgrades.blessing.title'); },
  rarity: "card-legendary",
  get badge() { return t('upgrades.blessing.badge'); },
  get desc() { return t('upgrades.blessing.description'); },
  getStat: () => getUpgradePresentation('blessing', player).summary,
  get stat() { return getUpgradePresentation('blessing', player).summary; },
  getPresentation: () => getUpgradePresentation('blessing', player),
  apply: () => {
    applyCardEffect('blessing', player);
    addPersistentGold(15, player.goldMultiplier ?? 1);
  },
  isAvailable: () => true
};

export function getRandomUpgrades(count, options = true) {
  const allowDestiny = typeof options === 'boolean'
    ? options
    : (options?.allowDestiny !== undefined ? Boolean(options.allowDestiny) : true);
  const excludeIds = (typeof options === 'object' && options !== null && Array.isArray(options.excludeIds))
    ? options.excludeIds
    : [];

  const availableRegular = upgradesPool.filter(opt => opt.isAvailable() && !excludeIds.includes(opt.id));

  for (let i = availableRegular.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableRegular[i], availableRegular[j]] = [availableRegular[j], availableRegular[i]];
  }

  const selected = [];

  // Sorteio de Cartas do Destino (a partir do nível 4, ~22% de chance de 1 slot ser um Pacto Amaldiçoado)
  // Exclusivo de telas de upgrade; nunca são sorteadas se allowDestiny for falso (ex: baús de tesouro)
  if (allowDestiny) {
    const availableDestiny = destinyCardsPool.filter(opt => opt.isAvailable());
    const shouldRollDestiny = (player.level >= 4) && (availableDestiny.length > 0) && (Math.random() < 0.22);

    if (shouldRollDestiny) {
      const destinyIdx = Math.floor(Math.random() * availableDestiny.length);
      selected.push(availableDestiny[destinyIdx]);
    }
  }

  // Preenche as vagas restantes com as opções normais
  for (let i = 0; i < availableRegular.length && selected.length < count; i++) {
    selected.push(availableRegular[i]);
  }

  // Fallback: se o jogador já maximizou os upgrades disponíveis, completa as opções com a Bênção da Fortuna
  while (selected.length < count) {
    selected.push(BLESSING_UPGRADE);
  }

  // Embaralha para que a Carta do Destino não fique sempre no primeiro slot
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected;
}

/**
 * Retorna upgrades aleatórios específicos para baús (exclui estritamente Cartas de Pacto).
 * @param {number} count Quantidade de upgrades a sortear.
 * @returns {Array} Lista de upgrades elegíveis para baús.
 */
export function getRandomChestUpgrades(count, options = {}) {
  const opts = typeof options === 'object' && options !== null ? options : {};
  return getRandomUpgrades(count, { allowDestiny: false, ...opts });
}

export function checkSynergies() {
  return getAvailableSynergies(player);
}

/**
 * Concede N níveis e upgrades aleatórios imediatos ao herói (Console Dev W+5).
 * Ativa automaticamente evoluções de armas/sinergias e restaura vida cheia.
 * @param {number} count Quantidade de níveis a conceder (1 a 100).
 */
export function grantLevels(count = 50) {
  const targetLevels = Math.max(1, Math.min(100, Math.floor(count)));

  for (let i = 0; i < targetLevels; i++) {
    // 1. Aplica qualquer sinergia/fusão disponível
    const synergies = checkSynergies();
    if (synergies && synergies.length > 0) {
      synergies[0].apply();
    }

    // 2. Coleta os upgrades disponíveis no momento
    const available = upgradesPool.filter(opt => opt.isAvailable());
    if (available.length > 0) {
      const randIdx = Math.floor(Math.random() * available.length);
      available[randIdx].apply();
    } else {
      BLESSING_UPGRADE.apply();
    }

    player.level++;
  }

  // 3. Aplica quaisquer sinergias pendentes que foram desbloqueadas
  const finalSynergies = checkSynergies();
  if (finalSynergies && finalSynergies.length > 0) {
    finalSynergies.forEach(syn => syn.apply());
  }

  // 4. Recalcula curva de XP para o novo nível
  player.nextXp = getNextLevelXp(player.level);
  player.xp = 0;

  // 5. Restaura vida máxima total do herói
  player.hp = player.maxHp;
}

export function grant50Upgrades() {
  grantLevels(50);
}
