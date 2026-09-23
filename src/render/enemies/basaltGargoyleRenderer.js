import { ctx, frameCount } from '../../state/gameState.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// Stone bat wings close around the same crouched gargoyle when petrified.
export function draw(e) {
  const p = creaturePalette(e, e.isStoneForm ? '#abb6c4' : '#778ca5', '#303d56', '#ff942f');
  const dead = e.deathPose || 0;
  const flap = e.isStoneForm || dead ? 0 : Math.sin(frameCount * 0.25) * 0.16;
  beginCreature(ctx, e);
  for (const side of [-1, 1]) {
    if (!e.isStoneForm) {
      polygon(ctx, [[side * 0.27, -0.24], [side * 0.85, -0.93 + flap], [side * 1.43, -0.63 + flap], [side * 1.14, -0.25 + flap], [side * 0.95, 0.13], [side * 0.59, 0.02], [side * 0.27, 0.36]], p.shade);
      stroke(ctx, [[side * 0.27, -0.24], [side * 0.85, -0.93 + flap], [side * 0.95, 0.13]], p.body, 0.07);
      stroke(ctx, [[side*.87,-.76+flap],[side*1.24,-.58+flap],[side*1.03,-.45+flap]], p.body, .025);
      stroke(ctx, [[side*.55,-.47+flap],[side*.71,-.32],[side*.63,-.1]], p.body, .03);
    }
    polygon(ctx, [[side * 0.08, 0.35], [side * 0.56, 0.31], [side * 0.7, 0.76], [side * 0.18, 0.76]], p.shade);
  }
  materialPolygon(ctx, [[-0.52, -0.32], [0.5, -0.32], [0.39, 0.51], [0, 0.7], [-0.4, 0.5]], p, 'stone');
  polygon(ctx, [[0, -0.29], [0.4, -0.22], [0.3, 0.47], [0, 0.59]], p.shade, null);
  if (e.isStoneForm) {
    for (const side of [-1, 1]) materialPolygon(ctx, [[side * 0.52, -0.57], [side * 0.72, 0.52], [0, 0.7], [side * 0.05, -0.21]], p, 'stone');
  }
  for (const side of [-1, 1]) polygon(ctx, [[side * 0.16, -0.72], [side * 0.37, -1.1], [side * 0.43, -0.55]], p.shade);
  polygon(ctx, [[-0.37, -0.69], [0, -0.87], [0.37, -0.69], [0.29, -0.23], [0, -0.08], [-0.29, -0.23]], p.body);
  stroke(ctx, [[-0.19, -0.49], [-0.06, -0.46]], e.isStoneForm || dead ? p.shade : p.accent, 0.1);
  stroke(ctx, [[0.06, -0.46], [0.19, -0.49]], e.isStoneForm || dead ? p.shade : p.accent, 0.1);
  stroke(ctx, [[-0.12, -0.26], [0.12, -0.26]], p.ink, 0.07);
  endCreature(ctx);
}
export function drawDying(de, t, R) {
  drawCreatureDeath(ctx, { ...de, radius: R }, t, draw, 'crumble');
}
