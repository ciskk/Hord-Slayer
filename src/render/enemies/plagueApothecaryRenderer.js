/**
 * src/render/enemies/plagueApothecaryRenderer.js
 * 
 * Renderizador procedural modular de Boticário da Peste (PLAGUE_APOTHECARY).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Boticário da Peste.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 15. BOTICÁRIO DA PESTE - Cirurgião alquímico com alambique e ampolas
  // =========================================================================
  const R_m = e.radius;
  const isHit = e.hitFlash > 0;
  const coatColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#141a21');
  const maskLeather = isHit ? '#ffffff' : '#d2b48c';
  const brassTrim = isHit ? '#ffffff' : '#d4af37';
  const potionColor = isHit ? '#ffffff' : '#2ecc71';

  // 1. Sobretudo de Couro Vulcanizado Abotoado
  ctx.fillStyle = coatColor;
  ctx.beginPath();
  ctx.ellipse(0, R_m * 0.25, R_m * 0.52, R_m * 0.68, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0a0d12';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Fileira dupla de botões de latão
  ctx.fillStyle = brassTrim;
  for (let b = 0; b < 3; b++) {
    const by = -R_m * 0.15 + b * (R_m * 0.24);
    ctx.fillRect(-4, by, 2.2, 2.2);
    ctx.fillRect(2, by, 2.2, 2.2);
  }

  // 2. Mochila de Destilação Traseira com Serpentina de Cobre
  ctx.fillStyle = '#4a2d18';
  ctx.fillRect(-R_m * 0.78, -R_m * 0.45, 6, R_m * 0.7);

  // Tubo de vidro com serpentina de cobre
  ctx.fillStyle = 'rgba(116, 185, 255, 0.4)';
  ctx.fillRect(-R_m * 0.88, -R_m * 0.7, 5.5, R_m * 0.55);
  ctx.strokeStyle = '#b87333';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.85, -R_m * 0.65);
  ctx.lineTo(-R_m * 0.85, -R_m * 0.2);
  ctx.stroke();

  // 3. Cinto com 4 Ampolas de Vidro Redondas com Rolhas
  for (let p = -2; p <= 1; p++) {
    const px = p * 4.5;
    const py = R_m * 0.55;
    // Ampola de vidro
    ctx.fillStyle = potionColor;
    ctx.beginPath();
    ctx.arc(px, py, 2.8, 0, Math.PI * 2);
    ctx.fill();
    // Rolha de cortiça
    ctx.fillStyle = '#8c7b75';
    ctx.fillRect(px - 1, py - 4.2, 2, 1.8);
  }

  // 4. Cartola Vitoriana
  ctx.fillStyle = '#0a0d12';
  ctx.fillRect(-R_m * 0.35, -R_m * 1.05, R_m * 0.7, R_m * 0.52);
  // Aba da cartola
  ctx.fillRect(-R_m * 0.58, -R_m * 0.55, R_m * 1.16, 3.5);
  ctx.fillStyle = brassTrim;
  ctx.fillRect(-R_m * 0.35, -R_m * 0.65, R_m * 0.7, 2);

  // 5. Máscara de Couro de Peste com Bico Longo Costurado
  const hY = -R_m * 0.32;
  ctx.fillStyle = maskLeather;
  ctx.beginPath();
  ctx.arc(R_m * 0.08, hY, R_m * 0.32, 0, Math.PI * 2);
  ctx.fill();

  // Bico longo afilado com curvatura de corvo
  ctx.beginPath();
  ctx.moveTo(R_m * 0.22, hY - R_m * 0.22);
  ctx.quadraticCurveTo(R_m * 0.7, hY - R_m * 0.1, R_m * 1.25, hY + R_m * 0.1);
  ctx.lineTo(R_m * 0.25, hY + R_m * 0.18);
  ctx.closePath();
  ctx.fill();

  // Costuras aparentes no bico
  ctx.strokeStyle = '#2c1e14';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(R_m * 0.35, hY - 1);
  ctx.lineTo(R_m * 1.15, hY + 1);
  ctx.stroke();

  // Óculos com armação circular de latão e lentes vermelhas
  ctx.fillStyle = brassTrim;
  ctx.beginPath();
  ctx.arc(R_m * 0.2, hY - 3, 4.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.arc(R_m * 0.2, hY - 3, 2.8, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Renderiza a animação de morte em 3 fases de Boticário da Peste.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Cartola salta, frascos de poção estilhaçam em poça esmeralda e médico tomba
  ctx.translate(0, t * 10);
  ctx.rotate(-t * 0.45);

  // Corpo
  ctx.fillStyle = '#141a21';
  ctx.fillRect(-R * 0.4, -R * 0.3, R * 0.8, R * 0.7);

  // Cartola voando para o alto
  ctx.save();
  ctx.translate(-R * 0.8 - t * 8, -R * 0.6 - t * 10);
  ctx.rotate(-t * 2);
  ctx.fillStyle = '#0a0d12';
  ctx.fillRect(0, 0, 9, 9);
  ctx.restore();

  // Poções estilhaçadas e vapor tóxico verde
  ctx.fillStyle = '#2ecc71';
  for (let p = 0; p < 5; p++) {
    const pa = p * 1.3 + t * 2.5;
    ctx.fillRect(Math.cos(pa) * (R * 0.8) - 2.5, Math.sin(pa) * (R * 0.8) - 2.5, 4.5, 4.5);
  }
}
