/**
 * src/ui/modals/codexModal.js
 * Grimórios do Códice Ancestral: Conquistas Heroicas e Bestiário das Trevas.
 */
import { closeCharSelectModal, openCharacterSelect, isMobileScreen } from './characterSelectModal.js';
import { 
  getUnlockedAchievementIds, 
  ACHIEVEMENTS, 
  getAchievementStatus,
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
  stopBestRunTarot 
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
 * Renderiza o Monumento da Melhor Run (Formato Tarô Arcano) no topo do Grimório
 */
function renderBestRunMonument() {
  const container = document.getElementById('best-run-monument-container');
  if (!container) return;

  const bestRun = getBestRun();

  if (!bestRun) {
    container.innerHTML = `
      <div class="monument-empty-card">
        <div class="monument-empty-icon-wrap">
          ${renderIcon('soul_coin', { size: 24, color: '#64748b' })}
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
        ${renderIcon(w.iconKey || 'sword', { size: 12, color: w.evolved ? '#ffd166' : '#94a3b8' })}
        <span class="chip-name">${w.name || w.type}</span>
        ${w.evolved ? `<span class="chip-fusion-tag">${renderIcon('star_evolution', { size: 9, color: '#ffd166' })} FUSÃO</span>` : ''}
      </div>
    `).join('');
  } else {
    weaponsHtml = `<span style="font-size:9.5px; color:#64748b; font-style:italic;">Nenhuma arma registrada.</span>`;
  }

  const passivesHtml = (Array.isArray(bestRun.passives) && bestRun.passives.length > 0)
    ? bestRun.passives.join(' • ')
    : '';

  container.innerHTML = `
    <div class="best-run-monument-box ${bestRun.isVictory ? 'monument-victory' : 'monument-defeat'}">
      <!-- Barra Superior do Monumento -->
      <div class="monument-header-row">
        <div class="monument-title-wrap">
          <span class="monument-pulsing-glyph"></span>
          <span class="monument-title-text">MONUMENTO À MAIOR JORNADA • RECORDE HISTÓRICO</span>
        </div>
        <div class="monument-meta-right">
          <span class="monument-date">Gravado em ${bestRun.date || ''}</span>
          <span class="monument-fate-badge ${bestRun.isVictory ? 'badge-victory' : 'badge-defeat'}">
            ${bestRun.isVictory ? renderIcon('boss_crown', { size: 12, color: '#ffd166', style: 'vertical-align:middle;margin-right:4px;' }) : renderIcon('skull', { size: 12, color: '#ff7675', style: 'vertical-align:middle;margin-right:4px;' })}
            ${bestRun.verdictTitle}
          </span>
        </div>
      </div>

      <!-- Grade Principal (Carta de Tarô Arcano + Painel Biométrico) -->
      <div class="monument-main-grid">
        <!-- Coluna da Esquerda: A Carta de Tarô Arcano -->
        <div class="tarot-card-wrapper">
          <div class="tarot-hero-card ${bestRun.isVictory ? 'tarot-victory' : 'tarot-defeat'}">
            <div class="tarot-card-header">
              <div class="tarot-card-eyebrow">✦ ARCANO SUPREMO DO CÓDICE ✦</div>
              <div class="tarot-hero-name" style="color: ${heroColor};">${bestRun.heroName}</div>
              <div class="tarot-hero-subtitle">${bestRun.heroTitle}</div>
            </div>

            <div class="tarot-canvas-window">
              <canvas id="best-run-tarot-canvas" width="220" height="175"></canvas>
            </div>

            <div class="tarot-card-footer">
              <div class="tarot-verdict-quote">"${bestRun.verdictSub || 'O destino curva-se diante da tua glória'}"</div>
            </div>
          </div>
        </div>

        <!-- Coluna da Direita: Biometria e Arsenal -->
        <div class="monument-details-col">
          <!-- Grade das 6 Métricas -->
          <div class="monument-metrics-grid">
            <!-- 1. Sobrevivência -->
            <div class="monument-stat-pill">
              <div class="stat-pill-label">
                ${renderIcon('timer', { size: 11, color: '#ffd166' })} SOBREVIVÊNCIA
              </div>
              <div class="stat-pill-val">${bestRun.time || '00:00'}</div>
            </div>

            <!-- 2. Horda Máxima -->
            <div class="monument-stat-pill">
              <div class="stat-pill-label">
                ${renderIcon('wave_swords', { size: 11, color: '#00f5d4' })} HORDA MÁXIMA
              </div>
              <div class="stat-pill-val text-cyan">${bestRun.waveText || `Onda ${bestRun.wave}`}</div>
            </div>

            <!-- 3. Abates -->
            <div class="monument-stat-pill">
              <div class="stat-pill-label">
                ${renderIcon('skull', { size: 11, color: '#ff4757' })} ABATES
              </div>
              <div class="stat-pill-val text-ruby">${Number(bestRun.kills).toLocaleString('pt-BR')}</div>
            </div>

            <!-- 4. Ascensão -->
            <div class="monument-stat-pill">
              <div class="stat-pill-label">
                ${renderIcon('sparkle', { size: 11, color: '#c084fc' })} ASCENSÃO
              </div>
              <div class="stat-pill-val text-purple">Nv. ${bestRun.level}</div>
            </div>

            <!-- 5. Almas -->
            <div class="monument-stat-pill">
              <div class="stat-pill-label">
                ${renderIcon('soul_coin', { size: 11, color: '#f1c40f' })} ALMAS
              </div>
              <div class="stat-pill-val text-gold">+${Number(bestRun.souls).toLocaleString('pt-BR')}</div>
            </div>

            <!-- 6. Score da Lenda -->
            <div class="monument-stat-pill pill-legendary-score">
              <div class="stat-pill-label label-gold">
                ${renderIcon('trophy', { size: 11, color: '#ffd166' })} SCORE DA LENDA
              </div>
              <div class="stat-pill-val val-score-glow">${Number(bestRun.score).toLocaleString('pt-BR')} PTS</div>
            </div>
          </div>

          <!-- Arsenal Consagrado & Bênçãos -->
          <div class="monument-arsenal-section">
            <div class="monument-arsenal-row">
              <span class="arsenal-row-title">ARSENAL DO HERÓI:</span>
              <div class="arsenal-chips-wrap">
                ${weaponsHtml}
              </div>
            </div>
            ${passivesHtml ? `
              <div class="monument-passives-row">
                ${renderIcon('sparkle', { size: 10, color: '#ffd166' })}
                <span>Bênçãos Ativas: ${passivesHtml}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  // Inicializa a renderização 2D procedural no Canvas do Preview
  const cvs = document.getElementById('best-run-tarot-canvas');
  if (cvs) {
    startBestRunTarot(cvs, bestRun.heroKey, bestRun.isVictory);
  }
}

