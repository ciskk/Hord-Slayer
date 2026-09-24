/** Passo Ígneo: bounded, reusable world-space cosmetics. Times are 60 Hz frames.
 * No timers, random per-frame geometry, particle allocations or gameplay damage.
 */
const TAU = Math.PI * 2;
const TRAIL_LIFE = 68;
const SPACING = 16;
// Prebuilt irregular fracture variants keep repeated marks from looking like a comb.
const crackShapes = Array.from({ length: 8 }, (_, variant) => {
  const nodes = new Float32Array(12);
  for (let i = 0; i < 6; i++) {
    nodes[i * 2] = -12 + i * 5;
    nodes[i * 2 + 1] = Math.sin(i * 7.13 + variant * 2.7) * 3;
  }
  return nodes;
});
const trail = Array.from({ length: 28 }, () => ({ x: 0, y: 0, angle: 0, life: 0, variant: 0 }));
const bursts = Array.from({ length: 6 }, () => ({ x: 0, y: 0, facing: 1, arrival: false, life: 0, maxLife: 0 }));
let trailCursor = 0, burstCursor = 0;
let lastX = 0, lastY = 0, carry = 0, tracking = false;

function addBurst(x, y, facing, arrival) {
  const b = bursts[burstCursor];
  burstCursor = (burstCursor + 1) % bursts.length;
  b.x = x; b.y = y; b.facing = facing; b.arrival = arrival;
  b.life = b.maxLife = arrival ? 54 : 42;
}

export function beginIgnisStep(x, y, facing = 1) {
  lastX = x; lastY = y; carry = 0; tracking = true;
  addBurst(x, y, facing, false);
}

/** Sample distance along the actual path, including turns and arena constraints. */
export function traceIgnisStep(x, y, finished = false, facing = 1) {
  if (!tracking) return;
  const dx = x - lastX, dy = y - lastY;
  const distance = Math.hypot(dx, dy);
  if (distance > 0.001) {
    const angle = Math.atan2(dy, dx);
    let offset = SPACING - carry;
    // Bounded even if a debug teleport supplies an arbitrarily long segment.
    for (let n = 0; offset <= distance && n < trail.length; n++, offset += SPACING) {
      const mark = trail[trailCursor];
      trailCursor = (trailCursor + 1) % trail.length;
      mark.x = lastX + dx * offset / distance;
      mark.y = lastY + dy * offset / distance + 12;
      mark.angle = angle; mark.life = TRAIL_LIFE;
      mark.variant = Math.abs(Math.floor(mark.x * .31 + mark.y * .17)) % crackShapes.length;
    }
    carry = (carry + distance) % SPACING;
  }
  lastX = x; lastY = y;
  if (finished) { addBurst(x, y, facing, true); tracking = false; }
}

export function clearIgnisStepEffects() {
  for (const mark of trail) mark.life = 0;
  for (const burst of bursts) burst.life = 0;
  trailCursor = burstCursor = carry = 0;
  tracking = false;
}

export function updateIgnisStepEffects(dt) {
  for (const mark of trail) mark.life = Math.max(0, mark.life - dt);
  for (const burst of bursts) burst.life = Math.max(0, burst.life - dt);
}

function visible(effect, left, right, top, bottom, margin) {
  return effect.life > 0 && (left === undefined || !(effect.x + margin < left ||
    effect.x - margin > right || effect.y + margin < top || effect.y - margin > bottom));
}

