/**
 * src/render/minibossesRenderer.js
 * 
 * Fachada de retrocompatibilidade para a renderização procedural dos 16 Minibosses.
 * A renderização foi modularizada em arquivos atômicos por arquétipo dentro de src/render/minibosses/.
 */
export {
  drawMiniBossShape,
  drawDyingMiniBossShape,
  drawThreatGlyph,
  drawDyingThreatGlyph
} from './minibosses/index.js';
