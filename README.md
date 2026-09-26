# ⚔️ Hord Slayer

<p align="center">
  <img src="https://img.shields.io/badge/Tecnologia-HTML5%20%7C%20Canvas%202D-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5 Canvas 2D" />
  <img src="https://img.shields.io/badge/Linguagem-JavaScript%20(ES6%2B)-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript ES6" />
  <img src="https://img.shields.io/badge/Dependências-Zero%20(Vanilla)-success?style=for-the-badge" alt="Zero Dependencies" />
  <img src="https://img.shields.io/badge/Áudio-Web%20Audio%20API%20(Procedural)-9cf?style=for-the-badge" alt="Web Audio API" />
  <img src="https://img.shields.io/badge/Plataforma-Web%20%7C%20Mobile%20Ready-blueviolet?style=for-the-badge" alt="Mobile Ready" />
</p>

**Hord Slayer** é um jogo de ação e sobrevivência em hordas (*bullet heaven / survivors-like*) desenvolvido inteiramente com **tecnologias web nativas (Vanilla JS + HTML5 Canvas 2D)**.

Sem frameworks, sem bibliotecas externas e sem assets de imagem ou áudio pré-gravados: todo o pipeline gráfico, física de multidão, cenários, efeitos visuais e áudio são **gerados proceduralmente e sintetizados em tempo real**.

---

## ⚡ Destaques do Projeto

- **Motor Próprio em Vanilla JS**: Arquitetura modular orientada a subsistemas desacoplados em ES6 Modules, sem dependências circulares.
- **Gerenciamento de Estado Centralizado (`src/state/`)**: Desacoplamento do loop principal através de módulos atômicos para estado de partida (`gameState.js`), coleções ativas na arena (`collections.js`) e despachador de eventos/causa mortis (`events.js`).
- **Pipeline Gráfico com Múltiplos Canvas 2D**: Camada de jogo principal (`game-canvas`) combinada com camada de sobreposição (`banner-canvas`) para anúncios cinemáticos, banners de ondas e introduções de chefes sem sobreposição destrutiva. Suporte dinâmico a `devicePixelRatio` (limitado a 2.0x para nitidez e fluidez constante a 60 FPS).
- **Otimizações Zero-GC & Offscreen Canvas Caching**: Ícones vetoriais de status (veneno, queimadura e congelamento) cacheados em telas offscreen de 24x24 (`ctx.drawImage`), eliminação de alocações com spread de objetos e transformações afins diretas em resíduos de morte.
- **Spatial Hash Grid 2D**: Algoritmo de particionamento espacial em células de `75px` com chaves inteiras de 32-bit e pool estático de arrays para checagem otimizada de colisões entre centenas de entidades simultâneas com reuso total de memória (Zero Garbage Collection).
- **Física de Multidão & Tokens de Ataque Melee**: Concorrência de golpes coordenada que limita o ataque simultâneo de hordas comuns a no máximo 6 monstros por frame (`MAX_MELEE_ATTACK_TOKENS`), prevenindo shotgunning injusto.
- **Purga Dimensional & Fusão Dinâmica de Drops**: O Altar do Chefe Final condensa 100% das gemas de XP do mapa aberto em uma única Orbe Cósmica, resgata baús distantes e descarta detritos, poças e crateras. Abates contínuos contam com fusão de gemas de XP vizinhas (<38px) para eliminar picos de entidades.
- **Códice do Bestiário (45 Criaturas Catalogadas)**: 10 monstros comuns de horda, 15 monstros expandidos, 16 minibosses com inteligência artificial e máquinas de estados finitos (FSM) exclusivas, além de 4 chefes monumentais com múltiplas fases de combate e falas cinemáticas dinâmicas (*Boss Barks*).
- **Áudio Sintetizado em Tempo Real (Web Audio API)**: ~64 sintetizadores procedurais (SFX + trilhas musicais) gerados via osciladores, filtros em cascata e ruído branco, com auto-desbloqueio em qualquer primeiro gesto do usuário, restauração dinâmica pós-morte/stasis, escala harmônica na coleta de gemas, 5 trilhas musicais temáticas por herói na tela de seleção (120s loop cada), 11 SFX de transição elemental cinética (*Hero Shifting*) com filtro de vácuo suspensivo, e feedback tátil (Vibration API).
- **HUD Grim Cyber-Gothic & Modais Diegéticos**: Interface responsiva de alta fidelidade com medalhões vetoriais em bronze e ouro antigo, barras dinâmicas de HP/XP, supressão coordenada de cards de onda (`banner-suppressed`), layout otimizado para desktop e botão de ULT calibrado para toque móvel.
- **Subsistema Unificado de Meta-Progressão (`src/systems/progression.js`)**: Persistência no `localStorage` de ouro/almas, árvore de talentos do Astrolábio com 100% de reembolso, monumentos de melhor partida, biometria por herói, grimório de 25 conquistas e bestiário.
- **Análise Forense de Causa Mortis & Dicas Táticas**: Rastreamento detalhado da causa da morte com identificação do agressor (Chefe, Miniboss, Elite, Horda, Perigo Ambiental ou Projétil), dano sofrido e dicas táticas contextuais específicas para cada ataque fatal.
- **Eventos Mundiais & Pactos de Risco**: Altar de Sangue que surge proceduralmente com círculo ritual de contenção, acelerando a horda em 2.0x em troca de baús lendários garantidos.
- **Skins Cosméticas & Customização Visual**: Sistema de skins alternativas por herói com desbloqueio progressivo, persistência no `localStorage`, paletas cromáticas substituíveis e preview em tempo real no pedestal e miniaturas.
- **Transição Elemental Cinética (Hero Shifting)**: Coreografia animada de dissolução e materialização ao trocar de herói, com FSM de timing (0-500ms), temas elementais por classe, God Rays, screen shake, partículas gravitacionais e fast-switching.
- **Trilhas Musicais Procedurais por Herói**: 5 faixas temáticas únicas (120s loop) sintetizadas em tempo real via Web Audio API, refletindo a identidade sonora de cada sobrevivente na tela de seleção.
- **Notification Pips & Sinalizadores de Relíquias**: Sistema de notificações visuais para criaturas recém-descobertas no Bestiário, conquistas desbloqueadas e talentos compráveis, com consumo ao abrir os respectivos modais.
- **Controles Híbridos & Modos de Joystick**: Suporte responsivo com alternância dinâmica para teclado/mouse (Desktop) e Joystick virtual analógico (Mobile nos modos *Flutuante* e *Dinâmico*).

