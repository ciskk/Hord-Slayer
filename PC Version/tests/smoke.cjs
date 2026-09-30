const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { launch, startMatch, newProfile, writeResult, root } = require('./harness.cjs');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  const profile = await newProfile();
  const executable = process.env.HORD_TEST_EXECUTABLE;
  const checks = [];
  let app;
  try {
    let launched = await launch(profile, executable); app = launched.application;
    let { page, errors, external } = launched;
    await fs.mkdir(path.join(root, 'test-results'), { recursive: true });
    const check = name => { checks.push(name); console.log('PASS ' + name); };
    assert.equal(await page.title(), 'Hord Slayer');
    const prefs = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences());
    assert.equal(prefs.nodeIntegration, false); assert.equal(prefs.contextIsolation, true); assert.equal(prefs.sandbox, true);
    assert.equal(await page.evaluate(() => typeof window.require), 'undefined');
    check('Executable loads with isolated and sandboxed renderer');
    await page.context().setOffline(true);
    await page.reload();
    await page.locator('#confirm-hero-btn').waitFor();
    assert.ok(await page.evaluate(async () => {
      await document.fonts.load('700 16px "Cinzel Decorative"');
      await document.fonts.load('600 16px Cinzel');
      await document.fonts.load('400 16px Outfit');
      return ['700 16px "Cinzel Decorative"', '600 16px Cinzel', '400 16px Outfit'].every(font => document.fonts.check(font));
    }));
    check('Offline reload and all font families');
    const priorErrors = errors.length;
    assert.equal(await page.evaluate(async () => (await fetch('app://game/%2e%2e%2fpackage.json')).status), 404);
    await delay(100);
    const deniedErrors = errors.splice(priorErrors);
    assert.ok(deniedErrors.every(message => message.includes('404 (Not Found)')), deniedErrors.join('\n'));
    await page.evaluate(() => window.open('https://example.com'));
    assert.equal((await app.windows()).length, 1);
    check('Traversal and external windows blocked');

    // Exercise native save services with mocked dialogs, real files, validation and backup.
    const exportFile = path.join(profile, 'export.json');
    const importFile = path.join(profile, 'import.json');
    await app.evaluate(({ dialog }, paths) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: paths.exportFile });
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [paths.importFile] });
      dialog.showMessageBox = async (_win, options) => ({ response: options.buttons?.includes('Importar') ? 1 : 0 });
    }, { exportFile, importFile });
    await page.evaluate(async () => {
      const progression = await import('/src/systems/progression.js');
      progression.addPersistentGold(321); progression.flushProgression();
      (await import('/src/i18n/index.js')).setLanguage('fr');
      (await import('/src/core/responsive.js')).setGraphicsQuality('performance');
    });
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.send('desktop:command', 'export'));
    await page.waitForFunction(() => localStorage.getItem('hord_persistent_gold_v1') === '321');
    for (let i = 0; i < 30; i++) { try { await fs.access(exportFile); break; } catch { await delay(100); } }
    const exported = JSON.parse(await fs.readFile(exportFile, 'utf8'));
    assert.equal(exported.entries.hord_persistent_gold_v1, '321');
    await fs.writeFile(importFile, JSON.stringify({ ...exported, entries: { ...exported.entries, hord_persistent_gold_v1: '654', hord_language_v1: 'pt-BR' } }));
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.send('desktop:command', 'import'));
    await page.waitForFunction(() => localStorage.getItem('hord_persistent_gold_v1') === '654');
    await page.locator('#confirm-hero-btn').waitFor();
    const backups = await fs.readdir(path.join(profile, 'backups'));
    const backup = JSON.parse(await fs.readFile(path.join(profile, 'backups', backups[0]), 'utf8'));
    assert.equal(backup.entries.hord_persistent_gold_v1, '321');
    check('Export/import replaces progress and keeps pre-import backup');
    const invalid = await page.evaluate(() => window.hordDesktop.importSave({ game: 'wrong', entries: {} }));
    assert.ok(invalid.error);
    assert.equal(await page.evaluate(() => localStorage.getItem('hord_persistent_gold_v1')), '654');
    check('Invalid save rejected without changing data');

    await delay(600);
    await page.screenshot({ path: path.join(root, 'test-results', executable ? 'packaged-menu.png' : 'desktop-menu.png') });
    await startMatch(page);
    await page.keyboard.press('Space');
    await page.waitForFunction(() => !window.hordTest.state.cinematicCamera.isCinematic, null, { timeout: 20000 });
    await page.keyboard.down('d');
    await page.waitForFunction(() => window.hordTest.input.inputX > 0);
    const xBefore = await page.evaluate(async () => (await import('/src/entities/player.js')).player.x);
    await page.waitForFunction(x => window.hordTest.player.player.x > x, xBefore, { timeout: 10000 });
    await page.keyboard.up('d');
    const xAfter = await page.evaluate(async () => (await import('/src/entities/player.js')).player.x);
    assert.ok(xAfter > xBefore, JSON.stringify({ xBefore, xAfter, state: await page.evaluate(async () => ({ ...((await import('/src/state/gameState.js')).gameState), inputX: (await import('/src/core/input.js')).inputX })) }));
    await page.keyboard.press('e');
    assert.ok(await page.evaluate(async () => (await import('/src/entities/player.js')).player.skillCd > 0));
    check('Character selection, keyboard movement and skill');
    assert.equal(await page.evaluate(async () => (await import('/src/core/audio.js')).audioCtx.state), 'running');
    check('Procedural audio context running');
    await page.keyboard.down('w');
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.send('desktop:command', 'blur'));
    await page.waitForFunction(() => window.hordTest.state.gameState.isPaused);
    assert.equal(await page.evaluate(async () => (await import('/src/core/input.js')).inputY), 0);
    await page.keyboard.up('w');
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    assert.equal(await page.evaluate(async () => (await import('/src/state/gameState.js')).gameState.isPaused), true);
    check('Focus loss pauses and clears held keys, focus return stays paused');
    await page.locator('#resume-btn').click();
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.send('desktop:command', 'blur'));
    await delay(650);
    assert.equal(await page.evaluate(() => window.hordTest.state.gameState.isPaused), true);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.send('desktop:command', 'focus'));
    await page.locator('#resume-btn').click();
    await page.waitForFunction(() => !window.hordTest.state.gameState.isPaused);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.hordTest.state.gameState.isPaused);
    check('Resume and Esc pause');
    const focusTest = await page.evaluate(async () => {
      const input = document.createElement('input'); document.body.append(input); input.focus();
      input.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD', key: 'd', bubbles: true }));
      const { gameState } = await import('/src/state/gameState.js');
      const { inputX } = await import('/src/core/input.js');
      input.remove();
      return { paused: gameState.isPaused, inputX };
    });
    assert.equal(focusTest.paused, true); assert.equal(focusTest.inputX, 0);
    check('Focused fields do not trigger gameplay shortcuts');
    // Offscreen windows have no OS fullscreen surface; verify requests to the native API.
    await app.evaluate(({ BrowserWindow }) => {
      const w = BrowserWindow.getAllWindows()[0];
      w.testFullscreen = false;
      w.setFullScreen = value => { w.testFullscreen = value; };
      w.isFullScreen = () => w.testFullscreen;
    });
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.emit('before-input-event', { preventDefault() {} }, { type: 'keyDown', key: 'F11', isAutoRepeat: false }));
    await delay(500);
    assert.equal(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen()), true);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.emit('before-input-event', { preventDefault() {} }, { type: 'keyDown', key: 'F11', isAutoRepeat: false })); await delay(500);
    assert.equal(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen()), false);
    check('F11 toggles native fullscreen requests (offscreen test)');
    await page.locator('#abandon-btn').click();
    await page.locator('#confirm-hero-btn').waitFor({ state: 'visible' });
    check('Abandon returns to character selection');
    for (const factor of [1, 1.25, 1.5]) {
      await page.setViewportSize({ width: Math.floor(960 / factor), height: Math.floor(640 / factor) });
      await delay(500);
      const viewport = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
      for (const selector of ['#confirm-hero-btn', '#char-language-btn', '#open-bestiary-btn', '#open-achievements-btn', '#open-talents-btn']) {
        const bounds = await page.locator(selector).boundingBox();
        assert.ok(bounds && bounds.x >= -1 && bounds.y >= -1 && bounds.x + bounds.width <= viewport.w + 1 && bounds.y + bounds.height <= viewport.h + 1, selector + ' clipped at ' + factor);
      }
      await page.screenshot({ path: path.join(root, 'test-results', `layout-${Math.round(factor * 100)}.png`) });
    }
    check('Start/language/bestiary/achievements/talents visible at 100%, 125%, 150% zoom in minimum window');
    assert.equal(errors.length, 0, errors.join('\n')); assert.equal(external.length, 0, external.join('\n'));
    await app.close(); app = null;
    launched = await launch(profile, executable); app = launched.application; page = launched.page;
    assert.equal(await page.evaluate(() => localStorage.getItem('hord_persistent_gold_v1')), '654');
    assert.equal(await page.evaluate(() => localStorage.getItem('hord_graphics_quality')), 'performance');
    assert.equal(await page.evaluate(() => localStorage.getItem('hord_language_v1')), 'pt-BR');
    check('Progress and preferences survive application restart');
    await writeResult(executable ? 'smoke-packaged.json' : 'smoke.json', { passed: true, checks, errors, external, profile, executable: executable || 'development', timestamp: new Date().toISOString() });
  } finally { if (app) await app.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
