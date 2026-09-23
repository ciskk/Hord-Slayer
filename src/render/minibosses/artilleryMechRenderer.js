import { ctx } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

/** Four braced feet support an unmistakable twin-barrel gun carriage. */
export function draw(e) {
  const p = creaturePalette(e, '#345bd2', '#17274e', e.enraged ? '#ff4757' : '#00dfe7');
  const wind = e.actionState === 'WINDUP';
  const fire = e.actionState === 'STRIKE';
  beginCreature(ctx, e);
  const brace = e.isSiegeMode ? 1.05 : .85;
  for (const side of [-1, 1]) {
    for (const y of [-.67,.68]) {
      stroke(ctx, [[side*.38,y*.45],[side*brace,y]], p.ink, .22);
      stroke(ctx, [[side*.38,y*.45],[side*brace,y]], p.body, .12);
      polygon(ctx, [[side*brace-.22,y-.13],[side*brace+.15,y-.18],[side*brace+.28,y+.16],[side*brace-.2,y+.16]], p.shade);
    }
  }
  polygon(ctx, [[-.62,-.51],[.53,-.51],[.71,0],[.51,.53],[-.59,.53],[-.76,0]], p.shade);
  ctx.save();
  ctx.rotate(getRelativeAimAngle(e.aimAngle ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1));
  materialPolygon(ctx, [[-.7,-.22],[-.44,-.55],[.29,-.51],[.57,-.23],[.57,.23],[.29,.51],[-.44,.55],[-.7,.22]], p, 'metal');
  polygon(ctx, [[-.47,-.34],[-.15,-.4],[-.13,.4],[-.47,.33]], p.shade, null);
  for (const [y, barrel] of [[-.23,'UPPER'],[.23,'LOWER']]) {
    const recoil = fire && e.lastFiredBarrel === barrel ? -.13 : 0;
    polygon(ctx, [[.08+recoil,y-.115],[1.23+recoil,y-.115],[1.23+recoil,y+.115],[.08+recoil,y+.115]], p.shade);
    polygon(ctx, [[.98+recoil,y-.18],[1.3+recoil,y-.23],[1.25+recoil,y],[1.3+recoil,y+.23],[.98+recoil,y+.18]], p.body);
    stroke(ctx, [[.27+recoil,y],[.79+recoil,y]], p.accent, wind || fire ? .085 : .045);
    if (fire && e.lastFiredBarrel === barrel && e.deathPose === undefined) {
      polygon(ctx, [[1.24+recoil,y-.12],[1.55+recoil,y],[1.24+recoil,y+.12]], p.accent, null);
    }
  }
  ellipse(ctx, -.07, 0, .12, .12, p.accent);
  if (wind && e.currentSkill === 'SIEGE_BURST') stroke(ctx, [[1.35,0],[1.95,0]], p.accent, .045);
  if (wind && e.currentSkill === 'MISSILE_BARRAGE') {
    polygon(ctx, [[-.45,-.12],[-.63,-.42],[-.81,-.12]], p.accent);
  }
  ctx.restore();
  endCreature(ctx);
}

export function drawDying(e, t) { drawCreatureDeath(ctx, e, t, draw, 'crumble'); }