---

## 🎮 Controles

| Ação | Desktop (Teclado & Mouse) | Dispositivos Móveis |
|---|---|---|
| **Movimentação** | `W`, `A`, `S`, `D` ou `Setas` | Joystick Virtual Analógico (Flutuante ou Dinâmico) |
| **Poder Ativo / ULT** | `Espaço`, `E` ou `Botão Direito` | Botão Touch de Habilidade (`ULT`) |
| **Canalizar Altar de Sangue** | Segurar `Espaço`, `E` ou `F` (1.0s no círculo) | Botão Touch de Altar dedicado |
| **Ataque Básico** | Automático (mira no inimigo prioritário/próximo) | Automático |
| **Navegar Heróis no Menu** | `A` / `D`, `Setas` ou cliques no pedestal | Toque nas setas ou no pedestal |
| **Pausar / Grimório** | `Esc` ou `P` | Botão `⏸` no topo da tela |
| **Fechar Modais / Voltar** | `Esc` ou Botão de Retorno | Botão de Retorno no rodapé |
| **Console de Desenvolvedor** | `W` + `5` (sandbox e testes de bosses/waves) | Disponível via menus de depuração |

---

## 🛡️ Sobreviventes

Cada sobrevivente possui arquétipo, arma inicial, habilidade ativa com atributos únicos e balanceamento próprio:

| Sobrevivente | Título / Arquétipo | Arma Inicial | Habilidade Ativa | Estilo Tático |
|---|---|---|---|---|
| **Sir Roland** | O Paladino | Martelo Sagrado | Investida Sagrada | Tanque retaliador: reduz 20% do dano corpo a corpo recebido e reflete 50% de volta aos agressores. Sua investida desfere 2.8x de dano de impacto com ondas consagradas. |
| **Ignis** | A Piromante | Cajado da Tormenta | Passo Ígneo | DPS de artilharia ígnea: acertos críticos aplicam combustão residual contínua. Seu avanço flamejante atinge alvos com 3.4x de dano e explosão final de magma. |
| **Kael** | O Andarilho Sombrio | Lâminas Espirituais | Manto de Fumaça | Assassino crítico: desfere 2.0x de dano em oponentes com <35% de vida (1.5x contra chefes/elites) e invisibilidade com 100% de crítico e velocidade dobrada. |
| **Kragdor** | O Bárbaro Furioso | Machado Giratório | Rugido Ancestral | Lutador sustentável: rotação orbital destrutiva, roubo de vida (0.5% em chefes/elites) e atordoamento em área. |
| **Valéria** | A Alquimista Cáustica | Frascos Cáusticos | Reagente Volátil | Controle e corrosão glass cannon: dano base aprimorado (72.56), poças violetas que dissolvem tiros, desaceleram em 70%, acumulam corrosão (+30% dano sofrido) e concedem cura e velocidade. |

---

## 🌟 Fusões e Evoluções Lendárias

Ao elevar uma arma ao nível de requisito necessário e possuir a passiva correspondente, baús de chefes e elites podem liberar **Evoluções Lendárias**:

| Evolução Lendária | Receita (Arma + Passiva) | Efeito de Combate |
|---|---|---|
| **★ Lâmina Dimensional** | Lâminas Espirituais (Nv 4) + Asas do Vento | Espadas astrais colossais com perfuração quádrupla e velocidade extrema. |
| **★ Tempestade de Aço** | Machado Giratório (Nv 3) + Poder Bruto | 4 machados orbitais acelerados que trituram toda a arena ao redor. |
| **★ Dilúvio Biológico** | Frascos Cáusticos (Nv 3) + Golpe Criogênico | Salva de 5 frascos tóxicos criando uma mega-zona corrosiva com congelamento. |
| **★ Cataclismo Solar** | Cajado da Tormenta (Nv 3) + Poder Bruto | Supernovas de plasma penetrantes que cobrem o chão de magma radiante. |
| **★ Martelo dos Titãs** | Martelo Sagrado (Nv 3) + Armadura Rúnica | Terremoto titânico de 360° com fendas incandescentes no solo. |
| **★ Santuário Celestial** | Aura Sagrada (Nv 5) + Armadura Rúnica | Supernova defensiva permanente que expande o raio e regenera o HP do jogador. |
| **★ Vórtice do Apocalipse** | Bíblias Protetoras (Nv 3) + Asas do Vento | 3 grimórios supremos hipersônicos com ressonância sagrada e rotação protetora acelerada que vaporizam agressores. |

---

## 👑 Chefes e Arenas Procedurais

O jogo progride através de 10 ondas de hordas cronometradas, 16 tipos de minibosses com mecânicas próprias e 4 encontros épicos com chefes em arenas com perigos ambientais e citações cinemáticas (*Boss Barks*):

| Chefe | Arena Temática | Mecânicas e Fases Principais |
|---|---|---|
| **Lorde Vampírico** | *Pátio do Solar Abandonado* | Telegrafias de corte com foice e onda frontal de sangue, investida em névoa espectral, enxames de morcegos de longo alcance, gêiseres de sangue com adagas balísticas e repulsão tática. |
| **Monólito Abissal** | *Cratera de Basalto* | Litocistos Tectônicos orbitais destrutíveis, fontes termais de cura (+25 HP), esmagamento frontal pesado, erupção do epicentro, salva vulcânica de lanças de basalto das manoplas, fendas tectônicas cruzadas em X, onda de fendas, chuva de meteoros e vórtice da caldeira. |
| **Thanatos, o Ceifador Supremo** | *Pátio da Abadia em Ruínas* | Visual original com asas espectrais, auréola astral e foice ornamental. Lanternas de Almas com colapso de 2.0s, foice bumerangue, teleporte e vórtice colhedor. Três ataques de longo alcance: Lanças do Sepulcro, Cruz do Juízo e Coro dos Condenados (anel veloz de 36 a 48 almas a 4.33 de velocidade com abertura estreita de fuga de 30°). |
| **Soberano do Abismo** | *Horizonte do Vazio* | **3 fases de combate**, introdução cinematográfica em 4 atos com enquadramento dinâmico de câmera e cartela tipográfica, anatomia com 12 tentáculos em camadas 3D (dorsal/ventral) com física inercial de efeito chicote, olho observador com rastreamento contínuo, micro-saccades e membrana nictitante, domo com estrelas internas e sangramento cósmico por fase, agulhas em suspensão magnética, Turbilhão com rotação de carapaça e afterimages anatômicas, Torrente Orbital dos Quatro Horizontes com Disparos Abissais, barreira de contenção do Altar, horizonte de eventos contrátil, Âncoras Cósmicas, Santuários Celestiais e colapso fatal (DEATH_COLLAPSE) com Supernova Dourada. |

