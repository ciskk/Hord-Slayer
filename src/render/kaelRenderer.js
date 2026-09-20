/**
 * src/render/kaelRenderer.js
 * 
 * Renderizador procedural Padrão Ouro para o herói Kael (ROGUE) — O Algoz do Vácuo Astral.
 * Arquitetura de renderização 2.5D em 11 camadas de alta fidelidade:
 * 
 * 0. Fenômenos de Vácuo & Phasing (sombras com distorção tridimensional, fenda rúnica nos pés, brasas astrais)
 * 1. Capa Espectral Rasgada (forro interno escuro, degradê violeta-abissal, farrapos denteados com rim light e partículas de cinzas)
 * 2. As Lâminas Astrais Gêmeas em 'X' (coldre dorsal duplo com runas pulsantes, cabos em seda negra e pomos com ametistas)
 * 3. Pernas Anatômicas & Botas Tabi Shinobi (coxas torneadas, joelheiras de couro, amarras em 'X', sola dividida e esporão de aço)
 * 4. Tronco Atlético em 'V' & Gibão de Couro (silhueta ágil, lamelas segmentadas de obsidiana chanfrada e costuras em prata lunar)
 * 5. Cinto Tático de Dupla Correia & Utilitários (fivela de prata, frasco de névoa líquida com bolhas, 2 kunais de aço e bolsa de bombas)
 * 6. Ombreiras em Asas de Corvo & Braços (lamelas sobrepostas com prata lunar, gemas de ametista lapidada e manoplas com ataduras)
 * 7. Drapeado Orgânico do Capuz & Gola Alta (tecido profundo com vincos de sombra e caimento sobre a clavícula)
 * 8. Cabeça & Capuz com Bico de Predador (domo esculpido com curvatura natural e sombra volumétrica de vácuo)
 * 9. Máscara Fantasma de Obsidiana (meia-máscara tática facetada com filigranas gravadas em prata)
 * 10. Olhos de Brasa Espectral & Estelas de Fumaça (fendas afiladas incandescentes com núcleo branco e fumaça que ondula)
 * 11. Respiração Gelada do Vácuo (micro-sopros de névoa rítmicos sincronizados com o ciclo de respiração)
 */

function drawRoundedRect(c, x, y, w, h, r) {
  if (c.roundRect) {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
  } else {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }
}

