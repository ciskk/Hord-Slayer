/**
 * src/systems/enemyLifecycle/deathHandler.js
 * Processamento de Abates, Explosões Necróticas, Recompensas,
 * Geração de Gemas/Baús e Registro no Bestiário.
 */
import { playSfx } from '../../core/audio.js';
import {
  addDamageText,
  createHitParticles,
  addDyingEnemy,
  addBloodSplat
} from '../combat.js';
import { canSpawnEnemyBullet } from '../projectiles.js';
import {
  triggerDeath,
  finalizeVictoryAndReturnToMenu,
  setBossRewardContext,
  ensureBossUpgradeCount
} from '../ui.js';
import { recordCreatureKill } from '../../config/bestiary.js';
import { ENEMY_TYPES } from '../../config/enemies.js';
import { addPersistentGold, addXP, getPersistentGold, selectedHeroKey } from '../../entities/player.js';
import { getGemConfig } from '../pickups.js';
import { onBossDefeated, setFirstBossKilled } from '../waves.js';
import { clearActiveBarks } from '../barks.js';
import { getNeighborIndices } from '../../core/spatialGrid.js';
import { spawnMobCluster, isKaelInvisible } from '../../entities/enemies.js';
import { setLastAttackerInfo } from '../../state/events.js';

/**
 * Processa a morte de um inimigo: efeitos visuais, drops, explosões,
 * resolução de chefes/minibosses, registro no bestiário.
 *
 * @param {object} e - Inimigo morto (e.hp <= 0).
 * @param {number} i - Índice no array enemies.
 * @param {object} ctx - Contexto de jogo.
 * @returns {{ playerDied: boolean, earlyExit?: boolean }|null}
 */
