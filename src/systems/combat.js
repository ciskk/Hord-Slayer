/**
 * src/systems/combat.js
 * Subsistema de combate, efeitos visuais de impacto e máquina de estados melee (Fase 3).
 */
import { playSfx, triggerHaptic } from '../core/audio.js';
import { triggerDeath } from './ui.js';
import { triggerShake } from '../state/gameState.js';
import { bossShockwaves } from '../state/collections.js';
import { setLastAttackerInfo } from '../state/events.js';
import { selectedHeroKey, player } from '../entities/player.js';
import { getEnemyDeathProfile } from '../config/enemyDeaths.js';
import { getBossPhaseDefeatDamage } from './devtools.js';
import { ENEMY_TYPES, MINI_BOSS_TYPES } from '../config/enemies.js';


export const damageTexts = [];
export const particles = [];
export const bloodSplats = [];
export const dyingEnemies = [];

export function addDyingEnemy(e, hitAngle = 0) {
  if (!e || e.isBoss || e.isBossSubTarget) return;

  const isMini = !!e.isMiniBoss;
  const profile = getEnemyDeathProfile(e);
  const duration = e.explodedNaturally ? Math.round(profile.duration * 0.8) : profile.duration;
  // Mantém a janela original da necrofagia independente da duração visual.
  const heavyCorpse = ['GOLEM', 'SHIELDED', 'MAIDEN_THORNS', 'BASALT_GARGOYLE', 'DULLAHAN_VANGUARD'].includes(e.baseType);
  const corpseTimer = e.explodedNaturally ? 0 : isMini ? 54 : heavyCorpse ? 36 : e.baseType === 'SPLITTER_MINI' ? 20 : 28;

  // Push speed and angular velocity based on creature mass and hit direction
  const pushSpeed = profile.push;
  const rotSign = Math.sin(hitAngle) >= 0 ? 1 : -1;
  const initialVRot = profile.spin * rotSign;

  // Mobile/Performance Hard Cap: limit concurrent dying enemies to 60
  if (dyingEnemies.length >= 60) {
    let removeIdx = -1;
    for (let k = 0; k < dyingEnemies.length; k++) {
      if (!dyingEnemies[k].isMiniBoss) {
        removeIdx = k;
        break;
      }
    }
    // Uma morte comum nunca interrompe a finalização de um miniboss.
    if (removeIdx === -1 && !isMini) return;
    dyingEnemies.splice(removeIdx === -1 ? 0 : removeIdx, 1);
  }

  dyingEnemies.push({
    x: e.x,
    y: e.y,
    vx: Math.cos(hitAngle) * pushSpeed,
    vy: Math.sin(hitAngle) * pushSpeed,
    rot: 0,
    vRot: initialVRot,
    facing: e.facing || 1,
    radius: e.radius,
    baseType: e.baseType,
    variant: e.variant || 0,
    color: e.color,
    isElite: !!e.isElite,
    isMiniBoss: isMini,
    name: e.name || '',
    enraged: !!e.enraged,
    // Preserve visible equipment and evolved forms for the redesigned death pose.
    aimAngle: e.aimAngle,
    moveAngle: e.moveAngle,
    crawlPhase: e.crawlPhase,
    attackAngle: e.attackAngle,
    dashAngle: e.dashAngle,
    dashState: e.dashState,
    leapAngle: e.leapAngle,
    leapState: e.leapState,
    shadowBoltTimer: e.shadowBoltTimer,
    pounceAngle: e.pounceAngle,
    beamAngle: e.beamAngle,
    currentSkill: e.currentSkill,
    blinkCount: e.blinkCount,
    spiralAngle: e.spiralAngle,
    shootAngle: e.shootAngle,
    sniperAimAngle: e.sniperAimAngle,
    shieldAngle: e.shieldAngle,
    hookAngle: e.hookAngle,
    flameAngle: e.flameAngle,
    lanceAngle: e.lanceAngle,
    chargeAngle: e.chargeAngle,
    eatenGemsCount: e.eatenGemsCount,
    gorgonStacks: e.gorgonStacks,
    isAwakeMimic: e.isAwakeMimic,
    isStoneForm: e.isStoneForm,
    phase: e.phase,
    hitAngle,
    deathJumpZ: Math.max(0, e.jumpZ || 0),
    explodedNaturally: !!e.explodedNaturally,
    corpseTimer,
    timer: duration,
    maxTimer: duration
  });
}