export function drawKaelModel(c, charDef, state, bob, legSwing, capeWave, tFrame, isPhasing, isAttacking) {
  const cCol = (charDef && charDef.color) || {};

  // Paleta de Materiais Nobres Ouro
  const cowlBase = cCol.cowlBase || '#14121f';
  const cowlShadow = cCol.cowlShadow || '#090810';
  const cowlHigh = cCol.cowlHighlight || '#27223b';
  const cowlFold = cCol.cowlFold || '#1a1628';

  const maskBase = cCol.maskBase || '#0c0a14';
  const maskSilver = cCol.maskSilver || '#8a93a8';
  const maskSilverBright = cCol.maskSilverBright || '#d5dbe8';

  const eyeGlow = isPhasing ? '#e9d5ff' : (cCol.eyeGlowPurple || '#c084fc');
  const eyeCore = '#ffffff';
  const eyeMist = isPhasing ? 'rgba(233, 213, 255, 0.75)' : (cCol.eyeMist || 'rgba(168, 85, 247, 0.45)');

  const leatherDark = cCol.leatherDark || '#0d0b14';
  const leatherMid = cCol.leatherMid || '#181524';
  const leatherLight = cCol.leatherLight || '#2c2740';
  const leatherStitch = cCol.leatherStitch || '#4b4466';

  const silverPlate = cCol.silverPlate || '#484f63';
  const silverHigh = cCol.silverHighlight || '#9aa3b8';
  const silverGlint = cCol.silverGlint || '#ffffff';
  const obsidianMetal = cCol.obsidianMetal || '#161821';

  const gemPurple = cCol.gemPurple || '#a855f7';
  const gemPurpleBright = cCol.gemPurpleBright || '#e9d5ff';
  const gemGlow = cCol.gemGlow || 'rgba(168, 85, 247, 0.65)';
  const vacuumCyan = cCol.vacuumCyan || '#38bdf8';

  const flaskGlass = cCol.flaskGlass || 'rgba(180, 195, 220, 0.45)';
  const flaskLiquid = cCol.flaskLiquid || '#9333ea';
  const flaskGlow = cCol.flaskGlow || 'rgba(147, 51, 234, 0.7)';

  const kunaiSteel = cCol.kunaiSteel || '#575c70';
  const kunaiSteelLight = cCol.kunaiSteelLight || '#9aa3b8';
  const kunaiRing = cCol.kunaiRing || '#a855f7';
  const kunaiHilt = cCol.kunaiHilt || '#1a1824';

  const bladeSteel = cCol.bladeSteel || '#3a384d';
  const bladeSteelLight = cCol.bladeSteelLight || '#736e94';
  const bladeEdgeGlow = isPhasing ? '#e9d5ff' : (cCol.bladeEdgeGlow || '#c084fc');
  const bladeGlint = '#ffffff';

  const pantsCol = cCol.pants || '#1e1b2e';
  const bootsCol = cCol.boots || '#0d0b14';
  const bootsDark = cCol.bootsDark || '#06050b';

  const capeBase = cCol.capeBase || '#110f1c';
  const capeInner = cCol.capeInner || '#08070e';
  const capeEthereal = cCol.capeEthereal || '#581c87';
  const capeGlow = isPhasing ? 'rgba(233, 213, 255, 0.7)' : (cCol.capeGlow || 'rgba(124, 58, 237, 0.35)');

  // =========================================================================
  // 0. FENÔMENOS DE VÁCUO & HABILIDADE PHASING (EFEITO ULTRA-POLIDO)
  // =========================================================================
  if (isPhasing) {
    c.save();
    // Clones de sombra espectral residuais
    for (let g = 1; g <= 3; g++) {
      const gDist = g * 9.0;
      const gAlpha = 0.36 / g;
      c.fillStyle = `rgba(88, 28, 135, ${gAlpha * 0.75})`;
      c.beginPath();
      c.ellipse(-gDist, bob, 9.5, 15, -0.05, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = `rgba(13, 11, 20, ${gAlpha * 0.9})`;
      c.beginPath();
      c.ellipse(-gDist * 0.75, bob, 7.5, 13, -0.03, 0, Math.PI * 2);
      c.fill();
    }

    // Fenda rúnica do vácuo no solo
    const runePulse = Math.sin(tFrame * 0.2) * 2.5;
    c.strokeStyle = vacuumCyan;
    c.lineWidth = 1.2;
    c.beginPath();
    c.ellipse(0, 15.0 + bob, 18.0 + runePulse, 5.0 + runePulse * 0.28, 0, 0, Math.PI * 2);
    c.stroke();

    c.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    c.lineWidth = 0.8;
    c.save();
    c.setLineDash([4, 6]);
    c.beginPath();
    c.ellipse(0, 15.0 + bob, 13.5, 3.8, tFrame * 0.04, 0, Math.PI * 2);
    c.stroke();
    c.restore();

    // Brasas de vácuo ascendentes
    for (let p = 0; p < 4; p++) {
      const pPhase = (tFrame * 0.08 + p * 1.5) % 4;
      const px = -8 + (p * 5) + Math.sin(tFrame * 0.1 + p) * 3;
      const py = 12 + bob - pPhase * 7;
      c.fillStyle = p % 2 === 0 ? vacuumCyan : gemPurpleBright;
      c.fillRect(px, py, 1.2, 1.2);
    }
    c.restore();
  }

  // =========================================================================
  // 1. CAPA ESPECTRAL RASGADA COM FORRO DUPLO, RIM LIGHT E BRASAS
  // =========================================================================
  c.save();
  const cWave = Math.abs(capeWave * 0.85);

  // 1A. Forro interno escuro profundo (profundidade 2.5D)
  c.fillStyle = capeInner;
  c.beginPath();
  c.moveTo(-4.0, -2.5 + bob);
  c.lineTo(1.0, -2.5 + bob);
  c.lineTo(-2.0, 7.0 + bob);
  c.lineTo(-4.5, 13.0 + bob);
  c.lineTo(-8.0 - cWave * 0.5, 19.0 + bob);
  c.lineTo(-12.0 - cWave * 0.9, 18.0 + bob);
  c.lineTo(-15.5 - cWave * 1.2, 13.0 + bob);
  c.lineTo(-7.0, -0.5 + bob);
  c.closePath();
  c.fill();

  // 1B. Camada principal com degradê abissal-ametista e pontas denteadas orgânicas
  const capeGrad = c.createLinearGradient(-4, -3 + bob, -11, 20 + bob);
  capeGrad.addColorStop(0.0, capeBase);
  capeGrad.addColorStop(0.4, '#1e1136');
  capeGrad.addColorStop(0.75, '#3b1263');
  capeGrad.addColorStop(1.0, capeEthereal);

  c.fillStyle = capeGrad;
  c.beginPath();
  c.moveTo(-3.5, -2.5 + bob);
  c.lineTo(0.5, -2.5 + bob);
  c.lineTo(-1.5, 6.5 + bob);
  c.lineTo(-3.8, 11.5 + bob);
  c.lineTo(-5.5 - cWave * 0.35, 17.5 + bob); // Ponta 4 (frontal)
  c.lineTo(-4.8, 13.5 + bob);
  c.lineTo(-8.8 - cWave * 0.6, 19.8 + bob);  // Ponta 3 (longa central)
  c.lineTo(-7.8, 12.8 + bob);
  c.lineTo(-12.8 - cWave * 0.85, 18.2 + bob); // Ponta 2
  c.lineTo(-11.0, 10.0 + bob);
  c.lineTo(-15.5 - cWave * 1.15, 14.5 + bob); // Ponta 1 (externa)
  c.lineTo(-6.8, -0.5 + bob);
  c.closePath();
  c.fill();

  // Borda de costura e rim-light na capa
  c.strokeStyle = capeGlow;
  c.lineWidth = 1.0;
  c.stroke();

  // Micro-partículas de cinza astral subindo da borda
  const ashY1 = 18.0 + bob - ((tFrame * 0.4) % 10);
  const ashY2 = 15.0 + bob - ((tFrame * 0.35 + 4) % 9);
  c.fillStyle = isPhasing ? vacuumCyan : 'rgba(192, 132, 252, 0.7)';
  c.fillRect(-9.5 - cWave * 0.6, ashY1, 1.0, 1.0);
  c.fillRect(-13.5 - cWave * 0.9, ashY2, 0.9, 0.9);
  c.restore();

  // =========================================================================
  // 2. COLDRE DORSAL DUPLO EM 'X' & AS LÂMINAS ASTRAIS GÊMEAS (PADRÃO OURO)
  // =========================================================================
  c.save();
  const showDorsalBlades = state.showDorsalBlades !== undefined ? state.showDorsalBlades : true;

  if (showDorsalBlades) {
    // Par de lâminas astrais cruzadas nas costas: Lâmina Traseira (\) e Lâmina Frontal (/)
    const bladeConfigs = [
      { ang: -0.65, xOff: -5.0, yOff: -3.5, len: 14.5, isFront: false },
      { ang:  0.55, xOff: -3.0, yOff: -3.5, len: 13.0, isFront: true }
    ];

    bladeConfigs.forEach((cfg) => {
      // Se estiver atacando, a lâmina frontal foi desembainhada na mão direita
      if (isAttacking && cfg.isFront) {
        // Bainha vazia iluminada por runa residual
        c.save();
        c.translate(cfg.xOff, cfg.yOff + bob);
        c.rotate(cfg.ang);
        c.fillStyle = leatherDark;
        c.fillRect(-1.5, -4, 3.0, 12);
        c.strokeStyle = silverPlate;
        c.lineWidth = 0.7;
        c.strokeRect(-1.5, -4, 3.0, 12);
        c.fillStyle = gemPurple;
        c.fillRect(-0.5, 0, 1.0, 4);
        c.restore();
        return;
      }

      c.save();
      c.translate(cfg.xOff, cfg.yOff + bob);
      c.rotate(cfg.ang);

      // Bainha de couro negro com guarnições de prata lunar
      c.fillStyle = leatherDark;
      c.fillRect(-1.6, -2.5, 3.2, 14);
      c.fillStyle = silverPlate;
      c.fillRect(-1.8, 8.5, 3.6, 2.5); // Ponteira de prata
      c.fillRect(-1.8, -2.5, 3.6, 1.2); // Bocal da bainha

      // Gravação rúnica violeta pulsante na bainha
      c.fillStyle = gemPurple;
      c.fillRect(-0.6, 0.5, 1.2, 5.5);
      c.fillStyle = gemPurpleBright;
      c.fillRect(-0.3, 2.0, 0.6, 2.0);

      // Guarda transversal em asas de corvo de prata lunar
      c.fillStyle = silverPlate;
      c.beginPath();
      c.moveTo(-3.8, -2.8);
      c.lineTo(3.8, -2.8);
      c.lineTo(2.2, -4.0);
      c.lineTo(-2.2, -4.0);
      c.closePath();
      c.fill();
      c.fillStyle = silverHigh;
      c.fillRect(-3.0, -3.4, 6.0, 0.7);

      // Empunhadura trançada com seda negra e fio de prata
      c.fillStyle = leatherDark;
      c.fillRect(-1.2, -8.8, 2.4, 4.8);
      c.strokeStyle = silverHigh;
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(-1.2, -7.6); c.lineTo(1.2, -6.6);
      c.moveTo(-1.2, -5.6); c.lineTo(1.2, -4.6);
      c.stroke();

      // Pomo em losango vazado com gema de ametista lapidada
      c.save();
      c.translate(0, -9.6);
      c.rotate(Math.PI / 4);
      c.fillStyle = silverPlate;
      c.fillRect(-1.6, -1.6, 3.2, 3.2);
      c.fillStyle = gemPurple;
      c.fillRect(-0.9, -0.9, 1.8, 1.8);
      c.fillStyle = '#ffffff';
      c.fillRect(-0.4, -0.4, 0.8, 0.8); // Brilho especular central
      c.restore();

      c.restore();
    });
  }
  c.restore();

  // =========================================================================
  // 3. PERNAS ANATÔMICAS, AMARRAS EM 'X' & BOTAS TABI SHINOBI
  // =========================================================================
  const lSwing = legSwing * 0.32;
  const legLeftX = -5.8 - lSwing;
  const legRightX = 0.5 + lSwing;

  // 3A. Coxas com volume e sombreamento anatômico
  c.fillStyle = pantsCol;
  c.fillRect(legLeftX, 6.5 + bob, 4.4, 5.8);
  c.fillRect(legRightX, 6.5 + bob, 4.4, 5.8);

  // Sombra lateral interna e externa
  c.fillStyle = leatherDark;
  c.fillRect(legLeftX, 6.5 + bob, 1.2, 5.8);
  c.fillRect(legRightX + 3.2, 6.5 + bob, 1.2, 5.8);

  // 3B. Joelheiras de couro endurecido reforçado com rebites
  c.fillStyle = leatherMid;
  c.fillRect(legLeftX + 0.4, 9.8 + bob, 3.8, 2.2);
  c.fillRect(legRightX + 0.4, 9.8 + bob, 3.8, 2.2);
  c.fillStyle = silverHigh;
  c.fillRect(legLeftX + 2.0, 10.4 + bob, 0.8, 0.8);
  c.fillRect(legRightX + 2.0, 10.4 + bob, 0.8, 0.8);

  // 3C. Amarras cruzadas de tendão escuro em 'X' nas canelas
  c.strokeStyle = leatherStitch;
  c.lineWidth = 0.9;
  c.beginPath();
  // Perna esquerda
  c.moveTo(legLeftX + 0.5, 7.2 + bob); c.lineTo(legLeftX + 3.9, 9.4 + bob);
  c.moveTo(legLeftX + 3.9, 7.2 + bob); c.lineTo(legLeftX + 0.5, 9.4 + bob);
  // Perna direita
  c.moveTo(legRightX + 0.5, 7.2 + bob); c.lineTo(legRightX + 3.9, 9.4 + bob);
  c.moveTo(legRightX + 3.9, 7.2 + bob); c.lineTo(legRightX + 0.5, 9.4 + bob);
  c.stroke();

  // 3D. Botas Tabi Shinobi (Couro escuro, biqueira bipartida e esporão de aço)
  // Bota Esquerda
  c.fillStyle = bootsCol;
  c.fillRect(legLeftX - 1.2, 12.0 + bob, 5.8, 3.2);
  // Esporão de calcanhar em aço escuro
  c.fillStyle = silverPlate;
  c.fillRect(legLeftX - 1.6, 13.8 + bob, 1.4, 1.4);
  c.fillStyle = silverGlint;
  c.fillRect(legLeftX - 1.2, 14.0 + bob, 0.6, 0.6);
  // Divisão Tabi nos dedos (sola bipartida japonesa)
  c.fillStyle = bootsDark;
  c.fillRect(legLeftX + 2.6, 14.2 + bob, 0.8, 1.0);

  // Bota Direita
  c.fillStyle = bootsCol;
  c.fillRect(legRightX - 0.2, 12.0 + bob, 5.6, 3.2);
  c.fillStyle = silverPlate;
  c.fillRect(legRightX - 0.6, 13.8 + bob, 1.4, 1.4);
  c.fillStyle = silverGlint;
  c.fillRect(legRightX - 0.2, 14.0 + bob, 0.6, 0.6);
  // Divisão Tabi nos dedos
  c.fillStyle = bootsDark;
  c.fillRect(legRightX + 3.6, 14.2 + bob, 0.8, 1.0);

  // =========================================================================
  // 4. TRONCO ATLÉTICO EM 'V' & GIBÃO DE COURO COM LAMELAS DE OBSIDIANA
  // =========================================================================
  // 4A. Base anatômica com cintura afilada (V-Taper)
  c.fillStyle = leatherMid;
  c.beginPath();
  c.moveTo(-7.2, -3.5 + bob);
  c.lineTo(6.8, -3.5 + bob);
  c.lineTo(4.6, 5.8 + bob);
  c.lineTo(-5.2, 5.8 + bob);
  c.closePath();
  c.fill();

  // Sombra profunda lateral no flanco esquerdo
  c.fillStyle = leatherDark;
  c.beginPath();
  c.moveTo(-7.2, -3.5 + bob);
  c.lineTo(-3.6, -3.5 + bob);
  c.lineTo(-3.0, 5.8 + bob);
  c.lineTo(-5.2, 5.8 + bob);
  c.closePath();
  c.fill();

  // 4B. Três lamelas segmentadas de obsidiana chanfrada no peitoral
  const chevrons = [
    { y: -2.2, h: 2.2, w: 9.6, indent: 0.8 },
    { y:  0.2, h: 2.2, w: 8.6, indent: 0.7 },
    { y:  2.6, h: 2.2, w: 7.4, indent: 0.6 }
  ];

  chevrons.forEach((chv) => {
    // Lamela de obsidiana metálica
    c.fillStyle = obsidianMetal;
    c.beginPath();
    c.moveTo(-chv.w * 0.5 - 0.4, chv.y + bob);
    c.lineTo(0, chv.y + chv.indent + bob);
    c.lineTo(chv.w * 0.5 - 0.4, chv.y + bob);
    c.lineTo(chv.w * 0.5 - 0.4, chv.y + chv.h + bob);
    c.lineTo(0, chv.y + chv.indent + chv.h + bob);
    c.lineTo(-chv.w * 0.5 - 0.4, chv.y + chv.h + bob);
    c.closePath();
    c.fill();

    // Borda superior chanfrada com prata lunar fosca
    c.strokeStyle = silverPlate;
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-chv.w * 0.5 - 0.4, chv.y + bob);
    c.lineTo(0, chv.y + chv.indent + bob);
    c.lineTo(chv.w * 0.5 - 0.4, chv.y + bob);
    c.stroke();

    // Ponto especular no vértice central
    c.fillStyle = silverGlint;
    c.fillRect(-0.4, chv.y + chv.indent + bob - 0.4, 0.8, 0.8);
  });

  // Linha de costura central e runa discreta no esterno
  c.strokeStyle = gemPurple;
  c.lineWidth = 1.0;
  c.beginPath();
  c.moveTo(-0.4, -2.6 + bob);
  c.lineTo(-0.4, 4.6 + bob);
  c.stroke();

  // =========================================================================
  // 5. CINTO TÁTICO DUPLO, FRASCO DE VÁCUO, KUNAIS & UTILITÁRIOS
  // =========================================================================
  // 5A. Correia de couro reforçada
  c.fillStyle = leatherDark;
  c.fillRect(-7.2, 4.8 + bob, 12.8, 2.6);
  c.fillStyle = leatherLight;
  c.fillRect(-7.2, 5.2 + bob, 12.8, 0.6);

  // Fivela central retangular chanfrada de prata lunar
  c.fillStyle = silverPlate;
  c.fillRect(-2.5, 4.5 + bob, 4.6, 3.2);
  c.fillStyle = silverHigh;
  c.fillRect(-2.0, 5.0 + bob, 3.6, 2.2);
  c.fillStyle = leatherDark;
  c.fillRect(-1.0, 5.5 + bob, 1.8, 1.2);

  // 5B. Frasco de Essência Espectral Líquida (Translucidez & Bolha Animada)
  c.save();
  // Vidro do frasco
  c.fillStyle = flaskGlass;
  drawRoundedRect(c, -6.6, 5.0 + bob, 2.8, 4.4, 0.8);
  c.fill();
  c.strokeStyle = silverPlate;
  c.lineWidth = 0.5;
  c.stroke();

  // Líquido violeta pulsante com bolha
  const liquidPulse = Math.sin(tFrame * 0.15) * 0.4;
  c.fillStyle = flaskLiquid;
  c.fillRect(-6.2, 6.4 + bob + liquidPulse, 2.0, 2.6 - liquidPulse);
  c.fillStyle = gemPurpleBright;
  c.fillRect(-5.4, 7.2 + bob, 0.6, 0.6); // Bolhinha mágica

  // Tampa de cortiça com aro de prata
  c.fillStyle = silverHigh;
  c.fillRect(-6.2, 4.6 + bob, 2.0, 0.6);
  c.restore();

  // 5C. Duas Kunais de Arremesso Facetadas na Lateral Esquerda
  [-4.6, -3.2].forEach((kx) => {
    // Anel do pomo vazado em ametista
    c.strokeStyle = kunaiRing;
    c.lineWidth = 0.7;
    c.beginPath();
    c.arc(kx, 5.2 + bob, 0.6, 0, Math.PI * 2);
    c.stroke();
    // Cabo escuro enrolado
    c.fillStyle = kunaiHilt;
    c.fillRect(kx - 0.3, 5.8 + bob, 0.6, 1.2);
    // Guarda de ferro
    c.fillStyle = obsidianMetal;
    c.fillRect(kx - 0.7, 7.0 + bob, 1.4, 0.4);
    // Lâmina triangular de aço com chanfro de luz
    c.fillStyle = kunaiSteel;
    c.beginPath();
    c.moveTo(kx - 0.7, 7.4 + bob);
    c.lineTo(kx + 0.7, 7.4 + bob);
    c.lineTo(kx, 10.4 + bob);
    c.closePath();
    c.fill();
    // Chanfro especular claro
    c.fillStyle = kunaiSteelLight;
    c.beginPath();
    c.moveTo(kx, 7.4 + bob);
    c.lineTo(kx + 0.7, 7.4 + bob);
    c.lineTo(kx, 10.4 + bob);
    c.closePath();
    c.fill();
  });

  // 5D. Bolsa de Bombas de Fumaça no Lado Direito
  c.fillStyle = leatherMid;
  c.fillRect(2.6, 5.0 + bob, 3.4, 3.2);
  c.fillStyle = leatherLight;
  // Aba triangular da bolsa
  c.beginPath();
  c.moveTo(2.6, 5.0 + bob);
  c.lineTo(6.0, 5.0 + bob);
  c.lineTo(4.3, 6.8 + bob);
  c.closePath();
  c.fill();
  // Botãozinho metálico
  c.fillStyle = silverHigh;
  c.fillRect(4.0, 6.0 + bob, 0.7, 0.7);

  // =========================================================================
  // 6. OMBREIRAS EM ASAS DE CORVO, BRAÇOS & MANOPLAS
  // =========================================================================
  // 6A. Braço Esquerdo (traseiro) com Manopla de Couro e Ataduras
  c.fillStyle = leatherDark;
  c.fillRect(-8.4, -1.0 + bob, 2.8, 5.4);
  c.fillStyle = obsidianMetal;
  c.fillRect(-8.6, 3.4 + bob, 3.0, 2.4); // Braçadeira de aço
  c.fillStyle = silverHigh;
  c.fillRect(-8.6, 3.8 + bob, 0.6, 1.6); // Rebite lateral
  c.fillStyle = bootsCol;
  c.fillRect(-8.4, 5.8 + bob, 2.6, 1.2); // Luva/mão

  // Ombreira Esquerda (Segmentada em 3 lamelas sobrepostas com ametista)
  c.fillStyle = obsidianMetal;
  c.beginPath();
  c.moveTo(-6.0, -3.2 + bob);
  c.lineTo(-9.8, -1.8 + bob);
  c.lineTo(-8.4, 1.0 + bob);
  c.lineTo(-5.6, -0.4 + bob);
  c.closePath();
  c.fill();
  c.strokeStyle = silverPlate;
  c.lineWidth = 0.8;
  c.stroke();
  // Gema de ametista lapidada no ombro traseiro
  c.fillStyle = gemPurple;
  c.beginPath();
  c.arc(-7.8, -0.8 + bob, 0.9, 0, Math.PI * 2);
  c.fill();

  // 6B. Braço Direito (frontal) — Ataque Dinâmico ou Postura em Guarda
  if (isAttacking) {
    c.save();
    c.translate(3.8, -0.5 + bob);
    c.rotate(0.26); // Ângulo dinâmico de corte cirúrgico

    // Braço estendido com bíceps e manopla
    c.fillStyle = leatherMid;
    c.fillRect(0, -1.6, 6.0, 3.0);
    c.fillStyle = obsidianMetal;
    c.fillRect(3.8, -1.8, 3.0, 3.4);
    c.fillStyle = silverHigh;
    c.fillRect(4.8, -1.6, 1.0, 3.0);
    c.fillStyle = bootsCol;
    c.fillRect(6.2, -1.4, 2.0, 2.6); // Punho cerrado

    // Empunhadura da Lâmina Espiritual
    c.fillStyle = leatherDark;
    c.fillRect(7.8, -0.8, 2.0, 1.6);
    c.fillStyle = silverHigh;
    c.fillRect(9.4, -2.4, 1.0, 4.8); // Guarda em prata

    // Lâmina Astral Cristalina Translúcida
    c.fillStyle = bladeEdgeGlow;
    c.beginPath();
    c.moveTo(10.4, -2.6);
    c.lineTo(20.5, -0.5);
    c.lineTo(10.4, 1.8);
    c.lineTo(11.2, -0.5);
    c.closePath();
    c.fill();

    // Núcleo Incandescente Branco de Corte
    c.fillStyle = bladeGlint;
    c.beginPath();
    c.moveTo(11.0, -1.2);
    c.lineTo(18.5, -0.5);
    c.lineTo(11.0, 0.6);
    c.closePath();
    c.fill();

    // Duplo Rastro Cinético de Corte em Arco (Efeito Vácuo)
    const slashPulse = Math.sin(tFrame * 0.4) * 1.5;
    c.strokeStyle = isPhasing ? 'rgba(233, 213, 255, 0.9)' : 'rgba(168, 85, 247, 0.85)';
    c.lineWidth = 2.6;
    c.beginPath();
    c.arc(7, 0, 13.5 + slashPulse, -Math.PI * 0.38, Math.PI * 0.38);
    c.stroke();

    c.strokeStyle = '#ffffff';
    c.lineWidth = 1.0;
    c.beginPath();
    c.arc(7, 0, 13.5 + slashPulse, -Math.PI * 0.22, Math.PI * 0.22);
    c.stroke();

    c.restore();
  } else {
    // Postura Normal: Braço em repouso pronto para o saque
    c.fillStyle = leatherMid;
    c.fillRect(3.2, -1.0 + bob, 2.8, 5.4);
    c.fillStyle = obsidianMetal;
    c.fillRect(3.2, 3.4 + bob, 3.0, 2.4);
    c.fillStyle = silverHigh;
    c.fillRect(5.4, 3.8 + bob, 0.6, 1.6);
    c.fillStyle = bootsCol;
    c.fillRect(3.2, 5.8 + bob, 2.6, 1.2);
  }

  // Ombreira Direita (Frontal — Asas de Corvo com Lamelas & Gema Ametista)
  c.fillStyle = obsidianMetal;
  c.beginPath();
  c.moveTo(3.5, -3.4 + bob);
  c.lineTo(8.2, -2.0 + bob);
  c.lineTo(6.8, 1.4 + bob);
  c.lineTo(2.8, -0.2 + bob);
  c.closePath();
  c.fill();
  c.strokeStyle = silverPlate;
  c.lineWidth = 0.9;
  c.stroke();

  // Chanfro de luz na lâmina superior da ombreira
  c.strokeStyle = silverHigh;
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(3.5, -3.4 + bob);
  c.lineTo(8.2, -2.0 + bob);
  c.stroke();

  // Gema Central de Ametista Lapidada no Ombro com Reflexo Especular
  c.fillStyle = gemPurple;
  c.beginPath();
  c.arc(5.4, -0.8 + bob, 1.2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = gemPurpleBright;
  c.fillRect(4.8, -1.2 + bob, 0.8, 0.8);
  c.fillStyle = '#ffffff';
  c.fillRect(5.6, -1.4 + bob, 0.5, 0.5);

  // =========================================================================
  // 7. DRAPEADO ORGÂNICO DO CAPUZ & GOLA ALTA PROTETORA
  // =========================================================================
  // Gola alta acolchoada cobrindo a clavícula e o pescoço
  c.fillStyle = cowlFold;
  c.beginPath();
  c.moveTo(-5.5, -4.5 + bob);
  c.quadraticCurveTo(0, -1.5 + bob, 5.5, -4.5 + bob);
  c.lineTo(4.2, -1.8 + bob);
  c.quadraticCurveTo(0, 0.8 + bob, -4.2, -1.8 + bob);
  c.closePath();
  c.fill();
  c.strokeStyle = cowlShadow;
  c.lineWidth = 0.8;
  c.stroke();

  // =========================================================================
  // 8. CABEÇA: CAPUZ ANATÔMICO COM BICO DE PREDADOR & CAVERNA DE SOMBRA
  // =========================================================================
  // 8A. Domo esculpido do capuz (não é um círculo duro, mas uma curva anatômica de tecido)
  c.fillStyle = cowlBase;
  c.beginPath();
  c.moveTo(-7.8, -4.2 + bob);
  c.quadraticCurveTo(-9.2, -11.5 + bob, -5.2, -16.8 + bob); // Lateral esquerda subindo
  c.quadraticCurveTo(-1.8, -18.5 + bob, 0.2, -18.2 + bob);   // Topo com bico suave
  c.quadraticCurveTo(4.2, -17.5 + bob, 7.2, -12.5 + bob);   // Lateral direita descendo
  c.quadraticCurveTo(8.5, -7.5 + bob, 6.2, -3.8 + bob);
  c.lineTo(4.2, -1.8 + bob);
  c.lineTo(-1.8, -1.8 + bob);
  c.lineTo(-6.2, -1.8 + bob);
  c.closePath();
  c.fill();

  // Vincos e sombreamento de dobra no capuz
  c.strokeStyle = cowlShadow;
  c.lineWidth = 1.0;
  c.stroke();

  c.strokeStyle = cowlHigh;
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-4.5, -16.2 + bob);
  c.quadraticCurveTo(-1.5, -17.6 + bob, 0.2, -17.4 + bob);
  c.stroke();

  // 8B. Caverna de sombra volumétrica profunda dentro do capuz
  c.fillStyle = cowlShadow;
  c.beginPath();
  c.ellipse(0.2, -9.2 + bob, 4.6, 5.6, 0, 0, Math.PI * 2);
  c.fill();

  // =========================================================================
  // 9. MÁSCARA FANTASMA DE OBSIDIANA (MEIA-MÁSCARA FACETADA)
  // =========================================================================
  // Máscara angular cobrindo nariz, bochechas e mandíbula
  c.fillStyle = maskBase;
  c.beginPath();
  c.moveTo(-4.0, -8.6 + bob);
  c.lineTo(0.2, -6.6 + bob); // Bico do nariz/mandíbula
  c.lineTo(4.2, -8.6 + bob);
  c.lineTo(3.2, -4.6 + bob);
  c.lineTo(0.2, -3.8 + bob); // Queixo angular
  c.lineTo(-3.0, -4.6 + bob);
  c.closePath();
  c.fill();
  c.strokeStyle = leatherDark;
  c.lineWidth = 0.8;
  c.stroke();

  // Filigranas gravadas em prata lunar nas bochechas da máscara
  c.strokeStyle = maskSilver;
  c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(-3.2, -7.2 + bob); c.lineTo(-1.0, -5.4 + bob);
  c.moveTo(3.2, -7.2 + bob);  c.lineTo(1.0, -5.4 + bob);
  c.stroke();

  // Ponto central de prata no queixo
  c.fillStyle = maskSilverBright;
  c.fillRect(-0.4, -4.4 + bob, 0.8, 0.8);

  // =========================================================================
  // 10. OLHOS DE BRASA ESPECTRAL & ESTELAS DE FUMAÇA ONDULANTES
  // =========================================================================
  // 10A. Fenda Ocular Esquerda (Angulada, Incandescente e Afilada)
  // Halo místico de vácuo
  c.fillStyle = eyeMist;
  c.beginPath();
  c.ellipse(-2.2, -10.2 + bob, 2.4, 1.8, -0.2, 0, Math.PI * 2);
  c.fill();

  // Fenda de brasa violeta
  c.fillStyle = eyeGlow;
  c.beginPath();
  c.moveTo(-3.6, -9.6 + bob);
  c.lineTo(-1.0, -10.8 + bob);
  c.lineTo(-1.2, -10.0 + bob);
  c.lineTo(-3.4, -9.0 + bob);
  c.closePath();
  c.fill();

  // Núcleo puro branco incandescente
  c.fillStyle = eyeCore;
  c.beginPath();
  c.moveTo(-3.0, -9.8 + bob);
  c.lineTo(-1.4, -10.5 + bob);
  c.lineTo(-1.6, -10.1 + bob);
  c.lineTo(-2.8, -9.4 + bob);
  c.closePath();
  c.fill();

  // 10B. Fenda Ocular Direita (Frontal)
  c.fillStyle = eyeMist;
  c.beginPath();
  c.ellipse(1.8, -10.2 + bob, 2.4, 1.8, 0.2, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = eyeGlow;
  c.beginPath();
  c.moveTo(0.6, -10.8 + bob);
  c.lineTo(3.2, -9.6 + bob);
  c.lineTo(3.0, -9.0 + bob);
  c.lineTo(0.8, -10.0 + bob);
  c.closePath();
  c.fill();

  c.fillStyle = eyeCore;
  c.beginPath();
  c.moveTo(1.0, -10.5 + bob);
  c.lineTo(2.6, -9.8 + bob);
  c.lineTo(2.4, -9.4 + bob);
  c.lineTo(1.2, -10.1 + bob);
  c.closePath();
  c.fill();

  // 10C. Estelas de Fumaça Espectral Ondulando para Trás a partir dos Olhos
  const smokeSway = Math.sin(tFrame * 0.16) * 1.4;
  c.strokeStyle = eyeMist;
  c.lineWidth = 1.0;
  c.beginPath();
  c.moveTo(-3.6, -9.6 + bob);
  c.quadraticCurveTo(-6.0, -11.0 + bob + smokeSway, -8.5, -12.5 + bob - smokeSway * 0.5);
  c.stroke();

  c.beginPath();
  c.moveTo(3.2, -9.6 + bob);
  c.quadraticCurveTo(5.5, -11.0 + bob + smokeSway, 7.8, -12.2 + bob - smokeSway * 0.5);
  c.stroke();

  // =========================================================================
  // 11. RESPIRAÇÃO GELADA DO VÁCUO (SINCRONIZADA COM O CICLO DE FRAME)
  // =========================================================================
  const breathCycle = (tFrame * 0.075) % 1;
  if (breathCycle < 0.45) {
    const bProg = breathCycle / 0.45;
    const bAlpha = (1 - bProg) * (isPhasing ? 0.65 : 0.35);
    c.fillStyle = `rgba(216, 180, 254, ${bAlpha})`;
    c.beginPath();
    c.arc(
      3.2 + bProg * 4.5,
      -5.0 + bob - bProg * 2.0,
      0.8 + bProg * 1.6,
      0,
      Math.PI * 2
    );
    c.fill();
  }
}
