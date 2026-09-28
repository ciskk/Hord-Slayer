import { t, formatNumber } from '../../i18n/index.js';
import { htmlT, escapeHtml } from '../../i18n/dom.js';
/**
 * src/ui/modals/upgradeModal.js
 * Renderizador de Cartas de Tarô Arcano de Poder (Level-up & Bênçãos de Chefes).
 * Design System: Neo-Arcane / Void Astral (Paridade com Pause & Morte)
 */
import { player, isHeroInUninterruptibleState, getNextLevelXp } from '../../entities/player.js';
import { checkIsSynergyIngredient } from '../../config/items.js';
import { getRandomUpgrades, checkSynergies, upgradesPool, BLESSING_UPGRADE } from '../../config/upgrades.js';
import { playSfx } from '../../core/audio.js';
import { resetInput, resetInputSoft, restoreKeyboardMovement } from '../../core/input.js';
import { gameState, setLastTime } from '../../main.js';
import { activeBoss } from '../../state/collections.js';
import { renderIcon } from '../icons.js';
import { updateAllAutoFit } from '../../core/responsive.js';

import { UPGRADE_ICONS } from '../cardIcons.js';

// Keep the existing export for consumers of this modal.
export { UPGRADE_ICONS };

function isSynergyIngredient(optId) {
  return checkIsSynergyIngredient(optId, player);
}

export let pendingLevelUps = 0;
export function getPendingLevelUps() {
  return pendingLevelUps;
}
export let bossRewardContext = null;
let levelupKeydownHandler = null;
let currentOptions = [];
let upgradeResizeObserver = null;

export function setBossRewardContext(bossName, bossId) {
  bossRewardContext = {
    bossName: bossName || 'Chefe Supremo',
    bossId: bossId || 1,
    totalCount: 0,
    chosenCount: 0
  };
}

export function ensureBossUpgradeCount(minCount) {
  if (bossRewardContext && bossRewardContext.totalCount < minCount) {
    const diff = minCount - bossRewardContext.totalCount;
    for (let k = 0; k < diff; k++) {
      levelUp();
    }
  }
}

export function resetUpgradeQueue() {
  pendingLevelUps = 0;
  bossRewardContext = null;
  const bossBanner = document.getElementById('boss-reward-banner');
  if (bossBanner) bossBanner.style.display = 'none';
}

export function updateUpgradeModalHeader() {
  const modal = document.getElementById('upgrade-modal');
  if (modal) modal.classList.toggle('has-boss-reward', !!(bossRewardContext && bossRewardContext.totalCount > 0));
  const bossBanner = document.getElementById('boss-reward-banner');
  const bossTitle = document.getElementById('boss-reward-title');
  const bossCounter = document.getElementById('boss-reward-counter');
  const eyebrowText = document.getElementById('levelup-eyebrow-text');
  const headerSub = document.getElementById('levelup-monumental-sub');
  const heroLvlBadge = document.getElementById('levelup-hero-level');
  const queueChip = document.getElementById('levelup-queue-chip');
  const queueCount = document.getElementById('levelup-queue-count');

  if (heroLvlBadge) {
    heroLvlBadge.innerText = t('match.common.level', { number: formatNumber(player.level || 1) });
  }

  if (queueChip && queueCount) {
    if (pendingLevelUps > 1) {
      queueChip.style.display = 'inline-flex';
      queueCount.innerText = t('match.upgrade.blessings', { count: pendingLevelUps });
    } else {
      queueChip.style.display = 'none';
    }

    let autoSkipBtn = document.getElementById('levelup-auto-skip-btn');
    if (!autoSkipBtn && queueChip.parentNode) {
      autoSkipBtn = document.createElement('button');
      autoSkipBtn.id = 'levelup-auto-skip-btn';
      autoSkipBtn.className = 'levelup-auto-skip-btn';
      autoSkipBtn.title = t('match.upgrade.autoTip');
      autoSkipBtn.onclick = () => autoCompleteRemainingLevelUps();
      queueChip.parentNode.insertBefore(autoSkipBtn, queueChip.nextSibling);
    }
    if (autoSkipBtn) {
      if (pendingLevelUps > 1) {
        autoSkipBtn.style.display = 'inline-flex';
        autoSkipBtn.innerHTML = t('match.upgrade.auto', { count: pendingLevelUps });
      } else {
        autoSkipBtn.style.display = 'none';
      }
    }
  }

  if (bossRewardContext && bossRewardContext.totalCount > 0) {
    if (bossBanner) {
      bossBanner.style.display = 'flex';
      if (bossTitle) {
        const rawBossId = bossRewardContext.bossId;
        const normalizedBossId = String(rawBossId).startsWith('BOSS_') ? rawBossId : `BOSS_${rawBossId}`;
        const translatedBoss = t(`creatures.${normalizedBossId}.name`, {}, t(`bestiary.${normalizedBossId}.name`, {}, bossRewardContext.bossName || ''));
        bossTitle.innerText = t('match.upgrade.victory', { boss: translatedBoss.toUpperCase() });
      }
      if (bossCounter) {
        const currentChoice = bossRewardContext.chosenCount + 1;
        const total = Math.max(bossRewardContext.totalCount, bossRewardContext.chosenCount + pendingLevelUps);
        const remaining = Math.max(0, pendingLevelUps - 1);
        bossCounter.textContent = t('match.upgrade.counter', { total, current: currentChoice, remaining });
      }
    }
    if (eyebrowText) eyebrowText.innerText = t('match.upgrade.bossEyebrow');
    if (headerSub) headerSub.innerText = t('match.upgrade.bossSub');
  } else {
    if (bossBanner) bossBanner.style.display = 'none';
    if (eyebrowText) eyebrowText.innerText = t('match.upgrade.eyebrow');
    if (headerSub) {
      if (pendingLevelUps > 1) {
        headerSub.textContent = t('match.upgrade.sub') + ' • ' + t('match.upgrade.blessings', { count: pendingLevelUps });
      } else {
        headerSub.innerText = t('match.upgrade.sub');
      }
    }
  }
  updateAllAutoFit();
}

