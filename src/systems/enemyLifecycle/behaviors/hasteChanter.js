import { t as matchText } from '../../../i18n/index.js';
/**
 * src/systems/enemyLifecycle/behaviors/hasteChanter.js
 * IA do Arauto do Sino Fúnebre — Toque do sino fúnebre acelerando aliados.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';
import { getNeighborIndices } from '../../../core/spatialGrid.js';

export function hasteChanterBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, enemies, bossShockwaves, triggerShake } = ctx;
  const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
  if (distToPlayerSq < 160 * 160) {
    e.x -= Math.cos(angle) * curSpeed * dt;
    e.y -= Math.sin(angle) * curSpeed * dt;
  } else if (distToPlayerSq > 240 * 240) {
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
  }
  e.bellTimer = (e.bellTimer || 0) + dt;
  if (e.bellTimer >= 108) {
    e.bellTimer = 0;
    playSfx('bell_toll'); // Volume reduzido em 50% (ganho 0.01 vs 0.02 anterior)
    triggerShake(3);
    createHitParticles(e.x, e.y, '#f1c40f', 12);
    bossShockwaves.push({
      x: e.x,
      y: e.y,
      radius: 10,
      maxRadius: 150,
      speed: 4.5,
      damage: 0,
      hitPlayer: false
    });
    const neighbors = getNeighborIndices(e.x, e.y, 150);
    let particleBudget = 4;
    for (let k = 0; k < neighbors.length; k++) {
      const ally = enemies[neighbors[k]];
      if (ally && ally !== e && !ally.isBoss) {
        ally.speed = (ally.baseSpeed || ally.speed) * 1.4;
        ally.hasteTimer = 110;
        if (particleBudget > 0) {
          createHitParticles(ally.x, ally.y, '#f1c40f', 2);
          particleBudget--;
        }
      }
    }
    addDamageText(e.x, e.y, matchText('match.combat.bell'), false, '#f39c12');
  }
}
