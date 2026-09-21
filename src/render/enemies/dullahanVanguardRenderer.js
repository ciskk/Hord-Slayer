/**
 * src/render/enemies/dullahanVanguardRenderer.js
 * 
 * Renderizador procedural modular de Cavaleiro Sem Cabeça (DULLAHAN_VANGUARD).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Cavaleiro Sem Cabeça.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 20. CAVALEIRO SEM CABEÇA - Armadura de aço negro, cabeça na mão e justa
  // =========================================================================
  const R_m = e.radius;
  const isHit = e.hitFlash > 0;
  const plateCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#1e242c');
  const plateDark = isHit ? '#ffffff' : '#0c0f12';
  const isCharging = e.lanceState === 'charging';
  const flameBob = Math.sin(frameCount * 0.35) * 2.5;

  // 1. Couraça Gótica em Aço Negro com Aresta Tapul
  ctx.fillStyle = plateCol;
  ctx.beginPath();
  ctx.ellipse(0, 0, R_m * 0.6, R_m * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = plateDark;
  ctx.lineWidth = 2.6;
  ctx.stroke();

  // Aresta central reforçada (Tapul)
  ctx.strokeStyle = '#576574';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, -R_m * 0.6);
  ctx.lineTo(R_m * 0.15, 0);
  ctx.lineTo(0, R_m * 0.6);
  ctx.stroke();

  // Saia de faixas de aço articuladas (Fauld)
  ctx.fillStyle = plateDark;
  ctx.fillRect(-R_m * 0.45, R_m * 0.35, R_m * 0.9, 5);
  ctx.fillRect(-R_m * 0.38, R_m * 0.48, R_m * 0.76, 5);

  // 2. Gola Degolada Serrilhada com Labareda de Fogo-Fátuo
  ctx.fillStyle = plateDark;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.3, -R_m * 0.6);
  ctx.lineTo(-R_m * 0.35, -R_m * 0.78);
  ctx.lineTo(0, -R_m * 0.72);
  ctx.lineTo(R_m * 0.35, -R_m * 0.78);
  ctx.lineTo(R_m * 0.3, -R_m * 0.6);
  ctx.closePath();
  ctx.fill();

  // Labareda crepitando do pescoço decepado
  ctx.fillStyle = '#ff4757';
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.22, -R_m * 0.72);
  ctx.lineTo(0, -R_m * 1.15 + flameBob);
  ctx.lineTo(R_m * 0.22, -R_m * 0.72);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.arc(0, -R_m * 0.85 + flameBob * 0.5, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 3. A Cabeça Degolada com Elmo Aberto Segurada na Mão Esquerda
  const headX = -R_m * 0.55;
  const headY = R_m * 0.15;

  // Elmo de justa aberto
  ctx.fillStyle = plateDark;
  ctx.beginPath();
  ctx.arc(headX, headY, R_m * 0.34, 0, Math.PI * 2);
  ctx.fill();

  // Chifres quebrados no elmo
  ctx.strokeStyle = '#7f8c8d';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(headX - 4, headY - 8);
  ctx.lineTo(headX - 10, headY - 14);
  ctx.moveTo(headX + 4, headY - 8);
  ctx.lineTo(headX + 8, headY - 12);
  ctx.stroke();

  // Crânio ressequido dentro do elmo
  ctx.fillStyle = '#dfe4ea';
  ctx.beginPath();
  ctx.arc(headX + 2, headY, 5, 0, Math.PI * 2);
  ctx.fill();

  // Órbitas em brasas ardentes
  ctx.fillStyle = '#ff1744';
  ctx.fillRect(headX, headY - 2, 2.2, 2.2);
  ctx.fillRect(headX + 4, headY - 2, 2.2, 2.2);

  // 4. Lança de Justa Pesada com Guarda Cônica e Flâmula
  const lanceLen = isCharging ? R_m * 2.1 : R_m * 1.45;
  ctx.fillStyle = '#57606f';
  ctx.fillRect(R_m * 0.2, -3, lanceLen, 6);

  // Protetor cônico de mão (vamplate)
  ctx.fillStyle = plateDark;
  ctx.beginPath();
  ctx.moveTo(R_m * 0.2, -8);
  ctx.lineTo(R_m * 0.5, -4);
  ctx.lineTo(R_m * 0.5, 4);
  ctx.lineTo(R_m * 0.2, 8);
  ctx.closePath();
  ctx.fill();

  // Ponta de torneio afiada
  ctx.fillStyle = '#ecf0f1';
  ctx.beginPath();
  const lx = R_m * 0.2 + lanceLen;
  ctx.moveTo(lx, -5);
  ctx.lineTo(lx + 12, 0);
  ctx.lineTo(lx, 5);
  ctx.closePath();
  ctx.fill();

  // Flâmula heráldica rasgada de duas pontas tremulando
  const fWave = Math.sin(frameCount * 0.3) * 3;
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.moveTo(lx - 8, 3);
  ctx.lineTo(lx - 20, 10 + fWave);
  ctx.lineTo(lx - 12, 4);
  ctx.lineTo(lx - 20, 16 + fWave);
  ctx.lineTo(lx - 8, 3);
  ctx.closePath();
  ctx.fill();
}

/**
 * Renderiza a animação de morte em 3 fases de Cavaleiro Sem Cabeça.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Lança quebra, cavaleiro cai de joelhos e elmo degolado rola com olhos apagando
  ctx.translate(0, t * 12);
  ctx.scale(1 + t * 0.1, Math.max(0.08, 1 - t * 0.82));

  // Couraça de placas
  ctx.fillStyle = '#0c0f12';
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 0.55, R * 0.68, 0, 0, Math.PI * 2);
  ctx.fill();

  // Elmo degolado rolando para a esquerda
  ctx.save();
  ctx.translate(-R * 0.8 - t * 12, t * 6);
  ctx.rotate(-t * 2.5);
  ctx.fillStyle = '#1e242c';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Lança partida ao lado
  ctx.strokeStyle = '#57606f';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(R * 0.3, 0);
  ctx.lineTo(R * 1.3 + t * 8, t * 8);
  ctx.stroke();
}
