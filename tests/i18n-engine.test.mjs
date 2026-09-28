import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createI18n } from '../src/i18n/runtime.js';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '../src/i18n/languages.js';
import ptBR from '../src/i18n/locales/pt-BR.js';
import en from '../src/i18n/locales/en.js';
import es from '../src/i18n/locales/es.js';
import fr from '../src/i18n/locales/fr.js';

describe('Sistema Central de Idiomas (i18n Runtime - Fase 2)', () => {

  function createMockStorage(initial = {}) {
    const store = new Map(Object.entries(initial));
    return {
      getItem: key => store.get(key) ?? null,
      setItem: (key, val) => store.set(key, String(val)),
      removeItem: key => store.delete(key),
      clear: () => store.clear()
    };
  }

  function createMockDocument(initialLang = 'pt-BR') {
    return {
      documentElement: {
        lang: initialLang
      }
    };
  }

  const sampleCatalogs = {
    'pt-BR': {
      'greeting': 'Olá, mundo!',
      'welcome.user': 'Bem-vindo, {name}!',
      'coins.one': '{count} moeda',
      'coins.other': '{count} moedas',
      'coins.zero': 'Nenhuma moeda',
      'only.in.pt': 'Texto apenas em português'
    },
    'en': {
      'greeting': 'Hello, world!',
      'welcome.user': 'Welcome, {name}!',
      'coins.one': '{count} coin',
      'coins.other': '{count} coins',
      'coins.zero': 'No coins'
    },
    'es': {
      'greeting': '¡Hola, mundo!',
      'welcome.user': '¡Bienvenido, {name}!'
    },
    'fr': {
      'greeting': 'Bonjour le monde !',
      'welcome.user': 'Bienvenue, {name} !'
    }
  };

  test('deve inicializar com pt-BR por padrão quando não houver preferência nem navegador compatível', () => {
    const storage = createMockStorage();
    const doc = createMockDocument();
    const i18n = createI18n({
      catalogs: sampleCatalogs,
      getStorage: () => storage,
      getBrowserLanguages: () => ['de-DE', 'ja'],
      getDocument: () => doc
    });

    const lang = i18n.initI18n();
    assert.equal(lang, 'pt-BR');
    assert.equal(i18n.getLanguage(), 'pt-BR');
    assert.equal(doc.documentElement.lang, 'pt-BR');
  });

  test('deve respeitar a preferência salva no storage com precedência sobre o navegador', () => {
    const storage = createMockStorage({ [LANGUAGE_STORAGE_KEY]: 'fr' });
    const doc = createMockDocument();
    const i18n = createI18n({
      catalogs: sampleCatalogs,
      getStorage: () => storage,
      getBrowserLanguages: () => ['en-US'],
      getDocument: () => doc
    });

    const lang = i18n.initI18n();
    assert.equal(lang, 'fr');
    assert.equal(i18n.getLanguage(), 'fr');
    assert.equal(doc.documentElement.lang, 'fr');
  });

  test('deve consultar o idioma do navegador na ausência de preferência salva', () => {
    const storage = createMockStorage();
    const doc = createMockDocument();
    const i18n = createI18n({
      catalogs: sampleCatalogs,
      getStorage: () => storage,
      getBrowserLanguages: () => ['es-ES', 'en-US'],
      getDocument: () => doc
    });

    const lang = i18n.initI18n();
    assert.equal(lang, 'es');
    assert.equal(i18n.getLanguage(), 'es');
    assert.equal(doc.documentElement.lang, 'es');
  });

  test('deve alternar o idioma explicitamente via setLanguage e salvar no storage', () => {
    const storage = createMockStorage();
    const doc = createMockDocument();
    const i18n = createI18n({
      catalogs: sampleCatalogs,
      getStorage: () => storage,
      getBrowserLanguages: () => ['pt-BR'],
      getDocument: () => doc
    });

    i18n.initI18n();
    assert.equal(i18n.getLanguage(), 'pt-BR');

    i18n.setLanguage('en');
    assert.equal(i18n.getLanguage(), 'en');
    assert.equal(storage.getItem(LANGUAGE_STORAGE_KEY), 'en');
    assert.equal(doc.documentElement.lang, 'en');

    i18n.setLanguage('es');
    assert.equal(i18n.getLanguage(), 'es');
    assert.equal(storage.getItem(LANGUAGE_STORAGE_KEY), 'es');
    assert.equal(doc.documentElement.lang, 'es');
  });

  test('deve lançar RangeError ao tentar definir um idioma não suportado', () => {
    const i18n = createI18n({ catalogs: sampleCatalogs });
    i18n.initI18n();
    assert.throws(() => i18n.setLanguage('it'), RangeError);
    assert.throws(() => i18n.setLanguage('ru'), RangeError);
  });

  test('deve funcionar graciosamente caso o storage esteja inacessível ou lance erro', () => {
    const brokenStorage = {
      getItem: () => { throw new Error('Blocked storage'); },
      setItem: () => { throw new Error('Blocked storage'); }
    };
    const doc = createMockDocument();
    const i18n = createI18n({
      catalogs: sampleCatalogs,
      getStorage: () => brokenStorage,
      getBrowserLanguages: () => ['en-US'],
      getDocument: () => doc
    });

    assert.doesNotThrow(() => {
      i18n.initI18n();
      i18n.setLanguage('fr');
    });
    assert.equal(i18n.getLanguage(), 'fr');
    assert.equal(doc.documentElement.lang, 'fr');
  });

  test('deve traduzir textos simples e interpolar parâmetros corretamente', () => {
    const i18n = createI18n({ catalogs: sampleCatalogs });
    i18n.initI18n();

    assert.equal(i18n.t('greeting'), 'Olá, mundo!');
    assert.equal(i18n.t('welcome.user', { name: 'Roland' }), 'Bem-vindo, Roland!');

    i18n.setLanguage('en');
    assert.equal(i18n.t('greeting'), 'Hello, world!');
    assert.equal(i18n.t('welcome.user', { name: 'Roland' }), 'Welcome, Roland!');

    i18n.setLanguage('es');
    assert.equal(i18n.t('greeting'), '¡Hola, mundo!');
    assert.equal(i18n.t('welcome.user', { name: 'Roland' }), '¡Bienvenido, Roland!');

    i18n.setLanguage('fr');
    assert.equal(i18n.t('greeting'), 'Bonjour le monde !');
    assert.equal(i18n.t('welcome.user', { name: 'Roland' }), 'Bienvenue, Roland !');
  });

  test('deve manter placeholder visível se parâmetro estiver ausente', () => {
    const i18n = createI18n({ catalogs: sampleCatalogs });
    i18n.initI18n();
    assert.equal(i18n.t('welcome.user'), 'Bem-vindo, {name}!');
    assert.equal(i18n.t('welcome.user', {}), 'Bem-vindo, {name}!');
  });

  test('deve aplicar regras de pluralização e caso zero dinamicamente', () => {
    const i18n = createI18n({ catalogs: sampleCatalogs });
    i18n.initI18n();

    assert.equal(i18n.t('coins', { count: 0 }), 'Nenhuma moeda');
    assert.equal(i18n.t('coins', { count: 1 }), '1 moeda');
    assert.equal(i18n.t('coins', { count: 5 }), '5 moedas');

    i18n.setLanguage('en');
    assert.equal(i18n.t('coins', { count: 0 }), 'No coins');
    assert.equal(i18n.t('coins', { count: 1 }), '1 coin');
    assert.equal(i18n.t('coins', { count: 42 }), '42 coins');
  });

  test('deve recorrer ao português (pt-BR) como fallback caso a chave falte no idioma ativo', () => {
    const i18n = createI18n({ catalogs: sampleCatalogs });
    i18n.initI18n();
    i18n.setLanguage('fr');

    // 'only.in.pt' não existe em 'fr'
    assert.equal(i18n.t('only.in.pt'), 'Texto apenas em português');
  });

  test('deve retornar a própria chave caso ela não exista em nenhum catálogo', () => {
    const i18n = createI18n({ catalogs: sampleCatalogs });
    i18n.initI18n();
    assert.equal(i18n.t('chave.inexistente.no.jogo'), 'chave.inexistente.no.jogo');
  });

  test('deve notificar listeners registrados via onLanguageChange e permitir unsubscribe', () => {
    const i18n = createI18n({ catalogs: sampleCatalogs });
    i18n.initI18n();

    const notifications = [];
    const unsubscribe = i18n.onLanguageChange(evt => {
      notifications.push(evt);
    });

    i18n.setLanguage('en');
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].language, 'en');
    assert.equal(notifications[0].previousLanguage, 'pt-BR');
    assert.equal(notifications[0].locale, 'en-US');

    i18n.setLanguage('fr');
    assert.equal(notifications.length, 2);
    assert.equal(notifications[1].language, 'fr');
    assert.equal(notifications[1].previousLanguage, 'en');

    // Não deve notificar se for o mesmo idioma
    i18n.setLanguage('fr');
    assert.equal(notifications.length, 2);

    // Cancelar subscrição
    unsubscribe();
    i18n.setLanguage('es');
    assert.equal(notifications.length, 2); // Não adicionou novos
  });

  test('deve formatar números e porcentagens de acordo com a localidade', () => {
    const i18n = createI18n({ catalogs: sampleCatalogs });
    i18n.initI18n();

    const numPt = i18n.formatNumber(1500.5);
    assert.ok(numPt.includes(',') || numPt.includes('.'));

    const pctPt = i18n.formatPercent(0.75);
    assert.ok(pctPt.includes('75'));
    assert.ok(pctPt.includes('%'));
  });

  test('deve carregar perfeitamente os catálogos reais do jogo (pt-BR, en, es, fr)', () => {
    const i18n = createI18n({
      catalogs: { 'pt-BR': ptBR, en, es, fr }
    });
    i18n.initI18n();

    // Testa chaves do HUD recém catalogadas
    assert.equal(i18n.t('match.hud.health'), 'VIDA');
    assert.equal(i18n.t('match.hud.xp'), 'EXPERIÊNCIA');

    i18n.setLanguage('en');
    assert.equal(i18n.t('match.hud.health'), 'HEALTH');
    assert.equal(i18n.t('match.hud.xp'), 'EXPERIENCE');
    assert.equal(i18n.t('match.hud.gold'), 'GOLD');

    i18n.setLanguage('es');
    assert.equal(i18n.t('match.hud.health'), 'VIDA');
    assert.equal(i18n.t('match.hud.gold'), 'ORO');

    i18n.setLanguage('fr');
    assert.equal(i18n.t('match.hud.health'), 'VIE');
    assert.equal(i18n.t('match.hud.gold'), 'OR');
  });

});
