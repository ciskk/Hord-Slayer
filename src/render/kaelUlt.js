/**
 * src/render/kaelUlt.js
 * 
 * Travessia Espectral de Kael (Manto de Fumaça) — Efeitos em Espaço de Mundo e Modelo.
 * Cosméticos delimitados, reutilizáveis e com zero alocação de objetos por quadro.
 * Paleta: Obsidiana (massa), Ametista/Violeta (energia), Ciano Astral (detalhe) e Branco (picos).
 */

import { KAEL_ULT } from '../config/kaelUlt.js';

const TAU = Math.PI * 2;
const TRAIL_LIFE = KAEL_ULT.trailLife;       // 50 quadros
const SPACING = KAEL_ULT.trailSpacing;       // 18 pixels
const RIFT_RADIUS = 22;

// Pool de Ecos de Movimento (Silhuetas do Personagem no Espaço de Mundo)
const trail = Array.from({ length: 24 }, () => ({
  x: 0,
  y: 0,
  facing: 1,
  angle: 0,
  life: 0,
  maxLife: TRAIL_LIFE,
  capeWave: 0
}));

// Pool de Rupturas de Entrada e Recomposição de Saída
const ruptures = Array.from({ length: 6 }, () => ({
  x: 0,
  y: 0,
  facing: 1,
  isExit: false,
  life: 0,
  maxLife: 40
}));

// Pool de Micro-Fissuras de Corte Espectral nos Inimigos (Impactos Críticos)
const hitFissures = Array.from({ length: 12 }, () => ({
  x: 0,
  y: 0,
  angle: 0,
  life: 0,
  maxLife: KAEL_ULT.hitFissureLife
}));

let trailCursor = 0;
let ruptureCursor = 0;
let hitCursor = 0;
let lastX = 0, lastY = 0, carry = 0, tracking = false;

function addRupture(x, y, facing, isExit) {
  const r = ruptures[ruptureCursor];
  ruptureCursor = (ruptureCursor + 1) % ruptures.length;
  r.x = x;
  r.y = y;
  r.facing = facing;
  r.isExit = isExit;
  r.life = r.maxLife = isExit ? 28 : 36;
}

export function beginKaelPhase(x, y, facing = 1) {
  lastX = x;
  lastY = y;
  carry = 0;
  tracking = true;
  addRupture(x, y, facing, false);
}

/**
 * Registra o deslocamento contínuo em espaço de mundo.
 * Não emite novos ecos quando o herói estiver imóvel.
 */
export function traceKaelPhase(x, y, finished = false, facing = 1, isMoving = false) {
  if (!tracking) return;

  const dx = x - lastX;
  const dy = y - lastY;
  const distance = Math.hypot(dx, dy);

  if (distance > 0.001 && isMoving) {
    const angle = Math.atan2(dy, dx);
    let offset = SPACING - carry;

    for (let n = 0; offset <= distance && n < trail.length; n++, offset += SPACING) {
      const echo = trail[trailCursor];
      trailCursor = (trailCursor + 1) % trail.length;
      echo.x = lastX + dx * offset / distance;
      echo.y = lastY + dy * offset / distance;
      echo.facing = facing;
      echo.angle = angle;
      echo.life = TRAIL_LIFE;
      echo.maxLife = TRAIL_LIFE;
      echo.capeWave = Math.sin(offset * 0.15) * 3;
    }
    carry = (carry + distance) % SPACING;
  }

  lastX = x;
  lastY = y;

  if (finished) {
    addRupture(x, y, facing, true);
    tracking = false;
  }
}

export function addKaelHitFissure(x, y, angle = (Math.random() * 0.8 - 0.4)) {
  const hf = hitFissures[hitCursor];
  hitCursor = (hitCursor + 1) % hitFissures.length;
  hf.x = x;
  hf.y = y;
  hf.angle = angle;
  hf.life = hf.maxLife = KAEL_ULT.hitFissureLife;
}

