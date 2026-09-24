const TAU = Math.PI * 2;

// All geometry is Canvas 2D. No canvas readback, blur or full-screen buffers.
export function drawRolandBarrier(c, dx, dy, age, bob = 0) {
  const pulse = Math.sin(age * 0.32) * 0.5 + 0.5;
  c.save();
  c.translate(dx * 23, dy * 20 - 3 + bob * 0.25);
  // Upright heraldry, foreshortened when the charge is viewed from the side.
  c.scale(0.55 + Math.abs(dy) * 0.45, 1);
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(0, -21); c.lineTo(15, -15); c.lineTo(13, 6);
  c.quadraticCurveTo(10, 15, 0, 22);
  c.quadraticCurveTo(-10, 15, -13, 6); c.lineTo(-15, -15); c.closePath();
  c.fillStyle = 'rgba(240, 181, 48, 0.16)'; c.fill();
  c.strokeStyle = 'rgba(249, 190, 61, 0.18)'; c.lineWidth = 7; c.stroke();
  c.strokeStyle = '#eabd59'; c.lineWidth = 1.8; c.stroke();
  c.strokeStyle = `rgba(255, 248, 213, ${0.65 + pulse * 0.3})`;
  c.lineWidth = 0.65; c.stroke();
  c.beginPath();
  c.moveTo(0, -17); c.lineTo(11, -12); c.lineTo(9, 5);
  c.lineTo(0, 16); c.lineTo(-9, 5); c.lineTo(-11, -12); c.closePath();
  c.strokeStyle = 'rgba(255, 224, 141, 0.65)'; c.lineWidth = 0.7; c.stroke();
  // Raised cross, sun boss and paired oath runes.
  c.beginPath(); c.moveTo(0, -12); c.lineTo(0, 11);
  c.moveTo(-7, -5); c.lineTo(7, -5);
  c.strokeStyle = '#f4c862'; c.lineWidth = 3; c.stroke();
  c.strokeStyle = '#fff5ce'; c.lineWidth = 0.9; c.stroke();
  c.beginPath(); c.arc(0, -5, 3.8, 0, TAU); c.lineWidth = 0.7; c.stroke();
  c.beginPath();
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const x = side * (10 - i), y = -7 + i * 6;
      c.moveTo(x, y - 1.8); c.lineTo(x, y + 1.8);
      c.moveTo(x - 1.5, y - 1); c.lineTo(x, y); c.lineTo(x + 1.5, y - 1);
    }
  }
  c.strokeStyle = '#ffe3a0'; c.lineWidth = 0.6; c.stroke();
  c.restore();

  // Compressed radiant air follows the actual velocity, including vertical turns.
  c.save(); c.translate(dx * 8, dy * 8); c.rotate(Math.atan2(dy, dx));
  c.strokeStyle = 'rgba(255, 223, 148, 0.45)'; c.lineWidth = 1.1;
  c.beginPath(); c.ellipse(0, 0, 31 + pulse, 25, 0, -1.1, 1.1); c.stroke();
  c.restore();
}

/** Two displaced wave fronts suggest refraction without copying the arena. */
export function drawRolandShockwave(c, x, y, age, radius = 76) {
  if (age < 0 || age >= 26) return;
  const p = age / 26, fade = (1 - p) ** 2;
  c.save(); c.translate(x, y); c.lineJoin = 'round';
  for (let wave = 0; wave < 2; wave++) {
    const r = (12 + radius * (1 - (1 - p) ** 2)) * (1 - wave * 0.13);
    c.beginPath();
    for (let i = 0; i <= 48; i++) {
      const a = i * TAU / 48;
      const ripple = Math.sin(a * 9 - age * 0.5 + wave) * 3 * (1 - p);
      const px = Math.cos(a) * (r + ripple), py = Math.sin(a) * (r + ripple) * 0.8;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    c.strokeStyle = `rgba(249, 186, 59, ${fade * 0.18})`;
    c.lineWidth = 7 * (1 - p) + 1; c.stroke();
    c.strokeStyle = `rgba(255, 241, 194, ${fade * (wave ? 0.45 : 0.9)})`;
    c.lineWidth = 1.3; c.stroke();
  }
  // Fixed-count radial embers: ballistic height, deterministic spacing, one path.
  c.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = i * TAU / 16 + 0.17;
    const d = 8 + p * radius * (0.65 + (i % 3) * 0.12);
    const sx = Math.cos(a) * d, sy = Math.sin(a) * d * 0.8 - Math.sin(p * Math.PI) * (8 + i % 4 * 3);
    c.moveTo(sx, sy); c.lineTo(sx - Math.cos(a) * (4 - p * 3), sy - Math.sin(a) * 3);
  }
  c.strokeStyle = `rgba(255, 216, 120, ${1 - p})`; c.lineWidth = 1.5; c.stroke();
  c.restore();
}
