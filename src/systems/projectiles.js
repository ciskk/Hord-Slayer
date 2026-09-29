import { t as matchText } from '../i18n/index.js';
/**
 * src/systems/projectiles.js
 * Subsistema Balístico, Poças Ambientais e Paridade de Dano Melee (Fase 3 e 5).
 */
import { player, selectedHeroKey } from '../entities/player.js';
import { enemies, bullets, enemyBullets, acidPuddles, bossShockwaves, MAX_CONCURRENT_ENEMY_BULLETS, canSpawnEnemyBullet, activeBoss } from '../state/collections.js';
import { triggerShake } from '../state/gameState.js';
import { setLastAttackerInfo } from '../state/events.js';
import { addDamageText, createHitParticles, applyFireBurn, applyFreeze } from './combat.js';
import { playSfx, triggerHaptic } from '../core/audio.js';
import { forEachNeighborIndex } from '../core/spatialGrid.js';
import { addGroundCrater, updateGroundCraters } from '../render/groundCracks.js';
import { addKaelHitFissure } from '../render/kaelUlt.js';
import { triggerDeath } from './ui.js';
import { getBossPhaseDefeatDamage } from './devtools.js';
import { getGraphicsProfile } from '../core/responsive.js';
import { registerPersistentArea, updatePersistentAreas, findDissolvingArea } from './persistentAreas.js';

export { bullets, enemyBullets, acidPuddles, MAX_CONCURRENT_ENEMY_BULLETS, canSpawnEnemyBullet };

/**
 * Atualiza projéteis do jogador e dos inimigos, aplicando regras de adrenalina melee (+25% se <= 130px).
 */
