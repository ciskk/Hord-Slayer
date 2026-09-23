import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

/** An iron furnace on legs: orange boiler, black firebox and a directional nozzle. */
export function draw(e) {
  const p = creaturePalette(e, '#d35400', '#552617', e.enraged ? '#ff4757' : '#ffd32a');
  const wind = e.actionState === 'WINDUP';
  const fire = !!e.isFlamethrowing;
  const purge = e.currentSkill === 'STEAM_PURGE' && (wind || e.actionState === 'STRIKE');
  const dead = e.deathPose !== undefined;
  beginCreature(ctx, e);
  const braced = fire || wind;
  polygon(ctx, [[-.49,.35],[-.1,.35],[-.16,.92],[-.67,.92],[-.65,.73]], p.shade);
  polygon(ctx, [[.16,.35],[.48,.35],[.68,.92],[.19,.92]], p.shade);
  materialPolygon(ctx, [[-.75,-.6],[-.55,-.83],[.37,-.79],[.66,-.43],[.56,.56],[-.54,.62],[-.78,.21]], p, 'metal');
  polygon(ctx, [[-.72,-.57],[-.35,-.68],[-.29,.54],[-.54,.57],[-.73,.16]], p.shade, null);
  polygon(ctx, [[-.5,-.74],[-.55,-1.24],[-.29,-1.24],[-.21,-.75]], p.shade);
  polygon(ctx, [[-.61,-1.22],[-.27,-1.22],[-.22,-1.36],[-.64,-1.36]], p.body);
  polygon(ctx, [[-.21,-.38],[.35,-.38],[.43,.29],[-.19,.35],[-.32,-.03]], p.ink);
  polygon(ctx, [[-.07,.22],[-.13,-.01],[.06,-.24],[.15,-.02],[.28,-.13],[.31,.21]], p.accent, null);
  stroke(ctx, [[-.23,-.13],[.35,-.13]], p.shade, .08);
  polygon(ctx, [[-.02,-.84],[.39,-.77],[.5,-.54],[.09,-.47],[-.08,-.61]], p.shade);
  stroke(ctx, [[.1,-.66],[.37,-.63]], p.accent, .075);
  if (purge && !dead) {
    const rise = wind ? .14 + .23*(e.castProgress || 0) : .57;
    polygon(ctx, [[-.58,-1.39],[-.7,-1.51-rise],[-.45,-1.44-rise],[-.24,-1.58-rise],[-.28,-1.39]], p.accent, null);
  }
  ctx.save();
  ctx.rotate(getRelativeAimAngle(e.aimAngle ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1));
  const recoil = fire ? -.035*(1+Math.sin(frameCount*.55)) : 0;
  // Nozzle ends at the same 1.1R muzzle used by flame projectiles.
  stroke(ctx, [[-.41,.31],[.11,.48],[.49,.18]], p.ink, .2);
  stroke(ctx, [[-.41,.31],[.11,.48],[.49,.18]], p.shade, .1);
  polygon(ctx, [[.3+recoil,-.18],[.86+recoil,-.18],[1.1,-.29],[1.1,.29],[.86+recoil,.18],[.3+recoil,.18]], p.shade);
  polygon(ctx, [[.83,-.24],[1.1,-.29],[1.1,.29],[.83,.24]], p.body);
  stroke(ctx, [[1.075,-.2],[1.075,.2]], p.accent, braced ? .1 : .055);
  if (fire && !dead) {
    const length = .36 + .08*Math.sin(frameCount*.42);
    polygon(ctx, [[1.1,-.18],[1.32,-.13],[1.27,-.26],[1.1+length,0],[1.29,.22],[1.3,.1],[1.1,.18]], p.accent, null);
  }
  ctx.restore();
  endCreature(ctx);
}

export function drawDying(e, t) { drawCreatureDeath(ctx, e, t, draw, 'burst'); }
