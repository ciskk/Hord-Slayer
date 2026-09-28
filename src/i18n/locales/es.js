import content from './es/content.js';
import characterSelect from './es/characterSelect.js';
import match from './es/match.js';
export default Object.freeze({
  ...match,
  ...characterSelect,
  ...content,
  'settings.language.label': 'Idioma',
  'settings.language.ariaLabel': 'Seleccionar idioma',
  'menu.continue': 'Continuar',
  'menu.playAgain': 'Jugar de nuevo',
  'common.close': 'Cerrar',
  'common.back': 'Volver',
  'hud.health.label': 'Vida',
  'hud.pause.ariaLabel': 'Pausar batalla',
  'hud.pause.tooltip': 'Pausar batalla [{key}]',
  'controls.space': 'Espacio',
  'wave.title': 'Oleada {number}',
  'bestiary.kills.one': '{count} baja',
  'bestiary.kills.other': '{count} bajas',
  'results.death.defeatedBy': 'Cayó ante {enemy}'
});
