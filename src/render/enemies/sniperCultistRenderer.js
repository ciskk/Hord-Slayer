import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// A pointed hunter's hood, a full-height angular longbow, and a drawn ether arrow.
export function draw(e) {
  const p = creaturePalette(e, '#703ca6', '#2c1747', '#d95aff');
  const dead = e.deathPose || 0;
  const charge = dead ? 0 : Math.min(1, Math.max(0, e.sniperCharge || 0));
  const bob = dead || charge > 0.35 ? 0 : Math.sin(frameCount * 0.15) * 0.035;
  beginCreature(ctx, e);
  ctx.translate(0, bob);
  polygon(ctx, [[-0.38, -0.44], [0.25, -0.38], [0.4, 0.74], [0.04, 0.59], [-0.1, 0.91], [-0.24, 0.65], [-0.63, 0.78]], p.body);
  polygon(ctx, [[-0.19, -0.35], [0.2, -0.3], [0.28, 0.62], [-0.02, 0.52]], p.shade, null);
  polygon(ctx, [[-0.45, -0.44], [-0.28, -0.94], [0.05, -1.2], [0.35, -0.53], [0.23, -0.29]], p.body);
  polygon(ctx, [[-0.14, -0.74], [0.13, -0.77], [0.22, -0.5], [-0.04, -0.45]], p.ink, null);
  stroke(ctx, [[0.01, -0.62], [0.15, -0.64]], charge > 0.75 ? p.bone : p.accent, 0.085);
  stroke(ctx, [[-0.42, 0.52], [-0.27, -0.29]], p.bone, 0.08);
  ctx.save();
  ctx.rotate(getRelativeAimAngle(e.sniperAimAngle ?? e.aimAngle ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1) + dead * 0.2);
  stroke(ctx, [[0.09, 0.02], [0.65, 0]], p.ink, 0.21);
  stroke(ctx, [[0.09, 0.02], [0.65, 0]], p.body, 0.12);
  const pull = 0.28 - charge * 0.5;
  // Bow limbs bend forward at their center; the string is pulled toward the archer.
  stroke(ctx, [[0.46, -1], [0.75, -0.67], [0.91, 0], [0.75, 0.67], [0.46, 1]], p.ink, 0.2);
  stroke(ctx, [[0.46, -1], [0.75, -0.67], [0.91, 0], [0.75, 0.67], [0.46, 1]], p.bone, 0.11);
  stroke(ctx, [[0.46, -1], [pull, 0], [0.46, 1]], charge > 0.75 ? p.bone : p.accent, 0.055);
  if (!dead) {
    const tip = 1.33 - charge * 0.18;
    stroke(ctx, [[pull, 0], [tip, 0]], p.accent, 0.09);
    polygon(ctx, [[tip - 0.12, -0.16], [tip + 0.22, 0], [tip - 0.12, 0.16], [tip - 0.04, 0]], charge > 0.8 ? p.bone : p.accent);
    if (charge > 0.35) {
      ctx.save();
      ctx.globalAlpha *= 0.3 + charge * 0.45;
      ctx.setLineDash([8 / e.radius, 4 / e.radius]);
      stroke(ctx, [[tip + 0.24, 0], [320 / e.radius, 0]], p.accent, 1.2 / e.radius);
      ctx.restore();
    }
  }
  ctx.restore();
  endCreature(ctx);
}
export function drawDying(de, t, R) {
  drawCreatureDeath(ctx, { ...de, radius: R }, t, draw, 'fall');
}
