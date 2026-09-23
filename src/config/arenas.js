// A jornada avança por vitórias, independentemente da duração das ondas.
export const HORDE_REGIONS = Object.freeze(['CEMETERY', 'DESERT', 'HIGHLANDS', 'SANCTUARY']);

export function getRegionForProgress(bossesDefeated = 0) {
  const progress = Number.isFinite(bossesDefeated) ? Math.floor(bossesDefeated) : 0;
  return HORDE_REGIONS[Math.max(0, Math.min(HORDE_REGIONS.length - 1, progress))];
}

// Materiais de baixa saturação: a cor mais intensa pertence ao combate.
export const NATURAL_ARENAS = {
  CEMETERY: {
    name: 'Campos do Velho Cemitério', seed: 11, material: 'grass',
    low: [54, 69, 40], high: [83, 99, 56], soil: [115, 99, 70],
    stone: '#969487', shade: '#53584b', light: '#c0bcaa', vegetation: '#717f45',
    dust: [208, 195, 145], mist: 'rgba(177,190,157,0.025)'
  },
  VAMPIRE: {
    name: 'Pátio do Solar Abandonado', seed: 23, material: 'paving',
    low: [83, 80, 70], high: [110, 105, 90], soil: [77, 79, 52],
    stone: '#8f8b7c', shade: '#484943', light: '#b8b09b', vegetation: '#606a40',
    dust: [197, 173, 126], mist: 'rgba(128,113,94,0.025)'
  },
  DESERT: {
    name: 'Deserto das Ruínas Soterradas', seed: 37, material: 'sand',
    low: [155, 117, 70], high: [195, 157, 99], soil: [174, 131, 77],
    stone: '#b08a57', shade: '#755a3c', light: '#dec08a', vegetation: '#918353',
    dust: [236, 207, 149], mist: 'rgba(218,176,109,0.025)'
  },
  MONOLITH: {
    name: 'Cratera de Basalto', seed: 47, material: 'basalt',
    low: [60, 57, 53], high: [90, 84, 73], soil: [101, 88, 72],
    stone: '#66625b', shade: '#373937', light: '#999181', vegetation: '#797156',
    dust: [197, 148, 94], mist: 'rgba(146,125,99,0.025)'
  },
  HIGHLANDS: {
    name: 'Passo das Montanhas Cinzentas', seed: 59, material: 'scree',
    low: [76, 87, 81], high: [109, 117, 100], soil: [124, 117, 94],
    stone: '#929b96', shade: '#4d5a57', light: '#bdc4b7', vegetation: '#778267',
    dust: [191, 203, 185], mist: 'rgba(165,185,187,0.04)'
  },
  REAPER: {
    name: 'Pátio da Abadia em Ruínas', seed: 71, material: 'paving',
    low: [84, 96, 94], high: [109, 120, 115], soil: [69, 83, 67],
    stone: '#939e99', shade: '#4c5b58', light: '#bdc6ba', vegetation: '#748165',
    dust: [195, 209, 199], mist: 'rgba(162,185,185,0.045)'
  },
  SANCTUARY: {
    name: 'Ruínas do Santuário Esquecido', seed: 83, material: 'ruins',
    low: [80, 83, 85], high: [108, 111, 107], soil: [93, 88, 75],
    stone: '#95978f', shade: '#4e5454', light: '#c2c0ad', vegetation: '#77785e',
    dust: [197, 195, 200], mist: 'rgba(151,156,180,0.045)'
  }
};

// Compatibilidade com referências antigas e ferramentas de desenvolvimento.
export const ARENA_ALIASES = {
  IVORY_OSSUARY: 'CEMETERY', CRIMSON_SALT: 'DESERT',
  ECLIPSE_BASILICA: 'SANCTUARY', INDUSTRIAL: 'CEMETERY'
};

export function resolveArenaTheme(theme) {
  return ARENA_ALIASES[theme] || theme;
}
