import { ctx, frameCount } from '../../state/gameState.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, stroke, drawCreatureDeath } from '../creatureStyle.js';

/** A hunched ape silhouette: massive fists and an open jaw announce the attack. */
export function draw(e) {
  const p = creaturePalette(e, '#318652', '#103c2b', e.enraged ? '#ff4757' : '#4cff84');
  const fabric = creaturePalette(e, '#6b547e', '#302b46', '#b6a0c1');
  const wind = e.actionState === 'WINDUP';
  const strike = e.actionState === 'STRIKE';
  const leap = e.currentSkill === 'POUNCE';
  const howl = e.currentSkill === 'HOWL' && (wind || strike);
  const dead = e.deathPose !== undefined;
  const bob = dead ? 0 : Math.sin(frameCount * .11) * .025;
  beginCreature(ctx, e);
  ctx.translate(wind && leap ? -.12 : strike && leap ? .16 : 0, bob + (e.actionState === 'RECOVERY' ? .12 : 0));
  polygon(ctx, [[-.5,.3],[-.24,.35],[-.27,.88],[-.67,.88]], fabric.body);
  polygon(ctx, [[.21,.3],[.49,.3],[.67,.88],[.21,.88]], fabric.body);
  materialPolygon(ctx, [[-.91,-.29],[-.65,-.74],[-.17,-.84],[.47,-.5],[.62,-.07],[.35,.44],[-.11,.59],[-.64,.43]], p, 'flesh');
  polygon(ctx, [[-.65,-.48],[-.35,-.72],[.13,-.45],[.24,.44],[-.37,.57]], p.shade, null);
  polygon(ctx, [[-.6,.24],[-.17,.4],[.38,.23],[.35,.44],[.08,.39],[-.04,.55],[-.34,.47],[-.56,.52]], fabric.body);
  stroke(ctx, [[-.3,.38],[.1,.44]], fabric.shade, .04);
  for (const side of [-1, 1]) {
    const y = wind && leap ? -.52 : strike && leap ? -.04 : .39;
    stroke(ctx, [[side*.49,-.25],[side*.81,.02],[side*.88,y]], p.ink, .43);
    stroke(ctx, [[side*.49,-.25],[side*.81,.02],[side*.88,y]], p.body, .29);
    materialPolygon(ctx, [[side*.62,y-.2],[side*.86,y-.31],[side*1.07,y-.18],[side*1.15,y+.16],[side*.92,y+.35],[side*.72,y+.2]], p, 'flesh');
    polygon(ctx, [[side*.96,y+.08],[side*1.14,y+.41],[side*1.05,y+.03]], p.bone);
    polygon(ctx, [[side*.78,y+.17],[side*.92,y+.49],[side*.89,y+.09]], p.bone);
  }
  polygon(ctx, [[-.14,-.72],[.13,-.89],[.52,-.75],[.64,-.43],[.42,-.23],[.02,-.22],[-.16,-.43]], p.body);
  polygon(ctx, [[-.13,-.6],[.16,-.65],[.13,-.31],[.02,-.22],[-.16,-.43]], p.shade, null);
  polygon(ctx, [[.06,-.33],[.56,-.34],[.49,howl ? .14 : -.08],[.12,howl ? .08 : -.1]], p.ink);
  polygon(ctx, [[.08,-.34],[.48,-.34],[.44,-.23],[.14,-.23]], p.bone, null);
  stroke(ctx, [[.21,-.6],[.49,-.53]], p.accent, .085);
  stroke(ctx, [[-.6,-.48],[-.45,-.32],[-.51,.03]], p.accent, .07);
  if (howl && !dead) {
    ctx.strokeStyle = p.accent; ctx.lineWidth = .075;
    ctx.beginPath(); ctx.arc(.47,-.16,.43+.1*(e.castProgress || 0),-.65,.65); ctx.stroke();
  }
  endCreature(ctx);
}

export function drawDying(e, t) { drawCreatureDeath(ctx, e, t, draw, 'fall'); }
