/**
 * src/render/minibosses/artilleryMechRenderer.js
 * 
 * Renderizador procedural modular do Miniboss Torre Móvel (ARTILLERY_MECH).
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

  const isShootingRecoil = (e.actionState === 'STRIKE' || (e.shootTimer && e.shootTimer > 95)) ? -7 : 0;
  const mechDark = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#1e3799');

  // 1. Pernas de Aranha Mecânicas Articuladas (2 Juntas)
  ctx.strokeStyle = '#7f8c8d';
  ctx.lineWidth = 3.5;
  const legP = [[-R * 0.9, -R * 0.9], [R * 0.8, -R * 0.9], [-R * 0.9, R * 0.9], [R * 0.8, R * 0.9]];
  for (let lp = 0; lp < 4; lp++) {
    const jointX = legP[lp][0] * 0.55;
    const jointY = legP[lp][1] * 0.45;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(jointX, jointY);
    ctx.lineTo(legP[lp][0], legP[lp][1]);
    ctx.stroke();

    // Sapatas de Sustentação com Travas
    ctx.fillStyle = e.isSiegeMode ? '#e74c3c' : '#2d3436';
    ctx.fillRect(legP[lp][0] - 5, legP[lp][1] - 5, 10, 10);
  }

  // 2. Chassi Blindado Circular com Cúpula
  ctx.fillStyle = mechDark;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.68, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4a69bd';
  ctx.lineWidth = 2.8;
  ctx.stroke();

  // Cúpula Óptica Central
  ctx.fillStyle = '#00d2d3';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  // 3. Canos Duplos com Dissipadores de Calor Incandescentes
  ctx.fillStyle = '#2d3436';
  ctx.fillRect(R * 0.2 + isShootingRecoil, -R * 0.28, R * 1.15, 6);
  ctx.fillRect(R * 0.2 + isShootingRecoil, R * 0.1, R * 1.15, 6);

  // Ranhuras em Brasa nos Canos
  ctx.fillStyle = isEnraged ? '#ff4757' : '#f39c12';
  ctx.fillRect(R * 0.4 + isShootingRecoil, -R * 0.26, R * 0.5, 2.5);
  ctx.fillRect(R * 0.4 + isShootingRecoil, R * 0.12, R * 0.5, 2.5);

  // 4. Mira Laser Tática com Retículo Holográfico
  if (e.isSiegeMode || (e.actionState === 'WINDUP' && e.currentSkill === 'SIEGE_BURST')) {
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.9)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(R * 1.35 + isShootingRecoil, -R * 0.1);
    ctx.lineTo(R * 8.0, -R * 0.1);
    ctx.stroke();

    // Retículo Holográfico
    ctx.beginPath();
    ctx.arc(R * 5.0, -R * 0.1, 10, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeStyle = 'rgba(255, 56, 56, 0.65)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(R * 1.35 + isShootingRecoil, -R * 0.25);
    ctx.lineTo(R * 3.5, -R * 0.25);
    ctx.stroke();
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

  // Fase 1: Recuo duplo dos canhões e antena de radar ejetada girando
  // Fase 2: Pernas de aranha mecânicas dobram e quebram
  // Fase 3: Detonação interna de munições com micro-estalos e queda da cúpula
  ctx.translate(0, t * 14);

  const mechDark = '#1e3799';

  // Antena de radar ejetada girando
  ctx.save();
  ctx.translate(R * 0.4 + t * 16, -R * 0.8 - t * 12);
  ctx.rotate(t * 6);
  ctx.strokeStyle = '#dfe4ea';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 8, -0.6, 0.6);
  ctx.stroke();
  ctx.restore();

  // Pernas mecânicas quebradas esticadas no chão
  ctx.strokeStyle = '#7f8c8d';
  ctx.lineWidth = 2.4;
  for (let l = -1; l <= 1; l += 2) {
    ctx.beginPath();
    ctx.moveTo(0, l * R * 0.3);
    ctx.lineTo(-R * 0.7, l * (R * 0.8 + t * 8));
    ctx.lineTo(-R * 1.2, l * (R * 0.6 + t * 10));
    ctx.stroke();
  }

  // Cúpula central da torreta tombando de lado
  ctx.save();
  ctx.rotate(t * 0.35);
  ctx.fillStyle = mechDark;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.65, 0, Math.PI * 2);
  ctx.fill();

  // Canhões duplos tombando
  ctx.fillStyle = '#2f3542';
  ctx.fillRect(R * 0.3, -8, R * 0.7, 5);
  ctx.fillRect(R * 0.3, 3, R * 0.7, 5);
  ctx.restore();

  // Micro-estalos de munição explodindo internamente
  if (t > 0.25 && t < 0.75) {
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, 4, 4);
    ctx.fillStyle = '#ff4757';
    ctx.fillRect((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, 3, 3);
  }
}
