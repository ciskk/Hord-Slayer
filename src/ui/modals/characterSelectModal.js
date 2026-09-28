import { t, getLanguage, setLanguage, onLanguageChange, formatNumber, formatPercent } from '../../i18n/index.js';
import { translateDOM, htmlT, escapeHtml } from '../../i18n/dom.js';
import { getHeroPresentation, getUnlockPresentation, getHeroStatusLabel } from '../../i18n/characterPresentation.js';
/**
 * src/ui/modals/characterSelectModal.js
 * Altar de Invocação dos Heróis Arcanos: Seleção, Showcase Tático Bento, Prévia 3D/2D Canvas e Gestos Touch.
 */
import { CHARACTERS } from '../../config/characters.js';
import { 
  HERO_UNLOCK_MAP 
} from '../../config/achievements.js';
import {
  isHeroUnlocked, 
  getAchievementStatus,
  getHeroRecord,
  getPersistentGold,
  evaluateAchievements,
  getUnseenDiscoveredCreaturesCount,
  getUnseenUnlockedAchievementsCount,
  canAffordAnyMetaUpgrade,
  getAffordableMetaUpgradesCount
} from '../../systems/progression.js';
import { 
  startPreview, 
  stopPreview, 
  resizePreviewCanvas,
  setPreviewHero, 
  togglePreviewFacing, 
  setPreviewPose,
  triggerHeroAttack
} from '../../render/characterPreview.js';
import { 
  playSfx, 
  triggerHaptic, 
  resetDeathAudioFilter 
} from '../../core/audio.js';
import { 
  selectedHeroKey,
  setSelectedHeroKey
} from '../../entities/player.js';
import { layoutMetrics, updateAllAutoFit, onLayoutChange } from '../../core/responsive.js';
import { gameState } from '../../state/gameState.js';
import { resetGame, terminateMatch } from '../../main.js';

import { renderIcon, WEAPON_ICONS, SKILL_AOE_PATTERNS } from '../icons.js';
import { closeDeathModal } from './gameOverModal.js';
import { applyHeroVisuals } from '../hudController.js';

// Brasões Heráldicos Vetoriais e Perfis dos Campeões (Centralizados em heroProfiles.js)
export { HERO_EMBLEMS_SVG, CHARACTER_PROFILES } from '../../config/heroProfiles.js';
import { HERO_EMBLEMS_SVG, CHARACTER_PROFILES } from '../../config/heroProfiles.js';

export let activeShowcaseHeroKey = 'KNIGHT';
let activeMobileSlideIndex = 0; // 0: Arsenal, 1: Atributos, 2: Biografia
let charSelectKeydownHandler = null;
let lastCharModalMobileState = null;
let refreshCharacterSelectLanguage = null;
let lockedHeroKey = null;
let languageControlsInitialized = false;

export function initCharacterSelectI18n() {
  const select = document.getElementById('language-select');
  const widget = document.getElementById('char-language-widget');
  const btn = document.getElementById('char-language-btn');
  const dropdown = document.getElementById('char-language-dropdown');
  const optionBtns = dropdown ? dropdown.querySelectorAll('.lang-option-btn') : [];

  if (languageControlsInitialized) return;
  languageControlsInitialized = true;

  const langNames = {
    'pt-BR': 'Português',
    'en': 'English',
    'es': 'Español',
    'fr': 'Français'
  };
  const langCodes = {
    'pt-BR': 'PT',
    'en': 'EN',
    'es': 'ES',
    'fr': 'FR'
  };

  const closeDropdown = () => {
    if (!widget || !widget.classList.contains('is-open')) return;
    widget.classList.remove('is-open');
    btn?.setAttribute('aria-expanded', 'false');
  };

  const openDropdown = () => {
    if (!widget || widget.classList.contains('is-open')) return;
    widget.classList.add('is-open');
    btn?.setAttribute('aria-expanded', 'true');
    try { playSfx('card_hover'); } catch (e) {}
    try { triggerHaptic('light'); } catch (e) {}
  };

  const toggleDropdown = (e) => {
    e?.stopPropagation();
    if (widget?.classList.contains('is-open')) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  btn?.addEventListener('click', toggleDropdown);

  optionBtns.forEach(optBtn => {
    const lang = optBtn.getAttribute('data-lang');
    optBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      try { playSfx('card_hover'); } catch (e) {}
      try { triggerHaptic('light'); } catch (e) {}
      closeDropdown();
      if (lang && lang !== getLanguage()) {
        setLanguage(lang);
      }
    });
    optBtn.addEventListener('mouseenter', () => {
      try { playSfx('card_hover'); } catch (e) {}
    });
  });

  // Fechar ao clicar/tocar fora do widget
  document.addEventListener('pointerdown', (e) => {
    if (widget && !widget.contains(e.target)) {
      closeDropdown();
    }
  }, { passive: true });

  // Acessibilidade e teclado no widget
  widget?.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      closeDropdown();
      btn?.focus();
    }
  });

  const update = () => {
    const currentLang = getLanguage();
    if (select) select.value = currentLang;

    // Atualiza texto e sigla na cápsula
    const textEl = document.getElementById('char-lang-text');
    if (textEl) textEl.textContent = langNames[currentLang] || currentLang;

    const badge = document.getElementById('char-lang-code');
    if (badge) badge.textContent = langCodes[currentLang] || currentLang.slice(0, 2).toUpperCase();

    // Sincroniza marcação ativa nas opções do dropdown
    optionBtns.forEach(optBtn => {
      const isSelected = optBtn.getAttribute('data-lang') === currentLang;
      optBtn.classList.toggle('active', isSelected);
      optBtn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    translateDOM(document.getElementById('char-modal'));
    translateDOM(document.getElementById('locked-hero-modal'));
    const modal = document.getElementById('char-modal');
    if (modal && modal.style.display !== 'none' && !modal.classList.contains('modal-hidden')) {
      refreshCharacterSelectLanguage?.();
    }
    const lockedModal = document.getElementById('locked-hero-modal');
    if (lockedHeroKey && lockedModal && lockedModal.style.display !== 'none' && !lockedModal.classList.contains('modal-hidden')) {
      renderLockedHeroContent(lockedHeroKey);
    }
    updateAllAutoFit();
  };

  select?.addEventListener('change', () => setLanguage(select.value));
  // Native select navigation must not reach the game's movement/start shortcuts.
  select?.addEventListener('keydown', event => event.stopPropagation());
  select?.addEventListener('keyup', event => event.stopPropagation());
  onLanguageChange(update);
  update();
}

export function isMobileScreen() {
  return layoutMetrics.isCompactWidth || 
         layoutMetrics.isCompactHeight || 
         window.innerWidth <= 768 || 
         ('ontouchstart' in window && window.innerWidth <= 950) || 
         /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) ||
         (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));
}

// Sincroniza estrutura do Altar em tempo real na alternância entre telas horizontais (PC) e mobile
if (typeof window !== 'undefined') {
  onLayoutChange(() => {
    const charModal = document.getElementById('char-modal');
    if (!charModal || charModal.classList.contains('modal-hidden') || charModal.style.display === 'none') {
      return;
    }
    const currentMobile = isMobileScreen();
    if (lastCharModalMobileState !== null && lastCharModalMobileState !== currentMobile) {
      lastCharModalMobileState = currentMobile;
      openCharacterSelect();
    } else {
      updateAllAutoFit();
    }
  });
}

