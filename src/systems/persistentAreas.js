import { getGraphicsProfile } from '../core/responsive.js';
import { forEachNeighborIndex } from '../core/spatialGrid.js';

// Only friendly alchemy is consolidated. Fire, webs and hostile poison retain
// their individual geometry, lifetime and player-contact rules.
export const MAX_ALCHEMIST_REGION_RADIUS = 160;
let runtimes = new WeakMap();
const EPSILON = 1e-8;

function runtimeFor(areas) {
  let runtime = runtimes.get(areas);
  if (!runtime) {
    runtime = { records: [], pool: [], lookup: new Map(), dirty: true,
      untilQuery: 0, corrosionPhase: 0, cap: null, queries: 0 };
    runtimes.set(areas, runtime);
  }
  return runtime;
}

export function resetPersistentAreas(areas) {
  if (areas) runtimes.delete(areas);
  else runtimes = new WeakMap();
}

export function getPersistentAreaStats(areas) {
  const state = runtimeFor(areas);
  return { queries: state.queries, regions: areas.filter(p => p.isAlchemist).length,
    contributions: areas.reduce((sum, p) => sum + (p._areaSources?.length || 1), 0) };
}

function compatible(p) {
  return p.isAlchemist && !p.isFire && !p.isWeb && !p.isCaustic;
}

function enclose(ax, ay, ar, bx, by, br) {
  const dx = bx - ax;
  const dy = by - ay;
  const distance = Math.hypot(dx, dy);
  if (ar >= distance + br) return { x: ax, y: ay, radius: ar };
  if (br >= distance + ar) return { x: bx, y: by, radius: br };
  const radius = (distance + ar + br) / 2;
  const move = distance > 0 ? (radius - ar) / distance : 0;
  return { x: ax + dx * move, y: ay + dy * move, radius };
}

function refreshRegion(p) {
  const sources = p._areaSources;
  let write = 0;
  for (let i = 0; i < sources.length; i++) {
    if (sources[i].life > EPSILON) sources[write++] = sources[i];
  }
  sources.length = write;
  if (!write) { p.life = 0; return; }
  const first = sources[0];
  let x = first.x, y = first.y, radius = first.radius;
  let life = 0, damage = 0, evolved = false, maxLife = 0, count = 0;
  for (const source of sources) {
    const circle = enclose(x, y, radius, source.x, source.y, source.radius);
    x = circle.x; y = circle.y; radius = circle.radius;
    life = Math.max(life, source.life);
    maxLife = Math.max(maxLife, source.maxLife || source.life);
    damage = Math.max(damage, source.damage || 18);
    evolved ||= !!source.isEvolved;
    count += source._areaContributionCount || 1;
  }
  Object.assign(p, { x, y, radius: Math.min(MAX_ALCHEMIST_REGION_RADIUS, radius),
    life, maxLife, damage, isEvolved: evolved, overlapCount: Math.min(5, count) });
}

function createRegion(source) {
  const region = { ...source, _areaSources: [source], overlapCount: 1 };
  refreshRegion(region);
  return region;
}

function insertAlchemistRegion(areas, source, cap) {
  let best = null, bestCircle = null, bestDistance = Infinity;
  let count = 0, oldest = null;
  for (const p of areas) if (compatible(p) && p.life > EPSILON) count++;
  for (const p of areas) {
    if (!compatible(p) || p.life <= EPSILON) continue;
    if (!oldest || p.life < oldest.life) oldest = p;
    const dx = p.x - source.x, dy = p.y - source.y;
    const distanceSq = dx * dx + dy * dy;
    const nearby = Math.max(24, Math.min(p.radius, source.radius));
    if (count < cap && distanceSq > nearby * nearby) continue;
    const circle = enclose(p.x, p.y, p.radius, source.x, source.y, source.radius);
    if (circle.radius > MAX_ALCHEMIST_REGION_RADIUS || distanceSq >= bestDistance) continue;
    best = p; bestCircle = circle; bestDistance = distanceSq;
  }
  if (best) {
    if (!best._areaSources) best._areaSources = [{ ...best }];
    const duplicate = best._areaSources.find(p => p.x === source.x && p.y === source.y &&
      p.radius === source.radius && p.life === source.life && p.damage === source.damage &&
      !!p.isEvolved === !!source.isEvolved);
    if (duplicate) duplicate._areaContributionCount = Math.min(5,
      (duplicate._areaContributionCount || 1) + (source._areaContributionCount || 1));
    else best._areaSources.push(source);
    refreshRegion(best);
    // Keep the same enclosing circle used to select the compatible region.
    best.x = bestCircle.x; best.y = bestCircle.y; best.radius = bestCircle.radius;
    return best;
  }
  const region = createRegion(source);
  if (count >= cap && oldest) {
    // A distant new area replaces the friendly region nearest to expiration;
    // never grow a map-wide circle or discard a hostile hazard to meet a budget.
    areas[areas.indexOf(oldest)] = region;
  } else areas.push(region);
  return region;
}

