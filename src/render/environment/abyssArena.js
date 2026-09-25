/**
 * src/render/environment/abyssArena.js
 * Renderização da Arena Surreal do Chefe Final: O Altar da Singularidade / O Disco do Fim dos Tempos.
 * Plataforma cósmica 2.5D de obsidiana flutuando no vazio infinito, com horizonte de eventos,
 * relógio astronômico de entropia, monólitos com correntes de plasma e olhos vivos do abismo.
 */
import { camera, cameraViewW, cameraViewH, frameCount, activeBoss } from '../../main.js';
import { player } from '../../entities/player.js';
import { tileHash } from '../environment.js';

// --- CACHES & BUFFERS DE ALTA PERFORMANCE (FASE 2: BAKING DO VAZIO CÓSMICO) ---
let _starfieldCanvas = null;
let _starfieldPattern = null;
const STARFIELD_SIZE = 1024;

function getStarfieldPattern(ctx) {
  if (_starfieldPattern) return _starfieldPattern;
  _starfieldCanvas = document.createElement('canvas');
  _starfieldCanvas.width = STARFIELD_SIZE;
  _starfieldCanvas.height = STARFIELD_SIZE;
  const sCtx = _starfieldCanvas.getContext('2d');

  sCtx.fillStyle = '#040108';
  sCtx.fillRect(0, 0, STARFIELD_SIZE, STARFIELD_SIZE);

  // Pré-renderiza 48 estrelas celestes com glow uma única vez
  for (let i = 0; i < 48; i++) {
    const h1 = tileHash(i * 13, i * 37);
    const h2 = tileHash(i * 71, i * 19);
    const sx = Math.floor(h1 * 3200) % STARFIELD_SIZE;
    const sy = Math.floor(h2 * 3200) % STARFIELD_SIZE;
    const isCyan = i % 3 === 0;
    const r = (i % 5 === 0 ? 2.2 : 1.2);

    sCtx.fillStyle = isCyan ? 'rgba(0, 206, 201, 0.28)' : 'rgba(232, 67, 147, 0.22)';
    sCtx.beginPath();
    sCtx.arc(sx, sy, r * 2.2, 0, Math.PI * 2);
    sCtx.fill();

    sCtx.fillStyle = isCyan ? 'rgba(0, 206, 201, 0.85)' : 'rgba(232, 67, 147, 0.80)';
    sCtx.beginPath();
    sCtx.arc(sx, sy, r, 0, Math.PI * 2);
    sCtx.fill();
  }

  _starfieldPattern = ctx.createPattern(_starfieldCanvas, 'repeat');
  return _starfieldPattern;
}

let _cascadeCanvas = null;
function getCascadeCanvas() {
  if (_cascadeCanvas) return _cascadeCanvas;
  _cascadeCanvas = document.createElement('canvas');
  _cascadeCanvas.width = 8;
  _cascadeCanvas.height = 64;
  const cCtx = _cascadeCanvas.getContext('2d');
  const grad = cCtx.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, 'rgba(0, 206, 201, 0.85)');
  grad.addColorStop(0.5, 'rgba(232, 67, 147, 0.50)');
  grad.addColorStop(1, 'rgba(10, 3, 20, 0)');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, 8, 64);
  return _cascadeCanvas;
}

// Caches de Gradientes Radiais Reutilizáveis (Zero GC Spike)
let _cachedAccGrad = null;
let _cachedAccGradR = -1;
function getAccretionGradient(ctx, R) {
  if (_cachedAccGrad && _cachedAccGradR === R) return _cachedAccGrad;
  _cachedAccGrad = ctx.createRadialGradient(0, 0, R * 0.9, 0, 0, R * 2.3);
  _cachedAccGrad.addColorStop(0, 'rgba(108, 92, 231, 0.28)');
  _cachedAccGrad.addColorStop(0.35, 'rgba(232, 67, 147, 0.2)');
  _cachedAccGrad.addColorStop(0.7, 'rgba(0, 206, 201, 0.14)');
  _cachedAccGrad.addColorStop(1, 'rgba(4, 1, 8, 0)');
  _cachedAccGradR = R;
  return _cachedAccGrad;
}

let _cachedFloorGrad = null;
let _cachedFloorKey = '';
function getFloorGradient(ctx, cx, cy, R) {
  const key = `${cx}_${cy}_${R}`;
  if (_cachedFloorGrad && _cachedFloorKey === key) return _cachedFloorGrad;
  _cachedFloorGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  _cachedFloorGrad.addColorStop(0, '#1c0c2e');
  _cachedFloorGrad.addColorStop(0.5, '#12071f');
  _cachedFloorGrad.addColorStop(0.85, '#0b0313');
  _cachedFloorGrad.addColorStop(1, '#050109');
  _cachedFloorKey = key;
  return _cachedFloorGrad;
}

