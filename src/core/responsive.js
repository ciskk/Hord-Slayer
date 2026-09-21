/**
 * src/core/responsive.js
 * 
 * Gerenciador Universal de Responsividade, Orientação e Dimensões de Viewport.
 * Fornece métricas em tempo real, gerencia safe areas, estabiliza eventos de rotação
 * (anti-jank em iOS Safari / Android) e notifica o Canvas e os subsistemas de UI.
 */

export {
  autoFitElement,
  updateAllAutoFit,
  registerAutoFit,
  unregisterAutoFit,
  initAutoFitSystem
} from './responsiveAutoFit.js';
import { updateAllAutoFit, initAutoFitSystem } from './responsiveAutoFit.js';

export const GRAPHICS_QUALITY = {
  NATIVE: 'native',       // Adaptação 100% à resolução física real (devicePixelRatio nativo da tela)
  HIGH: 'high',           // Alta nitidez equilibrada (limitada a 2.0x para telas 3x/4K)
  PERFORMANCE: 'performance' // Modo econômico / bateria (1.25x)
};

const STORAGE_KEY_GFX = 'hord_graphics_quality';

let currentGraphicsQuality = GRAPHICS_QUALITY.NATIVE;

if (typeof localStorage !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_GFX);
    if (saved && Object.values(GRAPHICS_QUALITY).includes(saved)) {
      currentGraphicsQuality = saved;
    }
  } catch (e) {
    // localStorage indisponível
  }
}

export function getGraphicsQuality() {
  return currentGraphicsQuality;
}

export function resolveTargetDpr(mode = currentGraphicsQuality) {
  const nativeDpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
  switch (mode) {
    case GRAPHICS_QUALITY.NATIVE:
      // Resolução nativa da tela - adaptação direta aos pixels físicos do aparelho
      return Math.max(1, nativeDpr);
    case GRAPHICS_QUALITY.HIGH:
      // Alta qualidade: nítida até 2.0x (excelente para Retina sem carga excessiva de preenchimento)
      return Math.min(Math.max(1, nativeDpr), 2.0);
    case GRAPHICS_QUALITY.PERFORMANCE:
      // Modo econômico: 1.25x
      return Math.min(Math.max(1, nativeDpr), 1.25);
    default:
      return Math.max(1, nativeDpr);
  }
}

export function setGraphicsQuality(mode) {
  if (!Object.values(GRAPHICS_QUALITY).includes(mode)) return;
  currentGraphicsQuality = mode;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_GFX, mode);
    } catch (e) {}
  }
  updateLayoutMetrics();
}

export const layoutMetrics = {
  viewW: typeof window !== 'undefined' ? window.innerWidth : 1280,
  viewH: typeof window !== 'undefined' ? window.innerHeight : 720,
  dpr: 1,
  nativeDpr: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1,
  graphicsQuality: currentGraphicsQuality,
  aspectRatio: 16 / 9,
  isPortrait: false,
  isLandscape: true,
  isCompactHeight: false, // true em celulares no modo paisagem (altura < 520px)
  isCompactWidth: false,  // true em celulares no modo retrato (largura < 600px)
  isUltraTall: false,     // true em proporções 19.5:9, 20:9 verticais (aspectRatio < 0.53)
  hudBottom: 110,         // Limite inferior medido do HUD (em pixels de tela)
  safeAreaTop: 0,
  safeAreaBottom: 0,
  safeAreaLeft: 0,
  safeAreaRight: 0
};

const layoutListeners = new Set();
let resizeTimeoutIds = [];

/**
 * Inscreve um ouvinte para mudanças de layout e orientação.
 * @param {Function} callback Recebe as layoutMetrics atualizadas.
 * @returns {Function} Função para desinscrever.
 */
export function onLayoutChange(callback) {
  layoutListeners.add(callback);
  return () => layoutListeners.delete(callback);
}

/**
 * Mede com precisão a posição inferior real do HUD DOM na tela.
 * Garante que banners no Canvas nunca sobreponham elementos do HUD.
 */
export function updateHudBottomMetric() {
  if (typeof document === 'undefined') return 110;

  const hudElem = document.getElementById('hud');
  let maxBottom = 0;

  if (hudElem) {
    const rect = hudElem.getBoundingClientRect();
    if (rect && rect.bottom > 0) {
      maxBottom = Math.max(maxBottom, rect.bottom);
    }
  }

  // Verifica se o HUD de chefe está ativo e expandindo a altura
  const bossHud = document.getElementById('boss-hud');
  if (bossHud && window.getComputedStyle(bossHud).display !== 'none') {
    const bRect = bossHud.getBoundingClientRect();
    if (bRect && bRect.bottom > 0) {
      maxBottom = Math.max(maxBottom, bRect.bottom);
    }
  }

  // Fallback seguro caso o HUD ainda não tenha sido renderizado no DOM
  if (maxBottom <= 0) {
    maxBottom = layoutMetrics.isPortrait ? 130 : 65;
  }

  layoutMetrics.hudBottom = Math.round(maxBottom);
  return layoutMetrics.hudBottom;
}

