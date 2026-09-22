/**
 * src/main.js
 * Loop Principal, Pipeline de Física/Combate e Sincronização Grim Cyber-Gothic.
 * Orquestrador central que coordena a simulação a 60 FPS delegando para subsistemas especializados:
 * - enemyLifecycle.js: IA dos 31 monstros, DoTs e mortes
 * - bossHazards.js: Ondas de choque, telegrafias e projéteis de chefes
 * - fieldEffects.js: Aura Sagrada, Bíblias orbitais e Miasma cáustico
 * - pickups.js: Gemas, baús 2.5D, compressão e quebra de props
 * - hudController.js: Dirty checking do HUD, Ghost Bar e timers
 */

import { 
  player, 
  resetPlayer, 
  updateSkillUI, 
  initSkillUI, 
  fireWeapons, 
  updateSpinningAxes, 
  selectedHeroKey,
  isHeroInUninterruptibleState
} from './entities/player.js';
import { inputX, inputY, resetInput } from './core/input.js';
import { rebuildSpatialGrid, clearSpatialGrid } from './core/spatialGrid.js';
import { resolveWorldPhysics } from './systems/physics.js';
import { 
  damageTexts, 
  particles, 
  bloodSplats, 
  dyingEnemies,
  addDyingEnemy,
  addDamageText, 
  createHitParticles, 
  addBloodSplat, 
  processEnemyMeleeAttacks, 
  updateCombatVisuals 
} from './systems/combat.js';
import { 
  updateProjectiles, 
  updateAcidPuddles 
} from './systems/projectiles.js';
import { groundCraters } from './render/groundCracks.js';
import { spawnSquad, spawnMobCluster, spawnProp, spawnInitialHorde } from './entities/enemies.js';
import { recordRunStats } from './systems/progression.js';
import { 
  getCurrentWave, 
  getEffectiveHordeSeconds,
  checkBossSchedule, 
  resetBossSchedule,
  resetBossesDefeated, 
  checkMiniBossSchedule, 
  resetMiniBossSchedule 
} from './systems/waves.js';
import { 
  initUI, 
  openCharacterSelect, 
  triggerDeath, 
  triggerVictory, 
  finalizeVictoryAndReturnToMenu,
  openChestModal,
  setBossRewardContext,
  ensureBossUpgradeCount,
  resetUpgradeQueue,
  pendingLevelUps,
  presentDeferredLevelUpModal
} from './systems/ui.js';
import { render } from './render/renderer.js';
import { transitionToArenaTheme, getWaveArenaTheme, resetEnvironment } from './render/environment.js';
import { playSfx, triggerHaptic, resetDeathAudioFilter } from './core/audio.js';
import { initResponsive, layoutMetrics, GRAPHICS_QUALITY, getGraphicsQuality, setGraphicsQuality, resolveTargetDpr } from './core/responsive.js';
import { clearSpriteCache } from './render/enemies/spriteCache.js';
import { devCheats } from './systems/devtools.js';
import { clearActiveBarks } from './systems/barks.js';
import { forceClosePause } from './ui/modals/pauseModal.js';
import { updateDeathSequence, resetDeathSequence, skipDeathSequence } from './render/deathAnimation.js';

// Subsistemas Especializados Extraídos
import { updateFieldEffects } from './systems/fieldEffects.js';
import { updateBossHazards } from './systems/bossHazards.js';
import { updateEnemies } from './systems/enemyLifecycle.js';
import { 
  updatePickups, 
  spawnChest as spawnChestPickup, 
  getGemConfig, 
  compressGems, 
  purgeAllNormalEnemies as purgeAllNormalEnemiesPickup, 
  triggerSuperMagnet as triggerSuperMagnetPickup 
} from './systems/pickups.js';
import { updateHUD, resetHUD, resetBossGhostHp, applyHeroVisuals } from './ui/hudController.js';
import { 
  updateWorldEvents, 
  resetWorldEvents, 
  getWorldEventSpawnRateMult, 
  initWorldEventsUI 
} from './systems/worldEvents.js';

// --- Estado Centralizado, Coleções e Eventos (src/state/*) ---
import {
  canvas,
  ctx,
  bannerCanvas,
  bannerCtx,
  setMainCanvas,
  setMainCtx,
  setBannerCanvas,
  dpr,
  viewW,
  viewH,
  calculateCameraZoom,
  CAMERA_ZOOM,
  cameraViewW,
  cameraViewH,
  gameState,
  camera,
  cinematicCamera,
  frameCount,
  spawnTimer,
  screenShake,
  freezeTimer,
  currentArenaTheme,
  lastTime,
  waveAnnouncement,
  lastAnnouncedWaveIndex,
  deferredLevelUpGraceTimer,
  setLastTime,
  resetSpawnTimer,
  setSpawnTimer,
  setCurrentArenaTheme,
  setIsWavePaused,
  triggerShake,
  decayScreenShake,
  setFrameCount,
  advanceFrameCount,
  setFreezeTimer,
  setDeferredLevelUpGraceTimer,
  setLastAnnouncedWaveIndex,
  updateDimensions,
  baseCameraZoom,
  setCameraZoom,
  resetCameraZoom,
  matchIntro,
  startMatchIntro,
  endMatchIntro,
  deathSequence,
  resetDeathSequenceState
} from './state/gameState.js';

import {
  enemies,
  props,
  drops,
  chests,
  gems,
  bullets,
  enemyBullets,
  acidPuddles,
  bossTelegraphs,
  bossProjectiles,
  bossShockwaves,
  voidVortices,
  activeBoss,
  setActiveBoss,
  canSpawnEnemyBullet,
  resetCollections
} from './state/collections.js';

export function spawnChest(x, y, tier = 'BOSS') {
  spawnChestPickup(chests, x, y, tier);
}

export function purgeAllNormalEnemies() {
  return purgeAllNormalEnemiesPickup(enemies, gems);
}

export function triggerSuperMagnet() {
  return triggerSuperMagnetPickup(gems);
}


