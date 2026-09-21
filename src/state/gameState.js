/**
 * src/state/gameState.js
 * Estado Central da Partida, Câmera, Viewport e Cronômetros Globais.
 * Desacoplado de main.js para eliminar dependências circulares.
 */

import { layoutMetrics } from '../core/responsive.js';

export let canvas = null;
export let ctx = null;
export let bannerCanvas = null;
export let bannerCtx = null;

export function setMainCanvas(newCanvas) {
  canvas = newCanvas;
}

export function setMainCtx(newCtx) {
  ctx = newCtx;
}

export function setBannerCanvas(newCanvas) {
  bannerCanvas = newCanvas;
  bannerCtx = newCanvas ? newCanvas.getContext('2d') : null;
}

export let dpr = 1;
export let viewW = typeof window !== 'undefined' ? window.innerWidth : 960;
export let viewH = typeof window !== 'undefined' ? window.innerHeight : 640;

export function calculateCameraZoom(w, h) {
  const minDim = Math.min(w, h);
  if (minDim >= 650) {
    return 1.25;
  }
  return Math.min(1.25, Math.max(0.70, minDim / 490));
}

export let baseCameraZoom = typeof window !== 'undefined' ? calculateCameraZoom(window.innerWidth, window.innerHeight) : 1.25;
export let CAMERA_ZOOM = baseCameraZoom;
export let cameraViewW = viewW / CAMERA_ZOOM;
export let cameraViewH = viewH / CAMERA_ZOOM;

export function setCameraZoom(zoom) {
  CAMERA_ZOOM = Math.max(0.4, zoom);
  cameraViewW = viewW / CAMERA_ZOOM;
  cameraViewH = viewH / CAMERA_ZOOM;
}

export function resetCameraZoom() {
  baseCameraZoom = calculateCameraZoom(viewW, viewH);
  setCameraZoom(baseCameraZoom);
}

export const gameState = {
  isInMatch: false,
  isPaused: false,
  isDead: false,
  isWon: false,
  kills: 0,
  isWavePaused: false
};

export const camera = { x: 0, y: 0 };
export const cinematicCamera = {
  isCinematic: false,
  returningToPlayer: false,
  letterboxProgress: 0
};

export const matchIntro = {
  active: false,
  timer: 0,
  duration: 135,
  holdDuration: 25,
  zoomProgress: 0,
  startZoomMult: 2.2,
  skipped: false
};

export function startMatchIntro() {
  baseCameraZoom = calculateCameraZoom(viewW, viewH);
  matchIntro.active = true;
  matchIntro.timer = 0;
  matchIntro.duration = 135;
  matchIntro.holdDuration = 25;
  matchIntro.zoomProgress = 0;
  matchIntro.skipped = false;
  cinematicCamera.isCinematic = true;
  cinematicCamera.letterboxProgress = 1.0;
  setCameraZoom(baseCameraZoom * matchIntro.startZoomMult);
}

export function endMatchIntro() {
  matchIntro.active = false;
  matchIntro.zoomProgress = 1.0;
  matchIntro.skipped = false;
  resetCameraZoom();
}

export const deathSequence = {
  active: false,
  timer: 0,
  duration: 165,
  phase: 'COLLAPSE',
  zoomProgress: 0,
  startZoom: 1.25,
  targetZoomMult: 2.35,
  fallProgress: 0,
  evaporateProgress: 0,
  transitionFlash: 0,
  skipped: false
};

export function resetDeathSequenceState() {
  deathSequence.active = false;
  deathSequence.timer = 0;
  deathSequence.phase = 'COLLAPSE';
  deathSequence.zoomProgress = 0;
  deathSequence.fallProgress = 0;
  deathSequence.evaporateProgress = 0;
  deathSequence.transitionFlash = 0;
  deathSequence.skipped = false;
}

export let frameCount = 0;
export let spawnTimer = 999;
export let screenShake = 0;
export let freezeTimer = 0;
export let currentArenaTheme = 'IVORY_OSSUARY';
export let lastTime = typeof performance !== 'undefined' ? performance.now() : 0;

export const waveAnnouncement = {
  name: '',
  index: 0,
  timer: 0,
  maxTimer: 180
};

export let lastAnnouncedWaveIndex = 0;
export let deferredLevelUpGraceTimer = 0;

// Mutators e Setters Seguros
export function setLastTime(t) { lastTime = t; }
export function resetSpawnTimer() { spawnTimer = 999; }
export function setSpawnTimer(val) { spawnTimer = val; }
export function setCurrentArenaTheme(theme) { currentArenaTheme = theme; }
export function setIsWavePaused(val) { gameState.isWavePaused = val; }
export function triggerShake(intensity) { screenShake = Math.max(screenShake, intensity); }
export function decayScreenShake(dt) { if (screenShake > 0) screenShake = Math.max(0, screenShake - 0.7 * dt); }
export function setFrameCount(val) { frameCount = val; }
export function advanceFrameCount(dt) { frameCount += dt; }
export function setFreezeTimer(val) { freezeTimer = val; }
export function setDeferredLevelUpGraceTimer(val) { deferredLevelUpGraceTimer = val; }
export function setLastAnnouncedWaveIndex(idx) { lastAnnouncedWaveIndex = idx; }

export function updateDimensions(w, h, currentDpr) {
  viewW = w;
  viewH = h;
  dpr = currentDpr;
  baseCameraZoom = calculateCameraZoom(viewW, viewH);
  if (gameState.isInMatch) {
    if (!matchIntro.active) {
      setCameraZoom(baseCameraZoom);
    } else {
      cameraViewW = viewW / CAMERA_ZOOM;
      cameraViewH = viewH / CAMERA_ZOOM;
    }
  } else {
    setCameraZoom(baseCameraZoom);
  }
}
