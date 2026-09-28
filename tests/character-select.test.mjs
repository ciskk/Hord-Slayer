import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { setLanguage, getLanguage, t } from '../src/i18n/index.js';
import { getHeroPresentation, getUnlockPresentation, getHeroStatusLabel } from '../src/i18n/characterPresentation.js';
import { CHARACTERS } from '../src/config/characters.js';
import ptBR from '../src/i18n/locales/pt-BR.js';
import en from '../src/i18n/locales/en.js';
import es from '../src/i18n/locales/es.js';
import fr from '../src/i18n/locales/fr.js';

describe('Validação da Tela Inicial e Seleção de Personagens (Fase 3)', () => {

  const HERO_KEYS = ['KNIGHT', 'MAGE', 'ROGUE', 'BARBARIAN', 'ALCHEMIST'];
  const LOCALES = ['pt-BR', 'en', 'es', 'fr'];

  test('todas as chaves essenciais de characterSelect devem existir nos 4 idiomas', () => {
    const requiredKeys = [
      'characterSelect.title',
      'characterSelect.eyebrow',
      'characterSelect.souls',
      'characterSelect.soulsTitle',
      'characterSelect.bestiary',
      'characterSelect.achievements',
      'characterSelect.talents',
      'characterSelect.archetypes',
      'characterSelect.awakened',
      'characterSelect.navigate',
      'characterSelect.rotate',
      'characterSelect.rotateLabel',
      'characterSelect.idle',
      'characterSelect.attack',
      'characterSelect.power',
      'characterSelect.details',
      'characterSelect.sealHeading',
      'characterSelect.sealActive',
      'characterSelect.viewCodex',
      'characterSelect.understood',
      'settings.language.label',
      'settings.language.ariaLabel'
    ];

    const catalogs = { 'pt-BR': ptBR, en, es, fr };

    for (const locale of LOCALES) {
      const catalog = catalogs[locale];
      for (const key of requiredKeys) {
        assert.ok(
          catalog[key],
          `Chave "${key}" ausente no catálogo de idioma "${locale}"`
        );
      }
    }
  });

  test('todos os 5 heróis devem ter biografia, arma, passiva e habilidade traduzidas nos 4 idiomas', () => {
    for (const locale of LOCALES) {
      setLanguage(locale);
      assert.equal(getLanguage(), locale);

      for (const heroKey of HERO_KEYS) {
        const rawDef = CHARACTERS[heroKey];
        assert.ok(rawDef, `Definição básica de ${heroKey} deve existir`);

        const pres = getHeroPresentation(heroKey, rawDef);

        assert.ok(pres.title, `${heroKey} em ${locale} deve ter title`);
        assert.ok(pres.role, `${heroKey} em ${locale} deve ter role`);
        assert.ok(pres.lore, `${heroKey} em ${locale} deve ter lore`);
        assert.ok(pres.weapon.name, `${heroKey} em ${locale} deve ter weapon.name`);
        assert.ok(pres.weapon.desc, `${heroKey} em ${locale} deve ter weapon.desc`);
        assert.ok(pres.passive.name, `${heroKey} em ${locale} deve ter passive.name`);
        assert.ok(pres.passive.desc, `${heroKey} em ${locale} deve ter passive.desc`);
        assert.ok(pres.skill.name, `${heroKey} em ${locale} deve ter skill.name`);
        assert.ok(pres.skill.desc, `${heroKey} em ${locale} deve ter skill.desc`);
        assert.ok(pres.skill.cooldown, `${heroKey} em ${locale} deve ter skill.cooldown formatado`);
      }
    }
  });

  test('getUnlockPresentation deve formatar os requisitos dos heróis bloqueados nos 4 idiomas', () => {
    const unlockIds = ['hero_ignis', 'hero_kael', 'hero_kragdor', 'hero_valeria'];

    for (const locale of LOCALES) {
      setLanguage(locale);

      for (const id of unlockIds) {
        const fakeStatus = { target: 1, current: 0, isMet: false };
        const pres = getUnlockPresentation(id, fakeStatus);

        assert.ok(pres, `Apresentação de desbloqueio para ${id} em ${locale} deve existir`);
        assert.ok(pres.title, `${id} em ${locale} deve ter título de conquista`);
        assert.ok(pres.desc, `${id} em ${locale} deve ter descrição de desbloqueio`);
      }
    }
  });

  test('getHeroStatusLabel deve retornar rótulo adequado para todos os estados de herói nos 4 idiomas', () => {
    const testCases = [
      { record: { unlocked: false }, expectedKey: 'locked' },
      { record: { unlocked: true, victories: 3 }, expectedKey: 'legendary' },
      { record: { unlocked: true, victories: 1 }, expectedKey: 'victorious' },
      { record: { unlocked: true, victories: 0, bestSeconds: 700 }, expectedKey: 'consecrated' },
      { record: { unlocked: true, victories: 0, bestSeconds: 350 }, expectedKey: 'veteran' },
      { record: { unlocked: true, victories: 0, bestSeconds: 100, runsPlayed: 2 }, expectedKey: 'fighter' },
      { record: { unlocked: true, victories: 0, bestSeconds: 0, runsPlayed: 0 }, expectedKey: 'awake' }
    ];

    for (const locale of LOCALES) {
      setLanguage(locale);

      for (const tc of testCases) {
        const label = getHeroStatusLabel(tc.record);
        assert.ok(label, `Rótulo para ${tc.expectedKey} em ${locale} deve existir`);
        assert.equal(label, t(`progression.heroStatus.${tc.expectedKey}`));
      }
    }
  });

  test('alternar idioma deve preservar as propriedades mecânicas e atualizar apresentação', () => {
    setLanguage('pt-BR');
    const knightPt = getHeroPresentation('KNIGHT', CHARACTERS.KNIGHT);
    assert.equal(knightPt.title, 'O Paladino');
    assert.equal(knightPt.maxHp, CHARACTERS.KNIGHT.maxHp);
    assert.equal(knightPt.speed, CHARACTERS.KNIGHT.speed);

    setLanguage('en');
    const knightEn = getHeroPresentation('KNIGHT', CHARACTERS.KNIGHT);
    assert.equal(knightEn.title, 'The Paladin');
    // Mecânicas idênticas
    assert.equal(knightEn.maxHp, knightPt.maxHp);
    assert.equal(knightEn.speed, knightPt.speed);

    setLanguage('es');
    const knightEs = getHeroPresentation('KNIGHT', CHARACTERS.KNIGHT);
    assert.equal(knightEs.title, 'El Paladín');

    setLanguage('fr');
    const knightFr = getHeroPresentation('KNIGHT', CHARACTERS.KNIGHT);
    assert.equal(knightFr.title, 'Le Paladin');

    // Restaura idioma para pt-BR
    setLanguage('pt-BR');
  });

});
