/**
 * src/render/enemies/shieldedRenderer.js
 * 
 * Renderizador procedural modular de Guarda Blindado (SHIELDED).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Guarda Blindado.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 2. GUARDIÃO BLINDADO - Legionário em armadura de placas e pavês com ameia
  // =========================================================================
  const R_m = e.radius;
  const walk = Math.sin(frameCount * 0.14) * 2;
  const isShieldWindup = e.combatState === 'WINDUP';
  const isShieldStrike = e.combatState === 'STRIKE';
  const spearReach = isShieldStrike ? (R_m * 1.75) : (isShieldWindup ? (R_m * 0.35) : (R_m * 0.95));
  const isHit = e.hitFlash > 0;

  const steelDark = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#1e272e');
  const steelPlate = isHit ? '#ffffff' : '#34495e';
  const mailColor = isHit ? '#ffffff' : '#2c3e50';
  const brassTrim = isHit ? '#ffffff' : '#d4af37';
  const woodOak = isHit ? '#ffffff' : '#3b2314';

  // 1. Pernas com Grevas de Placas e Sabatons Articulados
  ctx.fillStyle = steelDark;
  ctx.fillRect(-R_m * 0.52, R_m * 0.35 + walk, 4.5, R_m * 0.65);
  ctx.fillRect(-R_m * 0.18, R_m * 0.35 - walk, 4.5, R_m * 0.65);

  // Joelheiras pontiagudas (Poleyns)
  ctx.fillStyle = steelPlate;
  ctx.fillRect(-R_m * 0.56, R_m * 0.55 + walk, 5.5, 3.5);
  ctx.fillRect(-R_m * 0.22, R_m * 0.55 - walk, 5.5, 3.5);

  // 2. Saia de Cota de Malha sob a Couraça
  ctx.fillStyle = mailColor;
  ctx.fillRect(-R_m * 0.55, R_m * 0.15 + walk, R_m * 0.65, R_m * 0.35);
  ctx.strokeStyle = '#4b6584';
  ctx.lineWidth = 1;
  for (let m = 0; m < 3; m++) {
    ctx.beginPath();
    ctx.moveTo(-R_m * 0.55, R_m * 0.22 + m * 4 + walk);
    ctx.lineTo(R_m * 0.1, R_m * 0.22 + m * 4 + walk);
    ctx.stroke();
  }

  // 3. Couraça Gótica com Vinco Central (Tapul)
  ctx.fillStyle = steelPlate;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.55, -R_m * 0.45 + walk);
  ctx.lineTo(R_m * 0.12, -R_m * 0.45 + walk);
  ctx.lineTo(R_m * 0.18, walk);
  ctx.lineTo(0, R_m * 0.28 + walk);
  ctx.lineTo(-R_m * 0.55, R_m * 0.28 + walk);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = steelDark;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Vinco longitudinal da armadura
  ctx.strokeStyle = '#576574';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.18, -R_m * 0.45 + walk);
  ctx.lineTo(-R_m * 0.08, R_m * 0.28 + walk);
  ctx.stroke();

  // 4. Ombreira Esquerda Hipertrofiada Laminada (Spaulder)
  ctx.fillStyle = steelDark;
  ctx.fillRect(-R_m * 0.82, -R_m * 0.55 + walk, R_m * 0.48, 6.5);
  ctx.fillRect(-R_m * 0.78, -R_m * 0.45 + walk, R_m * 0.42, 5.5);
  ctx.fillRect(-R_m * 0.72, -R_m * 0.36 + walk, R_m * 0.35, 4.5);
  ctx.strokeStyle = brassTrim;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-R_m * 0.82, -R_m * 0.55 + walk, R_m * 0.48, 6.5);

  // 5. Elmo Bacinete com Viseira Bico de Pardal (Hounskull)
  ctx.fillStyle = steelPlate;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.25, -R_m * 0.48 + walk);
  ctx.lineTo(R_m * 0.12, -R_m * 0.48 + walk);
  ctx.lineTo(R_m * 0.28, -R_m * 0.18 + walk); // Bico cônico pontiagudo
  ctx.lineTo(R_m * 0.05, 0 + walk);
  ctx.lineTo(-R_m * 0.25, 0 + walk);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = steelDark;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Orifícios de respiração perfurados no bico
  ctx.fillStyle = '#111111';
  ctx.fillRect(R_m * 0.15, -R_m * 0.18 + walk, 1.8, 1.8);
  ctx.fillRect(R_m * 0.2, -R_m * 0.14 + walk, 1.8, 1.8);

  // Fresta de visão sombria
  ctx.fillStyle = isShieldWindup ? '#f1c40f' : '#ff4757';
  ctx.fillRect(-R_m * 0.08, -R_m * 0.32 + walk, 5.5, 2.2);

  // 6. Alabarda / Lança de Guarda Pesada com Aletas Laterais
  ctx.strokeStyle = isHit ? '#ffffff' : '#8c7b75';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.3, -R_m * 0.2 + walk);
  ctx.lineTo(spearReach, -R_m * 0.72 + walk);
  ctx.stroke();

  // Lâmina de corte e ponta com aletas transversais
  ctx.fillStyle = isShieldStrike ? '#ffffff' : '#bdc3c7';
  ctx.beginPath();
  ctx.moveTo(spearReach + 12, -R_m * 0.72 + walk);
  ctx.lineTo(spearReach - 4, -R_m * 0.95 + walk);
  ctx.lineTo(spearReach - 1, -R_m * 0.72 + walk);
  ctx.lineTo(spearReach - 4, -R_m * 0.48 + walk);
  ctx.closePath();
  ctx.fill();

  // Aleta transversal (barbela)
  ctx.strokeStyle = brassTrim;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(spearReach - 2, -R_m * 0.95 + walk);
  ctx.lineTo(spearReach - 2, -R_m * 0.48 + walk);
  ctx.stroke();

  // 7. Pavês de Cerco (Tower Shield) com Textura de Carvalho e Ameia
  const shX = R_m * 0.18;
  const shY = -R_m * 0.98 + walk;
  const shW = R_m * 0.62;
  const shH = R_m * 1.95;

  // Pranchas de carvalho
  ctx.fillStyle = woodOak;
  ctx.fillRect(shX, shY, shW, shH);

  // Ameia / Recorte superior de mira
  ctx.fillStyle = '#0a0d12';
  ctx.fillRect(shX + shW - 4.5, shY, 4.5, 5.5);

  // Reforço Perimetral de Ferro Forjado
  ctx.strokeStyle = steelDark;
  ctx.lineWidth = 2.4;
  ctx.strokeRect(shX, shY, shW, shH);

  // Cruz de Ferro e Crucifixo de Bronze em Relevo
  ctx.fillStyle = steelPlate;
  ctx.fillRect(shX + shW * 0.35, shY + 3, 4.5, shH - 6);
  ctx.fillRect(shX + 2, shY + shH * 0.4, shW - 4, 4.5);

  ctx.fillStyle = brassTrim;
  ctx.fillRect(shX + shW * 0.4, shY + 6, 2.5, shH - 12);
  ctx.fillRect(shX + 4, shY + shH * 0.42, shW - 8, 2.5);

  // Rebites Prateados nos Cantos
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(shX + 2, shY + 2, 2.2, 2.2);
  ctx.fillRect(shX + 2, shY + shH - 4.2, 2.2, 2.2);

  // Barreira de Força no Bloqueio
  if (e.shieldBlockFlash > 0) {
    e.shieldBlockFlash--;
    ctx.save();
    ctx.strokeStyle = '#00d2d3';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(shX + shW * 0.5, shY + shH * 0.5, shH * 0.65, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 210, 211, 0.35)';
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Renderiza a animação de morte em 3 fases de Guarda Blindado.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Pavês arremessado para frente caindo de prancha; soldado cai de joelhos e tomba de peito
  // 1. Corpo recuando
  ctx.save();
  ctx.translate(-t * 12, t * 8);
  ctx.rotate(-t * 0.75);
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(-R * 0.45, -R * 0.35, R * 0.75, R * 0.6);
  // Elmo bico de pato descolando
  ctx.fillStyle = '#1e272e';
  ctx.beginPath();
  ctx.arc(0, -R * 0.5, R * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Pavês desabando no chão com reverberação
  ctx.save();
  ctx.translate(R * 0.2 + t * 14, t * 10);
  ctx.rotate(t * 0.65);
  ctx.scale(1, Math.max(0.12, 1 - t * 0.65));
  ctx.fillStyle = '#3b2314';
  ctx.fillRect(0, -R * 0.8, R * 0.55, R * 1.6);
  ctx.strokeStyle = '#1e272e';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, -R * 0.8, R * 0.55, R * 1.6);
  ctx.fillStyle = '#d4af37';
  ctx.fillRect((R * 0.55) * 0.35, -R * 0.8 + 3, 3.5, R * 1.6 - 6);
  ctx.restore();
}
