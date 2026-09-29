import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, creaturePalette, polygon, stroke, drawCreatureDeath } from '../creatureStyle.js';

// A stooped worker: the head and reaching hands carry the silhouette.
function drawParts(e, body, arms) {
  const variants = [['#69b845', '#263e2d'], ['#53ad64', '#203b2c'], ['#8acb35', '#2e5020'], ['#64ab4c', '#31452b']];
  const [skin, shade] = variants[(e.variant || 0) % variants.length];
  const p = creaturePalette(e, skin, shade, '#ff5159');
  const clothes = [['#a86b42','#573b32'], ['#517cb1','#293e65'], ['#b94a4d','#612c3c'], ['#a68b6b','#524154']];
  const [shirt, seam] = clothes[(e.variant || 0) % clothes.length];
  const fabric = creaturePalette(e, shirt, seam, '#d3ac78');
  const trousers = creaturePalette(e, '#4e5272', '#26283f', '#8592b4');
  const dead = e.deathPose !== undefined;
  const walk = dead ? 0 : Math.sin(frameCount * 0.16) * 0.09;
  const windup = !dead && e.combatState === 'WINDUP';
  const strike = !dead && e.combatState === 'STRIKE';
  beginCreature(ctx, e);
  if (body) {
  stroke(ctx, [[-.4, .28], [-.5, .73 + walk], [-.65, .99 + walk]], p.ink, .3);
  stroke(ctx, [[.05, .3], [.16, .72 - walk], [.36, .93 - walk]], p.ink, .27);
  stroke(ctx, [[-.4, .28], [-.5, .7 + walk]], trousers.body, .21);
  stroke(ctx, [[.05, .3], [.16, .72 - walk]], trousers.body, .18);
  polygon(ctx, [[-.78, -.3], [-.52, -.68], [.05, -.62], [.42, .37], [.17,.3], [.05,.47], [-.15,.32], [-.52, .47]], fabric.body);
  polygon(ctx, [[-.42,-.61],[-.16,-.5],[.06,-.6],[-.05,-.27]], p.body, p.ink, .04);
  stroke(ctx, [[-.21,-.22],[-.08,.24]], fabric.shade, .04);
  polygon(ctx, [[-.53,-.04],[-.31,-.07],[-.28,.12],[-.48,.16]], fabric.shade, null);
  stroke(ctx, [[-.49,.02],[-.31,-.01]], fabric.accent, .025);
  polygon(ctx, [[-.65,-.3],[-.52,-.48],[-.47,.23],[-.6,.28]], fabric.shade, null);
  ctx.translate(0, walk * .4);
  polygon(ctx, [[-.12, -.81], [.02, -1.07], [.39, -1.04], [.64, -.83], [.57, -.48], [.34, -.4], [.02, -.56]], p.body);
  polygon(ctx, [[.4, -.52], [.64, -.44], [.54, -.2], [.29, -.33]], p.body);
  polygon(ctx, [[-.1, -.86], [.02, -1.13], [.18, -.99], [.33, -1.1], [.45, -.91]], p.shade, null);
  stroke(ctx, [[.33, -.8], [.55, -.73]], p.accent, .1);
  stroke(ctx, [[.44, -.46], [.59, -.44]], p.ink, .09);
  if ((e.variant || 0) === 1) polygon(ctx, [[-.07, -.92], [.48, -1], [.55, -.83], [.02, -.76]], p.shade);
  if ((e.variant || 0) === 3) polygon(ctx, [[-.09, -.93], [.17, -1.15], [.55, -.96], [.6, -.82], [-.04, -.79]], p.shade);
  } else {
    ctx.translate(0, walk * .4);
  }
  if (arms) {
  ctx.save();
  if (windup || strike) ctx.rotate(getRelativeAimAngle(e.attackAngle ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1));
  const reach = strike ? 1.35 : windup ? .53 : .92;
  const lift = windup ? -.59 : dead ? .5 : -.14 + walk;
  stroke(ctx, [[-.28, -.18], [.24, .2], [reach * .8, .16]], p.ink, .25);
  stroke(ctx, [[-.28, -.18], [.24, .2], [reach * .8, .16]], p.body, .15);
  stroke(ctx, [[-.28,-.18],[.17,.16]], fabric.shade, .2);
  stroke(ctx, [[-.1, -.29], [.4, lift], [reach, lift + .08]], p.ink, .29);
  stroke(ctx, [[-.1, -.29], [.4, lift], [reach, lift + .08]], p.body, .19);
  stroke(ctx, [[-.1,-.29],[.28,lift]], fabric.body, .23);
  stroke(ctx, [[.21,lift-.09],[.3,lift+.08]], fabric.shade, .045);
  polygon(ctx, [[reach - .14, lift - .1], [reach + .15, lift - .06], [reach + .27, lift + .06], [reach + .09, lift + .24], [reach - .14, lift + .19]], p.body);
  polygon(ctx, [[reach + .1, lift - .03], [reach + .37, lift + .03], [reach + .17, lift + .09]], windup ? p.accent : p.bone, null);
  polygon(ctx, [[reach + .1, lift + .13], [reach + .29, lift + .23], [reach + .05, lift + .22]], windup ? p.accent : p.bone, null);
  if (strike) stroke(ctx, [[1.12, -.55], [1.46, -.11], [1.23, .4]], p.accent, .11);
  ctx.restore();
  }
  endCreature(ctx);
}

export const animationFrequency = .16;
const attacking = e => e.combatState === 'WINDUP' || e.combatState === 'STRIKE';
export function draw(e) { drawParts(e, true, true); }
export function drawBody(e) { drawParts(e, true, !attacking(e)); }
export function drawLive(e) { if (attacking(e)) drawParts(e, false, true); }

export function drawDying(de, t) { drawCreatureDeath(ctx, de, t, draw, 'fall'); }
