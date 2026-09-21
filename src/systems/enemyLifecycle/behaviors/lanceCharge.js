/**
 * src/systems/enemyLifecycle/behaviors/lanceCharge.js
 * IA do Cavaleiro Sem Cabeça — Investida devastadora de lança.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';
import { triggerDeath } from '../../ui.js';

export function lanceChargeBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, triggerShake, setLastAttackerName } = ctx;
  if (e.lanceState === 'chase') {
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
    e.lanceTimer = (e.lanceTimer || 0) + dt;
    const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
    if (e.lanceTimer >= 69 && distToPlayerSq <= 240 * 240) {
      e.lanceState = 'aim';
      e.lanceTimer = 20;
      e.lanceAngle = angle;
      playSfx('boss');
    }
  } else if (e.lanceState === 'aim') {
    e.lanceTimer -= dt;
    if (e.lanceTimer <= 0) {
      e.lanceState = 'charging';
      e.lanceTimer = 15;
      playSfx('crit');
      triggerShake(4);
    }
  } else if (e.lanceState === 'charging') {
    curSpeed = e.speed * 4.2;
    e.x += Math.cos(e.lanceAngle) * curSpeed * dt;
    e.y += Math.sin(e.lanceAngle) * curSpeed * dt;
    createHitParticles(e.x, e.y, '#2c3e50', 2);
    e.lanceTimer -= dt;
    const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
    if (distToPlayerSq <= (e.radius + player.radius + 6) ** 2 && player.iFrames <= 0) {
      player.hp -= e.damage;
      player.iFrames = 22;
      if (setLastAttackerName) setLastAttackerName("Cavaleiro Sem Cabeça");
      triggerShake(7);
      playSfx('hit');
      addDamageText(player.x, player.y, `-${Math.round(e.damage)}`, false, '#2c3e50');
      createHitParticles(player.x, player.y, '#ff4757', 6);
      if (player.hp <= 0) {
        player.hp = 0;
        triggerDeath();
        return { playerDied: true };
      }
    }
    if (e.lanceTimer <= 0) {
      e.lanceState = 'cooldown';
      e.lanceTimer = 31;
    }
  } else if (e.lanceState === 'cooldown') {
    e.lanceTimer -= dt;
    e.x += Math.cos(angle) * curSpeed * 0.3 * dt;
    e.y += Math.sin(angle) * curSpeed * 0.3 * dt;
    if (e.lanceTimer <= 0) {
      e.lanceState = 'chase';
      e.lanceTimer = 0;
    }
  }
}