function resolveCardCategory(opt) {
  return opt.category || 'PASSIVE';
}

function selectCardIndex(idx) {
  if (idx < 0 || idx >= currentOptions.length) return;
  const opt = currentOptions[idx];
  playSfx('card_select');
  opt.apply();
  pendingLevelUps--;

  if (bossRewardContext) {
    bossRewardContext.chosenCount++;
  }

  if (pendingLevelUps > 0) {
    updateUpgradeModalHeader();
    renderUpgradeCards();
  } else {
    closeLevelUpModal();
  }
}

function closeLevelUpModal() {
  const modal = document.getElementById('upgrade-modal');
  const gameCanvas = document.getElementById('game-canvas');

  if (levelupKeydownHandler) {
    window.removeEventListener('keydown', levelupKeydownHandler);
    levelupKeydownHandler = null;
  }

  pendingLevelUps = 0;
  bossRewardContext = null;
  updateUpgradeModalHeader();

  if (modal) {
    modal.classList.remove('active');
    modal.classList.add('closing');
  }

  setTimeout(() => {
    if (modal) {
      modal.classList.remove('closing');
      modal.style.display = 'none';
    }
    if (gameCanvas) {
      gameCanvas.classList.remove('canvas-levelup-frozen');
    }
    gameState.isPaused = false;
    setLastTime(performance.now());
    restoreKeyboardMovement();
    import('../../main.js').then(module => {
      if (module.setPostScreenSlowMoTimer) {
        module.setPostScreenSlowMoTimer(18); // 300ms = 18 frames
      }
    });
  }, 200);
}

function setupLevelupKeyboard() {
  if (levelupKeydownHandler) return;

  levelupKeydownHandler = (e) => {
    if (e.repeat) return;
    const modal = document.getElementById('upgrade-modal');
    if (!modal || modal.style.display === 'none') return;

    if (e.key === '1' || e.code === 'Digit1') {
      e.preventDefault();
      selectCardIndex(0);
    } else if (e.key === '2' || e.code === 'Digit2') {
      e.preventDefault();
      selectCardIndex(1);
    } else if (e.key === '3' || e.code === 'Digit3') {
      e.preventDefault();
      selectCardIndex(2);
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      const rerollBtn = document.getElementById('reroll-btn');
      if (rerollBtn && rerollBtn.style.display !== 'none' && player.rerolls > 0) {
        rerollBtn.click();
      }
    } else if (e.code === 'Escape' || e.code === 'KeyP') {
      e.preventDefault();
    }
  };

  window.addEventListener('keydown', levelupKeydownHandler);
}

