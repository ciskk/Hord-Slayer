/**
 * src/entities/bosses/abyssalMonolith/attacks.js
 * Arsenal de habilidades, seleção de skills e disparo de ataques de "Ignis Lithos, o Titã de Basalto".
 */

import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { setLastAttackerName, canSpawnEnemyBullet } from '../../../main.js';
import { selectedHeroKey } from '../../player.js';
import { triggerDeath } from '../../../systems/ui.js';
import { MONOLITH_STATES, MONOLITH_SKILLS } from './constants.js';

/**
 * Seleciona a próxima habilidade com base em avaliação tática situacional (Envelope Anti-Whiff, Distância Real e Combos).
 * Elimina o problema de conjurar golpes de curto alcance no vazio quando o jogador está distante.
 * @param {Object} e Entidade do chefe.
 * @param {number} dist Distância euclidiana até o jogador.
 * @param {Object} [player=null] Entidade do jogador (opcional, para leitura de movimento).
 */
export function selectNextSkill(e, dist, player = null) {
  const isEnraged = e.isEnraged;
  const isP3 = e.isPhase3;

  // 1. Verificação de Combo Sequencial (Ex: Pós-Vórtice Magmático)
  if (e.comboNext) {
    const nextSkill = e.comboNext;
    e.comboNext = null;

    // Se o jogador foi puxado e está em alcance de esmagamento (<= 220px)
    if (nextSkill === MONOLITH_SKILLS.TECTONIC_SLAM && dist <= 220) {
      e.currentSkill = MONOLITH_SKILLS.TECTONIC_SLAM;
      e.actionState = MONOLITH_STATES.WINDUP_SLAM;
      e.actionTimer = isP3 ? 45 : (isEnraged ? 52 : 60); // Rigorosamente 750ms a 1000ms
      e.maxActionTimer = e.actionTimer;
      e.lastUsedSkill = e.currentSkill;
      return;
    }
  }

  // 1.1 Contra-Ataque de Repulsão Tectônica se o jogador ficar colado abusando corpo a corpo
  if ((e.meleeContactTimer || 0) >= 60 && (e.repulsionCooldown || 0) <= 0 && dist < 140) {
    e.meleeContactTimer = 0;
    e.repulsionCooldown = 120; // 2 segundos de respiro antes da próxima punição forçada
    e.currentSkill = MONOLITH_SKILLS.PLATE_WHIRL;
    e.actionState = MONOLITH_STATES.WINDUP_WHIRL;
    e.actionTimer = isP3 ? 45 : (isEnraged ? 52 : 60); // Mínimo 750ms e máximo 1000ms de aviso
    e.maxActionTimer = e.actionTimer;
    e.lastUsedSkill = e.currentSkill;
    return;
  }

  // 2. Tabela de Avaliação de Pesos Táticos (Utility Scoring)
  // Cada habilidade recebe um peso. Fora de seu alcance efetivo (Envelope Anti-Whiff), recebe 0 estrito.
  const weights = {
    [MONOLITH_SKILLS.PLATE_WHIRL]: 0,
    [MONOLITH_SKILLS.TECTONIC_SLAM]: 0,
    [MONOLITH_SKILLS.EPICENTER_SURGE]: 0,
    [MONOLITH_SKILLS.VOLCANIC_FISSURE]: 0,
    [MONOLITH_SKILLS.BASALT_BARRAGE]: 0,
    [MONOLITH_SKILLS.MOLTEN_SALVO]: 0,
    [MONOLITH_SKILLS.TECTONIC_CROSS_SURGE]: 0,
    [MONOLITH_SKILLS.MAGMA_SIPHON]: 0
  };

  // CÁLCULO DOS PESOS BASE POR FAIXA DE DISTÂNCIA
  if (dist < 125) {
    // Zona 0: Colado / Abraço Melee (< 125px)
    // Prioridade máxima no giro 360° para punir quem tenta circular o chefe colado
    weights[MONOLITH_SKILLS.PLATE_WHIRL] = 50;
    weights[MONOLITH_SKILLS.TECTONIC_SLAM] = 35;
    weights[MONOLITH_SKILLS.EPICENTER_SURGE] = 25;
  } else if (dist <= 220) {
    // Zona 1: Alcance Melee Efetivo (125px a 220px)
    weights[MONOLITH_SKILLS.TECTONIC_SLAM] = 50;
    weights[MONOLITH_SKILLS.EPICENTER_SURGE] = 28;
    weights[MONOLITH_SKILLS.VOLCANIC_FISSURE] = 14;
    weights[MONOLITH_SKILLS.MOLTEN_SALVO] = 12;
    weights[MONOLITH_SKILLS.TECTONIC_CROSS_SURGE] = 10;
    weights[MONOLITH_SKILLS.BASALT_BARRAGE] = 8;
  } else if (dist <= 420) {
    // Zona 2: Médio Alcance (220px a 420px) - Amplo repertório diversificado à distância
    // Fim da dependência excessiva dos mesmos ataques: rotação equilibrada entre projéteis, fissuras e área
    weights[MONOLITH_SKILLS.MOLTEN_SALVO] = 42;
    weights[MONOLITH_SKILLS.TECTONIC_CROSS_SURGE] = 38;
    weights[MONOLITH_SKILLS.VOLCANIC_FISSURE] = 34;
    weights[MONOLITH_SKILLS.BASALT_BARRAGE] = 30;
    if (dist >= 280) {
      weights[MONOLITH_SKILLS.MAGMA_SIPHON] = 28;
    }
  } else {
    // Zona 3: Longo Alcance / Fuga / Kiting (> 420px)
    // Arsenal rico de longo alcance: Salva balística rápida, Fenda cruzada de interceptação, Vórtice e Chuva
    weights[MONOLITH_SKILLS.MOLTEN_SALVO] = 48;
    weights[MONOLITH_SKILLS.MAGMA_SIPHON] = 42;
    weights[MONOLITH_SKILLS.TECTONIC_CROSS_SURGE] = 38;
    weights[MONOLITH_SKILLS.BASALT_BARRAGE] = 32;
    weights[MONOLITH_SKILLS.VOLCANIC_FISSURE] = 26;
  }

  // 3. Leitura Comportamental do Jogador
  if (player && player.isMoving) {
    const pdx = player.x - e.x;
    const pdy = player.y - e.y;
    const pvx = player.vx || (player.pushVx || 0);
    const pvy = player.vy || (player.pushVy || 0);
    const isRetreating = (pvx * pdx + pvy * pdy) > 0;

    // Detecta movimentação lateral tangencial (circle-strafing)
    const pSpeed = Math.hypot(pvx, pvy);
    if (pSpeed > 0.3) {
      const dNormX = pdx / (dist || 1);
      const dNormY = pdy / (dist || 1);
      const radialVel = (pvx * dNormX + pvy * dNormY);
      const tangentialVel = Math.abs(pvx * (-dNormY) + pvy * dNormX);
      if (tangentialVel > Math.abs(radialVel) * 0.75) {
        // Jogador orbitando lateralmente: Fendas Cruzadas em X cortam os vetores de corrida
        weights[MONOLITH_SKILLS.TECTONIC_CROSS_SURGE] *= 1.50;
      }
    }

    if (isRetreating && dist > 260) {
      // Jogador correndo para longe: intensifica urgência de puxão gravitacional e disparos velozes
      weights[MONOLITH_SKILLS.MAGMA_SIPHON] *= 1.40;
      weights[MONOLITH_SKILLS.MOLTEN_SALVO] *= 1.35;
      weights[MONOLITH_SKILLS.VOLCANIC_FISSURE] *= 1.15;
    }
  }

  // 4. Anti-Spam: Reduz fortemente a chance de repetir a exata mesma habilidade
  if (e.lastUsedSkill && weights[e.lastUsedSkill] > 0) {
    weights[e.lastUsedSkill] *= 0.18;
  }

  // Anti-Combo Excessivo: impede terminantemente conjurar Fendas Vulcânicas logo após o Esmagamento Tectônico
  if (e.lastUsedSkill === MONOLITH_SKILLS.TECTONIC_SLAM) {
    weights[MONOLITH_SKILLS.VOLCANIC_FISSURE] = 0;
  }

  // 5. Sorteio Ponderado por Roleta
  let totalWeight = 0;
  for (const skillKey in weights) {
    totalWeight += weights[skillKey];
  }

  if (totalWeight <= 0) {
    weights[MONOLITH_SKILLS.MOLTEN_SALVO] = 1;
    totalWeight = 1;
  }

  let roll = Math.random() * totalWeight;
  let chosenSkill = MONOLITH_SKILLS.MOLTEN_SALVO;

  for (const skillKey in weights) {
    roll -= weights[skillKey];
    if (roll <= 0) {
      chosenSkill = skillKey;
      break;
    }
  }

  // 6. Aplicação do Estado de Execução da Habilidade Escolhida
  // Todos os wind-ups respeitam rigorosamente a faixa de 750ms a 1000ms (45 a 60 frames a 60 FPS)
  e.currentSkill = chosenSkill;
  const uniformWindup = isP3 ? 45 : (isEnraged ? 52 : 60);

  switch (chosenSkill) {
    case MONOLITH_SKILLS.TECTONIC_SLAM:
      e.actionState = MONOLITH_STATES.WINDUP_SLAM;
      e.actionTimer = uniformWindup;
      break;

    case MONOLITH_SKILLS.EPICENTER_SURGE:
      e.actionState = MONOLITH_STATES.WINDUP_EPICENTER;
      e.actionTimer = uniformWindup;
      break;

    case MONOLITH_SKILLS.PLATE_WHIRL:
      e.actionState = MONOLITH_STATES.WINDUP_WHIRL;
      e.actionTimer = uniformWindup;
      break;

    case MONOLITH_SKILLS.VOLCANIC_FISSURE:
      e.actionState = MONOLITH_STATES.WINDUP_FISSURE;
      e.actionTimer = uniformWindup;
      break;

    case MONOLITH_SKILLS.BASALT_BARRAGE:
      e.actionState = MONOLITH_STATES.WINDUP_BARRAGE;
      e.actionTimer = uniformWindup;
      break;

    case MONOLITH_SKILLS.MOLTEN_SALVO:
      e.actionState = MONOLITH_STATES.WINDUP_SALVO;
      e.actionTimer = uniformWindup;
      break;

    case MONOLITH_SKILLS.TECTONIC_CROSS_SURGE:
      e.actionState = MONOLITH_STATES.WINDUP_CROSS_FISSURE;
      e.actionTimer = uniformWindup;
      break;

    case MONOLITH_SKILLS.MAGMA_SIPHON:
      e.actionState = MONOLITH_STATES.CHANNELING_SIPHON;
      e.pullTimer = uniformWindup; // Canalização de sucção ritmada (750ms - 1000ms)
      e.pullMaxTimer = e.pullTimer;
      e.actionTimer = uniformWindup;
      break;
  }

  e.maxActionTimer = e.actionTimer;
  e.lastUsedSkill = chosenSkill;
}