export function updateProjectiles(dt) {
  // Contexto de Culling Radial para a Arena do Boss Final (Fase 3)
  const isFinalBoss = activeBoss && (activeBoss.isFinalBoss || activeBoss.arenaCenterX !== undefined);
  const arenaCullDistSq = isFinalBoss ? ((activeBoss.arenaRadius || 620) + 40) ** 2 : 0;
  const acx = isFinalBoss ? activeBoss.arenaCenterX : 0;
  const acy = isFinalBoss ? activeBoss.arenaCenterY : 0;

  // 1. Projéteis do Jogador
  let bulletWriteIdx = 0;
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    b.life -= dt;

    if (b.type === 'POTION' && b.gravity) {
      b.vy = (b.vy || 0) + b.gravity * dt;
      b.angle = (b.angle || 0) + 0.18 * dt;
      if (!b.trail) b.trail = [];
      const pt = b.trail.length >= 5 ? b.trail.pop() : {};
      pt.x = b.x;
      pt.y = b.y;
      b.trail.unshift(pt);
    } else if (b.type === 'STAFF') {
      if (!b.trail) b.trail = [];
      // The current projectile is the first rendered point. Keep the original
      // history in full quality; shrink existing trails immediately on switch.
      const maxTrail = Math.min(b.isEvolved ? 12 : 9, getGraphicsProfile().staffTrailPoints - 1);
      if (b.trail.length > maxTrail) b.trail.length = maxTrail;
      const pt = b.trail.length >= maxTrail ? b.trail.pop() : {};
      pt.x = b.x;
      pt.y = b.y;
      b.trail.unshift(pt);
    } else if (b.type === 'SWORD') {
      if (!b.trail) b.trail = [];
      const pt = b.trail.length >= 5 ? b.trail.pop() : {};
      pt.x = b.x;
      pt.y = b.y;
      b.trail.unshift(pt);
    } else if (b.type === 'HAMMER_SLAM') {
      // Durante a fase de preparação (windup), o martelo acompanha o cavaleiro em tempo real
      if (b.playerRef && !b.hasImpacted) {
        b.x = b.playerRef.x;
        b.y = b.playerRef.y;
      }
    }

    b.x += (b.vx || 0) * dt;
    b.y += (b.vy || 0) * dt;

    // Culling Radial Restrito: Descarte imediato de projéteis fora da arena do Boss Final
    if (isFinalBoss) {
      const bdx = b.x - acx;
      const bdy = b.y - acy;
      if (bdx * bdx + bdy * bdy > arenaCullDistSq) {
        continue;
      }
    }

    if (b.life <= 0) {
      if (b.type === 'POTION') {
        const puddleRadius = (b.puddleRadius || 42) * (b.isEvolved ? 1.45 : 1.0);
        const puddleLife = b.puddleDuration || Math.round(340 / 1.5);

        // Impacto do ataque ao atingir o solo (dano de impacto 40% menor já calculado em b.damage)
        forEachNeighborIndex(b.x, b.y, puddleRadius + 45, (candIdx) => {
          const e = enemies[candIdx];
          if (!e || e.hp <= 0 || e.isTargetable === false || (e.emergeTimer || 0) > 0) return;
          if (e.isBoss && (e.actionState === 'SPAWN_INTRO' || e.isTargetable === false)) return;
          if (e.isBossSubTarget && (!e.active || e.isTargetable === false || (e.parentBoss && (e.parentBoss.actionState === 'SPAWN_INTRO' || e.parentBoss.isTargetable === false)))) return;
          const dx = e.x - b.x;
          const dy = e.y - b.y;
          if (dx * dx + dy * dy <= (puddleRadius + e.radius) ** 2) {
            const isCrit = (player.invisTimer > 0) || (Math.random() < player.critChance);
            let impactDmg = (b.damage || 20) * (isCrit ? player.critMult : (player.nonCritDamageMult || 1.0));
            let isKaelExecute = false;
            if (selectedHeroKey === 'ROGUE' && e.maxHp && (e.hp / e.maxHp) < 0.35) {
              const isBossTarget = !!(e.isBoss || e.isMiniBoss || e.isBossSubTarget);
              impactDmg *= isBossTarget ? 1.5 : 2.0;
              isKaelExecute = true;
            }
            if (player.executeBonus > 0 && e.maxHp && (e.hp / e.maxHp) < 0.30) {
              impactDmg *= (1 + player.executeBonus);
            }
            // Passiva de Corrosão da Valéria (+6% por stack até +30%)
            if (e.acidStacks > 0) {
              impactDmg *= (1 + e.acidStacks * 0.06);
            }
            if (e.baseType === 'LITOCISTO') {
              impactDmg *= 4.0;
            } else if ((e.isBoss || e.isMiniBoss) && !e.isBossSubTarget) {
              // Decomposição Cáustica em Chefes: fator 10/9 (1.1111x) que, somado à base 1.35x, atinge exatamente 2.0x do impacto original (50% mais fácil)
              impactDmg *= (10 / 9);
            }
            impactDmg = getBossPhaseDefeatDamage(e, impactDmg);
            e.hp -= impactDmg;
            e.hitFlash = 4;
            addDamageText(e.x, e.y, Math.round(impactDmg), isCrit || isKaelExecute, isKaelExecute ? '#7c3aed' : (isCrit ? '#f1c40f' : (b.isEvolved ? '#00cec9' : '#2ecc71')));
            createHitParticles(e.x, e.y, isKaelExecute ? '#7c3aed' : (b.isEvolved ? '#00cec9' : '#2ecc71'), isKaelExecute ? 5 : 3);

            // FIXAÇÃO CÁUSTICA (Caminhos 1 e 3): O frasco quebra diretamente no alvo, aplicando veneno aderente
            e.acidStacks = Math.min(5, (e.acidStacks || 0) + 1);
            e.acidStackTimer = 200;
            e.acidBurnTimer = Math.max(e.acidBurnTimer || 0, 180);
            if (b.isEvolved) e.acidBurnEvolved = true;
          }
        });

        registerPersistentArea(acidPuddles, {
          x: b.x,
          y: b.y,
          radius: puddleRadius,
          damage: (b.damage || 20) * 0.40,
          life: puddleLife,
          maxLife: puddleLife,
          isAlchemist: true,
          isEvolved: !!b.isEvolved
        });
        playSfx('potion_shatter');
        createHitParticles(b.x, b.y, b.isEvolved ? '#d6a2e8' : '#9b59b6', 6);
        triggerShake(3);
      }
      continue;
    }

    // Poções viajam em arco balístico aéreo e não colidem com inimigos no trajeto
    if (b.type === 'POTION') {
      bullets[bulletWriteIdx++] = b;
      continue;
    }

    // Martelo Sagrado de Sir Roland: sincronização de windup e impacto sísmico
    if (b.type === 'HAMMER_SLAM') {
      const slamProgress = 1 - (b.life / b.maxLife);
      // Durante o windup (frames 0 a 8), o martelo ainda está no ar sendo erguido
      if (slamProgress < 0.32) {
        bullets[bulletWriteIdx++] = b;
        continue;
      }

      // No instante exato do impacto com o solo (Frame 8):
      if (!b.hasImpacted) {
        b.hasImpacted = true;
        const strikeAngle = b.angle || 0;
        const forwardOffset = 22;
        if (b.playerRef) {
          b.x = b.playerRef.x + Math.cos(strikeAngle) * forwardOffset;
          b.y = b.playerRef.y + Math.sin(strikeAngle) * forwardOffset;
        }

        playSfx('hammer_slam');
        triggerShake(b.isEvolved ? 6.5 : 4.5);
        triggerHaptic('heavy');

        // Cumprimento da Lore: Anulação Real de Projéteis Inimigos no Raio Sísmico 360°
        const cancelRadiusSq = (b.radius + 15) * (b.radius + 15);
        for (let k = 0; k < enemyBullets.length; k++) {
          const eb = enemyBullets[k];
          if (eb.isBossProjectile || eb._destroyed) continue; // Tiros de chefe são resilientes
          const edx = eb.x - b.x;
          const edy = eb.y - b.y;
          if (edx * edx + edy * edy <= cancelRadiusSq) {
            createHitParticles(eb.x, eb.y, '#111111', 3);
            createHitParticles(eb.x, eb.y, '#ffffff', 2);
            eb._destroyed = true;
          }
        }

        // Ondas de partículas minerais telúricas escuras (sem cores mágicas saturadas)
        createHitParticles(b.x, b.y, '#0a0a0a', b.isEvolved ? 8 : 6);
        createHitParticles(b.x, b.y, '#2c3e50', b.isEvolved ? 5 : 4);

        // Gera ou re-energiza a cratera e fendas geológicas no solo (anti-stacking por proximidade)
        addGroundCrater(b.x, b.y, strikeAngle, b.radius || 50, b.count || 1, !!b.isEvolved, b.damage || 45);
      }
    }

    const isHammerSlam = (b.type === 'HAMMER_SLAM');
    const hammerReach = isHammerSlam ? (b.isEvolved ? 128 : (78 + ((b.count || 1) - 1) * 12)) : 0;
    const bRadius = isHammerSlam ? Math.max(b.radius || 50, hammerReach) : (b.radius || 6);
    const slamCosA = (isHammerSlam && hammerReach > 0) ? Math.cos(b.angle || 0) : 0;
    const slamSinA = (isHammerSlam && hammerReach > 0) ? Math.sin(b.angle || 0) : 0;

    let bulletDead = false;
    forEachNeighborIndex(b.x, b.y, bRadius + 45, (candIdx) => {
      const e = enemies[candIdx];
      if (!e || e.hp <= 0 || e.isTargetable === false || (e.emergeTimer || 0) > 0) return;
      if (e.isBoss && (e.mistState === 'DASHING' || e.actionState === 'SPAWN_INTRO' || e.isTargetable === false)) return;
      if (e.isBossSubTarget && (!e.active || e.isTargetable === false || (e.parentBoss && (e.parentBoss.actionState === 'SPAWN_INTRO' || e.parentBoss.isTargetable === false)))) return;

      const dx = e.x - b.x;
      const dy = e.y - b.y;
      const eRadius = e.radius || 14;
      const rSum = (b.radius || 6) + eRadius;

      let isHit = false;
      let isSweetSpot = false;

      if (isHammerSlam) {
        // 1. Checagem de raio circular base
        if (dx * dx + dy * dy < rSum * rSum) {
          isHit = true;
        }
        // 2. Checagem ao longo do leque aberto de fissuras direcionais (constantes trigonométricas pré-calculadas)
        if (!isHit && hammerReach > 0) {
          const proj = dx * slamCosA + dy * slamSinA;
          if (proj > 0 && proj <= hammerReach + eRadius) {
            const perp = Math.abs(-dx * slamSinA + dy * slamCosA);
            const maxPerp = Math.max(30, 20 + proj * 0.95) + eRadius;
            if (perp <= maxPerp) {
              isHit = true;
            }
          }
        }
        // 3. Sweet Spot na Base Esmagada (Ponto de Impacto Físico do Martelo):
        const epicenterR = (b.isEvolved ? 32 : 24) + ((b.count || 1) - 1) * 3 + eRadius;
        if (dx * dx + dy * dy <= epicenterR * epicenterR) {
          isSweetSpot = true;
        }
      } else {
        isHit = (dx * dx + dy * dy < rSum * rSum);
      }

      if (isHit) {
        if (!b.hitEnemies) b.hitEnemies = new Set();
        if (b.hitEnemies.has(e)) return;
        b.hitEnemies.add(e);

        const isCrit = (player.invisTimer > 0) || (Math.random() < player.critChance);
        let finalDmg = (b.damage || 20) * (isCrit ? player.critMult : (player.nonCritDamageMult || 1.0));

        // Impacto esmagador brutal na base: +35% de dano adicional!
        if (isSweetSpot) {
          finalDmg *= 1.35;
          createHitParticles(e.x, e.y, '#ffffff', 3);
        }

        const isBossEntity = !!e.isBoss;
        const isSubTarget = !!e.isBossSubTarget;
        let isMeleeAdrenaline = false;

        if (isBossEntity || isSubTarget) {
          const bossRef = isBossEntity ? e : (e.parentBoss || e);
          const distToBoss = Math.hypot(player.x - bossRef.x, player.y - bossRef.y);

          // BÔNUS DE ADRENALINA MELEE (+25% de dano se dist <= 130px)
          if (distToBoss <= 130) {
            finalDmg *= 1.25;
            isMeleeAdrenaline = true;
          }

          if (e.isVulnerable || (bossRef && bossRef.isVulnerable)) {
            finalDmg *= 1.25;
          }

          // Passiva Quebra-Pedras: Martelo Sagrado estraçalha Litocistos com dano dobrado (+100%)
          if (b.type === 'HAMMER_SLAM' && isSubTarget) {
            finalDmg *= 2.0;
            isMeleeAdrenaline = true;
          }
        }

        // Passiva de Kael: 2.0x de dano em oponentes com menos de 35% de vida (1.5x contra chefes)
        let isKaelExecute = false;
        if (selectedHeroKey === 'ROGUE' && e.maxHp && (e.hp / e.maxHp) < 0.35) {
          const isBossTarget = isBossEntity || isSubTarget || !!e.isMiniBoss;
          finalDmg *= isBossTarget ? 1.5 : 2.0;
          isKaelExecute = true;
        }
        if (player.executeBonus > 0 && e.maxHp && (e.hp / e.maxHp) < 0.30) {
          finalDmg *= (1 + player.executeBonus);
        }

        // Passiva de Corrosão da Valéria (+6% por stack até +30%)
        if (e.acidStacks > 0) {
          finalDmg *= (1 + e.acidStacks * 0.06);
        }

        // Bloqueio Frontal Ativo do Guardião Blindado (SHIELDED) e Centurião da Guarda (PHALANX_LEADER)
        let isShieldBlocked = false;
        if ((e.baseType === 'SHIELDED' || e.baseType === 'PHALANX_LEADER' || e.hasFrontalShield) && (!e.shieldStaggerTimer || e.shieldStaggerTimer <= 0)) {
          // Determina a direção de onde o ataque está vindo em relação ao monstro
          const attackAngle = (b.vx !== undefined && b.vy !== undefined && (b.vx !== 0 || b.vy !== 0))
            ? Math.atan2(-b.vy, -b.vx)
            : Math.atan2(player.y - e.y, player.x - e.x);

          const facingAngle = (e.facing === -1) ? Math.PI : 0;
          let angleDiff = Math.abs(attackAngle - facingAngle);
          while (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

          // Escudo cobre apenas um cone frontal estrito (~63° para cada lado, total ~126° frontal)
          // Qualquer ataque pelas costas, flancos ou eixos verticais causa dano 100% limpo!
          const isFrontalHit = angleDiff <= Math.PI * 0.35;
          if (isFrontalHit) {
            isShieldBlocked = true;
            // Redução de dano equilibrada: ~45% a 50% de absorção (em vez dos antigos 75% e 85%)
            const blockDmgFactor = e.baseType === 'PHALANX_LEADER' ? 0.50 : 0.55;
            finalDmg *= blockDmgFactor;
            e.shieldBlockFlash = 8;
            createHitParticles(e.x + (e.facing || 1) * e.radius * 0.8, e.y, e.baseType === 'PHALANX_LEADER' ? '#f1c40f' : '#74b9ff', 4);

            // Quebra de Guarda com impacto pesado (Martelo)
            if (b.type === 'HAMMER_SLAM') {
              e.shieldStaggerTimer = 45; // 0.75s de guarda aberta
              addDamageText(e.x, e.y - 12, matchText('match.combat.guard'), true, '#e67e22');
              triggerShake(4);
            }
          }
        }

        finalDmg = getBossPhaseDefeatDamage(e, finalDmg);

        e.hp -= finalDmg;
        e.hitFlash = 4;

        // Knockback Suave: Golem e Escudeiro Bloqueador resistem 75%; Elites resistem 50%; Chefes e Mini-Chefes resistem 80%; Chefe Final possui hiperarmadura absoluta (0%)
        if (!e.isBossSubTarget) {
          const impactAngle = b.angle !== undefined ? b.angle : Math.atan2(b.vy || 0, b.vx || 0);
          // Knockback balanceado: STAFF (Ignis) agora possui o mesmo empurrão base de SWORD (Kael) = 4.5
          const baseWeaponPush = (b.type === 'HAMMER_SLAM' ? 14.0 : 4.5);
          const bossResist = e.isFinalBoss ? 0.00 : ((e.bossId === 2 || e.bossId === 3) ? 0.10 : ((e.isBoss || e.isMiniBoss) ? 0.20 : (e.baseType === 'GOLEM' ? 0.25 : (isShieldBlocked ? 0.25 : (e.isElite ? 0.50 : 1.0)))));
          const totalPush = baseWeaponPush * (player.knockbackDealt !== undefined ? player.knockbackDealt : 1.0) * bossResist;
          e.pushVx = (e.pushVx || 0) + Math.cos(impactAngle) * totalPush;
          e.pushVy = (e.pushVy || 0) + Math.sin(impactAngle) * totalPush;
        }

        if (b.type === 'HAMMER_SLAM') {
          playSfx('hammer_hit');
          if (isCrit || isMeleeAdrenaline || isKaelExecute) playSfx('crit');
        } else if (b.type === 'STAFF') {
          playSfx('fire_hit');
          if (isCrit || isMeleeAdrenaline || isKaelExecute) playSfx('crit');
          const burnDps = (player.damage || 45) * (player.evolvedStaff ? 0.50 : 0.35);
          applyFireBurn(e, 180, burnDps, isCrit);
        } else if (b.type === 'SWORD') {
          playSfx('blade_hit');
          if (isCrit || isMeleeAdrenaline || isKaelExecute) playSfx('crit');
          if (selectedHeroKey === 'MAGE' && isCrit) {
            applyFireBurn(e, 180, (player.damage || 45) * 0.35, true);
          }
          if (b.isSpectral || player.invisTimer > 0) {
            addKaelHitFissure(e.x, e.y, b.angle || 0);
            createHitParticles(b.x, b.y, '#f3e8ff', 3);
            createHitParticles(b.x, b.y, '#38bdf8', 3);
          }
        } else {
          if (isCrit || isMeleeAdrenaline || isKaelExecute) {
            playSfx('crit');
            triggerHaptic('light');
            if (selectedHeroKey === 'MAGE' && isCrit) {
              applyFireBurn(e, 180, (player.damage || 45) * 0.35, true);
            }
          } else {
            playSfx('hit');
          }
        }

        let dmgTextColor = '#ffffff';
        if (isShieldBlocked) {
          dmgTextColor = '#74b9ff';
        } else if (isMeleeAdrenaline) {
          dmgTextColor = '#f1c40f';
        } else if (isKaelExecute) {
          dmgTextColor = '#7c3aed';
        } else if (isCrit) {
          dmgTextColor = '#f39c12';
        } else if (b.color) {
          dmgTextColor = b.color;
        } else {
          dmgTextColor = isBossEntity ? '#e74c3c' : '#ffffff';
        }

        addDamageText(e.x, e.y, Math.round(finalDmg), isCrit || isMeleeAdrenaline || isKaelExecute, dmgTextColor);
        createHitParticles(b.x, b.y, isShieldBlocked ? '#74b9ff' : (isKaelExecute ? '#7c3aed' : (isMeleeAdrenaline ? '#f1c40f' : (b.color || '#3498db'))), isCrit || isKaelExecute ? 5 : 3);

        if (player.slowChance > 0 && Math.random() < player.slowChance) {
          applyFreeze(e);
        }

        if (b.type !== 'HAMMER_SLAM') {
          b.piercing = (b.piercing || 1) - 1;
          if (b.piercing <= 0) {
            bulletDead = true;
            return false;
          }
        }
      }
    });

    if (!bulletDead) {
      bullets[bulletWriteIdx++] = b;
    }
  }
  bullets.length = bulletWriteIdx;

  // 2. Projéteis Inimigos
  let ebWriteIdx = 0;
  for (let i = 0; i < enemyBullets.length; i++) {
    const eb = enemyBullets[i];
    if (eb._destroyed) {
      continue;
    }
    eb.life -= dt;

    // Rastreamento Suave para SHADOW_ORB (Cultista)
    if (eb.bulletType === 'SHADOW_ORB' && player.invisTimer <= 0) {
      const angleToPlayer = Math.atan2(player.y - eb.y, player.x - eb.x);
      const curAngle = Math.atan2(eb.vy, eb.vx);
      let diff = angleToPlayer - curAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      const turnSpeed = 0.038 * dt;
      const newAngle = curAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed);
      const speed = Math.hypot(eb.vx, eb.vy);
      eb.vx = Math.cos(newAngle) * speed;
      eb.vy = Math.sin(newAngle) * speed;
    }

    const previousX = eb.x;
    const previousY = eb.y;
    eb.x += eb.vx * dt;
    eb.y += eb.vy * dt;
    const dissolvingArea = findDissolvingArea(eb, previousX, previousY, acidPuddles);
    if (dissolvingArea) {
      createHitParticles(eb.x, eb.y, dissolvingArea.isEvolved ? '#81ecec' : '#a55eea', 4);
      continue;
    }

    // Culling Radial Restrito: Descarte imediato de projéteis inimigos fora da arena do Boss Final
    if (isFinalBoss) {
      const ebdx = eb.x - acx;
      const ebdy = eb.y - acy;
      if (ebdx * ebdx + ebdy * ebdy > arenaCullDistSq) {
        continue;
      }
    }

    if (eb.life <= 0) {
      if (eb.isWebCocoon) {
        registerPersistentArea(acidPuddles, {
          x: eb.x,
          y: eb.y,
          radius: 38,
          life: 240,
          maxLife: 240,
          isCaustic: true,
          isWeb: true,
          isFire: false
        });
        playSfx('acid');
        createHitParticles(eb.x, eb.y, '#b2bec3', 8);
      } else if (eb.isBoulder || eb.bulletType === 'BOULDER') {
        bossShockwaves.push({
          x: eb.x,
          y: eb.y,
          radius: 12,
          maxRadius: 65,
          speed: 4.5,
          damage: eb.damage || 35,
          hitPlayer: false,
          colorRgb: '211, 84, 0'
        });
        addGroundCrater(eb.x, eb.y, 0, 45, 1, false, eb.damage || 35);
        playSfx('hammer_slam');
        triggerShake(6);
        triggerHaptic('heavy');
        createHitParticles(eb.x, eb.y, '#d35400', 16);
        createHitParticles(eb.x, eb.y, '#f1c40f', 8);
      }
      continue;
    }

    const pdx = player.x - eb.x;
    const pdy = player.y - eb.y;
    const hitRadius = (player.radius || 14) + (eb.radius || 6);

    const isInvulnerable = eb.isBossProjectile ? (player.bossIFrames > 0) : (player.iFrames > 0);
    if (!isInvulnerable && (pdx * pdx + pdy * pdy) < hitRadius * hitRadius) {
      let finalEbDamage = eb.damage;
      if (selectedHeroKey === 'KNIGHT') finalEbDamage = Math.round(finalEbDamage * 0.80);
      if (player.armor > 0) finalEbDamage = Math.max(1, finalEbDamage - player.armor);
      
      const projName = eb.isBoulder ? 'Rocha Vulcânica' : (eb.bulletType === 'BASALT_LANCE' ? 'Salva de Basalto' : (eb.isBossProjectile ? 'Projétil de Chefe' : (eb.bulletType === 'SHADOW_ORB' ? 'Orbe Sombrio' : (eb.isHook ? 'Corrente do Flagelador' : 'Projétil Profano'))));
      const projCat = eb.isBossProjectile ? 'BOSS' : (eb.isMiniBoss ? 'MINIBOSS' : 'PROJECTILE');
      setLastAttackerInfo({
        name: eb.sourceName || projName,
        category: projCat,
        attackName: projName,
        damage: Math.round(finalEbDamage),
        color: eb.color || '#9b59b6',
        enemyType: eb.enemyType || null,
        tacticTip: "Mantenha esquiva circular constante para que trajetórias balísticas e projéteis teleguiados errem o alvo."
      });

      player.hp -= finalEbDamage;
      
      if (eb.isBossProjectile) {
        player.bossIFrames = 16; // Janela menor para não cancelar telégrafos subsequentes
      } else {
        player.iFrames = 24;
      }
      
      triggerShake(6);
      playSfx('hit');
      triggerHaptic('medium');

      const col = eb.color || (eb.bulletType === 'SHADOW_ORB' ? '#9b59b6' : '#e74c3c');
      addDamageText(player.x, player.y, `-${finalEbDamage}`, false, col);
      createHitParticles(player.x, player.y, col, 5);

      const hasSuperArmor = (player.dashDuration > 0) || (player.ignisDashDuration > 0) || (player.invisTimer > 0);
      if (!hasSuperArmor) {
        if (eb.isHook && eb.parentX !== undefined) {
          const pullAng = Math.atan2(eb.parentY - player.y, eb.parentX - player.x);
          player.pushVx = Math.cos(pullAng) * 12;
          player.pushVy = Math.sin(pullAng) * 12;
          addDamageText(player.x, player.y - 12, matchText('match.combat.pulled'), false, '#e74c3c');
        } else {
          const bulletAng = Math.atan2(eb.vy || (player.y - eb.y), eb.vx || (player.x - eb.x));
          const bulletPush = 6.5 * (player.knockbackReceived !== undefined ? player.knockbackReceived : 1.0);
          player.pushVx = Math.cos(bulletAng) * bulletPush;
          player.pushVy = Math.sin(bulletAng) * bulletPush;
        }
      }

      if (eb.isWebCocoon) {
        registerPersistentArea(acidPuddles, {
          x: player.x,
          y: player.y,
          radius: 38,
          life: 240,
          maxLife: 240,
          isCaustic: true,
          isWeb: true,
          isFire: false
        });
        createHitParticles(player.x, player.y, '#b2bec3', 10);
      }

      if (player.hp <= 0) {
        player.hp = 0;
        triggerDeath();
        for (let r = i + 1; r < enemyBullets.length; r++) {
          if (!enemyBullets[r]._destroyed) enemyBullets[ebWriteIdx++] = enemyBullets[r];
        }
        enemyBullets.length = ebWriteIdx;
        return;
      }

      continue;
    }

    enemyBullets[ebWriteIdx++] = eb;
  }
  enemyBullets.length = ebWriteIdx;
}

