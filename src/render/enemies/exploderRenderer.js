/**
 * src/render/enemies/exploderRenderer.js
 * 
 * Renderizador procedural modular de Rastejante Suicida (EXPLODER).
 */
import { ctx, frameCount } from '../../main.js';
import { player } from '../../entities/player.js';

/**
 * Renderiza a forma viva de Rastejante Suicida.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 4. CARNIÇAL ÍGNEO - Cobaia de alquimia com fornalha biológica enxertada
  // =========================================================================
  const R_m = e.radius;
  const isFuse = e.fuseState === 'FUSE';
  const fuseRatio = isFuse ? Math.min(1, Math.max(0, 1 - (e.fuseTimer || 0) / 36)) : 0;
  const distToPlayer = Math.hypot(e.x - player.x, e.y - player.y);
  const urgency = Math.min(1, Math.max(0, 1 - distToPlayer / 260));
  const pulseSpeed = 0.12 + (isFuse ? 0.48 : urgency * 0.35);
  const pustulePulse = Math.sin(frameCount * pulseSpeed) * (2.8 + (isFuse ? 6.5 : urgency * 4));
  const isHit = e.hitFlash > 0;

  const skinCharred = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#140803');
  const skinRot = isHit ? '#ffffff' : '#2e1208';
  const glassColor = 'rgba(230, 126, 34, 0.45)';
  const copperPipe = isHit ? '#ffffff' : '#b87333';
  const strapColor = isHit ? '#ffffff' : '#4a2810';

  // 1. Pernas Carbonizadas com Amarras Arrebentadas
  const legWalk = Math.sin(frameCount * 0.28) * 6;
  ctx.strokeStyle = skinCharred;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.35, R_m * 0.2);
  ctx.lineTo(-R_m * 0.55 + legWalk, R_m * 0.65);
  ctx.lineTo(-R_m * 0.45 + legWalk, R_m * 1.05);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(R_m * 0.15, R_m * 0.2);
  ctx.lineTo(R_m * 0.05 - legWalk, R_m * 0.65);
  ctx.lineTo(R_m * 0.25 - legWalk, R_m * 1.05);
  ctx.stroke();

  // Tiras de couro arrebentadas pendendo das pernas
  ctx.strokeStyle = strapColor;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.55 + legWalk, R_m * 0.65);
  ctx.lineTo(-R_m * 0.8 + legWalk, R_m * 0.85);
  ctx.stroke();

  // 2. Torso Humanoide Curvado em 4 Apoios com Costelas Expostas
  ctx.fillStyle = skinRot;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.45, -R_m * 0.1);
  ctx.quadraticCurveTo(R_m * 0.1, -R_m * 0.65, R_m * 0.52, -R_m * 0.18);
  ctx.lineTo(R_m * 0.28, R_m * 0.5);
  ctx.lineTo(-R_m * 0.35, R_m * 0.35);
  ctx.closePath();
  ctx.fill();

  // Costelas queimadas visíveis
  ctx.strokeStyle = '#050201';
  ctx.lineWidth = 1.4;
  for (let cb = 0; cb < 4; cb++) {
    ctx.beginPath();
    ctx.moveTo(-R_m * 0.2 + cb * 3.5, 0);
    ctx.lineTo(-R_m * 0.15 + cb * 3.5, R_m * 0.32);
    ctx.stroke();
  }

  // 3. A Redoma de Vidro Enxertada na Coluna (O Alambique)
  const domeR = (R_m * (isFuse ? 0.95 : 0.76)) + pustulePulse;
  const domeX = -R_m * 0.48;
  const domeY = -R_m * 0.45;

  // Cinta metálica parafusada na coluna
  ctx.fillStyle = '#2f3542';
  ctx.fillRect(domeX - domeR * 0.3, domeY + domeR * 0.6, domeR * 0.6, 5);

  // Vidro da redoma com líquido fervente
  ctx.fillStyle = isFuse ? (fuseRatio > 0.6 ? '#f1c40f' : '#e67e22') : '#d35400';
  ctx.beginPath();
  ctx.arc(domeX, domeY, domeR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isFuse ? '#ffffff' : '#f39c12';
  ctx.beginPath();
  ctx.arc(domeX, domeY, domeR * 0.65, 0, Math.PI * 2);
  ctx.fill();

  // Reflexo vítreo curvo na redoma
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(domeX, domeY, domeR * 0.85, -Math.PI * 0.75, -Math.PI * 0.25);
  ctx.stroke();

  // 4. Tubos de Exaustão de Cobre da Nuca à Redoma
  ctx.strokeStyle = copperPipe;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(domeX + domeR * 0.4, domeY - domeR * 0.5);
  ctx.quadraticCurveTo(R_m * 0.15, -R_m * 0.8, R_m * 0.5, -R_m * 0.3);
  ctx.stroke();

  // 5. Cabeça Deformada com Mordaça de Ferro Cospe-Cinzas
  ctx.fillStyle = skinCharred;
  ctx.beginPath();
  ctx.arc(R_m * 0.62, -R_m * 0.12, R_m * 0.36, 0, Math.PI * 2);
  ctx.fill();

  // Mordaça metálica retangular forçando abertura bucal
  ctx.fillStyle = '#2f3542';
  ctx.fillRect(R_m * 0.65, -2, 6, 6);
  ctx.fillStyle = isFuse ? '#ffffff' : '#f1c40f';
  ctx.fillRect(R_m * 0.7, 0, 3, 3); // Brasa dentro da boca

  // Olho vazado incandescente
  ctx.fillStyle = isFuse ? '#ffffff' : '#e74c3c';
  ctx.fillRect(R_m * 0.7, -R_m * 0.22, 3, 2.5);

  // Fagulhas e fuligem subindo no FUSE
  if (isFuse || Math.random() < 0.3) {
    ctx.fillStyle = Math.random() < 0.5 ? '#f1c40f' : '#e74c3c';
    ctx.fillRect(domeX + (Math.random() - 0.5) * 12, domeY - domeR - 4 - Math.random() * 8, 3, 3);
  }
}

/**
 * Renderiza a animação de morte em 3 fases de Rastejante Suicida.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Ruptura da redoma dorsal de vidro com ejeção de piche fervente e brasas
  const burst = 1 + t * 1.8;
  ctx.scale(burst, burst);

  // Clarão central
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(1, R * 0.65 * (1 - t * 1.2)), 0, Math.PI * 2);
  ctx.fill();

  // Piche e brasas incandescentes
  ctx.fillStyle = '#e67e22';
  for (let sh = 0; sh < 7; sh++) {
    const sa = sh * (Math.PI * 2 / 7) + t * 1.8;
    const sDist = R * (0.8 + t * 2.2);
    ctx.fillRect(Math.cos(sa) * sDist - 2.5, Math.sin(sa) * sDist - 2.5, 5, 5);
  }
  ctx.fillStyle = '#d35400';
  ctx.fillRect(-R * 0.3, -R * 0.3, R * 0.6, R * 0.6);
}
