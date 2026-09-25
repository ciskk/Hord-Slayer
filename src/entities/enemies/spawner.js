/**
 * src/entities/enemies/spawner.js
 * Fábrica de Inimigos, Mini-Chefes, Chefes e Objetos do Cenário (Fase 1).
 */
import { ENEMY_TYPES, BOSS_TYPES, MINI_BOSS_TYPES } from '../../config/enemies.js';
import { STALKER_DASH } from '../../config/stalkerDash.js';
import { getSquadDefinition } from '../../config/squads.js';
import { player, selectedHeroKey } from '../player.js';
import { 
  viewW, 
  viewH, 
  cameraViewW,
  cameraViewH,
  frameCount, 
  triggerShake,
  setCurrentArenaTheme,
  setIsWavePaused
} from '../../state/gameState.js';
import {
  enemies, 
  props, 
  setActiveBoss, 
  enemyBullets,
  bossTelegraphs,
  bossShockwaves,
  voidVortices
} from '../../state/collections.js';

import { playSfx, triggerHaptic } from '../../core/audio.js';
import { initBoss } from '../bosses/bossRegistry.js';
import { transitionToArenaTheme } from '../../render/environment.js';
import { triggerBossBark, triggerMiniBossBark } from '../../systems/barks.js';
import { purgeWorldForFinalBoss } from '../../systems/pickups.js';

export const MAX_ENEMIES = 150;

/**
 * Identifica se a espécie informada pertence à família dos Vermes/Parasitas rastejantes.
 * @param {string} typeKey
 * @returns {boolean}
 */
export function isWormEnemyType(typeKey) {
  return typeKey === 'STALKER' || typeKey === 'SPLITTER' || typeKey === 'SPLITTER_MINI' || typeKey === 'TRAIL_CRAWLER';
}

/** O verme emerge perto do jogador; a mira fica fixa durante os 500 ms de poeira. */
function getStalkerSpawnPoint(angle = null) {
  const a = angle ?? Math.random() * Math.PI * 2;
  const distance = STALKER_DASH.spawnMinDistance
    + Math.random() * (STALKER_DASH.spawnMaxDistance - STALKER_DASH.spawnMinDistance);
  return { x: player.x + Math.cos(a) * distance, y: player.y + Math.sin(a) * distance };
}

/**
 * Checa se Kael (ROGUE) está com o Manto de Fumaça (invisibilidade) ativo.
 * @returns {boolean}
 */
export function isKaelInvisible() {
  // Derivado do timer da partida atual; não mantém uma flag global de bloqueio.
  return selectedHeroKey === 'ROGUE' && Number.isFinite(player.invisTimer) && player.invisTimer > 0;
}

/**
 * Retorna uma coordenada de spawn imediatamente fora da visão do jogador,
 * garantindo entrada rápida na tela (~0.4s - 0.5s) e suporte a ângulo forçado para hordas inaugurais.
 * @param {number} minDist Distância mínima adicional além da borda da tela.
 * @param {number} maxDist Distância máxima adicional além da borda da tela.
 * @param {number|null} forcedAngle Ângulo forçado em radianos (ex: Math.PI / 2 para Sul/Baixo).
 * @returns {{ x: number, y: number }}
 */
function getOffscreenSpawnPoint(minDist = 45, maxDist = 65, forcedAngle = null) {
  const halfW = (cameraViewW || 960) / 2;
  const halfH = (cameraViewH || 640) / 2;
  const margin = minDist + Math.random() * (maxDist - minDist);

  // Sorteio angular uniforme em 360° ou direção forçada para horda inicial
  const angle = forcedAngle !== null ? forcedAngle : Math.random() * Math.PI * 2;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  // Distância perpendicular exata até a borda externa da tela no ângulo desejado
  const distToEdgeX = Math.abs(cosA) > 1e-5 ? (halfW + margin) / Math.abs(cosA) : Infinity;
  const distToEdgeY = Math.abs(sinA) > 1e-5 ? (halfH + margin) / Math.abs(sinA) : Infinity;
  const spawnDist = Math.min(distToEdgeX, distToEdgeY);

  return {
    x: player.x + cosA * spawnDist,
    y: player.y + sinA * spawnDist
  };
}

