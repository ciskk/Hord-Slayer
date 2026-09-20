/**
 * src/config/achievements.js
 * Sistema Central de Conquistas, Estatísticas Persistentes e Desbloqueio Progressivo de Heróis.
 */
import { playSfx, triggerHaptic } from '../core/audio.js';
import { addPersistentGold } from '../entities/player.js';
import { BESTIARY_ENTRIES, isCreatureDiscovered } from './bestiary.js';

const ACHIEVEMENTS_STORAGE_KEY = 'hord_achievements_v2';
const STATS_STORAGE_KEY = 'hord_stats_v2';
export const BEST_RUN_STORAGE_KEY = 'hord_best_run_v1';

export const HERO_UNLOCK_MAP = {
  MAGE: 'hero_ignis',
  ROGUE: 'hero_kael',
  BARBARIAN: 'hero_kragdor',
  BERSERKER: 'hero_kragdor',
  ALCHEMIST: 'hero_valeria'
};

export const ACHIEVEMENTS = [
  // ========================================================
  // 1. HERÓIS & DESPERTARES (category: "hero")
  // ========================================================
  {
    id: 'hero_ignis',
    title: "Chama Desperta",
    desc: "Derrote o Lorde Vampírico (Chefe 1) para purificar suas cinzas e despertar a Piromante Ignis.",
    category: "hero",
    tier: "HERÓICO",
    heroKey: "MAGE",
    heroTitle: "Ignis, a Piromante",
    icon: "staff",
    rewardGold: 200,
    target: 1,
    lore: "As labaredas ancestrais de Ignis foram seladas nas criptas de sangue do lorde vampiro. Ao quebrar seu coração imundo, a chama primal encontrou seu novo receptáculo.",
    tactics: "Mantenha distância das poças de sangue do Lorde Vampírico e use ataques contínuos de longo alcance para quebrar seus morcegos protetores.",
    checkProgress: (stats) => {
      const beaten = (stats.bossesDefeated || []).includes(1);
      return {
        current: beaten ? 1 : 0,
        target: 1,
        isMet: beaten,
        label: beaten ? "Derrotado" : "Pendente"
      };
    }
  },
  {
    id: 'hero_kael',
    title: "Sombra do Abismo",
    desc: "Derrote o Monólito Abissal (Chefe 2) na Caldeira Tectônica para libertar Kael, o Andarilho Sombrio.",
    category: "hero",
    tier: "HERÓICO",
    heroKey: "ROGUE",
    heroTitle: "Kael, o Andarilho Sombrio",
    icon: "sword",
    rewardGold: 350,
    target: 1,
    lore: "Aprisionado no interior de obsidiana do Monólito por eras cósmicas, Kael sussurra através das fendas da realidade, ansiando por sua lâmina etérea.",
    tactics: "O Monólito projeta ondas de choque devastadoras. Fique atento aos anéis telúricos vermelhos e circule-o em velocidade constante.",
    checkProgress: (stats) => {
      const beaten = (stats.bossesDefeated || []).includes(2);
      return {
        current: beaten ? 1 : 0,
        target: 1,
        isMet: beaten,
        label: beaten ? "Derrotado" : "Pendente"
      };
    }
  },
  {
    id: 'hero_kragdor',
    title: "Carnificina Furiosa",
    desc: "Elimine um total cumulativo de 5.000 abominações na arena para despertar a fúria de Kragdor.",
    category: "hero",
    tier: "HERÓICO",
    heroKey: "BARBARIAN",
    heroTitle: "Kragdor, o Bárbaro Furioso",
    icon: "axe",
    rewardGold: 500,
    target: 5000,
    lore: "O espírito colérico dos ermos glaciais só atende ao chamado daqueles cujo rastro de corpos sacia a sede insaciável dos machados bárbaros.",
    tactics: "Use armas com grande penetração e dano em área (como o Machado Ancestral ou a Bíblia Orbital) para ceifar hordas densas rapidamente.",
    checkProgress: (stats) => ({
      current: Math.min(5000, stats.totalKills || 0),
      target: 5000,
      isMet: (stats.totalKills || 0) >= 5000,
      label: `${(stats.totalKills || 0).toLocaleString('pt-BR')} / 5.000 Abates`
    })
  },
  {
    id: 'hero_valeria',
    title: "Transmutação Proibida",
    desc: "Realize 5 Fusões / Evoluções Lendárias de armas na arena para invocar Valéria, a Alquimista Cáustica.",
    category: "hero",
    tier: "HERÓICO",
    heroKey: "ALCHEMIST",
    heroTitle: "Valéria, a Alquimista Cáustica",
    icon: "potion",
    rewardGold: 500,
    target: 5,
    lore: "Mestre dos frascos de vitríolo e ácidos transmutadores, Valéria exige prova de maestria na síntese alquímica suprema dos arsenais do Éter.",
    tactics: "Maximize uma arma base no Nível 8 junto à sua passiva catalisadora e abra um baú deixado por mini-chefes para forjar a evolução.",
    checkProgress: (stats) => ({
      current: Math.min(5, stats.totalEvolutions || 0),
      target: 5,
      isMet: (stats.totalEvolutions || 0) >= 5,
      label: `${Math.min(5, stats.totalEvolutions || 0)} / 5 Fusões`
    })
  },
  {
    id: 'all_heroes_unlocked',
    title: "Panteão Consagrado",
    desc: "Desperte todos os 5 Campeões do Códice Ancestral para unir a lenda definitiva.",
    category: "hero",
    tier: "PRIMORDIAL",
    icon: "keystone",
    rewardGold: 1000,
    target: 5,
    lore: "Quando todos os heróis da luz e da escuridão convergem sob o mesmo estandarte rúnico, o Abismo silencia perante o panteão dos imortais.",
    tactics: "Conclua os feitos de derrota dos chefes 1 e 2, atinja 5.000 abates e realize 5 fusões de armas para reunir os 5 guerreiros.",
    checkProgress: () => {
      const keys = ['KNIGHT', 'MAGE', 'ROGUE', 'BARBARIAN', 'ALCHEMIST'];
      const unlockedCount = keys.filter(k => isHeroUnlocked(k)).length;
      return {
        current: unlockedCount,
        target: 5,
        isMet: unlockedCount >= 5,
        label: `${unlockedCount} / 5 Heróis Despertos`
      };
    }
  },

  // ========================================================
  // 2. COMBATE & CARNIFICINA (category: "combat")
  // ========================================================
  {
    id: 'first_blood',
    title: "Batismo de Sangue",
    desc: "Abata suas primeiras 1.000 abominações na arena.",
    category: "combat",
    tier: "HERÓICO",
    icon: "skull",
    rewardGold: 200,
    target: 1000,
    lore: "O primeiro degrau na escadaria do expurgo. O cheiro de ferro e cinzas marca o nascimento de um verdadeiro ceifador do Vazio.",
    tactics: "Foque em movimentação circular contínua nos primeiros minutos para agrupar zumbis e goblins antes de eliminá-los em bloco.",
    checkProgress: (stats) => ({
      current: Math.min(1000, stats.totalKills || 0),
      target: 1000,
      isMet: (stats.totalKills || 0) >= 1000,
      label: `${Math.min(1000, stats.totalKills || 0).toLocaleString('pt-BR')} / 1.000 Abates`
    })
  },
  {
    id: 'kills_10k',
    title: "Ceifador de Almas",
    desc: "Elimine um total cumulativo de 10.000 abominações na arena.",
    category: "combat",
    tier: "LENDÁRIO",
    icon: "blood_drop",
    rewardGold: 400,
    target: 10000,
    lore: "Dez mil almas profanadas retornaram ao pó sob teus golpes. O Códice brilha com a intensidade de uma tempestade escarlate.",
    tactics: "Use heróis com alto dano de área como Ignis ou Kragdor e priorize passivas de dano, área de efeito e cadência de ataque.",
    checkProgress: (stats) => ({
      current: Math.min(10000, stats.totalKills || 0),
      target: 10000,
      isMet: (stats.totalKills || 0) >= 10000,
      label: `${Math.min(10000, stats.totalKills || 0).toLocaleString('pt-BR')} / 10.000 Abates`
    })
  },
  {
    id: 'kills_25k',
    title: "Genocídio do Vazio",
    desc: "Elimine um total cumulativo de 25.000 abominações e monstros do Abismo.",
    category: "combat",
    tier: "PRIMORDIAL",
    icon: "execute",
    rewardGold: 800,
    target: 25000,
    lore: "As legiões do submundo aprenderam a temer teu nome. Onde pisas, apenas ossos calcinados e ecos de desespero permanecem.",
    tactics: "Acumule partidas completas alcançando ondas avançadas (Ondas 7 a 10), onde a densidade de inimigos atinge milhares por minuto.",
    checkProgress: (stats) => ({
      current: Math.min(25000, stats.totalKills || 0),
      target: 25000,
      isMet: (stats.totalKills || 0) >= 25000,
      label: `${Math.min(25000, stats.totalKills || 0).toLocaleString('pt-BR')} / 25.000 Abates`
    })
  },
  {
    id: 'single_run_kills_2k',
    title: "Frenesi da Lenda",
    desc: "Elimine 2.000 ou mais inimigos em uma única jornada de sobrevivência.",
    category: "combat",
    tier: "HERÓICO",
    icon: "wave_swords",
    rewardGold: 350,
    target: 2000,
    lore: "Uma torrente ininterrupta de carnificina em uma única descida ao inferno, provando que tua lâmina não conhece cansaço.",
    tactics: "Sobreviva até pelo menos a Onda 7 sem evitar o combate direto, atraindo as hordas colossais para dentro das suas auras de dano.",
    checkProgress: (stats) => {
      const cur = stats.singleRunMaxKills || 0;
      return {
        current: Math.min(2000, cur),
        target: 2000,
        isMet: cur >= 2000,
        label: `${Math.min(2000, cur).toLocaleString('pt-BR')} / 2.000 Abates na Run`
      };
    }
  },
  {
    id: 'survive_10m',
    title: "Baluarte Inabalável",
    desc: "Sobreviva por pelo menos 10 minutos contínuos na arena da morte.",
    category: "combat",
    tier: "HERÓICO",
    icon: "timer",
    rewardGold: 300,
    target: 600,
    lore: "Dez minutos no Vazio equivalem a dez séculos de provação. Teu pulso permaneceu firme diante do infinito escuro.",
    tactics: "Invista em passivas de regeneração de vida, armadura e velocidade para resistir ao aumento súbito de dano a partir dos 8 minutos.",
    checkProgress: (stats) => {
      const secs = stats.maxSurvivalSeconds || 0;
      const mins = Math.floor(secs / 60);
      return {
        current: Math.min(600, secs),
        target: 600,
        isMet: secs >= 600,
        label: `${mins}m / 10m de Sobrevivência`
      };
    }
  },
  {
    id: 'survive_15m',
    title: "Eternidade Sombria",
    desc: "Sobreviva por 15 minutos em uma única descida heroica ao Abismo.",
    category: "combat",
    tier: "LENDÁRIO",
    icon: "timer",
    rewardGold: 600,
    target: 900,
    lore: "Poucos mortais respiraram após quinze minutos sob o olhar dos deuses caídos. Tua carne tornou-se diamante imutável.",
    tactics: "Garanta ao menos duas armas evoluídas e o talento de cura máxima forjado no Astrolábio para sobreviver à agressão das ondas finais.",
    checkProgress: (stats) => {
      const secs = stats.maxSurvivalSeconds || 0;
      const mins = Math.floor(secs / 60);
      return {
        current: Math.min(900, secs),
        target: 900,
        isMet: secs >= 900,
        label: `${mins}m / 15m de Sobrevivência`
      };
    }
  },

  // ========================================================
  // 3. SOBERANOS & CHEFES (category: "boss")
  // ========================================================
  {
    id: 'boss_vampire',
    title: "Mártir das Sombras",
    desc: "Derrote o Lorde Vampírico (Chefe 1) e purifique o Altar da Noite.",
    category: "boss",
    tier: "HERÓICO",
    icon: "blood_drop",
    rewardGold: 250,
    target: 1,
    lore: "A realeza carmesim desmoronou em poeira quando o primeiro golpe solar perfurou o coração corrupto do lorde imortal.",
    tactics: "Fique atento ao grito do Lorde quando ele se desfaz em enxame de morcegos; mova-se em círculos amplos para desviar do mergulho.",
    checkProgress: (stats) => {
      const beaten = (stats.bossesDefeated || []).includes(1);
      return {
        current: beaten ? 1 : 0,
        target: 1,
        isMet: beaten,
        label: beaten ? "Expurgado" : "Pendente"
      };
    }
  },
  {
    id: 'boss_monolith',
    title: "Quebrador de Titãs",
    desc: "Destrua o Monólito Abissal (Chefe 2) na Caldeira Tectônica sob o tremor dos continentes.",
    category: "boss",
    tier: "HERÓICO",
    icon: "hammer",
    rewardGold: 400,
    target: 1,
    lore: "Mesmo as montanhas vivas do Vazio esfarelam-se perante a determinação inabalável de um campeão da luz.",
    tactics: "O Monólito emite estacas de pedra do solo. Não pare de correr e ataque seus flancos enquanto ele carrega o choque tectônico.",
    checkProgress: (stats) => {
      const beaten = (stats.bossesDefeated || []).includes(2);
      return {
        current: beaten ? 1 : 0,
        target: 1,
        isMet: beaten,
        label: beaten ? "Destruído" : "Pendente"
      };
    }
  },
  {
    id: 'boss_reaper',
    title: "Além do Véu",
    desc: "Sobreviva ao ceifar de Thanatos, o Ceifador Supremo (Chefe 3).",
    category: "boss",
    tier: "LENDÁRIO",
    icon: "execute",
    rewardGold: 700,
    target: 1,
    lore: "A morte em pessoa brandiu sua foice de éter negro, mas encontrou uma alma que recusou o abraço da sepultura eterna.",
    tactics: "As lâminas espectrais de Thanatos atravessam obstáculos. Mantenha distância média e use esquivas rápidas perpendiculares ao golpe.",
    checkProgress: (stats) => {
      const beaten = (stats.bossesDefeated || []).includes(3);
      return {
        current: beaten ? 1 : 0,
        target: 1,
        isMet: beaten,
        label: beaten ? "Derrotado" : "Pendente"
      };
    }
  },
  {
    id: 'abyss_conqueror',
    title: "Expurgador do Vazio",
    desc: "Derrote o Soberano do Abismo e complete a Onda 10 com Vitória Suprema Absoluta.",
    category: "boss",
    tier: "PRIMORDIAL",
    icon: "boss_crown",
    rewardGold: 1500,
    target: 1,
    lore: "O governante supremo das profundezas escuras sucumbiu. Por um instante eterno, o cosmos respirou sob uma paz imaculada.",
    tactics: "Na Onda 10, foque todo o fogo no Soberano enquanto desvia dos portais de invocação. Fusões lendárias completas são vitais aqui.",
    checkProgress: (stats) => {
      const beaten = (stats.bossesDefeated || []).includes(4);
      return {
        current: beaten ? 1 : 0,
        target: 1,
        isMet: beaten,
        label: beaten ? "Vitória Suprema" : "Pendente"
      };
    }
  },
  {
    id: 'all_bosses_slain',
    title: "Nêmesis dos Colossos",
    desc: "Derrote todos os 4 Chefes Supremos do Abismo em sua carreira de batalhas.",
    category: "boss",
    tier: "PRIMORDIAL",
    icon: "trophy",
    rewardGold: 1000,
    target: 4,
    lore: "Lorde Vampírico, Monólito Abissal, Thanatos e o Soberano do Abismo: todos jazem silenciados no mesmo monumento glorioso.",
    tactics: "Enfrente as ondas com calma e aprenda os padrões únicos de telegrafia de cada um dos quatro colossos.",
    checkProgress: (stats) => {
      const count = (stats.bossesDefeated || []).length;
      return {
        current: Math.min(4, count),
        target: 4,
        isMet: count >= 4,
        label: `${Math.min(4, count)} / 4 Chefes Derrotados`
      };
    }
  },
  {
    id: 'wave_5_reached',
    title: "Caminho Implacável",
    desc: "Rompa o cerco inicial da arena e alcance com sucesso a Onda 5.",
    category: "boss",
    tier: "HERÓICO",
    icon: "wave_swords",
    rewardGold: 250,
    target: 5,
    lore: "A metade do caminho na arena separa os tolos e audazes dos verdadeiros veteranos da guerra eterna.",
    tactics: "Mantenha seu nível acompanhando o relógio de ondas, coletando todas as gemas de experiência deixadas nos cantos da tela.",
    checkProgress: (stats) => {
      const w = stats.highestWave || 1;
      return {
        current: Math.min(5, w),
        target: 5,
        isMet: w >= 5,
        label: `Onda ${Math.min(5, w)} / 5 Alcançada`
      };
    }
  },

  // ========================================================
  // 4. ARSENAL & TRANSMUTAÇÃO (category: "arsenal")
  // ========================================================
  {
    id: 'first_evolution',
    title: "Forja do Éter",
    desc: "Realize sua primeira Fusão / Evolução Lendária de arma na arena.",
    category: "arsenal",
    tier: "HERÓICO",
    icon: "star_evolution",
    rewardGold: 200,
    target: 1,
    lore: "A matéria bruta do ferro e da pólvora transmuta-se em energia estelar quando o catalisador perfeito toca a lâmina mística.",
    tactics: "Eleve sua arma ao Nível 8 e escolha a passiva combinada indicada no códice antes de abrir um baú de chefe.",
    checkProgress: (stats) => {
      const evs = stats.totalEvolutions || 0;
      return {
        current: Math.min(1, evs),
        target: 1,
        isMet: evs >= 1,
        label: evs >= 1 ? "Forjado" : "Pendente"
      };
    }
  },
  {
    id: 'evolutions_10',
    title: "Mestre dos Elementos",
    desc: "Realize um total cumulativo de 10 Fusões Lendárias de armas na arena.",
    category: "arsenal",
    tier: "LENDÁRIO",
    icon: "transmute",
    rewardGold: 500,
    target: 10,
    lore: "Dez armas supremas nasceram sob tuas mãos alquímicas, canalizando o relâmpago, o fogo e o vazio em harmonia bélica.",
    tactics: "Experimente diferentes combinações de armas e passivas em cada partida para acelerar a contagem de transmutações.",
    checkProgress: (stats) => {
      const evs = stats.totalEvolutions || 0;
      return {
        current: Math.min(10, evs),
        target: 10,
        isMet: evs >= 10,
        label: `${Math.min(10, evs)} / 10 Fusões Realizadas`
      };
    }
  },
  {
    id: 'max_weapons_evolved',
    title: "Arsenal Perfeito",
    desc: "Conquiste 3 ou mais armas evoluídas em uma única jornada de combate.",
    category: "arsenal",
    tier: "LENDÁRIO",
    icon: "orbitals",
    rewardGold: 600,
    target: 3,
    lore: "Três constelações de poder orbitam teu guerreiro ao mesmo tempo, criando uma muralha impenetrável de aniquilação cósmica.",
    tactics: "Planeje seus slots de arma e passiva desde a Onda 1, garantindo que cada arma tenha seu par catalisador correspondente.",
    checkProgress: (stats) => {
      const cur = stats.maxEvolvedWeaponsInRun || 0;
      return {
        current: Math.min(3, cur),
        target: 3,
        isMet: cur >= 3,
        label: `${Math.min(3, cur)} / 3 Fusões na Run`
      };
    }
  },
  {
    id: 'chests_opened_15',
    title: "Caçador de Relíquias",
    desc: "Abra um total de 15 Baús Arcanos deixados pelos monstros e chefes.",
    category: "arsenal",
    tier: "HERÓICO",
    icon: "soul_coin",
    rewardGold: 300,
    target: 15,
    lore: "Baús de ferro antigo e ouro do Vazio guardam os segredos dos alquimistas que pereceram nas eras passadas.",
    tactics: "Derrote mini-chefes rapidamente para que os baús não fiquem soterrados sob massas de monstros comuns.",
    checkProgress: (stats) => {
      const ch = stats.totalChestsOpened || 0;
      return {
        current: Math.min(15, ch),
        target: 15,
        isMet: ch >= 15,
        label: `${Math.min(15, ch)} / 15 Baús Abertos`
      };
    }
  },

  // ========================================================
  // 5. CÓDICE, DESTINO & MAESTRIA (category: "mastery")
  // ========================================================
  {
    id: 'bestiary_15',
    title: "Naturalista do Oculto",
    desc: "Catalogue pelo menos 15 criaturas diferentes no Códice do Bestiário das Trevas.",
    category: "mastery",
    tier: "HERÓICO",
    icon: "scroll",
    rewardGold: 300,
    target: 15,
    lore: "Seus registros começam a preencher as páginas vazias do grimório, desmistificando as abominações da escuridão.",
    tactics: "Enfrente todas as ondas e explore diferentes estágios de combate para encontrar criaturas raras da horda.",
    checkProgress: () => {
      const disc = BESTIARY_ENTRIES.filter(c => isCreatureDiscovered(c.id)).length;
      return {
        current: Math.min(15, disc),
        target: 15,
        isMet: disc >= 15,
        label: `${Math.min(15, disc)} / 15 Criaturas Catalogadas`
      };
    }
  },
  {
    id: 'bestiary_35',
    title: "Zoólogo do Abismo",
    desc: "Catalogue 35 ou mais espécimes no Códice do Bestiário das Trevas.",
    category: "mastery",
    tier: "LENDÁRIO",
    icon: "xp_tome",
    rewardGold: 700,
    target: 35,
    lore: "Um compêndio quase absoluto sobre a ecologia profana do submundo. Teus estudos servem de farol para as gerações futuras.",
    tactics: "Sobreviva até as ondas mais profundas onde chefes supremos, colossos e enxames pesados emergem.",
    checkProgress: () => {
      const disc = BESTIARY_ENTRIES.filter(c => isCreatureDiscovered(c.id)).length;
      return {
        current: Math.min(35, disc),
        target: 35,
        isMet: disc >= 35,
        label: `${Math.min(35, disc)} / 35 Criaturas Catalogadas`
      };
    }
  },
  {
    id: 'reach_level_30',
    title: "Transcendência Arcana",
    desc: "Alcance o Nível 30 de Ascensão com seu herói em uma única partida.",
    category: "mastery",
    tier: "HERÓICO",
    icon: "sparkle",
    rewardGold: 400,
    target: 30,
    lore: "A alma do guerreiro transbordou poder divino, elevando seus atributos e sua consciência ao ápice da transcendência.",
    tactics: "Colete a passiva do Ímã para puxar todas as esferas de experiência e não deixe gemas desaparecerem fora da tela.",
    checkProgress: (stats) => {
      const lvl = stats.highestLevel || 1;
      return {
        current: Math.min(30, lvl),
        target: 30,
        isMet: lvl >= 30,
        label: `Nível ${Math.min(30, lvl)} / 30 Alcançado`
      };
    }
  },
  {
    id: 'score_100k',
    title: "Lenda Imortal",
    desc: "Registre uma Pontuação de Glória superior a 100.000 pontos no Monumento da Maior Jornada.",
    category: "mastery",
    tier: "PRIMORDIAL",
    icon: "trophy",
    rewardGold: 1200,
    target: 100000,
    lore: "O Códice eternizou teu nome em letras de ouro vivo. Teu monumento perdurará enquanto as estrelas continuarem a brilhar.",
    tactics: "Complete a Onda 10 com vitória absoluta, acumule milhares de abates e maximize o tempo e nível para atingir o score supremo.",
    checkProgress: (stats) => {
      const sc = stats.highestScore || 0;
      return {
        current: Math.min(100000, sc),
        target: 100000,
        isMet: sc >= 100000,
        label: `${Math.min(100000, sc).toLocaleString('pt-BR')} / 100.000 Pontos`
      };
    }
  }
];

