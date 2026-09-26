/**
 * src/systems/progression.js
 * 
 * Subsistema Unificado de Meta-Progressão, Estatísticas, Conquistas e Bestiário.
 * Centraliza a progressão permanente e utiliza In-Memory State Store com Flush Assíncrono
 * (Fase 2) para eliminar 100% dos travamentos de I/O síncrono durante as partidas.
 */

import { playSfx, triggerHaptic } from '../core/audio.js';
import { META_TALENTS } from '../config/talents.js';
import { ACHIEVEMENTS, HERO_UNLOCK_MAP } from '../config/achievements.js';
import { BESTIARY_ENTRIES } from '../config/bestiary.js';
import { perfMetrics } from '../core/perfMetrics.js';

// Chaves de Persistência no LocalStorage
const GOLD_KEY = 'hord_persistent_gold_v1';
const META_KEY = 'hord_meta_tree_v1';
const ACHIEVEMENTS_STORAGE_KEY = 'hord_achievements_v2';
const STATS_STORAGE_KEY = 'hord_stats_v2';
export const BEST_RUN_STORAGE_KEY = 'hord_best_run_v1';
export const HERO_RECORDS_STORAGE_KEY = 'hord_hero_records_v2';
const BESTIARY_STORAGE_KEY = 'hord_bestiary_v1';

// ============================================================================
// STORE REATIVO EM MEMÓRIA & PERSISTÊNCIA ASSÍNCRONA EM LOTE (FASE 2)
// ============================================================================

const store = {
  initialized: false,
  gold: 0,
  metaLevels: {},
  lifetimeStats: null,
  achievementIds: [],
  bestRun: null,
  heroRecords: {},
  bestiary: {},
  dirty: new Set()
};

let _flushTimer = null;

function ensureStoreInitialized() {
  if (store.initialized) return;
  store.initialized = true;

  perfMetrics.countPersistenceRead();
  try {
    store.gold = parseInt(localStorage.getItem(GOLD_KEY) || '0', 10);
  } catch (e) { store.gold = 0; }

  perfMetrics.countPersistenceRead();
  try {
    const rawMeta = localStorage.getItem(META_KEY);
    const parsedMeta = rawMeta ? JSON.parse(rawMeta) : {};
    META_TALENTS.forEach(t => {
      store.metaLevels[t.id] = (typeof parsedMeta[t.id] === 'number') ? parsedMeta[t.id] : 0;
    });
  } catch (e) {
    META_TALENTS.forEach(t => { store.metaLevels[t.id] = 0; });
  }

  perfMetrics.countPersistenceRead();
  try {
    const rawAch = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    store.achievementIds = rawAch ? (JSON.parse(rawAch) || []) : [];
  } catch (e) { store.achievementIds = []; }

  perfMetrics.countPersistenceRead();
  try {
    const rawStats = localStorage.getItem(STATS_STORAGE_KEY);
    store.lifetimeStats = rawStats ? JSON.parse(rawStats) : null;
  } catch (e) { store.lifetimeStats = null; }

  perfMetrics.countPersistenceRead();
  try {
    const rawBestRun = localStorage.getItem(BEST_RUN_STORAGE_KEY);
    store.bestRun = rawBestRun ? JSON.parse(rawBestRun) : null;
  } catch (e) { store.bestRun = null; }

  perfMetrics.countPersistenceRead();
  try {
    const rawRecords = localStorage.getItem(HERO_RECORDS_STORAGE_KEY) || localStorage.getItem('hord_hero_records_v1');
    store.heroRecords = rawRecords ? (JSON.parse(rawRecords) || {}) : {};
  } catch (e) { store.heroRecords = {}; }

  perfMetrics.countPersistenceRead();
  try {
    const rawBestiary = localStorage.getItem(BESTIARY_STORAGE_KEY);
    store.bestiary = rawBestiary ? (JSON.parse(rawBestiary) || {}) : {};
  } catch (e) { store.bestiary = {}; }
}

/**
 * Salva no localStorage em lote apenas as chaves alteradas.
 * Zero impacto no frame-rate durante rajadas de abates e coleta.
 */
