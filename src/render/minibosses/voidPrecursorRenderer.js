/**
 * src/render/minibosses/voidPrecursorRenderer.js
 * 
 * Renderizador procedural modular do Miniboss Precursor do Vazio (VOID_PRECURSOR).
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

  // 1. Núcleo Devorador de Luz do Horizonte de Eventos
  ctx.fillStyle = isHit ? '#ffffff' : '#000000';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.75, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8e44ad';
  ctx.lineWidth = 3.2;
  ctx.stroke();

  // 2. Disco de Acreção Estelar com Partículas e Velocidade Kepleriana
  const spinMult = (e.actionState === 'WINDUP' ? 2.2 : 1.0);
  
  // Anel Externo Violeta
  ctx.strokeStyle = isHit ? '#ffffff' : 'rgba(142, 68, 173, 0.7)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 1.4, R * 0.6, frameCount * 0.04 * spinMult, 0, Math.PI * 2);
  ctx.stroke();

  // Anel Intermediário Magenta
  ctx.strokeStyle = isHit ? '#ffffff' : 'rgba(232, 67, 147, 0.6)';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 1.25, R * 0.52, -frameCount * 0.05 * spinMult, 0, Math.PI * 2);
  ctx.stroke();

  // Anel Interno Ciano Relativístico
  ctx.strokeStyle = isHit ? '#ffffff' : 'rgba(0, 206, 201, 0.75)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 1.1, R * 0.44, frameCount * 0.07 * spinMult, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Poeira Estelar Cintilante em Órbita
  ctx.fillStyle = '#a29bfe';
  for (let f = 0; f < 5; f++) {
    const fa = frameCount * 0.06 + f * 1.3;
    ctx.fillRect(Math.cos(fa) * (R * 0.95) - 2, Math.sin(fa) * (R * 0.95) - 2, 4, 4);
  }
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

  // Fase 1: Disco de acreção inverte rotação e expande
  // Fase 2: Pulso gravitacional de sucção e clarão de supernova no núcleo
  // Fase 3: Implosão total em ponto negro com anel de choque violeta
  const pulseIn = t < 0.5 ? (1 + t * 0.6) : Math.max(0.02, 1.3 - (t - 0.5) * 2.6);

  // Anel de choque gravitacional em expansão
  ctx.strokeStyle = '#8e44ad';
  ctx.lineWidth = 2.5 * (1 - t);
  ctx.beginPath();
  ctx.arc(0, 0, R * (0.8 + t * 2.5), 0, Math.PI * 2);
  ctx.stroke();

  // Disco de acreção rodando velozmente
  ctx.strokeStyle = '#e056fd';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 1.2 * pulseIn, R * 0.45 * pulseIn, t * 8, 0, Math.PI * 2);
  ctx.stroke();

  // Núcleo do Horizonte de Eventos (Preto Absoluto -> Flash Branco -> Implosão)
  ctx.fillStyle = (t > 0.4 && t < 0.6) ? '#ffffff' : '#000000';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.75 * pulseIn, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a29bfe';
  ctx.lineWidth = 1.8;
  ctx.stroke();
}
