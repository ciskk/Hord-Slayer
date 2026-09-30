import { resetInput } from '../src/core/input.js';
import { gameState } from '../src/state/gameState.js';
import { togglePause } from '../src/systems/ui.js';
import { flushProgression } from '../src/systems/progression.js';

const KEYS = __SAVE_KEYS__;
const api = window.hordDesktop;
document.documentElement.classList.add('pc-version');
function fitDesktopMenu() {
  const scale = Math.min(1, innerWidth / 1280, innerHeight / 720);
  document.documentElement.style.setProperty('--pc-menu-scale', String(scale));
}
fitDesktopMenu();
window.addEventListener('resize', fitDesktopMenu);
let transferring = false;
let backgrounded = false;

function pauseForFocusLoss() {
  resetInput();
  flushProgression();
  if (gameState.isInMatch && !gameState.isPaused && !gameState.isDead && !gameState.isWon) togglePause();
}

function markBackgrounded() {
  backgrounded = true;
  pauseForFocusLoss();
}
// An upgrade or resume animation may finish after the window loses focus.
// Reapply pause once that transition releases its own pause lock.
setInterval(() => {
  if (backgrounded && gameState.isInMatch && !gameState.isPaused) pauseForFocusLoss();
}, 100);

function snapshot() {
  flushProgression();
  const entries = {};
  for (const key of KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) entries[key] = value;
  }
  return { game: 'hord-slayer', schemaVersion: 1, entries };
}

function replaceEntries(entries) {
  for (const key of KEYS) localStorage.removeItem(key);
  for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
}

async function handleCommand(command) {
  if (command === 'blur') return markBackgrounded();
  if (command === 'focus') { backgrounded = false; return; }
  if (command === 'pause') {
    if (gameState.isInMatch && !gameState.isPaused && !gameState.isDead && !gameState.isWon) togglePause();
    return;
  }
  if (transferring || !['export', 'import'].includes(command)) return;
  if (command === 'import' && gameState.isInMatch) {
    await api.notify('Volte ao menu inicial antes de importar o progresso.');
    return;
  }
  transferring = true;
  try {
    pauseForFocusLoss();
    const current = snapshot();
    const result = command === 'export' ? await api.exportSave(current) : await api.importSave(current);
    if (result.error) throw new Error(result.error);
    if (result.entries) {
      try { replaceEntries(result.entries); }
      catch (error) { replaceEntries(current.entries); throw error; }
      location.reload();
    } else if (result.ok) await api.notify('Progresso exportado.');
  } catch (error) { await api.notify('Não foi possível transferir o progresso: ' + error.message); }
  finally { transferring = false; }
}
api.onCommand(handleCommand);
window.addEventListener('blur', markBackgrounded);
window.addEventListener('focus', () => { backgrounded = false; });
document.addEventListener('visibilitychange', () => { if (document.hidden) markBackgrounded(); else backgrounded = false; });

// Keep focused form widgets from activating global game and menu shortcuts.
window.addEventListener('keydown', event => {
  if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) event.stopImmediatePropagation();
}, true);
