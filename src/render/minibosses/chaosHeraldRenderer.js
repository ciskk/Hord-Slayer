import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

/** Horned crimson cyclops: coiled charge, spread spiral arms, raised slam claws. */
export function draw(e) {
  const p = creaturePalette(e, e.enraged ? '#dc303e' : '#b91d32', '#410f26', e.enraged ? '#ff8b66' : '#ff4757');
  const wind = e.actionState === 'WINDUP';
  const strike = e.actionState === 'STRIKE';
  const cast = wind || strike;
  const spiral = cast && e.currentSkill === 'CHAOS_SPIRAL';
  const charge = cast && e.currentSkill === 'HELLFIRE_CHARGE';
  const slam = cast && e.currentSkill === 'APOCALYPSE_SLAM';
  const dead = e.deathPose !== undefined;
  beginCreature(ctx, e);
  if (charge) ctx.rotate(-.17);
  if (e.actionState === 'RECOVERY') ctx.translate(0,.13);
  const wave = dead ? 0 : Math.sin(frameCount*.1)*.035;
  for (const side of [-1,1]) {
    polygon(ctx, [[side*.16,.36],[side*.62,.35],[side*.83,.8+wave],[side*.41,.74],[side*.28,1.03],[side*.06,.88]], p.shade);
    polygon(ctx, [[side*.31,-.58],[side*.49,-1.12],[side*1.1,-1.36],[side*.83,-.87],[side*.53,-.51]], p.shade);
    polygon(ctx, [[side*.57,-.96],[side*1.1,-1.36],[side*.83,-.87]], p.body, null);
  }
  if (spiral) {
    // Projectile-emitting arms align with the actual spiral sources at 1.25R.
    const count = e.enraged ? 6 : 4;
    const spin = e.spiralAngle ?? frameCount*.15;
    for (let i=0; i<count; i++) {
      ctx.save(); ctx.rotate(getRelativeAimAngle(spin+i*Math.PI*2/count, e.facing || 1));
      polygon(ctx, [[.41,-.16],[.83,-.33],[1.25,-.1],[1.38,.08],[1.06,.05],[.75,-.1],[.45,.18]], p.shade);
      polygon(ctx, [[1.08,-.12],[1.35,0],[1.12,.12]], p.accent);
      ctx.restore();
    }
  } else {
    for (const side of [-1,1]) {
      const y = slam && wind ? -.78 : slam && strike ? .53 : charge ? -.17 : .13;
      polygon(ctx, [[side*.42,-.34],[side*.88,-.28],[side*1.07,y],[side*.91,y+.28],[side*.71,y+.08]], p.body);
      polygon(ctx, [[side*.89,y-.07],[side*1.16,y-.06],[side*1.23,y+.27],[side*1.04,y+.15],[side*.95,y+.38],[side*.78,y+.2]], p.shade);
    }
  }
  materialPolygon(ctx, [[-.51,-.68],[0,-.9],[.56,-.65],[.73,-.14],[.43,.48],[0,.68],[-.46,.48],[-.72,-.09]], p, 'flesh');
  polygon(ctx, [[-.46,-.54],[-.08,-.77],[-.19,.17],[-.4,.42],[-.6,-.05]], p.shade, null);
  // One large pointed eye preserves the original creature's identity.
  polygon(ctx, [[-.35,-.22],[-.08,-.5],[.22,-.42],[.47,-.16],[.19,.1],[-.14,.12]], p.accent);
  const aim = getRelativeAimAngle(e.aimAngle ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1);
  const pupilX = .045+Math.cos(aim)*.075;
  const pupilY = -.16+Math.sin(aim)*.075;
  polygon(ctx, [[pupilX,pupilY-.23],[pupilX+.065,pupilY],[pupilX,pupilY+.23],[pupilX-.065,pupilY]], p.ink, null);
  polygon(ctx, [[-.21,.3],[.01,.4],[.29,.27],[.14,.53],[-.09,.52]], p.ink);
  if (slam && wind && !dead) stroke(ctx, [[-.91,-.77],[0,-1.02],[.92,-.77]], p.accent, .075);
  endCreature(ctx);
}

export function drawDying(e, t) { drawCreatureDeath(ctx, e, t, draw, 'dissolve'); }
