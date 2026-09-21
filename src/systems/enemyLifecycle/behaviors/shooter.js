/**
 * src/systems/enemyLifecycle/behaviors/shooter.js
 * IA do Autômato Artilheiro — Aero-Dash de recuo + Rajada Tática Tripla.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';
import { canSpawnEnemyBullet } from '../../projectiles.js';

export function shooterBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, enemyBullets } = ctx;
  const isPlayerVisible = player.invisTimer <= 0;
  if (e.thrusterCooldown > 0) e.thrusterCooldown -= dt;

  if (isPlayerVisible) {
    const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;

    // Propulsão de Emergência (Aero-Dash) se o jogador invadir o perímetro próximo (< 65px)
    if (distToPlayerSq < 65 * 65 && (!e.thrusterCooldown || e.thrusterCooldown <= 0)) {
      e.thrusterCooldown = 160;
      e.x -= Math.cos(angle) * 70;
      e.y -= Math.sin(angle) * 70;
      playSfx('warp');
      createHitParticles(e.x, e.y, '#00cec9', 10);
      addDamageText(e.x, e.y, "RECUO A JATO!", false, '#00cec9');
    } else if (distToPlayerSq < 170 * 170) {
      e.x -= Math.cos(angle) * curSpeed * dt;
      e.y -= Math.sin(angle) * curSpeed * dt;
    } else if (distToPlayerSq > 240 * 240) {
      e.x += Math.cos(angle) * curSpeed * dt;
      e.y += Math.sin(angle) * curSpeed * dt;
    }

    // Rajada Tática Tripla (3-Round Burst)
    if (e.burstRemaining > 0) {
      e.burstTimer = (e.burstTimer || 0) + dt;
      if (e.burstTimer >= 5) {
        e.burstTimer = 0;
        e.burstRemaining--;
        if (canSpawnEnemyBullet()) {
          const spreadAngle = angle + (e.burstRemaining - 1) * 0.12;
          enemyBullets.push({
            x: e.x + Math.cos(spreadAngle) * 14,
            y: e.y + Math.sin(spreadAngle) * 14,
            vx: Math.cos(spreadAngle) * 3.9,
            vy: Math.sin(spreadAngle) * 3.9,
            radius: 5.5,
            damage: 16,
            life: 95,
            bulletType: 'TECH',
            color: '#ff4757'
          });
          playSfx('shoot');
          createHitParticles(e.x + Math.cos(spreadAngle) * 16, e.y + Math.sin(spreadAngle) * 16, '#ff4757', 3);
          // Recuo mecânico
          e.x -= Math.cos(spreadAngle) * 2.5;
          e.y -= Math.sin(spreadAngle) * 2.5;
        }
      }
    } else {
      e.shootTimer += dt;
      if (e.shootTimer >= 114) {
        if (canSpawnEnemyBullet()) {
          e.shootTimer = 0;
          e.burstRemaining = 3;
          e.burstTimer = 5;
        } else {
          e.shootTimer = 114 - 20;
        }
      }
    }
  } else {
    e.x += Math.cos(angle) * curSpeed * 0.3 * dt;
    e.y += Math.sin(angle) * curSpeed * 0.3 * dt;
  }
}
