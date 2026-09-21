/**
 * src/entities/bosses/vampireLord/render.js
 * Renderização procedural vetorial completa e cinemática do Lorde Vampírico (Boss 1).
 */
import { dpr, viewW, viewH, bannerCtx } from '../../../main.js';
import { getHudBottom } from '../../../core/responsive.js';

// ============================================================================
// 1. INTRODUÇÃO CINEMATOGRÁFICA DE 5 SEGUNDOS (300 FRAMES) EM 4 ATOS
// ============================================================================

/**
 * Desenha o Selo Vampírico Sagrado no solo com anéis concêntricos, pentagrama e runas.
 */
function drawSummoningCircle(ctx, e, progress, frameCount) {
  const R = e.radius * 2.4;
  const sealScale = Math.min(1.0, progress * 2.2);
  const curR = R * sealScale;
  const rot = frameCount * 0.02;

  ctx.save();
  // Elipse projetada no solo 2.5D
  ctx.translate(0, 36);
  ctx.scale(1, 0.46);

  // Brilho difuso do selo
  const sealGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, curR * 1.3);
  sealGlow.addColorStop(0, 'rgba(255, 23, 68, 0.45)');
  sealGlow.addColorStop(0.5, 'rgba(142, 68, 173, 0.25)');
  sealGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sealGlow;
  ctx.beginPath();
  ctx.arc(0, 0, curR * 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Anel exterior principal
  ctx.strokeStyle = `rgba(255, 23, 68, ${0.4 + progress * 0.55})`;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(0, 0, curR, 0, Math.PI * 2);
  ctx.stroke();

  // Anel interno pontilhado em contra-rotação
  ctx.strokeStyle = 'rgba(255, 107, 129, 0.75)';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, curR * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Pentagrama / Estrela de Sangue no centro do selo
  ctx.save();
  ctx.rotate(rot);
  ctx.strokeStyle = 'rgba(255, 23, 68, 0.85)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  const starPoints = 5;
  const starR = curR * 0.78;
  for (let i = 0; i < starPoints; i++) {
    const a1 = (i * 2 * Math.PI * 2) / starPoints - Math.PI / 2;
    const a2 = ((i + 1) * 2 * Math.PI * 2) / starPoints - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a1) * starR, Math.sin(a1) * starR);
    ctx.lineTo(Math.cos(a2) * starR, Math.sin(a2) * starR);
  }
  ctx.stroke();

  // Glifos e runas orbitando a estrela
  const glyphCount = 8;
  for (let g = 0; g < glyphCount; g++) {
    const ga = (g * Math.PI * 2) / glyphCount - rot * 1.5;
    const gx = Math.cos(ga) * curR * 0.92;
    const gy = Math.sin(ga) * curR * 0.92;
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(gx - 2.5, gy - 2.5, 5, 5);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(gx - 2.5, gy - 2.5, 5, 5);
  }
  ctx.restore();

  // 8 Canais de sangue fluindo do centro para as bordas
  for (let c = 0; c < 8; c++) {
    const cAng = (c * Math.PI * 2) / 8 + rot * 0.4;
    ctx.strokeStyle = 'rgba(255, 71, 87, 0.65)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(cAng) * curR, Math.sin(cAng) * curR);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renderiza a cena de invocação de 5 segundos (4 Atos) do Lorde Vampírico.
 */
function drawVampireSpawnIntro(ctx, e, frameCount) {
  const introMax = e.introDuration || 300;
  const progress = Math.min(1.0, Math.max(0, 1 - (e.introTimer / introMax)));

  // Selo constante no solo evoluindo com o progresso
  drawSummoningCircle(ctx, e, progress, frameCount);

  // =========================================================================
  // ATO 1: O SELO CARMESIM & ECLIPSE (0.00 <= progress < 0.24)
  // =========================================================================
  if (progress < 0.24) {
    const act1Prog = progress / 0.24;
    const riftH = 80 * act1Prog;
    const riftW = 8 + Math.sin(frameCount * 0.3) * 4;

    ctx.save();
    const riftGrad = ctx.createLinearGradient(0, -riftH, 0, riftH);
    riftGrad.addColorStop(0, 'rgba(255, 23, 68, 0)');
    riftGrad.addColorStop(0.5, 'rgba(255, 23, 68, 0.95)');
    riftGrad.addColorStop(1, 'rgba(255, 23, 68, 0)');
    ctx.strokeStyle = riftGrad;
    ctx.lineWidth = riftW;
    ctx.beginPath();
    ctx.moveTo(0, -riftH + 20);
    ctx.lineTo(0, riftH + 20);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -riftH * 0.7 + 20);
    ctx.lineTo(0, riftH * 0.7 + 20);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // =========================================================================
  // ATO 2: VÓRTICE DAS TREVAS & OLHOS ESPECTRAIS (0.24 <= progress < 0.50)
  // =========================================================================
  if (progress < 0.50) {
    const act2Prog = (progress - 0.24) / 0.26;
    const colHeight = 150 * act2Prog;
    const colWidth = 45 + Math.sin(frameCount * 0.2) * 8;

    ctx.save();
    const colGrad = ctx.createLinearGradient(-colWidth, 0, colWidth, 0);
    colGrad.addColorStop(0, 'rgba(10, 1, 3, 0)');
    colGrad.addColorStop(0.2, 'rgba(28, 2, 8, 0.85)');
    colGrad.addColorStop(0.5, 'rgba(74, 5, 18, 0.95)');
    colGrad.addColorStop(0.8, 'rgba(28, 2, 8, 0.85)');
    colGrad.addColorStop(1, 'rgba(10, 1, 3, 0)');
    ctx.fillStyle = colGrad;
    ctx.fillRect(-colWidth, -colHeight + 30, colWidth * 2, colHeight);

    ctx.strokeStyle = 'rgba(255, 23, 68, 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-colWidth, -colHeight + 30, colWidth * 2, colHeight);

    // Morcegos em espiral ascendente rápida
    const batCount = 14;
    ctx.fillStyle = '#0a0104';
    for (let b = 0; b < batCount; b++) {
      const bProgress = ((frameCount * 0.04 + b / batCount) % 1);
      const bY = 30 - bProgress * (colHeight + 30);
      const bAngle = bProgress * Math.PI * 6 + b;
      const bX = Math.sin(bAngle) * (colWidth * 0.85);
      const flap = Math.sin(frameCount * 0.6 + b) * 5;

      ctx.beginPath();
      ctx.moveTo(bX, bY);
      ctx.lineTo(bX - 6, bY - 4 + flap);
      ctx.lineTo(bX - 2, bY + 3);
      ctx.lineTo(bX + 2, bY + 3);
      ctx.lineTo(bX + 6, bY - 4 + flap);
      ctx.closePath();
      ctx.fill();
    }

    // Silhueta escura do Lorde Vampírico se formando no interior
    const silAlpha = act2Prog * 0.8;
    ctx.globalAlpha = silAlpha;
    ctx.fillStyle = '#060002';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Olhos vermelhos incandescentes cortando as trevas
    if (act2Prog > 0.35) {
      const eyeFlare = Math.sin(frameCount * 0.3) * 3;
      ctx.fillStyle = '#ff0037';
      ctx.beginPath();
      ctx.ellipse(-6, -14, 4 + eyeFlare * 0.5, 2.5, 0.2, 0, Math.PI * 2);
      ctx.ellipse(6, -14, 4 + eyeFlare * 0.5, 2.5, -0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 23, 68, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-6, -14);
      ctx.lineTo(-28 - eyeFlare * 2, -18);
      ctx.moveTo(6, -14);
      ctx.lineTo(28 + eyeFlare * 2, -18);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-7, -15, 2, 2);
      ctx.fillRect(5, -15, 2, 2);
    }
    ctx.restore();
    return;
  }

  // =========================================================================
  // ATO 3: DESDOBRAR DE ASAS & BANNER IMPERIAL (0.50 <= progress < 0.76)
  // ATO 4: RUGIDO PREDATÓRIO & IMPACTO (0.76 <= progress <= 1.00)
  // =========================================================================
  const wingProg = (progress - 0.50) / 0.50;
  const wingSpan = 0.3 + Math.min(1.0, wingProg * 1.6) * 1.15;
  const flap = Math.sin(frameCount * 0.2) * 12 * (1 - wingProg * 0.3);
  const bob = Math.sin(frameCount * 0.1) * 3;

  ctx.save();
  if (progress < 0.76) {
    const mistAlpha = Math.max(0, 1 - (progress - 0.5) / 0.26);
    ctx.fillStyle = `rgba(20, 2, 8, ${mistAlpha * 0.55})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 50, 70, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSingleWing(ctx, -1, flap, wingSpan, false, false, frameCount);
  drawSingleWing(ctx, 1, flap, wingSpan, false, false, frameCount);

  drawFluidCape(ctx, bob, frameCount, false, false);
  drawGothicArmor(ctx, bob, frameCount, false, false);
  drawAristocraticJabot(ctx, bob, frameCount, false, false);
  drawHeadAndFace(ctx, bob, frameCount, false, false);
  drawClawsAndArms(ctx, bob, frameCount, false, false, progress >= 0.76, false);
  ctx.restore();
}

/**
 * Banner Cinematográfico de Título do Lorde Vampírico.
 */
function drawCinematicScreenTitle(ctx, e, frameCount) {
  const maxT = e.titleMaxTimer || 180;
  const titleProgress = 1 - Math.max(0, e.titleTimer / maxT);

  // Easing suave de Fade In e Fade Out (Curva Smoothstep)
  const inRatio = Math.min(1.0, Math.max(0, titleProgress / 0.18));
  const inEase = inRatio * inRatio * (3 - 2 * inRatio);

  const outRatio = Math.min(1.0, Math.max(0, (1 - titleProgress) / 0.22));
  const outEase = outRatio * outRatio * (3 - 2 * outRatio);

  const bannerAlpha = inEase * outEase;
  if (bannerAlpha <= 0.001) return;

  const screenW = viewW || (typeof window !== 'undefined' ? window.innerWidth : 1280);
  const screenH = viewH || (typeof window !== 'undefined' ? window.innerHeight : 800);
  const isVertical = screenH > screenW || screenW < 640;
  const isCompactH = screenH < 520;
  const hudBottom = getHudBottom();

  const centerX = screenW / 2;
  const contentW = isVertical 
    ? Math.min(screenW - 24, 380) 
    : (isCompactH ? Math.min(screenW - 48, 680) : Math.min(screenW - 64, 880));
  const bannerH = isVertical ? 62 : (isCompactH ? 58 : 96);

  // Fade estendido nas laterais: asas amplas que se estendem e dissolvem suavemente
  const fadeWing = isVertical ? 50 : Math.max(160, screenW * 0.22);
  const totalW = contentW + fadeWing * 2;
  const startX = centerX - totalW / 2;
  const endX = centerX + totalW / 2;

  const calculatedY = Math.round((screenH / 2) - bannerH - (isVertical ? 45 : (isCompactH ? 20 : 75)));
  const by = Math.max(hudBottom + 8, calculatedY);
  const centerY = by + bannerH / 2;

  // Animação de transição: desliza suavemente do topo na entrada e flutua na saída
  const entrySlideY = (1 - inEase) * -12;
  const exitSlideY = (1 - outEase) * -8;
  const ambientFloat = Math.sin(frameCount * 0.04) * 1.5;
  const animOffsetY = entrySlideY + exitSlideY + ambientFloat;
  const animScaleX = (0.93 + 0.07 * inEase) * (1.0 + (1 - outEase) * 0.025);

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = bannerAlpha;

  // Aplica movimento sutil com pivô central no banner
  ctx.translate(centerX, centerY + animOffsetY);
  ctx.scale(animScaleX, 1.0);
  ctx.translate(-centerX, -centerY);

  // 1. Fundo de Veludo Carmesim e Obsidiana com Fade Estendido nas Laterais
  const bgGrad = ctx.createLinearGradient(startX, by, endX, by);
  bgGrad.addColorStop(0, 'rgba(12, 1, 3, 0)');
  bgGrad.addColorStop(0.12, 'rgba(20, 2, 6, 0.22)');
  bgGrad.addColorStop(0.28, 'rgba(38, 4, 11, 0.90)');
  bgGrad.addColorStop(0.50, 'rgba(64, 5, 18, 0.98)');
  bgGrad.addColorStop(0.72, 'rgba(38, 4, 11, 0.90)');
  bgGrad.addColorStop(0.88, 'rgba(20, 2, 6, 0.22)');
  bgGrad.addColorStop(1, 'rgba(12, 1, 3, 0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(startX, by, totalW, bannerH);

  // 2. Frisos de Neon Escarlate Superior e Inferior com Taper Suave nas Pontas
  const lineStart = startX + fadeWing * 0.25;
  const lineEnd = endX - fadeWing * 0.25;
  const borderGrad = ctx.createLinearGradient(lineStart, by, lineEnd, by);
  borderGrad.addColorStop(0, 'rgba(255, 23, 68, 0)');
  borderGrad.addColorStop(0.18, 'rgba(255, 23, 68, 0.65)');
  borderGrad.addColorStop(0.35, 'rgba(255, 23, 68, 0.95)');
  borderGrad.addColorStop(0.50, 'rgba(255, 107, 129, 1.0)');
  borderGrad.addColorStop(0.65, 'rgba(255, 23, 68, 0.95)');
  borderGrad.addColorStop(0.82, 'rgba(255, 23, 68, 0.65)');
  borderGrad.addColorStop(1, 'rgba(255, 23, 68, 0)');

  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = isVertical ? 2.0 : 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(lineStart, by);
  ctx.lineTo(lineEnd, by);
  ctx.moveTo(lineStart, by + bannerH);
  ctx.lineTo(lineEnd, by + bannerH);
  ctx.stroke();

  // Frisos internos com acabamento dourado e fade nas pontas
  const innerStart = centerX - contentW * 0.44;
  const innerEnd = centerX + contentW * 0.44;
  const innerGrad = ctx.createLinearGradient(innerStart, by, innerEnd, by);
  innerGrad.addColorStop(0, 'rgba(241, 196, 15, 0)');
  innerGrad.addColorStop(0.20, 'rgba(241, 196, 15, 0.45)');
  innerGrad.addColorStop(0.50, 'rgba(255, 234, 167, 0.75)');
  innerGrad.addColorStop(0.80, 'rgba(241, 196, 15, 0.45)');
  innerGrad.addColorStop(1, 'rgba(241, 196, 15, 0)');

  ctx.strokeStyle = innerGrad;
  ctx.lineWidth = 1.2;
  const innerPadY = isVertical ? 3.5 : 5;
  ctx.beginPath();
  ctx.moveTo(innerStart, by + innerPadY);
  ctx.lineTo(innerEnd, by + innerPadY);
  ctx.moveTo(innerStart, by + bannerH - innerPadY);
  ctx.lineTo(innerEnd, by + bannerH - innerPadY);
  ctx.stroke();

  // Detalhes heráldicos em losango nas extremidades dos frisos internos
  [-contentW * 0.42, contentW * 0.42].forEach(ox => {
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.moveTo(centerX + ox, by);
    ctx.lineTo(centerX + ox + 3, by - 3);
    ctx.lineTo(centerX + ox + 6, by);
    ctx.lineTo(centerX + ox + 3, by + 3);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX + ox, by + bannerH);
    ctx.lineTo(centerX + ox + 3, by + bannerH - 3);
    ctx.lineTo(centerX + ox + 6, by + bannerH);
    ctx.lineTo(centerX + ox + 3, by + bannerH + 3);
    ctx.closePath();
    ctx.fill();
  });

  // Ornamento Central Superior: Brasão Gótico / Rubi
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.moveTo(centerX, by - 8);
  ctx.lineTo(centerX + 10, by);
  ctx.lineTo(centerX, by + 8);
  ctx.lineTo(centerX - 10, by);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff1744';
  ctx.beginPath();
  ctx.arc(centerX, by, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 3. Tipografia Majestosa
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const titleY = by + (isVertical ? 23 : 37);
  ctx.font = isVertical ? '900 21px "Cinzel", "Times New Roman", serif' : '900 34px "Cinzel", "Times New Roman", serif';
  ctx.fillStyle = 'rgba(255, 23, 68, 0.5)';
  ctx.fillText('LORDE VAMPÍRICO', centerX + 1, titleY + 1.5);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('LORDE VAMPÍRICO', centerX, titleY);

  ctx.font = isVertical ? '600 10px "Cinzel", sans-serif' : '700 13px "Cinzel", sans-serif';
  ctx.letterSpacing = isVertical ? '3px' : '6px';
  ctx.fillStyle = '#f1c40f';
  ctx.fillText('SOBERANO DA ESTIRPE CARMESIM', centerX, by + (isVertical ? 45 : 71));
  ctx.letterSpacing = '0px';

  ctx.restore();
}

// ============================================================================
// 2. SISTEMA DE RENDERIZAÇÃO PROCEDURAL VETORIAL
// ============================================================================

function drawTeleportDeparture(ctx, e, frameCount) {
  const progress = Math.max(0, Math.min(1, 1 - (e.teleportResolveTimer / 50)));
  const alpha = Math.max(0, 1 - progress * 1.4);
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = 'rgba(26, 2, 8, 0.75)';
  ctx.beginPath();
  ctx.ellipse(0, 20, e.radius * (1 - progress * 0.6), 10, 0, 0, Math.PI * 2);
  ctx.fill();

  const batCount = 12;
  ctx.fillStyle = '#0a0104';
  for (let i = 0; i < batCount; i++) {
    const angle = (i * Math.PI * 2 / batCount) + frameCount * 0.12;
    const dist = progress * (e.radius * 2.5) + 8;
    const bx = Math.cos(angle) * dist;
    const by = Math.sin(angle) * dist * 0.6 - progress * 28;
    const flap = Math.sin(frameCount * 0.55 + i) * 6;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 7, by - 4 + flap);
    ctx.lineTo(bx - 2, by + 3);
    ctx.lineTo(bx + 2, by + 3);
    ctx.lineTo(bx + 7, by - 4 + flap);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff1744';
    ctx.fillRect(bx - 1, by - 1, 1.5, 1.5);
    ctx.fillStyle = '#0a0104';
  }
  ctx.restore();
}

function drawMistVortex(ctx, e, frameCount) {
  const t = frameCount * 0.18;

  // Renderização de Pós-Imagens (Ghost Afterimages)
  if (e.afterImages && e.afterImages.length > 0) {
    for (let i = 0; i < e.afterImages.length; i++) {
      const ai = e.afterImages[i];
      const aiAlpha = Math.max(0, (ai.life / ai.maxLife) * 0.45);
      ctx.save();
      ctx.translate(ai.x - e.x, ai.y - e.y);
      ctx.scale(ai.facing, 1);
      ctx.globalAlpha = aiAlpha;
      ctx.fillStyle = '#8e44ad';
      ctx.beginPath();
      ctx.ellipse(0, 0, e.radius * 0.9, e.radius * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Núcleo volumétrico do cometa de névoa
  for (let c = 0; c < 4; c++) {
    const rOffset = Math.sin(t + c * 1.6) * 6;
    ctx.fillStyle = c === 0 
      ? 'rgba(142, 68, 173, 0.45)' 
      : (c === 1 ? 'rgba(180, 15, 45, 0.45)' : (c === 2 ? 'rgba(255, 23, 68, 0.35)' : 'rgba(15, 1, 4, 0.65)'));
    ctx.beginPath();
    ctx.ellipse((c - 1.5) * 10, (c % 2 === 0 ? 5 : -5), (e.radius * 1.05) + rOffset, (e.radius * 0.70) - rOffset * 0.5, t * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Morcegos espectrais com olhos incandescentes
  const batCount = 8;
  ctx.fillStyle = '#0a0104';
  for (let i = 0; i < batCount; i++) {
    const phase = t * 2.2 + i * (Math.PI * 2 / batCount);
    const bx = Math.cos(phase) * (e.radius * 0.85);
    const by = Math.sin(phase) * (e.radius * 0.50);
    const flap = Math.sin(frameCount * 0.5 + i) * 6;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 8, by - 5 + flap);
    ctx.lineTo(bx - 3, by + 4);
    ctx.lineTo(bx + 3, by + 4);
    ctx.lineTo(bx + 8, by - 5 + flap);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff1744';
    ctx.fillRect(bx - 1.5, by - 1, 1.4, 1.4);
    ctx.fillRect(bx + 0.5, by - 1, 1.4, 1.4);
    ctx.fillStyle = '#0a0104';
  }
}

function drawVulnerabilityGliph(ctx, e, frameCount) {
  const pulse = Math.sin(frameCount * 0.18) * 3;
  const R = e.radius * 0.95 + pulse;

  ctx.strokeStyle = '#f1c40f';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, 40, R, 15, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(241, 196, 15, 0.15)';
  ctx.fill();

  const runeCount = 5;
  const rot = frameCount * 0.025;
  ctx.lineWidth = 1.8;
  for (let k = 0; k < runeCount; k++) {
    const a = rot + (k * Math.PI * 2 / runeCount);
    const rx = Math.cos(a) * R;
    const ry = 40 + Math.sin(a) * 15;
    ctx.beginPath();
    ctx.moveTo(rx - 3, ry - 3);
    ctx.lineTo(rx + 3, ry + 3);
    ctx.moveTo(rx + 3, ry - 3);
    ctx.lineTo(rx - 3, ry + 3);
    ctx.stroke();
  }
}

/**
 * Renderiza a Coroa Imperial de Ferro Negro & Rubi de Sangue na fronte do Lorde.
 */
function drawImperialCrown(ctx, headY, bob, frameCount, isVuln, isEnraged) {
  ctx.save();
  const crownBaseY = headY - 15;
  const pulse = Math.sin(frameCount * (isEnraged ? 0.22 : 0.12));
  
  const goldTrim = isVuln ? '#634c02' : (isEnraged ? '#ff4757' : '#f1c40f');
  const ironBase = isVuln ? '#0d0407' : (isEnraged ? '#350610' : '#141416');
  const ironHighlight = isVuln ? '#240a12' : (isEnraged ? '#700c22' : '#323438');

  // 1. Arco inferior da tiara / diadema gótico
  ctx.fillStyle = ironBase;
  ctx.beginPath();
  ctx.moveTo(-13, crownBaseY);
  ctx.quadraticCurveTo(0, crownBaseY - 3, 13, crownBaseY);
  ctx.lineTo(11, crownBaseY + 4);
  ctx.quadraticCurveTo(0, crownBaseY + 1, -11, crownBaseY + 4);
  ctx.closePath();
  ctx.fill();
  
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // 2. Os 5 Espigões Reais de Ferro e Ouro (Fleurons Góticos)
  const spikes = [
    { x: -11, w: 3.5, h: 8, slant: -2 },
    { x: -6,  w: 4.0, h: 14, slant: -1 },
    { x: 0,   w: 5.0, h: 20 + (isEnraged ? 3 : 0), slant: 0 },
    { x: 6,   w: 4.0, h: 14, slant: 1 },
    { x: 11,  w: 3.5, h: 8, slant: 2 }
  ];

  for (let i = 0; i < spikes.length; i++) {
    const sp = spikes[i];
    const tipX = sp.x + sp.slant;
    const tipY = crownBaseY - sp.h;

    // Gradiente metálico nos espigões
    const spGrad = ctx.createLinearGradient(sp.x, crownBaseY, tipX, tipY);
    spGrad.addColorStop(0, ironBase);
    spGrad.addColorStop(0.5, ironHighlight);
    spGrad.addColorStop(1, isEnraged ? '#ff1744' : goldTrim);

    ctx.fillStyle = spGrad;
    ctx.beginPath();
    ctx.moveTo(sp.x - sp.w * 0.5, crownBaseY);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(sp.x + sp.w * 0.5, crownBaseY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = goldTrim;
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // Brilho especular no ápice do espigão central
    if (i === 2) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(tipX - 1, tipY - 1, 2, 2);
    }
  }

  // 3. Rubi Central Imperial na Fronte
  const rubyY = crownBaseY + 1;
  const rubyR = 3.2 + (isEnraged ? pulse * 0.6 : pulse * 0.3);

  // Halo do rubi da coroa
  const rubyGlow = ctx.createRadialGradient(0, rubyY, 1, 0, rubyY, rubyR * 2.6);
  rubyGlow.addColorStop(0, isEnraged ? 'rgba(255, 0, 55, 0.85)' : 'rgba(231, 76, 60, 0.7)');
  rubyGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = rubyGlow;
  ctx.beginPath();
  ctx.arc(0, rubyY, rubyR * 2.6, 0, Math.PI * 2);
  ctx.fill();

  // Engaste dourado
  ctx.fillStyle = goldTrim;
  ctx.beginPath();
  ctx.arc(0, rubyY, rubyR + 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Pedra lapidada
  ctx.fillStyle = isVuln ? '#4a0815' : (isEnraged ? '#ff0037' : '#ff1744');
  ctx.beginPath();
  ctx.arc(0, rubyY, rubyR, 0, Math.PI * 2);
  ctx.fill();

  // Ponto especular de lapidação
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-1, rubyY - 1.5, 1.4, 1.4);

  // Micro-fagulhas do modo Enraged emanando da coroa
  if (isEnraged && Math.floor(frameCount) % 4 === 0) {
    const sparkX = (Math.random() - 0.5) * 26;
    const sparkY = crownBaseY - 10 - Math.random() * 12;
    ctx.fillStyle = '#ff7675';
    ctx.fillRect(sparkX, sparkY, 1.8, 1.8);
  }

  ctx.restore();
}

/**
 * Renderiza o Jabot Aristocrático Vitoriano em Seda Pura com Camafeu Imperial.
 */
function drawAristocraticJabot(ctx, bob, frameCount, isVuln, isEnraged) {
  ctx.save();
  const jY = -20 + bob;
  const sway = Math.sin(frameCount * 0.12) * 1.5;

  const laceBorder = isVuln ? '#718093' : '#dcdde1';
  const laceBody1 = isVuln ? '#8395a7' : '#f5f6fa';
  const laceBody2 = isVuln ? '#95a5a6' : '#ffffff';
  const goldTrim = isVuln ? '#634c02' : (isEnraged ? '#ff4757' : '#f1c40f');

  // 1. Três camadas escalonadas de babados de seda (Jabot Rococó)
  const tiers = [
    { w: 16, h: 7, yOff: 0, col: laceBorder },
    { w: 12, h: 13, yOff: 4, col: laceBody1 },
    { w: 8, h: 18, yOff: 9, col: laceBody2 }
  ];

  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    const topY = jY + t.yOff;
    const botY = jY + t.yOff + t.h;

    ctx.fillStyle = t.col;
    ctx.beginPath();
    ctx.moveTo(-t.w * 0.5, topY);
    ctx.quadraticCurveTo(-t.w * 0.6 + sway * 0.4, (topY + botY) * 0.5, -t.w * 0.2 + sway, botY);
    ctx.lineTo(t.w * 0.2 + sway, botY);
    ctx.quadraticCurveTo(t.w * 0.6 + sway * 0.4, (topY + botY) * 0.5, t.w * 0.5, topY);
    ctx.closePath();
    ctx.fill();

    // Fricção de sombra nas dobras do tecido
    ctx.strokeStyle = 'rgba(47, 53, 66, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0 + sway * 0.5, topY);
    ctx.lineTo(sway, botY);
    ctx.stroke();

    // Contorno fino de renda
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // 2. Correntes Douradas em Arco Duplo suspensas sob o broche
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-7, jY + 4);
  ctx.quadraticCurveTo(0, jY + 12, 7, jY + 4);
  ctx.moveTo(-9, jY + 6);
  ctx.quadraticCurveTo(0, jY + 16, 9, jY + 6);
  ctx.stroke();

  // 3. Broche Imperial com Camafeu de Crânio / Rubi
  ctx.fillStyle = goldTrim;
  ctx.beginPath();
  ctx.ellipse(0, jY + 2, 4.2, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isEnraged ? '#ff0037' : '#800020';
  ctx.beginPath();
  ctx.ellipse(0, jY + 2, 3.0, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mini-camafeu (silhueta de crânio/gema no centro)
  ctx.fillStyle = '#f5f6fa';
  ctx.fillRect(-1, jY + 1, 2, 1.6);
  ctx.fillRect(-0.6, jY + 2.6, 1.2, 0.8);

  ctx.restore();
}

/**
 * Renderiza as Asas Secundárias Inferiores ativadas no modo FÚRIA (Metamorfose Hexa-Alar).
 */
function drawSecondaryWings(ctx, flap, span, frameCount) {
  const secFlap = Math.sin(frameCount * 0.28 + 0.8) * 10;
  const secSpan = span * 0.72;

  ctx.save();
  for (let s of [-1, 1]) {
    ctx.save();
    ctx.scale(s, 1);
    ctx.translate(0, 14); // Origem mais baixa no dorso

    const boneCol = '#590a18';
    const boneHighlight = '#c0392b';
    const rootX = -6;
    const rootY = 0;
    const elbowX = -38 * secSpan;
    const elbowY = (-25 + secFlap) * secSpan;

    const tip1X = -72 * secSpan;
    const tip1Y = (-10 + secFlap * 1.2) * secSpan;
    const tip2X = -65 * secSpan;
    const tip2Y = (28 + secFlap * 0.9) * secSpan;
    const tip3X = -45 * secSpan;
    const tip3Y = (58 + secFlap * 0.5) * secSpan;

    // Membrana translúcida com degradê carmesim
    const secGrad = ctx.createRadialGradient(elbowX, elbowY, 5, elbowX, elbowY, 65 * secSpan);
    secGrad.addColorStop(0, 'rgba(255, 23, 68, 0.75)');
    secGrad.addColorStop(0.5, 'rgba(180, 15, 45, 0.85)');
    secGrad.addColorStop(1, 'rgba(45, 3, 10, 0.9)');

    ctx.fillStyle = secGrad;
    ctx.beginPath();
    ctx.moveTo(rootX, rootY);
    ctx.lineTo(elbowX, elbowY);
    ctx.lineTo(tip1X, tip1Y);
    ctx.quadraticCurveTo(tip1X + 10 * secSpan, tip1Y + 20 * secSpan, tip2X, tip2Y);
    ctx.quadraticCurveTo(tip2X + 8 * secSpan, tip2Y + 16 * secSpan, tip3X, tip3Y);
    ctx.quadraticCurveTo(tip3X + 10 * secSpan, tip3Y - 10 * secSpan, rootX, rootY + 30);
    ctx.closePath();
    ctx.fill();

    // Nervuras de sangue
    ctx.strokeStyle = 'rgba(255, 71, 87, 0.7)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(elbowX, elbowY);
    ctx.quadraticCurveTo(elbowX - 5, elbowY + 15, tip1X, tip1Y);
    ctx.moveTo(elbowX, elbowY);
    ctx.quadraticCurveTo(elbowX, elbowY + 30, tip2X, tip2Y);
    ctx.moveTo(elbowX * 0.6, elbowY * 0.6 + 5);
    ctx.quadraticCurveTo(elbowX + 10, elbowY + 45, tip3X, tip3Y);
    ctx.stroke();

    // Ossatura
    ctx.strokeStyle = boneCol;
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(rootX, rootY);
    ctx.lineTo(elbowX, elbowY);
    ctx.lineTo(tip1X, tip1Y);
    ctx.moveTo(elbowX, elbowY);
    ctx.lineTo(tip2X, tip2Y);
    ctx.moveTo(elbowX, elbowY);
    ctx.lineTo(tip3X, tip3Y);
    ctx.stroke();

    // Brilho no osso
    ctx.strokeStyle = boneHighlight;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rootX, rootY - 1);
    ctx.lineTo(elbowX, elbowY - 1);
    ctx.lineTo(tip1X + 2, tip1Y - 1);
    ctx.stroke();

    // Garras nas pontas das falanges
    ctx.fillStyle = '#ff4757';
    for (let d of [[tip1X, tip1Y], [tip2X, tip2Y], [tip3X, tip3Y]]) {
      ctx.beginPath();
      ctx.arc(d[0], d[1], 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(d[0] - 0.8, d[1] - 0.8, 1.6, 1.6);
      ctx.fillStyle = '#ff4757';
    }

    ctx.restore();
  }
  ctx.restore();
}

/**
 * Renderiza uma asa individual com transluscência de sangue (Subsurface Scattering) e ossatura articulada.
 */
function drawSingleWing(ctx, side, flap, span, isVuln, isEnraged, frameCount = 0) {
  ctx.save();
  ctx.scale(side, 1);

  const boneCol = isVuln ? '#1a0b12' : (isEnraged ? '#590a18' : '#1a040b');
  const boneHighlight = isVuln ? '#3a1b25' : (isEnraged ? '#ff4757' : '#b38f4d');
  const veinCol = isVuln ? 'rgba(70, 10, 20, 0.3)' : (isEnraged ? 'rgba(255, 71, 87, 0.85)' : 'rgba(231, 76, 60, 0.55)');

  const rootX = -8;
  const rootY = -18;
  const elbowX = -52 * span;
  const elbowY = (-62 + flap) * span;

  // 4 Falanges alongadas de morcego gótico
  const tip1X = -98 * span;
  const tip1Y = (-50 + flap * 1.35) * span;
  const tip2X = -92 * span;
  const tip2Y = (-2 + flap * 1.05) * span;
  const tip3X = -72 * span;
  const tip3Y = (36 + flap * 0.7) * span;
  const tip4X = -44 * span;
  const tip4Y = (64 + flap * 0.3) * span;

  // 1. Membrana alar principal com efeito Subsurface Scattering (Luz translúcida através da carne de sangue)
  const sssGrad = ctx.createRadialGradient(elbowX * 0.7, elbowY * 0.6, 8, elbowX, elbowY, 115 * span);
  if (isVuln) {
    sssGrad.addColorStop(0, 'rgba(45, 10, 20, 0.8)');
    sssGrad.addColorStop(0.4, 'rgba(25, 4, 10, 0.85)');
    sssGrad.addColorStop(1, 'rgba(12, 2, 5, 0.95)');
  } else if (isEnraged) {
    sssGrad.addColorStop(0, 'rgba(255, 40, 80, 0.92)');
    sssGrad.addColorStop(0.35, 'rgba(210, 15, 45, 0.90)');
    sssGrad.addColorStop(0.75, 'rgba(120, 8, 26, 0.92)');
    sssGrad.addColorStop(1, 'rgba(40, 3, 9, 0.98)');
  } else {
    sssGrad.addColorStop(0, 'rgba(255, 23, 68, 0.82)');
    sssGrad.addColorStop(0.35, 'rgba(150, 10, 35, 0.86)');
    sssGrad.addColorStop(0.75, 'rgba(74, 5, 18, 0.90)');
    sssGrad.addColorStop(1, 'rgba(22, 2, 6, 0.95)');
  }

  ctx.fillStyle = sssGrad;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(tip1X, tip1Y);
  ctx.quadraticCurveTo(tip1X + 14 * span, tip1Y + 24 * span, tip2X, tip2Y);
  ctx.quadraticCurveTo(tip2X + 12 * span, tip2Y + 20 * span, tip3X, tip3Y);
  ctx.quadraticCurveTo(tip3X + 14 * span, tip3Y + 18 * span, tip4X, tip4Y);
  ctx.quadraticCurveTo(tip4X + 15 * span, tip4Y - 12 * span, rootX, rootY + 40);
  ctx.closePath();
  ctx.fill();

  // 2. Sombra e volume de profundidade na dobra da asa
  const shadeGrad = ctx.createLinearGradient(rootX, rootY, elbowX, elbowY);
  shadeGrad.addColorStop(0, 'rgba(10, 1, 3, 0.85)');
  shadeGrad.addColorStop(1, 'rgba(10, 1, 3, 0.2)');
  ctx.fillStyle = shadeGrad;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(tip2X, tip2Y);
  ctx.quadraticCurveTo(tip3X + 10 * span, tip3Y + 16 * span, tip4X, tip4Y);
  ctx.quadraticCurveTo(tip4X + 14 * span, tip4Y - 12 * span, rootX, rootY + 40);
  ctx.closePath();
  ctx.fill();

  // 3. Rede de Micro-Nervuras de Sangue Pulsantes (Capilares Étnicos)
  const pulseVein = Math.sin(frameCount * 0.15) * 0.3 + 0.7;
  ctx.save();
  ctx.globalAlpha = pulseVein;
  ctx.strokeStyle = veinCol;
  ctx.lineWidth = isEnraged ? 2.2 : 1.3;
  ctx.beginPath();
  // Ramo primário
  ctx.moveTo(elbowX * 0.6, elbowY * 0.6);
  ctx.quadraticCurveTo(elbowX - 12 * span, elbowY + 5, tip1X, tip1Y);
  ctx.moveTo(elbowX, elbowY);
  ctx.quadraticCurveTo(elbowX - 8 * span, elbowY + 25 * span, tip2X, tip2Y);
  ctx.moveTo(elbowX, elbowY);
  ctx.quadraticCurveTo(elbowX + 4 * span, elbowY + 45 * span, tip3X, tip3Y);
  ctx.moveTo(elbowX * 0.5, elbowY * 0.5 + 10);
  ctx.quadraticCurveTo(elbowX + 14 * span, elbowY + 65 * span, tip4X, tip4Y);
  // Capilares secundários
  ctx.moveTo(elbowX - 25 * span, elbowY + 15 * span);
  ctx.lineTo(elbowX - 45 * span, elbowY + 28 * span);
  ctx.moveTo(elbowX + 5 * span, elbowY + 30 * span);
  ctx.lineTo(elbowX - 15 * span, elbowY + 48 * span);
  ctx.stroke();
  ctx.restore();

  // 4. Estrutura Óssea Primária (Braço, Antebraço e Juntas das Falanges)
  ctx.strokeStyle = boneCol;
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(tip1X, tip1Y);
  ctx.moveTo(elbowX, elbowY);
  ctx.lineTo(tip2X, tip2Y);
  ctx.moveTo(elbowX, elbowY);
  ctx.lineTo(tip3X, tip3Y);
  ctx.moveTo(elbowX, elbowY);
  ctx.lineTo(tip4X, tip4Y);
  ctx.stroke();

  // 5. Brilho no Topo dos Ossos (Rim-Light Metálico / Mineral)
  ctx.strokeStyle = boneHighlight;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(rootX, rootY - 1);
  ctx.lineTo(elbowX, elbowY - 1);
  ctx.lineTo(tip1X + 2 * span, tip1Y - 1);
  ctx.stroke();

  // 6. Esporão e Garras de Obsidiana Lapidadas com Realce de Luz
  const clawColor = isEnraged ? '#ff4757' : (isVuln ? '#7f8c8d' : '#f1c40f');
  ctx.fillStyle = clawColor;
  
  // Garra do cotovelo principal
  ctx.beginPath();
  ctx.moveTo(elbowX, elbowY - 3);
  ctx.lineTo(elbowX - 12 * span, elbowY - 14);
  ctx.lineTo(elbowX + 3 * span, elbowY + 2);
  ctx.closePath();
  ctx.fill();

  // Garras nas pontas dos 4 dedos
  const digits = [[tip1X, tip1Y], [tip2X, tip2Y], [tip3X, tip3Y], [tip4X, tip4Y]];
  for (let k = 0; k < digits.length; k++) {
    ctx.beginPath();
    ctx.arc(digits[k][0], digits[k][1], 3.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(digits[k][0] - 1, digits[k][1] - 1, 2, 2);
    ctx.fillStyle = clawColor;
  }

  ctx.restore();
}

/**
 * Renderiza o Manto Imperial de Veludo com Forro Damasceno e Bainha de Sombras Vivas.
 */
function drawFluidCape(ctx, bob, frameCount, isVuln, isEnraged) {
  const wave1 = Math.sin(frameCount * 0.12) * 9;
  const wave2 = Math.cos(frameCount * 0.15) * 8;
  const wave3 = Math.sin(frameCount * 0.19) * 6;

  const capeOuter = isVuln ? '#140206' : (isEnraged ? '#3d040f' : '#140207');
  const capeInner = isVuln ? '#380511' : (isEnraged ? '#b80f2d' : '#72081d');
  const goldTrim = isVuln ? '#634c02' : (isEnraged ? '#ff4757' : '#f1c40f');

  // 1. Gola Gótica Alta Majestosa (erguida atrás da nuca estilo Drácula)
  ctx.fillStyle = '#0a0104';
  ctx.beginPath();
  ctx.moveTo(-18, -26 + bob);
  ctx.lineTo(-40, -68 + bob);
  ctx.lineTo(-24, -42 + bob);
  ctx.lineTo(-12, -40 + bob);
  ctx.lineTo(12, -40 + bob);
  ctx.lineTo(24, -42 + bob);
  ctx.lineTo(40, -68 + bob);
  ctx.lineTo(18, -26 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Forro carmesim no interior da gola com costura de ouro
  ctx.fillStyle = capeInner;
  ctx.beginPath();
  ctx.moveTo(-16, -28 + bob);
  ctx.lineTo(-34, -62 + bob);
  ctx.lineTo(-10, -42 + bob);
  ctx.lineTo(10, -42 + bob);
  ctx.lineTo(34, -62 + bob);
  ctx.lineTo(16, -28 + bob);
  ctx.closePath();
  ctx.fill();

  // 2. Forro Interno do Manto Carmesim com Damasco Procedural
  ctx.fillStyle = capeInner;
  ctx.beginPath();
  ctx.moveTo(-26, -18 + bob);
  ctx.bezierCurveTo(-52 + wave1, 24 + bob, -38 + wave2, 64 + bob, -14 + wave3, 74 + bob);
  ctx.lineTo(14 + wave3, 74 + bob);
  ctx.bezierCurveTo(38 + wave2, 64 + bob, 52 + wave1, 24 + bob, 26, -18 + bob);
  ctx.closePath();
  ctx.fill();

  // Padrão de Damasco / Arabescos Sutis no forro interno
  ctx.strokeStyle = isEnraged ? 'rgba(255, 71, 87, 0.25)' : 'rgba(241, 196, 15, 0.2)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let d = -20; d <= 20; d += 10) {
    ctx.moveTo(d + wave2 * 0.3, 15 + bob);
    ctx.lineTo(d * 0.7 + wave3 * 0.5, 55 + bob);
  }
  ctx.stroke();

  // 3. Manto Exterior de Seda de Obsidiana com cauda recortada em asas de morcego
  ctx.fillStyle = capeOuter;
  ctx.beginPath();
  ctx.moveTo(-28, -18 + bob);
  ctx.bezierCurveTo(-56 + wave1, 26 + bob, -42 + wave2, 66 + bob, -26 + wave1, 76 + bob);
  ctx.quadraticCurveTo(-15 + wave2, 68 + bob, -6 + wave3, 78 + bob);
  ctx.quadraticCurveTo(0, 70 + bob, 6 + wave3, 78 + bob);
  ctx.quadraticCurveTo(15 + wave2, 68 + bob, 26 + wave1, 76 + bob);
  ctx.bezierCurveTo(42 + wave2, 66 + bob, 56 + wave1, 26 + bob, 28, -18 + bob);
  ctx.closePath();
  ctx.fill();

  // 4. Filete Bordado a Ouro Imperial ao longo do contorno
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-28, -18 + bob);
  ctx.bezierCurveTo(-56 + wave1, 26 + bob, -42 + wave2, 66 + bob, -26 + wave1, 76 + bob);
  ctx.quadraticCurveTo(-15 + wave2, 68 + bob, -6 + wave3, 78 + bob);
  ctx.quadraticCurveTo(0, 70 + bob, 6 + wave3, 78 + bob);
  ctx.quadraticCurveTo(15 + wave2, 68 + bob, 26 + wave1, 76 + bob);
  ctx.bezierCurveTo(42 + wave2, 66 + bob, 56 + wave1, 26 + bob, 28, -18 + bob);
  ctx.stroke();

  // 5. Morcegos Espectrais e Motes de Sombra se desprendendo da cauda
  const batTime = frameCount * 0.08;
  ctx.fillStyle = isEnraged ? '#ff4757' : '#080104';
  for (let b = 0; b < 3; b++) {
    const bOffset = b * (Math.PI * 2 / 3);
    const bFlap = Math.sin(frameCount * 0.45 + b) * 4;
    const bx = (b === 0 ? -38 : (b === 1 ? 38 : 0)) + Math.cos(batTime + bOffset) * 14;
    const by = 52 + bob + Math.sin(batTime * 1.6 + bOffset) * 16;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 6, by - 4 + bFlap);
    ctx.lineTo(bx - 2, by + 3);
    ctx.lineTo(bx + 2, by + 3);
    ctx.lineTo(bx + 6, by - 4 + bFlap);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Renderiza a Armadura Gótica Cinzelada 2.5D, Ombreiras de Gárgula e Relicário Giroscópico.
 */
function drawGothicArmor(ctx, bob, frameCount, isVuln, isEnraged) {
  const armorSteel = isVuln ? '#100307' : (isEnraged ? '#340510' : '#18040d');
  const goldTrim = isVuln ? '#634c02' : (isEnraged ? '#ff4757' : '#f1c40f');
  const darkGold = isVuln ? '#3d2e01' : (isEnraged ? '#c0392b' : '#b78b02');

  // 1. Placa Peitoral de Obsidiana com Shading Volumétrico 2.5D
  const cuirassGrad = ctx.createLinearGradient(0, -28 + bob, 0, 28 + bob);
  cuirassGrad.addColorStop(0, isEnraged ? '#4a0815' : '#2b0716');
  cuirassGrad.addColorStop(0.5, armorSteel);
  cuirassGrad.addColorStop(1, '#0c0206');

  ctx.fillStyle = cuirassGrad;
  ctx.beginPath();
  ctx.moveTo(-25, -26 + bob);
  ctx.lineTo(25, -26 + bob);
  ctx.lineTo(19, 18 + bob);
  ctx.lineTo(0, 29 + bob);
  ctx.lineTo(-19, 18 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Chanfros e placas anatômicas cinzeladas no peito
  ctx.fillStyle = 'rgba(10, 1, 4, 0.65)';
  ctx.beginPath();
  ctx.moveTo(-16, -24 + bob);
  ctx.lineTo(0, -18 + bob);
  ctx.lineTo(16, -24 + bob);
  ctx.lineTo(13, 14 + bob);
  ctx.lineTo(0, 24 + bob);
  ctx.lineTo(-13, 14 + bob);
  ctx.closePath();
  ctx.fill();

  // 2. Fissuras de Sangue Fervente (Modo Enraged)
  if (isEnraged && !isVuln) {
    ctx.strokeStyle = 'rgba(255, 0, 85, 0.85)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -8 + bob);
    ctx.lineTo(-14, -18 + bob);
    ctx.lineTo(-20, -12 + bob);
    ctx.moveTo(0, -8 + bob);
    ctx.lineTo(14, -18 + bob);
    ctx.lineTo(20, -12 + bob);
    ctx.moveTo(0, -8 + bob);
    ctx.lineTo(-6, 12 + bob);
    ctx.moveTo(0, -8 + bob);
    ctx.lineTo(6, 12 + bob);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // 3. Ombreiras Góticas de Gárgula em 3 Lâminas Segmentadas
  for (let s of [-1, 1]) {
    ctx.save();
    ctx.scale(s, 1);

    // Lâmina 1 (Superior / Espigão de Gárgula curvado)
    ctx.fillStyle = isEnraged ? '#5a071a' : '#2e0817';
    ctx.strokeStyle = goldTrim;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(18, -32 + bob);
    ctx.lineTo(46, -44 + bob);
    ctx.lineTo(42, -22 + bob);
    ctx.lineTo(22, -18 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Espigão adicional superior
    ctx.fillStyle = goldTrim;
    ctx.beginPath();
    ctx.moveTo(40, -38 + bob);
    ctx.lineTo(50, -48 + bob);
    ctx.lineTo(44, -32 + bob);
    ctx.closePath();
    ctx.fill();

    // Lâmina 2 (Intermediária)
    ctx.fillStyle = isEnraged ? '#450614' : '#220612';
    ctx.beginPath();
    ctx.moveTo(20, -20 + bob);
    ctx.lineTo(44, -22 + bob);
    ctx.lineTo(38, -8 + bob);
    ctx.lineTo(18, -8 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lâmina 3 (Inferior de articulação sobre o braço)
    ctx.fillStyle = isEnraged ? '#33040e' : '#17030c';
    ctx.beginPath();
    ctx.moveTo(20, -8 + bob);
    ctx.lineTo(38, -8 + bob);
    ctx.lineTo(32, 4 + bob);
    ctx.lineTo(18, 4 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // 4. Filigranas Douradas no Peito
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-14, -18 + bob);
  ctx.lineTo(0, -6 + bob);
  ctx.lineTo(14, -18 + bob);
  ctx.moveTo(-10, -6 + bob);
  ctx.lineTo(0, 8 + bob);
  ctx.lineTo(10, -6 + bob);
  ctx.stroke();

  // 5. Coração Relicário Giroscópico com Batimento Cardíaco Duplo Realista
  const tHeart = (frameCount * (isEnraged ? 0.24 : 0.13)) % (Math.PI * 2);
  const beat = Math.pow(Math.sin(tHeart), 8) * 2.5 + Math.pow(Math.sin(tHeart + 0.35), 8) * 1.6;
  const gemRadius = 5.2 + (isVuln ? 0 : beat);

  // Halo de pulsação arterial
  const rubyGlow = ctx.createRadialGradient(0, -8 + bob, 2, 0, -8 + bob, gemRadius * 2.5);
  rubyGlow.addColorStop(0, isEnraged ? 'rgba(255, 0, 55, 0.85)' : 'rgba(231, 76, 60, 0.7)');
  rubyGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = rubyGlow;
  ctx.beginPath();
  ctx.arc(0, -8 + bob, gemRadius * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Anel giroscópico do relicário
  const gyroRot = frameCount * 0.04;
  ctx.save();
  ctx.translate(0, -8 + bob);
  ctx.rotate(gyroRot);
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, gemRadius + 3.5, 0, Math.PI * 2);
  ctx.stroke();
  for (let q = 0; q < 4; q++) {
    const qAng = q * Math.PI * 0.5;
    ctx.fillStyle = goldTrim;
    ctx.fillRect(Math.cos(qAng) * (gemRadius + 3.5) - 1, Math.sin(qAng) * (gemRadius + 3.5) - 1, 2, 2);
  }
  ctx.restore();

  // Moldura do engaste dourado
  ctx.fillStyle = darkGold;
  ctx.beginPath();
  ctx.arc(0, -8 + bob, gemRadius + 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Gema lapidada
  ctx.fillStyle = isVuln ? '#4a0815' : (isEnraged ? '#ff0037' : '#ff1744');
  ctx.beginPath();
  ctx.arc(0, -8 + bob, gemRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Reflexo especular
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-1.5, -10 + bob, 2, 2);

  // 6. Cinto Nobre com Fecho Rúnico e Cantoneiras de Ouro
  ctx.fillStyle = '#0b0205';
  ctx.fillRect(-16, 14 + bob, 32, 6);
  ctx.fillStyle = goldTrim;
  ctx.fillRect(-7, 13 + bob, 14, 8);
  ctx.strokeStyle = '#0a0104';
  ctx.lineWidth = 1;
  ctx.strokeRect(-5, 15 + bob, 10, 4);
}

/**
 * Renderiza a Cabeça, Cabelos Platinados Volumétricos, Olhos Predatórios e a Coroa Imperial.
 */
function drawHeadAndFace(ctx, bob, frameCount, isVuln, isEnraged) {
  const headY = (isVuln ? -22 : -32) + bob;

  // 1. Cabelos Prateados Nobres em Múltiplas Camadas (Camada Traseira Esvoaçante)
  const hairSway = Math.sin(frameCount * 0.14) * 5.0;
  
  // Mecha traseira esquerda
  ctx.fillStyle = '#dfe4ea';
  ctx.beginPath();
  ctx.moveTo(-10, headY - 15);
  ctx.quadraticCurveTo(-30 + hairSway, headY - 8, -42 + hairSway * 1.4, headY + 18);
  ctx.lineTo(-26, headY + 6);
  ctx.quadraticCurveTo(-16, headY - 2, -6, headY - 12);
  ctx.closePath();
  ctx.fill();

  // Mecha traseira direita
  ctx.beginPath();
  ctx.moveTo(10, headY - 15);
  ctx.quadraticCurveTo(30 - hairSway, headY - 8, 40 - hairSway * 1.4, headY + 18);
  ctx.lineTo(26, headY + 6);
  ctx.quadraticCurveTo(16, headY - 2, 6, headY - 12);
  ctx.closePath();
  ctx.fill();

  // 2. Rosto Pálido Aristocrático com Shading Volumétrico 2.5D
  ctx.fillStyle = isVuln ? '#8395a7' : '#ecf0f1';
  ctx.beginPath();
  ctx.moveTo(0, headY - 17);
  ctx.lineTo(14, headY - 4);
  ctx.lineTo(9, headY + 13);
  ctx.lineTo(0, headY + 19);
  ctx.lineTo(-9, headY + 13);
  ctx.lineTo(-14, headY - 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2f3542';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Sombreamento sob o queixo, mandíbula e maçãs do rosto
  ctx.fillStyle = 'rgba(47, 53, 66, 0.22)';
  ctx.beginPath();
  ctx.moveTo(-9, headY + 13);
  ctx.lineTo(0, headY + 19);
  ctx.lineTo(9, headY + 13);
  ctx.lineTo(0, headY + 13);
  ctx.closePath();
  ctx.fill();

  // 3. Franja e Topete Platinado Real (Camada Frontal)
  ctx.fillStyle = '#f5f6fa';
  ctx.beginPath();
  ctx.moveTo(-13, headY - 17);
  ctx.lineTo(5, headY - 7);
  ctx.lineTo(-2, headY - 3);
  ctx.lineTo(-15, headY - 11);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(13, headY - 17);
  ctx.lineTo(-2, headY - 8);
  ctx.lineTo(3, headY - 4);
  ctx.lineTo(14, headY - 12);
  ctx.closePath();
  ctx.fill();

  // 4. Coroa Imperial Gótica na Fronte
  drawImperialCrown(ctx, headY, bob, frameCount, isVuln, isEnraged);

  // 5. Olhos Demoníacos Incandescentes com Pupilas Verticais e Rastro de Éter
  const eyeCol = isVuln ? '#590a18' : (isEnraged ? '#ff0055' : '#ff1744');
  
  if (!isVuln) {
    const flareLen = isEnraged ? 24 : 12;
    const flarePulse = Math.sin(frameCount * 0.3) * 2.5;
    
    // Rastro contínuo de fumaça espectral saindo dos olhos
    ctx.strokeStyle = isEnraged ? 'rgba(255, 0, 85, 0.75)' : 'rgba(255, 23, 68, 0.55)';
    ctx.lineWidth = isEnraged ? 2.5 : 1.8;
    ctx.beginPath();
    ctx.moveTo(-6, headY - 1);
    ctx.quadraticCurveTo(-14 - flarePulse, headY - 8, -6 - flareLen - flarePulse, headY - 4 - flarePulse * 0.5);
    ctx.moveTo(6, headY - 1);
    ctx.quadraticCurveTo(14 + flarePulse, headY - 8, 6 + flareLen + flarePulse, headY - 4 - flarePulse * 0.5);
    ctx.stroke();
  }

  // Olho Esquerdo
  ctx.fillStyle = eyeCol;
  ctx.beginPath();
  ctx.ellipse(-6, headY - 1, 3.8, 2.2, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Olho Direito
  ctx.beginPath();
  ctx.ellipse(6, headY - 1, 3.8, 2.2, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Pupilas em fenda felina predatória e brilho especular branco
  if (!isVuln) {
    ctx.fillStyle = '#0a0104';
    ctx.fillRect(-6.5, headY - 2.8, 1.3, 3.6);
    ctx.fillRect(5.2, headY - 2.8, 1.3, 3.6);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5.5, headY - 2.2, 1.2, 1.2);
    ctx.fillRect(6.2, headY - 2.2, 1.2, 1.2);
  }

  // 6. Presas Vampíricas Aristocráticas
  ctx.fillStyle = '#ffffff';
  // Presa esquerda
  ctx.beginPath();
  ctx.moveTo(-4, headY + 10);
  ctx.lineTo(-2.5, headY + 14 + (isEnraged ? 2 : 0));
  ctx.lineTo(-1.5, headY + 10);
  ctx.closePath();
  ctx.fill();

  // Presa direita
  ctx.beginPath();
  ctx.moveTo(1.5, headY + 10);
  ctx.lineTo(2.5, headY + 14 + (isEnraged ? 2 : 0));
  ctx.lineTo(4, headY + 10);
  ctx.closePath();
  ctx.fill();
}

/**
 * Renderiza as Braçadeiras Articuladas, Manoplas de Obsidiana e Garras de Sangue Cristalino.
 */
function drawClawsAndArms(ctx, bob, frameCount, isVuln, isEnraged, isWindup, isChanneling) {
  const armCol = isVuln ? '#140308' : (isEnraged ? '#380512' : '#220815');
  const clawCol = isVuln ? '#7f1d1d' : (isEnraged ? '#f1c40f' : '#ff4757');

  const reach = (isWindup || isChanneling) ? 15 : 0;
  const armDrop = isVuln ? 14 : 0;

  // 1. Braço Esquerdo Secundário (Guarda Defensiva com Manopla de Aço)
  ctx.strokeStyle = isEnraged ? '#28030b' : '#14030a';
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.moveTo(-18, -16 + bob);
  ctx.lineTo(-32 - reach * 0.7, -2 + bob + armDrop);
  ctx.lineTo(-40 - reach * 0.7, 8 + bob + armDrop);
  ctx.stroke();

  // Cotoveleira pontiaguda esquerda
  ctx.fillStyle = isEnraged ? '#ff4757' : '#f1c40f';
  ctx.beginPath();
  ctx.arc(-32 - reach * 0.7, -2 + bob + armDrop, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 2. Braço Direito Principal (Postura de Duelo Ofensiva)
  ctx.strokeStyle = armCol;
  ctx.lineWidth = 5.0;
  ctx.beginPath();
  ctx.moveTo(18, -16 + bob);
  ctx.lineTo(36 + reach, -2 + bob + armDrop);
  ctx.lineTo(46 + reach, 8 + bob + armDrop);
  ctx.stroke();

  // Cotoveleira (Couter) articulada direita
  ctx.fillStyle = isEnraged ? '#ff4757' : '#f1c40f';
  ctx.beginPath();
  ctx.moveTo(36 + reach, -5 + bob + armDrop);
  ctx.lineTo(42 + reach, -2 + bob + armDrop);
  ctx.lineTo(36 + reach, 1 + bob + armDrop);
  ctx.closePath();
  ctx.fill();

  // 3. Manopla Articulada e Garras de Sangue Cristalino Alongadas
  const cX = 46 + reach;
  const cY = 8 + bob + armDrop;

  ctx.strokeStyle = clawCol;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  // Garra superior
  ctx.moveTo(cX - 1, cY - 5);
  ctx.lineTo(cX + 14, cY - 9);
  // Garra média-superior
  ctx.moveTo(cX, cY - 1.5);
  ctx.lineTo(cX + 18, cY - 2);
  // Garra média-inferior
  ctx.moveTo(cX, cY + 2);
  ctx.lineTo(cX + 17, cY + 3);
  // Garra inferior
  ctx.moveTo(cX - 1, cY + 5.5);
  ctx.lineTo(cX + 14, cY + 9);
  ctx.stroke();

  // Fio cortante branco brilhante nas pontas das 4 garras
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cX + 13, cY - 9.5, 2, 2);
  ctx.fillRect(cX + 17, cY - 2.5, 2, 2);
  ctx.fillRect(cX + 16, cY + 2.5, 2, 2);
  ctx.fillRect(cX + 13, cY + 8.5, 2, 2);

  // Efeito de Garras Flamejantes de Sangue carregando o ataque em leque
  if (isWindup) {
    const clawGlow = (Math.sin(frameCount * 0.3) + 1) * 2.5;
    ctx.fillStyle = isEnraged ? 'rgba(255, 71, 87, 0.85)' : 'rgba(231, 76, 60, 0.75)';
    ctx.beginPath();
    ctx.arc(cX + 16, cY, 6 + clawGlow, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cX + 16, cY, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Renderiza a Foice de Sangue Cristalizado durante o ataque CLEAVE (windup e corte).
 */
function drawBloodScythe(ctx, e, bob, frameCount) {
  const cleaveProg = e.cleaveProgress || 0;
  const scytheScale = 0.65 + cleaveProg * 0.55;

  ctx.save();
  ctx.translate(36, 4 + bob);
  // Rotação da foice se armando
  const scytheRot = -0.6 + cleaveProg * 1.8;
  ctx.rotate(scytheRot);
  ctx.scale(scytheScale, scytheScale);

  // Cabo longo da foice (obsidiana com filigrana dourada)
  ctx.strokeStyle = '#120206';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-10, 45);
  ctx.lineTo(15, -65);
  ctx.stroke();

  ctx.strokeStyle = '#f1c40f';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-6, 35);
  ctx.lineTo(12, -55);
  ctx.stroke();

  // Lâmina curvada colossal de sangue cristalizado
  const bladeGrad = ctx.createRadialGradient(15, -65, 5, 15, -65, 75);
  bladeGrad.addColorStop(0, '#ffffff');
  bladeGrad.addColorStop(0.2, '#ff1744');
  bladeGrad.addColorStop(0.6, '#a30022');
  bladeGrad.addColorStop(1, 'rgba(50, 2, 10, 0.9)');

  ctx.fillStyle = bladeGrad;
  ctx.beginPath();
  ctx.moveTo(15, -65);
  ctx.quadraticCurveTo(65, -85, 75, -20);
  ctx.quadraticCurveTo(45, -55, 15, -55);
  ctx.closePath();
  ctx.fill();

  // Fio cortante luminoso da lâmina
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(15, -65);
  ctx.quadraticCurveTo(65, -85, 75, -20);
  ctx.stroke();

  // Rastro de corte translúcido quando no clímax
  if (cleaveProg > 0.6) {
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.65)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 75, -1.2, 0.4);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renderizador Vetorial Master do Lorde Vampírico.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Object} e Entidade do chefe.
 * @param {number} frameCount Contador de frames global.
 */
export function drawVampireLord(ctx, e, frameCount) {
  // 1. Introdução de 5 segundos
  if (e.actionState === 'SPAWN_INTRO') {
    drawVampireSpawnIntro(ctx, e, frameCount);
    if (e.titleTimer > 0) {
      drawCinematicScreenTitle(bannerCtx || ctx, e, frameCount);
    }
    return;
  }

  // 2. Banner de apresentação (continua ativo durante a transição pós-intro)
  if (e.titleTimer > 0) {
    drawCinematicScreenTitle(bannerCtx || ctx, e, frameCount);
  }

  // 3. Teleporte em andamento
  if (e.actionState === 'TELEPORTING') {
    drawTeleportDeparture(ctx, e, frameCount);
    return;
  }

  // 4. Investida em forma de névoa
  if (e.mistState === 'DASHING') {
    drawMistVortex(ctx, e, frameCount);
    return;
  }

  const isVuln = e.isVulnerable;
  const isEnraged = e.isEnraged;
  const isWindup = e.actionState === 'WINDUP';
  const isChanneling = e.actionState === 'CHANNELING_SPIRAL';
  const bob = isVuln ? 12 : (e.floatBob || 0);

  if (isVuln) {
    drawVulnerabilityGliph(ctx, e, frameCount);
  } else {
    // 1. Miasma e Névoa Carmesim Flutuante no Solo
    const mistPulse = Math.sin(frameCount * 0.08) * 6;
    const mistGrad = ctx.createRadialGradient(0, 42, 8, 0, 42, e.radius * 1.15 + mistPulse);
    mistGrad.addColorStop(0, isEnraged ? 'rgba(192, 57, 43, 0.48)' : 'rgba(142, 68, 173, 0.38)');
    mistGrad.addColorStop(0.65, isEnraged ? 'rgba(104, 8, 29, 0.25)' : 'rgba(74, 5, 18, 0.18)');
    mistGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = mistGrad;
    ctx.beginPath();
    ctx.ellipse(0, 42, e.radius * 1.15 + mistPulse, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sombra de contato no solo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
    ctx.beginPath();
    ctx.ellipse(0, 42, e.radius * 0.75 - bob * 0.4, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Faíscas sombrias em ascensão no modo Enrage
    if (isEnraged && Math.floor(frameCount) % 3 === 0) {
      const sparkX = (Math.random() - 0.5) * 55;
      const sparkY = 32 - Math.random() * 45 + bob;
      ctx.fillStyle = Math.random() < 0.5 ? '#ff4757' : '#ffa502';
      ctx.fillRect(sparkX, sparkY, 2.5, 2.5);
    }
  }

  // 2. Dinâmica e envergadura das asas
  const wingFlap = isVuln ? 0 : Math.sin(frameCount * (isEnraged ? 0.28 : 0.16)) * 14;
  const wingSpan = isVuln 
    ? 0.55 
    : (isEnraged 
        ? 1.28 
        : (isChanneling 
            ? 1.40 
            : (e.currentSkill === 'REPULSION' ? 1.50 : (e.isWingPrepping ? 1.35 : 1.0))));

  if (isWindup || isChanneling) {
    ctx.translate((Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 2.5);
  }

  // 2. Asas Secundárias Inferiores (Exclusivas do Modo Enraged / Metamorfose Hexa-Alar)
  if (isEnraged && !isVuln) {
    drawSecondaryWings(ctx, wingFlap, wingSpan, frameCount);
  }

  drawSingleWing(ctx, -1, wingFlap, wingSpan, isVuln, isEnraged, frameCount);
  drawSingleWing(ctx, 1, wingFlap, wingSpan, isVuln, isEnraged, frameCount);

  // Orbes de carregamento nas asas para o disparo convergente (PINCER_SHOT)
  if ((e.isWingPrepping && e.currentSkill === 'PINCER_SHOT') || (isWindup && e.currentSkill === 'PINCER_SHOT')) {
    const orbPulse = (Math.sin(frameCount * 0.3) + 1) * 2.4;
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(-58, -45 + bob, 5 + orbPulse, 0, Math.PI * 2);
    ctx.arc(58, -45 + bob, 5 + orbPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  // Aura de vendaval repulsor nas asas durante a preparação do REPULSION
  if (isWindup && e.currentSkill === 'REPULSION') {
    const repPulse = (Math.sin(frameCount * 0.4) + 1) * 3;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.85)';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, -10 + bob, 52 + repPulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Sigilo rúnico rotativo no peito durante a canalização da espiral
  if (isChanneling) {
    const rot = frameCount * 0.12;
    ctx.save();
    ctx.translate(0, -8 + bob);
    ctx.rotate(rot);
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.8)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2;
      ctx.moveTo(Math.cos(a) * 20, Math.sin(a) * 20);
      ctx.lineTo(Math.cos(a + Math.PI) * 20, Math.sin(a + Math.PI) * 20);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Efeito de pulso concêntrico de aviso durante a frenagem da investida
  if (e.actionState === 'MIST_BRAKE') {
    const brakePulse = (e.actionTimer / 20) * 28;
    ctx.strokeStyle = 'rgba(231, 76, 60, 0.9)';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, bob, e.radius + brakePulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawFluidCape(ctx, bob, frameCount, isVuln, isEnraged);
  drawGothicArmor(ctx, bob, frameCount, isVuln, isEnraged);
  drawAristocraticJabot(ctx, bob, frameCount, isVuln, isEnraged);
  drawHeadAndFace(ctx, bob, frameCount, isVuln, isEnraged);
  drawClawsAndArms(ctx, bob, frameCount, isVuln, isEnraged, isWindup, isChanneling);

  // Foice de Sangue durante a preparação e corte do CLEAVE
  if ((isWindup && e.currentSkill === 'CLEAVE') || e.isCleaving) {
    drawBloodScythe(ctx, e, bob, frameCount);
  }
}
