import { t } from '../i18n/index.js';
/**
 * src/config/enemies.js
 */
export const ENEMY_TYPES = {

  ZOMBIE: { get name() { return t('creatures.ZOMBIE.name'); }, radius: 13, speed: 1.38, hp: 175, color: '#2ecc71', behavior: 'chase', damage: 25, xp: 1 },
  BAT: { get name() { return t('creatures.BAT.name'); }, radius: 4.5, speed: 3.25, hp: 73, color: '#ff4757', behavior: 'swarm', damage: 18, xp: 1 },
  GOLEM: { get name() { return t('creatures.GOLEM.name'); }, radius: 24, speed: 0.82, hp: 686, color: '#747d8c', behavior: 'tank', damage: 56, xp: 6 },
  STALKER: { get name() { return t('creatures.STALKER.name'); }, radius: 12, speed: 1.35, hp: 189, color: '#d9b783', behavior: 'dash', damage: 34, xp: 3 },
  EXPLODER: { get name() { return t('creatures.EXPLODER.name'); }, radius: 13, speed: 2.1, hp: 147, color: '#e67e22', behavior: 'kamikaze', damage: 39, xp: 2 },
  NECRO: { get name() { return t('creatures.NECRO.name'); }, radius: 15, speed: 0.95, hp: 294, color: '#34495e', behavior: 'summoner', damage: 34, xp: 8 },
  SHOOTER: { get name() { return t('creatures.SHOOTER.name'); }, radius: 14, speed: 1.1, hp: 231, color: '#0984e3', behavior: 'shooter', damage: 29, xp: 4 },
  SHIELDED: { get name() { return t('creatures.SHIELDED.name'); }, radius: 16, speed: 1.0, hp: 406, color: '#b2bec3', behavior: 'shielded', damage: 40, xp: 5 },
  SPLITTER: { get name() { return t('creatures.SPLITTER.name'); }, radius: 15, speed: 1.4, hp: 217, color: '#00d2d3', behavior: 'splitter', damage: 29, xp: 4 },
  SPLITTER_MINI: { get name() { return t('creatures.SPLITTER_MINI.name'); }, radius: 9, speed: 2.2, hp: 84, color: '#48dbfb', behavior: 'chase', damage: 18, xp: 2 },

  // --- 15 NOVOS MONSTROS DA HORDA EXPANDIDA ---
  TRAIL_CRAWLER:    { get name() { return t('creatures.TRAIL_CRAWLER.name'); }, radius: 13, speed: 1.45, hp: 160, color: '#16a085', behavior: 'trail_toxic', damage: 12, xp: 2 },
  CRYPT_WEAVER:     { get name() { return t('creatures.CRYPT_WEAVER.name'); }, radius: 14, speed: 1.20, hp: 210, color: '#636e72', behavior: 'web_trapper', damage: 21, xp: 3 },
  CHAIN_FLAYER:     { get name() { return t('creatures.CHAIN_FLAYER.name'); }, radius: 16, speed: 1.05, hp: 310, color: '#b33939', behavior: 'chain_hook', damage: 36, xp: 4 },
  BASALT_GARGOYLE:  { get name() { return t('creatures.BASALT_GARGOYLE.name'); }, radius: 18, speed: 1.35, hp: 520, color: '#57606f', behavior: 'stone_turtle', damage: 42, xp: 5 },
  TOLL_BELLRINGER:  { get name() { return t('creatures.TOLL_BELLRINGER.name'); }, radius: 15, speed: 0.90, hp: 240, color: '#f39c12', behavior: 'haste_chanter', damage: 20, xp: 5 },
  PLAGUE_APOTHECARY:{ get name() { return t('creatures.PLAGUE_APOTHECARY.name'); }, radius: 14, speed: 1.00, hp: 260, color: '#27ae60', behavior: 'horde_mender', damage: 23, xp: 6 },
  RUNE_SCRIBE:      { get name() { return t('creatures.RUNE_SCRIBE.name'); }, radius: 15, speed: 0.95, hp: 280, color: '#2980b9', behavior: 'barrier_linker', damage: 26, xp: 6 },
  FORGE_PYREGUARD:  { get name() { return t('creatures.FORGE_PYREGUARD.name'); }, radius: 17, speed: 0.85, hp: 340, color: '#d35400', behavior: 'flamethrower_cone', damage: 34, xp: 5 },
  MAIDEN_THORNS:    { get name() { return t('creatures.MAIDEN_THORNS.name'); }, radius: 16, speed: 1.15, hp: 380, color: '#8e44ad', behavior: 'spike_retaliation', damage: 38, xp: 5 },
  MIRROR_BANSHEE:   { get name() { return t('creatures.MIRROR_BANSHEE.name'); }, radius: 13, speed: 2.10, hp: 170, color: '#a29bfe', behavior: 'mirror_decoy', damage: 27, xp: 4 },
  DULLAHAN_VANGUARD:{ get name() { return t('creatures.DULLAHAN_VANGUARD.name'); }, radius: 18, speed: 1.10, hp: 440, color: '#2c3e50', behavior: 'lance_charge', damage: 49, xp: 6 },
  SNIPER_CULTIST:   { get name() { return t('creatures.SNIPER_CULTIST.name'); }, radius: 14, speed: 0.80, hp: 180, color: '#9c88ff', behavior: 'long_range_sniper', damage: 55, xp: 5 },
  VOID_SCAVENGER:   { get name() { return t('creatures.VOID_SCAVENGER.name'); }, radius: 12, speed: 2.30, hp: 95, color: '#00d2d3', behavior: 'xp_devourer', damage: 18, xp: 3 },
  GRAVE_GORGON:     { get name() { return t('creatures.GRAVE_GORGON.name'); }, radius: 17, speed: 1.10, hp: 350, color: '#535c68', behavior: 'corpse_eater', damage: 31, xp: 6 },
  CURSED_CHEST:     { get name() { return t('creatures.CURSED_CHEST.name'); }, radius: 18, speed: 2.50, hp: 850, color: '#e056fd', behavior: 'mimic_trap', damage: 47, xp: 15 }

};

