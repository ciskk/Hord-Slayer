/**
 * src/systems/progression.js
 * Subsistema Unificado de Meta-Progressão, Estatísticas, Conquistas e Bestiário.
 * Centraliza toda a persistência (localStorage) e regras de progressão permanente.
 */

import { playSfx, triggerHaptic } from '../core/audio.js';
import { META_TALENTS } from '../config/talents.js';
import { ACHIEVEMENTS, HERO_UNLOCK_MAP } from '../config/achievements.js';
import { BESTIARY_ENTRIES } from '../config/bestiary.js';

// Chaves de Persistência no LocalStorage
const GOLD_KEY = 'hord_persistent_gold_v1';
const META_KEY = 'hord_meta_tree_v1';
const ACHIEVEMENTS_STORAGE_KEY = 'hord_achievements_v2';
const STATS_STORAGE_KEY = 'hord_stats_v2';
export const BEST_RUN_STORAGE_KEY = 'hord_best_run_v1';
export const HERO_RECORDS_STORAGE_KEY = 'hord_hero_records_v2';
const BESTIARY_STORAGE_KEY = 'hord_bestiary_v1';

// ============================================================================
// 1. OURO E META-TALENTOS PERMANENTES
// ============================================================================

export function getPersistentGold() {
  try {
    return parseInt(localStorage.getItem(GOLD_KEY) || '0', 10);
  } catch (e) {
    return 0;
  }
}

export function addPersistentGold(amount) {
  const current = getPersistentGold();
  let finalAmount = amount;
  // Bônus do multiplicador de ouro se player estiver ativo
  if (amount > 0 && typeof window !== 'undefined' && window.player && window.player.goldMultiplier) {
    finalAmount = Math.round(amount * window.player.goldMultiplier);
  }
  const next = Math.max(0, current + finalAmount);
  try {
    localStorage.setItem(GOLD_KEY, next.toString());
  } catch (e) {}
  return next;
}

export function getMetaLevels() {
  try {
    const raw = localStorage.getItem(META_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const result = {};
    META_TALENTS.forEach(t => {
      result[t.id] = (typeof parsed[t.id] === 'number') ? parsed[t.id] : 0;
    });
    return result;
  } catch (e) {
    const result = {};
    META_TALENTS.forEach(t => { result[t.id] = 0; });
    return result;
  }
}

export function saveMetaLevels(levels) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(levels));
  } catch (e) {}
}

export function getMetaUpgradeCost(talentId, currentLevel) {
  const talent = META_TALENTS.find(t => t.id === talentId);
  if (!talent) return 999999;
  return Math.floor(talent.costBase * Math.pow(talent.costScale, currentLevel));
}

export function buyMetaUpgrade(talentId) {
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
  const levels = getMetaLevels();
  let refund = 0;
  META_TALENTS.forEach(t => {
    const lvl = levels[t.id] || 0;
    for (let l = 0; l < lvl; l++) {
      refund += Math.floor(t.costBase * Math.pow(t.costScale, l));
    }
    levels[t.id] = 0;
  });
  saveMetaLevels(levels);
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

export function getLifetimeStats() {
  const defaultStats = {
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

  try {
    let raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) {
      const v1 = localStorage.getItem('hord_stats_v1');
      if (v1) {
        try {
          const parsedV1 = JSON.parse(v1);
          return {
            ...defaultStats,
            totalKills: parsedV1.totalKills || 0,
            highestWave: parsedV1.highestWave || 1,
            bossesDefeated: Array.isArray(parsedV1.bossesDefeated) ? parsedV1.bossesDefeated : [],
            totalEvolutions: parsedV1.totalEvolutions || 0,
            runsPlayed: parsedV1.runsPlayed || 0
          };
        } catch (err) {}
      }
      return defaultStats;
    }
    const parsed = JSON.parse(raw);
    return {
      ...defaultStats,
      ...parsed,
      bossesDefeated: Array.isArray(parsed.bossesDefeated) ? parsed.bossesDefeated : []
    };
  } catch (e) {
    return defaultStats;
  }
}

export function saveLifetimeStats(stats) {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Erro ao salvar estatísticas:', e);
  }
}

