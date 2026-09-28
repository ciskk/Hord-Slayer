# ⚔️ Hord Slayer

Jogo de ação e sobrevivência em hordas (*bullet heaven / survivors-like*) com estética gótica, desenvolvido em JavaScript modular, HTML5 e Canvas 2D.

O motor do jogo usa tecnologias web nativas, com gráficos procedurais e áudio sintetizado pela Web Audio API. O empacotamento utiliza **Capacitor para Android** e **Electron para Windows**; os recursos nativos de Android incluem imagens de ícones e splash.

## Plataformas e requisitos

| Uso | Requisitos |
| --- | --- |
| Jogar no navegador | Navegador moderno com Canvas 2D, módulos JavaScript, Web Audio API e `localStorage`; servir o projeto por HTTP. |
| Desenvolver, testar e empacotar | Node.js 22 ou superior e npm. Instalar as dependências com `npm ci`. |
| Compilar Android | JDK 21, SDK Android com plataforma API 36 e Android Studio para abrir/configurar o projeto. O Gradle Wrapper está incluído. |
| Executar o aplicativo Android | API 24 ou superior, conforme `android/variables.gradle`. O desempenho depende do aparelho e da WebView. |
| Gerar o pacote desktop atual | O script está configurado para Windows x64. Linux e macOS não têm builds configurados neste repositório. |

## Começar no navegador

Abra um terminal na raiz do repositório. Para desenvolvimento e testes:

```powershell
npm ci
```

Para servir diretamente os arquivos-fonte, escolha uma opção:

```powershell
# Com Python instalado:
python -m http.server 8000 --bind 127.0.0.1
```