export function clearKaelPhaseEffects() {
  for (const t of trail) t.life = 0;
  for (const r of ruptures) r.life = 0;
  for (const h of hitFissures) h.life = 0;
  trailCursor = ruptureCursor = hitCursor = carry = 0;
  tracking = false;
}

export function updateKaelPhaseEffects(dt) {
  for (const t of trail) t.life = Math.max(0, t.life - dt);
  for (const r of ruptures) r.life = Math.max(0, r.life - dt);
  for (const h of hitFissures) h.life = Math.max(0, h.life - dt);
}

function isEffectVisible(effect, left, right, top, bottom, margin) {
  return effect.life > 0 && (left === undefined || !(
    effect.x + margin < left ||
    effect.x - margin > right ||
    effect.y + margin < top ||
    effect.y - margin > bottom
  ));
}

// =============================================================================
// DESENHO EM ESPAÇO DE MUNDO: CAMADA DE SOLO (GROUND)
// =============================================================================

/**
 * Fenda rúnica dimensional ancorada no cenário.
 * Compartilhada entre a ruptura de solo, a prévia do herói e o chão estável.
 */
export function drawKaelGroundRift(c, x, y, age, maxLife, scale = 1, isExit = false) {
  const p = Math.max(0, Math.min(1, age / maxLife));
  const fade = isExit ? (1 - p) : Math.min(1, (maxLife - age) / 12);
  const open = isExit ? (1 - p) : Math.sin(Math.min(1, age / 8) * Math.PI * 0.5);

  c.save();
  c.translate(x, y + 14 * scale);
  c.scale(scale, scale * 0.42); // Perspectiva isométrica no solo

  // 1. Núcleo de vácuo profundo (obsidiana estendida)
  const rx = (RIFT_RADIUS + 4) * open;
  const ry = 8 * open;
  const glow = c.createRadialGradient(0, 0, 2, 0, 0, rx);
  glow.addColorStop(0, '#0a0714ee');
  glow.addColorStop(0.55, '#24143caa');
  glow.addColorStop(0.85, '#7c3aed44');
  glow.addColorStop(1, '#00000000');
  c.fillStyle = glow;
  c.beginPath();
  c.ellipse(0, 0, rx, ry, 0, 0, TAU);
  c.fill();

  // 2. Fenda bipartida com formato de losango partido (Void Seal)
  c.strokeStyle = '#090710';
  c.lineWidth = 3.2;
  c.beginPath();
  c.moveTo(-rx * 0.95, 0);
  c.lineTo(-rx * 0.25, -ry * 0.45);
  c.lineTo(0, 0);
  c.lineTo(rx * 0.25, ry * 0.45);
  c.lineTo(rx * 0.95, 0);
  c.stroke();

  // 3. Filete incandescente de energia ametista e ciano
  c.strokeStyle = '#a855f7';
  c.lineWidth = 1.6;
  c.stroke();

  c.strokeStyle = '#38bdf8';
  c.lineWidth = 0.7;
  c.stroke();

  // 4. Anel rúnico tênue pulsante
  c.strokeStyle = `rgba(192, 132, 252, ${0.45 * fade})`;
  c.lineWidth = 0.8;
  c.beginPath();
  c.ellipse(0, 0, rx * 0.75, ry * 0.75, age * 0.03, 0, TAU);
  c.stroke();

  c.restore();
}

/**
 * Chamado pelo pipeline de renderização no solo (ground plane).
 */
