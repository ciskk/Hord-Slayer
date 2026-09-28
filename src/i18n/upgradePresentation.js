import { t, formatNumber } from './index.js';
import { previewUpgrade, potionRadius, swordFlightSpeed } from '../config/upgradeEffects.js';

const number = value => formatNumber(value, { maximumFractionDigits: 2 });
const weapon = (state, type) => state.weapons?.find(w => w.type === type);
const unitValue = (value, unit) => `${number(value)}${unit === 'seconds' ? ' s' : unit === 'percent' ? '%' : unit === 'multiplier' ? '×' : ''}`;

export function formatUpgradeEffect(effect) {
  const { key, before, after, unit = '', mode = 'change' } = effect;
  const amount = mode === 'relative' ? (after / before - 1) * 100 : after;
  const value = mode === 'change'
    ? `${unitValue(before, unit)} → ${unitValue(after, unit)}`
    : `${amount >= 0 ? '+' : '−'}${number(Math.abs(amount))}${mode === 'relative' ? '%' : ''}`;
  return `${effect.weaponType ? `${t(`items.${effect.weaponType}.badge`)} — ` : ''}${t(`cards.effect.${key}`)}: ${value}`;
}

/** A preview runs the same effect as selection, on an isolated copy of the state. */
export function getUpgradePresentation(id, state) {
  const next = previewUpgrade(id, state);
  const effects = [];
  const change = (key, before, after, unit = '', kind = 'bonus') => {
    if (!Number.isFinite(before) || !Number.isFinite(after)) return;
    effects.push({ kind, key, before, after, unit });
  };
  const relative = (key, before, after, kind = 'bonus') => {
    if (!(before > 0)) return;
    effects.push({ kind, key, before, after, mode: 'relative' });
  };
  const damage = type => relative('weaponDamage', weapon(state, type)?.damageMult ?? 1, weapon(next, type)?.damageMult ?? 1);
  const counts = (key, before, after, max) => {
    change(key, before, after);
    return t('cards.limit', { value: number(max) });
  };
  const cooldowns = () => {
    for (const w of state.weapons || []) {
      change('weaponCooldown', w.cooldown / 60, weapon(next, w.type).cooldown / 60, 'seconds');
      // Normally a hero has one primary weapon. Name each when more are present.
      if (state.weapons.length > 1 && effects.length) effects.at(-1).weaponType = w.type;
    }
  };
  let progress = '';
  switch (id) {
    case 'axe_speed':
      relative('rotation', state.axeSpinSpeed || 0.085, next.axeSpinSpeed);
      relative('weaponDamage', state.axeDamageMult || 1, next.axeDamageMult); break;
    case 'axe_extra': progress = counts('axes', state.axeCount || 0, next.axeCount, 3); break;
    case 'axe_radius':
      change('radius', state.axeRadius || 56, next.axeRadius || 56);
      relative('weaponDamage', state.axeDamageMult || 1, next.axeDamageMult);
      progress = t('cards.limit', { value: number(120) }); break;
    case 'potion_volley': progress = counts('flasks', weapon(state, 'POTION')?.count || 1, weapon(next, 'POTION')?.count || 1, 4); break;
    case 'potion_potency':
      damage('POTION');
      change('poolRadius', potionRadius(weapon(state, 'POTION') || {}), potionRadius(weapon(next, 'POTION') || {})); break;
    case 'staff_projectiles': progress = counts('spheres', weapon(state, 'STAFF')?.count || 1, weapon(next, 'STAFF')?.count || 1, 5); break;
    case 'staff_pierce':
      change('pierce', 2 + (state.staffPierceBonus || 0), 2 + next.staffPierceBonus);
      damage('STAFF'); progress = t('cards.limit', { value: number(5) }); break;
    case 'sword_extra': progress = counts('swords', weapon(state, 'SWORD')?.count || 1, weapon(next, 'SWORD')?.count || 1, 5); break;
    case 'sword_speed':
      relative('flightSpeed', swordFlightSpeed(weapon(state, 'SWORD') || {}), swordFlightSpeed(weapon(next, 'SWORD') || {}));
      damage('SWORD'); break;
    case 'hammer_crush':
      change('reach', 78 + ((weapon(state, 'HAMMER')?.count || 1) - 1) * 12, 78 + ((weapon(next, 'HAMMER')?.count || 1) - 1) * 12);
      damage('HAMMER'); progress = t('cards.level', { current: weapon(state, 'HAMMER')?.count || 1, next: weapon(next, 'HAMMER')?.count || 1, max: 4 }); break;
    case 'hammer_impact': damage('HAMMER'); break;
    case 'frost_passive':
      change('slowChance', (state.slowChance || 0) * 100, next.slowChance * 100, 'percent');
      change('slowDuration', 2.5 + (state.slowDurationBonus || 0), 2.5 + next.slowDurationBonus, 'seconds'); break;
    case 'dmg': change('globalDamage', state.damage, next.damage); break;
    case 'haste':
      if ((state.weapons || []).some(w => weapon(next, w.type).cooldown < w.cooldown)) cooldowns();
      else for (const w of state.weapons || []) damage(w.type);
      break;
    case 'ult_cooldown': change('ultimateCooldown', state.skillMaxCd / 60, next.skillMaxCd / 60, 'seconds'); break;
    case 'wings': relative('movement', state.baseSpeed, next.baseSpeed); break;
    case 'crit':
      change('critChance', state.critChance * 100, next.critChance * 100, 'percent');
      change('critDamage', state.critMult, next.critMult, 'multiplier'); break;
    case 'magnet': change('collection', state.magnet, next.magnet); break;
    case 'aura':
      change('radius', state.auraLvl ? 65 + state.auraLvl * 18 : 0, 65 + next.auraLvl * 18);
      change('pulseDamage', state.damage * 0.45 * (state.auraLvl || 0), state.damage * 0.45 * next.auraLvl);
      progress = t('cards.level', { current: state.auraLvl || 0, next: next.auraLvl, max: 5 }); break;
    case 'orbitals': progress = counts('bibles', state.orbitals || 0, next.orbitals, 3); break;
    case 'armor': case 'destiny_titan':
      change('maxHealth', state.maxHp, next.maxHp);
      change('health', state.hp, next.hp);
      if (id === 'destiny_titan') relative('movement', state.baseSpeed, next.baseSpeed, 'penalty'); break;
    case 'heal': case 'blessing':
      change('health', state.hp, next.hp);
      if (id === 'blessing') effects.push({ kind: 'bonus', key: 'gold', mode: 'amount', after: Math.round(15 * (state.goldMultiplier ?? 1)) });
      break;
    case 'destiny_berserker':
      change('globalDamage', state.damage, next.damage);
      change('maxHealth', state.maxHp, next.maxHp, '', 'penalty'); break;
    case 'destiny_arcane_frenzy':
      cooldowns();
      relative('invulnerability', state.iFramesDurationMult ?? 1, next.iFramesDurationMult, 'penalty');
      relative('damageTaken', state.damageTakenMultiplier ?? 1, next.damageTakenMultiplier, 'penalty'); break;
    case 'destiny_midas':
      change('goldGain', state.goldMultiplier ?? 1, next.goldMultiplier, 'multiplier');
      change('collection', state.magnet, next.magnet);
      relative('damageTaken', state.damageTakenMultiplier ?? 1, next.damageTakenMultiplier, 'penalty'); break;
    case 'destiny_executioner':
      change('critChance', state.critChance * 100, next.critChance * 100, 'percent');
      change('critDamage', state.critMult, next.critMult, 'multiplier');
      relative('nonCritDamage', state.nonCritDamageMult ?? 1, next.nonCritDamageMult, 'penalty'); break;
    case 'destiny_spectral':
      relative('movement', state.baseSpeed, next.baseSpeed);
      relative('itemHealing', state.healingMultiplier ?? 1, next.healingMultiplier, 'penalty'); break;
    case 'destiny_temporal_rift':
      change('ultimateCooldown', state.skillMaxCd / 60, next.skillMaxCd / 60, 'seconds');
      change('globalDamage', state.damage, next.damage, '', 'penalty'); break;
  }
  for (const effect of effects) effect.text = formatUpgradeEffect(effect);
  return { effects, progress, summary: effects.map(e => e.text).join('\n') };
}
