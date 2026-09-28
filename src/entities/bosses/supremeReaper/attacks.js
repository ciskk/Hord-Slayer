import { t as matchText } from '../../../i18n/index.js';
/**
 * src/entities/bosses/supremeReaper/attacks.js
 * Arsenal de habilidades, seleção de skills e disparo de ataques do Ceifador Supremo.
 */

import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { REAPER_STATES, REAPER_SKILLS, REAPER_CONFIG } from './constants.js';
import { beginReaperRanged } from './rangedAttacks.js';
import { isReaperAttackActive } from './mechanics.js';

function checkAttackActive(boss, ctx) {
  if (typeof isReaperAttackActive === 'function') {
    return isReaperAttackActive(boss, ctx);
  }
  return Boolean(
    (boss.delayedActions && boss.delayedActions.length > 0) ||
    (ctx && ctx.bossTelegraphs && ctx.bossTelegraphs.some(t => t.boss === boss && (t.timer === undefined || t.timer > 0))) ||
    (boss.triadClones && boss.triadClones.length > 0) ||
    (boss.veilCleaves && boss.veilCleaves.some(vc => !vc.exploded)) ||
    (boss.soulWells && boss.soulWells.some(w => !w.detonated)) ||
    (boss.deathMark && boss.deathMark.active) ||
    (boss.boomerangScythe && boss.boomerangScythe.active) ||
    (boss.deathToll && boss.deathToll.active)
  );
}

/**
 * Seleciona a próxima habilidade com base em avaliação tática situacional (Envelope Anti-Whiff, Predição de Movimento e Combos).
 * Elimina ativações de Vínculo de Almas ou Colheita que quebravam ou erravam no vazio por falta de alcance.
 * @param {Object} e Entidade do chefe.
 * @param {number} dist Distância euclidiana até o jogador.
 * @param {Object} player Entidade do jogador.
 * @param {Object} [context] Contexto opcional para verificação de telegrafias ativas.
 */
