/**
 * src/render/minibosses/siegeCaptainRenderer.js
 * 
 * Renderizador procedural modular do Miniboss Capitão de Cerco (SIEGE_CAPTAIN).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva do Miniboss.
 * @param {Object} e Entidade do Miniboss
 */
export function draw(e) {
  const R = e.radius;
  const isHit = e.hitFlash > 0;
  const isEnraged = !!e.enraged;
  const eliteColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : (e.color || '#f39c12'));

  const isMortarRecoil = (e.actionState === 'STRIKE' || (e.mortarTimer && e.mortarTimer > 120)) ? -8 : 0;
  const hullCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#b71540');

  // 1. Esteiras de Blindado Rolantes (Gomos Móveis)
  const trackShift = (frameCount * 2) % 8;
  ctx.fillStyle = '#2d3436';
  ctx.fillRect(-R * 0.85, -R * 0.9, R * 1.7, 14);
  ctx.fillRect(-R * 0.85, R * 0.58, R * 1.7, 14);

  // Gomos Articulados da Lagarta
  ctx.fillStyle = '#636e72';
  for (let g = -4; g <= 4; g++) {
    const gx = g * 9 + trackShift;
    if (gx > -R * 0.8 && gx < R * 0.8) {
      ctx.fillRect(gx, -R * 0.9, 3.5, 14);
      ctx.fillRect(gx, R * 0.58, 3.5, 14);
    }
  }

  // 2. Carcaça Blindada Angular de Tanque
  ctx.fillStyle = hullCol;
  ctx.beginPath();
  ctx.moveTo(-R * 0.7, -R * 0.65);
  ctx.lineTo(R * 0.7, -R * 0.65);
  ctx.lineTo(R * 0.9, 0);
  ctx.lineTo(R * 0.7, R * 0.65);
  ctx.lineTo(-R * 0.7, R * 0.65);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4a0e17';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 3. Morteiro Pesado com Coice e Anéis de Exaustão
  ctx.save();
  ctx.translate(isMortarRecoil * 0.75, 0);
  ctx.rotate(-0.68);
  ctx.fillStyle = '#1e272e';
  ctx.fillRect(0, -9, R * 1.3, 18);
  ctx.strokeStyle = '#7f8c8d';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(0, -9, R * 1.3, 18);

  if (isMortarRecoil < 0) {
    // Clarão de Boca de Fogo e Anel de Fumaça
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(R * 1.4, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(R * 1.6, 0, 15, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Flâmula de Cerco Traseira Tremulando
  const flagWave = Math.sin(frameCount * 0.25) * 4;
  ctx.fillStyle = '#ff4757';
  ctx.beginPath();
  ctx.moveTo(-R * 0.6, 0);
  ctx.lineTo(-R * 1.1, -8 + flagWave);
  ctx.lineTo(-R * 0.9, 0);
  ctx.lineTo(-R * 1.1, 8 + flagWave);
  ctx.closePath();
  ctx.fill();
}

/**
 * Renderiza a animação de morte em 3 fases do Miniboss.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 */
export function drawDying(de, t) {
  const R = de.radius;
  const isEnraged = !!de.enraged;
  const eliteColor = isEnraged ? '#ff4757' : (de.color || '#f39c12');
  const bodyAlpha = Math.max(0, 1 - Math.max(0, (t - 0.75) / 0.25));

  // Fase 1: Esteiras rompem e desenrolam; morteiro dispara contragolpe
  // Fase 2: Escotilha da torreta voa em bola de fogo
  // Fase 3: Blindado tomba de lado vazando fumaça e óleo diesel
  ctx.translate(0, t * 12);
  ctx.rotate(t * 0.4);

  const hullCol = '#b71540';

  // Esteiras de blindado arrebentadas
  ctx.strokeStyle = '#2d3436';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-R * 1.3 - t * 10, R * 0.5);
  ctx.lineTo(R * 0.8, R * 0.5);
  ctx.stroke();

  // Casco blindado principal
  ctx.fillStyle = hullCol;
  ctx.fillRect(-R * 0.8, -R * 0.4, R * 1.5, R * 0.8);
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 2.4;
  ctx.strokeRect(-R * 0.8, -R * 0.4, R * 1.5, R * 0.8);

  // Cano do morteiro quebrado apontando para baixo
  ctx.fillStyle = '#1e272e';
  ctx.save();
  ctx.translate(R * 0.4, -R * 0.3);
  ctx.rotate(t * 1.2);
  ctx.fillRect(0, -5, R * 0.7, 10);
  ctx.restore();

  // Escotilha voando
  ctx.save();
  ctx.translate(-R * 0.2 - t * 14, -R * 0.8 - t * 16);
  ctx.rotate(-t * 4);
  ctx.fillStyle = '#718093';
  ctx.fillRect(-6, -3, 12, 6);
  ctx.restore();

  // Labareda e fumaça escapando da escotilha
  if (t > 0.2) {
    ctx.fillStyle = 'rgba(53, 59, 72, 0.7)';
    ctx.beginPath();
    ctx.arc(-R * 0.2, -R * 0.5 - t * 14, 8 + t * 8, 0, Math.PI * 2);
    ctx.fill();
  }
}