/**
 * SKILL 1: ESMAGAMENTO TECTÔNICO (TECTONIC SLAM)
 * Dano aumentado para 75-88.
 * Possui avanço frontal de 20px no impacto e zona cega nas costas.
 * @param {Object} e
 * @param {Object} context
 */
export function executeTectonicSlam(e, context) {
  const { player, triggerShake, createHitParticles, addDamageText } = context;

  playSfx('boss');
  triggerShake(18);
  triggerHaptic('heavy');

  // Avanço pesado para frente no impacto
  e.x += Math.cos(e.aimAngle) * 20;
  e.y += Math.sin(e.aimAngle) * 20;

  const impactDist = 75;
  const impactX = e.x + Math.cos(e.aimAngle) * impactDist;
  const impactY = e.y + Math.sin(e.aimAngle) * impactDist;

  for (let p = 0; p < 28; p++) {
    createHitParticles(impactX, impactY, '#ff4757', 1);
    createHitParticles(impactX, impactY, '#d35400', 1);
  }

  // Avaliação geométrica no cone frontal
  const pdx = player.x - e.x;
  const pdy = player.y - e.y;
  const pDist = Math.hypot(pdx, pdy);
  const pAngle = Math.atan2(pdy, pdx);

  let angleDiff = Math.abs(pAngle - e.aimAngle);
  if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

  // Dano somente se estiver no cone frontal (< slamArc) e dentro do alcance (185px)
  if (pDist <= e.slamRadius && angleDiff <= e.slamArc && player.bossIFrames <= 0) {
    let slamDamage = e.isPhase3 ? 161 : (e.isEnraged ? 150 : 136);
    if (selectedHeroKey === 'KNIGHT') slamDamage = Math.round(slamDamage * 0.80);

    player.hp -= slamDamage;
    player.bossIFrames = 24;
    setLastAttackerName("Esmagamento Tectônico");
    playSfx('hit');
    triggerShake(12);
    addDamageText(player.x, player.y, `-${slamDamage}`, true, '#e74c3c');
    createHitParticles(player.x, player.y, '#e74c3c', 10);

    const pushAngle = Math.atan2(pdy, pdx);
    player.x += Math.cos(pushAngle) * 28;
    player.y += Math.sin(pushAngle) * 28;

    if (player.hp <= 0) {
      player.hp = 0;
      triggerDeath();
      return;
    }
  }

  // Fim do combo instantâneo: o Slam é focado no cone de impacto limpo.
  // As Fendas Vulcânicas continuam como uma habilidade própria e telegrafada.
  e.actionState = MONOLITH_STATES.POST_ATTACK_RECOVERY;
  e.actionTimer = e.isPhase3 ? 18 : (e.isEnraged ? 22 : 26); // Respiro ágil (~300-430ms)
}

