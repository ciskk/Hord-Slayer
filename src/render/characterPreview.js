/**
 * src/render/characterPreview.js
 * 
 * Motor de renderização em alta definição para o Palco de Evocação da Skin
 * ("Altar dos Condenados"). Exibe o campeão selecionado em escala ampliada (3.0x),
 * com fundo de arena gótica com depth-of-field (blur), pedestal de pedra,
 * círculos rúnicos rotativos, partículas atmosféricas elementais e sistema
 * dinâmico de ataque realista com armas empunhadas e efeitos de combate autênticos.
 */

import { renderHeroModel } from './playerRenderer.js';
import { generateGroundCracks, drawDetailedGroundCracks } from './groundCracks.js';
import { CHARACTERS } from '../config/characters.js';
import { playSfx, triggerHaptic } from '../core/audio.js';

let previewCanvas = null;
let previewCtx = null;
let animFrameId = null;
let isRunning = false;
let previewResizeObserver = null;
let windowListenersAttached = false;

// Estado da Prévia do Herói
let currentHeroKey = 'KNIGHT';
let currentFacing = 1;
let currentPose = 'idle'; // 'idle' | 'combat' | 'skill'
let previewTime = 0;
let shockwaves = [];
let particles = [];
let surgeTimer = 0;

// Sistema de Animação de Ataque Real com Armas
let attackTimer = 0;
const ATTACK_CYCLE_FRAMES = 74;
let previewKnightCrackData = null;

// Backdrop em Cache da Arena com Blur (Performance 60 FPS)
let arenaBgCanvas = null;
let arenaBgCtx = null;
let arenaBgW = 0;
let arenaBgH = 0;
let arenaBgHeroKey = null;

// Paleta Cromática Temática
const THEME_COLORS = {
  KNIGHT: { primary: '#f1c40f', secondary: '#f39c12', glow: 'rgba(241, 196, 15, 0.35)', accent: '#ffffff' },
  MAGE: { primary: '#ff7675', secondary: '#d35400', glow: 'rgba(231, 76, 60, 0.40)', accent: '#f1c40f' },
  ROGUE: { primary: '#a855f7', secondary: '#7c3aed', glow: 'rgba(168, 85, 247, 0.42)', accent: '#c084fc' },
  BARBARIAN: { primary: '#e74c3c', secondary: '#c0392b', glow: 'rgba(231, 76, 60, 0.45)', accent: '#f39c12' },
  ALCHEMIST: { primary: '#9b59b6', secondary: '#8e44ad', glow: 'rgba(155, 89, 182, 0.40)', accent: '#a29bfe' }
};

/**
 * Renderiza um halo volumétrico sutil e aura etérea ao redor do herói,
 * com transição 100% suave para o transparente, integrando-se perfeitamente
 * à Catedral e ao Void Rift de fundo sem bordas duras ou texturas borradas.
 */
function drawHeroAtmosphericGlow(c, width, height, centerX, centerY, colors) {
  c.save();

  // 1. Halo central do núcleo elemental do herói
  const heroGlow = c.createRadialGradient(centerX, centerY - 45, 20, centerX, centerY, Math.max(width, height) * 0.65);
  heroGlow.addColorStop(0, colors.glow);
  heroGlow.addColorStop(0.35, `${colors.primary}18`);
  heroGlow.addColorStop(0.7, 'rgba(6, 10, 20, 0.15)');
  heroGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  c.fillStyle = heroGlow;
  c.fillRect(0, 0, width, height);

  // 2. Coluna de luz mística suave vertical (feixe de ascensão sagrada / astral)
  const beamW = Math.min(380, width * 0.75);
  const beam = c.createLinearGradient(centerX - beamW / 2, 0, centerX + beamW / 2, 0);
  beam.addColorStop(0, 'rgba(0, 0, 0, 0)');
  beam.addColorStop(0.3, `${colors.primary}08`);
  beam.addColorStop(0.5, `${colors.primary}16`);
  beam.addColorStop(0.7, `${colors.primary}08`);
  beam.addColorStop(1, 'rgba(0, 0, 0, 0)');
  c.fillStyle = beam;
  c.fillRect(centerX - beamW / 2, 0, beamW, height);

  c.restore();
}

/**
 * Inicializa ou redimensiona o canvas da prévia respeitando a densidade de pixels (DPR).
 */
export function initPreviewCanvas(canvasElement) {
  if (!canvasElement) return false;
  previewCanvas = canvasElement;
  previewCtx = previewCanvas.getContext('2d', { alpha: true });

  if (typeof ResizeObserver !== 'undefined') {
    if (previewResizeObserver) {
      previewResizeObserver.disconnect();
    }
    previewResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect && (entry.contentRect.width > 0 || entry.contentRect.height > 0)) {
          resizePreviewCanvas();
        }
      }
    });
    previewResizeObserver.observe(previewCanvas);
  }

  if (!windowListenersAttached && typeof window !== 'undefined') {
    windowListenersAttached = true;
    window.addEventListener('resize', () => {
      if (isRunning) resizePreviewCanvas();
    }, { passive: true });

    window.addEventListener('orientationchange', () => {
      if (isRunning) {
        setTimeout(resizePreviewCanvas, 40);
        setTimeout(resizePreviewCanvas, 160);
      }
    }, { passive: true });
  }

  // Interatividade com Mouse (Drag to Rotate e Click to Attack)
  if (previewCanvas && !previewCanvas._hasMouseDragAttached) {
    previewCanvas._hasMouseDragAttached = true;
    let isMouseDown = false;
    let mouseStartX = 0;
    let hasDraggedDistance = 0;

    previewCanvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isMouseDown = true;
      mouseStartX = e.clientX;
      hasDraggedDistance = 0;
      previewCanvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      const dx = e.clientX - mouseStartX;
      hasDraggedDistance += Math.abs(dx);
      if (Math.abs(dx) > 22) {
        setPreviewFacing(dx > 0 ? 1 : -1);
        mouseStartX = e.clientX;
        const facingBtn = document.getElementById('btn-preview-facing');
        if (facingBtn) facingBtn.classList.toggle('flipped', currentFacing === -1);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (!isMouseDown) return;
      isMouseDown = false;
      previewCanvas.style.cursor = 'grab';
      // Se foi apenas um clique sem arrasto, dispara ataque característico
      if (hasDraggedDistance < 6) {
        triggerHeroAttack(true);
      }
    });

    previewCanvas.style.cursor = 'grab';
  }

  resizePreviewCanvas();
  initParticles();
  return true;
}

export function resizePreviewCanvas() {
  if (!previewCanvas || !previewCtx) return;
  const rect = previewCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = previewCanvas.clientWidth || rect.width || 0;
  const h = previewCanvas.clientHeight || rect.height || 0;

  if (w > 0 && h > 0) {
    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);
    if (previewCanvas.width !== targetW || previewCanvas.height !== targetH) {
      previewCanvas.width = targetW;
      previewCanvas.height = targetH;
    }
  }

  previewCtx.setTransform(1, 0, 0, 1, 0, 0);
  previewCtx.scale(dpr, dpr);
}

/**
 * Inicializa pool de partículas elementais que flutuam ao redor do altar.
 */
