/**
 * src/entities/enemies/minibosses/seismicSmasher.js
 * 
 * Controlador e FSM do Miniboss Demolidor Sísmico (SEISMIC_SMASHER).
 */
import { safePlaySfx } from './common.js';

export const seismicSmasherHandler = {
init(e) {
  e.skillCooldown = 65;
},
update(e, dt, ctx, dist, angle) {
  const { bossTelegraphs, bossShockwaves, createHitParticles } = ctx;

  if (e.actionState === 'CHASE') {
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;

    e.skillCooldown -= dt;
    if (e.skillCooldown <= 0) {
      e.currentSkill = 'GROUND_POUND';
      e.actionState = 'WINDUP';
      e.actionTimer = e.enraged ? 28 : 37;
      e.actionMaxTimer = e.actionTimer;
      safePlaySfx('charge');
      ctx.addDamageText(e.x, e.y, "CARGA SÍSMICA!", true, '#95a5a6');

      // Telégrafo circular de aviso no solo
      bossTelegraphs.push({
        x: e.x,
        y: e.y,
        radius: 95,
        timer: e.actionTimer,
        maxTimer: e.actionTimer,
        damage: e.damage,
        color: '#95a5a6'
      });
    }
  } else if (e.actionState === 'WINDUP') {
    e.actionTimer -= dt;
    e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);
    // Vibração dos martelos
    e.x += (Math.random() - 0.5) * 2;
    e.y += (Math.random() - 0.5) * 2;

    if (e.actionTimer <= 0) {
      e.actionState = 'STRIKE';
    }
  } else if (e.actionState === 'STRIKE') {
    safePlaySfx('boss');
    ctx.triggerShake(10);
    createHitParticles(e.x, e.y, '#95a5a6', 22);

    bossShockwaves.push({
      x: e.x,
      y: e.y,
      radius: 12,
      maxRadius: 110,
      speed: 4.2,
      damage: e.damage,
      hitPlayer: false,
      colorRgb: '149, 165, 166'
    });

    // Onda secundária caso enfurecido
    if (e.enraged) {
      setTimeout(() => {
        bossShockwaves.push({
          x: e.x,
          y: e.y,
          radius: 14,
          maxRadius: 150,
          speed: 5.5,
          damage: Math.round(e.damage * 0.6),
          hitPlayer: false,
          colorRgb: '189, 195, 199'
        });
      }, 180);
    }

    e.actionState = 'RECOVERY';
    e.actionTimer = 27;
  } else if (e.actionState === 'RECOVERY') {
    e.actionTimer -= dt;
    if (e.actionTimer <= 0) {
      e.actionState = 'CHASE';
      e.currentSkill = null;
      e.skillCooldown = e.enraged ? 42 : 69;
    }
  }
}
};
