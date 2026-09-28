import { t as matchText } from '../../../i18n/index.js';
/**
 * src/systems/enemyLifecycle/behaviors/vortexCarrier.js
 * IA do Precursor do Vazio — Vórtice do vazio com puxão gravitacional.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';

export function vortexCarrierBehavior(e, dt, angle, curSpeed, ctx) {
  const { voidVortices } = ctx;
  e.x += Math.cos(angle) * curSpeed * 0.8 * dt;
  e.y += Math.sin(angle) * curSpeed * 0.8 * dt;
  // O controle gravitacional vem do vórtice lançado, não da proximidade do mob.
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
    addDamageText(e.x, e.y, matchText('match.combat.vortex'), true, '#8e44ad');
  }
}
