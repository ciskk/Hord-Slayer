/**
 * src/systems/enemyLifecycle/behaviors/gravityRitual.js
 * IA do Ritual Gravitacional (High Occultist) — Puxão + dano ritual letal.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';
import { triggerDeath } from '../../ui.js';

export function gravityRitualBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, triggerShake, setLastAttackerName } = ctx;
  e.x += Math.cos(angle) * curSpeed * 0.75 * dt;
  e.y += Math.sin(angle) * curSpeed * 0.75 * dt;
  const gdx = e.x - player.x;
  const gdy = e.y - player.y;
  const gdist = Math.sqrt(gdx * gdx + gdy * gdy);
  if (gdist < 280 && gdist > 20) {
    player.x += (gdx / gdist) * 0.85 * dt;
    player.y += (gdy / gdist) * 0.85 * dt;
  }
  e.ritualTimer = (e.ritualTimer || 0) + dt;
  if (e.ritualTimer >= 170) {
    e.ritualTimer = 0;
    triggerShake(7);
    playSfx('boss');
    createHitParticles(e.x, e.y, '#341f97', 12);
    if (gdist < 110 && player.iFrames <= 0) {
      player.hp -= e.damage;
      player.iFrames = 25;
      if (setLastAttackerName) setLastAttackerName("Ritual Gravitacional");
      triggerShake(8);
      playSfx('hit');
      addDamageText(player.x, player.y, `-${Math.round(e.damage)}`, false, '#341f97');

      if (player.hp <= 0) {
        player.hp = 0;
        triggerDeath();
        return { playerDied: true };
      }
    }
  }
}
