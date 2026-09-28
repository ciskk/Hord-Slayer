# Hord Slayer — investigação de desempenho Android

Data: 28/09/2026. Escopo: código local, APK existente, reprodução isolada da telemetria e documentação oficial. Nenhum aparelho estava conectado por ADB. Não houve medição de CPU/GPU nos dois celulares relatados, nem confirmação da versão web publicada que foi comparada. As hipóteses abaixo não são causas raízes confirmadas nos aparelhos.

Relato complementar do usuário: Redmi Note 11 com aproximadamente 20 FPS, piora ao abrir upgrade/baú e ao alternar personagens; POCO X8 com aproximadamente 50 FPS e perda de cerca de metade do desempenho perto de hordas e ao usar ULT que mata muitos inimigos. Versões do Android/WebView e origem desses números não informadas. O objetivo passou a incluir **120 FPS no POCO**, além de 60 FPS no intermediário. Os 60 Hz propostos abaixo são um controle de diagnóstico e um perfil estável; não substituem o objetivo de alta taxa.

## Evidências verificadas

- APK local: `android/app/build/outputs/apk/debug/app-debug.apk`, 5.460.526 bytes, modificado em 27/09/2026 às 22:37:53 no horário local.
- SHA-256: `0B4FB9D87D5D0349F9A7ED5A62A35AC8E96DB7F0B92B49DF5D789CA0415AC8C8`.
- Foram comparados por SHA-256 os 299 arquivos não vazios de `assets/public/src`, `assets/public/css`, `index.html` e `style.css` presentes no APK com os arquivos locais correspondentes: zero diferenças. Isso não identifica o APK efetivamente instalado nos celulares nem a revisão publicada na web.
- Capacitor Android 8 no projeto; `targetSdkVersion = 36`. Manifesto declara aceleração de hardware na aplicação e atividade e orientação portrait.
- `npm test`: 74 testes aprovados, zero falhas; 1.668 chaves por idioma validadas nos quatro idiomas. A execução também emite um erro capturado de `localStorage` inexistente no ambiente Node. Esses testes não medem fluidez na WebView.
- Esta investigação não alterou o jogo nem recompilou o APK.

## 1. A medição existente não pode validar 60 FPS

Em `src/core/perfMetrics.js:105`, `beginFrame` recebe o timestamp do requestAnimationFrame; em `endFrame` (linha 140), o código registra a diferença entre esse timestamp e o fim do callback. O FPS (linha 265) é o inverso dessa duração, limitado a 120. Isso não mede o intervalo entre callbacks e não mede a apresentação dos quadros na tela. Também pode incluir o atraso entre o timestamp do rAF e a execução efetiva do callback.

Reprodução isolada executada nesta investigação: 20 callbacks espaçados em 100 ms, cada um terminando 2 ms após seu timestamp. Cadência simulada: 10 callbacks/s. Resultado da implementação: **120 FPS**, frame médio de 2 ms e “1% low” de 500 FPS.

Há outro erro: `update` e `render` são acumulados por `endMeasure`, mas não pertencem a `SUBSYSTEM_KEYS`, a lista zerada em `beginFrame`. Em uma segunda reprodução, três quadros com exatamente 1 ms de update e 1 ms de render produziram medições sucessivas de 1, 2 e 3 ms para cada um. Os totais crescem entre quadros.

O benchmark também converte segundos em `durationSeconds * 60` callbacks. Dez segundos declarados equivalem a 600 callbacks: a 10 FPS, aproximadamente um minuto; a 120 FPS, aproximadamente cinco segundos. Contadores “por segundo” usam a mesma suposição.

Correção recomendada antes de qualquer comparação:

1. Medir intervalos entre timestamps consecutivos de rAF e o tempo real de gravação.
2. Medir separadamente o tempo de execução JavaScript com `performance.now()` na entrada e saída.
3. Zerar também os acumuladores `update` e `render` em cada quadro.
4. Reportar percentis p50/p95/p99 dos intervalos e quantidade de intervalos longos; não chamar o inverso do p99 de um cálculo universal de “1% low”.
5. Reiniciar a amostra ao voltar do background, mantendo pausas de visibilidade fora do ensaio de gameplay.
6. Verificar quadros apresentados/perdidos com tracing do sistema. O tempo da função `render()` mede a emissão de comandos Canvas e eventuais esperas síncronas, não todo o trabalho assíncrono da GPU.

## 2. As configurações nativas atuais merecem um teste A/B

`MainActivity.java:26` chama `unlockHighRefreshRate()`. O método seleciona a maior frequência, sem restringir os modos à resolução física atual. `src/main.js:1718` atualiza e renderiza em cada callback; não existe limitador de 60 FPS. O preview de personagem também redesenha em cada callback (`src/render/characterPreview.js:469`).

