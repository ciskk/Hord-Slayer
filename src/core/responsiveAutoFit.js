/**
 * src/core/responsiveAutoFit.js
 * 
 * Motor Responsivo Adaptativo Smart Auto-Fit para a UI do Hord.io.
 * 
 * Detecta quando listas e componentes ultrapassam o espaço vertical disponível,
 * tanto em telas mobile (smartphones) quanto em telas horizontais/desktop (PC).
 * Se o excesso for moderado (escala até ~0.65), reduz proporcionalmente a escala
 * dos elementos usando CSS transform: scale() com compensação de geometria,
 * garantindo compatibilidade universal sem gerar barras de rolagem indesejadas
 * horizontais ou verticais.
 * Se o excesso for significativo, preserva a rolagem nativa para manter a legibilidade.
 */

export const AUTO_FIT_DEFAULTS = {
  minScale: 0.65,       // Escala mínima padrão (acomoda até ~35% de overflow em telas compactas)
  maxScale: 1.0,        // Escala máxima (1.0 = tamanho natural original)
  bufferPx: 2,          // Margem de segurança contra arredondamento sub-pixel
  direction: 'height'   // 'height' (padrão vertical), 'width' ou 'both'
};

const observedContainers = new Set();
let resizeObserver = null;
let rafPending = false;
const registeredEntries = new Map(); // container -> options

/**
 * Detecta suporte nativo à propriedade CSS `zoom` (mantido para retrocompatibilidade)
 */
export function isZoomSupported() {
  if (typeof document === 'undefined') return false;
  if (typeof CSS !== 'undefined' && CSS.supports) {
    if (CSS.supports('zoom', '1') || CSS.supports('zoom', '100%')) return true;
  }
  return 'zoom' in document.documentElement.style;
}

/**
 * Mede com precisão a altura natural do conteúdo de um elemento em qualquer navegador,
 * contornando o comportamento específico do WebKit/Safari onde scrollHeight em elementos
 * com overflow: visible não computa os limites dos nós filhos que extravasam.
 * @param {HTMLElement} target Elemento de conteúdo
 * @param {number} mTop Margem superior calculada
 * @param {number} mBottom Margem inferior calculada
 * @returns {number} Altura total em pixels do conteúdo
 */
function getNaturalContentHeight(target, mTop, mBottom) {
  let maxChildBottom = 0;
  const children = target.children;

  if (children && children.length > 0) {
    const targetRect = target.getBoundingClientRect();
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!(child instanceof HTMLElement)) continue;
      const cStyle = window.getComputedStyle(child);
      if (cStyle.display === 'none' || cStyle.position === 'absolute' || cStyle.position === 'fixed') continue;

      const rect = child.getBoundingClientRect();
      const bottomRect = (rect.bottom - targetRect.top) + (parseFloat(cStyle.marginBottom) || 0);
      let bottomOffset = 0;
      if (child.offsetParent === target) {
        bottomOffset = child.offsetTop + child.offsetHeight + (parseFloat(cStyle.marginBottom) || 0);
      }
      const effectiveBottom = Math.max(bottomRect, bottomOffset);

      if (effectiveBottom > maxChildBottom) {
        maxChildBottom = effectiveBottom;
      }
    }
  }

  return Math.max(target.scrollHeight || 0, target.offsetHeight || 0, Math.ceil(maxChildBottom)) + mTop + mBottom;
}

/**
 * Aplica o cálculo de Smart Auto-Fit em um único container.
 * @param {HTMLElement} container Elemento que atua como viewport/limite da lista.
 * @param {Object} [customOptions] Sobrescreve opções padrão.
 * @returns {number} A escala final aplicada (entre minScale e 1.0).
 */
