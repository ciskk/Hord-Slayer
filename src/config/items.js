import { t, formatNumber } from '../i18n/index.js';
import { AXE_EVOLVED_COUNT } from './axes.js';

/**
 * src/config/items.js
 * Registro Unificado de Itens, Armas, Passivas e Matriz de Sinergias (ItemRegistry).
 * Single Source of Truth para o ecossistema de itens de Hord.io.
 */

export const ITEM_CATEGORIES = {
  WEAPON: 'WEAPON',
  PASSIVE: 'PASSIVE',
  UTILITY: 'UTILITY'
};

export const ITEMS = {
  // ==========================================
  // ARMAS ATIVAS
  // ==========================================
  SWORD: {
    id: 'SWORD',
    category: ITEM_CATEGORIES.WEAPON,
    get name() { return t('items.SWORD.name'); },
    icon: "sword",
    get badge() { return t('items.SWORD.badge'); },
    get description() { return t('items.SWORD.description'); },
    maxLevel: 5,
    evolutionId: 'evolved_sword'
  },
  STAFF: {
    id: 'STAFF',
    category: ITEM_CATEGORIES.WEAPON,
    get name() { return t('items.STAFF.name'); },
    icon: "staff",
    get badge() { return t('items.STAFF.badge'); },
    get description() { return t('items.STAFF.description'); },
    maxLevel: 5,
    evolutionId: 'evolved_staff'
  },
  POTION: {
    id: 'POTION',
    category: ITEM_CATEGORIES.WEAPON,
    get name() { return t('items.POTION.name'); },
    icon: "potion",
    get badge() { return t('items.POTION.badge'); },
    get description() { return t('items.POTION.description'); },
    maxLevel: 5,
    evolutionId: 'evolved_potion'
  },
  HAMMER: {
    id: 'HAMMER',
    category: ITEM_CATEGORIES.WEAPON,
    get name() { return t('items.HAMMER.name'); },
    icon: "hammer",
    get badge() { return t('items.HAMMER.badge'); },
    get description() { return t('items.HAMMER.description'); },
    maxLevel: 5,
    evolutionId: 'evolved_hammer'
  },
  AXE: {
    id: 'AXE',
    category: ITEM_CATEGORIES.WEAPON,
    get name() { return t('items.AXE.name'); },
    icon: "axe",
    get badge() { return t('items.AXE.badge'); },
    get description() { return t('items.AXE.description'); },
    maxLevel: 3,
    evolutionId: 'evolved_axe'
  },
  ORBITALS: {
    id: 'orbitals',
    category: ITEM_CATEGORIES.WEAPON,
    get name() { return t('items.orbitals.name'); },
    icon: "orbitals",
    get badge() { return t('items.orbitals.badge'); },
    get description() { return t('items.orbitals.description'); },
    maxLevel: 3,
    evolutionId: 'evolved_orbitals'
  },
  AURA: {
    id: 'aura',
    category: ITEM_CATEGORIES.WEAPON,
    get name() { return t('items.aura.name'); },
    icon: "aura",
    get badge() { return t('items.aura.badge'); },
    get description() { return t('items.aura.description'); },
    maxLevel: 5,
    evolutionId: 'evolved_aura'
  },

  // ==========================================
  // PASSIVAS UNIVERSAIS
  // ==========================================
  DMG: {
    id: 'dmg',
    category: ITEM_CATEGORIES.PASSIVE,
    get name() { return t('items.dmg.name'); },
    icon: "damage",
    get badge() { return t('items.dmg.badge'); },
    get description() { return t('items.dmg.description'); },
    maxLevel: Infinity
  },
  ARMOR: {
    id: 'armor',
    category: ITEM_CATEGORIES.PASSIVE,
    get name() { return t('items.armor.name'); },
    icon: "armor",
    get badge() { return t('items.armor.badge'); },
    get description() { return t('items.armor.description'); },
    maxLevel: Infinity
  },
  WINGS: {
    id: 'wings',
    category: ITEM_CATEGORIES.PASSIVE,
    get name() { return t('items.wings.name'); },
    icon: "wings",
    get badge() { return t('items.wings.badge'); },
    get description() { return t('items.wings.description'); },
    maxLevel: Infinity
  },
  FROST_PASSIVE: {
    id: 'frost_passive',
    category: ITEM_CATEGORIES.PASSIVE,
    get name() { return t('items.frost_passive.name'); },
    icon: "frost",
    get badge() { return t('items.frost_passive.badge'); },
    get description() { return t('items.frost_passive.description'); },
    maxLevel: Infinity
  },
  HASTE: {
    id: 'haste',
    category: ITEM_CATEGORIES.PASSIVE,
    get name() { return t('items.haste.name'); },
    icon: "cooldown",
    get badge() { return t('items.haste.badge'); },
    get description() { return t('items.haste.description'); },
    maxLevel: Infinity
  },
  ULT_COOLDOWN: {
    id: 'ult_cooldown',
    category: ITEM_CATEGORIES.PASSIVE,
    get name() { return t('items.ult_cooldown.name'); },
    icon: "ult_cooldown",
    get badge() { return t('items.ult_cooldown.badge'); },
    get description() { return t('items.ult_cooldown.description'); },
    maxLevel: Infinity
  },
  CRIT: {
    id: 'crit',
    category: ITEM_CATEGORIES.PASSIVE,
    get name() { return t('items.crit.name'); },
    icon: "crit",
    get badge() { return t('items.crit.badge'); },
    get description() { return t('items.crit.description'); },
    maxLevel: Infinity
  },
  MAGNET: {
    id: 'magnet',
    category: ITEM_CATEGORIES.PASSIVE,
    get name() { return t('items.magnet.name'); },
    icon: "magnet",
    get badge() { return t('items.magnet.badge'); },
    get description() { return t('items.magnet.description'); },
    maxLevel: Infinity
  },

  // ==========================================
  // UTILITÁRIOS
  // ==========================================
  HEAL: {
    id: 'heal',
    category: ITEM_CATEGORIES.UTILITY,
    get name() { return t('items.heal.name'); },
    icon: "heal",
    get badge() { return t('items.heal.badge'); },
    get description() { return t('items.heal.description'); },
    maxLevel: Infinity
  }
};

