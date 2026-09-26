/**
 * src/render/worldEvents/bloodAltarRenderer.js
 * Renderização Diegética Monumental do Altar de Sangue e seu Círculo Ritual:
 * - Círculo místico de 190px com preenchimento de gradiente radial, octagrama arcano e runas no solo
 * - Barreira perimetral com plasma/chamas carmesim e relógio de alquimia diegético (arco de progresso de 10s)
 * - Tether de sangue conectando o jogador ao centro com setas de retorno se sair do círculo
 * - Monólito de obsidiana gótico em múltiplos níveis com obeliscos secundários, chamas e Coração de Sangue flutuante
 * - Feixe ascendente de alta altitude com espiral de luz e partículas de brasa
 * - Prompt diegético em holograma flutuante para ativação com termos claros de risco vs recompensa (sem emojis)
 */
import { frameCount } from '../../main.js';
import { player } from '../../entities/player.js';
import { activeBoss } from '../../state/collections.js';
import { getActiveBloodAltar } from '../../systems/worldEvents.js';

export function drawBloodAltarWorld(ctx, altar = getActiveBloodAltar()) {
  if (!altar || activeBoss) return;

  ctx.save();
  if (altar.fadeTimer !== undefined && altar.fadeAlpha !== undefined) {
    ctx.globalAlpha = altar.fadeAlpha;
  }

  // 1. Círculo Ritual no Solo (Quando ACTIVE ou SPAWNED)
  if (altar.state === 'ACTIVE' || altar.state === 'SPAWNED') {
    const isAct = altar.state === 'ACTIVE';
    const rad = altar.ritualRadius; // 190px
    const timeLeft = isAct ? Math.max(0, altar.timer) : 10.0;
    const progressRatio = isAct ? Math.max(0, Math.min(1, 1 - (timeLeft / altar.maxTimer))) : 0;
    const isClimax = isAct && timeLeft <= 3.0;
    const heartbeat = Math.sin(frameCount * (isAct ? (isClimax ? 0.35 : 0.2) : 0.08));

    // A. Névoa & Preenchimento do Solo com Gradiente Radial Profundo
    const bgPulse = heartbeat * (isAct ? 0.04 : 0.015);
    const centerAlpha = isAct 
      ? (altar.isWarning ? (0.32 + Math.sin(frameCount * 0.35) * 0.1) : (isClimax ? 0.28 + bgPulse : 0.18 + bgPulse))
      : 0.06;
    const edgeAlpha = isAct ? (altar.isWarning ? 0.22 : 0.08) : 0.02;

    const groundGrad = ctx.createRadialGradient(altar.x, altar.y, 16, altar.x, altar.y, rad);
    if (altar.isWarning) {
      groundGrad.addColorStop(0, `rgba(255, 23, 68, ${centerAlpha})`);
      groundGrad.addColorStop(0.65, `rgba(214, 48, 49, ${centerAlpha * 0.8})`);
      groundGrad.addColorStop(1, `rgba(255, 82, 82, ${edgeAlpha})`);
    } else if (isClimax) {
      groundGrad.addColorStop(0, `rgba(243, 156, 18, ${centerAlpha})`);
      groundGrad.addColorStop(0.5, `rgba(214, 48, 49, ${centerAlpha * 0.85})`);
      groundGrad.addColorStop(1, `rgba(255, 209, 102, ${edgeAlpha})`);
    } else {
      groundGrad.addColorStop(0, `rgba(180, 20, 36, ${centerAlpha})`);
      groundGrad.addColorStop(0.6, `rgba(120, 12, 24, ${centerAlpha * 0.75})`);
      groundGrad.addColorStop(1, `rgba(255, 56, 56, ${edgeAlpha})`);
    }

    ctx.fillStyle = groundGrad;
    ctx.beginPath();
    ctx.arc(altar.x, altar.y, rad, 0, Math.PI * 2);
    ctx.fill();

    // B. Geometria Arcana no Solo (Octagrama e Círculos Concéntricos Gravados)
    ctx.save();
    ctx.translate(altar.x, altar.y);

    // Círculo interno e intermediário
    ctx.strokeStyle = altar.isWarning 
      ? 'rgba(255, 56, 56, 0.45)' 
      : (isAct ? (isClimax ? 'rgba(255, 209, 102, 0.45)' : 'rgba(255, 75, 75, 0.35)') : 'rgba(255, 56, 56, 0.18)');
    ctx.lineWidth = 1.2;

    // Anel interno rúnico
    ctx.beginPath();
    ctx.arc(0, 0, 72, 0, Math.PI * 2);
    ctx.stroke();

    // Anel intermediário
    ctx.beginPath();
    ctx.arc(0, 0, 134, 0, Math.PI * 2);
    ctx.stroke();

    // Linhas do Octagrama Ritual (Estrela Sagrada de 8 Pontas)
    const starR = rad * 0.86;
    ctx.rotate(altar.runesAngle * 0.4);
    ctx.beginPath();
    for (let s = 0; s < 8; s++) {
      const a1 = (s * Math.PI * 2) / 8;
      const a2 = ((s + 3) * Math.PI * 2) / 8; // salto de 3 vértices
      ctx.moveTo(Math.cos(a1) * starR, Math.sin(a1) * starR);
      ctx.lineTo(Math.cos(a2) * starR, Math.sin(a2) * starR);
    }
    ctx.stroke();

    // 8 Glifos Rúnicos nos Vértices
    for (let r = 0; r < 8; r++) {
      const rAng = (r * Math.PI * 2) / 8;
      const rx = Math.cos(rAng) * starR;
      const ry = Math.sin(rAng) * starR;

      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(rAng + Math.PI / 2);
      
      ctx.fillStyle = altar.isWarning ? '#ff5252' : (isClimax ? '#ffd166' : '#ff4757');
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      
      // Runa em forma de losango com cruz interna
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(4, 0);
      ctx.lineTo(0, 5);
      ctx.lineTo(-4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();

    // C. Relógio de Alquimia Diegético no Solo (Arco de Progresso dos 10 Segundos)
    if (isAct) {
      ctx.save();
      const clockStart = -Math.PI / 2;
      const clockEnd = clockStart + (Math.PI * 2 * progressRatio);

      // Fundo do trilho do relógio
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(altar.x, altar.y, rad - 4, 0, Math.PI * 2);
      ctx.stroke();

      // Preenchimento do tempo decorrido
      ctx.strokeStyle = isClimax ? '#ffd166' : (altar.isWarning ? '#ff1744' : '#ff4757');
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(altar.x, altar.y, rad - 4, clockStart, clockEnd);
      ctx.stroke();
      ctx.restore();
    }

    // D. Barreira de Contenção Perimetral de Alta Visibilidade (Plasma / Chamas)
    ctx.save();
    const borderCol = altar.isWarning 
      ? '#ff1744' 
      : (isAct ? (isClimax ? '#ffd166' : '#ff3838') : 'rgba(231, 76, 60, 0.65)');
    
    // Anel externo com dentes / ondulação de contenção
    const segments = 64;
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = altar.isWarning ? 4.5 : (isAct ? (isClimax ? 4.0 : 3.2) : 2.0);
    ctx.beginPath();
    for (let s = 0; s <= segments; s++) {
      const sang = (s / segments) * Math.PI * 2;
      const wave = Math.sin(sang * 14 + frameCount * 0.18) * (isAct ? 2.5 : 1.2);
      const curR = rad + wave;
      const wx = altar.x + Math.cos(sang) * curR;
      const wy = altar.y + Math.sin(sang) * curR;
      if (s === 0) ctx.moveTo(wx, wy);
      else ctx.lineTo(wx, wy);
    }
    ctx.closePath();
    ctx.stroke();

    // Halo brilhante externo na borda
    ctx.strokeStyle = altar.isWarning ? 'rgba(255, 23, 68, 0.5)' : (isAct ? 'rgba(255, 56, 56, 0.3)' : 'rgba(255, 56, 56, 0.15)');
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(altar.x, altar.y, rad, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // E. Aviso de Borda e Tether de Retorno (Out-of-bounds Diegetic Feedback)
    if (player && isAct) {
      const pdx = player.x - altar.x;
      const pdy = player.y - altar.y;
      const pdist = Math.hypot(pdx, pdy);

      // 1. Jogador Fora do Círculo -> Tether de Sangue conectando de volta ao altar
      if (pdist > rad) {
        ctx.save();
        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 2.4;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -frameCount * 1.2;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(altar.x, altar.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Setas no tether apontando para o centro
        const tAng = Math.atan2(altar.y - player.y, altar.x - player.x);
        const arrowDist = 45;
        const ax = player.x + Math.cos(tAng) * arrowDist;
        const ay = player.y + Math.sin(tAng) * arrowDist;
        ctx.translate(ax, ay);
        ctx.rotate(tAng);
        ctx.fillStyle = '#ff1744';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-6, -6);
        ctx.lineTo(-2, 0);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } 
      // 2. Jogador Perto da Borda (< 32px da borda) -> Destaque de advertência
      else if (pdist > rad - 32) {
        ctx.save();
        const pAng = Math.atan2(pdy, pdx);
        ctx.strokeStyle = 'rgba(255, 209, 102, 0.7)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(altar.x, altar.y, rad, pAng - 0.25, pAng + 0.25);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // 2. Feixe de Luz Místico Vertical Carmesim (God Ray com Hélice Espiral)
  ctx.save();
  const isActState = altar.state === 'ACTIVE';
  const beamH = 1500;
  const beamW = isActState ? 44 : 28;
  const alphaMult = isActState ? 0.46 : 0.26;
  
  const beamGrad = ctx.createLinearGradient(altar.x, altar.y, altar.x, altar.y - beamH);
  beamGrad.addColorStop(0, `rgba(255, 56, 56, ${alphaMult})`);
  beamGrad.addColorStop(0.2, `rgba(231, 76, 60, ${alphaMult * 0.75})`);
  beamGrad.addColorStop(0.65, `rgba(192, 57, 43, ${alphaMult * 0.3})`);
  beamGrad.addColorStop(1, 'rgba(255, 56, 56, 0)');
  ctx.fillStyle = beamGrad;
  ctx.fillRect(altar.x - beamW / 2, altar.y - beamH, beamW, beamH);

  // Espiral de Luz / Fios de Hélice subindo pelo feixe
  ctx.strokeStyle = `rgba(255, 200, 200, ${alphaMult * 0.65})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let yStep = 0; yStep < 400; yStep += 10) {
    const py = altar.y - yStep;
    const px = altar.x + Math.sin(py * 0.025 + frameCount * 0.08) * (beamW * 0.35);
    if (yStep === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Núcleo brilhante central
  ctx.strokeStyle = `rgba(255, 255, 255, ${alphaMult * 0.9})`;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(altar.x, altar.y - 10);
  ctx.lineTo(altar.x, altar.y - beamH * 0.6);
  ctx.stroke();
  ctx.restore();

  // 3. Monólito / Base do Altar
  // Sombra de contato ampla
  ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
  ctx.beginPath();
  ctx.ellipse(altar.x, altar.y + 8, 42, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(altar.x, altar.y);

  // Nível 1: Plataforma Inferior de Obsidiana (Hexágono Chanfrado 36x20)
  ctx.fillStyle = '#140609';
  ctx.strokeStyle = '#8e1b24';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const px = Math.cos(a) * 36;
    const py = Math.sin(a) * 20;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Nível 2: Pedestal Superior de Obsidiana Lapidada (Hexágono 26x14)
  ctx.fillStyle = '#22090e';
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const px = Math.cos(a) * 26;
    const py = Math.sin(a) * 14 - 6;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4 Mini-Obeliscos de Canto com Tochas Carmesins
  for (let o = 0; o < 4; o++) {
    const oAng = (o * Math.PI) / 2 + Math.PI / 4;
    const ox = Math.cos(oAng) * 28;
    const oy = Math.sin(oAng) * 16;
    
    // Obelisco de pedra
    ctx.fillStyle = '#18070b';
    ctx.strokeStyle = '#ff3838';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox - 3, oy);
    ctx.lineTo(ox, oy - 14);
    ctx.lineTo(ox + 3, oy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Chama / Brasa de Sangue flutuante
    const flameY = oy - 18 + Math.sin(frameCount * 0.12 + o * 1.5) * 2;
    ctx.fillStyle = '#ff7675';
    ctx.beginPath();
    ctx.arc(ox, flameY, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cálice / Bacia Central Sacrificial
  const pedGrad = ctx.createLinearGradient(-15, -26, 15, 0);
  pedGrad.addColorStop(0, '#381018');
  pedGrad.addColorStop(1, '#160508');
  ctx.fillStyle = pedGrad;
  ctx.strokeStyle = '#ff3838';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(-15, -26, 30, 22, [5, 5, 2, 2]);
  ctx.fill();
  ctx.stroke();

  // Ranhuras de sangue talhadas no pedestal
  ctx.strokeStyle = 'rgba(255, 75, 75, 0.85)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-9, -20); ctx.lineTo(0, -10); ctx.lineTo(9, -20);
  ctx.moveTo(0, -22); ctx.lineTo(0, -7);
  ctx.stroke();

  // O Coração / Cristal de Sangue Flutuante dos Condenados
  const heartFloat = -38 + Math.sin(frameCount * 0.08) * 3.5;
  const heartPulse = 1.0 + Math.sin(frameCount * (altar.state === 'ACTIVE' ? 0.22 : 0.09)) * 0.14;

  // Halo do Coração
  ctx.save();
  ctx.translate(0, heartFloat);
  ctx.scale(heartPulse, heartPulse);

  const glowRad = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
  glowRad.addColorStop(0, 'rgba(255, 56, 56, 0.8)');
  glowRad.addColorStop(0.5, 'rgba(214, 48, 49, 0.35)');
  glowRad.addColorStop(1, 'rgba(255, 56, 56, 0)');
  ctx.fillStyle = glowRad;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();

  // Forma Lapidada de Cristal de Sangue (Octaedro com Facetas)
  ctx.fillStyle = '#ff1744';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(8, -1);
  ctx.lineTo(0, 12);
  ctx.lineTo(-8, -1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Faceta interna iluminada
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(8, -1);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // 4. Estado SPAWNED: Raio de Interação, Canalização e Prompt Diegético
  if (altar.state === 'SPAWNED') {
    // Raio de interação tracejado no solo
    ctx.strokeStyle = 'rgba(255, 56, 56, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.arc(0, 0, altar.interactRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Anel de canalização se houver progresso
    if (altar.channelProgress > 0) {
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (Math.PI * 2 * altar.channelProgress);
      
      // Halo do anel de progresso
      ctx.strokeStyle = 'rgba(255, 56, 56, 0.4)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, 36, startAngle, endAngle);
      ctx.stroke();
    }

    // Prompt Diegético se o jogador estiver ao alcance
    if (player) {
      const distToPlayer = Math.hypot(player.x - altar.x, player.y - altar.y);
      if (distToPlayer <= altar.interactRadius) {
        ctx.save();
        const boxW = 210;
        const boxH = 46;
        const boxY = -92;

        // Fundo do card holográfico
        ctx.fillStyle = 'rgba(14, 5, 8, 0.94)';
        ctx.strokeStyle = '#ff3838';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(-boxW / 2, boxY, boxW, boxH, 6);
        ctx.fill();
        ctx.stroke();

        // Linha decorativa superior
        ctx.strokeStyle = 'rgba(255, 209, 102, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-boxW / 2 + 10, boxY + 16);
        ctx.lineTo(boxW / 2 - 10, boxY + 16);
        ctx.stroke();

        // Título com pequeno ícone vetorial de gota de sangue (desenhado com canvas)
        ctx.fillStyle = '#ff3838';
        ctx.beginPath();
        ctx.moveTo(-64, boxY + 5);
        ctx.bezierCurveTo(-67, boxY + 8, -67, boxY + 12, -64, boxY + 12);
        ctx.bezierCurveTo(-61, boxY + 12, -61, boxY + 8, -64, boxY + 5);
        ctx.fill();

        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.fillStyle = '#ffd166';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("ALTAR DE SANGUE", 6, boxY + 9);

        // Subtítulo descritivo do evento
        ctx.font = '9px Outfit, sans-serif';
        ctx.fillStyle = '#ddc8c8';
        ctx.fillText("Sobreviva 10s • Horda 2.0x • Baú Lendário", 0, boxY + 24);

        // Tecla de ação
        ctx.font = 'bold 9.5px Outfit, sans-serif';
        ctx.fillStyle = altar.channelProgress > 0 ? '#ff7675' : '#ffffff';
        const actionText = altar.channelProgress > 0 
          ? `CANALIZANDO... ${Math.round(altar.channelProgress * 100)}%` 
          : "[ SEGURE F ] ATIVAR PACTO";
        ctx.fillText(actionText, 0, boxY + 37);

        ctx.restore();
      }
    }
  }

  ctx.restore();
  ctx.restore();
}
