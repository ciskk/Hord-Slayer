/**
 * src/render/minibosses/highOccultistRenderer.js
 * 
 * Renderizador procedural modular do Miniboss Alto Sacerdote (HIGH_OCCULTIST).
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

  const hover = Math.sin(frameCount * 0.09) * 5;
  const drape = Math.sin(frameCount * 0.15) * 3.5;
  const robeCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#2c003e');

  // 1. Túnica Cerimonial com Caimento Esvoaçante
  ctx.fillStyle = robeCol;
  ctx.beginPath();
  ctx.moveTo(-R * 0.5, -R * 0.7 + hover);
  ctx.lineTo(R * 0.5, -R * 0.7 + hover);
  ctx.lineTo(R * 0.7 + drape, R * 1.0 + hover);
  ctx.quadraticCurveTo(0, R * 0.8 + hover, -R * 0.7 - drape, R * 1.0 + hover);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f1c40f';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Bordados Arcanos Dourados na Bainha da Túnica
  ctx.fillStyle = '#f1c40f';
  for (let run = -3; run <= 3; run++) {
    ctx.fillRect(run * 7 - 1.5, R * 0.88 + hover, 3, 3);
  }

  // 2. Capuz de Vazio Absoluto e Olhos Astrais Fúcsia
  ctx.fillStyle = '#05000a';
  ctx.beginPath();
  ctx.arc(0, -R * 0.6 + hover, R * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Olhos Estelares que Brilham na Escuridão
  ctx.fillStyle = '#e056fd';
  ctx.fillRect(-R * 0.18, -R * 0.65 + hover, 4.5, 4.5);
  ctx.fillRect(R * 0.06, -R * 0.65 + hover, 4.5, 4.5);

  // 3. Cajado Arcano com Prisma de Ametista Levitante
  const isRitual = (e.actionState === 'WINDUP' || (e.ritualTimer && e.ritualTimer > 100));
  const stX = R * 0.9;
  ctx.strokeStyle = '#95a5a6';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(stX, R * 0.85 + hover);
  ctx.lineTo(stX, -R * 1.1 + hover);
  ctx.stroke();

  // Prisma de Ametista Levitante
  const gemPulse = Math.sin(frameCount * 0.2) * 2;
  ctx.fillStyle = isRitual ? '#ff4757' : '#a29bfe';
  ctx.beginPath();
  ctx.moveTo(stX, -R * 1.35 + hover - gemPulse);
  ctx.lineTo(stX + 6, -R * 1.2 + hover - gemPulse);
  ctx.lineTo(stX, -R * 1.05 + hover - gemPulse);
  ctx.lineTo(stX - 6, -R * 1.2 + hover - gemPulse);
  ctx.closePath();
  ctx.fill();

  // Anéis de Energia Gravitacional Cósmica no Ritual
  if (isRitual) {
    ctx.strokeStyle = 'rgba(224, 86, 253, 0.75)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(stX, -R * 1.2 + hover, 14 + gemPulse * 2, 0, Math.PI * 2);
    ctx.stroke();
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

  // Fase 1: Cessação de levitação, cai no solo com túnica ondulando
  // Fase 2: Orbes de gravidade orbitam em aceleração e convergem ao peito
  // Fase 3: As vestes colapsam num ponto singular de gravidade e glifos sobem
  ctx.translate(0, t * 16);

  const robeCol = '#2c003e';

  // Túnica cerimonial desabando
  ctx.fillStyle = robeCol;
  ctx.beginPath();
  ctx.moveTo(-R * 0.6 * (1 + t * 0.4), R * 0.8);
  ctx.lineTo(0, -R * 0.5 * (1 - t * 0.6));
  ctx.lineTo(R * 0.6 * (1 + t * 0.4), R * 0.8);
  ctx.closePath();
  ctx.fill();

  // Orbes de gravidade em espiral convergente para o centro
  const orbRadius = Math.max(1, R * (1.2 - t * 1.1));
  const orbSpin = t * Math.PI * 8;
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#9c88ff';
  ctx.lineWidth = 1.5;
  for (let o = 0; o < 3; o++) {
    const oa = orbSpin + o * (Math.PI * 2 / 3);
    const ox = Math.cos(oa) * orbRadius;
    const oy = Math.sin(oa) * (orbRadius * 0.5) - R * 0.1;
    ctx.beginPath();
    ctx.arc(ox, oy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Glifos cósmicos dourados ascendendo ao explodir o ponto singular
  if (t > 0.45) {
    ctx.fillStyle = '#f1c40f';
    for (let g = 0; g < 5; g++) {
      const ga = g * 1.3 + t * 3;
      const gy = -R * 0.2 - (t - 0.45) * 26 - g * 4;
      ctx.fillRect(Math.cos(ga) * 8 - 2, gy, 4, 4);
    }
  }
}
