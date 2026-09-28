import { initAudio, triggerHaptic } from './audio.js';
import { triggerHeroSkill, player } from '../entities/player.js';
import { 
  togglePause, 
  isBossSelectAllowed, 
  openBossSelectModal, 
  closeBossSelectModal 
} from '../systems/ui.js';
import { gameState, matchIntro } from '../state/gameState.js';
import { getActiveBloodAltar, setPlayerChannelingAltar } from '../systems/worldEvents.js';

// Rastreamento de teclas simultâneas ativas
const activeKeyCodes = new Set();

// Trava contra gestos do Safari iOS (Pinch-to-zoom / Double-tap zoom / Pull-to-refresh)[cite: 1]
if (typeof document !== 'undefined') {
  document.addEventListener('gesturestart', function(e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('dblclick', function(e) { e.preventDefault(); }, { passive: false });
}

// Modos de Joystick Virtual Suportados
export const JOYSTICK_MODES = {
  FLOATING: 'floating',
  DYNAMIC: 'dynamic'
};

const STORAGE_KEY_JOYSTICK = 'hordio_joystick_mode';

let joystickMode = JOYSTICK_MODES.FLOATING;

try {
  const savedMode = localStorage.getItem(STORAGE_KEY_JOYSTICK);
  if (savedMode === JOYSTICK_MODES.DYNAMIC || savedMode === JOYSTICK_MODES.FLOATING) {
    joystickMode = savedMode;
  }
} catch (e) {
  // Fallback silencioso caso localStorage esteja restrito
}

export function getJoystickMode() {
  return joystickMode;
}

export function setJoystickMode(mode) {
  if (mode !== JOYSTICK_MODES.FLOATING && mode !== JOYSTICK_MODES.DYNAMIC) return;
  joystickMode = mode;
  try {
    localStorage.setItem(STORAGE_KEY_JOYSTICK, mode);
  } catch (e) {}

  if (stick.active) {
    stick.mode = mode;
    if (joystickMode === JOYSTICK_MODES.DYNAMIC) {
      const dx = stick.curX - stick.startX;
      const dy = stick.curY - stick.startY;
      const dist = Math.hypot(dx, dy);
      if (dist > stick.radius) {
        stick.curX = stick.startX + (dx / dist) * stick.radius;
        stick.curY = stick.startY + (dy / dist) * stick.radius;
      }
    }
  }
}

// Joystick Virtual Mobile com Follow-Stick Dinâmico ou Base Dinâmica Fixa
export const stick = {
  active: false,
  touchId: null,
  startX: 0,
  startY: 0,
  curX: 0,
  curY: 0,
  radius: 48,
  normMag: 0,
  isSaturated: false,
  mode: joystickMode
};

export const cursorState = {
  active: false,
  x: 0,
  y: 0,
  lastMovedTime: 0
};

if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', e => {
    cursorState.active = true;
    cursorState.x = e.clientX;
    cursorState.y = e.clientY;
    cursorState.lastMovedTime = performance.now();
  }, { passive: true });

  window.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' || !e.pointerType) {
      cursorState.active = true;
      cursorState.x = e.clientX;
      cursorState.y = e.clientY;
      cursorState.lastMovedTime = performance.now();
    }
  }, { passive: true });
}

export let inputX = 0;
export let inputY = 0;

// Estado das teclas pressionadas (WASD / Setas)
const keys = {
  up: false,
  down: false,
  left: false,
  right: false
};

// Pilhas de prioridade de entrada para SOCD (Last-Input-Priority)
const horizKeyStack = [];
const vertKeyStack = [];

function pushKeyStack(stack, key) {
  const idx = stack.indexOf(key);
  if (idx !== -1) stack.splice(idx, 1);
  stack.push(key);
}

function removeKeyStack(stack, key) {
  const idx = stack.indexOf(key);
  if (idx !== -1) stack.splice(idx, 1);
}