Abra [http://127.0.0.1:8000](http://127.0.0.1:8000). Como alternativa, use a extensão Live Server do VS Code ou `npx serve .` e abra o endereço informado pelo servidor. `npx serve` pode baixar a ferramenta na primeira execução.

A versão web não precisa ser compilada nem depende de `node_modules/` para jogar. Use um servidor HTTP: abrir `index.html` diretamente por `file://` no navegador pode bloquear os módulos JavaScript. O áudio é liberado após a primeira interação.

## Compilar para Android

O projeto nativo já está em `android/`, incluindo as personalizações de `MainActivity` e do plugin `PerformanceLab`. Não é necessário recriá-lo com `cap add`.

1. Instale as dependências com `npm ci`.
2. Configure o JDK 21 como Gradle JDK no Android Studio. Para compilar pelo terminal, defina `JAVA_HOME` para sua instalação do JDK 21 e `ANDROID_HOME` para seu SDK. Outra opção para localizar o SDK é `android/local.properties`, gerado pelo Android Studio e ignorado pelo Git.
3. Na raiz, sincronize o código web e abra o projeto:

```powershell
npm run cap:sync
npm run cap:open
```

`cap:sync` executa `build:mobile`, recria `www/` a partir de `index.html`, `style.css`, `css/` e `src/`, e sincroniza o Capacitor. **Repita a sincronização depois de modificar o jogo e antes de recompilar o Android.** Não edite as cópias geradas em `www/` ou nos assets do aplicativo.

Para gerar APKs pelo PowerShell, depois de configurar Java e SDK:

```powershell
cd android
.\gradlew.bat assembleDebug
# Opcionais:
.\gradlew.bat assembleLabRelease
.\gradlew.bat assembleRelease
cd ..
```

| Variante | Finalidade | Saída relativa à raiz |
| --- | --- | --- |
| `debug` | Desenvolvimento, depuração da WebView e diagnóstico. | `android/app/build/outputs/apk/debug/` |
| `labRelease` | Testes de desempenho com diagnóstico, usando assinatura local de debug. | `android/app/build/outputs/apk/labRelease/` |
| `release` | Diagnóstico desabilitado; a configuração atual não define assinatura de distribuição. | `android/app/build/outputs/apk/release/` |

Para distribuição, configure a assinatura de produção no Android Studio. Mantenha chaves e senhas fora do repositório e guarde as chaves com segurança para futuras atualizações. `labRelease` não é um pacote de distribuição.

Caminhos pessoais do SDK/JDK não devem ser adicionados ao `android/gradle.properties` compartilhado. No Windows, o wrapper é `gradlew.bat`; em ambientes compatíveis com shell Unix, use `./gradlew`.

## Compilar para Windows

Na raiz, com as dependências instaladas:

```powershell
npm run build:pc
```

O script gera `dist/HordSlayer-win32-x64/HordSlayer.exe`. Distribua **a pasta inteira** `HordSlayer-win32-x64`, por exemplo em um ZIP, pois o executável depende dos arquivos auxiliares do Electron. Esse comando gera um pacote de aplicativo, não um instalador.

O script cria o `main.cjs` do Electron em `temp-desktop/` e remove essa pasta ao terminar. Para alterar a janela ou a integração desktop, edite `scripts/build-desktop.mjs`. Uma nova compilação substitui a saída anterior nesse destino.

## Testes e ferramentas

| Comando | Finalidade |
| --- | --- |
| `npm test` | Executar os testes automatizados e validar os catálogos de idiomas. |
| `npm run test:unit` | Executar os testes em `tests/`. |
| `npm run lint:i18n` | Conferir paridade de chaves, parâmetros e integridade dos textos. |
| `npm run scan:i18n` | Procurar possíveis textos não internacionalizados; os resultados precisam de revisão. |
| `npm run build:mobile` | Recriar `www/` e sua identificação de conteúdo, sem sincronizar o Android. |
| `npm run serve:performance` | Servir a pasta `www/` existente em `127.0.0.1:4177`. |
| `npm run analyze:apk` | Coletar diagnóstico de um APK debug aberto em aparelho ou emulador conectado por ADB. |

Os testes cobrem traduções, apresentação das cartas, efeitos de upgrades, progressão, hordas, movimentação, renderização de evoluções, resolução e telemetria. Eles não substituem testes de toque, áudio, desempenho e retomada em aparelhos físicos.

### Diagnóstico de desempenho

Para experimentar o painel no navegador:

```powershell
npm run build:mobile
npm run serve:performance
```

Abra [http://127.0.0.1:4177/?diagnostics=1](http://127.0.0.1:4177/?diagnostics=1). O servidor usa a cópia em `www/`, não os fontes da raiz. Para comparar com o APK, use o mesmo conteúdo sincronizado e confira a identificação do build nos dois ambientes.

No Android, o painel está disponível nas variantes de laboratório e debug. As coletas são locais e podem ser exportadas. O FPS medido representa a cadência dos callbacks de animação; não comprova sozinho a quantidade de quadros apresentada pela GPU. Não há garantia de 60 FPS em todos os dispositivos.

Consulte o [guia de testes Android](docs/android-performance-test-guide.md), o [coletor de perfil detalhado](docs/android-deep-profiler.md) e a [investigação da WebView](docs/android-webview-performance-audit.md). Os relatórios descrevem o estado das respectivas investigações; arquivos em `dist/` mencionados neles são artefatos locais e não acompanham um clone.

## Funcionalidades

- Cinco sobreviventes com armas, habilidades, skins e trilhas procedurais próprias.
- Dez ondas, esquadrões com cerco e flanqueamento, minibosses e quatro chefes com arenas e fases de combate.
- Upgrades, pactos e evoluções lendárias; apresentação das cartas ligada aos cálculos dos efeitos.
- Progressão permanente com talentos, conquistas, bestiário e estatísticas por herói.
- Interface responsiva, joystick virtual e suporte a teclado/mouse.
- Português (`pt-BR`), inglês (`en`), espanhol (`es`) e francês (`fr`), com seleção no menu e na pausa, sem reiniciar a partida.
- Modos gráficos Nativo, Alta qualidade e Econômico, com preferência persistida. O DPR depende do modo: o limite de 2x não se aplica ao modo Nativo.
- Particionamento espacial, caches de sprites e terreno e ferramentas de medição para investigar custos de simulação e renderização.

### Sobreviventes

| Herói | Arma inicial | Habilidade |
| --- | --- | --- |
| Sir Roland | Martelo Sagrado | Investida Sagrada |
| Ignis | Cajado da Tormenta | Passo Ígneo |
| Kael | Lâminas Espirituais | Manto de Fumaça |
| Kragdor | Machado Giratório | Rugido Ancestral |
| Valéria | Frascos Cáusticos | Reagente Volátil |

Os encontros principais são Lorde Vampírico, Monólito Abissal, Thanatos e Soberano do Abismo. Os valores de balanceamento ficam em `src/config/` e nos módulos de combate.

### Evoluções

As condições não usam um nível genérico único para todas as armas. Por exemplo, a Lâmina Dimensional exige pelo menos quatro lâminas e Asas do Vento; o Santuário Celestial exige Aura nível 5 e Armadura Rúnica. Consulte `SYNERGIES` em [src/config/items.js](src/config/items.js) para as condições atuais das sete evoluções e a interface do jogo para sua apresentação traduzida.

### Controles

| Ação | Teclado e mouse | Toque |
| --- | --- | --- |
| Movimentar | `WASD` ou setas | Joystick virtual flutuante ou dinâmico |
| Usar habilidade | `Espaço`, `E` ou botão direito | Botão ULT |
| Canalizar Altar de Sangue | Segurar `Espaço`, `E` ou `F` dentro do círculo | Botão de altar |
| Ataque básico | Automático | Automático |
| Escolher herói | `A`/`D`, setas ou controles do menu | Controles do menu |
| Pausar | `Esc` ou `P` | Botão de pausa |
| Fechar modais | `Esc` ou botão de voltar | Botão de voltar |
| Tela cheia no pacote Windows | `F11` ou `Alt+Enter` | — |
| Ferramentas de desenvolvimento | `W` + `5` | — |

### Progresso e preferências

O jogo usa `localStorage` para progresso, desbloqueios e preferências. Navegador, aplicativo Android e pacote Electron têm ambientes de armazenamento separados; não há sincronização de progresso entre eles. No navegador, trocar a origem (host ou porta) também muda o armazenamento acessível.

Limpar os dados do navegador/aplicativo pode apagar o progresso. Para testar uma atualização Android preservando os dados, use pacote e assinatura compatíveis com a instalação existente; desinstalar não é um procedimento de migração de saves.

## Estrutura do repositório

```text
Hord Slayer/
├── index.html                 # Tela, HUD, modais e canvases
├── style.css                  # Entrada dos estilos
├── css/                       # Estilos e adaptações de layout
├── src/
│   ├── main.js                # Inicialização e loop principal
│   ├── config/                # Conteúdo, balanceamento e efeitos de upgrades
│   ├── core/                  # Entrada, áudio, resolução e diagnóstico
│   ├── entities/              # Jogador, inimigos e chefes
│   ├── i18n/                  # Traduções e apresentação localizada
│   ├── render/                # Renderização procedural e caches
│   ├── state/                 # Estado da partida e coleções
│   ├── systems/               # Combate, física, ondas e progressão
│   └── ui/                    # Controladores e modais
├── android/                   # Projeto nativo Capacitor e Gradle Wrapper
├── scripts/                   # Builds, validação e diagnóstico
├── tests/                     # Testes com node:test
├── docs/                      # Guias e análises técnicas
├── capacitor.config.json      # Identificação do app e webDir
├── package.json               # Comandos e dependências
└── package-lock.json          # Versões resolvidas das dependências
```

Versione os fontes, testes, documentação, scripts, configurações compartilhadas e o Gradle Wrapper completo, incluindo `gradlew.bat` e `gradle-wrapper.jar`.

`node_modules/`, `www/`, `dist/`, `temp-desktop/`, caches, logs, configurações locais e chaves de assinatura são ignorados. O `.gitignore` de `android/` também exclui assets web copiados e configurações geradas pelo Capacitor. APKs e pacotes desktop devem ser distribuídos como artefatos de release, fora do histórico dos fontes.

## Documentação complementar

- [Manutenção das traduções](docs/i18n/GUIA-MANUTENCAO.md).
- [Análise das descrições e efeitos das cartas](docs/analise-descricoes-cartas.md).
- [Roteiro de testes e comparação Android/Chrome](docs/android-performance-test-guide.md).
- [Coleta detalhada de desempenho por ADB](docs/android-deep-profiler.md).
- [Investigação de desempenho da WebView](docs/android-webview-performance-audit.md).
