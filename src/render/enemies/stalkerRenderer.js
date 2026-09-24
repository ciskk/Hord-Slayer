import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { STALKER_DASH } from '../../config/stalkerDash.js';
import { beginCreature, endCreature, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

/** Aviso no solo em escala própria, sem squash, rotação ou cache do corpo. */
export function drawBurrowWarning(e) {
  const progress = Math.min(1, Math.max(0, (e.dashTimer || 0) / STALKER_DASH.windup));
  beginCreature(ctx, e);
  ellipse(ctx, 0, 0, 2.2, 1.25, '#30231e', '#efc78a', .1);
  ellipse(ctx, 0, 0, 1.25 + progress * .6, .65 + progress * .35, '#65452e', '#c79559', .08);
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI * 2 / 10;
    stroke(ctx, [[Math.cos(a) * .5, Math.sin(a) * .3],
      [Math.cos(a + .12) * 1.3, Math.sin(a + .12) * .7],
      [Math.cos(a) * 2, Math.sin(a) * 1.1]], '#171310', .1);
    const age = (progress * 1.8 + i / 10) % 1;
    const x = Math.cos(a) * (1 + age * 1.25);
    const y = Math.sin(a) * .55 - age * 1.6;
    ctx.save();
    ctx.globalAlpha *= .8 * (1 - age * .65);
    ellipse(ctx, x, y, .3 + age * .4, .22 + age * .32, '#e5bc80', null);
    polygon(ctx, [[x,y],[x+.12,y-.2],[x+.23,y+.02]], '#fff0be', null);
    ctx.restore();
  }
  endCreature(ctx);
}

/** Beige annelid: tapered segmented tail, thick collar and exposed ivory fangs. */
export function draw(e) {
  const p = creaturePalette(e, '#d9b783', '#886044', '#f0d5a2');
  const dead = e.deathPose !== undefined;
  const aiming = !dead && e.dashState === 'aim';
  const dashing = !dead && e.dashState === 'dashing';
  const progress = Math.min(1, Math.max(0, (e.dashTimer || 0) / STALKER_DASH.windup));
  const committed = ['aim', 'dashing', 'cooldown'].includes(e.dashState);
  beginCreature(ctx, e);
  ctx.translate(0, .32); // Belly contacts the ground shadow instead of floating above it.
  if (committed) ctx.rotate(getRelativeAimAngle(e.dashAngle ?? (e.facing === -1 ? Math.PI : 0), e.facing || 1));
  const stretch = dashing ? 1.16 : aiming ? .8 : 1;
  ctx.scale(stretch, aiming ? 1.1 : dashing ? .86 : 1);
  for (let i = 0; i < 6; i++) {
    const x = -1.12 + i * .29;
    const y = dead ? .05 : Math.sin(frameCount * .13 - i * .65) * (aiming ? .025 : .075);
    const h = .12 + i * .064;
    polygon(ctx, [[x-.24,y+.08],[x-.17,y-h*.65],[x+.02,y-h],[x+.23,y-h*.57],[x+.26,y+h*.55],[x+.05,y+h],[x-.18,y+h*.67]], i === 4 ? p.shade : p.body, p.ink, .045);
    stroke(ctx, [[x-.1,y-h*.62],[x+.04,y-h*.76],[x+.14,y-h*.48]], p.accent, .055);
    stroke(ctx, [[x+.17,y-h*.42],[x+.21,y+.02],[x+.13,y+h*.65]], p.shade, .045);
  }
  const gape = aiming ? progress * .09 : dashing || (!dead && e.combatState === 'STRIKE') ? .12 : 0;
  polygon(ctx, [[.36,-.38],[.69,-.48-gape],[.99,-.28-gape],[1.11,0],[.97,.32+gape],[.65,.45+gape],[.35,.3]], p.body);
  polygon(ctx, [[.63,-.3-gape],[.89,-.24-gape],[1.02,0],[.87,.29+gape],[.6,.28+gape],[.5,0]], p.ink, p.shade, .055);
  for (const side of [-1, 1]) {
    polygon(ctx, [[.6,side*(.28+gape)],[.76,side*(.31+gape)],[.86,side*.015]], p.bone, p.ink, .035);
    polygon(ctx, [[.89,side*(.22+gape)],[1.02,side*.14],[1.15,side*.015],[.93,side*.035]], p.bone, p.ink, .035);
  }
  endCreature(ctx);
}

export function drawDying(de, t) { drawCreatureDeath(ctx, de, t, draw, 'fall'); }
