import { t as matchText } from '../../../i18n/index.js';
/**
 * src/systems/enemyLifecycle/behaviors/xpDevourer.js
 * IA do Duende Ladrão de Gemas — Busca e consumo de gemas de éter.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';

export function xpDevourerBehavior(e, dt, angle, curSpeed, ctx) {
  const { frameCount, gems } = ctx;
  e.gemSearchTimer = (e.gemSearchTimer || 0) - dt;
  let targetGem = e.targetGem;

  // Verifica se a gema alvo ainda existe no mundo
  if (targetGem && (targetGem.collected || !gems.includes(targetGem))) {
    targetGem = null;
    e.targetGem = null;
  }

  // Busca periódica de nova gema a cada 12 quadros (ou se não tem alvo)
  if (!targetGem && e.gemSearchTimer <= 0) {
    e.gemSearchTimer = 12;
    let nearestDistSq = 250 * 250;
    for (let g = 0; g < gems.length; g++) {
      const gem = gems[g];
      const gdx = gem.x - e.x;
      const gdy = gem.y - e.y;
      const gdSq = gdx * gdx + gdy * gdy;
      if (gdSq < nearestDistSq) {
        nearestDistSq = gdSq;
        targetGem = gem;
      }
    }
    e.targetGem = targetGem;
  }

  if (targetGem) {
    const gdx = targetGem.x - e.x;
    const gdy = targetGem.y - e.y;
    const gdSq = gdx * gdx + gdy * gdy;
    const gAngle = Math.atan2(gdy, gdx);
    e.x += Math.cos(gAngle) * curSpeed * 1.25 * dt;
    e.y += Math.sin(gAngle) * curSpeed * 1.25 * dt;
    if (gdSq < (e.radius + targetGem.radius + 6) ** 2) {
      const gIdx = gems.indexOf(targetGem);
      if (gIdx !== -1) {
        gems.splice(gIdx, 1);
        e.targetGem = null;
        e.eatenGemsCount = (e.eatenGemsCount || 0) + 1;
        e.maxHp += 22;
        e.hp += 22;
        e.radius = Math.min(24, e.radius + 0.8);
        createHitParticles(e.x, e.y, '#00d2d3', 4);
        playSfx('hit');
        addDamageText(e.x, e.y, matchText('match.combat.ether'), false, '#00d2d3');
      }
    }
  } else {
    e.x -= Math.cos(angle + Math.sin(frameCount * 0.15) * 0.4) * curSpeed * 0.7 * dt;
    e.y -= Math.sin(angle + Math.sin(frameCount * 0.15) * 0.4) * curSpeed * 0.7 * dt;
  }
}
