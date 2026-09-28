import { t, formatNumber } from '../i18n/index.js';
/**
 * src/config/achievements.js
 * Definições Declarativas das Conquistas e Requisitos de Desbloqueio.
 * Dados puros com reexportações seguras do subsistema de progressão.
 */
import { BESTIARY_ENTRIES } from './bestiary.js';
import { isHeroUnlocked, isCreatureDiscovered } from '../systems/progression.js';


export const HERO_UNLOCK_MAP = {
  MAGE: 'hero_ignis',
  ROGUE: 'hero_kael',
  BARBARIAN: 'hero_kragdor',
  BERSERKER: 'hero_kragdor',
  ALCHEMIST: 'hero_valeria'
};

export const ACHIEVEMENTS = [
  // ========================================================
  // 1. HERÓIS & DESPERTARES (category: "hero")
  // ========================================================
  {
    id: 'hero_ignis',
    get title() { return t('achievements.hero_ignis.title'); },
    get desc() { return t('achievements.hero_ignis.description'); },
    category: "hero",
    tierId: 'heroic',
    get tier() { return t('content.tiers.heroic'); },
    heroKey: "MAGE",
    get heroTitle() { return t('achievements.hero_ignis.heroTitle'); },
    icon: "staff",
    rewardGold: 200,
    target: 1,
    get lore() { return t('achievements.hero_ignis.lore'); },
    get tactics() { return t('achievements.hero_ignis.tactics'); },
    checkProgress: (stats) => {
      const beaten = (stats.bossesDefeated || []).includes(1);
      return {
        current: beaten ? 1 : 0,
        target: 1,
        isMet: beaten,
        label: beaten ? t('achievements.hero_ignis.progress1') : t('achievements.hero_ignis.progress2')
      };
    }
  },
  {
    id: 'hero_kael',
    get title() { return t('achievements.hero_kael.title'); },
    get desc() { return t('achievements.hero_kael.description'); },
    category: "hero",
    tierId: 'heroic',
    get tier() { return t('content.tiers.heroic'); },
    heroKey: "ROGUE",
    get heroTitle() { return t('achievements.hero_kael.heroTitle'); },
    icon: "sword",
    rewardGold: 350,
    target: 1,
    get lore() { return t('achievements.hero_kael.lore'); },
    get tactics() { return t('achievements.hero_kael.tactics'); },
    checkProgress: (stats) => {
      const beaten = (stats.bossesDefeated || []).includes(2);
      return {
        current: beaten ? 1 : 0,
        target: 1,
        isMet: beaten,
        label: beaten ? t('achievements.hero_kael.progress1') : t('achievements.hero_kael.progress2')
      };
    }
  },
  {
    id: 'hero_kragdor',
    get title() { return t('achievements.hero_kragdor.title'); },
    get desc() { return t('achievements.hero_kragdor.description', { target: formatNumber(this.target) }); },
    category: "hero",
    tierId: 'heroic',
    get tier() { return t('content.tiers.heroic'); },
    heroKey: "BARBARIAN",
    get heroTitle() { return t('achievements.hero_kragdor.heroTitle'); },
    icon: "axe",
    rewardGold: 500,
    target: 5000,
    get lore() { return t('achievements.hero_kragdor.lore'); },
    get tactics() { return t('achievements.hero_kragdor.tactics'); },
    checkProgress: (stats) => ({
      current: Math.min(5000, stats.totalKills || 0),
      target: 5000,
      isMet: (stats.totalKills || 0) >= 5000,
      label: t('achievements.hero_kragdor.progress1', { value1: formatNumber((stats.totalKills || 0)) })
    })
  },
  {
    id: 'hero_valeria',
    get title() { return t('achievements.hero_valeria.title'); },
    get desc() { return t('achievements.hero_valeria.description', { target: formatNumber(this.target) }); },
    category: "hero",
    tierId: 'heroic',
    get tier() { return t('content.tiers.heroic'); },
    heroKey: "ALCHEMIST",
    get heroTitle() { return t('achievements.hero_valeria.heroTitle'); },
    icon: "potion",
    rewardGold: 500,
    target: 5,
    get lore() { return t('achievements.hero_valeria.lore'); },
    get tactics() { return t('achievements.hero_valeria.tactics'); },
    checkProgress: (stats) => ({
      current: Math.min(5, stats.totalEvolutions || 0),
      target: 5,
      isMet: (stats.totalEvolutions || 0) >= 5,
      label: t('achievements.hero_valeria.progress1', { value1: formatNumber(Math.min(5, stats.totalEvolutions || 0)) })
    })
  },
  {
    id: 'all_heroes_unlocked',
    get title() { return t('achievements.all_heroes_unlocked.title'); },
    get desc() { return t('achievements.all_heroes_unlocked.description'); },
    category: "hero",
    tierId: 'primordial',
    get tier() { return t('content.tiers.primordial'); },
    icon: "keystone",
    rewardGold: 1000,
    target: 5,
    get lore() { return t('achievements.all_heroes_unlocked.lore'); },
    get tactics() { return t('achievements.all_heroes_unlocked.tactics'); },
    checkProgress: () => {
      const keys = ['KNIGHT', 'MAGE', 'ROGUE', 'BARBARIAN', 'ALCHEMIST'];
      const unlockedCount = keys.filter(k => isHeroUnlocked(k)).length;
      return {
        current: unlockedCount,
        target: 5,
        isMet: unlockedCount >= 5,
        label: t('achievements.all_heroes_unlocked.progress1', { value1: formatNumber(unlockedCount) })
      };
    }
  },

  // ========================================================
  // 2. COMBATE & CARNIFICINA (category: "combat")
  // ========================================================
  {
    id: 'first_blood',
    get title() { return t('achievements.first_blood.title'); },
    get desc() { return t('achievements.first_blood.description'); },
    category: "combat",
    tierId: 'heroic',
    get tier() { return t('content.tiers.heroic'); },
    icon: "skull",
    rewardGold: 200,
    target: 1000,
    get lore() { return t('achievements.first_blood.lore'); },
    get tactics() { return t('achievements.first_blood.tactics'); },
    checkProgress: (stats) => ({
      current: Math.min(1000, stats.totalKills || 0),
      target: 1000,
      isMet: (stats.totalKills || 0) >= 1000,
      label: t('achievements.first_blood.progress1', { value1: formatNumber(Math.min(1000, stats.totalKills || 0)) })
    })
  },
  {
    id: 'kills_10k',
    get title() { return t('achievements.kills_10k.title'); },
    get desc() { return t('achievements.kills_10k.description'); },
    category: "combat",
    tierId: 'legendary',
    get tier() { return t('content.tiers.legendary'); },
    icon: "blood_drop",
    rewardGold: 400,
    target: 10000,
    get lore() { return t('achievements.kills_10k.lore'); },
    get tactics() { return t('achievements.kills_10k.tactics'); },
    checkProgress: (stats) => ({
      current: Math.min(10000, stats.totalKills || 0),
      target: 10000,
      isMet: (stats.totalKills || 0) >= 10000,
      label: t('achievements.kills_10k.progress1', { value1: formatNumber(Math.min(10000, stats.totalKills || 0)) })
    })
  },
  {
    id: 'kills_25k',
    get title() { return t('achievements.kills_25k.title'); },
    get desc() { return t('achievements.kills_25k.description'); },
    category: "combat",
    tierId: 'primordial',
    get tier() { return t('content.tiers.primordial'); },
    icon: "execute",
    rewardGold: 800,
    target: 25000,
    get lore() { return t('achievements.kills_25k.lore'); },
    get tactics() { return t('achievements.kills_25k.tactics'); },
    checkProgress: (stats) => ({
      current: Math.min(25000, stats.totalKills || 0),
      target: 25000,
      isMet: (stats.totalKills || 0) >= 25000,
      label: t('achievements.kills_25k.progress1', { value1: formatNumber(Math.min(25000, stats.totalKills || 0)) })
    })
  },
  {
    id: 'single_run_kills_2k',
    get title() { return t('achievements.single_run_kills_2k.title'); },
    get desc() { return t('achievements.single_run_kills_2k.description'); },
    category: "combat",
    tierId: 'heroic',
    get tier() { return t('content.tiers.heroic'); },
    icon: "wave_swords",
    rewardGold: 350,
    target: 2000,
    get lore() { return t('achievements.single_run_kills_2k.lore'); },
    get tactics() { return t('achievements.single_run_kills_2k.tactics'); },
    checkProgress: (stats) => {
      const cur = stats.singleRunMaxKills || 0;
      return {
        current: Math.min(2000, cur),
        target: 2000,
        isMet: cur >= 2000,
        label: t('achievements.single_run_kills_2k.progress1', { value1: formatNumber(Math.min(2000, cur)) })
      };
    }
  },
  {
    id: 'survive_10m',
    get title() { return t('achievements.survive_10m.title'); },
    get desc() { return t('achievements.survive_10m.description'); },
    category: "combat",
    tierId: 'heroic',
    get tier() { return t('content.tiers.heroic'); },
    icon: "timer",
    rewardGold: 300,
    target: 600,
    get lore() { return t('achievements.survive_10m.lore'); },
    get tactics() { return t('achievements.survive_10m.tactics'); },
    checkProgress: (stats) => {
      const secs = stats.maxSurvivalSeconds || 0;
      const mins = Math.floor(secs / 60);
      return {
        current: Math.min(600, secs),
        target: 600,
        isMet: secs >= 600,
        label: t('achievements.survive_10m.progress1', { value1: formatNumber(mins) })
      };
    }
  },
  {
    id: 'survive_15m',
    get title() { return t('achievements.survive_15m.title'); },
    get desc() { return t('achievements.survive_15m.description'); },
    category: "combat",
    tierId: 'legendary',
    get tier() { return t('content.tiers.legendary'); },
    icon: "timer",
    rewardGold: 600,
    target: 900,
    get lore() { return t('achievements.survive_15m.lore'); },
    get tactics() { return t('achievements.survive_15m.tactics'); },
    checkProgress: (stats) => {
      const secs = stats.maxSurvivalSeconds || 0;
      const mins = Math.floor(secs / 60);
      return {
        current: Math.min(900, secs),
        target: 900,
        isMet: secs >= 900,
        label: t('achievements.survive_15m.progress1', { value1: formatNumber(mins) })
      };
    }
  },

  // ========================================================
  // 3. SOBERANOS & CHEFES (category: "boss")
  // ========================================================
  {
    id: 'boss_vampire',
    get title() { return t('achievements.boss_vampire.title'); },
    get desc() { return t('achievements.boss_vampire.description'); },
    category: "boss",
    tierId: 'heroic',
    get tier() { return t('content.tiers.heroic'); },
    icon: "blood_drop",
    rewardGold: 250,
    target: 1,
    get lore() { return t('achievements.boss_vampire.lore'); },
    get tactics() { return t('achievements.boss_vampire.tactics'); },
    checkProgress: (stats) => {
      const beaten = (stats.bossesDefeated || []).includes(1);
      return {
        current: beaten ? 1 : 0,
        target: 1,
        isMet: beaten,
        label: beaten ? t('achievements.boss_vampire.progress1') : t('achievements.boss_vampire.progress2')
      };
    }
  },
  {
    id: 'boss_monolith',
    get title() { return t('achievements.boss_monolith.title'); },
    get desc() { return t('achievements.boss_monolith.description'); },
    category: "boss",
    tierId: 'heroic',
    get tier() { return t('content.tiers.heroic'); },
    icon: "hammer",
    rewardGold: 400,
    target: 1,
    get lore() { return t('achievements.boss_monolith.lore'); },
    get tactics() { return t('achievements.boss_monolith.tactics'); },
    checkProgress: (stats) => {
      const beaten = (stats.bossesDefeated || []).includes(2);
      return {
        current: beaten ? 1 : 0,
        target: 1,
        isMet: beaten,
        label: beaten ? t('achievements.boss_monolith.progress1') : t('achievements.boss_monolith.progress2')
      };
    }
  },
  {
    id: 'boss_reaper',
    get title() { return t('achievements.boss_reaper.title'); },
    get desc() { return t('achievements.boss_reaper.description'); },
    category: "boss",
    tierId: 'legendary',
    get tier() { return t('content.tiers.legendary'); },
    icon: "execute",
    rewardGold: 700,
    target: 1,
    get lore() { return t('achievements.boss_reaper.lore'); },
    get tactics() { return t('achievements.boss_reaper.tactics'); },
    checkProgress: (stats) => {
      const beaten = (stats.bossesDefeated || []).includes(3);
      return {
        current: beaten ? 1 : 0,
        target: 1,
        isMet: beaten,
        label: beaten ? t('achievements.boss_reaper.progress1') : t('achievements.boss_reaper.progress2')
      };
    }
  },
  {
    id: 'abyss_conqueror',
    get title() { return t('achievements.abyss_conqueror.title'); },
    get desc() { return t('achievements.abyss_conqueror.description'); },
    category: "boss",
    tierId: 'primordial',
    get tier() { return t('content.tiers.primordial'); },
    icon: "boss_crown",
    rewardGold: 1500,
    target: 1,
    get lore() { return t('achievements.abyss_conqueror.lore'); },
    get tactics() { return t('achievements.abyss_conqueror.tactics'); },
    checkProgress: (stats) => {
      const beaten = (stats.bossesDefeated || []).includes(4);
      return {
        current: beaten ? 1 : 0,
        target: 1,
        isMet: beaten,
        label: beaten ? t('achievements.abyss_conqueror.progress1') : t('achievements.abyss_conqueror.progress2')
      };
    }
  },
  {
    id: 'all_bosses_slain',
    get title() { return t('achievements.all_bosses_slain.title'); },
    get desc() { return t('achievements.all_bosses_slain.description'); },
    category: "boss",
    tierId: 'primordial',
    get tier() { return t('content.tiers.primordial'); },
    icon: "trophy",
    rewardGold: 1000,
    target: 4,
    get lore() { return t('achievements.all_bosses_slain.lore'); },
    get tactics() { return t('achievements.all_bosses_slain.tactics'); },
    checkProgress: (stats) => {
      const count = (stats.bossesDefeated || []).length;
      return {
        current: Math.min(4, count),
        target: 4,
        isMet: count >= 4,
        label: t('achievements.all_bosses_slain.progress1', { value1: formatNumber(Math.min(4, count)) })
      };
    }
  },
  {
    id: 'wave_5_reached',
    get title() { return t('achievements.wave_5_reached.title'); },
    get desc() { return t('achievements.wave_5_reached.description'); },
    category: "boss",
    tierId: 'heroic',
    get tier() { return t('content.tiers.heroic'); },
    icon: "wave_swords",
    rewardGold: 250,
    target: 5,
    get lore() { return t('achievements.wave_5_reached.lore'); },
    get tactics() { return t('achievements.wave_5_reached.tactics'); },
    checkProgress: (stats) => {
      const w = stats.highestWave || 1;
      return {
        current: Math.min(5, w),
        target: 5,
        isMet: w >= 5,
        label: t('achievements.wave_5_reached.progress1', { value1: formatNumber(Math.min(5, w)) })
      };
    }
  },

  // ========================================================
  // 4. ARSENAL & TRANSMUTAÇÃO (category: "arsenal")
  // ========================================================
  {
    id: 'first_evolution',
    get title() { return t('achievements.first_evolution.title'); },
    get desc() { return t('achievements.first_evolution.description'); },
    category: "arsenal",
    tierId: 'heroic',
    get tier() { return t('content.tiers.heroic'); },
    icon: "star_evolution",
    rewardGold: 200,
    target: 1,
    get lore() { return t('achievements.first_evolution.lore'); },
    get tactics() { return t('achievements.first_evolution.tactics'); },
    checkProgress: (stats) => {
      const evs = stats.totalEvolutions || 0;
      return {
        current: Math.min(1, evs),
        target: 1,
        isMet: evs >= 1,
        label: evs >= 1 ? t('achievements.first_evolution.progress1') : t('achievements.first_evolution.progress2')
      };
    }
  },
  {
    id: 'evolutions_10',
    get title() { return t('achievements.evolutions_10.title'); },
    get desc() { return t('achievements.evolutions_10.description'); },
    category: "arsenal",
    tierId: 'legendary',
    get tier() { return t('content.tiers.legendary'); },
    icon: "transmute",
    rewardGold: 500,
    target: 10,
    get lore() { return t('achievements.evolutions_10.lore'); },
    get tactics() { return t('achievements.evolutions_10.tactics'); },
    checkProgress: (stats) => {
      const evs = stats.totalEvolutions || 0;
      return {
        current: Math.min(10, evs),
        target: 10,
        isMet: evs >= 10,
        label: t('achievements.evolutions_10.progress1', { value1: formatNumber(Math.min(10, evs)) })
      };
    }
  },
  {
    id: 'max_weapons_evolved',
    get title() { return t('achievements.max_weapons_evolved.title'); },
    get desc() { return t('achievements.max_weapons_evolved.description'); },
    category: "arsenal",
    tierId: 'legendary',
    get tier() { return t('content.tiers.legendary'); },
    icon: "orbitals",
    rewardGold: 600,
    target: 3,
    get lore() { return t('achievements.max_weapons_evolved.lore'); },
    get tactics() { return t('achievements.max_weapons_evolved.tactics'); },
    checkProgress: (stats) => {
      const cur = stats.maxEvolvedWeaponsInRun || 0;
      return {
        current: Math.min(3, cur),
        target: 3,
        isMet: cur >= 3,
        label: t('achievements.max_weapons_evolved.progress1', { value1: formatNumber(Math.min(3, cur)) })
      };
    }
  },
  {
    id: 'chests_opened_15',
    get title() { return t('achievements.chests_opened_15.title'); },
    get desc() { return t('achievements.chests_opened_15.description'); },
    category: "arsenal",
    tierId: 'heroic',
    get tier() { return t('content.tiers.heroic'); },
    icon: "soul_coin",
    rewardGold: 300,
    target: 15,
    get lore() { return t('achievements.chests_opened_15.lore'); },
    get tactics() { return t('achievements.chests_opened_15.tactics'); },
    checkProgress: (stats) => {
      const ch = stats.totalChestsOpened || 0;
      return {
        current: Math.min(15, ch),
        target: 15,
        isMet: ch >= 15,
        label: t('achievements.chests_opened_15.progress1', { value1: formatNumber(Math.min(15, ch)) })
      };
    }
  },

  // ========================================================
  // 5. CÓDICE, DESTINO & MAESTRIA (category: "mastery")
  // ========================================================
  {
    id: 'bestiary_15',
    get title() { return t('achievements.bestiary_15.title'); },
    get desc() { return t('achievements.bestiary_15.description'); },
    category: "mastery",
    tierId: 'heroic',
    get tier() { return t('content.tiers.heroic'); },
    icon: "scroll",
    rewardGold: 300,
    target: 15,
    get lore() { return t('achievements.bestiary_15.lore'); },
    get tactics() { return t('achievements.bestiary_15.tactics'); },
    checkProgress: () => {
      const disc = BESTIARY_ENTRIES.filter(c => isCreatureDiscovered(c.id)).length;
      return {
        current: Math.min(15, disc),
        target: 15,
        isMet: disc >= 15,
        label: t('achievements.bestiary_15.progress1', { value1: formatNumber(Math.min(15, disc)) })
      };
    }
  },
  {
    id: 'bestiary_35',
    get title() { return t('achievements.bestiary_35.title'); },
    get desc() { return t('achievements.bestiary_35.description'); },
    category: "mastery",
    tierId: 'legendary',
    get tier() { return t('content.tiers.legendary'); },
    icon: "xp_tome",
    rewardGold: 700,
    target: 35,
    get lore() { return t('achievements.bestiary_35.lore'); },
    get tactics() { return t('achievements.bestiary_35.tactics'); },
    checkProgress: () => {
      const disc = BESTIARY_ENTRIES.filter(c => isCreatureDiscovered(c.id)).length;
      return {
        current: Math.min(35, disc),
        target: 35,
        isMet: disc >= 35,
        label: t('achievements.bestiary_35.progress1', { value1: formatNumber(Math.min(35, disc)) })
      };
    }
  },
  {
    id: 'reach_level_30',
    get title() { return t('achievements.reach_level_30.title'); },
    get desc() { return t('achievements.reach_level_30.description'); },
    category: "mastery",
    tierId: 'heroic',
    get tier() { return t('content.tiers.heroic'); },
    icon: "sparkle",
    rewardGold: 400,
    target: 30,
    get lore() { return t('achievements.reach_level_30.lore'); },
    get tactics() { return t('achievements.reach_level_30.tactics'); },
    checkProgress: (stats) => {
      const lvl = stats.highestLevel || 1;
      return {
        current: Math.min(30, lvl),
        target: 30,
        isMet: lvl >= 30,
        label: t('achievements.reach_level_30.progress1', { value1: formatNumber(Math.min(30, lvl)) })
      };
    }
  },
  {
    id: 'score_100k',
    get title() { return t('achievements.score_100k.title'); },
    get desc() { return t('achievements.score_100k.description'); },
    category: "mastery",
    tierId: 'primordial',
    get tier() { return t('content.tiers.primordial'); },
    icon: "trophy",
    rewardGold: 1200,
    target: 100000,
    get lore() { return t('achievements.score_100k.lore'); },
    get tactics() { return t('achievements.score_100k.tactics'); },
    checkProgress: (stats) => {
      const sc = stats.highestScore || 0;
      return {
        current: Math.min(100000, sc),
        target: 100000,
        isMet: sc >= 100000,
        label: t('achievements.score_100k.progress1', { value1: formatNumber(Math.min(100000, sc)) })
      };
    }
  }
];

// Reexportações de Retrocompatibilidade delegadas ao subsistema central de progressão
export {
  BEST_RUN_STORAGE_KEY,
  pendingAchievementNotifications,
  getLifetimeStats,
  saveLifetimeStats,
  getUnlockedAchievementIds,
  saveUnlockedAchievementIds,
  getAchievementsSummary,
  isHeroUnlocked,
  getAchievementStatus,
  recordRunStats,
  evaluateAchievements,
  unlockAllAchievements,
  resetAchievements,
  calculateRunScore,
  getBestRun,
  saveBestRun,
  checkAndRecordBestRun,
  getAllHeroRecords,
  getHeroRecord,
  recordHeroRunStats
} from '../systems/progression.js';
