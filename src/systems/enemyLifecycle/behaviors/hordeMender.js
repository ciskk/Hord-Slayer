/**
 * src/systems/enemyLifecycle/behaviors/hordeMender.js
 * IA do Boticário da Peste — Ungüento da peste curando aliados.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';
import { getNeighborIndices } from '../../../core/spatialGrid.js';

export function hordeMenderBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, enemies } = ctx;
  const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
  if (distToPlayerSq < 150 * 150) {
    e.x -= Math.cos(angle) * curSpeed * dt;
    e.y -= Math.sin(angle) * curSpeed * dt;
  } else if (distToPlayerSq > 230 * 230) {
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
  }
  e.apothecaryTimer = (e.apothecaryTimer || 0) + dt;
  if (e.apothecaryTimer >= 115) {
    e.apothecaryTimer = 0;
    playSfx('freeze');
    createHitParticles(e.x, e.y, '#2ecc71', 8);
    const neighbors = getNeighborIndices(e.x, e.y, 160);
    let healedAny = false;
    let healParticleBudget = 4;
    for (let k = 0; k < neighbors.length; k++) {
      const ally = enemies[neighbors[k]];
      if (ally && ally.hp < ally.maxHp) {
        ally.hp = Math.min(ally.maxHp, ally.hp + 120);
        ally.hitFlash = 3;
        if (healParticleBudget > 0) {
          createHitParticles(ally.x, ally.y, '#2ecc71', 2);
          healParticleBudget--;
        }
        healedAny = true;
      }
    }
    if (healedAny) {
      addDamageText(e.x, e.y, "UNGUENTO DA PESTE!", false, '#27ae60');
    }
  }
}
