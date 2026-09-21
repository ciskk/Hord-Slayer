/**
 * src/systems/enemyLifecycle/behaviors/vortexCarrier.js
 * IA do Precursor do Vazio — Puxão gravitacional + vórtice do vazio.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';

export function vortexCarrierBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, voidVortices } = ctx;
  e.x += Math.cos(angle) * curSpeed * 0.8 * dt;
  e.y += Math.sin(angle) * curSpeed * 0.8 * dt;
  const vdx = e.x - player.x;
  const vdy = e.y - player.y;
  const vDist = Math.hypot(vdx, vdy);
  if (vDist < 280 && vDist > 20) {
    player.x += (vdx / vDist) * 0.75 * dt;
    player.y += (vdy / vDist) * 0.75 * dt;
  }
  e.vortexTimer = (e.vortexTimer || 0) + dt;
  if (e.vortexTimer >= 200) {
    e.vortexTimer = 0;
    playSfx('boss');
    voidVortices.push({
      x: e.x,
      y: e.y,
      radius: 65,
      life: 300,
      damage: Math.round(e.damage * 0.4)
    });
    createHitParticles(e.x, e.y, '#8e44ad', 14);
    addDamageText(e.x, e.y, "VÓRTICE DO VAZIO!", true, '#8e44ad');
  }
}
