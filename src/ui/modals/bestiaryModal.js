/**
 * src/ui/modals/bestiaryModal.js
 * Códice do Bestiário das Trevas e Preview Procedural de Criaturas.
 */
import { closeCharSelectModal, openCharacterSelect, isMobileScreen, updateRelicNotificationPips } from './characterSelectModal.js';
import { 
  BESTIARY_ENTRIES, 
  isCreatureDiscovered, 
  getCreatureKills, 
  isLoreUnlocked 
} from '../../config/bestiary.js';
import { markDiscoveredCreaturesAsSeen } from '../../systems/progression.js';
import { 
  startBestiaryPreview, 
  stopBestiaryPreview 
} from '../../render/bestiaryPreview.js';
import { renderIcon } from '../icons.js';
import { playSfx } from '../../core/audio.js';

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

  document.querySelectorAll('.bestiary-tab-btn').forEach(btn => {
    btn.classList.toggle('active', (btn.getAttribute('data-cat') || 'ALL') === currentBestiaryCategory);
  });

  renderBestiaryRoster(currentBestiaryCategory);
  renderBestiaryDossier(selectedCreatureId);

  markDiscoveredCreaturesAsSeen();
  updateRelicNotificationPips();

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

  if (entries.length > 0 && !entries.some(c => c.id === selectedCreatureId)) {
    selectedCreatureId = entries[0].id;
    renderBestiaryDossier(selectedCreatureId);
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

