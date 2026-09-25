/**
 * src/entities/bosses/abyssSovereign/render.js
 * Renderização procedural completa no Canvas do Soberano do Abismo (Boss 4 / Chefe Final).
 */
import { 
  dpr, 
  viewW, 
  viewH,
  bannerCtx 
} from '../../../main.js';
import { SOVEREIGN_STATES, SOVEREIGN_CONFIG } from './constants.js';
import { drawAbyssalBolt } from '../../../render/projectiles/abyssalBolt.js';
import { drawArenaPattern } from './arenaPatternsRender.js';
import { drawSovereignIntroBackdrop, drawSovereignIntroForeground, drawSovereignIntroTitle,
  SOVEREIGN_INTRO_TIMING, introEase } from './introEffects.js';

/**
 * Renderização da Introdução Majestosa em 4 Atos do Chefe Final (Soberano do Abismo).
 * Manifestação cósmica fiel à imagem de referência oficial:
 * Esfera de vácuo obsidiana, domo de vidro celeste com 16 arcos góticos, 4 agulhas cristalinas,
 * 9 tentáculos com nós de contas articulados, olho observador prateado, fenda dimensional reversa e pilar primordial.
 */
function drawMajesticSpawnIntro(ctx, e) {
  const R = e.radius;
  const introMax = e.introDuration || SOVEREIGN_CONFIG.INTRO_DURATION;
  const progress = Math.min(1, Math.max(0, 1 - e.introTimer / introMax));
  const time = progress * introMax;
  const timing = SOVEREIGN_INTRO_TIMING;
  drawSovereignIntroBackdrop(ctx, R, progress);

  // As camadas se sobrepõem: o portal continua visível enquanto a skin se materializa.
  const emerge = introEase((progress - timing.emerge) / 0.26);
  if (emerge > 0) {
    const bloom = introEase((progress - timing.limbs) / 0.29);
    const gaze = introEase((progress - timing.gaze) / 0.14);
    const settle = introEase((progress - timing.settle) / (1 - timing.settle));
    const charge = introEase((progress - timing.charge) / 0.08)
      * (1 - introEase((progress - timing.release) / 0.07));
    const scale = (0.58 + emerge * 0.42) * (1 - charge * 0.035);
    const floatY = Math.sin(time * 0.032) * 2 * emerge * (1 - settle);
    const appearance = { ...e, eyeAperture: gaze, corePulse: Math.sin(time * 0.12) };

    ctx.save();
    ctx.translate(0, (1 - emerge) * R * 0.65 + floatY);
    ctx.scale(scale, scale);
    ctx.globalAlpha *= introEase((progress - timing.emerge) / 0.09);

    // Cada membro se abre em sequência com profundidade 3D (Dorsal e Ventral)
    drawCelestialLimbs(ctx, appearance, R, time, false, false, false, bloom, 'DORSAL');
    ctx.save();
    const crystalGrowth = introEase((progress - 0.27) / 0.18);
    ctx.scale(1, Math.max(0.001, crystalGrowth));
    ctx.globalAlpha *= crystalGrowth;
    drawDownwardCrystallineSpikes(ctx, appearance, R, time);
    ctx.restore();

    const dormant = (1 - gaze) * 0.85;
    drawSacredMandalaVoidSphere(ctx, appearance, R, time, false, false, e.phase, dormant);
    drawCelestialLimbs(ctx, appearance, R, time, false, false, false, bloom, 'VENTRAL');
    drawColdObserverEye(ctx, appearance, R, time, false, false, false, e.phase, dormant);
    ctx.restore();
  }
  drawSovereignIntroForeground(ctx, R, progress);
}

/**
 * Renderiza a Sequência Cinematográfica Dramática de Derrota em 4 Atos do Soberano do Abismo.
 * Ato 1: Fratura Fatal & Desestabilização (Agulhas quebram, espasmos nos tentáculos, fendas na mandala).
 * Ato 2: Implosão Gravitacional de Vácuo (Vórtice reverso sugando a luz e matéria para dentro do olho).
 * Ato 3: Supernova Divina Dourada (Flash de glória celestial e dispersão em poeira estelar ascendente).
 * Ato 4: Despedida Estelar & Fade-out.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e Entidade do Soberano do Abismo
 * @param {number} frameCount
 */
