/**
 * src/systems/enemyLifecycle/behaviors/spikeRetaliation.js
 * IA da Donzela das Agulhas — Retaliação espinhosa de 8 projéteis.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';
import { canSpawnEnemyBullet } from '../../projectiles.js';

export function spikeRetaliationBehavior(e, dt, angle, curSpeed, ctx) {
  const { enemyBullets, triggerShake } = ctx;
  e.x += Math.cos(angle) * curSpeed * dt;
  e.y += Math.sin(angle) * curSpeed * dt;
  if (e.hitFlash === 3) {
    e.spikeHits = (e.spikeHits || 0) + 1;
    if (e.spikeHits >= 4 && canSpawnEnemyBullet()) {
      e.spikeHits = 0;
      playSfx('crit');
      triggerShake(3);
      for (let s = 0; s < 8; s++) {
        const sa = s * (Math.PI * 2 / 8);
        enemyBullets.push({
          x: e.x + Math.cos(sa) * 12,
          y: e.y + Math.sin(sa) * 12,
          vx: Math.cos(sa) * 3.8,
          vy: Math.sin(sa) * 3.8,
          radius: 4.5,
          damage: 16,
          life: 55,
          bulletType: 'THORN_SPIKE',
          color: '#8e44ad'
        });
      }
      createHitParticles(e.x, e.y, '#8e44ad', 10);
      addDamageText(e.x, e.y, "ESPÃOS!", false, '#e056fd');
    }
  }
}
