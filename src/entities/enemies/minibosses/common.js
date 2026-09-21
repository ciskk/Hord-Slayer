/**
 * src/entities/enemies/minibosses/common.js
 * 
 * Utilitários compartilhados para controladores de Minibosses.
 */
import { playSfx, triggerHaptic } from '../../../core/audio.js';

export function safePlaySfx(name) {
  try { playSfx(name); } catch (e) {}
}

export function checkEnrage(e, context) {
  if (!e.enraged && e.hp <= e.maxHp * 0.5) {
    e.enraged = true;
    e.hitFlash = 6;
    safePlaySfx('boss');
    if (context.triggerShake) context.triggerShake(7);
    if (context.addDamageText) context.addDamageText(e.x, e.y - 24, "FÚRIA!", true, '#e74c3c');
    if (context.createHitParticles) context.createHitParticles(e.x, e.y, '#e74c3c', 16);
  }
}
