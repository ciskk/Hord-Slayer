import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, stroke, drawCreatureDeath } from '../creatureStyle.js';

// A broad tower shield remains the dominant shape at every animation frame.
export function drawBody(e) {
  const p = creaturePalette(e, '#70b0d4', '#263d60', '#f3bd43');
  const dead = e.deathPose !== undefined;
  const windup = !dead && e.combatState === 'WINDUP';
  const step = dead ? 0 : Math.sin(frameCount * .12) * .05;
  beginCreature(ctx, e);
  polygon(ctx, [[-.53, .34], [-.2, .34], [-.2, .88 + step], [-.6, .88 + step]], p.shade);
  polygon(ctx, [[-.08, .34], [.23, .34], [.3, .91 - step], [-.07, .91 - step]], p.shade);
  polygon(ctx, [[-.64, -.58], [.14, -.6], [.3, .44], [-.51, .44]], p.shade);
  polygon(ctx, [[-.9, -.75], [-.4, -.67], [-.25, -.31], [-.67, -.25]], p.body);
  polygon(ctx, [[-.37, -.94], [-.03, -1.05], [.23, -.84], [.23, -.44], [-.34, -.43]], p.body);
  stroke(ctx, [[-.15, -.74], [.16, -.74]], windup ? p.accent : p.ink, .11);
  endCreature(ctx);
}

export function drawLive(e) {
  const p = creaturePalette(e, '#70b0d4', '#263d60', '#f3bd43');
  const dead = e.deathPose !== undefined;
  const windup = !dead && e.combatState === 'WINDUP';
  const strike = !dead && e.combatState === 'STRIKE';
  beginCreature(ctx, e);
  ctx.save();
  if (windup || strike) ctx.rotate(getRelativeAimAngle(e.attackAngle ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1));
  const spearX = strike ? 1.72 : windup ? .7 : 1.18;
  stroke(ctx, [[-.47, -.27], [spearX, -.4]], p.ink, .18);
  stroke(ctx, [[-.47, -.27], [spearX, -.4]], p.shade, .1);
  polygon(ctx, [[spearX - .13, -.58], [spearX + .43, -.4], [spearX - .13, -.22]], strike ? p.accent : p.bone);
  ctx.restore();
  endCreature(ctx);
}

// The shield is a separate foreground sprite: the live spear must stay behind it.
export function drawForeground(e) {
  const p = creaturePalette(e, '#70b0d4', '#263d60', '#f3bd43');
  beginCreature(ctx, e);
  materialPolygon(ctx, [[.05, -.77], [.61, -.99], [1.02, -.76], [.95, .59], [.53, .99], [.06, .68]], p, 'metal', p.ink, .11);
  polygon(ctx, [[.53, -.83], [.86, -.66], [.8, .52], [.53, .8]], p.shade, null);
  stroke(ctx, [[.53, -.79], [.53, .74]], p.accent, .09);
  polygon(ctx, [[.53, -.28], [.75, -.05], [.53, .19], [.31, -.05]], p.accent);
  endCreature(ctx);
}

export function transformForeground(targetCtx, e) {
  const dead = e.deathPose !== undefined;
  const offset = dead ? e.deathPose * .45 : e.combatState === 'STRIKE' ? .2 : e.combatState === 'WINDUP' ? -.06 : 0;
  targetCtx.translate(offset * e.radius, 0);
  if (dead) targetCtx.rotate(e.deathPose * .4);
}

export function drawOverlays(e) {
  if (e.deathPose === undefined && e.shieldBlockFlash > 0) {
    const p = creaturePalette(e, '#70b0d4', '#263d60', '#f3bd43');
    beginCreature(ctx, e);
    e.shieldBlockFlash--;
    stroke(ctx, [[.68, -.94], [1.07, -.77], [1.02, .63], [.61, 1.03]], p.bone, .16);
    endCreature(ctx);
  }
}

export const animationFrequency = .12;
export function draw(e) {
  drawBody(e);
  drawLive(e);
  ctx.save();
  transformForeground(ctx, e);
  drawForeground(e);
  drawOverlays(e);
  ctx.restore();
}

export function drawDying(de, t) { drawCreatureDeath(ctx, de, t, draw, 'fall'); }