function drawMajesticDeathCollapse(ctx, e, frameCount) {
  const R = e.radius;
  const maxT = e.defeatMaxTimer || 420;
  const progress = Math.min(1.0, Math.max(0, 1 - ((e.defeatTimer || 0) / maxT)));

  // =========================================================================
  // ATO 1: FRATURA FATAL & DESESTABILIZAÇÃO (0.00 <= progress < 0.25)
  // =========================================================================
  if (progress < 0.25) {
    const act1Prog = progress / 0.25;
    ctx.save();

    // Tremores e espasmos agônicos da carcaça titânica
    const spasmX = (Math.sin(frameCount * 0.9) * 2.5 + Math.cos(frameCount * 1.3) * 1.5) * (1 + act1Prog * 2);
    const spasmY = (Math.cos(frameCount * 0.8) * 2.0) * (1 + act1Prog * 2);
    ctx.translate(spasmX, spasmY);

    // 1. As 4 Agulhas Cristalinas inferiores partindo-se e caindo em pedaços girando
    const fallDist = Math.pow(act1Prog, 2) * 110;
    const spikeDefs = [
      { x: -R * 0.40, y: R * 0.70, len: 32, ang: 0.02, w: 6.5, vx: -32 * act1Prog, rot: -0.8 * act1Prog },
      { x: -R * 0.16, y: R * 0.80, len: 48, ang: 0.00, w: 8.5, vx: -14 * act1Prog, rot: -0.4 * act1Prog },
      { x:  R * 0.16, y: R * 0.80, len: 48, ang: 0.00, w: 8.5, vx:  14 * act1Prog, rot:  0.4 * act1Prog },
      { x:  R * 0.40, y: R * 0.70, len: 32, ang: -0.02, w: 6.5, vx:  32 * act1Prog, rot:  0.8 * act1Prog }
    ];

    for (let i = 0; i < spikeDefs.length; i++) {
      const sp = spikeDefs[i];
      const curX = sp.x + sp.vx;
      const curY = sp.y + fallDist;
      const curAng = sp.ang + sp.rot;

      ctx.save();
      ctx.translate(curX, curY);
      ctx.rotate(curAng);

      const tipX = Math.sin(0) * sp.len;
      const tipY = Math.cos(0) * sp.len;
      const perpX = sp.w * 0.5;

      ctx.fillStyle = '#0a0614';
      ctx.beginPath();
      ctx.moveTo(-perpX, 0);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(perpX, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Fissura de luz interna no fragmento
      ctx.strokeStyle = '#00cec9';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      ctx.restore();
    }

    // 2. Membros e Tentáculos Convulsionando com Faíscas
    ctx.save();
    drawCelestialLimbs(ctx, e, R, frameCount, true, false, false);
    ctx.restore();

    // 3. Domo Sagrado e Esfera Obsidiana com Trincas Violentas e Flash
    const isGlitchFlash = act1Prog > 0.10 && Math.floor(frameCount) % 4 === 0;
    drawSacredMandalaVoidSphere(ctx, e, R, frameCount, isGlitchFlash, true, 3, 0);

    // 4. Olho Observador Arregalado e Trincando
    e.eyeAperture = 1.0;
    drawColdObserverEye(ctx, e, R, frameCount, true, false, false, 3, 0);

    // 5. Relâmpagos de matéria escura e arco elétrico instável
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    for (let l = 0; l < 3; l++) {
      const lY = (Math.sin(frameCount * 0.5 + l * 2) * R * 0.7);
      const lW = Math.sin(frameCount * 0.6 + l) * (R * 1.1);
      ctx.beginPath();
      ctx.moveTo(0, lY);
      ctx.lineTo(lW * 0.5, lY + 6);
      ctx.lineTo(lW, lY - 4);
      ctx.stroke();
    }

    ctx.restore();
  }

  // =========================================================================
  // ATO 2: IMPLOSÃO GRAVITACIONAL DE VÁCUO (0.25 <= progress < 0.55)
  // =========================================================================
  else if (progress < 0.55) {
    const act2Prog = (progress - 0.25) / 0.30;
    const implodeScale = Math.max(0.04, 1.0 - Math.pow(act2Prog, 1.6) * 0.96);
    const spinAng = act2Prog * Math.PI * 4;

    ctx.save();

    // 1. Anéis concêntricos de sucção reversa (colapso gravitacional)
    for (let r = 0; r < 4; r++) {
      const ringProg = ((act2Prog * 3 + r * 0.25) % 1);
      const ringR = (1 - ringProg) * (R * 3.4);
      ctx.strokeStyle = r % 2 === 0 ? `rgba(0, 206, 201, ${ringProg * 0.9})` : `rgba(241, 196, 15, ${ringProg * 0.85})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(2, ringR), 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Raios de sucção espiral curvando para o centro
    const suctionRays = 8;
    for (let s = 0; s < suctionRays; s++) {
      const sAng = (s * Math.PI * 2) / suctionRays + act2Prog * 8;
      const rayLen = (1 - act2Prog) * 170;
      ctx.strokeStyle = s % 2 === 0 ? 'rgba(255, 255, 255, 0.85)' : 'rgba(232, 67, 147, 0.75)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sAng) * rayLen, Math.sin(sAng) * rayLen);
      ctx.lineTo(Math.cos(sAng + 0.35) * (rayLen * 0.25), Math.sin(sAng + 0.35) * (rayLen * 0.25));
      ctx.stroke();
    }

    // 3. Entidade sendo comprimida para dentro do próprio centro
    ctx.scale(implodeScale, implodeScale);
    ctx.rotate(spinAng);
    drawSacredMandalaVoidSphere(ctx, e, R, frameCount, true, true, 3, 0);
    drawColdObserverEye(ctx, e, R, frameCount, true, false, false, 3, 0);
    drawCelestialLimbs(ctx, e, R, frameCount, true, false, false);

    ctx.restore();

    // 4. Núcleo hiperdenso incandescente prestes a explodir
    const corePulse = 10 + Math.sin(frameCount * 0.5) * 4 + act2Prog * 14;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, corePulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 3.5;
    ctx.stroke();
  }

  // =========================================================================
  // ATO 3: SUPERNOVA DIVINA & DISSIPAÇÃO ESTELAR (0.55 <= progress < 0.85)
  // =========================================================================
  else if (progress < 0.85) {
    const act3Prog = (progress - 0.55) / 0.30;
    ctx.save();

    // 1. Flash Inicial e Corona Radiante da Supernova Divina Dourada/Branca
    if (act3Prog < 0.28) {
      const flashAlpha = 1 - (act3Prog / 0.28);
      const coronaR = (act3Prog / 0.28) * (R * 7.5);

      const blastGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, Math.max(12, coronaR));
      blastGrad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha * 0.98})`);
      blastGrad.addColorStop(0.25, `rgba(241, 196, 15, ${flashAlpha * 0.92})`);
      blastGrad.addColorStop(0.65, `rgba(0, 206, 201, ${flashAlpha * 0.50})`);
      blastGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = blastGrad;
      ctx.beginPath();
      ctx.arc(0, 0, coronaR, 0, Math.PI * 2);
      ctx.fill();

      // Feixes radiais de luz estelar saindo do epicentro
      const starRays = 12;
      for (let sr = 0; sr < starRays; sr++) {
        const sAng = (sr * Math.PI * 2) / starRays + frameCount * 0.02;
        ctx.strokeStyle = `rgba(255, 246, 169, ${flashAlpha * 0.75})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(sAng) * (coronaR * 1.25), Math.sin(sAng) * (coronaR * 1.25));
        ctx.stroke();
      }
    }

    // 2. Poeira Estelar Celestial Ascendente
    const stardustCount = 32;
    for (let p = 0; p < stardustCount; p++) {
      const pSeed = p * 137.5;
      const pT = ((frameCount * 0.015 + p * 0.035) % 1);
      const px = Math.sin(pSeed) * (R * 2.8);
      const py = (Math.cos(pSeed) * (R * 1.4)) - pT * 240;
      const pAlpha = Math.sin(pT * Math.PI) * (1 - act3Prog * 0.25);

      ctx.fillStyle = p % 3 === 0 ? `rgba(241, 196, 15, ${pAlpha})` : (p % 3 === 1 ? `rgba(255, 255, 255, ${pAlpha})` : `rgba(0, 206, 201, ${pAlpha})`);
      const pR = 2.2 + Math.sin(frameCount * 0.2 + p) * 1.4;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(0.6, pR), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // =========================================================================
  // ATO 4: DESPEDIDA ESTELAR & FADE-OUT (0.85 <= progress <= 1.00)
  // =========================================================================
  else {
    const act4Prog = (progress - 0.85) / 0.15;
    ctx.save();
    for (let p = 0; p < 18; p++) {
      const pSeed = p * 137.5;
      const pT = ((frameCount * 0.01 + p * 0.05) % 1);
      const px = Math.sin(pSeed) * (R * 2.4);
      const py = (Math.cos(pSeed) * (R * 1.2)) - pT * 220;
      const pAlpha = Math.sin(pT * Math.PI) * (1 - act4Prog);

      ctx.fillStyle = `rgba(241, 196, 15, ${pAlpha * 0.85})`;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}


/**
 * Renderiza a cartela de entrada abaixo do chefe, dentro da área cinematográfica.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e Entidade do Soberano do Abismo
 * @param {number} frameCount
 */
function drawCinematicScreenTitle(ctx, e) {
  const duration = e.introDuration || SOVEREIGN_CONFIG.INTRO_DURATION;
  const progress = Math.min(1, Math.max(0, 1 - e.introTimer / duration));
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawSovereignIntroTitle(ctx, viewW, viewH, progress);
  ctx.restore();
}

/**
 * Renderiza o Grande Banner Dourado de Vitória Cósmica ao abater o Soberano do Abismo.
 * Geometria heráldica inspirada no banner de boss, transmutada para Ouro Imperial Cósmico.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e Entidade do Soberano do Abismo
 * @param {number} frameCount
 */
function drawGoldenVictoryBanner(ctx, e, frameCount) {
  const maxT = e.defeatMaxTimer || 540;
  const progress = Math.min(1.0, Math.max(0, 1 - ((e.defeatTimer || 0) / maxT)));

  // O banner começa a surgir suavemente a partir de progress = 0.52 (Ato 3)
  if (progress < 0.52) return;

  const enterRatio = Math.min(1.0, (progress - 0.52) / 0.08);
  let bannerAlpha = enterRatio;
  if (progress > 0.94) {
    bannerAlpha = Math.max(0, (1.0 - progress) / 0.06);
  }

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = bannerAlpha;

  const screenW = viewW || (typeof window !== 'undefined' ? window.innerWidth : 1280);
  const screenH = viewH || (typeof window !== 'undefined' ? window.innerHeight : 800);
  const isVertical = screenH > screenW || screenW < 640;
  const isCompactH = screenH < 520;

  const bannerW = isVertical 
    ? Math.min(420, screenW * 0.94) 
    : (isCompactH ? Math.min(680, screenW * 0.90) : Math.min(940, screenW * 0.92));
  const bannerH = isVertical ? 108 : (isCompactH ? 90 : 128);
  const bx = (screenW - bannerW) / 2;
  const by = Math.round((screenH - bannerH) / 2 - (isVertical ? 40 : (isCompactH ? 15 : 28)));
  const centerX = screenW / 2;
  const centerY = by + bannerH / 2;

  // Punch-in zoom de entrada com sutil pulsação contínua
  const punchScale = 0.88 + 0.12 * Math.sin(enterRatio * Math.PI * 0.5) + Math.sin(frameCount * 0.04) * 0.006;
  ctx.translate(centerX, centerY);
  ctx.scale(punchScale, punchScale);
  ctx.translate(-centerX, -centerY);

  // 0. Raios Cósmicos Celestiais Rotativos atrás do banner (God Rays)
  ctx.save();
  const rayCount = isVertical ? 16 : 24;
  const rayRot = frameCount * 0.005;
  const maxRayDist = Math.max(bannerW * 0.75, 420);
  const rayGrad = ctx.createRadialGradient(centerX, centerY, 15, centerX, centerY, maxRayDist);
  rayGrad.addColorStop(0, 'rgba(255, 245, 170, 0.28)');
  rayGrad.addColorStop(0.3, 'rgba(241, 196, 15, 0.16)');
  rayGrad.addColorStop(0.7, 'rgba(212, 172, 13, 0.05)');
  rayGrad.addColorStop(1, 'rgba(212, 172, 13, 0)');
  ctx.fillStyle = rayGrad;

  for (let r = 0; r < rayCount; r++) {
    const ang = rayRot + (r * Math.PI * 2) / rayCount;
    const rayWidth = (r % 2 === 0 ? 0.06 : 0.032);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, maxRayDist, ang - rayWidth, ang + rayWidth);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 1. Fundo Imperial Obsidiana com Ouro Profundo
  const bgGrad = ctx.createLinearGradient(bx, by, bx + bannerW, by);
  bgGrad.addColorStop(0, 'rgba(10, 8, 2, 0)');
  bgGrad.addColorStop(0.12, 'rgba(20, 15, 4, 0.96)');
  bgGrad.addColorStop(0.5, 'rgba(46, 34, 8, 0.98)');
  bgGrad.addColorStop(0.88, 'rgba(20, 15, 4, 0.96)');
  bgGrad.addColorStop(1, 'rgba(10, 8, 2, 0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(bx, by, bannerW, bannerH);

  // 2. Frisos de Neon Dourado Superior e Inferior com pulsação
  const pulseGlow = 14 + Math.sin(frameCount * 0.12) * 6;
  const borderGrad = ctx.createLinearGradient(bx, by, bx + bannerW, by);
  borderGrad.addColorStop(0, 'rgba(241, 196, 15, 0)');
  borderGrad.addColorStop(0.2, 'rgba(241, 196, 15, 0.95)');
  borderGrad.addColorStop(0.5, 'rgba(255, 250, 190, 1)');
  borderGrad.addColorStop(0.8, 'rgba(241, 196, 15, 0.95)');
  borderGrad.addColorStop(1, 'rgba(241, 196, 15, 0)');

  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = isVertical ? 2.4 : 3.0;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + bannerW, by);
  ctx.moveTo(bx, by + bannerH);
  ctx.lineTo(bx + bannerW, by + bannerH);
  ctx.stroke();

  // Frisos internos dourados finos
  ctx.strokeStyle = 'rgba(255, 235, 150, 0.4)';
  ctx.lineWidth = 1;
  const padX = isVertical ? 22 : 45;
  ctx.beginPath();
  ctx.moveTo(bx + padX, by + 3);
  ctx.lineTo(bx + bannerW - padX, by + 3);
  ctx.moveTo(bx + padX, by + bannerH - 3);
  ctx.lineTo(bx + bannerW - padX, by + bannerH - 3);
  ctx.stroke();

  // 3. Cantoneiras Geométricas Douradas e Gemas Celestiais
  const cornerSize = isVertical ? 12 : 18;
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(bx + padX * 0.7, by - 1.5, cornerSize, 3);
  ctx.fillRect(bx + bannerW - padX * 0.7 - cornerSize, by - 1.5, cornerSize, 3);
  ctx.fillStyle = '#d4ac0d';
  ctx.fillRect(bx + padX * 0.7, by + bannerH - 1.5, cornerSize, 3);
  ctx.fillRect(bx + bannerW - padX * 0.7 - cornerSize, by + bannerH - 1.5, cornerSize, 3);

  // 4. Efeito de Shimmer Metálico Deslizante (Varredura Diagonal Dourada)
  const shimmerCycle = (frameCount * 0.014) % 1.6;
  if (shimmerCycle <= 1.0) {
    const shimmerX = bx - 100 + shimmerCycle * (bannerW + 200);
    const shimGrad = ctx.createLinearGradient(shimmerX - 70, by, shimmerX + 70, by + bannerH);
    shimGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    shimGrad.addColorStop(0.35, 'rgba(255, 245, 180, 0.10)');
    shimGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.40)');
    shimGrad.addColorStop(0.65, 'rgba(255, 245, 180, 0.10)');
    shimGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by, bannerW, bannerH);
    ctx.clip();
    ctx.fillStyle = shimGrad;
    ctx.fillRect(bx, by, bannerW, bannerH);
    ctx.restore();
  }

  // 5. Partículas e Brasas Douradas Cintilantes ao Redor das Bordas
  const sparkCount = isVertical ? 12 : 18;
  for (let s = 0; s < sparkCount; s++) {
    const sparkSeed = s * 79.19;
    const sProg = ((frameCount * 0.018 + sparkSeed) % 1.0);
    const perimeterPos = ((s * 0.23) % 1.0);
    let sx, sy;
    if (perimeterPos < 0.35) {
      sx = bx + (perimeterPos / 0.35) * bannerW;
      sy = by - 3 - sProg * 14;
    } else if (perimeterPos < 0.70) {
      sx = bx + ((perimeterPos - 0.35) / 0.35) * bannerW;
      sy = by + bannerH + 3 + sProg * 14;
    } else if (perimeterPos < 0.85) {
      sx = bx - 3 - sProg * 12;
      sy = by + ((perimeterPos - 0.70) / 0.15) * bannerH;
    } else {
      sx = bx + bannerW + 3 + sProg * 12;
      sy = by + ((perimeterPos - 0.85) / 0.15) * bannerH;
    }
    const sAlpha = Math.sin(sProg * Math.PI);
    const sSize = 1.2 + (s % 3 === 0 ? 1.6 : 0.8);
    ctx.fillStyle = `rgba(255, 245, 180, ${sAlpha * 0.95})`;
    ctx.beginPath();
    ctx.moveTo(sx, sy - sSize);
    ctx.lineTo(sx + sSize, sy);
    ctx.lineTo(sx, sy + sSize);
    ctx.lineTo(sx - sSize, sy);
    ctx.closePath();
    ctx.fill();
  }

  // 6. Textos e Glifos do Banner Dourado
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const stats = e.victoryStats || { time: '10:00', kills: 0, level: 1, gold: 0 };

  if (isVertical) {
    // Layout Vertical
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#f6e58d';
    ctx.fillText("[ CATACLISMA PURGADO • O ABISMO FOI SELADO ]", screenW / 2, by + 14);

    const titleY = by + 37;
    const titleGrad = ctx.createLinearGradient(0, titleY - 10, 0, titleY + 10);
    titleGrad.addColorStop(0, '#ffffff');
    titleGrad.addColorStop(0.5, '#fff7c2');
    titleGrad.addColorStop(1, '#f1c40f');

    ctx.font = 'bold 19px "Cinzel", "Cinzel Decorative", Georgia, serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillText("❖ VITÓRIA SUPREMA ❖", screenW / 2 + 1, titleY + 1.5);
    ctx.fillStyle = titleGrad;
    ctx.fillText("❖ VITÓRIA SUPREMA ❖", screenW / 2, titleY);

    ctx.font = 'italic 10px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#fff2a8';
    ctx.fillText("✦ O SOBERANO DO ABISMO FOI ANIQUILADO ✦", screenW / 2, by + 58);

    // Linha de Honra e Métricas
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(`TEMPO: ${stats.time}  •  ABATES: ${stats.kills}  •  NÍVEL: ${stats.level}  •  OURO: +${stats.gold}`, screenW / 2, by + 84);
  } else {
    // Layout Horizontal
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#f6e58d';
    ctx.fillText("[ CATACLISMA PURGADO // A ORDEM CÓSMICA FOI RESTAURADA ]", screenW / 2, by + 22);

    const titleY = by + 53;
    const titleGrad = ctx.createLinearGradient(0, titleY - 16, 0, titleY + 16);
    titleGrad.addColorStop(0, '#ffffff');
    titleGrad.addColorStop(0.45, '#fff8cc');
    titleGrad.addColorStop(0.8, '#f1c40f');
    titleGrad.addColorStop(1, '#d4ac0d');

    ctx.font = 'bold 31px "Cinzel", "Cinzel Decorative", Georgia, serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillText("❖ VITÓRIA SUPREMA ❖", screenW / 2 + 1.5, titleY + 2);
    ctx.fillStyle = titleGrad;
    ctx.fillText("❖ VITÓRIA SUPREMA ❖", screenW / 2, titleY);

    ctx.font = 'italic 13px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#fff2a8';
    ctx.fillText("✦ O SOBERANO DO ABISMO FOI ANIQUILADO E AS TREVAS EXPURGADAS ✦", screenW / 2, by + 82);

    // Fita de Honra com Métricas Destacadas
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(`TEMPO DE COMBATE: ${stats.time}    |    MONSTROS EXPURGADOS: ${stats.kills}    |    NÍVEL: ${stats.level}    |    OURO CONQUISTADO: +${stats.gold}`, screenW / 2, by + 108);
  }

  ctx.restore();
}

/**
 * Renderiza a camada completa de vitória cósmica sobre todas as outras camadas de jogo:
 * Banner Dourado Animado e Cortina de Fade-Out para o Menu.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e Entidade do Soberano do Abismo
 * @param {number} frameCount
 */
export function drawBossVictoryOverlay(ctx, e, frameCount) {
  if (!e) return;
  // O antigo banner simples foi removido em favor do close-up cinematográfico e da nova tela monumental de vitória
  if (e.fadeAlpha > 0) {
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const screenW = viewW || (typeof window !== 'undefined' ? window.innerWidth : 1280);
    const screenH = viewH || (typeof window !== 'undefined' ? window.innerHeight : 800);
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1.0, e.fadeAlpha)})`;
    ctx.fillRect(0, 0, screenW, screenH);
    ctx.restore();
  }
}

/**
 * Renderiza os Locais de Cura Sagrados (Santuários de Luz Celestial) na Arena do Soberano.
 * Exibe halo esmeralda, anel rúnico, medidor circular decrescente dos 7 segundos e cruz de restauração.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e Entidade do Soberano do Abismo
 * @param {number} frameCount
 */
function drawHealingZones(ctx, e, frameCount) {
  if (!e.healingZones || e.healingZones.length === 0) return;

  for (let i = 0; i < e.healingZones.length; i++) {
    const zone = e.healingZones[i];
    const R = zone.radius;
    const lifeRatio = Math.max(0, zone.life / (zone.maxLife || 420));

    ctx.save();
    // drawAbyssSovereign já neutralizou o facing horizontal, mantendo coordenadas de mundo 1:1
    ctx.translate(zone.x - e.x, zone.y - e.y);

    // 1. Halo Radial de Luz Esmeralda/Ouro no Solo
    const pulse = Math.sin(frameCount * 0.14 + i * 2) * 4;
    const groundGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, R + pulse);
    groundGrad.addColorStop(0, 'rgba(46, 204, 113, 0.45)');
    groundGrad.addColorStop(0.65, 'rgba(26, 188, 156, 0.22)');
    groundGrad.addColorStop(0.9, 'rgba(241, 196, 15, 0.15)');
    groundGrad.addColorStop(1, 'rgba(46, 204, 113, 0)');
    ctx.fillStyle = groundGrad;
    ctx.beginPath();
    ctx.arc(0, 0, R + pulse, 0, Math.PI * 2);
    ctx.fill();

    // 2. Anel de Limite Sagrado Rúnico (Halo duplo de alto contraste sem blur)
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.35)';
    ctx.lineWidth = zone.playerInside ? 5.5 : 4.0;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = zone.playerInside ? '#ffffff' : 'rgba(46, 204, 113, 0.85)';
    ctx.lineWidth = zone.playerInside ? 3.0 : 2.2;
    ctx.stroke();

    // 3. Medidor Circular de Duração Residual (Contagem Regressiva dos 7 Segundos)
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, R + 4, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * lifeRatio));
    ctx.stroke();

    // 4. Glifos Celestiais Orbitantes
    const rot = frameCount * 0.035;
    ctx.save();
    ctx.rotate(rot);
    const glyphCount = 4;
    for (let g = 0; g < glyphCount; g++) {
      const ga = (g * Math.PI * 2) / glyphCount;
      const gx = Math.cos(ga) * (R * 0.65);
      const gy = Math.sin(ga) * (R * 0.65);
      ctx.fillStyle = g % 2 === 0 ? '#2ecc71' : '#f1c40f';
      ctx.beginPath();
      ctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 5. Cruz Sagrada de Cura no Centro
    ctx.fillStyle = zone.playerInside ? '#ffffff' : '#2ecc71';
    const cSize = Math.round(R * 0.26);
    const cThick = 5.5;
    ctx.fillRect(-cSize / 2, -cThick / 2, cSize, cThick);
    ctx.fillRect(-cThick / 2, -cSize / 2, cThick, cSize);

    // 6. Partículas Ascendentes de Cura
    const sparkleCount = 4;
    for (let sp = 0; sp < sparkleCount; sp++) {
      const spProgress = ((frameCount * 0.04 + sp * 0.25) % 1);
      const spAng = sp * 1.57;
      const spDist = (R * 0.4) * (1 - spProgress * 0.3);
      const spX = Math.cos(spAng) * spDist;
      const spY = Math.sin(spAng) * spDist - spProgress * 35;
      const spAlpha = Math.sin(spProgress * Math.PI);
      ctx.fillStyle = sp % 2 === 0 ? `rgba(46, 204, 113, ${spAlpha})` : `rgba(241, 196, 15, ${spAlpha})`;
      ctx.beginPath();
      ctx.arc(spX, spY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Texto Flutuante Indicador de Duração
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 9px monospace';
    const secondsLeft = (zone.life / 60).toFixed(1);
    ctx.fillStyle = '#000000';
    ctx.fillText(`CURA +10%/s (${secondsLeft}s)`, 1, -R - 9);
    ctx.fillStyle = zone.playerInside ? '#ffffff' : '#2ecc71';
    ctx.fillText(`CURA +10%/s (${secondsLeft}s)`, 0, -R - 10);

    ctx.restore();
  }
}

/**
 * Renderiza as Asas Celestiais de Plasma da Singularidade na Fase 3.
 */
function drawSingularityPlasmaWings(ctx, e, R, frameCount, edgeCol, isStaggered, idleBlend = 0) {
  ctx.save();
  const wingPairs = 2;
  const wingBreath = Math.sin(frameCount * 0.08) * 8;
  const wingFade = Math.max(0.08, 1.0 - (idleBlend || 0) * 0.88);
  ctx.globalAlpha = (ctx.globalAlpha || 1.0) * wingFade;

  for (let side = -1; side <= 1; side += 2) {
    for (let w = 0; w < wingPairs; w++) {
      const wingLen = (R * (1.75 + w * 0.45)) + wingBreath;
      const wingAng = (w === 0 ? -0.38 : -0.72) + Math.sin(frameCount * 0.06 + w) * 0.08;

      ctx.save();
      ctx.scale(side, 1);

      // Pena/Feixe de plasma principal
      const rootX = R * 0.35;
      const rootY = -R * 0.15;
      const tipX = rootX + Math.cos(wingAng) * wingLen;
      const tipY = rootY + Math.sin(wingAng) * wingLen;
      const cpX = rootX + Math.cos(wingAng + 0.3) * (wingLen * 0.55);
      const cpY = rootY + Math.sin(wingAng + 0.3) * (wingLen * 0.55);

      // Gradiente de plasma
      const wingGrad = ctx.createLinearGradient(rootX, rootY, tipX, tipY);
      wingGrad.addColorStop(0, 'rgba(215, 200, 255, 0.75)');
      wingGrad.addColorStop(0.5, 'rgba(180, 160, 255, 0.45)');
      wingGrad.addColorStop(0.9, 'rgba(255, 255, 255, 0.85)');
      wingGrad.addColorStop(1, 'rgba(215, 200, 255, 0)');

      ctx.strokeStyle = wingGrad;
      ctx.lineWidth = 4.5 - w * 1.2;
      ctx.beginPath();
      ctx.moveTo(rootX, rootY);
      ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
      ctx.stroke();

      // Feixe central superaquecido
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.restore();
    }
  }
  ctx.restore();
}

/**
 * Renderiza o cluster de espinhos cristalinos negros apontando para baixo na base da esfera.
 * Incorpora suspensão magnética (micro-flutuação harmônica vertical em antifase) e engastes facetados na carapaça (Fase 4).
 */
function drawDownwardCrystallineSpikes(ctx, e, R, frameCount) {
  ctx.save();
  // 4 agulhas cristalinas voltadas para baixo na base do orbe, emoldurando o tentáculo central inferior
  const spikeDefs = [
    { x: -R * 0.40, y: R * 0.70, len: 32, ang: 0.02, w: 6.5, phase: 0 },
    { x: -R * 0.16, y: R * 0.80, len: 48, ang: 0.00, w: 8.5, phase: 1.57 },
    { x:  R * 0.16, y: R * 0.80, len: 48, ang: 0.00, w: 8.5, phase: 3.14 },
    { x:  R * 0.40, y: R * 0.70, len: 32, ang: -0.02, w: 6.5, phase: 4.71 }
  ];

  const energyCol = (e.phase === 3 ? '#00cec9' : (e.phase === 2 ? '#ff7675' : '#a29bfe'));

  for (let i = 0; i < spikeDefs.length; i++) {
    const sp = spikeDefs[i];
    // Micro-flutuação harmônica vertical em antifase (suspensão gravitacional magnética)
    const floatY = Math.sin(frameCount * 0.065 + sp.phase) * 1.8;
    const curY = sp.y + floatY;

    const tipX = sp.x + Math.sin(sp.ang) * sp.len;
    const tipY = curY + Math.cos(sp.ang) * sp.len;
    const perpX = Math.cos(sp.ang) * (sp.w * 0.5);
    const perpY = -Math.sin(sp.ang) * (sp.w * 0.5);

    // 1. Corpo metálico grafite/obsidiana da agulha
    const spGrad = ctx.createLinearGradient(sp.x, curY, tipX, tipY);
    spGrad.addColorStop(0, '#1a1824');
    spGrad.addColorStop(0.5, '#0b0814');
    spGrad.addColorStop(1, '#05020a');
    ctx.fillStyle = spGrad;
    ctx.beginPath();
    ctx.moveTo(sp.x - perpX, curY - perpY);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(sp.x + perpX, curY + perpY);
    ctx.closePath();
    ctx.fill();

    // Contorno iluminado prata-ciano
    ctx.strokeStyle = '#e0f7fa';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Aresta central de reflexo
    ctx.strokeStyle = 'rgba(129, 236, 236, 0.75)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(sp.x, curY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // 2. Engaste facetado escuro de fixação na base da carapaça (abraçadeira magnética)
    const socketW = sp.w * 1.35;
    const socketH = 4.2;
    ctx.fillStyle = '#0a0912';
    ctx.beginPath();
    ctx.rect(sp.x - socketW * 0.5, curY - socketH * 0.5, socketW, socketH);
    ctx.fill();

    ctx.strokeStyle = '#f5f6fa';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(sp.x - socketW * 0.5, curY - socketH * 0.5, socketW, socketH);

    // Micro-núcleo de energia no centro do engaste
    ctx.fillStyle = energyCol;
    ctx.beginPath();
    ctx.arc(sp.x, curY, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Renderiza os 12 Tentáculos Articulados com Juntas de Nodos Facetados, Física de Inércia
 * e Suporte a Camadas de Profundidade 3D (Dorsal/Ventral) com Simetria Bilateral Perfeita (Fase 4).
 */
function drawCelestialLimbs(ctx, e, R, frameCount, isStaggered, isWindup, isCasting, introBloom = 1, layer = 'ALL') {
  // Se os tentáculos estiverem totalmente recolhidos para dentro do corpo (ex: Turbilhão Abissal), pula o desenho completamente para poupar FPS
  if (e.tentacleExtension !== undefined && e.tentacleExtension <= 0.001) {
    return;
  }

  // Configuração dos 12 tentáculos com distribuição angular de 30° e simetria bilateral perfeita
  const limbConfigs = [
    // 0: Superior vertical central (aponta para cima, -90°) - Ventral
    { baseAng: -Math.PI * 0.50, segs: [ { len: 18, ang: 0.00 }, { len: 16, ang: 0.02 }, { len: 15, ang: -0.02 }, { len: 14, ang: 0.00 } ] },
    // 1: Superior Direito Diagonal (-60°) - Dorsal
    { baseAng: -Math.PI / 3, segs: [ { len: 18, ang: 0.06 }, { len: 16, ang: -0.04 }, { len: 15, ang: 0.08 }, { len: 14, ang: -0.10 } ] },
    // 2: Médio-Superior Direito (-30°) - Ventral
    { baseAng: -Math.PI / 6, segs: [ { len: 19, ang: 0.05 }, { len: 17, ang: 0.08 }, { len: 15, ang: -0.06 }, { len: 14, ang: 0.12 } ] },
    // 3: Médio Direito Horizontal (0°) - Dorsal
    { baseAng: 0.00, segs: [ { len: 19, ang: 0.04 }, { len: 17, ang: 0.10 }, { len: 15, ang: -0.08 }, { len: 14, ang: 0.14 } ] },
    // 4: Médio-Inferior Direito (+30°) - Ventral
    { baseAng: Math.PI / 6, segs: [ { len: 18, ang: 0.06 }, { len: 16, ang: -0.04 }, { len: 15, ang: 0.10 }, { len: 14, ang: -0.16 } ] },
    // 5: Inferior Direito Diagonal (+60°) - Dorsal
    { baseAng: Math.PI / 3, segs: [ { len: 18, ang: 0.04 }, { len: 16, ang: 0.08 }, { len: 15, ang: -0.06 }, { len: 14, ang: 0.12 } ] },
    // 6: Inferior vertical central (desce entre as 4 agulhas cristalinas, +90°) - Ventral
    { baseAng: Math.PI * 0.50, segs: [ { len: 20, ang: 0.00 }, { len: 18, ang: 0.02 }, { len: 16, ang: -0.02 }, { len: 15, ang: 0.00 } ] },
    // 7: Inferior Esquerdo Diagonal (+120°, espelho do 5) - Dorsal
    { baseAng: Math.PI * 2 / 3, segs: [ { len: 18, ang: -0.04 }, { len: 16, ang: -0.08 }, { len: 15, ang: 0.06 }, { len: 14, ang: -0.12 } ] },
    // 8: Médio-Inferior Esquerdo (+150°, espelho do 4) - Ventral
    { baseAng: Math.PI * 5 / 6, segs: [ { len: 18, ang: -0.06 }, { len: 16, ang: 0.04 }, { len: 15, ang: -0.10 }, { len: 14, ang: 0.16 } ] },
    // 9: Médio Esquerdo Horizontal (180°, espelho do 3) - Dorsal
    { baseAng: Math.PI, segs: [ { len: 19, ang: -0.04 }, { len: 17, ang: -0.10 }, { len: 15, ang: 0.08 }, { len: 14, ang: -0.14 } ] },
    // 10: Médio-Superior Esquerdo (-150°, espelho do 2) - Ventral
    { baseAng: -Math.PI * 5 / 6, segs: [ { len: 19, ang: -0.05 }, { len: 17, ang: -0.08 }, { len: 15, ang: 0.06 }, { len: 14, ang: -0.12 } ] },
    // 11: Superior Esquerdo Diagonal (-120°, espelho do 1) - Dorsal
    { baseAng: -Math.PI * 2 / 3, segs: [ { len: 18, ang: -0.06 }, { len: 16, ang: 0.04 }, { len: 15, ang: -0.08 }, { len: 14, ang: 0.10 } ] }
  ];

  ctx.save();
  const time = frameCount * 0.04;
  const isIdle = e.actionState === SOVEREIGN_STATES.IDLE;
  const waveAmp = isIdle ? 0.025 : (isStaggered ? 0.02 : (isWindup ? 0.14 : 0.06));

  for (let l = 0; l < limbConfigs.length; l++) {
    const isVentral = (l % 2 === 0);
    if (layer === 'DORSAL' && isVentral) continue;
    if (layer === 'VENTRAL' && !isVentral) continue;

    const limb = limbConfigs[l];
    const growth = introBloom === 1 ? 1 : introEase((introBloom - l * 0.02) / 0.8);
    if (growth <= 0) continue;

    // Extensão dinâmica individual com leve ondulação/stagger angular para aspecto natural e biológico
    let limbExt = e.tentacleExtension !== undefined ? e.tentacleExtension : 1.0;
    if (e.tentacleRetractProg !== undefined && e.tentacleRetractProg > 0) {
      const limbStagger = (l % 4) * 0.035;
      const clampedP = Math.max(0, Math.min(1.0, (e.tentacleRetractProg - limbStagger) / (1.0 - 0.105)));
      const limbEase = clampedP < 0.5 
        ? 4 * clampedP * clampedP * clampedP 
        : 1 - Math.pow(-2 * clampedP + 2, 3) / 2;
      limbExt = 1.0 - limbEase;
    }

    if (limbExt <= 0.005) continue;

    ctx.save();
    if (layer === 'DORSAL') {
      ctx.globalAlpha *= 0.86; // profundidade atmosférica para membros de fundo
    }
    ctx.globalAlpha *= growth * Math.min(1.0, limbExt * 1.5);

    // Ponto de ancoragem na borda externa que retrai sutilmente para dentro da carapaça
    const anchorDist = R * (0.80 + 0.25 * limbExt);
    let currX = Math.cos(limb.baseAng) * anchorDist;
    let currY = Math.sin(limb.baseAng) * anchorDist;

    // Curvatura helicoidal biomecânica natural conforme o membro se retrai
    const curlDir = (l % 2 === 0 ? 1 : -1);
    const retractCurl = (1 - limbExt) * 0.75 * curlDir;
    let accumAng = limb.baseAng + (1 - growth) * 0.7 + retractCurl;

    const physLimb = e.tentaclePhysics && e.tentaclePhysics[l];

    for (let s = 0; s < limb.segs.length; s++) {
      const seg = limb.segs[s];
      // Ondulação orgânica sutil de respiração que viaja da raiz à ponta (Fase 5)
      const wave = Math.sin(time * 0.9 + (isVentral ? l : -l) * 0.45 - s * 0.72) * waveAmp;
      // Inércia física dinamicamente simulada pelo sistema spring-damper com acoplamento e arrasto
      const inOffset = (physLimb && physLimb[s]) ? physLimb[s].angleOffset : 0;
      // Curvatura progressiva em espiral por segmento durante a retração
      const segCurl = (1 - limbExt) * 0.28 * curlDir * (s + 1);
      accumAng += seg.ang + inOffset + wave + segCurl;

      const effectiveGrowth = growth * limbExt;
      const nextX = currX + Math.cos(accumAng) * seg.len * effectiveGrowth;
      const nextY = currY + Math.sin(accumAng) * seg.len * effectiveGrowth;

      // 1. Haste do Segmento com Sombreamento Bicolor Metálico (Fase 3: Volume & Reflexo)
      const segWidth = Math.max(1.4, (6.2 - s * 0.95) * (0.35 + 0.65 * limbExt));
      const nextSegW = Math.max(1.1, (6.2 - (s + 1) * 0.95) * (0.35 + 0.65 * limbExt));

      const segDx = nextX - currX;
      const segDy = nextY - currY;
      const segL = Math.hypot(segDx, segDy) || 1;
      const nx = -segDy / segL;
      const ny = segDx / segL;
      // Vetor normal apontando para o hemisfério iluminado (zenital cósmico superior)
      const lightSign = ny < 0 ? 1 : -1;
      const lx = nx * lightSign;
      const ly = ny * lightSign;

      // Base do corpo metálico
      ctx.strokeStyle = '#181923';
      ctx.lineWidth = segWidth;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(currX, currY);
      ctx.lineTo(nextX, nextY);
      ctx.stroke();

      // Lado Sombreado Inferior (Ambient Occlusion e sombra de carapaça)
      ctx.strokeStyle = '#08080f';
      ctx.lineWidth = segWidth * 0.44;
      ctx.beginPath();
      ctx.moveTo(currX - lx * segWidth * 0.28, currY - ly * segWidth * 0.28);
      ctx.lineTo(nextX - lx * nextSegW * 0.28, nextY - ly * nextSegW * 0.28);
      ctx.stroke();

      // Lado Iluminado Superior (Reflexo prateado polido de alta presença)
      ctx.strokeStyle = '#f5f6fa';
      ctx.lineWidth = segWidth * 0.44;
      ctx.beginPath();
      ctx.moveTo(currX + lx * segWidth * 0.28, currY + ly * segWidth * 0.28);
      ctx.lineTo(nextX + lx * nextSegW * 0.28, nextY + ly * nextSegW * 0.28);
      ctx.stroke();

      // Fio de destaque especular puro no topo do bisel
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(0.6, segWidth * 0.16);
      ctx.beginPath();
      ctx.moveTo(currX + lx * segWidth * 0.36, currY + ly * segWidth * 0.36);
      ctx.lineTo(nextX + lx * nextSegW * 0.36, nextY + ly * nextSegW * 0.36);
      ctx.stroke();

      // Canelura central (entalhe luminescente reativo a ataques)
      const energyCol = (e.phase === 3 ? '#00cec9' : (e.phase === 2 ? '#ff7675' : '#a29bfe'));
      if ((isWindup || isCasting) && s < 2) {
        const caneluraPulse = 0.5 + Math.sin(frameCount * 0.35 + l * 0.5) * 0.5;
        ctx.save();
        ctx.strokeStyle = energyCol;
        ctx.lineWidth = Math.max(0.8, segWidth * 0.22);
        ctx.globalAlpha *= caneluraPulse;
        ctx.beginPath();
        ctx.moveTo(currX + (nextX - currX) * 0.12, currY + (nextY - currY) * 0.12);
        ctx.lineTo(currX + (nextX - currX) * 0.88, currY + (nextY - currY) * 0.88);
        ctx.stroke();
        ctx.restore();
      } else {
        // Friso chanfrado escuro de divisão mecânica
        ctx.strokeStyle = '#2f3640';
        ctx.lineWidth = Math.max(0.7, segWidth * 0.20);
        ctx.beginPath();
        ctx.moveTo(currX + (nextX - currX) * 0.15, currY + (nextY - currY) * 0.15);
        ctx.lineTo(currX + (nextX - currX) * 0.85, currY + (nextY - currY) * 0.85);
        ctx.stroke();
      }

      // 2. Articulações das Juntas: Capas Facetadas nas Juntas Proximais (s <= 1) e Contas Biseladas (s >= 2)
      const tanX = Math.cos(accumAng);
      const tanY = Math.sin(accumAng);

      if (s <= 1) {
        // === CAPA FACETADA DE ARMADURA NAS ARTICULAÇÕES PRÓXIMAS AO CORPO ===
        const capLen = (6.2 - s * 0.85);
        const capW = (7.4 - s * 0.95);

        const r0X = currX - tanX * capLen * 0.45;
        const r0Y = currY - tanY * capLen * 0.45;
        const l1X = currX + lx * capW;
        const l1Y = currY + ly * capW;
        const f2X = currX + tanX * capLen * 0.85;
        const f2Y = currY + tanY * capLen * 0.85;
        const s3X = currX - lx * capW * 0.88;
        const s3Y = currY - ly * capW * 0.88;

        // Faceta Superior Iluminada (Prata polida)
        ctx.fillStyle = '#dcdde1';
        ctx.beginPath();
        ctx.moveTo(r0X, r0Y);
        ctx.lineTo(l1X, l1Y);
        ctx.lineTo(f2X, f2Y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Faceta Inferior Sombreada (Grafite escuro / oclusão)
        ctx.fillStyle = '#0e0d16';
        ctx.beginPath();
        ctx.moveTo(r0X, r0Y);
        ctx.lineTo(s3X, s3Y);
        ctx.lineTo(f2X, f2Y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#2f3640';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Aresta biselada da crista central
        ctx.strokeStyle = '#f5f6fa';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(r0X, r0Y);
        ctx.lineTo(f2X, f2Y);
        ctx.stroke();

        // Pino articulador central
        ctx.fillStyle = '#0a0614';
        ctx.beginPath();
        ctx.arc(currX, currY, 2.0 - s * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = energyCol;
        ctx.beginPath();
        ctx.arc(currX, currY, 1.1 - s * 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // === CONTAS CHANFRADAS BISELADAS NAS ARTICULAÇÕES DISTAIS ===
        const beadR = Math.max(2.4, 4.4 - s * 0.6);

        // Aro externo translúcido com glow sutil
        ctx.strokeStyle = 'rgba(129, 236, 236, 0.35)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(currX, currY, beadR + 0.6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#0a0614';
        ctx.beginPath();
        ctx.arc(currX, currY, beadR, 0, Math.PI * 2);
        ctx.fill();

        // Borda reflexiva superior prateada
        ctx.strokeStyle = '#f5f6fa';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(currX, currY, beadR, Math.PI * 0.9, Math.PI * 2.1);
        ctx.stroke();

        // Centro da conta (pino prateado)
        ctx.fillStyle = 'rgba(168, 245, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(currX, currY, beadR * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Ponta com Acabamento Mais Fino em Estilete Afilado (Fase 3: Pontas Finas)
      if (s === limb.segs.length - 1) {
        const tipAng = accumAng + 0.08;
        const tipLen = 14 * effectiveGrowth;
        const finalX = nextX + Math.cos(tipAng) * tipLen;
        const finalY = nextY + Math.sin(tipAng) * tipLen;

        const tipTanX = Math.cos(tipAng);
        const tipTanY = Math.sin(tipAng);
        const tipNx = -tipTanY;
        const tipNy = tipTanX;
        const tipLightSign = tipNy < 0 ? 1 : -1;
        const tipLx = tipNx * tipLightSign;
        const tipLy = tipNy * tipLightSign;
        const baseHalfW = 1.4 * Math.max(0.35, limbExt);

        // Faceta iluminada do estilete
        ctx.fillStyle = '#f5f6fa';
        ctx.beginPath();
        ctx.moveTo(finalX, finalY);
        ctx.lineTo(nextX + tipLx * baseHalfW, nextY + tipLy * baseHalfW);
        ctx.lineTo(nextX, nextY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Faceta sombreada do estilete
        ctx.fillStyle = '#0f0e18';
        ctx.beginPath();
        ctx.moveTo(finalX, finalY);
        ctx.lineTo(nextX - tipLx * baseHalfW, nextY - tipLy * baseHalfW);
        ctx.lineTo(nextX, nextY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#2f3640';
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Fio central de espinha afiada
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(nextX, nextY);
        ctx.lineTo(finalX, finalY);
        ctx.stroke();

        // Ponto luminoso na micro-agulha terminal
        const idleB = e.idleBlend || 0;
        const tipCol = idleB > 0.4 ? '#81ecec' : (e.phase === 2 ? '#ff7675' : (e.phase === 3 ? '#ffffff' : '#a29bfe'));
        const tipGlow = idleB > 0.4 ? '#00cec9' : (e.phase === 2 ? '#e84393' : (e.phase === 3 ? '#00cec9' : '#8e44ad'));
        ctx.fillStyle = tipGlow;
        ctx.beginPath();
        ctx.arc(finalX, finalY, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = tipCol;
        ctx.beginPath();
        ctx.arc(finalX, finalY, 1.0, 0, Math.PI * 2);
        ctx.fill();
      }

      currX = nextX;
      currY = nextY;
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renderiza Fissuras Visuais Progressivas de Dano de Batalha (Battle Damage) no Domo Gótico.
 * Intensifica-se conforme o HP do Soberano diminui (<75%, <50%, <30%, <15%).
 * Inclui halo pulsante de sangramento cósmico alinhado à cor da fase ativa (Fase 1: Profundidade Cósmica).
 */
function drawDomeFractures(ctx, R, hpRatio, frameCount, phase = 1) {
  ctx.save();
  const bleedCol = phase === 3 ? '0, 206, 201' : (phase === 2 ? '232, 67, 147' : '162, 155, 254');
  const pulse = Math.sin(frameCount * 0.12) * 0.2 + 0.8;

  // 1. Halo de sangramento luminescente de energia sob as trincas
  ctx.save();
  ctx.strokeStyle = `rgba(${bleedCol}, ${0.35 * pulse})`;
  ctx.lineWidth = hpRatio < 0.20 ? 4.6 : 3.0;

  // Racha 1: Superior Esquerda
  ctx.beginPath();
  ctx.moveTo(0, -R * 0.2);
  ctx.lineTo(-R * 0.35, -R * 0.45);
  ctx.lineTo(-R * 0.42, -R * 0.65);
  if (hpRatio < 0.50) {
    ctx.lineTo(-R * 0.65, -R * 0.85);
    ctx.moveTo(-R * 0.35, -R * 0.45);
    ctx.lineTo(-R * 0.55, -R * 0.35);
  }
  ctx.stroke();

  // Racha 2: Inferior Direita (< 60% HP)
  if (hpRatio < 0.60) {
    ctx.beginPath();
    ctx.moveTo(R * 0.1, R * 0.1);
    ctx.lineTo(R * 0.38, R * 0.35);
    ctx.lineTo(R * 0.52, R * 0.55);
    if (hpRatio < 0.35) {
      ctx.lineTo(R * 0.72, R * 0.78);
      ctx.moveTo(R * 0.38, R * 0.35);
      ctx.lineTo(R * 0.60, R * 0.25);
    }
    ctx.stroke();
  }

  // Racha 3: Fissura de Cisalhamento Central Crítica (< 30% HP)
  if (hpRatio < 0.30) {
    ctx.lineWidth = 5.0;
    ctx.beginPath();
    ctx.moveTo(-R * 0.1, -R * 0.75);
    ctx.lineTo(R * 0.15, -R * 0.35);
    ctx.lineTo(-R * 0.08, R * 0.15);
    ctx.lineTo(R * 0.22, R * 0.65);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Traço nítido principal das fissuras em branco/marfim superaquecido
  ctx.strokeStyle = hpRatio < 0.20 ? '#ffffff' : (hpRatio < 0.40 ? '#fff6a9' : 'rgba(255, 255, 255, 0.85)');
  ctx.lineWidth = hpRatio < 0.20 ? 2.2 : 1.4;

  // Racha 1: Superior Esquerda
  ctx.beginPath();
  ctx.moveTo(0, -R * 0.2);
  ctx.lineTo(-R * 0.35, -R * 0.45);
  ctx.lineTo(-R * 0.42, -R * 0.65);
  if (hpRatio < 0.50) {
    ctx.lineTo(-R * 0.65, -R * 0.85);
    ctx.moveTo(-R * 0.35, -R * 0.45);
    ctx.lineTo(-R * 0.55, -R * 0.35);
  }
  ctx.stroke();

  // Racha 2: Inferior Direita (< 60% HP)
  if (hpRatio < 0.60) {
    ctx.beginPath();
    ctx.moveTo(R * 0.1, R * 0.1);
    ctx.lineTo(R * 0.38, R * 0.35);
    ctx.lineTo(R * 0.52, R * 0.55);
    if (hpRatio < 0.35) {
      ctx.lineTo(R * 0.72, R * 0.78);
      ctx.moveTo(R * 0.38, R * 0.35);
      ctx.lineTo(R * 0.60, R * 0.25);
    }
    ctx.stroke();
  }

  // Racha 3: Fissura de Cisalhamento Central Crítica (< 30% HP)
  if (hpRatio < 0.30) {
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-R * 0.1, -R * 0.75);
    ctx.lineTo(R * 0.15, -R * 0.35);
    ctx.lineTo(-R * 0.08, R * 0.15);
    ctx.lineTo(R * 0.22, R * 0.65);
    ctx.stroke();

    // Micro-faíscas estelares vazando da brecha
    const sparkCount = 3;
    for (let s = 0; s < sparkCount; s++) {
      const sAng = (frameCount * 0.25 + s * 2.1) % (Math.PI * 2);
      const sDist = R * 0.45 + Math.sin(frameCount * 0.3 + s) * (R * 0.35);
      ctx.fillStyle = s % 2 === 0 ? '#ffffff' : '#f1c40f';
      ctx.fillRect(Math.cos(sAng) * sDist - 1.5, Math.sin(sAng) * sDist - 1.5, 3, 3);
    }
  }

  ctx.restore();
}

/**
 * Renderiza a Esfera de Vácuo Central Envolta pelo Anel Translúcido Ciano com Arcos Góticos (Fiel à Referência).
 * Comporta transição dinâmica entre energia de combate e paleta serena da referência durante a inatividade.
 */
function drawSacredMandalaVoidSphere(ctx, e, R, frameCount, isHit, isStaggered, phase, idleBlend = 0) {
  ctx.save();

  const haloR = R * 1.38;

  // Interpolação de cores baseada no estado de inatividade (idleBlend)
  // Paleta de Combate por Fase:
  let combatHaloStart, combatHaloMid, combatHaloEnd, combatRimColor, combatRimGlow;
  let archColor;

  if (phase === 2) {
    // Fase 2 Combate: Fratura do Horizonte - Magenta / Rosa Elétrico
    combatHaloStart = 'rgba(232, 67, 147, 0.18)';
    combatHaloMid = 'rgba(253, 121, 168, 0.40)';
    combatHaloEnd = 'rgba(232, 67, 147, 0.82)';
    combatRimColor = '#fd79a8';
    combatRimGlow = '#e84393';
    archColor = 'rgba(255, 121, 198, 0.55)';
  } else if (phase === 3) {
    // Fase 3 Combate: Singularidade Primordial - Ciano Elétrico / Branco
    combatHaloStart = 'rgba(0, 206, 201, 0.20)';
    combatHaloMid = 'rgba(9, 132, 227, 0.45)';
    combatHaloEnd = 'rgba(0, 206, 201, 0.85)';
    combatRimColor = '#00cec9';
    combatRimGlow = '#00cec9';
    archColor = 'rgba(129, 236, 236, 0.65)';
  } else {
    // Fase 1 Combate: Vácuo Abissal - Roxo / Violeta Profundo
    combatHaloStart = 'rgba(142, 68, 173, 0.18)';
    combatHaloMid = 'rgba(108, 92, 231, 0.38)';
    combatHaloEnd = 'rgba(142, 68, 173, 0.82)';
    combatRimColor = '#a29bfe';
    combatRimGlow = '#8e44ad';
    archColor = 'rgba(162, 155, 254, 0.55)';
  }

  // Paleta da Imagem de Referência (Ativada no Estado Inativo - IDLE):
  // Cúpula Celeste Translúcida Azul-Gelo e Prata Crystalline
  const idleHaloStart = 'rgba(129, 236, 236, 0.12)';
  const idleHaloMid = 'rgba(168, 245, 255, 0.38)';
  const idleHaloEnd = 'rgba(225, 250, 255, 0.85)';
  const idleRimColor = '#ffffff';
  const idleRimGlow = '#81ecec';
  const idleArchColor = 'rgba(220, 250, 255, 0.70)';

  // Desenho do Halo de Combate (desvanece quando inativo)
  if (idleBlend < 1.0) {
    ctx.save();
    ctx.globalAlpha = 1.0 - idleBlend;
    const cGrad = ctx.createRadialGradient(0, 0, R * 0.85, 0, 0, haloR);
    cGrad.addColorStop(0, combatHaloStart);
    cGrad.addColorStop(0.65, combatHaloMid);
    cGrad.addColorStop(0.92, combatHaloEnd);
    cGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.fill();

    // Halo externo translúcido com brilho em camadas (Zero-cost glow)
    ctx.strokeStyle = combatRimGlow;
    ctx.lineWidth = 6.0;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isStaggered ? '#f1c40f' : combatRimColor;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.stroke();

    if (!isHit) {
      ctx.strokeStyle = archColor;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.18, 0, Math.PI * 2);
      ctx.stroke();

      const archCount = 16;
      for (let a = 0; a < archCount; a++) {
        const a1 = (a * Math.PI * 2) / archCount;
        const a2 = ((a + 1) * Math.PI * 2) / archCount;
        const midA = (a1 + a2) * 0.5;
        const p1X = Math.cos(a1) * (R * 1.34);
        const p1Y = Math.sin(a1) * (R * 1.34);
        const p2X = Math.cos(a2) * (R * 1.34);
        const p2Y = Math.sin(a2) * (R * 1.34);
        const cpX = Math.cos(midA) * (R * 0.98);
        const cpY = Math.sin(midA) * (R * 0.98);

        // Refração prismática sub-pixel sutil nos arcos superiores (Fase 1: Cristal Espesso)
        if (Math.sin(midA) < 0.22) {
          ctx.save();
          ctx.strokeStyle = 'rgba(129, 236, 236, 0.24)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p1X - 0.5, p1Y - 0.4);
          ctx.quadraticCurveTo(cpX - 0.5, cpY - 0.4, p2X - 0.5, p2Y - 0.4);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(224, 86, 253, 0.18)';
          ctx.beginPath();
          ctx.moveTo(p1X + 0.5, p1Y + 0.4);
          ctx.quadraticCurveTo(cpX + 0.5, cpY + 0.4, p2X + 0.5, p2Y + 0.4);
          ctx.stroke();
          ctx.restore();
        }

        ctx.beginPath();
        ctx.moveTo(p1X, p1Y);
        ctx.quadraticCurveTo(cpX, cpY, p2X, p2Y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Desenho do Halo Sagrado da Referência (manifesta-se plenamente no estado inativo)
  if (idleBlend > 0) {
    ctx.save();
    ctx.globalAlpha = idleBlend;
    const iGrad = ctx.createRadialGradient(0, 0, R * 0.85, 0, 0, haloR);
    iGrad.addColorStop(0, idleHaloStart);
    iGrad.addColorStop(0.65, idleHaloMid);
    iGrad.addColorStop(0.92, idleHaloEnd);
    iGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = iGrad;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.fill();

    // Halo externo translúcido com brilho em camadas (Zero-cost glow)
    ctx.strokeStyle = idleRimGlow;
    ctx.lineWidth = 6.0;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = idleRimColor;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.stroke();

    if (!isHit) {
      ctx.strokeStyle = idleArchColor;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.18, 0, Math.PI * 2);
      ctx.stroke();

      const archCount = 16;
      for (let a = 0; a < archCount; a++) {
        const a1 = (a * Math.PI * 2) / archCount;
        const a2 = ((a + 1) * Math.PI * 2) / archCount;
        const midA = (a1 + a2) * 0.5;
        const p1X = Math.cos(a1) * (R * 1.34);
        const p1Y = Math.sin(a1) * (R * 1.34);
        const p2X = Math.cos(a2) * (R * 1.34);
        const p2Y = Math.sin(a2) * (R * 1.34);
        const cpX = Math.cos(midA) * (R * 0.98);
        const cpY = Math.sin(midA) * (R * 0.98);

        // Refração prismática sub-pixel sutil nos arcos superiores (Fase 1: Cristal Espesso)
        if (Math.sin(midA) < 0.22) {
          ctx.save();
          ctx.strokeStyle = 'rgba(129, 236, 236, 0.24)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p1X - 0.5, p1Y - 0.4);
          ctx.quadraticCurveTo(cpX - 0.5, cpY - 0.4, p2X - 0.5, p2Y - 0.4);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(224, 86, 253, 0.18)';
          ctx.beginPath();
          ctx.moveTo(p1X + 0.5, p1Y + 0.4);
          ctx.quadraticCurveTo(cpX + 0.5, cpY + 0.4, p2X + 0.5, p2Y + 0.4);
          ctx.stroke();
          ctx.restore();
        }

        ctx.beginPath();
        ctx.moveTo(p1X, p1Y);
        ctx.quadraticCurveTo(cpX, cpY, p2X, p2Y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 3. ESFERA DE VÁCUO CENTRAL OBSIDIANA (O Núcleo Escuro com Profundidade 3D)
  const coreGrad = ctx.createRadialGradient(0, 0, R * 0.15, 0, 0, R * 0.96);
  if (idleBlend > 0.45) {
    // Dormência da Referência: Obsidiana pura cósmica profunda
    coreGrad.addColorStop(0, '#020106');
    coreGrad.addColorStop(0.65, '#060310');
    coreGrad.addColorStop(1, '#0e081c');
  } else if (phase === 2) {
    coreGrad.addColorStop(0, '#100008');
    coreGrad.addColorStop(0.65, '#220015');
    coreGrad.addColorStop(1, '#380024');
  } else if (phase === 3) {
    coreGrad.addColorStop(0, '#000808');
    coreGrad.addColorStop(0.65, '#001414');
    coreGrad.addColorStop(1, '#002525');
  } else {
    coreGrad.addColorStop(0, '#05020c');
    coreGrad.addColorStop(0.65, '#0b0617');
    coreGrad.addColorStop(1, '#150c26');
  }

  ctx.fillStyle = isHit ? '#ffffff' : coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.96, 0, Math.PI * 2);
  ctx.fill();

  if (!isHit) {
    // Micro-pontos estelares internos em deriva lenta e com parallax inverso (Fase 1: Profundidade Cósmica)
    const stars = e.obsidianStars || [
      { x: -0.42, y: -0.28, r: 1.1, speed: 0.018, phase: 0 },
      { x:  0.38, y: -0.35, r: 0.9, speed: 0.024, phase: 1.8 },
      { x: -0.25, y:  0.45, r: 1.2, speed: 0.015, phase: 3.4 },
      { x:  0.35, y:  0.32, r: 0.8, speed: 0.021, phase: 4.9 }
    ];
    const pOffsetX = -(e.smoothVx || 0) * 0.12;
    const pOffsetY = -(e.smoothVy || 0) * 0.12;
    const starRgb = idleBlend > 0.45 
      ? '168, 245, 255' 
      : (phase === 2 ? '253, 121, 168' : (phase === 3 ? '0, 206, 201' : '162, 155, 254'));

    for (let s = 0; s < stars.length; s++) {
      const st = stars[s];
      const driftAng = frameCount * st.speed + st.phase;
      const driftX = Math.cos(driftAng) * (R * 0.04);
      const driftY = Math.sin(driftAng) * (R * 0.04);
      const sx = st.x * R + driftX + pOffsetX;
      const sy = st.y * R + driftY + pOffsetY;

      // Brilho tênue e discreto (0.15 a 0.38) para não ofuscar o olho
      const starAlpha = 0.16 + Math.sin(frameCount * 0.035 + st.phase) * 0.12;

      ctx.fillStyle = `rgba(${starRgb}, ${starAlpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, st.r + 0.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha * 1.3})`;
      ctx.beginPath();
      ctx.arc(sx, sy, st.r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Reflexo especular curvilíneo superior suave (volume 3D de domo convexo vítreo)
    ctx.save();
    const specY = -R * 0.46;
    const specW = R * 0.56;
    const specH = R * 0.16;
    const specGrad = ctx.createLinearGradient(0, specY - specH, 0, specY + specH);
    specGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    specGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.13)');
    specGrad.addColorStop(0.7, 'rgba(200, 240, 255, 0.07)');
    specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = specGrad;
    ctx.beginPath();
    ctx.ellipse(0, specY, specW, specH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Arco sutil de especularidade no topo da calota vítrea
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(0, -R * 0.16, R * 0.74, -Math.PI * 0.76, -Math.PI * 0.24);
    ctx.stroke();
    ctx.restore();
  }

  // Borda atenuada de delimitação do núcleo escuro
  const borderCol = idleBlend > 0.45 
    ? 'rgba(168, 245, 255, 0.22)' 
    : (phase === 2 ? 'rgba(253, 121, 168, 0.22)' : (phase === 3 ? 'rgba(0, 206, 201, 0.22)' : 'rgba(162, 155, 254, 0.22)'));
  ctx.strokeStyle = borderCol;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.96, 0, Math.PI * 2);
  ctx.stroke();

  // Iluminação fina direcional (Rim Light assimétrico cobrindo a borda superior e direita)
  const rimCol = idleBlend > 0.45
    ? 'rgba(225, 250, 255, 0.85)'
    : (phase === 2 ? 'rgba(255, 180, 220, 0.85)' : (phase === 3 ? 'rgba(180, 255, 255, 0.85)' : 'rgba(220, 210, 255, 0.85)'));
  ctx.strokeStyle = rimCol;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.96, -Math.PI * 0.75, Math.PI * 0.06);
  ctx.stroke();

  // Ponto focal de brilho especular fino na aresta superior
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.96, -Math.PI * 0.58, -Math.PI * 0.32);
  ctx.stroke();

  // Trincas de Dano de Batalha (Battle Damage) Progressivas no Domo com Sangramento
  const hpRatio = Math.max(0, e.hp / (e.maxHp || 1));
  if (hpRatio < 0.75) {
    drawDomeFractures(ctx, R, hpRatio, frameCount, phase);
  }

  ctx.restore();
}

/**
 * Renderiza o Olho Observador Prateado Horizontal com Fenda Vertical (Fiel à Referência).
 * Fecha-se suavemente em repouso estático / inativo (IDLE).
 */
function drawColdObserverEye(ctx, e, R, frameCount, isStaggered, isWindup, isCasting, phase, idleBlend = 0) {
  ctx.save();

  const coreScale = isStaggered ? 0.85 : (1.0 + (e.corePulse || 0) * 0.08);
  const breath = Math.sin(frameCount * 0.08) * 0.8;
  const eyeW = 22 * coreScale + breath;
  const openRatio = (e.eyeAperture !== undefined) ? e.eyeAperture : Math.max(0, 1.0 - (idleBlend || 0));

  // Moldura Externa Metálica Esbranquiçada / Grafite
  ctx.strokeStyle = '#2f3640';
  ctx.lineWidth = 3.0;

  if (openRatio <= 0.08) {
    // === OLHO TOTALMENTE FECHADO EM DORMÊNCIA SAGRADA (MEDITAÇÃO CELESTE) ===
    // Fenda da Pálpebra Fechada (curvatura suave descendente em repouso)
    ctx.strokeStyle = '#18151f';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(-eyeW * 0.95, 0);
    ctx.quadraticCurveTo(0, 1.8, eyeW * 0.95, 0);
    ctx.stroke();

    // Pálpebra metálica prateada superior
    ctx.strokeStyle = '#718093';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-eyeW * 0.88, -0.6);
    ctx.quadraticCurveTo(0, 1.0, eyeW * 0.88, -0.6);
    ctx.stroke();

    // Fio de luz celestial ciano dormente ao longo da costura
    ctx.strokeStyle = 'rgba(168, 245, 255, 0.85)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-eyeW * 0.65, 0);
    ctx.quadraticCurveTo(0, 1.4, eyeW * 0.65, 0);
    ctx.stroke();
  } else {
    // === OLHO ABERTO OU EM TRANSIÇÃO SUAVE DE ABERTURA / FECHAMENTO ===
    const eyeH = Math.max(0.6, (11.5 * coreScale + breath * 0.4) * openRatio);

    ctx.beginPath();
    ctx.ellipse(0, 0, eyeW + 2.5, eyeH + 2.0, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#718093';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, eyeW + 1.2, eyeH + 1.0, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Interior do Olho: Íris Elíptica Cinza Metálico / Grafite Polido
    const irisGrad = ctx.createRadialGradient(0, -2, 1, 0, 0, eyeW);
    irisGrad.addColorStop(0, '#57606f');
    irisGrad.addColorStop(0.45, '#3d434d');
    irisGrad.addColorStop(0.85, '#22252c');
    irisGrad.addColorStop(1, '#111216');

    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, eyeW, eyeH, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2.1 Anel Límbico Luminoso & Divisões Radiais (Fase 2: Presença & Intenção)
    const limbalCol = idleBlend > 0.4
      ? 'rgba(168, 245, 255, 0.75)'
      : (phase === 2 ? 'rgba(253, 121, 168, 0.75)' : (phase === 3 ? 'rgba(0, 206, 201, 0.75)' : 'rgba(162, 155, 254, 0.75)'));
    const limbalGlow = idleBlend > 0.4
      ? 'rgba(129, 236, 236, 0.35)'
      : (phase === 2 ? 'rgba(232, 67, 147, 0.35)' : (phase === 3 ? 'rgba(0, 206, 201, 0.35)' : 'rgba(142, 68, 173, 0.35)'));

    // Halo externo do anel límbico
    ctx.strokeStyle = limbalGlow;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(0, 0, eyeW, eyeH, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Fio nítido do anel límbico
    ctx.strokeStyle = limbalCol;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.ellipse(0, 0, eyeW, eyeH, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Divisões radiais discretas da íris (estrias de textura alienígena)
    ctx.save();
    const striaCount = 12;
    ctx.strokeStyle = limbalCol;
    ctx.lineWidth = 0.65;
    ctx.globalAlpha *= 0.30;
    for (let st = 0; st < striaCount; st++) {
      const sang = (st * Math.PI * 2) / striaCount;
      const outerX = Math.cos(sang) * eyeW * 0.95;
      const outerY = Math.sin(sang) * eyeH * 0.95;
      const innerRatio = (st % 2 === 0) ? 0.38 : 0.55;
      const innerX = Math.cos(sang) * eyeW * innerRatio;
      const innerY = Math.sin(sang) * eyeH * innerRatio;
      ctx.beginPath();
      ctx.moveTo(outerX, outerY);
      ctx.lineTo(innerX, innerY);
      ctx.stroke();
    }
    ctx.restore();

    // 2.2 Deslocamento da Pupila acompanhando o Jogador com limites seguros
    const maxPx = eyeW * 0.28;
    const maxPy = eyeH * 0.28;
    const clampedPx = Math.max(-maxPx, Math.min(maxPx, e.pupilX || 0));
    const clampedPy = Math.max(-maxPy, Math.min(maxPy, e.pupilY || 0));

    // 3. Reflexo Especular Superior Branco (Crescent Glint da Referência)
    if (openRatio > 0.35) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(clampedPx * 0.25, -1 + clampedPy * 0.15, eyeW * 0.72, -Math.PI * 0.82, -Math.PI * 0.18);
      ctx.stroke();
    }

    // 4. Pupila em Fenda Vertical com Contração/Relaxamento Dinâmico (Fase 2)
    // WINDUP (pré-ataque): contração intensa em fenda estreita cortante.
    // CASTING: dilatação com pico de energia.
    // RECOVERY_STAGGER / IDLE: relaxamento amplo.
    let basePupilW;
    if (isWindup) {
      basePupilW = 0.85; // Contração afiada e ameaçadora pré-ataque
    } else if (isCasting) {
      basePupilW = 3.2; // Dilatação de disparo
    } else if (isStaggered) {
      basePupilW = 4.6; // Relaxamento completo desestabilizado
    } else if (idleBlend > 0.3) {
      basePupilW = 1.4; // Repouso sereno
    } else {
      basePupilW = 1.9; // Combate normal
    }

    const pupilW = Math.max(0.4, basePupilW * openRatio);
    const pupilH = eyeH * (isWindup ? 0.96 : 0.90);

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(clampedPx, clampedPy, pupilW, pupilH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Borda de foco da fenda
    ctx.strokeStyle = isWindup ? limbalCol : 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = isWindup ? 0.6 : 0.4;
    ctx.stroke();

    // Micro reflexo de luz pontual frio acompanhando o foco
    if (openRatio > 0.40) {
      const glintX = clampedPx + (clampedPx < 0 ? 1.0 : -1.5);
      const glintY = clampedPy - 2.0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(glintX, glintY, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Membrana Nictitante Cósmica (Piscar rápido e orgânico de predador)
    if (e.nictitatingProgress > 0 && openRatio > 0.35) {
      ctx.save();
      const nictAlpha = Math.sin(e.nictitatingProgress * Math.PI) * 0.70;
      ctx.fillStyle = `rgba(10, 8, 18, ${nictAlpha})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, eyeW, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();

      // Borda da membrana translúcida varrendo o globo
      const sweepX = (1 - e.nictitatingProgress * 2) * eyeW;
      ctx.strokeStyle = `rgba(168, 245, 255, ${nictAlpha * 0.85})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(sweepX, -eyeH * 0.85);
      ctx.lineTo(sweepX, eyeH * 0.85);
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Renderiza todos os efeitos visuais de ataques que estão na fase ativa (CASTING/STRIKE),
 * garantindo que golpes como Corte Dimensional, Chuva Astral, Implosão e Supernova sejam visíveis na tela.
 */
function drawActiveSovereignAttacks(ctx, e, frameCount) {
  if (!e.activeAttacks || e.activeAttacks.length === 0) return;

  ctx.save();

  for (let i = 0; i < e.activeAttacks.length; i++) {
    const atk = e.activeAttacks[i];
    const progress = Math.max(0, Math.min(1, 1 - (atk.timer / (atk.maxTimer || 1))));

    if (atk.type === 'DIMENSIONAL_SLASH') {
      // FEIXE DE LUZ CELESTIAL COM FRATURA DIMENSIONAL (Feixe único P1-P2 / Tríplice P3)
      const angles = atk.angles || [e.cleaveAngle || 0];
      const isTriple = angles.length > 1; // Diferenciação visual entre Feixe Único e Feixe Triplo
      const alpha = Math.max(0, 1 - progress);
      const len = atk.length || 1500;
      const mainW = atk.width || 108;
      const sideW = atk.sideWidth || (mainW * 0.65);

      ctx.save();

      // =========================================================================
      // 1. ARCOS DE RESSONÂNCIA DIMENSIONAL CRUZADA (Exclusivo do Feixe Triplo)
      // =========================================================================
      if (isTriple) {
        const centerAng = angles[0];
        const leftAng = angles[1];
        const rightAng = angles[2];

        // Arcos de plasma e pontes elétricas saltando entre o feixe central e os laterais
        const bridgeCount = 8;
        for (let b = 1; b <= bridgeCount; b++) {
          const bDist = (b / (bridgeCount + 1)) * len * Math.min(1, progress * 1.5);
          const cx = Math.cos(centerAng) * bDist;
          const cy = Math.sin(centerAng) * bDist;

          for (let sideAng of [leftAng, rightAng]) {
            if (sideAng === undefined) continue;
            const sx = Math.cos(sideAng) * bDist;
            const sy = Math.sin(sideAng) * bDist;
            const midJitterX = (Math.sin(b * 3.7 + frameCount * 0.5) * 22) * alpha;
            const midJitterY = (Math.cos(b * 3.1 + frameCount * 0.5) * 22) * alpha;

            // Ponte de plasma instável entre os feixes
            ctx.strokeStyle = (b % 2 === 0)
              ? `rgba(0, 206, 201, ${alpha * 0.85})`
              : `rgba(232, 67, 147, ${alpha * 0.75})`;
            ctx.lineWidth = 2.0 * alpha;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo((cx + sx) * 0.5 + midJitterX, (cy + sy) * 0.5 + midJitterY);
            ctx.lineTo(sx, sy);
            ctx.stroke();
          }
        }
      }

      // =========================================================================
      // 2. RENDERIZAÇÃO DOS FEIXES DE LUZ (Individual para cada ângulo de disparo)
      // =========================================================================
      for (let a = 0; a < angles.length; a++) {
        const ang = angles[a];
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);
        const tipX = cosA * len;
        const tipY = sinA * len;
        const isMain = a === 0;
        const beamW = isMain ? mainW : sideW;
        const perpX = -sinA;
        const perpY = cosA;

        // 2.1 Cicatriz abissal no solo (fenda preta sob o feixe com bordas queimadas)
        const scorchW = beamW * 0.65;
        ctx.strokeStyle = `rgba(5, 2, 12, ${alpha * 0.85})`;
        ctx.lineWidth = scorchW;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // 2.2 Halo volumétrico de ionização atmosférica (dispersão volumétrica)
        const haloPulse = Math.sin(frameCount * 0.35 + a * 2) * 6;
        const haloW = beamW * (1 - progress * 0.22) + haloPulse;
        ctx.strokeStyle = isTriple
          ? (isMain ? `rgba(0, 206, 201, ${alpha * 0.5})` : `rgba(0, 206, 201, ${alpha * 0.35})`)
          : `rgba(232, 67, 147, ${alpha * 0.48})`;
        ctx.lineWidth = haloW;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // 2.3 Bainha intermediária de plasma cósmico
        ctx.strokeStyle = isTriple
          ? (isMain ? `rgba(129, 236, 236, ${alpha * 0.8})` : `rgba(224, 86, 253, ${alpha * 0.65})`)
          : `rgba(224, 86, 253, ${alpha * 0.75})`;
        ctx.lineWidth = beamW * 0.48;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // 2.4 Anéis de compressão de choque (Mach Cones / Diamantes de Choque)
        const machCount = isMain ? (isTriple ? 6 : 8) : 4;
        for (let m = 1; m <= machCount; m++) {
          const mDist = (m / (machCount + 1)) * len;
          const mx = cosA * mDist;
          const my = sinA * mDist;
          const diamondW = (beamW * 0.38) * alpha;
          const diamondL = 16 * alpha;

          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
          ctx.beginPath();
          ctx.moveTo(mx - cosA * diamondL, my - sinA * diamondL);
          ctx.lineTo(mx + perpX * diamondW, my + perpY * diamondW);
          ctx.lineTo(mx + cosA * diamondL, my + sinA * diamondL);
          ctx.lineTo(mx - perpX * diamondW, my - perpY * diamondW);
          ctx.closePath();
          ctx.fill();
        }

        // 2.5 Hélice dupla de plasma vivo entrelaçado
        const segCount = isMain ? 28 : 20;
        const waveAmp = (isMain ? (isTriple ? 12 : 16) : 8) * alpha;
        // Fita 1
        ctx.beginPath();
        for (let s = 0; s <= segCount; s++) {
          const d = (s / segCount) * len;
          const wave = Math.sin(d * 0.03 - frameCount * 0.45 + a * 1.5) * waveAmp;
          const wx = cosA * d + perpX * wave;
          const wy = sinA * d + perpY * wave;
          if (s === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.strokeStyle = isTriple ? `rgba(0, 206, 201, ${alpha * 0.9})` : `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.lineWidth = isMain ? 2.6 : 1.8;
        ctx.stroke();

        // Fita 2 (oposta)
        ctx.beginPath();
        for (let s = 0; s <= segCount; s++) {
          const d = (s / segCount) * len;
          const wave = -Math.sin(d * 0.03 - frameCount * 0.45 + a * 1.5) * waveAmp;
          const wx = cosA * d + perpX * wave;
          const wy = sinA * d + perpY * wave;
          if (s === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.strokeStyle = isTriple ? `rgba(224, 86, 253, ${alpha * 0.75})` : `rgba(232, 67, 147, ${alpha * 0.75})`;
        ctx.lineWidth = isMain ? 2.0 : 1.5;
        ctx.stroke();

        // 2.6 Núcleo incandescente superaquecido branco
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = Math.max(4, beamW * 0.22);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // 2.7 Nódulos de energia correndo pelo feixe (Fluxo Contínuo)
        const nodeCount = isMain ? 5 : 3;
        for (let n = 0; n < nodeCount; n++) {
          const nodeProg = ((frameCount * 0.065 + n * 0.22 + a * 0.09) % 1.0);
          const nDist = nodeProg * len;
          const nx = cosA * nDist;
          const ny = sinA * nDist;
          const nLen = isMain ? 52 : 32;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = (isMain ? 10 : 6) * alpha;
          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(nx + cosA * nLen, ny + sinA * nLen);
          ctx.stroke();
        }

        // 2.8 Fissuras dimensionais e centelhas estelares de alta velocidade
        const sparkCount = isMain ? (isTriple ? 14 : 10) : 7;
        for (let s = 1; s <= sparkCount; s++) {
          const sDist = (s / (sparkCount + 1)) * len * Math.min(1, progress * 1.4);
          if (sDist <= len) {
            const sx = cosA * sDist;
            const sy = sinA * sDist;
            const perpDist = (s % 2 === 0 ? 1 : -1) * (24 * (1 - progress));
            const sparkLen = 22 + (s * 4) * (1 - progress);

            // Centelha estelar esticada em alta velocidade
            ctx.strokeStyle = s % 2 === 0
              ? (isTriple ? `rgba(0, 206, 201, ${alpha * 0.95})` : `rgba(255, 255, 255, ${alpha * 0.95})`)
              : `rgba(232, 67, 147, ${alpha * 0.9})`;
            ctx.lineWidth = 2.4 * alpha;
            ctx.beginPath();
            ctx.moveTo(sx + perpX * perpDist, sy + perpY * perpDist);
            ctx.lineTo(sx + perpX * perpDist + cosA * sparkLen, sy + perpY * perpDist + sinA * sparkLen);
            ctx.stroke();

            // Micro-fissura dimensional perpendicular rasgando o tecido da realidade
            if (s % 2 === 0) {
              ctx.strokeStyle = `rgba(224, 86, 253, ${alpha * 0.8})`;
              ctx.lineWidth = 1.6;
              const fissLen = perpDist * 1.8;
              const fissJitter = Math.sin(s * 2.7 + frameCount * 0.2) * 8;
              ctx.beginPath();
              ctx.moveTo(sx, sy);
              ctx.lineTo(sx + perpX * fissLen + cosA * fissJitter, sy + perpY * fissLen + sinA * fissJitter);
              ctx.stroke();
            }
          }
        }
      }

      // =========================================================================
      // 3. EPICENTRO DE DISPARO NO CORPO DO SOBERANO (0, 0)
      // =========================================================================
      const flareR = Math.max(0, (isTriple ? 74 : 58) * (1 - progress * 0.85));
      const flareGrad = ctx.createRadialGradient(0, 0, 3, 0, 0, Math.max(6, flareR));
      flareGrad.addColorStop(0, '#ffffff');
      flareGrad.addColorStop(0.25, isTriple ? 'rgba(0, 206, 201, 0.95)' : 'rgba(232, 67, 147, 0.95)');
      flareGrad.addColorStop(0.55, isTriple ? 'rgba(129, 236, 236, 0.75)' : 'rgba(224, 86, 253, 0.75)');
      flareGrad.addColorStop(0.85, 'rgba(142, 68, 173, 0.4)');
      flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.arc(0, 0, flareR, 0, Math.PI * 2);
      ctx.fill();

      // Anéis de choque de recuo na saída do disparo
      if (progress < 0.45) {
        const recoilR = (progress / 0.45) * (isTriple ? 98 : 75);
        const recoilAlpha = (1 - progress / 0.45);
        ctx.strokeStyle = `rgba(255, 255, 255, ${recoilAlpha * 0.8})`;
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.arc(0, 0, recoilR, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    } else if (atk.type === 'VOID_IMPLOSION_CORE') {
      // Coordenadas relativas ao centro do chefe
      const relX = atk.x - e.x;
      const relY = atk.y - e.y;
      const alpha = Math.max(0, 1 - progress);
      const R = atk.radius || 175;

      ctx.save();

      // 1. Flash de Vácuo Negativo e Campo de Gravidade Residual
      const burstR = R * Math.min(1, progress * 1.35);
      const burstGrad = ctx.createRadialGradient(relX, relY, 0, relX, relY, Math.max(1, burstR));
      burstGrad.addColorStop(0, `rgba(5, 2, 12, ${alpha * 0.95})`);
      burstGrad.addColorStop(0.4, `rgba(142, 68, 173, ${alpha * 0.75})`);
      burstGrad.addColorStop(0.85, `rgba(0, 206, 201, ${alpha * 0.45})`);
      burstGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = burstGrad;
      ctx.beginPath();
      ctx.arc(relX, relY, burstR, 0, Math.PI * 2);
      ctx.fill();

      // 2. Anel de Choque Implosivo com Aberração Cromática
      const ringR = R * Math.min(1, progress * 1.12);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
      ctx.lineWidth = 4.0 * alpha;
      ctx.beginPath();
      ctx.arc(relX, relY, ringR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(224, 86, 253, ${alpha * 0.85})`;
      ctx.lineWidth = 2.5 * alpha;
      ctx.beginPath();
      ctx.arc(relX, relY, Math.max(1, ringR - 5), 0, Math.PI * 2);
      ctx.stroke();

      // 3. Fissuras Elétricas de Matéria Escura (12 Relâmpagos Abissais no solo)
      const rayCount = 12;
      ctx.strokeStyle = `rgba(0, 206, 201, ${alpha * 0.9})`;
      ctx.lineWidth = 1.8 * alpha;
      for (let r = 0; r < rayCount; r++) {
        const ra = (r * Math.PI * 2) / rayCount + Math.sin(r * 3.1) * 0.15;
        const reach = R * (0.65 + 0.45 * Math.sin(r * 4.7 + frameCount * 0.1));
        const mx = relX + Math.cos(ra) * (reach * 0.5) + Math.sin(r * 2.3) * 10;
        const my = relY + Math.sin(ra) * (reach * 0.5) + Math.cos(r * 2.9) * 10;
        const ex = relX + Math.cos(ra) * reach;
        const ey = relY + Math.sin(ra) * reach;

        ctx.beginPath();
        ctx.moveTo(relX, relY);
        ctx.lineTo(mx, my);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }

      // 4. Epicentro Superdenso Residual
      const centerR = Math.max(2, 22 * (1 - progress));
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(relX, relY, centerR, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else if (atk.type === 'SUPERNOVA_FLASH') {
      // Clarão cósmico expansivo centrado no chefe (0, 0)
      const alpha = Math.max(0, 1 - progress);
      const flashR = (atk.maxR || 420) * progress;

      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(0, 0, flashR * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(232, 67, 147, ${alpha * 0.75})`;
      ctx.lineWidth = 6 * (1 - progress);
      ctx.beginPath();
      ctx.arc(0, 0, flashR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (atk.type === 'FALLING_ASTRAL_METEOR') {
      // Coordenadas relativas ao chefe
      const relStartX = atk.startX - e.x;
      const relStartY = atk.startY - e.y;
      const relTargetX = atk.targetX - e.x;
      const relTargetY = atk.targetY - e.y;
      const curX = relStartX + (relTargetX - relStartX) * progress;
      const curY = relStartY + (relTargetY - relStartY) * progress;

      ctx.save();
      const trailGrad = ctx.createLinearGradient(relStartX, relStartY, curX, curY);
      trailGrad.addColorStop(0, 'rgba(232, 67, 147, 0)');
      trailGrad.addColorStop(0.7, 'rgba(0, 206, 201, 0.6)');
      trailGrad.addColorStop(1, '#ffffff');

      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(curX - (relTargetX - relStartX) * 0.35, curY - (relTargetY - relStartY) * 0.35);
      ctx.lineTo(curX, curY);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(curX, curY, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

function lerpColorHex(a, b, t) {
  const parse = (c) => {
    const num = parseInt(c.slice(1), 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

/**
 * Renderiza as linhas de mira telegrafadas para os Feixes do Limiar durante o WINDUP.
 */
function drawThresholdBeamTelegraphs(ctx, e, frameCount) {
  if (e.actionState !== SOVEREIGN_STATES.WINDUP || e.currentSkill !== 'THRESHOLD_BEAMS') return;

  const count = e.phase === 3 ? 5 : (e.phase === 2 ? 4 : 3);
  const baseAngle = e.aimAngle || 0;
  const spread = count >= 5 ? 0.44 : (count === 4 ? 0.36 : 0.28);
  const maxTimer = e.windupMax || 44;
  const progress = Math.max(0, Math.min(1, 1 - (e.windupTimer / maxTimer)));
  const rayLen = e.arenaRadius || 620;
  const color = e.phase === 3 ? '#00cec9' : (e.phase === 2 ? '#e84393' : '#8e44ad');
  const glowColor = e.phase === 3 ? '#81ecec' : (e.phase === 2 ? '#ff7675' : '#a29bfe');

  ctx.save();
  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? 0 : (i - (count - 1) / 2) * (spread * 2 / (count - 1));
    const ang = baseAngle + offset;
    const cosA = Math.cos(ang);
    const sinA = Math.sin(ang);

    // Linha de mira telegrafada com opacidade crescente e pontilhado
    const pulse = Math.sin(frameCount * 0.4 + i) * 0.2 + 0.8;
    const alpha = (0.25 + progress * 0.65) * pulse;

    ctx.save();
    ctx.strokeStyle = `rgba(${e.phase === 3 ? '0, 206, 201' : (e.phase === 2 ? '232, 67, 147' : '142, 68, 173')}, ${alpha * 0.4})`;
    ctx.lineWidth = 10 * progress;
    ctx.beginPath();
    ctx.moveTo(cosA * (e.radius || 40), sinA * (e.radius || 40));
    ctx.lineTo(cosA * rayLen, sinA * rayLen);
    ctx.stroke();

    // Linha de centro brilhante
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2 + progress * 1.5;
    ctx.setLineDash([12, 8]);
    ctx.lineDashOffset = -frameCount * 2.5;
    ctx.beginPath();
    ctx.moveTo(cosA * (e.radius || 40), sinA * (e.radius || 40));
    ctx.lineTo(cosA * rayLen, sinA * rayLen);
    ctx.stroke();
    ctx.restore();

    // Ponto focal/mira na ponta do feixe
    const tipX = cosA * (e.radius + 30 + progress * 80);
    const tipY = sinA * (e.radius + 30 + progress * 80);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tipX, tipY, 2.5 + progress * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Renderiza os Feixes do Limiar em deslocamento, com rastro de plasma e núcleo superaquecido.
 */
function drawThresholdBeams(ctx, boss, frameCount) {
  if (!boss.thresholdBeams || boss.thresholdBeams.length === 0) return;

  ctx.save();
  // Translada para coordenadas globais absolutas de mundo
  ctx.translate(-boss.x, -boss.y);

  for (let i = 0; i < boss.thresholdBeams.length; i++) {
    const b = boss.thresholdBeams[i];
    const spd = b.speed || Math.hypot(b.vx, b.vy) || 3.7;
    const ang = Math.atan2(b.vy, b.vx);
    const r = b.radius || 11;
    const trailLen = b.trail ? b.trail.length : 0;

    // 1. Rastro Espectral Contínuo (Ribbon de Plasma Fading)
    if (trailLen > 1) {
      ctx.save();
      for (let t = 1; t < trailLen; t++) {
        const p1 = b.trail[t - 1];
        const p2 = b.trail[t];
        const segAlpha = (t / trailLen) * 0.65;
        const segWidth = (t / trailLen) * (r * 1.6);
        ctx.strokeStyle = b.glowColor || '#00cec9';
        ctx.lineWidth = segWidth;
        ctx.globalAlpha = segAlpha;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Núcleo e Cabeçote do Feixe
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(ang);

    // Halo volumétrico externo
    const pulse = Math.sin(frameCount * 0.35 + i * 2) * 2;
    const haloR = r * 2.0 + pulse;
    const haloGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, haloR);
    haloGrad.addColorStop(0, '#ffffff');
    haloGrad.addColorStop(0.35, b.glowColor || '#00cec9');
    haloGrad.addColorStop(0.75, b.color || '#8e44ad');
    haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.fill();

    // Corpo alongado com comprimento proporcional à velocidade (v * 4.5)
    const beamLen = Math.max(r * 2.4, spd * 4.5);
    const bodyGrad = ctx.createLinearGradient(-beamLen, 0, r * 1.2, 0);
    bodyGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    bodyGrad.addColorStop(0.35, b.color || '#8e44ad');
    bodyGrad.addColorStop(0.85, b.glowColor || '#00cec9');
    bodyGrad.addColorStop(1, '#ffffff');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(r * 1.2, 0);
    ctx.lineTo(-beamLen, -r * 0.7);
    ctx.lineTo(-beamLen, r * 0.7);
    ctx.closePath();
    ctx.fill();

    // Núcleo branco superaquecido
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.75, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Faíscas orbitais com base no número de ricochetes
    const sparkCount = Math.min(b.bounces + 1, 5);
    for (let s = 0; s < sparkCount; s++) {
      const sAng = frameCount * 0.22 + (s * Math.PI * 2) / sparkCount;
      const sx = Math.cos(sAng) * (r * 1.3);
      const sy = Math.sin(sAng) * (r * 0.8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx - 1.2, sy - 1.2, 2.4, 2.4);
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renderiza o tabuleiro rúnico da Colheita Inevitável:
 * Mostra grade geométrica sutil, runas estelares pulsantes em aviso,
 * colunas verticais de vácuo cósmico na erupção e miasma residual pós-detonação.
 */
function drawInexorableHarvest(ctx, boss, frameCount) {
  const H = boss.harvestState;
  if (!H || !H.tiles || H.tiles.length === 0) return;

  ctx.save();
  // Translada de volta para coordenadas globais absolutas de mundo
  ctx.translate(-boss.x, -boss.y);

  const mainCol = H.color || '#00cec9';
  const rgbCol = mainCol === '#00cec9' ? '0, 206, 201' : (mainCol === '#e84393' ? '232, 67, 147' : '142, 68, 173');

  for (let i = 0; i < H.tiles.length; i++) {
    const t = H.tiles[i];
    const s = t.size;

    if (t.state === 'IDLE') {
      // Grade geométrica sagrada sutil de fundo
      ctx.strokeStyle = `rgba(${rgbCol}, 0.08)`;
      ctx.lineWidth = 1.0;
      ctx.strokeRect(t.x, t.y, s, s);
    } else if (t.state === 'WARNING') {
      const p = Math.max(0, Math.min(1, 1 - (t.stateTimer / (t.maxTimer || 1))));
      const pulse = Math.sin(frameCount * 0.3 + i) * 0.2 + 0.8;

      // 1. Fundo do tile pulsante
      ctx.fillStyle = `rgba(${rgbCol}, ${(0.10 + p * 0.28) * pulse})`;
      ctx.fillRect(t.x, t.y, s, s);

      // 2. Contorno rúnico neon
      ctx.strokeStyle = `rgba(${rgbCol}, ${(0.5 + p * 0.5) * pulse})`;
      ctx.lineWidth = 2.0 + p * 1.5;
      ctx.strokeRect(t.x + 1, t.y + 1, s - 2, s - 2);

      // 3. Cantoneiras ornamentais
      const cornerL = s * 0.22;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Superior esquerdo
      ctx.moveTo(t.x, t.y + cornerL); ctx.lineTo(t.x, t.y); ctx.lineTo(t.x + cornerL, t.y);
      // Superior direito
      ctx.moveTo(t.x + s - cornerL, t.y); ctx.lineTo(t.x + s, t.y); ctx.lineTo(t.x + s, t.y + cornerL);
      // Inferior esquerdo
      ctx.moveTo(t.x, t.y + s - cornerL); ctx.lineTo(t.x, t.y + s); ctx.lineTo(t.x + cornerL, t.y + s);
      // Inferior direito
      ctx.moveTo(t.x + s - cornerL, t.y + s); ctx.lineTo(t.x + s, t.y + s); ctx.lineTo(t.x + s, t.y + s - cornerL);
      ctx.stroke();

      // 4. Selo rúnico central rotativo
      ctx.save();
      ctx.translate(t.cx, t.cy);
      const rot = frameCount * 0.04 + p * 2.2;
      ctx.rotate(rot);

      const sealR = s * 0.32;
      ctx.strokeStyle = mainCol;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, sealR, 0, Math.PI * 2);
      ctx.stroke();

      // Polígono rúnico inscrito
      const polyPts = 4;
      ctx.beginPath();
      for (let pt = 0; pt < polyPts; pt++) {
        const ptAng = (pt * Math.PI * 2) / polyPts;
        const px = Math.cos(ptAng) * (sealR * 0.85);
        const py = Math.sin(ptAng) * (sealR * 0.85);
        if (pt === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // Anel de contração de aviso (contrai até zero no momento da explosão)
      const shrinkR = Math.max(2, sealR * (1 - p));
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, shrinkR, 0, Math.PI * 2);
      ctx.stroke();

      // Faísca central
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5 + p * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else if (t.state === 'ACTIVE') {
      const actP = Math.max(0, Math.min(1, 1 - (t.stateTimer / (t.maxTimer || 1))));
      const alpha = Math.max(0, 1 - actP * 0.8);

      // 1. Flash branco incandescente cobrindo o bloco
      ctx.fillStyle = `rgba(255, 255, 255, ${0.75 * alpha})`;
      ctx.fillRect(t.x, t.y, s, s);

      // 2. Coluna de energia cósmica / pilar de vácuo ascendente
      const gradH = ctx.createLinearGradient(0, t.y + s, 0, t.y - s * 2.5);
      gradH.addColorStop(0, `rgba(${rgbCol}, ${0.85 * alpha})`);
      gradH.addColorStop(0.4, `rgba(${rgbCol}, ${0.45 * alpha})`);
      gradH.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradH;
      ctx.fillRect(t.x + s * 0.1, t.y - s * 2.5, s * 0.8, s * 3.5);

      // 3. Fissuras em cruz de plasma brilhante
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.0 * alpha;
      ctx.beginPath();
      ctx.moveTo(t.cx, t.y); ctx.lineTo(t.cx, t.y + s);
      ctx.moveTo(t.x, t.cy); ctx.lineTo(t.x + s, t.cy);
      ctx.stroke();

      // 4. Borda superaquecida de choque
      ctx.strokeStyle = mainCol;
      ctx.lineWidth = 3.5 * alpha;
      ctx.strokeRect(t.x, t.y, s, s);
    } else if (t.state === 'MIASMA') {
      const mP = Math.max(0, Math.min(1, t.stateTimer / (t.maxTimer || 1)));
      const alpha = mP * 0.28;

      // Fumaça cósmica rasteira translúcida
      ctx.fillStyle = `rgba(${rgbCol}, ${alpha})`;
      ctx.fillRect(t.x + 2, t.y + 2, s - 4, s - 4);

      // Vórtice suave de névoa no solo
      ctx.save();
      ctx.translate(t.cx, t.cy);
      const smokeRot = frameCount * 0.02 + i;
      ctx.rotate(smokeRot);
      ctx.strokeStyle = `rgba(${rgbCol}, ${alpha * 1.5})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.3, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore();
}


/** Desenha a aparência completa usada tanto em combate quanto no Turbilhão com camadas de profundidade 3D (Fase 4). */
function drawSovereignBody(ctx, e, frameCount, edgeCol, isAfterimage = false) {
  const R = e.radius;
  const isStaggered = e.actionState === SOVEREIGN_STATES.RECOVERY_STAGGER;
  const isWindup = e.actionState === SOVEREIGN_STATES.WINDUP;
  const isCasting = e.actionState === SOVEREIGN_STATES.CASTING;
  const idleBlend = e.idleBlend || 0;

  if (e.phase === 3 && !isAfterimage) {
    drawSingularityPlasmaWings(ctx, e, R, frameCount, edgeCol, isStaggered, idleBlend);
  }
  // 1. Membros Dorsais (Camada de Fundo - Profundidade 3D)
  if (!isAfterimage) {
    drawCelestialLimbs(ctx, e, R, frameCount, isStaggered, isWindup, isCasting, 1, 'DORSAL');
  }
  // 2. Agulhas Cristalinas com Suspensão Magnética e Engastes
  drawDownwardCrystallineSpikes(ctx, e, R, frameCount);
  // 3. Domo Celeste e Esfera de Obsidiana
  drawSacredMandalaVoidSphere(ctx, e, R, frameCount, e.hitFlash > 0, isStaggered, e.phase, idleBlend);
  // 4. Membros Ventrais (Camada da Frente - Sobreposição e Presença)
  if (!isAfterimage) {
    drawCelestialLimbs(ctx, e, R, frameCount, isStaggered, isWindup, isCasting, 1, 'VENTRAL');
  }
  // 5. Olho Observador
  drawColdObserverEye(ctx, e, R, frameCount, isStaggered, isWindup, isCasting, e.phase, idleBlend);
}

/** Duas cópias tênues da própria skin acompanham a rotação e a trajetória. */
function drawCycloneAfterimages(ctx, e, frameCount, edgeCol) {
  const images = e.cycloneAfterimages;
  if (!images?.length) return;

  // Limita o custo e mantém a silhueta principal legível sem sobrecarregar o canvas com membros duplicados.
  for (let i = Math.max(0, images.length - 6); i < images.length; i += 3) {
    const img = images[i];
    if (!(img.alpha > 0)) continue;
    ctx.save();
    ctx.translate(img.x - e.x, img.y - e.y);
    ctx.rotate(img.spin || 0);
    ctx.globalAlpha *= img.alpha * 0.25;
    drawSovereignBody(ctx, e, frameCount, edgeCol, true);
    ctx.restore();
  }
}

/**
 * Renderizador padronizado de Telegrafia de Área de Efeito (AoE Decal) de alta precisão
 * inspirado em padrões Soulslike/Roguelike (Hades, FFXIV).
 * Oferece leitura instantânea para combatentes corpo a corpo:
 * 1. Borda externa delimitadora estrita com marcações cardinais e runas.
 * 2. Preenchimento volumétrico progressivo (0% a 100%) indicando o segundo exato do impacto.
 * 3. Crista frontal luminosa em alta intensidade.
 * 4. Alerta crítico estroboscópico de evacuação imediata (ratio >= 0.78).
 */
function drawSoulslikeAoETelegraph(ctx, cx, cy, maxRadius, ratio, colorRgb, frameCount, options = {}) {
  const r = Math.max(0, Math.min(1, ratio));
  const currentR = maxRadius * r;
  const isImminent = r >= 0.78;
  const pulse = Math.sin((frameCount || 0) * (isImminent ? 0.45 : 0.18));

  ctx.save();
  ctx.translate(cx, cy);

  // 1. Limite Externo Máximo (Avisador de Fronteira Segura)
  ctx.strokeStyle = `rgba(${colorRgb}, ${0.55 + pulse * 0.25})`;
  ctx.lineWidth = isImminent ? 2.8 : 2.0;
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = -(frameCount || 0) * 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, maxRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. Ticks e Notches Geométricos no Perímetro (Marcadores de Distância de Evasão)
  const tickCount = options.tickCount || 16;
  ctx.strokeStyle = `rgba(${colorRgb}, ${0.7 + pulse * 0.2})`;
  ctx.lineWidth = 1.6;
  for (let i = 0; i < tickCount; i++) {
    const ang = (i * Math.PI * 2) / tickCount;
    const isCardinal = (i % (tickCount / 4) === 0);
    const tickLen = isCardinal ? 10 : 5;
    const x1 = Math.cos(ang) * (maxRadius - tickLen);
    const y1 = Math.sin(ang) * (maxRadius - tickLen);
    const x2 = Math.cos(ang) * (maxRadius + 2);
    const y2 = Math.sin(ang) * (maxRadius + 2);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // 3. Disco de Preenchimento Volumétrico Translúcido (Área Perigosa em Expansão)
  const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, maxRadius);
  const coreAlpha = isImminent ? 0.42 : 0.26;
  const edgeAlpha = isImminent ? 0.28 : 0.16;
  grad.addColorStop(0, `rgba(${colorRgb}, ${coreAlpha + pulse * 0.08})`);
  grad.addColorStop(0.75, `rgba(${colorRgb}, ${edgeAlpha})`);
  grad.addColorStop(1, `rgba(${colorRgb}, 0.04)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, currentR, 0, Math.PI * 2);
  ctx.fill();

  // 4. Crista Frontal Luminosa (Marcação da Onda de Choque que está crescendo)
  ctx.strokeStyle = isImminent ? '#ffffff' : `rgba(${colorRgb}, 0.95)`;
  ctx.lineWidth = isImminent ? 3.0 : 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, currentR, 0, Math.PI * 2);
  ctx.stroke();

  // 5. Alerta Crítico Estroboscópico de Evacuação Imediata (ratio >= 0.78)
  if (isImminent) {
    // Flash estroboscópico suave na área total
    const strobeAlpha = (Math.floor((frameCount || 0) / 4) % 2 === 0) ? 0.32 : 0.06;
    ctx.fillStyle = `rgba(255, 255, 255, ${strobeAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius, 0, Math.PI * 2);
    ctx.fill();

    // Ondas secundárias concêntricas indicando detonação
    const rippleR = maxRadius * (0.75 + (((frameCount || 0) * 0.06) % 0.25));
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, rippleR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 6. Rótulo tático opcional com brilho
  if (options.label && r > 0.15) {
    ctx.save();
    ctx.font = 'bold 9px "Cinzel", "Times New Roman", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isImminent ? '#ffffff' : `rgba(${colorRgb}, 0.9)`;
    ctx.shadowColor = `rgba(${colorRgb}, 0.9)`;
    ctx.shadowBlur = 6;
    ctx.fillText(options.label, 0, -maxRadius - 12);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renderiza a telegrafia de rotação e mira do Turbilhão durante o WINDUP.
 */
function drawCycloneTelegraph(ctx, e, frameCount) {
  if (e.actionState !== SOVEREIGN_STATES.WINDUP || e.currentSkill !== 'ABYSSAL_CYCLONE') return;

  const maxT = e.windupMax || 38;
  const p = Math.max(0, Math.min(1, 1 - (e.windupTimer / maxT)));
  const aimAng = e.cycloneAngle || 0;
  const len = 340 * p;
  const primaryCol = e.phase === 3 ? '#00cec9' : (e.phase === 2 ? '#e84393' : '#8e44ad');
  const rgbCol = primaryCol === '#00cec9' ? '0, 206, 201' : (primaryCol === '#e84393' ? '232, 67, 147' : '142, 68, 173');

  ctx.save();
  ctx.rotate(aimAng);

  // Faixa de trajetória de avanço
  const halfW = (SOVEREIGN_CONFIG.CYCLONE_RADIUS || 48);
  ctx.fillStyle = 'rgba(' + rgbCol + ', ' + (0.12 + p * 0.22) + ')';
  ctx.fillRect(0, -halfW, len, halfW * 2);

  // Linhas guia de borda com traço pontilhado correndo
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([10, 8]);
  ctx.lineDashOffset = -frameCount * 3;
  ctx.beginPath();
  ctx.moveTo(0, -halfW); ctx.lineTo(len, -halfW);
  ctx.moveTo(0, halfW); ctx.lineTo(len, halfW);
  ctx.stroke();

  // Ponta da seta de choque
  ctx.fillStyle = primaryCol;
  ctx.beginPath();
  ctx.moveTo(len + 25, 0);
  ctx.lineTo(len, -halfW * 1.2);
  ctx.lineTo(len, halfW * 1.2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Renderiza a telegrafia rúnica e os 4 anéis prévios da Espiral dos Quatro Horizontes durante o WINDUP.
 */
function drawSpiralStreamTelegraph(ctx, boss, frameCount) {
  if (boss.actionState !== SOVEREIGN_STATES.WINDUP || boss.currentSkill !== 'FOUR_COIL_SPIRAL') return;

  const maxT = boss.windupMax || 44;
  const p = Math.max(0, Math.min(1, 1 - (boss.windupTimer / maxT)));
  const primaryCol = boss.phase === 3 ? '#00cec9' : (boss.phase === 2 ? '#e84393' : '#8e44ad');
  const rgbCol = primaryCol === '#00cec9' ? '0, 206, 201' : (primaryCol === '#e84393' ? '232, 67, 147' : '142, 68, 173');
  const ar = boss.arenaRadius || 620;
  const maxR = Math.max(50, ar - 18);

  ctx.save();
  const acx = boss.arenaCenterX !== undefined ? boss.arenaCenterX : boss.x;
  const acy = boss.arenaCenterY !== undefined ? boss.arenaCenterY : boss.y;
  ctx.translate(acx - boss.x, acy - boss.y);

  // 1. Redemoinho central concentrando energia gravitacional
  const centerPulse = 20 + Math.sin(frameCount * 0.25) * 6;
  const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, centerPulse * 2.2);
  centerGrad.addColorStop(0, 'rgba(255, 255, 255, ' + (0.5 * p) + ')');
  centerGrad.addColorStop(0.4, 'rgba(' + rgbCol + ', ' + (0.35 * p) + ')');
  centerGrad.addColorStop(1, 'rgba(' + rgbCol + ', 0)');
  ctx.fillStyle = centerGrad;
  ctx.beginPath();
  ctx.arc(0, 0, centerPulse * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // 2. Traçado holográfico das 4 voltas da espiral se projetando do centro à borda
  const totalCoils = 4;
  const totalAngle = totalCoils * Math.PI * 2;
  const baseAngle = boss.spiralBaseAngle || 0;
  const drawAngleMax = totalAngle * p;

  ctx.strokeStyle = 'rgba(' + rgbCol + ', ' + (0.35 + p * 0.45) + ')';
  ctx.lineWidth = 2.4;
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = -frameCount * 2.5;

  ctx.beginPath();
  const steps = 140;
  for (let s = 0; s <= steps; s++) {
    const frac = s / steps;
    const ang = baseAngle + frac * drawAngleMax;
    const r = frac * maxR * p;
    const sx = Math.cos(ang) * r;
    const sy = Math.sin(ang) * r;
    if (s === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();

  // 3. Glifos orbitais nos 4 horizontes
  for (let c = 1; c <= totalCoils; c++) {
    const coilR = (c / totalCoils) * maxR * p;
    ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.18 + p * 0.22) + ')';
    ctx.lineWidth = 1.0;
    ctx.setLineDash([4, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, coilR, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/** Renderiza a espiral com os mesmos projéteis do Disparo Relativístico. */
function drawSpiralProjectiles(ctx, boss) {
  if (!boss.spiralBlades?.length) return;

  ctx.save();
  ctx.translate(-boss.x, -boss.y);
  for (const projectile of boss.spiralBlades) {
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    drawAbyssalBolt(ctx, Math.atan2(projectile.vy || 0, projectile.vx || 0),
      projectile.radius || SOVEREIGN_CONFIG.SPIRAL_BLADE_RADIUS);
    ctx.restore();
  }
  ctx.restore();
}

export function drawAbyssSovereign(ctx, e, frameCount) {
  // Neutraliza o espelhamento ctx.scale(e.facing, 1) vindo do enemiesRenderer.js
  // garantindo renderização matematicamente perfeita em coordenadas de mundo e ângulos reais
  ctx.scale(e.facing || 1, 1);
  drawArenaPattern(ctx, e);
  drawInexorableHarvest(ctx, e, frameCount);
  drawThresholdBeams(ctx, e, frameCount);
  drawThresholdBeamTelegraphs(ctx, e, frameCount);
  drawCycloneTelegraph(ctx, e, frameCount);
  drawSpiralProjectiles(ctx, e);
  drawSpiralStreamTelegraph(ctx, e, frameCount);

  if (e.actionState === SOVEREIGN_STATES.SPAWN_INTRO) {
    drawMajesticSpawnIntro(ctx, e, frameCount);
  } else if (e.actionState === SOVEREIGN_STATES.DEATH_COLLAPSE) {
    drawMajesticDeathCollapse(ctx, e, frameCount);
  } else {
  const R = e.radius;
  const isTransition = e.actionState === SOVEREIGN_STATES.PHASE_TRANSITION;

  // Micro-contração cósmica e anel de aviso contratil pré-detonação da transição
  if (isTransition && e.transitionWindup > 0) {
    const windupRatio = 1 - Math.max(0, e.transitionWindup / 40);
    const scaleFactor = 1.0 - 0.22 * Math.sin(windupRatio * Math.PI);
    ctx.scale(scaleFactor, scaleFactor);

    const ringRadius = Math.max(10, 260 * (1 - windupRatio));
    ctx.save();
    ctx.strokeStyle = e.phase === 2 ? 'rgba(232, 67, 147, 0.9)' : 'rgba(0, 206, 201, 0.9)';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  const isStaggered = e.actionState === SOVEREIGN_STATES.RECOVERY_STAGGER;
  const isWindup = e.actionState === SOVEREIGN_STATES.WINDUP;
  const isCasting = e.actionState === SOVEREIGN_STATES.CASTING;

  const morph = e.phaseCinematic ? (e.phaseCinematic.morphProgress || 0) : (e.transformationProgress || 0);
  const targetPhase = e.phaseCinematic ? e.phaseCinematic.phase : (e.phase || 1);

  if (e.phaseCinematic) {
    e.eyeAperture = Math.min(1.0, 0.4 + morph * 0.6);
  }

  let primaryCol = '#8e44ad';
  let secondaryCol = '#341f97';
  let coreCol = '#e84393';
  let edgeCol = '#a29bfe';

  if (targetPhase === 2) {
    if (e.phaseCinematic && morph > 0) {
      primaryCol = lerpColorHex('#8e44ad', '#e84393', morph);
      secondaryCol = lerpColorHex('#341f97', '#6c5ce7', morph);
      coreCol = lerpColorHex('#e84393', '#ff7675', morph);
      edgeCol = lerpColorHex('#a29bfe', '#fd79a8', morph);
    } else if (e.phase >= 2) {
      primaryCol = '#e84393';
      secondaryCol = '#6c5ce7';
      coreCol = '#ff7675';
      edgeCol = '#fd79a8';
    }
  } else if (targetPhase === 3) {
    if (e.phaseCinematic && morph > 0) {
      primaryCol = lerpColorHex('#e84393', '#00cec9', morph);
      secondaryCol = lerpColorHex('#6c5ce7', '#0984e3', morph);
      coreCol = lerpColorHex('#ff7675', '#ffffff', morph);
      edgeCol = lerpColorHex('#fd79a8', '#81ecec', morph);
    } else if (e.phase >= 3) {
      primaryCol = '#00cec9';
      secondaryCol = '#0984e3';
      coreCol = '#ffffff';
      edgeCol = '#81ecec';
    }
  }

  // Ondulação de lentes gravitacionais em slow motion durante a metamorfose da fase
  if (e.phaseCinematic && morph > 0.05) {
    ctx.save();
    const rippleAlpha = Math.sin(morph * Math.PI) * 0.72;
    const rippleCol = targetPhase === 3 ? '0, 206, 201' : '232, 67, 147';
    ctx.strokeStyle = `rgba(${rippleCol}, ${rippleAlpha})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, R * (0.8 + 1.2 * morph), 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${rippleAlpha * 0.8})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, R * (0.5 + 0.8 * morph), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 1. Selo Abissal no Solo
  ctx.save();
  const groundPulse = Math.sin(frameCount * 0.08) * 4;
  const groundRot = frameCount * 0.015;

  const idleB = e.idleBlend || 0;
  let sealCol = isStaggered ? 'rgba(127, 140, 141, 0.4)' : (e.phase === 3 ? 'rgba(0, 206, 201, 0.4)' : (e.phase === 2 ? 'rgba(232, 67, 147, 0.4)' : 'rgba(142, 68, 173, 0.4)'));
  let innerCol = isStaggered ? 'rgba(189, 195, 199, 0.25)' : (e.phase === 3 ? 'rgba(129, 236, 236, 0.35)' : (e.phase === 2 ? 'rgba(232, 67, 147, 0.35)' : 'rgba(162, 155, 254, 0.35)'));

  if (idleB > 0.05) {
    // No estado inativo, o selo transmuta suavemente para o azul-gelo sereno da referência
    sealCol = `rgba(129, 236, 236, ${0.4 * (1 - idleB) + 0.38 * idleB})`;
    innerCol = `rgba(200, 245, 255, ${0.35 * (1 - idleB) + 0.42 * idleB})`;
  }

  ctx.strokeStyle = sealCol;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.95, R * 1.6 + groundPulse, R * 0.55 + groundPulse * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = innerCol;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.ellipse(0, R * 0.95, R * 1.35 + groundPulse * 0.5, R * 0.45 + groundPulse * 0.2, -groundRot * 1.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const runeCount = 8;
  for (let rn = 0; rn < runeCount; rn++) {
    const ra = groundRot + (rn * Math.PI * 2) / runeCount;
    const rx = Math.cos(ra) * (R * 1.6 + groundPulse);
    const ry = R * 0.95 + Math.sin(ra) * (R * 0.55 + groundPulse * 0.35);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + Math.cos(ra) * 6, ry + Math.sin(ra) * 3);
    ctx.stroke();
  }
  ctx.restore();

  // 1.5. Locais de Cura Sagrados (Santuários Celestiais)
  if (e.healingZones && e.healingZones.length > 0) {
    drawHealingZones(ctx, e, frameCount);
  }

  // 2. Barreira do Horizonte de Eventos
  if (e.phase >= 2) {
    const relCenterX = e.arenaCenterX - e.x;
    const relCenterY = e.arenaCenterY - e.y;

    ctx.save();
    // drawAbyssSovereign já neutralizou o facing horizontal, mantendo coordenadas de mundo 1:1
    ctx.translate(relCenterX, relCenterY);

    const pulseR = e.arenaRadius + e.horizonPulse * 3;

    ctx.strokeStyle = e.phase === 3 ? 'rgba(0, 206, 201, 0.65)' : 'rgba(232, 67, 147, 0.65)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, pulseR - 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const horizonRunes = 12;
    ctx.fillStyle = e.phase === 3 ? '#00d2d3' : '#e84393';
    for (let r = 0; r < horizonRunes; r++) {
      const rAng = (r * Math.PI * 2 / horizonRunes) + frameCount * 0.005;
      const rx = Math.cos(rAng) * pulseR;
      const ry = Math.sin(rAng) * pulseR;
      ctx.fillRect(rx - 3, ry - 3, 6, 6);
    }
    ctx.restore();
  }

  // 3. Orbes Elípticos da Singularidade
  if (e.phase === 3 && e.singularityOrbs && e.singularityOrbs.length > 0) {
    ctx.save();
    for (let i = 0; i < e.singularityOrbs.length; i++) {
      const orb = e.singularityOrbs[i];
      if (orb.curX === undefined) continue;

      const relX = orb.curX - e.x;
      const relY = orb.curY - e.y;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(relX, relY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#00cec9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(relX, relY, 7.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 3.1 Telegrafia Prévia do Pulso Sísmico de Singularidade (Fase 3: Alerta Vital para Melee)
  if (e.phase === 3 && e.isSingularityChargingPulse) {
    const pulseRatio = Math.max(0, Math.min(1, e.singularityChargeRatio || 0));
    const maxPulseR = (e.arenaRadius || 380) * 0.68;
    drawSoulslikeAoETelegraph(ctx, 0, 0, maxPulseR, pulseRatio, '0, 206, 201', frameCount, {
      label: 'PULSO DE SINGULARIDADE',
      tickCount: 16
    });
  }

  // 4. Telegrafia do Crucifixo (Convergência de Luz e Alinhamento de Perigo)
  if (isWindup && e.currentSkill === 'VOID_CRUCIFIX') {
    const armCount = 4;
    const ratio = 1 - (e.windupTimer / (e.windupMax || 50));
    ctx.save();

    // 4.1 Vórtice de convergência de fótons no núcleo (0, 0)
    const chargeR = 12 + ratio * 24;
    const coreGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, chargeR);
    coreGlow.addColorStop(0, '#ffffff');
    coreGlow.addColorStop(0.4, e.phase === 3 ? 'rgba(0, 206, 201, 0.8)' : 'rgba(232, 67, 147, 0.8)');
    coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(0, 0, chargeR, 0, Math.PI * 2);
    ctx.fill();

    // 4.2 Feixes guias e corredores de aviso dos 4 braços
    const isImminent = e.windupTimer <= 14;
    const strobe = isImminent && Math.sin(frameCount * 0.6) > 0;

    for (let arm = 0; arm < armCount; arm++) {
      const rayAng = e.beamAngle + (arm * (Math.PI * 2 / armCount));
      const cosA = Math.cos(rayAng);
      const sinA = Math.sin(rayAng);
      const len = 1300;
      const perpX = -sinA;
      const perpY = cosA;

      // Corredor translúcido de aviso (largura proporcional à hitbox de 40px)
      const warningHalfW = 20 * ratio;
      ctx.fillStyle = e.phase === 3 
        ? (strobe ? 'rgba(0, 206, 201, 0.22)' : 'rgba(0, 206, 201, 0.08)') 
        : (strobe ? 'rgba(232, 67, 147, 0.22)' : 'rgba(232, 67, 147, 0.08)');
      ctx.beginPath();
      ctx.moveTo(perpX * warningHalfW, perpY * warningHalfW);
      ctx.lineTo(cosA * len + perpX * warningHalfW, sinA * len + perpY * warningHalfW);
      ctx.lineTo(cosA * len - perpX * warningHalfW, sinA * len - perpY * warningHalfW);
      ctx.lineTo(-perpX * warningHalfW, -perpY * warningHalfW);
      ctx.closePath();
      ctx.fill();

      // Linha laser guia de alta precisão
      ctx.strokeStyle = strobe ? '#ffffff' : (e.phase === 3 ? 'rgba(0, 206, 201, 0.8)' : 'rgba(232, 67, 147, 0.8)');
      ctx.lineWidth = strobe ? 3.0 : 1.8;
      ctx.setLineDash([14, 7]);
      ctx.lineDashOffset = -frameCount * 2.0;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cosA * len, sinA * len);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // 5. Feixes do Crucifixo do Vácuo (Lasers de Plasma Cósmico & Fratura Dimensional)
  if (isCasting && e.currentSkill === 'VOID_CRUCIFIX') {
    const armCount = 4;
    const len = 1300;
    const isP3 = e.phase === 3;
    const primaryCol = isP3 ? 'rgba(0, 206, 201, ' : 'rgba(232, 67, 147, ';
    const secondaryCol = isP3 ? 'rgba(129, 236, 236, ' : 'rgba(224, 86, 253, ';
    const accentCol = isP3 ? '#81ecec' : '#fd79a8';

    ctx.save();

    for (let arm = 0; arm < armCount; arm++) {
      const rayAng = e.beamAngle + (arm * (Math.PI * 2 / armCount));
      const cosA = Math.cos(rayAng);
      const sinA = Math.sin(rayAng);
      const perpX = -sinA;
      const perpY = cosA;

      // 5.1 Halo de Ionização Atmosférica (Largura 44px - cobre a hitbox real)
      const haloW = 42 + Math.sin(frameCount * 0.35 + arm * 1.5) * 4;
      ctx.strokeStyle = primaryCol + (0.24 + Math.sin(frameCount * 0.2 + arm) * 0.06) + ')';
      ctx.lineWidth = haloW;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cosA * len, sinA * len);
      ctx.stroke();

      // 5.2 Bainha Intermediária de Plasma Cósmico
      const plasmaW = 20 + Math.sin(frameCount * 0.5 + arm) * 3;
      ctx.strokeStyle = secondaryCol + '0.65)';
      ctx.lineWidth = plasmaW;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cosA * len, sinA * len);
      ctx.stroke();

      // 5.3 Dupla Hélice de Plasma Ondulante (Serpenteamento de Energia Viva)
      // Fita 1
      ctx.beginPath();
      const segCount = 26;
      for (let s = 0; s <= segCount; s++) {
        const d = (s / segCount) * len;
        const wave = Math.sin(d * 0.032 - frameCount * 0.35 + arm) * 10;
        const wx = cosA * d + perpX * wave;
        const wy = sinA * d + perpY * wave;
        if (s === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.strokeStyle = secondaryCol + '0.85)';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Fita 2 (oposta)
      ctx.beginPath();
      for (let s = 0; s <= segCount; s++) {
        const d = (s / segCount) * len;
        const wave = -Math.sin(d * 0.032 - frameCount * 0.35 + arm) * 10;
        const wx = cosA * d + perpX * wave;
        const wy = sinA * d + perpY * wave;
        if (s === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.strokeStyle = primaryCol + '0.75)';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // 5.4 Núcleo Incandescente Superaquecido
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cosA * len, sinA * len);
      ctx.stroke();

      // 5.5 Nódulos de Pulso de Alta Velocidade (Fluxo Contínuo de Luz)
      for (let n = 0; n < 4; n++) {
        const nodeProg = ((frameCount * 0.05 + n * 0.25 + arm * 0.07) % 1.0);
        const nDist = nodeProg * len;
        const nx = cosA * nDist;
        const ny = sinA * nDist;
        const nLen = 42;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8.5;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(nx + cosA * nLen, ny + sinA * nLen);
        ctx.stroke();
      }

      // 5.6 Descargas Elétricas / Micro-Arcos Transversais
      const arcSeed = Math.floor(frameCount * 0.35) + arm * 5;
      if (arcSeed % 2 === 0) {
        const arcDist = ((arcSeed * 179) % (len - 250)) + 80;
        const arcSide = (arcSeed % 4 > 1) ? 1 : -1;
        const arcBaseX = cosA * arcDist;
        const arcBaseY = sinA * arcDist;
        const arcLen = 16 + (arcSeed % 14);
        const midX = arcBaseX + perpX * (arcSide * arcLen * 0.6) + cosA * 8;
        const midY = arcBaseY + perpY * (arcSide * arcLen * 0.6) + sinA * 8;
        const endX = arcBaseX + perpX * (arcSide * arcLen);
        const endY = arcBaseY + perpY * (arcSide * arcLen);

        ctx.strokeStyle = accentCol;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(arcBaseX, arcBaseY);
        ctx.lineTo(midX, midY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }

    // 5.7 Núcleo Emissor Central e Lente de Convergência no Chefe (0, 0)
    const emitR = 36 + Math.sin(frameCount * 0.4) * 6;
    const emitGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, emitR);
    emitGrad.addColorStop(0, '#ffffff');
    emitGrad.addColorStop(0.35, isP3 ? 'rgba(0, 206, 201, 0.95)' : 'rgba(232, 67, 147, 0.95)');
    emitGrad.addColorStop(0.7, isP3 ? 'rgba(129, 236, 236, 0.6)' : 'rgba(224, 86, 253, 0.6)');
    emitGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = emitGrad;
    ctx.beginPath();
    ctx.arc(0, 0, emitR, 0, Math.PI * 2);
    ctx.fill();

    // 5.8 Clarão Dramático de Inversão ("INVERSÃO!")
    if (e.inversionFlashTimer && e.inversionFlashTimer > 0) {
      const invRatio = 1 - (e.inversionFlashTimer / 18);
      const invR = 20 + invRatio * 160;
      const invAlpha = Math.max(0, 1 - invRatio);

      ctx.strokeStyle = `rgba(255, 255, 255, ${invAlpha})`;
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      ctx.arc(0, 0, invR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 118, 117, ${invAlpha * 0.8})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, invR - 8), 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Telegrafia do Corte Dimensional: Feixe Único (P1-P2) vs Feixe Triplo em Tridente (P3)
  if (isWindup && e.currentSkill === 'DIMENSIONAL_CLEAVE') {
    ctx.save();
    const isLocked = e.cleaveLocked;
    const isPhase3 = e.phase === 3;
    const baseAng = e.cleaveAngle || 0;
    const ratio = 1 - (e.windupTimer / (e.windupMax || 48));
    const isImminent = e.windupTimer <= 10;
    const strobe = isImminent && Math.sin(frameCount * 0.7) > 0;
    const beamLen = 1500;

    // No Feixe Triplo, as miras laterais se abrem suavemente no início (efeito de refração em prisma)
    const sideSpread = isPhase3 ? Math.min(0.28, Math.max(0.05, ratio * 0.7) * 0.28) : 0;
    const aimAngles = isPhase3 ? [baseAng, baseAng - sideSpread, baseAng + sideSpread] : [baseAng];

    // Arcos elétricos pré-disparo entre as miras do Feixe Triplo
    if (isPhase3 && ratio > 0.25) {
      for (let bridge = 1; bridge <= 5; bridge++) {
        const bDist = bridge * 220;
        const cx = Math.cos(baseAng) * bDist;
        const cy = Math.sin(baseAng) * bDist;
        for (let s of [-sideSpread, sideSpread]) {
          const sx = Math.cos(baseAng + s) * bDist;
          const sy = Math.sin(baseAng + s) * bDist;
          if (Math.sin(frameCount * 0.35 + bridge) > 0.15) {
            ctx.strokeStyle = `rgba(0, 206, 201, ${0.45 * ratio})`;
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo((cx + sx) * 0.5 + Math.sin(bridge * 2.1) * 14, (cy + sy) * 0.5 + Math.cos(bridge * 2.1) * 14);
            ctx.lineTo(sx, sy);
            ctx.stroke();
          }
        }
      }
    }

    for (let l = 0; l < aimAngles.length; l++) {
      const ang = aimAngles[l];
      const cosA = Math.cos(ang);
      const sinA = Math.sin(ang);
      const isMain = l === 0;
      const perpX = -sinA;
      const perpY = cosA;

      // Corredor de perigo com gradiente dimensional
      const halfVisualW = (isMain ? (isPhase3 ? 35 : 54) : 23) * Math.min(1, ratio * 1.5);
      if (halfVisualW > 2) {
        ctx.fillStyle = isLocked
          ? (strobe ? 'rgba(232, 67, 147, 0.28)' : 'rgba(232, 67, 147, 0.14)')
          : (isPhase3 
              ? (isMain ? `rgba(0, 206, 201, ${0.05 + ratio * 0.09})` : `rgba(0, 206, 201, ${0.03 + ratio * 0.06})`)
              : `rgba(232, 67, 147, ${0.04 + ratio * 0.08})`);
        ctx.beginPath();
        ctx.moveTo(perpX * halfVisualW, perpY * halfVisualW);
        ctx.lineTo(cosA * beamLen + perpX * halfVisualW, sinA * beamLen + perpY * halfVisualW);
        ctx.lineTo(cosA * beamLen - perpX * halfVisualW, sinA * beamLen - perpY * halfVisualW);
        ctx.lineTo(-perpX * halfVisualW, -perpY * halfVisualW);
        ctx.closePath();
        ctx.fill();
      }

      // Fio guia central de alta voltagem com dash dinâmico
      ctx.strokeStyle = isLocked
        ? (isMain ? (strobe ? '#ffffff' : (isPhase3 ? '#00cec9' : '#e84393')) : 'rgba(232, 67, 147, 0.85)')
        : (isMain ? (isPhase3 ? 'rgba(0, 206, 201, 0.9)' : 'rgba(232, 67, 147, 0.9)') : 'rgba(0, 206, 201, 0.55)');
      ctx.lineWidth = isLocked ? (isMain ? 3.5 : 2.0) : (isMain ? 2.4 : 1.5);
      ctx.setLineDash(isLocked ? [14, 5] : [8, 6]);
      ctx.lineDashOffset = -frameCount * 2.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cosA * beamLen, sinA * beamLen);
      ctx.stroke();
      ctx.setLineDash([]);

      // Nódulos de convergência viajando para o chefe (sucção de fótons)
      if (isMain || isPhase3) {
        const nodeCount = isMain ? 5 : 3;
        for (let n = 0; n < nodeCount; n++) {
          const nProg = ((frameCount * 0.045 + n * 0.2 + l * 0.1) % 1.0);
          const nDist = (1 - nProg) * beamLen * 0.75;
          const nAlpha = Math.sin(nProg * Math.PI) * 0.85;
          const nSize = (isMain ? 3.8 : 2.6) + (1 - nProg) * 2.5;
          ctx.fillStyle = isPhase3 ? `rgba(0, 206, 201, ${nAlpha})` : `rgba(232, 67, 147, ${nAlpha})`;
          ctx.beginPath();
          ctx.arc(cosA * nDist, sinA * nDist, nSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Bordas laterais de fissura dimensional (revelam a largura exata de impacto)
      if (ratio > 0.25) {
        const edgeAlpha = Math.min(0.65, (ratio - 0.25) * 1.5);
        ctx.strokeStyle = isPhase3 ? `rgba(0, 206, 201, ${edgeAlpha})` : `rgba(232, 67, 147, ${edgeAlpha})`;
        ctx.lineWidth = 1.3;
        for (let side = -1; side <= 1; side += 2) {
          ctx.beginPath();
          for (let seg = 0; seg <= 14; seg++) {
            const d = (seg / 14) * beamLen * 0.92;
            const jitter = Math.sin(d * 0.018 + frameCount * 0.22 + side) * 3;
            const edgeX = cosA * d + perpX * (halfVisualW + jitter) * side;
            const edgeY = sinA * d + perpY * (halfVisualW + jitter) * side;
            if (seg === 0) ctx.moveTo(edgeX, edgeY);
            else ctx.lineTo(edgeX, edgeY);
          }
          ctx.stroke();
        }
      }
    }

    // Disco focal de carga pré-corte no centro do chefe
    const chargeR = 14 + ratio * 30 + Math.sin(frameCount * 0.45) * 5;
    const focusGrad = ctx.createRadialGradient(0, 0, 3, 0, 0, chargeR);
    focusGrad.addColorStop(0, '#ffffff');
    focusGrad.addColorStop(0.3, isPhase3 ? 'rgba(0, 206, 201, 0.95)' : 'rgba(232, 67, 147, 0.95)');
    focusGrad.addColorStop(0.7, isPhase3 ? 'rgba(129, 236, 236, 0.55)' : 'rgba(142, 68, 173, 0.5)');
    focusGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = focusGrad;
    ctx.beginPath();
    ctx.arc(0, 0, chargeR, 0, Math.PI * 2);
    ctx.fill();

    // No Feixe Triplo, desenha 3 focos de plasma satélites na lente de disparo
    if (isPhase3) {
      for (let l = 0; l < aimAngles.length; l++) {
        const satAng = aimAngles[l];
        const satDist = chargeR * 0.75;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(Math.cos(satAng) * satDist, Math.sin(satAng) * satDist, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Arco de energia concentrada na direção do corte
    if (ratio > 0.45) {
      const arcAlpha = (ratio - 0.45) * 2;
      ctx.strokeStyle = `rgba(255, 255, 255, ${arcAlpha * 0.9})`;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(0, 0, chargeR + 6, baseAng - (isPhase3 ? 0.55 : 0.35), baseAng + (isPhase3 ? 0.55 : 0.35));
      ctx.stroke();
    }

    ctx.restore();
  }

  // 6. Colapso de Matéria Escura / Singularidade Primordial (Reformulação Cósmica em 3 Atos)
  if (isWindup && e.currentSkill === 'SINGULARITY_IMPLOSION') {
    const relX = e.implosionX - e.x;
    const relY = e.implosionY - e.y;
    const R = e.implosionMaxRadius || 175;
    const elapsed = (e.windupMax || 101) - e.windupTimer;
    const isReleased = e.implosionReleased;
    const isLocked = e.implosionLocked;

    ctx.save();

    // 6.1 Gradiente do Horizonte de Eventos (Vácuo Abissal no solo)
    const voidGrad = ctx.createRadialGradient(relX, relY, 10, relX, relY, R);
    if (isReleased) {
      // Ato 3: Sobrecarga crítica / Alerta máximo
      const flashAlpha = 0.28 + Math.sin(frameCount * 0.4) * 0.12;
      voidGrad.addColorStop(0, 'rgba(5, 2, 12, 0.85)');
      voidGrad.addColorStop(0.45, `rgba(224, 86, 253, ${flashAlpha})`);
      voidGrad.addColorStop(0.85, `rgba(0, 206, 201, ${flashAlpha * 0.7})`);
      voidGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (isLocked) {
      // Ato 2: Poço Gravitacional intenso
      voidGrad.addColorStop(0, 'rgba(5, 2, 12, 0.80)');
      voidGrad.addColorStop(0.5, 'rgba(142, 68, 173, 0.32)');
      voidGrad.addColorStop(0.9, 'rgba(0, 206, 201, 0.12)');
      voidGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      // Ato 1: Gênese suave
      voidGrad.addColorStop(0, 'rgba(5, 2, 12, 0.65)');
      voidGrad.addColorStop(0.6, 'rgba(142, 68, 173, 0.18)');
      voidGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    ctx.fillStyle = voidGrad;
    ctx.beginPath();
    ctx.arc(relX, relY, R, 0, Math.PI * 2);
    ctx.fill();

    // 6.2 Perímetro do Horizonte de Eventos (Borda nítida do raio letal de 140px)
    if (isReleased) {
      // Estroboscópio de ruptura / Alerta final de fuga
      const isStrobe = Math.sin(frameCount * 0.5) > 0;
      ctx.strokeStyle = isStrobe ? '#ffffff' : '#00cec9';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(relX, relY, R, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(232, 67, 147, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(relX, relY, R + 4, frameCount * 0.08, frameCount * 0.08 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (isLocked) {
      // Borda gravada com runas orbitantes no Ato 2
      ctx.strokeStyle = 'rgba(224, 86, 253, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(relX, relY, R, 0, Math.PI * 2);
      ctx.stroke();

      // Runas / Marcadores orbitais no perímetro de perigo
      const runeCount = 6;
      ctx.fillStyle = '#00cec9';
      for (let rn = 0; rn < runeCount; rn++) {
        const rAng = (rn * Math.PI * 2) / runeCount + frameCount * 0.03;
        const rx = relX + Math.cos(rAng) * R;
        const ry = relY + Math.sin(rAng) * R;
        ctx.beginPath();
        ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Anel tracejado suave no Ato 1
      ctx.strokeStyle = 'rgba(142, 68, 173, 0.65)';
      ctx.lineWidth = 2.0;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(relX, relY, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 6.3 Onda de Choque da Ruptura Gravitacional (Pulso no início do Ato 3)
    if (e.implosionSnapRing && e.implosionSnapRing > 0) {
      const snapAlpha = Math.max(0, 1 - e.implosionSnapRing / (R * 1.5));
      ctx.strokeStyle = `rgba(255, 255, 255, ${snapAlpha})`;
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.arc(relX, relY, e.implosionSnapRing, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(0, 206, 201, ${snapAlpha * 0.7})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(relX, relY, Math.max(1, e.implosionSnapRing - 8), 0, Math.PI * 2);
      ctx.stroke();
    }

    // 6.4 Disco de Acreção e Filamentos Espirais (Rotação Diferencial)
    const armCount = 3;
    const spinSpeed = isReleased ? 0.14 : (isLocked ? 0.08 : 0.04);
    for (let a = 0; a < armCount; a++) {
      const armBaseAng = (a * Math.PI * 2) / armCount + frameCount * spinSpeed;
      ctx.beginPath();
      for (let s = 0; s <= 22; s++) {
        const t = s / 22;
        const curDist = 16 + (R - 16) * t;
        const spiralAng = armBaseAng + (1 - t) * 2.6;
        const sx = relX + Math.cos(spiralAng) * curDist;
        const sy = relY + Math.sin(spiralAng) * curDist;
        if (s === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = a % 2 === 0
        ? `rgba(0, 206, 201, ${isReleased ? 0.75 : 0.5})`
        : `rgba(224, 86, 253, ${isReleased ? 0.75 : 0.5})`;
      ctx.lineWidth = isReleased ? 2.2 : 1.6;
      ctx.stroke();
    }

    // 6.5 Partículas Estelares Sendo Ingeridas (Ativas enquanto a gravidade puxa)
    if (!isReleased) {
      for (let p = 0; p < 8; p++) {
        const pProgress = ((frameCount * 2.4 + p * 32) % R) / R;
        const pDist = R * (1 - pProgress);
        const pAng = (p * 2.399) + (pProgress * 3.0) + frameCount * 0.04;
        const px = relX + Math.cos(pAng) * pDist;
        const py = relY + Math.sin(pAng) * pDist;
        ctx.fillStyle = p % 2 === 0 ? '#81ecec' : '#e056fd';
        ctx.beginPath();
        ctx.arc(px, py, 1.8 + (1 - pProgress) * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 6.6 Núcleo da Singularidade (Buraco Negro com Lente Gravitacional)
    let coreJitterX = 0;
    let coreJitterY = 0;
    let coreRadius = 18;

    if (isReleased) {
      // Ato 3: vibração caótica de alta frequência e contração pré-implosão
      const collapseProgress = Math.min(1, Math.max(0, (elapsed - 70) / 65));
      coreRadius = Math.max(4, 18 * (1 - collapseProgress * 0.8));
      coreJitterX = (Math.sin(frameCount * 1.9) + Math.cos(frameCount * 2.7)) * 2.2;
      coreJitterY = (Math.cos(frameCount * 2.1) + Math.sin(frameCount * 1.7)) * 2.2;
    } else {
      coreRadius = 16 + Math.sin(frameCount * 0.15) * 2;
    }

    const cx = relX + coreJitterX;
    const cy = relY + coreJitterY;

    // Halo Incandescente do Anel de Fótons
    const photonGrad = ctx.createRadialGradient(cx, cy, coreRadius * 0.8, cx, cy, coreRadius * 1.9);
    photonGrad.addColorStop(0, '#ffffff');
    photonGrad.addColorStop(0.3, isReleased ? '#e056fd' : '#00cec9');
    photonGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = photonGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius * 1.9, 0, Math.PI * 2);
    ctx.fill();

    // Esfera Negra Absoluta Central
    ctx.fillStyle = '#05020a';
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    // Borda afiada de horizonte óptico
    ctx.strokeStyle = isReleased ? '#ffffff' : '#81ecec';
    ctx.lineWidth = isReleased ? 2.5 : 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // 7. Passo Interdimensional (Telegrafia de Alta Legibilidade Melee)
  if (e.actionState === SOVEREIGN_STATES.WARP_AIM) {
    const relX = e.warpTargetX - e.x;
    const relY = e.warpTargetY - e.y;
    const ratio = Math.max(0, Math.min(1, 1 - (e.windupTimer / (e.windupMax || 42))));
    const warpR = e.warpTelegraphRadius || 150;

    drawSoulslikeAoETelegraph(ctx, relX, relY, warpR, ratio, '232, 67, 147', frameCount, {
      label: 'COLAPSO DE TELEPORTE',
      tickCount: 16
    });

    // 7.4 Se já aterrissou e está no micro-windup de impacto, flash de aviso iminente
    if (e.warpLanded && e.warpImpactTimer > 0) {
      const impactRatio = e.warpImpactTimer / 14;
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${0.40 * impactRatio})`;
      ctx.beginPath();
      ctx.arc(relX, relY, warpR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 7.1 Telegrafia e Efeito de Disparo Relativístico (RELATIVISTIC_SALVO)
  if (isWindup && e.currentSkill === 'RELATIVISTIC_SALVO') {
    ctx.save();
    const ratio = 1 - (e.windupTimer / (e.windupMax || 1));
    const salvoAng = e.salvoSpiralAngle || 0;
    
    // Anel contrátil de energia cósmica no núcleo
    const chargeR = Math.max(12, (R * 1.8) * (1 - ratio));
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.8)';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, chargeR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Linha guia de mira vetorial na direção do alvo
    ctx.strokeStyle = `rgba(0, 206, 201, ${0.35 + ratio * 0.5})`;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(salvoAng) * 450, Math.sin(salvoAng) * 450);
    ctx.stroke();

    // Nós espirais de partículas convergindo para o núcleo
    const nodeCount = 5;
    for (let n = 0; n < nodeCount; n++) {
      const nAng = salvoAng + (n * Math.PI * 2 / nodeCount) + frameCount * 0.12;
      const nDist = chargeR * 0.85;
      ctx.fillStyle = n % 2 === 0 ? '#00cec9' : '#e84393';
      ctx.beginPath();
      ctx.arc(Math.cos(nAng) * nDist, Math.sin(nAng) * nDist, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  if (isCasting && e.currentSkill === 'RELATIVISTIC_SALVO') {
    ctx.save();
    const salvoAng = e.salvoSpiralAngle || 0;
    const pulseMuzzle = 12 + Math.sin(frameCount * 0.4) * 6;
    ctx.fillStyle = 'rgba(0, 206, 201, 0.7)';
    ctx.beginPath();
    ctx.arc(Math.cos(salvoAng) * (R * 0.85), Math.sin(salvoAng) * (R * 0.85), pulseMuzzle, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 7.2 Telegrafia das Fendas Abissais (ABYSSAL_RIFTS)
  if (isWindup && e.currentSkill === 'ABYSSAL_RIFTS') {
    ctx.save();
    const ratio = 1 - (e.windupTimer / (e.windupMax || 1));
    const groundPulseR = R * (1.2 + ratio * 0.8);

    // Selos de fenda escura no solo sob o chefe
    ctx.strokeStyle = `rgba(232, 67, 147, ${0.4 + ratio * 0.55})`;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.ellipse(0, R * 0.9, groundPulseR, groundPulseR * 0.45, frameCount * 0.05, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Fissuras radiais se abrindo do centro para fora
    const fissureCount = 6;
    for (let f = 0; f < fissureCount; f++) {
      const fAng = (f * Math.PI * 2 / fissureCount) + frameCount * 0.02;
      const fDist = groundPulseR * 0.9;
      ctx.strokeStyle = f % 2 === 0 ? '#00cec9' : '#e84393';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, R * 0.9);
      ctx.lineTo(Math.cos(fAng) * fDist, R * 0.9 + Math.sin(fAng) * fDist * 0.45);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 7.3 Telegrafia da Chuva Astral (ASTRAL_BARRAGE)
  if (isWindup && e.currentSkill === 'ASTRAL_BARRAGE') {
    ctx.save();
    const ratio = 1 - (e.windupTimer / (e.windupMax || 1));
    
    // Vórtice vertical celestial ascendente conectando aos céus
    const beamW = 16 + ratio * 20;
    const beamH = 380;
    const colGrad = ctx.createLinearGradient(0, 0, 0, -beamH);
    colGrad.addColorStop(0, 'rgba(0, 206, 201, 0.9)');
    colGrad.addColorStop(0.5, 'rgba(232, 67, 147, 0.65)');
    colGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = colGrad;
    ctx.fillRect(-beamW * 0.5, -beamH, beamW, beamH);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -beamH, 4, beamH);

    // Glifos astrais em anel subindo
    const ringY = -beamH * ratio;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(0, ringY, 28, 9, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 8. Âncoras de Vácuo (Orbes de Singularidade Cósmica)
  if (e.anchors && e.anchors.length > 0) {
    for (let i = 0; i < e.anchors.length; i++) {
      const a = e.anchors[i];
      if (!a.active) continue;

      const relX = a.x - e.x;
      const relY = a.y - e.y;
      const tetherDist = Math.hypot(relX, relY) || 1;
      const tetherAng = Math.atan2(relY, relX);

      // --- A. LIGAÇÃO ENERGÉTICA CÓSMICA (TETHER) ---
      ctx.save();

      // Feixe volumétrico externo de dispersão
      const pulseBeam = 0.25 + Math.sin(frameCount * 0.1 + i) * 0.1;
      ctx.strokeStyle = `rgba(0, 206, 201, ${pulseBeam})`;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(relX, relY);
      ctx.stroke();

      // Feixe intermediário
      ctx.strokeStyle = 'rgba(162, 155, 254, 0.65)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(relX, relY);
      ctx.stroke();

      // Filamento central superaquecido
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(relX, relY);
      ctx.stroke();

      // Espiral de energia helicoidal ao redor do feixe
      const waveSegs = 18;
      ctx.strokeStyle = 'rgba(0, 206, 201, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const perpX = -Math.sin(tetherAng);
      const perpY = Math.cos(tetherAng);
      for (let s = 0; s <= waveSegs; s++) {
        const t = s / waveSegs;
        const bx = relX * t;
        const by = relY * t;
        const wave = Math.sin(t * Math.PI * 4 - frameCount * 0.14 + i * 2) * 9;
        const wx = bx + perpX * wave;
        const wy = by + perpY * wave;
        if (s === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      // Sifões de matéria cósmica fluindo em direção ao Soberano
      for (let p = 0; p < 3; p++) {
        const flowT = ((frameCount * 0.04 + i * 0.33 + p * 0.33) % 1);
        const flowX = relX * (1 - flowT);
        const flowY = relY * (1 - flowT);
        const flowR = 2.5 + Math.sin(frameCount * 0.2 + p) * 1;
        ctx.fillStyle = p === 0 ? '#ffffff' : (p === 1 ? '#00d2d3' : '#e84393');
        ctx.beginPath();
        ctx.arc(flowX, flowY, flowR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // --- B. CORPO DA ORBE DE SINGULARIDADE ---
      ctx.save();
      ctx.translate(relX, relY);

      const isAnchorHit = a.hitFlash > 0;
      const anchorR = a.radius;
      const hpRatio = Math.max(0, a.hp / a.maxHp);

      // 1. Halo Radial de Distorção Gravitacional
      const auraPulse = Math.sin(frameCount * 0.12 + i * 1.5) * 5;
      const glowGrad = ctx.createRadialGradient(0, 0, anchorR * 0.2, 0, 0, anchorR * 2.0 + auraPulse);
      glowGrad.addColorStop(0, isAnchorHit ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 206, 201, 0.5)');
      glowGrad.addColorStop(0.5, 'rgba(142, 68, 173, 0.28)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, anchorR * 2.0 + auraPulse, 0, Math.PI * 2);
      ctx.fill();

      // 2. Anel Giroscópico Primário com Nodos Orbitais
      const rot1 = frameCount * 0.045 + i;
      ctx.save();
      ctx.rotate(rot1);
      ctx.strokeStyle = isAnchorHit ? '#ffffff' : 'rgba(0, 206, 201, 0.8)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, anchorR * 1.55, anchorR * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();

      for (let k = 0; k < 3; k++) {
        const kAng = (k * Math.PI * 2 / 3) + frameCount * 0.06;
        const kx = Math.cos(kAng) * (anchorR * 1.55);
        const ky = Math.sin(kAng) * (anchorR * 0.65);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(kx, ky, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 3. Anel Giroscópico Secundário Contra-Rotativo
      const rot2 = -frameCount * 0.055 + i * 1.3;
      ctx.save();
      ctx.rotate(rot2);
      ctx.strokeStyle = isAnchorHit ? '#ffffff' : 'rgba(232, 67, 147, 0.7)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.ellipse(0, 0, anchorR * 1.3, anchorR * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 4. Carapaça de Fragmentos Criptográficos
      const shardCount = 4;
      const shardBreath = Math.sin(frameCount * 0.14 + i) * 3;
      const shardDist = anchorR * 0.88 + shardBreath;
      const shardRot = frameCount * 0.025 + i * 0.8;

      for (let s = 0; s < shardCount; s++) {
        const sAng = shardRot + (s * Math.PI * 2 / shardCount);
        const sx = Math.cos(sAng) * shardDist;
        const sy = Math.sin(sAng) * shardDist;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(sAng + Math.PI / 2);

        ctx.fillStyle = isAnchorHit ? '#ffffff' : '#08010f';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(5.5, 0);
        ctx.lineTo(0, 8);
        ctx.lineTo(-5.5, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isAnchorHit ? '#ffffff' : (s % 2 === 0 ? '#00cec9' : '#a29bfe');
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // 5. Núcleo Cósmico de Singularidade
      const coreR = anchorR * 0.68;
      ctx.fillStyle = isAnchorHit ? '#ffffff' : '#040008';
      ctx.beginPath();
      ctx.arc(0, 0, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isAnchorHit ? '#ffffff' : '#00cec9';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const innerPulse = Math.sin(frameCount * 0.2 + i * 2) * 2.2;
      const nebulaGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, coreR * 0.85);
      nebulaGrad.addColorStop(0, '#ffffff');
      nebulaGrad.addColorStop(0.3, '#00cec9');
      nebulaGrad.addColorStop(0.7, '#8e44ad');
      nebulaGrad.addColorStop(1, '#05010a');
      ctx.fillStyle = nebulaGrad;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(2, coreR * 0.72 + innerPulse), 0, Math.PI * 2);
      ctx.fill();

      // Pupila de vácuo
      ctx.fillStyle = '#020005';
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.8, coreR * 0.5 + innerPulse * 0.5, frameCount * 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Arcos de instabilidade quando a vida está baixa
      if (hpRatio < 0.45 || isAnchorHit) {
        const sparkAng = (frameCount * 0.35 + i * 3) % (Math.PI * 2);
        ctx.strokeStyle = '#e84393';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(sparkAng) * (coreR * 0.8), Math.sin(sparkAng) * (coreR * 0.8));
        ctx.lineTo(Math.cos(sparkAng) * (anchorR * 1.45), Math.sin(sparkAng) * (anchorR * 1.45));
        ctx.stroke();
      }

      // 6. Barra de Vida Rúnica Superior
      const barW = 44;
      const barH = 5;
      const barY = -anchorR - 14;

      ctx.fillStyle = 'rgba(6, 4, 12, 0.9)';
      ctx.fillRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);

      const barGrad = ctx.createLinearGradient(-barW / 2, 0, barW / 2, 0);
      barGrad.addColorStop(0, '#00cec9');
      barGrad.addColorStop(1, '#a29bfe');
      ctx.fillStyle = barGrad;
      ctx.fillRect(-barW / 2, barY, barW * hpRatio, barH);

      ctx.strokeStyle = isAnchorHit ? '#ffffff' : 'rgba(0, 206, 201, 0.85)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);

      ctx.fillStyle = '#00cec9';
      ctx.fillRect(-barW / 2 - 3, barY - 2, 2, barH + 4);
      ctx.fillRect(barW / 2 + 1, barY - 2, 2, barH + 4);

      ctx.restore();
    }
  }

  // Gira somente a skin completa; arena, santuários e ataques mantêm coordenadas de mundo.
  const isCyclone = e.actionState === SOVEREIGN_STATES.CYCLONE_CHARGE;
  if (isCyclone) drawCycloneAfterimages(ctx, e, frameCount, edgeCol);
  ctx.save();
  if (isCyclone) ctx.rotate(e.cycloneSpinAngle || 0);
  drawSovereignBody(ctx, e, frameCount, edgeCol);
  ctx.restore();

  // 14. Efeitos Visuais Ativos de Ataques em Execução (Cortes, Meteoros, Implosões, Supernovas)
  drawActiveSovereignAttacks(ctx, e, frameCount);


  // Orbes e Constelações da Supernova da Entropia (Com Telegrafia no Chão para Melee)
  if (e.supernovaOrbs && e.supernovaOrbs.length > 0) {
    const dangerR = e.supernovaDangerRadius || 220;
    const ratio = Math.max(0, Math.min(1, 1 - (e.windupTimer / (e.windupMax || 58))));

    drawSoulslikeAoETelegraph(ctx, 0, 0, dangerR, ratio, '224, 86, 253', frameCount, {
      label: 'SUPERNOVA CÓSMICA',
      tickCount: 18
    });

    ctx.save();
    const orbCount = e.supernovaOrbs.length;
    const orbRot = frameCount * 0.03;
    const orbPts = [];

    for (let o = 0; o < orbCount; o++) {
      const oDef = e.supernovaOrbs[o];
      const oAng = oDef.baseAngle + orbRot;
      const ox = Math.cos(oAng) * oDef.dist;
      const oy = Math.sin(oAng) * oDef.dist;
      orbPts.push({ x: ox, y: oy });
    }

    // Linhas de constelação estelar
    ctx.strokeStyle = 'rgba(224, 86, 253, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let o = 0; o < orbCount; o++) {
      const p1 = orbPts[o];
      const p2 = orbPts[(o + 1) % orbCount];
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();

    // Linhas radiais ao núcleo do Soberano
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let o = 0; o < orbCount; o++) {
      ctx.moveTo(0, 0);
      ctx.lineTo(orbPts[o].x, orbPts[o].y);
    }
    ctx.stroke();

    // Orbes estelares individuais
    for (let o = 0; o < orbCount; o++) {
      const pt = orbPts[o];
      const oPulse = 5 + Math.sin(frameCount * 0.2 + o) * 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = (o % 2 === 0) ? '#00cec9' : '#e84393';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, oPulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 13. Barra de Estabilidade Dimensional
  if ((isWindup || isCasting) && e.staggerGauge > 0) {
    const barW = 54;
    const barH = 5;
    const ratio = Math.min(1, e.staggerGauge / e.maxStaggerGauge);
    ctx.fillStyle = 'rgba(10, 12, 16, 0.85)';
    ctx.fillRect(-barW / 2, -R - 18, barW, barH);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-barW / 2, -R - 18, barW * ratio, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barW / 2, -R - 18, barW, barH);
  }
  }

  // 18. Grande Banner Cinematográfico de Tela (Tema Vermelho, Duração Reduzida em 50% e Responsivo para Telas Verticais)
  if (e.titleTimer > 0) {
    drawCinematicScreenTitle(bannerCtx || ctx, e, frameCount);
  }

}
