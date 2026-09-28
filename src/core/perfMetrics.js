/** Opt-in callback/CPU telemetry. Does not measure GPU presentation. */
const CAPACITY = 10000;
const KEYS = ['update', 'render', 'physics', 'enemies', 'weapons', 'projectiles', 'fieldEffects', 'pickups', 'hazards', 'hud', 'terrain', 'mobsRender', 'effectsRender'];
const fields = ['interval', 'cpu', ...KEYS, 'collisions', 'spriteHits', 'spriteBakes', 'terrainChunks', 'reads', 'writes'];
const history = Object.fromEntries(fields.map(k => [k, new Float64Array(CAPACITY)]));
const values = Object.fromEntries(fields.map(k => [k, 0]));
const starts = {};
const previewIntervals = new Float64Array(CAPACITY), previewCpu = new Float64Array(CAPACITY);
let enabled = false, total = 0, previous = null, frameStart = 0;
let previewTotal = 0, previewPrevious = null, benchmark = null;
const reports = [];
let overlay = null, overlayVisible = false, lastOverlay = 0;
let contextProvider = () => ({});
const round = n => Number(n.toFixed(3));
const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
function summary(xs) {
  if (!xs.length) return { avg: 0, p50: 0, p95: 0, p99: 0 };
  const sorted = [...xs].sort((a, b) => a - b);
  const percentile = p => sorted[Math.ceil(p * sorted.length) - 1];
  return { avg: round(mean(xs)), p50: round(percentile(.5)), p95: round(percentile(.95)), p99: round(percentile(.99)) };
}
function recent(array, count, end = total) {
  const result = [];
  for (let i = end - count; i < end; i++) result.push(array[i % CAPACITY]);
  return result;
}
function count(key, amount = 1) { if (enabled) values[key] += amount; }

