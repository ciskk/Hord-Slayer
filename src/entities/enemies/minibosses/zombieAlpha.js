/**
 * src/entities/enemies/minibosses/zombieAlpha.js
 * 
 * Controlador e FSM do Miniboss Zumbi Alfa (ZOMBIE_ALPHA).
 */
import { safePlaySfx } from './common.js';
import { vecDist, vecDistSq } from '../../../core/math.js';

export const zombieAlphaHandler = {
init(e) {
  e.skillCooldown = 62;
},
update(e, dt, ctx, dist, angle) {
  const { player, enemies, bossShockwaves, createHitParticles } = ctx;

  if (e.actionState === 'CHASE') {
    const speedBonus = e.enraged ? 1.3 : 1.0;
    e.x += Math.cos(angle) * e.speed * speedBonus * dt;
    e.y += Math.sin(angle) * e.speed * speedBonus * dt;

    e.skillCooldown -= dt;
    if (e.skillCooldown <= 0) {
      if (dist < 140) {
        // Bote Esmagador
        e.currentSkill = 'POUNCE';
        e.actionState = 'WINDUP';
        e.actionTimer = 17;
        e.actionMaxTimer = 17;
        e.pounceAngle = angle;
        safePlaySfx('charge');
        ctx.addDamageText(e.x, e.y, "BOTE!", true, '#27ae60');
      } else {
        // Rugido de Guerra Alfa
        e.currentSkill = 'HOWL';
        e.actionState = 'WINDUP';
        e.actionTimer = 25;
        e.actionMaxTimer = 25;
        safePlaySfx('boss');
        ctx.addDamageText(e.x, e.y, "RUGIDO ALFA!", true, '#2ecc71');
      }
    }
  } else if (e.actionState === 'WINDUP') {
    e.actionTimer -= dt;
    e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
    // Treme e desacelera
    e.x += (Math.random() - 0.5) * 1.5;
    if (e.actionTimer <= 0) {
      e.actionState = 'STRIKE';
    }
  } else if (e.actionState === 'STRIKE') {
    if (e.currentSkill === 'POUNCE') {
      safePlaySfx('crit');
      ctx.triggerShake(7);
      e.x += Math.cos(e.pounceAngle) * 55;
      e.y += Math.sin(e.pounceAngle) * 55;
      createHitParticles(e.x, e.y, '#27ae60', 14);

      bossShockwaves.push({
        x: e.x,
        y: e.y,
        radius: 12,
        maxRadius: 75,
        speed: 4.5,
        damage: Math.round(e.damage * 0.9),
        hitPlayer: false,
        colorRgb: '39, 174, 96'
      });
    } else if (e.currentSkill === 'HOWL') {
      safePlaySfx('boss');
      ctx.triggerShake(6);
      createHitParticles(e.x, e.y, '#2ecc71', 20);

      // Pulso visual que acelera os zumbis ao redor
      bossShockwaves.push({
        x: e.x,
        y: e.y,
        radius: 15,
        maxRadius: 180,
        speed: 5.5,
        damage: 0,
        hitPlayer: false,
        colorRgb: '46, 204, 113'
      });

      // Concede fúria temporária para zumbis aliados próximos
      for (let i = 0; i < enemies.length; i++) {
        const ally = enemies[i];
        if (ally && ally !== e && ally.baseType === 'ZOMBIE') {
          const aDistSq = vecDistSq(e.x, e.y, ally.x, ally.y);
          if (aDistSq < 180 * 180) {
            ally.speed = Math.min(ally.baseSpeed * 1.45, 2.5);
            ally.hitFlash = 3;
            createHitParticles(ally.x, ally.y, '#2ecc71', 2);
          }
        }
      }
    }
    e.actionState = 'RECOVERY';
    e.actionTimer = e.enraged ? 15 : 27;
  } else if (e.actionState === 'RECOVERY') {
    e.actionTimer -= dt;
    e.x += Math.cos(angle) * e.speed * 0.4 * dt;
    e.y += Math.sin(angle) * e.speed * 0.4 * dt;
    if (e.actionTimer <= 0) {
      e.actionState = 'CHASE';
      e.currentSkill = null;
      e.skillCooldown = e.enraged ? 38 : 65;
    }
  }
}
};
