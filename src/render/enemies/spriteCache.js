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

import { ctx, setMainCtx, frameCount, setFrameCount } from '../../state/gameState.js';
import { layoutMetrics } from '../../core/responsive.js';

const BASE_CELL_SIZE = 80;
const BASE_HALF_CELL = 40;
const ATLAS_COLS = 8;
const ATLAS_ROWS = 8;
const MAX_SLOTS = ATLAS_COLS * ATLAS_ROWS; // 64 slots por textura (Ring Buffer)

let atlasCanvas = null;
let atlasCtx = null;
let currentCacheDpr = 1;
let cellPixelSize = BASE_CELL_SIZE;
let halfPixelSize = BASE_HALF_CELL;
let nextSlotIndex = 0;
const spriteSlots = new Map();
const slotKeys = new Array(MAX_SLOTS);

function ensureAtlas() {
  const targetDpr = Math.min(2.5, Math.max(1, (layoutMetrics && layoutMetrics.dpr) ? layoutMetrics.dpr : 1));

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
  nextSlotIndex = 0;
}

/**
 * Limpa todo o cache e reinicia as alocações da textura atlas.
 * Chamado automaticamente ao redimensionar a tela ou alternar a qualidade gráfica.
 */
export function clearSpriteCache() {
  spriteSlots.clear();
  slotKeys.fill(null);
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
    e.isBoss ||
    e.isMiniBoss ||
    e.isBossSubTarget ||
    e.isElite ||
    (e.combatState && e.combatState !== 'CHASE') ||
    (e.emergeTimer && e.emergeTimer > 0) ||
    (e.leapState && e.leapState !== 'none') ||
    (e.jumpZ && e.jumpZ > 0) ||
    (e.landingSplashTimer && e.landingSplashTimer > 0) ||
    e.isCharging
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
  const isSlow = e.slowTimer > 0;
  const stateKey = isHit ? 'h' : (isSlow ? 's' : 'n');
  const animStep = Math.abs(Math.floor(frameCount * 0.18)) % 6;
  const variant = e.variant || 0;
  const key = `${e.baseType}_v${variant}_f${animStep}_${stateKey}`;

  let slot = spriteSlots.get(key);

  if (!slot) {
    // Alocação contínua via Ring Buffer (substitui o slot mais antigo sem travar o GC)
    const slotIdx = nextSlotIndex % MAX_SLOTS;
    const oldKey = slotKeys[slotIdx];
    if (oldKey) {
      spriteSlots.delete(oldKey);
    }
    slotKeys[slotIdx] = key;
    nextSlotIndex++;

    const col = slotIdx % ATLAS_COLS;
    const row = Math.floor(slotIdx / ATLAS_COLS);
    const slotX = col * cellPixelSize;
    const slotY = row * cellPixelSize;

    slot = {
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
        hitFlash: isHit ? 4 : 0,
        slowTimer: isSlow ? 100 : 0,
        combatState: 'CHASE'
      };

      atlasCtx.save();
      // Posiciona no centro da célula em pixels físicos do atlas e aplica a escala nativa
      atlasCtx.translate(slotX + halfPixelSize, slotY + halfPixelSize);
      atlasCtx.scale(currentCacheDpr, currentCacheDpr);
      renderer.draw(mockEntity);
      atlasCtx.restore();
    } catch (_) {
      // Em caso de qualquer anomalia de pre-render, desfaz slot e faz fallback
      spriteSlots.delete(key);
      slotKeys[slotIdx] = null;
      return false;
    } finally {
      setMainCtx(savedCtx);
      setFrameCount(savedFc);
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