export const perfMetrics = {
  isEnabled: () => enabled,
  setContextProvider(provider) { contextProvider = provider; },
  setEnabled(value) {
    const next = !!value;
    if (enabled === next) return;
    if (benchmark) this.finishBenchmark('measurement-disabled');
    enabled = next; this.reset();
  },
  reset() {
    total = 0; previous = null; previewTotal = 0; previewPrevious = null;
    for (const key of fields) values[key] = 0;
    for (const key of KEYS) delete starts[key];
  },
  suspend() {
    if (benchmark) this.finishBenchmark('visibility-changed');
    this.reset();
  },
  beginFrame(now) {
    if (!enabled) return;
    const timestamp = now ?? performance.now();
    frameStart = performance.now();
    for (const key of fields) values[key] = 0;
    for (const key of KEYS) delete starts[key];
    values.interval = previous === null ? 0 : Math.max(0, timestamp - previous);
    previous = timestamp;
  },
  beginMeasure(key) { if (enabled && KEYS.includes(key)) starts[key] = performance.now(); },
  endMeasure(key) {
    if (!enabled || starts[key] === undefined) return;
    values[key] += Math.max(0, performance.now() - starts[key]); delete starts[key];
  },
  endFrame(now) {
    if (!enabled) return;
    values.cpu = Math.max(0, (now ?? performance.now()) - frameStart);
    // The first callback establishes an origin, without a cadence sample.
    if (values.interval > 0) {
      for (const key of fields) history[key][total % CAPACITY] = values[key];
      total++;
    }
    if (benchmark && performance.now() - benchmark.start >= benchmark.durationMs) this.finishBenchmark();
    if (overlayVisible && performance.now() - lastOverlay >= 500) {
      lastOverlay = performance.now(); this.updateOverlayDOM();
    }
  },
  recordPreview(now, cpuMs) {
    if (!enabled) return;
    if (previewPrevious !== null && now > previewPrevious) {
      previewIntervals[previewTotal % CAPACITY] = now - previewPrevious;
      previewCpu[previewTotal % CAPACITY] = cpuMs; previewTotal++;
    }
    previewPrevious = now;
  },
  resetPreview() { previewPrevious = null; },
  countCollisionCandidate: amount => count('collisions', amount),
  countSpriteHit: () => count('spriteHits'),
  countSpriteBake: () => count('spriteBakes'),
  countTerrainChunk: () => count('terrainChunks'),
  countPersistenceRead: () => count('reads'),
  countPersistenceWrite: () => count('writes'),
  getStats(windowFrames = 600) {
    const n = Math.max(0, Math.min(Math.floor(windowFrames), total, CAPACITY));
    if (!n) return null;
    const series = Object.fromEntries(fields.map(k => [k, recent(history[k], n)]));
    const elapsed = series.interval.reduce((a, b) => a + b, 0) / 1000;
    const sum = key => series[key].reduce((a, b) => a + b, 0);
    const perSecond = key => elapsed ? round(sum(key) / elapsed) : 0;
    const slowest = [...series.interval].sort((a, b) => b - a).slice(0, Math.max(1, Math.ceil(n * .01)));
    const pn = Math.min(previewTotal, CAPACITY, n);
    const pIntervals = recent(previewIntervals, pn, previewTotal);
    return {
      measurement: 'rAF callback cadence; CPU submission, not GPU/presentation time',
      samples: n, sampledSeconds: round(elapsed), fps: round(n / elapsed), fps1PctLow: round(1000 / mean(slowest)),
      frameTime: summary(series.interval), cpuTime: summary(series.cpu),
      updateTime: summary(series.update), renderTime: summary(series.render),
      intervalsOver25ms: series.interval.filter(x => x > 25).length,
      intervalsOver12_5ms: series.interval.filter(x => x > 12.5).length,
      subsystems: Object.fromEntries(KEYS.map(k => [k, round(mean(series[k]))])),
      counters: {
        collisionsPerFrame: round(sum('collisions') / n),
        spriteHitRatePct: sum('spriteHits') + sum('spriteBakes') ? round(100 * sum('spriteHits') / (sum('spriteHits') + sum('spriteBakes'))) : 100,
        spriteBakesTotal: sum('spriteBakes'), spriteBakesPerSec: perSecond('spriteBakes'),
        terrainChunksTotal: sum('terrainChunks'), persistenceReadsPerSec: perSecond('reads'), persistenceWritesPerSec: perSecond('writes')
      },
      preview: { samples: pn, fps: pn ? round(1000 / mean(pIntervals)) : null, cpuTime: summary(recent(previewCpu, pn, previewTotal)), frameTime: summary(pIntervals) },
      memory: { heapUsedMB: performance.memory ? round(performance.memory.usedJSHeapSize / 1048576) : null }
    };
  },
  startBenchmark(seconds = 10, scenario = 'MANUAL', onComplete = null) {
    if (benchmark) this.finishBenchmark('restarted');
    this.setEnabled(true); this.reset();
    const durationMs = Math.max(1000, Math.min(60000, Number(seconds) * 1000 || 10000));
    benchmark = { start: performance.now(), durationMs, scenario, onComplete, context: contextProvider() };
  },
  finishBenchmark(reason = 'completed') {
    if (!benchmark) return null;
    const b = benchmark; benchmark = null;
    const report = {
      schemaVersion: 2, scenario: b.scenario, timestamp: new Date().toISOString(), reason,
      requestedSeconds: b.durationMs / 1000, elapsedSeconds: round((performance.now() - b.start) / 1000),
      durationFrames: total, truncated: total > CAPACITY,
      environmentStart: b.context, environmentEnd: contextProvider(), stats: this.getStats(CAPACITY)
    };
    reports.push(report); if (reports.length > 30) reports.shift();
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('hordio-benchmark-complete', { detail: report }));
    if (b.onComplete) b.onComplete(report);
    return report;
  },
  getBenchmarkHistory: () => reports,
  isBenchmarking: () => benchmark !== null,
  logSummary(stats = this.getStats(), title = 'Status atual') { console.log(title, stats); },
  toggleOverlay() {
    overlayVisible = !overlayVisible;
    if (overlayVisible) { this.setEnabled(true); this.ensureOverlayDOM(); }
    if (overlay) overlay.hidden = !overlayVisible;
    return overlayVisible;
  },
  ensureOverlayDOM() {
    if (overlay || typeof document === 'undefined') return;
    overlay = document.createElement('pre'); overlay.id = 'perf-metrics-overlay';
    overlay.style.cssText = 'position:fixed;right:4px;top:4px;z-index:999999;background:#10151eee;color:white;font:11px monospace;padding:8px;pointer-events:none';
    document.body.append(overlay);
  },
  updateOverlayDOM() {
    const s = this.getStats(240); if (!overlay || !s) return;
    overlay.textContent = `rAF ${s.fps} callbacks/s (não apresentação)\np95 ${s.frameTime.p95} ms | p99 ${s.frameTime.p99} ms\nCPU ${s.cpuTime.avg} ms | update ${s.updateTime.avg} ms\nrender ${s.renderTime.avg} ms | preview ${s.preview.cpuTime.avg} ms`;
  }
};
if (typeof window !== 'undefined') {
  window.perfMetrics = perfMetrics;
  window.addEventListener('keydown', e => { if (e.code === 'F3') { e.preventDefault(); perfMetrics.toggleOverlay(); } });
  document.addEventListener('visibilitychange', () => perfMetrics.suspend());
}
