export const CHARACTERS = {
  KNIGHT: {
    name: "Sir Roland",
    title: "O Paladino",
    role: "Tanque Retaliador",
    difficulty: 1,
    lore: "Um cavaleiro consagrado nas criptas imperiais, cuja armadura abençoada repele a escuridão e castiga todo algoz que ousa feri-lo.",
    passive: {
      name: "Égide da Retaliação",
      desc: "Reduz 20% do dano corpo a corpo recebido e reflete 50% do impacto de volta aos agressores."
    },
    weapon: {
      name: "Martelo Sagrado",
      type: "Impacto Sagrado 360°",
      desc: "Esmaga o solo em rotação total, anula projéteis inimigos no raio e abre fendas incandescentes à frente."
    },
    skill: {
      name: "Investida Sagrada",
      cooldown: "7s",
      desc: "Avança em disparada rasgando hordas inteiras sob imunidade total e estilhaçando defesas."
    },
    desc: "Passiva: Reduz 20% do dano corpo a corpo e reflete 50% de volta aos monstros.<br><b>Arma Inicial: Martelo Sagrado</b> (Esmaga o solo em 360°, anula projéteis inimigos no raio e abre fendas incandescentes frontais).<br><b>Poder: Investida Sagrada</b> (Avança rasgando inimigos com imunidade).",
    color: { 
      armor: "#718093", 
      armorLight: "#dcdde1", 
      armorHighlight: "#ffffff",
      armorDark: "#2f3640", 
      trim: "#fbc531", 
      trimLight: "#ffeaa7",
      trimDark: "#c79810", 
      goldGlint: "#ffffff",
      hair: "#bdc3c7", 
      cape: "#481b6d", 
      capeInner: "#2c1045", 
      plume: "#8e44ad", 
      plumeHigh: "#a55eea",
      tabard: "#f5f6fa", 
      tabardShadow: "#dcdde1",
      tabardCross: "#c23616", 
      tabardGold: "#f1c40f",
      eyeGlow: "#00d2d3",
      hammerSteel: "#57606f",
      hammerSteelLight: "#8395a7",
      hammerGold: "#f1c40f",
      hammerGoldLight: "#ffeaa7",
      hammerRune: "#f1c40f",
      hammerRuneGlow: "#ffffff",
      hammerWood: "#3d271d",
      holyGlow: "rgba(241, 196, 15, 0.40)"
    },
    startingWeapon: "HAMMER",
    stats: { 
      hp: 175, 
      maxHp: 175, 
      speed: 3.2, 
      damage: 45, 
      auraLvl: 1, 
      projectiles: 1, 
      orbitals: 0, 
      magnet: 85, 
      attackCooldown: 36, 
      critChance: 0.15, 
      skillCooldownMax: 420,
      knockbackReceived: 0.5,
      knockbackDealt: 1.5
    }
  },

  MAGE: {
    name: "Ignis",
    title: "A Piromante",
    role: "Artilharia Ígnea",
    difficulty: 2,
    lore: "Guardiã da chama viva das cinzas celestes. Seus encantamentos convertem a fúria do fogo em desintegração em massa.",
    passive: {
      name: "Combustão Residual",
      desc: "Todo acerto crítico incendeia os alvos, aplicando queimadura contínua que drena vida ao longo do tempo."
    },
    weapon: {
      name: "Cajado da Tormenta",
      type: "Projéteis Arcanos Rápidos",
      desc: "Canaliza e dispara esferas concentradas de puro plasma ígneo com alta taxa de cadência e impacto."
    },
    skill: {
      name: "Passo Ígneo",
      cooldown: "6s",
      desc: "Teletransporte térmico em alta velocidade deixando um rastro de magma e asas de fogo com imunidade."
    },
    desc: "Passiva: Críticos aplicam queimadura residual.<br><b>Arma Inicial: Cajado da Tormenta</b> (Canaliza e dispara esferas concentradas de poder mágico ígneo).<br><b>Poder: Passo Ígneo</b> (Dash veloz com rastro contínuo de fogo e fantasmas térmicos, atravessando inimigos com imunidade).",
    color: { 
      robe: "#19141e", 
      robeDark: "#0f0c13", 
      robeHighlight: "#2e2436", 
      robeInner: "#9b111e", 
      corset: "#2c111c", 
      trim: "#e67e22", 
      trimGold: "#f1c40f", 
      trimGoldLight: "#ffeaa7", 
      cape: "#19141e", 
      capeInner: "#9b111e", 
      sash: "#e67e22", 
      sashGold: "#f39c12", 
      amuletRuby: "#ff4757", 
      amuletGlow: "rgba(255, 71, 87, 0.6)", 
      skin: "#fbe4d8", 
      skinShadow: "#e0b8a4", 
      hairDark: "#781a0e", 
      hairMid: "#c0392b", 
      hairLight: "#e67e22", 
      hairHighlight: "#f39c12", 
      eyeGlow: "#ffffff", 
      eyeFlame: "#f39c12", 
      flameRoot: "#b33939", 
      flameMid: "#e67e22", 
      flameBright: "#f1c40f", 
      flameTip: "#ffffff", 
      orbCore: "#ffffff", 
      orbGlow: "rgba(243, 156, 18, 0.65)", 
      staffWood: "#1c1417", 
      staffGold: "#f1c40f", 
      crystal: "#ff4757", 
      staffCorona: "#f39c12" 
    },
    startingWeapon: "STAFF",
    stats: { 
      hp: 73.5, 
      maxHp: 73.5, 
      speed: 3.5, 
      damage: 36, 
      auraLvl: 0, 
      projectiles: 1, 
      orbitals: 0, 
      magnet: 90, 
      attackCooldown: 28, 
      critChance: 0.28, 
      skillCooldownMax: 360,
      knockbackReceived: 1.0,
      knockbackDealt: 2.0
    }
  },

  ROGUE: {
    name: "Kael",
    title: "O Andarilho Sombrio",
    role: "Assassino Crítico",
    difficulty: 3,
    lore: "Um espectro letal que vagueia entre as dimensões do éter. Ele caça os feridos e jamais é visto antes do golpe fatal.",
    passive: {
      name: "Execução Espectral",
      desc: "Desfere 2.0x de dano em oponentes com menos de 35% de vida (1.5x contra chefes e elites)."
    },
    weapon: {
      name: "Lâminas Espirituais",
      type: "Lâminas Arremessadas em Arco",
      desc: "Projeta espadas astrais velozes de corte cirúrgico que perfuram linhas inimigas com alta taxa de acerto."
    },
    skill: {
      name: "Manto de Fumaça",
      cooldown: "7.5s",
      desc: "Invisibilidade instantânea com velocidade dobrada, empurrão de choque e 100% de chance crítica por 2.0s."
    },
    desc: "Passiva: 2.0x de dano em oponentes com menos de 35% de vida (1.5x contra chefes).<br><b>Arma Inicial: Lâminas Espirituais</b> (Espadas astrais velozes arremessadas contra inimigos no alcance).<br><b>Poder: Bomba de Fumaça</b> (Invisibilidade com dobro de velocidade, transposição de massa com empurrão atordoante e 100% de crítico por 2.0s).",
    color: { 
      // Capuz & Tecidos Abissais (Obsidian Plum nobre)
      cowlBase: "#1a1429",
      cowlShadow: "#0a0713",
      cowlHighlight: "#3f3358",
      cowlHighlightEdge: "#564578",
      cowlFold: "#221936",
      hood: "#1a1429", 
      hoodDark: "#0a0713", 
      hoodHighlight: "#3f3358",
      hoodNotch: "#07050d",

      // Máscara Fantasma de Obsidiana Lapidada & Prata Lunar
      maskBase: "#11121c",
      maskFacetLight: "#282a3d",
      maskSilver: "#cbd5e1",
      maskSilverBright: "#f8fafc",
      faceMask: "#11121c",

      // Olhar Espectral & Núcleo de Vácuo Dual-Tone
      eyeGlowCore: "#ffffff",
      eyeGlowCyan: "#38bdf8",
      eyeGlowPurple: "#c084fc",
      eyeVisor: "#38bdf8",
      eyeVisorCore: "#ffffff",
      eyeVisorGlow: "rgba(56, 189, 248, 0.75)",
      eyeMist: "rgba(168, 85, 247, 0.45)",
      eyeMistCyan: "rgba(56, 189, 248, 0.40)",

      // Couros Táticos e Gibão (Midnight Slate com desgastes e costuras)
      leatherDark: "#0c0f17",
      leatherMid: "#1a1e29",
      leatherLight: "#2c3345",
      leatherEdgeWear: "#475569",
      leatherStitch: "#818cf8",
      tunic: "#1a1e29", 
      tunicDark: "#0c0f17", 
      tunicHighlight: "#2c3345", 
      chestChevron: "#6d28d9",
      chestChevronLight: "#8b5cf6",
      chestChevronDark: "#4c1d95",

      // Metais Nobres (Prata Lunar Brunida & Obsidiana)
      silverPlate: "#64748b",
      silverHighlight: "#cbd5e1",
      silverGlint: "#ffffff",
      obsidianMetal: "#1e2230",

      // Gemas de Ametista & Vácuo
      gemPurple: "#a855f7",
      gemPurpleBright: "#f3e8ff",
      gemGlow: "rgba(168, 85, 247, 0.65)",
      vacuumCyan: "#38bdf8",
      vacuumCyanBright: "#bae6fd",
      rimLightAstral: "rgba(56, 189, 248, 0.40)",
      shoulderPad: "#1e2230",
      shoulderOrb: "#a855f7",
      shoulderOrbCore: "#f3e8ff",
      glove: "#0c0f17",

      // Cinto & Utilitários
      belt: "#0c0f17", 
      pouch: "#221936", 
      pouchFlap: "#32254d",
      pouchButton: "#cbd5e1",
      flaskGlass: "rgba(186, 230, 253, 0.55)",
      flaskLiquid: "#9333ea",
      flaskGlow: "rgba(147, 51, 234, 0.75)",

      // Kunais & Lâminas de Arremesso
      kunaiHilt: "#1a1429",
      kunaiRing: "#38bdf8",
      kunaiSteel: "#64748b",
      kunaiSteelLight: "#cbd5e1",

      // Lâminas Astrais Gêmeas (Dorsal)
      quiver: "#3b1559",
      quiverDark: "#1f0933",
      bladeSteel: "#475569",
      bladeSteelLight: "#94a3b8",
      bladeEdgeGlow: "#c084fc",
      bladeGlint: "#ffffff",
      bladeGlow: "#7c3aed",
      bladeCore: "#ffffff",
      bladeTrail: "rgba(168, 85, 247, 0.45)",

      // Pernas & Botas Tabi Shinobi
      pants: "#1c182b", 
      boots: "#0c0f17",
      bootsDark: "#06070a",

      // Capa Espectral em Farrapos
      cape: "#141021", 
      capeBase: "#141021",
      capeInner: "#080a12", 
      capeBottom: "#4c1d95", 
      capeEthereal: "#6b21a8",
      capeGlow: "rgba(168, 85, 247, 0.45)",
      capeMist: "rgba(56, 189, 248, 0.35)"
    },
    startingWeapon: "SWORD",
    stats: { 
      hp: 87.5, 
      maxHp: 87.5, 
      speed: 3.7, 
      damage: 35, 
      auraLvl: 0, 
      projectiles: 1, 
      orbitals: 1, 
      magnet: 150, 
      attackCooldown: 24, 
      critChance: 0.24, 
      skillCooldownMax: 450,
      knockbackReceived: 1.0,
      knockbackDealt: 2.0
    }
  },

  BARBARIAN: {
    name: "Kragdor",
    title: "O Bárbaro Furioso",
    role: "Colosso Berserker",
    difficulty: 1,
    lore: "Nascido nos cumes gelados dos reinos nórdicos, Kragdor canaliza a fúria dos ancestrais para transformar ferimentos em vitalidade pura.",
    passive: {
      name: "Sede de Sangue",
      desc: "Golpes da ponta do machado em Chefes/Elites curam 0.5% do HP máximo (cd 0.6s). Em hordas, regenera 1 HP a cada 18 abates."
    },
    weapon: {
      name: "Machado Giratório",
      type: "Órbita Perfeita em Turbilhão",
      desc: "Translada em órbita contínua ao redor do herói; o cabo repele inimigos e a ponta desfere corte crítico devastador."
    },
    skill: {
      name: "Rugido Ancestral",
      cooldown: "8s",
      desc: "Brado avassalador que atordoa a área, vaporiza projéteis inimigos e dobra a rotação do turbilhão em frenesi."
    },
    desc: "Passiva: Golpes da ponta da lâmina contra Chefes e Elites curam 0.5% do HP máximo (recarga de 0.6s). Contra hordas comuns, recupera 1 HP a cada 18 acertos.<br><b>Arma Inicial: Machado Giratório</b> (Translada em órbita; o cabo repele inimigos e a ponta desfere corte crítico integral).<br><b>Poder: Rugido Ancestral</b> (Atordoa inimigos em área por 0.6s, vaporiza projéteis e dobra a rotação do turbilhão em frenesi).",
    color: { 
      armor: "#2c1e18", 
      trim: "#d35400", 
      hair: "#d35400", 
      hairDark: "#962d1d",
      hairHighlight: "#e67e22",
      cape: "#7f1d1d", 
      capeInner: "#1e110c",
      skin: "#c67846", 
      skinShadow: "#8e4823",
      skinHighlight: "#df8b56",
      scar: "#ba5338",
      furBase: "#36211a",
      furHighlight: "#5d3a2d",
      bone: "#e2d7c5", 
      boneLight: "#f5eee1",
      boneDark: "#a19582",
      hornTip: "#2b221a",
      leatherDark: "#1a120e",
      leatherLight: "#5a3a2a",
      tattoo: "#f39c12", 
      tattooGlow: "#ff7675",
      axeSteel: "#7f8c8d", 
      axeSteelLight: "#b2bec3",
      axeEdge: "#f1c40f", 
      axeWood: "#3d271d",
      brass: "#f39c12",
      iron: "#47535e"
    },
    startingWeapon: "AXE",
    stats: { 
      hp: 154, 
      maxHp: 154, 
      speed: 3.1, 
      damage: 54, 
      auraLvl: 0, 
      projectiles: 1, 
      orbitals: 0, 
      magnet: 95, 
      attackCooldown: 38, 
      critChance: 0.18, 
      skillCooldownMax: 480,
      knockbackReceived: 0.5,
      knockbackDealt: 0.9
    }
  },

  ALCHEMIST: {
    name: "Valéria",
    title: "A Alquimista Cáustica",
    role: "Controle & Corrosão",
    difficulty: 2,
    lore: "Erudita dos venenos arcanos e ácidos mutagênicos. Domina a criação de compostos voláteis que dissolvem defesas e paralisam hordas sem depender de força bruta.",
    passive: {
      name: "Miasma Corrosivo & Fixação Cáustica",
      desc: "Poças e impactos aplicam corrosão (+6% de dano sofrido por acúmulo, até +30%) e veneno aderente contínuo. Poças dissolvem tiros e aplicam 70% de lentidão. Pisar nelas concede 3s de cura contínua e +15% de velocidade."
    },
    weapon: {
      name: "Frascos Cáusticos",
      type: "Bombardeio Químico & Veneno Aderente",
      desc: "Lança frascos corrosivos que se fixam aos alvos e criam zonas ácidas. O veneno queima continuamente mesmo se o monstro correr ou der dash."
    },
    skill: {
      name: "Reagente Volátil",
      cooldown: "6.5s",
      desc: "Detona 6 frascos radiais sob 0.6s de imunidade evasiva, liberando uma cortina de fumaça que desorienta inimigos no entorno por 1.8s."
    },
    desc: "Passiva: Poças e impactos aplicam corrosão (até +30% de dano sofrido) e veneno aderente que drena vida mesmo em movimento. Dissolve tiros e dá 70% de lentidão. Pisar nelas dá 3s de cura e +15% de velocidade.<br><b>Arma Inicial: Frascos Cáusticos</b> (Bombardeio químico com veneno aderente e poças secundárias).<br><b>Poder: Reagente Volátil</b> (6 frascos com 0.6s de imunidade e fumaça desorientadora).",
    color: { 
      armor: "#1b2a22", 
      coat: "#112920",
      coatLight: "#165b45",
      coatHighlight: "#1d6f54",
      coatDark: "#081611",
      trim: "#d4a373", 
      trimGold: "#f39c12",
      capelet: "#241812",
      leather: "#2c1e18", 
      leatherDark: "#17100d",
      leatherStitch: "#4a3525",
      brass: "#d4a373",
      brassBright: "#f5cd79",
      brassDark: "#8a5d3b",
      brassGlint: "#ffffff",
      copper: "#b87333",
      copperLight: "#d98845",
      hair: "#3a134a", 
      hairMid: "#6a258a",
      hairHighlight: "#a55eea",
      skin: "#fae1cb",
      skinShadow: "#e0b08a",
      eyeGlow: "#00ffcc",
      lens: "#00ffcc",
      acid: "#9b59b6",
      acidGlow: "#d6a2e8",
      acidEvolved: "#a29bfe",
      acidEvolvedGlow: "#e056fd",
      reagentPurple: "#8e44ad",
      reagentPurpleGlow: "#d6a2e8",
      reagentMutagen: "#6c218a",
      reagentAmber: "#f39c12",
      reagentAmberGlow: "#f1c40f",
      glassHighlight: "rgba(255, 255, 255, 0.85)",
      cape: "#8e44ad"
    },
    startingWeapon: "POTION",
    stats: { 
      hp: 105, 
      maxHp: 105, 
      speed: 2.92, 
      damage: 43, 
      auraLvl: 0, 
      projectiles: 1, 
      orbitals: 0, 
      magnet: 120, 
      attackCooldown: 28, 
      critChance: 0.20, 
      skillCooldownMax: 400,
      knockbackReceived: 1.0,
      knockbackDealt: 0.0
    }
  }
};
