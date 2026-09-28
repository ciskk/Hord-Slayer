import { t, formatNumber, formatDate } from './index.js';
import { ITEMS, SYNERGIES } from '../config/items.js';
import { escapeHtml } from './dom.js';
import { formatUpgradeEffect } from './upgradePresentation.js';

// Inventory and old records use both uppercase keys and lowercase item IDs.
export function getItemDefinition(id) {
  return ITEMS[id] || Object.values(ITEMS).find(item => item.id === id);
}

export function getSavedWeaponName(weapon) {
  const item = getItemDefinition(weapon.type || weapon.id);
  const evolution = weapon.evolved && SYNERGIES.find(entry => entry.id === item?.evolutionId);
  return evolution?.name || item?.name || weapon.name || weapon.type || weapon.id || '';
}

// Only this adapter understands historical Portuguese labels. New presentation
// and icon selection use IDs. Unknown old entries are retained, never discarded.
const LEGACY_PASSIVES = Object.freeze({
  'Poder Bruto': 'dmg', 'Armadura Rúnica': 'armor', 'Asas do Vento': 'wings',
  'Golpe Criogênico': 'frost_passive', 'Foco Letal': 'crit', 'Fúria Rápida': 'haste',
  'Ímpeto Supremo': 'ult_cooldown', 'Ímã Titânico': 'magnet',
  'Bíblias Protetoras': 'orbitals', 'Aura Sagrada': 'aura'
});

export function normalizeSavedPassive(entry) {
  if (entry && typeof entry === 'object') return { ...entry };
  if (typeof entry !== 'string') return null;
  const match = entry.trim().match(/^(.*?)(?:\s*\((.*?)\))?$/);
  const id = LEGACY_PASSIVES[match[1]];
  if (!id) return { legacyText: entry };
  const value = match[2]?.match(/^([+-]?[\d.,]+)\s*(%|HP|Vel)?$/);
  return {
    id,
    ...(value ? { value: Number(value[1].replace(',', '.')), unit: { '%': 'percent', HP: 'health', Vel: 'speed' }[value[2]] || 'number', signed: value[1].startsWith('+') } : {}),
    ...(!value && match[2] ? { legacyValue: match[2] } : {})
  };
}

export function getSavedPassivePresentation(entry) {
  const saved = normalizeSavedPassive(entry);
  if (!saved) return null;
  const item = getItemDefinition(saved.id);
  let value = saved.legacyValue || '';
  if (Number.isFinite(saved.value)) {
    value = t(`content.savedValue.${saved.unit || 'number'}`, {
      value: `${saved.signed && saved.value >= 0 ? '+' : ''}${formatNumber(saved.value)}`
    });
  }
  return { id: saved.id, name: item?.name || saved.legacyText || saved.id || '', value, icon: item?.icon || 'sparkle' };
}

export function getPactPresentation(pact) {
  if (!pact?.id?.startsWith('destiny_')) return pact;
  return {
    ...pact,
    title: t(`upgrades.${pact.id}.title`),
    bonus: pact.effects?.filter(e => e.kind === 'bonus').map(formatUpgradeEffect).join('; ') || t(`upgrades.${pact.id}.bonusText`),
    penalty: pact.effects?.filter(e => e.kind === 'penalty').map(formatUpgradeEffect).join('; ') || t(`upgrades.${pact.id}.penaltyText`)
  };
}

export function getBestRunPresentation(record) {
  if (!record) return null;
  const names = { KNIGHT: 'Sir Roland', MAGE: 'Ignis', ROGUE: 'Kael', BARBARIAN: 'Kragdor', ALCHEMIST: 'Valéria' };
  const heroKey = record.heroKey || 'KNIGHT';
  const seconds = Math.max(0, Number(record.seconds) || 0);
  return {
    ...record,
    heroKey,
    heroName: names[heroKey] || record.heroName || heroKey,
    heroTitle: names[heroKey] ? t(`heroes.${heroKey}.title`) : (record.heroTitle || ''),
    date: record.timestamp ? formatDate(record.timestamp) : (record.date || ''),
    time: record.time || record.timeStr || `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`,
    waveText: t('wave.title', { number: record.highestWave || record.wave || 1 }),
    souls: record.souls || 0,
    verdictTitle: t(record.isVictory ? 'content.record.victory' : 'content.record.defeat'),
    verdictSub: t(record.isVictory ? 'contentUI.victoryQuote' : 'contentUI.defeatQuote')
  };
}

// Escape data only at the HTML boundary; mechanics and saved values stay raw.
export const savedWeaponHtml = weapon => escapeHtml(getSavedWeaponName(weapon));
