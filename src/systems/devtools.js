/**
 * src/systems/devtools.js
 * Console Secreto de Desenvolvedor & Sandbox de Testes (Atalho W + 5)
 * Totalmente invisível na UI normal (sem botões públicos).
 */

import { BOSS_TYPES, MINI_BOSS_TYPES } from '../config/enemies.js';
import { grantLevels, checkSynergies, upgradesPool, BLESSING_UPGRADE } from '../config/upgrades.js';
import { player, addPersistentGold, getPersistentGold, resetPlayer } from '../entities/player.js';
import { CHARACTERS } from '../config/characters.js';
import { playSfx } from '../core/audio.js';
import { 
  launchBossTest, 
  launchMiniBossTest, 
  closeBossSelectModal,
  openCharacterSelect,
  renderBestiaryRoster,
  renderBestiaryDossier,
  selectedCreatureId,
  triggerDeath,
  queueManualLevelUps,
  levelUp
} from './ui.js';
import { openChestModal } from '../ui/modals/chestModal.js';
import { 
  unlockAllAchievements, 
  resetAchievements, 
  saveBestRun 
} from '../config/achievements.js';
import { 
  unlockAllBestiary, 
  resetBestiary 
} from '../config/bestiary.js';
import { 
  purgeAllNormalEnemies, 
  triggerSuperMagnet, 
  warpToWaveTime 
} from '../main.js';
import { spawnBloodAltar } from './worldEvents.js';

export const devCheats = {
  godMode: false,
  zeroCooldown: false,
  oneHitBossPhase: false,
  gameSpeed: 1.0,
  selectedLevel: 25,
  levelUpgradeMode: 'auto', // 'auto' | 'manual'
  activeTab: 'encounters',  // 'encounters' | 'levels' | 'cheats' | 'waves'
  minibossSearch: '',
  minibossCategory: 'all',
  isMinibossAccordionOpen: false
};

let toastTimeout = null;

/**
 * Exibe notificação flutuante temporária para ações do desenvolvedor
 */
