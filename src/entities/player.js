/**
 * src/entities/player.js
 * Fachada e orquestrador modular do Jogador.
 * Garante 100% de retrocompatibilidade com todas as importações existentes.
 */

export * from './player/player.js';
export * from './player/inventory.js';
export * from './player/weapons.js';
export { initSkillUI, updateSkillUI } from '../ui/hudController.js';
export { META_TALENTS } from '../config/talents.js';
export {
  getPersistentGold,
  addPersistentGold,
  getMetaLevels,
  saveMetaLevels,
  getMetaUpgradeCost,
  buyMetaUpgrade,
  resetMetaTree,
  getMetaBonuses
} from '../systems/progression.js';