const KEYS = Object.freeze([
  'hord_persistent_gold_v1', 'hord_meta_tree_v1', 'hord_achievements_v2', 'hord_stats_v2',
  'hord_best_run_v1', 'hord_hero_records_v1', 'hord_hero_records_v2', 'hord_bestiary_v1',
  'hord_bestiary_seen_v1', 'hord_achievements_seen_v1', 'hord_graphics_quality',
  'hordio_joystick_mode', 'hord_language_v1'
]);
const MAX_BYTES = 2 * 1024 * 1024;
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function safeTree(value, depth = 0) {
  if (depth > 12) throw new Error('Save muito complexo');
  if (typeof value === 'number' && (!Number.isFinite(value) || value < 0)) throw new Error('Número inválido no save');
  if (typeof value === 'string' && value.length > 4096) throw new Error('Texto muito longo no save');
  if (typeof value === 'string' && /[<>]/.test(value)) throw new Error('Marcação inválida no save');
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Campo inválido no save');
      safeTree(child, depth + 1);
    }
  }
}

function validateSave(save) {
  if (!isRecord(save) || save.game !== 'hord-slayer' || save.schemaVersion !== 1 || !isRecord(save.entries)) throw new Error('Formato de save incompatível');
  if (Buffer.byteLength(JSON.stringify(save), 'utf8') > MAX_BYTES) throw new Error('Save excede 2 MB');
  const entries = {};
  for (const [key, raw] of Object.entries(save.entries)) {
    if (!KEYS.includes(key) || typeof raw !== 'string') throw new Error('Chave de save inválida: ' + key);
    if (key === 'hord_persistent_gold_v1') {
      if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) throw new Error('Saldo inválido');
    } else if (key === 'hord_graphics_quality') {
      if (!['native', 'high', 'performance'].includes(raw)) throw new Error('Qualidade inválida');
    } else if (key === 'hordio_joystick_mode') {
      if (!['floating', 'dynamic'].includes(raw)) throw new Error('Joystick inválido');
    } else if (key === 'hord_language_v1') {
      if (!['pt-BR', 'en', 'es', 'fr'].includes(raw)) throw new Error('Idioma inválido');
    } else {
      const value = JSON.parse(raw);
      const arrayKey = ['hord_achievements_v2', 'hord_bestiary_seen_v1', 'hord_achievements_seen_v1'].includes(key);
      if (arrayKey ? !Array.isArray(value) || value.some(v => typeof v !== 'string') : !isRecord(value)) throw new Error('Estrutura inválida: ' + key);
      safeTree(value);
    }
    entries[key] = raw;
  }
  return { game: 'hord-slayer', schemaVersion: 1, exportedAt: new Date().toISOString(), entries };
}
module.exports = { KEYS, MAX_BYTES, validateSave };
