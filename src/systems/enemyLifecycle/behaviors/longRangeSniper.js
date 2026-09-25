/**
 * src/systems/enemyLifecycle/behaviors/longRangeSniper.js
 * IA do Atirador de Éter — Flecha de precisão de longo alcance.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';
import { canSpawnEnemyBullet } from '../../projectiles.js';

export function longRangeSniperBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, enemyBullets } = ctx;
  const isPlayerVisible = !(player.invisTimer > 0);
  const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
  if (distToPlayerSq < 220 * 220) {
    e.x -= Math.cos(angle) * curSpeed * dt;
    e.y -= Math.sin(angle) * curSpeed * dt;
  } else if (distToPlayerSq > 300 * 300) {
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
  }
  e.sniperAimAngle = angle;
  e.sniperTimer = (e.sniperTimer || 0) + dt;
  e.sniperCharge = Math.min(1, e.sniperTimer / 108);

  if (isPlayerVisible && e.sniperTimer >= 108) {
    e.sniperTimer = 0;
    e.sniperCharge = 0;
    if (canSpawnEnemyBullet()) {
      playSfx('shoot');
      enemyBullets.push({
        x: e.x + Math.cos(e.sniperAimAngle) * 22,
        y: e.y + Math.sin(e.sniperAimAngle) * 22,
        vx: Math.cos(e.sniperAimAngle) * 7.2,
        vy: Math.sin(e.sniperAimAngle) * 7.2,
        radius: 5,
        damage: e.damage,
        life: 110,
        bulletType: 'SNIPER_ARROW',
        color: '#9c88ff',
        sourceName: e.name || 'Arqueiro de Éter',
        enemyType: e.baseType || 'SNIPER_CULTIST'
      });
      createHitParticles(e.x, e.y, '#9c88ff', 6);
      addDamageText(e.x, e.y, "TIRO PRECISO!", false, '#9c88ff');
    }
  }
}
