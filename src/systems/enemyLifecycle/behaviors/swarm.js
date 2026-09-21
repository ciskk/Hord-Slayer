/**
 * src/systems/enemyLifecycle/behaviors/swarm.js
 * IA de Enxame Ondulante (Morcegos) — Mergulho com offset sinusoidal.
 */
export function swarmBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, frameCount } = ctx;
  const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
  const isDive = distToPlayerSq < 135 * 135;
  const diveBonus = isDive ? 1.35 : 1.0;
  e.x += Math.cos(angle + Math.sin(frameCount * 0.12) * 0.35) * curSpeed * diveBonus * dt;
  e.y += Math.sin(angle + Math.sin(frameCount * 0.12) * 0.35) * curSpeed * diveBonus * dt;
}
