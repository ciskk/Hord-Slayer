/**
 * src/systems/enemyLifecycle/behaviors/trailToxic.js
 * IA do Rastejador Peçonhento — Rastro de poças cáusticas com coalescência.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles } from '../../combat.js';

export function trailToxicBehavior(e, dt, angle, curSpeed, ctx) {
  const { acidPuddles } = ctx;
  e.x += Math.cos(angle) * curSpeed * dt;
  e.y += Math.sin(angle) * curSpeed * dt;
  e.trailTimer = (e.trailTimer || 0) + dt;
  if (e.trailTimer >= 48) { // Cadência reduzida em 50% (intervalo dobrado: 24 -> 48)
    e.trailTimer = 0;
    let merged = false;
    // Coalescência com poça tóxica existente próxima
    for (let pIdx = acidPuddles.length - 1; pIdx >= 0; pIdx--) {
      const p = acidPuddles[pIdx];
      if (p.isCaustic && !p.isAlchemist && !p.isFire && !p.isWeb) {
        const pdx = p.x - e.x;
        const pdy = p.y - e.y;
        if (pdx * pdx + pdy * pdy < 16 * 16) {
          p.life = Math.min(p.maxLife || 180, (p.life || 0) + 60);
          p.radius = Math.min(24, (p.radius || 18) + 0.8);
          merged = true;
          break;
        }
      }
    }
    if (!merged && acidPuddles.length < 50) {
      acidPuddles.push({
        x: e.x,
        y: e.y,
        radius: 18,
        life: 180,
        maxLife: 180,
        isCaustic: true,
        isFire: false
      });
      if (Math.random() < 0.4) createHitParticles(e.x, e.y, '#16a085', 1);
    }
  }
}
