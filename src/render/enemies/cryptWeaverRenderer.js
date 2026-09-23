import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// Four separated legs on either side, a silk abdomen, and two fangs.
export function draw(e) {
  const p = creaturePalette(e, '#9aa6b2', '#343849', '#ff1744');
  const dead = e.deathPose || 0;
  beginCreature(ctx, e);
  ctx.rotate(getRelativeAimAngle(e.aimAngle ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1));
  for (let i = 0; i < 4; i++) {
    const x = 0.32 - i * 0.22;
    const reach = 0.92 - dead * 0.54;
    const step = dead ? 0 : Math.sin(frameCount * 0.2 + i * 2) * 0.07;
    for (const side of [-1, 1]) {
      const leg = [[x, side * 0.18], [0.67 - i * 0.44, side * (0.65 + step)], [0.95 - i * 0.64, side * (reach + step)]];
      stroke(ctx, leg, p.ink, 0.16);
      stroke(ctx, leg, p.shade, 0.075);
    }
  }
  polygon(ctx, [[-1.14, 0], [-0.95, -0.36], [-0.51, -0.54], [-0.09, -0.38], [0.09, 0], [-0.09, 0.38], [-0.51, 0.54], [-0.95, 0.36]], p.shade);
  polygon(ctx, [[-0.94, -0.12], [-0.66, -0.39], [-0.32, -0.32], [-0.21, -0.11], [-0.63, 0.03]], p.body, null);
  stroke(ctx, [[-0.78, -0.27], [-0.45, 0], [-0.78, 0.27]], p.bone, 0.1);
  polygon(ctx, [[-0.03, -0.18], [0.23, -0.36], [0.61, -0.23], [0.71, 0], [0.61, 0.23], [0.23, 0.36], [-0.03, 0.18]], p.body);
  for (const side of [-1, 1]) {
    polygon(ctx, [[0.51, side * 0.12], [0.91, side * 0.28], [0.78, 0], [0.61, side * 0.08]], p.bone);
    polygon(ctx, [[0.29, side * 0.14], [0.47, side * 0.21], [0.49, side * 0.08]], p.accent, p.ink, 0.045);
  }
  if (e.deathPose === undefined && (e.webTimer || 0) > 85) {
    const charge = Math.min(1, (e.webTimer - 85) / 30);
    ellipse(ctx, 0.87, 0, 0.13 + charge * 0.2, 0.13 + charge * 0.2, p.bone);
  }
  endCreature(ctx);
}
export function drawDying(de, t, R) {
  drawCreatureDeath(ctx, { ...de, radius: R }, t, draw, 'fall');
}
