/**
 * src/render/minibosses/bloodGargoyleRenderer.js
 * 
 * Renderizador procedural modular do Miniboss Gárgula de Sangue (BLOOD_GARGOYLE).
 * Reconstrução Artística Gothic Dark Fantasy de Alta Fidelidade:
 * 1. Estrutura corporal de granito negro chanfrado com fendas de rubi incandescentes.
 * 2. Coração cristalizado de rubi (Blood Core) pulsante em ritmo cardíaco com runas de sangue.
 * 3. Asas góticas bi-articuladas com esqueleto pétreo, espigões no cotovelo, garras e membranas em cúspides ogivais.
 * 4. Três animações dinâmicas de asas: voo fluido, mergulho predatório (Dive-Bomb) e vigília de catedral (Forma de Pedra).
 * 5. Cabeça demoníaca esculpida com mandíbula cinzelada, presas de marfim pétreo, chifres de obsidiana estriados com pontas ensanguentadas e olhos de rubi com rastro óptico.
 * 6. Membros inferiores com patas de rapina e cauda espinhosa com ferrão gótico farpado balançando com inércia física.
 * 7. Elevação 2.5D desacoplada no Dive-Bomb com sombra no solo, anel de compressão e rastro aerodinâmico.
 * 8. Animação de morte dramática em 3 fases: rasgamento alar, explosão do núcleo de cristal e petrificação em blocos.
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva do Miniboss Gárgula de Sangue.
 * @param {Object} e Entidade do Miniboss
 */
