const assert = require('node:assert/strict');
const { launch, startMatch, newProfile, writeResult } = require('./harness.cjs');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  const result = { method: 'Same Electron/Chromium offscreen runtime, same machine/viewport, web game without desktop bridge versus desktop game; not browser/GPU presentation measurement', scenarios: [] };
  for (const baseline of [true, false]) {
    const { application, page, errors, external } = await launch(await newProfile(), null, { HORD_TEST_WEB_BASELINE: baseline ? '1' : '0' });
    try {
      assert.equal(await page.evaluate(() => !!window.hordDesktop), !baseline);
      await startMatch(page);
      await page.evaluate(async () => {
        (await import('/src/systems/devtools.js')).devCheats.godMode = true;
        (await import('/src/entities/player.js')).player.nextXp = Number.MAX_SAFE_INTEGER;
        (await import('/src/core/perfMetrics.js')).perfMetrics.setEnabled(true);
      });
      await delay(30000);
      const stats = await page.evaluate(async () => (await import('/src/core/perfMetrics.js')).perfMetrics.getStats(3600));
      const state = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio, paused: window.hordTest.state.gameState.isPaused }));
      assert.equal(state.paused, false);
      assert.equal(errors.length, 0, errors.join('\n')); assert.equal(external.length, 0);
      result.scenarios.push({ scenario: baseline ? 'web-source' : 'desktop', stats, state });
      console.log(JSON.stringify(result.scenarios.at(-1)));
    } finally { await application.close(); }
  }
  await writeResult('benchmark.json', result);
})().catch(error => { console.error(error); process.exitCode = 1; });
