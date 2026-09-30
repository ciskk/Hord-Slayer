const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { resolveContent } = require('../desktop/local-content.cjs');
const { validateSave } = require('../desktop/save-format.cjs');
const save = entries => ({ game: 'hord-slayer', schemaVersion: 1, entries });
test('local protocol resolves modules and rejects other origins and traversal', () => {
  const root = path.resolve(__dirname, '../app');
  assert.equal(resolveContent(root, 'app://game/src/main.js').type, 'text/javascript; charset=utf-8');
  assert.equal(resolveContent(root, 'app://game/').target, path.join(root, 'index.html'));
  for (const url of ['https://game/index.html', 'app://other/index.html', 'app://game/%2e%2e%2fsecret', 'app://game/%2e%2e%5csecret', 'app://game/%00']) assert.throws(() => resolveContent(root, url));
});
test('save retains storage values and rejects wrong game/schema/keys/shape', () => {
  const entries = { hord_persistent_gold_v1: '150', hord_achievements_v2: '["first_kill"]', hord_graphics_quality: 'performance', hord_language_v1: 'pt-BR' };
  assert.deepEqual(validateSave(save(entries)).entries, entries);
  for (const input of [null, { ...save({}), game: 'other' }, { ...save({}), schemaVersion: 2 }, save({ unrelated: 'x' }), save({ hord_persistent_gold_v1: '-5' }), save({ hord_achievements_v2: '{}' }), save({ hord_meta_tree_v1: '[]' }), save({ hord_stats_v2: '{"__proto__":{"x":1}}' }), save({ hord_graphics_quality: 'unknown' })]) assert.throws(() => validateSave(input));
});
test('save refuses oversized payloads and deeply nested values', () => {
  assert.throws(() => validateSave(save({ hord_best_run_v1: '{"heroName":"<img onerror=alert(1)>"}' })));
  assert.throws(() => validateSave(save({ hord_stats_v2: JSON.stringify({ x: 'a'.repeat(2 * 1024 * 1024) }) })));
  let object = {};
  for (let i = 0; i < 15; i++) object = { nested: object };
  assert.throws(() => validateSave(save({ hord_stats_v2: JSON.stringify(object) })));
});
