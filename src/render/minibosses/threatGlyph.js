/** Quiet ground marker: rank information sits beneath the model, never over it. */
import { ctx } from '../../main.js';

export function drawThreatGlyph(R, color, isHit, isEnraged) {
  ctx.save();
  ctx.strokeStyle = isEnraged ? '#d77867' : '#ae9562';
  ctx.globalAlpha *= isEnraged ? 0.7 : 0.38;
  ctx.lineWidth = isEnraged ? 1.8 : 1.2;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.88, R * 1.1, R * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawDyingThreatGlyph(R, color, t) {
  const alpha = Math.max(0, 1 - t * 2.5);
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  drawThreatGlyph(R, color, false, false);
  ctx.restore();
}