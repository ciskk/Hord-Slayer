/**
 * src/entities/bosses/supremeReaper/mechanics.js
 * Gerenciamento de sub-alvos (Lanternas Espirituais), Vínculo de Almas e ações agendadas do Ceifador Supremo.
 */

import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { enemies, setLastAttackerName, setLastAttackerInfo, canSpawnEnemyBullet } from '../../../main.js';
import { triggerDeath } from '../../../systems/ui.js';
import { selectedHeroKey } from '../../player.js';
import { REAPER_STATES, REAPER_CONFIG } from './constants.js';

/**
 * Remove com segurança do array global de inimigos qualquer sub-alvo vinculado ao chefe.
 * @param {Object} boss
 * @param {Array} targetList
 */
export function cleanupReaperSubTargets(boss, targetList = enemies) {
  for (let i = targetList.length - 1; i >= 0; i--) {
    if (targetList[i].parentBoss === boss) {
      targetList.splice(i, 1);
    }
  }
}

/**
 * Cria as Lanternas Espirituais como sub-alvos selecionáveis ao redor do Ceifador Supremo.
 * @param {Object} boss
 * @param {number} count
 * @param {number} lHp
 * @param {Array} targetList
 */
export function spawnReaperLanterns(boss, count, lHp, targetList = enemies) {
  cleanupReaperSubTargets(boss, targetList);
  boss.lanterns = [];

  const isIntro = boss.actionState === REAPER_STATES.SPAWN_INTRO;

  for (let k = 0; k < count; k++) {
    const angle = (k * Math.PI * 2) / count;
    const lantern = {
      angle: angle,
      dist: REAPER_CONFIG.LANTERN_DIST,
      radius: REAPER_CONFIG.LANTERN_RADIUS,
      hp: lHp,
      maxHp: lHp,
      active: true,
      hitFlash: 0,
      hitCd: 0,
      axeHitCd: 0,
      sway: 0,
      swayVel: 0,
      isBossSubTarget: true,
      isTargetable: !isIntro,
      baseType: 'LANTERNA',
      color: REAPER_CONFIG.COLOR_SOUL_CYAN,
      parentBoss: boss,
      flickerPhase: k * (Math.PI * 2 / count),
      x: boss.x + Math.cos(angle) * REAPER_CONFIG.LANTERN_DIST,
      y: boss.y + Math.sin(angle) * (REAPER_CONFIG.LANTERN_DIST * REAPER_CONFIG.LANTERN_DIST_Y_FACTOR)
    };
    boss.lanterns.push(lantern);
    targetList.push(lantern);
  }
}

/**
 * Distância euclidiana mínima de um ponto a um segmento de reta.
 */
export function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/**
 * Atualiza posições, oscilação física, colisão de dano das Lanternas e a Rede de Lasers (Spirit Lattice).
 * @param {Object} e
 * @param {number} dt
 * @param {Object} context
 */
export function updateReaperLanterns(e, dt, context) {
  const bob = e.isVulnerable ? 22 : (e.floatBob || 0);

  for (let l of e.lanterns) {
    if (l.hitFlash > 0) l.hitFlash -= dt;
    if (l.hitCd > 0) l.hitCd -= dt;
    if (l.axeHitCd > 0) l.axeHitCd -= dt;

    if (!l.active) continue;

    l.angle += e.lanternAngularSpeed * dt;
    l.sway = l.sway || 0;
    l.swayVel = ((l.swayVel || 0) - 0.06 * l.sway) * 0.94;
    l.sway += l.swayVel * dt;

    l.x = e.x + Math.cos(l.angle) * l.dist;
    l.y = e.y + Math.sin(l.angle) * (l.dist * REAPER_CONFIG.LANTERN_DIST_Y_FACTOR) + bob + l.sway;

    if (l.hp <= 0) {
      destroyLantern(e, l, l.x, l.y, context);
    }
  }

  // REDE DE LASERS ESPIRITUAIS (Spirit Lattice): Colisão de contato entre lanternas adjacentes ativas
  const { player } = context;
  if (
    player && 
    player.hp > 0 && 
    player.bossIFrames <= 0 && 
    e.hp > 0 && 
    !e.isVulnerable && 
    e.actionState !== REAPER_STATES.SPAWN_INTRO &&
    e.actionState !== REAPER_STATES.RECOVERY &&
    e.lanterns && 
    e.lanterns.length > 1
  ) {
    const n = e.lanterns.length;
    const laserThreshold = (player.radius || 14) + (REAPER_CONFIG.LATTICE_LASER_WIDTH || 14) * 0.5;

    for (let i = 0; i < n; i++) {
      const nextIdx = (i + 1) % n;
      const la = e.lanterns[i];
      const lb = e.lanterns[nextIdx];

      if (la.active && lb.active) {
        const d = distToSegment(player.x, player.y, la.x, la.y, lb.x, lb.y);
        if (d <= laserThreshold) {
          const dmg = Math.round(e.damage * (REAPER_CONFIG.LATTICE_LASER_DAMAGE_RATIO || 0.20));
          damagePlayerFromBoss(player, dmg, "Rede de Lasers Espirituais", context, e.isEnraged ? '#ff4757' : '#00cec9');
          playSfx('forcefield');
          if (context.triggerShake) context.triggerShake(5);
          if (context.triggerHaptic) context.triggerHaptic('medium');

          // Repulsão radial para fora do centro da órbita
          const pdx = player.x - e.x;
          const pdy = player.y - e.y;
          const pDist = Math.hypot(pdx, pdy) || 1;
          player.x += (pdx / pDist) * 18;
          player.y += (pdy / pDist) * 18;
          break;
        }
      }
    }
  }
}

/**
 * Destruição de Lanterna: causa dano retaliatório ao chefe (5% HP), dropa Fragmento de Alma e gera Colapso Espiritual de 2.0s se todas caírem.
 * @param {Object} boss
 * @param {Object} lantern
 * @param {number} lx
 * @param {number} ly
 * @param {Object} context
 */
export function destroyLantern(boss, lantern, lx, ly, context) {
  lantern.active = false;

  const idx = enemies.indexOf(lantern);
  if (idx !== -1) enemies.splice(idx, 1);

  // Mecânica de Contragolpe (Backlash: 5% do HP máximo do chefe)
  const backlashDmg = Math.round(boss.maxHp * 0.05);
  boss.hp -= backlashDmg;

  // Drop do Fragmento de Alma (Recompensa Ativa ao Jogador)
  if (!boss.soulShards) boss.soulShards = [];
  boss.soulShards.push({
    x: lx,
    y: ly,
    radius: 12,
    life: 900, // 15 segundos no chão
    maxLife: 900,
    bobOffset: Math.random() * Math.PI * 2
  });

  playSfx('shatter');
  context.triggerShake(12);
  triggerHaptic('heavy');
  context.createHitParticles(lx, ly, '#00cec9', 22);
  context.createHitParticles(lx, ly, '#81ecec', 14);
  context.addDamageText(boss.x, boss.y, backlashDmg, true, '#f1c40f');
  context.addDamageText(lx, ly, "FRAGMENTO DE ALMA LIBERADO!", true, '#00cec9');

  // Ao destruir a última lanterna da fase: Colapso por 2.0 segundos
  const activeCount = boss.lanterns.filter(o => o.active).length;
  if (activeCount === 0 && boss.actionState !== REAPER_STATES.RECOVERY && boss.actionState !== REAPER_STATES.ENRAGE_TRANSITION) {
    if (boss.actionState === REAPER_STATES.SPAWN_INTRO) {
      boss.pendingCollapse = true;
    } else {
      boss.actionState = REAPER_STATES.RECOVERY;
      boss.recoveryTimer = REAPER_CONFIG.RECOVERY_DURATION;
      boss.isVulnerable = true;
      boss.isTargetable = true;

      context.triggerShake(16);
      triggerHaptic('heavy');
      playSfx('boss');
      context.addDamageText(boss.x, boss.y, "COLAPSO ESPIRITUAL (2.0s)!", true, '#81ecec');
    }
  }
}