import {
  lastAttackerName,
  deathContext,
  setLastAttackerInfo,
  setLastAttackerName
} from './state/events.js';

// Reexportações para compatibilidade retroativa absoluta
export {
  canvas,
  ctx,
  bannerCanvas,
  bannerCtx,
  setMainCtx,
  setBannerCanvas,
  dpr,
  viewW,
  viewH,
  calculateCameraZoom,
  CAMERA_ZOOM,
  cameraViewW,
  cameraViewH,
  gameState,
  camera,
  cinematicCamera,
  baseCameraZoom,
  setCameraZoom,
  resetCameraZoom,
  matchIntro,
  startMatchIntro,
  endMatchIntro,
  deathSequence,
  frameCount,
  spawnTimer,
  screenShake,
  freezeTimer,
  currentArenaTheme,
  lastTime,
  waveAnnouncement,
  lastAnnouncedWaveIndex,
  deferredLevelUpGraceTimer,
  setLastTime,
  resetSpawnTimer,
  setCurrentArenaTheme,
  setIsWavePaused,
  triggerShake,
  enemies,
  props,
  drops,
  chests,
  gems,
  bullets,
  enemyBullets,
  acidPuddles,
  bossTelegraphs,
  bossProjectiles,
  bossShockwaves,
  voidVortices,
  activeBoss,
  setActiveBoss,
  canSpawnEnemyBullet,
  lastAttackerName,
  deathContext,
  setLastAttackerInfo,
  setLastAttackerName,
  getGemConfig
};


export {
  damageTexts,
  particles,
  bloodSplats,
  dyingEnemies,
  addDamageText,
  createHitParticles,
  addBloodSplat,
  processEnemyMeleeAttacks
} from './systems/combat.js';

export {
  GRAPHICS_QUALITY,
  getGraphicsQuality,
  setGraphicsQuality,
  resolveTargetDpr
};

export function resize() {
  const currentCanvas = canvas || document.getElementById('game-canvas');
  if (currentCanvas && !canvas) {
    setMainCanvas(currentCanvas);
  }
  if (currentCanvas && !ctx) {
    setMainCtx(currentCanvas.getContext('2d', { alpha: false }));
  }

  const currentBannerCanvas = bannerCanvas || document.getElementById('banner-canvas');
  if (currentBannerCanvas && !bannerCanvas) {
    setBannerCanvas(currentBannerCanvas);
  }

  if (!currentCanvas) return;

  const currentDpr = layoutMetrics.dpr || resolveTargetDpr();
  const curW = layoutMetrics.viewW || window.innerWidth;
  const curH = layoutMetrics.viewH || window.innerHeight;
  updateDimensions(curW, curH, currentDpr);

  currentCanvas.width = Math.floor(viewW * dpr);
  currentCanvas.height = Math.floor(viewH * dpr);
  currentCanvas.style.width = '100%';
  currentCanvas.style.height = '100%';

  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  if (currentBannerCanvas) {
    currentBannerCanvas.width = Math.floor(viewW * dpr);
    currentBannerCanvas.height = Math.floor(viewH * dpr);
    currentBannerCanvas.style.width = '100%';
    currentBannerCanvas.style.height = '100%';

    if (bannerCtx) {
      bannerCtx.imageSmoothingEnabled = true;
      bannerCtx.imageSmoothingQuality = 'high';
    }
  }

  // Invalida e sincroniza o atlas de monstros com a nova resolução/DPR
  clearSpriteCache();
}

initResponsive(() => {
  resize();
});

let cachedFreezeOverlay = null;
let isFreezeOverlayVisible = false;

export function warpToWaveTime(targetWaveIndex) {
  const waveTimes = {
    1: 0,
    2: 25,
    3: 55,
    4: 90,
    5: 130,
    6: 170,
    7: 210,
    8: 250,
    9: 290,
    10: 330
  };
  const targetSec = waveTimes[targetWaveIndex] !== undefined ? waveTimes[targetWaveIndex] : 0;
  setFrameCount(targetSec * 60);
  setLastAnnouncedWaveIndex(0);
  playSfx('level');
}

