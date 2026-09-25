import { AXE_BASE_RADIUS, AXE_SPIN_DIRECTION, getAxeCount, getAxeSpinSpeed } from '../../config/axes.js';
/**
 * src/entities/player/weapons.js
 * Execução e Simulação de Armas, Ataques Ativos e Machados Nórdicos do Jogador.
 */
import { playSfx, triggerHaptic } from '../../core/audio.js';
import { createHitParticles, addDamageText, applyFreeze } from '../../systems/combat.js';
import { bullets, enemyBullets, enemies } from '../../state/collections.js';
import { triggerShake, cameraViewW, cameraViewH } from '../../state/gameState.js';
import { getNeighborIndices } from '../../core/spatialGrid.js';
import { distToSegment } from '../../core/math.js';
import { getMetaBonuses } from '../../systems/progression.js';
import { getBossPhaseDefeatDamage } from '../../systems/devtools.js';
import { player, selectedHeroKey } from './player.js';

export function calculateEffectiveDamage() {
  const meta = getMetaBonuses();
  return Math.round((player.baseDamage || 0) * (1 + (player.damagePercentBonus || 0)) * meta.damageMult);
}


const _axeCandidates = [];

export function updateSpinningAxes(dt) {
  if (player.axeCount <= 0) return;

  const currentSpinSpeed = getAxeSpinSpeed(player);
  player.axeAngle += AXE_SPIN_DIRECTION * currentSpinSpeed * dt;

  if (player.axeBossHealCd > 0) {
    player.axeBossHealCd = Math.max(0, player.axeBossHealCd - dt);
  }

  // Otimização Zero-GC: Cooldown individual no inimigo (e.axeHitCd) decrece em main.js em O(1),
  // eliminando varreduras com entries(), deletes e enemies.includes() na thread de combate.

  const effectiveRadius = player.axeRadius || AXE_BASE_RADIUS;
  const count = getAxeCount(player);
  const hitRadius = player.evolvedAxe ? 28 : 22;

  // Consulta espacial consolidada uma única vez para o anel orbital completo
  getNeighborIndices(player.x, player.y, effectiveRadius + hitRadius + 45, _axeCandidates);

  for (let i = 0; i < count; i++) {
    const angle = player.axeAngle + (i * (Math.PI * 2 / count));
    const ax = player.x + Math.cos(angle) * effectiveRadius;
    const ay = player.y + Math.sin(angle) * effectiveRadius;

    // O corte pertence ao machado orbital, não ao segmento até o corpo do jogador.
    for (let bIdx = enemyBullets.length - 1; bIdx >= 0; bIdx--) {
      const eb = enemyBullets[bIdx];
      const bdx = eb.x - ax;
      const bdy = eb.y - ay;
      const cutRadius = hitRadius + (eb.radius ?? 6);
      if (bdx * bdx + bdy * bdy < cutRadius * cutRadius) {
        createHitParticles(eb.x, eb.y, '#f1c40f', 5);
        playSfx('parry_slice');
        enemyBullets.splice(bIdx, 1);
      }
    }

    const candLen = _axeCandidates.length;
    for (let k = 0; k < candLen; k++) {
      const e = enemies[_axeCandidates[k]];
      if (!e || (e.axeHitCd || 0) > 0 || e.isTargetable === false || (e.emergeTimer || 0) > 0) continue;
      if (e.isBoss && (e.actionState === 'SPAWN_INTRO' || e.isTargetable === false)) continue;
      if (e.isBossSubTarget && (!e.active || e.isTargetable === false || (e.parentBoss && (e.parentBoss.actionState === 'SPAWN_INTRO' || e.parentBoss.isTargetable === false)))) continue;

      const seg = distToSegment(e.x, e.y, player.x, player.y, ax, ay);
      const rSum = e.radius + hitRadius;

      if (seg.dist < rSum) {
        const isOuterZone = seg.t > 0.65;
        const baseDmgMult = isOuterZone ? 1.0 : 0.5;

        let dmg = player.damage * player.axeDamageMult * (player.evolvedAxe ? 1.6 : 1.2) * baseDmgMult;
        if (player.berserkTimer > 0) dmg *= 1.35;

        const isBossEntity = !!e.isBoss;
        const isSubTarget = !!e.isBossSubTarget;
        let isMeleeAdrenaline = false;

        if (isBossEntity || isSubTarget) {
          const bossRef = isBossEntity ? e : (e.parentBoss || e);
          const distToBoss = Math.hypot(player.x - bossRef.x, player.y - bossRef.y);
          if (distToBoss <= 130) {
            dmg *= 1.25;
            isMeleeAdrenaline = true;
          }
          if (e.isVulnerable) {
            dmg *= 1.25;
          }
          // Passiva Quebra-Pedras: Machado de Kragdor estraçalha Litocistos com dano dobrado (+100%)
          if (isSubTarget) {
            dmg *= 2.0;
            isMeleeAdrenaline = true;
          }
        }

        let isKaelExecute = false;
        if (selectedHeroKey === 'ROGUE' && e.maxHp && (e.hp / e.maxHp) < 0.35) {
          const isBossTarget = isBossEntity || isSubTarget || !!e.isMiniBoss;
          dmg *= isBossTarget ? 1.5 : 2.0;
          isKaelExecute = true;
        }

        if (e.acidStacks > 0) {
          dmg *= (1 + e.acidStacks * 0.06);
        }

        const isCrit = (player.invisTimer > 0) || (Math.random() < player.critChance);
        let finalDmg = isCrit ? dmg * player.critMult : dmg * (player.nonCritDamageMult || 1.0);
        if (player.executeBonus > 0 && e.maxHp && (e.hp / e.maxHp) < 0.30) {
          finalDmg *= (1 + player.executeBonus);
        }

        finalDmg = getBossPhaseDefeatDamage(e, finalDmg);

        e.hp -= finalDmg;
        e.hitFlash = 4;

        // Cura do Bárbaro Kragdor em Chefes e Hordas
        if (selectedHeroKey === 'BARBARIAN') {
          if (isOuterZone && (e.isBoss || e.isMiniBoss || e.isBossSubTarget)) {
            if ((player.axeBossHealCd || 0) <= 0) {
              player.axeBossHealCd = 36; // 0.6s em 60 FPS
              const healAmount = Math.max(1, Math.round(player.maxHp * 0.005));
              if (player.hp < player.maxHp) {
                player.hp = Math.min(player.maxHp, player.hp + healAmount);
                addDamageText(player.x, player.y, `+${healAmount} HP`, false, '#2ecc71');
              }
            }
          } else if (!e.isBoss && !e.isMiniBoss && !e.isBossSubTarget) {
            player.axeHitCount = (player.axeHitCount || 0) + 1;
            if (player.axeHitCount >= 18) {
              player.axeHitCount = 0;
              if (player.hp < player.maxHp) {
                player.hp = Math.min(player.maxHp, player.hp + 1);
                addDamageText(player.x, player.y, "+1 HP", false, '#2ecc71');
              }
            }
          }
        }

        const cdFrames = Math.max(6, Math.floor(18 / (currentSpinSpeed / 0.085)));
        e.axeHitCd = cdFrames;

        playSfx('axe_cleave');
        if (isCrit || isMeleeAdrenaline || isKaelExecute) playSfx('crit');
        
        const dmgColor = isMeleeAdrenaline ? '#f1c40f' : (isKaelExecute ? '#7c3aed' : (isOuterZone ? '#e67e22' : '#f39c12'));
        addDamageText(seg.closestX, seg.closestY, Math.round(finalDmg), isCrit || isMeleeAdrenaline || isKaelExecute, dmgColor);
        createHitParticles(seg.closestX, seg.closestY, isOuterZone ? '#e67e22' : '#d35400', isOuterZone ? 4 : 2);

        // Repulsão tangencial e radial suave amplificada pelo peso do personagem
        if (!e.isBossSubTarget) {
          const kbMult = player.knockbackDealt !== undefined ? player.knockbackDealt : 1.0;
          const bossResist = e.isFinalBoss ? 0.10 : ((e.bossId === 2 || e.bossId === 3) ? 0.10 : ((e.isBoss || e.isMiniBoss) ? 0.20 : (e.isElite ? 0.50 : 1.0)));
          if (isOuterZone) {
            const tanAng = angle + AXE_SPIN_DIRECTION * Math.PI * 0.5;
            const pushForce = (player.evolvedAxe ? 12 : 7) * (player.berserkTimer > 0 ? 1.6 : 1.0) * kbMult * bossResist;
            e.pushVx = (e.pushVx || 0) + Math.cos(tanAng) * pushForce;
            e.pushVy = (e.pushVy || 0) + Math.sin(tanAng) * pushForce;
          } else {
            const radAng = Math.atan2(e.y - player.y, e.x - player.x);
            const pushForce = (player.evolvedAxe ? 16 : 11) * (player.berserkTimer > 0 ? 1.5 : 1.0) * kbMult * bossResist;
            e.pushVx = (e.pushVx || 0) + Math.cos(radAng) * pushForce;
            e.pushVy = (e.pushVy || 0) + Math.sin(radAng) * pushForce;
          }
        }

        if (player.slowChance > 0 && Math.random() < player.slowChance) {
          applyFreeze(e);


        }

        if (e.isBoss && (e.hp / e.maxHp) < 0.45 && !e.isEnraged) {
          e.isEnraged = true;
          e.speed *= 1.35;
          triggerShake(15);
          playSfx('boss');
          addDamageText(e.x, e.y, "EM FÚRIA!", true, '#e74c3c');
        }
      }
    }
  }
}