// Dano e debuffs usam a mesma cobertura espacial; o envelhecimento e o
// contato do jogador continuam usando o tempo de cada callback.
export function updateAcidPuddles(dt) {
  updatePersistentAreas(dt, {
    areas: acidPuddles, enemies, player, selectedHeroKey,
    effects: {
      damageText: addDamageText,
      hitParticles: createHitParticles,
      fireBurn: applyFireBurn,
      heal(amount) {
        addDamageText(player.x, player.y, '+' + amount, false, '#a29bfe');
        createHitParticles(player.x, player.y, '#d6a2e8', 2);
      },
      playerHazard(p, damage) {
        const color = p.isCaustic ? '#00d2d3' : '#2ecc71';
        setLastAttackerInfo({ name: p.isCaustic ? 'Miasma Cáustico' : 'Poça de Ácido',
          category: 'HAZARD', attackName: 'Corrosão Ácida', damage, color,
          tacticTip: 'Evite transitar sobre fluidos tóxicos e poças corrosivas depositadas por rastejadores e chefes.' });
        triggerShake(2);
        playSfx('acid');
        addDamageText(player.x, player.y, '-' + damage, false, color);
        createHitParticles(player.x, player.y, color, 3);
      }
    }
  });
  if (player.hp <= 0) { player.hp = 0; triggerDeath(); return; }
  updateGroundCraters(dt);
}
