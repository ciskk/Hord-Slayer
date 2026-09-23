/** Duração em frames de simulação (60/s), materiais e peso de cada finalização. */
const profile = (duration, material, color, push = 1.8, spin = 0.025) =>
  Object.freeze({ duration, material, color, push, spin });

export const ENEMY_DEATH_PROFILES = Object.freeze({
  ZOMBIE: profile(52, 'dust', '#78916b'),
  BAT: profile(42, 'mist', '#ff4757', 2.4, 0.05),
  GOLEM: profile(72, 'stone', '#95a5a6', 0.7, 0.005),
  STALKER: profile(58, 'dust', '#d9b783', 1, 0),
  EXPLODER: profile(48, 'ember', '#ffb142', 0.5, 0),
  NECRO: profile(66, 'rune', '#a29bfe', 0.8, 0),
  SHOOTER: profile(60, 'metal', '#74b9ff'),
  SHIELDED: profile(68, 'metal', '#b2bec3', 0.8, 0.01),
  SPLITTER: profile(54, 'slime', '#2ecc71'),
  SPLITTER_MINI: profile(40, 'slime', '#48dbfb', 2.2, 0.04),
  TRAIL_CRAWLER: profile(56, 'slime', '#16a085'),
  CRYPT_WEAVER: profile(60, 'dust', '#a4b0be'),
  CHAIN_FLAYER: profile(64, 'metal', '#b33939'),
  BASALT_GARGOYLE: profile(72, 'stone', '#747d8c', 0.7, 0.008),
  TOLL_BELLRINGER: profile(68, 'metal', '#f1c40f'),
  PLAGUE_APOTHECARY: profile(60, 'slime', '#27ae60'),
  RUNE_SCRIBE: profile(66, 'rune', '#74b9ff', 0.8, 0),
  FORGE_PYREGUARD: profile(64, 'ember', '#e67e22', 1, 0.01),
  MAIDEN_THORNS: profile(68, 'metal', '#c56cf0'),
  MIRROR_BANSHEE: profile(62, 'rune', '#d6c8ff', 0.8, 0),
  DULLAHAN_VANGUARD: profile(70, 'metal', '#8395a7', 0.9, 0.015),
  SNIPER_CULTIST: profile(58, 'mist', '#9c88ff'),
  VOID_SCAVENGER: profile(54, 'rune', '#00d2d3'),
  GRAVE_GORGON: profile(64, 'dust', '#747d8c', 1, 0.02),
  CURSED_CHEST: profile(72, 'rune', '#e056fd', 0.6, 0.01),
  ZOMBIE_ALPHA: profile(94, 'dust', '#27ae60', 0.8, 0.008),
  PHALANX_LEADER: profile(100, 'metal', '#bdc3c7', 0.6, 0.008),
  SEISMIC_SMASHER: profile(108, 'stone', '#95a5a6', 0.5, 0.005),
  RUST_COLOSSUS: profile(114, 'metal', '#d35400', 0.4, 0.005),
  BLOOD_GARGOYLE: profile(102, 'stone', '#ff1744', 0.8, 0.012),
  SPECTRAL_STALKER: profile(90, 'mist', '#a29bfe', 0.7, 0),
  QUANTUM_SLICER: profile(96, 'rune', '#81ecec', 0.4, 0),
  ARTILLERY_MECH: profile(102, 'metal', '#74b9ff', 0.6, 0.008),
  FIRE_INCINERATOR: profile(96, 'ember', '#ffb142', 0.4, 0),
  SIEGE_CAPTAIN: profile(100, 'metal', '#e66767', 0.7, 0.01),
  BROOD_MATRIARCH: profile(98, 'slime', '#00cec9', 0.6, 0.008),
  MOBILE_HIVE: profile(106, 'slime', '#16a085', 0.6, 0.008),
  HIGH_OCCULTIST: profile(108, 'rune', '#9c88ff', 0.4, 0),
  RUNIC_WARDEN: profile(110, 'rune', '#0984e3', 0.4, 0),
  VOID_PRECURSOR: profile(120, 'mist', '#e056fd', 0, 0),
  CHAOS_HERALD: profile(120, 'ember', '#ff4757', 0.5, 0.008)
});

const FALLBACK_DEATH = profile(54, 'dust', '#a4b0be');
export function getEnemyDeathProfile(enemy) {
  return ENEMY_DEATH_PROFILES[enemy.baseType] || FALLBACK_DEATH;
}

/** Impacto breve, colapso legível e tempo reservado para os resíduos dissiparem. */
export function getEnemyDeathProgress(de) {
  const elapsed = Math.max(0, Math.min(1, 1 - de.timer / de.maxTimer));
  const t = elapsed < 0.18 ? elapsed / 0.18 * 0.35
    : elapsed < 0.68 ? 0.35 + (elapsed - 0.18) / 0.5 * 0.4
      : 0.75 + (elapsed - 0.68) / 0.32 * 0.25;
  // Detonações naturais já atingiram a ruptura: não repetem a antecipação.
  return de.explodedNaturally ? 0.35 + t * 0.65 : t;
}