---

## 🏛️ Meta-Progressão Permanente & Códices

Todo o ouro e almas obtidos nos abates é salvo no `localStorage` do navegador para fortalecer seus sobreviventes entre as partidas:

### 🌌 Árvore Astral de Talentos (Astrolábio das Almas)

Interface monumental com navegação pan & zoom interativa, anéis de armilar e dois modos no painel: **Forja Rúnica** e **Códice de Bênçãos**:

#### ⚔️ Constelação da Guerra (Ofensiva & Letalidade)
- **Poder Ancestral**: +5% Dano global por nível (até 10 níveis).
- **Precisão Letal**: +2% Chance de acerto crítico por nível (até 5 níveis).
- **Vontade Incansável**: -2% Tempo de recarga de armas e habilidades por nível (até 5 níveis).
- **Fúria Executora**: +8% Dano contra inimigos com menos de 30% de HP por nível (até 5 níveis).

#### 🛡️ Constelação da Égide (Sobrevivência & Baluarte)
- **Vitalidade Rúnica**: +4% Vida máxima por nível (até 10 níveis).
- **Carapaça Blindada**: -1 Dano sofrido direto absoluto por nível (até 5 níveis).
- **Passos Ligeiros**: +2.5% Velocidade de movimento por nível (até 6 níveis).
- **Bênção Vital**: +0.5 HP/s Regeneração contínua por nível (até 5 níveis).
- **★ Renascimento da Fênix (Keystone)**: Sobrevive a 1 golpe fatal por partida, restaura 35% de vida e repele a horda com explosão solar.

#### 🔮 Constelação do Destino (Alquimia & Meta-Riqueza)
- **Ímã do Vazio**: +20px Raio de atração de gemas e ouro por nível (até 8 níveis).
- **Cobiça Espectral**: +5% Ouro e almas recolhidos na arena por nível (até 8 níveis).
- **Sabedoria Arcana**: +4% Ganho de XP por nível (acelera cartas de Tarô, até 5 níveis).
- **Destino Favorável**: +1 Reroll de cartas de Tarô por partida por nível (até 3 níveis).
- **★ Transmutação Cósmica (Keystone)**: 25% de chance de baús de chefes concederem dádiva dupla.

> *Purificação Rúnica: Botão de Reset com Reembolso Integral de 100% das almas investidas no Astrolábio.*

### 📖 Grimório de Conquistas & Desbloqueio Progressivo de Heróis
- **25 Conquistas Épicas**: Distribuídas em categorias (*Jornada*, *Heróis*, *Hordas*, *Poder* e *Sobrevivência*).
- **Desbloqueio Progressivo de Sobreviventes**: Conquistas específicas consagram o despertar de Ignis (derrotar Lorde Vampírico), Kael (derrotar Monólito Abissal), Kragdor (5.000 abates acumulados) e Valéria (5 fusões lendárias forjadas).
- **Recompensas em Almas**: Cada meta concluída concede almas cósmicas para investimento no Astrolábio.

### 💀 Códice do Bestiário das Trevas
- **Catalogação Diegética de 45 Criaturas**: Registro em tempo real de abates individuais, grau de letalidade, atributos biológicos, táticas recomendadas e inscrições de lore gótica.

### 🏆 Monumento da Melhor Run & Biometria de Campeões
- Exibição destacada na tela de seleção da maior sobrevivência histórica da conta, além de estatísticas individuais gravadas por herói: tempo recorde, vitórias consagradas, abates, total de partidas disputadas, maior onda alcançada, dano total causado, dano total recebido, chefes derrotados e ouro acumulado.

