/**
 * src/systems/enemyLifecycle/behaviors/groundSlam.js
 * IA do Demolidor Sísmico — Impacto sísmico + onda de choque.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';

export function groundSlamBehavior(e, dt, angle, curSpeed, ctx) {
  const { bossShockwaves, triggerShake } = ctx;
  e.x += Math.cos(angle) * curSpeed * dt;
  e.y += Math.sin(angle) * curSpeed * dt;
  e.slamTimer = (e.slamTimer || 0) + dt;
  if (e.slamTimer >= 130) {
    e.slamTimer = 0;
    triggerShake(8);
    playSfx('boss');
    createHitParticles(e.x, e.y, e.color, 12);
    bossShockwaves.push({
      x: e.x,
      y: e.y,
      radius: 12,
      maxRadius: 90,
      speed: 3.5,
      damage: e.damage,
      hitPlayer: false
    });
    addDamageText(e.x, e.y, "IMPACTO SÍSMICO!", false, '#95a5a6');
  }
}
