import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

/** An empty, pointed mantle suspended between two hands holding a black singularity. */
export function draw(e) {
  const p = creaturePalette(e, '#8e44ad', '#28133f', e.enraged ? '#ff4757' : '#dd70ff');
  const wind = e.actionState === 'WINDUP';
  const strike = e.actionState === 'STRIKE';
  const beam = e.currentSkill === 'EVENT_HORIZON';
  const dead = e.deathPose !== undefined;
  beginCreature(ctx, e);
  const sway = dead ? 0 : Math.sin(frameCount*.075)*.055;
  materialPolygon(ctx, [[-.45,-.76],[-.19,-1.11],[.05,-.84],[.3,-1.13],[.49,-.65],[.38,.35],[.66,.99],[.11,.75],[-.05,1.13],[-.3,.75],[-.65,1.02],[-.49,.22]], p, 'cloth');
  polygon(ctx, [[-.25,-.56],[.23,-.62],[.31,.2],[.1,.68],[-.1,.61],[-.31,.24]], p.ink);
  polygon(ctx, [[-.4,.05],[-.21,.19],[-.38,.77+sway],[-.55,.9]], p.shade, null);
  polygon(ctx, [[.33,.07],[.15,.25],[.29,.65],[.52,.84-sway]], p.shade, null);
  stroke(ctx, [[-.16,-.65],[.16,-.65]], p.accent, .075);
  ctx.save();
  // The beam winds up along its locked global direction, independent of facing.
  if (beam && (wind || strike || dead)) ctx.rotate(getRelativeAimAngle(e.beamAngle ?? e.aimAngle ?? 0, e.facing || 1));
  const separation = wind ? .13*(1-(e.castProgress || 0)) : 0;
  for (const side of [-1,1]) {
    polygon(ctx, [[-.13,side*.33],[.3,side*(.56+separation)],[.86,side*(.39+separation)],[.72,side*.22],[.38,side*.34]], p.shade);
    polygon(ctx, [[.63,side*.32],[.9,side*.32],[1.02,side*.12],[.83,side*.17],[.76,side*.05],[.7,side*.16]], p.body);
  }
  const radius = wind ? .2+.09*(e.castProgress || 0) : strike ? .32 : .23;
  ellipse(ctx, .68, 0, radius, radius, p.ink, p.accent, .075);
  if (beam && wind && !dead) stroke(ctx, [[1.03,0],[1.48,0]], p.accent, .045);
  if (beam && strike && !dead) polygon(ctx, [[.95,-.15],[1.5,0],[.95,.15]], p.accent, null);
  ctx.restore();
  endCreature(ctx);
}

export function drawDying(e, t) { drawCreatureDeath(ctx, e, t, draw, 'dissolve'); }
