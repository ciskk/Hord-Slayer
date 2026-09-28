/**
 * src/systems/enemyLifecycle/behaviors/defaultChase.js
 * IA de Perseguição Direta Padrão (Zumbis, Golens, Inimigos com Escudo, Parasitas).
 * Movimento humanoide orgânico: passo cambaleante desincronizado para quebrar trajetórias retilíneas.
 */
import { splitterMiniBehavior } from './splitterMini.js';
import { applyCrowdFlanking } from '../crowdFlanking.js';

export function defaultChaseBehavior(e, dt, angle, curSpeed, ctx) {
  if (e.baseType === 'SPLITTER_MINI') {
    return splitterMiniBehavior(e, dt, angle, curSpeed, ctx);
  }

  const frame = ctx?.frameCount ?? 0;
  const phase = e.phaseOffset ?? 0;
  const freq = (e.wobbleFreq ?? 0.08) * 0.45;
  const amp = (e.wobbleAmp ?? 0.14) * 0.85;

  // Flanqueamento tático de multidão
  const flankedAngle = applyCrowdFlanking(e, angle, ctx, dt);

  // Oscilação suave do passo cambaleante do zumbi
  const sway = Math.sin(frame * freq + phase) * amp;

  // Se o monstro estiver bem perto do jogador, foca no ataque melee direto sem desvio
  let effectiveAngle = flankedAngle + sway;
  if (ctx?.player) {
    const dx = ctx.player.x - e.x;
    const dy = ctx.player.y - e.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < 36 * 36) {
      const weight = Math.max(0, (Math.sqrt(distSq) - 14) / 22);
      effectiveAngle = angle + (effectiveAngle - angle) * weight;
    }
  }

  e.x += Math.cos(effectiveAngle) * curSpeed * dt;
  e.y += Math.sin(effectiveAngle) * curSpeed * dt;
}
