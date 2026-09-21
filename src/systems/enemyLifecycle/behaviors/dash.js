/**
 * src/systems/enemyLifecycle/behaviors/dash.js
 * IA do Assassino Espectral (Stalker) — Carga com emboscada de flanco.
 */
import { createHitParticles } from '../../combat.js';

export function dashBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, frameCount } = ctx;
  e.dashTimer = (e.dashTimer || 0) + dt;
  if (e.dashState === 'chase') {
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
    if (e.dashTimer > 81) {
      e.dashState = 'aim';
      e.dashTimer = 0;
      // Emboscada de Flanco para Stalker (Assassino Espectral)
      if (e.baseType === 'STALKER' && Math.random() < 0.75) {
        createHitParticles(e.x, e.y, '#6c5ce7', 6);
        const flankOffset = (Math.random() < 0.5 ? 1 : -1) * (Math.PI * 0.4);
        const flankAng = angle + flankOffset;
        e.x = player.x - Math.cos(flankAng) * 90;
        e.y = player.y - Math.sin(flankAng) * 90;
        createHitParticles(e.x, e.y, '#a29bfe', 8);
        e.dashAngle = Math.atan2(player.y - e.y, player.x - e.x);
      } else {
        e.dashAngle = angle;
      }
    }
  } else if (e.dashState === 'aim') {
    if (e.dashTimer > 15) {
      e.dashState = 'dashing';
      e.dashTimer = 0;
    }
  } else if (e.dashState === 'dashing') {
    curSpeed = e.speed * 4.2;
    e.x += Math.cos(e.dashAngle) * curSpeed * dt;
    e.y += Math.sin(e.dashAngle) * curSpeed * dt;
    createHitParticles(e.x, e.y, '#9b59b6', 1);
    if (e.dashTimer > 14) {
      e.dashState = 'cooldown';
      e.dashTimer = 0;
    }
  } else if (e.dashState === 'cooldown') {
    curSpeed = e.speed * 0.4;
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
    if (e.dashTimer > 27) {
      e.dashState = 'chase';
      e.dashTimer = 0;
    }
  }
}
