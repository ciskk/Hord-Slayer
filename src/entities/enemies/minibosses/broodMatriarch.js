/**
 * src/entities/enemies/minibosses/broodMatriarch.js
 * 
 * Controlador e FSM do Miniboss Matriarca Parasita (BROOD_MATRIARCH).
 */
import { safePlaySfx } from './common.js';
import { spawnMobCluster } from '../spawner.js';

export const broodMatriarchHandler = {
init(e) {
  e.skillCooldown = 116; // Cadência reduzida em 50% (cooldown dobrado: 58 -> 116)
  e.isSpawningEggs = false;
},
update(e, dt, ctx, dist, angle) {
  const { acidPuddles, enemyBullets, bossTelegraphs, createHitParticles } = ctx;

  if (e.actionState === 'CHASE') {
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;

    e.skillCooldown -= dt;
    if (e.skillCooldown <= 0) {
      const rand = Math.random();
      if (rand < 0.5) {
        // Cuspe de Casulo Ácido
        e.currentSkill = 'ACID_SPIT';
        e.actionState = 'WINDUP';
        e.actionTimer = 22;
        e.actionMaxTimer = 22;
        e.aimAngle = angle;
        safePlaySfx('charge');
        ctx.addDamageText(e.x, e.y, "CUSPE ÁCIDO!", true, '#00cec9');

        bossTelegraphs.push({
          x: ctx.player.x,
          y: ctx.player.y,
          radius: 52,
          timer: 22,
          maxTimer: 22,
          damage: Math.round(e.damage * 0.75),
          color: '#00cec9'
        });
      } else {
        // Postura de Ovos / Espinhos
        e.currentSkill = 'BROOD_EGGS';
        e.actionState = 'WINDUP';
        e.actionTimer = 26;
        e.actionMaxTimer = 26;
        e.isSpawningEggs = true;
        safePlaySfx('boss');
        ctx.addDamageText(e.x, e.y, "INCUBAÇÃO!", true, '#2ecc71');
      }
    }
  } else if (e.actionState === 'WINDUP') {
    e.actionTimer -= dt;
    e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
    e.x += Math.cos(angle) * e.speed * 0.25 * dt;
    e.y += Math.sin(angle) * e.speed * 0.25 * dt;

    if (e.actionTimer <= 0) {
      e.actionState = 'STRIKE';
    }
  } else if (e.actionState === 'STRIKE') {
    if (e.currentSkill === 'ACID_SPIT') {
      safePlaySfx('shoot');
      createHitParticles(e.x, e.y, '#00cec9', 10);
      acidPuddles.push({
        x: ctx.player.x,
        y: ctx.player.y,
        radius: 35,
        life: 240,
        maxLife: 240,
        isFire: false
      });
    } else if (e.currentSkill === 'BROOD_EGGS') {
      e.isSpawningEggs = false;
      safePlaySfx('crit');
      createHitParticles(e.x, e.y, '#2ecc71', 14);

      for (let s = 0; s < 8; s++) {
        const sAng = (s * Math.PI * 2) / 8;
        enemyBullets.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(sAng) * 3.8,
          vy: Math.sin(sAng) * 3.8,
          radius: 4.5,
          damage: Math.round(e.damage * 0.35),
          life: 75,
          bulletType: 'CHITIN_SPIKE',
          color: '#00cec9'
        });
      }
      spawnMobCluster('SPLITTER_MINI', 2);
    }

    e.actionState = 'RECOVERY';
    e.actionTimer = 20;
  } else if (e.actionState === 'RECOVERY') {
    e.actionTimer -= dt;
    if (e.actionTimer <= 0) {
      e.actionState = 'CHASE';
      e.currentSkill = null;
      e.skillCooldown = e.enraged ? 70 : 116; // Cadência reduzida em 50% (cooldown dobrado)
    }
  }
}
};