let _cachedCoreGrad = null;
let _cachedCoreKey = '';
function getCoreGradient(ctx, cx, cy, radius) {
  const key = `${cx}_${cy}_${radius}`;
  if (_cachedCoreGrad && _cachedCoreKey === key) return _cachedCoreGrad;
  _cachedCoreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  _cachedCoreGrad.addColorStop(0, '#ffffff');
  _cachedCoreGrad.addColorStop(0.2, '#00cec9');
  _cachedCoreGrad.addColorStop(0.55, '#8e44ad');
  _cachedCoreGrad.addColorStop(0.85, '#2c0e3e');
  _cachedCoreGrad.addColorStop(1, 'rgba(10, 2, 20, 0)');
  _cachedCoreKey = key;
  return _cachedCoreGrad;
}

// Buffers estáticos para as 12 cadeias de plasma dos monólitos (Zero Allocations)
let _chainPointsX = null;
let _chainPointsY = null;

/**
 * Estado rastreado da singularidade do Altar do Fim dos Tempos (Boss Final).
 */
const lastAbyssState = { x: 0, y: 0, radius: 620, phase: 1 };

export function getAbyssArenaState() {
  if (activeBoss && (activeBoss.bossId === 4 || activeBoss.arenaCenterX !== undefined)) {
    lastAbyssState.x = activeBoss.arenaCenterX;
    lastAbyssState.y = activeBoss.arenaCenterY;
    lastAbyssState.radius = activeBoss.arenaRadius || 620;
    lastAbyssState.phase = activeBoss.phase || 1;
  } else if (!lastAbyssState.x && !lastAbyssState.y && player) {
    lastAbyssState.x = player.x;
    lastAbyssState.y = player.y;
  }
  return lastAbyssState;
}

export function resetAbyssArena() {
  lastAbyssState.x = 0;
  lastAbyssState.y = 0;
  lastAbyssState.radius = 620;
  lastAbyssState.phase = 1;
  _cachedAccGrad = null;
  _cachedAccGradR = -1;
  _cachedFloorGrad = null;
  _cachedFloorKey = '';
  _cachedCoreGrad = null;
  _cachedCoreKey = '';
}

/**
 * Renderiza a arena surreal do Chefe Final: O Altar da Singularidade / O Disco do Fim dos Tempos.
 */
