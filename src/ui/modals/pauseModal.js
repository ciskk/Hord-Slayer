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
import { initAudio, applyStasisAudioFilter, resetStasisAudioFilter, playSfx } from '../../core/audio.js';
import { getJoystickMode, setJoystickMode, JOYSTICK_MODES, resetInput } from '../../core/input.js';
import { updateAllAutoFit, layoutMetrics, getGraphicsQuality, setGraphicsQuality, GRAPHICS_QUALITY } from '../../core/responsive.js';

let isTransitioning = false;
let pauseKeydownHandler = null;

/**
 * Preenchimento Dinâmico do Palco de Estase Astral (Crônica da Batalha)
 */
export function renderPauseInventory() {
  // 1. Metadados do Topo (Tempo, Onda e Almas)
  const timerElem = document.getElementById('timer-val');
  const survivalTime = (timerElem && typeof timerElem.innerText === 'string' && timerElem.innerText.trim()) ? timerElem.innerText.trim() : '00:00';
  const pauseTimer = document.getElementById('pause-timer-val');
  if (pauseTimer) pauseTimer.innerText = survivalTime;

  const waveElem = document.getElementById('wave-banner');
  const rawWaveStr = (waveElem && typeof waveElem.innerText === 'string') ? waveElem.innerText : '';
  const rawWaveText = rawWaveStr.includes(':') ? rawWaveStr.split(':')[0].trim() : (rawWaveStr.trim() || 'Onda 1');
  const isNumericWave = /^onda\s*\d+/i.test(rawWaveText);

  let waveBadgeText = '1';
  let eyebrowText = 'ESTÁSE TEMPORAL • ONDA 1';

  if (isNumericWave) {
    waveBadgeText = rawWaveText.replace(/onda\s*:?\s*/i, '').trim() || '1';
    eyebrowText = `ESTÁSE TEMPORAL • ONDA ${waveBadgeText}`;
  } else if (gameState.activeBoss) {
    waveBadgeText = 'CHEFE';
    eyebrowText = 'ESTÁSE TEMPORAL • CONFRONTO DE CHEFE';
  } else {
    waveBadgeText = rawWaveText.length > 12 ? rawWaveText.substring(0, 10) + '..' : rawWaveText;
    eyebrowText = `ESTÁSE TEMPORAL • ${waveBadgeText.toUpperCase()}`;
  }

  const pauseWave = document.getElementById('pause-wave-badge');
  if (pauseWave) pauseWave.innerText = waveBadgeText;

  const pauseWaveEyebrow = document.getElementById('pause-wave-eyebrow');
  if (pauseWaveEyebrow) pauseWaveEyebrow.innerText = eyebrowText;

  const goldVal = document.getElementById('pause-gold-val');
  if (goldVal) goldVal.innerText = getPersistentGold();

  // 2. Pilar 1: Dossiê do Herói e Biometria Cósmica
  const heroProfile = CHARACTERS[selectedHeroKey] || CHARACTERS.PALADIN || CHARACTERS.KNIGHT;
  const heroBadge = document.getElementById('pause-hero-badge');
  if (heroBadge) heroBadge.innerText = (heroProfile.title || 'O SOBREVIVENTE').toUpperCase();

  const heroNameElem = document.getElementById('pause-hero-name');
  if (heroNameElem) heroNameElem.innerText = heroProfile.name || 'Campeão Arcano';

  const heroLvlElem = document.getElementById('pause-hero-lvl-label');
  if (heroLvlElem) heroLvlElem.innerText = `Nível ${player.level} de Ascensão`;

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
    const totalDmg = Math.round(player.damage * (1 + (player.damagePercentBonus || 0)));
    const bonusDmgPct = Math.round((player.damagePercentBonus || 0) * 100);
    const critPct = Math.round(player.critChance * 100);
    const cdrPct = Math.round((player.cooldownReduction || 0) * 100);

    statsGrid.innerHTML = `
      <div class="pause-stat-card card-stat-damage">
        <span class="pause-stat-label">${renderIcon('damage', { size: 10, color: '#e74c3c' })} Dano</span>
        <span class="pause-stat-val highlight-ruby">${totalDmg} <small style="font-size:8.5px; color:#8c94a8;">(+${bonusDmgPct}%)</small></span>
      </div>

      <div class="pause-stat-card card-stat-crit">
        <span class="pause-stat-label">${renderIcon('crit', { size: 10, color: '#f39c12' })} Crítico</span>
        <span class="pause-stat-val highlight-gold">${critPct}%</span>
      </div>

      <div class="pause-stat-card card-stat-speed">
        <span class="pause-stat-label">${renderIcon('boot', { size: 10, color: '#00f5d4' })} Velocidade</span>
        <span class="pause-stat-val highlight-cyan">${player.speed.toFixed(1)}</span>
      </div>

      <div class="pause-stat-card card-stat-cdr">
        <span class="pause-stat-label">${renderIcon('cooldown', { size: 10, color: '#a29bfe' })} CDR</span>
        <span class="pause-stat-val">-${cdrPct}%</span>
      </div>

      <div class="pause-stat-card card-stat-magnet">
        <span class="pause-stat-label">${renderIcon('magnet', { size: 10, color: '#9b59b6' })} Ímã</span>
        <span class="pause-stat-val">${player.magnet}px</span>
      </div>

      <div class="pause-stat-card card-stat-souls">
        <span class="pause-stat-label">${renderIcon('gold', { size: 10, color: '#ffd166' })} Almas</span>
        <span class="pause-stat-val highlight-gold">${getPersistentGold()}</span>
      </div>
    `;
  }

  // 3. Pilar 2: Arsenal Arcano & Pips de Energia
  const weaponsCountBadge = document.getElementById('pause-weapons-count');
  if (weaponsCountBadge) weaponsCountBadge.innerText = `${player.weapons.length} ARMAS`;

  const buildList = document.getElementById('pause-build-list');
  if (buildList) {
    buildList.innerHTML = '';
    player.weapons.forEach(w => {
      const card = document.createElement('div');
      card.className = 'pause-weapon-card';
      const iconKey = WEAPON_ICONS[w.type] || 'sword';
      const weaponItem = ITEMS[w.type];
      const weaponDisplayName = weaponItem ? weaponItem.name : w.type;
      const weaponLvl = w.count || 1;
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
          <span class="weapon-title">${weaponDisplayName}</span>
        </div>
        <div class="weapon-pips-col">
          <span class="weapon-lvl-tag">Nv ${weaponLvl}</span>
          <div class="weapon-energy-pips">
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
      passives.push({ icon: 'damage', label: 'Poder Bruto', val: `+${Math.round((player.damagePercentBonus || 0) * 100)}% (Nv. ${player.damageCardCount})`, color: '#e74c3c' });
    }
    if (player.armorCardCount || player.hasArmorPassive) {
      passives.push({ icon: 'armor', label: 'Armadura Rúnica', val: `+${(player.armorCardCount || 1) * 30} HP (Nv. ${player.armorCardCount || 1})`, color: '#3498db' });
    }
    if (player.wingsCardCount || player.hasWingsPassive) {
      passives.push({ icon: 'wings', label: 'Asas do Vento', val: `+${player.speed.toFixed(1)} Vel (Nv. ${player.wingsCardCount || 1})`, color: '#00cec9' });
    }
    if (player.frostCardCount || (player.slowChance || 0) > 0) {
      passives.push({ icon: 'frost', label: 'Golpe Criogênico', val: `${Math.round(player.slowChance * 100)}% Lento (Nv. ${player.frostCardCount || 1})`, color: '#74b9ff' });
    }
    if (player.orbitals > 0) {
      const isMax = player.orbitals >= 3;
      passives.push({ icon: 'orbitals', label: 'Bíblias Protetoras', val: `${player.orbitals}/3 Tomos${isMax ? ' (MÁX)' : ''} ${player.evolvedOrbitals ? '(Vórtice)' : ''}`.trim(), color: '#9b59b6' });
    }
    if (player.auraLvl > 0) {
      const isMax = player.auraLvl >= 5;
      passives.push({ icon: 'aura', label: 'Aura Sagrada', val: `Nv ${player.auraLvl}/5${isMax ? ' (MÁX)' : ''} ${player.evolvedAura ? '(Santuário)' : ''}`.trim(), color: '#f1c40f' });
    }
    if (player.critCardCount || player.critChance > 0.05) {
      passives.push({ icon: 'crit', label: 'Foco Letal', val: `${Math.round(player.critChance * 100)}% Crítico (Nv. ${player.critCardCount || 1})`, color: '#f39c12' });
    }
    if (player.hasteCardCount || (player.cooldownReduction || 0) > 0) {
      passives.push({ icon: 'cooldown', label: 'Fúria Rápida', val: `-${Math.round((player.cooldownReduction || 0) * 100)}% CDR (Nv. ${player.hasteCardCount || 1})`, color: '#e67e22' });
    }
    if (player.ultCooldownCount) {
      passives.push({ icon: 'ult_cooldown', label: 'Ímpeto Supremo', val: `-${player.ultCooldownCount * 5}% Recarga ULT (Nv. ${player.ultCooldownCount})`, color: '#c084fc' });
    }
    if (player.magnetCardCount) {
      passives.push({ icon: 'magnet', label: 'Ímã Titânico', val: `+${player.magnetCardCount * 30}px (Nv. ${player.magnetCardCount})`, color: '#9b59b6' });
    }

    if (passives.length === 0) {
      passivesFlow.innerHTML = `<span style="font-size:9.5px; color:#64748b; font-style:italic;">Nenhuma passiva ancestral consagrada ainda.</span>`;
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
      player.destinyPacts.forEach(p => {
        const chip = document.createElement('div');
        chip.className = 'pause-passive-chip';
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
    const synList = getSynergyTrackerList(player);

    synTracker.innerHTML = synList.map(s => {
      let cardClass = 'pause-synergy-card';
      let statusColor = '#8c94a8';
      let statusContent = s.req;

      if (s.isEvolved) {
        cardClass += ' is-evolved';
        statusColor = '#ffd166';
        statusContent = `${renderIcon('star_evolution', { size: 9, color: '#ffd166' })} CONSAGRADO`;
      } else if (s.isReady) {
        cardClass += ' is-ready';
        statusColor = '#00f5d4';
        statusContent = `${renderIcon('check', { size: 9, color: '#00f5d4' })} PRONTO (ABRA BAÚ)`;
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
    joyBadge.innerText = currentMode === JOYSTICK_MODES.DYNAMIC ? 'DINÂMICO' : 'FLUTUANTE';
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
    if (currentGfx === GRAPHICS_QUALITY.NATIVE) {
      gfxBadge.innerText = `NATIVA (${nativeDpr.toFixed(1)}x)`;
      gfxBadge.style.color = '#00f5d4';
    } else if (currentGfx === GRAPHICS_QUALITY.HIGH) {
      gfxBadge.innerText = `ALTA (${curDpr.toFixed(1)}x)`;
      gfxBadge.style.color = '#ffd166';
    } else {
      gfxBadge.innerText = `ECONÔMICA (${curDpr.toFixed(1)}x)`;
      gfxBadge.style.color = '#ff9f43';
    }
  }

  if (gfxSubtext && bufferW > 0 && bufferH > 0) {
    gfxSubtext.innerText = `Renderizando em ${bufferW} × ${bufferH} px (fator ${curDpr.toFixed(2)}x)`;
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