// Fila de notificações pendentes para serem exibidas na UI
export const pendingAchievementNotifications = [];

/**
 * Retorna as estatísticas vitalícias da conta com campos expandidos
 */
export function getLifetimeStats() {
  const defaultStats = {
    totalKills: 0,
    highestWave: 1,
    bossesDefeated: [],
    totalEvolutions: 0,
    runsPlayed: 0,
    totalChestsOpened: 0,
    maxSurvivalSeconds: 0,
    highestLevel: 1,
    highestScore: 0,
    singleRunMaxKills: 0,
    maxEvolvedWeaponsInRun: 0
  };

  try {
    let raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) {
      const v1 = localStorage.getItem('hord_stats_v1');
      if (v1) {
        try {
          const parsedV1 = JSON.parse(v1);
          return {
            ...defaultStats,
            totalKills: parsedV1.totalKills || 0,
            highestWave: parsedV1.highestWave || 1,
            bossesDefeated: Array.isArray(parsedV1.bossesDefeated) ? parsedV1.bossesDefeated : [],
            totalEvolutions: parsedV1.totalEvolutions || 0,
            runsPlayed: parsedV1.runsPlayed || 0
          };
        } catch (err) {}
      }
      return defaultStats;
    }
    const parsed = JSON.parse(raw);
    return {
      ...defaultStats,
      ...parsed,
      bossesDefeated: Array.isArray(parsed.bossesDefeated) ? parsed.bossesDefeated : []
    };
  } catch (e) {
    return defaultStats;
  }
}

