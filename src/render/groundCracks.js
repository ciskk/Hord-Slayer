/**
 * src/render/groundCracks.js
 * 
 * Simulador e renderizador procedural de alta performance de fendas tectônicas,
 * fraturas geológicas e solo consagrado para o Martelo Sagrado de Sir Roland.
 * Totalmente otimizado para altas taxas de cadência:
 * - Anti-stacking por proximidade (re-energização em vez de duplicação)
 * - Teto estrito de crateras simultâneas (máx 4)
 * - Polilinhas contínuas batched (redução de ~90% de draw calls)
 * - Zero alocações de gradientes a cada frame
 * - Debris batched sem chamadas a ctx.save/restore
 */
import { enemies, frameCount } from '../main.js';
import { addDamageText, createHitParticles } from '../systems/combat.js';
import { getNeighborIndices } from '../core/spatialGrid.js';
import { drawRolandShockwave } from './rolandUlt.js';
import { updateIgnisStepEffects } from './ignisUlt.js';
import { updateKaelPhaseEffects } from './kaelUlt.js';
// Separate cosmetic budget: Ignis fissures never evict Roland's damaging craters.
export { drawIgnisStepGround } from './ignisUlt.js';

// Cosmetic ULT effects have their own budget and never replace damaging craters.
export const consecratedTrail = [];
export const rolandShockwaves = [];

export function addConsecratedTrail(x, y, angle) {
  if (consecratedTrail.length >= 14) consecratedTrail.shift();
  consecratedTrail.push({ x, y, angle, life: 46 });
}

export function addRolandShockwave(x, y, radius = 76) {
  if (rolandShockwaves.length >= 3) rolandShockwaves.shift();
  rolandShockwaves.push({ x, y, radius, life: 26 });
}

export function clearRolandChargeEffects() {
  consecratedTrail.length = 0;
  rolandShockwaves.length = 0;
}

function updateRolandChargeEffects(dt) {
  for (const effects of [consecratedTrail, rolandShockwaves]) {
    for (let i = effects.length - 1; i >= 0; i--) {
      effects[i].life -= dt;
      if (effects[i].life <= 0) effects.splice(i, 1);
    }
  }
}

function drawRolandChargeGround(ctx, left, right, top, bottom) {
  for (const mark of consecratedTrail) {
    if (left !== undefined && (mark.x + 40 < left || mark.x - 40 > right || mark.y + 40 < top || mark.y - 40 > bottom)) continue;
    const age = 46 - mark.life;
    const alpha = Math.min(1, mark.life / 22);
    ctx.save(); ctx.translate(mark.x, mark.y); ctx.rotate(mark.angle);
    ctx.globalAlpha *= alpha;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-17, 0); ctx.lineTo(-9, -3); ctx.lineTo(-2, 2);
    ctx.lineTo(7, -2); ctx.lineTo(16, 0);
    ctx.moveTo(-9, -3); ctx.lineTo(-5, -9); ctx.lineTo(-10, -15);
    ctx.moveTo(7, -2); ctx.lineTo(5, 7); ctx.lineTo(11, 13);
    ctx.strokeStyle = 'rgba(39, 27, 13, 0.65)'; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = 'rgba(239, 178, 51, 0.4)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = '#ffdc83'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.strokeStyle = '#fff4d1'; ctx.lineWidth = 0.5; ctx.stroke();
    if (age < 20) {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + 0.4, d = 3 + age * 0.65;
        const x = Math.cos(a) * d, y = Math.sin(a) * d;
        ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 2, y + Math.sin(a) * 2);
      }
      ctx.strokeStyle = `rgba(255, 234, 178, ${1 - age / 20})`;
      ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.restore();
  }
  for (const wave of rolandShockwaves) {
    const r = wave.radius + 18;
    if (left !== undefined && (wave.x + r < left || wave.x - r > right || wave.y + r < top || wave.y - r > bottom)) continue;
    drawRolandShockwave(ctx, wave.x, wave.y, 26 - wave.life, wave.radius);
  }
}

function pseudoRand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const groundCraters = [];
const _craterCandidates = [];

/**
 * Adiciona ou re-energiza uma cratera de impacto telúrico no solo.
 * Se já existir uma cratera recente próxima (< 65px), re-energiza seu núcleo
 * evitando duplicações desnecessárias e sobrecarga de Canvas.
 */
