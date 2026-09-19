/**
 * src/ui/modals/characterSelectModal.js
 * Altar de Invocação dos Heróis Arcanos: Seleção, Showcase Tático Bento, Prévia 3D/2D Canvas e Gestos Touch.
 */
import { CHARACTERS } from '../../config/characters.js';
import { 
  HERO_UNLOCK_MAP, 
  isHeroUnlocked, 
  getAchievementStatus 
} from '../../config/achievements.js';
import { 
  startPreview, 
  stopPreview, 
  resizePreviewCanvas,
  setPreviewHero, 
  togglePreviewFacing, 
  setPreviewPose 
} from '../../render/characterPreview.js';
import { 
  playSfx, 
  triggerHaptic, 
  resetDeathAudioFilter 
} from '../../core/audio.js';
import { 
  selectedHeroKey,
  setSelectedHeroKey, 
  getPersistentGold 
} from '../../entities/player.js';
import { layoutMetrics } from '../../core/responsive.js';
import { gameState, resetGame, terminateMatch } from '../../main.js';
import { renderIcon, WEAPON_ICONS } from '../icons.js';
import { closeDeathModal } from './gameOverModal.js';

// Brasões Heráldicos Vetoriais e Perfis dos Campeões (Centralizados em heroProfiles.js)
export { HERO_EMBLEMS_SVG, CHARACTER_PROFILES } from '../../config/heroProfiles.js';
import { HERO_EMBLEMS_SVG, CHARACTER_PROFILES } from '../../config/heroProfiles.js';

export let activeShowcaseHeroKey = 'KNIGHT';
let activeMobileTab = 'skills'; // 'skills' | 'stats'

export function isMobileScreen() {
  return layoutMetrics.isCompactWidth || 
         layoutMetrics.isCompactHeight || 
         window.innerWidth <= 768 || 
         ('ontouchstart' in window && window.innerWidth <= 950) || 
         /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
}

export function closeCharSelectModal() {
  stopPreview();
  const charModal = document.getElementById('char-modal');
  if (charModal) {
    charModal.classList.add('modal-hidden');
    charModal.style.setProperty('display', 'none', 'important');
    charModal.style.display = 'none';
  }
}

