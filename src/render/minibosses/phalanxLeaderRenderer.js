import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, stroke, drawCreatureDeath } from '../creatureStyle.js';

/** Tower shield, single crest and spear make the protected front unmistakable. */
export function draw(e) {
  const p = creaturePalette(e, '#8295ad', '#25344d', e.enraged ? '#ff4757' : '#f1c40f');
  const wind = e.actionState === 'WINDUP';
  const strike = e.actionState === 'STRIKE';
  const thrust = e.currentSkill === 'SPEAR_THRUST';
  beginCreature(ctx, e);
  const step = e.deathPose !== undefined ? 0 : Math.sin(frameCount * .1) * .035;
  polygon(ctx, [[-.45,-.38],[.05,-.35],[.16,.81],[-.25,.69],[-.43,.93],[-.78,.8]], p.shade);
  polygon(ctx, [[-.35,.26],[-.09,.27],[-.12,.88],[-.46,.88]], p.body);
  polygon(ctx, [[.06,.27],[.3,.27],[.42,.88],[.08,.88]], p.shade);
  materialPolygon(ctx, [[-.55,-.45+step],[.18,-.42+step],[.39,-.12+step],[.23,.45+step],[-.29,.49+step],[-.54,.12+step]], p, 'metal');
  polygon(ctx, [[-.62,-.4+step],[-.33,-.69+step],[-.03,-.39+step],[-.44,-.17+step]], p.body);
  polygon(ctx, [[-.39,-.73],[-.21,-1.02],[.1,-.94],[.2,-.54],[.02,-.34],[-.31,-.41]], p.body);
  polygon(ctx, [[-.27,-.95],[-.4,-1.22],[-.1,-1.33],[.18,-1.12],[.09,-.96]], p.accent);
  stroke(ctx, [[-.26,-.69],[.12,-.69]], p.ink, .11);
  stroke(ctx, [[.01,-.69],[.01,-.44]], p.ink, .075);
  ctx.save();
  const aim = (thrust ? e.thrustAngle : e.chargeAngle) ?? e.aimAngle ?? (e.facing === -1 ? Math.PI : 0);
  ctx.rotate(getRelativeAimAngle(aim, e.facing || 1));
  const reach = strike && thrust ? 1.77 : wind && thrust ? .85 : 1.25;
  stroke(ctx, [[-.51,-.06],[reach,-.06]], p.ink, .12);
  stroke(ctx, [[-.51,-.06],[reach,-.06]], p.bone, .055);
  polygon(ctx, [[reach-.12,-.24],[reach+.4,-.06],[reach-.12,.13],[reach,-.06]], p.bone);
  ctx.restore();
  ctx.save(); ctx.translate(strike && !thrust ? .17 : 0, e.actionState === 'RECOVERY' ? .1 : 0);
  polygon(ctx, [[.17,-.68],[.84,-.68],[.94,-.51],[.88,.66],[.51,.92],[.12,.65],[.09,-.51]], p.shade);
  materialPolygon(ctx, [[.23,-.55],[.74,-.55],[.79,.53],[.49,.76],[.24,.54]], p, 'metal');
  polygon(ctx, [[.49,-.5],[.65,-.32],[.56,-.29],[.56,.5],[.49,.67],[.42,.5],[.42,-.29],[.33,-.32]], p.accent, null);
  if (e.shieldBlockFlash > 0 || (wind && !thrust)) stroke(ctx, [[.87,-.55],[.9,.56]], p.accent, .14);
  ctx.restore();
  endCreature(ctx);
}

export function drawDying(e, t) { drawCreatureDeath(ctx, e, t, draw, 'fall'); }
