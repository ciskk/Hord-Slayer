# Análise das descrições de upgrades e pactos

Data: 28/09/2026.

## Escopo e conclusão

Revisão das 30 cartas de `src/config/upgrades.js`: 22 upgrades regulares, 7 pactos e a Bênção da Fortuna. Foram comparados os textos em português, as prévias numéricas, os efeitos de `apply()` e os principais consumidores desses atributos no combate. O inventário e as traduções foram consultados para identificar divergências entre telas.

Há espaço claro para simplificar a leitura. O problema mais importante, porém, é a fidelidade: algumas cartas omitem bônus, outras usam termos ambíguos e algumas anunciam efeitos que não aparecem conectados à simulação atual.

Esta é uma análise estática do código atual, com alterações locais já existentes. Não houve execução de uma partida nem alteração de textos, balanceamento ou mecânicas. As propostas abaixo são editoriais; os casos sinalizados dependem de validação da mecânica.

## 1. Corrigir a fidelidade antes de revisar o estilo

| Prioridade | Carta ou sistema | Evidência e consequência |
| --- | --- | --- |
| Alta | Poder Bruto, Pacto do Berserker e Fenda Temporal | Alteram `damagePercentBonus`. `calculateEffectiveDamage()` incorpora esse atributo, mas não foram encontradas chamadas dessa função em `src`. Os ataques consultados usam `player.damage`, inicializado em `player/player.js`. Há forte indício de que o bônus e a penalidade aparecem na interface sem afetar o dano desses ataques. Validar em partida antes de publicar novos textos. |
| Alta | Gume Astral | O upgrade incrementa `flightSpeedBonus`, mas esse campo não é lido em `src`. As espadas são criadas com velocidades fixas em `player/weapons.js`. A promessa de +6% de velocidade de voo não está sustentada pelo caminho de combate consultado. |
| Alta | Superposição Cáustica | O texto promete +3% de área e `apply()` incrementa `areaBonus`, mas esse campo não é consumido. A criação do frasco usa `42 × (1 + potencyCount × 0,05)` como raio da poça. Raio e área são diferentes: o primeiro aumento de 5% no raio corresponde a 10,25% na área circular. |
| Alta | Fenda Sísmica | O texto promete +48 px de alcance. A criação do ataque e a colisão usam incrementos de 12 unidades por nível; `apply()` também soma 0,30 ao multiplicador de dano. O resumo omite esse bônus de dano. Não manter +48 px sem esclarecer sua relação com a colisão real. |
| Alta | Fenda Temporal | A penalidade diz “armas convencionais”, mas altera o mesmo atributo de dano global usado por Poder Bruto. Além disso, `Math.max(120, skillMaxCd × 0,60)` pode aumentar a recarga se ela já estiver abaixo de 120, enquanto a carta continua disponível. Resolver esses comportamentos antes de fechar a descrição. |
| Média | Poder da Fênix | Aplica +1 de perfuração e +0,08 no multiplicador de dano do cajado. A prévia omite o dano e a descrição promete ampliar o rastro de queimadura, sem alteração correspondente nesse upgrade. |
| Média | Foco Letal após Olho do Algoz | O pacto pode elevar a chance crítica até 95%, mas Foco Letal usa `Math.min(0.85, chance + 0.04)`. Ao escolher a passiva com chance acima de 85%, ela diminui a chance para 85%. A prévia também anuncia 85% como teto. É uma interação de mecânica, não apenas de texto. |
| Média | Poção Alquímica e Dança Espectral | A poção calcula a cura com `healingMultiplier`. Com o pacto, 65% da vida máxima passa a 26%, antes de limitar pela vida faltante. A prévia continua mostrando 65%. O resumo do pacto diz “Curas do Mapa”, mas também afeta esta carta. |
| Média | Fúria Rápida | Reduz cada recarga atual em 5%, com arredondamento e piso. O contador `cooldownReduction` controla quando a carta passa a dar dano; ele não é uma medida fiel da redução acumulada. Por exemplo, 11 reduções multiplicativas de 5% resultam em cerca de 43,1%, antes de arredondamentos e pisos, não 55%. |

### Outros limites que a interface deve respeitar

