/**
 * src/render/bestRunPreview.js
 * 
 * Motor de Renderização 2D dedicado para a Carta de Tarô Arcano da Melhor Run.
 * Exibe o herói consagrado sobre um pedestal elíptico de pedra rúnica com anéis
 * pontilhados rotativos, iluminação volumétrica mística (dourada ou rubi) e partículas
 * etéreas ascendentes, chamando proceduralmente renderHeroModel a 60 FPS.
 * 
 * Suporta alta resolução (DPR dinâmico) e ResizeObserver para evitar deformações
 * em telas verticais (mobile) ou monitores ultra-wide (PC).
 */
import { renderHeroModel } from './playerRenderer.js';
import { CHARACTERS } from '../config/characters.js';

let previewCanvas = null;
let pCtx = null;
let animFrameId = null;
let isRunning = false;
let previewFrameCount = 0;
let currentHeroKey = 'KNIGHT';
let currentIsVictory = true;
let resizeObserver = null;

// Partículas atmosféricas do pedestal
const tarotMotes = [];
for (let i = 0; i < 24; i++) {
  tarotMotes.push({
    x: (Math.random() - 0.5) * 120,
    y: (Math.random() - 0.5) * 80,
    speedY: 0.25 + Math.random() * 0.55,
    size: 1 + Math.random() * 2.2,
    alpha: Math.random()
  });
}

/**
 * Redimensiona dinamicamente o buffer interno do canvas para corresponder
 * aos pixels físicos (devicePixelRatio) da tela, evitando qualquer achatamento ou distorção.
 */