/**
 * SKILL 2 (PASSO 1): ERUPÇÃO DO EPICENTRO
 * O solo sob o chefe explode (0 a 115px).
 * Imediatamente inicia a propagação da onda para o anel externo.
 * @param {Object} e
 * @param {Object} context
 */
export function executeEpicenterEruption(e, context) {
  const { player, triggerShake, createHitParticles, addDamageText } = context;
  playSfx('boss');
  triggerShake(16);
  triggerHaptic('heavy');

  // Efeito de coluna de lava no centro
  for (let p = 0; p < 30; p++) {
    const cAng = Math.random() * Math.PI * 2;
    const cDist = Math.random() * 110;
    createHitParticles(e.x + Math.cos(cAng) * cDist, e.y + Math.sin(cAng) * cDist, '#ff1744', 1);
    createHitParticles(e.x + Math.cos(cAng) * cDist, e.y + Math.sin(cAng) * cDist, '#f39c12', 1);
  }

  // Avaliação de Dano no Epicentro (< 115px)
  const pDist = Math.hypot(player.x - e.x, player.y - e.y);
  if (pDist < 115 && player.bossIFrames <= 0) {
    let epicenterDmg = e.isPhase3 ? 205 : (e.isEnraged ? 189 : 178);
    if (selectedHeroKey === 'KNIGHT') epicenterDmg = Math.round(epicenterDmg * 0.80);
    player.hp -= epicenterDmg;
    player.bossIFrames = 20;
    setLastAttackerName("Erupção do Epicentro");
    playSfx('hit');
    addDamageText(player.x, player.y, `-${epicenterDmg}`, true, '#ff4757');
    createHitParticles(player.x, player.y, '#ff4757', 10);
    if (player.hp <= 0) {
      player.hp = 0;
      triggerDeath();
      return;
    }
  }

  // Transita para a propagação da onda externa (+35% de tempo de preparo: 49f / 41f / 32f)
  e.actionState = MONOLITH_STATES.PROPAGATING_SURGE;
  e.actionTimer = e.isPhase3 ? 32 : (e.isEnraged ? 41 : 49);
  e.maxActionTimer = e.actionTimer;
}

