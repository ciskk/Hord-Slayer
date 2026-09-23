import { ctx } from '../../state/gameState.js';
import { beginCreature, endCreature, materialPolygon, creaturePalette, polygon, stroke, drawCreatureDeath } from '../creatureStyle.js';

/** A living bastion: broad buttresses and one cyan shield seal carry the identity. */
export function draw(e) {
  const p = creaturePalette(e, '#207ec2', '#142f57', e.enraged ? '#ff4757' : '#00e5ed');
  const wind = e.actionState === 'WINDUP';
  const strike = e.actionState === 'STRIKE';
  const cage = e.currentSkill === 'RUNIC_CAGE';
  beginCreature(ctx, e);
  const lift = wind && cage ? -.22 : e.actionState === 'RECOVERY' ? .1 : 0;
  polygon(ctx, [[-.63,.32],[-.18,.32],[-.17,.92],[-.74,.92]], p.shade);
  polygon(ctx, [[.18,.32],[.63,.32],[.74,.92],[.17,.92]], p.shade);
  // Shoulders are architectural buttresses rather than floating rune ornaments.
  for (const side of [-1,1]) {
    materialPolygon(ctx, [[side*.4,-.66+lift],[side*.86,-.95+lift],[side*1.04,-.36+lift],[side*.89,.54+lift],[side*.55,.49+lift]], p, 'stone');
    polygon(ctx, [[side*.8,-.63+lift],[side*.9,-.39+lift],[side*.77,.36+lift],[side*.66,.3+lift]], p.shade, null);
  }
  materialPolygon(ctx, [[-.4,-.64],[0,-.83],[.42,-.62],[.63,.22],[.29,.72],[-.3,.72],[-.62,.2]], p, 'stone');
  polygon(ctx, [[-.34,-.51],[0,-.64],[.34,-.51],[.42,.23],[0,.55],[-.41,.23]], p.shade);
  polygon(ctx, [[-.25,-.31],[.25,-.31],[.26,.14],[0,.4],[-.26,.14]], p.accent);
  polygon(ctx, [[-.13,-.18],[.13,-.18],[.13,.09],[0,.23],[-.13,.09]], p.body, null);
  polygon(ctx, [[-.28,-.94],[0,-1.16],[.28,-.94],[.22,-.64],[-.23,-.64]], p.shade);
  stroke(ctx, [[-.15,-.82],[.15,-.82]], p.accent, .075);
  if (wind || strike) {
    if (cage) {
      stroke(ctx, [[-.91,-.32+lift],[-.91,-.69+lift],[-.65,-.85+lift]], p.accent, .085);
      stroke(ctx, [[.91,-.32+lift],[.91,-.69+lift],[.65,-.85+lift]], p.accent, .085);
    } else {
      polygon(ctx, [[-.41,-.47],[.41,-.47],[.48,.22],[0,.72],[-.48,.22]], null, p.accent, strike ? .11 : .055+.04*(e.castProgress || 0));
    }
  }
  endCreature(ctx);
}

export function drawDying(e, t) { drawCreatureDeath(ctx, e, t, draw, 'crumble'); }
