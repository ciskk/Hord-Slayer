/**
 * src/systems/enemyLifecycle/statusEffects.js
 * Processamento de Status, Temporizadores de Emerge, Cinemática de Knockback
 * e DoTs Cáusticos para todos os inimigos da horda.
 */
import { playSfx } from '../../core/audio.js';
import { createHitParticles, addDamageText } from '../combat.js';
import { integrateEnemyKnockback } from './knockback.js';

/**
 * Processa status effects, timers de emerge, knockback e DoTs cáusticos.
 * @param {object} e - Inimigo atual.
 * @param {number} dt - Delta time.
 * @param {object} player - Entidade do jogador.
 * @param {Function} triggerShake - Disparar screen-shake.
 * @returns {'skip'|'stunned'|'ok'} Sinal de controle de fluxo para o laço principal.
 */
export function tickEnemyStatus(e, dt, player, triggerShake) {
  // Decaimento de flash de impacto e cooldowns de armas orbitais
  if (e.hitFlash > 0) e.hitFlash -= dt;
  if (e.orbitalHitCd > 0) e.orbitalHitCd -= dt;
  if (e.axeHitCd > 0) e.axeHitCd -= dt;
  if (e.shieldStaggerTimer > 0) e.shieldStaggerTimer -= dt;
  if (e.roarMarkTimer > 0) e.roarMarkTimer = Math.max(0, e.roarMarkTimer - dt);
  if (e.freezeTimer > 0) e.freezeTimer -= dt;

  // Timer de emergência (vermes e parasitas nascendo do solo)
  if (e.emergeTimer > 0) {
    e.emergeTimer -= dt;
    if (e.emergeTimer <= 0) {
      e.emergeTimer = 0;
      // Culminação do nascimento dos vermes da horda
      if (e.baseType === 'SPLITTER' || e.baseType === 'SPLITTER_MINI' || e.baseType === 'TRAIL_CRAWLER') {
        playSfx('acid', 0.65);
        createHitParticles(e.x, e.y, '#00cec9', 8);
        if (e.baseType === 'SPLITTER') {
          triggerShake(2.5);
          const surgeAngle = Math.atan2(player.y - e.y, player.x - e.x);
          e.pushVx = Math.cos(surgeAngle) * 3.8;
          e.pushVy = Math.sin(surgeAngle) * 3.8;
        } else if (e.baseType === 'SPLITTER_MINI') {
          // Salto inaugural imediato ao eclodir do solo
          e.leapState = 'windup';
          e.leapTimer = 0;
          e.leapDuration = 8;
          e.leapAngle = Math.atan2(player.y - e.y, player.x - e.x);
          e.facing = (player.x >= e.x) ? 1 : -1;
        }
      }
    }
  }

  if (e.isBossSubTarget) return 'skip';

  // Integração Cinética de Knockback Suave (Impulso com Fricção Exponencial)
  integrateEnemyKnockback(e, dt);

  if (e.acidStackTimer > 0) {
    e.acidStackTimer -= dt;
    if (e.acidStackTimer <= 0) e.acidStacks = 0;
  }
  if (e.confusedTimer > 0) e.confusedTimer -= dt;
  e.inAcidPuddle = false;

  // DoT Aderente de Corrosão / Fixação Cáustica (Caminhos 1 e 3)
  if (e.acidBurnTimer > 0) {
    e.acidBurnTimer -= dt;
    const stacks = Math.max(1, e.acidStacks || 1);
    // Teto rígido com 5 stacks: ~75-95 DPS estável (+30% da corrosão)
    // Dano base aumentado em +35% para hordas (0.24 -> 0.324; evoluído 0.35 -> 0.4725)
    const burnBasePerFrame = (e.acidBurnEvolved ? 0.4725 : 0.324) * stacks;
    const corrosionMult = 1 + (stacks * 0.06);
    // Decomposição Cáustica em Chefes: fator 40/27 (1.4815x) que, combinado à base 1.35x, atinge exatamente 2.0x DPS baseline (50% mais fácil)
    const bossCorrosionBonus = (e.isBoss || e.isMiniBoss) ? (40 / 27) : 1.0;
    const frameDmg = burnBasePerFrame * corrosionMult * bossCorrosionBonus * dt;

    e.hp -= frameDmg;

    e.burnDmgAcc = (e.burnDmgAcc || 0) + frameDmg;
    e.burnTickTimer = (e.burnTickTimer || 0) + dt;
    if (e.burnTickTimer >= 20) {
      const displayDmg = Math.round(e.burnDmgAcc);
      if (displayDmg >= 1) {
        const burnColor = e.acidBurnEvolved ? '#00cec9' : '#a29bfe';
        addDamageText(e.x, e.y - (e.radius || 14) * 0.5, displayDmg, false, burnColor);
        createHitParticles(e.x, e.y, burnColor, 1);
      }
      e.burnDmgAcc = 0;
      e.burnTickTimer = 0;
    }
    if (e.acidBurnTimer <= 0) {
      e.acidBurnEvolved = false;
    }
  }

  // DoT de Queimadura Ígnea Contínua (Ignis)
  if (e.fireBurnTimer > 0) {
    e.fireBurnTimer -= dt;
    const frameDmg = (e.fireBurnDmg || 0.35) * dt;

    e.hp -= frameDmg;

    e.fireBurnDmgAcc = (e.fireBurnDmgAcc || 0) + frameDmg;
    e.fireBurnTickTimer = (e.fireBurnTickTimer || 0) + dt;
    if (e.fireBurnTickTimer >= 18) {
      const displayDmg = Math.round(e.fireBurnDmgAcc);
      if (displayDmg >= 1) {
        const burnColor = e.fireBurnCrit ? '#f39c12' : '#e67e22';
        addDamageText(e.x, e.y - (e.radius || 14) * 0.5, displayDmg, !!e.fireBurnCrit, burnColor);
        createHitParticles(e.x, e.y, '#f39c12', 2);
        createHitParticles(e.x, e.y, '#e74c3c', 1);
      }
      e.fireBurnDmgAcc = 0;
      e.fireBurnTickTimer = 0;
    }
    if (e.fireBurnTimer <= 0) {
      e.fireBurnDmg = 0;
      e.fireBurnCrit = false;
      e.fireBurnDmgAcc = 0;
      e.fireBurnTickTimer = 0;
    }
  }

  // Decaimento do timer de vulnerabilidade
  if (e.vulnerableTimer > 0) {
    e.vulnerableTimer -= dt;
    if (e.vulnerableTimer <= 0) {
      e.vulnerableTimer = 0;
      e.isVulnerable = false;
    }
  }

  if (e.stunTimer > 0) {
    e.stunTimer -= dt;
    return 'stunned';
  }

  return 'ok';
}
