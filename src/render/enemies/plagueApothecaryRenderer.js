import { ctx, frameCount } from '../../state/gameState.js';
import { beginCreature, endCreature, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// Plague mask and one large healing flask replace the tiny belt bottles.
export function draw(e) {
  const p = creaturePalette(e, '#2e6a4c', '#112c29', '#38ee75');
  const dead = e.deathPose || 0;
  const preparing = e.deathPose === undefined && (e.apothecaryTimer || 0) > 88;
  const bob = dead ? 0 : Math.sin(frameCount * 0.15) * 0.045;
  beginCreature(ctx, e);
  ctx.translate(0, bob);
  polygon(ctx, [[-0.38, -0.4], [0.3, -0.4], [0.55, 0.88], [0.12, 0.71], [-0.1, 0.91], [-0.2, 0.71], [-0.59, 0.85]], p.shade);
  polygon(ctx, [[-0.33, -0.36], [-0.06, -0.3], [0.09, 0.74], [-0.48, 0.74]], p.body, null);
  polygon(ctx, [[-0.27, -0.62], [-0.11, -0.86], [0.27, -0.79], [0.45, -0.49], [0.22, -0.29], [-0.11, -0.34]], p.bone);
  polygon(ctx, [[0.26, -0.73], [1.01, -0.41], [0.69, -0.32], [0.3, -0.34]], p.bone);
  ellipse(ctx, 0.17, -0.63, 0.1, 0.1, p.ink, null);
  polygon(ctx, [[-0.36, -1.01], [0.32, -1.01], [0.34, -0.78], [0.49, -0.74], [-0.49, -0.74], [-0.36, -0.81]], p.shade);
  stroke(ctx, [[-0.38, 0.07], [0.4, 0.25]], p.ink, 0.17);
  ctx.save();
  ctx.translate(0.68, preparing ? -0.05 : 0.36 + dead * 0.14);
  ctx.rotate(dead ? dead * 0.6 : preparing ? -0.12 : 0.1);
  polygon(ctx, [[-0.13, -0.51], [0.13, -0.51], [0.13, -0.25], [0.36, 0.01], [0.29, 0.35], [-0.29, 0.35], [-0.36, 0.01], [-0.13, -0.25]], p.bone);
  polygon(ctx, [[-0.26, 0], [0.26, 0], [0.22, 0.26], [-0.22, 0.26]], p.accent, null);
  stroke(ctx, [[-0.16, -0.51], [0.16, -0.51]], p.shade, 0.11);
  stroke(ctx, [[-0.1, 0.11], [0.1, 0.11]], p.shade, 0.065);
  stroke(ctx, [[0, 0.03], [0, 0.2]], p.shade, 0.065);
  ctx.restore();
  endCreature(ctx);
}
export function drawDying(de, t, R) {
  drawCreatureDeath(ctx, { ...de, radius: R }, t, draw, 'fall');
}
