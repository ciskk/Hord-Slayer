import { ctx, frameCount } from '../../state/gameState.js';
import { beginCreature, endCreature, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// Low segmented centipede. The single acid sac communicates its toxic trail.
export function draw(e) {
  const p = creaturePalette(e, '#159878', '#073f37', '#73ec72');
  const dead = e.deathPose || 0;
  beginCreature(ctx, e);
  for (let i = 0; i < 4; i++) {
    const x = 0.22 - i * 0.39;
    const step = dead ? 0 : Math.sin(frameCount * 0.28 + i * 1.8) * 0.12;
    for (const side of [-1, 1]) {
      const leg = [[x, side * 0.3], [x - 0.17, side * (0.66 - dead * 0.32)], [x + 0.07 + step, side * (0.88 - dead * 0.5)]];
      stroke(ctx, leg, p.ink, 0.14);
      stroke(ctx, leg, p.shade, 0.07);
    }
  }
  for (let i = 3; i >= 0; i--) {
    const x = 0.17 - i * 0.37;
    const height = 0.42 - i * 0.045;
    polygon(ctx, [[x - 0.29, -height * 0.68], [x + 0.09, -height], [x + 0.36, -height * 0.51], [x + 0.26, 0], [x + 0.36, height * 0.51], [x + 0.09, height], [x - 0.29, height * 0.68]], p.shade);
    polygon(ctx, [[x - 0.18, -height * 0.66], [x + 0.09, -height * 0.78], [x + 0.23, -height * 0.36], [x + 0.13, 0], [x - 0.18, 0.08]], p.body, null);
  }
  ellipse(ctx, -0.55, 0, 0.27, 0.18, p.accent);
  polygon(ctx, [[0.21, -0.2], [0.42, -0.35], [0.73, -0.24], [0.83, 0], [0.73, 0.24], [0.42, 0.35], [0.21, 0.2]], p.body);
  for (const side of [-1, 1]) {
    polygon(ctx, [[0.64, side * 0.15], [0.97, side * 0.33], [1.12, side * 0.06], [0.88, side * 0.12]], p.bone);
    ellipse(ctx, 0.58, side * 0.13, 0.065, 0.065, p.ink, null);
  }
  endCreature(ctx);
}
export function drawDying(de, t, R) {
  drawCreatureDeath(ctx, { ...de, radius: R }, t, draw, 'fall');
}
