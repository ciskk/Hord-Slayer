/**
 * src/entities/enemies/minibosses/fireIncinerator.js
 * 
 * Controlador e FSM do Miniboss Incinerador Instável (FIRE_INCINERATOR).
 */
import { safePlaySfx } from './common.js';

export const fireIncineratorHandler = {
init(e) {
  e.skillCooldown = 46;
  e.isFlamethrowing = false;
},
update(e, dt, ctx, dist, angle) {
  const { acidPuddles, bossShockwaves, enemyBullets, createHitParticles } = ctx;

  if (e.actionState === 'CHASE') {
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;

    e.skillCooldown -= dt;
    if (e.skillCooldown <= 0) {
      if (dist < 150) {
        // Lança-Chamas Contínuo
        e.currentSkill = 'FLAMETHROWER';
        e.actionState = 'WINDUP';
        e.actionTimer = 22;
        e.actionMaxTimer = 22;
        e.aimAngle = angle;
        safePlaySfx('charge');
        ctx.addDamageText(e.x, e.y, "LANÇA-CHAMAS!", true, '#e67e22');
      } else {
        // Purga de Vapor e Brasas
        e.currentSkill = 'STEAM_PURGE';
        e.actionState = 'WINDUP';
        e.actionTimer = 20;
        e.actionMaxTimer = 20;
        safePlaySfx('charge');
      }
    }
  } else if (e.actionState === 'WINDUP') {
    e.actionTimer -= dt;
    e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
    e.x += Math.cos(angle) * e.speed * 0.4 * dt;
    e.y += Math.sin(angle) * e.speed * 0.4 * dt;
    if (e.actionTimer <= 0) {
      e.actionState = 'STRIKE';
      if (e.currentSkill === 'FLAMETHROWER') {
        e.flameDuration = 31;
        e.isFlamethrowing = true;
      }
    }
  } else if (e.actionState === 'STRIKE') {
    if (e.currentSkill === 'FLAMETHROWER') {
      e.flameDuration -= dt;
      if (Math.floor(dt * 60) % 4 === 0) {
        safePlaySfx('shoot');
        const spread = (Math.random() - 0.5) * 0.45;
        const fAng = e.aimAngle + spread;
        enemyBullets.push({
          x: e.x + Math.cos(fAng) * 14,
          y: e.y + Math.sin(fAng) * 14,
          vx: Math.cos(fAng) * 4.2,
          vy: Math.sin(fAng) * 4.2,
          radius: 6,
          damage: Math.round(e.damage * 0.28),
          life: 55,
          bulletType: 'FIRE_SHRAPNEL',
          color: '#e67e22'
        });
        createHitParticles(e.x, e.y, '#f39c12', 3);
      }

      if (e.flameDuration <= 0) {
        e.isFlamethrowing = false;
        acidPuddles.push({ x: e.x, y: e.y, radius: 26, life: 180, maxLife: 180, isFire: true });
        e.actionState = 'RECOVERY';
        e.actionTimer = 18;
      }
    } else if (e.currentSkill === 'STEAM_PURGE') {
      safePlaySfx('boss');
      ctx.triggerShake(7);
      createHitParticles(e.x, e.y, '#e67e22', 18);

      bossShockwaves.push({
        x: e.x,
        y: e.y,
        radius: 10,
        maxRadius: 85,
        speed: 4.8,
        damage: Math.round(e.damage * 0.5),
        hitPlayer: false,
        colorRgb: '230, 126, 34'
      });

      for (let k = 0; k < 6; k++) {
        const bAng = (k * Math.PI * 2) / 6;
        enemyBullets.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(bAng) * 3.5,
          vy: Math.sin(bAng) * 3.5,
          radius: 4.5,
          damage: Math.round(e.damage * 0.35),
          life: 65,
          bulletType: 'FIRE_SHRAPNEL',
          color: '#d35400'
        });
      }

      e.actionState = 'RECOVERY';
      e.actionTimer = 20;
    }
  } else if (e.actionState === 'RECOVERY') {
    e.actionTimer -= dt;
    if (e.actionTimer <= 0) {
      e.actionState = 'CHASE';
      e.currentSkill = null;
      e.skillCooldown = e.enraged ? 40 : 65;
    }
  }
}
};
