import { t as matchText } from '../../../i18n/index.js';
/**
 * src/entities/bosses/supremeReaper/render.js
 * Pipeline de renderização procedural gráfica de alta definição de Thanatos, o Ceifador Supremo.
 * Incorpora Banner Majestoso de Tela Cheia, Intro em 4 Atos, 6 Asas de Serafim da Morte,
 * Manto do Vazio de 4 Camadas, Caveira 3D com Chifres de Carneiro e Foice Monumental Rúnica.
 */

import { dpr, viewW, viewH, bannerCtx } from '../../../main.js';
import { getHudBottom } from '../../../core/responsive.js';
import { player } from '../../player.js';
import { REAPER_STATES, REAPER_CONFIG, REAPER_SKILLS } from './constants.js';
import { drawReaperRanged } from './rangedAttacks.js';
import { drawReaperRegalia } from './skinDetails.js';
import { drawReaperIntroRitual, drawReaperIntroDischarge } from './introEffects.js';

// ============================================================================
// 1. BANNER CINEMATOGRÁFICO DE APRESENTAÇÃO EM TELA CHEIA
// ============================================================================

/**
 * Renderiza o Banner Majestoso de Título de Thanatos no espaço de tela (Screen Space).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e Entidade do chefe.
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
  const bannerH = isVertical ? 62 : (isCompactH ? 58 : 100);

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

  // 1. Fundo Gradiente de Cripta de Obsidiana e Névoa Espectral com Fade Estendido nas Laterais
  const bgGrad = ctx.createLinearGradient(startX, by, endX, by);
  bgGrad.addColorStop(0, 'rgba(2, 5, 9, 0)');
  bgGrad.addColorStop(0.12, 'rgba(4, 10, 16, 0.22)');
  bgGrad.addColorStop(0.28, 'rgba(6, 18, 28, 0.90)');
  bgGrad.addColorStop(0.50, 'rgba(9, 28, 40, 0.98)');
  bgGrad.addColorStop(0.72, 'rgba(6, 18, 28, 0.90)');
  bgGrad.addColorStop(0.88, 'rgba(4, 10, 16, 0.22)');
  bgGrad.addColorStop(1, 'rgba(2, 5, 9, 0)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(startX, by, totalW, bannerH);

  // 2. Frisos de Neon Ciano e Ectoplasma com Taper Suave nas Pontas
  const lineStart = startX + fadeWing * 0.25;
  const lineEnd = endX - fadeWing * 0.25;
  const borderGrad = ctx.createLinearGradient(lineStart, by, lineEnd, by);
  borderGrad.addColorStop(0, 'rgba(0, 206, 201, 0)');
  borderGrad.addColorStop(0.18, 'rgba(0, 206, 201, 0.65)');
  borderGrad.addColorStop(0.35, 'rgba(0, 206, 201, 0.95)');
  borderGrad.addColorStop(0.50, 'rgba(129, 236, 236, 1.0)');
  borderGrad.addColorStop(0.65, 'rgba(0, 206, 201, 0.95)');
  borderGrad.addColorStop(0.82, 'rgba(0, 206, 201, 0.65)');
  borderGrad.addColorStop(1, 'rgba(0, 206, 201, 0)');

  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = isVertical ? 2.0 : 2.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(lineStart, by);
  ctx.lineTo(lineEnd, by);
  ctx.moveTo(lineStart, by + bannerH);
  ctx.lineTo(lineEnd, by + bannerH);
  ctx.stroke();

  // Frisos internos com acabamento dourado antigo e fade nas pontas
  const innerStart = centerX - contentW * 0.44;
  const innerEnd = centerX + contentW * 0.44;
  const innerGrad = ctx.createLinearGradient(innerStart, by, innerEnd, by);
  innerGrad.addColorStop(0, 'rgba(241, 196, 15, 0)');
  innerGrad.addColorStop(0.20, 'rgba(241, 196, 15, 0.40)');
  innerGrad.addColorStop(0.50, 'rgba(255, 234, 167, 0.70)');
  innerGrad.addColorStop(0.80, 'rgba(241, 196, 15, 0.40)');
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

  // Cantoneiras em losango de ferro espectral
  [-contentW * 0.42, contentW * 0.42].forEach(ox => {
    ctx.fillStyle = '#00cec9';
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

  // Ornamento Central Superior: Brasão Alado com Joia de Fogo Fátuo
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.moveTo(centerX, by - 10);
  ctx.lineTo(centerX + 12, by - 1);
  ctx.lineTo(centerX, by + 8);
  ctx.lineTo(centerX - 12, by - 1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#00cec9';
  ctx.beginPath();
  ctx.arc(centerX, by - 1, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(centerX, by - 1, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Asas do Ornamento Superior
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.85)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(centerX - 12, by - 1);
  ctx.lineTo(centerX - 26, by - 6);
  ctx.lineTo(centerX - 18, by + 2);
  ctx.moveTo(centerX + 12, by - 1);
  ctx.lineTo(centerX + 26, by - 6);
  ctx.lineTo(centerX + 18, by + 2);
  ctx.stroke();

  // 3. Tipografia Majestosa
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Sub-alerta superior
  ctx.font = isVertical ? '700 8.5px "Cinzel", monospace' : '800 10.5px "Cinzel", monospace';
  ctx.letterSpacing = isVertical ? '2px' : '4px';
  ctx.fillStyle = 'rgba(129, 236, 236, 0.80)';
  ctx.fillText(matchText('match.canvas.reaperTop'), centerX, by + (isVertical ? 15 : 20));

  // Título Principal
  const titleY = by + (isVertical ? 34 : 50);
  ctx.font = isVertical ? '900 20px "Cinzel", "Times New Roman", serif' : '900 32px "Cinzel", "Times New Roman", serif';
  ctx.fillStyle = 'rgba(0, 206, 201, 0.5)';
  ctx.fillText(matchText('match.canvas.reaper'), centerX + 1, titleY + 1.5);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(matchText('match.canvas.reaper'), centerX, titleY);

  // Subtítulo Épico Inferior
  ctx.font = isVertical ? '600 9px "Cinzel", sans-serif' : '700 12px "Cinzel", sans-serif';
  ctx.letterSpacing = isVertical ? '2px' : '5px';
  ctx.fillStyle = '#81ecec';
  ctx.fillText(matchText('match.canvas.reaperSub'), centerX, by + (isVertical ? 51 : 78));
  ctx.letterSpacing = '0px';

  ctx.restore();
}

// ============================================================================
// 2. INTRODUÇÃO CINEMATOGRÁFICA DE 5 SEGUNDOS EM 4 ATOS
// ============================================================================

/**
 * Renderiza a encenação gráfica em 4 atos da Introdução do Ceifador Supremo.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} e Entidade do chefe.
 * @param {number} frameCount
 */
export function drawReaperSpawnIntro(ctx, e, frameCount) {
  const duration = e.introDuration || REAPER_CONFIG.INTRO_DURATION;
  const progress = Math.max(0, Math.min(1, 1 - e.introTimer / duration));
  drawReaperIntroRitual(ctx, progress);
  drawReaperIntroBody(ctx, e, frameCount);
  drawReaperIntroDischarge(ctx, progress);
}

