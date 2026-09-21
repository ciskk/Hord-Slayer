/**
 * src/render/heroes/ignisRenderer.js
 * 
 * Renderizador procedural especializado de Ignis (MAGE).
 * Inclui túnica arcana, capuz de alta costura elemental, manto de chamas,
 * cajado solar e feitiços canalizados nos punhos.
 */

/**
 * Renderiza o modelo procedural de Ignis.
 */
export function drawIgnisModel(c, charDef, state, {
  bob = 0,
  legSwing = 0,
  capeWave = 0,
  tFrame = 0,
  isMoving = false,
  walkCycle = 0,
  scale = 1,
  isCasting = false,
  isDashing = false,
  staffCastTimer = 0
} = {}) {
    // isDashing handled via state
    // isCasting handled via state
    const cCol = charDef.color || {};
    const robeBase = cCol.robe || '#19141e';
    const robeDark = cCol.robeDark || '#0f0c13';
    const robeHigh = cCol.robeHighlight || '#2e2436';
    const robeIn = cCol.robeInner || '#9b111e';
    const corsetCol = cCol.corset || '#2c111c';
    const goldTrim = cCol.trimGold || '#f1c40f';
    const goldLight = cCol.trimGoldLight || '#ffeaa7';
    const sashCol = cCol.sash || '#e67e22';
    const sashGold = cCol.sashGold || '#f39c12';
    const rubyCol = cCol.amuletRuby || '#ff4757';
    const rubyGlow = cCol.amuletGlow || 'rgba(255, 71, 87, 0.6)';
    const skinCol = cCol.skin || '#fbe4d8';
    const skinShadow = cCol.skinShadow || '#e0b8a4';
    const hairDark = cCol.hairDark || '#781a0e';
    const hairMid = cCol.hairMid || '#c0392b';
    const hairLight = cCol.hairLight || '#e67e22';
    const hairHighlight = cCol.hairHighlight || '#f39c12';
    const eyeSpark = cCol.eyeGlow || '#ffffff';
    const eyeFlame = cCol.eyeFlame || '#f39c12';
    const flameRoot = cCol.flameRoot || '#b33939';
    const flameMid = cCol.flameMid || '#e67e22';
    const flameBright = cCol.flameBright || '#f1c40f';
    const flameTip = cCol.flameTip || '#ffffff';
    const orbCore = cCol.orbCore || '#ffffff';
    const orbGlow = cCol.orbGlow || 'rgba(243, 156, 18, 0.65)';
    const staffWood = cCol.staffWood || '#1c1417';
    const staffGold = cCol.staffGold || '#f1c40f';
    const crystalCol = cCol.crystal || '#ff4757';
    const coronaCol = cCol.staffCorona || '#f39c12';

    // --- ULT: Pós-Imagens Térmicas, Asas Espectrais de Fênix e Jato de Fogo ---
    if (isDashing) {
      c.save();
      // Jato de plasma e esteira de fogo propulsora
      const jetWave = Math.sin(tFrame * 0.6) * 3;
      c.fillStyle = 'rgba(231, 76, 60, 0.45)';
      c.beginPath();
      c.moveTo(-6, -4 + bob);
      c.quadraticCurveTo(-22, -8 + jetWave, -38, bob + jetWave);
      c.quadraticCurveTo(-22, 6 + jetWave, -6, 8 + bob);
      c.closePath();
      c.fill();

      c.fillStyle = 'rgba(241, 196, 15, 0.65)';
      c.beginPath();
      c.moveTo(-5, -2 + bob);
      c.quadraticCurveTo(-16, -4 + jetWave * 0.7, -26, bob + jetWave * 0.5);
      c.quadraticCurveTo(-16, 4 + jetWave * 0.7, -5, 5 + bob);
      c.closePath();
      c.fill();

      // Fantasmas térmicos com decaimento cromático e labaredas
      const ghostColors = [
        'rgba(255, 255, 255, 0.55)',
        'rgba(241, 196, 15, 0.45)',
        'rgba(230, 126, 34, 0.32)',
        'rgba(179, 57, 57, 0.18)'
      ];
      for (let g = 0; g < ghostColors.length; g++) {
        const gDist = (g + 1) * 9;
        c.fillStyle = ghostColors[g];
        c.beginPath();
        c.ellipse(-gDist, bob, 11 - g * 1.5, 15 - g * 1.8, 0, 0, Math.PI * 2);
        c.fill();

        // Faíscas desprendidas de cada fantasma térmico
        const gSparkY = bob + Math.sin(tFrame * 0.4 + g * 2) * 8;
        c.fillStyle = g % 2 === 0 ? '#ffffff' : '#f1c40f';
        c.fillRect(-gDist - 4, gSparkY, 1.4, 1.4);
      }

      // Anéis de solo em brasa viva sob os pés
      c.strokeStyle = 'rgba(241, 196, 15, 0.9)';
      c.lineWidth = 2.2;
      c.beginPath();
      c.ellipse(0, 14 + bob, 22, 7, 0, 0, Math.PI * 2);
      c.stroke();

      // Asas Espectrais da Fênix de Plasma
      const wingFlap = Math.sin(tFrame * 0.55) * 6;
      c.fillStyle = 'rgba(241, 196, 15, 0.55)';
      c.strokeStyle = '#ffffff';
      c.lineWidth = 2.2;

      // Asa Posterior
      c.beginPath();
      c.moveTo(-4, -8 + bob);
      c.quadraticCurveTo(-18, -26 + wingFlap, -38, -16 + wingFlap);
      c.lineTo(-24, -6 + wingFlap * 0.5);
      c.lineTo(-32, 5 + wingFlap);
      c.lineTo(-12, 4 + bob);
      c.closePath();
      c.fill();
      c.stroke();

      // Penas de labareda na Asa Posterior
      c.strokeStyle = '#e74c3c';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(-16, -14 + wingFlap * 0.6); c.lineTo(-28, -12 + wingFlap);
      c.moveTo(-12, -4 + wingFlap * 0.4); c.lineTo(-22, 1 + wingFlap * 0.8);
      c.stroke();

      // Asa Anterior
      c.strokeStyle = '#ffffff';
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(3, -8 + bob);
      c.quadraticCurveTo(16, -28 + wingFlap, 36, -20 + wingFlap);
      c.lineTo(25, -7 + wingFlap * 0.5);
      c.lineTo(31, 3 + wingFlap);
      c.lineTo(10, 3 + bob);
      c.closePath();
      c.fill();
      c.stroke();

      // Penas de labareda na Asa Anterior
      c.strokeStyle = '#e74c3c';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(14, -15 + wingFlap * 0.6); c.lineTo(26, -15 + wingFlap);
      c.moveTo(12, -4 + wingFlap * 0.4); c.lineTo(22, 0 + wingFlap * 0.8);
      c.stroke();

      c.restore();
    }

    // 0. ORBE DE PLASMA SOLAR POSTERIOR (PYROSPHERE ESQUERDA) COM RASTRO DE FOGO
    const orb1Y = -12 + bob + Math.sin(tFrame * 0.08) * 2.8;
    const orb1X = -13 + Math.cos(tFrame * 0.07) * 2.0;
    c.save();

    // Rastro de fogo vivo / cauda de plasma na pyrosphere 1
    const o1TailLen = isDashing ? 12 : (isMoving ? 8 : 5);
    const o1Angle = isDashing ? Math.PI : (isMoving ? Math.PI * 0.85 : -Math.PI * 0.5 + Math.sin(tFrame * 0.15) * 0.35);
    const o1TailTipX = orb1X + Math.cos(o1Angle) * o1TailLen;
    const o1TailTipY = orb1Y + Math.sin(o1Angle) * o1TailLen;

    // Cauda externa carmesim
    c.fillStyle = 'rgba(231, 76, 60, 0.65)';
    c.beginPath();
    c.moveTo(orb1X - 2.5, orb1Y);
    c.quadraticCurveTo(orb1X + Math.cos(o1Angle) * (o1TailLen * 0.5), orb1Y + Math.sin(o1Angle) * (o1TailLen * 0.5), o1TailTipX, o1TailTipY);
    c.quadraticCurveTo(orb1X, orb1Y + 2.5, orb1X + 2.5, orb1Y);
    c.closePath();
    c.fill();

    // Cauda interna dourada
    c.fillStyle = 'rgba(241, 196, 15, 0.85)';
    c.beginPath();
    c.moveTo(orb1X - 1.4, orb1Y);
    c.quadraticCurveTo(orb1X + Math.cos(o1Angle) * (o1TailLen * 0.4), orb1Y + Math.sin(o1Angle) * (o1TailLen * 0.4), o1TailTipX * 0.7 + orb1X * 0.3, o1TailTipY * 0.7 + orb1Y * 0.3);
    c.quadraticCurveTo(orb1X, orb1Y + 1.4, orb1X + 1.4, orb1Y);
    c.closePath();
    c.fill();

    // Fagulhas que se desprendem da cauda do orbe 1
    const o1SparkProg = ((tFrame * 0.4) % 6) / 6;
    const o1SparkX = o1TailTipX + Math.cos(o1Angle) * (o1SparkProg * 4) + Math.sin(tFrame * 0.3) * 1.2;
    const o1SparkY = o1TailTipY + Math.sin(o1Angle) * (o1SparkProg * 4) - o1SparkProg * 3;
    c.fillStyle = '#ffffff';
    c.fillRect(o1SparkX, o1SparkY, 1.2, 1.2);

    // Núcleo do orbe 1
    c.fillStyle = orbGlow;
    c.beginPath();
    c.arc(orb1X, orb1Y, 4.4 + Math.sin(tFrame * 0.2) * 0.8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = flameMid;
    c.beginPath();
    c.arc(orb1X, orb1Y, 2.6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = orbCore;
    c.beginPath();
    c.arc(orb1X - 0.4, orb1Y - 0.4, 1.3, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // 1. MANTO IMPERIAL DA FÊNIX (CAPA DUPLA DE OBSIDIANA & CARMESIM COM BORDAS DE BRASA)
    // Forro interno carmesim incandescente
    c.fillStyle = robeIn;
    c.beginPath();
    c.moveTo(-4, -2 + bob);
    c.lineTo(-16 - Math.abs(capeWave * 1.2), 17 + bob);
    c.lineTo(-9 - Math.abs(capeWave * 0.7), 12 + bob);
    c.lineTo(-13 - Math.abs(capeWave * 1.1), 19 + bob);
    c.lineTo(-2, 16 + bob);
    c.lineTo(2, -2 + bob);
    c.closePath();
    c.fill();

    // Camada externa nobre de seda vulcânica obsidiana
    c.fillStyle = robeBase;
    c.beginPath();
    c.moveTo(-4, -3 + bob);
    c.lineTo(-14 - Math.abs(capeWave * 1.0), 15 + bob);
    c.lineTo(-8 - Math.abs(capeWave * 0.6), 11 + bob);
    c.lineTo(-11 - Math.abs(capeWave * 0.9), 17 + bob);
    c.lineTo(-1, 15 + bob);
    c.lineTo(3, -3 + bob);
    c.closePath();
    c.fill();

    // Sombreamento de dobras na capa
    c.strokeStyle = robeDark;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-3, -1 + bob);
    c.lineTo(-7 - Math.abs(capeWave * 0.7), 13 + bob);
    c.stroke();

    // Brocado de ouro solar na orla da capa
    c.strokeStyle = goldTrim;
    c.lineWidth = 1.3;
    c.stroke();

    // Linha fina de ouro brilhante
    c.strokeStyle = goldLight;
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(-13.5 - Math.abs(capeWave * 1.0), 14.5 + bob);
    c.lineTo(-8 - Math.abs(capeWave * 0.6), 10.5 + bob);
    c.lineTo(-10.5 - Math.abs(capeWave * 0.9), 16.5 + bob);
    c.stroke();

    // Brasas ativas nas pontas da capa chamuscada
    const emberCapY = 16.5 + bob - ((tFrame * 0.25) % 4);
    c.fillStyle = rubyCol;
    c.fillRect(-11 - Math.abs(capeWave * 0.9), 17 + bob, 1.4, 1.4);
    c.fillStyle = flameBright;
    c.fillRect(-11.5 - Math.abs(capeWave * 0.9), emberCapY, 1.0, 1.0);

    // 2. COLDRE DORSAL DO CAJADO DA TORMENTA (Em repouso/preview, recolhe ao conjurar)
    if (!isCasting) {
      c.save();
      c.translate(-2, -3 + bob);
      c.rotate(-0.52);

      // Haste de ébano petrificado com espiral de ouro solar
      c.fillStyle = staffWood;
      c.fillRect(-1.8, -14, 3.6, 38);
      c.strokeStyle = goldTrim;
      c.lineWidth = 1.0;
      c.beginPath();
      c.moveTo(-1.8, -4); c.lineTo(1.8, -1);
      c.moveTo(-1.8, 6);  c.lineTo(1.8, 9);
      c.moveTo(-1.8, 16); c.lineTo(1.8, 19);
      c.stroke();

      // Ponteira inferior de ouro batido com anéis
      c.fillStyle = staffGold;
      c.fillRect(-2.4, 23, 4.8, 3.5);
      c.fillStyle = goldLight;
      c.fillRect(-1.2, 23.5, 2.4, 1.2);

      // Coroa com garras de ouro da fênix segurando o micro-sol
      c.fillStyle = staffGold;
      c.beginPath();
      c.moveTo(-5.5, -13);
      c.lineTo(5.5, -13);
      c.lineTo(4.5, -19);
      c.lineTo(1.0, -15);
      c.lineTo(0, -17);
      c.lineTo(-1.0, -15);
      c.lineTo(-4.5, -19);
      c.closePath();
      c.fill();
      c.strokeStyle = goldLight;
      c.lineWidth = 0.8;
      c.stroke();

      // MICRO-SOL FLUTUANTE NO NÚCLEO DO CAJADO
      const sunPulse = Math.sin(tFrame * 0.2) * 0.6;
      // Corona de calor externa
      c.fillStyle = coronaCol;
      c.beginPath();
      c.arc(0, -19.5, 4.8 + sunPulse, 0, Math.PI * 2);
      c.fill();

      // Núcleo rubi solar
      c.fillStyle = crystalCol;
      c.beginPath();
      c.arc(0, -19.5, 3.2, 0, Math.PI * 2);
      c.fill();

      // Ponto de fusão solar branca no núcleo
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(-0.8, -20.3, 1.4, 0, Math.PI * 2);
      c.fill();

      // Anel orbital dourado inclinado
      c.strokeStyle = goldLight;
      c.lineWidth = 0.9;
      c.beginPath();
      c.ellipse(0, -19.5, 6.0, 1.8, -0.4, 0, Math.PI * 2);
      c.stroke();

      c.restore();
    }

    // 3. PERNAS & BOTAS ARCANAS DE BATALHA
    const legLeftX = -5.5 - legSwing * 0.35;
    const legRightX = 1.2 + legSwing * 0.35;

    // Sombra das pernas sob o manto
    c.fillStyle = robeDark;
    c.fillRect(legLeftX, 6 + bob, 4.2, 7.5);
    c.fillRect(legRightX, 6 + bob, 4.2, 7.5);

    // Botas pontiagudas de couro nobre
    c.fillStyle = '#1c1417';
    c.fillRect(legLeftX - 0.8, 11 + bob, 5.4, 4.5);
    c.fillRect(legRightX - 0.8, 11 + bob, 5.4, 4.5);

    // Punhos de cano das botas em ouro solar
    c.fillStyle = goldTrim;
    c.fillRect(legLeftX - 0.5, 10.5 + bob, 4.8, 1.6);
    c.fillRect(legRightX - 0.5, 10.5 + bob, 4.8, 1.6);
    c.fillStyle = goldLight;
    c.fillRect(legLeftX, 10.8 + bob, 2.0, 0.8);
    c.fillRect(legRightX, 10.8 + bob, 2.0, 0.8);

    // Bico curvado das botas com placa dourada
    c.fillStyle = goldTrim;
    c.fillRect(legLeftX + 3.0, 13.8 + bob, 1.8, 1.4);
    c.fillRect(legRightX + 3.0, 13.8 + bob, 1.8, 1.4);

    // 4. TRONCO COM TÚNICA DRAPEADA, CORSELETE & FAIXA DE SEDA SOLAR
    // Túnica base de obsidiana
    c.fillStyle = robeBase;
    c.beginPath();
    c.moveTo(-7.5, -5 + bob);
    c.lineTo(7.5, -5 + bob);
    c.lineTo(5.5, 8 + bob);
    c.lineTo(-5.5, 8 + bob);
    c.closePath();
    c.fill();

    // Sombra de drapeado lateral
    c.fillStyle = robeDark;
    c.beginPath();
    c.moveTo(-7.5, -5 + bob);
    c.lineTo(-5.0, -5 + bob);
    c.lineTo(-4.0, 8 + bob);
    c.lineTo(-5.5, 8 + bob);
    c.closePath();
    c.fill();

    // Friso de luz no veludo
    c.fillStyle = robeHigh;
    c.fillRect(-2, -4 + bob, 4, 11);

    // Corselete escuro com debrum e amarração nobre
    c.fillStyle = corsetCol;
    c.beginPath();
    c.moveTo(-5.5, -4 + bob);
    c.lineTo(5.5, -4 + bob);
    c.lineTo(4.2, 5 + bob);
    c.lineTo(-4.2, 5 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = goldTrim;
    c.lineWidth = 0.9;
    c.stroke();

    // AMULETO "CORAÇÃO DE MAGMA" NO PEITO
    const amuletPulse = Math.sin(tFrame * 0.15) * 0.3 + 0.7;
    // Halo vermelho-solar emitido pelo amuleto
    c.fillStyle = rubyGlow;
    c.beginPath();
    c.arc(0, -1.0 + bob, 4.5 * amuletPulse, 0, Math.PI * 2);
    c.fill();

    // Suporte dourado do amuleto
    c.fillStyle = goldTrim;
    c.beginPath();
    c.moveTo(0, -3.2 + bob);
    c.lineTo(2.2, -1.0 + bob);
    c.lineTo(0, 1.2 + bob);
    c.lineTo(-2.2, -1.0 + bob);
    c.closePath();
    c.fill();

    // Gema rubi incandescente
    c.fillStyle = rubyCol;
    c.beginPath();
    c.moveTo(0, -2.5 + bob);
    c.lineTo(1.5, -1.0 + bob);
    c.lineTo(0, 0.5 + bob);
    c.lineTo(-1.5, -1.0 + bob);
    c.closePath();
    c.fill();
    c.fillStyle = '#ffffff';
    c.fillRect(-0.4, -1.6 + bob, 0.8, 0.8);

    // Faixa de seda solar (Obi Arcano) com laço e fitas rituais
    c.fillStyle = sashCol;
    c.fillRect(-6, 4.5 + bob, 12, 3.2);

    // Fitas cerimoniais pendentes gravadas com runas solares
    c.fillStyle = sashCol;
    c.beginPath();
    c.moveTo(-2.5, 6.5 + bob);
    c.lineTo(1.5, 6.5 + bob);
    c.lineTo(1.0, 14.5 + bob);
    c.lineTo(-0.5, 16.0 + bob);
    c.lineTo(-2.0, 14.5 + bob);
    c.closePath();
    c.fill();

    // Runa bordada em ouro na fita cerimonial
    c.fillStyle = sashGold;
    c.fillRect(-1.4, 8.5 + bob, 1.8, 4.0);
    c.fillRect(-2.0, 9.8 + bob, 3.0, 1.2);

    // Fivela de sol dourado no cinto
    c.fillStyle = goldTrim;
    c.fillRect(-2.6, 4.0 + bob, 5.2, 4.0);
    c.fillStyle = goldLight;
    c.fillRect(-1.2, 4.8 + bob, 2.4, 2.4);
    c.fillStyle = rubyCol;
    c.fillRect(-0.6, 5.4 + bob, 1.2, 1.2);

    // 5. CABELO DE FOGO VIVO POSTERIOR (MANTO FLAMEJANTE TRASEIRO)
    // Cabelos de fogo fluido saindo de sob o capuz e descendo pelas costas
    const flameSway = isMoving ? Math.sin(walkCycle) * 3.5 : Math.sin(tFrame * 0.12) * 2.0;

    // Mecha base carmesim profunda
    c.fillStyle = flameRoot;
    c.beginPath();
    c.moveTo(-4, -10 + bob);
    c.quadraticCurveTo(-11 - flameSway * 0.7, -6 + bob, -15 - Math.abs(flameSway * 1.0), 0 + bob + flameSway);
    c.quadraticCurveTo(-13 - flameSway * 0.4, 7 + bob, -17 - Math.abs(flameSway * 1.1), 12 + bob + flameSway * 1.2);
    c.quadraticCurveTo(-9 - flameSway * 0.3, 5 + bob, -3, -3 + bob);
    c.closePath();
    c.fill();

    // Mecha média em laranja solar vivo
    c.fillStyle = flameMid;
    c.beginPath();
    c.moveTo(-3.5, -9.5 + bob);
    c.quadraticCurveTo(-9 - flameSway * 0.6, -5 + bob, -12 - Math.abs(flameSway * 0.8), 1 + bob + flameSway * 0.8);
    c.quadraticCurveTo(-10 - flameSway * 0.3, 8 + bob, -14 - Math.abs(flameSway * 0.9), 10 + bob + flameSway);
    c.quadraticCurveTo(-7 - flameSway * 0.2, 4 + bob, -2.5, -4 + bob);
    c.closePath();
    c.fill();

    // Mecha interna de luz dourada
    c.fillStyle = flameBright;
    c.beginPath();
    c.moveTo(-3, -9 + bob);
    c.quadraticCurveTo(-7 - flameSway * 0.5, -3 + bob, -9 - Math.abs(flameSway * 0.6), 3 + bob + flameSway * 0.6);
    c.lineTo(-6, 2 + bob);
    c.closePath();
    c.fill();

    // Fagulhas que se desprendem no ar
    const fSparkY = 9 + bob - ((tFrame * 0.35) % 8);
    c.fillStyle = flameTip;
    c.fillRect(-15 - Math.abs(flameSway * 1.0), 12 + bob + flameSway, 1.8, 1.8);
    c.fillRect(-16 - Math.abs(flameSway * 0.9), fSparkY, 1.2, 1.2);

    // 6. OMBREIRAS ARCANAS EM LEQUE (OBSIDIANA & OURO)
    // Ombreira posterior
    c.fillStyle = robeBase;
    c.beginPath();
    c.moveTo(-7, -5 + bob);
    c.lineTo(-13, -2 + bob);
    c.lineTo(-12, -8 + bob);
    c.lineTo(-6, -6 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = goldTrim;
    c.lineWidth = 1.2;
    c.stroke();
    c.fillStyle = goldLight;
    c.fillRect(-11, -7 + bob, 3, 1);

    // Ombreira dianteira
    c.fillStyle = robeBase;
    c.beginPath();
    c.moveTo(5.0, -3.5 + bob);
    c.lineTo(13.0, -1.0 + bob);
    c.lineTo(11.0, -6.5 + bob);
    c.lineTo(4.5, -4.5 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = goldTrim;
    c.lineWidth = 1.0;
    c.stroke();
    c.fillStyle = goldLight;
    c.fillRect(7.5, -6.0 + bob, 3.0, 1.0);

    // 7. GOLA ALTA DE ARQUIMAGA & PESCOÇO DE PORCELANA
    // Gola alta de veludo carmesim imperial com debrum dourado atrás do pescoço
    c.fillStyle = robeIn;
    c.beginPath();
    c.moveTo(-4.5, -5.0 + bob);
    c.lineTo(-6.5, -11.0 + bob);
    c.lineTo(-3.5, -7.5 + bob);
    c.lineTo(-2.0, -5.0 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = goldTrim;
    c.lineWidth = 0.9;
    c.stroke();

    // Base do pescoço
    c.fillStyle = skinCol;
    c.fillRect(-0.8, -6.8 + bob, 3.6, 2.2);
    c.fillStyle = skinShadow;
    c.fillRect(-0.8, -5.6 + bob, 3.6, 1.0);

    // 8. CABELO POSTERIOR FLUIDO & JUBA DE FOGO VIVO
    // Camadas de fogo ondulantes que descem pelas costas sob a gola
    c.fillStyle = flameRoot;
    c.beginPath();
    c.moveTo(-2.5, -12.0 + bob);
    c.quadraticCurveTo(-7.0 - flameSway * 0.5, -10.0 + bob, -11.0 - Math.abs(flameSway * 0.8), -3.0 + bob + flameSway * 0.4);
    c.quadraticCurveTo(-13.0 - flameSway * 0.4, 4.0 + bob, -15.0 - Math.abs(flameSway * 1.0), 9.0 + bob + flameSway);
    c.quadraticCurveTo(-8.0 - flameSway * 0.2, 5.0 + bob, -2.5, -2.0 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = flameMid;
    c.beginPath();
    c.moveTo(-2.0, -11.0 + bob);
    c.quadraticCurveTo(-5.5 - flameSway * 0.4, -9.0 + bob, -9.0 - Math.abs(flameSway * 0.6), -2.0 + bob + flameSway * 0.3);
    c.quadraticCurveTo(-10.0 - flameSway * 0.3, 5.0 + bob, -12.5 - Math.abs(flameSway * 0.8), 8.0 + bob + flameSway);
    c.quadraticCurveTo(-6.5 - flameSway * 0.2, 4.0 + bob, -2.0, -3.0 + bob);
    c.closePath();
    c.fill();

    // 9. CABEÇA E ROSTO FEMININO DELICADO (ESTILO ANIME / FEITICEIRA)
    // Cabeça oval graciosa em tom de porcelana
    c.fillStyle = skinCol;
    c.beginPath();
    c.arc(0.6, -9.5 + bob, 5.6, 0, Math.PI * 2);
    c.fill();

    // Sombra suave 2.5D na mandíbula inferior
    c.fillStyle = skinShadow;
    c.beginPath();
    c.arc(0.6, -9.5 + bob, 5.6, Math.PI * 0.28, Math.PI * 0.72);
    c.fill();

    // Rubor térmico suave nas maçãs do rosto
    c.fillStyle = 'rgba(231, 76, 60, 0.18)';
    c.beginPath();
    c.ellipse(3.2, -8.6 + bob, 1.5, 0.8, 0, 0, Math.PI * 2);
    c.fill();

    // Orelha graciosa
    c.fillStyle = skinCol;
    c.beginPath();
    c.ellipse(-2.5, -9.2 + bob, 1.2, 1.5, -0.15, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = skinShadow;
    c.beginPath();
    c.ellipse(-2.3, -9.2 + bob, 0.6, 0.9, -0.15, 0, Math.PI * 2);
    c.fill();

    // Brinco pendente de rubi com engaste dourado
    c.fillStyle = goldTrim;
    c.fillRect(-2.8, -7.8 + bob, 1.0, 1.2);
    c.fillStyle = rubyCol;
    c.beginPath();
    c.moveTo(-2.3, -6.6 + bob);
    c.lineTo(-1.5, -5.5 + bob);
    c.lineTo(-2.3, -4.4 + bob);
    c.lineTo(-3.1, -5.5 + bob);
    c.closePath();
    c.fill();
    c.fillStyle = '#ffffff';
    c.fillRect(-2.4, -5.8 + bob, 0.6, 0.6);

    // OLHO SOLAR AMENDOADO RADIANTE (ESTILO ANIME / FANTASIA)
    // 1. Esclera branca límpida
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(3.6, -9.8 + bob, 2.0, 1.5, -0.05, 0, Math.PI * 2);
    c.fill();

    // 2. Íris de fogo âmbar/ouro incandescente
    c.fillStyle = '#e67e22';
    c.beginPath();
    c.arc(3.9, -9.8 + bob, 1.3, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#f1c40f';
    c.beginPath();
    c.arc(4.1, -9.8 + bob, 0.75, 0, Math.PI * 2);
    c.fill();

    // 3. Delineado superior e cílios arqueados de feiticeira
    c.strokeStyle = '#140c0a';
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(1.6, -10.0 + bob);
    c.quadraticCurveTo(3.6, -11.5 + bob, 5.8, -9.6 + bob);
    c.stroke();

    // 4. Ponto duplo de brilho especular branco puro
    c.fillStyle = '#ffffff';
    c.fillRect(4.1, -10.4 + bob, 0.8, 0.8);
    c.fillRect(3.2, -9.5 + bob, 0.4, 0.4);

    // Sobrancelha fina ruiva arqueada
    c.strokeStyle = hairDark;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(1.8, -12.0 + bob);
    c.quadraticCurveTo(3.6, -13.0 + bob, 5.5, -11.2 + bob);
    c.stroke();

    // Lábio carmesim delicado
    c.fillStyle = '#d63031';
    c.fillRect(3.2, -7.0 + bob, 1.8, 0.8);
    c.fillStyle = '#ff7675';
    c.fillRect(3.8, -7.0 + bob, 0.7, 0.4);

    // 10. CABELO RUIVO VOLUMOSO & FRANJA ELEGANTE
    // Calota superior em ruivo escuro
    c.fillStyle = hairDark;
    c.beginPath();
    c.arc(0.2, -11.5 + bob, 6.2, Math.PI * 0.95, Math.PI * 1.95);
    c.fill();

    // Mecha lateral suave atrás da orelha
    c.fillStyle = hairMid;
    c.beginPath();
    c.moveTo(-4.2, -11.8 + bob);
    c.quadraticCurveTo(-3.0, -8.0 + bob, -4.2, -5.0 + bob);
    c.lineTo(-2.2, -5.0 + bob);
    c.quadraticCurveTo(-1.2, -8.0 + bob, -2.5, -11.8 + bob);
    c.closePath();
    c.fill();

    // Franja repicada da arquimaga (desce graciosa na testa, sem encobrir o olho)
    c.fillStyle = hairMid;
    c.beginPath();
    c.moveTo(-1.2, -14.8 + bob);
    c.quadraticCurveTo(0.0, -13.2 + bob, 0.8, -12.4 + bob);
    c.lineTo(1.5, -14.0 + bob);
    c.closePath();
    c.fill();

    c.beginPath();
    c.moveTo(1.2, -15.0 + bob);
    c.quadraticCurveTo(2.2, -13.5 + bob, 2.8, -12.5 + bob);
    c.quadraticCurveTo(3.2, -13.6 + bob, 3.8, -14.5 + bob);
    c.closePath();
    c.fill();

    // Fio de luz solar acobreado na franja
    c.strokeStyle = hairLight;
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(1.6, -14.5 + bob);
    c.lineTo(2.6, -12.8 + bob);
    c.stroke();
    c.fillStyle = hairHighlight;
    c.fillRect(2.0, -13.6 + bob, 0.8, 0.8);

    // 11. DIADEMA SOLAR DE FEITICEIRA (TIARA DE OURO E RUBI)
    // Diadema gracioso coroando o alto da cabeça
    c.fillStyle = goldTrim;
    c.beginPath();
    c.moveTo(-0.5, -15.0 + bob);
    c.lineTo(1.8, -16.8 + bob);
    c.lineTo(4.0, -15.2 + bob);
    c.lineTo(3.4, -14.4 + bob);
    c.lineTo(1.8, -15.8 + bob);
    c.lineTo(0.0, -14.4 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = goldLight;
    c.lineWidth = 0.5;
    c.stroke();

    // Gema rubi lapidada incandescente no centro da tiara
    c.fillStyle = rubyCol;
    c.beginPath();
    c.moveTo(1.8, -17.2 + bob);
    c.lineTo(2.5, -16.2 + bob);
    c.lineTo(1.8, -15.2 + bob);
    c.lineTo(1.1, -16.2 + bob);
    c.closePath();
    c.fill();
    c.fillStyle = '#ffffff';
    c.fillRect(1.6, -16.6 + bob, 0.6, 0.6);

    // 12. PARTÍCULAS E BRASAS ELEMENTAIS TRASEIRAS
    const fSparkY2 = 9 + bob - (((tFrame + 10) * 0.35) % 8);
    c.fillStyle = flameTip;
    c.fillRect(-14 - Math.abs(flameSway * 1.0), 10 + bob + flameSway, 1.5, 1.5);
    c.fillRect(-15 - Math.abs(flameSway * 0.9), fSparkY2, 1.0, 1.0);

    // 13. ORBE DE PLASMA SOLAR ANTERIOR (PYROSPHERE DIREITA) COM RASTRO DE FOGO
    // Desenhado à frente do ombro para criar profundidade 3D
    const orb2Y = -14 + bob + Math.sin(tFrame * 0.08 + Math.PI) * 2.8;
    const orb2X = 13 + Math.cos(tFrame * 0.07 + Math.PI) * 2.0;
    c.save();

    // Rastro de fogo vivo / cauda de plasma na pyrosphere 2
    const o2TailLen = isDashing ? 13 : (isMoving ? 8.5 : 5.5);
    const o2Angle = isDashing ? Math.PI : (isMoving ? Math.PI * 0.82 : -Math.PI * 0.5 + Math.sin(tFrame * 0.15 + 2) * 0.35);
    const o2TailTipX = orb2X + Math.cos(o2Angle) * o2TailLen;
    const o2TailTipY = orb2Y + Math.sin(o2Angle) * o2TailLen;

    // Cauda externa carmesim
    c.fillStyle = 'rgba(231, 76, 60, 0.65)';
    c.beginPath();
    c.moveTo(orb2X - 2.5, orb2Y);
    c.quadraticCurveTo(orb2X + Math.cos(o2Angle) * (o2TailLen * 0.5), orb2Y + Math.sin(o2Angle) * (o2TailLen * 0.5), o2TailTipX, o2TailTipY);
    c.quadraticCurveTo(orb2X, orb2Y + 2.5, orb2X + 2.5, orb2Y);
    c.closePath();
    c.fill();

    // Cauda interna dourada
    c.fillStyle = 'rgba(241, 196, 15, 0.85)';
    c.beginPath();
    c.moveTo(orb2X - 1.4, orb2Y);
    c.quadraticCurveTo(orb2X + Math.cos(o2Angle) * (o2TailLen * 0.4), orb2Y + Math.sin(o2Angle) * (o2TailLen * 0.4), o2TailTipX * 0.7 + orb2X * 0.3, o2TailTipY * 0.7 + orb2Y * 0.3);
    c.quadraticCurveTo(orb2X, orb2Y + 1.4, orb2X + 1.4, orb2Y);
    c.closePath();
    c.fill();

    // Fagulhas que se desprendem da cauda do orbe 2
    const o2SparkProg = (((tFrame + 12) * 0.4) % 6) / 6;
    const o2SparkX = o2TailTipX + Math.cos(o2Angle) * (o2SparkProg * 4) + Math.sin(tFrame * 0.3 + 1) * 1.2;
    const o2SparkY = o2TailTipY + Math.sin(o2Angle) * (o2SparkProg * 4) - o2SparkProg * 3;
    c.fillStyle = '#ffffff';
    c.fillRect(o2SparkX, o2SparkY, 1.2, 1.2);

    // Núcleo do orbe 2
    c.fillStyle = orbGlow;
    c.beginPath();
    c.arc(orb2X, orb2Y, 4.6 + Math.sin(tFrame * 0.22) * 0.8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = flameMid;
    c.beginPath();
    c.arc(orb2X, orb2Y, 2.7, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = orbCore;
    c.beginPath();
    c.arc(orb2X - 0.4, orb2Y - 0.4, 1.3, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // 10. BRAÇO, MANOPLA E POSTURAS (CONJURAÇÃO DO CAJADO OU REPOUSO)
    if (isCasting) {
      // POSTURA DE CONJURAÇÃO DE COMBATE: Braço estendido à frente canalizando o Cajado da Tormenta
      c.fillStyle = robeBase;
      c.fillRect(2, -4 + bob, 8, 4.2);
      c.fillStyle = goldTrim;
      c.fillRect(8, -4.2 + bob, 2.2, 4.6);
      c.fillStyle = skinCol;
      c.fillRect(9.5, -3.8 + bob, 3.2, 3.4);

      // Cajado frontal empunhado com o Micro-Sol flamejante
      c.save();
      c.translate(12, -2 + bob);
      c.rotate(0.25);

      // Haste
      c.fillStyle = staffWood;
      c.fillRect(-1.6, -18, 3.2, 38);
      c.strokeStyle = goldTrim;
      c.lineWidth = 1.0;
      c.beginPath();
      c.moveTo(-1.6, -10); c.lineTo(1.6, -7);
      c.moveTo(-1.6, 2);   c.lineTo(1.6, 5);
      c.stroke();

      // Coroa de garras douradas
      c.fillStyle = staffGold;
      c.fillRect(-2.4, -18, 4.8, 5.0);

      // Micro-Sol energizado com halo de plasma em expansão
      const cPulse = Math.sin(tFrame * 0.3) * 1.5;
      c.fillStyle = 'rgba(243, 156, 18, 0.45)';
      c.beginPath();
      c.arc(0, -22, 9.0 + cPulse, 0, Math.PI * 2);
      c.fill();

      // Corona de calor
      c.fillStyle = coronaCol;
      c.beginPath();
      c.arc(0, -22, 5.5 + cPulse * 0.5, 0, Math.PI * 2);
      c.fill();

      // Cristal solar central
      c.fillStyle = crystalCol;
      c.beginPath();
      c.arc(0, -22, 3.6, 0, Math.PI * 2);
      c.fill();

      // Núcleo solar branco
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(-1.0, -23, 1.6, 0, Math.PI * 2);
      c.fill();

      // Anéis de ignição térmica arremessados à frente
      c.strokeStyle = 'rgba(255, 234, 167, 0.85)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(6, -22, 6.0 + cPulse, -Math.PI * 0.5, Math.PI * 0.5);
      c.stroke();

      c.restore();
    } else {
      // POSTURA NORMAL: Braço em repouso gracioso com manga recortada e mão mágica
      c.fillStyle = robeBase;
      c.fillRect(5, -2 + bob, 4.2, 7.5);
      c.fillStyle = goldTrim;
      c.fillRect(5, 2 + bob, 4.2, 2.4);
      c.fillStyle = goldLight;
      c.fillRect(5.5, 2.2 + bob, 2.0, 1.0);
      c.fillStyle = skinCol;
      c.fillRect(5.5, 4.4 + bob, 3.2, 2.8);

      // Pequena faísca mágica na ponta dos dedos
      const fTipY = 7.5 + bob + Math.sin(tFrame * 0.2) * 1.0;
      c.fillStyle = flameBright;
      c.fillRect(6.2, fTipY, 1.4, 1.4);
      c.fillStyle = '#ffffff';
      c.fillRect(6.5, fTipY + 0.2, 0.8, 0.8);
    }
}
