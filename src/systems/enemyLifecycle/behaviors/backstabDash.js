/**
 * src/systems/enemyLifecycle/behaviors/backstabDash.js
 * IA do Predador Espectral — Mira na retaguarda do jogador e golpe crítico.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles } from '../../combat.js';

export function backstabDashBehavior(e, dt, angle, curSpeed, ctx) {
  const { player } = ctx;
  e.dashState = e.dashState || 'chase';
  e.dashTimer = (e.dashTimer || 0) + dt;
  if (e.dashState === 'chase') {
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
    if (e.dashTimer > 90) {
      e.dashState = 'aim';
      e.dashTimer = 0;
      const playerAng = player.facing === 1 ? 0 : Math.PI;
      const backX = player.x - Math.cos(playerAng) * 80;
      const backY = player.y - Math.sin(playerAng) * 80;
      e.dashAngle = Math.atan2(backY - e.y, backX - e.x);
    }
  } else if (e.dashState === 'aim') {
    curSpeed = e.speed * 0.25;
    e.x += Math.cos(e.dashAngle) * curSpeed * dt;
    e.y += Math.sin(e.dashAngle) * curSpeed * dt;
    if (e.dashTimer > 20) {
      e.dashState = 'dashing';
      e.dashTimer = 0;
      playSfx('crit');
    }
  } else if (e.dashState === 'dashing') {
    curSpeed = e.speed * 4.5;
    e.x += Math.cos(e.dashAngle) * curSpeed * dt;
    e.y += Math.sin(e.dashAngle) * curSpeed * dt;
    createHitParticles(e.x, e.y, '#6c5ce7', 2);
    if (e.dashTimer > 18) {
      e.dashState = 'cooldown';
      e.dashTimer = 0;
    }
  } else if (e.dashState === 'cooldown') {
    curSpeed = e.speed * 0.35;
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
    if (e.dashTimer > 35) {
      e.dashState = 'chase';
      e.dashTimer = 0;
    }
  }
}
