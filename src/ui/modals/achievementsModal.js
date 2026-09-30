import { getBestRunPresentation, getSavedPassivePresentation, savedWeaponHtml } from '../../i18n/contentPresentation.js';
import { escapeHtml } from '../../i18n/dom.js';
import { t as tr, formatNumber, onLanguageChange } from '../../i18n/index.js';
import { htmlT, translateDOM } from '../../i18n/dom.js';
/**
 * src/ui/modals/achievementsModal.js
 * Grimório de Conquistas Heroicas e Monumento da Maior Jornada.
 */
import { closeCharSelectModal, openCharacterSelect, isMobileScreen, updateRelicNotificationPips } from './characterSelectModal.js';
import { 
  getUnlockedAchievementIds, 
  ACHIEVEMENTS, 
  getAchievementStatus, 
  getAchievementsSummary,
  getLifetimeStats,
  getBestRun 
} from '../../config/achievements.js';
import { markUnlockedAchievementsAsSeen } from '../../systems/progression.js';
import { 
  startBestRunTarot, 
  stopBestRunTarot,
  resizeBestRunCanvas 
} from '../../render/bestRunPreview.js';
import { renderIcon, WEAPON_ICONS } from '../icons.js';
import { playSfx } from '../../core/audio.js';

const HERO_COLORS = {
  KNIGHT: '#f1c40f',
  PALADIN: '#f1c40f',
  MAGE: '#ff7675',
  ROGUE: '#c084fc',
  BARBARIAN: '#e74c3c',
  ALCHEMIST: '#9b59b6'
};

/**
 * Formata cada bênção/passiva como um chip de relíquia arcana com ícone, cor temática e valor destacado
 */
function formatPassiveChip(entry) {
  const passive = getSavedPassivePresentation(entry);
  if (!passive) return '';
  const themes = {
    dmg: ['damage', '#ff7675'], armor: ['defense', '#00f5d4'], wings: ['speed', '#74b9ff'],
    frost_passive: ['frost', '#81ecec'], orbitals: ['holy', '#ffeaa7'], aura: ['aura', '#fdcb6e'],
    crit: ['crit', '#fd79a8'], haste: ['haste', '#a29bfe'], ult_cooldown: ['haste', '#c084fc'], magnet: ['utility', '#fab1a0']
  };
  const [theme, color] = themes[passive.id] || ['general', '#ffd166'];
  return `<div class="monument-passive-chip passive-${theme}" title="${escapeHtml(passive.name)}">
    <span class="chip-passive-icon">${renderIcon(passive.icon, { size: 10, color })}</span>
    <span class="chip-passive-name">${escapeHtml(passive.name)}</span>
    ${passive.value ? `<span class="chip-passive-val">${escapeHtml(passive.value)}</span>` : ''}
  </div>`;
}

/**
 * Renderiza o Monumento da Maior Jornada (Formato Tarô Arcano Expandido em Alta Definição)
 */
