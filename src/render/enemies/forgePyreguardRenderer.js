/**
 * src/render/enemies/forgePyreguardRenderer.js
 * 
 * Renderizador procedural modular de Guarda da Forja (FORGE_PYREGUARD).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Guarda da Forja.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 17. LANÇA-CHAMAS DA FORJA - Autômato de fundição com fornalha e tromba de fogo
  // =========================================================================
  const R_m = e.radius;
  const isHit = e.hitFlash > 0;
  const ironCast = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#2c3437');
  const ironDark = isHit ? '#ffffff' : '#14181a';
  const bronzeMuzzle = isHit ? '#ffffff' : '#b87333';
  const furnaceCoal = isHit ? '#ffffff' : '#e67e22';
  const isFiring = e.flameState === 'firing';

  // 1. Tanque Traseiro Esférico com Manômetro e Chaminés Duplas
  ctx.fillStyle = '#1c2124';
  ctx.beginPath();
  ctx.arc(-R_m * 0.65, -R_m * 0.15, R_m * 0.48, 0, Math.PI * 2);
  ctx.fill();

  // Duas chaminés inclinadas
  ctx.fillStyle = ironDark;
  ctx.fillRect(-R_m * 0.85, -R_m * 0.85, 4.5, 12);
  ctx.fillRect(-R_m * 0.65, -R_m * 0.85, 4.5, 12);

  // Manômetro circular de latão
  ctx.fillStyle = '#d4af37';
  ctx.beginPath();
  ctx.arc(-R_m * 0.65, -R_m * 0.15, 3.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111111';
  ctx.fillRect(-R_m * 0.65, -R_m * 0.15, 2.5, 1);

  // 2. Torso de Fornalha de Ferro Fundido com Rebites
  ctx.fillStyle = ironCast;
  ctx.beginPath();
  ctx.ellipse(0, 0, R_m * 0.62, R_m * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ironDark;
  ctx.lineWidth = 2.8;
  ctx.stroke();

  // Rebites perimetrais
  ctx.fillStyle = '#d4af37';
  for (let rv = 0; rv < 6; rv++) {
    const ra = rv * (Math.PI / 3);
    ctx.fillRect(Math.cos(ra) * (R_m * 0.52) - 1.2, Math.sin(ra) * (R_m * 0.58) - 1.2, 2.4, 2.4);
  }

  // 3. Porta de Fornalha no Peito com Grelha e Carvão Ardente
  ctx.fillStyle = '#0a0502';
  ctx.fillRect(-R_m * 0.28, -R_m * 0.22, R_m * 0.56, R_m * 0.45);

  ctx.fillStyle = furnaceCoal;
  ctx.fillRect(-R_m * 0.22, -R_m * 0.16, R_m * 0.44, R_m * 0.33);
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(-R_m * 0.14, -R_m * 0.08, R_m * 0.28, 4);

  // Grelha de ferro da fornalha
  ctx.strokeStyle = ironDark;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.08, -R_m * 0.22);
  ctx.lineTo(-R_m * 0.08, R_m * 0.23);
  ctx.moveTo(R_m * 0.08, -R_m * 0.22);
  ctx.lineTo(R_m * 0.08, R_m * 0.23);
  ctx.stroke();

  // 4. Tromba Térmica de Dois Estágios (Braço Lança-Chamas)
  ctx.fillStyle = bronzeMuzzle;
  ctx.fillRect(R_m * 0.2, -4.5, R_m * 0.45, 9); // Câmara de mistura
  ctx.fillStyle = ironDark;
  ctx.fillRect(R_m * 0.65, -3, R_m * 0.65, 6); // Cano principal

  // Bocal cônico alargado (boca de sino)
  ctx.fillStyle = isFiring ? '#e74c3c' : bronzeMuzzle;
  ctx.beginPath();
  ctx.moveTo(R_m * 1.3, -3);
  ctx.lineTo(R_m * 1.5, -6.5);
  ctx.lineTo(R_m * 1.5, 6.5);
  ctx.lineTo(R_m * 1.3, 3);
  ctx.closePath();
  ctx.fill();

  // Mangueira espiral reforçada
  ctx.strokeStyle = '#7f8c8d';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.3, R_m * 0.35);
  ctx.quadraticCurveTo(R_m * 0.2, R_m * 0.55, R_m * 0.4, 0);
  ctx.stroke();
}

/**
 * Renderiza a animação de morte em 3 fases de Guarda da Forja.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Porta da fornalha é ejetada com coluna de chamas e chassi colapsa
  const blast = 1 + t * 0.45;
  ctx.scale(blast, Math.max(0.08, 1 - t * 0.82));

  // Caldeira principal
  ctx.fillStyle = '#14181a';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.65, 0, Math.PI * 2);
  ctx.fill();

  // Labareda escapando
  ctx.fillStyle = t < 0.5 ? '#f1c40f' : '#e67e22';
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(1, R * (0.85 * (1 - t))), 0, Math.PI * 2);
  ctx.fill();
}