/**
 * Caso a população atinja o limite máximo (hard cap), funde os atributos
 * em um monstro comum situado fora da visão do jogador.
 * @param {string} typeKey Tipo base do inimigo.
 * @param {number} hpToAdd Quantidade de vida a acumular.
 * @param {number} xpToAdd Quantidade de XP a acumular.
 * @returns {boolean} Verdadeiro se a fusão foi realizada com sucesso.
 */
export function stackOffscreenMob(typeKey, hpToAdd, xpToAdd) {
  if (isKaelInvisible() && isWormEnemyType(typeKey)) return false;
  const halfW = (cameraViewW || 960) / 2;
  const halfH = (cameraViewH || 640) / 2;
  const offscreenThresholdSq = (Math.hypot(halfW, halfH) + 160) ** 2;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.isBoss || e.isMiniBoss || e.isBossSubTarget || e.hp <= 0) continue;

    const dx = e.x - player.x;
    const dy = e.y - player.y;
    if ((dx * dx + dy * dy) > offscreenThresholdSq) {
      e.hp += hpToAdd;
      e.maxHp += hpToAdd;
      e.xp += xpToAdd;
      e.stackCount = (e.stackCount || 1) + 1;
      e.damage = Math.round(e.damage * 1.05);
      return true;
    }
  }
  return false;
}

/**
 * Cria a estrutura de dados padronizada para uma entidade inimiga comum.
 * @param {string} typeKey Chave do tipo de inimigo em ENEMY_TYPES.
 * @param {number} x Coordenada X.
 * @param {number} y Coordenada Y.
 * @param {boolean} isElite Indica se o monstro receberá modificadores de Elite.
 * @returns {Object} Instância do inimigo.
 */
