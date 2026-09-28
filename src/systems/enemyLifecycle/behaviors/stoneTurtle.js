import { t as matchText } from '../../../i18n/index.js';
/**
 * src/systems/enemyLifecycle/behaviors/stoneTurtle.js
 * IA da Gárgula de Basalto — Petrificação defensiva ao sofrer dano.
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';

export function stoneTurtleBehavior(e, dt, angle, curSpeed, ctx) {
  const { triggerShake } = ctx;
  if (e.isStoneForm) {
    e.stoneFormTimer -= dt;
    if (e.stoneFormTimer <= 0) {
      e.isStoneForm = false;
      createHitParticles(e.x, e.y, '#747d8c', 6);
    }
  } else {
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
    if (e.hitFlash > 0 && e.hp < e.maxHp * 0.75 && Math.random() < 0.12) {
      e.isStoneForm = true;
      e.stoneFormTimer = 110;
      playSfx('hit');
      triggerShake(2);
      createHitParticles(e.x, e.y, '#95a5a6', 10);
      addDamageText(e.x, e.y, matchText('match.combat.petrify'), false, '#bdc3c7');
    }
  }
}