// Hard Caps para Mobile: limita instâncias ativas para conter picos de GC e aliviar o pipeline gráfico
export function addDamageText(x, y, text, isCrit = false, color = '#fff') {
  if (damageTexts.length >= 25) {
    damageTexts.shift();
  }
  damageTexts.push({
    x: x + (Math.random() - 0.5) * 8,
    y: y - 6,
    vx: (Math.random() - 0.5) * 2.8,
    vy: isCrit ? -4.2 : -2.8,
    text: typeof text === 'number' ? Math.round(text) + (isCrit ? '!' : '') : text,
    isCrit: isCrit,
    color: isCrit ? '#f1c40f' : color,
    life: isCrit ? 38 : 30,
    maxLife: isCrit ? 38 : 30
  });
}

export function createHitParticles(x, y, color, count = 5) {
  const maxParticles = 40;
  const allowedCount = Math.min(count, Math.max(0, maxParticles - particles.length));
  for (let i = 0; i < allowedCount; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 5.5,
      vy: (Math.random() - 0.5) * 5.5,
      life: 18,
      color: color
    });
  }
}

export function addBloodSplat(x, y, color = 'rgba(100, 18, 18, 0.45)') {
  if (bloodSplats.length > 110) bloodSplats.shift();
  bloodSplats.push({
    x: x + (Math.random() - 0.5) * 8,
    y: y + (Math.random() - 0.5) * 8,
    r: Math.random() * 7 + 5,
    color: color
  });
}

export function updateCombatVisuals(dt) {
  let dtWrite = 0;
  for (let i = 0; i < damageTexts.length; i++) {
    const dtItem = damageTexts[i];
    dtItem.x += dtItem.vx * dt;
    dtItem.y += dtItem.vy * dt;
    dtItem.vy += 0.16 * dt;
    dtItem.life -= dt;
    if (dtItem.life > 0) {
      damageTexts[dtWrite++] = dtItem;
    }
  }
  damageTexts.length = dtWrite;

  let pWrite = 0;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life > 0) {
      particles[pWrite++] = p;
    }
  }
  particles.length = pWrite;

  const corpseDrag = Math.pow(0.86, dt);
  const corpseSpinDrag = Math.pow(0.92, dt);
  let deWrite = 0;
  for (let i = 0; i < dyingEnemies.length; i++) {
    const de = dyingEnemies[i];
    de.x += de.vx * dt;
    de.y += de.vy * dt;
    de.vx *= corpseDrag;
    de.vy *= corpseDrag;
    de.rot = (de.rot || 0) + (de.vRot || 0) * dt;
    de.vRot = (de.vRot || 0) * corpseSpinDrag;
    de.timer -= dt;
    de.corpseTimer = Math.max(0, de.corpseTimer - dt);
    if (de.timer > 0) {
      dyingEnemies[deWrite++] = de;
    }
  }
  dyingEnemies.length = deWrite;
}

const NON_MELEE_BEHAVIORS_SET = new Set([
  'shooter', 'kamikaze', 'kamikaze_spread', 'boulder_throw', 
  'mortar_barrage', 'summoner', 'protect_aura', 'gravity_ritual', 
  'bat_spawner', 'vortex_carrier', 'anchor',
  'long_range_sniper', 'web_trapper', 'haste_chanter', 'horde_mender', 'barrier_linker'
]);

/**
 * Máquina de Estados de Ataque Melee dos Inimigos:
 * CHASE -> WINDUP (desaceleração e telegrafia) -> STRIKE (dano exclusivo) -> RECOVERY (vulnerabilidade).
 */
