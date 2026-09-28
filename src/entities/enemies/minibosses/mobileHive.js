/**
 * src/entities/enemies/minibosses/mobileHive.js
 * 
 * Controlador e FSM do Miniboss Ninho Móvel (MOBILE_HIVE).
 */
import { safePlaySfx, matchText } from './common.js';

export const mobileHiveHandler = {
init(e) {
  e.skillCooldown = 58;
},
update(e, dt, ctx, dist, angle) {
  const { acidPuddles, enemyBullets, createHitParticles } = ctx;

  if (e.actionState === 'CHASE') {
    e.aimAngle = angle;
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;

    e.skillCooldown -= dt;
    if (e.skillCooldown <= 0) {
      if (Math.random() < 0.6) {
        e.currentSkill = 'SWARM_MISSILES';
        e.actionState = 'WINDUP';
        e.actionTimer = 22;
        e.actionMaxTimer = 22;
        e.aimAngle = angle;
        safePlaySfx('boss');
        ctx.addDamageText(e.x, e.y, matchText('match.combat.swarm'), true, '#16a085');
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
    e.aimAngle = angle;
    if (e.actionTimer <= 0) {
      e.actionState = 'STRIKE';
    }
  } else if (e.actionState === 'STRIKE') {
    if (e.currentSkill === 'SWARM_MISSILES') {
      safePlaySfx('shoot');
      createHitParticles(e.x, e.y, '#16a085', 14);
      const count = e.enraged ? 6 : 4;
      const poreDist = (e.radius || 20) * 0.85;

      for (let m = 0; m < count; m++) {
        const spread = (m - (count - 1) * 0.5) * 0.22;
        const bAng = e.aimAngle + spread;
        const px = e.x + Math.cos(bAng) * poreDist;
        const py = e.y + Math.sin(bAng) * poreDist;
        enemyBullets.push({
          x: px,
          y: py,
          vx: Math.cos(bAng) * 4.2,
          vy: Math.sin(bAng) * 4.2,
          radius: 5,
          damage: Math.round(e.damage * 0.35),
          life: 85,
          bulletType: 'SWARM_HORNET',
          color: '#16a085',
          sourceName: 'Ninho Móvel'
        });
        createHitParticles(px, py, '#2ecc71', 3);
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
