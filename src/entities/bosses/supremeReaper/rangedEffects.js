import { REAPER_SKILLS as SKILLS } from './constants.js';

const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));

// Pure, bounded procedural animation: no per-frame particle allocations or RNG.
function stroke(ctx, color, width) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); }
function circle(ctx, x, y, radius) { ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); }

function rune(ctx, x, y, size, variant) {
  ctx.beginPath();
  ctx.moveTo(x, y - size); ctx.lineTo(x, y + size);
  ctx.moveTo(x - size * 0.65, y); ctx.lineTo(x, y - size * 0.6); ctx.lineTo(x + size * 0.65, y);
  if (variant % 2 === 0) {
    ctx.moveTo(x - size * 0.5, y + size * 0.4); ctx.lineTo(x + size * 0.5, y + size * 0.4);
  } else {
    ctx.moveTo(x - size * 0.6, y + size * 0.7); ctx.lineTo(x + size * 0.6, y - size * 0.7);
  }
  ctx.stroke();
}

function seal(ctx, radius, time, color, progress = 1, count = 12) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  circle(ctx, 0, 0, radius); ctx.stroke();
  circle(ctx, 0, 0, radius * 0.79); ctx.stroke();
  ctx.rotate(time * 0.006);
  ctx.beginPath(); ctx.arc(0, 0, radius * 1.06, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(progress));
  stroke(ctx, '#fff2d6', 2);
  ctx.strokeStyle = color; ctx.lineWidth = 1.2;
  for (let i = 0; i < count; i++) {
    ctx.save(); ctx.rotate(i * TAU / count);
    rune(ctx, 0, -radius * 0.9, 3.6, i);
    ctx.beginPath(); ctx.moveTo(0, -radius * 1.09); ctx.lineTo(0, -radius * 1.17); ctx.stroke();
    ctx.restore();
  }
  ctx.rotate(-time * 0.014);
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const a = i * TAU / 6;
    const x = Math.cos(a) * radius * 0.66, y = Math.sin(a) * radius * 0.66;
    if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke(); ctx.restore();
}

function glow(ctx, x, y, radius, color, alpha) {
  ctx.save(); ctx.globalAlpha *= alpha;
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color); g.addColorStop(1, color + '00');
  ctx.fillStyle = g; circle(ctx, x, y, radius); ctx.fill(); ctx.restore();
}

function skull(ctx, size, color, time) {
  ctx.save(); ctx.scale(size / 10, size / 10);
  ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(-8, 1); ctx.bezierCurveTo(-13, -15, 13, -15, 8, 1);
  ctx.lineTo(5, 5); ctx.lineTo(4, 11); ctx.lineTo(-4, 11); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#151022';
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(side * 4.5, -1.5, 2.7, 3.4, side * 0.28, 0, TAU); ctx.fill();
  }
  ctx.beginPath(); ctx.moveTo(0, 1); ctx.lineTo(-1.8, 5); ctx.lineTo(1.8, 5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#382e43'; ctx.lineWidth = 0.8;
  for (let i = -2; i <= 2; i += 2) {
    ctx.beginPath(); ctx.moveTo(i, 7); ctx.lineTo(i, 11); ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  circle(ctx, -4.5, -1.5, 0.7 + Math.sin(time * 0.1) * 0.2); ctx.fill();
  circle(ctx, 4.5, -1.5, 0.7 + Math.sin(time * 0.1) * 0.2); ctx.fill();
  ctx.restore();
}

// An actual sculpted weapon: faceted blade, barbs, binding rings and plasma wake.
function lance(ctx, radius, color, time, warning) {
  const tail = warning ? 36 : 80;
  const trail = ctx.createLinearGradient(-tail, 0, 12, 0);
  trail.addColorStop(0, color + '00'); trail.addColorStop(0.75, color + '88'); trail.addColorStop(1, '#f4fff2');
  ctx.fillStyle = trail;
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(9, 0);
    ctx.bezierCurveTo(-24, side * 16, -tail * 0.7, side * (7 + Math.sin(time * 0.2) * 5), -tail, side * 3);
    ctx.bezierCurveTo(-tail * 0.6, side * 2, -20, side * 4, 9, 0); ctx.fill();
  }
  glow(ctx, 0, 0, 28, color, 0.35);
  ctx.fillStyle = '#192e36'; ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-2, -radius);
  ctx.lineTo(-13, -radius * 0.45); ctx.lineTo(-8, 0); ctx.lineTo(-13, radius * 0.45);
  ctx.lineTo(-2, radius); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#effff5'; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-2, -radius);
  ctx.lineTo(-6, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-36, 0); ctx.stroke();
  ctx.strokeStyle = '#fff1ce'; ctx.lineWidth = 1;
  for (let x = -15; x >= -33; x -= 8) {
    ctx.beginPath(); ctx.ellipse(x, 0, 2, 4, 0, 0, TAU); ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const p = (time * 0.025 + i / 5) % 1;
    ctx.globalAlpha = (1 - p) * 0.65; ctx.fillStyle = color;
    circle(ctx, -18 - p * tail, Math.sin(time * 0.1 + i * 2) * (3 + p * 12), 1 + (1 - p)); ctx.fill();
  }
}

