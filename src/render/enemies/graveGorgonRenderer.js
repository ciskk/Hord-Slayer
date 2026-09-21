/**
 * src/render/enemies/graveGorgonRenderer.js
 * 
 * Renderizador procedural modular de Górgona Sepulcral (GRAVE_GORGON).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Górgona Sepulcral.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 23. CARNIÇAL NECRÓFAGO - Troglodita canibal com bocarra em 4 pétalas
  // =========================================================================
  const R_m = e.radius;
  const isHit = e.hitFlash > 0;
  const fleshColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#47535e');
  const fleshDark = isHit ? '#ffffff' : '#22282e';
  const boneSpikes = isHit ? '#ffffff' : '#dfe4ea';
  const mouthRed = isHit ? '#ffffff' : '#b71540';

  // 1. Tronco de Troglodita Musculoso em Apoio Quadrúpede
  ctx.fillStyle = fleshColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, R_m * 0.68, R_m * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = fleshDark;
  ctx.lineWidth = 2.8;
  ctx.stroke();

  // Braço comprido apoiado no solo (estilo gorila canibal)
  ctx.strokeStyle = fleshColor;
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(R_m * 0.3, 0);
  ctx.lineTo(R_m * 0.7, R_m * 0.55);
  ctx.lineTo(R_m * 0.85, R_m * 0.95);
  ctx.stroke();
  ctx.fillStyle = fleshDark;
  ctx.fillRect(R_m * 0.75, R_m * 0.9, 8, 5); // Nós dos dedos no chão

  // 2. Espinha Dorsal com Vértebras Hipertrofiadas em Estalagmites
  ctx.fillStyle = boneSpikes;
  for (let sp = 0; sp < 4; sp++) {
    const spx = -R_m * 0.65 + sp * (R_m * 0.28);
    const spy = -R_m * 0.45 - (sp === 1 || sp === 2 ? 6 : 2);
    ctx.beginPath();
    ctx.moveTo(spx - 3, spy + 6);
    ctx.lineTo(spx, spy - 6);
    ctx.lineTo(spx + 3, spy + 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 3. A Bocarra Cruciforme Carnívora em Quatro Pétalas Mandibulares
  const mX = R_m * 0.42;
  const mY = -R_m * 0.05;

  // Fundo escuro e goela avermelhada
  ctx.fillStyle = '#080204';
  ctx.beginPath();
  ctx.arc(mX, mY, R_m * 0.48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = mouthRed;
  ctx.beginPath();
  ctx.arc(mX, mY, R_m * 0.32, 0, Math.PI * 2);
  ctx.fill();

  // As 4 Pétalas Mandibulares (Superior, Inferior, Esquerda, Direita)
  ctx.fillStyle = fleshColor;
  // Pétala Superior
  ctx.beginPath();
  ctx.moveTo(mX - 6, mY - R_m * 0.3);
  ctx.lineTo(mX, mY - R_m * 0.65);
  ctx.lineTo(mX + 6, mY - R_m * 0.3);
  ctx.closePath();
  ctx.fill();
  // Pétala Inferior
  ctx.beginPath();
  ctx.moveTo(mX - 6, mY + R_m * 0.3);
  ctx.lineTo(mX, mY + R_m * 0.65);
  ctx.lineTo(mX + 6, mY + R_m * 0.3);
  ctx.closePath();
  ctx.fill();
  // Pétala Esquerda
  ctx.beginPath();
  ctx.moveTo(mX - R_m * 0.3, mY - 6);
  ctx.lineTo(mX - R_m * 0.55, mY);
  ctx.lineTo(mX - R_m * 0.3, mY + 6);
  ctx.closePath();
  ctx.fill();
  // Pétala Direita
  ctx.beginPath();
  ctx.moveTo(mX + R_m * 0.3, mY - 6);
  ctx.lineTo(mX + R_m * 0.65, mY);
  ctx.lineTo(mX + R_m * 0.3, mY + 6);
  ctx.closePath();
  ctx.fill();

  // Três fileiras de dentes pontiagudos de tubarão recurvados
  ctx.fillStyle = '#ffffff';
  for (let dt = 0; dt < 8; dt++) {
    const da = dt * (Math.PI / 4);
    const dx = mX + Math.cos(da) * (R_m * 0.36);
    const dy = mY + Math.sin(da) * (R_m * 0.36);
    ctx.fillRect(dx - 1.5, dy - 1.5, 3, 3);
  }
}

/**
 * Renderiza a animação de morte em 3 fases de Górgona Sepulcral.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // As 4 pétalas da mandíbula abrem em espasmo terminal e fecham imóveis
  ctx.translate(0, t * 8);
  ctx.scale(1 + t * 0.15, Math.max(0.08, 1 - t * 0.8));

  ctx.fillStyle = '#47535e';
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 0.68, R * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bocarra cavernosa
  ctx.fillStyle = '#080204';
  ctx.beginPath();
  ctx.arc(R * 0.35, 0, Math.max(1, R * 0.4 * (1 - t * 0.6)), 0, Math.PI * 2);
  ctx.fill();
}
