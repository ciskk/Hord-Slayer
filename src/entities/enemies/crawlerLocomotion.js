// Ground creatures authored with their head pointing along local +X.
const CRAWLERS = new Set([
  'STALKER', 'SPLITTER', 'SPLITTER_MINI', 'TRAIL_CRAWLER',
  'CRYPT_WEAVER', 'BROOD_MATRIARCH'
]);

export function isCrawler(e) { return CRAWLERS.has(e.baseType); }

export function updateCrawlerLocomotion(e, previousX, previousY) {
  if (!isCrawler(e)) return;
  e.crawlPhase ??= 0;
  e.moveAngle ??= getCrawlerAngle(e);
  // Include collision separation performed before the AI update this frame.
  const dx = e.x - (e.crawlX ?? previousX);
  const dy = e.y - (e.crawlY ?? previousY);
  e.crawlX = e.x;
  e.crawlY = e.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.0001) return; // Keep the last heading and planted feet at rest.
  e.moveAngle = Math.atan2(dy, dx);
  e.crawlPhase = (e.crawlPhase + distance / Math.max(1, e.radius) * 2.4) % (Math.PI * 2);
}

export function getCrawlerAngle(e) {
  return e.moveAngle ?? e.leapAngle ?? e.dashAngle ?? e.aimAngle ??
    (e.facing === -1 ? Math.PI : 0);
}

export function orientCrawler(ctx, e) {
  if (!isCrawler(e)) return;
  // Undo the shared horizontal facing mirror, then rotate in world space.
  ctx.scale(e.facing || 1, 1);
  ctx.rotate(getCrawlerAngle(e));
}

export function crawlPhase(e, previewFrame = 0) {
  return e.crawlPhase ?? previewFrame * 0.2;
}

export function legStride(e, pair, side, previewFrame = 0) {
  if (e.deathPose !== undefined) return { sweep: 0, lift: 0 };
  const phase = crawlPhase(e, previewFrame) + pair * Math.PI + (side < 0 ? Math.PI : 0);
  return { sweep: Math.cos(phase) * 0.24, lift: Math.max(0, Math.sin(phase)) * 0.18 };
}
