import {
  camera, cameraViewW, cameraViewH, currentArenaTheme, setCurrentArenaTheme,
  bloodSplats, frameCount
} from '../main.js';
import { NATURAL_ARENAS, ARENA_ALIASES, resolveArenaTheme } from '../config/arenas.js';
import { renderNaturalTerrain, clearNaturalTerrainCache, prefetchArenaTheme, terrainHash } from './environment/naturalTerrain.js';
import { renderSurrealAbyssArena, getAbyssArenaState } from './environment/abyssArena.js';

export { renderSurrealAbyssArena, getAbyssArenaState };
// Mantidos para consumidores antigos dos renderizadores de decoração.
export { renderArenaProps, BIOME_PROP_RENDERERS } from './environment/biomeProps/index.js';
export const tileHash = terrainHash;

function color(rgb) { return `rgb(${rgb.join(',')})`; }

export const ARENA_PALETTES = Object.fromEntries(Object.entries(NATURAL_ARENAS).map(([key, p]) => [key, {
  name: p.name, tileA: color(p.high), tileB: color(p.low),
  pathA: color(p.soil), pathB: color(p.soil), detailA: p.stone,
  groove: p.shade, fissure: p.shade, crack: p.shade,
  mistBase: p.mist, mistPuff: p.mist,
  emberR: p.dust[0], emberG: p.dust[1], emberB: p.dust[2],
  accentR: p.dust[0], accentG: p.dust[1], accentB: p.dust[2]
}]));

// Paleta e renderizador do encontro final preservados.
ARENA_PALETTES.ABYSS = {
  name: 'Horizonte do Vazio',
  tileA: '#542c70', tileB: '#3c1c50', pathA: '#68368b', pathB: '#482262',
  detailA: '#240f32', groove: '#160622', fissure: '#d980fa', crack: '#8e44ad',
  mistBase: 'rgba(50, 18, 75, 0.035)', mistPuff: 'rgba(155, 89, 182, 0.04)',
  emberR: 224, emberG: 86, emberB: 253, accentR: 116, accentG: 185, accentB: 255
};
for (const [alias, theme] of Object.entries(ARENA_ALIASES)) ARENA_PALETTES[alias] = ARENA_PALETTES[theme];

let previousArenaTheme = 'CEMETERY';
let transitionProgress = 1;
let transitionDuration = 150;
let lastEnvironmentFrame = 0;
let transitionCanvas = null;

export function transitionToArenaTheme(newTheme, duration = 150) {
  newTheme = resolveArenaTheme(newTheme);
  if (!ARENA_PALETTES[newTheme] || newTheme === currentArenaTheme) return;
  previousArenaTheme = currentArenaTheme;
  setCurrentArenaTheme(newTheme);
  transitionProgress = 0;
  transitionDuration = Math.max(30, duration);
  lastEnvironmentFrame = frameCount;
  prefetchArenaTheme(newTheme, camera, cameraViewW, cameraViewH);
}

export function resetEnvironment() {
  previousArenaTheme = 'CEMETERY';
  transitionProgress = 1;
  transitionDuration = 150;
  lastEnvironmentFrame = frameCount;
  setCurrentArenaTheme('CEMETERY');
  clearNaturalTerrainCache();
  transitionCanvas = null;
}

export const ambientEmbers = [];
for (let i = 0; i < 24; i++) {
  ambientEmbers.push({ x: Math.random() * 2000 - 1000, y: Math.random() * 2000 - 1000,
    r: Math.random() * 1.8 + 0.6, speed: Math.random() * 0.45 + 0.2,
    alpha: Math.random() * 0.45 + 0.25 });
}

function renderArena(ctx, theme) {
  if (theme === 'ABYSS') renderSurrealAbyssArena(ctx);
  else renderNaturalTerrain(ctx, theme, camera, cameraViewW, cameraViewH);
}

