/**
 * src/entities/player/player.js
 * Entidade Jogador: Atributos, Física, Estados Especiais e Ciclo de Vida.
 * Desacoplado de I/O de DOM e persistência.
 */
import { CHARACTERS } from '../../config/characters.js';
import { playSfx, triggerHaptic } from '../../core/audio.js';
import { inputX, inputY } from '../../core/input.js';
import { createHitParticles } from '../../systems/combat.js';
import { bullets } from '../../state/collections.js';
import { gameState, triggerShake } from '../../state/gameState.js';
import { getMetaBonuses } from '../../systems/progression.js';

import { setInventoryPlayer, registerWeaponInInventory, registerPassiveInInventory } from './inventory.js';

// Reexportações de Armas e Inventário
export * from './inventory.js';
export * from './weapons.js';

export let selectedHeroKey = 'KNIGHT';

export function setSelectedHeroKey(key) {
  selectedHeroKey = key;
}

export const player = {
  x: 0,
  y: 0,
  radius: 14,
  facing: 1,
  speed: 3.2,
  baseSpeed: 3.2,
  hp: 120,
  maxHp: 120,
  hpRegen: 0,
  regenTimer: 0,
  damage: 25,
  damagePercentBonus: 0,
  level: 1,
  xp: 0,
  nextXp: 20,
  cooldownReduction: 0,
  critChance: 0.10,
  critMult: 1.5,
  nonCritDamageMult: 1.0,
  magnet: 65,
  weapons: [],
  passives: [],
  iFrames: 0,
  bossIFrames: 0,
  dashDuration: 0,
  dashVx: 0,
  dashVy: 0,
  skillCd: 0,
  skillMaxCd: 420,
  pushVx: 0,
  pushVy: 0,
  mass: 2.5,
  ignisDashDuration: 0,
  ignisDashVx: 0,
  ignisDashVy: 0,
  axeCount: 0,
  axeAngle: 0,
  axeRadius: 56,
  axeDamageMult: 1.0,
  evolvedAxe: false,
  axeHitCount: 0,
  auraLvl: 0,
  auraTimer: 0,
  auraTickFlash: 0,
  evolvedAura: false,
  orbitals: 0,
  orbitalAngle: 0,
  orbitalRadius: 65,
  orbitalDamageMult: 1.0,
  evolvedOrbitals: false,
  potionThrowTimer: 0,
  isThrowingPotion: false,
  evolvedPotion: false,
  alchemistSkillTimer: 0,
  alchemistBuffTimer: 0,
  alchemistSkillDisoriented: false,
  isMoving: false,
  walkCycle: 0,
  tFrame: 0,
  vx: 0,
  vy: 0,
  berserkTimer: 0,
  invisTimer: 0,
  isPhasing: false,

  // Inventário Estruturado (ItemRegistry)
  inventory: {
    weapons: new Map(),
    passives: new Map()
  }
};

setInventoryPlayer(player);

/**
 * Avalia se o herói está em um estado de ação ininterruptível.
 */
export function isHeroInUninterruptibleState() {
  if (!player) return false;
  if ((player.dashDuration && player.dashDuration > 0) || 
      (player.ignisDashDuration && player.ignisDashDuration > 0)) {
    return true;
  }
  if (player.alchemistSkillTimer && player.alchemistSkillTimer > 0) {
    return true;
  }
  if (player.isChannelingAltar) {
    return true;
  }
  return false;
}

