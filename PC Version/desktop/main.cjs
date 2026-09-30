const { app, BrowserWindow, Menu, protocol, session, ipcMain, dialog } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { resolveContent, CSP } = require('./local-content.cjs');
const { validateSave, MAX_BYTES } = require('./save-format.cjs');

// Keep the profile and origin stable across versions and installation locations.
app.setName('Hord Slayer');
if (process.env.HORD_TEST_PROFILE) app.setPath('userData', path.resolve(process.env.HORD_TEST_PROFILE));
else app.setPath('userData', path.join(app.getPath('appData'), 'Hord Slayer'));
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);

// Squirrel needs to terminate its install/update helper invocation promptly.
if (process.argv.some(arg => ['--squirrel-install', '--squirrel-updated', '--squirrel-uninstall', '--squirrel-obsolete'].includes(arg))) {
  const { spawn } = require('node:child_process');
  const event = process.argv.find(arg => arg.startsWith('--squirrel-'));
  if (['--squirrel-install', '--squirrel-updated', '--squirrel-uninstall'].includes(event)) {
    const updater = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
    const action = event === '--squirrel-uninstall' ? '--removeShortcut' : '--createShortcut';
    const child = spawn(updater, [action, path.basename(process.execPath)], { windowsHide: true });
    child.on('close', () => app.quit());
    child.on('error', () => app.quit());
    setTimeout(() => app.quit(), 3000);
  } else app.quit();
} else if (!app.requestSingleInstanceLock()) app.quit();
else {
  const webBaseline = !!process.env.HORD_TEST_PROFILE && !app.isPackaged && process.env.HORD_TEST_WEB_BASELINE === '1';
  const entryUrl = 'app://game/index.html' + (!app.isPackaged && process.argv.includes('--diagnostics') ? '?diagnostics=1' : '');
  let win;
  let busy = false;
  let lastWindowState = { width: 1280, height: 800 };
  const statePath = path.join(app.getPath('userData'), 'window.json');
  const command = name => { if (win && !win.isDestroyed()) win.webContents.send('desktop:command', name); };

  function assertSender(event) {
    if (!win || event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame || event.senderFrame.url !== entryUrl) throw new Error('Operação não autorizada');
  }
  const guarded = handler => async (event, payload) => {
    assertSender(event);
    if (busy) return { canceled: true };
    busy = true;
    try { return await handler(payload); }
    catch (error) { return { error: error.message }; }
    finally { busy = false; }
  };
  ipcMain.handle('desktop:notify', guarded(async message => {
    await dialog.showMessageBox(win, { type: 'info', title: 'Hord Slayer', message: String(message).slice(0, 500) });
    return {};
  }));
  ipcMain.handle('desktop:export-save', guarded(async payload => {
    const save = validateSave(payload);
    const result = await dialog.showSaveDialog(win, { title: 'Exportar progresso', defaultPath: 'HordSlayer-save.json', filters: [{ name: 'Save do Hord Slayer', extensions: ['json'] }] });
    if (result.canceled || !result.filePath) return { canceled: true };
    await fs.writeFile(result.filePath, JSON.stringify(save, null, 2), 'utf8');
    return { ok: true };
  }));
  ipcMain.handle('desktop:import-save', guarded(async payload => {
    const current = validateSave(payload);
    const selected = await dialog.showOpenDialog(win, { title: 'Importar progresso', filters: [{ name: 'Save do Hord Slayer', extensions: ['json'] }], properties: ['openFile'] });
    if (selected.canceled || !selected.filePaths.length) return { canceled: true };
    const inputPath = selected.filePaths[0];
    if ((await fs.stat(inputPath)).size > MAX_BYTES) throw new Error('Save excede 2 MB');
    const imported = validateSave(JSON.parse(await fs.readFile(inputPath, 'utf8')));
    const answer = await dialog.showMessageBox(win, { type: 'question', title: 'Importar progresso', message: 'Substituir o progresso e as preferências pelo arquivo selecionado?', detail: 'Um backup do progresso atual será salvo antes da importação.', buttons: ['Cancelar', 'Importar'], defaultId: 0, cancelId: 0 });
    if (answer.response !== 1) return { canceled: true };
    const folder = path.join(app.getPath('userData'), 'backups');
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder, `before-import-${Date.now()}.json`), JSON.stringify(current, null, 2), { encoding: 'utf8', flag: 'wx' });
    return { entries: imported.entries };
  }));

  function createWindow() {
    win = new BrowserWindow({
      width: lastWindowState.width, height: lastWindowState.height,
      minWidth: 960, minHeight: 640, title: 'Hord Slayer', backgroundColor: '#0a0c10',
      icon: path.join(app.getAppPath(), 'assets', 'icon.ico'), show: false,
      webPreferences: { preload: webBaseline ? undefined : path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, backgroundThrottling: !process.env.HORD_TEST_PROFILE, offscreen: !!process.env.HORD_TEST_PROFILE }
    });
    if (process.env.HORD_TEST_PROFILE) win.webContents.setFrameRate(60);
    win.once('ready-to-show', () => {
      // Tests run hidden so that automated checks never take keyboard focus.
      if (!process.env.HORD_TEST_PROFILE) win.show();
      if (lastWindowState.maximized) win.maximize();
    });
    win.on('blur', () => command('blur'));
    win.on('focus', () => command('focus'));
    win.on('close', () => {
      const bounds = win.getNormalBounds();
      fs.mkdir(path.dirname(statePath), { recursive: true }).then(() => fs.writeFile(statePath, JSON.stringify({ width: bounds.width, height: bounds.height, maximized: win.isMaximized() }))).catch(() => {});
    });
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    win.webContents.on('will-navigate', (event, url) => { if (url !== entryUrl) event.preventDefault(); });
    win.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && input.key === 'F11') {
        event.preventDefault();
        if (!input.isAutoRepeat) win.setFullScreen(!win.isFullScreen());
      }
    });
    const template = [
      { label: 'Jogo', submenu: [
        { label: 'Tela cheia (F11)', click: () => win.setFullScreen(!win.isFullScreen()) },
        { label: 'Pausar', click: () => command('pause') },
        { type: 'separator' },
        { label: 'Exportar progresso…', click: () => command('export') },
        { label: 'Importar progresso…', click: () => command('import') },
        { type: 'separator' }, { label: 'Sair', role: 'quit' }
      ] },
      { label: 'Ajuda', submenu: [{ label: 'Controles e saves', click: () => dialog.showMessageBox(win, {
        title: 'Hord Slayer — controles', message: 'WASD / setas: mover\nEspaço / E / botão direito: habilidade\nF segurado: interagir com altar\nEsc / P: pausa e menus\nF11: tela cheia',
        detail: 'O jogo pausa ao perder o foco. Retome manualmente.\nImporte saves no menu inicial; a partida atual não é salva.\nDados: ' + app.getPath('userData') + '\nVersão: ' + app.getVersion()
      }) }] }
    ];
    if (!app.isPackaged && process.argv.includes('--diagnostics')) template.push({ label: 'Desenvolvimento', submenu: [{ role: 'toggleDevTools' }, { role: 'reload' }] });
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    win.loadURL(entryUrl);
  }

  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
  app.whenReady().then(async () => {
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*', 'file://*/*'] }, (_details, callback) => callback({ cancel: true }));
    const root = path.join(app.getAppPath(), 'app');
    protocol.handle('app', async request => {
      try {
        const { target, type } = resolveContent(root, request.url);
        let body = await fs.readFile(target);
        if (webBaseline && target === path.join(root, 'index.html')) {
          body = Buffer.from(body.toString('utf8').replace('<script type="module" src="./desktop/renderer.mjs"></script>', '').replace('<link rel="stylesheet" href="./desktop/desktop.css">', ''));
        }
        return new Response(body, { headers: { 'Content-Type': type, 'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff' } });
      } catch { return new Response('Recurso indisponível', { status: 404 }); }
    });
    try {
      const state = JSON.parse(await fs.readFile(statePath, 'utf8'));
      if (Number.isInteger(state.width) && Number.isInteger(state.height)) lastWindowState = { width: Math.min(3840, Math.max(960, state.width)), height: Math.min(2160, Math.max(640, state.height)), maximized: !!state.maximized };
    } catch { /* First launch uses defaults. */ }
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  }).catch(error => { dialog.showErrorBox('Falha ao iniciar Hord Slayer', error.message); app.quit(); });
  app.on('window-all-closed', () => app.quit());
}
