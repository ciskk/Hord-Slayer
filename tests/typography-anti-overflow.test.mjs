import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ptBR from '../src/i18n/locales/pt-BR.js';
import en from '../src/i18n/locales/en.js';
import es from '../src/i18n/locales/es.js';
import fr from '../src/i18n/locales/fr.js';

describe('Revisão Tipográfica, Acentuação e Apresentação Anti-Overflow (Fase 6)', () => {

  const catalogs = { 'pt-BR': ptBR, en, es, fr };

  test('todos os catálogos possuem codificação UTF-8 íntegra sem caracteres corrompidos', () => {
    for (const [lang, catalog] of Object.entries(catalogs)) {
      for (const [key, value] of Object.entries(catalog)) {
        if (typeof value === 'string') {
          assert.ok(
            !value.includes('\uFFFD') && !value.includes('Ã©') && !value.includes('Ã¡'),
            `Chave "${key}" em ${lang} contém caractere corrompido: "${value}"`
          );
        }
      }
    }
  });

  test('acentos e caracteres especiais em Português, Francês e Espanhol são válidos', () => {
    // Português: ç, ã, õ, é, ê, á, etc.
    assert.ok(ptBR['match.hud.xp'].includes('Ê'), 'XP em pt-BR deve conter Ê');
    assert.ok(ptBR['match.altar.outOfBounds'].includes('Í'), 'Alerta em pt-BR deve conter Í');

    // Francês: é, è, ê, ô, î, etc.
    assert.ok(fr['match.hud.xp'].includes('É'), 'XP em fr deve conter É');
    assert.ok(fr['match.hud.pauseTip'].includes('É'), 'PauseTip em fr deve conter Échap');
    assert.ok(fr['match.altar.broken'].includes('É'), 'Broken em fr deve conter É');

    // Espanhol: ¡, ¿, ñ, etc.
    assert.ok(es['match.altar.outOfBounds'].includes('¡'), 'Alerta em es deve iniciar com ¡');
    assert.ok(es['match.altar.fulfilled'].includes('¡'), 'Pacto cumprido em es deve iniciar com ¡');
    assert.ok(es['match.altar.broken'].includes('¡'), 'Pacto quebrado em es deve iniciar com ¡');
    assert.ok(es['match.altar.touchHold'].includes('É'), 'Touch hold em es deve conter É');
  });

  test('rótulos do HUD respeitam os limites de extensão para evitar overflow', () => {
    const limits = {
      'match.hud.health': 10,
      'match.hud.xp': 15,
      'match.hud.levelShort': 4,
      'match.hud.gold': 6,
      'match.hud.altarTitle': 22,
      'match.altar.touchBadge': 10
    };

    for (const [lang, catalog] of Object.entries(catalogs)) {
      for (const [key, maxLen] of Object.entries(limits)) {
        const text = catalog[key];
        assert.ok(text, `Chave ${key} deve existir em ${lang}`);
        assert.ok(
          text.length <= maxLen,
          `Texto da chave "${key}" em ${lang} ("${text}", len=${text.length}) excede o limite de ${maxLen} caracteres`
        );
      }
    }
  });

  test('folha de estilo i18n-presentation.css está devidamente integrada no style.css', () => {
    const styleCss = readFileSync(resolve(process.cwd(), 'style.css'), 'utf8');
    assert.ok(
      styleCss.includes('./css/screens/i18n-presentation.css'),
      'style.css deve importar i18n-presentation.css'
    );
  });

  test('i18n-presentation.css contém regras obrigatórias de proteção contra overflow', () => {
    const css = readFileSync(resolve(process.cwd(), 'css/screens/i18n-presentation.css'), 'utf8');

    // Otimização de renderização de texto
    assert.ok(css.includes('text-rendering: optimizeLegibility'), 'Deve ativar optimizeLegibility');

    // Proteção na barra de vida e XP do HUD
    assert.ok(css.includes('.hud-bar-label'), 'Deve ter seletor .hud-bar-label');
    assert.ok(css.includes('text-overflow: ellipsis'), 'Deve aplicar ellipsis');
    assert.ok(css.includes('white-space: nowrap'), 'Deve aplicar white-space nowrap');

    // Ajustes específicos para francês e espanhol
    assert.ok(css.includes(':lang(fr)'), 'Deve conter regras para idioma francês');
    assert.ok(css.includes(':lang(es)'), 'Deve conter regras para idioma espanhol');

    // Truncamento seguro do nome do chefe
    assert.ok(css.includes('#hud #boss-name'), 'Deve proteger #boss-name contra transbordamento');

    // Proteção de modais contra overflow de textos longos
    assert.ok(css.includes('#upgrade-modal'), 'Deve cobrir modal de upgrades');
    assert.ok(css.includes('#chest-modal'), 'Deve cobrir modal de baús');
    assert.ok(css.includes('#game-over-modal'), 'Deve cobrir modal de fim de jogo');
    assert.ok(css.includes('#victory-modal'), 'Deve cobrir modal de vitória');
    assert.ok(css.includes('#talents-modal'), 'Deve cobrir modal do astrolábio');
    assert.ok(css.includes('#bestiary-modal'), 'Deve cobrir modal do bestiário');

    // Tratamento em telas pequenas (mobile portrait / landscape)
    assert.ok(css.includes('@media (max-width: 640px)'), 'Deve conter media query para telas estreitas');
  });

});