/**
 * SKILL 2 (PASSO 2): ONDA EXTERNA DE BASALTO
 * O solo sob o chefe já esfriou e está seguro!
 * O anel externo (140px a 245px) detona agora, causando dano reduzido pela metade.
 * @param {Object} e
 * @param {Object} context
 */
export function executeOuterSurge(e, context) {
  const { player, triggerShake, createHitParticles, addDamageText } = context;

  playSfx('boss');
  triggerShake(14);

  // Explosão em anel com estacas de basalto e chamas
  const ringCount = 32;
  for (let s = 0; s < ringCount; s++) {
    const rAng = (s * Math.PI * 2) / ringCount;
    const rDist = 150 + Math.random() * 90;
    createHitParticles(e.x + Math.cos(rAng) * rDist, e.y + Math.sin(rAng) * rDist, '#e67e22', 1);
    createHitParticles(e.x + Math.cos(rAng) * rDist, e.y + Math.sin(rAng) * rDist, '#f39c12', 1);
  }

  // Avaliação de Dano no Anel Externo (140 a 245px)
  const pDist = Math.hypot(player.x - e.x, player.y - e.y);
  if (pDist >= 140 && pDist <= 245 && player.iFrames <= 0) {
    let surgeDmg = e.isPhase3 ? 167 : (e.isEnraged ? 157 : 140);
    if (selectedHeroKey === 'KNIGHT') surgeDmg = Math.round(surgeDmg * 0.80);

    player.hp -= surgeDmg;
    player.iFrames = 25;
    setLastAttackerName("Onda de Fendas Tectônicas");
    playSfx('hit');
    addDamageText(player.x, player.y, `-${surgeDmg}`, false, '#e67e22');
    createHitParticles(player.x, player.y, '#e67e22', 8);

    if (player.hp <= 0) {
      player.hp = 0;
      triggerDeath();
      return;
    }
  }

  e.actionState = MONOLITH_STATES.POST_ATTACK_RECOVERY;
  e.actionTimer = e.isPhase3 ? 16 : (e.isEnraged ? 20 : 24);
}

