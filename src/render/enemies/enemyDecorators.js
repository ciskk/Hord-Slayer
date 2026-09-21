/**
 * src/render/enemies/enemyDecorators.js
 * 
 * Módulo especializado em decorators visuais transversais para monstros:
 * - Overlays de status (atordoamento, lentidão e auras/coroas de elite)
 * - HUD suspensa de Minibosses (barra de HP, moldura metálica e cast bar)
 * - Decorações de solo 2.5D (sombras elípticas, ondas de choque, miras de salto e fendas de emergência)
 * - Deformações cinemáticas (elevação em Z, squash elástico de antecipação e bounce de pouso)
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza overlays de status sobre a criatura (Stun, Slow, Elite Auras & Crown).
 * @param {Object} e Entidade do inimigo
 */
export function drawEnemyStatusOverlays(e) {
  if (e.stunTimer > 0) {
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    for (let s = 0; s < 3; s++) {
      const starAng = frameCount * 0.18 + s * (Math.PI * 2 / 3);
      const starR = e.radius + 8;
      const sx = Math.cos(starAng) * starR;
      const sy = Math.sin(starAng) * (starR * 0.45) - (e.radius + 12);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
    }
  }

  if (e.slowTimer > 0) {
    const pulseSlow = Math.sin(frameCount * 0.25) * 2;
    ctx.strokeStyle = '#74b9ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 4 + pulseSlow, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(116, 185, 255, 0.65)';
    for (let sp = 0; sp < 4; sp++) {
      const spAng = sp * (Math.PI / 2) + frameCount * 0.05;
      const spDist = e.radius + 5;
      ctx.fillRect(Math.cos(spAng) * spDist - 2, Math.sin(spAng) * spDist - 2, 4, 4);
    }
  }

  if (e.isElite) {
    const auraPulse = Math.sin(frameCount * 0.2) * 3;
    let aColor = '#00d2d3';
    if (e.eliteMod === 'HASTE') aColor = '#f1c40f';
    if (e.eliteMod === 'TOXIC') aColor = '#2ecc71';
    if (e.eliteMod === 'FROST') aColor = '#74b9ff';
    ctx.strokeStyle = aColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 6 + auraPulse, 0, Math.PI * 2);
    ctx.stroke();

    // Coroa Elemental Flutuante acima da cabeça
    const crownY = -e.radius - 14 + Math.sin(frameCount * 0.15) * 2;
    ctx.save();
    ctx.translate(0, crownY);
    ctx.strokeStyle = aColor;
    ctx.lineWidth = 1.8;
    ctx.fillStyle = aColor;
    ctx.beginPath();
    ctx.moveTo(-6, 2);
    ctx.lineTo(-7, -4);
    ctx.lineTo(-2, -1);
    ctx.lineTo(0, -6);
    ctx.lineTo(2, -1);
    ctx.lineTo(7, -4);
    ctx.lineTo(6, 2);
    ctx.closePath();
    ctx.stroke();
    ctx.fillRect(-1.5, -2, 3, 3);
    ctx.restore();

    if (e.eliteMod === 'FROST') {
      ctx.fillStyle = 'rgba(116, 185, 255, 0.85)';
      for (let cr = 0; cr < 3; cr++) {
        const crA = frameCount * 0.04 + cr * (Math.PI * 2 / 3);
        const crX = Math.cos(crA) * (e.radius + 7);
        const crY = Math.sin(crA) * (e.radius + 7);
        ctx.beginPath();
        ctx.moveTo(crX, crY - 5);
        ctx.lineTo(crX + 3.5, crY);
        ctx.lineTo(crX, crY + 5);
        ctx.lineTo(crX - 3.5, crY);
        ctx.closePath();
        ctx.fill();
      }
    } else if (e.eliteMod === 'TOXIC') {
      ctx.fillStyle = 'rgba(46, 204, 113, 0.75)';
      for (let tb = 0; tb < 4; tb++) {
        const tbA = frameCount * 0.05 + tb * 1.6;
        const tbDist = e.radius + 6 + Math.sin(frameCount * 0.12 + tb) * 3;
        ctx.beginPath();
        ctx.arc(Math.cos(tbA) * tbDist, Math.sin(tbA) * tbDist, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (e.eliteMod === 'HASTE') {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 1.6;
      for (let h = 0; h < 3; h++) {
        const hA = frameCount * 0.1 + h * (Math.PI * 2 / 3);
        const hR = e.radius + 5;
        const hx = Math.cos(hA) * hR;
        const hy = Math.sin(hA) * hR;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + 3, hy - 4);
        ctx.lineTo(hx + 1, hy - 2);
        ctx.lineTo(hx + 4, hy - 6);
        ctx.stroke();
      }
    }
  }
}

/**
 * Renderiza a interface suspensa de Miniboss (Barra de HP, Nome Dourado e Cast Bar).
 * @param {Object} e Entidade do Miniboss
 */
export function drawMiniBossHpOverlay(e) {
  const barW = 64;
  const barH = 6;
  const hpPct = Math.max(0, e.hp / e.maxHp);
  const offsetY = -e.radius - 22;

  ctx.save();
  // 1. Nome Dourado Estilizado do Miniboss
  ctx.font = "bold 9px 'Cinzel', 'Outfit', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  const bossTitle = (e.enraged ? "⚡ " : "★ ") + (e.name ? e.name.toUpperCase() : "MINIBOSS");
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillText(bossTitle, 0, offsetY - 2);
  ctx.fillStyle = e.enraged ? '#ff4757' : '#f1c40f';
  ctx.fillText(bossTitle, 0, offsetY - 3);

  // 2. Fundo e Barra de Vida Elite
  ctx.fillStyle = 'rgba(10, 12, 16, 0.9)';
  ctx.fillRect(-barW / 2, offsetY, barW, barH);
  
  ctx.fillStyle = e.enraged ? '#e74c3c' : (e.isStoneForm ? '#95a5a6' : '#f39c12');
  ctx.fillRect(-barW / 2, offsetY, barW * hpPct, barH);
  
  ctx.strokeStyle = e.enraged ? '#ff6b81' : '#f1c40f';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-barW / 2, offsetY, barW, barH);

  // 3. Barra de Conjuração (Cast Bar) em tempo real durante o WINDUP
  if (e.actionState === 'WINDUP' && e.castProgress !== undefined) {
    const castW = barW - 6;
    const castH = 3.5;
    const castY = offsetY + barH + 3;
    const prog = Math.max(0, Math.min(1, e.castProgress));

    ctx.fillStyle = 'rgba(15, 15, 20, 0.85)';
    ctx.fillRect(-castW / 2, castY, castW, castH);
    ctx.fillStyle = '#00cec9';
    ctx.fillRect(-castW / 2, castY, castW * prog, castH);
    ctx.strokeStyle = '#81ecec';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-castW / 2, castY, castW, castH);
  }

  // 4. Anel de Ameaça Rúnico sob o Miniboss
  ctx.strokeStyle = e.enraged ? 'rgba(231, 76, 60, 0.65)' : 'rgba(243, 156, 18, 0.45)';
  ctx.lineWidth = e.enraged ? 2.8 : 2.0;
  ctx.beginPath();
  ctx.arc(0, 0, e.radius + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Renderiza sombras, telegrafias e alertas de emergência no solo.
 * @param {Object} e Entidade do monstro comum
 * @returns {number} shadowY Posição Y da sombra para sincronização
 */
export function drawCommonEnemyGroundDecorations(e) {
  // Sombra base agora é renderizada de forma agrupada (batched) em renderEnemiesShadows para máxima performance.
  const isFlying = e.baseType === 'BAT' || e.baseType === 'NECRO';
  const shadowBob = e.baseType === 'BAT' ? Math.sin(frameCount * 0.42) * 1.2 : 0;
  const shadowR = e.baseType === 'ZOMBIE' ? e.radius * 1.38 : e.radius;
  const shadowY = shadowR * (isFlying ? 0.95 : 0.8) + shadowBob;

  // Onda de Choque de Aterrissagem Cáustica no Solo
  if (e.landingSplashTimer > 0) {
    const splashProg = 1 - (e.landingSplashTimer / 16);
    const splashR = e.radius * (1.1 + splashProg * 1.6);
    ctx.save();
    ctx.strokeStyle = `rgba(0, 206, 201, ${0.85 * (1 - splashProg)})`;
    ctx.lineWidth = 2.4 * (1 - splashProg * 0.6);
    ctx.beginPath();
    ctx.ellipse(0, shadowY, splashR, splashR * 0.46, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(46, 204, 113, ${0.75 * (1 - splashProg)})`;
    for (let sp = 0; sp < 4; sp++) {
      const spA = sp * (Math.PI * 0.5) + splashProg * 0.8;
      const spDist = splashR * 0.85;
      ctx.fillRect(Math.cos(spA) * spDist - 1.5, shadowY + Math.sin(spA) * (spDist * 0.45) - 1.5, 3, 3);
    }
    ctx.restore();
  }

  // Telegrafia Direcional Pontilhada durante a Antecipação do Salto (Windup)
  if (e.leapState === 'windup') {
    const windupProg = Math.min(1, (e.leapTimer || 0) / (e.leapDuration || 12));
    const targetDist = Math.min(145, (e.leapSpeed || 9) * 14);
    const targetX = Math.cos(e.leapAngle || 0) * targetDist * (e.facing || 1);
    const targetY = shadowY + Math.sin(e.leapAngle || 0) * targetDist * 0.55;

    ctx.save();
    ctx.strokeStyle = `rgba(0, 206, 201, ${0.4 + windupProg * 0.55})`;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -frameCount * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, shadowY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    const targetRadius = (e.radius + 6) * (0.8 + windupProg * 0.4);
    ctx.strokeStyle = `rgba(255, 71, 87, ${0.65 + windupProg * 0.35})`;
    ctx.fillStyle = `rgba(0, 206, 201, ${0.12 + windupProg * 0.18})`;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(targetX, targetY, targetRadius, targetRadius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(targetX - 4, targetY);
    ctx.lineTo(targetX + 4, targetY);
    ctx.moveTo(targetX, targetY - 3);
    ctx.lineTo(targetX, targetY + 3);
    ctx.stroke();
    ctx.restore();
  }

  // 1.1 Telegrafia e Alerta de Emergência do Solo (Zumbis vs Vermes Cáusticos)
  if (e.emergeTimer > 0) {
    const emergeDuration = e.emergeDuration || 26;
    const progress = Math.max(0, Math.min(1, 1 - (e.emergeTimer / emergeDuration)));
    const groundRadius = e.radius * 1.5;
    const pulseAlert = Math.sin(frameCount * 0.3) * 2;
    const isWorm = e.baseType === 'SPLITTER' || e.baseType === 'SPLITTER_MINI' || e.baseType === 'TRAIL_CRAWLER';

    ctx.save();
    if (isWorm) {
      const bileRadius = groundRadius * 1.35;
      const bilePulse = Math.sin(frameCount * 0.28) * 2;

      ctx.fillStyle = '#021814';
      ctx.beginPath();
      ctx.ellipse(0, shadowY, bileRadius * 0.88, bileRadius * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#0e5344';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.ellipse(0, shadowY, bileRadius * 0.95, bileRadius * 0.46, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#1abc9c';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let t = 0; t < 7; t++) {
        const tAng = t * (Math.PI * 2 / 7) + 0.18;
        const tLen = bileRadius * (0.55 + ((t * 3) % 4) * 0.18);
        ctx.moveTo(0, shadowY);
        ctx.quadraticCurveTo(
          Math.cos(tAng + 0.3) * (tLen * 0.6),
          shadowY + Math.sin(tAng + 0.3) * (tLen * 0.3),
          Math.cos(tAng) * tLen,
          shadowY + Math.sin(tAng) * (tLen * 0.48)
        );
      }
      ctx.stroke();

      ctx.strokeStyle = `rgba(0, 206, 201, ${0.6 + progress * 0.4})`;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(0, shadowY, groundRadius + bilePulse, (groundRadius + bilePulse) * 0.48, 0, -Math.PI * 0.5, -Math.PI * 0.5 + progress * Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(0, 206, 201, ${0.1 + (1 - progress) * 0.22})`;
      ctx.beginPath();
      ctx.ellipse(0, shadowY, groundRadius + bilePulse, (groundRadius + bilePulse) * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let b = 0; b < 4; b++) {
        const bA = frameCount * 0.15 + b * 1.57;
        const bDist = groundRadius * (0.42 + (b % 2) * 0.35);
        const bR = 2.2 + Math.sin(frameCount * 0.3 + b * 2) * 1.2;
        ctx.fillStyle = b % 2 === 0 ? '#2ecc71' : '#00cec9';
        ctx.beginPath();
        ctx.arc(Math.cos(bA) * bDist, shadowY + Math.sin(bA) * (bDist * 0.45), Math.max(1, bR), 0, Math.PI * 2);
        ctx.fill();
      }

      if (progress < 0.88) {
        const alertY = shadowY - e.radius - 12 + Math.sin(frameCount * 0.25) * 2;
        ctx.fillStyle = '#00cec9';
        ctx.beginPath();
        ctx.moveTo(-5, alertY - 5);
        ctx.lineTo(-1, alertY);
        ctx.lineTo(-4, alertY + 5);
        ctx.lineTo(-6, alertY + 2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(5, alertY - 5);
        ctx.lineTo(1, alertY);
        ctx.lineTo(4, alertY + 5);
        ctx.lineTo(6, alertY + 2);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#1c1510';
      ctx.beginPath();
      ctx.ellipse(0, shadowY, groundRadius * 0.85, groundRadius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(231, 76, 60, ${0.5 + progress * 0.5})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, shadowY, groundRadius + pulseAlert, (groundRadius + pulseAlert) * 0.5, 0, -Math.PI * 0.5, -Math.PI * 0.5 + progress * Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#533b28';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let cr = 0; cr < 6; cr++) {
        const crAng = cr * (Math.PI / 3) + 0.25;
        const crLen = groundRadius * (0.6 + (cr % 3) * 0.25);
        ctx.moveTo(0, shadowY);
        ctx.lineTo(Math.cos(crAng) * crLen, shadowY + Math.sin(crAng) * (crLen * 0.5));
      }
      ctx.stroke();

      ctx.fillStyle = '#3a2717';
      for (let cl = 0; cl < 5; cl++) {
        const clAng = cl * 1.25 + frameCount * 0.05;
        const clDist = groundRadius * 0.65;
        ctx.fillRect(Math.cos(clAng) * clDist - 2, shadowY + Math.sin(clAng) * (clDist * 0.5) - 2, 4, 3);
      }

      if (progress < 0.85) {
        const alertY = shadowY - e.radius - 10 + Math.sin(frameCount * 0.2) * 2;
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.moveTo(0, alertY - 6);
        ctx.lineTo(4, alertY + 2);
        ctx.lineTo(-4, alertY + 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-0.8, alertY - 3, 1.6, 3);
        ctx.fillRect(-0.8, alertY + 1, 1.6, 1.5);
      }
    }
    ctx.restore();
  }

  // 1.2 Telegrafia de Carga Predatória Ativa no Solo (Demolidor, Golem, Vermes)
  if (e.isCharging && e.chargeWindupTimer > 0) {
    const windupMax = e.chargeWindupMax || 35;
    const windupRatio = Math.max(0, Math.min(1, 1 - (e.chargeWindupTimer / windupMax)));
    const threatR = e.radius * 2.2;

    ctx.save();
    ctx.rotate(e.chargeAngle || 0);

    const warnGrad = ctx.createRadialGradient(0, shadowY, 4, 0, shadowY, threatR);
    warnGrad.addColorStop(0, 'rgba(255, 71, 87, 0.45)');
    warnGrad.addColorStop(0.75, 'rgba(255, 71, 87, 0.18)');
    warnGrad.addColorStop(1, 'rgba(255, 71, 87, 0.0)');
    ctx.fillStyle = warnGrad;
    ctx.beginPath();
    ctx.arc(0, shadowY, threatR, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.lineTo(0, shadowY);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 71, 87, ${0.6 + windupRatio * 0.4})`;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, shadowY, threatR, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, shadowY, threatR * Math.max(0.2, windupRatio), -Math.PI * 0.42, Math.PI * 0.42);
    ctx.stroke();

    ctx.restore();
  }

  return shadowY;
}

/**
 * Aplica as transformações matriciais de elevação em Z e deformações dinâmicas de squash/bounce.
 * @param {Object} e Entidade do monstro comum
 */
export function applyKinematicDeformations(e) {
  if (e.jumpZ > 0) {
    ctx.translate(0, -e.jumpZ);
    ctx.scale(1.28, 0.78);
    if (e.baseType === 'SPLITTER_MINI') {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#00cec9';
      ctx.beginPath();
      ctx.arc(-e.radius * 0.7, 0, e.radius * 0.75, 0, Math.PI * 2);
      ctx.arc(-e.radius * 1.3, 0, e.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (e.leapState === 'windup') {
    const windupProg = Math.min(1, (e.leapTimer || 0) / (e.leapDuration || 12));
    const squashScale = 1 + Math.sin(windupProg * Math.PI) * 0.28;
    const stretchY = 1 - Math.sin(windupProg * Math.PI) * 0.28;
    const tensionJitter = (Math.random() - 0.5) * 1.5;
    ctx.translate(tensionJitter, 0);
    ctx.scale(squashScale, stretchY);
  } else if (e.leapState === 'landing') {
    const landProg = Math.min(1, (e.leapTimer || 0) / (e.leapDuration || 8));
    const bounceX = 1 + (1 - landProg) * 0.35;
    const bounceY = 1 - (1 - landProg) * 0.30;
    ctx.scale(bounceX, bounceY);
  }
}
