import { t, formatNumber } from '../../i18n/index.js';
/**
 * src/ui/modals/chestModal.js
 * Sequência Cinematográfica de Unboxing de Baús Arcanos (Chefe & Mini-Boss).
 * Design System: Neo-Arcane / Void Astral (Paridade com Pause & Morte)
 */
import { playSfx, triggerHaptic } from '../../core/audio.js';
import { 
  gameState, 
  resetSpawnTimer, 
  setLastTime, 
  triggerShake, 
  activeBoss, 
  frameCount, 
  setIsWavePaused 
} from '../../main.js';
import { resetInput, resetInputSoft, restoreKeyboardMovement } from '../../core/input.js';
import { getRandomUpgrades, getRandomChestUpgrades, checkSynergies } from '../../config/upgrades.js';
import { player, addPersistentGold } from '../../entities/player.js';
import { renderIcon } from '../icons.js';
import { UPGRADE_ICONS, REWARD_ICONS } from '../cardIcons.js';
import { recordRunStats } from '../../config/achievements.js';
import { transitionToArenaTheme } from '../../render/environment.js';
import { getHordeArenaTheme, onBossChestCollected } from '../../systems/waves.js';
import { onAltarChestCollected } from '../../systems/worldEvents.js';
import { updateAllAutoFit } from '../../core/responsive.js';

let chestKeydownHandler = null;
let refreshOpenChest = null;
export function refreshChestLanguage() { refreshOpenChest?.(); }