function drawLances(ctx, a, time) {
  const warning = a.elapsed < 0, charge = clamp(1 + a.elapsed / a.warning);
  ctx.save(); ctx.translate(a.x, a.y); ctx.globalAlpha = warning ? 0.3 + charge * 0.4 : Math.max(0, 0.7 - a.elapsed / 90);
  seal(ctx, 82, time, a.color, charge); ctx.restore();
  for (const line of a.lines) {
    ctx.save(); ctx.translate(line.x, line.y); ctx.rotate(line.angle);
    if (warning) {
      // Keep the exact corridor visible beneath the moving runes and filaments.
      ctx.fillStyle = a.color; ctx.globalAlpha = 0.045 + charge * 0.035;
      ctx.fillRect(38, -line.width / 2, line.length - 38, line.width);
      ctx.globalAlpha = 0.32 + charge * 0.32; ctx.strokeStyle = a.color; ctx.lineWidth = 1;
      ctx.setLineDash([3, 10]); ctx.lineDashOffset = -time * 0.4;
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(38, side * line.width / 2); ctx.lineTo(line.length, side * line.width / 2); ctx.stroke();
      }
      ctx.setLineDash([]);
      for (let i = 0; i < 11; i++) {
        const x = 120 + i * 86;
        ctx.globalAlpha = 0.2 + 0.35 * (0.5 + 0.5 * Math.sin(i * 0.7 - time * 0.1));
        rune(ctx, x, 0, 5, i);
        ctx.beginPath(); ctx.moveTo(x + 17, -4); ctx.lineTo(x + 23, 0); ctx.lineTo(x + 17, 4); ctx.stroke();
      }
    }
    // Three nested, rotating summoning gates create depth perpendicular to flight.
    ctx.translate(38, 0); ctx.scale(0.38, 1);
    ctx.globalAlpha = warning ? 0.75 : clamp(1 - a.elapsed / 105);
    seal(ctx, 22 + charge * 7, -time * 2, a.color, charge, 8);
    ctx.restore();
  }
  for (let i = 0; i < a.bolts.length; i++) {
    const b = a.bolts[i];
    if (b.hit || (warning ? b.delay > 0 : a.elapsed < b.delay)) continue;
    const d = b.start + (warning ? 0 : (a.elapsed - b.delay) * b.speed);
    if (d > b.range) continue;
    ctx.save(); ctx.translate(a.x + Math.cos(b.angle) * d, a.y + Math.sin(b.angle) * d); ctx.rotate(b.angle);
    ctx.globalAlpha = warning ? 0.45 + charge * 0.5 : 1;
    lance(ctx, b.radius, a.color, time + i * 4, warning); ctx.restore();
  }
}

function executionBlade(ctx, width, color, charge, time) {
  ctx.save();
  ctx.translate(0, -12 - (1 - charge) * 42);
  glow(ctx, 0, 0, 38, color, 0.35);
  ctx.fillStyle = '#211b36'; ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-width, -27); ctx.lineTo(width, -27);
  ctx.lineTo(width * 0.75, 8); ctx.lineTo(0, 25); ctx.lineTo(-width * 0.75, 8);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#eae0f4'; ctx.beginPath(); ctx.moveTo(-width * 0.75, 8);
  ctx.lineTo(0, 25); ctx.lineTo(width * 0.75, 8); ctx.lineTo(0, 16); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#fff0cc'; rune(ctx, 0, -10, 8, 1);
  for (const side of [-1, 1]) {
    ctx.strokeStyle = '#9383a7'; ctx.lineWidth = 1;
    for (let j = 0; j < 5; j++) {
      ctx.beginPath(); ctx.ellipse(side * width * 0.7 + Math.sin(time * 0.06 + j) * 1.5, -33 - j * 7, 2.5, 4, 0, 0, TAU); ctx.stroke();
    }
  }
  ctx.restore();
}