function renderBestRunMonument(targetContainerId = 'best-run-monument-container') {
  const container = document.getElementById(targetContainerId);
  if (!container) return;

  const bestRun = getBestRunPresentation(getBestRun());

  if (!bestRun) {
    container.innerHTML = `
      <div class="monument-empty-card">
        <div class="monument-empty-icon-wrap">
          ${renderIcon('soul_coin', { size: 28, color: '#64748b' })}
        </div>
        <div class="monument-empty-eyebrow">${htmlT('contentUI.monument')}</div>
        <div class="monument-empty-title">${htmlT('contentUI.noChronicle')}</div>
        <div class="monument-empty-desc">
          ${htmlT('contentUI.chronicleHint')}
        </div>
        <div class="monument-empty-hint">
          ${renderIcon('sparkle', { size: 12, color: '#00f5d4' })} ${htmlT('contentUI.startLegacy')}
        </div>
      </div>
    `;
    return;
  }

  const heroColor = HERO_COLORS[bestRun.heroKey] || '#f1c40f';

  let weaponsHtml = '';
  if (Array.isArray(bestRun.weapons) && bestRun.weapons.length > 0) {
    weaponsHtml = bestRun.weapons.map(w => `
      <div class="monument-weapon-chip ${w.evolved ? 'weapon-evolved' : ''}" title="${savedWeaponHtml(w)}">
        <div class="weapon-chip-icon-box">
          ${renderIcon(w.iconKey || WEAPON_ICONS[w.type] || WEAPON_ICONS[w.type?.toUpperCase()] || 'sword', { size: 13, color: w.evolved ? '#ffd166' : '#cbd5e1' })}
        </div>
        <div class="weapon-chip-text">
          <span class="weapon-chip-title">${savedWeaponHtml(w)}</span>
          <div class="weapon-chip-sub">
            <span class="weapon-chip-lvl">${htmlT('contentUI.level', { value1: w.level || 1 })}</span>
            ${w.evolved ? `<span class="weapon-chip-fusion-tag">${renderIcon('star_evolution', { size: 8, color: '#ffd166' })} ${htmlT('contentUI.fusion')}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  } else {
    weaponsHtml = `<span class="monument-empty-note">${htmlT('contentUI.noWeapons')}</span>`;
  }

  let passivesHtml = '';
  if (Array.isArray(bestRun.passives) && bestRun.passives.length > 0) {
    passivesHtml = bestRun.passives.map(formatPassiveChip).join('');
  } else {
    passivesHtml = `<span class="monument-empty-note">${htmlT('contentUI.noCollectedBlessings')}</span>`;
  }

  const lifetime = getLifetimeStats();
  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  container.innerHTML = `
    <div class="best-run-monument-box ${bestRun.isVictory ? 'monument-victory' : 'monument-defeat'}">
      <!-- Barra Superior Monumental -->
      <div class="monument-header-row">
        <div class="monument-title-wrap">
          <div class="monument-pulsing-glyph"></div>
          <div class="monument-header-text-group">
            <div class="monument-eyebrow-mini">${htmlT('contentUI.recordSanctuary')}</div>
            <div class="monument-title-text">${htmlT('contentUI.monument')}</div>
          </div>
        </div>
        <div class="monument-meta-right">
          <div class="monument-date-chip">
            ${renderIcon('timer', { size: 10, color: '#a29bfe' })}
            <span>${htmlT('contentUI.recordedOn', { value1: bestRun.date || '' })}</span>
          </div>
          <span class="monument-fate-badge ${bestRun.isVictory ? 'badge-victory' : 'badge-defeat'}">
            ${bestRun.isVictory ? renderIcon('boss_crown', { size: 12, color: '#ffd166' }) : renderIcon('skull', { size: 12, color: '#ff7675' })}
            ${bestRun.verdictTitle}
          </span>
        </div>
      </div>

      <!-- Grade Principal (Carta de Tarô + Feitos + Arsenal + Bênçãos) -->
      <div class="monument-main-grid">
        <!-- Coluna Esquerda: Carta de Tarô Arcano -->
        <div class="tarot-card-wrapper">
          <div class="tarot-hero-card ${bestRun.isVictory ? 'tarot-victory' : 'tarot-defeat'}">
            <div class="tarot-corner-glyph corner-tl">✦</div>
            <div class="tarot-corner-glyph corner-tr">✦</div>
            <div class="tarot-corner-glyph corner-bl">✦</div>
            <div class="tarot-corner-glyph corner-br">✦</div>

            <div class="tarot-card-header">
              <div class="tarot-card-eyebrow">${htmlT('contentUI.supremeCodex')}</div>
              <div class="tarot-hero-name" style="color: ${heroColor};">${bestRun.heroName}</div>
              <div class="tarot-hero-subtitle">${bestRun.heroTitle}</div>
            </div>

            <div class="tarot-canvas-window">
              <canvas id="best-run-tarot-canvas"></canvas>
              <div class="tarot-canvas-vignette"></div>
              <div class="tarot-canvas-border-inner"></div>
            </div>

            <div class="tarot-card-footer">
              <div class="tarot-verdict-quote">
                <span class="tarot-quote-mark">“</span>
                ${bestRun.verdictSub || (bestRun.isVictory ? tr('contentUI.victoryQuote') : tr('contentUI.defeatQuote'))}
                <span class="tarot-quote-mark">”</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna Direita: Biometria, Arsenal e Relíquias -->
        <div class="monument-details-col">
          <!-- Grade das 6 Métricas Épicas -->
          <div class="monument-metrics-grid">
            <!-- 1. Score da Lenda (Destaque Principal) -->
            <div class="monument-stat-pill pill-legendary-score">
              <div class="stat-pill-icon-wrap icon-gold">
                ${renderIcon('trophy', { size: 13, color: '#ffd166' })}
              </div>
              <div class="stat-pill-data">
                <div class="stat-pill-label label-gold">${htmlT('contentUI.legendScore')}</div>
                <div class="stat-pill-val val-gold">${formatNumber(Number(bestRun.score))} <span class="val-unit">${htmlT('contentUI.points')}</span></div>
              </div>
            </div>

            <!-- 2. Sobrevivência -->
            <div class="monument-stat-pill pill-time">
              <div class="stat-pill-icon-wrap icon-amber">
                ${renderIcon('timer', { size: 13, color: '#f39c12' })}
              </div>
              <div class="stat-pill-data">
                <div class="stat-pill-label">${htmlT('contentUI.survival')}</div>
                <div class="stat-pill-val">${bestRun.time || '00:00'}</div>
              </div>
            </div>

            <!-- 3. Horda Máxima -->
            <div class="monument-stat-pill pill-wave">
              <div class="stat-pill-icon-wrap icon-cyan">
                ${renderIcon('wave_swords', { size: 13, color: '#00f5d4' })}
              </div>
              <div class="stat-pill-data">
                <div class="stat-pill-label">${htmlT('contentUI.highestHorde')}</div>
                <div class="stat-pill-val text-cyan">${bestRun.waveText || `${tr('contentUI.wave', { value1: bestRun.wave })}`}</div>
              </div>
            </div>

            <!-- 4. Abates Purificados -->
            <div class="monument-stat-pill pill-kills">
              <div class="stat-pill-icon-wrap icon-ruby">
                ${renderIcon('skull', { size: 13, color: '#ff4757' })}
              </div>
              <div class="stat-pill-data">
                <div class="stat-pill-label">${htmlT('contentUI.totalKills')}</div>
                <div class="stat-pill-val text-ruby">${formatNumber(Number(bestRun.kills))}</div>
              </div>
            </div>

            <!-- 5. Ascensão Alcançada -->
            <div class="monument-stat-pill pill-level">
              <div class="stat-pill-icon-wrap icon-purple">
                ${renderIcon('sparkle', { size: 13, color: '#c084fc' })}
              </div>
              <div class="stat-pill-data">
                <div class="stat-pill-label">${htmlT('contentUI.ascension')}</div>
                <div class="stat-pill-val text-purple">${htmlT('contentUI.level', { value1: bestRun.level })}</div>
              </div>
            </div>

            <!-- 6. Almas Resgatadas -->
            <div class="monument-stat-pill pill-souls">
              <div class="stat-pill-icon-wrap icon-gold">
                ${renderIcon('soul_coin', { size: 13, color: '#f1c40f' })}
              </div>
              <div class="stat-pill-data">
                <div class="stat-pill-label">${htmlT('contentUI.soulsCollected')}</div>
                <div class="stat-pill-val text-gold">+${formatNumber(Number(bestRun.souls))}</div>
              </div>
            </div>
          </div>

          <!-- Seção de Equipamento: Arsenal Principal -->
          <div class="monument-arsenal-section">
            <div class="monument-section-header">
              <span class="monument-section-tag">
                ${renderIcon('sword', { size: 11, color: '#ffd166' })}
                ${htmlT('contentUI.arsenalConsecrated')}
              </span>
            </div>
            <div class="monument-weapons-grid">
              ${weaponsHtml}
            </div>
          </div>

          <!-- Seção de Relíquias: Bênçãos & Transmutações -->
          <div class="monument-passives-section">
            <div class="monument-section-header">
              <span class="monument-section-tag">
                ${renderIcon('sparkle', { size: 11, color: '#00f5d4' })}
                ${htmlT('contentUI.activeTransmutations', { value1: Array.isArray(bestRun.passives) ? bestRun.passives.length : 0 })}
              </span>
            </div>
            <div class="monument-passives-grid">
              ${passivesHtml}
            </div>
          </div>

          <!-- Marcos Históricos Globais da Conta -->
          <div class="monument-lifetime-strip">
            <div class="lifetime-strip-title">
              ${renderIcon('keystone', { size: 11, color: '#a29bfe' })}
              <span>${htmlT('contentUI.milestones')}</span>
            </div>
            <div class="lifetime-strip-chips">
              <div class="lifetime-bench-chip" title="${htmlT('contentUI.maxKillsHint')}">
                <span class="bench-label">${htmlT('contentUI.maxKills')}</span>
                <span class="bench-val text-ruby">${formatNumber(Number(lifetime.singleRunMaxKills || 0))}</span>
              </div>
              <div class="lifetime-bench-chip" title="${htmlT('contentUI.timeRecordHint')}">
                <span class="bench-label">${htmlT('contentUI.timeRecord')}</span>
                <span class="bench-val text-amber">${formatSeconds(lifetime.maxSurvivalSeconds || 0)}</span>
              </div>
              <div class="lifetime-bench-chip" title="${htmlT('contentUI.openedChestsHint')}">
                <span class="bench-label">${htmlT('contentUI.openedChests')}</span>
                <span class="bench-val text-gold">${formatNumber(Number(lifetime.totalChestsOpened || 0))}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  // Inicializa a renderização 2D procedural no Canvas do Preview com DPI dinâmico
  const cvs = document.getElementById('best-run-tarot-canvas');
  if (cvs) {
    startBestRunTarot(cvs, bestRun.heroKey, bestRun.isVictory);
  }
}

// ========================================================
// GRIMÓRIO DE CONQUISTAS PRIMORDIAIS (Neo-Arcane 2-Pillar Bento Grid)
// ========================================================
export let currentAchievementsCategory = 'JOURNEY';
export let selectedAchievementId = 'JOURNEY';

export function setCurrentAchievementsCategory(cat) {
  currentAchievementsCategory = cat;
  if (cat === 'JOURNEY') {
    selectedAchievementId = 'JOURNEY';
  } else if (selectedAchievementId === 'JOURNEY' || !ACHIEVEMENTS.some(a => a.id === selectedAchievementId)) {
    if (cat === 'ALL') {
      selectedAchievementId = ACHIEVEMENTS[0]?.id || 'JOURNEY';
    } else {
      const firstInCat = ACHIEVEMENTS.find(a => a.category === cat);
      selectedAchievementId = firstInCat ? firstInCat.id : (ACHIEVEMENTS[0]?.id || 'JOURNEY');
    }
  } else if (cat !== 'ALL') {
    const belongs = ACHIEVEMENTS.some(a => a.id === selectedAchievementId && a.category === cat);
    if (!belongs) {
      const firstInCat = ACHIEVEMENTS.find(a => a.category === cat);
      if (firstInCat) selectedAchievementId = firstInCat.id;
    }
  }
}

export function openAchievementsModal() {
  const hud = document.getElementById('hud');
  if (hud) {
    hud.classList.add('hud-hidden');
    hud.style.setProperty('display', 'none', 'important');
    hud.style.display = 'none';
  }
  closeCharSelectModal();

  const modal = document.getElementById('achievements-modal');
  if (!modal) return;
  translateDOM(modal);

  const isMobile = isMobileScreen();
  modal.classList.toggle('is-mobile-device', isMobile);

  const summary = getAchievementsSummary();
  const unlockedCountEl = document.getElementById('ach-unlocked-count');
  if (unlockedCountEl) unlockedCountEl.innerText = summary.unlocked;
  const totalCountEl = document.getElementById('ach-total-count');
  if (totalCountEl) totalCountEl.innerText = summary.total;

  const legacyUnlocked = document.getElementById('achievements-unlocked-count');
  if (legacyUnlocked) legacyUnlocked.innerText = summary.unlocked;
  const legacyTotal = document.getElementById('achievements-total-count');
  if (legacyTotal) legacyTotal.innerText = summary.total;

  const soulsEl = document.getElementById('ach-souls-val');
  if (soulsEl) soulsEl.innerText = `+${formatNumber(summary.totalSoulsReward)}`;

  const completionEl = document.getElementById('ach-completion-val');
  if (completionEl) completionEl.innerText = `${summary.completionPct}%`;

  const heroesEl = document.getElementById('ach-heroes-val');
  if (heroesEl) heroesEl.innerText = `${summary.unlockedHeroesCount} / 5`;

  modal.classList.remove('modal-hidden', 'closing');
  modal.classList.add('active');
  modal.style.removeProperty('display');
  modal.style.display = 'flex';

  // Sempre inicia na aba "Maior Jornada"
  currentAchievementsCategory = 'JOURNEY';
  selectedAchievementId = 'JOURNEY';

  document.querySelectorAll('.achievements-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-cat') === 'JOURNEY');
  });

  const bentoGrid = document.querySelector('.achievements-bento-grid');
  if (bentoGrid) {
    bentoGrid.classList.add('is-journey-view');
  }

  renderAchievementsRoster('JOURNEY');
  renderAchievementDossier('JOURNEY');

  markUnlockedAchievementsAsSeen();
  updateRelicNotificationPips();

  playSfx('level');
}

export function closeAchievementsModal() {
  const modal = document.getElementById('achievements-modal');
  if (modal) {
    modal.classList.add('closing');
    setTimeout(() => {
      stopBestRunTarot();
      modal.classList.remove('active', 'closing');
      modal.classList.add('modal-hidden');
      modal.style.setProperty('display', 'none', 'important');
      modal.style.display = 'none';
      openCharacterSelect();
    }, 200);
  } else {
    stopBestRunTarot();
    openCharacterSelect();
  }
}

export function selectAchievement(achievementId) {
  selectedAchievementId = achievementId;

  const cards = document.querySelectorAll('.achievement-card');
  cards.forEach(c => {
    const isTarget = c.getAttribute('data-id') === achievementId;
    c.classList.toggle('active', isTarget);
    if (isTarget) {
      try {
        c.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } catch (err) {}
    }
  });

  const dossierPanel = document.getElementById('achievements-dossier-panel');
  if (dossierPanel) {
    dossierPanel.classList.remove('dossier-slide-enter');
    void dossierPanel.offsetWidth;
    dossierPanel.classList.add('dossier-slide-enter');
  }

  renderAchievementDossier(achievementId);
  playSfx('click');
}

export function renderAchievementsRoster(filterCategory = 'ALL') {
  const grid = document.getElementById('achievements-list-grid');
  if (!grid) return;

  grid.innerHTML = '';

  let entries = ACHIEVEMENTS;
  const bentoGrid = document.querySelector('.achievements-bento-grid');
  if (filterCategory === 'JOURNEY') {
    if (bentoGrid) bentoGrid.classList.add('is-journey-view');
    grid.innerHTML = '';
  } else {
    if (bentoGrid) bentoGrid.classList.remove('is-journey-view');
  }

  if (filterCategory && filterCategory !== 'ALL') {
    entries = entries.filter(a => a.category === filterCategory);
  }

  // Atualizar contadores dinâmicos nos botões de categoria
  const heroTotal = ACHIEVEMENTS.filter(a => a.category === 'hero').length;
  const combatTotal = ACHIEVEMENTS.filter(a => a.category === 'combat').length;
  const bossTotal = ACHIEVEMENTS.filter(a => a.category === 'boss').length;
  const arsenalTotal = ACHIEVEMENTS.filter(a => a.category === 'arsenal').length;
  const masteryTotal = ACHIEVEMENTS.filter(a => a.category === 'mastery').length;

  document.querySelectorAll('.achievements-tab-btn').forEach(btn => {
    const cat = btn.getAttribute('data-cat');
    const labelEl = btn.querySelector('.tab-label') || btn;
    if (cat === 'ALL') labelEl.innerText = `${tr('contentUI.allAchievements', { value1: ACHIEVEMENTS.length })}`;
    else if (cat === 'hero') labelEl.innerText = `${tr('contentUI.heroes', { value1: heroTotal })}`;
    else if (cat === 'combat') labelEl.innerText = `${tr('contentUI.combatCount', { value1: combatTotal })}`;
    else if (cat === 'boss') labelEl.innerText = `${tr('contentUI.bosses', { value1: bossTotal })}`;
    else if (cat === 'arsenal') labelEl.innerText = `${tr('contentUI.arsenalCount', { value1: arsenalTotal })}`;
    else if (cat === 'mastery') labelEl.innerText = `${tr('contentUI.codexCount', { value1: masteryTotal })}`;
  });

  const filterBadgeEl = document.getElementById('achievements-filter-badge');
  if (filterBadgeEl) {
    const catLabels = {
      'ALL': `${tr('contentUI.allAchievements', { value1: ACHIEVEMENTS.length })}`,
      'hero': `${tr('contentUI.heroes', { value1: heroTotal })}`,
      'combat': `${tr('contentUI.combatCount', { value1: combatTotal })}`,
      'boss': `${tr('contentUI.bosses', { value1: bossTotal })}`,
      'arsenal': `${tr('contentUI.arsenalCount', { value1: arsenalTotal })}`,
      'mastery': `${tr('contentUI.codexCount', { value1: masteryTotal })}`,
      'JOURNEY': `${tr('contentUI.greatestJourney')}`
    };
    filterBadgeEl.innerText = catLabels[filterCategory] || `${tr('contentUI.filter', { value1: entries.length })}`;
  }

  if (filterCategory === 'JOURNEY') return;

  entries.forEach(ach => {
    const status = getAchievementStatus(ach.id);
    const isSelected = ach.id === selectedAchievementId;

    let catBadgeClass = 'badge-cat-hero';
    let catLabel = tr('contentUI.hero');
    if (ach.category === 'combat') {
      catBadgeClass = 'badge-cat-combat';
      catLabel = tr('contentUI.combat');
    } else if (ach.category === 'boss') {
      catBadgeClass = 'badge-cat-boss';
      catLabel = tr('contentUI.boss');
    } else if (ach.category === 'arsenal') {
      catBadgeClass = 'badge-cat-arsenal';
      catLabel = tr('contentUI.arsenal');
    } else if (ach.category === 'mastery') {
      catBadgeClass = 'badge-cat-mastery';
      catLabel = tr('contentUI.codex');
    }

    let rewardBadge = '';
    if (ach.heroTitle) {
      rewardBadge = `<span class="ach-reward-pill ach-hero-reward">${renderIcon('keystone', { size: 9, color: '#a29bfe' })} ${ach.heroTitle.split(',')[0]}</span>`;
    } else if (ach.rewardGold > 0) {
      rewardBadge = `<span class="ach-reward-pill ach-gold-reward">${renderIcon('soul_coin', { size: 9, color: '#ffd166' })} ${htmlT('contentUI.soulsReward', { value1: ach.rewardGold })}</span>`;
    }

    const card = document.createElement('div');
    card.className = `achievement-card ${status.isCompleted ? 'ach-completed' : 'ach-locked'} ${isSelected ? 'active' : ''}`;
    card.setAttribute('data-id', ach.id);

    card.innerHTML = `
      <div class="bcard-select-edge"></div>
      <div class="ach-card-avatar-wrap">
        <span class="ach-card-avatar-icon">${renderIcon(ach.icon || 'trophy', { size: 15, color: status.isCompleted ? '#ffd166' : '#a29bfe' })}</span>
      </div>
      <div class="ach-card-info">
        <div class="ach-card-top-row">
          <span class="ach-card-name">${ach.title}</span>
          <span class="ach-cat-pill ${catBadgeClass}">${catLabel}</span>
        </div>
        <div class="ach-progress-rail">
          <div class="ach-progress-bar" style="width: ${status.percent}%;"></div>
        </div>
        <div class="ach-card-bottom-row">
          <div class="ach-reward-wrap">${rewardBadge}</div>
          <span class="ach-status-badge ${status.isCompleted ? 'badge-done' : 'badge-pending'}">
            ${status.isCompleted ? `${renderIcon('check', { size: 9, color: '#2ecc71', style: 'vertical-align:middle;margin-right:2px;' })} ${tr('contentUI.completed')}` : `${status.percent}%`}
          </span>
        </div>
      </div>
    `;

    card.onclick = (e) => {
      e.stopPropagation();
      selectAchievement(ach.id);
    };

    grid.appendChild(card);
  });
}

export function renderAchievementDossier(achievementId) {
  const dossierPanel = document.getElementById('achievements-dossier-panel');
  if (!dossierPanel) return;

  const dossierTag = document.getElementById('achievements-dossier-tag');
  const dossierTier = document.getElementById('achievements-dossier-tier');
  const bentoGrid = document.querySelector('.achievements-bento-grid');

  let targetId = achievementId || selectedAchievementId;

  // MODO MAIOR JORNADA (Tarô Arcano do Recorde Histórico)
  if (currentAchievementsCategory === 'JOURNEY' || targetId === 'JOURNEY') {
    if (currentAchievementsCategory === 'JOURNEY') {
      targetId = 'JOURNEY';
      selectedAchievementId = 'JOURNEY';
      if (bentoGrid) bentoGrid.classList.add('is-journey-view');
      if (dossierTag) dossierTag.innerText = tr('contentUI.recordShrine');
      if (dossierTier) {
        dossierTier.innerText = tr('contentUI.supremeArcana');
        dossierTier.className = 'pillar-badge-hero tier-primordial';
      }
      renderBestRunMonument('achievements-dossier-panel');
      return;
    } else {
      // O usuário está em uma categoria de conquistas ('ALL', 'hero', etc.),
      // mas o targetId ainda estava apontando para 'JOURNEY'. Resolvemos para a primeira conquista.
      if (currentAchievementsCategory === 'ALL') {
        targetId = ACHIEVEMENTS[0]?.id;
      } else {
        const firstInCat = ACHIEVEMENTS.find(a => a.category === currentAchievementsCategory) || ACHIEVEMENTS[0];
        targetId = firstInCat?.id;
      }
      selectedAchievementId = targetId;
    }
  } else if (currentAchievementsCategory !== 'ALL') {
    const belongs = ACHIEVEMENTS.some(a => a.id === targetId && a.category === currentAchievementsCategory);
    if (!belongs) {
      const firstInCat = ACHIEVEMENTS.find(a => a.category === currentAchievementsCategory) || ACHIEVEMENTS[0];
      targetId = firstInCat?.id;
      selectedAchievementId = targetId;
    }
  } else if (currentAchievementsCategory === 'ALL') {
    const exists = ACHIEVEMENTS.some(a => a.id === targetId);
    if (!exists) {
      targetId = ACHIEVEMENTS[0]?.id;
      selectedAchievementId = targetId;
    }
  }

  // Assegura desativação do modo Maior Jornada no grid
  if (bentoGrid) {
    bentoGrid.classList.remove('is-journey-view');
  }

  // Parar preview do Tarô caso estivesse rodando
  stopBestRunTarot();

  // Sincroniza estado visual de card ativo
  document.querySelectorAll('.achievement-card').forEach(c => {
    const isTarget = c.getAttribute('data-id') === targetId;
    c.classList.toggle('active', isTarget);
  });

  const activeCard = document.querySelector(`.achievement-card[data-id="${targetId}"]`);
  if (activeCard) {
    try {
      activeCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    } catch (err) {}
  }

  const ach = ACHIEVEMENTS.find(a => a.id === targetId) || ACHIEVEMENTS[0];
  const status = getAchievementStatus(ach.id);

  let tierClass = 'tier-heroic';
  if (ach.tierId === 'primordial') tierClass = 'tier-primordial';
  else if (ach.tierId === 'legendary') tierClass = 'tier-legendary';

  if (dossierTag) dossierTag.innerText = tr('contentUI.consecrationAltar');
  if (dossierTier) {
    dossierTier.innerText = ach.tier || tr('contentUI.heroic');
    dossierTier.className = `pillar-badge-hero ${tierClass}`;
  }

  let catBadgeClass = 'badge-cat-hero';
  let catLabel = tr('contentUI.championAwakening');
  if (ach.category === 'combat') {
    catBadgeClass = 'badge-cat-combat';
    catLabel = tr('contentUI.combatFeat');
  } else if (ach.category === 'boss') {
    catBadgeClass = 'badge-cat-boss';
    catLabel = tr('contentUI.bossPurification');
  } else if (ach.category === 'arsenal') {
    catBadgeClass = 'badge-cat-arsenal';
    catLabel = tr('contentUI.arsenalTransmutation');
  } else if (ach.category === 'mastery') {
    catBadgeClass = 'badge-cat-mastery';
    catLabel = tr('contentUI.destinyCodex');
  }

  dossierPanel.innerHTML = `
    <div class="ach-dossier-wrap">
      <!-- 1. Palco da Prévia em Alta Definição com Backlight Reativo -->
      <div class="ach-preview-viewport" style="--ach-ambient: ${status.isCompleted ? 'rgba(46, 204, 113, 0.3)' : 'rgba(162, 155, 254, 0.25)'};">
        <div class="preview-ambient-glow"></div>
        <div class="ach-preview-sigil" style="border-color: ${status.isCompleted ? '#ffd166' : '#a29bfe'}; color: ${status.isCompleted ? '#ffd166' : '#a29bfe'};">
          ${renderIcon(ach.icon || 'trophy', { size: 36, color: status.isCompleted ? '#ffd166' : '#a29bfe' })}
        </div>
        <div class="ach-category-pill ${catBadgeClass}">
          ${catLabel}
        </div>
        <div class="ach-status-pill ${status.isCompleted ? 'status-done' : 'status-pending'}">
          ${status.isCompleted ? `${renderIcon('check', { size: 10, color: '#2ecc71', style: 'vertical-align:middle;margin-right:3px;' })} ${tr('contentUI.gloriousCompletion')}` : `${renderIcon('timer', { size: 10, color: '#ffd166', style: 'vertical-align:middle;margin-right:3px;' })} ${tr('contentUI.inProgress')}`}
        </div>
      </div>

      <!-- 2. Cabeçalho de Identidade Monumental -->
      <div class="dossier-identity">
        <div class="dossier-name-row">
          <h2 class="dossier-name" style="color: ${status.isCompleted ? '#ffd166' : '#f1f5f9'};">
            ${ach.title}
          </h2>
          <span class="dossier-tier-badge ${tierClass}">${ach.tier || tr('contentUI.heroic')}</span>
        </div>
        <div class="dossier-desc">${ach.desc}</div>
      </div>

      <!-- 3. Grade Biométrica do Feito (4 Cards) -->
      <div class="dossier-stats-grid">
        <div class="ach-stat-card">
          <div class="stat-label">${renderIcon('execute', { size: 9, color: '#a29bfe', style: 'margin-right:3px;' })} ${htmlT('contentUI.requirement')}</div>
          <div class="stat-val" style="color:#f1f5f9;">${formatNumber(ach.target)}</div>
        </div>
        <div class="ach-stat-card">
          <div class="stat-label">${renderIcon('timer', { size: 9, color: '#00f5d4', style: 'margin-right:3px;' })} ${htmlT('contentUI.progress')}</div>
          <div class="stat-val" style="color:${status.isCompleted ? '#2ecc71' : '#00f5d4'};">${status.isCompleted ? tr('contentUI.done') : `${status.percent}%`}</div>
        </div>
        <div class="ach-stat-card">
          <div class="stat-label">${renderIcon('soul_coin', { size: 9, color: '#ffd166', style: 'margin-right:3px;' })} ${htmlT('contentUI.reward')}</div>
          <div class="stat-val" style="color:#ffd166;">${htmlT('contentUI.soulsReward', { value1: ach.rewardGold })}</div>
        </div>
        <div class="ach-stat-card">
          <div class="stat-label">${renderIcon('keystone', { size: 9, color: '#c084fc', style: 'margin-right:3px;' })} ${htmlT('contentUI.unlock')}</div>
          <div class="stat-val" style="color:${ach.heroTitle ? '#c084fc' : '#94a3b8'};">${ach.heroTitle ? ach.heroTitle.split(',')[0] : tr('contentUI.glory')}</div>
        </div>
      </div>

      <!-- 4. Crônica de Lore Ancestral -->
      <div class="dossier-lore-box">
        <div class="dossier-box-header">
          <span class="dossier-box-icon">${renderIcon('scroll', { size: 12, color: '#ffd166', style: 'display:inline-block;vertical-align:middle;' })}</span>
          <span class="dossier-box-title">${htmlT('contentUI.ancestralLore')}</span>
          <span class="dossier-lock-status ${status.isCompleted ? 'unlocked' : 'locked'}">
            ${status.isCompleted ? `${renderIcon('check', { size: 9, color: '#2ecc71', style: 'vertical-align:middle;margin-right:2px;' })} ${tr('contentUI.immortalized')}` : `${renderIcon('lock', { size: 9, color: '#ff7675', style: 'vertical-align:middle;margin-right:2px;' })} ${tr('contentUI.onTrial')}`}
          </span>
        </div>
        <div class="dossier-box-content">
          "${ach.lore || tr('contentUI.unwrittenLore')}"
        </div>
      </div>

      <!-- 5. Diretriz Tática & Conduta de Sobrevivência -->
      <div class="dossier-lore-box dossier-tactics-box">
        <div class="dossier-box-header">
          <span class="dossier-box-icon">${renderIcon('sword', { size: 12, color: '#00f5d4', style: 'display:inline-block;vertical-align:middle;' })}</span>
          <span class="dossier-box-title">${htmlT('contentUI.combatGuidance')}</span>
          <span class="dossier-lock-status unlocked">${renderIcon('sparkle', { size: 9, color: '#00f5d4', style: 'vertical-align:middle;margin-right:2px;' })} ${htmlT('contentUI.recommendation')}</span>
        </div>
        <div class="dossier-box-content">
          ${ach.tactics || tr('contentUI.generalTactics')}
        </div>
      </div>
    </div>
  `;
}

onLanguageChange(() => {
  const modal = document.getElementById('achievements-modal');
  if (!modal?.classList.contains('active')) return;
  translateDOM(modal);
  renderAchievementsRoster(currentAchievementsCategory);
  renderAchievementDossier(selectedAchievementId);
  const souls = document.getElementById('ach-souls-val');
  if (souls) souls.textContent = '+' + formatNumber(getAchievementsSummary().totalSoulsReward);
});
