/**
 * src/entities/bosses/abyssSovereign/attacks.js
 * Arsenal de combate, seleção de habilidades, windups e feixes estelares do Soberano do Abismo.
 */
import { playSfx, triggerHaptic } from '../../../core/audio.js';
import { SOVEREIGN_STATES, SOVEREIGN_CONFIG } from './constants.js';
import { scheduleDelayedAction, triggerNextHarvestWave } from './physics.js';
import { ARENA_SKILLS, beginArenaPattern, selectSovereignSkill } from './arenaPatterns.js';
import { 
  bullets, 
  enemyBullets, 
  bossShockwaves, 
  bossTelegraphs,
  canSpawnEnemyBullet 
} from '../../../main.js';

/**
 * Dispara uma sequência de fendas de vácuo perseguidoras (Bombardeio Abissal).
 * O primeiro nó mira sob os pés do jogador; os seguintes antecipam o vetor de movimento.
 */
export function spawnAbyssalHomingBarrage(boss, player) {
  const nodeCount = boss.phase === 3 ? 7 : (boss.phase === 2 ? 6 : 5);
  const interval = 9; // Intervalo de 9 frames entre cada fenda lançada

  for (let i = 0; i < nodeCount; i++) {
    scheduleDelayedAction(boss, i * interval, () => {
      if (boss.hp <= 0) return;

      const pvx = player.vx || 0;
      const pvy = player.vy || 0;
      const isMoving = Math.hypot(pvx, pvy) > 0.4;

      let targetX = player.x;
      let targetY = player.y;

      if (i > 0 && isMoving) {
        const lead = 8 + i * 2;
        targetX += pvx * lead;
        targetY += pvy * lead;

        // Desvios laterais em leque para punir movimentações em círculos fechados
        if (i % 2 === 1) {
          const perpX = -pvy;
          const perpY = pvx;
          const pLen = Math.hypot(perpX, perpY) || 1;
          const offset = (i % 4 === 1 ? 1 : -1) * 20;
          targetX += (perpX / pLen) * offset;
          targetY += (perpY / pLen) * offset;
        }
      }

      // Clamping estrito dentro dos limites da arena
      if (boss.arenaCenterX !== undefined && boss.arenaCenterY !== undefined && boss.arenaRadius) {
        const adx = targetX - boss.arenaCenterX;
        const ady = targetY - boss.arenaCenterY;
        const aDist = Math.hypot(adx, ady) || 1;
        const maxDist = boss.arenaRadius - 32;
        if (aDist > maxDist) {
          targetX = boss.arenaCenterX + (adx / aDist) * maxDist;
          targetY = boss.arenaCenterY + (ady / aDist) * maxDist;
        }
      }

      bossTelegraphs.push({
        type: 'ABYSSAL_VOID_RIFT',
        x: targetX,
        y: targetY,
        radius: 52,
        timer: 32,
        maxTimer: 32,
        damage: Math.round(boss.damage * 0.36),
        nodeIndex: i
      });

      playSfx('warp');
      triggerHaptic('light');
    });
  }
}

/**
 * Verifica se há algum ataque que cobre a arena ativo (habilidades com safe-zones e áreas de perigo indicadas).
 * Abrange:
 * 1. Padrões globais de arena (Coroa do Eclipse, Corredor de Paralaxe, Maré do Horizonte, Constelação de Ecos)
 * 2. Colheita Inevitável (tabuleiro de perigo rúnico com ondas ativas e miasma)
 */
export function isArenaCoveringAttackActive(boss) {
  if (!boss) return false;
  // 1. Padrão global de arena com safe-zones ativo
  if (boss.arenaPattern) return true;

  // 2. Colheita Inevitável (ladrilhos rúnicos com perigo e safe-zones)
  if (boss.harvestState) return true;

  // 3. Canalização ou windup de habilidade de arena
  if (boss.currentSkill && (ARENA_SKILLS[boss.currentSkill] || boss.currentSkill === 'INEXORABLE_HARVEST')) {
    if (boss.actionState === SOVEREIGN_STATES.WINDUP || boss.actionState === SOVEREIGN_STATES.CASTING) {
      return true;
    }
  }

  return false;
}