/**
 * Salva as estatísticas vitalícias
 */
export function saveLifetimeStats(stats) {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Erro ao salvar estatísticas:', e);
  }
}

/**
 * Retorna a lista de IDs de conquistas desbloqueadas
 */
export function getUnlockedAchievementIds() {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Salva os IDs de conquistas desbloqueadas
 */
export function saveUnlockedAchievementIds(ids) {
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Erro ao salvar conquistas:', e);
  }
}

/**
 * Retorna resumo agregado para os chips de metadados do cabeçalho
 */
export function getAchievementsSummary() {
  const unlockedIds = getUnlockedAchievementIds();
  const total = ACHIEVEMENTS.length;
  const unlocked = ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id)).length;
  const completionPct = total > 0 ? Math.round((unlocked / total) * 100) : 0;
  
  const totalSoulsReward = ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id))
    .reduce((sum, a) => sum + (a.rewardGold || 0), 0);

  const heroKeys = ['KNIGHT', 'MAGE', 'ROGUE', 'BARBARIAN', 'ALCHEMIST'];
  const unlockedHeroesCount = heroKeys.filter(k => isHeroUnlocked(k)).length;

  return {
    total,
    unlocked,
    completionPct,
    totalSoulsReward,
    unlockedHeroesCount
  };
}