/** Called by groundCracks.js after the damaging fire puddles. */
export function drawIgnisStepGround(c, left, right, top, bottom) {
  for (const mark of trail) {
    if (!visible(mark, left, right, top, bottom, 40)) continue;
    const age = TRAIL_LIFE - mark.life;
    const fade = Math.min(1, mark.life / 30);
    c.save(); c.translate(mark.x, mark.y); c.rotate(mark.angle);
    c.globalAlpha *= fade;
    c.fillStyle = '#23171599';
    c.beginPath(); c.ellipse(0, 0, 17, 9, 0, 0, TAU); c.fill();
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath();
    const nodes = crackShapes[mark.variant];
    c.moveTo(nodes[0], nodes[1]);
    for (let n = 2; n < nodes.length; n += 2) c.lineTo(nodes[n], nodes[n + 1]);
    const sign = mark.variant % 2 ? 1 : -1;
    c.moveTo(nodes[4], nodes[5]);
    c.lineTo(nodes[4] + 3, sign * (6 + mark.variant * .4));
    c.lineTo(nodes[4] + 1, sign * (9 + mark.variant * .5));
    if (mark.variant % 3 === 0) {
      c.moveTo(nodes[8], nodes[9]); c.lineTo(nodes[8] - 3, -sign * 6);
    }
    c.strokeStyle = '#160f13'; c.lineWidth = 4; c.stroke();
    c.strokeStyle = '#ab3624'; c.lineWidth = 2.6; c.stroke();
    c.globalAlpha *= .75 + Math.sin(age * .19) * .15;
    c.strokeStyle = '#ff963e'; c.lineWidth = 1.2; c.stroke();
    c.globalAlpha *= Math.max(.15, 1 - age / TRAIL_LIFE);
    c.strokeStyle = '#ffe8ab'; c.lineWidth = .45; c.stroke();
    c.restore();
  }
  for (const b of bursts) {
    if (!visible(b, left, right, top, bottom, 100)) continue;
    drawIgnisHeatRing(c, b.x, b.y + 12, b.maxLife - b.life, b.arrival);
  }
}

export function drawIgnisHeatRing(c, x, y, age, arrival = false) {
  if (age < 0 || age >= 20) return;
  const p = age / 20, radius = 8 + Math.sin(p * Math.PI / 2) * (arrival ? 70 : 46);
  c.save(); c.translate(x, y); c.globalAlpha *= (1 - p) * (1 - p);
  c.beginPath(); c.ellipse(0, 0, radius, radius * .62, 0, 0, TAU);
  c.fillStyle = '#ff682a33'; c.fill();
  c.strokeStyle = '#bf3924'; c.lineWidth = 7 * (1 - p) + 1; c.stroke();
  c.strokeStyle = '#ffc06a'; c.lineWidth = 2.5 * (1 - p) + .5; c.stroke();
  c.restore();
}

/** Local, stateless flame primitive shared by the trail and staff. */
export function drawIgnisFlame(c, x, y, width, height, sway, color) {
  c.fillStyle = color;
  c.beginPath(); c.moveTo(x - width, y);
  c.bezierCurveTo(x - width, y - height * .45, x + sway - width * .5, y - height * .6, x + sway, y - height);
  c.bezierCurveTo(x + sway + width * .3, y - height * .55, x + width, y - height * .3, x + width, y);
  c.quadraticCurveTo(x, y + width * .4, x - width, y); c.fill();
}

/** Residual damage footprint: dark scorched earth and low flames, not a white disc. */
export function drawIgnisResidualFire(c, x, y, radius, fade, t) {
  c.save(); c.translate(x, y); c.globalAlpha *= fade * .65;
  c.fillStyle = '#261619'; c.beginPath(); c.ellipse(0, 0, radius, radius * .65, 0, 0, TAU); c.fill();
  c.strokeStyle = '#b64b2b'; c.lineWidth = 1.2; c.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = i * TAU / 5 + x * .01;
    c.moveTo(Math.cos(a) * radius * .3, Math.sin(a) * radius * .2);
    c.lineTo(Math.cos(a + .2) * radius * .55, Math.sin(a + .2) * radius * .38);
    c.lineTo(Math.cos(a) * radius * .88, Math.sin(a) * radius * .58);
  }
  c.stroke();
  for (let i = 0; i < 2; i++) {
    const fx = (i ? 1 : -1) * radius * .4, fy = Math.sin(x + i) * radius * .22;
    const sway = Math.sin(t * .17 + x + i * 2) * 3;
    const h = (8 + Math.sin(t * .23 + y + i) * 2) * fade;
    drawIgnisFlame(c, fx, fy, 3.5, h, sway, '#ee692f');
    drawIgnisFlame(c, fx, fy, 1.5, h * .6, sway * .5, '#ffca79');
  }
  c.restore();
}

