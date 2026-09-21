/**
 * scratch/test-autofit-math.js
 * Teste unitário e de regressão para as regras de cálculo do Smart Auto-Fit
 */

import assert from 'node:assert';

function calculateAutoFit(availH, naturalH, options = {}) {
  const minScale = options.minScale ?? 0.78;
  const maxScale = options.maxScale ?? 1.0;
  const bufferPx = options.bufferPx ?? 2;

  if (availH <= 0 || naturalH <= 0) {
    return { scale: 1.0, active: false };
  }

  if (naturalH <= availH) {
    return { scale: 1.0, active: false };
  }

  const requiredScale = Math.min(maxScale, (availH - bufferPx) / naturalH);

  if (requiredScale >= minScale) {
    const scale = Math.floor(requiredScale * 1000) / 1000;
    return { scale, active: true };
  } else {
    // Excesso significativo: mantém scroll
    return { scale: 1.0, active: false };
  }
}

console.log('--- Iniciando Testes de Lógica do Smart Auto-Fit ---');

// Teste 1: Conteúdo cabe normalmente
{
  const res = calculateAutoFit(200, 150);
  assert.strictEqual(res.scale, 1.0, 'Deveria manter escala 1.0 quando cabe normalmente');
  assert.strictEqual(res.active, false, 'Não deveria ativar autofit quando cabe normalmente');
  console.log('✔ Teste 1 passou: Conteúdo cabe normalmente (escala 1.0, sem autofit).');
}

// Teste 2: Excesso pequeno típico (ex.: Seleção de heróis mobile iPhone SE / 12)
// Disponível: 156px, Conteúdo: 185px (excesso de ~18%)
{
  const res = calculateAutoFit(156, 185);
  // (156 - 2) / 185 = 154 / 185 = 0.8324...
  assert.strictEqual(res.active, true, 'Deveria ativar autofit para pequeno excesso');
  assert.strictEqual(res.scale, 0.832, 'Escala calculada deve ser 0.832');
  assert.ok(185 * res.scale <= 156, 'Conteúdo escalado deve caber na área disponível');
  console.log(`✔ Teste 2 passou: Pequeno excesso adaptado perfeitamente (escala: ${res.scale}).`);
}

// Teste 3: Excesso quase imperceptível (apenas ~4% maior)
// Disponível: 150px, Conteúdo: 156px
{
  const res = calculateAutoFit(150, 156);
  // (150 - 2) / 156 = 148 / 156 = 0.9487...
  assert.strictEqual(res.active, true);
  assert.strictEqual(res.scale, 0.948);
  assert.ok(156 * res.scale <= 150);
  console.log(`✔ Teste 3 passou: Excesso mínimo de 6px adaptado com escala sutil ${res.scale}.`);
}

// Teste 4: Limite exato da tolerância mínima (0.78)
// Disponível: 158px, Conteúdo: 200px -> (158 - 2) / 200 = 0.780
{
  const res = calculateAutoFit(158, 200);
  assert.strictEqual(res.active, true);
  assert.strictEqual(res.scale, 0.780);
  console.log('✔ Teste 4 passou: Limite de tolerância 0.78 atingido e aceito.');
}

// Teste 5: Excesso significativo (ex.: lista com muitos itens ou tela microscópica)
// Disponível: 100px, Conteúdo: 200px (excesso de 100%, escala seria 0.49 < 0.78)
{
  const res = calculateAutoFit(100, 200);
  assert.strictEqual(res.scale, 1.0, 'Não deve reduzir quando o excesso for significativo');
  assert.strictEqual(res.active, false, 'Deve manter scroll nativo ativado');
  console.log('✔ Teste 5 passou: Excesso significativo preservou scroll nativo (escala 1.0).');
}

// Teste 6: Conteúdo de tamanho zero ou invisível
{
  const res = calculateAutoFit(0, 0);
  assert.strictEqual(res.scale, 1.0);
  assert.strictEqual(res.active, false);
  console.log('✔ Teste 6 passou: Dimensões zero tratadas de forma defensiva.');
}

console.log('\n Todos os testes matemáticos e conceituais passaram com sucesso!');
