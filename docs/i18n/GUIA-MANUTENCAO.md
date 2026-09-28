# Guia de Manutenção e Expansão da Internacionalização (i18n) — Hord Slayer

Este guia detalha os padrões arquiteturais, convenções de nomenclatura e procedimentos para manter e expandir o sistema de localização do **Hord Slayer** entre os 4 idiomas suportados: **Português (`pt-BR`)**, **English (`en`)**, **Español (`es`)** e **Français (`fr`)**.

---

## 1. Arquitetura do Sistema

O sistema de internacionalização é composto por três camadas desacopladas:

```
src/i18n/
├── languages.js               # Definição e metadados dos idiomas suportados
├── runtime.js                 # Engine do i18n (eventos, persistência, interpolação, plurais)
├── index.js                   # API pública singleton: t(), setLanguage(), getLanguage(), subscribe()
├── dom.js                     # Binds declarativos do HTML via data-i18n e data-i18n-aria-label
├── characterPresentation.js   # Adaptação para tela de heróis sem alterar estado mecânico
├── contentPresentation.js     # Adaptação para armas, passivas, sinergias e conquistas
├── matchIntegration.js        # Adaptação durante a partida (HUD, Pausa, Altar, Resultados)
└── locales/
    ├── pt-BR/ (characterSelect.js, content.js, match.js)
    ├── en/    (characterSelect.js, content.js, match.js)
    ├── es/    (characterSelect.js, content.js, match.js)
    └── fr/    (characterSelect.js, content.js, match.js)
```

### Princípios Cardeais
1. **Desacoplamento Mecânico**: IDs internos (ex: `'SWORD'`, `'FIRE_WAND'`, `'BOSS_1'`), tags de sinergia e lógica de combate operam **sempre** em chaves canônicas imutáveis. Textos traduzidos existem exclusivamente na camada de apresentação.
2. **Reatividade Instantânea**: A troca de idioma durante a partida atualiza imediatamente todos os textos sem recarregar a página e sem reiniciar o loop de jogo.
3. **Paridade Estrita**: Uma chave adicionada a um idioma deve obrigatoriamente existir em todos os 4 catálogos com os mesmos parâmetros (`{param}`).

---

## 2. Como Adicionar Novos Textos

### Passo 1: Escolha a Convenção da Chave
As chaves seguem o formato hierárquico `namespace.categoria.id.campo`:

| Domínio | Convenção | Exemplo |
|---|---|---|
| Heróis | `characterSelect.heroes.<ID>.<field>` | `characterSelect.heroes.VALKYRIE.name` |
| Itens e Armas | `content.items.<ID>.name` ou `.desc` | `content.items.FIRE_RING.name` |
| Sinergias | `content.synergies.<ID>.name` ou `.desc` | `content.synergies.evolved_sword.name` |
| Conquistas | `content.achievements.<ID>.title` ou `.desc` | `content.achievements.SURVIVE_15.title` |
| Barks de Combate | `match.combat.<name>` | `match.combat.reaperSpeed` |
| Chefes & Bestiário | `creatures.<ID>.name` / `bestiary.<ID>.desc` | `creatures.BOSS_1.name` |
| Telas & Menus | `match.<screen>.<element>` | `match.pause.resume` |

### Passo 2: Registrar nos 4 Catálogos
Abra os arquivos correspondentes em `src/i18n/locales/<idioma>/` e adicione a mesma chave:

```javascript
// src/i18n/locales/pt-BR/match.js
"match.combat.frostNova": "NOVA GÉLIDA!",

// src/i18n/locales/en/match.js
"match.combat.frostNova": "FROST NOVA!",

// src/i18n/locales/es/match.js
"match.combat.frostNova": "¡NOVA GÉLIDA!",

// src/i18n/locales/fr/match.js
"match.combat.frostNova": "NOVA DE GIVRE !"
```

### Passo 3: Utilização no Código

#### No HTML Declarativo:
```html
<span data-i18n="match.pause.resume">CONTINUAR</span>
<span data-i18n-html="match.altar.touchHold" data-i18n-params='{"time":"1s"}'>SEGURE <b>1s</b></span>
<div class="hud-badge" data-i18n-title="match.hud.levelTip">...</div>
<button data-i18n-aria-label="match.pause.closeAria"></button>
```

#### No JavaScript / Lógica de Jogo:
```javascript
import { t } from '../i18n/index.js';

// Texto simples
const label = t('match.combat.frostNova');

// Texto com interpolação de parâmetros
const msg = t('match.combat.goldDrop', { amount: 50 });

// Pluralização dinâmica (.one / .other)
const killsText = t('match.results.evolvedCount', { count: totalEvolved });
```

---

## 3. Diretrizes de Apresentação e Tipografia

### Regra Anti-Overflow
Idiomas neolatinos (Francês e Espanhol) expandem o texto em média **20% a 35%** em relação ao Inglês.
- **Botões e Modais**: Utilize classes utilitárias de `css/screens/i18n-presentation.css` como `.i18n-text-flexible`, `max-width`, `word-break: break-word` ou `white-space: normal`.
- **Canvas / Textos Flutuantes**: Sempre use medição de texto e escalonamento automático:
  ```javascript
  const maxWidth = 300;
  let fontSize = 24;
  ctx.font = `bold ${fontSize}px Cinzel, serif`;
  const measured = ctx.measureText(text).width;
  if (measured > maxWidth) {
    fontSize = Math.max(14, Math.floor(fontSize * (maxWidth / measured)));
    ctx.font = `bold ${fontSize}px Cinzel, serif`;
  }
  ```

### Caracteres Especiais e Pontuação
- Francês utiliza espaço insecável antes de pontuação dupla (` !`, ` ?`, ` :`).
- Espanhol utiliza pontos de exclamação e interrogação invertidos (`¡... !`, `¿... ?`).
- Mantenha sempre a codificação em **UTF-8 sem BOM**.

---

## 4. Ferramentas Automatizadas de Validação

### 4.1 Linter de Catálogos (`scripts/validate-i18n.mjs`)
Verifica paridade absoluta entre chaves, simetria de parâmetros `{placeholder}`, ausência de caracteres corrompidos e tags HTML balanceadas:

```bash
npm run lint:i18n
# ou diretamente: node scripts/validate-i18n.mjs
```

### 4.2 Scanner de Textos Não Localizados (`scripts/scan-unlocalized.mjs`)
Realiza varredura estática no código-fonte em busca de literais em português remanescentes em alertas, combat texts e chamadas de renderização:

```bash
npm run scan:i18n
# ou diretamente: node scripts/scan-unlocalized.mjs
```

### 4.3 Suíte de Testes Automatizados
Executa todos os 38 testes unitários, de regressão, anti-overflow e de ciclo de vida completo (E2E), além do linter:

```bash
npm test
# ou apenas os testes: node --test tests/*.test.mjs
```

---

## 5. Checklist para Nova Release ou Atualização de Conteúdo

1. [ ] Novos heróis/itens/conquistas foram definidos com chave canônica estável em inglês/maiúsculas.
2. [ ] Todas as novas chaves foram adicionadas simultaneamente em `pt-BR`, `en`, `es` e `fr`.
3. [ ] Parâmetros dinâmicos (`{amount}`, `{name}`, etc.) possuem nomes idênticos em todos os idiomas.
4. [ ] O comando `npm test` passou com 100% de sucesso (38 testes + linter).
5. [ ] O comando `npm run scan:i18n` retornou 0 avisos.
6. [ ] A interface foi testada em francês para verificar limites de largura em modais e cards.
