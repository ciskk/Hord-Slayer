import { t, formatNumber } from './index.js';
import { escapeHtml } from './dom.js';

// Presentation copies keep translated strings out of combat definitions and saves.
export function getHeroPresentation(key, definition, { html = false } = {}) {
  const text = value => html ? escapeHtml(value) : value;
  const field = name => text(t(`heroes.${key}.${name}`));
  return {
    ...definition,
    name: text(definition.name),
    title: field('title'), role: field('role'), lore: field('lore'),
    weapon: { ...definition.weapon, name: field('weapon.name'), type: field('weapon.type'), desc: field('weapon.description') },
    passive: { ...definition.passive, name: field('passive.name'), desc: field('passive.description') },
    skill: {
      ...definition.skill, name: field('skill.name'), desc: field('skill.description'),
      cooldown: text(t('characterSelect.cooldown', { seconds: formatNumber(parseFloat(definition.skill.cooldown), { maximumFractionDigits: 1 }) }))
    }
  };
}

export function getUnlockPresentation(id, status, { html = false } = {}) {
  if (!status) return null;
  const text = value => html ? escapeHtml(value) : value;
  return {
    ...status,
    title: text(t(`achievements.${id}.title`)),
    desc: text(t(`achievements.${id}.description`, { target: status.target }))
  };
}

export function getHeroStatusLabel(record) {
  const status = !record.unlocked ? 'locked'
    : record.victories > 0 ? (record.victories >= 3 ? 'legendary' : 'victorious')
      : record.bestSeconds >= 600 ? 'consecrated'
        : record.bestSeconds >= 300 ? 'veteran'
          : record.runsPlayed > 0 ? 'fighter' : 'awake';
  return t(`progression.heroStatus.${status}`);
}
