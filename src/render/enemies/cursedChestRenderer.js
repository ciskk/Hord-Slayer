import { ctx, frameCount } from '../../state/gameState.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// The same wooden chest gains a hinged jaw, large teeth, tongue, and clawed legs.
export function draw(e) {
  const p = creaturePalette(e, '#975a2f', '#4c291b', '#d4a62f');
  const dead = e.deathPose || 0;
  const awake = !!e.isAwakeMimic;
  const bite = dead ? dead * 0.12 : Math.sin(frameCount * 0.25) * 0.065;
  beginCreature(ctx, e);
  if (awake) {
    for (const side of [-1, 1]) {
      const step = dead ? 0 : Math.sin(frameCount * 0.29 + side) * 0.12;
      polygon(ctx, [[side * 0.5, 0.36], [side * 0.98, 0.63], [side * 1.12, 1.04 + step], [side * 0.73, 0.85 + step], [side * 0.58, 0.64]], p.shade);
    }
    polygon(ctx, [[-0.65, -0.33], [0.59, -0.56 - bite], [0.73, 0.25], [-0.64, 0.25]], p.ink);
    polygon(ctx, [[0.24, -0.04], [0.57, 0.02], [1.08, 0.25 + bite], [1.24, 0.51 + bite], [0.9, 0.43], [0.6, 0.23], [0.24, 0.2]], e.hitFlash > 0 ? p.bone : '#e056bd');
  }
  materialPolygon(ctx, [[-0.77, awake ? 0.16 : -0.06], [0.77, awake ? 0.16 : -0.06], [0.77, 0.67], [-0.77, 0.67]], p, 'wood');
  polygon(ctx, [[-0.65, 0.31], [0.66, 0.31], [0.66, 0.58], [-0.65, 0.58]], p.shade, null);
  for (const side of [-1, 1]) polygon(ctx, [[side * 0.41, awake ? 0.16 : -0.06], [side * 0.61, awake ? 0.16 : -0.06], [side * 0.61, 0.67], [side * 0.41, 0.67]], p.accent);
  if (awake) {
    for (let i = 0; i < 4; i++) {
      const x = -0.62 + i * 0.33;
      polygon(ctx, [[x, 0.19], [x + 0.15, -0.1], [x + 0.28, 0.19]], p.bone, p.ink, 0.045);
    }
  }
  ctx.save();
  ctx.translate(-0.76, awake ? -0.12 : -0.06);
  ctx.rotate(awake ? -0.42 + bite : 0);
  materialPolygon(ctx, [[0, 0], [0, -0.35], [0.19, -0.56], [1.35, -0.56], [1.54, -0.35], [1.54, 0]], p, 'wood');
  polygon(ctx, [[0.2, -0.46], [1.31, -0.46], [1.41, -0.29], [0.1, -0.29]], p.shade, null);
  for (const x of [0.15, 1.17]) polygon(ctx, [[x, 0], [x, -0.43], [x + 0.15, -0.56], [x + 0.2, -0.56], [x + 0.2, 0]], p.accent);
  if (awake) {
    for (let i = 0; i < 4; i++) {
      const x = 0.13 + i * 0.33;
      polygon(ctx, [[x, 0], [x + 0.14, 0.27], [x + 0.28, 0]], p.bone, p.ink, 0.045);
    }
  } else {
    polygon(ctx, [[0.64, -0.12], [0.9, -0.12], [0.9, 0.2], [0.64, 0.2]], p.accent);
    stroke(ctx, [[0.77, -0.02], [0.77, 0.11]], p.ink, 0.07);
  }
  ctx.restore();
  endCreature(ctx);
}
export function drawDying(de, t, R) {
  drawCreatureDeath(ctx, { ...de, radius: R, isAwakeMimic: true }, t, draw, 'crumble');
}
