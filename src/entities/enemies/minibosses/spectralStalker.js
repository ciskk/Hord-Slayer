import { t as matchText } from '../../../i18n/index.js';
/**
 * src/entities/enemies/minibosses/spectralStalker.js
 * 
 * Controlador e FSM do Miniboss Predador Espectral (SPECTRAL_STALKER).
 */
import { safePlaySfx } from './common.js';

export const spectralStalkerHandler = {
init(e) {
  e.skillCooldown = 58;
  e.isStealthed = false;
},
update(e, dt, ctx, dist, angle) {
  const { player, bossTelegraphs, createHitParticles } = ctx;

  if (e.actionState === 'CHASE') {
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;

    e.skillCooldown -= dt;
    if (e.skillCooldown <= 0) {
      e.currentSkill = 'SHADOW_STEP';
      e.actionState = 'WINDUP';
      e.actionTimer = 29;
      e.actionMaxTimer = 29;
      e.isStealthed = true;
      safePlaySfx('warp');
      ctx.addDamageText(e.x, e.y, matchText('match.combat.camouflage'), true, '#6c5ce7');

      const pFacingAng = player.facing === 1 ? 0 : Math.PI;
      e.flankTargetX = player.x - Math.cos(pFacingAng) * 75;
      e.flankTargetY = player.y - Math.sin(pFacingAng) * 75;
    }
  } else if (e.actionState === 'WINDUP') {
    e.actionTimer -= dt;
    e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);

    const toFlankAng = Math.atan2(e.flankTargetY - e.y, e.flankTargetX - e.x);
    e.x += Math.cos(toFlankAng) * e.speed * 2.2 * dt;
    e.y += Math.sin(toFlankAng) * e.speed * 2.2 * dt;

    if (e.actionTimer <= 0) {
      e.actionState = 'STRIKE';
      e.isStealthed = false;
      safePlaySfx('crit');

      const strikeAng = Math.atan2(player.y - e.y, player.x - e.x);
      bossTelegraphs.push({
        type: 'SCYTHE_CLEAVE',
        x: e.x,
        y: e.y,
        radius: 85,
        angle: strikeAng,
        arcHalf: Math.PI * 0.35,
        timer: 14,
        maxTimer: 14,
        damage: Math.round(e.damage * 1.35),
        color: '#6c5ce7',
        colorRgb: '108, 92, 231'
      });
    }
  } else if (e.actionState === 'STRIKE') {
    createHitParticles(e.x, e.y, '#6c5ce7', 12);
    e.actionState = 'RECOVERY';
    e.actionTimer = 22;
  } else if (e.actionState === 'RECOVERY') {
    e.actionTimer -= dt;
    e.x += Math.cos(angle) * e.speed * 0.35 * dt;
    e.y += Math.sin(angle) * e.speed * 0.35 * dt;
    if (e.actionTimer <= 0) {
      e.actionState = 'CHASE';
      e.currentSkill = null;
      e.skillCooldown = e.enraged ? 35 : 58;
    }
  }
}
};
