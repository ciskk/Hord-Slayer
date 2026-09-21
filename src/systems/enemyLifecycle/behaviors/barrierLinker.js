/**
 * src/systems/enemyLifecycle/behaviors/barrierLinker.js
 * IA do Escriba das Runas — Elo de barreira rúnica (+220 escudo).
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';
import { getNeighborIndices } from '../../../core/spatialGrid.js';

export function barrierLinkerBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, enemies } = ctx;
  const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
  if (distToPlayerSq < 160 * 160) {
    e.x -= Math.cos(angle) * curSpeed * dt;
    e.y -= Math.sin(angle) * curSpeed * dt;
  } else if (distToPlayerSq > 230 * 230) {
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
  }
  if (!e.linkedShieldTarget || e.linkedShieldTarget.hp <= 0 || !enemies.includes(e.linkedShieldTarget)) {
    const neighbors = getNeighborIndices(e.x, e.y, 180);
    for (let k = 0; k < neighbors.length; k++) {
      const ally = enemies[neighbors[k]];
      if (ally && ally !== e && !ally.isBoss && (!ally.shieldHp || ally.shieldHp <= 0)) {
        e.linkedShieldTarget = ally;
        ally.shieldHp = 220;
        ally.maxShieldHp = 220;
        playSfx('shield');
        createHitParticles(ally.x, ally.y, '#0984e3', 6);
        addDamageText(ally.x, ally.y, "BARREIRA RÚNICA!", false, '#74b9ff');
        break;
      }
    }
  }
}