export function closeLockedHeroModal() {
  const modal = document.getElementById('locked-hero-modal');
  if (!modal || modal.style.display === 'none' || modal.classList.contains('modal-hidden')) return;
  modal.classList.add('closing');
  try { playSfx('card_hover'); } catch (e) {}
  setTimeout(() => {
    modal.classList.add('modal-hidden');
    modal.classList.remove('closing');
    modal.style.setProperty('display', 'none', 'important');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }, 200);
}

function renderLockedHeroContent(heroKey) {
  const modal = document.getElementById('locked-hero-modal');
  if (!modal) return;

  const key = heroKey || activeShowcaseHeroKey || 'MAGE';
  const char = getHeroPresentation(key, CHARACTERS[key] || CHARACTERS.MAGE);
  const profile = CHARACTER_PROFILES[key] || CHARACTER_PROFILES.MAGE;
  const achId = HERO_UNLOCK_MAP[key];
  const status = achId ? getUnlockPresentation(achId, getAchievementStatus(achId)) : null;

  // 1. Atualizar Brasão Heráldico Vetorial e Cores
  const emblemDisc = document.getElementById('locked-hero-emblem-disc');
  if (emblemDisc) {
    emblemDisc.innerHTML = profile.emblemSvg || '';
    emblemDisc.style.setProperty('--disc-accent', profile.themeColor || '#ff7675');
  }

  // 2. Atualizar Nomes e Arquétipo
  const archetypeEl = document.getElementById('locked-hero-archetype');
  if (archetypeEl) {
    archetypeEl.innerText = (char.title || t('characterSelect.defaultArchetype')).toUpperCase();
    archetypeEl.style.color = profile.themeColor || '#ffd166';
  }

  const nameEl = document.getElementById('locked-hero-name');
  if (nameEl) {
    nameEl.innerText = char.name || t('characterSelect.defaultHero');
  }

  // 3. Atualizar Seção da Conquista / Requisito
  const achTitleEl = document.getElementById('locked-achievement-title');
  if (achTitleEl) {
    achTitleEl.innerText = (status?.title || t('characterSelect.defaultSeal')).toUpperCase();
  }

  const achDescEl = document.getElementById('locked-achievement-desc');
  if (achDescEl) {
    achDescEl.innerText = status?.desc || t('characterSelect.defaultRequirement');
  }

  // 4. Barra de Progresso Cósmico
  const progValEl = document.getElementById('locked-progress-val');
  const progFillEl = document.getElementById('locked-progress-fill');
  const statusRatioEl = document.getElementById('locked-hero-status-ratio');
  if (status) {
    const cur = status.current ?? 0;
    const tgt = status.target ?? 1;
    const pct = status.pct ?? 0;
    if (statusRatioEl) {
      statusRatioEl.innerText = `${formatNumber(cur)}/${formatNumber(tgt)}`;
    }
    if (progValEl) {
      progValEl.innerHTML = `<span class="prog-cur-tgt">${formatNumber(cur)} / ${formatNumber(tgt)}</span> <span class="prog-pct-pill">${formatPercent(pct / 100)}</span>`;
    }
    if (progFillEl) {
      progFillEl.style.width = `${pct}%`;
    }
  } else {
    if (statusRatioEl) {
      statusRatioEl.innerText = '0/1';
    }
    if (progValEl) {
      progValEl.innerHTML = `<span class="prog-cur-tgt">0 / 1</span> <span class="prog-pct-pill">0%</span>`;
    }
    if (progFillEl) progFillEl.style.width = '0%';
  }

  return { key, achId };
}

export function openLockedHeroModal(heroKey) {
  const modal = document.getElementById('locked-hero-modal');
  if (!modal) return;
  const { key, achId } = renderLockedHeroContent(heroKey);
  lockedHeroKey = key;
  translateDOM(modal);

  // 5. Fiação dos Botões de Ação
  const okBtn = document.getElementById('locked-hero-ok-btn');
  if (okBtn) {
    okBtn.onclick = (e) => {
      e.stopPropagation();
      closeLockedHeroModal();
    };
  }

  const closeBtn = document.getElementById('locked-hero-close-btn');
  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeLockedHeroModal();
    };
  }

  const backdrop = document.getElementById('locked-hero-backdrop');
  if (backdrop) {
    backdrop.onclick = (e) => {
      e.stopPropagation();
      closeLockedHeroModal();
    };
  }

  const codexBtn = document.getElementById('locked-view-codex-btn');
  if (codexBtn) {
    codexBtn.onclick = (e) => {
      e.stopPropagation();
      closeLockedHeroModal();
      import('./achievementsModal.js').then(m => {
        if (m.openAchievementsModal) {
          m.openAchievementsModal('hero', achId);
        }
      }).catch(err => {
        console.error('Erro ao abrir Grimório de Conquistas:', err);
      });
    };
  }

  // 6. Exibição, Animação e Auto-Fit
  modal.classList.remove('modal-hidden', 'closing');
  modal.style.removeProperty('display');
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');

  // Dispara o cálculo inteligente de auto-fit para acomodar o card perfeitamente sem scrollbars
  try {
    updateAllAutoFit(modal);
  } catch (err) {
    console.warn('Erro ao atualizar auto-fit do modal de herói bloqueado:', err);
  }

  try {
    playSfx('forcefield');
  } catch (e) {}
  triggerHaptic('medium');
}

export function closeCharSelectModal() {
  closeLockedHeroModal();
  if (charSelectKeydownHandler) {
    window.removeEventListener('keydown', charSelectKeydownHandler);
    charSelectKeydownHandler = null;
  }
  stopPreview();
  const hud = document.getElementById('hud');
  if (hud) {
    hud.classList.add('hud-hidden');
    hud.style.setProperty('display', 'none', 'important');
    hud.style.display = 'none';
  }
  const charModal = document.getElementById('char-modal');
  if (charModal) {
    charModal.classList.add('modal-hidden');
    charModal.style.setProperty('display', 'none', 'important');
    charModal.style.display = 'none';
  }
}

export function updateRelicNotificationPips() {
  try {
    // 1. Bestiário (Códice): monstros derrotados recém-descobertos
    const unseenBestiary = getUnseenDiscoveredCreaturesCount();
    const pipBestiary = document.getElementById('pip-bestiary');
    if (pipBestiary) {
      if (unseenBestiary > 0) {
        pipBestiary.style.display = 'flex';
        pipBestiary.setAttribute('title', t('characterSelect.notifications.creatures', { count: unseenBestiary }));
      } else {
        pipBestiary.style.display = 'none';
        pipBestiary.removeAttribute('title');
      }
    }

    // 2. Conquistas (Grimório): conquistas concluídas pendentes de consulta
    const unseenAch = getUnseenUnlockedAchievementsCount();
    const pipAch = document.getElementById('pip-achievements');
    if (pipAch) {
      if (unseenAch > 0) {
        pipAch.style.display = 'flex';
        pipAch.setAttribute('title', t('characterSelect.notifications.achievements', { count: unseenAch }));
      } else {
        pipAch.style.display = 'none';
        pipAch.removeAttribute('title');
      }
    }

    // 3. Astrolábio (Talentos): almas suficientes para desbloquear ou aprimorar talentos
    const canAffordTalents = canAffordAnyMetaUpgrade();
    const affordableCount = getAffordableMetaUpgradesCount();
    const pipTalents = document.getElementById('pip-talents');
    if (pipTalents) {
      if (canAffordTalents) {
        pipTalents.style.display = 'flex';
        pipTalents.setAttribute('title', t('characterSelect.notifications.talents', { count: affordableCount }));
      } else {
        pipTalents.style.display = 'none';
        pipTalents.removeAttribute('title');
      }
    }
  } catch (err) {
    console.warn('Erro ao atualizar pips de notificação das relíquias:', err);
  }
}

