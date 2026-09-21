/**
 * src/render/minibosses/index.js
 * 
 * Despachante unificado de renderização dos 16 Minibosses de Hord.io.
 */
import { ctx } from '../../main.js';
import { drawThreatGlyph, drawDyingThreatGlyph } from './threatGlyph.js';
import * as zombieAlpha from './zombieAlphaRenderer.js';
import * as phalanxLeader from './phalanxLeaderRenderer.js';
import * as seismicSmasher from './seismicSmasherRenderer.js';
import * as rustColossus from './rustColossusRenderer.js';
import * as bloodGargoyle from './bloodGargoyleRenderer.js';
import * as spectralStalker from './spectralStalkerRenderer.js';
import * as quantumSlicer from './quantumSlicerRenderer.js';
import * as artilleryMech from './artilleryMechRenderer.js';
import * as fireIncinerator from './fireIncineratorRenderer.js';
import * as siegeCaptain from './siegeCaptainRenderer.js';
import * as broodMatriarch from './broodMatriarchRenderer.js';
import * as mobileHive from './mobileHiveRenderer.js';
import * as highOccultist from './highOccultistRenderer.js';
import * as runicWarden from './runicWardenRenderer.js';
import * as voidPrecursor from './voidPrecursorRenderer.js';
import * as chaosHerald from './chaosHeraldRenderer.js';

const MINIBOSS_RENDERERS = {
  ZOMBIE_ALPHA: zombieAlpha,
  PHALANX_LEADER: phalanxLeader,
  SEISMIC_SMASHER: seismicSmasher,
  RUST_COLOSSUS: rustColossus,
  BLOOD_GARGOYLE: bloodGargoyle,
  SPECTRAL_STALKER: spectralStalker,
  QUANTUM_SLICER: quantumSlicer,
  ARTILLERY_MECH: artilleryMech,
  FIRE_INCINERATOR: fireIncinerator,
  SIEGE_CAPTAIN: siegeCaptain,
  BROOD_MATRIARCH: broodMatriarch,
  MOBILE_HIVE: mobileHive,
  HIGH_OCCULTIST: highOccultist,
  RUNIC_WARDEN: runicWarden,
  VOID_PRECURSOR: voidPrecursor,
  CHAOS_HERALD: chaosHerald
};

/**
 * Renderizador Procedural Modular dos 16 Minibosses por Arquétipo.
 * O contexto Canvas já está centrado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do Miniboss
 */
export function drawMiniBossShape(e) {
  const R = e.radius;
  const isHit = e.hitFlash > 0;
  const isEnraged = !!e.enraged;
  const eliteColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : (e.color || '#f39c12'));

  drawThreatGlyph(R, eliteColor, isHit, isEnraged);

  const renderer = MINIBOSS_RENDERERS[e.baseType];
  if (renderer && renderer.draw) {
    renderer.draw(e);
  } else {
    ctx.fillStyle = eliteColor;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
}

/**
 * Renderizador de Animações de Morte Complexas para todos os 16 Mini-Bosses.
 * Coreografia em 3 Fases: Impacto & Recoil (t < 0.35) -> Colapso Estrutural (0.35 <= t < 0.75) -> Dissipação (t >= 0.75).
 * @param {Object} de Entidade agonizante em dyingEnemies
 */
export function drawDyingMiniBossShape(de) {
  const t = Math.max(0, Math.min(1, 1 - (de.timer / de.maxTimer)));
  const R = de.radius;
  const isEnraged = !!de.enraged;
  const eliteColor = isEnraged ? '#ff4757' : (de.color || '#f39c12');

  ctx.save();
  ctx.translate(de.x, de.y);
  ctx.scale(de.facing || 1, 1);

  if (de.rot) ctx.rotate(de.rot);

  const bodyAlpha = Math.max(0, 1 - Math.max(0, (t - 0.75) / 0.25));
  ctx.globalAlpha = bodyAlpha;

  drawDyingThreatGlyph(R, eliteColor, t);

  const renderer = MINIBOSS_RENDERERS[de.baseType];
  if (renderer && renderer.drawDying) {
    renderer.drawDying(de, t);
  } else {
    ctx.scale(1, Math.max(0.05, 1 - t));
    ctx.fillStyle = eliteColor;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export { drawThreatGlyph, drawDyingThreatGlyph };
