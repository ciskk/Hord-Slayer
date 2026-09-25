/**
 * src/entities/player/player.js
 * Entidade Jogador: Atributos, Física, Estados Especiais e Ciclo de Vida.
 * Desacoplado de I/O de DOM e persistência.
 */
import { CHARACTERS } from '../../config/characters.js';
import { KRAGDOR_ULT } from '../../config/kragdorUlt.js';
import { KAEL_ULT } from '../../config/kaelUlt.js';
import { beginIgnisStep } from '../../render/ignisUlt.js';
import { beginKaelPhase, clearKaelPhaseEffects } from '../../render/kaelUlt.js';
import { playSfx, triggerHaptic } from '../../core/audio.js';
import { inputX, inputY } from '../../core/input.js';
import { createHitParticles } from '../../systems/combat.js';
import { bullets, enemies, enemyBullets } from '../../state/collections.js';
import { gameState, triggerShake, camera, CAMERA_ZOOM, cinematicCamera, matchIntro } from '../../state/gameState.js';
import { getMetaBonuses } from '../../systems/progression.js';
import { triggerUltBurst } from '../../render/ultButtonRenderer.js';

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
  ultCooldownCount: 0,
  pushVx: 0,
  pushVy: 0,
  mass: 2.5,
  ignisDashDuration: 0,
  ignisFireTrailTimer: 0,
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
  roarOriginX: 0,
  roarOriginY: 0,
  invisTimer: 0,
  isPhasing: false,
  tempShield: 0,
  tempShieldTimer: 0,

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

/**
 * Localiza a direção em radianos com a maior concentração de inimigos ao redor do jogador.
 * Avalia candidatos a cada 11.25° (32 direções) e ângulos diretos para monstros próximos.
 * @param {object} player O herói jogador.
 * @param {Array} enemies Lista global de inimigos.
 * @returns {number|null} Ângulo ótimo em radianos ou null se nenhum inimigo for encontrado.
 */
export function findDensestEnemyDirection(player, enemies) {
  if (!enemies || enemies.length === 0 || !player) return null;

  const px = player.x;
  const py = player.y;

  // Raio primário de visão e engajamento: 850px (cobre tela inteira em 1080p com zoom 1.25)
  const PRIMARY_RANGE = 850;
  const PRIMARY_RANGE_SQ = PRIMARY_RANGE * PRIMARY_RANGE;

  const nearby = [];
  let nearestEnemy = null;
  let nearestDistSq = Infinity;

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e || e.hp <= 0 || e.isTargetable === false || (e.emergeTimer || 0) > 0) continue;
    if (e.isBoss && (e.actionState === 'SPAWN_INTRO' || e.isTargetable === false || e.mistState === 'DASHING')) continue;
    if (e.isBossSubTarget && (!e.active || e.isTargetable === false || (e.parentBoss && (e.parentBoss.actionState === 'SPAWN_INTRO' || e.parentBoss.isTargetable === false)))) continue;

    const dx = e.x - px;
    const dy = e.y - py;
    const dSq = dx * dx + dy * dy;

    if (dSq < nearestDistSq) {
      nearestDistSq = dSq;
      nearestEnemy = e;
    }

    if (dSq <= PRIMARY_RANGE_SQ) {
      const dist = Math.sqrt(dSq);
      nearby.push({
        x: e.x,
        y: e.y,
        dx,
        dy,
        dist: Math.max(dist, 1),
        weight: e.isBoss ? 6.0 : (e.isMiniBoss ? 3.5 : 1.0)
      });
    }
  }

  // Se nenhum inimigo estiver dentro do alcance primário, mira no inimigo mais próximo do mapa
  if (nearby.length === 0) {
    if (nearestEnemy) {
      return Math.atan2(nearestEnemy.y - py, nearestEnemy.x - px);
    }
    return null;
  }

  if (nearby.length === 1) {
    return Math.atan2(nearby[0].dy, nearby[0].dx);
  }

  // Constrói direções candidatas:
  // - 36 direções radiais uniformes (passos de 10 graus)
  const candidateAngles = [];
  const ANGLE_STEPS = 36;
  for (let s = 0; s < ANGLE_STEPS; s++) {
    candidateAngles.push((s * Math.PI * 2) / ANGLE_STEPS - Math.PI);
  }

  // - Ângulos diretos apontando para os alvos (garante precisão máxima)
  const directSampleCount = Math.min(nearby.length, 30);
  for (let i = 0; i < directSampleCount; i++) {
    candidateAngles.push(Math.atan2(nearby[i].dy, nearby[i].dx));
  }

  const dashLen = 380;
  let bestAngle = null;
  let maxScore = -1;

  for (let a = 0; a < candidateAngles.length; a++) {
    const ang = candidateAngles[a];
    const cosA = Math.cos(ang);
    const sinA = Math.sin(ang);

    let score = 0;
    for (let i = 0; i < nearby.length; i++) {
      const n = nearby[i];

      // Projeção escalar ao longo do avanço da investida
      const proj = n.dx * cosA + n.dy * sinA;

      // Inimigos atrás do herói (proj < -20) não são atingidos pela investida frontal
      if (proj < -20) continue;

      // Distância perpendicular em relação à reta da investida
      const perp = Math.abs(-n.dx * sinA + n.dy * cosA);

      // Zona 1: Linha de impacto direto e atropelamento do dash
      if (proj <= dashLen + 40 && perp <= 75) {
        score += n.weight * (3.0 - (perp / 75) * 1.5) * (1.0 - (Math.max(0, proj) / (dashLen + 100)) * 0.3);
      }
      // Zona 2: Flanco próximo / área de choque e dano colateral
      else if (proj <= dashLen + 100 && perp <= 160) {
        score += n.weight * 1.2 * (1.0 - (perp - 75) / 85);
      }
      // Zona 3: Agrupamento à frente na direção do dash (avanço em direção à horda)
      else if (proj > dashLen + 40 && perp <= proj * 0.7) {
        score += n.weight * 0.9 * (1.0 - Math.min(proj - dashLen, 450) / 450) * (1.0 - perp / (proj * 0.7));
      }

      // Bônus direcional no cone frontal (ângulo < 60° do dash)
      const dot = proj / n.dist;
      if (dot > 0.5) {
        score += n.weight * 0.4 * dot * (1.0 / (1.0 + n.dist / 350));
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestAngle = ang;
    }
  }

  if (maxScore > 0 && bestAngle !== null) {
    return bestAngle;
  }

  // Fallback: se todas as pontuações forem nulas, mira no alvo mais próximo
  if (nearestEnemy) {
    return Math.atan2(nearestEnemy.y - py, nearestEnemy.x - px);
  }

  return null;
}