export function autoFitElement(container, customOptions = {}) {
  if (!container || !(container instanceof HTMLElement)) return 1.0;
  
  // Elementos ocultos (display: none ou sem dimensões) não devem ser processados agora
  if (container.offsetWidth === 0 && container.offsetHeight === 0 && container.clientHeight === 0) {
    return 1.0;
  }

  const minScale = parseFloat(container.dataset.autofitMinScale) || customOptions.minScale || AUTO_FIT_DEFAULTS.minScale;
  const maxScale = parseFloat(container.dataset.autofitMaxScale) || customOptions.maxScale || AUTO_FIT_DEFAULTS.maxScale;
  const bufferPx = customOptions.bufferPx !== undefined ? customOptions.bufferPx : AUTO_FIT_DEFAULTS.bufferPx;

  // Localiza o alvo interno que deve ser escalado
  let target = null;
  const targetSelector = container.dataset.autofitTarget || customOptions.targetSelector;
  if (targetSelector) {
    target = container.querySelector(targetSelector);
  }
  if (!target) {
    target = container.firstElementChild;
  }
  if (!target || !(target instanceof HTMLElement)) {
    return 1.0;
  }

  // 1. Limpa temporariamente classes ativas e transformações para medir dimensões naturais puras
  container.classList.remove('autofit-active');
  target.classList.remove('autofit-scaled');
  target.style.zoom = '';
  target.style.transform = '';
  target.style.marginBottom = '';
  target.style.width = '';
  target.style.maxWidth = '';
  target.style.boxSizing = '';
  target.style.removeProperty('--autofit-scale');

  // Libera temporariamente eventuais travas de max-height que poderiam mascarar a altura real
  const originalMaxHeight = target.style.maxHeight;
  target.style.setProperty('max-height', 'none', 'important');

  // 2. Medição precisa do espaço interno disponível no container
  const cStyle = window.getComputedStyle(container);
  const padTop = parseFloat(cStyle.paddingTop) || 0;
  const padBottom = parseFloat(cStyle.paddingBottom) || 0;
  const availH = container.clientHeight - padTop - padBottom;

  // 3. Medição robusta cross-browser do tamanho real natural do conteúdo
  const tStyle = window.getComputedStyle(target);
  const mTop = parseFloat(tStyle.marginTop) || 0;
  const mBottom = parseFloat(tStyle.marginBottom) || 0;
  const naturalH = getNaturalContentHeight(target, mTop, mBottom);

  // Restaura estilo de max-height original
  if (originalMaxHeight) {
    target.style.maxHeight = originalMaxHeight;
  } else {
    target.style.removeProperty('max-height');
  }

  // Se não há altura disponível válida ou conteúdo mensurável, sai sem alterar
  if (availH <= 0 || naturalH <= 0) {
    resetAutoFit(container, target);
    return 1.0;
  }

  // 4. Verificação de necessidade de escala
  if (naturalH <= availH) {
    // Cabe naturalmente: Preserva escala 1.0 e comportamento padrão
    resetAutoFit(container, target);
    return 1.0;
  }

  // 5. O conteúdo ultrapassa o espaço disponível: calcula a escala necessária
  const requiredScale = Math.min(maxScale, (availH - bufferPx) / naturalH);

  if (requiredScale >= minScale) {
    // Excesso moderado: Reduz proporcionalmente e uniformemente até caber perfeitamente
    const scale = Math.floor(requiredScale * 1000) / 1000;
    applyAutoFitScale(container, target, scale, naturalH);
    return scale;
  } else {
    // Excesso significativo: Preserva legibilidade com rolagem nativa intacta
    resetAutoFit(container, target);
    return 1.0;
  }
}

/**
 * Aplica a escala proporcional uniforme ao elemento alvo usando transform: scale().
 * Mantém a largura dentro de 100% com box-sizing para eliminar qualquer scrollbar horizontal no PC e mobile.
 */