export function handleEnemyDeath(e, i, ctx) {
  const {
    player,
    enemies,
    frameCount,
    enemyBullets,
    bossTelegraphs,
    bossProjectiles,
    bossShockwaves,
    voidVortices,
    acidPuddles,
    gems,
    gameState,
    activeBoss,
    setActiveBoss,
    triggerShake,
    triggerHaptic,
    setLastAttackerName,
    freezeTimer,
    setFreezeTimer,
    resetBossGhostHp,
    setIsWavePaused,
    spawnChest
  } = ctx;

  const seconds = Math.floor(frameCount / 60);

  // ---- Efeitos Comuns de Morte ----
  gameState.kills++;
  createHitParticles(e.x, e.y, e.color, 6);
  addBloodSplat(e.x, e.y);

  // Efervescência Necrótica: inimigos corroídos deixam poça secundária ao morrer
  if (selectedHeroKey === 'ALCHEMIST' && ((e.acidStacks && e.acidStacks > 0) || e.inAcidPuddle)) {
    acidPuddles.push({
      x: e.x,
      y: e.y,
      radius: 24,
      life: 120,
      maxLife: 120,
      isAlchemist: true,
      isEvolved: player.evolvedPotion
    });
    playSfx('acid');
    createHitParticles(e.x, e.y, '#a29bfe', 8);
  }

  if (!e.isBoss && !e.isBossSubTarget) {
    const hitAng = Math.atan2(e.y - player.y, e.x - player.x);
    addDyingEnemy(e, hitAng);
  }

  if (e.fuseTelegraph) {
    const tIdx = bossTelegraphs.indexOf(e.fuseTelegraph);
    if (tIdx !== -1) bossTelegraphs.splice(tIdx, 1);
    e.fuseTelegraph = null;
  }

  // ---- Efeitos de Elite na Morte ----
  if (e.eliteMod === 'TOXIC') {
    acidPuddles.push({ x: e.x, y: e.y, radius: 32, life: 340, maxLife: 340, isFire: false });
  } else if (e.eliteMod === 'FROST') {
    triggerShake(4);
    playSfx('freeze');
    createHitParticles(e.x, e.y, '#74b9ff', 14);
    bossShockwaves.push({
      x: e.x,
      y: e.y,
      radius: 8,
      maxRadius: 75,
      speed: 4.0,
      damage: 0,
      knockback: 5.0,
      color: '#74b9ff',
      hitPlayer: false
    });
  }

  // ---- Explosão Suicida: Kamikaze ----
  if (e.behavior === 'kamikaze') {
    if (e.explodedNaturally) {
      playSfx('hit');
      triggerShake(9);
      triggerHaptic('heavy');
      createHitParticles(e.x, e.y, '#e67e22', 16);
      const pDistSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
      if (pDistSq <= 55 * 55 && player.iFrames <= 0) {
        player.hp -= e.damage;
        player.iFrames = 20;
        setLastAttackerInfo({
          name: e.name || 'Carniçal do Pavio',
          category: e.isMiniBoss ? 'MINIBOSS' : 'HORDE',
          attackName: 'Explosão Necrótica',
          damage: Math.round(e.damage),
          enemyType: e.baseType || 'EXPLODER'
        });
        addDamageText(player.x, player.y, `-${Math.round(e.damage)}`, false, '#e67e22');
        if (player.hp <= 0) {
          player.hp = 0;
          triggerDeath();
          return { playerDied: true };
        }
      }
      // Dispersão de Estilhaços e Brasas Incandescentes
      const shrapnelCount = 4;
      for (let sIdx = 0; sIdx < shrapnelCount; sIdx++) {
        if (!canSpawnEnemyBullet()) break;
        const sAng = (sIdx * Math.PI * 0.5) + Math.random() * 0.3;
        enemyBullets.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(sAng) * 2.55,
          vy: Math.sin(sAng) * 2.55,
          radius: 4.5,
          damage: Math.round(e.damage * 0.35),
          life: 65,
          bulletType: 'FIRE_SHRAPNEL',
          color: '#e74c3c',
          sourceName: e.name || 'Carniçal do Pavio',
          enemyType: e.baseType || 'EXPLODER'
        });
      }
      acidPuddles.push({ x: e.x, y: e.y, radius: 24, life: 160, maxLife: 160, isFire: true });
    } else {
      playSfx('hit');
      triggerShake(10);
      triggerHaptic('medium');
      createHitParticles(e.x, e.y, '#e67e22', 18);
      createHitParticles(e.x, e.y, '#f39c12', 10);
      addDamageText(e.x, e.y, "COMBUSTÃO!", true, '#e67e22');

      const nearbyNeighbors = getNeighborIndices(e.x, e.y, 65);
      for (let nIdx = 0; nIdx < nearbyNeighbors.length; nIdx++) {
        const ally = enemies[nearbyNeighbors[nIdx]];
        if (ally && ally !== e) {
          const adx = ally.x - e.x;
          const ady = ally.y - e.y;
          const aDistSq = adx * adx + ady * ady;
          if (aDistSq <= 65 * 65) {
            const aDist = Math.sqrt(aDistSq) || 1;
            ally.hp -= 45;
            ally.hitFlash = 4;
            addDamageText(ally.x, ally.y, 45, false, '#e67e22');
            ally.x += (adx / aDist) * 24;
            ally.y += (ady / aDist) * 24;
            createHitParticles(ally.x, ally.y, '#d35400', 3);
          }
        }
      }
    }
  }

  // ---- Explosão Suicida: Kamikaze Spread ----
  if (e.behavior === 'kamikaze_spread') {
    if (e.explodedNaturally) {
      playSfx('hit');
      triggerShake(12);
      triggerHaptic('heavy');
      createHitParticles(e.x, e.y, '#e67e22', 16);
      const pDistSq = (player.x - e.x) ** 2 + (player.y - e.y) ** 2;
      if (pDistSq <= 60 * 60 && player.iFrames <= 0) {
        player.hp -= e.damage;
        player.iFrames = 25;
        setLastAttackerInfo({
          name: e.name || 'Incinerador Instável',
          category: 'MINIBOSS',
          attackName: 'Estilhaço Suicida',
          damage: Math.round(e.damage),
          enemyType: e.baseType || 'FIRE_INCINERATOR'
        });
        triggerShake(9);
        playSfx('hit');
        addDamageText(player.x, player.y, `-${Math.round(e.damage)}`, false, '#e67e22');
        if (player.hp <= 0) {
          player.hp = 0;
          triggerDeath();
          return { playerDied: true };
        }
      }
      const spreadCount = 8;
      for (let bIdx = 0; bIdx < spreadCount; bIdx++) {
        if (!canSpawnEnemyBullet()) break;
        const bAng = (bIdx * Math.PI * 2) / spreadCount;
        enemyBullets.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(bAng) * 3.0,
          vy: Math.sin(bAng) * 3.0,
          radius: 5,
          damage: Math.round(e.damage * 0.35),
          life: 80,
          bulletType: 'FIRE_SHRAPNEL',
          color: '#e74c3c'
        });
      }
    } else {
      playSfx('hit');
      triggerShake(11);
      triggerHaptic('medium');
      createHitParticles(e.x, e.y, '#e67e22', 20);
      createHitParticles(e.x, e.y, '#d35400', 12);
      addDamageText(e.x, e.y, "COMBUSTÃO!", true, '#e67e22');

      const nearbyNeighbors = getNeighborIndices(e.x, e.y, 80);
      for (let nIdx = 0; nIdx < nearbyNeighbors.length; nIdx++) {
        const ally = enemies[nearbyNeighbors[nIdx]];
        if (ally && ally !== e) {
          const adx = ally.x - e.x;
          const ady = ally.y - e.y;
          const aDistSq = adx * adx + ady * ady;
          if (aDistSq <= 80 * 80) {
            const aDist = Math.sqrt(aDistSq) || 1;
            ally.hp -= 60;
            ally.hitFlash = 4;
            addDamageText(ally.x, ally.y, 60, false, '#e67e22');
            ally.x += (adx / aDist) * 28;
            ally.y += (ady / aDist) * 28;
            createHitParticles(ally.x, ally.y, '#d35400', 4);
          }
        }
      }
    }
  }

  // ---- Morte do Splitter: Poça Cáustica + Filhotes ----
  if (e.behavior === 'splitter') {
    // Poça Cáustica Residual e Espículas Ácidas
    acidPuddles.push({ x: e.x, y: e.y, radius: 36, life: 180, maxLife: 180, isCaustic: true, isFire: false });
    playSfx('acid');
    createHitParticles(e.x, e.y, '#ff4757', 10);

    for (let aIdx = 0; aIdx < 4; aIdx++) {
      if (!canSpawnEnemyBullet()) break;
      const aAng = (aIdx * Math.PI * 0.5) + Math.PI * 0.25;
      enemyBullets.push({
        x: e.x,
        y: e.y,
        vx: Math.cos(aAng) * 2.625,
        vy: Math.sin(aAng) * 2.625,
        radius: 5,
        damage: Math.round(e.damage * 0.45),
        life: 60,
        bulletType: 'ACID_SPIT',
        color: '#ff4757'
      });
    }

    if (!isKaelInvisible()) {
      for (let k = 0; k < 2; k++) {
        const subT = ENEMY_TYPES.SPLITTER_MINI;
        // Ângulos de ejeção divergentes (+- 65 graus do vetor de impacto da morte)
        const deathAng = Math.atan2(e.y - player.y, e.x - player.x);
        const ejectAng = deathAng + (k === 0 ? -1 : 1) * (Math.PI * 0.38);
        enemies.push({
          x: e.x,
          y: e.y,
          baseType: 'SPLITTER_MINI',
          radius: subT.radius,
          speed: subT.speed,
          hp: subT.hp,
          maxHp: subT.hp,
          color: subT.color,
          damage: subT.damage,
          behavior: subT.behavior,
          xp: subT.xp,
          facing: Math.cos(ejectAng) >= 0 ? 1 : -1,
          hitFlash: 0,
          orbitalHitCd: 0,
          slowTimer: 0,
          slowFactor: 0,
          stunTimer: 0,
          emergeTimer: 0,
          emergeDuration: 0,
          // Salto balístico de ejeção de nascimento
          leapState: 'jumping',
          leapTimer: 0,
          leapDuration: 14,
          leapAngle: ejectAng,
          leapSpeed: subT.speed * 3.4,
          jumpZ: 15,
          jumpMaxZ: 22,
          leapCooldown: 35 + Math.floor(Math.random() * 25),
          landingSplashTimer: 0,
          combatState: 'CHASE',
          attackTimer: 0,
          attackRange: 24,
          attackWindupFrames: 14,
          attackStrikeFrames: 4,
          attackRecoveryFrames: 27,
          attackCooldown: 12,
          attackCooldownMax: 19,
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

  // ---- Ouro Persistente por monstros comuns ----
  if (!e.isMiniBoss && (Math.random() < 0.08 || e.isElite)) {
    const goldVal = e.isElite ? 2 : 1;
    addPersistentGold(goldVal);
  }

  // ---- Morte de Chefes ----
  if (e.isBoss) {
    if (e.isFinalBoss) {
      if (e.actionState !== 'DEATH_COLLAPSE') {
        e.hp = 0;
        e.actionState = 'DEATH_COLLAPSE';
        recordCreatureKill('BOSS_' + (e.bossId || 4));
        e.defeatTimer = 540; // ~9 segundos a 60 FPS
        e.defeatMaxTimer = 540;
        e.isTargetable = false;
        e.isVulnerable = false;
        e.currentSkill = null;
        e.windupTimer = 0;
        e.castDuration = 0;
        player.iFrames = 999999;
        setIsWavePaused(true);

        for (let k = 0; k < 4; k++) {
          const bAngle = (k * Math.PI * 2) / 4;
          createHitParticles(e.x + Math.cos(bAngle) * 36, e.y + Math.sin(bAngle) * 36, '#e056fd', 8);
        }

        const bossGold = 50 * (e.bossId || 1);
        addPersistentGold(bossGold);
        addDamageText(e.x, e.y - 18, `+${bossGold} OURO!`, true, '#f1c40f');

        onBossDefeated(seconds);

        // Guarda métricas consolidadas da vitória para o Banner Dourado
        const timerElem = document.getElementById('timer-val');
        e.victoryStats = {
          time: timerElem ? timerElem.innerText : '00:00',
          kills: gameState.kills || 0,
          level: player.level || 1,
          gold: getPersistentGold() || 0
        };

        // Hit-stop dramático no frame de abate fatal
        if (setFreezeTimer) setFreezeTimer(16);
        triggerShake(26);
        triggerHaptic('heavy');
        playSfx('shatter');
        playSfx('crit');

        // Limpa perigos residuais e outros monstros comuns da arena
        for (let rem = enemies.length - 1; rem >= 0; rem--) {
          if (enemies[rem] !== e) enemies.splice(rem, 1);
        }
        enemyBullets.length = 0;
        bossTelegraphs.length = 0;
        bossProjectiles.length = 0;
        bossShockwaves.length = 0;
        voidVortices.length = 0;

        // Ocultação imediata e total do HUD ao iniciar a animação cinematográfica de morte do chefe final
        if (typeof document !== 'undefined') {
          if (document.body) document.body.classList.add('boss-defeat-cinematic');
          const hud = document.getElementById('hud');
          if (hud) {
            hud.classList.add('hud-hidden', 'hud-cinematic-death');
            hud.style.setProperty('display', 'none', 'important');
            hud.style.display = 'none';
          }
          const bossHud = document.getElementById('boss-hud');
          if (bossHud) bossHud.style.display = 'none';
          const skillBtn = document.getElementById('skill-btn-container');
          if (skillBtn) {
            skillBtn.classList.add('hud-hidden', 'hud-cinematic-death');
            skillBtn.style.setProperty('display', 'none', 'important');
            skillBtn.style.display = 'none';
          }
          const altarHud = document.getElementById('blood-altar-hud');
          if (altarHud) altarHud.style.display = 'none';
          const altarBtn = document.getElementById('blood-altar-channel-btn');
          if (altarBtn) altarBtn.style.display = 'none';
          clearActiveBarks();
        }

        const bossHpFill = document.getElementById('boss-hp-fill');
        if (bossHpFill) {
          bossHpFill.style.transition = 'none';
          bossHpFill.style.width = '0%';
        }
        const bossHpGhostFill = document.getElementById('boss-hp-ghost-fill');
        if (bossHpGhostFill) {
          bossHpGhostFill.style.transition = 'none';
          bossHpGhostFill.style.width = '0%';
        }
        if (resetBossGhostHp) resetBossGhostHp();
        const bossHpVal = document.getElementById('boss-hp-val');
        if (bossHpVal) bossHpVal.innerText = 'EXPURGADO';
        const bossHpRaw = document.getElementById('boss-hp-raw');
        if (bossHpRaw) bossHpRaw.innerText = '0 HP';
      }
      // Sinaliza saída antecipada (o chefe final não é removido do array)
      return { playerDied: false, earlyExit: true };
    }

    triggerShake(20);
    triggerHaptic('heavy');

    if (e.bossId === 1) setFirstBossKilled(true);

    const bossXp = e.xp || 400;

    // Registra o contexto de vitória contra o chefe para exibição destacada na tela de bênçãos
    setBossRewardContext(e.name, e.bossId);
    addXP(bossXp);

    // Garante no mínimo 2 upgrades para o 1º chefe e 3 para os chefes avançados
    const minBossUpgrades = (e.bossId === 1) ? 2 : 3;
    ensureBossUpgradeCount(minBossUpgrades);

    for (let k = 0; k < 4; k++) {
      const bAngle = (k * Math.PI * 2) / 4;
      createHitParticles(e.x + Math.cos(bAngle) * 36, e.y + Math.sin(bAngle) * 36, '#e056fd', 8);
    }

    const bossGold = 50 * (e.bossId || 1);
    addPersistentGold(bossGold);
    addDamageText(e.x, e.y - 18, `+${bossGold} OURO!`, true, '#f1c40f');

    onBossDefeated(seconds);

    // Garante que o jogador veja a barra zerar explicitamente (0%) no instante do abate
    const bossHpFill = document.getElementById('boss-hp-fill');
    if (bossHpFill) {
      bossHpFill.style.transition = 'none';
      bossHpFill.style.width = '0%';
    }
    const bossHpGhostFill = document.getElementById('boss-hp-ghost-fill');
    if (bossHpGhostFill) {
      bossHpGhostFill.style.transition = 'none';
      bossHpGhostFill.style.width = '0%';
    }
    if (resetBossGhostHp) resetBossGhostHp();
    const bossHpVal = document.getElementById('boss-hp-val');
    if (bossHpVal) bossHpVal.innerText = '0%';
    const bossHpRaw = document.getElementById('boss-hp-raw');
    if (bossHpRaw) bossHpRaw.innerText = '0 HP';

    spawnChest(e.x, e.y, 'BOSS');
    if (setActiveBoss) setActiveBoss(null);
    ctx.activeBoss = null;
    const hud = document.getElementById('hud');
    if (hud) hud.classList.remove('boss-active');
    bossTelegraphs.length = 0;
    bossProjectiles.length = 0;
    bossShockwaves.length = 0;
    voidVortices.length = 0;
    gameState.isWavePaused = true;
    const bossHud = document.getElementById('boss-hud');
    if (bossHud) {
      bossHud.classList.remove('enraged', 'hit-shake', 'hit-flash');
      if (gameState.isPaused) {
        bossHud.style.display = 'none';
      }
      setTimeout(() => {
        if (!ctx.activeBoss) {
          bossHud.style.display = 'none';
        }
      }, 350);
    }
  } else if (e.isMiniBoss) {
    // ---- Morte de Mini-Chefes ----
    triggerShake(10);
    triggerHaptic('medium');
    playSfx('crit');

    const goldEarned = e.goldReward || 12;
    addPersistentGold(goldEarned);
    addDamageText(e.x, e.y - 18, `+${goldEarned} OURO!`, true, '#f1c40f');

    gems.push({
      x: e.x,
      y: e.y,
      radius: 11,
      color: '#f1c40f',
      value: e.xp || 60,
      isSuper: true,
      forcedPull: true,
      pulseOffset: 0
    });

    if (e.behavior === 'splitter_queen' || e.baseType === 'BROOD_MATRIARCH') {
      for (let k = 0; k < 3; k++) spawnMobCluster('SPLITTER', 1);
      acidPuddles.push({ x: e.x, y: e.y, radius: 32, life: 240, maxLife: 240, isFire: false });
    } else if (e.baseType === 'MOBILE_HIVE') {
      spawnMobCluster('BAT', 3);
    } else if (e.baseType === 'FIRE_INCINERATOR') {
      acidPuddles.push({ x: e.x, y: e.y, radius: 30, life: 200, maxLife: 200, isFire: true });
    }

    if (Math.random() < 0.40) {
      spawnChest(e.x, e.y, 'MINI_BOSS');
    }
  } else {
    // ---- Morte de Monstros Comuns ----
    if (e.baseType === 'VOID_SCAVENGER') {
      const eatenBonus = (e.eatenGemsCount || 0) * 6;
      const totalVal = Math.round((e.xp + eatenBonus) * 1.5);
      gems.push({
        x: e.x,
        y: e.y,
        radius: 9.5,
        color: '#00d2d3',
        value: totalVal,
        isSuper: true,
        forcedPull: true,
        pulseOffset: 0
      });
      const bonusGold = 2 + (e.eatenGemsCount || 0);
      addPersistentGold(bonusGold);
      addDamageText(e.x, e.y - 12, `+${bonusGold} OURO!`, false, '#f1c40f');
    } else if (e.baseType === 'CURSED_CHEST') {
      addPersistentGold(15);
      spawnChest(e.x, e.y, 'MINI_BOSS');
      addDamageText(e.x, e.y - 15, "+15 OURO & BAÚ!", true, '#e056fd');
    } else if (e.baseType === 'TRAIL_CRAWLER') {
      let merged = false;
      for (let pIdx = acidPuddles.length - 1; pIdx >= 0; pIdx--) {
        const p = acidPuddles[pIdx];
        if (p.isCaustic && !p.isAlchemist && !p.isFire && !p.isWeb) {
          const pdx = p.x - e.x;
          const pdy = p.y - e.y;
          if (pdx * pdx + pdy * pdy < 20 * 20) {
            p.life = Math.max(p.life || 0, 160);
            p.radius = Math.min(28, (p.radius || 24) + 4);
            merged = true;
            break;
          }
        }
      }
      if (!merged && acidPuddles.length < 50) {
        acidPuddles.push({ x: e.x, y: e.y, radius: 24, life: 160, maxLife: 160, isCaustic: true, isFire: false });
      }
    } else {
      const gCfg = getGemConfig(e.xp);
      gems.push({
        x: e.x,
        y: e.y,
        radius: gCfg.radius,
        color: gCfg.color,
        value: e.xp,
        isSuper: gCfg.isSuper,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }

    if (e.baseType === 'MIRROR_BANSHEE' && !e.isDecoy) {
      for (let rem = enemies.length - 1; rem >= 0; rem--) {
        if (enemies[rem].isDecoy && enemies[rem].baseType === 'MIRROR_BANSHEE') {
          enemies[rem].hp = 0;
        }
      }
    }
  }

  // ---- Registro no Bestiário e Remoção ----
  const creatureKey = e.isBoss ? ('BOSS_' + e.bossId) : (e.baseType || e.type || 'ZOMBIE');
  recordCreatureKill(creatureKey);

  playSfx('kill');
  enemies.splice(i, 1);

  return null;
}
