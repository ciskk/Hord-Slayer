# Validação — Hord Slayer PC 0.1.0

Data: 29/09/2026. Ambiente: Windows x64, Node 24.15.0, Electron 44.5.0. Os testes usaram perfis temporários; o progresso do usuário não foi utilizado.

## Resultado

Instalador e ZIP portátil gerados em `out/releases`. O executável empacotado passou pela bateria funcional; os relatórios estão em `test-results/smoke.json` e `test-results/smoke-packaged.json`. Os hashes SHA-256 e tamanhos dos arquivos estão em `out/releases/manifest.json`.

| Verificação | Resultado |
| --- | --- |
| Protocolo local, módulos, estilos e inicialização | Passou no desenvolvimento e no executável empacotado |
| Recarga offline e fontes Cinzel/Cinzel Decorative/Outfit | Passou |
| Renderer sem Node, com isolamento e sandbox | Passou |
| Bloqueio de caminhos externos e novas janelas | Passou |
| Exportação e importação de saves com backup real em disco | Passou; diálogos simulados no teste |
| Save inválido recusado sem alterar dados | Passou |
| Seleção de personagem, movimento, habilidade e áudio | Passou |
| Perda de foco, limpeza de teclas e retomada manual | Passou; inclui perda de foco durante animação de retomada |
| Campos de formulário sem acionar atalhos de combate | Passou |
| F11 | Handler testado com chamadas de tela cheia simuladas; falta verificação física no Windows |
| Menus em áreas equivalentes a 100%, 125% e 150% | Passou; áreas simuladas, sem alterar a escala do Windows |
| Progresso, idioma e qualidade após reiniciar o aplicativo | Passou |
| Quatro chefes | Renderização e atualização verificadas em perfil de teste |
| Vitória, derrota e retorno ao menu | Passou com gatilhos de teste; relatório em `test-results/encounters.json` |

As capturas de tela estão em `test-results/`. A inspeção visual levou ao ajuste de escala do menu desktop para manter os botões acessíveis em áreas pequenas.

## Desempenho e teste interrompido

A comparação curta usou o mesmo runtime Electron/Chromium, computador e viewport de 1280 × 800, com a camada desktop desabilitada para a referência web. Cada cenário durou 30 segundos. A cadência foi 59,77 callbacks/s na referência e 59,80 no desktop. Esses números medem callbacks de `requestAnimationFrame` e submissão de CPU em renderização offscreen; não representam apresentação física de quadros nem definem requisitos mínimos. Os inimigos têm comportamento aleatório, portanto a comparação é indicativa.

O teste originalmente previsto para 30 minutos foi **encerrado a pedido do usuário**. Foram registrados 16 minutos, sem erros de execução nem requisições de rede nas amostras. Ele utilizou um herói invulnerável e escolhas automáticas; não comprova uma partida normal completa, nem conclusão dos 30 minutos. Dados disponíveis em `test-results/soak.json`.

## Limites desta entrega

- Instalador gerado, mas instalação, atualização e desinstalação em um Windows limpo não foram executadas.
- Reinicialização do sistema, múltiplos monitores, taxas de atualização e áudio físico ainda não foram verificados.
- A compilação não tem assinatura de código. Assinatura e validação em máquina limpa ficam para a publicação pública.
- Os testes de chefes usam ferramentas de desenvolvimento, e os fluxos de resultado usam gatilhos de teste; isso não representa uma campanha concluída pelo jogador.
- Não foram adicionados gamepad, nuvem, atualizador automático ou integração com lojas.

O arquivo `PLANO.md` permanece como referência do escopo original. O teste prolongado deixou de ser uma condição de entrega conforme a instrução posterior do usuário.
