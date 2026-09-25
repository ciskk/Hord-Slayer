/**
 * src/systems/enemyLifecycle/behaviors/chaosCycle.js
 * IA do Arauto do Caos — Ciclo de 3 fases: espiral, carga e colapso.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';
import { canSpawnEnemyBullet } from '../../projectiles.js';

export function chaosCycleBehavior(e, dt, angle, curSpeed, ctx) {
  const { frameCount, enemyBullets, bossShockwaves, triggerShake } = ctx;
  e.cycleTimer = (e.cycleTimer || 0) + dt;
  e.cycleState = e.cycleState || 0;
  if (e.cycleState === 0) {
    e.x += Math.cos(angle) * curSpeed * 0.85 * dt;
    e.y += Math.sin(angle) * curSpeed * 0.85 * dt;
    if (Math.floor(frameCount) % 15 === 0 && canSpawnEnemyBullet()) {
      const spinAng = frameCount * 0.15;
      playSfx('shoot');
      for (let s = 0; s < 2; s++) {
        if (!canSpawnEnemyBullet()) break;
        const sOffset = spinAng + s * Math.PI;
        enemyBullets.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(sOffset) * 3.6,
          vy: Math.sin(sOffset) * 3.6,
          radius: 5,
          damage: Math.round(e.damage * 0.35),
          life: 85,
          bulletType: 'CHAOS',
          sourceName: e.name || 'Ciclope do Caos',
          enemyType: e.baseType || 'CHAOS_HERALD'
        });
      }
    }
  } else if (e.cycleState === 1) {
    if (!e.chargeAngle) e.chargeAngle = angle;
    e.x += Math.cos(e.chargeAngle) * curSpeed * 2.8 * dt;
    e.y += Math.sin(e.chargeAngle) * curSpeed * 2.8 * dt;
    createHitParticles(e.x, e.y, '#c0392b', 1);
  } else if (e.cycleState === 2) {
    e.x += Math.cos(angle) * curSpeed * 0.5 * dt;
    e.y += Math.sin(angle) * curSpeed * 0.5 * dt;
    if (e.cycleTimer >= 85 && !e.hasSlammed) {
      e.hasSlammed = true;
      triggerShake(10);
      playSfx('boss');
      bossShockwaves.push({
        x: e.x,
        y: e.y,
        radius: 14,
        maxRadius: 130,
        speed: 4.5,
        damage: Math.round(e.damage * 0.8),
        hitPlayer: false
      });
      createHitParticles(e.x, e.y, '#e74c3c', 16);
      addDamageText(e.x, e.y, "COLAPSO DO CAOS!", true, '#c0392b');
    }
  }
  if (e.cycleTimer >= 90) {
    e.cycleTimer = 0;
    e.cycleState = (e.cycleState + 1) % 3;
    e.chargeAngle = null;
    e.hasSlammed = false;
  }
}
