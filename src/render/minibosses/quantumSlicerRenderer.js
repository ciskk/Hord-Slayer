/**
 * src/render/minibosses/quantumSlicerRenderer.js
 * 
 * Renderizador procedural modular do Miniboss Fatiador Quântico (QUANTUM_SLICER).
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

  const slicerCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#6c5ce7');
  const bladeCol = isHit ? '#ffffff' : '#e056fd';

  // 1. Aberração Cromática em Teleportes (Ecos Tricromáticos)
  if (e.blinkCount && e.blinkCount > 0) {
    const chromaticGhosts = [
      { color: 'rgba(255, 71, 87, 0.45)', dx: -10, dy: -4 },
      { color: 'rgba(0, 210, 211, 0.45)', dx: 8, dy: 4 },
      { color: 'rgba(162, 155, 254, 0.45)', dx: -2, dy: 6 }
    ];
    chromaticGhosts.forEach(g => {
      ctx.save();
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.ellipse(g.dx, g.dy, R * 0.65, R * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // 2. Chassi Poligonal Geométrico Futurista
  ctx.fillStyle = slicerCol;
  ctx.beginPath();
  ctx.moveTo(R * 0.65, 0);
  ctx.lineTo(R * 0.15, -R * 0.65);
  ctx.lineTo(-R * 0.65, -R * 0.45);
  ctx.lineTo(-R * 0.45, 0);
  ctx.lineTo(-R * 0.65, R * 0.45);
  ctx.lineTo(R * 0.15, R * 0.65);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a29bfe';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // 3. Núcleo de Singularidade Central Rotativo
  ctx.fillStyle = '#0a051b';
  ctx.beginPath();
  ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#00d2d3';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, 5.5, frameCount * 0.2, frameCount * 0.2 + Math.PI * 1.4);
  ctx.stroke();

  // 4. Lâminas Duplas de Plasma com Arcos Elétricos
  const bladePulse = Math.sin(frameCount * 0.3) * 4;
  ctx.strokeStyle = bladeCol;
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.moveTo(R * 0.25, -R * 0.5);
  ctx.lineTo(R * 1.45 + bladePulse, -R * 0.72);
  ctx.moveTo(R * 0.25, R * 0.5);
  ctx.lineTo(R * 1.45 + bladePulse, R * 0.72);
  ctx.stroke();

  // Micro-raios oscilantes entre as pontas das lâminas
  if (Math.floor(frameCount) % 2 === 0) {
    ctx.strokeStyle = '#00d2d3';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(R * 1.45 + bladePulse, -R * 0.72);
    ctx.lineTo(R * 1.15, 0);
    ctx.lineTo(R * 1.45 + bladePulse, R * 0.72);
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

  // Fase 1: Micro-blinks frenéticos em grade 3x3 deixando clones estáticos
  // Fase 2: Lâminas de plasma explodem em prismas de luz
  // Fase 3: As cópias colapsam para o centro numa fenda estelar brilhante
  const blinkStep = Math.sin(t * 32);
  const shiftX = (blinkStep > 0.4 ? 1 : (blinkStep < -0.4 ? -1 : 0)) * (1 - t) * 14;

  // Fantasmas de teleporte holográficos
  ctx.save();
  ctx.translate(-shiftX, 0);
  ctx.globalAlpha = bodyAlpha * 0.35;
  ctx.strokeStyle = '#00cec9';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(shiftX, 0);
  ctx.globalAlpha = bodyAlpha * 0.35;
  ctx.strokeStyle = '#e056fd';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Chassi central colapsando
  ctx.fillStyle = '#1e1a38';
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(2, R * (0.55 - t * 0.45)), 0, Math.PI * 2);
  ctx.fill();

  // Lâminas de laser explodindo em prismas coloridos em expansão
  ctx.fillStyle = '#81ecec';
  for (let p = 0; p < 8; p++) {
    const pa = p * (Math.PI / 4) + t * 4;
    const pd = R * (0.5 + t * 2.0);
    ctx.fillRect(Math.cos(pa) * pd - 3, Math.sin(pa) * pd - 3, 6, 6);
  }
}
