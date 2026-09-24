/**
 * src/render/heroes/rolandRenderer.js
 * 
 * Renderizador procedural especializado de Sir Roland (KNIGHT).
 * Inclui armadura de placas, elmo emplumado, tabardo sagrado,
 * capa bordada a ouro e o Martelo Sagrado / Martelo dos Titãs.
 */

/**
 * Renderiza com máxima fidelidade o Martelo Sagrado / Martelo dos Titãs de Sir Roland.
 * Utilizado tanto no coldre dorsal quanto empunhado ativamente em combate.
 */
import { skinGradient, skinPolygon, skinLine, skinGem, skinSprig } from './skinMaterials.js';
import { drawRolandBarrier } from '../rolandUlt.js';

/** Temporary consecrated engraving, only layered over the model during ULT. */
function drawConsecratedPlate(c, bob, t) {
  c.save(); c.translate(0, bob);
  // Recesses paired with lit bevels: helmet, exposed cuirass and shoulder lames.
  for (let i = 0; i < 3; i++) {
    const x = -5 + i * 1.5;
    skinLine(c, [[x,-13.5],[x-.5,-11],[x+.5,-8]], '#253040', .75);
    skinLine(c, [[x+.45,-13.5],[x,-11],[x+1,-8]], '#d9c8a2', .35);
    skinLine(c, [[5.5,-3+i*1.7],[11.7-i*.4,-1.5+i*1.7]], '#364251', .75);
    skinLine(c, [[5.5,-3.4+i*1.7],[11.7-i*.4,-1.9+i*1.7]], '#ffe1a1', .4);
  }
  for (const side of [-1, 1]) {
    skinLine(c, [[side*7,-3],[side*6,0],[side*6,3]], '#e5ba60', .7);
    skinLine(c, [[side*8,-2],[side*7,1],[side*7,3]], '#fff0ca', .35);
    skinLine(c, [[side*9,-3],[side*10,-1],[side*11,-3]], '#fff0bc', .7);
  }
  // Crown-like oath inscription follows the brow, keeping the visor readable.
  skinLine(c, [[-1,-14],[0,-12],[1,-14],[2,-12],[3,-14],[4,-12],[5,-13]], '#ffdf85', .65);
  skinLine(c, [[-1,-11.3],[6,-11.3]], '#f5d07b', .7);
  c.globalAlpha *= .5 + Math.sin(t * .23) * .2;
  skinLine(c, [[-5,-14.5],[0,-15],[6,-13.8]], '#fff9e3', .85);
  skinLine(c, [[6,-5.7],[12,-4]], '#fff9e3', 1);
  c.fillStyle = '#fff0b9';
  c.fillRect(-.6, -3, 1.2, 5); c.fillRect(-2, -1.7, 4, 1);
  c.restore();
}

function drawChargeGrip(c, colors, evolved, bob, t) {
  const weight = Math.sin(t * .38);
  c.save(); c.translate(2 + weight * .35, 4 + bob); c.rotate(.95 + weight * .045);
  // Pivot at the grip: the heavy head barely oscillates under a two-hand brace.
  c.translate(0, -15);
  drawRolandHammerModel(c, colors, evolved, 1.5 + Math.sin(t * .25) * .35);
  c.strokeStyle = 'rgba(255, 217, 129, 0.25)'; c.lineWidth = 4;
  c.strokeRect(-10, -14, 20, 10);
  c.strokeStyle = '#fff0c4'; c.lineWidth = .65;
  for (let i = 0; i < 3; i++) {
    const x = -6 + i * 6;
    c.beginPath(); c.moveTo(x, -11); c.lineTo(x, -7);
    c.moveTo(x-1.5, -10); c.lineTo(x, -9); c.lineTo(x+1.5, -10); c.stroke();
  }
  // Specular sweep is constrained to the head face, no blur or new gradients.
  const glint = (t * .7 % 16) - 8;
  c.strokeStyle = 'rgba(255, 250, 226, 0.8)';
  c.beginPath(); c.moveTo(glint, -13.5); c.lineTo(glint + 1.5, -5); c.stroke();
  for (const y of [12, 22]) {
    c.fillStyle = '#354151'; c.fillRect(-4, y-2, 8, 5);
    c.fillStyle = '#b6c4cd'; c.fillRect(-3.5, y-2, 7, 2.5);
    c.fillStyle = '#edc776'; c.fillRect(-4, y+2, 8, 1);
    c.strokeStyle = '#526174'; c.lineWidth = .6;
    c.beginPath(); c.moveTo(-1,y-2); c.lineTo(-1,y+1); c.moveTo(1,y-2); c.lineTo(1,y+1); c.stroke();
  }
  c.restore();
}

