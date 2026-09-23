import { ctx } from '../../state/gameState.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, stroke, drawCreatureDeath } from '../creatureStyle.js';

/** A duelist's narrow stance and two opposing blades distinguish chained cuts. */
export function draw(e) {
  const p = creaturePalette(e, '#7662df', '#2d1a65', e.enraged ? '#ff4757' : '#ed65ff');
  const wind = e.actionState === 'WINDUP';
  const strike = e.actionState === 'STRIKE';
  const recover = e.actionState === 'RECOVERY';
  const parity = (e.blinkCount || 0) % 2 ? -1 : 1;
  beginCreature(ctx, e);
  polygon(ctx, [[-.25,.17],[.02,.23],[-.35,.84],[-.67,.84]], p.shade);
  polygon(ctx, [[.09,.22],[.35,.13],[.59,.79],[.25,.85]], p.body);
  materialPolygon(ctx, [[-.46,-.57],[-.23,-.46],[.36,-.57],[.52,-.32],[.25,-.23],[.24,.26],[-.22,.3],[-.44,-.1]], p, 'metal');
  polygon(ctx, [[-.31,-.46],[-.11,-.4],[-.03,.25],[-.22,.25]], p.shade, null);
  polygon(ctx, [[-.31,-1.08],[.03,-.98],[.29,-1.13],[.28,-.91],[.4,-.78],[.27,-.42],[.02,-.3],[-.2,-.43]], p.body);
  polygon(ctx, [[-.15,-.8],[.29,-.79],[.25,-.64],[-.13,-.62]], p.shade, null);
  stroke(ctx, [[-.08,-.73],[.24,-.73]], p.accent, .07);
  for (const side of [-1, 1]) {
    ctx.save(); ctx.translate(side*.42,-.12);
    const pose = recover ? .6 : wind ? -.68*parity : strike ? .9*parity : -.2;
    ctx.rotate(side*pose);
    stroke(ctx, [[0,0],[side*.2,.14]], p.ink, .18);
    polygon(ctx, [[side*.12,.12],[side*.19,-.63],[side*.42,-1.22],[side*.37,-.43],[side*.54,-.18],[side*.4,-.24],[side*.45,.13]], p.bone);
    stroke(ctx, [[side*.36,-.75],[side*.36,.04]], p.accent, wind ? .085 : .05);
    ctx.restore();
  }
  if (strike && e.deathPose === undefined) {
    stroke(ctx, [[-.98,-.56],[.16,-.9],[1.14,-.33]], p.accent, .075);
  }
  endCreature(ctx);
}

export function drawDying(e, t) { drawCreatureDeath(ctx, e, t, draw, 'dissolve'); }
