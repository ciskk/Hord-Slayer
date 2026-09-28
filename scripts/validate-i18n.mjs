#!/usr/bin/env node
/**
 * scripts/validate-i18n.mjs
 * Validador oficial de integridade e paridade dos catálogos de internacionalização (i18n).
 * - Verifica paridade estrita de chaves entre pt-BR, en, es e fr.
 * - Valida simetria de parâmetros interpolados {param}.
 * - Detecta strings vazias ou caracteres corrompidos (mojibake).
 * - Retorna exit code 0 para sucesso e 1 para discrepâncias (apto para CI).
 */

import ptBR from '../src/i18n/locales/pt-BR.js';
import en from '../src/i18n/locales/en.js';
import es from '../src/i18n/locales/es.js';
import fr from '../src/i18n/locales/fr.js';

const catalogs = {
  'pt-BR': ptBR,
  'en': en,
  'es': es,
  'fr': fr
};

const DEFAULT_LANG = 'pt-BR';
const languages = Object.keys(catalogs);
const canonicalKeys = new Set(Object.keys(catalogs[DEFAULT_LANG]));

let errorsCount = 0;
let warningsCount = 0;

function extractParams(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(1, -1)))].sort();
}

console.log('====================================================');
console.log('  HORD SLAYER — VALIDAÇÃO DE CATÁLOGOS I18N');
console.log('====================================================\n');
console.log(`Idiomas analisados: ${languages.join(', ')}`);
console.log(`Chaves no idioma de referência (${DEFAULT_LANG}): ${canonicalKeys.size}\n`);

// 1. Verificação de Paridade de Chaves
for (const lang of languages) {
  if (lang === DEFAULT_LANG) continue;
  const targetKeys = new Set(Object.keys(catalogs[lang]));

  // Chaves faltando no idioma secundário
  const missing = [];
  for (const key of canonicalKeys) {
    if (!targetKeys.has(key)) missing.push(key);
  }

  // Chaves sobrando no idioma secundário
  const extra = [];
  for (const key of targetKeys) {
    if (!canonicalKeys.has(key)) extra.push(key);
  }

  if (missing.length > 0) {
    errorsCount += missing.length;
    console.error(`❌ [${lang}] Faltam ${missing.length} chaves presentes em ${DEFAULT_LANG}:`);
    for (const k of missing.slice(0, 10)) console.error(`   - ${k}`);
    if (missing.length > 10) console.error(`   ... e mais ${missing.length - 10} chaves.`);
  }

  if (extra.length > 0) {
    warningsCount += extra.length;
    console.warn(`⚠️ [${lang}] Existem ${extra.length} chaves não encontradas em ${DEFAULT_LANG}:`);
    for (const k of extra.slice(0, 5)) console.warn(`   - ${k}`);
  }

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✅ [${lang}] Paridade 100% com ${DEFAULT_LANG} (${targetKeys.size} chaves)`);
  }
}

// 2. Verificação de Simetria de Parâmetros e Sanidade Textual
console.log('\nVerificando simetria de parâmetros {placeholder} e integridade UTF-8...');
let paramMismatches = 0;
let corruptedStrings = 0;
let emptyStrings = 0;

for (const key of canonicalKeys) {
  const refText = catalogs[DEFAULT_LANG][key];
  const refParams = extractParams(refText);

  for (const lang of languages) {
    const val = catalogs[lang][key];

    if (val === undefined) continue;

    if (typeof val !== 'string' || val.trim().length === 0) {
      console.error(`❌ [${lang}] Chave "${key}" está vazia ou não é uma string.`);
      emptyStrings++;
      errorsCount++;
      continue;
    }

    if (val.includes('\uFFFD') || val.includes('Ã©') || val.includes('Ã¡')) {
      console.error(`❌ [${lang}] Chave "${key}" contém caractere possivelmente corrompido: "${val}"`);
      corruptedStrings++;
      errorsCount++;
    }

    const valParams = extractParams(val);
    const refParamSet = new Set(refParams);
    const valParamSet = new Set(valParams);

    // Comparar parâmetros
    const missingParams = refParams.filter(p => !valParamSet.has(p));
    const extraParams = valParams.filter(p => !refParamSet.has(p));

    if (missingParams.length > 0 || extraParams.length > 0) {
      console.error(`❌ [${lang}] Divergência de parâmetros na chave "${key}":`);
      console.error(`   Esperado (${DEFAULT_LANG}): {${refParams.join(', ')}}`);
      console.error(`   Recebido (${lang}):         {${valParams.join(', ')}}`);
      paramMismatches++;
      errorsCount++;
    }
  }
}

console.log('\n----------------------------------------------------');
console.log(`Total de chaves validadas por idioma: ${canonicalKeys.size}`);
console.log(`Erros encontrados: ${errorsCount}`);
console.log(`Avisos encontrados: ${warningsCount}`);
console.log('----------------------------------------------------');

if (errorsCount > 0) {
  console.error('\n💥 Falha na validação de catálogos i18n! Corrija as inconsistências acima.\n');
  process.exit(1);
} else {
  console.log('\n🎉 Catálogos de i18n íntegros, simétricos e 100% em conformidade!\n');
  process.exit(0);
}
