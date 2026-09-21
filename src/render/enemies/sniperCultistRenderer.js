/**
 * src/render/enemies/sniperCultistRenderer.js
 * 
 * Renderizador procedural modular de Cultista Franco-Atirador (SNIPER_CULTIST).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Cultista Franco-Atirador.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 21. ATIRADOR DE ÉTER - Caçador de almas com arco de ossos e monóculo
  // =========================================================================
  const R_m = e.radius;
  const isHit = e.hitFlash > 0;
  const cloakCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#22183b');
  const featherDark = isHit ? '#ffffff' : '#0c0717';
  const boneBow = isHit ? '#ffffff' : '#dfe4ea';
  const plasmaCol = isHit ? '#ffffff' : '#e056fd';

  // 1. Manto de Caçador com Gola Espessa de Penas de Corvo
  ctx.fillStyle = cloakCol;
  ctx.beginPath();
  ctx.ellipse(0, R_m * 0.15, R_m * 0.45, R_m * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gola de penas sobrepostas nos ombros
  ctx.fillStyle = featherDark;
  for (let f = -3; f <= 3; f++) {
    const fa = f * 0.25;
    ctx.fillRect(-R_m * 0.35 + f * 3.5, -R_m * 0.45, 4.5, 9);
  }

  // Bandoleira de couro cruzando o peito com tubos de flechas
  ctx.strokeStyle = '#8c7b75';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.35, -R_m * 0.3);
  ctx.lineTo(R_m * 0.25, R_m * 0.45);
  ctx.stroke();

  // 2. Capuz com Máscara e Monóculo Telescópico de 3 Lentes
  const hY = -R_m * 0.45;
  ctx.fillStyle = featherDark;
  ctx.beginPath();
  ctx.arc(0, hY, R_m * 0.36, 0, Math.PI * 2);
  ctx.fill();

  // Monóculo telescópico de latão sobre o olho direito
  ctx.fillStyle = '#d4af37';
  ctx.beginPath();
  ctx.arc(R_m * 0.18, hY - 1, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e056fd';
  ctx.beginPath();
  ctx.arc(R_m * 0.18, hY - 1, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 3. Arco Composto Biomecânico de Ossos com Roldanas de Bronze
  const bX = R_m * 0.55;
  ctx.strokeStyle = boneBow;
  ctx.lineWidth = 2.8;

  // Corpo de costelas recurvadas
  ctx.beginPath();
  ctx.arc(bX, 0, R_m * 0.9, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.stroke();

  // Roldanas mecânicas de bronze nas pontas
  ctx.fillStyle = '#d4af37';
  const tip1Y = Math.sin(-Math.PI * 0.4) * R_m * 0.9;
  const tip2Y = Math.sin(Math.PI * 0.4) * R_m * 0.9;
  ctx.fillRect(bX + Math.cos(-Math.PI * 0.4) * R_m * 0.9 - 2.5, tip1Y - 2.5, 5, 5);
  ctx.fillRect(bX + Math.cos(Math.PI * 0.4) * R_m * 0.9 - 2.5, tip2Y - 2.5, 5, 5);

  // Cabos tensores duplos de aço
  ctx.strokeStyle = '#a29bfe';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(bX + Math.cos(-Math.PI * 0.4) * R_m * 0.9, tip1Y);
  ctx.lineTo(R_m * 0.1, 0); // Ponto de puxada
  ctx.lineTo(bX + Math.cos(Math.PI * 0.4) * R_m * 0.9, tip2Y);
  ctx.stroke();

  // 4. Flecha de Cristal Facetado com Ponta Farpada
  ctx.fillStyle = plasmaCol;
  ctx.fillRect(R_m * 0.1, -1.8, R_m * 1.05, 3.6);

  // Ponta farpada de cristal
  ctx.beginPath();
  ctx.moveTo(R_m * 1.15, -4.5);
  ctx.lineTo(R_m * 1.38, 0);
  ctx.lineTo(R_m * 1.15, 4.5);
  ctx.lineTo(R_m * 1.05, 0);
  ctx.closePath();
  ctx.fill();
}

/**
 * Renderiza a animação de morte em 3 fases de Cultista Franco-Atirador.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Arco de ossos estala, penas negras dispersam e cultista tomba
  ctx.translate(0, t * 10);
  ctx.rotate(-t * 0.4);
  ctx.scale(1, Math.max(0.08, 1 - t * 0.85));

  ctx.fillStyle = '#22183b';
  ctx.fillRect(-R * 0.35, -R * 0.45, R * 0.7, R * 0.8);

  // Arco de ossos quebrado
  ctx.strokeStyle = '#dfe4ea';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(R * 0.5, -R * 0.6);
  ctx.lineTo(R * 0.6 + t * 6, -R * 0.1);
  ctx.moveTo(R * 0.5, R * 0.6);
  ctx.lineTo(R * 0.6 + t * 6, R * 0.1);
  ctx.stroke();

  // Penas negras flutuando
  ctx.fillStyle = '#0c0717';
  ctx.fillRect(-t * 8, -R * 0.6 - t * 6, 4.5, 3.5);
  ctx.fillRect(t * 8, -R * 0.4 - t * 10, 4.5, 3.5);
}
