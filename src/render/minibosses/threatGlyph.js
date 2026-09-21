/**
 * src/render/minibosses/threatGlyph.js
 * 
 * Renderização procedural dos glifos rúnicos de solo de alta ameaça para Minibosses.
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Glifo de Ameaça Rúnico de solo desenhado sob os pés do Miniboss.
 * @param {number} R Raio de colisão do monstro
 * @param {string} color Cor base/elite do monstro
 * @param {boolean} isHit Flag indicando se está em flash de dano
 * @param {boolean} isEnraged Flag indicando se o monstro está em fúria
 */
export function drawThreatGlyph(R, color, isHit, isEnraged) {
  const glyphPulse = Math.sin(frameCount * 0.12) * 2.5;
  const glyphCol = isHit ? '#ffffff' : (isEnraged ? '#ff4757' : color);

  ctx.save();
  // Brilho suave sob o glifo
  ctx.fillStyle = isEnraged ? 'rgba(231, 76, 60, 0.08)' : 'rgba(243, 156, 18, 0.05)';
  ctx.beginPath();
  ctx.ellipse(0, R * 0.82, R * 1.35 + glyphPulse, R * 0.5 + glyphPulse * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Anel Externo Principal
  ctx.strokeStyle = glyphCol;
  ctx.lineWidth = isEnraged ? 2.4 : 1.8;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.82, R * 1.32 + glyphPulse, R * 0.48 + glyphPulse * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Anel Interno Fino Concêntrico
  ctx.strokeStyle = isEnraged ? 'rgba(255, 71, 87, 0.45)' : 'rgba(241, 196, 15, 0.35)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.82, R * 0.95 + glyphPulse * 0.6, R * 0.34 + glyphPulse * 0.2, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 8 Marcadores Rúnicos Orbitais no Perímetro
  const count = isEnraged ? 8 : 6;
  const rot = frameCount * (isEnraged ? 0.045 : 0.025);
  ctx.lineWidth = isEnraged ? 2.2 : 1.6;
  for (let i = 0; i < count; i++) {
    const a = rot + (i * Math.PI * 2) / count;
    const gx = Math.cos(a) * (R * 1.32 + glyphPulse);
    const gy = R * 0.82 + Math.sin(a) * (R * 0.48 + glyphPulse * 0.35);
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + Math.cos(a) * 4.5, gy + Math.sin(a) * 2.8);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Glifo de Ameaça agonizante: racha, perde a rotação rúnica e apaga no chão.
 * @param {number} R Raio de colisão
 * @param {string} color Cor da criatura
 * @param {number} t Progresso normalizado de morte (0 a 1)
 */
export function drawDyingThreatGlyph(R, color, t) {
  const glyphAlpha = Math.max(0, 1 - t * 1.35);
  if (glyphAlpha <= 0.01) return;

  const shatter = t * 14;
  ctx.save();
  ctx.globalAlpha = glyphAlpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.5, 2.0 * (1 - t));

  // Anel Externo Fraturando
  ctx.beginPath();
  ctx.ellipse(0, R * 0.82, Math.max(2, R * 1.32 - shatter * 0.4), Math.max(1, R * 0.48 - shatter * 0.2), 0, 0, Math.PI * 2);
  ctx.stroke();

  // Rachaduras radiais partindo do centro do glifo
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let c = 0; c < 6; c++) {
    const ca = c * (Math.PI / 3) + 0.2;
    const cr = (R * 1.3) * (0.3 + (c % 2) * 0.4);
    ctx.moveTo(0, R * 0.82);
    ctx.lineTo(Math.cos(ca) * cr, R * 0.82 + Math.sin(ca) * (cr * 0.4));
  }
  ctx.stroke();
  ctx.restore();
}