/**
 * Determina o ângulo da investida (ULT) de Sir Roland e Ignis:
 * 1. Coordenadas explícitas de cursor (ex: clique direito com o mouse no alvo)
 * 2. Direção ativa de movimento via joystick (touch) ou WASD (quando o jogador está se movendo)
 * 3. Sem direção definida (quando o jogador está parado ou usa botão/atalho sem movimento):
 *    -> Mira automaticamente com precisão cirúrgica na maior concentração / aglomerado de inimigos
 * 4. Fallback padrão apenas se não houver nenhum inimigo em jogo
 */
export function getHeroSkillDirection(options = {}) {
  // 1. Coordenadas explícitas de cursor (ex: clique direito com mouse no canvas)
  if (options && typeof options.cursorX === 'number' && typeof options.cursorY === 'number') {
    const camX = (camera && typeof camera.x === 'number') ? camera.x : 0;
    const camY = (camera && typeof camera.y === 'number') ? camera.y : 0;
    const zoom = (typeof CAMERA_ZOOM === 'number' && CAMERA_ZOOM > 0) ? CAMERA_ZOOM : 1.25;

    const canvasElem = typeof document !== 'undefined' ? document.getElementById('game-canvas') : null;
    const rect = canvasElem ? canvasElem.getBoundingClientRect() : { left: 0, top: 0 };
    const canvasX = options.cursorX - rect.left;
    const canvasY = options.cursorY - rect.top;

    const pScreenX = (player.x - camX) * zoom;
    const pScreenY = (player.y - camY) * zoom;
    const dx = canvasX - pScreenX;
    const dy = canvasY - pScreenY;
    if (Math.hypot(dx, dy) > 20) {
      return Math.atan2(dy, dx);
    }
  }

  // 2. Direção ativa de movimento via joystick (touch) ou WASD
  const inputLen = Math.hypot(inputX, inputY);
  if (inputLen > 0.05) {
    return Math.atan2(inputY, inputX);
  }

  // 3. Sem direção definida por clique de cursor ou movimento (jogador parado):
  // Direciona automaticamente para a região com maior concentração de inimigos
  const densestAngle = findDensestEnemyDirection(player, enemies);
  if (densestAngle !== null) {
    return densestAngle;
  }

  // 4. Fallback padrão se não houver absolutamente nenhum inimigo ativo no mapa
  return player.facing === -1 ? Math.PI : 0;
}

