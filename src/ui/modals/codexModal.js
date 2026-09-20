/**
 * src/ui/modals/codexModal.js
 * Grimórios do Códice Ancestral: Conquistas Heroicas e Bestiário das Trevas.
 */
import { closeCharSelectModal, openCharacterSelect, isMobileScreen } from './characterSelectModal.js';
import { 
  getUnlockedAchievementIds, 
  ACHIEVEMENTS, 
  getAchievementStatus,
  getAchievementsSummary,
  getLifetimeStats,
  getBestRun 
} from '../../config/achievements.js';
import { 
  BESTIARY_ENTRIES, 
  isCreatureDiscovered, 
  getCreatureKills, 
  isLoreUnlocked 
} from '../../config/bestiary.js';
import { 
  startBestiaryPreview, 
  stopBestiaryPreview 
} from '../../render/bestiaryPreview.js';
import { 
  startBestRunTarot, 
  stopBestRunTarot,
  resizeBestRunCanvas 
} from '../../render/bestRunPreview.js';
import { renderIcon } from '../icons.js';
import { playSfx } from '../../core/audio.js';

const HERO_COLORS = {
  KNIGHT: '#f1c40f',
  MAGE: '#ff7675',
  ROGUE: '#c084fc',
  BARBARIAN: '#e74c3c',
  ALCHEMIST: '#9b59b6'
};

/**
 * Formata cada bênção/passiva como um chip de relíquia arcana com ícone, cor temática e valor destacado
 */
function formatPassiveChip(passiveText) {
  if (typeof passiveText !== 'string') return '';
  const text = passiveText.trim();
  
  let iconKey = 'sparkle';
  let iconColor = '#ffd166';
  let categoryClass = 'passive-general';

  if (text.includes('Poder Bruto') || text.includes('Dano')) {
    iconKey = 'sword';
    iconColor = '#ff7675';
    categoryClass = 'passive-damage';
  } else if (text.includes('Armadura') || text.includes('HP')) {
    iconKey = 'shield';
    iconColor = '#00f5d4';
    categoryClass = 'passive-defense';
  } else if (text.includes('Asas') || text.includes('Vel')) {
    iconKey = 'wing';
    iconColor = '#74b9ff';
    categoryClass = 'passive-speed';
  } else if (text.includes('Criogênico') || text.includes('Gelo')) {
    iconKey = 'snowflake';
    iconColor = '#81ecec';
    categoryClass = 'passive-frost';
  } else if (text.includes('Bíblia') || text.includes('Protetoras')) {
    iconKey = 'book';
    iconColor = '#ffeaa7';
    categoryClass = 'passive-holy';
  } else if (text.includes('Aura')) {
    iconKey = 'aura';
    iconColor = '#fdcb6e';
    categoryClass = 'passive-aura';
  } else if (text.includes('Foco Letal') || text.includes('Crítico') || text.includes('%')) {
    iconKey = 'target';
    iconColor = '#fd79a8';
    categoryClass = 'passive-crit';
  } else if (text.includes('Fúria') || text.includes('Haste')) {
    iconKey = 'lightning';
    iconColor = '#a29bfe';
    categoryClass = 'passive-haste';
  } else if (text.includes('Ímã')) {
    iconKey = 'magnet';
    iconColor = '#fab1a0';
    categoryClass = 'passive-utility';
  }

  const match = text.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    const name = match[1].trim();
    const val = match[2].trim();
    return `
      <div class="monument-passive-chip ${categoryClass}" title="${text}">
        <span class="chip-passive-icon">${renderIcon(iconKey, { size: 10, color: iconColor })}</span>
        <span class="chip-passive-name">${name}</span>
        <span class="chip-passive-val">${val}</span>
      </div>
    `;
  }

  return `
    <div class="monument-passive-chip ${categoryClass}" title="${text}">
      <span class="chip-passive-icon">${renderIcon(iconKey, { size: 10, color: iconColor })}</span>
      <span class="chip-passive-name">${text}</span>
    </div>
  `;
}

/**
 * Renderiza o Monumento da Maior Jornada (Formato Tarô Arcano Expandido em Alta Definição)
 */