export function terminateMatch() {
  gameState.isInMatch = false;
  gameState.isPaused = false;
  gameState.isDead = false;
  gameState.isWon = false;
  gameState.isWavePaused = false;
  gameState.kills = 0;

  setFrameCount(0);
  setSpawnTimer(0);
  triggerShake(0);
  setFreezeTimer(0);

  // Limpa os canvas do jogo para não exibir a arena ou banners atrás do menu
  const gameCanvas = document.getElementById('game-canvas');
  if (gameCanvas) {
    const gc = gameCanvas.getContext('2d');
    if (gc) gc.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  }
  const bCanvas = bannerCanvas || document.getElementById('banner-canvas');
  if (bCanvas) {
    const bc = bCanvas.getContext('2d');
    if (bc) bc.clearRect(0, 0, bCanvas.width, bCanvas.height);
  }

  // 1. Limpeza total de entidades vivas e ativas da partida
  enemies.length = 0;
  dyingEnemies.length = 0;
  bullets.length = 0;
  enemyBullets.length = 0;
  acidPuddles.length = 0;
  groundCraters.length = 0;
  gems.length = 0;
  particles.length = 0;
  damageTexts.length = 0;
  props.length = 0;
  drops.length = 0;
  chests.length = 0;
  bloodSplats.length = 0;
  bossTelegraphs.length = 0;
  bossProjectiles.length = 0;
  bossShockwaves.length = 0;
  voidVortices.length = 0;
  setActiveBoss(null);

  // 2. Limpeza da Spatial Grid (Zero memory leak)
  clearSpatialGrid();

  // 3. Resets de agendamentos, barks e câmeras
  clearActiveBarks();
  resetBossSchedule();
  resetMiniBossSchedule();
  resetUpgradeQueue();
  setCurrentArenaTheme('IVORY_OSSUARY');
  cinematicCamera.isCinematic = false;
  cinematicCamera.returningToPlayer = false;
  cinematicCamera.letterboxProgress = 0;
  endMatchIntro();
  resetDeathSequence();
  const hudElem = document.getElementById('hud');
  if (hudElem) {
    hudElem.classList.remove('hud-cinematic-intro');
  }
  const skillBtn = document.getElementById('skill-btn-container');
  if (skillBtn) {
    skillBtn.classList.remove('hud-cinematic-intro');
  }
  resetEnvironment();
  resetWorldEvents();

  // 4. Reset completo do jogador
  resetPlayer(selectedHeroKey);
  player.bossIFrames = 0;
  player.isPhasing = false;
  player.alchemistBuffTimer = 0;
  player.alchemistSkillDisoriented = false;

  // 5. Reset de inputs
  resetInput();

  setLastAttackerInfo({
    name: 'A Horda do Abismo',
    category: 'HORDE',
    attackName: 'Golpe Devorador',
    damage: 0,
    enemyType: null,
    color: '#e74c3c',
    tacticTip: ''
  });

  waveAnnouncement.timer = 0;
  waveAnnouncement.index = 0;
  waveAnnouncement.name = '';
  setLastAnnouncedWaveIndex(0);
  setDeferredLevelUpGraceTimer(0);

  // 6. Reset do HUD e overlays visuais
  resetHUD(player.maxHp);
  const waveCard = document.getElementById('hud-wave-card');
  if (waveCard) waveCard.classList.remove('banner-suppressed');
  resetDeathAudioFilter();

  const canvasElem = document.getElementById('game-canvas');
  if (canvasElem) {
    canvasElem.classList.remove('canvas-death-frozen');
    canvasElem.classList.remove('canvas-stasis-frozen');
  }

  const bloodFilter = document.getElementById('blood-screen-filter');
  if (bloodFilter) bloodFilter.classList.remove('active');

  const victoryFade = document.getElementById('victory-fade-overlay');
  if (victoryFade) victoryFade.classList.remove('active');

  const freezeOverlay = document.getElementById('freeze-overlay');
  if (freezeOverlay) freezeOverlay.style.display = 'none';
  isFreezeOverlayVisible = false;

  updateSkillUI();

  const hideEl = id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('modal-hidden');
      el.style.setProperty('display', 'none', 'important');
      el.style.display = 'none';
    }
  };

  hideEl('boss-hud');
  hideEl('freeze-overlay');
  hideEl('death-modal');
  hideEl('victory-modal');
  hideEl('chest-modal');
  hideEl('upgrade-modal');

  const bossHud = document.getElementById('boss-hud');
  if (bossHud) {
    bossHud.style.display = 'none';
    bossHud.classList.remove('enraged', 'hit-shake', 'hit-flash');
  }
  document.body.classList.remove('in-game');
  const hud = document.getElementById('hud');
  if (hud) {
    hud.classList.add('hud-hidden');
    hud.classList.remove('boss-active');
    hud.style.setProperty('display', 'none', 'important');
    hud.style.display = 'none';
  }

  const bossHpFill = document.getElementById('boss-hp-fill');
  if (bossHpFill) {
    bossHpFill.style.background = '';
    bossHpFill.style.boxShadow = '';
    bossHpFill.style.width = '100%';
  }

  const bossHpGhostFill = document.getElementById('boss-hp-ghost-fill');
  if (bossHpGhostFill) {
    bossHpGhostFill.style.transition = 'none';
    bossHpGhostFill.style.width = '100%';
  }

  resetBossGhostHp();

  // 7. Encerramento forçado e desvinculação de eventos de pausa
  forceClosePause();
}

export function resetGame() {
  terminateMatch();

  gameState.isInMatch = true;
  gameState.isPaused = false;
  setLastTime(performance.now());
  document.body.classList.add('in-game');

  const hud = document.getElementById('hud');
  if (hud) {
    hud.classList.remove('hud-hidden');
    hud.style.removeProperty('display');
    hud.style.display = 'flex';
  }

  const waveCard = document.getElementById('hud-wave-card');
  if (waveCard) {
    waveCard.classList.add('banner-suppressed');
  }

  resize();

  // Spawna a horda inicial ativa imediatamente nas bordas da arena
  spawnInitialHorde();

  // Inicia a introdução cinematográfica com câmera aproximada no herói
  startMatchIntro();

  if (hud) {
    hud.classList.add('hud-cinematic-intro');
  }
  const skillBtn = document.getElementById('skill-btn-container');
  if (skillBtn) {
    skillBtn.classList.add('hud-cinematic-intro');
  }

  // Toque sutil atmosférico de abertura dos portões
  playSfx('warp', 0.5);

  const hideEl = id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('modal-hidden');
      el.style.setProperty('display', 'none', 'important');
      el.style.display = 'none';
    }
  };

  hideEl('char-modal');
  hideEl('talents-modal');
  hideEl('achievements-modal');
  hideEl('bestiary-modal');
  hideEl('boss-select-modal');
}

