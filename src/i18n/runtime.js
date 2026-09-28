import { DEFAULT_LANGUAGE, LANGUAGES, LANGUAGE_STORAGE_KEY, normalizeLanguage } from './languages.js';

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

/**
 * Independent runtime. Browser access is lazy and injectable for tests.
 * No game state, DOM traversal or save migration belongs here.
 */
export function createI18n({
  catalogs,
  getStorage = () => globalThis.localStorage,
  getBrowserLanguages = () => {
    const browser = globalThis.navigator;
    return browser?.languages?.length ? browser.languages : [browser?.language];
  },
  getDocument = () => globalThis.document,
  onDiagnostic = diagnostic => console.warn('[i18n]', diagnostic)
} = {}) {
  if (!catalogs || !catalogs[DEFAULT_LANGUAGE]) {
    throw new TypeError('The pt-BR translation catalog is required.');
  }

  let language = DEFAULT_LANGUAGE;
  let revision = 0;
  let initialized = false;
  let debug = false;
  const listeners = new Set();
  const reported = new Set();
  const numberFormats = new Map();
  const dateFormats = new Map();
  const pluralRules = new Map();

  const getLanguage = () => language;
  const getLocale = () => LANGUAGES.find(entry => entry.id === language).locale;
  const getLanguageRevision = () => revision;

  function report(code, key, extra = '') {
    if (!debug) return;
    const id = `${language}:${code}:${key}:${extra}`;
    if (reported.has(id)) return;
    reported.add(id);
    // Diagnostics and subscribers must not prevent the preference from changing.
    try { onDiagnostic({ code, language, key, detail: extra }); } catch { /* optional logger */ }
  }

  function syncDocumentLanguage() {
    const root = getDocument()?.documentElement;
    if (root) root.lang = language;
  }

  function applyLanguage(next) {
    const previousLanguage = language;
    language = next;
    syncDocumentLanguage();
    if (next === previousLanguage) return;
    revision += 1;
    const event = Object.freeze({ language, previousLanguage, locale: getLocale(), revision });
    for (const listener of [...listeners]) {
      try { listener(event); } catch (error) { report('listener-error', '', String(error)); }
    }
  }

  /** Select saved preference, first supported browser language, then pt-BR. */
  function initI18n(options = {}) {
    if (hasOwn(options, 'debug')) debug = Boolean(options.debug);
    if (initialized) return language;

    let selected = null;
    try { selected = normalizeLanguage(getStorage()?.getItem(LANGUAGE_STORAGE_KEY)); } catch { /* blocked storage */ }
    if (!selected) {
      try {
        const preferred = getBrowserLanguages();
        const candidates = typeof preferred === 'string' ? [preferred] : (preferred ?? []);
        for (const candidate of candidates) {
          selected = normalizeLanguage(candidate);
          if (selected) break;
        }
      } catch { /* unavailable browser preferences */ }
    }
    initialized = true;
    applyLanguage(selected || DEFAULT_LANGUAGE);
    // Automatic detection is not an explicit saved preference.
    return language;
  }

  /** Explicit selection is saved even if it matches the detected language. */
  function setLanguage(value) {
    const next = normalizeLanguage(value);
    if (!next) throw new RangeError(`Unsupported language: ${String(value)}`);
    initialized = true;
    try { getStorage()?.setItem(LANGUAGE_STORAGE_KEY, next); } catch { /* session still works */ }
    applyLanguage(next);
    return language;
  }

  /** Subscribe to changes; returns an unsubscribe function for screen cleanup. */
  function onLanguageChange(listener) {
    if (typeof listener !== 'function') throw new TypeError('A language listener must be a function.');
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function formatter(cache, Constructor, options) {
    const key = JSON.stringify([getLocale(), options]);
    if (!cache.has(key)) {
      // Bound caches even if callers use many different formatting options.
      if (cache.size >= 32) cache.delete(cache.keys().next().value);
      cache.set(key, new Constructor(getLocale(), options));
    }
    return cache.get(key);
  }

  function formatNumber(value, options = {}) {
    return formatter(numberFormats, Intl.NumberFormat, options).format(value);
  }

  /** Percent values are ratios: 0.25 is 25%. */
  function formatPercent(value, options = {}) {
    return formatNumber(value, { ...options, style: 'percent' });
  }

  /** Accepts a Date or timestamp; timezone is local unless supplied in options. */
  function formatDate(value, options = {}) {
    return formatter(dateFormats, Intl.DateTimeFormat, options).format(value);
  }

  function messageFor(catalogLanguage, key, count) {
    const catalog = catalogs[catalogLanguage];
    if (!catalog) return undefined;
    const keys = [];
    if (typeof count === 'number' && Number.isFinite(count)) {
      const locale = LANGUAGES.find(entry => entry.id === catalogLanguage).locale;
      if (!pluralRules.has(locale)) pluralRules.set(locale, new Intl.PluralRules(locale));
      // Optional explicit zero message, then the language's grammatical category.
      if (count === 0) keys.push(`${key}.zero`);
      keys.push(`${key}.${pluralRules.get(locale).select(count)}`, `${key}.other`);
    }
    keys.push(key);
    for (const candidate of keys) {
      if (hasOwn(catalog, candidate) && typeof catalog[candidate] === 'string') return catalog[candidate];
    }
    return undefined;
  }

  /**
   * Returns plain text. Assign to textContent or Canvas; escape before innerHTML.
   * Missing parameters remain visible as {parameter} for development diagnosis.
   */
  function t(key, params = {}) {
    if (typeof key !== 'string' || !key) throw new TypeError('A translation key must be a nonempty string.');
    const values = params ?? {};
    let template = messageFor(language, key, values.count);
    if (template === undefined && language !== DEFAULT_LANGUAGE) {
      report('missing-translation', key);
      // Fallback uses Portuguese plural rules, not the active language's rules.
      template = messageFor(DEFAULT_LANGUAGE, key, values.count);
    }
    if (template === undefined) {
      report('missing-key', key);
      return key;
    }
    return template.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (token, name) => {
      if (!hasOwn(values, name) || values[name] === null || values[name] === undefined) {
        report('missing-parameter', key, name);
        return token;
      }
      const value = values[name];
      return typeof value === 'number' ? formatNumber(value) : String(value);
    });
  }

  return Object.freeze({
    initI18n, setLanguage, getLanguage, getLocale, getLanguageRevision,
    onLanguageChange, t, formatNumber, formatPercent, formatDate
  });
}