- Gume Pesado: raio máximo de 120; perto do limite, o ganho pode ser menor que +6. Depois do limite, apenas o dano aumenta.
- Golpe Criogênico: chance máxima de 75%; o último ganho pode ser menor que 6 pontos percentuais. A duração continua crescendo.
- Ímpeto Supremo: recarga mínima de 60 unidades de simulação; próximo desse mínimo, o ganho não é exatamente 5%.
- Berserker: a vida máxima tem piso de 35; a perda pode ser menor que 50%.
- Coração de Titã: velocidade mínima de 1,2; a perda pode ser menor que 30%.
- Olho do Algoz: chance máxima de 95%; o ganho pode ser menor que 35 pontos percentuais.
- Tormenta Arcana: as recargas têm piso de 8. Também altera o contador que decide a conversão de Fúria Rápida em dano.
- Bênção da Fortuna: chama `addPersistentGold(15)`, que aplica o multiplicador de ouro. Portanto, +15 é o valor base, não necessariamente o recebido. A cura desta carta não usa `healingMultiplier`.

## 2. Padrão recomendado

### Estrutura da carta

1. **Nome:** mantém a identidade de fantasia.
2. **Alvo ou categoria:** Machado, Cajado, Passiva, Utilidade ou Pacto.
3. **Descrição:** uma frase curta que explica o comportamento.
4. **Efeito desta escolha:** valores, um atributo por linha.
5. **Progressão:** nível ou quantidade em um campo separado, quando necessário.

Para pactos, manter blocos com os rótulos **Benefício** e **Penalidade**. Cor e setas podem ajudar, mas não devem ser a única explicação. Um sinal positivo pode ser prejudicial, como “+25% de dano recebido”.

### Vocabulário e números

- Usar **vida**, **vida máxima**, **dano recebido**, **velocidade de movimento**, **recarga das armas** e **recarga da suprema** de forma consistente.
- Usar **lentidão** para o efeito que reduz movimento. “Congelamento” sugere imobilização, que não é o comportamento padrão de `applyFreeze()`.
- Escolher **esfera** para os projéteis do cajado e **bíblia** para os orbitais. Hoje alternam-se esfera/orbe e bíblia/tomo/grimório.
- Usar vírgula decimal no português: `0,25 s`, `1,5×`. Os números fixos das traduções também precisam de localização.
- Separar efeitos por linha. Evitar alternar `&`, `/` e `|` como conectivos.
- Escrever **chance de crítico: 15% → 19%**, em vez de “+4% Chance”. A mudança é de 4 pontos percentuais, não aumento relativo de 4%.
- Mostrar **dano crítico: 1,5× → 1,6×**, em vez de “+0.10 Mult”.
- Para atributos internos pouco intuitivos, como `+0.005 Vel Órbita`, apresentar o ganho relativo real calculado para o estado atual. Não substituir por uma porcentagem fixa: ela muda conforme o atributo cresce.
- Usar **Limite atingido** e **Máx.** de forma consistente; evitar misturar TETO e MÁX.
- Explicar uma vez na tela que upgrades e pactos valem durante a partida. Cura é imediata; o ouro recebido vai para o saldo persistente.
- Remover adjetivos sem informação mecânica: “sutilmente”, “rigorosamente”, “avassaladora”, “suave e controlada”. O nome e a arte já carregam a fantasia.

### Exemplo de apresentação

**Foco Letal**\
Aumenta a chance e o dano dos acertos críticos.

- Chance de crítico: **15% → 19%**
- Dano crítico: **1,5× → 1,6×**

**Coração de Titã**\
Aumenta sua vida, mas reduz sua velocidade de movimento.

- Benefício: **+195 de vida máxima e atual**
- Penalidade: **−30% de velocidade de movimento**

Os valores da prévia devem considerar limites e modificadores. Os números do exemplo de Foco Letal são ilustrativos.

## 3. Revisão de todos os upgrades regulares

As frases propostas ocupam o campo de descrição. Os valores ficam no bloco de efeitos, evitando repetir a mesma informação em duas partes da carta.

