/**
 * src/systems/enemyLifecycle/behaviors/splitterMini.js
 * Máquina de estados do salto predatório balístico 2.5D dos vermes (SPLITTER_MINI).
 */
import { playSfx } from '../../../core/audio.js';
import { createHitParticles, addDamageText } from '../../combat.js';
import { selectedHeroKey } from '../../../entities/player.js';

export function splitterMiniBehavior(e, dt, angle, curSpeed, ctx) {
  const { player, frameCount, triggerShake, triggerHaptic } = ctx;

  if (!e.leapState) e.leapState = 'none';
  if (e.landingSplashTimer > 0) e.landingSplashTimer -= dt;
  if (e.leapCooldown > 0 && e.leapState === 'none') e.leapCooldown -= dt;

  const isPlayerVisible = !(player.invisTimer > 0);
  const distToPlayerSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;

  // Se Kael ficar invisível durante o windup do salto, cancela
  if (!isPlayerVisible && e.leapState === 'windup') {
    e.leapState = 'none';
  }

  // Gatilho de início do salto em perseguição
  if (e.leapState === 'none' && (e.emergeTimer || 0) <= 0 && (e.stunTimer || 0) <= 0) {
    if (isPlayerVisible && distToPlayerSq < 155 * 155 && distToPlayerSq > 32 * 32 && (!e.leapCooldown || e.leapCooldown <= 0)) {
      e.leapState = 'windup';
      e.leapTimer = 0;
      e.leapDuration = 12; // 12 frames de encolhimento e mira tensa
      e.leapAngle = Math.atan2(player.y - e.y, player.x - e.x);
      e.facing = (player.x >= e.x) ? 1 : -1;
      createHitParticles(e.x, e.y, '#00cec9', 2);
    }
  }

  if (e.leapState === 'windup') {
    // Fase 1: Contraindo o corpo contra o solo, imóvel, mirando no jogador
    e.leapTimer += dt;
    e.facing = Math.cos(e.leapAngle) >= 0 ? 1 : -1;
    if (e.leapTimer >= e.leapDuration) {
      e.leapState = 'jumping';
      e.leapTimer = 0;
      e.leapDuration = 16; // 16 frames de trajetória aérea
      e.jumpMaxZ = 24;
      e.leapSpeed = e.speed * 4.2;
      playSfx('acid', 0.85);
      createHitParticles(e.x, e.y, '#00cec9', 5);
    }
  } else if (e.leapState === 'jumping') {
    // Fase 2: Voo Parabólico Balístico 2.5D
    e.leapTimer += dt;
    const leapProg = Math.min(1, e.leapTimer / e.leapDuration);
    e.jumpZ = Math.sin(leapProg * Math.PI) * e.jumpMaxZ;

    // Deslocamento cinético na direção travada
    e.x += Math.cos(e.leapAngle) * e.leapSpeed * dt;
    e.y += Math.sin(e.leapAngle) * e.leapSpeed * dt;

    // Rastro aéreo cáustico
    if (frameCount % 4 === 0) {
      createHitParticles(e.x, e.y - e.jumpZ, '#48dbfb', 1);
    }

    // Colisão física direta no ar com o jogador
    const pContactDistSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
    if (isPlayerVisible && pContactDistSq <= (player.radius + e.radius + 5) ** 2 && player.iFrames <= 0) {
      let pDmg = e.damage;
      if (selectedHeroKey === 'KNIGHT') pDmg *= 0.80;
      const actualDmg = Math.round(pDmg * (player.damageTakenMultiplier || 1.0));
      player.hp -= actualDmg;
      player.iFrames = Math.round(26 * (player.iFramesDurationMult || 1.0));
      playSfx('hit');
      triggerShake(5);
      triggerHaptic('medium');
      addDamageText(player.x, player.y - 12, `-${actualDmg}`, false, '#00cec9');
      createHitParticles(player.x, player.y, '#ff4757', 6);
      e.leapTimer = e.leapDuration;
    }

    if (e.leapTimer >= e.leapDuration) {
      e.leapState = 'landing';
      e.leapTimer = 0;
      e.leapDuration = 8;
      e.jumpZ = 0;
      e.landingSplashTimer = 16;
      playSfx('acid', 0.65);
      createHitParticles(e.x, e.y, '#00cec9', 7);
      e.leapCooldown = 75 + Math.floor(Math.random() * 35);
    }
  } else if (e.leapState === 'landing') {
    // Fase 3: Impacto no chão e recuperação elástica
    e.leapTimer += dt;
    const recoverSpd = e.speed * 0.15;
    e.x += Math.cos(angle) * recoverSpd * dt;
    e.y += Math.sin(angle) * recoverSpd * dt;
    if (e.leapTimer >= e.leapDuration) {
      e.leapState = 'none';
    }
  } else {
    // Movimentação padrão
    e.x += Math.cos(angle) * curSpeed * dt;
    e.y += Math.sin(angle) * curSpeed * dt;
  }
}