export function drawKaelPhaseGround(c, left, right, top, bottom) {
  // 1. Fendas deixadas pelas rupturas de partida/chegada
  for (const r of ruptures) {
    if (!isEffectVisible(r, left, right, top, bottom, 50)) continue;
    const age = r.maxLife - r.life;
    drawKaelGroundRift(c, r.x, r.y, age, r.maxLife, 1, r.isExit);
  }

  // 2. Resíduos astrais sob os ecos de movimento
  for (const echo of trail) {
    if (!isEffectVisible(echo, left, right, top, bottom, 35)) continue;
    const fade = Math.min(1, echo.life / 25);
    c.save();
    c.translate(echo.x, echo.y + 13);
    c.scale(1, 0.36);
    c.globalAlpha *= fade * 0.35;
    c.fillStyle = '#4a1570';
    c.beginPath();
    c.ellipse(0, 0, 11, 6, echo.angle, 0, TAU);
    c.fill();
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-6, 0);
    c.lineTo(6, 0);
    c.stroke();
    c.restore();
  }
}

// =============================================================================
// DESENHO EM ESPAÇO DE MUNDO: CAMADA AÉREA (AIR / ACTORS)
// =============================================================================

/**
 * Silhueta residual estilizada de Kael:
 * Reproduz o contorno do capuz com bico de falcão, capa esvoaçante e lâminas em 'X'.
 */
function drawKaelEchoSilhouette(c, echo) {
  const age = echo.maxLife - echo.life;
  const fade = Math.min(1, echo.life / 22);

  c.save();
  c.translate(echo.x, echo.y);
  c.scale(echo.facing, 1);
  c.globalAlpha *= fade * 0.65;

  // Leve deriva vertical astral à medida que o eco se dissipa
  c.translate(0, -age * 0.08);

  // 1. Capa esvoaçante espectral em farrapos
  const cW = echo.capeWave || 0;
  c.fillStyle = '#0f0c1b';
  c.beginPath();
  c.moveTo(-3, -3);
  c.lineTo(1, -3);
  c.lineTo(-2, 7);
  c.lineTo(-5 - cW * 0.3, 17);
  c.lineTo(-8 - cW * 0.6, 19);
  c.lineTo(-12 - cW * 0.8, 16);
  c.lineTo(-14 - cW * 1.0, 11);
  c.lineTo(-6, -1);
  c.closePath();
  c.fill();

  c.strokeStyle = '#7c3aed';
  c.lineWidth = 1.0;
  c.stroke();

  // 2. Tronco ágil e pernas
  c.fillStyle = '#171426';
  c.beginPath();
  c.moveTo(-5, -4);
  c.lineTo(4, -4);
  c.lineTo(3, 5);
  c.lineTo(-4, 5);
  c.closePath();
  c.fill();

  c.fillStyle = '#0c0a14';
  c.fillRect(-4.5, 6, 3.2, 7);
  c.fillRect(0.5, 6, 3.2, 7);

  // 3. Domo e bico do capuz em perfil 3/4
  c.fillStyle = '#1f1830';
  c.beginPath();
  c.moveTo(-5.5, -4);
  c.quadraticCurveTo(-7.5, -11, -4.5, -16.5);
  c.quadraticCurveTo(-1.0, -18.5, 1.8, -17.5);
  c.quadraticCurveTo(5.2, -16.5, 6.8, -12.5);
  c.lineTo(4.8, -11.5);
  c.quadraticCurveTo(5.5, -6.5, 3.8, -3.5);
  c.closePath();
  c.fill();

  c.strokeStyle = '#a855f7';
  c.lineWidth = 0.9;
  c.stroke();

  // Caverna escura da máscara
  c.fillStyle = '#08060e';
  c.beginPath();
  c.moveTo(5.0, -11.5);
  c.quadraticCurveTo(0.5, -13.5, -1.8, -9.5);
  c.quadraticCurveTo(-1.0, -5.5, 1.5, -4.5);
  c.quadraticCurveTo(4.2, -5.0, 4.8, -8.0);
  c.closePath();
  c.fill();

  // 4. Par de Lâminas Espirituais cruzadas nas costas (\ e /)
  c.strokeStyle = '#9333ea';
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-7, -11); c.lineTo(1, 1);
  c.moveTo(2, -10); c.lineTo(-6, 2);
  c.stroke();

  // Ponto incandescente branco nos pomos
  c.fillStyle = '#ffffff';
  c.fillRect(-7.5, -11.5, 1.4, 1.4);
  c.fillRect(1.5, -10.5, 1.4, 1.4);

  // 5. Filamentos astrais ascendentes se desprendendo do eco
  const filamentProg = ((age * 0.08) % 1);
  c.fillStyle = '#38bdf8';
  c.fillRect(-4 + Math.sin(age * 0.3) * 2, 4 - filamentProg * 18, 1.2, 2.0);
  c.fillStyle = '#f3e8ff';
  c.fillRect(-8 + Math.cos(age * 0.25) * 2, 10 - filamentProg * 14, 1.0, 1.8);

  c.restore();
}

