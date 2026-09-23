import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// Heavy furnace guard: a back tank, a hose, and one directional flame nozzle.
export function draw(e) {
  const p = creaturePalette(e, '#65777a', '#213e47', '#ff851f');
  const dead = e.deathPose || 0;
  const firing = e.deathPose === undefined && e.flameState === 'firing';
  const aiming = e.deathPose === undefined && e.flameState === 'aim';
  const angle = e.flameAngle ?? e.aimAngle ?? (e.facing === -1 ? Math.PI : 0);
  const localAim = getRelativeAimAngle(angle, e.facing || 1);
  beginCreature(ctx, e);
  // The attack indicator follows the actual 115px reach and 0.52rad half-angle.
  if (aiming || firing) {
    ctx.save();
    ctx.rotate(localAim);
    ctx.globalAlpha *= aiming ? 0.18 : 0.55;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 115 / e.radius, -0.52, 0.52);
    ctx.closePath();
    ctx.fillStyle = p.accent;
    ctx.fill();
    if (aiming) {
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 0.065;
      ctx.stroke();
    }
    ctx.restore();
  }
  polygon(ctx, [[-0.87, -0.81], [-0.43, -0.81], [-0.27, -0.55], [-0.27, 0.4], [-0.49, 0.56], [-0.87, 0.48], [-1.01, 0.24], [-1.01, -0.54]], p.shade);
  polygon(ctx, [[-0.85, -0.69], [-0.77, -1.07], [-0.5, -1.07], [-0.44, -0.69]], p.body);
  stroke(ctx, [[-0.83, -0.3], [-0.43, -0.3]], p.body, 0.1);
  materialPolygon(ctx, [[-0.46, -0.54], [0.39, -0.54], [0.57, -0.19], [0.47, 0.61], [-0.46, 0.61], [-0.6, -0.17]], p, 'metal');
  polygon(ctx, [[0.23, -0.55], [0.58, -0.71], [0.81, -0.28], [0.41, -0.14]], p.shade);
  for (const side of [-1, 1]) polygon(ctx, [[side * 0.1, 0.5], [side * 0.42, 0.5], [side * 0.48, 0.89], [side * 0.07, 0.89]], p.shade);
  polygon(ctx, [[-0.28, -0.85], [0.27, -0.85], [0.35, -0.4], [-0.31, -0.4]], p.shade);
  stroke(ctx, [[-0.13, -0.63], [0.19, -0.63]], p.accent, 0.08);
  polygon(ctx, [[-0.27, -0.26], [0.23, -0.26], [0.23, 0.23], [-0.27, 0.23]], p.shade);
  stroke(ctx, [[-0.18, -0.08], [0.14, -0.08]], dead ? p.shade : p.accent, 0.1);
  stroke(ctx, [[-0.18, 0.1], [0.14, 0.1]], dead ? p.shade : p.accent, 0.1);
  stroke(ctx, [[-0.64, 0.31], [-0.34, 0.67], [0.13, 0.49], [0.24, 0.08]], p.ink, 0.16);
  stroke(ctx, [[-0.64, 0.31], [-0.34, 0.67], [0.13, 0.49], [0.24, 0.08]], p.shade, 0.075);
  ctx.save();
  ctx.rotate(localAim + dead * 0.22);
  ellipse(ctx, 0.2, 0, 0.2, 0.2, p.shade);
  polygon(ctx, [[0.29, -0.14], [1.01, -0.14], [1.2, -0.25], [1.2, 0.25], [1.01, 0.14], [0.29, 0.14]], p.body);
  stroke(ctx, [[1.18, -0.18], [1.18, 0.18]], aiming || firing ? p.accent : p.ink, 0.12);
  if (aiming || firing) {
    const length = firing ? 1.05 + Math.sin(frameCount * 0.5) * 0.12 : 0.32;
    polygon(ctx, [[1.24, -0.12], [1.24 + length, 0], [1.24, 0.12]], p.accent, null);
    if (firing) polygon(ctx, [[1.24, -0.05], [1.85, 0], [1.24, 0.05]], p.bone, null);
  }
  ctx.restore();
  endCreature(ctx);
}
export function drawDying(de, t, R) {
  drawCreatureDeath(ctx, { ...de, radius: R }, t, draw, 'crumble');
}
