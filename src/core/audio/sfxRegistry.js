/**
 * src/core/audio/sfxRegistry.js
 * Tabela declarativa O(1) de sintetizadores sonoros procedurais via Web Audio API
 * e mapeamento de resfriamento acústico (anti-saturação).
 */

export const SFX_COOLDOWNS = {
  hit: 35,
  shoot: 28,
  crit: 45,
  charge: 120,
  warp: 80,
  card_hover: 50,
  forcefield: 90,
  heal: 250,
  hammer_slam: 100,
  hammer_hit: 45,
  holy_charge: 200,
  retaliation_clang: 80,
  fire_cast: 45,
  fire_hit: 40,
  flame_dash: 200,
  blade_throw: 45,
  blade_hit: 35,
  smoke_bomb: 220,
  axe_cleave: 45,
  parry_slice: 60,
  barbarian_roar: 300,
  potion_throw: 60,
  potion_shatter: 50,
  acid_explosion: 220,
  tome_impact: 90,
  kill: 85,
  chest_rare: 150,
  bell_toll: 150,
  death_collapse: 0,
  death_evaporate: 0,
  death_nova: 0,
  holy_ready: 400,
  fire_ready: 400,
  void_ready: 400,
  blood_ready: 400,
  alchemic_ready: 400
};

// Escala musical pentatônica para coleta contínua de gemas
let gemPitchStep = 0;
let lastGemTime = 0;
const gemScale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];