export function processEnemyMeleeAttacks(player, enemies, dt, freezeTimer = 0) {
  // A telegrafia e o golpe usam o mesmo relógio da IA, inclusive no freeze global.
  if (player.hp <= 0 || freezeTimer > 0 || !(dt > 0)) return;

  const isKaelIntangible = player.invisTimer > 0;
  const enemyCount = enemies.length;

  for (let i = 0; i < enemyCount; i++) {
    const e = enemies[i];
    if (!e || e.isBoss || e.isBossSubTarget) continue;

    if (NON_MELEE_BEHAVIORS_SET.has(e.behavior)) continue;

    if (e.baseType === 'STALKER') {
      if ((e.stunTimer > 0 || isKaelIntangible) && (e.dashState === 'aim' || e.dashState === 'dashing')) {
        e.dashState = 'cooldown';
        e.dashTimer = 0;
        e.combatState = 'RECOVERY';
        e.attackTimer = 0;
      }
    }

    if (e.stunTimer > 0) {
      if (e.combatState === 'WINDUP' || e.combatState === 'STRIKE') {
        e.combatState = 'CHASE';
        e.attackTimer = 0;
        e.attackCooldown = 20;
      }
      continue;
    }

    // The worm's dust preparation and stationary recovery cannot start a second bite.
    if (e.behavior === 'dash' && (e.dashState === 'aim' || e.dashState === 'cooldown')) continue;

    if (!e.combatState) e.combatState = 'CHASE';
    if (e.attackTimer === undefined) e.attackTimer = 0;
    if (e.attackCooldown === undefined) e.attackCooldown = 0;
    if (e.attackRange === undefined) e.attackRange = 7;
    if (e.attackWindupFrames === undefined) e.attackWindupFrames = 20;
    if (e.attackStrikeFrames === undefined) e.attackStrikeFrames = 4;
    if (e.attackRecoveryFrames === undefined) e.attackRecoveryFrames = 40;
    if (e.attackCooldownMax === undefined) e.attackCooldownMax = 30;

    // Se o jogador estiver invisível (Kael sob Manto de Fumaça), os mobs não o detectam para atacar nem renderizam telegraphs
    if (isKaelIntangible) {
      if (e.combatState === 'WINDUP' || e.combatState === 'STRIKE') {
        e.combatState = 'CHASE';
        e.attackTimer = 0;
      } else if (e.combatState === 'RECOVERY') {
        e.attackTimer -= dt;
        if (e.attackTimer <= 0) {
          e.combatState = 'CHASE';
          e.attackCooldown = e.attackCooldownMax;
          e.attackTimer = 0;
        }
      }
      if (e.attackCooldown > 0) {
        e.attackCooldown -= dt;
      }
      continue;
    }

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const distSq = dx * dx + dy * dy;
    const strikeRange = e.baseType === 'STALKER' && e.dashState === 'dashing' ? 6 : e.attackRange;
    const strikeLimit = player.radius + e.radius + strikeRange;

    switch (e.combatState) {
      case 'CHASE': {
        if (e.attackCooldown > 0) {
          e.attackCooldown -= dt;
        } else if (distSq <= strikeLimit * strikeLimit) {
          if ((e.emergeTimer || 0) <= 0 && (!e.leapState || e.leapState === 'none')) {
            e.combatState = 'WINDUP';
            e.attackTimer = e.attackWindupFrames;
            e.attackAngle = Math.atan2(dy, dx);
            const isShieldBearer = (e.baseType === 'SHIELDED' || e.baseType === 'PHALANX_LEADER' || e.hasFrontalShield);
            if (!isShieldBearer) {
              e.facing = dx >= 0 ? 1 : -1;
            }
          }
        }
        break;
      }

      case 'WINDUP': {
        e.attackTimer -= dt;

        if (e.attackTimer <= 0) {
          e.combatState = 'STRIKE';
          e.attackTimer = e.attackStrikeFrames;
          e.hasHitInStrike = false;

          // Efeito de Fenda Sísmica do Golem ao desferir soco
          if (e.baseType === 'GOLEM') {
            triggerShake(5);
            playSfx('boss');
            bossShockwaves.push({
              x: e.x + (e.facing || 1) * 24,
              y: e.y + 6,
              radius: 8,
              maxRadius: 52,
              speed: 3.2,
              damage: Math.round(e.damage * 0.65),
              knockback: 7.5,
              color: '#e67e22',
              hitPlayer: false
            });
            createHitParticles(e.x + (e.facing || 1) * 24, e.y + 6, '#e67e22', 8);
          }
        }
        break;
      }

      case 'STRIKE': {
        e.attackTimer -= dt;

        if (!e.hasHitInStrike && !isKaelIntangible && player.iFrames <= 0) {
          const currentDistSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
          if (currentDistSq <= (strikeLimit + 8) ** 2) {
            const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
            let angleDiff = Math.abs(angleToPlayer - e.attackAngle);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

            // Se estiver no cone frontal ou em contato físico direto, o dano é confirmado
            const isBodyContact = currentDistSq <= (player.radius + e.radius + 6) ** 2;
            if (angleDiff <= Math.PI * 0.6 || isBodyContact) {
              e.hasHitInStrike = true;

              let playerDmgTaken = e.damage;
              if (selectedHeroKey === 'KNIGHT') playerDmgTaken *= 0.80;
              let enemyCategory = 'HORDE';
              if (e.isBoss) enemyCategory = 'BOSS';
              else if (e.isMiniBoss) enemyCategory = 'MINIBOSS';
              else if (e.isElite) enemyCategory = 'ELITE';

              let strikeName = 'Golpe Melee';
              if (e.baseType === 'BAT') strikeName = 'Mordida Vampírica';
              else if (e.baseType === 'GOLEM') strikeName = 'Esmagamento de Concreto';
              else if (e.baseType === 'SPLITTER_MINI') strikeName = 'Bote Predatório da Larva';
              else if (e.baseType === 'SPLITTER') strikeName = 'Mordida Cáustica do Verme';
              else if (e.baseType === 'STALKER') strikeName = 'Bote do Verme Sepulcral';
              else if (e.baseType === 'SHIELDED' || e.baseType === 'PHALANX_LEADER') strikeName = 'Investida com Escudo';
              else if (e.baseType === 'DULLAHAN_VANGUARD') strikeName = 'Estocada de Lança Decapitadora';
              else if (e.isElite) strikeName = 'Golpe Feroz de Elite';

              const mobDef = ENEMY_TYPES[e.baseType] || MINI_BOSS_TYPES[e.baseType];
              const resolvedMobName = e.name || (mobDef ? (e.isElite ? `${mobDef.name} (Elite)` : mobDef.name) : 'Abominação da Horda');

              setLastAttackerInfo({
                name: resolvedMobName,
                category: enemyCategory,
                attackName: strikeName,
                damage: Math.round(playerDmgTaken * (player.damageTakenMultiplier || 1.0)),
                enemyType: e.baseType || e.type,
                color: e.color || (mobDef ? mobDef.color : '#e74c3c')
              });

              let actualPlayerDmg = playerDmgTaken * (player.damageTakenMultiplier || 1.0);
              if (player.tempShield && player.tempShield > 0) {
                const absorb = Math.min(player.tempShield, actualPlayerDmg);
                player.tempShield -= absorb;
                actualPlayerDmg -= absorb;
                addDamageText(player.x, player.y - 35, `ESCUDO ABSORVEU -${Math.round(absorb)}`, true, '#a29bfe');
                if (player.tempShield <= 0) player.tempShieldTimer = 0;
              }
              player.hp -= actualPlayerDmg;
              player.iFrames = Math.round(28 * (player.iFramesDurationMult !== undefined ? player.iFramesDurationMult : 1.0));
              triggerShake(7);
              playSfx('hit');
              triggerHaptic('medium');
              addDamageText(player.x, player.y, `-${Math.round(playerDmgTaken)}`, false, '#e74c3c');
              createHitParticles(player.x, player.y, '#e74c3c', 6);

              // Mordida Amortecedora / Drenante do Morcego (Numbing Bite)
              if (e.baseType === 'BAT') {
                player.slowTimer = Math.max(player.slowTimer || 0, 42);
              }

              // Impulso de Knockback sofrido: Leves tomam 100% e Pesados tomam 50%
              const hasSuperArmor = (player.dashDuration > 0) || (player.ignisDashDuration > 0) || (player.invisTimer > 0);
              if (!hasSuperArmor) {
                const pushAngle = Math.atan2(player.y - e.y, player.x - e.x);
                let baseMobKnockback = 9.5;
                if (e.baseType === 'SHIELDED' || e.baseType === 'PHALANX_LEADER') baseMobKnockback = 15.0; // Escudada pesada
                if (e.baseType === 'GOLEM') baseMobKnockback = 13.0;
                const finalPush = baseMobKnockback * (player.knockbackReceived !== undefined ? player.knockbackReceived : 1.0);
                player.pushVx = Math.cos(pushAngle) * finalPush;
                player.pushVy = Math.sin(pushAngle) * finalPush;
              }

              // Passiva de retaliação de Sir Roland (KNIGHT) com Adrenalina Melee
              if (selectedHeroKey === 'KNIGHT') {
                let reflectDmg = e.damage * 0.5;
                const distToEnemy = Math.hypot(player.x - e.x, player.y - e.y);
                if (distToEnemy <= 130) {
                  reflectDmg *= 1.25;
                }
                // Se o Guardião Blindado ou Centurião estiver virado de frente para o cavaleiro e não estiver com guarda quebrada
                let isRetaliationBlocked = false;
                if ((e.baseType === 'SHIELDED' || e.baseType === 'PHALANX_LEADER' || e.hasFrontalShield) && (!e.shieldStaggerTimer || e.shieldStaggerTimer <= 0)) {
                  const attackAngle = Math.atan2(player.y - e.y, player.x - e.x);
                  const facingAngle = (e.facing === -1) ? Math.PI : 0;
                  let angleDiff = Math.abs(attackAngle - facingAngle);
                  while (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

                  if (angleDiff <= Math.PI * 0.35) {
                    reflectDmg *= (e.baseType === 'PHALANX_LEADER' ? 0.50 : 0.55);
                    e.shieldBlockFlash = 6;
                    isRetaliationBlocked = true;
                  }
                }
                reflectDmg = getBossPhaseDefeatDamage(e, reflectDmg);
                e.hp -= reflectDmg;
                e.hitFlash = 4;
                playSfx('retaliation_clang');
                addDamageText(e.x, e.y, Math.round(reflectDmg), !isRetaliationBlocked && distToEnemy <= 130, isRetaliationBlocked ? '#74b9ff' : (distToEnemy <= 130 ? '#f1c40f' : '#ffffff'));
              }

              if (player.hp <= 0) {
                player.hp = 0;
                triggerDeath();
                return;
              }
            }
          }
        }

        if (e.attackTimer <= 0) {
          e.combatState = 'RECOVERY';
          e.attackTimer = e.attackRecoveryFrames;
        }
        break;
      }

      case 'RECOVERY': {
        e.attackTimer -= dt;
        if (e.attackTimer <= 0) {
          e.combatState = 'CHASE';
          e.attackCooldown = e.attackCooldownMax;
          e.attackTimer = 0;
        }
        break;
      }

      default:
        e.combatState = 'CHASE';
        break;
    }
  }
}

/**
 * Seleciona o melhor alvo disponível considerando pesos de prioridade tática.
 * Multiplicadores menores atraem a mira a distâncias maiores.
 */
export function getBestTarget(player, enemyList, maxRange = Infinity) {
  let bestTarget = null;
  let minWeightedDistSq = maxRange * maxRange;

  const count = enemyList.length;
  for (let i = 0; i < count; i++) {
    const e = enemyList[i];
    if (!e || e.hp <= 0) continue;

    if (e.isBossSubTarget && !e.active) continue;
    if (e.isBoss && e.mistState === 'DASHING') continue;

    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const actualDistSq = dx * dx + dy * dy;

    if (actualDistSq > maxRange * maxRange) continue;

    let priorityWeight = 1.0;
    if (e.isBossSubTarget) {
      priorityWeight = 0.35;
    } else if (e.isMiniBoss) {
      priorityWeight = 0.50;
    } else if (e.isBoss) {
      priorityWeight = 0.65;
    } else if (e.isElite) {
      priorityWeight = 0.85;
    }

    const weightedDistSq = actualDistSq * (priorityWeight * priorityWeight);
    if (weightedDistSq < minWeightedDistSq) {
      minWeightedDistSq = weightedDistSq;
      bestTarget = e;
    }
  }

  return bestTarget;
}

/**
 * Aplica queimadura ígnea contínua (DoT de Fogo da Ignis) em uma entidade inimiga.
 * @param {object} target - Entidade inimiga.
 * @param {number} duration - Duração em frames (padrão 180 = 3.0s).
 * @param {number} dps - Dano por segundo causado pela queimadura.
 * @param {boolean} isCrit - Se originado de acerto crítico (+50% de DPS de queimadura).
 */
export function applyFireBurn(target, duration = 180, dps = 20, isCrit = false) {
  if (!target || target.hp <= 0 || target.isTargetable === false) return;
  const frameDmg = (dps / 60) * (isCrit ? 1.5 : 1.0);
  target.fireBurnDmg = Math.max(target.fireBurnDmg || 0, frameDmg);
  target.fireBurnTimer = Math.max(target.fireBurnTimer || 0, duration);
  if (isCrit) target.fireBurnCrit = true;
}

/**
 * Aplica congelamento/lentidão criogênica em uma entidade inimiga (Golpe Criogênico).
 * @param {object} target - Entidade inimiga.
 * @param {number} duration - Duração base em frames (padrão 150 = 2.5s).
 * @param {number} slowFactor - Fator de desaceleração (padrão 0.55).
 */
export function applyFreeze(target, duration = 150, slowFactor = 0.55) {
  if (!target || target.hp <= 0 || target.isTargetable === false) return;
  const bonusDuration = (player && player.slowDurationBonus ? player.slowDurationBonus * 60 : 0);
  const totalDuration = Math.round(duration + bonusDuration);
  target.slowTimer = Math.max(target.slowTimer || 0, totalDuration);
  target.slowFactor = slowFactor;
  target.freezeTimer = Math.max(target.freezeTimer || 0, totalDuration);
  createHitParticles(target.x, target.y, '#74b9ff', 2);
}