export function addGroundCrater(x, y, angle = 0, radius = 50, count = 1, isEvolved = false, damage = 45) {
  // Tratamento de segurança caso chamada antiga passe radius na posição do ângulo
  if (typeof angle === 'number' && angle > 10 && radius === undefined) {
    radius = angle;
    angle = 0;
  }

  // 1. Anti-stacking: fusão de impacto em rajada no mesmo local
  for (let i = groundCraters.length - 1; i >= 0; i--) {
    const existing = groundCraters[i];
    const dx = existing.x - x;
    const dy = existing.y - y;
    if (dx * dx + dy * dy < 65 * 65) {
      existing.life = Math.max(existing.life, 90);
      existing.maxLife = Math.max(existing.maxLife, 90);
      existing.damage = Math.max(existing.damage, damage);
      existing.radius = Math.max(existing.radius, radius);
      existing.count = Math.max(existing.count || 1, count);
      existing.isEvolved = existing.isEvolved || isEvolved;
      existing.pulseTimer = 16;
      return;
    }
  }

  // 2. Limite estrito de no máximo 4 crateras ativas simultâneas
  if (groundCraters.length >= 4) {
    groundCraters.shift();
  }

  const craterLifetime = 115; // ~1.9s a 60 FPS (leitura dinâmica limpa sem poluição)

  groundCraters.push({
    x,
    y,
    angle,
    radius,
    count,
    isEvolved,
    damage,
    crackData: generateGroundCracks(angle, radius, count, isEvolved),
    life: craterLifetime,
    maxLife: craterLifetime,
    pulseTimer: 16,
    burnCooldown: 0
  });
}

/**
 * Atualiza o ciclo de vida das crateras e aplica dano residual da terra consagrada.
 */
export function updateGroundCraters(dt) {
  updateIgnisStepEffects(dt);
  updateKaelPhaseEffects(dt);
  updateRolandChargeEffects(dt);
  if (groundCraters.length === 0) return;

  for (let i = groundCraters.length - 1; i >= 0; i--) {
    const c = groundCraters[i];
    c.life -= dt;
    if (c.pulseTimer > 0) c.pulseTimer -= dt;

    if (c.life <= 0) {
      groundCraters.splice(i, 1);
      continue;
    }

    // Dano residual da Terra Consagrada a cada 28 frames
    c.burnCooldown = (c.burnCooldown || 0) + dt;
    if (c.burnCooldown >= 28) {
      c.burnCooldown = 0;
      const progress = 1 - (c.life / c.maxLife);
      if (progress < 0.65 && c.damage > 0 && typeof enemies !== 'undefined' && enemies.length > 0) {
        const burnDmg = Math.max(1, Math.round(c.damage * 0.08));
        const reachLen = (c.crackData && c.crackData.reachLength) ? c.crackData.reachLength : (c.radius || 60);
        const baseR = (c.crackData && c.crackData.baseR) ? c.crackData.baseR : 24;
        const checkRange = Math.max(reachLen, baseR * 1.5);
        const candidates = getNeighborIndices(c.x, c.y, checkRange + 35, _craterCandidates);

        const cosA = Math.cos(c.angle);
        const sinA = Math.sin(c.angle);

        for (let j = 0; j < candidates.length; j++) {
          const e = enemies[candidates[j]];
          if (!e || e.hp <= 0 || e.isTargetable === false) continue;
          const dx = e.x - c.x;
          const dy = e.y - c.y;
          const distSq = dx * dx + dy * dy;

          // 1. Inimigo dentro da base esmagada
          let isHit = (distSq <= (baseR * 1.35) * (baseR * 1.35));

          // 2. Inimigo ao longo do leque aberto de fissuras direcionais
          if (!isHit) {
            const proj = dx * cosA + dy * sinA;
            if (proj > 0 && proj <= reachLen) {
              const perp = Math.abs(-dx * sinA + dy * cosA);
              const maxPerp = Math.max(baseR * 1.0, 20 + proj * 0.95);
              if (perp <= maxPerp) {
                isHit = true;
              }
            }
          }

          if (isHit) {
            e.hp -= burnDmg;
            e.hitFlash = 2;
            if (j % 2 === 0) {
              addDamageText(e.x, e.y, burnDmg, false, '#bdc3c7');
            }
          }
        }
      }
    }
  }
}

/**
 * Renderiza todas as crateras ativas diretamente na camada do solo da arena.
 */