export function resizeBestRunCanvas() {
  if (!previewCanvas || !pCtx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = previewCanvas.getBoundingClientRect();
  const cssW = previewCanvas.clientWidth || rect.width || 220;
  const cssH = previewCanvas.clientHeight || rect.height || 180;

  if (cssW > 0 && cssH > 0) {
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (previewCanvas.width !== targetW || previewCanvas.height !== targetH) {
      previewCanvas.width = targetW;
      previewCanvas.height = targetH;
    }
  }

  pCtx.setTransform(1, 0, 0, 1, 0, 0);
  pCtx.scale(dpr, dpr);
}

/**
 * Desenha um frame do Tarô Arcano no canvas
 */
function drawTarotFrame() {
  if (!isRunning || !previewCanvas || !pCtx) return;

  previewFrameCount++;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = previewCanvas.clientWidth || (previewCanvas.width / dpr) || 220;
  const cssH = previewCanvas.clientHeight || (previewCanvas.height / dpr) || 180;

  pCtx.clearRect(0, 0, cssW, cssH);

  // Ponto central de ancoragem do pedestal e herói (proporção áurea vertical)
  const cx = cssW / 2;
  const cy = Math.min(cssH * 0.74, cssH - 36);

  // 1. Iluminação Volumétrica / Glow de Fundo (Aura Mística Esférica)
  const auraRadius = Math.max(cssW, cssH) * 0.6;
  const radGrad = pCtx.createRadialGradient(cx, cy - 35, 8, cx, cy - 35, auraRadius);
  if (currentIsVictory) {
    radGrad.addColorStop(0, 'rgba(241, 196, 15, 0.28)');
    radGrad.addColorStop(0.4, 'rgba(0, 245, 212, 0.10)');
    radGrad.addColorStop(0.8, 'rgba(10, 8, 20, 0.05)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else {
    radGrad.addColorStop(0, 'rgba(231, 76, 60, 0.28)');
    radGrad.addColorStop(0.45, 'rgba(139, 0, 0, 0.12)');
    radGrad.addColorStop(0.8, 'rgba(10, 5, 12, 0.05)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  }
  pCtx.fillStyle = radGrad;
  pCtx.fillRect(0, 0, cssW, cssH);

  // 2. Pedestal Rúnico em Perspectiva 2.5D com Proporção Geométrica Natural
  const pedestalRx = Math.min(cssW * 0.35, cssH * 0.30);
  const pedestalRy = pedestalRx * 0.34;

  pCtx.save();
  pCtx.translate(cx, cy);

  // Base do pedestal de pedra ancestral
  pCtx.fillStyle = '#0f1118';
  pCtx.beginPath();
  pCtx.ellipse(0, 9, pedestalRx, pedestalRy, 0, 0, Math.PI * 2);
  pCtx.fill();

  pCtx.strokeStyle = currentIsVictory ? 'rgba(241, 196, 15, 0.75)' : 'rgba(231, 76, 60, 0.65)';
  pCtx.lineWidth = 1.8;
  pCtx.stroke();

  // Anel rúnico pontilhado rotativo
  pCtx.save();
  pCtx.rotate(previewFrameCount * 0.015);
  pCtx.strokeStyle = currentIsVictory ? 'rgba(255, 209, 102, 0.5)' : 'rgba(255, 118, 117, 0.45)';
  pCtx.lineWidth = 1.4;
  pCtx.setLineDash([4, 6]);
  pCtx.beginPath();
  pCtx.ellipse(0, 0, pedestalRx * 0.82, pedestalRy * 0.82, 0, 0, Math.PI * 2);
  pCtx.stroke();
  pCtx.restore();

  pCtx.restore();

  // 3. Partículas Etéreas Flutuantes (Motes de Glória)
  tarotMotes.forEach(p => {
    p.y -= p.speedY;
    if (p.y < -95) {
      p.y = 15;
      p.x = (Math.random() - 0.5) * (pedestalRx * 2.2);
    }
    pCtx.fillStyle = currentIsVictory ? '#ffd166' : '#ff7675';
    const fade = Math.sin((p.y + 95) / 110 * Math.PI);
    pCtx.globalAlpha = Math.max(0, Math.min(1, fade * 0.85));
    pCtx.beginPath();
    pCtx.arc(cx + p.x, cy + p.y - 25, p.size, 0, Math.PI * 2);
    pCtx.fill();
  });
  pCtx.globalAlpha = 1.0;

  // 4. Renderização do Herói Procedural (renderHeroModel)
  pCtx.save();
  const idleBob = Math.sin(previewFrameCount * 0.05) * 2.2;
  pCtx.translate(cx, cy - 30 + idleBob);

  // Sombra nos pés do personagem
  pCtx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  pCtx.beginPath();
  pCtx.ellipse(0, 15, Math.max(14, pedestalRx * 0.32), Math.max(5, pedestalRy * 0.42), 0, 0, Math.PI * 2);
  pCtx.fill();

  // Escala calibrada dinamicamente: compacta em mobile (114px) e imponente em PC (300px+)
  const heroScale = Math.min(Math.max(cssH / 74, 1.45), 3.8);

  renderHeroModel(pCtx, currentHeroKey, {
    scale: heroScale,
    facing: 1,
    frameCount: previewFrameCount,
    isMoving: false,
    evolvedHammer: currentIsVictory,
    evolvedPotion: currentIsVictory,
    auraLvl: currentIsVictory ? 1 : 0
  });

  pCtx.restore();

  if (isRunning) {
    animFrameId = requestAnimationFrame(drawTarotFrame);
  }
}

/**
 * Inicia a prévia do herói no canvas da Carta de Tarô da Melhor Run
 * @param {HTMLCanvasElement} canvasElement
 * @param {string} heroKey
 * @param {boolean} isVictory
 */
export function startBestRunTarot(canvasElement, heroKey = 'KNIGHT', isVictory = true) {
  stopBestRunTarot();

  if (!canvasElement) return;

  previewCanvas = canvasElement;
  pCtx = previewCanvas.getContext('2d');
  currentHeroKey = heroKey;
  currentIsVictory = !!isVictory;
  isRunning = true;
  previewFrameCount = 0;

  // Redimensiona o canvas imediatamente com base nas dimensões atuais da tela
  resizeBestRunCanvas();

  // Observa mudanças de dimensão no elemento para recalcular instantaneamente sem distorções
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      if (isRunning && previewCanvas) {
        resizeBestRunCanvas();
      }
    });
    resizeObserver.observe(previewCanvas);
  }

  drawTarotFrame();
}

/**
 * Interrompe a animação da Carta de Tarô e zera o consumo de CPU/GPU
 */
export function stopBestRunTarot() {
  isRunning = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  previewCanvas = null;
  pCtx = null;
}
