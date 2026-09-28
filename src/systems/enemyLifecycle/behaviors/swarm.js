/**
 * src/systems/enemyLifecycle/behaviors/swarm.js
 * IA de Enxame Ondulante e Orgânico (Morcegos) — Revoada desincronizada, micro-turbulência e mergulho assimétrico.
 */
import { applyCrowdFlanking } from '../crowdFlanking.js';

export function swarmBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, frameCount } = ctx || {};
  const dx = player ? player.x - e.x : 0;
  const dy = player ? player.y - e.y : 0;
  const distToPlayerSq = dx * dx + dy * dy;

  const threshold = e.diveThreshold || 135;
  const isDive = distToPlayerSq < threshold * threshold;
  const diveBonus = isDive ? 1.35 : 1.0;

  const phase = e.phaseOffset ?? 0;
  const freq = e.wobbleFreq ?? 0.12;
  const amp = e.wobbleAmp ?? 0.35;

  // Flutter orgânico: onda primária desincronizada com frequência própria + harmônica secundária sutil
  const flutter = Math.sin((frameCount ?? 0) * freq + phase) * amp + Math.sin((frameCount ?? 0) * 0.23 + phase * 2.3) * (amp * 0.32);

  // Flanqueamento tático de multidão
  const flankedAngle = applyCrowdFlanking(e, angle, ctx, dt);
  const flankOffset = flankedAngle - angle;

  // No rasante focado contra o jogador, amortece a oscilação lateral para manter o ataque perigoso
  const swayWeight = isDive ? 0.35 : 1.0;
  const effectiveAngle = angle + (flutter + flankOffset) * swayWeight;

  e.x += Math.cos(effectiveAngle) * curSpeed * diveBonus * dt;
  e.y += Math.sin(effectiveAngle) * curSpeed * diveBonus * dt;
}