function updateKeyboardVector() {
  if (stick.active) return; // Se o joystick touch estiver ativo, ignora teclado

  let kx = 0;
  let ky = 0;

  // Resolução SOCD com prioridade da última tecla pressionada (Last-Win)
  const activeHoriz = horizKeyStack.length > 0 ? horizKeyStack[horizKeyStack.length - 1] : null;
  const activeVert = vertKeyStack.length > 0 ? vertKeyStack[vertKeyStack.length - 1] : null;

  if (activeHoriz === 'left') kx = -1;
  else if (activeHoriz === 'right') kx = 1;

  if (activeVert === 'up') ky = -1;
  else if (activeVert === 'down') ky = 1;

  // Normalização vetorial precisa (Pitágoras contínuo)
  if (kx !== 0 && ky !== 0) {
    const len = Math.hypot(kx, ky);
    kx /= len;
    ky /= len;
  }

  inputX = kx;
  inputY = ky;
}

export function resetInput() {
  inputX = 0;
  inputY = 0;
  stick.active = false;
  stick.touchId = null;
  stick.normMag = 0;
  stick.isSaturated = false;
  keys.up = false;
  keys.down = false;
  keys.left = false;
  keys.right = false;
  horizKeyStack.length = 0;
  vertKeyStack.length = 0;
  activeKeyCodes.clear();
  setPlayerChannelingAltar(false);
  cursorState.active = false;
  cursorState.lastMovedTime = 0;
}

/**
 * Reset parcial: limpa apenas o joystick touch sem apagar o estado do teclado.
 * Usado ao abrir o modal de upgrade para preservar teclas WASD seguradas.
 */
export function resetInputSoft() {
  stick.active = false;
  stick.touchId = null;
  stick.normMag = 0;
  stick.isSaturated = false;
  setPlayerChannelingAltar(false);
}

/**
 * Reconstrói o estado de movimento do teclado a partir das teclas fisicamente
 * pressionadas (rastreadas em activeKeyCodes). Chamado ao fechar o modal de
 * upgrade para que o jogador retome o movimento imediatamente sem precisar
 * soltar e re-pressionar WASD.
 */
export function restoreKeyboardMovement() {
  keys.up = activeKeyCodes.has('KeyW') || activeKeyCodes.has('ArrowUp');
  keys.down = activeKeyCodes.has('KeyS') || activeKeyCodes.has('ArrowDown');
  keys.left = activeKeyCodes.has('KeyA') || activeKeyCodes.has('ArrowLeft');
  keys.right = activeKeyCodes.has('KeyD') || activeKeyCodes.has('ArrowRight');

  horizKeyStack.length = 0;
  vertKeyStack.length = 0;
  if (keys.left) horizKeyStack.push('left');
  if (keys.right) horizKeyStack.push('right');
  if (keys.up) vertKeyStack.push('up');
  if (keys.down) vertKeyStack.push('down');

  updateKeyboardVector();
}

