/**
 * src/render/environment/biomeProps/index.js
 * Despachante unificado O(1) de props procedurais de biomas da arena.
 */
import { tileHash } from '../../environment.js';
import { drawIvoryOssuaryProps } from './ivoryOssuary.js';
import { drawCrimsonSaltProps } from './crimsonSalt.js';
import { drawEclipseBasilicaProps } from './eclipseBasilica.js';
import { drawVampireProps } from './vampire.js';
import { drawMonolithProps } from './monolith.js';
import { drawReaperProps } from './reaper.js';
import { drawAbyssProps } from './abyss.js';
import { drawCemeteryProps } from './cemetery.js';

export const BIOME_PROP_RENDERERS = {
  IVORY_OSSUARY: drawIvoryOssuaryProps,
  CRIMSON_SALT: drawCrimsonSaltProps,
  ECLIPSE_BASILICA: drawEclipseBasilicaProps,
  VAMPIRE: drawVampireProps,
  MONOLITH: drawMonolithProps,
  REAPER: drawReaperProps,
  ABYSS: drawAbyssProps,
  CEMETERY: drawCemeteryProps,
  INDUSTRIAL: drawCemeteryProps
};

/**
 * Despacha a renderização dos props procedurais de acordo com o tema.
 */
export function renderArenaProps(ctx, theme, startCol, endCol, startRow, endRow, tileSize) {
  if (theme === 'ABYSS') return;
  const drawFn = BIOME_PROP_RENDERERS[theme];
  if (!drawFn) return;

  for (let c = startCol; c <= endCol; c++) {
    for (let r = startRow; r <= endRow; r++) {
      const tileX = c * tileSize;
      const tileY = r * tileSize;
      const h = tileHash(c, r);
      const h2 = tileHash(c + 71, r + 137);
      const h3 = tileHash(c - 93, r + 419);
      drawFn(ctx, c, r, tileX, tileY, h, h2, h3);
    }
  }
}