export function drawGroundCraters(ctx, viewLeft, viewRight, viewTop, viewBottom) {
  drawRolandChargeGround(ctx, viewLeft, viewRight, viewTop, viewBottom);
  for (let i = 0; i < groundCraters.length; i++) {
    const c = groundCraters[i];
    const reachLen = (c.crackData && c.crackData.reachLength) ? c.crackData.reachLength : (c.radius || 60);
    const maxBound = Math.max(c.radius, reachLen) + 40;
    if (viewLeft !== undefined && (c.x + maxBound < viewLeft || c.x - maxBound > viewRight || c.y + maxBound < viewTop || c.y - maxBound > viewBottom)) continue;

    const progress = 1 - (c.life / c.maxLife);
    // Transição suave: primeiros 55% vida total visível; últimos 45% fade out suave
    const fadeThreshold = 0.55;
    const alpha = progress < fadeThreshold ? 1.0 : Math.max(0, (1 - progress) / (1 - fadeThreshold));

    ctx.save();
    ctx.translate(c.x, c.y);
    drawDetailedGroundCracks(ctx, c.crackData, progress, alpha, c.angle, c.radius, c.isEvolved, 1.0, c.pulseTimer);
    ctx.restore();
  }
}

/**
 * Gera deterministicamente uma rede de fraturas geológicas e fissuras hiper-realistas:
 * - Geometria: Menos comprido (máx ~128px) e muito mais aberto (leque ~95°-105°).
 * - Alta Densidade: 8 a 11 troncos principais, múltiplas bifurcações secundárias/terciárias e trincas cruzadas.
 * - Epicentro Tectônico: Micro-trincas em 360° em torno do ponto focal de esmagamento do martelo.
 */
