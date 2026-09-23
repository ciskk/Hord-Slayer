/**
 * src/entities/bosses/abyssalMonolith/render.js
 * Pipeline de renderização gráfica procedural em Canvas 2D de "Ignis Lithos, o Titã de Basalto".
 */

import { MONOLITH_STATES, MONOLITH_CONFIG } from './constants.js';
import { dpr, viewW, viewH, bannerCtx } from '../../../main.js';
import { getHudBottom } from '../../../core/responsive.js';

/**
 * Renderiza o Banner Cinematográfico de Título de "Ignis Lithos, o Titã de Basalto"
 * no topo da tela com tipografia majestosa, estética de basalto e ouro derretido.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} frameCount
 */
export function drawCinematicScreenTitle(ctx, e, frameCount) {
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
  const bannerH = isVertical ? 62 : (isCompactH ? 58 : 98);

  // Fade estendido nas laterais: asas amplas que se estendem e dissolvem suavemente
  const fadeWing = isVertical ? 50 : Math.max(160, screenW * 0.22);
  const totalW = contentW + fadeWing * 2;
  const startX = centerX - totalW / 2;
  const endX = centerX + totalW / 2;

  const calculatedY = Math.round((screenH / 2) - bannerH - (isVertical ? 45 : (isCompactH ? 20 : 75)));
  const by = Math.max(hudBottom + 8, calculatedY);
  const centerY = by + bannerH / 2;

  // Animação de transição cinematográfica
  const entrySlideY = (1 - inEase) * -12;
  const exitSlideY = (1 - outEase) * -8;
  const ambientFloat = Math.sin(frameCount * 0.04) * 1.5;
  const animOffsetY = entrySlideY + exitSlideY + ambientFloat;
  const animScaleX = (0.93 + 0.07 * inEase) * (1.0 + (1 - outEase) * 0.025);

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = bannerAlpha;

  // Aplica movimento com pivô central
  ctx.translate(centerX, centerY + animOffsetY);
  ctx.scale(animScaleX, 1.0);
  ctx.translate(-centerX, -centerY);

  // 1. Fundo Gradiente de Basalto e Obsidiana Vulcânica com Fade Estendido nas Laterais
  const bgGrad = ctx.createLinearGradient(startX, by, endX, by);
  bgGrad.addColorStop(0, 'rgba(12, 6, 4, 0)');
  bgGrad.addColorStop(0.12, 'rgba(25, 12, 6, 0.22)');
  bgGrad.addColorStop(0.28, 'rgba(40, 16, 6, 0.90)');
  bgGrad.addColorStop(0.50, 'rgba(54, 18, 6, 0.98)');
  bgGrad.addColorStop(0.72, 'rgba(40, 16, 6, 0.90)');
  bgGrad.addColorStop(0.88, 'rgba(25, 12, 6, 0.22)');
  bgGrad.addColorStop(1, 'rgba(12, 6, 4, 0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(startX, by, totalW, bannerH);

  // 2. Frisos de Magma Incandescente e Ouro com Taper Suave nas Pontas
  const lineStart = startX + fadeWing * 0.25;
  const lineEnd = endX - fadeWing * 0.25;
  const borderGrad = ctx.createLinearGradient(lineStart, by, lineEnd, by);
  borderGrad.addColorStop(0, 'rgba(230, 126, 34, 0)');
  borderGrad.addColorStop(0.18, 'rgba(230, 126, 34, 0.65)');
  borderGrad.addColorStop(0.35, 'rgba(230, 126, 34, 0.95)');
  borderGrad.addColorStop(0.50, 'rgba(243, 156, 18, 1.0)');
  borderGrad.addColorStop(0.65, 'rgba(230, 126, 34, 0.95)');
  borderGrad.addColorStop(0.82, 'rgba(230, 126, 34, 0.65)');
  borderGrad.addColorStop(1, 'rgba(230, 126, 34, 0)');

  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = isVertical ? 2.0 : 2.8;
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

  // Cantoneiras em losango geométrico de basalto e magma
  [-contentW * 0.42, contentW * 0.42].forEach(ox => {
    ctx.fillStyle = '#e67e22';
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

  // Ornamento Central Superior: Diamante Monolítico de Basalto & Olho de Fogo
  ctx.fillStyle = '#1e272e';
  ctx.beginPath();
  ctx.moveTo(centerX, by - 10);
  ctx.lineTo(centerX + 12, by);
  ctx.lineTo(centerX, by + 10);
  ctx.lineTo(centerX - 12, by);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f39c12';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.fillStyle = '#ff793f';
  ctx.beginPath();
  ctx.arc(centerX, by, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 3. Tipografia Majestosa
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const titleY = by + (isVertical ? 23 : 37);
  ctx.font = isVertical ? '900 21px "Cinzel", "Times New Roman", serif' : '900 34px "Cinzel", "Times New Roman", serif';
  ctx.fillStyle = 'rgba(230, 126, 34, 0.5)';
  ctx.fillText('MONÓLITO ABISSAL', centerX + 1, titleY + 1.5);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('MONÓLITO ABISSAL', centerX, titleY);

  ctx.font = isVertical ? '600 10px "Cinzel", sans-serif' : '700 13px "Cinzel", sans-serif';
  ctx.letterSpacing = isVertical ? '3px' : '6px';
  ctx.fillStyle = '#f1c40f';
  ctx.fillText('IGNIS LITHOS, O TITÃ DE BASALTO', centerX, by + (isVertical ? 45 : 71));
  ctx.letterSpacing = '0px';

  ctx.restore();
}

/**
 * Renderiza a introdução cinematográfica de 5 segundos (4 Atos) do Monólito Abissal.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} frameCount
 */
export function drawMonolithSpawnIntro(ctx, e, frameCount) {
  const introMax = e.introDuration || 300;
  const progress = Math.min(1.0, Math.max(0, 1 - (e.introTimer / introMax)));
  const calderaY = 50;

  // =========================================================================
  // CAMADA DE SOLO BASE: CALDEIRA DE MAGMA EVOLUTIVA (Persiste com transição suave)
  // =========================================================================
  if (progress < 0.85) {
    const calderaMaxR = e.radius * 2.2;
    // O magma borbulha forte até 0.55 e depois esfria formando crosta até 0.85
    const heatAlpha = progress < 0.55 ? 1.0 : Math.max(0, 1.0 - (progress - 0.55) / 0.30);
    const calderaR = calderaMaxR * (progress < 0.25 ? (0.6 + (progress / 0.25) * 0.4) : 1.0);

    ctx.save();
    ctx.translate(0, calderaY);
    ctx.scale(1, 0.44);

    // 1. Resplendor de calor sob a crosta
    const calGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, calderaR);
    calGrad.addColorStop(0, `rgba(255, 245, 200, ${0.9 * heatAlpha})`);
    calGrad.addColorStop(0.25, `rgba(243, 156, 18, ${0.85 * heatAlpha})`);
    calGrad.addColorStop(0.65, `rgba(211, 84, 0, ${0.65 * heatAlpha})`);
    calGrad.addColorStop(0.92, `rgba(39, 12, 6, ${0.45 * heatAlpha + 0.35})`);
    calGrad.addColorStop(1, 'rgba(10, 4, 2, 0)');
    ctx.fillStyle = calGrad;
    ctx.beginPath();
    ctx.arc(0, 0, calderaR, 0, Math.PI * 2);
    ctx.fill();

    // 2. Fissuras radiais na borda da caldeira
    const crackCount = 10;
    ctx.strokeStyle = `rgba(243, 156, 18, ${0.4 + heatAlpha * 0.5})`;
    ctx.lineWidth = 2.4;
    for (let c = 0; c < crackCount; c++) {
      const ca = (c * Math.PI * 2) / crackCount;
      const cDist = calderaR * 0.95;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ca) * (calderaR * 0.5), Math.sin(ca) * (calderaR * 0.5));
      ctx.lineTo(Math.cos(ca) * (cDist * 0.8) + (c % 2 === 0 ? 6 : -6), Math.sin(ca) * (cDist * 0.8));
      ctx.lineTo(Math.cos(ca) * cDist, Math.sin(ca) * cDist);
      ctx.stroke();
    }

    // 3. Bolhas de magma efervescente
    if (heatAlpha > 0.2) {
      const bubbleCount = 7;
      for (let b = 0; b < bubbleCount; b++) {
        const bProg = ((frameCount * 0.05 + b / bubbleCount) % 1);
        const bAng = b * 1.3 + frameCount * 0.02;
        const bDist = (b * 16) % (calderaR * 0.72);
        const bx = Math.cos(bAng) * bDist;
        const by = Math.sin(bAng) * bDist;
        const bR = Math.max(1, 6 * (1 - bProg));
        ctx.fillStyle = bProg > 0.65 ? '#ffffff' : '#f39c12';
        ctx.beginPath();
        ctx.arc(bx, by, bR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // =========================================================================
  // ATO 1: FISSURA SÍSMICA PRELIMINAR (0.00 <= progress < 0.25)
  // =========================================================================
  if (progress < 0.25) {
    const act1Prog = progress / 0.25;
    // Colunas de fumaça densa e fuligem subindo da fenda
    ctx.save();
    for (let s = 0; s < 8; s++) {
      const sProg = ((frameCount * 0.025 + s / 8) % 1);
      const sX = Math.sin(s * 1.8 + frameCount * 0.04) * (20 + s * 5);
      const sY = calderaY - sProg * 130;
      const sR = 8 + sProg * 26;
      ctx.fillStyle = `rgba(35, 20, 14, ${Math.max(0, (1 - sProg) * 0.5 * act1Prog)})`;
      ctx.beginPath();
      ctx.arc(sX, sY, sR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // =========================================================================
  // ATO 2: EMERSÃO COM MÁSCARA DE RECORTE (0.25 <= progress < 0.55)
  // =========================================================================
  if (progress < 0.55) {
    const act2Prog = (progress - 0.25) / 0.30;
    // Interpolação suave em seno (começa rápido e desacelera na altura de flutuação)
    const easeRise = Math.sin(act2Prog * Math.PI * 0.5);
    const riseY = (1 - easeRise) * 160; // Desce 160px para o interior da cratera

    // 1. Fragmentos de rocha ejetados para os lados com a emersão
    ctx.save();
    for (let r = 0; r < 7; r++) {
      const rProg = ((frameCount * 0.045 + r / 7) % 1);
      const rAng = r * 0.95 - 1.4;
      const rDist = 30 + r * 14;
      const rx = Math.cos(rAng) * rDist;
      const ry = calderaY - (Math.sin(rProg * Math.PI) * 95) + (r % 2 === 0 ? 8 : -8);
      ctx.fillStyle = '#1e272e';
      ctx.strokeStyle = '#e67e22';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(rx, ry, Math.max(1.5, 5.5 * (1 - rProg * 0.4)), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // 2. MÁSCARA DE RECORTE REAL (CLIPPING MASK):
    // O colosso só é visível acima do lábio inferior da caldeira de magma,
    // eliminando o efeito "elevador" e fazendo-o brotar fisicamente do subsolo.
    ctx.save();
    ctx.beginPath();
    ctx.rect(-300, -380, 600, 380 + calderaY);
    ctx.ellipse(0, calderaY, e.radius * 1.85, (e.radius * 1.85) * 0.42, 0, 0, Math.PI);
    ctx.closePath();
    ctx.clip();

    // Desenha o corpo emergindo através do plano da cratera
    ctx.save();
    ctx.translate(0, riseY);
    drawMegalithBody(ctx, e, 0, frameCount, false, false, false);
    drawAbyssalCore(ctx, e, 0, frameCount, false, false, false, false, false);

    // Manoplas erguendo-se dos lados da cratera
    const gauntletsRise = {
      left: { x: -62, y: 18, rot: -0.35 },
      right: { x: 62, y: 18, rot: 0.35 }
    };
    drawFloatingGauntlets(ctx, { ...e, gauntlets: gauntletsRise }, 0, frameCount, false, false, false, false);
    ctx.restore();
    ctx.restore(); // Fecha o clip

    // 3. Lábio frontal da caldeira de magma sobrepondo a base do corpo emergente
    ctx.save();
    ctx.translate(0, calderaY);
    ctx.scale(1, 0.44);
    ctx.strokeStyle = `rgba(255, 234, 167, ${0.75 * (1 - act2Prog * 0.4)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 1.6, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // =========================================================================
  // ATO 3: EJEÇÃO PARABÓLICA DOS LITOCISTOS & IGNIÇÃO (0.55 <= progress < 0.80)
  // =========================================================================
  if (progress < 0.80) {
    const act3Prog = (progress - 0.55) / 0.25;
    const bob = Math.sin(frameCount * 0.08) * 3.5;

    // Sombra de sustentação gradual sob o titã
    drawShadow(ctx, e, bob, false);

    // Placas tectônicas convergindo do solo em direção aos flancos
    const plateSpread = (1 - act3Prog) * 70;
    ctx.save();
    const convergingPlates = e.floatingPlates.map(p => ({
      ...p,
      baseDist: p.baseDist + plateSpread
    }));
    drawFloatingPlates(ctx, { ...e, floatingPlates: convergingPlates }, bob, frameCount, false, false, false);
    ctx.restore();

    // EJEÇÃO PARABÓLICA DOS LITOCISTOS:
    // As orbes são disparadas do magma em trajetória curva ascendente até suas órbitas
    ctx.save();
    for (let k = 0; k < e.orbitals.length; k++) {
      const o = e.orbitals[k];
      if (!o.active) continue;

      const orbEase = Math.min(1.0, Math.max(0, act3Prog * 1.25 - k * 0.08));
      const curDist = (MONOLITH_CONFIG?.ORBITAL_DIST || o.dist || 90) * orbEase;
      const curAngle = o.angle - (1 - orbEase) * Math.PI * 1.2;
      const arcHeight = Math.sin(orbEase * Math.PI) * 65;

      const ox = Math.cos(curAngle) * curDist;
      const oy = Math.sin(curAngle) * (curDist * 0.45) + bob - arcHeight;

      // Rastro de fogo curvo conectando ao ponto de ejeção
      const tailGrad = ctx.createLinearGradient(0, calderaY, ox, oy);
      tailGrad.addColorStop(0, 'rgba(230, 126, 34, 0)');
      tailGrad.addColorStop(1, `rgba(243, 156, 18, ${0.85 * (1 - orbEase * 0.4)})`);
      ctx.strokeStyle = tailGrad;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, calderaY);
      ctx.quadraticCurveTo(ox * 0.5, oy - 25, ox, oy);
      ctx.stroke();

      // Litocisto incandescente
      ctx.fillStyle = '#1e272e';
      ctx.beginPath();
      ctx.arc(ox, oy, o.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.arc(ox, oy, o.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Corpo e Manoplas em posição de prontidão
    drawMegalithBody(ctx, e, bob, frameCount, false, false, false);
    drawAbyssalCore(ctx, e, bob, frameCount, false, false, false, true, false);

    const readyGauntlets = {
      left: { x: -62, y: -6 + Math.sin(frameCount * 0.1) * 3, rot: -0.15 },
      right: { x: 62, y: -6 - Math.sin(frameCount * 0.1) * 3, rot: 0.15 }
    };
    drawFloatingGauntlets(ctx, { ...e, gauntlets: readyGauntlets }, bob, frameCount, false, false, false, false);
    return;
  }

  // =========================================================================
  // ATO 4: ANTECIPAÇÃO, IMPACTO TELÚRICO E RECUPERAÇÃO (0.80 <= progress <= 1.00)
  // =========================================================================
  const act4Prog = (progress - 0.80) / 0.20;
  const bob = Math.sin(frameCount * 0.08) * 3;

  drawShadow(ctx, e, bob, false);
  drawFloatingPlates(ctx, e, bob, frameCount, false, false, false);
  drawLitocistos(ctx, e, bob, frameCount, false, false);
  drawMegalithBody(ctx, e, bob, frameCount, false, false, false);
  drawAbyssalCore(ctx, e, bob, frameCount, false, false, false, false, act4Prog < 0.65);

  // CINEMÁTICA DE PESO DAS MANOPLAS (Erguer alto, aceleração de queda e rebote)
  let gY = -6;
  let gRot = 0.15;

  if (act4Prog < 0.65) {
    // 1. Antecipação (Erguendo alto no ar com acúmulo de energia)
    const liftProg = act4Prog / 0.65;
    const smoothLift = Math.sin(liftProg * Math.PI * 0.5);
    gY = -6 - smoothLift * 75;
    gRot = 0.15 + smoothLift * 0.45;
  } else if (act4Prog < 0.85) {
    // 2. Queda Violenta com aceleração quadrática (gravidade)
    const slamProg = (act4Prog - 0.65) / 0.20;
    const accelSlam = slamProg * slamProg;
    gY = -81 + accelSlam * 115; // Atinge +34px (chão firme)
    gRot = 0.60 - slamProg * 0.75;
  } else {
    // 3. Rebote de Impacto e assentamento para combate
    const reboundProg = (act4Prog - 0.85) / 0.15;
    const reboundEase = Math.sin(reboundProg * Math.PI * 0.5);
    gY = 34 - reboundEase * 40; // Volta suave para -6px de flutuação
    gRot = -0.15 + reboundEase * 0.30;
  }

  const slamGauntlets = {
    left: { x: -62, y: gY, rot: -gRot },
    right: { x: 62, y: gY, rot: gRot }
  };
  drawFloatingGauntlets(ctx, { ...e, gauntlets: slamGauntlets }, bob, frameCount, false, false, false, act4Prog < 0.65);

  // Efeito Visual de Choque Sísmico no solo a partir do impacto (act4Prog >= 0.70)
  if (act4Prog >= 0.70) {
    const shockProg = (act4Prog - 0.70) / 0.30;
    const shockR = shockProg * 350;
    const shockAlpha = Math.max(0, 1 - shockProg);

    ctx.save();
    ctx.translate(0, calderaY);
    ctx.scale(1, 0.42);

    // Anel externo incandescente
    ctx.strokeStyle = `rgba(255, 234, 167, ${shockAlpha * 0.95})`;
    ctx.lineWidth = Math.max(1, 7 * (1 - shockProg * 0.5));
    ctx.beginPath();
    ctx.arc(0, 0, shockR, 0, Math.PI * 2);
    ctx.stroke();

    // Anel de magma secundário
    ctx.strokeStyle = `rgba(230, 126, 34, ${shockAlpha * 0.75})`;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, shockR * 0.82, 0, Math.PI * 2);
    ctx.stroke();

    // Partículas de estilhaço voando na crista da onda
    ctx.fillStyle = '#ffffff';
    for (let sp = 0; sp < 14; sp++) {
      const sa = sp * (Math.PI * 2 / 14) + frameCount * 0.08;
      ctx.fillRect(Math.cos(sa) * shockR - 2, Math.sin(sa) * shockR - 2, 4, 4);
    }
    ctx.restore();
  }
}

/**
 * Renderiza as Manoplas Primordiais flutuantes (punhos de basalto levitantes e garras pétreas).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {number} frameCount
 * @param {boolean} isVuln
 * @param {boolean} isEnraged
 * @param {boolean} isP3
 * @param {boolean} isWindup
 */
export function drawFloatingGauntlets(ctx, e, bob, frameCount, isVuln, isEnraged, isP3, isWindup) {
  const gauntlets = e.gauntlets || {
    left: { x: -62, y: -8, lift: 0, rot: -0.15, grip: 0.15 },
    right: { x: 62, y: -8, lift: 0, rot: 0.15, grip: 0.15 }
  };

  const basaltDark  = isVuln ? '#121619' : (isP3 ? '#30050a' : (isEnraged ? '#240a0e' : '#161d22'));
  const basaltMid   = isVuln ? '#1e252a' : (isP3 ? '#4d0b13' : (isEnraged ? '#391117' : '#26303a'));
  const basaltLight = isVuln ? '#303a42' : (isP3 ? '#781520' : (isEnraged ? '#541c23' : '#3d4c5c'));
  const trimCol     = isVuln ? '#4b5760' : (isP3 ? '#ff1744' : (isEnraged ? '#ff4757' : '#e67e22'));
  const glowCol     = isVuln ? 'transparent' : (isP3 ? '#ff7675' : (isEnraged ? '#ff9f43' : '#f1c40f'));
  const coreGlow    = isVuln ? 'transparent' : (isP3 ? '#ffffff' : (isEnraged ? '#ffeaa7' : '#fff9d2'));

  for (let side of ['left', 'right']) {
    const g = gauntlets[side];
    if (!g) continue;
    const isLeft = side === 'left';
    const sign = isLeft ? -1 : 1;

    // Posição com amortecimento e elevação cinemática (lift)
    const liftY = g.lift || 0;
    const grip = Math.max(0, Math.min(1, g.grip !== undefined ? g.grip : (isWindup ? 0.9 : 0.15)));

    ctx.save();
    ctx.translate(g.x, g.y + bob - liftY);
    ctx.rotate(g.rot);

    // 1. Anel Tridimensional de Seixos e Detritos Orbitando o Pulso
    if (!isVuln) {
      const pebbleCount = 5;
      for (let p = 0; p < pebbleCount; p++) {
        const pAng = frameCount * 0.05 + (p * (Math.PI * 2 / pebbleCount)) + (isLeft ? 0 : Math.PI);
        const px = Math.cos(pAng) * 20 * sign;
        const py = -24 + Math.sin(pAng) * 9;
        const pZ = Math.sin(pAng); // Profundidade
        const pR = Math.max(1.5, 2.2 + pZ * 1.0);

        ctx.fillStyle = pZ > 0 ? basaltLight : basaltDark;
        ctx.strokeStyle = pZ > 0 ? trimCol : 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(px, py, pR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Se for frontal e estiver energizado, fagulha de plasma
        if (pZ > 0.4 && (isEnraged || isP3 || isWindup)) {
          ctx.fillStyle = glowCol;
          ctx.beginPath();
          ctx.arc(px, py, pR * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Antebraço Titânico Esculpido em Camadas de Basalto
    // Placa Posterior / Externa (Sombra profunda)
    ctx.fillStyle = basaltDark;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(sign * -20, -22);
    ctx.lineTo(sign * -18, 8);
    ctx.lineTo(0, 14);
    ctx.closePath();
    ctx.fill();

    // Placa Anterior / Interna (Iluminada pela luz do núcleo)
    ctx.fillStyle = basaltLight;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(sign * 20, -22);
    ctx.lineTo(sign * 18, 8);
    ctx.lineTo(0, 14);
    ctx.closePath();
    ctx.fill();

    // Espigão / Cotoveleira Protetora de Rocha
    ctx.fillStyle = basaltMid;
    ctx.beginPath();
    ctx.moveTo(sign * -6, -34);
    ctx.lineTo(sign * -24, -26);
    ctx.lineTo(sign * -12, -20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = trimCol;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Quilha Central do Antebraço com Chanfro Angular
    ctx.fillStyle = basaltMid;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(sign * -9, -12);
    ctx.lineTo(0, 14);
    ctx.lineTo(sign * 9, -12);
    ctx.closePath();
    ctx.fill();

    // Contorno cinzelado exterior da manopla
    ctx.strokeStyle = trimCol;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(sign * -20, -22);
    ctx.lineTo(sign * -18, 8);
    ctx.lineTo(0, 14);
    ctx.lineTo(sign * 18, 8);
    ctx.lineTo(sign * 20, -22);
    ctx.closePath();
    ctx.stroke();

    // Ranhura longitudinal divisória
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(0, 14);
    ctx.stroke();

    // Veia Térmica do Antebraço
    if (!isVuln) {
      const armPulse = Math.sin(frameCount * 0.15 + (isLeft ? 0 : 2)) * 0.6;
      ctx.strokeStyle = glowCol;
      ctx.lineWidth = 1.8 + armPulse * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(sign * 6, -14);
      ctx.lineTo(sign * 2, 4);
      ctx.stroke();

      ctx.strokeStyle = coreGlow;
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    // 3. Palma Rúnica Hexagonal & Nós dos Dedos
    ctx.fillStyle = basaltDark;
    ctx.beginPath();
    ctx.ellipse(0, 12, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = trimCol;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Runa Telúrica na Palma da Mão
    if (!isVuln) {
      ctx.strokeStyle = glowCol;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-4 * sign, 9);
      ctx.lineTo(0, 15);
      ctx.lineTo(4 * sign, 9);
      ctx.moveTo(0, 9);
      ctx.lineTo(0, 15);
      ctx.stroke();
    }

    // Fratura nos Nós dos Dedos (Knuckle Fracture)
    if (!isVuln) {
      const knuckleGlow = grip > 0.6 ? 3.0 : 1.8;
      ctx.strokeStyle = grip > 0.6 ? coreGlow : glowCol;
      ctx.lineWidth = knuckleGlow;
      ctx.beginPath();
      ctx.moveTo(sign * -13, 11);
      ctx.lineTo(sign * -5, 14);
      ctx.lineTo(sign * 4, 13);
      ctx.lineTo(sign * 13, 11);
      ctx.stroke();
    }

    // 4. Quatro Dedos Articulados em Falanges (Polegar, Indicador, Médio, Anelar)
    const fingerDefs = [
      { id: 'thumb',  baseX: sign * 14, baseY: 11, baseAng: sign * 0.65, p1Len: 8,  p2Len: 7,  thick: 3.8 },
      { id: 'index',  baseX: sign * 6,  baseY: 15, baseAng: sign * 0.18, p1Len: 10, p2Len: 9,  thick: 3.5 },
      { id: 'middle', baseX: sign * -2, baseY: 15, baseAng: sign * -0.05,p1Len: 11, p2Len: 10, thick: 3.7 },
      { id: 'ring',   baseX: sign * -10,baseY: 13, baseAng: sign * -0.32,p1Len: 9,  p2Len: 8,  thick: 3.3 }
    ];

    for (let f of fingerDefs) {
      const splay = (1 - grip) * (f.baseAng * 0.8);
      const curlP1 = grip * 0.55;
      const curlP2 = grip * 1.35;

      const angP1 = f.baseAng + splay + curlP1;
      const jx = f.baseX + Math.sin(angP1) * f.p1Len;
      const jy = f.baseY + Math.cos(angP1) * f.p1Len;

      const angP2 = angP1 + (sign * 0.15) + curlP2;
      const tipX = jx + Math.sin(angP2) * (f.p2Len * (1 - grip * 0.35));
      const tipY = jy + Math.cos(angP2) * (f.p2Len * (1 - grip * 0.35));

      // Falange Proximal (segmento de rocha facetada da base à junta média)
      ctx.fillStyle = basaltMid;
      ctx.strokeStyle = trimCol;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(f.baseX - f.thick * 0.5, f.baseY);
      ctx.lineTo(f.baseX + f.thick * 0.5, f.baseY);
      ctx.lineTo(jx + f.thick * 0.4, jy);
      ctx.lineTo(jx - f.thick * 0.4, jy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Junta Inter-falangeal em brasa se ativa
      if (!isVuln && (isEnraged || isP3 || isWindup)) {
        ctx.fillStyle = glowCol;
        ctx.beginPath();
        ctx.arc(jx, jy, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Falange Distal / Garra de Obsidiana (da junta até a ponta)
      ctx.fillStyle = basaltDark;
      ctx.strokeStyle = trimCol;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(jx - f.thick * 0.35, jy);
      ctx.lineTo(jx + f.thick * 0.35, jy);
      ctx.lineTo(tipX, tipY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Ponta incandescente em garra
      if (!isVuln && (isEnraged || isP3 || isWindup || grip > 0.6)) {
        ctx.fillStyle = (isP3 || grip > 0.8) ? coreGlow : glowCol;
        ctx.beginPath();
        ctx.arc(tipX, tipY, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

/**
 * Desenha a sombra projetada com oclusão de contato profunda e penumbra realista.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {boolean} isVuln
 */
export function drawShadow(ctx, e, bob, isVuln) {
  const shadowY = 56 + (isVuln ? 12 : 0);
  const shadowRadius = (e.radius * 0.94) - (isVuln ? 0 : bob * 0.35);

  // 1. Penumbra Externa Suave
  const penumbraGrad = ctx.createRadialGradient(0, shadowY, 6, 0, shadowY, shadowRadius);
  penumbraGrad.addColorStop(0, 'rgba(12, 6, 4, 0.75)');
  penumbraGrad.addColorStop(0.55, 'rgba(20, 10, 6, 0.38)');
  penumbraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = penumbraGrad;
  ctx.beginPath();
  ctx.ellipse(0, shadowY, shadowRadius, shadowRadius * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Oclusão de Contato Central Profunda (Ambient Occlusion do solo)
  const contactR = shadowRadius * 0.42;
  const contactGrad = ctx.createRadialGradient(0, shadowY, 2, 0, shadowY, contactR);
  contactGrad.addColorStop(0, 'rgba(0, 0, 0, 0.90)');
  contactGrad.addColorStop(0.8, 'rgba(10, 4, 2, 0.45)');
  contactGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = contactGrad;
  ctx.beginPath();
  ctx.ellipse(0, shadowY, contactR, contactR * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Resplendor Térmico no Solo (quando enfurecido ou em fase 3)
  if (e.isEnraged || e.isPhase3) {
    const heatGrad = ctx.createRadialGradient(0, shadowY, 4, 0, shadowY, shadowRadius * 0.7);
    heatGrad.addColorStop(0, e.isPhase3 ? 'rgba(255, 23, 68, 0.35)' : 'rgba(230, 126, 34, 0.25)');
    heatGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = heatGrad;
    ctx.beginPath();
    ctx.ellipse(0, shadowY, shadowRadius * 0.7, (shadowRadius * 0.7) * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Renderiza as Fontes Termais residuais deixadas no chão após quebrar Litocistos.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} boss
 * @param {number} frameCount
 */
export function drawThermalVents(ctx, boss, frameCount) {
  for (let vent of boss.thermalVents) {
    if (!vent.active) continue;

    const relX = vent.x - boss.x;
    const relY = vent.y - boss.y;
    const pulse = Math.sin(frameCount * 0.08 + vent.pulsePhase) * 3;
    const curR = vent.radius + pulse;

    ctx.save();
    const grad = ctx.createRadialGradient(relX, relY, 4, relX, relY, curR);
    grad.addColorStop(0, 'rgba(241, 196, 15, 0.40)');
    grad.addColorStop(0.5, 'rgba(230, 126, 34, 0.20)');
    grad.addColorStop(1, 'rgba(211, 84, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(relX, relY, curR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(241, 196, 15, ${0.45 + pulse * 0.08})`;
    ctx.lineWidth = 2.0;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(relX, relY, curR * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#2c3e50';
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(relX, relY - 12);
    ctx.lineTo(relX + 7, relY - 2);
    ctx.lineTo(relX, relY + 10);
    ctx.lineTo(relX - 7, relY - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(relX, relY - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Desenha telegrafias animadas com clareza visual impecável (Slam frontal, Epicentro, Onda Externa e Giro).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} frameCount
 */
export function drawTelegraphsAndZones(ctx, e, frameCount) {
  // 1. Telegrafia do Esmagamento Frontal (Cone com Rachaduras e Lock-in Cristalino)
  if (e.actionState === MONOLITH_STATES.WINDUP_SLAM) {
    const maxTimer = e.maxActionTimer || (e.isPhase3 ? 45 : (e.isEnraged ? 52 : 60));
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));
    const aim = e.aimAngle || 0;
    const arcHalf = e.slamArc || (Math.PI * 0.31);
    const r = e.slamRadius || 185;

    ctx.save();
    // Fundo do cone em brasa
    ctx.fillStyle = `rgba(231, 76, 60, ${0.12 + progress * 0.35})`;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.arc(0, 20, r, aim - arcHalf, aim + arcHalf);
    ctx.closePath();
    ctx.fill();

    // Contorno do cone: pisca intensamente em branco/carmesim quando a mira trava
    if (e.aimLocked) {
      const lockPulse = (Math.sin(frameCount * 0.4) + 1) * 0.5;
      ctx.strokeStyle = lockPulse > 0.5 ? '#ffffff' : '#ff1744';
      ctx.lineWidth = 3.6;
    } else {
      ctx.strokeStyle = progress > 0.80 ? '#ffffff' : '#f39c12';
      ctx.lineWidth = 2.4;
    }
    ctx.beginPath();
    ctx.arc(0, 20, r, aim - arcHalf, aim + arcHalf);
    ctx.stroke();

    // Linhas de fratura internas no cone
    const spineCount = 5;
    ctx.strokeStyle = `rgba(255, 234, 167, ${0.3 + progress * 0.6})`;
    ctx.lineWidth = 1.8;
    for (let s = 0; s < spineCount; s++) {
      const fracAng = aim - arcHalf + (s / (spineCount - 1)) * (arcHalf * 2);
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.lineTo(Math.cos(fracAng) * (r * progress), 20 + Math.sin(fracAng) * (r * progress));
      ctx.stroke();
    }

    // Eixo Central de Disparo quando a mira trava (Lock-in)
    if (e.aimLocked) {
      // Raio guia central de magma
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.lineTo(Math.cos(aim) * r, 20 + Math.sin(aim) * r);
      ctx.stroke();

      // Mira reticular no ponto de impacto primário
      const targetX = Math.cos(aim) * (r * 0.65);
      const targetY = 20 + Math.sin(aim) * (r * 0.65);
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(targetX, targetY, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(targetX, targetY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Linhas da mira
      ctx.beginPath();
      ctx.moveTo(targetX - 18, targetY); ctx.lineTo(targetX + 18, targetY);
      ctx.moveTo(targetX, targetY - 18); ctx.lineTo(targetX, targetY + 18);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. Telegrafia do EPICENTRO (Solo sob o chefe rachando)
  if (e.actionState === MONOLITH_STATES.WINDUP_EPICENTER) {
    const maxTimer = e.maxActionTimer || (e.isPhase3 ? 45 : (e.isEnraged ? 52 : 60));
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));
    const coreR = 115;

    ctx.save();
    // Chão sob o boss brilhando em calor crescente
    const epicGrad = ctx.createRadialGradient(0, 20, 10, 0, 20, coreR);
    epicGrad.addColorStop(0, `rgba(255, 23, 68, ${0.25 + progress * 0.45})`);
    epicGrad.addColorStop(0.7, `rgba(230, 126, 34, ${0.15 + progress * 0.35})`);
    epicGrad.addColorStop(1, 'rgba(211, 84, 0, 0)');
    ctx.fillStyle = epicGrad;
    ctx.beginPath();
    ctx.arc(0, 20, coreR, 0, Math.PI * 2);
    ctx.fill();

    // Linhas de fratura em zig-zag sob o boss
    const crackCount = 8;
    ctx.strokeStyle = progress > 0.80 ? '#ffffff' : '#ff4757';
    ctx.lineWidth = 2.4;
    for (let c = 0; c < crackCount; c++) {
      const ca = (c * Math.PI * 2) / crackCount;
      const cDist = coreR * (0.3 + progress * 0.7);
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.lineTo(Math.cos(ca) * (cDist * 0.5) + (c % 2 === 0 ? 5 : -5), 20 + Math.sin(ca) * (cDist * 0.5));
      ctx.lineTo(Math.cos(ca) * cDist, 20 + Math.sin(ca) * cDist);
      ctx.stroke();
    }

    // Anel de aviso que contrai indicando o momento exato da explosão
    const contractR = coreR + (coreR * 0.6) * (1 - progress);
    ctx.strokeStyle = progress > 0.80 ? '#ffffff' : '#f39c12';
    ctx.lineWidth = progress > 0.80 ? 3.5 : 2.2;
    ctx.beginPath();
    ctx.arc(0, 20, contractR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Telegrafia da ONDA EXTERNA (O centro já explodiu e é SEGURO; o anel externo vai estourar!)
  if (e.actionState === MONOLITH_STATES.PROPAGATING_SURGE) {
    const maxTimer = e.maxActionTimer || (e.isPhase3 ? 32 : (e.isEnraged ? 41 : 49));
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));

    ctx.save();
    // Centro Seguro (Safe Zone de 0 a 120px) destacado com resplendor verde esmeralda / ouro suave
    const safeGrad = ctx.createRadialGradient(0, 20, 10, 0, 20, 118);
    safeGrad.addColorStop(0, 'rgba(46, 204, 113, 0.22)');
    safeGrad.addColorStop(0.75, 'rgba(46, 204, 113, 0.10)');
    safeGrad.addColorStop(1, 'rgba(46, 204, 113, 0)');
    ctx.fillStyle = safeGrad;
    ctx.beginPath();
    ctx.arc(0, 20, 118, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(46, 204, 113, 0.85)';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 20, 118, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Anel Externo de Perigo (140px a 245px) com expansão e estacas de pedra
    ctx.fillStyle = `rgba(230, 126, 34, ${0.10 + progress * 0.30})`;
    ctx.beginPath();
    ctx.arc(0, 20, 245, 0, Math.PI * 2);
    ctx.arc(0, 20, 140, 0, Math.PI * 2, true);
    ctx.fill();

    ctx.strokeStyle = progress > 0.80 ? '#ffffff' : '#ff4757';
    ctx.lineWidth = progress > 0.80 ? 3.5 : 2.5;
    ctx.beginPath();
    ctx.arc(0, 20, 140 + (245 - 140) * progress, 0, Math.PI * 2);
    ctx.stroke();

    // Estacas de basalto emergindo no anel externo
    const spikeCount = 12;
    ctx.fillStyle = '#2c3e50';
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 1.5;
    for (let sp = 0; sp < spikeCount; sp++) {
      const sa = (sp * Math.PI * 2) / spikeCount + (frameCount * 0.01);
      const sDist = 190;
      const sx = Math.cos(sa) * sDist;
      const sy = 20 + Math.sin(sa) * sDist;
      const spikeH = 14 * progress;

      ctx.beginPath();
      ctx.moveTo(sx - 6, sy);
      ctx.lineTo(sx, sy - spikeH);
      ctx.lineTo(sx + 6, sy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Telegrafia da Varredura de Placas (Plate Whirl)
  if (e.actionState === MONOLITH_STATES.WINDUP_WHIRL) {
    const maxTimer = e.maxActionTimer || (e.isPhase3 ? 45 : (e.isEnraged ? 52 : 60));
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));
    const whirlR = 110;

    ctx.save();
    // Círculo perimetral tracejado
    ctx.strokeStyle = progress > 0.80 ? '#ffffff' : '#ff1744';
    ctx.lineWidth = progress > 0.80 ? 3.5 : 2.2;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.arc(0, 20, whirlR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Preenchimento de perigo em expansão
    ctx.fillStyle = `rgba(255, 23, 68, ${0.12 + progress * 0.28})`;
    ctx.beginPath();
    ctx.arc(0, 20, whirlR * progress, 0, Math.PI * 2);
    ctx.fill();

    // Lâminas de basalto giratórias cortando o ar na borda
    const bladeRot = frameCount * 0.22;
    const bladeCount = 4;
    ctx.strokeStyle = 'rgba(255, 118, 117, 0.7)';
    ctx.lineWidth = 2.4;
    for (let b = 0; b < bladeCount; b++) {
      const bAng = bladeRot + (b * Math.PI * 2 / bladeCount);
      const bx1 = Math.cos(bAng) * (whirlR * 0.75);
      const by1 = 20 + Math.sin(bAng) * (whirlR * 0.75);
      const bx2 = Math.cos(bAng + 0.35) * whirlR;
      const by2 = 20 + Math.sin(bAng + 0.35) * whirlR;
      ctx.beginPath();
      ctx.moveTo(bx1, by1);
      ctx.quadraticCurveTo(bx1 * 1.1, by1 * 1.1, bx2, by2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 5. Telegrafia da Salva Vulcânica de Basalto (Feixes-Guia das Manoplas e Mira Direcional)
  if (e.actionState === MONOLITH_STATES.WINDUP_SALVO) {
    const maxTimer = e.maxActionTimer || (e.isPhase3 ? 45 : (e.isEnraged ? 52 : 60));
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));
    const aim = e.aimAngle || 0;
    const beamLength = 650;

    ctx.save();
    // Feixes gêmeos das manoplas esquerda (-52) e direita (+52)
    [-52, 52].forEach((offsetSide) => {
      const startX = offsetSide;
      const startY = 6;
      const endX = startX + Math.cos(aim) * (beamLength * progress);
      const endY = startY + Math.sin(aim) * (beamLength * progress);

      const beamGrad = ctx.createLinearGradient(startX, startY, endX, endY);
      beamGrad.addColorStop(0, 'rgba(255, 71, 87, 0.85)');
      beamGrad.addColorStop(0.7, 'rgba(230, 126, 34, 0.55)');
      beamGrad.addColorStop(1, 'rgba(241, 196, 15, 0.05)');

      ctx.strokeStyle = beamGrad;
      ctx.lineWidth = 2.0 + Math.sin(frameCount * 0.3) * 0.5;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ponto de foco de calor na ponta de cada manopla
      ctx.fillStyle = progress > 0.80 ? '#ffffff' : '#ff4757';
      ctx.beginPath();
      ctx.arc(startX, startY, 4 + progress * 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Mira reticular centralizada no alvo ao final do feixe
    const targetDist = Math.min(400, beamLength * progress);
    const tarX = Math.cos(aim) * targetDist;
    const tarY = Math.sin(aim) * targetDist;

    ctx.strokeStyle = progress > 0.85 ? '#ffffff' : 'rgba(255, 71, 87, 0.85)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(tarX, tarY, 16 * (1 - progress * 0.25), 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // 6. Telegrafia das Fendas Tectônicas Cruzadas (Fraturas em X cortando a arena)
  if (e.actionState === MONOLITH_STATES.WINDUP_CROSS_FISSURE) {
    const maxTimer = e.maxActionTimer || (e.isPhase3 ? 45 : (e.isEnraged ? 52 : 60));
    const progress = Math.min(1, Math.max(0, 1 - (e.actionTimer / maxTimer)));
    const aim = e.aimAngle || 0;
    const crossSpan = MONOLITH_CONFIG.CROSS_NODES_PER_ARM * MONOLITH_CONFIG.CROSS_NODE_SPACING;

    ctx.save();
    // As duas diagonais cruzadas
    ctx.translate((e.crossTargetX ?? e.x) - e.x, (e.crossTargetY ?? e.y) - e.y);
    const angles = [aim + Math.PI / 4, aim - Math.PI / 4];
    angles.forEach((ang, lineIdx) => {
      const x1 = Math.cos(ang) * -crossSpan;
      const y1 = Math.sin(ang) * -crossSpan;
      const x2 = Math.cos(ang) * crossSpan;
      const y2 = Math.sin(ang) * crossSpan;

      // Faixa de perigo da fratura
      ctx.strokeStyle = `rgba(230, 126, 34, ${0.15 + progress * 0.35})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Linha central incandescente
      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : '#ff4757';
      ctx.lineWidth = 2.4;
      ctx.setLineDash([12, 6]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Mostra os mesmos círculos usados na colisão, com alcance completo desde o início.
      for (let step = -MONOLITH_CONFIG.CROSS_NODES_PER_ARM; step <= MONOLITH_CONFIG.CROSS_NODES_PER_ARM; step++) {
        if (lineIdx === 1 && step === 0) continue;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * step * MONOLITH_CONFIG.CROSS_NODE_SPACING,
          Math.sin(ang) * step * MONOLITH_CONFIG.CROSS_NODE_SPACING,
          MONOLITH_CONFIG.CROSS_NODE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230, 126, 34, ${0.15 + progress * 0.35})`;
        ctx.fill();
        ctx.stroke();
      }
    });

    // Núcleo de intersecção brilhante no centro do X
    ctx.fillStyle = progress > 0.85 ? '#ffffff' : '#f39c12';
    ctx.beginPath();
    ctx.arc(0, 0, 8 * progress, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Desenha as placas tectônicas articuladas que flutuam dinamicamente ao redor do corpo.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {number} frameCount
 * @param {boolean} isVuln
 * @param {boolean} isEnraged
 * @param {boolean} isWindup
 */
export function drawFloatingPlates(ctx, e, bob, frameCount, isVuln, isEnraged, isWindup) {
  const isP3 = e.isPhase3 || (e.phaseCinematic && e.phaseCinematic.phase === 3 && (e.phaseCinematic.morphProgress || 0) > 0.05);

  const plateColDark  = isVuln ? '#121619' : (isP3 ? '#30050a' : (isEnraged ? '#240a0e' : '#161d22'));
  const plateColMid   = isVuln ? '#1e252a' : (isP3 ? '#4d0b13' : (isEnraged ? '#391117' : '#26303a'));
  const plateColLight = isVuln ? '#303a42' : (isP3 ? '#781520' : (isEnraged ? '#541c23' : '#3d4c5c'));
  const trimCol       = isVuln ? '#4b5760' : (isP3 ? '#ff1744' : (isEnraged ? '#ff4757' : '#e67e22'));
  const glowCol       = isVuln ? 'transparent' : (isP3 ? '#ff7675' : (isEnraged ? '#ff9f43' : '#f1c40f'));

  for (let i = 0; i < e.floatingPlates.length; i++) {
    const p = e.floatingPlates[i];
    let px = 0;
    let py = 0;
    let rot = 0;

    if (e.actionState === MONOLITH_STATES.WINDUP_SLAM) {
      // Martelos erguidos no alto
      const lift = Math.sin(frameCount * 0.3) * 4;
      const spread = (i - 1.5) * 24;
      px = spread;
      py = -84 + bob + lift + Math.abs(spread) * 0.25;
      rot = spread / 42;
    } else if (e.actionState === MONOLITH_STATES.WINDUP_EPICENTER) {
      // Placas fincadas na base
      const pAng = p.angleOffset + frameCount * 0.02;
      px = Math.cos(pAng) * 74;
      py = 34 + bob + Math.sin(pAng) * 20;
      rot = pAng;
    } else if (e.actionState === MONOLITH_STATES.WINDUP_WHIRL) {
      // Placas girando como lâminas afiadas
      const spinAng = p.angleOffset + frameCount * 0.25;
      px = Math.cos(spinAng) * 98;
      py = Math.sin(spinAng) * 58 + bob;
      rot = spinAng + Math.PI / 2;
    } else if (e.actionState === MONOLITH_STATES.WINDUP_SALVO) {
      // Placas recuadas nos ombros como dissipadores de calor
      const spread = (i - 1.5) * 28;
      px = spread;
      py = -30 + bob;
      rot = spread / 50;
    } else if (e.actionState === MONOLITH_STATES.WINDUP_CROSS_FISSURE) {
      // Placas abertas amplamente
      const pAng = p.angleOffset + frameCount * 0.04;
      px = Math.cos(pAng) * 92;
      py = (Math.sin(pAng) * 44) + bob;
      rot = pAng + Math.PI / 2;
    } else if (e.actionState === MONOLITH_STATES.CHANNELING_SIPHON) {
      const fastAng = p.angleOffset - frameCount * 0.14;
      px = Math.cos(fastAng) * 68;
      py = Math.sin(fastAng) * 38 + bob;
      rot = fastAng + Math.PI / 2;
    } else if (isVuln) {
      const fallOffset = (i - 1.5) * 36;
      px = fallOffset;
      py = 48 + bob + (i % 2 === 0 ? 8 : -4);
      rot = (i - 1.5) * 0.35;
    } else {
      const pAng = p.angleOffset + (frameCount * (isP3 ? 0.032 : (isEnraged ? 0.024 : 0.016)));
      const wobble = Math.sin(frameCount * 0.08 + p.wobblePhase) * 4.5;
      const currentDist = p.baseDist + wobble;
      px = Math.cos(pAng) * currentDist;
      py = (Math.sin(pAng) * (currentDist * 0.45)) + bob;
      rot = pAng + Math.PI / 2;
    }

    // Filamento de Plasma Elétrico conectando o broquel ao corpo
    if (!isVuln && (isEnraged || isP3 || isWindup)) {
      ctx.save();
      ctx.strokeStyle = isP3 ? 'rgba(255, 23, 68, 0.45)' : 'rgba(243, 156, 18, 0.35)';
      ctx.lineWidth = 1.3;
      const midJitter = Math.sin(frameCount * 0.35 + i * 2) * 8;
      ctx.beginPath();
      ctx.moveTo(0, bob);
      ctx.quadraticCurveTo(px * 0.45 + midJitter, py * 0.45 - 6, px, py);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);

    const sz = p.size;

    // Escudo / Broquel Monolítico com Geometria Chanfrada
    // Faceta Esquerda (Sombra)
    ctx.fillStyle = plateColDark;
    ctx.beginPath();
    ctx.moveTo(0, -sz * 0.65);
    ctx.lineTo(-sz * 0.55, -sz * 0.2);
    ctx.lineTo(-sz * 0.45, sz * 0.45);
    ctx.lineTo(0, sz * 0.65);
    ctx.closePath();
    ctx.fill();

    // Faceta Direita (Iluminada)
    ctx.fillStyle = plateColLight;
    ctx.beginPath();
    ctx.moveTo(0, -sz * 0.65);
    ctx.lineTo(sz * 0.55, -sz * 0.2);
    ctx.lineTo(sz * 0.45, sz * 0.45);
    ctx.lineTo(0, sz * 0.65);
    ctx.closePath();
    ctx.fill();

    // Faceta Central com Crista
    ctx.fillStyle = plateColMid;
    ctx.beginPath();
    ctx.moveTo(0, -sz * 0.65);
    ctx.lineTo(-sz * 0.25, -sz * 0.15);
    ctx.lineTo(0, sz * 0.45);
    ctx.lineTo(sz * 0.25, -sz * 0.15);
    ctx.closePath();
    ctx.fill();

    // Contorno cinzelado
    ctx.strokeStyle = trimCol;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -sz * 0.65);
    ctx.lineTo(-sz * 0.55, -sz * 0.2);
    ctx.lineTo(-sz * 0.45, sz * 0.45);
    ctx.lineTo(0, sz * 0.65);
    ctx.lineTo(sz * 0.45, sz * 0.45);
    ctx.lineTo(sz * 0.55, -sz * 0.2);
    ctx.closePath();
    ctx.stroke();

    // Runa Gravada no Escudo
    if (!isVuln) {
      ctx.strokeStyle = glowCol;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-sz * 0.2, -sz * 0.1);
      ctx.lineTo(0, -sz * 0.3);
      ctx.lineTo(sz * 0.2, -sz * 0.1);
      ctx.moveTo(0, -sz * 0.3);
      ctx.lineTo(0, sz * 0.3);
      ctx.stroke();
    }

    ctx.restore();
  }
}

/**
 * Desenha a rede dendrítica de fissuras térmicas com duplo gradiente de calor.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} bob
 * @param {number} frameCount
 * @param {boolean} isVuln
 * @param {boolean} isEnraged
 * @param {boolean} isP3
 */
export function drawMagmaVeins(ctx, bob, frameCount, isVuln, isEnraged, isP3) {
  if (isVuln) {
    ctx.strokeStyle = '#273c75';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-10, -36 + bob);
    ctx.lineTo(-24, -12 + bob);
    ctx.lineTo(-12, 18 + bob);
    ctx.moveTo(10, -36 + bob);
    ctx.lineTo(24, -12 + bob);
    ctx.lineTo(12, 18 + bob);
    ctx.stroke();
    return;
  }

  const pulse = Math.sin(frameCount * (isP3 ? 0.24 : (isEnraged ? 0.18 : 0.09)));
  const veinColPrimary = isP3 ? '#ff1744' : (isEnraged ? '#e74c3c' : '#d35400');
  const veinColGlow    = isP3 ? '#ff9f43' : (isEnraged ? '#f1c40f' : '#f39c12');
  const veinColCore    = isP3 ? '#ffffff' : (isEnraged ? '#ffeaa7' : '#fffbc7');

  const drawVeinPaths = () => {
    ctx.beginPath();
    // 1. Ramo Superior Esquerdo (Ombreira e Clavícula)
    ctx.moveTo(-8, -48 + bob);
    ctx.lineTo(-22, -34 + bob);
    ctx.lineTo(-34, -16 + bob);
    ctx.lineTo(-22, 4 + bob);
    ctx.lineTo(-14, 26 + bob);

    // Sub-fissura costal esquerda
    ctx.moveTo(-22, -34 + bob);
    ctx.lineTo(-12, -20 + bob);

    // 2. Ramo Superior Direito (Ombreira e Clavícula)
    ctx.moveTo(8, -48 + bob);
    ctx.lineTo(22, -34 + bob);
    ctx.lineTo(34, -16 + bob);
    ctx.lineTo(22, 4 + bob);
    ctx.lineTo(14, 26 + bob);

    // Sub-fissura costal direita
    ctx.moveTo(22, -34 + bob);
    ctx.lineTo(12, -20 + bob);

    // 3. Fissuras Abdominais Descendentes
    ctx.moveTo(-10, 30 + bob);
    ctx.lineTo(0, 42 + bob);
    ctx.lineTo(10, 30 + bob);

    ctx.moveTo(0, 14 + bob);
    ctx.lineTo(0, 34 + bob);

    // 4. Micro-ramificações adicionais quando Enfurecido ou Fase 3
    if (isEnraged || isP3) {
      ctx.moveTo(-34, -16 + bob);
      ctx.lineTo(-44, -10 + bob);
      ctx.moveTo(34, -16 + bob);
      ctx.lineTo(44, -10 + bob);
      ctx.moveTo(-6, -56 + bob);
      ctx.lineTo(0, -48 + bob);
      ctx.lineTo(6, -56 + bob);
    }
  };

  // Passada 1: Halo de Difusão Térmica Amplo
  ctx.strokeStyle = veinColPrimary;
  ctx.lineWidth = 3.6 + pulse * 1.2;
  drawVeinPaths();
  ctx.stroke();

  // Passada 2: Brilho Intermediário Incandescente
  ctx.strokeStyle = veinColGlow;
  ctx.lineWidth = 2.0 + pulse * 0.6;
  drawVeinPaths();
  ctx.stroke();

  // Passada 3: Núcleo Fino Superaquecido Branco-Dourado
  ctx.strokeStyle = veinColCore;
  ctx.lineWidth = 1.1;
  drawVeinPaths();
  ctx.stroke();
}

/**
 * Desenha o corpo do colosso de basalto tri-segmentado com caldeira ativa,
 * chifres de obsidiana, carapaça escalonada e estalactites de lava.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {number} frameCount
 * @param {boolean} isVuln
 * @param {boolean} isEnraged
 * @param {boolean} isP3
 */
export function drawMegalithBody(ctx, e, bob, frameCount, isVuln, isEnraged, isP3) {
  const basaltShadow = isVuln ? '#0d1215' : (isP3 ? '#1a0306' : (isEnraged ? '#1b0508' : '#12171c'));
  const basaltMid    = isVuln ? '#1a2126' : (isP3 ? '#2e070c' : (isEnraged ? '#2c080d' : '#202932'));
  const basaltLight  = isVuln ? '#28333b' : (isP3 ? '#4a0d14' : (isEnraged ? '#420f15' : '#303d4a'));
  const edgeTrim     = isVuln ? '#4b5760' : (isP3 ? '#ff3838' : (isEnraged ? '#ff4757' : '#718093'));
  const lavaGlow     = isVuln ? '#273c75' : (isP3 ? '#ff1744' : (isEnraged ? '#e74c3c' : '#d35400'));
  const emberCol     = isVuln ? '#57606f' : (isP3 ? '#ff7675' : '#f39c12');

  const topY   = -68 + bob;
  const waistY = -6 + bob;
  const botY   = 50 + bob;

  // =========================================================================
  // TIER 1: RAÍZES TECTÔNICAS, ESTALACTITES DE LAVA E DETRITOS ANTI-GRAVITACIONAIS
  // =========================================================================
  
  // 1. Fragmentos de Rocha Levitando sob a Base
  const subRocks = [
    { x: -28, y: botY + 34, r: 4.5, wob: 0 },
    { x: 0,   y: botY + 42, r: 6.0, wob: 1.5 },
    { x: 28,  y: botY + 32, r: 4.0, wob: 3.0 }
  ];
  for (let sr of subRocks) {
    const sBob = Math.sin(frameCount * 0.08 + sr.wob) * 3;
    ctx.fillStyle = basaltShadow;
    ctx.strokeStyle = edgeTrim;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(sr.x, sr.y + sBob, sr.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (!isVuln) {
      ctx.fillStyle = lavaGlow;
      ctx.beginPath();
      ctx.arc(sr.x, sr.y + sBob, sr.r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Estalactites Pontiagudas de Rocha e Gotas de Lava Incandescente
  const stalactites = [
    { x: -36, len: 16, w: 5 },
    { x: -22, len: 24, w: 6 },
    { x: -8,  len: 32, w: 7 },
    { x: 8,   len: 30, w: 7 },
    { x: 22,  len: 22, w: 6 },
    { x: 36,  len: 15, w: 5 }
  ];
  for (let st of stalactites) {
    const stTipY = botY + 12 + st.len;
    ctx.fillStyle = basaltShadow;
    ctx.beginPath();
    ctx.moveTo(st.x - st.w, botY + 10);
    ctx.lineTo(st.x + st.w, botY + 10);
    ctx.lineTo(st.x, stTipY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = edgeTrim;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Gota de lava incandescente na ponta da estalactite
    if (!isVuln) {
      const dropPulse = (Math.sin(frameCount * 0.12 + st.x) + 1) * 0.5;
      ctx.fillStyle = dropPulse > 0.65 ? '#ffffff' : lavaGlow;
      ctx.beginPath();
      ctx.arc(st.x, stTipY + 1, 1.8 + dropPulse * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Plinto / Base Hexagonal Inferior Escalonada
  ctx.fillStyle = basaltShadow;
  ctx.beginPath();
  ctx.moveTo(-34, botY);
  ctx.lineTo(-46, botY + 12);
  ctx.lineTo(0, botY + 22);
  ctx.lineTo(0, botY + 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = basaltMid;
  ctx.beginPath();
  ctx.moveTo(34, botY);
  ctx.lineTo(46, botY + 12);
  ctx.lineTo(0, botY + 22);
  ctx.lineTo(0, botY + 8);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = edgeTrim;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-46, botY + 12);
  ctx.lineTo(0, botY + 22);
  ctx.lineTo(46, botY + 12);
  ctx.stroke();

  // =========================================================================
  // TIER 2: CORPO DO COLOSSO EM CARAPAÇA SEGMENTADA 2.5D
  // =========================================================================
  
  // Costura de Magma Subterrâneo exposta sob a couraça
  if (!isVuln) {
    ctx.fillStyle = lavaGlow;
    ctx.beginPath();
    ctx.ellipse(0, waistY, 46, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Placa Inferior (Abdômen do Titã)
  ctx.fillStyle = basaltShadow;
  ctx.beginPath();
  ctx.moveTo(0, waistY);
  ctx.lineTo(-38, waistY + 16);
  ctx.lineTo(-24, botY);
  ctx.lineTo(0, botY + 6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = basaltLight;
  ctx.beginPath();
  ctx.moveTo(0, waistY);
  ctx.lineTo(38, waistY + 16);
  ctx.lineTo(24, botY);
  ctx.lineTo(0, botY + 6);
  ctx.closePath();
  ctx.fill();

  // Carapaça Superior / Peitoral com Facetas Angulares Esculpidas
  // Faceta Esquerda (Sombra densa de basalto com gradiente de oclusão)
  ctx.fillStyle = basaltShadow;
  ctx.beginPath();
  ctx.moveTo(0, topY + 4);
  ctx.lineTo(-50, waistY - 4);
  ctx.lineTo(-26, botY);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(0, waistY);
  ctx.closePath();
  ctx.fill();

  // Faceta Direita (Iluminada com luz direcional do mundo)
  ctx.fillStyle = basaltLight;
  ctx.beginPath();
  ctx.moveTo(0, topY + 4);
  ctx.lineTo(50, waistY - 4);
  ctx.lineTo(26, botY);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(0, waistY);
  ctx.closePath();
  ctx.fill();

  // Faceta Central (Quilha Frontal Proeminente)
  ctx.fillStyle = basaltMid;
  ctx.beginPath();
  ctx.moveTo(0, topY + 4);
  ctx.lineTo(-22, waistY + 4);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(22, waistY + 4);
  ctx.closePath();
  ctx.fill();

  // Biséis e Chanfros Metálicos/Pétreos nas Arestas Externas
  ctx.strokeStyle = edgeTrim;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, topY + 4);
  ctx.lineTo(-50, waistY - 4);
  ctx.lineTo(-26, botY);
  ctx.lineTo(0, botY + 6);
  ctx.lineTo(26, botY);
  ctx.lineTo(50, waistY - 4);
  ctx.closePath();
  ctx.stroke();

  // Quilha Vertical e Nervuras Estruturais
  ctx.beginPath();
  ctx.moveTo(0, topY + 4);
  ctx.lineTo(0, botY + 6);
  ctx.moveTo(0, topY + 4);
  ctx.lineTo(-22, waistY + 4);
  ctx.lineTo(0, botY + 6);
  ctx.moveTo(0, topY + 4);
  ctx.lineTo(22, waistY + 4);
  ctx.lineTo(0, botY + 6);
  ctx.stroke();

  // =========================================================================
  // TIER 3: CALDEIRA VULCÂNICA CORONÁRIA & CHIFRES DE OBSIDIANA
  // =========================================================================

  // 1. Chifres Colossais de Obsidiana Curvados (Flanqueando o topo)
  const horns = [
    { sign: -1, baseW: 10, tipX: -36, tipY: topY - 30 },
    { sign: 1,  baseW: 10, tipX: 36,  tipY: topY - 30 }
  ];
  for (let hn of horns) {
    ctx.fillStyle = hn.sign === -1 ? basaltShadow : basaltLight;
    ctx.beginPath();
    ctx.moveTo(hn.sign * 12, topY);
    ctx.lineTo(hn.sign * (12 + hn.baseW), topY);
    ctx.quadraticCurveTo(hn.sign * 32, topY - 14, hn.tipX, hn.tipY);
    ctx.quadraticCurveTo(hn.sign * 22, topY - 8, hn.sign * 12, topY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = edgeTrim;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Cristal de fogo na ponta do chifre
    if (!isVuln) {
      ctx.fillStyle = (isP3 || isEnraged) ? '#ffffff' : lavaGlow;
      ctx.beginPath();
      ctx.arc(hn.tipX, hn.tipY, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Borda Externa da Caldeira Vulcânica
  ctx.fillStyle = basaltShadow;
  ctx.beginPath();
  ctx.ellipse(0, topY - 2, 26, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = edgeTrim;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // 3. Lago de Magma Fervente no Interior da Cratera
  if (!isVuln) {
    const caldGrad = ctx.createRadialGradient(0, topY - 2, 2, 0, topY - 2, 22);
    caldGrad.addColorStop(0, '#ffffff');
    caldGrad.addColorStop(0.35, emberCol);
    caldGrad.addColorStop(0.85, lavaGlow);
    caldGrad.addColorStop(1, '#1b0508');
    ctx.fillStyle = caldGrad;
    ctx.beginPath();
    ctx.ellipse(0, topY - 2, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bolha de Magma estourando na cratera
    const bProg = (frameCount * 0.08) % 1;
    const bX = Math.sin(frameCount * 0.15) * 8;
    const bY = topY - 2 + Math.cos(frameCount * 0.15) * 3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bX, bY, Math.max(1, 3.5 * (1 - bProg)), 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Pluma Volcânica: Fumaça Densa e Brasas Subindo ao Céu
  if (!isVuln) {
    // Fumaça volumétrica
    for (let s = 0; s < 5; s++) {
      const sProg = ((frameCount * 0.035 + s * 0.2) % 1);
      const sX = Math.sin(frameCount * 0.08 + s * 2) * (14 + s * 4);
      const sY = topY - 6 - sProg * 48;
      const sR = 5 + sProg * 14;
      ctx.fillStyle = `rgba(24, 14, 10, ${Math.max(0, (1 - sProg) * 0.45)})`;
      ctx.beginPath();
      ctx.arc(sX, sY, sR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Brasas incandescentes ejetadas
    ctx.fillStyle = isP3 ? '#ff7675' : '#f39c12';
    for (let c = 0; c < 6; c++) {
      const cProg = ((frameCount * 0.06 + c * 0.16) % 1);
      const cx = Math.sin(frameCount * 0.12 + c * 1.5) * 18;
      const cy = topY - 12 - cProg * 50;
      const cR = Math.max(0.6, 2.4 * (1 - cProg));
      ctx.beginPath();
      ctx.arc(cx, cy, cR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 5. Rede de Veias de Magma Fractais
  drawMagmaVeins(ctx, bob, frameCount, isVuln, isEnraged, isP3);
}

/**
 * Desenha o Olho Tectônico Primordial com anel de runas giratório,
 * arcos de plasma coronal em curvas de Bézier e pupila de obsidiana reativa.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {number} frameCount
 * @param {boolean} isVuln
 * @param {boolean} isEnraged
 * @param {boolean} isP3
 * @param {boolean} isChanneling
 * @param {boolean} isWindup
 */
export function drawAbyssalCore(ctx, e, bob, frameCount, isVuln, isEnraged, isP3, isChanneling, isWindup) {
  const coreY = -6 + bob;
  let coreBaseRadius = isVuln ? 11 : (isChanneling ? 28 : 19);
  if (isWindup) coreBaseRadius += 5;

  const pulse = isVuln ? 0 : Math.sin(frameCount * (isP3 ? 0.28 : (isEnraged ? 0.20 : 0.12))) * 2.8;
  const currentR = Math.max(8, coreBaseRadius + pulse);

  // 1. Soquete de Rocha Esculpida com Dentes Cônicos Interlocking
  ctx.fillStyle = '#0f1417';
  ctx.beginPath();
  ctx.arc(0, coreY, currentR + 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isVuln ? '#242b30' : (isChanneling ? '#e67e22' : (isP3 ? '#ff1744' : (isEnraged ? '#ff4757' : '#f39c12')));
  ctx.lineWidth = 2.8;
  ctx.stroke();

  // Dentes rochosos que seguram o olho
  const toothCount = 8;
  ctx.fillStyle = '#202932';
  for (let t = 0; t < toothCount; t++) {
    const ta = (t * Math.PI * 2) / toothCount;
    const tox = Math.cos(ta) * (currentR + 9);
    const toy = coreY + Math.sin(ta) * (currentR + 9);
    const tix = Math.cos(ta) * (currentR + 2);
    const tiy = coreY + Math.sin(ta) * (currentR + 2);

    ctx.beginPath();
    ctx.arc(tox, toy, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isVuln ? '#4b5760' : '#e67e22';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tix, tiy);
    ctx.stroke();
  }

  // 2. Anel Concêntrico de Runas Geológicas Rotativas
  if (!isVuln) {
    const runeRadius = currentR + 5;
    const rotSpeed = frameCount * 0.02;
    const runeCount = 6;
    ctx.fillStyle = isP3 ? '#ff7675' : '#f1c40f';
    for (let rn = 0; rn < runeCount; rn++) {
      const rAng = -rotSpeed + (rn * Math.PI * 2) / runeCount;
      const rx = Math.cos(rAng) * runeRadius;
      const ry = coreY + Math.sin(rAng) * runeRadius;
      ctx.fillRect(rx - 1.2, ry - 1.2, 2.4, 2.4);
    }
  }

  // 3. Erupções Solares e Arcos de Plasma Coronal em Curvas de Bézier
  if (!isVuln) {
    const flareCount = 6;
    ctx.strokeStyle = isP3 ? 'rgba(255, 23, 68, 0.65)' : 'rgba(243, 156, 18, 0.55)';
    ctx.lineWidth = 1.8;
    for (let f = 0; f < flareCount; f++) {
      const baseAng = (f * Math.PI * 2) / flareCount + frameCount * 0.025;
      const flareLen = currentR + 10 + Math.sin(frameCount * 0.18 + f * 2) * 5;
      const x1 = Math.cos(baseAng - 0.25) * currentR;
      const y1 = coreY + Math.sin(baseAng - 0.25) * currentR;
      const x2 = Math.cos(baseAng + 0.25) * currentR;
      const y2 = coreY + Math.sin(baseAng + 0.25) * currentR;
      const cx = Math.cos(baseAng) * flareLen;
      const cy = coreY + Math.sin(baseAng) * flareLen;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(cx, cy, x2, y2);
      ctx.stroke();
    }
  }

  // 4. Disco de Magma Incandescente com Gradiente Profundo de Radiação
  const grad = ctx.createRadialGradient(0, coreY, 2, 0, coreY, currentR);
  if (isVuln) {
    grad.addColorStop(0, '#57606f');
    grad.addColorStop(0.7, '#1e272e');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else if (isP3) {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.25, '#ff4757');
    grad.addColorStop(0.75, '#8b0000');
    grad.addColorStop(1, 'rgba(139, 0, 0, 0)');
  } else if (isEnraged || isChanneling) {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#ff9f43');
    grad.addColorStop(0.8, '#c0392b');
    grad.addColorStop(1, 'rgba(192, 57, 43, 0)');
  } else {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, '#f1c40f');
    grad.addColorStop(0.80, '#d35400');
    grad.addColorStop(1, 'rgba(211, 84, 0, 0)');
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, coreY, currentR, 0, Math.PI * 2);
  ctx.fill();

  // 5. Pupila de Obsidiana Viva com Dilatação e Reflexo Especular de Cristal
  if (!isVuln) {
    const slitW = isWindup ? 1.5 : (isChanneling ? 4.5 : 2.6);
    const slitH = currentR * 0.76;
    ctx.fillStyle = '#140205';
    ctx.beginPath();
    ctx.ellipse(0, coreY, slitW, slitH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ponto de Luz Especular Vítreo
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(slitW + 1.2, coreY - slitH * 0.32, 2.0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Desenha as orbes orbitais (Litocistos) como meteoros vulcânicos vivos com caudas de brasa.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} bob
 * @param {number} frameCount
 * @param {boolean} isEnraged
 * @param {boolean} isP3
 */
export function drawLitocistos(ctx, e, bob, frameCount, isEnraged, isP3) {
  const coreY = -4 + bob;

  for (let o of e.orbitals) {
    if (!o.active) continue;

    const ox = Math.cos(o.angle) * o.dist;
    const oy = Math.sin(o.angle) * o.dist + bob;

    // 1. Elo de Plasma Elétrico ao Núcleo
    ctx.save();
    ctx.strokeStyle = isP3 ? 'rgba(255, 23, 68, 0.45)' : (isEnraged ? 'rgba(255, 71, 87, 0.40)' : 'rgba(230, 126, 34, 0.35)');
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, coreY);
    ctx.lineTo(ox, oy);
    ctx.stroke();
    ctx.restore();

    // 2. Rastro de Cauda de Cometa / Partículas de Brasa
    ctx.save();
    for (let t = 1; t <= 3; t++) {
      const tailAng = o.angle - (t * 0.12);
      const tx = Math.cos(tailAng) * o.dist;
      const ty = Math.sin(tailAng) * o.dist + bob;
      const tAlpha = (1 - t / 3.5) * 0.55;
      ctx.fillStyle = isP3 ? `rgba(255, 23, 68, ${tAlpha})` : `rgba(243, 156, 18, ${tAlpha})`;
      ctx.beginPath();
      ctx.arc(tx, ty, Math.max(1, o.radius * (1 - t * 0.25)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. O Geodo / Meteoro Vulcânico
    ctx.save();
    ctx.translate(ox, oy);

    if (o.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, o.radius + 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Crosta Externa de Basalto
      ctx.fillStyle = isP3 ? '#30050a' : (isEnraged ? '#240a0e' : '#1e272e');
      ctx.beginPath();
      ctx.arc(0, 0, o.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isP3 ? '#ff1744' : (isEnraged ? '#ff4757' : '#e67e22');
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Interior de Magma Incandescente
      const orbGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, o.radius * 0.68);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.45, isP3 ? '#ff4d4d' : (isEnraged ? '#ff6b81' : '#f1c40f'));
      orbGrad.addColorStop(1, isP3 ? '#8b0000' : (isEnraged ? '#c0392b' : '#d35400'));
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(0, 0, o.radius * 0.68, 0, Math.PI * 2);
      ctx.fill();

      // Fissuras na Casca do Geodo
      ctx.strokeStyle = isP3 ? '#ffffff' : '#f1c40f';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(-o.radius * 0.4, -o.radius * 0.3);
      ctx.lineTo(0, 0);
      ctx.lineTo(o.radius * 0.3, o.radius * 0.4);
      ctx.moveTo(0, 0);
      ctx.lineTo(o.radius * 0.4, -o.radius * 0.2);
      ctx.stroke();

      // Arco de Vida Circular (Verde esmeralda com contorno fino)
      const hpPct = Math.max(0, o.hp / o.maxHp);
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, o.radius + 4, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * hpPct));
      ctx.stroke();
    }

    ctx.restore();
  }
}

/**
 * Função principal de renderização gráfica exportada de Ignis Lithos.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e
 * @param {number} frameCount
 */
export function drawAbyssalMonolith(ctx, e, frameCount) {
  // 1. Introdução Cinematográfica de 5 segundos (4 Atos)
  if (e.actionState === MONOLITH_STATES.SPAWN_INTRO) {
    drawMonolithSpawnIntro(ctx, e, frameCount);
    if (e.titleTimer > 0) {
      drawCinematicScreenTitle(bannerCtx || ctx, e, frameCount);
    }
    return;
  }

  // 2. Banner Cinematográfico de Título (continua visível na transição para combate)
  if (e.titleTimer > 0) {
    drawCinematicScreenTitle(bannerCtx || ctx, e, frameCount);
  }

  const isVuln = e.isVulnerable;
  const morph = e.phaseCinematic ? (e.phaseCinematic.morphProgress || 0) : (e.transformationProgress || 0);
  const targetPhase = e.phaseCinematic ? e.phaseCinematic.phase : (e.phase || 1);
  const isEnraged = e.isEnraged || (targetPhase >= 2 && morph > 0.05);
  const isP3 = e.isPhase3 || (targetPhase === 3 && morph > 0.05);
  const isWindup = e.actionState.startsWith('WINDUP');
  const isChanneling = e.actionState === MONOLITH_STATES.CHANNELING_SIPHON;

  const bob = isVuln ? 24 : (e.floatBob || 0);

  // 3. Elementos em Coordenadas de Mundo Absolutas (Desespelhadas)
  ctx.save();
  if (e.facing === -1) {
    ctx.scale(-1, 1);
  }

  // Renderização das Fontes Termais no Solo
  drawThermalVents(ctx, e, frameCount);

  // Telegrafias exclusivas do chefe (Epicentro, Onda de Fendas, Slam e Giro)
  drawTelegraphsAndZones(ctx, e, frameCount);

  // Orbes Orbitais (Litocistos como Meteoros)
  drawLitocistos(ctx, e, bob, frameCount, isEnraged, isP3);

  ctx.restore();

  // 4. Renderização do Corpo do Chefe (Orientado em e.facing)
  ctx.save();

  if (isWindup || isChanneling) {
    ctx.translate((Math.random() - 0.5) * 3.0, (Math.random() - 0.5) * 3.0);
  }

  // Tremor sísmico lento do corpo durante a metamorfose da fase
  if (e.phaseCinematic && morph > 0.1 && morph < 0.9) {
    const quake = Math.sin(frameCount * 0.4) * 2.0 * (1 - Math.abs(morph - 0.5) * 2);
    ctx.translate(quake, 0);
  }

  drawShadow(ctx, e, bob, isVuln);

  // Aura térmica e pulsos de magma em slow motion durante a transição cinematográfica
  if (e.phaseCinematic && morph > 0.05) {
    ctx.save();
    const heatAlpha = Math.sin(morph * Math.PI) * 0.65;
    const heatColorStr = targetPhase === 3 ? '255, 71, 87' : '255, 159, 67';
    const heatGrad = ctx.createRadialGradient(0, -6 + bob, 15, 0, -6 + bob, 120 * (0.8 + 0.5 * morph));
    heatGrad.addColorStop(0, `rgba(${heatColorStr}, ${heatAlpha * 0.45})`);
    heatGrad.addColorStop(0.65, `rgba(${heatColorStr}, ${heatAlpha * 0.18})`);
    heatGrad.addColorStop(1, `rgba(${heatColorStr}, 0)`);
    ctx.fillStyle = heatGrad;
    ctx.beginPath();
    ctx.arc(0, -6 + bob, 120 * (0.8 + 0.5 * morph), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawFloatingPlates(ctx, e, bob, frameCount, isVuln, isEnraged, isWindup);
  drawMegalithBody(ctx, e, bob, frameCount, isVuln, isEnraged, isP3);
  drawAbyssalCore(ctx, e, bob, frameCount, isVuln, isEnraged, isP3, isChanneling, isWindup);
  drawFloatingGauntlets(ctx, e, bob, frameCount, isVuln, isEnraged, isP3, isWindup);

  ctx.restore();
}