if (typeof window !== 'undefined') {
  window.addEventListener('blur', () => {
    activeKeyCodes.clear();
    resetInput();
    setPlayerChannelingAltar(false);
  });

  const canvas = document.getElementById('game-canvas');

// Touch Mobile com Zonificação Inteligente, Follow-Stick Dinâmico e Zonas Mortas Duplas
window.addEventListener('touchstart', e => {
  initAudio();
  if (e.target === canvas) e.preventDefault();
  if (!gameState.isInMatch || gameState.isPaused || gameState.isDead || gameState.isWon) return;

  for (let t of e.changedTouches) {
    if (!stick.active) {
      // Zonificação: Ignora toques no lado direito da tela (área de botões de ação / ULT)
      const screenW = window.innerWidth || 1280;
      const isRightSide = t.clientX > screenW * 0.58;
      const targetEl = e.target;
      const isActionButton = targetEl && (
        targetEl.closest && (
          targetEl.closest('#skill-btn-container') || 
          targetEl.closest('#blood-altar-touch-btn') || 
          targetEl.closest('#pause-btn') ||
          targetEl.closest('.hud-top-bar')
        )
      );

      if (isRightSide || isActionButton) continue;

      stick.active = true;
      stick.touchId = t.identifier;
      stick.startX = t.clientX;
      stick.startY = t.clientY;
      stick.curX = t.clientX;
      stick.curY = t.clientY;
      stick.normMag = 0;
      stick.isSaturated = false;
      stick.mode = joystickMode;
      inputX = 0;
      inputY = 0;
      break;
    }
  }
}, { passive: false });

window.addEventListener('touchmove', e => {
  if (e.target === canvas) e.preventDefault();
  if (!stick.active) return;

  for (let t of e.changedTouches) {
    if (t.identifier === stick.touchId) {
      const dx = t.clientX - stick.startX;
      const dy = t.clientY - stick.startY;
      const dist = Math.hypot(dx, dy);

      if (joystickMode === JOYSTICK_MODES.FLOATING) {
        // ====================================================================
        // 1. JOYSTICK FLUTUANTE (Comportamento Original Mantido Estritamente)
        // Follow-Stick: Se o polegar exceder o raio máximo, a base desliza
        // ====================================================================
        if (dist > stick.radius) {
          const nx = dx / dist;
          const ny = dy / dist;
          stick.startX = t.clientX - nx * stick.radius;
          stick.startY = t.clientY - ny * stick.radius;
          stick.curX = t.clientX;
          stick.curY = t.clientY;
        } else {
          stick.curX = t.clientX;
          stick.curY = t.clientY;
        }

        const curDx = stick.curX - stick.startX;
        const curDy = stick.curY - stick.startY;
        const curDist = Math.hypot(curDx, curDy);

        // Zonas Mortas: Interna (12%) e Saturação Externa (88%)
        const innerDeadzone = stick.radius * 0.12;
        const outerSaturation = stick.radius * 0.88;

        if (curDist < innerDeadzone) {
          stick.normMag = 0;
          stick.isSaturated = false;
          inputX = 0;
          inputY = 0;
        } else {
          const normMag = Math.min(1.0, (curDist - innerDeadzone) / (outerSaturation - innerDeadzone));
          const curvedMag = Math.pow(normMag, 1.15);
          stick.normMag = curvedMag;

          const wasSaturated = stick.isSaturated;
          stick.isSaturated = normMag >= 0.99;
          if (!wasSaturated && stick.isSaturated) {
            triggerHaptic('light');
          }

          const nx = curDist > 0.001 ? curDx / curDist : 0;
          const ny = curDist > 0.001 ? curDy / curDist : 0;
          inputX = nx * curvedMag;
          inputY = ny * curvedMag;
        }
      } else {
        // ====================================================================
        // 2. JOYSTICK DINÂMICO (Base Fixa no Ponto Inicial do Toque)
        // A base (startX, startY) permanece fixa no ponto inicial.
        // Somente o controle interno (knob: curX, curY) se desloca até o raio.
        // ====================================================================
        if (dist > stick.radius) {
          const nx = dx / dist;
          const ny = dy / dist;
          stick.curX = stick.startX + nx * stick.radius;
          stick.curY = stick.startY + ny * stick.radius;
        } else {
          stick.curX = t.clientX;
          stick.curY = t.clientY;
        }

        // Lógica de cálculo baseada na posição real do toque do jogador
        const innerDeadzone = stick.radius * 0.12;
        const outerSaturation = stick.radius * 0.88;

        if (dist < innerDeadzone) {
          stick.normMag = 0;
          stick.isSaturated = false;
          inputX = 0;
          inputY = 0;
        } else {
          const normMag = Math.min(1.0, (dist - innerDeadzone) / (outerSaturation - innerDeadzone));
          const curvedMag = Math.pow(normMag, 1.15);
          stick.normMag = curvedMag;

          const wasSaturated = stick.isSaturated;
          stick.isSaturated = normMag >= 0.99;
          if (!wasSaturated && stick.isSaturated) {
            triggerHaptic('light');
          }

          const nx = dist > 0.001 ? dx / dist : 0;
          const ny = dist > 0.001 ? dy / dist : 0;
          inputX = nx * curvedMag;
          inputY = ny * curvedMag;
        }
      }
      break;
    }
  }
}, { passive: false });

function endTouch(e) {
  for (let t of e.changedTouches) {
    if (t.identifier === stick.touchId) {
      stick.active = false;
      stick.touchId = null;
      stick.normMag = 0;
      stick.isSaturated = false;
      updateKeyboardVector(); // Retoma o controle do teclado caso alguma tecla esteja retida
      break;
    }
  }
}

window.addEventListener('touchend', endTouch);
window.addEventListener('touchcancel', endTouch);

// Suporte ao Teclado (WASD, Setas, Espaço, E, Esc e P)
window.addEventListener('keydown', e => {
  initAudio();
  activeKeyCodes.add(e.code);

  // Pausa com Esc ou P (ou fechar menu de bosses/astrolábio se estiver aberto)
  if (e.code === 'Escape' || e.code === 'KeyP') {
    e.preventDefault();
    const lockedHeroModal = document.getElementById('locked-hero-modal');
    if (lockedHeroModal && lockedHeroModal.style.display !== 'none' && !lockedHeroModal.classList.contains('modal-hidden')) {
      const closeBtn = document.getElementById('locked-hero-close-btn');
      if (closeBtn) {
        closeBtn.click();
        return;
      }
    }
    const blessingsDrawer = document.getElementById('blessings-summary-drawer');
    if (blessingsDrawer && blessingsDrawer.style.display === 'block') {
      blessingsDrawer.style.display = 'none';
      return;
    }
    const talentsModal = document.getElementById('talents-modal');
    if (talentsModal && talentsModal.style.display !== 'none' && !talentsModal.classList.contains('modal-hidden')) {
      const closeTalentsBtn = document.getElementById('close-talents-btn');
      if (closeTalentsBtn) {
        closeTalentsBtn.click();
        return;
      }
    }
    const achievementsModal = document.getElementById('achievements-modal');
    if (achievementsModal && achievementsModal.style.display !== 'none' && !achievementsModal.classList.contains('modal-hidden')) {
      const closeAchievementsBtn = document.getElementById('close-achievements-btn');
      if (closeAchievementsBtn) {
        closeAchievementsBtn.click();
        return;
      }
    }
    const bestiaryModal = document.getElementById('bestiary-modal');
    if (bestiaryModal && bestiaryModal.style.display !== 'none' && !bestiaryModal.classList.contains('modal-hidden')) {
      const closeBestiaryBtn = document.getElementById('close-bestiary-btn');
      if (closeBestiaryBtn) {
        closeBestiaryBtn.click();
        return;
      }
    }
    const bossModal = document.getElementById('boss-select-modal');
    if (bossModal && bossModal.style.display === 'flex') {
      closeBossSelectModal();
      return;
    }
    // Trava de segurança: impede que Esc ou P despause/retome o jogo se a tela de upgrades estiver ativa
    const upgradeModal = document.getElementById('upgrade-modal');
    if (upgradeModal && (upgradeModal.classList.contains('active') || upgradeModal.classList.contains('closing') || upgradeModal.style.display === 'flex' || (upgradeModal.style.display !== 'none' && !upgradeModal.classList.contains('modal-hidden')))) {
      return;
    }
    // Trava de segurança: impede que Esc ou P despause/retome o jogo se o baú de recompensas estiver ativo
    const chestModal = document.getElementById('chest-modal');
    if (chestModal && (chestModal.classList.contains('active') || chestModal.classList.contains('closing') || chestModal.style.display === 'flex' || (chestModal.style.display !== 'none' && !chestModal.classList.contains('modal-hidden')))) {
      return;
    }
    if (gameState.isInMatch) {
      togglePause();
    }
    return;
  }

  // Atalho Secreto de Desenvolvedor: W + 5
  const isWPressed = activeKeyCodes.has('KeyW') || e.code === 'KeyW';
  const is5Pressed = activeKeyCodes.has('Digit5') || activeKeyCodes.has('Numpad5') || e.code === 'Digit5' || e.code === 'Numpad5' || e.key === '5';

  if (isWPressed && is5Pressed) {
    if (isBossSelectAllowed()) {
      e.preventDefault();
      openBossSelectModal();
      return;
    }
  }

  // Canalização do Altar de Sangue exclusivamente com F (segurar 1.0s)
  if (e.code === 'KeyF') {
    const altar = getActiveBloodAltar();
    if (altar && altar.state === 'SPAWNED' && player) {
      const dist = Math.hypot(player.x - altar.x, player.y - altar.y);
      if (dist <= altar.interactRadius) {
        e.preventDefault();
        setPlayerChannelingAltar(true);
        return;
      }
    }
  }

  // Habilidade com Espaço ou E (ou retomar batalha se pausado)
  if (e.code === 'Space' || e.code === 'KeyE') {
    e.preventDefault();
    if (!gameState.isInMatch) return;
    if (gameState.isPaused) {
      const pauseModal = document.getElementById('pause-modal');
      if (pauseModal && pauseModal.style.display !== 'none' && !pauseModal.classList.contains('closing')) {
        togglePause();
      }
      return;
    }
    if (matchIntro && matchIntro.active) {
      matchIntro.skipped = true;
      if (matchIntro.timer < matchIntro.holdDuration) {
        matchIntro.timer = matchIntro.holdDuration;
      }
      return;
    }
    triggerHeroSkill();
    return;
  }

  // Se o jogo não estiver em partida ativa ou estiver pausado, bloqueia movimentação
  if (!gameState.isInMatch || gameState.isPaused) return;

  // Direcionais com suporte a SOCD Last-Input-Priority
  if (e.code === 'KeyW' || e.code === 'ArrowUp') { keys.up = true; pushKeyStack(vertKeyStack, 'up'); }
  if (e.code === 'KeyS' || e.code === 'ArrowDown') { keys.down = true; pushKeyStack(vertKeyStack, 'down'); }
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') { keys.left = true; pushKeyStack(horizKeyStack, 'left'); }
  if (e.code === 'KeyD' || e.code === 'ArrowRight') { keys.right = true; pushKeyStack(horizKeyStack, 'right'); }

  updateKeyboardVector();
});

window.addEventListener('keyup', e => {
  activeKeyCodes.delete(e.code);

  if (e.code === 'KeyF') {
    setPlayerChannelingAltar(false);
  }

  if (e.code === 'KeyW' || e.code === 'ArrowUp') { keys.up = false; removeKeyStack(vertKeyStack, 'up'); }
  if (e.code === 'KeyS' || e.code === 'ArrowDown') { keys.down = false; removeKeyStack(vertKeyStack, 'down'); }
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') { keys.left = false; removeKeyStack(horizKeyStack, 'left'); }
  if (e.code === 'KeyD' || e.code === 'ArrowRight') { keys.right = false; removeKeyStack(horizKeyStack, 'right'); }

  updateKeyboardVector();
});

// Bloqueia zoom via Mouse Wheel e Touchpad Pinch (Ctrl + Scroll / Pinça)
window.addEventListener('wheel', e => {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

// Bloqueia atalhos de teclado de zoom (Ctrl +, Ctrl -, Ctrl 0 no teclado normal e numérico)
window.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey) {
    const zoomKeys = [
      'Equal',          // Tecla + / =
      'Minus',          // Tecla -
      'NumpadAdd',      // + no numpad
      'NumpadSubtract', // - no numpad
      'Digit0',         // 0
      'Numpad0'         // 0 no numpad
    ];

    if (zoomKeys.includes(e.code) || e.key === '+' || e.key === '-' || e.key === '=') {
      e.preventDefault();
    }
  }
}, { passive: false });

// Habilidade ativada com Botão Direito do Mouse (sem abrir menu de contexto nativo)
window.addEventListener('contextmenu', e => {
  e.preventDefault();
  cursorState.active = true;
  cursorState.x = e.clientX;
  cursorState.y = e.clientY;
  cursorState.lastMovedTime = performance.now();
  if (matchIntro && matchIntro.active) {
    matchIntro.skipped = true;
    if (matchIntro.timer < matchIntro.holdDuration) {
      matchIntro.timer = matchIntro.holdDuration;
    }
    return;
  }
  triggerHeroSkill({ cursorX: e.clientX, cursorY: e.clientY });
});
}