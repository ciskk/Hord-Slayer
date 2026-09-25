import { SOVEREIGN_CONFIG } from './constants.js';

const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
export const introEase = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const envelope = (p, start, attack, release, end) =>
  introEase((p - start) / attack) * (1 - introEase((p - release) / (end - release)));

export const SOVEREIGN_INTRO_TIMING = Object.freeze({
  emerge: 0.18, limbs: 0.40, gaze: 0.56, title: 0.58,
  charge: 0.73, release: 0.84, settle: 0.93, titleEnd: 0.97
});

// Reserva espaço para toda a aura, o pilar e o título, dentro do letterbox.
export function getSovereignIntroFraming(width, height, radius, baseZoom, progress) {
  const scale = radius / 52;
  const approach = 1.04 + introEase((progress - 0.24) / 0.38) * 0.12;
  const fit = Math.min((width - 40) / (480 * scale),
    (height * 0.35 - 12) / (260 * scale), (height * 0.27 - 12) / (150 * scale));
  return { zoom: Math.max(0.4, Math.min(baseZoom * approach, fit)), focusY: 0.46 };
}

// The same normalized cues drive the visual accents and the sound track.
// Crossing a cue works even when a slow frame skips its exact timestamp.
export const SOVEREIGN_INTRO_CUES = Object.freeze([
  Object.freeze({ at: 0.055, sound: 'charge', shake: 2 }),
  Object.freeze({ at: SOVEREIGN_INTRO_TIMING.emerge, sound: 'warp', haptic: 'medium', shake: 5 }),
  Object.freeze({ at: SOVEREIGN_INTRO_TIMING.gaze, sound: 'forcefield', haptic: 'medium', shake: 3 }),
  Object.freeze({ at: SOVEREIGN_INTRO_TIMING.charge, sound: 'charge' }),
  Object.freeze({ at: SOVEREIGN_INTRO_TIMING.release, sound: 'singularity', haptic: 'heavy', shake: 12 })
]);

export function playSovereignIntroCues(previous, current, playSound, vibrate, shake = () => {}) {
  for (const cue of SOVEREIGN_INTRO_CUES) {
    if (previous < cue.at && current >= cue.at) {
      playSound(cue.sound);
      if (cue.haptic) vibrate(cue.haptic);
      if (cue.shake) shake(cue.shake);
    }
  }
}

function star(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x - size, y); ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size); ctx.lineTo(x, y + size);
  ctx.stroke();
}

function diamond(ctx, x, y, size) {
  ctx.beginPath(); ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.55, y); ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.55, y); ctx.closePath();
  ctx.fill(); ctx.stroke();
}

