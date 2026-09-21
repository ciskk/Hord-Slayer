/**
 * src/entities/enemies/minibosses/mobileHive.js
 * 
 * Controlador e FSM do Miniboss Ninho Móvel (MOBILE_HIVE).
 */
import { safePlaySfx } from './common.js';

export const mobileHiveHandler = {
init(e) {
  e.skillCooldown = 58;
},
update(e, dt, ctx, dist, angle) {
  const { acidPuddles, enemyBullets, createHitParticles } = ctx;

  if (e.actionState === 'CHASE') {
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;

    e.skillCooldown -= dt;
    if (e.skillCooldown <= 0) {
      if (Math.random() < 0.6) {
        e.currentSkill = 'SWARM_MISSILES';
        e.actionState = 'WINDUP';
        e.actionTimer = 22;
        e.actionMaxTimer = 22;
        safePlaySfx('boss');
        ctx.addDamageText(e.x, e.y, "ENXAME!", true, '#16a085');
      } else {
        e.currentSkill = 'SMOG_CLOUD';
        e.actionState = 'WINDUP';
        e.actionTimer = 18;
        e.actionMaxTimer = 18;
        safePlaySfx('charge');
      }
    }
  } else if (e.actionState === 'WINDUP') {
    e.actionTimer -= dt;
    e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
    if (e.actionTimer <= 0) {
      e.actionState = 'STRIKE';
    }
  } else if (e.actionState === 'STRIKE') {
    if (e.currentSkill === 'SWARM_MISSILES') {
      safePlaySfx('shoot');
      createHitParticles(e.x, e.y, '#16a085', 12);
      for (let m = 0; m < 4; m++) {
        const bAng = angle + (m - 1.5) * 0.28;
        enemyBullets.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(bAng) * 4.0,
          vy: Math.sin(bAng) * 4.0,
          radius: 5,
          damage: Math.round(e.damage * 0.35),
          life: 80,
          bulletType: 'BAT',
          color: '#16a085'
        });
      }
    } else if (e.currentSkill === 'SMOG_CLOUD') {
      safePlaySfx('freeze');
      acidPuddles.push({
        x: e.x,
        y: e.y,
        radius: 38,
        life: 260,
        maxLife: 260,
        isFire: false
      });
    }
    e.actionState = 'RECOVERY';
    e.actionTimer = 19;
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