export function flushProgression() {
  if (_flushTimer) {
    clearTimeout(_flushTimer);
    _flushTimer = null;
  }
  if (!store.initialized || store.dirty.size === 0) return;

  perfMetrics.countPersistenceWrite();
  try {
    if (store.dirty.has(GOLD_KEY)) {
      localStorage.setItem(GOLD_KEY, store.gold.toString());
    }
    if (store.dirty.has(META_KEY)) {
      localStorage.setItem(META_KEY, JSON.stringify(store.metaLevels));
    }
    if (store.dirty.has(STATS_STORAGE_KEY) && store.lifetimeStats) {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(store.lifetimeStats));
    }
    if (store.dirty.has(ACHIEVEMENTS_STORAGE_KEY)) {
      localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(store.achievementIds));
    }
    if (store.dirty.has(BEST_RUN_STORAGE_KEY) && store.bestRun) {
      localStorage.setItem(BEST_RUN_STORAGE_KEY, JSON.stringify(store.bestRun));
    }
    if (store.dirty.has(HERO_RECORDS_STORAGE_KEY)) {
      localStorage.setItem(HERO_RECORDS_STORAGE_KEY, JSON.stringify(store.heroRecords));
    }
    if (store.dirty.has(BESTIARY_STORAGE_KEY)) {
      localStorage.setItem(BESTIARY_STORAGE_KEY, JSON.stringify(store.bestiary));
    }
    store.dirty.clear();
  } catch (e) {
    console.error('Erro ao salvar persistência em lote:', e);
  }
}

