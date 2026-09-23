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
import { getHordeArenaTheme } from '../../systems/waves.js';
import { onAltarChestCollected } from '../../systems/worldEvents.js';

let chestKeydownHandler = null;

export function openChestModal(tier = 'BOSS') {
  playSfx('chest_fanfare');
  gameState.isPaused = true;
  resetInputSoft();

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

  // 2. Títulos e Contexto da Derrota do Algoz
  if (eyebrowElem) {
    eyebrowElem.innerText = isAltar
      ? "DESAFIO DE SANGUE CONCLUÍDO • DÁDIVA SUPREMA"
      : (isMini 
        ? "ABERRAÇÃO EXPURGADA • RELICÁRIO ESPECTRAL" 
        : "COLOSSO ANIQUILADO • DÁDIVA DO DESTINO");
  }

  if (titleElem) {
    titleElem.innerText = isAltar
      ? "BAÚ LENDÁRIO DO ALTAR"
      : (isMini ? "RELICÁRIO DE SAFIRA" : "SARCÓFAGO DO SOBERANO");
  }

  if (subElem) {
    subElem.innerText = isAltar
      ? "A horda rubra sucumbiu ao seu ritual. As dádivas ancestrais do sangue foram reveladas:"
      : (isMini 
        ? "Campeão de elite abatido. Relíquias arcanas desvendadas:" 
        : "A arena foi purificada. Recompensas lendárias concedidas:");
  }

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
        title: evo.name,
        desc: evo.desc,
        stat: "PODER MÁXIMO • TRANSCENDÊNCIA",
        badge: "Evolução Suprema",
        iconSvg: UPGRADE_ICONS[evo.id] || `<svg viewBox="0 0 24 24"><polygon points="12,1 15,9 23,12 15,15 12,23 9,15 1,12 9,9" fill="#ff3838"/></svg>`,
        apply: () => evo.apply()
      });
    }

    // 2. Upgrades adicionais (Cartas de Pacto nunca aparecem em baús)
    const upgrades = getRandomChestUpgrades(2);
    upgrades.filter(u => !u.isDestinyCard).forEach(u => {
      pendingRewards.push({
        isLegendary: false,
        title: u.title,
        desc: u.desc,
        stat: typeof u.getStat === 'function' ? u.getStat() : u.stat,
        badge: u.badge || "Aprimoramento",
        iconSvg: UPGRADE_ICONS[u.id] || `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#ff3838"/></svg>`,
        apply: () => u.apply()
      });
    });

    // 3. Tributo de Sangue Garantido (Cura Vital + Ouro Persistente)
    pendingRewards.push({
      isLegendary: true,
      title: "Tributo do Sangue Ancestral",
      desc: "O altar consagra sua vitória: restaura sua vida ao máximo e concede almas persistentes.",
      stat: "Vida Total & +40 Ouro",
      badge: "Dádiva de Sangue",
      iconSvg: REWARD_ICONS.blood_tribute,
      apply: () => {
        player.hp = player.maxHp;
        addPersistentGold(40);
      }
    });
  } else if (isMini) {
    const upgradeCount = Math.random() < 0.25 ? 2 : 1;
    const upgrades = getRandomChestUpgrades(upgradeCount);
    upgrades.filter(u => !u.isDestinyCard).forEach(u => {
      pendingRewards.push({
        isLegendary: false,
        title: u.title,
        desc: u.desc,
        stat: typeof u.getStat === 'function' ? u.getStat() : u.stat,
        badge: u.badge || "Aprimoramento",
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
        title: evo.name,
        desc: evo.desc,
        stat: "PODER MÁXIMO • TRANSCENDÊNCIA",
        badge: "Evolução Suprema",
        iconSvg: UPGRADE_ICONS[evo.id] || `<svg viewBox="0 0 24 24"><polygon points="12,1 15,9 23,12 15,15 12,23 9,15 1,12 9,9" fill="#ffd166"/></svg>`,
        apply: () => evo.apply()
      });
    }

    const upgrades = getRandomChestUpgrades(2);
    upgrades.filter(u => !u.isDestinyCard).forEach(u => {
      pendingRewards.push({
        isLegendary: false,
        title: u.title,
        desc: u.desc,
        stat: typeof u.getStat === 'function' ? u.getStat() : u.stat,
        badge: u.badge || "Aprimoramento",
        iconSvg: UPGRADE_ICONS[u.id] || `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#ffd166"/></svg>`,
        apply: () => u.apply()
      });
    });
  }

  // Fallback se tudo estiver no nível máximo
  if (pendingRewards.length === 0) {
    pendingRewards.push({
      isLegendary: false,
      title: "Bênção da Fortuna",
      desc: "Todos os poderes conhecidos atingiram o apogeu! Recupera vitalidade e concede ouro da arena.",
      stat: "+100 HP & +25 Ouro",
      badge: "Fortuna",
      iconSvg: UPGRADE_ICONS.blessing,
      apply: () => {
        player.hp = Math.min(player.maxHp, player.hp + 100);
        addPersistentGold(25);
      }
    });
  }

  // Bônus de Transmutação Cósmica
  if (player && player.doubleChestChance > 0 && Math.random() < player.doubleChestChance) {
    if (subElem) {
      subElem.innerHTML += ` <span style="color:#ffd166; font-weight:800;">${renderIcon('transmute', { size: 12, color: '#ffd166' })} TRANSMUTAÇÃO CÓSMICA ATIVADA!</span>`;
    }
    const extraUpgrades = getRandomChestUpgrades(1).filter(u => !u.isDestinyCard);
    if (extraUpgrades.length > 0) {
      const u = extraUpgrades[0];
      pendingRewards.push({
        isLegendary: false,
        title: u.title,
        desc: `[Transmutação Cósmica] ${u.desc}`,
        stat: u.stat,
        badge: "Dádiva Astral",
        iconSvg: UPGRADE_ICONS[u.id] || UPGRADE_ICONS.blessing,
        apply: () => {
          u.apply();
          addPersistentGold(25);
        }
      });
    } else {
      pendingRewards.push({
        isLegendary: false,
        title: "Transmutação de Almas",
        desc: "A fenda cósmica duplicou o tesouro, vertendo essências imortais adicionais.",
        stat: "+40 Almas Persistentes",
        badge: "Dádiva Astral",
        iconSvg: REWARD_ICONS.soul_transmutation,
        apply: () => {
          addPersistentGold(40);
        }
      });
    }
  }

  // 4. Criar cartas no estado latente
  const cardElements = [];
  pendingRewards.forEach(r => {
    const card = document.createElement('div');
    card.className = `chest-card ${r.isLegendary ? 'legendary-card' : ''}`;
    card.innerHTML = `
      <div class="chest-card-icon">${r.iconSvg}</div>
      <div class="chest-card-info">
        ${r.isLegendary ? `<span class="legendary-pill">${renderIcon('star_evolution', { size: 10, color: '#040508' })} EVOLUÇÃO LENDÁRIA</span>` : ''}
        <div class="chest-card-title">
          <span>${r.title}</span>
          <span class="chest-card-badge">${r.badge}</span>
        </div>
        <div class="chest-card-stat">${r.stat}</div>
        <div class="chest-card-desc">${r.desc}</div>
      </div>
    `;
    list.appendChild(card);
    cardElements.push({ el: card, reward: r });
  });

  // 5. Estado de Revelação e Resgate Imediato
  let isFullyRevealed = false;
  let isClaiming = false;
  let unboxingTimeout = null;
  let revealTimeout = null;
  let currentIdx = 0;

  const doClaim = () => {
    if (isClaiming) return;
    isClaiming = true;

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

      if (!activeBoss) {
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
      if (claimText) claimText.innerText = "Equipar Poderes e Continuar";
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
    if (claimText) claimText.innerText = "Desvendando Relíquias...";
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
          if (claimText) claimText.innerText = "Equipar Poderes e Continuar";
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

