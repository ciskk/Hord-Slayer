import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, creaturePalette, polygon, stroke, drawCreatureDeath } from '../creatureStyle.js';

// Wide red membranes, pointed ears, two fangs: readable even at radius 4.5.
export function draw(e) {
  const p = creaturePalette(e, '#e02746', '#570d27', '#ffbd61');
  const dead = e.deathPose !== undefined;
  const windup = !dead && e.combatState === 'WINDUP';
  const strike = !dead && e.combatState === 'STRIKE';
  const flap = dead ? .8 * e.deathPose : Math.sin(frameCount * (strike ? .68 : .42)) * .38;
  beginCreature(ctx, e);
  if (windup) ctx.rotate(.2);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    polygon(ctx, [[.18, -.22], [.93, -.83 + flap], [2.15, -.8 + flap], [1.54, -.02 + flap * .4], [1.17, -.17], [.76, .53], [.43, .24], [.18, .44]], p.body, p.ink, .13);
    polygon(ctx, [[.22, -.16], [.92, -.65 + flap], [1.52, -.05 + flap * .4], [1.17, -.17], [.76, .53]], p.shade, null);
    stroke(ctx, [[.25, -.15], [.96, -.68 + flap], [2.05, -.77 + flap]], p.body, .12);
    polygon(ctx, [[.08, -.55], [.48, -1.34], [.6, -.44]], p.shade, p.ink, .12);
    ctx.restore();
  }
  polygon(ctx, [[-.28, -.35], [.28, -.35], [.34, .17], [0, .71], [-.34, .17]], p.shade, p.ink, .13);
  polygon(ctx, [[-.48, -.64], [-.21, -.81], [0, -.67], [.21, -.81], [.48, -.64], [.32, -.15], [0, .04], [-.32, -.15]], p.shade, p.ink, .13);
  stroke(ctx, [[-.29, -.46], [-.1, -.4]], p.accent, .14);
  stroke(ctx, [[.1, -.4], [.29, -.46]], p.accent, .14);
  polygon(ctx, [[-.25, -.2], [-.1, .17], [-.04, -.16]], p.bone, null);
  polygon(ctx, [[.04, -.16], [.1, .17], [.25, -.2]], p.bone, null);
  if (strike) {
    ctx.save();
    ctx.rotate(getRelativeAimAngle(e.attackAngle ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1));
    stroke(ctx, [[.75, -.35], [1, 0], [.75, .35]], p.accent, .16);
    ctx.restore();
  }
  endCreature(ctx);
}

export function drawDying(de, t) {
  ctx.save();
  ctx.rotate(t * .85);
  drawCreatureDeath(ctx, de, t, draw, 'fall');
  ctx.restore();
}
