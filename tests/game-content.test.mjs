import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { setLanguage, getLanguage, t } from '../src/i18n/index.js';
import { ITEMS, SYNERGIES } from '../src/config/items.js';
import { upgradesPool } from '../src/config/upgrades.js';
import { META_TALENTS } from '../src/config/talents.js';
import { ACHIEVEMENTS } from '../src/config/achievements.js';
import { BESTIARY_ENTRIES } from '../src/config/bestiary.js';
import {
  normalizeSavedPassive,
  getSavedPassivePresentation,
  getBestRunPresentation,
  getItemDefinition
} from '../src/i18n/contentPresentation.js';

describe('Migração dos Conteúdos do Jogo (Fase 4)', () => {

  const LOCALES = ['pt-BR', 'en', 'es', 'fr'];

  describe('1. Armas, Passivas, Sinergias e Melhorias', () => {
    test('todos os itens possuem textos dinâmicos nos 4 idiomas preservando dados mecânicos', () => {
      const itemKeys = Object.keys(ITEMS);
      assert.ok(itemKeys.length >= 10, 'Deve haver ao menos 10 itens registrados');

      for (const locale of LOCALES) {
        setLanguage(locale);
        assert.equal(getLanguage(), locale);

        for (const key of itemKeys) {
          const item = ITEMS[key];
          assert.ok(item.id && typeof item.id === 'string', 'ID canônico deve ser preservado');
          assert.ok(item.name && typeof item.name === 'string', `${key} deve ter name em ${locale}`);
          assert.ok(item.description && typeof item.description === 'string', `${key} deve ter description em ${locale}`);
          assert.ok(item.badge && typeof item.badge === 'string', `${key} deve ter badge em ${locale}`);
          assert.ok(typeof item.maxLevel === 'number', `${key} deve manter maxLevel numérico`);
        }
      }
    });

    test('sinergias evolutivas traduzem nome e descrição sem alterar dependências de IDs', () => {
      assert.ok(SYNERGIES.length >= 5, 'Deve haver ao menos 5 sinergias registradas');

      for (const locale of LOCALES) {
        setLanguage(locale);

        for (const syn of SYNERGIES) {
          assert.ok(syn.id, 'Sinergia deve possuir ID canônico');
          assert.ok(syn.weaponId, 'Sinergia deve apontar para weaponId');
          assert.ok(syn.passiveId, 'Sinergia deve apontar para passiveId');
          assert.ok(syn.name, `Sinergia ${syn.id} deve ter name em ${locale}`);
          assert.ok(syn.desc, `Sinergia ${syn.id} deve ter desc em ${locale}`);
        }
      }
    });

    test('upgradesPool possui títulos e descrições dinâmicas nos 4 idiomas', () => {
      assert.ok(upgradesPool.length >= 20, 'Deve haver ao menos 20 upgrades na pool');

      for (const locale of LOCALES) {
        setLanguage(locale);

        for (const up of upgradesPool) {
          assert.ok(up.id, 'Upgrade deve ter ID estável');
          assert.ok(up.title, `Upgrade ${up.id} deve ter title em ${locale}`);
          assert.ok(up.desc, `Upgrade ${up.id} deve ter desc em ${locale}`);
          assert.ok(typeof up.apply === 'function', `Upgrade ${up.id} deve ter apply() intacto`);
        }
      }
    });
  });

  describe('2. Árvore de Talentos Meta (Astrolábio)', () => {
    test('todos os 14 talentos possuem nomes, lore e descrições nos 4 idiomas', () => {
      assert.equal(META_TALENTS.length, 14, 'O Astrolábio deve conter exatamente 14 talentos');

      for (const locale of LOCALES) {
        setLanguage(locale);

        for (const talent of META_TALENTS) {
          assert.ok(talent.id, 'Talento deve ter ID');
          assert.ok(talent.constellation, 'Talento deve ter constelação');
          assert.ok(talent.name, `Talento ${talent.id} deve ter name em ${locale}`);
          assert.ok(talent.desc, `Talento ${talent.id} deve ter desc em ${locale}`);
          assert.ok(talent.lore, `Talento ${talent.id} deve ter lore em ${locale}`);
          assert.ok(talent.statLabel, `Talento ${talent.id} deve ter statLabel em ${locale}`);
          assert.ok(typeof talent.costBase === 'number', 'costBase deve ser numérico');
          assert.ok(typeof talent.getBonus === 'function', 'getBonus deve ser função');

          const formatted = talent.formatVal(1);
          assert.ok(formatted && typeof formatted === 'string', `formatVal() deve retornar string em ${locale}`);
        }
      }
    });
  });

  describe('3. Conquistas Heroicas', () => {
    test('todas as conquistas possuem títulos, lore e táticas traduzidos nos 4 idiomas', () => {
      assert.ok(ACHIEVEMENTS.length >= 20, 'Deve haver ao menos 20 conquistas registradas');

      for (const locale of LOCALES) {
        setLanguage(locale);

        for (const ach of ACHIEVEMENTS) {
          assert.ok(ach.id, 'Conquista deve ter ID');
          assert.ok(ach.title, `Conquista ${ach.id} deve ter title em ${locale}`);
          assert.ok(ach.desc, `Conquista ${ach.id} deve ter desc em ${locale}`);
          assert.ok(ach.lore, `Conquista ${ach.id} deve ter lore em ${locale}`);
          assert.ok(ach.tier, `Conquista ${ach.id} deve ter tier traduzido em ${locale}`);
          assert.ok(typeof ach.target === 'number', 'target deve ser numérico');
          assert.ok(typeof ach.checkProgress === 'function', 'checkProgress deve ser função');
        }
      }
    });
  });

  describe('4. Bestiário e Criaturas', () => {
    test('todas as 45 criaturas possuem nome, lore, táticas e citações traduzidas nos 4 idiomas', () => {
      assert.equal(BESTIARY_ENTRIES.length, 45, 'O Bestiário deve conter 45 criaturas');

      for (const locale of LOCALES) {
        setLanguage(locale);

        for (const creature of BESTIARY_ENTRIES) {
          assert.ok(creature.id, 'Criatura deve ter ID');
          assert.ok(creature.name, `Criatura ${creature.id} deve ter name em ${locale}`);
          assert.ok(creature.title, `Criatura ${creature.id} deve ter title em ${locale}`);
          assert.ok(creature.role, `Criatura ${creature.id} deve ter role em ${locale}`);
          assert.ok(creature.microLore, `Criatura ${creature.id} deve ter microLore em ${locale}`);
          assert.ok(creature.tactics, `Criatura ${creature.id} deve ter tactics em ${locale}`);
          assert.ok(Array.isArray(creature.quotes) && creature.quotes.length >= 1, `Criatura ${creature.id} deve ter quotes em ${locale}`);
          assert.ok(typeof creature.hp === 'number', 'HP deve ser numérico');
          assert.ok(typeof creature.damage === 'number', 'Damage deve ser numérico');
        }
      }
    });
  });

  describe('5. Compatibilidade e Migração de Saves Legados', () => {
    test('normalizeSavedPassive deve converter rótulos legados em português para IDs canônicos', () => {
      const legacy1 = normalizeSavedPassive('Poder Bruto (+20%)');
      assert.equal(legacy1.id, 'dmg');
      assert.equal(legacy1.value, 20);
      assert.equal(legacy1.unit, 'percent');

      const legacy2 = normalizeSavedPassive('Armadura Rúnica');
      assert.equal(legacy2.id, 'armor');

      const legacy3 = normalizeSavedPassive('Asas do Vento (+1.5 Vel)');
      assert.equal(legacy3.id, 'wings');
      assert.equal(legacy3.value, 1.5);
      assert.equal(legacy3.unit, 'speed');
    });

    test('getSavedPassivePresentation deve apresentar passivas salvas no idioma ativo', () => {
      setLanguage('en');
      const presEn = getSavedPassivePresentation('Poder Bruto (+20%)');
      assert.equal(presEn.id, 'dmg');
      assert.equal(presEn.name, 'Raw Power');
      assert.ok(presEn.value.includes('20'));

      setLanguage('pt-BR');
      const presPt = getSavedPassivePresentation('Poder Bruto (+20%)');
      assert.equal(presPt.id, 'dmg');
      assert.equal(presPt.name, 'Poder Bruto');

      setLanguage('fr');
      const presFr = getSavedPassivePresentation('Poder Bruto (+20%)');
      assert.equal(presFr.id, 'dmg');
      assert.equal(presFr.name, 'Puissance brute');
    });

    test('getBestRunPresentation deve formatar recordes antigos sem quebras e com wave.title traduzido', () => {
      const oldRecord = {
        heroKey: 'KNIGHT',
        seconds: 450,
        highestWave: 7,
        souls: 120,
        isVictory: false
      };

      setLanguage('pt-BR');
      const ptPres = getBestRunPresentation(oldRecord);
      assert.equal(ptPres.waveText, 'Onda 7');
      assert.equal(ptPres.heroName, 'Sir Roland');

      setLanguage('en');
      const enPres = getBestRunPresentation(oldRecord);
      assert.equal(enPres.waveText, 'Wave 7');
      assert.equal(enPres.heroTitle, 'The Paladin');

      setLanguage('es');
      const esPres = getBestRunPresentation(oldRecord);
      assert.equal(esPres.waveText, 'Oleada 7');

      setLanguage('fr');
      const frPres = getBestRunPresentation(oldRecord);
      assert.equal(frPres.waveText, 'Vague 7');

      // Restaura para pt-BR
      setLanguage('pt-BR');
    });
  });

});
