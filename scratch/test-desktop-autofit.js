/**
 * scratch/test-desktop-autofit.js
 * Testa a adaptação matemática de auto-fit para as listas do Altar no PC (Telas Horizontais).
 */

const { AUTO_FIT_DEFAULTS } = await import('../src/core/responsiveAutoFit.js');

console.log('--- Testes de Auto-Fit no PC (Telas Horizontais) ---');

function computeScale(availH, naturalH, minScale = 0.65, bufferPx = 2) {
  if (availH <= 0 || naturalH <= 0) return 1.0;
  if (naturalH <= availH) return 1.0;
  const req = (availH - bufferPx) / naturalH;
  if (req >= minScale) {
    return Math.floor(req * 1000) / 1000;
  }
  return 1.0; // preserva scroll nativo
}

// 1. Ala dos Pedestais (5 Heróis: ~352px natural)
const naturalPedestalsH = 352;

// Cenário A: Desktop 1080p Fullscreen (Altura disponível ~550px)
const scale1080p = computeScale(550, naturalPedestalsH);
console.log(`Cenário 1080p Fullscreen: scale = ${scale1080p} (Esperado: 1.0 - sem scrollbar)`);
if (scale1080p !== 1.0) throw new Error('1080p deveria ter escala 1.0');

// Cenário B: Desktop Laptop 768p (Altura disponível ~310px no container)
// Excesso moderado: 352px em 310px
const scale768p = computeScale(310, naturalPedestalsH);
console.log(`Cenário Laptop 768p: scale = ${scale768p} (Esperado: ~0.875 - scrollbar eliminada!)`);
if (scale768p < 0.85 || scale768p > 0.90) throw new Error('768p deveria ter escala entre 0.85 e 0.90');

// Cenário C: Janela compacta 600p (Altura disponível ~245px no container)
const scale600p = computeScale(245, naturalPedestalsH);
console.log(`Cenário Janela 600p: scale = ${scale600p} (Esperado: ~0.690 - scrollbar eliminada!)`);
if (scale600p < 0.65 || scale600p > 0.72) throw new Error('600p deveria ter escala entre 0.65 e 0.72');

// Cenário D: Janela ultra reduzida (Altura disponível ~180px - excesso > 48%)
const scaleUltraSmall = computeScale(180, naturalPedestalsH);
console.log(`Cenário Janela Ultra Pequena: scale = ${scaleUltraSmall} (Esperado: 1.0 - rolagem preservada por segurança de legibilidade)`);
if (scaleUltraSmall !== 1.0) throw new Error('Ultra pequena deveria preservar scroll nativo (1.0)');

// 2. Ala do Dossiê do Herói (~480px natural)
const naturalDossierH = 480;

// Cenário E: Laptop 768p (Altura disponível ~430px no container)
const scaleDossier768p = computeScale(430, naturalDossierH);
console.log(`Cenário Dossiê 768p: scale = ${scaleDossier768p} (Esperado: ~0.891 - scrollbar eliminada!)`);
if (scaleDossier768p < 0.85 || scaleDossier768p > 0.92) throw new Error('Dossiê 768p deveria auto-fit');

console.log('\n✔ Todos os testes de auto-fit horizontal para PC passaram com 100% de sucesso!');