export function renderSurrealAbyssArena(ctx) {
  const arena = getAbyssArenaState();
  const cx = arena.x;
  const cy = arena.y;
  const R = arena.radius;
  const phase = arena.phase || 1;

  // ==========================================
  // CAMADA 1: O VAZIO CÓSMICO PROFUNDO (BACKGROUND COM PATTERN CACHEADO)
  // ==========================================
  const starPattern = getStarfieldPattern(ctx);
  ctx.save();
  ctx.translate(camera.x * 0.92, camera.y * 0.92);
  ctx.fillStyle = starPattern;
  ctx.fillRect(camera.x * 0.08, camera.y * 0.08, cameraViewW, cameraViewH);
  ctx.restore();

  // 4 Estrelas Proeminentes Vivas com pulsação estelar orgânica (Twinkle)
  for (let i = 0; i < 4; i++) {
    const starX = camera.x + ((tileHash(i * 43, i * 79) * 3200 - camera.x * 0.08) % cameraViewW + cameraViewW) % cameraViewW;
    const starY = camera.y + ((tileHash(i * 61, i * 29) * 3200 - camera.y * 0.08) % cameraViewH + cameraViewH) % cameraViewH;
    const twinkle = Math.sin(frameCount * 0.07 + i * 1.8) * 0.45 + 0.55;
    ctx.fillStyle = i % 2 === 0 ? `rgba(0, 206, 201, ${0.85 * twinkle})` : `rgba(232, 67, 147, ${0.80 * twinkle})`;
    ctx.beginPath();
    ctx.arc(starX, starY, 2.4 * twinkle, 0, Math.PI * 2);
    ctx.fill();
  }

  // Disco de Acreção do Buraco Negro Supermassivo (Gradiente Radial em Cache)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.25);

  ctx.fillStyle = getAccretionGradient(ctx, R);
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 2.3, R * 0.88, 0, 0, Math.PI * 2);
  ctx.fill();

  const accAngle = frameCount * 0.004;
  for (let a = 0; a < 4; a++) {
    const streamAngle = accAngle + (a * Math.PI / 2);
    ctx.strokeStyle = a % 2 === 0 ? 'rgba(0, 206, 201, 0.35)' : 'rgba(232, 67, 147, 0.3)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, R * 1.55 + Math.sin(frameCount * 0.02 + a) * 20, (R * 1.55) * 0.38, streamAngle, 0, Math.PI);
    ctx.stroke();
  }
  ctx.restore();

  // Ruínas de templos celestiais à deriva no vácuo
  const debrisCount = 10;
  for (let i = 0; i < debrisCount; i++) {
    const baseAngle = (i * Math.PI * 2) / debrisCount + 0.3;
    const driftDist = R + 220 + (i * 45) % 320;
    const floatX = cx + Math.cos(baseAngle) * driftDist + Math.sin(frameCount * 0.01 + i) * 15;
    const floatY = cy + Math.sin(baseAngle) * driftDist + Math.cos(frameCount * 0.012 + i) * 12;
    const debSize = 22 + (i % 4) * 10;

    ctx.save();
    ctx.translate(floatX, floatY);
    ctx.rotate(frameCount * 0.003 * ((i % 2 === 0) ? 1 : -1) + i);
    ctx.fillStyle = '#0e0618';
    ctx.beginPath();
    ctx.moveTo(-debSize * 0.6, -debSize * 0.4);
    ctx.lineTo(debSize * 0.8, -debSize * 0.2);
    ctx.lineTo(debSize * 0.5, debSize * 0.7);
    ctx.lineTo(-debSize * 0.7, debSize * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = i % 2 === 0 ? 'rgba(0, 206, 201, 0.45)' : 'rgba(224, 86, 253, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  // Obeliscos Orbitais Flutuantes no Vácuo Infinito com Filamentos de Energia
  const orbitalObelisks = 6;
  for (let ob = 0; ob < orbitalObelisks; ob++) {
    const obAngle = (ob * Math.PI * 2) / orbitalObelisks + frameCount * 0.0015;
    const obDist = R + 480 + (ob % 3) * 60;
    const obX = cx + Math.cos(obAngle) * obDist;
    const obY = cy + Math.sin(obAngle) * obDist;

    ctx.save();
    ctx.translate(obX, obY);
    ctx.rotate(obAngle + Math.PI / 2);

    // Agulha de Basalto Cósmico
    ctx.fillStyle = '#06020c';
    ctx.strokeStyle = ob % 2 === 0 ? 'rgba(0, 206, 201, 0.6)' : 'rgba(232, 67, 147, 0.6)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(8, 0);
    ctx.lineTo(5, 32);
    ctx.lineTo(-5, 32);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Runa interna brilhante
    ctx.fillStyle = ob % 2 === 0 ? '#00cec9' : '#e84393';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Filamento de plasma sutil conectando obeliscos vizinhos (Batched em 1 único stroke)
  ctx.strokeStyle = phase === 3 ? 'rgba(0, 206, 201, 0.18)' : 'rgba(232, 67, 147, 0.15)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let ob = 0; ob < orbitalObelisks; ob++) {
    const obAngle = (ob * Math.PI * 2) / orbitalObelisks + frameCount * 0.0015;
    const obDist = R + 480 + (ob % 3) * 60;
    const nextObAngle = ((ob + 1) * Math.PI * 2) / orbitalObelisks + frameCount * 0.0015;
    const nextDist = R + 480 + ((ob + 1) % 3) * 60;
    ctx.moveTo(cx + Math.cos(obAngle) * obDist, cy + Math.sin(obAngle) * obDist);
    ctx.lineTo(cx + Math.cos(nextObAngle) * nextDist, cy + Math.sin(nextObAngle) * nextDist);
  }
  ctx.stroke();

  // Olhos Cósmicos Colossais observando silenciosamente
  const cosmicEyes = [
    { angle: -0.85, dist: R + 340, size: 48 },
    { angle: 1.15, dist: R + 400, size: 62 },
    { angle: 2.8, dist: R + 360, size: 54 }
  ];
  for (let eIdx = 0; eIdx < cosmicEyes.length; eIdx++) {
    const ce = cosmicEyes[eIdx];
    const ex = cx + Math.cos(ce.angle) * ce.dist;
    const ey = cy + Math.sin(ce.angle) * ce.dist;
    const openAmount = Math.max(0.08, Math.sin(frameCount * 0.02 + eIdx * 4));
    if (openAmount > 0.1) {
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(ce.angle + Math.PI / 2);

      const eyeGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, ce.size * 1.2);
      eyeGlow.addColorStop(0, 'rgba(232, 67, 147, 0.35)');
      eyeGlow.addColorStop(0.6, 'rgba(108, 92, 231, 0.15)');
      eyeGlow.addColorStop(1, 'rgba(4, 1, 8, 0)');
      ctx.fillStyle = eyeGlow;
      ctx.beginPath();
      ctx.arc(0, 0, ce.size * 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 206, 201, 0.7)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, ce.size, ce.size * 0.45 * openAmount, 0, 0, Math.PI * 2);
      ctx.stroke();

      const pdx = player.x - ex;
      const pdy = player.y - ey;
      const pDist = Math.hypot(pdx, pdy) || 1;
      const pupOffset = Math.min(ce.size * 0.25, pDist * 0.04);
      const pupAngle = Math.atan2(pdy, pdx) - (ce.angle + Math.PI / 2);

      ctx.fillStyle = '#00cec9';
      ctx.beginPath();
      ctx.arc(Math.cos(pupAngle) * pupOffset, Math.sin(pupAngle) * pupOffset * openAmount, ce.size * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#05020c';
      ctx.beginPath();
      ctx.ellipse(Math.cos(pupAngle) * pupOffset, Math.sin(pupAngle) * pupOffset * openAmount, ce.size * 0.07, ce.size * 0.15 * openAmount, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ==========================================
  // CAMADA 2: O PRECIPÍCIO 2.5D E CASCATAS DE MATÉRIA ESCURA
  // ==========================================
  const cliffDepth = 28;
  ctx.fillStyle = '#0a0314';
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI);
  ctx.lineTo(cx - R, cy + cliffDepth);
  ctx.arc(cx, cy + cliffDepth, R, Math.PI, 0, true);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(232, 67, 147, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy + (cliffDepth * 0.5), R - 2, 0.15, Math.PI - 0.15);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 206, 201, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy + (cliffDepth * 0.8), R - 4, 0.3, Math.PI - 0.3);
  ctx.stroke();

  // Cascatas de luz e matéria caindo no infinito (Sprite Scaled Pre-rendered)
  const cascadeSprite = getCascadeCanvas();
  const cascadeStreams = 16;
  for (let c = 0; c < cascadeStreams; c++) {
    const cAngle = (c * Math.PI * 2) / cascadeStreams + 0.1;
    const lipX = cx + Math.cos(cAngle) * R;
    const lipY = cy + Math.sin(cAngle) * R;
    const flowLength = 42 + Math.sin(frameCount * 0.1 + c * 2) * 16;
    const streamAlpha = 0.35 + Math.sin(frameCount * 0.08 + c) * 0.2;

    ctx.save();
    ctx.globalAlpha *= streamAlpha;
    ctx.drawImage(cascadeSprite, lipX - 3, lipY, 6, flowLength);
    ctx.restore();

    if ((frameCount + c * 3) % 4 === 0) {
      ctx.fillStyle = '#81ecec';
      ctx.beginPath();
      ctx.arc(lipX + (Math.random() * 6 - 3), lipY + (Math.random() * 4), 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Tentáculos Etéreos do Abismo ondulando no precipício
  const tendrilCount = 8;
  for (let t = 0; t < tendrilCount; t++) {
    const tAngle = (t * Math.PI * 2) / tendrilCount + 0.2;
    const baseTx = cx + Math.cos(tAngle) * R;
    const baseTy = cy + Math.sin(tAngle) * R + cliffDepth;
    const tWave = Math.sin(frameCount * 0.04 + t * 1.5) * 12;
    const tLen = 35 + Math.cos(frameCount * 0.03 + t) * 15;

    ctx.strokeStyle = t % 2 === 0 ? 'rgba(108, 92, 231, 0.35)' : 'rgba(232, 67, 147, 0.3)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(baseTx, baseTy);
    ctx.quadraticCurveTo(baseTx + tWave, baseTy + tLen * 0.5, baseTx + tWave * 1.6, baseTy + tLen);
    ctx.stroke();
  }

  // ==========================================
  // CAMADA 3: PISO DE ESPELHO DE OBSIDIANA (CLIPPED)
  // ==========================================
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  // Fundo do espelho de obsidiana (Gradiente em Cache)
  ctx.fillStyle = getFloorGradient(ctx, cx, cy, R);
  ctx.fillRect(cx - R - 5, cy - R - 5, (R + 5) * 2, (R + 5) * 2);

  // Nebulosa refletida na lâmina de obsidiana
  const mirrorNebula = ctx.createRadialGradient(
    cx + Math.sin(frameCount * 0.01) * 80, 
    cy + Math.cos(frameCount * 0.01) * 80, 
    20, 
    cx, 
    cy, 
    R * 0.7
  );
  mirrorNebula.addColorStop(0, 'rgba(108, 92, 231, 0.22)');
  mirrorNebula.addColorStop(0.5, 'rgba(232, 67, 147, 0.12)');
  mirrorNebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = mirrorNebula;
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

  // Divisores de placas radiais da plataforma (16 setores)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1.2;
  for (let s = 0; s < 16; s++) {
    const sAngle = (s * Math.PI * 2) / 16;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(sAngle) * (R * 0.25), cy + Math.sin(sAngle) * (R * 0.25));
    ctx.lineTo(cx + Math.cos(sAngle) * (R * 0.98), cy + Math.sin(sAngle) * (R * 0.98));
    ctx.stroke();
  }

  // 12 Canais Rúnicos de Condução de Plasma (do Vórtice Central aos 12 Monólitos - Batched)
  const pulseOffset = (frameCount * 1.2) % (R * 0.72);
  const startDist = R * 0.26;
  const endDist = R * 0.96;

  // Canaletas gravadas (1 único stroke batched)
  ctx.strokeStyle = (phase === 3) ? 'rgba(0, 206, 201, 0.22)' : 'rgba(232, 67, 147, 0.18)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let m = 0; m < 12; m++) {
    const mAngle = (m * Math.PI * 2) / 12;
    ctx.moveTo(cx + Math.cos(mAngle) * startDist, cy + Math.sin(mAngle) * startDist);
    ctx.lineTo(cx + Math.cos(mAngle) * endDist, cy + Math.sin(mAngle) * endDist);
  }
  ctx.stroke();

  // Pulso luminoso de plasma correndo ao longo dos canais (1 único fill batched)
  const curPulseDist = startDist + pulseOffset;
  if (curPulseDist < endDist) {
    ctx.fillStyle = (phase === 3) ? '#00cec9' : '#e84393';
    ctx.beginPath();
    for (let m = 0; m < 12; m++) {
      const mAngle = (m * Math.PI * 2) / 12;
      const px = cx + Math.cos(mAngle) * curPulseDist;
      const py = cy + Math.sin(mAngle) * curPulseDist;
      ctx.moveTo(px + 2.2, py);
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  // Teias de Constelações Astrais Gravadas na Obsidiana (12 Nós Estelares)
  const constellCount = 12;
  const cNodes = [];
  for (let cn = 0; cn < constellCount; cn++) {
    const ca = (cn * Math.PI * 2) / constellCount + frameCount * 0.0015;
    const cd = R * (0.38 + ((cn * 7) % 5) * 0.08);
    cNodes.push({ x: cx + Math.cos(ca) * cd, y: cy + Math.sin(ca) * cd });
  }
  ctx.strokeStyle = 'rgba(162, 155, 254, 0.12)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (let cn = 0; cn < constellCount; cn++) {
    const n1 = cNodes[cn];
    const n2 = cNodes[(cn + 3) % constellCount];
    ctx.moveTo(n1.x, n1.y);
    ctx.lineTo(n2.x, n2.y);
  }
  ctx.stroke();

  for (let cn = 0; cn < constellCount; cn++) {
    const n = cNodes[cn];
    const nPulse = Math.sin(frameCount * 0.06 + cn) * 0.4 + 0.6;
    ctx.fillStyle = cn % 2 === 0 ? `rgba(0, 206, 201, ${0.6 * nPulse})` : `rgba(232, 67, 147, ${0.5 * nPulse})`;
    ctx.beginPath();
    ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ondulações de Lente Gravitacional (Distorção do Horizonte de Eventos)
  const waveRadius = ((frameCount * 0.6) % (R * 0.85));
  const waveAlpha = Math.max(0, 0.25 * (1 - waveRadius / (R * 0.85)));
  ctx.strokeStyle = (phase === 3) ? `rgba(0, 206, 201, ${waveAlpha})` : `rgba(224, 86, 253, ${waveAlpha})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, waveRadius, 0, Math.PI * 2);
  ctx.stroke();

  // --- RELÓGIO ASTRONÔMICO DE ENTROPIA ---
  // Anel 1: Externo Rúnico (0.84 * R) rotacionando anti-horário
  const ring1R = R * 0.84;
  const rot1 = -frameCount * 0.003;
  ctx.strokeStyle = 'rgba(217, 128, 250, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, ring1R, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(217, 128, 250, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, ring1R - 10, 0, Math.PI * 2);
  ctx.stroke();

  // Traços Principais (Ciano, largura 2 - Batched)
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let g = 0; g < 36; g += 3) {
    const gAngle = rot1 + (g * Math.PI * 2) / 36;
    ctx.moveTo(cx + Math.cos(gAngle) * (ring1R - 8), cy + Math.sin(gAngle) * (ring1R - 8));
    ctx.lineTo(cx + Math.cos(gAngle) * ring1R, cy + Math.sin(gAngle) * ring1R);
  }
  ctx.stroke();

  // Traços Secundários (Lilás, largura 1 - Batched)
  ctx.strokeStyle = 'rgba(217, 128, 250, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let g = 0; g < 36; g++) {
    if (g % 3 === 0) continue;
    const gAngle = rot1 + (g * Math.PI * 2) / 36;
    ctx.moveTo(cx + Math.cos(gAngle) * (ring1R - 8), cy + Math.sin(gAngle) * (ring1R - 8));
    ctx.lineTo(cx + Math.cos(gAngle) * ring1R, cy + Math.sin(gAngle) * ring1R);
  }
  ctx.stroke();

  // Anel 2: Geometria Sagrada / Estrela de 8 pontas (0.56 * R) rotacionando horário
  const ring2R = R * 0.56;
  const rot2 = frameCount * 0.005;
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.4)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, ring2R, 0, Math.PI * 2);
  ctx.stroke();

  for (let star = 0; star < 2; star++) {
    const starOffset = rot2 + (star * Math.PI / 8);
    ctx.strokeStyle = star === 0 ? 'rgba(0, 206, 201, 0.45)' : 'rgba(232, 67, 147, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let pt = 0; pt <= 8; pt++) {
      const ptAngle = starOffset + (pt * Math.PI * 2) / 8;
      const px = cx + Math.cos(ptAngle) * ring2R;
      const py = cy + Math.sin(ptAngle) * ring2R;
      if (pt === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Anel 3: Vórtice de Singularidade Interno (0.28 * R)
  const ring3R = R * 0.28;
  const spiralPulse = Math.sin(frameCount * 0.08) * 4;
  ctx.strokeStyle = 'rgba(224, 86, 253, 0.6)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy, ring3R + spiralPulse, 0, Math.PI * 2);
  ctx.stroke();

  for (let sp = 0; sp < 4; sp++) {
    const spBase = frameCount * 0.02 + (sp * Math.PI / 2);
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let step = 0; step < 24; step++) {
      const stepR = ring3R * (1 - step / 24);
      const stepAngle = spBase + step * 0.25;
      const spx = cx + Math.cos(stepAngle) * stepR;
      const spy = cy + Math.sin(stepAngle) * stepR;
      if (step === 0) ctx.moveTo(spx, spy);
      else ctx.lineTo(spx, spy);
    }
    ctx.stroke();
  }

  // Singularidade Central (Gradiente em Cache)
  ctx.fillStyle = getCoreGradient(ctx, cx, cy, ring3R * 0.65);
  ctx.beginPath();
  ctx.arc(cx, cy, ring3R * 0.65, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#030006';
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Olhos Vivos no Piso
  const floorEyes = [
    { angle: 0.5, distRatio: 0.44 },
    { angle: 1.6, distRatio: 0.68 },
    { angle: 2.7, distRatio: 0.48 },
    { angle: 3.8, distRatio: 0.72 },
    { angle: 4.9, distRatio: 0.42 },
    { angle: 5.7, distRatio: 0.65 }
  ];
  for (let fe = 0; fe < floorEyes.length; fe++) {
    const eyeDef = floorEyes[fe];
    const fx = cx + Math.cos(eyeDef.angle) * (R * eyeDef.distRatio);
    const fy = cy + Math.sin(eyeDef.angle) * (R * eyeDef.distRatio);
    const blinkVal = Math.sin(frameCount * 0.04 + fe * 2.2);
    if (blinkVal > -0.7) {
      const openH = Math.max(2, (blinkVal + 0.7) * 7);
      ctx.fillStyle = '#06010a';
      ctx.beginPath();
      ctx.ellipse(fx, fy, 16, openH, eyeDef.angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = (phase === 3) ? '#00cec9' : '#e84393';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      const pDistX = player.x - fx;
      const pDistY = player.y - fy;
      const pLen = Math.hypot(pDistX, pDistY) || 1;
      const pupShift = Math.min(6, pLen * 0.03);
      const pAng = Math.atan2(pDistY, pDistX);

      ctx.fillStyle = (phase === 3) ? '#00cec9' : '#fd79a8';
      ctx.beginPath();
      ctx.arc(fx + Math.cos(pAng) * pupShift, fy + Math.sin(pAng) * pupShift, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(fx + Math.cos(pAng) * pupShift, fy + Math.sin(pAng) * pupShift, 1.4, openH * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (phase >= 2) {
        ctx.strokeStyle = phase === 3 ? 'rgba(0, 206, 201, 0.5)' : 'rgba(232, 67, 147, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(fx, fy + openH);
        ctx.lineTo(fx + Math.sin(fe) * 4, fy + openH + 14);
        ctx.stroke();
      }
    }
  }

  ctx.restore();

  // ==========================================
  // CAMADA 4: 12 MONÓLITOS DE CONTENÇÃO & CADEIAS DE PLASMA
  // ==========================================
  const monolithCount = 12;
  const monolithPos = [];

  for (let i = 0; i < monolithCount; i++) {
    const mAngle = (i * Math.PI * 2) / monolithCount;
    const mx = cx + Math.cos(mAngle) * (R - 4);
    const my = cy + Math.sin(mAngle) * (R - 4);
    monolithPos.push({ x: mx, y: my, angle: mAngle });
  }

  const plasmaColor = phase === 3 ? 'rgba(0, 206, 201, ' : (phase === 2 ? 'rgba(232, 67, 147, ' : 'rgba(186, 120, 255, ');
  const plasmaGlow = phase === 3 ? '#00cec9' : (phase === 2 ? '#e84393' : '#a29bfe');

  const throttledFrame = Math.floor(frameCount * 0.5) * 2;
  const arcLen = R * (Math.PI * 2 / monolithCount);

  if (!_chainPointsX || _chainPointsX.length < monolithCount * 7) {
    _chainPointsX = new Float32Array(monolithCount * 7);
    _chainPointsY = new Float32Array(monolithCount * 7);
  }

  let ptIdx = 0;
  for (let i = 0; i < monolithCount; i++) {
    const curr = monolithPos[i];
    const next = monolithPos[(i + 1) % monolithCount];
    const dx = next.x - curr.x;
    const dy = next.y - curr.y;
    const normX = -dy / arcLen;
    const normY = dx / arcLen;

    _chainPointsX[ptIdx] = curr.x;
    _chainPointsY[ptIdx] = curr.y - 18;
    ptIdx++;

    for (let s = 1; s < 6; s++) {
      const frac = s / 6;
      const midX = curr.x + dx * frac;
      const midY = curr.y + dy * frac - 18;
      const jitter = Math.sin(throttledFrame * 0.4 + i * 5 + s * 3) * 6;
      _chainPointsX[ptIdx] = midX + normX * jitter;
      _chainPointsY[ptIdx] = midY + normY * jitter;
      ptIdx++;
    }

    _chainPointsX[ptIdx] = next.x;
    _chainPointsY[ptIdx] = next.y - 18;
    ptIdx++;
  }

  // 1. Manto Externo de Plasma (1 único stroke batched para todos os 12 arcos)
  ctx.strokeStyle = `${plasmaColor}0.85)`;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let i = 0; i < monolithCount; i++) {
    const start = i * 7;
    ctx.moveTo(_chainPointsX[start], _chainPointsY[start]);
    for (let p = 1; p < 7; p++) {
      ctx.lineTo(_chainPointsX[start + p], _chainPointsY[start + p]);
    }
  }
  ctx.stroke();

  // 2. Núcleo Interno Branco Incandescente (reutiliza o mesmo path batched)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  for (let i = 0; i < monolithCount; i++) {
    const m = monolithPos[i];
    const distToPlayer = Math.hypot(player.x - m.x, player.y - m.y);
    const isWarning = distToPlayer < 90;

    ctx.fillStyle = '#0a0314';
    ctx.strokeStyle = isWarning ? '#ff7675' : plasmaGlow;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(m.x - 7, m.y + 4);
    ctx.lineTo(m.x - 4, m.y - 28);
    ctx.lineTo(m.x, m.y - 36);
    ctx.lineTo(m.x + 4, m.y - 28);
    ctx.lineTo(m.x + 7, m.y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.moveTo(m.x, m.y - 36);
    ctx.lineTo(m.x + 4, m.y - 28);
    ctx.lineTo(m.x + 7, m.y + 4);
    ctx.lineTo(m.x, m.y + 2);
    ctx.closePath();
    ctx.fill();

    const runePulse = Math.sin(frameCount * 0.12 + i) * 0.35 + 0.65;
    ctx.fillStyle = isWarning ? '#ff7675' : (phase === 3 ? '#00cec9' : '#e84393');
    ctx.beginPath();
    ctx.ellipse(m.x - 1, m.y - 14, 2, 7 * runePulse, 0, 0, Math.PI * 2);
    ctx.fill();

    const capHover = Math.sin(frameCount * 0.15 + i) * 2.5;
    ctx.fillStyle = isWarning ? '#ff7675' : plasmaGlow;
    ctx.beginPath();
    ctx.moveTo(m.x, m.y - 42 + capHover);
    ctx.lineTo(m.x + 3.5, m.y - 37 + capHover);
    ctx.lineTo(m.x, m.y - 39 + capHover);
    ctx.lineTo(m.x - 3.5, m.y - 37 + capHover);
    ctx.closePath();
    ctx.fill();

    if (isWarning && (frameCount + i) % 3 === 0) {
      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.arc(m.x + (Math.random() * 16 - 8), m.y - 20 + (Math.random() * 16 - 8), 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ==========================================
  // CAMADA 4.5: BARREIRA INVISÍVEL DE CONTENÇÃO (EFEITO REATIVO)
  // ==========================================
  const barrierR = R - (player.radius || 14) - 2;
  const pVecX = player.x - cx;
  const pVecY = player.y - cy;
  const pDistToCenter = Math.hypot(pVecX, pVecY) || 1;
  const distToBarrier = barrierR - pDistToCenter;
  const contactIntensity = activeBoss ? (activeBoss.barrierContact || 0) : 0;

  if (distToBarrier < 95 || contactIntensity > 0.05) {
    const playerAng = Math.atan2(pVecY, pVecX);
    const proximityRatio = Math.min(1.0, Math.max(0, 1.0 - (distToBarrier / 95)));
    const totalIntensity = Math.min(1.0, proximityRatio * 0.55 + contactIntensity * 0.85);

    ctx.save();
    const arcSpan = 0.46;
    const arcStart = playerAng - arcSpan;
    const arcEnd = playerAng + arcSpan;

    ctx.strokeStyle = phase === 3 
      ? `rgba(0, 206, 201, ${totalIntensity * 0.75})` 
      : (phase === 2 ? `rgba(232, 67, 147, ${totalIntensity * 0.75})` : `rgba(186, 120, 255, ${totalIntensity * 0.75})`);
    ctx.lineWidth = 4 + contactIntensity * 4;
    ctx.beginPath();
    ctx.arc(cx, cy, barrierR, arcStart, arcEnd);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${totalIntensity * 0.9})`;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    const hexCount = 7;
    for (let hx = 0; hx < hexCount; hx++) {
      const hxAng = arcStart + (hx / (hexCount - 1)) * (arcSpan * 2);
      const hxDist = barrierR - 4;
      const cellX = cx + Math.cos(hxAng) * hxDist;
      const cellY = cy + Math.sin(hxAng) * hxDist;
      const hexPulse = Math.sin(frameCount * 0.2 + hx) * 0.3 + 0.7;

      ctx.strokeStyle = phase === 3 
        ? `rgba(0, 206, 201, ${totalIntensity * 0.5 * hexPulse})` 
        : `rgba(232, 67, 147, ${totalIntensity * 0.5 * hexPulse})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const sAng = (s * Math.PI) / 3 + frameCount * 0.02;
        const sx = cellX + Math.cos(sAng) * 9;
        const sy = cellY + Math.sin(sAng) * 9;
        if (s === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.stroke();
    }

    if (contactIntensity > 0.1) {
      const contactX = cx + Math.cos(playerAng) * barrierR;
      const contactY = cy + Math.sin(playerAng) * barrierR;
      for (let r = 1; r <= 3; r++) {
        const ripR = ((frameCount * 2.2 + r * 16) % 48);
        const ripAlpha = Math.max(0, 1 - (ripR / 48)) * contactIntensity * 0.7;
        ctx.strokeStyle = phase === 3 ? `rgba(129, 236, 236, ${ripAlpha})` : `rgba(255, 121, 168, ${ripAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(contactX, contactY, ripR, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ==========================================
  // CAMADA 5: PLACAS EXTERNAS QUEBRADAS À DERIVA (FASES 2 E 3)
  // ==========================================
  if (R < 610) {
    const chunkCount = phase === 3 ? 12 : 8;
    for (let ch = 0; ch < chunkCount; ch++) {
      const chAngle = (ch * Math.PI * 2) / chunkCount + Math.sin(ch * 7);
      const breakDist = R + 42 + (620 - R) * 0.35 + Math.sin(frameCount * 0.02 + ch * 1.5) * 10;
      const chX = cx + Math.cos(chAngle) * breakDist;
      const chY = cy + Math.sin(chAngle) * breakDist;
      const tilt = chAngle + Math.sin(frameCount * 0.015 + ch) * 0.2;

      ctx.save();
      ctx.translate(chX, chY);
      ctx.rotate(tilt);

      ctx.fillStyle = '#0d0519';
      ctx.strokeStyle = phase === 3 ? 'rgba(0, 206, 201, 0.45)' : 'rgba(232, 67, 147, 0.4)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-24, -14);
      ctx.lineTo(26, -18);
      ctx.lineTo(32, 16);
      ctx.lineTo(-18, 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = phase === 3 ? '#00cec9' : '#e84393';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(12, 6);
      ctx.lineTo(24, 2);
      ctx.stroke();

      ctx.restore();
    }
  }
}
