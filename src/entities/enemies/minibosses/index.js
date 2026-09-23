/**
 * src/entities/enemies/minibosses/index.js
 * 
 * Despachante unificado de IA e FSM dos 16 Minibosses de Hord.io.
 */
import { checkEnrage } from './common.js';
import { bloodGargoyleHandler } from './bloodGargoyle.js';
import { zombieAlphaHandler } from './zombieAlpha.js';
import { phalanxLeaderHandler } from './phalanxLeader.js';
import { seismicSmasherHandler } from './seismicSmasher.js';
import { artilleryMechHandler } from './artilleryMech.js';
import { fireIncineratorHandler } from './fireIncinerator.js';
import { broodMatriarchHandler } from './broodMatriarch.js';
import { spectralStalkerHandler } from './spectralStalker.js';
import { highOccultistHandler } from './highOccultist.js';
import { runicWardenHandler } from './runicWarden.js';
import { rustColossusHandler } from './rustColossus.js';
import { siegeCaptainHandler } from './siegeCaptain.js';
import { mobileHiveHandler } from './mobileHive.js';
import { quantumSlicerHandler } from './quantumSlicer.js';
import { voidPrecursorHandler } from './voidPrecursor.js';
import { chaosHeraldHandler } from './chaosHerald.js';

export const MINIBOSS_HANDLERS = {
  BLOOD_GARGOYLE: bloodGargoyleHandler,
  ZOMBIE_ALPHA: zombieAlphaHandler,
  PHALANX_LEADER: phalanxLeaderHandler,
  SEISMIC_SMASHER: seismicSmasherHandler,
  ARTILLERY_MECH: artilleryMechHandler,
  FIRE_INCINERATOR: fireIncineratorHandler,
  BROOD_MATRIARCH: broodMatriarchHandler,
  SPECTRAL_STALKER: spectralStalkerHandler,
  HIGH_OCCULTIST: highOccultistHandler,
  RUNIC_WARDEN: runicWardenHandler,
  RUST_COLOSSUS: rustColossusHandler,
  SIEGE_CAPTAIN: siegeCaptainHandler,
  MOBILE_HIVE: mobileHiveHandler,
  QUANTUM_SLICER: quantumSlicerHandler,
  VOID_PRECURSOR: voidPrecursorHandler,
  CHAOS_HERALD: chaosHeraldHandler
};

export function updateMiniBoss(e, dt, context) {
  if (!e || e.hp <= 0) return;

  if (!e.actionState) {
    e.actionState = 'CHASE';
    e.actionTimer = 0;
    e.actionMaxTimer = 0;
    e.currentSkill = null;
    e.castProgress = 0;
    e.enraged = false;
    const handler = MINIBOSS_HANDLERS[e.baseType];
    if (handler && handler.init) handler.init(e);
  }

  checkEnrage(e, context);

  const player = context.player;
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  // Inércia de rotação para miniboss com escudo pesado (Centurião): 0.5s (30 frames) para girar
  const isShieldBearer = (e.baseType === 'SHIELDED' || e.baseType === 'PHALANX_LEADER' || e.hasFrontalShield);
  if (isShieldBearer) {
    const desiredFacing = dx >= 0 ? 1 : -1;
    if (e.facing === undefined) e.facing = desiredFacing;
    if (desiredFacing !== e.facing) {
      if (e.turnDelayTimer === undefined || e.turnDelayTimer <= 0) {
        e.turnDelayTimer = 30; // 0.5s a 60 FPS
      } else {
        e.turnDelayTimer -= dt;
        if (e.turnDelayTimer <= 0) {
          e.facing = desiredFacing;
        }
      }
    } else {
      e.turnDelayTimer = 0;
    }
  } else {
    e.facing = dx >= 0 ? 1 : -1;
  }

  const handler = MINIBOSS_HANDLERS[e.baseType];
  if (handler && handler.update) {
    handler.update(e, dt, context, dist, angle);
  } else {
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;
  }
}

export { checkEnrage };