export function prepareNextAttack(boss, context) {
  if (isArenaCoveringAttackActive(boss)) return;
  const { player } = context;

  boss.currentSkill = selectSovereignSkill(boss);
  boss.skillCycleIndex++;

  boss.actionState = SOVEREIGN_STATES.WINDUP;
  boss.stateTimer = 0;
  boss.staggerGauge = 0;

  if (ARENA_SKILLS[boss.currentSkill]) {
    const pattern = beginArenaPattern(boss, player);
    boss.windupTimer = pattern.recording ? pattern.recordInterval * pattern.steps : pattern.warning;
    boss.windupMax = boss.windupTimer;
    playSfx('charge');
    return;
  }

  switch (boss.currentSkill) {
    case 'VOID_CRUCIFIX': {
      boss.windupTimer = boss.phase === 3 ? 42 : (boss.phase === 2 ? 50 : 64);
      boss.windupMax = boss.windupTimer;
      boss.beamAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
      boss.beamDir = Math.random() < 0.5 ? 1 : -1;
      boss.beamRotSpeed = boss.phase === 3 ? 0.015 : 0.01375;
      boss.beamHasReversed = false;
      boss.inversionFlashTimer = 0;
      playSfx('charge');
      break;
    }

    case 'RELATIVISTIC_SALVO': {
      boss.windupTimer = boss.phase === 3 ? 34 : 46;
      boss.windupMax = boss.windupTimer;
      boss.salvoSpiralAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
      playSfx('shoot');
      break;
    }

    case 'ABYSSAL_RIFTS': {
      boss.windupTimer = 44;
      boss.windupMax = 44;
      playSfx('charge');
      break;
    }

    case 'DIMENSIONAL_CLEAVE': {
      boss.windupTimer = boss.phase === 3 ? 40 : 48;
      boss.windupMax = boss.windupTimer;
      boss.cleaveAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
      boss.cleaveLocked = false;
      playSfx('charge');
      break;
    }

    case 'COSMIC_SUPERNOVA': {
      boss.windupTimer = 58;
      boss.windupMax = 58;
      boss.supernovaDangerRadius = 220; // Raio calibrado da área letal e da onda
      boss.supernovaCrescendoPlayed = false;
      boss.supernovaOrbs = [];
      const orbCount = 6; // Fixado em 6 vértices para formar um hexágono perfeito
      const hexTelegraphRadius = boss.supernovaDangerRadius;
      for (let o = 0; o < orbCount; o++) {
        boss.supernovaOrbs.push({
          baseAngle: (o * Math.PI * 2) / orbCount,
          dist: hexTelegraphRadius
        });
      }
      playSfx('singularity');
      break;
    }

    case 'ASTRAL_BARRAGE': {
      boss.windupTimer = 38;
      boss.windupMax = 38;
      boss.astralMeteorTimer = 0;
      boss.astralMeteorsLeft = 7;
      playSfx('charge');
      break;
    }

    case 'VOID_WARP': {
      boss.actionState = SOVEREIGN_STATES.WARP_AIM;
      boss.windupTimer = 42;
      boss.windupMax = 42;
      boss.warpStartX = boss.x;
      boss.warpStartY = boss.y;
      boss.warpTelegraphRadius = 150; // Raio real consistente com a telegrafia
      boss.warpLanded = false;
      boss.warpImpactTimer = 0;

      const leadFactor = player.isMoving ? 26 : 0;
      let targetX = player.x + (player.facing || 1) * leadFactor + (Math.random() - 0.5) * 40;
      let targetY = player.y + (Math.random() - 0.5) * 40;

      // Clamping rígido do destino do teleporte dentro da arena
      if (boss.arenaCenterX !== undefined && boss.arenaCenterY !== undefined && boss.arenaRadius) {
        const wdx = targetX - boss.arenaCenterX;
        const wdy = targetY - boss.arenaCenterY;
        const wDist = Math.hypot(wdx, wdy) || 1;
        const maxWarpDist = Math.max(0, boss.arenaRadius - (boss.radius || 40) - 35);
        if (wDist > maxWarpDist) {
          targetX = boss.arenaCenterX + (wdx / wDist) * maxWarpDist;
          targetY = boss.arenaCenterY + (wdy / wDist) * maxWarpDist;
        }
      }
      boss.warpTargetX = targetX;
      boss.warpTargetY = targetY;
      playSfx('warp');
      break;
    }

    case 'SINGULARITY_IMPLOSION': {
      boss.windupTimer = 101; // 101 frames (~1.68s: 35f tracking, 35f gravidade intensa, 31f soltura para fuga rápida - reduzido 2.5x)
      boss.windupMax = boss.windupTimer;
      boss.implosionX = player.x;
      boss.implosionY = player.y;
      boss.implosionMaxRadius = 175;
      boss.implosionRadius = 175;
      boss.implosionLocked = false;
      boss.implosionReleased = false;
      boss.implosionSnapRing = 0;
      playSfx('singularity');
      break;
    }

    case 'THRESHOLD_BEAMS': {
      boss.windupTimer = SOVEREIGN_CONFIG.THRESHOLD_BEAM_WARNING || 44;
      boss.windupMax = boss.windupTimer;
      boss.aimAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
      playSfx('charge');
      triggerHaptic('medium');
      break;
    }

    case 'INEXORABLE_HARVEST': {
      boss.windupTimer = 44;
      boss.windupMax = boss.windupTimer;
      playSfx('charge');
      playSfx('singularity');
      triggerHaptic('heavy');
      break;
    }

    case 'ABYSSAL_CYCLONE': {
      boss.windupTimer = SOVEREIGN_CONFIG.CYCLONE_WINDUP || 38;
      boss.windupMax = boss.windupTimer;
      boss.cycloneAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
      playSfx('charge');
      triggerHaptic('heavy');
      break;
    }

    case 'FOUR_COIL_SPIRAL': {
      boss.windupTimer = 44;
      boss.windupMax = 44;
      boss.aimAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
      boss.spiralBaseAngle = boss.aimAngle;
      playSfx('charge');
      playSfx('singularity');
      triggerHaptic('heavy');
      break;
    }

    default:
      boss.windupTimer = 50;
      boss.windupMax = 50;
      break;
  }
}