/**
 * Verifica se um herói está desbloqueado
 * Sir Roland é sempre desbloqueado por padrão.
 */
export function isHeroUnlocked(heroKey) {
  if (heroKey === 'KNIGHT') return true;
  const achievementId = HERO_UNLOCK_MAP[heroKey];
  if (!achievementId) return false;
  const unlocked = getUnlockedAchievementIds();
  return unlocked.includes(achievementId);
}

/**
 * Retorna o progresso atual de uma conquista
 */
export function getAchievementStatus(achievementId) {
  const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!ach) return null;
  const unlocked = getUnlockedAchievementIds();
  const isCompleted = unlocked.includes(achievementId);
  const stats = getLifetimeStats();
  const progress = ach.checkProgress(stats);

  const percent = progress.target > 0 ? Math.min(100, Math.round((progress.current / progress.target) * 100)) : 100;

  return {
    ...ach,
    isCompleted,
    current: progress.current,
    target: progress.target,
    percent: isCompleted ? 100 : percent,
    label: isCompleted ? "Concluído" : progress.label
  };
}

/**
 * Registra novos dados ocorridos durante ou no término da partida
 * e avalia se novas conquistas foram desbloqueadas.
 * @param {Object} delta Dados da partida atual
 * @returns {Array} Conquistas recém-desbloqueadas
 */
