import { ctx, frameCount } from '../../state/gameState.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// Knuckle-walking carrion eater: most of the head is one enormous toothed maw.
export function draw(e) {
  const p = creaturePalette(e, '#6b7c99', '#29384c', '#d6304f');
  const dead = e.deathPose || 0;
  const stacks = Math.min(5, e.gorgonStacks || 0);
  const chew = dead ? -dead * 0.16 : Math.sin(frameCount * 0.18) * 0.035;
  beginCreature(ctx, e);
  polygon(ctx, [[-0.72, 0.03], [-0.81, 0.64], [-0.45, 0.88], [-0.09, 0.79], [-0.39, 0.47]], p.shade);
  materialPolygon(ctx, [[-0.91, -0.14], [-0.67, -0.68], [-0.2, -0.86], [0.32, -0.67], [0.62, -0.14], [0.38, 0.61], [-0.39, 0.62]], p, 'flesh');
  polygon(ctx, [[-0.87, -0.11], [-0.39, -0.49], [-0.13, -0.25], [-0.33, 0.47], [-0.64, 0.39]], p.shade, null);
  for (let i = 0; i < 3; i++) polygon(ctx, [[-0.75 + i * 0.33, -0.48], [-0.62 + i * 0.33, -1.02 - (i === 1 ? 0.17 : 0)], [-0.4 + i * 0.33, -0.58]], p.bone);
  // A heavy jaw, rather than a small face covered by unrelated spikes.
  const jaw = 0.48 + stacks * 0.012 + chew;
  polygon(ctx, [[0.01, -jaw], [0.6, -jaw - 0.1], [0.95, -0.28], [1.04, jaw * 0.66], [0.71, jaw + 0.14], [0.12, jaw], [-0.14, 0.04]], p.shade);
  polygon(ctx, [[0.12, -jaw * 0.72], [0.64, -jaw * 0.8], [0.84, -0.15], [0.79, jaw * 0.65], [0.32, jaw * 0.82], [0.03, 0.04]], p.ink, null);
  polygon(ctx, [[0.3, 0.14], [0.67, 0.09], [0.76, jaw * 0.65], [0.33, jaw * 0.73]], p.accent, null);
  for (let i = 0; i < 3; i++) {
    const x = 0.16 + i * 0.22;
    polygon(ctx, [[x, -jaw * 0.72], [x + 0.19, -jaw * 0.75], [x + 0.09, -jaw * 0.13]], p.bone, p.ink, 0.045);
    polygon(ctx, [[x + 0.02, jaw * 0.69], [x + 0.2, jaw * 0.66], [x + 0.1, jaw * 0.16]], p.bone, p.ink, 0.045);
  }
  polygon(ctx, [[0.3, 0.45], [0.55, 0.6], [0.84, 0.55], [0.94, 0.87], [0.91, 1.02], [0.52, 1.02], [0.4, 0.77]], p.body);
  stroke(ctx, [[0.65, 0.9], [0.8, 0.9]], p.shade, 0.065);
  endCreature(ctx);
}
export function drawDying(de, t, R) {
  drawCreatureDeath(ctx, { ...de, radius: R }, t, draw, 'fall');
}
