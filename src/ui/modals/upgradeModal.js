/**
 * src/ui/modals/upgradeModal.js
 * Renderizador de Cartas de Tarô Arcano de Poder (Level-up & Bênçãos de Chefes).
 * Design System: Neo-Arcane / Void Astral (Paridade com Pause & Morte)
 */
import { player, isHeroInUninterruptibleState } from '../../entities/player.js';
import { checkIsSynergyIngredient } from '../../config/items.js';
import { getRandomUpgrades } from '../../config/upgrades.js';
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
    heroLvlBadge.innerText = `NV ${player.level || 1}`;
  }

  if (queueChip && queueCount) {
    if (pendingLevelUps > 1) {
      queueChip.style.display = 'inline-flex';
      queueCount.innerText = `${pendingLevelUps} Bênçãos`;
    } else {
      queueChip.style.display = 'none';
    }
  }

  if (bossRewardContext && bossRewardContext.totalCount > 0) {
    if (bossBanner) {
      bossBanner.style.display = 'flex';
      if (bossTitle) bossTitle.innerText = `VITÓRIA CONTRA ${bossRewardContext.bossName.toUpperCase()}!`;
      if (bossCounter) {
        const currentChoice = bossRewardContext.chosenCount + 1;
        const total = Math.max(bossRewardContext.totalCount, bossRewardContext.chosenCount + pendingLevelUps);
        const remaining = Math.max(0, pendingLevelUps - 1);
        bossCounter.innerHTML = `<span style="color:#ffd166; font-weight:800;">+${total} UPGRADES CONQUISTADOS</span> &bull; Escolhendo Bênção <b>${currentChoice} de ${total}</b>${remaining > 0 ? ` (${remaining} restante${remaining > 1 ? 's' : ''})` : ' (Última Bênção)'}`;
      }
    }
    if (eyebrowText) eyebrowText.innerText = "COLOSSO SUPREMO DERROTADO • DÁDIVA ARCANO";
    if (headerSub) headerSub.innerText = "Recompensa mística concedida pela aniquilação do soberano";
  } else {
    if (bossBanner) bossBanner.style.display = 'none';
    if (eyebrowText) eyebrowText.innerText = "TRANSCENDÊNCIA DE NÍVEL • TARÔ ARCANO";
    if (headerSub) {
      if (pendingLevelUps > 1) {
        headerSub.innerHTML = `Invoque uma bênção arcana para remodelar o combate &bull; <b style="color:#ffd166;">${pendingLevelUps} bênçãos na fila</b>`;
      } else {
        headerSub.innerText = "Invoque uma bênção arcana para remodelar o combate";
      }
    }
  }
  updateAllAutoFit();
}

function resolveCardCategory(opt) {
  const badgeLower = (opt.badge || '').toLowerCase();
  if (badgeLower.includes('machado') || badgeLower.includes('poção') || badgeLower.includes('cajado') || badgeLower.includes('espada') || badgeLower.includes('martelo') || badgeLower.includes('arma')) {
    return 'ARMA';
  }
  if (badgeLower.includes('recompensa') || badgeLower.includes('fortuna') || badgeLower.includes('cura') || badgeLower.includes('utilidade')) {
    return 'UTILIDADE';
  }
  return 'PASSIVA';
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

export function renderUpgradeCards() {
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

  currentOptions = getRandomUpgrades(3, { allowDestiny: true });

  currentOptions.forEach((opt, index) => {
    const card = document.createElement('div');
    card.className = `upgrade-card-pro ${opt.rarity}`;

    const iconSvg = UPGRADE_ICONS[opt.id] || `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#ffd166"/></svg>`;
    const isSynergy = isSynergyIngredient(opt.id);
    const isDestiny = !!opt.isDestinyCard;
    const category = isDestiny ? 'PACTO' : resolveCardCategory(opt);
    const hotkeyNum = index + 1;

    const categoryIcon = isDestiny ? 'pact' : (category === 'ARMA' ? 'sword' : (category === 'UTILIDADE' ? 'heal' : 'aura'));
    const categoryColor = isDestiny ? '#c084fc' : '#94a3b8';

    card.innerHTML = `
      <div class="card-header-bar">
        <span class="card-category-tag" style="${isDestiny ? 'border-color: rgba(192, 132, 252, 0.5); color: #d8b4fe;' : ''}">
          ${renderIcon(categoryIcon, { size: 10, color: categoryColor })}
          ${category}
        </span>
        <span class="card-hotkey-badge">[ ${hotkeyNum} ]</span>
      </div>

      ${isSynergy ? `<div class="synergy-indicator-tag">${renderIcon('sparkle', { size: 10, color: '#ffd166' })} PEÇA DE FUSÃO</div>` : ''}
      ${isDestiny ? `<div class="synergy-indicator-tag" style="border-color: rgba(192, 132, 252, 0.6); color: #e9d5ff; background: rgba(147, 51, 234, 0.25);">${renderIcon('pact', { size: 10, color: '#c084fc' })} PACTO AMALDIÇOADO</div>` : ''}

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
             <div class="card-stat-pill stat-bonus">▲ ${opt.bonusText}</div>
             <div class="card-stat-pill stat-penalty">▼ ${opt.penaltyText}</div>
           </div>`
        : `<div class="card-stat-pill">${typeof opt.getStat === 'function' ? opt.getStat() : opt.stat}</div>`
      }
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
