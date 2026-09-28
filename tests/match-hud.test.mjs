import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setLanguage, t } from '../src/i18n/index.js';
import { translateDOM } from '../src/i18n/dom.js';
import { getCurrentWave } from '../src/systems/waves.js';

describe('HUD da Partida, Eventos Mundiais e Troca de Idioma ao Vivo (Fase 5)', () => {

  const HUD_KEYS = [
    'match.hud.health',
    'match.hud.xp',
    'match.hud.levelShort',
    'match.hud.levelTip',
    'match.hud.kills',
    'match.hud.killsTip',
    'match.hud.gold',
    'match.hud.goldTip',
    'match.hud.timerTip',
    'match.hud.pauseTip',
    'match.hud.pauseAria',
    'match.hud.vitalityTip',
    'match.hud.xpMedallionTip',
    'match.hud.bossCrestTip',
    'match.hud.bossArch',
    'match.hud.bossTimerTip',
    'match.hud.waveCardTip',
    'match.hud.altarTitle',
    'match.altar.outOfBounds',
    'match.altar.fulfilled',
    'match.altar.broken',
    'match.altar.touchBadge',
    'match.altar.touchHold',
    'match.altar.touchAria'
  ];

  test('todas as chaves do HUD e Altar devem existir e ser não-vazias nos 4 idiomas', () => {
    const languages = ['pt-BR', 'en', 'es', 'fr'];
    for (const lang of languages) {
      setLanguage(lang);
      for (const key of HUD_KEYS) {
        const text = t(key, { time: '1s' });
        assert.ok(text, `Chave ${key} não deve ser vazia em ${lang}`);
        assert.notEqual(text, key, `Chave ${key} não deve retornar a própria chave em ${lang}`);
      }
    }
  });

  test('marcações data-i18n no index.html cobrem todos os elementos essenciais do HUD', () => {
    const htmlPath = resolve(process.cwd(), 'index.html');
    const html = readFileSync(htmlPath, 'utf8');

    // Badges do Topo
    assert.ok(html.includes('data-i18n-title="match.hud.levelTip"'), 'Badge de nível deve ter tooltip traduzível');
    assert.ok(html.includes('data-i18n="match.hud.levelShort"'), 'Badge de nível deve ter texto curto NV traduzível');
    assert.ok(html.includes('data-i18n-title="match.hud.killsTip"'), 'Badge de abates deve ter tooltip traduzível');
    assert.ok(html.includes('data-i18n="match.hud.kills"'), 'Badge de abates deve ter rótulo traduzível');
    assert.ok(html.includes('data-i18n-title="match.hud.goldTip"'), 'Badge de ouro deve ter tooltip traduzível');
    assert.ok(html.includes('data-i18n="match.hud.gold"'), 'Badge de ouro deve ter rótulo traduzível');
    assert.ok(html.includes('data-i18n-title="match.hud.timerTip"'), 'Timer deve ter tooltip traduzível');
    assert.ok(html.includes('data-i18n-title="match.hud.pauseTip"'), 'Botão de pausa deve ter tooltip traduzível');
    assert.ok(html.includes('data-i18n-aria-label="match.hud.pauseAria"'), 'Botão de pausa deve ter aria-label traduzível');

    // Vitais (HP e XP)
    assert.ok(html.includes('data-i18n-title="match.hud.vitalityTip"'), 'Medalhão de HP deve ter tooltip traduzível');
    assert.ok(html.includes('data-i18n="match.hud.health"'), 'Barra de HP deve ter rótulo VIDA traduzível');
    assert.ok(html.includes('data-i18n-title="match.hud.xpMedallionTip"'), 'Medalhão de XP deve ter tooltip traduzível');
    assert.ok(html.includes('data-i18n="match.hud.xp"'), 'Barra de XP deve ter rótulo EXPERIÊNCIA traduzível');

    // HUD do Boss
    assert.ok(html.includes('data-i18n-title="match.hud.bossCrestTip"'), 'Brasão do chefe deve ter tooltip traduzível');
    assert.ok(html.includes('data-i18n="match.hud.bossArch"'), 'Tag de arquichefe deve ser traduzível');
    assert.ok(html.includes('data-i18n-title="match.hud.bossTimerTip"'), 'Timer do chefe deve ter tooltip traduzível');

    // Contexto da Arena e Altar de Sangue
    assert.ok(html.includes('data-i18n-title="match.hud.waveCardTip"'), 'Card de onda deve ter tooltip traduzível');
    assert.ok(html.includes('data-i18n="match.hud.altarTitle"'), 'Título do Altar no HUD deve ser traduzível');
    assert.ok(html.includes('data-i18n-aria-label="match.altar.touchAria"'), 'Botão de toque do altar deve ter aria-label traduzível');
    assert.ok(html.includes('data-i18n="match.altar.touchBadge"'), 'Badge PACTO no botão de toque deve ser traduzível');
    assert.ok(html.includes('data-i18n-html="match.altar.touchHold"'), 'Instrução SEGURE 1s deve usar data-i18n-html');
  });

  test('translateDOM traduz atributos, textContent e HTML com parâmetros', () => {
    function createMockNode(attrs = {}, text = '') {
      const attributes = { ...attrs };
      const children = [];
      return {
        attributes,
        textContent: text,
        innerHTML: text,
        hasAttribute: name => name in attributes,
        getAttribute: name => attributes[name] ?? null,
        setAttribute: (name, val) => { attributes[name] = String(val); },
        matches: selector => {
          const match = selector.match(/\[([a-z0-9_-]+)\]/);
          return match ? match[1] in attributes : false;
        },
        querySelectorAll: selector => {
          const results = [];
          for (const child of children) {
            if (child.matches(selector)) results.push(child);
            results.push(...child.querySelectorAll(selector));
          }
          return results;
        },
        appendChild: child => children.push(child)
      };
    }

    const root = createMockNode();
    const hpLabel = createMockNode({ 'data-i18n': 'match.hud.health' }, 'VIDA');
    const pauseBtn = createMockNode({
      'data-i18n-title': 'match.hud.pauseTip',
      'data-i18n-aria-label': 'match.hud.pauseAria'
    });
    const touchLabel = createMockNode({
      'data-i18n-html': 'match.altar.touchHold',
      'data-i18n-params': JSON.stringify({ time: '1s' })
    }, 'SEGURE <b>1s</b>');

    root.appendChild(hpLabel);
    root.appendChild(pauseBtn);
    root.appendChild(touchLabel);

    // Teste em Inglês
    setLanguage('en');
    translateDOM(root);
    assert.equal(hpLabel.textContent, 'HEALTH');
    assert.equal(pauseBtn.getAttribute('title'), 'Pause Battle [Esc]');
    assert.equal(pauseBtn.getAttribute('aria-label'), 'Pause Battle');
    assert.equal(touchLabel.innerHTML, 'HOLD <b>1s</b>');

    // Teste em Francês
    setLanguage('fr');
    translateDOM(root);
    assert.equal(hpLabel.textContent, 'VIE');
    assert.equal(pauseBtn.getAttribute('title'), 'Mettre en Pause [Échap]');
    assert.equal(pauseBtn.getAttribute('aria-label'), 'Mettre en Pause');
    assert.equal(touchLabel.innerHTML, 'MAINTENEZ <b>1s</b>');

    // Teste em Espanhol
    setLanguage('es');
    translateDOM(root);
    assert.equal(hpLabel.textContent, 'VIDA');
    assert.equal(pauseBtn.getAttribute('title'), 'Pausar Batalla [Esc]');
    assert.equal(pauseBtn.getAttribute('aria-label'), 'Pausar Batalla');
    assert.equal(touchLabel.innerHTML, 'MANTÉN <b>1s</b>');
  });

  test('alertas e mensagens de status do Altar de Sangue traduzem dinamicamente', () => {
    // Alerta de Fora do Círculo
    setLanguage('pt-BR');
    assert.equal(t('match.altar.outOfBounds', { time: '1.5' }), 'FORA DO CÍRCULO! <b>1.5s</b>');
    assert.equal(t('match.altar.fulfilled'), 'PACTO CUMPRIDO!');
    assert.equal(t('match.altar.broken'), 'PACTO QUEBRADO!');

    setLanguage('en');
    assert.equal(t('match.altar.outOfBounds', { time: '1.5' }), 'OUT OF CIRCLE! <b>1.5s</b>');
    assert.equal(t('match.altar.fulfilled'), 'PACT FULFILLED!');
    assert.equal(t('match.altar.broken'), 'PACT BROKEN!');

    setLanguage('es');
    assert.equal(t('match.altar.outOfBounds', { time: '1.5' }), '¡FUERA DEL CÍRCULO! <b>1.5s</b>');
    assert.equal(t('match.altar.fulfilled'), '¡PACTO CUMPLIDO!');
    assert.equal(t('match.altar.broken'), '¡PACTO ROTO!');

    setLanguage('fr');
    assert.equal(t('match.altar.outOfBounds', { time: '1.5' }), 'HORS DU CERCLE ! <b>1.5s</b>');
    assert.equal(t('match.altar.fulfilled'), 'PACTE ACCOMPLI !');
    assert.equal(t('match.altar.broken'), 'PACTE BRISÉ !');
  });

  test('getCurrentWave atualiza o nome da onda dinamicamente com base no idioma ativo', () => {
    // Onda 1 (seconds < 25)
    setLanguage('pt-BR');
    assert.ok(getCurrentWave(10).name.toLowerCase().includes('onda 1'));

    setLanguage('en');
    assert.ok(getCurrentWave(10).name.toLowerCase().includes('wave 1'));

    setLanguage('es');
    assert.ok(getCurrentWave(10).name.toLowerCase().includes('oleada 1'));

    setLanguage('fr');
    assert.ok(getCurrentWave(10).name.toLowerCase().includes('vague 1'));

    // Resetar para pt-BR
    setLanguage('pt-BR');
  });

});