/**
 * Matriz Única de Sinergias e Fusões Lendárias (Single Source of Truth).
 */
export const SYNERGIES = [
  {
    id: 'evolved_sword',
    get name() { return t('evolutions.evolved_sword.name'); },
    get fullName() { return t('evolutions.evolved_sword.fullName'); },
    get desc() { return t('evolutions.evolved_sword.description'); },
    get reqText() { return t('evolutions.evolved_sword.reqText'); },
    weaponId: 'SWORD',
    weaponUpgradeIds: ['sword_extra', 'sword_speed'],
    passiveId: 'wings',
    isReady: (player) => {
      const sword = player.weapons.find(w => w.type === 'SWORD');
      return !!(!player.evolvedSword && sword && sword.count >= 4 && player.hasWingsPassive);
    },
    isEvolved: (player) => !!player.evolvedSword,
    apply: (player) => {
      player.evolvedSword = true;
    }
  },
  {
    id: 'evolved_axe',
    get name() { return t('evolutions.evolved_axe.name'); },
    get fullName() { return t('evolutions.evolved_axe.fullName'); },
    get desc() { return t('evolutions.evolved_axe.description'); },
    get reqText() { return t('evolutions.evolved_axe.reqText'); },
    weaponId: 'AXE',
    weaponUpgradeIds: ['axe_extra', 'axe_speed', 'axe_radius'],
    passiveId: 'dmg',
    isReady: (player) => {
      return !!(!player.evolvedAxe && (player.axeCount || 1) >= 3 && player.hasPowerPassive);
    },
    isEvolved: (player) => !!player.evolvedAxe,
    apply: (player) => {
      player.evolvedAxe = true;
      player.axeCount = AXE_EVOLVED_COUNT;
      player.axeSpinSpeed = (player.axeSpinSpeed || 0.085) + 0.01;
    }
  },
  {
    id: 'evolved_potion',
    get name() { return t('evolutions.evolved_potion.name'); },
    get fullName() { return t('evolutions.evolved_potion.fullName'); },
    get desc() { return t('evolutions.evolved_potion.description'); },
    get reqText() { return t('evolutions.evolved_potion.reqText'); },
    weaponId: 'POTION',
    weaponUpgradeIds: ['potion_volley', 'potion_potency'],
    passiveId: 'frost_passive',
    isReady: (player) => {
      const potion = player.weapons.find(w => w.type === 'POTION');
      return !!(!player.evolvedPotion && potion && potion.count >= 3 && (player.slowChance || 0) >= 0.15);
    },
    isEvolved: (player) => !!player.evolvedPotion,
    apply: (player) => {
      player.evolvedPotion = true;
      const potion = player.weapons.find(w => w.type === 'POTION');
      if (potion) potion.count = 5;
    }
  },
  {
    id: 'evolved_staff',
    get name() { return t('evolutions.evolved_staff.name'); },
    get fullName() { return t('evolutions.evolved_staff.fullName'); },
    get desc() { return t('evolutions.evolved_staff.description'); },
    get reqText() { return t('evolutions.evolved_staff.reqText'); },
    weaponId: 'STAFF',
    weaponUpgradeIds: ['staff_projectiles', 'staff_pierce'],
    passiveId: 'dmg',
    isReady: (player) => {
      const staff = player.weapons.find(w => w.type === 'STAFF');
      return !!(!player.evolvedStaff && staff && staff.count >= 3 && player.hasPowerPassive);
    },
    isEvolved: (player) => !!player.evolvedStaff,
    apply: (player) => {
      player.evolvedStaff = true;
      const staff = player.weapons.find(w => w.type === 'STAFF');
      if (staff) staff.count = 4;
    }
  },
  {
    id: 'evolved_hammer',
    get name() { return t('evolutions.evolved_hammer.name'); },
    get fullName() { return t('evolutions.evolved_hammer.fullName'); },
    get desc() { return t('evolutions.evolved_hammer.description'); },
    get reqText() { return t('evolutions.evolved_hammer.reqText'); },
    weaponId: 'HAMMER',
    weaponUpgradeIds: ['hammer_crush', 'hammer_impact'],
    passiveId: 'armor',
    isReady: (player) => {
      const hammer = player.weapons.find(w => w.type === 'HAMMER');
      return !!(!player.evolvedHammer && hammer && hammer.count >= 3 && player.hasArmorPassive);
    },
    isEvolved: (player) => !!player.evolvedHammer,
    apply: (player) => {
      player.evolvedHammer = true;
      const hammer = player.weapons.find(w => w.type === 'HAMMER');
      if (hammer) hammer.count = 4;
    }
  },
  {
    id: 'evolved_aura',
    get name() { return t('evolutions.evolved_aura.name'); },
    get fullName() { return t('evolutions.evolved_aura.fullName'); },
    get desc() { return t('evolutions.evolved_aura.description'); },
    get reqText() { return t('evolutions.evolved_aura.reqText'); },
    weaponId: 'AURA',
    weaponUpgradeIds: ['aura'],
    passiveId: 'armor',
    isReady: (player) => {
      return !!(!player.evolvedAura && player.auraLvl >= 5 && player.hasArmorPassive);
    },
    isEvolved: (player) => !!player.evolvedAura,
    apply: (player) => {
      player.evolvedAura = true;
    }
  },
  {
    id: 'evolved_orbitals',
    get name() { return t('evolutions.evolved_orbitals.name'); },
    get fullName() { return t('evolutions.evolved_orbitals.fullName'); },
    get desc() { return t('evolutions.evolved_orbitals.description'); },
    get reqText() { return t('evolutions.evolved_orbitals.reqText'); },
    weaponId: 'ORBITALS',
    weaponUpgradeIds: ['orbitals'],
    passiveId: 'wings',
    isReady: (player) => {
      return !!(!player.evolvedOrbitals && player.orbitals >= 3 && player.hasWingsPassive);
    },
    isEvolved: (player) => !!player.evolvedOrbitals,
    apply: (player) => {
      player.evolvedOrbitals = true;
      player.orbitals = 3;
    }
  }
];

