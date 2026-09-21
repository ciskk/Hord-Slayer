/**
 * src/core/audio.js
 * Motor de Áudio Procedural via Web Audio API e Feedback Háptico
 * Integrado ao Design System Grim Cyber-Gothic
 */

import { SFX_REGISTRY, SFX_COOLDOWNS } from './audio/sfxRegistry.js';

export { SFX_REGISTRY, SFX_COOLDOWNS };

export let audioCtx = null;
let masterGainNode = null;
let masterFilterNode = null;
let currentVolume = 1.0;

// Throttling para impedir saturação acústica em momentos de alta densidade de combate
const soundCooldowns = { 
  hit: 0, 
  shoot: 0, 
  crit: 0, 
  charge: 0, 
  warp: 0,
  card_hover: 0,
  forcefield: 0,
  heal: 0,
  hammer_slam: 0,
  hammer_hit: 0,
  holy_charge: 0,
  retaliation_clang: 0,
  fire_cast: 0,
  fire_hit: 0,
  flame_dash: 0,
  blade_throw: 0,
  blade_hit: 0,
  smoke_bomb: 0,
  axe_cleave: 0,
  parry_slice: 0,
  barbarian_roar: 0,
  potion_throw: 0,
  potion_shatter: 0,
  acid_explosion: 0,
  tome_impact: 0,
  kill: 0,
  chest_rare: 0,
  bell_toll: 0,
  death_collapse: 0,
  death_evaporate: 0,
  death_nova: 0
};

// Gerador procedural de ruído para transientes, vento de lâmina, estilhaço vítreo e detonações
let noiseBuffer = null;
function getNoiseBuffer() {
  if (!audioCtx) return null;
  if (!noiseBuffer) {
    const bufferSize = Math.floor(audioCtx.sampleRate * 1.5);
    noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
}

export function playProceduralNoise({ filterType = 'lowpass', filterFreq = 1000, rampFreq = null, startGain = 0.1, duration = 0.2, decay = 0.2, q = 1, volumeMult = 1.0 }) {
  const buf = getNoiseBuffer();
  if (!buf || !audioCtx) return;
  const t = audioCtx.currentTime;
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const f = audioCtx.createBiquadFilter();
  f.type = filterType;
  f.frequency.setValueAtTime(filterFreq, t);
  if (q !== 1) f.Q.setValueAtTime(q, t);
  if (rampFreq) {
    f.frequency.exponentialRampToValueAtTime(Math.max(20, rampFreq), t + duration);
  }
  const g = audioCtx.createGain();
  const effectiveGain = Math.max(0.0001, startGain * volumeMult);
  g.gain.setValueAtTime(effectiveGain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(duration, decay));
  src.connect(f);
  f.connect(g);
  g.connect(masterGainNode);
  src.start(t);
  src.stop(t + duration);
}

export function triggerHaptic(type) {
  try {
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) {
      return;
    }
    if (navigator.vibrate) {
      if (type === 'light') navigator.vibrate(10);
      else if (type === 'medium') navigator.vibrate(22);
      else if (type === 'heavy') navigator.vibrate([30, 40, 30]);
    }
  } catch (e) {}
}

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Roteamento Mestre: Canais Individuais -> masterGainNode -> masterFilterNode -> destination
    masterGainNode = audioCtx.createGain();
    masterGainNode.gain.setValueAtTime(currentVolume, audioCtx.currentTime);

    masterFilterNode = audioCtx.createBiquadFilter();
    masterFilterNode.type = 'lowpass';
    masterFilterNode.frequency.setValueAtTime(22000, audioCtx.currentTime);

    masterGainNode.connect(masterFilterNode);
    masterFilterNode.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  // Pré-aloca o buffer de ruído procedural para eliminar engasgo no primeiro golpe/som
  getNoiseBuffer();
}

export function setGameVolume(val) {
  currentVolume = parseFloat(val);
  const label = document.getElementById('volume-val');
  if (label) label.innerText = Math.round(currentVolume * 100) + '%';
  if (masterGainNode && audioCtx) {
    masterGainNode.gain.setTargetAtTime(currentVolume, audioCtx.currentTime, 0.02);
  }
}