function markDirty(key) {
  store.dirty.add(key);
  if (!_flushTimer) {
    _flushTimer = setTimeout(() => {
      _flushTimer = null;
      flushProgression();
    }, 1500); // Debounce de 1.5s (Zero I/O no meio do combate)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushProgression);
}

// ============================================================================
// 1. OURO E META-TALENTOS PERMANENTES
// ============================================================================

export function getPersistentGold() {
  ensureStoreInitialized();
  return store.gold;
}

export function addPersistentGold(amount) {
  ensureStoreInitialized();
  let finalAmount = amount;
  // Bônus do multiplicador de ouro se player estiver ativo
  if (amount > 0 && typeof window !== 'undefined' && window.player && window.player.goldMultiplier) {
    finalAmount = Math.round(amount * window.player.goldMultiplier);
  }
  store.gold = Math.max(0, store.gold + finalAmount);
  markDirty(GOLD_KEY);
  return store.gold;
}

export function getMetaLevels() {
  ensureStoreInitialized();
  const result = {};
  META_TALENTS.forEach(t => {
    result[t.id] = (typeof store.metaLevels[t.id] === 'number') ? store.metaLevels[t.id] : 0;
  });
  return result;
}

export function saveMetaLevels(levels) {
  ensureStoreInitialized();
  Object.assign(store.metaLevels, levels);
  markDirty(META_KEY);
}

export function getMetaUpgradeCost(talentId, currentLevel) {
  const talent = META_TALENTS.find(t => t.id === talentId);
  if (!talent) return 999999;
  return Math.floor(talent.costBase * Math.pow(talent.costScale, currentLevel));
}

export function buyMetaUpgrade(talentId) {
  ensureStoreInitialized();
  const levels = getMetaLevels();
  const talent = META_TALENTS.find(t => t.id === talentId);
  const currentLvl = levels[talentId] || 0;
  if (!talent || currentLvl >= talent.maxLvl) return false;

  // Pré-requisito de nó pai (deve ter pelo menos 1 rank no nó antecessor)
  if (talent.parent && (levels[talent.parent] || 0) < 1) return false;

  const cost = getMetaUpgradeCost(talentId, currentLvl);
  const gold = getPersistentGold();
  if (gold < cost) return false;

  addPersistentGold(-cost);
  levels[talentId] = currentLvl + 1;
  saveMetaLevels(levels);
  return true;
}

export function resetMetaTree() {
  ensureStoreInitialized();
  const levels = getMetaLevels();
  let refund = 0;
  META_TALENTS.forEach(t => {
    const lvl = levels[t.id] || 0;
    for (let l = 0; l < lvl; l++) {
      refund += Math.floor(t.costBase * Math.pow(t.costScale, l));
    }
    levels[t.id] = 0;
    store.metaLevels[t.id] = 0;
  });
  markDirty(META_KEY);
  addPersistentGold(refund);
  return refund;
}

export function getMetaBonuses() {
  const levels = getMetaLevels();
  return {
    damageMult: 1 + (levels.damage || 0) * 0.05,
    critBonus: (levels.crit || 0) * 0.02,
    cooldownReduction: (levels.cooldown || 0) * 0.02,
    executeBonus: (levels.execute || 0) * 0.08,

    hpMult: 1 + (levels.hp || 0) * 0.04,
    armorBonus: (levels.armor || 0) * 1,
    speedMult: 1 + (levels.speed || 0) * 0.025,
    regenBonus: (levels.regen || 0) * 0.5,
    phoenixRevives: (levels.phoenix || 0) * 1,

    magnetBonus: (levels.magnet || 0) * 20,
    goldMult: 1 + (levels.gold || 0) * 0.05,
    xpMult: 1 + (levels.xp || 0) * 0.04,
    rerolls: levels.reroll || 0,
    doubleChestChance: (levels.transmute || 0) * 0.25
  };
}

// ============================================================================
// 2. CONQUISTAS E ESTATÍSTICAS VITALÍCIAS
// ============================================================================

export const pendingAchievementNotifications = [];

const DEFAULT_LIFETIME_STATS = {
  totalKills: 0,
  highestWave: 1,
  bossesDefeated: [],
  totalEvolutions: 0,
  runsPlayed: 0,
  totalChestsOpened: 0,
  maxSurvivalSeconds: 0,
  highestLevel: 1,
  highestScore: 0,
  singleRunMaxKills: 0,
  maxEvolvedWeaponsInRun: 0
};

export function getLifetimeStats() {
  ensureStoreInitialized();
  if (!store.lifetimeStats) {
    store.lifetimeStats = { ...DEFAULT_LIFETIME_STATS };
  }
  return store.lifetimeStats;
}

export function saveLifetimeStats(stats) {
  ensureStoreInitialized();
  store.lifetimeStats = stats;
  markDirty(STATS_STORAGE_KEY);
}

export function getUnlockedAchievementIds() {
  ensureStoreInitialized();
  return store.achievementIds;
}

export function saveUnlockedAchievementIds(ids) {
  ensureStoreInitialized();
  store.achievementIds = ids;
  markDirty(ACHIEVEMENTS_STORAGE_KEY);
}

export function isHeroUnlocked(heroKey) {
  if (heroKey === 'KNIGHT') return true;
  const achievementId = HERO_UNLOCK_MAP[heroKey];
  if (!achievementId) return true;
  if (getUnlockedAchievementIds().includes(achievementId)) return true;
  // Retroactive check: evaluate current stats to see if the achievement should already be unlocked
  const stats = getLifetimeStats();
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (achievement) {
    const progress = achievement.checkProgress(stats);
    if (progress.isMet) {
      evaluateAchievements(stats);
      return true;
    }
  }
  return false;
}

export function getAchievementsSummary() {
  const unlockedIds = getUnlockedAchievementIds();
  const total = ACHIEVEMENTS.length;
  const unlocked = ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id)).length;
  const completionPct = total > 0 ? Math.round((unlocked / total) * 100) : 0;
  
  const totalSoulsReward = ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id))
    .reduce((sum, a) => sum + (a.rewardGold || 0), 0);

  const heroKeys = ['KNIGHT', 'MAGE', 'ROGUE', 'BARBARIAN', 'ALCHEMIST'];
  const unlockedHeroesCount = heroKeys.filter(k => isHeroUnlocked(k)).length;

  return {
    total,
    unlocked,
    completionPct,
    totalSoulsReward,
    unlockedHeroesCount
  };
}

