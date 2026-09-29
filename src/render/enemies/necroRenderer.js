import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// Pointed hood, a skull staff and one raised hand identify the summoner.
function drawParts(e, body, castingParts) {
  const p = creaturePalette(e, '#8239bb', '#29143d', '#32e4c8');
  const dead = e.deathPose !== undefined;
  const hover = dead ? 0 : Math.sin(frameCount * .08) * .06;
  const aimedStaffPose = (e.shadowBoltTimer || 0) > 85;
  const casting = !dead && aimedStaffPose;
  const summoning = !dead && (e.summonTimer || 0) > 125;
  const aim = getRelativeAimAngle(e.aimAngle ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1);
  beginCreature(ctx, e);
  ctx.translate(0, hover);
  if (body) {
  polygon(ctx, [[-.46, -.5], [.26, -.53], [.6, .97], [.18, .8], [-.05, 1.1], [-.3, .8], [-.69, .98]], p.shade);
  polygon(ctx, [[-.4, -.55], [-.11, -.37], [-.28, .67], [-.69, .98], [-.56, .1]], p.body, null);
  polygon(ctx, [[.11, -.46], [.4, -.6], [.45, .48], [.6, .97], [.17, .68]], p.body, null);
  // Large collar and sharp hood replace ceremonial micro-detail.
  polygon(ctx, [[-.71, -.67], [-.31, -.45], [.14, -.5], [.44, -.77], [.35, -.11], [-.37, -.07]], p.body);
  polygon(ctx, [[-.4, -.64], [-.2, -1.23], [.12, -1.45], [.4, -.83], [.32, -.44], [-.31, -.36]], p.body);
  polygon(ctx, [[-.24, -.71], [.08, -1.09], [.27, -.7], [.16, -.39], [-.14, -.42]], p.ink, null);
  stroke(ctx, [[-.13, -.66], [-.01, -.61]], p.accent, .075);
  stroke(ctx, [[.08, -.61], [.2, -.67]], p.accent, .075);
  }
  if (castingParts) {
  const handY = summoning ? -.65 : .2;
  stroke(ctx, [[-.36, -.23], [-.68, .04], [-.87, handY]], p.ink, .24);
  stroke(ctx, [[-.36, -.23], [-.68, .04], [-.87, handY]], p.body, .15);
  polygon(ctx, [[-1.03, handY + .04], [-1.03, handY - .2], [-.89, handY -.06], [-.75, handY -.22], [-.7, handY + .1], [-.9, handY + .21]], p.bone);
  if (summoning) polygon(ctx, [[-.96, handY -.29], [-.91, handY -.57], [-.73, handY -.36], [-.87, handY -.19]], p.accent, null);
  ctx.save();
  if (aimedStaffPose) {
    // Same origin and full-angle direction as the shadow bolt's gameplay spawn.
    ctx.translate(0, -8 / (e.radius || 15) - hover);
    ctx.rotate(aim + (dead ? e.deathPose * .45 : 0));
  } else {
    ctx.translate(.72, -.88);
    ctx.rotate(-Math.PI / 2 + .08 + (dead ? e.deathPose * .45 : 0));
  }
  const tip = aimedStaffPose ? 16 / (e.radius || 15) : .28;
  stroke(ctx, [[tip - 1.66, 0], [tip, 0]], p.ink, .19);
  stroke(ctx, [[tip - 1.66, 0], [tip, 0]], p.bone, .085);
  polygon(ctx, [[tip -.23, -.23], [tip + .04, -.34], [tip + .28, -.2], [tip + .3, .12], [tip + .12, .23], [tip + .07, .37], [tip -.12, .37], [tip -.2, .16]], p.bone);
  polygon(ctx, [[tip -.13, -.1], [tip + .01, -.07], [tip -.08, .05]], casting ? p.accent : p.ink, null);
  polygon(ctx, [[tip + .1, -.07], [tip + .23, -.1], [tip + .2, .05]], casting ? p.accent : p.ink, null);
  if (casting) {
    const charge = Math.max(0, Math.min(1, ((e.shadowBoltTimer || 0) - 85) / 46));
    ellipse(ctx, tip, 0, .13 + charge * .12, .13 + charge * .12, '#bd71ff', p.ink, .045);
  }
  ctx.restore();
  }
  endCreature(ctx);
}

export const animationFrequency = .08;
export function draw(e) { drawParts(e, true, true); }
export function drawBody(e) { drawParts(e, true, false); }
export function drawLive(e) { drawParts(e, false, true); }

export function drawDying(de, t) { drawCreatureDeath(ctx, de, t, draw, 'crumble'); }
