import { ctx, frameCount } from '../../state/gameState.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, stroke, drawCreatureDeath } from '../creatureStyle.js';

/** A low, tapered hood and a single hooked knife read as a stealth assassin. */
export function draw(e) {
  const p = creaturePalette(e, '#6c3ad3', '#29124e', e.enraged ? '#ff4757' : '#00e5d4');
  const wind = e.actionState === 'WINDUP' || e.dashState === 'aim';
  const strike = e.actionState === 'STRIKE' || e.dashState === 'dashing';
  const dead = e.deathPose !== undefined;
  beginCreature(ctx, e);
  if (e.isStealthed && !dead) ctx.globalAlpha *= .42;
  const sway = dead ? 0 : Math.sin(frameCount * .09) * .04;
  polygon(ctx, [[-.2,-.56],[.39,-.35],[.43,.32],[-.16,.9],[-.23,.48],[-.56,.77],[-.48,.38],[-1.16,.64],[-.43,.1]], p.shade);
  materialPolygon(ctx, [[-.16,-.5],[.27,-.37],[.31,.17],[-.54,.5+sway],[-.34,.06]], p, 'cloth', null);
  materialPolygon(ctx, [[-.18,-1.15],[.2,-.92],[.48,-.65],[.63,-.21],[.34,-.24],[.09,-.13],[-.24,-.4]], p, 'cloth');
  polygon(ctx, [[.17,-.72],[.43,-.56],[.39,-.27],[.1,-.26],[.02,-.47]], p.ink);
  polygon(ctx, [[.16,-.62],[.39,-.52],[.44,-.31],[.29,-.37],[.25,-.19],[.15,-.37]], p.bone, null);
  stroke(ctx, [[.22,-.5],[.38,-.46]], p.accent, .065);
  ctx.save(); ctx.translate(.36,e.actionState === 'RECOVERY' ? .21 : .06); ctx.rotate(wind ? -.82 : strike ? .45 : -.17);
  stroke(ctx, [[-.16,.1],[.15,.07]], p.body, .2);
  stroke(ctx, [[.12,-.1],[.16,.23]], p.ink, .1);
  polygon(ctx, [[.18,.09],[.65,-.2],[1.12,-.11],[.63,.08],[.52,.31]], p.bone);
  stroke(ctx, [[.3,.12],[.85,-.02]], p.accent, wind ? .09 : .055);
  ctx.restore();
  if (strike && !dead) stroke(ctx, [[.61,-.73],[1.05,-.35],[1.17,.13]], p.accent, .075);
  endCreature(ctx);
}

export function drawDying(e, t) { drawCreatureDeath(ctx, e, t, draw, 'dissolve'); }