| Carta | Descrição proposta | Efeitos ou ajustes necessários |
| --- | --- | --- |
| Turbilhão Violento | Faz os machados girarem mais rápido e causarem mais dano. | Mostrar velocidade de giro antes/depois e bônus de dano do machado. O código soma 0,005 ao giro e 0,04 ao multiplicador de dano. |
| Machado Adicional | Adiciona um machado que gira ao seu redor. | +1 machado; quantidade atual → próxima; máximo 3. Retirar “translada” e “anel orbital”. |
| Gume Pesado | Aumenta o alcance e o dano dos machados. | Até +6 de raio, limitado a 120; +0,10 no multiplicador de dano. No limite, dizer que aumenta apenas o dano. |
| Salvo Alquímico | Lança um frasco adicional no mesmo alvo a cada ataque. | +1 frasco; máximo 4. Um frasco extra não equivale a duplicar o dano: o impacto adicional tem redução própria no código. |
| Superposição Cáustica | Aumenta o dano dos frascos e o tamanho das poças de ácido. | +0,05 no multiplicador de dano. Resolver divergência entre +3% de área anunciado e +5% do raio base implementado. |
| Cajado da Tormenta | Dispara uma esfera mágica adicional a cada ataque. | +1 esfera; máximo 5. Considerar “Esfera Adicional” como nome da carta para diferenciá-la da arma. |
| Poder da Fênix | Faz as esferas atingirem mais um inimigo e causarem mais dano. | +1 de perfuração adicional, até 3 melhorias; +0,08 no multiplicador de dano do cajado. Remover promessa de ampliar queimadura. |
| Lâminas Espirituais | Lança uma espada adicional a cada ataque. | +1 espada; máximo 5. Considerar “Lâmina Adicional” como nome da carta. |
| Gume Astral | Aumenta a velocidade de voo e o dano das espadas. | Proposta condicionada à conexão do bônus de voo à simulação. Atualmente, o +0,08 no multiplicador de dano é consumido; o bônus de voo não foi encontrado nos consumidores. |
| Fenda Sísmica | Aumenta o alcance e o dano dos golpes do martelo. | Mostrar o alcance real e incluir +0,30 no multiplicador de dano. Diferenciar nível do martelo de quantidade de fendas; resolver o número +48. |
| Golpe Demolidor | Aumenta o dano dos golpes do martelo. | +0,12 no multiplicador de dano. “Dano esmagador” pode sugerir um tipo de dano especial inexistente no efeito do upgrade. |
| Golpe Criogênico | Aumenta a chance de aplicar lentidão e a duração do efeito. | Chance antes/depois, máximo 75%; +0,25 s de duração. “+6% Lentidão” é ambíguo: pode parecer intensidade da redução de velocidade. |
| Poder Bruto | Aumenta o dano das suas armas e habilidades. | Proposta depende de conectar ou validar o bônus global no combate. O upgrade soma 0,05 ao bônus global; o ganho relativo sobre o dano atual depende dos bônus anteriores. |
| Fúria Rápida | Reduz o intervalo entre os ataques das armas. | Exibir a redução real. Ao entrar no estado de conversão: “Aumenta o dano das armas”, com o bônus correspondente. Não apresentar o contador de 55% como redução efetiva. |
| Ímpeto Supremo | Reduz o tempo de recarga da sua habilidade suprema. | Recarga atual → próxima, de preferência em segundos. Explicitar o mínimo quando alcançado. Retirar “convergência astral”. |
| Asas do Vento | Aumenta sua velocidade de movimento. | +0,18 no atributo base ou ganho relativo calculado. Evitar “velocidade” sem indicar movimento. |
| Foco Letal | Aumenta a chance e o dano dos acertos críticos. | Chance antes/depois e multiplicador antes/depois. Resolver a interação com Olho do Algoz antes de anunciar o limite. |
| Ímã Titânico | Atrai gemas de experiência de uma distância maior. | +30 de raio de coleta. O trecho de atração consultado opera sobre gemas; evitar “tesouros” sem confirmar quais outros objetos realmente são atraídos. |
| Aura Sagrada | Causa dano periódico aos inimigos próximos. | No primeiro nível: desbloqueio. Nos seguintes: aumenta dano e raio; o código soma 18 ao raio e 0,45 ao fator de dano por nível. “+1 nível” sozinho não explica o ganho. Corrigir o badge “Passiva”, pois a categoria é arma. |
| Bíblias Protetoras | Bíblias giram ao seu redor, causando dano e empurrando inimigos. | Desbloqueio ou +1 bíblia; máximo 3. Padronizar o nome do objeto e corrigir o badge “Passiva”, pois a categoria é arma. |
| Armadura Rúnica | Aumenta sua vida máxima e sua vida atual. | +30 de vida máxima e +30 de vida atual. O nome pode sugerir redução de dano; considerar “Vitalidade Rúnica”, verificando colisão com o talento de mesmo nome. |
| Poção Alquímica | Recupera vida imediatamente. | Valor base: 65% da vida máxima. Mostrar a cura efetiva considerando o pacto, outros modificadores e a vida faltante. Não confundir com a arma de frascos. |

## 4. Revisão dos sete pactos