export function enforcePersistentAreaBudget(areas, profile = getGraphicsProfile()) {
  const state = runtimeFor(areas);
  const cap = profile.maxAlchemistRegions;
  if (state.cap === cap) return;
  state.cap = cap;
  const original = areas.slice();
  areas.length = 0;
  for (const p of original) {
    if (!compatible(p)) { areas.push(p); continue; }
    const sources = p._areaSources || [p];
    for (const source of sources) {
      if (source.life <= EPSILON) continue;
      if (Number.isFinite(cap)) insertAlchemistRegion(areas, source, Math.max(1, cap));
      else areas.push(source);
    }
  }
  state.dirty = true;
}

export function registerPersistentArea(areas, definition, profile = getGraphicsProfile()) {
  // resetCollections empties this shared array without importing simulation.
  // Detect the first registration of the next match even before its first update.
  if (!areas.length) resetPersistentAreas(areas);
  enforcePersistentAreaBudget(areas, profile);
  const source = { ...definition, maxLife: definition.maxLife || definition.life,
    origin: definition.isAlchemist ? 'friendly-alchemy' : definition.isFire ? 'fire' : 'hostile',
    nature: definition.isAlchemist ? 'beneficial' : definition.isFire ? 'enemy-dot' : 'player-hazard' };
  const region = compatible(source) && Number.isFinite(profile.maxAlchemistRegions)
    ? insertAlchemistRegion(areas, source, Math.max(1, profile.maxAlchemistRegions))
    : (areas.push(source), source);
  runtimeFor(areas).dirty = true;
  return region;
}

// Sweep the actual movement segment, before resolving player impact. Fast shots
// must not pass through a friendly region between the 20 Hz enemy-area queries.
export function findDissolvingArea(bullet, startX, startY, areas) {
  if (bullet.isBossProjectile) return null;
  const dx = bullet.x - startX, dy = bullet.y - startY;
  const lengthSq = dx * dx + dy * dy;
  for (const p of areas) {
    if (!p.isAlchemist || p.life <= EPSILON) continue;
    const t = lengthSq > 0 ? Math.max(0, Math.min(1,
      ((p.x - startX) * dx + (p.y - startY) * dy) / lengthSq)) : 0;
    const px = startX + t * dx - p.x, py = startY + t * dy - p.y;
    const radius = p.radius + (bullet.radius || 5);
    if (px * px + py * py <= radius * radius) return p;
  }
  return null;
}

function canReceiveAreaDamage(e) {
  return (e.emergeTimer || 0) <= 0 && !(e.isBoss && e.actionState === 'SPAWN_INTRO') &&
    !(e.isBossSubTarget && (!e.active || (e.parentBoss &&
      (e.parentBoss.actionState === 'SPAWN_INTRO' || e.parentBoss.isTargetable === false))));
}

