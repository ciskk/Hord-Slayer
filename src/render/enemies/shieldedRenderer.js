import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, stroke, drawCreatureDeath } from '../creatureStyle.js';

// A broad tower shield remains the dominant shape at every animation frame.
export function draw(e) {
  const p = creaturePalette(e, '#70b0d4', '#263d60', '#f3bd43');
  const dead = e.deathPose !== undefined;
  const windup = !dead && e.combatState === 'WINDUP';
  const strike = !dead && e.combatState === 'STRIKE';
  const step = dead ? 0 : Math.sin(frameCount * .12) * .05;
  beginCreature(ctx, e);
  polygon(ctx, [[-.53, .34], [-.2, .34], [-.2, .88 + step], [-.6, .88 + step]], p.shade);
  polygon(ctx, [[-.08, .34], [.23, .34], [.3, .91 - step], [-.07, .91 - step]], p.shade);
  polygon(ctx, [[-.64, -.58], [.14, -.6], [.3, .44], [-.51, .44]], p.shade);
  polygon(ctx, [[-.9, -.75], [-.4, -.67], [-.25, -.31], [-.67, -.25]], p.body);
  polygon(ctx, [[-.37, -.94], [-.03, -1.05], [.23, -.84], [.23, -.44], [-.34, -.43]], p.body);
  stroke(ctx, [[-.15, -.74], [.16, -.74]], windup ? p.accent : p.ink, .11);
  ctx.save();
  if (windup || strike) ctx.rotate(getRelativeAimAngle(e.attackAngle ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1));
  const spearX = strike ? 1.72 : windup ? .7 : 1.18;
  stroke(ctx, [[-.47, -.27], [spearX, -.4]], p.ink, .18);
  stroke(ctx, [[-.47, -.27], [spearX, -.4]], p.shade, .1);
  polygon(ctx, [[spearX - .13, -.58], [spearX + .43, -.4], [spearX - .13, -.22]], strike ? p.accent : p.bone);
  ctx.restore();
  ctx.save();
  ctx.translate(dead ? e.deathPose * .45 : strike ? .2 : windup ? -.06 : 0, 0);
  if (dead) ctx.rotate(e.deathPose * .4);
  materialPolygon(ctx, [[.05, -.77], [.61, -.99], [1.02, -.76], [.95, .59], [.53, .99], [.06, .68]], p, 'metal', p.ink, .11);
  polygon(ctx, [[.53, -.83], [.86, -.66], [.8, .52], [.53, .8]], p.shade, null);
  stroke(ctx, [[.53, -.79], [.53, .74]], p.accent, .09);
  polygon(ctx, [[.53, -.28], [.75, -.05], [.53, .19], [.31, -.05]], p.accent);
  if (!dead && e.shieldBlockFlash > 0) {
    e.shieldBlockFlash--;
    stroke(ctx, [[.68, -.94], [1.07, -.77], [1.02, .63], [.61, 1.03]], p.bone, .16);
  }
  ctx.restore();
  endCreature(ctx);
}

export function drawDying(de, t) { drawCreatureDeath(ctx, de, t, draw, 'fall'); }
