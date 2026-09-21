/** src/systems/enemyLifecycle/behaviors/batSpawner.js — Spawns bat minions */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';
import { ENEMY_TYPES } from '../../../config/enemies.js';

export function batSpawnerBehavior(e, dt, angle, curSpeed, ctx) {
  const { enemies, gameState } = ctx;

  e.x += Math.cos(angle) * curSpeed * dt;
  e.y += Math.sin(angle) * curSpeed * dt;
  e.hiveTimer = (e.hiveTimer || 0) + dt;
  if (e.hiveTimer >= 180 && !gameState.isWavePaused) {
    e.hiveTimer = 0;
    playSfx('boss');
    addDamageText(e.x, e.y, "INVOQUE ENXAME!", false, '#16a085');
    createHitParticles(e.x, e.y, '#16a085', 10);
    const batCount = Math.floor(Math.random() * 2) + 2;
    for (let k = 0; k < batCount; k++) {
      const batDef = ENEMY_TYPES.BAT;
      enemies.push({
        x: e.x + (k - 0.5) * 24,
        y: e.y + (Math.random() - 0.5) * 18,
        baseType: 'BAT',
        radius: batDef.radius,
        speed: batDef.speed,
        hp: batDef.hp,
        maxHp: batDef.hp,
        color: batDef.color,
        damage: batDef.damage,
        behavior: batDef.behavior,
        xp: batDef.xp,
        facing: e.facing,
        hitFlash: 0,
        orbitalHitCd: 0,
        slowTimer: 0,
        slowFactor: 0,
        stunTimer: 0,
        combatState: 'CHASE',
        attackTimer: 0,
        attackRange: 20,
        attackWindupFrames: 12,
        attackStrikeFrames: 4,
        attackRecoveryFrames: 23,
        attackCooldown: 0,
        attackCooldownMax: 15,
        attackAngle: 0,
        hasHitInStrike: false,
        fuseState: 'CHASE',
        fuseTimer: 0,
        fuseTelegraph: null,
        explodedNaturally: false
      });
    }
  }
}