export function draw(e) {
  const R = e.radius;
  const isHit = e.hitFlash > 0;
  const isEnraged = !!e.enraged;
  const isStone = !!e.isStoneForm;
  const elevZ = Math.max(0, e.elevZ || 0);
  const isAirborne = !!e.isAirborne || elevZ > 0;
  const isDiveBomb = e.currentSkill === 'DIVE_BOMB' && isAirborne;

  // Paleta Gothic Dark Fantasy
  const graniteDark   = isHit ? '#ffffff' : (isStone ? '#3d444b' : '#14181d');
  const graniteBase   = isHit ? '#ffffff' : (isStone ? '#57606f' : '#1e242c');
  const graniteMid    = isHit ? '#ffffff' : (isStone ? '#747d8c' : '#2f3844');
  const graniteBevel  = isHit ? '#ffffff' : (isStone ? '#a4b0be' : '#4b5868');
  const rubyCoreLight = isHit ? '#ffffff' : (isStone ? '#7f8c8d' : (isEnraged ? '#ff5252' : '#ff1744'));
  const rubyCoreDark  = isHit ? '#ffffff' : (isStone ? '#535c68' : (isEnraged ? '#d63031' : '#b71540'));
  const bloodRune     = isHit ? '#ffffff' : (isStone ? '#ff7675' : '#ff4757');
  const wingEdgeCol   = isHit ? '#ffffff' : (isStone ? '#2f3542' : '#180407');
  const hornObsidian  = isHit ? '#ffffff' : (isStone ? '#2f3542' : '#0f1114');

  // --- 1. ELEVAÇÃO 2.5D: SOMBRA NO SOLO E AURA DE COMPRESSÃO ---
  if (elevZ > 0) {
    const altRatio = Math.min(1, elevZ / 48);
    const shadowScale = Math.max(0.42, 1 - altRatio * 0.45);
    const shadowAlpha = 0.42 * (1 - altRatio * 0.38);

    // Sombra desacoplada no solo
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, R * 0.85, R * 1.35 * shadowScale, R * 0.52 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Anel pulsante de compressão e impacto de sangue no solo
    const groundPulse = Math.sin(frameCount * 0.28) * 3;
    ctx.strokeStyle = `rgba(192, 57, 43, ${0.65 * altRatio})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, R * 0.85, (R * 1.4 + groundPulse) * shadowScale, (R * 0.55 + groundPulse * 0.3) * shadowScale, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Rastro aerodinâmico carmesim no solo
    if (isDiveBomb) {
      ctx.strokeStyle = `rgba(255, 71, 87, ${0.45 * altRatio})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-R * 0.5, R * 0.85);
      ctx.lineTo(R * 0.5, R * 0.85);
      ctx.stroke();
    }
    ctx.restore();

    // Eleva a criatura no plano visual Z
    ctx.save();
    ctx.translate(0, -elevZ);
  }

  // Linhas aerodinâmicas e rastro de velocidade durante Dive-Bomb
  if (isDiveBomb) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 71, 87, 0.48)';
    ctx.lineWidth = 1.8;
    for (let w = 0; w < 3; w++) {
      const wx = (w - 1) * (R * 0.65);
      const wy = -R * 1.2 + (w * 5);
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx - (e.facing || 1) * (14 + w * 4), wy - 12);
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- 2. CAUDA ESPINHOSA COM FERRÃO FARPADO ---
  const tailSway = isStone ? 0 : Math.sin(frameCount * (isAirborne ? 0.3 : 0.18)) * 7;
  const tailX1 = 0;
  const tailY1 = R * 0.45;
  const tailX2 = -R * 0.45 + tailSway * 0.4;
  const tailY2 = R * 0.95;
  const tailX3 = -R * 0.85 + tailSway;
  const tailY3 = R * 1.35;

  ctx.save();
  // Espinha segmentada
  ctx.strokeStyle = graniteBase;
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tailX1, tailY1);
  ctx.quadraticCurveTo(tailX2, tailY2, tailX3, tailY3);
  ctx.stroke();

  // Espigões dorsais da cauda
  ctx.fillStyle = graniteMid;
  for (let s = 1; s <= 3; s++) {
    const t = s / 3.5;
    const sx = tailX1 + (tailX3 - tailX1) * t - (s === 2 ? 3 : 1);
    const sy = tailY1 + (tailY3 - tailY1) * t;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - 4.5, sy - 2.5);
    ctx.lineTo(sx - 2, sy + 3.5);
    ctx.closePath();
    ctx.fill();
  }

  // Ferrão em ponta de flecha farpada gótica
  ctx.fillStyle = isHit ? '#ffffff' : (isStone ? '#57606f' : '#14181d');
  ctx.strokeStyle = isHit ? '#ffffff' : rubyCoreDark;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(tailX3, tailY3);
  ctx.lineTo(tailX3 - 6, tailY3 + 7);
  ctx.lineTo(tailX3 - 1, tailY3 + 5.5);
  ctx.lineTo(tailX3, tailY3 + 12); // ponta terminal
  ctx.lineTo(tailX3 + 3, tailY3 + 5.5);
  ctx.lineTo(tailX3 + 7, tailY3 + 6.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // --- 3. MEMBROS INFERIORES: GARRAS/PATAS DE RAPINA PÉTREAS ---
  for (let side = -1; side <= 1; side += 2) {
    const legX = side * (R * 0.28);
    const legY = R * 0.48;
    const extendT = isDiveBomb ? 5 : (isAirborne ? 3 : 0);

    ctx.save();
    // Coxa musculosa de pedra chanfrada
    ctx.fillStyle = graniteMid;
    ctx.beginPath();
    ctx.ellipse(legX, legY, R * 0.2, R * 0.28, side * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Tarso e 3 garras curvas afiadas
    ctx.fillStyle = graniteDark;
    ctx.strokeStyle = graniteBevel;
    ctx.lineWidth = 1.2;
    for (let c = -1; c <= 1; c++) {
      const clawAng = (c * 0.28) + (side * 0.15) + (isDiveBomb ? 0.3 : 0);
      const clawBaseX = legX + c * 3;
      const clawBaseY = legY + R * 0.22 + extendT;
      const clawTipX = clawBaseX + Math.sin(clawAng) * 8;
      const clawTipY = clawBaseY + Math.cos(clawAng) * 9;

      ctx.beginPath();
      ctx.moveTo(clawBaseX - 2, clawBaseY);
      ctx.lineTo(clawTipX, clawTipY);
      ctx.lineTo(clawBaseX + 2, clawBaseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Ponta de marfim/carmesim da garra
      ctx.fillStyle = isHit ? '#ffffff' : (isStone ? '#95a5a6' : '#dcdde1');
      ctx.beginPath();
      ctx.arc(clawTipX, clawTipY, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- 4. ASAS GÓTICAS BI-ARTICULADAS COM MEMBRANAS EM CAMADAS ---
  // Cálculo cinemático para os 3 estados
  let wingSpread, wingElevation, tipFlex;
  if (isStone) {
    // Modo Forma de Pedra: Asas envolvem o tórax protegendo como estátua gótica
    wingSpread = 0.65;
    wingElevation = 0.1;
    tipFlex = 0;
  } else if (isDiveBomb) {
    // Modo Dive-Bomb: Asas recolhidas para trás em ângulo aerodinâmico afiado
    wingSpread = 1.15;
    wingElevation = -0.75 + Math.sin(frameCount * 0.45) * 4;
    tipFlex = -12;
  } else {
    // Modo Voo Normal: Batimento fluido com flexão secundária
    const flapFreq = isEnraged ? 0.36 : 0.24;
    const flapAmp = isAirborne ? 20 : 13;
    const flapCycle = Math.sin(frameCount * flapFreq);
    wingSpread = 1.65;
    wingElevation = flapCycle * flapAmp;
    tipFlex = Math.cos(frameCount * flapFreq) * 6;
  }

  for (let side = -1; side <= 1; side += 2) {
    ctx.save();

    // Pontos estruturais anatômicos da asa
    const shoulderX = side * (R * 0.25);
    const shoulderY = -R * 0.22;
    const elbowX = isStone ? side * (R * 0.85) : side * (R * wingSpread);
    const elbowY = isStone ? R * 0.15 : -R * 1.35 + wingElevation;
    const carpusX = isStone ? side * (R * 0.6) : side * (R * (wingSpread * 0.85));
    const carpusY = isStone ? R * 0.55 : -R * 0.35 + wingElevation * 0.6;

    // Falanges dos 3 dedos que sustentam a membrana
    const f1X = isStone ? side * (R * 0.45) : side * (R * (wingSpread * 1.05));
    const f1Y = isStone ? R * 0.85 : R * 0.45 + wingElevation + tipFlex;
    const f2X = isStone ? side * (R * 0.25) : side * (R * (wingSpread * 0.7));
    const f2Y = isStone ? R * 0.95 : R * 0.65 + wingElevation * 0.8 + tipFlex * 0.7;
    const f3X = side * (R * 0.15);
    const f3Y = R * 0.35;

    // A) Membrana Alar Dupla Carmesim com Arcos Góticos Ogivais
    const wingGrad = ctx.createLinearGradient(shoulderX, shoulderY, elbowX, f1Y);
    if (isHit) {
      wingGrad.addColorStop(0, '#ffffff');
      wingGrad.addColorStop(1, '#ffffff');
    } else if (isStone) {
      wingGrad.addColorStop(0, '#57606f');
      wingGrad.addColorStop(0.6, '#3d444b');
      wingGrad.addColorStop(1, '#2f3542');
    } else {
      wingGrad.addColorStop(0, '#1a0407');
      wingGrad.addColorStop(0.45, isEnraged ? '#a31424' : '#7a0c1a');
      wingGrad.addColorStop(0.85, isEnraged ? '#680510' : '#45040d');
      wingGrad.addColorStop(1, '#1e0205');
    }

    ctx.fillStyle = wingGrad;
    ctx.strokeStyle = wingEdgeCol;
    ctx.lineWidth = 2.4;

    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(elbowX, elbowY);
    ctx.lineTo(carpusX, carpusY);
    ctx.lineTo(f1X, f1Y);
    // Borda recortada em arco gótico ogival entre f1 e f2
    ctx.quadraticCurveTo(side * (R * (wingSpread * 0.82)), (f1Y + f2Y) * 0.5 - 6, f2X, f2Y);
    // Borda recortada em arco gótico ogival entre f2 e f3
    ctx.quadraticCurveTo(side * (R * (wingSpread * 0.42)), (f2Y + f3Y) * 0.5 - 5, f3X, f3Y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // B) Nervuras Góticas Estruturais Chanfradas
    ctx.strokeStyle = isHit ? '#ffffff' : (isStone ? '#2f3542' : '#96111f');
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(carpusX, carpusY);
    ctx.lineTo(f1X, f1Y);
    ctx.moveTo(carpusX, carpusY);
    ctx.lineTo(f2X, f2Y);
    ctx.stroke();

    // Nervuras secundárias finas
    ctx.strokeStyle = isHit ? '#ffffff' : (isStone ? '#485460' : 'rgba(255, 71, 87, 0.4)');
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(elbowX, elbowY);
    ctx.lineTo(carpusX, carpusY);
    ctx.stroke();

    // C) Braço Ósseo Pétreo e Espigão do Cotovelo
    ctx.strokeStyle = graniteBase;
    ctx.lineWidth = 3.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(elbowX, elbowY);
    ctx.lineTo(carpusX, carpusY);
    ctx.stroke();

    // Chanfro de iluminação superior no braço
    ctx.strokeStyle = graniteBevel;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY - 1);
    ctx.lineTo(elbowX, elbowY - 1);
    ctx.stroke();

    // Espigão saliente de pedra no cotovelo (Elbow Stone Spur)
    const spurAngle = Math.atan2(elbowY - shoulderY, elbowX - shoulderX) + side * 0.85;
    const spurLen = isStone ? 6 : 9;
    const spurTipX = elbowX + Math.cos(spurAngle) * spurLen;
    const spurTipY = elbowY + Math.sin(spurAngle) * spurLen;

    ctx.fillStyle = graniteMid;
    ctx.strokeStyle = graniteDark;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(elbowX - 2.5, elbowY);
    ctx.lineTo(spurTipX, spurTipY);
    ctx.lineTo(elbowX + 2.5, elbowY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Garra afiada no carpo voltada para cima
    ctx.fillStyle = isHit ? '#ffffff' : (isStone ? '#a4b0be' : '#f5f6fa');
    ctx.beginPath();
    ctx.moveTo(carpusX, carpusY);
    ctx.lineTo(carpusX + side * 3, carpusY - 6);
    ctx.lineTo(carpusX - side * 2, carpusY - 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // --- 5. ESTRUTURA CORPORAL: GRANITO NEGRO CHANFRADO E FENDAS DE RUBI ---
  ctx.save();
  // Silhueta mestra do torso gótico
  ctx.fillStyle = graniteBase;
  ctx.strokeStyle = graniteDark;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, -R * 0.72);             // junção cervical
  ctx.lineTo(R * 0.52, -R * 0.35);       // ombro direito
  ctx.lineTo(R * 0.42, R * 0.38);        // flanco direito
  ctx.lineTo(0, R * 0.85);               // pélvis inferior
  ctx.lineTo(-R * 0.42, R * 0.38);       // flanco esquerdo
  ctx.lineTo(-R * 0.52, -R * 0.35);      // ombro esquerdo
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Placas peitorais bipartidas chanfradas em relevo
  for (let side = -1; side <= 1; side += 2) {
    // Placa superior (peitoral)
    ctx.fillStyle = graniteMid;
    ctx.beginPath();
    ctx.moveTo(side * (R * 0.05), -R * 0.45);
    ctx.lineTo(side * (R * 0.44), -R * 0.32);
    ctx.lineTo(side * (R * 0.36), -R * 0.05);
    ctx.lineTo(side * (R * 0.05), -R * 0.08);
    ctx.closePath();
    ctx.fill();

    // Chanfro de iluminação no peitoral
    ctx.strokeStyle = graniteBevel;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(side * (R * 0.05), -R * 0.45);
    ctx.lineTo(side * (R * 0.44), -R * 0.32);
    ctx.stroke();

    // Placa abdominal inferior
    ctx.fillStyle = graniteDark;
    ctx.beginPath();
    ctx.moveTo(side * (R * 0.05), 0);
    ctx.lineTo(side * (R * 0.32), R * 0.05);
    ctx.lineTo(side * (R * 0.22), R * 0.42);
    ctx.lineTo(side * (R * 0.05), R * 0.48);
    ctx.closePath();
    ctx.fill();
  }

  // Fendas de rubi incandescentes nas junções musculares/armadura
  ctx.strokeStyle = isStone ? '#e74c3c' : bloodRune;
  ctx.lineWidth = isStone ? 1.8 : 1.2;
  ctx.beginPath();
  // Fenda do esterno
  ctx.moveTo(0, -R * 0.45);
  ctx.lineTo(0, -R * 0.18);
  ctx.moveTo(0, R * 0.05);
  ctx.lineTo(0, R * 0.52);
  // Fendas diagonais nos ombros
  ctx.moveTo(-R * 0.08, -R * 0.12);
  ctx.lineTo(-R * 0.42, -R * 0.28);
  ctx.moveTo(R * 0.08, -R * 0.12);
  ctx.lineTo(R * 0.42, -R * 0.28);
  ctx.stroke();

  // --- 6. CORAÇÃO CRISTALIZADO DE RUBI (BLOOD CORE) ---
  const coreY = -R * 0.08;
  const beatTime = (frameCount * (isEnraged ? 0.25 : 0.16)) % (Math.PI * 2);
  const heartBeat = (Math.sin(beatTime) > 0.35 ? 1.35 : 1.0) * (isEnraged ? 1.25 : 1.0);
  const coreRadius = (R * 0.22) * heartBeat;

  // Halo carmesim pulsante
  if (!isStone) {
    const coreGlow = ctx.createRadialGradient(0, coreY, 1, 0, coreY, coreRadius * 2.5);
    coreGlow.addColorStop(0, isEnraged ? 'rgba(255, 23, 68, 0.65)' : 'rgba(231, 76, 60, 0.45)');
    coreGlow.addColorStop(1, 'rgba(192, 57, 43, 0)');
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(0, coreY, coreRadius * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Núcleo facetado em diamante/octógono de cristal de rubi
  ctx.save();
  ctx.translate(0, coreY);
  ctx.beginPath();
  ctx.moveTo(0, -coreRadius * 1.2);                 // topo
  ctx.lineTo(coreRadius * 0.85, -coreRadius * 0.4); // canto sup dir
  ctx.lineTo(coreRadius * 0.85, coreRadius * 0.4);  // canto inf dir
  ctx.lineTo(0, coreRadius * 1.2);                  // base
  ctx.lineTo(-coreRadius * 0.85, coreRadius * 0.4); // canto inf esq
  ctx.lineTo(-coreRadius * 0.85, -coreRadius * 0.4);// canto sup esq
  ctx.closePath();
  ctx.fillStyle = rubyCoreDark;
  ctx.fill();
  ctx.strokeStyle = rubyCoreLight;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Facetas internas do cristal de rubi com reflexos angulares
  ctx.fillStyle = rubyCoreLight;
  ctx.beginPath();
  ctx.moveTo(0, -coreRadius * 1.2);
  ctx.lineTo(coreRadius * 0.4, 0);
  ctx.lineTo(0, coreRadius * 1.2);
  ctx.closePath();
  ctx.fill();

  // Ponto de brilho especular branco diamante
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-coreRadius * 0.25, -coreRadius * 0.35, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // --- 7. CABEÇA DEMONÍACA ESCULPIDA, CHIFRES E OLHOS DE RUBI ---
  const headY = -R * 0.72;

  // Crânio angular de gárgula cinzelada
  ctx.fillStyle = isHit ? '#ffffff' : graniteDark;
  ctx.strokeStyle = graniteBevel;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, headY - R * 0.48);         // topo do crânio
  ctx.lineTo(R * 0.34, headY - R * 0.25);   // têmpora direita
  ctx.lineTo(R * 0.22, headY + R * 0.18);   // mandíbula direita
  ctx.lineTo(0, headY + R * 0.32);          // queixo cinzelado
  ctx.lineTo(-R * 0.22, headY + R * 0.18);  // mandíbula esquerda
  ctx.lineTo(-R * 0.34, headY - R * 0.25);  // têmpora esquerda
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Grandes Chifres Curvados de Obsidiana Estriada com Pontas Sangrentas
  for (let hSide = -1; hSide <= 1; hSide += 2) {
    const hornBaseX = hSide * (R * 0.22);
    const hornBaseY = headY - R * 0.38;
    const hornMidX  = hSide * (R * 0.65);
    const hornMidY  = headY - R * 0.95;
    const hornTipX  = hSide * (R * 0.85);
    const hornTipY  = headY - R * 1.35;

    // Corpo do chifre
    ctx.strokeStyle = hornObsidian;
    ctx.lineWidth = 4.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hornBaseX, hornBaseY);
    ctx.quadraticCurveTo(hornMidX, hornMidY, hornTipX, hornTipY);
    ctx.stroke();

    // Estrias chanfradas esculpidas no chifre
    ctx.strokeStyle = graniteBevel;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(hornBaseX + hSide * 1.5, hornBaseY);
    ctx.quadraticCurveTo(hornMidX + hSide * 1.5, hornMidY, hornTipX, hornTipY);
    ctx.stroke();

    // Pontas dos chifres banhadas em sangue fresco carmesim
    ctx.strokeStyle = isHit ? '#ffffff' : (isStone ? '#747d8c' : '#ff1744');
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(hornMidX + (hornTipX - hornMidX) * 0.5, hornMidY + (hornTipY - hornMidY) * 0.5);
    ctx.lineTo(hornTipX, hornTipY);
    ctx.stroke();
  }

  // Fenda bucal aberta e presas pontiagudas de marfim pétreo
  ctx.fillStyle = isHit ? '#ffffff' : (isStone ? '#2f3542' : '#3a050d');
  ctx.beginPath();
  ctx.ellipse(0, headY + R * 0.14, R * 0.16, R * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  // Presas afiadas superiores e inferiores
  ctx.fillStyle = isHit ? '#ffffff' : (isStone ? '#95a5a6' : '#f5f6fa');
  for (let f = -1; f <= 1; f += 2) {
    // Presa superior
    ctx.beginPath();
    ctx.moveTo(f * 4 - 1.5, headY + R * 0.08);
    ctx.lineTo(f * 4, headY + R * 0.18);
    ctx.lineTo(f * 4 + 1.5, headY + R * 0.08);
    ctx.closePath();
    ctx.fill();
    // Presa inferior
    ctx.beginPath();
    ctx.moveTo(f * 2 - 1, headY + R * 0.2);
    ctx.lineTo(f * 2, headY + R * 0.12);
    ctx.lineTo(f * 2 + 1, headY + R * 0.2);
    ctx.closePath();
    ctx.fill();
  }

  // Olhos de Rubi Incandescentes com Reflexo e Flare
  const eyeY = headY - R * 0.08;
  for (let eSide = -1; eSide <= 1; eSide += 2) {
    const eyeX = eSide * (R * 0.16);

    // Órbita ocular sombreada
    ctx.fillStyle = '#0a0a0c';
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, 4.5, 3.2, eSide * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Globo de rubi incandescente
    ctx.fillStyle = isStone ? '#bdc3c7' : rubyCoreLight;
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, 3.2, 2.2, eSide * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Ponto de luz reflexivo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(eyeX - 0.6, eyeY - 0.8, 1.4, 1.4);

    // Rastro/flare óptico luminoso de sangue quando furiosa ou investindo
    if ((isEnraged || isDiveBomb) && !isStone) {
      ctx.strokeStyle = 'rgba(255, 23, 68, 0.75)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(eyeX, eyeY);
      ctx.lineTo(eyeX + eSide * 8, eyeY - 2);
      ctx.stroke();
    }
  }

  // Fissuras de Magma e Regeneração se estiver em Forma de Pedra
  if (isStone) {
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 1.8;
    const runeWave = Math.sin(frameCount * 0.2) * 2;
    ctx.beginPath();
    ctx.moveTo(-R * 0.25, -R * 0.15);
    ctx.lineTo(0, R * 0.25 + runeWave);
    ctx.lineTo(R * 0.25, 0);
    ctx.stroke();

    // Rúnica carmesim cruzada
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-R * 0.18, R * 0.35);
    ctx.lineTo(0, R * 0.15);
    ctx.lineTo(R * 0.18, R * 0.45);
    ctx.stroke();
  }

  ctx.restore();

  // Fecha o bloco de elevação 2.5D se ativo
  if (elevZ > 0) {
    ctx.restore();
  }
}

/**
 * Renderiza a animação de morte procedural em 3 fases do Miniboss Gárgula de Sangue.
 * Fase 1 (t < 0.35): Desaceleração alar, espigões do cotovelo se soltam e despenca em espiral.
 * Fase 2 (0.35 <= t < 0.75): O coração de rubi sobrecarrega e explode em múltiplos fragmentos de cristal.
 * Fase 3 (t >= 0.75): Petrificação relâmpago e quebra da estátua em blocos de granito negro com poeira.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 */
export function drawDying(de, t) {
  const R = de.radius;
  const isEnraged = !!de.enraged;
  const bodyAlpha = Math.max(0, 1 - Math.max(0, (t - 0.75) / 0.25));

  ctx.save();
  // Espiral de queda e colapso gravitacional
  ctx.translate(0, t * 24);
  ctx.rotate(t * 1.15);

  const isPetrified = t > 0.48;
  const bodyCol = isPetrified ? '#3d444b' : '#1e242c';
  const wingCol = isPetrified ? '#2f3542' : '#7a0c1a';

  // 1. Asas rasgando e fragmentando
  const wingTear = Math.max(0.1, 1 - t * 0.75);
  ctx.fillStyle = wingCol;
  ctx.beginPath();
  ctx.moveTo(-R * 1.6 * wingTear, -R * 0.8);
  ctx.lineTo(-R * 0.5, -R * 0.2);
  ctx.lineTo(0, R * 0.4);
  ctx.lineTo(-R * 0.9 * wingTear, R * 0.6);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(R * 1.6 * wingTear, -R * 0.8);
  ctx.lineTo(R * 0.5, -R * 0.2);
  ctx.lineTo(0, R * 0.4);
  ctx.lineTo(R * 0.9 * wingTear, R * 0.6);
  ctx.closePath();
  ctx.fill();

  // 2. Torso de granito rachado
  ctx.fillStyle = bodyCol;
  ctx.beginPath();
  ctx.moveTo(0, -R * 0.65);
  ctx.lineTo(R * 0.5, R * 0.4);
  ctx.lineTo(0, R * 0.8);
  ctx.lineTo(-R * 0.5, R * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = isPetrified ? '#57606f' : '#ff4757';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // 3. Estilhaçamento dramático do coração de rubi (Fase 2 e 3)
  if (t > 0.25) {
    const burstProgress = (t - 0.25) / 0.75;
    const shardCount = 8;
    for (let s = 0; s < shardCount; s++) {
      const angle = s * (Math.PI * 2 / shardCount) + t * 3.5;
      const dist = R * (0.3 + burstProgress * 2.5);
      const sx = Math.cos(angle) * dist;
      const sy = Math.sin(angle) * dist;
      const shardSize = Math.max(1, 5 * (1 - burstProgress * 0.5));

      // Fragmento facetado de rubi
      ctx.fillStyle = s % 2 === 0 ? '#ff1744' : '#c0392b';
      ctx.beginPath();
      ctx.moveTo(sx, sy - shardSize);
      ctx.lineTo(sx + shardSize * 0.8, sy);
      ctx.lineTo(sx, sy + shardSize);
      ctx.lineTo(sx - shardSize * 0.8, sy);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 4. Blocos de granito desmoronando (Fase 3)
  if (t >= 0.7) {
    const rockProg = (t - 0.7) / 0.3;
    ctx.fillStyle = '#2f3844';
    for (let b = 0; b < 6; b++) {
      const bAngle = b * 1.1 + rockProg * 2.0;
      const bDist = R * (0.2 + rockProg * 1.8);
      const bx = Math.cos(bAngle) * bDist;
      const by = Math.sin(bAngle) * bDist + rockProg * 15; // gravidade
      ctx.fillRect(bx - 3, by - 3, 6, 6);
    }
  }

  ctx.restore();
}