export function triggerHeroSkill(options = {}) {
  if (player.skillCd > 0 || !gameState.isInMatch || gameState.isPaused || gameState.isDead || gameState.isWon || (matchIntro && matchIntro.active) || cinematicCamera.isCinematic) return;
  try { triggerUltBurst(selectedHeroKey); } catch (_) {}

  if (selectedHeroKey === 'KNIGHT') {
    player.dashDuration = 24;
    player.rolandTrailDistance = 0;
    player.rolandImpactCooldown = 0;
    player.iFrames = 50;
    player.bossIFrames = 50;
    const moveAng = getHeroSkillDirection(options);

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
    player.ignisFireTrailTimer = 0;
    player.iFrames = 30;
    player.bossIFrames = 30;
    const moveAng = getHeroSkillDirection(options);

    player.ignisDashVx = Math.cos(moveAng) * 15.5;
    player.ignisDashVy = Math.sin(moveAng) * 15.5;
    if (Math.abs(player.ignisDashVx) > 0.1) {
      player.facing = player.ignisDashVx >= 0 ? 1 : -1;
    }

    playSfx('flame_dash');
    triggerShake(9);
    triggerHaptic('heavy');
    beginIgnisStep(player.x, player.y, player.facing);
  } else if (selectedHeroKey === 'ROGUE') {
    player.invisTimer = KAEL_ULT.duration;
    player.iFrames = 20;
    player.isPhasing = true;
    playSfx('smoke_bomb');
    triggerHaptic('heavy');
    beginKaelPhase(player.x, player.y, player.facing);
    createHitParticles(player.x, player.y, '#171324', 16);
    createHitParticles(player.x, player.y, '#7c3aed', 18);
    createHitParticles(player.x, player.y, '#38bdf8', 12);
  } else if (selectedHeroKey === 'BARBARIAN') {
    player.berserkTimer = KRAGDOR_ULT.duration;
    player.roarOriginX = player.x;
    player.roarOriginY = player.y;
    player.iFrames = 25;
    playSfx('barbarian_roar');
    triggerShake(12);
    triggerHaptic('heavy');
    createHitParticles(player.x, player.y, '#e74c3c', 24);

    // Rugido Ancestral: Atordoar, tornar vulnerável e repelir inimigos na área
    const roarRadius = KRAGDOR_ULT.radius;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || e.hp <= 0 || e.isBoss) continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < roarRadius) {
        e.stunTimer = KRAGDOR_ULT.stunDuration;
        e.isVulnerable = true;
        e.vulnerableTimer = KRAGDOR_ULT.vulnerableDuration;
        e.roarMarkTimer = KRAGDOR_ULT.vulnerableDuration;
        // Knockback radial
        const pushForce = 6;
        const ang = Math.atan2(dy, dx);
        e.pushVx = Math.cos(ang) * pushForce;
        e.pushVy = Math.sin(ang) * pushForce;
        e.hitFlash = 8;
      }
    }

    // Vaporizar projéteis inimigos na área do rugido
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const b = enemyBullets[i];
      const bdx = b.x - player.x;
      const bdy = b.y - player.y;
      if (bdx * bdx + bdy * bdy < roarRadius * roarRadius) {
        createHitParticles(b.x, b.y, '#f39c12', 5);
        enemyBullets.splice(i, 1);
      }
    }
  } else if (selectedHeroKey === 'ALCHEMIST') {
    player.alchemistSkillTimer = 300;
    player.alchemistBuffTimer = 300;
    player.alchemistSkillDisoriented = true;
    player.iFrames = 30;
    player.tempShield = 25;
    player.tempShieldTimer = 240;

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
        puddleRadius: 62.4,
        puddleDuration: player.evolvedPotion ? 340 : 280,
        isEvolved: player.evolvedPotion,
        trail: []
      });
    }
  }

  player.skillCd = player.skillMaxCd;
}

export function getNextLevelXp(level) {
  // Multiplica por 2 a facilidade de subir de nível (reduz à metade o requisito de XP)
  return Math.max(1, Math.round((12 + (level * 7) + Math.floor(Math.pow(level, 1.28))) * 0.5));
}

export function addXP(amount) {
  playSfx('gem');
  const mult = (player && player.xpMultiplier) ? player.xpMultiplier : 1.0;
  player.xp += Math.round(amount * mult);
  while (player.xp >= player.nextXp) {
    player.xp -= player.nextXp;
    player.level++;
    player.nextXp = getNextLevelXp(player.level);
    window.dispatchEvent(new CustomEvent('player:levelup'));
  }
}

export function resetPlayer(heroKey) {
  selectedHeroKey = heroKey;
  const c = CHARACTERS[selectedHeroKey];
  const meta = getMetaBonuses();

  player.characterKey = heroKey;
  player.selectedHeroKey = heroKey;
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
  player.nextXp = getNextLevelXp(1);
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
  player.ultCooldownCount = 0;
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
  player.axeSpeedCount = 0;
  player.axeSpinSpeed = 0.085;
  player.axeRadiusCount = 0;
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
  player.ignisDashDuration = 0;
  player.ignisFireTrailTimer = 0;
  player.ignisDashVx = 0;
  player.ignisDashVy = 0;
  player.berserkTimer = 0;
  player.roarOriginX = 0;
  player.roarOriginY = 0;
  player.invisTimer = 0;
  player.isPhasing = false;
  clearKaelPhaseEffects();
  player.alchemistSkillTimer = 0;
  player.alchemistBuffTimer = 0;
  player.alchemistSkillDisoriented = false;
  player.tempShield = 0;
  player.tempShieldTimer = 0;
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