function renderIncomingArena(ctx, theme, opacity) {
  // Compor a cena primeiro evita acumular alpha nas margens sobrepostas do cache.
  const width = Math.ceil(cameraViewW) + 4, height = Math.ceil(cameraViewH) + 4;
  if (!transitionCanvas) transitionCanvas = document.createElement('canvas');
  if (transitionCanvas.width !== width) transitionCanvas.width = width;
  if (transitionCanvas.height !== height) transitionCanvas.height = height;
  const layer = transitionCanvas.getContext('2d');
  const x = Math.floor(camera.x) - 2, y = Math.floor(camera.y) - 2;
  layer.setTransform(1, 0, 0, 1, 0, 0);
  layer.clearRect(0, 0, width, height);
  layer.translate(-x, -y);
  renderArena(layer, theme);
  ctx.save(); ctx.globalAlpha *= opacity;
  ctx.drawImage(transitionCanvas, x, y);
  ctx.restore();
}

function renderAtmosphere(ctx, theme, opacity) {
  if (opacity <= 0) return;
  const pal = ARENA_PALETTES[theme] || ARENA_PALETTES.CEMETERY;
  const abyss = theme === 'ABYSS';
  const desert = theme === 'DESERT';
  ctx.save(); ctx.globalAlpha *= opacity;
  // O Abismo conserva suas partículas. Nas regiões reais: pó, cinza e sementes.
  const count = abyss ? ambientEmbers.length : 16;
  for (let i = 0; i < count; i++) {
    const s = ambientEmbers[i];
    const floatY = s.y - frameCount * 0.3 * s.speed;
    const sway = Math.sin(frameCount * 0.03 + s.y) * 8;
    const drift = abyss ? sway : frameCount * (desert ? 0.65 : 0.15) * s.speed;
    const sx = (((s.x + drift) - camera.x * s.speed) % cameraViewW + cameraViewW) % cameraViewW;
    const sy = ((floatY - camera.y * s.speed) % cameraViewH + cameraViewH) % cameraViewH;
    const pulse = Math.sin(frameCount * 0.05 + s.x) * 0.35 + 0.65;
    ctx.fillStyle = `rgba(${pal.accentR},${pal.accentG},${pal.accentB},${s.alpha * pulse * (abyss ? 1 : 0.3)})`;
    ctx.beginPath();
    if (desert) ctx.ellipse(camera.x + sx, camera.y + sy, s.r * 2.2, s.r * 0.35, -0.18, 0, Math.PI * 2);
    else ctx.arc(camera.x + sx, camera.y + sy, s.r * (abyss ? 1.5 : 0.7), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = pal.mistBase;
  ctx.fillRect(camera.x, camera.y, cameraViewW, cameraViewH);
  ctx.restore();
}

export function renderEnvironment(ctx) {
  // Usa tempo da simulação: pausa congela a transição e FPS não altera sua duração.
  const elapsed = Math.max(0, Math.min(6, frameCount - lastEnvironmentFrame));
  lastEnvironmentFrame = frameCount;
  transitionProgress = Math.min(1, transitionProgress + elapsed / transitionDuration);
  const t = transitionProgress * transitionProgress * (3 - 2 * transitionProgress);

  if (transitionProgress < 1) {
    renderArena(ctx, previousArenaTheme);
    renderIncomingArena(ctx, currentArenaTheme, t);
  } else {
    renderArena(ctx, currentArenaTheme);
    transitionCanvas = null;
  }

  const left = camera.x - 32, right = camera.x + cameraViewW + 32;
  const top = camera.y - 32, bottom = camera.y + cameraViewH + 32;
  for (const b of bloodSplats) {
    if (b.x >= left && b.x <= right && b.y >= top && b.y <= bottom) {
      ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (transitionProgress < 1) renderAtmosphere(ctx, previousArenaTheme, 1 - t);
  renderAtmosphere(ctx, currentArenaTheme, t);
}
