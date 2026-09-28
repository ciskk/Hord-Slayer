/**
 * src/systems/enemyLifecycle/crowdFlanking.js
 * Módulo de Inteligência Coletiva: Detecção de Congestão Frontal e Flanqueamento Tático.
 *
 * Permite que monstros em hordas detectem quando estão sendo bloqueados por aliados
 * à sua frente e curvem suas trajetórias pelas laterais para explorar brechas na multidão,
 * envolvendo o jogador em movimento de pinça sem custos pesados de pathfinding.
 */
import { getNeighborIndices, spatialGrid } from '../../core/spatialGrid.js';

// Buffer estático dedicado para consultas de flanqueamento (Zero Garbage Collection)
const flankNeighborsBuffer = [];

export const CROWD_FLANK_CONFIG = {
  probeDist: 40,           // Distância à frente onde o sensor é projetado (px)
  probeRadius: 48,         // Raio de amostragem na grade espacial (px)
  corridorHalfWidth: 26,   // Meia-largura do corredor frontal de bloqueio (px)
  minFrontAllies: 2,       // Mínimo de aliados bloqueando para ativar o flanqueamento
  deflectionAngle: 0.68,   // Força angular do contorno (~39 graus em radianos)
  durationFrames: 24,      // Duração da inércia tática em quadros (~0.4s a 60 FPS)
  meleeDisengageDist: 45,  // Distância do jogador onde o flanqueamento é desativado para o ataque direto
  maxSimDistSq: 650 * 650, // Distância máxima do jogador para executar a IA de flanco
  checkInterval: 8         // Frequência de avaliação de time-slicing
};

/**
 * Avalia se o monstro está bloqueado por aliados e decide o lado de flanqueamento.
 * @param {object} e - Entidade do monstro avaliado.
 * @param {number} angleToPlayer - Ângulo direto para o jogador.
 * @param {number} distToPlayer - Distância atual até o jogador.
 * @param {number} frameCount - Quadro atual da simulação.
 * @param {Array<object>} enemies - Lista de inimigos ativos.
 */
export function evaluateCrowdFlanking(e, angleToPlayer, distToPlayer, frameCount, enemies, force = false) {
  if (!e || e.canFlank === false) return;
  if (distToPlayer <= CROWD_FLANK_CONFIG.meleeDisengageDist) return;
  if (distToPlayer * distToPlayer > CROWD_FLANK_CONFIG.maxSimDistSq) return;

  if (!force && frameCount != null) {
    const interval = e.flankCheckInterval || CROWD_FLANK_CONFIG.checkInterval;
    const offset = (e.id != null)
      ? e.id
      : (e.phaseOffset ? Math.floor(e.phaseOffset * 100) : 0);

    // Time-Slicing: avalia a cada N quadros de forma desincronizada entre os monstros
    if (Math.floor(frameCount + offset) % interval !== 0) {
      return;
    }
  }

  const forwardX = Math.cos(angleToPlayer);
  const forwardY = Math.sin(angleToPlayer);

  // Ponto central de sondagem à frente do monstro
  const probeX = e.x + forwardX * CROWD_FLANK_CONFIG.probeDist;
  const probeY = e.y + forwardY * CROWD_FLANK_CONFIG.probeDist;

  let candidates;
  let candidateCount;

  // Se a spatialGrid estiver povoada (runtime normal), usa busca espacial O(1)
  if (spatialGrid && spatialGrid.size > 0) {
    candidates = getNeighborIndices(probeX, probeY, CROWD_FLANK_CONFIG.probeRadius, flankNeighborsBuffer);
    candidateCount = candidates.length;
  } else if (enemies && enemies.length > 0) {
    // Fallback gracioso para testes unitários ou ambientes sem spatialGrid inicializada
    candidates = null;
    candidateCount = enemies.length;
  } else {
    return;
  }

  let frontBlockedCount = 0;
  let leftCrowdCount = 0;
  let rightCrowdCount = 0;

  for (let i = 0; i < candidateCount; i++) {
    const other = candidates ? enemies[candidates[i]] : enemies[i];
    if (!other || other === e || other.hp <= 0 || other.isBossSubTarget) continue;

    // Morcegos voando não bloqueiam monstros terrestres
    if (e.baseType !== 'BAT' && other.baseType === 'BAT') continue;

    const toOtherX = other.x - e.x;
    const toOtherY = other.y - e.y;

    // Projeção escalar ao longo do vetor de avanço (distância à frente)
    const projForward = toOtherX * forwardX + toOtherY * forwardY;

    // Se estiver à frente (entre 12px e 85px)
    if (projForward > 12 && projForward < 85) {
      // Produto vetorial 2D (Cross Product): positivo = direita, negativo = esquerda
      const cross = forwardX * toOtherY - forwardY * toOtherX;
      const perpDist = Math.abs(cross);

      // Está dentro do corredor direto de visão e colisão?
      if (perpDist <= CROWD_FLANK_CONFIG.corridorHalfWidth) {
        frontBlockedCount++;
      }

      // Densidade dos lados para escolher a melhor brecha (>1.5px de desvio para evitar ruído central)
      if (cross > 1.5) {
        rightCrowdCount++;
      } else if (cross < -1.5) {
        leftCrowdCount++;
      }
    }
  }

  // Se o corredor frontal estiver congestionado por aliados, ativa manobra de contorno
  if (frontBlockedCount >= CROWD_FLANK_CONFIG.minFrontAllies) {
    let chosenDir = 0;
    if (leftCrowdCount < rightCrowdCount) {
      chosenDir = -1; // Brecha identificada à esquerda
    } else if (rightCrowdCount < leftCrowdCount) {
      chosenDir = 1;  // Brecha identificada à direita
    } else {
      // Densidade empatada: utiliza a polaridade intrínseca do mob para dividir a horda
      chosenDir = e.flankBias || 1;
    }

    e.flankDir = chosenDir;
    e.flankTimer = CROWD_FLANK_CONFIG.durationFrames;
  }
}

