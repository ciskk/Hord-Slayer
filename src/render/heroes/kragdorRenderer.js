/**
 * src/render/heroes/kragdorRenderer.js
 * 
 * Renderizador procedural especializado de Kragdor (BARBARIAN).
 * Inclui compleição física bárbara, ombreira de pele de fera nórdica,
 * calças de couro reforçadas, machados e cicatrizes tribais.
 */

/**
 * Renderiza o modelo procedural de Kragdor.
 */
export function drawKragdorModel(c, charDef, state, {
  bob = 0,
  legSwing = 0,
  capeWave = 0,
  tFrame = 0,
  isMoving = false,
  walkCycle = 0,
  scale = 1,
  isBerserk = false,
  berserkTimer = 0
} = {}) {
    // isBerserk handled via state
    const cCol = charDef.color || {};
    const skinCol = cCol.skin || '#c67846';
    const skinShadow = cCol.skinShadow || '#8e4823';
    const skinHigh = cCol.skinHighlight || '#df8b56';
    const scarCol = cCol.scar || '#ba5338';
    const runeCol = isBerserk ? '#ffffff' : (cCol.tattoo || '#f39c12');
    const runeGlow = isBerserk ? (cCol.tattooGlow || '#ff7675') : 'rgba(243, 156, 18, 0.45)';
    const hairCol = cCol.hair || '#d35400';
    const hairDark = cCol.hairDark || '#962d1d';
    const hairHigh = cCol.hairHighlight || '#e67e22';
    const capeCol = cCol.cape || '#7f1d1d';
    const capeInner = cCol.capeInner || '#1e110c';
    const furBase = cCol.furBase || '#36211a';
    const furHigh = cCol.furHighlight || '#5d3a2d';
    const boneCol = cCol.bone || '#e2d7c5';
    const boneLight = cCol.boneLight || '#f5eee1';
    const boneDark = cCol.boneDark || '#a19582';
    const hornTip = cCol.hornTip || '#2b221a';
    const leatherDark = cCol.leatherDark || '#1a120e';
    const leatherMid = cCol.armor || '#2c1e18';
    const leatherLight = cCol.leatherLight || '#5a3a2a';
    const axeSteel = cCol.axeSteel || '#7f8c8d';
    const axeSteelLight = cCol.axeSteelLight || '#b2bec3';
    const axeEdge = cCol.axeEdge || '#f1c40f';
    const axeWood = cCol.axeWood || '#3d271d';
    const ironCol = cCol.iron || '#47535e';
    const brassCol = cCol.brass || '#f39c12';
    const isDetailed = scale >= 1.5;

    // --- 0. EFEITO ESPECIAL BERSERK: Halo de Fúria e Trincas de Solo ---
    if (isBerserk) {
      c.save();
      const furyPulse = Math.sin(tFrame * 0.25) * 3;
      c.strokeStyle = 'rgba(231, 76, 60, 0.55)';
      c.lineWidth = 2.0;
      c.beginPath();
      c.ellipse(0, 14 + bob, 22 + furyPulse, 7.5 + furyPulse * 0.35, 0, 0, Math.PI * 2);
      c.stroke();

      // Fagulhas e emanação de vapor de sangue nos ombros
      for (let f = 0; f < 3; f++) {
        const fAng = tFrame * 0.15 + f * (Math.PI * 2 / 3);
        const fx = Math.cos(fAng) * (14 + furyPulse);
        const fy = -4 + bob + Math.sin(fAng) * 8 - ((tFrame * 0.4 + f * 4) % 10);
        c.fillStyle = f % 2 === 0 ? 'rgba(231, 76, 60, 0.65)' : 'rgba(243, 156, 18, 0.75)';
        c.fillRect(fx - 1, fy - 1, 2, 2);
      }
      c.restore();
    }

    // --- 1. CAPA PESADA DE PELE DE FERA COM BORDA SERRILHADA E RIM LIGHT ---
    // Forro interno escuro
    c.fillStyle = capeInner;
    c.beginPath();
    c.moveTo(-6, -1 + bob);
    c.lineTo(-16 - Math.abs(capeWave * 1.2), 17 + bob);
    c.lineTo(-8 - Math.abs(capeWave * 0.7), 19 + bob);
    c.lineTo(-1, 17 + bob);
    c.lineTo(4, -1 + bob);
    c.closePath();
    c.fill();

    // Camada principal de pele desgastada com pontas denteadas
    c.fillStyle = capeCol;
    c.beginPath();
    c.moveTo(-6, -2 + bob);
    c.lineTo(-15 - Math.abs(capeWave * 1.1), 15 + bob);
    c.lineTo(-11 - Math.abs(capeWave * 0.8), 12 + bob);
    c.lineTo(-13 - Math.abs(capeWave * 1.0), 18 + bob);
    c.lineTo(-7 - Math.abs(capeWave * 0.6), 16 + bob);
    c.lineTo(-9 - Math.abs(capeWave * 0.7), 19 + bob);
    c.lineTo(-2, 17 + bob);
    c.lineTo(4, -2 + bob);
    c.closePath();
    c.fill();

    // Borda desfiada / costura de tendão áspero
    c.strokeStyle = '#3d0c0c';
    c.lineWidth = 1.2;
    c.stroke();

    // Rim light sutil de fúria carmesim na silhueta da capa
    c.strokeStyle = isBerserk ? 'rgba(255, 118, 117, 0.8)' : 'rgba(231, 76, 60, 0.35)';
    c.lineWidth = 1.0;
    c.beginPath();
    c.moveTo(-15 - Math.abs(capeWave * 1.1), 14 + bob);
    c.lineTo(-13 - Math.abs(capeWave * 1.0), 18 + bob);
    c.lineTo(-9 - Math.abs(capeWave * 0.7), 19 + bob);
    c.stroke();

    // --- 2. COLDRE DORSAL DO MACHADO COLOSSO (Exibido em repouso / preview) ---
    const isAxeOrbitActive = !!state.isAxeOrbiting || (typeof player !== 'undefined' && player.axeCount > 0 && !state.showDorsalAxeForce);
    const showBackAxe = state.showDorsalAxe !== undefined ? state.showDorsalAxe : (!isAxeOrbitActive || state.scale > 2.0);

    if (showBackAxe) {
      c.save();
      c.translate(-3, -2 + bob);
      c.rotate(-0.55);

      // Cabo de carvalho nórdico com ataduras de couro cruzadas
      c.fillStyle = axeWood;
      c.fillRect(-2, -6, 4, 32);
      c.strokeStyle = leatherDark;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-2, 3); c.lineTo(2, 6);
      c.moveTo(-2, 11); c.lineTo(2, 14);
      c.moveTo(-2, 19); c.lineTo(2, 22);
      c.stroke();

      // Pomo inferior reforçado com ferro e correia
      c.fillStyle = ironCol;
      c.fillRect(-2.5, 25, 5, 3.5);
      c.fillStyle = brassCol;
      c.fillRect(-1.5, 26, 3, 1.5);

      // Cabeça do Machado Colosso Nórdico (Lâmina Barbada Assimétrica)
      c.fillStyle = axeSteel;
      c.beginPath();
      c.moveTo(-2, -6);
      c.lineTo(-13, -15);
      c.lineTo(-17, -8);
      c.quadraticCurveTo(-14, 2, -18, 10);
      c.lineTo(-12, 6);
      c.lineTo(-2, 0);
      c.closePath();
      c.fill();
      c.strokeStyle = ironCol;
      c.lineWidth = 1.2;
      c.stroke();

      // Chanfro de aço claro polido
      c.fillStyle = axeSteelLight;
      c.beginPath();
      c.moveTo(-5, -6);
      c.lineTo(-12, -13);
      c.lineTo(-11, 4);
      c.lineTo(-5, 0);
      c.closePath();
      c.fill();

      // Gume dourado incandescente afiado
      c.strokeStyle = axeEdge;
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(-13, -15);
      c.lineTo(-17, -8);
      c.quadraticCurveTo(-14, 2, -18, 10);
      c.stroke();

      // Brilho especular branco no corte da lâmina
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.0;
      c.beginPath();
      c.moveTo(-14, -11);
      c.lineTo(-15, -4);
      c.stroke();

      c.restore();
    }

    // --- 3. PERNAS ROBUSTAS, AMARRAS CRUZADAS E BOTAS PESADAS ---
    const legLeftX = -7.5 - legSwing * 0.45;
    const legRightX = 2.0 + legSwing * 0.45;

    // Coxas musculosas com sombreamento de volume
    c.fillStyle = leatherDark;
    c.fillRect(legLeftX, 6.5 + bob, 5.5, 8.5);
    c.fillRect(legRightX, 6.5 + bob, 5.5, 8.5);

    c.fillStyle = leatherMid;
    c.fillRect(legLeftX + 0.8, 7.0 + bob, 3.8, 8.0);
    c.fillRect(legRightX + 0.8, 7.0 + bob, 3.8, 8.0);

    // Amarras de tendão trançadas em "X" com relevo
    c.strokeStyle = '#8d5524';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(legLeftX, 8.5 + bob);
    c.lineTo(legLeftX + 5.5, 11.5 + bob);
    c.moveTo(legLeftX + 5.5, 8.5 + bob);
    c.lineTo(legLeftX, 11.5 + bob);

    c.moveTo(legRightX, 8.5 + bob);
    c.lineTo(legRightX + 5.5, 11.5 + bob);
    c.moveTo(legRightX + 5.5, 8.5 + bob);
    c.lineTo(legRightX, 11.5 + bob);
    c.stroke();

    // Botas de couro de urso com sola reforçada
    c.fillStyle = '#141210';
    c.fillRect(legLeftX - 1.0, 12.5 + bob, 7.0, 4.0);
    c.fillRect(legRightX - 1.0, 12.5 + bob, 7.0, 4.0);

    // Biqueiras de ferro martelado com cravos
    c.fillStyle = ironCol;
    c.fillRect(legLeftX - 0.5, 14.2 + bob, 5.5, 1.8);
    c.fillRect(legRightX - 0.5, 14.2 + bob, 5.5, 1.8);

    c.fillStyle = '#ffffff';
    c.fillRect(legLeftX + 0.2, 14.2 + bob, 1.2, 1.0);
    c.fillRect(legRightX + 0.2, 14.2 + bob, 1.2, 1.0);

    // --- 4. TRONCO MUSCULOSO DE COLOSSO NÓRDICO (ANATOMIA 2.5D) ---
    // Base muscular em formato V-Taper
    c.fillStyle = skinCol;
    c.beginPath();
    c.moveTo(-11.0, -5 + bob);
    c.lineTo(11.0, -5 + bob);
    c.lineTo(6.5, 7 + bob);
    c.lineTo(-6.5, 7 + bob);
    c.closePath();
    c.fill();

    // Sombreamento muscular anatômico (Grandes Peitorais e Linha Esternal)
    c.fillStyle = skinShadow;
    // Sombra profunda sob os peitorais
    c.beginPath();
    c.moveTo(-8.5, 0.5 + bob);
    c.quadraticCurveTo(-4.5, 2.5 + bob, -0.5, 0.5 + bob);
    c.lineTo(-0.5, 2.0 + bob);
    c.quadraticCurveTo(-4.5, 3.8 + bob, -8.5, 1.8 + bob);
    c.closePath();
    c.fill();

    c.beginPath();
    c.moveTo(0.5, 0.5 + bob);
    c.quadraticCurveTo(4.5, 2.5 + bob, 8.5, 0.5 + bob);
    c.lineTo(8.5, 1.8 + bob);
    c.quadraticCurveTo(4.5, 3.8 + bob, 0.5, 2.0 + bob);
    c.closePath();
    c.fill();

    // Sulco esternal central e abdômen
    c.fillRect(-0.6, -3.5 + bob, 1.2, 7.5);

    // Destaque de volume luminoso no topo dos peitorais
    c.fillStyle = skinHigh;
    c.fillRect(-8.0, -4.0 + bob, 6.5, 1.6);
    c.fillRect(1.5, -4.0 + bob, 6.5, 1.6);

    // Cicatriz de Guerra Veterana (Diagonal cruzando o peito esquerdo)
    c.strokeStyle = scarCol;
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(-7.0, -3.5 + bob);
    c.lineTo(-2.0, 1.5 + bob);
    c.stroke();
    // Pontos de sutura primitiva na cicatriz
    c.strokeStyle = '#f5eee1';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-6.0, -3.0 + bob); c.lineTo(-4.8, -1.8 + bob);
    c.moveTo(-4.2, -1.0 + bob); c.lineTo(-3.0, 0.2 + bob);
    c.stroke();

    // Tatuagens Rúnicas Nórdicas (Pulsam em chamas no modo Berserk)
    c.strokeStyle = runeCol;
    c.lineWidth = isBerserk ? 2.0 : 1.5;
    c.beginPath();
    c.moveTo(-7, -2 + bob);
    c.lineTo(-3, 0 + bob);
    c.lineTo(-5, 3 + bob);
    c.lineTo(-1, 5 + bob);
    c.moveTo(1, -3 + bob);
    c.lineTo(5, -1 + bob);
    c.lineTo(3, 2 + bob);
    c.stroke();

    if (isBerserk) {
      c.save();
      c.fillStyle = runeGlow;
      c.fillRect(-4.5, -0.5 + bob, 3.2, 3.2);
      c.fillRect(1.8, -1.5 + bob, 3.2, 3.2);
      c.fillStyle = '#ffffff';
      c.fillRect(-3.5, 0.2 + bob, 1.5, 1.5);
      c.fillRect(2.5, -0.8 + bob, 1.5, 1.5);
      c.restore();
    }

    // Arnês de Couro em "X" com Broche Central de Bronze
    c.strokeStyle = leatherDark;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-9.5, -4 + bob);
    c.lineTo(6.5, 6.5 + bob);
    c.moveTo(9.5, -4 + bob);
    c.lineTo(-6.5, 6.5 + bob);
    c.stroke();

    c.strokeStyle = leatherLight;
    c.lineWidth = 1.0;
    c.beginPath();
    c.moveTo(-9.0, -4.5 + bob);
    c.lineTo(6.0, 6.0 + bob);
    c.stroke();

    // Broche Central de Bronze com Gema Âmbar Lapidada
    c.fillStyle = '#d35400';
    c.beginPath();
    c.arc(0, 1 + bob, 3.0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = brassCol;
    c.lineWidth = 1.0;
    c.stroke();

    c.fillStyle = isBerserk ? '#ffffff' : '#f1c40f';
    c.fillRect(-1.2, -0.2 + bob, 2.4, 2.4);
    c.fillStyle = '#ffffff';
    c.fillRect(-0.6, -0.2 + bob, 1.0, 1.0);

    // Cinturão de Guerra com Fivela de Ferro Rúnico
    c.fillStyle = leatherDark;
    c.fillRect(-7.5, 4.5 + bob, 15, 3.4);
    c.fillStyle = leatherMid;
    c.fillRect(-7.0, 5.0 + bob, 14, 1.2);

    // Fivela de ferro maciço chanfrado
    c.fillStyle = ironCol;
    c.fillRect(-3.0, 3.8 + bob, 6.0, 4.6);
    c.fillStyle = brassCol;
    c.fillRect(-1.8, 4.6 + bob, 3.6, 3.0);
    c.fillStyle = ironCol;
    c.fillRect(-0.8, 5.2 + bob, 1.6, 1.8);

    // --- 5. OMBREIRA TRASEIRA DE CRÂNIO DE FERA COM CRAVOS E RELEVO ---
    c.fillStyle = boneCol;
    c.beginPath();
    c.moveTo(-11, -6 + bob);
    c.quadraticCurveTo(-16, -4 + bob, -14, 1 + bob);
    c.lineTo(-8, -1 + bob);
    c.closePath();
    c.fill();

    // Cavidade da órbita do crânio (preto profundo sombreado)
    c.fillStyle = '#14100d';
    c.beginPath();
    c.arc(-11.5, -2.5 + bob, 1.8, 0, Math.PI * 2);
    c.fill();

    // Dente / Espigão de marfim afiado projetado
    c.fillStyle = boneLight;
    c.beginPath();
    c.moveTo(-13, -3 + bob);
    c.lineTo(-18, -7.5 + bob);
    c.lineTo(-11, -6 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = boneDark;
    c.lineWidth = 1.0;
    c.stroke();

    // Ponta brilhante do espigão
    c.fillStyle = '#ffffff';
    c.fillRect(-17.5, -7.2 + bob, 1.4, 1.4);

    // --- 6. BRAÇOS MUSCULOSOS COM MUNHEQUEIRAS REFORÇADAS E VEIAS ---
    c.fillStyle = skinCol;
    c.fillRect(-11.5, -3 + bob, 4.8, 8.5);
    c.fillRect(7.0, -3 + bob, 4.8, 8.5);

    // Sombra de volume no bíceps
    c.fillStyle = skinShadow;
    c.fillRect(-11.5, 1.0 + bob, 4.8, 1.5);
    c.fillRect(7.0, 1.0 + bob, 4.8, 1.5);

    // Destaque de luz no deltoide externo
    c.fillStyle = skinHigh;
    c.fillRect(-11.0, -3.0 + bob, 1.5, 4.0);
    c.fillRect(10.0, -3.0 + bob, 1.5, 4.0);

    // Veias de adrenalina pulsando no modo Berserk
    if (isBerserk) {
      c.strokeStyle = 'rgba(255, 71, 87, 0.9)';
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(-10.5, -1 + bob); c.lineTo(-8.5, 1.5 + bob);
      c.moveTo(8.5, -1 + bob); c.lineTo(10.5, 1.5 + bob);
      c.stroke();
    }

    // Munhequeiras duplas de couro curtido
    c.fillStyle = leatherDark;
    c.fillRect(-12.0, 2.0 + bob, 5.5, 4.0);
    c.fillRect(6.5, 2.0 + bob, 5.5, 4.0);

    // Rebites de ferro polido com brilho
    c.fillStyle = ironCol;
    c.fillRect(-11.0, 2.8 + bob, 1.8, 1.8);
    c.fillRect(8.0, 2.8 + bob, 1.8, 1.8);
    c.fillStyle = '#ffffff';
    c.fillRect(-10.5, 2.8 + bob, 0.8, 0.8);
    c.fillRect(8.5, 2.8 + bob, 0.8, 0.8);

    // --- 7. GOLA DE PELES DE LOBO SELVAGEM (TUFOS RECORTADOS EM CAMADAS) ---
    // Camada escura de base
    c.fillStyle = furBase;
    c.beginPath();
    c.moveTo(-10.5, -6 + bob);
    c.quadraticCurveTo(0, -2.5 + bob, 10.5, -6 + bob);
    c.lineTo(8.5, -9.0 + bob);
    c.quadraticCurveTo(0, -6.5 + bob, -8.5, -9.0 + bob);
    c.closePath();
    c.fill();

    // Tufos recortados de pelagem em relevo com highlights
    c.fillStyle = furHigh;
    c.beginPath();
    c.moveTo(-9.0, -6.5 + bob);
    c.lineTo(-6.5, -4.5 + bob);
    c.lineTo(-5.0, -6.5 + bob);
    c.lineTo(-1.5, -4.0 + bob);
    c.lineTo(0.5, -6.5 + bob);
    c.lineTo(4.0, -4.2 + bob);
    c.lineTo(6.5, -6.5 + bob);
    c.lineTo(9.0, -5.5 + bob);
    c.lineTo(7.5, -8.0 + bob);
    c.quadraticCurveTo(0, -5.5 + bob, -8.0, -8.0 + bob);
    c.closePath();
    c.fill();

    // Mechas de pelo cinza-claro na gola
    c.fillStyle = boneLight;
    c.fillRect(-4.5, -5.5 + bob, 1.8, 1.2);
    c.fillRect(2.5, -5.5 + bob, 1.8, 1.2);

    // --- 8. CABEÇA, ROSTO E OLHOS FURIOSOS ---
    c.fillStyle = skinCol;
    c.beginPath();
    c.arc(0.5, -9.5 + bob, 6.2, 0, Math.PI * 2);
    c.fill();

    // Sombra do osso frontal e têmpora
    c.fillStyle = skinShadow;
    c.fillRect(-3.5, -12.0 + bob, 4.0, 1.8);

    // Olhos Expressivos
    if (isBerserk) {
      // Olho em brasa incandescente branca com chamas de fúria
      c.fillStyle = '#ffffff';
      c.fillRect(1.8, -11.0 + bob, 3.8, 2.6);
      c.strokeStyle = '#ff3838';
      c.lineWidth = 1.2;
      c.strokeRect(1.8, -11.0 + bob, 3.8, 2.6);

      // Fumaça de sangue saindo do canto do olho
      const eyeSmoke = Math.sin(tFrame * 0.3) * 1.5;
      c.strokeStyle = 'rgba(255, 71, 87, 0.75)';
      c.lineWidth = 1.0;
      c.beginPath();
      c.moveTo(5.6, -10.0 + bob);
      c.lineTo(8.5 + eyeSmoke, -12.0 + bob);
      c.stroke();
    } else {
      // Olho vivo com íris âmbar e reflexo
      c.fillStyle = '#1e140d';
      c.fillRect(2.0, -10.5 + bob, 3.0, 2.2);
      c.fillStyle = '#f39c12';
      c.fillRect(2.8, -10.2 + bob, 1.6, 1.6);
      c.fillStyle = '#ffffff';
      c.fillRect(3.6, -10.2 + bob, 0.8, 0.8);
    }

    // Sobrancelha cerrada e ruga de expressão
    c.strokeStyle = '#4a2810';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(1.2, -11.8 + bob);
    c.lineTo(5.6, -10.5 + bob);
    c.stroke();

    // Micro-baforada de vapor nórdico da respiração
    const breathCycle = (tFrame * 0.08) % 1;
    if (breathCycle < 0.5) {
      const bProg = breathCycle * 2;
      c.fillStyle = `rgba(245, 238, 225, ${(1 - bProg) * (isBerserk ? 0.65 : 0.35)})`;
      c.beginPath();
      c.arc(5.5 + bProg * 5, -5.5 + bob - bProg * 3, 1.0 + bProg * 2.2, 0, Math.PI * 2);
      c.fill();
    }

    // --- 9. BARBA RUIVA TRANÇADA COM ANEL DE OSSO E BIGODE ---
    // Base escura da barba
    c.fillStyle = hairDark;
    c.beginPath();
    c.moveTo(-2.5, -8.5 + bob);
    c.lineTo(5.8, -8.5 + bob);
    c.quadraticCurveTo(9.0, -3 + bob, 6.5, 1.5 + bob);
    c.lineTo(1.5, 3.0 + bob);
    c.quadraticCurveTo(0.0, -3 + bob, -2.5, -8.5 + bob);
    c.closePath();
    c.fill();

    // Volume frontal ruivo vibrante
    c.fillStyle = hairCol;
    c.beginPath();
    c.moveTo(-1.8, -8.0 + bob);
    c.lineTo(5.0, -8.0 + bob);
    c.quadraticCurveTo(8.0, -3 + bob, 5.5, 1.0 + bob);
    c.lineTo(1.8, 2.2 + bob);
    c.quadraticCurveTo(0.5, -3 + bob, -1.8, -8.0 + bob);
    c.closePath();
    c.fill();

    // Trança longa pendente
    c.fillStyle = hairCol;
    c.beginPath();
    c.moveTo(1.8, 1.5 + bob);
    c.lineTo(5.2, 1.5 + bob);
    c.lineTo(3.6, 6.5 + bob);
    c.closePath();
    c.fill();

    // Argola de Marfim Rústica com gravações rúnicas
    c.fillStyle = boneCol;
    c.fillRect(2.0, 2.2 + bob, 3.2, 2.2);
    c.fillStyle = boneDark;
    c.fillRect(2.0, 2.2 + bob, 3.2, 0.6);
    c.fillStyle = brassCol;
    c.fillRect(2.8, 2.8 + bob, 1.4, 1.0);

    // Bigode farto e cerrado sobre os lábios
    c.fillStyle = hairDark;
    c.beginPath();
    c.moveTo(0.8, -7.5 + bob);
    c.lineTo(6.8, -5.8 + bob);
    c.lineTo(2.5, -5.0 + bob);
    c.closePath();
    c.fill();
    c.fillStyle = hairHigh;
    c.fillRect(2.2, -6.8 + bob, 3.0, 1.0);

    // --- 10. CABELOS LONGOS SELVAGENS ONDULANTES ---
    const hairWave = isMoving ? Math.sin(walkCycle) * 3.8 : Math.sin(tFrame * 0.08) * 1.8;
    c.fillStyle = hairDark;
    c.beginPath();
    c.moveTo(-2, -12.5 + bob);
    c.quadraticCurveTo(-9 - hairWave * 0.8, -13.5 + bob, -15 - Math.abs(hairWave * 1.1), -6 + bob + hairWave * 0.6);
    c.quadraticCurveTo(-8, -7 + bob, -4, -8 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = hairCol;
    c.beginPath();
    c.moveTo(-2, -12.0 + bob);
    c.quadraticCurveTo(-8 - hairWave * 0.7, -12.5 + bob, -13 - Math.abs(hairWave * 0.9), -5.5 + bob + hairWave * 0.5);
    c.quadraticCurveTo(-7, -6.5 + bob, -3.5, -8 + bob);
    c.closePath();
    c.fill();

    // Mechas de luz ruivas claras nos fios soltos
    c.fillStyle = hairHigh;
    c.fillRect(-6.5 - hairWave * 0.4, -10.5 + bob, 2.5, 1.2);

    // --- 11. DIADEMA DE FERRO E CHIFRES RÚSTICOS ESCULPIDOS ---
    // Diadema de ferro batido com chanfro metálico claro
    c.fillStyle = ironCol;
    c.fillRect(-5.5, -15.0 + bob, 11, 3.5);
    c.fillStyle = axeSteelLight;
    c.fillRect(-5.5, -15.0 + bob, 11, 1.0);
    // Gema / Broche central do diadema
    c.fillStyle = brassCol;
    c.fillRect(-1.0, -14.5 + bob, 2.4, 2.4);
    c.fillStyle = isBerserk ? '#ffffff' : '#f1c40f';
    c.fillRect(-0.4, -14.0 + bob, 1.2, 1.2);

    // Chifres de Marfim esculpidos com estrias de crescimento
    c.fillStyle = boneCol;
    c.strokeStyle = boneDark;
    c.lineWidth = 1.2;

    // Chifre Esquerdo
    c.beginPath();
    c.moveTo(-5.0, -13.8 + bob);
    c.quadraticCurveTo(-12.0, -17.0 + bob, -11.5, -23.0 + bob);
    c.quadraticCurveTo(-7.5, -18.0 + bob, -3.2, -14.8 + bob);
    c.closePath();
    c.fill();
    c.stroke();

    // Chifre Direito
    c.beginPath();
    c.moveTo(3.2, -14.8 + bob);
    c.quadraticCurveTo(7.5, -18.0 + bob, 11.5, -23.0 + bob);
    c.quadraticCurveTo(12.0, -17.0 + bob, 5.0, -13.8 + bob);
    c.closePath();
    c.fill();
    c.stroke();

    // Pontas escurecidas e afiadas dos chifres
    c.fillStyle = hornTip;
    c.beginPath();
    c.moveTo(-10.5, -20.5 + bob);
    c.lineTo(-11.5, -23.0 + bob);
    c.lineTo(-9.5, -20.0 + bob);
    c.closePath();
    c.fill();

    c.beginPath();
    c.moveTo(9.5, -20.0 + bob);
    c.lineTo(11.5, -23.0 + bob);
    c.lineTo(10.5, -20.5 + bob);
    c.closePath();
    c.fill();

    // Estrias horizontais de crescimento nos chifres
    c.strokeStyle = boneDark;
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-8.0, -16.5 + bob); c.lineTo(-5.5, -15.5 + bob);
    c.moveTo(-9.5, -18.5 + bob); c.lineTo(-7.5, -17.5 + bob);
    c.moveTo(5.5, -15.5 + bob); c.lineTo(8.0, -16.5 + bob);
    c.moveTo(7.5, -17.5 + bob); c.lineTo(9.5, -18.5 + bob);
    c.stroke();

    // Brilho especular branco no topo da curvatura
    c.fillStyle = '#ffffff';
    c.fillRect(-10.0, -21.0 + bob, 1.2, 1.5);
    c.fillRect(9.0, -21.0 + bob, 1.2, 1.5);
}