/**
 * Retorna as sinergias prontas para fusão no momento para o jogador.
 */
export function getAvailableSynergies(player) {
  const readyList = [];
  for (const syn of SYNERGIES) {
    if (syn.isReady(player)) {
      readyList.push({
        id: syn.id,
        get name() { return syn.fullName; },
        get desc() { return syn.desc; },
        apply: () => syn.apply(player)
      });
    }
  }
  return readyList;
}

/**
 * Verifica se um id de upgrade de carta é ingrediente de fusão para o inventário atual do jogador.
 */
export function checkIsSynergyIngredient(upgradeId, player) {
  if (!player) return false;

  for (const syn of SYNERGIES) {
    if (syn.isEvolved(player)) continue;

    // Se o upgrade for a passiva da sinergia e o jogador possui a arma correspondente
    if (syn.passiveId === upgradeId) {
      const hasWeapon = (syn.weaponId === 'AXE' && (player.axeCount > 0 || player.weapons.some(w => w.type === 'AXE'))) ||
                        (syn.weaponId === 'ORBITALS' && player.orbitals > 0) ||
                        (syn.weaponId === 'AURA' && player.auraLvl > 0) ||
                        player.weapons.some(w => w.type === syn.weaponId);
      if (hasWeapon) return true;
    }

    // Se o upgrade for um aprimoramento da arma e o jogador já pegou a passiva necessária
    if (syn.weaponUpgradeIds && syn.weaponUpgradeIds.includes(upgradeId)) {
      const hasPassive = (syn.passiveId === 'wings' && player.hasWingsPassive) ||
                         (syn.passiveId === 'dmg' && player.hasPowerPassive) ||
                         (syn.passiveId === 'armor' && player.hasArmorPassive) ||
                         (syn.passiveId === 'frost_passive' && (player.slowChance || 0) >= 0.15);
      if (hasPassive) return true;
    }
  }

  return false;
}

/**
 * Retorna os dados completos para alimentar o Rastreador de Sinergias do Grimório Tático.
 */
export function getSynergyTrackerList(player) {
  return SYNERGIES.map(syn => ({
    id: syn.id,
    get name() { return syn.name; },
    get req() { return syn.reqText; },
    isReady: syn.isReady(player),
    isEvolved: syn.isEvolved(player)
  }));
}
