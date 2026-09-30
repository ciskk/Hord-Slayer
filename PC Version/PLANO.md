# Hord Slayer — plano da versão PC

Data: 29/09/2026.

## Objetivo e escopo

Transformar o Hord Slayer atual, desenvolvido em HTML, CSS e JavaScript, em um aplicativo para PC que abra por um executável e funcione offline. Adotar Windows x64 como primeiro alvo; avaliar Linux e macOS depois da primeira versão validada.

Este documento registra o plano original. A implementação Windows 0.1.0 foi criada nesta pasta; o instalador e o ZIP portátil estão em `out/releases`. Consulte `README.md` para uso e `VALIDACAO.md` para os resultados e limites dos testes.

## O que já existe no projeto

- `index.html` carrega `style.css` e o módulo `src/main.js`.
- O código está dividido entre entidades, sistemas, renderização, interface e configurações.
- `src/core/input.js` já trata teclado e mouse, com WASD/setas, habilidade em Espaço/E, pausa em Esc/P e interação com altar em F.
- Há interface e renderização voltadas a desktop, além dos controles de toque.
- `src/systems/progression.js` usa `localStorage` para progresso, conquistas, recordes e bestiário; outros módulos armazenam preferências.
- `index.html` busca as fontes Cinzel Decorative, Cinzel e Outfit no Google Fonts. Elas precisam ser incluídas localmente para manter a apresentação offline.
- Existem ferramentas de desempenho em `src/core/perfMetrics.js`, `src/core/graphicsDiagnostics.js` e `src/core/performanceLab.js`.
- Não foi encontrado `package.json` na raiz nesta inspeção. Será necessário configurar o projeto desktop e seus comandos.

## Arquitetura proposta

Usar Electron como ponto de partida, reaproveitando o jogo web. É uma escolha de projeto para reduzir a necessidade de reescrever gameplay e renderização; consumo de memória, tamanho do pacote e desempenho serão avaliados no protótipo.

Manter o código do jogo na raiz como fonte única. A pasta `PC Version` conterá a camada desktop, configuração e scripts de empacotamento. Um script copiará apenas `index.html`, `style.css`, `css/`, `src/` e os assets necessários para a área gerada do aplicativo. Evitar manter duas cópias editáveis do jogo.

Estrutura usada como base da implementação:

```text
PC Version/
  PLANO.md
  package.json
  package-lock.json
  forge.config.cjs
  desktop/
    main.cjs          # janela, ciclo de vida e serviços nativos
    preload.cjs       # ponte limitada para funções desktop, se necessária
  scripts/
    prepare-game.cjs  # prepara os arquivos do jogo para distribuição
  assets/
    icon.ico
    fonts/
  app/               # conteúdo web gerado; não editar diretamente
  out/               # pacotes e instaladores gerados
```

Carregar o conteúdo por um protocolo local estável, como `app://game/`, com suporte adequado aos módulos ES e às requisições locais. Fixar essa origem desde o protótipo para manter a persistência consistente. Não depender de um servidor público para executar o jogo.

