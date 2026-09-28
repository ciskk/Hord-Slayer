/**
 * src/config/squads.js
 * Definição de Esquadrões Táticos ("Mini-Hordas") e composições mecânicas.
 * Offsets definidos em espaço local orientado ao jogador:
 * - offsetForward: distância à frente em direção ao jogador (+ vanguarda, - retaguarda)
 * - offsetLateral: distância perpendicular aos flancos (- esquerda, + direita)
 */

export const SQUAD_TYPES = {
  // 1. Falange de Cerco: Barreira de choque com fogo de cobertura (Dobrada: 12 membros)
  PHALANX: {
    key: 'PHALANX',
    name: 'Falange de Cerco',
    members: [
      { type: 'SHIELDED', offsetForward: 32, offsetLateral: -18 },
      { type: 'SHIELDED', offsetForward: 32, offsetLateral: 18 },
      { type: 'ZOMBIE',   offsetForward: 20, offsetLateral: -36 },
      { type: 'ZOMBIE',   offsetForward: 20, offsetLateral: -12 },
      { type: 'ZOMBIE',   offsetForward: 20, offsetLateral: 12 },
      { type: 'ZOMBIE',   offsetForward: 20, offsetLateral: 36 },
      { type: 'ZOMBIE',   offsetForward: 0,  offsetLateral: -52 },
      { type: 'ZOMBIE',   offsetForward: 0,  offsetLateral: -24 },
      { type: 'ZOMBIE',   offsetForward: 0,  offsetLateral: 24 },
      { type: 'ZOMBIE',   offsetForward: 0,  offsetLateral: 52 },
      { type: 'SHOOTER',  offsetForward: -36, offsetLateral: -22 },
      { type: 'SHOOTER',  offsetForward: -36, offsetLateral: 22 }
    ]
  },

  // 2. Enxame em Pinça: 20 Morcegos divididos em dois semi-arcos opostos
  SWARM_PINCER: {
    key: 'SWARM_PINCER',
    name: 'Enxame em Pinça',
    members: [
      // Pinça Flanco Esquerdo (10)
      { type: 'BAT', offsetForward: 40, offsetLateral: -35 },
      { type: 'BAT', offsetForward: 32, offsetLateral: -48 },
      { type: 'BAT', offsetForward: 22, offsetLateral: -60 },
      { type: 'BAT', offsetForward: 12, offsetLateral: -70 },
      { type: 'BAT', offsetForward: 0,  offsetLateral: -78 },
      { type: 'BAT', offsetForward: -12, offsetLateral: -70 },
      { type: 'BAT', offsetForward: -22, offsetLateral: -60 },
      { type: 'BAT', offsetForward: -32, offsetLateral: -48 },
      { type: 'BAT', offsetForward: -40, offsetLateral: -35 },
      { type: 'BAT', offsetForward: -50, offsetLateral: -20 },
      // Pinça Flanco Direito (10)
      { type: 'BAT', offsetForward: 40, offsetLateral: 35 },
      { type: 'BAT', offsetForward: 32, offsetLateral: 48 },
      { type: 'BAT', offsetForward: 22, offsetLateral: 60 },
      { type: 'BAT', offsetForward: 12, offsetLateral: 70 },
      { type: 'BAT', offsetForward: 0,  offsetLateral: 78 },
      { type: 'BAT', offsetForward: -12, offsetLateral: 70 },
      { type: 'BAT', offsetForward: -22, offsetLateral: 60 },
      { type: 'BAT', offsetForward: -32, offsetLateral: 48 },
      { type: 'BAT', offsetForward: -40, offsetLateral: 35 },
      { type: 'BAT', offsetForward: -50, offsetLateral: 20 }
    ]
  },

  // 3. Esquadrão de Ruptura: Zona de prioridade tática (Dobrada: 12 membros)
  DISRUPTION: {
    key: 'DISRUPTION',
    name: 'Esquadrão de Ruptura',
    members: [
      { type: 'EXPLODER', offsetForward: 34, offsetLateral: -18 },
      { type: 'EXPLODER', offsetForward: 34, offsetLateral: 18 },
      { type: 'ZOMBIE',   offsetForward: 18, offsetLateral: -36 },
      { type: 'ZOMBIE',   offsetForward: 18, offsetLateral: -12 },
      { type: 'ZOMBIE',   offsetForward: 18, offsetLateral: 12 },
      { type: 'ZOMBIE',   offsetForward: 18, offsetLateral: 36 },
      { type: 'SPLITTER', offsetForward: -10, offsetLateral: -45 },
      { type: 'SPLITTER', offsetForward: -10, offsetLateral: -20 },
      { type: 'SPLITTER', offsetForward: -10, offsetLateral: 20 },
      { type: 'SPLITTER', offsetForward: -10, offsetLateral: 45 },
      { type: 'SPLITTER', offsetForward: -30, offsetLateral: -22 },
      { type: 'SPLITTER', offsetForward: -30, offsetLateral: 22 }
    ]
  },

  // 4. Bateria de Cerco: Bloqueio de terreno com artilharia tática dosada (8 membros)
  SIEGE_BATTERY: {
    key: 'SIEGE_BATTERY',
    name: 'Bateria de Cerco',
    members: [
      { type: 'GOLEM',   offsetForward: 42, offsetLateral: -22 },
      { type: 'GOLEM',   offsetForward: 42, offsetLateral: 22 },
      { type: 'ZOMBIE',  offsetForward: 16, offsetLateral: -36 },
      { type: 'ZOMBIE',  offsetForward: 16, offsetLateral: 36 },
      { type: 'ZOMBIE',  offsetForward: -8, offsetLateral: 0 },
      { type: 'SHOOTER', offsetForward: -24, offsetLateral: -32 },
      { type: 'SHOOTER', offsetForward: -24, offsetLateral: 32 },
      { type: 'NECRO',   offsetForward: -48, offsetLateral: 0 }
    ]
  },

  // 5. Horda Básica de Pressão: Massa frontal e ameaça de flanco (Dobrada: 18 membros)
  HORDE_RUSH: {
    key: 'HORDE_RUSH',
    name: 'Horda de Pressão',
    members: [
      // Vanguarda Frontal
      { type: 'ZOMBIE',  offsetForward: 36, offsetLateral: -28 },
      { type: 'ZOMBIE',  offsetForward: 36, offsetLateral: -10 },
      { type: 'ZOMBIE',  offsetForward: 36, offsetLateral: 10 },
      { type: 'ZOMBIE',  offsetForward: 36, offsetLateral: 28 },
      // Corpo Central
      { type: 'ZOMBIE',  offsetForward: 16, offsetLateral: -42 },
      { type: 'ZOMBIE',  offsetForward: 16, offsetLateral: -22 },
      { type: 'ZOMBIE',  offsetForward: 16, offsetLateral: 0 },
      { type: 'ZOMBIE',  offsetForward: 16, offsetLateral: 22 },
      { type: 'ZOMBIE',  offsetForward: 16, offsetLateral: 42 },
      // Retaguarda e Apoio
      { type: 'ZOMBIE',  offsetForward: -6, offsetLateral: -32 },
      { type: 'ZOMBIE',  offsetForward: -6, offsetLateral: -12 },
      { type: 'ZOMBIE',  offsetForward: -6, offsetLateral: 12 },
      { type: 'ZOMBIE',  offsetForward: -6, offsetLateral: 32 },
      { type: 'ZOMBIE',  offsetForward: -22, offsetLateral: 0 },
      // Flancos Rápidos
      { type: 'STALKER', offsetForward: -30, offsetLateral: -42 },
      { type: 'STALKER', offsetForward: -30, offsetLateral: 42 },
      { type: 'VOID_SCAVENGER', offsetForward: -46, offsetLateral: -18 },
      { type: 'VOID_SCAVENGER', offsetForward: -46, offsetLateral: 18 }
    ]
  },

  // 6. Patrulha de Reconhecimento (Onda 1): Pressão inicial ampliada (Dobrada: 10 membros)
  HORDE_SCOUT: {
    key: 'HORDE_SCOUT',
    name: 'Patrulha de Reconhecimento',
    members: [
      { type: 'ZOMBIE',  offsetForward: 32, offsetLateral: -22 },
      { type: 'ZOMBIE',  offsetForward: 32, offsetLateral: 22 },
      { type: 'ZOMBIE',  offsetForward: 16, offsetLateral: -36 },
      { type: 'ZOMBIE',  offsetForward: 16, offsetLateral: -12 },
      { type: 'ZOMBIE',  offsetForward: 16, offsetLateral: 12 },
      { type: 'ZOMBIE',  offsetForward: 16, offsetLateral: 36 },
      { type: 'ZOMBIE',  offsetForward: -4, offsetLateral: -26 },
      { type: 'ZOMBIE',  offsetForward: -4, offsetLateral: 0 },
      { type: 'ZOMBIE',  offsetForward: -4, offsetLateral: 26 },
      { type: 'ZOMBIE',  offsetForward: -22, offsetLateral: 0 }
    ]
  },

  // 7. Pelotão de Execução: Puxão de corrente e queima tática (12 membros)
  EXECUTION_SQUAD: {
    key: 'EXECUTION_SQUAD',
    name: 'Pelotão de Execução',
    members: [
      { type: 'CHAIN_FLAYER',    offsetForward: 40, offsetLateral: -22 },
      { type: 'CHAIN_FLAYER',    offsetForward: 40, offsetLateral: 22 },
      { type: 'FORGE_PYREGUARD', offsetForward: 20, offsetLateral: -34 },
      { type: 'FORGE_PYREGUARD', offsetForward: 20, offsetLateral: 34 },
      { type: 'ZOMBIE',          offsetForward: 16, offsetLateral: -14 },
      { type: 'ZOMBIE',          offsetForward: 16, offsetLateral: 14 },
      { type: 'TRAIL_CRAWLER',   offsetForward: -8, offsetLateral: -32 },
      { type: 'TRAIL_CRAWLER',   offsetForward: -8, offsetLateral: -12 },
      { type: 'TRAIL_CRAWLER',   offsetForward: -8, offsetLateral: 12 },
      { type: 'TRAIL_CRAWLER',   offsetForward: -8, offsetLateral: 32 },
      { type: 'ZOMBIE',          offsetForward: -28, offsetLateral: -16 },
      { type: 'ZOMBIE',          offsetForward: -28, offsetLateral: 16 }
    ]
  },

  // 8. Procissão da Morte: Muralha pétrea com sino fúnebre único e suporte moderado (14 membros)
  DEATH_PROCESSION: {
    key: 'DEATH_PROCESSION',
    name: 'Procissão da Morte',
    members: [
      { type: 'BASALT_GARGOYLE',  offsetForward: 44, offsetLateral: -38 },
      { type: 'BASALT_GARGOYLE',  offsetForward: 44, offsetLateral: -14 },
      { type: 'BASALT_GARGOYLE',  offsetForward: 44, offsetLateral: 14 },
      { type: 'BASALT_GARGOYLE',  offsetForward: 44, offsetLateral: 38 },
      { type: 'GOLEM',            offsetForward: 26, offsetLateral: -22 },
      { type: 'GOLEM',            offsetForward: 26, offsetLateral: 22 },
      { type: 'ZOMBIE',           offsetForward: 10, offsetLateral: -24 },
      { type: 'ZOMBIE',           offsetForward: 10, offsetLateral: 24 },
      { type: 'TOLL_BELLRINGER',   offsetForward: -8, offsetLateral: 0 },
      { type: 'PLAGUE_APOTHECARY', offsetForward: -30, offsetLateral: -26 },
      { type: 'PLAGUE_APOTHECARY', offsetForward: -30, offsetLateral: 26 },
      { type: 'ZOMBIE',           offsetForward: -36, offsetLateral: -12 },
      { type: 'ZOMBIE',           offsetForward: -36, offsetLateral: 12 },
      { type: 'RUNE_SCRIBE',      offsetForward: -50, offsetLateral: 0 }
    ]
  },

  // 9. Cerco Balístico de Éter: Enxame aéreo com artilharia sniper dosada (10 membros)
  SNIPER_PINCER: {
    key: 'SNIPER_PINCER',
    name: 'Cerco Balístico',
    members: [
      { type: 'BAT',            offsetForward: 36, offsetLateral: -48 },
      { type: 'BAT',            offsetForward: 36, offsetLateral: 48 },
      { type: 'BAT',            offsetForward: 22, offsetLateral: -32 },
      { type: 'BAT',            offsetForward: 22, offsetLateral: 32 },
      { type: 'BAT',            offsetForward: 8,  offsetLateral: -54 },
      { type: 'BAT',            offsetForward: 8,  offsetLateral: 54 },
      { type: 'BAT',            offsetForward: -12, offsetLateral: 0 },
      { type: 'CRYPT_WEAVER',   offsetForward: 10, offsetLateral: 0 },
      { type: 'SNIPER_CULTIST', offsetForward: -44, offsetLateral: -36 },
      { type: 'SNIPER_CULTIST', offsetForward: -44, offsetLateral: 36 }
    ]
  },

  // 10. Confraria das Sombras: Ilusionismo e cavalaria dosada (13 membros)
  AMBUSH_COVEN: {
    key: 'AMBUSH_COVEN',
    name: 'Confraria das Sombras',
    members: [
      { type: 'DULLAHAN_VANGUARD', offsetForward: 48, offsetLateral: -22 },
      { type: 'DULLAHAN_VANGUARD', offsetForward: 48, offsetLateral: 22 },
      { type: 'MIRROR_BANSHEE',    offsetForward: 22, offsetLateral: -36 },
      { type: 'MIRROR_BANSHEE',    offsetForward: 22, offsetLateral: 36 },
      { type: 'ZOMBIE',            offsetForward: 12, offsetLateral: -18 },
      { type: 'ZOMBIE',            offsetForward: 12, offsetLateral: 18 },
      { type: 'MAIDEN_THORNS',     offsetForward: -4, offsetLateral: -32 },
      { type: 'MAIDEN_THORNS',     offsetForward: -4, offsetLateral: -12 },
      { type: 'MAIDEN_THORNS',     offsetForward: -4, offsetLateral: 12 },
      { type: 'MAIDEN_THORNS',     offsetForward: -4, offsetLateral: 32 },
      { type: 'GRAVE_GORGON',      offsetForward: -30, offsetLateral: -22 },
      { type: 'GRAVE_GORGON',      offsetForward: -30, offsetLateral: 22 },
      { type: 'CURSED_CHEST',      offsetForward: -50, offsetLateral: 0 }
    ]
  }
};

export function getSquadDefinition(squadKey) {
  return SQUAD_TYPES[squadKey] || null;
}