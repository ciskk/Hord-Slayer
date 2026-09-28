# Coleta profunda do APK

Com o emulador ou celular conectado e o APK **debug** aberto, execute na raiz:

```powershell
npm run analyze:apk
```

Ao aparecer `Coletando 30s`, use o jogo normalmente. Nao inicie outra medicao no painel Teste APK. A ferramenta abre o aplicativo caso esteja fechado, mas nao inicia uma partida automaticamente. Nao precisa recompilar o APK de diagnostico existente.

Para escolher o aparelho ou duracao (3 a 60 segundos):

```powershell
npm run analyze:apk -- --serial emulator-5554 --seconds 30
```

Requer Node 22 ou posterior, SDK Android local e WebView com depuracao habilitada. Nenhuma dependencia npm adicional. O coletor conecta somente a WebView do processo com.hordslayer.game e remove seu encaminhamento de porta ao terminar.

Os arquivos ficam em `dist/android-investigation/deep/<data>/`. `RELATORIO.md` apresenta achados e limites; `summary.json` lista funcoes por tempo exclusivo amostrado e eventos do trace por thread. Tempos de eventos aninhados se sobrepoem: nao somar as linhas como percentual total. `(program)` e `(idle)` sao categorias do profiler, nao funcoes do jogo.

`cpu.cpuprofile` permite localizar funcoes e linhas no DevTools. `trace.json` guarda eventos de JavaScript, layout, pintura, rasterizacao e composicao que a WebView disponibilizar. Nao coleta screenshots. O perfil por amostragem e o trace adicionam custo: nao comparar esse FPS diretamente ao de uma execucao sem instrumentacao.

`measurement.json` registra cadencia, tarefas longas, tempos dos subsistemas, contexto inicial/final e estado de partida/pausa a cada segundo. O cenario e observado, nao escolhido manualmente. As amostras por segundo usam janelas moveis e podem se sobrepor.

Os arquivos before/after guardam gfxinfo, memoria, CPU, temperatura e SurfaceFlinger. Sao snapshots; nao atribuem consumo GPU por funcao. O gfxinfo nao mede sozinho FPS do Canvas. O coletor nao limpa estatisticas do sistema nem altera qualidade, perfil, saves ou codigo do jogo. Reinicia os contadores de telemetria temporarios do jogo.

Quando ha atraso fora do loop JS, o relatorio o identifica como custo ainda nao atribuido, sem afirmar que seja GPU. Eventos ausentes, trace parcial e restricoes do dispositivo sao limitacoes explicitas. Uma coleta no emulador nao comprova a causa de lentidao no Redmi ou POCO. Para atribuir espera entre processos com precisao adicional, pode ser necessario um trace de sistema Perfetto.

Referencias: [Tracing do Chromium](https://chromedevtools.github.io/devtools-protocol/tot/Tracing/), [Profiler](https://chromedevtools.github.io/devtools-protocol/v8/Profiler/), [dumpsys Android](https://developer.android.com/tools/dumpsys).
