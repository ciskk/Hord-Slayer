import { ctx, frameCount } from '../../state/gameState.js';
import { getRelativeAimAngle } from '../../core/math.js';
import { STALKER_DASH } from '../../config/stalkerDash.js';
import { beginCreature, endCreature, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

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
  // Dust rises from the contact patch before launch, below the red attack marker.
  if (aiming) {
    for (let i = 0; i < 7; i++) {
      const age = (progress * 1.6 + i / 7) % 1;
      const side = i % 2 ? 1 : -1;
      ctx.save();
      ctx.globalAlpha *= (.18 + progress * .36) * (1 - age * .65);
      const x = side * (.48 + age * .7) + Math.sin(i * 3.1) * .18;
      const y = .48 - age * (.55 + progress * .65);
      ellipse(ctx, x, y, .14 + age * .19, .09 + age * .15, p.body, null);
      polygon(ctx, [[x, y-.13], [x+.06,y-.22], [x+.12,y-.11]], p.accent, null);
      ctx.restore();
    }
  }
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