export function openCharacterSelect() {
  if (gameState.isInMatch) {
    terminateMatch();
  }
  gameState.isPaused = false;
  resetDeathAudioFilter();
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

  // Detecção e aplicação de classe mobile para layout responsivo exclusivo
  const isMobile = isMobileScreen();
  charModal.classList.toggle('is-mobile-device', isMobile);

  // Atualizar contador de Almas no cabeçalho
  const soulsVal = document.getElementById('char-souls-val');
  if (soulsVal) {
    soulsVal.innerText = getPersistentGold();
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

  function selectAdjacentHero(step) {
    const curIdx = heroKeys.indexOf(activeShowcaseHeroKey);
    const nextIdx = (curIdx + step + heroKeys.length) % heroKeys.length;
    try { playSfx('card_hover'); } catch(e) {}
    triggerHaptic('light');
    renderShowcase(heroKeys[nextIdx]);

    // Rola suavemente o botão de pedestal ativo para o centro no carrossel mobile
    const activeBtn = pedestalsContainer.querySelector(`[data-hero="${heroKeys[nextIdx]}"]`);
    if (activeBtn && activeBtn.scrollIntoView) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function renderShowcase(heroKey) {
    activeShowcaseHeroKey = heroKey;
    const char = CHARACTERS[heroKey] || CHARACTERS.KNIGHT;
    const profile = CHARACTER_PROFILES[heroKey] || CHARACTER_PROFILES.KNIGHT;
    const unlocked = isHeroUnlocked(heroKey);
    const achId = HERO_UNLOCK_MAP[heroKey];
    const status = achId ? getAchievementStatus(achId) : null;

    setPreviewHero(heroKey);

    const badge = document.getElementById('stage-archetype-badge');
    if (badge) {
      badge.innerHTML = `${char.title.toUpperCase()} ${!unlocked ? renderIcon('lock', { size: 10, color: '#ff7675', style: 'margin-left:4px; vertical-align:middle; display:inline-block;' }) : ''}`;
      badge.style.color = unlocked ? profile.themeColor : '#747d8c';
      badge.style.borderColor = unlocked ? `${profile.themeColor}aa` : '#4b5563';
      badge.style.boxShadow = unlocked ? `0 0 18px ${profile.themeColor}66` : 'none';
    }

    showcaseContainer.style.setProperty('--showcase-color', unlocked ? profile.themeColor : '#747d8c');
    charModal.style.setProperty('--showcase-color', unlocked ? profile.themeColor : '#747d8c');

    const diff = char.difficulty || 1;
    let diffDots = '';
    for (let d = 1; d <= 3; d++) {
      diffDots += `<span class="diff-dot ${d <= diff ? 'filled' : 'empty'}">◆</span>`;
    }
    const diffLabel = diff === 1 ? 'Iniciante' : (diff === 2 ? 'Equilibrado' : 'Avançado');

    showcaseContainer.innerHTML = `
      <div class="showcase-header-v2">
        <div class="showcase-title-row">
          <div class="showcase-archetype-pill" style="color: ${profile.themeColor}; border-color: ${profile.themeColor};">
            ${char.title}
          </div>
          <div class="showcase-diff-badge" title="Dificuldade do Herói">
            <span class="diff-label">${diffLabel}</span>
            <span class="diff-dots">${diffDots}</span>
          </div>
        </div>

        <div class="showcase-name-v2">${char.name}</div>
        <div class="showcase-role-tag">Função: <b>${char.role || 'Guerreiro'}</b></div>
      </div>

      ${!unlocked && status ? `
        <div class="showcase-lock-dossier">
          <div class="lock-dossier-header">
            <span class="lock-icon-lg">${renderIcon('lock', { size: 16, color: '#ff7675' })}</span>
            <div class="lock-titles">
              <span class="lock-eyebrow">SELO PRIMORDIAL • REQUISITO DE DESBLOQUEIO</span>
              <div class="lock-name">${status.title}</div>
            </div>
          </div>
          <div class="lock-desc">${status.desc}</div>
          <div class="lock-progress-box">
            <div class="lock-progress-track">
              <div class="lock-progress-fill" style="width: ${status.percent}%;"></div>
            </div>
            <div class="lock-progress-meta">
              <span class="lock-cur-val">Progresso: <b>${status.label}</b></span>
              <span class="lock-pct-val">${status.percent}%</span>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Navegador Tático Mobile Exclusivo -->
      <div class="showcase-mobile-nav">
        <button class="showcase-tab-btn ${activeMobileTab === 'skills' ? 'active' : ''}" data-tab="skills">
          ${renderIcon('sword', { size: 11, color: activeMobileTab === 'skills' ? profile.themeColor : '#8c94a8' })} COMBATE
        </button>
        <button class="showcase-tab-btn ${activeMobileTab === 'stats' ? 'active' : ''}" data-tab="stats">
          ${renderIcon('armor', { size: 11, color: activeMobileTab === 'stats' ? profile.themeColor : '#8c94a8' })} BIOGRAFIA & LORE
        </button>
      </div>

      <!-- Bento Box Tático Responsivo -->
      <div class="bento-tactical-grid" data-active-tab="${activeMobileTab}">
        <!-- Bloco 1: Arsenal & Habilidades -->
        <div class="bento-tab-pane bento-pane-skills ${activeMobileTab === 'skills' ? 'tab-visible' : ''}">
          <!-- Card 1: Arma Inicial -->
          <div class="bento-card bento-card-weapon">
            <div class="bento-card-top">
              <span class="bento-type-tag">${renderIcon(WEAPON_ICONS[char.startingWeapon] || 'sword', { size: 10, color: profile.themeColor })} ARMA INICIAL</span>
              <span class="bento-spec-badge" style="color: ${profile.themeColor}; border-color: ${profile.themeColor}55;">${char.weapon?.type || profile.weaponName}</span>
            </div>
            <div class="bento-card-title" style="color: ${profile.themeColor};">${char.weapon?.name || profile.weaponName}</div>
            <div class="bento-card-desc">${char.weapon?.desc || ''}</div>
          </div>

          <!-- Card 2: Poder Ancestral -->
          <div class="bento-card bento-card-skill">
            <div class="bento-card-top">
              <span class="bento-type-tag">${renderIcon('damage', { size: 10, color: profile.themeColor })} PODER ANCESTRAL</span>
              <span class="bento-spec-badge bento-cd-badge">${renderIcon('timer', { size: 9 })} ${char.skill?.cooldown || '7s'}</span>
            </div>
            <div class="bento-card-title" style="color: ${profile.themeColor};">${char.skill?.name || 'Habilidade'}</div>
            <div class="bento-card-desc">${char.skill?.desc || ''}</div>
          </div>

          <!-- Card 3: Bênção Passiva -->
          <div class="bento-card bento-card-passive" style="border-color: ${profile.themeColor}35;">
            <div class="bento-card-top">
              <span class="bento-type-tag">${renderIcon('armor', { size: 10, color: profile.themeColor })} BÊNÇÃO PASSIVA</span>
              <span class="bento-inline-title" style="color: ${profile.themeColor};">${char.passive?.name || 'Aura'}</span>
            </div>
            <div class="bento-card-desc">${char.passive?.desc || ''}</div>
          </div>

          <!-- Card 4 (Mobile Unificado): Medidores Rápidos de Atributos -->
          <div class="bento-mobile-stats-row">
            <div class="bento-stats-container bento-stats-compact">
              <div class="bento-attr-item" data-stat="dano"><span>DANO</span>${renderSegments(profile.levels.dano)}</div>
              <div class="bento-attr-item" data-stat="area"><span>ÁREA</span>${renderSegments(profile.levels.area)}</div>
              <div class="bento-attr-item" data-stat="vel"><span>VEL</span>${renderSegments(profile.levels.vel)}</div>
              <div class="bento-attr-item" data-stat="res"><span>RES</span>${renderSegments(profile.levels.res)}</div>
            </div>
          </div>
        </div>

        <!-- Bloco 2: Atributos & Biometria -->
        <div class="bento-tab-pane bento-pane-stats ${activeMobileTab === 'stats' ? 'tab-visible' : ''}">
          <div class="bento-stats-container">
            <div class="bento-attr-item" data-stat="dano"><span>DANO</span>${renderSegments(profile.levels.dano)}</div>
            <div class="bento-attr-item" data-stat="area"><span>ÁREA</span>${renderSegments(profile.levels.area)}</div>
            <div class="bento-attr-item" data-stat="vel"><span>VEL</span>${renderSegments(profile.levels.vel)}</div>
            <div class="bento-attr-item" data-stat="res"><span>RES</span>${renderSegments(profile.levels.res)}</div>
          </div>

          <!-- Citação de Lore Imersiva -->
          <div class="showcase-lore-quote">
            “${char.lore || ''}”
          </div>
        </div>
      </div>

      ${unlocked ? `
        <button class="card-btn btn-summon-hero" id="confirm-hero-btn">
          ${renderIcon('damage', { size: 13, style: 'margin-right:6px;' })} DESPERTAR NO VÁCUO ${renderIcon('damage', { size: 13, style: 'margin-left:6px;' })}
        </button>
      ` : `
        <button class="card-btn btn-summon-hero btn-hero-locked" id="confirm-hero-btn" disabled style="background: #231620; border-color: #ff767555; color: #ff7675; cursor: not-allowed; opacity: 0.9;">
          ${renderIcon('lock', { size: 12, color: '#ff7675', style: 'margin-right:6px; flex-shrink:0;' })} SELO PRIMORDIAL ATIVO (CUMPRA O REQUISITO)
        </button>
      `}
    `;

    // Eventos das Abas Mobile
    const tabBtns = showcaseContainer.querySelectorAll('.showcase-tab-btn');
    tabBtns.forEach(tBtn => {
      tBtn.onclick = () => {
        activeMobileTab = tBtn.getAttribute('data-tab');
        try { playSfx('card_hover'); } catch(e) {}
        triggerHaptic('light');
        renderShowcase(heroKey);
      };
    });

    const confirmBtn = document.getElementById('confirm-hero-btn');
    if (confirmBtn) {
      if (unlocked) {
        confirmBtn.style.setProperty('--btn-theme-color', profile.themeColor);
        confirmBtn.onclick = () => {
          setSelectedHeroKey(heroKey);
          closeCharSelectModal();
          resetGame();
          try { playSfx('warp'); } catch(e) {}
        };
      } else {
        confirmBtn.onclick = null;
      }
    }

    // Atualiza classes ativas nos botões de pedestal
    const btns = pedestalsContainer.querySelectorAll('.char-pedestal-btn');
    btns.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-hero') === heroKey);
    });
  }

  pedestalsContainer.innerHTML = '';
  heroKeys.forEach(key => {
    const c = CHARACTERS[key];
    const profile = CHARACTER_PROFILES[key] || CHARACTER_PROFILES.KNIGHT;
    const diff = c.difficulty || 1;
    let miniDots = '◆'.repeat(diff) + '◇'.repeat(3 - diff);
    const unlocked = isHeroUnlocked(key);

    const btn = document.createElement('div');
    btn.className = `char-pedestal-btn ${key === activeShowcaseHeroKey ? 'active' : ''} ${!unlocked ? 'hero-locked' : ''}`;
    btn.setAttribute('data-hero', key);
    btn.setAttribute('title', `${c.name} (${c.title})${!unlocked ? ' • Bloqueado' : ''}`);
    btn.style.setProperty('--btn-theme-color', unlocked ? profile.themeColor : '#57606f');
    btn.innerHTML = `
      <div class="char-pedestal-emblem" style="border-color: ${unlocked ? profile.themeColor : '#4b5563'}; color: ${unlocked ? profile.themeColor : '#6b7280'}; position: relative;">
        ${profile.emblemSvg}
        ${!unlocked ? `<div class="pedestal-lock-badge">${renderIcon('lock', { size: 10, color: '#ff7675' })}</div>` : ''}
      </div>
      <div class="char-pedestal-info">
        <div class="char-pedestal-title" style="color: ${unlocked ? profile.themeColor : '#9ca3af'};">${c.title}</div>
        <div class="char-pedestal-name" style="${!unlocked ? 'color: #9ca3af;' : ''}">${c.name}</div>
        <div class="char-pedestal-role-mini">
          ${unlocked 
            ? `${c.role || ''} · <span class="mini-diff" style="color: ${profile.themeColor};">${miniDots}</span>` 
            : `<span class="pedestal-locked-label" style="color: #ff7675; font-weight: 700; font-size: 10px; display: inline-flex; align-items: center; gap: 3px;">${renderIcon('lock', { size: 9, color: '#ff7675' })} BLOQUEADO</span>`
          }
        </div>
      </div>
      <div class="pedestal-active-glow" style="background: ${unlocked ? profile.themeColor : '#ff7675'}; box-shadow: 0 0 12px ${unlocked ? profile.themeColor : '#ff7675'};"></div>
    `;

    btn.onclick = () => {
      try { playSfx('card_hover'); } catch(e) {}
      triggerHaptic('light');
      renderShowcase(key);
      if (btn.scrollIntoView) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    };

    pedestalsContainer.appendChild(btn);
  });

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
    };
  });

  renderShowcase(activeShowcaseHeroKey);
  charModal.style.display = 'flex';

  // Sincronização garantida de layout e canvas pós-exibição do modal
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      resizePreviewCanvas();
    });
  }
  setTimeout(() => {
    resizePreviewCanvas();
  }, 50);

  // Iniciar loop de animação da prévia em canvas
  startPreview(activeShowcaseHeroKey);
}