export function renderUpgradeCards({ preserveOptions = false } = {}) {
  const modal = document.getElementById('upgrade-modal');
  const container = document.getElementById('upgrade-list');
  if (!container || !modal) return;
  container.innerHTML = '';
  // Recalcula também quando fontes, banner ou cartas alteram a altura natural.
  const stage = modal.querySelector('.levelup-intrinsic-stage');
  if (stage && !upgradeResizeObserver && typeof ResizeObserver !== 'undefined') {
    upgradeResizeObserver = new ResizeObserver(() => updateAllAutoFit());
    upgradeResizeObserver.observe(stage);
  }

  if (!preserveOptions) currentOptions = getRandomUpgrades(3, { allowDestiny: true });

  let durationNote = document.getElementById('upgrade-duration-note');
  if (!durationNote) {
    durationNote = document.createElement('p');
    durationNote.id = 'upgrade-duration-note';
    durationNote.className = 'upgrade-duration-note';
    container.insertAdjacentElement('afterend', durationNote);
  }
  durationNote.textContent = t('cards.duration');

  currentOptions.forEach((opt, index) => {
    const card = document.createElement('div');
    card.className = `upgrade-card-pro ${opt.rarity}`;

    const iconSvg = UPGRADE_ICONS[opt.id] || `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#ffd166"/></svg>`;
    const isSynergy = isSynergyIngredient(opt.id);
    const isDestiny = !!opt.isDestinyCard;
    const category = isDestiny ? 'PACT' : resolveCardCategory(opt);
    const hotkeyNum = index + 1;
    const presentation = opt.getPresentation();
    const effectRows = kind => presentation.effects.filter(effect => !kind || effect.kind === kind)
      .map(effect => `<div class="card-effect-row">${escapeHtml(effect.text)}</div>`).join('');

    const categoryIcon = isDestiny ? 'pact' : (category === 'WEAPON' ? 'sword' : (category === 'UTILITY' ? 'heal' : 'aura'));
    const categoryColor = isDestiny ? '#c084fc' : '#94a3b8';

    card.innerHTML = `
      <div class="card-header-bar">
        <span class="card-category-tag" style="${isDestiny ? 'border-color: rgba(192, 132, 252, 0.5); color: #d8b4fe;' : ''}">
          ${renderIcon(categoryIcon, { size: 10, color: categoryColor })}
          ${htmlT(`content.categories.${category}`)}
        </span>
        ${isSynergy ? `<span class="synergy-indicator-tag">${renderIcon('sparkle', { size: 10, color: '#ffd166' })} ${htmlT('content.fusionIngredient')}</span>` : ''}
        ${isDestiny ? `<span class="synergy-indicator-tag" style="border-color: rgba(192, 132, 252, 0.6); color: #e9d5ff; background: rgba(147, 51, 234, 0.25);">${renderIcon('pact', { size: 10, color: '#c084fc' })} ${htmlT('content.cursedPact')}</span>` : ''}
        <span class="card-hotkey-badge">[ ${hotkeyNum} ]</span>
      </div>

      <div class="card-icon-pedestal">
        <div class="pedestal-ring-outer"></div>
        <div class="pedestal-core">
          ${iconSvg}
        </div>
      </div>

      <div class="card-title-group">
        <div class="card-title-main">${opt.title}</div>
        <div class="card-rarity-badge-mini">${opt.badge}</div>
      </div>

      <div class="card-desc-text">${opt.desc}</div>

      ${isDestiny 
        ? `<div class="card-tradeoff-group">
             <div class="card-stat-pill stat-bonus"><strong class="card-effect-label">${htmlT('cards.benefit')}</strong>${effectRows('bonus')}</div>
             <div class="card-stat-pill stat-penalty"><strong class="card-effect-label">${htmlT('cards.penalty')}</strong>${effectRows('penalty')}</div>
           </div>`
        : `<div class="card-stat-pill">${effectRows()}</div>`
      }
      ${presentation.progress ? `<div class="card-progress-text">${escapeHtml(presentation.progress)}</div>` : ''}
    `;

    card.onmouseenter = () => {
      playSfx('card_hover');
    };

    card.onclick = () => {
      selectCardIndex(index);
    };

    container.appendChild(card);
  });

  const rerollBtn = document.getElementById('reroll-btn');
  const rerollCount = document.getElementById('reroll-count');
  if (rerollBtn && rerollCount) {
    if (player.rerolls > 0) {
      rerollCount.innerText = player.rerolls;
      rerollBtn.style.display = 'inline-flex';
      rerollBtn.onclick = () => {
        player.rerolls--;
        playSfx('level');
        updateUpgradeModalHeader();
        renderUpgradeCards();
      };
    } else {
      rerollBtn.style.display = 'none';
    }
  }

  setupLevelupKeyboard();
  updateAllAutoFit();
}

