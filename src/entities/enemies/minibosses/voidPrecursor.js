/**
 * src/entities/enemies/minibosses/voidPrecursor.js
 * 
 * Controlador e FSM do Miniboss Precursor do Vazio (VOID_PRECURSOR).
 */
import { safePlaySfx } from './common.js';

export const voidPrecursorHandler = {
init(e) {
  e.skillCooldown = 62;
},
update(e, dt, ctx, dist, angle) {
  const { player, voidVortices, bossTelegraphs, createHitParticles } = ctx;

  if (dist < 260 && dist > 30) {
    player.x += (Math.cos(angle + Math.PI)) * 0.7 * dt;
    player.y += (Math.sin(angle + Math.PI)) * 0.7 * dt;
  }

  if (e.actionState === 'CHASE') {
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;

    e.skillCooldown -= dt;
    if (e.skillCooldown <= 0) {
      if (Math.random() < 0.55) {
        e.currentSkill = 'VOID_VORTEX';
        e.actionState = 'WINDUP';
        e.actionTimer = 27;
        e.actionMaxTimer = 27;
        safePlaySfx('singularity');
        ctx.addDamageText(e.x, e.y, "VÓRTICE DO VAZIO!", true, '#8e44ad');
      } else {
        e.currentSkill = 'EVENT_HORIZON';
        e.actionState = 'WINDUP';
        e.actionTimer = 31;
        e.actionMaxTimer = 31;
        e.beamAngle = angle;
        safePlaySfx('charge');
        ctx.addDamageText(e.x, e.y, "FEIXE CÓSMICO!", true, '#9b59b6');

        bossTelegraphs.push({
          type: 'DIMENSIONAL_CLEAVE',
          x: e.x,
          y: e.y,
          angle: e.beamAngle,
          length: 650,
          width: 32,
          timer: 31,
          maxTimer: 31,
          damage: Math.round(e.damage * 1.3)
        });
      }
    }
  } else if (e.actionState === 'WINDUP') {
    e.actionTimer -= dt;
    e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
    if (e.actionTimer <= 0) {
      e.actionState = 'STRIKE';
    }
  } else if (e.actionState === 'STRIKE') {
    if (e.currentSkill === 'VOID_VORTEX') {
      safePlaySfx('boss');
      ctx.triggerShake(8);
      createHitParticles(e.x, e.y, '#8e44ad', 16);

      voidVortices.push({
        x: e.x,
        y: e.y,
        radius: 70,
        life: 280,
        damage: Math.round(e.damage * 0.45)
      });
    }
    e.actionState = 'RECOVERY';
    e.actionTimer = 23;
  } else if (e.actionState === 'RECOVERY') {
    e.actionTimer -= dt;
    if (e.actionTimer <= 0) {
      e.actionState = 'CHASE';
      e.currentSkill = null;
      e.skillCooldown = e.enraged ? 38 : 62;
    }
  }
}
};
