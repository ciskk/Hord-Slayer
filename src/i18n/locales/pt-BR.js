import content from './pt-BR/content.js';
import characterSelect from './pt-BR/characterSelect.js';
// Foundation vocabulary only. Screen content is migrated in phases 3–5.
import match from './pt-BR/match.js';
export default Object.freeze({
  ...match,
  ...characterSelect,
  ...content,
  'settings.language.label': 'Idioma',
  'settings.language.ariaLabel': 'Selecionar idioma',
  'menu.continue': 'Continuar',
  'menu.playAgain': 'Jogar novamente',
  'common.close': 'Fechar',
  'common.back': 'Voltar',
  'hud.health.label': 'Vida',
  'hud.pause.ariaLabel': 'Pausar batalha',
  'hud.pause.tooltip': 'Pausar batalha [{key}]',
  'controls.space': 'Espaço',
  'wave.title': 'Onda {number}',
  'bestiary.kills.one': '{count} abate',
  'bestiary.kills.other': '{count} abates',
  'results.death.defeatedBy': 'Caiu perante {enemy}'
});