export function selectReaperSkill(e, dist, player, context = null) {
  // Salvaguarda: se a animação ou impacto do ataque anterior ainda estiver em execução, não inicia novo ataque
  if (checkAttackActive(e, context)) {
    return;
  }

  const isEnraged = e.isEnraged || e.isPhase3;
  const isP3 = e.isPhase3;

  // Distância define o repertório; padrões novos exigem espaço para esquiva.
  const weights = {
    [REAPER_SKILLS.DOUBLE_CLEAVE]: 0,
    [REAPER_SKILLS.PHANTOM_BLINK]: 0,
    [REAPER_SKILLS.SOUL_SCYTHES]: 0,
    [REAPER_SKILLS.SOUL_TETHER]: 0,
    [REAPER_SKILLS.VORTEX_HARVEST]: 0,
    [REAPER_SKILLS.SCYTHE_BOOMERANG]: 0,
    [REAPER_SKILLS.DEATH_MARK_EXECUTION]: 0,
    [REAPER_SKILLS.SOUL_WELLS]: 0,
    [REAPER_SKILLS.PHANTOM_TRIAD_SLASH]: 0,
    [REAPER_SKILLS.PURGATORY_CHAINS]: 0,
    [REAPER_SKILLS.SOUL_LANCES]: dist >= 220 ? 42 : 0,
    [REAPER_SKILLS.GRAVE_CROSS]: dist >= 280 ? 38 : 0,
    [REAPER_SKILLS.WAILING_RING]: dist >= 240 ? 34 : 0,
    [REAPER_SKILLS.DEATH_TOLL]: dist >= 220 ? (isEnraged ? 36 : 28) : 0,
    [REAPER_SKILLS.VEIL_CLEAVE]: (dist >= 140 && dist <= 440) ? (isEnraged ? 36 : 26) : 0
  };

  // CÁLCULO DOS PESOS BASE POR FAIXA DE DISTÂNCIA
  if (dist < 170) {
    // Zona 0: Curta Distância / Melee (< 170px)
    weights[REAPER_SKILLS.DOUBLE_CLEAVE] = 45;
    weights[REAPER_SKILLS.VORTEX_HARVEST] = 25;
    if (!e.tetherActive) {
      weights[REAPER_SKILLS.SOUL_TETHER] = 25;
    }
    if (isEnraged) {
      weights[REAPER_SKILLS.PHANTOM_TRIAD_SLASH] = 35;
    }
    weights[REAPER_SKILLS.SOUL_SCYTHES] = 10;
    weights[REAPER_SKILLS.SOUL_WELLS] = 15;
    weights[REAPER_SKILLS.VEIL_CLEAVE] = 16;
    if (!e.purgatoryChains || !e.purgatoryChains.active) {
      const isMelee = player && (player.characterKey === 'KNIGHT' || player.characterKey === 'BARBARIAN' || player.selectedHeroKey === 'KNIGHT' || player.selectedHeroKey === 'BARBARIAN');
      weights[REAPER_SKILLS.PURGATORY_CHAINS] = isMelee ? (isEnraged ? 45 : 36) : (isEnraged ? 35 : 26);
    }
  } else if (dist <= 280) {
    // Zona 1: Médio Alcance (170px a 280px)
    weights[REAPER_SKILLS.PHANTOM_BLINK] = 35;
    weights[REAPER_SKILLS.SOUL_SCYTHES] = 30;
    weights[REAPER_SKILLS.SOUL_WELLS] = 30;
    weights[REAPER_SKILLS.VEIL_CLEAVE] = isEnraged ? 36 : 28;
    weights[REAPER_SKILLS.DEATH_TOLL] = 26;
    if (!e.purgatoryChains || !e.purgatoryChains.active) {
      weights[REAPER_SKILLS.PURGATORY_CHAINS] = isEnraged ? 32 : 24;
    }
    if (isEnraged) {
      weights[REAPER_SKILLS.SCYTHE_BOOMERANG] = 35;
      weights[REAPER_SKILLS.PHANTOM_TRIAD_SLASH] = 30;
      weights[REAPER_SKILLS.WALL_OF_RESTLESS] = isP3 ? 45 : 28;
    }
    if (!e.tetherActive && dist <= 260) {
      weights[REAPER_SKILLS.SOUL_TETHER] = 20;
    }
    if (dist <= 270) {
      weights[REAPER_SKILLS.VORTEX_HARVEST] = 20;
    }
  } else {
    // Zona 2: Longo Alcance (> 280px)
    // Anti-whiff rigoroso: fecha o espaço com bumerangue, lâminas ou blink!
    weights[REAPER_SKILLS.PHANTOM_BLINK] = 40;
    weights[REAPER_SKILLS.SOUL_SCYTHES] = 35;
    weights[REAPER_SKILLS.SOUL_WELLS] = 30;
    weights[REAPER_SKILLS.DEATH_TOLL] = isEnraged ? 38 : 30;
    weights[REAPER_SKILLS.VEIL_CLEAVE] = 22;
    if (!e.purgatoryChains || !e.purgatoryChains.active) {
      weights[REAPER_SKILLS.PURGATORY_CHAINS] = isEnraged ? 35 : 25;
    }
    if (isEnraged) {
      weights[REAPER_SKILLS.SCYTHE_BOOMERANG] = 45;
      weights[REAPER_SKILLS.WALL_OF_RESTLESS] = isP3 ? 50 : 32;
    }
  }

  // 2. Leitura Comportamental do Jogador
  if (player) {
    const pvx = player.vx || (player.pushVx || 0);
    const pvy = player.vy || (player.pushVy || 0);
    const isMoving = player.isMoving || Math.hypot(pvx, pvy) > 0.3;

    if (isMoving && dist > 200) {
      const pdx = player.x - e.x;
      const pdy = player.y - e.y;
      const isRetreating = (pvx * pdx + pvy * pdy) > 0;
      if (isRetreating) {
        // Jogador fugindo: intensifica o Phantom Blink para cortar a rota
        weights[REAPER_SKILLS.PHANTOM_BLINK] *= 1.40;
      }
    }

    // Sinergia com Lanternas Espirituais ativas: dispara mais foices cruzadas
    if (e.lanterns && e.lanterns.some(l => l.active) && dist >= 160) {
      weights[REAPER_SKILLS.SOUL_SCYTHES] *= 1.25;
    }

    // Sinergia da Balança do Julgamento (Dinâmica de HP do Jogador)
    const playerHpRatio = Math.max(0, Math.min(1, player.hp / (player.maxHp || 100)));
    if (playerHpRatio > 0.70) {
      // Balança pende para a Vida: Thanatos prioriza julgamento geométrico e controle de distância
      if (weights[REAPER_SKILLS.SOUL_LANCES] > 0) weights[REAPER_SKILLS.SOUL_LANCES] *= 1.45;
      if (weights[REAPER_SKILLS.GRAVE_CROSS] > 0) weights[REAPER_SKILLS.GRAVE_CROSS] *= 1.40;
      if (weights[REAPER_SKILLS.WAILING_RING] > 0) weights[REAPER_SKILLS.WAILING_RING] *= 1.35;
      if (weights[REAPER_SKILLS.PURGATORY_CHAINS] > 0) weights[REAPER_SKILLS.PURGATORY_CHAINS] *= 1.40;
      weights[REAPER_SKILLS.SOUL_SCYTHES] *= 1.25;
    } else if (playerHpRatio < 0.35) {
      // Balança pende para a Morte ("Sentença de Morte"): Thanatos se torna impiedoso e fecha distância
      weights[REAPER_SKILLS.PHANTOM_BLINK] *= 1.55;
      weights[REAPER_SKILLS.DOUBLE_CLEAVE] *= 1.45;
      weights[REAPER_SKILLS.VORTEX_HARVEST] *= 1.35;
    }
  }

  // 3. Anti-Spam: Reduz repetição consecutiva
  if (e.lastUsedSkill && weights[e.lastUsedSkill] > 0) {
    weights[e.lastUsedSkill] *= 0.20;
  }

  // Não repetir os padrões de controle nem sobrepor um vínculo que impeça a fuga.
  for (const skill of [REAPER_SKILLS.SOUL_LANCES, REAPER_SKILLS.GRAVE_CROSS, REAPER_SKILLS.WAILING_RING, REAPER_SKILLS.PURGATORY_CHAINS, REAPER_SKILLS.WALL_OF_RESTLESS]) {
    if (e.lastUsedSkill === skill || e.tetherActive || dist > 900) weights[skill] = 0;
  }
  if (e.purgatoryChains && e.purgatoryChains.active) {
    weights[REAPER_SKILLS.PURGATORY_CHAINS] = 0;
  }
  if (e.wallOfRestless && e.wallOfRestless.active) {
    weights[REAPER_SKILLS.WALL_OF_RESTLESS] = 0;
  }

  // 4. Sorteio Ponderado por Roleta
  let totalWeight = 0;
  for (const skillKey in weights) {
    totalWeight += weights[skillKey];
  }

  if (totalWeight <= 0) {
    weights[REAPER_SKILLS.SOUL_SCYTHES] = 1;
    totalWeight = 1;
  }

  let roll = Math.random() * totalWeight;
  let chosenSkill = REAPER_SKILLS.SOUL_SCYTHES;

  for (const skillKey in weights) {
    roll -= weights[skillKey];
    if (weights[skillKey] > 0 && roll <= 0) {
      chosenSkill = skillKey;
      break;
    }
  }

  // 5. Preparação e Configuração da Habilidade
  e.currentSkill = chosenSkill;

  switch (chosenSkill) {
    case REAPER_SKILLS.SOUL_LANCES:
    case REAPER_SKILLS.GRAVE_CROSS:
    case REAPER_SKILLS.WAILING_RING:
      beginReaperRanged(e, player, chosenSkill);
      playSfx('charge');
      break;

    case REAPER_SKILLS.DOUBLE_CLEAVE:
      e.actionState = REAPER_STATES.WINDUP;
      e.actionTimer = isEnraged ? 36 : 42; // Piso de 36f (600ms)
      break;

    case REAPER_SKILLS.PHANTOM_BLINK: {
      const pvx = player.vx || (player.pushVx || 0);
      const pvy = player.vy || (player.pushVy || 0);
      const isMoving = player.isMoving || Math.hypot(pvx, pvy) > 0.3;

      let leadX = 0;
      let leadY = 0;
      if (isMoving) {
        const leadDist = isEnraged ? 26 : 18;
        const moveLen = Math.hypot(pvx, pvy) || 1;
        leadX = (pvx / moveLen) * leadDist;
        leadY = (pvy / moveLen) * leadDist;
      }

      const predictedX = player.x + leadX;
      const predictedY = player.y + leadY;
      const angleToPlayer = Math.atan2(predictedY - e.y, predictedX - e.x);
      const flankOffset = (Math.random() < 0.5 ? 1 : -1) * (Math.PI * 0.32);
      const blinkAngle = angleToPlayer + flankOffset;
      const safeDistance = 155;

      const targetX = predictedX + Math.cos(blinkAngle) * safeDistance;
      const targetY = predictedY + Math.sin(blinkAngle) * safeDistance;
      const intendedCleaveAngle = Math.atan2(predictedY - targetY, predictedX - targetX);

      e.blinkTarget = {
        x: targetX,
        y: targetY,
        angle: blinkAngle,
        cleaveAngle: intendedCleaveAngle
      };

      e.actionState = REAPER_STATES.BLINK_AIM;
      e.actionTimer = isEnraged ? 36 : 46;
      break;
    }

    case REAPER_SKILLS.SOUL_SCYTHES:
      e.actionState = REAPER_STATES.WINDUP;
      e.actionTimer = isEnraged ? 36 : 42; // Piso de 36f (600ms)
      break;

    case REAPER_SKILLS.SOUL_TETHER:
      e.actionState = REAPER_STATES.WINDUP;
      e.actionTimer = isEnraged ? 36 : 42; // Piso de 36f (600ms)
      break;

    case REAPER_SKILLS.VORTEX_HARVEST:
      e.actionState = REAPER_STATES.WINDUP;
      e.actionTimer = isEnraged ? 36 : 44; // Piso de 36f (600ms)
      break;

    case REAPER_SKILLS.SCYTHE_BOOMERANG:
      e.actionState = REAPER_STATES.WINDUP_BOOMERANG;
      e.actionTimer = isEnraged ? 36 : 44; // Piso de 36f (600ms)
      break;

    case REAPER_SKILLS.DEATH_MARK_EXECUTION:
      e.actionState = REAPER_STATES.CHASE;
      e.skillCooldown = 18;
      break;

    case REAPER_SKILLS.SOUL_WELLS:
      e.actionState = REAPER_STATES.WINDUP_SOUL_WELLS;
      e.actionTimer = isEnraged ? 36 : 44; // Piso de 36f (600ms)
      break;

    case REAPER_SKILLS.PHANTOM_TRIAD_SLASH:
      e.actionState = REAPER_STATES.WINDUP_TRIAD_SLASH;
      e.actionTimer = REAPER_CONFIG.TRIAD_WINDUP || 38;
      break;

    case REAPER_SKILLS.DEATH_TOLL:
      e.actionState = REAPER_STATES.WINDUP_DEATH_TOLL;
      e.actionTimer = isEnraged ? 36 : 44; // Piso de 36f (600ms)
      playSfx('charge');
      break;

    case REAPER_SKILLS.VEIL_CLEAVE:
      e.actionState = REAPER_STATES.WINDUP_VEIL_CLEAVE;
      e.actionTimer = isEnraged ? 36 : 44; // Piso de 36f (600ms)
      e.aimAngle = Math.atan2(player.y - e.y, player.x - e.x);
      playSfx('warp');
      break;

    case REAPER_SKILLS.PURGATORY_CHAINS:
      e.actionState = REAPER_STATES.WINDUP_PURGATORY_CHAINS;
      e.actionTimer = isEnraged ? 36 : 44; // Piso de 36f (600ms)
      playSfx('singularity');
      break;

    case REAPER_SKILLS.WALL_OF_RESTLESS:
      e.actionState = REAPER_STATES.WINDUP_WALL_OF_RESTLESS;
      e.actionTimer = e.isPhase3 ? 36 : 46; // Piso de 36f (600ms)
      e.aimAngle = Math.atan2(player.y - e.y, player.x - e.x);
      playSfx('boss');
      playSfx('singularity');
      break;
  }

  e.lastUsedSkill = chosenSkill;
}

