import { NATURAL_ARENAS, resolveArenaTheme } from '../../config/arenas.js';

// Chunks são apenas cache: relevo, caminhos e objetos usam coordenadas mundiais.
// ~36 MiB em telas comuns. Em telas grandes, comporta duas vistas completas
// para que o crossfade não descarte e regenere os mesmos chunks a cada frame.
const CHUNK = 384;
const GUTTER = 2;
const CACHE_LIMIT = 64;
const sceneryCache = new Map();
const TAU = Math.PI * 2;
const SOIL_SAMPLE = 4;
const SOIL_BORDER = 1;
const SOIL_SIZE = CHUNK / SOIL_SAMPLE + SOIL_BORDER * 2;

// Chunk generation is synchronous. Reuse its scratch surface and exact double
// precision samples; drawImage copies the result before the next chunk uses it.
let soilCanvas = null;
let soilContext = null;
let soilPixels = null;
const soilX = new Float64Array(SOIL_SIZE);
const soilTrailA = new Float64Array(SOIL_SIZE);
const soilTrailB = new Float64Array(SOIL_SIZE);
const soilSandWave = new Float64Array(SOIL_SIZE);

function soilNoiseRows() {
  return {
    columns: new Float64Array(SOIL_SIZE), weights: new Float64Array(SOIL_SIZE),
    top: new Float64Array(SOIL_SIZE), bottom: new Float64Array(SOIL_SIZE),
    row: NaN, weight: 0
  };
}

const broadSoilNoise = soilNoiseRows();
const fineSoilNoise = soilNoiseRows();

function prepareSoilNoise(rows, scale) {
  rows.row = NaN;
  for (let i = 0; i < SOIL_SIZE; i++) {
    const gx = Math.floor(soilX[i] / scale);
    let u = soilX[i] / scale - gx;
    u *= u * (3 - 2 * u);
    rows.columns[i] = gx;
    rows.weights[i] = u;
  }
}

function updateSoilNoiseRow(rows, y, scale, seed) {
  const gy = Math.floor(y / scale);
  let v = y / scale - gy;
  v *= v * (3 - 2 * v);
  rows.weight = v;
  if (gy === rows.row) return;
  rows.row = gy;
  for (let i = 0; i < SOIL_SIZE; i++) {
    const gx = rows.columns[i], u = rows.weights[i];
    const a = terrainHash(gx, gy, seed), b = terrainHash(gx + 1, gy, seed);
    const c = terrainHash(gx, gy + 1, seed), d = terrainHash(gx + 1, gy + 1, seed);
    // Same expression/order as noise(), retained without Float32 rounding.
    rows.top[i] = a + (b - a) * u;
    rows.bottom[i] = c + (d - c) * u;
  }
}

export function terrainHash(x, y, seed = 0) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 144269);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function noise(x, y, scale, seed) {
  const gx = Math.floor(x / scale), gy = Math.floor(y / scale);
  let u = x / scale - gx, v = y / scale - gy;
  u *= u * (3 - 2 * u); v *= v * (3 - 2 * v);
  const a = terrainHash(gx, gy, seed), b = terrainHash(gx + 1, gy, seed);
  const c = terrainHash(gx, gy + 1, seed), d = terrainHash(gx + 1, gy + 1, seed);
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}

function mod(n, d) { return ((n % d) + d) % d; }

export function pathDistance(x, y) {
  const trail = y - Math.sin(x / 390) * 86 - Math.sin(x / 970) * 75;
  const branch = x - 220 - Math.sin(y / 490) * 115;
  return Math.min(Math.abs(mod(trail + 600, 1200) - 600),
    Math.abs(mod(branch + 850, 1700) - 850) * 1.3);
}

function ellipse(ctx, x, y, rx, ry, color, angle = 0) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, angle, 0, TAU); ctx.fill();
}

function polygon(ctx, points, color) {
  ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath(); ctx.fill();
}

function line(ctx, points, color, width = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
}

function shadow(ctx, x, y, w, h) {
  ellipse(ctx, x + w * 0.16, y + 5, w, h, 'rgba(22,26,22,0.13)');
  ellipse(ctx, x + 2, y + 2, w * 0.72, h * 0.66, 'rgba(18,23,20,0.16)');
}

function stoneGradient(ctx, x, y, size, p) {
  const gradient = ctx.createLinearGradient(x - size, y - size, x + size, y + size * 0.4);
  gradient.addColorStop(0, p.light);
  gradient.addColorStop(0.3, p.stone);
  gradient.addColorStop(1, p.shade);
  return gradient;
}