export function getAchievementStatus(achievementId) {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) return null;

  const unlockedIds = getUnlockedAchievementIds();
  const isUnlocked = unlockedIds.includes(achievementId);
  const stats = getLifetimeStats();
  const progress = achievement.checkProgress ? achievement.checkProgress(stats) : { current: isUnlocked ? 1 : 0, target: 1, isMet: isUnlocked };
  const isCompleted = isUnlocked || !!progress.isMet;
  const current = progress.current ?? (isCompleted ? (achievement.target || 1) : 0);
  const target = progress.target ?? (achievement.target || 1);
  const percent = isCompleted ? 100 : Math.min(100, Math.max(0, Math.round((current / (target || 1)) * 100)));

  return {
    achievement,
    isUnlocked,
    isCompleted,
    progress,
    percent,
    pct: percent,
    title: achievement.title,
    desc: achievement.desc,
    lore: achievement.lore,
    tactics: achievement.tactics,
    rewardGold: achievement.rewardGold || 0,
    current,
    target,
    label: progress.label || `${current} / ${target}`
  };
}

export function recordRunStats(delta = {}) {
  const stats = getLifetimeStats();

  if (delta.kills) stats.totalKills = (stats.totalKills || 0) + delta.kills;
  if (delta.wave && delta.wave > (stats.highestWave || 1)) stats.highestWave = delta.wave;
  if (delta.level && delta.level > (stats.highestLevel || 1)) stats.highestLevel = delta.level;
  const chestDelta = delta.chests || delta.chestOpened;
  if (chestDelta) stats.totalChestsOpened = (stats.totalChestsOpened || 0) + (typeof chestDelta === 'number' ? chestDelta : 1);
  const evoDelta = delta.evolutions || delta.evolution;
  if (evoDelta) stats.totalEvolutions = (stats.totalEvolutions || 0) + (typeof evoDelta === 'number' ? evoDelta : 1);
  if (delta.survivalSeconds && delta.survivalSeconds > (stats.maxSurvivalSeconds || 0)) {
    stats.maxSurvivalSeconds = delta.survivalSeconds;
  }
  if (delta.runKills && delta.runKills > (stats.singleRunMaxKills || 0)) {
    stats.singleRunMaxKills = delta.runKills;
  }
  if (delta.evolvedWeaponsCount && delta.evolvedWeaponsCount > (stats.maxEvolvedWeaponsInRun || 0)) {
    stats.maxEvolvedWeaponsInRun = delta.evolvedWeaponsCount;
  }
  if (delta.score && delta.score > (stats.highestScore || 0)) {
    stats.highestScore = delta.score;
  }

  const bossIdx = delta.bossDefeatedIndex ?? delta.bossDefeated;
  if (bossIdx) {
    if (!Array.isArray(stats.bossesDefeated)) stats.bossesDefeated = [];
    if (!stats.bossesDefeated.includes(bossIdx)) {
      stats.bossesDefeated.push(bossIdx);
    }
  }

  if (delta.runCompleted || delta.runFinished) {
    stats.runsPlayed = (stats.runsPlayed || 0) + 1;
    // Força gravação imediata ao término da partida
    flushProgression();
  }

  saveLifetimeStats(stats);
  return evaluateAchievements(stats);
}

let isEvaluatingAchievements = false;

export function evaluateAchievements(stats = getLifetimeStats()) {
  if (isEvaluatingAchievements) return [];
  isEvaluatingAchievements = true;
  try {
    return evaluateAchievementPass(stats);
  } finally {
    isEvaluatingAchievements = false;
  }
}

function evaluateAchievementPass(stats) {
  const unlockedIds = getUnlockedAchievementIds();
  const newlyUnlocked = [];

  ACHIEVEMENTS.forEach(ach => {
    if (!unlockedIds.includes(ach.id)) {
      const progress = ach.checkProgress(stats);
      if (progress.isMet) {
        unlockedIds.push(ach.id);
        newlyUnlocked.push(ach);
        pendingAchievementNotifications.push(ach);

        if (ach.rewardGold && ach.rewardGold > 0) {
          addPersistentGold(ach.rewardGold);
        }

        try {
          playSfx('chest_rare');
          triggerHaptic('heavy');
        } catch (e) {}
      }
    }
  });

  if (newlyUnlocked.length > 0) {
    saveUnlockedAchievementIds(unlockedIds);
  }

  return newlyUnlocked;
}

