const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
export const introEase = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const envelope = (p, start, attack, release, end) =>
  introEase((p - start) / attack) * (1 - introEase((p - release) / (end - release)));

// The same normalized cues drive the visual accents and the sound track.
// Crossing a cue works even when a slow frame skips its exact timestamp.
export const SOVEREIGN_INTRO_CUES = Object.freeze([
  Object.freeze({ at: 30 / 440, sound: 'charge' }),
  Object.freeze({ at: 170 / 440, sound: 'warp', haptic: 'medium' }),
  Object.freeze({ at: 310 / 440, sound: 'forcefield', haptic: 'medium' }),
  Object.freeze({ at: 390 / 440, sound: 'singularity' })
]);

export function playSovereignIntroCues(previous, current, playSound, vibrate) {
  for (const cue of SOVEREIGN_INTRO_CUES) {
    if (previous < cue.at && current >= cue.at) {
      playSound(cue.sound);
      if (cue.haptic) vibrate(cue.haptic);
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

// All geometry uses local boss coordinates and cinematic time. No random
// particles, gameplay hazards or frame-count-dependent animation are created.
export function drawSovereignIntroBackdrop(ctx, radius, progress) {
  const p = clamp(progress), time = p * 440;
  const visibility = envelope(p, 0, 0.06, 0.90, 1);
  if (visibility <= 0) return;
  ctx.save();
  ctx.scale(radius / 52, radius / 52);
  ctx.globalAlpha *= visibility;

  // Act I: dust contracts first; a fractured astrolabe then writes itself
  // around the rupture, leaving a continuous foundation for all four acts.
  const glow = ctx.createRadialGradient(0, 22, 12, 0, 22, 215);
  glow.addColorStop(0, 'rgba(5, 2, 18, 0.75)');
  glow.addColorStop(0.55, 'rgba(34, 12, 59, 0.26)');
  glow.addColorStop(1, 'rgba(15, 4, 33, 0)');
  ctx.fillStyle = glow; ctx.fillRect(-215, -193, 430, 430);

  ctx.save(); ctx.translate(0, 52); ctx.scale(1, 0.36);
  for (let ring = 0; ring < 3; ring++) {
    const inscribe = introEase((p - ring * 0.045) / 0.22);
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
  const assembly = envelope(p, 0.23, 0.12, 0.49, 0.64);
  if (assembly > 0) {
    ctx.save(); ctx.globalAlpha *= assembly;
    const build = introEase((p - 0.25) / 0.23);
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
  const coronation = envelope(p, 0.48, 0.12, 0.81, 0.96);
  if (coronation > 0) {
    ctx.save(); ctx.globalAlpha *= coronation;
    for (let i = 0; i < 9; i++) {
      const bloom = introEase((p - 0.50 - i * 0.012) / 0.14);
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
  const gaze = envelope(p, 0.67, 0.035, 0.72, 0.79);
  if (gaze > 0) {
    ctx.save(); ctx.globalAlpha *= gaze * 0.65;
    const flare = ctx.createLinearGradient(-105, 0, 105, 0);
    flare.addColorStop(0, 'rgba(140, 229, 228, 0)');
    flare.addColorStop(0.5, '#e0fff7'); flare.addColorStop(1, 'rgba(140, 229, 228, 0)');
    ctx.fillStyle = flare; ctx.fillRect(-105, -1, 210, 2);
    ctx.restore();
  }

  // Act IV: pressure first folds inward. At the singularity cue, broken
  // prismatic rings and fragments travel outward, then settle before combat.
  const charge = envelope(p, 0.79, 0.025, 0.855, 390 / 440);
  if (charge > 0) {
    ctx.save(); ctx.globalAlpha *= charge * 0.6;
    for (let i = 0; i < 3; i++) {
      const r = 24 + (1 - introEase((p - 0.80) / 0.085)) * (80 + i * 20);
      ctx.strokeStyle = i === 1 ? '#d09dc8' : '#98dfdf'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * (0.48 + i * 0.16), i * 0.7, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }
  const release = (p - 390 / 440) / (1 - 390 / 440);
  if (release >= 0) {
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
  }
  ctx.restore();
}
