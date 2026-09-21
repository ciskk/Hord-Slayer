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
  getPersistentGold
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
import { layoutMetrics, updateAllAutoFit } from '../../core/responsive.js';
import { gameState } from '../../state/gameState.js';
import { resetGame, terminateMatch } from '../../main.js';

import { renderIcon, WEAPON_ICONS } from '../icons.js';
import { closeDeathModal } from './gameOverModal.js';
import { applyHeroVisuals } from '../hudController.js';

// Brasões Heráldicos Vetoriais e Perfis dos Campeões (Centralizados em heroProfiles.js)
export { HERO_EMBLEMS_SVG, CHARACTER_PROFILES } from '../../config/heroProfiles.js';
import { HERO_EMBLEMS_SVG, CHARACTER_PROFILES } from '../../config/heroProfiles.js';

export let activeShowcaseHeroKey = 'KNIGHT';
let activeMobileSlideIndex = 0; // 0: Arsenal, 1: Atributos, 2: Biografia
let charSelectKeydownHandler = null;

export function isMobileScreen() {
  return layoutMetrics.isCompactWidth || 
         layoutMetrics.isCompactHeight || 
         window.innerWidth <= 768 || 
         ('ontouchstart' in window && window.innerWidth <= 950) || 
         /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) ||
         (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));
}