function judgmentEffigy(ctx, a, charge, time) {
  // A suspended execution relic descends on each arm's impact. It is an upright
  // apparition above the seal, not a second area of damage on the ground.
  const age = a.elapsed < 22 ? a.elapsed : a.elapsed - 22;
  const firing = age >= 0 && age < 12;
  const alpha = a.elapsed < 0 ? 0.22 + charge * 0.35 : firing ? 0.95 - age * 0.035 : 0.15;
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.translate(0, firing ? 6 : -26 - (1 - charge) * 75);
  glow(ctx, 0, -60, 72, a.color, firing ? 0.5 : 0.25);
  // Obsidian blade, double bevel, inset skull and a split, hooked crossguard.
  const metal = ctx.createLinearGradient(-29, 0, 29, 0);
  metal.addColorStop(0, '#73518e'); metal.addColorStop(0.4, '#241a3e');
  metal.addColorStop(0.5, '#e7dafa'); metal.addColorStop(0.6, '#493260'); metal.addColorStop(1, '#b593d2');
  ctx.fillStyle = metal; ctx.strokeStyle = a.color; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-27, -46); ctx.lineTo(-20, -101);
  ctx.lineTo(0, -119); ctx.lineTo(20, -101); ctx.lineTo(27, -46); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f6edff'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-27, -46);
  ctx.lineTo(-20, -42); ctx.lineTo(0, -9); ctx.lineTo(20, -42); ctx.lineTo(27, -46); ctx.closePath(); ctx.fill();
  for (const side of [-1, 1]) {
    ctx.save(); ctx.scale(side, 1);
    ctx.fillStyle = '#342546'; ctx.beginPath(); ctx.moveTo(14, -89);
    ctx.lineTo(42, -113); ctx.lineTo(36, -81); ctx.lineTo(55, -91);
    ctx.lineTo(35, -62); ctx.lineTo(20, -73); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#dcc5ec'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, -86); ctx.lineTo(36, -100); ctx.lineTo(31, -79); ctx.stroke();
    ctx.strokeStyle = '#9981b1';
    for (let j = 0; j < 7; j++) {
      ctx.beginPath(); ctx.ellipse(20 + Math.sin(j * 0.6 + time * 0.025) * 3, -115 - j * 8, 3, 5, 0, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.save(); ctx.translate(0, -86); skull(ctx, 13, '#f5e5ff', time); ctx.restore();
  ctx.strokeStyle = a.color; ctx.lineWidth = 1.5;
  rune(ctx, 0, -44, 9, 1);
  ctx.restore();
  if (firing) {
    ctx.save(); ctx.globalAlpha = (1 - age / 12) * 0.8;
    // Broken shock arcs mark the seal's discharge without masking the safe quadrants.
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.ellipse(0, 0, 28 + age * 3, 13 + age * 1.4, 0,
        i * Math.PI / 2 + 0.15, i * Math.PI / 2 + 0.85); stroke(ctx, a.color, 1.6);
    }
    ctx.restore();
  }
}

function drawCross(ctx, a, time) {
  const charge = clamp(1 + a.elapsed / a.warning);
  const first = a.lines[0];
  const cx = first.x + Math.cos(first.angle) * first.length / 2;
  const cy = first.y + Math.sin(first.angle) * first.length / 2;
  ctx.save(); ctx.translate(cx, cy);
  ctx.globalAlpha = a.elapsed < 34 ? 0.7 : clamp((a.duration - a.elapsed) / 14) * 0.5;
  glow(ctx, 0, 0, 105, a.color, 0.18);
  seal(ctx, 65, time, a.color, charge, 16);
  ctx.save(); ctx.rotate(-time * 0.01); ctx.strokeStyle = '#9177a9'; ctx.lineWidth = 1;
  circle(ctx, 0, 0, 79); ctx.stroke(); ctx.restore();
  skull(ctx, 17, '#ece0f5', time);
  ctx.restore();
  for (let index = 0; index < a.lines.length; index++) {
    const line = a.lines[index], age = a.elapsed - line.delay;
    const firing = age >= 0 && age < 12, after = age >= 12;
    if (age >= 26) continue;
    const fade = after ? (26 - age) / 14 : 1;
    ctx.save(); ctx.translate(line.x, line.y); ctx.rotate(line.angle);
    // These borders are the hit width, regardless of the ornamental blade height.
    ctx.strokeStyle = a.color; ctx.lineWidth = firing ? 1.6 : 1;
    ctx.globalAlpha = (firing ? 0.95 : after ? 0.18 : 0.55) * fade;
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(0, side * line.width / 2); ctx.lineTo(line.length, side * line.width / 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(side < 0 ? 0 : line.length, 0, line.width / 2,
        side < 0 ? Math.PI / 2 : -Math.PI / 2, side < 0 ? Math.PI * 1.5 : Math.PI / 2); ctx.stroke();
    }
    if (!firing && !after) {
      ctx.fillStyle = '#4c345e'; ctx.globalAlpha = 0.15 + charge * 0.1;
      ctx.fillRect(0, -line.width / 2, line.length, line.width);
      // Twisted spectral chains tighten along the execution axis.
      ctx.globalAlpha = 0.65; ctx.strokeStyle = a.color; ctx.lineWidth = 1.2;
      for (let j = 0; j < 27; j++) {
        const x = 12 + j * 32, y = Math.sin(j * 0.8 + time * 0.045) * (1 - charge * 0.6) * 7;
        ctx.beginPath(); ctx.ellipse(x, y, 13, 4, Math.sin(j) * 0.3, 0, TAU); ctx.stroke();
        if (j % 3 === 0) rune(ctx, x, -line.width / 2 - 8, 4, j);
      }
      for (const x of [28, line.length - 28]) {
        ctx.save(); ctx.translate(x, 0); ctx.rotate(-line.angle);
        executionBlade(ctx, 16, a.color, charge, time); ctx.restore();
      }
      ctx.save(); ctx.translate(line.length / 2 + 88, 0); ctx.rotate(-line.angle);
      ctx.fillStyle = '#120e20'; circle(ctx, 0, 0, 16); ctx.fill();
      ctx.strokeStyle = a.color; ctx.stroke(); ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 17px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(index === 0 ? 'I' : 'II', 0, 1);
      ctx.restore();
    } else {
      // The ground tears open: black fracture, luminous walls and a branching core.
      ctx.globalAlpha = fade;
      ctx.beginPath(); ctx.moveTo(0, 0);
      for (let j = 0; j <= 40; j++) ctx.lineTo(j * line.length / 40, -line.width * (0.22 + 0.23 * Math.abs(Math.sin(j * 2.7))));
      for (let j = 40; j >= 0; j--) ctx.lineTo(j * line.length / 40, line.width * (0.22 + 0.23 * Math.abs(Math.cos(j * 2.3))));
      ctx.closePath(); ctx.fillStyle = '#100b1d'; ctx.fill();
      stroke(ctx, after ? '#694e81' : a.color, firing ? 3 : 1);
      ctx.beginPath(); ctx.moveTo(0, 0);
      for (let j = 1; j <= 48; j++) ctx.lineTo(j * line.length / 48, Math.sin(j * 2.1 + time * 0.25) * line.width * 0.2);
      stroke(ctx, firing ? '#ffffff' : '#745d8a', firing ? 3.5 : 1);
      if (firing) for (let j = 0; j < 18; j++) {
        const x = j * line.length / 18 + 12;
        glow(ctx, x, 0, line.width, a.color, 0.18);
        ctx.fillStyle = '#f5e0ff'; ctx.beginPath();
        const h = (5 + (j % 4) * 3) * Math.sin((age + 1) / 13 * Math.PI);
        ctx.moveTo(x, 4); ctx.lineTo(x - 4, -h); ctx.lineTo(x + 3, -h * 0.5); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }
  ctx.save(); ctx.translate(cx, cy); judgmentEffigy(ctx, a, charge, time); ctx.restore();
}

function soul(ctx, b, color, time, warning) {
  ctx.save();
  const length = warning ? 26 : 58;
  const tail = ctx.createLinearGradient(-length, 0, 6, 0);
  tail.addColorStop(0, color + '00'); tail.addColorStop(0.65, color + '88'); tail.addColorStop(1, '#fff2d0');
  ctx.fillStyle = tail;
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(3, side * 7);
    ctx.bezierCurveTo(-20, side * 20, -30, Math.sin(time * 0.13) * 10, -length, side * 14);
    ctx.bezierCurveTo(-30, side * 3, -15, -side * 4, 3, -side * 2); ctx.fill();
  }
  glow(ctx, 0, 0, b.radius * 2.4, color, 0.35);
  ctx.save(); ctx.rotate(Math.PI / 2); skull(ctx, b.radius * 0.8, '#fff1ce', time); ctx.restore();
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  // Claw-like arms stretch behind each screaming soul.
  for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(-3, side * 6); ctx.quadraticCurveTo(-14, side * 17, -24, side * 10); ctx.stroke();
    for (let f = 0; f < 3; f++) {
      ctx.beginPath(); ctx.moveTo(-24, side * 10); ctx.lineTo(-29 - f * 2, side * (8 + f * 3)); ctx.stroke();
    }
  }
  ctx.restore();
}

function drawChoir(ctx, a, time) {
  const warning = a.elapsed < 0, charge = clamp(1 + a.elapsed / a.warning);
  const gapHalf = Math.PI / 12; // 30 graus no total (15 graus para cada lado)
  ctx.save(); ctx.translate(a.x, a.y);
  if (warning) {
    // Every ring is open at the escape sector; ornaments never close the gate.
    for (let layer = 0; layer < 3; layer++) {
      const r = 72 + layer * 18;
      ctx.beginPath(); ctx.arc(0, 0, r, a.gap + gapHalf, a.gap + TAU - gapHalf);
      ctx.globalAlpha = 0.3 + charge * 0.4; stroke(ctx, a.color, layer === 1 ? 2 : 1);
      for (let i = 0; i < 22; i++) {
        const angle = a.gap + gapHalf + 0.08 + i * (TAU - 2 * gapHalf - 0.16) / 21;
        ctx.save(); ctx.rotate(angle); ctx.translate(r, 0); ctx.rotate(Math.PI / 2);
        if (layer === 2) rune(ctx, 0, 0, 4, i);
        else { ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(2, 3); ctx.stroke(); }
        ctx.restore();
      }
    }
    // Orbiting embers are deterministic and stay outside the safe opening.
    for (let i = 0; i < 20; i++) {
      const p = (time * 0.004 + i / 20) % 1;
      const angle = a.gap + gapHalf + 0.08 + p * (TAU - 2 * gapHalf - 0.16);
      const r = 130 - charge * 30 + Math.sin(i * 2 + time * 0.04) * 5;
      glow(ctx, Math.cos(angle) * r, Math.sin(angle) * r, 5, a.color, 0.65);
    }
  }
  const distance = warning ? 100 : 70 + a.elapsed * (a.bolts[0]?.speed || 4.33);
  // The same fixed exit is visible during travel, not just during the windup.
  if (distance <= 1100) for (const side of [-1, 1]) {
    const angle = a.gap + side * gapHalf;
    ctx.save(); ctx.rotate(angle); ctx.strokeStyle = a.color; ctx.lineWidth = 1;
    ctx.globalAlpha = warning ? 0.55 : 0.28;
    ctx.setLineDash([4, 14]); ctx.beginPath(); ctx.moveTo(70, 0); ctx.lineTo(1100, 0); ctx.stroke(); ctx.setLineDash([]);
    ctx.translate(distance + 12, 0); ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-5, -5, 10, 10); ctx.restore();
  }
  if (warning) {
    ctx.save(); ctx.rotate(a.gap); ctx.globalAlpha = 0.65; ctx.strokeStyle = '#b8f5d4'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const x = 142 + i * 22 + (time * 0.4) % 22;
      ctx.beginPath(); ctx.moveTo(x - 6, -7); ctx.lineTo(x, 0); ctx.lineTo(x - 6, 7); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  for (let i = 0; i < a.bolts.length; i++) {
    const b = a.bolts[i]; if (b.hit) continue;
    const d = b.start + (warning ? 0 : a.elapsed * b.speed); if (d > b.range) continue;
    ctx.save(); ctx.translate(a.x + Math.cos(b.angle) * d, a.y + Math.sin(b.angle) * d); ctx.rotate(b.angle);
    ctx.globalAlpha = warning ? 0.4 + charge * 0.6 : 1;
    soul(ctx, b, a.color, time + i * 3, warning);
    // Small individual halos preserve the visible gaps between damaging souls.
    if (!warning) {
      ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.ellipse(0, 0, 5, b.radius + 3, 0, 0, TAU); stroke(ctx, a.color, 1);
    }
    ctx.restore();
  }
}

export function drawReaperRangedEffects(ctx, attack, frameCount) {
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (attack.skill === SKILLS.SOUL_LANCES) drawLances(ctx, attack, frameCount);
  else if (attack.skill === SKILLS.GRAVE_CROSS) drawCross(ctx, attack, frameCount);
  else if (attack.skill === SKILLS.WAILING_RING) drawChoir(ctx, attack, frameCount);
  ctx.restore();
}
