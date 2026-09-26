/**
 * Cenário do altar em paisagem. Pedra e fundo são cacheados em resolução nativa;
 * apenas a névoa, os poucos grãos de luz e o halo usam o loop existente da prévia.
 */

let backdropCache = null;
let daisCache = null;

function cachedLayer(previous, key, width, height, dpr, draw) {
  if (previous?.key === key) return previous;
  const targetW = Math.ceil(width * dpr);
  const targetH = Math.ceil(height * dpr);
  const canvas = (previous?.canvas && previous.canvas.width === targetW && previous.canvas.height === targetH)
    ? previous.canvas
    : document.createElement('canvas');
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  draw(ctx);
  return { key, canvas };
}

// Cache de sprites de névoa/halo para eliminar alocação de gradientes radiais a cada frame
const puffSpriteCache = {};
function getPuffSprite(color) {
  if (puffSpriteCache[color]) return puffSpriteCache[color];
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, color);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  puffSpriteCache[color] = canvas;
  return canvas;
}

function drawCachedPuff(c, x, y, rx, ry, color, alpha) {
  if (alpha <= 0.005) return;
  const sprite = getPuffSprite(color);
  c.save();
  c.globalAlpha = alpha;
  c.drawImage(sprite, x - rx, y - ry, rx * 2, ry * 2);
  c.restore();
}

function ellipse(c, x, y, rx, ry) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function glow(c, x, y, rx, ry, color, alpha) {
  drawCachedPuff(c, x, y, rx, ry, color, alpha);
}


const CONSTELLATIONS = {
  KNIGHT: {
    nodes: [[-22, -32], [0, -35], [22, -32], [20, -18], [-20, -18], [0, -18], [0, 8], [0, 24]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [1, 5], [5, 6], [6, 7]]
  },
  MAGE: {
    nodes: [[0, -38], [-14, -20], [14, -20], [-26, -4], [26, -4], [-10, 14], [10, 14], [0, 26]],
    edges: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 7], [1, 2], [5, 6]]
  },
  ROGUE: {
    nodes: [[-26, -28], [-13, -12], [0, 2], [13, 16], [22, 26], [26, -28], [13, -12], [-13, 16], [-22, 26]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [5, 6], [6, 2], [2, 7], [7, 8]]
  },
  BARBARIAN: {
    nodes: [[-28, -26], [-15, -16], [0, -6], [15, -16], [28, -26], [-18, 6], [18, 6], [0, 24]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [5, 2], [6, 2], [5, 6], [2, 7]]
  },
  ALCHEMIST: {
    nodes: [[0, -34], [-6, -30], [6, -30], [0, -16], [-22, 6], [22, 6], [0, 18]],
    edges: [[1, 2], [0, 3], [3, 4], [3, 5], [4, 6], [5, 6], [4, 5]]
  }
};

function drawCosmicStarfield(c, width, height, colors, heroKey) {
  let seed = 1337;
  for (let i = 0; i < (heroKey || '').length; i++) {
    seed = (seed * 31 + heroKey.charCodeAt(i)) >>> 0;
  }
  function nextRand() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const isPortrait = width < height;
  const starCount = isPortrait ? 52 : 42;
  for (let i = 0; i < starCount; i++) {
    const sx = width * (isPortrait ? (0.06 + nextRand() * 0.88) : (0.18 + nextRand() * 0.64));
    const sy = height * (isPortrait ? (0.02 + nextRand() * 0.72) : (0.04 + nextRand() * 0.64));
    const r = 0.55 + nextRand() * 1.15;
    const alpha = 0.25 + nextRand() * 0.65;

    let starColor = '#ffffff';
    const colorRoll = nextRand();
    if (colorRoll > 0.72) {
      starColor = colors.primary;
    } else if (colorRoll > 0.48) {
      starColor = '#93c5fd';
    } else if (colorRoll > 0.32) {
      starColor = '#ddd6fe';
    }

    c.save();
    c.globalAlpha = alpha;
    c.fillStyle = starColor;
    c.beginPath();
    c.arc(sx, sy, r, 0, Math.PI * 2);
    c.fill();

    if (i < 3) {
      c.strokeStyle = starColor;
      c.lineWidth = 0.6;
      c.globalAlpha = alpha * 0.45;
      c.beginPath();
      c.moveTo(sx - 4.5, sy); c.lineTo(sx + 4.5, sy);
      c.moveTo(sx, sy - 4.5); c.lineTo(sx, sy + 4.5);
      c.stroke();
    }
    c.restore();
  }
}

