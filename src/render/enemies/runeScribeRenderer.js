/**
 * src/render/enemies/runeScribeRenderer.js
 * 
 * Renderizador procedural modular de Escriba Rúnico (RUNE_SCRIBE).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Escriba Rúnico.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 16. ESCRIBA DAS RUNAS - Arquivista mumificado com códice e cauda de papiro
  // =========================================================================
  const R_m = e.radius;
  const isHit = e.hitFlash > 0;
  const papiroColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#d2c29d');
  const papiroInk = isHit ? '#ffffff' : '#3d2b1f';
  const tomeLeather = isHit ? '#ffffff' : '#4a0e17';
  const runeAura = isHit ? '#ffffff' : '#00cec9';
  const levitate = Math.sin(frameCount * 0.15) * 3.5;

  ctx.save();
  ctx.translate(0, levitate);

  // 1. Cauda Espiral de Folhas de Papiro Flutuantes
  for (let p = 0; p < 4; p++) {
    const pWave = Math.sin(frameCount * 0.2 + p * 1.1) * 5;
    const py = R_m * 0.35 + p * 5.5;
    ctx.fillStyle = papiroColor;
    const leafRx = Math.max(1.5, R_m * 0.45 - p * 1.2);
    ctx.ellipse(pWave, py, leafRx, 4, 0.2 * p, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8c7b75';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 2. Torso Envolto em Tiras de Pergaminho com Três Pregos Rituais
  ctx.fillStyle = papiroColor;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.38, -R_m * 0.4);
  ctx.lineTo(R_m * 0.38, -R_m * 0.4);
  ctx.lineTo(R_m * 0.48, R_m * 0.45);
  ctx.lineTo(-R_m * 0.48, R_m * 0.45);
  ctx.closePath();
  ctx.fill();

  // Escrituras cursivas em sépia desenhadas no peito
  ctx.strokeStyle = papiroInk;
  ctx.lineWidth = 1.0;
  for (let ln = 0; ln < 3; ln++) {
    const lny = -R_m * 0.25 + ln * 6;
    ctx.beginPath();
    ctx.moveTo(-R_m * 0.3, lny);
    ctx.lineTo(R_m * 0.3, lny);
    ctx.stroke();
  }

  // Três pregos de bronze no peito
  ctx.fillStyle = '#b8860b';
  ctx.fillRect(-R_m * 0.2, -R_m * 0.15, 2.5, 2.5);
  ctx.fillRect(0, -R_m * 0.15, 2.5, 2.5);
  ctx.fillRect(R_m * 0.2, -R_m * 0.15, 2.5, 2.5);

  // 3. Capuz de Arquivista Mumificado
  ctx.fillStyle = '#1c2833';
  ctx.beginPath();
  ctx.arc(0, -R_m * 0.55, R_m * 0.34, 0, Math.PI * 2);
  ctx.fill();

  // Olhos celestes cintilantes
  ctx.fillStyle = runeAura;
  ctx.fillRect(-3, -R_m * 0.58, 2.5, 2.5);
  ctx.fillRect(2, -R_m * 0.58, 2.5, 2.5);

  // 4. Códice Gótico Aberto em 120° Flutuando à Frente
  const bookX = R_m * 0.48;
  const bookY = -R_m * 0.15;

  // Capa de couro pesada com cantoneiras de ferro
  ctx.fillStyle = tomeLeather;
  ctx.fillRect(bookX - 1, bookY - 8, 11, 16);
  ctx.fillStyle = '#2f3542';
  ctx.fillRect(bookX - 1, bookY - 8, 3, 3);
  ctx.fillRect(bookX + 7, bookY - 8, 3, 3);
  ctx.fillRect(bookX - 1, bookY + 5, 3, 3);
  ctx.fillRect(bookX + 7, bookY + 5, 3, 3);

  // Páginas brancas abertas
  ctx.fillStyle = '#f5f6fa';
  ctx.fillRect(bookX + 1, bookY - 6.5, 8.5, 13);
  ctx.fillStyle = '#2f3542';
  ctx.fillRect(bookX + 4.5, bookY - 6.5, 1, 13); // Lombada divisória

  // 5. Pena de Metal Desenhadora de Runas
  ctx.strokeStyle = '#dfe4ea';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(bookX + 11, bookY - 10);
  ctx.lineTo(bookX + 14, bookY - 3);
  ctx.stroke();

  // Três Runas Astrais Orbitais
  for (let r = 0; r < 3; r++) {
    const rAng = frameCount * 0.08 + r * (Math.PI * 2 / 3);
    const rx = Math.cos(rAng) * (R_m * 1.05);
    const ry = -R_m * 0.35 + Math.sin(rAng) * (R_m * 0.45);
    ctx.fillStyle = runeAura;
    ctx.fillRect(rx - 2, ry - 2, 4, 4);
  }
  ctx.restore();
}

/**
 * Renderiza a animação de morte em 3 fases de Escriba Rúnico.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // O grimório explode em páginas incandescentes que voam em redemoinho
  ctx.scale(1 + t * 0.3, Math.max(0.05, 1 - t * 0.92));

  // Folhas de pergaminho se espalhando
  ctx.fillStyle = '#d2c29d';
  for (let pg = 0; pg < 6; pg++) {
    const pga = pg * 1.05 + t * 3.0;
    const pgd = R * (0.4 + t * 1.5);
    ctx.fillRect(Math.cos(pga) * pgd - 3.5, Math.sin(pga) * pgd - 3.5, 7, 9);
  }

  // Brasas mágicas azuis
  ctx.fillStyle = '#00cec9';
  for (let f = 0; f < 3; f++) {
    ctx.fillRect(Math.sin(t * 4 + f) * 8, -R * 0.5 - t * 14 - f * 4, 3.5, 3.5);
  }
}