Configurar isolamento de contexto, sandbox e acesso Node desabilitado no conteúdo web. Caso haja ponte nativa, expor somente operações específicas, com validação de argumentos e remetente; restringir navegação e abertura de janelas. Essas medidas seguem as [orientações de segurança do Electron](https://www.electronjs.org/docs/latest/tutorial/security).

## Etapas de execução

### 1. Preparar a base desktop

- Registrar uma referência da versão web: abertura, início de partida, habilidade, pausa e retorno ao menu.
- Configurar Electron e um empacotador, como Electron Forge, com versões compatíveis e arquivo de dependências travado.
- Criar uma janela redimensionável com título e ícone do jogo.
- Implementar a preparação dos arquivos e o carregamento local do conteúdo.
- Criar comandos documentados para desenvolvimento, preparação e geração de pacote.

Entrega: jogo abrindo na janela desktop, com todos os módulos e estilos carregados.

### 2. Garantir funcionamento offline

- Incluir arquivos de fontes e respectivas licenças; substituir as referências remotas por caminhos locais.
- Inventariar recursos externos em HTML, CSS e JavaScript e incluir o que for necessário no pacote.
- Verificar áudio, traduções e assets com a rede desconectada.
- Tratar recursos opcionais de diagnóstico sem impedir a inicialização.

Entrega: abertura e partida completa sem conexão e sem recursos essenciais ausentes.

### 3. Ajustar a experiência de PC

- Revisar os controles existentes e apresentar suas teclas na interface.
- Ocultar joystick e indicadores de toque quando o modo desktop estiver ativo.
- Implementar tela cheia em F11 e opção no menu; definir o comportamento de Esc conforme o estado dos menus e da partida.
- Pausar ao perder o foco e limpar teclas pressionadas para evitar movimento preso ao voltar com Alt+Tab.
- Validar menus, HUD e textos em janela, tela cheia, diferentes resoluções e escalas do Windows.
- Evitar que atalhos de habilidade ou movimento atuem enquanto o usuário interage com campos e menus.

Entrega: fluxo completo utilizável com teclado e mouse. Controle/gamepad fica para uma etapa posterior.

### 4. Preservar progresso e preferências

- Inventariar as chaves de armazenamento e manter compatibilidade com seus formatos existentes.
- Usar um diretório de dados persistente por usuário, fora da instalação, e uma origem local fixa.
- Validar persistência após fechar o aplicativo, reiniciar o Windows e atualizar a versão.
- Planejar exportação/importação de save com versão de formato, validação e backup antes de substituir dados.
- Documentar que o aplicativo não herda automaticamente o `localStorage` do navegador; a transferência exige exportação/importação.

Entrega: progresso e configurações persistentes, com um caminho definido para recuperar e transferir saves.

### 5. Medir desempenho e corrigir problemas

- Usar os diagnósticos existentes para medir tempo por frame, FPS e comportamento em ondas intensas e chefes.
- Comparar a versão desktop com a web no mesmo computador e nas mesmas condições.
- Avaliar consumo de memória e estabilidade em uma sessão de pelo menos 30 minutos.
- Definir qualidade gráfica e limite de resolução interna a partir das medições.
- Verificar áudio, foco, redimensionamento e monitores com diferentes taxas de atualização.

Entrega: resultados registrados e problemas críticos resolvidos. Meta inicial de 60 FPS no equipamento de referência; requisitos mínimos só serão publicados após medição.

### 6. Empacotar e validar a distribuição

- Gerar um pacote Windows x64 e um instalador, com nome, versão e ícone consistentes.
- Excluir ferramentas de desenvolvimento, arquivos temporários e conteúdo desnecessário do pacote.
- Revisar a disponibilização de menus e atalhos de diagnóstico na versão pública.
- Testar instalação, abertura offline, atualização e desinstalação em uma máquina sem ferramentas de desenvolvimento.
- Definir assinatura de código e distribuição antes de uma publicação pública; não incluir atualização automática no primeiro protótipo.
- Documentar instalação, controles, localização dos dados, versão e limitações conhecidas.

Entrega: pacote testado e instruções de uso. Publicação em lojas e integração com Steam são etapas futuras.

## Critérios de conclusão da primeira versão

- [ ] Abre pelo executável em Windows x64 sem exigir navegador ou ferramentas de desenvolvimento instaladas.
- [ ] Funciona offline com fontes, interface e áudio disponíveis.
- [ ] Permite selecionar personagem, jogar, usar habilidade, pausar e concluir uma partida.
- [ ] Teclado e mouse funcionam sem conflito com menus.
- [ ] Alt+Tab não deixa movimento preso nem retoma a partida inesperadamente.
- [ ] Janela, tela cheia e escalas de 100%, 125% e 150% não cortam controles essenciais.
- [ ] Progresso, idioma e qualidade gráfica permanecem após reinicialização e atualização.
- [ ] Sessão de 30 minutos não apresenta falhas críticas; desempenho está documentado.
- [ ] Instalação e desinstalação foram verificadas em ambiente limpo.

## Ordem e estimativa inicial

Atualização da execução: camada Electron, conteúdo offline, integração de PC, transferência de saves e empacotamento implementados. O executável empacotado passou pelos testes funcionais. O teste de 30 minutos foi interrompido a pedido do usuário, após 16 minutos registrados. Instalação em máquina limpa, assinatura pública e testes físicos de monitores permanecem pendentes; detalhes em `VALIDACAO.md`.

Executar as etapas 1 a 6 nessa ordem, validando cada entrega antes de avançar. A primeira ação de implementação será criar a janela Electron e carregar o jogo atual, verificando módulos, assets e armazenamento.

Estimativa de planejamento para uma pessoa: 1–2 dias para o protótipo; 2–4 dias para offline, interface e saves; 2–4 dias para desempenho e distribuição. Total indicativo: 5–10 dias de trabalho, sujeito aos problemas encontrados e à disponibilidade de equipamentos de teste.

Não entram nesta primeira entrega: reescrita em outra engine, multiplayer, novos personagens, mudanças de balanceamento, integração com lojas, saves em nuvem e versões para outros sistemas.
