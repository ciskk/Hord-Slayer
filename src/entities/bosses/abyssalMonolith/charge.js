import { MONOLITH_STATES as STATES, MONOLITH_SKILLS as SKILLS, MONOLITH_CONFIG as CONFIG } from './constants.js';

// A short, bounded prediction; the entire warning shows the final, immutable path.
export function beginTectonicCharge(e, player) {
  const leadX = (player.vx || 0) * 12;
  const leadY = (player.vy || 0) * 12;
  const leadScale = Math.min(1, 60 / (Math.hypot(leadX, leadY) || 1));
  const dx = player.x + leadX * leadScale - e.x;
  const dy = player.y + leadY * leadScale - e.y;
  const distance = Math.min(CONFIG.CHARGE_MAX_DISTANCE, Math.hypot(dx, dy));
  e.aimAngle = Math.atan2(dy, dx);
  e.aimLocked = true;
  e.facing = dx >= 0 ? 1 : -1;
  e.charge = {
    startX: e.x, startY: e.y,
    endX: e.x + Math.cos(e.aimAngle) * distance,
    endY: e.y + Math.sin(e.aimAngle) * distance,
    elapsed: 0, duration: Math.max(24, distance / (e.isPhase3 ? 13 : e.isEnraged ? 11 : 9)),
    hit: false
  };
  e.currentSkill = e.lastUsedSkill = SKILLS.TECTONIC_CHARGE;
  e.actionState = STATES.WINDUP_CHARGE;
  e.actionTimer = e.maxActionTimer = e.isPhase3 ? 48 : 60;
  e.chargeCooldown = CONFIG.CHARGE_COOLDOWN;
  e.comboNext = null;
}

export function advanceTectonicCharge(e, dt, player, onHit) {
  const c = e.charge;
  const oldX = e.x, oldY = e.y;
  c.elapsed = Math.min(c.duration, c.elapsed + dt);
  const t = c.elapsed / c.duration;
  const progress = t * t * (3 - 2 * t);
  e.x = c.startX + (c.endX - c.startX) * progress;
  e.y = c.startY + (c.endY - c.startY) * progress;
  // Sweep the whole movement segment so low frame rates cannot skip a hit.
  const dx = e.x - oldX, dy = e.y - oldY;
  const lengthSq = dx * dx + dy * dy;
  const u = lengthSq ? Math.max(0, Math.min(1, ((player.x - oldX) * dx + (player.y - oldY) * dy) / lengthSq)) : 0;
  // Match the other Monolith attacks: generic contact/camera i-frames must not
  // suppress boss damage. Boss-specific protection still allows skill dodges.
  if (!c.hit && (player.bossIFrames || 0) <= 0 &&
      Math.hypot(player.x - oldX - dx * u, player.y - oldY - dy * u) <= CONFIG.CHARGE_RADIUS + (player.radius || 0)) {
    c.hit = true;
    onHit();
  }
  // Orbitals have already ticked this frame; carry them with the moving body.
  for (const o of e.orbitals || []) {
    if (o.active) { o.x += dx; o.y += dy; }
  }
  if (t >= 1) {
    e.actionState = STATES.POST_ATTACK_RECOVERY;
    e.actionTimer = 42;
    e.charge = null;
    return true;
  }
  return false;
}

// Called in the renderer's unmirrored, boss-relative coordinate system.
export function drawTectonicCharge(ctx, e, frameCount) {
  if (!e.charge || ![STATES.WINDUP_CHARGE, STATES.CHARGING].includes(e.actionState)) return;
  const c = e.charge;
  const winding = e.actionState === STATES.WINDUP_CHARGE;
  const length = Math.hypot(c.endX - c.startX, c.endY - c.startY);
  ctx.save();
  ctx.translate(c.startX - e.x, c.startY - e.y);
  ctx.rotate(e.aimAngle);
  ctx.lineCap = 'round';
  ctx.strokeStyle = winding ? 'rgba(255,100,35,0.19)' : 'rgba(255,160,40,0.12)';
  ctx.lineWidth = CONFIG.CHARGE_RADIUS * 2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(length, 0); ctx.stroke();
  ctx.strokeStyle = winding ? '#ffb74d' : '#ffe0a0';
  ctx.lineWidth = 2;
  ctx.setLineDash(winding ? [12, 8] : []);
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(0, side * CONFIG.CHARGE_RADIUS);
    ctx.lineTo(length, side * CONFIG.CHARGE_RADIUS);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  const offset = (frameCount * 2) % 65;
  for (let x = 30 + offset; x < length - 15; x += 65) {
    ctx.beginPath(); ctx.moveTo(x - 12, -12); ctx.lineTo(x, 0); ctx.lineTo(x - 12, 12); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(length, 0, CONFIG.CHARGE_RADIUS, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
