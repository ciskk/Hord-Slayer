/**
 * src/render/enemies/chainFlayerRenderer.js
 * 
 * Renderizador procedural modular de Torturador de Correntes (CHAIN_FLAYER).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Torturador de Correntes.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 12. FLAGELADOR DE CORRENTES - Algoz inquisitorial com avental e gancho
  // =========================================================================
  const R_m = e.radius;
  const isHit = e.hitFlash > 0;
  const skinPale = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#8c7b75');
  const apronLeather = isHit ? '#ffffff' : '#3b1c1c';
  const bloodStain = isHit ? '#ffffff' : '#5c0000';
  const ironChain = isHit ? '#ffffff' : '#95a5a6';
  const walk = Math.sin(frameCount * 0.18);

  // 1. Ombros Nus e Cicatrizes de Auto-Flagelo
  ctx.fillStyle = skinPale;
  ctx.beginPath();
  ctx.arc(0, -R_m * 0.15 + walk * 0.8, R_m * 0.62, 0, Math.PI * 2);
  ctx.fill();

  // Cicatrizes de açoite nos ombros
  ctx.strokeStyle = '#4a0808';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.4, -R_m * 0.35 + walk);
  ctx.lineTo(-R_m * 0.15, -R_m * 0.1 + walk);
  ctx.moveTo(-R_m * 0.35, -R_m * 0.05 + walk);
  ctx.lineTo(-R_m * 0.1, R_m * 0.15 + walk);
  ctx.stroke();

  // 2. Avental de Açougueiro de Couro Curtido Manchado
  ctx.fillStyle = apronLeather;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.35, -R_m * 0.35 + walk * 0.8);
  ctx.lineTo(R_m * 0.35, -R_m * 0.35 + walk * 0.8);
  ctx.lineTo(R_m * 0.55, R_m * 0.75 + walk * 0.8);
  ctx.lineTo(-R_m * 0.55, R_m * 0.75 + walk * 0.8);
  ctx.closePath();
  ctx.fill();

  // Manchas de sangue seco no avental
  ctx.fillStyle = bloodStain;
  ctx.fillRect(-R_m * 0.2, R_m * 0.1 + walk * 0.8, R_m * 0.45, R_m * 0.35);

  // Correias com fivelas de bronze
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.35, -R_m * 0.35 + walk * 0.8);
  ctx.lineTo(R_m * 0.35, R_m * 0.3 + walk * 0.8);
  ctx.stroke();

  // 3. Capuz Cego de Inquisição com Placa de Ferro e 3 Pregos
  const hX = R_m * 0.12;
  const hY = -R_m * 0.65 + walk * 1.2;

  ctx.fillStyle = '#1e1616';
  ctx.beginPath();
  ctx.moveTo(hX - R_m * 0.3, hY + R_m * 0.25);
  ctx.lineTo(hX, hY - R_m * 0.65); // Ápice cônico
  ctx.lineTo(hX + R_m * 0.3, hY + R_m * 0.25);
  ctx.closePath();
  ctx.fill();

  // Placa de ferro cegando os olhos
  ctx.fillStyle = '#576574';
  ctx.fillRect(hX - R_m * 0.22, hY - 1, R_m * 0.44, 4.5);

  // Três pregos simbólicos cravados na chapa
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(hX - R_m * 0.14, hY, 2, 2.5);
  ctx.fillRect(hX - 1, hY, 2, 2.5);
  ctx.fillRect(hX + R_m * 0.1, hY, 2, 2.5);

  // 4. Antebraço Envolto em Correntes Pesadas
  const handX = R_m * 0.45;
  const handY = R_m * 0.15 + walk * 1.5;

  ctx.fillStyle = skinPale;
  ctx.fillRect(handX - 4, handY - 4, 8, 8);

  // Voltas de corrente no pulso
  ctx.strokeStyle = ironChain;
  ctx.lineWidth = 2.2;
  ctx.strokeRect(handX - 5, handY - 5, 10, 10);

  // 5. O Mangual: Elos Ovais Entrelaçados e Gancho de Desossa
  const chainRot = frameCount * 0.26;
  ctx.strokeStyle = ironChain;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let c = 0; c < 5; c++) {
    const cAng = chainRot + c * 0.45;
    const cDist = 9 + c * 4.2;
    const linkX = handX + Math.cos(cAng) * cDist;
    const linkY = handY + Math.sin(cAng) * (cDist * 0.6);
    if (c === 0) ctx.moveTo(handX, handY);
    ctx.lineTo(linkX, linkY);
  }
  ctx.stroke();

  // Lâmina de Gancho de Desossa Triangular Denteada
  const tipAng = chainRot + 4 * 0.45;
  const tipDist = 30;
  const tipX = handX + Math.cos(tipAng) * tipDist;
  const tipY = handY + Math.sin(tipAng) * (tipDist * 0.6);

  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(tipAng + Math.PI * 0.5);

  // Corpo do gancho de aço forjado
  ctx.fillStyle = '#dfe4ea';
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(6, 6);
  ctx.lineTo(1, 4);
  ctx.lineTo(-5, 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2d3436';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Dentes de serra na lâmina interna
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(-2, 0, 4, 2);
  ctx.restore();
}

/**
 * Renderiza a animação de morte em 3 fases de Torturador de Correntes.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Algoz tomba de joelhos, correntes caem e amontoam, gancho desliza no solo
  ctx.translate(0, t * 12);
  ctx.rotate(t * 0.4);
  ctx.scale(1 + t * 0.15, Math.max(0.08, 1 - t * 0.8));

  // Corpo e avental ensanguentado
  ctx.fillStyle = '#3b1c1c';
  ctx.fillRect(-R * 0.5, -R * 0.35, R * 0.85, R * 0.8);

  // Capuz caído
  ctx.fillStyle = '#1e1616';
  ctx.beginPath();
  ctx.arc(R * 0.1, -R * 0.45, R * 0.32, 0, Math.PI * 2);
  ctx.fill();

  // Gancho e correntes amontoadas no chão
  ctx.strokeStyle = '#95a5a6';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(R * 0.2, R * 0.35);
  ctx.lineTo(R * 0.8 + t * 10, R * 0.45);
  ctx.stroke();
}
