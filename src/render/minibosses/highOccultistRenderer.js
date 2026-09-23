import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

/** A sharp ceremonial mitre, split robe and crystal crozier identify the caster. */
export function draw(e) {
  const p = creaturePalette(e, '#6c28aa', '#27083f', e.enraged ? '#ff4757' : '#e056fd');
  const wind = e.actionState === 'WINDUP';
  const strike = e.actionState === 'STRIKE';
  const cast = wind || strike;
  const curse = e.currentSkill === 'CURSE_ORBS';
  const dead = e.deathPose !== undefined;
  const wave = dead ? 0 : Math.sin(frameCount*.09)*.035;
  beginCreature(ctx, e);
  materialPolygon(ctx, [[-.38,-.51],[.34,-.48],[.52,.19],[.68,.91],[.2,.72],[-.08,1.02],[-.31,.78],[-.72,.93],[-.54,.12]], p, 'cloth');
  polygon(ctx, [[-.28,-.4],[-.06,-.32],[-.07,.83],[-.31,.65],[-.58,.77+wave]], p.shade, null);
  polygon(ctx, [[.05,-.33],[.23,-.4],[.5,.78+wave],[.16,.62]], p.shade, null);
  materialPolygon(ctx, [[-.36,-.81],[-.17,-1.28],[0,-1.05],[.25,-1.35],[.39,-.77],[.22,-.44],[-.23,-.43]], p, 'cloth');
  polygon(ctx, [[-.22,-.76],[.2,-.81],[.27,-.52],[.04,-.33],[-.23,-.51]], p.ink);
  polygon(ctx, [[-.12,-.62],[.19,-.65],[.15,-.48],[-.05,-.45]], p.bone, null);
  stroke(ctx, [[-.1,-.59],[.15,-.6]], p.accent, .06);
  // The free hand opens for gravity, and closes for the three-orb volley.
  const handY = cast ? -.38 : .16;
  polygon(ctx, [[-.37,-.22],[-.77,handY-.1],[-.92,handY+.2],[-.48,.39]], p.shade);
  polygon(ctx, [[-.82,handY+.13],[-.95,handY-.16],[-.72,handY-.29],[-.58,handY-.1],[-.66,handY+.12]], p.bone);
  if (cast && !curse && !dead) ellipse(ctx, -.77, handY-.16, .17+.07*(e.castProgress || 0), .18, p.ink, p.accent, .07);
  ctx.save();
  const aim = e.aimAngle ?? (e.facing === -1 ? Math.PI : 0);
  // Actual curse projectiles originate at 1.15R along this aiming axis.
  ctx.rotate(cast || dead ? getRelativeAimAngle(aim, e.facing || 1) : -.95);
  stroke(ctx, [[-.55,0],[1.15,0]], p.ink, .16);
  stroke(ctx, [[-.55,0],[1.15,0]], p.bone, .075);
  polygon(ctx, [[.86,-.23],[1.1,-.37],[1.38,-.13],[1.44,.13],[1.16,.34],[.87,.19],[1.12,.14],[1.27,0],[1.1,-.17]], p.shade);
  polygon(ctx, [[1.15,-.22],[1.31,0],[1.15,.22],[.98,0]], p.accent);
  polygon(ctx, [[.27,-.1],[.47,-.14],[.48,.12],[.26,.16]], p.bone);
  if (wind && curse && !dead) stroke(ctx, [[1.41,-.18],[1.56,0],[1.41,.18]], p.accent, .075);
  if (strike && curse && !dead) polygon(ctx, [[1.38,-.17],[1.71,0],[1.38,.17]], p.accent, null);
  ctx.restore();
  endCreature(ctx);
}

export function drawDying(e, t) { drawCreatureDeath(ctx, e, t, draw, 'dissolve'); }
