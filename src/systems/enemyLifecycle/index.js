/**
 * src/systems/enemyLifecycle/index.js
 * Orquestrador do Ciclo de Vida e IA dos Inimigos de Hord.io.
 * - Despacho de Cinemática, Decaimento e DoTs (statusEffects.js)
 * - Delegação de Chefes e Mini-Chefes (bossRegistry.js e minibossController.js)
 * - Despacho O(1) de Comportamentos de Monstros Comuns (behaviors/index.js)
 * - Processamento de Mortes, Drops e Recompensas (deathHandler.js)
 * - Processamento de Ataques Melee (combat.js)
 */
import { tickEnemyStatus } from './statusEffects.js';
import { updateEnemyAI } from './behaviors/index.js';
import { handleEnemyDeath } from './deathHandler.js';
import { createHitParticles, addDamageText, processEnemyMeleeAttacks } from '../combat.js';
import { updateBoss } from '../../entities/bosses/bossRegistry.js';
import { updateMiniBoss } from '../../entities/minibossController.js';
import { triggerBossBark } from '../barks.js';
import { finalizeVictoryAndReturnToMenu } from '../ui.js';
import { spawnChest as spawnChestPickup } from '../pickups.js';
import { getWorldEventEnemySpeedMult } from '../worldEvents.js';

export function updateEnemies(dt, context) {
  const {
    player,
    enemies,
    frameCount,
    freezeTimer,
    enemyBullets,
    bossTelegraphs,
    bossProjectiles,
    bossShockwaves,
    voidVortices,
    acidPuddles,
    chests,
    setActiveBoss,
    triggerShake,
    triggerHaptic
  } = context;

  const spawnChest = (x, y, tier = 'BOSS') => spawnChestPickup(chests, x, y, tier);
  const ctx = { ...context, spawnChest };

  // Atualização dos Monstros (iteração reversa para remoções seguras)
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    // 1. Decaimento de timers, knockback suave e DoTs cáusticos
    const statusSignal = !e.isBoss && !e.isBossSubTarget && e.hp <= 0 ? 'ok' : tickEnemyStatus(e, dt, player, triggerShake);
    // Abates (inclusive DoT durante stun) entram na animação antes de executar IA.
    if (!e.isBoss && !e.isBossSubTarget && e.hp <= 0) {
      const deathResult = handleEnemyDeath(e, i, ctx);
      if (deathResult?.playerDied) return { playerDied: true };
      if (deathResult?.earlyExit) return { playerDied: false };
      continue;
    }
    if (statusSignal === 'skip' || statusSignal === 'stunned') {
      continue;
    }

    // 2. IA, Mira e Movimentação (se o jogo não estiver sob freeze-time global)
    if (freezeTimer <= 0) {
      const isConfused = ((player.invisTimer > 0) || (e.confusedTimer > 0)) && !e.isBoss;
      const targetX = isConfused ? (e.x + Math.sin(frameCount * 0.05 + i) * 120) : player.x;
      const targetY = isConfused ? (e.y + Math.cos(frameCount * 0.05 + i) * 120) : player.y;

      const angle = Math.atan2(targetY - e.y, targetX - e.x);

      // Inércia de rotação para portadores de escudo pesado: 0.5s (30 frames) para virar de lado
      const isShieldBearer = (e.baseType === 'SHIELDED' || e.baseType === 'PHALANX_LEADER' || e.hasFrontalShield);
      if (isShieldBearer) {
        const desiredFacing = (targetX - e.x) >= 0 ? 1 : -1;
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
        e.facing = (targetX - e.x) > 0 ? 1 : -1;
      }

      let curSpeed = e.speed * getWorldEventEnemySpeedMult();
      if (e.emergeTimer > 0) {
        curSpeed *= 0.18;
      }
      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        const maxSlow = e.isBoss ? 0.18 : (e.slowFactor || 0.5);
        curSpeed *= (1 - maxSlow);
      }

      // Micro Stagger / Hit-Stun: amortece o avanço próprio do inimigo enquanto sofre impulso forte de recuo
      const pushSpeed = Math.hypot(e.pushVx || 0, e.pushVy || 0);
      if (pushSpeed > 1.8) {
        curSpeed *= 0.25;
      }

      // Dash locomotion owns its attack/recovery movement; status slows still apply.
      if (e.behavior !== 'dash' || e.dashState === 'chase') {
        if (e.combatState === 'WINDUP') curSpeed *= 0.15;
        else if (e.combatState === 'STRIKE') curSpeed *= 0.10;
        else if (e.combatState === 'RECOVERY') curSpeed *= -0.30;
      }

      if (e.isBoss && e.isEnraged && Math.floor(frameCount) % 5 === 0) {
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius * 1.4,
          e.y + (Math.random() - 0.5) * e.radius * 1.4,
          '#e74c3c',
          1
        );
      }

      if (e.isBoss && e.windupAction && e.windupTimer > 0) {
        e.windupTimer -= dt;
        createHitParticles(
          e.x + (Math.random() - 0.5) * e.radius,
          e.y + (Math.random() - 0.5) * e.radius,
          e.color,
          1
        );
        if (e.windupTimer <= 0) {
          e.windupAction();
          e.windupAction = null;
        }
        continue;
      }

      if (e.isBoss) {
        if (!e.enrageBarkTriggered && (e.isEnraged || (e.hp <= e.maxHp * 0.5))) {
          e.enrageBarkTriggered = true;
          triggerBossBark(e.bossId, 'ENRAGE');
        }
        updateBoss(e, dt, {
          player,
          frameCount,
          enemies,
          enemyBullets,
          bossTelegraphs,
          bossProjectiles,
          bossShockwaves,
          voidVortices,
          triggerShake,
          triggerHaptic,
          createHitParticles,
          addDamageText,
          onDefeatComplete: () => {
            if (setActiveBoss) setActiveBoss(null);
            finalizeVictoryAndReturnToMenu();
          }
        });
      } else if (e.isMiniBoss) {
        updateMiniBoss(e, dt, {
          player,
          frameCount,
          enemies,
          enemyBullets,
          bossTelegraphs,
          bossProjectiles,
          bossShockwaves,
          voidVortices,
          acidPuddles,
          triggerShake,
          triggerHaptic,
          createHitParticles,
          addDamageText
        });
      } else {
        // Despacho O(1) de Comportamentos de Monstros Comuns
        const aiResult = updateEnemyAI(e, dt, angle, curSpeed, ctx);
        if (aiResult?.playerDied) {
          return { playerDied: true };
        }
      }
    }

    // Se for o Chefe Final em colapso dramático de derrota, ignora processamento comum
    if (e.isBoss && e.isFinalBoss && e.actionState === 'DEATH_COLLAPSE') {
      continue;
    }

    // 3. Processamento de Abate e Morte
    if (e.hp <= 0) {
      const deathResult = handleEnemyDeath(e, i, ctx);
      if (deathResult?.playerDied) {
        return { playerDied: true };
      }
      if (deathResult?.earlyExit) {
        return { playerDied: false };
      }
    }
  }

  // 4. Processamento de ataques corpo a corpo
  processEnemyMeleeAttacks(player, enemies, dt, freezeTimer);
  return { playerDied: false };
}