export function createEnemy(typeKey, x, y, isElite = false) {
  const def = ENEMY_TYPES[typeKey] || ENEMY_TYPES.ZOMBIE;
  const minutes = frameCount / 3600;
  const scaleFactor = 1.0 + (minutes * 0.28);

  let hp = Math.round(def.hp * scaleFactor);
  let maxHp = hp;
  let damage = def.damage;
  let speed = def.speed;
  let radius = def.radius;
  let xp = def.xp;
  let color = def.color;
  let eliteMod = null;

  if (isElite) {
    hp = Math.round(hp * 2.8);
    maxHp = hp;
    damage = Math.round(damage * 1.35);
    radius = Math.round(radius * 1.25);
    xp = Math.round(xp * 3);
    eliteMod = Math.random() < 0.5 ? 'FROST' : 'TOXIC';
    color = eliteMod === 'FROST' ? '#74b9ff' : '#9b59b6';
  }

  let attackRange = 7;
  let attackWindupFrames = 20;
  let attackStrikeFrames = 4;
  let attackRecoveryFrames = 29;
  let attackCooldownMax = 23;

  if (typeKey === 'BAT') {
    attackRange = 4;
    attackWindupFrames = 16;
    attackStrikeFrames = 4;
    attackRecoveryFrames = 23;
    attackCooldownMax = 15;
  } else if (typeKey === 'GOLEM') {
    attackRange = 10;
    attackWindupFrames = 24;
    attackStrikeFrames = 6;
    attackRecoveryFrames = 37;
    attackCooldownMax = 28;
  } else if (typeKey === 'STALKER') {
    attackRange = 6;
    attackWindupFrames = 18;
    attackStrikeFrames = 4;
    attackRecoveryFrames = 25;
    attackCooldownMax = 19;
  } else if (typeKey === 'SHIELDED') {
    attackRange = 8;
    attackWindupFrames = 22;
    attackStrikeFrames = 5;
    attackRecoveryFrames = 28;
    attackCooldownMax = 25;
  } else if (typeKey === 'CHAIN_FLAYER') {
    attackRange = 10;
    attackWindupFrames = 24;
    attackStrikeFrames = 6;
    attackRecoveryFrames = 32;
    attackCooldownMax = 31;
  } else if (typeKey === 'DULLAHAN_VANGUARD') {
    attackRange = 10;
    attackWindupFrames = 20;
    attackStrikeFrames = 5;
    attackRecoveryFrames = 26;
    attackCooldownMax = 22;
  } else if (typeKey === 'MAIDEN_THORNS') {
    attackRange = 8;
    attackWindupFrames = 20;
    attackStrikeFrames = 5;
    attackRecoveryFrames = 28;
    attackCooldownMax = 23;
  } else if (typeKey === 'GRAVE_GORGON') {
    attackRange = 9;
    attackWindupFrames = 22;
    attackStrikeFrames = 6;
    attackRecoveryFrames = 31;
    attackCooldownMax = 25;
  } else {
    attackRange = Math.max(5, Math.min(9, Math.round(radius * 0.4)));
  }

  return {
    x,
    y,
    baseType: typeKey,
    name: isElite ? `${def.name} (Elite)` : def.name,
    variant: typeKey === 'ZOMBIE' ? Math.floor(Math.random() * 4) : 0,
    radius,
    speed,
    baseSpeed: speed,
    hp,
    maxHp,
    color,
    damage,
    behavior: def.behavior,
    xp,
    facing: (player.x >= x ? 1 : -1),
    hitFlash: 0,
    shieldBlockFlash: 0,
    orbitalHitCd: 0,
    slowTimer: 0,
    slowFactor: 0,
    stunTimer: 0,
    isElite: !!isElite,
    eliteMod,
    // Emergência do Solo (Zumbis, Rastejadores e Vermes Terrestres)
    emergeTimer: (typeKey === 'ZOMBIE' || typeKey === 'SPLITTER' || typeKey === 'TRAIL_CRAWLER' || typeKey === 'SPLITTER_MINI') ? 34 : 0,
    emergeDuration: (typeKey === 'ZOMBIE' || typeKey === 'SPLITTER' || typeKey === 'TRAIL_CRAWLER' || typeKey === 'SPLITTER_MINI') ? 34 : 0,
    // Cinética & Salto Predatório dos Mobs Vermes (SPLITTER_MINI)
    leapState: 'none',
    leapTimer: 0,
    leapDuration: 0,
    leapAngle: 0,
    leapSpeed: 0,
    jumpZ: 0,
    jumpMaxZ: 0,
    leapCooldown: (typeKey === 'SPLITTER_MINI') ? Math.floor(Math.random() * 35) : 60,
    landingSplashTimer: 0,
    // Máquina de Estados Melee (src/systems/combat.js)
    combatState: 'CHASE',
    attackTimer: 0,
    attackRange,
    attackWindupFrames,
    attackStrikeFrames,
    attackRecoveryFrames,
    attackCooldown: 0,
    attackCooldownMax,
    attackAngle: 0,
    hasHitInStrike: false,
    // Máquina de Pavio para Kamikazes (src/main.js)
    fuseState: 'CHASE',
    fuseTimer: 0,
    fuseTelegraph: null,
    explodedNaturally: false,
    // Timers de comportamentos táticos específicos
    shootTimer: Math.floor(Math.random() * 60),
    burstRemaining: 0,
    burstTimer: 0,
    thrusterCooldown: 0,
    shadowBoltTimer: Math.floor(Math.random() * 80),
    pounceCooldown: 0,
    dashTimer: 0,
    dashState: typeKey === 'STALKER' ? 'aim' : 'chase',
    dashAngle: typeKey === 'STALKER' ? Math.atan2(player.y - y, player.x - x) : 0,
    summonTimer: 0,
    auraTimer: 0,
    throwTimer: 0,
    hiveTimer: 0,
    blinkTimer: 0,
    vortexTimer: 0,
    cycleTimer: 0,
    cycleState: 0,
    slamTimer: 0,
    mortarTimer: 0,
    ritualTimer: 0,
    // Propriedades dos 15 novos mobs
    trailTimer: 0,
    webTimer: Math.floor(Math.random() * 80),
    hookTimer: 0,
    hookState: 'chase',
    stoneFormTimer: 0,
    isStoneForm: false,
    burstDamageTracker: 0,
    bellTimer: Math.floor(Math.random() * 60),
    apothecaryTimer: Math.floor(Math.random() * 80),
    scribeTimer: 0,
    linkedShieldTarget: null,
    shieldHp: 0,
    maxShieldHp: 0,
    flameState: 'chase',
    flameTimer: 0,
    flameTelegraph: null,
    flameAngle: 0,
    spikeHits: 0,
    hasMirrored: false,
    isDecoy: false,
    decoyLife: 180,
    lanceState: 'chase',
    lanceTimer: 0,
    lanceAngle: 0,
    lanceTelegraph: null,
    sniperTimer: Math.floor(Math.random() * 50),
    sniperAimAngle: 0,
    sniperLaserLife: 0,
    eatenGemsCount: 0,
    searchGemTimer: 0,
    devourTimer: 0,
    gorgonStacks: 0,
    isAwakeMimic: false,
    mimicWakeTimer: 0,
    turnDelayTimer: 0,
    shieldStaggerTimer: 0
  };
}

