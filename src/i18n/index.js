import ptBR from './locales/pt-BR.js';
import en from './locales/en.js';
import es from './locales/es.js';
import fr from './locales/fr.js';
import { createI18n } from './runtime.js';

export { DEFAULT_LANGUAGE, LANGUAGES, LANGUAGE_STORAGE_KEY, normalizeLanguage } from './languages.js';

const i18n = createI18n({ catalogs: { 'pt-BR': ptBR, en, es, fr } });

// Importing this module does not read storage or change <html lang>.
// main.js calls initI18n() before rendering the translated initial screen.
export const {
  initI18n, setLanguage, getLanguage, getLocale, getLanguageRevision,
  onLanguageChange, t, formatNumber, formatPercent, formatDate
} = i18n;
