import { t as matchText } from '../i18n/index.js';
/**
 * src/systems/bossHazards.js
 * Subsistema de Perigos de Arena e Mecânicas de Combate dos Chefes:
 * - Ondas de Choque Radiais (Expansão, Knockback, Dano e Screen Shake)
 * - Telegrafias de Perigo e Pavios (Gêiseres de Sangue, Clivagem Dimensional, Fraturas e Meteoros)
 * - Projéteis Balísticos e Homing dos Chefes (Foices Giratórias, Esferas Monolíticas)
 */
import { playSfx, triggerHaptic } from '../core/audio.js';
import { triggerDeath } from './ui.js';
import { addDamageText, createHitParticles } from './combat.js';
import { setLastAttackerInfo } from '../state/events.js';

/**
 * Aplica dano de perigo de chefe ao jogador com mitigação passiva de classe e One-Shot Protection (OSP).
 */
export function applyHazardDamage(player, rawDamage, selectedHeroKey, defaultIFrames = 20) {
  let finalDmg = rawDamage || 0;
  if (selectedHeroKey === 'KNIGHT') finalDmg = Math.round(finalDmg * 0.80);
  const playerMaxHp = player.maxHp || 100;
  let ospTriggered = false;
  if (player.hp / playerMaxHp >= 0.90 && finalDmg >= player.hp) {
    finalDmg = Math.floor(playerMaxHp * 0.80);
    ospTriggered = true;
  }
  // Barreira Química (Shield de Valéria)
  if (player.tempShield && player.tempShield > 0) {
    const absorb = Math.min(player.tempShield, finalDmg);
    player.tempShield -= absorb;
    finalDmg -= absorb;
    addDamageText(player.x, player.y - 35, matchText('match.combat.shield', { amount: absorb }), true, '#a29bfe');
    if (player.tempShield <= 0) player.tempShieldTimer = 0;
  }

  player.hp -= finalDmg;
  player.bossIFrames = ospTriggered ? 36 : defaultIFrames;
  if (ospTriggered) {
    player.iFrames = Math.max(player.iFrames || 0, 36);
    addDamageText(player.x, player.y - 25, matchText('match.combat.protection'), true, '#2ecc71');
  }
  return { finalDmg, ospTriggered };
}

// Padrões locais podem reutilizar as mesmas defesas e atribuição de dano dos perigos globais.
export function applyBossPatternDamage(player, damage, boss, attackName, selectedHeroKey, context) {
  if (!player || player.hp <= 0 || player.bossIFrames > 0
    || player.dashDuration > 0 || player.ignisDashDuration > 0 || player.invisTimer > 0) return;
  const { finalDmg } = applyHazardDamage(player, damage, selectedHeroKey, 26);
  setLastAttackerInfo({
    name: boss.name || 'Soberano do Abismo', category: 'BOSS',
    attackName, damage: finalDmg, enemyType: `BOSS_${boss.bossId}`
  });
  playSfx('hit');
  context.triggerShake(7);
  context.addDamageText(player.x, player.y, `-${finalDmg}`, false, '#e84393');
  context.createHitParticles(player.x, player.y, '#e84393', 6);
  if (player.hp <= 0) {
    player.hp = 0;
    triggerDeath();
  }
}

