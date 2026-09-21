/**
 * src/render/enemies/shooterRenderer.js
 * 
 * Renderizador procedural modular de Cultista Atirador (SHOOTER).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Cultista Atirador.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 6. AUTÔMATO ARTILHEIRO - Torreta de trincheira imperial a vapor em tripé
  // =========================================================================
  const R_m = e.radius;
  const isHit = e.hitFlash > 0;
  const walkCycle = frameCount * 0.18;
  const legA = Math.sin(walkCycle) * 6;
  const legB = Math.sin(walkCycle + Math.PI) * 6;

  const ironCast = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#232b38');
  const ironDark = isHit ? '#ffffff' : '#12171f';
  const brassDetail = isHit ? '#ffffff' : '#d4af37';
  const chromePiston = isHit ? '#ffffff' : '#dfe4ea';

  // 1. Locomoção em Tripé Mecânico (2 Pernas Dianteiras + 1 Escora Traseira)
  // Perna Traseira (Escora de recuo)
  ctx.strokeStyle = ironDark;
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.5, R_m * 0.1);
  ctx.lineTo(-R_m * 0.85, R_m * 0.7);
  ctx.stroke();
  ctx.fillStyle = '#2f3542';
  ctx.fillRect(-R_m * 1.05, R_m * 0.65, 8, 4);

  // Pernas Dianteiras com Pistões Hidráulicos
  ctx.strokeStyle = chromePiston;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.2, R_m * 0.2);
  ctx.lineTo(-R_m * 0.35 + legA * 0.4, R_m * 0.65);
  ctx.lineTo(-R_m * 0.4 + legA, R_m * 1.05);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(R_m * 0.2, R_m * 0.2);
  ctx.lineTo(R_m * 0.15 + legB * 0.4, R_m * 0.65);
  ctx.lineTo(R_m * 0.3 + legB, R_m * 1.05);
  ctx.stroke();

  // Sapatas Circulares de Ancoragem
  ctx.fillStyle = ironDark;
  ctx.fillRect(-R_m * 0.55 + legA, R_m * 1.0, 9, 4);
  ctx.fillRect(R_m * 0.15 + legB, R_m * 1.0, 9, 4);

  // 2. Chassi em Domo de Sino de Ferro com Rebites Hexagonais
  ctx.fillStyle = ironCast;
  ctx.beginPath();
  ctx.arc(0, -R_m * 0.15, R_m * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ironDark;
  ctx.lineWidth = 2.6;
  ctx.stroke();

  // Fileira de Rebites Hexagonais na Borda da Caldeira
  ctx.fillStyle = brassDetail;
  for (let rv = 0; rv < 5; rv++) {
    const ra = -Math.PI * 0.75 + rv * 0.38;
    const rx = Math.cos(ra) * (R_m * 0.62);
    const ry = -R_m * 0.15 + Math.sin(ra) * (R_m * 0.62);
    ctx.fillRect(rx - 1.2, ry - 1.2, 2.5, 2.5);
  }

  // Brasão em Relevo da Águia Imperial Corroída no Peito
  ctx.fillStyle = '#1a222d';
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.25, -R_m * 0.2);
  ctx.lineTo(0, -R_m * 0.35);
  ctx.lineTo(R_m * 0.25, -R_m * 0.2);
  ctx.lineTo(R_m * 0.15, R_m * 0.15);
  ctx.lineTo(0, R_m * 0.25);
  ctx.lineTo(-R_m * 0.15, R_m * 0.15);
  ctx.closePath();
  ctx.fill();

  // 3. Fita de Cartuchos de Latão Entrando na Culatra
  ctx.fillStyle = brassDetail;
  for (let bl = 0; bl < 4; bl++) {
    ctx.fillRect(-R_m * 0.1 + bl * 3.5, -R_m * 0.55, 2.5, 5);
  }

  // 4. Canhão Gatling Rotativo de 3 Canos com Boca de Bronze
  const isBursting = e.burstRemaining > 0;
  const isRecoil = isBursting || (e.shootTimer > 95);
  const recoilX = isRecoil ? -6 : 0;
  const barrelSpin = frameCount * (isBursting ? 0.8 : (e.shootTimer > 90 ? 0.45 : 0.1));

  // Bloco da culatra
  ctx.fillStyle = ironDark;
  ctx.fillRect(R_m * 0.2 + recoilX, -R_m * 0.45, R_m * 0.45, R_m * 0.5);

  // 3 Canos com manga de resfriamento perfurada
  for (let bIdx = 0; bIdx < 3; bIdx++) {
    const bOff = Math.sin(barrelSpin + bIdx * (Math.PI * 2 / 3)) * 4.2;
    ctx.fillStyle = isBursting ? '#e74c3c' : '#7f8c8d';
    ctx.fillRect(R_m * 0.65 + recoilX, -R_m * 0.25 + bOff, R_m * 0.75, 2.8);
  }

  // Anel de contenção frontal dos canos
  ctx.fillStyle = brassDetail;
  ctx.fillRect(R_m * 1.35 + recoilX, -R_m * 0.35, 3.5, R_m * 0.4);

  // 5. Chaminé Traseira com Tampa Batente de Escape
  ctx.fillStyle = ironDark;
  ctx.fillRect(-R_m * 0.65, -R_m * 0.95, 6, 12);
  // Tampa articulada oscilante
  const flapper = Math.sin(frameCount * 0.35) * 0.35;
  ctx.save();
  ctx.translate(-R_m * 0.65, -R_m * 0.95);
  ctx.rotate(flapper);
  ctx.fillStyle = brassDetail;
  ctx.fillRect(-2, -2.5, 10, 2.5);
  ctx.restore();

  // Linha Laser de Mira Tática no Solo
  if (e.shootTimer > 105 && !isBursting) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 71, 87, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(R_m * 1.4 + recoilX, -R_m * 0.2);
    ctx.lineTo(R_m * 4.5, -R_m * 0.2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

/**
 * Renderiza a animação de morte em 3 fases de Cultista Atirador.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Tripé mecânico cede, canhões disparam estalo terminal e tambor tomba
  ctx.translate(0, t * 10);
  ctx.scale(1 + t * 0.15, Math.max(0.08, 1 - t * 0.8));

  // Caldeira principal tombada
  ctx.fillStyle = '#12171f';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.65, 0, Math.PI * 2);
  ctx.fill();

  // Canhões se desprendendo e rolando
  ctx.save();
  ctx.translate(R * 0.4 + t * 10, t * 8);
  ctx.rotate(t * 1.1);
  ctx.fillStyle = '#7f8c8d';
  ctx.fillRect(0, -3.5, R * 0.85, 7);
  ctx.restore();

  // Faíscas elétricas e vapor
  if (t > 0.2) {
    ctx.fillStyle = '#74b9ff';
    ctx.fillRect((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, 3, 3);
  }
}
