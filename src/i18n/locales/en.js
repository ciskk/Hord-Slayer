import content from './en/content.js';
import characterSelect from './en/characterSelect.js';
import match from './en/match.js';
export default Object.freeze({
  ...match,
  ...characterSelect,
  ...content,
  'settings.language.label': 'Language',
  'settings.language.ariaLabel': 'Select language',
  'menu.continue': 'Continue',
  'menu.playAgain': 'Play again',
  'common.close': 'Close',
  'common.back': 'Back',
  'hud.health.label': 'Health',
  'hud.pause.ariaLabel': 'Pause battle',
  'hud.pause.tooltip': 'Pause battle [{key}]',
  'controls.space': 'Space',
  'wave.title': 'Wave {number}',
  'bestiary.kills.one': '{count} kill',
  'bestiary.kills.other': '{count} kills',
  'results.death.defeatedBy': 'Fell to {enemy}'
});
