/**
 * src/systems/enemyLifecycle/behaviors/mirrorDecoy.js
 * IA da Banshee dos Espelhos — Ilusão de clones espelho ao sofrer dano.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';
import { createEnemy } from '../../../entities/enemies.js';

export function mirrorDecoyBehavior(e, dt, angle, curSpeed, ctx) {
  const { enemies } = ctx;
  if (e.isDecoy) {
    e.decoyLife = (e.decoyLife || 180) - dt;
    if (e.decoyLife <= 0 || e.hp <= 0) {
      e.hp = 0;
      createHitParticles(e.x, e.y, '#a29bfe', 6);
    }
  }
  e.x += Math.cos(angle) * curSpeed * dt;
  e.y += Math.sin(angle) * curSpeed * dt;
  if (e.hitFlash > 0 && !e.hasMirrored && !e.isDecoy) {
    e.hasMirrored = true;
    playSfx('warp');
    createHitParticles(e.x, e.y, '#a29bfe', 10);
    addDamageText(e.x, e.y, "ILUSÃO!", false, '#a29bfe');
    for (let d = 0; d < 2; d++) {
      const da = angle + (d === 0 ? 1 : -1) * 0.9;
      const decoyMob = createEnemy('MIRROR_BANSHEE', e.x + Math.cos(da) * 30, e.y + Math.sin(da) * 30, false);
      decoyMob.isDecoy = true;
      decoyMob.decoyLife = 180;
      decoyMob.hp = 35;
      decoyMob.maxHp = 35;
      enemies.push(decoyMob);
    }
  }
}
