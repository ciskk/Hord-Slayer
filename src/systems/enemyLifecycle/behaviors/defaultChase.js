/**
 * src/systems/enemyLifecycle/behaviors/defaultChase.js
 * IA de Perseguição Direta Padrão (Zumbis, Golens, Inimigos com Escudo, Parasitas).
 */
import { splitterMiniBehavior } from './splitterMini.js';

export function defaultChaseBehavior(e, dt, angle, curSpeed, ctx) {
  if (e.baseType === 'SPLITTER_MINI') {
    return splitterMiniBehavior(e, dt, angle, curSpeed, ctx);
  }
  e.x += Math.cos(angle) * curSpeed * dt;
  e.y += Math.sin(angle) * curSpeed * dt;
}
