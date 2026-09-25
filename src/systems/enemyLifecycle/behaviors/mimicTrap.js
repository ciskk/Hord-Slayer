/**
 * src/systems/enemyLifecycle/behaviors/mimicTrap.js
 * IA do Mímico de Éter — Camuflagem de baú mímico dormente até ativação.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';

export function mimicTrapBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, triggerShake } = ctx;
  const isPlayerVisible = !(player.invisTimer > 0);
  const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
  if (!e.isAwakeMimic) {
    curSpeed = 0;
    if ((isPlayerVisible && distToPlayerSq < 52 * 52) || e.hitFlash > 0) {
      e.isAwakeMimic = true;
      playSfx('boss');
      triggerShake(6);
      createHitParticles(e.x, e.y, '#e056fd', 12);
      addDamageText(e.x, e.y, "MÍMICO DESPERTO!", true, '#e056fd');
    }
  } else {
    curSpeed = e.speed * 1.2;
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
  }
}
