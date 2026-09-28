/**
 * src/render/enemies/spriteCache.js
 * 
 * Gerenciador de Cache de Sprites e Pre-rendering (Sprite Baking) para Monstros Comuns.
 * Substitui milhares de chamadas vetoriais procedurais por quadro por GPU blitting
 * direto via ctx.drawImage(), mantendo fidelidade visual idêntica e elevando drasticamente o FPS.
 * 
 * Adaptado dinamicamente ao devicePixelRatio (DPR) e Modos de Qualidade Gráfica:
 * - Em telas Retina / Smartphones de alta densidade (DPR >= 2.0), assa os sprites
 *   com alta densidade de pixels (até 2.5x), eliminando qualquer borrão ou pixelização.
 * - Gerenciado por Ring Buffer de 64 slots (8x8) para consumo ultrabaixo de memória RAM (~6-10MB).
 */

import { ctx, setMainCtx, frameCount, setFrameCount, baseCameraZoom } from '../../state/gameState.js';
import { layoutMetrics } from '../../core/responsive.js';
import { isCrawler, crawlPhase } from '../../entities/enemies/crawlerLocomotion.js';
import { perfMetrics } from '../../core/perfMetrics.js';

const BASE_CELL_SIZE = 96;
const BASE_HALF_CELL = 48;
const ATLAS_COLS = 16;
const ATLAS_ROWS = 16;
const MAX_SLOTS = ATLAS_COLS * ATLAS_ROWS; // 256 slots (comporta todas as animações e variantes)

let atlasCanvas = null;
let atlasCtx = null;
let currentCacheDpr = 1;
let cellPixelSize = BASE_CELL_SIZE;
let halfPixelSize = BASE_HALF_CELL;
let nextSlotIndex = 0;
const spriteSlots = new Map();
const slotKeys = new Array(MAX_SLOTS);
const slotLastUsed = new Float64Array(MAX_SLOTS);

// Only bodies whose pose is fully described by the atlas key can be baked.
// Aimed weapons, support casts and defensive forms must follow the live entity.
const CACHEABLE_TYPES = new Set([
  'ZOMBIE', 'BAT', 'GOLEM', 'STALKER',
  'SPLITTER', 'SPLITTER_MINI', 'TRAIL_CRAWLER', 'MAIDEN_THORNS'
]);

export function getCurrentCacheDpr() {
  return currentCacheDpr;
}

export function getAtlasDimensions() {
  return {
    cellPixelSize,
    cols: ATLAS_COLS,
    rows: ATLAS_ROWS,
    width: atlasCanvas ? atlasCanvas.width : 0,
    height: atlasCanvas ? atlasCanvas.height : 0
  };
}

function ensureAtlas() {
  // Compensa o zoom estável da câmera (baseCameraZoom) para que cada pixel do sprite
  // assado no atlas mapeie 1:1 com os pixels físicos da tela, eliminando qualquer borrão bilinear.
  const zoom = (typeof baseCameraZoom !== 'undefined' && baseCameraZoom) ? baseCameraZoom : 1.25;
  const dpr = (layoutMetrics && layoutMetrics.dpr) ? layoutMetrics.dpr : 1;
  const targetDpr = Math.min(2.5, Math.max(1, Math.round(dpr * zoom * 100) / 100));

  if (atlasCanvas && atlasCtx && currentCacheDpr === targetDpr) return;
  if (typeof document === 'undefined') return;

  currentCacheDpr = targetDpr;
  cellPixelSize = Math.round(BASE_CELL_SIZE * currentCacheDpr);
  halfPixelSize = cellPixelSize / 2;

  if (!atlasCanvas) {
    atlasCanvas = document.createElement('canvas');
  }
  atlasCanvas.width = cellPixelSize * ATLAS_COLS;
  atlasCanvas.height = cellPixelSize * ATLAS_ROWS;

  atlasCtx = atlasCanvas.getContext('2d', { alpha: true });
  if (atlasCtx) {
    atlasCtx.imageSmoothingEnabled = true;
    atlasCtx.imageSmoothingQuality = 'high';
  }

  // Reinicia slots ao reconfigurar resolução do atlas
  spriteSlots.clear();
  slotKeys.fill(null);
  slotLastUsed.fill(0);
  nextSlotIndex = 0;
}

/**
 * Limpa todo o cache e reinicia as alocações da textura atlas.
 * Chamado automaticamente ao redimensionar a tela ou alternar a qualidade gráfica.
 */
export function clearSpriteCache() {
  spriteSlots.clear();
  slotKeys.fill(null);
  slotLastUsed.fill(0);
  nextSlotIndex = 0;
  if (atlasCtx && atlasCanvas) {
    atlasCtx.clearRect(0, 0, atlasCanvas.width, atlasCanvas.height);
  }
}

/**
 * Determina se a criatura é elegível para renderização via Sprite Cache acelerado por GPU.
 * Criaturas em estados cinemáticos complexos (ataque strike, emergindo, saltando, chefes)
 * continuam sendo desenhadas vetorialmente para máxima fidelidade.
 */