function queryCoverage(state, areas, enemies, query) {
  for (const record of state.records) state.pool.push(record);
  state.records.length = 0;
  state.lookup.clear();
  for (const p of areas) {
    if (!(p.life > EPSILON) || (!p.isFire && !p.isAlchemist)) continue;
    state.queries++;
    query(p.x, p.y, p.radius + 35, idx => {
      const e = enemies[idx];
      if (!e || e.hp <= 0 || e.isTargetable === false) return;
      const dotEligible = canReceiveAreaDamage(e);
      // Miasma previously slowed emerging enemies without damaging them.
      if (!dotEligible && !p.isAlchemist) return;
      const dx = e.x - p.x, dy = e.y - p.y;
      if (dx * dx + dy * dy >= (p.radius + e.radius) ** 2) return;
      let record = state.lookup.get(e);
      if (!record) {
        record = state.pool.pop() || {};
        Object.assign(record, { enemy: e, damage: 0, count: 0, alchemistCount: 0,
          alchemist: false, dotAlchemist: false, fire: false, evolved: false });
        state.lookup.set(e, record);
        state.records.push(record);
      }
      const count = p.overlapCount || p._areaContributionCount || 1;
      let damage = p.isAlchemist ? (p.damage || 18) * 0.045 : 0.55;
      if (p.isAlchemist && e.baseType === 'LITOCISTO') damage *= 4;
      if (dotEligible) {
        record.damage = Math.max(record.damage, damage);
        record.count = Math.min(4, record.count + count);
      }
      record.alchemistCount = Math.min(5, record.alchemistCount + (p.isAlchemist ? count : 0));
      record.alchemist ||= !!p.isAlchemist;
      record.dotAlchemist ||= !!p.isAlchemist && dotEligible;
      record.fire ||= !!p.isFire && dotEligible;
      record.evolved ||= !!p.isEvolved;
    });
  }
  state.dirty = false;
}

function applyEnemyCoverage(state, step, context, corrosionTick, simpleEffects) {
  const { player, effects = {} } = context;
  for (const record of state.records) {
    const e = record.enemy;
    if (e.hp <= 0 || e.isTargetable === false) continue;
    const damageEligible = canReceiveAreaDamage(e);
    const dotAlchemist = record.dotAlchemist && damageEligible;
    let dot = damageEligible ? record.damage *
      (1 + Math.min(0.45, Math.max(0, record.count - 1) * 0.15)) * step : 0;
    if (e.acidStacks > 0) dot *= 1 + e.acidStacks * 0.06;
    if ((e.isBoss || e.isMiniBoss) && dotAlchemist) dot *= 40 / 27;
    e.hp -= dot;
    if (record.alchemist) {
      e.inAcidPuddle = true;
      e.slowTimer = Math.max(e.slowTimer || 0, 40);
      e.slowFactor = dotAlchemist ? (record.evolved ? 0.65 : 0.45) : 0.70;
      if (e.dashState === 'dashing') { e.dashState = 'cooldown'; e.dashTimer = 0; }
      if (corrosionTick) e.acidStacks = Math.min(5, (e.acidStacks || 0) + record.alchemistCount);
      if (dotAlchemist) e.acidStackTimer = 200;
      else if (corrosionTick) e.acidStackTimer = 180;
      e.acidBurnTimer = Math.max(e.acidBurnTimer || 0, 160);
      if (record.evolved) e.acidBurnEvolved = true;
      if (dotAlchemist) {
        e.acidDotAcc = (e.acidDotAcc || 0) + dot;
        e.acidDotTimer = (e.acidDotTimer || 0) + step;
      }
      if (dotAlchemist && e.acidDotTimer + EPSILON >= 22) {
        const portion = e.acidDotAcc * 22 / e.acidDotTimer;
        const display = Math.round(portion);
        if (display >= 1) effects.damageText?.(e.x, e.y - (e.radius || 14) * 0.5,
          display, false, record.evolved ? '#a29bfe' : '#9b59b6');
        e.acidDotAcc -= portion;
        e.acidDotTimer = Math.max(0, e.acidDotTimer - 22);
      }
      if (!simpleEffects && Math.random() < 1 - Math.exp(-0.02 * step))
        effects.hitParticles?.(e.x, e.y, record.evolved ? '#d6a2e8' : '#a29bfe', 1);
    }
    if (record.fire && damageEligible) {
      effects.fireBurn?.(e, 90, (player.damage || 45) * 0.30, false);
      if (!simpleEffects && Math.random() < 1 - Math.exp(-0.03 * step))
        effects.hitParticles?.(e.x, e.y, '#f39c12', 1);
    }
  }
}