export function openChestModal(tier = 'BOSS') {
  playSfx('chest_fanfare');
  gameState.isPaused = true;
  resetInputSoft();

  if (typeof document === 'undefined') return;

  if (!activeBoss) {
    const bossHud = document.getElementById('boss-hud');
    if (bossHud) bossHud.style.display = 'none';
  }

  const modal = document.getElementById('chest-modal');
  const list = document.getElementById('chest-rewards-list');
  const claimBtn = document.getElementById('chest-claim-btn');
  const claimText = document.getElementById('chest-claim-text');
  const titleElem = document.getElementById('chest-modal-title');
  const subElem = document.getElementById('chest-modal-sub');
  const eyebrowElem = document.getElementById('chest-eyebrow-text');
  const chestBox = document.getElementById('chest-monument-box');
  const gameCanvas = document.getElementById('game-canvas');

  if (!modal || !list) return;
  list.innerHTML = '';

  const isMini = tier === 'MINI_BOSS';
  const isAltar = tier === 'LEGENDARY_ALTAR';
  if (isAltar) {
    onAltarChestCollected();
  }

  // 1. Configurar classes de tema no modal e efeitos ópticos no canvas
  modal.classList.remove('tier-miniboss', 'tier-boss', 'tier-altar', 'closing');
  modal.classList.add(isAltar ? 'tier-altar' : (isMini ? 'tier-miniboss' : 'tier-boss'));
  modal.classList.add('active');

  if (gameCanvas) {
    gameCanvas.classList.add('canvas-chest-frozen');
  }

  const renderHeadings = () => {
  // 2. Títulos e Contexto da Derrota do Algoz
  if (eyebrowElem) {
    eyebrowElem.innerText = isAltar
      ? t('match.chest.altarEyebrow')
      : (isMini 
        ? t('match.chest.miniEyebrow')
        : t('match.chest.bossEyebrow'));
  }

  if (titleElem) {
    titleElem.innerText = isAltar
      ? t('match.chest.altar')
      : (isMini ? t('match.chest.mini') : t('match.chest.boss'));
  }

  if (subElem) {
    subElem.innerText = isAltar
      ? t('match.chest.altarSub')
      : (isMini 
        ? t('match.chest.miniSub')
        : t('match.chest.bossSub'));
  }

  };
  renderHeadings();
  // 3. Preparação das recompensas
  const pendingRewards = [];

  if (isAltar) {
    // Baú Lendário do Altar de Sangue
    // 1. Prioriza Sinergia/Evolução se houver
    const syns = checkSynergies();
    if (syns.length > 0) {
      const evo = syns[0];
      pendingRewards.push({
        isLegendary: true,
        get title() { return evo.name; },
        get desc() { return evo.desc; },
        get stat() { return t('match.chest.power'); },
        get badge() { return t('match.chest.evolution'); },
        iconSvg: UPGRADE_ICONS[evo.id] || `<svg viewBox="0 0 24 24"><polygon points="12,1 15,9 23,12 15,15 12,23 9,15 1,12 9,9" fill="#ff3838"/></svg>`,
        apply: () => evo.apply()
      });
    }

    // 2. Upgrades adicionais (Cartas de Pacto nunca aparecem em baús; Frasco Vital 65% proibido no Altar)
    const upgrades = getRandomChestUpgrades(2, { excludeIds: ['heal'] });
    upgrades.filter(u => !u.isDestinyCard && u.id !== 'heal').forEach(u => {
      pendingRewards.push({
        isLegendary: false,
        get title() { return u.title; },
        get desc() { return u.desc; },
        stat: typeof u.getStat === 'function' ? u.getStat() : u.stat,
        get badge() { return u.badge || t('match.chest.upgrade'); },
        iconSvg: UPGRADE_ICONS[u.id] || `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#ff3838"/></svg>`,
        apply: () => u.apply()
      });
    });

    // 3. Tributo de Sangue Garantido (Cura Vital + Ouro Persistente)
    pendingRewards.push({
      isLegendary: true,
      get title() { return t('match.chest.tribute'); },
      get desc() { return t('match.chest.tributeDesc'); },
      get stat() { return t('match.chest.tributeStat'); },
      get badge() { return t('match.chest.bloodGift'); },
      iconSvg: REWARD_ICONS.blood_tribute,
      apply: () => {
        player.hp = player.maxHp;
        addPersistentGold(40, player.goldMultiplier ?? 1);
      }
    });
  } else if (isMini) {
    const upgradeCount = Math.random() < 0.25 ? 2 : 1;
    const upgrades = getRandomChestUpgrades(upgradeCount);
    upgrades.filter(u => !u.isDestinyCard).forEach(u => {
      pendingRewards.push({
        isLegendary: false,
        get title() { return u.title; },
        get desc() { return u.desc; },
        stat: typeof u.getStat === 'function' ? u.getStat() : u.stat,
        get badge() { return u.badge || t('match.chest.upgrade'); },
        iconSvg: UPGRADE_ICONS[u.id] || `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#00f5d4"/></svg>`,
        apply: () => u.apply()
      });
    });
  } else {
    // Baú de Chefe: Verifica se há sinergias/evoluções disponíveis
    const syns = checkSynergies();
    if (syns.length > 0) {
      const evo = syns[0];
      pendingRewards.push({
        isLegendary: true,
        get title() { return evo.name; },
        get desc() { return evo.desc; },
        get stat() { return t('match.chest.power'); },
        get badge() { return t('match.chest.evolution'); },
        iconSvg: UPGRADE_ICONS[evo.id] || `<svg viewBox="0 0 24 24"><polygon points="12,1 15,9 23,12 15,15 12,23 9,15 1,12 9,9" fill="#ffd166"/></svg>`,
        apply: () => evo.apply()
      });
    }

    const upgrades = getRandomChestUpgrades(2);
    upgrades.filter(u => !u.isDestinyCard).forEach(u => {
      pendingRewards.push({
        isLegendary: false,
        get title() { return u.title; },
        get desc() { return u.desc; },
        stat: typeof u.getStat === 'function' ? u.getStat() : u.stat,
        get badge() { return u.badge || t('match.chest.upgrade'); },
        iconSvg: UPGRADE_ICONS[u.id] || `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#ffd166"/></svg>`,
        apply: () => u.apply()
      });
    });
  }

  // Fallback se tudo estiver no nível máximo
  if (pendingRewards.length === 0) {
    pendingRewards.push({
      isLegendary: false,
      get title() { return t('match.chest.fortune'); },
      get desc() { return t('match.chest.fortuneDesc'); },
      get stat() { return t('match.chest.fortuneStat'); },
      get badge() { return t('match.chest.fortuneBadge'); },
      iconSvg: UPGRADE_ICONS.blessing,
      apply: () => {
        player.hp = Math.min(player.maxHp, player.hp + 100);
        addPersistentGold(25, player.goldMultiplier ?? 1);
      }
    });
  }

  let transmuted = false;
  // Bônus de Transmutação Cósmica
  if (player && player.doubleChestChance > 0 && Math.random() < player.doubleChestChance) {
    transmuted = true;
    if (subElem) {
      subElem.innerHTML += ` <span style="color:#ffd166; font-weight:800;">${renderIcon('transmute', { size: 12, color: '#ffd166' })} ${t('match.chest.transmute')}</span>`;
    }
    const extraUpgrades = getRandomChestUpgrades(1).filter(u => !u.isDestinyCard);
    if (extraUpgrades.length > 0) {
      const u = extraUpgrades[0];
      pendingRewards.push({
        isLegendary: false,
        get title() { return u.title; },
        get desc() { return u.desc; },
        stat: u.stat,
        get badge() { return t('match.chest.astral'); },
        iconSvg: UPGRADE_ICONS[u.id] || UPGRADE_ICONS.blessing,
        apply: () => {
          u.apply();
          addPersistentGold(25, player.goldMultiplier ?? 1);
        }
      });
    } else {
      pendingRewards.push({
        isLegendary: false,
        get title() { return t('match.chest.souls'); },
        get desc() { return t('match.chest.soulsDesc'); },
        get stat() { return t('match.chest.soulsStat'); },
        get badge() { return t('match.chest.astral'); },
        iconSvg: REWARD_ICONS.soul_transmutation,
        apply: () => {
          addPersistentGold(40, player.goldMultiplier ?? 1);
        }
      });
    }
  }

  // 4. Criar cartas no estado latente
  const cardElements = [];
  const renderCard = (card, r) => {
    card.innerHTML = `
      <div class="chest-card-icon">${r.iconSvg}</div>
      <div class="chest-card-info">
        ${r.isLegendary ? `<span class="legendary-pill">${renderIcon('star_evolution', { size: 10, color: '#040508' })} ${t('match.chest.legendary')}</span>` : ''}
        <div class="chest-card-title">
          <span>${r.title}</span>
          <span class="chest-card-badge">${r.badge}</span>
        </div>
        <div class="chest-card-stat">${r.stat}</div>
        <div class="chest-card-desc">${r.desc}</div>
      </div>
    `;
  };
  pendingRewards.forEach(r => {
    const card = document.createElement('div');
    card.className = `chest-card ${r.isLegendary ? 'legendary-card' : ''}`;
    renderCard(card, r);
    list.appendChild(card);
    cardElements.push({ el: card, reward: r });
  });

  // 5. Estado de Revelação e Resgate Imediato
  let isFullyRevealed = false;
  let isClaiming = false;
  let unboxingTimeout = null;
  let revealTimeout = null;
  let currentIdx = 0;

  refreshOpenChest = () => {
    if (!modal.classList.contains('active')) return;
    renderHeadings();
    if (transmuted && subElem) subElem.append(' ' + t('match.chest.transmute'));
    cardElements.forEach(({ el, reward }) => renderCard(el, reward));
    if (claimText) claimText.innerText = t(isFullyRevealed ? 'match.chest.claim' : 'match.chest.revealing');
    updateAllAutoFit(modal);
  };
  const doClaim = () => {
    if (isClaiming) return;
    isClaiming = true;
    refreshOpenChest = null;

    if (chestKeydownHandler) {
      window.removeEventListener('keydown', chestKeydownHandler);
      chestKeydownHandler = null;
    }

    modal.classList.remove('active');
    modal.classList.add('closing');

    setTimeout(() => {
      modal.classList.remove('closing');
      modal.style.display = 'none';

      if (gameCanvas) {
        gameCanvas.classList.remove('canvas-chest-frozen');
      }

      gameState.isPaused = false;
      setLastTime(performance.now());
      restoreKeyboardMovement();
      import('../../main.js').then(module => {
        if (module.setPostScreenSlowMoTimer) {
          module.setPostScreenSlowMoTimer(18); // 300ms = 18 frames
        }
      });

      if (!activeBoss && tier === 'BOSS') {
        onBossChestCollected(Math.floor(frameCount / 60));
        transitionToArenaTheme(getHordeArenaTheme(), 90);
        setIsWavePaused(false);
        resetSpawnTimer();
        triggerShake(8);
        playSfx('level');
      }
    }, 200);
  };

  const fastForwardReveal = () => {
    if (isFullyRevealed) return;
    if (unboxingTimeout) {
      clearTimeout(unboxingTimeout);
      unboxingTimeout = null;
    }
    if (revealTimeout) {
      clearTimeout(revealTimeout);
      revealTimeout = null;
    }

    if (chestBox) {
      chestBox.classList.remove('rumbling');
      chestBox.classList.add('opened');
    }

    for (let i = currentIdx; i < cardElements.length; i++) {
      const { el, reward } = cardElements[i];
      reward.apply();
      el.classList.add('revealed');
      if (reward.isLegendary) {
        recordRunStats({ evolution: true });
      }
    }
    currentIdx = cardElements.length;
    isFullyRevealed = true;

    recordRunStats({ chestOpened: true });
    playSfx('card_hover');
    triggerShake(isMini ? 4 : 8);

    if (claimBtn) {
      claimBtn.disabled = false;
      if (claimText) claimText.innerText = t('match.chest.claim');
      claimBtn.onclick = doClaim;
    }
  };

  // Suporte Imediato ao Teclado (0 delay): Escuta desde o primeiro milissegundo de abertura
  if (chestKeydownHandler) {
    window.removeEventListener('keydown', chestKeydownHandler);
    chestKeydownHandler = null;
  }

  chestKeydownHandler = (e) => {
    if (e.repeat) return;
    const m = document.getElementById('chest-modal');
    if (!m || m.style.display === 'none' || m.classList.contains('closing')) return;

    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
      e.preventDefault();
      if (!isFullyRevealed) {
        fastForwardReveal();
      } else {
        doClaim();
      }
    } else if (e.code === 'Escape' || e.code === 'KeyP') {
      e.preventDefault();
    }
  };
  window.addEventListener('keydown', chestKeydownHandler);

  if (claimBtn) {
    claimBtn.disabled = true;
    if (claimText) claimText.innerText = t('match.chest.revealing');
    claimBtn.onclick = () => {
      if (!isFullyRevealed) {
        fastForwardReveal();
      } else {
        doClaim();
      }
    };
  }

  // 6. Configurar animação de abertura do baú
  if (chestBox) {
    chestBox.classList.remove('opened');
    chestBox.classList.add('rumbling');
  }

  modal.style.display = 'flex';
  updateAllAutoFit(modal);

  // 7. Sequência cadenciada de Unboxing
  unboxingTimeout = setTimeout(() => {
    if (chestBox) {
      chestBox.classList.remove('rumbling');
      chestBox.classList.add('opened');
    }
    recordRunStats({ chestOpened: true });
    triggerShake(isMini ? 6 : 10);

    function revealNext() {
      if (isFullyRevealed) return;

      if (currentIdx >= cardElements.length) {
        isFullyRevealed = true;
        if (claimBtn) {
          claimBtn.disabled = false;
          if (claimText) claimText.innerText = t('match.chest.claim');
          claimBtn.onclick = doClaim;
        }
        return;
      }

      const { el, reward } = cardElements[currentIdx];
      reward.apply();
      el.classList.add('revealed');

      if (reward.isLegendary) {
        playSfx('evolution');
        triggerShake(14);
        triggerHaptic('heavy');
        recordRunStats({ evolution: true });
      } else {
        playSfx('card_hover');
      }

      currentIdx++;
      revealTimeout = setTimeout(revealNext, reward.isLegendary ? 500 : 340);
    }

    revealNext();
  }, 420);
}

export function isChestModalOpen() {
  const modal = document.getElementById('chest-modal');
  return !!(modal && (modal.classList.contains('active') || modal.classList.contains('closing') || modal.style.display === 'flex' || (modal.style.display !== 'none' && !modal.classList.contains('modal-hidden'))));
}

