/**
 * src/render/enemies/trailCrawlerRenderer.js
 * 
 * Renderizador procedural modular de Rastejante Cáustico (TRAIL_CRAWLER).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Rastejante Cáustico.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 10. RASTEJADOR PEÇONHENTO - Scolopendra com carapaça laminada e forcípulas
  // =========================================================================
  const R_m = e.radius;
  const isHit = e.hitFlash > 0;
  const shellMain = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#0e5344');
  const shellEdge = isHit ? '#ffffff' : '#1abc9c';
  const venomColor = isHit ? '#ffffff' : '#2ecc71';
  const legColor = isHit ? '#ffffff' : '#072b23';

  // 1. 8 Pares de Pernas de Adaga com Cadência Senoidal (Caminho Único Otimizado)
  ctx.strokeStyle = legColor;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  for (let p = 0; p < 4; p++) {
    const legWave = Math.sin(frameCount * 0.32 + p * 1.2) * 6;
    const px = -R_m * 0.45 * p;
    // Perna Superior
    ctx.moveTo(px, -R_m * 0.45);
    ctx.lineTo(px - 3, -R_m * 0.95 + legWave);
    ctx.lineTo(px + 4, -R_m * 1.35 + legWave);
    // Perna Inferior
    ctx.moveTo(px, R_m * 0.45);
    ctx.lineTo(px - 3, R_m * 0.95 - legWave);
    ctx.lineTo(px + 4, R_m * 1.35 - legWave);
  }
  ctx.stroke();

  // 2. Quatro Placas Dorsais Arqueadas Sobrepostas (Estilo Armadura Samurai)
  ctx.strokeStyle = shellEdge;
  ctx.lineWidth = 1.6;
  for (let s = 3; s >= 0; s--) {
    const segX = -R_m * 0.45 * s;
    const segY = Math.sin(frameCount * 0.25 - s * 0.8) * 2.2;
    const segW = R_m * (0.85 - s * 0.08);
    const segH = R_m * (0.75 - s * 0.06);

    // Placa quitinosa com abas laterais pontiagudas
    ctx.fillStyle = s % 2 === 0 ? shellMain : '#0b3d32';
    ctx.beginPath();
    ctx.moveTo(segX - segW * 0.5, segY - segH);
    ctx.lineTo(segX + segW * 0.65, segY - segH * 0.75);
    ctx.lineTo(segX + segW * 0.8, segY);
    ctx.lineTo(segX + segW * 0.65, segY + segH * 0.75);
    ctx.lineTo(segX - segW * 0.5, segY + segH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Espinho oco central de veneno
    ctx.fillStyle = '#051f19';
    ctx.fillRect(segX - 2, segY - 3, 4, 6);

    // Glândulas de veneno translúcidas nas placas centrais
    if (s === 1 || s === 2) {
      ctx.fillStyle = venomColor;
      ctx.beginPath();
      ctx.arc(segX, segY - segH * 0.65, 3.2, 0, Math.PI * 2);
      ctx.arc(segX, segY + segH * 0.65, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Placa Cefálica Pesada com Forcípulas Gigantescas Serrilhadas
  const headX = R_m * 0.35;
  ctx.fillStyle = '#072b23';
  ctx.beginPath();
  ctx.ellipse(headX, 0, R_m * 0.42, R_m * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();

  // Olhos compostos múltiplos
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(headX + 2, -5, 2.5, 2.5);
  ctx.fillRect(headX + 2, 3, 2.5, 2.5);

  // Grandes pinças venenosas em tesoura (Forcípulas)
  const pinch = Math.sin(frameCount * 0.3) * 4;
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.moveTo(headX + 4, -4);
  ctx.quadraticCurveTo(headX + R_m * 0.9, -R_m * 0.6 + pinch, headX + R_m * 0.85, -pinch);
  ctx.lineTo(headX + 4, -1);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(headX + 4, 4);
  ctx.quadraticCurveTo(headX + R_m * 0.9, R_m * 0.6 - pinch, headX + R_m * 0.85, pinch);
  ctx.lineTo(headX + 4, 1);
  ctx.closePath();
  ctx.fill();
}

/**
 * Renderiza a animação de morte em 3 fases de Rastejante Cáustico.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Lacraia convulsiona e os 4 segmentos se desencaixam sequencialmente
  for (let s = 0; s < 4; s++) {
    const shiftX = (s % 2 === 0 ? t * 10 : -t * 10) * (s + 1) * 0.35;
    const shiftY = (s % 2 === 0 ? t * 6 : -t * 6) + t * 8;
    const sx = -R * 0.45 * s + shiftX;
    const sy = shiftY;

    ctx.fillStyle = '#0e5344';
    ctx.beginPath();
    ctx.ellipse(sx, sy, R * 0.42, R * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(sx - 2, sy - 2, 4, 4);
  }
}