export function drawRolandHammerModel(c, cCol, isEvolved = false, runeGlowMult = 1.0) {
  const hammerWood = cCol.hammerWood || '#3d271d';
  const hammerSteel = isEvolved ? '#3d1c06' : (cCol.hammerSteel || '#57606f');
  const hammerSteelLight = isEvolved ? '#e67e22' : (cCol.hammerSteelLight || '#8395a7');
  const hammerGold = isEvolved ? '#f39c12' : (cCol.hammerGold || '#f1c40f');
  const hammerGoldLight = isEvolved ? '#ffeaa7' : (cCol.hammerGoldLight || '#ffeaa7');
  const hammerRune = isEvolved ? '#ff7675' : (cCol.hammerRune || '#f1c40f');
  const hammerRuneGlow = isEvolved ? '#ffffff' : (cCol.hammerRuneGlow || '#ffffff');
  const steelHighlight = cCol.armorHighlight || '#ffffff';

  // Cabo de carvalho torneado com ataduras cruzadas de couro cru
  c.fillStyle = hammerWood;
  c.fillRect(-2, -4, 4, 32);
  c.strokeStyle = '#1e130c';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-2, 4); c.lineTo(2, 7);
  c.moveTo(-2, 12); c.lineTo(2, 15);
  c.moveTo(-2, 20); c.lineTo(2, 23);
  c.stroke();

  // Pomo inferior de ferro forjado e anel de ouro maciço
  c.fillStyle = hammerSteel;
  c.fillRect(-2.5, 27, 5, 3.5);
  c.fillStyle = hammerGold;
  c.fillRect(-2, 29, 4, 1.5);
  c.fillStyle = hammerGoldLight;
  c.fillRect(-0.5, 29, 1.2, 1.5);

  // Colar / anel de junção do cabo à cabeça de guerra
  c.fillStyle = hammerGold;
  c.fillRect(-4, -3, 8, 2.5);
  c.fillStyle = hammerGoldLight;
  c.fillRect(-3, -3, 6, 0.8);

  // Cabeça titânica do martelo de guerra
  // Bloco principal de ferro temperado
  c.fillStyle = skinGradient(c, -9, -15, 18, 8, '#26303e', hammerSteel, hammerSteelLight);
  c.fillRect(-9, -15, 18, 12);
  // Recessed end caps and silver inlay give the head a forged, layered profile.
  for (const side of [-1, 1]) {
    skinPolygon(c, [[side*8,-14], [side*11,-12], [side*11,-6], [side*8,-4]], hammerSteel, hammerGold, .65);
    skinLine(c, [[side*9,-11], [side*10,-10], [side*9,-7]], hammerGoldLight, .55);
  }

  // Face chanfrada superior com reflexo especular de luz
  c.fillStyle = hammerSteelLight;
  c.beginPath();
  c.moveTo(-9, -15);
  c.lineTo(9, -15);
  c.lineTo(8, -12);
  c.lineTo(-8, -12);
  c.closePath();
  c.fill();

  // Crista especular brilhante
  c.strokeStyle = steelHighlight;
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-7.5, -14.8);
  c.lineTo(7.5, -14.8);
  c.stroke();

  // Faixas de reforço douradas forjadas
  c.fillStyle = hammerGold;
  c.fillRect(-10, -13, 20, 2.6);
  c.fillRect(-10, -7.5, 20, 2.6);
  c.fillRect(-2, -15, 4, 12);

  // Friso de luz dourada
  c.fillStyle = hammerGoldLight;
  c.fillRect(-10, -13, 20, 0.8);
  c.fillRect(-10, -7.5, 20, 0.8);

  // Runa divina incandescente pulsante
  c.fillStyle = `rgba(241, 196, 15, ${Math.min(1, 0.45 * runeGlowMult)})`;
  c.beginPath();
  c.arc(0, -9.5, 5.5, 0, Math.PI * 2);
  c.fill();

  // Cruz sagrada interior
  c.fillStyle = hammerRune;
  c.fillRect(-0.9, -12.5, 1.8, 6);
  c.fillRect(-2.7, -10.4, 5.4, 1.8);

  c.fillStyle = hammerRuneGlow;
  c.fillRect(-0.4, -9.9, 0.8, 0.8);

  // Espigão superior perfurante
  c.fillStyle = hammerSteelLight;
  c.beginPath();
  c.moveTo(0, -20);
  c.lineTo(3.0, -15);
  c.lineTo(-3.0, -15);
  c.closePath();
  c.fill();
}


/**
 * Renderiza o modelo procedural de Sir Roland.
 */
