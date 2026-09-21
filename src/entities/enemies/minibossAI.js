/**
 * src/entities/enemies/minibossAI.js
 * 
 * Fachada de retrocompatibilidade para IA e controladores dos 16 Minibosses de Hord.io.
 * A lógica foi modularizada em arquivos atômicos por arquétipo dentro de src/entities/enemies/minibosses/.
 */
export { updateMiniBoss, MINIBOSS_HANDLERS, checkEnrage } from './minibosses/index.js';