/**
 * Executa a habilidade preparada pelo Ceifador Supremo ao concluir o Windup.
 * @param {Object} e Entidade do chefe.
 * @param {Object} context Contexto global injetado do loop.
 */
export function executeReaperSkill(e, context) {
  const {
    player,
    frameCount = 0,
    bossTelegraphs,
    bossProjectiles,
    triggerShake,
    addDamageText
  } = context;

  const angleToPlayer = e.aimAngle !== undefined ? e.aimAngle : Math.atan2(player.y - e.y, player.x - e.x);

  switch (e.currentSkill) {
    case REAPER_SKILLS.DOUBLE_CLEAVE: {
      playSfx('boss');
      triggerShake(12);
      triggerHaptic('heavy');
      e.wingTargetSpan = 1.45;
      e.scytheTargetAngle = 1.4 * e.facing;
      e.scytheGlow = 1.0;

      bossTelegraphs.push({
        type: 'SCYTHE_CLEAVE',
        x: e.x,
        y: e.y,
        radius: 180,
        angle: angleToPlayer,
        timer: 36,
        maxTimer: 36,
        damage: Math.round(e.damage * 0.35),
        color: e.isEnraged ? '#ff4757' : '#00cec9',
        colorRgb: e.isEnraged ? '255, 71, 87' : '0, 206, 201',
        boss: e
      });

      e.delayedActions.push({
        timer: 20,
        callback: () => {
          playSfx('crit');
          triggerShake(10);
          e.scytheGlow = 1.0;
          e.scytheTargetAngle = -1.4 * e.facing;
          bossTelegraphs.push({
            type: 'SCYTHE_CLEAVE',
            x: e.x,
            y: e.y,
            radius: 215,
            angle: angleToPlayer + 0.38 * e.facing,
            timer: 38,
            maxTimer: 38,
            damage: Math.round(e.damage * 0.42),
            color: '#ff4757',
            colorRgb: '255, 71, 87',
            boss: e
          });
        }
      });

      e.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
      e.actionTimer = 18;
      break;
    }

    case REAPER_SKILLS.SOUL_SCYTHES: {
      playSfx('shoot');
      e.wingTargetSpan = 1.15;
      e.scytheTargetAngle = (frameCount || 0) * 0.25;
      e.scytheGlow = 0.8;

      const blades = e.isPhase3 ? 7 : (e.isEnraged ? 5 : 3);
      const arc = Math.PI * (e.isEnraged ? 0.65 : 0.45);
      const startAngle = angleToPlayer - arc / 2;
      const step = arc / (blades - 1);

      for (let i = 0; i < blades; i++) {
        const bAng = startAngle + i * step;
        bossProjectiles.push({
          type: 'SOUL_SCYTHE',
          x: e.x,
          y: e.y,
          vx: Math.cos(bAng) * 6.5,
          vy: Math.sin(bAng) * 6.5,
          radius: 20,
          damage: Math.round(e.damage * 0.28),
          life: 140,
          maxLife: 140,
          color: e.isEnraged ? '#ff4757' : '#00cec9',
          isReturning: false
        });
      }

      e.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
      e.actionTimer = 16;
      break;
    }

    case REAPER_SKILLS.SOUL_TETHER: {
      playSfx('boss');
      triggerShake(7);
      e.tetherActive = true;
      e.tetherTimer = 160;
      e.actionState = REAPER_STATES.CHASE;
      e.skillCooldown = 18;
      addDamageText(player.x, player.y, matchText('match.combat.soulLink'), true, '#00cec9');
      break;
    }

    case REAPER_SKILLS.VORTEX_HARVEST: {
      playSfx('boss');
      triggerShake(9);
      e.wingTargetSpan = 1.35;
      e.scytheTargetAngle = 0;
      e.actionState = REAPER_STATES.VORTEX_HARVEST;
      e.actionTimer = e.isEnraged ? 75 : 95;
      addDamageText(e.x, e.y - 45, matchText('match.combat.twilight'), true, e.isEnraged ? '#ff4757' : '#00cec9');
      break;
    }

    case REAPER_SKILLS.SCYTHE_BOOMERANG: {
      playSfx('boss');
      playSfx('crit');
      triggerShake(12);
      triggerHaptic('heavy');
      e.isUnarmed = true;
      e.scytheGlow = 0;

      const bAngle = e.aimAngle !== undefined ? e.aimAngle : Math.atan2(player.y - e.y, player.x - e.x);
      const bSpeed = REAPER_CONFIG.BOOMERANG_SPEED || 9.5;
      const pdx = player.x - e.x;
      const pdy = player.y - e.y;
      const currentDist = Math.hypot(pdx, pdy);
      const targetDist = Math.min(520, Math.max(220, currentDist + 60));

      e.boomerangScythe = {
        active: true,
        x: e.x,
        y: e.y,
        vx: Math.cos(bAngle) * bSpeed,
        vy: Math.sin(bAngle) * bSpeed,
        angle: bAngle,
        rotSpeed: 0.38,
        state: 'OUT',
        travelDist: 0,
        maxDist: targetDist,
        grindTimer: 0,
        radius: REAPER_CONFIG.BOOMERANG_RADIUS || 34,
        damage: Math.round(e.damage * 0.25)
      };

      e.actionState = REAPER_STATES.BOOMERANG_ACTIVE;
      e.actionTimer = 180;
      addDamageText(e.x, e.y - 45, matchText('match.combat.scythe'), true, '#00cec9');
      break;
    }

    case REAPER_SKILLS.DEATH_MARK_EXECUTION:
      e.actionState = REAPER_STATES.CHASE;
      e.skillCooldown = 18;
      break;

    case REAPER_SKILLS.SOUL_WELLS: {
      playSfx('boss');
      triggerShake(10);
      triggerHaptic('medium');
      e.scytheTargetAngle = -1.2 * e.facing;
      e.scytheGlow = 1.0;

      e.soulWells = [];
      const wellCount = e.isEnraged ? 6 : 5;
      const wellRadius = REAPER_CONFIG.SOUL_WELL_RADIUS || 44;

      const pvx = player.vx || (player.pushVx || 0);
      const pvy = player.vy || (player.pushVy || 0);

      e.soulWells.push({
        x: player.x,
        y: player.y,
        timer: 36,
        maxTimer: 36,
        radius: wellRadius,
        detonated: false
      });

      e.soulWells.push({
        x: player.x + pvx * 16,
        y: player.y + pvy * 16,
        timer: 42,
        maxTimer: 42,
        radius: wellRadius,
        detonated: false
      });

      for (let w = 2; w < wellCount; w++) {
        const wAng = (w * Math.PI * 2) / (wellCount - 1);
        const wDist = 110 + Math.random() * 90;
        e.soulWells.push({
          x: player.x + Math.cos(wAng) * wDist,
          y: player.y + Math.sin(wAng) * wDist,
          timer: 38 + w * 4,
          maxTimer: 38 + w * 4,
          radius: wellRadius,
          detonated: false
        });
      }

      playSfx('singularity');
      addDamageText(e.x, e.y - 45, matchText('match.combat.flames'), true, '#00cec9');
      e.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
      e.actionTimer = 16;
      break;
    }

    case REAPER_SKILLS.PHANTOM_TRIAD_SLASH: {
      playSfx('boss');
      playSfx('warp');
      triggerShake(14);
      triggerHaptic('heavy');

      const centerPlayerX = player.x;
      const centerPlayerY = player.y;
      const triadR = REAPER_CONFIG.TRIAD_DISTANCE || 180;

      const baseAngle = Math.atan2(e.y - centerPlayerY, e.x - centerPlayerX);
      e.x = centerPlayerX + Math.cos(baseAngle) * triadR;
      e.y = centerPlayerY + Math.sin(baseAngle) * triadR;
      e.aimAngle = Math.atan2(centerPlayerY - e.y, centerPlayerX - e.x);

      e.triadClones = [];
      for (let c = 1; c <= 2; c++) {
        const cAng = baseAngle + (c * Math.PI * 2) / 3;
        const cx = centerPlayerX + Math.cos(cAng) * triadR;
        const cy = centerPlayerY + Math.sin(cAng) * triadR;
        const cSlashAng = Math.atan2(centerPlayerY - cy, centerPlayerX - cx);
        e.triadClones.push({
          x: cx,
          y: cy,
          slashAngle: cSlashAng,
          timer: 36, // Piso de 36f (600ms)
          slashed: false,
          fadeTimer: 20,
          alpha: 0.95
        });
      }

      bossTelegraphs.push({
        type: 'SCYTHE_CLEAVE',
        x: e.x,
        y: e.y,
        radius: 185,
        angle: e.aimAngle,
        timer: 36,
        maxTimer: 36,
        damage: Math.round(e.damage * 0.40),
        color: '#ff4757',
        colorRgb: '255, 71, 87',
        boss: e
      });

      addDamageText(centerPlayerX, centerPlayerY - 45, matchText('match.combat.triad'), true, '#ff4757');
      e.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
      e.actionTimer = 18;
      break;
    }

    case REAPER_SKILLS.DEATH_TOLL: {
      playSfx('singularity');
      playSfx('charge');
      triggerShake(14);
      triggerHaptic('heavy');
      e.wingTargetSpan = 1.45;
      e.scytheTargetAngle = -Math.PI * 0.60;
      e.scytheGlow = 1.0;

      const chimes = REAPER_CONFIG.DEATH_TOLL_CHIMES || 3;
      const interval = REAPER_CONFIG.DEATH_TOLL_CHIME_INTERVAL || 63;

      e.deathToll = {
        active: true,
        chimeCount: 0,
        maxChimes: chimes,
        timer: 10,
        interval: interval,
        rings: [],
        x: e.x,
        y: e.y - 70,
        bellAlpha: 1.0,
        bellScale: 1.0
      };

      addDamageText(e.x, e.y - 50, matchText('match.combat.deathBell'), true, '#81ecec');
      e.actionState = REAPER_STATES.DEATH_TOLL_ACTIVE;
      e.actionTimer = chimes * interval + Math.ceil((REAPER_CONFIG.DEATH_TOLL_RING_MAX_RADIUS || 680) / (REAPER_CONFIG.DEATH_TOLL_RING_SPEED || 4.03)) + 30;
      break;
    }

    case REAPER_SKILLS.VEIL_CLEAVE: {
      playSfx('warp');
      playSfx('boss');
      triggerShake(12);
      triggerHaptic('heavy');
      e.wingTargetSpan = 1.40;
      e.scytheTargetAngle = 1.4 * e.facing;
      e.scytheGlow = 1.0;

      if (!e.veilCleaves) e.veilCleaves = [];
      const isX = e.isEnraged || e.isPhase3;
      const primaryAngle = e.aimAngle !== undefined ? e.aimAngle : Math.atan2(player.y - e.y, player.x - e.x);
      const cuts = [primaryAngle];
      if (isX) cuts.push(primaryAngle + Math.PI / 2);

      const targetX = player.x;
      const targetY = player.y;

      for (const ang of cuts) {
        e.veilCleaves.push({
          x: targetX,
          y: targetY,
          angle: ang,
          length: REAPER_CONFIG.VEIL_CLEAVE_LENGTH || 580,
          width: REAPER_CONFIG.VEIL_CLEAVE_WIDTH || 114,
          timer: REAPER_CONFIG.VEIL_CLEAVE_FUSE || 68,
          maxTimer: REAPER_CONFIG.VEIL_CLEAVE_FUSE || 68,
          damage: Math.round(e.damage * (REAPER_CONFIG.VEIL_CLEAVE_DAMAGE || 0.46)),
          exploded: false,
          fadeTimer: 24,
          isEnraged: e.isEnraged || e.isPhase3
        });
      }

      addDamageText(e.x, e.y - 45, isX ? matchText('match.combat.xRift') : matchText('match.combat.veil'), true, '#00cec9');
      e.actionState = REAPER_STATES.POST_ATTACK_RECOVERY;
      e.actionTimer = 18;
      break;
    }

    case REAPER_SKILLS.PURGATORY_CHAINS: {
      playSfx('singularity');
      playSfx('boss');
      triggerShake(16);
      triggerHaptic('heavy');
      e.wingTargetSpan = 1.60;
      e.scytheTargetAngle = 0;
      e.scytheGlow = 1.0;

      let cx = e.x;
      let cy = e.y;
      const radius = REAPER_CONFIG.CHAINS_RADIUS || 554;
      const anchorHp = REAPER_CONFIG.CHAINS_ANCHOR_HP || 3000;
      const anchorRadius = REAPER_CONFIG.CHAINS_ANCHOR_RADIUS || 22;
      const targetList = context.enemies || (typeof enemies !== 'undefined' ? enemies : []);

      if (player && player.hp > 0) {
        const pDist = Math.hypot(player.x - e.x, player.y - e.y);
        if (pDist > 60) {
          const maxOffset = radius * 0.40;
          const offset = Math.min(pDist * 0.5, maxOffset);
          cx = e.x + ((player.x - e.x) / pDist) * offset;
          cy = e.y + ((player.y - e.y) / pDist) * offset;
        }
      }

      const anchors = [];
      for (let i = 0; i < 4; i++) {
        const ang = Math.PI * 0.25 + i * (Math.PI * 0.5);
        const ax = cx + Math.cos(ang) * radius;
        const ay = cy + Math.sin(ang) * radius;

        const anchor = {
          id: i,
          x: ax,
          y: ay,
          radius: anchorRadius,
          hp: anchorHp,
          maxHp: anchorHp,
          active: true,
          isBossSubTarget: true,
          isTargetable: true,
          parentBoss: e,
          baseType: 'PURGATORY_ANCHOR',
          color: '#8e44ad',
          hitFlash: 0,
          hitCd: 0,
          axeHitCd: 0
        };
        anchors.push(anchor);
        if (targetList && !targetList.includes(anchor)) {
          targetList.push(anchor);
        }
      }

      const shatteredLinkIndex = Math.floor(Math.random() * 4);

      e.purgatoryChains = {
        active: true,
        cx,
        cy,
        radius,
        anchors,
        brokenCount: 0,
        shatteredLinkIndex,
        timer: REAPER_CONFIG.CHAINS_MAX_DURATION || 720,
        maxTimer: REAPER_CONFIG.CHAINS_MAX_DURATION || 720,
        cleaveCooldown: 40
      };

      e.sinnerShadow = {
        active: true,
        history: [],
        trail: [],
        timer: REAPER_CONFIG.CHAINS_MAX_DURATION || 720
      };

      addDamageText(e.x, e.y - 65, matchText('match.combat.purgatory'), true, '#8e44ad');
      e.actionState = REAPER_STATES.PURGATORY_CHAINS_ACTIVE;
      e.actionTimer = REAPER_CONFIG.CHAINS_MAX_DURATION || 720;
      break;
    }

    case REAPER_SKILLS.WALL_OF_RESTLESS: {
      playSfx('boss');
      playSfx('warp');
      triggerShake(18);
      triggerHaptic('heavy');
      e.wingTargetSpan = 1.70;
      e.scytheTargetAngle = 1.5 * e.facing;
      e.scytheGlow = 1.0;

      const primaryAngle = e.aimAngle !== undefined ? e.aimAngle : Math.atan2(player.y - e.y, player.x - e.x);
      const spd = REAPER_CONFIG.WALL_OF_RESTLESS_SPEED || 3.5;
      const wallLen = REAPER_CONFIG.WALL_OF_RESTLESS_LENGTH || 1400;
      const wallW = REAPER_CONFIG.WALL_OF_RESTLESS_WIDTH || 52;
      const gateW = REAPER_CONFIG.WALL_OF_RESTLESS_GATE_WIDTH || 90;

      const startX = e.x - Math.cos(primaryAngle) * 120;
      const startY = e.y - Math.sin(primaryAngle) * 120;

      const gate1 = -280 + (Math.random() - 0.5) * 80;
      const gate2 = 280 + (Math.random() - 0.5) * 80;

      e.wallOfRestless = {
        active: true,
        x: startX,
        y: startY,
        angle: primaryAngle,
        dirAngle: primaryAngle,
        vx: Math.cos(primaryAngle) * spd,
        vy: Math.sin(primaryAngle) * spd,
        length: wallLen,
        width: wallW,
        thickness: wallW,
        speed: spd,
        distTraveled: 0,
        maxDist: 1400,
        life: 480,
        maxLife: 480,
        gates: [gate1, gate2],
        safeGates: [
          { centerOffset: gate1, width: gateW },
          { centerOffset: gate2, width: gateW }
        ],
        gateWidth: gateW,
        damage: Math.round(e.damage * (REAPER_CONFIG.WALL_OF_RESTLESS_DAMAGE || 0.52)),
        hasHitPlayer: false,
        fadeTimer: 30,
        fireTimer: 30,
        bladeCooldown: 30
      };

      addDamageText(e.x, e.y - 75, matchText('match.combat.march'), true, '#ff4757');
      e.actionState = REAPER_STATES.WALL_OF_RESTLESS_ACTIVE;
      e.actionTimer = Math.round(1400 / spd) + 50;
      break;
    }

    default: {
      e.actionState = REAPER_STATES.CHASE;
      e.skillCooldown = 18;
      break;
    }
  }
}