export function startSkillCast(boss, context) {
  boss.actionState = SOVEREIGN_STATES.CASTING;
  boss.stateTimer = 0;

  switch (boss.currentSkill) {
    case 'VOID_CRUCIFIX':
      boss.castDuration = boss.phase === 3 ? 170 : (boss.phase === 2 ? 145 : 125);
      playSfx('boss');
      break;
    case 'RELATIVISTIC_SALVO':
      boss.castDuration = boss.phase === 3 ? 120 : 95;
      break;
    case 'ABYSSAL_RIFTS':
      boss.castDuration = 65;
      playSfx('boss');
      if (context && context.player) {
        spawnAbyssalHomingBarrage(boss, context.player);
      }
      break;
    case 'DIMENSIONAL_CLEAVE': {
      boss.castDuration = 28;
      playSfx('warp');
      playSfx('boss');
      context.triggerShake(18);
      triggerHaptic('heavy');

      const isPhase3 = boss.phase === 3;
      const baseAng = boss.cleaveAngle || 0;
      const angles = isPhase3 
        ? [baseAng, baseAng - 0.28, baseAng + 0.28] 
        : [baseAng];

      boss.activeAttacks.push({
        type: 'DIMENSIONAL_SLASH',
        angles: angles,
        length: 1500,
        width: isPhase3 ? 70 : 108,
        sideWidth: 46,
        damage: Math.round(boss.damage * 0.44),
        timer: 28,
        maxTimer: 28
      });
      break;
    }
    case 'COSMIC_SUPERNOVA': {
      boss.castDuration = 35;
      context.triggerShake(20);
      triggerHaptic('heavy');
      playSfx('boss');
      playSfx('singularity');

      // Onda calibrada com a área de perigo telegrafada (220px)
      const novaRadius = boss.supernovaDangerRadius || 220;
      bossShockwaves.push({
        x: boss.x,
        y: boss.y,
        radius: boss.radius || 40,
        maxRadius: novaRadius,
        speed: 5.8,
        damage: Math.round(boss.damage * 0.40),
        hitPlayer: false,
        colorRgb: '224, 86, 253',
        attackName: 'Supernova Cósmica',
        sourceSkill: 'COSMIC_SUPERNOVA',
        spawnGrace: 3
      });

      // Mira inteligente: feixe estelar primário apontado diretamente na posição do jogador
      const primaryAngle = Math.atan2(context.player.y - boss.y, context.player.x - boss.x);
      if (canSpawnEnemyBullet(true)) {
        enemyBullets.push({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(primaryAngle) * 6.8,
          vy: Math.sin(primaryAngle) * 6.8,
          radius: 8.0,
          damage: Math.round(boss.damage * 0.32),
          bulletType: 'COSMIC_BOLT',
          life: 130,
          isBossProjectile: true
        });
      }

      const beamCount = 6; // Alinhado aos 6 lados do hexágono
      for (let b = 1; b < beamCount; b++) {
        if (!canSpawnEnemyBullet(true)) break;
        const bAng = primaryAngle + (b * Math.PI * 2) / beamCount;
        enemyBullets.push({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(bAng) * 5.6,
          vy: Math.sin(bAng) * 5.6,
          radius: 6.0,
          damage: Math.round(boss.damage * 0.22),
          bulletType: 'COSMIC_BOLT',
          life: 120,
          isBossProjectile: true
        });
      }

      boss.activeAttacks.push({
        type: 'SUPERNOVA_FLASH',
        x: boss.x,
        y: boss.y,
        maxR: novaRadius,
        timer: 28,
        maxTimer: 28
      });

      boss.supernovaOrbs = [];
      break;
    }
    case 'ASTRAL_BARRAGE':
      boss.castDuration = 80;
      boss.astralMeteorTimer = 0;
      boss.astralMeteorsLeft = 7;
      playSfx('boss');
      break;
    case 'SINGULARITY_IMPLOSION': {
      boss.castDuration = 24;
      boss.activeAttacks.push({
        type: 'VOID_IMPLOSION_CORE',
        x: boss.implosionX,
        y: boss.implosionY,
        radius: boss.implosionMaxRadius || 175,
        timer: 24,
        maxTimer: 24
      });
      break;
    }
    case 'THRESHOLD_BEAMS': {
      boss.castDuration = 32;
      spawnThresholdBeams(boss, context);
      break;
    }
    case 'INEXORABLE_HARVEST': {
      boss.castDuration = 45;
      startInexorableHarvest(boss, context);
      break;
    }
    case 'ABYSSAL_CYCLONE': {
      boss.actionState = SOVEREIGN_STATES.CYCLONE_CHARGE;
      boss.stateTimer = 0;
      boss.cycloneTimer = SOVEREIGN_CONFIG.CYCLONE_DURATION || 130;
      boss.cycloneMaxTimer = boss.cycloneTimer;
      boss.cycloneAfterimages = [];
      boss.cycloneSpinAngle = 0;
      playSfx('boss');
      playSfx('singularity');
      triggerHaptic('heavy');
      if (context.triggerShake) context.triggerShake(14);
      if (context.addDamageText) {
        const primaryCol = boss.phase === 3 ? '#00cec9' : (boss.phase === 2 ? '#e84393' : '#8e44ad');
        context.addDamageText(boss.x, boss.y - (boss.radius || 40) - 22, "TURBILHÃO ABISSAL!", true, primaryCol);
      }
      break;
    }
    case 'FOUR_COIL_SPIRAL': {
      boss.castDuration = SOVEREIGN_CONFIG.SPIRAL_STREAM_DURATION || 180;
      boss.spiralEjectTimer = 0;
      boss.spiralBaseAngle = boss.aimAngle || 0;
      boss.spiralRotAngle = 0;
      playSfx('boss');
      playSfx('singularity');
      triggerHaptic('heavy');
      if (context.triggerShake) context.triggerShake(12);
      if (context.addDamageText) {
        const primaryCol = boss.phase === 3 ? '#00cec9' : (boss.phase === 2 ? '#e84393' : '#8e44ad');
        context.addDamageText(boss.x, boss.y - (boss.radius || 40) - 22, "ESPIRAL DOS QUATRO HORIZONTES!", true, primaryCol);
      }
      break;
    }
    default:
      boss.castDuration = 60;
      break;
  }
}

