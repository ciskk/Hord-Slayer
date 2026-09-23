import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// Empty armored collar, severed head at the hip, and a long directional lance.
export function draw(e) {
  const p = creaturePalette(e, '#426588', '#192c45', '#ff4757');
  const dead = e.deathPose || 0;
  const charging = e.deathPose === undefined && e.lanceState === 'charging';
  const aiming = e.deathPose === undefined && e.lanceState === 'aim';
  const stride = dead || aiming ? 0 : Math.sin(frameCount * (charging ? 0.48 : 0.18)) * 0.11;
  beginCreature(ctx, e);
  polygon(ctx, [[-0.38, -0.47], [-0.65, -0.2], [-0.67 - stride, 0.86], [-0.15, 0.59]], p.shade);
  for (const side of [-1, 1]) polygon(ctx, [[side * 0.09, 0.34], [side * 0.41, 0.34], [side * 0.47 + side * stride, 0.92], [side * 0.1 + side * stride, 0.92]], p.shade);
  materialPolygon(ctx, [[-0.47, -0.47], [-0.1, -0.64], [0.43, -0.45], [0.46, 0.31], [0.02, 0.62], [-0.48, 0.31]], p, 'metal');
  polygon(ctx, [[0.02, -0.56], [0.39, -0.39], [0.34, 0.26], [0.02, 0.48]], p.shade, null);
  for (const side of [-1, 1]) polygon(ctx, [[side * 0.29, -0.5], [side * 0.66, -0.74], [side * 0.78, -0.3], [side * 0.4, -0.12]], p.body);
  // Keep the negative space above the collar: the flame cannot read as a head.
  polygon(ctx, [[-0.24, -0.61], [-0.3, -0.86], [-0.1, -0.79], [0.1, -0.79], [0.3, -0.86], [0.24, -0.61]], p.shade);
  stroke(ctx, [[-0.17, -0.73], [0.17, -0.73]], dead ? p.ink : p.accent, 0.095);
  ctx.save();
  ctx.translate(-0.73 - dead * 0.15, 0.35 + dead * 0.15);
  ctx.rotate(dead * 1.2);
  polygon(ctx, [[-0.26, -0.19], [-0.2, -0.42], [0.18, -0.42], [0.32, -0.15], [0.2, 0.21], [-0.2, 0.21]], p.shade);
  polygon(ctx, [[-0.12, -0.2], [0.15, -0.2], [0.18, 0.04], [0, 0.19], [-0.15, 0.02]], p.bone);
  stroke(ctx, [[-0.08, -0.08], [0.12, -0.08]], dead ? p.ink : p.accent, 0.085);
  ctx.restore();
  const aim = (aiming || charging || dead) ? (e.lanceAngle ?? e.aimAngle) : e.aimAngle;
  ctx.save();
  ctx.rotate(getRelativeAimAngle(aim ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1) + dead * 0.3);
  const length = charging ? 1.85 : 1.5;
  stroke(ctx, [[0.2, 0.08], [length, 0.08]], p.ink, 0.2);
  stroke(ctx, [[0.2, 0.08], [length, 0.08]], p.body, 0.1);
  polygon(ctx, [[0.25, -0.18], [0.55, -0.04], [0.55, 0.2], [0.25, 0.33]], p.shade);
  polygon(ctx, [[length - 0.1, -0.11], [length + 0.42, 0.08], [length - 0.1, 0.27]], p.bone);
  polygon(ctx, [[length - 0.35, 0.13], [length - 0.35, 0.56], [length - 0.7, 0.35], [length - 0.58, 0.16]], p.accent);
  ctx.restore();
  endCreature(ctx);
}
export function drawDying(de, t, R) {
  drawCreatureDeath(ctx, { ...de, radius: R }, t, draw, 'fall');
}