// O gradiente e a geometria compartilham o mesmo espaço normalizado.
// Assim a luz chega a alpha zero ANTES do limite de desenho, inclusive nas elipses.
function softGlow(ctx, x, y, rx, ry, rgb, opacity) {
  if (opacity <= 0 || rx <= 0 || ry <= 0) return;
  ctx.save();
  ctx.translate(x, y); ctx.scale(rx, ry);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  glow.addColorStop(0, `rgba(${rgb}, ${opacity})`);
  glow.addColorStop(0.24, `rgba(${rgb}, ${opacity * 0.72})`);
  glow.addColorStop(0.60, `rgba(${rgb}, ${opacity * 0.23})`);
  glow.addColorStop(0.88, `rgba(${rgb}, ${opacity * 0.025})`);
  glow.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function drawRift(ctx, p, time) {
  const visible = envelope(p, 0.015, 0.10, 0.22, 0.44);
  if (visible <= 0) return;
  const open = introEase(p / 0.22);
  const h = 25 + open * 128;
  const w = 2 + open * 22;
  ctx.save(); ctx.globalAlpha *= visible;
  softGlow(ctx, 0, 0, w * 4.5, h * 1.35, '103, 63, 182', 0.42);
  softGlow(ctx, 0, 0, w * 2.5, h * 1.1, '52, 205, 207', 0.60);
  softGlow(ctx, 0, 0, w, h, '2, 3, 12', 1);

  // Duas bordas irregulares revelam a profundidade do rasgo dimensional.
  const rim = ctx.createLinearGradient(0, -h, 0, h);
  rim.addColorStop(0, 'rgba(146, 232, 235, 0)');
  rim.addColorStop(0.22, '#67c7d2'); rim.addColorStop(0.50, '#e4ffff');
  rim.addColorStop(0.78, '#ad83cf'); rim.addColorStop(1, 'rgba(146, 232, 235, 0)');
  for (const side of [-1, 1]) {
    ctx.beginPath();
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      const edge = Math.sin(t * Math.PI);
      const x = side * (w * edge + Math.sin(t * 29 + time * 0.035) * 2.5 * edge);
      const y = (t * 2 - 1) * h;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = rim; ctx.lineWidth = 4; ctx.globalAlpha *= 0.45; ctx.stroke();
    ctx.globalAlpha /= 0.45; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.restore();
}

function drawPrimordialPillar(ctx, p, time) {
  const timing = SOVEREIGN_INTRO_TIMING;
  const visible = envelope(p, timing.charge, 0.08, 0.87, 0.975);
  if (visible <= 0) return;
  const erupt = introEase((p - timing.release) / 0.035);
  const height = 125 + erupt * 105;
  const width = 10 + erupt * 16;
  ctx.save(); ctx.globalAlpha *= visible;
  softGlow(ctx, 0, -height * 0.44, width * 3, height * 0.58, '90, 63, 161', 0.40);
  softGlow(ctx, 0, -height * 0.44, width * 1.6, height * 0.55, '87, 215, 217', 0.56);
  softGlow(ctx, 0, -height * 0.43, 4 + erupt * 3, height * 0.55, '221, 255, 250', 0.95);
  softGlow(ctx, 0, 0, 95, 57, '130, 229, 225', 0.40 + erupt * 0.22);

  // Os filamentos se dissipam nas duas extremidades, sem um retângulo branco truncado.
  const filament = ctx.createLinearGradient(0, 12, 0, -height);
  filament.addColorStop(0, 'rgba(186, 251, 244, 0)');
  filament.addColorStop(0.16, 'rgba(221, 255, 250, 0.9)');
  filament.addColorStop(0.50, 'rgba(111, 225, 229, 0.65)');
  filament.addColorStop(1, 'rgba(130, 142, 213, 0)');
  ctx.strokeStyle = filament; ctx.lineWidth = 1.1;
  for (let strand = 0; strand < 4; strand++) {
    ctx.beginPath();
    for (let step = 0; step <= 40; step++) {
      const t = step / 40;
      const x = Math.sin(t * 12 + strand * Math.PI / 2 - time * 0.045)
        * width * Math.sin(t * Math.PI);
      const y = 12 - t * (height + 12);
      if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 7; i++) {
    const t = (time * 0.007 + i / 7) % 1;
    ctx.save(); ctx.globalAlpha *= Math.sin(t * Math.PI) * 0.55;
    ctx.beginPath(); ctx.ellipse(0, -height * t, width * (0.6 + t), 3 + t * 3, 0, 0, TAU);
    ctx.stroke(); ctx.restore();
  }
  ctx.restore();
}

// All geometry uses local boss coordinates and cinematic time. No random
// particles, gameplay hazards or frame-count-dependent animation are created.
export function drawSovereignIntroBackdrop(ctx, radius, progress) {
  const p = clamp(progress), time = p * SOVEREIGN_CONFIG.INTRO_DURATION;
  const visibility = envelope(p, 0, 0.06, 0.90, 1);
  if (visibility <= 0) return;
  ctx.save();
  ctx.scale(radius / 52, radius / 52);
  ctx.globalAlpha *= visibility;

  // Act I: dust contracts first; a fractured astrolabe then writes itself
  // around the rupture, leaving a continuous foundation for all four acts.
  softGlow(ctx, 0, 12, 225, 185, '4, 3, 16', 0.88);
  softGlow(ctx, -28, 0, 180, 124, '75, 39, 114', 0.28);
  softGlow(ctx, 24, 12, 162, 104, '33, 115, 132', 0.22);
  softGlow(ctx, 0, 52, 205, 68, '62, 197, 193', 0.24);
  drawRift(ctx, p, time);
  drawPrimordialPillar(ctx, p, time);

  // Poeira em planos de profundidade distintos; o chefe permanece o foco.
  for (let i = 0; i < 38; i++) {
    const orbit = i * 2.39996 + time * (i % 2 ? 0.0008 : -0.0012);
    const distance = 110 + (i * 37 % 113);
    const twinkle = Math.pow(0.5 + 0.5 * Math.sin(time * 0.022 + i * 1.7), 3);
    ctx.save(); ctx.globalAlpha *= (0.12 + twinkle * 0.48) * introEase(p / 0.16);
    ctx.strokeStyle = i % 4 ? '#90c6d2' : '#ddc5a3'; ctx.lineWidth = 0.7;
    star(ctx, Math.cos(orbit) * distance, Math.sin(orbit) * distance * 0.64 - 10,
      i % 7 === 0 ? 2.5 : 1.1);
    ctx.restore();
  }

  ctx.save(); ctx.translate(0, 52); ctx.scale(1, 0.36);
  for (let ring = 0; ring < 3; ring++) {
    const inscribe = introEase((p - ring * 0.035) / 0.20);
    const r = 110 + ring * 24;
    ctx.save(); ctx.rotate(time * (ring === 1 ? -0.0025 : 0.002));
    ctx.strokeStyle = ring === 1 ? '#a99acc' : '#4caaa9';
    ctx.lineWidth = ring === 1 ? 1 : 1.6;
    ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + TAU * inscribe); ctx.stroke();
    for (let i = 0; i < 24; i++) {
      const glyph = introEase((inscribe - i / 24) * 24);
      if (glyph <= 0) continue;
      ctx.save(); ctx.rotate(i * TAU / 24); ctx.translate(r, 0);
      ctx.globalAlpha *= glyph;
      ctx.beginPath(); ctx.moveTo(-4, -5); ctx.lineTo(3, 0); ctx.lineTo(-4, 5);
      ctx.moveTo(0, -6); ctx.lineTo(0, 6);
      if (i % 3 === 0) { ctx.moveTo(4, -4); ctx.lineTo(4, 4); }
      ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  }
  ctx.restore();

  const fracture = envelope(p, 0.06, 0.15, 0.29, 0.48);
  if (fracture > 0) {
    ctx.save(); ctx.globalAlpha *= fracture;
    for (let i = 0; i < 10; i++) {
      const angle = i * TAU / 10 + 0.15;
      const length = (95 + i % 3 * 24) * introEase((p - 0.06 - i % 3 * 0.02) / 0.15);
      ctx.save(); ctx.rotate(angle);
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(length * 0.38, -6);
      ctx.lineTo(length * 0.62, 5); ctx.lineTo(length, -3);
      ctx.moveTo(length * 0.62, 5); ctx.lineTo(length * 0.76, 19);
      ctx.strokeStyle = '#522767'; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = i % 2 ? '#bd81b3' : '#8cd8d2'; ctx.lineWidth = 0.85; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  const suction = envelope(p, 0.015, 0.10, 0.38, 0.56);
  if (suction > 0) {
    ctx.save(); ctx.globalAlpha *= suction;
    for (let i = 0; i < 32; i++) {
      const life = (p * 2.8 + i / 32) % 1;
      const angle = i * 2.39996 + life * 1.8;
      const r = 205 * (1 - life) + 13;
      const x = Math.cos(angle) * r, y = Math.sin(angle) * r * 0.67;
      ctx.save(); ctx.globalAlpha *= Math.sin(life * Math.PI) * 0.7;
      ctx.strokeStyle = i % 3 ? '#88c4d0' : '#b588bf'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x * 0.94 - y * 0.12, y * 0.94 + x * 0.08, x * 0.82, y * 0.82); ctx.stroke();
      star(ctx, x, y, i % 5 === 0 ? 3 : 1.4); ctx.restore();
    }
    ctx.restore();
  }

  // Act II: mineral fragments lift from the seal; luminous meridians
  // assemble a celestial cage behind the emerging obsidian sphere.
  const assembly = envelope(p, 0.18, 0.12, 0.45, 0.62);
  if (assembly > 0) {
    ctx.save(); ctx.globalAlpha *= assembly;
    const build = introEase((p - 0.18) / 0.27);
    ctx.save(); ctx.translate(0, (1 - build) * 32);
    ctx.strokeStyle = '#86c9d0'; ctx.lineWidth = 0.8;
    for (let i = 0; i < 7; i++) {
      const angle = i * Math.PI / 7 + time * 0.003;
      ctx.beginPath(); ctx.ellipse(0, 0, 62 + i % 2 * 5, 14 + i * 3, angle, 0, TAU * build); ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < 12; i++) {
      const angle = i * TAU / 12 + time * 0.002;
      const r = 132 - build * 43;
      const x = Math.cos(angle) * r, y = 50 + Math.sin(angle) * r * 0.35 - build * (42 + i % 3 * 15);
      ctx.strokeStyle = 'rgba(106, 197, 197, 0.3)';
      ctx.beginPath(); ctx.moveTo(x, y + 22); ctx.lineTo(x, y + 5); ctx.stroke();
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle + build);
      ctx.fillStyle = '#141124'; ctx.strokeStyle = i % 2 ? '#aa8cbb' : '#86c9d0';
      diamond(ctx, 0, 0, 5 + i % 3 * 2);
      ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, 4); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  }

  // Act III: nine constellations awaken in sequence behind the tentacles.
  // A segmented, counter-rotating crown frames the opening eye.
  const coronation = envelope(p, 0.40, 0.14, 0.83, 0.98);
  if (coronation > 0) {
    ctx.save(); ctx.globalAlpha *= coronation;
    for (let i = 0; i < 9; i++) {
      const bloom = introEase((p - 0.40 - i * 0.015) / 0.16);
      if (bloom <= 0) continue;
      ctx.save(); ctx.rotate(i * TAU / 9 - Math.PI / 2 + Math.sin(time * 0.009) * 0.025);
      ctx.globalAlpha *= bloom * 0.65;
      const reach = 76 + bloom * 54;
      ctx.strokeStyle = i % 3 ? '#78b9c3' : '#bc8cbf'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(62, 0); ctx.lineTo(reach - 23, -12);
      ctx.lineTo(reach, 0); ctx.lineTo(reach - 13, 16); ctx.stroke();
      star(ctx, reach, 0, 4);
      ctx.fillStyle = '#c9e9e8'; ctx.beginPath(); ctx.arc(reach - 23, -12, 1.7, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.save(); ctx.rotate(-time * 0.002);
    ctx.strokeStyle = '#b6a7cf'; ctx.lineWidth = 1.1;
    for (let i = 0; i < 16; i++) {
      const angle = i * TAU / 16;
      ctx.beginPath(); ctx.arc(0, 0, 91, angle + 0.04, angle + 0.26); ctx.stroke();
      star(ctx, Math.cos(angle) * 99, Math.sin(angle) * 99, i % 4 === 0 ? 3.8 : 1.8);
    }
    ctx.restore(); ctx.restore();
  }
  ctx.restore();
}

export function drawSovereignIntroForeground(ctx, radius, progress) {
  const p = clamp(progress);
  if (p <= 0 || p >= 1) return;
  ctx.save(); ctx.scale(radius / 52, radius / 52);

  // Traveling glints make the dome's assembly legible without covering it.
  const scan = envelope(p, 0.29, 0.08, 0.47, 0.55);
  if (scan > 0) {
    ctx.save(); ctx.globalAlpha *= scan * 0.65;
    const y = 45 - introEase((p - 0.29) / 0.23) * 100;
    const width = Math.sqrt(Math.max(0, 1 - (y / 58) ** 2)) * 57;
    ctx.strokeStyle = '#b7eee7'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, y, width, 5, 0, 0, Math.PI); ctx.stroke();
    star(ctx, width, y, 4); star(ctx, -width, y, 4); ctx.restore();
  }

  // A brief horizontal glint marks the observer's first fully open gaze.
  const gaze = envelope(p, SOVEREIGN_INTRO_TIMING.gaze, 0.07, 0.68, 0.77);
  if (gaze > 0) {
    ctx.save(); ctx.globalAlpha *= gaze * 0.65;
    softGlow(ctx, 0, 0, 118, 13, '115, 218, 220', 0.45);
    softGlow(ctx, 0, 0, 100, 2.5, '225, 255, 247', 0.95);
    ctx.restore();
  }

  // Act IV: pressure first folds inward. At the singularity cue, broken
  // prismatic rings and fragments travel outward, then settle before combat.
  const releaseAt = SOVEREIGN_INTRO_TIMING.release;
  const charge = envelope(p, SOVEREIGN_INTRO_TIMING.charge, 0.03, releaseAt - 0.025, releaseAt);
  if (charge > 0) {
    ctx.save(); ctx.globalAlpha *= charge * 0.6;
    for (let i = 0; i < 3; i++) {
      const r = 24 + (1 - introEase((p - SOVEREIGN_INTRO_TIMING.charge) / 0.11)) * (80 + i * 20);
      ctx.strokeStyle = i === 1 ? '#d09dc8' : '#98dfdf'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * (0.48 + i * 0.16), i * 0.7, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }
  const release = (p - releaseAt) / (1 - releaseAt);
  if (release >= 0) {
    softGlow(ctx, 0, 0, 135, 105, '191, 247, 237', Math.sin(clamp(release * 3) * Math.PI) * 0.32);
    for (let ring = 0; ring < 3; ring++) {
      const age = clamp((release - ring * 0.13) / (1 - ring * 0.13));
      if (age <= 0 || age >= 1) continue;
      ctx.save(); ctx.globalAlpha *= Math.sin(age * Math.PI) * (1 - age) * 0.85;
      const r = 35 + Math.sqrt(age) * (210 - ring * 25);
      ctx.strokeStyle = ring === 1 ? '#cf9dc8' : '#a4eeeb'; ctx.lineWidth = 2 - age;
      ctx.beginPath(); ctx.ellipse(0, 12, r, r * 0.53, 0, 0, TAU); ctx.stroke();
      for (let i = 0; i < 18; i++) {
        const angle = i * TAU / 18 + ring * 0.12;
        const x = Math.cos(angle) * r, y = 12 + Math.sin(angle) * r * 0.53;
        ctx.beginPath(); ctx.moveTo(x * 0.94, y); ctx.lineTo(x, y - Math.sin(age * Math.PI) * 12); ctx.stroke();
      }
      ctx.restore();
    }
    // Fragmentos da coroa se desfazem em poeira, preparando a passagem ao combate.
    for (let i = 0; i < 24; i++) {
      const age = clamp((release - (i % 4) * 0.035) / 0.86);
      if (age <= 0 || age >= 1) continue;
      const angle = i * 2.39996;
      const r = 65 + introEase(age) * (110 + i % 3 * 18);
      ctx.save(); ctx.globalAlpha *= Math.sin(age * Math.PI) * (1 - age) * 0.8;
      ctx.translate(Math.cos(angle) * r, Math.sin(angle) * r * 0.65);
      ctx.rotate(angle + age);
      ctx.fillStyle = '#152c37'; ctx.strokeStyle = i % 3 ? '#a4e2e4' : '#d4bba1'; ctx.lineWidth = 0.8;
      diamond(ctx, 0, 0, (3 + i % 3) * (1 - age * 0.75));
      ctx.restore();
    }
  }
  ctx.restore();
}

/** Cartela em tela, abaixo da silhueta, com margens reservadas para o letterbox. */
export function drawSovereignIntroTitle(ctx, width, height, progress) {
  const p = clamp(progress), timing = SOVEREIGN_INTRO_TIMING;
  const alpha = envelope(p, timing.title, 0.07, 0.91, timing.titleEnd);
  if (alpha <= 0) return;
  const compact = height < 520;
  const available = Math.max(1, Math.min(620, width - 48));
  const x = width * 0.5;
  const y = height * 0.79 + (1 - introEase((p - timing.title) / 0.07)) * 8;
  ctx.save();
  ctx.globalAlpha *= alpha;
  softGlow(ctx, x, y, Math.min(width * 0.48, 430), compact ? 40 : 56, '3, 5, 14', 0.96);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  const rule = ctx.createLinearGradient(x - available / 2, 0, x + available / 2, 0);
  rule.addColorStop(0, 'rgba(146, 207, 209, 0)');
  rule.addColorStop(0.28, 'rgba(146, 207, 209, 0.65)');
  rule.addColorStop(0.5, 'rgba(221, 198, 157, 0.9)');
  rule.addColorStop(0.72, 'rgba(146, 207, 209, 0.65)');
  rule.addColorStop(1, 'rgba(146, 207, 209, 0)');
  const ruleY = y - (compact ? 32 : 42);
  const spread = introEase((p - timing.title) / 0.10);
  ctx.strokeStyle = rule; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - available * 0.5 * spread, ruleY); ctx.lineTo(x - 8, ruleY);
  ctx.moveTo(x + 8, ruleY); ctx.lineTo(x + available * 0.5 * spread, ruleY); ctx.stroke();
  ctx.fillStyle = '#dfc9a7'; ctx.strokeStyle = '#fff0cc';
  diamond(ctx, x, ruleY, 3);

  ctx.font = `${compact ? 8 : 10}px monospace`;
  ctx.fillStyle = '#a3c8ce';
  ctx.fillText('C A T A C L I S M A  I V', x, y - (compact ? 19 : 24), available);

  const title = 'SOBERANO DO ABISMO';
  let fontSize = compact ? 24 : 32;
  ctx.font = `600 ${fontSize}px "Cinzel", Georgia, serif`;
  fontSize *= Math.min(1, available / Math.max(1, ctx.measureText(title).width));
  ctx.font = `600 ${fontSize}px "Cinzel", Georgia, serif`;
  const lettering = ctx.createLinearGradient(0, y - fontSize / 2, 0, y + fontSize / 2);
  lettering.addColorStop(0, '#ffffff'); lettering.addColorStop(0.5, '#e3f6ee');
  lettering.addColorStop(1, '#b4c7c9');
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; ctx.fillText(title, x, y + 2, available);
  ctx.fillStyle = lettering; ctx.fillText(title, x, y, available);
  ctx.font = `italic ${compact ? 10 : 12}px "Cinzel", Georgia, serif`;
  ctx.fillStyle = '#cebfa6';
  ctx.fillText('Senhor do Vazio Primordial', x, y + (compact ? 20 : 27), available);
  ctx.restore();
}
