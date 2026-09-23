import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

/** A low chitin queen: six hooked legs carry a huge, translucent clutch. */
export function draw(e) {
  const p = creaturePalette(e, '#008e91', '#003c45', e.enraged ? '#ff4757' : '#39f0bc');
  const wind = e.actionState === 'WINDUP';
  const eggs = !!e.isSpawningEggs || e.currentSkill === 'BROOD_EGGS' && wind;
  const acid = e.currentSkill === 'ACID_SPIT' && (wind || e.actionState === 'STRIKE');
  const dead = e.deathPose !== undefined;
  beginCreature(ctx, e);
  for (let i = 0; i < 3; i++) {
    const x = -.67 + i*.54;
    const step = dead || wind ? 0 : Math.sin(frameCount*.15 + i*1.6)*.06;
    for (const side of [-1,1]) {
      polygon(ctx, [[x,.2*side],[x-.23,.72*side],[x+.05,(1.09+step)*side],[x-.11,.65*side],[x+.12,.27*side]], p.shade);
      stroke(ctx, [[x-.17,.64*side],[x-.02,.96*side]], p.body, .075);
    }
  }
  const pulse = eggs ? .05+.05*(e.castProgress || 0) : 0;
  materialPolygon(ctx, [[-.38,-.61],[-.98,-.81-pulse],[-1.49,-.47],[-1.59,.17],[-1.16,.65+pulse],[-.57,.67],[-.13,.21]], p, 'chitin');
  polygon(ctx, [[-.53,-.43],[-1.02,-.61],[-1.32,-.35],[-1.4,.12],[-1.04,.47],[-.61,.42],[-.35,.07]], p.shade);
  // Three large embryos are readable as a clutch even at combat scale.
  for (const [x,y] of [[-1.08,-.19],[-.72,.15],[-1.13,.26]]) {
    ellipse(ctx, x, y, .17+(eggs ? .025 : 0), .23, p.accent);
    stroke(ctx, [[x-.035,y-.09],[x+.04,y],[x-.01,y+.09]], p.shade, .06);
  }
  materialPolygon(ctx, [[-.39,-.44],[.24,-.52],[.61,-.26],[.61,.3],[.25,.5],[-.37,.35],[-.52,-.02]], p, 'chitin');
  polygon(ctx, [[-.22,-.38],[.18,-.45],[.37,-.25],[-.07,-.01]], p.shade, null);
  ctx.save();
  ctx.rotate(getRelativeAimAngle(e.aimAngle ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1));
  polygon(ctx, [[.3,-.33],[.73,-.3],[.9,0],[.72,.31],[.3,.29]], p.shade);
  const open = acid ? .15 : .04;
  polygon(ctx, [[.67,-.18],[1.02,-.49-open],[1.23,-.27-open],[1.01,-.08],[1.06,-.29-open],[.86,-.15]], p.body);
  polygon(ctx, [[.67,.18],[1.02,.49+open],[1.23,.27+open],[1.01,.08],[1.06,.29+open],[.86,.15]], p.body);
  stroke(ctx, [[.57,-.13],[.75,-.1]], p.accent, .075);
  stroke(ctx, [[.57,.13],[.75,.1]], p.accent, .075);
  if (acid && !dead) ellipse(ctx, .87, 0, .12+.08*(e.castProgress || 0), .13, p.accent);
  ctx.restore();
  endCreature(ctx);
}

export function drawDying(e, t) { drawCreatureDeath(ctx, e, t, draw, 'burst'); }
