/**
 * src/state/events.js
 * Despachante Desacoplado de Notificações, Screen Shake e Rastreamento de Causa Mortis.
 * Desacoplado de main.js para eliminar dependências circulares.
 */

export { triggerShake } from './gameState.js';
import { activeBoss } from './collections.js';


// Controle Diegético: Rastreamento Completo da Causa Mortis
export let lastAttackerName = '';
export let deathContext = {
  name: 'A Horda do Abismo',
  category: 'HORDE', // 'BOSS' | 'MINIBOSS' | 'ELITE' | 'HORDE' | 'HAZARD' | 'PROJECTILE' | 'ENVIRONMENT'
  attackName: 'Golpe Devorador',
  damage: 0,
  enemyType: null,
  color: '#e74c3c',
  tacticTip: ''
};

export function setLastAttackerInfo(info = {}) {
  if (typeof info === 'string') {
    info = { name: info };
  }
  const name = info.name || lastAttackerName || 'A Horda do Abismo';
  lastAttackerName = name;

  let category = info.category;
  if (!category) {
    if (info.isBoss || (typeof activeBoss !== 'undefined' && activeBoss && (name.includes(activeBoss.name) || name.includes('Chefe') || name.includes('Vampírico') || name.includes('Monólito') || name.includes('Soberano') || name.includes('Thanatos') || name.includes('Meteoro') || name.includes('Foice') || name.includes('Erupção') || name.includes('Tectônica')))) {
      category = 'BOSS';
    } else if (info.isMiniBoss) {
      category = 'MINIBOSS';
    } else if (info.isElite) {
      category = 'ELITE';
    } else if (name.includes('Vórtice') || name.includes('Ácido') || name.includes('Miasma') || name.includes('Poça') || name.includes('Explosão') || name.includes('Estilhaço') || name.includes('Chamas')) {
      category = 'HAZARD';
    } else if (name.includes('Projétil') || name.includes('Orbe') || name.includes('Tiro') || name.includes('Corrente')) {
      category = 'PROJECTILE';
    } else {
      category = 'HORDE';
    }
  }

  deathContext = {
    name,
    category,
    attackName: info.attackName || (category === 'BOSS' ? 'Mecânica de Chefe' : (category === 'HAZARD' ? 'Perigo Ambiental' : (category === 'PROJECTILE' ? 'Projétil Mortal' : 'Golpe Melee'))),
    damage: Math.round(info.damage || 0),
    enemyType: info.enemyType || null,
    color: info.color || (category === 'BOSS' ? '#8e44ad' : (category === 'MINIBOSS' ? '#e67e22' : (category === 'HAZARD' ? '#e74c3c' : (category === 'PROJECTILE' ? '#9b59b6' : '#c0392b')))),
    tacticTip: info.tacticTip || ''
  };
}

export function setLastAttackerName(name, options = {}) {
  const merged = (typeof name === 'object' && name !== null) ? { ...name, ...options } : { name, ...options };
  setLastAttackerInfo(merged);
}
