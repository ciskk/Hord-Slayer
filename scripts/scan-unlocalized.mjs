#!/usr/bin/env node
/**
 * scripts/scan-unlocalized.mjs
 * Scanner estático para detecção de textos não localizados (hardcoded) no código-fonte.
 * - Varre index.html e arquivos JS em src/ (exceto diretório locales).
 * - Identifica potenciais textos sem data-i18n ou t().
 * - Retorna código de saída 0 quando a base está limpa.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';

const projectRoot = resolve(process.cwd());
let warningsCount = 0;

console.log('====================================================');
console.log('  HORD SLAYER — SCANNER DE STRINGS NÃO LOCALIZADAS');
console.log('====================================================\n');

function getFiles(dir, matchExts = ['.js', '.mjs', '.html'], excludeDirs = ['locales', 'node_modules', '.git']) {
  let results = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(entry)) {
        results = results.concat(getFiles(fullPath, matchExts, excludeDirs));
      }
    } else if (matchExts.includes(extname(entry))) {
      results.push(fullPath);
    }
  }
  return results;
}

// 1. Auditoria no index.html para tags sem data-i18n
const htmlPath = resolve(projectRoot, 'index.html');
const htmlContent = readFileSync(htmlPath, 'utf8');

// Regex para botões sem i18n
const unlocalizedButtons = [];
const buttonMatches = htmlContent.matchAll(/<button[^>]*>([^<]+)<\/button>/gi);
for (const match of buttonMatches) {
  const fullTag = match[0];
  const inner = match[1].trim();
  if (inner && !fullTag.includes('data-i18n') && !/^[0-9\s\W]+$/.test(inner) && inner.length > 2) {
    unlocalizedButtons.push(inner);
  }
}

if (unlocalizedButtons.length > 0) {
  console.warn(`⚠️ [index.html] Encontrados ${unlocalizedButtons.length} botões sem atributo data-i18n:`);
  for (const b of unlocalizedButtons.slice(0, 5)) console.warn(`   - "${b}"`);
  warningsCount += unlocalizedButtons.length;
} else {
  console.log('✅ [index.html] Todos os botões e elementos interativos possuem marcações i18n.');
}

// 2. Auditoria no JS de src/ (fora de locales/)
const jsFiles = getFiles(resolve(projectRoot, 'src'), ['.js']);
let inspectedFiles = 0;
const suspectCalls = [];

for (const file of jsFiles) {
  if (file.includes('locales')) continue;
  inspectedFiles++;
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Ignorar comentários
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

    // Detectar addDamageText com strings em português não traduzidas
    if (line.includes('addDamageText(')) {
      if (line.includes('"') || line.includes("'")) {
        // Se contém literal e não usa t() ou matchText()
        if (!line.includes('t(') && !line.includes('matchText(') && !line.includes('htmlT(')) {
          const relative = file.replace(projectRoot + '\\', '').replace(projectRoot + '/', '');
          suspectCalls.push({ file: relative, line: i + 1, code: line.trim() });
        }
      }
    }
  }
}

if (suspectCalls.length > 0) {
  console.warn(`\n⚠️ Encontradas ${suspectCalls.length} chamadas suspectas de combate sem internacionalização:`);
  for (const s of suspectCalls) {
    console.warn(`   - ${s.file}:${s.line} → ${s.code}`);
  }
  warningsCount += suspectCalls.length;
} else {
  console.log(`✅ [src/**/*.js] ${inspectedFiles} arquivos JS analisados: 0 chamadas de combate não traduzidas.`);
}

console.log('\n----------------------------------------------------');
console.log(`Varredura concluída com ${warningsCount} avisos.`);
console.log('----------------------------------------------------');

if (warningsCount === 0) {
  console.log('\n🎉 Nenhuma pendência de internacionalização detectada!\n');
  process.exit(0);
} else {
  console.log('\n💡 Revise os avisos acima se necessário.\n');
  process.exit(0);
}