export function generateGroundCracks(baseAngle, radius, count = 1, isEvolved = false) {
  const safeCount = Math.max(1, Math.min(6, count || 1));
  const seed = (Math.round(baseAngle * 100) * 19 + Math.round((radius || 50) * 11) + (safeCount * 7)) % 10000;
  let s = seed + 1;
  const rnd = () => { s += 17.13; return pseudoRand(s); };

  // =========================================================================
  // 1. DIMENSÕES: Menos comprido, muito mais aberto (leque amplo ~95°-105°)
  // =========================================================================
  const baseR = (isEvolved ? 24 : 18) + Math.min(6, (safeCount - 1) * 2);
  const reachLength = isEvolved ? 128 : (78 + (safeCount - 1) * 12);
  const fanSpread = isEvolved ? 1.82 : 1.65; // ~95° a ~105° de abertura angular ampla
  const trunkCount = isEvolved ? 11 : (7 + Math.min(3, safeCount)); // Grande número de fraturas

  const primaryCracks = [];
  const secondaryCracks = [];
  const crossLinks = [];
  const epicenterCracks = [];

  // =========================================================================
  // 2. FISSURAS DIRECIONAIS PRINCIPAIS E BIFURCAÇÕES (LEQUE ABERTO)
  // =========================================================================
  for (let t = 0; t < trunkCount; t++) {
    const relProgress = trunkCount > 1 ? (t / (trunkCount - 1)) - 0.5 : 0;
    // Dispersão uniforme no leque amplo com leve jitter estocástico
    const trunkAng = baseAngle + relProgress * fanSpread + (rnd() - 0.5) * 0.12;

    // Fendas centrais ligeiramente mais profundas; laterais cobrem a periferia
    const centerFactor = 1 - Math.abs(relProgress) * 0.30;
    const len = reachLength * centerFactor * (0.85 + rnd() * 0.30);

    const segCount = isEvolved ? 7 : 5 + (rnd() > 0.5 ? 1 : 0);
    const startW = isEvolved ? 2.8 : 2.1;
    const nodes = [{ x: 0, y: 0, width: startW }];

    const perpX = -Math.sin(trunkAng);
    const perpY = Math.cos(trunkAng);
    const dirX = Math.cos(trunkAng);
    const dirY = Math.sin(trunkAng);

    let curDist = 0;
    let curPerp = 0;

    for (let n = 1; n <= segCount; n++) {
      const stepProg = n / segCount;
      curDist = len * stepProg;
      // Zigue-zague angular quebrado (fratura de pedra natural: quebras secas de 25° a 45°)
      const zigSign = (n % 2 === 0 ? 1 : -1);
      curPerp += zigSign * (3.0 + rnd() * 6.0) * (1 - stepProg * 0.3);
      const nx = dirX * curDist + perpX * curPerp;
      const ny = dirY * curDist + perpY * curPerp;
      const nw = Math.max(0.4, startW * (1 - stepProg * 0.78));
      nodes.push({ x: nx, y: ny, width: nw });
    }

    primaryCracks.push(nodes);

    // BIFURCAÇÃO 1 (Ramificação secundária intermediária mais fina)
    if (segCount >= 4 && rnd() > 0.15) {
      const branchOriginIdx = 2 + Math.floor(rnd() * (segCount - 3));
      const origin = nodes[branchOriginIdx];
      const bSign = (rnd() > 0.5 ? 1 : -1);
      const bAng = trunkAng + bSign * (0.42 + rnd() * 0.35);
      const bLen = len * (0.32 + rnd() * 0.25);
      const bNodes = [{ x: origin.x, y: origin.y, width: origin.width * 0.65 }];
      const bPerpX = -Math.sin(bAng);
      const bPerpY = Math.cos(bAng);
      const bDirX = Math.cos(bAng);
      const bDirY = Math.sin(bAng);

      const bSegs = 2 + (rnd() > 0.4 ? 1 : 0);
      for (let bn = 1; bn <= bSegs; bn++) {
        const bp = bn / bSegs;
        const bDist = bLen * bp;
        const bZig = (bn % 2 === 0 ? 1 : -1) * (2.0 + rnd() * 3.5);
        const bnx = origin.x + bDirX * bDist + bPerpX * bZig;
        const bny = origin.y + bDirY * bDist + bPerpY * bZig;
        const bnw = Math.max(0.3, origin.width * 0.55 * (1 - bp * 0.75));
        bNodes.push({ x: bnx, y: bny, width: bnw });
      }
      secondaryCracks.push(bNodes);

      // Microfissura capilar terciária
      if (rnd() > 0.45 && bNodes.length >= 2) {
        const tOrigin = bNodes[bNodes.length - 1];
        const tAng = bAng + (rnd() > 0.5 ? 0.5 : -0.5);
        const tLen = bLen * 0.35;
        secondaryCracks.push([
          { x: tOrigin.x, y: tOrigin.y, width: 0.35 },
          { x: tOrigin.x + Math.cos(tAng) * tLen, y: tOrigin.y + Math.sin(tAng) * tLen, width: 0.2 }
        ]);
      }
    }

    // BIFURCAÇÃO 2 (Segunda ramificação em troncos mais longos)
    if (segCount >= 5 && rnd() > 0.35) {
      const branchOriginIdx = Math.min(segCount - 1, 3 + Math.floor(rnd() * 2));
      const origin = nodes[branchOriginIdx];
      const bSign = (rnd() > 0.5 ? -1 : 1);
      const bAng = trunkAng + bSign * (0.45 + rnd() * 0.30);
      const bLen = len * (0.22 + rnd() * 0.20);
      const bNodes = [{ x: origin.x, y: origin.y, width: origin.width * 0.55 }];
      const bPerpX = -Math.sin(bAng);
      const bPerpY = Math.cos(bAng);
      const bDirX = Math.cos(bAng);
      const bDirY = Math.sin(bAng);

      for (let bn = 1; bn <= 2; bn++) {
        const bp = bn / 2;
        const bDist = bLen * bp;
        const bZig = (bn % 2 === 0 ? 1 : -1) * (1.8 + rnd() * 2.5);
        bNodes.push({
          x: origin.x + bDirX * bDist + bPerpX * bZig,
          y: origin.y + bDirY * bDist + bPerpY * bZig,
          width: Math.max(0.25, origin.width * 0.45 * (1 - bp * 0.75))
        });
      }
      secondaryCracks.push(bNodes);
    }
  }

  // =========================================================================
  // 3. TRINCAS TRANSVERSAIS CONCÊNTRICAS (CROSS-CRACKS / ANASTOMOSE)
  // Conecta troncos adjacentes com linhas finas e nítidas
  // =========================================================================
  for (let t = 0; t < primaryCracks.length - 1; t++) {
    if (rnd() > 0.25) {
      const crackA = primaryCracks[t];
      const crackB = primaryCracks[t + 1];
      const idxA = 1 + Math.floor(rnd() * (crackA.length - 2));
      const idxB = Math.min(crackB.length - 1, Math.max(1, idxA + (rnd() > 0.5 ? 1 : -1)));
      const pA = crackA[idxA];
      const pB = crackB[idxB];
      // Ponto intermediário quebrado
      const midX = (pA.x + pB.x) * 0.5 + (rnd() - 0.5) * 4;
      const midY = (pA.y + pB.y) * 0.5 + (rnd() - 0.5) * 4;
      crossLinks.push([
        { x: pA.x, y: pA.y, width: 0.55 },
        { x: midX, y: midY, width: 0.45 },
        { x: pB.x, y: pB.y, width: 0.55 }
      ]);
    }
  }

  // =========================================================================
  // 4. MICRO-FISSURAS RADIAIS DO EPICENTRO (360° TOTAL)
  // Estresse focal em volta do ponto de esmagamento do martelo
  // =========================================================================
  const epiCount = isEvolved ? 10 : 8;
  for (let m = 0; m < epiCount; m++) {
    const mAng = (m / epiCount) * Math.PI * 2 + (rnd() - 0.5) * 0.35;
    const mLen = baseR * (0.75 + rnd() * 0.70);
    const pX = -Math.sin(mAng);
    const pY = Math.cos(mAng);
    const dX = Math.cos(mAng);
    const dY = Math.sin(mAng);
    epicenterCracks.push([
      { x: 0, y: 0, width: 1.5 },
      { x: dX * mLen * 0.5 + pX * (rnd() - 0.5) * 2.5, y: dY * mLen * 0.5 + pY * (rnd() - 0.5) * 2.5, width: 0.9 },
      { x: dX * mLen + pX * (rnd() - 0.5) * 3.5, y: dY * mLen + pY * (rnd() - 0.5) * 3.5, width: 0.35 }
    ]);
  }

  return { baseR, reachLength, primaryCracks, secondaryCracks, crossLinks, epicenterCracks };
}