function rock(ctx, x, y, size, p, seed) {
  const skew = (seed - 0.5) * size * 0.3;
  shadow(ctx, x, y, size * 0.9, size * 0.36);
  polygon(ctx, [[x - size, y - 2], [x - size * 0.67, y - size * 0.66],
    [x + skew, y - size], [x + size * 0.78, y - size * 0.63],
    [x + size, y], [x + size * 0.28, y + size * 0.3]], stoneGradient(ctx, x, y, size, p));
  polygon(ctx, [[x + skew, y - size], [x + size * 0.78, y - size * 0.63],
    [x + size, y], [x + size * 0.28, y + size * 0.3], [x + size * 0.17, y - size * 0.36]], p.shade);
  line(ctx, [[x - size * 0.86, y - size * 0.1], [x - size * 0.63, y - size * 0.62],
    [x + skew, y - size * 0.94], [x + size * 0.5, y - size * 0.73]], p.light, 1.2);
  line(ctx, [[x - size * 0.22, y - size * 0.67], [x - size * 0.09, y - size * 0.28],
    [x + size * 0.14, y - size * 0.15]], 'rgba(30,35,30,0.2)');
  for (let i = 0; i < 14; i++) {
    const h = terrainHash(i, Math.floor(seed * 997), 31), h2 = terrainHash(i, 8, 51);
    ellipse(ctx, x + (h - 0.5) * size, y - size * (0.14 + h2 * 0.59),
      0.5 + h * 1.5, 0.4 + h2 * 0.7, i % 3 ? 'rgba(219,214,180,0.12)' : 'rgba(20,28,25,0.17)');
  }
}

function grass(ctx, x, y, size, color, seed) {
  ctx.strokeStyle = color; ctx.lineWidth = 0.9; ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const dx = (i - 2) * size * 0.18;
    ctx.moveTo(x + dx, y);
    ctx.quadraticCurveTo(x + dx * 1.5, y - size * 0.55,
      x + dx * 2 + seed * 2, y - size * (0.4 + ((i + seed) % 3) * 0.2));
  }
  ctx.stroke();
}

function grave(ctx, x, y, p, seed) {
  ctx.save(); ctx.translate(x, y); ctx.rotate((seed - 0.5) * 0.2);
  ellipse(ctx, 0, 13, 16, 27, 'rgba(44,40,29,0.17)');
  shadow(ctx, 4, 0, 18, 7);
  ctx.fillStyle = p.shade; ctx.fillRect(-12, -21, 25, 27);
  ctx.fillStyle = stoneGradient(ctx, 0, -12, 22, p); ctx.beginPath();
  ctx.arc(-2, -23, 11, Math.PI, 0); ctx.lineTo(9, 2); ctx.lineTo(-13, 2); ctx.fill();
  line(ctx, [[-11, -5], [-11, -23], [-7, -30]], p.light, 1.5);
  ctx.strokeStyle = 'rgba(30,39,35,0.46)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-2, -25); ctx.lineTo(-2, -13);
  ctx.moveTo(-6, -21); ctx.lineTo(2, -21); ctx.stroke();
  line(ctx, [[-7, -8], [4, -8]], p.shade);
  line(ctx, [[-5, -5], [2, -5]], p.shade);
  ellipse(ctx, -8, 3, 9, 2.5, p.vegetation);
  line(ctx, [[5, -28], [1, -20], [4, -16]], 'rgba(29,38,30,0.26)');
  for (let i = 0; i < 6; i++) ellipse(ctx, -10 + i * 3, -2 - terrainHash(i, 8, 13) * 8,
    1.6, 1, 'rgba(118,130,82,0.45)');
  ctx.restore();
}

function block(ctx, x, y, w, h, p) {
  shadow(ctx, x + w / 2, y + h, w * 0.55, 6);
  ctx.fillStyle = p.shade; ctx.fillRect(x, y, w, h + 8);
  ctx.fillStyle = stoneGradient(ctx, x + w / 2, y, w, p); ctx.fillRect(x, y - 3, w - 3, h);
  line(ctx, [[x + 1, y + h - 4], [x + 1, y - 3], [x + w - 4, y - 3]], p.light, 1.2);
  line(ctx, [[x + w * 0.55, y - 2], [x + w * 0.49, y + 5], [x + w * 0.66, y + 8]], p.shade);
  for (let i = 0; i < 5; i++) {
    const t = terrainHash(Math.floor(x) + i, Math.floor(y), 23);
    ellipse(ctx, x + 3 + t * (w - 8), y + 2 + (i % 3) * h * 0.2, 1.1, 0.65, 'rgba(36,39,32,0.16)');
  }
}

