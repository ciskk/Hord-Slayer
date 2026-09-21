/**
 * src/entities/enemies/minibosses/chaosHerald.js
 * 
 * Controlador e FSM do Miniboss Arauto do Caos (CHAOS_HERALD).
 */
import { safePlaySfx } from './common.js';
import { triggerHaptic } from '../../../core/audio.js';
import { vecDist } from '../../../core/math.js';

export const chaosHeraldHandler = {
init(e) {
  e.skillCooldown = 50;
  e.cycleIndex = 0;
},
update(e, dt, ctx, dist, angle) {
  const { player, enemyBullets, bossTelegraphs, bossShockwaves, createHitParticles } = ctx;

  if (e.actionState === 'CHASE') {
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;

    e.skillCooldown -= dt;
    if (e.skillCooldown <= 0) {
      e.cycleIndex = (e.cycleIndex + 1) % 3;

      if (e.cycleIndex === 0) {
        e.currentSkill = 'CHAOS_SPIRAL';
        e.actionState = 'WINDUP';
        e.actionTimer = 19;
        e.actionMaxTimer = 19;
        safePlaySfx('charge');
        ctx.addDamageText(e.x, e.y, "ESPIRAIS DO CAOS!", true, '#c0392b');
      } else if (e.cycleIndex === 1) {
        e.currentSkill = 'HELLFIRE_CHARGE';
        e.actionState = 'WINDUP';
        e.actionTimer = 25;
        e.actionMaxTimer = 25;
        e.chargeAngle = angle;
        safePlaySfx('boss');
        ctx.addDamageText(e.x, e.y, "CARGA INFERNAL!", true, '#e74c3c');

        bossTelegraphs.push({
          type: 'MIST_DASH_LANE',
          x: e.x,
          y: e.y,
          angle: e.chargeAngle,
          length: 240,
          width: 60,
          timer: 25,
          maxTimer: 25
        });
      } else {
        e.currentSkill = 'APOCALYPSE_SLAM';
        e.actionState = 'WINDUP';
        e.actionTimer = 29;
        e.actionMaxTimer = 29;
        safePlaySfx('boss');
        ctx.addDamageText(e.x, e.y, "COLAPSO DO CAOS!", true, '#c0392b');

        bossTelegraphs.push({
          x: e.x,
          y: e.y,
          radius: 120,
          timer: 29,
          maxTimer: 29,
          damage: Math.round(e.damage * 1.2),
          color: '#c0392b'
        });
      }
    }
  } else if (e.actionState === 'WINDUP') {
    e.actionTimer -= dt;
    e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
    createHitParticles(e.x, e.y, '#c0392b', 1);

    if (e.actionTimer <= 0) {
      e.actionState = 'STRIKE';
      e.chargeDuration = e.currentSkill === 'HELLFIRE_CHARGE' ? 18 : 4;
    }
  } else if (e.actionState === 'STRIKE') {
    if (e.currentSkill === 'CHAOS_SPIRAL') {
      safePlaySfx('shoot');
      const spinAng = (ctx.frameCount || 0) * 0.15;
      for (let s = 0; s < (e.enraged ? 6 : 4); s++) {
        const sOffset = spinAng + (s * Math.PI * 2) / (e.enraged ? 6 : 4);
        enemyBullets.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(sOffset) * 4.0,
          vy: Math.sin(sOffset) * 4.0,
          radius: 5,
          damage: Math.round(e.damage * 0.35),
          life: 85,
          bulletType: 'CHAOS',
          color: '#c0392b'
        });
      }
    } else if (e.currentSkill === 'HELLFIRE_CHARGE') {
      const speed = e.speed * 4.4;
      e.x += Math.cos(e.chargeAngle) * speed * dt;
      e.y += Math.sin(e.chargeAngle) * speed * dt;
      createHitParticles(e.x, e.y, '#e74c3c', 3);

      if (vecDist(e.x, e.y, player.x, player.y) < e.radius + player.radius && player.iFrames <= 0) {
        player.hp -= Math.round(e.damage * 0.9);
        player.iFrames = 26;
        ctx.triggerShake(11);
        safePlaySfx('hit');
        triggerHaptic('heavy');
        player.x += Math.cos(e.chargeAngle) * 40;
        player.y += Math.sin(e.chargeAngle) * 40;
        ctx.addDamageText(player.x, player.y, `-${Math.round(e.damage * 0.9)}`, true, '#c0392b');
      }
    } else if (e.currentSkill === 'APOCALYPSE_SLAM') {
      safePlaySfx('boss');
      ctx.triggerShake(12);
      createHitParticles(e.x, e.y, '#e74c3c', 26);

      bossShockwaves.push({
        x: e.x,
        y: e.y,
        radius: 14,
        maxRadius: 135,
        speed: 5.0,
        damage: Math.round(e.damage * 0.85),
        hitPlayer: false,
        colorRgb: '192, 57, 43'
      });
    }

    e.chargeDuration -= dt;
    if (e.chargeDuration <= 0) {
      e.actionState = 'RECOVERY';
      e.actionTimer = 20;
    }
  } else if (e.actionState === 'RECOVERY') {
    e.actionTimer -= dt;
    if (e.actionTimer <= 0) {
      e.actionState = 'CHASE';
      e.currentSkill = null;
      e.skillCooldown = e.enraged ? 27 : 46;
    }
  }
}
};
