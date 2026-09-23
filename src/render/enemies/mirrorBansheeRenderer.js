import { ctx, frameCount } from '../../state/gameState.js';
import { beginCreature, endCreature, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// A continuous ghost silhouette carries a single recognizable hand mirror.
export function draw(e) {
  const p = creaturePalette(e, '#bda1ff', '#6938ac', '#8be7ff');
  const dead = e.deathPose || 0;
  const wave = dead ? 0 : Math.sin(frameCount * 0.16) * 0.12;
  beginCreature(ctx, e);
  ctx.globalAlpha *= e.isDecoy ? 0.42 : 0.92;
  polygon(ctx, [[-0.35, -0.72], [-0.09, -0.97], [0.29, -0.78], [0.35, -0.33], [0.54, 0.3], [0.29 + wave, 0.65], [-0.06 + wave, 1.04], [-0.13, 0.59], [-0.48, 0.8], [-0.41, 0.17], [-0.63, 0.33]], p.shade);
  polygon(ctx, [[-0.27, -0.63], [-0.03, -0.88], [0.25, -0.66], [0.22, -0.17], [0.36, 0.38], [0.02 + wave, 0.8], [-0.01, 0.22], [-0.26, 0.45], [-0.2, -0.22]], p.body);
  polygon(ctx, [[-0.17, -0.69], [0.01, -0.91], [0.21, -0.72], [0.2, -0.48], [0.05, -0.29], [-0.14, -0.48]], p.bone);
  stroke(ctx, [[-0.08, -0.65], [-0.01, -0.64]], p.ink, 0.065);
  stroke(ctx, [[0.08, -0.64], [0.15, -0.65]], p.ink, 0.065);
  polygon(ctx, [[-0.02, -0.52], [0.12, -0.52], [0.13, -0.37], [0.06, -0.29], [-0.01, -0.38]], p.ink, null);
  stroke(ctx, [[0.27, -0.08], [0.65, 0.2]], p.shade, 0.15);
  ctx.save();
  ctx.translate(0.79, -0.08 + dead * 0.2);
  ctx.rotate(0.15 + dead * 0.65);
  stroke(ctx, [[0, 0.2], [0, 0.56]], p.ink, 0.17);
  stroke(ctx, [[0, 0.2], [0, 0.56]], p.body, 0.085);
  polygon(ctx, [[0, -0.66], [0.3, -0.37], [0.3, 0.09], [0, 0.35], [-0.3, 0.09], [-0.3, -0.37]], p.body);
  polygon(ctx, [[0, -0.51], [0.21, -0.32], [0.21, 0.04], [0, 0.21], [-0.21, 0.04], [-0.21, -0.32]], p.accent, p.shade, 0.05);
  stroke(ctx, [[-0.12, -0.19], [0.06, -0.36]], p.bone, 0.065);
  if (dead > 0.2) stroke(ctx, [[0, -0.42], [-0.06, -0.1], [0.1, 0.06]], p.shade, 0.055);
  ctx.restore();
  endCreature(ctx);
}
export function drawDying(de, t, R) {
  drawCreatureDeath(ctx, { ...de, radius: R }, t, draw, 'dissolve');
}