export function unlockAllAchievements() {
  const allIds = ACHIEVEMENTS.map(a => a.id);
  saveUnlockedAchievementIds(allIds);
  
  const stats = getLifetimeStats();
  stats.bossesDefeated = [1, 2, 3, 4];
  stats.highestWave = 10;
  stats.totalKills = Math.max(stats.totalKills || 0, 5000);
  stats.totalEvolutions = Math.max(stats.totalEvolutions || 0, 10);
  stats.totalChestsOpened = Math.max(stats.totalChestsOpened || 0, 50);
  stats.maxSurvivalSeconds = Math.max(stats.maxSurvivalSeconds || 0, 600);
  stats.highestLevel = Math.max(stats.highestLevel || 0, 30);
  stats.maxEvolvedWeaponsInRun = Math.max(stats.maxEvolvedWeaponsInRun || 0, 3);
  saveLifetimeStats(stats);

  addPersistentGold(2000);
  try {
    playSfx('chest_rare');
    triggerHaptic('heavy');
  } catch (e) {}
  return true;
}

export function resetAchievements() {
  saveUnlockedAchievementIds([]);
  const freshStats = { ...DEFAULT_LIFETIME_STATS };
  saveLifetimeStats(freshStats);
  store.bestRun = null;
  store.heroRecords = {};
  markDirty(BEST_RUN_STORAGE_KEY);
  markDirty(HERO_RECORDS_STORAGE_KEY);
  try {
    localStorage.removeItem(BEST_RUN_STORAGE_KEY);
    localStorage.removeItem(HERO_RECORDS_STORAGE_KEY);
    playSfx('hit');
    triggerHaptic('light');
  } catch (e) {}
  return true;
}

export function calculateRunScore(runData = {}) {
  const kills = runData.kills || 0;
  const seconds = runData.seconds || 0;
  const level = runData.level || 1;
  const bosses = (runData.bossesDefeated || []).length;
  const isVictory = !!runData.isVictory;

  let score = kills * 10;
  score += seconds * 15;
  score += (level - 1) * 200;
  score += bosses * 1500;
  if (isVictory) score += 5000;
  return score;
}

export function getBestRun() {
  ensureStoreInitialized();
  return store.bestRun;
}

export function saveBestRun(runData) {
  ensureStoreInitialized();
  store.bestRun = runData;
  markDirty(BEST_RUN_STORAGE_KEY);
}

export function checkAndRecordBestRun(runData = {}) {
  const currentBest = getBestRun();
  const newScore = calculateRunScore(runData);

  const shouldReplace = !currentBest || newScore > (currentBest.score || 0);

  if (shouldReplace) {
    const bestRecord = {
      heroKey: runData.heroKey || 'KNIGHT',
      seconds: runData.seconds || 0,
      timeStr: runData.timeStr || '00:00',
      kills: runData.kills || 0,
      level: runData.level || 1,
      highestWave: runData.highestWave || 1,
      bossesDefeatedCount: (runData.bossesDefeated || []).length,
      isVictory: !!runData.isVictory,
      score: newScore,
      timestamp: Date.now()
    };
    saveBestRun(bestRecord);
    return { isNewBest: true, bestRun: bestRecord };
  }

  return { isNewBest: false, bestRun: currentBest };
}

export function getAllHeroRecords() {
  ensureStoreInitialized();
  return store.heroRecords;
}