// Recalibração de HP da Fase 5 e Normalização de Economia de XP (Fase 6.1) + Dano dos Chefes (+35%)
export const BOSS_TYPES = {
  1: { get name() { return t('creatures.BOSS_1.name'); }, hp: 28000, radius: 38, speed: 1.85, color: '#8e44ad', damage: 81, xp: 450, bossId: 1 },
  2: { get name() { return t('creatures.BOSS_2.shortName'); }, hp: 98000, radius: 48, speed: 0.95, color: '#c0392b', damage: 135, xp: 1200, bossId: 2 },
  3: { get name() { return t('creatures.BOSS_3.name'); }, hp: 140000, radius: 44, speed: 2.1, color: '#00cec9', damage: 246, xp: 2400, bossId: 3 },
  4: { get name() { return t('creatures.BOSS_4.name'); }, hp: 309400, radius: 52, speed: 1.25, color: '#8e44ad', damage: 365, xp: 0, bossId: 4, isFinalBoss: true }
};

export const MINI_BOSS_TYPES = {
  BLOOD_GARGOYLE:   { get name() { return t('creatures.BLOOD_GARGOYLE.name'); }, radius: 24, speed: 1.95, hp: 380, color: '#c0392b', behavior: 'dash', damage: 22, xp: 90, gold: 15 },
  ZOMBIE_ALPHA:     { get name() { return t('creatures.ZOMBIE_ALPHA.name'); }, radius: 26, speed: 1.1, hp: 952, color: '#27ae60', behavior: 'chase', damage: 39, xp: 95, gold: 20 },
  PHALANX_LEADER:   { get name() { return t('creatures.PHALANX_LEADER.name'); }, radius: 28, speed: 1.2, hp: 1190, color: '#7f8c8d', behavior: 'shielded', damage: 44, xp: 110, gold: 25 },
  SEISMIC_SMASHER:  { get name() { return t('creatures.SEISMIC_SMASHER.name'); }, radius: 26, speed: 0.9, hp: 1288, color: '#95a5a6', behavior: 'ground_slam', damage: 47, xp: 120, gold: 25 },
  ARTILLERY_MECH:   { get name() { return t('creatures.ARTILLERY_MECH.name'); }, radius: 25, speed: 0.9, hp: 1050, color: '#2980b9', behavior: 'shooter', damage: 31, xp: 130, gold: 22 },
  FIRE_INCINERATOR: { get name() { return t('creatures.FIRE_INCINERATOR.name'); }, radius: 20, speed: 2.0, hp: 812, color: '#e67e22', behavior: 'kamikaze_spread', damage: 40, xp: 115, gold: 20 },
  BROOD_MATRIARCH:  { get name() { return t('creatures.BROOD_MATRIARCH.name'); }, radius: 25, speed: 1.3, hp: 1232, color: '#00cec9', behavior: 'splitter_queen', damage: 17, xp: 140, gold: 30 },
  SPECTRAL_STALKER: { get name() { return t('creatures.SPECTRAL_STALKER.name'); }, radius: 22, speed: 2.5, hp: 868, color: '#6c5ce7', behavior: 'backstab_dash', damage: 49, xp: 135, gold: 28 },
  HIGH_OCCULTIST:   { get name() { return t('creatures.HIGH_OCCULTIST.name'); }, radius: 24, speed: 1.0, hp: 1330, color: '#341f97', behavior: 'gravity_ritual', damage: 38, xp: 160, gold: 35 },
  RUNIC_WARDEN:     { get name() { return t('creatures.RUNIC_WARDEN.name'); }, radius: 27, speed: 1.1, hp: 1680, color: '#0984e3', behavior: 'protect_aura', damage: 31, xp: 150, gold: 35 },
  RUST_COLOSSUS:    { get name() { return t('creatures.RUST_COLOSSUS.name'); }, radius: 32, speed: 0.85, hp: 2240, color: '#d35400', behavior: 'boulder_throw', damage: 55, xp: 180, gold: 40 },
  SIEGE_CAPTAIN:    { get name() { return t('creatures.SIEGE_CAPTAIN.name'); }, radius: 26, speed: 1.0, hp: 1540, color: '#b71540', behavior: 'mortar_barrage', damage: 44, xp: 165, gold: 40 },
  MOBILE_HIVE:      { get name() { return t('creatures.MOBILE_HIVE.name'); }, radius: 28, speed: 1.3, hp: 1820, color: '#16a085', behavior: 'bat_spawner', damage: 34, xp: 200, gold: 45 },
  QUANTUM_SLICER:   { get name() { return t('creatures.QUANTUM_SLICER.name'); }, radius: 23, speed: 2.2, hp: 1372, color: '#a29bfe', behavior: 'blink_slash', damage: 56, xp: 190, gold: 45 },
  VOID_PRECURSOR:   { get name() { return t('creatures.VOID_PRECURSOR.name'); }, radius: 27, speed: 1.2, hp: 2520, color: '#8e44ad', behavior: 'vortex_carrier', damage: 49, xp: 220, gold: 50 },
  CHAOS_HERALD:     { get name() { return t('creatures.CHAOS_HERALD.name'); }, radius: 30, speed: 1.7, hp: 3080, color: '#c0392b', behavior: 'chaos_cycle', damage: 62, xp: 220, gold: 60 }
};

/**
 * Conjunto de monstros com alto custo computacional/gráfico (projéteis balísticos e auras/efeitos especiais contínuos).
 * Devem sofrer redução de 70% na probabilidade de spawn e não podem surgir em super-hordas massivas.
 */
export const FPS_HEAVY_ENEMY_TYPES = new Set([
  'SHOOTER',           // Projéteis balísticos em rajadas triplas
  'SNIPER_CULTIST',    // Mira laser contínua e disparos de longo alcance
  'NECRO',             // Invocação de lacaios e orbes sombrios
  'TOLL_BELLRINGER',   // Sino fúnebre com ondas de choque e partículas douradas em área
  'PLAGUE_APOTHECARY', // Auras de cura e emissão de partículas verdes contínuas
  'RUNE_SCRIBE',       // Feixes de laser conectando barreiras entre inimigos
  'FORGE_PYREGUARD',   // Cones de chamas com grande volume de partículas
  'CRYPT_WEAVER',      // Redes de teia persistentes na arena
  'MIRROR_BANSHEE'     // Geração de cópias ilusórias adicionais
]);

export function isFpsHeavyEnemyType(typeKey) {
  return FPS_HEAVY_ENEMY_TYPES.has(typeKey);
}