export function updateBossHazards(dt, {
  player,
  bossShockwaves,
  bossTelegraphs,
  bossProjectiles,
  enemyBullets,
  activeBoss,
  selectedHeroKey,
  triggerShake,
  setLastAttackerName
}) {
  // 1. Ondas de Choque dos Chefes
  for (let i = bossShockwaves.length - 1; i >= 0; i--) {
    const sw = bossShockwaves[i];
    sw.radius += sw.speed * dt;

    // Carência no nascimento da onda para não punir melee com dano instantâneo no frame 0
    if (sw.spawnGrace && sw.spawnGrace > 0) {
      sw.spawnGrace -= dt;
      continue;
    }

    const sdx = player.x - sw.x;
    const sdy = player.y - sw.y;
    const sDist = Math.sqrt(sdx * sdx + sdy * sdy);

    if (!sw.hitPlayer && Math.abs(sDist - sw.radius) < 16 && player.bossIFrames <= 0) {
      // Repulsão / Knockback Radial da Onda de Choque
      if (sw.knockback && sDist > 0.1) {
        const pushForce = sw.knockback;
        player.pushVx = (sdx / sDist) * pushForce;
        player.pushVy = (sdy / sDist) * pushForce;
      }

      if ((sw.damage || 0) > 0) {
        const { finalDmg: finalSwDamage } = applyHazardDamage(player, sw.damage, selectedHeroKey, 24);
        const bName = (activeBoss && activeBoss.name) ? activeBoss.name : "Chefe do Abismo";
        const finalAttackName = sw.attackName || (activeBoss && activeBoss.isFinalBoss ? "Onda Cósmica do Soberano" : "Onda de Choque Sísmica");

        let tip = sw.tacticTip || "";
        if (!tip && activeBoss && activeBoss.isFinalBoss) {
          if (finalAttackName === "Supernova Cósmica") {
            tip = "A Supernova telegrafa um disco violeta de 220px no chão. Ao avistar o preenchimento, use Dash para fora da área delimitada.";
          } else if (finalAttackName === "Colapso de Teleporte") {
            tip = "O teleporte projeta um círculo de 150px. Quando o Soberano materializar, há 0,23s de carência para rolar para longe antes da onda expandir.";
          } else if (finalAttackName === "Pulso de Singularidade") {
            tip = "Na Fase 3, a sucção cessa durante os 0,8s de carga do anel ciano no chão. Aproveite essa brecha para correr para as bordas da arena.";
          }
        }

        setLastAttackerInfo({
          name: bName,
          category: "BOSS",
          attackName: finalAttackName,
          damage: finalSwDamage,
          enemyType: (activeBoss && activeBoss.bossId) ? `BOSS_${activeBoss.bossId}` : null,
          tacticTip: tip
        });
        triggerShake(9);
        playSfx('hit');
        const swColor = sw.color || (activeBoss && activeBoss.bossId === 3 ? '#00cec9' : '#e67e22');
        addDamageText(player.x, player.y, `-${finalSwDamage}`, false, swColor);
        createHitParticles(player.x, player.y, swColor, 5);

        if (player.hp <= 0) {
          player.hp = 0;
          triggerDeath();
          return { playerDied: true };
        }
      } else {
        // Onda puramente de repulsão tática (sem dano punitivo surpresa)
        player.iFrames = Math.max(player.iFrames, 14);
        triggerShake(7);
        playSfx('forcefield');
        const swColor = sw.color || '#00cec9';
        createHitParticles(player.x, player.y, swColor, 4);
      }
      sw.hitPlayer = true;
    }

    if (activeBoss && (activeBoss.isFinalBoss || activeBoss.arenaCenterX !== undefined)) {
      // Apenas ondas letais de combate são contidas na barreira; ondas cinemáticas de vitória expandem livremente
      if ((sw.damage || 0) > 0 && sw.radius >= (activeBoss.arenaRadius || 620) + 30) {
        bossShockwaves.splice(i, 1);
        continue;
      }
    }

    if (sw.radius >= sw.maxRadius) bossShockwaves.splice(i, 1);
  }

  // 2. Telegrafias dos Chefes e Pavios
  for (let i = bossTelegraphs.length - 1; i >= 0; i--) {
    const tel = bossTelegraphs[i];
    tel.timer -= dt;

    if (tel.timer <= 0) {
      if (tel.type === 'MIST_DASH_LANE' || tel.type === 'FUSE_INDICATOR' || tel.type === 'REPULSION') {
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'VAMPIRE_TELEPORT') {
        if (tel.boss) {
          tel.boss.x = tel.x;
          tel.boss.y = tel.y;
          tel.boss.mistState = 'IDLE';
          tel.boss.isTeleporting = false;
          tel.boss.actionState = 'CHASE';
          tel.boss.skillCooldown = tel.boss.isEnraged ? 45 : 70;
        }
        triggerShake(10);
        playSfx('boss');
        createHitParticles(tel.x, tel.y, '#8e44ad', 18);

        const dSq = (player.x - tel.x) ** 2 + (player.y - tel.y) ** 2;
        if (dSq < tel.radius * tel.radius && player.bossIFrames <= 0) {
          const { finalDmg: dmgTaken } = applyHazardDamage(player, tel.damage, selectedHeroKey, 22);
          const bName = (tel.boss && tel.boss.name) || (activeBoss && activeBoss.name) || "Lorde Vampírico";
          setLastAttackerInfo({
            name: bName,
            category: "BOSS",
            attackName: "Teleporte Carmesim",
            damage: dmgTaken,
            enemyType: (tel.boss && tel.boss.bossId) ? `BOSS_${tel.boss.bossId}` : 'BOSS_1'
          });
          triggerShake(10);
          playSfx('hit');
          addDamageText(player.x, player.y, `-${dmgTaken}`, false, '#8e44ad');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return { playerDied: true };
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'BLOOD_BURST_GEYSER') {
        triggerShake(6);
        playSfx('acid');
        createHitParticles(tel.x, tel.y, '#ff1744', 18);
        createHitParticles(tel.x, tel.y, '#2c0c16', 12);
        createHitParticles(tel.x, tel.y, '#ffffff', 6);

        // Dispara fragmentos carmesim na erupção do gêiser de sangue
        const shardCount = 5;
        for (let k = 0; k < shardCount; k++) {
          const sAng = (k * Math.PI * 2) / shardCount + Math.random() * 0.3;
          const sSpd = 3.6 + Math.random() * 1.2;
          enemyBullets.push({
            x: tel.x,
            y: tel.y,
            vx: Math.cos(sAng) * sSpd,
            vy: Math.sin(sAng) * sSpd,
            radius: 6.5,
            damage: Math.round(tel.damage * 0.6),
            life: 85,
            bulletType: 'BLOOD_DAGGER',
            color: '#ff1744',
            isBossProjectile: true
          });
        }

        const dSq = (player.x - tel.x) ** 2 + (player.y - tel.y) ** 2;
        if (dSq < tel.radius * tel.radius && player.bossIFrames <= 0) {
          const { finalDmg: dmgTaken } = applyHazardDamage(player, tel.damage, selectedHeroKey, 22);
          const bName = (tel.boss && tel.boss.name) || (activeBoss && activeBoss.name) || "Lorde Vampírico";
          setLastAttackerInfo({
            name: bName,
            category: "BOSS",
            attackName: "Erupção de Sangue",
            damage: dmgTaken,
            enemyType: (tel.boss && tel.boss.bossId) ? `BOSS_${tel.boss.bossId}` : 'BOSS_1'
          });
          triggerShake(8);
          playSfx('hit');
          addDamageText(player.x, player.y, `-${dmgTaken}`, false, '#ff1744');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return { playerDied: true };
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'DIMENSIONAL_CLEAVE') {
        const cosA = Math.cos(tel.angle);
        const sinA = Math.sin(tel.angle);
        const pdx = player.x - tel.x;
        const pdy = player.y - tel.y;
        const proj = pdx * cosA + pdy * sinA;
        const perpDist = Math.abs(-pdx * sinA + pdy * cosA);
        const halfLen = (tel.length || 1300) * 0.5;

        triggerShake(14);
        playSfx('warp');
        triggerHaptic('heavy');
        const sparkX = tel.x + cosA * Math.max(-halfLen, Math.min(halfLen, proj));
        const sparkY = tel.y + sinA * Math.max(-halfLen, Math.min(halfLen, proj));
        createHitParticles(sparkX, sparkY, '#00cec9', 16);
        createHitParticles(sparkX, sparkY, '#e84393', 14);
        createHitParticles(sparkX, sparkY, '#ffffff', 8);

        if (Math.abs(proj) <= halfLen && perpDist <= (tel.width || 34) && player.bossIFrames <= 0) {
          const { finalDmg: dmgTaken } = applyHazardDamage(player, tel.damage, selectedHeroKey, 24);
          const bName = (tel.boss && tel.boss.name) || (activeBoss && activeBoss.name) || "Thanatos, o Ceifador Supremo";
          setLastAttackerInfo({
            name: bName,
            category: "BOSS",
            attackName: "Fratura Dimensional",
            damage: dmgTaken,
            enemyType: (tel.boss && tel.boss.bossId) ? `BOSS_${tel.boss.bossId}` : 'BOSS_3'
          });
          triggerShake(14);
          playSfx('hit');
          triggerHaptic('heavy');
          addDamageText(player.x, player.y, `-${dmgTaken}`, false, '#00cec9');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return { playerDied: true };
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'ASTRAL_METEOR_SEAL') {
        triggerShake(14);
        playSfx('boss');
        playSfx('singularity');
        createHitParticles(tel.x, tel.y, '#e84393', 18);
        createHitParticles(tel.x, tel.y, '#00cec9', 16);
        createHitParticles(tel.x, tel.y, '#ffffff', 10);

        bossShockwaves.push({
          x: tel.x,
          y: tel.y,
          radius: 12,
          maxRadius: tel.radius || 65,
          speed: 5.5,
          damage: Math.round(tel.damage * 0.35),
          hitPlayer: false,
          colorRgb: '232, 67, 147'
        });

        const dSq = (player.x - tel.x) ** 2 + (player.y - tel.y) ** 2;
        if (dSq < (tel.radius * tel.radius) && player.bossIFrames <= 0) {
          const { finalDmg: dmgTaken } = applyHazardDamage(player, tel.damage, selectedHeroKey, 22);
          const bName = (tel.boss && tel.boss.name) || (activeBoss && activeBoss.name) || "Soberano do Abismo";
          setLastAttackerInfo({
            name: bName,
            category: "BOSS",
            attackName: "Meteoro do Vazio",
            damage: dmgTaken,
            enemyType: (tel.boss && tel.boss.bossId) ? `BOSS_${tel.boss.bossId}` : 'BOSS_4'
          });
          triggerShake(12);
          playSfx('hit');
          triggerHaptic('heavy');
          addDamageText(player.x, player.y, `-${dmgTaken}`, false, '#e84393');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return { playerDied: true };
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'SCYTHE_CLEAVE') {
        triggerShake(14);
        playSfx('boss');
        const cleaveHitColor = tel.color || '#00cec9';
        createHitParticles(tel.x, tel.y, cleaveHitColor, 16);

        const cdx = player.x - tel.x;
        const cdy = player.y - tel.y;
        const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
        const playerAng = Math.atan2(cdy, cdx);

        let angleDiff = Math.abs(playerAng - tel.angle);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

        const maxAngle = tel.arcHalf !== undefined ? tel.arcHalf : Math.PI * 0.52;
        if (cDist < tel.radius && angleDiff <= maxAngle && player.bossIFrames <= 0) {
          const { finalDmg: dmgTaken } = applyHazardDamage(player, tel.damage, selectedHeroKey, 24);
          const bName = (tel.boss && tel.boss.name) || (activeBoss && activeBoss.name) || "Chefe Supremo";
          const atkName = (tel.boss && tel.boss.bossId === 1) ? "Garras Vampíricas" : "Corte de Foice Espectral";
          setLastAttackerInfo({
            name: bName,
            category: "BOSS",
            attackName: atkName,
            damage: dmgTaken,
            enemyType: (tel.boss && tel.boss.bossId) ? `BOSS_${tel.boss.bossId}` : (activeBoss ? `BOSS_${activeBoss.bossId}` : null)
          });
          triggerShake(12);
          playSfx('hit');
          addDamageText(player.x, player.y, `-${dmgTaken}`, true, cleaveHitColor);
          createHitParticles(tel.x, player.y, cleaveHitColor, 16);
          const bossPushDist = 28 * (player.knockbackReceived !== undefined ? player.knockbackReceived : 1.0);
          player.x += Math.cos(playerAng) * bossPushDist;
          player.y += Math.sin(playerAng) * bossPushDist;

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return { playerDied: true };
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'FALLING_ROCK') {
        triggerShake(10);
        playSfx('hit');
        createHitParticles(tel.x, tel.y, '#e67e22', 14);
        createHitParticles(tel.x, tel.y, '#7f8c8d', 8);

        bossShockwaves.push({
          x: tel.x,
          y: tel.y,
          radius: 10,
          maxRadius: tel.radius + 12,
          speed: 4.2,
          damage: Math.round(tel.damage * 0.3),
          hitPlayer: false
        });

        const dSq = (player.x - tel.x) ** 2 + (player.y - tel.y) ** 2;
        if (dSq < tel.radius * tel.radius && player.bossIFrames <= 0) {
          const { finalDmg: dmgTaken } = applyHazardDamage(player, tel.damage, selectedHeroKey, 22);
          const bName = (tel.boss && tel.boss.name) || (activeBoss && activeBoss.name) || "Monólito Abissal";
          setLastAttackerInfo({
            name: bName,
            category: "BOSS",
            attackName: "Impacto Basáltico",
            damage: dmgTaken,
            enemyType: (tel.boss && tel.boss.bossId) ? `BOSS_${tel.boss.bossId}` : 'BOSS_2'
          });
          triggerShake(10);
          playSfx('hit');
          addDamageText(player.x, player.y, `-${tel.damage}`, false, '#e67e22');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return { playerDied: true };
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'FISSURE_NODE') {
        triggerShake(5);
        if (tel.nodeIndex === 1 || tel.nodeIndex === 4 || tel.nodeIndex === 7 || tel.nodeIndex === 10 || tel.nodeIndex === 13) playSfx('hit');
        createHitParticles(tel.x, tel.y, '#d35400', 8);
        createHitParticles(tel.x, tel.y, '#f39c12', 5);

        const dSq = (player.x - tel.x) ** 2 + (player.y - tel.y) ** 2;
        if (dSq < tel.radius * tel.radius && player.bossIFrames <= 0) {
          const { finalDmg: dmgTaken } = applyHazardDamage(player, tel.damage, selectedHeroKey, 20);
          const bName = (tel.boss && tel.boss.name) || (activeBoss && activeBoss.name) || "Monólito Abissal";
          setLastAttackerInfo({
            name: bName,
            category: "BOSS",
            attackName: "Fissura Tectônica",
            damage: dmgTaken,
            enemyType: (tel.boss && tel.boss.bossId) ? `BOSS_${tel.boss.bossId}` : 'BOSS_2'
          });
          triggerShake(8);
          playSfx('hit');
          addDamageText(player.x, player.y, `-${dmgTaken}`, false, '#e67e22');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return { playerDied: true };
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      if (tel.type === 'ABYSSAL_VOID_RIFT') {
        triggerShake(8);
        playSfx('singularity');
        triggerHaptic('medium');
        createHitParticles(tel.x, tel.y, '#00cec9', 18);
        createHitParticles(tel.x, tel.y, '#e84393', 14);
        createHitParticles(tel.x, tel.y, '#ffffff', 8);

        bossShockwaves.push({
          x: tel.x,
          y: tel.y,
          radius: 8,
          maxRadius: (tel.radius || 52) + 14,
          speed: 6.0,
          damage: Math.round(tel.damage * 0.35),
          hitPlayer: false,
          colorRgb: '0, 206, 201'
        });

        const dSq = (player.x - tel.x) ** 2 + (player.y - tel.y) ** 2;
        if (dSq < tel.radius * tel.radius && player.bossIFrames <= 0) {
          const { finalDmg: dmgTaken } = applyHazardDamage(player, tel.damage, selectedHeroKey, 22);
          const bName = (tel.boss && tel.boss.name) || (activeBoss && activeBoss.name) || "Monólito Abissal";
          setLastAttackerInfo({
            name: bName,
            category: "BOSS",
            attackName: "Bombardeio Abissal",
            damage: dmgTaken,
            enemyType: (tel.boss && tel.boss.bossId) ? `BOSS_${tel.boss.bossId}` : 'BOSS_2'
          });
          triggerShake(12);
          playSfx('hit');
          triggerHaptic('heavy');
          addDamageText(player.x, player.y, `-${dmgTaken}`, false, '#00cec9');

          if (player.hp <= 0) {
            player.hp = 0;
            triggerDeath();
            return { playerDied: true };
          }
        }
        bossTelegraphs.splice(i, 1);
        continue;
      }

      triggerShake(12);
      playSfx('boss');
      createHitParticles(tel.x, tel.y, '#e74c3c', 14);

      bossShockwaves.push({
        x: tel.x,
        y: tel.y,
        radius: 12,
        maxRadius: tel.radius || 75,
        speed: 4.5,
        damage: Math.round(tel.damage * 0.35),
        hitPlayer: false
      });

      const dSq = (player.x - tel.x) ** 2 + (player.y - tel.y) ** 2;
      if (dSq < tel.radius * tel.radius && player.bossIFrames <= 0) {
        const { finalDmg: dmgTaken } = applyHazardDamage(player, tel.damage, selectedHeroKey, 22);
        const bName = (activeBoss && activeBoss.name) ? activeBoss.name : "Cataclismo de Chefe";
        setLastAttackerInfo({
          name: bName,
          category: "BOSS",
          attackName: "Cataclismo do Solo",
          damage: dmgTaken,
          enemyType: (activeBoss && activeBoss.bossId) ? `BOSS_${activeBoss.bossId}` : null
        });
        triggerShake(10);
        playSfx('hit');
        addDamageText(player.x, player.y, `-${dmgTaken}`, false, '#e74c3c');

        if (player.hp <= 0) {
          player.hp = 0;
          triggerDeath();
          return { playerDied: true };
        }
      }
      bossTelegraphs.splice(i, 1);
    }
  }

  // 3. Projéteis dos Chefes
  for (let i = bossProjectiles.length - 1; i >= 0; i--) {
    const bp = bossProjectiles[i];
    bp.life -= dt;
    bp.angle = (bp.angle || 0) + 0.3 * dt;

    if (bp.type === 'MONOLITH_ORB') {
      const orbRetAng = Math.atan2(player.y - bp.y, player.x - bp.x);
      bp.vx = Math.cos(orbRetAng) * 4.6;
      bp.vy = Math.sin(orbRetAng) * 4.6;
    } else {
      if (bp.life < bp.maxLife * 0.5) {
        if (!bp.isReturning) {
          bp.isReturning = true;
          bp.damage = Math.round(bp.damage * 0.75);
        }
        const tgt = activeBoss ? activeBoss : player;
        const retAng = Math.atan2(tgt.y - bp.y, tgt.x - bp.x);
        bp.vx = Math.cos(retAng) * 4.8;
        bp.vy = Math.sin(retAng) * 4.8;
      }
    }

    bp.x += bp.vx * dt;
    bp.y += bp.vy * dt;

    if (activeBoss && (activeBoss.isFinalBoss || activeBoss.arenaCenterX !== undefined)) {
      const bpdx = bp.x - activeBoss.arenaCenterX;
      const bpdy = bp.y - activeBoss.arenaCenterY;
      const bLimit = (activeBoss.arenaRadius || 620) + 40;
      if (bpdx * bpdx + bpdy * bpdy > bLimit * bLimit) {
        bossProjectiles.splice(i, 1);
        continue;
      }
    }

    const pdx = player.x - bp.x;
    const pdy = player.y - bp.y;
    if (player.bossIFrames <= 0 && (pdx * pdx + pdy * pdy) < (player.radius + bp.radius) ** 2) {
      const { finalDmg: dmgTaken } = applyHazardDamage(player, bp.damage, selectedHeroKey, 18);
      const bName = (bp.sourceBoss && bp.sourceBoss.name) || (activeBoss && activeBoss.name) || "Chefe do Abismo";
      const atkName = bp.type === 'SOUL_SCYTHE' ? "Foice Giratória Espiritual" : "Projétil Abissal";
      setLastAttackerInfo({
        name: bName,
        category: "BOSS",
        attackName: atkName,
        damage: dmgTaken,
        enemyType: (bp.sourceBoss && bp.sourceBoss.bossId) ? `BOSS_${bp.sourceBoss.bossId}` : (activeBoss ? `BOSS_${activeBoss.bossId}` : null)
      });
      triggerShake(8);
      playSfx('hit');
      const projHitColor = bp.color || '#e74c3c';
      addDamageText(player.x, player.y, `-${bp.damage}`, false, projHitColor);
      createHitParticles(player.x, player.y, projHitColor, 6);

      if (player.hp <= 0) {
        player.hp = 0;
        triggerDeath();
        return { playerDied: true };
      }
    }

    if (bp.life <= 0) bossProjectiles.splice(i, 1);
  }

  return { playerDied: false };
}