/**
 * Explosão de ruptura dimensional no ponto de ativação/saída.
 */
function drawKaelRuptureBurst(c, r) {
  const age = r.maxLife - r.life;
  const p = age / r.maxLife;
  const fade = 1 - p;

  c.save();
  c.translate(r.x, r.y);
  c.globalAlpha *= fade;

  // Anéis concêntricos de névoa abissal e ciano
  const radius = 8 + Math.sin(p * Math.PI * 0.5) * (r.isExit ? 32 : 46);
  c.save();
  c.scale(1, 0.45);
  c.strokeStyle = r.isExit ? 'rgba(168, 85, 247, 0.8)' : 'rgba(56, 189, 248, 0.8)';
  c.lineWidth = 4 * fade + 1;
  c.beginPath();
  c.ellipse(0, 0, radius, radius * 0.65, 0, 0, TAU);
  c.stroke();

  c.strokeStyle = '#ffffff';
  c.lineWidth = 1.2 * fade;
  c.beginPath();
  c.ellipse(0, 0, radius * 0.7, radius * 0.45, 0, 0, TAU);
  c.stroke();
  c.restore();

  // Lascas e farrapos astrais expulsos
  const shardCount = r.isExit ? 8 : 12;
  c.strokeStyle = '#c084fc';
  c.lineWidth = 1.2;
  c.beginPath();
  for (let i = 0; i < shardCount; i++) {
    const a = i * (TAU / shardCount) + 0.2;
    const dist = 6 + p * 34 * (0.8 + (i % 3) * 0.2);
    const sx = Math.cos(a) * dist;
    const sy = Math.sin(a) * dist * 0.7 - (1 - fade) * 6;
    c.moveTo(sx, sy);
    c.lineTo(sx - Math.cos(a) * 3, sy - Math.sin(a) * 2);
  }
  c.stroke();

  c.restore();
}

/**
 * Micro-fissura de corte espectral deixada no corpo dos inimigos atingidos.
 */
function drawKaelHitFissure(c, hf) {
  const p = (hf.maxLife - hf.life) / hf.maxLife;
  const fade = 1 - p;
  const len = 12 * (1 - p * 0.3);

  c.save();
  c.translate(hf.x, hf.y);
  c.rotate(hf.angle);
  c.globalAlpha *= fade;

  // Linha de corte branca incandescente
  c.strokeStyle = '#ffffff';
  c.lineWidth = 2.0 * fade + 0.5;
  c.beginPath();
  c.moveTo(-len, 0);
  c.lineTo(len, 0);
  c.stroke();

  // Halo violeta-espectral da fenda
  c.strokeStyle = '#a855f7';
  c.lineWidth = 4.5 * fade;
  c.stroke();

  // Losango partido no centro da ferida dimensional
  c.fillStyle = '#38bdf8';
  c.beginPath();
  c.moveTo(0, -3 * fade);
  c.lineTo(2 * fade, 0);
  c.lineTo(0, 3 * fade);
  c.lineTo(-2 * fade, 0);
  c.closePath();
  c.fill();

  c.restore();
}