/**
 * Gera um grupo concentrado de monstros da mesma espécie.
 * @param {string} typeKey Chave do tipo em ENEMY_TYPES.
 * @param {number} count Quantidade de monstros a gerar.
 * @param {number} eliteChance Probabilidade de spawn de elite [0, 1].
 */
export function spawnMobCluster(typeKey, count, eliteChance = 0, forcedAngle = null) {
  if (isKaelInvisible() && isWormEnemyType(typeKey)) return;
  // Não acumular emboscadas: apenas um Assassino Espectral vivo na arena.
  if (typeKey === 'STALKER') {
    if (enemies.some(e => e.baseType === 'STALKER' && e.hp > 0)) return;
    count = Math.min(count, 1);
  }
  // Redução de 50% na chance de spawn do Baú Mímico e limite de 1 por emboscada
  if (typeKey === 'CURSED_CHEST') {
    if (Math.random() < 0.50) return;
    count = Math.min(count, 1);
  }
  const def = ENEMY_TYPES[typeKey] || ENEMY_TYPES.ZOMBIE;
  const minutes = frameCount / 3600;
  const scaleFactor = 1.0 + (minutes * 0.28);
  const scaledHp = Math.round(def.hp * scaleFactor);
  const pt = getOffscreenSpawnPoint(45, 65, forcedAngle);

  for (let i = 0; i < count; i++) {
    if (enemies.length >= MAX_ENEMIES) {
      stackOffscreenMob(typeKey, scaledHp, def.xp);
      continue;
    }

    const isElite = Math.random() < eliteChance;
    const spreadR = Math.random() * 28;
    const spreadA = Math.random() * Math.PI * 2;
    const stalkerPoint = typeKey === 'STALKER' ? getStalkerSpawnPoint(forcedAngle) : null;
    const mx = stalkerPoint ? stalkerPoint.x : pt.x + Math.cos(spreadA) * spreadR;
    const my = stalkerPoint ? stalkerPoint.y : pt.y + Math.sin(spreadA) * spreadR;

    enemies.push(createEnemy(typeKey, mx, my, isElite));
  }
}