function applyAutoFitScale(container, target, scale, naturalH) {
  target.style.zoom = '';
  target.style.transformOrigin = 'top center';
  target.style.transform = `scale(${scale})`;
  target.style.setProperty('--autofit-scale', String(scale));

  // Mantém estritamente contido na largura do pai (Zero scrollbars horizontais no PC e mobile)
  target.style.width = '100%';
  target.style.maxWidth = '100%';
  target.style.boxSizing = 'border-box';

  // Compensa a altura visual excedente recolhendo o espaço inferior no container
  const heightDiff = (scale - 1) * naturalH;
  target.style.marginBottom = `${heightDiff.toFixed(1)}px`;

  target.classList.add('autofit-scaled');
  container.classList.add('autofit-active');
}

/**
 * Remove qualquer escala e restaura o comportamento padrão do elemento.
 */
function resetAutoFit(container, target) {
  target.style.zoom = '';
  target.style.transform = '';
  target.style.marginBottom = '';
  target.style.width = '';
  target.style.maxWidth = '';
  target.style.boxSizing = '';
  target.style.removeProperty('--autofit-scale');
  target.classList.remove('autofit-scaled');
  container.classList.remove('autofit-active');
}

/**
 * Executa o recálculo de auto-fit em todos os containers registrados ou marcados.
 * Agrupado em requestAnimationFrame para evitar layout thrashing.
 * @param {HTMLElement|Document} [scope=document] Escopo opcional para busca.
 */
export function updateAllAutoFit(scope = (typeof document !== 'undefined' ? document : null)) {
  if (typeof window === 'undefined' || !scope) return;

  if (rafPending) return;
  rafPending = true;

  window.requestAnimationFrame(() => {
    rafPending = false;
    
    // 1. Processa containers registrados explicitamente
    registeredEntries.forEach((opts, elem) => {
      if (document.contains(elem)) {
        autoFitElement(elem, opts);
      }
    });

    // 2. Processa elementos declarativos marcados no DOM
    if (scope.matches && scope.matches('[data-autofit="true"], .autofit-container, .js-autofit')) {
      autoFitElement(scope);
    }
    const declaredElems = scope.querySelectorAll ? scope.querySelectorAll('[data-autofit="true"], .autofit-container, .js-autofit') : [];
    declaredElems.forEach(elem => {
      autoFitElement(elem);
    });
  });
}

/**
 * Registra um container para observação automática de redimensionamento e mutação.
 * @param {HTMLElement} container
 * @param {Object} [options]
 */
export function registerAutoFit(container, options = {}) {
  if (!container || !(container instanceof HTMLElement)) return;
  
  registeredEntries.set(container, options);
  container.setAttribute('data-autofit', 'true');
  if (options.targetSelector) {
    container.setAttribute('data-autofit-target', options.targetSelector);
  }
  if (options.minScale) {
    container.setAttribute('data-autofit-min-scale', String(options.minScale));
  }

  if (!resizeObserver && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target instanceof HTMLElement) {
          autoFitElement(entry.target, registeredEntries.get(entry.target) || {});
        }
      }
    });
  }

  if (resizeObserver && !observedContainers.has(container)) {
    resizeObserver.observe(container);
    observedContainers.add(container);
  }

  autoFitElement(container, options);
}

/**
 * Remove a observação e restaura os estilos originais do container.
 * @param {HTMLElement} container
 */
export function unregisterAutoFit(container) {
  if (!container) return;
  registeredEntries.delete(container);
  if (resizeObserver && observedContainers.has(container)) {
    resizeObserver.unobserve(container);
    observedContainers.delete(container);
  }
  let target = container.querySelector(container.dataset.autofitTarget || '');
  if (!target) target = container.firstElementChild;
  if (target) resetAutoFit(container, target);
}

/**
 * Inicializador global do subsistema Auto-Fit.
 */
export function initAutoFitSystem() {
  if (typeof window === 'undefined') return;

  // Medição inicial após pintura do DOM
  setTimeout(() => updateAllAutoFit(), 50);
}
