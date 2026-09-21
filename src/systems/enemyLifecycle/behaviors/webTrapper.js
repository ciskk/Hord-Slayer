/**
 * src/systems/enemyLifecycle/behaviors/webTrapper.js
 * IA da Tecelã das Catacumbas — Armadilha de teias desacelerantes.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';

export function webTrapperBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, acidPuddles } = ctx;
  const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
  if (distToPlayerSq > 160 * 160) {
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
  } else if (distToPlayerSq < 90 * 90) {
    e.x -= Math.cos(angle) * curSpeed * 0.7 * dt;
    e.y -= Math.sin(angle) * curSpeed * 0.7 * dt;
  }
  e.webTimer = (e.webTimer || 0) + dt;
  if (e.webTimer >= 115) {
    e.webTimer = 0;
    playSfx('shoot');
    acidPuddles.push({
      x: player.x,
      y: player.y,
      radius: 36,
      life: 240,
      maxLife: 240,
      isCaustic: true,
      isWeb: true,
      isFire: false
    });
    createHitParticles(player.x, player.y, '#b2bec3', 8);
    addDamageText(e.x, e.y, "TEIA!", false, '#dfe4ea');
  }
}
