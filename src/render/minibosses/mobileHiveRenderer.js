import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, stroke, drawCreatureDeath } from '../creatureStyle.js';

/** A hollow hanging hive with ragged wings and one deep swarm outlet. */
export function draw(e) {
  const p = creaturePalette(e, '#16a085', '#06483e', e.enraged ? '#ff4757' : '#baff36');
  const wind = e.actionState === 'WINDUP';
  const strike = e.actionState === 'STRIKE';
  const swarm = e.currentSkill === 'SWARM_MISSILES' && (wind || strike);
  const smog = e.currentSkill === 'SMOG_CLOUD' && (wind || strike);
  const dead = e.deathPose !== undefined;
  const flap = dead ? 0 : Math.sin(frameCount*.14)*.08;
  beginCreature(ctx, e);
  for (const side of [-1,1]) {
    polygon(ctx, [[side*.3,-.33],[side*.74,-1.02-flap],[side*1.34,-.86-flap],[side*1.57,-.2],[side*1.03,-.45],[side*.89,.05],[side*.53,.18]], p.shade);
    stroke(ctx, [[side*.46,-.31],[side*.82,-.82-flap],[side*1.28,-.75-flap]], p.body, .09);
  }
  materialPolygon(ctx, [[-.31,-.92],[.34,-.92],[.74,-.55],[.78,.18],[.49,.71],[.04,1.04],[-.46,.71],[-.77,.13],[-.7,-.51]], p, 'chitin');
  polygon(ctx, [[-.3,-.82],[-.13,-.69],[-.28,.54],[.04,.92],[-.37,.65],[-.66,.1],[-.61,-.48]], p.shade, null);
  stroke(ctx, [[-.55,-.32],[.07,-.49],[.6,-.31]], p.shade, .08);
  stroke(ctx, [[-.6,.38],[.05,.57],[.57,.34]], p.shade, .08);
  // Recessed brood cells give the shell a hive texture around the main outlet.
  for (const [x,y] of [[-.38,-.38],[-.18,-.62],[.09,-.61],[-.43,.04],[-.31,.36],[.01,.66]]) {
    polygon(ctx, [[x-.1,y-.06],[x,y-.12],[x+.1,y-.06],[x+.1,y+.06],[x,y+.12],[x-.1,y+.06]], p.shade, p.ink, .025);
    stroke(ctx, [[x-.075,y+.045],[x,y+.085],[x+.075,y+.045]], p.body, .025);
  }
  ctx.save();
  ctx.rotate(getRelativeAimAngle(e.aimAngle ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1));
  const gape = swarm ? .09+.07*(e.castProgress || 0) : 0;
  polygon(ctx, [[.32,-.3-gape],[.78,-.39-gape],[1,-.16],[1,.16],[.78,.39+gape],[.32,.3+gape],[.17,0]], p.shade);
  polygon(ctx, [[.5,-.22-gape],[.82,-.24-gape],[.9,0],[.82,.24+gape],[.5,.22+gape],[.34,0]], p.ink);
  // One coarse bat silhouette inside the opening explains what the hive emits.
  polygon(ctx, [[.45,0],[.46,-.15],[.65,-.045],[.72,-.11],[.79,-.045],[.91,-.15],[.88,.05],[.76,.04],[.71,.13],[.65,.04]], swarm ? p.accent : p.body, null);
  if (strike && swarm && !dead) stroke(ctx, [[1.04,-.19],[1.26,0],[1.04,.19]], p.accent, .07);
  ctx.restore();
  if (smog && !dead) {
    polygon(ctx, [[-.27,.7],[-.18,.97],[0,.87],[.17,1.07],[.29,.74]], p.accent, null);
  }
  endCreature(ctx);
}

export function drawDying(e, t) { drawCreatureDeath(ctx, e, t, draw, 'burst'); }
