import { ctx } from '../../state/gameState.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, stroke, drawCreatureDeath } from '../creatureStyle.js';

/** Broad rusted loader: slab-carrying arms and a locomotive-like chest. */
export function draw(e) {
  const p = creaturePalette(e, '#cf601e', '#552e24', e.enraged ? '#ff4757' : '#ffb142');
  const wind = e.actionState === 'WINDUP';
  const toss = e.currentSkill === 'BOULDER_TOSS';
  const charging = e.currentSkill === 'TRAIN_CHARGE' && (wind || e.actionState === 'STRIKE');
  beginCreature(ctx, e);
  ctx.rotate(charging ? -.13 : 0);
  if (e.actionState === 'RECOVERY') ctx.translate(0,.11);
  polygon(ctx, [[-.65,.27],[-.21,.27],[-.2,.89],[-.79,.89]], p.shade);
  polygon(ctx, [[.17,.27],[.6,.27],[.77,.89],[.13,.89]], p.shade);
  materialPolygon(ctx, [[-.98,-.53],[-.68,-.85],[-.26,-.62],[.32,-.66],[.72,-.91],[.91,-.57],[.87,.4],[.48,.66],[-.66,.58]], p, 'rust');
  polygon(ctx, [[-.88,-.66],[-.36,-.63],[-.31,.54],[-.66,.54]], p.shade, null);
  polygon(ctx, [[-.31,-.23],[.42,-.23],[.67,.37],[.16,.28],[-.02,.46],[-.43,.29]], p.shade);
  stroke(ctx, [[-.24,-.05],[.36,-.05]], p.accent, charging ? .13 : .075);
  polygon(ctx, [[-.29,-.96],[.29,-.96],[.36,-.58],[-.35,-.58]], p.shade);
  stroke(ctx, [[-.18,-.77],[.25,-.77]], p.accent, .09);
  const handY = wind && toss ? -.81-.2*(e.castProgress || 0) : .25;
  for (const side of [-1, 1]) {
    stroke(ctx, [[side*.72,-.41],[side*.95,handY]], p.ink, .43);
    stroke(ctx, [[side*.72,-.41],[side*.95,handY]], p.shade, .29);
    materialPolygon(ctx, [[side*.73,handY-.21],[side*1.07,handY-.32],[side*1.24,handY-.08],[side*1.17,handY+.24],[side*.96,handY+.32],[side*.73,handY+.14]], p, 'rust');
    stroke(ctx, [[side*.88,handY-.08],[side*1.14,handY+.01]], p.shade, .08);
  }
  if (wind && toss) {
    polygon(ctx, [[-.87,handY-.14],[-.69,handY-.69],[.2,handY-.87],[.88,handY-.59],[.95,handY-.11],[.18,handY+.08]], p.bone);
    stroke(ctx, [[-.5,handY-.63],[-.2,handY-.35],[-.28,handY-.01]], p.shade, .07);
  }
  endCreature(ctx);
}

export function drawDying(e, t) { drawCreatureDeath(ctx, e, t, draw, 'crumble'); }
