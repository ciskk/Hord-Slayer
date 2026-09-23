import { ctx } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, stroke, drawCreatureDeath } from '../creatureStyle.js';

/** A crimson armored commander riding a squat, open-mouthed mortar carriage. */
export function draw(e) {
  const p = creaturePalette(e, '#b71540', '#4a1427', e.enraged ? '#ff4757' : '#ffd32a');
  const wind = e.actionState === 'WINDUP';
  const strike = e.actionState === 'STRIKE';
  const mortar = e.currentSkill === 'MORTAR_BARRAGE' && (wind || strike);
  beginCreature(ctx, e);
  polygon(ctx, [[-.92,.34],[.74,.34],[.94,.63],[.68,.86],[-.81,.86],[-1.01,.62]], p.shade);
  stroke(ctx, [[-.77,.6],[.68,.6]], p.body, .16);
  materialPolygon(ctx, [[-.8,-.35],[.37,-.39],[.69,.13],[.79,.49],[-.9,.49]], p, 'metal');
  polygon(ctx, [[-.82,-.26],[-.41,-.26],[-.32,.43],[-.85,.43]], p.shade, null);
  // Helmet and angular command crest remain visible behind the cannon.
  polygon(ctx, [[-.4,-.79],[-.19,-.99],[.17,-.89],[.28,-.53],[.09,-.27],[-.29,-.37]], p.shade);
  polygon(ctx, [[-.17,-.98],[-.3,-1.2],[.18,-1.19],[.28,-.9]], p.accent);
  stroke(ctx, [[-.16,-.67],[.19,-.67]], p.accent, .075);
  ctx.save();
  const localAim = getRelativeAimAngle(e.aimAngle ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1);
  ctx.rotate(mortar ? -.85 : localAim);
  const recoil = strike ? -.12 : 0;
  polygon(ctx, [[-.38,-.27],[.19,-.38],[.65,-.22],[.68,.27],[.19,.36],[-.4,.27]], p.shade);
  polygon(ctx, [[.1+recoil,-.28],[.92+recoil,-.38],[1.12+recoil,-.3],[1.12+recoil,.3],[.92+recoil,.38],[.1+recoil,.28]], p.body);
  polygon(ctx, [[.76+recoil,-.33],[1.12+recoil,-.3],[1.12+recoil,.3],[.76+recoil,.33]], p.shade);
  stroke(ctx, [[1.04+recoil,-.21],[1.04+recoil,.21]], p.accent, wind || strike ? .12 : .065);
  if (strike && e.deathPose === undefined) polygon(ctx, [[1.13+recoil,-.21],[1.49+recoil,0],[1.13+recoil,.21]], p.accent, null);
  ctx.restore();
  endCreature(ctx);
}

export function drawDying(e, t) { drawCreatureDeath(ctx, e, t, draw, 'crumble'); }
