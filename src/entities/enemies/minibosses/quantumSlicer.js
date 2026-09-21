/**
 * src/entities/enemies/minibosses/quantumSlicer.js
 * 
 * Controlador e FSM do Miniboss Fatiador Quântico (QUANTUM_SLICER).
 */
import { safePlaySfx } from './common.js';

export const quantumSlicerHandler = {
init(e) {
  e.skillCooldown = 54;
  e.blinkCount = 0;
},
update(e, dt, ctx, dist, angle) {
  const { player, bossTelegraphs, createHitParticles } = ctx;

  if (e.actionState === 'CHASE') {
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;

    e.skillCooldown -= dt;
    if (e.skillCooldown <= 0) {
      e.currentSkill = 'TRIPLE_BLINK';
      e.actionState = 'WINDUP';
      e.actionTimer = 14;
      e.actionMaxTimer = 14;
      e.blinkCount = 0;
      safePlaySfx('warp');
    }
  } else if (e.actionState === 'WINDUP') {
    e.actionTimer -= dt;
    e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
    createHitParticles(e.x, e.y, '#a29bfe', 1);

    if (e.actionTimer <= 0) {
      e.actionState = 'STRIKE';
    }
  } else if (e.actionState === 'STRIKE') {
    e.blinkCount++;
    safePlaySfx('crit');
    createHitParticles(e.x, e.y, '#6c5ce7', 10);

    const flankSide = (e.blinkCount % 2 === 0 ? 1 : -1) * (Math.PI * 0.45);
    const flankAng = Math.atan2(e.y - player.y, e.x - player.x) + flankSide;
    e.x = player.x + Math.cos(flankAng) * 65;
    e.y = player.y + Math.sin(flankAng) * 65;
    createHitParticles(e.x, e.y, '#e056fd', 12);

    const cleaveAng = Math.atan2(player.y - e.y, player.x - e.x);
    bossTelegraphs.push({
      type: 'SCYTHE_CLEAVE',
      x: e.x,
      y: e.y,
      radius: 90,
      angle: cleaveAng,
      arcHalf: Math.PI * 0.35,
      timer: 12,
      maxTimer: 12,
      damage: Math.round(e.damage * 0.95),
      color: '#a29bfe',
      colorRgb: '162, 155, 254'
    });

    if (e.blinkCount < (e.enraged ? 4 : 3)) {
      e.actionState = 'WINDUP';
      e.actionTimer = 12;
      e.actionMaxTimer = 12;
    } else {
      e.actionState = 'RECOVERY';
      e.actionTimer = 25;
    }
  } else if (e.actionState === 'RECOVERY') {
    e.actionTimer -= dt;
    if (e.actionTimer <= 0) {
      e.actionState = 'CHASE';
      e.currentSkill = null;
      e.skillCooldown = e.enraged ? 31 : 54;
    }
  }
}
};
