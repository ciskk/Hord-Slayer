/**
 * src/config/achievements.js
 * Definições Declarativas das Conquistas e Requisitos de Desbloqueio.
 * Dados puros com reexportações seguras do subsistema de progressão.
 */
import { BESTIARY_ENTRIES } from './bestiary.js';
import { isHeroUnlocked, isCreatureDiscovered } from '../systems/progression.js';


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

// Reexportações de Retrocompatibilidade delegadas ao subsistema central de progressão
export {
  BEST_RUN_STORAGE_KEY,
  pendingAchievementNotifications,
  getLifetimeStats,
  saveLifetimeStats,
  getUnlockedAchievementIds,
  saveUnlockedAchievementIds,
  getAchievementsSummary,
  isHeroUnlocked,
  getAchievementStatus,
  recordRunStats,
  evaluateAchievements,
  unlockAllAchievements,
  resetAchievements,
  calculateRunScore,
  getBestRun,
  saveBestRun,
  checkAndRecordBestRun,
  getAllHeroRecords,
  getHeroRecord,
  recordHeroRunStats
} from '../systems/progression.js';