function update(dt) {
  if (typeof devCheats !== 'undefined') {
    if (devCheats.godMode && player) {
      player.hp = player.maxHp;
      player.iFrames = 60;
    }
    if (devCheats.zeroCooldown && player) {
      player.skillCd = 0;
    }
  }

  // =========================================================================
  // INTRODUÇÃO CINEMATOGRÁFICA DE INÍCIO DE PARTIDA
  // Durante a introdução:
  // 1. O relógio da partida (frameCount/segundos) NÃO inicia nem avança (fica 00:00).
  // 2. As hordas NÃO se movem, não atacam e novos monstros não surgem.
  // 3. O jogador permanece em pose normal de descanso sem animações de ult/skill.
  // 4. A câmera realiza o afastamento gradual suave revelando a arena.
  // =========================================================================
  if (matchIntro.active) {
    // Detecta intenção de movimento ou toque do jogador para acelerar suavemente (skip fluido)
    const hasMoveInput = (Math.abs(inputX) > 0.08 || Math.abs(inputY) > 0.08);
    if (hasMoveInput && !matchIntro.skipped) {
      matchIntro.skipped = true;
      if (matchIntro.timer < matchIntro.holdDuration) {
        matchIntro.timer = matchIntro.holdDuration;
      }
    }

    // Cronômetro exclusivo da introdução cinematográfica
    matchIntro.timer += matchIntro.skipped ? dt * 3.5 : dt;

    const zoomPhase = Math.max(1, matchIntro.duration - matchIntro.holdDuration);
    const elapsedZoom = Math.max(0, matchIntro.timer - matchIntro.holdDuration);
    const rawProgress = Math.min(1.0, elapsedZoom / zoomPhase);

    // Curva cúbica suave (smoothstep: 3t^2 - 2t^3)
    const easedProgress = rawProgress * rawProgress * (3 - 2 * rawProgress);
    matchIntro.zoomProgress = easedProgress;

    // Recuo gradual e cinematográfico do zoom da câmera até o zoom da arena
    const startZoom = baseCameraZoom * matchIntro.startZoomMult;
    const curZoom = startZoom + (baseCameraZoom - startZoom) * easedProgress;
    setCameraZoom(curZoom);

    // Câmera perfeitamente centrada no herói
    camera.x = player.x - cameraViewW / 2;
    camera.y = player.y - cameraViewH / 2;

    // Barras pretas de cinema (letterbox) com friso dourado
    const targetLetterbox = rawProgress < 0.60 ? 1.0 : Math.max(0, 1.0 - (rawProgress - 0.60) / 0.40);
    cinematicCamera.letterboxProgress += (targetLetterbox - cinematicCamera.letterboxProgress) * (1 - Math.pow(1 - 0.08, dt));

    // Fade-in suave do HUD e do botão de ULT nos 35% finais do afastamento
    if (rawProgress >= 0.65) {
      const hudEl = document.getElementById('hud');
      if (hudEl && hudEl.classList.contains('hud-cinematic-intro')) {
        hudEl.classList.remove('hud-cinematic-intro');
      }
      const skillBtn = document.getElementById('skill-btn-container');
      if (skillBtn && skillBtn.classList.contains('hud-cinematic-intro')) {
        skillBtn.classList.remove('hud-cinematic-intro');
      }
    }

    // Finalização da introdução cinematográfica
    if (matchIntro.timer >= matchIntro.duration) {
      endMatchIntro();
      cinematicCamera.letterboxProgress = 0;
      cinematicCamera.isCinematic = false;
      const hudEl = document.getElementById('hud');
      if (hudEl) hudEl.classList.remove('hud-cinematic-intro');
      const skillBtn = document.getElementById('skill-btn-container');
      if (skillBtn) skillBtn.classList.remove('hud-cinematic-intro');
    }

    // Retorna imediatamente: durante a introdução o tempo não corre, inimigos não se movem e armas não disparam!
    return;
  }

  advanceFrameCount(dt);
  const seconds = Math.floor(frameCount / 60);
  const hordeSeconds = getEffectiveHordeSeconds(seconds);
  const currentWave = getCurrentWave(hordeSeconds);

  // Gatilho de Anúncio Cinematográfico de Transição de Onda
  if (!activeBoss && currentWave && currentWave.index !== lastAnnouncedWaveIndex && !matchIntro.active) {
    setLastAnnouncedWaveIndex(currentWave.index);
    waveAnnouncement.name = currentWave.name;
    waveAnnouncement.index = currentWave.index;
    waveAnnouncement.timer = 180;
    waveAnnouncement.maxTimer = 180;
    triggerShake(4);
    recordRunStats({ wave: currentWave.index });
  }
  if (waveAnnouncement.timer > 0) {
    waveAnnouncement.timer -= dt;
  }

  // Transição suave de arena a cada 3 ondas
  if (!activeBoss) {
    const targetTheme = getWaveArenaTheme(currentWave.index);
    if (targetTheme !== currentArenaTheme) {
      transitionToArenaTheme(targetTheme);
    }
  }

  decayScreenShake(dt);

  if (freezeTimer > 0) {
    setFreezeTimer(freezeTimer - dt);
    if (!isFreezeOverlayVisible) {
      if (!cachedFreezeOverlay) cachedFreezeOverlay = document.getElementById('freeze-overlay');
      if (cachedFreezeOverlay) cachedFreezeOverlay.style.display = 'block';
      isFreezeOverlayVisible = true;
    }
  } else if (isFreezeOverlayVisible) {
    if (!cachedFreezeOverlay) cachedFreezeOverlay = document.getElementById('freeze-overlay');
    if (cachedFreezeOverlay) cachedFreezeOverlay.style.display = 'none';
    isFreezeOverlayVisible = false;
  }

  // Timers do Jogador e Sincronização de Estados Reativos
  if (player.iFrames > 0) player.iFrames = Math.max(0, player.iFrames - dt);
  if (player.bossIFrames > 0) player.bossIFrames = Math.max(0, player.bossIFrames - dt);
  if (player.skillCd > 0) player.skillCd = Math.max(0, player.skillCd - dt);
  if (player.staffCastTimer > 0) player.staffCastTimer = Math.max(0, player.staffCastTimer - dt);
  if (player.potionThrowTimer > 0) player.potionThrowTimer = Math.max(0, player.potionThrowTimer - dt);
  if (player.alchemistSkillTimer > 0) player.alchemistSkillTimer = Math.max(0, player.alchemistSkillTimer - dt);

  if (player.invisTimer > 0) {
    player.invisTimer = Math.max(0, player.invisTimer - dt);
    player.isPhasing = player.invisTimer > 0;
  } else {
    player.isPhasing = false;
  }

  if (player.berserkTimer > 0) {
    player.berserkTimer = Math.max(0, player.berserkTimer - dt);
    if (Math.floor(frameCount) % 6 === 0) {
      createHitParticles(player.x + (Math.random() - 0.5) * 24, player.y + (Math.random() - 0.5) * 24, '#e74c3c', 1);
    }
  }

  if (selectedHeroKey === 'ALCHEMIST') {
    // Escape de vapor contínuo da retorta dorsal
    const ventFrequency = (player.alchemistSkillTimer > 0 || (player.alchemistBuffTimer || 0) > 0) ? 3 : (player.isMoving ? 14 : 34);
    if (Math.floor(frameCount) % ventFrequency === 0) {
      const ventX = player.x - player.facing * 9;
      const ventY = player.y - 14;
      const pColor = (player.alchemistSkillTimer > 0 || (player.alchemistBuffTimer || 0) > 0)
        ? (player.evolvedPotion ? '#e056fd' : '#d6a2e8')
        : (player.evolvedPotion ? '#a29bfe' : '#9b59b6');
      createHitParticles(ventX, ventY, pColor, (player.alchemistSkillTimer > 0) ? 3 : 1);
    }

    // Passiva: Decaimento e Partículas do Vapor Estimulante Móvel (+15% vel)
    if (player.alchemistBuffTimer > 0) {
      player.alchemistBuffTimer -= dt;
      if (Math.floor(frameCount) % 6 === 0) {
        createHitParticles(player.x + (Math.random() - 0.5) * 14, player.y + 6, '#d6a2e8', 1);
      }
    }

    // Habilidade: Reagente Volátil (0.6s de imunidade de fuga e fumaça desorientadora em 120px)
    if (player.alchemistSkillTimer > 0 && !player.alchemistSkillDisoriented) {
      player.alchemistSkillDisoriented = true;
      player.iFrames = Math.max(player.iFrames, 36);
      player.bossIFrames = Math.max(player.bossIFrames, 36);
      triggerShake(5);
      playSfx('acid');
      createHitParticles(player.x, player.y, '#a55eea', 16);
      createHitParticles(player.x, player.y, '#55efc4', 12);

      for (let k = 0; k < enemies.length; k++) {
        const en = enemies[k];
        if (!en || en.hp <= 0 || en.isBoss) continue;
        const edx = en.x - player.x;
        const edy = en.y - player.y;
        if (edx * edx + edy * edy < 120 * 120) {
          en.confusedTimer = 110;
          addDamageText(en.x, en.y - 10, "DESORIENTADO!", false, '#a55eea');
          createHitParticles(en.x, en.y, '#9b59b6', 5);
        }
      }
    } else if (player.alchemistSkillTimer <= 0) {
      player.alchemistSkillDisoriented = false;
    }
  }

  let isSlowed = false;
  if (player.slowTimer > 0) {
    player.slowTimer -= dt;
    isSlowed = true;
  }
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.eliteMod === 'FROST') {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      if (dx * dx + dy * dy < 125 * 125) {
        isSlowed = true;
        break;
      }
    }
  }

  let insideVortex = false;
  for (let i = voidVortices.length - 1; i >= 0; i--) {
    const v = voidVortices[i];
    v.life -= dt;

    const vdx = v.x - player.x;
    const vdy = v.y - player.y;
    const vDistSq = vdx * vdx + vdy * vdy;
    const vDist = Math.sqrt(vDistSq);

    if (vDist < 240 && vDist > 12) {
      player.x += (vdx / vDist) * 0.95 * dt;
      player.y += (vdy / vDist) * 0.95 * dt;
    }

    if (vDist < v.radius) {
      insideVortex = true;
      v.tickTimer = (v.tickTimer || 0) + dt;
      if (v.tickTimer > 24 && player.bossIFrames <= 0) {
        v.tickTimer = 0;
        player.hp -= v.damage;
        player.bossIFrames = 15;
        setLastAttackerInfo({
          name: "Vórtice do Vazio",
          category: "HAZARD",
          attackName: "Colapso Gravitacional",
          damage: v.damage,
          color: '#9b59b6',
          tacticTip: "Evite o epicentro da distorção espacial para não sofrer drenagem acelerada de vida."
        });
        triggerShake(5);
        playSfx('hit');
        addDamageText(player.x, player.y, `-${v.damage}`, false, '#9b59b6');
        createHitParticles(player.x, player.y, '#8e44ad', 4);
        if (player.hp <= 0) {
          player.hp = 0;
          triggerDeath();
          return;
        }
      }
    }

    if (v.life <= 0) voidVortices.splice(i, 1);
  }

  const baseSpd = (typeof player.baseSpeed === 'number' && !isNaN(player.baseSpeed)) ? player.baseSpeed : (player.speed || 3.2);
  let currentSpeed = isSlowed ? baseSpd * 0.65 : (insideVortex ? baseSpd * 0.72 : baseSpd);
  if (player.invisTimer > 0) {
    currentSpeed *= 2;
  }
  if (player.alchemistBuffTimer > 0) {
    currentSpeed *= 1.15;
  }
  player.speed = currentSpeed;

  if (player.dashDuration > 0) {
    player.dashDuration -= dt;
    setDeferredLevelUpGraceTimer(10);

    const inputLen = Math.hypot(inputX, inputY);
    if (inputLen > 0.05) {
      const targetAng = Math.atan2(inputY, inputX);
      const curAng = Math.atan2(player.dashVy || 0, player.dashVx || 1);
      let diff = targetAng - curAng;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      // Taxa de viragem com inércia e torque para Sir Roland (~14 rad/s)
      const maxTurn = 0.23 * dt;
      const turn = Math.max(-maxTurn, Math.min(maxTurn, diff));
      const nextAng = curAng + turn;

      player.dashVx = Math.cos(nextAng) * 16;
      player.dashVy = Math.sin(nextAng) * 16;
      if (Math.abs(player.dashVx) > 0.1) {
        player.facing = player.dashVx >= 0 ? 1 : -1;
      }
    }

    player.vx = player.dashVx;
    player.vy = player.dashVy;
    player.x += player.dashVx * dt;
    player.y += player.dashVy * dt;
    createHitParticles(player.x, player.y, '#f1c40f', 3);
    createHitParticles(player.x, player.y, '#ffffff', 2);
    if (Math.floor(frameCount) % 3 === 0) {
      createHitParticles(player.x, player.y, '#00d2d3', 2);
    }

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || e.hp <= 0 || e.isTargetable === false) continue;
      if (e.isBoss && (e.mistState === 'DASHING' || e.actionState === 'SPAWN_INTRO' || e.isTargetable === false)) continue;
      if (e.isBossSubTarget && (!e.active || e.isTargetable === false || (e.parentBoss && (e.parentBoss.actionState === 'SPAWN_INTRO' || e.parentBoss.isTargetable === false)))) continue;

      const dSq = (e.x - player.x) ** 2 + (e.y - player.y) ** 2;
      if (dSq < (player.radius + e.radius + 20) ** 2) {
        let impactDmg = player.damage * 1.3;
        if (e.isBoss || e.isBossSubTarget) {
          impactDmg *= 1.25;
          if (e.isVulnerable) impactDmg *= 1.25;
        }
        e.hp -= impactDmg;
        e.hitFlash = 5;
        addDamageText(e.x, e.y, Math.round(impactDmg), true, '#f1c40f');
        createHitParticles(e.x, e.y, '#f1c40f', 4);
        createHitParticles(e.x, e.y, '#ffffff', 3);

        if (player.slowChance > 0 && Math.random() < player.slowChance) {
          e.slowTimer = 150;
          e.slowFactor = 0.55;
          createHitParticles(e.x, e.y, '#74b9ff', 2);
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

    if (player.dashDuration <= 0) {
      triggerShake(13);
      playSfx('boss');
      triggerHaptic('heavy');
      createHitParticles(player.x, player.y, '#f1c40f', 24);
      createHitParticles(player.x, player.y, '#ffffff', 18);
      createHitParticles(player.x, player.y, '#00cec9', 14);
    }
  } else if (player.ignisDashDuration > 0) {
    player.ignisDashDuration -= dt;
    setDeferredLevelUpGraceTimer(10);

    const inputLen = Math.hypot(inputX, inputY);
    if (inputLen > 0.05) {
      const targetAng = Math.atan2(inputY, inputX);
      const curAng = Math.atan2(player.ignisDashVy || 0, player.ignisDashVx || 1);
      let diff = targetAng - curAng;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      // Taxa de viragem rápida e afiada para Ignis (~32 rad/s)
      const maxTurn = 0.52 * dt;
      const turn = Math.max(-maxTurn, Math.min(maxTurn, diff));
      const nextAng = curAng + turn;

      player.ignisDashVx = Math.cos(nextAng) * 15.5;
      player.ignisDashVy = Math.sin(nextAng) * 15.5;
      if (Math.abs(player.ignisDashVx) > 0.1) {
        player.facing = player.ignisDashVx >= 0 ? 1 : -1;
      }
    }

    player.vx = player.ignisDashVx;
    player.vy = player.ignisDashVy;
    player.x += player.ignisDashVx * dt;
    player.y += player.ignisDashVy * dt;
    player.iFrames = Math.max(player.iFrames, 8);

    createHitParticles(player.x, player.y, '#ffffff', 2);
    createHitParticles(player.x, player.y, '#f1c40f', 3);
    createHitParticles(player.x, player.y, '#e67e22', 2);

    if (Math.floor(frameCount) % 2 === 0) {
      acidPuddles.push({
        x: player.x,
        y: player.y,
        radius: 38,
        life: 280,
        maxLife: 280,
        isFire: true
      });
    }

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || e.hp <= 0 || e.isTargetable === false) continue;
      if (e.isBoss && (e.mistState === 'DASHING' || e.actionState === 'SPAWN_INTRO' || e.isTargetable === false)) continue;
      if (e.isBossSubTarget && (!e.active || e.isTargetable === false || (e.parentBoss && (e.parentBoss.actionState === 'SPAWN_INTRO' || e.parentBoss.isTargetable === false)))) continue;

      const dSq = (e.x - player.x) ** 2 + (e.y - player.y) ** 2;
      if (dSq < (player.radius + e.radius + 18) ** 2) {
        let impactDmg = player.damage * 1.6;
        if (e.isBoss || e.isBossSubTarget) {
          impactDmg *= 1.25;
          if (e.isVulnerable) impactDmg *= 1.25;
        }
        e.hp -= impactDmg;
        e.hitFlash = 4;
        addDamageText(e.x, e.y, Math.round(impactDmg), true, '#f1c40f');
        createHitParticles(e.x, e.y, '#f1c40f', 3);
      }
    }

    if (player.ignisDashDuration <= 0) {
      triggerShake(11);
      playSfx('boss');
      triggerHaptic('heavy');
      createHitParticles(player.x, player.y, '#ffffff', 18);
      createHitParticles(player.x, player.y, '#f1c40f', 24);
      createHitParticles(player.x, player.y, '#e74c3c', 18);

      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        const edx = e.x - player.x;
        const edy = e.y - player.y;
        const dist = Math.hypot(edx, edy);
        if (dist < 85) {
          const nx = dist > 0.001 ? edx / dist : 1;
          const ny = dist > 0.001 ? edy / dist : 0;
          e.x += nx * 24;
          e.y += ny * 24;
          e.hitFlash = 5;
        }
      }
    }
  } else {
    player.isMoving = (inputX * inputX + inputY * inputY) > 0.01;
    if (player.isMoving) {
      player.walkCycle += 0.22 * dt;
      if (Math.abs(inputX) > 0.05) player.facing = inputX > 0 ? 1 : -1;
    } else {
      player.walkCycle = 0;
    }

    // Curva cinética assimétrica: Micro-Aceleração rápida (~40ms) e Parada com micro-skid suave
    const targetVx = inputX * player.speed;
    const targetVy = inputY * player.speed;

    if (player.isMoving) {
      // Reversão de marcha (pivot): acelera a frenagem para resposta instantânea
      const reversingX = (targetVx > 0 && (player.vx || 0) < 0) || (targetVx < 0 && (player.vx || 0) > 0);
      const reversingY = (targetVy > 0 && (player.vy || 0) < 0) || (targetVy < 0 && (player.vy || 0) > 0);

      const factorX = reversingX ? (1 - Math.pow(0.04, dt)) : (1 - Math.pow(0.20, dt));
      const factorY = reversingY ? (1 - Math.pow(0.04, dt)) : (1 - Math.pow(0.20, dt));

      player.vx = (player.vx || 0) + (targetVx - (player.vx || 0)) * factorX;
      player.vy = (player.vy || 0) + (targetVy - (player.vy || 0)) * factorY;
    } else {
      // Desaceleração quase instantânea ao soltar os controles (sem efeito de patinação)
      const stopFactor = 1 - Math.pow(0.12, dt);
      player.vx = (player.vx || 0) * (1 - stopFactor);
      player.vy = (player.vy || 0) * (1 - stopFactor);
      if (Math.abs(player.vx) < 0.02) player.vx = 0;
      if (Math.abs(player.vy) < 0.02) player.vy = 0;
    }

    player.x += (player.vx || 0) * dt;
    player.y += (player.vy || 0) * dt;
  }

  // Knockback e Amortecimento do Jogador
  player.x += (player.pushVx || 0) * dt;
  player.y += (player.pushVy || 0) * dt;
  const friction = Math.pow(0.80, dt);
  player.pushVx = (player.pushVx || 0) * friction;
  player.pushVy = (player.pushVy || 0) * friction;
  if (Math.abs(player.pushVx) < 0.05) player.pushVx = 0;
  if (Math.abs(player.pushVy) < 0.05) player.pushVy = 0;

  // Barreira Física de Contenção Dimensional (Impede fuga do Altar do Fim dos Tempos)
  if (activeBoss && (activeBoss.bossId === 4 || activeBoss.arenaCenterX !== undefined)) {
    const acx = activeBoss.arenaCenterX;
    const acy = activeBoss.arenaCenterY;
    const ar = activeBoss.arenaRadius || 620;
    const maxR = ar - (player.radius || 14) - 2;
    const pdx = player.x - acx;
    const pdy = player.y - acy;
    const pDist = Math.hypot(pdx, pdy) || 1;

    if (pDist > maxR) {
      player.x = acx + (pdx / pDist) * maxR;
      player.y = acy + (pdy / pDist) * maxR;

      const nx = pdx / pDist;
      const ny = pdy / pDist;

      // Deslizamento tangencial suave na barreira da arena
      const vDot = (player.vx || 0) * nx + (player.vy || 0) * ny;
      if (vDot > 0) {
        player.vx -= vDot * nx;
        player.vy -= vDot * ny;
      }

      const pushDot = (player.pushVx || 0) * nx + (player.pushVy || 0) * ny;
      if (pushDot > 0) {
        player.pushVx -= pushDot * nx;
        player.pushVy -= pushDot * ny;
      }
      const dashDot = (player.dashVx || 0) * nx + (player.dashVy || 0) * ny;
      if (dashDot > 0) {
        player.dashVx -= dashDot * nx;
        player.dashVy -= dashDot * ny;
      }
      const ignisDot = (player.ignisDashVx || 0) * nx + (player.ignisDashVy || 0) * ny;
      if (ignisDot > 0) {
        player.ignisDashVx -= ignisDot * nx;
        player.ignisDashVy -= ignisDot * ny;
      }

      activeBoss.barrierContact = 1.0;
      activeBoss.barrierContactAngle = Math.atan2(pdy, pdx);

      if (Math.floor(frameCount) % 4 === 0) {
        createHitParticles(player.x + nx * 6, player.y + ny * 6, activeBoss.phase === 3 ? '#00cec9' : '#e84393', 3);
        createHitParticles(player.x + nx * 6, player.y + ny * 6, '#ffffff', 2);
      }

      if (!activeBoss.lastBarrierSound || frameCount - activeBoss.lastBarrierSound > 22) {
        activeBoss.lastBarrierSound = frameCount;
        playSfx('forcefield');
        triggerHaptic('light');
      }
    }
  }

  // Verificação e Liberação de Level-Up Diferido (Pós-ULT)
  if (!isHeroInUninterruptibleState() && pendingLevelUps > 0 && !gameState.isPaused && !gameState.isDead && !gameState.isWon) {
    if (deferredLevelUpGraceTimer > 0) {
      setDeferredLevelUpGraceTimer(deferredLevelUpGraceTimer - dt);
    } else {
      presentDeferredLevelUpModal();
    }
  }

  // Câmera Cinematográfica Dinâmica e Letterbox
  const isBossSpawning = !!(activeBoss && activeBoss.actionState === 'SPAWN_INTRO');
  cinematicCamera.isCinematic = isBossSpawning;

  let focusX = player.x;
  let focusY = player.y;

  if (isBossSpawning) {
    focusX = activeBoss.x;
    focusY = activeBoss.y;
    cinematicCamera.returningToPlayer = true;
    player.iFrames = Math.max(player.iFrames, 12);
  }

  const targetCamX = focusX - cameraViewW / 2;
  const targetCamY = focusY - cameraViewH / 2;

  if (isBossSpawning) {
    const panFactor = 1 - Math.pow(1 - 0.045, dt);
    camera.x += (targetCamX - camera.x) * panFactor;
    camera.y += (targetCamY - camera.y) * panFactor;
  } else if (cinematicCamera.returningToPlayer) {
    const distToPlayer = Math.hypot(targetCamX - camera.x, targetCamY - camera.y);
    player.iFrames = Math.max(player.iFrames, 6);
    if (distToPlayer < 2.0) {
      cinematicCamera.returningToPlayer = false;
      camera.x = targetCamX;
      camera.y = targetCamY;
    } else {
      const returnFactor = 1 - Math.pow(1 - 0.08, dt);
      camera.x += (targetCamX - camera.x) * returnFactor;
      camera.y += (targetCamY - camera.y) * returnFactor;
    }
  } else {
    camera.x = targetCamX;
    camera.y = targetCamY;
  }

  const targetLetterbox = isBossSpawning ? 1.0 : 0.0;
  cinematicCamera.letterboxProgress += (targetLetterbox - cinematicCamera.letterboxProgress) * (1 - Math.pow(1 - 0.08, dt));

  checkBossSchedule(seconds);
  checkMiniBossSchedule(seconds);

  // 1. Spawner de Hordas, Esquadrões e Props
  if (!gameState.isWavePaused) {
    setSpawnTimer(spawnTimer + dt * getWorldEventSpawnRateMult());
    if (spawnTimer >= currentWave.rate) {
      const hasSquads = currentWave.allowedSquads && currentWave.allowedSquads.length > 0;
      const hasTypes = currentWave.types && currentWave.types.length > 0;
      const spawnSquadChosen = hasSquads && (!hasTypes || Math.random() < 0.65);

      if (spawnSquadChosen) {
        const squadKey = currentWave.allowedSquads[Math.floor(Math.random() * currentWave.allowedSquads.length)];
        spawnSquad(squadKey, currentWave.eliteChance);
      } else if (hasTypes) {
        const chosenType = currentWave.types[Math.floor(Math.random() * currentWave.types.length)];
        const count = currentWave.clusterSize 
          ? Math.floor(Math.random() * (currentWave.clusterSize[1] - currentWave.clusterSize[0] + 1)) + currentWave.clusterSize[0]
          : 5;
        spawnMobCluster(chosenType, count, currentWave.eliteChance);
      }
      if (Math.random() < 0.26) spawnProp();
      setSpawnTimer(0);
    }
  }

  // 2. Reconstrução Única da Spatial Grid por quadro (alimenta armas, auras e física)
  if (!matchIntro.active) {
    player.weapons.forEach(w => { w.timer += dt; });
    rebuildSpatialGrid(enemies);
    fireWeapons();
    updateSpinningAxes(dt);
  } else {
    // Durante o zoom-out de introdução, mantém armas preparadas para disparar logo na abertura
    player.weapons.forEach(w => { w.timer = Math.max(w.timer, (w.cooldown || 60) * 0.9); });
    rebuildSpatialGrid(enemies);
  }

  // 3. Efeitos de Campo (Aura Sagrada, Bíblias Orbitais e Miasma)
  updateFieldEffects(dt, {
    player,
    enemies,
    enemyBullets,
    acidPuddles,
    frameCount,
    selectedHeroKey,
    triggerShake
  });

  resolveWorldPhysics(player, enemies, dt);
  updateProjectiles(dt);
  updateAcidPuddles(dt);

  // 3. Perigos de Arena e Chefes
  const bossResult = updateBossHazards(dt, {
    player,
    bossShockwaves,
    bossTelegraphs,
    bossProjectiles,
    enemyBullets,
    activeBoss,
    selectedHeroKey,
    triggerShake,
    setLastAttackerName
  });
  if (bossResult && bossResult.playerDied) return;

  // 4. Ciclo de Vida e IA dos Monstros
  const enemyResult = updateEnemies(dt, {
    player,
    enemies,
    frameCount,
    freezeTimer,
    setFreezeTimer: t => { setFreezeTimer(t); },
    enemyBullets,
    bossTelegraphs,
    bossProjectiles,
    bossShockwaves,
    voidVortices,
    acidPuddles,
    gems,
    chests,
    gameState,
    activeBoss,
    setActiveBoss,
    triggerShake,
    triggerHaptic,
    setLastAttackerName,
    resetBossGhostHp,
    setIsWavePaused
  });
  if (enemyResult && enemyResult.playerDied) return;

  // 5. Coletáveis, Baús e Drops
  const pickupsResult = updatePickups(dt, {
    player,
    enemies,
    gems,
    props,
    drops,
    chests,
    gameState,
    frameCount,
    cameraViewW,
    cameraViewH,
    triggerShake,
    setFreezeTimer: t => { setFreezeTimer(t); },
    setIsWavePaused,
    resetSpawnTimer,
    setLastAttackerName
  });
  if (pickupsResult && pickupsResult.playerDied) return;

  // 6. Subsistema Modular de Eventos Dinâmicos (Altar de Sangue)
  updateWorldEvents(dt, {
    player,
    enemies,
    gameState,
    frameCount,
    activeBoss,
    spawnChest: (x, y, tier) => spawnChest(x, y, tier),
    triggerShake,
    setLastAttackerName
  });

  updateCombatVisuals(dt);

  // 6. Atualização do HUD e Decaimento Fantasma
  updateHUD(dt, {
    gameState,
    activeBoss,
    currentArenaTheme,
    seconds,
    currentWave
  });
}

