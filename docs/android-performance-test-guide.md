# Teste controlado do APK — execução e próximos passos

## Estado desta execução

Implementados: telemetria corrigida e opt-in, medição independente do preview, painel de comparação, cinco perfis nativos, exportação JSON, identificação do conteúdo web e compilação debug/release de laboratório. O APK original foi preservado em `dist/android-investigation/before/android/app/build/outputs/apk/debug/app-debug.apk`.

Os testes nos aparelhos físicos e a captura de CPU/GPU continuam pendentes: nenhum aparelho estava conectado por ADB. Portanto, ainda não há causa raiz confirmada nem ganho de FPS medido no Redmi/POCO. Não foram feitas reduções de qualidade, alterações nas regras do combate ou alterações especulativas de efeitos/modais nesta etapa.

O perfil padrão do candidato usa a integração padrão da WebView, mantendo `hardwareAccelerated=true`. A solicitação automática de frequência máxima e a camada extra foram retiradas desse perfil. São mudanças candidatas a testar, não correções com ganho já comprovado. O perfil de alta frequência continua disponível no laboratório; não foi imposto limitador JavaScript de 60 FPS.

## Qual APK instalar

- `dist/android-investigation/HordSlayer-lab-release.apk`: opção principal. Compilação release com controles de diagnóstico, assinada com a chave local de debug apenas para testes.
- `dist/android-investigation/HordSlayer-lab-debug.apk`: opção para depuração remota da WebView e comparação com a compilação debug.
- A compilação normal release foi verificada, mas seu APK é sem assinatura de distribuição. Nenhuma chave de produção foi criada ou usada.

Os dois APKs de laboratório têm o mesmo identificador do jogo e certificado local do APK original: instalar como atualização, sem desinstalar, conserva o armazenamento do aplicativo. O código não apaga saves. Se o Android recusar a atualização por assinatura, não desinstalar como atalho; verificar a origem do APK instalado.

## Primeiro teste, sem computador

1. Instalar o APK de laboratório release e abrir **Teste APK**.
2. Selecionar **Econômico** e manter essa mesma qualidade em todos os ensaios iniciais. A seleção altera a preferência gráfica do jogo; pode ser restaurada depois.
3. Selecionar o perfil A, o cenário **Menu parado** e tocar em **Medir por 30 segundos**. Há dois segundos de preparação; o painel desaparece durante a gravação e volta com o resultado. Deixar o jogo em primeiro plano.
4. Repetir no perfil B e depois no C, mantendo as mesmas condições. Fazer três rodadas por perfil e alternar a ordem para reduzir influência do aquecimento.
5. Repetir com **Troca de personagens**, trocando na mesma sequência e ritmo. O rótulo do cenário identifica o ensaio; não executa ações automaticamente.
6. No POCO, comparar C com E; no Redmi, C com D. Confirmar a frequência efetiva mostrada pelo painel, pois a solicitação pode não ser atendida exatamente.
7. Tocar em **Exportar resultados** e salvar o arquivo JSON. O aplicativo abre o seletor Android; nada é enviado automaticamente. São mantidos até 30 relatórios localmente; exportar antes de exceder esse número.

| Perfil | Camada WebView | Política de tela | Comparação principal |
| --- | --- | --- | --- |
| A | Forçada em hardware | Maior Hz, política antiga | Referência do wrapper anterior |
| B | Padrão, sem camada extra | Mesma política de A | A × B isola a camada |
| C | Padrão | Padrão do Android | B × C avalia pedido de Hz máximo |
| D | Padrão | Modo mais próximo de 60, mesma resolução | Controle para alvo de 60 |
| E | Padrão | Modo mais próximo de 120, mesma resolução | Controle para alvo de 120 |

A reproduz a política antiga de camada/frequência, não o APK histórico byte a byte: todos os perfis compartilham a mesma nova telemetria, e as configurações obsoletas foram removidas. O APK histórico permanece separado para verificar a experiência anterior.

## Comparação com Chrome usando o mesmo conteúdo

No computador, `npm run serve:performance` serve a pasta `www` já sincronizada com o APK em `127.0.0.1:4177`. Não reconstruir `www` depois de gerar o APK sem recompilar/sincronizar o pacote, pois isso invalidaria a comparação.

Com depuração USB autorizada, usar o Android SDK para encaminhar a porta:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices -l
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" -s SERIAL reverse tcp:4177 tcp:4177
```

No Chrome do celular, abrir `http://127.0.0.1:4177/?diagnostics=1`. Conferir que a identificação do build é igual à mostrada no APK. Usar **Tela cheia no navegador**, quando disponível, para aproximar a viewport da do app. Conferir as dimensões internas do canvas: mesmo DPR com alturas diferentes ainda representa cargas diferentes. Registrar diferenças inevitáveis de viewport em vez de assumir equivalência.