/**
 * Dispara os Feixes do Limiar (Threshold Beams) em leque na direção do jogador.
 * Os feixes aceleram 1.25x a cada ricochete na barreira da arena.
 */
export function spawnThresholdBeams(boss, context) {
  if (!boss.thresholdBeams) boss.thresholdBeams = [];
  const { player } = context;
  const count = boss.phase === 3 ? 5 : (boss.phase === 2 ? 4 : 3);
  const baseAngle = boss.aimAngle !== undefined ? boss.aimAngle : Math.atan2(player.y - boss.y, player.x - boss.x);
  const spread = count >= 5 ? 0.44 : (count === 4 ? 0.36 : 0.28);
  const speed = SOVEREIGN_CONFIG.THRESHOLD_BEAM_SPEED || 4.625;
  const radius = SOVEREIGN_CONFIG.THRESHOLD_BEAM_RADIUS || 11;
  const damage = Math.round((boss.damage || 365) * (SOVEREIGN_CONFIG.THRESHOLD_BEAM_DAMAGE_RATIO || 0.30));
  const maxBounces = boss.phase === 3 
    ? (SOVEREIGN_CONFIG.THRESHOLD_BEAM_P3_MAX_BOUNCES || 5) 
    : (SOVEREIGN_CONFIG.THRESHOLD_BEAM_MAX_BOUNCES || 4);

  const primaryCol = boss.phase === 3 ? '#00cec9' : (boss.phase === 2 ? '#e84393' : '#8e44ad');
  const glowCol = boss.phase === 3 ? '#81ecec' : (boss.phase === 2 ? '#ff7675' : '#a29bfe');

  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? 0 : (i - (count - 1) / 2) * (spread * 2 / (count - 1));
    const ang = baseAngle + offset;
    boss.thresholdBeams.push({
      x: boss.x + Math.cos(ang) * (boss.radius || 40),
      y: boss.y + Math.sin(ang) * (boss.radius || 40),
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      speed: speed,
      radius: radius,
      damage: damage,
      bounces: 0,
      maxBounces: maxBounces,
      trail: [],
      life: 540,
      color: primaryCol,
      glowColor: glowCol,
      phase: boss.phase
    });
  }

  playSfx('warp');
  playSfx('shoot');
  triggerHaptic('heavy');
  if (context.triggerShake) context.triggerShake(10);
  if (context.addDamageText) {
    context.addDamageText(boss.x, boss.y - (boss.radius || 40) - 20, "FEIXES DO LIMIAR!", true, primaryCol);
  }
}

