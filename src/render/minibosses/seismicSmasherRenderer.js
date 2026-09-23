import { ctx } from '../../state/gameState.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, stroke, drawCreatureDeath } from '../creatureStyle.js';

/** A compact stone laborer carrying one enormous square impact hammer. */
export function draw(e) {
  const p = creaturePalette(e, '#587dae', '#243b5d', e.enraged ? '#ff4757' : '#ffb425');
  const wind = e.actionState === 'WINDUP';
  const strike = e.actionState === 'STRIKE';
  const recover = e.actionState === 'RECOVERY';
  beginCreature(ctx, e);
  ctx.translate(0, recover ? .12 : 0);
  polygon(ctx, [[-.58,.29],[-.2,.29],[-.16,.87],[-.72,.87]], p.shade);
  polygon(ctx, [[.16,.3],[.53,.3],[.66,.87],[.14,.87]], p.shade);
  materialPolygon(ctx, [[-.89,-.46],[-.62,-.72],[-.23,-.46],[.34,-.59],[.65,-.2],[.42,.57],[-.47,.57],[-.79,.03]], p, 'stone');
  polygon(ctx, [[-.72,-.51],[-.29,-.43],[-.21,.57],[-.47,.57],[-.79,.03]], p.shade, null);
  polygon(ctx, [[-.36,-.82],[-.09,-.98],[.1,-.84],[.23,-.46],[-.31,-.44]], p.shade);
  stroke(ctx, [[-.2,-.66],[.11,-.66]], p.accent, .09);
  const lift = wind ? -.35-.45*(e.castProgress || 0) : strike || recover ? .54 : -.05;
  ctx.save(); ctx.translate(.54, lift); ctx.rotate(wind ? -.35 : .2);
  stroke(ctx, [[-.36,.24],[.46,-.53]], p.ink, .19);
  stroke(ctx, [[-.36,.24],[.46,-.53]], p.bone, .09);
  polygon(ctx, [[.02,-.92],[.83,-.92],[1,-.65],[.83,-.28],[.02,-.28],[-.13,-.53]], p.shade);
  materialPolygon(ctx, [[.04,-.84],[.73,-.84],[.73,-.4],[.04,-.4]], p, 'stone');
  stroke(ctx, [[.82,-.8],[.89,-.64],[.8,-.43]], p.accent, wind ? .12 : .075);
  polygon(ctx, [[-.46,.01],[-.22,-.08],[-.06,.12],[-.17,.36],[-.42,.31]], p.body);
  ctx.restore();
  materialPolygon(ctx, [[-.94,-.03],[-.65,-.12],[-.47,.1],[-.53,.51],[-.84,.55],[-1,.28]], p, 'stone');
  stroke(ctx, [[-.88,.2],[-.59,.2]], p.shade, .075);
  if (strike && e.deathPose === undefined) stroke(ctx, [[.24,.91],[.62,.96],[1.12,.89]], p.accent, .11);
  endCreature(ctx);
}

export function drawDying(e, t) { drawCreatureDeath(ctx, e, t, draw, 'crumble'); }
