/**
 * src/systems/enemyLifecycle/behaviors/blinkSlash.js
 * IA do Fatiador Quântico — Teleporte quântico + corte de foice.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';

export function blinkSlashBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, frameCount, bossTelegraphs } = ctx;
  e.blinkTimer = (e.blinkTimer || 0) + dt;
  if (e.blinkTimer < 100) {
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
  } else if (e.blinkTimer < 130) {
    if (Math.floor(frameCount) % 4 === 0) createHitParticles(e.x, e.y, '#a29bfe', 2);
  } else {
    e.blinkTimer = 0;
    createHitParticles(e.x, e.y, '#6c5ce7', 12);
    const flankSide = Math.random() < 0.5 ? Math.PI * 0.5 : -Math.PI * 0.5;
    const flankAng = Math.atan2(e.y - player.y, e.x - player.x) + flankSide;
    e.x = player.x + Math.cos(flankAng) * 70;
    e.y = player.y + Math.sin(flankAng) * 70;
    createHitParticles(e.x, e.y, '#e056fd', 14);
    playSfx('crit');
    const cleaveAng = Math.atan2(player.y - e.y, player.x - e.x);
    bossTelegraphs.push({
      type: 'SCYTHE_CLEAVE',
      x: e.x,
      y: e.y,
      radius: 95,
      angle: cleaveAng,
      timer: 20,
      maxTimer: 20,
      damage: Math.round(e.damage * 1.1)
    });
    addDamageText(e.x, e.y, "CORTE QUÂNTICO!", true, '#a29bfe');
  }
}