function initParticles() {
  particles = [];
  const count = 36;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 340,
      y: 40 + Math.random() * 120,
      vy: 0.35 + Math.random() * 0.85,
      vx: (Math.random() - 0.5) * 0.5,
      size: 1.8 + Math.random() * 3.2,
      alpha: Math.random(),
      life: Math.random() * 100,
      seed: Math.random() * 10
    });
  }
}

/**
 * Define o herói atualmente exibido no palco de evocação.
 */
export function setPreviewHero(heroKey) {
  if (!CHARACTERS[heroKey]) return;
  if (currentHeroKey !== heroKey) {
    currentHeroKey = heroKey;
    attackTimer = 0;
    triggerHeroSurge(false);
  }
}

/**
 * Alterna a orientação (espelhamento horizontal) do personagem.
 */
export function togglePreviewFacing() {
  currentFacing = currentFacing === 1 ? -1 : 1;
  triggerHaptic('light');
  return currentFacing;
}

export function setPreviewFacing(dir) {
  currentFacing = dir >= 0 ? 1 : -1;
}

/**
 * Dispara o ataque característico do herói atual no preview.
 */
export function triggerHeroAttack(playSound = true) {
  attackTimer = 0;
  triggerHaptic('medium');

  if (playSound) {
    try {
      if (currentHeroKey === 'KNIGHT') playSfx('hammer_slam');
      else if (currentHeroKey === 'MAGE') playSfx('fire_cast');
      else if (currentHeroKey === 'ROGUE') playSfx('blade_throw');
      else if (currentHeroKey === 'BARBARIAN') playSfx('axe_cleave');
      else if (currentHeroKey === 'ALCHEMIST') playSfx('potion_throw');
    } catch (e) {}
  }
}

/**
 * Altera a postura do herói na prévia: 'idle', 'combat' (ataque) ou 'skill'.
 */
export function setPreviewPose(pose) {
  if (['idle', 'combat', 'skill'].includes(pose)) {
    currentPose = pose;
    if (pose === 'combat') {
      triggerHeroAttack(true);
    } else {
      triggerHeroSurge(true);
    }
  }
}

export function getPreviewPose() {
  return currentPose;
}

export function getPreviewInfo() {
  return {
    pose: currentPose,
    heroKey: currentHeroKey,
    attackTimer: attackTimer,
    time: previewTime
  };
}

export function setPreviewAttackFrame(frame) {
  attackTimer = Math.max(0, Math.min(ATTACK_CYCLE_FRAMES - 1, frame));
}

export function renderPreviewAtFrame(frame) {
  attackTimer = Math.max(0, Math.min(ATTACK_CYCLE_FRAMES - 1, frame));
  renderStage();
}

/**
 * Dispara uma onda de energia mística de suporte (ao trocar campeão ou usar habilidade).
 */
export function triggerHeroSurge(playSound = true) {
  shockwaves.push({
    radius: 20,
    maxRadius: 220,
    alpha: 0.9,
    speed: 5.5
  });

  const colors = THEME_COLORS[currentHeroKey] || THEME_COLORS.KNIGHT;
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.3;
    const spd = 3.5 + Math.random() * 5.0;
    particles.push({
      x: 0,
      y: 70,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd * 0.6 - 1.8,
      size: 3.0 + Math.random() * 3.5,
      alpha: 1.0,
      life: 0,
      maxLife: 40 + Math.random() * 25,
      color: Math.random() > 0.4 ? colors.primary : colors.secondary
    });
  }

  surgeTimer = 25;
  if (playSound) {
    try {
      playSfx('charge');
    } catch (e) {}
    triggerHaptic('medium');
  }
}

/**
 * Inicia o loop de animação da prévia.
 */
export function startPreview(heroKey) {
  if (heroKey) currentHeroKey = heroKey;
  if (!previewCanvas) {
    const canvasEl = document.getElementById('char-preview-canvas');
    if (canvasEl) initPreviewCanvas(canvasEl);
  }

  if (!previewCanvas) return;
  resizePreviewCanvas();
  isRunning = true;

  if (animFrameId) cancelAnimationFrame(animFrameId);
  renderLoop();
}

/**
 * Interrompe a renderização para poupar recursos durante o gameplay.
 */
export function stopPreview() {
  isRunning = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}

/**
 * Loop principal de animação a 60 FPS com física e iluminação dinâmica.
 */
function renderLoop() {
  if (!isRunning || !previewCanvas || !previewCtx) return;

  previewTime += 1;
  if (currentPose === 'combat') {
    attackTimer = (attackTimer + 1) % ATTACK_CYCLE_FRAMES;

    // Disparos sonoros de impacto no ápice da animação
    if (attackTimer === 18 && currentHeroKey === 'KNIGHT') {
      try { playSfx('hammer_hit'); } catch (e) {}
    } else if (attackTimer === 41 && currentHeroKey === 'ALCHEMIST') {
      try { playSfx('potion_shatter'); playSfx('acid_explosion'); } catch (e) {}
    } else if (attackTimer === 48 && currentHeroKey === 'MAGE') {
      try { playSfx('fire_hit'); } catch (e) {}
    }
  } else {
    attackTimer = 0;
  }

  renderStage();
  animFrameId = requestAnimationFrame(renderLoop);
}

function syncCanvasDimensions() {
  if (!previewCanvas || !previewCtx) return { width: 280, height: 320, dpr: 1, skipFrame: true };

  const rect = previewCanvas.getBoundingClientRect();
  const clientW = previewCanvas.clientWidth || rect.width || 0;
  const clientH = previewCanvas.clientHeight || rect.height || 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  if (clientW <= 0 || clientH <= 0) {
    return {
      width: previewCanvas.width ? (previewCanvas.width / dpr) : 280,
      height: previewCanvas.height ? (previewCanvas.height / dpr) : 320,
      dpr,
      skipFrame: previewCanvas.width <= 0
    };
  }

  const targetW = Math.round(clientW * dpr);
  const targetH = Math.round(clientH * dpr);

  if (previewCanvas.width !== targetW || previewCanvas.height !== targetH) {
    previewCanvas.width = targetW;
    previewCanvas.height = targetH;
  }

  return {
    width: clientW,
    height: clientH,
    dpr,
    skipFrame: false
  };
}

/**
 * Calcula a escala duplicada do herói e adapta suavemente para não transbordar em janelas menores.
 */
function computeHeroScale(width, height) {
  const isCompact = height < 250 || width < 250;
  const isTall = height >= 310;

  // Escala dobrada para presença monumental do campeão (de 3.35 para 6.6)
  const targetScale = isCompact ? 4.8 : (isTall ? 6.6 : 5.8);

  // Proteção adaptativa proporcional às dimensões reais do canvas
  const maxSafeScaleH = (height * 0.72) / 44;
  const maxSafeScaleW = (width * 0.82) / 70;
  const safeScale = Math.min(targetScale, Math.max(3.2, Math.min(maxSafeScaleH, maxSafeScaleW)));

  return { heroScale: safeScale, isCompact, isTall };
}

/**
 * Desenha o palco completo: Fundo com blur da arena, Altar de pedra, partículas, arma e o herói.
 */
