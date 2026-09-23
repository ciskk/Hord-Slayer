import { ctx, frameCount } from '../../state/gameState.js';
import { beginCreature, endCreature, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// A parchment-robed scholar carries a large open book with one shield rune.
export function draw(e) {
  const p = creaturePalette(e, '#d8bc74', '#572654', '#00d8ed');
  const dead = e.deathPose || 0;
  beginCreature(ctx, e);
  ctx.translate(0, dead ? 0 : Math.sin(frameCount * 0.12) * 0.07);
  polygon(ctx, [[-0.4, -0.36], [0.3, -0.36], [0.41, 0.67], [0.07, 0.99], [-0.02, 0.62], [-0.21, 0.81], [-0.32, 0.61], [-0.65, 0.91]], p.shade);
  polygon(ctx, [[-0.28, -0.31], [-0.07, -0.31], [0.03, 0.7], [-0.22, 0.77]], p.body, null);
  polygon(ctx, [[-0.43, -0.45], [-0.32, -0.88], [0, -1.02], [0.3, -0.76], [0.27, -0.36]], p.body);
  polygon(ctx, [[-0.19, -0.66], [0.02, -0.84], [0.17, -0.61], [0.11, -0.39], [-0.18, -0.43]], p.ink, null);
  stroke(ctx, [[-0.12, -0.62], [0.1, -0.62]], p.accent, 0.075);
  ctx.save();
  ctx.translate(0.25, 0.16 + dead * 0.18);
  ctx.rotate(dead * 0.35);
  polygon(ctx, [[-0.44, -0.43], [0.02, -0.3], [0.52, -0.43], [0.57, 0.33], [0.02, 0.47], [-0.48, 0.34]], p.shade);
  polygon(ctx, [[-0.35, -0.32], [0.02, -0.21], [0.43, -0.32], [0.46, 0.24], [0.02, 0.36], [-0.38, 0.24]], p.bone);
  stroke(ctx, [[0.02, -0.21], [0.02, 0.36]], p.shade, 0.06);
  // The motif is on the book, so the protective role stays readable in a crowd.
  polygon(ctx, [[0.12, -0.04], [0.35, -0.09], [0.35, 0.12], [0.24, 0.23], [0.13, 0.16]], dead ? p.body : p.accent, p.shade, 0.045);
  stroke(ctx, [[-0.28, -0.13], [-0.09, -0.08]], p.body, 0.05);
  stroke(ctx, [[-0.28, 0.03], [-0.09, 0.08]], p.body, 0.05);
  ctx.restore();
  endCreature(ctx);
}
export function drawDying(de, t, R) {
  drawCreatureDeath(ctx, { ...de, radius: R }, t, draw, 'dissolve');
}
