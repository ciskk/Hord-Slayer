/**
 * src/render/enemies/mirrorBansheeRenderer.js
 * 
 * Renderizador procedural modular de Banshee do Espelho (MIRROR_BANSHEE).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Banshee do Espelho.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 19. BANSHEE DOS ESPELHOS - Espectro nupcial com cacos de espelho cravados
  // =========================================================================
  const R_m = e.radius;
  const isHit = e.hitFlash > 0;
  const spectralAlpha = e.isDecoy ? 0.42 : 0.88;
  const bansheeCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#a29bfe');
  const shardWhite = isHit ? '#ffffff' : '#ffffff';
  const wave = Math.sin(frameCount * 0.22) * 4;

  ctx.save();
  ctx.globalAlpha *= spectralAlpha;

  // 1. Trapos de Vestido de Noiva Imperial Rasgado em Tiras Fluidas
  ctx.fillStyle = bansheeCol;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.35, -R_m * 0.3);
  ctx.lineTo(R_m * 0.35, -R_m * 0.3);
  ctx.quadraticCurveTo(R_m * 0.75, R_m * 0.4, R_m * 0.15 + wave, R_m * 1.25);
  ctx.quadraticCurveTo(-R_m * 0.75, R_m * 0.4, -R_m * 0.35, -R_m * 0.3);
  ctx.closePath();
  ctx.fill();

  // Cauda esfarrapada de renda
  ctx.strokeStyle = '#6c5ce7';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.2, R_m * 0.5);
  ctx.lineTo(wave, R_m * 1.3);
  ctx.moveTo(R_m * 0.2, R_m * 0.5);
  ctx.lineTo(wave + 4, R_m * 1.3);
  ctx.stroke();

  // 2. Cacos de Espelho Triangulares Cravados na Carne e no Vestido
  ctx.fillStyle = shardWhite;
  for (let sh = 0; sh < 5; sh++) {
    const shX = Math.sin(sh * 1.8) * (R_m * 0.4);
    const shY = -R_m * 0.15 + sh * (R_m * 0.22);
    ctx.beginPath();
    ctx.moveTo(shX, shY - 5);
    ctx.lineTo(shX + 4.5, shY + 4);
    ctx.lineTo(shX - 3.5, shY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#74b9ff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 3. Cabeça Cadavérica e Cabelos Flutuando contra a Gravidade
  const hY = -R_m * 0.5;
  ctx.fillStyle = '#dfe4ea';
  ctx.beginPath();
  ctx.arc(0, hY, R_m * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Mechas de cabelos longos subindo no ar
  ctx.strokeStyle = '#5f27cd';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.3, hY);
  ctx.quadraticCurveTo(-R_m * 0.8, hY - R_m * 0.6, -R_m * 0.5 + wave, hY - R_m * 1.1);
  ctx.moveTo(R_m * 0.3, hY);
  ctx.quadraticCurveTo(R_m * 0.8, hY - R_m * 0.6, R_m * 0.5 - wave, hY - R_m * 1.1);
  ctx.stroke();

  // Mandíbula Completamente Descolada para Baixo (Grito Silencioso)
  ctx.fillStyle = '#0a0518';
  ctx.beginPath();
  ctx.ellipse(R_m * 0.12, hY + 4, 3.5, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Órbitas oculares ocas
  ctx.fillRect(R_m * 0.08, hY - 3, 3, 2.5);
  ctx.restore();
}

/**
 * Renderiza a animação de morte em 3 fases de Banshee do Espelho.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Estilhaçamento de vidro espelhado completo: cacos refletivos em 360°
  ctx.fillStyle = '#ffffff';
  for (let s = 0; s < 8; s++) {
    const sa = s * (Math.PI / 4) + t * 1.8;
    const sDist = R * (0.3 + t * 2.2);
    ctx.beginPath();
    ctx.moveTo(Math.cos(sa) * sDist, Math.sin(sa) * sDist);
    ctx.lineTo(Math.cos(sa + 0.3) * (sDist + 8), Math.sin(sa + 0.3) * (sDist + 8));
    ctx.lineTo(Math.cos(sa - 0.2) * (sDist + 6), Math.sin(sa - 0.2) * (sDist + 6));
    ctx.closePath();
    ctx.fill();
  }
}
