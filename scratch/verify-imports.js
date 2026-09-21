/**
 * scratch/verify-imports.js
 * Testa se todos os módulos modificados podem ser resolvidos e importados pelo Node
 */

async function testImports() {
  console.log('--- Testando resolução de módulos ESM ---');
  try {
    const responsive = await import('../src/core/responsive.js');
    console.log('✔ src/core/responsive.js carregado com sucesso.');
    assertExport(responsive, 'updateAllAutoFit');
    assertExport(responsive, 'autoFitElement');
    assertExport(responsive, 'registerAutoFit');
    assertExport(responsive, 'initAutoFitSystem');
    assertExport(responsive, 'GRAPHICS_QUALITY');
    assertExport(responsive, 'getGraphicsQuality');
    assertExport(responsive, 'setGraphicsQuality');
    assertExport(responsive, 'resolveTargetDpr');

    const autoFit = await import('../src/core/responsiveAutoFit.js');
    console.log('✔ src/core/responsiveAutoFit.js carregado com sucesso.');
    assertExport(autoFit, 'autoFitElement');
    assertExport(autoFit, 'updateAllAutoFit');

    const gameState = await import('../src/state/gameState.js');
    console.log('✔ src/state/gameState.js carregado com sucesso.');
    assertExport(gameState, 'calculateCameraZoom');
    assertExport(gameState, 'updateDimensions');

    // Testes de Resolução e Adaptação à Tela
    console.log('\n--- Testando Lógica de Resolução e Adaptação de Tela ---');
    const { GRAPHICS_QUALITY, resolveTargetDpr, setGraphicsQuality, getGraphicsQuality } = responsive;
    
    // Simulação 1: iPhone 14 Pro (devicePixelRatio = 3.0)
    globalThis.window = { devicePixelRatio: 3.0 };
    setGraphicsQuality(GRAPHICS_QUALITY.NATIVE);
    const dprIphoneNative = resolveTargetDpr(GRAPHICS_QUALITY.NATIVE);
    if (dprIphoneNative !== 3.0) throw new Error(`Esperado DPR 3.0 no modo NATIVA, obtido: ${dprIphoneNative}`);
    console.log(`✔ iPhone 14 Pro (DPR 3.0) em Modo NATIVA: DPR = ${dprIphoneNative}x (100% da resolução física)`);

    const dprIphoneHigh = resolveTargetDpr(GRAPHICS_QUALITY.HIGH);
    if (dprIphoneHigh !== 2.0) throw new Error(`Esperado DPR 2.0 no modo ALTA, obtido: ${dprIphoneHigh}`);
    console.log(`✔ iPhone 14 Pro em Modo ALTA: DPR = ${dprIphoneHigh}x (Limitado a 2.0x)`);

    const dprIphonePerf = resolveTargetDpr(GRAPHICS_QUALITY.PERFORMANCE);
    if (dprIphonePerf !== 1.25) throw new Error(`Esperado DPR 1.25 no modo ECONÔMICA, obtido: ${dprIphonePerf}`);
    console.log(`✔ iPhone 14 Pro em Modo ECONÔMICA: DPR = ${dprIphonePerf}x (1.25x economia de GPU)`);

    // Simulação 2: Android Samsung Galaxy FHD+ (devicePixelRatio = 2.625)
    globalThis.window = { devicePixelRatio: 2.625 };
    const dprAndroidNative = resolveTargetDpr(GRAPHICS_QUALITY.NATIVE);
    if (dprAndroidNative !== 2.625) throw new Error(`Esperado DPR 2.625 no modo NATIVA, obtido: ${dprAndroidNative}`);
    console.log(`✔ Samsung Galaxy (DPR 2.625) em Modo NATIVA: DPR = ${dprAndroidNative}x`);

    // Simulação 3: Desktop Padrão 1080p (devicePixelRatio = 1.0)
    globalThis.window = { devicePixelRatio: 1.0 };
    const dprDesktop = resolveTargetDpr(GRAPHICS_QUALITY.NATIVE);
    if (dprDesktop !== 1.0) throw new Error(`Esperado DPR 1.0, obtido: ${dprDesktop}`);
    console.log(`✔ Desktop 1080p em Modo NATIVA: DPR = ${dprDesktop}x`);

    // Simulação 4: Câmera em telas mobile e desktop
    const { calculateCameraZoom } = gameState;
    const zoomMobilePortrait = calculateCameraZoom(390, 844);
    if (zoomMobilePortrait < 0.70 || zoomMobilePortrait > 0.85) throw new Error(`Zoom mobile inesperado: ${zoomMobilePortrait}`);
    console.log(`✔ Câmera Mobile Portrait (390x844): Zoom = ${zoomMobilePortrait.toFixed(2)}x`);

    const zoomDesktop = calculateCameraZoom(1920, 1080);
    if (zoomDesktop !== 1.25) throw new Error(`Zoom desktop inesperado: ${zoomDesktop}`);
    console.log(`✔ Câmera Desktop (1920x1080): Zoom = ${zoomDesktop}x`);

    console.log('\n✔ Todos os testes de resolução e adaptação passaram com 100% de sucesso!');
  } catch (err) {
    console.error('❌ Erro na importação/teste:', err);
    process.exit(1);
  }
}

function assertExport(mod, name) {
  if (typeof mod[name] === 'undefined') {
    throw new Error(`Export ausente: ${name}`);
  }
  console.log(`  • export '${name}' presente e válido.`);
}

testImports();
