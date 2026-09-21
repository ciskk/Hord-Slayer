import { 
  camera, 
  viewW, 
  viewH,
  cameraViewW, 
  cameraViewH, 
  currentArenaTheme, 
  setCurrentArenaTheme,
  bloodSplats, 
  acidPuddles, 
  frameCount,
  activeBoss
} from '../main.js';
import { player } from '../entities/player.js';
import { renderSurrealAbyssArena, getAbyssArenaState } from './environment/abyssArena.js';
import { renderArenaProps, BIOME_PROP_RENDERERS } from './environment/biomeProps/index.js';

export { renderSurrealAbyssArena, getAbyssArenaState, renderArenaProps, BIOME_PROP_RENDERERS };

// Hash pseudoaleatório determinístico ultra-rápido em inteiros 32-bit (Zero Math.sin, Zero Heap)
export function tileHash(gx, gy) {
  let h = ((gx * 374761393) ^ (gy * 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Hash pseudoaleatório inteiro e determinístico ultra-rápido (Zero Math.sin, Zero Heap)
function fastTileType(c, r) {
  let h = ((c * 73856093) ^ (r * 19349663)) & 0xFFFF;
  return h / 65535;
}

// Curva de interpolação cúbica suave (smoothstep)
function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

// Conversão e Interpolação Cromática (RGB Lerp)
function parseHex(hex) {
  if (!hex) return [0, 0, 0];
  let h = hex.trim();
  if (h.startsWith('#')) h = h.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function lerpColor(c1, c2, t) {
  if (!c1 || !c2) return c1 || c2 || '#000000';
  if (c1.startsWith('rgba') || c2.startsWith('rgba')) {
    return t < 0.5 ? c1 : c2;
  }
  const [r1, g1, b1] = parseHex(c1);
  const [r2, g2, b2] = parseHex(c2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

// Paletas de Cores de Alta Visibilidade (Value Hierarchy calibrada para contraste total de silhuetas)
export const ARENA_PALETTES = {
  IVORY_OSSUARY: {
    name: 'Ossário de Marfim',
    tileA: '#ded8cb',      // Mármore calcário claro
    tileB: '#cfc7b6',      // Marfim antigo desgastado
    pathA: '#e8e3d8',      // Lajes sacras polidas
    pathB: '#ded8cb',      // Lajes alternadas
    detailA: '#bfb7a4',    // Mosaicos e cantarias
    groove: '#8c806f',     // Rejunte / cinza de ossos
    fissure: '#58151f',    // Veios de sangue seco escuro
    crack: '#9c907f',      // Fissuras do mármore
    mistBase: 'rgba(235, 228, 215, 0.025)',
    mistPuff: 'rgba(215, 205, 190, 0.035)',
    emberR: 245, emberG: 235, emberB: 215, // Cinzas sagradas
    accentR: 243, accentG: 156, accentB: 18 // Ouro / chamas
  },
  CRIMSON_SALT: {
    name: 'Deserto de Sal Carmesim',
    tileA: '#f0f4f8',      // Sal branco-giz puro
    tileB: '#e2e8f0',      // Crosta salina cristalina
    pathA: '#f8fafc',      // Cristais de sal puro
    pathB: '#e8ecf1',      // Sal gema
    detailA: '#cbd5e1',    // Sedimento calcário
    groove: '#94a3b8',     // Linhas de ressecamento
    fissure: '#8b0000',    // Fendas de sangue carmesim profundo
    crack: '#64748b',      // Fissuras do sal
    mistBase: 'rgba(240, 245, 250, 0.025)',
    mistPuff: 'rgba(255, 230, 235, 0.035)',
    emberR: 255, emberG: 255, emberB: 255, // Cristais de sal cintilantes
    accentR: 231, accentG: 76, accentB: 60 // Fagulhas carmesins
  },
  ECLIPSE_BASILICA: {
    name: 'Basílica do Eclipse',
    tileA: '#9db0bf',      // Lajes de pedra lunar prateada
    tileB: '#889baa',      // Cantaria gótica fria
    pathA: '#adbcc7',      // Pedra polida sob eclipse
    pathB: '#93a5b4',      // Lajotas alternadas
    detailA: '#728494',    // Rejuntes de ferro e prata
    groove: '#5a6a78',     // Frestas profundas
    fissure: '#34495e',    // Sombras abissais
    crack: '#4a5b6c',      // Fissuras na pedra
    mistBase: 'rgba(130, 160, 190, 0.03)',
    mistPuff: 'rgba(116, 185, 255, 0.035)',
    emberR: 116, emberG: 185, emberB: 255, // Poeira estelar ciano
    accentR: 223, accentG: 230, accentB: 233 // Prata líquida
  },
  VAMPIRE: {
    name: 'Salão Carmesim',
    tileA: '#631828',      // Mármore carmesim nobre
    tileB: '#490e1b',      // Vinho imperial profundo
    pathA: '#7b1e32',      // Lajes de banquete polidas
    pathB: '#561220',      // Lajes alternadas
    detailA: '#b38f4d',    // Veios de ouro imperial barroco
    groove: '#28060e',     // Rejunte de ônix
    fissure: '#a31b34',    // Veios de sangue puro brilhante
    crack: '#3d0a15',      // Fissuras no mármore
    mistBase: 'rgba(80, 15, 30, 0.035)',
    mistPuff: 'rgba(140, 25, 50, 0.04)',
    emberR: 255, emberG: 71, emberB: 87, // Mariposas de sangue / brasas carmesins
    accentR: 241, accentG: 196, accentB: 15 // Ouro de cálices
  },
  MONOLITH: {
    name: 'Caldeira Tectônica',
    tileA: '#4c4642',      // Basalto vulcânico cinza-médio
    tileB: '#3a3430',      // Rocha ígnea porosa
    pathA: '#5a534e',      // Lajes de basalto polido
    pathB: '#443e3a',      // Lajes alternadas
    detailA: '#262220',    // Obsidiana negra
    groove: '#d35400',     // Fendas crepitantes de magma vivo
    fissure: '#f39c12',    // Lava incandescente
    crack: '#e67e22',      // Fissuras sísmicas
    mistBase: 'rgba(55, 28, 12, 0.035)',
    mistPuff: 'rgba(125, 55, 18, 0.04)',
    emberR: 230, emberG: 126, emberB: 34, // Fagulhas de fogo e cinzas
    accentR: 243, accentG: 156, accentB: 18 // Calor solar de magma
  },
  REAPER: {
    name: 'Necrópole Espectral',
    tileA: '#58768a',      // Ardósia congelada azul-cinza
    tileB: '#435d6e',      // Pedra sepulcral gélida
    pathA: '#6b8ca2',      // Lajes de geada polida
    pathB: '#4d697c',      // Lajes alternadas
    detailA: '#2c404d',    // Gelo negro profundo
    groove: '#1d2d38',     // Frestas de permafrost
    fissure: '#00cec9',    // Fissuras de alma ciano fluorescente
    crack: '#81ecec',      // Fissuras de gelo espectral
    mistBase: 'rgba(22, 55, 70, 0.035)',
    mistPuff: 'rgba(0, 206, 201, 0.04)',
    emberR: 0, emberG: 206, emberB: 201, // Fogos-fátuos ciano
    accentR: 223, accentG: 249, accentB: 251 // Geada pura
  },
  ABYSS: {
    name: 'Horizonte do Vazio',
    tileA: '#542c70',      // Obsidiana dimensional ametista
    tileB: '#3c1c50',      // Tecido do espaço-tempo
    pathA: '#68368b',      // Lajes de matéria estelar
    pathB: '#482262',      // Lajes alternadas
    detailA: '#240f32',    // Vácuo cósmico
    groove: '#160622',     // Singularidade gravitacional
    fissure: '#d980fa',    // Fendas de nébula cósmica fluorescente
    crack: '#8e44ad',      // Fissuras dimensionais
    mistBase: 'rgba(50, 18, 75, 0.035)',
    mistPuff: 'rgba(155, 89, 182, 0.04)',
    emberR: 224, emberG: 86, emberB: 253, // Poeira estelar ultravioleta
    accentR: 116, accentG: 185, accentB: 255 // Plasma cósmico estelar
  },
  CEMETERY: {
    name: 'Cemitério Noturno',
    tileA: '#1c2420', tileB: '#121714',
    pathA: '#24302a', pathB: '#161c18',
    detailA: '#0c100e', groove: '#080d09',
    fissure: '#040805', crack: '#060d09',
    mistBase: 'rgba(20, 50, 35, 0.035)', mistPuff: 'rgba(35, 75, 55, 0.03)',
    emberR: 46, emberG: 204, emberB: 113, accentR: 168, accentG: 255, accentB: 219
  }
};

function lerpPalette(p1, p2, t) {
  if (!p1) return p2;
  if (!p2) return p1;
  return {
    name: t < 0.5 ? p1.name : p2.name,
    tileA: lerpColor(p1.tileA, p2.tileA, t),
    tileB: lerpColor(p1.tileB, p2.tileB, t),
    pathA: lerpColor(p1.pathA, p2.pathA, t),
    pathB: lerpColor(p1.pathB, p2.pathB, t),
    detailA: lerpColor(p1.detailA, p2.detailA, t),
    groove: lerpColor(p1.groove, p2.groove, t),
    fissure: lerpColor(p1.fissure, p2.fissure, t),
    crack: lerpColor(p1.crack, p2.crack, t),
    mistBase: t < 0.5 ? p1.mistBase : p2.mistBase,
    mistPuff: t < 0.5 ? p1.mistPuff : p2.mistPuff,
    emberR: Math.round(p1.emberR + (p2.emberR - p1.emberR) * t),
    emberG: Math.round(p1.emberG + (p2.emberG - p1.emberG) * t),
    emberB: Math.round(p1.emberB + (p2.emberB - p1.emberB) * t),
    accentR: Math.round(p1.accentR + (p2.accentR - p1.accentR) * t),
    accentG: Math.round(p1.accentG + (p2.accentG - p1.accentG) * t),
    accentB: Math.round(p1.accentB + (p2.accentB - p1.accentB) * t),
  };
}

// Gerenciamento de Estado da Transição Suave
let previousArenaTheme = 'IVORY_OSSUARY';
let transitionProgress = 1.0;
let transitionDuration = 150; // ~2.5 segundos a 60 FPS

/**
 * Dispara uma transição suave entre temas de arena.
 * @param {string} newTheme Identificador do novo tema (ex: 'IVORY_OSSUARY', 'CRIMSON_SALT')
 * @param {number} duration Duração em frames (~150 = 2.5s)
 */
export function transitionToArenaTheme(newTheme, duration = 150) {
  if (newTheme === currentArenaTheme && transitionProgress >= 1.0) return;
  previousArenaTheme = currentArenaTheme;
  setCurrentArenaTheme(newTheme);
  transitionProgress = 0.0;
  transitionDuration = Math.max(30, duration);
}

/**
 * Retorna o tema de arena correspondente a uma onda específica (1 arena a cada 3 ondas).
 * @param {number} waveIndex Índice da onda (1, 2, 3...)
 * @returns {string} Tema da arena
 */
export function getWaveArenaTheme(waveIndex) {
  const cycle = Math.floor((Math.max(1, waveIndex) - 1) / 3) % 3;
  if (cycle === 0) return 'IVORY_OSSUARY';
  if (cycle === 1) return 'CRIMSON_SALT';
  return 'ECLIPSE_BASILICA';
}

/**
 * Reseta o estado do ambiente para o início de uma nova partida.
 */
export function resetEnvironment() {
  previousArenaTheme = 'IVORY_OSSUARY';
  transitionProgress = 1.0;
  transitionDuration = 150;
  setCurrentArenaTheme('IVORY_OSSUARY');
}

export const ambientEmbers = [];
for (let i = 0; i < 24; i++) {
  ambientEmbers.push({
    x: Math.random() * 2000 - 1000,
    y: Math.random() * 2000 - 1000,
    r: Math.random() * 1.8 + 0.6,
    speed: Math.random() * 0.45 + 0.2,
    alpha: Math.random() * 0.45 + 0.25
  });
}



/**
 * Renderiza o solo regular em grade infinita para ondas comuns e Chefes 1-3.
 * Unifica a renderização de solo e props de bioma em um único loop O(N) por tile visível.
 */
function renderStandardTileGround(ctx, startCol, endCol, startRow, endRow, tileSize, pal, propTheme = null) {
  const drawPropFn = (propTheme && propTheme !== 'ABYSS') ? BIOME_PROP_RENDERERS[propTheme] : null;

  for (let c = startCol; c <= endCol; c++) {
    for (let r = startRow; r <= endRow; r++) {
      const tileX = c * tileSize;
      const tileY = r * tileSize;
      const h = tileHash(c, r);
      const macroZone = fastTileType(c, r);

      if (macroZone > 0.62) {
        // Trilhas de lajotas polidas
        ctx.fillStyle = (c + r) % 2 === 0 ? pal.pathA : pal.pathB;
        ctx.fillRect(tileX, tileY, tileSize, tileSize);

        // Detalhes de calçamento encaixado
        ctx.fillStyle = pal.detailA;
        ctx.fillRect(tileX + 10, tileY + 12, 32, 22);
        ctx.fillRect(tileX + 50, tileY + 24, 38, 26);
        ctx.fillRect(tileX + 18, tileY + 54, 44, 28);
      } else if (macroZone < 0.36) {
        // Sedimentos / crostas e fendas
        ctx.fillStyle = h > 0.5 ? pal.tileB : pal.groove;
        ctx.fillRect(tileX, tileY, tileSize, tileSize);

        // Manchas ou poças de resíduos / sangue antigo
        if (h < 0.28) {
          ctx.fillStyle = pal.fissure;
          ctx.beginPath();
          ctx.ellipse(tileX + 48, tileY + 48, 28, 14, h * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Solo base límpido de alto contraste
        ctx.fillStyle = h > 0.5 ? pal.tileA : pal.tileB;
        ctx.fillRect(tileX, tileY, tileSize, tileSize);
      }

      // Fissuras no solo
      if (h > 0.86) {
        ctx.strokeStyle = pal.fissure;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(tileX + 10, tileY + 15);
        ctx.lineTo(tileX + 45, tileY + 48);
        ctx.lineTo(tileX + 80, tileY + 52);
        ctx.stroke();
      }

      // Props do bioma unificados no mesmo loop (Zero varredura dupla de tiles)
      if (drawPropFn) {
        const h2 = tileHash(c + 71, r + 137);
        const h3 = tileHash(c - 93, r + 419);
        drawPropFn(ctx, c, r, tileX, tileY, h, h2, h3);
      }
    }
  }
}

// Canvas offscreen cacheado para vinheta (evita recompilação contínua de RadialGradient na GPU)
let cachedVignetteCanvas = null;
let cachedVignetteW = 0;
let cachedVignetteH = 0;

function updateVignetteCache(w, h) {
  const roundedW = Math.max(1, Math.floor(w));
  const roundedH = Math.max(1, Math.floor(h));
  if (cachedVignetteCanvas && cachedVignetteW === roundedW && cachedVignetteH === roundedH) return;

  cachedVignetteW = roundedW;
  cachedVignetteH = roundedH;
  if (!cachedVignetteCanvas) {
    cachedVignetteCanvas = document.createElement('canvas');
  }
  cachedVignetteCanvas.width = roundedW;
  cachedVignetteCanvas.height = roundedH;
  const vCtx = cachedVignetteCanvas.getContext('2d');
  if (!vCtx) return;

  const halfW = roundedW / 2;
  const halfH = roundedH / 2;
  const vignette = vCtx.createRadialGradient(
    halfW, 
    halfH, 
    Math.min(roundedW, roundedH) * 0.65,
    halfW, 
    halfH, 
    Math.max(roundedW, roundedH) * 0.95
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(10, 15, 20, 0.16)');
  vCtx.fillStyle = vignette;
  vCtx.fillRect(0, 0, roundedW, roundedH);
}

export function renderEnvironment(ctx) {
  const tileSize = 96;
  const startCol = Math.floor(camera.x / tileSize) - 1;
  const endCol = Math.floor((camera.x + cameraViewW) / tileSize) + 1;
  const startRow = Math.floor(camera.y / tileSize) - 1;
  const endRow = Math.floor((camera.y + cameraViewH) / tileSize) + 1;

  // Atualização da transição suave entre temas
  if (transitionProgress < 1.0) {
    transitionProgress = Math.min(1.0, transitionProgress + (1 / transitionDuration));
  }
  const t = smoothstep(transitionProgress);

  const prevPal = ARENA_PALETTES[previousArenaTheme] || ARENA_PALETTES.IVORY_OSSUARY;
  const currPal = ARENA_PALETTES[currentArenaTheme] || ARENA_PALETTES.IVORY_OSSUARY;
  const pal = transitionProgress >= 1.0 ? currPal : lerpPalette(prevPal, currPal, t);

  // 1 & 2. RENDERIZAÇÃO DO SOLO E PROPS (Com suporte ao Altar Surreal do Chefe Final)
  const isAbyssCurrent = currentArenaTheme === 'ABYSS';
  const isAbyssPrev = previousArenaTheme === 'ABYSS';

  if (isAbyssCurrent && transitionProgress >= 1.0) {
    // Modo 100% no Altar Surreal do Fim dos Tempos
    renderSurrealAbyssArena(ctx);
  } else if (isAbyssCurrent && transitionProgress < 1.0) {
    // Transicionando para o Abismo: solo anterior desvanece, altar surge
    renderStandardTileGround(ctx, startCol, endCol, startRow, endRow, tileSize, prevPal);
    ctx.save();
    ctx.globalAlpha = 1.0 - t;
    renderArenaProps(ctx, previousArenaTheme, startCol, endCol, startRow, endRow, tileSize);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = t;
    renderSurrealAbyssArena(ctx);
    ctx.restore();
  } else if (isAbyssPrev && transitionProgress < 1.0) {
    // Transicionando para fora do Abismo: altar desvanece, novo solo surge
    renderSurrealAbyssArena(ctx);
    ctx.save();
    ctx.globalAlpha = t;
    renderStandardTileGround(ctx, startCol, endCol, startRow, endRow, tileSize, currPal);
    renderArenaProps(ctx, currentArenaTheme, startCol, endCol, startRow, endRow, tileSize);
    ctx.restore();
  } else {
    // Arenas regulares e chefes 1-3
    if (transitionProgress < 1.0) {
      renderStandardTileGround(ctx, startCol, endCol, startRow, endRow, tileSize, pal);
      ctx.save();
      ctx.globalAlpha = 1.0 - t;
      renderArenaProps(ctx, previousArenaTheme, startCol, endCol, startRow, endRow, tileSize);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = t;
      renderArenaProps(ctx, currentArenaTheme, startCol, endCol, startRow, endRow, tileSize);
      ctx.restore();
    } else {
      // Quando não há transição, renderiza solo e props em um único loop unificado
      renderStandardTileGround(ctx, startCol, endCol, startRow, endRow, tileSize, pal, currentArenaTheme);
    }
  }

  // 3. POÇAS DE SANGUE (Com Frustum Culling e Zero-Allocation)
  const splatPad = 32;
  const sViewLeft = camera.x - splatPad;
  const sViewRight = camera.x + cameraViewW + splatPad;
  const sViewTop = camera.y - splatPad;
  const sViewBottom = camera.y + cameraViewH + splatPad;

  for (let i = 0; i < bloodSplats.length; i++) {
    const b = bloodSplats[i];
    if (b.x >= sViewLeft && b.x <= sViewRight && b.y >= sViewTop && b.y <= sViewBottom) {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. PARTÍCULAS ATMOSFÉRICAS ADAPTATIVAS (Chispas, Cinzas e Cristais de Sal - Otimizado)
  const emberLen = ambientEmbers.length;
  for (let i = 0; i < emberLen; i++) {
    const s = ambientEmbers[i];
    const floatY = s.y - (frameCount * 0.3 * s.speed);
    const sway = Math.sin(frameCount * 0.03 + s.y) * 8;
    const sx = (((s.x + sway) - camera.x * s.speed) % cameraViewW + cameraViewW) % cameraViewW;
    const sy = ((floatY - camera.y * s.speed) % cameraViewH + cameraViewH) % cameraViewH;

    const pulse = Math.sin(frameCount * 0.05 + s.x) * 0.35 + 0.65;
    ctx.fillStyle = `rgba(${pal.accentR}, ${pal.accentG}, ${pal.accentB}, ${s.alpha * pulse})`;
    ctx.beginPath();
    ctx.arc(camera.x + sx, camera.y + sy, s.r * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. NÉVOA VOLUMÉTRICA RASTEIRA TRANSLÚCIDA (Camada Única Otimizada)
  ctx.fillStyle = pal.mistBase;
  ctx.fillRect(camera.x, camera.y, cameraViewW, cameraViewH);
}
