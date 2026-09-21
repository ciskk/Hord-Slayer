/**
 * src/render/enemies/necroRenderer.js
 * 
 * Renderizador procedural modular de Necromante (NECRO).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Necromante.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 5. CULTISTA DAS SOMBRAS - Pontífice herege em paramentos litúrgicos decadentes
  // =========================================================================
  const R_m = e.radius;
  const hover = Math.sin(frameCount * 0.08) * 3.5;
  const waveA = Math.sin(frameCount * 0.14) * 4;
  const waveB = Math.cos(frameCount * 0.16) * 4;
  const isHit = e.hitFlash > 0;

  const cassockColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#100c19');
  const stoleColor = isHit ? '#ffffff' : '#2b103c';
  const goldThread = isHit ? '#ffffff' : '#d4af37';
  const copeColor = isHit ? '#ffffff' : '#1d122b';
  const soulFlame = isHit ? '#ffffff' : '#00cec9';

  // 1. Túnica Talar Longa Interna com Barra Rasgada em Farrapos
  ctx.fillStyle = cassockColor;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.35, -R_m * 0.4 + hover);
  ctx.lineTo(R_m * 0.35, -R_m * 0.4 + hover);
  ctx.lineTo(R_m * 0.65, R_m * 0.85 + hover);
  ctx.quadraticCurveTo(R_m * 0.3 + waveB, R_m * 1.1 + hover, 0, R_m * 0.9 + hover);
  ctx.quadraticCurveTo(-R_m * 0.3 + waveA, R_m * 1.1 + hover, -R_m * 0.65, R_m * 0.85 + hover);
  ctx.closePath();
  ctx.fill();

  // 2. Estola Litúrgica com Cruzes Invertidas e Rosário
  ctx.fillStyle = stoleColor;
  ctx.fillRect(-R_m * 0.18, -R_m * 0.3 + hover, R_m * 0.36, R_m * 1.05);
  ctx.strokeStyle = goldThread;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-R_m * 0.18, -R_m * 0.3 + hover, R_m * 0.36, R_m * 1.05);

  // Cruzes invertidas desenhadas na estola
  ctx.fillStyle = goldThread;
  for (let cr = 0; cr < 2; cr++) {
    const cry = -R_m * 0.1 + cr * (R_m * 0.45) + hover;
    ctx.fillRect(-1.2, cry, 2.4, 7);
    ctx.fillRect(-3.5, cry + 4.5, 7, 2.2);
  }

  // Cinto de corda com rosário de vértebras
  ctx.strokeStyle = '#8c7b75';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.25, R_m * 0.1 + hover);
  ctx.lineTo(R_m * 0.25, R_m * 0.1 + hover);
  ctx.stroke();

  // 3. Manto Pluvial Aberto com Gola Alta Rígida
  ctx.fillStyle = copeColor;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.55, -R_m * 0.75 + hover);
  ctx.lineTo(-R_m * 0.35, -R_m * 0.4 + hover);
  ctx.lineTo(-R_m * 0.55, R_m * 0.65 + hover);
  ctx.lineTo(-R_m * 0.75, R_m * 0.65 + hover);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(R_m * 0.55, -R_m * 0.75 + hover);
  ctx.lineTo(R_m * 0.35, -R_m * 0.4 + hover);
  ctx.lineTo(R_m * 0.55, R_m * 0.65 + hover);
  ctx.lineTo(R_m * 0.75, R_m * 0.65 + hover);
  ctx.closePath();
  ctx.fill();

  // 4. Mitra Eclesiástica Corrompida com Coroa de Espinhos
  ctx.fillStyle = copeColor;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.35, -R_m * 0.65 + hover);
  ctx.lineTo(0, -R_m * 1.45 + hover); // Ápice pontiagudo da mitra
  ctx.lineTo(R_m * 0.35, -R_m * 0.65 + hover);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = goldThread;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Coroa de espinhos de arame farpado
  ctx.strokeStyle = '#2f3542';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, -R_m * 0.85 + hover, R_m * 0.38, -0.3, Math.PI + 0.3);
  ctx.stroke();

  // 5. Véu de Gaze Negra com Olhos de Fogo-Fátuo
  ctx.fillStyle = 'rgba(10, 8, 14, 0.85)';
  ctx.beginPath();
  ctx.arc(0, -R_m * 0.55 + hover, R_m * 0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = soulFlame;
  ctx.fillRect(-R_m * 0.15, -R_m * 0.58 + hover, 3.5, 2.5);
  ctx.fillRect(R_m * 0.05, -R_m * 0.58 + hover, 3.5, 2.5);

  // 6. Báculo de Vértebras com Relicário de Catedral
  const stX = R_m * 0.82;
  const stTopY = -R_m * 1.25 + hover;
  const stBotY = R_m * 0.9 + hover;

  // Haste vertebral
  ctx.strokeStyle = '#576574';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(stX, stBotY);
  ctx.lineTo(stX, stTopY);
  ctx.stroke();

  // Relicário de catedral em miniatura
  ctx.fillStyle = '#2f3542';
  ctx.fillRect(stX - 5, stTopY - 14, 10, 14);
  ctx.strokeStyle = goldThread;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(stX - 5, stTopY - 14, 10, 14);

  // Coração mumificado em chamas no topo
  const summonRatio = Math.min(1, Math.max(0, (e.summonTimer || 0) / 230));
  ctx.fillStyle = summonRatio > 0.6 ? '#ff4757' : soulFlame;
  ctx.beginPath();
  ctx.arc(stX, stTopY - 7, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Círculo Cabalístico no Solo durante a Invocação
  if (summonRatio > 0.25) {
    ctx.save();
    const cX = R_m * 1.15;
    const cY = R_m * 0.9 + hover;
    ctx.strokeStyle = 'rgba(155, 89, 182, 0.65)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(cX, cY, R_m * 1.1, R_m * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Renderiza a animação de morte em 3 fases de Necromante.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // As vestes escuras desabam vazias no solo enquanto três almas sobem ao céu
  ctx.translate(0, t * 10);
  ctx.scale(1 + t * 0.3, Math.max(0.05, 1 - t * 0.92));

  // Vestes colapsando
  ctx.fillStyle = '#100c19';
  ctx.beginPath();
  ctx.moveTo(-R * 0.75, R * 0.7);
  ctx.lineTo(0, -R * 0.35);
  ctx.lineTo(R * 0.75, R * 0.7);
  ctx.closePath();
  ctx.fill();

  // Estola e mitra douradas no chão
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Três chamas de alma subindo em espiral aos céus
  ctx.fillStyle = '#00cec9';
  for (let sm = 0; sm < 3; sm++) {
    const sma = sm * 2.09 + t * 4;
    const sx = Math.cos(sma) * (6 + sm * 3);
    const sy = -R * 0.4 - t * 24 - sm * 5;
    ctx.beginPath();
    ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
}