/**
 * Aplica o desvio de flanqueamento ao ângulo de perseguição de forma suave e contínua.
 * @param {object} e - Entidade do monstro.
 * @param {number} angleToPlayer - Ângulo direto para o jogador.
 * @param {object} ctx - Contexto da simulação (player, enemies, frameCount).
 * @param {number} dt - Delta time normalizado.
 * @returns {number} Ângulo efetivo de locomoção com flanqueamento aplicado.
 */
export function applyCrowdFlanking(e, angleToPlayer, ctx, dt = 1) {
  if (!e || e.canFlank === false || !ctx?.player) {
    return angleToPlayer;
  }

  const player = ctx.player;
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const distToPlayer = Math.hypot(dx, dy);

  // Executa avaliação de congestão com time-slicing
  evaluateCrowdFlanking(e, angleToPlayer, distToPlayer, ctx.frameCount ?? 0, ctx.enemies);

  // Decaimento do timer de inércia
  if (e.flankTimer > 0) {
    e.flankTimer -= dt;
    if (e.flankTimer < 0) e.flankTimer = 0;
  }

  // Alvo angular do flanqueamento
  let targetOffset = 0;
  if (e.flankTimer > 0 && e.flankDir) {
    targetOffset = e.flankDir * CROWD_FLANK_CONFIG.deflectionAngle;
  }

  // Interpolação suave do ângulo de desvio para evitar jitter visual
  const currentOffset = e.flankAngleOffset || 0;
  const lerpSpeed = Math.min(1, 0.22 * dt);
  e.flankAngleOffset = currentOffset + (targetOffset - currentOffset) * lerpSpeed;

  if (Math.abs(e.flankAngleOffset) < 0.005) {
    e.flankAngleOffset = 0;
  }

  // Próximo do jogador (< 45px): desativa gradualmente o flanqueamento para focar no golpe melee
  let effectiveOffset = e.flankAngleOffset;
  if (distToPlayer < CROWD_FLANK_CONFIG.meleeDisengageDist) {
    const meleeWeight = Math.max(0, (distToPlayer - 18) / (CROWD_FLANK_CONFIG.meleeDisengageDist - 18));
    effectiveOffset *= meleeWeight;
  }

  return angleToPlayer + effectiveOffset;
}
