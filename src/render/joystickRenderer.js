/**
 * src/render/joystickRenderer.js
 * 
 * Módulo especializado na renderização diegética e ergonômica do Joystick Virtual.
 * Implementa identidades visuais distintas e refinadas para os modos:
 * 1. FLUTUANTE ("Astrolábio Espectral"): Base deslizante com rastro cósmico e anéis de navegação.
 * 2. DINÂMICO ("Selo Rúnico de Tensão"): Base fixa ancorada com 8 nós rúnicos e cabo elástico de tração.
 * 
 * Inclui:
 * - Ciclo de vida suave com fade-in elástico e retração/dissolução etérea no fade-out.
 * - Projeção de halos luminosos e indicadores direcionais além da área coberta pelo polegar (visão periférica).
 * - Efeitos de saturação máxima com pulso e partículas incandescentes sincronizadas ao haptic feedback.
 */

import { JOYSTICK_MODES } from '../core/input.js';

// Estado visual persistente entre frames para interpolação suave
const visualState = {
  alpha: 0,
  scale: 0.9,
  lastStartX: 0,
  lastStartY: 0,
  curX: 0,
  curY: 0,
  angle: 0,
  wasSaturated: false,
  ghostTrails: [], // Buffer de posições para o rastro do modo Flutuante
  particles: []    // Partículas de saturação e faíscas rúnicas
};

const MAX_TRAIL_LENGTH = 5;
const MAX_PARTICLES = 24;

// Cache estático de gradientes/reutilizáveis para zero garbage collection
let cachedBgGrad = null;
let cachedBgGradKey = '';

function getBackgroundGradient(ctx, x, y, r, isDynamic, isSaturated) {
  const key = `${Math.round(x)}_${Math.round(y)}_${r}_${isDynamic ? 1 : 0}_${isSaturated ? 1 : 0}`;
  if (cachedBgGradKey === key && cachedBgGrad) return cachedBgGrad;

  const grad = ctx.createRadialGradient(x, y, 4, x, y, r + 6);
  if (isDynamic) {
    if (isSaturated) {
      grad.addColorStop(0, 'rgba(40, 14, 18, 0.65)');
      grad.addColorStop(0.7, 'rgba(25, 10, 12, 0.45)');
      grad.addColorStop(1, 'rgba(231, 76, 60, 0.00)');
    } else {
      grad.addColorStop(0, 'rgba(24, 14, 18, 0.55)');
      grad.addColorStop(0.7, 'rgba(16, 12, 16, 0.38)');
      grad.addColorStop(1, 'rgba(241, 196, 15, 0.00)');
    }
  } else {
    // Flutuante Espectral
    if (isSaturated) {
      grad.addColorStop(0, 'rgba(18, 22, 34, 0.65)');
      grad.addColorStop(0.7, 'rgba(12, 18, 28, 0.42)');
      grad.addColorStop(1, 'rgba(241, 196, 15, 0.00)');
    } else {
      grad.addColorStop(0, 'rgba(10, 18, 30, 0.58)');
      grad.addColorStop(0.7, 'rgba(6, 14, 24, 0.35)');
      grad.addColorStop(1, 'rgba(0, 206, 201, 0.00)');
    }
  }
  cachedBgGrad = grad;
  cachedBgGradKey = key;
  return grad;
}

function spawnSaturationBurst(x, y, isDynamic) {
  const count = isDynamic ? 8 : 6;
  for (let i = 0; i < count; i++) {
    if (visualState.particles.length >= MAX_PARTICLES) break;
    const ang = Math.random() * Math.PI * 2;
    const spd = 1.2 + Math.random() * 2.8;
    visualState.particles.push({
      x: x,
      y: y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life: 1.0,
      decay: 0.045 + Math.random() * 0.035,
      color: isDynamic ? (Math.random() > 0.5 ? '#f1c40f' : '#e74c3c') : (Math.random() > 0.5 ? '#00cec9' : '#ffeaa7'),
      size: 1.8 + Math.random() * 1.8
    });
  }
}

function updateParticles() {
  for (let i = visualState.particles.length - 1; i >= 0; i--) {
    const p = visualState.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.93;
    p.vy *= 0.93;
    p.life -= p.decay;
    if (p.life <= 0) {
      visualState.particles.splice(i, 1);
    }
  }
}