export function drawRolandModel(c, charDef, state, {
  bob = 0,
  legSwing = 0,
  capeWave = 0,
  tFrame = 0,
  isMoving = false,
  walkCycle = 0,
  scale = 1,
  isDashing = false,
  isRetaliating = false,
  isHammerAttacking = false,
  evolvedHammer = false,
  hammerProgress = -1
} = {}) {
    const dashAge = state.dashDuration > 0 ? 24 - state.dashDuration : tFrame % 24;
    const dashVx = (state.dashVx ?? (state.facing || 1)) * (state.facing || 1);
    const dashVy = state.dashVy || 0;
    const dashSpeed = Math.hypot(dashVx, dashVy) || 1;
    const dashX = dashVx / dashSpeed, dashY = dashVy / dashSpeed;
    // isDashing handled via state
    // isRetaliating handled via state
    // O martelo nas costas desaparece no instante em que o ataque HAMMER_SLAM está ativo
    // isHammerAttacking handled via state
    const cCol = charDef.color;
    const steelMid = cCol.armor || '#718093';
    const steelLight = cCol.armorLight || '#dcdde1';
    const steelHighlight = cCol.armorHighlight || '#ffffff';
    const steelDark = cCol.armorDark || '#2f3640';
    const goldTrim = cCol.trim || '#fbc531';
    const goldLight = cCol.trimLight || '#ffeaa7';
    const goldDark = cCol.trimDark || '#c79810';
    const goldGlint = cCol.goldGlint || '#ffffff';
    const plumeCol = cCol.plume || '#8e44ad';
    const plumeHigh = cCol.plumeHigh || '#a55eea';
    const tabardCol = cCol.tabard || '#f5f6fa';
    const tabardShadow = cCol.tabardShadow || '#dcdde1';
    const tabardCross = cCol.tabardCross || '#c23616';
    const tabardGold = cCol.tabardGold || '#f1c40f';
    const hammerWood = cCol.hammerWood || '#3d271d';
    const hammerSteel = cCol.hammerSteel || '#57606f';
    const hammerSteelLight = cCol.hammerSteelLight || '#8395a7';
    const hammerGold = cCol.hammerGold || '#f1c40f';
    const hammerGoldLight = cCol.hammerGoldLight || '#ffeaa7';
    const hammerRune = cCol.hammerRune || '#f1c40f';
    const hammerRuneGlow = cCol.hammerRuneGlow || '#ffffff';
    const eyeGlow = cCol.eyeGlow || '#00d2d3';
    const holyGlow = cCol.holyGlow || 'rgba(241, 196, 15, 0.40)';
    const isDetailed = scale >= 1.5;
    const polishedSteel = skinGradient(c, -9, -15 + bob, 24, 12, steelDark, steelMid, '#c1d2df');

    // ULT posture: planted feet, lowered center of mass and forward plate brace.
    if (isDashing) {
      if (dashY < -0.3) drawRolandBarrier(c, dashX, dashY, dashAge, bob);
      c.save();
      c.translate(0, 2);
      c.transform(1, 0, -0.13 * dashX, 0.96, 0, 0);
      bob *= 0.35;
    }

    // 1. Capa Nobre Dupla de Veludo e Borda Bordada em Ouro
    // Forro interno escuro
    c.fillStyle = cCol.capeInner || '#2c1045';
    c.beginPath();
    c.moveTo(-5, -2 + bob);
    c.lineTo(-17 - Math.abs(capeWave * 1.2), 17 + bob);
    c.lineTo(-10 - Math.abs(capeWave * 0.7), 19 + bob);
    c.lineTo(-3, 17 + bob);
    c.lineTo(2, -2 + bob);
    c.closePath();
    c.fill();

    // Manto exterior de veludo púrpura
    c.fillStyle = skinGradient(c, -17, bob, 18, 10, '#210f35', cCol.cape || '#481b6d', '#73548d');
    c.beginPath();
    c.moveTo(-5, -3 + bob);
    c.lineTo(-15 - Math.abs(capeWave * 1.1), 15 + bob);
    c.lineTo(-9 - Math.abs(capeWave * 0.6), 17 + bob);
    c.lineTo(-2, 16 + bob);
    c.lineTo(3, -3 + bob);
    c.closePath();
    c.fill();

    // Vinco de sombra no veludo da capa
    c.strokeStyle = '#220a35';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-4, -1 + bob);
    c.lineTo(-8 - Math.abs(capeWave * 0.8), 16 + bob);
    c.stroke();

    // Borda bordada em fio de ouro duplo
    c.strokeStyle = goldTrim;
    c.lineWidth = 1.3;
    c.stroke();

    c.strokeStyle = goldLight;
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(-14 - Math.abs(capeWave * 1.1), 14.5 + bob);
    c.lineTo(-9 - Math.abs(capeWave * 0.6), 16.2 + bob);
    c.lineTo(-2.5, 15.2 + bob);
    c.stroke();

    // Sewn laurel border follows the moving velvet, before equipment occludes it.
    skinSprig(c, -10 - Math.abs(capeWave * .7), 14 + bob, 8, -.32, '#bda275', isDetailed);
    if (isDetailed) {
      skinLine(c, [[-13-Math.abs(capeWave),13+bob],[-10-Math.abs(capeWave*.6),15+bob],[-4,14+bob]], '#e6cc91', .3);
    }

    // 2. Coldre Dorsal do Martelo Sagrado (Visível em repouso/guarda, empunhado nas mãos no ataque)
    if (!isHammerAttacking && !isDashing) {
      c.save();
      c.translate(-2, -3 + bob);
      c.rotate(-0.58);
      drawRolandHammerModel(c, cCol, evolvedHammer, Math.sin(tFrame * 0.1) * 0.3 + 0.7);
      c.restore();
    }

    // 3. Pernas Blindadas, Grevas e Sabatons com Sombreamento 3D
    const legLeftX = -7 - legSwing * 0.4;
    const legRightX = 1.5 + legSwing * 0.4;

    // Sombra de profundidade posterior
    c.fillStyle = steelDark;
    c.fillRect(legLeftX, 6 + bob, 5, 8);
    c.fillRect(legRightX, 6 + bob, 5, 8);

    // Placa frontal das pernas (aço polido)
    c.fillStyle = steelMid;
    c.fillRect(legLeftX + 0.5, 7 + bob, 4, 6.5);
    c.fillRect(legRightX + 0.5, 7 + bob, 4, 6.5);

    // Chanfro de reflexo nas caneleiras (grevas)
    c.fillStyle = steelLight;
    c.fillRect(legLeftX + 1.2, 7 + bob, 1.8, 6.5);
    c.fillRect(legRightX + 1.2, 7 + bob, 1.8, 6.5);

    // Linha especular fina de aço polido (1px highlight)
    c.fillStyle = steelHighlight;
    c.fillRect(legLeftX + 1.6, 7.5 + bob, 0.7, 5.5);
    c.fillRect(legRightX + 1.6, 7.5 + bob, 0.7, 5.5);

    // Joelheiras em losango articuladas (Poleyns) com borda dourada
    // Joelheira esquerda
    c.fillStyle = steelDark;
    c.beginPath();
    c.moveTo(legLeftX + 2.5, 5 + bob);
    c.lineTo(legLeftX + 5, 7.5 + bob);
    c.lineTo(legLeftX + 2.5, 10 + bob);
    c.lineTo(legLeftX, 7.5 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = goldTrim;
    c.beginPath();
    c.moveTo(legLeftX + 2.5, 5.5 + bob);
    c.lineTo(legLeftX + 4.5, 7.5 + bob);
    c.lineTo(legLeftX + 2.5, 9.5 + bob);
    c.lineTo(legLeftX + 0.5, 7.5 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = goldLight;
    c.fillRect(legLeftX + 2, 7 + bob, 1.2, 1.2);

    // Joelheira direita
    c.fillStyle = steelDark;
    c.beginPath();
    c.moveTo(legRightX + 2.5, 5 + bob);
    c.lineTo(legRightX + 5, 7.5 + bob);
    c.lineTo(legRightX + 2.5, 10 + bob);
    c.lineTo(legRightX, 7.5 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = goldTrim;
    c.beginPath();
    c.moveTo(legRightX + 2.5, 5.5 + bob);
    c.lineTo(legRightX + 4.5, 7.5 + bob);
    c.lineTo(legRightX + 2.5, 9.5 + bob);
    c.lineTo(legRightX + 0.5, 7.5 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = goldLight;
    c.fillRect(legRightX + 2, 7 + bob, 1.2, 1.2);

    // Sabatons articulados (Lâminas de proteção dos pés)
    c.fillStyle = steelDark;
    c.fillRect(legLeftX - 1, 12.5 + bob, 6.5, 3.5);
    c.fillRect(legRightX - 1, 12.5 + bob, 6.5, 3.5);

    c.fillStyle = steelLight;
    c.fillRect(legLeftX + 0.8, 13 + bob, 4.2, 1.8);
    c.fillRect(legRightX + 0.8, 13 + bob, 4.2, 1.8);

    // Ponta metálica do bico do sabaton com brilho
    c.fillStyle = steelHighlight;
    c.fillRect(legLeftX + 3.2, 13.2 + bob, 1.8, 0.9);
    c.fillRect(legRightX + 3.2, 13.2 + bob, 1.8, 0.9);

    // Articulated boot seams and rivets read as metal instead of flat rectangles.
    for (const lx of [legLeftX, legRightX]) {
      skinLine(c, [[lx+.4,14+bob],[lx+4.7,14+bob]], '#526174', .5);
      if (isDetailed) {
        skinLine(c, [[lx+1,11+bob],[lx+2.5,10+bob],[lx+3.5,11+bob]], goldDark, .35);
        skinLine(c, [[lx+1,15+bob],[lx+1,13+bob]], '#526174', .35);
      }
    }

    // 4. Tronco com Couraça Chanfrada (Gothic Cuirass) e Tabardo Sagrado
    // Placa peitoral de aço curvado com rebites e chanfros
    c.fillStyle = polishedSteel;
    c.beginPath();
    c.moveTo(-9, -5 + bob);
    c.lineTo(9, -5 + bob);
    c.lineTo(6.5, 7 + bob);
    c.lineTo(-6.5, 7 + bob);
    c.closePath();
    c.fill();

    // Sombra inferior do chanfro da armadura
    c.fillStyle = steelDark;
    c.beginPath();
    c.moveTo(-6.5, 4.5 + bob);
    c.lineTo(6.5, 4.5 + bob);
    c.lineTo(6.5, 7 + bob);
    c.lineTo(-6.5, 7 + bob);
    c.closePath();
    c.fill();

    // Contorno da placa peitoral
    c.strokeStyle = steelDark;
    c.lineWidth = 1.4;
    c.stroke();

    // Gola alta de aço / Gorjal (Gorget) com rebordo de ouro
    c.fillStyle = steelLight;
    c.fillRect(-5, -6.5 + bob, 10, 2.2);
    c.strokeStyle = goldTrim;
    c.lineWidth = 0.9;
    c.strokeRect(-5, -6.5 + bob, 10, 2.2);

    // Tabardo monástico sagrado drapeado com sombras de dobra
    c.fillStyle = skinGradient(c, -5, bob, 10, 0, '#b7ae99', tabardCol, '#fff4dd');
    c.beginPath();
    c.moveTo(-5.2, -5 + bob);
    c.lineTo(5.2, -5 + bob);
    c.lineTo(4.2, 8.5 + bob);
    c.lineTo(-4.2, 8.5 + bob);
    c.closePath();
    c.fill();

    // Sombreamento de dobras de tecido nas laterais do tabardo
    c.fillStyle = tabardShadow;
    c.beginPath();
    c.moveTo(-5.2, -5 + bob);
    c.lineTo(-3.8, -5 + bob);
    c.lineTo(-3.0, 8.5 + bob);
    c.lineTo(-4.2, 8.5 + bob);
    c.closePath();
    c.fill();

    c.beginPath();
    c.moveTo(5.2, -5 + bob);
    c.lineTo(3.8, -5 + bob);
    c.lineTo(3.0, 8.5 + bob);
    c.lineTo(4.2, 8.5 + bob);
    c.closePath();
    c.fill();

    // Cruz frontal heráldica em veludo escarlate com contorno em filigrana de ouro
    // Fundo dourado bordado (expande 0.6px em torno da cruz)
    c.fillStyle = tabardGold;
    c.fillRect(-1.7, -4.4 + bob, 3.4, 10.8);
    c.fillRect(-4.3, -2.0 + bob, 8.6, 3.4);

    // Cruz escarlate interior
    c.fillStyle = tabardCross;
    c.fillRect(-1.2, -4.0 + bob, 2.4, 10);
    c.fillRect(-3.8, -1.5 + bob, 7.6, 2.4);

    // Ponto central de ouro na cruz
    c.fillStyle = goldLight;
    c.fillRect(-0.5, -0.7 + bob, 1.0, 0.8);

    // Heraldic shield backing, raised cross and laurel in old gold.
    skinPolygon(c, [[-3.4,-3.5+bob],[3.4,-3.5+bob],[2.7,1.6+bob],[0,3.5+bob],[-2.7,1.6+bob]], '#782b35', '#d5b877', .55);
    skinLine(c, [[0,-2.6+bob],[0,2+bob]], '#f3dd9d', .85);
    skinLine(c, [[-1.9,-1+bob],[1.9,-1+bob]], '#f3dd9d', .85);
    if (isDetailed) {
      skinSprig(c, -3.3, 3+bob, 4.2, -.18, '#ac8e54', true);
      skinSprig(c, 3.3, 3+bob, 4.2, .18, '#ac8e54', true);
      // Chainmail only in the exposed flank joints.
      c.save();
      c.strokeStyle = '#acb6c1'; c.lineWidth = .32;
      for (const sx of [-7, 6]) for (let row=0; row<5; row++) {
        c.beginPath(); c.arc(sx+(row%2)*.4, bob-3+row*1.15, .55, 0, Math.PI*1.8); c.stroke();
      }
      c.restore();
    }

    // Cinto nobre de combate e correia transversal do coldre
    c.fillStyle = '#231711';
    c.fillRect(-7, 4.5 + bob, 14, 3.2);

    // Correia diagonal de couro do coldre transversal
    c.strokeStyle = '#231711';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-6, -4 + bob);
    c.lineTo(5, 5 + bob);
    c.stroke();

    // Rebites de aço na correia
    c.fillStyle = steelLight;
    c.fillRect(-3, -1.8 + bob, 1.2, 1.2);
    c.fillRect(1, 1.6 + bob, 1.2, 1.2);

    // Fivela ornamentada de ouro com espigão e brilho especular
    c.fillStyle = goldTrim;
    c.fillRect(-2.8, 4.0 + bob, 5.6, 4.2);
    c.fillStyle = '#1c130d';
    c.fillRect(-1.5, 4.8 + bob, 3.0, 2.4);
    c.fillStyle = goldLight;
    c.fillRect(-0.5, 4.8 + bob, 1.0, 2.4);
    c.fillStyle = goldGlint;
    c.fillRect(-2.2, 4.2 + bob, 1.2, 1.0);

    // Wax seal and folded oath parchment hang from the belt.
    skinPolygon(c, [[-6,6+bob],[-3.7,6+bob],[-3.2,11+bob],[-4.6,10.4+bob],[-5.7,11+bob]], '#d9c5a0', '#776448', .4);
    skinGem(c, -5, 6+bob, 1.35, '#712639', '#c8605c', goldDark);
    if (isDetailed) {
      skinLine(c, [[-5,8+bob],[-4,8.2+bob]], '#806c52', .3);
      skinLine(c, [[-4.8,9+bob],[-3.9,9.2+bob]], '#806c52', .3);
    }

    // 5. Ombreira Traseira e Braço Esquerdo
    c.fillStyle = steelDark;
    c.fillRect(-11, -3 + bob, 4, 8);
    c.fillStyle = steelMid;
    c.fillRect(-10.5, -2 + bob, 3.5, 6);

    c.fillStyle = goldTrim;
    c.beginPath();
    c.moveTo(-7, -6 + bob);
    c.lineTo(-14, -3 + bob);
    c.lineTo(-13, 2 + bob);
    c.lineTo(-8, 0 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = steelDark;
    c.lineWidth = 1.2;
    c.stroke();
    // Brilho no topo da ombreira traseira
    c.fillStyle = goldLight;
    c.fillRect(-12, -4.5 + bob, 4, 1);

    // 6. Cabeça e Grande Elmo Gótico (Greathelm) com Crista e Visor
    // Cúpula do elmo em aço chanfrado 3D
    c.fillStyle = polishedSteel;
    c.beginPath();
    c.moveTo(-5.5, -6 + bob);
    c.lineTo(6.5, -6 + bob);
    c.lineTo(7.5, -14 + bob);
    c.lineTo(-4.5, -15.5 + bob);
    c.lineTo(-7.0, -9 + bob);
    c.closePath();
    c.fill();
    c.strokeStyle = steelDark;
    c.lineWidth = 1.4;
    c.stroke();

    // Sombra do chanfro posterior do elmo
    c.fillStyle = steelDark;
    c.beginPath();
    c.moveTo(-5.5, -6 + bob);
    c.lineTo(-1.5, -6 + bob);
    c.lineTo(-1.5, -14.5 + bob);
    c.lineTo(-4.5, -15.5 + bob);
    c.lineTo(-7.0, -9 + bob);
    c.closePath();
    c.fill();

    // Crista superior em aço chanfrado com linha de reflexo de luz
    c.fillStyle = steelLight;
    c.beginPath();
    c.moveTo(-1.2, -15.5 + bob);
    c.lineTo(2.8, -15 + bob);
    c.lineTo(2.2, -6 + bob);
    c.lineTo(-0.8, -6 + bob);
    c.closePath();
    c.fill();

    // Linha especular na crista do elmo
    c.strokeStyle = steelHighlight;
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(0.5, -15.2 + bob);
    c.lineTo(0.5, -6.5 + bob);
    c.stroke();

    // Reforço em cruz de latão forjado no visor
    // Sombra de rebaixo do visor
    c.fillStyle = '#151b23';
    c.fillRect(0.5, -13.8 + bob, 6.2, 7.8);

    // Barra vertical de ouro
    c.fillStyle = goldTrim;
    c.fillRect(1.5, -13.5 + bob, 2.2, 7.5);
    c.fillStyle = goldLight;
    c.fillRect(1.8, -13.5 + bob, 0.9, 7.5);

    // Barra horizontal de ouro
    c.fillStyle = goldTrim;
    c.fillRect(-2.5, -10.5 + bob, 9.2, 2.4);
    c.fillStyle = goldLight;
    c.fillRect(-2.5, -10.5 + bob, 9.2, 0.8);

    // Rebites dourados nos cantos da cruz do elmo
    c.fillStyle = goldGlint;
    c.fillRect(2.0, -13.2 + bob, 1.0, 1.0);
    c.fillRect(2.0, -6.8 + bob, 1.0, 1.0);
    c.fillRect(-2.2, -10.0 + bob, 1.0, 1.0);

    // Fenda ocular estilizada (O Olhar Sagrado do Paladino)
    const glowCol = isDashing ? '#ffffff' : eyeGlow;
    c.fillStyle = '#080d13';
    c.fillRect(2.6, -10.4 + bob, 4.0, 1.8);
    // Olho celeste incandescente
    c.fillStyle = glowCol;
    c.fillRect(2.8, -10.1 + bob, 3.6, 1.2);
    // Ponto solar especular no olhar
    c.fillStyle = '#ffffff';
    c.fillRect(4.6, -10.1 + bob, 1.5, 1.2);

    // Perfurações de respiração (ventilação histórica da couraça facial)
    c.fillStyle = steelDark;
    c.fillRect(4.8, -7.8 + bob, 0.9, 0.9);
    c.fillRect(6.0, -7.8 + bob, 0.9, 0.9);
    c.fillRect(5.4, -6.5 + bob, 0.9, 0.9);

    // Penacho Plumoso Glorioso (Plumas Imperiais com Curvatura Orgânica e Destaque Lavanda)
    const plumeSway = isMoving ? Math.sin(walkCycle) * 3.2 : Math.sin(tFrame * 0.08) * 1.6;

    // Camada base roxa profunda
    c.fillStyle = plumeCol;
    c.beginPath();
    c.moveTo(-3, -15 + bob);
    c.quadraticCurveTo(-9 - plumeSway, -22 + bob, -17 - Math.abs(plumeSway * 1.3), -15 + bob + plumeSway);
    c.quadraticCurveTo(-9 - plumeSway * 0.5, -13.5 + bob, -4, -13.5 + bob);
    c.closePath();
    c.fill();

    // Segunda pena sobreposta com destaque em lavanda vibrante
    c.fillStyle = plumeHigh;
    c.beginPath();
    c.moveTo(-2.5, -15.5 + bob);
    c.quadraticCurveTo(-7 - plumeSway * 0.9, -20.5 + bob, -14 - Math.abs(plumeSway * 1.1), -17 + bob + plumeSway * 0.8);
    c.quadraticCurveTo(-6 - plumeSway * 0.4, -15 + bob, -3.5, -14.2 + bob);
    c.closePath();
    c.fill();

    // Ponto de luz na raiz do penacho
    c.fillStyle = '#e056fd';
    c.beginPath();
    c.arc(-2.8, -14.8 + bob, 1.0, 0, Math.PI * 2);
    c.fill();

    if (isDetailed) {
      // Feather barbs and engraved temple grooves, lit from the upper left.
      for (let i=0;i<5;i++) {
        skinLine(c, [[-4-i*1.5-plumeSway*.4,-16+bob],[-5-i*1.7-plumeSway*.6,-18+bob+i*.25]], '#c7a3da', .35);
      }
      skinLine(c, [[-4,-13+bob],[-5,-10+bob],[-3,-8+bob]], '#95a8b9', .4);
      skinLine(c, [[-3.8,-12.7+bob],[-4.5,-10+bob]], '#182231', .35);
    }

    // 7. Pauldron Nobre Dianteiro (Ombreira Gótica Esculpida com Frisos de Ouro)
    // Placa de aço polido
    c.fillStyle = polishedSteel;
    c.beginPath();
    c.moveTo(5, -6 + bob);
    c.lineTo(13.5, -4 + bob);
    c.lineTo(11.5, 2.5 + bob);
    c.lineTo(4, 0 + bob);
    c.closePath();
    c.fill();

    // Chanfro superior iluminado
    c.fillStyle = steelLight;
    c.beginPath();
    c.moveTo(5, -6 + bob);
    c.lineTo(13.5, -4 + bob);
    c.lineTo(12.0, -1.5 + bob);
    c.lineTo(4.5, -3.5 + bob);
    c.closePath();
    c.fill();

    // Borda esculpida em ouro reluzente
    c.strokeStyle = goldTrim;
    c.lineWidth = 1.6;
    c.stroke();

    // Ponto especular no topo do pauldron
    c.fillStyle = steelHighlight;
    c.fillRect(9, -4.5 + bob, 3, 1);

    // Scalloped lower plate with an inset sunstone and engraved wing relief.
    skinPolygon(c, [[5,-1+bob],[12,0+bob],[10.5,3.3+bob],[5.4,1.5+bob]], polishedSteel, goldDark, .65);
    skinGem(c, 9, -2+bob, 1.5, '#72521e', '#e6cd80', goldLight);
    if (isDetailed) {
      skinSprig(c, 7, .8+bob, 3, -.65, '#e5ddc4', true);
      skinLine(c, [[10,1+bob],[11,1.3+bob]], '#e9edf0', .4);
    }

    // 8. Braços, Manoplas Articuladas e Empunhadura Dinâmica do Martelo Sagrado
    if (isDashing) {
      drawConsecratedPlate(c, bob, tFrame);
      // Braced forearms connect shoulders to the two articulated grip points.
      skinLine(c, [[-9,0+bob],[-6,5+bob],[2,7+bob]], steelDark, 4.5);
      skinLine(c, [[9,0+bob],[7,3+bob],[4,4+bob]], steelLight, 4);
      drawChargeGrip(c, cCol, evolvedHammer, bob, tFrame);
    } else if (isHammerAttacking) {
      const p = Math.max(0, Math.min(1, hammerProgress));
      let hX = 0, hY = 0, hAngle = 0;
      let runeGlow = 1.0;
      let showSmear = false;
      let smearAlpha = 0;

      if (p < 0.32) {
        // FASE 1: WINDUP (Elevação com as duas mãos e carga rúnica divina)
        const tWind = p / 0.32;
        hX = -2 + tWind * 6;
        hY = -8 - tWind * 14;
        hAngle = -0.75 - tWind * 0.95; // atinge ~ -1.70 rad (inclinado alto atrás da cabeça)
        runeGlow = 1.0 + Math.sin(tWind * Math.PI) * 1.5;

        // Aura sagrada condensando energia estelar no topo do martelo
        c.save();
        c.fillStyle = `rgba(255, 235, 150, ${0.15 + tWind * 0.35})`;
        c.beginPath();
        c.arc(hX - 2, hY - 14, 14 + tWind * 6, 0, Math.PI * 2);
        c.fill();
        c.restore();

        // Braço esquerdo (traseiro) subindo para firmar a pegada no cabo
        c.fillStyle = steelDark;
        c.fillRect(-2, -8 + bob, 5, 5);
        c.fillStyle = steelMid;
        c.fillRect(-1, -12 + bob, 4.5, 6);
        c.fillStyle = goldTrim;
        c.fillRect(0, -14 + bob, 3, 3);

        // Braço direito (frontal) erguido segurando a manopla no colar
        c.fillStyle = steelMid;
        c.fillRect(5, -6 + bob, 5, 5);
        c.fillStyle = steelLight;
        c.fillRect(6, -11 + bob, 4.5, 6.5);
        c.fillStyle = steelDark;
        c.fillRect(6.5, -15 + bob, 4.5, 4.5);
        c.fillStyle = goldTrim;
        c.fillRect(7.5, -15 + bob, 3.5, 3.0);
        c.fillStyle = goldLight;
        c.fillRect(8.5, -14.5 + bob, 1.5, 1.5);
      } else if (p < 0.58) {
        // FASE 2: SLAM / DOWNSWING (Descida fulminante e impacto no solo)
        const tSlam = (p - 0.32) / 0.26;
        const easeSlam = Math.pow(tSlam, 2.2);
        hX = 4 + easeSlam * 16;
        hY = -22 + easeSlam * 34;
        hAngle = -1.70 + easeSlam * 2.82; // gira até +1.12 rad (martelada telúrica no solo)
        runeGlow = 2.0;

        if (tSlam < 0.85) {
          showSmear = true;
          smearAlpha = 1.0 - tSlam;
        } else {
          // Impacto no chão: micro-tremor de choque mecânico
          const shake = (Math.random() - 0.5) * 2.0;
          hX += shake;
          hY += shake;
        }

        // Braço esquerdo (traseiro) projetado para baixo acompanhando o golpe
        c.fillStyle = steelDark;
        c.fillRect(3, -4 + bob + easeSlam * 4, 4.5, 6);
        c.fillStyle = goldTrim;
        c.fillRect(4, 1 + bob + easeSlam * 6, 3, 3);

        // Braço direito (frontal) estendido com força sobre o cabo
        c.fillStyle = steelMid;
        c.fillRect(7, -4 + bob + easeSlam * 6, 5, 7);
        c.fillStyle = steelLight;
        c.fillRect(8, -3 + bob + easeSlam * 6, 2, 6);
        c.fillStyle = steelDark;
        c.fillRect(9, 2 + bob + easeSlam * 8, 4.5, 4.5);
        c.fillStyle = goldTrim;
        c.fillRect(9.5, 3 + bob + easeSlam * 8, 3.5, 3.0);
        c.fillStyle = goldLight;
        c.fillRect(10.5, 3.5 + bob + easeSlam * 8, 1.5, 1.5);
      } else {
        // FASE 3: RECOVERY E TRANSIÇÃO CONTÍNUA AO COLDRE
        const tRec = (p - 0.58) / 0.42;
        if (tRec < 0.40) {
          // Martelo cravado no chão e postura solene de guarda
          hX = 20;
          hY = 12;
          hAngle = 1.12;
          runeGlow = 1.2 - tRec;

          // Braços mantendo o apoio no cabo do martelo
          c.fillStyle = steelMid;
          c.fillRect(6, 0 + bob, 5, 6);
          c.fillStyle = steelDark;
          c.fillRect(8, 5 + bob, 4.5, 4);
          c.fillStyle = goldTrim;
          c.fillRect(9, 6 + bob, 3, 2.5);
        } else {
          // Retorno suave e contínuo ao coldre dorsal
          const tRet = (tRec - 0.40) / 0.60;
          const easeRet = Math.sin(tRet * Math.PI * 0.5);
          hX = 20 - easeRet * 22;
          hY = 12 - easeRet * 15;
          hAngle = 1.12 - easeRet * 1.70; // volta exatamente para -0.58 rad

          c.fillStyle = steelMid;
          c.fillRect(6, -2 + bob, 4.5, 7.5);
          c.fillStyle = steelLight;
          c.fillRect(7, -1.5 + bob, 1.8, 6.5);
          c.fillStyle = steelDark;
          c.fillRect(6.5, 3 + bob, 4.5, 3.5);
          c.fillStyle = goldTrim;
          c.fillRect(7.5, 4 + bob, 2.2, 2.0);
        }
      }

      // Rastro em Arco Sagrado de Alta Velocidade (Motion Smear Ribbon)
      if (showSmear) {
        c.save();
        // Arco externo dourado divino
        c.strokeStyle = evolvedHammer ? `rgba(243, 156, 18, ${smearAlpha * 0.85})` : `rgba(241, 196, 15, ${smearAlpha * 0.75})`;
        c.lineWidth = 11;
        c.beginPath();
        c.arc(hX - 8, hY - 6, 26, hAngle - 1.0, hAngle + 0.15);
        c.stroke();

        // Arco interno branco celestial incandescente
        c.strokeStyle = `rgba(255, 255, 255, ${smearAlpha * 0.95})`;
        c.lineWidth = 5;
        c.beginPath();
        c.arc(hX - 8, hY - 6, 26, hAngle - 0.8, hAngle + 0.05);
        c.stroke();
        c.restore();
      }

      // Renderiza o Martelo Sagrado na Pose Exata dos Braços
      c.save();
      c.translate(hX, hY + bob);
      c.rotate(hAngle);
      drawRolandHammerModel(c, cCol, evolvedHammer, runeGlow);
      c.restore();
    } else {
      // Braço em repouso lateral segurando o equilíbrio do escudo/martelo
      c.fillStyle = steelMid;
      c.fillRect(6, -2 + bob, 4.5, 7.5);
      c.fillStyle = steelLight;
      c.fillRect(7, -1.5 + bob, 1.8, 6.5);
      c.fillStyle = steelHighlight;
      c.fillRect(7.5, -1.0 + bob, 0.7, 5.0);

      // Manopla articulada (guarda-punho e nós dos dedos)
      c.fillStyle = steelDark;
      c.fillRect(6.5, 3 + bob, 4.5, 3.5);
      c.fillStyle = goldTrim;
      c.fillRect(7.5, 4 + bob, 2.2, 2.0);
      c.fillStyle = goldLight;
      c.fillRect(8.0, 4.2 + bob, 1.0, 1.0);
    }

    if (isDashing) {
      c.restore();
      if (dashY >= -0.3) drawRolandBarrier(c, dashX, dashY, dashAge, bob);
    }

    // Glifo Rúnico de Retaliação Melee
    if (isRetaliating) {
      c.save();
      c.strokeStyle = isDashing ? 'rgba(255, 220, 137, 0.65)' : 'rgba(0, 206, 201, 0.85)';
      c.lineWidth = 2.2;
      c.beginPath();
      for (let g = 0; g < 6; g++) {
        const ga = (g * Math.PI / 3) + tFrame * 0.05;
        const gx = Math.cos(ga) * 20;
        const gy = Math.sin(ga) * 20 + bob;
        if (g === 0) c.moveTo(gx, gy);
        else c.lineTo(gx, gy);
      }
      c.closePath();
      c.stroke();
      c.restore();
    }
}
