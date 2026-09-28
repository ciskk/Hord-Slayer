import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { applyUpgradeEffect, previewUpgrade } from '../src/config/upgradeEffects.js';
import { getUpgradePresentation } from '../src/i18n/upgradePresentation.js';
import { getPactPresentation } from '../src/i18n/contentPresentation.js';
import { upgradesPool, destinyCardsPool, BLESSING_UPGRADE } from '../src/config/upgrades.js';
import { player, fireWeapons, setSelectedHeroKey } from '../src/entities/player.js';
import { enemies, bullets } from '../src/state/collections.js';
import { rebuildSpatialGrid } from '../src/core/spatialGrid.js';
import { setLanguage } from '../src/i18n/index.js';

function fixture() {
  return {
    x: 0, y: 0, damage: 100, baseDamage: 100, damageMetaMult: 1, damagePercentBonus: 0,
    hp: 80, maxHp: 200, baseSpeed: 3, speed: 3, invisTimer: 0,
    axeCount: 1, axeSpinSpeed: 0.085, axeDamageMult: 1, axeRadius: 56,
    slowChance: 0, slowDurationBonus: 0, critChance: 0.15, critMult: 1.5,
    auraLvl: 0, orbitals: 0, magnet: 65, skillMaxCd: 420, skillCd: 400,
    cooldownReduction: 0, attackCooldown: 48, healingMultiplier: 1, goldMultiplier: 1,
    damageTakenMultiplier: 1, iFramesDurationMult: 1, nonCritDamageMult: 1,
    evolvedAxe: false, evolvedSword: false, evolvedStaff: false, evolvedHammer: false, evolvedPotion: false,
    destinyPacts: [], inventory: { weapons: new Map(), passives: new Map() },
    weapons: ['SWORD','STAFF','POTION','HAMMER'].map(type => ({ type, count: 1, cooldown: 48, timer: 48, damageMult: 1 }))
  };
}

beforeEach(() => { setLanguage('pt-BR'); Object.assign(player, fixture()); setSelectedHeroKey('KNIGHT'); });

test('every card preview is isolated and agrees with the applied numerical outcome', () => {
  for (const card of [...upgradesPool, ...destinyCardsPool, BLESSING_UPGRADE]) {
    const before = fixture();
    const untouched = structuredClone(before);
    const next = previewUpgrade(card.id, before);
    assert.deepEqual(before, untouched, `${card.id}: preview mutated the player`);
    const actual = structuredClone(before);
    applyUpgradeEffect(card.id, actual);
    assert.deepEqual(actual, next, card.id);
    for (const lang of ['pt-BR','en','es','fr']) {
      setLanguage(lang);
      const view = getUpgradePresentation(card.id, before);
      assert.ok(view.effects.length > 0, `${card.id}: empty preview`);
      assert.doesNotMatch(view.summary, /NaN|undefined|cards\.|\{[a-z]+\}/i);
    }
  }
});

test('crit upgrades preserve the higher chance granted by Executioner', () => {
  const s = fixture(); s.critChance = 0.8;
  applyUpgradeEffect('destiny_executioner', s);
  assert.equal(s.critChance, 0.95);
  applyUpgradeEffect('crit', s);
  assert.equal(s.critChance, 0.95);
  assert.ok(Math.abs(s.critMult - 2.3) < 1e-9);
  s.critChance = 0;
  applyUpgradeEffect('destiny_executioner', s);
  assert.equal(s.critChance, 0.35);
});

test('Temporal Rift never increases cooldown and cannot be offered below its floor', () => {
  const card = destinyCardsPool.find(c => c.id === 'destiny_temporal_rift');
  for (const cooldown of [60, 119, 120, 121, 180, 420]) {
    const s = fixture(); s.skillMaxCd = cooldown;
    applyUpgradeEffect(card.id, s);
    assert.ok(s.skillMaxCd <= cooldown);
    player.skillMaxCd = cooldown;
    assert.equal(card.isAvailable(), cooldown > 120);
  }
});

test('Haste respects the lower pact floor and converts to damage without slowing attacks', () => {
  const s = fixture(); s.weapons.forEach(w => { w.cooldown = 8; }); s.attackCooldown = 8;
  applyUpgradeEffect('haste', s);
  assert.equal(s.attackCooldown, 8);
  for (const w of s.weapons) { assert.equal(w.cooldown, 8); assert.equal(w.damageMult, 1.06); }
  s.cooldownReduction = 0.55; s.weapons[0].cooldown = 30;
  applyUpgradeEffect('haste', s);
  assert.equal(s.weapons[0].cooldown, 30);
});

test('previews include partial caps, reduced healing and multiplied gold', () => {
  const s = fixture(); s.axeRadius = 118; s.slowChance = 0.73;
  assert.match(getUpgradePresentation('axe_radius', s).summary, /118 → 120/);
  assert.match(getUpgradePresentation('frost_passive', s).summary, /73% → 75%/);
  s.hp = 0; s.healingMultiplier = 0.4;
  assert.equal(previewUpgrade('heal', s).hp, 52);
  assert.match(getUpgradePresentation('heal', s).summary, /0 → 52/);
  s.hp = 195;
  assert.equal(previewUpgrade('heal', s).hp, 200);
  s.goldMultiplier = 2;
  assert.match(getUpgradePresentation('blessing', s).summary, /Ouro: \+30/);
});

test('global damage upgrades change the damage of actual fired weapons', () => {
  player.damageMetaMult = 1.2; player.damage = 120;
  upgradesPool.find(c => c.id === 'dmg').apply();
  assert.equal(player.damage, 126);
  destinyCardsPool.find(c => c.id === 'destiny_berserker').apply();
  assert.equal(player.damage, 204);
  destinyCardsPool.find(c => c.id === 'destiny_temporal_rift').apply();
  assert.equal(player.damage, 174);
  fireAtEnemy('SWORD');
  assert.equal(bullets[0].damage, 174 * 1.1);
});

function fireAtEnemy(type) {
  player.weapons = player.weapons.filter(w => w.type === type);
  player.weapons[0].timer = 999;
  enemies.length = 0; bullets.length = 0;
  enemies.push({ x: 80, y: 0, hp: 1000, radius: 10, speed: 0 });
  rebuildSpatialGrid(enemies);
  fireWeapons();
  assert.ok(bullets.length);
}

test('sword speed upgrade reaches actual projectile velocity', () => {
  upgradesPool.find(c => c.id === 'sword_speed').apply();
  fireAtEnemy('SWORD');
  assert.ok(Math.abs(Math.hypot(bullets[0].vx, bullets[0].vy) - 9.2 * 1.06) < 1e-9);
});

test('acid pool preview agrees with the radius on the launched flask', () => {
  const expected = getUpgradePresentation('potion_potency', player).effects.find(e => e.key === 'poolRadius').after;
  upgradesPool.find(c => c.id === 'potion_potency').apply();
  fireAtEnemy('POTION');
  assert.equal(bullets[0].puddleRadius, expected);
});

test('pacts retain accepted effects and translate them again in pause', () => {
  const card = destinyCardsPool.find(c => c.id === 'destiny_titan');
  const expected = card.getPresentation();
  card.apply();
  const saved = player.destinyPacts.at(-1);
  assert.equal(saved.effects.length, expected.effects.length);
  assert.match(getPactPresentation(saved).bonus, /Vida máxima: 200 → 395/);
  player.maxHp += 30;
  setLanguage('en');
  const view = getPactPresentation(saved);
  assert.match(view.bonus, /Maximum health: 200 → 395/);
  assert.doesNotMatch(view.bonus, /Vida/);
});