/**
 * Atualiza atração, coleta e expiração dos Fragmentos de Alma deixados pelas lanternas.
 * @param {Object} e
 * @param {number} dt
 * @param {Object} context
 */
export function updateSoulShards(e, dt, context) {
  if (!e.soulShards || e.soulShards.length === 0) return;
  const { player, addDamageText, createHitParticles } = context;
  if (!player) return;

  for (let i = e.soulShards.length - 1; i >= 0; i--) {
    const s = e.soulShards[i];
    s.life -= dt;
    s.bobOffset += 0.05 * dt;

    const pdx = player.x - s.x;
    const pdy = player.y - s.y;
    const dist = Math.hypot(pdx, pdy);

    // Atração suave se o jogador estiver próximo (140px)
    if (dist < 140 && dist > 1) {
      const pull = 4.2 * dt;
      s.x += (pdx / dist) * pull;
      s.y += (pdy / dist) * pull;
    }

    // Coleta do Fragmento
    if (dist <= (player.radius || 14) + s.radius) {
      const healAmt = REAPER_CONFIG.SOUL_SHARD_HEAL || 15;
      player.hp = Math.min(player.maxHp || 120, player.hp + healAmt);
      player.soulSpeedBuffTimer = REAPER_CONFIG.SOUL_SHARD_SPEED_DURATION || 180;

      playSfx('gem');
      playSfx('chest_rare');
      if (context.triggerHaptic) context.triggerHaptic('medium');
      addDamageText(player.x, player.y, `+${healAmt} HP & +20% VELOCIDADE!`, true, '#00cec9');
      createHitParticles(s.x, s.y, '#81ecec', 16);
      createHitParticles(s.x, s.y, '#ffffff', 8);

      e.soulShards.splice(i, 1);
      continue;
    }

    if (s.life <= 0) {
      e.soulShards.splice(i, 1);
    }
  }
}

/**
 * Atualiza a atração contínua e drenagem do Vínculo de Almas (Soul Tether 2.0 com tensão e recuo defensivo).
 * @param {Object} e
 * @param {number} dt
 * @param {Object} context
 */
export function updateSoulTether(e, dt, context) {
  if (!e.tetherActive) {
    e.tetherTension = 0;
    return;
  }

  const { player, triggerShake, triggerHaptic, addDamageText, createHitParticles } = context;
  const dx = e.x - player.x;
  const dy = e.y - player.y;
  const dist = Math.hypot(dx, dy);

  // Calcula a tensão da corrente (0 a 1) para exibição gráfica de estiramento
  const minTensionDist = 120;
  const maxTensionDist = e.tetherMaxDist || 310;
  e.tetherTension = Math.min(1.0, Math.max(0, (dist - minTensionDist) / (maxTensionDist - minTensionDist)));

  if (dist > e.tetherMaxDist) {
    e.tetherActive = false;
    e.tetherTension = 0;
    triggerShake(9);
    if (triggerHaptic) triggerHaptic('heavy');
    addDamageText(player.x, player.y, "VÍNCULO QUEBRADO! RECUO DEFENSIVO!", true, '#2ecc71');
    playSfx('crit');
    playSfx('warp');

    // Recuo Defensivo: onda de repulsão afasta Thanatos levemente, recompensando o jogador com espaço
    const repelAngle = Math.atan2(e.y - player.y, e.x - player.x);
    e.x += Math.cos(repelAngle) * 32;
    e.y += Math.sin(repelAngle) * 32;
    createHitParticles(player.x, player.y, '#2ecc71', 16);
    createHitParticles(e.x, e.y, '#00cec9', 14);
    return;
  }

  e.tetherTimer -= dt;
  player.x += (dx / dist) * 0.65 * dt;
  player.y += (dy / dist) * 0.65 * dt;

  if (Math.floor(context.frameCount) % 15 === 0) {
    if (player.iFrames <= 0) {
      player.hp -= 5;
      player.iFrames = 15;
      playSfx('hit');
      addDamageText(player.x, player.y, "-5", false, '#00cec9');
      createHitParticles(player.x, player.y, '#00cec9', 3);
    }
    e.hp = Math.min(e.maxHp, e.hp + 45);
    createHitParticles(e.x, e.y, '#2ecc71', 2);
  }

  // Partículas de sucção da essência vital fluindo para o núcleo do Ceifador
  if (Math.floor(context.frameCount) % 4 === 0) {
    const streamT = Math.random();
    const sx = player.x + dx * streamT;
    const sy = player.y + dy * streamT;
    createHitParticles(sx, sy, e.tetherTension > 0.6 ? '#ff4757' : '#81ecec', 1);
  }

  if (e.tetherTimer <= 0) {
    e.tetherActive = false;
    e.tetherTension = 0;
  }
}

/**
 * Agenda uma ação para ser executada após delayFrames.
 * @param {Object} boss
 * @param {number} delayFrames
 * @param {Function} callback
 */
export function scheduleDelayedAction(boss, delayFrames, callback) {
  if (!boss.delayedActions) boss.delayedActions = [];
  boss.delayedActions.push({
    timer: delayFrames,
    callback: callback
  });
}

/**
 * Atualiza e executa a fila de ações agendadas do chefe.
 * @param {Object} boss
 * @param {number} dt
 */
export function updateDelayedActions(boss, dt) {
  if (!boss.delayedActions || boss.delayedActions.length === 0) return;
  for (let i = boss.delayedActions.length - 1; i >= 0; i--) {
    const action = boss.delayedActions[i];
    action.timer -= dt;
    if (action.timer <= 0) {
      if (typeof action.callback === 'function') {
        action.callback();
      }
      boss.delayedActions.splice(i, 1);
    }
  }
}

/**
 * Aplica dano com amortecimento de armadura, feedback visual e SFX ao jogador.
 */
