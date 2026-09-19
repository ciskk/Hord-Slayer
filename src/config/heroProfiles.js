/**
 * src/config/heroProfiles.js
 * Configurações visuais, cromáticas e brasões vetoriais heráldicos dos Campeões.
 * Centralizado para evitar dependências circulares entre main.js, hudController.js e modais.
 */

// Brasões Heráldicos Vetoriais dos Campeões (Geometria 24x24)
export const HERO_EMBLEMS_SVG = {
  KNIGHT: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12,1.2 13.8,4.5 10.2,4.5" fill="currentColor"/>
      <path d="M3.5 5.5l2-1h13l2 1v5.5l-2 1h-13l-2-1z" fill="currentColor" fill-opacity="0.18"/>
      <path d="M3.5 5.5l2-1h13l2 1v5.5l-2 1h-13l-2-1z"/>
      <line x1="6.5" y1="4.5" x2="6.5" y2="12"/>
      <line x1="17.5" y1="4.5" x2="17.5" y2="12"/>
      <line x1="12" y1="5.8" x2="12" y2="10.8" stroke-width="1.6"/>
      <line x1="9.5" y1="8.3" x2="14.5" y2="8.3" stroke-width="1.6"/>
      <rect x="9.8" y="12" width="4.4" height="2" rx="0.5" fill="currentColor"/>
      <line x1="12" y1="14" x2="12" y2="21.5" stroke-width="2.4"/>
      <line x1="10" y1="16.5" x2="14" y2="16.5" stroke-width="1.3"/>
      <line x1="10" y1="19" x2="14" y2="19" stroke-width="1.3"/>
      <circle cx="12" cy="22" r="1.5" fill="currentColor"/>
    </svg>
  `,
  PALADIN: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12,1.2 13.8,4.5 10.2,4.5" fill="currentColor"/>
      <path d="M3.5 5.5l2-1h13l2 1v5.5l-2 1h-13l-2-1z" fill="currentColor" fill-opacity="0.18"/>
      <path d="M3.5 5.5l2-1h13l2 1v5.5l-2 1h-13l-2-1z"/>
      <line x1="6.5" y1="4.5" x2="6.5" y2="12"/>
      <line x1="17.5" y1="4.5" x2="17.5" y2="12"/>
      <line x1="12" y1="5.8" x2="12" y2="10.8" stroke-width="1.6"/>
      <line x1="9.5" y1="8.3" x2="14.5" y2="8.3" stroke-width="1.6"/>
      <rect x="9.8" y="12" width="4.4" height="2" rx="0.5" fill="currentColor"/>
      <line x1="12" y1="14" x2="12" y2="21.5" stroke-width="2.4"/>
      <line x1="10" y1="16.5" x2="14" y2="16.5" stroke-width="1.3"/>
      <line x1="10" y1="19" x2="14" y2="19" stroke-width="1.3"/>
      <circle cx="12" cy="22" r="1.5" fill="currentColor"/>
    </svg>
  `,
  MAGE: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2v20"/>
      <circle cx="12" cy="5" r="3"/>
      <path d="M8 8c0 4 8 4 8 8"/>
      <polygon points="12,1 15,4 9,4" fill="currentColor"/>
      <path d="M7 3l2 2M17 3l-2 2"/>
    </svg>
  `,
  ARCHER: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a10 10 0 0 1 10 10"/>
      <path d="M12 22a10 10 0 0 0 10-10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <polygon points="18,8 22,12 18,16" fill="currentColor"/>
    </svg>
  `,
  ROGUE: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="21,3 12.5,8.5 15.5,11.5" fill="currentColor" fill-opacity="0.25"/>
      <polygon points="21,3 12.5,8.5 15.5,11.5"/>
      <line x1="20" y1="4" x2="14" y2="10" stroke-width="1.2"/>
      <line x1="10.8" y1="6.8" x2="17.2" y2="13.2" stroke-width="2"/>
      <line x1="14" y1="10" x2="6.5" y2="17.5" stroke-width="2.2"/>
      <circle cx="5.5" cy="18.5" r="1.5" fill="currentColor"/>

      <polygon points="3,3 11.5,8.5 8.5,11.5" fill="currentColor" fill-opacity="0.25"/>
      <polygon points="3,3 11.5,8.5 8.5,11.5"/>
      <line x1="4" y1="4" x2="10" y2="10" stroke-width="1.2"/>
      <line x1="13.2" y1="6.8" x2="6.8" y2="13.2" stroke-width="2"/>
      <line x1="10" y1="10" x2="17.5" y2="17.5" stroke-width="2.2"/>
      <circle cx="18.5" cy="18.5" r="1.5" fill="currentColor"/>

      <circle cx="12" cy="3.5" r="0.9" fill="currentColor"/>
      <circle cx="12" cy="20.5" r="0.9" fill="currentColor"/>
    </svg>
  `,
  WARRIOR: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="21,3 12.5,8.5 15.5,11.5" fill="currentColor" fill-opacity="0.25"/>
      <polygon points="21,3 12.5,8.5 15.5,11.5"/>
      <line x1="20" y1="4" x2="14" y2="10" stroke-width="1.2"/>
      <line x1="10.8" y1="6.8" x2="17.2" y2="13.2" stroke-width="2"/>
      <line x1="14" y1="10" x2="6.5" y2="17.5" stroke-width="2.2"/>
      <circle cx="5.5" cy="18.5" r="1.5" fill="currentColor"/>

      <polygon points="3,3 11.5,8.5 8.5,11.5" fill="currentColor" fill-opacity="0.25"/>
      <polygon points="3,3 11.5,8.5 8.5,11.5"/>
      <line x1="4" y1="4" x2="10" y2="10" stroke-width="1.2"/>
      <line x1="13.2" y1="6.8" x2="6.8" y2="13.2" stroke-width="2"/>
      <line x1="10" y1="10" x2="17.5" y2="17.5" stroke-width="2.2"/>
      <circle cx="18.5" cy="18.5" r="1.5" fill="currentColor"/>

      <circle cx="12" cy="3.5" r="0.9" fill="currentColor"/>
      <circle cx="12" cy="20.5" r="0.9" fill="currentColor"/>
    </svg>
  `,
  BARBARIAN: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12,1.2 13.8,4.5 10.2,4.5" fill="currentColor"/>
      <path d="M10.5 5.5C7.5 4.8 4.5 4.2 2.5 3.5c-1.2 3.2-1.2 6.8 0 10 2-.7 5-1.3 8-2z" fill="currentColor" fill-opacity="0.22"/>
      <path d="M10.5 5.5C7.5 4.8 4.5 4.2 2.5 3.5c-1.2 3.2-1.2 6.8 0 10 2-.7 5-1.3 8-2z"/>
      <path d="M13.5 5.5C16.5 4.8 19.5 4.2 21.5 3.5c1.2 3.2 1.2 6.8 0 10-2-.7-5-1.3-8-2z" fill="currentColor" fill-opacity="0.22"/>
      <path d="M13.5 5.5C16.5 4.8 19.5 4.2 21.5 3.5c1.2 3.2 1.2 6.8 0 10-2-.7-5-1.3-8-2z"/>
      <rect x="9.8" y="5.2" width="4.4" height="6.3" rx="0.6" fill="currentColor"/>
      <line x1="12" y1="11.5" x2="12" y2="21.5" stroke-width="2.4"/>
      <line x1="10" y1="14" x2="14" y2="16.5" stroke-width="1.3"/>
      <line x1="14" y1="14" x2="10" y2="16.5" stroke-width="1.3"/>
      <line x1="10" y1="17.5" x2="14" y2="20" stroke-width="1.3"/>
      <line x1="14" y1="17.5" x2="10" y2="20" stroke-width="1.3"/>
      <polygon points="12,23.5 10.2,21.5 13.8,21.5" fill="currentColor"/>
    </svg>
  `,
  ALCHEMIST: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 3h6"/>
      <line x1="10" y1="3" x2="10" y2="7"/>
      <line x1="14" y1="3" x2="14" y2="7"/>
      <path d="M10 7L5 18a2.5 2.5 0 0 0 2.2 3.5h9.6a2.5 2.5 0 0 0 2.2-3.5L14 7"/>
      <path d="M7 15c2.5-1.2 7.5-1.2 10 0" stroke-opacity="0.8"/>
      <circle cx="10" cy="18" r="1.2" fill="currentColor"/>
      <circle cx="14.5" cy="16.5" r="0.8" fill="currentColor"/>
      <circle cx="12" cy="13.5" r="0.9" fill="currentColor"/>
    </svg>
  `,
  WARLOCK: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  `
};

// Configuração Cromática e Valores Numéricos de Medidores (0 a 5)
export const CHARACTER_PROFILES = {
  KNIGHT: {
    themeColor: '#f1c40f',
    emblemSvg: HERO_EMBLEMS_SVG.PALADIN,
    weaponName: 'Martelo Sagrado',
    levels: { dano: 3, area: 4, vel: 1, res: 5 }
  },
  PALADIN: {
    themeColor: '#f1c40f',
    emblemSvg: HERO_EMBLEMS_SVG.PALADIN,
    weaponName: 'Martelo dos Titãs',
    levels: { dano: 3, area: 4, vel: 1, res: 5 }
  },
  MAGE: {
    themeColor: '#ff7675',
    emblemSvg: HERO_EMBLEMS_SVG.MAGE,
    weaponName: 'Cajado da Tormenta',
    levels: { dano: 5, area: 3, vel: 3, res: 2 }
  },
  ARCHER: {
    themeColor: '#2ecc71',
    emblemSvg: HERO_EMBLEMS_SVG.ARCHER,
    weaponName: 'Arco Élfico',
    levels: { dano: 4, area: 2, vel: 5, res: 2 }
  },
  ROGUE: {
    themeColor: '#00cec9',
    emblemSvg: HERO_EMBLEMS_SVG.ROGUE,
    weaponName: 'Lâminas Espirituais',
    levels: { dano: 4, area: 2, vel: 5, res: 2 }
  },
  WARRIOR: {
    themeColor: '#00cec9',
    emblemSvg: HERO_EMBLEMS_SVG.ROGUE,
    weaponName: 'Lâminas Espectrais',
    levels: { dano: 4, area: 2, vel: 5, res: 2 }
  },
  BARBARIAN: {
    themeColor: '#e74c3c',
    emblemSvg: HERO_EMBLEMS_SVG.BARBARIAN,
    weaponName: 'Machado Orbital',
    levels: { dano: 5, area: 4, vel: 2, res: 4 }
  },
  ALCHEMIST: {
    themeColor: '#2ecc71',
    emblemSvg: HERO_EMBLEMS_SVG.ALCHEMIST,
    weaponName: 'Frascos Cáusticos',
    levels: { dano: 3, area: 5, vel: 3, res: 2 }
  },
  WARLOCK: {
    themeColor: '#9b59b6',
    emblemSvg: HERO_EMBLEMS_SVG.WARLOCK,
    weaponName: 'Grimório Sombrio',
    levels: { dano: 5, area: 4, vel: 2, res: 2 }
  }
};
