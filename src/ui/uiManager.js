/**
 * src/ui/uiManager.js
 * Gerenciador e Fiação Central da Interface de Usuário Grim Cyber-Gothic.
 * Unifica o controle de modais, escutas de eventos do DOM e reexportações da UI.
 */

// 1. Re-exports de todos os Modais Especializados
export * from './modals/bossSelectModal.js';
export * from './modals/upgradeModal.js';
export * from './modals/pauseModal.js';
export * from './modals/chestModal.js';
export * from './modals/gameOverModal.js';
export * from './modals/characterSelectModal.js';
export * from './modals/talentsModal.js';
export * from './modals/codexModal.js';

// 2. Dependências para a inicialização e fiação dos eventos (initUI)
import { levelUp } from './modals/upgradeModal.js';
import { togglePause, openPause, renderPauseInventory } from './modals/pauseModal.js';
import { openCharacterSelect, isMobileScreen } from './modals/characterSelectModal.js';
import { 
  openAchievementsModal, 
  closeAchievementsModal, 
  setCurrentAchievementsCategory,
  renderAchievementsRoster,
  renderAchievementDossier,
  selectedAchievementId,
  openBestiaryModal, 
  closeBestiaryModal, 
  currentBestiaryCategory, 
  setCurrentBestiaryCategory,
  renderBestiaryRoster, 
  renderBestiaryDossier, 
  selectedCreatureId 
} from './modals/codexModal.js';
import { 
  openTalentsModal, 
  activeRenderAstrolabe, 
  setActiveRenderAstrolabe 
} from './modals/talentsModal.js';
import { 
  closeBossSelectModal, 
  renderBossSelectModal 
} from './modals/bossSelectModal.js';
import { resetMetaTree } from '../systems/progression.js';
import { playSfx, setGameVolume, audioCtx } from '../core/audio.js';
import { gameState } from '../state/gameState.js';
import { activeBoss } from '../state/collections.js';
import { terminateMatch } from '../main.js';
import { onLayoutChange, updateHudBottomMetric } from '../core/responsive.js';
import { resizePreviewCanvas } from '../render/characterPreview.js';
import { setJoystickMode, JOYSTICK_MODES } from '../core/input.js';

/**
 * Inicializador da Interface de Usuário e Fiação de Eventos
 */
