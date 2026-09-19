/**
 * src/render/bestRunPreview.js
 * 
 * Motor de Renderização 2D dedicado para a Carta de Tarô Arcano da Melhor Run.
 * Exibe o herói consagrado sobre um pedestal elíptico de pedra rúnica com anéis
 * pontilhados rotativos, iluminação volumétrica mística (dourada ou rubi) e partículas
 * etéreas ascendentes, chamando proceduralmente renderHeroModel a 60 FPS.
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

// Partículas atmosféricas do pedestal
const tarotMotes = [];
for (let i = 0; i < 20; i++) {
  tarotMotes.push({
    x: (Math.random() - 0.5) * 110,
    y: (Math.random() - 0.5) * 60,
    speedY: 0.25 + Math.random() * 0.55,
    size: 1 + Math.random() * 2.2,
    alpha: Math.random()
  });
}

/**
 * Desenha um frame do Tarô Arcano no canvas
 */
function drawTarotFrame() {
  if (!isRunning || !previewCanvas || !pCtx) return;

  previewFrameCount++;
  const w = previewCanvas.width;
  const h = previewCanvas.height;
  pCtx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 + 30;

  // 1. Iluminação Volumétrica / Glow de Fundo (Aura Mística)
  const radGrad = pCtx.createRadialGradient(cx, cy - 25, 10, cx, cy - 25, 90);
  if (currentIsVictory) {
    radGrad.addColorStop(0, 'rgba(241, 196, 15, 0.24)');
    radGrad.addColorStop(0.45, 'rgba(0, 206, 201, 0.08)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else {
    radGrad.addColorStop(0, 'rgba(231, 76, 60, 0.22)');
    radGrad.addColorStop(0.55, 'rgba(139, 0, 0, 0.08)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  }
  pCtx.fillStyle = radGrad;
  pCtx.fillRect(0, 0, w, h);

  // 2. Pedestal Rúnico em Perspectiva 2.5D
  pCtx.save();
  pCtx.translate(cx, cy);

  // Base do pedestal
  pCtx.fillStyle = '#0f1118';
  pCtx.beginPath();
  pCtx.ellipse(0, 10, 58, 19, 0, 0, Math.PI * 2);
  pCtx.fill();

  pCtx.strokeStyle = currentIsVictory ? 'rgba(241, 196, 15, 0.65)' : 'rgba(231, 76, 60, 0.55)';
  pCtx.lineWidth = 1.8;
  pCtx.stroke();

  // Anel rúnico pontilhado rotativo
  pCtx.save();
  pCtx.rotate(previewFrameCount * 0.015);
  pCtx.strokeStyle = currentIsVictory ? 'rgba(255, 209, 102, 0.4)' : 'rgba(255, 118, 117, 0.35)';
  pCtx.setLineDash([4, 6]);
  pCtx.beginPath();
  pCtx.ellipse(0, 0, 46, 15, 0, 0, Math.PI * 2);
  pCtx.stroke();
  pCtx.restore();

  pCtx.restore();

  // 3. Partículas Etéreas Flutuantes (Motes de Glória)
  tarotMotes.forEach(p => {
    p.y -= p.speedY;
    if (p.y < -75) {
      p.y = 15;
      p.x = (Math.random() - 0.5) * 110;
    }
    pCtx.fillStyle = currentIsVictory ? '#ffd166' : '#ff7675';
    const fade = Math.sin((p.y + 75) / 90 * Math.PI);
    pCtx.globalAlpha = Math.max(0, Math.min(1, fade * 0.75));
    pCtx.beginPath();
    pCtx.arc(cx + p.x, cy + p.y - 25, p.size, 0, Math.PI * 2);
    pCtx.fill();
  });
  pCtx.globalAlpha = 1.0;

  // 4. Renderização do Herói Procedural (renderHeroModel)
  pCtx.save();
  const idleBob = Math.sin(previewFrameCount * 0.05) * 2.2;
  pCtx.translate(cx, cy - 32 + idleBob);

  // Sombra nos pés do personagem
  pCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  pCtx.beginPath();
  pCtx.ellipse(0, 16, 13, 5, 0, 0, Math.PI * 2);
  pCtx.fill();

  // Chama o renderizador nativo do herói com escala e armas
  renderHeroModel(pCtx, currentHeroKey, {
    scale: 2.2,
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
  previewCanvas = null;
  pCtx = null;
}
