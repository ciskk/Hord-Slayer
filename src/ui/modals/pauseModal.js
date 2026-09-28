import { getPauseEquipment } from '../pauseEquipment.js';
import { frameCount } from '../../state/gameState.js';
import { activeBoss } from '../../state/collections.js';
import { getCurrentWave, getEffectiveHordeSeconds } from '../../systems/waves.js';
import { t, formatNumber, getLanguage }  from '../../i18n/index.js';
import { initPauseLanguageControl, closePauseLanguageControl } from '../pauseLanguageControl.js';
import { getPactPresentation } from '../../i18n/contentPresentation.js';
/**
 * src/ui/modals/pauseModal.js
 * Grimório de Estase Astral: Cronostase Rúnica, Biometria do Sobrevivente,
 * Arsenal Ativo, Matriz de Transmutação e Congelamento Contínuo da Arena.
 */
import { player, getPersistentGold, selectedHeroKey } from '../../entities/player.js';
import { CHARACTERS } from '../../config/characters.js';
import { HERO_EMBLEMS_SVG } from '../../config/heroProfiles.js';
import { isMobileScreen } from './characterSelectModal.js';
import { WEAPON_ICONS, renderIcon } from '../icons.js';
import { ITEMS, getSynergyTrackerList } from '../../config/items.js';
import { gameState, setLastTime } from '../../main.js';
import { initAudio, applyStasisAudioFilter, resetStasisAudioFilter, playSfx, triggerHaptic } from '../../core/audio.js';
import { getJoystickMode, setJoystickMode, JOYSTICK_MODES, resetInput } from '../../core/input.js';
import { updateAllAutoFit, layoutMetrics, getGraphicsQuality, setGraphicsQuality, GRAPHICS_QUALITY } from '../../core/responsive.js';

let isTransitioning = false;
let pauseKeydownHandler = null;
let pauseNavigationInitialized = false;
const portraitPause = () => window.matchMedia('(orientation: portrait), (max-width: 850px)').matches || isMobileScreen();
function selectPauseView(view) {
  const modal = document.getElementById('pause-modal');
  if (!modal) return;
  modal.dataset.pauseView = view;
  closePauseLanguageControl();
  const settings = view === 'settings';
  const isPortrait = portraitPause();

  const survivorPanel = document.getElementById('pause-survivor-panel');
  const equipmentPanel = document.getElementById('pause-equipment-panel');
  const synergiesPanel = document.getElementById('pause-synergies-panel');
  const settingsPanel = document.getElementById('pause-settings-panel');

  if (settings) {
    if (survivorPanel) survivorPanel.hidden = !isPortrait;
    if (equipmentPanel) equipmentPanel.hidden = true;
    if (synergiesPanel) synergiesPanel.hidden = true;
    if (settingsPanel) settingsPanel.hidden = false;
  } else if (view === 'synergies') {
    if (survivorPanel) survivorPanel.hidden = false;
    if (equipmentPanel) equipmentPanel.hidden = isPortrait;
    if (synergiesPanel) synergiesPanel.hidden = false;
    if (settingsPanel) settingsPanel.hidden = true;
  } else {
    // view === 'equipment'
    if (survivorPanel) survivorPanel.hidden = false;
    if (equipmentPanel) equipmentPanel.hidden = false;
    if (synergiesPanel) synergiesPanel.hidden = isPortrait;
    if (settingsPanel) settingsPanel.hidden = true;
  }

  for (const tab of modal.querySelectorAll('[data-pause-tab]')) {
    let selected = false;
    if (settings) {
      selected = tab.dataset.pauseTab === 'settings';
    } else if (isPortrait) {
      selected = tab.dataset.pauseTab === view;
    } else {
      selected = tab.dataset.pauseTab === 'equipment';
    }
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
}
function initPauseNavigation() {
  if (pauseNavigationInitialized) return;
  pauseNavigationInitialized = true;
  const modal = document.getElementById('pause-modal');
  if (!modal) return;
  const toggle = document.getElementById('pause-settings-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      selectPauseView(modal.dataset.pauseView === 'settings' ? (modal.dataset.previousPauseView || 'equipment') : 'settings');
    });
  }
  const tabs = [...modal.querySelectorAll('[data-pause-tab]')];
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      if (modal.dataset.pauseView === tab.dataset.pauseTab) return;
      playSfx('card_hover');
      triggerHaptic('light');
      if (tab.dataset.pauseTab !== 'settings') {
        modal.dataset.previousPauseView = tab.dataset.pauseTab;
      }
      selectPauseView(tab.dataset.pauseTab);
    });
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const visibleTabs = tabs.filter(t => window.getComputedStyle(t).display !== 'none');
      const curIdx = visibleTabs.indexOf(tab);
      const nextIdx = event.key === 'Home' ? 0 : event.key === 'End' ? visibleTabs.length - 1 : (curIdx + (event.key === 'ArrowRight' ? 1 : -1) + visibleTabs.length) % visibleTabs.length;
      visibleTabs[nextIdx]?.click();
      visibleTabs[nextIdx]?.focus();
    });
  });
  window.addEventListener('resize', () => selectPauseView(modal.dataset.pauseView || 'equipment'));
}

