import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

/** Cathedral wings frame one blood-red heart; stone form folds into a statue. */
export function draw(e) {
  const stone = !!e.isStoneForm;
  const p = creaturePalette(e, stone ? '#929da6' : '#53677c', stone ? '#485461' : '#202d42', stone ? '#c2c9ca' : e.enraged ? '#ff5263' : '#ff1744');
  const wind = e.actionState === 'WINDUP';
  const volley = e.currentSkill === 'BLOOD_VOLLEY' && (wind || e.actionState === 'STRIKE');
  const dead = e.deathPose !== undefined;
  const airborne = !dead && (e.isAirborne || (e.elevZ || 0) > 0);
  const flap = stone || dead ? 0 : Math.sin(frameCount * .15) * .09;
  const spread = stone ? .66 : airborne ? 1.5 : volley ? 1.43 : 1.23;
  beginCreature(ctx, e);
  if (airborne) ctx.translate(0, -(e.elevZ || 0) / (e.radius || 1));
  if (e.actionState === 'RECOVERY') ctx.translate(0,.1);
  for (const side of [-1, 1]) {
    polygon(ctx, [[side*.25,-.4],[side*(spread-.14),-1.08+flap],[side*(spread+.09),-1.28+flap],[side*(spread+.1),.24+flap],[side*.98,-.04],[side*.65,.6],[side*.51,.23],[side*.36,.31]], p.shade);
    if (!stone) polygon(ctx, [[side*.37,-.38],[side*(spread-.07),-.99+flap],[side*(spread-.02),-.1+flap],[side*.94,-.19],[side*.68,.28]], p.accent, null);
    ctx.save(); ctx.globalAlpha *= .38;
    polygon(ctx, [[side*.43,-.38],[side*(spread-.1),-.91+flap],[side*.81,-.06]], p.shade, null);
    stroke(ctx, [[side*(spread-.12),-.9+flap],[side*.87,-.36],[side*.7,.13]], stone ? p.body : p.bone, .025);
    stroke(ctx, [[side*.87,-.36],[side*(spread-.06),-.26+flap]], p.shade, .035);
    ctx.restore();
    stroke(ctx, [[side*.27,-.4],[side*spread,-1.12+flap],[side*.84,-.02]], p.body, .11);
    polygon(ctx, [[side*.24,.34],[side*.48,.44],[side*.64,.8],[side*.44,.75],[side*.4,.97],[side*.3,.79],[side*.19,.84]], p.body);
  }
  materialPolygon(ctx, [[-.47,-.42],[0,-.65],[.48,-.4],[.39,.38],[0,.65],[-.39,.35]], p, 'stone');
  polygon(ctx, [[-.39,-.36],[-.02,-.53],[-.05,.49],[-.32,.31]], p.shade, null);
  polygon(ctx, [[0,-.3],[.21,-.09],[.03,.23],[-.18,-.09]], p.accent);
  for (const side of [-1, 1]) {
    polygon(ctx, [[side*.18,-.72],[side*.39,-1.2],[side*.48,-.89],[side*.37,-.63]], p.shade);
    stroke(ctx, [[side*.37,-.16],[side*.61,.33],[side*.45,.49]], p.shade, .18);
  }
  polygon(ctx, [[-.3,-.82],[0,-.91],[.27,-.82],[.44,-.57],[.2,-.22],[-.23,-.37]], p.body);
  stroke(ctx, [[-.2,-.69],[-.05,-.61]], stone ? p.shade : p.accent, .075);
  stroke(ctx, [[.07,-.61],[.24,-.69]], stone ? p.shade : p.accent, .075);
  polygon(ctx, [[-.12,-.48],[.27,-.48],[.13,-.28],[-.02,-.34]], p.ink);
  polygon(ctx, [[-.04,-.49],[.03,-.35],[.09,-.49]], p.bone, null);
  if (volley && !stone && !dead) {
    ctx.save(); ctx.rotate(getRelativeAimAngle(e.aimAngle ?? 0, e.facing || 1));
    ellipse(ctx, .58, 0, wind ? .12+.13*(e.castProgress || 0) : .3, .15, p.accent);
    ctx.restore();
  }
  if (stone) stroke(ctx, [[-.2,-.92],[-.12,-.73],[-.2,-.4],[-.11,.11]], p.shade, .055);
  endCreature(ctx);
}

export function drawDying(e, t) { drawCreatureDeath(ctx, e, t, draw, 'crumble'); }