function loop(now) {
  if (!now) now = performance.now();
  const rawDt = (now - lastTime) / (1000 / 60);
  setLastTime(now);
  const speed = (typeof devCheats !== 'undefined' && devCheats.gameSpeed) ? devCheats.gameSpeed : 1.0;
  const dt = Math.min(Math.max(rawDt, 0.1), 2.5) * speed;

  try {
    if (gameState.isInMatch) {
      if (!gameState.isPaused && !gameState.isWon) {
        if (deathSequence && deathSequence.active) {
          updateDeathSequence(dt);
        } else if (!gameState.isDead) {
          update(dt);
        }
      }
      render();
    }
  } catch (err) {
    console.error('Erro crítico no loop de jogo:', err);
  }
  requestAnimationFrame(loop);
}

function startApplication() {
  try {
    resize();
  } catch (err) {
    console.warn('Aviso: Falha ao redimensionar Canvas:', err);
  }

  try {
    initSkillUI();
    initWorldEventsUI();
    applyHeroVisuals();
  } catch (err) {
    console.warn('Aviso: Falha ao inicializar Skill UI e visuais de herói:', err);
  }

  try {
    initUI();
  } catch (err) {
    console.error('Erro crítico ao inicializar UI base:', err);
  }

  try {
    openCharacterSelect();
  } catch (err) {
    console.error('Erro crítico ao abrir seletor de personagens:', err);
  }

  requestAnimationFrame(loop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApplication);
} else {
  startApplication();
}