export function openAchievementsModal() {
  closeCharSelectModal();

  const modal = document.getElementById('achievements-modal');
  const grid = document.getElementById('achievements-list-grid');
  const unlockedCountEl = document.getElementById('achievements-unlocked-count');
  const totalCountEl = document.getElementById('achievements-total-count');
  if (!modal || !grid) return;

  const isMobile = isMobileScreen();
  modal.classList.toggle('is-mobile-device', isMobile);

  const unlockedIds = getUnlockedAchievementIds();
  if (unlockedCountEl) unlockedCountEl.innerText = unlockedIds.length;
  if (totalCountEl) totalCountEl.innerText = ACHIEVEMENTS.length;

  // Renderiza o Monumento da Melhor Run (Tarô Arcano)
  renderBestRunMonument();

  grid.innerHTML = '';
  ACHIEVEMENTS.forEach(ach => {
    const status = getAchievementStatus(ach.id);
    const card = document.createElement('div');
    card.className = `achievement-card ${status.isCompleted ? 'ach-completed' : 'ach-locked'}`;

    let rewardBadge = '';
    if (ach.heroTitle) {
      rewardBadge = `<span class="ach-reward-pill ach-hero-reward">${renderIcon('lock', { size: 10, color: '#00f5d4', style: 'vertical-align:middle;margin-right:2px;' })} Desbloqueia: <b>${ach.heroTitle}</b></span>`;
    } else if (ach.rewardGold > 0) {
      rewardBadge = `<span class="ach-reward-pill ach-gold-reward">${renderIcon('gold', { size: 10, color: '#f1c40f', style: 'vertical-align:middle;margin-right:2px;' })} +${ach.rewardGold} Almas</span>`;
    }

    card.innerHTML = `
      <div class="ach-card-icon-wrap ${status.isCompleted ? 'completed' : ''}">
        <span class="ach-emblem-icon">${status.isCompleted ? renderIcon('sparkle', { size: 16, color: '#ffd166' }) : renderIcon('lock', { size: 15, color: '#636e72' })}</span>
      </div>
      <div class="ach-card-details">
        <div class="ach-card-top-row">
          <div class="ach-card-name ${status.isCompleted ? 'name-completed' : ''}">${ach.title}</div>
          <span class="ach-status-badge ${status.isCompleted ? 'badge-done' : 'badge-pending'}">
            ${status.isCompleted ? `${renderIcon('check', { size: 10, color: '#2ecc71', style: 'vertical-align:middle;margin-right:3px;' })} CONCLUÍDO` : status.label}
          </span>
        </div>
        <div class="ach-card-desc">${ach.desc}</div>
        <div class="ach-progress-container">
          <div class="ach-progress-rail">
            <div class="ach-progress-bar" style="width: ${status.percent}%;"></div>
          </div>
          <div class="ach-card-bottom-row">
            <div class="ach-reward-wrap">${rewardBadge}</div>
            <span class="ach-pct-text">${status.percent}%</span>
          </div>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  modal.classList.remove('modal-hidden');
  modal.style.removeProperty('display');
  modal.style.display = 'flex';
  playSfx('level');
}

export function closeAchievementsModal() {
  stopBestRunTarot();
  const modal = document.getElementById('achievements-modal');
  if (modal) {
    modal.classList.add('modal-hidden');
    modal.style.setProperty('display', 'none', 'important');
    modal.style.display = 'none';
  }
  openCharacterSelect();
}

// ========================================================
// CÓDICE DO BESTIÁRIO DAS TREVAS (Grimório de Criaturas)
// ========================================================
export let currentBestiaryCategory = 'ALL';
export let selectedCreatureId = 'ZOMBIE';

export function setCurrentBestiaryCategory(cat) {
  currentBestiaryCategory = cat;
}

export function openBestiaryModal() {
  closeCharSelectModal();

  const modal = document.getElementById('bestiary-modal');
  if (!modal) return;

  const isMobile = isMobileScreen();
  modal.classList.toggle('is-mobile-device', isMobile);

  renderBestiaryRoster(currentBestiaryCategory);
  renderBestiaryDossier(selectedCreatureId);

  modal.classList.remove('modal-hidden');
  modal.style.removeProperty('display');
  modal.style.display = 'flex';
  playSfx('level');
}

export function closeBestiaryModal() {
  stopBestiaryPreview();
  const modal = document.getElementById('bestiary-modal');
  if (modal) {
    modal.classList.add('modal-hidden');
    modal.style.setProperty('display', 'none', 'important');
    modal.style.display = 'none';
  }
  openCharacterSelect();
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
    if (cat === 'ALL') btn.innerText = `TODOS (${BESTIARY_ENTRIES.length})`;
    else if (cat === 'HORDE') btn.innerText = `HORDAS (${hordeTotal})`;
    else if (cat === 'MINIBOSS') btn.innerText = `MINI-CHEFES (${miniTotal})`;
    else if (cat === 'BOSS') btn.innerText = `CHEFES SUPREMOS (${bossTotal})`;
  });

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
      <div class="bcard-avatar-wrap" style="border-color: ${isDiscovered ? (c.color + 'aa') : 'rgba(255,255,255,0.1)'};">
        <span class="bcard-avatar-icon">${isDiscovered ? (c.category === 'BOSS' ? renderIcon('boss_crown', { size: 14, color: '#c084fc' }) : (c.category === 'MINIBOSS' ? renderIcon('damage', { size: 14, color: '#f39c12' }) : renderIcon('skull', { size: 14, color: '#2ecc71' }))) : renderIcon('lock', { size: 13, color: '#636e72' })}</span>
      </div>
      <div class="bcard-info">
        <div class="bcard-top-row">
          <span class="bcard-name ${isDiscovered ? '' : 'undiscovered-name'}" style="color: ${isDiscovered ? (c.color || '#fff') : '#888'};">
            ${isDiscovered ? c.name : '???'}
          </span>
          <span class="bcard-cat-pill ${catBadgeClass}">${catLabel}</span>
        </div>
        <div class="bcard-sub-row">
          <span class="bcard-kills">${isDiscovered ? `${kills} abates` : 'Não catalogado'}</span>
          <span class="bcard-threat">${stars}</span>
        </div>
      </div>
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

  dossierPanel.innerHTML = `
    <div class="dossier-card-wrap">
      <!-- 1. Palco da Prévia em Alta Definição -->
      <div class="bestiary-preview-viewport">
        <canvas id="bestiary-preview-canvas" width="220" height="220"></canvas>
        <div class="bestiary-category-pill" style="border-color:${isDiscovered ? c.color : '#ff4757'}; color:${isDiscovered ? c.color : '#ff7675'};">
          ${c.category === 'BOSS' ? `${renderIcon('boss_crown', { size: 12, color: '#c084fc', style: 'vertical-align:middle;margin-right:4px;' })} CHEFE SUPREMO` : (c.category === 'MINIBOSS' ? `${renderIcon('damage', { size: 12, color: '#f39c12', style: 'vertical-align:middle;margin-right:4px;' })} MINI-CHEFE` : `${renderIcon('skull', { size: 12, color: '#2ecc71', style: 'vertical-align:middle;margin-right:4px;' })} HORDA DE ENXAME`)}
        </div>
        <div class="bestiary-kills-pill">
          ${isDiscovered ? `${renderIcon('wave_swords', { size: 12, color: '#00f5d4', style: 'vertical-align:middle;margin-right:4px;' })} ${kills} Abates` : `${renderIcon('lock', { size: 11, color: '#ff7675', style: 'vertical-align:middle;margin-right:4px;' })} Não Catalogado`}
        </div>
      </div>

      <!-- 2. Cabeçalho de Identidade -->
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

      <!-- 3. Parâmetros de Biometria & Combate -->
      <div class="dossier-stats-grid">
        <div class="dossier-stat-box">
          <span class="dossier-stat-label">${renderIcon('heart', { size: 10, color: '#ff4757', style: 'vertical-align:middle;margin-right:3px;' })} VIDA BASE</span>
          <span class="dossier-stat-value">${isDiscovered ? c.hp.toLocaleString('pt-BR') : '???'}</span>
        </div>
        <div class="dossier-stat-box">
          <span class="dossier-stat-label">${renderIcon('sword', { size: 10, color: '#f39c12', style: 'vertical-align:middle;margin-right:3px;' })} DANO CONTATO</span>
          <span class="dossier-stat-value">${isDiscovered ? c.damage : '???'}</span>
        </div>
        <div class="dossier-stat-box">
          <span class="dossier-stat-label">${renderIcon('boot', { size: 10, color: '#00f5d4', style: 'vertical-align:middle;margin-right:3px;' })} VELOCIDADE</span>
          <span class="dossier-stat-value">${isDiscovered ? c.speed : '???'}</span>
        </div>
        <div class="dossier-stat-box">
          <span class="dossier-stat-label">${renderIcon('execute', { size: 10, color: '#a29bfe', style: 'vertical-align:middle;margin-right:3px;' })} FUNÇÃO TÁTICA</span>
          <span class="dossier-stat-value">${isDiscovered ? c.role : '???'}</span>
        </div>
      </div>

      <!-- 4. Crônica de Origem Profana (Micro-Lore) -->
      <div class="dossier-lore-box ${isLore ? '' : 'is-locked'}">
        <div class="dossier-box-header">
          <span class="dossier-box-icon">${renderIcon('scroll', { size: 13, color: '#ffd166', style: 'display:inline-block;vertical-align:middle;' })}</span>
          <span class="dossier-box-title">CRÔNICA DE ORIGEM PROFANA</span>
          <span class="dossier-lock-status">${isLore ? 'DESCRIPTOGRAFADO' : `${renderIcon('lock', { size: 10, color: '#ff7675', style: 'vertical-align:middle;margin-right:2px;' })} Requer ${reqKills} ${reqKills === 1 ? 'abate' : 'abates'}`}</span>
        </div>
        <div class="dossier-box-content">
          ${isLore ? c.microLore : (isDiscovered ? `O véu do mistério ainda oculta a origem desta abominação. Abata mais ${Math.max(1, reqKills - kills)} espécimes para decifrar sua história ancestral.` : 'Criatura desconhecida. Elimine-a na arena para iniciar a extração de dados.')}
        </div>
      </div>

      <!-- 5. Fraquezas Táticas & Diretrizes de Sobrevivência -->
      <div class="dossier-lore-box dossier-tactics-box ${isLore ? '' : 'is-locked'}">
        <div class="dossier-box-header">
          <span class="dossier-box-icon">${renderIcon('sword', { size: 13, color: '#00f5d4', style: 'display:inline-block;vertical-align:middle;' })}</span>
          <span class="dossier-box-title">FRAQUEZA & CONDUTA TÁTICA</span>
          <span class="dossier-lock-status">${isLore ? 'REVELADO' : `${renderIcon('lock', { size: 10, color: '#ff7675', style: 'vertical-align:middle;margin-right:2px;' })} BLOQUEADO`}</span>
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