/**
 * Renderizador mestre do Joystick Virtual.
 * Chamado pelo loop de renderização do jogo em screen space.
 */
export function drawJoystick(ctx, stick, frameCount) {
  const isDynamic = stick.mode === JOYSTICK_MODES.DYNAMIC || stick.mode === 'dynamic';

  // 1. Interpolação suave de Lifecycle (Fade-In elástico e Retração no Fade-Out)
  if (stick.active) {
    visualState.alpha += (1.0 - visualState.alpha) * 0.28;
    visualState.scale += (1.0 - visualState.scale) * 0.22;
    visualState.curX += (stick.curX - visualState.curX) * 0.75;
    visualState.curY += (stick.curY - visualState.curY) * 0.75;

    // Detecta deslocamento da base no modo Flutuante para alimentar o rastro de névoa
    if (!isDynamic) {
      const movedDist = Math.hypot(stick.startX - visualState.lastStartX, stick.startY - visualState.lastStartY);
      if (movedDist > 4) {
        visualState.ghostTrails.unshift({ x: visualState.lastStartX, y: visualState.lastStartY, alpha: 0.4 });
        if (visualState.ghostTrails.length > MAX_TRAIL_LENGTH) {
          visualState.ghostTrails.pop();
        }
      }
    }
    visualState.lastStartX = stick.startX;
    visualState.lastStartY = stick.startY;

    // Trigger de faíscas de saturação
    if (!visualState.wasSaturated && stick.isSaturated) {
      spawnSaturationBurst(stick.curX, stick.curY, isDynamic);
    }
    visualState.wasSaturated = stick.isSaturated;
  } else {
    // Quando inativo, dissolve a opacidade e retrai o knob em direção ao centro
    visualState.alpha += (0.0 - visualState.alpha) * 0.16;
    visualState.scale += (0.88 - visualState.scale) * 0.18;
    visualState.curX += (stick.startX - visualState.curX) * 0.25;
    visualState.curY += (stick.startY - visualState.curY) * 0.25;
    visualState.wasSaturated = false;

    // Decaimento gradual do rastro
    if (visualState.ghostTrails.length > 0) {
      for (let i = 0; i < visualState.ghostTrails.length; i++) {
        visualState.ghostTrails[i].alpha *= 0.85;
      }
      if (visualState.ghostTrails[0].alpha < 0.02) visualState.ghostTrails.length = 0;
    }
  }

  // Atualização das partículas físicas ativas
  updateParticles();

  // Se o joystick estiver totalmente invisível e sem partículas, pula o desenho
  if (visualState.alpha < 0.008 && visualState.particles.length === 0) {
    return;
  }

  const startX = stick.startX;
  const startY = stick.startY;
  const curX = visualState.curX;
  const curY = visualState.curY;
  const radius = stick.radius || 48;
  const isSat = stick.isSaturated;
  const mag = stick.normMag || 0;
  const dx = curX - startX;
  const dy = curY - startY;
  const dist = Math.hypot(dx, dy);
  const angle = dist > 0.001 ? Math.atan2(dy, dx) : visualState.angle;
  visualState.angle = angle;

  const idlePulse = Math.sin(frameCount * 0.06);

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, visualState.alpha));

  // Aplica escala sutil de entrada/saída elástica ancorada no centro da base
  if (Math.abs(visualState.scale - 1.0) > 0.005) {
    ctx.translate(startX, startY);
    ctx.scale(visualState.scale, visualState.scale);
    ctx.translate(-startX, -startY);
  }

  if (isDynamic) {
    drawDynamicRunicMode(ctx, startX, startY, curX, curY, radius, dist, angle, mag, isSat, idlePulse, frameCount);
  } else {
    drawFloatingSpectralMode(ctx, startX, startY, curX, curY, radius, dist, angle, mag, isSat, idlePulse, frameCount);
  }

  // Renderização das partículas de saturação
  if (visualState.particles.length > 0) {
    for (let i = 0; i < visualState.particles.length; i++) {
      const p = visualState.particles[i];
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * visualState.alpha));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * MODO FLUTUANTE ("Astrolábio Espectral")
 * Base translúcida com anéis de navegação astral, marcadores que giram com o vetor,
 * feixe de plasma cônico e rastro sutil de névoa nas translações.
 */
