import { AXE_MAX_COUNT } from './axes.js';

// Shared by the simulation and card previews. No UI or storage side effects.
export function applyUpgradeEffect(id, state) {
  switch (id) {
    case 'axe_speed': {
      state.axeSpeedCount = (state.axeSpeedCount || 0) + 1;
      state.axeSpinSpeed = (state.axeSpinSpeed || 0.085) + 0.005;
      state.axeDamageMult = (state.axeDamageMult || 1) + 0.04;
      break;
    }
    case 'axe_extra': {
      if (state.evolvedAxe || (state.axeCount || 0) <= 0) return;
      state.axeCount = Math.min(AXE_MAX_COUNT, (state.axeCount || 1) + 1);
      break;
    }
    case 'axe_radius': {
      state.axeRadiusCount = (state.axeRadiusCount || 0) + 1;
      if ((state.axeRadius || 56) < 120) {
        state.axeRadius = Math.min(120, (state.axeRadius || 56) + 6);
      }
      state.axeDamageMult = (state.axeDamageMult || 1) + 0.10;
      break;
    }
    case 'potion_volley': {
      const w = state.weapons.find(wp => wp.type === 'POTION');
      if (w) {
        w.count = Math.min(4, (w.count || 1) + 1);
        state.projectiles = w.count;
      }
      break;
    }
    case 'potion_potency': {
      const w = state.weapons.find(wp => wp.type === 'POTION');
      if (w) {
        w.damageMult += 0.05;
        w.potencyCount = (w.potencyCount || 0) + 1;
      }
      break;
    }
    case 'staff_projectiles': {
      const w = state.weapons.find(wp => wp.type === 'STAFF');
      if (w) {
        w.count = Math.min(5, (w.count || 1) + 1);
      }
      break;
    }
    case 'staff_pierce': {
      state.staffPierceBonus = Math.min(3, (state.staffPierceBonus || 0) + 1);
      const w = state.weapons.find(wp => wp.type === 'STAFF');
      if (w) w.damageMult += 0.08;
      break;
    }
    case 'sword_extra': {
      const w = state.weapons.find(wp => wp.type === 'SWORD');
      if (w) {
        w.count = Math.min(5, (w.count || 1) + 1);
        state.projectiles = w.count;
      }
      break;
    }
    case 'sword_speed': {
      const w = state.weapons.find(wp => wp.type === 'SWORD');
      if (w) {
        w.damageMult += 0.08;
        w.swordSpeedCount = (w.swordSpeedCount || 0) + 1;
        w.flightSpeedBonus = (w.flightSpeedBonus || 1.0) + 0.06;
      }
      break;
    }
    case 'hammer_crush': {
      const w = state.weapons.find(wp => wp.type === 'HAMMER');
      if (w) {
        w.count = Math.min(4, (w.count || 1) + 1);
        w.damageMult += 0.30;
      }
      break;
    }
    case 'hammer_impact': {
      const w = state.weapons.find(wp => wp.type === 'HAMMER');
      if (w) {
        w.damageMult += 0.12;
        w.impactCount = (w.impactCount || 0) + 1;
      }
      break;
    }
    case 'frost_passive': {
      state.frostCardCount = (state.frostCardCount || 0) + 1;
      state.slowChance = Math.min(0.75, (state.slowChance || 0) + 0.06);
      state.slowDurationBonus = (state.slowDurationBonus || 0) + 0.25;
      break;
    }
    case 'dmg': {
      state.damagePercentBonus = (state.damagePercentBonus || 0) + 0.05;
      state.damageCardCount = (state.damageCardCount || 0) + 1;
      state.hasPowerPassive = true;
      break;
    }
    case 'haste': {
      state.hasteCardCount = (state.hasteCardCount || 0) + 1;
      if (hasteImprovesCooldown(state)) {
        state.cooldownReduction = Math.min(0.55, (state.cooldownReduction || 0) + 0.05);
        state.attackCooldown = reducedCooldown(state.attackCooldown, 0.95, 10);
        state.weapons.forEach(w => {
          w.cooldown = reducedCooldown(w.cooldown, 0.95, 10);
        });
      } else {
        state.weapons.forEach(w => {
          w.damageMult += 0.06;
        });
      }
      break;
    }
    case 'ult_cooldown': {
      state.ultCooldownCount = (state.ultCooldownCount || 0) + 1;
      state.skillMaxCd = Math.max(60, Math.round(state.skillMaxCd * 0.95));
      state.skillCd = Math.min(state.skillCd, state.skillMaxCd);
      break;
    }
    case 'wings': {
      state.wingsCardCount = (state.wingsCardCount || 0) + 1;
      state.baseSpeed += 0.18;
      state.speed = state.invisTimer > 0 ? state.baseSpeed * 2 : state.baseSpeed;
      state.hasWingsPassive = true;
      break;
    }
    case 'crit': {
      state.critCardCount = (state.critCardCount || 0) + 1;
      state.critChance = Math.max(state.critChance, Math.min(0.85, state.critChance + 0.04));
      state.critMult += 0.10;
      break;
    }
    case 'magnet': {
      state.magnetCardCount = (state.magnetCardCount || 0) + 1;
      state.magnet += 30;
      break;
    }
    case 'aura': {
      state.auraLvl = Math.min(5, (state.auraLvl || 0) + 1);
      break;
    }
    case 'orbitals': {
      state.orbitals = Math.min(3, (state.orbitals || 0) + 1);
      break;
    }
    case 'armor': {
      state.armorCardCount = (state.armorCardCount || 0) + 1;
      state.maxHp += 30;
      state.hp += 30;
      state.hasArmorPassive = true;
      break;
    }
    case 'heal': {state.hp = Math.min(state.maxHp, state.hp + state.maxHp * 0.65 * (state.healingMultiplier !== undefined ? state.healingMultiplier : 1.0));
      break;
    }
    case 'destiny_berserker': {
      state.damagePercentBonus = (state.damagePercentBonus || 0) + 0.65;
      state.maxHp = Math.min(state.maxHp, Math.max(35, Math.round(state.maxHp * 0.50)));
      state.hp = Math.min(state.hp, state.maxHp);
      state.destinyPacts = state.destinyPacts || [];
      state.destinyPacts.push({ id: 'destiny_berserker' });
      break;
    }
    case 'destiny_titan': {
      state.maxHp += 195;
      state.hp += 195;
      state.baseSpeed = Math.min(state.baseSpeed, Math.max(1.2, state.baseSpeed * 0.70));
      state.speed = state.invisTimer > 0 ? state.baseSpeed * 2 : state.baseSpeed;
      state.destinyPacts = state.destinyPacts || [];
      state.destinyPacts.push({ id: 'destiny_titan' });
      break;
    }
    case 'destiny_arcane_frenzy': {
      state.cooldownReduction = Math.min(0.65, (state.cooldownReduction || 0) + 0.15);
      state.attackCooldown = reducedCooldown(state.attackCooldown, 0.70, 8);
      state.weapons.forEach(w => { w.cooldown = reducedCooldown(w.cooldown, 0.70, 8); });
      state.iFramesDurationMult = (state.iFramesDurationMult || 1.0) * 0.5;
      state.damageTakenMultiplier = (state.damageTakenMultiplier || 1.0) * 1.25;
      state.destinyPacts = state.destinyPacts || [];
      state.destinyPacts.push({ id: 'destiny_arcane_frenzy' });
      break;
    }
    case 'destiny_midas': {
      state.goldMultiplier = (state.goldMultiplier || 1.0) * 2.0;
      state.magnet += 150;
      state.damageTakenMultiplier = (state.damageTakenMultiplier || 1.0) * 1.30;
      state.destinyPacts = state.destinyPacts || [];
      state.destinyPacts.push({ id: 'destiny_midas' });
      break;
    }
    case 'destiny_executioner': {
      state.critChance = Math.min(0.95, (state.critChance ?? 0.15) + 0.35);
      state.critMult = (state.critMult || 1.5) + 0.70;
      state.nonCritDamageMult = (state.nonCritDamageMult || 1.0) * 0.60;
      state.destinyPacts = state.destinyPacts || [];
      state.destinyPacts.push({ id: 'destiny_executioner' });
      break;
    }
    case 'destiny_spectral': {
      state.baseSpeed = state.baseSpeed * 1.35;
      state.speed = state.invisTimer > 0 ? state.baseSpeed * 2 : state.baseSpeed;
      state.healingMultiplier = (state.healingMultiplier || 1.0) * 0.40;
      state.destinyPacts = state.destinyPacts || [];
      state.destinyPacts.push({ id: 'destiny_spectral' });
      break;
    }
    case 'destiny_temporal_rift': {
      state.skillMaxCd = Math.min(state.skillMaxCd, Math.max(120, Math.round(state.skillMaxCd * 0.60)));
      state.skillCd = Math.min(state.skillCd, state.skillMaxCd);
      state.damagePercentBonus = (state.damagePercentBonus || 0) - 0.25;
      state.destinyPacts = state.destinyPacts || [];
      state.destinyPacts.push({ id: 'destiny_temporal_rift' });
      break;
    }
    case 'blessing': {
      state.hp = Math.min(state.maxHp, state.hp + state.maxHp * 0.35);
      break;
    }
    default: throw new Error('Unknown upgrade: ' + id);
  }
  if (['dmg', 'destiny_berserker', 'destiny_temporal_rift'].includes(id)) {
    state.damage = effectiveDamage(state);
  }
}

export function effectiveDamage(state) {
  return Math.round((state.baseDamage ?? 0) * (state.damageMetaMult ?? 1) * (1 + (state.damagePercentBonus ?? 0)));
}

export function previewUpgrade(id, state) {
  const next = { ...state, weapons: (state.weapons || []).map(w => ({ ...w })), destinyPacts: [...(state.destinyPacts || [])] };
  applyUpgradeEffect(id, next);
  return next;
}

export function reducedCooldown(current, factor, floor) {
  return Math.min(current, Math.max(floor, Math.floor(current * factor)));
}

export function hasteImprovesCooldown(state) {
  return (state.cooldownReduction || 0) < 0.55
    && state.weapons.some(w => reducedCooldown(w.cooldown, 0.95, 10) < w.cooldown);
}

export function potionRadius(weapon, evolved = false) {
  return 42 * (1 + (weapon.potencyCount || 0) * 0.05) * (evolved ? 1.45 : 1);
}

export function swordFlightSpeed(weapon, evolved = false) {
  return (evolved ? 12 : 9.2) * (weapon.flightSpeedBonus ?? 1);
}
