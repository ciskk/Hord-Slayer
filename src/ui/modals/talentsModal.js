/**
 * src/ui/modals/talentsModal.js
 * Astrolábio Cósmico e Forja do Destino: Árvore de Meta-Progressão Rúnica, Constelações e Resumo de Bênçãos.
 */
import { closeCharSelectModal, isMobileScreen } from './characterSelectModal.js';
import { 
  META_TALENTS, 
  getMetaUpgradeCost, 
  buyMetaUpgrade, 
  getMetaLevels, 
  getPersistentGold, 
  getMetaBonuses 
} from '../../entities/player.js';
import { renderIcon } from '../icons.js';
import { playSfx, triggerHaptic } from '../../core/audio.js';

// Runas Sagradas do Astrolábio (SVG Matemático Puro em Grade 24x24 para os 14 Talentos)
export const TALENT_RUNES_SVG = {
  // Guerra
  damage: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <polygon points="12,1 15,9 23,12 15,15 12,23 9,15 1,12 9,9"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
    </svg>
  `,
  crit: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <circle cx="12" cy="12" r="8"/>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>
  `,
  cooldown: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <polygon points="6,2 18,2 12,12 18,22 6,22 12,12"/>
      <line x1="6" y1="2" x2="18" y2="2"/>
      <line x1="6" y1="22" x2="18" y2="22"/>
    </svg>
  `,
  execute: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M14 2l4 4-8 8-4-4 8-8z"/>
      <path d="M6 14l-4 4 4 4 4-4-4-4z"/>
      <line x1="18" y1="6" x2="22" y2="2"/>
    </svg>
  `,

  // Égide
  hp: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <polygon points="12,2 20,8 18,17 12,22 6,17 4,8"/>
      <polyline points="12,2 12,22"/>
      <line x1="4" y1="8" x2="20" y2="8"/>
    </svg>
  `,
  armor: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/>
      <polyline points="9,10 12,13 15,10"/>
    </svg>
  `,
  speed: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M4 14l6-6 4 4 6-6"/>
      <path d="M14 6h6v6"/>
      <line x1="2" y1="18" x2="10" y2="18"/>
    </svg>
  `,
  regen: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M12 2v20"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      <circle cx="12" cy="12" r="6" stroke-dasharray="2, 2"/>
    </svg>
  `,
  phoenix: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M12 3c-1.5 2-3 4-3 7 0 2.5 1.5 4 3 6 1.5-2 3-3.5 3-6 0-3-1.5-5-3-7z"/>
      <path d="M5 10c2-1 4-1 6 1-1 3-3 4-6 4 0-2 0-4 0-5z"/>
      <path d="M19 10c-2-1-4-1-6 1 1 3 3 4 6 4 0-2 0-4 0-5z"/>
    </svg>
  `,

  // Destino
  magnet: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M5 3v6c0 3.87 3.13 7 7 7s7-3.13 7-7V3"/>
      <line x1="3" y1="7" x2="7" y2="7"/>
      <line x1="17" y1="7" x2="21" y2="7"/>
    </svg>
  `,
  gold: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <circle cx="12" cy="12" r="9"/>
      <polygon points="12,6 14,10 18,12 14,14 12,18 10,14 6,12 10,10"/>
    </svg>
  `,
  xp: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M2 4v16c4 0 6 2 10 2s6-2 10-2V4c-4 0-6 2-10 2S6 4 2 4z"/>
      <line x1="12" y1="6" x2="12" y2="22"/>
    </svg>
  `,
  reroll: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="3" y="3" width="18" height="18" rx="4"/>
      <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="16" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
      <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
    </svg>
  `,
  transmute: `
    <svg class="node-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M3 8l9-5 9 5v10l-9 5-9-5V8z"/>
      <polygon points="12,3 12,23"/>
      <line x1="3" y1="8" x2="21" y2="8"/>
      <circle cx="12" cy="13" r="3" fill="#f1c40f"/>
    </svg>
  `
};

// Coordenadas das 3 Constelações Estelares (Porcentagens relativas ao Viewport)
export const ASTROLABE_NODE_COORDS = {
  // Guerra (Noroeste & Norte)
  damage:   { x: 38, y: 34, parentId: null },
  crit:     { x: 23, y: 25, parentId: 'damage' },
  cooldown: { x: 44, y: 18, parentId: 'damage' },
  execute:  { x: 14, y: 15, parentId: 'crit' },

  // Égide (Sudoeste & Sul)
  hp:       { x: 35, y: 64, parentId: null },
  armor:    { x: 20, y: 68, parentId: 'hp' },
  speed:    { x: 40, y: 82, parentId: 'hp' },
  regen:    { x: 16, y: 84, parentId: 'armor' },
  phoenix:  { x: 28, y: 93, parentId: 'regen' },

  // Destino (Leste & Nordeste/Sudeste)
  magnet:   { x: 65, y: 50, parentId: null },
  gold:     { x: 77, y: 34, parentId: 'magnet' },
  xp:       { x: 77, y: 66, parentId: 'magnet' },
  reroll:   { x: 89, y: 23, parentId: 'gold' },
  transmute:{ x: 89, y: 77, parentId: 'xp' }
};

// Coordenadas Mobile: Pilares Celestes Verticais Ergonômicos (Toque Amplo & Sem Embolamento)
export const ASTROLABE_MOBILE_COORDS = {
  // Guerra (Pilar de 4 nós)
  damage:   { x: 50, y: 78, parentId: null },
  crit:     { x: 28, y: 48, parentId: 'damage' },
  cooldown: { x: 72, y: 48, parentId: 'damage' },
  execute:  { x: 50, y: 18, parentId: 'crit' },

  // Égide (Pilar de 5 nós)
  hp:       { x: 50, y: 80, parentId: null },
  armor:    { x: 26, y: 52, parentId: 'hp' },
  speed:    { x: 74, y: 52, parentId: 'hp' },
  regen:    { x: 26, y: 22, parentId: 'armor' },
  phoenix:  { x: 74, y: 18, parentId: 'speed' },

  // Destino (Pilar de 5 nós)
  magnet:   { x: 50, y: 80, parentId: null },
  gold:     { x: 26, y: 52, parentId: 'magnet' },
  xp:       { x: 74, y: 52, parentId: 'magnet' },
  reroll:   { x: 26, y: 22, parentId: 'gold' },
  transmute:{ x: 74, y: 18, parentId: 'xp' }
};

export let selectedAstrolabeNodeId = 'damage';
export let activeConstellationFilter = 'all'; // 'all' | 'guerra' | 'egide' | 'destino'
export let activeRenderAstrolabe = null;
export let activePillarMode = 'forge'; // 'forge' | 'blessings'

export let panState = {
  scale: 1.0,
  minScale: 0.5,
  maxScale: 2.8,
  tx: 0,
  ty: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  initialTx: 0,
  initialTy: 0,
  hasDragged: false,
  dragDistance: 0,
  isPinching: false,
  suppressClickUntil: 0
};

export function setActiveRenderAstrolabe(fn) {
  activeRenderAstrolabe = fn;
}

let panRafId = null;
export function applyPanZoomTransform(smooth = false) {
  const surface = document.getElementById('astrolabe-panzoom-surface');
  if (!surface) return;
  if (smooth) {
    surface.classList.add('smooth-transition');
    setTimeout(() => surface.classList.remove('smooth-transition'), 350);
  } else {
    surface.classList.remove('smooth-transition');
  }
  if (panRafId) cancelAnimationFrame(panRafId);
  panRafId = requestAnimationFrame(() => {
    surface.style.transform = `translate(${panState.tx}px, ${panState.ty}px) scale(${panState.scale})`;
  });
}

export function recenterAstrolabe(smooth = true) {
  panState.scale = 1.0;
  panState.tx = 0;
  panState.ty = 0;
  applyPanZoomTransform(smooth);
}

export function zoomAstrolabeBy(factor, smooth = true) {
  const viewport = document.getElementById('astrolabe-viewport');
  if (!viewport) return;
  const rect = viewport.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const newScale = Math.max(panState.minScale, Math.min(panState.maxScale, panState.scale * factor));
  if (Math.abs(newScale - panState.scale) < 0.001) return;

  const actualFactor = newScale / panState.scale;
  panState.tx = centerX - actualFactor * (centerX - panState.tx);
  panState.ty = centerY - actualFactor * (centerY - panState.ty);
  panState.scale = newScale;

  applyPanZoomTransform(smooth);
}

export function focusAstrolabeNode(nodeId, smooth = true) {
  const coords = ASTROLABE_NODE_COORDS[nodeId];
  if (!coords) return;

  const viewport = document.getElementById('astrolabe-viewport');
  if (!viewport) return;
  const rect = viewport.getBoundingClientRect();

  const targetX = (coords.x / 100) * rect.width;
  const targetY = (coords.y / 100) * rect.height;

  panState.scale = Math.max(1.15, panState.scale);
  panState.tx = (rect.width / 2) - (targetX * panState.scale);
  panState.ty = (rect.height / 2) - (targetY * panState.scale);

  applyPanZoomTransform(smooth);
}

export function selectAstrolabeNode(nodeId, shouldFocus = false) {
  selectedAstrolabeNodeId = nodeId;
  switchPillarMode('forge');
  if (shouldFocus) {
    focusAstrolabeNode(nodeId, true);
  }
  const scrollEl = document.getElementById('forge-dossier-scroll');
  if (scrollEl) {
    scrollEl.classList.remove('dossier-slide-enter');
    void scrollEl.offsetWidth;
    scrollEl.classList.add('dossier-slide-enter');
  }
  if (activeRenderAstrolabe) {
    activeRenderAstrolabe();
  }
}

export function switchPillarMode(mode) {
  activePillarMode = mode;
  const forgePanel = document.getElementById('astrolabe-forge-panel');
  const blessingsPanel = document.getElementById('astrolabe-blessings-panel');
  const tabForge = document.getElementById('tab-pillar-forge');
  const tabBlessings = document.getElementById('tab-pillar-blessings');

  if (tabForge) {
    tabForge.classList.toggle('active', mode === 'forge');
    tabForge.setAttribute('aria-selected', mode === 'forge' ? 'true' : 'false');
  }
  if (tabBlessings) {
    tabBlessings.classList.toggle('active', mode === 'blessings');
    tabBlessings.setAttribute('aria-selected', mode === 'blessings' ? 'true' : 'false');
  }

  if (forgePanel && blessingsPanel) {
    if (mode === 'forge') {
      forgePanel.style.display = 'flex';
      blessingsPanel.style.display = 'none';
    } else {
      forgePanel.style.display = 'none';
      blessingsPanel.style.display = 'flex';
      renderDesktopBlessingsCodex();
    }
  }
}

export function setupAstrolabePanZoom() {
  const viewport = document.getElementById('astrolabe-viewport');
  if (!viewport || viewport._panZoomBound) return;
  viewport._panZoomBound = true;

  // 1. Wheel zoom (Ancorado no cursor)
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.14 : (1 / 1.14);
    const newScale = Math.max(panState.minScale, Math.min(panState.maxScale, panState.scale * zoomFactor));
    if (Math.abs(newScale - panState.scale) < 0.001) return;

    const actualFactor = newScale / panState.scale;
    panState.tx = cursorX - actualFactor * (cursorX - panState.tx);
    panState.ty = cursorY - actualFactor * (cursorY - panState.ty);
    panState.scale = newScale;

    applyPanZoomTransform(false);
  }, { passive: false });

  // 2. Mouse / Pointer drag (Tracking direto 1:1)
  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    panState.isDragging = true;
    panState.dragStartX = e.clientX;
    panState.dragStartY = e.clientY;
    panState.initialTx = panState.tx;
    panState.initialTy = panState.ty;
    panState.hasDragged = false;
    panState.dragDistance = 0;
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!panState.isDragging || panState.isPinching) return;
    const dx = e.clientX - panState.dragStartX;
    const dy = e.clientY - panState.dragStartY;
    panState.dragDistance = Math.hypot(dx, dy);

    if (panState.dragDistance > 6) {
      if (!panState.hasDragged) {
        panState.hasDragged = true;
        viewport.classList.add('is-panning');
        try { viewport.setPointerCapture(e.pointerId); } catch(err) {}
      }
      panState.tx = panState.initialTx + dx;
      panState.ty = panState.initialTy + dy;
      applyPanZoomTransform(false);
    }
  });

  const endPointerDrag = (e) => {
    if (panState.isDragging) {
      if (panState.hasDragged) {
        panState.suppressClickUntil = performance.now() + 150;
      }
      panState.isDragging = false;
      viewport.classList.remove('is-panning');
      try { viewport.releasePointerCapture(e.pointerId); } catch(err) {}
    }
  };

  viewport.addEventListener('pointerup', endPointerDrag);
  viewport.addEventListener('pointercancel', endPointerDrag);

  // 3. Touch Pinch-to-zoom (2 dedos no mobile)
  let pinchStartDist = 0;
  let pinchStartMidX = 0;
  let pinchStartMidY = 0;
  let pinchStartScale = 1.0;
  let pinchStartTx = 0;
  let pinchStartTy = 0;

  viewport.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      panState.isPinching = true;
      panState.hasDragged = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const rect = viewport.getBoundingClientRect();
      pinchStartMidX = (t1.clientX + t2.clientX) / 2 - rect.left;
      pinchStartMidY = (t1.clientY + t2.clientY) / 2 - rect.top;
      pinchStartScale = panState.scale;
      pinchStartTx = panState.tx;
      pinchStartTy = panState.ty;
    }
  }, { passive: false });

  viewport.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && panState.isPinching && pinchStartDist > 0) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const curDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const rect = viewport.getBoundingClientRect();
      const curMidX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const curMidY = (t1.clientY + t2.clientY) / 2 - rect.top;

      const factor = curDist / pinchStartDist;
      const newScale = Math.max(panState.minScale, Math.min(panState.maxScale, pinchStartScale * factor));
      const actualFactor = newScale / pinchStartScale;

      panState.tx = curMidX - actualFactor * (pinchStartMidX - pinchStartTx);
      panState.ty = curMidY - actualFactor * (pinchStartMidY - pinchStartTy);
      panState.scale = newScale;

      applyPanZoomTransform(false);
    }
  }, { passive: false });

  viewport.addEventListener('touchend', (e) => {
    if (panState.isPinching && e.touches.length < 2) {
      panState.isPinching = false;
      panState.suppressClickUntil = performance.now() + 150;
    }
  });
}

export function openTalentsModal() {
  const hud = document.getElementById('hud');
  if (hud) {
    hud.classList.add('hud-hidden');
    hud.style.setProperty('display', 'none', 'important');
    hud.style.display = 'none';
  }
  closeCharSelectModal();

  const modal = document.getElementById('talents-modal');
  const nodesContainer = document.getElementById('astrolabe-nodes-container');
  const filamentsSvg = document.getElementById('astrolabe-filaments-svg');
  const goldVal = document.getElementById('talents-gold-val');
  const blessingsDrawer = document.getElementById('blessings-summary-drawer');
  if (blessingsDrawer) blessingsDrawer.style.display = 'none';
  if (!modal || !nodesContainer) return;

  const isMobile = isMobileScreen();
  modal.classList.toggle('is-mobile-device', isMobile);

  // Reset e inicialização de Pan & Zoom
  recenterAstrolabe(false);
  setupAstrolabePanZoom();

  // Escuta delegada de cliques nos nós estelares
  if (!nodesContainer._clickBound) {
    nodesContainer._clickBound = true;
    nodesContainer.addEventListener('click', (e) => {
      if (panState.hasDragged || performance.now() < panState.suppressClickUntil) {
        return;
      }
      const nodeEl = e.target.closest('.astrolabe-node');
      if (!nodeEl) return;
      const talentId = nodeEl.getAttribute('data-talent');
      if (talentId) {
        try { playSfx('card_hover'); } catch(err) {}
        triggerHaptic('light');
        selectAstrolabeNode(talentId);
      }
    });
  }

  // Configuração das Abas de Constelação
  const tabBtns = modal.querySelectorAll('.constellation-tab');
  tabBtns.forEach(btn => {
    const cTarget = btn.getAttribute('data-constellation');
    btn.classList.toggle('active', cTarget === activeConstellationFilter);

    btn.onclick = () => {
      activeConstellationFilter = cTarget;
      try { playSfx('card_hover'); } catch(e) {}
      triggerHaptic('light');

      if (cTarget !== 'all') {
        const firstInConst = META_TALENTS.find(t => t.constellation === cTarget);
        if (firstInConst) {
          selectedAstrolabeNodeId = firstInConst.id;
          focusAstrolabeNode(firstInConst.id, true);
        }
      } else {
        recenterAstrolabe(true);
      }

      tabBtns.forEach(b => b.classList.toggle('active', b === btn));
      renderAstrolabe();
    };
  });

  // Configuração dos Botões de Modo do Pilar 2 (Forja vs Bênçãos)
  const tabForge = document.getElementById('tab-pillar-forge');
  if (tabForge) {
    tabForge.onclick = () => {
      try { playSfx('click'); } catch(err) {}
      switchPillarMode('forge');
    };
  }
  const tabBlessings = document.getElementById('tab-pillar-blessings');
  if (tabBlessings) {
    tabBlessings.onclick = () => {
      try { playSfx('click'); } catch(err) {}
      if (isMobileScreen()) {
        const drawer = document.getElementById('blessings-summary-drawer');
        if (drawer) {
          renderBlessingsSummary();
          drawer.style.display = 'block';
        }
      } else {
        switchPillarMode('blessings');
      }
    };
  }

  const closeBlessingsDrawerBtn = document.getElementById('close-blessings-drawer-btn');
  if (closeBlessingsDrawerBtn) {
    closeBlessingsDrawerBtn.onclick = () => {
      const drawer = document.getElementById('blessings-summary-drawer');
      if (drawer) drawer.style.display = 'none';
    };
  }

  function renderAstrolabe() {
    const currentGold = getPersistentGold();
    if (goldVal) goldVal.innerText = currentGold.toLocaleString('pt-BR');
    const coreGold = document.getElementById('talents-core-gold-val');
    if (coreGold) coreGold.innerText = currentGold.toLocaleString('pt-BR');
    nodesContainer.innerHTML = '';

    const levels = getMetaLevels();
    const isMobileNow = isMobileScreen();
    const coordsMap = ASTROLABE_NODE_COORDS;
    const centerX = 50;
    const centerY = 50;

    // Métricas Agregadas Globais (Chips de Metadados)
    const totalSpent = META_TALENTS.reduce((acc, t) => acc + (levels[t.id] || 0), 0);
    const totalMax = META_TALENTS.reduce((acc, t) => acc + t.maxLvl, 0);
    const totalInvestedEl = document.getElementById('astrolabe-total-invested');
    if (totalInvestedEl) {
      totalInvestedEl.innerText = `${totalSpent} / ${totalMax}`;
    }

    const activeBlessingsCount = META_TALENTS.filter(t => (levels[t.id] || 0) > 0).length;
    const activeBlessingsEl = document.getElementById('astrolabe-active-blessings-count');
    if (activeBlessingsEl) {
      activeBlessingsEl.innerText = `${activeBlessingsCount} / ${META_TALENTS.length}`;
    }
    const pillarBadge = document.getElementById('pillar-blessings-badge');
    if (pillarBadge) {
      pillarBadge.innerText = `${activeBlessingsCount}/${META_TALENTS.length}`;
    }
    if (activePillarMode === 'blessings' && !isMobileNow) {
      renderDesktopBlessingsCodex();
    }

    // Tanto no desktop quanto no mobile, renderizar todas as 14 bênçãos
    const talentsToRender = META_TALENTS;

    // Atualiza badges numéricas das abas com contagem de níveis investidos
    tabBtns.forEach(btn => {
      const c = btn.getAttribute('data-constellation');
      btn.classList.toggle('active', c === activeConstellationFilter);
      if (c && c !== 'all') {
        const cTalents = META_TALENTS.filter(t => t.constellation === c);
        const spent = cTalents.reduce((acc, t) => acc + (levels[t.id] || 0), 0);
        const max = cTalents.reduce((acc, t) => acc + t.maxLvl, 0);
        const countSpan = btn.querySelector('.tab-prog-badge');
        if (countSpan) {
          countSpan.innerText = isMobileNow ? `${spent}/${max}` : `${spent}/${max} Níveis`;
        }
      }
    });

    const stageBadge = document.getElementById('astrolabe-active-const-badge');
    if (stageBadge) {
      const badgeNames = {
        all: 'PLANETÁRIO CELESTE',
        guerra: 'CONSTELAÇÃO DA GUERRA',
        egide: 'CONSTELAÇÃO DA ÉGIDE',
        destino: 'CONSTELAÇÃO DO DESTINO'
      };
      stageBadge.innerText = badgeNames[activeConstellationFilter] || 'PLANETÁRIO CELESTE';
      const badgeColors = {
        all: '#00f5d4',
        guerra: '#e74c3c',
        egide: '#2ecc71',
        destino: '#a855f7'
      };
      const bColor = badgeColors[activeConstellationFilter] || '#00f5d4';
      stageBadge.style.color = bColor;
      stageBadge.style.borderColor = bColor;
      stageBadge.style.boxShadow = `0 0 10px ${bColor}44`;
    }

    // 1. Renderização das linhas de filamento SVG interconectadas
    if (filamentsSvg) {
      filamentsSvg.innerHTML = '';
      talentsToRender.forEach(t => {
        const coords = coordsMap[t.id];
        if (!coords) return;

        let startX = centerX;
        let startY = centerY;

        if (coords.parentId && coordsMap[coords.parentId]) {
          startX = coordsMap[coords.parentId].x;
          startY = coordsMap[coords.parentId].y;
        }

        const targetLvl = levels[t.id] || 0;
        const parentLvl = coords.parentId ? (levels[coords.parentId] || 0) : 1;
        const isDimmed = activeConstellationFilter !== 'all' && t.constellation !== activeConstellationFilter;

        let lineClass = 'filament-line';
        if (targetLvl > 0) lineClass += ' active';
        else if (parentLvl > 0) lineClass += ' available';
        else lineClass += ' locked';

        if (isDimmed) lineClass += ' dimmed';
        lineClass += ` filament-${t.constellation}`;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', `${startX}%`);
        line.setAttribute('y1', `${startY}%`);
        line.setAttribute('x2', `${coords.x}%`);
        line.setAttribute('y2', `${coords.y}%`);
        line.setAttribute('class', lineClass);
        filamentsSvg.appendChild(line);
      });
    }

    // 2. Renderização dos Nós Estelares Interativos
    talentsToRender.forEach(t => {
      const coords = coordsMap[t.id] || { x: 50, y: 50 };
      const curLvl = levels[t.id] || 0;
      const isMax = curLvl >= t.maxLvl;
      const parentLvl = coords.parentId ? (levels[coords.parentId] || 0) : 1;
      const isLocked = parentLvl < 1;
      const isDimmed = activeConstellationFilter !== 'all' && t.constellation !== activeConstellationFilter;
      const runeSvg = TALENT_RUNES_SVG[t.id] || TALENT_RUNES_SVG.damage;

      const node = document.createElement('div');
      let nodeCls = `astrolabe-node node-${t.constellation}`;
      if (t.isKeystone) nodeCls += ' node-keystone';
      if (curLvl > 0) nodeCls += ' invested';
      if (isMax) nodeCls += ' maxed';
      if (isLocked) nodeCls += ' locked';
      if (t.id === selectedAstrolabeNodeId) nodeCls += ' active';
      if (isDimmed) nodeCls += ' dimmed';

      node.className = nodeCls;
      node.style.left = `${coords.x}%`;
      node.style.top = `${coords.y}%`;
      node.setAttribute('data-talent', t.id);

      node.innerHTML = `
        ${runeSvg}
        <div class="node-lvl-pip">${isLocked ? renderIcon('lock', { size: 10, color: '#8c94a8' }) : `${curLvl}/${t.maxLvl}`}</div>
        ${t.isKeystone ? '<div class="keystone-crown-glow"></div>' : ''}
      `;

      node.onclick = (e) => {
        if (panState.hasDragged || performance.now() < panState.suppressClickUntil) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        try { playSfx('card_hover'); } catch(err) {}
        triggerHaptic('light');
        selectAstrolabeNode(t.id);
      };

      nodesContainer.appendChild(node);
    });

    // 3. Atualização da Forja do Destino (Painel de Inspeção do Nó Selecionado)
    const activeTalent = META_TALENTS.find(t => t.id === selectedAstrolabeNodeId) || META_TALENTS[0];
    const curLvl = levels[activeTalent.id] || 0;
    const isMax = curLvl >= activeTalent.maxLvl;
    const parentLvl = activeTalent.parent ? (levels[activeTalent.parent] || 0) : 1;
    const isLocked = parentLvl < 1;
    const cost = getMetaUpgradeCost(activeTalent.id, curLvl);
    const canAfford = getPersistentGold() >= cost && !isMax && !isLocked;

    // Cores dinâmicas da constelação para a identidade visual Void Astral
    const constColors = {
      guerra: '#e74c3c',
      egide: '#2ecc71',
      destino: '#a855f7'
    };
    const activeColor = constColors[activeTalent.constellation] || '#ffd166';
    modal.style.setProperty('--showcase-color', activeColor);
    modal.style.setProperty('--constellation-color', activeColor);

    const runePreview = document.getElementById('forge-rune-preview');
    if (runePreview) {
      runePreview.innerHTML = TALENT_RUNES_SVG[activeTalent.id] || TALENT_RUNES_SVG.damage;
      runePreview.style.borderColor = activeColor;
      runePreview.style.color = activeColor;
      runePreview.style.boxShadow = `0 0 16px ${activeColor}44, inset 0 0 10px rgba(0,0,0,0.8)`;
    }

    const constBadge = document.getElementById('forge-constellation-badge');
    const tierBadge = document.getElementById('forge-tier-badge');
    const nameElem = document.getElementById('forge-node-name');
    const descElem = document.getElementById('forge-node-desc');
    const statBadge = document.getElementById('forge-stat-badge');
    const levelLabel = document.getElementById('forge-node-level-label');
    const loreElem = document.getElementById('forge-node-lore');
    const compCur = document.getElementById('forge-comp-current');
    const compNext = document.getElementById('forge-comp-next');
    const meterElem = document.getElementById('forge-level-meter');
    const buyBtn = document.getElementById('forge-buy-btn');

    if (constBadge) {
      const names = { guerra: 'CONSTELAÇÃO DA GUERRA', egide: 'CONSTELAÇÃO DA ÉGIDE', destino: 'CONSTELAÇÃO DO DESTINO' };
      const iconKey = activeTalent.constellation === 'guerra' ? 'constellation_guerra' : (activeTalent.constellation === 'egide' ? 'constellation_egide' : 'constellation_destino');
      constBadge.innerHTML = `${renderIcon(iconKey, { size: 13, style: 'margin-right:5px;' })} ${names[activeTalent.constellation] || 'CONSTELAÇÃO ASTRAL'}`;
      constBadge.className = `showcase-archetype-pill badge-${activeTalent.constellation}`;
      constBadge.style.color = activeColor;
      constBadge.style.borderColor = activeColor;
    }

    if (tierBadge) {
      tierBadge.innerHTML = activeTalent.isKeystone 
        ? `${renderIcon('keystone', { size: 12, color: '#f1c40f', style: 'margin-right:4px;' })} TALENTO MESTRE` 
        : `TIER ${activeTalent.tier}`;
      tierBadge.style.color = activeTalent.isKeystone ? '#ffd166' : '#00f5d4';
      tierBadge.style.borderColor = activeTalent.isKeystone ? 'rgba(255, 209, 102, 0.5)' : 'rgba(0, 245, 212, 0.4)';
    }

    if (statBadge) {
      statBadge.innerText = activeTalent.statLabel ? activeTalent.statLabel.toUpperCase() : 'BÊNÇÃO';
      statBadge.style.color = activeColor;
      statBadge.style.borderColor = `${activeColor}66`;
    }

    if (levelLabel) {
      levelLabel.innerText = isMax ? 'APOGEU (MÁX)' : `NÍVEL ${curLvl}/${activeTalent.maxLvl}`;
      levelLabel.style.color = isMax ? '#ffd166' : '#00f5d4';
    }

    if (nameElem) nameElem.innerText = activeTalent.name;
    if (descElem) descElem.innerText = activeTalent.desc;
    if (loreElem) loreElem.innerText = activeTalent.lore ? `“${activeTalent.lore}”` : '';
    const loreCard = document.getElementById('forge-node-lore-card');
    if (loreCard) {
      loreCard.style.display = activeTalent.lore ? 'flex' : 'none';
    }

    if (compCur) compCur.innerText = activeTalent.formatVal(curLvl);
    if (compNext) compNext.innerText = isMax ? 'MÁX' : activeTalent.formatVal(curLvl + 1);

    if (meterElem) {
      let meterHtml = '<div class="segmented-meter">';
      for (let i = 1; i <= activeTalent.maxLvl; i++) {
        meterHtml += `<div class="segment-cell ${i <= curLvl ? 'filled' : ''}"></div>`;
      }
      meterHtml += '</div>';
      meterElem.innerHTML = meterHtml;
    }

    if (buyBtn) {
      buyBtn.style.setProperty('--btn-theme-color', activeColor);
      if (isLocked) {
        buyBtn.disabled = true;
        const parentT = META_TALENTS.find(p => p.id === activeTalent.parent);
        buyBtn.innerHTML = `
          <div class="btn-shimmer-sweep"></div>
          <span class="btn-forge-content">
            ${renderIcon('lock', { size: 13, style: 'margin-right:4px;' })} REQUER ${parentT ? parentT.name.toUpperCase() : 'NÓ ANTECESSOR'}
          </span>
        `;
      } else if (isMax) {
        buyBtn.disabled = true;
        buyBtn.innerHTML = `
          <div class="btn-shimmer-sweep"></div>
          <span class="btn-forge-content">
            ${renderIcon('sparkle', { size: 13, style: 'margin-right:4px;' })} APOGEU ESTELAR ALCANÇADO ${renderIcon('sparkle', { size: 13, style: 'margin-left:4px;' })}
          </span>
        `;
      } else {
        buyBtn.disabled = !canAfford;
        buyBtn.innerHTML = canAfford
          ? `
            <div class="btn-shimmer-sweep"></div>
            <span class="btn-forge-content">
              ${renderIcon('damage', { size: 14, style: 'margin-right:5px; vertical-align: middle;' })} FUNDIR ALMAS • ${renderIcon('soul_coin', { size: 13, color: '#3d1e00', style: 'margin-right:2px; vertical-align: middle;' })} ${cost}
            </span>
          `
          : `
            <div class="btn-shimmer-sweep"></div>
            <span class="btn-forge-content">
              ${renderIcon('soul_coin', { size: 12, color: '#ffd166', style: 'margin-right:2px;' })} ${cost} (FALTAM ${cost - getPersistentGold()} ALMAS)
            </span>
          `;
        buyBtn.onclick = () => {
          if (buyMetaUpgrade(activeTalent.id)) {
            try { playSfx('level'); } catch(e) {}
            triggerHaptic('heavy');
            renderAstrolabe();
          }
        };
      }
    }
  }

  activeRenderAstrolabe = renderAstrolabe;
  renderAstrolabe();
  modal.classList.remove('modal-hidden');
  modal.classList.add('active');
  modal.style.removeProperty('display');
  modal.style.display = 'flex';
}

export function renderBlessingsSummary() {
  const grid = document.getElementById('blessings-summary-grid');
  if (!grid) return;
  const levels = getMetaLevels();

  const constInfo = {
    guerra: { name: 'OFENSIVA & GUERRA', color: '#e74c3c' },
    egide: { name: 'DEFESA & ÉGIDE', color: '#2ecc71' },
    destino: { name: 'ALQUIMIA & DESTINO', color: '#a855f7' }
  };

  const iconMap = {
    damage: 'sword',
    crit: 'crit',
    cooldown: 'cooldown',
    execute: 'execute',
    hp: 'heart',
    armor: 'armor',
    speed: 'boot',
    regen: 'regen',
    phoenix: 'phoenix',
    magnet: 'magnet',
    gold: 'soul_coin',
    xp: 'xp_tome',
    reroll: 'dice',
    transmute: 'transmute'
  };

  grid.innerHTML = META_TALENTS.map(t => {
    const lvl = levels[t.id] || 0;
    const isInvested = lvl > 0;
    const cInfo = constInfo[t.constellation] || { color: '#00f5d4' };
    const icon = renderIcon(iconMap[t.id] || 'sparkle', { size: 16, color: isInvested ? cInfo.color : '#64748b' });

    return `
      <div class="blessing-stat-card ${isInvested ? 'invested' : 'uninvested'}" style="border-left-color: ${isInvested ? cInfo.color : '#334155'};">
        <span class="blessing-icon">${icon}</span>
        <div class="blessing-info">
          <div class="blessing-label" title="${t.name}">${t.name}</div>
          <div class="blessing-val" style="color: ${isInvested ? cInfo.color : '#64748b'};">
            ${isInvested ? t.formatVal(lvl) : 'Inativo'}
            <small style="font-size: 8.5px; color: #64748b; margin-left: 4px; font-weight: normal;">(${lvl}/${t.maxLvl})</small>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

export function renderDesktopBlessingsCodex() {
  const summaryStrip = document.getElementById('desktop-blessings-summary-strip');
  const listElem = document.getElementById('desktop-blessings-list');
  if (!listElem) return;

  const levels = getMetaLevels();

  // Atributos Globais Consolidados da Conta
  const dmgLvl = levels['damage'] || 0;
  const critLvl = levels['crit'] || 0;
  const hpLvl = levels['hp'] || 0;
  const armorLvl = levels['armor'] || 0;
  const speedLvl = levels['speed'] || 0;
  const goldLvl = levels['gold'] || 0;

  if (summaryStrip) {
    summaryStrip.innerHTML = `
      <div class="summary-stat-chip stat-dmg" title="Bônus de Dano Global">
        <svg class="game-icon icon-xs" viewBox="0 0 24 24"><polygon points="12,1 15,9 23,12 15,15 12,23 9,15 1,12 9,9" fill="currentColor"/></svg>
        <span>DANO: +${dmgLvl * 5}%</span>
      </div>
      <div class="summary-stat-chip stat-dmg" title="Chance de Acerto Crítico">
        <svg class="game-icon icon-xs" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
        <span>CRÍT: +${critLvl * 2}%</span>
      </div>
      <div class="summary-stat-chip stat-hp" title="Vida Máxima Adicional">
        <svg class="game-icon icon-xs" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        <span>VIDA: +${hpLvl * 10}</span>
      </div>
      <div class="summary-stat-chip stat-hp" title="Redução de Dano">
        <svg class="game-icon icon-xs" viewBox="0 0 24 24"><polygon points="12,2 20,5 20,11 12,21 4,11 4,5" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        <span>ARMADURA: +${armorLvl * 1}</span>
      </div>
      <div class="summary-stat-chip stat-spd" title="Velocidade de Movimento">
        <svg class="game-icon icon-xs" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg>
        <span>VELOCIDADE: +${speedLvl * 3}%</span>
      </div>
      <div class="summary-stat-chip stat-util" title="Multiplicador de Almas">
        <svg class="game-icon icon-xs" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><text x="12" y="16" text-anchor="middle" font-size="11" font-weight="900" fill="currentColor">✦</text></svg>
        <span>ALMAS: +${goldLvl * 5}%</span>
      </div>
    `;
  }

  const constellations = [
    { id: 'guerra', name: 'CONSTELAÇÃO DA GUERRA', color: '#e74c3c' },
    { id: 'egide', name: 'CONSTELAÇÃO DA ÉGIDE', color: '#2ecc71' },
    { id: 'destino', name: 'CONSTELAÇÃO DO DESTINO', color: '#a855f7' }
  ];

  let totalActive = 0;
  let html = '';

  constellations.forEach(c => {
    const cTalents = META_TALENTS.filter(t => t.constellation === c.id);
    const activeTalents = cTalents.filter(t => (levels[t.id] || 0) > 0);
    totalActive += activeTalents.length;

    if (activeTalents.length === 0) return;

    html += `
      <div class="blessings-constellation-group">
        <div class="constellation-group-title" style="color: ${c.color};">
          <span>${c.name}</span>
          <span style="font-size: 8.5px; opacity: 0.8;">(${activeTalents.length}/${cTalents.length})</span>
        </div>
    `;

    activeTalents.forEach(t => {
      const lvl = levels[t.id] || 0;
      const runeSvg = TALENT_RUNES_SVG[t.id] || TALENT_RUNES_SVG.damage;
      html += `
        <div class="blessing-codex-card" data-talent="${t.id}">
          <div class="blessing-card-left">
            <div class="blessing-card-icon-wrap" style="color: ${c.color}; border-color: ${c.color}44;">
              ${runeSvg}
            </div>
            <div class="blessing-card-info">
              <span class="blessing-card-name">${t.name}</span>
              <span class="blessing-card-stat" style="color: ${c.color};">${t.formatVal(lvl)}</span>
            </div>
          </div>
          <div class="blessing-card-right">
            <span class="blessing-level-pill">Nv ${lvl}/${t.maxLvl}</span>
            <button class="btn-locate-node" title="Localizar e Focar no Astrolábio" data-locate="${t.id}" aria-label="Localizar">
              <svg viewBox="0 0 24 24" class="game-icon icon-xs"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
  });

  if (totalActive === 0) {
    html = `
      <div class="blessings-empty-notice">
        <svg class="game-icon icon-lg" viewBox="0 0 24 24"><polygon points="12,2 15,8 21,9 17,14 18,20 12,17 6,20 7,14 3,9 9,8" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
        <div><strong>Nenhuma bênção ativa consagrada ainda.</strong></div>
        <div>Forje runas no Astrolábio para despertar poderes cósmicos permanentes na sua linhagem.</div>
      </div>
    `;
  }

  listElem.innerHTML = html;

  // Vincula botões de localização e foco suave
  listElem.querySelectorAll('.btn-locate-node').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const talentId = btn.getAttribute('data-locate');
      if (talentId) {
        selectedAstrolabeNodeId = talentId;
        focusAstrolabeNode(talentId, true);
        switchPillarMode('forge');
        try { playSfx('card_hover'); } catch(err) {}
        if (activeRenderAstrolabe) activeRenderAstrolabe();
      }
    };
  });
}