export function damagePlayerFromBoss(player, damage, attackerName, context, hitColor = '#00cec9') {
  if (!player || player.bossIFrames > 0) return false;
  let finalDmg = damage;
  if (selectedHeroKey === 'KNIGHT') finalDmg = Math.round(finalDmg * 0.80);

  // One-Shot Protection (OSP): se o jogador estiver com vida cheia (>= 90%), um golpe isolado não pode ultrapassar 80% do HP máximo
  const playerMaxHp = player.maxHp || 100;
  let ospTriggered = false;
  if (player.hp / playerMaxHp >= 0.90 && finalDmg >= player.hp) {
    finalDmg = Math.floor(playerMaxHp * 0.80);
    ospTriggered = true;
  }

  // Barreira Química (Shield de Valéria)
  if (player.tempShield && player.tempShield > 0) {
    const absorb = Math.min(player.tempShield, finalDmg);
    player.tempShield -= absorb;
    finalDmg -= absorb;
    if (context.addDamageText) {
      context.addDamageText(player.x, player.y - 35, `ESCUDO ABSORVEU -${absorb}`, true, '#a29bfe');
    }
    if (player.tempShield <= 0) player.tempShieldTimer = 0;
  }

  player.hp -= finalDmg;
  player.bossIFrames = ospTriggered ? 36 : 20;
  if (ospTriggered) {
    player.iFrames = Math.max(player.iFrames || 0, 36);
    if (context.addDamageText) {
      context.addDamageText(player.x, player.y - 25, "PROTEÇÃO DE SOBREVIDA!", true, '#2ecc71');
    }
  }

  if (typeof setLastAttackerInfo === 'function') {
    setLastAttackerInfo({
      name: (context.boss && context.boss.name) || 'Thanatos, o Ceifador Supremo',
      category: 'BOSS',
      attackName: attackerName || 'Golpe da Ceifa',
      damage: finalDmg,
      enemyType: 'BOSS_3'
    });
  } else if (typeof setLastAttackerName === 'function') {
    setLastAttackerName(attackerName);
  }
  playSfx('hit');
  if (context.triggerShake) context.triggerShake(9);
  if (context.addDamageText) context.addDamageText(player.x, player.y, `-${finalDmg}`, false, hitColor);
  if (context.createHitParticles) context.createHitParticles(player.x, player.y, hitColor, 8);
  if (player.hp <= 0) {
    player.hp = 0;
    triggerDeath();
    return true;
  }
  return false;
}

/**
 * Atualiza o voo, moedor giratório e retorno da Foice Bumerangue de Thanatos.
 */
export function updateScytheBoomerang(boss, dt, context) {
  const S = boss.boomerangScythe;
  if (!S || !S.active) return;

  const { player, enemyBullets, createHitParticles, triggerShake } = context;

  S.angle += S.rotSpeed * dt;

  if (Math.floor(context.frameCount || 0) % 2 === 0) {
    createHitParticles(S.x, S.y, '#00cec9', 1);
    createHitParticles(S.x, S.y, '#81ecec', 1);
  }

  // Colisão contínua de dano com o jogador
  const pdx = player.x - S.x;
  const pdy = player.y - S.y;
  const pDist = Math.hypot(pdx, pdy);
  if (pDist <= S.radius + (player.radius || 14)) {
    damagePlayerFromBoss(player, Math.round(boss.damage * 0.25), "Foice Bumerangue", context, '#00cec9');
  }

  if (S.state === 'OUT') {
    S.x += S.vx * dt;
    S.y += S.vy * dt;
    S.travelDist += Math.hypot(S.vx, S.vy) * dt;

    if (S.travelDist >= S.maxDist) {
      S.state = 'GRINDING';
      S.grindTimer = REAPER_CONFIG.BOOMERANG_GRIND_TIME || 42;
      playSfx('singularity');
      triggerShake(6);
    }
  } else if (S.state === 'GRINDING') {
    S.grindTimer -= dt;
    S.rotSpeed = 0.65; // Rotação ultra veloz de moedor
    S.x += (Math.random() - 0.5) * 2;
    S.y += (Math.random() - 0.5) * 2;

    if (Math.floor(context.frameCount || 0) % 3 === 0) {
      triggerShake(1.5);
      const sparkAng = Math.random() * Math.PI * 2;
      createHitParticles(S.x + Math.cos(sparkAng) * S.radius, S.y + Math.sin(sparkAng) * S.radius, '#00cec9', 2);
    }

    if (S.grindTimer <= 0) {
      S.state = 'RETURNING';
      playSfx('warp');
    }
  } else if (S.state === 'RETURNING') {
    const bdx = boss.x - S.x;
    const bdy = boss.y - S.y;
    const bDist = Math.hypot(bdx, bdy) || 1;
    const returnSpeed = (REAPER_CONFIG.BOOMERANG_SPEED || 9.5) * 1.25;

    S.x += (bdx / bDist) * returnSpeed * dt;
    S.y += (bdy / bDist) * returnSpeed * dt;
    S.rotSpeed = 0.45;

    if (bDist <= 42) {
      // Capturada com sucesso!
      S.active = false;
      boss.boomerangScythe = null;
      boss.isUnarmed = false;
      boss.scytheAngle = 0.4;
      boss.scytheTargetAngle = 0.4;
      boss.scytheGlow = 1.0;

      playSfx('crit');
      playSfx('boss');
      triggerShake(9);
      triggerHaptic('medium');
      createHitParticles(boss.x, boss.y, '#00cec9', 20);

      boss.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
      boss.actionTimer = 14;
    }
  }

  // Enquanto desarmado, Thanatos conjura dardos de fogo espiritual pelas mãos
  if (boss.isUnarmed && boss.actionState === REAPER_STATES.BOOMERANG_ACTIVE) {
    if (boss.unarmedDartTimer === undefined) boss.unarmedDartTimer = 0;
    boss.unarmedDartTimer -= dt;

    if (boss.unarmedDartTimer <= 0) {
      boss.unarmedDartTimer = boss.isEnraged ? 24 : 32;
      const angleToPlayer = Math.atan2(player.y - boss.y, player.x - boss.x);
      const spread = 0.25;

      for (let s of [-spread, spread]) {
        if (!canSpawnEnemyBullet(true)) break;
        const sAng = angleToPlayer + s;
        enemyBullets.push({
          x: boss.x + Math.cos(sAng) * 35,
          y: boss.y + Math.sin(sAng) * 35,
          vx: Math.cos(sAng) * 4.4,
          vy: Math.sin(sAng) * 4.4,
          radius: 6.5,
          damage: Math.round(boss.damage * 0.22),
          life: 110,
          isBossProjectile: true,
          bulletType: 'REAPER_SOUL_ORB',
          color: boss.isEnraged ? '#ff4757' : '#00cec9'
        });
      }
      playSfx('shoot');
      createHitParticles(boss.x, boss.y, '#81ecec', 4);
    }
  }
}

/**
 * Atualiza os Poços de Almas e erupção de chamas sepulcrais.
 */
