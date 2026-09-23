import { ctx, frameCount } from '../../state/gameState.js';
import { beginCreature, endCreature, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// One large bronze bell carried by a bent, hooded attendant.
export function draw(e) {
  const p = creaturePalette(e, '#d69c12', '#664516', '#ffe283');
  const dead = e.deathPose || 0;
  const ringing = e.deathPose === undefined && (e.bellTimer || 0) > 88;
  beginCreature(ctx, e);
  polygon(ctx, [[0.13, -0.29], [0.67, -0.18], [0.76, 0.88], [-0.1, 0.88]], p.shade);
  polygon(ctx, [[0.28, -0.34], [0.49, -0.83], [0.74, -0.67], [0.93, -0.3], [0.7, -0.05], [0.41, -0.13]], p.shade);
  polygon(ctx, [[0.58, -0.57], [0.75, -0.43], [0.7, -0.18], [0.55, -0.22]], p.ink, null);
  stroke(ctx, [[0.25, 0.31], [-0.01, 0.12], [-0.33, -0.25]], p.ink, 0.19);
  stroke(ctx, [[0.25, 0.31], [-0.01, 0.12], [-0.33, -0.25]], p.bone, 0.1);
  ctx.save();
  ctx.translate(-0.35 + dead * 0.28, -0.8 + dead * 0.2);
  ctx.rotate(dead ? -dead * 0.55 : Math.sin(frameCount * (ringing ? 0.42 : 0.12)) * (ringing ? 0.28 : 0.06));
  ellipse(ctx, 0, -0.03, 0.14, 0.17, p.shade);
  polygon(ctx, [[-0.17, 0], [0.17, 0], [0.37, 0.24], [0.49, 0.84], [0.64, 0.96], [0.64, 1.1], [-0.64, 1.1], [-0.64, 0.96], [-0.49, 0.84], [-0.37, 0.24]], p.body);
  polygon(ctx, [[0.04, 0.08], [0.26, 0.2], [0.42, 0.86], [0.04, 0.86]], p.shade, null);
  stroke(ctx, [[-0.54, 0.96], [0.54, 0.96]], p.accent, 0.11);
  ellipse(ctx, 0, 1.15, 0.15, 0.13, p.shade);
  ctx.restore();
  endCreature(ctx);
}
export function drawDying(de, t, R) {
  drawCreatureDeath(ctx, { ...de, radius: R }, t, draw, 'fall');
}