/**
 * Gera um esquadrão tático com formação orientada ao jogador conforme src/config/squads.js.
 * @param {string} squadKey Chave da formação em SQUAD_TYPES.
 * @param {number} eliteChance Probabilidade de spawn de elite [0, 1].
 * @param {number|null} forcedAngle Ângulo forçado em radianos caso especificado.
 */
export function spawnSquad(squadKey, eliteChance = 0, forcedAngle = null) {
  const squadDef = getSquadDefinition(squadKey);
  if (!squadDef) {
    spawnMobCluster('ZOMBIE', 6, eliteChance, forcedAngle);
    return;
  }

  // Calcula o raio máximo da formação do esquadrão para manter margem justa e rente à tela
  let maxOffset = 30;
  for (let i = 0; i < squadDef.members.length; i++) {
    const m = squadDef.members[i];
    const off = Math.hypot(m.offsetForward || 0, m.offsetLateral || 0);
    if (off > maxOffset) maxOffset = off;
  }
  const squadMargin = maxOffset + 18;

  const center = getOffscreenSpawnPoint(squadMargin, squadMargin + 15, forcedAngle);
  const angleToPlayer = Math.atan2(player.y - center.y, player.x - center.x);
  const cosA = Math.cos(angleToPlayer);
  const sinA = Math.sin(angleToPlayer);

  for (let i = 0; i < squadDef.members.length; i++) {
    const member = squadDef.members[i];
    if (member.type === 'STALKER' && enemies.some(e => e.baseType === 'STALKER' && e.hp > 0)) {
      continue;
    }
    if (isKaelInvisible() && isWormEnemyType(member.type)) {
      continue;
    }
    // Redução de 50% na chance de spawn do Baú Mímico na formação do esquadrão
    if (member.type === 'CURSED_CHEST' && Math.random() < 0.50) {
      continue;
    }
    const def = ENEMY_TYPES[member.type] || ENEMY_TYPES.ZOMBIE;
    const minutes = frameCount / 3600;
    const scaleFactor = 1.0 + (minutes * 0.28);
    const scaledHp = Math.round(def.hp * scaleFactor);

    if (enemies.length >= MAX_ENEMIES) {
      stackOffscreenMob(member.type, scaledHp, def.xp);
      continue;
    }

    const fwd = member.offsetForward || 0;
    const lat = member.offsetLateral || 0;
    const stalkerPoint = member.type === 'STALKER' ? getStalkerSpawnPoint(forcedAngle) : null;
    const mx = stalkerPoint ? stalkerPoint.x : center.x + cosA * fwd - sinA * lat;
    const my = stalkerPoint ? stalkerPoint.y : center.y + sinA * fwd + cosA * lat;

    const canBeElite = member.type !== 'BAT' && member.type !== 'EXPLODER';
    const isElite = canBeElite && (Math.random() < eliteChance);

    enemies.push(createEnemy(member.type, mx, my, isElite));
  }
}

/**
 * Spawna a horda inicial no exato instante em que a partida começa (t = 0).
 * Posiciona a patrulha inaugural (HORDE_SCOUT) imediatamente abaixo da borda inferior
 * da tela (ao Sul: Math.PI / 2), já marchando em direção ao jogador.
 * Permite que o jogador a encontre imediatamente caso dê dash para baixo ou a veja surgir em ~0.4s.
 * Também gera um pequeno grupo ao norte para movimentar a arena.
 */
export function spawnInitialHorde() {
  // 1. Patrulha principal de reconhecimento logo abaixo (Sul: 90° / pi/2)
  const southAngle = Math.PI / 2 + (Math.random() - 0.5) * 0.12;
  spawnSquad('HORDE_SCOUT', 0, southAngle);

  // 2. Grupo secundário de avanço vindo de cima (Norte: -90° / -pi/2)
  const northAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.25;
  spawnMobCluster('ZOMBIE', 3, 0, northAngle);
}

/**
 * Instancia um mini-chefe programado da onda.
 * @param {string} miniBossType Chave do mini-chefe em MINI_BOSS_TYPES.
 * @returns {Object|null}
 */