export function updateSoulWells(boss, dt, context) {
  if (!boss.soulWells || boss.soulWells.length === 0) return;

  const { player, createHitParticles, triggerShake } = context;

  for (let i = boss.soulWells.length - 1; i >= 0; i--) {
    const well = boss.soulWells[i];

    if (!well.detonated) {
      well.timer -= dt;

      // Faíscas de aviso subindo do solo rúnico
      if (Math.floor(context.frameCount || 0) % 3 === 0) {
        const sDist = Math.random() * well.radius;
        const sAng = Math.random() * Math.PI * 2;
        createHitParticles(well.x + Math.cos(sAng) * sDist, well.y + Math.sin(sAng) * sDist, '#00cec9', 1);
      }

      if (well.timer <= 0) {
        well.detonated = true;
        well.miasmaTimer = 140; // 2.3s de miasma residual

        playSfx('shatter');
        triggerShake(7);

        // Detonação em pilar de fogo fátuo
        for (let p = 0; p < 18; p++) {
          createHitParticles(
            well.x + (Math.random() - 0.5) * well.radius,
            well.y + (Math.random() - 0.5) * well.radius - p * 3,
            '#00cec9',
            1
          );
        }

        const wpdx = player.x - well.x;
        const wpdy = player.y - well.y;
        if (Math.hypot(wpdx, wpdy) <= well.radius) {
          damagePlayerFromBoss(player, Math.round(boss.damage * 0.44), "Poço das Almas", context, '#00cec9');
        }
      }
    } else {
      // Miasma residual no chão
      well.miasmaTimer -= dt;

      if (Math.floor(context.frameCount || 0) % 8 === 0) {
        createHitParticles(
          well.x + (Math.random() - 0.5) * well.radius * 0.8,
          well.y + (Math.random() - 0.5) * well.radius * 0.8,
          '#00cec9',
          1
        );
      }

      const wpdx = player.x - well.x;
      const wpdy = player.y - well.y;
      if (Math.hypot(wpdx, wpdy) <= well.radius && Math.floor(context.frameCount || 0) % 20 === 0) {
        damagePlayerFromBoss(player, 6, "Miasma Sepulcral", context, '#00cec9');
      }

      if (well.miasmaTimer <= 0) {
        boss.soulWells.splice(i, 1);
      }
    }
  }
}

/**
 * Atualiza o rastreamento, travamento e impacto da Guilhotina Celestial (Marca da Morte).
 */
export function updateDeathMarkExecution(boss, dt, context) {
  if (boss.deathMark) {
    boss.deathMark.active = false;
    boss.deathMark = null;
  }
}

/**
 * Atualiza os clones e cortes convergentes da Tríade das Sombras.
 */
export function updateTriadSlash(boss, dt, context) {
  if (!boss.triadClones || boss.triadClones.length === 0) return;

  const { createHitParticles, triggerShake, bossTelegraphs } = context;

  for (let i = boss.triadClones.length - 1; i >= 0; i--) {
    const clone = boss.triadClones[i];
    clone.timer -= dt;

    if (Math.floor(context.frameCount || 0) % 4 === 0) {
      createHitParticles(clone.x, clone.y, '#00cec9', 1);
    }

    if (clone.timer <= 0 && !clone.slashed) {
      clone.slashed = true;
      clone.fadeTimer = 20;

      playSfx('crit');
      triggerShake(10);

      // Corte em direção ao centro do triângulo
      bossTelegraphs.push({
        type: 'SCYTHE_CLEAVE',
        x: clone.x,
        y: clone.y,
        radius: 175,
        angle: clone.slashAngle,
        timer: 36, // Piso de 36f (600ms)
        maxTimer: 36,
        damage: Math.round(boss.damage * 0.32),
        color: '#00cec9',
        colorRgb: '0, 206, 201',
        boss: boss
      });
    }

    if (clone.slashed) {
      clone.fadeTimer -= dt;
      clone.alpha = Math.max(0, clone.fadeTimer / 20);
      if (clone.fadeTimer <= 0) {
        boss.triadClones.splice(i, 1);
      }
    }
  }
}

/**
 * Atualiza o Badalo Fúnebre (Death Toll): emissão rítmica de ondas sonoras de 360° com frestas de fuga rotativas.
 * @param {Object} boss
 * @param {number} dt
 * @param {Object} context
 */
export function updateDeathToll(boss, dt, context) {
  const S = boss.deathToll;
  if (!S || !S.active) return;

  const { player, triggerShake, triggerHaptic, addDamageText, createHitParticles } = context;

  // Atualiza posição do sino ancorado na cabeça de Thanatos
  S.x = boss.x;
  S.y = boss.y - 70;

  // Emissão de badaladas
  if (S.chimeCount < S.maxChimes) {
    S.timer -= dt;
    if (S.timer <= 0) {
      S.chimeCount++;
      S.timer = S.interval;

      playSfx('boss');
      playSfx('crit');
      if (triggerShake) triggerShake(10 + S.chimeCount * 2);
      if (triggerHaptic) triggerHaptic('heavy');
      if (addDamageText) addDamageText(boss.x, boss.y - 85, `BADALO FÚNEBRE (${S.chimeCount}/${S.maxChimes})!`, true, '#f1c40f');

      // Cria onda sonora concêntrica com frestas seguras aleatórias e imprevisíveis
      let baseGapAngle = Math.random() * Math.PI * 2;
      if (S.lastGapAngle !== undefined) {
        // Garante rotação significativa para nunca coincidir com a anterior (pelo menos 46 a 80 graus)
        const shift = 0.8 + Math.random() * 0.6;
        baseGapAngle = (S.lastGapAngle + shift) % (Math.PI * 2);
      }
      S.lastGapAngle = baseGapAngle;

      S.rings.push({
        radius: 25,
        maxRadius: REAPER_CONFIG.DEATH_TOLL_RING_MAX_RADIUS || 680,
        speed: REAPER_CONFIG.DEATH_TOLL_RING_SPEED || 4.03,
        damage: Math.round(boss.damage * (REAPER_CONFIG.DEATH_TOLL_RING_DAMAGE || 0.22)),
        baseGapAngle: baseGapAngle,
        gapCount: 3,
        gapHalfWidth: REAPER_CONFIG.DEATH_TOLL_GAP_HALF_WIDTH || 0.585, // +30% largura da abertura segura (0.45 -> 0.585 rad, ~67 graus por fresta)
        hitPlayer: false,
        chimeIndex: S.chimeCount
      });
    }
  }

  // Atualiza anéis sônicos
  for (let r = S.rings.length - 1; r >= 0; r--) {
    const ring = S.rings[r];
    ring.radius += ring.speed * dt;

    if (player && player.hp > 0 && (player.bossIFrames || 0) <= 0 && !ring.hitPlayer) {
      const pdx = player.x - boss.x;
      const pdy = player.y - boss.y;
      const pDist = Math.hypot(pdx, pdy);

      // Colisão quando o anel atinge a distância do jogador
      if (Math.abs(pDist - ring.radius) <= (player.radius || 14) + 12) {
        const pAng = Math.atan2(pdy, pdx);

        // Verifica se o jogador está em alguma das 3 frestas seguras
        let inSafeGap = false;
        for (let g = 0; g < ring.gapCount; g++) {
          const gapCenter = ring.baseGapAngle + (g * Math.PI * 2) / ring.gapCount;
          let diff = Math.abs(pAng - gapCenter);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

          if (diff <= ring.gapHalfWidth) {
            inSafeGap = true;
            break;
          }
        }

        if (inSafeGap) {
          // Jogador atravessou com sucesso pela fresta segura!
          if (createHitParticles) createHitParticles(player.x, player.y, '#2ecc71', 4);
        } else {
          ring.hitPlayer = true;
          damagePlayerFromBoss(player, ring.damage, "Badalo Fúnebre", context, '#81ecec');
          player.judgmentSlowTimer = REAPER_CONFIG.DEATH_TOLL_SLOW_DURATION || 150;
          if (addDamageText) addDamageText(player.x, player.y, "MARCA DO JULGAMENTO (-25% VEL)!", false, '#81ecec');
          if (createHitParticles) createHitParticles(player.x, player.y, '#81ecec', 16);
          if (triggerShake) triggerShake(9);
        }
      }
    }

    if (ring.radius >= ring.maxRadius) {
      S.rings.splice(r, 1);
    }
  }

  // Conclusão do ataque
  if (S.chimeCount >= S.maxChimes && S.rings.length === 0) {
    boss.deathToll = null;
    if (boss.actionState === REAPER_STATES.DEATH_TOLL_ACTIVE) {
      boss.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
      boss.actionTimer = boss.isEnraged ? 14 : 18;
    }
  }
}