function drawReaperIntroBody(ctx, e, frameCount) {
  const introMax = e.introDuration || REAPER_CONFIG.INTRO_DURATION;
  const progress = Math.max(0, Math.min(1, 1 - (e.introTimer / introMax)));

  // =========================================================================
  // ATO 1: O FRIO SEPULCRAL & SELO RÚNICO DE ALMAS (0.00 <= progress < 0.25)
  // =========================================================================
  if (progress < 0.25) {
    const act1Prog = progress / 0.25;
    const runeAngle = e.introRuneAngle || (frameCount * 0.03);

    ctx.save();

    // 1. Vinheta Obscura Radial no Solo
    const vignetteR = 40 + act1Prog * 80;
    const vGrad = ctx.createRadialGradient(0, 38, 4, 0, 38, vignetteR * 1.5);
    vGrad.addColorStop(0, 'rgba(2, 6, 12, 0.85)');
    vGrad.addColorStop(0.5, 'rgba(4, 18, 26, 0.60)');
    vGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = vGrad;
    ctx.fillRect(-vignetteR * 1.5, -vignetteR, vignetteR * 3, vignetteR * 2.5);

    // 2. Selo Rúnico de Invocação no Chão (Perspectiva Isométrica)
    ctx.translate(0, 40);
    ctx.scale(1, 0.44);

    const sealR = 35 + act1Prog * 60;

    // Círculo base de névoa de almas
    const sealGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, sealR);
    sealGrad.addColorStop(0, 'rgba(0, 206, 201, 0.85)');
    sealGrad.addColorStop(0.4, 'rgba(6, 28, 38, 0.70)');
    sealGrad.addColorStop(0.85, 'rgba(2, 8, 14, 0.45)');
    sealGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sealGrad;
    ctx.beginPath();
    ctx.arc(0, 0, sealR, 0, Math.PI * 2);
    ctx.fill();

    // Anel externo com traços rúnicos giratórios
    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, sealR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#81ecec';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, sealR * 0.78, 0, Math.PI * 2);
    ctx.stroke();

    // Glifos e Runas ao redor do perímetro
    const glyphCount = 10;
    for (let g = 0; g < glyphCount; g++) {
      const ga = runeAngle + (g * Math.PI * 2 / glyphCount);
      const gx = Math.cos(ga) * (sealR * 0.89);
      const gy = Math.sin(ga) * (sealR * 0.89);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(gx - 2, gy - 2, 4, 4);
    }

    // Estrela Necromântica de 5 Pontas Invertida
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.65)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let p = 0; p < 5; p++) {
      const pa = runeAngle + (p * Math.PI * 4 / 5);
      const px = Math.cos(pa) * (sealR * 0.75);
      const py = Math.sin(pa) * (sealR * 0.75);
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Filamentos em espiral puxando essência vital para o núcleo
    const spiralArms = 4;
    for (let s = 0; s < spiralArms; s++) {
      const sBase = -runeAngle * 2 + (s * Math.PI * 2 / spiralArms);
      ctx.strokeStyle = 'rgba(129, 236, 236, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let step = 0; step < 12; step++) {
        const sr = sealR * (1 - step / 12);
        const sa = sBase + step * 0.28;
        const sx = Math.cos(sa) * sr;
        const sy = Math.sin(sa) * sr;
        if (step === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    ctx.restore();

    // Silhueta fantasmagórica tremeluzindo no vórtice
    ctx.save();
    ctx.globalAlpha = act1Prog * 0.35;
    ctx.fillStyle = '#020509';
    ctx.beginPath();
    ctx.ellipse(0, -6, 20, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    return;
  }

  // =========================================================================
  // ATO 2: A QUEDA DA FOICE MONUMENTAL & DESPERTAR DAS LANTERNAS (0.25 <= progress < 0.50)
  // =========================================================================
  if (progress < 0.50) {
    const act2Norm = (progress - 0.25) / 0.25;

    ctx.save();

    // 1. Selo Rúnico no Chão Pulsando com Alta Energia
    ctx.save();
    ctx.translate(0, 40);
    ctx.scale(1, 0.44);

    const sealR = 95;
    const sealGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, sealR);
    sealGrad.addColorStop(0, 'rgba(0, 206, 201, 0.95)');
    sealGrad.addColorStop(0.45, 'rgba(6, 28, 38, 0.85)');
    sealGrad.addColorStop(0.9, 'rgba(2, 8, 14, 0.5)');
    sealGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sealGrad;
    ctx.beginPath();
    ctx.arc(0, 0, sealR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, sealR, 0, Math.PI * 2);
    ctx.stroke();

    // Se a foice já colidiu com o solo: Fissuras Radiais no Solo
    if (e.introScytheEmbedded || act2Norm >= 0.35) {
      const crackAngles = [0.15, 0.78, 1.45, 2.25, 3.05, 3.85, 4.65, 5.55];
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      for (let ca of crackAngles) {
        const cLen = 45 + Math.sin(ca * 5) * 25;
        const cMid = cLen * 0.55;
        const cMidJitter = (Math.sin(ca * 12) * 8);
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(18 + Math.cos(ca) * cMid + cMidJitter, Math.sin(ca) * cMid);
        ctx.lineTo(18 + Math.cos(ca) * cLen, Math.sin(ca) * cLen);
        ctx.stroke();
      }
      ctx.strokeStyle = '#00cec9';
      ctx.lineWidth = 4.5;
      for (let ca of crackAngles) {
        const cLen = 45 + Math.sin(ca * 5) * 25;
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(18 + Math.cos(ca) * cLen, Math.sin(ca) * cLen);
        ctx.stroke();
      }
    }

    ctx.restore();

    // 2. Coluna Vertical de Energia Espectral Ascendente
    const colWidth = 36 + Math.sin(frameCount * 0.2) * 6;
    const colGrad = ctx.createLinearGradient(-colWidth, 0, colWidth, 0);
    colGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    colGrad.addColorStop(0.3, 'rgba(6, 28, 38, 0.75)');
    colGrad.addColorStop(0.5, 'rgba(0, 206, 201, 0.9)');
    colGrad.addColorStop(0.7, 'rgba(6, 28, 38, 0.75)');
    colGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = colGrad;
    ctx.fillRect(-colWidth, -160, colWidth * 2, 200);

    // 3. Correntes de Almas Conectando as Lanternas em Ascensão
    if (e.lanterns) {
      for (let l of e.lanterns) {
        const lx = Math.cos(l.angle) * (l.dist * act2Norm);
        const ly = Math.sin(l.angle) * (l.dist * 0.48 * act2Norm);

        ctx.strokeStyle = 'rgba(0, 206, 201, 0.75)';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, 30);
        ctx.lineTo(lx, ly);
        ctx.stroke();
        ctx.setLineDash([]);

        // Lanterna flutuando na extremidade
        ctx.save();
        ctx.translate(lx, ly);
        ctx.fillStyle = '#0d1821';
        ctx.fillRect(-6, -8, 12, 16);
        ctx.strokeStyle = '#00cec9';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(-6, -8, 12, 16);
        ctx.fillStyle = '#81ecec';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 4. Foice Monumental Despencando ou Cravada no Solo
    const scytheY = e.introScytheY !== undefined ? e.introScytheY : (-600 * Math.max(0, 1 - act2Norm * 2.8));
    ctx.save();
    ctx.translate(18 - 36, Math.min(22, scytheY) + 10);
    ctx.rotate(0.24); // Levemente inclinada ao penetrar a terra
    const fakeBoss = { scytheAngle: 0, scytheGlow: 1.0, crankAngle: 0 };
    ctx.scale(REAPER_CONFIG.BODY_SCALE, REAPER_CONFIG.BODY_SCALE);
    drawOrnateScythe(ctx, fakeBoss, 0, false, false, 0, frameCount);
    ctx.restore();

    // 5. Silhueta do Ceifador Condensando no Cabo da Foice
    ctx.globalAlpha = 0.35 + act2Norm * 0.55;
    ctx.fillStyle = '#020509';
    ctx.beginPath();
    ctx.ellipse(0, -10, 26, 46, 0, 0, Math.PI * 2);
    ctx.fill();

    // Olhos de Fogo Fátuo Abrindo e Cortando as Trevas
    if (act2Norm > 0.35) {
      const eyeFlare = Math.sin(frameCount * 0.3) * 3;
      ctx.fillStyle = '#00cec9';
      ctx.beginPath();
      ctx.ellipse(-6, -26, 4 + eyeFlare * 0.5, 2.5, 0.2, 0, Math.PI * 2);
      ctx.ellipse(6, -26, 4 + eyeFlare * 0.5, 2.5, -0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-7, -27, 2, 2);
      ctx.fillRect(5, -27, 2, 2);

      ctx.strokeStyle = 'rgba(129, 236, 236, 0.85)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-6, -26);
      ctx.lineTo(-24 - eyeFlare * 2, -30);
      ctx.moveTo(6, -26);
      ctx.lineTo(24 + eyeFlare * 2, -30);
      ctx.stroke();
    }

    ctx.restore();
    return;
  }

  // =========================================================================
  // ATO 3: DESDOBRAR DO SERAFIM DA MORTE & BANNER IMPERIAL (0.50 <= progress < 0.75)
  // =========================================================================
  if (progress < 0.75) {
    const act3Norm = (progress - 0.50) / 0.25;
    const wingSpan = 0.35 + act3Norm * 1.05; // 0.35 a 1.4x
    const flap = Math.sin(frameCount * 0.08) * 0.12 * (1 - act3Norm * 0.3);
    const bob = Math.sin(frameCount * 0.08) * 4;

    ctx.save();

    // Névoa condensando ao redor
    const mistAlpha = (1 - act3Norm) * 0.55;
    ctx.fillStyle = `rgba(3, 10, 18, ${mistAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 75, 95, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.scale(REAPER_CONFIG.BODY_SCALE, REAPER_CONFIG.BODY_SCALE);
    drawReaperShadow(ctx, e, bob, false, 0);
    drawSpectralWings(ctx, e, bob, false, false, flap, wingSpan);
    drawEclipseHalo(ctx, e, bob, frameCount, false, false, false, 0);
    drawDorsalSpineAndBackRibs(ctx, bob, frameCount, false, false, 0);
    drawReaperRobe(ctx, e, bob, frameCount, false, false, 0, 0);
    drawSoulNexusCore(ctx, bob, frameCount, false, false, 0, false);
    drawFrontRibcageArmor(ctx, bob, frameCount, false, false, 0);
    drawReaperArmsAndGauntlets(ctx, e, bob, frameCount, false, false, 0.4, 0);
    drawMaskAndEyes(ctx, e, bob, frameCount, false, false, 0);
    drawOrnateScythe(ctx, e, bob, false, false, 0, frameCount);
    drawReaperRegalia(ctx, e, bob, frameCount, false, false, false);
    ctx.restore();
    drawGothicLanterns(ctx, e, bob, frameCount, false);

    ctx.restore();
    return;
  }

  // =========================================================================
  // ATO 4: GOLPE DO JULGAMENTO & LIMPEZA DA NÉVOA (0.75 <= progress <= 1.00)
  // =========================================================================
  const act4Norm = (progress - 0.75) / 0.25;
  const wingSpan = 1.45;
  const flap = Math.sin(frameCount * 0.08) * 0.08;
  const bob = Math.sin(frameCount * 0.08) * 4;

  ctx.save();

  // 1. Névoa Sendo Soprada e Dissipada pela Força do Golpe
  const mistRadius = 80 + act4Norm * 380;
  const mistAlpha = Math.max(0, (1 - act4Norm) * 0.65);
  ctx.strokeStyle = `rgba(0, 206, 201, ${mistAlpha})`;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, 0, mistRadius, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Rastro de Corte em 360 Graus da Lâmina Monumental
  const sweepAngle = Math.PI * 2 * act4Norm;
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.85)';
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.arc(0, 0, 210, -Math.PI * 0.5, -Math.PI * 0.5 + sweepAngle);
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.0;
  ctx.stroke();
  ctx.restore();

  // 3. Renderização Plena de Thanatos em Prontidão de Batalha
  ctx.save();
  ctx.scale(REAPER_CONFIG.BODY_SCALE, REAPER_CONFIG.BODY_SCALE);
  drawReaperShadow(ctx, e, bob, false, 0);
  drawSpectralWings(ctx, e, bob, false, false, flap, wingSpan);
  drawEclipseHalo(ctx, e, bob, frameCount, false, false, false, 0);
  drawDorsalSpineAndBackRibs(ctx, bob, frameCount, false, false, 0);
  drawReaperRobe(ctx, e, bob, frameCount, false, false, 0, 0);
  drawSoulNexusCore(ctx, bob, frameCount, false, false, 0, false);
  drawFrontRibcageArmor(ctx, bob, frameCount, false, false, 0);
  drawReaperArmsAndGauntlets(ctx, e, bob, frameCount, false, false, 0.4, 0);
  drawMaskAndEyes(ctx, e, bob, frameCount, false, false, 0);
  drawOrnateScythe(ctx, e, bob, false, false, 0, frameCount);
  drawReaperRegalia(ctx, e, bob, frameCount, false, false, false);
  ctx.restore();
  drawGothicLanterns(ctx, e, bob, frameCount, false);

  ctx.restore();
}

// ============================================================================
// 3. COMPONENTES VISUAIS PROCEDURAIS DE ALTA DEFINIÇÃO
// ============================================================================

/**
 * Desenha a sombra projetada no chão sob o Ceifador.
 */
export function drawReaperShadow(ctx, e, bob, isVuln, collapseProg = 0) {
  const shadowY = 56 + (isVuln ? 12 : 0) + collapseProg * 6;
  const shadowR = (e.radius * 0.90) - (isVuln ? 0 : bob * 0.35) + collapseProg * 14;

  const grad = ctx.createRadialGradient(0, shadowY, 4, 0, shadowY, shadowR);
  grad.addColorStop(0, 'rgba(2, 5, 8, 0.75)');
  grad.addColorStop(0.65, 'rgba(6, 14, 20, 0.30)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, shadowY, shadowR, shadowR * (0.35 + collapseProg * 0.1), 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Renderiza o rastro fantasma espectral deixado pela movimentação do Ceifador.
 */
export function drawGhostTrail(ctx, e) {
  if (!e.ghostTrail || !e.ghostTrail.length) return;
  for (let t of e.ghostTrail) {
    if (t.alpha <= 0) continue;
    ctx.save();
    ctx.globalAlpha = t.alpha;
    ctx.fillStyle = t.enraged ? 'rgba(255, 71, 87, 0.35)' : 'rgba(0, 206, 201, 0.28)';
    ctx.beginPath();
    ctx.ellipse(t.x - e.x, t.y - e.y, e.radius * 0.75 * REAPER_CONFIG.BODY_SCALE, e.radius * 0.95 * REAPER_CONFIG.BODY_SCALE, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Renderiza réplicas translúcidas (pós-imagens) durante o Phantom Blink.
 */
export function drawAfterImages(ctx, e) {
  if (!e.afterImages || e.afterImages.length === 0) return;
  for (let ai of e.afterImages) {
    const alpha = (ai.life / ai.maxLife) * (ai.alpha || 0.6);
    if (alpha <= 0) continue;

    ctx.save();
    ctx.translate(ai.x - e.x, ai.y - e.y);
    ctx.scale((ai.facing || 1) * REAPER_CONFIG.BODY_SCALE, REAPER_CONFIG.BODY_SCALE);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = 'rgba(0, 206, 201, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, -10, e.radius * 0.8, e.radius * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Foice espectral na réplica
    ctx.strokeStyle = '#81ecec';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(28, -25, 45, -0.2, Math.PI * 0.7);
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Renderiza os rastros contínuos de fogo fátuo emitidos pelos olhos de Thanatos.
 */
export function drawEyeTrails(ctx, e) {
  if (!e.eyeTrails || e.eyeTrails.length < 2) return;

  ctx.save();
  for (let i = 0; i < e.eyeTrails.length; i++) {
    const pt = e.eyeTrails[i];
    const alpha = (pt.life / pt.maxLife) * 0.75;
    const size = Math.max(1, (pt.life / pt.maxLife) * 4);

    ctx.fillStyle = pt.isEnraged ? `rgba(255, 71, 87, ${alpha})` : `rgba(0, 206, 201, ${alpha})`;
    const ox = pt.x - e.x;
    const oy = pt.y - e.y;

    ctx.beginPath();
    ctx.arc(ox - 5 * pt.facing * REAPER_CONFIG.BODY_SCALE, oy, size, 0, Math.PI * 2);
    ctx.arc(ox + 5 * pt.facing * REAPER_CONFIG.BODY_SCALE, oy, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Desenha o círculo rúnico místico no solo durante o Colapso Espiritual.
 */
export function drawRecoveryGliph(ctx, e, frameCount) {
  const pulse = Math.sin(frameCount * 0.18) * 3.5;
  const R = e.radius * 1.25 + pulse;

  ctx.strokeStyle = '#81ecec';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(0, 54, R, 24, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(0, 206, 201, 0.12)';
  ctx.fill();

  const runeCount = 8;
  const rot = frameCount * 0.02;
  for (let k = 0; k < runeCount; k++) {
    const a = rot + (k * Math.PI * 2 / runeCount);
    const rx = Math.cos(a) * R;
    const ry = 54 + Math.sin(a) * 24;
    ctx.beginPath();
    ctx.moveTo(rx - 3, ry - 3);
    ctx.lineTo(rx + 3, ry + 3);
    ctx.stroke();
  }
}

/**
 * Desenha as 6 Asas de Serafim da Morte diferenciadas em 3 pares anatômicos únicos:
 * Par 1 (Superior): Asas do Julgamento Celestial (Penas metálicas afiadas em navalha)
 * Par 2 (Médio): Asas dos Ossos Fúnebres & Runas (Falanges articuladas e nós com glifos)
 * Par 3 (Inferior): Asas do Vácuo e Fumaça (Caudas de fumaça cósmica ondulante)
 */
export function drawSpectralWings(ctx, e, bob, isVuln, isEnraged, flap = 0, customSpan = null) {
  const baseSpan = customSpan !== null ? customSpan : (e.wingSpan || 0.60);
  const isP3 = e.isPhase3 || false;
  const boneCol = isVuln ? '#636e72' : (isP3 ? '#ff7675' : (isEnraged ? '#ff6b81' : '#81ecec'));
  const boneShade = isVuln ? '#2d3436' : (isP3 ? '#3a070e' : (isEnraged ? '#5a0d14' : '#0f323d'));
  const ectoFill = isVuln 
    ? 'rgba(45, 52, 54, 0.35)' 
    : (isP3 ? 'rgba(255, 71, 87, 0.38)' : (isEnraged ? 'rgba(255, 71, 87, 0.28)' : 'rgba(0, 206, 201, 0.25)'));
  const ectoGlow = isVuln
    ? 'rgba(99, 110, 114, 0.2)'
    : (isP3 ? 'rgba(255, 118, 117, 0.55)' : (isEnraged ? 'rgba(255, 107, 129, 0.4)' : 'rgba(129, 236, 236, 0.4)'));

  ctx.save();
  ctx.translate(0, -18 + bob);

  const wingPairs = [
    { type: 'JUDGEMENT', spanScale: isP3 ? 1.45 : (isEnraged ? 1.25 : 1.05), angleOffset: -0.34 + flap, originY: -10, length: 112 },
    { type: 'BONE_RUNES', spanScale: isP3 ? 1.15 : (isEnraged ? 1.00 : 0.85), angleOffset: 0.06 + flap * 0.7, originY: 6, length: 90 },
    { type: 'VOID_MIST', spanScale: isP3 ? 0.95 : (isEnraged ? 0.80 : 0.65), angleOffset: 0.44 - flap * 0.4, originY: 22, length: 75 }
  ];

  for (let side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);

    for (let pair of wingPairs) {
      ctx.save();
      ctx.translate(10, pair.originY);

      if (isVuln) {
        ctx.rotate(0.68); // Asas caídas em prostração
      } else {
        ctx.rotate(pair.angleOffset * baseSpan);
      }

      const wLen = pair.length * baseSpan * pair.spanScale;

      if (pair.type === 'JUDGEMENT') {
        // PAR 1: Penas Metálicas Afiadas em Lâmina
        ctx.fillStyle = ectoFill;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(wLen * 0.45, -wLen * 0.36, wLen * 0.92, -wLen * 0.24);
        ctx.lineTo(wLen * 1.04, -wLen * 0.08);
        ctx.lineTo(wLen * 0.84, wLen * 0.22);
        ctx.lineTo(wLen * 0.54, wLen * 0.34);
        ctx.lineTo(wLen * 0.25, wLen * 0.24);
        ctx.closePath();
        ctx.fill();

        // 5 Penas Astrais rígidas com formato de lâmina chanfrada
        const featherTiers = [
          { rx: 1.04, ry: -0.08, w: 0.82, h: -0.22 },
          { rx: 0.92, ry: 0.08, w: 0.72, h: -0.12 },
          { rx: 0.82, ry: 0.22, w: 0.60, h: -0.04 },
          { rx: 0.68, ry: 0.30, w: 0.48, h: 0.04 },
          { rx: 0.52, ry: 0.35, w: 0.32, h: 0.12 }
        ];

        for (let ft of featherTiers) {
          const fx = wLen * ft.rx;
          const fy = wLen * ft.ry;
          const rootX = wLen * ft.w;
          const rootY = wLen * ft.h;

          ctx.strokeStyle = ectoGlow;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(rootX, rootY);
          ctx.lineTo(fx, fy);
          ctx.lineTo(rootX - 6, rootY + 10);
          ctx.stroke();

          // Espigão diamantado na ponta da pena
          ctx.fillStyle = isP3 ? '#ffffff' : (isEnraged ? '#ff6b81' : '#ffffff');
          ctx.fillRect(fx - 1.5, fy - 1.5, 3, 3);
        }

        // Espinha Óssea Principal Arqueada
        ctx.strokeStyle = boneShade;
        ctx.lineWidth = 4.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(wLen * 0.42, -wLen * 0.38, wLen * 0.94, -wLen * 0.22);
        ctx.stroke();

        ctx.strokeStyle = boneCol;
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Garra afiada na articulação da asa
        ctx.fillStyle = boneCol;
        ctx.beginPath();
        ctx.moveTo(wLen * 0.42, -wLen * 0.38);
        ctx.lineTo(wLen * 0.50, -wLen * 0.52);
        ctx.lineTo(wLen * 0.36, -wLen * 0.32);
        ctx.closePath();
        ctx.fill();

      } else if (pair.type === 'BONE_RUNES') {
        // PAR 2: Falanges Esqueléticas Articuladas & Glifos Rúnicos
        ctx.fillStyle = ectoFill;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(wLen * 0.45, -wLen * 0.22, wLen * 0.88, -wLen * 0.12);
        ctx.lineTo(wLen * 0.98, 0.05);
        ctx.lineTo(wLen * 0.72, wLen * 0.25);
        ctx.lineTo(wLen * 0.35, wLen * 0.28);
        ctx.closePath();
        ctx.fill();

        // Falange óssea central
        ctx.strokeStyle = boneShade;
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(wLen * 0.45, -wLen * 0.14);
        ctx.lineTo(wLen * 0.90, -wLen * 0.08);
        ctx.stroke();

        ctx.strokeStyle = boneCol;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // 3 Nós articulares com glifos gravados
        const nodes = [0.25, 0.55, 0.85];
        for (let n of nodes) {
          const nx = wLen * n;
          const ny = -wLen * (n * 0.12);
          ctx.fillStyle = boneShade;
          ctx.beginPath();
          ctx.arc(nx, ny, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = boneCol;
          ctx.beginPath();
          ctx.arc(nx, ny, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Falanges secundárias
        ctx.strokeStyle = ectoGlow;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(wLen * 0.45, -wLen * 0.14);
        ctx.lineTo(wLen * 0.72, wLen * 0.25);
        ctx.moveTo(wLen * 0.65, -wLen * 0.10);
        ctx.lineTo(wLen * 0.98, 0.05);
        ctx.stroke();

      } else {
        // PAR 3: Caudas de Fumaça Cósmica e Vácuo
        const smokeTime = (e.clothWavePhase || 0) * 2;
        const wave1 = Math.sin(smokeTime + pair.originY) * 6;
        const wave2 = Math.cos(smokeTime * 1.4) * 5;

        ctx.fillStyle = ectoFill;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(wLen * 0.35 + wave1, wLen * 0.15, wLen * 0.70 + wave2, wLen * 0.38);
        ctx.quadraticCurveTo(wLen * 0.45, wLen * 0.50, 0, wLen * 0.30);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = ectoGlow;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Feixes de fumaça etérea
        ctx.strokeStyle = boneCol;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(wLen * 0.30, wLen * 0.20, wLen * 0.65 + wave2, wLen * 0.36);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Desenha o manto de seda do vazio com 5 camadas volumétricas, mangas góticas largas,
 * estolas do julgamento com runas douradas e almas assombradas ondulando na seda.
 */
export function drawReaperRobe(ctx, e, bob, frameCount, isVuln, isEnraged, tilt = 0, collapseProg = 0) {
  const t = frameCount * 0.07;
  const drape1 = (Math.sin(t) * 9 + Math.cos(t * 1.8) * 4) + (tilt * 18);
  const drape2 = (Math.cos(t * 1.2) * 8 + Math.sin(t * 2.3) * 3) + (tilt * 18);
  const drapeMid = Math.sin(t * 1.5 + 1.2) * 6;

  const isP3 = e.isPhase3 || false;
  const voidBlack  = isVuln ? '#13191d' : (isP3 ? '#020005' : (isEnraged ? '#180306' : '#020509'));
  const robeDeep   = isVuln ? '#1e272e' : (isP3 ? '#1a040b' : (isEnraged ? '#2c080d' : '#061019'));
  const robeInner  = isVuln ? '#2c3e50' : (isP3 ? '#330814' : (isEnraged ? '#4a0e16' : '#0a1e2a'));
  const soulCyan   = isVuln ? '#636e72' : (isP3 ? '#ff7675' : (isEnraged ? '#ff4757' : '#00cec9'));
  const soulLight  = isVuln ? '#b2bec3' : (isP3 ? '#ffffff' : (isEnraged ? '#ff6b81' : '#81ecec'));
  const goldTrim   = isEnraged ? '#ff7675' : '#f39c12';

  const spread = collapseProg * 16;
  const yOffset = collapseProg * 12;

  // Camada 1: Forro Interior de Almas (Undercloak Ethereal Glow com Almas Aprisionadas)
  ctx.fillStyle = robeInner;
  ctx.beginPath();
  ctx.moveTo(0, -58 + bob);
  ctx.quadraticCurveTo(-54 - spread, -10 + bob, -44 - spread + drape1, 52 + bob + yOffset);
  ctx.quadraticCurveTo(0, 38 + bob, 44 + spread + drape2, 52 + bob + yOffset);
  ctx.quadraticCurveTo(54 + spread, -10 + bob, 0, -58 + bob);
  ctx.closePath();
  ctx.fill();

  // Efeito de Almas Aprisionadas no Tecido (Soul Imprints suaves)
  if (!isVuln) {
    const wavePhase = e.clothWavePhase || 0;
    ctx.save();
    ctx.strokeStyle = isEnraged ? 'rgba(255, 107, 129, 0.22)' : 'rgba(129, 236, 236, 0.20)';
    ctx.lineWidth = 1.4;
    for (let w = 0; w < 3; w++) {
      const wProg = ((wavePhase + w * 0.33) % 1);
      const wy = -20 + wProg * 65 + bob + yOffset * 0.5;
      const wx = Math.sin(wProg * Math.PI * 2) * (20 + spread * 0.5);
      ctx.beginPath();
      ctx.arc(wx, wy, 4.5 * (1 - wProg * 0.3), 0, Math.PI);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Camada 2: Manto Principal de Seda do Vazio (Outer Void Shroud)
  ctx.fillStyle = voidBlack;
  ctx.beginPath();
  ctx.moveTo(0, -54 + bob);
  ctx.quadraticCurveTo(-50 - spread, -12 + bob, -38 - spread + drape1 * 0.8, 48 + bob + yOffset);
  ctx.lineTo(-20 + drapeMid, 45 + bob + yOffset);
  ctx.lineTo(-6, 50 + bob + yOffset);
  ctx.lineTo(6, 47 + bob + yOffset);
  ctx.lineTo(20 + drapeMid, 46 + bob + yOffset);
  ctx.lineTo(38 + spread + drape2 * 0.8, 48 + bob + yOffset);
  ctx.quadraticCurveTo(50 + spread, -12 + bob, 0, -54 + bob);
  ctx.closePath();
  ctx.fill();

  // Camada 3: Mangas Góticas Flutuantes dos Ombros
  // Manga Esquerda
  ctx.fillStyle = robeDeep;
  ctx.beginPath();
  ctx.moveTo(-18, -26 + bob);
  ctx.quadraticCurveTo(-34, -10 + bob, -38 + drape1 * 0.4, 20 + bob + yOffset * 0.6);
  ctx.lineTo(-26 + drape1 * 0.3, 24 + bob + yOffset * 0.6);
  ctx.quadraticCurveTo(-22, -6 + bob, -14, -20 + bob);
  ctx.closePath();
  ctx.fill();

  // Manga Direita
  ctx.beginPath();
  ctx.moveTo(18, -26 + bob);
  ctx.quadraticCurveTo(34, -10 + bob, 38 + drape2 * 0.4, 20 + bob + yOffset * 0.6);
  ctx.lineTo(26 + drape2 * 0.3, 24 + bob + yOffset * 0.6);
  ctx.quadraticCurveTo(22, -6 + bob, 14, -20 + bob);
  ctx.closePath();
  ctx.fill();

  // Camada 4: Estola Central Sacerdotal com Faixas do Julgamento (Stoles of Judgement)
  ctx.fillStyle = robeDeep;
  ctx.beginPath();
  ctx.moveTo(0, -42 + bob);
  ctx.quadraticCurveTo(-26, 0 + bob, -16 + drapeMid, 44 + bob + yOffset);
  ctx.lineTo(16 + drapeMid, 44 + bob + yOffset);
  ctx.quadraticCurveTo(26, 0 + bob, 0, -42 + bob);
  ctx.closePath();
  ctx.fill();

  // Faixas de Pergaminho do Juízo (Stoles de Ouro com Runas)
  for (let s of [-1, 1]) {
    const sx = s * 8 + drapeMid * 0.5;
    ctx.strokeStyle = goldTrim;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(s * 7, -36 + bob);
    ctx.lineTo(sx, 42 + bob + yOffset);
    ctx.stroke();

    // Glifos e runas douradas cravadas ao longo de cada faixa
    for (let r = 0; r < 4; r++) {
      const ry = -24 + r * 16 + bob + yOffset * 0.6;
      ctx.fillStyle = goldTrim;
      ctx.fillRect(sx - 1.5, ry - 1.5, 3, 3);
    }
  }

  // Camada 5: Borda Rúnica Luminosa na Barra do Manto
  ctx.strokeStyle = soulCyan;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-38 - spread + drape1 * 0.8, 48 + bob + yOffset);
  ctx.quadraticCurveTo(-18 + drapeMid, 42 + bob + yOffset, 0, 46 + bob + yOffset);
  ctx.quadraticCurveTo(18 + drapeMid, 42 + bob + yOffset, 38 + spread + drape2 * 0.8, 48 + bob + yOffset);
  ctx.stroke();

  // Efeito Contínuo de Almas / Brasas Ascendendo da Barra do Manto
  if (!isVuln && Math.floor(frameCount) % 3 === 0) {
    const smokeX = (Math.random() - 0.5) * (70 + spread);
    const smokeY = 46 + bob + yOffset + Math.random() * 6;
    ctx.fillStyle = Math.random() < 0.6 ? soulCyan : soulLight;
    ctx.globalAlpha = 0.50;
    ctx.fillRect(smokeX, smokeY, 2.5, 2.5);
    ctx.globalAlpha = 1.0;
  }
}

/**
 * Desenha a coluna vertebral dorsal e as costelas traseiras (Passagem 1 - atrás do núcleo).
 */
export function drawDorsalSpineAndBackRibs(ctx, bob, frameCount, isVuln, isEnraged, collapseProg = 0) {
  const boneShade = isVuln ? '#2d3436' : (isEnraged ? '#3a070e' : '#0c1921');

  ctx.save();
  ctx.strokeStyle = boneShade;
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';

  // Coluna dorsal posterior
  ctx.beginPath();
  ctx.moveTo(0, -22 + bob + collapseProg * 8);
  ctx.lineTo(0, 8 + bob + collapseProg * 8);
  ctx.stroke();

  // 4 Pares de Costelas Traseiras na Penumbra
  for (let r = 0; r < 4; r++) {
    const ry = -20 + r * 6.5 + bob + collapseProg * 8;
    const rw = 16 - r * 2.2;
    ctx.beginPath();
    ctx.arc(0, ry + 2, rw, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Desenha o Coração das Almas (Soul Nexus Core) com micro-almas espirais e plasma.
 */
export function drawSoulNexusCore(ctx, bob, frameCount, isVuln, isEnraged, collapseProg = 0, isPhase3 = false) {
  const coreY = -12 + bob + collapseProg * 8;
  const pulse = Math.sin(frameCount * (isPhase3 ? 0.32 : (isEnraged ? 0.24 : 0.14))) * 3.5;
  const coreR = Math.max(6, 16 + pulse);

  const soulCyan  = isVuln ? '#636e72' : (isPhase3 ? '#ff7675' : (isEnraged ? '#ff4757' : '#00cec9'));
  const soulGlow  = isVuln ? '#7f8c8d' : (isPhase3 ? '#ffffff' : (isEnraged ? '#ff6b81' : '#81ecec'));

  // 1. Núcleo das Almas (Soul Nexus)
  const coreGrad = ctx.createRadialGradient(0, coreY, 2, 0, coreY, coreR);
  if (isVuln) {
    coreGrad.addColorStop(0, '#95a5a6');
    coreGrad.addColorStop(0.6, '#34495e');
    coreGrad.addColorStop(1, 'rgba(44, 62, 80, 0)');
  } else if (isPhase3) {
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.35, '#ff7675');
    coreGrad.addColorStop(0.75, '#ff4757');
    coreGrad.addColorStop(1, 'rgba(142, 68, 173, 0)');
  } else if (isEnraged) {
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.35, '#ff6b81');
    coreGrad.addColorStop(0.75, '#ff4757');
    coreGrad.addColorStop(1, 'rgba(192, 57, 43, 0)');
  } else {
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.35, soulGlow);
    coreGrad.addColorStop(0.75, soulCyan);
    coreGrad.addColorStop(1, 'rgba(0, 206, 201, 0)');
  }

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, coreY, coreR, 0, Math.PI * 2);
  ctx.fill();

  // Micro-Vórtices de Almas Orbitais no Interior do Núcleo
  if (!isVuln) {
    for (let p = 0; p < 3; p++) {
      const pAng = frameCount * 0.08 + p * (Math.PI * 2 / 3);
      const pDist = coreR * 0.72;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.cos(pAng) * pDist - 1.5, coreY + Math.sin(pAng) * (pDist * 0.5) - 1.5, 3, 3);
    }
  }
}

/**
 * Desenha as costelas frontais 3D em marfim que abraçam o núcleo pela frente (Passagem 2).
 */
export function drawFrontRibcageArmor(ctx, bob, frameCount, isVuln, isEnraged, collapseProg = 0) {
  const boneCol   = isVuln ? '#576574' : (isEnraged ? '#f8d7da' : '#e6f2f2');
  const boneBevel = isVuln ? '#7f8c8d' : '#ffffff';

  ctx.save();
  ctx.lineCap = 'round';

  // 4 Pares de Costelas Frontais Arqueadas abraçando o núcleo
  for (let r = 0; r < 4; r++) {
    const ry = -20 + r * 6.5 + bob + collapseProg * 8;
    const rw = 18 - r * 2.5;

    // Chanfro especular superior da costela
    ctx.strokeStyle = boneBevel;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(0, ry - 0.6, rw, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();

    // Corpo de marfim da costela
    ctx.strokeStyle = boneCol;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, ry, rw, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();
  }

  // Esterno e ponte central
  ctx.strokeStyle = boneCol;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(0, -22 + bob + collapseProg * 8);
  ctx.lineTo(0, 0 + bob + collapseProg * 8);
  ctx.stroke();

  ctx.restore();
}

/**
 * Função compatível retroativa que invoca as 3 etapas da caixa torácica e núcleo.
 */
export function drawRibcageAndCore(ctx, bob, frameCount, isVuln, isEnraged, collapseProg = 0) {
  drawDorsalSpineAndBackRibs(ctx, bob, frameCount, isVuln, isEnraged, collapseProg);
  drawSoulNexusCore(ctx, bob, frameCount, isVuln, isEnraged, collapseProg, false);
  drawFrontRibcageArmor(ctx, bob, frameCount, isVuln, isEnraged, collapseProg);
}

/**
 * Desenha a Coroa do Eclipse Astral (Auréola com Astrolábio Dourado e Eclipse Solar).
 */
export function drawEclipseHalo(ctx, e, bob, frameCount, isVuln, isEnraged, isPhase3, collapseProg = 0) {
  const haloY = -64 + bob + collapseProg * 10;
  const haloR = 26;
  const hAngle = e.haloAngle || (frameCount * 0.02);

  ctx.save();
  ctx.translate(0, haloY);
  ctx.scale(1, 0.44); // Perspectiva elíptica inclinada

  if (e.phaseCinematic) {
    const morph = e.phaseCinematic.morphProgress || 0;
    const haloScale = 0.35 + 0.65 * morph;
    ctx.scale(haloScale, haloScale);
    ctx.globalAlpha *= Math.min(1.0, morph * 1.3);
  }

  if (isPhase3) {
    // FASE 3: Auréola Estilhaçada em 4 Fragmentos Orbitais de Plasma
    const shards = 4;
    for (let s = 0; s < shards; s++) {
      const sa = hAngle * 2.2 + (s * Math.PI * 2 / shards);
      ctx.save();
      ctx.rotate(sa);
      ctx.strokeStyle = '#ff7675';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(0, 0, haloR * 1.15, -0.3, 0.3);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      const sx = Math.cos(0.3) * (haloR * 1.15);
      const sy = Math.sin(0.3) * (haloR * 1.15);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
      ctx.restore();
    }
  } else {
    // FASES 1 E 2: Anel Astral de Astrolábio Dourado e Eclipse
    // 1. Corona do Eclipse (Halo de Luz Externa)
    const coronaGrad = ctx.createRadialGradient(0, 0, haloR * 0.7, 0, 0, haloR * 1.5);
    coronaGrad.addColorStop(0, isEnraged ? 'rgba(255, 71, 87, 0.65)' : 'rgba(0, 206, 201, 0.55)');
    coronaGrad.addColorStop(0.5, isEnraged ? 'rgba(255, 107, 129, 0.30)' : 'rgba(129, 236, 236, 0.25)');
    coronaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coronaGrad;
    ctx.beginPath();
    ctx.arc(0, 0, haloR * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 2. Anel de Ouro Astral com Entalhes
    ctx.strokeStyle = isEnraged ? '#ff4757' : '#f39c12';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = isEnraged ? '#ff6b81' : '#ffeaa7';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(0, 0, haloR - 3.5, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Glifos Cuneiformes Orbitando no Aro
    const glyphCount = 8;
    for (let g = 0; g < glyphCount; g++) {
      const ga = hAngle + (g * Math.PI * 2 / glyphCount);
      const gx = Math.cos(ga) * haloR;
      const gy = Math.sin(ga) * haloR;
      ctx.fillStyle = isEnraged ? '#ffffff' : '#00cec9';
      ctx.fillRect(gx - 1.5, gy - 1.5, 3, 3);
    }

    // 4. Disco Central de Obsidiana (Eclipse Solar da Morte)
    ctx.fillStyle = '#020509';
    ctx.beginPath();
    ctx.arc(0, 0, haloR * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Raios Cardinais em Cruz
    ctx.strokeStyle = isEnraged ? 'rgba(255, 107, 129, 0.85)' : 'rgba(241, 196, 15, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -haloR * 1.35);
    ctx.lineTo(0, haloR * 1.35);
    ctx.moveTo(-haloR * 1.35, 0);
    ctx.lineTo(haloR * 1.35, 0);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Desenha os braços esqueléticos e manoplas de placas góticas que sustentam a Foice Monumental.
 */
export function drawReaperArmsAndGauntlets(ctx, e, bob, frameCount, isVuln, isEnraged, scytheAngle, collapseProg = 0) {
  const metalPlates = '#222d36';
  const trimColor = isEnraged ? '#ff4757' : '#00cec9';
  const boneWhite = isEnraged ? '#f1dcd6' : '#e6f2f2';

  ctx.save();

  // Braço Direito: Do ombro direito até a junção superior da foice
  const rShoulderX = 16;
  const rShoulderY = -24 + bob + collapseProg * 10;
  const rHandX = 36;
  const rHandY = -18 + bob + collapseProg * 14;

  // Manga de seda sobre o braço direito
  ctx.strokeStyle = '#061019';
  ctx.lineWidth = 7.0;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(rShoulderX, rShoulderY);
  ctx.lineTo(rShoulderX + 12, rShoulderY + 8);
  ctx.lineTo(rHandX - 4, rHandY);
  ctx.stroke();

  // Manopla de Placas Góticas de Ferro Negro no punho direito
  ctx.fillStyle = metalPlates;
  ctx.fillRect(rHandX - 7, rHandY - 5, 8, 10);
  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(rHandX - 7, rHandY - 5, 8, 10);

  // Garras ósseas segurando a haste da foice
  ctx.fillStyle = boneWhite;
  for (let f = 0; f < 3; f++) {
    ctx.beginPath();
    ctx.arc(rHandX - 2, rHandY - 3 + f * 3, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Braço Esquerdo: Do ombro esquerdo descendo para a postura de comando
  const lShoulderX = -16;
  const lShoulderY = -22 + bob + collapseProg * 10;
  const lHandX = 8;
  const lHandY = 12 + bob + collapseProg * 12;

  // Manga esquerda
  ctx.strokeStyle = '#061019';
  ctx.lineWidth = 6.5;
  ctx.beginPath();
  ctx.moveTo(lShoulderX, lShoulderY);
  ctx.quadraticCurveTo(lShoulderX + 4, lShoulderY + 22, lHandX, lHandY);
  ctx.stroke();

  // Manopla esquerda com dedos em garra
  ctx.fillStyle = metalPlates;
  ctx.beginPath();
  ctx.arc(lHandX, lHandY, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = boneWhite;
  for (let f = 0; f < 3; f++) {
    const fa = -0.4 + f * 0.4;
    ctx.beginPath();
    ctx.moveTo(lHandX, lHandY);
    ctx.lineTo(lHandX + Math.cos(fa) * 7, lHandY + Math.sin(fa) * 7);
    ctx.strokeStyle = boneWhite;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Desenha o capuz abissal, a máscara 3D facetada com mandíbula articulada e chifres rúnicos.
 */
export function drawMaskAndEyes(ctx, e, bob, frameCount, isVuln, isEnraged, collapseProg = 0) {
  const headY = -36 + bob + collapseProg * 10;
  const jawDrop = e.jawDrop || 0;
  const isP3 = e.isPhase3 || false;

  const soulCyan  = isVuln ? '#636e72' : (isP3 ? '#ff7675' : (isEnraged ? '#ff4757' : '#00cec9'));
  const soulGlow  = isVuln ? '#7f8c8d' : (isP3 ? '#ffffff' : (isEnraged ? '#ff6b81' : '#81ecec'));
  const boneWhite = isVuln ? '#636e72' : (isP3 ? '#f5e6e8' : (isEnraged ? '#f1dcd6' : '#e6f2f2'));
  const boneShade = isVuln ? '#2d3436' : (isP3 ? '#4a0e16' : (isEnraged ? '#4a151b' : '#1e3842'));

  // 1. Capuz Abissal Gótico Volumétrico
  ctx.fillStyle = '#020509';
  ctx.beginPath();
  ctx.moveTo(0, headY - 28);
  ctx.lineTo(19, headY - 16);
  ctx.lineTo(21, headY + 14);
  ctx.lineTo(0, headY + 24);
  ctx.lineTo(-21, headY + 14);
  ctx.lineTo(-19, headY - 16);
  ctx.closePath();
  ctx.fill();

  // Borda chanfrada de reforço do capuz
  ctx.strokeStyle = isEnraged ? '#5a0d14' : '#0a232f';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // 2. Chifres Espirais de Carneiro com Runas Gravadas
  ctx.lineWidth = 3.6;
  ctx.lineCap = 'round';
  for (let side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);

    // Chifre arqueado curvado para trás
    ctx.strokeStyle = boneShade;
    ctx.beginPath();
    ctx.moveTo(10, headY - 15);
    ctx.bezierCurveTo(26, headY - 34, 38, headY - 26, 32, headY - 8);
    ctx.stroke();

    ctx.strokeStyle = isP3 ? '#ff7675' : (isEnraged ? '#ff6b81' : '#81ecec');
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Ranhuras/anéis de crescimento no chifre
    ctx.strokeStyle = boneShade;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(18, headY - 24);
    ctx.lineTo(24, headY - 20);
    ctx.moveTo(27, headY - 26);
    ctx.lineTo(32, headY - 20);
    ctx.stroke();

    // Glifos rúnicos brilhantes nos chifres
    const runePulse = (Math.sin(frameCount * 0.15) + 1) * 0.5;
    ctx.fillStyle = isP3 ? '#ffffff' : soulCyan;
    ctx.globalAlpha = 0.5 + runePulse * 0.5;
    ctx.fillRect(21, headY - 22, 2.5, 2.5);
    ctx.fillRect(29, headY - 24, 2.5, 2.5);
    ctx.globalAlpha = 1.0;

    ctx.restore();
  }

  // 3. Máscara de Caveira em 3 Planos Facetados (Frontal e Têmporas)
  ctx.fillStyle = boneWhite;
  ctx.beginPath();
  ctx.moveTo(0, headY - 16);
  ctx.lineTo(13, headY - 6);
  ctx.lineTo(11, headY + 5);
  ctx.lineTo(6, headY + 11);
  ctx.lineTo(0, headY + 13);
  ctx.lineTo(-6, headY + 11);
  ctx.lineTo(-11, headY + 5);
  ctx.lineTo(-13, headY - 6);
  ctx.closePath();
  ctx.fill();

  // Sombreamento Zigomático nas Têmporas (Iluminação Direcional 3D)
  ctx.fillStyle = boneShade;
  ctx.beginPath();
  ctx.moveTo(7, headY - 6);
  ctx.lineTo(13, headY - 6);
  ctx.lineTo(11, headY + 5);
  ctx.lineTo(7, headY + 3);
  ctx.closePath();
  ctx.fill();

  // Cavidade Nasal Triangular
  ctx.fillStyle = '#020509';
  ctx.beginPath();
  ctx.moveTo(0, headY + 2);
  ctx.lineTo(-2.5, headY + 7);
  ctx.lineTo(2.5, headY + 7);
  ctx.closePath();
  ctx.fill();

  // Dentes Superiores de Marfim
  ctx.fillStyle = boneWhite;
  for (let t = -3; t <= 3; t += 2) {
    ctx.fillRect(t - 0.7, headY + 11, 1.4, 2.5);
  }

  // 4. Mandíbula Articulada com Efeito jawDrop
  const jawY = headY + 13 + jawDrop * 7;
  ctx.save();
  ctx.translate(0, jawY);
  ctx.rotate(jawDrop * 0.12);

  // Se a mandíbula estiver aberta: Abismo oral com chamas espectrais internas
  if (jawDrop > 0.08) {
    const mouthGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 8);
    mouthGrad.addColorStop(0, '#ffffff');
    mouthGrad.addColorStop(0.5, soulGlow);
    mouthGrad.addColorStop(1, soulCyan);
    ctx.fillStyle = mouthGrad;
    ctx.beginPath();
    ctx.ellipse(0, -2, 5, jawDrop * 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fumaça espectral saindo da boca aberta
    if (Math.floor(frameCount) % 2 === 0) {
      ctx.fillStyle = soulGlow;
      ctx.globalAlpha = 0.6;
      ctx.fillRect((Math.random() - 0.5) * 4, -4 - Math.random() * 8, 2, 2);
      ctx.globalAlpha = 1.0;
    }
  }

  // Queixo e dentes inferiores
  ctx.fillStyle = boneWhite;
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(4, 0);
  ctx.lineTo(2.5, 6);
  ctx.lineTo(-2.5, 6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = boneShade;
  ctx.fillRect(-2, 1, 4, 4);

  // Dentes inferiores
  ctx.fillStyle = boneWhite;
  for (let t = -2; t <= 2; t += 2) {
    ctx.fillRect(t - 0.6, -1.8, 1.2, 2.0);
  }

  ctx.restore();

  // 5. Cavidades Oculares Profundas e Olhos
  ctx.fillStyle = '#020406';
  ctx.beginPath();
  ctx.ellipse(-5.5, headY - 1, 4.5, 3.2, -0.15, 0, Math.PI * 2);
  ctx.ellipse(5.5, headY - 1, 4.5, 3.2, 0.15, 0, Math.PI * 2);
  ctx.fill();

  const eyePulse = e.eyePulse || 0.5;
  const eyeR = 3.6 + eyePulse * 1.8;

  if (isP3) {
    // FASE 3: Mini Buraco Negro / Singularidade com Anel de Acreção
    for (let side of [-5.5, 5.5]) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(side, headY - 1, eyeR * 1.1, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ff7675';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(side, headY - 1, eyeR * 1.3, frameCount * 0.1, frameCount * 0.1 + Math.PI * 1.3);
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(side, headY - 1, eyeR * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // FOGO FÁTUO INCANDESCENTE PADRÃO
    for (let side of [-5.5, 5.5]) {
      const eyeGrad = ctx.createRadialGradient(side, headY - 1, 1, side, headY - 1, eyeR);
      eyeGrad.addColorStop(0, '#ffffff');
      eyeGrad.addColorStop(0.5, soulGlow);
      eyeGrad.addColorStop(1, 'rgba(0, 206, 201, 0)');
      ctx.fillStyle = eyeGrad;
      ctx.beginPath();
      ctx.arc(side, headY - 1, eyeR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Desenha a Foice Monumental das Eras de Thanatos reproduzindo com máxima fidelidade
 * a arma conceitual: lâmina em foice com dorso de aço negro, 3 espigões dorsais inclinados,
 * núcleo de cristais de rubi carmesim facetados, estalactites de cristal suspensas,
 * gume de corte chanfrado em aço prateado/ciano polido, bico traseiro com rubi,
 * haste reta com amarrações em "X", 3 braçadeiras com rebites ciano,
 * manivela serrilhada com dentes de serra e pomo em orbe ciano.
 */
export function drawOrnateScythe(ctx, e, bob, isVuln, isEnraged, collapseProg = 0, frameCount = 0) {
  ctx.save();
  ctx.translate(36, -10 + bob + collapseProg * 14);
  ctx.rotate(e.scytheAngle);

  const fc = frameCount || (e && e.clothWavePhase ? Math.floor(e.clothWavePhase * 30) : 0) || Math.floor(performance.now() * 0.06);
  const isGlow = (e.scytheGlow && e.scytheGlow > 0) || false;

  // Paleta da Foice de Thanatos (Fiel à Imagem Conceitual)
  // 1. Detalhes em Ciano / Teal (Orbe, anéis, bordas dos acopladores e serra)
  const tealMain   = isVuln ? '#636e72' : (isEnraged ? '#ff4757' : '#00cec9');
  const tealGlow   = isVuln ? '#7f8c8d' : (isEnraged ? '#ff6b81' : '#81ecec');
  const tealBorder = isVuln ? '#2d3436' : (isEnraged ? '#780016' : '#008b8b');

  // 2. Cabo e Casca Estrutural em Aço Negro / Grafite Escuro
  const metalDark   = '#141a1f';
  const metalPlates = '#222d36';
  const metalRim    = '#374754';
  const strapColor  = '#3d4d5a';

  // 3. Cristais de Rubi Facetados (Carmesim / Sangue Profundo)
  const rubyDeep   = isVuln ? '#2d3436' : '#45040d';
  const rubyDark   = isVuln ? '#4b5766' : '#780c1b';
  const rubyMid    = isVuln ? '#636e72' : '#b7152b';
  const rubyBright = isVuln ? '#8a99a8' : '#e8253b';
  const rubyHigh   = isVuln ? '#b2bec3' : '#ff4d61';
  const rubyGlint  = isVuln ? '#dfe6e9' : '#ffa8b5';

  // 4. Lâmina e Gume Chanfrado em Aço Prateado / Ciano Polido
  const steelDull   = '#2c3e50';
  const steelMid    = '#53708a';
  const steelBright = '#94bfd6';
  const steelSilver = '#dff9fb';
  const steelEdge   = '#ffffff';

  // =========================================================================
  // 1. CABO INFERIOR: MANIVELA ARTICULADA COM INÉRCIA, DENTES DE SERRA E ORBE CIANO
  // =========================================================================

  // A. Disco / Acoplador Circular no final do cabo reto (y = 70)
  ctx.fillStyle = metalPlates;
  ctx.beginPath();
  ctx.arc(0, 70, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tealMain;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // B. Braço Articulado com Inércia Física (Pivô dinâmico em 0, 70)
  const crankAngle = e.crankAngle || 0;
  ctx.save();
  ctx.translate(0, 70);
  ctx.rotate(crankAngle);

  // Braço da Manivela Angular e Serrada (coordenadas relativas ao pivô 0, 70)
  ctx.fillStyle = metalPlates;
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(-10, 15);
  ctx.lineTo(-10, 52);
  ctx.lineTo(-24, 60);
  ctx.lineTo(-26, 54);
  ctx.lineTo(-15, 48);
  ctx.lineTo(-15, 13);
  ctx.lineTo(-2, -2);
  ctx.closePath();
  ctx.fill();

  // Contorno Ciano do braço
  ctx.strokeStyle = tealMain;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Dentes de Serra Triangulares Afiados (voltados para a direita da haste)
  ctx.fillStyle = metalPlates;
  ctx.strokeStyle = tealMain;
  ctx.lineWidth = 1.2;
  const sawStartY = 16;
  const sawCount = 7;
  const toothH = 4.8;
  for (let s = 0; s < sawCount; s++) {
    const ty = sawStartY + s * toothH;
    ctx.beginPath();
    ctx.moveTo(-10, ty);
    ctx.lineTo(-2.5, ty + toothH * 0.4); // Ponta do dente
    ctx.lineTo(-10, ty + toothH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // C. Orbe Terminal / Pomo Ciano na ponta da manivela
  const pommelX = -24;
  const pommelY = 60;
  const pommelR = 5.5;

  const orbGrad = ctx.createRadialGradient(pommelX - 1.5, pommelY - 1.5, 1, pommelX, pommelY, pommelR);
  orbGrad.addColorStop(0, tealGlow);
  orbGrad.addColorStop(0.7, tealMain);
  orbGrad.addColorStop(1, tealBorder);

  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(pommelX, pommelY, pommelR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = metalDark;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.restore();

  // Núcleo central do disco / Pino do eixo da articulação
  ctx.fillStyle = metalDark;
  ctx.beginPath();
  ctx.arc(0, 70, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tealMain;
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // =========================================================================
  // 2. HASTE PRINCIPAL DO CABO COM AMARRAÇÕES EM "X" E BRAÇADEIRAS QUADRADAS
  // =========================================================================

  // Haste reta sólida preta (de y = -92 até y = 70)
  ctx.fillStyle = metalDark;
  ctx.fillRect(-3.2, -92, 6.4, 162);
  ctx.strokeStyle = metalRim;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-3.2, -92, 6.4, 162);

  // Amarras cruzadas em "X" (Crossed Straps)
  ctx.strokeStyle = strapColor;
  ctx.lineWidth = 1.8;
  const xPositions = [-55, -40, 2, 17, 56];
  for (let py of xPositions) {
    ctx.beginPath();
    ctx.moveTo(-4, py - 4);
    ctx.lineTo(4, py + 4);
    ctx.moveTo(-4, py + 4);
    ctx.lineTo(4, py - 4);
    ctx.stroke();
  }

  // 3 Braçadeiras Metálicas Quadradas / Acopladores com Rebite Ciano
  const collarY = [-72, -18, 36];
  for (let cy of collarY) {
    // Bloco quadrado escuro
    ctx.fillStyle = metalPlates;
    ctx.fillRect(-5.5, cy - 4.5, 11, 9);
    // Borda ciano
    ctx.strokeStyle = tealMain;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-5.5, cy - 4.5, 11, 9);
    // Rebite central ciano
    ctx.fillStyle = tealGlow;
    ctx.fillRect(-1.5, cy - 1.5, 3, 3);
  }

  // Balança do Julgamento Suspensa (Scales of the Damned)
  ctx.save();
  ctx.translate(0, -72); // Na braçadeira superior
  const chainLen = 14;
  ctx.strokeStyle = 'rgba(241, 196, 15, 0.65)';
  ctx.lineWidth = 1.0;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(0, 4 + chainLen);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.translate(0, 4 + chainLen);
  const sTilt = e.scalesTilt || 0;
  ctx.rotate(sTilt);

  // Barra transversal da balança
  ctx.strokeStyle = '#f39c12';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.lineTo(11, 0);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-1, -1, 2, 2);

  // Prato Esquerdo (Vida / Esmeralda)
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.lineTo(-11, 5);
  ctx.stroke();
  ctx.fillStyle = '#00cec9';
  ctx.beginPath();
  ctx.arc(-11, 6, 2.5, 0, Math.PI);
  ctx.fill();

  // Prato Direito (Morte / Carmesim)
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(11, 5);
  ctx.stroke();
  ctx.fillStyle = '#ff4757';
  ctx.beginPath();
  ctx.arc(11, 6, 2.5, 0, Math.PI);
  ctx.fill();
  ctx.restore();

  // =========================================================================
  // 3. CABEÇOTE / BLOCO SUPERIOR DE JUNÇÃO COM ASTROLÁBIO RÚNICO GIRATÓRIO
  // =========================================================================
  ctx.fillStyle = metalPlates;
  ctx.beginPath();
  ctx.moveTo(-7.5, -86);
  ctx.lineTo(-6.5, -100);
  ctx.lineTo(6.5, -100);
  ctx.lineTo(7.5, -86);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = tealMain;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Astrolábio Rúnico Giratório no Cabeçote
  const astroR = 10;
  const astroAngle = e.astrolabeAngle || 0;
  ctx.save();
  ctx.translate(0, -93);
  ctx.rotate(astroAngle);
  ctx.strokeStyle = tealMain;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, astroR, 0, Math.PI * 2);
  ctx.stroke();

  // 4 Dentes radiais do astrolábio
  for (let a = 0; a < 4; a++) {
    const aa = a * Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(aa) * (astroR - 2), Math.sin(aa) * (astroR - 2));
    ctx.lineTo(Math.cos(aa) * (astroR + 3), Math.sin(aa) * (astroR + 3));
    ctx.stroke();
  }
  ctx.restore();

  // Rebite central ciano
  ctx.fillStyle = tealGlow;
  ctx.fillRect(-2, -95, 4, 4);

  // Escala reduzida pela metade (50%) para a lâmina e contra-lâmina em relação ao encaixe
  ctx.save();
  ctx.translate(0, -94);
  ctx.scale(0.5, 0.5);
  ctx.translate(0, 94);

  // =========================================================================
  // 4. BICO TRASEIRO / CONTRA-LÂMINA OPOSTA (BICO CURVO COM RUBI E GUME)
  // =========================================================================

  // A. Dorso e Casca Externa da contra-lâmina curvando para baixo
  ctx.fillStyle = metalPlates;
  ctx.beginPath();
  ctx.moveTo(6.5, -100);
  ctx.bezierCurveTo(28, -110, 52, -88, 62, -34); // Ponta em garra/bico curvado para baixo
  ctx.bezierCurveTo(48, -54, 28, -74, 7.5, -86);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = metalDark;
  ctx.lineWidth = 3.0;
  ctx.stroke();

  // B. Cristais de Rubi Facetados na Contra-Lâmina
  const backRubyFacets = [
    { pts: [[14, -96], [32, -101], [50, -78], [30, -82]], c: rubyBright, h: rubyHigh },
    { pts: [[32, -101], [46, -90], [56, -60], [50, -78]], c: rubyHigh, h: rubyDark },
    { pts: [[30, -82], [50, -78], [56, -60], [38, -68]], c: rubyMid, h: rubyDeep }
  ];
  for (let br of backRubyFacets) {
    ctx.fillStyle = br.c;
    ctx.beginPath();
    ctx.moveTo(br.pts[0][0], br.pts[0][1]);
    for (let p = 1; p < br.pts.length; p++) ctx.lineTo(br.pts[p][0], br.pts[p][1]);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = br.h;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  // C. Gume de Aço Prateado Polido da contra-lâmina
  ctx.strokeStyle = steelSilver;
  ctx.lineWidth = 3.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(62, -34);
  ctx.bezierCurveTo(48, -54, 28, -74, 7.5, -86);
  ctx.stroke();

  // Fio luminoso puro
  ctx.strokeStyle = steelEdge;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Brilho diamante na ponta da contra-lâmina
  ctx.fillStyle = steelEdge;
  ctx.fillRect(60, -36, 4, 4);

  // FASE DE FÚRIA / FASE 3: IGNIÇÃO DA SEGUNDA LÂMINA DE PLASMA (FOICE DUPLA DO ECLIPSE)
  const isP3 = e.isPhase3 || false;
  if (isEnraged || isP3) {
    ctx.save();
    const pAlpha = 0.55 + Math.sin(fc * 0.3) * 0.25;

    // Lâmina de plasma arqueada brotando do bico (62, -34) até (125, 42)
    const plasmaGrad = ctx.createLinearGradient(62, -34, 125, 42);
    plasmaGrad.addColorStop(0, isP3 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 118, 117, 0.9)');
    plasmaGrad.addColorStop(0.5, isP3 ? 'rgba(255, 71, 87, 0.85)' : 'rgba(192, 57, 43, 0.7)');
    plasmaGrad.addColorStop(1, 'rgba(142, 68, 173, 0)');

    ctx.fillStyle = plasmaGrad;
    ctx.beginPath();
    ctx.moveTo(62, -34);
    ctx.quadraticCurveTo(95, -10, 125, 42);
    ctx.quadraticCurveTo(80, 15, 48, -54);
    ctx.closePath();
    ctx.fill();

    // Fio de corte da segunda lâmina
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = isP3 ? 3.4 : 2.2;
    ctx.beginPath();
    ctx.moveTo(62, -34);
    ctx.quadraticCurveTo(95, -10, 125, 42);
    ctx.stroke();

    // Espículas de plasma e arcos elétricos na ponta traseira
    ctx.strokeStyle = isP3 ? '#ff7675' : '#ff4757';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(125, 42);
    ctx.lineTo(135 + Math.sin(fc * 0.4) * 6, 52);
    ctx.stroke();
    ctx.restore();
  }

  // =========================================================================
  // 5. GRANDE LÂMINA PRINCIPAL DA FOICE (FORMA FIEL AO CONCEITO ARTÍSTICO)
  // =========================================================================

  // A. ESTALACTITES DE CRISTAL DE RUBI PENDENTES SOB A JUNÇÃO
  const stalactites = [
    { p: [[-32, -74], [-36, -58], [-40, -74]], col1: rubyMid, col2: rubyBright },
    { p: [[-38, -74], [-43, -44], [-48, -74]], col1: rubyDark, col2: rubyHigh },
    { p: [[-46, -74], [-51, -56], [-56, -74]], col1: rubyMid, col2: rubyBright },
    { p: [[-54, -74], [-58, -65], [-62, -74]], col1: rubyDeep, col2: rubyMid }
  ];
  for (let st of stalactites) {
    ctx.fillStyle = st.col1;
    ctx.beginPath();
    ctx.moveTo(st.p[0][0], st.p[0][1]);
    ctx.lineTo(st.p[1][0], st.p[1][1]);
    ctx.lineTo(st.p[2][0], st.p[2][1]);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = st.col2;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  // B. CORPO PRINCIPAL EM AÇO NEGRO (CÚPULA COM CRISTA, 3 ESPIGÕES INCLINADOS E ARCO MONUMENTAL)
  ctx.fillStyle = metalPlates;
  ctx.beginPath();
  ctx.moveTo(-6.5, -100);

  // Crista da cúpula de armadura
  ctx.quadraticCurveTo(-16, -116, -28, -124); // Pico da crista
  ctx.quadraticCurveTo(-38, -120, -46, -114); // Vale antes do Espigão 1

  // Espigão Dorsal 1 (inclinado para trás)
  ctx.quadraticCurveTo(-49, -122, -52, -126);
  ctx.lineTo(-58, -118);
  ctx.lineTo(-64, -112);

  // Espigão Dorsal 2 (inclinado para trás)
  ctx.quadraticCurveTo(-68, -120, -73, -122);
  ctx.lineTo(-80, -112);
  ctx.lineTo(-87, -106);

  // Espigão Dorsal 3 (inclinado para trás)
  ctx.quadraticCurveTo(-91, -114, -96, -114);
  ctx.lineTo(-103, -104);
  ctx.lineTo(-110, -96);

  // Grande Curvatura Monumental em Crescente até a Ponta Extrema
  ctx.bezierCurveTo(-140, -86, -170, -58, -186, -14);
  ctx.bezierCurveTo(-196, 20, -194, 44, -186, 58); // PONTA EXTREMA DA FOICE

  // Borda Interna / Gume de Retorno até a base
  ctx.bezierCurveTo(-182, 36, -174, 14, -164, -8);
  ctx.bezierCurveTo(-148, -38, -118, -62, -60, -74);

  // Borda inferior da cúpula com o arpão/gancho afiado
  ctx.lineTo(-40, -74);
  ctx.lineTo(-24, -70);
  ctx.lineTo(-16, -60); // Ponta do gancho inferior
  ctx.lineTo(-10, -72);
  ctx.lineTo(-7.5, -86);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = metalDark;
  ctx.lineWidth = 3.6;
  ctx.stroke();

  // Friso metálico chanfrado de relevo na crista superior
  ctx.strokeStyle = metalRim;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-6.5, -100);
  ctx.quadraticCurveTo(-16, -116, -28, -124);
  ctx.quadraticCurveTo(-38, -120, -46, -114);
  ctx.stroke();

  // C. GRANDE CRISTAL DE RUBI MULTIFACETADO DA CÚPULA DA BASE
  const baseRubyFacets = [
    { pts: [[-10, -96], [-25, -116], [-41, -108], [-26, -94]], c: rubyBright, h: rubyHigh },
    { pts: [[-12, -88], [-26, -94], [-41, -88], [-23, -80]], c: rubyMid, h: rubyBright },
    { pts: [[-14, -80], [-23, -80], [-41, -88], [-32, -74]], c: rubyDark, h: rubyMid },
    { pts: [[-41, -108], [-48, -102], [-50, -86], [-41, -88]], c: rubyDeep, h: rubyDark }
  ];
  for (let f of baseRubyFacets) {
    ctx.fillStyle = f.c;
    ctx.beginPath();
    ctx.moveTo(f.pts[0][0], f.pts[0][1]);
    for (let p = 1; p < f.pts.length; p++) ctx.lineTo(f.pts[p][0], f.pts[p][1]);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = f.h;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  // D. CANAL CONTÍNUO DE CRISTAIS DE RUBI FACETADOS AO LONGO DA LÂMINA
  const rubyFacets = [
    { pts: [[-48, -102], [-68, -96], [-70, -82], [-50, -86]], c: rubyBright, h: rubyHigh },
    { pts: [[-68, -96], [-92, -88], [-94, -74], [-70, -82]], c: rubyMid, h: rubyBright },
    { pts: [[-92, -88], [-122, -76], [-120, -58], [-94, -74]], c: rubyBright, h: rubyGlint },
    { pts: [[-122, -76], [-148, -52], [-144, -34], [-120, -58]], c: rubyMid, h: rubyBright },
    { pts: [[-148, -52], [-170, -16], [-160, -2], [-144, -34]], c: rubyDark, h: rubyMid },
    { pts: [[-170, -16], [-182, 20], [-174, 28], [-160, -2]], c: rubyBright, h: rubyHigh }
  ];
  for (let f of rubyFacets) {
    ctx.fillStyle = f.c;
    ctx.beginPath();
    ctx.moveTo(f.pts[0][0], f.pts[0][1]);
    for (let p = 1; p < f.pts.length; p++) ctx.lineTo(f.pts[p][0], f.pts[p][1]);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = f.h;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  // Pontos de brilho especular de joia nos vértices das facetas
  ctx.fillStyle = rubyGlint;
  const glints = [[-25, -116], [-41, -88], [-68, -96], [-92, -88], [-122, -76], [-148, -52], [-170, -16]];
  for (let g of glints) {
    ctx.fillRect(g[0] - 2, g[1] - 2, 4, 4);
  }

  // Fluxo Dinâmico de Luz Líquida / Energia Espectral no Canal da Lâmina
  ctx.strokeStyle = isEnraged ? 'rgba(255, 118, 117, 0.75)' : 'rgba(129, 236, 236, 0.75)';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-48, -102);
  ctx.bezierCurveTo(-90, -90, -140, -50, -182, 20);
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // E. GUME CHANFRADO EM AÇO PRATEADO POLIDO (SILVER-CYAN METALLIC RAZOR BLADE)
  const edgeGrad = ctx.createLinearGradient(-60, -74, -186, 58);
  edgeGrad.addColorStop(0.0, steelMid);
  edgeGrad.addColorStop(0.3, steelBright);
  edgeGrad.addColorStop(0.7, steelSilver);
  edgeGrad.addColorStop(1.0, steelEdge);

  // Chanfro primário côncavo de corte
  ctx.fillStyle = edgeGrad;
  ctx.beginPath();
  // Gume externo
  ctx.moveTo(-186, 58);
  ctx.bezierCurveTo(-182, 36, -174, 14, -164, -8);
  ctx.bezierCurveTo(-148, -38, -118, -62, -60, -74);
  // Borda interna chanfrada
  ctx.bezierCurveTo(-110, -68, -140, -42, -156, -14);
  ctx.bezierCurveTo(-168, 12, -176, 36, -186, 58);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = metalDark;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Fio de corte puro em aço prateado espelhado (Razor Bevel)
  ctx.strokeStyle = isGlow ? '#ffffff' : steelSilver;
  ctx.lineWidth = isGlow ? 5.2 : 3.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-186, 58); // Ponta extrema da foice
  ctx.bezierCurveTo(-182, 36, -174, 14, -164, -8);
  ctx.bezierCurveTo(-148, -38, -118, -62, -60, -74);
  ctx.stroke();

  // Fio incandescente puro no vértice cortante
  ctx.strokeStyle = steelEdge;
  ctx.lineWidth = isGlow ? 2.6 : 1.8;
  ctx.stroke();

  // F. BRILHO ESPECULAR DIAMANTE NA PONTA EXTREMA DA LÂMINA
  const tipX = -186;
  const tipY = 58;
  ctx.fillStyle = steelEdge;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY - 7);
  ctx.lineTo(tipX + 5, tipY);
  ctx.lineTo(tipX, tipY + 7);
  ctx.lineTo(tipX - 5, tipY);
  ctx.closePath();
  ctx.fill();

  ctx.restore(); // Restaura a escala de 50% da lâmina

  ctx.restore();
}

/**
 * Desenha as Lanternas Góticas dos Condenados orbitando ao redor do Ceifador.
 */
export function drawGothicLanterns(ctx, e, bob, frameCount, isEnraged) {
  if (!e.lanterns) return;

  // 1. Rede de Lasers Espirituais (Spirit Lattice) entre lanternas adjacentes ativas
  const n = e.lanterns.length;
  if (n > 1) {
    for (let i = 0; i < n; i++) {
      const nextIdx = (i + 1) % n;
      const la = e.lanterns[i];
      const lb = e.lanterns[nextIdx];

      if (la.active && lb.active) {
        const lxA = Math.cos(la.angle) * la.dist;
        const lyA = (Math.sin(la.angle) * (la.dist * 0.48)) + bob + (la.sway || 0);
        const lxB = Math.cos(lb.angle) * lb.dist;
        const lyB = (Math.sin(lb.angle) * (lb.dist * 0.48)) + bob + (lb.sway || 0);

        const beamPulse = (Math.sin(frameCount * 0.2 + i) + 1) * 0.5;

        ctx.save();
        // Brilho difuso exterior
        ctx.strokeStyle = isEnraged 
          ? `rgba(255, 71, 87, ${0.30 + beamPulse * 0.35})` 
          : `rgba(0, 206, 201, ${0.30 + beamPulse * 0.35})`;
        ctx.lineWidth = 6.0 + beamPulse * 2.5;
        ctx.beginPath();
        ctx.moveTo(lxA, lyA);
        ctx.lineTo(lxB, lyB);
        ctx.stroke();

        // Núcleo energético do feixe
        ctx.strokeStyle = isEnraged ? '#ff7675' : '#81ecec';
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Fio central branco-incandescente
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Partícula de pulso correndo ao longo do feixe
        const sparkT = ((frameCount * 0.035 + i * 0.28) % 1.0);
        const sparkX = lxA + (lxB - lxA) * sparkT;
        const sparkY = lyA + (lyB - lyA) * sparkT;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }
  }

  for (let l of e.lanterns) {
    if (!l.active) continue;

    const lx = Math.cos(l.angle) * l.dist;
    const ly = (Math.sin(l.angle) * (l.dist * 0.48)) + bob + (l.sway || 0);

    // Corrente de Sustentação conectando ao Ceifador
    ctx.save();
    ctx.strokeStyle = isEnraged ? 'rgba(255, 71, 87, 0.50)' : 'rgba(0, 206, 201, 0.50)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, (-18 + bob) * REAPER_CONFIG.BODY_SCALE);
    ctx.lineTo(lx, ly - l.radius - 8);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(lx, ly);

    if (l.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, l.radius + 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 1. Corpo da Gaiola Gótica Octogonal de Ferro Forjado
      ctx.fillStyle = isEnraged ? '#2c080d' : '#0d1821';
      ctx.beginPath();
      ctx.moveTo(-l.radius * 0.7, -l.radius);
      ctx.lineTo(l.radius * 0.7, -l.radius);
      ctx.lineTo(l.radius * 0.9, l.radius * 0.65);
      ctx.lineTo(0, l.radius * 1.25);
      ctx.lineTo(-l.radius * 0.9, l.radius * 0.65);
      ctx.closePath();
      ctx.fill();

      // Borda e Barras de Ferro
      ctx.strokeStyle = isEnraged ? '#ff4757' : '#00cec9';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Barras verticais da gaiola
      ctx.beginPath();
      ctx.moveTo(-l.radius * 0.35, -l.radius);
      ctx.lineTo(-l.radius * 0.45, l.radius * 0.65);
      ctx.moveTo(l.radius * 0.35, -l.radius);
      ctx.lineTo(l.radius * 0.45, l.radius * 0.65);
      ctx.moveTo(0, -l.radius);
      ctx.lineTo(0, l.radius * 1.25);
      ctx.stroke();

      // Pináculo do Topo da Lanterna
      ctx.fillStyle = isEnraged ? '#ff4757' : '#81ecec';
      ctx.beginPath();
      ctx.moveTo(0, -l.radius - 6);
      ctx.lineTo(4, -l.radius);
      ctx.lineTo(-4, -l.radius);
      ctx.closePath();
      ctx.fill();

      // 2. Alma Prisioneira / Fogo Fátuo Vivo no Interior
      const wispAngle = frameCount * 0.12 + (l.flickerPhase || 0);
      const wispR = l.radius * 0.62;
      const flameGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, wispR);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.4, isEnraged ? '#ff6b81' : '#81ecec');
      flameGrad.addColorStop(1, isEnraged ? '#c0392b' : '#00cec9');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.arc(0, 0, wispR, 0, Math.PI * 2);
      ctx.fill();

      // Micro-alma orbitando no interior do vidro
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(Math.cos(wispAngle) * (wispR * 0.5), Math.sin(wispAngle) * (wispR * 0.5), 2.4, 0, Math.PI * 2);
      ctx.fill();

      // 3. Barra Circular de Vida da Lanterna
      const hpPct = Math.max(0, l.hp / l.maxHp);
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, l.radius + 6, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * hpPct));
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * Desenha o portal holográfico e telegrafia de teleporte espectral (Blink).
 */
export function drawBlinkAimIndicator(ctx, e, frameCount) {
  if (e.actionState !== REAPER_STATES.BLINK_AIM || !e.blinkTarget) return;

  const targetDx = e.blinkTarget.x - e.x;
  const targetDy = e.blinkTarget.y - e.y;

  ctx.save();

  // 1. Filamento espectral ligando a posição atual ao destino
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.55)';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = -frameCount * 1.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(targetDx, targetDy);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.translate(targetDx, targetDy);

  // 2. Fenda Espectral no Chão (Rift Portal)
  const pulse = Math.sin(frameCount * 0.22) * 5;
  const ringR = 44 + pulse;

  ctx.fillStyle = 'rgba(3, 7, 13, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, 0, ringR, ringR * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(0, 0, ringR, ringR * 0.52, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(129, 236, 236, 0.6)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, ringR * 0.65, ringR * 0.32, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Silhueta Espectral Translúcida do Ceifador (Holograma de Aviso)
  const phantomAlpha = 0.35 + Math.sin(frameCount * 0.25) * 0.12;
  ctx.save();
  ctx.globalAlpha = phantomAlpha;
  ctx.fillStyle = '#00cec9';
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.quadraticCurveTo(-26, -10, -18, 20);
  ctx.lineTo(18, 20);
  ctx.quadraticCurveTo(26, -10, 0, -48);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-5, -28, 3, 3);
  ctx.fillRect(5, -28, 3, 3);

  // Foice espectral na mão do holograma
  ctx.save();
  ctx.translate(22, -18);
  ctx.rotate(0.35);
  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -45);
  ctx.lineTo(0, 35);
  ctx.stroke();
  ctx.fillStyle = 'rgba(0, 206, 201, 0.45)';
  ctx.beginPath();
  ctx.moveTo(0, -45);
  ctx.lineTo(-12, -58);
  ctx.lineTo(-30, -52);
  ctx.lineTo(-44, -20);
  ctx.quadraticCurveTo(-48, 10, -40, 25);
  ctx.quadraticCurveTo(-34, 0, -28, -15);
  ctx.quadraticCurveTo(-18, -35, 0, -40);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  // 4. Cone Telegrafado do Corte Iminente
  if (e.blinkTarget.cleaveAngle !== undefined) {
    const cleaveArc = Math.PI * 0.52;
    const startAng = e.blinkTarget.cleaveAngle - cleaveArc;
    const endAng = e.blinkTarget.cleaveAngle + cleaveArc;

    ctx.fillStyle = 'rgba(0, 206, 201, 0.18)';
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.65)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 170, startAng, endAng);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, 170, startAng, endAng);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Desenha as linhas tracejadas de mira das Foices de Almas.
 */
export function drawSoulScytheAimLines(ctx, e, frameCount) {
  if (e.actionState !== REAPER_STATES.WINDUP || e.currentSkill !== 'SOUL_SCYTHES') return;

  const blades = e.isPhase3 ? 7 : (e.isEnraged ? 5 : 3);
  const arc = Math.PI * (e.isEnraged ? 0.65 : 0.45);
  const baseAngle = e.aimAngle || 0;
  const startAngle = baseAngle - arc / 2;
  const step = arc / (blades - 1);

  ctx.save();
  ctx.strokeStyle = e.isEnraged ? 'rgba(255, 71, 87, 0.55)' : 'rgba(0, 206, 201, 0.55)';
  ctx.lineWidth = 2.0;
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = -frameCount * 1.8;

  for (let i = 0; i < blades; i++) {
    const bAng = startAngle + i * step;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(bAng) * 350, Math.sin(bAng) * 350);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Desenha o campo de atração em espiral do Vórtice Colhedor.
 */
export function drawHarvestField(ctx, e, frameCount) {
  const maxR = 330;
  const maxTime = e.isEnraged ? 75 : 95;
  const progress = Math.max(0, Math.min(1, 1 - (e.actionTimer / maxTime)));

  ctx.save();
  ctx.fillStyle = 'rgba(0, 206, 201, 0.07)';
  ctx.beginPath();
  ctx.arc(0, 0, maxR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0, 206, 201, 0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  const arms = 3;
  const spin = -frameCount * 0.05;
  ctx.lineWidth = 2;
  for (let a = 0; a < arms; a++) {
    const baseAng = spin + (a * Math.PI * 2 / arms);
    ctx.strokeStyle = `rgba(129, 236, 236, ${0.2 + (a % 2 === 0 ? 0.25 : 0.1)})`;
    ctx.beginPath();
    for (let step = 0; step < 16; step++) {
      const stepR = maxR * (1 - step / 16);
      const stepA = baseAng + step * 0.22;
      const sx = Math.cos(stepA) * stepR;
      const sy = Math.sin(stepA) * stepR;
      if (step === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  const shrinkR = Math.max(24, maxR * (1 - progress));
  ctx.strokeStyle = progress > 0.82 ? '#ffffff' : '#00cec9';
  ctx.lineWidth = progress > 0.82 ? 3.5 : 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, shrinkR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Desenha a corrente de almas e o círculo limite de ruptura do Vínculo de Almas.
 */
export function drawSoulTetherBeam(ctx, e, bob) {
  if (!e.tetherActive) return;

  const targetX = player.x - e.x;
  const targetY = player.y - e.y;
  const originY = -12 + bob;

  const tension = e.tetherTension || 0;
  const isHighTension = tension > 0.45;

  ctx.save();

  // 1. Círculo Limite de Ruptura do Vínculo (310px) centrado no Ceifador com pulso e alerta de tensão
  const maxR = e.tetherMaxDist || 310;
  ctx.strokeStyle = isHighTension 
    ? `rgba(255, 71, 87, ${0.40 + tension * 0.40})` 
    : 'rgba(0, 206, 201, 0.40)';
  ctx.lineWidth = 2.2 + tension * 1.5;
  ctx.setLineDash([8, 8]);
  ctx.lineDashOffset = -performance.now() * (0.02 + tension * 0.04);
  ctx.beginPath();
  ctx.arc(0, 0, maxR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Marcadores de pulso nas 4 direções cardeais do anel
  ctx.fillStyle = isHighTension ? '#ff7675' : '#81ecec';
  for (let k = 0; k < 4; k++) {
    const ma = (k * Math.PI) / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(ma) * maxR, Math.sin(ma) * maxR, 3.5 + tension * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Feixe / Corrente de Almas entre Ceifador e Jogador com vibração/estiramento por tensão
  const jitterX = isHighTension ? (Math.random() - 0.5) * (tension * 5.5) : 0;
  const jitterY = isHighTension ? (Math.random() - 0.5) * (tension * 5.5) : 0;

  ctx.strokeStyle = isHighTension 
    ? `rgba(255, 71, 87, ${0.85 + tension * 0.15})` 
    : 'rgba(0, 206, 201, 0.85)';
  ctx.lineWidth = 3.5 + tension * 2.2;
  ctx.setLineDash([10, 6]);
  ctx.lineDashOffset = -performance.now() * (0.04 + tension * 0.08);
  ctx.beginPath();
  ctx.moveTo(0, originY);
  ctx.lineTo(targetX + jitterX, targetY + jitterY);
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6 + tension * 0.8;
  ctx.setLineDash([6, 10]);
  ctx.lineDashOffset = performance.now() * 0.05;
  ctx.beginPath();
  ctx.moveTo(0, originY);
  ctx.lineTo(targetX + jitterX, targetY + jitterY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Orbe de conexão no Jogador
  ctx.strokeStyle = isHighTension ? '#ff4757' : '#00cec9';
  ctx.lineWidth = 2.2 + tension * 1.5;
  ctx.beginPath();
  ctx.arc(targetX, targetY, 22 + tension * 5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = isHighTension ? 'rgba(255, 71, 87, 0.35)' : 'rgba(0, 206, 201, 0.22)';
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(targetX, targetY, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Desenha os Fragmentos de Alma liberados pela destruição das lanternas no espaço do mundo.
 */
export function drawSoulShards(ctx, e, frameCount) {
  if (!e.soulShards || e.soulShards.length === 0) return;

  for (let s of e.soulShards) {
    const bob = Math.sin((frameCount * 0.08) + s.bobOffset) * 5;
    const sx = s.x;
    const sy = s.y + bob;

    ctx.save();
    ctx.translate(sx, sy);

    // 1. Halo difuso exterior pulsante
    const pulse = (Math.sin(frameCount * 0.15 + s.bobOffset) + 1) * 0.5;
    const auraR = s.radius * (1.2 + pulse * 0.4);
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, auraR);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, '#81ecec');
    grad.addColorStop(0.75, 'rgba(0, 206, 201, 0.45)');
    grad.addColorStop(1, 'rgba(0, 206, 201, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.fill();

    // 2. Anel rúnico rotativo ao redor do fragmento
    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -frameCount * 0.05;
    ctx.beginPath();
    ctx.arc(0, 0, s.radius * 1.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Cristal de Essência / Orbe Central
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, s.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // 4. Labareda espectral ascendente
    ctx.fillStyle = 'rgba(129, 236, 236, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-4, -2);
    ctx.quadraticCurveTo(0, -s.radius * 1.8 - pulse * 4, 4, -2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Renderiza o Sino Espectral do Badalo Fúnebre e suas reverberações astrais.
 */
export function drawDeathTollBell(ctx, e, frameCount) {
  const S = e.deathToll;
  if (!S || !S.active) return;

  const bx = S.x || e.x;
  const by = S.y || (e.y - 70);

  ctx.save();
  ctx.translate(bx, by);

  // 1. Correntes astrais verticais conectando o sino ao Ceifador
  ctx.save();
  ctx.strokeStyle = 'rgba(241, 196, 15, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 5]);
  ctx.lineDashOffset = -frameCount * 0.1;
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.lineTo(e.x - bx, (e.y - 15) - by);
  ctx.stroke();
  ctx.restore();

  // 2. Halo difuso do sino pulsante
  const chimePulse = Math.sin(frameCount * 0.15) * 4;
  const haloR = 34 + chimePulse;
  const haloGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, haloR);
  haloGrad.addColorStop(0, 'rgba(255, 234, 167, 0.55)');
  haloGrad.addColorStop(0.5, 'rgba(241, 196, 15, 0.25)');
  haloGrad.addColorStop(1, 'rgba(241, 196, 15, 0)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(0, 0, haloR, 0, Math.PI * 2);
  ctx.fill();

  // 3. Sino Espectral Estilizado (Geometria Gótica)
  const swing = Math.sin(frameCount * 0.25) * 0.12;
  ctx.rotate(swing);

  // Topo do sino (argola / coroa de fixação)
  ctx.strokeStyle = '#ffeaa7';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, -22, 6, 0, Math.PI * 2);
  ctx.stroke();

  // Corpo do sino
  ctx.fillStyle = '#2d3436';
  ctx.strokeStyle = '#f1c40f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-7, -18);
  ctx.bezierCurveTo(-14, -6, -20, 8, -26, 16);
  ctx.quadraticCurveTo(0, 21, 26, 16);
  ctx.bezierCurveTo(20, 8, 14, -6, 7, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Friso dourado / rúnico na boca do sino
  ctx.strokeStyle = '#ffeaa7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-24, 13);
  ctx.quadraticCurveTo(0, 17, 24, 13);
  ctx.stroke();

  // Badalo interno (clapper) oscilando
  const clapperSwing = Math.sin(frameCount * 0.35) * 10;
  ctx.strokeStyle = '#f39c12';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(clapperSwing, 22);
  ctx.stroke();

  ctx.fillStyle = '#ffeaa7';
  ctx.beginPath();
  ctx.arc(clapperSwing, 22, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Renderiza os anéis de som concêntricos do Badalo Fúnebre e suas frestas seguras destacadas.
 */
export function drawDeathTollRings(ctx, e, frameCount) {
  const S = e.deathToll;
  if (!S || !S.rings || S.rings.length === 0) return;

  const bx = e.x;
  const by = e.y;

  ctx.save();
  for (const ring of S.rings) {
    const r = ring.radius;
    if (r <= 5) continue;

    const ringAlpha = Math.max(0, Math.min(1, (ring.maxRadius - r) / (ring.maxRadius * 0.25)));
    const step = (Math.PI * 2) / ring.gapCount;

    for (let g = 0; g < ring.gapCount; g++) {
      const gapCenter = ring.baseGapAngle + g * step;
      const startSafe = gapCenter - ring.gapHalfWidth;
      const endSafe = gapCenter + ring.gapHalfWidth;
      const nextStartSafe = (gapCenter + step) - ring.gapHalfWidth;

      // 1. Arco Letal (entre endSafe e nextStartSafe)
      ctx.save();
      ctx.strokeStyle = ring.hitPlayer 
        ? `rgba(255, 71, 87, ${ringAlpha * 0.85})` 
        : `rgba(241, 196, 15, ${ringAlpha * 0.90})`;
      ctx.lineWidth = 5.5;
      ctx.shadowColor = ring.hitPlayer ? '#ff4757' : '#f1c40f';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.arc(bx, by, r, endSafe, nextStartSafe);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(bx, by, r, endSafe, nextStartSafe);
      ctx.stroke();
      ctx.restore();

      // 2. Fresta Segura (Safe Gap) destacada com arcos tracejados verde-esmeralda/ciano
      ctx.save();
      ctx.strokeStyle = `rgba(46, 204, 113, ${ringAlpha * 0.80})`;
      ctx.lineWidth = 3.5;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -frameCount * 0.08;
      ctx.beginPath();
      ctx.arc(bx, by, r, startSafe, endSafe);
      ctx.stroke();
      ctx.setLineDash([]);

      // Marcadores rúnicos verdes nos limites da fresta segura
      ctx.fillStyle = '#2ecc71';
      const p1x = bx + Math.cos(startSafe) * r;
      const p1y = by + Math.sin(startSafe) * r;
      const p2x = bx + Math.cos(endSafe) * r;
      const p2y = by + Math.sin(endSafe) * r;
      ctx.beginPath();
      ctx.arc(p1x, p1y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p2x, p2y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

/**
 * Renderiza as Fendas Dimensionais (Veil Cleave) no espaço do mundo.
 */
export function drawVeilCleaves(ctx, e, frameCount) {
  if (!e.veilCleaves || e.veilCleaves.length === 0) return;

  ctx.save();
  for (const vc of e.veilCleaves) {
    const cosA = Math.cos(vc.angle);
    const sinA = Math.sin(vc.angle);
    const halfL = vc.length * 0.5;
    const x1 = vc.x - cosA * halfL;
    const y1 = vc.y - sinA * halfL;
    const x2 = vc.x + cosA * halfL;
    const y2 = vc.y + sinA * halfL;

    const baseColor = vc.isEnraged ? '#ff4757' : '#00cec9';
    const rgbColor = vc.isEnraged ? '255, 71, 87' : '0, 206, 201';

    if (!vc.exploded) {
      // 1. Fase de Carga: Fissura espacial se rasgando e atraindo matéria
      const progress = 1 - Math.max(0, vc.timer / vc.maxTimer);
      const pulse = Math.sin(frameCount * 0.35) * 0.25 + 0.75;
      const w = Math.max(4, vc.width * progress);

      // Faixa de perigo / corredor de dano translúcido
      ctx.save();
      ctx.fillStyle = `rgba(${rgbColor}, ${0.12 + progress * 0.18})`;
      ctx.beginPath();
      const perpX = -sinA * (w * 0.5);
      const perpY = cosA * (w * 0.5);
      ctx.moveTo(x1 + perpX, y1 + perpY);
      ctx.lineTo(x2 + perpX, y2 + perpY);
      ctx.lineTo(x2 - perpX, y2 - perpY);
      ctx.lineTo(x1 - perpX, y1 - perpY);
      ctx.closePath();
      ctx.fill();

      // Linhas de borda tracejadas do corredor
      ctx.strokeStyle = `rgba(${rgbColor}, ${0.45 + progress * 0.45})`;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -frameCount * 0.1;
      ctx.beginPath();
      ctx.moveTo(x1 + perpX, y1 + perpY);
      ctx.lineTo(x2 + perpX, y2 + perpY);
      ctx.moveTo(x1 - perpX, y1 - perpY);
      ctx.lineTo(x2 - perpX, y2 - perpY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Fenda central cintilante de vácuo dimensional
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 3 + pulse * 2.5;
      ctx.shadowColor = baseColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Linha de luz branca central afiada
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Indicadores de sucção gravitacional (setas/marcas perpendiculares convergindo para o centro)
      if (progress > 0.3) {
        ctx.strokeStyle = `rgba(${rgbColor}, ${0.5 + pulse * 0.3})`;
        ctx.lineWidth = 1.5;
        const arrowDist = (1 - ((frameCount * 0.05) % 1)) * (w * 0.6 + 10);
        for (let s = -halfL + 40; s < halfL - 20; s += 70) {
          const cx = vc.x + cosA * s;
          const cy = vc.y + sinA * s;
          ctx.beginPath();
          ctx.moveTo(cx - sinA * arrowDist, cy + cosA * arrowDist);
          ctx.lineTo(cx - sinA * (arrowDist * 0.3), cy + cosA * (arrowDist * 0.3));
          ctx.moveTo(cx + sinA * arrowDist, cy - cosA * arrowDist);
          ctx.lineTo(cx + sinA * (arrowDist * 0.3), cy - cosA * (arrowDist * 0.3));
          ctx.stroke();
        }
      }

      ctx.restore();
    } else {
      // 2. Fase Pós-Detonação (Fade Out da cicatriz dimensional)
      const fadeAlpha = Math.max(0, vc.fadeTimer / 24);
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${fadeAlpha})`;
      ctx.lineWidth = vc.width * fadeAlpha * 1.2;
      ctx.shadowColor = baseColor;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(${rgbColor}, ${fadeAlpha * 0.8})`;
      ctx.lineWidth = vc.width * fadeAlpha * 0.6;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

/**
 * Renderiza a jaula das Correntes do Purgatório, suas âncoras colossais e o Elo Fraturado.
 */
export function drawPurgatoryChains(ctx, e, frameCount) {
  const P = e.purgatoryChains;
  if (!P || !P.active || !P.anchors) return;

  ctx.save();

  // 1. Correntes Perimetrais conectando as 4 âncoras
  for (let k = 0; k < 4; k++) {
    const a1 = P.anchors[k];
    const a2 = P.anchors[(k + 1) % 4];
    if (!a1 || !a2) continue;

    const isShattered = (k === P.shatteredLinkIndex);
    const linkActive = a1.active && a2.active;
    if (!linkActive) continue;

    ctx.save();
    if (isShattered) {
      const pulse = Math.sin(frameCount * 0.25) * 0.35 + 0.65;
      ctx.strokeStyle = `rgba(129, 236, 236, ${pulse})`;
      ctx.lineWidth = 4.5;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -frameCount * 0.18;
      ctx.shadowColor = '#00cec9';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.moveTo(a1.x, a1.y);
      ctx.lineTo(a2.x, a2.y);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(a1.x, a1.y);
      ctx.lineTo(a2.x, a2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const midX = (a1.x + a2.x) * 0.5;
      const midY = (a1.y + a2.y) * 0.5;
      const dSize = 8 + Math.sin(frameCount * 0.3) * 3;
      ctx.fillStyle = '#00cec9';
      ctx.beginPath();
      ctx.moveTo(midX, midY - dSize);
      ctx.lineTo(midX + dSize, midY);
      ctx.lineTo(midX, midY + dSize);
      ctx.lineTo(midX - dSize, midY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(midX, midY, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(142, 68, 173, 0.75)';
      ctx.lineWidth = 5.0;
      ctx.shadowColor = '#8e44ad';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(a1.x, a1.y);
      ctx.lineTo(a2.x, a2.y);
      ctx.stroke();

      ctx.strokeStyle = '#a29bfe';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 8]);
      ctx.lineDashOffset = frameCount * 0.08;
      ctx.beginPath();
      ctx.moveTo(a1.x, a1.y);
      ctx.lineTo(a2.x, a2.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // 2. As 4 Âncoras Colossais
  for (let a of P.anchors) {
    ctx.save();
    ctx.translate(a.x, a.y);

    if (a.active) {
      const isBossNear = Math.hypot(e.x - a.x, e.y - a.y) <= 180;

      ctx.save();
      const auraColor = isBossNear ? 'rgba(255, 71, 87, 0.40)' : 'rgba(142, 68, 173, 0.25)';
      ctx.fillStyle = auraColor;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      if (isBossNear) {
        ctx.strokeStyle = 'rgba(255, 71, 87, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.lineDashOffset = -frameCount * 0.15;
        ctx.beginPath();
        ctx.arc(0, 0, a.radius * 1.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();

      ctx.save();
      ctx.fillStyle = a.hitFlash > 0 ? '#ffffff' : '#1e1e24';
      ctx.strokeStyle = isBossNear ? '#ff4757' : '#8e44ad';
      ctx.lineWidth = 3.2;

      ctx.beginPath();
      ctx.moveTo(-14, 18);
      ctx.lineTo(-8, -16);
      ctx.lineTo(0, -24);
      ctx.lineTo(8, -16);
      ctx.lineTo(14, 18);
      ctx.lineTo(0, 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const hpRatio = Math.max(0, Math.min(1, a.hp / a.maxHp));
      const corePulse = Math.sin(frameCount * 0.18 + a.id) * 2;
      ctx.fillStyle = isBossNear ? '#ff4757' : (hpRatio < 0.4 ? '#e74c3c' : '#00cec9');
      ctx.beginPath();
      ctx.arc(0, 0, 5 + corePulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      const bw = 34;
      const bh = 4;
      const bx = -bw * 0.5;
      const by = -30;
      ctx.fillStyle = 'rgba(10, 15, 20, 0.75)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = hpRatio > 0.5 ? '#00cec9' : '#e74c3c';
      ctx.fillRect(bx, by, bw * hpRatio, bh);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = 'rgba(45, 52, 54, 0.65)';
      for (let s = 0; s < 4; s++) {
        const sx = Math.cos(s * 1.5) * 10;
        const sy = Math.sin(s * 1.5) * 8;
        ctx.fillRect(sx - 3, sy - 3, 6, 6);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renderiza a Sombra do Pecador (Trial of the Mirror) e o rastro de chamas no solo.
 */
export function drawSinnerShadow(ctx, e, frameCount) {
  const S = e.sinnerShadow;
  if (!S || !S.active) return;

  ctx.save();

  // 1. Rastro de Chamas Espectrais no Solo
  if (S.trail && S.trail.length > 0) {
    for (let t of S.trail) {
      const alpha = Math.max(0, t.life / t.maxLife);
      const rad = 14 + Math.sin(frameCount * 0.2 + t.x) * 3;

      const grad = ctx.createRadialGradient(t.x, t.y, 2, t.x, t.y, rad);
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.75})`);
      grad.addColorStop(0.35, `rgba(142, 68, 173, ${alpha * 0.65})`);
      grad.addColorStop(0.75, `rgba(108, 92, 231, ${alpha * 0.35})`);
      grad.addColorStop(1, 'rgba(142, 68, 173, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(t.x, t.y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Silhueta Espectral da Sombra do Pecador
  if (S.shadowX !== undefined && S.shadowY !== undefined) {
    ctx.save();
    ctx.translate(S.shadowX, S.shadowY);

    const shadowR = 20 + Math.sin(frameCount * 0.2) * 2;
    const sGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, shadowR);
    sGrad.addColorStop(0, 'rgba(142, 68, 173, 0.65)');
    sGrad.addColorStop(0.6, 'rgba(44, 12, 54, 0.40)');
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.arc(0, 0, shadowR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(20, 10, 28, 0.85)';
    ctx.strokeStyle = '#8e44ad';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, -6, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-10, 16);
    ctx.lineTo(0, 2);
    ctx.lineTo(10, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.arc(-3, -7, 1.8, 0, Math.PI * 2);
    ctx.arc(3, -7, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renderiza a Marcha dos Condenados (Wall of the Restless):
 * Uma colossal onda de almas penadas e lâminas astrais cortando a arena,
 * com 2 Aberturas Seguras (Safe Gateways) destacadas por arcos rúnicos esmeralda/ciano.
 */
export function drawWallOfRestless(ctx, e, frameCount) {
  const W = e.wallOfRestless;
  if (!W || !W.active) return;

  const fc = frameCount || 0;
  const halfLen = W.length * 0.5;
  const halfThick = W.thickness * 0.5;

  ctx.save();
  ctx.translate(W.x, W.y);
  ctx.rotate(W.dirAngle);

  // Ordena os portais seguros ao longo do eixo Y (-halfLen até +halfLen)
  const gates = (W.safeGates || []).map(g => ({
    minY: g.centerOffset - g.width * 0.5,
    maxY: g.centerOffset + g.width * 0.5,
    center: g.centerOffset,
    width: g.width
  })).sort((a, b) => a.minY - b.minY);

  // Determina os intervalos perigosos da muralha (crimson/obsidian plasma)
  const segments = [];
  let curY = -halfLen;
  for (let g of gates) {
    if (g.minY > curY) {
      segments.push({ startY: curY, endY: g.minY });
    }
    curY = Math.max(curY, g.maxY);
  }
  if (curY < halfLen) {
    segments.push({ startY: curY, endY: halfLen });
  }

  // 1. Renderiza os segmentos perigosos da Muralha de Almas
  for (let seg of segments) {
    const segH = seg.endY - seg.startY;
    if (segH <= 0) continue;

    const wallGrad = ctx.createLinearGradient(-halfThick, 0, halfThick, 0);
    wallGrad.addColorStop(0, 'rgba(10, 0, 8, 0)');
    wallGrad.addColorStop(0.25, 'rgba(180, 20, 40, 0.70)');
    wallGrad.addColorStop(0.65, 'rgba(255, 71, 87, 0.92)');
    wallGrad.addColorStop(0.95, 'rgba(255, 255, 255, 0.95)');
    wallGrad.addColorStop(1, 'rgba(255, 71, 87, 0)');

    ctx.fillStyle = wallGrad;
    ctx.fillRect(-halfThick, seg.startY, W.thickness, segH);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(halfThick, seg.startY);
    ctx.lineTo(halfThick, seg.endY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 118, 117, 0.85)';
    ctx.lineWidth = 1.6;
    const toothStep = 45;
    for (let py = seg.startY + 15; py < seg.endY - 10; py += toothStep) {
      const toothPulse = Math.sin(fc * 0.2 + py) * 6;
      ctx.beginPath();
      ctx.moveTo(halfThick - 4, py);
      ctx.lineTo(halfThick + 16 + toothPulse, py + 12);
      ctx.lineTo(halfThick - 6, py + 24);
      ctx.stroke();
    }

    const soulStep = 60;
    for (let sy = seg.startY + 25; sy < seg.endY - 15; sy += soulStep) {
      const soulFloatX = Math.sin(fc * 0.15 + sy * 0.05) * 8;
      const soulFloatY = sy + Math.cos(fc * 0.12 + sy * 0.03) * 6;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.arc(soulFloatX, soulFloatY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff4757';
      ctx.fillRect(soulFloatX + 1.5, soulFloatY - 1.5, 1.5, 1.5);
      ctx.fillRect(soulFloatX + 1.5, soulFloatY + 0.5, 1.5, 1.5);
    }
  }

  // 2. Renderiza as 2 Aberturas Seguras (Safe Gateways)
  for (let g of gates) {
    const gateTop = g.minY;
    const gateBottom = g.maxY;
    const gateHeight = gateBottom - gateTop;

    ctx.save();

    const safeGrad = ctx.createLinearGradient(-halfThick * 1.5, 0, halfThick * 1.5, 0);
    safeGrad.addColorStop(0, 'rgba(46, 204, 113, 0)');
    safeGrad.addColorStop(0.2, 'rgba(46, 204, 113, 0.18)');
    safeGrad.addColorStop(0.5, 'rgba(129, 236, 236, 0.32)');
    safeGrad.addColorStop(0.8, 'rgba(46, 204, 113, 0.18)');
    safeGrad.addColorStop(1, 'rgba(46, 204, 113, 0)');
    ctx.fillStyle = safeGrad;
    ctx.fillRect(-halfThick * 1.5, gateTop, W.thickness * 1.5, gateHeight);

    const pulse = Math.sin(fc * 0.25 + g.center) * 0.3 + 0.7;
    ctx.strokeStyle = `rgba(46, 204, 113, ${pulse})`;
    ctx.lineWidth = 3.0;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -fc * 0.2;

    ctx.beginPath();
    ctx.moveTo(-halfThick * 1.8, gateTop);
    ctx.lineTo(halfThick * 1.8, gateTop);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-halfThick * 1.8, gateBottom);
    ctx.lineTo(halfThick * 1.8, gateBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(-halfThick * 1.2, gateTop, 6, 0, Math.PI * 2);
    ctx.arc(halfThick * 1.2, gateTop, 6, 0, Math.PI * 2);
    ctx.arc(-halfThick * 1.2, gateBottom, 6, 0, Math.PI * 2);
    ctx.arc(halfThick * 1.2, gateBottom, 6, 0, Math.PI * 2);
    ctx.fill();

    const runePulse = Math.sin(fc * 0.18) * 3;
    ctx.strokeStyle = 'rgba(129, 236, 236, 0.85)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, g.center, 12 + runePulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, g.center, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renderiza a Foice Secundária da Dança Macabra (Fase 3 / Dual Scythes).
 */
export function drawOffhandScythe(ctx, e, bob, isVuln, isEnraged, collapseProg = 0, frameCount = 0) {
  ctx.save();
  ctx.translate(-36, -6 + bob + collapseProg * 14);
  ctx.scale(-1, 1);
  const offAngle = -e.scytheAngle * 0.75 + Math.sin((frameCount || 0) * 0.12) * 0.25;
  ctx.rotate(offAngle);

  ctx.save();
  ctx.shadowColor = '#ff4757';
  ctx.shadowBlur = 18;
  drawOrnateScythe(ctx, e, 0, isVuln, true, 0, frameCount);
  ctx.restore();

  ctx.restore();
}

/**
 * Desenha as chamas e orbes de plasma necromântico nas mãos de Thanatos quando desarmado.
 */
export function drawUnarmedSoulFlames(ctx, e, bob, frameCount) {
  const hands = [
    { x: 32, y: -8 + bob, facing: 1 },
    { x: -22, y: 2 + bob, facing: -1 }
  ];

  ctx.save();

  // 1. Arco elétrico conectando as duas mãos
  if (Math.floor(frameCount) % 2 === 0) {
    const midX = (hands[0].x + hands[1].x) * 0.5 + (Math.random() - 0.5) * 8;
    const midY = (hands[0].y + hands[1].y) * 0.5 + (Math.random() - 0.5) * 8;
    ctx.strokeStyle = 'rgba(129, 236, 236, 0.85)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(hands[1].x, hands[1].y);
    ctx.lineTo(midX, midY);
    ctx.lineTo(hands[0].x, hands[0].y);
    ctx.stroke();
  }

  // 2. Esferas de Fogo Fátuo / Plasma Necromântico nas Palmas
  for (let i = 0; i < hands.length; i++) {
    const h = hands[i];
    const pulse = Math.sin(frameCount * 0.22 + i * 2) * 3;
    const flameR = 14 + pulse;

    const flameGrad = ctx.createRadialGradient(h.x, h.y, 1, h.x, h.y, flameR);
    flameGrad.addColorStop(0, '#ffffff');
    flameGrad.addColorStop(0.3, '#81ecec');
    flameGrad.addColorStop(0.7, '#00cec9');
    flameGrad.addColorStop(1, 'rgba(0, 206, 201, 0)');

    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, flameR, 0, Math.PI * 2);
    ctx.fill();

    // Línguas de chamas ondulando para cima
    ctx.fillStyle = 'rgba(129, 236, 236, 0.65)';
    ctx.beginPath();
    ctx.moveTo(h.x - 5, h.y);
    ctx.quadraticCurveTo(
      h.x + (Math.sin(frameCount * 0.3 + i) * 4),
      h.y - 14 - pulse,
      h.x,
      h.y - 20 - pulse
    );
    ctx.quadraticCurveTo(
      h.x + 5,
      h.y - 10,
      h.x + 5,
      h.y
    );
    ctx.closePath();
    ctx.fill();

    // Micro-fagulhas orbitais
    for (let p = 0; p < 2; p++) {
      const pAng = frameCount * 0.15 + p * Math.PI + i;
      const px = h.x + Math.cos(pAng) * 11;
      const py = h.y + Math.sin(pAng) * 11;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
    }
  }

  // 3. Flash de Disparo de Dardos de Alma
  if (e.unarmedDartTimer !== undefined && e.unarmedDartTimer <= 6) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(hands[0].x + 6, hands[0].y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hands[0].x, hands[0].y);
    ctx.lineTo(hands[0].x + 28, hands[0].y);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Desenha a Foice Bumerangue arremessada por Thanatos voando, moendo e retornando.
 */
export function drawBoomerangScythe(ctx, e, frameCount) {
  const S = e.boomerangScythe;
  if (!S || !S.active) return;

  ctx.save();
  ctx.translate(S.x, S.y);

  // 1. Rastros de Movimento Espectrais (Ghost Trails / Motion Blur)
  for (let ghost = 2; ghost >= 1; ghost--) {
    ctx.save();
    ctx.rotate(S.angle - ghost * 0.28);
    ctx.globalAlpha = 0.16 / ghost;
    ctx.translate(-36 * 0.7, 10 * 0.7);
    ctx.scale(0.7, 0.7);
    const ghostBoss = { scytheAngle: 0, scytheGlow: 0.5, crankAngle: 0 };
    drawOrnateScythe(ctx, ghostBoss, 0, false, false, 0, frameCount);
    ctx.restore();
  }

  // 2. Anel Periférico de Velocidade Rotacional
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 206, 201, 0.45)';
  ctx.lineWidth = 2.4;
  ctx.setLineDash([12, 8]);
  ctx.lineDashOffset = -frameCount * 4;
  ctx.beginPath();
  ctx.arc(0, 0, S.radius || 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 3. Efeito Especial de Moedor Giratório (GRINDING State)
  if (S.state === 'GRINDING') {
    ctx.save();
    const grindPulse = Math.sin(frameCount * 0.4) * 4;
    const grindR = (S.radius || 34) + grindPulse;

    // Disco de Fricção e Plasma de Alta Rotação
    const sawGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, grindR);
    sawGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    sawGrad.addColorStop(0.35, 'rgba(129, 236, 236, 0.65)');
    sawGrad.addColorStop(0.75, 'rgba(0, 206, 201, 0.45)');
    sawGrad.addColorStop(1.0, 'rgba(0, 206, 201, 0)');
    ctx.fillStyle = sawGrad;
    ctx.beginPath();
    ctx.arc(0, 0, grindR, 0, Math.PI * 2);
    ctx.fill();

    // Dentes Radiais de Serra de Corte Rápido
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    const teeth = 12;
    const tRot = frameCount * 0.45;
    for (let t = 0; t < teeth; t++) {
      const ta = tRot + (t * Math.PI * 2) / teeth;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ta) * (grindR * 0.6), Math.sin(ta) * (grindR * 0.6));
      ctx.lineTo(Math.cos(ta) * grindR, Math.sin(ta) * grindR);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Slipstream de Retorno Conectando a Thanatos (RETURNING State)
  if (S.state === 'RETURNING') {
    ctx.save();
    const toBossAng = Math.atan2(e.y - S.y, e.x - S.x);
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.55)';
    ctx.lineWidth = 3.2;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -frameCount * 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(toBossAng) * 60, Math.sin(toBossAng) * 60);
    ctx.stroke();
    ctx.restore();
  }

  // 5. Corpo Principal da Foice Monumental Girando
  ctx.save();
  ctx.rotate(S.angle);
  ctx.translate(-36 * 0.7, 10 * 0.7);
  ctx.scale(0.7, 0.7);
  const spinningBoss = {
    scytheAngle: 0,
    scytheGlow: S.state === 'GRINDING' ? 1.0 : 0.8,
    crankAngle: Math.sin(frameCount * 0.3) * 0.5
  };
  drawOrnateScythe(ctx, spinningBoss, 0, false, false, 0, frameCount);
  ctx.restore();

  ctx.restore();
}

/**
 * Desenha os Poços de Almas (círculos rúnicos que detonam em geysers e deixam miasma).
 */
export function drawSoulWells(ctx, e, frameCount) {
  if (!e.soulWells || e.soulWells.length === 0) return;

  for (let well of e.soulWells) {
    ctx.save();
    ctx.translate(well.x, well.y);

    if (!well.detonated) {
      const chargeProg = Math.max(0, Math.min(1, 1 - (well.timer / well.maxTimer)));
      const pulse = Math.sin(frameCount * 0.25) * 3;
      const wellR = well.radius || 44;

      // 1. Círculo Rúnico no Chão (Perspectiva Isométrica)
      ctx.save();
      ctx.scale(1, 0.48);

      // Fundo abissal do poço
      const poolGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, wellR);
      poolGrad.addColorStop(0, 'rgba(0, 206, 201, 0.40)');
      poolGrad.addColorStop(0.65, 'rgba(5, 20, 28, 0.60)');
      poolGrad.addColorStop(1, 'rgba(2, 6, 12, 0)');
      ctx.fillStyle = poolGrad;
      ctx.beginPath();
      ctx.arc(0, 0, wellR, 0, Math.PI * 2);
      ctx.fill();

      // Borda Rúnica Ciano
      ctx.strokeStyle = chargeProg > 0.80 ? '#ffffff' : '#00cec9';
      ctx.lineWidth = chargeProg > 0.80 ? 3.0 : 2.0;
      ctx.beginPath();
      ctx.arc(0, 0, wellR, 0, Math.PI * 2);
      ctx.stroke();

      // Runas e dentes ao redor do anel
      const runeCount = 8;
      const rAng = frameCount * 0.04;
      ctx.strokeStyle = '#81ecec';
      ctx.lineWidth = 1.4;
      for (let k = 0; k < runeCount; k++) {
        const a = rAng + (k * Math.PI * 2 / runeCount);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (wellR - 5), Math.sin(a) * (wellR - 5));
        ctx.lineTo(Math.cos(a) * (wellR + 4), Math.sin(a) * (wellR + 4));
        ctx.stroke();
      }

      // Anel de Contração (Tempo até detonação)
      const shrinkR = Math.max(4, wellR * (1 - chargeProg));
      ctx.strokeStyle = chargeProg > 0.80 ? '#ffffff' : '#81ecec';
      ctx.lineWidth = chargeProg > 0.80 ? 3.2 : 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, shrinkR, 0, Math.PI * 2);
      ctx.stroke();

      // Glifo Central das Almas
      ctx.fillStyle = chargeProg > 0.80 ? '#ffffff' : '#00cec9';
      ctx.beginPath();
      ctx.arc(0, 0, 4 + pulse * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 2. Fagulhas e Vapores Ascendentes (Espaço Vertical)
      const wispCount = 4;
      for (let w = 0; w < wispCount; w++) {
        const wPhase = (frameCount * 0.06 + w * 0.25) % 1;
        const wX = Math.sin(frameCount * 0.1 + w * 1.5) * (wellR * 0.55);
        const wY = -wPhase * 45;
        const wAlpha = Math.sin(wPhase * Math.PI) * 0.8;
        ctx.fillStyle = `rgba(129, 236, 236, ${wAlpha})`;
        ctx.beginPath();
        ctx.arc(wX, wY, 2.5 * (1 - wPhase * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Estado Detonado: Miasma Residual no Chão
      const miasmaProg = Math.max(0, Math.min(1, well.miasmaTimer / 140));
      const wellR = well.radius || 44;

      ctx.save();
      ctx.scale(1, 0.48);

      const miasmaGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, wellR);
      miasmaGrad.addColorStop(0, `rgba(0, 206, 201, ${0.45 * miasmaProg})`);
      miasmaGrad.addColorStop(0.5, `rgba(6, 32, 40, ${0.35 * miasmaProg})`);
      miasmaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = miasmaGrad;
      ctx.beginPath();
      ctx.arc(0, 0, wellR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(0, 206, 201, ${0.35 * miasmaProg})`;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, wellR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      // Bolhas e fumaça tóxica
      for (let b = 0; b < 3; b++) {
        const bPhase = (frameCount * 0.04 + b * 0.33) % 1;
        const bx = Math.cos(b * 2.1) * (wellR * 0.4);
        const by = -bPhase * 30;
        ctx.fillStyle = `rgba(0, 206, 201, ${0.35 * miasmaProg * (1 - bPhase)})`;
        ctx.beginPath();
        ctx.arc(bx, by, 3 * (1 - bPhase * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

/**
 * Desenha a Guilhotina Celestial e a telegrafia de Marca da Morte com retículo de travamento.
 */
export function drawDeathMarkExecution(ctx, e, frameCount) {
  return;
}

/**
 * Desenha as réplicas espectrais e cones de corte convergente da Tríade das Sombras.
 */
export function drawTriadClones(ctx, e, frameCount) {
  if (!e.triadClones || e.triadClones.length === 0) return;

  for (let clone of e.triadClones) {
    ctx.save();
    ctx.translate(clone.x, clone.y);
    ctx.globalAlpha = clone.alpha !== undefined ? clone.alpha : 1.0;

    const cloneFacing = Math.cos(clone.slashAngle) >= 0 ? 1 : -1;
    ctx.scale(cloneFacing, 1);

    const cBob = Math.sin(frameCount * 0.12) * 4;
    ctx.save();
    ctx.scale(REAPER_CONFIG.BODY_SCALE, REAPER_CONFIG.BODY_SCALE);

    // 1. Sombra e Manto Espectral da Réplica
    drawReaperShadow(ctx, e, cBob, false, 0);

    // Asas Espectrais do Clone
    drawSpectralWings(ctx, e, cBob, false, false, 0, 0.95);

    // Manto Espectral Translúcido
    ctx.save();
    ctx.fillStyle = 'rgba(4, 24, 34, 0.75)';
    ctx.beginPath();
    ctx.ellipse(0, -6 + cBob, 26, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();

    // Máscara e Olhos Brilhantes
    drawMaskAndEyes(ctx, e, cBob, frameCount, false, false, 0);

    // Foice Espectral erguida pronta para o corte
    ctx.save();
    ctx.translate(28, -12 + cBob);
    ctx.rotate(0.35);
    const cloneBoss = { scytheAngle: 0.2, scytheGlow: 1.0, crankAngle: 0 };
    drawOrnateScythe(ctx, cloneBoss, 0, false, false, 0, frameCount);
    ctx.restore();

    ctx.restore();

    // 2. Telegrafia do Corte Convergente (Cone de Corte Iminente)
    if (!clone.slashed) {
      ctx.save();
      const relAngle = cloneFacing === -1 ? (Math.PI - clone.slashAngle) : clone.slashAngle;
      const coneR = 175;
      const coneArc = Math.PI * 0.45;

      ctx.fillStyle = 'rgba(0, 206, 201, 0.16)';
      ctx.strokeStyle = 'rgba(129, 236, 236, 0.75)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, coneR, relAngle - coneArc / 2, relAngle + coneArc / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }
}

// ============================================================================
// 4. FUNÇÃO MESTRE DE RENDERIZAÇÃO GRÁFICA DO CHEFE
// ============================================================================

/**
 * Função principal de renderização gráfica exportada de Thanatos, o Ceifador Supremo.
 * @param {CanvasRenderingContext2D} ctx Contexto de renderização 2D.
 * @param {Object} e Entidade do chefe.
 * @param {number} frameCount Contador de frames global.
 */
export function drawSupremeReaper(ctx, e, frameCount) {
  // 1. Introdução Cinemática de 6 segundos
  if (e.actionState === REAPER_STATES.SPAWN_INTRO) {
    drawReaperSpawnIntro(ctx, e, frameCount);
    if (e.titleTimer > 0) {
      drawCinematicScreenTitle(bannerCtx || ctx, e, frameCount);
    }
    return;
  }

  // 2. Banner de apresentação (ativo durante e após a intro)
  if (e.titleTimer > 0) {
    drawCinematicScreenTitle(bannerCtx || ctx, e, frameCount);
  }

  const morph = e.phaseCinematic ? (e.phaseCinematic.morphProgress || 0) : (e.transformationProgress || 0);
  const targetPhase = e.phaseCinematic ? e.phaseCinematic.phase : (e.isPhase3 ? 3 : (e.isEnraged ? 2 : 1));
  const isVuln = e.isVulnerable;
  const isEnraged = e.isEnraged || e.isPhase3 || (targetPhase >= 2 && morph > 0.05);
  const isPhase3 = e.isPhase3 || (targetPhase === 3 && morph > 0.05);
  const isWindup = (
    e.actionState === REAPER_STATES.WINDUP_RANGED ||
    e.actionState === REAPER_STATES.WINDUP ||
    e.actionState === REAPER_STATES.WINDUP_BOOMERANG ||
    e.actionState === REAPER_STATES.WINDUP_EXECUTION ||
    e.actionState === REAPER_STATES.WINDUP_SOUL_WELLS ||
    e.actionState === REAPER_STATES.WINDUP_TRIAD_SLASH
  );
  const isHarvest = e.actionState === REAPER_STATES.VORTEX_HARVEST;
  const isAimingBlink = e.actionState === REAPER_STATES.BLINK_AIM;

  const collapseProg = e.collapseProgress || 0;
  const bob = isVuln ? (22 + collapseProg * 6) : (e.floatBob || 0);

  // 3. ELEMENTOS DO ESPAÇO DO MUNDO (Não invertidos horizontalmente)
  ctx.save();
  if (e.facing === -1) {
    ctx.scale(-1, 1);
  }

  // Elementos do Mundo em Coordenadas Globais Absolutas
  ctx.save();
  ctx.translate(-e.x, -e.y);
  drawReaperRanged(ctx, e, frameCount);
  drawSoulWells(ctx, e, frameCount);
  drawBoomerangScythe(ctx, e, frameCount);
  drawDeathMarkExecution(ctx, e, frameCount);
  drawTriadClones(ctx, e, frameCount);
  drawSoulShards(ctx, e, frameCount);
  drawDeathTollRings(ctx, e, frameCount);
  drawDeathTollBell(ctx, e, frameCount);
  drawVeilCleaves(ctx, e, frameCount);
  drawPurgatoryChains(ctx, e, frameCount);
  drawSinnerShadow(ctx, e, frameCount);
  drawWallOfRestless(ctx, e, frameCount);
  ctx.restore();

  if (isHarvest) {
    drawHarvestField(ctx, e, frameCount);
  }

  drawSoulScytheAimLines(ctx, e, frameCount);
  drawBlinkAimIndicator(ctx, e, frameCount);
  drawSoulTetherBeam(ctx, e, bob);
  drawGhostTrail(ctx, e);
  drawAfterImages(ctx, e);
  drawEyeTrails(ctx, e);
  drawGothicLanterns(ctx, e, bob, frameCount, isEnraged);

  if (isVuln) drawRecoveryGliph(ctx, e, frameCount);

  ctx.restore();

  // 4. Corpo 20% maior; efeitos em coordenadas de mundo conservam sua geometria.
  ctx.save();
  ctx.scale(REAPER_CONFIG.BODY_SCALE, REAPER_CONFIG.BODY_SCALE);

  if (isAimingBlink) {
    ctx.globalAlpha = 0.65 + Math.sin(frameCount * 0.3) * 0.25;
  }

  if (isWindup || isHarvest) {
    ctx.translate((Math.random() - 0.5) * 3.5, (Math.random() - 0.5) * 3.5);
  }

  // Inclinação inercial de voo (Tilt)
  if (e.tilt) {
    ctx.rotate(e.tilt);
  }

  drawReaperShadow(ctx, e, bob, isVuln, collapseProg);

  // Aura espectral de almas e chamas astrais em slow motion durante a transição cinematográfica
  if (e.phaseCinematic && morph > 0.05) {
    ctx.save();
    const soulAlpha = Math.sin(morph * Math.PI) * 0.65;
    const soulCol = targetPhase === 3 ? '223, 230, 233' : '162, 155, 254';
    const soulGrad = ctx.createRadialGradient(0, -20 + bob, 15, 0, -20 + bob, 130 * (0.8 + 0.45 * morph));
    soulGrad.addColorStop(0, `rgba(${soulCol}, ${soulAlpha * 0.45})`);
    soulGrad.addColorStop(0.6, `rgba(${soulCol}, ${soulAlpha * 0.15})`);
    soulGrad.addColorStop(1, `rgba(${soulCol}, 0)`);
    ctx.fillStyle = soulGrad;
    ctx.beginPath();
    ctx.arc(0, -20 + bob, 130 * (0.8 + 0.45 * morph), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawSpectralWings(ctx, e, bob, isVuln, isEnraged, e.wingFlap || 0);
  drawEclipseHalo(ctx, e, bob, frameCount, isVuln, isEnraged, isPhase3, collapseProg);
  drawDorsalSpineAndBackRibs(ctx, bob, frameCount, isVuln, isEnraged, collapseProg);
  drawReaperRobe(ctx, e, bob, frameCount, isVuln, isEnraged, e.tilt || 0, collapseProg);
  drawSoulNexusCore(ctx, bob, frameCount, isVuln, isEnraged, collapseProg, isPhase3);
  drawFrontRibcageArmor(ctx, bob, frameCount, isVuln, isEnraged, collapseProg);

  // Braços esqueléticos e manoplas conectando a foice
  if (!e.isUnarmed) {
    drawReaperArmsAndGauntlets(ctx, e, bob, frameCount, isVuln, isEnraged, e.scytheAngle, collapseProg);
  }

  drawMaskAndEyes(ctx, e, bob, frameCount, isVuln, isEnraged, collapseProg);
  drawReaperRegalia(ctx, e, bob, frameCount, isVuln, isEnraged, isPhase3, collapseProg);

  // Quando desarmado (Foice arremessada), renderiza chamas espirituais nas mãos
  if (e.isUnarmed) {
    drawUnarmedSoulFlames(ctx, e, bob, frameCount);
  } else {
    drawOrnateScythe(ctx, e, bob, isVuln, isEnraged, collapseProg, frameCount);
    if (e.hasDualScythes || isPhase3) {
      drawOffhandScythe(ctx, e, bob, isVuln, isEnraged, collapseProg, frameCount);
    }
  }

  ctx.restore();
}
