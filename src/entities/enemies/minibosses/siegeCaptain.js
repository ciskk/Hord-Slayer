import { t as matchText } from '../../../i18n/index.js';
/**
 * src/entities/enemies/minibosses/siegeCaptain.js
 * 
 * Controlador e FSM do Miniboss Capitão de Cerco (SIEGE_CAPTAIN).
 */
import { safePlaySfx } from './common.js';

export const siegeCaptainHandler = {
init(e) {
  e.skillCooldown = 58;
},
update(e, dt, ctx, dist, angle) {
  const { player, enemyBullets, bossTelegraphs, createHitParticles } = ctx;

  if (e.actionState === 'CHASE') {
    e.aimAngle = angle;
    if (dist < 170) {
      e.x -= Math.cos(angle) * e.speed * dt;
      e.y -= Math.sin(angle) * e.speed * dt;
    } else if (dist > 250) {
      e.x += Math.cos(angle) * e.speed * dt;
      e.y += Math.sin(angle) * e.speed * dt;
    }

    e.skillCooldown -= dt;
    if (e.skillCooldown <= 0) {
      if (dist < 130) {
        e.currentSkill = 'FLAK_BLAST';
        e.actionState = 'WINDUP';
        e.actionTimer = 18;
        e.actionMaxTimer = 18;
        e.aimAngle = angle;
        safePlaySfx('charge');
        ctx.addDamageText(e.x, e.y, matchText('match.combat.guns'), true, '#b71540');
      } else {
        e.currentSkill = 'MORTAR_BARRAGE';
        e.actionState = 'WINDUP';
        e.actionTimer = 26;
        e.actionMaxTimer = 26;
        safePlaySfx('shoot');
        ctx.addDamageText(e.x, e.y, matchText('match.combat.barrage'), true, '#b71540');

        for (let m = 0; m < 3; m++) {
          const mAng = (m * Math.PI * 2 / 3) + Math.random() * 0.4;
          const mDist = 35 + m * 15;
          bossTelegraphs.push({
            x: player.x + Math.cos(mAng) * mDist,
            y: player.y + Math.sin(mAng) * mDist,
            radius: 50,
            timer: 26 + m * 6,
            maxTimer: 26 + m * 6,
            damage: Math.round(e.damage * 0.9),
            color: '#b71540'
          });
        }
      }
    }
  } else if (e.actionState === 'WINDUP') {
    e.actionTimer -= dt;
    e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
    if (e.currentSkill === 'FLAK_BLAST') {
      e.aimAngle = angle;
    }
    if (e.actionTimer <= 0) {
      e.actionState = 'STRIKE';
    }
  } else if (e.actionState === 'STRIKE') {
    if (e.currentSkill === 'FLAK_BLAST') {
      safePlaySfx('boss');
      ctx.triggerShake(7);
      createHitParticles(e.x + Math.cos(e.aimAngle) * 26, e.y + Math.sin(e.aimAngle) * 26, '#b71540', 16);
      createHitParticles(e.x + Math.cos(e.aimAngle) * 28, e.y + Math.sin(e.aimAngle) * 28, '#f1c40f', 8);

      e.x -= Math.cos(e.aimAngle) * 6;
      e.y -= Math.sin(e.aimAngle) * 6;

      for (let s = -3; s <= 3; s++) {
        const sAng = e.aimAngle + s * 0.14;
        enemyBullets.push({
          x: e.x + Math.cos(sAng) * 24,
          y: e.y + Math.sin(sAng) * 24,
          vx: Math.cos(sAng) * 5.2,
          vy: Math.sin(sAng) * 5.2,
          radius: 4.5,
          damage: Math.round(e.damage * 0.35),
          life: 65,
          bulletType: 'FIRE_SHRAPNEL',
          color: '#b71540'
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
      e.skillCooldown = e.enraged ? 35 : 58;
    }
  }
}
};