export function spawnMiniBoss(miniBossType) {
  const def = MINI_BOSS_TYPES[miniBossType];
  if (!def) return null;

  const minutes = frameCount / 3600;
  const scaleFactor = 1.0 + (minutes * 0.28);
  const hp = Math.round(def.hp * scaleFactor);
  const pt = getOffscreenSpawnPoint(70, 100);

  const miniBoss = {
    x: pt.x,
    y: pt.y,
    name: def.name,
    baseType: miniBossType,
    radius: def.radius,
    speed: def.speed,
    baseSpeed: def.speed,
    hp: hp,
    maxHp: hp,
    color: def.color,
    damage: def.damage,
    behavior: def.behavior,
    xp: def.xp,
    goldReward: def.gold,
    isMiniBoss: true,
    isBoss: false,
    facing: player.x >= pt.x ? 1 : -1,
    hitFlash: 0,
    orbitalHitCd: 0,
    slowTimer: 0,
    slowFactor: 0,
    stunTimer: 0,
    combatState: 'CHASE',
    attackTimer: 0,
    attackRange: Math.max(26, Math.round(def.radius * 1.3)),
    attackWindupFrames: 17,
    attackStrikeFrames: 5,
    attackRecoveryFrames: 32,
    attackCooldown: 0,
    attackCooldownMax: 23,
    attackAngle: 0,
    hasHitInStrike: false,
    fuseState: 'CHASE',
    fuseTimer: 0,
    fuseTelegraph: null,
    explodedNaturally: false,
    // Estado FSM unificado
    actionState: 'CHASE',
    actionTimer: 0,
    actionMaxTimer: 0,
    currentSkill: null,
    castProgress: 0,
    skillCooldown: 40,
    enraged: false,
    hasFrontalShield: miniBossType === 'PHALANX_LEADER',
    shootTimer: 0,
    dashTimer: 0,
    dashState: 'chase',
    dashAngle: 0,
    auraTimer: 0,
    throwTimer: 0,
    hiveTimer: 0,
    blinkTimer: 0,
    vortexTimer: 0,
    cycleTimer: 0,
    cycleState: 0,
    hasSlammed: false,
    chargeAngle: null,
    slamTimer: 0,
    mortarTimer: 0,
    ritualTimer: 0,
    turnDelayTimer: 0,
    shieldStaggerTimer: 0
  };

  playSfx('boss');
  triggerShake(8);
  triggerHaptic('medium');

  enemies.push(miniBoss);
  if (['CHAOS_HERALD', 'BLOOD_GARGOYLE', 'HIGH_OCCULTIST', 'VOID_CALLER', 'FROST_LICH'].includes(miniBossType)) {
    triggerMiniBossBark(miniBossType);
  }
  return miniBoss;
}

/**
 * Dispara o encontro contra um chefe de fase.
 * @param {number} bossId Identificador do chefe (1 a 4).
 * @returns {Object|null}
 */
const BOSS_ARENA_THEMES = {
  1: 'VAMPIRE',
  2: 'MONOLITH',
  3: 'REAPER',
  4: 'ABYSS'
};

