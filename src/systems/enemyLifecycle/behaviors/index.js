/**
 * src/systems/enemyLifecycle/behaviors/index.js
 * Despachante unificado O(1) de comportamentos e IA dos monstros comuns de Hord.io.
 */
import { swarmBehavior } from './swarm.js';
import { shooterBehavior } from './shooter.js';
import { dashBehavior } from './dash.js';
import { kamikazeBehavior } from './kamikaze.js';
import { kamikazeSpreadBehavior } from './kamikazeSpread.js';
import { backstabDashBehavior } from './backstabDash.js';
import { protectAuraBehavior } from './protectAura.js';
import { boulderThrowBehavior } from './boulderThrow.js';
import { batSpawnerBehavior } from './batSpawner.js';
import { blinkSlashBehavior } from './blinkSlash.js';
import { vortexCarrierBehavior } from './vortexCarrier.js';
import { chaosCycleBehavior } from './chaosCycle.js';
import { summonerBehavior } from './summoner.js';
import { groundSlamBehavior } from './groundSlam.js';
import { mortarBarrageBehavior } from './mortarBarrage.js';
import { gravityRitualBehavior } from './gravityRitual.js';
import { trailToxicBehavior } from './trailToxic.js';
import { webTrapperBehavior } from './webTrapper.js';
import { chainHookBehavior } from './chainHook.js';
import { stoneTurtleBehavior } from './stoneTurtle.js';
import { hasteChanterBehavior } from './hasteChanter.js';
import { hordeMenderBehavior } from './hordeMender.js';
import { barrierLinkerBehavior } from './barrierLinker.js';
import { flamethrowerConeBehavior } from './flamethrowerCone.js';
import { spikeRetaliationBehavior } from './spikeRetaliation.js';
import { mirrorDecoyBehavior } from './mirrorDecoy.js';
import { lanceChargeBehavior } from './lanceCharge.js';
import { longRangeSniperBehavior } from './longRangeSniper.js';
import { xpDevourerBehavior } from './xpDevourer.js';
import { corpseEaterBehavior } from './corpseEater.js';
import { mimicTrapBehavior } from './mimicTrap.js';
import { splitterMiniBehavior } from './splitterMini.js';
import { defaultChaseBehavior } from './defaultChase.js';

export const BEHAVIOR_HANDLERS = {
  swarm: swarmBehavior,
  shooter: shooterBehavior,
  dash: dashBehavior,
  kamikaze: kamikazeBehavior,
  kamikaze_spread: kamikazeSpreadBehavior,
  backstab_dash: backstabDashBehavior,
  protect_aura: protectAuraBehavior,
  boulder_throw: boulderThrowBehavior,
  bat_spawner: batSpawnerBehavior,
  blink_slash: blinkSlashBehavior,
  vortex_carrier: vortexCarrierBehavior,
  chaos_cycle: chaosCycleBehavior,
  summoner: summonerBehavior,
  ground_slam: groundSlamBehavior,
  mortar_barrage: mortarBarrageBehavior,
  gravity_ritual: gravityRitualBehavior,
  trail_toxic: trailToxicBehavior,
  web_trapper: webTrapperBehavior,
  chain_hook: chainHookBehavior,
  stone_turtle: stoneTurtleBehavior,
  haste_chanter: hasteChanterBehavior,
  horde_mender: hordeMenderBehavior,
  barrier_linker: barrierLinkerBehavior,
  flamethrower_cone: flamethrowerConeBehavior,
  spike_retaliation: spikeRetaliationBehavior,
  mirror_decoy: mirrorDecoyBehavior,
  lance_charge: lanceChargeBehavior,
  long_range_sniper: longRangeSniperBehavior,
  xp_devourer: xpDevourerBehavior,
  corpse_eater: corpseEaterBehavior,
  mimic_trap: mimicTrapBehavior
};

/**
 * Atualiza a IA e movimentação do monstro despachando em O(1).
 * @param {object} e - Entidade do monstro.
 * @param {number} dt - Delta time.
 * @param {number} angle - Ângulo em direção ao alvo.
 * @param {number} curSpeed - Velocidade atual calculada com modificadores.
 * @param {object} ctx - Contexto de jogo.
 * @returns {{ playerDied?: boolean }|void}
 */
export function updateEnemyAI(e, dt, angle, curSpeed, ctx) {
  if (e.baseType === 'SPLITTER_MINI') {
    return splitterMiniBehavior(e, dt, angle, curSpeed, ctx);
  }
  const handler = BEHAVIOR_HANDLERS[e.behavior] || defaultChaseBehavior;
  return handler(e, dt, angle, curSpeed, ctx);
}