function renderStage() {
  const sync = syncCanvasDimensions();
  if (sync.skipFrame) return;

  const c = previewCtx;
  const { width, height, dpr } = sync;

  c.setTransform(1, 0, 0, 1, 0, 0);
  c.scale(dpr, dpr);

  const { heroScale, isCompact, isTall } = computeHeroScale(width, height);
  const centerX = width / 2;
  const centerY = isCompact ? height * 0.52 : (isTall ? height * 0.46 : height * 0.48);
  const footY = centerY + Math.round(13.2 * heroScale);

  const colors = THEME_COLORS[currentHeroKey] || THEME_COLORS.KNIGHT;

  // 1. Limpeza do Canvas
  c.clearRect(0, 0, width, height);

  // 2. Pedestal de pedra estilizado com runas arcanas (escala dobrada)
  drawHeroPedestal(c, centerX, footY, colors, isCompact, width, heroScale);

  // 3. Ondas de choque cinéticas sobre o pedestal
  drawShockwaves(c, centerX, footY, colors);

  // 4. Sombra de contato e oclusão de ambiente sob as botas
  drawSimpleHeroShadow(c, centerX, footY, isCompact, heroScale);

  // 5. Renderização do Modelo do Herói em escala ampliada
  drawHeroInstance(c, centerX, centerY, colors, heroScale);

  // 6. Partículas atmosféricas elementais
  drawAtmosphericParticles(c, centerX, centerY + Math.round(10 * heroScale), colors);

  // 7. Efeitos Visuais Cinéticos de Ataque e Empunhadura de Armas Reais
  if (currentPose === 'combat') {
    drawHeroWeaponAttack(c, centerX, centerY, currentHeroKey, currentFacing, heroScale, attackTimer, colors);
  }
}

/**
 * Desenha uma sombra realista de contato e oclusão de ambiente (AO) diretamente sobre as lajotas da arena real.
 */
function drawSimpleHeroShadow(c, x, y, isCompact = false, heroScale = 6.6) {
  const rx = Math.round(heroScale * 14.5);
  const ry = Math.round(heroScale * 3.6);
  c.save();

  // 1. Sombra Difusa Geral do Corpo no Solo da Arena Real
  const grad = c.createRadialGradient(x, y + 4, 0, x, y + 4, rx);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.76)');
  grad.addColorStop(0.45, 'rgba(0, 0, 0, 0.35)');
  grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.09)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  c.fillStyle = grad;
  c.beginPath();
  c.ellipse(x, y + 4, rx, ry, 0, 0, Math.PI * 2);
  c.fill();

  // 2. Oclusão de Ambiente Direta sob as Botas (ancoragem física perfeita no mármore)
  const footSpacing = Math.round(heroScale * 4.2);
  const bootRx = Math.round(heroScale * 3.6);
  const bootRy = Math.round(heroScale * 1.35);
  c.fillStyle = 'rgba(0, 0, 0, 0.92)';

  c.beginPath();
  c.ellipse(x - footSpacing * currentFacing, y, bootRx, bootRy, 0, 0, Math.PI * 2);
  c.fill();

  c.beginPath();
  c.ellipse(x + footSpacing * currentFacing, y, bootRx, bootRy, 0, 0, Math.PI * 2);
  c.fill();

  c.restore();
}


/**
 * Renderiza uma névoa rasteira abissal ultra-sutil ao redor da base do altar.
 * Cria a atmosfera solene de catacumba sem clarear o fundo nem criar manchas.
 */
