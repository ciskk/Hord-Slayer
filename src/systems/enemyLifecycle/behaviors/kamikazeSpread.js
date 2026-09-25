/**
 * src/systems/enemyLifecycle/behaviors/kamikazeSpread.js
 * IA do Incinerador Instável — Autodestruição com estilhaços 8-way.
 */
import { createHitParticles } from '../../combat.js';

export function kamikazeSpreadBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, frameCount, bossTelegraphs } = ctx;
  const isPlayerVisible = !(player.invisTimer > 0);
  const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
  if (e.fuseState === 'FUSE') {
    curSpeed = 0;
    e.fuseTimer -= dt;
    e.hitFlash = Math.max(e.hitFlash || 0, 1);
    if (Math.floor(frameCount) % 5 === 0) createHitParticles(e.x, e.y, '#d35400', 1);
    if (e.fuseTimer <= 0) {
      e.hp = 0;
      e.explodedNaturally = true;
    }
  } else {
    if (isPlayerVisible && distToPlayerSq <= 60 * 60) {
      e.fuseState = 'FUSE';
      e.fuseTimer = 40;
      e.fuseTelegraph = {
        type: 'FUSE_INDICATOR',
        x: e.x,
        y: e.y,
        radius: 65,
        timer: 40,
        maxTimer: 40,
        color: 'rgba(211, 84, 0, 0.45)'
      };
      bossTelegraphs.push(e.fuseTelegraph);
    } else {
      e.x += Math.cos(angle) * curSpeed * 1.25 * dt;
      e.y += Math.sin(angle) * curSpeed * 1.25 * dt;
    }
  }
}