export function initUI() {
  const bindClick = (id, handler) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        handler(e);
      });
    }
  };

  // Botões de Menu Inicial / Relíquias do Altar
  bindClick('open-talents-btn', () => openTalentsModal());
  bindClick('open-achievements-btn', () => openAchievementsModal());
  bindClick('open-codex-btn', () => openAchievementsModal());
  bindClick('open-bestiary-btn', () => openBestiaryModal());
  bindClick('open-char-select-btn', () => openCharacterSelect());
  bindClick('open-boss-select-btn', () => renderBossSelectModal());

  // Fechamento de Modais
  bindClick('close-talents-btn', () => {
    setActiveRenderAstrolabe(null);
    const blessingsDrawer = document.getElementById('blessings-summary-drawer');
    if (blessingsDrawer) blessingsDrawer.style.display = 'none';
    const talentsModal = document.getElementById('talents-modal');
    if (talentsModal) {
      talentsModal.classList.add('closing');
      setTimeout(() => {
        talentsModal.classList.remove('active', 'closing');
        talentsModal.classList.add('modal-hidden');
        talentsModal.style.setProperty('display', 'none', 'important');
        talentsModal.style.display = 'none';
        openCharacterSelect();
      }, 200);
    } else {
      openCharacterSelect();
    }
  });

  bindClick('close-achievements-btn', () => closeAchievementsModal());
  bindClick('close-bestiary-btn', () => closeBestiaryModal());
  bindClick('close-boss-select-btn', () => closeBossSelectModal());
  bindClick('close-blessings-drawer-btn', () => {
    const drawer = document.getElementById('blessings-summary-drawer');
    if (drawer) drawer.style.display = 'none';
  });

  // Fechamento por clique fora (Backdrop)
  const achievementsModalEl = document.getElementById('achievements-modal');
  if (achievementsModalEl) {
    achievementsModalEl.addEventListener('click', e => {
      if (e.target === achievementsModalEl) closeAchievementsModal();
    });
  }

  const bestiaryModalEl = document.getElementById('bestiary-modal');
  if (bestiaryModalEl) {
    bestiaryModalEl.addEventListener('click', e => {
      if (e.target === bestiaryModalEl) closeBestiaryModal();
    });
  }

  const talentsModalEl = document.getElementById('talents-modal');
  if (talentsModalEl) {
    talentsModalEl.addEventListener('click', e => {
      if (e.target === talentsModalEl) {
        const closeBtn = document.getElementById('close-talents-btn');
        if (closeBtn) closeBtn.click();
      }
    });
  }

  // Abas do Códice Ancestral
  bindClick('tab-achievements-btn', () => openAchievementsModal());
  bindClick('tab-bestiary-btn', () => openBestiaryModal());

  // Abas de Categoria do Grimório de Conquistas
  document.querySelectorAll('.achievements-tab-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const cat = btn.getAttribute('data-cat') || 'ALL';
      document.querySelectorAll('.achievements-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setCurrentAchievementsCategory(cat);
      if (cat === 'JOURNEY') {
        renderAchievementsRoster(cat);
        renderAchievementDossier('JOURNEY');
      } else {
        renderAchievementsRoster(cat);
        renderAchievementDossier();
      }
      playSfx('click');
    });
  });

  // Abas de Categoria do Bestiário (Horda, Mini-Chefes, Chefes, Todos)
  document.querySelectorAll('.bestiary-tab-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const cat = btn.getAttribute('data-cat') || 'ALL';
      document.querySelectorAll('.bestiary-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setCurrentBestiaryCategory(cat);
      renderBestiaryRoster(cat);
      playSfx('click');
    });
  });

  // Reset da Árvore de Talentos (Purificar)
  const handleResetTalents = () => {
    const refunded = resetMetaTree();
    if (refunded > 0) {
      playSfx('chest');
    }
    openTalentsModal();
  };
  bindClick('reset-talents-btn', handleResetTalents);
  bindClick('talents-reset-btn', handleResetTalents);

  // Botões de Reiniciar Partida (Morte e Vitória)
  bindClick('restart-death-btn', () => {
    terminateMatch();
    openCharacterSelect();
  });
  bindClick('restart-victory-btn', () => {
    terminateMatch();
    openCharacterSelect();
  });

  // Controle de Volume Geral
  const volSlider = document.getElementById('volume-slider') || document.getElementById('master-volume-slider');
  if (volSlider) {
    volSlider.addEventListener('input', e => {
      const val = parseFloat(e.target.value);
      setGameVolume(val);
    });
  }

  // Controle de Modo de Joystick (Fixo / Flutuante vs Dinâmico - Mobile)
  const handleJoystickModeChange = (mode) => {
    setJoystickMode(mode);
    playSfx('click');
    const badge = document.getElementById('joystick-mode-badge');
    if (badge) badge.innerText = (mode === JOYSTICK_MODES.FLOATING || mode === 'floating') ? 'FLUTUANTE' : 'DINÂMICO';
    const btnFloat = document.getElementById('btn-joy-floating');
    const btnDyn = document.getElementById('btn-joy-dynamic');
    if (btnFloat) btnFloat.classList.toggle('active', mode === JOYSTICK_MODES.FLOATING || mode === 'floating');
    if (btnDyn) btnDyn.classList.toggle('active', mode === JOYSTICK_MODES.DYNAMIC || mode === 'dynamic');
    renderPauseInventory();
  };
  bindClick('btn-joy-floating', () => handleJoystickModeChange(JOYSTICK_MODES.FLOATING));
  bindClick('btn-joy-dynamic', () => handleJoystickModeChange(JOYSTICK_MODES.DYNAMIC));

  const joyFixed = document.getElementById('joy-mode-fixed');
  const joyDynamic = document.getElementById('joy-mode-dynamic');
  if (joyFixed && joyDynamic) {
    joyFixed.addEventListener('change', () => {
      if (joyFixed.checked) setJoystickMode(JOYSTICK_MODES.FIXED);
    });
    joyDynamic.addEventListener('change', () => {
      if (joyDynamic.checked) setJoystickMode(JOYSTICK_MODES.DYNAMIC);
    });
  }

  // Botão de Pausa no HUD
  bindClick('pause-btn', () => {
    if (gameState.isInMatch && !gameState.isDead && !gameState.isWon) {
      togglePause();
    }
  });

  // Retomar Partida da Pausa
  bindClick('resume-btn', () => {
    togglePause();
  });

  // Abandonar Partida (Retornar ao Menu)
  bindClick('abandon-btn', () => {
    togglePause();
    terminateMatch();
    openCharacterSelect();
  });

  // Responsividade e Layout
  onLayoutChange(() => {
    updateHudBottomMetric();
    resizePreviewCanvas();
  });

  // Escuta de Subida de Nível do Jogador (Apresentação de Bênçãos / Upgrades)
  window.addEventListener('player:levelup', () => {
    levelUp();
  });
}
