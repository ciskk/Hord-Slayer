/**
 * src/render/enemies/index.js
 * 
 * Despachante unificado de renderização dos monstros comuns de Hord.io.
 * Mapeia cada arquétipo de criatura para seu renderizador modular dedicado.
 */
import { ctx, frameCount } from '../../state/gameState.js';
import { drawBoss } from '../../entities/bosses/bossRegistry.js';
import { drawMiniBossShape, drawDyingMiniBossShape } from '../minibossesRenderer.js';
import { drawEnemyStatusOverlays, drawMiniBossHpOverlay, drawCommonEnemyGroundDecorations, applyKinematicDeformations, drawEnemyAttackTelegraph } from './enemyDecorators.js';
import { drawCachedEnemy, clearSpriteCache } from './spriteCache.js';
import { getEnemyDeathProgress } from '../../config/enemyDeaths.js';
import { drawDeathResidue } from './deathEffects.js';
import { orientCrawler } from '../../entities/enemies/crawlerLocomotion.js';
export { clearSpriteCache };
import * as zombie from './zombieRenderer.js';
import * as bat from './batRenderer.js';
import * as shielded from './shieldedRenderer.js';
import * as golem from './golemRenderer.js';
import * as exploder from './exploderRenderer.js';
import * as necro from './necroRenderer.js';
import * as shooter from './shooterRenderer.js';
import * as stalker from './stalkerRenderer.js';
import * as splitter from './splitterRenderer.js';
import * as trailCrawler from './trailCrawlerRenderer.js';
import * as cryptWeaver from './cryptWeaverRenderer.js';
import * as chainFlayer from './chainFlayerRenderer.js';
import * as basaltGargoyle from './basaltGargoyleRenderer.js';
import * as tollBellringer from './tollBellringerRenderer.js';
import * as plagueApothecary from './plagueApothecaryRenderer.js';
import * as runeScribe from './runeScribeRenderer.js';
import * as forgePyreguard from './forgePyreguardRenderer.js';
import * as maidenThorns from './maidenThornsRenderer.js';
import * as mirrorBanshee from './mirrorBansheeRenderer.js';
import * as dullahanVanguard from './dullahanVanguardRenderer.js';
import * as sniperCultist from './sniperCultistRenderer.js';
import * as voidScavenger from './voidScavengerRenderer.js';
import * as graveGorgon from './graveGorgonRenderer.js';
import * as cursedChest from './cursedChestRenderer.js';

export const ENEMY_RENDERERS = {
  ZOMBIE: zombie,
  BAT: bat,
  SHIELDED: shielded,
  GOLEM: golem,
  EXPLODER: exploder,
  NECRO: necro,
  SHOOTER: shooter,
  STALKER: stalker,
  SPLITTER: splitter,
  TRAIL_CRAWLER: trailCrawler,
  CRYPT_WEAVER: cryptWeaver,
  CHAIN_FLAYER: chainFlayer,
  BASALT_GARGOYLE: basaltGargoyle,
  TOLL_BELLRINGER: tollBellringer,
  PLAGUE_APOTHECARY: plagueApothecary,
  RUNE_SCRIBE: runeScribe,
  FORGE_PYREGUARD: forgePyreguard,
  MAIDEN_THORNS: maidenThorns,
  MIRROR_BANSHEE: mirrorBanshee,
  DULLAHAN_VANGUARD: dullahanVanguard,
  SNIPER_CULTIST: sniperCultist,
  VOID_SCAVENGER: voidScavenger,
  GRAVE_GORGON: graveGorgon,
  CURSED_CHEST: cursedChest,
  SPLITTER_MINI: splitter
};

/**
 * Renderiza a forma, animações e overlays de um inimigo no Canvas.
 * @param {Object} e Entidade do inimigo a ser desenhado.
 */
export function drawEnemyShape(e) {
  if (e.isBossSubTarget) return;

  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.scale(e.facing, 1);

  drawEnemyStatusOverlays(e);

  if (e.isMiniBoss) {
    drawMiniBossHpOverlay(e);
  }

  if (e.isBoss) {
    drawBoss(ctx, e, frameCount);
  } else {
    drawEnemyAttackTelegraph(e);

    if (e.isMiniBoss) {
      drawMiniBossShape(e);
    } else {
      drawCommonEnemyGroundDecorations(e);
      if (e.baseType === 'STALKER' && e.dashState === 'aim') {
        stalker.drawBurrowWarning(e);
        ctx.restore();
        return; // O corpo só emerge quando os 500 ms de aviso terminam.
      }
      applyKinematicDeformations(e);

      const isHit = e.hitFlash > 0;
      const baseCol = isHit ? '#ffffff' : e.color;

      const renderer = ENEMY_RENDERERS[e.baseType];
      if (renderer && renderer.draw) {
        if (!drawCachedEnemy(ctx, e, renderer)) {
          renderer.draw(e);
        }
      } else {
        ctx.fillStyle = baseCol;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

/**
 * Renderiza as animações de morte procedurais e dramáticas em 3 fases:
 * Fase 1: Impacto & Recoil (t < 0.35)
 * Fase 2: Colapso Estrutural & Despedaçamento (0.35 <= t < 0.75)
 * Fase 3: Dissipação, Resíduo & Cinzas (t >= 0.75)
 * 
 * Despacha mini-bosses diretamente para drawDyingMiniBossShape.
 * @param {Object} de Entidade agonizante em dyingEnemies
 */
export function drawDyingEnemyShape(de) {
  if (de.isMiniBoss) {
    drawDyingMiniBossShape(de);
    return;
  }

  const t = getEnemyDeathProgress(de);
  const R = de.radius;

  ctx.save();
  ctx.translate(de.x, de.y);
  drawDeathResidue(ctx, de, t);
  ctx.translate(0, -(de.deathJumpZ || 0) * Math.max(0, 1 - t / 0.35));
  ctx.scale(de.facing, 1);
  if (de.rot) ctx.rotate(de.rot);
  orientCrawler(ctx, de);

  const bodyAlpha = Math.max(0, 1 - Math.max(0, (t - 0.75) / 0.25));
  ctx.globalAlpha *= bodyAlpha;

  const renderer = ENEMY_RENDERERS[de.baseType];
  if (renderer && renderer.drawDying) {
    renderer.drawDying(de, t, R);
  } else {
    ctx.scale(1, Math.max(0.05, 1 - t));
    ctx.fillStyle = de.color || '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
