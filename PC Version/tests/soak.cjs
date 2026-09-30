const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { launch, startMatch, newProfile, writeResult, root } = require('./harness.cjs');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  const profile = await newProfile();
  const minutes = Number(process.env.HORD_SOAK_MINUTES || 30);
  const result = { startedAt: new Date().toISOString(), minutes, scenario: 'Hidden desktop, invulnerable hero, automatic upgrades, actual wall-clock duration', samples: [] };
  let app;
  try {
    const launched = await launch(profile); app = launched.application;
    const { page, errors, external } = launched;
    await fs.mkdir(path.join(root, 'test-results'), { recursive: true });
    await startMatch(page);
    await page.evaluate(async () => {
      const { devCheats } = await import('/src/systems/devtools.js');
      devCheats.godMode = true;
      const { perfMetrics } = await import('/src/core/perfMetrics.js');
      perfMetrics.setEnabled(true);
      window.soakDriver = setInterval(async () => {
        const { gameState } = await import('/src/state/gameState.js');
        if (gameState.isWon || gameState.isDead) {
          (await import('/src/main.js')).terminateMatch();
          (await import('/src/systems/ui.js')).openCharacterSelect();
          document.getElementById('confirm-hero-btn')?.click();
          return;
        }
        if (gameState.isPaused) {
          const upgrade = document.querySelector('#upgrade-modal .upgrade-card-pro');
          if (upgrade && getComputedStyle(document.getElementById('upgrade-modal')).display !== 'none') upgrade.click();
          const chest = document.getElementById('chest-claim-btn');
          if (chest && !chest.disabled && getComputedStyle(document.getElementById('chest-modal')).display !== 'none') chest.click();
        } else {
          const index = Math.floor(performance.now() / 5000) % 4;
          const directions = ['KeyD', 'KeyS', 'KeyA', 'KeyW'];
          for (const code of directions) window.dispatchEvent(new KeyboardEvent('keyup', { code }));
          window.dispatchEvent(new KeyboardEvent('keydown', { code: directions[index] }));
        }
      }, 500);
    });
    await page.screenshot({ path: path.join(root, 'test-results', 'soak-start.png') });
    const started = Date.now();
    while (Date.now() - started < minutes * 60000) {
      await delay(Math.min(60000, Math.max(1000, minutes * 60000 - (Date.now() - started))));
      const stats = await page.evaluate(async () => {
        const { perfMetrics } = await import('/src/core/perfMetrics.js');
        const { gameState } = await import('/src/state/gameState.js');
        const { enemies } = await import('/src/state/collections.js');
        return { stats: perfMetrics.getStats(3600), inMatch: gameState.isInMatch, paused: gameState.isPaused, enemies: enemies.length };
      });
      const processes = await app.evaluate(({ app }) => app.getAppMetrics().map(p => ({ type: p.type, memory: p.memory, cpu: p.cpu })));
      result.samples.push({ elapsedSeconds: (Date.now() - started) / 1000, ...stats, processes });
      await writeResult('soak.json', { ...result, errors, external });
      console.log(JSON.stringify({ elapsedMinutes: Math.round((Date.now() - started) / 6000) / 10, fps: stats.stats?.fps, inMatch: stats.inMatch, paused: stats.paused, enemies: stats.enemies, errors: errors.length }));
      assert.equal(errors.length, 0, errors.join('\n'));
      assert.equal(external.length, 0, 'Unexpected network requests');
      assert.ok(stats.inMatch);
    }
    await page.screenshot({ path: path.join(root, 'test-results', 'soak-end.png') });
    result.passed = true; result.elapsedSeconds = (Date.now() - started) / 1000;
    await writeResult('soak.json', { ...result, errors, external });
  } finally { if (app) await app.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
