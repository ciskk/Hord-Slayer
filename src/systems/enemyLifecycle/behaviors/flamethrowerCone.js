/**
 * src/systems/enemyLifecycle/behaviors/flamethrowerCone.js
 * IA do Lança-Chamas da Forja — Cone de lança-chamas direcional.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';
import { triggerDeath } from '../../ui.js';
import { setLastAttackerInfo } from '../../../state/events.js';

export function flamethrowerConeBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, frameCount, triggerShake, setLastAttackerName } = ctx;
  const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
  if (e.flameState === 'chase') {
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
    if (distToPlayerSq <= 85 * 85) {
      e.flameState = 'aim';
      e.flameTimer = 23;
      e.flameAngle = angle;
    }
  } else if (e.flameState === 'aim') {
    e.flameTimer -= dt;
    e.flameAngle = angle;
    e.aimAngle = e.flameAngle;
    if (e.flameTimer <= 0) {
      e.flameState = 'firing';
      e.flameTimer = 50;
      playSfx('acid');
    }
  } else if (e.flameState === 'firing') {
    e.flameTimer -= dt;

    // Rastreamento angular limitado durante o disparo (permite ao jogador contornar o mob)
    const playerAng = Math.atan2(player.y - e.y, player.x - e.x);
    let dAng = playerAng - e.flameAngle;
    while (dAng > Math.PI) dAng -= Math.PI * 2;
    while (dAng < -Math.PI) dAng += Math.PI * 2;
    e.flameAngle += Math.sign(dAng) * Math.min(Math.abs(dAng), 0.038 * dt);
    e.aimAngle = e.flameAngle;

    if (Math.floor(frameCount) % 2 === 0) {
      const fSpread = (Math.random() - 0.5) * 0.45;
      const fDist = 28 + Math.random() * 85;
      const fx = e.x + Math.cos(e.flameAngle + fSpread) * fDist;
      const fy = e.y + Math.sin(e.flameAngle + fSpread) * fDist;
      createHitParticles(fx, fy, Math.random() < 0.4 ? '#ffffff' : (Math.random() < 0.6 ? '#f1c40f' : '#e67e22'), 2);
    }
    if (distToPlayerSq <= 115 * 115) {
      const playerAngleFromMob = Math.atan2(player.y - e.y, player.x - e.x);
      let angleDiff = Math.abs(playerAngleFromMob - e.flameAngle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
      if (angleDiff < 0.52 && player.iFrames <= 0) {
        player.hp -= 7;
        player.iFrames = 11;
        triggerShake(2);
        playSfx('hit');
        setLastAttackerInfo({
          name: e.name || 'Lança-Chamas da Forja',
          category: 'HORDE',
          attackName: 'Cone de Chamas',
          damage: 7,
          enemyType: e.baseType || 'FORGE_PYREGUARD'
        });
        addDamageText(player.x, player.y, "-7", false, '#e67e22');
        createHitParticles(player.x, player.y, '#e67e22', 3);
        if (player.hp <= 0) {
          player.hp = 0;
          triggerDeath();
          return { playerDied: true };
        }
      }
    }
    if (e.flameTimer <= 0) {
      e.flameState = 'cooldown';
      e.flameTimer = 42;
    }
  } else if (e.flameState === 'cooldown') {
    e.flameTimer -= dt;
    e.x += Math.cos(angle) * curSpeed * 0.4 * dt;
    e.y += Math.sin(angle) * curSpeed * 0.4 * dt;
    if (e.flameTimer <= 0) {
      e.flameState = 'chase';
    }
  }
}
