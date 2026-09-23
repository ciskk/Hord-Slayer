import { ctx, frameCount } from '../../state/gameState.js';
import { beginCreature, endCreature, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// Hooked ears, reaching claws, and one swelling sack of stolen ether.
export function draw(e) {
  const p = creaturePalette(e, '#24a67c', '#0b5345', '#00e1db');
  const sack = creaturePalette(e, '#805132', '#452719', '#00e1db');
  const dead = e.deathPose || 0;
  const run = dead ? 0 : Math.sin(frameCount * 0.32) * 0.15;
  const bagScale = 1 + Math.min(0.85, (e.eatenGemsCount || 0) * 0.16);
  beginCreature(ctx, e);
  for (const side of [-1, 1]) {
    stroke(ctx, [[0.02 + side * 0.2, 0.35], [side * 0.31 + side * run, 0.67], [side * 0.5 + side * run, 0.87]], p.ink, 0.19);
    stroke(ctx, [[0.02 + side * 0.2, 0.35], [side * 0.31 + side * run, 0.67], [side * 0.5 + side * run, 0.87]], p.body, 0.1);
  }
  ctx.save();
  ctx.translate(-0.56, -0.13);
  ctx.scale(bagScale, bagScale);
  polygon(ctx, [[-0.23, -0.57], [0.14, -0.57], [0.14, -0.34], [0.4, -0.13], [0.41, 0.26], [0.14, 0.47], [-0.38, 0.39], [-0.56, 0.03], [-0.4, -0.29], [-0.2, -0.35]], sack.body);
  polygon(ctx, [[-0.29, -0.27], [-0.07, -0.4], [0.13, -0.24], [-0.01, 0.05]], p.accent);
  polygon(ctx, [[-0.04, -0.34], [0.12, -0.24], [-0.01, 0.05]], p.shade, null);
  stroke(ctx, [[-0.24, -0.36], [0.14, -0.36]], p.ink, 0.085);
  ctx.restore();
  polygon(ctx, [[-0.17, -0.38], [0.4, -0.26], [0.51, 0.31], [0.12, 0.57], [-0.31, 0.3]], p.body);
  polygon(ctx, [[-0.18, -0.28], [-0.01, -0.17], [0.11, 0.38], [-0.24, 0.25]], p.shade, null);
  polygon(ctx, [[0.08, -0.59], [-0.1, -1.09], [0.35, -0.81], [0.63, -0.6], [0.96, -0.34], [0.58, -0.3], [0.44, -0.05], [0.05, -0.28]], p.body);
  polygon(ctx, [[0.29, -0.79], [0.43, -1.01], [0.51, -0.62]], p.shade);
  polygon(ctx, [[0.36, -0.58], [0.6, -0.54], [0.48, -0.42]], p.accent, p.ink, 0.04);
  stroke(ctx, [[0.35, 0.11], [0.69 + run * 0.3, 0.27], [0.94, 0.06]], p.ink, 0.19);
  stroke(ctx, [[0.35, 0.11], [0.69 + run * 0.3, 0.27], [0.94, 0.06]], p.body, 0.1);
  for (let i = 0; i < 2; i++) polygon(ctx, [[0.87, 0.09 + i * 0.13], [1.21, -0.04 + i * 0.13], [1.05, 0.2 + i * 0.13]], p.bone);
  endCreature(ctx);
}
export function drawDying(de, t, R) {
  drawCreatureDeath(ctx, { ...de, radius: R }, t, draw, 'fall');
}