function drawHeroConstellation(c, width, height, colors, heroKey) {
  const config = CONSTELLATIONS[heroKey] || CONSTELLATIONS.KNIGHT;
  const cx = width / 2;
  const isPortrait = width < height;
  const cy = height * (isPortrait ? 0.22 : 0.28);
  const scale = isPortrait
    ? Math.min(width * 0.0026, height * 0.0020)
    : Math.min(width * 0.0017, height * 0.0022);

  c.save();
  // Filamentos astrais
  c.strokeStyle = 'rgba(255, 255, 255, 0.085)';
  c.lineWidth = 0.85;
  for (let i = 0; i < config.edges.length; i++) {
    const [fromIdx, toIdx] = config.edges[i];
    const p1 = config.nodes[fromIdx];
    const p2 = config.nodes[toIdx];
    if (p1 && p2) {
      c.beginPath();
      c.moveTo(cx + p1[0] * scale, cy + p1[1] * scale);
      c.lineTo(cx + p2[0] * scale, cy + p2[1] * scale);
      c.stroke();
    }
  }

  c.strokeStyle = `${colors.primary}1f`;
  c.lineWidth = 1.4;
  for (let i = 0; i < config.edges.length; i++) {
    const [fromIdx, toIdx] = config.edges[i];
    const p1 = config.nodes[fromIdx];
    const p2 = config.nodes[toIdx];
    if (p1 && p2) {
      c.beginPath();
      c.moveTo(cx + p1[0] * scale, cy + p1[1] * scale);
      c.lineTo(cx + p2[0] * scale, cy + p2[1] * scale);
      c.stroke();
    }
  }

  // Estrelas dos nós
  for (let i = 0; i < config.nodes.length; i++) {
    const [nx, ny] = config.nodes[i];
    const px = cx + nx * scale;
    const py = cy + ny * scale;

    c.fillStyle = `${colors.primary}45`;
    c.beginPath();
    c.arc(px, py, 3.2, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(px, py, 1.25, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function drawGothicPillar(c, x, y, w, h, isLeft, colors) {
  c.save();
  const innerEdgeX = isLeft ? x + w : x;
  const outerEdgeX = isLeft ? x : x + w;

  // Fuste de basalto
  const shaftGrad = c.createLinearGradient(outerEdgeX, 0, innerEdgeX, 0);
  shaftGrad.addColorStop(0, '#04060b');
  shaftGrad.addColorStop(0.35, '#0b111a');
  shaftGrad.addColorStop(0.70, '#111824');
  shaftGrad.addColorStop(1, '#090e18');
  c.fillStyle = shaftGrad;
  c.fillRect(x, y, w, h);

  // Caneluras verticais (4 facetas com ranhuras de cantaria)
  const numFacets = 4;
  const facetW = w / numFacets;
  for (let f = 1; f < numFacets; f++) {
    const fx = x + f * facetW;
    c.strokeStyle = '#020409d0';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(fx, y);
    c.lineTo(fx, y + h);
    c.stroke();

    c.strokeStyle = '#8fa3be18';
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(fx + 1, y);
    c.lineTo(fx + 1, y + h);
    c.stroke();
  }

  // Juntas horizontais de blocos de cantaria a cada ~42px
  const blockH = 42;
  const numBlocks = Math.ceil(h / blockH);
  for (let b = 1; b < numBlocks; b++) {
    const by = y + b * blockH;
    c.strokeStyle = '#020409b0';
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(x, by);
    c.lineTo(x + w, by);
    c.stroke();

    c.strokeStyle = '#94a7c014';
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(x, by + 1);
    c.lineTo(x + w, by + 1);
    c.stroke();
  }

  // Capitel gótico esculpido
  const capY = y + h * 0.32;
  const capH = 18;
  const capGrad = c.createLinearGradient(x, capY, x + w, capY);
  capGrad.addColorStop(0, '#151f2e');
  capGrad.addColorStop(0.5, '#222f42');
  capGrad.addColorStop(1, '#111926');
  c.fillStyle = capGrad;
  c.fillRect(x - (isLeft ? 0 : 4), capY, w + 4, capH);

  c.strokeStyle = '#384a60';
  c.lineWidth = 1.2;
  c.strokeRect(x - (isLeft ? 0 : 4), capY, w + 4, capH);

  // Friso ornamental no capitel
  c.strokeStyle = `${colors.primary}45`;
  c.lineWidth = 1.0;
  c.beginPath();
  c.moveTo(x - (isLeft ? 0 : 4), capY + capH * 0.5);
  c.lineTo(x + w + (isLeft ? 4 : 0), capY + capH * 0.5);
  c.stroke();

  // Rim Light (Luz de contorno lateral na face interna)
  const rimGrad = c.createLinearGradient(innerEdgeX + (isLeft ? -16 : 16), 0, innerEdgeX, 0);
  rimGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  rimGrad.addColorStop(0.7, `${colors.primary}0a`);
  rimGrad.addColorStop(1, `${colors.primary}30`);
  c.fillStyle = rimGrad;
  c.fillRect(isLeft ? x + w - 16 : x, y, 16, h);

  // Aresta chanfrada
  c.strokeStyle = `${colors.primary}55`;
  c.lineWidth = 1.0;
  c.beginPath();
  c.moveTo(innerEdgeX, y);
  c.lineTo(innerEdgeX, y + h);
  c.stroke();

  c.restore();
}

function drawBackdropStone(c, width, height, colors, heroKey = 'KNIGHT') {
  const cx = width / 2;

  // 1. Base do Vazio Cósmico Profundo
  const bg = c.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#020307');
  bg.addColorStop(0.35, '#050a16');
  bg.addColorStop(0.70, '#060610');
  bg.addColorStop(1, '#030408');
  c.fillStyle = bg;
  c.fillRect(0, 0, width, height);

  // 2. Nebulosa Cósmica Procedural
  const isPortrait = width < height;
  const nebY = height * (isPortrait ? 0.28 : 0.36);
  glow(c, cx, nebY, width * (isPortrait ? 0.46 : 0.38), height * 0.38, '#101b38', 0.55);
  glow(c, cx - width * 0.04, nebY - height * 0.04, width * 0.28, height * 0.28, '#180d30', 0.40);
  glow(c, cx + width * 0.05, nebY + height * 0.03, width * 0.24, height * 0.24, colors.secondary || colors.primary, 0.16);
  glow(c, cx, nebY, width * 0.20, height * 0.20, colors.primary, 0.12);

  // 3. Campo Estelar e Constelação Ancestral
  drawCosmicStarfield(c, width, height, colors, heroKey);
  drawHeroConstellation(c, width, height, colors, heroKey);

  // 4. Arcos Ogivais Góticos
  for (let i = 2; i >= 0; i--) {
    const halfW = width * (.22 + i * .12);
    const springY = height * (.32 + i * .05);
    c.beginPath();
    c.moveTo(cx - halfW, height * .78);
    c.lineTo(cx - halfW, springY);
    c.bezierCurveTo(cx - halfW, springY * .55, cx - halfW * .20, height * .08, cx, height * .05);
    c.bezierCurveTo(cx + halfW * .20, height * .08, cx + halfW, springY * .55, cx + halfW, springY);
    c.lineTo(cx + halfW, height * .78);

    const arch = c.createLinearGradient(0, height * .05, 0, height * .80);
    arch.addColorStop(0, '#2c3c5000');
    arch.addColorStop(.25, '#2c3c50');
    arch.addColorStop(.65, '#192638');
    arch.addColorStop(1, '#19263800');
    c.strokeStyle = arch;
    c.globalAlpha = .38 - i * .08;
    c.lineWidth = 7 - i * 2;
    c.stroke();

    c.strokeStyle = '#8fa3be';
    c.globalAlpha = .14 - i * .035;
    c.lineWidth = 1;
    c.stroke();
    c.globalAlpha = 1;
  }

  // 5. Pilares Góticos de Basalto nas Laterais
  const pillarW = isPortrait ? Math.min(28, width * 0.075) : Math.max(44, width * 0.125);
  drawGothicPillar(c, 0, 0, pillarW, height * 0.85, true, colors);
  drawGothicPillar(c, width - pillarW, 0, pillarW, height * 0.85, false, colors);

  // 6. Halos de Profundidade & Integração
  const haloY = height * (isPortrait ? 0.36 : 0.43);
  glow(c, cx, haloY, width * 0.34, height * 0.36, '#8b9fb8', .09);
  glow(c, cx, haloY, width * 0.29, height * 0.32, colors.primary, .12);
  glow(c, cx, height * .18, width * (isPortrait ? 0.20 : 0.13), height * 0.42, colors.primary, .045);

  // Bordas suaves fundindo com o fundo escuro global
  const edge = c.createLinearGradient(0, 0, width, 0);
  edge.addColorStop(0, '#040508');
  edge.addColorStop(.08, '#04050899');
  edge.addColorStop(.18, '#04050800');
  edge.addColorStop(.82, '#04050800');
  edge.addColorStop(.92, '#04050899');
  edge.addColorStop(1, '#040508');
  c.fillStyle = edge;
  c.fillRect(0, 0, width, height);
}

export function drawDesktopStageBackground(c, width, height, colors, time, dpr, heroKey = 'KNIGHT', offsetX = 0, offsetY = 0, atmosphericFlash = 0) {
  const overscan = 16;
  const cacheW = Math.ceil(width + overscan * 2);
  const cacheH = Math.ceil(height + overscan * 2);
  const key = `${cacheW}:${cacheH}:${dpr}:${colors.primary}:${heroKey}`;
  backdropCache = cachedLayer(backdropCache, key, cacheW, cacheH, dpr,
    ctx => drawBackdropStone(ctx, cacheW, cacheH, colors, heroKey));
  c.drawImage(backdropCache.canvas, offsetX - overscan, offsetY - overscan, cacheW, cacheH);

  // Iluminação Atmosférica de Fundo: Flash atenuado da cor do novo elemento
  if (atmosphericFlash > 0.01) {
    c.save();
    c.globalAlpha = Math.min(0.65, atmosphericFlash);
    const flashGrad = c.createRadialGradient(width * 0.5, height * 0.38, 10, width * 0.5, height * 0.44, Math.max(width, height) * 0.75);
    flashGrad.addColorStop(0, `${colors.primary}55`);
    flashGrad.addColorStop(0.45, `${colors.secondary || colors.primary}25`);
    flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    c.fillStyle = flashGrad;
    c.fillRect(0, 0, width, height);
    c.restore();
  }

  // Respiração de luz em ciclo lento com parallax sutil
  const cx = width * .5 + offsetX * 0.3;
  const cy = height * .39 + offsetY * 0.3;
  glow(c, cx, cy, width * .38, height * .34,
    colors.primary, .045 + Math.sin(time * .28) * .012);
  for (let i = 0; i < 14; i++) {
    const phase = i * 2.39996;
    const progress = (i / 14 + time * (.008 + (i % 3) * .0015)) % 1;
    const x = width * (.12 + ((i * .618034) % 1) * .76) + Math.sin(time * .19 + phase) * 12 + offsetX * 0.4;
    const y = height * (.84 - progress * .7) + offsetY * 0.4;
    const alpha = Math.sin(progress * Math.PI) * (.13 + (i % 4) * .04);
    glow(c, x, y, 4, 4, colors.primary, alpha * .35);
    c.globalAlpha = alpha;
    c.fillStyle = i % 3 === 0 ? '#cbd5df' : colors.primary;
    c.beginPath();
    c.arc(x, y, .7 + (i % 3) * .25, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
}


/**
 * Camada 2: A Grande Roseta Rúnica & Astrolábio Vertical
 * Renderizada no plano intermediário logo atrás do herói.
 * Emoldura a silhueta com halo volumétrico, anel externo de glifos rúnicos com rotação horária,
 * octagrama gótico contra-rotativo e feixes radiantes.
 */
let rosetteLayersCache = {
  key: '',
  canvas1: null,
  canvas2: null,
  canvas3: null,
  size: 0,
  half: 0
};

function getRosetteLayers(radius, prim) {
  const intR = Math.round(radius);
  const key = `${intR}:${prim}`;
  if (rosetteLayersCache.key === key && rosetteLayersCache.canvas1) {
    return rosetteLayersCache;
  }

  const pad = 16;
  const size = Math.ceil((intR + pad) * 2);
  const half = size / 2;

  const c1 = (rosetteLayersCache.canvas1 && rosetteLayersCache.canvas1.width === size)
    ? rosetteLayersCache.canvas1
    : (typeof document !== 'undefined' ? document.createElement('canvas') : null);
  const c2 = (rosetteLayersCache.canvas2 && rosetteLayersCache.canvas2.width === size)
    ? rosetteLayersCache.canvas2
    : (typeof document !== 'undefined' ? document.createElement('canvas') : null);
  const c3 = (rosetteLayersCache.canvas3 && rosetteLayersCache.canvas3.width === size)
    ? rosetteLayersCache.canvas3
    : (typeof document !== 'undefined' ? document.createElement('canvas') : null);

  if (!c1 || !c2 || !c3) return null;

  c1.width = size;
  c1.height = size;
  c2.width = size;
  c2.height = size;
  c3.width = size;
  c3.height = size;

  const ctx1 = c1.getContext('2d');
  const ctx2 = c2.getContext('2d');
  const ctx3 = c3.getContext('2d');

  ctx1.clearRect(0, 0, size, size);
  ctx2.clearRect(0, 0, size, size);
  ctx3.clearRect(0, 0, size, size);

  // 1. Anel Externo com Glifos Rúnicos
  ctx1.save();
  ctx1.translate(half, half);

  ctx1.strokeStyle = `${prim}55`;
  ctx1.lineWidth = 1.6;
  ctx1.beginPath();
  ctx1.arc(0, 0, intR, 0, Math.PI * 2);
  ctx1.stroke();

  ctx1.strokeStyle = `${prim}30`;
  ctx1.lineWidth = 1.0;
  ctx1.beginPath();
  ctx1.arc(0, 0, intR * 0.92, 0, Math.PI * 2);
  ctx1.stroke();

  // 16 divisões radiais / ranhuras no anel externo
  ctx1.strokeStyle = `${prim}40`;
  ctx1.lineWidth = 1.0;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    ctx1.beginPath();
    ctx1.moveTo(cosA * intR * 0.92, sinA * intR * 0.92);
    ctx1.lineTo(cosA * intR, sinA * intR);
    ctx1.stroke();
  }

  // 8 Glifos Rúnicos Geométricos entre os anéis
  const runeR = intR * 0.96;
  const runeSize = Math.max(3, intR * 0.035);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 16;
    const rx = Math.cos(a) * runeR;
    const ry = Math.sin(a) * runeR;
    ctx1.save();
    ctx1.translate(rx, ry);
    ctx1.rotate(a + Math.PI / 2);
    ctx1.strokeStyle = `${prim}75`;
    ctx1.lineWidth = 1.0;
    ctx1.beginPath();
    if (i % 2 === 0) {
      // Losango rúnico com espigão
      ctx1.moveTo(0, -runeSize);
      ctx1.lineTo(runeSize * 0.6, 0);
      ctx1.lineTo(0, runeSize);
      ctx1.lineTo(-runeSize * 0.6, 0);
      ctx1.closePath();
      ctx1.moveTo(0, -runeSize * 1.3);
      ctx1.lineTo(0, runeSize * 1.3);
    } else {
      // Tridente / Fenda angular
      ctx1.moveTo(-runeSize * 0.7, -runeSize * 0.7);
      ctx1.lineTo(0, runeSize * 0.8);
      ctx1.lineTo(runeSize * 0.7, -runeSize * 0.7);
      ctx1.moveTo(0, -runeSize * 0.9);
      ctx1.lineTo(0, runeSize * 0.8);
    }
    ctx1.stroke();
    ctx1.restore();
  }
  ctx1.restore();

  // 2. Anel Médio: O Octagrama Gótico Entrelaçado
  ctx2.save();
  ctx2.translate(half, half);

  const starR_outer = intR * 0.82;
  const starR_inner = intR * 0.52;

  // Duas estrelas de 4 pontas entrelaçadas formando o octagrama (8 pontas)
  ctx2.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx2.lineWidth = 1.3;
  for (let sq = 0; sq < 2; sq++) {
    const sqOffset = (sq * Math.PI) / 4;
    ctx2.beginPath();
    for (let p = 0; p < 4; p++) {
      const a = (p / 4) * Math.PI * 2 + sqOffset;
      const x = Math.cos(a) * starR_outer;
      const y = Math.sin(a) * starR_outer;
      if (p === 0) ctx2.moveTo(x, y);
      else ctx2.lineTo(x, y);
    }
    ctx2.closePath();
    ctx2.stroke();
  }

  // Linhas de ressonância estelar interligando pontas ao centro
  ctx2.strokeStyle = `${prim}25`;
  ctx2.lineWidth = 0.9;
  for (let p = 0; p < 8; p++) {
    const a = (p / 8) * Math.PI * 2;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    ctx2.beginPath();
    ctx2.moveTo(cosA * starR_inner, sinA * starR_inner);
    ctx2.lineTo(cosA * starR_outer, sinA * starR_outer);
    ctx2.stroke();

    // Nós estelares brilhantes nas 8 pontas do octagrama
    ctx2.fillStyle = `${prim}60`;
    ctx2.beginPath();
    ctx2.arc(cosA * starR_outer, sinA * starR_outer, 2.8, 0, Math.PI * 2);
    ctx2.fill();

    ctx2.fillStyle = '#ffffff';
    ctx2.beginPath();
    ctx2.arc(cosA * starR_outer, sinA * starR_outer, 1.1, 0, Math.PI * 2);
    ctx2.fill();
  }

  // Arcos cuspidos góticos entre as pontas da estrela
  ctx2.strokeStyle = `${prim}35`;
  ctx2.lineWidth = 1.0;
  for (let p = 0; p < 8; p++) {
    const a1 = (p / 8) * Math.PI * 2;
    const a2 = ((p + 1) / 8) * Math.PI * 2;
    const midA = (a1 + a2) / 2;
    const midR = starR_inner * 1.18;
    ctx2.beginPath();
    ctx2.moveTo(Math.cos(a1) * starR_inner, Math.sin(a1) * starR_inner);
    ctx2.quadraticCurveTo(
      Math.cos(midA) * midR,
      Math.sin(midA) * midR,
      Math.cos(a2) * starR_inner,
      Math.sin(a2) * starR_inner
    );
    ctx2.stroke();
  }
  ctx2.restore();

  // 3. Anel Interno: O Círculo Sagrado do Elemento
  ctx3.save();
  ctx3.translate(half, half);

  ctx3.strokeStyle = `${prim}45`;
  ctx3.lineWidth = 1.2;
  ctx3.beginPath();
  ctx3.arc(0, 0, intR * 0.44, 0, Math.PI * 2);
  ctx3.stroke();

  // Micro-raios solares / dentes de engrenagem celestial
  const innerR = intR * 0.44;
  const rayLen = intR * 0.08;
  ctx3.strokeStyle = `${prim}50`;
  ctx3.lineWidth = 1.0;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    ctx3.beginPath();
    ctx3.moveTo(cosA * (innerR - rayLen), sinA * (innerR - rayLen));
    ctx3.lineTo(cosA * innerR, sinA * innerR);
    ctx3.stroke();
  }

  // Círculo mais interno
  ctx3.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx3.lineWidth = 0.8;
  ctx3.beginPath();
  ctx3.arc(0, 0, intR * 0.28, 0, Math.PI * 2);
  ctx3.stroke();
  ctx3.restore();

  rosetteLayersCache = {
    key,
    canvas1: c1,
    canvas2: c2,
    canvas3: c3,
    size,
    half
  };

  return rosetteLayersCache;
}

export function drawArcaneRosette(c, cx, cy, radius, colors, time, heroKey = 'KNIGHT', recoilAngle = 0) {
  if (radius <= 10) return;
  c.save();
  c.translate(cx, cy);

  const prim = colors.primary || '#00f5d4';
  const pulse = 0.88 + 0.12 * Math.sin(time * 1.8);

  // 1. Halo Volumétrico Central / Rim Light de Silhueta
  const haloGrad = c.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius * 1.15);
  haloGrad.addColorStop(0, `${prim}18`);
  haloGrad.addColorStop(0.45, `${prim}0e`);
  haloGrad.addColorStop(0.75, `${prim}06`);
  haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  c.fillStyle = haloGrad;
  c.beginPath();
  c.arc(0, 0, radius * 1.15, 0, Math.PI * 2);
  c.fill();

  const layers = getRosetteLayers(radius, prim);
  if (layers) {
    const { canvas1, canvas2, canvas3, half } = layers;

    // 2. Anel Externo com Glifos Rúnicos (Rotação Horária + Recuo Inercial)
    const rot1 = time * 0.035 + recoilAngle;
    c.save();
    c.rotate(rot1);
    c.drawImage(canvas1, -half, -half);
    c.restore();

    // 3. Anel Médio: O Octagrama Gótico Entrelaçado (Contra-Rotação Anti-Horária + Recuo)
    const rot2 = -time * 0.022 - recoilAngle * 1.5;
    c.save();
    c.rotate(rot2);
    c.globalAlpha = pulse;
    c.drawImage(canvas2, -half, -half);
    c.restore();

    // 4. Anel Interno: O Círculo Sagrado do Elemento
    const rot3 = time * 0.015 + recoilAngle * 0.8;
    c.save();
    c.rotate(rot3);
    c.globalAlpha = pulse;
    c.drawImage(canvas3, -half, -half);
    c.restore();
  }

  c.restore();
}

function frontFace(c, x, y, rx, ry, depth) {
  c.beginPath();
  c.ellipse(x, y + depth, rx, ry, 0, 0, Math.PI);
  c.ellipse(x, y, rx, ry, 0, Math.PI, 0, true);
  c.closePath();
}

function drawRune(c, x, y, size, variant) {
  c.beginPath();
  c.moveTo(x, y - size);
  c.lineTo(x - size * .6, y);
  c.lineTo(x, y + size);
  c.lineTo(x + size * .6, y);
  c.closePath();
  if (variant % 2 === 0) {
    c.moveTo(x, y - size * 1.4);
    c.lineTo(x, y + size * 1.4);
  } else {
    c.moveTo(x - size, y);
    c.lineTo(x + size, y);
  }
  c.stroke();
}

function drawStoneStair(c, x, y, rx, ry, depth, tier, colors) {
  // Face vertical: luz central, laterais frias e sombra sob a borda do degrau.
  frontFace(c, x, y, rx, ry, depth);
  const face = c.createLinearGradient(x - rx, 0, x + rx, 0);
  face.addColorStop(0, '#060910');
  face.addColorStop(.35, '#111925');
  face.addColorStop(.65, '#0c131e');
  face.addColorStop(1, '#05070d');
  c.fillStyle = face;
  c.fill();
  c.save();
  c.clip();
  glow(c, x - rx * .12, y + ry, rx * .8, depth * 2, colors.primary, .10 / (1 + tier * .18));

  const joints = 18;
  for (let j = 1; j < joints; j++) {
    const a = Math.PI * ((j + (tier % 2) * .5) / joints);
    const px = x + Math.cos(a) * rx;
    const py = y + Math.sin(a) * ry;
    c.strokeStyle = '#02040ae0';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(px, py + depth);
    c.stroke();
    c.strokeStyle = '#98abc21b';
    c.lineWidth = .7;
    c.beginPath();
    c.moveTo(px + 2, py + 2);
    c.lineTo(px + 2, py + depth - 2);
    c.stroke();

    if (tier === 0 && j % 3 === 1 && Math.sin(a) > .45) {
      const runeX = x + Math.cos(a + .055) * rx;
      const runeY = y + Math.sin(a + .055) * ry + depth * .53;
      c.strokeStyle = `${colors.primary}52`;
      c.lineWidth = .8;
      drawRune(c, runeX, runeY, Math.min(3.5, depth * .23), j + tier);
    }
  }
  c.restore();

  // Laje superior de basalto, iluminada a partir do selo de invocação.
  ellipse(c, x, y, rx, ry);
  const top = c.createLinearGradient(x - rx * .6, y - ry, x + rx * .5, y + ry);
  top.addColorStop(0, '#202b39');
  top.addColorStop(.48, '#1d2835');
  top.addColorStop(1, '#121b27');
  c.fillStyle = top;
  c.fill();
  c.save();
  c.clip();
  glow(c, x, y - ry * .2, rx * .95, ry * 1.8, colors.primary, .09 / (1 + tier * .2));

  // Assentamento radial, veios e lascas estáveis (sem ruído aleatório por frame).
  for (let j = 0; j < 28; j++) {
    const a = (j / 28) * Math.PI * 2 + (tier % 2) * .08;
    c.strokeStyle = '#02050b85';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * rx * .73, y + Math.sin(a) * ry * .73);
    c.lineTo(x + Math.cos(a + .005) * rx, y + Math.sin(a + .005) * ry);
    c.stroke();
    const seed = Math.sin(j * 73.13 + tier * 17.7);
    const px = x + Math.cos(a + .05) * rx * .94;
    const py = y + Math.sin(a + .05) * ry * .94;
    c.strokeStyle = seed > 0 ? '#8b9fb822' : '#02050b80';
    c.lineWidth = .65;
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(px + 6 + seed * 5, py + 1.5);
    c.lineTo(px + 10 + seed * 4, py + 1);
    c.stroke();
  }
  c.restore();

  // Chanfro duplo: reflexo frio na pedra e incrustação elemental fina.
  const rim = c.createLinearGradient(x - rx, y, x + rx, y);
  rim.addColorStop(0, '#74869d12');
  rim.addColorStop(.35, '#b8c7d352');
  rim.addColorStop(.7, '#697c9332');
  rim.addColorStop(1, '#45566d08');
  c.strokeStyle = rim;
  c.lineWidth = 1.5;
  ellipse(c, x, y, rx, ry);
  c.stroke();
  c.strokeStyle = `${colors.primary}${tier === 0 ? '78' : '12'}`;
  c.lineWidth = tier === 0 ? 1.5 : .8;
  ellipse(c, x, y, rx * .976, ry * .976);
  c.stroke();
  c.strokeStyle = '#020309bb';
  c.lineWidth = 2.5;
  c.beginPath();
  c.ellipse(x, y + depth, rx, ry, 0, .02, Math.PI - .02);
  c.stroke();
}

export function drawDesktopDais(c, width, height, x, y, rx, ry, colors, dpr, baseX = null, baseY = null) {
  const anchorX = Math.round(baseX ?? width * 0.5);
  const anchorY = Math.round(baseY ?? y);
  const intRx = Math.round(rx);
  const intRy = Math.round(ry);
  const key = `${width}:${height}:${dpr}:${anchorX}:${anchorY}:${intRx}:${intRy}:${colors.primary}`;
  daisCache = cachedLayer(daisCache, key, width, height, dpr, ctx => {
    const remaining = Math.max(40, height - anchorY - intRy + 24);
    const baseRx = Math.max(intRx * 2.5, width * .68);
    // Patamar + três degraus. Pisos e intervalos crescem em direção à câmera.
    const progress = [0, .20, .52, 1];
    for (let i = 3; i >= 0; i--) {
      const p = progress[i];
      const stepRx = intRx + (baseRx - intRx) * p;
      const stepRy = intRy + remaining * .42 * p;
      const stepY = anchorY + remaining * .58 * p;
      const depth = Math.min(26, remaining * .085) * (1 + i * .16);
      drawStoneStair(ctx, anchorX, stepY, stepRx, stepRy, depth, i, colors);
      // Sombra de contato sobre o piso imediatamente abaixo de cada borda.
      ctx.save();
      ctx.strokeStyle = '#01030970';
      ctx.lineWidth = Math.max(3, depth * .35);
      ctx.beginPath();
      ctx.ellipse(anchorX, stepY + depth + ctx.lineWidth * .4, stepRx, stepRy, 0, 0, Math.PI);
      ctx.stroke();
      ctx.restore();
    }
    // Sombra periférica, mantendo a leitura do centro dos degraus.
    const shade = ctx.createLinearGradient(0, 0, width, 0);
    shade.addColorStop(0, '#020409aa');
    shade.addColorStop(.23, '#02040900');
    shade.addColorStop(.77, '#02040900');
    shade.addColorStop(1, '#020409aa');
    ctx.fillStyle = shade;
    ctx.fillRect(0, anchorY - intRy, width, height - anchorY + intRy);
  });
  const dx = x - anchorX;
  const dy = y - anchorY;
  c.drawImage(daisCache.canvas, dx, dy, width, height);
}

export function drawDesktopGroundMist(c, width, height, footY, colors, time, mistDisplacement = 0) {
  const floorHeight = Math.max(24, height - footY);
  // Bancos descontínuos sobre os pisos: mais densos na frente, livres junto às botas.
  for (let band = 0; band < 3; band++) {
    for (let i = 0; i < 4; i++) {
      const phase = i * 2.4 + band * 1.8;
      let x = width * (.08 + i * .28) + Math.sin(time * .10 + phase) * width * .08;
      const y = footY + floorHeight * (.32 + band * .27)
        + Math.cos(time * .13 + phase) * floorHeight * .035;
      const mistHeight = Math.max(9, Math.min(44, floorHeight * (.065 + band * .018)));
      let alpha = (.12 + band * .045) * (.85 + Math.sin(time * .16 + phase) * .15);

      // Reação Dinâmica: Expulsão no impacto (mistDisplacement > 0) e Sucção no vácuo (mistDisplacement < 0)
      if (mistDisplacement > 0) {
        const pushDir = x >= width * 0.5 ? 1 : -1;
        x += pushDir * mistDisplacement * width * 0.44;
        alpha *= Math.max(0.05, 1 - mistDisplacement * 0.85);
      } else if (mistDisplacement < 0) {
        const pullDir = x >= width * 0.5 ? -1 : 1;
        x += pullDir * Math.abs(mistDisplacement) * width * 0.22;
        alpha *= (1 + Math.abs(mistDisplacement) * 0.4);
      }

      glow(c, x, y, width * (.22 + i % 2 * .06), mistHeight, '#a0b3c6', alpha);
      glow(c, x + width * .06, y - mistHeight * .35, width * .17,
        mistHeight * .65, colors.primary, alpha * .22);
    }
  }
}


/**
 * Camada 4: Runas Vivas no Piso do Altar (Breathing Floor Runes)
 * Entalhes e circuitos arcanos gravados no basalto do pedestal.
 * Pulso respiratório contínuo (~3.2s), octagrama inscrito com canais de éter fluindo,
 * runas em cascata nos 3 degraus de cantaria e reação cinética com anel de choque (surge).
 */
export function drawDesktopFloorRunes(c, width, height, x, y, rx, ry, colors, time, surgeProgress = 0, heroKey = 'KNIGHT', runeOverload = 0) {
  const prim = colors.primary || '#00f5d4';
  const sec = colors.secondary || colors.primary;

  // 1. Ciclo de Respiração Senoidal Contínuo (~3.2s por respiração profunda)
  const breath = 0.44 + 0.38 * Math.sin(time * 1.96);

  // 2. Parâmetros Geométricos dos Degraus
  const remaining = Math.max(40, height - y - ry + 24);
  const baseRx = Math.max(rx * 2.5, width * .68);
  const progress = [0, .20, .52, 1];

  // Efeito de Sobrecarga Rúnica das Ley-Lines (Cascata a partir do impacto)
  const overloadIntensity = runeOverload > 0 ? Math.sin(runeOverload * Math.PI) : 0;

  // 3. Onda de Choque de Éter Reativa (Surge Wave ou Sobrecarga)
  let surgeDist = 0;
  let surgeAlpha = 0;
  const effectiveSurge = Math.max(surgeProgress, runeOverload);
  if (effectiveSurge > 0 && effectiveSurge <= 1) {
    surgeDist = effectiveSurge * baseRx * 1.15;
    surgeAlpha = Math.sin(effectiveSurge * Math.PI);

    c.save();
    const waveAspect = (ry / rx) * (1 + (surgeDist / baseRx) * 0.42);
    const waveY = y + (surgeDist / baseRx) * remaining * 0.55;

    // Halo externo difuso da onda
    c.strokeStyle = prim;
    c.lineWidth = 4.5 * surgeAlpha;
    c.globalAlpha = surgeAlpha * 0.65;
    c.beginPath();
    c.ellipse(x, waveY, surgeDist, surgeDist * waveAspect, 0, 0, Math.PI * 2);
    c.stroke();

    // Núcleo branco incandescente de alta energia
    c.strokeStyle = '#ffffff';
    c.lineWidth = 2.4 * surgeAlpha;
    c.globalAlpha = surgeAlpha * 0.95;
    c.beginPath();
    c.ellipse(x, waveY, surgeDist, surgeDist * waveAspect, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }

  // 4. Halo Volumétrico e Reflexo de Contato no Solo sob as botas
  const contactGlowAlpha = 0.06 + breath * 0.08 + (surgeAlpha > 0 ? surgeAlpha * 0.20 : 0) + overloadIntensity * 0.35;
  glow(c, x, y - ry * 0.08, rx * 0.75, ry * 1.4, overloadIntensity > 0.3 ? '#ffffff' : prim, contactGlowAlpha);

  // Cascata 1: Clarão branco incandescente no anel central (Tier 0)
  if (runeOverload > 0 && runeOverload < 0.45) {
    c.save();
    glow(c, x, y, rx * 0.9, ry * 1.6, '#ffffff', overloadIntensity * 0.85);
    glow(c, x, y, rx * 1.1, ry * 1.8, prim, overloadIntensity * 0.55);
    c.restore();
  }

  // 5. Circuitos Arcanos na Laje Superior (Tier 0)
  c.save();

  // 5.1 Anéis Concêntricos Duplos Entalhados
  const outerR = rx * 0.88;
  const innerR = rx * 0.72;
  const aspect = ry / rx;

  // Anel Externo
  c.strokeStyle = (runeOverload > 0 && runeOverload < 0.5) ? '#ffffff' : prim;
  c.lineWidth = (runeOverload > 0 && runeOverload < 0.5) ? 2.4 : 1.4;
  c.globalAlpha = 0.20 + breath * 0.36 + (surgeAlpha > 0 ? surgeAlpha * 0.35 : 0) + overloadIntensity * 0.45;
  c.beginPath();
  c.ellipse(x, y, outerR, outerR * aspect, 0, 0, Math.PI * 2);
  c.stroke();


  // Anel Interno
  c.strokeStyle = sec;
  c.lineWidth = 1.0;
  c.globalAlpha = 0.16 + breath * 0.26;
  c.beginPath();
  c.ellipse(x, y, innerR, innerR * aspect, 0, 0, Math.PI * 2);
  c.stroke();

  // 16 Ranhuras Radiais no Anel Externo
  const rot1 = time * 0.012;
  c.strokeStyle = prim;
  c.lineWidth = 1.0;
  c.globalAlpha = 0.14 + breath * 0.28;
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 + rot1;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    c.beginPath();
    c.moveTo(x + cosA * innerR, y + sinA * innerR * aspect);
    c.lineTo(x + cosA * outerR, y + sinA * outerR * aspect);
    c.stroke();
  }

  // 5.2 Oito Glifos Rúnicos Cardeais e Colaterais no Patamar
  const runeOrbit = rx * 0.80;
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + rot1 + Math.PI / 16;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const gx = x + cosA * runeOrbit;
    const gy = y + sinA * runeOrbit * aspect;

    // Detecção de impacto da onda de choque
    const gDist = Math.hypot(gx - x, (gy - y) / aspect);
    const gSurge = surgeDist > 0 ? Math.max(0, 1 - Math.abs(gDist - surgeDist) / 30) : 0;
    const gIntensity = Math.min(1, 0.25 + breath * 0.50 + gSurge * 0.85);

    c.save();
    c.strokeStyle = gSurge > 0.3 ? '#ffffff' : prim;
    c.lineWidth = gSurge > 0.3 ? 1.5 : 1.0;
    c.globalAlpha = gIntensity;

    const rSize = Math.max(3.0, rx * 0.038);
    c.beginPath();
    if (k % 2 === 0) {
      // Losango rúnico com espigão
      c.moveTo(gx, gy - rSize * aspect);
      c.lineTo(gx + rSize * 0.6, gy);
      c.lineTo(gx, gy + rSize * aspect);
      c.lineTo(gx - rSize * 0.6, gy);
      c.closePath();
      c.moveTo(gx, gy - rSize * 1.3 * aspect);
      c.lineTo(gx, gy + rSize * 1.3 * aspect);
    } else {
      // Fenda rúnica / tridente angular
      c.moveTo(gx - rSize * 0.6, gy - rSize * 0.6 * aspect);
      c.lineTo(gx, gy + rSize * 0.7 * aspect);
      c.lineTo(gx + rSize * 0.6, gy - rSize * 0.6 * aspect);
      c.moveTo(gx, gy - rSize * 0.9 * aspect);
      c.lineTo(gx, gy + rSize * 0.7 * aspect);
    }
    c.stroke();

    // Ponto de luz no núcleo do glifo
    c.fillStyle = gSurge > 0.3 ? '#ffffff' : prim;
    c.globalAlpha = Math.min(1, gIntensity * 1.2);
    c.beginPath();
    c.arc(gx, gy, 1.4, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  // 5.3 Octagrama Sagrado Inscrito no Solo
  const octR = rx * 0.52;
  const rot2 = -time * 0.008;
  c.lineWidth = 1.0;
  for (let sq = 0; sq < 2; sq++) {
    const sqOffset = rot2 + (sq * Math.PI) / 4;
    c.strokeStyle = sq === 0 ? prim : sec;
    c.globalAlpha = 0.16 + breath * 0.28;
    c.beginPath();
    for (let p = 0; p < 4; p++) {
      const a = (p / 4) * Math.PI * 2 + sqOffset;
      const px = x + Math.cos(a) * octR;
      const py = y + Math.sin(a) * octR * aspect;
      if (p === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    c.stroke();
  }

  // 5.4 Canais de Energia Radiais (Ley-Lines) com fluxo de éter
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const startR = rx * 0.32;
    const endR = rx * 0.94;

    c.strokeStyle = prim;
    c.lineWidth = 0.8;
    c.globalAlpha = 0.12 + breath * 0.22;
    c.beginPath();
    c.moveTo(x + cosA * startR, y + sinA * startR * aspect);
    c.lineTo(x + cosA * endR, y + sinA * endR * aspect);
    c.stroke();

    // Partícula de éter fluindo pelo canal até a borda
    const flow = (time * 0.22 + k * 0.125) % 1;
    const flowR = startR + (endR - startR) * flow;
    const fx = x + cosA * flowR;
    const fy = y + sinA * flowR * aspect;
    const flowAlpha = Math.sin(flow * Math.PI) * (0.35 + breath * 0.40);

    c.fillStyle = '#ffffff';
    c.globalAlpha = flowAlpha;
    c.beginPath();
    c.arc(fx, fy, 1.4, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = prim;
    c.globalAlpha = flowAlpha * 0.6;
    c.beginPath();
    c.arc(fx, fy, 2.8, 0, Math.PI * 2);
    c.fill();
  }

  // 5.5 Círculo Central delimitador com pulso
  c.strokeStyle = `${prim}55`;
  c.lineWidth = 1.1;
  c.globalAlpha = 0.25 + breath * 0.35;
  c.beginPath();
  c.ellipse(x, y, rx * 0.32, ry * 0.32, 0, 0, Math.PI * 2);
  c.stroke();

  c.restore();

  // 6. Entalhes Rúnicos Vivos nos Degraus Frontais (Tiers 1, 2 e 3)
  for (let i = 1; i <= 3; i++) {
    const p = progress[i];
    const stepRx = rx + (baseRx - rx) * p;
    const stepRy = ry + remaining * .42 * p;
    const stepY = y + remaining * .58 * p;
    const depth = Math.min(26, remaining * .085) * (1 + i * .16);

    // 6.1 Arco luminoso da borda frontal do degrau
    const tierDelay = i * 0.72;
    const tierBreath = 0.28 + 0.32 * Math.sin(time * 1.96 - tierDelay);

    c.save();
    c.beginPath();
    c.ellipse(x, stepY, stepRx * 0.985, stepRy * 0.985, 0, Math.PI * 0.18, Math.PI * 0.82);
    c.strokeStyle = prim;
    c.lineWidth = 1.0;
    c.globalAlpha = tierBreath * 0.70;
    c.stroke();
    c.restore();

    // 6.2 Glifos esculpidos na face vertical do degrau
    const runeCounts = [0, 5, 7, 9];
    const numRunes = runeCounts[i];

    for (let r = 0; r < numRunes; r++) {
      const ga = Math.PI * (0.24 + (r / (numRunes - 1)) * 0.52);
      const gx = x + Math.cos(ga) * stepRx;
      const gy = stepY + Math.sin(ga) * stepRy + depth * 0.50;

      // Detecção de impacto da onda de choque
      const stepDist = Math.hypot(gx - x, (gy - y) / (stepRy / stepRx));
      const stepSurge = surgeDist > 0 ? Math.max(0, 1 - Math.abs(stepDist - surgeDist) / 32) : 0;
      const stepAlpha = Math.min(1, tierBreath + stepSurge * 0.92);

      c.save();
      c.strokeStyle = stepSurge > 0.35 ? '#ffffff' : prim;
      c.lineWidth = stepSurge > 0.35 ? 1.5 : 1.0;
      c.globalAlpha = stepAlpha;
      drawRune(c, gx, gy, Math.min(3.8, depth * 0.25), r + i * 3);

      // Ponto de luz no nó do glifo
      c.fillStyle = stepSurge > 0.35 ? '#ffffff' : prim;
      c.globalAlpha = Math.min(1, stepAlpha * 1.15);
      c.beginPath();
      c.arc(gx, gy, 1.2, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }

  c.globalAlpha = 1;
}
