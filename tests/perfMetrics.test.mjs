import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { perfMetrics as perf } from '../src/core/perfMetrics.js';
let time = 0;
beforeEach(() => {
  time = 0;
  mock.method(performance, 'now', () => time);
  perf.finishBenchmark('test-reset'); perf.setEnabled(false); perf.reset();
  perf.setContextProvider(() => ({ test: true }));
});
afterEach(() => { perf.finishBenchmark('test-end'); perf.setEnabled(false); mock.restoreAll(); });
function frame(at, update = 1, render = 1) {
  time = at; perf.beginFrame(at);
  perf.beginMeasure('update'); time += update; perf.endMeasure('update');
  perf.beginMeasure('render'); time += render; perf.endMeasure('render');
  perf.countSpriteBake(); perf.endFrame(time);
}
test('diagnostics are opt-in', () => { frame(0); frame(100); assert.equal(perf.getStats(), null); });
test('10 callbacks per second are reported as 10, not 120', () => {
  perf.setEnabled(true); for (let i = 0; i <= 20; i++) frame(i * 100);
  const s = perf.getStats(); assert.equal(s.fps, 10); assert.equal(s.frameTime.avg, 100);
  assert.equal(s.cpuTime.avg, 2); assert.equal(s.updateTime.avg, 1); assert.equal(s.renderTime.avg, 1);
  assert.equal(s.counters.spriteBakesPerSec, 10); assert.equal(s.sampledSeconds, 2);
});
test('120 and 144 Hz are not capped; zero timestamp is valid', () => {
  perf.setEnabled(true); for (let i = 0; i <= 144; i++) frame(i * 1000 / 144);
  assert.equal(perf.getStats().fps, 144); assert.equal(perf.getStats().samples, 144);
});
test('missing update/render measurements do not reuse the previous frame', () => {
  perf.setEnabled(true); frame(0); frame(100, 3, 4);
  time = 200; perf.beginFrame(time); perf.endFrame(time + 1);
  assert.equal(perf.getStats(1).updateTime.avg, 0); assert.equal(perf.getStats(1).renderTime.avg, 0);
});
test('benchmark ends after wall-clock time at low cadence', () => {
  let report; perf.startBenchmark(1, 'slow', r => report = r);
  for (let i = 0; i <= 10; i++) frame(i * 100);
  assert.ok(report); assert.equal(report.durationFrames, 10); assert.equal(report.stats.fps, 10);
  assert.equal(report.reason, 'completed'); assert.equal(report.elapsedSeconds, 1.002);
});
test('visibility interruption marks partial report and excludes background gap', () => {
  let report; perf.startBenchmark(10, 'pause', r => report = r); frame(0); frame(100);
  perf.suspend(); assert.equal(report.reason, 'visibility-changed');
  frame(100000); frame(100100); assert.equal(perf.getStats().fps, 10);
});
test('preview CPU and cadence are measured separately and restart without pause gap', () => {
  perf.setEnabled(true); frame(0); frame(100); perf.recordPreview(0, 4); perf.recordPreview(100, 4);
  assert.equal(perf.getStats().preview.cpuTime.avg, 4); assert.equal(perf.getStats().preview.fps, 10);
  perf.resetPreview(); perf.recordPreview(10000, 4); perf.recordPreview(10100, 4);
  assert.equal(perf.getStats().preview.fps, 10);
});
test('rolling history retains the latest samples after wrapping', () => {
  perf.setEnabled(true); for (let i = 0; i <= 10010; i++) frame(i * 10, i < 10000 ? 1 : 2, 1);
  assert.equal(perf.getStats(5).updateTime.avg, 2); assert.equal(perf.getStats(5).fps, 100);
});