/**
 * SKILL 3: VARREDURA DE PLACAS 360° (PLATE WHIRL)
 * As placas abrem em lâminas circulares e giram velozes ao redor do corpo.
 * Punição corpo a corpo de dano substancial e empurrão tático.
 * @param {Object} e
 * @param {Object} context
 */
export function executePlateWhirl(e, context) {
  const { player, triggerShake, createHitParticles, addDamageText } = context;
  playSfx('hit');
  triggerShake(12);
  triggerHaptic('medium');

  for (let p = 0; p < 28; p++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 75 + Math.random() * 35;
    createHitParticles(e.x + Math.cos(ang) * dist, e.y + Math.sin(ang) * dist, '#ff4757', 1);
  }

  // Avaliação de Dano no raio das placas giratórias (<= 110px)
  const pDist = Math.hypot(player.x - e.x, player.y - e.y);
  if (pDist <= 110 && player.bossIFrames <= 0) {
    let whirlDmg = e.isPhase3 ? 98 : (e.isEnraged ? 88 : 78);
    if (selectedHeroKey === 'KNIGHT') whirlDmg = Math.round(whirlDmg * 0.80);
    player.hp -= whirlDmg;
    player.bossIFrames = 22;
    setLastAttackerName("Varredura de Placas");
    playSfx('hit');
    addDamageText(player.x, player.y, `-${whirlDmg}`, false, '#ff4757');
    createHitParticles(player.x, player.y, '#ff4757', 8);
    // Empurrão firme para descolar o jogador e criar espaço
    const pushAng = Math.atan2(player.y - e.y, player.x - e.x);
    player.x += Math.cos(pushAng) * 42;
    player.y += Math.sin(pushAng) * 42;
    if (player.hp <= 0) {
      player.hp = 0;
      triggerDeath();
      return;
    }
  }

  e.actionState = MONOLITH_STATES.POST_ATTACK_RECOVERY;
  e.actionTimer = 20;
}