/**
 * Filtro de Necrose Auditiva (Game Over):
 * Corta agudos e médios bruscamente (low-pass a 180Hz) para simular asfixia sensorial e morte
 */
export function applyDeathAudioFilter() {
  if (!audioCtx || !masterFilterNode) return;
  const t = audioCtx.currentTime;
  masterFilterNode.frequency.cancelScheduledValues(t);
  masterFilterNode.frequency.setTargetAtTime(180, t, 0.12);
}

/**
 * Restauração do Espectro Auditivo:
 * Reabre a passagem de frequências ao renascer ou iniciar nova partida
 */
export function resetDeathAudioFilter() {
  if (!audioCtx || !masterFilterNode) return;
  const t = audioCtx.currentTime;
  masterFilterNode.frequency.cancelScheduledValues(t);
  masterFilterNode.frequency.setValueAtTime(22000, t);
  masterFilterNode.frequency.setTargetAtTime(22000, t, 0.02);
}

/**
 * Filtro de Estase Temporal (Pausa da Partida):
 * Modula as frequências para um tom etéreo e misterioso (lowpass ressonante em 520Hz)
 * que suspende a agressividade do combate sem a sensação de asfixia da morte.
 */
export function applyStasisAudioFilter() {
  if (!audioCtx || !masterFilterNode) return;
  const t = audioCtx.currentTime;
  masterFilterNode.frequency.cancelScheduledValues(t);
  masterFilterNode.frequency.setTargetAtTime(520, t, 0.08);
}

/**
 * Restauração do Espectro Auditivo de Estase:
 * Reabre a passagem total de frequências ao retomar a batalha.
 */
export function resetStasisAudioFilter() {
  if (!audioCtx || !masterFilterNode) return;
  const t = audioCtx.currentTime;
  masterFilterNode.frequency.cancelScheduledValues(t);
  masterFilterNode.frequency.setValueAtTime(22000, t);
  masterFilterNode.frequency.setTargetAtTime(22000, t, 0.02);
}

/**
 * Despacho O(1) de efeitos sonoros procedurais via tabela declarativa SFX_REGISTRY.
 * @param {string} type Tipo do efeito sonoro
 * @param {number} volumeMult Modificador de volume
 */
export function playSfx(type, volumeMult = 1.0) {
  if (currentVolume <= 0) return;
  if (!audioCtx) {
    try { initAudio(); } catch (e) {}
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    try { audioCtx.resume(); } catch (e) {}
  }
  if (!audioCtx) return;

  const now = performance.now();
  const cd = SFX_COOLDOWNS[type];
  if (cd && now - (soundCooldowns[type] || 0) < cd) return;
  if (soundCooldowns[type] !== undefined || cd !== undefined) soundCooldowns[type] = now;

  const synth = SFX_REGISTRY[type];
  if (!synth) return;

  const t = audioCtx.currentTime;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, t);

    osc.connect(gain);
    gain.connect(filter);
    filter.connect(masterGainNode);

    const pitchJitter = 0.93 + Math.random() * 0.14;

    const scopedPlayNoise = (params) => {
      playProceduralNoise({
        ...params,
        volumeMult: (params.volumeMult !== undefined ? params.volumeMult : 1.0) * volumeMult
      });
    };

    synth({
      ctx: audioCtx,
      t,
      pitchJitter,
      volumeMult,
      osc,
      gain,
      filter,
      masterGainNode,
      playNoise: scopedPlayNoise,
      haptic: triggerHaptic,
      now
    });
  } catch (e) {}
}

if (typeof window !== 'undefined') {
  const ensureAudioActive = () => {
    try {
      if (!audioCtx) {
        initAudio();
      } else if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (e) {}
  };
  ['pointerdown', 'mousedown', 'keydown', 'touchstart', 'click'].forEach(evt => {
    window.addEventListener(evt, ensureAudioActive, { passive: true });
  });
}