function applyPlayerContact(areas, step, context) {
  const { player, selectedHeroKey, effects = {} } = context;
  if (player.hp <= 0) return;
  let inside = false, evolved = false;
  for (const p of areas) {
    if (p.life <= EPSILON) continue;
    const dx = player.x - p.x, dy = player.y - p.y;
    if (dx * dx + dy * dy >= (p.radius + player.radius) ** 2) continue;
    if (p.isAlchemist) {
      player.alchemistBuffTimer = 180;
      inside = true; evolved ||= !!p.isEvolved;
    } else if (!p.isFire && player.iFrames <= 0) {
      p.tickTimer = (p.tickTimer || 0) + step;
      if (p.tickTimer + EPSILON >= 20) {
        p.tickTimer %= 20;
        const damage = p.isCaustic ? 4 : 6;
        player.hp -= damage;
        player.iFrames = 18;
        effects.playerHazard?.(p, damage);
        if (player.hp <= 0) return;
      }
    }
  }
  if (inside && selectedHeroKey === 'ALCHEMIST') {
    player.alchemistHealTimer = (player.alchemistHealTimer || 0) + step;
    while (player.alchemistHealTimer + EPSILON >= 23) {
      player.alchemistHealTimer = Math.max(0, player.alchemistHealTimer - 23);
      const amount = evolved ? 3 : 2;
      if (player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + amount);
        effects.heal?.(amount);
      }
    }
  } else player.alchemistHealTimer = Math.max(0, (player.alchemistHealTimer || 0) - step);
}

function nextExpiration(areas) {
  let time = Infinity;
  for (const p of areas) {
    if (p._areaSources) {
      for (const source of p._areaSources) time = Math.min(time, source.life);
    } else time = Math.min(time, p.life);
  }
  return Math.max(0, time);
}

function ageAreas(areas, step, state) {
  let write = 0;
  for (const p of areas) {
    if (p._areaSources) {
      let expired = false;
      for (const source of p._areaSources) { source.life -= step; expired ||= source.life <= EPSILON; }
      if (expired) { refreshRegion(p); state.dirty = true; }
      else p.life -= step;
    } else p.life -= step;
    if (p.life > EPSILON) areas[write++] = p;
    else state.dirty = true;
  }
  areas.length = write;
}

export function updatePersistentAreas(dt, context, profile = getGraphicsProfile()) {
  const { areas, enemies, query = forEachNeighborIndex } = context;
  if (!(dt > 0)) return;
  if (!areas.length) {
    context.player.alchemistHealTimer = Math.max(0, (context.player.alchemistHealTimer || 0) - dt);
    resetPersistentAreas(areas);
    return;
  }
  enforcePersistentAreaBudget(areas, profile);
  const state = runtimeFor(areas);
  const interval = Math.max(0.5, profile.puddleTickFrames || 1);
  // Cache contains enemy objects, never grid indices. A dead/removed enemy is
  // skipped even if the next spatial refresh is two frames away.
  let remaining = dt;
  while (remaining > EPSILON && areas.length) {
    if (state.dirty || state.untilQuery <= EPSILON) {
      queryCoverage(state, areas, enemies, query);
      state.untilQuery = interval;
    }
    const expiry = nextExpiration(areas);
    if (expiry <= EPSILON) { ageAreas(areas, 0, state); continue; }
    const step = Math.min(remaining, state.untilQuery, 15 - state.corrosionPhase, expiry);
    const corrosionTick = state.corrosionPhase + step + EPSILON >= 15;
    applyEnemyCoverage(state, step, context, corrosionTick, profile.simpleEffects);
    applyPlayerContact(areas, step, context);
    ageAreas(areas, step, state);
    state.corrosionPhase = corrosionTick ? 0 : state.corrosionPhase + step;
    state.untilQuery -= step;
    remaining -= step;
    if (context.player.hp <= 0) break;
  }
  if (!areas.length) {
    context.player.alchemistHealTimer = Math.max(0,
      (context.player.alchemistHealTimer || 0) - remaining);
    resetPersistentAreas(areas);
  }
}
