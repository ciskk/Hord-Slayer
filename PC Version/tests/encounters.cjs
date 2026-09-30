const assert = require('node:assert/strict');
const path = require('node:path');
const { launch, startMatch, newProfile, writeResult, root } = require('./harness.cjs');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  const { application, page, errors, external } = await launch(await newProfile());
  const checks = [];
  try {
    await startMatch(page);
    await page.evaluate(async () => {
      (await import('/src/systems/devtools.js')).devCheats.godMode = true;
      (await import('/src/entities/player.js')).player.nextXp = Number.MAX_SAFE_INTEGER;
    });
    for (const bossId of [1, 2, 3, 4]) {
      await page.evaluate(async id => {
        (await import('/src/main.js')).purgeAllNormalEnemies();
        const collections = await import('/src/state/collections.js');
        collections.enemies.length = 0;
        (await import('/src/ui/modals/bossSelectModal.js')).launchBossTest(id);
      }, bossId);
      await delay(Number(process.env.HORD_BOSS_CHECK_MS || 10000));
      const boss = await page.evaluate(async () => { const { activeBoss } = await import('/src/state/collections.js'); return { id: activeBoss?.bossId, state: activeBoss?.actionState, hp: activeBoss?.hp }; });
      assert.equal(boss.id, bossId);
      assert.equal(errors.length, 0, errors.join('\n'));
      await page.screenshot({ path: path.join(root, 'test-results', `boss-${bossId}.png`) });
      checks.push({ bossId, boss }); console.log('PASS boss ' + bossId + ' renders and updates');
    }
    // Validate the existing terminal result flows without waiting for boss health.
    await page.evaluate(async () => { (await import('/src/ui/modals/gameOverModal.js')).triggerVictory(); });
    await page.locator('#victory-modal.active').waitFor({ state: 'visible' });
    await delay(1000);
    assert.equal(await page.evaluate(() => window.hordTest.state.gameState.isWon), true);
    await page.screenshot({ path: path.join(root, 'test-results', 'victory.png') });
    await page.locator('#menu-victory-btn').click();
    await page.locator('#confirm-hero-btn').waitFor({ state: 'visible' });
    checks.push('Victory and return to menu'); console.log('PASS victory and return to menu');
    await startMatch(page);
    await page.evaluate(async () => { (await import('/src/ui/modals/gameOverModal.js')).triggerDeath(); });
    await page.locator('#death-modal').waitFor({ state: 'visible', timeout: 30000 });
    await page.screenshot({ path: path.join(root, 'test-results', 'death.png') });
    await page.locator('#restart-death-btn').click();
    await page.locator('#confirm-hero-btn').waitFor({ state: 'visible' });
    checks.push('Death and return to menu'); console.log('PASS death and return to menu');
    assert.equal(errors.length, 0, errors.join('\n')); assert.equal(external.length, 0);
    await writeResult('encounters.json', { passed: true, checks, errors, external });
  } finally { await application.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