/**
 * Atualiza as Fendas Dimensionais (Veil Cleave): atração gravitacional, detonação dimensional e estilhaços perpendiculares.
 * @param {Object} boss
 * @param {number} dt
 * @param {Object} context
 */
export function updateVeilCleaves(boss, dt, context) {
  if (!boss.veilCleaves || boss.veilCleaves.length === 0) return;

  const { player, enemyBullets, bossShockwaves, createHitParticles, triggerShake, triggerHaptic } = context;

  for (let i = boss.veilCleaves.length - 1; i >= 0; i--) {
    const vc = boss.veilCleaves[i];

    if (!vc.exploded) {
      vc.timer -= dt;

      // Partículas ao longo do corte durante a carga
      if (Math.floor(context.frameCount || 0) % 3 === 0) {
        const step = (Math.random() - 0.5) * vc.length;
        const cosA = Math.cos(vc.angle);
        const sinA = Math.sin(vc.angle);
        const px = vc.x + cosA * step;
        const py = vc.y + sinA * step;
        if (createHitParticles) createHitParticles(px, py, vc.isEnraged ? '#ff4757' : '#00cec9', 1);
      }

      // Atração gravitacional sutil em direção à fenda
      if (player && player.hp > 0) {
        const cosA = Math.cos(vc.angle);
        const sinA = Math.sin(vc.angle);
        const pdx = player.x - vc.x;
        const pdy = player.y - vc.y;
        const perpDist = -pdx * sinA + pdy * cosA;
        const proj = pdx * cosA + pdy * sinA;

        if (Math.abs(proj) <= vc.length * 0.55 && Math.abs(perpDist) < 160 && Math.abs(perpDist) > 4) {
          const pull = (boss.isEnraged ? 0.70 : 0.45) * dt * (perpDist > 0 ? -1 : 1);
          player.x += -sinA * pull;
          player.y += cosA * pull;
        }
      }

      // Detonação Dimensional
      if (vc.timer <= 0) {
        vc.exploded = true;
        vc.fadeTimer = 24;

        playSfx('shatter');
        playSfx('warp');
        if (triggerShake) triggerShake(14);
        if (triggerHaptic) triggerHaptic('heavy');

        if (bossShockwaves) {
          bossShockwaves.push({
            x: vc.x,
            y: vc.y,
            radius: 20,
            maxRadius: 260,
            speed: 8.5,
            damage: Math.round(boss.damage * 0.28),
            colorRgb: vc.isEnraged ? '255, 71, 87' : '0, 206, 201',
            isReaperWave: true,
            hitPlayer: false
          });
        }

        const cosA = Math.cos(vc.angle);
        const sinA = Math.sin(vc.angle);
        const halfLen = vc.length * 0.5;

        // Efeito visual colossal de partículas na cicatriz
        if (createHitParticles) {
          for (let p = 0; p < 28; p++) {
            const t = (Math.random() - 0.5) * vc.length;
            createHitParticles(vc.x + cosA * t, vc.y + sinA * t, vc.isEnraged ? '#ff4757' : '#00cec9', 2);
            createHitParticles(vc.x + cosA * t, vc.y + sinA * t, '#ffffff', 1);
          }
        }

        // Verificação de dano no eixo central da fenda (largura ampliada 3x)
        if (player && (player.bossIFrames || 0) <= 0 && player.hp > 0) {
          const pdx = player.x - vc.x;
          const pdy = player.y - vc.y;
          const proj = pdx * cosA + pdy * sinA;
          const perpDist = Math.abs(-pdx * sinA + pdy * cosA);

          if (Math.abs(proj) <= halfLen && perpDist <= (vc.width * 0.5) + (player.radius || 14)) {
            damagePlayerFromBoss(player, vc.damage, "Rasgo do Véu", context, vc.isEnraged ? '#ff4757' : '#00cec9');
          }
        }

        // Disparo de Orbes de Alma do Ceifador perpendicularmente à linha (reestilizados)
        if (enemyBullets && typeof canSpawnEnemyBullet === 'function' && canSpawnEnemyBullet(true)) {
          const normalA1 = vc.angle + Math.PI * 0.5;
          const normalA2 = vc.angle - Math.PI * 0.5;
          const shardCount = 4;

          for (let s = 0; s < shardCount; s++) {
            const offset = (s - (shardCount - 1) / 2) * (vc.length * 0.22);
            const sx = vc.x + cosA * offset;
            const sy = vc.y + sinA * offset;

            for (const nAngle of [normalA1, normalA2]) {
              enemyBullets.push({
                x: sx,
                y: sy,
                vx: Math.cos(nAngle) * 5.2,
                vy: Math.sin(nAngle) * 5.2,
                radius: 6.5,
                damage: Math.round(boss.damage * 0.22),
                life: 65,
                isBossProjectile: true,
                bulletType: 'REAPER_SOUL_ORB',
                color: vc.isEnraged ? '#ff4757' : '#00cec9'
              });
            }
          }
        }
      }
    } else {
      vc.fadeTimer -= dt;
      if (vc.fadeTimer <= 0) {
        boss.veilCleaves.splice(i, 1);
      }
    }
  }
}

/**
 * Remove os sub-alvos das Correntes do Purgatório do array de inimigos.
 */
export function cleanupPurgatoryChains(boss, targetList = enemies) {
  if (!boss) return;
  if (targetList && Array.isArray(targetList)) {
    for (let i = targetList.length - 1; i >= 0; i--) {
      const e = targetList[i];
      if (e.parentBoss === boss && e.baseType === 'PURGATORY_ANCHOR') {
        targetList.splice(i, 1);
      }
    }
  }
  boss.purgatoryChains = null;
  boss.sinnerShadow = null;
}



/**
 * Verifica e processa o Fogo Amigo Induzido (Cleave Parricide) contra as âncoras da jaula.
 * Destrói instantaneamente a âncora atingida e atordoa Thanatos por 1.2 segundos.
 */