/**
 * SKILL 4: VÓRTICE DA CALDEIRA (MAGMA SIPHON)
 * Dispara ondas de estilhaços magmáticos em leque espiral.
 * @param {Object} e
 * @param {Object} context
 */
export function executeMagmaSiphonRelease(e, context) {
  const { enemyBullets, triggerShake } = context;

  playSfx('boss');
  triggerShake(14);
  triggerHaptic('heavy');

  const waveCount = 3;
  const shardCount = 8;
  for (let w = 0; w < waveCount; w++) {
    e.delayedActions.push({
      timer: w * 8,
      callback: () => {
        playSfx('shoot');
        const waveOffset = (w * Math.PI) / 8;
        for (let s = 0; s < shardCount; s++) {
          if (!canSpawnEnemyBullet(true)) break;
          const sAng = waveOffset + (s * Math.PI * 2) / shardCount;
          enemyBullets.push({
            x: e.x + Math.cos(sAng) * 65,
            y: e.y + Math.sin(sAng) * 65,
            vx: Math.cos(sAng) * (4.5 + w * 0.45),
            vy: Math.sin(sAng) * (4.5 + w * 0.45),
            radius: 6.5,
            damage: 35,
            life: 360, // Alcance 2x adicional: viaja até ~1620px através de toda a arena
            color: '#e67e22',
            isBossProjectile: true
          });
        }
      }
    });
  }

  e.comboNext = null;
  e.actionState = MONOLITH_STATES.POST_ATTACK_RECOVERY;
  e.actionTimer = 22;
}

/**
 * SKILL 5: FENDAS VULCÂNICAS (VOLCANIC FISSURE)
 * Sequência de círculos explosivos em leque com cadência de propagação rítmica telegrafada.
 * O primeiro nó inicia rente ao chefe (35px), eliminando pontos cegos colados.
 * @param {Object} e
 * @param {Object} context
 */
export function executeVolcanicFissure(e, context) {
  const { player, bossTelegraphs, triggerShake } = context;
  const angleToPlayer = e.aimAngle !== undefined ? e.aimAngle : Math.atan2(player.y - e.y, player.x - e.x);

  playSfx('boss');
  triggerShake(10);
  triggerHaptic('medium');

  const lineCount = e.isPhase3 ? 5 : (e.isEnraged ? 4 : 3);
  const spreadArc = Math.PI * (e.isPhase3 ? 0.55 : 0.40);
  const startAngle = angleToPlayer - spreadArc / 2;
  const step = spreadArc / (lineCount - 1);

  for (let l = 0; l < lineCount; l++) {
    const lineAng = startAngle + (l * step);
    const nodeCount = 13; // 13 nós consecutivos em cada leque
    for (let n = 1; n <= nodeCount; n++) {
      // Inicia aos 35px para cobrir corpo a corpo imediato e propaga a cada 75px
      const distNode = 35 + (n - 1) * 75;
      const nodeX = e.x + Math.cos(lineAng) * distNode;
      const nodeY = e.y + Math.sin(lineAng) * distNode;

      // Aviso ritmado e claro (45-60f base + 3f por nó de propagação)
      const baseFissureTimer = e.isPhase3 ? 45 : (e.isEnraged ? 52 : 60);
      const fissureNodeTimer = baseFissureTimer + n * 3;
      bossTelegraphs.push({
        type: 'FISSURE_NODE',
        x: nodeX,
        y: nodeY,
        originX: e.x,
        originY: e.y,
        lineIndex: l,
        nodeIndex: n,
        angle: lineAng,
        radius: 30,
        timer: fissureNodeTimer,
        maxTimer: fissureNodeTimer,
        damage: 57
      });
    }
  }

  e.actionState = MONOLITH_STATES.POST_ATTACK_RECOVERY;
  e.actionTimer = e.isPhase3 ? 20 : (e.isEnraged ? 24 : 28);
}

