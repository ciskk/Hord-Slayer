/**
 * src/entities/enemies/minibosses/artilleryMech.js
 * 
 * Controlador e FSM do Miniboss Torre Móvel (ARTILLERY_MECH).
 */
import { safePlaySfx } from './common.js';

export const artilleryMechHandler = {
init(e) {
  e.skillCooldown = 54;
  e.isSiegeMode = false;
},
update(e, dt, ctx, dist, angle) {
  const { player, enemyBullets, bossTelegraphs, createHitParticles } = ctx;

  // Recuo a jato defensivo se o jogador colar
  if (!(ctx.player?.invisTimer > 0) && dist < 60 && (!e.thrusterCd || e.thrusterCd <= 0)) {
    e.thrusterCd = 140;
    e.x -= Math.cos(angle) * 75;
    e.y -= Math.sin(angle) * 75;
    safePlaySfx('warp');
    createHitParticles(e.x, e.y, '#00cec9', 10);
    ctx.addDamageText(e.x, e.y, "RECUO A JATO!", false, '#00cec9');
  }
  if (e.thrusterCd > 0) e.thrusterCd -= dt;

  if (e.actionState === 'CHASE') {
    e.aimAngle = angle;
    // Mantém distância tática de 160px a 240px
    if (dist < 160) {
      e.x -= Math.cos(angle) * e.speed * dt;
      e.y -= Math.sin(angle) * e.speed * dt;
    } else if (dist > 240) {
      e.x += Math.cos(angle) * e.speed * dt;
      e.y += Math.sin(angle) * e.speed * dt;
    }

    e.skillCooldown -= dt;
    if (e.skillCooldown <= 0) {
      if (Math.random() < 0.6) {
        // Modo Cerco (Sniper Lock-On Burst)
        e.currentSkill = 'SIEGE_BURST';
        e.actionState = 'WINDUP';
        e.actionTimer = 27;
        e.actionMaxTimer = 27;
        e.isSiegeMode = true;
        e.aimAngle = angle;
        safePlaySfx('charge');
        ctx.addDamageText(e.x, e.y, "TRAVANDO MIRA!", true, '#00cec9');
      } else {
        // Salva de Mísseis
        e.currentSkill = 'MISSILE_BARRAGE';
        e.actionState = 'WINDUP';
        e.actionTimer = 23;
        e.actionMaxTimer = 23;
        safePlaySfx('shoot');

        for (let m = 0; m < 3; m++) {
          const targetOffsetX = (Math.random() - 0.5) * 60;
          const targetOffsetY = (Math.random() - 0.5) * 60;
          bossTelegraphs.push({
            type: 'FALLING_ROCK',
            x: player.x + targetOffsetX,
            y: player.y + targetOffsetY,
            radius: 40,
            timer: 23 + m * 6,
            maxTimer: 23 + m * 6,
            damage: Math.round(e.damage * 0.8),
            color: '#2980b9'
          });
        }
      }
    }
  } else if (e.actionState === 'WINDUP') {
    e.actionTimer -= dt;
    e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
    if (e.currentSkill === 'SIEGE_BURST') {
      e.aimAngle = angle;
    }
    if (e.actionTimer <= 0) {
      e.actionState = 'STRIKE';
      e.burstShotsLeft = 5;
      e.shotDelay = 0;
    }
  } else if (e.actionState === 'STRIKE') {
    if (e.currentSkill === 'SIEGE_BURST') {
      e.shotDelay -= dt;
      if (e.shotDelay <= 0 && e.burstShotsLeft > 0) {
        e.shotDelay = 5;
        e.burstShotsLeft--;
        safePlaySfx('shoot');

        // Alternância entre os canos duplos superior e inferior
        const isUpperBarrel = (e.burstShotsLeft % 2 === 0);
        e.lastFiredBarrel = isUpperBarrel ? 'UPPER' : 'LOWER';
        const barrelSideOffset = isUpperBarrel ? -5 : 5;

        e.x -= Math.cos(e.aimAngle) * 3.2;
        e.y -= Math.sin(e.aimAngle) * 3.2;

        const spread = (Math.random() - 0.5) * 0.12;
        const bAng = e.aimAngle + spread;
        const muzzleX = e.x + Math.cos(bAng) * 28 - Math.sin(bAng) * barrelSideOffset;
        const muzzleY = e.y + Math.sin(bAng) * 28 + Math.cos(bAng) * barrelSideOffset;

        createHitParticles(muzzleX, muzzleY, '#ff4757', 5);
        createHitParticles(muzzleX, muzzleY, '#ffffff', 2);
        createHitParticles(e.x - Math.sin(bAng) * 10, e.y + Math.cos(bAng) * 10, '#d4af37', 2);

        enemyBullets.push({
          x: muzzleX,
          y: muzzleY,
          vx: Math.cos(bAng) * 4.5,
          vy: Math.sin(bAng) * 4.5,
          radius: 5.5,
          damage: Math.round(e.damage * 0.35),
          life: 85,
          bulletType: 'TECH',
          color: '#ff4757'
        });
      }
      if (e.burstShotsLeft <= 0) {
        e.actionState = 'RECOVERY';
        e.actionTimer = 20;
        e.isSiegeMode = false;
      }
    } else {
      e.actionState = 'RECOVERY';
      e.actionTimer = 15;
    }
  } else if (e.actionState === 'RECOVERY') {
    e.actionTimer -= dt;
    if (e.actionTimer <= 0) {
      e.actionState = 'CHASE';
      e.currentSkill = null;
      e.skillCooldown = e.enraged ? 31 : 50;
    }
  }
}
};