function drawFloatingSpectralMode(ctx, startX, startY, curX, curY, radius, dist, angle, mag, isSat, idlePulse, frameCount) {
  const dx = curX - startX;
  const dy = curY - startY;

  // 1. Rastro Astral Deslizante (Ghost Trails ao mover a base)
  if (visualState.ghostTrails.length > 0) {
    for (let i = 0; i < visualState.ghostTrails.length; i++) {
      const pt = visualState.ghostTrails[i];
      const trailAlpha = pt.alpha * (1 - i / visualState.ghostTrails.length) * 0.35;
      if (trailAlpha > 0.01) {
        ctx.strokeStyle = `rgba(0, 206, 201, ${trailAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius * (0.88 - i * 0.08), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // 2. Fundo Translúcido com Gradiente de Névoa Abissal
  ctx.fillStyle = getBackgroundGradient(ctx, startX, startY, radius, false, isSat);
  ctx.beginPath();
  ctx.arc(startX, startY, radius + 5, 0, Math.PI * 2);
  ctx.fill();

  // 3. Anel Externo do Astrolábio
  const ringAlpha = 0.32 + mag * 0.35;
  ctx.strokeStyle = isSat ? 'rgba(255, 234, 167, 0.85)' : `rgba(0, 206, 201, ${ringAlpha})`;
  ctx.lineWidth = isSat ? 2.2 : 1.6;
  ctx.beginPath();
  ctx.arc(startX, startY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Anel decorativo concêntrico fino
  ctx.strokeStyle = isSat ? 'rgba(241, 196, 15, 0.25)' : 'rgba(116, 185, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(startX, startY, radius * 0.72, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Marcadores Cardeais de Bússola Rúnica (Giram sutilmente reagindo à direção)
  ctx.save();
  ctx.translate(startX, startY);
  const rotAngle = frameCount * 0.006 + (angle * 0.18);
  ctx.rotate(rotAngle);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.strokeStyle = isSat ? '#f1c40f' : 'rgba(0, 206, 201, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(radius - 5, 0);
    ctx.lineTo(radius + 3, 0);
    ctx.stroke();

    // Micro-pontos nos eixos principais
    if (i % 2 === 0) {
      ctx.fillStyle = isSat ? '#ffffff' : '#00cec9';
      ctx.beginPath();
      ctx.arc(radius + 5, 0, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // 5. Círculo da Zona Morta Interna (Orbe de Calmaria Etérea)
  const deadRadius = radius * 0.14 + idlePulse * 0.6;
  ctx.fillStyle = isSat ? 'rgba(241, 196, 15, 0.08)' : 'rgba(0, 206, 201, 0.08)';
  ctx.beginPath();
  ctx.arc(startX, startY, deadRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(startX, startY, deadRadius, 0, Math.PI * 2);
  ctx.stroke();

  // 6. Feixe de Plasma Direcional Cônico (Tapered Cone Beam)
  if (mag > 0.06 && dist > 3) {
    ctx.save();
    const nx = dx / dist;
    const ny = dy / dist;
    const perpX = -ny;
    const perpY = nx;

    const baseW = 7;
    const tipW = 2.2;

    const beamGrad = ctx.createLinearGradient(startX, startY, curX, curY);
    if (isSat) {
      beamGrad.addColorStop(0, 'rgba(241, 196, 15, 0.12)');
      beamGrad.addColorStop(1, 'rgba(255, 234, 167, 0.65)');
    } else {
      beamGrad.addColorStop(0, 'rgba(9, 132, 227, 0.08)');
      beamGrad.addColorStop(1, 'rgba(0, 206, 201, 0.60)');
    }

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(startX + perpX * baseW, startY + perpY * baseW);
    ctx.lineTo(curX + perpX * tipW, curY + perpY * tipW);
    ctx.lineTo(curX - perpX * tipW, curY - perpY * tipW);
    ctx.lineTo(startX - perpX * baseW, startY - perpY * baseW);
    ctx.closePath();
    ctx.fill();

    // Filamento central cristalino
    ctx.strokeStyle = isSat ? 'rgba(255, 255, 255, 0.85)' : 'rgba(129, 236, 236, 0.75)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(curX, curY);
    ctx.stroke();

    ctx.restore();
  }

  // 7. Knob do Polegar: Orbe Espectral com Halo Periférico Expandido
  const baseKnobR = isSat ? 22 : 19;

  // Halo Periférico (Visível além da polpa do polegar para leitura ergonômica)
  const haloR = baseKnobR + 10 + (isSat ? 4 : 0);
  const haloGrad = ctx.createRadialGradient(curX, curY, baseKnobR - 3, curX, curY, haloR);
  if (isSat) {
    haloGrad.addColorStop(0, 'rgba(241, 196, 15, 0.42)');
    haloGrad.addColorStop(1, 'rgba(241, 196, 15, 0)');
  } else {
    haloGrad.addColorStop(0, 'rgba(0, 206, 201, 0.35)');
    haloGrad.addColorStop(1, 'rgba(0, 206, 201, 0)');
  }
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(curX, curY, haloR, 0, Math.PI * 2);
  ctx.fill();

  // Esfera de Cristal Místico
  const sphereGrad = ctx.createRadialGradient(curX - 3, curY - 3, 2, curX, curY, baseKnobR);
  if (isSat) {
    sphereGrad.addColorStop(0, '#ffffff');
    sphereGrad.addColorStop(0.3, '#f1c40f');
    sphereGrad.addColorStop(0.7, '#d35400');
    sphereGrad.addColorStop(1, '#571800');
  } else {
    sphereGrad.addColorStop(0, '#ffffff');
    sphereGrad.addColorStop(0.3, '#74b9ff');
    sphereGrad.addColorStop(0.7, '#0984e3');
    sphereGrad.addColorStop(1, '#151e29');
  }

  ctx.fillStyle = sphereGrad;
  ctx.beginPath();
  ctx.arc(curX, curY, baseKnobR, 0, Math.PI * 2);
  ctx.fill();

  // Bisel de Prata Cósmica
  ctx.strokeStyle = isSat ? '#ffffff' : 'rgba(223, 230, 233, 0.85)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Indicador Chevron de Proa (Direção Ativa projetada à frente)
  if (mag > 0.12) {
    ctx.save();
    ctx.translate(curX, curY);
    ctx.rotate(angle);
    ctx.strokeStyle = isSat ? '#ffffff' : '#00cec9';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(baseKnobR - 3, -5);
    ctx.lineTo(baseKnobR + 4, 0);
    ctx.lineTo(baseKnobR - 3, 5);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * MODO DINÂMICO ("Selo Rúnico de Tensão")
 * Base fixa ritualística com 8 nós cardeais/intercardeais gravados na arena,
 * cordão elástico com deformação física real e brasão rúnico de rubi.
 */
function drawDynamicRunicMode(ctx, startX, startY, curX, curY, radius, dist, angle, mag, isSat, idlePulse, frameCount) {
  const dx = curX - startX;
  const dy = curY - startY;

  // 1. Selo Rúnico de Pedra & Sangue no Ponto de Âncora Fixo
  ctx.fillStyle = getBackgroundGradient(ctx, startX, startY, radius, true, isSat);
  ctx.beginPath();
  ctx.arc(startX, startY, radius + 6, 0, Math.PI * 2);
  ctx.fill();

  // 2. Anel de Contenção de Ouro Rúnico Chanfrado
  ctx.strokeStyle = isSat ? 'rgba(231, 76, 60, 0.95)' : 'rgba(241, 196, 15, 0.45)';
  ctx.lineWidth = isSat ? 2.6 : 2.0;
  ctx.beginPath();
  ctx.arc(startX, startY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Círculo concêntrico tracejado ritualístico
  ctx.strokeStyle = isSat ? 'rgba(255, 118, 117, 0.35)' : 'rgba(241, 196, 15, 0.22)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(startX, startY, radius * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Oito Nós Rúnicos Góticos (Nós Cardeais e Intercardeais de Tensão Arcana)
  ctx.save();
  ctx.translate(startX, startY);
  for (let i = 0; i < 8; i++) {
    const theta = (i * Math.PI) / 4;
    const nx = Math.cos(theta) * radius;
    const ny = Math.sin(theta) * radius;

    // Nó de ouro/sangue na borda da contenção
    ctx.fillStyle = isSat ? '#ff7675' : '#f1c40f';
    ctx.beginPath();
    ctx.arc(nx, ny, i % 2 === 0 ? 2.6 : 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Filamento de ancoragem em direção ao centro
    ctx.strokeStyle = isSat ? 'rgba(231, 76, 60, 0.22)' : 'rgba(241, 196, 15, 0.12)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(nx * 0.65, ny * 0.65);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Zona Morta: Núcleo Rúnico de Sangue Selado
  const deadRadius = radius * 0.14;
  ctx.fillStyle = 'rgba(231, 76, 60, 0.15)';
  ctx.beginPath();
  ctx.arc(startX, startY, deadRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isSat ? '#ff7675' : 'rgba(241, 196, 15, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 5. Cabo Elástico de Tensão (Deformação física: afina conforme a tração aumenta)
  if (mag > 0.06 && dist > 3) {
    ctx.save();
    const stretchRatio = Math.min(1.0, dist / radius);
    const tetherWidth = Math.max(1.4, 3.8 - stretchRatio * 2.2);

    const tetherGrad = ctx.createLinearGradient(startX, startY, curX, curY);
    if (isSat) {
      tetherGrad.addColorStop(0, '#f1c40f');
      tetherGrad.addColorStop(0.5, '#e74c3c');
      tetherGrad.addColorStop(1, '#ff7675');
    } else {
      tetherGrad.addColorStop(0, 'rgba(241, 196, 15, 0.3)');
      tetherGrad.addColorStop(0.5, 'rgba(230, 126, 34, 0.6)');
      tetherGrad.addColorStop(1, 'rgba(231, 76, 60, 0.85)');
    }

    ctx.strokeStyle = tetherGrad;
    ctx.lineWidth = tetherWidth;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(curX, curY);
    ctx.stroke();

    // 3 Nós luminosos ao longo do cabo elástico
    const nodes = 3;
    for (let n = 1; n <= nodes; n++) {
      const t = n / (nodes + 1);
      const px = startX + (curX - startX) * t;
      const py = startY + (curY - startY) * t;
      ctx.fillStyle = isSat ? '#ffeaa7' : '#f39c12';
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 6. Knob do Polegar: Brasão de Rubi Rúnico com Halo Vulcânico
  const baseKnobR = isSat ? 22 : 19;

  // Halo Periférico de Tensão
  const haloR = baseKnobR + 11 + (isSat ? 4 : 0);
  const haloGrad = ctx.createRadialGradient(curX, curY, baseKnobR - 3, curX, curY, haloR);
  if (isSat) {
    haloGrad.addColorStop(0, 'rgba(231, 76, 60, 0.52)');
    haloGrad.addColorStop(0.6, 'rgba(241, 196, 15, 0.22)');
    haloGrad.addColorStop(1, 'rgba(231, 76, 60, 0)');
  } else {
    haloGrad.addColorStop(0, 'rgba(230, 126, 34, 0.38)');
    haloGrad.addColorStop(1, 'rgba(230, 126, 34, 0)');
  }
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(curX, curY, haloR, 0, Math.PI * 2);
  ctx.fill();

  // Núcleo de Rubi Gótico Incandescente
  const rubyGrad = ctx.createRadialGradient(curX - 3, curY - 3, 2, curX, curY, baseKnobR);
  if (isSat) {
    rubyGrad.addColorStop(0, '#ffffff');
    rubyGrad.addColorStop(0.25, '#ff7675');
    rubyGrad.addColorStop(0.65, '#d63031');
    rubyGrad.addColorStop(1, '#2d0a0b');
  } else {
    rubyGrad.addColorStop(0, '#ffeaa7');
    rubyGrad.addColorStop(0.3, '#e67e22');
    rubyGrad.addColorStop(0.7, '#c0392b');
    rubyGrad.addColorStop(1, '#240a0c');
  }

  ctx.fillStyle = rubyGrad;
  ctx.beginPath();
  ctx.arc(curX, curY, baseKnobR, 0, Math.PI * 2);
  ctx.fill();

  // Borda Chanfrada em Ouro Envelhecido
  ctx.strokeStyle = isSat ? '#ff7675' : '#f1c40f';
  ctx.lineWidth = 1.9;
  ctx.stroke();

  // Ponta de Lança Rúnica Direcional
  if (mag > 0.12) {
    ctx.save();
    ctx.translate(curX, curY);
    ctx.rotate(angle);
    ctx.fillStyle = isSat ? '#ffffff' : '#f1c40f';
    ctx.beginPath();
    ctx.moveTo(baseKnobR + 5, 0);
    ctx.lineTo(baseKnobR - 3, -5);
    ctx.lineTo(baseKnobR - 1, 0);
    ctx.lineTo(baseKnobR - 3, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
