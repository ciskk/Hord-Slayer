const { _electron } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
async function launch(profile, executable, extraEnv = {}) {
  const env = { ...process.env, HORD_TEST_PROFILE: profile, ...extraEnv };
  delete env.ELECTRON_RUN_AS_NODE;
  const application = await _electron.launch({
    executablePath: executable || require('electron'),
    args: executable ? [] : [root],
    cwd: root,
    env,
    timeout: 60000
  });
  const page = await application.firstWindow();
  const errors = [], external = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (/^https?:/.test(request.url())) external.push(request.url()); });
  await page.waitForURL('app://game/index.html');
  await page.locator('#confirm-hero-btn').waitFor({ state: 'visible', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  return { application, page, errors, external };
}
async function startMatch(page) {
  await page.evaluate(async () => {
    window.hordTest = {
      state: await import('/src/state/gameState.js'),
      player: await import('/src/entities/player.js'),
      input: await import('/src/core/input.js')
    };
  });
  await page.locator('#confirm-hero-btn').click();
  await page.waitForFunction(() => window.hordTest.state.gameState.isInMatch);
  await page.keyboard.press('Space');
  await page.waitForFunction(() => !window.hordTest.state.matchIntro.active && !window.hordTest.state.cinematicCamera.isCinematic, null, { timeout: 20000 });
}
async function newProfile() { return fs.mkdtemp(path.join(os.tmpdir(), 'hord-desktop-test-')); }
async function writeResult(name, result) {
  const folder = path.join(root, 'test-results');
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(path.join(folder, name), JSON.stringify(result, null, 2));
}
module.exports = { launch, startMatch, newProfile, writeResult, root };
