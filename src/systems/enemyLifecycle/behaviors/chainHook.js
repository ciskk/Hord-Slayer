/**
 * src/systems/enemyLifecycle/behaviors/chainHook.js
 * IA do Flagelador de Correntes — Projétil de arpão/corrente.
 */
import { playSfx } from '../../../core/audio.js';
import { addDamageText } from '../../combat.js';

export function chainHookBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, enemyBullets, triggerShake } = ctx;
  const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
  e.hookTimer = (e.hookTimer || 0) - dt;
  if (distToPlayerSq <= 140 * 140 && e.hookTimer <= 0) {
    e.hookTimer = 123;
    playSfx('hit');
    triggerShake(3);
    enemyBullets.push({
      x: e.x,
      y: e.y,
      vx: Math.cos(angle) * 6.2,
      vy: Math.sin(angle) * 6.2,
      radius: 7,
      damage: Math.round(e.damage * 0.7),
      life: 24,
      bulletType: 'CHAIN_HOOK',
      isHook: true,
      parentX: e.x,
      parentY: e.y,
      color: '#b33939'
    });
    addDamageText(e.x, e.y, "CORRENTE!", false, '#e74c3c');
  } else {
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
  }
}