/**
 * Retorna o limite inferior do HUD para ancoragem de elementos gráficos.
 */
export function getHudBottom() {
  return layoutMetrics.hudBottom || updateHudBottomMetric();
}

/**
 * Recalcula todas as métricas de tela e aplica classes de estado no DOM.
 */
export function updateLayoutMetrics() {
  if (typeof window === 'undefined') return layoutMetrics;

  const docEl = typeof document !== 'undefined' ? document.documentElement : null;
  const w = Math.max(window.innerWidth || 0, window.visualViewport ? Math.round(window.visualViewport.width) : 0, docEl ? docEl.clientWidth : 0);
  const h = Math.max(window.innerHeight || 0, window.visualViewport ? Math.round(window.visualViewport.height) : 0, docEl ? docEl.clientHeight : 0);

  layoutMetrics.viewW = Math.max(280, w);
  layoutMetrics.viewH = Math.max(280, h);
  const nativeDpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
  layoutMetrics.nativeDpr = nativeDpr;
  layoutMetrics.graphicsQuality = currentGraphicsQuality;
  layoutMetrics.dpr = resolveTargetDpr(currentGraphicsQuality);
  layoutMetrics.aspectRatio = layoutMetrics.viewW / layoutMetrics.viewH;

  layoutMetrics.isPortrait = layoutMetrics.viewH > layoutMetrics.viewW;
  layoutMetrics.isLandscape = !layoutMetrics.isPortrait;
  layoutMetrics.isCompactHeight = layoutMetrics.viewH < 520;
  layoutMetrics.isCompactWidth = layoutMetrics.viewW < 600;
  layoutMetrics.isUltraTall = layoutMetrics.isPortrait && (layoutMetrics.aspectRatio <= 0.54);

  // Atualiza classes semânticas no elemento raiz do documento
  if (typeof document !== 'undefined' && document.documentElement) {
    const root = document.documentElement;
    root.classList.toggle('layout-portrait', layoutMetrics.isPortrait);
    root.classList.toggle('layout-landscape', layoutMetrics.isLandscape);
    root.classList.toggle('compact-height', layoutMetrics.isCompactHeight);
    root.classList.toggle('compact-width', layoutMetrics.isCompactWidth);
    root.classList.toggle('screen-ultratall', layoutMetrics.isUltraTall);
  }

  updateHudBottomMetric();

  // Notifica todos os ouvintes inscritos
  layoutListeners.forEach(fn => {
    try {
      fn(layoutMetrics);
    } catch (e) {
      console.warn('Erro ao executar ouvinte de layout:', e);
    }
  });

  // Atualiza auto-fit adaptativo para interfaces e listas ativas
  updateAllAutoFit();

  return layoutMetrics;
}

/**
 * Tratamento robusto para eventos de orientação (iOS Safari / Android WebKit).
 * Dispara verificações em cascata para cobrir a animação do sistema operacional.
 */
function handleOrientationChange() {
  // Cancela temporizadores pendentes
  resizeTimeoutIds.forEach(id => clearTimeout(id));
  resizeTimeoutIds = [];

  // 1. Atualização imediata
  updateLayoutMetrics();

  // 2. Cascata com intervalos estratégicos
  const delays = [50, 150, 300, 500];
  delays.forEach(ms => {
    const id = setTimeout(() => {
      updateLayoutMetrics();
    }, ms);
    resizeTimeoutIds.push(id);
  });
}

/**
 * Inicializador do sistema de responsividade.
 */
export function initResponsive(onResizeCallback) {
  if (typeof window === 'undefined') return;

  if (onResizeCallback) {
    onLayoutChange(onResizeCallback);
  }

  // Executa medição inicial
  updateLayoutMetrics();

  window.addEventListener('resize', () => {
    updateLayoutMetrics();
  }, { passive: true });

  window.addEventListener('orientationchange', handleOrientationChange, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      updateLayoutMetrics();
    }, { passive: true });
  }

  initAutoFitSystem();

  // Medição tardia para garantir pós-carregamento do DOM
  setTimeout(updateLayoutMetrics, 100);
}