/**
 * Inicia a Colheita Inevitável (Inexorable Harvest):
 * Particiona a arena em um tabuleiro rúnico inscrito e programa as ondas de detonação com safe-zones.
 */
export function startInexorableHarvest(boss, context) {
  const { player } = context;
  const phase = boss.phase || 1;
  const gridSize = phase === 3 
    ? (SOVEREIGN_CONFIG.HARVEST_GRID_P3 || 7) 
    : (phase === 2 ? (SOVEREIGN_CONFIG.HARVEST_GRID_P2 || 6) : (SOVEREIGN_CONFIG.HARVEST_GRID_P1 || 5));
  const totalWaves = phase === 3 
    ? (SOVEREIGN_CONFIG.HARVEST_WAVES_P3 || 5) 
    : (phase === 2 ? (SOVEREIGN_CONFIG.HARVEST_WAVES_P2 || 4) : (SOVEREIGN_CONFIG.HARVEST_WAVES_P1 || 3));
  const warningDuration = phase === 3 
    ? (SOVEREIGN_CONFIG.HARVEST_WARNING_P3 || 48) 
    : (phase === 2 ? (SOVEREIGN_CONFIG.HARVEST_WARNING_P2 || 60) : (SOVEREIGN_CONFIG.HARVEST_WARNING_P1 || 72));
  const activeDuration = SOVEREIGN_CONFIG.HARVEST_ACTIVE_DURATION || 20;
  const miasmaDuration = SOVEREIGN_CONFIG.HARVEST_MIASMA_DURATION || 65;
  const damage = Math.round((boss.damage || 365) * (SOVEREIGN_CONFIG.HARVEST_DAMAGE_RATIO || 0.32));

  const acx = boss.arenaCenterX !== undefined ? boss.arenaCenterX : boss.x;
  const acy = boss.arenaCenterY !== undefined ? boss.arenaCenterY : boss.y;
  const ar = boss.arenaRadius || 620;
  const totalW = ar * 2;
  const tileSize = totalW / gridSize;

  // Monta a lista de tiles válidos inscritos na arena circular
  const tiles = [];
  for (let gx = 0; gx < gridSize; gx++) {
    for (let gy = 0; gy < gridSize; gy++) {
      const left = acx - ar + gx * tileSize;
      const top = acy - ar + gy * tileSize;
      const cx = left + tileSize / 2;
      const cy = top + tileSize / 2;

      // O tile só é válido se seu centro estiver confortavelmente dentro do círculo da arena
      if (Math.hypot(cx - acx, cy - acy) <= ar - 12) {
        tiles.push({
          id: `${gx}_${gy}`,
          gx, gy,
          x: left,
          y: top,
          cx, cy,
          size: tileSize,
          state: 'IDLE',
          stateTimer: 0,
          maxTimer: 1,
          hitPlayer: false
        });
      }
    }
  }

  const primaryCol = phase === 3 ? '#00cec9' : (phase === 2 ? '#e84393' : '#8e44ad');

  boss.harvestState = {
    gridSize,
    tileSize,
    totalWaves,
    currentWave: 0,
    warningDuration,
    activeDuration,
    miasmaDuration,
    damage,
    tiles,
    waveDelayTimer: 0,
    acx,
    acy,
    ar,
    color: primaryCol
  };

  triggerNextHarvestWave(boss, player);

  playSfx('singularity');
  playSfx('charge');
  triggerHaptic('heavy');
  if (context.triggerShake) context.triggerShake(12);
  if (context.addDamageText) {
    context.addDamageText(boss.x, boss.y - (boss.radius || 40) - 22, "COLHEITA INEVITÁVEL!", true, primaryCol);
  }
}


