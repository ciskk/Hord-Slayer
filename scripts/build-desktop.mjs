import fs from 'fs';
import path from 'path';
import packager from 'electron-packager';

const rootDir = process.cwd();
const stagingDir = path.join(rootDir, 'temp-desktop');
const distDir = path.join(rootDir, 'dist');

console.log('⚔️  [Hord Slayer] Preparando build desktop para PC Windows (.exe)...');

// 1. Limpa diretório temporário se existir
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// 2. Copia arquivos essenciais da base única
const itemsToCopy = ['index.html', 'style.css', 'css', 'src'];
for (const item of itemsToCopy) {
  const srcPath = path.join(rootDir, item);
  const destPath = path.join(stagingDir, item);

  if (fs.existsSync(srcPath)) {
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
    console.log(`  ✓ Copiado: ${item}`);
  }
}

// 3. Cria package.json do app desktop isolado
const appPkg = {
  name: "hord-slayer",
  version: "1.0.0",
  description: "Hord Slayer - Grim Cyber-Gothic Survival Game",
  main: "main.cjs"
};
fs.writeFileSync(path.join(stagingDir, 'package.json'), JSON.stringify(appPkg, null, 2), 'utf-8');

// 4. Cria main.cjs do Electron com flags de alto desempenho para jogos
const mainCjsContent = `const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Flags de Alto Desempenho e Aceleração Gráfica para Jogos Canvas
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('use-angle', 'd3d11');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    title: 'Hord Slayer',
    backgroundColor: '#0a0c10',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
      backgroundThrottling: false
    }
  });

  Menu.setApplicationMenu(null);

  win.loadFile(path.join(__dirname, 'index.html'));

  // Suporte a Tela Cheia via F11 ou Alt+Enter
  win.webContents.on('before-input-event', (event, input) => {
    if ((input.key === 'F11' || (input.alt && input.key === 'Enter')) && input.type === 'keyDown') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });

  win.once('ready-to-show', () => {
    win.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;
fs.writeFileSync(path.join(stagingDir, 'main.cjs'), mainCjsContent, 'utf-8');

// 5. Executa empacotador
console.log('📦 Empacotando executável (.exe)... Isso levará alguns instantes...');
try {
  const appPaths = await packager({
    dir: stagingDir,
    name: 'HordSlayer',
    platform: 'win32',
    arch: 'x64',
    out: distDir,
    overwrite: true,
    prune: true
  });

  console.log('🧹 Limpando arquivos intermediários...');
  fs.rmSync(stagingDir, { recursive: true, force: true });

  console.log('\\n======================================================');
  console.log('🎉 SUCESSO! Executável gerado com sucesso para PC:');
  for (const p of appPaths) {
    console.log(`📂 Pasta do Jogo: ${p}`);
    console.log(`🎮 Executável: ${path.join(p, 'HordSlayer.exe')}`);
  }
  console.log('======================================================\\n');
} catch (err) {
  console.error('❌ Erro durante o empacotamento:', err);
  if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
  process.exit(1);
}
