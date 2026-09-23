import { ctx, frameCount } from '../../state/gameState.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, ellipse, stroke, drawCreatureDeath } from '../creatureStyle.js';

// A thorn bud visibly spreads eight large spikes before retaliating.
export function draw(e) {
  const p = creaturePalette(e, '#737684', '#353446', '#cf47ee');
  const dead = e.deathPose || 0;
  const bursting = e.deathPose === undefined && (e.spikeBurstTimer || 0) > 0;
  const warning = e.deathPose === undefined && (e.spikeHits || 0) >= 3;
  const extension = bursting ? 0.43 : warning ? 0.17 : 0;
  const sway = dead ? 0 : Math.sin(frameCount * 0.14) * 0.035;
  beginCreature(ctx, e);
  ctx.rotate(sway);
  stroke(ctx, [[-0.17, 0.49], [-0.53, 0.83], [-0.77, 0.83]], p.ink, 0.18);
  stroke(ctx, [[0.16, 0.49], [0.48, 0.83], [0.73, 0.83]], p.ink, 0.18);
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate(i * Math.PI / 4);
    polygon(ctx, [[0.44, -0.14], [1.04 + extension - dead * 0.25, 0], [0.44, 0.14]], warning || bursting ? p.accent : p.body);
    ctx.restore();
  }
  polygon(ctx, [[0, -0.81], [0.48, -0.44], [0.59, 0.05], [0.4, 0.57], [0, 0.81], [-0.4, 0.57], [-0.59, 0.05], [-0.48, -0.44]], p.shade);
  materialPolygon(ctx, [[-0.07, -0.69], [-0.5, -0.33], [-0.42, 0.4], [0, 0.69], [-0.1 - extension * 0.3, 0.12]], p, 'metal');
  materialPolygon(ctx, [[0.07, -0.69], [0.5, -0.33], [0.42, 0.4], [0, 0.69], [0.1 + extension * 0.3, 0.12]], p, 'metal');
  const coreWidth = bursting ? 0.23 : 0.14;
  polygon(ctx, [[0, -0.46], [coreWidth, -0.1], [0, 0.37], [-coreWidth, -0.1]], dead ? p.shade : p.accent);
  stroke(ctx, [[-0.18, -0.42], [0, -0.31], [0.18, -0.42]], p.ink, 0.07);
  endCreature(ctx);
}
export function drawDying(de, t, R) {
  drawCreatureDeath(ctx, { ...de, radius: R }, t, draw, 'fall');
}
