/**
 * src/render/heroes/valeriaRenderer.js
 * 
 * Renderizador procedural especializado de Valeria (ALCHEMIST).
 * Inclui sobretudo alquímico, cinto com frascos e poções transmutadas,
 * bolsa de reagentes, luvas de couro e postura de arremesso.
 */

/**
 * Renderiza o modelo procedural de Valeria.
 */
import { skinGradient, skinPolygon, skinLine, skinGem, skinSprig } from './skinMaterials.js';
import {
  getValeriaPressure, drawValeriaSeal, drawValeriaVapor, drawValeriaReactiveCloth,
  drawValeriaPressureRig, drawValeriaRespirator, drawValeriaVolatileFlask
} from '../valeriaUlt.js';

export function drawValeriaModel(c, charDef, state, {
  bob = 0,
  legSwing = 0,
  capeWave = 0,
  tFrame = 0,
  isMoving = false,
  walkCycle = 0,
  scale = 1,
  isThrowing = false,
  isAlchemistSkill = false,
  isAlchemistCombat = false,
  alchemistSkillTimer = 0,
  fluidColor = '#9b59b6'
} = {}) {
    const cCol = charDef.color || {};
    const coatCol = cCol.coat || '#112920';
    const coatDark = cCol.coatDark || '#081611';
    const coatLight = cCol.coatLight || '#165b45';
    const coatHigh = cCol.coatHighlight || '#1d6f54';
    const trimGold = cCol.trimGold || '#f39c12';
    const brassCol = cCol.brass || '#d4a373';
    const brassBright = cCol.brassBright || '#f5cd79';
    const brassDark = cCol.brassDark || '#8a5d3b';
    const brassGlint = cCol.brassGlint || '#ffffff';
    const copperCol = cCol.copper || '#b87333';
    const copperLight = cCol.copperLight || '#d98845';
    const leatherCol = cCol.leather || '#2c1e18';
    const leatherDark = cCol.leatherDark || '#17100d';
    const leatherStitch = cCol.leatherStitch || '#4a3525';
    const hairBase = cCol.hair || '#3a134a';
    const hairMid = cCol.hairMid || '#6a258a';
    const hairHigh = cCol.hairHighlight || '#a55eea';
    const skinTone = cCol.skin || '#fae1cb';
    const skinShadow = cCol.skinShadow || '#e0b08a';
    const eyeCol = cCol.eyeGlow || '#00ffcc';
    const lensCol = cCol.lens || '#00ffcc';
    const acidBase = state.evolvedPotion ? (cCol.acidEvolved || '#a29bfe') : (cCol.acid || '#9b59b6');
    const acidGlow = state.evolvedPotion ? (cCol.acidEvolvedGlow || '#e056fd') : (cCol.acidGlow || '#d6a2e8');
    const reagentPurple = cCol.reagentPurple || '#8e44ad';
    const reagentPurpleGlow = cCol.reagentPurpleGlow || '#d6a2e8';
    const reagentMutagen = cCol.reagentMutagen || '#6c218a';
    const reagentAmber = cCol.reagentAmber || '#f39c12';
    const reagentAmberGlow = cCol.reagentAmberGlow || '#f1c40f';

    const hairSway = isMoving ? Math.sin(walkCycle) * 4.5 : Math.sin(tFrame * 0.08) * 1.8;
    const coatSway = isMoving ? Math.sin(walkCycle * 1.1) * 3.5 : Math.sin(tFrame * 0.07) * 1.4;
    const isOvercharged = isAlchemistSkill || (alchemistSkillTimer > 0);
    const pressure = getValeriaPressure(alchemistSkillTimer, isAlchemistSkill);
    const isDetailed = scale >= 1.5;
    const velvetMaterial = skinGradient(c, -12, bob, 21, 10, coatDark, coatLight, '#508b71');
    const agedBrass = skinGradient(c, -8, -5+bob, 16, 8, brassDark, brassCol, '#e4c997');

    // --- 0. RIM LIGHT CÁUSTICA (Luz de contorno violeta/roxa emitida pelo veneno) ---
    c.save();
    c.strokeStyle = isOvercharged ? 'rgba(224, 86, 253, 0.65)' : 'rgba(155, 89, 182, 0.40)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-6, 2 + bob);
    c.lineTo(-14 - Math.abs(coatSway * 1.0), 16 + bob);
    c.lineTo(-8 - Math.abs(coatSway * 0.5), 18 + bob);
    c.stroke();
    c.restore();

    // =========================================================================
    // 1. HABILIDADE: CÍRCULO RÚNICO DE TRANSMUTAÇÃO NO SOLO
    // =========================================================================
    if (isOvercharged) {
      drawValeriaSeal(c, tFrame, pressure, isDetailed);
      drawValeriaVapor(c, tFrame, bob, pressure, false, state.effectHeadroom);
    }

    // =========================================================================
    // 2. CAPA / FRAQUE POSTERIOR VIRIDIAN (TAILCOAT DE ALQUIMISTA)
    // =========================================================================
    // Camada interna escura com degradê
    c.fillStyle = coatDark;
    c.beginPath();
    c.moveTo(-5, 2 + bob);
    c.lineTo(-14 - Math.abs(coatSway * 1.0), 16 + bob);
    c.lineTo(-8 - Math.abs(coatSway * 0.5), 18 + bob);
    c.lineTo(-2, 16 + bob);
    c.lineTo(3, 2 + bob);
    c.closePath();
    c.fill();

    // Camada principal de veludo viridian
    c.fillStyle = velvetMaterial;
    c.beginPath();
    c.moveTo(-5, 1 + bob);
    c.lineTo(-12 - Math.abs(coatSway * 0.9), 15 + bob);
    c.lineTo(-7 - Math.abs(coatSway * 0.5), 17 + bob);
    c.lineTo(-2, 15 + bob);
    c.lineTo(3, 1 + bob);
    c.closePath();
    c.fill();

    drawValeriaReactiveCloth(c, tFrame, pressure, isDetailed, bob, coatSway);

    // Abas com reflexo suave de luz
    c.fillStyle = coatHigh;
    c.beginPath();
    c.moveTo(-4, 2 + bob);
    c.lineTo(-10 - Math.abs(coatSway * 0.8), 14 + bob);
    c.lineTo(-6 - Math.abs(coatSway * 0.4), 15 + bob);
    c.lineTo(-2, 13 + bob);
    c.closePath();
    c.fill();

    // Debrum dourado de latão polido na bainha
    c.strokeStyle = brassCol;
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(-12 - Math.abs(coatSway * 0.9), 15 + bob);
    c.lineTo(-7 - Math.abs(coatSway * 0.5), 17 + bob);
    c.lineTo(-2, 15 + bob);
    c.stroke();

    // Botanical needlework follows the moving panel of the expedition coat.
    skinSprig(c, -8-Math.abs(coatSway*.5), 14+bob, 8, .24, '#c3b484', isDetailed);
    if (isDetailed) {
      skinLine(c, [[-11-Math.abs(coatSway*.8),14+bob],[-7-Math.abs(coatSway*.5),16+bob],[-3,14+bob]], '#83b498', .3);
    }

    // Ponto de brilho metálico na ponta da bainha
    c.fillStyle = brassGlint;
    c.fillRect(-7.5 - Math.abs(coatSway * 0.5), 16.5 + bob, 1.2, 1.2);

    // =========================================================================
    // 3. APARATO DORSAL ALEMBIC (TANQUE DE VIDRO SOPRADO, SERPENTINA E MANÔMETRO)
    // =========================================================================
    c.save();
    c.translate(-7.5, -2 + bob);

    // Suporte dorsal de couro grosso com rebites
    c.fillStyle = leatherDark;
    c.fillRect(-2.2, -5.5, 4.4, 15.0);
    c.fillStyle = brassCol;
    c.fillRect(-1.8, -4.5, 1.0, 1.0);
    c.fillRect(-1.8, 7.5, 1.0, 1.0);

    // Cilindro de vidro reforçado com dupla espessura
    c.fillStyle = 'rgba(12, 25, 20, 0.94)';
    c.beginPath();
    c.roundRect(-3.5, -6.5, 6.2, 16.0, 2);
    c.fill();
    c.strokeStyle = brassCol;
    c.lineWidth = 1.1;
    c.stroke();

    // Líquido cáustico efervescente no interior (slosh dinâmico com menisco)
    const slosh = Math.sin(tFrame * 0.15) * 1.0;
    c.save();
    c.beginPath();
    c.roundRect(-3.0, -1.5, 5.2, 10.5, [0, 0, 1.5, 1.5]);
    c.clip();

    // Gradiente do líquido cáustico
    c.fillStyle = acidBase;
    c.fillRect(-3.5, -1.2 + slosh, 6.2, 11.5);

    // Linha luminosa de menisco na superfície do líquido
    c.strokeStyle = acidGlow;
    c.lineWidth = 1.0;
    c.beginPath();
    c.moveTo(-3.5, -1.2 + slosh);
    c.lineTo(2.7, -1.2 - slosh * 0.6);
    c.stroke();

    // Microbolhas ativas subindo em velocidades desiguais
    const b1Y = 8.0 - ((tFrame * 0.32) % 9.5);
    const b2Y = 8.5 - (((tFrame + 14) * 0.24) % 9.5);
    const b3Y = 7.5 - (((tFrame + 28) * 0.38) % 9.5);

    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(-1.2, b1Y, 0.8, 0, Math.PI * 2);
    c.arc(0.8, b2Y, 0.6, 0, Math.PI * 2);
    c.arc(-0.2, b3Y, 0.5, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // Chanfro de reflexo curvo de vidro soprado (vidro científico cristalino)
    c.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(-2.6, -5.2);
    c.lineTo(-2.6, 8.2);
    c.stroke();

    // Serpentina de tubulação de cobre contornando a lateral do tanque
    c.strokeStyle = copperCol;
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(-3.2, -3.5); c.lineTo(-4.5, -2.5); c.lineTo(-3.2, -1.5);
    c.moveTo(-3.2, 0.5);  c.lineTo(-4.5, 1.5);  c.lineTo(-3.2, 2.5);
    c.moveTo(-3.2, 4.5);  c.lineTo(-4.5, 5.5);  c.lineTo(-3.2, 6.5);
    c.stroke();
    c.strokeStyle = copperLight;
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(-4.2, -2.5); c.lineTo(-4.0, -2.3);
    c.moveTo(-4.2, 1.5);  c.lineTo(-4.0, 1.7);
    c.moveTo(-4.2, 5.5);  c.lineTo(-4.0, 5.7);
    c.stroke();

    // Oxidation lives at solder joints; machined collars catch a warm highlight.
    for (const jointY of [-3.5,.5,4.5]) {
      skinLine(c, [[-3.4,jointY-.3],[-2.8,jointY+.3]], '#6d9c85', .75);
      skinLine(c, [[-4.5,jointY+1],[-4,jointY+1.5]], '#f0c393', .35);
    }
    if (isDetailed) {
      // Etched capacity markings remain on the glass, under the gauge.
      for (let tick=0;tick<5;tick++) skinLine(c, [[.8,-4+tick*2],[1.6,-4+tick*2]], '#e2dace99', .3);
    }

    // Manômetro de latão trabalhado com escala de pressão
    c.fillStyle = brassCol;
    c.beginPath();
    c.arc(3.0, 1.0, 2.8, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = brassDark;
    c.lineWidth = 0.8;
    c.stroke();

    // Mostrador branco do manômetro
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(3.0, 1.0, 2.0, 0, Math.PI * 2);
    c.fill();

    // Zona vermelha de perigo na escala
    c.strokeStyle = '#e74c3c';
    c.lineWidth = 0.6;
    c.beginPath();
    c.arc(3.0, 1.0, 1.5, -Math.PI * 0.4, 0);
    c.stroke();

    // Ponteiro funcional oscilante com trepidação física de pressão
    const needleVibe = Math.sin(tFrame * 0.4) * 0.15;
    const needleAng = isOvercharged 
      ? (-Math.PI * 0.2 + needleVibe * 2.5) 
      : (-Math.PI * 0.75 + Math.sin(tFrame * 0.1) * 0.5 + needleVibe);
    c.strokeStyle = isOvercharged ? '#c0392b' : '#2c1e18';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(3.0, 1.0);
    c.lineTo(3.0 + Math.cos(needleAng) * 1.6, 1.0 + Math.sin(needleAng) * 1.6);
    c.stroke();

    // Ponto central do manômetro
    c.fillStyle = brassCol;
    c.fillRect(2.7, 0.7, 0.6, 0.6);

    // Chaminé de escape de vapor com anéis chanfrados
    c.fillStyle = brassCol;
    c.fillRect(-2.0, -9.0, 2.8, 3.0);
    c.fillStyle = brassBright;
    c.fillRect(-2.6, -10.0, 4.0, 1.3);
    c.fillStyle = brassGlint;
    c.fillRect(-2.0, -9.8, 2.8, 0.6);

    drawValeriaPressureRig(c, tFrame, pressure, isDetailed);

    // Vapores químicos desprendendo da chaminé em arcos (Roxo / Violeta Alquímico)
    const steamAlpha = .42;
    for (let st = 1; st <= (isOvercharged ? 0 : 2); st++) {
      const stProg = ((tFrame * .09 + st * .45) % 1);
      const stX = -1.2 - (stProg * 6.5);
      const stY = -10.5 - (stProg * 8.5);
      c.fillStyle = `rgba(155, 89, 182, ${(1 - stProg) * steamAlpha})`;
      c.beginPath();
      c.arc(stX, stY, 1.6 + stProg * 3.2, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // =========================================================================
    // 4. PERNAS E BOTAS DE EXPEDIÇÃO ALQUÍMICA
    // =========================================================================
    const legLeftX = -6.0 - legSwing * 0.35;
    const legRightX = 1.5 + legSwing * 0.35;

    // Calças justas escuras com sombreamento
    c.fillStyle = coatDark;
    c.fillRect(legLeftX, 6.0 + bob, 4.5, 8.0);
    c.fillRect(legRightX, 6.0 + bob, 4.5, 8.0);

    // Joelheiras de couro esculpido com rebites de latão polido
    c.fillStyle = leatherCol;
    c.fillRect(legLeftX, 8.0 + bob, 4.5, 3.4);
    c.fillRect(legRightX, 8.0 + bob, 4.5, 3.4);

    c.fillStyle = brassCol;
    c.fillRect(legLeftX + 1.2, 9.0 + bob, 2.0, 1.4);
    c.fillRect(legRightX + 1.2, 9.0 + bob, 2.0, 1.4);
    c.fillStyle = brassGlint;
    c.fillRect(legLeftX + 1.6, 9.2 + bob, 0.8, 0.8);
    c.fillRect(legRightX + 1.6, 9.2 + bob, 0.8, 0.8);

    // Botas altas de couro com cano reforçado
    c.fillStyle = leatherDark;
    c.fillRect(legLeftX - 0.5, 11.5 + bob, 5.5, 4.5);
    c.fillRect(legRightX - 0.5, 11.5 + bob, 5.5, 4.5);

    // Fivelas duplas de latão nas botas com ponto de luz
    c.fillStyle = brassBright;
    c.fillRect(legLeftX + 0.5, 12.0 + bob, 3.5, 1.2);
    c.fillRect(legRightX + 0.5, 12.0 + bob, 3.5, 1.2);
    c.fillRect(legLeftX + 0.5, 14.0 + bob, 3.0, 1.0);
    c.fillRect(legRightX + 0.5, 14.0 + bob, 3.0, 1.0);

    c.fillStyle = brassGlint;
    c.fillRect(legLeftX + 1.5, 12.0 + bob, 1.0, 1.0);
    c.fillRect(legRightX + 1.5, 12.0 + bob, 1.0, 1.0);

    // =========================================================================
    // 5. BRAÇO TRASEIRO (ESQUERDO) - PREENCHE A SILHUETA LATERAL
    // =========================================================================
    c.fillStyle = coatCol;
    c.fillRect(-9.5, -3 + bob, 4.0, 7.5);
    c.fillStyle = leatherCol;
    c.fillRect(-10.0, 1.5 + bob, 4.5, 3.5);
    c.fillStyle = brassCol;
    c.fillRect(-9.5, 2.0 + bob, 2.0, 1.5);
    c.fillStyle = brassGlint;
    c.fillRect(-9.2, 2.2 + bob, 0.8, 0.8);

    // =========================================================================
    // 6. TRONCO, ESCLAVINA DE OMBROS E CORSELETE ACINTURADO
    // =========================================================================
    // Casaco viridian nobre com costuras de alfaiataria
    c.fillStyle = velvetMaterial;
    c.beginPath();
    c.moveTo(-8.0, -5 + bob);
    c.lineTo(8.0, -5 + bob);
    c.lineTo(5.5, 6.5 + bob);
    c.lineTo(-5.5, 6.5 + bob);
    c.closePath();
    c.fill();

    // Costuras finas verticais douradas no casaco
    c.strokeStyle = leatherStitch;
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-6.5, -4.5 + bob); c.lineTo(-4.5, 5.5 + bob);
    c.moveTo(6.5, -4.5 + bob);  c.lineTo(4.5, 5.5 + bob);
    c.stroke();

    // Esclavina de ombro (capa curta de couro com 3 botões chanfrados)
    c.fillStyle = leatherCol;
    c.beginPath();
    c.moveTo(-8.5, -5.5 + bob);
    c.lineTo(8.5, -5.5 + bob);
    c.lineTo(7.0, -1.0 + bob);
    c.lineTo(-7.0, -1.0 + bob);
    c.closePath();
    c.fill();

    // Turned lapels expose green velvet and a fine brass botanical clasp.
    for (const side of [-1,1]) {
      skinPolygon(c, [[side*2.4,-5.4+bob],[side*7.6,-5+bob],[side*6.2,-.6+bob],[side*3.1,1+bob]], velvetMaterial, '#b6aa7e', .5);
      if (isDetailed) skinSprig(c, side*5.4, -.4+bob, 3.6, side*.2, '#d7c694', true);
    }

    // Botões de latão chanfrado com ponto especular
    c.fillStyle = brassBright;
    c.beginPath();
    c.arc(-5.5, -3.2 + bob, 1.1, 0, Math.PI * 2);
    c.arc(0, -3.2 + bob, 1.1, 0, Math.PI * 2);
    c.arc(5.5, -3.2 + bob, 1.1, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = brassGlint;
    c.fillRect(-5.8, -3.6 + bob, 0.7, 0.7);
    c.fillRect(-0.3, -3.6 + bob, 0.7, 0.7);
    c.fillRect(5.2, -3.6 + bob, 0.7, 0.7);

    // Corselete de couro escuro acinturado
    c.fillStyle = leatherDark;
    c.beginPath();
    c.moveTo(-5.0, -2.0 + bob);
    c.lineTo(5.0, -2.0 + bob);
    c.lineTo(4.0, 5.0 + bob);
    c.lineTo(-4.0, 5.0 + bob);
    c.closePath();
    c.fill();

    skinPolygon(c, [[-4.5,-1.5+bob],[-3.3,-1+bob],[-2.8,4.4+bob],[-3.7,4.4+bob]], '#674632');
    skinPolygon(c, [[3.3,-1+bob],[4.5,-1.5+bob],[3.7,4.4+bob],[2.8,4.4+bob]], '#674632');

    // Amarração em "X" com ilhoses de latão e relevo
    c.strokeStyle = brassCol;
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(-2.4, -1.2 + bob); c.lineTo(2.4, 0.8 + bob);
    c.moveTo(2.4, -1.2 + bob); c.lineTo(-2.4, 0.8 + bob);
    c.moveTo(-2.4, 1.8 + bob);  c.lineTo(2.4, 3.8 + bob);
    c.moveTo(2.4, 1.8 + bob);  c.lineTo(-2.4, 3.8 + bob);
    c.stroke();

    // Ilhoses circulares de latão
    c.fillStyle = brassBright;
    c.fillRect(-2.8, -1.6 + bob, 1.0, 1.0);
    c.fillRect(2.0, -1.6 + bob, 1.0, 1.0);
    c.fillRect(-2.8, 1.4 + bob, 1.0, 1.0);
    c.fillRect(2.0, 1.4 + bob, 1.0, 1.0);

    // =========================================================================
    // 7. BANDOLEIRA COM TRÍADE DE AMPOLAS QUÍMICAS DISTINTAS
    // =========================================================================
    c.strokeStyle = '#3d271d';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-6.0, -4.5 + bob);
    c.lineTo(5.0, 4.5 + bob);
    c.stroke();
    c.strokeStyle = leatherStitch;
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-5.8, -4.8 + bob);
    c.lineTo(4.8, 4.2 + bob);
    c.stroke();

    // Ampola 1: Reagente Ácido Esmeralda (Verde Neon)
    c.fillStyle = acidBase;
    c.fillRect(-4.5, -3.5 + bob, 2.2, 3.8);
    c.fillStyle = '#ffffff';
    c.fillRect(-4.1, -3.1 + bob, 0.6, 2.8);
    c.fillStyle = '#8b5a2b';
    c.fillRect(-4.7, -4.5 + bob, 2.6, 1.2);
    c.strokeStyle = brassCol;
    c.lineWidth = 0.8;
    c.strokeRect(-4.5, -3.5 + bob, 2.2, 3.8);

    // Ampola 2: Elixir Mutagênico Volátil (Violeta Fluorescente)
    c.fillStyle = reagentPurple;
    c.fillRect(-1.5, -1.0 + bob, 2.2, 3.8);
    c.fillStyle = '#ffffff';
    c.fillRect(-1.1, -0.6 + bob, 0.6, 2.8);
    c.fillStyle = '#8b5a2b';
    c.fillRect(-1.7, -2.0 + bob, 2.6, 1.2);
    c.strokeStyle = brassCol;
    c.lineWidth = 0.8;
    c.strokeRect(-1.5, -1.0 + bob, 2.2, 3.8);

    // Ampola 3: Catalisador Volátil (Âmbar / Fogo Líquido)
    c.fillStyle = reagentAmber;
    c.fillRect(1.5, 1.5 + bob, 2.2, 3.6);
    c.fillStyle = '#ffffff';
    c.fillRect(1.9, 1.9 + bob, 0.6, 2.6);
    c.fillStyle = '#8b5a2b';
    c.fillRect(1.3, 0.5 + bob, 2.6, 1.2);
    c.strokeStyle = brassCol;
    c.lineWidth = 0.8;
    c.strokeRect(1.5, 1.5 + bob, 2.2, 3.6);

    if (isDetailed) {
      // Parchment labels and wax seals distinguish the three reagents.
      for (let vial=0;vial<3;vial++) {
        const vx=-4.5+vial*3, vy=-1.8+bob+vial*2.5;
        skinPolygon(c, [[vx,vy],[vx+2.2,vy],[vx+2.2,vy+1],[vx,vy+1]], '#decda8');
        skinLine(c, [[vx+.5,vy+.5],[vx+1.7,vy+.5]], '#685546', .25);
        skinGem(c, vx+1, vy-2, .45, '#623740', '#bc6a78', '#ad8963');
      }
    }

    // Cinturão utilitário com fivela de latão chanfrada
    c.fillStyle = leatherDark;
    c.fillRect(-6.5, 4.5 + bob, 13.0, 3.4);
    c.fillStyle = agedBrass;
    c.fillRect(-2.5, 4.0 + bob, 5.0, 4.4);
    c.fillStyle = trimGold;
    c.fillRect(-1.2, 5.0 + bob, 2.4, 2.4);
    c.fillStyle = brassGlint;
    c.fillRect(-2.0, 4.2 + bob, 1.0, 1.0);

    // Frasco esférico pendente no quadril com menisco e lacre
    c.fillStyle = acidBase;
    c.beginPath();
    c.arc(5.2, 6.2 + bob, 2.5, 0, Math.PI * 2);
    c.fill();
    // Brilho curvo no vidro esférico
    c.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.arc(4.6, 5.6 + bob, 1.4, -Math.PI * 0.7, 0);
    c.stroke();
    // Suporte e rolha de cortiça
    c.fillStyle = brassCol;
    c.fillRect(4.2, 3.5 + bob, 2.0, 1.3);
    c.fillStyle = '#8b5a2b';
    c.fillRect(4.4, 2.5 + bob, 1.6, 1.2);

    // =========================================================================
    // 8. CABEÇA, ROSTO EXPRESSIVO, OLHOS DE JADE E RESPIRADOR
    // =========================================================================
    // Respirador / Gola Alta de Couro Cirúrgico (Abaixo do queixo)
    c.fillStyle = '#242d34';
    c.beginPath();
    c.moveTo(-4.5, -4.5 + bob);
    c.lineTo(4.5, -4.5 + bob);
    c.lineTo(3.5, -1.5 + bob);
    c.lineTo(-3.5, -1.5 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = brassCol;
    c.lineWidth = 1.0;
    c.stroke();

    // Filtro duplo de latão estriado na lateral do respirador
    c.fillStyle = brassCol;
    c.fillRect(-5.2, -4.0 + bob, 1.8, 2.4);
    c.fillStyle = brassBright;
    c.fillRect(-5.0, -3.3 + bob, 1.4, 0.8);
    c.fillStyle = copperCol;
    c.fillRect(-5.2, -2.6 + bob, 1.8, 0.5);

    // Cabeça / Rosto feminino delicado
    c.fillStyle = skinTone;
    c.beginPath();
    c.arc(0.5, -9.5 + bob, 5.8, 0, Math.PI * 2);
    c.fill();

    // Sombra de contorno mandibular delicada
    c.fillStyle = skinShadow;
    c.beginPath();
    c.arc(0.5, -9.5 + bob, 5.8, Math.PI * 0.3, Math.PI * 0.7);
    c.fill();

    // OLHO VIVO, NÍTIDO E EXPRESSIVO (Brilho especular duplo de jade)
    c.fillStyle = '#141e1b';
    c.fillRect(2.0, -10.6 + bob, 3.4, 2.4);
    // Íris esmeralda/jade luminescente
    c.fillStyle = eyeCol;
    c.fillRect(2.6, -10.3 + bob, 2.2, 1.8);
    // Ponto duplo de brilho especular branco
    c.fillStyle = '#ffffff';
    c.fillRect(3.8, -10.1 + bob, 0.9, 0.9);
    c.fillRect(2.8, -9.5 + bob, 0.5, 0.5);

    // Sobrancelha fina e elegante arqueada
    c.strokeStyle = hairBase;
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(1.6, -11.8 + bob);
    c.lineTo(5.5, -10.6 + bob);
    c.stroke();

    // =========================================================================
    // 9. ÓCULOS DE ALQUIMIA STEAMPUNK (GOGGLES NA TESTA COM REFRAÇÃO DE CRISTAL)
    // =========================================================================
    // Correia de couro envolvendo a cabeça com fivela
    c.strokeStyle = '#3d271d';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(0.5, -13.5 + bob);
    c.lineTo(-5.5, -12.5 + bob);
    c.stroke();
    c.fillStyle = brassBright;
    c.fillRect(-4.5, -13.5 + bob, 1.2, 1.5);

    // Armações duplas circulares de latão posicionadas na testa
    c.fillStyle = brassCol;
    c.beginPath();
    c.arc(2.6, -14.2 + bob, 2.7, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(-1.6, -14.2 + bob, 2.4, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = brassDark;
    c.lineWidth = 0.8;
    c.stroke();

    // Ponte de latão entre as lentes
    c.fillStyle = brassBright;
    c.fillRect(0.2, -14.8 + bob, 1.5, 1.3);

    // Lentes convexas de cristal jade brilhante
    c.fillStyle = lensCol;
    c.beginPath();
    c.arc(2.6, -14.2 + bob, 1.9, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(-1.6, -14.2 + bob, 1.6, 0, Math.PI * 2);
    c.fill();

    // Reflexo de luz branco cruzado (simulando refração vítrea esférica)
    c.strokeStyle = '#ffffff';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(1.9, -15.2 + bob); c.lineTo(3.3, -13.8 + bob);
    c.moveTo(-2.2, -15.1 + bob); c.lineTo(-1.0, -13.9 + bob);
    c.stroke();
    c.fillStyle = '#ffffff';
    c.fillRect(3.1, -14.8 + bob, 0.7, 0.7);
    c.fillRect(-1.2, -14.8 + bob, 0.6, 0.6);

    // =========================================================================
    // Etched lens rims with tiny mounting screws and shaded brass edges.
    if (isDetailed) {
      skinLine(c, [[-4.8,-15.1+bob],[-4.1,-15.6+bob]], '#f2d5a4', .35);
      skinLine(c, [[2.8,-15.1+bob],[3.5,-14.6+bob]], '#f2d5a4', .35);
    }

    // 10. CABELOS ROXOS E TRANÇA LONGA COM ANÉIS DOURADOS
    // =========================================================================
    // Calota superior do cabelo em 3 tons
    c.fillStyle = hairBase;
    c.beginPath();
    c.arc(0, -11.5 + bob, 6.0, Math.PI * 0.95, Math.PI * 1.95);
    c.fill();

    // Mecha lateral suave atrás da orelha
    c.fillStyle = hairMid;
    c.beginPath();
    c.moveTo(-4.5, -12.0 + bob);
    c.quadraticCurveTo(-3.0, -8.0 + bob, -4.5, -5.0 + bob);
    c.lineTo(-2.0, -5.0 + bob);
    c.quadraticCurveTo(-1.0, -8.0 + bob, -2.5, -12.0 + bob);
    c.closePath();
    c.fill();

    // Presilha de latão ornamentada prendendo o rabo de cavalo
    c.fillStyle = brassBright;
    c.fillRect(-6.5, -13.5 + bob, 3.4, 3.2);
    c.fillStyle = trimGold;
    c.fillRect(-5.9, -12.9 + bob, 2.2, 2.0);
    c.fillStyle = brassGlint;
    c.fillRect(-6.2, -13.2 + bob, 0.8, 0.8);

    // Trança longa com ondulação fluida drapeada para trás
    const wave1 = hairSway;
    const wave2 = Math.sin(tFrame * 0.1 + (isMoving ? walkCycle : 0)) * 3.5;

    c.fillStyle = hairBase;
    c.beginPath();
    c.moveTo(-5.5, -13.0 + bob);
    c.quadraticCurveTo(-12 - wave1 * 0.7, -14 + bob, -16 - Math.abs(wave1 * 1.0), -6 + bob + wave1 * 0.6);
    c.quadraticCurveTo(-14 - wave2 * 0.8, 3 + bob, -20 - Math.abs(wave2 * 1.2), 8 + bob + wave2);
    c.quadraticCurveTo(-12 - wave1 * 0.5, 0 + bob, -5.5, -10.0 + bob);
    c.closePath();
    c.fill();

    // Mechas claras sobrepostas
    c.fillStyle = hairMid;
    c.beginPath();
    c.moveTo(-5.5, -12.0 + bob);
    c.quadraticCurveTo(-11 - wave1 * 0.6, -12 + bob, -15 - Math.abs(wave1 * 0.8), -5 + bob + wave1 * 0.5);
    c.quadraticCurveTo(-10 - wave1 * 0.4, -6 + bob, -5.5, -10.5 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = hairHigh;
    c.fillRect(-10.5 - wave1 * 0.5, -9.0 + bob + wave1 * 0.3, 2.0, 1.0);
    c.fillRect(-15.5 - wave2 * 0.6, 1.5 + bob + wave2 * 0.4, 2.0, 1.0);

    // Múltiplos anéis de latão ao longo da trança
    c.fillStyle = brassBright;
    c.fillRect(-11.5 - wave1 * 0.5, -10.0 + bob + wave1 * 0.3, 2.4, 2.4);
    c.fillRect(-16.5 - wave2 * 0.6, 0.5 + bob + wave2 * 0.4, 2.4, 2.4);
    c.fillRect(-19.5 - wave2 * 0.8, 6.5 + bob + wave2 * 0.8, 2.2, 2.2);
    c.fillStyle = brassGlint;
    c.fillRect(-11.0 - wave1 * 0.5, -9.8 + bob + wave1 * 0.3, 0.8, 0.8);
    c.fillRect(-16.0 - wave2 * 0.6, 0.7 + bob + wave2 * 0.4, 0.8, 0.8);

    drawValeriaRespirator(c, bob, pressure, isDetailed);

    // =========================================================================
    // 11. BRAÇO DIANTEIRO E POSTURAS DE COMBATE (FRASCO ERLENMEYER & ARREMESSO)
    // =========================================================================
    if (isThrowing) {
      // POSTURA DE ARREMESSO VOLÁTIL
      c.save();
      c.fillStyle = coatCol;
      c.fillRect(2, -4 + bob, 9, 4.5);
      c.fillStyle = leatherCol;
      c.fillRect(8, -4.5 + bob, 4.5, 5.0);
      c.fillStyle = brassCol;
      c.fillRect(10, -4.2 + bob, 2.5, 1.8);

      skinLine(c, [[8.4,-1.2+bob],[9.8,-1.6+bob],[10.2,-.5+bob]], '#789b6d', .7);

      // Frasco projetado à frente em trajetória balística
      c.save();
      c.translate(15, -4 + bob);
      c.rotate(0.35);

      if (isOvercharged) {
        drawValeriaVolatileFlask(c, tFrame, pressure, state.evolvedPotion, isDetailed);
      } else {
        c.fillStyle = 'rgba(155, 89, 182, 0.45)';
        c.beginPath();
        c.arc(0, 0, 7.5, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = 'rgba(240, 255, 250, 0.90)';
        c.beginPath();
        c.moveTo(-1.6, -4.5); c.lineTo(1.6, -4.5);
        c.lineTo(4.8, 4.2);   c.lineTo(-4.8, 4.2);
        c.closePath();
        c.fill();
        c.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        c.lineWidth = 1.0;
        c.stroke();

        c.fillStyle = acidBase;
        c.beginPath();
        c.moveTo(-3.6, 0); c.lineTo(3.6, 0);
        c.lineTo(4.2, 3.8); c.lineTo(-4.2, 3.8);
        c.closePath();
        c.fill();

        // Reflexo curvo no frasco arremessado
        c.strokeStyle = '#ffffff';
        c.lineWidth = 0.9;
        c.beginPath();
        c.moveTo(-3.2, 0.5); c.lineTo(-4.0, 3.4);
        c.stroke();

        c.fillStyle = '#8b5a2b';
        c.fillRect(-1.6, -6.0, 3.2, 1.8);
      }
      c.restore();

      // Fagulhas e respingos químicos no arremesso
      c.fillStyle = acidGlow;
      c.beginPath();
      c.arc(17, -8 + bob, 1.3, 0, Math.PI * 2);
      c.arc(19, -2 + bob, 1.6, 0, Math.PI * 2);
      c.arc(14, 2 + bob, 1.1, 0, Math.PI * 2);
      c.fill();
      c.restore();
    } else if (isOvercharged) {
      // POSTURA DE HABILIDADE (REAGENTE VOLÁTIL ENERGIZADO)
      c.fillStyle = coatCol;
      c.fillRect(3, -5 + bob, 7, 4.2);
      c.fillStyle = leatherCol;
      c.fillRect(8, -6 + bob, 4.5, 4.5);
      c.fillStyle = brassCol;
      c.fillRect(9.5, -5.8 + bob, 2.4, 1.5);

      skinLine(c, [[8.4,-3.2+bob],[9.8,-3.6+bob],[10.2,-2.5+bob]], '#789b6d', .7);

      // Reator de vidro preso à manopla: líquido, refração e gaiola de latão.
      c.save();
      c.translate(14, -8 + bob + Math.sin(tFrame * .075) * .5);
      c.rotate(-.12 + Math.sin(tFrame * .06) * .04);
      drawValeriaVolatileFlask(c, tFrame, pressure, state.evolvedPotion, isDetailed);
      c.restore();
    } else {
      // POSTURA NORMAL: Mão empunhando o frasco Erlenmeyer com firmeza
      c.fillStyle = coatCol;
      c.fillRect(3.0, -3 + bob, 4.5, 7.0);
      c.fillStyle = leatherCol;
      c.fillRect(3.0, 2.5 + bob, 4.5, 3.5);
      c.fillStyle = brassCol;
      c.fillRect(3.5, 3.0 + bob, 2.2, 1.6);
      c.fillStyle = brassGlint;
      c.fillRect(3.8, 3.2 + bob, 0.8, 0.8);

      skinLine(c, [[3.3,4.8+bob],[4.6,4.2+bob],[5,5.3+bob]], '#789b6d', .7);
      if (isDetailed) skinLine(c, [[3.5,2.8+bob],[3.5,4.3+bob]], '#b7986c', .3);

      // Frasco Erlenmeyer Lapidado na Mão
      c.save();
      c.translate(6.5, 5.5 + bob);

      // Vidro exterior com transparência e brilho
      c.fillStyle = 'rgba(240, 255, 250, 0.88)';
      c.beginPath();
      c.moveTo(-2.2, -5.2);
      c.lineTo(2.2, -5.2);
      c.lineTo(5.4, 5.0);
      c.lineTo(-5.4, 5.0);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      c.lineWidth = 1.1;
      c.stroke();

      // Gargalo de latão e rolha de cortiça
      c.fillStyle = brassCol;
      c.fillRect(-2.3, -4.6, 4.6, 1.5);
      c.fillStyle = '#8b5a2b';
      c.fillRect(-1.7, -6.6, 3.4, 2.2);

      // Líquido Ácido no interior (slosh dinâmico)
      const fSlosh = Math.sin(tFrame * 0.12) * 0.8;
      c.fillStyle = acidBase;
      c.beginPath();
      c.moveTo(-3.6, 0.5 + fSlosh);
      c.lineTo(3.6, 0.5 - fSlosh);
      c.lineTo(4.6, 4.4);
      c.lineTo(-4.6, 4.4);
      c.closePath();
      c.fill();

      // Menisco luminoso do líquido no frasco
      c.strokeStyle = acidGlow;
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(-3.6, 0.5 + fSlosh);
      c.lineTo(3.6, 0.5 - fSlosh);
      c.stroke();

      // Reflexo vítreo curvo chanfrado
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.0;
      c.beginPath();
      c.moveTo(-3.3, 1.0);
      c.lineTo(-4.4, 4.0);
      c.stroke();

      // Small maker's label leaves the liquid surface and meniscus visible.
      skinPolygon(c, [[-.9,1.4],[2.2,1.4],[2.6,3.7],[-1.3,3.7]], '#e5d3ae', '#9e855d', .35);
      skinLine(c, [[.6,1.9],[1.3,3],[0,3],[.6,1.9]], '#67416b', .4);
      if (isDetailed) skinLine(c, [[2,-2.4],[2.5,-1.1]], '#cadfd0', .3);

      // Fumaça sutil subindo da rolha
      const vaporY = -7.5 - ((tFrame * 0.15) % 4);
      c.fillStyle = 'rgba(214, 162, 232, 0.50)';
      c.beginPath();
      c.arc(0, vaporY, 1.0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    if (isOvercharged) {
      // Reflexos localizados: preservar pele, olhos e leitura da silhueta.
      c.save(); c.globalAlpha *= pressure;
      skinLine(c, [[7.6,-5+bob],[6.8,-1+bob],[4.8,5+bob]], '#dca9e7', .55);
      skinLine(c, [[-10-coatSway*.3,13+bob],[-7-coatSway*.3,16+bob],[-3,14+bob]], '#be94d0', .6);
      skinLine(c, [[-4,-15.7+bob],[-2.4,-16.1+bob]], '#ead3ed', .45);
      c.restore();
      drawValeriaVapor(c, tFrame, bob, pressure, true);
    }

}