export function triggerBossEncounter(bossId) {
  const bossDef = BOSS_TYPES[bossId];
  if (!bossDef) return null;

  // 1. Limpa todos os monstros comuns, projéteis e perigos residuais da arena
  enemies.length = 0;
  enemyBullets.length = 0;
  bossTelegraphs.length = 0;
  bossShockwaves.length = 0;
  voidVortices.length = 0;

  // 2. Bloqueia o spawn de qualquer criatura comum
  setIsWavePaused(true);

  // 3. Transiciona o tema da arena para o cenário temático do Boss suavemente
  transitionToArenaTheme(BOSS_ARENA_THEMES[bossId] || 'ABYSS', 60);

  const angle = Math.random() * Math.PI * 2;
  const bx = player.x + Math.cos(angle) * 380;
  const by = player.y + Math.sin(angle) * 380;

  const boss = {
    x: bx,
    y: by,
    bossId: bossDef.bossId,
    name: bossDef.name,
    hp: bossDef.hp,
    maxHp: bossDef.hp,
    radius: bossDef.radius,
    speed: bossDef.speed,
    baseSpeed: bossDef.speed,
    color: bossDef.color,
    damage: bossDef.damage,
    xp: bossDef.xp,
    isBoss: true,
    isMiniBoss: false,
    isFinalBoss: !!bossDef.isFinalBoss,
    isEnraged: false,
    facing: player.x >= bx ? 1 : -1,
    hitFlash: 0,
    orbitalHitCd: 0,
    slowTimer: 0,
    stunTimer: 0,
    windupTimer: 0,
    windupAction: null,
    combatState: 'CHASE'
  };

  enemies.push(boss);
  setActiveBoss(boss);
  initBoss(boss);

  // Purga Dimensional de Entidades para o Boss Final (Fase 1: Otimização de Arena)
  if (boss.isFinalBoss || boss.bossId === 4) {
    purgeWorldForFinalBoss(boss, player);
  }

  triggerBossBark(bossId, 'SPAWN');

  const hud = document.getElementById('hud');
  if (hud) hud.classList.add('boss-active');

  const bossHud = document.getElementById('boss-hud');
  if (bossHud) {
    bossHud.style.display = 'flex';
    bossHud.setAttribute('data-boss-id', String(boss.bossId || 1));
    bossHud.classList.remove('enraged', 'hit-shake', 'hit-flash');
    const titleTag = bossHud.querySelector('.boss-title-tag');
    if (titleTag) {
      titleTag.innerText = bossDef.isFinalBoss ? '✦ ARQUICHEFE FINAL • SOBERANO ✦' : '✦ ARQUICHEFE SUPREMO ✦';
    }
  }

  const bossName = document.getElementById('boss-name');
  if (bossName) bossName.innerText = bossDef.name;

  const bossHpFill = document.getElementById('boss-hp-fill');
  if (bossHpFill) {
    bossHpFill.style.transition = '';
    bossHpFill.style.width = (boss.bossId === 1 || boss.bossId === 3 || boss.bossId === 4) ? '0%' : '100%';
    bossHpFill.style.background = '';
    bossHpFill.style.boxShadow = '';
  }

  const bossHpGhostFill = document.getElementById('boss-hp-ghost-fill');
  if (bossHpGhostFill) {
    bossHpGhostFill.style.transition = '';
    bossHpGhostFill.style.width = (boss.bossId === 1 || boss.bossId === 3 || boss.bossId === 4) ? '0%' : '100%';
  }

  const bossHpVal = document.getElementById('boss-hp-val');
  if (bossHpVal) bossHpVal.innerText = (boss.bossId === 1 || boss.bossId === 3 || boss.bossId === 4) ? '0%' : '100%';

  if (boss.bossId === 4) {
    playSfx('warp');
    triggerShake(6);
    triggerHaptic('medium');
  } else if (boss.bossId === 1 || boss.bossId === 3) {
    // A introdução cinemática de 5 segundos gerencia seus próprios efeitos sonoros e tremores
    triggerShake(4);
  } else {
    playSfx('boss');
    triggerShake(16);
    triggerHaptic('heavy');
  }

  return boss;
}

/**
 * Spawna objetos quebráveis pelo cenário (barris, caixas).
 */
export function spawnProp() {
  if (props.length >= 14) return;
  const ang = Math.random() * Math.PI * 2;
  const dist = 180 + Math.random() * 320;

  props.push({
    x: player.x + Math.cos(ang) * dist,
    y: player.y + Math.sin(ang) * dist,
    radius: 14,
    hp: 18,
    maxHp: 18,
    hitFlash: 0,
    color: '#95a5a6'
  });
}
