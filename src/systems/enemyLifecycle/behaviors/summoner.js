/**
 * src/systems/enemyLifecycle/behaviors/summoner.js
 * IA do Cultista das Sombras — Orbe Entrópico + invocação de mortos.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';
import { canSpawnEnemyBullet } from '../../projectiles.js';
import { spawnMobCluster } from '../../../entities/enemies.js';

export function summonerBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, enemyBullets, gameState } = ctx;
  const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
  if (distToPlayerSq < 160 * 160) {
    e.x -= Math.cos(angle) * curSpeed * dt;
    e.y -= Math.sin(angle) * curSpeed * dt;
  } else {
    e.x += Math.cos(angle) * curSpeed * 0.5 * dt;
    e.y += Math.sin(angle) * curSpeed * 0.5 * dt;
  }

  e.aimAngle = angle;

  // Orbe Entrópico Noturno a cada ~3s quando em alcance
  e.shadowBoltTimer = (e.shadowBoltTimer || 0) + dt;
  if (e.shadowBoltTimer >= 131 && canSpawnEnemyBullet() && !gameState.isWavePaused) {
    e.shadowBoltTimer = 0;
    playSfx('shoot');
    // Disparo emerge do relicário no topo do báculo cerimonial
    enemyBullets.push({
      x: e.x + Math.cos(angle) * 16,
      y: e.y + Math.sin(angle) * 16 - 8,
      vx: Math.cos(angle) * 2.3,
      vy: Math.sin(angle) * 2.3,
      radius: 6.5,
      damage: 18,
      life: 160,
      bulletType: 'SHADOW_ORB',
      color: '#9b59b6'
    });
    createHitParticles(e.x + Math.cos(angle) * 18, e.y + Math.sin(angle) * 18 - 8, '#9b59b6', 6);
    addDamageText(e.x, e.y, "ORBE SOMBRIO!", false, '#a29bfe');
  }

  e.summonTimer = (e.summonTimer || 0) + dt;
  if (e.summonTimer > 177 && !gameState.isWavePaused) {
    e.summonTimer = 0;
    spawnMobCluster('ZOMBIE', 2);
    addDamageText(e.x, e.y, 'INVOCAR!', false, '#9b59b6');
  }
}
