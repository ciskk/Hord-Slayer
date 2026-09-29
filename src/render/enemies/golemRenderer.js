import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, stroke, drawCreatureDeath } from '../creatureStyle.js';

// Three stone masses and heavy square fists communicate the slow melee tank.
function drawParts(e, body, arms, damageOverlay = true) {
  const p = creaturePalette(e, '#91a6b4', '#344b63', '#ff9a21');
  const dead = e.deathPose !== undefined;
  const windup = !dead && e.combatState === 'WINDUP';
  const strike = !dead && e.combatState === 'STRIKE';
  const step = dead ? 0 : Math.sin(frameCount * .1) * .055;
  const split = dead ? e.deathPose * .3 : 0;
  beginCreature(ctx, e);
  if (body) {
  for (const side of [-1, 1]) {
    polygon(ctx, [[side * .2, .36], [side * .65, .36], [side * .7, .91 + side * step], [side * .17, .91 + side * step]], p.shade);
  }
  materialPolygon(ctx, [[-.75, -.56], [-.53, -.76], [.55, -.76], [.8, -.48], [.57, .55], [-.59, .55]], p, 'stone', p.ink, .095);
  polygon(ctx, [[.16, -.66], [.59, -.63], [.71, -.43], [.51, .46], [.18, .46]], p.shade, null);
  polygon(ctx, [[-.31, -.98], [.27, -1.03], [.38, -.54], [-.29, -.52]], p.shade);
  polygon(ctx, [[-.3, -.99], [.27, -1.03], [.19, -.86], [-.26, -.82]], p.body, null);
  stroke(ctx, [[-.16, -.73], [.2, -.73]], p.accent, windup ? .13 : .09);
  stroke(ctx, [[-.24, -.35], [-.07, -.08], [-.2, .14], [.03, .38]], p.ink, .095);
  }
  if (damageOverlay) {
    const damage = Math.max(0, 1 - (e.hp ?? 1) / (e.maxHp || 1));
    if (damage > .45 || windup) stroke(ctx, [[-.23, -.34], [-.06, -.08], [-.19, .14], [.02, .36]], p.accent, .045 + damage * .025);
  }
  if (arms) {
  ctx.save();
  if (windup || strike) ctx.rotate(getRelativeAimAngle(e.attackAngle ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1));
  for (const side of [-1, 1]) {
    const x = strike ? (side === -1 ? .55 : 1.03) : side * (.91 + split);
    const y = windup ? -.95 : strike ? .45 : .1 + side * step + split;
    stroke(ctx, [[side * .55, -.36], [x, y]], p.ink, .38);
    stroke(ctx, [[side * .55, -.36], [x, y]], p.shade, .25);
    materialPolygon(ctx, [[x - .32, y - .35], [x + .24, y - .35], [x + .37, y - .19], [x + .33, y + .36], [x - .34, y + .32]], { ...p, body: side === 1 ? p.body : p.shade }, 'stone', p.ink, .095);
    stroke(ctx, [[x - .21, y - .2], [x + .2, y - .2]], windup ? p.accent : p.body, .065);
  }
  if (strike) stroke(ctx, [[.34, .87], [.67, .74], [1.04, .87], [1.42, .74]], p.accent, .11);
  ctx.restore();
  }
  endCreature(ctx);
}

export const animationFrequency = .1;
const attacking = e => e.combatState === 'WINDUP' || e.combatState === 'STRIKE';
export function draw(e) { drawParts(e, true, true); }
export function drawBody(e) { drawParts(e, true, !attacking(e), false); }
export function drawLive(e) {
  if (attacking(e) || 1 - (e.hp ?? 1) / (e.maxHp || 1) > .45) drawParts(e, false, attacking(e));
}

export function drawDying(de, t) { drawCreatureDeath(ctx, de, t, draw, 'crumble'); }