/** One fixed silhouette at departure; never follows the moving player. */
function drawThermalAfterimage(c, age, facing) {
  c.save(); c.scale(facing, 1);
  c.globalAlpha *= Math.max(0, 1 - age / 36) * .65;
  c.translate(Math.sin(age * .31) * .7, -age * .045);
  c.fillStyle = '#ff883c'; c.strokeStyle = '#ffd090'; c.lineWidth = .8;
  c.beginPath(); c.moveTo(-5, -5); c.lineTo(-16, 17); c.lineTo(-8, 13);
  c.lineTo(-10, 19); c.lineTo(4, 14); c.lineTo(8, 1); c.lineTo(5, -6); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(0, -10, 6.8, 8, -.15, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(-7, 16); c.lineTo(-2, -10); c.lineTo(-12, -23); c.stroke();
  c.beginPath(); c.arc(-12, -25, 3.5, 0, TAU); c.fill();
  c.restore();
}

export function drawIgnisStepBurst(c, x, y, age, arrival = false, facing = 1) {
  const life = arrival ? 54 : 42;
  if (age < 0 || age >= life) return;
  c.save(); c.translate(x, y);
  if (!arrival) drawThermalAfterimage(c, age, facing);
  // Broken soot rings rise and expand; no blur or offscreen surfaces needed.
  if (arrival) {
    for (let ring = 0; ring < 3; ring++) {
      const p = (age - ring * 4) / (life - ring * 4);
      if (p < 0 || p >= 1) continue;
      c.save(); c.globalAlpha *= Math.sin(Math.PI * p) * .55;
      c.strokeStyle = '#171319'; c.lineWidth = 6 * (1 - p) + 2;
      c.beginPath();
      for (let arc = 0; arc < 5; arc++) {
        const a = arc * TAU / 5 + ring * .5 + p * .25;
        const rx = 13 + p * (48 + ring * 4), ry = rx * .36;
        c.moveTo(Math.cos(a) * rx, 10 - p * 30 + Math.sin(a) * ry);
        c.ellipse(0, 10 - p * 30, rx, ry, 0, a, a + .87);
      }
      c.stroke(); c.restore();
    }
  }
  c.globalAlpha *= Math.min(1, (life - age) / 20);
  c.strokeStyle = '#ffbb66'; c.lineWidth = 1.1;
  c.beginPath();
  for (let i = 0; i < (arrival ? 18 : 16); i++) {
    const a = i * 2.39996, speed = 1.1 + (i % 4) * .3;
    const distance = 6 + speed * age * (1 - age / (life * 1.6));
    const x = Math.cos(a) * distance;
    const y = 10 + Math.sin(a) * distance * .55 - (arrival ? age * (.45 + i % 3 * .14) : 0);
    c.moveTo(x, y); c.lineTo(x - Math.cos(a) * 3, y + (arrival ? 2.5 : -Math.sin(a) * 2));
  }
  c.stroke(); c.restore();
}

/** Above actors: low licking flames, soot and rising sparks. */
export function drawIgnisStepAir(c, left, right, top, bottom) {
  for (let i = 0; i < trail.length; i++) {
    const mark = trail[i];
    if (!visible(mark, left, right, top, bottom, 40)) continue;
    const age = TRAIL_LIFE - mark.life;
    c.save(); c.translate(mark.x, mark.y);
    c.globalAlpha *= Math.min(1, mark.life / 36) * .8;
    const sway = Math.sin(age * .24 + i * 2.1) * 3;
    const height = (9 + Math.sin(age * .33 + i) * 3) * Math.min(1, mark.life / 35);
    drawIgnisFlame(c, 0, 0, 5, height, sway, '#ed582b');
    drawIgnisFlame(c, 0, 0, 2.5, height * .65, sway * .6, '#ffd17c');
    c.fillStyle = '#ffd9a0';
    const p = ((age + i * 7) % 30) / 30;
    c.globalAlpha *= Math.sin(p * Math.PI);
    c.fillRect(sway * 2, -p * 25, 1.2, 1.8);
    c.restore();
  }
  for (const b of bursts) {
    if (visible(b, left, right, top, bottom, 100)) {
      drawIgnisStepBurst(c, b.x, b.y, b.maxLife - b.life, b.arrival, b.facing);
    }
  }
}
