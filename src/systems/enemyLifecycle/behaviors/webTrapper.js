import { t as matchText } from '../../../i18n/index.js';
/**
 * src/systems/enemyLifecycle/behaviors/webTrapper.js
 * IA da Tecelã das Catacumbas — Armadilha de teias desacelerantes.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';
import { canSpawnEnemyBullet } from '../../projectiles.js';

export function webTrapperBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, enemyBullets } = ctx;
  const isPlayerVisible = !(player.invisTimer > 0);
  const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
  if (distToPlayerSq > 160 * 160) {
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
  } else if (distToPlayerSq < 90 * 90) {
    e.x -= Math.cos(angle) * curSpeed * 0.7 * dt;
    e.y -= Math.sin(angle) * curSpeed * 0.7 * dt;
  }
  e.aimAngle = angle;
  e.webTimer = (e.webTimer || 0) + dt;
  if (isPlayerVisible && e.webTimer >= 115) {
    e.webTimer = 0;
    playSfx('shoot');
    createHitParticles(e.x, e.y, '#dfe4ea', 6);
    addDamageText(e.x, e.y, matchText('match.combat.cocoon'), false, '#dfe4ea');

    if (canSpawnEnemyBullet()) {
      const speed = 5.2;
      const dist = Math.hypot(player.x - e.x, player.y - e.y);
      const travelLife = Math.max(14, Math.round(dist / speed));
      enemyBullets.push({
        x: e.x + Math.cos(angle) * 14,
        y: e.y + Math.sin(angle) * 14,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 7,
        damage: 12,
        life: travelLife,
        bulletType: 'WEB_COCOON',
        isWebCocoon: true,
        color: '#dfe4ea'
      });
    }
  }
}
