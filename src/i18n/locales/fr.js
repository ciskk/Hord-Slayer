import content from './fr/content.js';
import characterSelect from './fr/characterSelect.js';
import match from './fr/match.js';
export default Object.freeze({
  ...match,
  ...characterSelect,
  ...content,
  'settings.language.label': 'Langue',
  'settings.language.ariaLabel': 'Choisir la langue',
  'menu.continue': 'Continuer',
  'menu.playAgain': 'Rejouer',
  'common.close': 'Fermer',
  'common.back': 'Retour',
  'hud.health.label': 'Vie',
  'hud.pause.ariaLabel': 'Mettre la bataille en pause',
  'hud.pause.tooltip': 'Mettre la bataille en pause [{key}]',
  'controls.space': 'Espace',
  'wave.title': 'Vague {number}',
  'bestiary.kills.one': '{count} ennemi vaincu',
  'bestiary.kills.other': '{count} ennemis vaincus',
  'results.death.defeatedBy': 'Est tombé face à {enemy}'
});
