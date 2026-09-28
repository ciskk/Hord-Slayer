import fs from 'fs';
import path from 'path';
import crypto from 'node:crypto';

const rootDir = process.cwd();
const targetDir = path.join(rootDir, 'www');

console.log('🔄 Preparando pasta www para build mobile...');

// Remove targetDir if exists
if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDir, { recursive: true });

// Items to copy
const itemsToCopy = ['index.html', 'style.css', 'css', 'src'];

for (const item of itemsToCopy) {
  const srcPath = path.join(rootDir, item);
  const destPath = path.join(targetDir, item);

  if (fs.existsSync(srcPath)) {
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
    console.log(`  ✓ Copiado: ${item}`);
  } else {
    console.warn(`  ⚠️ Aviso: ${item} não encontrado.`);
  }
}

console.log('✅ Pasta www sincronizada com sucesso para o Capacitor!');

// One content fingerprint shared by Chrome's test server and the APK assets.
const fileHashes = {};
function fingerprint(directory, prefix = '') {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix + entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) fingerprint(absolute, relative + '/');
    else fileHashes[relative] = crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
  }
}
fingerprint(targetDir);
const contentHash = crypto.createHash('sha256').update(JSON.stringify(fileHashes)).digest('hex');
fs.writeFileSync(path.join(targetDir, 'build-info.json'), JSON.stringify({ schemaVersion: 1, contentHash, files: fileHashes }, null, 2));
console.log(`Build web: ${contentHash}`);