export function fireWeapons() {
  if (enemies.length === 0) return;

  const weaponCount = player.weapons.length;
  const halfW = (cameraViewW || 960) / 2;
  const halfH = (cameraViewH || 640) / 2;
  const screenMargin = 20;

  for (let wIdx = 0; wIdx < weaponCount; wIdx++) {
    const w = player.weapons[wIdx];
    if (w.timer < w.cooldown) continue;

    let weaponRange = 320;
    if (w.type === 'POTION') weaponRange = 312;
    else if (w.type === 'HAMMER') weaponRange = player.evolvedHammer ? 140 : (90 + (w.count - 1) * 12);
    else if (w.type === 'SWORD') weaponRange = 300;
    else if (w.type === 'STAFF') weaponRange = 340;
    else if (w.type === 'AXE') continue;

    const rangeSq = weaponRange * weaponRange;

    // Mira Automática Zero-Alloc: rastreamento escalar do alvo sem alocar arrays ou chamar .sort()
    let bestEnemy = null;
    let bestSubTarget = null;
    let bestDistSq = rangeSq;
    let bestSubDistSq = rangeSq;

    const candidateIndices = getNeighborIndices(player.x, player.y, weaponRange);
    const candidateCount = candidateIndices.length;
    for (let k = 0; k < candidateCount; k++) {
      const e = enemies[candidateIndices[k]];
      if (!e || e.hp <= 0 || e.isTargetable === false || (e.emergeTimer || 0) > 0) continue;
      if (e.isBoss && (e.actionState === 'SPAWN_INTRO' || e.isTargetable === false)) continue;
      if (e.isBossSubTarget && (!e.active || e.isTargetable === false || (e.parentBoss && (e.parentBoss.actionState === 'SPAWN_INTRO' || e.parentBoss.isTargetable === false)))) continue;

      // Monstros comuns só podem se tornar alvos quando estiverem dentro da visão
      if (!e.isBoss && !e.isMiniBoss && !e.isBossSubTarget) {
        const offX = Math.abs(e.x - player.x);
        const offY = Math.abs(e.y - player.y);
        if (offX > halfW - screenMargin || offY > halfH - screenMargin) {
          continue;
        }
      }

      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dSq = dx * dx + dy * dy;

      if (dSq <= rangeSq) {
        if (e.isBossSubTarget) {
          if (dSq < bestSubDistSq) {
            bestSubDistSq = dSq;
            bestSubTarget = e;
          }
        } else if (!bestSubTarget && dSq < bestDistSq) {
          bestDistSq = dSq;
          bestEnemy = e;
        }
      }
    }

    const closestEnemy = bestSubTarget || bestEnemy;
    if (!closestEnemy) continue;

    w.timer = 0;

    if (w.type === 'SWORD') {
      playSfx('blade_throw');
      const count = player.evolvedSword ? 6 : w.count;
      const baseAngle = Math.atan2(closestEnemy.y - player.y, closestEnemy.x - player.x);

      for (let i = 0; i < count; i++) {
        const spread = count > 1 ? (i - (count - 1) / 2) * 0.22 : 0;
        const angle = baseAngle + spread;

        bullets.push({
          type: 'SWORD',
          x: player.x,
          y: player.y,
          vx: Math.cos(angle) * (player.evolvedSword ? 12 : 9.2),
          vy: Math.sin(angle) * (player.evolvedSword ? 12 : 9.2),
          angle: angle,
          radius: player.evolvedSword ? 9 : 5,
          damage: player.damage * w.damageMult * (player.evolvedSword ? 1.6 : 1.1),
          life: player.evolvedSword ? 68 : 52,
          piercing: player.evolvedSword ? 4 : 2,
          isEvolved: player.evolvedSword,
          isSpectral: player.invisTimer > 0,
          trail: []
        });
      }
    } else if (w.type === 'STAFF') {
      playSfx('fire_cast');
      const count = player.evolvedStaff ? Math.max(w.count, 4) : w.count;
      player.facing = closestEnemy.x >= player.x ? 1 : -1;
      player.staffCastTimer = 11;

      // Flash da coroa do cajado na ponta do lançamento
      createHitParticles(player.x + player.facing * 14, player.y - 5, '#ffffff', 5);
      createHitParticles(player.x + player.facing * 14, player.y - 5, '#f1c40f', 7);

      const baseAngle = Math.atan2(closestEnemy.y - player.y, closestEnemy.x - player.x);

      for (let i = 0; i < count; i++) {
        const spread = count > 1 ? (i - (count - 1) / 2) * 0.18 : 0;
        const angle = baseAngle + spread;

        bullets.push({
          type: 'STAFF',
          x: player.x,
          y: player.y,
          vx: Math.cos(angle) * (player.evolvedStaff ? 12.0 : 10.2),
          vy: Math.sin(angle) * (player.evolvedStaff ? 12.0 : 10.2),
          angle: angle,
          radius: player.evolvedStaff ? 12 : 9,
          damage: player.damage * w.damageMult * (player.evolvedStaff ? 1.7 : 1.25),
          life: 55,
          piercing: (player.staffPierceBonus || 0) + (player.evolvedStaff ? 5 : 2),
          hitCount: 0,
          isEvolved: player.evolvedStaff,
          trail: []
        });
      }
    } else if (w.type === 'POTION') {
      playSfx('potion_throw');
      player.potionThrowTimer = 16;
      
      const rawDx = closestEnemy.x - player.x;
      const rawDy = closestEnemy.y - player.y;
      const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
      const flightFrames = Math.max(18, Math.min(42, Math.floor(dist / 7.2)));

      const isBossOrSub = !!(closestEnemy.isBoss || closestEnemy.isMiniBoss || closestEnemy.isBossSubTarget);
      const isStationaryOrSpecial = isBossOrSub || !closestEnemy.speed || closestEnemy.isVulnerable;
      
      let targetX = closestEnemy.x;
      let targetY = closestEnemy.y;

      if (!isStationaryOrSpecial) {
        const angleToPlayer = Math.atan2(player.y - closestEnemy.y, player.x - closestEnemy.x);
        const enemyCurSpeed = closestEnemy.speed * (closestEnemy.slowTimer > 0 ? (1 - (closestEnemy.slowFactor || 0.5)) : 1.0);
        const leadDist = Math.min(enemyCurSpeed * flightFrames * 0.88, dist * 0.75);
        targetX += Math.cos(angleToPlayer) * leadDist;
        targetY += Math.sin(angleToPlayer) * leadDist;
      }

      const dx = targetX - player.x;
      const dy = targetY - player.y;
      const count = player.evolvedPotion ? Math.max(w.count, 5) : w.count;
      const potencyMult = 1 + (w.potencyCount || 0) * 0.05;
      const gravity = 0.24;

      // Dano base de impacto químico suave (alquimia foca em veneno e DoT, não em impacto físico maciço)
      const basePotionDmg = player.damage * w.damageMult * (player.evolvedPotion ? 1.0 : 0.65);

      for (let i = 0; i < count; i++) {
        const arcOffset = i * 0.35;
        // Anti-Shotgun: 1º frasco causa 100% de impacto; frascos adicionais na mesma salva causam 25% de respingo (40% contra chefes)
        const volleyMult = i === 0 ? 1.0 : (isBossOrSub ? 0.40 : 0.25);

        bullets.push({
          type: 'POTION',
          x: player.x,
          y: player.y,
          vx: dx / flightFrames,
          vy: (dy / flightFrames) - (0.5 * gravity * flightFrames) - arcOffset,
          gravity: gravity,
          targetX: targetX,
          targetY: targetY,
          radius: 8,
          damage: basePotionDmg * volleyMult,
          life: flightFrames,
          angle: i * 0.4,
          puddleRadius: 42 * potencyMult,
          puddleDuration: player.evolvedPotion ? 340 : 280,
          isEvolved: player.evolvedPotion,
          trail: []
        });
      }
    } else if (w.type === 'HAMMER') {
      const targetAngle = Math.atan2(closestEnemy.y - player.y, closestEnemy.x - player.x);
      player.facing = closestEnemy.x >= player.x ? 1 : -1;
      player.hammerAngle = targetAngle;
      const slamRadius = (player.evolvedHammer ? 96 : 76) + (w.count - 1) * 12;

      // Inicia ciclo de 26 frames: windup (8 frames) -> impacto telúrico -> fendas tectônicas e recuperação
      bullets.push({
        type: 'HAMMER_SLAM',
        playerRef: player,
        x: player.x,
        y: player.y,
        vx: 0,
        vy: 0,
        angle: targetAngle,
        radius: slamRadius,
        damage: player.damage * w.damageMult * (player.evolvedHammer ? 2.8 : 2.0),
        life: 26,
        maxLife: 26,
        impactFrame: 8,
        hasImpacted: false,
        hitEnemies: new Set(),
        isEvolved: player.evolvedHammer,
        count: w.count || 1
      });
    }
  }
}