### 🎨 Skins Cosméticas & Customização Visual
- **Sistema de Skins Persistente**: Seleção e desbloqueio progressivo de skins alternativas por herói, com persistência individual no `localStorage` (chave `hord_skin_{heroId}`).
- **Preview em Tempo Real**: Visualização instantânea da skin selecionada no pedestal 3D e no grid de miniaturas da tela de seleção.
- **Paletas Cromáticas Alternativas**: Cada skin substitui dinamicamente as cores primárias, secundárias e de detalhes sem alterar os renderers base dos heróis.

---

## 🏗️ Arquitetura do Repositório

Organização modular orientada a separação de responsabilidades, estado centralizado, pipeline gráfico Canvas 2D segregado e arquitetura desacoplada de chefes:

```text
Hord-Slayer/
├── index.html                  # Interface do DOM, HUD, modais e canvases (game-canvas e banner-canvas)
├── style.css                   # Ponto de entrada e importação do Design System modular
├── README.md                   # Documentação oficial do projeto
│
├── css/                        # Estilos modulares da interface gótica
│   ├── base/                   # Reset, variáveis (design tokens) e atmosfera
│   ├── components/             # Botões góticos e estrutura base de modais
│   ├── devtools/               # Estilização do console secreto de desenvolvedor
│   ├── hud/                    # HUD de combate em alta fidelidade e falas de chefes (barks)
│   ├── responsive/             # Regras de adaptação para landscape, portrait e auto-fit
│   └── screens/                # Telas modais (seleção, astrolábio, baú, bestiário, pausa, morte, vitória)
│
└── src/
    ├── main.js                 # Ponto de entrada, loop principal, inicialização e orquestração do jogo
    │
    ├── state/                  # Gerenciamento de estado global desacoplado (Zero Circular Imports)
    │   ├── collections.js      # Coleções ativas na arena (inimigos, projéteis, poças, gemas, baús)
    │   ├── events.js           # Despacho de notificações, screen shake e rastreamento de causa mortis
    │   └── gameState.js        # Estado central da partida, câmera, viewport, zoom e cronômetros
    │
    ├── config/                 # Catálogos de dados, balanceamento e lore
    │   ├── achievements.js     # Catálogo de 25 conquistas e mapa de desbloqueio de heróis
    │   ├── arenas.js           # Configurações de biomas, temas, trilhas e paletas cromáticas
    │   ├── axes.js             # Parâmetros balísticos do machado giratório de Kragdor
    │   ├── bestiary.js         # Códice do bestiário (45 criaturas catalogadas, fraquezas e lore)
    │   ├── characters.js       # Atributos, armas, paletas cromáticas e passivas dos 5 sobreviventes
    │   ├── enemies.js          # Configuração de monstros comuns, 16 minibosses e arquichefes
    │   ├── enemyDeaths.js      # Perfis de morte, decomposição, física e estilhaços de criaturas
    │   ├── heroProfiles.js     # Perfis narrativos, títulos ancestrais e status dos heróis
    │   ├── items.js            # Registro único de armas, passivas universais e matriz de sinergias
    │   ├── kaelUlt.js          # Configuração e parâmetros da ULT Manto de Fumaça de Kael
    │   ├── kragdorUlt.js       # Configuração e parâmetros do Rugido Ancestral de Kragdor
    │   ├── squads.js           # Formações táticas pré-definidas de hordas
    │   ├── stalkerDash.js      # Parâmetros de investida espectral do Spectral Stalker
    │   ├── talents.js          # Definições declarativas da árvore de talentos (Astrolábio Cósmico)
    │   └── upgrades.js         # Lógica de seleção e sorteio ponderado de cartas de tarô
    │
    ├── core/                   # Infraestrutura base e utilitários de engine
    │   ├── audio.js            # Orquestrador do motor de áudio procedural Web Audio API e filtros
    │   ├── audio/              # Tabela declarativa O(1) de sintetizadores e cooldowns
    │   │   └── sfxRegistry.js  # Catálogo com ~64 sintetizadores sonoros procedurais e trilhas musicais
    │   ├── input.js            # Mapeamento unificado de teclado, mouse, touch e joysticks móveis
    │   ├── math.js             # Funções vetoriais, interpolação, ângulos e colisões
    │   ├── perfMetrics.js      # Telemetria em tempo real, monitoramento zero-GC e baseline de FPS
    │   ├── responsive.js       # Métricas de layout dinâmico, DPR (limitado a 2.0x) e safe areas
    │   ├── responsiveAutoFit.js # Motor adaptativo smart auto-fit para viewport e displays variados
    │   └── spatialGrid.js      # Spatial Hash Grid 2D (células de 75px, chaves 32-bit e pool estático)
    │
    ├── entities/               # Lógica de entidades de jogo e inteligências artificiais
    │   ├── enemies.js          # Fachada modular para spawner e criação de entidades inimigas
    │   ├── minibossController.js # Fachada modular para controladores e IAs dos 16 minibosses
    │   ├── player.js           # Fachada modular para atributos, armas, inventário e progressão
    │   │
    │   ├── bosses/             # Arquitetura modular desacoplada de chefes
    │   │   ├── bossRegistry.js # Despacho, agendamento e registro unificado dos 4 chefes
    │   │   ├── vampireLord/    # Módulo desacoplado do Lorde Vampírico (Boss 1)
    │   │   ├── abyssalMonolith/ # Módulo desacoplado do Monólito Abissal (Boss 2)
    │   │   ├── supremeReaper/  # Módulo desacoplado do Ceifador Supremo Thanatos (Boss 3)
    │   │   └── abyssSovereign/ # Módulo do Soberano do Abismo (Boss 4: FSM, física chicote, intro e render)
    │   │
    │   ├── enemies/            # Spawners e máquinas de estados de inimigos
    │   │   ├── minibossAI.js   # Fachada de retrocompatibilidade para controladores dos 16 minibosses
    │   │   ├── minibosses/     # Módulos atômicos e FSM individuais para cada um dos 16 minibosses
    │   │   └── spawner.js      # Spawner de hordas, esquadrões e monstros comuns
    │   │
    │   └── player/             # Módulos especializados do sobrevivente
    │       ├── inventory.js    # Gerenciamento de itens, passivas e recálculo dinâmico de status
    │       ├── player.js       # Estado base, locomoção, habilidades ativas e dashes
    │       └── weapons.js      # Disparos, rotação orbital e tempos de recarga das armas
    │
    ├── render/                 # Pipeline gráfico em Canvas 2D
    │   ├── bestRunPreview.js   # Renderização procedural do monumento da melhor partida
    │   ├── bestiaryPreview.js  # Desenho dinâmico das criaturas no códice do bestiário
    │   ├── characterPreview.js # Desenho procedural dos heróis, skins e armas na tela de seleção
    │   ├── creatureStyle.js    # Estilo base, deformações cinemáticas e renderização de morte
    │   ├── deathAnimation.js   # Sequência cinematográfica de morte do herói e necrofiltro
    │   ├── desktopHeroStage.js # Pedestal 3D procedural, iluminação reativa a áudio e palco cinético no desktop
    │   ├── enemiesRenderer.js  # Fachada de retrocompatibilidade para monstros comuns e elites
    │   ├── enemies/            # Renderizadores procedurais dedicados para cada criatura comum
    │   ├── environment.js      # Fachada e orquestrador de solo, transições de biomas e atmosfera
    │   ├── groundCracks.js     # Fissuras de impacto, crateras e fendas de magma no solo
    │   ├── heroTransition.js   # Transição elemental cinética entre heróis (dissolução e materialização)
    │   ├── ignisUlt.js         # Efeitos de fogo e labaredas da ULT Passo Ígneo de Ignis
    │   ├── joystickRenderer.js # Desenho do joystick virtual analógico e botões de toque móvel
    │   ├── kaelRenderer.js     # Fachada de compatibilidade para o renderer de Kael
    │   ├── kaelUlt.js          # Efeitos visuais de fumaça e vultos da ULT Manto de Fumaça
    │   ├── kragdorAxes.js      # Renderizador dos machados voadores e giratórios de Kragdor
    │   ├── kragdorUlt.js       # Onda de choque sonora da ULT Rugido Ancestral de Kragdor
    │   ├── minibossesRenderer.js # Fachada de retrocompatibilidade para os 16 minibosses
    │   ├── minibosses/         # Renderizadores procedurais dedicados para cada um dos 16 minibosses
    │   ├── playerRenderer.js   # Fachada e renderização de auras sagradas, orbitais e machados
    │   ├── renderer.js         # Orquestrador gráfico principal (câmera, shake, camadas e partículas)
    │   ├── rolandUlt.js        # Efeitos de rastro consagrado da Investida Sagrada de Roland
    │   ├── ultButtonRenderer.js # Botão Canvas 2D dinâmico de ULT com cooldown e prontidão
    │   ├── valeriaUlt.js       # Frascos e névoa cáustica da ULT Reagente Volátil de Valéria
    │   │
    │   ├── entities/           # Renderizadores especializados de elementos de arena
    │   │   ├── hazardsRenderer.js # Poças ácidas, vórtices, ondas de choque e telegrafias
    │   │   ├── mobsRenderer.js # Silhuetas de monstros vivos e sequências de morte
    │   │   ├── pickupsRenderer.js # Gemas, almas, baús, flechas e radar de borda de tela
    │   │   └── propsRenderer.js # Objetos destrutíveis, lápides ancestrais, tochas e urnas
    │   │
    │   ├── environment/        # Módulos especializados de cenários e arenas surreais
    │   │   ├── abyssArena.js   # Renderizador surreal do Altar do Vazio e Soberano do Abismo
    │   │   ├── naturalTerrain.js # Terreno procedural, biomas naturais e cache de texturas
    │   │   └── biomeProps/     # Despacho O(1) e desenho procedural de props por bioma
    │   │       ├── ivoryOssuary.js    # Candelabros tombados, mosaicos e anjos decapitados
    │   │       ├── crimsonSalt.js     # Espículas salinas, fontes eólicas e salmoura carmesim
    │   │       ├── eclipseBasilica.js # Vitrais estilhaçados, colunas e azulejos de mármore
    │   │       ├── cemetery.js        # Lápides esculpidas, ossadas expostas e cruzes
    │   │       ├── vampire.js         # Velas góticas e poças de sangue nobre coagulado
    │   │       ├── monolith.js        # Menires ciclópicos e fendas arcanas de energia
    │   │       ├── reaper.js          # Foices oxidadas cravadas e sepulcros profanados
    │   │       ├── abyss.js           # Olhos cósmicos piscantes e runas astrais gravadas
    │   │       └── index.js           # Tabela de despacho O(1) de props de arenas
    │   │
    │   ├── heroes/             # Renderizadores dedicados para cada um dos 5 sobreviventes
    │   │   ├── ignisRenderer.js   # Efeitos de fogo, cajado estelar e manto da Piromante
    │   │   ├── index.js           # Despachante unificado de renderização de heróis
    │   │   ├── kaelRenderer.js    # Manto espectral em farrapos, adagas duplas e capuz de Kael
    │   │   ├── kragdorAxe.js      # Geometria vetorial do machado de guerra ancestral
    │   │   ├── kragdorRenderer.js # Tatuagens rúnicas, machado giratório e fúria do Bárbaro
    │   │   ├── rolandRenderer.js  # Armadura de placas, elmo sagrado e martelo do Paladino
    │   │   ├── skinMaterials.js   # Paletas cromáticas e sombreamento procedural de peles
    │   │   └── valeriaRenderer.js # Frascos de vidro, reagentes cáusticos e vidrarias da Alquimista
    │   │
    │   ├── projectiles/        # Renderizadores procedurais especializados de projéteis
    │   │   └── abyssalBolt.js  # Disparo relativístico de vácuo e plasma ciano com núcleo estelar
    │   │
    │   └── worldEvents/        # Eventos mundiais dinâmicos e mecânicas contextuais
    │       └── bloodAltarRenderer.js # Desenho do Altar de Sangue, círculos de sacrifício e HUD
    │
    ├── systems/                # Regras e subsistemas de jogo
    │   ├── barks.js            # Provocações e falas cinemáticas dos chefes em combate
    │   ├── bossHazards.js      # Perigos de arena (ondas de choque, projéteis e telegrafias)
    │   ├── bossPhaseCinematic.js # Cinemáticas de transição de fase de chefes com slow motion
    │   ├── combat.js           # Resolução de ataques, sangramento, atordoamento e tokens de dano
    │   ├── devtools.js         # Painel de desenvolvedor, testes e comandos rápidos (`W + 5`)
    │   ├── enemyLifecycle.js   # Fachada modular para ciclo de vida e IA de monstros
    │   ├── enemyLifecycle/     # Subsistema modular de ciclo de vida (status, morte, comportamentos)
    │   │   ├── behaviors/      # 33 módulos especializados de IA e despacho O(1) de monstros
    │   │   ├── deathHandler.js # Resolução de abates, drops, baús, Bestiário e chefes
    │   │   ├── index.js        # Orquestrador do laço principal de atualização de inimigos
    │   │   ├── knockback.js    # Dinâmica vetorial de repulsão física e atenuação inercial
    │   │   └── statusEffects.js # Knockback suave, timers de emerge e DoTs cáusticos
    │   ├── fieldEffects.js     # Efeitos de terreno, poças ácidas e desaceleração
    │   ├── physics.js          # Separação elástica de multidão e colisões de corpos
    │   ├── pickups.js          # Coleta de gemas, fusão de XP e Purga Dimensional de Arena
    │   ├── progression.js      # Subsistema central de meta-progressão, persistência e recordes
    │   ├── projectiles.js      # Balística, projéteis teleguiados e regras de adrenalina melee
    │   ├── ui.js               # Fachada de interface para retrocompatibilidade
    │   ├── waves.js            # Cronograma temporal de ondas, esquadrões e gatilhos de chefes
    │   └── worldEvents.js      # Eventos mundiais dinâmicos (Altar de Sangue e pactos rituais)
    │
    └── ui/                     # Componentes e controladores de interface
        ├── cardIcons.js        # Gerador procedural de glifos para as cartas de Tarô e armas
        ├── hudController.js    # Controle da HUD de combate, vitais, banners e cooldowns
        ├── icons.js            # Gerador procedural de ícones SVG e glifos rúnicos
        ├── uiManager.js        # Gerenciador central da UI, fiação de modais e escutas de eventos DOM
        └── modals/             # Modais modulares desacoplados
            ├── achievementsModal.js   # Grimório de Conquistas e Monumento da Maior Jornada
            ├── bestiaryModal.js       # Códice do Bestiário das Trevas e preview procedural
            ├── bossSelectModal.js     # Painel de seleção de chefes para duelo
            ├── characterSelectModal.js # Tela monumental de seleção dos 5 heróis
            ├── chestModal.js          # Abertura de baús de tesouro e fusões lendárias
            ├── codexModal.js          # Fachada de retrocompatibilidade do Códice Ancestral
            ├── gameOverModal.js       # Tela de derrota, dicas táticas e necrofiltro
            ├── pauseModal.js          # Estase temporal, inventário pausado e opções
            ├── talentsModal.js        # Astrolábio Cósmico e Árvore Rúnica de Talentos
            ├── upgradeModal.js        # Cartas de Tarô Arcano no avanço de nível
            └── victoryResults.js      # Resumo consagrado de vitória e biometria final
```

---

## 🚀 Como Executar Localmente

Como o projeto utiliza **ES6 Modules nativos**, ele deve ser executado através de um servidor local para evitar bloqueios de CORS do protocolo `file:///`.

### Opção 1: VS Code (Live Server)
1. Abra a pasta do projeto no **Visual Studio Code**.
2. Instale a extensão **Live Server**.
3. Clique com o botão direito em `index.html` e selecione **Open with Live Server**.

### Opção 2: Node.js
```bash
npx serve .
```

### Opção 3: Python
```bash
python -m http.server 8000
```
Em seguida, abra `http://localhost:8000` no seu navegador.

---

## 💻 Requisitos

- Qualquer navegador moderno (Chrome, Edge, Firefox, Safari, Opera).
- Suporte a Canvas 2D, ES6 Modules, Web Audio API e `localStorage`.
- Zero ferramentas de build, `npm install` ou compiladores necessários!
