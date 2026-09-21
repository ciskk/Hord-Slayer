/**
 * src/render/enemies/spriteCache.js
 * 
 * Gerenciador de Cache de Sprites e Pre-rendering (Sprite Baking) para Monstros Comuns.
 * Substitui milhares de chamadas vetoriais procedurais por quadro por GPU blitting
 * direto via ctx.drawImage(), mantendo fidelidade visual idêntica e elevando drasticamente o FPS.
 */

import { ctx, setMainCtx, frameCount, setFrameCount } from '../../state/gameState.js';

const CELL_SIZE = 80;
const HALF_CELL = 40;
const ATLAS_COLS = 16;
const ATLAS_ROWS = 16;
const ATLAS_WIDTH = CELL_SIZE * ATLAS_COLS;  // 1280px
const ATLAS_HEIGHT = CELL_SIZE * ATLAS_ROWS; // 1280px
const MAX_SLOTS = ATLAS_COLS * ATLAS_ROWS;   // 256 slots

let atlasCanvas = null;
let atlasCtx = null;
let nextSlotIndex = 0;
const spriteSlots = new Map();

function ensureAtlas() {
  if (atlasCanvas && atlasCtx) return;
  if (typeof document === 'undefined') return;

  atlasCanvas = document.createElement('canvas');
  atlasCanvas.width = ATLAS_WIDTH;
  atlasCanvas.height = ATLAS_HEIGHT;
  atlasCtx = atlasCanvas.getContext('2d', { alpha: true });
}

/**
 * Limpa todo o cache e reinicia as alocações da textura atlas.
 */
export function clearSpriteCache() {
  spriteSlots.clear();
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
    // Se o atlas atingiu a capacidade máxima de 256 variações, recicla
    if (nextSlotIndex >= MAX_SLOTS) {
      clearSpriteCache();
    }

    const col = nextSlotIndex % ATLAS_COLS;
    const row = Math.floor(nextSlotIndex / ATLAS_COLS);
    const slotX = col * CELL_SIZE;
    const slotY = row * CELL_SIZE;

    slot = {
      sx: slotX,
      sy: slotY,
      size: CELL_SIZE,
      half: HALF_CELL
    };
    spriteSlots.set(key, slot);
    nextSlotIndex++;

    // Pre-renderização (Baking) do frame na célula do atlas
    atlasCtx.clearRect(slotX, slotY, CELL_SIZE, CELL_SIZE);

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
      atlasCtx.translate(slotX + HALF_CELL, slotY + HALF_CELL);
      renderer.draw(mockEntity);
      atlasCtx.restore();
    } catch (_) {
      // Em caso de qualquer anomalia de pre-render, desfaz slot e faz fallback
      spriteSlots.delete(key);
      return false;
    } finally {
      setMainCtx(savedCtx);
      setFrameCount(savedFc);
    }
  }

  // Desenho ultrarrápido acelerado por GPU (1 única chamada drawImage por monstro)
  targetCtx.drawImage(
    atlasCanvas,
    slot.sx,
    slot.sy,
    slot.size,
    slot.size,
    -slot.half,
    -slot.half,
    slot.size,
    slot.size
  );

  return true;
}
