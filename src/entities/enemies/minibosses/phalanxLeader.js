/**
 * src/entities/enemies/minibosses/phalanxLeader.js
 * 
 * Controlador e FSM do Miniboss Centurião da Guarda (PHALANX_LEADER).
 */
import { safePlaySfx } from './common.js';
import { triggerHaptic } from '../../../core/audio.js';
import { vecDist } from '../../../core/math.js';
import { spawnMobCluster } from '../spawner.js';

export const phalanxLeaderHandler = {
init(e) {
  e.skillCooldown = 58;
  e.hasFrontalShield = true;
  e.hasSpawnedGuards = false;
},
update(e, dt, ctx, dist, angle) {
  const { player, bossTelegraphs, createHitParticles } = ctx;

  // Invocação de Guardas aos <50% HP
  if (e.enraged && !e.hasSpawnedGuards && e.actionState === 'CHASE') {
    e.hasSpawnedGuards = true;
    safePlaySfx('boss');
    ctx.addDamageText(e.x, e.y, "FORMAÇÃO!", true, '#f1c40f');
    spawnMobCluster('SHIELDED', 2);
  }

  if (e.actionState === 'CHASE') {
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;

    e.skillCooldown -= dt;
    if (e.skillCooldown <= 0) {
      if (dist > 110 && dist < 280) {
        // Investida com Escudo (Shield Bash Rush)
        e.currentSkill = 'SHIELD_CHARGE';
        e.actionState = 'WINDUP';
        e.actionTimer = 26;
        e.actionMaxTimer = 26;
        e.chargeAngle = angle;
        safePlaySfx('charge');

        bossTelegraphs.push({
          type: 'MIST_DASH_LANE',
          x: e.x,
          y: e.y,
          angle: e.chargeAngle,
          length: 190,
          width: 50,
          timer: 26,
          maxTimer: 26
        });
      } else {
        // Estocada Perfurante de Lança (Spear Thrust)
        e.currentSkill = 'SPEAR_THRUST';
        e.actionState = 'WINDUP';
        e.actionTimer = 20;
        e.actionMaxTimer = 20;
        e.thrustAngle = angle;
        safePlaySfx('charge');

        bossTelegraphs.push({
          type: 'SCYTHE_CLEAVE',
          x: e.x,
          y: e.y,
          radius: 95,
          angle: e.thrustAngle,
          arcHalf: Math.PI * 0.18,
          timer: 20,
          maxTimer: 20,
          damage: Math.round(e.damage * 1.2),
          color: '#f1c40f',
          colorRgb: '241, 196, 15'
        });
      }
    }
  } else if (e.actionState === 'WINDUP') {
    e.actionTimer -= dt;
    e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
    e.x += Math.cos(angle) * e.speed * 0.2 * dt;
    e.y += Math.sin(angle) * e.speed * 0.2 * dt;
    if (e.actionTimer <= 0) {
      e.actionState = 'STRIKE';
      e.strikeDuration = (e.currentSkill === 'SHIELD_CHARGE') ? 14 : 4;
    }
  } else if (e.actionState === 'STRIKE') {
    if (e.currentSkill === 'SHIELD_CHARGE') {
      // Deslocamento fulminante da investida
      const chargeSpeed = e.speed * 4.2;
      e.x += Math.cos(e.chargeAngle) * chargeSpeed * dt;
      e.y += Math.sin(e.chargeAngle) * chargeSpeed * dt;
      createHitParticles(e.x, e.y, '#f1c40f', 2);

      // Checagem de impacto contra o jogador
      const pDist = vecDist(e.x, e.y, player.x, player.y);
      if (pDist < e.radius + player.radius && player.iFrames <= 0) {
        player.hp -= Math.round(e.damage * 0.85);
        player.iFrames = 24;
        ctx.triggerShake(9);
        safePlaySfx('hit');
        triggerHaptic('heavy');
        // Knockback massivo
        player.x += Math.cos(e.chargeAngle) * 35;
        player.y += Math.sin(e.chargeAngle) * 35;
        ctx.addDamageText(player.x, player.y, `-${Math.round(e.damage * 0.85)}`, true, '#f1c40f');
      }
    }

    e.strikeDuration -= dt;
    if (e.strikeDuration <= 0) {
      e.actionState = 'RECOVERY';
      e.actionTimer = 22;
    }
  } else if (e.actionState === 'RECOVERY') {
    e.actionTimer -= dt;
    e.x += Math.cos(angle) * e.speed * 0.3 * dt;
    e.y += Math.sin(angle) * e.speed * 0.3 * dt;
    if (e.actionTimer <= 0) {
      e.actionState = 'CHASE';
      e.currentSkill = null;
      e.skillCooldown = e.enraged ? 35 : 58;
    }
  }
}
};
