/**
 * src/render/enemiesRenderer.js
 * 
 * Fachada de retrocompatibilidade para renderização de monstros comuns e elites.
 * A lógica foi modularizada em arquivos atômicos por criatura dentro de src/render/enemies/.
 */
export {
  drawEnemyShape,
  drawDyingEnemyShape,
  ENEMY_RENDERERS,
  clearSpriteCache
} from './enemies/index.js';