export function levelUp() {
  pendingLevelUps++;
  if (bossRewardContext) {
    bossRewardContext.totalCount++;
  }

  const upgradeModal = document.getElementById('upgrade-modal');
  if (upgradeModal && upgradeModal.style.display === 'flex') {
    updateUpgradeModalHeader();
    return;
  }

  // Bloqueio de Pop-Up: Se o herói estiver em ULT (Sir Roland, Ignis) ou canalizando, adia a apresentação
  if (isHeroInUninterruptibleState()) {
    playSfx('gem');
    const xpFill = document.getElementById('xp-fill');
    if (xpFill) {
      xpFill.classList.add('xp-queued-pulse');
      setTimeout(() => xpFill.classList.remove('xp-queued-pulse'), 600);
    }
    return;
  }

  presentDeferredLevelUpModal();
}

export function presentDeferredLevelUpModal() {
  if (pendingLevelUps <= 0) return;

  const upgradeModal = document.getElementById('upgrade-modal');
  const gameCanvas = document.getElementById('game-canvas');

  if (upgradeModal && upgradeModal.style.display === 'flex') {
    updateUpgradeModalHeader();
    return;
  }

  playSfx('level');
  gameState.isPaused = true;
  resetInputSoft();

  if (!activeBoss) {
    const bossHud = document.getElementById('boss-hud');
    if (bossHud) bossHud.style.display = 'none';
  }

  if (gameCanvas) {
    gameCanvas.classList.add('canvas-levelup-frozen');
  }

  updateUpgradeModalHeader();
  renderUpgradeCards();

  if (upgradeModal) {
    upgradeModal.classList.remove('closing', 'modal-hidden');
    upgradeModal.classList.add('active');
    upgradeModal.style.removeProperty('display');
    upgradeModal.style.display = 'flex';
    updateAllAutoFit();
    setTimeout(updateAllAutoFit, 30);
  }
}

export function isUpgradeModalOpen() {
  const modal = document.getElementById('upgrade-modal');
  return !!(modal && (modal.classList.contains('active') || modal.classList.contains('closing') || modal.style.display === 'flex' || (modal.style.display !== 'none' && !modal.classList.contains('modal-hidden'))));
}

/**
 * Enfileira N níveis para seleção manual carta a carta pelo player no Tarô Arcano (Console Dev).
 * @param {number} count Quantidade de níveis a enfileirar (1 a 100).
 */
export function queueManualLevelUps(count = 1) {
  const levels = Math.max(1, Math.min(100, Math.floor(count)));
  pendingLevelUps += levels;
  player.level += levels;
  player.nextXp = getNextLevelXp(player.level);
  player.xp = 0;
  player.hp = player.maxHp;

  updateUpgradeModalHeader();
  presentDeferredLevelUpModal();
}

/**
 * Aplica automaticamente todas as bênçãos restantes na fila de upgrades e fecha o Tarô.
 * Utilizado pelo botão de conveniência quando o jogador não deseja escolher todas manualmente.
 */
export function autoCompleteRemainingLevelUps() {
  if (pendingLevelUps <= 0) return;
  const count = pendingLevelUps;
  pendingLevelUps = 0;

  for (let i = 0; i < count; i++) {
    const synergies = checkSynergies();
    if (synergies && synergies.length > 0) {
      synergies[0].apply();
    }
    const available = upgradesPool.filter(opt => opt.isAvailable());
    if (available.length > 0) {
      const randIdx = Math.floor(Math.random() * available.length);
      available[randIdx].apply();
    } else {
      BLESSING_UPGRADE.apply();
    }
  }

  const finalSynergies = checkSynergies();
  if (finalSynergies && finalSynergies.length > 0) {
    finalSynergies.forEach(syn => syn.apply());
  }

  player.hp = player.maxHp;
  playSfx('level');
  closeLevelUpModal();
}