function wall(ctx, x, y, length, p, seed) {
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < length; col++) {
      if (row === 1 && terrainHash(col, length, seed) < 0.25) continue;
      block(ctx, x + col * 30 + row * 9, y - row * 12, 29, 13, p);
    }
  }
}

function pine(ctx, x, y, size, p, seed) {
  shadow(ctx, x + size * 0.24, y + 4, size * 0.65, size * 0.22);
  ctx.fillStyle = '#5d5341'; ctx.fillRect(x - 3, y - size * 0.55, 6, size * 0.65);
  for (let k = 0; k < 3; k++) {
    const w = size * (0.58 - k * 0.12), base = y - k * size * 0.23;
    polygon(ctx, [[x - w, base], [x - w * 0.65, base - 6],
      [x, base - size * 0.78], [x + w * 0.8, base - 6], [x + w, base + 2]],
    k === 1 ? '#435b49' : '#3c5142');
    polygon(ctx, [[x - w, base], [x, base - size * 0.78], [x - w * 0.13, base - 3]],
      k === 2 ? '#66775b' : '#596c52');
    line(ctx, [[x - w * 0.67, base - 8], [x - w * 0.2, base - size * 0.43]], p.vegetation);
    for (let branch = 0; branch < 7; branch++) {
      const by = base - branch * size * 0.075, bw = w * (1 - branch * 0.11);
      line(ctx, [[x - bw, by], [x - bw * 0.25, by - 5], [x, by - 8]], 'rgba(161,171,118,0.16)', 1.2);
      line(ctx, [[x + 1, by - 9], [x + bw * 0.86, by + 1]], 'rgba(20,40,29,0.2)', 1.4);
    }
  }
}

function oak(ctx, x, y, size, p, seed) {
  shadow(ctx, x + size * 0.3, y + 8, size * 0.85, size * 0.32);
  line(ctx, [[x - 6, y + 4], [x, y - size * 0.61], [x - size * 0.2, y - size]], '#514c37', 9);
  line(ctx, [[x + 1, y - 14], [x + size * 0.31, y - size * 0.71]], '#665b3d', 5);
  for (let i = 0; i < 23; i++) {
    const a = i * 2.4, radius = size * (0.12 + terrainHash(i, 7, 62) * 0.5);
    const px = x + Math.cos(a) * radius, py = y - size * 0.86 + Math.sin(a) * radius * 0.64;
    const r = size * (0.17 + terrainHash(i, 9, 62) * 0.14);
    const g = ctx.createRadialGradient(px - r * 0.3, py - r * 0.4, 1, px, py, r);
    g.addColorStop(0, i % 3 ? '#75804b' : '#92945b'); g.addColorStop(1, '#3e5433');
    ellipse(ctx, px, py, r, r * 0.77, g);
    for (let j = 0; j < 6; j++) ellipse(ctx, px + Math.cos(j * 2.4) * r * 0.62,
      py + Math.sin(j * 2.4) * r * 0.4, 2.4, 1.2, 'rgba(177,178,112,0.22)', j);
  }
}

function shrub(ctx, x, y, size, p, seed) {
  shadow(ctx, x, y, size, size * 0.4);
  for (let i = 0; i < 7; i++) {
    const angle = i * 2.4, r = size * (0.3 + (i % 3) * 0.14);
    const sx = x + Math.cos(angle) * r, sy = y - 6 + Math.sin(angle) * r * 0.55;
    const g = ctx.createRadialGradient(sx - 3, sy - 4, 1, sx, sy, size * 0.6);
    g.addColorStop(0, p.vegetation); g.addColorStop(1, '#3d5035');
    ellipse(ctx, sx, sy, size * 0.55, size * 0.4, g);
    ellipse(ctx, sx - 2, sy - 3, size * 0.3, size * 0.15, 'rgba(186,193,121,0.13)');
  }
}

function arch(ctx, x, y, p, broken = false) {
  shadow(ctx, x, y, 63, 17);
  for (let i = 0; i < 4; i++) {
    block(ctx, x - 55, y - i * 18, 24, 17, p);
    if (!broken || i < 2) block(ctx, x + 31, y - i * 18, 24, 17, p);
  }
  for (let i = 0; i < (broken ? 4 : 9); i++) {
    const angle = Math.PI + i * Math.PI / 9;
    const next = angle + Math.PI / 9 - 0.025;
    polygon(ctx, [[x + Math.cos(angle) * 55, y - 53 + Math.sin(angle) * 52],
      [x + Math.cos(next) * 55, y - 53 + Math.sin(next) * 52],
      [x + Math.cos(next) * 31, y - 53 + Math.sin(next) * 31],
      [x + Math.cos(angle) * 31, y - 53 + Math.sin(angle) * 31]], i % 2 ? p.stone : p.light);
  }
  if (broken) {
    rock(ctx, x + 52, y + 25, 16, p, 0.3);
    block(ctx, x + 67, y + 10, 25, 15, p);
  }
}

