/**
 * src/render/enemies/stalkerRenderer.js
 * 
 * Renderizador procedural modular de Espreitador (STALKER).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Espreitador.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 7. ASSASSINO ESPECTRAL - Carrasco em mortalhas de seda e máscara partida
  // =========================================================================
  const R_m = e.radius;
  const isAiming = e.dashState === 'aim';
  const isDashing = e.dashState === 'dashing';
  const isStalkerStrike = e.combatState === 'STRIKE';
  const isHit = e.hitFlash > 0;

  const shroudMain = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#23153c');
  const shroudAccent = isHit ? '#ffffff' : '#4d2b7e';
  const maskWhite = isHit ? '#ffffff' : '#dfe4ea';
  const krisColor = isHit ? '#ffffff' : (isAiming ? '#ff3838' : '#7158e2');

  // 1. Cinco Tiras Verticais de Seda Fúnebre Ondulantes
  for (let s = 0; s < 5; s++) {
    const sPhase = frameCount * 0.2 + s * 0.85;
    const sWave = Math.sin(sPhase) * (5 + (isDashing ? 8 : 0));
    const sX = -R_m * 0.35 - s * 3.5;
    ctx.fillStyle = s % 2 === 0 ? shroudMain : shroudAccent;
    ctx.beginPath();
    ctx.moveTo(-R_m * 0.2, -R_m * 0.35);
    ctx.quadraticCurveTo(sX + sWave, 0, sX - (isDashing ? 14 : 6), R_m * 0.9 + sWave * 0.5);
    ctx.lineTo(sX - 3 - (isDashing ? 14 : 6), R_m * 0.85 + sWave * 0.5);
    ctx.quadraticCurveTo(sX + sWave - 3, 0, -R_m * 0.2, R_m * 0.35);
    ctx.closePath();
    ctx.fill();
  }

  // 2. Torso Envolto em Bandagens de Linho Trançadas
  ctx.fillStyle = '#0f081d';
  ctx.beginPath();
  ctx.ellipse(0, 0, R_m * 0.5, R_m * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bandagens cruzadas
  ctx.strokeStyle = '#63537d';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.35, -R_m * 0.25);
  ctx.lineTo(R_m * 0.2, R_m * 0.25);
  ctx.moveTo(-R_m * 0.25, R_m * 0.25);
  ctx.lineTo(R_m * 0.25, -R_m * 0.2);
  ctx.stroke();

  // 3. A Máscara de Porcelana Partida em Diagonal
  const mX = R_m * 0.35;
  const mY = -R_m * 0.05;

  // Metade Direita Oca (Vazio absoluto)
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(mX, mY, R_m * 0.4, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.closePath();
  ctx.fill();

  // Metade Esquerda Íntegra de Porcelana
  ctx.fillStyle = maskWhite;
  ctx.beginPath();
  ctx.arc(mX, mY, R_m * 0.4, Math.PI * 0.5, Math.PI * 1.5);
  ctx.closePath();
  ctx.fill();

  // Fissura divisória em zigue-zague
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(mX, mY - R_m * 0.4);
  ctx.lineTo(mX - 2, mY);
  ctx.lineTo(mX + 1, mY + R_m * 0.4);
  ctx.stroke();

  // Olho Espectral Brilhante na metade oca
  ctx.fillStyle = isAiming ? '#ff1744' : '#e056fd';
  ctx.fillRect(mX + 3, mY - 2, 3.5, 3.5);

  // 4. Duas Adagas Onduladas (Kris) Empunhadas Invertidas
  for (let d = -1; d <= 1; d += 2) {
    const dy = d * (R_m * 0.45);
    ctx.strokeStyle = krisColor;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(R_m * 0.1, dy);
    ctx.lineTo(R_m * 0.45, dy - d * 3);
    ctx.lineTo(R_m * 0.8, dy + d * 2);
    ctx.lineTo(R_m * 1.15, dy - d * 2);
    ctx.stroke();

    // Tiras de pergaminho flutuando do pomo
    ctx.strokeStyle = '#dfe4ea';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(R_m * 0.1, dy);
    ctx.quadraticCurveTo(-R_m * 0.2, dy + d * 6, -R_m * 0.5, dy + d * 3);
    ctx.stroke();
  }

  // Corte em Cruz no STRIKE
  if (isStalkerStrike) {
    ctx.save();
    ctx.strokeStyle = 'rgba(224, 86, 253, 0.9)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(R_m * 0.3, -R_m * 0.85);
    ctx.lineTo(R_m * 1.5, R_m * 0.85);
    ctx.moveTo(R_m * 0.3, R_m * 0.85);
    ctx.lineTo(R_m * 1.5, -R_m * 0.85);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Renderiza a animação de morte em 3 fases de Espreitador.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Máscara parte ao meio, adagas cravam no solo e mortalha desfaz-se em fitas
  // Metade esquerda da máscara voando para a esquerda
  ctx.save();
  ctx.translate(-t * 14, -t * 5);
  ctx.rotate(-t * 1.0);
  ctx.fillStyle = '#dfe4ea';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.4, Math.PI * 0.5, Math.PI * 1.5);
  ctx.fill();
  ctx.restore();

  // Metade direita voando para a direita
  ctx.save();
  ctx.translate(t * 14, -t * 5);
  ctx.rotate(t * 1.0);
  ctx.fillStyle = '#dfe4ea';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.4, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.fill();
  ctx.restore();

  // Adagas kris caindo no solo
  ctx.save();
  ctx.translate(0, t * 12);
  ctx.rotate(t * 1.4);
  ctx.strokeStyle = '#7158e2';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(4, 0);
  ctx.lineTo(-4, 8);
  ctx.stroke();
  ctx.restore();

  // Fitas de seda etérea dissipando
  ctx.strokeStyle = 'rgba(155, 89, 182, 0.7)';
  ctx.lineWidth = 1.5;
  for (let s = 0; s < 3; s++) {
    const sa = s * 2.1 + t * 3;
    ctx.beginPath();
    ctx.arc(0, 0, R * (0.6 + t * 0.8), sa, sa + 0.8);
    ctx.stroke();
  }
}