export const SFX_REGISTRY = {
  shoot: ({ t, pitchJitter, osc, gain, filter }) => {
    filter.frequency.setValueAtTime(1800, t);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.07);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.start(t);
    osc.stop(t + 0.07);
  },

  hit: ({ t, pitchJitter, osc, gain, filter }) => {
    filter.frequency.setValueAtTime(750, t);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(115 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.055);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.10, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
    osc.start(t);
    osc.stop(t + 0.055);
  },

  crit: ({ t, pitchJitter, osc, gain, filter, haptic }) => {
    filter.frequency.setValueAtTime(2800, t);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(987.77, t + 0.04);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    osc.start(t);
    osc.stop(t + 0.11);
    haptic('light');
  },

  gem: ({ t, osc, gain, filter, now = performance.now() }) => {
    if (now - lastGemTime > 750) gemPitchStep = 0;
    lastGemTime = now;
    const baseFreq = gemScale[gemPitchStep % gemScale.length];
    gemPitchStep++;

    filter.frequency.setValueAtTime(3200, t);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.12, t + 0.06);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
    osc.start(t);
    osc.stop(t + 0.065);
  },

  level: ({ ctx, t, masterGainNode, haptic }) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 2200;
      o.connect(g);
      g.connect(f);
      f.connect(masterGainNode);
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.001, t + idx * 0.05);
      g.gain.linearRampToValueAtTime(0.07, t + idx * 0.05 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.18);
      o.start(t + idx * 0.05);
      o.stop(t + idx * 0.05 + 0.18);
    });
    haptic('medium');
  },

  boss: ({ t, osc, gain, filter, haptic }) => {
    filter.frequency.setValueAtTime(420, t);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.5);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.20, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.start(t);
    osc.stop(t + 0.5);
    haptic('heavy');
  },

  evolution: ({ ctx, t, masterGainNode, haptic }) => {
    [440, 554.37, 659.25, 880, 1108.7].forEach((freq, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(masterGainNode);
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.001, t + idx * 0.07);
      g.gain.linearRampToValueAtTime(0.08, t + idx * 0.07 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.22);
      o.start(t + idx * 0.07);
      o.stop(t + idx * 0.07 + 0.22);
    });
    haptic('heavy');
  },

  victory: ({ ctx, t, masterGainNode }) => {
    [440, 554.37, 659.25, 880, 1108.7].forEach((freq, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(masterGainNode);
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.001, t + idx * 0.11);
      g.gain.linearRampToValueAtTime(0.11, t + idx * 0.11 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.11 + 0.32);
      o.start(t + idx * 0.11);
      o.stop(t + idx * 0.11 + 0.32);
    });
  },

  acid: ({ t, pitchJitter, osc, gain, filter }) => {
    filter.frequency.setValueAtTime(900, t);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(170 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.11);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    osc.start(t);
    osc.stop(t + 0.11);
  },

  chest: ({ ctx, t, masterGainNode }) => {
    [587.33, 880].forEach((freq, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(masterGainNode);
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.001, t + idx * 0.08);
      g.gain.linearRampToValueAtTime(0.1, t + idx * 0.08 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.25);
      o.start(t + idx * 0.08);
      o.stop(t + idx * 0.08 + 0.25);
    });
  },

  freeze: ({ ctx, t, masterGainNode }) => {
    [987.77, 1318.5].forEach((freq, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(masterGainNode);
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.001, t + idx * 0.06);
      g.gain.linearRampToValueAtTime(0.08, t + idx * 0.06 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.18);
      o.start(t + idx * 0.06);
      o.stop(t + idx * 0.06 + 0.18);
    });
  },

  singularity: ({ t, osc, gain, filter, haptic }) => {
    filter.frequency.setValueAtTime(220, t);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(24, t + 0.65);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.24, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
    osc.start(t);
    osc.stop(t + 0.65);
    haptic('heavy');
  },

  charge: ({ t, pitchJitter, osc, gain, filter, haptic }) => {
    filter.frequency.setValueAtTime(3200, t);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(920 * pitchJitter, t + 0.32);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc.start(t);
    osc.stop(t + 0.32);
    haptic('medium');
  },

  shatter: ({ ctx, t, osc, gain, filter, masterGainNode, haptic }) => {
    filter.frequency.setValueAtTime(1400, t);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(36, t + 0.38);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    osc.start(t);
    osc.stop(t + 0.38);

    const ringOsc = ctx.createOscillator();
    const ringGain = ctx.createGain();
    ringOsc.type = 'sine';
    ringOsc.frequency.setValueAtTime(880, t);
    ringOsc.frequency.exponentialRampToValueAtTime(440, t + 0.3);
    ringGain.gain.setValueAtTime(0.08, t);
    ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    ringOsc.connect(ringGain);
    ringGain.connect(masterGainNode);
    ringOsc.start(t);
    ringOsc.stop(t + 0.3);
    haptic('heavy');
  },

  warp: ({ t, pitchJitter, osc, gain, filter, haptic }) => {
    filter.frequency.setValueAtTime(1800, t);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(580 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(85, t + 0.16);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.start(t);
    osc.stop(t + 0.16);
    haptic('medium');
  },

  forcefield: ({ t, pitchJitter, osc, gain, filter, haptic }) => {
    filter.frequency.setValueAtTime(1400, t);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(360, t + 0.12);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.09, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.start(t);
    osc.stop(t + 0.12);
    haptic('light');
  },

  heal: ({ ctx, t, masterGainNode, haptic }) => {
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(masterGainNode);
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.001, t + idx * 0.04);
      g.gain.linearRampToValueAtTime(0.05, t + idx * 0.04 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.16);
      o.start(t + idx * 0.04);
      o.stop(t + idx * 0.04 + 0.16);
    });
    haptic('light');
  },

  death_heartbeat: ({ ctx, t, masterGainNode, haptic }) => {
    [0, 0.26].forEach((offset, idx) => {
      const hOsc = ctx.createOscillator();
      const hGain = ctx.createGain();
      const hFilter = ctx.createBiquadFilter();

      hFilter.type = 'lowpass';
      hFilter.frequency.value = 160;

      hOsc.connect(hGain);
      hGain.connect(hFilter);
      hFilter.connect(masterGainNode);

      hOsc.type = 'sine';
      const startT = t + offset;
      hOsc.frequency.setValueAtTime(62, startT);
      hOsc.frequency.exponentialRampToValueAtTime(26, startT + 0.16);

      hGain.gain.setValueAtTime(0.001, startT);
      hGain.gain.linearRampToValueAtTime(idx === 0 ? 0.38 : 0.26, startT + 0.02);
      hGain.gain.exponentialRampToValueAtTime(0.001, startT + 0.22);

      hOsc.start(startT);
      hOsc.stop(startT + 0.22);
    });
    haptic('heavy');
  },

  tombstone_slam: ({ t, osc, gain, filter, haptic }) => {
    filter.frequency.setValueAtTime(320, t);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.45);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.32, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.start(t);
    osc.stop(t + 0.45);
    haptic('heavy');
  },

  death_collapse: ({ ctx, t, osc, gain, filter, masterGainNode, playNoise, haptic }) => {
    playNoise({
      filterType: 'lowpass',
      filterFreq: 420,
      rampFreq: 140,
      startGain: 0.22,
      duration: 0.22,
      decay: 0.22
    });
    filter.frequency.setValueAtTime(260, t);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(26, t + 0.32);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc.start(t);
    osc.stop(t + 0.32);

    const pingOsc = ctx.createOscillator();
    const pingGain = ctx.createGain();
    pingOsc.type = 'sine';
    pingOsc.frequency.setValueAtTime(360, t + 0.04);
    pingOsc.frequency.exponentialRampToValueAtTime(180, t + 0.16);
    pingGain.gain.setValueAtTime(0.001, t + 0.04);
    pingGain.gain.linearRampToValueAtTime(0.08, t + 0.045);
    pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    pingOsc.connect(pingGain);
    pingGain.connect(masterGainNode);
    pingOsc.start(t + 0.04);
    pingOsc.stop(t + 0.16);
    haptic('medium');
  },

  death_evaporate: ({ ctx, t, masterGainNode, playNoise }) => {
    playNoise({
      filterType: 'bandpass',
      filterFreq: 420,
      rampFreq: 1100,
      startGain: 0.10,
      duration: 0.95,
      decay: 0.95,
      q: 2.2
    });
    [185, 277.18, 370].forEach((baseF, i) => {
      const sOsc = ctx.createOscillator();
      const sGain = ctx.createGain();
      sOsc.type = 'sine';
      sOsc.frequency.setValueAtTime(baseF, t);
      sOsc.frequency.exponentialRampToValueAtTime(baseF * 1.85, t + 1.1);
      sGain.gain.setValueAtTime(0.001, t);
      sGain.gain.linearRampToValueAtTime(0.06 / (i + 1), t + 0.18);
      sGain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
      sOsc.connect(sGain);
      sGain.connect(masterGainNode);
      sOsc.start(t);
      sOsc.stop(t + 1.1);
    });
  },

  death_nova: ({ t, osc, gain, filter, playNoise, haptic }) => {
    playNoise({
      filterType: 'bandpass',
      filterFreq: 650,
      rampFreq: 180,
      startGain: 0.28,
      duration: 0.55,
      decay: 0.55,
      q: 1.4
    });
    filter.frequency.setValueAtTime(380, t);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(22, t + 0.65);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.38, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
    osc.start(t);
    osc.stop(t + 0.65);
    haptic('heavy');
  },

  card_hover: ({ t, osc, gain, filter }) => {
    filter.frequency.setValueAtTime(1400, t);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(780, t);
    osc.frequency.exponentialRampToValueAtTime(350, t + 0.025);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.035, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    osc.start(t);
    osc.stop(t + 0.025);
  },

  card_select: ({ ctx, t, masterGainNode, haptic }) => {
    [440, 880, 1320].forEach((freq, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(masterGainNode);
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.001, t + idx * 0.02);
      g.gain.linearRampToValueAtTime(0.08, t + idx * 0.02 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.02 + 0.28);
      o.start(t + idx * 0.02);
      o.stop(t + idx * 0.02 + 0.28);
    });
    haptic('medium');
  },

  chest_fanfare: ({ ctx, t, masterGainNode, haptic }) => {
    [392, 523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(masterGainNode);
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.001, t + idx * 0.05);
      g.gain.linearRampToValueAtTime(0.09, t + idx * 0.05 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.35);
      o.start(t + idx * 0.05);
      o.stop(t + idx * 0.05 + 0.35);
    });
    haptic('heavy');
  },

  stasis_enter: ({ ctx, t, masterGainNode, haptic }) => {
    [587.33, 880, 1174.66].forEach((freq, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(masterGainNode);
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, t + idx * 0.03);
      o.frequency.exponentialRampToValueAtTime(freq * 1.05, t + idx * 0.03 + 0.35);
      g.gain.setValueAtTime(0.001, t + idx * 0.03);
      g.gain.linearRampToValueAtTime(0.08, t + idx * 0.03 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.03 + 0.38);
      o.start(t + idx * 0.03);
      o.stop(t + idx * 0.03 + 0.38);
    });
    haptic('medium');
  },

  stasis_exit: ({ ctx, t, masterGainNode, haptic }) => {
    [1174.66, 880, 587.33].forEach((freq, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(masterGainNode);
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, t + idx * 0.02);
      o.frequency.exponentialRampToValueAtTime(freq * 0.9, t + idx * 0.02 + 0.2);
      g.gain.setValueAtTime(0.001, t + idx * 0.02);
      g.gain.linearRampToValueAtTime(0.05, t + idx * 0.02 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.02 + 0.22);
      o.start(t + idx * 0.02);
      o.stop(t + idx * 0.02 + 0.22);
    });
    haptic('light');
  },

  hammer_slam: ({ ctx, t, pitchJitter, volumeMult = 1.0, osc, gain, filter, masterGainNode, playNoise, haptic }) => {
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    const subFilter = ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(140, t);
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(85 * pitchJitter, t);
    subOsc.frequency.exponentialRampToValueAtTime(28, t + 0.18);
    subGain.gain.setValueAtTime(0.001, t);
    subGain.gain.linearRampToValueAtTime(0.26 * volumeMult, t + 0.005);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    subOsc.connect(subGain);
    subGain.connect(subFilter);
    subFilter.connect(masterGainNode);
    subOsc.start(t);
    subOsc.stop(t + 0.18);

    playNoise({
      filterType: 'lowpass',
      filterFreq: 380,
      rampFreq: 75,
      startGain: 0.18,
      duration: 0.16,
      decay: 0.16
    });

    filter.frequency.setValueAtTime(450, t);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.04);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.16 * volumeMult, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.start(t);
    osc.stop(t + 0.04);

    haptic('heavy');
  },

  hammer_hit: ({ t, pitchJitter, volumeMult = 1.0, osc, gain, filter, playNoise }) => {
    filter.frequency.setValueAtTime(500, t);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.05);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18 * volumeMult, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.start(t);
    osc.stop(t + 0.05);

    playNoise({
      filterType: 'lowpass',
      filterFreq: 550,
      startGain: 0.14,
      duration: 0.045,
      decay: 0.045
    });
  },

  holy_charge: ({ ctx, t, pitchJitter, volumeMult = 1.0, masterGainNode, osc, gain, filter, playNoise, haptic }) => {
    // 1. Onda tonal heroica ascendente de Carga Sagrada (Harmônica de avanço imponente)
    filter.frequency.setValueAtTime(3200, t);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(920 * pitchJitter, t + 0.32);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.14 * volumeMult, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc.start(t);
    osc.stop(t + 0.32);

    // 2. Sub-grave encorpado da arrancada do cavaleiro
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(75, t);
    subOsc.frequency.exponentialRampToValueAtTime(28, t + 0.28);
    subGain.gain.setValueAtTime(0.001, t);
    subGain.gain.linearRampToValueAtTime(0.16 * volumeMult, t + 0.01);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    subOsc.connect(subGain);
    subGain.connect(masterGainNode);
    subOsc.start(t);
    subOsc.stop(t + 0.28);

    // 3. Ressonância metálica de placas de armadura
    const armorOsc = ctx.createOscillator();
    const armorGain = ctx.createGain();
    armorOsc.type = 'triangle';
    armorOsc.frequency.setValueAtTime(520 * pitchJitter, t);
    armorOsc.frequency.exponentialRampToValueAtTime(260, t + 0.14);
    armorGain.gain.setValueAtTime(0.001, t);
    armorGain.gain.linearRampToValueAtTime(0.08 * volumeMult, t + 0.008);
    armorGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    armorOsc.connect(armorGain);
    armorGain.connect(masterGainNode);
    armorOsc.start(t);
    armorOsc.stop(t + 0.14);

    // 4. Deslocamento suave de ar sem ruído abrasivo de alta frequência
    playNoise({
      filterType: 'bandpass',
      filterFreq: 500,
      rampFreq: 1100,
      startGain: 0.08,
      duration: 0.22,
      decay: 0.22,
      q: 1.4
    });

    haptic('heavy');
  },

  retaliation_clang: ({ ctx, t, pitchJitter, masterGainNode, playNoise, haptic }) => {
    playNoise({
      filterType: 'highpass',
      filterFreq: 2800,
      startGain: 0.14,
      duration: 0.035,
      decay: 0.035
    });
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(1400 * pitchJitter, t);
    o.frequency.exponentialRampToValueAtTime(600, t + 0.06);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    o.connect(g);
    g.connect(masterGainNode);
    o.start(t);
    o.stop(t + 0.06);
    haptic('medium');
  },

  fire_cast: ({ t, pitchJitter, volumeMult = 1.0, osc, gain, filter, playNoise }) => {
    // 1. Disparo tonal de fogo místico (transiente punchy estilo arcade)
    filter.frequency.setValueAtTime(2200, t);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.075);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.07 * volumeMult, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
    osc.start(t);
    osc.stop(t + 0.075);

    // 2. Sopro térmico de labareda ("foosh" quente de fogo saindo do cajado)
    playNoise({
      filterType: 'bandpass',
      filterFreq: 850 * pitchJitter,
      rampFreq: 1400,
      startGain: 0.09,
      duration: 0.08,
      decay: 0.08,
      q: 1.4
    });
  },

  fire_hit: ({ t, pitchJitter, volumeMult = 1.0, osc, gain, filter, playNoise }) => {
    playNoise({
      filterType: 'lowpass',
      filterFreq: 800,
      rampFreq: 300,
      startGain: 0.12,
      duration: 0.08,
      decay: 0.08
    });
    filter.frequency.setValueAtTime(220, t);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.06);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12 * volumeMult, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.start(t);
    osc.stop(t + 0.06);
  },

  flame_dash: ({ ctx, t, pitchJitter, volumeMult = 1.0, masterGainNode, osc, gain, filter, playNoise, haptic }) => {
    // 1. Tom ascendente heroico de ignição e investida flamejante
    filter.frequency.setValueAtTime(2800, t);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(1050 * pitchJitter, t + 0.28);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.13 * volumeMult, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.start(t);
    osc.stop(t + 0.28);

    // 2. Onda expansiva térmica (boom subsônico)
    const boomOsc = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(70, t);
    boomOsc.frequency.exponentialRampToValueAtTime(25, t + 0.28);
    boomGain.gain.setValueAtTime(0.001, t);
    boomGain.gain.linearRampToValueAtTime(0.18 * volumeMult, t + 0.01);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    boomOsc.connect(boomGain);
    boomGain.connect(masterGainNode);
    boomOsc.start(t);
    boomOsc.stop(t + 0.28);

    // 3. Erupção crepitante de labaredas
    playNoise({
      filterType: 'bandpass',
      filterFreq: 600,
      rampFreq: 1500,
      startGain: 0.12,
      duration: 0.24,
      decay: 0.24,
      q: 1.5
    });

    haptic('heavy');
  },

  blade_throw: ({ t, pitchJitter, volumeMult = 1.0, osc, gain, filter, playNoise }) => {
    // 1. Zunido tonal de lâmina cortando o ar (assobio rápido e nítido de aço)
    filter.frequency.setValueAtTime(2400, t);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(460 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.065);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.08 * volumeMult, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
    osc.start(t);
    osc.stop(t + 0.065);

    // 2. Deslocamento aerodinâmico suave
    playNoise({
      filterType: 'bandpass',
      filterFreq: 2200 * pitchJitter,
      rampFreq: 1000,
      startGain: 0.08,
      duration: 0.06,
      decay: 0.06,
      q: 2.2
    });
  },

  blade_hit: ({ t, pitchJitter, volumeMult = 1.0, osc, gain, filter, playNoise }) => {
    playNoise({
      filterType: 'highpass',
      filterFreq: 3200,
      rampFreq: 1400,
      startGain: 0.12,
      duration: 0.045,
      decay: 0.045,
      q: 2.2
    });
    playNoise({
      filterType: 'bandpass',
      filterFreq: 2200,
      rampFreq: 800,
      startGain: 0.10,
      duration: 0.05,
      decay: 0.05,
      q: 1.8
    });
    filter.frequency.setValueAtTime(180, t);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.035);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.09 * volumeMult, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    osc.start(t);
    osc.stop(t + 0.035);
  },

  smoke_bomb: ({ ctx, t, pitchJitter, volumeMult = 1.0, masterGainNode, osc, gain, filter, playNoise, haptic }) => {
    // 1. Ressonância fantasmagórica misteriosa de evasão
    filter.frequency.setValueAtTime(2200, t);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.24);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.11 * volumeMult, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    osc.start(t);
    osc.stop(t + 0.24);

    // 2. Tom secundário de dobra etérea
    const warpOsc = ctx.createOscillator();
    const warpGain = ctx.createGain();
    warpOsc.type = 'sine';
    warpOsc.frequency.setValueAtTime(680 * pitchJitter, t);
    warpOsc.frequency.exponentialRampToValueAtTime(220, t + 0.18);
    warpGain.gain.setValueAtTime(0.001, t);
    warpGain.gain.linearRampToValueAtTime(0.08 * volumeMult, t + 0.008);
    warpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    warpOsc.connect(warpGain);
    warpGain.connect(masterGainNode);
    warpOsc.start(t);
    warpOsc.stop(t + 0.18);

    // 3. Estouro abafado e dispersão de fumaça densa
    playNoise({
      filterType: 'lowpass',
      filterFreq: 500,
      rampFreq: 140,
      startGain: 0.12,
      duration: 0.24,
      decay: 0.24
    });

    haptic('medium');
  },

  axe_cleave: ({ t, pitchJitter, volumeMult = 1.0, osc, gain, filter, playNoise }) => {
    playNoise({
      filterType: 'bandpass',
      filterFreq: 1400,
      rampFreq: 500,
      startGain: 0.12,
      duration: 0.045,
      decay: 0.045,
      q: 1.6
    });
    filter.frequency.setValueAtTime(320, t);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.05);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18 * volumeMult, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.start(t);
    osc.stop(t + 0.05);
  },

  parry_slice: ({ ctx, t, pitchJitter, volumeMult = 1.0, masterGainNode, playNoise }) => {
    playNoise({
      filterType: 'highpass',
      filterFreq: 3200,
      startGain: 0.08,
      duration: 0.035,
      decay: 0.035
    });
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(1600 * pitchJitter, t);
    o.frequency.exponentialRampToValueAtTime(800, t + 0.045);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.10 * volumeMult, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    o.connect(g);
    g.connect(masterGainNode);
    o.start(t);
    o.stop(t + 0.045);
  },

  barbarian_roar: ({ ctx, t, pitchJitter, volumeMult = 1.0, masterGainNode, osc, gain, filter, playNoise, haptic }) => {
    // 1. Ressonância acústica gutural de fúria bárbara (grito primal)
    filter.frequency.setValueAtTime(1600, t);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130 * pitchJitter, t);
    osc.frequency.linearRampToValueAtTime(240 * pitchJitter, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.38);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.14 * volumeMult, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    osc.start(t);
    osc.stop(t + 0.38);

    // 2. Tremor tectônico de sub-grave do rugido
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(70, t);
    subOsc.frequency.exponentialRampToValueAtTime(24, t + 0.40);
    subGain.gain.setValueAtTime(0.001, t);
    subGain.gain.linearRampToValueAtTime(0.20 * volumeMult, t + 0.02);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.40);
    subOsc.connect(subGain);
    subGain.connect(masterGainNode);
    subOsc.start(t);
    subOsc.stop(t + 0.40);

    // 3. Onda de pressão sônica do rugido
    playNoise({
      filterType: 'bandpass',
      filterFreq: 350,
      rampFreq: 700,
      startGain: 0.14,
      duration: 0.35,
      decay: 0.35,
      q: 1.8
    });

    haptic('heavy');
  },

  potion_throw: ({ t, pitchJitter, volumeMult = 1.0, osc, gain, filter, playNoise }) => {
    // 1. Deslocamento fluido do frasco no ar
    filter.frequency.setValueAtTime(1800, t);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.07);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.06 * volumeMult, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.start(t);
    osc.stop(t + 0.07);

    // 2. Deslocamento de ar do arremesso
    playNoise({
      filterType: 'bandpass',
      filterFreq: 1100 * pitchJitter,
      rampFreq: 600,
      startGain: 0.06,
      duration: 0.065,
      decay: 0.065,
      q: 1.5
    });
  },

  potion_shatter: ({ ctx, t, pitchJitter, volumeMult = 1.0, masterGainNode, osc, gain, filter, playNoise, haptic }) => {
    // 1. Tintilhar de vidro alquímico partindo em estilhaços
    filter.frequency.setValueAtTime(3600, t);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(550, t + 0.12);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.10 * volumeMult, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.start(t);
    osc.stop(t + 0.12);

    // 2. Harmônica cristalina aguda
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chimeOsc.type = 'triangle';
    chimeOsc.frequency.setValueAtTime(2200 * pitchJitter, t);
    chimeOsc.frequency.exponentialRampToValueAtTime(980, t + 0.09);
    chimeGain.gain.setValueAtTime(0.001, t);
    chimeGain.gain.linearRampToValueAtTime(0.07 * volumeMult, t + 0.004);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    chimeOsc.connect(chimeGain);
    chimeGain.connect(masterGainNode);
    chimeOsc.start(t);
    chimeOsc.stop(t + 0.09);

    // 3. Estilhaço vítreo autêntico
    playNoise({
      filterType: 'highpass',
      filterFreq: 2600,
      startGain: 0.10,
      duration: 0.045,
      decay: 0.045
    });

    // 4. Respingo cáustico químico efervescente
    playNoise({
      filterType: 'bandpass',
      filterFreq: 1200,
      rampFreq: 500,
      startGain: 0.09,
      duration: 0.08,
      decay: 0.08,
      q: 1.5
    });

    if (haptic) haptic('medium');
  },

  acid_explosion: ({ ctx, t, masterGainNode, playNoise, haptic }) => {
    playNoise({
      filterType: 'bandpass',
      filterFreq: 700,
      rampFreq: 220,
      startGain: 0.22,
      duration: 0.28,
      decay: 0.28,
      q: 1.4
    });
    const expOsc = ctx.createOscillator();
    const expGain = ctx.createGain();
    expOsc.type = 'sine';
    expOsc.frequency.setValueAtTime(90, t);
    expOsc.frequency.exponentialRampToValueAtTime(28, t + 0.25);
    expGain.gain.setValueAtTime(0.001, t);
    expGain.gain.linearRampToValueAtTime(0.20, t + 0.008);
    expGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    expOsc.connect(expGain);
    expGain.connect(masterGainNode);
    expOsc.start(t);
    expOsc.stop(t + 0.25);
    haptic('medium');
  },

  tome_impact: ({ t, pitchJitter, osc, gain, filter }) => {
    filter.frequency.setValueAtTime(380, t);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.04);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.10, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.start(t);
    osc.stop(t + 0.04);
  },

  kill: ({ t, pitchJitter, osc, gain, filter }) => {
    filter.frequency.setValueAtTime(320, t);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(75 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.04);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.start(t);
    osc.stop(t + 0.04);
  },

  chest_rare: ({ ctx, t, volumeMult, masterGainNode, haptic }) => {
    const baseGain = 0.10 * volumeMult;
    [587.33, 739.99, 880, 1174.66].forEach((freq, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.001, t + idx * 0.06);
      g.gain.linearRampToValueAtTime(baseGain, t + idx * 0.06 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.28);
      o.connect(g);
      g.connect(masterGainNode);
      o.start(t + idx * 0.06);
      o.stop(t + idx * 0.06 + 0.28);
    });
    haptic('medium');
  },

  bell_toll: ({ ctx, t, volumeMult, masterGainNode }) => {
    const baseGain = 0.01 * volumeMult;
    [587.33, 739.99, 880, 1174.66].forEach((freq, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.001, t + idx * 0.06);
      g.gain.linearRampToValueAtTime(baseGain, t + idx * 0.06 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.28);
      o.connect(g);
      g.connect(masterGainNode);
      o.start(t + idx * 0.06);
      o.stop(t + idx * 0.06 + 0.28);
    });
  },

  // Feedback de clique sutil para botões da interface
  click: (params) => {
    SFX_REGISTRY.card_hover(params);
  },

  // Sinos da Catedral Solar - Carga da ULT de Roland (Paladino) Pronta
  holy_ready: ({ ctx, t, volumeMult = 1.0, masterGainNode, haptic }) => {
    const freqs = [659.25, 880.0, 1046.5, 1318.5]; // E5, A5, C6, E6
    const baseGain = 0.08 * volumeMult;
    freqs.forEach((freq, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      const startT = t + idx * 0.045;
      g.gain.setValueAtTime(0.0001, startT);
      g.gain.linearRampToValueAtTime(baseGain * (1 - idx * 0.15), startT + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, startT + 0.38);
      o.connect(g);
      g.connect(masterGainNode);
      o.start(startT);
      o.stop(startT + 0.38);
    });
    if (typeof haptic === 'function') haptic('medium');
  },

  // Fornalha e Labareda Viva - Carga da ULT de Ignis (Piromante) Pronta
  fire_ready: ({ ctx, t, volumeMult = 1.0, masterGainNode, osc, gain, filter, playNoise, haptic }) => {
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.exponentialRampToValueAtTime(1600, t + 0.22);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.18);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12 * volumeMult, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    osc.start(t);
    osc.stop(t + 0.24);

    playNoise({
      filterType: 'bandpass',
      filterFreq: 680,
      rampFreq: 1400,
      startGain: 0.14 * volumeMult,
      duration: 0.25,
      decay: 0.25
    });
    if (typeof haptic === 'function') haptic('heavy');
  },

  // Fenda do Vácuo & Lâmina Astral - Carga da ULT de Kael (Andarilho) Pronta
  void_ready: ({ ctx, t, volumeMult = 1.0, masterGainNode, osc, gain, filter, playNoise, haptic }) => {
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(320, t + 0.3);
    filter.Q.value = 4.0;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.3);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.09 * volumeMult, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    osc.start(t);
    osc.stop(t + 0.32);

    playNoise({
      filterType: 'highpass',
      filterFreq: 1800,
      rampFreq: 600,
      startGain: 0.08 * volumeMult,
      duration: 0.26,
      decay: 0.26
    });
    if (typeof haptic === 'function') haptic('medium');
  },

  // Batimento Cardíaco Visceral (Lub-Dub) - Carga da ULT de Kragdor (Bárbaro) Pronta
  blood_ready: ({ ctx, t, volumeMult = 1.0, masterGainNode, haptic }) => {
    // 1º Batimento (Lub)
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(70, t);
    o1.frequency.exponentialRampToValueAtTime(32, t + 0.12);
    g1.gain.setValueAtTime(0.001, t);
    g1.gain.linearRampToValueAtTime(0.22 * volumeMult, t + 0.015);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    o1.connect(g1);
    g1.connect(masterGainNode);
    o1.start(t);
    o1.stop(t + 0.14);

    // 2º Batimento (Dub) - ligeiramente mais encorpado
    const t2 = t + 0.15;
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(60, t2);
    o2.frequency.exponentialRampToValueAtTime(26, t2 + 0.16);
    g2.gain.setValueAtTime(0.001, t2);
    g2.gain.linearRampToValueAtTime(0.28 * volumeMult, t2 + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.22);
    o2.connect(g2);
    g2.connect(masterGainNode);
    o2.start(t2);
    o2.stop(t2 + 0.22);

    if (typeof haptic === 'function') haptic('heavy');
  },

  // Despressurização Cáustica e Borbulhar - Carga da ULT de Valéria (Alquimista) Pronta
  alchemic_ready: ({ ctx, t, volumeMult = 1.0, masterGainNode, playNoise, haptic }) => {
    // Escape de vapor
    playNoise({
      filterType: 'highpass',
      filterFreq: 1400,
      rampFreq: 2400,
      startGain: 0.12 * volumeMult,
      duration: 0.22,
      decay: 0.22
    });

    // Três borbulhas químicas estourando em sequência
    [0.0, 0.06, 0.12].forEach((offset, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      const bt = t + offset;
      const startF = 380 + idx * 80;
      o.frequency.setValueAtTime(startF, bt);
      o.frequency.exponentialRampToValueAtTime(startF * 1.8, bt + 0.04);
      g.gain.setValueAtTime(0.001, bt);
      g.gain.linearRampToValueAtTime(0.09 * volumeMult, bt + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, bt + 0.05);
      o.connect(g);
      g.connect(masterGainNode);
      o.start(bt);
      o.stop(bt + 0.05);
    });

    if (typeof haptic === 'function') haptic('medium');
  }
};