function ironFence(ctx, x, y, length) {
  line(ctx, [[x, y - 10], [x + length, y - 10]], '#343d35', 2);
  line(ctx, [[x, y - 24], [x + length, y - 24]], '#484f40', 2);
  for (let i = 0; i <= length; i += 13) {
    line(ctx, [[x + i, y], [x + i, y - 34]], '#303a32', 2);
    polygon(ctx, [[x + i - 3, y - 31], [x + i, y - 39], [x + i + 3, y - 31]], '#696f55');
  }
}

function tomb(ctx, x, y, p) {
  block(ctx, x - 23, y - 10, 48, 51, p);
  block(ctx, x - 26, y - 17, 50, 43, p);
  line(ctx, [[x - 3, y - 11], [x - 3, y + 17]], p.light, 2);
  line(ctx, [[x - 12, y - 3], [x + 6, y - 3]], p.light, 2);
  line(ctx, [[x + 12, y - 16], [x + 5, y], [x + 14, y + 12]], p.shade, 1.5);
}

function landmark(ctx, x, y, theme, p, variant) {
  ctx.save(); ctx.translate(x, y);
  // Solo gasto, musgo e entulho assentam a arquitetura no terreno.
  for (let i = 0; i < 32; i++) {
    const h = terrainHash(i, p.seed, 92), h2 = terrainHash(i, p.seed, 93);
    ellipse(ctx, (h - 0.5) * 320, (h2 - 0.5) * 170, 12 + h2 * 19, 5 + h * 7,
      theme === 'DESERT' ? 'rgba(123,88,44,0.045)' : 'rgba(28,39,29,0.055)', h * 3);
  }
  if (theme === 'CEMETERY') {
    // Um pequeno recinto funerário, com caminhos livres entre as sepulturas.
    wall(ctx, -113, -70, 6, p, 11);
    ironFence(ctx, -80, -80, 100);
    if (variant < 0.58) {
    block(ctx, 80, -42, 58, 43, p);
    polygon(ctx, [[69, -42], [108, -79], [148, -42]], p.shade);
    polygon(ctx, [[69, -42], [108, -79], [108, -42]], p.stone);
    ctx.fillStyle = '#41483c'; ctx.fillRect(98, -32, 19, 32);
    line(ctx, [[106, -66], [106, -48]], p.light, 2);
    line(ctx, [[101, -60], [111, -60]], p.light, 2);
    } else {
      oak(ctx, 118, -17, 60, p, variant);
      tomb(ctx, 106, 35, p);
    }
    for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
      if (terrainHash(col, row, Math.floor(variant * 99)) > 0.14)
        grave(ctx, -96 + col * 45 + row * 7, 4 + row * 58, p, terrainHash(col, row, 41));
    }
    shrub(ctx, 139, 15, 21, p, variant);
  } else if (theme === 'DESERT') {
    ellipse(ctx, 16, 15, 137, 39, 'rgba(224,187,124,0.25)', -0.12);
    arch(ctx, -13, -18, p, variant < 0.7);
    wall(ctx, 41, -45, 4, p, 17);
    for (let i = 0; i < 6; i++) rock(ctx, -97 + i * 39, 23 + Math.sin(i * 2) * 19, 9 + i % 3 * 3, p, variant);
    // Dunas recobrem a base das ruínas.
    ellipse(ctx, 27, 43, 127, 13, 'rgba(201,162,103,0.7)', -0.1);
    grass(ctx, 122, 29, 20, p.vegetation, variant);
  } else if (theme === 'VAMPIRE') {
    for (let i = 0; i < 3; i++) block(ctx, -102 + i * 5, 22 - i * 9, 196 - i * 10, 15, p);
    wall(ctx, -112, -49, 3, p, 23); wall(ctx, 37, -49, 3, p, 25);
    arch(ctx, 0, -11, p);
    ironFence(ctx, -159, -23, 46); ironFence(ctx, 111, -23, 46);
    // Tecidos desbotados identificam o solar sem tingir o chão inteiro.
    polygon(ctx, [[-83, -53], [-61, -53], [-60, -7], [-70, -14], [-81, -5]], '#663a37');
    polygon(ctx, [[65, -53], [85, -53], [81, -8], [70, -14], [64, -6]], '#6f403a');
    shrub(ctx, -134, 16, 22, p, variant); shrub(ctx, 133, 18, 22, p, variant);
  } else if (theme === 'MONOLITH') {
    ellipse(ctx, 0, 4, 140, 57, 'rgba(37,34,31,0.2)');
    for (let i = 0; i < 7; i++) {
      const px = -104 + i * 31, py = -15 + Math.sin(i) * 22;
      const height = 37 + terrainHash(i, 9, 2) * 40;
      polygon(ctx, [[px - 12, py], [px - 12, py - height], [px + 4, py - height - 7],
        [px + 15, py - height], [px + 15, py], [px, py + 7]], p.shade);
      polygon(ctx, [[px - 12, py], [px - 12, py - height], [px + 4, py - height - 7], [px + 2, py + 4]], p.stone);
      line(ctx, [[px - 10, py - height], [px + 4, py - height - 7], [px + 14, py - height]], p.light);
    }
    // Brasa localizada numa cavidade, distinta dos avisos de ataques.
    ellipse(ctx, 29, 44, 27, 10, '#353330');
    ellipse(ctx, 29, 44, 17, 4, '#835337');
    line(ctx, [[15, 43], [27, 45], [34, 42], [41, 43]], '#b87b45', 1.5);
    for (let i = 0; i < 5; i++) rock(ctx, -94 + i * 47, 53 + (i % 2) * 11, 11 + i, p, variant);
  } else if (theme === 'HIGHLANDS') {
    for (let i = 0; i < 4; i++) rock(ctx, -94 + i * 36, -5 + Math.sin(i * 2) * 12, 27 + (i % 2) * 12, p, variant);
    pine(ctx, -105, -28, 69, p, variant); pine(ctx, 90, -8, 83, p, variant);
    wall(ctx, -32, 56, 4, p, 53);
    // Marco da antiga estrada e pequeno cairn de pedras.
    rock(ctx, 35, 14, 19, p, variant); rock(ctx, 35, 4, 13, p, variant); rock(ctx, 34, -8, 8, p, variant);
    grass(ctx, -55, 57, 18, p.vegetation, variant);
  } else if (theme === 'REAPER') {
    arch(ctx, -55, -25, p, true); wall(ctx, 3, -52, 5, p, 71);
    tomb(ctx, -85, 34, p); tomb(ctx, 11, 39, p); grave(ctx, 104, 25, p, variant);
    shrub(ctx, -132, 49, 17, p, variant);
    rock(ctx, 118, 56, 14, p, variant);
  } else {
    for (let i = 0; i < 4; i++) block(ctx, -91 + i * 6, 56 - i * 13, 182 - i * 12, 18, p);
    for (const side of [-1, 1]) {
      block(ctx, side * 97 - 21, -22, 44, 31, p);
      for (let k = 0; k < (side === -1 ? 4 : 2); k++) block(ctx, side * 97 - 12, -31 - k * 17, 27, 17, p);
    }
    arch(ctx, 0, -20, p, true);
    line(ctx, [[-27, 30], [-12, 22], [-5, 9], [12, 2]], '#646073', 2);
    rock(ctx, 123, 52, 20, p, variant); rock(ctx, -132, 39, 17, p, variant);
    grass(ctx, -111, 71, 13, p.vegetation, variant);
  }
  ctx.restore();
}

