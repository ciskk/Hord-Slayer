const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createIcon } = require('./create-icon.cjs');
const { KEYS } = require('../desktop/save-format.cjs');
const pc = path.resolve(__dirname, '..');
const source = path.resolve(pc, '..');
const output = path.resolve(pc, 'app');
// Only delete the explicitly generated directory inside this desktop workspace.
if (path.dirname(output) !== pc || path.basename(output) !== 'app' || fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) throw new Error('Diretório de saída inseguro');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const name of ['index.html', 'style.css', 'css', 'src']) fs.cpSync(path.join(source, name), path.join(output, name), { recursive: true });

const fontRoot = path.join(output, 'assets', 'fonts');
fs.mkdirSync(fontRoot, { recursive: true });
const families = [
  ['cinzel', 'Cinzel', [600, 700, 800]],
  ['cinzel-decorative', 'Cinzel Decorative', [700, 900]],
  ['outfit', 'Outfit', [400, 500, 600, 700, 800]]
];
let fontCss = '';
for (const [id, family, weights] of families) {
  const folder = path.join(pc, 'node_modules', '@fontsource', id);
  const license = ['LICENSE', 'LICENSE.txt', 'OFL.txt'].find(file => fs.existsSync(path.join(folder, file)));
  if (!license) throw new Error('Licença da fonte ausente: ' + id);
  fs.copyFileSync(path.join(folder, license), path.join(fontRoot, `${id}-LICENSE.txt`));
  for (const weight of weights) {
    const file = `${id}-latin-${weight}-normal.woff2`;
    fs.copyFileSync(path.join(folder, 'files', file), path.join(fontRoot, file));
    fontCss += `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url('./${file}') format('woff2');}\n`;
  }
}
fs.writeFileSync(path.join(fontRoot, 'fonts.css'), fontCss);
fs.mkdirSync(path.join(output, 'desktop'), { recursive: true });
const renderer = fs.readFileSync(path.join(pc, 'desktop', 'renderer.mjs'), 'utf8').replace('__SAVE_KEYS__', JSON.stringify(KEYS));
fs.writeFileSync(path.join(output, 'desktop', 'renderer.mjs'), renderer);
fs.copyFileSync(path.join(pc, 'desktop', 'desktop.css'), path.join(output, 'desktop', 'desktop.css'));
let html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
html = html.replace(/^.*<link[^>]+href="https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]+>\r?\n/gm, '');
html = html.replace('</head>', '<link rel="stylesheet" href="./assets/fonts/fonts.css">\n<link rel="stylesheet" href="./desktop/desktop.css">\n</head>');
html = html.replace('<script type="module" src="./src/main.js"></script>', '<script type="module" src="./desktop/renderer.mjs"></script>\n<script type="module" src="./src/main.js"></script>');
if (/https:\/\/fonts\./.test(html)) throw new Error('Referência de fonte remota restante');
fs.writeFileSync(path.join(output, 'index.html'), html);
// Public desktop packages keep diagnostic shortcuts gated off. Web source stays unchanged.
const inputPath = path.join(output, 'src', 'core', 'input.js');
fs.writeFileSync(inputPath, fs.readFileSync(inputPath, 'utf8').replace('if (isWPressed && is5Pressed)', 'if ((!window.hordDesktop || location.search.includes("diagnostics=1")) && isWPressed && is5Pressed)'));
const perfPath = path.join(output, 'src', 'core', 'perfMetrics.js');
fs.writeFileSync(perfPath, fs.readFileSync(perfPath, 'utf8').replace("if (e.code === 'F3')", "if (e.code === 'F3' && (!window.hordDesktop || location.search.includes('diagnostics=1')))"));
const joystickPath = path.join(output, 'src', 'render', 'joystickRenderer.js');
fs.writeFileSync(joystickPath, fs.readFileSync(joystickPath, 'utf8').replace('export function drawJoystick(ctx, stick, frameCount) {', 'export function drawJoystick(ctx, stick, frameCount) {\n  if (window.hordDesktop) return;'));
const characterPath = path.join(output, 'src', 'ui', 'modals', 'characterSelectModal.js');
fs.writeFileSync(characterPath, fs.readFileSync(characterPath, 'utf8').replace('export function isMobileScreen() {', 'export function isMobileScreen() {\n  if (window.hordDesktop) return false;'));
const hash = crypto.createHash('sha256');
function hashFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) hashFiles(file);
    else { hash.update(path.relative(output, file)); hash.update(fs.readFileSync(file)); }
  }
}
hashFiles(output);
fs.writeFileSync(path.join(output, 'build-info.json'), JSON.stringify({ schemaVersion: 1, version: require('../package.json').version, contentHash: hash.digest('hex') }, null, 2));
createIcon(path.join(pc, 'assets', 'icon.ico'));
console.log('Conteúdo offline preparado em ' + output);
