# Hord Slayer — Windows

Versão inicial: 0.1.0. Alvo de distribuição: Windows x64.

## Jogar

O instalador fica em `out/releases/HordSlayer-Setup.exe`. Execute-o e use o atalho **Hord Slayer** criado no Windows.

Para usar a versão portátil, extraia **todo** o arquivo `out/releases/HordSlayer-PC-0.1.0.zip` para uma pasta e abra `Hord Slayer.exe`. Mantenha os demais arquivos ao lado do executável. Não é necessário instalar Node.js, npm ou abrir um navegador para jogar.

O jogo e as fontes estão incluídos no pacote. A execução bloqueia requisições de rede e funciona sem conexão. A versão 0.1.0 não possui atualizador automático nem integração com lojas. O instalador depende dos componentes usuais do Windows necessários ao Squirrel; a versão portátil dispensa o instalador.

## Controles

| Ação | Controle |
| --- | --- |
| Movimentar | WASD ou setas |
| Habilidade | Espaço, E ou botão direito do mouse |
| Canalizar altar | Segurar F perto do altar |
| Pausar / fechar menus | Esc ou P, conforme a tela |
| Tela cheia | F11 ou menu Jogo → Tela cheia |
| Retomar | Botão Retomar, Esc ou Espaço na pausa |

O menu **Ajuda → Controles e saves** também mostra essas informações. Ao perder o foco, o jogo pausa e limpa as teclas pressionadas; a retomada é manual. Configurações de qualidade e idioma continuam disponíveis na tela de pausa. Gamepad ainda não foi implementado.

## Progresso, transferência e recuperação

Os dados ficam em `%APPDATA%\Hord Slayer`, fora da pasta de instalação. A origem local `app://game` e o nome desse diretório permanecem estáveis entre versões. Os saves preservam progresso permanente, conquistas, recordes, bestiário, idioma e qualidade gráfica; não retomam uma partida em andamento.

- Para salvar uma cópia: **Jogo → Exportar progresso**.
- Para restaurar ou transferir: volte ao menu inicial e use **Jogo → Importar progresso**. A importação substitui as chaves de progresso/preferências pelo conteúdo do arquivo e reinicia a interface.
- Antes de importar, o aplicativo pede confirmação da substituição e grava uma cópia do estado anterior em `%APPDATA%\Hord Slayer\backups\before-import-*.json`.
- Para desfazer uma importação, importe o backup correspondente. Arquivos incompatíveis são recusados antes de alterar os dados.

O aplicativo tem armazenamento separado do navegador. Para transferir o progresso web, abra o jogo no navegador em que você já joga, volte ao menu inicial, abra o console de desenvolvimento e execute o conteúdo de `tools/export-browser-save.js`. O navegador baixará um JSON que poderá ser importado pelo menu do aplicativo. Execute esse script no endereço original do jogo para acessar o armazenamento correto.

Para desinstalar a versão instalada, use **Configurações do Windows → Aplicativos → Hord Slayer**. A versão portátil pode ser removida apagando a pasta extraída. Os dados persistentes são mantidos para recuperação; exporte um save antes de removê-los manualmente.

## Desenvolver e reconstruir

Requer Node.js compatível com Electron/Forge (neste ambiente: Node 24.15.0) e npm. Execute os comandos dentro desta pasta:

```powershell
npm.cmd ci
npm.cmd start
npm.cmd test
npm.cmd run test:smoke
npm.cmd run test:soak
npm.cmd run make
```

`prepare:game` copia o código da raiz, inclui fontes e licenças, gera o ícone e aplica a integração desktop ao conteúdo gerado. `app/`, `out/` e `test-results/` são saídas locais ignoradas pelo Git. Edite o jogo em `../src`, `../css`, `../index.html` e `../style.css`; edite a integração desktop em `desktop/`. Não edite `app/` diretamente.

Os testes usam um perfil temporário separado, janelas sem exibição e renderização offscreen a 60 Hz. A sessão prolongada usa um herói invulnerável e escolhas automáticas para manter o jogo ativo durante 30 minutos. Esse ambiente mede cadência de callbacks e tempo de CPU, não a apresentação dos quadros no monitor. Os testes de tamanho simulam áreas disponíveis de 100%, 125% e 150%; não alteram a escala do Windows. O relatório de validação distingue esses testes das verificações físicas do Windows.

Para testar o pacote gerado:

```powershell
$packagePath = (Get-Content '.\out\latest-package.json' | ConvertFrom-Json).paths[0]
$env:HORD_TEST_EXECUTABLE = Join-Path $packagePath 'Hord Slayer.exe'
node tests/smoke.cjs
Remove-Item Env:HORD_TEST_EXECUTABLE
```

O comando `npm.cmd start` remove `ELECTRON_RUN_AS_NODE` apenas do processo filho para iniciar Electron corretamente mesmo em terminais que definem essa variável. Para habilitar o laboratório de desempenho e os atalhos de desenvolvimento, use `npm.cmd start -- --diagnostics`. Eles ficam desabilitados no pacote público. Cada compilação usa uma pasta própria em `out/builds`; os pacotes finais e seus hashes SHA-256 ficam em `out/releases`.

## Distribuição

Esta compilação local não é assinada digitalmente. Antes de uma publicação pública, obter um certificado/serviço de assinatura e configurar a assinatura no empacotamento, além de validar instalação, atualização e desinstalação em um Windows limpo. Requisitos mínimos e suporte a outras arquiteturas/sistemas dependem de testes adicionais.

As fontes Cinzel, Cinzel Decorative e Outfit vêm dos pacotes Fontsource; as licenças correspondentes acompanham o conteúdo em `app/assets/fonts`. Electron inclui suas licenças na distribuição. Documentação de referência: [segurança do Electron](https://www.electronjs.org/docs/latest/tutorial/security) e [renderização offscreen](https://az.electronjs.org/docs/latest/tutorial/offscreen-rendering).
