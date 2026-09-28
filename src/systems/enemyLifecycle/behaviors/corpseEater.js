import { t as matchText } from '../../../i18n/index.js';
/**
 * src/systems/enemyLifecycle/behaviors/corpseEater.js
 * IA do Carniçal Necrófago — Necrofagia consumindo cadáveres abatidos.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText, dyingEnemies } from '../../combat.js';

export function corpseEaterBehavior(e, dt, angle, curSpeed, ctx) {
  const frame = ctx?.frameCount || 0;
  const phase = e.phaseOffset || 0;
  const sway = Math.sin(frame * 0.05 + phase) * 0.12;
  e.x += Math.cos(angle + sway) * curSpeed * dt;
  e.y += Math.sin(angle + sway) * curSpeed * dt;
  e.devourTimer = (e.devourTimer || 0) + dt;
  if (e.devourTimer >= 30) {
    e.devourTimer = 0;
    for (let d = dyingEnemies.length - 1; d >= 0; d--) {
      const dead = dyingEnemies[d];
      if (dead.consumed || dead.corpseTimer <= 0) continue;
      const ddx = dead.x - e.x;
      const ddy = dead.y - e.y;
      if (ddx * ddx + ddy * ddy < 75 * 75) {
        e.gorgonStacks = Math.min(5, (e.gorgonStacks || 0) + 1);
        e.hp = Math.min(e.maxHp, e.hp + Math.round(e.maxHp * 0.15));
        e.damage = Math.round(e.damage * 1.08);
        e.radius = Math.min(26, e.radius + 1.2);
        createHitParticles(e.x, e.y, '#c0392b', 8);
        playSfx('hit');
        addDamageText(e.x, e.y, matchText('match.combat.flesh'), false, '#e74c3c');
        // Consumido uma única vez; a finalização visual pode terminar normalmente.
        dead.consumed = true;
        break;
      }
    }
  }
}
