export const DEFAULT_LANGUAGE = 'pt-BR';
export const LANGUAGE_STORAGE_KEY = 'hord_language_v1';

// Text catalogs are language-wide; number/date conventions use explicit regions.
export const LANGUAGES = Object.freeze([
  Object.freeze({ id: 'pt-BR', label: 'Português', locale: 'pt-BR' }),
  Object.freeze({ id: 'en', label: 'English', locale: 'en-US' }),
  Object.freeze({ id: 'es', label: 'Español', locale: 'es-ES' }),
  Object.freeze({ id: 'fr', label: 'Français', locale: 'fr-FR' })
]);

/** Map supported browser variants (e.g. fr-CA, pt-PT) to a catalog ID. */
export function normalizeLanguage(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const [tag] = Intl.getCanonicalLocales(value.trim().replaceAll('_', '-'));
    const base = tag.split('-')[0];
    return LANGUAGES.find(language => language.id.split('-')[0] === base)?.id ?? null;
  } catch {
    return null;
  }
}