/**
 * Renderiza exclusivamente as fissuras do solo em preto puro (#000000):
 * - Sem qualquer "glow" ou mancha/sombra escura ao redor.
 * - Linhas finas, precisas e realistas com afinamento gradual.
 */
export function drawDetailedGroundCracks(ctx, crackData, progress, alpha, angle, radius, isEvolved = false, scale = 1.0, pulseTimer = 0) {
  if (!crackData) return;

  const { primaryCracks, secondaryCracks, crossLinks, epicenterCracks } = crackData;
  // Propagação rápida das fissuras: abre instantaneamente nos primeiros 7% da vida útil
  const reach = Math.min(1, Math.pow(Math.min(1, progress / 0.07), 0.55));

  ctx.save();
  if (scale !== 1.0) ctx.scale(scale, scale);

  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = '#000000';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'miter';

  // 1. Troncos principais com afinamento gradual por segmento (finos e nítidos)
  for (let t = 0; t < primaryCracks.length; t++) {
    const nodes = primaryCracks[t];
    const activeCount = Math.max(2, Math.floor(nodes.length * reach));
    for (let n = 0; n < activeCount - 1; n++) {
      const p1 = nodes[n];
      const p2 = nodes[n + 1];
      ctx.lineWidth = p1.width;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  // 2. Fissuras radiais do epicentro (360°)
  for (let m = 0; m < epicenterCracks.length; m++) {
    const nodes = epicenterCracks[m];
    const activeCount = Math.max(2, Math.floor(nodes.length * reach));
    for (let n = 0; n < activeCount - 1; n++) {
      const p1 = nodes[n];
      const p2 = nodes[n + 1];
      ctx.lineWidth = p1.width;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  // 3. Ramificações secundárias e terciárias (quando reach > 0.35)
  if (reach > 0.35) {
    const subReach = Math.min(1, (reach - 0.35) / 0.65);
    for (let s = 0; s < secondaryCracks.length; s++) {
      const nodes = secondaryCracks[s];
      const activeCount = Math.max(2, Math.floor(nodes.length * subReach));
      for (let n = 0; n < activeCount - 1; n++) {
        const p1 = nodes[n];
        const p2 = nodes[n + 1];
        ctx.lineWidth = p1.width;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  }

  // 4. Trincas cruzadas concêntricas (Anastomose)
  if (reach > 0.50) {
    const linkReach = Math.min(1, (reach - 0.50) / 0.50);
    const activeLinks = Math.floor(crossLinks.length * linkReach);
    ctx.lineWidth = 0.55;
    for (let c = 0; c < activeLinks; c++) {
      const link = crossLinks[c];
      ctx.beginPath();
      ctx.moveTo(link[0].x, link[0].y);
      ctx.lineTo(link[1].x, link[1].y);
      ctx.lineTo(link[2].x, link[2].y);
      ctx.stroke();
    }
  }

  ctx.restore();
}


