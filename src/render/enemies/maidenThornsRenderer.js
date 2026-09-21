/**
 * src/render/enemies/maidenThornsRenderer.js
 * 
 * Renderizador procedural modular de Donzela dos Espinhos (MAIDEN_THORNS).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Donzela dos Espinhos.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 18. DONZELA DAS AGULHAS - Dama de ferro com relevo, dobradiças e estiletes
  // =========================================================================
  const R_m = e.radius;
  const isHit = e.hitFlash > 0;
  const ironPlate = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#232931');
  const ironDark = isHit ? '#ffffff' : '#111418';
  const brassRelief = isHit ? '#ffffff' : '#8c7b75';
  const bloodColor = isHit ? '#ffffff' : '#6b0000';

  // 1. Silhueta do Sarcófago Antropomórfico Vertical
  ctx.fillStyle = ironPlate;
  ctx.beginPath();
  ctx.ellipse(0, 0, R_m * 0.6, R_m * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ironDark;
  ctx.lineWidth = 2.8;
  ctx.stroke();

  // 2. Relevo da Imperatriz com Capuz e Lágrimas Esculpidas
  ctx.fillStyle = brassRelief;
  ctx.beginPath();
  ctx.arc(0, -R_m * 0.55, R_m * 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Fendas dos olhos chorando
  ctx.fillStyle = '#0a0d12';
  ctx.fillRect(-3, -R_m * 0.58, 2, 4);
  ctx.fillRect(2, -R_m * 0.58, 2, 4);

  // 3. Duas Portas Bipartidas Entreabertas com Fenda Central Sombria
  ctx.fillStyle = '#05070a';
  ctx.fillRect(-2.5, -R_m * 0.75, 5, R_m * 1.55);

  // Quatro dobradiças laterais de ferro
  ctx.fillStyle = ironDark;
  ctx.fillRect(-R_m * 0.62, -R_m * 0.4, 5, 4);
  ctx.fillRect(-R_m * 0.62, R_m * 0.2, 5, 4);
  ctx.fillRect(R_m * 0.52, -R_m * 0.4, 5, 4);
  ctx.fillRect(R_m * 0.52, R_m * 0.2, 5, 4);

  // 4. Dezenas de Estiletes de Aço Cromado em Ângulos Irregulares
  ctx.strokeStyle = '#dfe4ea';
  ctx.lineWidth = 2.0;
  for (let sp = 0; sp < 4; sp++) {
    const spy = -R_m * 0.55 + sp * (R_m * 0.36);
    const lLen = 8 + (sp % 2 === 0 ? 5 : 0);
    // Lado esquerdo
    ctx.beginPath();
    ctx.moveTo(-R_m * 0.55, spy);
    ctx.lineTo(-R_m * 0.55 - lLen, spy - 2);
    ctx.stroke();
    // Lado direito
    ctx.beginPath();
    ctx.moveTo(R_m * 0.55, spy);
    ctx.lineTo(R_m * 0.55 + lLen, spy - 2);
    ctx.stroke();
  }

  // Sangue seco escorrendo pela fenda
  ctx.fillStyle = bloodColor;
  ctx.fillRect(-1.5, R_m * 0.2, 3, R_m * 0.5);

  // 5. Pés com Rodas Dentadas na Base
  ctx.fillStyle = ironDark;
  ctx.fillRect(-R_m * 0.4, R_m * 0.85, 6, 6);
  ctx.fillRect(R_m * 0.25, R_m * 0.85, 6, 6);
}

/**
 * Renderiza a animação de morte em 3 fases de Donzela dos Espinhos.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Portas se escancaram, estiletes saltam e o sarcófago tomba pesado de costas
  ctx.translate(0, t * 12);
  ctx.scale(1, Math.max(0.08, 1 - t * 0.85));

  // Sarcófago pesado
  ctx.fillStyle = '#232931';
  ctx.fillRect(-R * 0.6, -R * 0.8, R * 1.2, R * 1.6);

  // Estiletes ejetados para os lados
  ctx.strokeStyle = '#dfe4ea';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-R * 0.6, -R * 0.2);
  ctx.lineTo(-R * 1.3 - t * 10, -R * 0.3);
  ctx.moveTo(R * 0.6, -R * 0.2);
  ctx.lineTo(R * 1.3 + t * 10, -R * 0.3);
  ctx.stroke();
}