// Textura contínua de baixa frequência com granulação fina.
function paintSoil(ctx, ox, oy, p) {
  const sample = SOIL_SAMPLE, size = SOIL_SIZE;
  if (!soilCanvas) {
    soilCanvas = document.createElement('canvas');
    soilCanvas.width = soilCanvas.height = size;
    soilContext = soilCanvas.getContext('2d');
    soilPixels = soilContext.createImageData(size, size);
  }
  const pixels = soilPixels;
  const sand = p.material === 'sand';
  for (let i = 0; i < size; i++) {
    const x = ox + (i - SOIL_BORDER) * sample;
    soilX[i] = x;
    soilTrailA[i] = Math.sin(x / 390) * 86;
    soilTrailB[i] = Math.sin(x / 970) * 75;
    if (sand) soilSandWave[i] = Math.sin(x / 310) * 2;
  }
  prepareSoilNoise(broadSoilNoise, 280);
  prepareSoilNoise(fineSoilNoise, 61);
  for (let j = 0; j < size; j++) {
    const y = oy + (j - SOIL_BORDER) * sample;
    const branchWave = Math.sin(y / 490) * 115;
    updateSoilNoiseRow(broadSoilNoise, y, 280, p.seed);
    updateSoilNoiseRow(fineSoilNoise, y, 61, p.seed + 1);
    const bv = broadSoilNoise.weight, fv = fineSoilNoise.weight;
    for (let i = 0; i < size; i++) {
      const x = soilX[i];
      const broad = broadSoilNoise.top[i] * (1 - bv) + broadSoilNoise.bottom[i] * bv;
      const fine = fineSoilNoise.top[i] * (1 - fv) + fineSoilNoise.bottom[i] * fv;
      let mix = broad * 0.7 + fine * 0.3;
      if (sand) mix += Math.sin(y / 69 + soilSandWave[i]) * 0.19;
      const trailY = y - soilTrailA[i] - soilTrailB[i];
      const branchX = x - 220 - branchWave;
      const distance = Math.min(Math.abs(mod(trailY + 600, 1200) - 600),
        Math.abs(mod(branchX + 850, 1700) - 850) * 1.3);
      let trail = Math.max(0, Math.min(1, (49 + fine * 25 - distance) / 26));
      if (p.material === 'sand' || p.material === 'basalt') trail *= 0.16;
      if (p.material === 'paving' || p.material === 'ruins') {
        // Terra e musgo aparecem sob os trechos mais erodidos do calçamento.
        trail = Math.max(0, (fine - 0.48) * 1.7);
      }
      const grain = (terrainHash(Math.floor(x), Math.floor(y), p.seed + 2) - 0.5) * 7;
      const offset = (j * size + i) * 4;
      for (let k = 0; k < 3; k++) {
        const natural = p.low[k] + (p.high[k] - p.low[k]) * mix;
        pixels.data[offset + k] = natural * (1 - trail * 0.78) + p.soil[k] * trail * 0.78 + grain;
      }
      pixels.data[offset + 3] = 255;
    }
  }
  soilContext.putImageData(pixels, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(soilCanvas, -sample, -sample, size * sample, size * sample);
}

function paving(ctx, ox, oy, p) {
  const ruins = p.material === 'ruins';
  const stepX = ruins ? 114 : p.seed === 71 ? 67 : 89;
  const stepY = ruins ? 76 : p.seed === 71 ? 65 : 49;
  for (let row = Math.floor(oy / stepY) - 1; row <= Math.floor((oy + CHUNK) / stepY) + 1; row++) {
    for (let col = Math.floor(ox / stepX) - 1; col <= Math.floor((ox + CHUNK) / stepX) + 1; col++) {
      const h = terrainHash(col, row, p.seed);
      const x = col * stepX + mod(row, 2) * stepX / 2, y = row * stepY;
      if (h < (ruins ? 0.22 : 0.06) || noise(x, y, 200, p.seed + 1) > 0.68) continue;
      const w = stepX - 8 + h * 4, ht = stepY - 8 + h * 3;
      polygon(ctx, [[x + 3, y], [x + w, y + 2], [x + w - 1, y + ht - 3],
        [x + w - 6, y + ht], [x, y + ht - 2], [x + 1, y + 5]],
      h > 0.55 ? 'rgba(205,206,186,0.09)' : 'rgba(29,40,36,0.075)');
      line(ctx, [[x + 2, y + ht - 3], [x, y + 4], [x + 4, y], [x + w, y + 1]], 'rgba(203,207,186,0.13)');
      line(ctx, [[x + w, y + 3], [x + w - 1, y + ht - 2], [x + 2, y + ht]], 'rgba(25,34,31,0.24)');
      if (h > 0.8) line(ctx, [[x + 29, y], [x + 38, y + 15], [x + 34, y + 26], [x + 51, y + ht]], 'rgba(31,38,34,0.25)');
      if (h < 0.22) grass(ctx, x + w, y + ht, 6, p.vegetation, h);
    }
  }
}

function surfaceDetails(ctx, ox, oy, p) {
  for (let gy = Math.floor(oy / 24) - 1; gy <= Math.floor((oy + CHUNK) / 24) + 1; gy++) {
    for (let gx = Math.floor(ox / 24) - 1; gx <= Math.floor((ox + CHUNK) / 24) + 1; gx++) {
      const h = terrainHash(gx, gy, p.seed + 5), h2 = terrainHash(gx, gy, p.seed + 6);
      const x = gx * 24 + h * 22, y = gy * 24 + h2 * 22;
      const distance = pathDistance(x, y);
      if (p.material === 'grass' && distance > 60) {
        if (h < 0.2 + noise(x, y, 140, p.seed) * 0.28) continue;
        grass(ctx, x, y, 3 + h * 5, h2 > 0.45 ? 'rgba(161,170,102,0.28)' : 'rgba(31,52,28,0.29)', h);
        if (h > 0.96) ellipse(ctx, x, y - 4, 1.1, 0.8, '#b4b294');
      } else if (p.material === 'sand') {
        if (h > 0.34 && noise(x, y, 130, p.seed) > 0.37) {
          ctx.strokeStyle = 'rgba(229,196,138,0.18)'; ctx.lineWidth = 1; ctx.beginPath();
          ctx.moveTo(x - 10, y); ctx.quadraticCurveTo(x, y - 4, x + 15 + h * 17, y - 2); ctx.stroke();
        }
        if (h < 0.08) ellipse(ctx, x, y, 1 + h2 * 2, 0.8, 'rgba(88,67,45,0.3)');
      } else {
        if (h < 0.45) {
          ellipse(ctx, x + 1, y + 1, 1 + h * 4, 1 + h2, 'rgba(23,33,29,0.2)');
          ellipse(ctx, x, y, 1 + h * 4, 0.8, 'rgba(191,185,158,0.22)');
        }
        if (p.material === 'scree' && h > 0.64 && distance > 68) grass(ctx, x, y, 5 + h2 * 5, p.vegetation, h);
        if ((p.material === 'paving' || p.material === 'ruins') && h > 0.87) {
          ellipse(ctx, x, y, 2.5, 1, 'rgba(146,118,71,0.48)', h * TAU);
        }
      }
    }
  }
}

function groundFeatures(ctx, ox, oy, theme, p) {
  for (let gy = Math.floor((oy - 210) / 350); gy <= Math.floor((oy + CHUNK + 210) / 350); gy++) {
    for (let gx = Math.floor((ox - 210) / 350); gx <= Math.floor((ox + CHUNK + 210) / 350); gx++) {
      const h = terrainHash(gx, gy, p.seed + 32), h2 = terrainHash(gx, gy, p.seed + 33);
      const x = gx * 350 + 80 + h * 180, y = gy * 350 + 80 + h2 * 180;
      if (theme === 'DESERT') {
        // Crista longa e assimétrica, com areia acumulada no lado a sotavento.
        const spread = 85 + h * 100;
        ctx.save(); ctx.translate(x, y); ctx.rotate(-0.18);
        const g = ctx.createLinearGradient(0, -18, 0, 38);
        g.addColorStop(0, 'rgba(243,216,158,0)'); g.addColorStop(0.34, 'rgba(235,198,131,0.1)');
        g.addColorStop(0.39, 'rgba(96,65,30,0.08)'); g.addColorStop(1, 'rgba(117,84,39,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-spread, 12);
        ctx.bezierCurveTo(-spread * 0.5, -17, spread * 0.22, -26, spread, 5);
        ctx.bezierCurveTo(spread * 0.35, 35, -spread * 0.5, 46, -spread, 12); ctx.fill();
        ctx.restore();
      } else if (theme === 'MONOLITH' || (theme === 'HIGHLANDS' && h > 0.45 && pathDistance(x, y) > 130)) {
        const pts = [];
        for (let i = 0; i < 9; i++) {
          const a = i / 9 * TAU, radius = 66 + terrainHash(gx + i, gy, 78) * 52;
          pts.push([x + Math.cos(a) * radius, y + Math.sin(a) * radius * 0.55]);
        }
        const g = ctx.createLinearGradient(x - 80, y - 60, x + 60, y + 60);
        g.addColorStop(0, theme === 'MONOLITH' ? 'rgba(126,116,99,0.13)' : 'rgba(171,180,168,0.15)');
        g.addColorStop(1, 'rgba(24,31,28,0.12)');
        polygon(ctx, pts, g);
        line(ctx, pts.slice(0, 5), 'rgba(25,29,27,0.2)', 1.5);
        for (let i = 0; i < 3; i++) {
          const start = pts[(i * 3) % pts.length];
          line(ctx, [start, [x + (i - 1) * 21, y + 3 + i * 7], [x + 10, y - 18]], 'rgba(22,28,25,0.26)', 1.1);
        }
      } else if (theme === 'SANCTUARY' && h > 0.52) {
        // Fragmentos de mosaico assentados no piso; ornamentação sem emissão de luz.
        ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.7);
        polygon(ctx, [[0,-71],[95,0],[0,71],[-95,0]], 'rgba(173,170,148,0.08)');
        line(ctx, [[-89,0],[0,-66],[89,0],[0,66],[-89,0]], 'rgba(186,180,155,0.19)', 3);
        line(ctx, [[-65,0],[0,-47],[65,0],[0,47],[-65,0]], 'rgba(27,34,34,0.23)', 2);
        line(ctx, [[-19,-40],[4,-12],[-8,4],[30,35]], 'rgba(29,33,33,0.44)', 2);
        ctx.restore();
      }
    }
  }
}

function scenery(ctx, ox, oy, theme, p) {
  const margin = 230;
  // Objetos secundários distribuídos fora das trilhas de circulação.
  for (let gy = Math.floor((oy - margin) / 133); gy <= Math.floor((oy + CHUNK + margin) / 133); gy++) {
    for (let gx = Math.floor((ox - margin) / 133); gx <= Math.floor((ox + CHUNK + margin) / 133); gx++) {
      const h = terrainHash(gx, gy, p.seed + 8), h2 = terrainHash(gx, gy, p.seed + 9);
      const x = gx * 133 + h * 105, y = gy * 133 + h2 * 105;
      if (pathDistance(x, y) < 85 || h > 0.48) continue;
      if (theme === 'CEMETERY') {
        if (h < 0.14) shrub(ctx, x, y, 13 + h2 * 13, p, h2);
        else if (h < 0.27) grave(ctx, x, y, p, h2);
        else if (h < 0.32) oak(ctx, x, y, 43 + h2 * 25, p, h2);
        else rock(ctx, x, y, 6 + h2 * 7, p, h2);
      } else if (theme === 'DESERT') {
        if (h < 0.19) rock(ctx, x, y, 14 + h2 * 23, p, h2);
        else if (h < 0.27) block(ctx, x, y, 22 + h2 * 13, 15, p);
        else grass(ctx, x, y, 11 + h2 * 13, p.vegetation, h2);
      } else if (theme === 'HIGHLANDS') {
        if (h < 0.14) pine(ctx, x, y, 45 + h2 * 36, p, h2);
        else rock(ctx, x, y, 12 + h2 * 29, p, h2);
      } else if (theme === 'MONOLITH') {
        rock(ctx, x, y, 10 + h2 * 30, p, h2);
        if (h < 0.12) rock(ctx, x + 28, y + 13, 9 + h2 * 10, p, h);
      } else {
        if (h < 0.1) shrub(ctx, x, y, 13 + h2 * 8, p, h2);
        else if (h < 0.2 && theme === 'REAPER') grave(ctx, x, y, p, h2);
        else if (h < 0.26) block(ctx, x, y, 22 + h2 * 16, 18, p);
        else if (h < 0.36) rock(ctx, x, y, 7 + h2 * 10, p, h2);
      }
    }
  }
  // Espaçamento amplo e variantes evitam repetição excessiva de monumentos.
  for (let gy = Math.floor((oy - 340) / 800); gy <= Math.floor((oy + CHUNK + 340) / 800); gy++) {
    for (let gx = Math.floor((ox - 340) / 960); gx <= Math.floor((ox + CHUNK + 340) / 960); gx++) {
      const h = terrainHash(gx, gy, p.seed + 10);
      const x = gx * 960 + 350 + h * 130, y = gy * 800 + 170 + terrainHash(gx, gy, p.seed + 11) * 100;
      landmark(ctx, x, y, theme, p, h);
    }
  }
}

function buildChunk(theme, cx, cy) {
  const p = NATURAL_ARENAS[theme];
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = CHUNK + GUTTER * 2;
  const ctx = canvas.getContext('2d', { alpha: false });
  const ox = cx * CHUNK, oy = cy * CHUNK;
  ctx.translate(GUTTER, GUTTER);
  paintSoil(ctx, ox, oy, p);
  ctx.translate(-ox, -oy);
  if (p.material === 'paving' || p.material === 'ruins') paving(ctx, ox, oy, p);
  groundFeatures(ctx, ox, oy, theme, p);
  surfaceDetails(ctx, ox, oy, p);
  scenery(ctx, ox, oy, theme, p);
  return canvas;
}

function getChunk(theme, cx, cy, limit) {
  const key = `${theme}:${cx}:${cy}`;
  let canvas = sceneryCache.get(key);
  if (canvas) sceneryCache.delete(key);
  else canvas = buildChunk(theme, cx, cy);
  sceneryCache.set(key, canvas);
  while (sceneryCache.size > limit) sceneryCache.delete(sceneryCache.keys().next().value);
  return canvas;
}

export function clearNaturalTerrainCache() { sceneryCache.clear(); }

export function renderNaturalTerrain(ctx, theme, camera, width, height) {
  theme = resolveArenaTheme(theme);
  if (!NATURAL_ARENAS[theme]) theme = 'CEMETERY';
  const left = Math.floor(camera.x / CHUNK), top = Math.floor(camera.y / CHUNK);
  const right = Math.floor((camera.x + width) / CHUNK), bottom = Math.floor((camera.y + height) / CHUNK);
  const limit = Math.max(CACHE_LIMIT, (right - left + 1) * (bottom - top + 1) * 2 + 8);
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
    // Margem duplicada evita linhas de filtragem entre imagens no zoom fracionário.
    ctx.drawImage(getChunk(theme, x, y, limit), x * CHUNK - GUTTER, y * CHUNK - GUTTER);
  }
}