export function showDevToast(message, isWarning = false) {
  let toast = document.getElementById('dev-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dev-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = message;
  toast.className = 'dev-toast show' + (isWarning ? ' dev-toast-warn' : '');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

/**
 * Alterna o Modo Deus (God Mode)
 */
export function toggleGodMode() {
  devCheats.godMode = !devCheats.godMode;
  if (devCheats.godMode) {
    player.hp = player.maxHp;
    player.iFrames = 999999;
    showDevToast('🛡️ <b>Modo Deus:</b> ATIVADO (Imortalidade)');
    playSfx('level');
  } else {
    player.iFrames = 0;
    showDevToast('🛡️ <b>Modo Deus:</b> DESATIVADO');
    playSfx('hit');
  }
  updateCheatsUI();
  renderHeroStatusStrip();
}

/**
 * Alterna Recarga Zero (Zero CD para Habilidades)
 */
export function toggleZeroCooldown() {
  devCheats.zeroCooldown = !devCheats.zeroCooldown;
  if (devCheats.zeroCooldown) {
    player.skillCd = 0;
    showDevToast('⚡ <b>Zero Cooldown:</b> ATIVADO');
    playSfx('level');
  } else {
    showDevToast('⚡ <b>Zero Cooldown:</b> DESATIVADO');
    playSfx('hit');
  }
  updateCheatsUI();
  renderHeroStatusStrip();
}

/**
 * Alterna modo onde cada golpe derrota uma fase do chefe
 */
export function toggleOneHitBossPhase() {
  devCheats.oneHitBossPhase = !devCheats.oneHitBossPhase;
  if (devCheats.oneHitBossPhase) {
    showDevToast('⚔️ <b>1 Hit Derrota Fase do Chefe:</b> ATIVADO');
    playSfx('level');
  } else {
    showDevToast('⚔️ <b>1 Hit Derrota Fase do Chefe:</b> DESATIVADO');
    playSfx('hit');
  }
  updateCheatsUI();
  renderHeroStatusStrip();
}

/**
 * Calcula o dano necessário para que um golpe do jogador derrote a fase atual
 * do chefe ou o derrote completamente na última fase (ou mini-chefes/subalvos).
 */
export function getBossPhaseDefeatDamage(e, baseDmg = 0) {
  if (!devCheats.oneHitBossPhase || !e || e.hp <= 0) return baseDmg;

  // Sub-alvos de chefes (como âncoras cósmicas do Soberano ou litocistos do Monólito): 1 hit destrói
  if (e.isBossSubTarget) {
    return Math.max(baseDmg, e.hp);
  }

  // Mini-chefes sem fases múltiplas: 1 hit derrota
  if (e.isMiniBoss && !e.isBoss) {
    return Math.max(baseDmg, e.hp);
  }

  // Se não for chefe, causa dano normal
  if (!e.isBoss) return baseDmg;

  // Se o chefe estiver em animação de introdução, transição de fase ou colapso fatal, preserva o fluxo cinemático
  if (e.phaseCinematic || (e.actionState && (/TRANSITION/.test(e.actionState) || e.actionState === 'SPAWN_INTRO' || e.actionState === 'DEATH_COLLAPSE'))) {
    return baseDmg;
  }

  const bossId = Number(e.bossId) || (e.isFinalBoss ? 4 : 1);
  const curPhase = e.phase || 1;

  switch (bossId) {
    case 1: {
      if (!e.hasEnraged && !e.isEnraged && curPhase === 1) {
        const targetHp = Math.max(1, Math.floor(e.maxHp * 0.43));
        return Math.max(baseDmg, Math.max(0, e.hp - targetHp));
      }
      return Math.max(baseDmg, e.hp);
    }
    case 2: {
      if (!e.hasTransitionedP2 && !e.isEnraged && curPhase === 1) {
        const targetHp = Math.max(1, Math.floor(e.maxHp * 0.58));
        return Math.max(baseDmg, Math.max(0, e.hp - targetHp));
      }
      if (!e.isPhase3 && (curPhase === 2 || e.hasTransitionedP2 || e.isEnraged)) {
        const targetHp = Math.max(1, Math.floor(e.maxHp * 0.23));
        return Math.max(baseDmg, Math.max(0, e.hp - targetHp));
      }
      return Math.max(baseDmg, e.hp);
    }
    case 3: {
      if (!e.hasEnraged && curPhase === 1) {
        const targetHp = Math.max(1, Math.floor(e.maxHp * 0.43));
        return Math.max(baseDmg, Math.max(0, e.hp - targetHp));
      }
      if (!e.isPhase3 && (curPhase === 2 || e.hasEnraged)) {
        const targetHp = Math.max(1, Math.floor(e.maxHp * 0.18));
        return Math.max(baseDmg, Math.max(0, e.hp - targetHp));
      }
      return Math.max(baseDmg, e.hp);
    }
    case 4:
    default: {
      if (!e.hasTriggeredPhase2 && curPhase === 1) {
        const targetHp = Math.max(1, Math.floor(e.maxHp * 0.68));
        return Math.max(baseDmg, Math.max(0, e.hp - targetHp));
      }
      if (!e.hasTriggeredPhase3 && (curPhase === 2 || e.hasTriggeredPhase2)) {
        const targetHp = Math.max(1, Math.floor(e.maxHp * 0.28));
        return Math.max(baseDmg, Math.max(0, e.hp - targetHp));
      }
      return Math.max(baseDmg, e.hp);
    }
  }
}

/**
 * Aplica cura completa imediata ao herói
 */
export function healPlayerFull() {
  player.hp = player.maxHp;
  if (player.slowTimer) player.slowTimer = 0;
  showDevToast(`❤️ <b>Cura Plena:</b> Vida restaurada para ${player.maxHp} HP!`);
  playSfx('level');
  renderHeroStatusStrip();
}

/**
 * Concede rolagens de cartas extras
 */
export function grantExtraRerolls(count = 5) {
  player.rerolls = (player.rerolls || 0) + count;
  const countEl = document.getElementById('reroll-count');
  if (countEl) countEl.innerText = player.rerolls;
  showDevToast(`🎲 <b>+${count} Rerolls</b> concedidos! Total: ${player.rerolls}`);
  playSfx('level');
}

/**
 * Adiciona ouro persistente ao cofre
 */
export function addDevGold(amount = 1000) {
  const next = addPersistentGold(amount);
  showDevToast(`💰 <b>+${amount.toLocaleString('pt-BR')} Ouro!</b> Total: ${next.toLocaleString('pt-BR')}`);
  playSfx('chest_rare');
}

/**
 * Define a velocidade global do motor de jogo
 */
export function setGameSpeed(speed) {
  devCheats.gameSpeed = speed;
  showDevToast(`⏩ <b>Velocidade do Jogo:</b> ${speed}x`);
  playSfx('level');
  updateGameSpeedUI();
  renderHeroStatusStrip();
}

/**
 * Aplica níveis e bênçãos ao herói respeitando o modo selecionado (Auto ou Manual)
 */
export function applyLevelsToHero(count = devCheats.selectedLevel, mode = devCheats.levelUpgradeMode) {
  const levels = Math.max(1, Math.min(100, Math.floor(count)));

  if (mode === 'auto') {
    grantLevels(levels);
    showDevToast(`⚡ <b>+${levels} Níveis & Upgrades</b> concedidos automaticamente!`);
    playSfx('level');
    renderHeroStatusStrip();
    renderDevToolsModal();
  } else {
    closeBossSelectModal();
    queueManualLevelUps(levels);
    showDevToast(`🎴 <b>+${levels} Bênçãos do Tarô</b> enfileiradas para seleção manual!`);
  }
}

/**
 * Retrocompatibilidade para chamadas diretas
 */
export function applyLevelToCurrentHero() {
  applyLevelsToHero(devCheats.selectedLevel, devCheats.levelUpgradeMode);
}

/**
 * Reseta o herói em jogo de volta ao Nível 1 com atributos iniciais
 */
export function resetHeroToLevel1() {
  const currentHeroKey = player.selectedHeroKey || player.characterKey || 'KNIGHT';
  resetPlayer(currentHeroKey);
  showDevToast(`🔄 <b>Herói Resetado:</b> Nível 1, vida restaurada e armas iniciais redefinidas!`);
  playSfx('hit');
  renderHeroStatusStrip();
  renderDevToolsModal();
}

/**
 * Maximiza os tiers de todas as armas atualmente equipadas pelo herói
 */
export function maximizeActiveWeapons() {
  if (!player.weapons || player.weapons.length === 0) {
    showDevToast('⚠️ Nenhuma arma ativa para maximizar.', true);
    return;
  }

  let count = 0;
  player.weapons.forEach(w => {
    const maxVal = (w.type === 'AXE' || w.type === 'ORBITALS') ? 3 : 5;
    w.count = maxVal;
    if (w.damageMult) w.damageMult = Math.max(w.damageMult, 1.8);
    count++;
  });

  if (player.axeCount !== undefined && player.axeCount > 0) {
    player.axeCount = 3;
    player.axeDamageMult = 1.6;
  }
  if (player.orbitals !== undefined && player.orbitals > 0) {
    player.orbitals = 3;
  }

  showDevToast(`🗡️ <b>${count} Armas Maximizadas</b> para seu potencial limite!`);
  playSfx('level');
  renderHeroStatusStrip();
}

/**
 * Concede reforços substanciais de defesa (+250 Max HP e +8 Armadura Rúnica)
 */
export function boostHeroDefenses() {
  player.maxHp = (player.maxHp || 100) + 250;
  player.hp = player.maxHp;
  player.armor = (player.armor || 0) + 8;
  showDevToast(`🛡️ <b>Defesas Forjadas:</b> +250 Max HP e +8 Armadura concedidos!`);
  playSfx('level');
  renderHeroStatusStrip();
}

/**
 * Aplica uma fusão/sinergia lendária elegível de imediato
 */
export function forgeAvailableSynergy() {
  const synergies = checkSynergies();
  if (synergies && synergies.length > 0) {
    const syn = synergies[0];
    syn.apply(player);
    showDevToast(`✨ <b>Sinergia Forjada:</b> ${syn.name}!`);
    playSfx('chest_rare');
    renderHeroStatusStrip();
  } else {
    // Força a evolução da arma inicial
    if (!player.evolvedHammer && player.weapons.some(w => w.type === 'HAMMER')) {
      player.evolvedHammer = true;
      showDevToast(`✨ <b>Fusão Forjada:</b> Martelo dos Titãs ativado!`);
      playSfx('chest_rare');
    } else if (!player.evolvedSword && player.weapons.some(w => w.type === 'SWORD')) {
      player.evolvedSword = true;
      showDevToast(`✨ <b>Fusão Forjada:</b> Lâmina Dimensional ativada!`);
      playSfx('chest_rare');
    } else if (!player.evolvedAxe && player.axeCount > 0) {
      player.evolvedAxe = true;
      showDevToast(`✨ <b>Fusão Forjada:</b> Tempestade de Aço ativada!`);
      playSfx('chest_rare');
    } else {
      showDevToast(`ℹ️ Nenhuma fusão elegível no momento. Equipe armas e passivas correspondentes.`);
    }
    renderHeroStatusStrip();
  }
}

/**
 * Mapeamento e categorização dos 16 minibosses
 */
const MINIBOSS_META = {
  BLOOD_GARGOYLE:   { cat: 'dash', label: 'Investida Sangrenta' },
  ZOMBIE_ALPHA:     { cat: 'chase', label: 'Perseguição Voraz' },
  PHALANX_LEADER:   { cat: 'tank', label: 'Escudo Blindado' },
  SEISMIC_SMASHER:  { cat: 'tank', label: 'Pisotão Sísmico' },
  ARTILLERY_MECH:   { cat: 'ranged', label: 'Torre Balística' },
  FIRE_INCINERATOR: { cat: 'ranged', label: 'Chamas Kamikaze' },
  BROOD_MATRIARCH:  { cat: 'chaos', label: 'Ninho de Parasitas' },
  SPECTRAL_STALKER: { cat: 'dash', label: 'Salto pelas Costas' },
  HIGH_OCCULTIST:   { cat: 'chaos', label: 'Ritual Gravitacional' },
  RUNIC_WARDEN:     { cat: 'tank', label: 'Aura Protetora' },
  RUST_COLOSSUS:    { cat: 'tank', label: 'Arremesso de Rocha' },
  SIEGE_CAPTAIN:    { cat: 'ranged', label: 'Barragem de Morteiro' },
  MOBILE_HIVE:      { cat: 'chaos', label: 'Enxame de Morcegos' },
  QUANTUM_SLICER:   { cat: 'dash', label: 'Teleporte & Golpe' },
  VOID_PRECURSOR:   { cat: 'chaos', label: 'Vórtice do Vazio' },
  CHAOS_HERALD:     { cat: 'chaos', label: 'Ciclo do Caos' }
};

/**
 * Renderiza todo o conteúdo do modal de DevTools
 */
export function renderDevToolsModal() {
  const container = document.getElementById('devtools-content');
  if (!container) return;

  renderHeroStatusStrip();
  renderTabsNav();
  renderActiveTab();
}

/**
 * Renderiza a Barra de Telemetria e Status Rápido do Herói no topo do DevTools
 */
export function renderHeroStatusStrip() {
  let strip = document.getElementById('devtools-hero-strip');
  if (!strip) {
    strip = document.createElement('div');
    strip.id = 'devtools-hero-strip';
    strip.className = 'dev-hero-status-strip';
    const tabs = document.getElementById('devtools-tabs');
    if (tabs && tabs.parentNode) {
      tabs.parentNode.insertBefore(strip, tabs);
    }
  }

  const charKey = player.selectedHeroKey || player.characterKey || 'KNIGHT';
  const charData = CHARACTERS[charKey] || { name: 'Herói', color: { armor: '#a855f7' } };
  const currentLvl = player.level || 1;
  const currentHp = Math.max(0, Math.round(player.hp || 0));
  const maxHp = Math.round(player.maxHp || 100);
  const hpPct = Math.min(100, Math.max(0, Math.round((currentHp / maxHp) * 100)));

  // Pílulas das armas ativas
  const weaponBadges = (player.weapons && player.weapons.length > 0)
    ? player.weapons.map(w => `<span class="dev-strip-wpn-pill" title="${w.type} (Nv. ${w.count || 1})">${w.type} <b>v${w.count || 1}</b></span>`).join('')
    : '<span class="dev-strip-wpn-none">Nenhuma arma</span>';

  // Badges de cheats ativos
  const activeCheats = [];
  if (devCheats.godMode) activeCheats.push('<span class="dev-strip-cheat-badge god">🛡️ DEUS</span>');
  if (devCheats.zeroCooldown) activeCheats.push('<span class="dev-strip-cheat-badge cd">⚡ ZERO CD</span>');
  if (devCheats.oneHitBossPhase) activeCheats.push('<span class="dev-strip-cheat-badge hit">⚔️ 1-HIT</span>');
  if (devCheats.gameSpeed !== 1.0) activeCheats.push(`<span class="dev-strip-cheat-badge spd">⏩ ${devCheats.gameSpeed}x</span>`);

  strip.innerHTML = `
    <div class="dev-strip-hero-info">
      <div class="dev-strip-avatar" style="border-color: ${charData.color?.armor || '#a855f7'};">
        ${charData.name.charAt(0)}
      </div>
      <div class="dev-strip-text">
        <div class="dev-strip-name-row">
          <span class="dev-strip-name">${charData.name}</span>
          <span class="dev-strip-lvl-badge">Nv. ${currentLvl}</span>
          <span class="dev-strip-mode-badge ${devCheats.levelUpgradeMode}">
            ${devCheats.levelUpgradeMode === 'auto' ? '⚡ Modo Auto' : '🎴 Modo Tarô'}
          </span>
        </div>
        <div class="dev-strip-hp-row">
          <div class="dev-strip-hp-bar">
            <div class="dev-strip-hp-fill" style="width: ${hpPct}%;"></div>
          </div>
          <span class="dev-strip-hp-val">${currentHp}/${maxHp} HP</span>
        </div>
      </div>
    </div>

    <div class="dev-strip-right">
      <div class="dev-strip-weapons-list">
        ${weaponBadges}
      </div>
      <div class="dev-strip-cheats-list">
        ${activeCheats.length > 0 ? activeCheats.join('') : '<span class="dev-strip-no-cheats">Cheats Desativados</span>'}
      </div>
    </div>
  `;
}

function renderTabsNav() {
  const tabsContainer = document.getElementById('devtools-tabs');
  if (!tabsContainer) return;

  tabsContainer.innerHTML = `
    <button class="dev-tab-btn ${devCheats.activeTab === 'encounters' ? 'active' : ''}" data-tab="encounters">
      ⚔️ ENCONTROS & BOSSES
    </button>
    <button class="dev-tab-btn ${devCheats.activeTab === 'levels' ? 'active' : ''}" data-tab="levels">
      ✨ NÍVEIS & ARSENAL
    </button>
    <button class="dev-tab-btn ${devCheats.activeTab === 'cheats' ? 'active' : ''}" data-tab="cheats">
      🧪 SANDBOX & CHEATS
    </button>
    <button class="dev-tab-btn ${devCheats.activeTab === 'waves' ? 'active' : ''}" data-tab="waves">
      🌐 MUNDO & SAVES
    </button>
  `;

  tabsContainer.querySelectorAll('.dev-tab-btn').forEach(btn => {
    btn.onclick = () => {
      devCheats.activeTab = btn.getAttribute('data-tab');
      renderTabsNav();
      renderActiveTab();
    };
  });
}

function renderActiveTab() {
  const content = document.getElementById('devtools-tab-pane');
  if (!content) return;
  content.innerHTML = '';

  if (devCheats.activeTab === 'encounters') {
    renderEncountersTab(content);
  } else if (devCheats.activeTab === 'levels') {
    renderLevelsTab(content);
  } else if (devCheats.activeTab === 'cheats') {
    renderCheatsTab(content);
  } else if (devCheats.activeTab === 'waves') {
    renderWavesTab(content);
  }
}

/**
 * ========================================================
 * ABA 1: ENCONTROS (Bosses Supremos & Minibosses de Elite)
 * ========================================================
 */
function renderEncountersTab(container) {
  // Faixa de Resumo de Boost dos Encontros
  const boostSummary = document.createElement('div');
  boostSummary.className = 'dev-boost-summary-strip';
  boostSummary.innerHTML = `
    <div class="dev-boost-summary-left">
      <span class="dev-boost-icon">⚡</span>
      <div class="dev-boost-text">
        <span class="dev-boost-title">BOOST DE NÍVEL PARA TESTES:</span>
        <b class="dev-boost-val">+${devCheats.selectedLevel} Níveis</b>
        <span class="dev-boost-mode-tag ${devCheats.levelUpgradeMode}">
          ${devCheats.levelUpgradeMode === 'auto' ? '⚡ Escolha Automática' : '🎴 Seleção Manual no Tarô'}
        </span>
      </div>
    </div>
    <button class="dev-btn-adjust-levels" id="dev-btn-go-levels-tab" title="Alternar entre modo automático e seleção carta a carta na aba de Níveis">
      ⚙️ Ajustar Modo & Níveis
    </button>
  `;
  container.appendChild(boostSummary);

  const goLevelsBtn = boostSummary.querySelector('#dev-btn-go-levels-tab');
  if (goLevelsBtn) {
    goLevelsBtn.onclick = () => {
      devCheats.activeTab = 'levels';
      renderTabsNav();
      renderActiveTab();
    };
  }

  // 1. Chefes Supremos de Fase (Grid de 4 Cards)
  const bossHeader = document.createElement('div');
  bossHeader.className = 'dev-section-title';
  bossHeader.style.display = 'flex';
  bossHeader.style.justifyContent = 'space-between';
  bossHeader.style.alignItems = 'center';
  bossHeader.innerHTML = `
    <div>
      <span>⚔️ CHEFES SUPREMOS DE FASE (1 A 4)</span>
      <span class="dev-title-sub">Encontros Colossais com Mecânicas FSM</span>
    </div>
    <button class="dev-quick-toggle-phase ${devCheats.oneHitBossPhase ? 'active' : ''}" id="btn-quick-one-hit-phase" title="Cada golpe desfere dano suficiente para avançar imediatamente para a próxima fase do chefe">
      <span>⚡ 1 Hit = Derrotar Fase:</span>
      <b style="color: ${devCheats.oneHitBossPhase ? '#2ecc71' : '#e74c3c'};">${devCheats.oneHitBossPhase ? 'LIGADO' : 'DESLIGADO'}</b>
    </button>
  `;
  container.appendChild(bossHeader);

  const quickToggleBtn = bossHeader.querySelector('#btn-quick-one-hit-phase');
  if (quickToggleBtn) {
    quickToggleBtn.onclick = () => {
      toggleOneHitBossPhase();
    };
  }

  const bossesGrid = document.createElement('div');
  bossesGrid.className = 'dev-bosses-grid';

  Object.keys(BOSS_TYPES).forEach(id => {
    const boss = BOSS_TYPES[id];
    const card = document.createElement('div');
    card.className = 'dev-boss-card';
    card.style.setProperty('--boss-color', boss.color || '#a855f7');

    const boostLabel = devCheats.levelUpgradeMode === 'auto'
      ? `⚡ +${devCheats.selectedLevel} Nv (Auto)`
      : `🎴 +${devCheats.selectedLevel} Nv (Tarô)`;

    card.innerHTML = `
      <div class="dev-boss-header">
        <div class="dev-boss-avatar" style="background: ${boss.color}22; border-color: ${boss.color}; color: ${boss.color};">
          #${id}
        </div>
        <div class="dev-boss-info">
          <div class="dev-boss-name" style="color: ${boss.color};">${boss.name}</div>
          <div class="dev-boss-stats">
            <span>❤️ ${boss.hp.toLocaleString('pt-BR')} HP</span>
            <span>💥 Dano: ${boss.damage}</span>
            ${boss.isFinalBoss ? '<span class="dev-badge-final">FINAL BOSS</span>' : ''}
          </div>
        </div>
      </div>
      <div class="dev-boss-actions">
        <button class="dev-btn-test-normal" data-boss-id="${id}" title="Invocar no nível atual do herói sem conceder bônus">
          ⚔️ Nível Atual
        </button>
        <button class="dev-btn-test-boost" data-boss-id="${id}" title="Invocar com +${devCheats.selectedLevel} níveis (${devCheats.levelUpgradeMode === 'auto' ? 'Automático' : 'Manual'})">
          ${boostLabel}
        </button>
      </div>
    `;

    const normalBtn = card.querySelector('.dev-btn-test-normal');
    const boostBtn = card.querySelector('.dev-btn-test-boost');

    if (normalBtn) normalBtn.onclick = () => launchBossTest(Number(id), 0);
    if (boostBtn) boostBtn.onclick = () => launchBossTest(Number(id), devCheats.selectedLevel);

    bossesGrid.appendChild(card);
  });

  container.appendChild(bossesGrid);

  // 2. Minibosses de Elite - Lista Sanfona (Accordion)
  const accordionContainer = document.createElement('div');
  accordionContainer.className = 'dev-accordion-container' + (devCheats.isMinibossAccordionOpen ? ' open' : '');

  const totalMinibosses = Object.keys(MINI_BOSS_TYPES).length;

  accordionContainer.innerHTML = `
    <div class="dev-accordion-header" id="dev-accordion-toggle">
      <div class="dev-acc-header-left">
        <span class="dev-acc-icon">👾</span>
        <span class="dev-acc-title">MINIBOSSES DE ELITE</span>
        <span class="dev-acc-count">${totalMinibosses} ARQUÉTIPOS</span>
      </div>
      <div class="dev-acc-header-right">
        <span class="dev-acc-state-hint">${devCheats.isMinibossAccordionOpen ? 'Recolher Lista' : 'Expandir Lista'}</span>
        <span class="dev-acc-chevron">▼</span>
      </div>
    </div>

    <div class="dev-accordion-body" id="dev-accordion-body">
      <div class="dev-acc-controls">
        <div class="dev-acc-search-wrap">
          <span class="dev-search-icon">🔍</span>
          <input type="text" id="dev-miniboss-search" class="dev-search-input" placeholder="Buscar por nome ou comportamento..." value="${devCheats.minibossSearch}">
          ${devCheats.minibossSearch ? '<button id="dev-clear-search" class="dev-clear-search">✕</button>' : ''}
        </div>

        <div class="dev-acc-filter-chips">
          <button class="dev-filter-chip ${devCheats.minibossCategory === 'all' ? 'active' : ''}" data-cat="all">Todos (${totalMinibosses})</button>
          <button class="dev-filter-chip ${devCheats.minibossCategory === 'dash' ? 'active' : ''}" data-cat="dash">Rápidos / Dash</button>
          <button class="dev-filter-chip ${devCheats.minibossCategory === 'tank' ? 'active' : ''}" data-cat="tank">Blindados / Tanque</button>
          <button class="dev-filter-chip ${devCheats.minibossCategory === 'ranged' ? 'active' : ''}" data-cat="ranged">Artilharia / Projéteis</button>
          <button class="dev-filter-chip ${devCheats.minibossCategory === 'chaos' ? 'active' : ''}" data-cat="chaos">Caos / Invocadores</button>
        </div>
      </div>

      <div class="dev-minibosses-grid" id="dev-minibosses-grid"></div>
    </div>
  `;

  container.appendChild(accordionContainer);

  const accToggle = accordionContainer.querySelector('#dev-accordion-toggle');
  if (accToggle) {
    accToggle.onclick = () => {
      devCheats.isMinibossAccordionOpen = !devCheats.isMinibossAccordionOpen;
      accordionContainer.classList.toggle('open', devCheats.isMinibossAccordionOpen);
      const hint = accordionContainer.querySelector('.dev-acc-state-hint');
      if (hint) hint.innerText = devCheats.isMinibossAccordionOpen ? 'Recolher Lista' : 'Expandir Lista';
    };
  }

  const searchInput = accordionContainer.querySelector('#dev-miniboss-search');
  if (searchInput) {
    searchInput.oninput = (e) => {
      devCheats.minibossSearch = e.target.value.toLowerCase().trim();
      renderMinibossCards(accordionContainer.querySelector('#dev-minibosses-grid'));
    };
  }

  const clearBtn = accordionContainer.querySelector('#dev-clear-search');
  if (clearBtn) {
    clearBtn.onclick = () => {
      devCheats.minibossSearch = '';
      searchInput.value = '';
      renderMinibossCards(accordionContainer.querySelector('#dev-minibosses-grid'));
    };
  }

  accordionContainer.querySelectorAll('.dev-filter-chip').forEach(chip => {
    chip.onclick = () => {
      devCheats.minibossCategory = chip.getAttribute('data-cat');
      accordionContainer.querySelectorAll('.dev-filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderMinibossCards(accordionContainer.querySelector('#dev-minibosses-grid'));
    };
  });

  renderMinibossCards(accordionContainer.querySelector('#dev-minibosses-grid'));
}

function renderMinibossCards(grid) {
  if (!grid) return;
  grid.innerHTML = '';

  const query = devCheats.minibossSearch;
  const category = devCheats.minibossCategory;

  const filteredKeys = Object.keys(MINI_BOSS_TYPES).filter(key => {
    const mb = MINI_BOSS_TYPES[key];
    const meta = MINIBOSS_META[key] || { cat: 'other', label: mb.behavior };

    if (category !== 'all' && meta.cat !== category) {
      return false;
    }

    if (query) {
      const matchName = mb.name.toLowerCase().includes(query);
      const matchKey = key.toLowerCase().includes(query);
      const matchLabel = meta.label.toLowerCase().includes(query);
      const matchBehavior = (mb.behavior || '').toLowerCase().includes(query);
      if (!matchName && !matchKey && !matchLabel && !matchBehavior) return false;
    }

    return true;
  });

  if (filteredKeys.length === 0) {
    grid.innerHTML = `
      <div class="dev-empty-notice">
        Nenhum miniboss corresponde ao filtro atual.
      </div>
    `;
    return;
  }

  const boostLabel = devCheats.levelUpgradeMode === 'auto'
    ? `⚡ +${devCheats.selectedLevel} (Auto)`
    : `🎴 +${devCheats.selectedLevel} (Tarô)`;

  filteredKeys.forEach(key => {
    const mb = MINI_BOSS_TYPES[key];
    const meta = MINIBOSS_META[key] || { cat: 'other', label: mb.behavior };
    const card = document.createElement('div');
    card.className = 'dev-miniboss-card';
    card.style.setProperty('--mb-color', mb.color || '#f1c40f');

    card.innerHTML = `
      <div class="dev-mb-content">
        <div class="dev-mb-dot" style="background: ${mb.color}; box-shadow: 0 0 8px ${mb.color};"></div>
        <div class="dev-mb-details">
          <div class="dev-mb-title">
            <span class="dev-mb-name">${mb.name}</span>
            <span class="dev-mb-pill">${meta.label}</span>
          </div>
          <div class="dev-mb-stats">
            <span>❤️ ${mb.hp.toLocaleString('pt-BR')} HP</span>
            <span>💥 ${mb.damage} Dano</span>
            <span>🪙 ${mb.gold} Ouro</span>
          </div>
        </div>
      </div>
      <div class="dev-mb-actions">
        <button class="dev-btn-mb-normal" title="Invocar no nível atual">
          ⚔️ Atual
        </button>
        <button class="dev-btn-mb-boost" title="Invocar com +${devCheats.selectedLevel} níveis">
          ${boostLabel}
        </button>
      </div>
    `;

    const normalBtn = card.querySelector('.dev-btn-mb-normal');
    const boostBtn = card.querySelector('.dev-btn-mb-boost');

    if (normalBtn) normalBtn.onclick = () => launchMiniBossTest(key, 0);
    if (boostBtn) boostBtn.onclick = () => launchMiniBossTest(key, devCheats.selectedLevel);

    grid.appendChild(card);
  });
}

/**
 * ========================================================
 * ABA 2: NÍVEIS & ARSENAL (Seletor Inteligente & Modo Dual)
 * ========================================================
 */
function renderLevelsTab(container) {
  // 1. Alternador de Modo: Automático vs Manual (Tarô Arcano)
  const modeSection = document.createElement('div');
  modeSection.className = 'dev-mode-section';
  modeSection.innerHTML = `
    <div class="dev-section-title">
      <span>🎛️ MODO DE ATRIBUIÇÃO DE UPGRADES</span>
      <span class="dev-title-sub">Alterne entre sorteio automático e escolha manual carta a carta</span>
    </div>

    <div class="dev-mode-segmented-switch">
      <button class="dev-mode-pill ${devCheats.levelUpgradeMode === 'auto' ? 'active' : ''}" data-mode="auto">
        <span class="dev-pill-icon">⚡</span>
        <div class="dev-pill-content">
          <div class="dev-pill-title">Automático (Auto-Build)</div>
          <div class="dev-pill-desc">Sorteia e aplica bênçãos e sinergias aleatórias instantaneamente</div>
        </div>
      </button>

      <button class="dev-mode-pill ${devCheats.levelUpgradeMode === 'manual' ? 'active' : ''}" data-mode="manual">
        <span class="dev-pill-icon">🎴</span>
        <div class="dev-pill-content">
          <div class="dev-pill-title">Manual (Tarô Arcano)</div>
          <div class="dev-pill-desc">Abre o Tarô Arcano para você escolher cada carta com rerolls</div>
        </div>
      </button>
    </div>
  `;
  container.appendChild(modeSection);

  modeSection.querySelectorAll('.dev-mode-pill').forEach(pill => {
    pill.onclick = () => {
      devCheats.levelUpgradeMode = pill.getAttribute('data-mode');
      renderHeroStatusStrip();
      renderLevelsTab(container);
    };
  });

  // 2. Ajuste Numérico de Níveis (Stepper + Slider + Presets)
  const curLvl = player.level || 1;
  const projectedLvl = curLvl + devCheats.selectedLevel;

  const levelControlSection = document.createElement('div');
  levelControlSection.className = 'dev-slider-section';
  levelControlSection.innerHTML = `
    <div class="dev-slider-header">
      <div class="dev-slider-title-group">
        <span class="dev-tag-pill">QUANTIDADE DE NÍVEIS</span>
        <span class="dev-slider-label">PROGRESSÃO DO HERÓI:</span>
      </div>
      <div class="dev-level-projection-chip">
        Nv. ${curLvl} ➔ <b style="color: #ffd166;">Nv. ${projectedLvl}</b> (+${devCheats.selectedLevel} Níveis)
      </div>
    </div>

    <div class="dev-stepper-wrap">
      <button class="dev-stepper-btn" data-step="-10" title="-10 Níveis">-10</button>
      <button class="dev-stepper-btn" data-step="-5" title="-5 Níveis">-5</button>
      <button class="dev-stepper-btn" data-step="-1" title="-1 Nível">-1</button>
      
      <div class="dev-stepper-display">
        <span class="dev-stepper-prefix">+</span>
        <input type="number" id="dev-level-input" class="dev-stepper-input" min="1" max="100" value="${devCheats.selectedLevel}">
        <span class="dev-stepper-suffix">Níveis</span>
      </div>

      <button class="dev-stepper-btn" data-step="1" title="+1 Nível">+1</button>
      <button class="dev-stepper-btn" data-step="5" title="+5 Níveis">+5</button>
      <button class="dev-stepper-btn" data-step="10" title="+10 Níveis">+10</button>
    </div>

    <div class="dev-slider-track-wrap">
      <input type="range" id="dev-level-slider" class="dev-slider-input" min="1" max="100" value="${devCheats.selectedLevel}" step="1">
    </div>

    <div class="dev-presets-row">
      <div class="dev-presets-chips">
        <button class="dev-preset-chip" data-lvl="1">+1 (Próximo)</button>
        <button class="dev-preset-chip" data-lvl="5">+5 Nvs</button>
        <button class="dev-preset-chip" data-lvl="10">+10 Nvs</button>
        <button class="dev-preset-chip" data-lvl="25">+25 Nvs</button>
        <button class="dev-preset-chip" data-lvl="50">+50 Nvs</button>
        <button class="dev-preset-chip" data-lvl="100">+100 Nvs (Max)</button>
      </div>
    </div>

    <div class="dev-level-actions-row">
      <button class="dev-btn-apply-hero-main ${devCheats.levelUpgradeMode}" id="dev-btn-apply-levels">
        ${devCheats.levelUpgradeMode === 'auto' 
          ? `⚡ Aplicar +${devCheats.selectedLevel} Níveis Automaticamente` 
          : `🎴 Iniciar Seleção de +${devCheats.selectedLevel} Bênçãos no Tarô`}
      </button>

      <button class="dev-btn-reset-hero-lvl" id="dev-btn-reset-hero" title="Redefine o herói para o Nível 1 com vida cheia e armas padrão da classe">
        🔄 Resetar para Nv. 1
      </button>
    </div>
  `;
  container.appendChild(levelControlSection);

  // Fiação de Eventos do Stepper & Slider
  const slider = levelControlSection.querySelector('#dev-level-slider');
  const numInput = levelControlSection.querySelector('#dev-level-input');
  const projChip = levelControlSection.querySelector('.dev-level-projection-chip');
  const applyBtn = levelControlSection.querySelector('#dev-btn-apply-levels');
  const resetBtn = levelControlSection.querySelector('#dev-btn-reset-hero');

  const updateLevelUI = (val) => {
    const clamped = Math.max(1, Math.min(100, Math.floor(val)));
    devCheats.selectedLevel = clamped;
    slider.value = clamped;
    numInput.value = clamped;
    const cur = player.level || 1;
    projChip.innerHTML = `Nv. ${cur} ➔ <b style="color: #ffd166;">Nv. ${cur + clamped}</b> (+${clamped} Níveis)`;
    applyBtn.innerHTML = devCheats.levelUpgradeMode === 'auto'
      ? `⚡ Aplicar +${clamped} Níveis Automaticamente`
      : `🎴 Iniciar Seleção de +${clamped} Bênçãos no Tarô`;
  };

  if (slider) slider.oninput = (e) => updateLevelUI(parseInt(e.target.value, 10));
  if (numInput) numInput.oninput = (e) => updateLevelUI(parseInt(e.target.value, 10) || 1);

  levelControlSection.querySelectorAll('.dev-stepper-btn').forEach(btn => {
    btn.onclick = () => {
      const step = parseInt(btn.getAttribute('data-step'), 10);
      updateLevelUI(devCheats.selectedLevel + step);
    };
  });

  levelControlSection.querySelectorAll('.dev-preset-chip').forEach(chip => {
    chip.onclick = () => {
      const lvl = parseInt(chip.getAttribute('data-lvl'), 10);
      updateLevelUI(lvl);
    };
  });

  if (applyBtn) {
    applyBtn.onclick = () => {
      applyLevelsToHero(devCheats.selectedLevel, devCheats.levelUpgradeMode);
    };
  }

  if (resetBtn) {
    resetBtn.onclick = () => {
      resetHeroToLevel1();
    };
  }

  // 3. Forja Rápida de Arsenal & Sinergias
  const armorySection = document.createElement('div');
  armorySection.className = 'dev-armory-section';
  armorySection.innerHTML = `
    <div class="dev-section-title" style="margin-top: 14px;">
      <span>⚔️ FORJA RÁPIDA DE ARSENAL & SINERGIAS</span>
      <span class="dev-title-sub">Atalhos diretos para forjar armas e combos</span>
    </div>

    <div class="dev-armory-grid">
      <div class="dev-armory-card" id="card-max-weapons">
        <div class="dev-armory-icon">🗡️</div>
        <div class="dev-armory-info">
          <div class="dev-armory-title">Maximizar Armas Ativas</div>
          <div class="dev-armory-desc">Eleva todas as armas equipadas ao tier e contagem máxima da classe.</div>
        </div>
        <button class="dev-armory-btn">Maximizar</button>
      </div>

      <div class="dev-armory-card" id="card-forge-synergy">
        <div class="dev-armory-icon">✨</div>
        <div class="dev-armory-info">
          <div class="dev-armory-title">Forjar Sinergia Pronta</div>
          <div class="dev-armory-desc">Aplica imediatamente a fusão lendária pronta das armas em seu inventário.</div>
        </div>
        <button class="dev-armory-btn btn-gold">Forjar Fusão</button>
      </div>

      <div class="dev-armory-card" id="card-boost-defenses">
        <div class="dev-armory-icon">🛡️</div>
        <div class="dev-armory-info">
          <div class="dev-armory-title">Super Vitalidade & Armadura</div>
          <div class="dev-armory-desc">Concede +250 HP Máximo e +8 de Armadura Rúnica instantâneos.</div>
        </div>
        <button class="dev-armory-btn">Reforçar</button>
      </div>

      <div class="dev-armory-card" id="card-add-10-rerolls">
        <div class="dev-armory-icon">🎲</div>
        <div class="dev-armory-info">
          <div class="dev-armory-title">+10 Rerolls de Cartas</div>
          <div class="dev-armory-desc">Adiciona 10 rolagens de dados extras para redistribuir bênçãos no Tarô.</div>
        </div>
        <button class="dev-armory-btn">+10 Rerolls</button>
      </div>

      <div class="dev-armory-card" id="card-test-tarot-single">
        <div class="dev-armory-icon">🎴</div>
        <div class="dev-armory-info">
          <div class="dev-armory-title">Abrir Tarô Arcano (1 Bênção)</div>
          <div class="dev-armory-desc">Gera 1 nível pendente e abre a tela oficial de escolhas de cartas imediatamente.</div>
        </div>
        <button class="dev-armory-btn btn-gold">Abrir Tarô</button>
      </div>
    </div>
  `;
  container.appendChild(armorySection);

  const maxWpn = armorySection.querySelector('#card-max-weapons');
  if (maxWpn) maxWpn.onclick = () => maximizeActiveWeapons();

  const forgeSyn = armorySection.querySelector('#card-forge-synergy');
  if (forgeSyn) forgeSyn.onclick = () => forgeAvailableSynergy();

  const boostDef = armorySection.querySelector('#card-boost-defenses');
  if (boostDef) boostDef.onclick = () => boostHeroDefenses();

  const addRerolls = armorySection.querySelector('#card-add-10-rerolls');
  if (addRerolls) addRerolls.onclick = () => grantExtraRerolls(10);

  const testTarot = armorySection.querySelector('#card-test-tarot-single');
  if (testTarot) {
    testTarot.onclick = () => {
      closeBossSelectModal();
      levelUp();
    };
  }
}

/**
 * ========================================================
 * ABA 3: SANDBOX & CHEATS (Organizada em 3 Categorias)
 * ========================================================
 */
function renderCheatsTab(container) {
  const cheatsSection = document.createElement('div');
  cheatsSection.className = 'dev-cheats-section';

  cheatsSection.innerHTML = `
    <!-- Categoria 1: Modificadores & Imunidades -->
    <div class="dev-section-title">
      <span>🛡️ MODIFICADORES & IMUNIDADES CONTÍNUAS</span>
      <span class="dev-title-sub">Estados persistentes de invulnerabilidade</span>
    </div>

    <div class="dev-cheats-grid">
      <!-- Modo Deus -->
      <div class="dev-cheat-card ${devCheats.godMode ? 'active' : ''}" id="card-god-mode">
        <div class="dev-cheat-icon">🛡️</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name">Modo Deus (Imortal)</div>
          <div class="dev-cheat-desc">Herói fica imune a dano, veneno e mantém HP máximo constante.</div>
        </div>
        <div class="dev-cheat-toggle">
          <span class="dev-toggle-badge">${devCheats.godMode ? 'LIGADO' : 'DESLIGADO'}</span>
        </div>
      </div>

      <!-- Zero CD -->
      <div class="dev-cheat-card ${devCheats.zeroCooldown ? 'active' : ''}" id="card-zero-cd">
        <div class="dev-cheat-icon">⚡</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name">Sem Recarga (Zero CD)</div>
          <div class="dev-cheat-desc">Habilidade ativa do herói pronta a todo instante sem esperar tempo de recarga.</div>
        </div>
        <div class="dev-cheat-toggle">
          <span class="dev-toggle-badge">${devCheats.zeroCooldown ? 'LIGADO' : 'DESLIGADO'}</span>
        </div>
      </div>

      <!-- 1-Hit Derrota Fase -->
      <div class="dev-cheat-card ${devCheats.oneHitBossPhase ? 'active' : ''}" id="card-one-hit-boss-phase">
        <div class="dev-cheat-icon">⚔️</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name">1 Hit Derrota Fase do Chefe</div>
          <div class="dev-cheat-desc">Cada golpe quebra imediatamente a fase do chefe para transição rápida.</div>
        </div>
        <div class="dev-cheat-toggle">
          <span class="dev-toggle-badge">${devCheats.oneHitBossPhase ? 'LIGADO' : 'DESLIGADO'}</span>
        </div>
      </div>
    </div>

    <!-- Categoria 2: Ações Imediatas de Arena -->
    <div class="dev-section-title" style="margin-top: 16px;">
      <span>⚡ AÇÕES IMEDIATAS DE ARENA</span>
      <span class="dev-title-sub">Intervenções instantâneas na batalha</span>
    </div>

    <div class="dev-cheats-grid">
      <!-- Super Ímã -->
      <div class="dev-cheat-card action-card" id="card-super-magnet">
        <div class="dev-cheat-icon">🧲</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name">Super Ímã Global</div>
          <div class="dev-cheat-desc">Puxa instantaneamente todos os cristais de XP e moedas de todo o mapa.</div>
        </div>
        <button class="dev-card-action-btn">Puxar Tudo</button>
      </div>

      <!-- Expurgar Horda -->
      <div class="dev-cheat-card action-card" id="card-purge-horde">
        <div class="dev-cheat-icon">💀</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name">Expurgar Inimigos Comuns</div>
          <div class="dev-cheat-desc">Destrói instantaneamente todos os monstros normais da tela.</div>
        </div>
        <button class="dev-card-action-btn btn-danger">Expurgar</button>
      </div>

      <!-- Cura Plena -->
      <div class="dev-cheat-card action-card" id="card-heal-full">
        <div class="dev-cheat-icon">❤️</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name">Restauração Completa</div>
          <div class="dev-cheat-desc">Restaura 100% dos pontos de vida e remove efeitos negativos.</div>
        </div>
        <button class="dev-card-action-btn">Curar Herói</button>
      </div>

      <!-- Simular Morte -->
      <div class="dev-cheat-card action-card" id="card-test-death">
        <div class="dev-cheat-icon">☠️</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name" style="color: #ff4757;">Simular Morte Dramática</div>
          <div class="dev-cheat-desc">Dispara a sequência cinematográfica completa (zoom, colapso, evaporação e Nova).</div>
        </div>
        <button class="dev-card-action-btn btn-danger">Disparar</button>
      </div>
    </div>

    <!-- Categoria 3: Simulação de Eventos & Baús -->
    <div class="dev-section-title" style="margin-top: 16px;">
      <span>🎁 SIMULAÇÃO DE EVENTOS & BAÚS</span>
      <span class="dev-title-sub">Teste as animações e relicários do jogo</span>
    </div>

    <div class="dev-cheats-grid">
      <!-- Invocar Altar -->
      <div class="dev-cheat-card action-card" id="card-spawn-blood-altar">
        <div class="dev-cheat-icon" style="display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:#ff3838;"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg></div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name" style="color: #ff3838;">Invocar Altar de Sangue</div>
          <div class="dev-cheat-desc">Gera um Altar de Sangue imediatamente próximo ao jogador na arena (10s).</div>
        </div>
        <button class="dev-card-action-btn" style="background: #ff3838; color: #fff;">Spawn Altar</button>
      </div>

      <!-- Baú do Altar -->
      <div class="dev-cheat-card action-card" id="card-test-altar-chest">
        <div class="dev-cheat-icon" style="display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:#ffd166;"><path d="M5 4h14a2 2 0 0 1 2 2v2H3V6a2 2 0 0 1 2-2zm-2 6h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8zm8 2v3h2v-3h-2z"/></svg></div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name" style="color: #ffd166;">Testar Baú do Altar (Lendário)</div>
          <div class="dev-cheat-desc">Abre o Baú Lendário do Altar de Sangue com dádivas ancestrais.</div>
        </div>
        <button class="dev-card-action-btn" style="background: #c0392b; color: #fff;">Baú Altar</button>
      </div>

      <!-- Baú Miniboss -->
      <div class="dev-cheat-card action-card" id="card-test-miniboss-chest">
        <div class="dev-cheat-icon">💎</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name" style="color: #00f5d4;">Testar Baú de Miniboss (Safira)</div>
          <div class="dev-cheat-desc">Abre o Relicário Espectral de elite com tema de safira ciano.</div>
        </div>
        <button class="dev-card-action-btn" style="background: #00f5d4; color: #000; font-weight: bold;">Baú Miniboss</button>
      </div>

      <!-- Baú de Boss -->
      <div class="dev-cheat-card action-card" id="card-test-boss-chest">
        <div class="dev-cheat-icon">👑</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name" style="color: #f1c40f;">Testar Baú de Chefe (Sarcófago)</div>
          <div class="dev-cheat-desc">Abre o Sarcófago do Soberano com feixes áureos, tremor e evoluções.</div>
        </div>
        <button class="dev-card-action-btn" style="background: #f1c40f; color: #000; font-weight: bold;">Baú de Boss</button>
      </div>
    </div>
  `;

  container.appendChild(cheatsSection);

  // Handlers dos Cheats
  cheatsSection.querySelector('#card-god-mode').onclick = () => toggleGodMode();
  cheatsSection.querySelector('#card-zero-cd').onclick = () => toggleZeroCooldown();
  cheatsSection.querySelector('#card-one-hit-boss-phase').onclick = () => toggleOneHitBossPhase();

  cheatsSection.querySelector('#card-super-magnet').onclick = () => {
    const count = triggerSuperMagnet();
    showDevToast(`🧲 <b>Super Ímã:</b> ${count} cristais e orbs atraídos!`);
  };

  cheatsSection.querySelector('#card-purge-horde').onclick = () => {
    const count = purgeAllNormalEnemies();
    showDevToast(`💀 <b>Expurgo:</b> ${count} monstros eliminados!`);
  };

  cheatsSection.querySelector('#card-heal-full').onclick = () => healPlayerFull();

  cheatsSection.querySelector('#card-test-death').onclick = () => {
    closeBossSelectModal();
    if (player) {
      player.hp = 0;
      triggerDeath();
      showDevToast('☠️ <b>Morte Dramática Disparada:</b> Sequência cinematográfica em andamento.');
    }
  };

  cheatsSection.querySelector('#card-spawn-blood-altar').onclick = () => {
    closeBossSelectModal();
    if (player) {
      spawnBloodAltar(player, 0, 180);
      showDevToast('<b>Altar de Sangue Invocado!</b> Monólito de 10s gerado próximo ao herói.');
    }
  };

  cheatsSection.querySelector('#card-test-altar-chest').onclick = () => {
    closeBossSelectModal();
    openChestModal('LEGENDARY_ALTAR');
  };

  cheatsSection.querySelector('#card-test-miniboss-chest').onclick = () => {
    closeBossSelectModal();
    openChestModal('MINI_BOSS');
  };

  cheatsSection.querySelector('#card-test-boss-chest').onclick = () => {
    closeBossSelectModal();
    openChestModal('BOSS');
  };
}

function updateCheatsUI() {
  const godCard = document.getElementById('card-god-mode');
  if (godCard) {
    godCard.classList.toggle('active', devCheats.godMode);
    const badge = godCard.querySelector('.dev-toggle-badge');
    if (badge) badge.innerText = devCheats.godMode ? 'LIGADO' : 'DESLIGADO';
  }

  const zeroCard = document.getElementById('card-zero-cd');
  if (zeroCard) {
    zeroCard.classList.toggle('active', devCheats.zeroCooldown);
    const badge = zeroCard.querySelector('.dev-toggle-badge');
    if (badge) badge.innerText = devCheats.zeroCooldown ? 'LIGADO' : 'DESLIGADO';
  }

  const oneHitCard = document.getElementById('card-one-hit-boss-phase');
  if (oneHitCard) {
    oneHitCard.classList.toggle('active', devCheats.oneHitBossPhase);
    const badge = oneHitCard.querySelector('.dev-toggle-badge');
    if (badge) badge.innerText = devCheats.oneHitBossPhase ? 'LIGADO' : 'DESLIGADO';
  }

  const quickBtn = document.getElementById('btn-quick-one-hit-phase');
  if (quickBtn) {
    quickBtn.classList.toggle('active', devCheats.oneHitBossPhase);
    const b = quickBtn.querySelector('b');
    if (b) {
      b.innerText = devCheats.oneHitBossPhase ? 'LIGADO' : 'DESLIGADO';
      b.style.color = devCheats.oneHitBossPhase ? '#2ecc71' : '#e74c3c';
    }
  }
}

/**
 * ========================================================
 * ABA 4: MUNDO, ONDAS & METAGAME
 * ========================================================
 */
function renderWavesTab(container) {
  const section = document.createElement('div');
  section.className = 'dev-waves-section';

  section.innerHTML = `
    <!-- Seletor de Velocidade -->
    <div class="dev-section-title">
      <span>⏩ VELOCIDADE DA SIMULAÇÃO</span>
      <span class="dev-title-sub">Acelere ou desacelere o tempo da batalha</span>
    </div>
    <div class="dev-speed-selector">
      <button class="dev-speed-btn ${devCheats.gameSpeed === 0.5 ? 'active' : ''}" data-speed="0.5">0.5x (Slow)</button>
      <button class="dev-speed-btn ${devCheats.gameSpeed === 1.0 ? 'active' : ''}" data-speed="1.0">1.0x (Normal)</button>
      <button class="dev-speed-btn ${devCheats.gameSpeed === 1.5 ? 'active' : ''}" data-speed="1.5">1.5x (Ágil)</button>
      <button class="dev-speed-btn ${devCheats.gameSpeed === 2.0 ? 'active' : ''}" data-speed="2.0">2.0x (Rápido)</button>
      <button class="dev-speed-btn ${devCheats.gameSpeed === 3.0 ? 'active' : ''}" data-speed="3.0">3.0x (Ultra)</button>
    </div>

    <!-- Salto de Ondas (Wave Warp) -->
    <div class="dev-section-title" style="margin-top: 18px;">
      <span>🌊 SALTO DE ONDAS (WAVE WARP)</span>
      <span class="dev-title-sub">Teletransporte o cronômetro para qualquer horda</span>
    </div>
    <div class="dev-waves-grid">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(w => `
        <button class="dev-wave-btn ${w === 10 ? 'wave-final' : ''}" data-wave="${w}">
          <span class="dev-wave-num">ONDA ${w}</span>
          <span class="dev-wave-sub">${w === 10 ? 'O Julgamento' : w >= 7 ? 'Late Game' : w >= 4 ? 'Mid Game' : 'Early'}</span>
        </button>
      `).join('')}
    </div>

    <!-- Economia Instantânea -->
    <div class="dev-section-title" style="margin-top: 18px;">
      <span>💰 ECONOMIA & TESOUROS</span>
      <span class="dev-title-sub">Recursos rápidos para testes de evolução e astrolábio</span>
    </div>
    <div class="dev-economy-row">
      <button class="dev-btn-economy" id="dev-add-gold-1k">
        <span class="dev-eco-icon">🪙</span>
        <span class="dev-eco-text">
          <b>+1.000 Ouro</b>
          <small>Moeda Persistente / Astrolábio</small>
        </span>
      </button>

      <button class="dev-btn-economy" id="dev-add-gold-5k">
        <span class="dev-eco-icon">💎</span>
        <span class="dev-eco-text">
          <b>+5.000 Ouro</b>
          <small>Cofre Abundante de Teste</small>
        </span>
      </button>
    </div>

    <!-- Metagame, Conquistas & Bestiário -->
    <div class="dev-section-title" style="margin-top: 18px;">
      <span>📜 PROGRESSÃO & METAGAME</span>
      <span class="dev-title-sub">Manipulação de desbloqueios, crônicas e bestiário</span>
    </div>

    <div class="dev-cheats-grid">
      <div class="dev-cheat-card action-card" id="card-unlock-all-heroes">
        <div class="dev-cheat-icon">🔓</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name" style="color: #2ecc71;">Desbloquear Todos os Heróis</div>
          <div class="dev-cheat-desc">Libera instantaneamente todos os 5 arquétipos e o Grimório de Conquistas.</div>
        </div>
        <button class="dev-card-action-btn" style="background: #2ecc71; color: #000; font-weight: bold;">🔓 Desbloquear</button>
      </div>

      <div class="dev-cheat-card action-card" id="card-reset-achievements">
        <div class="dev-cheat-icon">🔒</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name" style="color: #ff7675;">Resetar Bloqueios & Conquistas</div>
          <div class="dev-cheat-desc">Bloqueia heróis e limpa os recordes da Melhor Run para testar como jogador novo.</div>
        </div>
        <button class="dev-card-action-btn btn-danger">🔒 Resetar</button>
      </div>

      <div class="dev-cheat-card action-card" id="card-mock-best-run">
        <div class="dev-cheat-icon">🏆</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name" style="color: #ffd166;">Forjar Melhor Run (Vitória Suprema)</div>
          <div class="dev-cheat-desc">Gera uma crônica de vitória para Sir Roland com 184.250 PTS para testar o Tarô.</div>
        </div>
        <button class="dev-card-action-btn" style="background: #ffd166; color: #000; font-weight: bold;">🏆 Forjar</button>
      </div>

      <div class="dev-cheat-card action-card" id="card-unlock-all-bestiary">
        <div class="dev-cheat-icon">📖</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name" style="color: #00f5d4;">Desbloquear Códice do Bestiário</div>
          <div class="dev-cheat-desc">Catalogar instantaneamente todas as 45 criaturas com 100 abates e lore completa.</div>
        </div>
        <button class="dev-card-action-btn" style="background: #00f5d4; color: #000; font-weight: bold;">📖 Desbloquear</button>
      </div>

      <div class="dev-cheat-card action-card" id="card-reset-bestiary">
        <div class="dev-cheat-icon">👁️</div>
        <div class="dev-cheat-info">
          <div class="dev-cheat-name" style="color: #e056fd;">Resetar Bestiário das Trevas</div>
          <div class="dev-cheat-desc">Restaura todas as criaturas como não catalogadas com silhuetas misteriosas.</div>
        </div>
        <button class="dev-card-action-btn btn-danger">🔒 Ocultar</button>
      </div>
    </div>
  `;

  container.appendChild(section);

  // Handlers de Velocidade
  section.querySelectorAll('.dev-speed-btn').forEach(btn => {
    btn.onclick = () => {
      const spd = parseFloat(btn.getAttribute('data-speed'));
      setGameSpeed(spd);
    };
  });

  // Handlers de Salto de Onda
  section.querySelectorAll('.dev-wave-btn').forEach(btn => {
    btn.onclick = () => {
      const w = parseInt(btn.getAttribute('data-wave'), 10);
      warpToWaveTime(w);
      showDevToast(`🌊 <b>Salto Temporal:</b> Iniciando Onda ${w}!`);
    };
  });

  // Economia
  section.querySelector('#dev-add-gold-1k').onclick = () => addDevGold(1000);
  section.querySelector('#dev-add-gold-5k').onclick = () => addDevGold(5000);

  // Metagame
  section.querySelector('#card-unlock-all-heroes').onclick = () => {
    const count = unlockAllAchievements();
    showDevToast(`🔓 <b>Todos os ${count} Heróis & Conquistas</b> foram DESBLOQUEADOS!`);
    const charModal = document.getElementById('char-modal');
    if (charModal && charModal.style.display !== 'none' && !charModal.classList.contains('modal-hidden')) {
      openCharacterSelect();
    }
  };

  section.querySelector('#card-reset-achievements').onclick = () => {
    resetAchievements();
    showDevToast(`🔒 <b>Progresso Resetado:</b> Heróis bloqueados e Recordes limpos.`, true);
    const charModal = document.getElementById('char-modal');
    if (charModal && charModal.style.display !== 'none' && !charModal.classList.contains('modal-hidden')) {
      openCharacterSelect();
    }
  };

  section.querySelector('#card-mock-best-run').onclick = () => {
    saveBestRun({
      heroKey: 'KNIGHT',
      heroName: 'Sir Roland',
      heroTitle: 'O Paladino da Retaliação',
      isVictory: true,
      wave: 10,
      waveText: 'Onda 10 (Vitória Suprema)',
      time: '18:45',
      seconds: 1125,
      kills: 6480,
      level: 46,
      souls: 2850,
      score: 184250,
      date: new Date().toLocaleDateString('pt-BR'),
      weapons: [
        { type: 'HAMMER', name: 'Martelo Sagrado', level: 5, evolved: true, iconKey: 'hammer' },
        { type: 'AURA', name: 'Aura Radiante', level: 5, evolved: true, iconKey: 'aura' },
        { type: 'ORBITALS', name: 'Esferas Arcanas', level: 4, evolved: false, iconKey: 'orbitals' },
        { type: 'POTION', name: 'Frasco Cáustico', level: 3, evolved: false, iconKey: 'potion' }
      ],
      passives: ['Égide (+40% Armadura)', 'Poder Bruto (+35% Dano)', 'Asas do Vento'],
      verdictTitle: 'VITÓRIA SUPREMA ABSOLUTA',
      verdictSub: 'Expurgou o Soberano do Abismo e consagrou a luz eterna'
    });
    showDevToast(`🏆 <b>Recorde Forjado:</b> Vitória de Sir Roland gravada no Tarô Arcano!`);
  };

  section.querySelector('#card-unlock-all-bestiary').onclick = () => {
    unlockAllBestiary();
    showDevToast(`📖 <b>Bestiário Completo:</b> Todas as 45 criaturas foram catalogadas!`);
    const bestiaryModal = document.getElementById('bestiary-modal');
    if (bestiaryModal && bestiaryModal.style.display !== 'none' && !bestiaryModal.classList.contains('modal-hidden')) {
      renderBestiaryRoster();
      renderBestiaryDossier(selectedCreatureId);
    }
  };

  section.querySelector('#card-reset-bestiary').onclick = () => {
    resetBestiary();
    showDevToast(`🔒 <b>Bestiário Selado:</b> Todas as criaturas retornaram ao véu sombrio.`, true);
    const bestiaryModal = document.getElementById('bestiary-modal');
    if (bestiaryModal && bestiaryModal.style.display !== 'none' && !bestiaryModal.classList.contains('modal-hidden')) {
      renderBestiaryRoster();
      renderBestiaryDossier(selectedCreatureId);
    }
  };
}

function updateGameSpeedUI() {
  document.querySelectorAll('.dev-speed-btn').forEach(btn => {
    const spd = parseFloat(btn.getAttribute('data-speed'));
    btn.classList.toggle('active', Math.abs(spd - devCheats.gameSpeed) < 0.05);
  });
}
