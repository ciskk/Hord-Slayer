/**
 * src/entities/enemies/minibosses/rustColossus.js
 * 
 * Controlador e FSM do Miniboss Colosso Ferruginoso (RUST_COLOSSUS).
 */
import { safePlaySfx } from './common.js';
import { triggerHaptic } from '../../../core/audio.js';
import { vecDist } from '../../../core/math.js';

export const rustColossusHandler = {
init(e) {
  e.skillCooldown = 62;
},
update(e, dt, ctx, dist, angle) {
  const { player, bossTelegraphs, bossShockwaves, enemyBullets, createHitParticles } = ctx;

  if (e.actionState === 'CHASE') {
    e.aimAngle = angle;
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;

    e.skillCooldown -= dt;
    if (e.skillCooldown <= 0) {
      if (dist > 160) {
        e.currentSkill = 'BOULDER_TOSS';
        e.actionState = 'WINDUP';
        e.actionTimer = 28;
        e.actionMaxTimer = 28;
        e.aimAngle = angle;
        e.tossTargetX = player.x;
        e.tossTargetY = player.y;
        safePlaySfx('charge');
        ctx.addDamageText(e.x, e.y, "CATAPULTA!", true, '#d35400');

        bossTelegraphs.push({
          type: 'FALLING_ROCK',
          x: player.x,
          y: player.y,
          radius: 60,
          timer: 28 + 24,
          maxTimer: 28 + 24,
          damage: Math.round(e.damage * 1.3),
          color: '#d35400'
        });
      } else {
        e.currentSkill = 'TRAIN_CHARGE';
        e.actionState = 'WINDUP';
        e.actionTimer = 26;
        e.actionMaxTimer = 26;
        e.chargeAngle = angle;
        safePlaySfx('boss');
        ctx.addDamageText(e.x, e.y, "CARGA FÉRREA!", true, '#e67e22');

        bossTelegraphs.push({
          type: 'MIST_DASH_LANE',
          x: e.x,
          y: e.y,
          angle: e.chargeAngle,
          length: 220,
          width: 55,
          timer: 26,
          maxTimer: 26
        });
      }
    }
  } else if (e.actionState === 'WINDUP') {
    e.actionTimer -= dt;
    e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
    e.x += (Math.random() - 0.5) * 1.8;
    if (e.actionTimer <= 0) {
      e.actionState = 'STRIKE';
      e.chargeDuration = e.currentSkill === 'TRAIN_CHARGE' ? 16 : 4;
    }
  } else if (e.actionState === 'STRIKE') {
    if (e.currentSkill === 'TRAIN_CHARGE') {
      const speed = e.speed * 4.0;
      e.x += Math.cos(e.chargeAngle) * speed * dt;
      e.y += Math.sin(e.chargeAngle) * speed * dt;
      createHitParticles(e.x, e.y, '#d35400', 3);

      if (vecDist(e.x, e.y, player.x, player.y) < e.radius + player.radius && player.iFrames <= 0) {
        player.hp -= Math.round(e.damage * 0.9);
        player.iFrames = 25;
        ctx.triggerShake(10);
        safePlaySfx('hit');
        triggerHaptic('heavy');
        player.x += Math.cos(e.chargeAngle) * 35;
        player.y += Math.sin(e.chargeAngle) * 35;
        ctx.addDamageText(player.x, player.y, `-${Math.round(e.damage * 0.9)}`, true, '#d35400');
      }
    } else if (e.currentSkill === 'BOULDER_TOSS') {
      safePlaySfx('shoot');
      createHitParticles(e.x, e.y, '#d35400', 12);
      const flightDuration = 24;
      const tx = e.tossTargetX !== undefined ? e.tossTargetX : player.x;
      const ty = e.tossTargetY !== undefined ? e.tossTargetY : player.y;
      const tDist = Math.hypot(tx - e.x, ty - e.y);
      const tSpeed = Math.max(3.8, tDist / flightDuration);
      const tAng = Math.atan2(ty - e.y, tx - e.x);
      e.aimAngle = tAng;

      enemyBullets.push({
        x: e.x,
        y: e.y - 22,
        targetX: tx,
        targetY: ty,
        vx: Math.cos(tAng) * tSpeed,
        vy: Math.sin(tAng) * tSpeed,
        radius: 12,
        damage: Math.round(e.damage * 1.3),
        life: flightDuration,
        maxLife: flightDuration,
        bulletType: 'BOULDER',
        isBoulder: true,
        color: '#d35400',
        isBossProjectile: true,
        isMiniBoss: true,
        sourceName: 'Colosso Ferruginoso'
      });
    }

    e.chargeDuration -= dt;
    if (e.chargeDuration <= 0) {
      e.actionState = 'RECOVERY';
      e.actionTimer = 23;
    }
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
