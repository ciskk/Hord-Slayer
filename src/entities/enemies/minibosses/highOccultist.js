/**
 * src/entities/enemies/minibosses/highOccultist.js
 * 
 * Controlador e FSM do Miniboss Alto Sacerdote (HIGH_OCCULTIST).
 */
import { safePlaySfx } from './common.js';

export const highOccultistHandler = {
init(e) {
  e.skillCooldown = 62;
},
update(e, dt, ctx, dist, angle) {
  const { player, enemyBullets, bossTelegraphs, createHitParticles } = ctx;

  if (e.actionState === 'CHASE') {
    e.aimAngle = angle;
    if (dist < 150) {
      e.x -= Math.cos(angle) * e.speed * dt;
      e.y -= Math.sin(angle) * e.speed * dt;
    } else if (dist > 220) {
      e.x += Math.cos(angle) * e.speed * dt;
      e.y += Math.sin(angle) * e.speed * dt;
    }

    e.skillCooldown -= dt;
    if (e.skillCooldown <= 0) {
      if (Math.random() < 0.55) {
        e.currentSkill = 'SINGULARITY';
        e.actionState = 'WINDUP';
        e.actionTimer = 34;
        e.actionMaxTimer = 34;
        e.aimAngle = angle;
        e.runeX = player.x;
        e.runeY = player.y;
        safePlaySfx('singularity');
        ctx.addDamageText(e.x, e.y, "SELO ABISSAL!", true, '#341f97');

        bossTelegraphs.push({
          type: 'ABYSSAL_VOID_RIFT',
          x: e.runeX,
          y: e.runeY,
          radius: 65,
          timer: 34,
          maxTimer: 34,
          damage: Math.round(e.damage * 1.25)
        });
      } else {
        e.currentSkill = 'CURSE_ORBS';
        e.actionState = 'WINDUP';
        e.actionTimer = 20;
        e.actionMaxTimer = 20;
        e.aimAngle = angle;
        safePlaySfx('charge');
      }
    }
  } else if (e.actionState === 'WINDUP') {
    e.actionTimer -= dt;
    e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
    e.aimAngle = angle;

    if (e.currentSkill === 'SINGULARITY' && e.runeX !== undefined) {
      const rdx = e.runeX - player.x;
      const rdy = e.runeY - player.y;
      const rdist = Math.hypot(rdx, rdy);
      if (rdist < 220 && rdist > 15) {
        player.x += (rdx / rdist) * 0.9 * dt;
        player.y += (rdy / rdist) * 0.9 * dt;
      }
    }

    if (e.actionTimer <= 0) {
      e.actionState = 'STRIKE';
    }
  } else if (e.actionState === 'STRIKE') {
    if (e.currentSkill === 'CURSE_ORBS') {
      safePlaySfx('shoot');
      const staffDist = (e.radius || 20) * 1.15;
      const staffX = e.x + Math.cos(e.aimAngle) * staffDist;
      const staffY = e.y + Math.sin(e.aimAngle) * staffDist;
      createHitParticles(staffX, staffY, '#9b59b6', 12);

      for (let k = -1; k <= 1; k++) {
        const bAng = e.aimAngle + k * 0.32;
        enemyBullets.push({
          x: staffX,
          y: staffY,
          vx: Math.cos(bAng) * 3.4,
          vy: Math.sin(bAng) * 3.4,
          radius: 6,
          damage: Math.round(e.damage * 0.4),
          life: 110,
          bulletType: 'SHADOW_ORB',
          color: '#9b59b6'
        });
      }
    }
    e.actionState = 'RECOVERY';
    e.actionTimer = 22;
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
