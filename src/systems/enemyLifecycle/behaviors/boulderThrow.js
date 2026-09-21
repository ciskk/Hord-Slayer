/** src/systems/enemyLifecycle/behaviors/boulderThrow.js — Rock throw with predictive aim */
import { playSfx } from '../../../core/audio.js';
import { inputX, inputY } from '../../../core/input.js';
import { createHitParticles, addDamageText } from '../../combat.js';

export function boulderThrowBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, bossTelegraphs, triggerShake } = ctx;

  e.throwTimer = (e.throwTimer || 0) + dt;
  if (e.throwTimer < 120) {
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
  } else if (e.throwTimer >= 150) {
    e.throwTimer = 0;
    playSfx('shoot');
    triggerShake(5);
    const leadX = player.x + (inputX || 0) * 40;
    const leadY = player.y + (inputY || 0) * 40;
    bossTelegraphs.push({
      x: leadX,
      y: leadY,
      radius: 55,
      timer: 40,
      maxTimer: 40,
      damage: Math.round(e.damage * 1.3)
    });
    createHitParticles(e.x, e.y, '#d35400', 8);
    addDamageText(e.x, e.y, "ARREMESSO DE ROCHA!", false, '#e67e22');
  }
}
