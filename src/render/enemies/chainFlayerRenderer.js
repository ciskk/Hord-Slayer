import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// Broad executioner, plain apron, and one heavy hooked chain.
export function draw(e) {
  const p = creaturePalette(e, '#c19a80', '#852c31', '#dfe4ea');
  const dead = e.deathPose || 0;
  const walk = dead ? 0 : Math.sin(frameCount * 0.18) * 0.05;
  beginCreature(ctx, e);
  stroke(ctx, [[-0.24, 0.5], [-0.32 + walk, 0.9]], p.ink, 0.24);
  stroke(ctx, [[0.25, 0.5], [0.35 - walk, 0.9]], p.ink, 0.24);
  polygon(ctx, [[-0.83, -0.28], [-0.47, -0.63], [0.3, -0.54], [0.57, -0.23], [0.49, 0.25], [-0.64, 0.31]], p.body);
  polygon(ctx, [[-0.4, -0.25], [0.29, -0.25], [0.45, 0.73], [0.1, 0.66], [-0.16, 0.88], [-0.5, 0.73]], p.shade);
  stroke(ctx, [[-0.27, -0.22], [-0.13, 0.6]], p.body, 0.08);
  polygon(ctx, [[-0.34, -0.45], [-0.23, -1.08], [0.04, -1.28], [0.37, -0.45]], p.shade);
  stroke(ctx, [[-0.13, -0.66], [0.18, -0.66]], p.ink, 0.1);
  const throwing = e.deathPose === undefined && (e.hookThrowTimer || 0) > 0;
  ctx.save();
  ctx.translate(0.23, 0.09);
  ctx.rotate(throwing ? getRelativeAimAngle(e.aimAngle ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1) : 0);
  stroke(ctx, [[0, 0], [0.45, 0.12]], p.ink, 0.25);
  stroke(ctx, [[0, 0], [0.45, 0.12]], p.body, 0.15);
  const sway = dead ? 0 : Math.sin(frameCount * 0.15) * 0.12;
  const links = throwing ? [[0.45, 0.12], [0.79, 0.06], [1.24, 0]] : [[0.45, 0.12], [0.57, 0.46], [0.94 + sway, 0.65]];
  stroke(ctx, links, p.ink, 0.14);
  stroke(ctx, links, p.accent, 0.065);
  if (!throwing) {
    ctx.translate(0.94 + sway, 0.65 + dead * 0.18);
    polygon(ctx, [[-0.06, -0.12], [0.23, -0.17], [0.32, 0.04], [0.19, 0.27], [-0.02, 0.22], [0.13, 0.1], [0.1, -0.02], [-0.06, 0.01]], p.accent);
  }
  ctx.restore();
  endCreature(ctx);
}
export function drawDying(de, t, R) {
  drawCreatureDeath(ctx, { ...de, radius: R }, t, draw, 'fall');
}
