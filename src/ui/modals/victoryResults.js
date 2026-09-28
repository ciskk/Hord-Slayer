import { t, formatNumber } from '../../i18n/index.js';
const positive = value => Number.isFinite(value) ? Math.max(0, value) : 0;

// Explicit targets, independent of lifetime upgrades or accumulated currency.
export function evaluateVictory({ kills = 0, survivalSecs = 0, evolvedCount = 0 } = {}) {
  const seconds = positive(survivalSecs);
  const killsPerMinute = seconds > 0 ? positive(kills) * 60 / seconds : 0;
  const criteria = [
    { label: 'Conquista', points: 50, max: 50, detail: 'Campanha concluída' },
    { label: 'Combate', points: Math.round(Math.min(1, killsPerMinute / 100) * 20), max: 20, detail: `${killsPerMinute.toFixed(1)} abates/min · meta: 100` },
    { label: 'Agilidade', points: seconds > 0 ? Math.round(Math.max(0, Math.min(1, (1200 - seconds) / 600)) * 20) : 0, max: 20, detail: '20 pontos até 10 min; redução linear até 0 aos 20 min' },
    { label: 'Evoluções', points: Math.min(2, Math.floor(positive(evolvedCount))) * 5, max: 10, detail: '5 pontos por arma evoluída · máximo: 10' }
  ];
  const score = criteria.reduce((sum, item) => sum + item.points, 0);
  const [grade, title, color, starCount] = score >= 95
    ? ['S+', t('match.rank.Splus'), '#ffe2a0', 5]
    : score >= 85 ? ['S', t('match.rank.S'), '#ffd166', 4]
      : score >= 70 ? ['A+', t('match.rank.Aplus'), '#7ee8cc', 3]
        : ['A', t('match.rank.A'), '#b5c8f5', 2];
  return { score, grade, title, color, criteria, stars: '★'.repeat(starCount) + '☆'.repeat(5 - starCount) };
}

export function victoryLedger(startGold, beforeBonus, afterRewards, bossBonus = 1500) {
  const collected = Math.max(0, positive(beforeBonus) - positive(startGold));
  const achievements = Math.max(0, positive(afterRewards) - positive(beforeBonus) - bossBonus);
  return { collected, achievements, bossBonus, total: collected + achievements + bossBonus };
}
