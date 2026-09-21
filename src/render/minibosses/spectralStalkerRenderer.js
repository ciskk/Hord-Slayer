/**
 * src/render/minibosses/spectralStalkerRenderer.js
 * 
 * Renderizador procedural modular do Miniboss Predador Espectral (SPECTRAL_STALKER).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva do Miniboss.
 * @param {Object} e Entidade do Miniboss
 */
export function draw(e) {
  const R = e.radius;
  const isHit = e.hitFlash > 0;
  const isEnraged = !!e.enraged;
  const eliteColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : (e.color || '#f39c12'));

  const isStealth = !!e.isStealthed;
  if (isStealth) {
    ctx.save();
    ctx.globalAlpha = 0.28;
  }
  const isAiming = (e.actionState === 'WINDUP' || e.dashState === 'aim');
  const isDashing = (e.actionState === 'STRIKE' || e.dashState === 'dashing');
  const wave = Math.sin(frameCount * 0.2) * 6;
  const shadowCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#341f97');
  const daggerCol = isHit ? '#ffffff' : (isAiming ? '#ff4757' : '#00cec9');

  // 1. Cauda Fluida de Fumaça Fantasmagórica (Curvas de Bézier)
  ctx.fillStyle = shadowCol;
  ctx.beginPath();
  ctx.moveTo(R * 0.4, -R * 0.65);
  ctx.quadraticCurveTo(R * 0.5, 0, R * 0.2, R * 0.65);
  ctx.bezierCurveTo(-R * 0.4, R * 0.8 + wave, -R * 0.9, wave, -R * 1.25 + (isDashing ? -12 : 0), wave * 0.8);
  ctx.bezierCurveTo(-R * 0.8, -R * 0.4, -R * 0.3, -R * 0.65, R * 0.4, -R * 0.65);
  ctx.closePath();
  ctx.fill();

  // 2. Máscara Espectral do Caçador
  ctx.fillStyle = isHit ? '#ffffff' : '#0a0814';
  ctx.beginPath();
  ctx.moveTo(R * 0.6, 0);
  ctx.lineTo(R * 0.2, -R * 0.5);
  ctx.lineTo(0, 0);
  ctx.lineTo(R * 0.2, R * 0.5);
  ctx.closePath();
  ctx.fill();

  // Olhos Espectrais Violetas
  ctx.fillStyle = '#a29bfe';
  ctx.fillRect(R * 0.25, -R * 0.22, 4, 3);
  ctx.fillRect(R * 0.25, R * 0.08, 4, 3);

  // 3. 4 Adagas Rúnicas Orbitais com Rastro de Luz
  ctx.strokeStyle = daggerCol;
  ctx.lineWidth = 2.6;

  if (isAiming) {
    // Alinhadas na frente em formação de ponta de flecha
    for (let d = 0; d < 4; d++) {
      const dy = (d - 1.5) * 10;
      ctx.beginPath();
      ctx.moveTo(R * 0.4, dy);
      ctx.lineTo(R * 1.45, dy * 0.4);
      ctx.stroke();
    }
  } else if (isDashing) {
    // Trilhas paralelas de estocada rápida
    for (let d = 0; d < 4; d++) {
      const dy = (d < 2 ? -1 : 1) * (d % 2 === 0 ? 9 : 18);
      ctx.beginPath();
      ctx.moveTo(R * 0.3, dy * 0.5);
      ctx.lineTo(-R * 1.3, dy);
      ctx.stroke();
    }
  } else {
    // Órbita circular com after-images
    for (let d = 0; d < 4; d++) {
      const dAng = frameCount * 0.08 + (d * Math.PI / 2);
      const dx = Math.cos(dAng) * (R * 1.25);
      const dy = Math.sin(dAng) * (R * 0.75);
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(dAng + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(3.5, 8);
      ctx.lineTo(-3.5, 8);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }

  if (isStealth) {
    ctx.restore();
  }
}

/**
 * Renderiza a animação de morte em 3 fases do Miniboss.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 */
export function drawDying(de, t) {
  const R = de.radius;
  const isEnraged = !!de.enraged;
  const eliteColor = isEnraged ? '#ff4757' : (de.color || '#f39c12');
  const bodyAlpha = Math.max(0, 1 - Math.max(0, (t - 0.75) / 0.25));

  // Fase 1: Distorção cromática em ecos espectrais (ciano e magenta)
  // Fase 2: Foices fantasmas se dissolvem em pó violeta
  // Fase 3: Mini-buraco de névoa escura suga a silhueta em espiral
  const chromaticOffset = (1 - t) * 8;
  const swirl = t * Math.PI * 2;
  ctx.rotate(swirl * 0.25);

  // Eco Espectral Ciano
  ctx.save();
  ctx.translate(-chromaticOffset, 0);
  ctx.globalAlpha = bodyAlpha * 0.45;
  ctx.fillStyle = '#00d2d3';
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 0.55, R * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Eco Espectral Magenta
  ctx.save();
  ctx.translate(chromaticOffset, 0);
  ctx.globalAlpha = bodyAlpha * 0.45;
  ctx.fillStyle = '#e056fd';
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 0.55, R * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Corpo Central em Roxo Profundo com Sorvedouro
  ctx.fillStyle = '#2c003e';
  ctx.beginPath();
  ctx.ellipse(0, 0, Math.max(2, R * (0.6 - t * 0.5)), Math.max(2, R * (0.8 - t * 0.7)), 0, 0, Math.PI * 2);
  ctx.fill();

  // Fitas de névoa e fitas do manto girando em espiral
  ctx.strokeStyle = '#a29bfe';
  ctx.lineWidth = 1.8;
  for (let w = 0; w < 4; w++) {
    const wa = swirl + w * (Math.PI / 2);
    const wd = R * (0.8 - t * 0.6);
    ctx.beginPath();
    ctx.arc(0, 0, wd, wa, wa + 1.2);
    ctx.stroke();
  }
}