| Pacto | Descrição proposta | Benefício | Penalidade e observações |
| --- | --- | --- | --- |
| Pacto do Berserker | Aumenta seu dano em troca de vida máxima. | +65 pontos percentuais no bônus de dano global, sujeito à validação do combate. | Metade da vida máxima, com piso de 35. A vida atual é limitada à nova máxima. Mostrar os valores resultantes é mais claro que esconder o piso. |
| Coração de Titã | Aumenta sua vida, mas reduz sua velocidade de movimento. | +195 de vida máxima e atual. O texto atual omite a vida atual. | −30% de velocidade de movimento, com piso de 1,2. “Impenetrável” sugere proteção que a carta não concede. |
| Tormenta Arcana | Faz suas armas atacarem mais rápido, mas deixa você mais vulnerável. | −30% na recarga atual das armas, respeitando o piso. | −50% na duração da invulnerabilidade após sofrer dano; +25% de dano recebido. Exibir em duas linhas. |
| Cobiça Maldita de Midas | Dobra o ganho de ouro e amplia a coleta, mas aumenta o dano recebido. | Ouro recebido ×2; +150 de raio de coleta. | +30% de dano recebido. “Dobra” comunica a multiplicação do bônus existente melhor que um +100% isolado. Confirmar alcance do multiplicador em todas as recompensas. |
| Olho do Algoz | Fortalece os acertos críticos, mas enfraquece os demais golpes. | +35 pontos percentuais de chance crítica, até 95%; +0,70 no multiplicador crítico. Preferir prévias antes/depois. | −40% de dano dos acertos não críticos. Usar o mesmo termo na carta e na pausa; hoje aparecem “Dano Comum”, “Golpes Comuns” e “não-crítico”. |
| Dança Espectral | Aumenta sua velocidade de movimento, mas reduz a cura de itens e da Poção Alquímica. | +35% de velocidade de movimento. | −60% na cura dos itens afetados e da carta Poção Alquímica. Evitar “toda cura”: a Bênção da Fortuna e a cura da aura evoluída consultada não usam esse multiplicador. |
| Pacto da Fenda Temporal | Reduz a recarga da sua suprema em troca de dano. | Redução pretendida de 40%, com piso de 120 unidades de simulação. | Resolver o escopo do dano, sua aplicação efetiva e a possibilidade de aumentar a recarga. Só então escolher entre “dano das armas” e “dano global”. |

## 5. Bênção da Fortuna

**Descrição proposta:** “Recupera vida e concede ouro.”

- Cura base de 35% da vida máxima, limitada à vida faltante.
- 15 de ouro base, sujeito ao multiplicador aplicado por `addPersistentGold()`.
- Remover “Todos os poderes conhecidos atingiram o apogeu”: existem passivas infinitas e a carta serve como preenchimento quando faltam opções elegíveis; isso não comprova que todos os poderes foram maximizados.

## 6. Consistência entre telas e idiomas

Os pactos têm cópias dos efeitos em `bonusText`, `penaltyText`, `stat`, `bonus` e `penalty`. A seleção usa um par e a pausa usa outro. Isso já gera diferenças de escopo, como “cura de itens e poções” versus “curas do mapa”.

Os itens também têm descrições próprias: `items.*.description` e `upgrades.*.description` precisam concordar, ainda que a primeira explique o item e a segunda explique a próxima melhoria.

Recomendação de implementação:

1. Resolver as divergências de mecânica destacadas na seção 1.
2. Calcular uma prévia dos atributos afetados a partir do estado atual, com limites e arredondamentos iguais aos da aplicação.
3. Reutilizar a definição dos efeitos entre seleção, pausa e inventário; cada tela pode ter uma apresentação apropriada.
4. Manter frases e rótulos localizados, com números interpolados pela formatação do idioma.
5. Revisar as quatro traduções existentes: português, inglês, espanhol e francês. A consulta ao inglês já mostra a repetição de promessas como +6% de voo e penalidade exclusiva de armas na Fenda Temporal.
6. Conferir a leitura no celular, especialmente Tormenta Arcana e Olho do Algoz. Uma linha por efeito facilita comparação e evita descrições extensas.

## Referências no projeto

- `src/i18n/locales/pt-BR/content.js`: textos das cartas a partir de `upgrades.axe_speed.title`, descrições do inventário e cópias dos pactos.
- `src/config/upgrades.js`: disponibilidade, aplicação e prévias das 30 cartas.
- `src/ui/modals/upgradeModal.js`: montagem visual da descrição e dos efeitos.
- `src/ui/modals/pauseModal.js`: apresentação dos atributos e pactos ativos.
- `src/entities/player/weapons.js`: dano, projéteis, velocidades, raios e perfuração.
- `src/entities/player/player.js`: inicialização dos atributos.
- `src/systems/projectiles.js`: colisão do martelo e raio das poças.
- `src/systems/fieldEffects.js`: aura, bíblias e cura da aura evoluída.
- `src/systems/combat.js`: aplicação de lentidão e efeitos de dano recebido.
- `src/systems/pickups.js`: cura de itens e atração de gemas.
- `src/systems/progression.js`: multiplicador de ouro.
