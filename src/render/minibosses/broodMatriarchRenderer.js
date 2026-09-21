/**
 * src/render/minibosses/broodMatriarchRenderer.js
 * 
 * Renderizador procedural modular do Miniboss Matriarca Parasita (BROOD_MATRIARCH).
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

  const pinch = Math.sin(frameCount * 0.18) * 4;
  const chitinCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#006266');

  // 1. 6 Patas Aracnídeas Articuladas com Cerdas e Espinhos
  ctx.strokeStyle = isHit ? '#ffffff' : '#004d40';
  ctx.lineWidth = 2.8;
  for (let p = 0; p < 3; p++) {
    const stepA = Math.sin(frameCount * 0.2 + p * 1.4) * 7;
    const px = -R * 0.35 + p * (R * 0.42);
    // Pata Superior
    ctx.beginPath();
    ctx.moveTo(px, -R * 0.25);
    ctx.lineTo(px - 3, -R * 0.7);
    ctx.lineTo(px - 6, -R * 1.2 + stepA);
    ctx.stroke();
    // Pata Inferior
    ctx.beginPath();
    ctx.moveTo(px, R * 0.25);
    ctx.lineTo(px - 3, R * 0.7);
    ctx.lineTo(px - 6, R * 1.2 - stepA);
    ctx.stroke();
  }

  // 2. Saco de Ovos Bioluminescente Translúcido
  ctx.fillStyle = isHit ? '#ffffff' : 'rgba(0, 206, 201, 0.45)';
  ctx.beginPath();
  ctx.ellipse(-R * 0.8, 0, R * 0.9, R * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = chitinCol;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Ovos e Embriões em Contorção Interna
  const eggPulse = Math.sin(frameCount * 0.15) * 2;
  ctx.fillStyle = (e.actionState === 'WINDUP' && e.currentSkill === 'BROOD_EGGS') ? '#00cec9' : '#2ecc71';
  const eggPos = [[-R * 1.0, -R * 0.25], [-R * 0.8, R * 0.25], [-R * 0.6, -R * 0.18], [-R * 0.9, R * 0.18]];
  for (let eg = 0; eg < 4; eg++) {
    ctx.beginPath();
    ctx.arc(eggPos[eg][0], eggPos[eg][1], 4.5 + (eg % 2 === 0 ? eggPulse : -eggPulse), 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Cefalotórax Blindado
  ctx.fillStyle = chitinCol;
  ctx.beginPath();
  ctx.ellipse(R * 0.28, 0, R * 0.58, R * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Quelíceras Mandibulares com Fios de Saliva Ácida
  ctx.fillStyle = '#1e272e';
  ctx.beginPath();
  ctx.moveTo(R * 0.65, -R * 0.28);
  ctx.quadraticCurveTo(R * 1.15, -R * 0.5 + pinch, R * 1.35, -pinch);
  ctx.lineTo(R * 0.65, 0);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(R * 0.65, R * 0.28);
  ctx.quadraticCurveTo(R * 1.15, R * 0.5 - pinch, R * 1.35, pinch);
  ctx.lineTo(R * 0.65, 0);
  ctx.closePath();
  ctx.fill();

  // Fio de Saliva Ácida Verde entre as Mandíbulas
  ctx.strokeStyle = 'rgba(46, 204, 113, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(R * 1.25, -pinch);
  ctx.lineTo(R * 1.25, pinch);
  ctx.stroke();
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

  // Fase 1: Abdômen ciano convulsiona e mandíbulas tremem
  // Fase 2: Bolsa de ovos rompe expelindo jatos de fluido turquesa e vesículas
  // Fase 3: As 6 patas dobram para cima na postura de morte e o corpo derrete
  ctx.translate(0, t * 10);

  const chitinCol = '#006266';

  // 6 Patas aracnídeas curvando para cima (death curl)
  ctx.strokeStyle = '#004d40';
  ctx.lineWidth = 2.8;
  for (let p = -1; p <= 1; p += 2) {
    for (let leg = 0; leg < 3; leg++) {
      const lX = -R * 0.4 + leg * (R * 0.4);
      const curlY = -R * 0.8 * (1 - t * 0.3) - t * 8;
      ctx.beginPath();
      ctx.moveTo(lX, 0);
      ctx.lineTo(lX + p * (R * 0.7 * (1 - t * 0.6)), curlY);
      ctx.stroke();
    }
  }

  // Abdômen de ninho estourando e murchando
  const abdomenScale = Math.max(0.1, 1 - t * 0.85);
  ctx.fillStyle = chitinCol;
  ctx.beginPath();
  ctx.ellipse(-R * 0.4, 0, R * 0.7 * abdomenScale, R * 0.55 * abdomenScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cefalotórax frontal
  ctx.fillStyle = '#004d40';
  ctx.beginPath();
  ctx.arc(R * 0.3, 0, R * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Jato de linfa bioluminescente turquesa
  if (t > 0.25) {
    ctx.fillStyle = '#00cec9';
    for (let sp = 0; sp < 7; sp++) {
      const spa = sp * 0.9 + t * 3;
      const spd = R * (0.5 + (t - 0.25) * 2.0);
      ctx.beginPath();
      ctx.arc(Math.cos(spa) * spd, Math.sin(spa) * spd, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