export let currentSheetState = 'peek'; // 'peek' | 'half'

export function setBottomSheetState(newState, triggerEffects = true) {
  const sheet = document.getElementById('char-dossier-wing') || document.querySelector('.mobile-bottom-sheet');
  if (!sheet) return;

  // Apenas 2 patamares permitidos: 'peek' (recolhido) e 'half' (expandido para visualização de detalhes)
  const validState = newState === 'half' || newState === 'expanded' ? 'half' : 'peek';
  currentSheetState = validState;
  sheet.setAttribute('data-sheet-state', validState);
  sheet.classList.remove('is-dragging');
  sheet.style.removeProperty('height');

  const chevron = document.getElementById('sheet-expand-chevron');
  const hintText = document.getElementById('sheet-drag-hint-text');
  if (chevron) {
    chevron.innerText = validState === 'peek' ? '▲' : '▼';
  }
  if (hintText) {
    hintText.innerText = t('characterSelect.details');
  }

  if (triggerEffects) {
    try { triggerHaptic('light'); } catch (e) {}
    try { playSfx('card_hover'); } catch (e) {}
  }

  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      resizePreviewCanvas();
      updateAllAutoFit();
    });
  }
}

export function initBottomSheetGestures() {
  const sheet = document.getElementById('char-dossier-wing') || document.querySelector('.mobile-bottom-sheet');
  const handleZone = document.getElementById('sheet-drag-handle-zone') || document.querySelector('.sheet-drag-handle-zone');
  if (!sheet || sheet._hasBottomSheetAttached) return;
  sheet._hasBottomSheetAttached = true;

  let touchStartY = 0;
  let touchStartX = 0;
  let touchStartTime = 0;
  let startHeight = 0;
  let isDragging = false;
  let isHorizontalSlide = false;

  const startDrag = (clientY, clientX) => {
    touchStartY = clientY;
    touchStartX = clientX;
    touchStartTime = Date.now();
    startHeight = sheet.getBoundingClientRect().height;
    isDragging = true;
    isHorizontalSlide = false;
  };

  const moveDrag = (clientY, clientX, e) => {
    if (!isDragging) return;
    const deltaY = clientY - touchStartY;
    const deltaX = clientX - touchStartX;

    // Se o movimento for predominantemente horizontal, não intercepta (permite navegar nos slides)
    if (!isHorizontalSlide && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && Math.abs(deltaX) > 10) {
      isHorizontalSlide = true;
      sheet.classList.remove('is-dragging');
      sheet.style.removeProperty('height');
      return;
    }
    if (isHorizontalSlide) return;

    // Arrasto vertical 1:1 acompanhando o dedo (limitado ao patamar half)
    if (Math.abs(deltaY) > 5) {
      sheet.classList.add('is-dragging');
      const maxH = Math.min(window.innerHeight * 0.55, 450);
      const minH = 155;
      const newHeight = Math.max(minH, Math.min(maxH, startHeight - deltaY));
      sheet.style.height = `${newHeight}px`;
      if (e.cancelable) e.preventDefault();
    }
  };

  const endDrag = (clientY, clientX) => {
    if (!isDragging) return;
    isDragging = false;
    sheet.classList.remove('is-dragging');
    sheet.style.removeProperty('height');

    if (isHorizontalSlide) return;

    const deltaY = clientY - touchStartY;
    const deltaTime = Math.max(1, Date.now() - touchStartTime);
    const velocity = deltaY / deltaTime; // negativo = puxou pra cima, positivo = puxou pra baixo

    // 1. Toque rápido sem arrasto -> Alterna diretamente entre peek e half
    if (Math.abs(deltaY) < 10 && deltaTime < 300) {
      if (currentSheetState === 'peek') {
        setBottomSheetState('half');
      } else {
        setBottomSheetState('peek');
      }
      return;
    }

    // 2. Gesto rápido (Flick / Swipe com inércia)
    if (Math.abs(velocity) > 0.28 || Math.abs(deltaY) > 40) {
      if (velocity < 0 || deltaY < -40) {
        // Puxou para cima -> abre patamar único half
        setBottomSheetState('half');
      } else {
        // Puxou para baixo -> recolhe para peek
        setBottomSheetState('peek');
      }
      return;
    }

    // 3. Arraste lento: snap único entre peek e half (sem expansão dupla)
    const finalHeight = startHeight - deltaY;
    if (finalHeight < 240) {
      setBottomSheetState('peek');
    } else {
      setBottomSheetState('half');
    }
  };

  // Event listeners na alça de arraste
  if (handleZone) {
    handleZone.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        startDrag(e.touches[0].clientY, e.touches[0].clientX);
      }
    }, { passive: false });

    handleZone.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        moveDrag(e.touches[0].clientY, e.touches[0].clientX, e);
      }
    }, { passive: false });

    handleZone.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        endDrag(e.changedTouches[0].clientY, e.changedTouches[0].clientX);
      }
    }, { passive: true });

    // Suporte a clique direto na alça (Desktop / Touch Emulation)
    handleZone.onclick = (e) => {
      e.stopPropagation();
      if (currentSheetState === 'peek') setBottomSheetState('half');
      else setBottomSheetState('peek');
    };
  }

  // Toque na identidade do campeão no modo peek também abre para o modo half
  sheet.addEventListener('click', (e) => {
    if (currentSheetState === 'peek') {
      const monolith = e.target.closest('.char-identity-monolith');
      if (monolith) {
        setBottomSheetState('half');
      }
    }
  });

  // Fechar ao clicar/tocar fora do card quando expandido (Item 3)
  document.addEventListener('pointerdown', (e) => {
    if (currentSheetState !== 'half') return;
    if (e.target.closest('.char-language-control, .char-language-capsule, .char-language-widget')) return;
    const currentSheet = document.getElementById('char-dossier-wing') || document.querySelector('.mobile-bottom-sheet');
    if (!currentSheet) return;
    if (!currentSheet.contains(e.target)) {
      setBottomSheetState('peek');
    }
  }, { passive: true });
}

