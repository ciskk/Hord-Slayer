const path = require('node:path');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');
module.exports = {
  // Editors and running apps can keep app.asar open on Windows. Each build gets
  // its own directory; release files and manifests have stable locations.
  outDir: './out/builds/build-' + Date.now(),
  packagerConfig: {
    asar: true,
    icon: './assets/icon.ico',
    executableName: 'Hord Slayer',
    appBundleId: 'com.hordslayer.desktop',
    win32metadata: { CompanyName: 'Hord Slayer', FileDescription: 'Hord Slayer', ProductName: 'Hord Slayer' },
    ignore: [/^\/tests($|\/)/, /^\/scripts($|\/)/, /^\/test-results($|\/)/, /^\/out($|\/)/, /^\/\.git/, /^\/PLANO\.md$/, /^\/VALIDACAO\.md$/]
  },
  hooks: {
    async postPackage(_config, result) {
      const out = path.join(__dirname, 'out');
      await fs.mkdir(out, { recursive: true });
      await fs.writeFile(path.join(out, 'latest-package.json'), JSON.stringify({ paths: result.outputPaths }, null, 2));
    },
    async postMake(_config, results) {
      const folder = path.join(__dirname, 'out', 'releases');
      await fs.mkdir(folder, { recursive: true });
      const artifacts = [];
      for (const result of results) for (const source of result.artifacts) {
        const name = path.basename(source).endsWith('.zip') ? 'HordSlayer-PC-' + require('./package.json').version + '.zip' : path.basename(source);
        const destination = path.join(folder, name);
        await fs.copyFile(source, destination);
        const bytes = await fs.readFile(destination);
        artifacts.push({ file: name, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
      }
      await fs.writeFile(path.join(folder, 'manifest.json'), JSON.stringify({ version: require('./package.json').version, generatedAt: new Date().toISOString(), artifacts }, null, 2));
      console.log('Pacotes finais: ' + folder);
    }
  },
  makers: [
    { name: '@electron-forge/maker-squirrel', config: { name: 'HordSlayer', setupExe: 'HordSlayer-Setup.exe', setupIcon: './assets/icon.ico', noMsi: true } },
    { name: '@electron-forge/maker-zip', platforms: ['win32'] }
  ]
};