export function recordRunStats(delta = {}) {
  const stats = getLifetimeStats();
  let changed = false;

  if (typeof delta.kills === 'number' && delta.kills > 0) {
    stats.totalKills += delta.kills;
    if (delta.kills > (stats.singleRunMaxKills || 0)) {
      stats.singleRunMaxKills = delta.kills;
    }
    changed = true;
  }
  if (typeof delta.wave === 'number' && delta.wave > stats.highestWave) {
    stats.highestWave = delta.wave;
    changed = true;
  }
  if (typeof delta.bossDefeated === 'number') {
    if (!stats.bossesDefeated.includes(delta.bossDefeated)) {
      stats.bossesDefeated.push(delta.bossDefeated);
      changed = true;
    }
  }
  if (delta.evolution) {
    const inc = typeof delta.evolution === 'number' ? delta.evolution : 1;
    stats.totalEvolutions = (stats.totalEvolutions || 0) + inc;
    changed = true;
  }
  if (delta.chestOpened) {
    stats.totalChestsOpened = (stats.totalChestsOpened || 0) + 1;
    changed = true;
  }
  if (typeof delta.survivalSeconds === 'number' && delta.survivalSeconds > (stats.maxSurvivalSeconds || 0)) {
    stats.maxSurvivalSeconds = delta.survivalSeconds;
    changed = true;
  }
  if (typeof delta.level === 'number' && delta.level > (stats.highestLevel || 0)) {
    stats.highestLevel = delta.level;
    changed = true;
  }
  if (typeof delta.score === 'number' && delta.score > (stats.highestScore || 0)) {
    stats.highestScore = delta.score;
    changed = true;
  }
  if (typeof delta.evolvedWeaponsCount === 'number' && delta.evolvedWeaponsCount > (stats.maxEvolvedWeaponsInRun || 0)) {
    stats.maxEvolvedWeaponsInRun = delta.evolvedWeaponsCount;
    changed = true;
  }
  if (delta.runFinished) {
    stats.runsPlayed = (stats.runsPlayed || 0) + 1;
    changed = true;
  }

  if (changed) {
    saveLifetimeStats(stats);
  }

  // Avalia conquistas pendentes
  return evaluateAchievements(stats);
}

