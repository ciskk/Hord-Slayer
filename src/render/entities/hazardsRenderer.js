/**
 * src/render/entities/hazardsRenderer.js
 * 
 * Renderizador de perigos de arena e chefes:
 * - Poças ácidas, miasmas tóxicos e rastros de fogo vivo de Ignis
 * - Telegrafias geométricas de chefes e ataques mortais
 * - Ondas de choque volumétricas expansivas
 * - Projéteis arcanos complexos de chefes (foice de Thanatos, esferas de vácuo, etc.)
 */

export function renderAcidPuddles(ctx, acidPuddles, bounds, frameCount) {
  const { viewLeft, viewRight, viewTop, viewBottom } = bounds;
  for (let i = 0; i < acidPuddles.length; i++) {
    const p = acidPuddles[i];
    const maxR = p.isFire ? 65 : 35;
    if (p.x < viewLeft - maxR || p.x > viewRight + maxR || p.y < viewTop - maxR || p.y > viewBottom + maxR) continue;

    const maxL = p.maxLife || 220;
    
    // Janela de animação visível de fade out cobrindo os últimos 50% de vida da poça
    const fadeWindow = maxL * 0.50;
    const fadeProgress = Math.min(1, Math.max(0, p.life / fadeWindow));

    // Dissipação visual: a poça encolhe gradualmente até o solo enquanto esvazia o alpha
    const shrinkFactor = 0.25 + 0.75 * fadeProgress;
    const pulse = Math.sin(frameCount * 0.14 + i) * 2;
    const r = Math.max(2, (p.radius + pulse) * shrinkFactor);

    // 1. Rastro de Fogo Vivo e Leito de Magma Incandescente (Ignis Ult / Passo Ígneo)
    if (p.isFire) {
      const shrinkFactor = 0.35 + 0.65 * fadeProgress;
      const baseR = Math.max(6, (p.radius || 38) * shrinkFactor);
      const fireAlpha = Math.min(1, fadeProgress * 1.15);
      const seed = (p.x * 12.9898 + p.y * 78.233) % 1000;

      ctx.save();
      ctx.globalAlpha = fireAlpha;

      // A. Resplendor térmico difuso no solo (Ambient Heat Glow)
      const glowR = baseR * 1.7;
      const heatGrad = ctx.createRadialGradient(p.x, p.y, baseR * 0.15, p.x, p.y, glowR);
      heatGrad.addColorStop(0, 'rgba(255, 170, 0, 0.35)');
      heatGrad.addColorStop(0.45, 'rgba(230, 80, 20, 0.20)');
      heatGrad.addColorStop(1, 'rgba(180, 40, 10, 0)');
      ctx.fillStyle = heatGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // B. Rocha vulcânica chamuscada e leito de magma orgânico
      ctx.beginPath();
      const numPoints = 8;
      for (let pt = 0; pt < numPoints; pt++) {
        const angle = (pt / numPoints) * Math.PI * 2;
        const radiusVar = baseR * (0.82 + 0.22 * Math.sin(angle * 3 + seed + frameCount * 0.04));
        const px = p.x + Math.cos(angle) * radiusVar;
        const py = p.y + Math.sin(angle) * radiusVar * 0.72; // perspectiva 2.5D
        if (pt === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      // Gradiente do leito de magma (de núcleo incandescente para fuligem)
      const magmaGrad = ctx.createRadialGradient(p.x, p.y, baseR * 0.1, p.x, p.y, baseR);
      magmaGrad.addColorStop(0, '#ffffff');
      magmaGrad.addColorStop(0.2, '#fff176');
      magmaGrad.addColorStop(0.5, '#f39c12');
      magmaGrad.addColorStop(0.78, '#d35400');
      magmaGrad.addColorStop(1, 'rgba(44, 20, 15, 0.85)');
      ctx.fillStyle = magmaGrad;
      ctx.fill();

      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // C. Fendas térmicas incandescentes (pulsando no interior da poça)
      const fissurePulse = Math.sin(frameCount * 0.18 + seed) * 0.2 + 0.8;
      ctx.strokeStyle = `rgba(255, 240, 160, ${0.75 * fissurePulse})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x - baseR * 0.5, p.y + baseR * 0.1);
      ctx.lineTo(p.x, p.y - baseR * 0.15);
      ctx.lineTo(p.x + baseR * 0.45, p.y + baseR * 0.12);
      ctx.stroke();

      // D. Línguas de Fogo Vivas (Procedural Animated Flame Tongues)
      const flameCount = 4;
      for (let f = 0; f < flameCount; f++) {
        const fSeed = seed + f * 47;
        const fRelX = ((f - (flameCount - 1) / 2) / (flameCount / 2)) * (baseR * 0.65);
        const fBaseX = p.x + fRelX;
        const fBaseY = p.y + Math.sin(fSeed) * (baseR * 0.25);

        // Altura e oscilação da labareda
        const fWave = Math.sin(frameCount * 0.32 + fSeed * 0.5);
        const fHeight = (baseR * 0.95 + fWave * (baseR * 0.35)) * shrinkFactor;
        const fSway = Math.sin(frameCount * 0.22 + fSeed) * (baseR * 0.22);
        const fWidth = (baseR * 0.38 + fWave * (baseR * 0.08)) * shrinkFactor;

        const tipX = fBaseX + fSway;
        const tipY = fBaseY - fHeight;

        // Labareda Externa (Carmesim / Vermelho Fogo)
        ctx.fillStyle = f % 2 === 0 ? '#e74c3c' : '#c0392b';
        ctx.beginPath();
        ctx.moveTo(fBaseX - fWidth, fBaseY);
        ctx.quadraticCurveTo(fBaseX - fWidth * 0.7, fBaseY - fHeight * 0.45, tipX, tipY);
        ctx.quadraticCurveTo(fBaseX + fWidth * 0.7, fBaseY - fHeight * 0.45, fBaseX + fWidth, fBaseY);
        ctx.closePath();
        ctx.fill();

        // Labareda Média (Laranja Solar / Âmbar)
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.moveTo(fBaseX - fWidth * 0.65, fBaseY);
        ctx.quadraticCurveTo(fBaseX - fWidth * 0.45, fBaseY - fHeight * 0.4, tipX * 0.95 + fBaseX * 0.05, tipY + fHeight * 0.15);
        ctx.quadraticCurveTo(fBaseX + fWidth * 0.45, fBaseY - fHeight * 0.4, fBaseX + fWidth * 0.65, fBaseY);
        ctx.closePath();
        ctx.fill();

        // Labareda Interna (Amarelo Ouro / Branco Solar)
        ctx.fillStyle = '#fff176';
        ctx.beginPath();
        ctx.moveTo(fBaseX - fWidth * 0.35, fBaseY);
        ctx.quadraticCurveTo(fBaseX - fWidth * 0.2, fBaseY - fHeight * 0.35, tipX * 0.9 + fBaseX * 0.1, tipY + fHeight * 0.35);
        ctx.quadraticCurveTo(fBaseX + fWidth * 0.2, fBaseY - fHeight * 0.35, fBaseX + fWidth * 0.35, fBaseY);
        ctx.closePath();
        ctx.fill();
      }

      // E. Brasas e Fagulhas Ascendentes (Rising Embers)
      const emberCount = 5;
      for (let emb = 0; emb < emberCount; emb++) {
        const embSeed = seed + emb * 83;
        const cycle = ((frameCount * 0.6 + embSeed * 7) % 36) / 36; // 0..1
        const embAlpha = (1 - cycle) * (cycle > 0.1 ? 1 : cycle * 10);
        const embDist = cycle * (baseR * 1.55);
        const embSway = Math.sin(frameCount * 0.14 + embSeed + cycle * 4) * (baseR * 0.35);
        const embX = p.x + ((embSeed % 17) - 8) * (baseR * 0.08) + embSway;
        const embY = p.y - embDist;
        const embSize = Math.max(0.8, (2.4 - cycle * 1.5) * shrinkFactor);

        ctx.fillStyle = emb % 2 === 0 ? `rgba(255, 235, 120, ${embAlpha})` : `rgba(243, 156, 18, ${embAlpha})`;
        ctx.beginPath();
        ctx.arc(embX, embY, embSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      continue;
    }

    // Zero-Save/Restore: evita sobrecarga de pilha de canvas por poça
    const baseAlpha = p.isAlchemist ? 0.28 : 0.60;
    ctx.globalAlpha = baseAlpha * fadeProgress;

    if (p.isAlchemist) {
      // Poça de veneno da Valéria: ROXA / Violeta Alquímica (diferenciada de venenos de mobs)
      ctx.fillStyle = p.isEvolved ? '#a29bfe' : '#8e44ad';
      ctx.strokeStyle = p.isEvolved ? '#d6a2e8' : '#9b59b6';
    } else if (p.isEvolved) {
      ctx.fillStyle = '#00cec9';
      ctx.strokeStyle = '#81ecec';
    } else {
      ctx.fillStyle = '#2ecc71';
      ctx.strokeStyle = '#27ae60';
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Bolhas efervescentes em lote único (Single-pass path)
    const bubbleCount = p.isEvolved ? 3 : 2;
    ctx.fillStyle = p.isAlchemist ? (p.isEvolved ? '#e056fd' : '#d6a2e8') : (p.isEvolved ? '#e0ffff' : '#a8e6cf');
    ctx.beginPath();
    for (let b = 0; b < bubbleCount; b++) {
      const bAng = frameCount * 0.08 + (b * Math.PI) + i;
      const bDist = r * 0.52;
      const bx = p.x + Math.cos(bAng) * bDist;
      const by = p.y + Math.sin(bAng) * bDist;
      const br = Math.max(0.6, (2.0 + Math.sin(frameCount * 0.2 + b)) * shrinkFactor);
      ctx.moveTo(bx + br, by);
      ctx.arc(bx, by, br, 0, Math.PI * 2);
    }
    ctx.fill();

    if (p.isAlchemist) {
      // Anel cáustico efervescente interno em tom violeta
      ctx.strokeStyle = p.isEvolved ? 'rgba(214, 162, 232, 0.70)' : 'rgba(155, 89, 182, 0.70)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, r * 0.78), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Restaura o alpha imediatamente após cada poça
    ctx.globalAlpha = 1.0;
  }

  // Garantia absoluta de alpha normalizado ao término da renderização de poças
  ctx.globalAlpha = 1.0;
}

export function renderBossTelegraphs(ctx, bossTelegraphs, frameCount) {
  for (let i = 0; i < bossTelegraphs.length; i++) {
    const t = bossTelegraphs[i];
    const maxT = (t.maxTimer && t.maxTimer > 0) ? t.maxTimer : (t.timer || 1);
    const rawProgress = 1 - (t.timer / maxT);
    const progress = isNaN(rawProgress) ? 1 : Math.max(0, Math.min(1, rawProgress));
    ctx.save();

    if (t.type === 'SCYTHE_CLEAVE') {
      const arcHalf = t.arcHalf !== undefined ? t.arcHalf : Math.PI * 0.52;
      const startAng = t.angle - arcHalf;
      const endAng = t.angle + arcHalf;
      const rgbCol = t.colorRgb || '0, 206, 201';
      const hexCol = t.color || '#00cec9';

      // 1. Área total de corte com grade rúnica sutil
      ctx.fillStyle = `rgba(${rgbCol}, 0.14)`;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.arc(t.x, t.y, t.radius, startAng, endAng);
      ctx.closePath();
      ctx.fill();

      // Borda total do cone
      ctx.strokeStyle = `rgba(${rgbCol}, 0.55)`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x + Math.cos(startAng) * t.radius, t.y + Math.sin(startAng) * t.radius);
      ctx.arc(t.x, t.y, t.radius, startAng, endAng);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();

      // 2. Preenchimento de carregamento de perigo
      ctx.fillStyle = `rgba(${rgbCol}, ${0.22 + progress * 0.48})`;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.arc(t.x, t.y, t.radius * progress, startAng, endAng);
      ctx.closePath();
      ctx.fill();

      // Borda de avanço da lâmina
      ctx.strokeStyle = progress > 0.82 ? '#ffffff' : hexCol;
      ctx.lineWidth = progress > 0.82 ? 4.5 : 3.0;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius * progress, startAng, endAng);
      ctx.stroke();

      // 3. Setas direcionais curvas espectrais no chão
      const arrowArcs = [0.45, 0.72];
      for (let rFrac of arrowArcs) {
        const arrowR = t.radius * rFrac;
        if (progress > 0.12) {
          ctx.strokeStyle = progress > 0.8 ? '#ffffff' : `rgba(${rgbCol}, 0.75)`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(t.x, t.y, arrowR, t.angle - 0.28, t.angle + 0.28);
          ctx.stroke();

          const tipAng = t.angle + 0.28;
          const tipX = t.x + Math.cos(tipAng) * arrowR;
          const tipY = t.y + Math.sin(tipAng) * arrowR;
          ctx.fillStyle = progress > 0.8 ? '#ffffff' : hexCol;
          ctx.beginPath();
          ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (t.type === 'MIST_DASH_LANE') {
      const len = t.length || 320;
      const w = t.width || 70;
      const halfW = w / 2;

      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);

      ctx.fillStyle = 'rgba(142, 68, 173, 0.15)';
      ctx.fillRect(0, -halfW, len, w);

      ctx.strokeStyle = 'rgba(155, 89, 182, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(0, -halfW, len, w);
      ctx.setLineDash([]);

      ctx.fillStyle = `rgba(231, 76, 60, ${0.25 + progress * 0.4})`;
      ctx.fillRect(0, -halfW, len * progress, w);

      const arrowCount = 4;
      ctx.fillStyle = progress > 0.8 ? '#ffffff' : '#ff7675';
      for (let a = 1; a <= arrowCount; a++) {
        const ax = (len / (arrowCount + 1)) * a;
        if (ax <= len * (progress + 0.2)) {
          ctx.beginPath();
          ctx.moveTo(ax - 8, -10);
          ctx.lineTo(ax + 8, 0);
          ctx.lineTo(ax - 8, 10);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.strokeStyle = '#ff4757';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(len * progress, -halfW);
      ctx.lineTo(len * progress, halfW);
      ctx.stroke();
    } else if (t.type === 'FALLING_ROCK') {
      // Telegrafia Intuitiva de Queda: Sombra que cresce + Anel de aviso que encolhe de fora para dentro
      const shadowR = t.radius * (0.25 + progress * 0.75);
      ctx.fillStyle = 'rgba(15, 10, 8, 0.45)';
      ctx.beginPath();
      ctx.ellipse(t.x, t.y, shadowR, shadowR * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();

      // Anel de impacto fixo
      ctx.strokeStyle = 'rgba(230, 126, 34, 0.4)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Anel cadente em retração
      const fallingRingR = t.radius + (t.radius * 1.5) * (1 - progress);
      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : `rgba(243, 156, 18, ${0.35 + progress * 0.65})`;
      ctx.lineWidth = progress > 0.85 ? 3.5 : 2.2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, fallingRingR, 0, Math.PI * 2);
      ctx.stroke();

      // Renderização do monólito de basalto caindo do céu nos últimos 35% do tempo
      if (progress > 0.65) {
        const rockDropPhase = (progress - 0.65) / 0.35;
        const altitude = (1 - rockDropPhase) * 110;
        const rockY = t.y - altitude;
        ctx.fillStyle = '#2d3436';
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(t.x, rockY - 14);
        ctx.lineTo(t.x + 12, rockY);
        ctx.lineTo(t.x + 8, rockY + 14);
        ctx.lineTo(t.x - 8, rockY + 14);
        ctx.lineTo(t.x - 12, rockY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else if (t.type === 'FISSURE_NODE') {
      // Linha de fratura conectada à origem e nós precedentes
      if (t.originX !== undefined && t.originY !== undefined) {
        ctx.strokeStyle = `rgba(230, 126, 34, ${0.25 + progress * 0.45})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(t.originX, t.originY);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
      }

      ctx.fillStyle = `rgba(230, 126, 34, ${0.15 + progress * 0.35})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fill();

      // Estacas de pedra saindo do chão gradualmente
      const spikeR = t.radius * progress;
      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : '#e67e22';
      ctx.lineWidth = progress > 0.85 ? 3.0 : 2.0;
      ctx.beginPath();
      ctx.arc(t.x, t.y, spikeR, 0, Math.PI * 2);
      ctx.stroke();

      // Racha tectônica no centro do nó
      ctx.strokeStyle = '#d35400';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(t.x - 8, t.y - 4);
      ctx.lineTo(t.x, t.y + 4);
      ctx.lineTo(t.x + 8, t.y - 2);
      ctx.stroke();
    } else if (t.type === 'ABYSSAL_VOID_RIFT') {
      // Telegrafia Cósmica do Bombardeio Abissal
      // 1. Círculo Externo com glifos pulsantes e anel de alerta
      ctx.fillStyle = `rgba(14, 2, 24, ${0.25 + progress * 0.35})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(0, 206, 201, ${0.4 + progress * 0.45})`;
      ctx.lineWidth = 2.0;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Preenchimento de carregamento de perigo em expansão
      const curR = t.radius * progress;
      const riftGrad = ctx.createRadialGradient(t.x, t.y, 2, t.x, t.y, Math.max(3, curR));
      riftGrad.addColorStop(0, '#ffffff');
      riftGrad.addColorStop(0.35, '#00cec9');
      riftGrad.addColorStop(0.75, 'rgba(232, 67, 147, 0.7)');
      riftGrad.addColorStop(1, 'rgba(142, 68, 173, 0.1)');
      ctx.fillStyle = riftGrad;
      ctx.beginPath();
      ctx.arc(t.x, t.y, curR, 0, Math.PI * 2);
      ctx.fill();

      // Borda de detonação
      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : '#00cec9';
      ctx.lineWidth = progress > 0.85 ? 3.5 : 2.2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, curR, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Glifos e runas rotativas cósmicas
      const rot = frameCount * 0.06;
      ctx.strokeStyle = progress > 0.8 ? '#ffffff' : 'rgba(232, 67, 147, 0.8)';
      ctx.lineWidth = 1.5;
      for (let g = 0; g < 4; g++) {
        const ga = rot + (g * Math.PI * 0.5);
        const gx = t.x + Math.cos(ga) * (t.radius * 0.65);
        const gy = t.y + Math.sin(ga) * (t.radius * 0.65);
        ctx.beginPath();
        ctx.arc(gx, gy, 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (t.type === 'DIMENSIONAL_CLEAVE') {
      // Telegrafia da Fratura Dimensional: Lâminas Geométricas de Vácuo Cortando a Arena
      const halfLen = (t.length || 1300) * 0.5;
      const w = t.width || 68; // Dobro da espessura base de telegrafia
      const cosA = Math.cos(t.angle);
      const sinA = Math.sin(t.angle);

      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);

      // 1. Corredor de perigo translúcido
      const corridorAlpha = 0.10 + progress * 0.22;
      ctx.fillStyle = `rgba(0, 206, 201, ${corridorAlpha})`;
      ctx.fillRect(-halfLen, -w * 0.5, halfLen * 2, w);

      // Bordas do corredor
      ctx.strokeStyle = `rgba(232, 67, 147, ${0.35 + progress * 0.45})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(-halfLen, -w * 0.5);
      ctx.lineTo(halfLen, -w * 0.5);
      ctx.moveTo(-halfLen, w * 0.5);
      ctx.lineTo(halfLen, w * 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Fissura Central de Navalha com Brilho Cósmico
      const coreAlpha = 0.4 + progress * 0.6;
      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : `rgba(0, 206, 201, ${coreAlpha})`;
      ctx.lineWidth = progress > 0.85 ? 4.0 : 2.0;
      ctx.beginPath();
      ctx.moveTo(-halfLen * progress, 0);
      ctx.lineTo(halfLen * progress, 0);
      ctx.stroke();

      // 3. Glifos e micro-fissuras estelares ao longo do corte
      const runeStep = 75;
      const runeCount = Math.floor((halfLen * 2) / runeStep);
      for (let r = 0; r <= runeCount; r++) {
        const rx = -halfLen + r * runeStep;
        if (Math.abs(rx) <= halfLen * progress) {
          ctx.fillStyle = r % 2 === 0 ? '#00cec9' : '#e84393';
          ctx.beginPath();
          ctx.arc(rx, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Pequenas pontas de agulha ortogonais
          ctx.strokeStyle = progress > 0.85 ? '#ffffff' : 'rgba(232, 67, 147, 0.7)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(rx, -4);
          ctx.lineTo(rx, 4);
          ctx.stroke();
        }
      }
      ctx.restore();
    } else if (t.type === 'ASTRAL_METEOR_SEAL') {
      // Selo Rúnico de Queda de Meteoro Cósmico
      // 1. Círculo Externo com anel de alerta
      ctx.fillStyle = `rgba(30, 2, 40, ${0.22 + progress * 0.32})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(232, 67, 147, ${0.45 + progress * 0.5})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Mira nos 4 eixos
      const crossSize = 10;
      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : '#00cec9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(t.x - t.radius - crossSize, t.y); ctx.lineTo(t.x - t.radius + crossSize, t.y);
      ctx.moveTo(t.x + t.radius - crossSize, t.y); ctx.lineTo(t.x + t.radius + crossSize, t.y);
      ctx.moveTo(t.x, t.y - t.radius - crossSize); ctx.lineTo(t.x, t.y - t.radius + crossSize);
      ctx.moveTo(t.x, t.y + t.radius - crossSize); ctx.lineTo(t.x, t.y + t.radius + crossSize);
      ctx.stroke();

      // 2. Preenchimento de avanço do meteoro
      const curR = t.radius * progress;
      const sealGrad = ctx.createRadialGradient(t.x, t.y, 2, t.x, t.y, Math.max(3, curR));
      sealGrad.addColorStop(0, '#ffffff');
      sealGrad.addColorStop(0.3, '#e84393');
      sealGrad.addColorStop(0.7, '#8e44ad');
      sealGrad.addColorStop(1, 'rgba(0, 206, 201, 0.15)');
      ctx.fillStyle = sealGrad;
      ctx.beginPath();
      ctx.arc(t.x, t.y, curR, 0, Math.PI * 2);
      ctx.fill();

      // Borda de detonação
      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : '#e84393';
      ctx.lineWidth = progress > 0.85 ? 3.5 : 2.0;
      ctx.beginPath();
      ctx.arc(t.x, t.y, curR, 0, Math.PI * 2);
      ctx.stroke();

      // Rotação estelar interna
      const starRot = frameCount * 0.08;
      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : 'rgba(0, 206, 201, 0.7)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const sa = starRot + (s * Math.PI / 3);
        const sx = t.x + Math.cos(sa) * (t.radius * 0.5);
        const sy = t.y + Math.sin(sa) * (t.radius * 0.5);
        if (s === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.stroke();
    } else {
      const isTeleport = t.type === 'VAMPIRE_TELEPORT';
      const isRepulsion = t.type === 'REPULSION';
      const baseCol = isTeleport ? '#8e44ad' : (isRepulsion ? '#ff1744' : '#e74c3c');

      ctx.fillStyle = isTeleport ? 'rgba(142, 68, 173, 0.12)' : (isRepulsion ? 'rgba(255, 23, 68, 0.18)' : 'rgba(231, 76, 60, 0.12)');
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isTeleport ? 'rgba(142, 68, 173, 0.65)' : (isRepulsion ? 'rgba(255, 23, 68, 0.85)' : 'rgba(231, 76, 60, 0.65)');
      ctx.lineWidth = isRepulsion ? 2.8 : 2;
      ctx.stroke();

      ctx.fillStyle = isTeleport 
        ? `rgba(142, 68, 173, ${0.2 + progress * 0.45})` 
        : (isRepulsion ? `rgba(255, 23, 68, ${0.25 + progress * 0.5})` : `rgba(231, 76, 60, ${0.2 + progress * 0.45})`);
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius * progress, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = progress > 0.85 ? '#ffffff' : baseCol;
      ctx.lineWidth = progress > 0.85 ? 3.5 : 2.5;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius * progress, 0, Math.PI * 2);
      ctx.stroke();

      if (isTeleport) {
        const rot = frameCount * 0.05;
        ctx.strokeStyle = 'rgba(241, 196, 15, 0.75)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let k = 0; k < 3; k++) {
          const a = rot + (k * Math.PI * 2 / 3);
          const px = t.x + Math.cos(a) * (t.radius * 0.65);
          const py = t.y + Math.sin(a) * (t.radius * 0.65);
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

export function renderBossShockwaves(ctx, bossShockwaves, activeBoss, frameCount) {
  for (let i = 0; i < bossShockwaves.length; i++) {
    const sw = bossShockwaves[i];
    const alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
    if (alpha <= 0.01) continue;

    ctx.save();
    const swColor = sw.colorRgb || (activeBoss && activeBoss.bossId === 3 ? '0, 206, 201' : '230, 126, 34');

    // 1. Corpo volumétrico translúcido da onda (camada externa com dispersão de luz)
    ctx.strokeStyle = `rgba(${swColor}, ${alpha * 0.24})`;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Camada intermediária saturada e nítida
    ctx.strokeStyle = `rgba(${swColor}, ${alpha * 0.78})`;
    ctx.lineWidth = 4.8;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Crista frontal superaquecida de luz branca (marcação exata da hitbox)
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Fagulhas estelares projetadas na crista da onda para leitura visual imediata
    if (sw.radius > 20 && alpha > 0.2) {
      const sparkCount = 8;
      const timeOffset = (frameCount || 0) * 0.04;
      ctx.fillStyle = '#ffffff';
      for (let s = 0; s < sparkCount; s++) {
        const sAng = (s * Math.PI * 2) / sparkCount + timeOffset;
        const sparkX = sw.x + Math.cos(sAng) * sw.radius;
        const sparkY = sw.y + Math.sin(sAng) * sw.radius;

        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 2.0 * alpha, 0, Math.PI * 2);
        ctx.fill();

        // Rastro curto radial
        const trailLen = 7 * alpha;
        ctx.strokeStyle = `rgba(${swColor}, ${alpha * 0.65})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sparkX, sparkY);
        ctx.lineTo(sparkX - Math.cos(sAng) * trailLen, sparkY - Math.sin(sAng) * trailLen);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

export function renderBossProjectiles(ctx, bossProjectiles, frameCount) {
  for (let i = 0; i < bossProjectiles.length; i++) {
    const bp = bossProjectiles[i];
    ctx.save();
    ctx.translate(bp.x, bp.y);
    ctx.rotate(bp.angle);

    if (bp.type === 'SOUL_SCYTHE') {
      const isRet = bp.isReturning;
      const primaryCol = isRet ? '#ff4757' : (bp.color || '#00cec9');
      const glowCol    = isRet ? '#ff6b81' : '#81ecec';
      const r = bp.radius || 20;

      // 1. Rastro Espectral Circular / Desfoque de Giro (Motion Blur Whirl)
      ctx.save();
      const whirlGrad = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.45);
      whirlGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      whirlGrad.addColorStop(0.65, isRet ? 'rgba(255, 71, 87, 0.24)' : 'rgba(0, 206, 201, 0.20)');
      whirlGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = whirlGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2);
      ctx.fill();

      // Anéis de perigo no retorno
      if (isRet) {
        ctx.strokeStyle = 'rgba(255, 71, 87, 0.6)';
        ctx.lineWidth = 2.4;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();

      // 2. Haste Reto e Manivela Serrilhada com Orbe Ciano
      const tealCol  = isRet ? '#ff4757' : '#00cec9';
      const rubyCol  = isRet ? '#ff4757' : '#c0392b';

      // Haste reta
      ctx.fillStyle = '#141a1f';
      ctx.fillRect(-1.5, -r * 0.95, 3, r * 1.75);

      // Braçadeiras teal
      ctx.fillStyle = '#222d36';
      ctx.strokeStyle = tealCol;
      ctx.lineWidth = 0.9;
      ctx.strokeRect(-2.8, -r * 0.45, 5.6, 3);
      ctx.strokeRect(-2.8, r * 0.25, 5.6, 3);

      // Manivela serrilhada e orbe inferior
      ctx.strokeStyle = tealCol;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.8);
      ctx.lineTo(-r * 0.25, r * 1.0);
      ctx.lineTo(-r * 0.25, r * 1.35);
      ctx.lineTo(-r * 0.45, r * 1.45);
      ctx.stroke();

      // Dentes de serra na manivela
      ctx.fillStyle = '#222d36';
      for (let s = 0; s < 3; s++) {
        const sy = r * (1.05 + s * 0.1);
        ctx.beginPath();
        ctx.moveTo(-r * 0.25, sy);
        ctx.lineTo(-r * 0.08, sy + r * 0.04);
        ctx.lineTo(-r * 0.25, sy + r * 0.08);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Orbe ciano no pomo
      ctx.fillStyle = tealCol;
      ctx.beginPath();
      ctx.arc(-r * 0.45, r * 1.45, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Escala reduzida pela metade (50%) para a lâmina e contra-lâmina da foice giratória
      ctx.save();
      ctx.translate(0, -r * 0.95);
      ctx.scale(0.5, 0.5);
      ctx.translate(0, r * 0.95);

      // 3. Cabeçote e Contra-Lâmina Traseira com Rubi (Formato Curvo em Garra)
      ctx.fillStyle = '#1e2b36';
      ctx.beginPath();
      ctx.moveTo(r * 0.1, -r * 1.0);
      ctx.bezierCurveTo(r * 0.35, -r * 1.1, r * 0.55, -r * 0.88, r * 0.65, -r * 0.35);
      ctx.bezierCurveTo(r * 0.48, -r * 0.55, r * 0.28, -r * 0.75, r * 0.1, -r * 0.86);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = tealCol;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Rubi na contra-lâmina
      ctx.fillStyle = rubyCol;
      ctx.beginPath();
      ctx.moveTo(r * 0.18, -r * 0.95);
      ctx.lineTo(r * 0.36, -r * 1.0);
      ctx.lineTo(r * 0.52, -r * 0.80);
      ctx.lineTo(r * 0.32, -r * 0.82);
      ctx.closePath();
      ctx.fill();

      // Gume prateado traseiro
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(r * 0.65, -r * 0.35);
      ctx.bezierCurveTo(r * 0.48, -r * 0.55, r * 0.28, -r * 0.75, r * 0.1, -r * 0.86);
      ctx.stroke();

      // 4. Lâmina Principal (Formato Fiel ao Conceito Artístico)
      // A. Estalactites de cristal sob a junção
      ctx.fillStyle = rubyCol;
      const stalsProj = [
        [[-r * 0.35, -r * 0.74], [-r * 0.42, -r * 0.46], [-r * 0.48, -r * 0.74]],
        [[-r * 0.48, -r * 0.74], [-r * 0.53, -r * 0.58], [-r * 0.58, -r * 0.74]]
      ];
      for (let st of stalsProj) {
        ctx.beginPath();
        ctx.moveTo(st[0][0], st[0][1]);
        ctx.lineTo(st[1][0], st[1][1]);
        ctx.lineTo(st[2][0], st[2][1]);
        ctx.closePath();
        ctx.fill();
      }

      // B. Corpo da Lâmina: Cúpula com Crista, 3 Espigões Inclinados e Curvatura Monumental
      ctx.fillStyle = '#1e2b36';
      ctx.beginPath();
      ctx.moveTo(-r * 0.1, -r * 1.0);
      // Crista da cúpula
      ctx.quadraticCurveTo(-r * 0.2, -r * 1.16, -r * 0.32, -r * 1.24);
      ctx.quadraticCurveTo(-r * 0.42, -r * 1.20, -r * 0.5, -r * 1.14);
      // Espigão 1
      ctx.quadraticCurveTo(-r * 0.54, -r * 1.25, -r * 0.58, -r * 1.26);
      ctx.lineTo(-r * 0.64, -r * 1.16);
      ctx.lineTo(-r * 0.7, -r * 1.12);
      // Espigão 2
      ctx.quadraticCurveTo(-r * 0.74, -r * 1.22, -r * 0.8, -r * 1.22);
      ctx.lineTo(-r * 0.86, -r * 1.12);
      ctx.lineTo(-r * 0.92, -r * 1.06);
      // Espigão 3
      ctx.quadraticCurveTo(-r * 0.96, -r * 1.14, -r * 1.02, -r * 1.14);
      ctx.lineTo(-r * 1.08, -r * 1.04);
      ctx.lineTo(-r * 1.15, -r * 0.96);
      // Curva monumental do dorso até a ponta
      ctx.bezierCurveTo(-r * 1.45, -r * 0.86, -r * 1.72, -r * 0.55, -r * 1.86, -r * 0.14);
      ctx.bezierCurveTo(-r * 1.96, r * 0.20, -r * 1.94, r * 0.44, -r * 1.86, r * 0.58);
      // Gume interno de retorno
      ctx.bezierCurveTo(-r * 1.82, r * 0.36, -r * 1.74, r * 0.14, -r * 1.64, -r * 0.08);
      ctx.bezierCurveTo(-r * 1.48, -r * 0.38, -r * 1.18, -r * 0.62, -r * 0.6, -r * 0.74);
      // Gancho/barb inferior da cúpula
      ctx.lineTo(-r * 0.25, -r * 0.70);
      ctx.lineTo(-r * 0.16, -r * 0.60);
      ctx.lineTo(-r * 0.1, -r * 0.86);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0e1419';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // C. Canal de Cristais de Rubi Facetados
      ctx.fillStyle = rubyCol;
      ctx.beginPath();
      ctx.moveTo(-r * 0.25, -r * 0.95);
      ctx.lineTo(-r * 0.65, -r * 0.95);
      ctx.lineTo(-r * 1.15, -r * 0.78);
      ctx.lineTo(-r * 1.55, -r * 0.40);
      ctx.lineTo(-r * 1.78, r * 0.15);
      ctx.lineTo(-r * 1.70, r * 0.25);
      ctx.lineTo(-r * 1.50, -r * 0.20);
      ctx.lineTo(-r * 1.10, -r * 0.52);
      ctx.lineTo(-r * 0.60, -r * 0.74);
      ctx.closePath();
      ctx.fill();

      // Facetas internas do rubi
      ctx.strokeStyle = isRet ? '#ff7675' : '#ff4d61';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-r * 0.65, -r * 0.95);
      ctx.lineTo(-r * 0.60, -r * 0.74);
      ctx.moveTo(-r * 1.15, -r * 0.78);
      ctx.lineTo(-r * 1.10, -r * 0.52);
      ctx.moveTo(-r * 1.55, -r * 0.40);
      ctx.lineTo(-r * 1.50, -r * 0.20);
      ctx.stroke();

      // D. Gume Chanfrado em Aço Prateado Polido
      const bladeGrad = ctx.createLinearGradient(-r * 0.6, -r * 0.74, -r * 1.86, r * 0.58);
      bladeGrad.addColorStop(0.0, '#74b9ff');
      bladeGrad.addColorStop(0.4, '#c7ecee');
      bladeGrad.addColorStop(0.8, '#dff9fb');
      bladeGrad.addColorStop(1.0, '#ffffff');

      ctx.strokeStyle = bladeGrad;
      ctx.lineWidth = 3.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-r * 1.86, r * 0.58); // Ponta extrema da foice
      ctx.bezierCurveTo(-r * 1.82, r * 0.36, -r * 1.74, r * 0.14, -r * 1.64, -r * 0.08);
      ctx.bezierCurveTo(-r * 1.48, -r * 0.38, -r * 1.18, -r * 0.62, -r * 0.6, -r * 0.74);
      ctx.stroke();

      // Fio incandescente puro
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Ponto especular na ponta da foice
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-r * 1.86 - 2, r * 0.58 - 2, 4, 4);

      ctx.restore(); // Restaura escala de 50% da foice giratória
    } else {
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, bp.radius, 0, Math.PI);
      ctx.stroke();
    }
    ctx.restore();
  }
}