Se a solicitação de 120 Hz for atendida e o rAF acompanhar, o jogo pode executar até duas vezes mais atualizações/renderizações por segundo; o orçamento de cada intervalo cai de 16,67 ms para 8,33 ms. Isso é um agravante plausível de consumo, aquecimento e instabilidade, mas não explica sozinho 5 FPS. A taxa realmente concedida depende do aparelho e do sistema.

Recomendação: testar sem a solicitação de taxa máxima e, quando suportado, preferir um modo próximo de 60 Hz com a mesma resolução. Controlar a cadência por timestamps no jogo, preservando o delta de tempo e limitando recuperação após pausas. Não usar simplesmente “pular um callback em dois”: isso falha em telas de 90 Hz. Para cadência uniforme de 60 em um painel que só opera a 90 naquele momento, a limitação por rAF terá intervalos alternados; preferir um modo de tela compatível quando disponível.

`MainActivity.java:91` força `View.LAYER_TYPE_HARDWARE` sobre toda a WebView. Essa camada é um cache da View em textura e não um interruptor que obriga todas as operações do Canvas HTML a usar a GPU. Em conteúdo que muda continuamente, deve ser comparada com o comportamento padrão, sem a camada explícita (`LAYER_TYPE_NONE`), mantendo a aceleração da janela/manifesto. A camada extra pode consumir memória e trabalho de composição; seu impacto precisa ser medido. [Camadas e aceleração de hardware no Android](https://developer.android.com/develop/ui/views/graphics/hardware-accel).

`setRenderPriority(HIGH)` na linha 93 não constitui uma otimização atual: está obsoleto desde API 18 e não é mais suportado. `setRendererPriorityPolicy` trata de sobrevivência do processo sob falta de memória, não de prioridade de FPS. Cache de rede, DOM Storage e WebSQL tampouco resolvem custo de renderização por quadro. [WebSettings](https://developer.android.com/reference/android/webkit/WebSettings#setRenderPriority(android.webkit.WebSettings.RenderPriority)).

Correção do diagnóstico anterior: aceleração por hardware é padrão com target API >=14. A ausência original do atributo no manifesto não prova que o jogo rodava por software, nem demonstra uma intervenção específica da Xiaomi. `View.isHardwareAccelerated()` verifica a janela/View; não comprova o caminho interno de todas as operações Canvas HTML. [Documentação Android](https://developer.android.com/develop/ui/views/graphics/hardware-accel).

## 3. A qualidade salva pode invalidar a comparação

`src/core/responsive.js:26` escolhe o modo PERFORMANCE em mobile, mas a preferência salva em `hord_graphics_quality` substitui esse padrão nas linhas 42–44. Chrome e aplicativo têm armazenamentos separados. Uma atualização do APK pode conservar uma seleção antiga de qualidade nativa.

Registrar a qualidade efetiva, DPR e dimensões internas de todos os canvases nos dois ambientes. Comparar explicitamente com a mesma configuração, sem apagar saves. Para DPR 3, reduzir o buffer para 1,25 representa 5,76 vezes menos pixels, ou aproximadamente **82,6% de redução de área**, não “redução de 600%”. Isso não é uma previsão de ganho equivalente de FPS nem garantia de nitidez indistinguível.

## 4. Cinco megabytes em disco não representam o custo por quadro

O jogo desenha gráficos procedurais e mantém superfícies em memória:

- Terreno: `src/render/environment/naturalTerrain.js:11` permite 128 chunks. Cada superfície tem 388 × 388 pixels. Se preenchido, esse conjunto equivale a cerca de **73,5 MiB de pixels RGBA**, antes de cópias, buffers e overhead; a implementação pode usar outra representação. É um cálculo de capacidade, não medição de memória residente. O limite ainda pode aumentar conforme a viewport.
- Atlas: `src/render/enemies/spriteCache.js:21` usa 16 × 16 células, não as 64 descritas no comentário antigo. No limite de densidade 2,5, são 3840 × 3840 pixels, equivalentes a **56,25 MiB RGBA**. Na configuração mobile econômica é menor, conforme DPR e zoom.
- `buildChunk` (linha 569) executa trabalho procedural síncrono. O orçamento do prefetch (linha 711) limita um ou dois chunks, não milissegundos. Um único chunk lento pode exceder todo o orçamento de um quadro; misses visíveis podem gerar outros chunks sincronicamente.
- Os filtros, sombras animadas e transparências CSS adicionam composição. O menu portrait tem backdrop blur de 12–28 px; o HUD anima drop shadows da ULT. O custo deve ser isolado por tela: filtros de um menu oculto não são evidência de custo durante a partida.
- `render()` continua sendo chamado quando `isPaused` é verdadeiro. Assim, pausar a simulação não elimina o redesenho do cenário atrás de modais com filtros.

Recomendação conforme o perfil: limitar caches por bytes estimados; antecipar terreno com orçamento de tempo e fallback pronto para misses; dividir ou transferir geração procedural para Worker onde compatível; pré-renderizar efeitos repetidos; reduzir filtros animados no perfil mobile; congelar o fundo de modais quando não há animação necessária. O renderer já contém atlas e cache de terreno: ampliar esses mecanismos com critério, sem reconstruir algo que já existe.

Não foi encontrado `getImageData` ou `willReadFrequently` nos arquivos `src` examinados. Existe `putImageData` na geração do solo em um canvas auxiliar. Portanto, não há evidência estática de leitura de pixels do canvas principal a cada quadro. Não adicionar `willReadFrequently: true` como uma suposta aceleração genérica.

Há carregamento externo de fontes Google em `index.html:19–21`. Empacotá-las melhora autonomia offline e previsibilidade de carregamento, mas isso não está demonstrado como explicação do FPS sustentado.

## 5. Por que Chrome e APK podem divergir

O APK Capacitor não transforma o renderer JavaScript/Canvas em um jogo nativo. A WebView usa Chromium, mas integra a apresentação à aplicação Android. A arquitetura documentada inclui uma thread de renderização do sistema específica da integração WebView. Chrome e WebView podem ainda diferir em versão efetivamente instalada, composição e comportamento do driver. [Arquitetura RenderingNG](https://developer.chrome.com/docs/chromium/renderingng-architecture).

Isso torna a diferença relatada plausível, mas não identifica uma regressão específica de Chromium sem versão e trace. Também não permite atribuir um fator fixo de lentidão ao Capacitor. Não foi encontrada uma chamada de plugin nativo por quadro no loop principal examinado.

## 6. Ensaio recomendado e critérios de decisão

Registrar modelo, Android, pacote/versão do provedor WebView (`adb shell dumpsys webviewupdate`), versão do Chrome, identificação do build, qualidade salva, buffers, resolução e Hz efetivos. Verificar logs para erros repetidos do loop, falhas gráficas e perda de contexto.

Usar a mesma revisão web, herói, arena, caminho, quantidade de entidades e resolução. Idealmente disponibilizar um cenário determinístico. Repetir três vezes por configuração, com aquecimento inicial semelhante, sem economia de bateria e sem comparar um telefone frio a outro já quente. Incluir início, horda densa, chefe e sessão de 10–15 minutos para estabilidade térmica.

| Ensaio, alterando um fator por vez | Pergunta que responde |
| --- | --- |
| APK atual contra Chrome, com build/DPR/cena equivalentes | Qual é a diferença real de cadência e tempo de CPU? |
| APK sem camada nativa explícita | A camada forçada aumenta o custo de composição? |
| APK sem pedido de Hz máximo e com alvo de 60 | O volume de trabalho e o frame pacing melhoram? |
| APK com filtros/overlays isolados temporariamente | O gargalo está em composição CSS? |
| Terreno simples temporário e caches já aquecidos | Os picos estão na geração procedural? |
| Mesma cena sem áudio temporariamente | Há custo relevante de áudio/sintetização? |
| Build release local e build de diagnóstico equivalentes | Há contribuição mensurável de instrumentação/logs? |

O build release é um controle, não promessa de otimização automática do JavaScript. Não há necessidade de publicar nem usar a keystore de produção nesse ensaio.

Inspecionar a WebView via Chrome DevTools e gravar CPU, tarefas longas, style/layout e renderização; complementar com Perfetto/FrameTimeline para composição/apresentação quando disponível. Primeiro medir a cadência sem gravação pesada e depois capturar trace curto do trecho ruim. O debugger pode perturbar os resultados. [Depuração remota de WebViews](https://developer.chrome.com/docs/devtools/remote-debugging/webviews).

Para 60 FPS, cada intervalo de apresentação é de aproximadamente 16,67 ms. Buscar margem de CPU, por exemplo update + emissão de render abaixo de 10–12 ms no p95, é uma meta inicial de engenharia, não um limite universal: CPU e GPU têm sobreposição e filas. Aprovar pela cadência apresentada, p95/p99, ausência de travamentos recorrentes e estabilidade térmica no intermediário. Callback de rAF estável, isoladamente, não garante apresentação estável.

## 7. Alternativas se a diferença persistir

**TWA/PWA:** é a alternativa mais alinhada à observação de que o Chrome já roda bem. Uma Trusted Web Activity usa o navegador compatível do usuário em tela cheia, em vez da WebView embarcada. Preserva a base web, mas exige site HTTPS, verificação de domínio com Digital Asset Links e uma estratégia offline, normalmente service worker/cache. O offline desde a primeira abertura exige projeto específico; não é equivalente a ter todos os assets embarcados no Capacitor. Integrações nativas também mudam. Provar o desempenho no mesmo cenário antes de decidir a migração. [Visão geral de TWA](https://developer.android.com/develop/ui/views/layout/webapps/trusted-web-activities).

**WebGL compartilhado:** se a medição apontar custo alto no desenho Canvas 2D, considerar batching de sprites/partículas e atlas de efeitos em um renderer WebGL comum à web, Android e desktop. Isso é uma mudança maior, não uma solução garantida para uma falha de composição externa. Worker/OffscreenCanvas também só se justifica quando resolve o gargalo medido e tem compatibilidade verificada.

Prioridade proposta: corrigir telemetria → comparar build/DPR/provedor → testar camada padrão e baseline de 60 → otimizar o subsistema medido → validar perfil de 120 → avaliar TWA ou renderer WebGL com evidência. Não prometer 60/120 FPS estáveis nos aparelhos antes desse ensaio.

## 8. Investigação direcionada após identificar os aparelhos e os gatilhos

**Upgrade e baú no Redmi:** há uma combinação concreta no código que corresponde ao sintoma. `css/screens/upgrades.css:7` e `css/screens/chest.css:7` aplicam blur + brightness + saturate + contrast ao canvas inteiro. Os overlays ainda aplicam outro `backdrop-filter: blur(3.5px)`. Os modais marcam `gameState.isPaused = true`, mas `src/main.js:1769` continua chamando `render()` fora da condição que interrompe o update. Assim, “frozen” no nome da classe não significa buffer congelado. Confirmar o custo com trace e fazer um A/B com o canvas conservando o último quadro, sombreado simples e apenas um tratamento visual de fundo. Atualizar o canvas apenas ao abrir, redimensionar ou quando existir uma animação realmente necessária; preservar as animações CSS dos cards.

**Troca de personagens no Redmi:** `src/render/characterPreview.js:644` limpa e redesenha o palco, fundo, rosácea, pedestal, névoa e efeitos de transição, inclusive em mobile. Há caches em partes do palco; isso não significa que toda a composição seja estática. As transições têm renderização própria e partículas em `src/render/heroTransition.js`. Separar esse orçamento do gameplay; reutilizar camadas estáticas e aplicar qualidade/cadência própria para o preview e para os efeitos de troca. O medidor principal não engloba diretamente o callback independente do preview, portanto é necessário instrumentá-lo também.

**ULT e mortes em massa no POCO:** `src/systems/enemyLifecycle/deathHandler.js:67` adiciona efeitos por morte; alguns tipos também criam poças, projéteis, efeitos em vizinhos ou novos inimigos. O caminho comum termina registrando a morte, tocando som e removendo um elemento do array. Em mortes simultâneas, o custo lógico e visual é concentrado no mesmo intervalo.

Já existem limites em `src/systems/combat.js`: 24 inimigos em animação de morte, 25 textos de dano e até 40 partículas na função comum `createHitParticles`. Portanto, seria incorreto diagnosticar genericamente “partículas ilimitadas”. Esses limites não abrangem todo efeito de ULT, poça ou transição. Os cadáveres seguem `drawDyingEnemyShape` (`src/render/enemies/index.js:131`), desenhando resíduo e pose procedural; não usam o mesmo `drawCachedEnemy` aplicado a certos inimigos vivos. Por isso, matar inimigos não garante reduzir imediatamente o trabalho gráfico.

Medir separadamente processamento das mortes, desenho de cadáveres, efeitos específicos da ULT, poças/projéteis e áudio. Se o custo estiver nos cadáveres, usar sprites/poses de morte pré-renderizados e orçamento de detalhe visual; se estiver em alocações/remoções, considerar pools e compactação de coleções preservando a ordem e as regras de combate. Orçamentar efeitos decorativos por intervalo e agrupar áudio quando adequado, sem adiar dano, XP ou consequências mecânicas da morte. Não remover cadáveres indiscriminadamente: há lógica de necrofagia associada a eles.

Para **120 FPS**, cada quadro dispõe de aproximadamente **8,33 ms**, metade do orçamento de 60 FPS. Depois de corrigir a telemetria, validar modos 60 e 120 separadamente, com limite de resolução/efeitos compatível e o modo real concedido pelo Android. Se um trace mostrar update acima desse orçamento, reduzir apenas o DPR não resolverá; se mostrar composição/GPU dominando, otimizar IA não resolverá. Uma futura simulação a passo fixo com interpolação pode separar o custo lógico da taxa visual, mas exige revisão das regras atualmente dependentes de callbacks e não deve ser introduzida como mudança trivial.