export function checkCleaveParricide(boss, context) {
  const P = boss.purgatoryChains;
  if (!P || !P.active || !P.anchors) return false;

  const { triggerShake, triggerHaptic, addDamageText, createHitParticles, bossTelegraphs } = context;

  let parricideTriggered = false;

  for (let a of P.anchors) {
    if (!a.active) continue;

    let hitByBoss = false;

    // Colisão com telegrafia de SCYTHE_CLEAVE
    if (bossTelegraphs && Array.isArray(bossTelegraphs)) {
      for (let t = bossTelegraphs.length - 1; t >= 0; t--) {
        const tel = bossTelegraphs[t];
        if (tel.boss === boss && tel.type === 'SCYTHE_CLEAVE') {
          const cdx = a.x - tel.x;
          const cdy = a.y - tel.y;
          const cDist = Math.hypot(cdx, cdy);
          const aAng = Math.atan2(cdy, cdx);
          let diff = Math.abs(aAng - tel.angle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

          const maxAng = tel.arcHalf !== undefined ? tel.arcHalf : Math.PI * 0.55;
          if (cDist <= tel.radius + a.radius && diff <= maxAng) {
            hitByBoss = true;
            bossTelegraphs.splice(t, 1);
            break;
          }
        }
      }
    }

    // Colisão direta corpo a corpo se Thanatos estiver executando cleave rente à âncora
    if (!hitByBoss && boss.actionState === REAPER_STATES.PURGATORY_CHAINS_ACTIVE && (boss.currentSkill === 'DOUBLE_CLEAVE' || boss.currentSkill === 'PHANTOM_TRIAD_SLASH')) {
      const bdx = a.x - boss.x;
      const bdy = a.y - boss.y;
      const bDist = Math.hypot(bdx, bdy);
      if (bDist <= (REAPER_CONFIG.CHAINS_PARRICIDE_RADIUS || 180)) {
        hitByBoss = true;
      }
    }

    if (hitByBoss) {
      a.hp = 0;
      a.active = false;
      a.isTargetable = false;
      P.brokenCount++;
      parricideTriggered = true;

      // Dropa Fragmento de Alma de recompensa
      if (!boss.soulShards) boss.soulShards = [];
      boss.soulShards.push({
        x: a.x,
        y: a.y,
        radius: 12,
        bobOffset: Math.random() * Math.PI * 2,
        collected: false
      });

      // Aplica Stun Retaliatório imediato no Ceifador (1.2 segundos = 72 frames)
      boss.actionState = REAPER_STATES.RECOVERY;
      boss.recoveryTimer = REAPER_CONFIG.CHAINS_STUN_DURATION || 72;
      boss.isVulnerable = true;
      boss.collapseProgress = 0.6;

      playSfx('shatter');
      playSfx('crit');
      if (triggerShake) triggerShake(16);
      if (triggerHaptic) triggerHaptic('heavy');
      if (createHitParticles) createHitParticles(a.x, a.y, '#ff4757', 28);
      if (addDamageText) addDamageText(boss.x, boss.y - 65, "PARRICÍDIO! CEIFADOR ATORDOADO!", true, '#ff4757');
      break;
    }
  }

  return parricideTriggered;
}

/**
 * Confinamento perimetral inabalável para as Correntes do Purgatório.
 * Impede que qualquer habilidade de investida / ULT (Sir Roland, Ignis) ou movimento
 * atravesse as correntes intactas da jaula, aplicando sliding collision com deflexão de velocidade.
 */
export function confinePlayerToPurgatoryChains(player, boss, dt = 1, context = {}) {
  const P = boss?.purgatoryChains;
  if (!P || !P.active || !player || player.hp <= 0) return;
  if ((P.brokenCount || 0) >= (REAPER_CONFIG.CHAINS_COLLAPSE_COUNT || 1)) return;
  // Se qualquer âncora foi destruída ou está inativa, a jaula se abre imediatamente: nenhuma barreira invisível pode prender o jogador
  if (P.anchors?.some(a => !a.active || a.hp <= 0)) return;

  const { triggerShake, triggerHaptic, addDamageText, createHitParticles } = context;
  const pRadius = player.radius || 14;
  const reqDist = pRadius + 4;
  let contactOccurred = false;

  // 1. Solução 3: O Elo Fraturado (Shattered Link Dash)
  if (P.shatteredLinkIndex !== undefined) {
    const s = P.shatteredLinkIndex;
    const a1 = P.anchors?.[s];
    const a2 = P.anchors?.[(s + 1) % 4];

    if (a1 && a2 && a1.active && a2.active) {
      const dLink = distToSegment(player.x, player.y, a1.x, a1.y, a2.x, a2.y);
      if (dLink <= reqDist + 16) {
        const isDashing = (player.dashDuration > 0) || (player.ignisDashDuration > 0) || (player.invisTimer > 0) || player.isPhasing || ((player.iFrames || 0) > 0);
        if (isDashing) {
          P.brokenCount = REAPER_CONFIG.CHAINS_COLLAPSE_COUNT || 1;
          playSfx('shatter');
          playSfx('crit');
          if (triggerShake) triggerShake(14);
          if (triggerHaptic) triggerHaptic('heavy');
          if (createHitParticles) createHitParticles(player.x, player.y, '#00cec9', 24);
          if (addDamageText) addDamageText(player.x, player.y, "ELO FRATURADO ROMPIDO!", true, '#00cec9');
          return; // Elo quebrado, jaula colapsada!
        }
      }
    }
  }

  // 2. Barreira de Confinamento Perimetral (impede passagem nas correntes intactas)
  if (P.anchors && (P.brokenCount || 0) < (REAPER_CONFIG.CHAINS_COLLAPSE_COUNT || 1)) {
    for (let k = 0; k < 4; k++) {
      const a1 = P.anchors[k];
      const a2 = P.anchors[(k + 1) % 4];
      if (!a1 || !a2 || !a1.active || !a2.active) continue;

      const dx = a2.x - a1.x;
      const dy = a2.y - a1.y;
      const segLen = Math.hypot(dx, dy);
      if (segLen < 1) continue;

      // Só interage com o segmento se o jogador estiver no intervalo longitudinal do mesmo
      const segProj = ((player.x - a1.x) * dx + (player.y - a1.y) * dy) / (segLen * segLen);
      if (segProj < -0.05 || segProj > 1.05) continue;

      const ux = dx / segLen;
      const uy = dy / segLen;

      // Vetor normal apontando firmemente para o interior da jaula (P.cx, P.cy)
      const midX = (a1.x + a2.x) * 0.5;
      const midY = (a1.y + a2.y) * 0.5;
      let inNx = -uy;
      let inNy = ux;
      if (inNx * (P.cx - midX) + inNy * (P.cy - midY) < 0) {
        inNx = -inNx;
        inNy = -inNy;
      }
      const outNx = -inNx;
      const outNy = -inNy;

      // Projeção ortogonal do jogador no segmento
      const t = Math.max(0, Math.min(1, segProj));
      const qx = a1.x + t * dx;
      const qy = a1.y + t * dy;

      // Distância orientada para o interior a partir do segmento
      const distIn = (player.x - qx) * inNx + (player.y - qy) * inNy;

      // Se o jogador estiver colidindo por dentro ou tiver atravessado para fora (tunneling da ULT)
      if (distIn < reqDist) {
        // Reposiciona firmemente dentro dos limites da jaula
        const correction = reqDist - distIn;
        player.x += inNx * correction;
        player.y += inNy * correction;
        contactOccurred = true;

        // Anula componentes de velocidade voltadas para fora (Sliding Collision)
        const vOut = (player.vx || 0) * outNx + (player.vy || 0) * outNy;
        if (vOut > 0) {
          player.vx -= vOut * outNx;
          player.vy -= vOut * outNy;
        }

        const pushOut = (player.pushVx || 0) * outNx + (player.pushVy || 0) * outNy;
        if (pushOut > 0) {
          player.pushVx -= pushOut * outNx;
          player.pushVy -= pushOut * outNy;
        }

        // Bloqueia avanço da investida de Sir Roland (KNIGHT)
        const dashOut = (player.dashVx || 0) * outNx + (player.dashVy || 0) * outNy;
        if (dashOut > 0) {
          player.dashVx -= dashOut * outNx;
          player.dashVy -= dashOut * outNy;
        }

        // Bloqueia avanço do Passo Ígneo de Ignis (MAGE)
        const ignisOut = (player.ignisDashVx || 0) * outNx + (player.ignisDashVy || 0) * outNy;
        if (ignisOut > 0) {
          player.ignisDashVx -= ignisOut * outNx;
          player.ignisDashVy -= ignisOut * outNy;
        }
      }
    }

    // 3. Salvaguarda Radial Global: restringe o jogador estritamente quando todas as 4 correntes estiverem 100% intactas
    if ((P.brokenCount || 0) === 0 && !P.anchors?.some(a => !a.active || a.hp <= 0)) {
      const pdx = player.x - P.cx;
      const pdy = player.y - P.cy;
      const pDist = Math.hypot(pdx, pdy);
      const maxPRadius = P.radius - reqDist;
      if (pDist > maxPRadius && pDist > 0) {
        player.x = P.cx + (pdx / pDist) * maxPRadius;
        player.y = P.cy + (pdy / pDist) * maxPRadius;

        const rNx = pdx / pDist;
        const rNy = pdy / pDist;

        const vDot = (player.vx || 0) * rNx + (player.vy || 0) * rNy;
        if (vDot > 0) { player.vx -= vDot * rNx; player.vy -= vDot * rNy; }

        const dashDot = (player.dashVx || 0) * rNx + (player.dashVy || 0) * rNy;
        if (dashDot > 0) { player.dashVx -= dashDot * rNx; player.dashVy -= dashDot * rNy; }

        const ignisDot = (player.ignisDashVx || 0) * rNx + (player.ignisDashVy || 0) * rNy;
        if (ignisDot > 0) { player.ignisDashVx -= ignisDot * rNx; player.ignisDashVy -= ignisDot * rNy; }

        contactOccurred = true;
      }
    }
  }

  if (contactOccurred) {
    if (createHitParticles && Math.floor(context.frameCount || 0) % 3 === 0) {
      createHitParticles(player.x, player.y, '#8e44ad', 3);
      createHitParticles(player.x, player.y, '#ffffff', 2);
    }
  }
}

/**
 * Atualiza o ciclo de vida da jaula das Correntes do Purgatório, checa as 3 soluções de escape
 * e confina o jogador aos limites do perímetro.
 */
export function updatePurgatoryChains(boss, dt, context) {
  const P = boss.purgatoryChains;
  if (!P || !P.active) return;

  const { player, triggerShake, triggerHaptic, addDamageText, createHitParticles } = context;

  // 1. Atualiza temporizadores das âncoras e checa destruição por dano direto do jogador
  for (let a of P.anchors) {
    if (!a.active) continue;
    a.hitFlash = Math.max(0, (a.hitFlash || 0) - dt);
    a.hitCd = Math.max(0, (a.hitCd || 0) - dt);
    a.axeHitCd = Math.max(0, (a.axeHitCd || 0) - dt);

    if (a.hp <= 0) {
      a.active = false;
      a.isTargetable = false;
      P.brokenCount++;

      if (!boss.soulShards) boss.soulShards = [];
      boss.soulShards.push({
        x: a.x,
        y: a.y,
        radius: 12,
        bobOffset: Math.random() * Math.PI * 2,
        collected: false
      });

      playSfx('shatter');
      if (triggerShake) triggerShake(10);
      if (createHitParticles) createHitParticles(a.x, a.y, '#00cec9', 20);
      if (addDamageText) addDamageText(a.x, a.y, "ÂNCORA DESTRUÍDA!", true, '#00cec9');
    }
  }

  // 2. Solução 1: Fogo Amigo Induzido (Cleave Parricide)
  checkCleaveParricide(boss, context);

  // 3 & 4. Confinamento perimetral e checagem do Elo Fraturado (Solução 3: Shattered Link Dash)
  confinePlayerToPurgatoryChains(player, boss, dt, context);

  // 5. Confina o próprio Ceifador dentro do raio da jaula
  if (P.brokenCount < (REAPER_CONFIG.CHAINS_COLLAPSE_COUNT || 1)) {
    const bdx = boss.x - P.cx;
    const bdy = boss.y - P.cy;
    const bDist = Math.hypot(bdx, bdy);
    const maxBRadius = P.radius - 20;
    if (bDist > maxBRadius && bDist > 0) {
      boss.x = P.cx + (bdx / bDist) * maxBRadius;
      boss.y = P.cy + (bdy / bDist) * maxBRadius;
    }
  }

  // 6. Verificação de Colapso Imediato: Se 1 única âncora foi destruída (ou timer esgotou), colapsa a jaula imediatamente!
  P.timer -= dt;

  if (P.brokenCount >= (REAPER_CONFIG.CHAINS_COLLAPSE_COUNT || 1) || P.timer <= 0) {
    cleanupPurgatoryChains(boss, context.enemies || (typeof enemies !== 'undefined' ? enemies : []));

    if (boss.actionState === REAPER_STATES.PURGATORY_CHAINS_ACTIVE) {
      boss.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
      boss.actionTimer = 18;
    }

    playSfx('boss');
    if (triggerShake) triggerShake(12);
    if (addDamageText) addDamageText(boss.x, boss.y - 50, "JAULA COLAPSADA!", true, '#00cec9');
  }
}

/**
 * Atualiza a Sombra do Pecador (Trial of the Mirror): rastreia posições passadas do jogador
 * e deposita chamas espectrais temporárias no chão.
 */
export function updateSinnerShadow(boss, dt, context) {
  const S = boss.sinnerShadow;
  if (!S || !S.active) return;

  const { player, createHitParticles } = context;

  // Atualiza rastro de chamas já deixadas no chão
  if (S.trail && S.trail.length > 0) {
    for (let i = S.trail.length - 1; i >= 0; i--) {
      const t = S.trail[i];
      t.life -= dt;

      if (player && player.hp > 0 && (player.bossIFrames || 0) <= 0) {
        const pdx = player.x - t.x;
        const pdy = player.y - t.y;
        if (Math.hypot(pdx, pdy) <= (player.radius || 14) + 12) {
          damagePlayerFromBoss(player, Math.round(boss.damage * (REAPER_CONFIG.SINNER_SHADOW_TRAIL_DAMAGE || 0.15)), "Sombra do Pecador", context, '#8e44ad');
          player.judgmentSlowTimer = 35;
          if (createHitParticles) createHitParticles(player.x, player.y, '#8e44ad', 6);
        }
      }

      if (t.life <= 0) {
        S.trail.splice(i, 1);
      }
    }
  }

  if (!player || player.hp <= 0) return;

  if (!S.history) S.history = [];
  S.history.push({ x: player.x, y: player.y });

  const maxDelay = REAPER_CONFIG.SINNER_SHADOW_DELAY || 90;
  if (S.history.length > maxDelay) {
    const past = S.history.shift();
    S.shadowX = past.x;
    S.shadowY = past.y;

    if (Math.floor(context.frameCount || 0) % 5 === 0) {
      if (!S.trail) S.trail = [];
      S.trail.push({
        x: past.x,
        y: past.y,
        life: REAPER_CONFIG.SINNER_SHADOW_TRAIL_LIFETIME || 70,
        maxLife: REAPER_CONFIG.SINNER_SHADOW_TRAIL_LIFETIME || 70
      });
    }
  }
}

/**
 * Atualiza a Marcha dos Condenados (Wall of the Restless): deslocamento da muralha de almas,
 * verificação das 2 frestas seguras, disparo de foices astrais e colisão letal.
 */
export function updateWallOfRestless(boss, dt, context) {
  const W = boss.wallOfRestless;
  if (!W || !W.active) return;

  const { player, enemyBullets, triggerShake, triggerHaptic, createHitParticles } = context;

  // 1. Deslocamento contínuo da muralha
  W.x += W.vx * dt;
  W.y += W.vy * dt;
  W.distTraveled = (W.distTraveled || 0) + (W.speed || 3.5) * dt;
  if (W.life !== undefined) {
    W.life -= dt;
  }

  // 2. Disparos rítmicos de foices astrais para forçar esquiva sob pressão
  if (W.fireTimer !== undefined) W.fireTimer -= dt;
  if (W.bladeCooldown !== undefined) W.bladeCooldown -= dt;
  const timer = W.fireTimer !== undefined ? W.fireTimer : (W.bladeCooldown !== undefined ? W.bladeCooldown : 0);
  if (timer <= 0 && enemyBullets && (typeof canSpawnEnemyBullet !== 'function' || canSpawnEnemyBullet(true))) {
    if (W.fireTimer !== undefined) W.fireTimer = boss.isPhase3 ? 34 : 46;
    if (W.bladeCooldown !== undefined) W.bladeCooldown = boss.isPhase3 ? 34 : 46;
    if (player && player.hp > 0) {
      const angleToPlayer = Math.atan2(player.y - boss.y, player.x - boss.x);
      const spread = (Math.random() - 0.5) * 0.40;
      enemyBullets.push({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angleToPlayer + spread) * 5.2,
        vy: Math.sin(angleToPlayer + spread) * 5.2,
        radius: 7.5,
        damage: Math.round((boss.damage || 240) * 0.24),
        life: 110,
        isBossProjectile: true,
        isAstralBlade: true,
        bulletType: 'ASTRAL_SCYTHE_SHARD',
        color: '#ff4757'
      });
      playSfx('shoot');
    }
  }

  // 3. Verificação de colisão do jogador com a muralha e suas 2 frestas seguras
  if (player && player.hp > 0) {
    const wallAngle = W.angle !== undefined ? W.angle : (W.dirAngle !== undefined ? W.dirAngle : 0);
    const wallThickness = W.thickness !== undefined ? W.thickness : (W.width !== undefined ? W.width : 52);
    const wallLength = W.length !== undefined ? W.length : 1400;
    const wallDamage = W.damage !== undefined ? W.damage : Math.round((boss.damage || 240) * 0.52);

    const pdx = player.x - W.x;
    const pdy = player.y - W.y;
    const cosA = Math.cos(wallAngle);
    const sinA = Math.sin(wallAngle);

    const tanX = -sinA;
    const tanY = cosA;

    const latDist = pdx * tanX + pdy * tanY;
    const perpDist = pdx * cosA + pdy * sinA;

    const halfWidth = (wallThickness * 0.5) + (player.radius || 14);
    const halfLen = wallLength * 0.5;

    if (Math.abs(perpDist) <= halfWidth && Math.abs(latDist) <= halfLen) {
      // Checa se o jogador está passando por alguma das 2 frestas seguras
      let inSafeGate = false;
      const gatesList = W.safeGates || (W.gates ? W.gates.map(g => ({ centerOffset: g, width: W.gateWidth || 90 })) : []);

      for (let g of gatesList) {
        const center = g.centerOffset !== undefined ? g.centerOffset : g;
        const gw = g.width !== undefined ? g.width : (W.gateWidth || 90);
        if (Math.abs(latDist - center) <= gw * 0.5) {
          inSafeGate = true;
          break;
        }
      }

      if (inSafeGate) {
        // Travessia bem sucedida pelo portal de fuga seguro!
        if (createHitParticles && Math.floor(context.frameCount || 0) % 3 === 0) {
          createHitParticles(player.x, player.y, '#2ecc71', 2);
        }
      } else {
        // Impacto letal com a muralha de almas fora das frestas
        if ((player.bossIFrames || 0) <= 0) {
          damagePlayerFromBoss(player, wallDamage, "Marcha dos Condenados", context, '#ff4757');
          player.x += cosA * 24;
          player.y += sinA * 24;
          if (triggerShake) triggerShake(14);
          if (triggerHaptic) triggerHaptic('heavy');
          if (createHitParticles) createHitParticles(player.x, player.y, '#ff4757', 20);
        }
      }
    }
  }

  // 4. Conclusão da Marcha dos Condenados
  if ((W.maxDist && W.distTraveled >= W.maxDist) || (W.life !== undefined && W.life <= 0)) {
    W.active = false;
    boss.wallOfRestless = null;

    if (boss.actionState === REAPER_STATES.WALL_OF_RESTLESS_ACTIVE) {
      boss.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
      boss.actionTimer = boss.isPhase3 ? 12 : 16;
    }
  }
}