/**
 * Avalia todas as conquistas e desbloqueia as elegíveis
 */
export function evaluateAchievements(stats = getLifetimeStats()) {
  const unlockedIds = getUnlockedAchievementIds();
  const newlyUnlocked = [];

  ACHIEVEMENTS.forEach(ach => {
    if (!unlockedIds.includes(ach.id)) {
      const prog = ach.checkProgress(stats);
      if (prog.isMet) {
        unlockedIds.push(ach.id);
        newlyUnlocked.push(ach);

        if (ach.rewardGold > 0) {
          addPersistentGold(ach.rewardGold);
        }

        pendingAchievementNotifications.push(ach);
      }
    }
  });

  if (newlyUnlocked.length > 0) {
    saveUnlockedAchievementIds(unlockedIds);
    try {
      playSfx('chest_rare');
      triggerHaptic('heavy');
    } catch (e) {}
  }

  return newlyUnlocked;
}

/**
 * DESBLOQUEAR TODOS OS HERÓIS E CONQUISTAS (Requisito Obrigatório DevTools W + 5)
 */
export function unlockAllAchievements() {
  const allIds = ACHIEVEMENTS.map(a => a.id);
  saveUnlockedAchievementIds(allIds);

  const stats = getLifetimeStats();
  stats.highestWave = 10;
  stats.bossesDefeated = [1, 2, 3, 4];
  stats.totalKills = Math.max(stats.totalKills, 30000);
  stats.singleRunMaxKills = Math.max(stats.singleRunMaxKills || 0, 3000);
  stats.totalEvolutions = Math.max(stats.totalEvolutions, 15);
  stats.maxEvolvedWeaponsInRun = Math.max(stats.maxEvolvedWeaponsInRun || 0, 4);
  stats.totalChestsOpened = Math.max(stats.totalChestsOpened || 0, 20);
  stats.maxSurvivalSeconds = Math.max(stats.maxSurvivalSeconds || 0, 1200);
  stats.highestLevel = Math.max(stats.highestLevel || 1, 40);
  stats.highestScore = Math.max(stats.highestScore || 0, 150000);
  saveLifetimeStats(stats);

  try {
    playSfx('chest_rare');
    triggerHaptic('heavy');
  } catch (e) {}

  return allIds.length;
}