/**
 * Chamado pelo pipeline de renderização na camada aérea (air / above actors).
 */
export function drawKaelPhaseAir(c, left, right, top, bottom) {
  // 1. Ecos espectrais deixados nas posições anteriores
  for (const echo of trail) {
    if (!isEffectVisible(echo, left, right, top, bottom, 50)) continue;
    drawKaelEchoSilhouette(c, echo);
  }

  // 2. Rupturas de entrada / saída
  for (const r of ruptures) {
    if (!isEffectVisible(r, left, right, top, bottom, 60)) continue;
    drawKaelRuptureBurst(c, r);
  }

  // 3. Fissuras de corte nos alvos
  for (const hf of hitFissures) {
    if (!isEffectVisible(hf, left, right, top, bottom, 30)) continue;
    drawKaelHitFissure(c, hf);
  }
}

// =============================================================================
// PRÉVIA VISUAL NO ALTAR (CHARACTER PREVIEW)
// =============================================================================

/**
 * Renderizador autônomo sem estado persistente para o Palco de Evocação da Skin.
 * @param {CanvasRenderingContext2D} c Contexto da prévia
 * @param {number} cx Centro X do herói
 * @param {number} cy Centro Y do herói
 * @param {number} heroScale Escala visual ampliada (ex: 6.6)
 * @param {number} previewSkillAge Idade do ciclo de habilidade na prévia (0 a 216 quadros)
 * @param {number} facing Direção horizontal (-1 ou 1)
 */
export function drawKaelPreviewStage(c, cx, cy, heroScale, previewSkillAge, facing = 1) {
  const duration = KAEL_ULT.duration; // 180 quadros
  const totalCycle = duration + 36;   // 216 quadros
  const age = previewSkillAge % totalCycle;

  // Apenas renderiza efeitos durante a janela ativa da habilidade
  if (age >= duration + 10) return;

  const timer = Math.max(0, duration - age);

  // 1. Fenda dimensional ancorada na base do pedestal
  drawKaelGroundRift(c, cx, cy, age, duration, heroScale * 0.42, age > duration - 16);

  // 2. Ruptura de entrada (primeiros 20 quadros)
  if (age < 26) {
    const burstFade = Math.max(0, 1 - age / 26);
    c.save();
    c.translate(cx, cy);
    c.scale(heroScale * 0.5, heroScale * 0.25);
    c.strokeStyle = `rgba(168, 85, 247, ${burstFade * 0.8})`;
    c.lineWidth = 3.5;
    c.beginPath();
    c.ellipse(0, 10, 18 + age * 1.2, 8 + age * 0.5, 0, 0, TAU);
    c.stroke();

    c.strokeStyle = `rgba(56, 189, 248, ${burstFade * 0.9})`;
    c.lineWidth = 1.2;
    c.stroke();
    c.restore();
  }

  // 3. Ecos astrais orbitais/laterais simulando velocidade sutil na prévia estática
  if (age >= 10 && age < duration - 10) {
    const echoPulse = Math.sin(age * 0.12);
    for (let e = 1; e <= 2; e++) {
      const eDist = e * 14 * echoPulse * facing;
      const eAlpha = 0.28 / e;
      c.save();
      c.translate(cx - eDist, cy + Math.sin(age * 0.15 + e) * 2);
      c.scale(facing * 0.88, 0.88);
      c.globalAlpha *= eAlpha;

      // Silhueta simplificada do capuz e capa
      c.fillStyle = '#171426';
      c.beginPath();
      c.moveTo(-3, -3); c.lineTo(-10, 14); c.lineTo(-4, 11);
      c.lineTo(-6, 16); c.lineTo(4, 12); c.lineTo(3, -3);
      c.closePath();
      c.fill();
      c.strokeStyle = '#c084fc';
      c.lineWidth = 0.8;
      c.stroke();
      c.restore();
    }
  }
}
