/**
 * src/render/enemies/voidScavengerRenderer.js
 * 
 * Renderizador procedural modular de Devorador do Vazio (VOID_SCAVENGER).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Devorador do Vazio.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 22. DUENDE LADRÃO DE GEMAS - Goblin desgrenhado com sacola rasgada de espólios
  // =========================================================================
  const R_m = e.radius;
  const isHit = e.hitFlash > 0;
  const skinCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#1d7358');
  const skinDark = isHit ? '#ffffff' : '#0e4a37';
  const leatherBag = isHit ? '#ffffff' : '#734d37';
  const bagScale = 1 + Math.min(0.85, (e.eatenGemsCount || 0) * 0.16);
  const runCycle = Math.sin(frameCount * 0.35) * 4;

  // 1. Pernas Ágeis com Dedos Longos Agarrando o Solo
  ctx.strokeStyle = skinDark;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, R_m * 0.3);
  ctx.lineTo(-R_m * 0.35 + runCycle, R_m * 0.75);
  ctx.lineTo(-R_m * 0.5 + runCycle, R_m * 1.05);
  ctx.moveTo(R_m * 0.25, R_m * 0.3);
  ctx.lineTo(R_m * 0.1 - runCycle, R_m * 0.75);
  ctx.lineTo(R_m * 0.35 - runCycle, R_m * 1.05);
  ctx.stroke();

  // 2. Sacola de Espólios de Couro Cru Abarrotada com Fendas e Gemas
  const bW = R_m * 0.62 * bagScale;
  const bH = R_m * 0.55 * bagScale;
  ctx.fillStyle = leatherBag;
  ctx.beginPath();
  ctx.ellipse(-R_m * 0.52, -R_m * 0.15, bW, bH, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4a2d18';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Costuras grosseiras de barbante na sacola
  ctx.strokeStyle = '#dfe4ea';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.7, -R_m * 0.35);
  ctx.lineTo(-R_m * 0.35, -R_m * 0.05);
  ctx.stroke();

  // Gemas Facetadas Transbordando por Rasgos na Sacola
  // Rubi vermelho
  ctx.fillStyle = '#ff4757';
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.65, -R_m * 0.5);
  ctx.lineTo(-R_m * 0.55, -R_m * 0.6);
  ctx.lineTo(-R_m * 0.45, -R_m * 0.5);
  ctx.lineTo(-R_m * 0.55, -R_m * 0.35);
  ctx.closePath();
  ctx.fill();

  // Safira azul
  ctx.fillStyle = '#00cec9';
  ctx.fillRect(-R_m * 0.75, -R_m * 0.2, 4.5, 4.5);

  // Topázio dourado
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.arc(-R_m * 0.35, -R_m * 0.3, 3, 0, Math.PI * 2);
  ctx.fill();

  // 3. Tronco Esguio com Colete de Retalhos
  ctx.fillStyle = skinCol;
  ctx.beginPath();
  ctx.ellipse(R_m * 0.15, R_m * 0.1, R_m * 0.42, R_m * 0.48, 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Colete de retalhos
  ctx.fillStyle = '#3d2516';
  ctx.fillRect(-2, -R_m * 0.2, R_m * 0.35, R_m * 0.45);

  // Facas de sucata presas na lombar
  ctx.strokeStyle = '#95a5a6';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.1, R_m * 0.35);
  ctx.lineTo(R_m * 0.25, R_m * 0.45);
  ctx.stroke();

  // 4. Cabeça com Nariz Adunco com Verrugas e Orelhas Rasgadas
  const ghX = R_m * 0.38;
  const ghY = -R_m * 0.35;
  ctx.fillStyle = skinCol;
  ctx.beginPath();
  ctx.arc(ghX, ghY, R_m * 0.32, 0, Math.PI * 2);
  ctx.fill();

  // Nariz adunco comprido
  ctx.beginPath();
  ctx.moveTo(ghX + 4, ghY - 2);
  ctx.lineTo(ghX + 11, ghY + 2);
  ctx.lineTo(ghX + 3, ghY + 5);
  ctx.closePath();
  ctx.fill();

  // Orelha comprida de morcego rasgada
  ctx.beginPath();
  ctx.moveTo(ghX - 2, ghY - 3);
  ctx.lineTo(ghX - R_m * 0.45, ghY - R_m * 0.65);
  ctx.lineTo(ghX - 3, ghY + 4);
  ctx.closePath();
  ctx.fill();

  // Brinco de argola de ferro na orelha
  ctx.strokeStyle = '#dfe4ea';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(ghX - R_m * 0.35, ghY - R_m * 0.5, 2, 0, Math.PI * 2);
  ctx.stroke();

  // Olhos grandes gananciosos amarelos
  ctx.fillStyle = '#f39c12';
  ctx.fillRect(ghX + 1, ghY - 4, 3.5, 3.5);
}

/**
 * Renderiza a animação de morte em 3 fases de Devorador do Vazio.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Duende capota em cambalhota, sacola rompe espalhando gemas e moedas
  ctx.translate(0, t * 12);
  ctx.rotate(t * 1.2);
  ctx.scale(Math.max(0.05, 1 - t * 0.8), Math.max(0.05, 1 - t * 0.8));

  ctx.fillStyle = '#1d7358';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.42, 0, Math.PI * 2);
  ctx.fill();

  // Gemas saltando em leque
  const gems = ['#ff4757', '#00cec9', '#f1c40f', '#e056fd'];
  for (let g = 0; g < 7; g++) {
    const ga = g * 0.9 + t * 2.2;
    const gd = R * (0.6 + t * 2.4);
    ctx.fillStyle = gems[g % 4];
    ctx.fillRect(Math.cos(ga) * gd - 2.5, Math.sin(ga) * gd - 2.5, 5, 5);
  }
}