export function triggerHeroSkill() {
  if (player.skillCd > 0 || !gameState.isInMatch || gameState.isPaused || gameState.isDead || gameState.isWon) return;

  if (selectedHeroKey === 'KNIGHT') {
    player.dashDuration = 24;
    player.iFrames = 50;
    player.bossIFrames = 50;
    const inputLen = Math.hypot(inputX, inputY);
    const moveAng = inputLen > 0.05 
      ? Math.atan2(inputY, inputX) 
      : (player.facing === -1 ? Math.PI : 0);

    player.dashVx = Math.cos(moveAng) * 16;
    player.dashVy = Math.sin(moveAng) * 16;
    if (Math.abs(player.dashVx) > 0.1) {
      player.facing = player.dashVx >= 0 ? 1 : -1;
    }
    playSfx('holy_charge');
    triggerShake(9);
    triggerHaptic('heavy');
  } else if (selectedHeroKey === 'MAGE') {
    player.ignisDashDuration = 22;
    player.iFrames = 30;
    player.bossIFrames = 30;
    const inputLen = Math.hypot(inputX, inputY);
    const moveAng = inputLen > 0.05 
      ? Math.atan2(inputY, inputX) 
      : (player.facing === -1 ? Math.PI : 0);

    player.ignisDashVx = Math.cos(moveAng) * 15.5;
    player.ignisDashVy = Math.sin(moveAng) * 15.5;
    if (Math.abs(player.ignisDashVx) > 0.1) {
      player.facing = player.ignisDashVx >= 0 ? 1 : -1;
    }

    playSfx('flame_dash');
    triggerShake(9);
    triggerHaptic('heavy');
    createHitParticles(player.x, player.y, '#ffffff', 16);
  } else if (selectedHeroKey === 'ROGUE') {
    player.invisTimer = 180;
    player.iFrames = 20;
    player.isPhasing = true;
    playSfx('smoke_bomb');
    triggerHaptic('heavy');
    createHitParticles(player.x, player.y, '#2c3e50', 20);
    createHitParticles(player.x, player.y, '#bdc3c7', 15);
  } else if (selectedHeroKey === 'BARBARIAN') {
    player.berserkTimer = 240;
    player.iFrames = 25;
    playSfx('barbarian_roar');
    triggerShake(12);
    triggerHaptic('heavy');
    createHitParticles(player.x, player.y, '#e74c3c', 24);
  } else if (selectedHeroKey === 'ALCHEMIST') {
    player.alchemistSkillTimer = 300;
    player.alchemistBuffTimer = 300;
    player.alchemistSkillDisoriented = true;
    player.iFrames = 30;

    playSfx('potion_shatter');
    triggerShake(10);
    triggerHaptic('heavy');
    createHitParticles(player.x, player.y, '#a29bfe', 22);

    const flaskCount = 5;
    const gravity = 0.22;
    const flightFrames = 24;

    for (let f = 0; f < flaskCount; f++) {
      const fAng = (f * (Math.PI * 2 / flaskCount)) + (Math.random() * 0.4 - 0.2);
      const targetDist = 110 + Math.random() * 40;
      const targetX = player.x + Math.cos(fAng) * targetDist;
      const targetY = player.y + Math.sin(fAng) * targetDist;
      const dx = targetX - player.x;
      const dy = targetY - player.y;

      bullets.push({
        type: 'POTION',
        x: player.x,
        y: player.y,
        vx: dx / flightFrames,
        vy: (dy / flightFrames) - (0.5 * gravity * flightFrames),
        gravity: gravity,
        targetX: targetX,
        targetY: targetY,
        radius: 8,
        damage: player.damage * 0.70,
        life: flightFrames,
        angle: 0,
        puddleRadius: 48,
        puddleDuration: player.evolvedPotion ? 340 : 280,
        isEvolved: player.evolvedPotion,
        trail: []
      });
    }
  }

  player.skillCd = player.skillMaxCd;
}

export function addXP(amount) {
  playSfx('gem');
  const mult = (player && player.xpMultiplier) ? player.xpMultiplier : 1.0;
  player.xp += Math.round(amount * mult);
  while (player.xp >= player.nextXp) {
    player.xp -= player.nextXp;
    player.level++;
    player.nextXp = 12 + (player.level * 7) + Math.floor(Math.pow(player.level, 1.28));
    window.dispatchEvent(new CustomEvent('player:levelup'));
  }
}

