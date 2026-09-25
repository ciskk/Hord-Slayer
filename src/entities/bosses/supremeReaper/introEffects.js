const TAU = Math.PI * 2;
const clamp = x => Math.max(0, Math.min(1, x));
const smooth = x => { const t = clamp(x); return t * t * (3 - 2 * t); };

// Local boss coordinates. All decorative particles are derived from cinematic
// progress, so pausing freezes the ritual and different frame rates match.
export function drawReaperIntroRitual(ctx, progress) {
  const time = progress * 360;
  const appear = smooth(progress / 0.14);
  const fade = 1 - smooth((progress - 0.80) / 0.20);
  ctx.save();
  ctx.globalAlpha *= appear * fade;

  // A gothic doorway behind the emerging figure, opening from a narrow seam.
  const opening = smooth((progress - 0.15) / 0.35);
  if (opening > 0) {
    ctx.save(); ctx.scale(0.12 + opening * 0.88, 1);
    const gate = ctx.createLinearGradient(0, -190, 0, 55);
    gate.addColorStop(0, '#031219'); gate.addColorStop(0.6, '#020408'); gate.addColorStop(1, '#164c50');
    ctx.fillStyle = gate; ctx.strokeStyle = '#577d7a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-88, 55); ctx.lineTo(-88, -65);
    ctx.bezierCurveTo(-88, -136, -32, -164, 0, -198);
    ctx.bezierCurveTo(32, -164, 88, -136, 88, -65); ctx.lineTo(88, 55); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#64cfc3'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-77, 49); ctx.lineTo(-77, -64);
    ctx.quadraticCurveTo(-76, -126, 0, -181); ctx.quadraticCurveTo(76, -126, 77, -64);
    ctx.lineTo(77, 49); ctx.stroke();
    for (const side of [-1, 1]) {
      for (let i = 0; i < 7; i++) {
        const y = 26 - i * 20, x = side * 82;
        ctx.beginPath(); ctx.moveTo(x - 3, y - 4); ctx.lineTo(x + 3, y);
        ctx.lineTo(x - 3, y + 4); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Three counter-rotating circles of inscriptions, visibly inscribed over time.
  ctx.save(); ctx.translate(0, 44); ctx.scale(1, 0.42);
  for (let layer = 0; layer < 3; layer++) {
    const radius = 108 + layer * 20;
    ctx.save(); ctx.rotate(time * (layer % 2 ? -0.004 : 0.003));
    ctx.strokeStyle = layer === 1 ? '#c9b478' : '#58bdb7'; ctx.lineWidth = layer === 1 ? 1 : 1.6;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU * smooth((progress - layer * 0.03) / 0.24)); ctx.stroke();
    for (let i = 0; i < 24; i++) {
      if (i / 24 > clamp((progress - layer * 0.03) / 0.24)) break;
      ctx.save(); ctx.rotate(i * TAU / 24); ctx.translate(radius, 0);
      ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(4, 0); ctx.lineTo(-4, 4);
      ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  }
  ctx.restore();

  // Procession of tiny souls spiraling into the doorway, with tapered wakes.
  for (let i = 0; i < 18; i++) {
    const p = (progress * 2 + i / 18) % 1;
    const angle = i * 2.4 + p * 2.7;
    const radius = 175 * (1 - p) + 22;
    const x = Math.cos(angle) * radius, y = 32 + Math.sin(angle) * radius * 0.38 - p * 112;
    ctx.save(); ctx.globalAlpha *= Math.sin(p * Math.PI) * 0.75;
    ctx.translate(x, y); ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = '#80cfc8'; ctx.beginPath(); ctx.moveTo(-3, 0);
    ctx.quadraticCurveTo(-10, 12, Math.sin(time * 0.035 + i) * 5, 24);
    ctx.quadraticCurveTo(3, 9, 3, 0); ctx.fill();
    ctx.fillStyle = '#c8f4e8'; ctx.beginPath(); ctx.ellipse(0, -1, 4, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#103b40'; ctx.fillRect(-2.5, -2, 1.5, 2); ctx.fillRect(1, -2, 1.5, 2);
    ctx.restore();
  }

  // Broken grave-stone fragments rise, then scatter after the final proclamation.
  for (let i = 0; i < 12; i++) {
    const angle = i * TAU / 12;
    const rise = smooth((progress - 0.18) / 0.25);
    const scatter = smooth((progress - 0.75) / 0.2);
    const radius = 127 + scatter * 110;
    const x = Math.cos(angle) * radius;
    const y = 44 + Math.sin(angle) * radius * 0.42 - rise * (18 + i % 3 * 10) + scatter * 60;
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle + time * 0.004);
    ctx.fillStyle = '#172d36'; ctx.strokeStyle = '#5b9292'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-5, -7); ctx.lineTo(5, -4); ctx.lineTo(3, 6); ctx.lineTo(-6, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#aad7bf'; ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(2, 1); ctx.lineTo(-1, 3); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export function drawReaperIntroDischarge(ctx, progress) {
  // Scythe landing and final reveal each get a single expanding corona.
  ctx.save();
  for (const impact of [0.3375, 0.75]) {
    const age = (progress - impact) / 0.16;
    if (age < 0 || age >= 1) continue;
    ctx.save(); ctx.translate(impact < 0.5 ? 18 : 0, 40);
    ctx.globalAlpha *= (1 - age) * 0.65;
    const radius = 20 + age * 235;
    ctx.strokeStyle = '#b2eee1'; ctx.lineWidth = (1 - age) * 3 + 0.5;
    ctx.beginPath(); ctx.ellipse(0, 0, radius, radius * 0.44, 0, 0, TAU); ctx.stroke();
    for (let i = 0; i < 22; i++) {
      const angle = i * TAU / 22;
      const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius * 0.44 - Math.sin(age * Math.PI) * (14 + i % 4 * 8);
      ctx.strokeStyle = i % 3 === 0 ? '#e3ca8c' : '#83d7cf';
      ctx.beginPath(); ctx.moveTo(x * 0.87, y + 4); ctx.lineTo(x, y); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}
