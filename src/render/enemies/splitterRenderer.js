import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// Segmented teal flesh links the brood carrier with the smaller jumping larvae.
export function draw(e) {
  const p = creaturePalette(e, '#10bca7', '#08434b', '#8eefd2');
  const mini = e.baseType === 'SPLITTER_MINI';
  const dead = e.deathPose !== undefined;
  const strike = !dead && e.combatState === 'STRIKE';
  const windup = !dead && (e.combatState === 'WINDUP' || e.leapState === 'windup');
  const airborne = !dead && (e.jumpZ || 0) > 0;
  const leapPose = airborne || e.leapState === 'windup' || (dead && (e.deathJumpZ || 0) > 0);
  const crawl = dead ? 0 : Math.sin(frameCount * .25) * .065;
  beginCreature(ctx, e);
  if (mini && leapPose && e.leapAngle !== undefined) {
    ctx.rotate(getRelativeAimAngle(e.leapAngle, e.facing || 1));
  } else if ((windup || strike) && e.attackAngle !== undefined) {
    ctx.rotate(getRelativeAimAngle(e.attackAngle, e.facing || 1));
  }
  const contract = dead ? e.deathPose * .3 : windup ? .16 : 0;
  if (mini) {
    for (let ring = 2; ring >= 0; ring--) {
      const x = -.47 * ring * (1 - contract) + crawl;
      const height = .48 - ring * .09;
      const curl = dead ? -Math.sin(ring * .7) * e.deathPose * .45 : 0;
      polygon(ctx, [[x -.43, curl -.16], [x -.13, curl -height], [x + .24, curl -height * .76], [x + .43, curl], [x + .24, curl + height * .77], [x -.2, curl + height], [x -.46, curl + .13]], ring === 2 ? p.shade : p.body);
      polygon(ctx, [[x -.13, curl -height], [x + .24, curl -height * .76], [x + .36, curl -.04], [x -.09, curl -.17]], p.accent, null);
    }
  } else {
    // Two broad brood chambers, split by a single seam, communicate division.
    for (const side of [-1, 1]) {
      const separation = dead ? e.deathPose * .43 : 0;
      ctx.save();
      ctx.translate(-.25, side * separation);
      polygon(ctx, [[-.78, side * .08], [-.85, side * .36], [-.53, side * .8], [.11, side * .7], [.49, side * .35], [.4, side * .08]], p.body);
      polygon(ctx, [[-.85, side * .36], [-.53, side * .8], [.11, side * .7], [-.11, side * .39]], p.shade, null);
      ellipse(ctx, -.22, side * .35, .24, .2, p.accent, p.ink, .065);
      polygon(ctx, [[-.34, side * .33], [-.21, side * .45], [-.06, side * .3]], p.shade, null);
      ctx.restore();
    }
    stroke(ctx, [[-.99, -.02], [.24, -.02]], p.ink, .1);
    for (const side of [-1, 1]) {
      polygon(ctx, [[-.75, side * .53], [-.93, side * (.9 + crawl)], [-.42, side * .62]], p.shade);
      polygon(ctx, [[.11, side * .52], [.02, side * (.94 - crawl)], [.48, side * .53]], p.shade);
    }
  }
  const headX = mini ? .38 : .57;
  const gape = airborne || strike ? .16 : windup ? -.04 : 0;
  polygon(ctx, [[headX -.29, -.4], [headX + .16, -.43], [headX + .43, -.13], [headX + .38, .24], [headX + .03, .45], [headX -.29, .28]], p.body);
  polygon(ctx, [[headX + .05, -.31 - gape], [headX + .39 + gape, -.08], [headX + .37 + gape, .21], [headX + .02, .35 + gape], [headX -.06, .06]], p.ink, null);
  polygon(ctx, [[headX + .04, -.3 - gape], [headX + .34, -.18], [headX + .1, .01]], p.bone, null);
  polygon(ctx, [[headX + .05, .33 + gape], [headX + .35, .18], [headX + .1, .09]], p.bone, null);
  if (windup || airborne || strike) polygon(ctx, [[headX + .18, -.05], [headX + .36, .04], [headX + .19, .12]], p.accent, null);
  endCreature(ctx);
}

export function drawDying(de, t) { drawCreatureDeath(ctx, de, t, draw, 'burst'); }