export function resetPlayer(heroKey) {
  selectedHeroKey = heroKey;
  const c = CHARACTERS[selectedHeroKey];
  const meta = getMetaBonuses();

  player.x = 0;
  player.y = 0;
  player.radius = 14;
  player.mass = 2.5;
  player.pushVx = 0;
  player.pushVy = 0;

  player.maxHp = Math.round(c.stats.maxHp * meta.hpMult);
  player.hp = player.maxHp;
  player.armor = meta.armorBonus || 0;
  player.hpRegen = meta.regenBonus || 0;
  player.regenTimer = 0;
  player.level = 1;
  player.xp = 0;
  player.nextXp = 20;
  player.cooldownReduction = meta.cooldownReduction || 0;
  player.executeBonus = meta.executeBonus || 0;
  player.phoenixRevives = meta.phoenixRevives || 0;
  player.goldMultiplier = meta.goldMult || 1.0;
  player.xpMultiplier = meta.xpMult || 1.0;
  player.doubleChestChance = meta.doubleChestChance || 0;

  player.baseSpeed = c.stats.speed * meta.speedMult;
  player.speed = player.baseSpeed;
  player.damage = Math.round(c.stats.damage * meta.damageMult);
  player.baseDamage = c.stats.damage;
  player.damagePercentBonus = 0;
  player.auraLvl = c.stats.auraLvl || 0;
  player.auraTimer = 0;
  player.auraTickFlash = 0;
  player.evolvedAura = false;
  player.orbitals = c.stats.orbitals || 0;
  player.orbitalAngle = 0;
  player.orbitalRadius = 65;
  player.orbitalDamageMult = 1.0;
  player.evolvedOrbitals = false;
  player.axeCount = c.stats.axeCount || 0;
  player.axeAngle = 0;
  player.axeRadius = 56;
  player.axeDamageMult = 1.0;
  player.evolvedAxe = false;
  player.potionThrowTimer = 0;
  player.isThrowingPotion = false;
  player.evolvedPotion = false;
  player.alchemistSkillTimer = 0;
  player.alchemistBuffTimer = 0;
  player.alchemistSkillDisoriented = false;
  player.critChance = c.stats.critChance + meta.critBonus;
  player.critMult = 1.5;
  player.nonCritDamageMult = 1.0;
  player.magnet = c.stats.magnet + meta.magnetBonus;
  player.rerolls = meta.rerolls || 0;
  player.iFrames = 0;
  player.bossIFrames = 0;
  player.facing = 1;
  player.isMoving = false;
  player.walkCycle = 0;
  player.tFrame = 0;
  player.dashDuration = 0;
  player.dashVx = 0;
  player.dashVy = 0;
  player.skillMaxCd = Math.round(c.stats.skillCooldownMax * (1 - player.cooldownReduction));
  player.skillCd = 0;
  player.knockbackReceived = c.stats.knockbackReceived !== undefined ? c.stats.knockbackReceived : 1.0;
  player.knockbackDealt = c.stats.knockbackDealt !== undefined ? c.stats.knockbackDealt : 1.0;

  player.weapons = [];
  player.passives = [];
  player.inventory = {
    weapons: new Map(),
    passives: new Map()
  };
  setInventoryPlayer(player);

  if (c.startingWeapon === 'HAMMER') {
    registerWeaponInInventory(player, 'HAMMER', 1, { cooldown: 48, damageMult: 1.0 });
    player.weapons.push({
      type: 'HAMMER',
      cooldown: 48,
      timer: 48,
      damageMult: 1.0,
      count: 1
    });
  } else if (c.startingWeapon === 'SWORD') {
    registerWeaponInInventory(player, 'SWORD', 1, { cooldown: 26, damageMult: 1.0 });
    player.weapons.push({
      type: 'SWORD',
      cooldown: 26,
      timer: 26,
      damageMult: 1.0,
      count: 1
    });
  } else if (c.startingWeapon === 'STAFF') {
    registerWeaponInInventory(player, 'STAFF', 1, { cooldown: 32, damageMult: 1.0 });
    player.weapons.push({
      type: 'STAFF',
      cooldown: 32,
      timer: 32,
      damageMult: 1.0,
      count: 1
    });
  } else if (c.startingWeapon === 'AXE') {
    registerWeaponInInventory(player, 'AXE', 1, { damageMult: 1.0 });
    player.axeCount = 1;
    player.axeDamageMult = 1.0;
  } else if (c.startingWeapon === 'POTION') {
    registerWeaponInInventory(player, 'POTION', 1, { cooldown: 65, damageMult: 1.0 });
    player.weapons.push({
      type: 'POTION',
      cooldown: 65,
      timer: 65,
      damageMult: 1.0,
      count: 1
    });
  }

  window.dispatchEvent(new CustomEvent('player:reset', { detail: { heroKey } }));
}
