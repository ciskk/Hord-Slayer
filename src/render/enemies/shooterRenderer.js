import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// An angular walking gun carriage. The barrel alone carries the aim and charge.
function drawParts(e, body, cannon) {
  const p = creaturePalette(e, '#4c8bbc', '#203656', '#ff5944');
  const dead = e.deathPose !== undefined;
  const burst = !dead && (e.burstRemaining || 0) > 0;
  const charging = !dead && !burst && (e.shootTimer || 0) > 85;
  const walk = dead ? 0 : Math.sin(frameCount * .18) * .08;
  const aim = getRelativeAimAngle(e.aimAngle ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1);
  beginCreature(ctx, e);
  if (body) {
  for (const side of [-1, 1]) {
    stroke(ctx, [[side * .37, .23], [side * .59, .62], [side * (.79 + walk), .91]], p.ink, .26);
    stroke(ctx, [[side * .37, .23], [side * .59, .62], [side * (.79 + walk), .91]], p.body, .14);
    polygon(ctx, [[side * .52, .79], [side * .8, .72], [side * 1.04, .98], [side * .5, .99]], p.shade);
  }
  polygon(ctx, [[-.76, -.45], [-.44, -.74], [.35, -.74], [.68, -.4], [.51, .46], [-.55, .46]], p.shade, p.ink, .095);
  polygon(ctx, [[-.62, -.43], [-.4, -.59], [.19, -.59], [.39, .22], [-.49, .22]], p.body, null);
  polygon(ctx, [[-.67, -.43], [-.75, -1.07], [-.48, -1.07], [-.35, -.5]], p.shade);
  stroke(ctx, [[-.68, -.92], [-.48, -.92]], p.body, .1);
  }
  if (cannon) {
  ctx.save();
  // Keep the cannon pivot at the entity origin, matching the bullet direction.
  ctx.rotate(aim);
  if (dead) ctx.rotate(e.deathPose * .5);
  const recoil = burst ? -.12 - Math.sin(frameCount * 1.25) * .05 : 0;
  const muzzle = 24 / (e.radius || 14) + recoil;
  polygon(ctx, [[-.4, -.3], [-.12, -.49], [.31, -.32], [.4, .24], [-.09, .43], [-.4, .19]], p.shade);
  polygon(ctx, [[-.3, -.25], [-.1, -.37], [.19, -.25], [.26, -.02], [-.23, .03]], p.body, null);
  polygon(ctx, [[.13 + recoil, -.25], [muzzle -.15, -.25], [muzzle, -.17], [muzzle, .25], [.13 + recoil, .25]], p.body, p.ink, .09);
  polygon(ctx, [[.17 + recoil, .04], [muzzle, .04], [muzzle, .25], [.17 + recoil, .25]], p.shade, null);
  polygon(ctx, [[muzzle -.24, -.35], [muzzle + .08, -.29], [muzzle + .08, .3], [muzzle -.24, .35]], p.shade);
  ellipse(ctx, muzzle + .08, 0, .085, .21, burst || charging ? p.accent : p.ink, null);
  stroke(ctx, [[.33 + recoil, -.27], [.75 + recoil, -.27]], charging || burst ? p.accent : p.bone, .09);
  if (charging) {
    ctx.save();
    ctx.globalAlpha *= .45 + Math.sin(frameCount * .3) * .15;
    ctx.setLineDash([5 / e.radius, 5 / e.radius]);
    stroke(ctx, [[muzzle + .13, 0], [muzzle + 220 / e.radius, 0]], p.accent, 1 / e.radius);
    ctx.restore();
  }
  if (burst) polygon(ctx, [[muzzle + .09, -.13], [muzzle + .42, -.28], [muzzle + .72, 0], [muzzle + .39, .25], [muzzle + .09, .12]], p.accent, null);
  ctx.restore();
  }
  endCreature(ctx);
}

export const animationFrequency = .18;
export function draw(e) { drawParts(e, true, true); }
export function drawBody(e) { drawParts(e, true, false); }
export function drawLive(e) { drawParts(e, false, true); }

export function drawDying(de, t) { drawCreatureDeath(ctx, de, t, draw, 'crumble'); }
