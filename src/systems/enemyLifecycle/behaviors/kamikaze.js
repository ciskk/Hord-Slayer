/**
 * src/systems/enemyLifecycle/behaviors/kamikaze.js
 * IA do Carniçal Ígneo — Carga suicida com telegráfo de fusível.
 */
import { createHitParticles } from '../../combat.js';

export function kamikazeBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, frameCount, bossTelegraphs } = ctx;
  const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
  if (e.fuseState === 'FUSE') {
    curSpeed = 0;
    e.fuseTimer -= dt;
    e.hitFlash = Math.max(e.hitFlash || 0, 1);
    if (Math.floor(frameCount) % 5 === 0) createHitParticles(e.x, e.y, '#e67e22', 1);
    if (e.fuseTimer <= 0) {
      e.hp = 0;
      e.explodedNaturally = true;
    }
  } else {
    if (distToPlayerSq <= 55 * 55) {
      e.fuseState = 'FUSE';
      e.fuseTimer = 28;
      e.fuseTelegraph = {
        type: 'FUSE_INDICATOR',
        x: e.x,
        y: e.y,
        radius: 50,
        timer: 28,
        maxTimer: 28,
        color: 'rgba(230, 126, 34, 0.45)'
      };
      bossTelegraphs.push(e.fuseTelegraph);
    } else {
      e.x += Math.cos(angle) * curSpeed * dt;
      e.y += Math.sin(angle) * curSpeed * dt;
    }
  }
}
