import { t as matchText } from '../../../i18n/index.js';
/**
 * src/entities/enemies/minibosses/runicWarden.js
 * 
 * Controlador e FSM do Miniboss Guardião Rúnico (RUNIC_WARDEN).
 */
import { safePlaySfx } from './common.js';
import { vecDist, vecDistSq } from '../../../core/math.js';

export const runicWardenHandler = {
init(e) {
  e.skillCooldown = 58;
},
update(e, dt, ctx, dist, angle) {
  const { player, bossShockwaves, bossTelegraphs, enemies, createHitParticles } = ctx;

  if (e.actionState === 'CHASE') {
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;

    e.skillCooldown -= dt;
    if (e.skillCooldown <= 0) {
      const rand = Math.random();
      if (rand < 0.55) {
        e.currentSkill = 'RUNIC_CAGE';
        e.actionState = 'WINDUP';
        e.actionTimer = 28;
        e.actionMaxTimer = 28;
        safePlaySfx('charge');
        ctx.addDamageText(e.x, e.y, matchText('match.combat.prison'), true, '#0984e3');

        bossTelegraphs.push({
          x: player.x,
          y: player.y,
          radius: 75,
          timer: 28,
          maxTimer: 28,
          damage: Math.round(e.damage * 0.8),
          color: '#0984e3'
        });
      } else {
        e.currentSkill = 'WARD_PULSE';
        e.actionState = 'WINDUP';
        e.actionTimer = 23;
        e.actionMaxTimer = 23;
        safePlaySfx('freeze');
      }
    }
  } else if (e.actionState === 'WINDUP') {
    e.actionTimer -= dt;
    e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
    if (e.actionTimer <= 0) {
      e.actionState = 'STRIKE';
    }
  } else if (e.actionState === 'STRIKE') {
    if (e.currentSkill === 'WARD_PULSE') {
      safePlaySfx('freeze');
      ctx.triggerShake(5);
      createHitParticles(e.x, e.y, '#0984e3', 16);

      bossShockwaves.push({
        x: e.x,
        y: e.y,
        radius: 12,
        maxRadius: 140,
        speed: 5.0,
        damage: 0,
        hitPlayer: false,
        colorRgb: '9, 132, 227'
      });

      for (let i = 0; i < enemies.length; i++) {
        const ally = enemies[i];
        if (ally && ally !== e && vecDistSq(e.x, e.y, ally.x, ally.y) < 140 * 140) {
          ally.hp = Math.min(ally.maxHp, ally.hp + Math.round(ally.maxHp * 0.15));
          ally.hitFlash = 3;
          createHitParticles(ally.x, ally.y, '#74b9ff', 3);
        }
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