export function openCharacterSelect() {
  if (gameState.isInMatch) {
    terminateMatch();
  }
  gameState.isPaused = false;
  resetDeathAudioFilter();
  evaluateAchievements();
  updateRelicNotificationPips();

  const hud = document.getElementById('hud');
  if (hud) {
    hud.classList.add('hud-hidden');
    hud.style.setProperty('display', 'none', 'important');
    hud.style.display = 'none';
  }
  const bloodFilter = document.getElementById('blood-screen-filter');
  if (bloodFilter) bloodFilter.classList.remove('active');

  const canvasElem = document.getElementById('game-canvas');
  if (canvasElem) {
    canvasElem.classList.remove('canvas-death-frozen');
    canvasElem.classList.remove('canvas-stasis-frozen');
  }

  const talentsModal = document.getElementById('talents-modal');
  if (talentsModal) {
    talentsModal.classList.add('modal-hidden');
    talentsModal.style.setProperty('display', 'none', 'important');
    talentsModal.style.display = 'none';
  }

  const achievementsModal = document.getElementById('achievements-modal');
  if (achievementsModal) {
    achievementsModal.classList.add('modal-hidden');
    achievementsModal.style.setProperty('display', 'none', 'important');
    achievementsModal.style.display = 'none';
  }

  const bestiaryModal = document.getElementById('bestiary-modal');
  if (bestiaryModal) {
    bestiaryModal.classList.add('modal-hidden');
    bestiaryModal.style.setProperty('display', 'none', 'important');
    bestiaryModal.style.display = 'none';
  }

  closeDeathModal();

  const victoryModal = document.getElementById('victory-modal');
  if (victoryModal) victoryModal.style.display = 'none';

  const pauseModal = document.getElementById('pause-modal');
  if (pauseModal) {
    pauseModal.classList.remove('active', 'closing');
    pauseModal.style.display = 'none';
  }

  const bossModal = document.getElementById('boss-select-modal');
  if (bossModal) bossModal.style.display = 'none';

  const charModal = document.getElementById('char-modal');
  const pedestalsContainer = document.getElementById('char-pedestals');
  const showcaseContainer = document.getElementById('char-showcase');
  if (!charModal || !pedestalsContainer || !showcaseContainer) return;

  charModal.classList.remove('modal-hidden');
  charModal.style.removeProperty('display');
  charModal.style.display = 'flex';
  window.scrollTo(0, 0);
  charModal.scrollLeft = 0;
  if (document.documentElement) document.documentElement.scrollLeft = 0;
  if (document.body) document.body.scrollLeft = 0;

  // Detecção e aplicação de classe mobile para layout responsivo exclusivo
  const isMobile = isMobileScreen();
  lastCharModalMobileState = isMobile;
  charModal.classList.toggle('is-mobile-device', isMobile);

  // Parallax Dinâmico 2.5D no Desktop com o movimento do mouse
  if (!charModal._hasParallaxAttached && !isMobile) {
    charModal._hasParallaxAttached = true;
    window.addEventListener('mousemove', (e) => {
      if (charModal.classList.contains('modal-hidden') || charModal.style.display === 'none') return;
      const w = window.innerWidth || 1920;
      const h = window.innerHeight || 1080;
      const normX = (e.clientX - w / 2) / (w / 2);
      const normY = (e.clientY - h / 2) / (h / 2);

      const rift = document.querySelector('.char-void-rift');
      if (rift) {
        rift.style.transform = `translate(calc(-50% + ${normX * 14}px), calc(-50% + ${normY * 10}px))`;
      }
      const arch = document.querySelector('.char-cathedral-arch-svg');
      if (arch) {
        arch.style.transform = `scale(1.02) translate(${normX * 6}px, ${normY * 4}px)`;
      }
      const rays = document.querySelector('.char-god-rays');
      if (rays) {
        rays.style.transform = `translate(${normX * -10}px, ${normY * -6}px)`;
      }
      const canvas = document.getElementById('char-preview-canvas');
      if (canvas) {
        canvas.style.transform = `translate(${normX * 4}px, ${normY * 3}px)`;
      }
    }, { passive: true });
  }

  // Atualizar contador de Almas no cabeçalho
  const soulsVal = document.getElementById('char-souls-val');
  if (soulsVal) {
    soulsVal.innerText = formatNumber(getPersistentGold());
  }

  // Função geradora de medidores segmentados estilizados
  const renderSegments = (val) => {
    let segs = '<div class="segmented-meter">';
    for (let i = 1; i <= 5; i++) {
      segs += `<div class="segment-cell ${i <= val ? 'filled' : ''}"></div>`;
    }
    segs += '</div>';
    return segs;
  };

  const heroKeys = Object.keys(CHARACTERS);

  if (!isHeroUnlocked(activeShowcaseHeroKey)) {
    activeShowcaseHeroKey = 'KNIGHT';
  }

  function scrollPedestalToCenter(targetElem) {
    if (!targetElem || !pedestalsContainer) return;
    const containerW = pedestalsContainer.clientWidth;
    const elemLeft = targetElem.offsetLeft;
    const elemW = targetElem.offsetWidth;
    const targetScroll = elemLeft - (containerW / 2) + (elemW / 2);
    pedestalsContainer.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
  }

  function selectAdjacentHero(step) {
    const curIdx = heroKeys.indexOf(activeShowcaseHeroKey);
    const nextIdx = (curIdx + step + heroKeys.length) % heroKeys.length;
    try { playSfx('card_hover'); } catch(e) {}
    triggerHaptic('light');
    renderShowcase(heroKeys[nextIdx]);

    // Rola suavemente APENAS a esteira horizontal de pedestais sem mover o viewport
    const activeBtn = pedestalsContainer.querySelector(`[data-hero="${heroKeys[nextIdx]}"]`);
    scrollPedestalToCenter(activeBtn);
  }

  function renderShowcase(heroKey, { refresh = false } = {}) {
    activeShowcaseHeroKey = heroKey;
    const char = getHeroPresentation(heroKey, CHARACTERS[heroKey] || CHARACTERS.KNIGHT, { html: true });
    const profile = CHARACTER_PROFILES[heroKey] || CHARACTER_PROFILES.KNIGHT;
    const aoeInfo = {
      ...(SKILL_AOE_PATTERNS[heroKey] || SKILL_AOE_PATTERNS.KNIGHT),
      tag: htmlT('heroes.' + heroKey + '.aoe.tag'),
      title: t('heroes.' + heroKey + '.aoe.title'),
      desc: t('heroes.' + heroKey + '.aoe.description')
    };
    const unlocked = isHeroUnlocked(heroKey);
    const achId = HERO_UNLOCK_MAP[heroKey];
    const status = achId ? getUnlockPresentation(achId, getAchievementStatus(achId), { html: true }) : null;
    const heroRecord = getHeroRecord(heroKey) || {
      heroKey,
      unlocked,
      runsPlayed: 0,
      victories: 0,
      kills: 0,
      bestSeconds: 0,
      timeStr: '00:00',
      statusLabel: unlocked ? 'DESPERTO' : 'BLOQUEADO',
      statusClass: unlocked ? 'status-awake' : 'status-locked'
    };

    if (!refresh) {
      setPreviewHero(heroKey);

      // Efeito suave de transição ao alternar de herói
      showcaseContainer.classList.remove('hero-shifting');
      void showcaseContainer.offsetWidth;
      showcaseContainer.classList.add('hero-shifting');

      const canvasElem = document.getElementById('char-preview-canvas');
      if (canvasElem) {
        canvasElem.classList.remove('hero-canvas-shift');
        void canvasElem.offsetWidth;
        canvasElem.classList.add('hero-canvas-shift');
      }
    }

    // Atualiza contador de heróis despertos no topo do roster
    const rosterCountBadge = document.getElementById('roster-count-badge');
    if (rosterCountBadge) {
      const unlockedCount = heroKeys.filter(k => isHeroUnlocked(k)).length;
      rosterCountBadge.innerText = t('characterSelect.awakened', { current: unlockedCount, total: heroKeys.length });
    }

    const badge = document.getElementById('stage-archetype-badge');
    if (badge) {
      badge.innerHTML = `${escapeHtml(t(`heroes.${heroKey}.title`).toUpperCase())} ${!unlocked ? renderIcon('lock', { size: 10, color: '#ff7675', style: 'margin-left:4px; vertical-align:middle; display:inline-block;' }) : ''}`;
      badge.style.color = unlocked ? profile.themeColor : '#ff9f9f';
      badge.style.borderColor = unlocked ? `${profile.themeColor}aa` : 'rgba(255, 118, 117, 0.45)';
      badge.style.boxShadow = unlocked ? `0 0 18px ${profile.themeColor}66` : '0 0 14px rgba(255, 118, 117, 0.25)';
      if (!unlocked) {
        badge.style.cursor = 'pointer';
        badge.setAttribute('title', t('characterSelect.unlockTip'));
        badge.onclick = () => openLockedHeroModal(heroKey);
      } else {
        badge.style.cursor = 'default';
        badge.removeAttribute('title');
        badge.onclick = null;
      }
    }

    showcaseContainer.style.setProperty('--showcase-color', unlocked ? profile.themeColor : '#747d8c');
    charModal.style.setProperty('--showcase-color', unlocked ? profile.themeColor : '#747d8c');
    const ambientBloom = document.getElementById('char-ambient-bloom');
    if (ambientBloom) {
      ambientBloom.style.setProperty('--showcase-color', unlocked ? profile.themeColor : '#747d8c');
    }

    const diff = char.difficulty || 1;
    let diffDots = '';
    for (let d = 1; d <= 3; d++) {
      diffDots += `<span class="diff-dot ${d <= diff ? 'filled' : 'empty'}">◆</span>`;
    }
    const diffLabel = t(`characterSelect.difficulty.${diff === 1 ? 'beginner' : diff === 2 ? 'balanced' : 'advanced'}`);
    const isMobile = isMobileScreen();

    if (!isMobile) {
      // Telas Horizontais / Desktop: Auto-fit no dossiê completo para eliminar qualquer scrollbar
      showcaseContainer.setAttribute('data-autofit', 'true');
      showcaseContainer.setAttribute('data-autofit-target', '.char-dossier-content');
      showcaseContainer.setAttribute('data-autofit-min-scale', '0.65');
    } else {
      // Telas Verticais / Mobile: cada slide permite rolagem para descrições longas
      showcaseContainer.removeAttribute('data-autofit');
      showcaseContainer.removeAttribute('data-autofit-target');
      showcaseContainer.removeAttribute('data-autofit-min-scale');
    }

    showcaseContainer.innerHTML = `
      <div class="char-dossier-content">
        <!-- 1. Monólito de Identidade -->
        <div class="char-identity-monolith">
          <div class="hero-monolith-eyebrow">
            <span class="hero-archetype-pill">${char.title}</span>
            <div class="hero-diff-pips" title="${htmlT('characterSelect.difficulty.label', { difficulty: diffLabel })}">
              <span>${diffLabel}</span>
              <span>${diffDots}</span>
            </div>
          </div>

          <h2 class="hero-monolith-name">${char.name}</h2>
          <div class="hero-monolith-role">${htmlT('characterSelect.role')} <b>${char.role}</b></div>
        </div>

        <!-- 2. Navegador de 3 Pílulas dos Slides (Mobile) -->
        <div class="mobile-slide-pills" id="mobile-slide-pills">
          <button class="slide-pill-btn ${activeMobileSlideIndex === 0 ? 'active' : ''}" data-slide="0" type="button" aria-label="${htmlT('characterSelect.viewArsenal')}">
            <span class="pill-dot"></span>
            <span class="pill-text">${htmlT('characterSelect.arsenal')}</span>
          </button>
          <button class="slide-pill-btn ${activeMobileSlideIndex === 1 ? 'active' : ''}" data-slide="1" type="button" aria-label="${htmlT('characterSelect.viewAttributes')}">
            <span class="pill-dot"></span>
            <span class="pill-text">${htmlT('characterSelect.attributes')}</span>
          </button>
          <button class="slide-pill-btn ${activeMobileSlideIndex === 2 ? 'active' : ''}" data-slide="2" type="button" aria-label="${htmlT('characterSelect.viewBiography')}">
            <span class="pill-dot"></span>
            <span class="pill-text">${htmlT('characterSelect.biography')}</span>
          </button>
        </div>

        <!-- 3. Trilho de Slides (Mobile: Deslize horizontal / Desktop: Fluxo contínuo) -->
        <div class="mobile-slides-track" id="mobile-slides-track">
          <!-- Slide 0: Arsenal & Habilidades -->
          <div class="mobile-slide-pane" data-slide-index="0">
            <div class="hero-loadout-lineage">
              <!-- Entrada 1: Arma Inicial -->
              <div class="loadout-entry">
                <div class="loadout-entry-main">
                  <div class="loadout-icon-box" style="--icon-accent: ${profile.themeColor};">
                    ${renderIcon(WEAPON_ICONS[char.startingWeapon] || 'sword', { size: 14, color: profile.themeColor })}
                  </div>
                  <div class="loadout-info-block">
                    <div class="loadout-entry-header">
                      <span class="loadout-entry-badge">${htmlT('characterSelect.startingWeapon')}</span>
                      <span class="loadout-entry-chip">${char.weapon?.type || profile.weaponName}</span>
                    </div>
                    <div class="loadout-entry-title" style="color: ${profile.themeColor};">${char.weapon?.name || profile.weaponName}</div>
                  </div>
                </div>
                <div class="loadout-entry-desc">${char.weapon?.desc || ''}</div>
              </div>

              <!-- Entrada 2: Poder Ancestral -->
              <div class="loadout-entry loadout-entry-skill">
                <div class="loadout-entry-main">
                  <div class="loadout-icon-box" style="--icon-accent: ${profile.themeColor};">
                    ${renderIcon('damage', { size: 14, color: profile.themeColor })}
                  </div>
                  <div class="loadout-info-block">
                    <div class="loadout-entry-header">
                      <span class="loadout-entry-badge">${htmlT('characterSelect.ancestralPower')}</span>
                      <span class="loadout-entry-chip chip-cooldown">
                        ${renderIcon('timer', { size: 9 })} ${char.skill?.cooldown || '7s'}
                      </span>
                    </div>
                    <div class="loadout-entry-title" style="color: ${profile.themeColor};">${char.skill.name}</div>
                  </div>
                  <div class="skill-aoe-cluster" title="${htmlT('characterSelect.geometry', { title: aoeInfo.title, description: aoeInfo.desc })}" style="--aoe-accent: ${profile.themeColor};">
                    <div class="skill-aoe-reticle">
                      ${aoeInfo.svg}
                    </div>
                    <span class="skill-aoe-tag">${aoeInfo.tag}</span>
                  </div>
                </div>
                <div class="loadout-entry-desc">${char.skill?.desc || ''}</div>
              </div>

              <!-- Entrada 3: Bênção Passiva -->
              <div class="loadout-entry">
                <div class="loadout-entry-main">
                  <div class="loadout-icon-box" style="--icon-accent: ${profile.themeColor};">
                    ${renderIcon('armor', { size: 14, color: profile.themeColor })}
                  </div>
                  <div class="loadout-info-block">
                    <div class="loadout-entry-header">
                      <span class="loadout-entry-badge">${htmlT('characterSelect.passiveBlessing')}</span>
                    </div>
                    <div class="loadout-entry-title" style="color: ${profile.themeColor};">${char.passive.name}</div>
                  </div>
                </div>
                <div class="loadout-entry-desc">${char.passive?.desc || ''}</div>
              </div>

              <!-- Fim do Arsenal (3 Entradas Essenciais: Arma, Habilidade e Passiva) -->
            </div>
          </div>

          <!-- Slide 1: Matriz de Atributos Unificada -->
          <div class="mobile-slide-pane" data-slide-index="1">
            <div class="hero-telemetry-cluster">
              <div class="telemetry-header">
                <span class="telemetry-title">${htmlT('characterSelect.combatMatrix')}</span>
                <span class="telemetry-resonance-line"></span>
              </div>
              <div class="telemetry-tracks">
                <!-- DANO -->
                <div class="telemetry-channel" data-stat="dano">
                  <span class="channel-label">${htmlT('characterSelect.damage')}</span>
                  <div class="channel-laser-track">
                    <div class="channel-laser-fill" style="width: ${(profile.levels.dano / 5) * 100}%;"></div>
                    <div class="channel-pips"><span/><span/><span/><span/></div>
                  </div>
                  <span class="channel-val">${profile.levels.dano}/5</span>
                </div>
                <!-- ÁREA -->
                <div class="telemetry-channel" data-stat="area">
                  <span class="channel-label">${htmlT('characterSelect.area')}</span>
                  <div class="channel-laser-track">
                    <div class="channel-laser-fill" style="width: ${(profile.levels.area / 5) * 100}%;"></div>
                    <div class="channel-pips"><span/><span/><span/><span/></div>
                  </div>
                  <span class="channel-val">${profile.levels.area}/5</span>
                </div>
                <!-- VEL -->
                <div class="telemetry-channel" data-stat="vel">
                  <span class="channel-label">${htmlT('characterSelect.speed')}</span>
                  <div class="channel-laser-track">
                    <div class="channel-laser-fill" style="width: ${(profile.levels.vel / 5) * 100}%;"></div>
                    <div class="channel-pips"><span/><span/><span/><span/></div>
                  </div>
                  <span class="channel-val">${profile.levels.vel}/5</span>
                </div>
                <!-- RES -->
                <div class="telemetry-channel" data-stat="res">
                  <span class="channel-label">${htmlT('characterSelect.resilience')}</span>
                  <div class="channel-laser-track">
                    <div class="channel-laser-fill" style="width: ${(profile.levels.res / 5) * 100}%;"></div>
                    <div class="channel-pips"><span/><span/><span/><span/></div>
                  </div>
                  <span class="channel-val">${profile.levels.res}/5</span>
                </div>
              </div>

              <!-- Registro de Honra (Estatísticas Individuais do Campeão) -->
              <div class="hero-battle-record-panel">
                <div class="record-panel-header">
                  <span class="record-panel-title">${htmlT('characterSelect.battleRecord')}</span>
                  <span class="record-panel-runs">${htmlT('characterSelect.runs', { count: heroRecord.runsPlayed })}</span>
                </div>
                <div class="record-metrics-row">
                  <div class="record-metric-item">
                    <span class="metric-label">${htmlT('characterSelect.bestTime')}</span>
                    <span class="metric-val ${heroRecord.bestSeconds > 0 ? 'highlight-gold' : ''}">${heroRecord.timeStr}</span>
                  </div>
                  <div class="record-metric-item">
                    <span class="metric-label">${htmlT('characterSelect.maxKills')}</span>
                    <span class="metric-val ${heroRecord.kills > 0 ? 'highlight-crimson' : ''}">${formatNumber(heroRecord.kills)}</span>
                  </div>
                  <div class="record-metric-item">
                    <span class="metric-label">${htmlT('characterSelect.status')}</span>
                    <span class="metric-val ${heroRecord.statusClass}">${escapeHtml(getHeroStatusLabel(heroRecord))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Slide 2: Lore & Selo Primordial -->
          <div class="mobile-slide-pane" data-slide-index="2">
            <div class="hero-lore-pane">
              <div class="hero-monolith-quote">
                “${char.lore || ''}”
              </div>

              ${!unlocked && status ? `
                <div class="primordial-seal-banner" id="showcase-seal-banner" style="cursor: pointer;" title="${htmlT('characterSelect.unlockDetailsTip')}">
                  <div class="seal-header">
                    <span class="seal-icon">${renderIcon('lock', { size: 14, color: '#ff7675' })}</span>
                    <div class="seal-titles">
                      <span class="seal-eyebrow">${htmlT('characterSelect.unlockRequirement')}</span>
                      <span class="seal-name">${status.title}</span>
                    </div>
                    <div class="seal-status-badge">
                      <span class="seal-status-dot"></span>
                      <span class="seal-status-text">${htmlT('characterSelect.sealActive')}</span>
                      <span class="seal-status-ratio">${formatNumber(status.current)}/${formatNumber(status.target)}</span>
                    </div>
                  </div>
                  <div class="seal-desc">${status.desc}</div>
                  <div class="seal-progress-block">
                    <div class="seal-progress-row">
                      <span class="seal-progress-label">${htmlT('characterSelect.attunement')}</span>
                      <span class="seal-progress-val">${formatNumber(status.current)} / ${formatNumber(status.target)}</span>
                    </div>
                    <div class="seal-track">
                      <div class="seal-fill" style="width: ${status.pct}%;"></div>
                    </div>
                  </div>
                </div>
              ` : unlocked && profile.titleQuote ? `
                <div class="hero-tactical-hint">
                  <div class="tactical-hint-header">
                    <span class="hint-glyph">✦</span>
                    <span class="hint-title">${htmlT('characterSelect.guidance')}</span>
                  </div>
                  <p class="hint-text">${profile.titleQuote}</p>
                </div>
              ` : `
                <div class="hero-tactical-hint">
                  <div class="tactical-hint-header">
                    <span class="hint-glyph">✦</span>
                    <span class="hint-title">${htmlT('characterSelect.guidance')}</span>
                  </div>
                  <p class="hint-text">${htmlT('characterSelect.guidanceText')}</p>
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- 4. Catalisador de Despertar (Start Action Button) -->
        ${unlocked ? `
          <button class="btn-ignition-catalyst" id="confirm-hero-btn" type="button" aria-label="${htmlT('characterSelect.startLabel')}">
            <div class="btn-shimmer-sweep"></div>
            <div class="btn-arcane-flames" aria-hidden="true"></div>
            <div class="btn-corner-sparks" aria-hidden="true">
              <span class="corner-spark top-left">✦</span>
              <span class="corner-spark top-right">✦</span>
              <span class="corner-spark bottom-left">✦</span>
              <span class="corner-spark bottom-right">✦</span>
            </div>
            <div class="btn-ember-drift" aria-hidden="true">
              <span class="ember-spark ember-1"></span>
              <span class="ember-spark ember-2"></span>
              <span class="ember-spark ember-3"></span>
              <span class="ember-spark ember-4"></span>
            </div>
            <span class="btn-catalyst-glow"></span>
            <span class="btn-catalyst-content">
              ${htmlT('characterSelect.start')}
            </span>
            <span class="btn-hotkey-hint">${htmlT('controls.space')}</span>
          </button>
        ` : `
          <button class="btn-ignition-catalyst is-locked" id="confirm-hero-btn" type="button" aria-label="${htmlT('characterSelect.lockedLabel')}">
            <div class="btn-shimmer-sweep"></div>
            <div class="btn-arcane-flames" aria-hidden="true"></div>
            <div class="btn-corner-sparks" aria-hidden="true">
              <span class="corner-spark top-left">✦</span>
              <span class="corner-spark top-right">✦</span>
              <span class="corner-spark bottom-left">✦</span>
              <span class="corner-spark bottom-right">✦</span>
            </div>
            <span class="btn-catalyst-content">
              ${renderIcon('lock', { size: 14, color: '#ff7675', style: 'margin-right:8px; vertical-align:middle;' })}
              ${htmlT('characterSelect.sealActive')}
            </span>
            <span class="btn-hotkey-hint">${htmlT('characterSelect.requirements')}</span>
          </button>
        `}
      </div>
    `;

    // A rebuilt dossier starts at its heading, including after opening a locked hero.
    showcaseContainer.scrollTop = 0;

    // Interatividade dos 3 Slides Mobile (Pílulas + Scroll-Snap Swipe)
    const track = showcaseContainer.querySelector('#mobile-slides-track');
    const pills = showcaseContainer.querySelectorAll('.slide-pill-btn');
    if (track && pills.length > 0) {
      const updatePills = (idx) => {
        pills.forEach((p, i) => {
          const isActive = (i === idx);
          p.classList.toggle('active', isActive);
          p.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        updateAllAutoFit();
      };

      const initialSlideIndex = activeMobileSlideIndex;
      let restoringSlide = true;
      let lastTrackWidth = track.clientWidth;
      const syncSlidePosition = () => {
        if (!track.isConnected) return;
        const w = track.clientWidth || 0;
        lastTrackWidth = w;
        track.scrollTo({ left: initialSlideIndex * w, behavior: 'instant' });
        updatePills(initialSlideIndex);
        requestAnimationFrame(() => { restoringSlide = false; });
      };
      requestAnimationFrame(syncSlidePosition);

      pills.forEach(pBtn => {
        pBtn.onclick = () => {
          const idx = parseInt(pBtn.getAttribute('data-slide'), 10) || 0;
          activeMobileSlideIndex = idx;
          try { playSfx('card_hover'); } catch(e) {}
          triggerHaptic('light');
          const w = track.clientWidth || 0;
          track.scrollTo({ left: idx * w, behavior: 'smooth' });
          updatePills(idx);
        };
      });

      let isScrolling = false;
      track.addEventListener('scroll', () => {
        if (restoringSlide || !track.isConnected) return;
        if (!isScrolling) {
          requestAnimationFrame(() => {
            if (!track.isConnected) return;
            const w = track.clientWidth || 1;
            if (w !== lastTrackWidth) {
              lastTrackWidth = w;
              track.scrollTo({ left: activeMobileSlideIndex * w, behavior: 'instant' });
              isScrolling = false;
              return;
            }
            const curIdx = Math.max(0, Math.min(pills.length - 1, Math.round(track.scrollLeft / w)));
            if (curIdx !== activeMobileSlideIndex) {
              activeMobileSlideIndex = curIdx;
              updatePills(curIdx);
            }
            isScrolling = false;
          });
          isScrolling = true;
        }
      }, { passive: true });

      // Suporte a arrasto contínuo por ponteiro (mouse ou touch emulados)
      let pointerDown = false;
      let startX = 0;
      let scrollStart = 0;
      let hasDragged = false;

      track.onpointerdown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        pointerDown = true;
        hasDragged = false;
        startX = e.clientX;
        scrollStart = track.scrollLeft;
        track.style.scrollSnapType = 'none';
        track.style.scrollBehavior = 'auto';
        try { track.setPointerCapture(e.pointerId); } catch(err) {}
      };

      track.onpointermove = (e) => {
        if (!pointerDown) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 4) hasDragged = true;
        track.scrollLeft = scrollStart - dx;
      };

      const finishPointer = (e) => {
        if (!pointerDown) return;
        pointerDown = false;
        track.style.scrollSnapType = 'x mandatory';
        track.style.scrollBehavior = 'smooth';
        try { track.releasePointerCapture(e.pointerId); } catch(err) {}
        if (hasDragged) {
          const w = track.clientWidth || 1;
          const curIdx = Math.max(0, Math.min(pills.length - 1, Math.round(track.scrollLeft / w)));
          activeMobileSlideIndex = curIdx;
          track.scrollTo({ left: curIdx * w, behavior: 'smooth' });
          updatePills(curIdx);
        }
      };

      track.onpointerup = finishPointer;
      track.onpointercancel = finishPointer;
    }

    const confirmBtn = document.getElementById('confirm-hero-btn');
    if (confirmBtn) {
      if (unlocked) {
        confirmBtn.style.setProperty('--showcase-color', profile.themeColor);
        confirmBtn.onclick = () => {
          setSelectedHeroKey(heroKey);
          applyHeroVisuals(heroKey);
          closeCharSelectModal();
          resetGame();
          try { playSfx('warp'); } catch(e) {}
        };
      } else {
        confirmBtn.onclick = () => {
          openLockedHeroModal(heroKey);
        };
      }
    }

    const sealBanner = showcaseContainer.querySelector('#showcase-seal-banner');
    if (sealBanner) {
      sealBanner.onclick = () => {
        openLockedHeroModal(heroKey);
      };
    }

    // Atualiza classes ativas nos nós de sigilo
    const sigilItems = pedestalsContainer.querySelectorAll('.char-sigil-item');
    sigilItems.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-hero') === heroKey);
    });

    // Mantém o estado do Bottom Sheet sem saltos bruscos na troca de herói
    if (isMobile) {
      const sheet = document.getElementById('char-dossier-wing');
      if (sheet) {
        sheet.setAttribute('data-sheet-state', currentSheetState);
        const chevron = document.getElementById('sheet-expand-chevron');
        const hintText = document.getElementById('sheet-drag-hint-text');
        if (chevron) {
          chevron.innerText = currentSheetState === 'peek' ? '▲' : '▼';
        }
        if (hintText) {
          hintText.innerText = t('characterSelect.details');
        }
      }
    }

    // Dispara recálculo de auto-fit proporcional adaptativo
    updateAllAutoFit();
  }

  function renderRoster() {
    pedestalsContainer.innerHTML = '';
    const isMobileLayout = isMobileScreen();
    let sigilTargetParent = pedestalsContainer;

    if (!isMobileLayout) {
      // Telas Horizontais / Desktop: Auto-fit adaptativo para a coluna de pedestais
      pedestalsContainer.setAttribute('data-autofit', 'true');
      pedestalsContainer.setAttribute('data-autofit-target', '.char-sigils-flow');
      pedestalsContainer.setAttribute('data-autofit-min-scale', '0.65');

      const sigilsFlow = document.createElement('div');
      sigilsFlow.className = 'char-sigils-flow';
      pedestalsContainer.appendChild(sigilsFlow);
      sigilTargetParent = sigilsFlow;
    } else {
      // Telas Verticais / Mobile: Trilho horizontal de toque com snap nativo
      pedestalsContainer.removeAttribute('data-autofit');
      pedestalsContainer.removeAttribute('data-autofit-target');
      pedestalsContainer.removeAttribute('data-autofit-min-scale');
    }

    heroKeys.forEach(key => {
      const c = getHeroPresentation(key, CHARACTERS[key], { html: true });
      const profile = CHARACTER_PROFILES[key] || CHARACTER_PROFILES.KNIGHT;
      const diff = c.difficulty || 1;
      let miniDots = '◆'.repeat(diff) + '◇'.repeat(3 - diff);
      const unlocked = isHeroUnlocked(key);

      const sigil = document.createElement('div');
      sigil.className = `char-sigil-item ${key === activeShowcaseHeroKey ? 'active' : ''} ${!unlocked ? 'sigil-locked' : ''}`;
      sigil.setAttribute('data-hero', key);
      const plainHero = getHeroPresentation(key, CHARACTERS[key]);
      sigil.setAttribute('title', t(unlocked ? 'characterSelect.heroTooltip' : 'characterSelect.lockedHeroTooltip', { name: plainHero.name, title: plainHero.title }));
      sigil.style.setProperty('--showcase-color', unlocked ? profile.themeColor : '#57606f');
      sigil.innerHTML = `
        <div class="sigil-focus-needle"></div>
        <div class="sigil-runic-circuit" aria-hidden="true">
          <svg class="runic-circuit-svg" viewBox="0 0 200 64" fill="none" preserveAspectRatio="none">
            <path class="circuit-path-base" d="M 80 2 L 140 2 L 160 18 L 198 18" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path class="circuit-path-branch" d="M 125 2 L 138 14 L 138 46 L 152 62 L 198 62" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
            <circle class="circuit-node" cx="198" cy="18" r="2" fill="currentColor"/>
            <circle class="circuit-node" cx="198" cy="62" r="2" fill="currentColor"/>
            <circle class="circuit-node" cx="80" cy="2" r="1.5" fill="currentColor"/>
            <path class="circuit-rune-glyph" d="M 175 42 L 180 37 L 185 42 L 180 47 Z" stroke="currentColor" stroke-width="0.8" fill="none"/>
          </svg>
        </div>
        <div class="sigil-crest-disc" style="--disc-accent: ${unlocked ? profile.themeColor : '#4b5563'};">
          ${profile.emblemSvg}
          ${!unlocked ? `<div class="sigil-lock-marker">${renderIcon('lock', { size: 9, color: '#ff7675' })}</div>` : ''}
        </div>
        <div class="sigil-identity">
          <span class="sigil-archetype-tag">${c.title}</span>
          <span class="sigil-hero-name">${c.name}</span>
          <div class="sigil-meta-row">
            ${unlocked
              ? `<span class="sigil-role-label">${c.role || ''}</span><span class="sigil-diff-pips">${miniDots}</span>`
              : `<span class="sigil-locked-text">${renderIcon('lock', { size: 8, color: '#ff7675', style: 'vertical-align:middle;' })} ${htmlT('characterSelect.locked')}</span>`
            }
          </div>
        </div>
      `;

      sigil.onclick = () => {
        try { playSfx('card_hover'); } catch(e) {}
        triggerHaptic('light');
        if (key === activeShowcaseHeroKey && !unlocked) {
          openLockedHeroModal(key);
        } else {
          renderShowcase(key);
          scrollPedestalToCenter(sigil);
        }
      };

      sigilTargetParent.appendChild(sigil);
    });
  }
  renderRoster();
  refreshCharacterSelectLanguage = () => {
    const scrollLeft = pedestalsContainer.scrollLeft;
    const focusId = showcaseContainer.contains(document.activeElement) ? document.activeElement.id : null;
    renderRoster();
    renderShowcase(activeShowcaseHeroKey, { refresh: true });
    pedestalsContainer.scrollLeft = scrollLeft;
    if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
    if (soulsVal) soulsVal.innerText = formatNumber(getPersistentGold());
    updateRelicNotificationPips();
  };

  // Setas de Navegação Rápida do Palco (Ideal para touch)
  const prevBtn = document.getElementById('btn-stage-prev');
  if (prevBtn) {
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      selectAdjacentHero(-1);
    };
  }

  const nextBtn = document.getElementById('btn-stage-next');
  if (nextBtn) {
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      selectAdjacentHero(1);
    };
  }

  // Gestos de Deslize Touch (Swipe) no Palco de Evocação
  const stageViewport = document.querySelector('.char-stage-viewport');
  if (stageViewport && !stageViewport._hasSwipeAttached) {
    stageViewport._hasSwipeAttached = true;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    stageViewport.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    stageViewport.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const deltaTime = Date.now() - touchStartTime;

        // Movimento horizontal de no mínimo 38px e predominante sobre o vertical
        if (Math.abs(deltaX) > 38 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && deltaTime < 550) {
          if (deltaX < 0) {
            selectAdjacentHero(1); // Deslize para esquerda -> próximo
          } else {
            selectAdjacentHero(-1); // Deslize para direita -> anterior
          }
        } else if (Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12 && deltaTime < 350) {
          // Toque rápido direto no herói -> dispara o golpe característico
          triggerHeroAttack(true);
        }
      }
    }, { passive: true });
  }

  // Configuração dos Controles Interativos da Prévia
  const facingBtn = document.getElementById('btn-preview-facing');
  if (facingBtn) {
    facingBtn.onclick = () => {
      const dir = togglePreviewFacing();
      facingBtn.classList.toggle('flipped', dir === -1);
      try { playSfx('card_hover'); } catch(e) {}
    };
  }

  const poseBtns = document.querySelectorAll('.stage-pose-btn');
  poseBtns.forEach(pBtn => {
    pBtn.onclick = () => {
      poseBtns.forEach(b => b.classList.remove('active'));
      pBtn.classList.add('active');
      const pose = pBtn.getAttribute('data-pose');
      setPreviewPose(pose);
      try { triggerHaptic('light'); } catch(e) {}
      try { playSfx('card_hover'); } catch(e) {}
    };
  });

  renderShowcase(activeShowcaseHeroKey);
  charModal.style.display = 'flex';

  // Inicializa gestos táteis e ancora o Bottom Sheet rúnico
  initBottomSheetGestures();
  if (isMobile) {
    setBottomSheetState(currentSheetState || 'peek', false);
  }

  // Sincronização garantida de layout, canvas e auto-fit pós-exibição do modal
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      resizePreviewCanvas();
      updateAllAutoFit();
    });
  }
  setTimeout(() => {
    resizePreviewCanvas();
    updateAllAutoFit();
  }, 50);

  // Iniciar loop de animação da prévia em canvas
  startPreview(activeShowcaseHeroKey);

  // Configurar atalhos de navegação por teclado (Desktop)
  if (charSelectKeydownHandler) {
    window.removeEventListener('keydown', charSelectKeydownHandler);
  }
  charSelectKeydownHandler = (e) => {
    if (!charModal || charModal.style.display === 'none' || charModal.classList.contains('modal-hidden')) return;

    // Se o pop-up de herói bloqueado estiver aberto, teclas ESC, Espaço e Enter fecham o pop-up
    const lockedHeroModal = document.getElementById('locked-hero-modal');
    if (lockedHeroModal && lockedHeroModal.style.display !== 'none' && !lockedHeroModal.classList.contains('modal-hidden')) {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        closeLockedHeroModal();
      }
      return;
    }

    // Não interceptar se outro modal estiver ativo sobreposto
    const talentsModal = document.getElementById('talents-modal');
    const bestiaryModal = document.getElementById('bestiary-modal');
    const achievementsModal = document.getElementById('achievements-modal');
    if ((talentsModal && talentsModal.style.display !== 'none' && !talentsModal.classList.contains('modal-hidden')) ||
        (bestiaryModal && bestiaryModal.style.display !== 'none' && !bestiaryModal.classList.contains('modal-hidden')) ||
        (achievementsModal && achievementsModal.style.display !== 'none' && !achievementsModal.classList.contains('modal-hidden'))) {
      return;
    }

    // Não interceptar se o usuário estiver focando em algum input
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ArrowUp') {
      e.preventDefault();
      selectAdjacentHero(-1);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'ArrowDown') {
      e.preventDefault();
      selectAdjacentHero(1);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (isHeroUnlocked(activeShowcaseHeroKey)) {
        const confirmBtn = document.getElementById('confirm-hero-btn');
        if (confirmBtn && !confirmBtn.disabled) {
          confirmBtn.click();
        }
      } else {
        openLockedHeroModal(activeShowcaseHeroKey);
      }
    }
  };
  window.addEventListener('keydown', charSelectKeydownHandler);
}