export function getHeroRecord(heroKey) {
  if (!heroKey) return null;
  const all = getAllHeroRecords();
  const raw = all[heroKey] || {};

  const runsPlayed = Number(raw.runsPlayed) || 0;
  const victories = Number(raw.victories) || Number(raw.victoriesCount) || 0;
  const kills = Number(raw.maxKills) || 0;
  const bestSeconds = Number(raw.bestSeconds) || Number(raw.maxSurvivalSeconds) || 0;

  let timeStr = '00:00';
  if (bestSeconds > 0) {
    const m = Math.floor(bestSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(bestSeconds % 60).toString().padStart(2, '0');
    timeStr = `${m}:${s}`;
  } else if (raw.bestTimeStr || raw.maxTimeStr) {
    timeStr = raw.bestTimeStr || raw.maxTimeStr;
  }

  const unlocked = isHeroUnlocked(heroKey);

  let statusLabel = 'DESPERTO';
  let statusClass = 'status-awake';

  if (!unlocked) {
    statusLabel = 'BLOQUEADO';
    statusClass = 'status-locked';
  } else if (victories > 0) {
    statusLabel = victories >= 3 ? 'LENDÁRIO' : 'VITORIOSO';
    statusClass = 'status-victorious';
  } else if (bestSeconds >= 600) {
    statusLabel = 'CONSAGRADO';
    statusClass = 'status-consecrated';
  } else if (bestSeconds >= 300) {
    statusLabel = 'VETERANO';
    statusClass = 'status-veteran';
  } else if (runsPlayed > 0) {
    statusLabel = 'COMBATENTE';
    statusClass = 'status-fighter';
  } else {
    statusLabel = 'DESPERTO';
    statusClass = 'status-awake';
  }

  return {
    heroKey,
    unlocked,
    runsPlayed,
    victories,
    kills,
    bestSeconds,
    timeStr,
    statusLabel,
    statusClass
  };
}

export function recordHeroRunStats(heroKey, { seconds = 0, timeStr = '00:00', kills = 0, level = 1, wave = 1, isVictory = false } = {}) {
  if (!heroKey) return;
  try {
    const all = getAllHeroRecords();
    const current = all[heroKey] || {
      runsPlayed: 0,
      victories: 0,
      maxKills: 0,
      bestSeconds: 0,
      bestTimeStr: '00:00'
    };

    current.runsPlayed = (current.runsPlayed || 0) + 1;
    if (isVictory) {
      current.victories = (current.victories || 0) + 1;
      current.victoriesCount = current.victories;
    }
    if (kills > (current.maxKills || 0)) {
      current.maxKills = kills;
    }
    if (seconds > (current.bestSeconds || 0)) {
      current.bestSeconds = seconds;
      current.bestTimeStr = timeStr;
      current.maxSurvivalSeconds = seconds;
      current.maxTimeStr = timeStr;
    }
    if (level > (current.maxLevel || 1)) current.maxLevel = level;
    if (wave > (current.highestWave || 1)) current.highestWave = wave;

    all[heroKey] = current;
    markDirty(HERO_RECORDS_STORAGE_KEY);
  } catch (e) {
    console.error('Erro ao gravar estatísticas individuais do herói:', e);
  }
}

// ============================================================================
// 3. BESTIÁRIO E REGISTRO DE ABATES (ZERO I/O NO HOT PATH)
// ============================================================================

export function getBestiaryStats() {
  ensureStoreInitialized();
  return store.bestiary;
}

export function saveBestiaryStats(stats) {
  ensureStoreInitialized();
  store.bestiary = stats;
  markDirty(BESTIARY_STORAGE_KEY);
}

/**
 * Incrementa o abate de criatura no In-Memory Store.
 * Elimina 100% de JSON.parse / JSON.stringify / localStorage a cada monstro morto!
 */
export function recordCreatureKill(creatureId) {
  if (!creatureId) return;
  ensureStoreInitialized();
  const prevCount = store.bestiary[creatureId] || 0;
  store.bestiary[creatureId] = prevCount + 1;
  markDirty(BESTIARY_STORAGE_KEY);
  return store.bestiary[creatureId];
}

export function getCreatureKills(creatureId) {
  ensureStoreInitialized();
  return store.bestiary[creatureId] || 0;
}

export function isCreatureDiscovered(creatureId) {
  return getCreatureKills(creatureId) > 0;
}

export function isLoreUnlocked(creature) {
  const kills = getCreatureKills(creature.id);
  if (creature.category === 'BOSS') return kills >= 1;
  if (creature.category === 'MINIBOSS') return kills >= 1;
  return kills >= 10;
}

export function unlockAllBestiary() {
  ensureStoreInitialized();
  BESTIARY_ENTRIES.forEach(entry => {
    store.bestiary[entry.id] = 100;
  });
  markDirty(BESTIARY_STORAGE_KEY);
  try {
    playSfx('chest_rare');
    triggerHaptic('heavy');
  } catch (e) {}
  return true;
}

export function resetBestiary() {
  ensureStoreInitialized();
  store.bestiary = {};
  markDirty(BESTIARY_STORAGE_KEY);
  try {
    localStorage.removeItem(BESTIARY_STORAGE_KEY);
    localStorage.removeItem(SEEN_BESTIARY_STORAGE_KEY);
    playSfx('hit');
    triggerHaptic('light');
  } catch (e) {}
  return true;
}

// ============================================================================
// 4. SINALIZADORES DE NOTIFICAÇÃO NAS RELÍQUIAS (NOTIFICATION PIPS)
// ============================================================================

export const SEEN_BESTIARY_STORAGE_KEY = 'hord_bestiary_seen_v1';
export const SEEN_ACHIEVEMENTS_STORAGE_KEY = 'hord_achievements_seen_v1';

export function getUnseenDiscoveredCreaturesCount() {
  ensureStoreInitialized();
  let seen = [];
  try {
    const raw = localStorage.getItem(SEEN_BESTIARY_STORAGE_KEY);
    seen = raw ? (JSON.parse(raw) || []) : [];
  } catch (e) {
    seen = [];
  }

  const discovered = BESTIARY_ENTRIES.filter(entry => isCreatureDiscovered(entry.id));
  const unseen = discovered.filter(entry => !seen.includes(entry.id));
  return unseen.length;
}

export function markDiscoveredCreaturesAsSeen() {
  try {
    const discoveredIds = BESTIARY_ENTRIES
      .filter(entry => isCreatureDiscovered(entry.id))
      .map(entry => entry.id);
    localStorage.setItem(SEEN_BESTIARY_STORAGE_KEY, JSON.stringify(discoveredIds));
  } catch (e) {
    console.warn('Erro ao salvar criaturas visualizadas no Bestiário:', e);
  }
}

export function getUnseenUnlockedAchievementsCount() {
  ensureStoreInitialized();
  let seen = [];
  try {
    const raw = localStorage.getItem(SEEN_ACHIEVEMENTS_STORAGE_KEY);
    seen = raw ? (JSON.parse(raw) || []) : [];
  } catch (e) {
    seen = [];
  }

  const unlocked = getUnlockedAchievementIds();
  const unseen = unlocked.filter(id => !seen.includes(id));
  return unseen.length;
}

export function markUnlockedAchievementsAsSeen() {
  try {
    const unlocked = getUnlockedAchievementIds();
    localStorage.setItem(SEEN_ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(unlocked));
  } catch (e) {
    console.warn('Erro ao salvar conquistas visualizadas:', e);
  }
}

export function canAffordAnyMetaUpgrade() {
  ensureStoreInitialized();
  const gold = getPersistentGold();
  if (gold <= 0) return false;
  const levels = getMetaLevels();
  return META_TALENTS.some(talent => {
    const curLvl = levels[talent.id] || 0;
    if (curLvl >= talent.maxLvl) return false;
    if (talent.parent && (levels[talent.parent] || 0) < 1) return false;
    const cost = getMetaUpgradeCost(talent.id, curLvl);
    return gold >= cost;
  });
}

export function getAffordableMetaUpgradesCount() {
  ensureStoreInitialized();
  const gold = getPersistentGold();
  if (gold <= 0) return 0;
  const levels = getMetaLevels();
  return META_TALENTS.filter(talent => {
    const curLvl = levels[talent.id] || 0;
    if (curLvl >= talent.maxLvl) return false;
    if (talent.parent && (levels[talent.parent] || 0) < 1) return false;
    const cost = getMetaUpgradeCost(talent.id, curLvl);
    return gold >= cost;
  }).length;
}
