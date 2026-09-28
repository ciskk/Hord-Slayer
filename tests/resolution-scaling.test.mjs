import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  GRAPHICS_QUALITY,
  getGraphicsQuality,
  setGraphicsQuality,
  resolveTargetDpr,
  layoutMetrics
} from '../src/core/responsive.js';
import ptBR from '../src/i18n/locales/pt-BR.js';
import en from '../src/i18n/locales/en.js';
import es from '../src/i18n/locales/es.js';
import fr from '../src/i18n/locales/fr.js';
import {
  getCurrentCacheDpr,
  getAtlasDimensions,
  clearSpriteCache,
  drawCachedEnemy
} from '../src/render/enemies/spriteCache.js';
import {
  resolveSoilSample,
  clearNaturalTerrainCache
} from '../src/render/environment/naturalTerrain.js';
describe('Resolução Adaptativa e Modos Gráficos (Fase 1)', () => {

  test('deve definir e recuperar corretamente as qualidades gráficas suportadas', () => {
    setGraphicsQuality(GRAPHICS_QUALITY.NATIVE);
    assert.equal(getGraphicsQuality(), GRAPHICS_QUALITY.NATIVE);

    setGraphicsQuality(GRAPHICS_QUALITY.HIGH);
    assert.equal(getGraphicsQuality(), GRAPHICS_QUALITY.HIGH);

    setGraphicsQuality(GRAPHICS_QUALITY.PERFORMANCE);
    assert.equal(getGraphicsQuality(), GRAPHICS_QUALITY.PERFORMANCE);

    // Modo inválido não deve alterar a qualidade atual
    setGraphicsQuality('invalid_mode');
    assert.equal(getGraphicsQuality(), GRAPHICS_QUALITY.PERFORMANCE);
  });

  test('no PC Desktop (DPR 1.0) deve aplicar supersampling no Alto e subsampling no Econômico', () => {
    // Simula ambiente de PC desktop padrão com DPR 1.0
    globalThis.window = { devicePixelRatio: 1.0, innerWidth: 1920, innerHeight: 1080 };

    const nativeScale = resolveTargetDpr(GRAPHICS_QUALITY.NATIVE);
    const highScale = resolveTargetDpr(GRAPHICS_QUALITY.HIGH);
    const perfScale = resolveTargetDpr(GRAPHICS_QUALITY.PERFORMANCE);

    assert.equal(nativeScale, 1.0, 'Nativo no PC deve ser exatamente 1.0x (1080p)');
    assert.equal(highScale, 1.25, 'Alto no PC deve ser 1.25x (supersampling 1350p)');
    assert.equal(perfScale, 0.80, 'Econômico no PC deve ser 0.80x (subsampling 864p)');
  });

  test('no PC Laptop com escala 125% (DPR 1.25) deve manter supersampling e subsampling proporcionais', () => {
    globalThis.window = { devicePixelRatio: 1.25, innerWidth: 1536, innerHeight: 864 };

    const nativeScale = resolveTargetDpr(GRAPHICS_QUALITY.NATIVE);
    const highScale = resolveTargetDpr(GRAPHICS_QUALITY.HIGH);
    const perfScale = resolveTargetDpr(GRAPHICS_QUALITY.PERFORMANCE);

    assert.equal(nativeScale, 1.25, 'Nativo deve seguir o displayPixelRatio físico (1.25x)');
    assert.equal(highScale, 1.56, 'Alto deve aplicar supersampling (1.25 * 1.25 = 1.56x)');
    assert.equal(perfScale, 1.00, 'Econômico deve reduzir para 1.0x');
  });

  test('em dispositivos móveis e telas Retina (DPR 2.0 e 3.0) deve proteger o equilíbrio térmico', () => {
    // Tela Retina padrão (DPR 2.0)
    globalThis.window = { devicePixelRatio: 2.0, innerWidth: 414, innerHeight: 896 };
    assert.equal(resolveTargetDpr(GRAPHICS_QUALITY.NATIVE), 2.0);
    assert.equal(resolveTargetDpr(GRAPHICS_QUALITY.HIGH), 2.0);
    assert.equal(resolveTargetDpr(GRAPHICS_QUALITY.PERFORMANCE), 1.25);

    // Tela High-End / Flagship (DPR 3.0)
    globalThis.window = { devicePixelRatio: 3.0, innerWidth: 390, innerHeight: 844 };
    assert.equal(resolveTargetDpr(GRAPHICS_QUALITY.NATIVE), 3.0);
    assert.equal(resolveTargetDpr(GRAPHICS_QUALITY.HIGH), 2.0, 'Alto deve limitar a 2.0x para poupar bateria');
    assert.equal(resolveTargetDpr(GRAPHICS_QUALITY.PERFORMANCE), 1.25, 'Econômico deve limitar a 1.25x');
  });

  test('todas as chaves de tradução de resolução devem existir e ter conteúdo nos 4 idiomas', () => {
    const catalogs = { 'pt-BR': ptBR, en, es, fr };
    const requiredKeys = [
      'match.settings.resolution',
      'match.settings.resolutionAria',
      'match.settings.native',
      'match.settings.high',
      'match.settings.performance',
      'match.settings.nativeTip',
      'match.settings.highTip',
      'match.settings.powerTip',
      'match.settings.rendering'
    ];

    for (const [lang, catalog] of Object.entries(catalogs)) {
      for (const key of requiredKeys) {
        assert.ok(catalog[key], `Chave ${key} deve existir em ${lang}`);
        assert.ok(catalog[key].trim().length > 0, `Chave ${key} não pode ser vazia em ${lang}`);
      }
    }
  });

  test('o Sprite Cache deve compensar o zoom de câmera (baseCameraZoom) para pixel mapping 1:1 no PC (Fase 2)', () => {
    globalThis.document = {
      createElement: (tag) => {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: () => ({
              imageSmoothingEnabled: false,
              imageSmoothingQuality: 'low',
              clearRect: () => {},
              save: () => {},
              restore: () => {},
              beginPath: () => {},
              rect: () => {},
              clip: () => {},
              translate: () => {},
              scale: () => {},
              drawImage: () => {}
            })
          };
        }
        return {};
      },
      getElementById: () => null
    };

    // Configura layout de PC desktop padrão
    globalThis.window = {
      devicePixelRatio: 1.0,
      innerWidth: 1920,
      innerHeight: 1080,
      requestAnimationFrame: (cb) => setTimeout(cb, 16)
    };
    layoutMetrics.dpr = 1.0;
    layoutMetrics.viewW = 1920;
    layoutMetrics.viewH = 1080;

    const mockRenderer = { draw: () => {} };
    const mockEnemy = {
      baseType: 'ZOMBIE',
      radius: 13,
      x: 0,
      y: 0,
      hitFlash: 0
    };
    const mockTargetCtx = {
      drawImage: () => {}
    };

    clearSpriteCache();
    drawCachedEnemy(mockTargetCtx, mockEnemy, mockRenderer);

    const cacheDpr = getCurrentCacheDpr();
    const dims = getAtlasDimensions();

    // No PC (DPR 1.0 e baseCameraZoom 1.25), o cache DPR deve ser 1.25
    assert.equal(cacheDpr, 1.25, 'Cache DPR no PC deve compensar o zoom 1.25x da câmera');
    assert.equal(dims.cellPixelSize, 120, 'Célula de 96px deve assar em 96 * 1.25 = 120px para coincidir 1:1 com os 120px na tela');
    assert.equal(dims.width, 1920, 'Atlas deve ter 120 * 16 = 1920px de largura');
    assert.equal(dims.height, 1920, 'Atlas deve ter 120 * 16 = 1920px de altura');
  });

  test('o terreno deve usar densidade fina (SOIL_SAMPLE = 2) em Nativo e Alto, e 4 em Econômico (Fase 3)', () => {
    // Modo Nativo e Alto: textura refinada
    setGraphicsQuality(GRAPHICS_QUALITY.NATIVE);
    assert.equal(resolveSoilSample(), 2, 'Nativo deve usar amostragem refinada de solo (sample 2)');

    setGraphicsQuality(GRAPHICS_QUALITY.HIGH);
    assert.equal(resolveSoilSample(), 2, 'Alto deve usar amostragem refinada de solo (sample 2)');

    // Modo Econômico: textura compacta
    setGraphicsQuality(GRAPHICS_QUALITY.PERFORMANCE);
    assert.equal(resolveSoilSample(), 4, 'Econômico deve usar amostragem compacta (sample 4)');

    // Invalidação sem erros
    assert.doesNotThrow(() => {
      clearNaturalTerrainCache();
    });
  });

  test('cálculo de resolução de buffer e formatação do subtexto de renderização (Fase 4)', () => {
    const viewW = 1920;
    const viewH = 1080;

    const testCases = [
      { mode: GRAPHICS_QUALITY.NATIVE, expectedDpr: 1.0, expectedW: 1920, expectedH: 1080 },
      { mode: GRAPHICS_QUALITY.HIGH, expectedDpr: 1.25, expectedW: 2400, expectedH: 1350 },
      { mode: GRAPHICS_QUALITY.PERFORMANCE, expectedDpr: 0.80, expectedW: 1536, expectedH: 864 }
    ];

    for (const { mode, expectedDpr, expectedW, expectedH } of testCases) {
      globalThis.window = {
        devicePixelRatio: 1.0,
        innerWidth: viewW,
        innerHeight: viewH,
        requestAnimationFrame: (cb) => setTimeout(cb, 16)
      };
      const dpr = resolveTargetDpr(mode);
      const bufferW = Math.floor(viewW * dpr);
      const bufferH = Math.floor(viewH * dpr);

      assert.equal(dpr, expectedDpr);
      assert.equal(bufferW, expectedW);
      assert.equal(bufferH, expectedH);
    }
  });
});