/**
 * Preenchimento Dinâmico do Palco de Estase Astral (Crônica da Batalha)
 */
export function renderPauseInventory() {
  // 1. Metadados do Topo (Tempo, Onda e Almas)
  const seconds = Math.max(0, Math.floor(frameCount / 60));
  const pauseTimer = document.getElementById('pause-timer-val');
  if (pauseTimer) pauseTimer.innerText = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
  const wave = getCurrentWave(getEffectiveHordeSeconds(seconds));
  const waveBadgeText = activeBoss ? t('match.common.boss') : formatNumber(wave.index);
  const eyebrowText = activeBoss ? t('match.pause.boss') : t('match.pause.wave', { number: formatNumber(wave.index) });
  const languageSelect = document.getElementById('pause-language-select');
  if (languageSelect) languageSelect.value = getLanguage();

  const pauseWave = document.getElementById('pause-wave-badge');
  if (pauseWave) pauseWave.innerText = waveBadgeText;

  const pauseWaveEyebrow = document.getElementById('pause-wave-eyebrow');
  if (pauseWaveEyebrow) pauseWaveEyebrow.innerText = eyebrowText;

  const goldVal = document.getElementById('pause-gold-val');
  if (goldVal) goldVal.innerText = getPersistentGold();

  // 2. Pilar 1: Dossiê do Herói e Biometria Cósmica
  const heroProfile = CHARACTERS[selectedHeroKey] || CHARACTERS.PALADIN || CHARACTERS.KNIGHT;
  const heroBadge = document.getElementById('pause-hero-badge');
  if (heroBadge) heroBadge.innerText = t(`heroes.${selectedHeroKey}.title`).toUpperCase();

  const heroNameElem = document.getElementById('pause-hero-name');
  if (heroNameElem) heroNameElem.innerText = heroProfile.name || 'Campeão Arcano';

  const heroLvlElem = document.getElementById('pause-hero-lvl-label');
  if (heroLvlElem) heroLvlElem.innerText = t('match.pause.level', { number: formatNumber(player.level) });

  const heroEmblemWrap = document.getElementById('pause-hero-emblem-wrap');
  if (heroEmblemWrap) {
    const emblemSvg = HERO_EMBLEMS_SVG[selectedHeroKey] || HERO_EMBLEMS_SVG.KNIGHT;
    heroEmblemWrap.innerHTML = emblemSvg;
  }

  // Barra de Vitalidade
  const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const hpFill = document.getElementById('pause-hp-gauge-fill');
  if (hpFill) hpFill.style.width = `${hpPct}%`;

  const hpText = document.getElementById('pause-hp-text');
  if (hpText) hpText.innerText = `${Math.ceil(player.hp)} / ${player.maxHp} HP`;

  // Grid Biométrico (Status Numéricos)
  const statsGrid = document.getElementById('pause-stats-grid');
  if (statsGrid) {
    const totalDmg = player.damage;
    const bonusDmgPct = Math.round((player.damagePercentBonus || 0) * 100);
    const critPct = Math.round(player.critChance * 100);
    const weaponCooldown = player.weapons[0]?.cooldown;

    statsGrid.innerHTML = `
      <div class="pause-stat-card card-stat-damage">
        <span class="pause-stat-label">${renderIcon('damage', { size: 10, color: '#e74c3c' })} ${t('match.stat.damage')}</span>
        <span class="pause-stat-val highlight-ruby">${totalDmg} <small style="font-size:8.5px; color:#8c94a8;">(+${bonusDmgPct}%)</small></span>
      </div>

      <div class="pause-stat-card card-stat-crit">
        <span class="pause-stat-label">${renderIcon('crit', { size: 10, color: '#f39c12' })} ${t('match.stat.crit')}</span>
        <span class="pause-stat-val highlight-gold">${critPct}%</span>
      </div>

      <div class="pause-stat-card card-stat-speed">
        <span class="pause-stat-label">${renderIcon('boot', { size: 10, color: '#00f5d4' })} ${t('match.stat.speed')}</span>
        <span class="pause-stat-val highlight-cyan">${player.speed.toFixed(1)}</span>
      </div>

      <div class="pause-stat-card card-stat-cdr">
        <span class="pause-stat-label">${renderIcon('cooldown', { size: 10, color: '#a29bfe' })} ${t('cards.effect.weaponCooldown')}</span>
        <span class="pause-stat-val">${weaponCooldown ? formatNumber(weaponCooldown / 60, { maximumFractionDigits: 2 }) + ' s' : '—'}</span>
      </div>

      <div class="pause-stat-card card-stat-magnet">
        <span class="pause-stat-label">${renderIcon('magnet', { size: 10, color: '#9b59b6' })} ${t('match.stat.magnet')}</span>
        <span class="pause-stat-val">${player.magnet}px</span>
      </div>

      <div class="pause-stat-card card-stat-souls">
        <span class="pause-stat-label">${renderIcon('gold', { size: 10, color: '#ffd166' })} ${t('match.stat.souls')}</span>
        <span class="pause-stat-val highlight-gold">${getPersistentGold()}</span>
      </div>
    `;
  }

  // 3. Pilar 2: Arsenal Arcano & Pips de Energia
  const weaponsCountBadge = document.getElementById('pause-weapons-count');
  if (weaponsCountBadge) weaponsCountBadge.innerText = t('match.pause.weapons', { count: getPauseEquipment(player).length });

  const buildList = document.getElementById('pause-build-list');
  if (buildList) {
    buildList.innerHTML = '';
    getPauseEquipment(player).forEach(w => {
      const card = document.createElement('div');
      card.className = 'pause-weapon-card';
      const iconKey = WEAPON_ICONS[w.type] || 'sword';
      const weaponItem = ITEMS[w.type];
      const weaponDisplayName = weaponItem ? weaponItem.name : w.type;
      const weaponLvl = w.level;
      const maxLvl = (weaponItem && weaponItem.maxLevel) ? weaponItem.maxLevel : 5;

      // Criação dos 5 pips de energia luminosa
      let pipsHtml = '';
      for (let i = 1; i <= maxLvl; i++) {
        pipsHtml += `<span class="energy-pip ${i <= weaponLvl ? 'filled' : ''}"></span>`;
      }

      card.innerHTML = `
        <div class="weapon-info-col">
          <div class="weapon-icon-box">
            ${renderIcon(iconKey, { size: 13, color: '#00f5d4' })}
          </div>
          <span class="weapon-title">${weaponDisplayName}${w.evolved ? `<small class="pause-evolved-label">${t('match.pause.weaponEvolved')}</small>` : ''}</span>
        </div>
        <div class="weapon-pips-col">
          <span class="weapon-lvl-tag">${t('match.common.level', { number: weaponLvl })}</span>
          <div class="weapon-energy-pips" aria-hidden="true">
            ${pipsHtml}
          </div>
        </div>
      `;
      buildList.appendChild(card);
    });
  }

  // Passivas e Bênçãos Acumuladas
  const passivesFlow = document.getElementById('pause-passives-list');
  if (passivesFlow) {
    passivesFlow.innerHTML = '';
    const passives = [];

    if (player.damageCardCount) {
      passives.push({ icon: 'damage', label: ITEMS.DMG.name, val: `+${player.damageCardCount * 5}% (${t('match.common.level', { number: player.damageCardCount })})`, color: '#e74c3c' });
    }
    if (player.armorCardCount || player.hasArmorPassive) {
      passives.push({ icon: 'armor', label: ITEMS.ARMOR.name, val: `+${(player.armorCardCount || 1) * 30} HP (${t('match.common.level', { number: player.armorCardCount || 1 })})`, color: '#3498db' });
    }
    if (player.wingsCardCount || player.hasWingsPassive) {
      passives.push({ icon: 'wings', label: ITEMS.WINGS.name, val: `${formatNumber(player.baseSpeed, { maximumFractionDigits: 2 })} ${t('match.stat.speed')} (${t('match.common.level', { number: player.wingsCardCount || 1 })})`, color: '#00cec9' });
    }
    if (player.frostCardCount || (player.slowChance || 0) > 0) {
      passives.push({ icon: 'frost', label: ITEMS.FROST_PASSIVE.name, val: `${Math.round(player.slowChance * 100)}% ${t('cards.effect.slowChance')} (${t('match.common.level', { number: player.frostCardCount || 1 })})`, color: '#74b9ff' });
    }
    if (player.critCardCount || player.critChance > 0.05) {
      passives.push({ icon: 'crit', label: ITEMS.CRIT.name, val: `${Math.round(player.critChance * 100)}% ${t('match.stat.crit')} (${t('match.common.level', { number: player.critCardCount || 1 })})`, color: '#f39c12' });
    }
    if (player.hasteCardCount || (player.cooldownReduction || 0) > 0) {
      passives.push({ icon: 'cooldown', label: ITEMS.HASTE.name, val: `${t('cards.effect.weaponCooldown')}: ${formatNumber((player.weapons[0]?.cooldown || 0) / 60, { maximumFractionDigits: 2 })} s (${t('match.common.level', { number: player.hasteCardCount || 1 })})`, color: '#e67e22' });
    }
    if (player.ultCooldownCount) {
      passives.push({ icon: 'ult_cooldown', label: ITEMS.ULT_COOLDOWN.name, val: `${t('cards.effect.ultimateCooldown')}: ${formatNumber(player.skillMaxCd / 60, { maximumFractionDigits: 2 })} s (${t('match.common.level', { number: player.ultCooldownCount })})`, color: '#c084fc' });
    }
    if (player.magnetCardCount) {
      passives.push({ icon: 'magnet', label: ITEMS.MAGNET.name, val: `+${player.magnetCardCount * 30}px (${t('match.common.level', { number: player.magnetCardCount })})`, color: '#9b59b6' });
    }

    if (passives.length === 0) {
      passivesFlow.innerHTML = `<span style="font-size:9.5px; color:#64748b; font-style:italic;">${t('match.pause.empty')}</span>`;
    } else {
      passives.forEach(p => {
        const chip = document.createElement('div');
        chip.className = 'pause-passive-chip';
        chip.innerHTML = `
          ${renderIcon(p.icon, { size: 10, color: p.color })}
          <span>${p.label}:</span>
          <span class="passive-val">${p.val}</span>
        `;
        passivesFlow.appendChild(chip);
      });
    }

    // Exibição de Pactos Amaldiçoados do Destino
    if (player.destinyPacts && player.destinyPacts.length > 0) {
      const heading = document.createElement('div');
      heading.className = 'pillar-subheader pause-pacts-heading';
      heading.textContent = t('match.pause.pacts');
      passivesFlow.appendChild(heading);
      player.destinyPacts.forEach(saved => {
        const p = getPactPresentation(saved);
        const chip = document.createElement('div');
        chip.className = 'pause-passive-chip pause-pact-chip';
        chip.style.borderColor = 'rgba(168, 85, 247, 0.7)';
        chip.style.background = 'rgba(48, 16, 68, 0.55)';
        chip.innerHTML = `
          ${renderIcon('pact', { size: 10, color: '#c084fc' })}
          <span style="color:#c084fc; font-weight:800;">${p.title}:</span>
          <span class="passive-val" style="color:#2ecc71; font-weight:800;">${p.bonus}</span>
          <span style="color:#ff6b6b; font-size:9.5px; margin-left:3px;">(${p.penalty})</span>
        `;
        passivesFlow.appendChild(chip);
      });
    }
  }

  // 4. Pilar 3: Matriz de Transmutação (Sinergias)
  const synTracker = document.getElementById('pause-synergies-tracker');
  if (synTracker) {
    const equipment = new Set(getPauseEquipment(player).map(w => w.type));
    const synList = getSynergyTrackerList(player);
    const rank = s => s.isReady ? 0 : s.isEvolved ? 2 : equipment.has(s.id.replace('evolved_', '').toUpperCase()) ? 1 : 3;
    synList.sort((a, b) => rank(a) - rank(b));

    synTracker.innerHTML = synList.map(s => {
      let cardClass = 'pause-synergy-card';
      let statusColor = '#8c94a8';
      let statusContent = s.req;

      if (s.isEvolved) {
        cardClass += ' is-evolved';
        statusColor = '#ffd166';
        statusContent = `${renderIcon('star_evolution', { size: 9, color: '#ffd166' })} ${t('match.pause.evolved')}`;
      } else if (s.isReady) {
        cardClass += ' is-ready';
        statusColor = '#00f5d4';
        statusContent = `${renderIcon('check', { size: 9, color: '#00f5d4' })} ${t('match.pause.ready')}`;
      }

      return `
        <div class="${cardClass}">
          <div class="synergy-card-top">
            <span class="synergy-name">${s.name}</span>
            <span class="synergy-status-tag" style="color: ${statusColor};">${statusContent}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // 5. Atualização do Seletor de Tipo de Joystick (Mobile)
  const currentMode = getJoystickMode();
  const joyBadge = document.getElementById('joystick-mode-badge');
  const btnFloating = document.getElementById('btn-joy-floating');
  const btnDynamic = document.getElementById('btn-joy-dynamic');

  if (joyBadge) {
    joyBadge.innerText = currentMode === JOYSTICK_MODES.DYNAMIC ? t('match.settings.dynamic') : t('match.settings.floating');
  }
  if (btnFloating && btnDynamic) {
    const isDynamic = currentMode === JOYSTICK_MODES.DYNAMIC;
    btnFloating.classList.toggle('active', !isDynamic);
    btnFloating.setAttribute('aria-pressed', (!isDynamic).toString());
    btnDynamic.classList.toggle('active', isDynamic);
    btnDynamic.setAttribute('aria-pressed', isDynamic.toString());
  }

  // 6. Atualização do Seletor de Resolução / Qualidade Gráfica (Adaptação à Tela)
  const currentGfx = getGraphicsQuality();
  const gfxBadge = document.getElementById('graphics-mode-badge');
  const gfxSubtext = document.getElementById('graphics-subtext');
  const btnNative = document.getElementById('btn-gfx-native');
  const btnHigh = document.getElementById('btn-gfx-high');
  const btnPerf = document.getElementById('btn-gfx-performance');

  const curDpr = layoutMetrics.dpr || 1;
  const nativeDpr = layoutMetrics.nativeDpr || (typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1);
  const bufferW = Math.floor((layoutMetrics.viewW || (typeof window !== 'undefined' ? window.innerWidth : 960)) * curDpr);
  const bufferH = Math.floor((layoutMetrics.viewH || (typeof window !== 'undefined' ? window.innerHeight : 640)) * curDpr);

  if (gfxBadge) {
    const scaleStr = formatNumber(curDpr, { minimumFractionDigits: 2 });
    if (currentGfx === GRAPHICS_QUALITY.NATIVE) {
      gfxBadge.innerText = `${t('match.settings.native')} (${scaleStr}x)`;
      gfxBadge.style.color = '#00f5d4';
    } else if (currentGfx === GRAPHICS_QUALITY.HIGH) {
      gfxBadge.innerText = `${t('match.settings.high')} (${scaleStr}x)`;
      gfxBadge.style.color = '#ffd166';
    } else {
      gfxBadge.innerText = `${t('match.settings.performance')} (${scaleStr}x)`;
      gfxBadge.style.color = '#ff9f43';
    }
  }

  if (gfxSubtext && bufferW > 0 && bufferH > 0) {
    gfxSubtext.innerText = t('match.settings.rendering', { width: formatNumber(bufferW), height: formatNumber(bufferH), scale: formatNumber(curDpr, { minimumFractionDigits: 2 }) });
  }

  if (btnNative && btnHigh && btnPerf) {
    btnNative.classList.toggle('active', currentGfx === GRAPHICS_QUALITY.NATIVE);
    btnNative.setAttribute('aria-pressed', (currentGfx === GRAPHICS_QUALITY.NATIVE).toString());
    btnHigh.classList.toggle('active', currentGfx === GRAPHICS_QUALITY.HIGH);
    btnHigh.setAttribute('aria-pressed', (currentGfx === GRAPHICS_QUALITY.HIGH).toString());
    btnPerf.classList.toggle('active', currentGfx === GRAPHICS_QUALITY.PERFORMANCE);
    btnPerf.setAttribute('aria-pressed', (currentGfx === GRAPHICS_QUALITY.PERFORMANCE).toString());
  }
}

/**
 * Gestão de Teclas de Atalho do Modal de Pausa
 */
function setupPauseKeydown() {
  cleanupPauseKeydown();
  pauseKeydownHandler = (e) => {
    if (e.target.closest?.('select, input, textarea')) return;
    const modal = document.getElementById('pause-modal');
    if (e.code === 'Escape' && modal?.dataset.pauseView === 'settings') {
      e.preventDefault();
      const prevView = modal.dataset.previousPauseView || 'equipment';
      selectPauseView(prevView);
      const activeTab = modal.querySelector(`[data-pause-tab="${prevView}"]`);
      activeTab?.focus();
      return;
    }
    if (e.code === 'Space' && e.target.closest?.('button')) return;
    if (e.code === 'Escape' || e.code === 'KeyP' || e.code === 'Space') {
      e.preventDefault();
      closePause();
    }
  };
  window.addEventListener('keydown', pauseKeydownHandler);
}

function cleanupPauseKeydown() {
  if (pauseKeydownHandler) {
    window.removeEventListener('keydown', pauseKeydownHandler);
    pauseKeydownHandler = null;
  }
}

/**
 * Abertura com Estase Temporal: Congelamento Imediato da Arena
 */
export function openPause() {
  if (!gameState.isInMatch || gameState.isDead || gameState.isWon || isTransitioning) return;
  if (gameState.isPaused) return;
  initPauseNavigation();
  selectPauseView(document.getElementById('pause-modal').dataset.previousPauseView || 'equipment');
  initPauseLanguageControl();
  closePauseLanguageControl();

  // 0. Limpeza defensiva de entradas de toque e teclado
  resetInput();

  // 1. REQUISITO CRÍTICO: O jogo CONGELA IMEDIATAMENTE antes de qualquer animação
  gameState.isPaused = true;

  // 2. Modulação Acústica de Cronostase
  initAudio();
  applyStasisAudioFilter();
  playSfx('stasis_enter');

  // 3. Efeito Óptico de Estase no Canvas
  const gameCanvas = document.getElementById('game-canvas');
  if (gameCanvas) {
    gameCanvas.classList.add('canvas-stasis-frozen');
  }

  // 4. Renderização do Conteúdo
  renderPauseInventory();

  // 5. Exibição do Palco com Detecção Mobile
  const pauseModal = document.getElementById('pause-modal');
  if (pauseModal) {
    pauseModal.classList.toggle('is-mobile-device', isMobileScreen());
    pauseModal.classList.remove('closing', 'modal-hidden');
    pauseModal.classList.add('active');
    pauseModal.style.removeProperty('display');
    pauseModal.style.display = 'flex';
    updateAllAutoFit();
    setTimeout(updateAllAutoFit, 30);
  }

  // 6. Registro de Teclas de Saída
  setupPauseKeydown();
}

/**
 * Fechamento com Descompressão Suave:
 * O JOGO PERMANECE CONGELADO DURANTE TODA A TRANSIÇÃO (200ms)
 */
export function closePause() {
  const pauseModal = document.getElementById('pause-modal');
  const isPauseActive = pauseModal && (pauseModal.classList.contains('active') || pauseModal.style.display === 'flex');
  if (!gameState.isInMatch || !gameState.isPaused || isTransitioning || !isPauseActive) return;

  isTransitioning = true;
  closePauseLanguageControl();
  playSfx('stasis_exit');

  if (pauseModal) {
    pauseModal.classList.remove('active');
    pauseModal.classList.add('closing');
  }

  // REQUISITO CRÍTICO DO USUÁRIO:
  // Durante toda a animação de saída de 200ms, o jogo PERMANECE ESTRITAMENTE CONGELADO.
  // Nenhum monstro, projétil ou cronômetro se move enquanto o modal esmaece.
  setTimeout(() => {
    // 1. Ocultar o modal completamente
    if (pauseModal) {
      pauseModal.classList.remove('closing');
      pauseModal.style.display = 'none';
    }

    // 2. Descongelar o filtro óptico da arena
    const gameCanvas = document.getElementById('game-canvas');
    if (gameCanvas) {
      gameCanvas.classList.remove('canvas-stasis-frozen');
    }

    // 3. Restaurar as frequências de áudio da arena
    resetStasisAudioFilter();

    // 4. Limpar listener de teclado
    cleanupPauseKeydown();

    // 5. Recalibrar o delta time da engine para evitar salto de física
    setLastTime(performance.now());

    // 6. Reset defensivo de input antes de reativar
    resetInput();

    // 7. Finalmente retomar o loop do jogo após a interface estar 100% fechada,
    // garantindo que a partida ainda está ativa
    if (gameState.isInMatch) {
      gameState.isPaused = false;
      // Inicia o temporizador de slow motion pós-telas (30 frames ~= 500ms real)
      import('../../main.js').then(module => {
        if (module.setPostScreenSlowMoTimer) {
          module.setPostScreenSlowMoTimer(18); // 300ms = 18 frames at 60fps
        }
      });
    }
    isTransitioning = false;
  }, 200);
}

/**
 * Fechamento de Emergência (Ao Abandonar Partida ou Resetar)
 */
export function forceClosePause() {
  closePauseLanguageControl();
  isTransitioning = false;
  cleanupPauseKeydown();
  resetInput();

  const pauseModal = document.getElementById('pause-modal');
  if (pauseModal) {
    pauseModal.classList.remove('active', 'closing');
    pauseModal.style.display = 'none';
  }

  const gameCanvas = document.getElementById('game-canvas');
  if (gameCanvas) {
    gameCanvas.classList.remove('canvas-stasis-frozen');
  }

  resetStasisAudioFilter();
}

/**
 * Alternador de Pausa Unificado (Chamado por ESC, P ou Botão HUD)
 */
export function togglePause() {
  if (!gameState.isInMatch || gameState.isDead || gameState.isWon) return;
  if (isTransitioning) return;

  const pauseModal = document.getElementById('pause-modal');
  const isPauseActive = pauseModal && (pauseModal.classList.contains('active') || pauseModal.style.display === 'flex');

  if (isPauseActive) {
    closePause();
  } else {
    // Se a tela de upgrades ou de baú estiver ativa, não permite abrir pausa nem despausar
    const upgradeModal = document.getElementById('upgrade-modal');
    if (upgradeModal && (upgradeModal.classList.contains('active') || upgradeModal.classList.contains('closing') || upgradeModal.style.display === 'flex' || (upgradeModal.style.display !== 'none' && !upgradeModal.classList.contains('modal-hidden')))) {
      return;
    }
    const chestModal = document.getElementById('chest-modal');
    if (chestModal && (chestModal.classList.contains('active') || chestModal.classList.contains('closing') || chestModal.style.display === 'flex' || (chestModal.style.display !== 'none' && !chestModal.classList.contains('modal-hidden')))) {
      return;
    }
    if (!gameState.isPaused) {
      openPause();
    }
  }
}

export function isPauseModalOpen() {
  const modal = document.getElementById('pause-modal');
  return !!(modal && (modal.classList.contains('active') || modal.classList.contains('closing') || modal.style.display === 'flex'));
}