/**
 * SKILL 6: ARTILHARIA DE BASALTO (BASALT BARRAGE)
 * Chuva de meteoros vulcânicos com área e dispersão 2x adicionais (até 480px).
 * @param {Object} e
 * @param {Object} context
 */
export function executeBasaltBarrage(e, context) {
  const { player, bossTelegraphs, triggerShake } = context;

  playSfx('shoot');
  triggerShake(6);

  const impactCount = e.isPhase3 ? 7 : (e.isEnraged ? 6 : 5);
  for (let m = 0; m < impactCount; m++) {
    let targetX, targetY;
    if (m === 0) {
      // Pelo menos 1 meteoro direcionado diretamente na posição do jogador
      targetX = player.x;
      targetY = player.y;
    } else {
      const offsetAng = (m * Math.PI * 2) / impactCount + Math.random() * 0.4;
      const offsetDist = 50 + Math.random() * 300;
      targetX = player.x + Math.cos(offsetAng) * offsetDist;
      targetY = player.y + Math.sin(offsetAng) * offsetDist;
    }

    const baseMeteorTimer = e.isPhase3 ? 45 : (e.isEnraged ? 52 : 60);
    const meteorTimer = baseMeteorTimer + m * 3;
    bossTelegraphs.push({
      type: 'FALLING_ROCK',
      x: targetX,
      y: targetY,
      radius: 44,
      timer: meteorTimer,
      maxTimer: meteorTimer,
      damage: 65
    });
  }

  e.actionState = MONOLITH_STATES.POST_ATTACK_RECOVERY;
  e.actionTimer = 22;
}

/**
 * SKILL 7: SALVA VULCÂNICA DE BASALTO (MOLTEN SALVO)
 * Disparo balístico alternado em alta velocidade de lanças/estilhaços incandescentes
 * partindo das manoplas megalíticas esquerda e direita com mira direcionada no jogador.
 * @param {Object} e
 * @param {Object} context
 */