function isEligibleForCache(e) {
  if (
    !e ||
    !CACHEABLE_TYPES.has(e.baseType) ||
    e.radius * 1.65 + 2 > BASE_HALF_CELL ||
    e.spikeFlash > 0 ||
    (e.dashState && e.dashState !== 'chase') ||
    e.fuseState === 'FUSE' ||
    e.isBoss ||
    e.isMiniBoss ||
    e.isBossSubTarget ||
    e.isElite ||
    (e.combatState && e.combatState !== 'CHASE') ||
    (e.emergeTimer && e.emergeTimer > 0) ||
    (e.leapState && e.leapState !== 'none') ||
    (e.jumpZ && e.jumpZ > 0) ||
    (e.landingSplashTimer && e.landingSplashTimer > 0) ||
    e.isCharging ||
    e.baseType === 'VOID_SCAVENGER' ||
    e.baseType === 'CURSED_CHEST'
  ) {
    return false;
  }
  return true;
}

/**
 * Tenta desenhar o monstro comum usando a textura assada (baked) do atlas.
 * @param {CanvasRenderingContext2D} targetCtx Contexto Canvas destino
 * @param {Object} e Entidade do inimigo
 * @param {Object} renderer Módulo renderizador do tipo de monstro
 * @returns {boolean} true se o sprite foi desenhado via cache, false para fallback vetorial
 */
export function drawCachedEnemy(targetCtx, e, renderer) {
  if (!isEligibleForCache(e) || !renderer || !renderer.draw) {
    return false;
  }

  ensureAtlas();
  if (!atlasCanvas || !atlasCtx) return false;

  const isHit = e.hitFlash > 0;
  const stateKey = isHit ? 'h' : 'n';
  const crawler = isCrawler(e);
  const phaseCount = crawler ? 12 : 6;
  const animStep = crawler
    ? Math.floor(((crawlPhase(e, frameCount) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * phaseCount)
    : Math.abs(Math.floor(frameCount * 0.18)) % 6;
  const variant = e.variant || 0;
  const key = `${e.baseType}_r${e.radius}_v${variant}_f${animStep}_${stateKey}`;

  let slot = spriteSlots.get(key);

  if (!slot) {
    perfMetrics.countSpriteBake();
    let slotIdx;
    if (nextSlotIndex < MAX_SLOTS) {
      slotIdx = nextSlotIndex++;
    } else {
      // Política LRU Real: substitui o slot que não é desenhado há mais tempo
      let oldestIdx = 0;
      let oldestTime = Infinity;
      for (let i = 0; i < MAX_SLOTS; i++) {
        if (slotLastUsed[i] < oldestTime) {
          oldestTime = slotLastUsed[i];
          oldestIdx = i;
        }
      }
      slotIdx = oldestIdx;
    }

    const oldKey = slotKeys[slotIdx];
    if (oldKey) {
      spriteSlots.delete(oldKey);
    }
    slotKeys[slotIdx] = key;
    slotLastUsed[slotIdx] = frameCount;

    const col = slotIdx % ATLAS_COLS;
    const row = Math.floor(slotIdx / ATLAS_COLS);
    const slotX = col * cellPixelSize;
    const slotY = row * cellPixelSize;

    slot = {
      slotIdx,
      sx: slotX,
      sy: slotY,
      pixelSize: cellPixelSize,
      baseSize: BASE_CELL_SIZE,
      halfBase: BASE_HALF_CELL
    };
    spriteSlots.set(key, slot);

    // Pre-renderização (Baking) em alta resolução na célula do atlas
    atlasCtx.clearRect(slotX, slotY, cellPixelSize, cellPixelSize);

    const savedCtx = ctx;
    const savedFc = frameCount;

    try {
      setMainCtx(atlasCtx);
      // Simula o frameCount equivalente ao passo discreto de animação
      setFrameCount(animStep * (Math.PI * 2 / 0.18 / 6));

      const mockEntity = {
        ...e,
        x: 0,
        y: 0,
        facing: 1,
        crawlPhase: crawler ? animStep * Math.PI * 2 / phaseCount : e.crawlPhase,
        hitFlash: isHit ? 4 : 0,
        slowTimer: 0,
        combatState: 'CHASE'
      };

      atlasCtx.save();
      atlasCtx.beginPath();
      atlasCtx.rect(slotX, slotY, cellPixelSize, cellPixelSize);
      atlasCtx.clip();
      // Posiciona no centro da célula em pixels físicos do atlas e aplica a escala nativa
      atlasCtx.translate(slotX + halfPixelSize, slotY + halfPixelSize);
      atlasCtx.scale(currentCacheDpr, currentCacheDpr);
      try {
        renderer.draw(mockEntity);
      } finally {
        atlasCtx.restore();
      }
    } catch (_) {
      // Em caso de qualquer anomalia de pre-render, desfaz slot e faz fallback
      spriteSlots.delete(key);
      slotKeys[slotIdx] = null;
      return false;
    } finally {
      setMainCtx(savedCtx);
      setFrameCount(savedFc);
    }
  } else {
    perfMetrics.countSpriteHit();
    if (slot.slotIdx !== undefined) {
      slotLastUsed[slot.slotIdx] = frameCount;
    }
  }

  // Desenho acelerado por GPU com 1 única chamada drawImage em resolução nativa nítida
  targetCtx.drawImage(
    atlasCanvas,
    slot.sx,
    slot.sy,
    slot.pixelSize,
    slot.pixelSize,
    -BASE_HALF_CELL,
    -BASE_HALF_CELL,
    BASE_CELL_SIZE,
    BASE_CELL_SIZE
  );

  return true;
}
