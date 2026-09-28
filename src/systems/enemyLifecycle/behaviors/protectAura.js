import { t as matchText } from '../../../i18n/index.js';
/**
 * src/systems/enemyLifecycle/behaviors/protectAura.js
 * IA do Guardião Rúnico — Aura protetora com cura em área.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';
import { getNeighborIndices } from '../../../core/spatialGrid.js';

export function protectAuraBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, enemies, bossShockwaves, triggerShake } = ctx;
  const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
  if (distToPlayerSq < 150 * 150) {
    e.x -= Math.cos(angle) * curSpeed * dt;
    e.y -= Math.sin(angle) * curSpeed * dt;
  } else if (distToPlayerSq > 230 * 230) {
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
  }
  e.auraTimer = (e.auraTimer || 0) + dt;
  if (e.auraTimer >= 120) {
    e.auraTimer = 0;
    playSfx('freeze');
    triggerShake(4);
    createHitParticles(e.x, e.y, '#0984e3', 14);
    addDamageText(e.x, e.y, matchText('match.combat.aura'), false, '#74b9ff');
    bossShockwaves.push({
      x: e.x,
      y: e.y,
      radius: 12,
      maxRadius: 160,
      speed: 4.5,
      damage: 0,
      hitPlayer: false
    });
    const neighbors = getNeighborIndices(e.x, e.y, 160);
    for (let k = 0; k < neighbors.length; k++) {
      const ally = enemies[neighbors[k]];
      if (ally && ally !== e) {
        ally.hp = Math.min(ally.maxHp, ally.hp + Math.round(ally.maxHp * 0.15));
        ally.hitFlash = 3;
        createHitParticles(ally.x, ally.y, '#00d2d3', 3);
      }
    }
  }
}