export function executeMoltenSalvo(e, context) {
  const { player, enemyBullets, triggerShake, createHitParticles } = context;

  playSfx('boss');
  triggerShake(8);
  triggerHaptic('medium');

  const shotCount = e.isPhase3 ? 8 : (e.isEnraged ? 7 : 6);
  const shotInterval = 4; // Cada projétil disparado a cada 4 frames (~66ms)

  for (let s = 0; s < shotCount; s++) {
    e.delayedActions.push({
      timer: s * shotInterval,
      callback: () => {
        if (!canSpawnEnemyBullet(true)) return;
        playSfx('shoot');
        triggerHaptic('light');

        // Alterna o ponto de origem entre a manopla esquerda e direita
        const isLeft = (s % 2 === 0);
        const gauntletOffsetX = isLeft ? -52 : 52;
        const gauntletOffsetY = 6;
        const spawnX = e.x + gauntletOffsetX;
        const spawnY = e.y + gauntletOffsetY;

        // Leitura e mira preditiva suave
        const pvx = player.vx || 0;
        const pvy = player.vy || 0;
        const leadFrames = 10;
        const targetX = player.x + pvx * leadFrames;
        const targetY = player.y + pvy * leadFrames;

        const baseAngle = Math.atan2(targetY - spawnY, targetX - spawnX);
        // Leve dispersão balística angular (+/- 0.08 rad)
        const spread = (Math.random() - 0.5) * 0.16;
        const finalAngle = baseAngle + spread;
        const bulletSpeed = e.isPhase3 ? 6.5 : (e.isEnraged ? 5.8 : 5.2);

        enemyBullets.push({
          x: spawnX,
          y: spawnY,
          vx: Math.cos(finalAngle) * bulletSpeed,
          vy: Math.sin(finalAngle) * bulletSpeed,
          radius: 7.5,
          damage: e.isPhase3 ? 42 : (e.isEnraged ? 38 : 34),
          life: 280,
          color: '#e74c3c',
          bulletType: 'BASALT_LANCE',
          isBossProjectile: true,
          sourceName: 'Salva de Basalto'
        });

        createHitParticles(spawnX, spawnY, '#e67e22', 4);
        createHitParticles(spawnX, spawnY, '#ff4757', 3);
      }
    });
  }

  e.actionState = MONOLITH_STATES.POST_ATTACK_RECOVERY;
  e.actionTimer = e.isPhase3 ? 20 : (e.isEnraged ? 24 : 28);
}

/**
 * SKILL 8: FENDAS TECTÔNICAS CRUZADAS (TECTONIC CROSS SURGE)
 * O chefe projeta duas linhas de fratura sísmicas que se cruzam em 'X'
 * centralizadas na posição atual do jogador, cortando rotas de movimentação circular (circle-strafing).
 * @param {Object} e
 * @param {Object} context
 */
export function executeCrossFissures(e, context) {
  const { player, bossTelegraphs, triggerShake, createHitParticles } = context;

  playSfx('boss');
  triggerShake(12);
  triggerHaptic('heavy');

  // Centro da fenda em X ancorado no jogador
  const centerX = player.x;
  const centerY = player.y;

  // Ângulo base da linha Monólito -> Jogador
  const baseAngle = Math.atan2(centerY - e.y, centerX - e.x);

  // Duas diagonais ortogonais cruzadas (+45° e -45°)
  const crossAngles = [baseAngle + Math.PI / 4, baseAngle - Math.PI / 4];
  const nodeCountPerArm = 5; // 5 nós para cada lado do centro (total 9 nós por linha de fratura)
  const nodeSpacing = 52;
  const baseCrossTimer = e.isPhase3 ? 45 : (e.isEnraged ? 52 : 60);

  createHitParticles(centerX, centerY, '#ff1744', 12);
  createHitParticles(centerX, centerY, '#f39c12', 8);

  crossAngles.forEach((cAng, lineIdx) => {
    for (let step = -nodeCountPerArm; step <= nodeCountPerArm; step++) {
      const nodeX = centerX + Math.cos(cAng) * (step * nodeSpacing);
      const nodeY = centerY + Math.sin(cAng) * (step * nodeSpacing);

      // Propagação leve a partir do centro da cruz (+2f por passo de distância)
      const distFromCenter = Math.abs(step);
      const fissureNodeTimer = baseCrossTimer + distFromCenter * 2;

      bossTelegraphs.push({
        type: 'FISSURE_NODE',
        x: nodeX,
        y: nodeY,
        originX: centerX,
        originY: centerY,
        lineIndex: lineIdx,
        nodeIndex: distFromCenter + 1,
        angle: cAng,
        radius: 32,
        timer: fissureNodeTimer,
        maxTimer: fissureNodeTimer,
        damage: e.isPhase3 ? 55 : (e.isEnraged ? 50 : 45)
      });
    }
  });

  e.actionState = MONOLITH_STATES.POST_ATTACK_RECOVERY;
  e.actionTimer = e.isPhase3 ? 20 : (e.isEnraged ? 24 : 28);
}
