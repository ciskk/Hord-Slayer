/**
 * src/systems/enemyLifecycle/behaviors/mortarBarrage.js
 * IA do Capitão de Cerco — Bombardeio de morteiro em área.
 */
import { playSfx } from '../../../core/audio.js';

export function mortarBarrageBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, bossTelegraphs } = ctx;
  const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
  if (distToPlayerSq < 170 * 170) {
    e.x -= Math.cos(angle) * curSpeed * dt;
    e.y -= Math.sin(angle) * curSpeed * dt;
  } else if (distToPlayerSq > 260 * 260) {
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
  }
  e.mortarTimer = (e.mortarTimer || 0) + dt;
  if (e.mortarTimer >= 140) {
    e.mortarTimer = 0;
    playSfx('shoot');
    bossTelegraphs.push({
      x: player.x,
      y: player.y,
      radius: 65,
      timer: 72,
      maxTimer: 72,
      damage: e.damage
    });
  }
}
