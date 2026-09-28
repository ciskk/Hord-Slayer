import { t } from './index.js';

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export const htmlT = (key, params) => escapeHtml(t(key, params));

/** Translate marked leaf nodes and attributes without replacing buttons or icons. */
export function translateDOM(root) {
  if (!root) return;
  const bindings = [
    ['data-i18n', null],
    ['data-i18n-html', 'html'],
    ['data-i18n-title', 'title'],
    ['data-i18n-aria-label', 'aria-label']
  ];
  for (const [binding, attribute] of bindings) {
    const nodes = [...(root.matches?.(`[${binding}]`) ? [root] : []), ...root.querySelectorAll(`[${binding}]`)];
    for (const node of nodes) {
      const key = node.getAttribute(binding);
      if (!key) continue;
      const params = node.hasAttribute('data-i18n-params') ? JSON.parse(node.getAttribute('data-i18n-params')) : undefined;
      const text = t(key, params);
      if (attribute === 'html') node.innerHTML = text;
      else if (attribute) node.setAttribute(attribute, text);
      else node.textContent = text;
    }
  }
}
