import { ctx, frameCount } from '../../state/gameState.js';
import { player } from '../../entities/player.js';
import { beginCreature, endCreature, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// A swollen ember belly and a single burning fuse announce the explosion.
export function draw(e) {
  const dead = e.deathPose !== undefined;
  const fuse = !dead && e.fuseState === 'FUSE';
  const p = creaturePalette(e, '#b94a27', '#451627', '#ff8019');
  const urgency = dead ? 0 : Math.max(0, 1 - Math.hypot((e.x || 0) - player.x, (e.y || 0) - player.y) / 260);
  const progress = fuse ? Math.max(0, Math.min(1, 1 - (e.fuseTimer || 0) / 28)) : 0;
  const pulse = dead ? 0 : Math.sin(frameCount * (fuse ? .6 : .12 + urgency * .3)) * (fuse ? .07 : .025);
  const step = dead || fuse ? 0 : Math.sin(frameCount * .28) * .1;
  beginCreature(ctx, e);
  stroke(ctx, [[-.36, .25], [-.62, .63], [-.66 + step, .95]], p.ink, .25);
  stroke(ctx, [[.28, .28], [.55, .56], [.67 - step, .94]], p.ink, .23);
  polygon(ctx, [[-.85 - pulse, -.32], [-.55, -.84 - pulse], [.09, -.79], [.52 + pulse, -.27], [.44 + pulse, .52], [-.19, .85 + pulse], [-.79, .5]], p.shade, p.ink, .11);
  // The fuse is an attack signal even though its AI deliberately sets hitFlash.
  const ember = fuse ? (progress > .66 ? '#ffe3a0' : '#ffb74e') : p.accent;
  ellipse(ctx, -.17, .07, .51 + pulse, .57 + pulse, ember, p.ink, .09);
  ellipse(ctx, -.28, -.05, .25, .32, fuse ? '#fff3d4' : '#ffd38b', null);
  polygon(ctx, [[-.78, -.32], [-.43, -.69], [-.26, -.58], [-.47, -.25]], p.body);
  polygon(ctx, [[.17, -.68], [.35, -.94], [.68, -.83], [.86, -.55], [.71, -.28], [.34, -.35]], p.body);
  polygon(ctx, [[.54, -.44], [.89, -.37], [.69, -.21], [.42, -.34]], p.shade);
  stroke(ctx, [[.5, -.67], [.73, -.57]], ember, .1);
  stroke(ctx, [[.52, -.39], [.72, -.39]], p.ink, .1);
  stroke(ctx, [[.37, -.08], [.69, .22], [.87, .53]], p.ink, .24);
  stroke(ctx, [[.37, -.08], [.69, .22], [.87, .53]], p.body, .14);
  const wickTop = -.97 + progress * .19;
  stroke(ctx, [[-.3, -.67], [-.43, -.93], [-.28, wickTop - .1]], p.ink, .17);
  stroke(ctx, [[-.3, -.67], [-.43, -.93], [-.28, wickTop - .1]], p.body, .09);
  if (!dead) polygon(ctx, [[-.42, wickTop -.1], [-.28, wickTop -.43 - pulse], [-.1, wickTop -.11], [-.25, wickTop + .03]], ember, p.ink, .06);
  endCreature(ctx);
}

export function drawDying(de, t) { drawCreatureDeath(ctx, de, t, draw, 'burst'); }
