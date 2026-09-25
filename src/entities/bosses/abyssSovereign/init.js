/**
 * src/entities/bosses/abyssSovereign/init.js
 * Inicialização e configuração do Soberano do Abismo (Boss 4 / Chefe Final).
 */
import { SOVEREIGN_STATES, SOVEREIGN_CONFIG } from './constants.js';

export function initAbyssSovereign(boss) {
  boss.phase = 1;
  boss.hasTriggeredPhase2 = false;
  boss.hasTriggeredPhase3 = false;
  boss.actionState = SOVEREIGN_STATES.SPAWN_INTRO;
  boss.stateTimer = 0;
  boss.introDuration = SOVEREIGN_CONFIG.INTRO_DURATION;
  boss.introTimer = boss.introDuration;
  boss.isTargetable = false; // Bloqueia mira e auto-fire durante a animação de entrada
  boss.titleTimer = 0; // Disparado de forma cinematográfica no Ato 3 da introdução
  boss.titleMaxTimer = 220;
  boss.hasTriggeredTitle = false;
  boss.transitionTimer = 0;
  boss.transitionWindup = 0;
  boss.transitionDetonated = false;

  boss.lastHp = boss.hp;
  boss.damageMitigation = 0.65;

  boss.staggerGauge = 0;
  boss.maxStaggerGauge = 3800;
  boss.staggerTimer = 0;
  boss.isStaggered = false;
  boss.isVulnerable = false;

  boss.anchors = [];
  boss.activeAnchorsCount = 0;

  boss.delayedActions = [];

  boss.arenaCenterX = boss.x;
  boss.arenaCenterY = boss.y;
  boss.arenaRadius = 620;
  boss.targetArenaRadius = 620;
  boss.minArenaRadius = 380;
  boss.asphyxiaTimer = 0;
  boss.horizonPulse = 0;

  boss.singularityPulseTimer = 0;
  boss.singularityOrbs = [];
  boss.orbSpawnTimer = 0;

  // Santuários / Locais de Cura dentro da Arena (Ativam aos <= 85% HP, ciclo de 10s)
  boss.healingZones = [];
  boss.healingZoneSpawnTimer = 0;
  boss.hasStartedHealingCycle = false;

  boss.attackCooldown = 18; // Primeiro ataque ocorre mais rápido após a introdução
  boss.windupTimer = 0;
  boss.windupMax = 0;
  boss.castDuration = 0;
  boss.currentSkill = null;
  boss.skillCycleIndex = 0;
  boss.attackDeck = [];
  boss.attackDeckPhase = 0;
  boss.lastUsedSkill = null;
  boss.arenaPattern = null;

  boss.beamAngle = 0;
  boss.beamRotSpeed = 0.014;
  boss.beamDir = 1;
  boss.beamHasReversed = false;
  boss.inversionFlashTimer = 0;
  boss.salvoSpiralAngle = 0;

  boss.implosionX = 0;
  boss.implosionY = 0;
  boss.implosionRadius = 175;
  boss.implosionMaxRadius = 175;
  boss.implosionLocked = false;
  boss.implosionReleased = false;
  boss.implosionSnapRing = 0;
  boss.cleaveAngle = 0;
  boss.cleaveLocked = false;

  if (!boss.damage || boss.damage < 365) {
    boss.damage = 365;
  }

  boss.idleTimer = 0;
  boss.idleDuration = 10;
  boss.idleBlend = 0;
  boss.eyeAperture = 1.0;
  boss.eyeAnimState = 'OPEN';
  boss.pupilX = 0;
  boss.pupilY = 0;
  boss.saccadeTimer = 80;
  boss.saccadeOffsetX = 0;
  boss.saccadeOffsetY = 0;
  boss.nictitatingTimer = 340;
  boss.nictitatingProgress = 0;
  boss.smoothVx = 0;
  boss.smoothVy = 0;
  boss.prevX = boss.x;
  boss.prevY = boss.y;

  boss.activeAttacks = [];
  boss.thresholdBeams = [];
  boss.harvestState = null;
  boss.cycloneAngle = 0;
  boss.cycloneTimer = 0;
  boss.cycloneAfterimages = [];
  boss.cycloneSpinAngle = 0;
  boss.spiralBlades = [];
  boss.spiralEjectTimer = 0;
  boss.spiralBaseAngle = 0;
  boss.spiralRotAngle = 0;

  // Inicialização de física inercial dos 12 membros com simetria bilateral perfeita (Fase 4)
  boss.tentaclePhysics = [];
  for (let l = 0; l < 12; l++) {
    boss.tentaclePhysics.push([
      { angleOffset: 0, angVel: 0 },
      { angleOffset: 0, angVel: 0 },
      { angleOffset: 0, angVel: 0 },
      { angleOffset: 0, angVel: 0 }
    ]);
  }
  boss.tentacleRetractProg = 0;
  boss.tentacleExtension = 1.0;

  // Micro-pontos estelares internos da esfera de obsidiana com posições fixas (Fase 1: Profundidade Cósmica)
  boss.obsidianStars = [
    { x: -0.42, y: -0.28, r: 1.1, speed: 0.018, phase: 0 },
    { x:  0.38, y: -0.35, r: 0.9, speed: 0.024, phase: 1.8 },
    { x: -0.25, y:  0.45, r: 1.2, speed: 0.015, phase: 3.4 },
    { x:  0.35, y:  0.32, r: 0.8, speed: 0.021, phase: 4.9 }
  ];

  boss.facing = 1;
  boss.hoverAngle = 0;
  boss.tentacleCycle = 0;
  boss.accretionAngle = 0;
  boss.corePulse = 0;
  boss.warpStartX = 0;
  boss.warpStartY = 0;
  boss.warpTargetX = 0;
  boss.warpTargetY = 0;

}