/**
 * RESETAR CONQUISTAS E BLOQUEAR HERÓIS (Volta ao estado de jogador novo)
 */
export function resetAchievements() {
  saveUnlockedAchievementIds([]);
  const stats = {
    totalKills: 0,
    highestWave: 1,
    bossesDefeated: [],
    totalEvolutions: 0,
    runsPlayed: 0,
    totalChestsOpened: 0,
    maxSurvivalSeconds: 0,
    highestLevel: 1,
    highestScore: 0,
    singleRunMaxKills: 0,
    maxEvolvedWeaponsInRun: 0
  };
  saveLifetimeStats(stats);
  pendingAchievementNotifications.length = 0;

  try {
    localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
    localStorage.removeItem(BEST_RUN_STORAGE_KEY);
    localStorage.removeItem(HERO_RECORDS_STORAGE_KEY);
    localStorage.removeItem('hord_achievements_v1');
    localStorage.removeItem('hord_stats_v1');
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {}

  try {
    playSfx('hit');
    triggerHaptic('light');
  } catch (e) {}

  return true;
}


// ========================================================
// RECORDE HISTÓRICO: MONUMENTO À MAIOR JORNADA (MELHOR RUN)
// ========================================================

/**
 * Calcula a Pontuação Composta de Glória para uma run
 */
export function calculateRunScore(runData = {}) {
  const baseWave = (Number(runData.wave) || 1) * 10000;
  const victoryBonus = runData.isVictory ? 50000 : 0;
  const killsBonus = (Number(runData.kills) || 0) * 10;
  const timeBonus = (Number(runData.seconds) || 0) * 20;
  const levelBonus = (Number(runData.level) || 1) * 500;
  return baseWave + victoryBonus + killsBonus + timeBonus + levelBonus;
}

/**
 * Retorna a melhor run salva no perfil do jogador
 * @returns {Object|null}
 */
export function getBestRun() {
  try {
    const raw = localStorage.getItem(BEST_RUN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

/**
 * Salva explicitamente os dados da melhor run
 */
export function saveBestRun(runData) {
  try {
    localStorage.setItem(BEST_RUN_STORAGE_KEY, JSON.stringify(runData));
  } catch (e) {
    console.error('Erro ao salvar melhor run:', e);
  }
}

/**
 * Avalia se a run finalizada bateu o recorde histórico e, em caso afirmativo, salva como novo recorde.
 * @param {Object} runData
 * @returns {{ isNewRecord: boolean, bestRun: Object }}
 */
export function checkAndRecordBestRun(runData = {}) {
  const score = calculateRunScore(runData);
  const currentBest = getBestRun();

  const formattedRun = {
    heroKey: runData.heroKey || 'KNIGHT',
    heroName: runData.heroName || 'Sir Roland',
    heroTitle: runData.heroTitle || 'O Paladino',
    isVictory: !!runData.isVictory,
    wave: Number(runData.wave) || 1,
    waveText: runData.waveText || `Onda ${runData.wave || 1}`,
    time: runData.time || '00:00',
    seconds: Number(runData.seconds) || 0,
    kills: Number(runData.kills) || 0,
    level: Number(runData.level) || 1,
    souls: Number(runData.souls) || 0,
    score,
    date: runData.date || new Date().toLocaleDateString('pt-BR'),
    weapons: Array.isArray(runData.weapons) ? runData.weapons : [],
    passives: Array.isArray(runData.passives) ? runData.passives : [],
    verdictTitle: runData.verdictTitle || (runData.isVictory ? 'VITÓRIA SUPREMA ABSOLUTA' : 'ÚLTIMO SUSPIRO NA ARENA'),
    verdictSub: runData.verdictSub || ''
  };

  if (!currentBest || score > (currentBest.score || 0)) {
    saveBestRun(formattedRun);
    return { isNewRecord: true, bestRun: formattedRun };
  }

  return { isNewRecord: false, bestRun: currentBest };
}

// ========================================================
// REGISTROS DE BATALHA INDIVIDUAIS E PERSISTENTES POR HERÓI
// ========================================================

export const HERO_RECORDS_STORAGE_KEY = 'hord_hero_records_v2';

/**
 * Retorna todos os registros individuais dos heróis
 * @returns {Record<string, Object>}
 */
export function getAllHeroRecords() {
  try {
    const raw = localStorage.getItem(HERO_RECORDS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch (e) {
    return {};
  }
}

/**
 * Retorna as estatísticas exclusivas de um herói específico
 * @param {string} heroKey Identificador do herói (ex: 'KNIGHT', 'MAGE')
 * @returns {Object} Dados de combate individuais e status
 */
export function getHeroRecord(heroKey) {
  if (!heroKey) return null;
  const all = getAllHeroRecords();
  const raw = all[heroKey] || {};

  const runsPlayed = Number(raw.runsPlayed) || 0;
  const victories = Number(raw.victories) || 0;
  const kills = Number(raw.maxKills) || 0;
  const bestSeconds = Number(raw.bestSeconds) || 0;

  // Formatação consistente do tempo de sobrevivência (MM:SS)
  let timeStr = '00:00';
  if (bestSeconds > 0) {
    const m = Math.floor(bestSeconds / 60).toString().padStart(2, '0');
    const s = Math.floor(bestSeconds % 60).toString().padStart(2, '0');
    timeStr = `${m}:${s}`;
  } else if (raw.bestTimeStr) {
    timeStr = raw.bestTimeStr;
  }

  const unlocked = isHeroUnlocked(heroKey);

  // Status de Honra Dinâmico calculado para este campeão específico
  let statusLabel = 'DESPERTO';
  let statusClass = 'status-awake';

  if (!unlocked) {
    statusLabel = 'BLOQUEADO';
    statusClass = 'status-locked';
  } else if (victories > 0) {
    statusLabel = victories >= 3 ? 'LENDÁRIO' : 'VITORIOSO';
    statusClass = 'status-victorious';
  } else if (bestSeconds >= 600) {
    statusLabel = 'CONSAGRADO';
    statusClass = 'status-consecrated';
  } else if (bestSeconds >= 300) {
    statusLabel = 'VETERANO';
    statusClass = 'status-veteran';
  } else if (runsPlayed > 0) {
    statusLabel = 'COMBATENTE';
    statusClass = 'status-fighter';
  } else {
    statusLabel = 'DESPERTO';
    statusClass = 'status-awake';
  }

  return {
    heroKey,
    unlocked,
    runsPlayed,
    victories,
    kills,
    bestSeconds,
    timeStr,
    statusLabel,
    statusClass
  };
}

/**
 * Registra o resultado de uma partida para um herói individualmente
 * @param {string} heroKey Identificador do herói
 * @param {{ seconds: number, timeStr: string, kills: number, isVictory: boolean }} runData
 */
export function recordHeroRunStats(heroKey, { seconds = 0, timeStr = '00:00', kills = 0, isVictory = false } = {}) {
  if (!heroKey) return;
  try {
    const all = getAllHeroRecords();
    const current = all[heroKey] || {
      runsPlayed: 0,
      victories: 0,
      maxKills: 0,
      bestSeconds: 0,
      bestTimeStr: '00:00'
    };

    current.runsPlayed = (current.runsPlayed || 0) + 1;
    if (isVictory) {
      current.victories = (current.victories || 0) + 1;
    }
    if (kills > (current.maxKills || 0)) {
      current.maxKills = kills;
    }
    if (seconds > (current.bestSeconds || 0)) {
      current.bestSeconds = seconds;
      current.bestTimeStr = timeStr;
    }

    all[heroKey] = current;
    localStorage.setItem(HERO_RECORDS_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Erro ao gravar estatísticas individuais do herói:', e);
  }
}