function drawSubtleGroundMist(c, x, y, rx, ry, stoneH, t) {
  c.save();
  const baseY = y + stoneH * 2.2;
  const mistPuffs = 5;

  for (let i = 0; i < mistPuffs; i++) {
    const spd = 0.0035 + i * 0.0012;
    const phase = i * 1.35;
    const offsetX = Math.sin(t * spd + phase) * (rx * 0.95) + ((i % 2 === 0 ? 1 : -1) * rx * 0.35);
    const offsetY = Math.cos(t * (spd * 0.9) + phase) * (ry * 0.28);
    const puffRx = rx * (1.15 + Math.sin(t * 0.002 + i) * 0.18);
    const puffRy = ry * (0.65 + Math.cos(t * 0.002 + i) * 0.12);

    const px = x + offsetX;
    const py = baseY + offsetY;

    const mistGrad = c.createRadialGradient(px, py, 0, px, py, puffRx);
    // Opacidades ultra-tênues (0.05 max) para garantir máxima sutileza
    mistGrad.addColorStop(0, 'rgba(16, 24, 42, 0.055)');
    mistGrad.addColorStop(0.35, 'rgba(10, 16, 30, 0.035)');
    mistGrad.addColorStop(0.70, 'rgba(6, 10, 20, 0.012)');
    mistGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    c.fillStyle = mistGrad;
    c.beginPath();
    c.ellipse(px, py, puffRx, puffRy, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/**
 * Desenha os 3 degraus monumentais de cantaria gótica (Altar dos Condenados).
 */
function drawTieredDais(c, x, y, rx, ry, stoneH, colors, isCompact, t) {
  // Configuração dos 3 degraus: [escala, offsetY, alturaFace, tomClaro, tomEscuro]
  const tiers = [
    { scale: 1.45, offsetY: stoneH * 1.75, faceH: stoneH * 0.75, stoneLight: '#101628', stoneDark: '#050812' },
    { scale: 1.22, offsetY: stoneH * 0.88, faceH: stoneH * 0.85, stoneLight: '#141c32', stoneDark: '#070a16' },
    { scale: 1.00, offsetY: 0,            faceH: stoneH,        stoneLight: '#1a2440', stoneDark: '#090d1c' }
  ];

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    const trX = rx * tier.scale;
    const trY = ry * tier.scale;
    const ty = y + tier.offsetY;
    const th = tier.faceH;

    // 1. Sombra de oclusão projetada pelo degrau sobre a base anterior
    if (i < 2) {
      c.save();
      const shadowGrad = c.createRadialGradient(x, ty + th, trX * 0.5, x, ty + th + 6, trX * 1.15);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      c.fillStyle = shadowGrad;
      c.beginPath();
      c.ellipse(x, ty + th + 3, trX * 1.15, trY * 1.15, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    // 2. Face lateral tridimensional de cantaria
    c.save();
    c.fillStyle = tier.stoneDark;
    c.beginPath();
    c.ellipse(x, ty + th, trX, trY, 0, 0, Math.PI);
    c.ellipse(x, ty, trX, trY, 0, Math.PI, 0, true);
    c.closePath();
    c.fill();

    // Ranhuras verticais de blocos de pedra entalhada
    const numJoints = 10 + i * 3;
    c.strokeStyle = 'rgba(0, 0, 0, 0.65)';
    c.lineWidth = 1.2;
    for (let j = 1; j < numJoints; j++) {
      const angle = Math.PI * (j / numJoints);
      const jx = x + Math.cos(angle) * trX;
      const jy = ty + Math.sin(angle) * trY;
      c.beginPath();
      c.moveTo(jx, jy);
      c.lineTo(jx, jy + th);
      c.stroke();
    }

    // Chanfro e iluminação sutil de cantaria nas bordas laterais
    const sideGrad = c.createLinearGradient(x - trX, ty, x + trX, ty);
    sideGrad.addColorStop(0, 'rgba(0,0,0,0)');
    sideGrad.addColorStop(0.2, `${colors.primary}10`);
    sideGrad.addColorStop(0.5, `${colors.primary}20`);
    sideGrad.addColorStop(0.8, `${colors.primary}10`);
    sideGrad.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sideGrad;
    c.beginPath();
    c.ellipse(x, ty + th, trX, trY, 0, 0, Math.PI);
    c.ellipse(x, ty, trX, trY, 0, Math.PI, 0, true);
    c.closePath();
    c.fill();
    c.restore();

    // 3. Superfície superior de laje polida
    c.save();
    const topGrad = c.createRadialGradient(x, ty - trY * 0.25, 0, x, ty, trX);
    topGrad.addColorStop(0, tier.stoneLight);
    topGrad.addColorStop(0.65, tier.stoneDark);
    topGrad.addColorStop(1, '#030408');
    c.fillStyle = topGrad;
    c.beginPath();
    c.ellipse(x, ty, trX, trY, 0, 0, Math.PI * 2);
    c.fill();

    // Borda superior entalhada
    const isTop = (i === 2);
    const borderAlpha = isTop ? (0.38 + Math.sin(t * 0.03) * 0.1) : 0.14;
    c.strokeStyle = isTop ? `${colors.primary}${Math.floor(borderAlpha * 255).toString(16).padStart(2, '0')}` : 'rgba(255, 255, 255, 0.12)';
    c.lineWidth = isTop ? 2.4 : 1.4;
    c.beginPath();
    c.ellipse(x, ty, trX, trY, 0, 0, Math.PI * 2);
    c.stroke();

    // Entalhe de cantaria rúnica discreto nos degraus inferiores
    if (!isTop) {
      c.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      c.lineWidth = 1.0;
      c.beginPath();
      c.ellipse(x, ty, trX * 0.92, trY * 0.92, 0, 0, Math.PI * 2);
      c.stroke();
    }

    c.restore();
  }
}

/**
 * Desenha o Altar dos Condenados: Dais escalonado em 3 degraus, névoa abissal rasteira e anel rúnico.
 */
function drawHeroPedestal(c, x, y, colors, isCompact, width, heroScale = 6.6) {
  const rx = Math.round(heroScale * 24.2);
  const ry = Math.round(rx * 0.275);
  const stoneH = Math.round(rx * 0.165);
  const t = previewTime;

  // 1. Névoa abissal rasteira sutil ao nível do piso
  drawSubtleGroundMist(c, x, y, rx, ry, stoneH, t);

  // 2. Três degraus monumentais de cantaria gótica
  drawTieredDais(c, x, y, rx, ry, stoneH, colors, isCompact, t);

  c.save();

  // ── 5. Anel rúnico externo rotativo ──
  c.save();
  c.translate(x, y);
  c.scale(1, ry / rx); // achatar para perspectiva isométrica

  const runeRadius = rx * 0.82;
  const runeAngle = t * 0.008;
  const runeCount = 14;
  const runeAlpha = 0.35 + Math.sin(t * 0.04) * 0.12;

  c.strokeStyle = `${colors.primary}${Math.floor(runeAlpha * 255).toString(16).padStart(2, '0')}`;
  c.lineWidth = 1.4;

  // Círculo do anel rúnico
  c.beginPath();
  c.arc(0, 0, runeRadius, 0, Math.PI * 2);
  c.stroke();

  // Marcas rúnicas no anel
  for (let i = 0; i < runeCount; i++) {
    const a = runeAngle + (i / runeCount) * Math.PI * 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);

    // Traço radial
    c.beginPath();
    c.moveTo(cos * (runeRadius - 8), sin * (runeRadius - 8));
    c.lineTo(cos * (runeRadius + 8), sin * (runeRadius + 8));
    c.stroke();

    // Ponto rúnico brilhante
    const dotAlpha = 0.4 + Math.sin(t * 0.06 + i * 1.2) * 0.3;
    c.fillStyle = `${colors.primary}${Math.floor(dotAlpha * 255).toString(16).padStart(2, '0')}`;
    c.beginPath();
    c.arc(cos * runeRadius, sin * runeRadius, 3.0, 0, Math.PI * 2);
    c.fill();
  }

  // ── 6. Anel interno com sigilos ──
  const innerRadius = rx * 0.48;
  const innerAlpha = 0.22 + Math.sin(t * 0.05 + 1) * 0.08;
  c.strokeStyle = `${colors.secondary}${Math.floor(innerAlpha * 255).toString(16).padStart(2, '0')}`;
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(0, 0, innerRadius, 0, Math.PI * 2);
  c.stroke();

  // Sigilos internos (triângulo inscrito rotativo reverso)
  const sigilAngle = -t * 0.012;
  c.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = sigilAngle + (i / 3) * Math.PI * 2;
    const px = Math.cos(a) * innerRadius;
    const py = Math.sin(a) * innerRadius;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.stroke();

  c.restore();

  // ── 7. Brilho focal central (ponto de invocação) ──
  const coreRx = rx * 0.32;
  const coreRy = ry * 0.32;
  const coreGlow = c.createRadialGradient(x, y, 0, x, y, coreRx);
  const coreAlpha = 0.14 + Math.sin(t * 0.04) * 0.05;
  coreGlow.addColorStop(0, `${colors.primary}${Math.floor(coreAlpha * 255).toString(16).padStart(2, '0')}`);
  coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = coreGlow;
  c.beginPath();
  c.ellipse(x, y, coreRx, coreRy, 0, 0, Math.PI * 2);
  c.fill();

  c.restore();
}


function drawShockwaves(c, x, y, colors) {
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.radius += sw.speed;
    sw.alpha *= 0.94;

    if (sw.radius >= sw.maxRadius || sw.alpha <= 0.02) {
      shockwaves.splice(i, 1);
      continue;
    }

    c.save();
    c.translate(x, y);
    c.scale(1, 0.35);
    c.strokeStyle = `${colors.primary}${Math.floor(sw.alpha * 255).toString(16).padStart(2, '0')}`;
    c.lineWidth = 3.8 * sw.alpha;
    c.beginPath();
    c.arc(0, 0, sw.radius, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
}

function drawAtmosphericParticles(c, x, y, colors) {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.y -= p.vy;
    p.x += p.vx + Math.sin(previewTime * 0.04 + p.seed) * 0.3;
    p.alpha -= 0.008;

    if (p.maxLife) {
      p.life++;
      if (p.life >= p.maxLife) p.alpha = 0;
    }

    if (p.alpha <= 0 || p.y < -220) {
      p.x = (Math.random() - 0.5) * 280;
      p.y = 25 + Math.random() * 45;
      p.alpha = 0.5 + Math.random() * 0.5;
      p.vy = 0.45 + Math.random() * 0.95;
      p.color = undefined;
      p.maxLife = undefined;
    }

    const pColor = p.color || (i % 2 === 0 ? colors.primary : colors.secondary);
    c.fillStyle = pColor;
    c.globalAlpha = Math.max(0, p.alpha * 0.8);
    c.beginPath();

    if (currentHeroKey === 'ALCHEMIST') {
      c.arc(x + p.x, y + p.y, p.size * 1.25, 0, Math.PI * 2);
      c.fillStyle = i % 2 === 0 ? colors.secondary : '#b967ff';
      c.globalAlpha = Math.max(0, p.alpha * 0.38);
      c.fill();
      c.strokeStyle = i % 2 === 0 ? colors.primary : '#d6a2e8';
      c.lineWidth = 1.0;
      c.globalAlpha = Math.max(0, p.alpha * 0.85);
      c.stroke();
    } else if (currentHeroKey === 'MAGE') {
      c.save();
      c.translate(x + p.x, y + p.y);
      c.rotate(previewTime * 0.05 + p.seed);
      const flameS = p.size * 1.15;
      c.fillStyle = i % 3 === 0 ? '#ff4757' : (i % 3 === 1 ? '#e67e22' : '#f1c40f');
      c.beginPath();
      c.moveTo(0, -flameS * 1.5);
      c.quadraticCurveTo(flameS * 0.9, -flameS * 0.3, flameS * 0.6, flameS * 0.8);
      c.quadraticCurveTo(0, flameS * 1.2, -flameS * 0.6, flameS * 0.8);
      c.quadraticCurveTo(-flameS * 0.9, -flameS * 0.3, 0, -flameS * 1.5);
      c.closePath();
      c.fill();
      c.restore();
    } else if (currentHeroKey === 'BARBARIAN') {
      c.save();
      c.translate(x + p.x, y + p.y);
      c.rotate(previewTime * 0.06 + p.seed);
      c.fillStyle = i % 3 === 0 ? '#ff7675' : (i % 3 === 1 ? '#f39c12' : '#ffffff');
      c.fillRect(-p.size * 0.7, -p.size * 0.7, p.size * 1.4, p.size * 1.4);
      c.restore();
    } else if (currentHeroKey === 'KNIGHT') {
      c.save();
      c.translate(x + p.x, y + p.y);
      c.rotate(previewTime * 0.04 + p.seed);
      const s = p.size * 1.05;
      c.fillStyle = i % 3 === 0 ? '#ffeaa7' : (i % 3 === 1 ? '#fbc531' : '#ffffff');
      c.beginPath();
      c.moveTo(0, -s * 1.6);
      c.lineTo(s * 0.45, -s * 0.35);
      c.lineTo(s * 1.6, 0);
      c.lineTo(s * 0.45, s * 0.35);
      c.lineTo(0, s * 1.6);
      c.lineTo(-s * 0.45, s * 0.35);
      c.lineTo(-s * 1.6, 0);
      c.lineTo(-s * 0.45, -s * 0.35);
      c.closePath();
      c.fill();
      c.restore();
    } else if (currentHeroKey === 'ROGUE') {
      c.save();
      c.translate(x + p.x, y + p.y);
      c.rotate(previewTime * 0.08 + p.seed);
      const ls = p.size * 1.2;
      c.fillStyle = i % 4 === 0 ? '#c084fc' : '#7c3aed';
      c.beginPath();
      c.moveTo(0, -ls * 1.8);
      c.lineTo(ls * 0.4, 0);
      c.lineTo(0, ls * 1.8);
      c.lineTo(-ls * 0.4, 0);
      c.closePath();
      c.fill();
      c.restore();
    } else {
      c.arc(x + p.x, y + p.y, p.size, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1.0;
  }
}

/**
 * Renderiza o campeão central ampliado com todas as camadas e estados de postura.
 */
function drawHeroInstance(c, x, y, colors, heroScale = 6.6) {
  const isSkill = currentPose === 'skill';
  const isCombat = currentPose === 'combat';

  const t = previewTime;
  const bobFactor = isCombat ? 1.2 : 1.0;
  const breathBob = Math.sin(t * 0.06) * 2.8 * bobFactor;

  // Pulso de energia da aura na habilidade
  if (isSkill || surgeTimer > 0) {
    if (surgeTimer > 0) surgeTimer--;
    const pulseRadius = Math.round(heroScale * 11.5) + Math.sin(t * 0.2) * 8;
    c.save();
    c.strokeStyle = colors.primary;
    c.lineWidth = 3.2;
    c.beginPath();
    c.arc(x, y - 4 + breathBob, pulseRadius, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = colors.glow;
    c.fill();
    c.restore();
  }

  // Sincronização da máquina de estados do modelo com as fases ativas do ataque
  const isKnightHammerSwing = isCombat && currentHeroKey === 'KNIGHT';
  const knightProgress = isKnightHammerSwing ? Math.max(0, Math.min(1, attackTimer / 46)) : -1;
  const isMageStaffCast = isCombat && currentHeroKey === 'MAGE';
  const isRogueBladeAttack = isCombat && currentHeroKey === 'ROGUE';
  const isBarbarianAxeCleave = isCombat && currentHeroKey === 'BARBARIAN';
  const isAlchemistPotionThrow = isCombat && currentHeroKey === 'ALCHEMIST';

  const heroState = {
    x: x,
    y: y + breathBob,
    facing: currentFacing,
    scale: heroScale,
    isMoving: false,
    walkCycle: 0,
    frameCount: t,
    radius: Math.round(heroScale * 4.2),
    showShadow: false,

    // KNIGHT & MAGE
    isDashing: isSkill && (currentHeroKey === 'KNIGHT' || currentHeroKey === 'MAGE'),
    isRetaliating: isSkill && currentHeroKey === 'KNIGHT',
    isHammerAttacking: isKnightHammerSwing,
    hammerProgress: knightProgress,

    // BARBARIAN
    isBerserk: isSkill && currentHeroKey === 'BARBARIAN',
    berserkTimer: isSkill && currentHeroKey === 'BARBARIAN' ? 120 : 0,
    showDorsalAxe: currentHeroKey === 'BARBARIAN' && !isBarbarianAxeCleave,

    // ROGUE
    isPhasing: isSkill && currentHeroKey === 'ROGUE',
    invisTimer: isSkill && currentHeroKey === 'ROGUE' ? 60 : 0,
    isSwordAttacking: isRogueBladeAttack,
    showDorsalBlades: currentHeroKey === 'ROGUE',

    // MAGE
    isCasting: isMageStaffCast,
    staffCastTimer: isSkill && currentHeroKey === 'MAGE' ? 40 : (isMageStaffCast ? 30 : 0),

    // ALCHEMIST
    isThrowing: isAlchemistPotionThrow,
    isAlchemistSkill: isSkill && currentHeroKey === 'ALCHEMIST',
    isAlchemistCombat: isCombat && currentHeroKey === 'ALCHEMIST',
    alchemistSkillTimer: isSkill && currentHeroKey === 'ALCHEMIST' ? 60 : 0,

    fluidColor: isSkill ? '#a29bfe' : '#9b59b6',
    evolvedPotion: isSkill
  };

  renderHeroModel(c, currentHeroKey, heroState);
}

/**
 * ============================================================================
 * RENDERIZADOR DEDICADO DE ATAQUES REALISTAS COM ARMAS NO CHARACTER PREVIEW
 * ============================================================================
 */
function drawHeroWeaponAttack(c, cx, cy, heroKey, facing, scale, t, colors) {
  c.save();
  c.translate(cx, cy);
  c.scale(facing, 1);

  if (heroKey === 'KNIGHT') {
    // ------------------------------------------------------------------------
    // 1. SIR ROLAND: EFEITOS SÍSMICOS E FENDAS TECTÔNICAS EM ALTA DEFINIÇÃO
    // ------------------------------------------------------------------------
    const slamFrame = 18;
    const impactProgress = Math.max(0, Math.min(1, (t - slamFrame) / 28));

    if (t < slamFrame) {
      previewKnightCrackData = null;
      // Fase 1: Windup - Círculo rúnico convergindo no ponto do impacto
      const windupT = t / slamFrame;
      c.save();
      c.translate(20 * scale, 22 * scale);
      c.scale(1, 0.45); // perspectiva isométrica do pedestal
      c.strokeStyle = `rgba(241, 196, 15, ${windupT * 0.75})`;
      c.lineWidth = 2.2;
      c.beginPath();
      c.arc(0, 0, 26 * (1 - windupT * 0.35), 0, Math.PI * 2);
      c.stroke();
      c.restore();
    } else {
      // Fase 2 & 3: Impacto Sísmico e Fendas Tectônicas Detalhadas no Pedestal
      if (!previewKnightCrackData) {
        previewKnightCrackData = generateGroundCracks(0.15, 36 * scale, 2, false);
      }
      const alpha = 1 - impactProgress;
      c.save();
      c.translate(20 * scale, 22 * scale);
      c.scale(1, 0.55); // inclinação do pedestal
      drawDetailedGroundCracks(c, previewKnightCrackData, impactProgress, alpha, 0.15, 36 * scale, false, 0.65);
      c.restore();
    }
  } else if (heroKey === 'MAGE') {
    // ------------------------------------------------------------------------
    // 2. IGNIS: CANALIZAÇÃO DO CAJADO E ESFERA DE FOGO SOLAR
    // ------------------------------------------------------------------------
    const castFrame = 16;
    const fireballLife = 32;

    // Cajado da Tormenta sempre visível empunhado à frente durante o ataque
    const staffPulse = Math.sin(t * 0.18) * 0.05;
    const staffX = 14 * scale;
    const staffY = -2 * scale;
    drawStormStaff(c, staffX, staffY, 0.22 + staffPulse, scale * 0.42);

    if (t < castFrame) {
      // Brilho concentrado na ponta do cajado (ignição térmica)
      const prepT = t / castFrame;
      const orbX = 22 * scale;
      const orbY = -14 * scale;
      const flareR = (4 + prepT * 12) * (scale * 0.4);

      c.fillStyle = 'rgba(243, 156, 18, 0.5)';
      c.beginPath();
      c.arc(orbX, orbY, flareR * 1.8, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#f1c40f';
      c.beginPath();
      c.arc(orbX, orbY, flareR, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(orbX, orbY, flareR * 0.45, 0, Math.PI * 2);
      c.fill();
    } else if (t < castFrame + fireballLife) {
      // Disparo e trajetória da bola de fogo com rastro cometa contínuo
      const flyProgress = (t - castFrame) / fireballLife;
      const fbX = 20 * scale + flyProgress * 34 * scale;
      const fbY = -14 * scale + Math.sin(flyProgress * Math.PI) * -8 * scale;
      const fbR = 8.5 * scale * 0.45;

      // Rastro térmico em cauda de cometa fluida com labaredas e fagulhas
      const tailLen = 6;
      for (let tr = 1; tr <= tailLen; tr++) {
        const trProg = tr / tailLen;
        const trAlpha = (1 - trProg) * 0.75;
        const trX = fbX - tr * 7 * (scale * 0.4);
        const trY = fbY + Math.sin(t * 0.4 + tr) * 1.5;
        const trR = fbR * (1 - trProg * 0.75);

        // Chama externa carmesim
        c.fillStyle = tr % 2 === 0 ? `rgba(231, 76, 60, ${trAlpha * 0.6})` : `rgba(230, 126, 34, ${trAlpha * 0.6})`;
        c.beginPath();
        c.arc(trX, trY, trR * 1.4, 0, Math.PI * 2);
        c.fill();

        // Núcleo interno dourado
        c.fillStyle = `rgba(241, 196, 15, ${trAlpha})`;
        c.beginPath();
        c.arc(trX, trY, trR * 0.75, 0, Math.PI * 2);
        c.fill();

        // Faíscas desprendidas
        if (tr % 2 === 0) {
          c.fillStyle = `rgba(255, 255, 255, ${trAlpha * 0.9})`;
          c.fillRect(trX, trY - trProg * 3, 1.2, 1.2);
        }
      }

      // Manto externo de fogo
      c.fillStyle = '#e74c3c';
      c.beginPath();
      c.arc(fbX, fbY, fbR * 1.5, 0, Math.PI * 2);
      c.fill();

      // Manto interno incandescente
      c.fillStyle = '#f1c40f';
      c.beginPath();
      c.arc(fbX, fbY, fbR, 0, Math.PI * 2);
      c.fill();

      // Núcleo branco solar
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(fbX + 1.5, fbY, fbR * 0.5, 0, Math.PI * 2);
      c.fill();
    } else if (t < castFrame + fireballLife + 12) {
      // Detonação final da bola de fogo na borda
      const expProgress = (t - (castFrame + fireballLife)) / 12;
      const expX = 20 * scale + 34 * scale;
      const expY = -14 * scale;
      const expR = (12 + expProgress * 18) * (scale * 0.4);
      const alpha = 1 - expProgress;

      c.strokeStyle = `rgba(243, 156, 18, ${alpha})`;
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(expX, expY, expR, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = `rgba(255, 235, 150, ${alpha * 0.4})`;
      c.fill();
    }
  } else if (heroKey === 'ROGUE') {
    // ------------------------------------------------------------------------
    // 3. KAEL: GOLPE DUPLO EM 'X' COM LÂMINAS ESPIRITUAIS ROXAS
    // ------------------------------------------------------------------------
    const slashFrame = 14;
    const slashDuration = 26;

    if (t < slashFrame) {
      // Fase 1: Postura de saque e guarda com as duas lâminas prontas
      const prepT = t / slashFrame;
      const d1X = 14 * scale + prepT * 6 * scale;
      const d1Y = -4 * scale;
      const d2X = 10 * scale + prepT * 4 * scale;
      const d2Y = 6 * scale;
      drawSpiritDagger(c, d1X, d1Y, 0.5 + prepT * 0.4, scale * 0.48, 0.8 + prepT * 0.2);
      drawSpiritDagger(c, d2X, d2Y, -0.6 - prepT * 0.3, scale * 0.48, 0.8 + prepT * 0.2);
    } else if (t <= slashFrame + slashDuration) {
      const sProgress = (t - slashFrame) / slashDuration;
      const alpha = 1 - Math.pow(sProgress, 1.8);
      const reachX = 26 * scale;
      const reachY = -2 * scale;

      // Arco 1: Diagonal descendente (\)
      c.save();
      c.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      c.lineWidth = 3.5 * scale * 0.4;
      c.beginPath();
      c.moveTo(reachX - 16 * scale, reachY - 26 * scale);
      c.lineTo(reachX + 22 * scale, reachY + 20 * scale);
      c.stroke();

      c.strokeStyle = `rgba(147, 51, 234, ${alpha * 0.7})`;
      c.lineWidth = 9 * scale * 0.4;
      c.stroke();
      c.restore();

      // Arco 2: Diagonal ascendente (/)
      c.save();
      c.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      c.lineWidth = 3.5 * scale * 0.4;
      c.beginPath();
      c.moveTo(reachX - 14 * scale, reachY + 22 * scale);
      c.lineTo(reachX + 24 * scale, reachY - 24 * scale);
      c.stroke();

      c.strokeStyle = `rgba(147, 51, 234, ${alpha * 0.7})`;
      c.lineWidth = 9 * scale * 0.4;
      c.stroke();
      c.restore();

      // Projeção das lâminas astrais cortando o ar
      const bladeDist = sProgress * 42 * scale;
      drawSpiritDagger(c, reachX + bladeDist, reachY - 6 * scale + bladeDist * 0.3, 0.4, scale * 0.45, alpha);
      drawSpiritDagger(c, reachX + bladeDist * 0.8, reachY + 8 * scale - bladeDist * 0.2, -0.4, scale * 0.45, alpha);
    } else {
      // Recuperação pós-corte
      const recT = (t - (slashFrame + slashDuration)) / (ATTACK_CYCLE_FRAMES - (slashFrame + slashDuration));
      const recAlpha = 1 - recT * 0.6;
      drawSpiritDagger(c, 16 * scale, -2 * scale, 0.7, scale * 0.44, recAlpha);
      drawSpiritDagger(c, 12 * scale, 4 * scale, -0.5, scale * 0.44, recAlpha);
    }
  } else if (heroKey === 'BARBARIAN') {
    // ------------------------------------------------------------------------
    // 4. KRAGDOR: TURBILHÃO DO MACHADO NÓRDICO EM 360° COM RASTRO CARMESIM
    // ------------------------------------------------------------------------
    const cleaveStart = 16;
    const cleaveDuration = 28;

    if (t < cleaveStart) {
      // Puxando machado com fúria berserk
      const prep = t / cleaveStart;
      const bX = -10 * scale - prep * 8 * scale;
      const bY = -18 * scale - prep * 6 * scale;
      drawNorseAxe(c, bX, bY, -0.8 - prep * 0.5, scale * 0.42, 1.0);
    } else if (t <= cleaveStart + cleaveDuration) {
      // Turbilhão de corte 360° em alta rotação
      const cleaveP = (t - cleaveStart) / cleaveDuration;
      const cleaveAngle = -Math.PI * 0.8 + cleaveP * Math.PI * 2.1;
      const arcR = 34 * scale;

      // Motion ribbon carmesim em arco amplo
      c.save();
      c.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      c.lineWidth = 4 * scale * 0.4;
      c.beginPath();
      c.arc(0, 0, arcR, cleaveAngle - 1.3, cleaveAngle);
      c.stroke();

      c.strokeStyle = 'rgba(231, 76, 60, 0.75)';
      c.lineWidth = 10 * scale * 0.4;
      c.beginPath();
      c.arc(0, 0, arcR, cleaveAngle - 1.6, cleaveAngle + 0.1);
      c.stroke();
      c.restore();

      // Machado empunhado girando na ponta do arco
      const axeX = Math.cos(cleaveAngle) * arcR;
      const axeY = Math.sin(cleaveAngle) * arcR * 0.5;
      drawNorseAxe(c, axeX, axeY, cleaveAngle + Math.PI / 2, scale * 0.42, 1.0);

      // Fagulhas e respingos de sangue da fúria
      for (let sp = 0; sp < 4; sp++) {
        const sX = axeX + (Math.random() - 0.5) * 14 * scale;
        const sY = axeY + (Math.random() - 0.5) * 10 * scale;
        c.fillStyle = sp % 2 === 0 ? '#ff4757' : '#ffffff';
        c.beginPath();
        c.arc(sX, sY, 2.0, 0, Math.PI * 2);
        c.fill();
      }
    } else {
      // Recuperação pós-corte do machado
      const rec = (t - (cleaveStart + cleaveDuration)) / (ATTACK_CYCLE_FRAMES - (cleaveStart + cleaveDuration));
      const bX = 14 * scale - rec * 6 * scale;
      const bY = 4 * scale + rec * 8 * scale;
      drawNorseAxe(c, bX, bY, 0.4 - rec * 0.6, scale * 0.42, 1.0 - rec * 0.3);
    }
  } else if (heroKey === 'ALCHEMIST') {
    // ------------------------------------------------------------------------
    // 5. VALÉRIA: ARREMESSO DE FRASCO QUÍMICO E POÇA ÁCIDA EFERVESCENTE
    // ------------------------------------------------------------------------
    const throwFrame = 16;
    const landFrame = 38;
    const landX = 40 * scale;
    const landY = 22 * scale;

    if (t < throwFrame) {
      // Balanço do braço preparando o frasco
      const prep = t / throwFrame;
      const vX = 14 * scale;
      const vY = -6 * scale - prep * 4 * scale;
      drawCausticPotionFlask(c, vX, vY, prep * 0.4, scale * 0.42);
    } else if (t < landFrame) {
      // Frasco em voo parabólico realista
      const flyT = (t - throwFrame) / (landFrame - throwFrame);
      const fX = 14 * scale + flyT * (landX - 14 * scale);
      const arcHeight = 32 * scale;
      const fY = -10 * scale + flyT * (landY - -10 * scale) - Math.sin(flyT * Math.PI) * arcHeight;
      const rot = flyT * Math.PI * 3.5;

      // Gotículas de vapor no rastro
      c.fillStyle = 'rgba(162, 155, 254, 0.5)';
      c.beginPath();
      c.arc(fX - 8 * scale * 0.4, fY + 4 * scale * 0.4, 2.5, 0, Math.PI * 2);
      c.fill();

      drawCausticPotionFlask(c, fX, fY, rot, scale * 0.4);
    } else if (t <= landFrame + 34) {
      // Estilhaço e Poça Ácida Efervescente no Solo
      const puddleLife = (t - landFrame) / 34;
      const alpha = 1 - puddleLife;
      const puddleR = (16 + puddleLife * 12) * scale * 0.4;

      c.save();
      c.scale(1, 0.38);
      // Halo externo corrosivo
      c.fillStyle = `rgba(155, 89, 182, ${alpha * 0.45})`;
      c.beginPath();
      c.ellipse(landX, landY * 2.6, puddleR * 1.5, puddleR, 0, 0, Math.PI * 2);
      c.fill();

      // Poça química roxa / esmeralda
      c.fillStyle = `rgba(162, 155, 254, ${alpha * 0.75})`;
      c.beginPath();
      c.ellipse(landX, landY * 2.6, puddleR, puddleR * 0.65, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();

      // Bolhas cáusticas subindo e estourando
      for (let b = 0; b < 4; b++) {
        const bOffX = landX + Math.sin(t * 0.2 + b * 2) * (puddleR * 0.8);
        const bOffY = landY - (t * 0.6 + b * 5) % 18;
        c.fillStyle = '#d6a2e8';
        c.beginPath();
        c.arc(bOffX, bOffY, 2.0, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#ffffff';
        c.lineWidth = 0.8;
        c.stroke();
      }
    }
  }

  c.restore();
}

/**
 * Utilitários gráficos de alta fidelidade para as armas em combate
 */
function drawSacredHammer(c, x, y, angle, scale, alpha = 1.0) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.globalAlpha = alpha;

  const s = scale * 0.38;
  c.scale(s, s);

  // Cabo de carvalho
  c.fillStyle = '#3d271d';
  c.fillRect(-2.5, -2, 5, 38);

  // Cabeça pesada de guerra
  c.fillStyle = '#2f3640';
  c.fillRect(-15, -22, 30, 18);
  c.strokeStyle = '#f1c40f';
  c.lineWidth = 1.6;
  c.strokeRect(-15, -22, 30, 18);

  // Faixas douradas chanfradas
  c.fillStyle = '#f1c40f';
  c.fillRect(-16, -20, 32, 3.5);
  c.fillRect(-16, -11, 32, 3.5);

  // Runa central de luz radiante
  c.fillStyle = '#ffffff';
  c.fillRect(-2, -16, 4, 6);

  c.restore();
}

function drawSpiritDagger(c, x, y, angle, scale, alpha = 1.0) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.globalAlpha = alpha;
  c.scale(scale, scale);

  // Pomo em anel/losango vazado de prata lunar com ametista
  c.save();
  c.translate(0, -9.5);
  c.rotate(Math.PI / 4);
  c.fillStyle = '#64748b';
  c.fillRect(-2.2, -2.2, 4.4, 4.4);
  c.fillStyle = '#a855f7';
  c.fillRect(-1.2, -1.2, 2.4, 2.4);
  c.fillStyle = '#ffffff';
  c.fillRect(-0.5, -0.5, 1.0, 1.0);
  c.restore();

  // Empunhadura escura com enrolamento de seda e prata
  c.fillStyle = '#0c0f17';
  c.fillRect(-1.2, -7.5, 2.4, 6.0);
  c.strokeStyle = '#cbd5e1';
  c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(-1.2, -6.5); c.lineTo(1.2, -5.5);
  c.moveTo(-1.2, -4.5); c.lineTo(1.2, -3.5);
  c.stroke();

  // Guarda transversal em asas de corvo de prata lunar
  c.fillStyle = '#64748b';
  c.fillRect(-3.4, -1.6, 6.8, 2.0);
  c.fillStyle = '#cbd5e1';
  c.fillRect(-2.0, -1.2, 4.0, 1.2);

  // Halo espectral dual-tone (ciano + violeta) ao redor da lâmina
  c.fillStyle = 'rgba(56, 189, 248, 0.25)';
  c.beginPath();
  c.moveTo(-4.5, 0);
  c.lineTo(4.5, 0);
  c.lineTo(0, 24.0);
  c.closePath();
  c.fill();

  c.fillStyle = 'rgba(168, 85, 247, 0.35)';
  c.beginPath();
  c.moveTo(-3.5, 0);
  c.lineTo(3.5, 0);
  c.lineTo(0, 22.5);
  c.closePath();
  c.fill();

  // Lâmina em losango de aço estelar pontiagudo com fio afiado
  c.fillStyle = '#475569';
  c.beginPath();
  c.moveTo(-2.8, 0);
  c.lineTo(2.8, 0);
  c.lineTo(0, 21.0);
  c.closePath();
  c.fill();

  // Chanfro claro de aço estelar
  c.fillStyle = '#94a3b8';
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(2.8, 0);
  c.lineTo(0, 21.0);
  c.closePath();
  c.fill();

  // Borda incandescente ametista
  c.strokeStyle = '#c084fc';
  c.lineWidth = 1.2;
  c.stroke();

  // Núcleo branco puro de corte central
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.moveTo(-0.8, 1.0);
  c.lineTo(0.8, 1.0);
  c.lineTo(0, 17.5);
  c.closePath();
  c.fill();

  c.restore();
}

function drawNorseAxe(c, x, y, angle, scale, alpha = 1.0) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.globalAlpha = alpha;
  c.scale(scale, scale);

  // Cabo rústico
  c.fillStyle = '#3d271d';
  c.fillRect(-2.5, -12, 5, 36);

  // Cabeça nórdica com barba de corte
  c.fillStyle = '#7f8c8d';
  c.beginPath();
  c.moveTo(2.5, -12);
  c.lineTo(16, -16);
  c.quadraticCurveTo(22, -8, 15, 4);
  c.quadraticCurveTo(8, 0, 2.5, -4);
  c.closePath();
  c.fill();
  c.strokeStyle = '#2c3e50';
  c.lineWidth = 1.4;
  c.stroke();

  // Gume de corte brilhante
  c.strokeStyle = '#ffffff';
  c.lineWidth = 2.0;
  c.beginPath();
  c.moveTo(16, -16);
  c.quadraticCurveTo(22, -8, 15, 4);
  c.stroke();

  c.restore();
}

function drawCausticPotionFlask(c, x, y, angle, scale) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(scale, scale);

  // Vidro da retorta
  c.fillStyle = 'rgba(235, 255, 248, 0.85)';
  c.beginPath();
  c.moveTo(-3, -8);
  c.lineTo(3, -8);
  c.lineTo(3, -3);
  c.lineTo(8, 6);
  c.lineTo(-8, 6);
  c.lineTo(-3, -3);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  c.lineWidth = 1.2;
  c.stroke();

  // Líquido violeta brilhante
  c.fillStyle = '#9b59b6';
  c.beginPath();
  c.moveTo(-6, 2);
  c.lineTo(6, 2);
  c.lineTo(7, 5);
  c.lineTo(-7, 5);
  c.closePath();
  c.fill();

  // Rolha
  c.fillStyle = '#8b5a2b';
  c.fillRect(-2.5, -11, 5, 3);

  c.restore();
}

function drawStormStaff(c, x, y, angle, scale, alpha = 1.0) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.globalAlpha = alpha;
  c.scale(scale, scale);

  // Haste de ébano petrificado com espiral de ouro solar
  c.fillStyle = '#1c130d';
  c.fillRect(-2, -22, 4, 44);
  c.strokeStyle = '#f1c40f';
  c.lineWidth = 1.0;
  c.beginPath();
  c.moveTo(-2, -14); c.lineTo(2, -11);
  c.moveTo(-2, -4);  c.lineTo(2, -1);
  c.moveTo(-2, 6);   c.lineTo(2, 9);
  c.stroke();

  // Ponteira inferior de ouro
  c.fillStyle = '#f1c40f';
  c.fillRect(-2.5, 20, 5, 4);

  // Coroa de garras douradas na cabeça do cajado
  c.fillStyle = '#f1c40f';
  c.beginPath();
  c.moveTo(-6, -20);
  c.lineTo(6, -20);
  c.lineTo(5, -28);
  c.lineTo(1.2, -23);
  c.lineTo(0, -25);
  c.lineTo(-1.2, -23);
  c.lineTo(-5, -28);
  c.closePath();
  c.fill();
  c.strokeStyle = '#ffeaa7';
  c.lineWidth = 0.8;
  c.stroke();

  // Micro-Sol energizado com halo e cristal solar
  c.fillStyle = 'rgba(243, 156, 18, 0.45)';
  c.beginPath();
  c.arc(0, -29, 9, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#e74c3c';
  c.beginPath();
  c.arc(0, -29, 5.5, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#f1c40f';
  c.beginPath();
  c.arc(0, -29, 3.8, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(-0.8, -29.8, 1.6, 0, Math.PI * 2);
  c.fill();

  // Anel orbital dourado inclinado
  c.strokeStyle = '#ffeaa7';
  c.lineWidth = 1.0;
  c.beginPath();
  c.ellipse(0, -29, 7.5, 2.2, -0.35, 0, Math.PI * 2);
  c.stroke();

  c.restore();
}