export function closeCharSelectModal() {
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

export function openCharacterSelect() {
  if (gameState.isInMatch) {
    terminateMatch();
  }
  gameState.isPaused = false;
  resetDeathAudioFilter();

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

  function renderShowcase(heroKey) {
    activeShowcaseHeroKey = heroKey;
    const char = CHARACTERS[heroKey] || CHARACTERS.KNIGHT;
    const profile = CHARACTER_PROFILES[heroKey] || CHARACTER_PROFILES.KNIGHT;
    const unlocked = isHeroUnlocked(heroKey);
    const achId = HERO_UNLOCK_MAP[heroKey];
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

    // Atualiza contador de heróis despertos no topo do roster
    const rosterCountBadge = document.getElementById('roster-count-badge');
    if (rosterCountBadge) {
      const unlockedCount = heroKeys.filter(k => isHeroUnlocked(k)).length;
      rosterCountBadge.innerText = `${unlockedCount}/${heroKeys.length} DESPERTOS`;
    }

    const badge = document.getElementById('stage-archetype-badge');
    if (badge) {
      badge.innerHTML = `${char.title.toUpperCase()} ${!unlocked ? renderIcon('lock', { size: 10, color: '#ff7675', style: 'margin-left:4px; vertical-align:middle; display:inline-block;' }) : ''}`;
      badge.style.color = unlocked ? profile.themeColor : '#747d8c';
      badge.style.borderColor = unlocked ? `${profile.themeColor}aa` : '#4b5563';
      badge.style.boxShadow = unlocked ? `0 0 18px ${profile.themeColor}66` : 'none';
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
    const diffLabel = diff === 1 ? 'Iniciante' : (diff === 2 ? 'Equilibrado' : 'Avançado');

    showcaseContainer.innerHTML = `
      <!-- 1. Monólito de Identidade -->
      <div class="char-identity-monolith">
        <div class="hero-monolith-eyebrow">
          <span class="hero-archetype-pill">${char.title}</span>
          <div class="hero-diff-pips" title="Dificuldade: ${diffLabel}">
            <span>${diffLabel}</span>
            <span>${diffDots}</span>
          </div>
        </div>

        <h2 class="hero-monolith-name">${char.name}</h2>
        <div class="hero-monolith-role">Função: <b>${char.role || 'Guerreiro'}</b></div>
      </div>

      <!-- 2. Navegador de 3 Pílulas dos Slides (Mobile) -->
      <div class="mobile-slide-pills" id="mobile-slide-pills">
        <button class="slide-pill-btn ${activeMobileSlideIndex === 0 ? 'active' : ''}" data-slide="0" type="button" aria-label="Ver Arsenal">
          <span class="pill-dot"></span>
          <span class="pill-text">ARSENAL</span>
        </button>
        <button class="slide-pill-btn ${activeMobileSlideIndex === 1 ? 'active' : ''}" data-slide="1" type="button" aria-label="Ver Atributos">
          <span class="pill-dot"></span>
          <span class="pill-text">ATRIBUTOS</span>
        </button>
        <button class="slide-pill-btn ${activeMobileSlideIndex === 2 ? 'active' : ''}" data-slide="2" type="button" aria-label="Ver Biografia">
          <span class="pill-dot"></span>
          <span class="pill-text">BIOGRAFIA</span>
        </button>
      </div>

      <!-- 3. Trilho de Slides (Mobile: Deslize horizontal / Desktop: Fluxo contínuo) -->
      <div class="mobile-slides-track" id="mobile-slides-track">
        <!-- Slide 0: Arsenal & Habilidades -->
        <div class="mobile-slide-pane" data-slide-index="0" data-autofit="true" data-autofit-target=".hero-loadout-lineage">
          <div class="hero-loadout-lineage">
            <!-- Entrada 1: Arma Inicial -->
            <div class="loadout-entry">
              <div class="loadout-entry-main">
                <div class="loadout-icon-box" style="--icon-accent: ${profile.themeColor};">
                  ${renderIcon(WEAPON_ICONS[char.startingWeapon] || 'sword', { size: 14, color: profile.themeColor })}
                </div>
                <div class="loadout-info-block">
                  <div class="loadout-entry-header">
                    <span class="loadout-entry-badge">ARMA INICIAL</span>
                    <span class="loadout-entry-chip">${char.weapon?.type || profile.weaponName}</span>
                  </div>
                  <div class="loadout-entry-title" style="color: ${profile.themeColor};">${char.weapon?.name || profile.weaponName}</div>
                </div>
              </div>
              <div class="loadout-entry-desc">${char.weapon?.desc || ''}</div>
            </div>

            <!-- Entrada 2: Poder Ancestral -->
            <div class="loadout-entry">
              <div class="loadout-entry-main">
                <div class="loadout-icon-box" style="--icon-accent: ${profile.themeColor};">
                  ${renderIcon('damage', { size: 14, color: profile.themeColor })}
                </div>
                <div class="loadout-info-block">
                  <div class="loadout-entry-header">
                    <span class="loadout-entry-badge">PODER ANCESTRAL</span>
                    <span class="loadout-entry-chip chip-cooldown">
                      ${renderIcon('timer', { size: 9 })} ${char.skill?.cooldown || '7s'}
                    </span>
                  </div>
                  <div class="loadout-entry-title" style="color: ${profile.themeColor};">${char.skill?.name || 'Habilidade'}</div>
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
                    <span class="loadout-entry-badge">BÊNÇÃO PASSIVA</span>
                  </div>
                  <div class="loadout-entry-title" style="color: ${profile.themeColor};">${char.passive?.name || 'Aura'}</div>
                </div>
              </div>
              <div class="loadout-entry-desc">${char.passive?.desc || ''}</div>
            </div>

            <!-- Fim do Arsenal (3 Entradas Essenciais: Arma, Habilidade e Passiva) -->
          </div>
        </div>

        <!-- Slide 1: Matriz de Atributos Unificada -->
        <div class="mobile-slide-pane" data-slide-index="1" data-autofit="true" data-autofit-target=".hero-telemetry-cluster">
          <div class="hero-telemetry-cluster">
            <div class="telemetry-header">
              <span class="telemetry-title">MATRIZ DE COMBATE</span>
              <span class="telemetry-resonance-line"></span>
            </div>
            <div class="telemetry-tracks">
              <!-- DANO -->
              <div class="telemetry-channel" data-stat="dano">
                <span class="channel-label">DANO</span>
                <div class="channel-laser-track">
                  <div class="channel-laser-fill" style="width: ${(profile.levels.dano / 5) * 100}%;"></div>
                  <div class="channel-pips"><span/><span/><span/><span/></div>
                </div>
                <span class="channel-val">${profile.levels.dano}/5</span>
              </div>
              <!-- ÁREA -->
              <div class="telemetry-channel" data-stat="area">
                <span class="channel-label">ÁREA</span>
                <div class="channel-laser-track">
                  <div class="channel-laser-fill" style="width: ${(profile.levels.area / 5) * 100}%;"></div>
                  <div class="channel-pips"><span/><span/><span/><span/></div>
                </div>
                <span class="channel-val">${profile.levels.area}/5</span>
              </div>
              <!-- VEL -->
              <div class="telemetry-channel" data-stat="vel">
                <span class="channel-label">VEL</span>
                <div class="channel-laser-track">
                  <div class="channel-laser-fill" style="width: ${(profile.levels.vel / 5) * 100}%;"></div>
                  <div class="channel-pips"><span/><span/><span/><span/></div>
                </div>
                <span class="channel-val">${profile.levels.vel}/5</span>
              </div>
              <!-- RES -->
              <div class="telemetry-channel" data-stat="res">
                <span class="channel-label">RES</span>
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
                <span class="record-panel-title">REGISTRO DE BATALHA</span>
                <span class="record-panel-runs">${heroRecord.runsPlayed > 0 ? `${heroRecord.runsPlayed} ${heroRecord.runsPlayed === 1 ? 'PARTIDA' : 'PARTIDAS'}` : 'SEM REGISTRO'}</span>
              </div>
              <div class="record-metrics-row">
                <div class="record-metric-item">
                  <span class="metric-label">RECORD TEMPO</span>
                  <span class="metric-val ${heroRecord.bestSeconds > 0 ? 'highlight-gold' : ''}">${heroRecord.timeStr}</span>
                </div>
                <div class="record-metric-item">
                  <span class="metric-label">ABATES MÁX</span>
                  <span class="metric-val ${heroRecord.kills > 0 ? 'highlight-crimson' : ''}">${heroRecord.kills.toLocaleString('pt-BR')}</span>
                </div>
                <div class="record-metric-item">
                  <span class="metric-label">STATUS</span>
                  <span class="metric-val ${heroRecord.statusClass}">${heroRecord.statusLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Slide 2: Lore & Selo Primordial -->
        <div class="mobile-slide-pane" data-slide-index="2" data-autofit="true" data-autofit-target=".hero-lore-pane">
          <div class="hero-lore-pane">
            <div class="hero-monolith-quote">
              “${char.lore || ''}”
            </div>

            ${!unlocked && status ? `
              <div class="primordial-seal-banner">
                <div class="seal-header">
                  <span class="seal-icon">${renderIcon('lock', { size: 14, color: '#ff7675' })}</span>
                  <div class="seal-titles">
                    <span class="seal-eyebrow">SELO PRIMORDIAL • REQUISITO DE DESBLOQUEIO</span>
                    <span class="seal-name">${status.title}</span>
                  </div>
                </div>
                <div class="seal-desc">${status.desc}</div>
                <div class="seal-track">
                  <div class="seal-fill" style="width: ${status.percent}%;"></div>
                </div>
                <div class="seal-meta">
                  <span>Progresso: <b>${status.label}</b></span>
                  <span>${status.percent}%</span>
                </div>
              </div>
            ` : `
              <div class="hero-tactical-hint">
                <div class="tactical-hint-header">
                  <span class="hint-glyph">✦</span>
                  <span class="hint-title">DIRETRIZ ANCESTRAL</span>
                </div>
                <p class="hint-text">Arquétipo consagrado no vácuo. Combine a arma inicial com seu poder ativo para romper as investidas da horda.</p>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- 4. Catalisador de Despertar (Start Action Button) -->
      ${unlocked ? `
        <button class="btn-ignition-catalyst" id="confirm-hero-btn" type="button" aria-label="Iniciar Batalha">
          <div class="btn-shimmer-sweep"></div>
          <span class="btn-catalyst-glow"></span>
          <span class="btn-catalyst-content">
            ${renderIcon('damage', { size: 15, style: 'margin-right:6px; vertical-align:middle;' })}
            DESPERTAR NO VÁCUO
            ${renderIcon('damage', { size: 15, style: 'margin-left:6px; vertical-align:middle;' })}
          </span>
          <span class="btn-hotkey-hint">ESPAÇO</span>
        </button>
      ` : `
        <button class="btn-ignition-catalyst" id="confirm-hero-btn" disabled type="button" aria-label="Herói Bloqueado">
          <span class="btn-catalyst-content">
            ${renderIcon('lock', { size: 14, color: '#ff7675', style: 'margin-right:8px; vertical-align:middle;' })}
            SELO PRIMORDIAL ATIVO
          </span>
        </button>
      `}
    `;

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

      const syncSlidePosition = () => {
        const w = track.clientWidth || 0;
        if (w > 0 && activeMobileSlideIndex > 0) {
          track.scrollLeft = activeMobileSlideIndex * w;
        }
      };
      requestAnimationFrame(syncSlidePosition);
      setTimeout(syncSlidePosition, 60);

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
        if (!isScrolling) {
          requestAnimationFrame(() => {
            const w = track.clientWidth || 1;
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
        confirmBtn.onclick = null;
      }
    }

    // Atualiza classes ativas nos nós de sigilo
    const sigilItems = pedestalsContainer.querySelectorAll('.char-sigil-item');
    sigilItems.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-hero') === heroKey);
    });

    // Dispara recálculo de auto-fit proporcional adaptativo
    updateAllAutoFit();
  }

  pedestalsContainer.innerHTML = '';
  heroKeys.forEach(key => {
    const c = CHARACTERS[key];
    const profile = CHARACTER_PROFILES[key] || CHARACTER_PROFILES.KNIGHT;
    const diff = c.difficulty || 1;
    let miniDots = '◆'.repeat(diff) + '◇'.repeat(3 - diff);
    const unlocked = isHeroUnlocked(key);

    const sigil = document.createElement('div');
    sigil.className = `char-sigil-item ${key === activeShowcaseHeroKey ? 'active' : ''} ${!unlocked ? 'sigil-locked' : ''}`;
    sigil.setAttribute('data-hero', key);
    sigil.setAttribute('title', `${c.name} (${c.title})${!unlocked ? ' • Bloqueado' : ''}`);
    sigil.style.setProperty('--showcase-color', unlocked ? profile.themeColor : '#57606f');
    sigil.innerHTML = `
      <div class="sigil-focus-needle"></div>
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
            : `<span class="sigil-locked-text">${renderIcon('lock', { size: 8, color: '#ff7675', style: 'vertical-align:middle;' })} BLOQUEADO</span>`
          }
        </div>
      </div>
    `;

    sigil.onclick = () => {
      try { playSfx('card_hover'); } catch(e) {}
      triggerHaptic('light');
      renderShowcase(key);
      scrollPedestalToCenter(sigil);
    };

    pedestalsContainer.appendChild(sigil);
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
    };
  });

  renderShowcase(activeShowcaseHeroKey);
  charModal.style.display = 'flex';

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
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ArrowUp') {
      e.preventDefault();
      selectAdjacentHero(-1);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'ArrowDown') {
      e.preventDefault();
      selectAdjacentHero(1);
    } else if (e.key === ' ' || e.key === 'Enter') {
      if (isHeroUnlocked(activeShowcaseHeroKey)) {
        e.preventDefault();
        const confirmBtn = document.getElementById('confirm-hero-btn');
        if (confirmBtn && !confirmBtn.disabled) {
          confirmBtn.click();
        }
      }
    }
  };
  window.addEventListener('keydown', charSelectKeydownHandler);
}
