import { REAPER_STATES as STATES, REAPER_SKILLS as SKILLS } from './constants.js';
import { drawReaperRangedEffects } from './rangedEffects.js';

// Geometry is shared by warnings, rendering and collision. Times use game frames.
export const REAPER_RANGED = Object.freeze({
  [SKILLS.SOUL_LANCES]: { name: 'Lanças do Sepulcro', warning: 64, duration: 174, color: '#a9ede1', damage: 0.32 },
  [SKILLS.GRAVE_CROSS]: { name: 'Cruz do Juízo', warning: 78, duration: 48, color: '#e3afef', damage: 0.46 },
  [SKILLS.WAILING_RING]: { name: 'Coro dos Condenados', warning: 72, duration: 324, color: '#ffb579', damage: 0.36 }
});

export function beginReaperRanged(e, player, skill) {
  const config = REAPER_RANGED[skill];
  const angle = Math.atan2(player.y - e.y, player.x - e.x);
  const phase = e.isPhase3 ? 3 : e.isEnraged ? 2 : 1;
  const attack = {
    skill, ...config, x: e.x, y: e.y, angle, elapsed: -config.warning,
    lines: [], bolts: [], gap: angle + 0.65, phase
  };
  if (skill === SKILLS.SOUL_LANCES) {
    const count = phase === 1 ? 3 : 5;
    for (let i = 0; i < count; i++) {
      const a = angle + (i - (count - 1) / 2) * 0.19;
      attack.lines.push({ x: e.x, y: e.y, angle: a, length: 1100, width: 16 });
      for (let wave = 0; wave < (phase === 3 ? 3 : 2); wave++) {
        attack.bolts.push({ angle: a, delay: wave * 22, speed: 9, start: 38, radius: 8, range: 1100, hit: false });
      }
    }
  } else if (skill === SKILLS.GRAVE_CROSS) {
    // Snapshot the target once: the player has the full warning to leave the cross.
    const distance = Math.min(900, Math.hypot(player.x - e.x, player.y - e.y));
    const cx = e.x + Math.cos(angle) * distance, cy = e.y + Math.sin(angle) * distance;
    for (let i = 0; i < 2; i++) {
      const a = angle + Math.PI / 4 + i * Math.PI / 2;
      attack.lines.push({ x: cx - Math.cos(a) * 430, y: cy - Math.sin(a) * 430,
        angle: a, length: 860, width: phase === 3 ? 42 : 34, delay: i * 22, hit: false });
    }
  } else {
    const count = phase === 1 ? 28 : 36;
    for (let i = 0; i < count; i++) {
      const offset = (i / count) * Math.PI * 2;
      // A fixed 60-degree opening remains generous even in the final phase.
      if (Math.abs(Math.atan2(Math.sin(offset), Math.cos(offset))) < Math.PI / 6) continue;
      attack.bolts.push({ angle: attack.gap + offset, delay: 0, speed: 3.33, start: 70, radius: 11, range: 1100, hit: false });
    }
  }
  e.rangedAttack = attack;
  e.currentSkill = e.lastUsedSkill = skill;
  e.aimAngle = angle;
  e.actionState = STATES.WINDUP_RANGED;
  e.actionTimer = config.warning;
}

function segmentDistance(px, py, x, y, endX, endY) {
  const dx = endX - x, dy = endY - y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq ? Math.max(0, Math.min(1, ((px - x) * dx + (py - y) * dy) / lengthSq)) : 0;
  return Math.hypot(px - x - t * dx, py - y - t * dy);
}

export function cancelReaperRanged(e) { e.rangedAttack = null; }

export function updateReaperRanged(e, dt, player, onHit, onFire = () => {}) {
  const a = e.rangedAttack;
  if (!a) return;
  if (e.hp <= 0 || e.isVulnerable || ![STATES.WINDUP_RANGED, STATES.RANGED_ATTACK].includes(e.actionState)) {
    cancelReaperRanged(e);
    return;
  }
  const previous = a.elapsed;
  a.elapsed += Math.max(0, dt);
  e.actionTimer = Math.max(0, -a.elapsed);
  if (a.elapsed < 0) return;
  e.actionState = STATES.RANGED_ATTACK;
  if (previous < 0) onFire(a);
  const canHit = () => player.hp > 0 && (player.bossIFrames || 0) <= 0;
  const hit = target => {
    if (!target.hit && canHit()) {
      target.hit = true;
      onHit(Math.round(e.damage * a.damage), a.name, a.color);
    }
  };
  for (const line of a.lines) {
    if (a.skill !== SKILLS.GRAVE_CROSS) break;
    // Each arm stays lethal for 12 frames. Crossing its whole lifetime still hits.
    if (a.elapsed < line.delay || previous >= line.delay + 12) continue;
    const endX = line.x + Math.cos(line.angle) * line.length;
    const endY = line.y + Math.sin(line.angle) * line.length;
    if (segmentDistance(player.x, player.y, line.x, line.y, endX, endY) <= line.width / 2 + (player.radius || 0)) hit(line);
  }
  for (const b of a.bolts) {
    if (a.elapsed < b.delay || b.hit) continue;
    const oldDist = b.start + Math.max(0, previous - b.delay) * b.speed;
    if (oldDist > b.range) continue;
    const newDist = Math.min(b.range, b.start + (a.elapsed - b.delay) * b.speed);
    const dx = Math.cos(b.angle), dy = Math.sin(b.angle);
    if (segmentDistance(player.x, player.y, a.x + dx * oldDist, a.y + dy * oldDist,
      a.x + dx * newDist, a.y + dy * newDist) <= b.radius + (player.radius || 0)) hit(b);
  }
  if (a.elapsed >= a.duration) {
    cancelReaperRanged(e);
    e.actionState = STATES.POST_ATTACK_RECOVERY;
    e.actionTimer = e.isPhase3 ? 12 : 18;
  }
}

// Absolute world coordinates, before the mirrored body transform.
export function drawReaperRanged(ctx, e, frameCount) {
  const a = e.rangedAttack;
  if (!a || e.hp <= 0 || e.phaseCinematic || ![STATES.WINDUP_RANGED, STATES.RANGED_ATTACK].includes(e.actionState)) return;
  drawReaperRangedEffects(ctx, a, frameCount);
}