Chrome e app têm saves separados. Para comparação inicial, usar personagem/cenário disponíveis em ambos e atributos equivalentes. Não apagar nem sobrescrever progresso para igualá-los. As partidas contêm aleatoriedade: os testes de horda/ULT são um roteiro manual, não um benchmark determinístico. Não atribuir diferenças pequenas ao wrapper sem repetições e cargas equivalentes.

Ao terminar a sessão USB, remover o encaminhamento com `adb -s SERIAL reverse --remove tcp:4177`.

## Horda, ULT e modais

Depois de identificar quais perfis apresentam diferenças, repetir início de partida, aproximação de horda e a mesma ULT com números semelhantes de inimigos. Para upgrade/baú, iniciar a gravação com a tela já aberta. O painel não pausa o jogo por conta própria; em combate, começar o teste em um momento seguro e repetir o mesmo procedimento.

O JSON registra personagem, arena, estado de pausa e contagens no começo/fim. Esses valores não são um histórico completo dos picos; para localizar um evento específico, gravar trace curto no APK debug via Chrome DevTools e complementar com Perfetto/FrameTimeline quando disponível. O profiler altera a carga: comparar cadência sem gravação pesada primeiro. A coleta da versão release deve ser feita pelo painel ou tracing do sistema; a depuração WebView não foi habilitada nela.

Coleta auxiliar, sem instalar, limpar dados ou alterar o telefone:

```powershell
powershell -File scripts/collect-android-performance.ps1 -Serial SERIAL -Label poco-ult-perfil-b
```

O script salva localmente versões, memória, informações térmicas e logs do processo do jogo. `gfxinfo` não mede sozinho os quadros apresentados pelo Canvas/WebView e não deve ser interpretado como FPS final.

## Como interpretar

- `fps` é a cadência dos callbacks rAF, não uma prova de apresentação na tela.
- `cpuTime` é o tempo do callback principal. `renderTime` mede emissão de comandos Canvas e esperas síncronas, não todo o tempo da GPU.
- O preview tem callback próprio: consultar `preview.cpuTime` e `preview.frameTime` no menu. Não somar percentis como se fossem tempos sequenciais garantidos.
- `fps1PctLow` usa a média dos 1% intervalos mais lentos; p95/p99 também são fornecidos explicitamente.
- Gravações interrompidas ao sair do app têm `reason=visibility-changed`, não `completed`. Excluir essas gravações da comparação de 30 s.
- Campo de memória JavaScript indisponível é `null`, não zero. Não inclui texturas/gráficos nativos.
- O perfil seleciona uma política de display. A frequência efetiva deve ser verificada, inclusive quando o sistema muda dinamicamente por temperatura/bateria.

Diferença consistente A × B sugere contribuição da camada forçada. Diferença B × C exige conferir a mudança de Hz/resolução antes de atribuir ganho. Se a CPU for semelhante e a cadência diferir, investigar rasterização/composição/agendamento com trace; esse padrão, sozinho, não prova gargalo de GPU.

Somente depois dessas medições: decidir as correções específicas e executar sessões de 10–15 minutos nos dois aparelhos para confirmar estabilidade térmica, toque, áudio, saves e retomada do app. Se houver necessidade de alterações gerais no jogo, elas terão evidência do subsistema responsável.

## Validação local

- 82 testes aprovados, incluindo oito regressões da telemetria; 1.668 chaves por idioma intactas nos quatro idiomas.
- A suíte continua emitindo o erro capturado preexistente de `localStorage` indisponível em Node; não há teste reprovado.
- Compilação Android com Java 21 instalado em `.jdks/jbr-21.0.11`. O caminho anterior do Android Studio passou a apontar para Java 25 e impedia o build; foi corrigido.
- Painel e gravação verificados no navegador local, incluindo viewport vertical de 393 × 851. Isso valida funcionamento do painel, não desempenho dos celulares.
- Exportação JSON pelo navegador conferida no arquivo baixado; cópia em `dist/android-investigation/browser-smoke-report.json`. A integração nativa de compartilhamento e a troca de perfis foram compiladas, mas ainda precisam do ensaio Android. A captura visual do painel está em `dist/android-investigation/painel-validado.png`.
- Hashes dos pacotes e identificação do conteúdo web ficam em `dist/android-investigation/artifacts.json`.