function renderBestRunMonument(targetContainerId = 'best-run-monument-container') {
  const container = document.getElementById(targetContainerId);
  if (!container) return;

  const bestRun = getBestRun();

  if (!bestRun) {
    container.innerHTML = `
      <div class="monument-empty-card">
        <div class="monument-empty-icon-wrap">
          ${renderIcon('soul_coin', { size: 28, color: '#64748b' })}
        </div>
        <div class="monument-empty-eyebrow">MONUMENTO À MAIOR JORNADA</div>
        <div class="monument-empty-title">NENHUMA CRÔNICA GRAVADA AINDA</div>
        <div class="monument-empty-desc">
          Adentre a arena das trevas, purifique abominações e desafie os Senhores do Vazio. 
          Sua jornada mais gloriosa ficará eternizada aqui como um marco para todas as eras.
        </div>
        <div class="monument-empty-hint">
          ${renderIcon('sparkle', { size: 12, color: '#00f5d4' })} Inicie uma partida no Altar para inaugurar seu legado
        </div>
      </div>
    `;
    return;
  }

  const heroColor = HERO_COLORS[bestRun.heroKey] || '#f1c40f';

  let weaponsHtml = '';
  if (Array.isArray(bestRun.weapons) && bestRun.weapons.length > 0) {
    weaponsHtml = bestRun.weapons.map(w => `
      <div class="monument-weapon-chip ${w.evolved ? 'weapon-evolved' : ''}" title="${w.name || w.type}">
        <div class="weapon-chip-icon-box">
          ${renderIcon(w.iconKey || 'sword', { size: 13, color: w.evolved ? '#ffd166' : '#cbd5e1' })}
        </div>
        <div class="weapon-chip-text">
          <span class="weapon-chip-title">${w.name || w.type}</span>
          <div class="weapon-chip-sub">
            <span class="weapon-chip-lvl">Nv. ${w.level || 1}</span>
            ${w.evolved ? `<span class="weapon-chip-fusion-tag">${renderIcon('star_evolution', { size: 8, color: '#ffd166' })} FUSÃO</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  } else {
    weaponsHtml = `<span class="monument-empty-note">Nenhuma arma registrada nesta crônica.</span>`;
  }

  let passivesHtml = '';
  if (Array.isArray(bestRun.passives) && bestRun.passives.length > 0) {
    passivesHtml = bestRun.passives.map(formatPassiveChip).join('');
  } else {
    passivesHtml = `<span class="monument-empty-note">Nenhuma bênção ativa coletada.</span>`;
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
            <div class="monument-eyebrow-mini">SANTUÁRIO DO RECORDE SUPREMO</div>
            <div class="monument-title-text">MONUMENTO À MAIOR JORNADA</div>
          </div>
        </div>
        <div class="monument-meta-right">
          <div class="monument-date-chip">
            ${renderIcon('timer', { size: 10, color: '#a29bfe' })}
            <span>Gravado em ${bestRun.date || ''}</span>
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
              <div class="tarot-card-eyebrow">✦ ARCANO SUPREMO DO CÓDICE ✦</div>
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
                ${bestRun.verdictSub || (bestRun.isVictory ? 'O destino curva-se diante da tua glória' : 'Caiu perante as trevas ancestrais')}
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
                <div class="stat-pill-label label-gold">SCORE DA LENDA</div>
                <div class="stat-pill-val val-gold">${Number(bestRun.score).toLocaleString('pt-BR')} <span class="val-unit">PTS</span></div>
              </div>
            </div>

            <!-- 2. Sobrevivência -->
            <div class="monument-stat-pill pill-time">
              <div class="stat-pill-icon-wrap icon-amber">
                ${renderIcon('timer', { size: 13, color: '#f39c12' })}
              </div>
              <div class="stat-pill-data">
                <div class="stat-pill-label">SOBREVIVÊNCIA</div>
                <div class="stat-pill-val">${bestRun.time || '00:00'}</div>
              </div>
            </div>

            <!-- 3. Horda Máxima -->
            <div class="monument-stat-pill pill-wave">
              <div class="stat-pill-icon-wrap icon-cyan">
                ${renderIcon('wave_swords', { size: 13, color: '#00f5d4' })}
              </div>
              <div class="stat-pill-data">
                <div class="stat-pill-label">HORDA MÁXIMA</div>
                <div class="stat-pill-val text-cyan">${bestRun.waveText || `Onda ${bestRun.wave}`}</div>
              </div>
            </div>

            <!-- 4. Abates Purificados -->
            <div class="monument-stat-pill pill-kills">
              <div class="stat-pill-icon-wrap icon-ruby">
                ${renderIcon('skull', { size: 13, color: '#ff4757' })}
              </div>
              <div class="stat-pill-data">
                <div class="stat-pill-label">ABATES TOTAIS</div>
                <div class="stat-pill-val text-ruby">${Number(bestRun.kills).toLocaleString('pt-BR')}</div>
              </div>
            </div>

            <!-- 5. Ascensão Alcançada -->
            <div class="monument-stat-pill pill-level">
              <div class="stat-pill-icon-wrap icon-purple">
                ${renderIcon('sparkle', { size: 13, color: '#c084fc' })}
              </div>
              <div class="stat-pill-data">
                <div class="stat-pill-label">NÍVEL DE ASCENSÃO</div>
                <div class="stat-pill-val text-purple">Nv. ${bestRun.level}</div>
              </div>
            </div>

            <!-- 6. Almas Resgatadas -->
            <div class="monument-stat-pill pill-souls">
              <div class="stat-pill-icon-wrap icon-gold">
                ${renderIcon('soul_coin', { size: 13, color: '#f1c40f' })}
              </div>
              <div class="stat-pill-data">
                <div class="stat-pill-label">ALMAS COLHIDAS</div>
                <div class="stat-pill-val text-gold">+${Number(bestRun.souls).toLocaleString('pt-BR')}</div>
              </div>
            </div>
          </div>

          <!-- Seção de Equipamento: Arsenal Principal -->
          <div class="monument-arsenal-section">
            <div class="monument-section-header">
              <span class="monument-section-tag">
                ${renderIcon('sword', { size: 11, color: '#ffd166' })}
                ARSENAL CONSAGRADO
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
                BÊNÇÃOS & TRANSMUTAÇÕES ATIVAS (${Array.isArray(bestRun.passives) ? bestRun.passives.length : 0})
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
              <span>MARCOS HISTÓRICOS DA CONTA</span>
            </div>
            <div class="lifetime-strip-chips">
              <div class="lifetime-bench-chip" title="Maior massacre de inimigos em uma partida única">
                <span class="bench-label">MAIOR MASSACRE:</span>
                <span class="bench-val text-ruby">${Number(lifetime.singleRunMaxKills || 0).toLocaleString('pt-BR')}</span>
              </div>
              <div class="lifetime-bench-chip" title="Maior tempo de sobrevivência registrado na conta">
                <span class="bench-label">RECORDE DE TEMPO:</span>
                <span class="bench-val text-amber">${formatSeconds(lifetime.maxSurvivalSeconds || 0)}</span>
              </div>
              <div class="lifetime-bench-chip" title="Total de baús misteriosos abertos em todas as jornadas">
                <span class="bench-label">BAÚS ABERTOS:</span>
                <span class="bench-val text-gold">${Number(lifetime.totalChestsOpened || 0).toLocaleString('pt-BR')}</span>
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
  if (soulsEl) soulsEl.innerText = `+${summary.totalSoulsReward.toLocaleString('pt-BR')}`;

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
    return;
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
    if (cat === 'ALL') labelEl.innerText = `TODAS (${ACHIEVEMENTS.length})`;
    else if (cat === 'hero') labelEl.innerText = `HERÓIS (${heroTotal})`;
    else if (cat === 'combat') labelEl.innerText = `COMBATE (${combatTotal})`;
    else if (cat === 'boss') labelEl.innerText = `CHEFES (${bossTotal})`;
    else if (cat === 'arsenal') labelEl.innerText = `ARSENAL (${arsenalTotal})`;
    else if (cat === 'mastery') labelEl.innerText = `CÓDICE (${masteryTotal})`;
  });

  const filterBadgeEl = document.getElementById('achievements-filter-badge');
  if (filterBadgeEl) {
    const catLabels = {
      'ALL': `TODAS (${ACHIEVEMENTS.length})`,
      'hero': `HERÓIS (${heroTotal})`,
      'combat': `COMBATE (${combatTotal})`,
      'boss': `CHEFES (${bossTotal})`,
      'arsenal': `ARSENAL (${arsenalTotal})`,
      'mastery': `CÓDICE (${masteryTotal})`,
      'JOURNEY': `MAIOR JORNADA`
    };
    filterBadgeEl.innerText = catLabels[filterCategory] || `FILTRO (${entries.length})`;
  }

  entries.forEach(ach => {
    const status = getAchievementStatus(ach.id);
    const isSelected = ach.id === selectedAchievementId;

    let catBadgeClass = 'badge-cat-hero';
    let catLabel = 'HERÓI';
    if (ach.category === 'combat') {
      catBadgeClass = 'badge-cat-combat';
      catLabel = 'COMBATE';
    } else if (ach.category === 'boss') {
      catBadgeClass = 'badge-cat-boss';
      catLabel = 'CHEFE';
    } else if (ach.category === 'arsenal') {
      catBadgeClass = 'badge-cat-arsenal';
      catLabel = 'ARSENAL';
    } else if (ach.category === 'mastery') {
      catBadgeClass = 'badge-cat-mastery';
      catLabel = 'CÓDICE';
    }

    let rewardBadge = '';
    if (ach.heroTitle) {
      rewardBadge = `<span class="ach-reward-pill ach-hero-reward">${renderIcon('keystone', { size: 9, color: '#a29bfe' })} ${ach.heroTitle.split(',')[0]}</span>`;
    } else if (ach.rewardGold > 0) {
      rewardBadge = `<span class="ach-reward-pill ach-gold-reward">${renderIcon('soul_coin', { size: 9, color: '#ffd166' })} +${ach.rewardGold} Almas</span>`;
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
            ${status.isCompleted ? `${renderIcon('check', { size: 9, color: '#2ecc71', style: 'vertical-align:middle;margin-right:2px;' })} CONCLUÍDO` : `${status.percent}%`}
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
      if (dossierTag) dossierTag.innerText = 'SANTUÁRIO DO RECORDE';
      if (dossierTier) {
        dossierTier.innerText = 'ARCANO SUPREMO';
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
  if (ach.tier === 'PRIMORDIAL') tierClass = 'tier-primordial';
  else if (ach.tier === 'LENDÁRIO') tierClass = 'tier-legendary';

  if (dossierTag) dossierTag.innerText = 'ALTAR DE CONSAGRAÇÃO';
  if (dossierTier) {
    dossierTier.innerText = ach.tier || 'HERÓICO';
    dossierTier.className = `pillar-badge-hero ${tierClass}`;
  }

  let catBadgeClass = 'badge-cat-hero';
  let catLabel = 'DESPERTAR DE CAMPEÃO';
  if (ach.category === 'combat') {
    catBadgeClass = 'badge-cat-combat';
    catLabel = 'FAÇANHA DE COMBATE';
  } else if (ach.category === 'boss') {
    catBadgeClass = 'badge-cat-boss';
    catLabel = 'PURIFICAÇÃO DE CHEFE';
  } else if (ach.category === 'arsenal') {
    catBadgeClass = 'badge-cat-arsenal';
    catLabel = 'TRANSMUTAÇÃO DO ARSENAL';
  } else if (ach.category === 'mastery') {
    catBadgeClass = 'badge-cat-mastery';
    catLabel = 'DESTINO & CÓDICE';
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
          ${status.isCompleted ? `${renderIcon('check', { size: 10, color: '#2ecc71', style: 'vertical-align:middle;margin-right:3px;' })} CONCLUÍDO COM GLÓRIA` : `${renderIcon('timer', { size: 10, color: '#ffd166', style: 'vertical-align:middle;margin-right:3px;' })} EM ANDAMENTO`}
        </div>
      </div>

      <!-- 2. Cabeçalho de Identidade Monumental -->
      <div class="dossier-identity">
        <div class="dossier-name-row">
          <h2 class="dossier-name" style="color: ${status.isCompleted ? '#ffd166' : '#f1f5f9'};">
            ${ach.title}
          </h2>
          <span class="dossier-tier-badge ${tierClass}">${ach.tier || 'HERÓICO'}</span>
        </div>
        <div class="dossier-desc">${ach.desc}</div>
      </div>

      <!-- 3. Grade Biométrica do Feito (4 Cards) -->
      <div class="dossier-stats-grid">
        <div class="ach-stat-card">
          <div class="stat-label">${renderIcon('execute', { size: 9, color: '#a29bfe', style: 'margin-right:3px;' })} REQUISITO</div>
          <div class="stat-val" style="color:#f1f5f9;">${ach.target.toLocaleString('pt-BR')}</div>
        </div>
        <div class="ach-stat-card">
          <div class="stat-label">${renderIcon('timer', { size: 9, color: '#00f5d4', style: 'margin-right:3px;' })} PROGRESSO</div>
          <div class="stat-val" style="color:${status.isCompleted ? '#2ecc71' : '#00f5d4'};">${status.isCompleted ? '100% (FEITO)' : `${status.percent}%`}</div>
        </div>
        <div class="ach-stat-card">
          <div class="stat-label">${renderIcon('soul_coin', { size: 9, color: '#ffd166', style: 'margin-right:3px;' })} RECOMPENSA</div>
          <div class="stat-val" style="color:#ffd166;">+${ach.rewardGold} Almas</div>
        </div>
        <div class="ach-stat-card">
          <div class="stat-label">${renderIcon('keystone', { size: 9, color: '#c084fc', style: 'margin-right:3px;' })} DESBLOQUEIO</div>
          <div class="stat-val" style="color:${ach.heroTitle ? '#c084fc' : '#94a3b8'};">${ach.heroTitle ? ach.heroTitle.split(',')[0] : 'Glória'}</div>
        </div>
      </div>

      <!-- 4. Crônica de Lore Ancestral -->
      <div class="dossier-lore-box">
        <div class="dossier-box-header">
          <span class="dossier-box-icon">${renderIcon('scroll', { size: 12, color: '#ffd166', style: 'display:inline-block;vertical-align:middle;' })}</span>
          <span class="dossier-box-title">CRÔNICA DE LORE ANCESTRAL</span>
          <span class="dossier-lock-status ${status.isCompleted ? 'unlocked' : 'locked'}">
            ${status.isCompleted ? `${renderIcon('check', { size: 9, color: '#2ecc71', style: 'vertical-align:middle;margin-right:2px;' })} ETERNIZADO` : `${renderIcon('lock', { size: 9, color: '#ff7675', style: 'vertical-align:middle;margin-right:2px;' })} EM PROVAÇÃO`}
          </span>
        </div>
        <div class="dossier-box-content">
          "${ach.lore || 'Os ecos do destino ainda aguardam que sua lenda seja gravada nas lajes de pedra do submundo.'}"
        </div>
      </div>

      <!-- 5. Diretriz Tática & Conduta de Sobrevivência -->
      <div class="dossier-lore-box dossier-tactics-box">
        <div class="dossier-box-header">
          <span class="dossier-box-icon">${renderIcon('sword', { size: 12, color: '#00f5d4', style: 'display:inline-block;vertical-align:middle;' })}</span>
          <span class="dossier-box-title">DIRETRIZ TÁTICA DE COMBATE</span>
          <span class="dossier-lock-status unlocked">${renderIcon('sparkle', { size: 9, color: '#00f5d4', style: 'vertical-align:middle;margin-right:2px;' })} RECOMENDAÇÃO</span>
        </div>
        <div class="dossier-box-content">
          ${ach.tactics || 'Mantenha movimentação constante e adapte seu arsenal conforme as fraquezas da horda.'}
        </div>
      </div>
    </div>
  `;
}

// ========================================================
// CÓDICE DO BESTIÁRIO DAS TREVAS (Grimório de Criaturas Neo-Arcane)
// ========================================================
export let currentBestiaryCategory = 'ALL';
export let selectedCreatureId = 'ZOMBIE';

export function setCurrentBestiaryCategory(cat) {
  currentBestiaryCategory = cat;
}

export function openBestiaryModal() {
  const hud = document.getElementById('hud');
  if (hud) {
    hud.classList.add('hud-hidden');
    hud.style.setProperty('display', 'none', 'important');
    hud.style.display = 'none';
  }
  closeCharSelectModal();

  const modal = document.getElementById('bestiary-modal');
  if (!modal) return;

  const isMobile = isMobileScreen();
  modal.classList.toggle('is-mobile-device', isMobile);

  // Calcula estatísticas agregadas globais do Códice
  const discoveredCount = BESTIARY_ENTRIES.filter(c => isCreatureDiscovered(c.id)).length;
  const totalCount = BESTIARY_ENTRIES.length;
  const totalKills = BESTIARY_ENTRIES.reduce((acc, c) => acc + (getCreatureKills(c.id) || 0), 0);
  const completionPct = Math.round((discoveredCount / totalCount) * 100);

  const discoveredCountEl = document.getElementById('bestiary-discovered-count');
  if (discoveredCountEl) discoveredCountEl.innerText = discoveredCount;
  const totalCountEl = document.getElementById('bestiary-total-count');
  if (totalCountEl) totalCountEl.innerText = totalCount;
  const totalKillsEl = document.getElementById('bestiary-total-kills-val');
  if (totalKillsEl) totalKillsEl.innerText = totalKills.toLocaleString('pt-BR');
  const completionEl = document.getElementById('bestiary-completion-val');
  if (completionEl) completionEl.innerText = `${completionPct}%`;

  modal.classList.remove('modal-hidden', 'closing');
  modal.classList.add('active');
  modal.style.removeProperty('display');
  modal.style.display = 'flex';

  renderBestiaryRoster(currentBestiaryCategory);
  renderBestiaryDossier(selectedCreatureId);

  playSfx('level');
}

export function closeBestiaryModal() {
  const modal = document.getElementById('bestiary-modal');
  if (modal) {
    modal.classList.add('closing');
    setTimeout(() => {
      stopBestiaryPreview();
      modal.classList.remove('active', 'closing');
      modal.classList.add('modal-hidden');
      modal.style.setProperty('display', 'none', 'important');
      modal.style.display = 'none';
      openCharacterSelect();
    }, 200);
  } else {
    stopBestiaryPreview();
    openCharacterSelect();
  }
}

export function selectBestiaryCreature(creatureId) {
  selectedCreatureId = creatureId;
  const cards = document.querySelectorAll('.bestiary-card');
  cards.forEach(c => {
    const isTarget = c.getAttribute('data-id') === creatureId;
    c.classList.toggle('active', isTarget);
    if (isTarget) {
      try {
        c.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } catch (err) {}
    }
  });

  const dossierPanel = document.getElementById('bestiary-dossier-panel');
  if (dossierPanel) {
    dossierPanel.classList.remove('dossier-slide-enter');
    void dossierPanel.offsetWidth;
    dossierPanel.classList.add('dossier-slide-enter');
  }

  renderBestiaryDossier(creatureId);
  playSfx('click');
}

export function renderBestiaryRoster(filterCategory = 'ALL') {
  const rosterGrid = document.getElementById('bestiary-roster-grid');
  if (!rosterGrid) return;

  rosterGrid.innerHTML = '';

  let entries = BESTIARY_ENTRIES;
  if (filterCategory && filterCategory !== 'ALL') {
    entries = entries.filter(c => c.category === filterCategory);
  }

  // Atualizar contador de descobertos no cabeçalho
  const discoveredCount = BESTIARY_ENTRIES.filter(c => isCreatureDiscovered(c.id)).length;
  const countEl = document.getElementById('bestiary-discovered-count');
  if (countEl) countEl.innerText = discoveredCount;
  const totalEl = document.getElementById('bestiary-total-count');
  if (totalEl) totalEl.innerText = BESTIARY_ENTRIES.length;

  // Atualizar contadores dinâmicos nos botões de categoria
  const hordeTotal = BESTIARY_ENTRIES.filter(c => c.category === 'HORDE').length;
  const miniTotal = BESTIARY_ENTRIES.filter(c => c.category === 'MINIBOSS').length;
  const bossTotal = BESTIARY_ENTRIES.filter(c => c.category === 'BOSS').length;
  
  document.querySelectorAll('.bestiary-tab-btn').forEach(btn => {
    const cat = btn.getAttribute('data-cat');
    const labelEl = btn.querySelector('.tab-label') || btn;
    if (cat === 'ALL') labelEl.innerText = `TODOS (${BESTIARY_ENTRIES.length})`;
    else if (cat === 'HORDE') labelEl.innerText = `HORDAS (${hordeTotal})`;
    else if (cat === 'MINIBOSS') labelEl.innerText = `MINI-CHEFES (${miniTotal})`;
    else if (cat === 'BOSS') labelEl.innerText = `CHEFES (${bossTotal})`;
  });

  // Atualiza badge de filtro ativo no topo do Pilar de Roster
  const filterBadgeEl = document.getElementById('bestiary-filter-badge');
  if (filterBadgeEl) {
    const catLabels = {
      'ALL': `TODOS (${BESTIARY_ENTRIES.length})`,
      'HORDE': `HORDAS (${hordeTotal})`,
      'MINIBOSS': `MINI-CHEFES (${miniTotal})`,
      'BOSS': `CHEFES (${bossTotal})`
    };
    filterBadgeEl.innerText = catLabels[filterCategory] || `FILTRO (${entries.length})`;
  }

  entries.forEach(c => {
    const isDiscovered = isCreatureDiscovered(c.id);
    const kills = getCreatureKills(c.id);
    const isSelected = c.id === selectedCreatureId;
    const stars = '★'.repeat(c.threat);

    const card = document.createElement('div');
    card.className = `bestiary-card ${isSelected ? 'active' : ''} ${isDiscovered ? 'discovered' : 'undiscovered'}`;
    card.setAttribute('data-id', c.id);

    let catBadgeClass = 'badge-horde';
    let catLabel = 'HORDA';
    if (c.category === 'BOSS') { 
      catBadgeClass = 'badge-boss'; 
      catLabel = 'CHEFE'; 
    } else if (c.category === 'MINIBOSS') { 
      catBadgeClass = 'badge-miniboss'; 
      catLabel = 'MINIBOSS'; 
    }

    card.innerHTML = `
      <div class="bcard-active-glow"></div>
      <div class="bcard-avatar-wrap" style="border-color: ${isDiscovered ? (c.color + 'aa') : 'rgba(255, 71, 87, 0.4)'}; box-shadow: 0 0 12px ${isDiscovered ? (c.color + '33') : 'rgba(255, 71, 87, 0.15)'};">
        <span class="bcard-avatar-icon">${isDiscovered ? (c.category === 'BOSS' ? renderIcon('boss_crown', { size: 15, color: '#c084fc' }) : (c.category === 'MINIBOSS' ? renderIcon('damage', { size: 14, color: '#f39c12' }) : renderIcon('skull', { size: 14, color: '#2ecc71' }))) : renderIcon('lock', { size: 13, color: '#ff7675' })}</span>
      </div>
      <div class="bcard-info">
        <div class="bcard-top-row">
          <span class="bcard-name ${isDiscovered ? '' : 'undiscovered-name'}" style="color: ${isDiscovered ? (c.color || '#fff') : '#888'};">
            ${isDiscovered ? c.name : '???'}
          </span>
          <span class="bcard-cat-pill ${catBadgeClass}">${catLabel}</span>
        </div>
        <div class="bcard-sub-row">
          <span class="bcard-kills">${isDiscovered ? `${kills.toLocaleString('pt-BR')} ${kills === 1 ? 'abate' : 'abates'}` : 'Não catalogado'}</span>
          <span class="bcard-threat" title="Nível de Ameaça: ${c.threat}/5">${stars}</span>
        </div>
      </div>
      <div class="bcard-select-edge"></div>
    `;

    card.onclick = (e) => {
      e.stopPropagation();
      selectBestiaryCreature(c.id);
    };

    rosterGrid.appendChild(card);
  });
}

export function renderBestiaryDossier(creatureId) {
  const dossierPanel = document.getElementById('bestiary-dossier-panel');
  if (!dossierPanel) return;

  const c = BESTIARY_ENTRIES.find(x => x.id === creatureId) || BESTIARY_ENTRIES[0];
  const kills = getCreatureKills(c.id);
  const isDiscovered = isCreatureDiscovered(c.id);
  const isLore = isLoreUnlocked(c);
  const reqKills = c.category === 'HORDE' ? 10 : 1;
  const stars = '★'.repeat(c.threat) + '☆'.repeat(Math.max(0, 5 - c.threat));

  // Atualiza insígnia de arquétipo no cabeçalho do pilar
  const archetypeBadge = document.getElementById('bestiary-dossier-archetype');
  if (archetypeBadge) {
    if (!isDiscovered) {
      archetypeBadge.innerText = 'DESCONHECIDO';
      archetypeBadge.className = 'pillar-badge-hero badge-unknown';
    } else if (c.category === 'BOSS') {
      archetypeBadge.innerText = 'CHEFE SUPREMO';
      archetypeBadge.className = 'pillar-badge-hero badge-boss';
    } else if (c.category === 'MINIBOSS') {
      archetypeBadge.innerText = 'MINI-CHEFE';
      archetypeBadge.className = 'pillar-badge-hero badge-miniboss';
    } else {
      archetypeBadge.innerText = 'ENXAME DA HORDA';
      archetypeBadge.className = 'pillar-badge-hero badge-horde';
    }
  }

  dossierPanel.innerHTML = `
    <div class="dossier-card-wrap">
      <!-- 1. Palco da Prévia em Alta Definição com Backlight Reativo -->
      <div class="bestiary-preview-viewport" style="--creature-ambient: ${isDiscovered ? (c.color + '44') : 'rgba(255, 71, 87, 0.25)'};">
        <div class="preview-ambient-glow"></div>
        <canvas id="bestiary-preview-canvas" width="220" height="220"></canvas>
        <div class="bestiary-category-pill" style="border-color:${isDiscovered ? c.color : '#ff4757'}; color:${isDiscovered ? c.color : '#ff7675'};">
          ${c.category === 'BOSS' ? `${renderIcon('boss_crown', { size: 12, color: '#c084fc', style: 'vertical-align:middle;margin-right:4px;' })} CHEFE SUPREMO` : (c.category === 'MINIBOSS' ? `${renderIcon('damage', { size: 12, color: '#f39c12', style: 'vertical-align:middle;margin-right:4px;' })} MINI-CHEFE` : `${renderIcon('skull', { size: 12, color: '#2ecc71', style: 'vertical-align:middle;margin-right:4px;' })} HORDA DE ENXAME`)}
        </div>
        <div class="bestiary-kills-pill">
          ${isDiscovered ? `${renderIcon('wave_swords', { size: 12, color: '#00f5d4', style: 'vertical-align:middle;margin-right:4px;' })} ${kills.toLocaleString('pt-BR')} Abates` : `${renderIcon('lock', { size: 11, color: '#ff7675', style: 'vertical-align:middle;margin-right:4px;' })} Não Catalogado`}
        </div>
      </div>

      <!-- 2. Cabeçalho de Identidade Monumental -->
      <div class="dossier-identity">
        <div class="dossier-name-row">
          <h2 class="dossier-name" style="color: ${isDiscovered ? (c.color || '#00f5d4') : '#ff7675'};">
            ${isDiscovered ? c.name : '???'}
          </h2>
          <span class="dossier-threat-badge" title="Nível de Ameaça: ${c.threat}/5">
            ${stars}
          </span>
        </div>
        <div class="dossier-title">
          ${isDiscovered ? c.title : 'Espécime Oculto nas Sombras do Abismo'}
        </div>
      </div>

      <!-- 3. Parâmetros de Biometria & Combate (Estilo Neo-Arcane Pause) -->
      <div class="dossier-stats-grid">
        <div class="bestiary-stat-card stat-hp">
          <div class="stat-label">
            ${renderIcon('heart', { size: 11, color: '#ff7675', style: 'vertical-align:middle;margin-right:3px;' })} VIDA BASE
          </div>
          <div class="stat-val highlight-ruby">${isDiscovered ? c.hp.toLocaleString('pt-BR') : '???'}</div>
        </div>
        <div class="bestiary-stat-card stat-damage">
          <div class="stat-label">
            ${renderIcon('sword', { size: 11, color: '#ffd166', style: 'vertical-align:middle;margin-right:3px;' })} DANO CONTATO
          </div>
          <div class="stat-val highlight-gold">${isDiscovered ? c.damage : '???'}</div>
        </div>
        <div class="bestiary-stat-card stat-speed">
          <div class="stat-label">
            ${renderIcon('boot', { size: 11, color: '#00f5d4', style: 'vertical-align:middle;margin-right:3px;' })} VELOCIDADE
          </div>
          <div class="stat-val highlight-cyan">${isDiscovered ? c.speed : '???'}</div>
        </div>
        <div class="bestiary-stat-card stat-role">
          <div class="stat-label">
            ${renderIcon('execute', { size: 11, color: '#a29bfe', style: 'vertical-align:middle;margin-right:3px;' })} FUNÇÃO TÁTICA
          </div>
          <div class="stat-val highlight-purple">${isDiscovered ? c.role : '???'}</div>
        </div>
      </div>

      <!-- 4. Crônica de Origem Profana (Micro-Lore Rúnica) -->
      <div class="dossier-lore-box ${isLore ? '' : 'is-locked'}">
        <div class="dossier-box-header">
          <span class="dossier-box-icon">${renderIcon('scroll', { size: 13, color: '#ffd166', style: 'display:inline-block;vertical-align:middle;' })}</span>
          <span class="dossier-box-title">CRÔNICA DE ORIGEM PROFANA</span>
          <span class="dossier-lock-status ${isLore ? 'unlocked' : 'locked'}">${isLore ? `${renderIcon('check', { size: 10, color: '#2ecc71', style: 'vertical-align:middle;margin-right:2px;' })} DESCRIPTOGRAFADO` : `${renderIcon('lock', { size: 10, color: '#ff7675', style: 'vertical-align:middle;margin-right:2px;' })} Requer ${reqKills} ${reqKills === 1 ? 'abate' : 'abates'}`}</span>
        </div>
        <div class="dossier-box-content">
          ${isLore ? c.microLore : (isDiscovered ? `O véu do mistério ainda oculta a origem ancestral desta abominação. Abata mais ${Math.max(1, reqKills - kills)} espécimes para decifrar seu registro.` : 'Criatura desconhecida. Elimine-a na arena para iniciar a extração de dados biométricos.')}
        </div>
      </div>

      <!-- 5. Fraquezas Táticas & Diretrizes de Sobrevivência -->
      <div class="dossier-lore-box dossier-tactics-box ${isLore ? '' : 'is-locked'}">
        <div class="dossier-box-header">
          <span class="dossier-box-icon">${renderIcon('sword', { size: 13, color: '#00f5d4', style: 'display:inline-block;vertical-align:middle;' })}</span>
          <span class="dossier-box-title">FRAQUEZA & CONDUTA TÁTICA</span>
          <span class="dossier-lock-status ${isLore ? 'unlocked' : 'locked'}">${isLore ? `${renderIcon('sparkle', { size: 10, color: '#00f5d4', style: 'vertical-align:middle;margin-right:2px;' })} REVELADO` : `${renderIcon('lock', { size: 10, color: '#ff7675', style: 'vertical-align:middle;margin-right:2px;' })} BLOQUEADO`}</span>
        </div>
        <div class="dossier-box-content">
          ${isLore ? c.tactics : 'Fraquezas e pontos vulneráveis desconhecidos.'}
        </div>
      </div>

      <!-- 6. Citações e Ecos do Vazio (Quotes / Barks) -->
      ${c.quotes && c.quotes.length > 0 ? `
        <div class="dossier-quotes-box ${isLore ? '' : 'is-locked'}">
          <div class="dossier-box-header">
            <span class="dossier-box-icon">${renderIcon('quote', { size: 13, color: '#a29bfe', style: 'display:inline-block;vertical-align:middle;' })}</span>
            <span class="dossier-box-title">ECOS & CITAÇÕES DA ARENA</span>
          </div>
          <div class="dossier-quotes-list">
            ${isLore ? c.quotes.map(q => `<div class="dossier-quote-item">${q}</div>`).join('') : '<div class="dossier-quote-item locked-quote">“...” (Ecos selados pelo Abismo)</div>'}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  const previewCanvasEl = document.getElementById('bestiary-preview-canvas');
  if (previewCanvasEl) {
    startBestiaryPreview(previewCanvasEl, c, isDiscovered);
  }
}