/**
 * Verifica se Thanatos ainda possui ações, telegrafias ou animações ativas de um ataque anterior,
 * prevenindo o disparo prematuro de novos golpes enquanto a animação do golpe anterior não terminou.
 * @param {Object} boss
 * @param {Object} [context]
 * @returns {boolean}
 */
export function isReaperAttackActive(boss, context) {
  if (!boss) return false;

  // 1. Ações agendadas pendentes (ex: 2º corte do Double Cleave)
  if (boss.delayedActions && boss.delayedActions.length > 0) {
    return true;
  }

  // 2. Telegrafias de corte ou ataques pertencentes ao chefe ainda em tela
  if (context && context.bossTelegraphs && context.bossTelegraphs.some(t => t.boss === boss && (t.timer === undefined || t.timer > 0))) {
    return true;
  }

  // 3. Clones da Tríade das Sombras em execução de corte ou fade
  if (boss.triadClones && boss.triadClones.length > 0) {
    return true;
  }

  // 4. Fendas Dimensionais do Rasgo do Véu ainda em carga antes da detonação
  if (boss.veilCleaves && boss.veilCleaves.some(vc => !vc.exploded)) {
    return true;
  }

  // 5. Poços de Almas ainda em erupção
  if (boss.soulWells && boss.soulWells.some(w => !w.detonated)) {
    return true;
  }

  // 6. Retículo e impacto da Guilhotina da Morte
  if (boss.deathMark && boss.deathMark.active) {
    return true;
  }

  // 7. Foice Bumerangue em voo ou retalhação
  if (boss.boomerangScythe && boss.boomerangScythe.active) {
    return true;
  }

  // 8. Badalo Fúnebre ainda emitindo ou com anéis ativos
  if (boss.deathToll && boss.deathToll.active) {
    return true;
  }

  // 9. Ataque à distância (Soul Lances, Grave Cross, Wailing Ring) ativo
  if (boss.rangedAttack && [REAPER_STATES.WINDUP_RANGED, REAPER_STATES.RANGED_ATTACK].includes(boss.actionState)) {
    return true;
  }

  return false;
}


