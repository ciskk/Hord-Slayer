/** Bounded, resolution-aware atlas for common enemy bodies and foregrounds. */
import { ctx, setMainCtx, frameCount, setFrameCount, baseCameraZoom } from '../../state/gameState.js';
import { layoutMetrics, getGraphicsProfile } from '../../core/responsive.js';
import { isCrawler, crawlPhase } from '../../entities/enemies/crawlerLocomotion.js';
import { perfMetrics } from '../../core/perfMetrics.js';
import { ENEMY_TYPES } from '../../config/enemies.js';
const TAU = Math.PI * 2;
const BASE_CELL_SIZE = 96, BASE_HALF_CELL = BASE_CELL_SIZE / 2;
const ATLAS_COLS = 16, ATLAS_ROWS = 16, MAX_SLOTS = ATLAS_COLS * ATLAS_ROWS;
const MAX_PREWARM_ENTRIES = 128;
const CACHEABLE_TYPES = new Set(['ZOMBIE', 'BAT', 'GOLEM', 'STALKER', 'SPLITTER', 'SPLITTER_MINI', 'TRAIL_CRAWLER', 'MAIDEN_THORNS', 'SHIELDED', 'SHOOTER', 'NECRO']);
// Bodies are authored in radius-normalized coordinates. Bake at the largest
// regular/elite size and scale down smaller bodies, preserving detail while
// sharing slots. Absolute-size aimed weapons remain in their live layers.
const CACHE_RADII = Object.fromEntries([...CACHEABLE_TYPES].map(type => [type, Math.max(ENEMY_TYPES[type].radius, Math.round(ENEMY_TYPES[type].radius * 1.25))]));
const BODY_EXTENTS = { BAT: 2.4, GOLEM: 1.55, ZOMBIE: 1.6, SHIELDED: 1.25, SHOOTER: 1.2, NECRO: 1.6 };
const FREQUENCIES = { MAIDEN_THORNS: .14 };
const STATELESS_BODIES = new Set(['SHOOTER', 'NECRO', 'TRAIL_CRAWLER', 'MAIDEN_THORNS']);
const COMBAT_STATES = new Set(['CHASE', 'RECOVERY', 'WINDUP', 'STRIKE']);
let atlasCanvas = null, atlasCtx = null, currentCacheDpr = 1;
let cellPixelSize = BASE_CELL_SIZE, nextSlotIndex = 0, useSerial = 0;
const spriteSlots = new Map(), slotKeys = new Array(MAX_SLOTS), slotLastUsed = new Float64Array(MAX_SLOTS);
const prewarmQueue = [], prewarmKeys = new Set();
export function getCurrentCacheDpr() { return currentCacheDpr; }
export function getAtlasDimensions() {
  return { cellPixelSize, cols: ATLAS_COLS, rows: ATLAS_ROWS, width: atlasCanvas?.width || 0, height: atlasCanvas?.height || 0,
    usedSlots: spriteSlots.size, maxSlots: MAX_SLOTS, pendingPrewarm: prewarmQueue.length };
}
function resetSlots() {
  spriteSlots.clear(); slotKeys.fill(null); slotLastUsed.fill(0); nextSlotIndex = 0; useSerial = 0;
}
function ensureAtlas() {
  const targetDpr = Math.min(2.5, Math.max(1, Math.round((layoutMetrics.dpr || 1) * (baseCameraZoom || 1.25) * 100) / 100));
  if (atlasCanvas && atlasCtx && currentCacheDpr === targetDpr) return true;
  if (typeof document === 'undefined') return false;
  currentCacheDpr = targetDpr; cellPixelSize = Math.round(BASE_CELL_SIZE * currentCacheDpr);
  atlasCanvas ||= document.createElement('canvas');
  atlasCanvas.width = cellPixelSize * ATLAS_COLS; atlasCanvas.height = cellPixelSize * ATLAS_ROWS;
  atlasCtx = atlasCanvas.getContext('2d', { alpha: true });
  if (atlasCtx) { atlasCtx.imageSmoothingEnabled = true; atlasCtx.imageSmoothingQuality = 'high'; }
  resetSlots(); return !!atlasCtx;
}
export function clearSpriteCache() {
  resetSlots(); prewarmQueue.length = 0; prewarmKeys.clear();
  if (atlasCtx && atlasCanvas) atlasCtx.clearRect(0, 0, atlasCanvas.width, atlasCanvas.height);
}
function bodyPose(e) {
  const state = e.combatState || 'CHASE';
  if (STATELESS_BODIES.has(e.baseType)) return 'CHASE';
  if (e.baseType === 'SHIELDED') return state === 'WINDUP' ? 'WINDUP' : 'CHASE';
  // Zombie attack arms stay live; their torso is shared between both attacks.
  if (e.baseType === 'ZOMBIE' && (state === 'WINDUP' || state === 'STRIKE')) return 'WINDUP';
  return state === 'RECOVERY' ? 'CHASE' : state;
}
/** A finite visual key: world position, facing, aim, timers and HP are not keys. */
export function getEnemySpriteDescriptor(e, renderer, phaseOverride = null, layer = 'body') {
  if (!e || !renderer?.draw || !CACHEABLE_TYPES.has(e.baseType) || e.isBoss || e.isMiniBoss || e.isBossSubTarget ||
      e.deathPose !== undefined || !(e.radius > 0) || !Number.isFinite(e.radius) ||
      (e.dashState && e.dashState !== 'chase' && e.dashState !== 'cooldown') || e.fuseState === 'FUSE' ||
      e.emergeTimer > 0 || (e.leapState && e.leapState !== 'none') || e.jumpZ > 0 || e.landingSplashTimer > 0 || e.isCharging ||
      !COMBAT_STATES.has(e.combatState || 'CHASE')) return null;
  const extent = layer === 'foreground' ? 1.3 : (BODY_EXTENTS[e.baseType] || 1.65);
  const bakeRadius = Math.max(e.radius, CACHE_RADII[e.baseType]);
  // Includes outline/miter padding. Large custom creatures retain the procedural path.
  if (bakeRadius * extent + 1.5 > BASE_HALF_CELL) return null;
  const crawler = isCrawler(e), profile = getGraphicsProfile();
  const phaseCount = layer === 'foreground' ? 1 : (crawler ? profile.crawlerAnimationSteps : profile.enemyAnimationSteps);
  const frequency = typeof renderer.animationFrequency === 'function' ? renderer.animationFrequency(e) : (renderer.animationFrequency || FREQUENCIES[e.baseType] || .18);
  const phase = crawler ? crawlPhase(e, frameCount) : frameCount * frequency;
  const animStep = phaseOverride === null ? Math.floor(((phase % TAU + TAU) % TAU) / TAU * phaseCount) : phaseOverride % phaseCount;
  const pose = layer === 'foreground' ? 'CHASE' : bodyPose(e);
  const variant = e.baseType === 'ZOMBIE' ? ((e.variant || 0) % 4 + 4) % 4 : 0;
  const thornPose = e.baseType === 'MAIDEN_THORNS' ? (e.spikeBurstTimer > 0 ? 'burst' : e.spikeHits >= 3 ? 'warning' : 'rest') : '';
  const hit = e.hitFlash > 0;
  return {
    key: `${e.baseType}:r${bakeRadius}:v${variant}:${layer}:${pose}:${thornPose}:${phaseCount}:${animStep}:${hit ? 'h' : 'n'}`,
    layer, pose, animStep, phaseCount, frequency, crawler, hit, variant, thornPose, bakeRadius, scale: e.radius / bakeRadius,
    draw: layer === 'foreground' ? renderer.drawForeground : (renderer.drawBody || renderer.draw)
  };
}
function bakeSprite(e, descriptor, allowEviction = true) {
  let slotIdx;
  if (nextSlotIndex < MAX_SLOTS) slotIdx = nextSlotIndex++;
  else {
    if (!allowEviction) return null;
    slotIdx = 0;
    for (let i = 1; i < MAX_SLOTS; i++) if (slotLastUsed[i] < slotLastUsed[slotIdx]) slotIdx = i;
    spriteSlots.delete(slotKeys[slotIdx]);
  }
  const sx = (slotIdx % ATLAS_COLS) * cellPixelSize, sy = Math.floor(slotIdx / ATLAS_COLS) * cellPixelSize;
  const savedCtx = ctx, savedFc = frameCount;
  try {
    perfMetrics.countSpriteBake(); atlasCtx.clearRect(sx, sy, cellPixelSize, cellPixelSize);
    setMainCtx(atlasCtx); setFrameCount(descriptor.animStep * TAU / descriptor.phaseCount / descriptor.frequency);
    const mockEntity = { ...e, radius: descriptor.bakeRadius, x: 0, y: 0, facing: 1, variant: descriptor.variant,
      combatState: descriptor.pose, hitFlash: descriptor.hit ? 4 : 0,
      crawlPhase: descriptor.crawler ? descriptor.animStep * TAU / descriptor.phaseCount : e.crawlPhase,
      spikeHits: descriptor.thornPose === 'warning' ? 3 : 0, spikeBurstTimer: descriptor.thornPose === 'burst' ? 1 : 0 };
    atlasCtx.save();
    try {
      atlasCtx.beginPath(); atlasCtx.rect(sx, sy, cellPixelSize, cellPixelSize); atlasCtx.clip();
      atlasCtx.translate(sx + cellPixelSize / 2, sy + cellPixelSize / 2); atlasCtx.scale(currentCacheDpr, currentCacheDpr);
      descriptor.draw(mockEntity);
    } finally { atlasCtx.restore(); }
  } catch (_) { slotKeys[slotIdx] = null; slotLastUsed[slotIdx] = 0; return null;
  } finally { setMainCtx(savedCtx); setFrameCount(savedFc); }
  const slot = { slotIdx, sx, sy, pixelSize: cellPixelSize };
  spriteSlots.set(descriptor.key, slot); slotKeys[slotIdx] = descriptor.key; slotLastUsed[slotIdx] = allowEviction ? ++useSerial : 0;
  return slot;
}
function resolveSprite(e, descriptor) {
  if (!descriptor?.draw) return null;
  const existing = spriteSlots.get(descriptor.key);
  // Pin a reused body before resolving its foreground, which may need an LRU slot.
  if (existing) slotLastUsed[existing.slotIdx] = ++useSerial;
  return existing ? { slot: existing, hit: true, scale: descriptor.scale } : { slot: bakeSprite(e, descriptor), hit: false, scale: descriptor.scale };
}
function blit(targetCtx, resolved) {
  const slot = resolved.slot;
  if (resolved.hit) perfMetrics.countSpriteHit(); slotLastUsed[slot.slotIdx] = ++useSerial;
  targetCtx.drawImage(atlasCanvas, slot.sx, slot.sy, slot.pixelSize, slot.pixelSize,
    -BASE_HALF_CELL * resolved.scale, -BASE_HALF_CELL * resolved.scale, BASE_CELL_SIZE * resolved.scale, BASE_CELL_SIZE * resolved.scale);
}
export function drawCachedEnemy(targetCtx, e, renderer) {
  const body = getEnemySpriteDescriptor(e, renderer);
  if (!body || !ensureAtlas()) return false;
  const foreground = renderer.drawForeground ? getEnemySpriteDescriptor(e, renderer, 0, 'foreground') : null;
  if (renderer.drawForeground && !foreground) return false;
  // Resolve both layers before drawing, so a failed bake safely falls back once.
  const resolvedBody = resolveSprite(e, body);
  if (!resolvedBody?.slot) return false;
  const resolvedForeground = foreground ? resolveSprite(e, foreground) : null;
  if (foreground && !resolvedForeground?.slot) return false;
  blit(targetCtx, resolvedBody); renderer.drawLive?.(e);
  if (resolvedForeground) {
    targetCtx.save();
    try { renderer.transformForeground?.(targetCtx, e); blit(targetCtx, resolvedForeground); renderer.drawOverlays?.(e);
    } finally { targetCtx.restore(); }
  }
  return true;
}
/** Queue finite poses. Preparation never evicts sprites from the current horde. */
export function queueSpritePrewarm(templates, resolveRenderer, { includeAttacks = false, maxEntries = MAX_PREWARM_ENTRIES } = {}) {
  prewarmQueue.length = 0; prewarmKeys.clear();
  const limit = Math.max(0, Math.min(MAX_PREWARM_ENTRIES, maxEntries));
  for (const e of templates) {
    const renderer = resolveRenderer(e.baseType), states = includeAttacks ? ['CHASE', 'WINDUP', 'STRIKE'] : ['CHASE'];
    for (const state of states) {
      const entity = { ...e, combatState: state, hitFlash: 0 }, initial = getEnemySpriteDescriptor(entity, renderer, 0);
      if (!initial) continue;
      for (const layer of renderer.drawForeground ? ['body', 'foreground'] : ['body']) {
        const count = layer === 'foreground' ? 1 : initial.phaseCount;
        for (let phase = 0; phase < count; phase++) {
          const descriptor = getEnemySpriteDescriptor(entity, renderer, phase, layer);
          if (!descriptor || prewarmKeys.has(descriptor.key) || spriteSlots.has(descriptor.key)) continue;
          if (prewarmQueue.length >= limit) return prewarmQueue.length;
          prewarmKeys.add(descriptor.key); prewarmQueue.push({ entity, descriptor });
        }
      }
    }
  }
  return prewarmQueue.length;
}
/** At most maxBakes synchronous bakes; elapsed budget is checked between bakes. */
export function processEnemySpritePrewarm({ budgetMs = .75, maxBakes = 2 } = {}) {
  if (!prewarmQueue.length || !(budgetMs > 0) || !(maxBakes > 0) || !ensureAtlas()) return { baked: 0, pending: prewarmQueue.length };
  const start = performance.now(); let baked = 0;
  while (prewarmQueue.length && baked < maxBakes && performance.now() - start < budgetMs) {
    const { entity, descriptor } = prewarmQueue.shift(); prewarmKeys.delete(descriptor.key);
    if (spriteSlots.has(descriptor.key)) continue;
    if (spriteSlots.size >= MAX_SLOTS) { prewarmQueue.length = 0; prewarmKeys.clear(); break; }
    if (bakeSprite(entity, descriptor, false)) baked++;
  }
  return { baked, pending: prewarmQueue.length };
}
