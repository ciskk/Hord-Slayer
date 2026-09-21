/**
 * src/render/enemies/tollBellringerRenderer.js
 * 
 * Renderizador procedural modular de Sineiro das Almas (TOLL_BELLRINGER).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Sineiro das Almas.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 14. ARAUTO DO SINO FÚNEBRE - Penitente com cadafalso de carvalho e sino
  // =========================================================================
  const R_m = e.radius;
  const isHit = e.hitFlash > 0;
  const woodColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#4a2d18');
  const bronzeColor = isHit ? '#ffffff' : '#b8860b';
  const bronzeDark = isHit ? '#ffffff' : '#785705';
  const clothColor = isHit ? '#ffffff' : '#3b2f27';
  const bellSway = Math.sin(frameCount * 0.18) * 0.28;

  // 1. Monge Penitente Decrépito Curvado em Ângulo Agudo
  ctx.fillStyle = clothColor;
  ctx.beginPath();
  ctx.ellipse(-R_m * 0.15, R_m * 0.25, R_m * 0.5, R_m * 0.62, 0.42, 0, Math.PI * 2);
  ctx.fill();

  // Pés descalços enfaixados
  ctx.fillStyle = '#8c7b75';
  ctx.fillRect(-R_m * 0.35, R_m * 0.75, 5, 4);
  ctx.fillRect(R_m * 0.05, R_m * 0.72, 5, 4);

  // Capuz esfarrapado cobrindo o rosto
  ctx.fillStyle = '#261b14';
  ctx.beginPath();
  ctx.arc(R_m * 0.38, -R_m * 0.15, R_m * 0.34, 0, Math.PI * 2);
  ctx.fill();

  // 2. Estrutura de Madeira de Cadafalso nas Costas (Cruzeta de Carvalho)
  ctx.fillStyle = woodColor;
  // Trave vertical
  ctx.fillRect(-R_m * 0.45, -R_m * 0.85, 7, R_m * 1.35);
  // Trave horizontal (canga)
  ctx.fillRect(-R_m * 0.75, -R_m * 0.85, R_m * 1.15, 6.5);
  ctx.strokeStyle = '#1a0f08';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(-R_m * 0.75, -R_m * 0.85, R_m * 1.15, 6.5);

  // Braçadeiras de ferro forjado nas junções
  ctx.fillStyle = '#2f3542';
  ctx.fillRect(-R_m * 0.48, -R_m * 0.88, 10, 3);
  ctx.fillRect(-R_m * 0.48, -R_m * 0.78, 10, 3);

  // 3. O Grande Sino Litúrgico de Bronze com Oscilação Pendular
  ctx.save();
  ctx.translate(-R_m * 0.35, -R_m * 0.75);
  ctx.rotate(bellSway);

  // Olhal de ferro forjado
  ctx.strokeStyle = '#2f3542';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, -3, 4.5, 0, Math.PI * 2);
  ctx.stroke();

  // Corpo cônico do sino gótico
  ctx.fillStyle = bronzeColor;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.45, R_m * 0.72);
  ctx.quadraticCurveTo(-R_m * 0.35, 0, 0, -R_m * 0.15);
  ctx.quadraticCurveTo(R_m * 0.35, 0, R_m * 0.45, R_m * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = bronzeDark;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Aba grossa na boca do sino com pátina verde-azulada
  ctx.fillStyle = '#16a085';
  ctx.fillRect(-R_m * 0.52, R_m * 0.68, R_m * 1.04, 3.8);

  // Anjos da morte esculpidos em relevo na saia
  ctx.fillStyle = bronzeDark;
  ctx.fillRect(-3, R_m * 0.25, 6, 8);

  // Badalo pesado de ferro fundido
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(0, R_m * 0.8, 3.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. Braços e Corda de Puxada
  ctx.strokeStyle = '#8c7b75';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(R_m * 0.25, R_m * 0.1);
  ctx.lineTo(-R_m * 0.1, R_m * 0.35);
  ctx.stroke();
}

/**
 * Renderiza a animação de morte em 3 fases de Sineiro das Almas.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Armação parte, sino tomba rolando no chão e monge desaba
  ctx.translate(0, t * 14);
  ctx.rotate(t * 0.45);

  // Monge caído
  ctx.fillStyle = '#3b2f27';
  ctx.fillRect(-R * 0.5, -R * 0.2, R * 0.7, R * 0.55);

  // Sino de bronze rolando com badalo solto
  ctx.save();
  ctx.translate(R * 0.4 + t * 10, t * 6);
  ctx.rotate(t * 1.4);
  ctx.fillStyle = '#b8860b';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16a085';
  ctx.fillRect(-R * 0.48, R * 0.35, R * 0.96, 3.5);
  ctx.restore();
}