export function getUnlockedAchievementIds() {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function saveUnlockedAchievementIds(ids) {
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Erro ao salvar conquistas:', e);
  }
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
  const progress = achievement.checkProgress(stats);

  return {
    achievement,
    isUnlocked,
    progress
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
  }

  saveLifetimeStats(stats);
  return evaluateAchievements(stats);
}

let isEvaluatingAchievements = false;

export function evaluateAchievements(stats = getLifetimeStats()) {
  // A conquista de todos os heróis consulta isHeroUnlocked, que também faz
  // avaliação retroativa. A passagem externa já registra todas as recompensas.
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
  const freshStats = {
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
  saveLifetimeStats(freshStats);
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
  try {
    const raw = localStorage.getItem(BEST_RUN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveBestRun(runData) {
  try {
    localStorage.setItem(BEST_RUN_STORAGE_KEY, JSON.stringify(runData));
  } catch (e) {
    console.error('Erro ao salvar melhor campanha:', e);
  }
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
  try {
    const raw = localStorage.getItem(HERO_RECORDS_STORAGE_KEY) || localStorage.getItem('hord_hero_records_v1');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch (e) {
    return {};
  }
}

export function getHeroRecord(heroKey) {
  if (!heroKey) return null;
  const all = getAllHeroRecords();
  const raw = all[heroKey] || {};

  const runsPlayed = Number(raw.runsPlayed) || 0;
  const victories = Number(raw.victories) || Number(raw.victoriesCount) || 0;
  const kills = Number(raw.maxKills) || 0;
  const bestSeconds = Number(raw.bestSeconds) || Number(raw.maxSurvivalSeconds) || 0;

  // Formatação consistente do tempo de sobrevivência (MM:SS)
  let timeStr = '00:00';
  if (bestSeconds > 0) {
    const m = Math.floor(bestSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(bestSeconds % 60).toString().padStart(2, '0');
    timeStr = `${m}:${s}`;
  } else if (raw.bestTimeStr || raw.maxTimeStr) {
    timeStr = raw.bestTimeStr || raw.maxTimeStr;
  }

  const unlocked = isHeroUnlocked(heroKey);

  // Status de Honra Dinâmico calculado para este campeão específico
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
    localStorage.setItem(HERO_RECORDS_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Erro ao gravar estatísticas individuais do herói:', e);
  }
}

// ============================================================================
// 3. BESTIÁRIO E REGISTRO DE ABATES
// ============================================================================

export function getBestiaryStats() {
  try {
    const raw = localStorage.getItem(BESTIARY_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (e) {
    return {};
  }
}

export function saveBestiaryStats(stats) {
  try {
    localStorage.setItem(BESTIARY_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Erro ao salvar bestiário:', e);
  }
}

export function recordCreatureKill(creatureId) {
  if (!creatureId) return;
  const stats = getBestiaryStats();
  const prevCount = stats[creatureId] || 0;
  stats[creatureId] = prevCount + 1;
  saveBestiaryStats(stats);
  return stats[creatureId];
}

export function getCreatureKills(creatureId) {
  const stats = getBestiaryStats();
  return stats[creatureId] || 0;
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
  const stats = {};
  BESTIARY_ENTRIES.forEach(entry => {
    stats[entry.id] = 100;
  });
  saveBestiaryStats(stats);
  try {
    playSfx('chest_rare');
    triggerHaptic('heavy');
  } catch (e) {}
  return true;
}

export function resetBestiary() {
  saveBestiaryStats({});
  try {
    localStorage.removeItem(BESTIARY_STORAGE_KEY);
    playSfx('hit');
    triggerHaptic('light');
  } catch (e) {}
  return true;
}
