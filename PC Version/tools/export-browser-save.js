// Run in the browser console while the original Hord Slayer game is open.
// Only this game's progress/preferences are included. No cookies or other data.
(async () => {
  const keys = [
    'hord_persistent_gold_v1', 'hord_meta_tree_v1', 'hord_achievements_v2', 'hord_stats_v2',
    'hord_best_run_v1', 'hord_hero_records_v1', 'hord_hero_records_v2', 'hord_bestiary_v1',
    'hord_bestiary_seen_v1', 'hord_achievements_seen_v1', 'hord_graphics_quality',
    'hordio_joystick_mode', 'hord_language_v1'
  ];
  const progression = await import(new URL('./src/systems/progression.js', location.href).href);
  progression.flushProgression();
  const entries = {};
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value !== null) entries[key] = value;
  }
  const save = { game: 'hord-slayer', schemaVersion: 1, exportedAt: new Date().toISOString(), entries };
  const url = URL.createObjectURL(new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = 'HordSlayer-browser-save.json';
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
})();
