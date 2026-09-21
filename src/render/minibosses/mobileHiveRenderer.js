/**
 * src/render/minibosses/mobileHiveRenderer.js
 * 
 * Renderizador procedural modular do Miniboss Ninho Móvel (MOBILE_HIVE).
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

  const bioPulse = Math.sin(frameCount * 0.09) * 3;
  const hiveCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#16a085');

  // 1. Carcaça de Favo de Mel Respirante
  ctx.fillStyle = hiveCol;
  ctx.beginPath();
  ctx.moveTo(0, -R * 1.0 - bioPulse);
  ctx.quadraticCurveTo(R * 1.0 + bioPulse, -R * 0.5, R * 0.85, R * 0.5);
  ctx.quadraticCurveTo(0, R * 1.15 + bioPulse, -R * 0.85, R * 0.5);
  ctx.quadraticCurveTo(-R * 1.0 - bioPulse, -R * 0.5, 0, -R * 1.0 - bioPulse);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0e6251';
  ctx.lineWidth = 2.8;
  ctx.stroke();

  // Cavidades Celulares Orgânicas
  ctx.fillStyle = '#0b3b32';
  const hives = [[-R * 0.4, -R * 0.35], [R * 0.38, -R * 0.25], [-R * 0.12, R * 0.4], [R * 0.42, R * 0.35]];
  for (let h = 0; h < 4; h++) {
    ctx.beginPath();
    ctx.ellipse(hives[h][0], hives[h][1], 7, 5, h * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Mini-Enxame Caótico e Turbulento (6 Insetos/Morcegos)
  ctx.fillStyle = '#ff4757';
  for (let b = 0; b < 5; b++) {
    const bAng = frameCount * 0.11 + (b * Math.PI * 2 / 5);
    const bx = Math.cos(bAng) * (R * 1.35);
    const by = Math.sin(bAng) * (R * 0.95);
    const bFlap = Math.sin(frameCount * 0.45 + b) * 3.5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 4.5, by - 4.5 + bFlap);
    ctx.lineTo(bx + 4.5, by - 4.5 + bFlap);
    ctx.closePath();
    ctx.fill();
  }

  // 3. Gavinhas Parasitas Rastejantes
  ctx.strokeStyle = '#0e6251';
  ctx.lineWidth = 2;
  for (let t = -1; t <= 1; t++) {
    const wave = Math.sin(frameCount * 0.15 + t) * 4;
    ctx.beginPath();
    ctx.moveTo(t * 10, R * 0.8);
    ctx.lineTo(t * 14 + wave, R * 1.35);
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

  // Fase 1: Alvéolos hexagonais trincam e vazam néctar tóxico
  // Fase 2: Morcegos remanescentes fogem em pânico em todas as direções
  // Fase 3: A estrutura bio-orgânica parte em 3 blocos e desmancha em esporos
  ctx.translate(0, t * 12);

  const hiveCol = '#16a085';

  // 3 Blocos de favo se separando
  ctx.fillStyle = hiveCol;
  ctx.beginPath();
  ctx.arc(-R * 0.3 - t * 10, -t * 6, R * 0.4, 0, Math.PI * 2);
  ctx.arc(R * 0.3 + t * 10, -t * 6, R * 0.4, 0, Math.PI * 2);
  ctx.arc(0, t * 8, R * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Alvéolos escuros desfeitos
  ctx.fillStyle = '#0e4438';
  ctx.fillRect(-R * 0.2 - t * 6, -3, 6, 6);
  ctx.fillRect(R * 0.2 + t * 6, -3, 6, 6);

  // Silhuetas de mini-morcegos fugindo para o alto
  ctx.fillStyle = '#2c3e50';
  for (let b = 0; b < 4; b++) {
    const bx = -R * 0.6 + b * (R * 0.4) + Math.sin(t * 8 + b) * 8;
    const by = -R * 0.8 - t * 24 - b * 4;
    ctx.beginPath();
    ctx.moveTo(bx - 6, by - 2);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + 6, by - 2);
    ctx.stroke();
  }

  // Nuvem de esporos turquesa
  if (t > 0.35) {
    ctx.fillStyle = 'rgba(72, 219, 251, 0.7)';
    for (let ep = 0; ep < 6; ep++) {
      const epa = ep * 1.05 + t * 2;
      const epd = R * (0.4 + (t - 0.35) * 1.8);
      ctx.fillRect(Math.cos(epa) * epd - 2, Math.sin(epa) * epd - 2, 4, 4);
    }
  }
}
