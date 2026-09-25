// Efeitos de chão em coordenadas de mundo; silhuetas alinhadas à geometria de dano.
// Carga e impacto comunicados por luz e movimento, sem texto ou HUD.
const TAU = Math.PI * 2;

function annulus(ctx, inner, outer, start = 0, end = TAU) {
  ctx.beginPath();
  ctx.arc(0, 0, outer, start, end);
  ctx.arc(0, 0, inner, end, start, true);
  ctx.closePath();
}

function circle(ctx, r) {
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
}

function strokeLight(ctx, color, core, width, strength = 1) {
  // Halo em três traços, sem shadowBlur sobre regiões grandes da arena.
  ctx.save();
  const alpha = ctx.globalAlpha * strength;
  ctx.strokeStyle = color;
  ctx.lineWidth = width * 5;
  ctx.globalAlpha = alpha * 0.12;
  ctx.stroke();
  ctx.globalAlpha = alpha * 0.36;
  ctx.lineWidth = width * 2.2;
  ctx.stroke();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = core;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

function star(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.22, y - size * 0.22);
  ctx.lineTo(x + size * 0.65, y);
  ctx.lineTo(x + size * 0.22, y + size * 0.22);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.22, y + size * 0.22);
  ctx.lineTo(x - size * 0.65, y);
  ctx.lineTo(x - size * 0.22, y - size * 0.22);
  ctx.closePath();
  ctx.fill();
}

function radial(ctx, inner, outer, stops) {
  const g = ctx.createRadialGradient(0, 0, inner, 0, 0, outer);
  for (const [offset, color] of stops) g.addColorStop(offset, color);
  return g;
}

function drawEclipse(ctx, p, t, charge, flare) {
  const R = p.radius, inner = p.innerRadius;
  for (let sector = 0; sector < 3; sector++) {
    const start = p.angle + sector * TAU / 3;
    const end = start + Math.PI / 3;
    ctx.save();
    annulus(ctx, inner, R, start, end);
    ctx.fillStyle = radial(ctx, inner, R, [
      [0, `rgba(255,182,91,${0.14 + flare * 0.35})`],
      [0.25, 'rgba(64,12,87,0.28)'],
      [0.75, `rgba(145,40,180,${0.16 + charge * 0.16})`],
      [1, `rgba(245,127,65,${0.23 + flare * 0.35})`]
    ]);
    ctx.fill();
    strokeLight(ctx, '#b84de8', p.active ? '#fff3bf' : '#df91e9', p.active ? 2.5 : 1.3);
    ctx.clip();
    // Raios de uma coroa solar negra, recortados dentro do setor letal.
    for (let ray = 0; ray < 15; ray++) {
      const a = start + (ray + 0.5) / 15 * Math.PI / 3;
      const wave = 0.5 + 0.5 * Math.sin(ray * 2.7 + t * 0.07);
      const len = (R - inner) * (0.25 + wave * 0.62);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (R - 8), Math.sin(a) * (R - 8));
      ctx.lineTo(Math.cos(a + 0.012) * (R - len), Math.sin(a + 0.012) * (R - len));
      ctx.strokeStyle = `rgba(247,164,97,${0.12 + charge * 0.2 + flare * 0.3})`;
      ctx.lineWidth = ray % 3 === 0 ? 2.3 : 0.8;
      ctx.stroke();
    }
    for (let band = 0; band < 3; band++) {
      const r = inner + (R - inner) * ((band / 3 + t * 0.003) % 1);
      ctx.beginPath();
      ctx.arc(0, 0, r, start, end);
      ctx.strokeStyle = `rgba(233,141,255,${0.10 + flare * 0.16})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // Fragmentos da coroa suspensos na borda externa.
    for (let shard = 0; shard < 7; shard++) {
      const a = start + (shard + 0.5) / 7 * Math.PI / 3;
      const r = R - 18;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(r - 20 - charge * 9, 0);
      ctx.lineTo(r, -5);
      ctx.lineTo(r + 7, 0);
      ctx.lineTo(r, 5);
      ctx.closePath();
      ctx.fillStyle = '#25112e';
      ctx.fill();
      strokeLight(ctx, '#e79849', '#f4d3a0', 0.9, 0.7 + flare * 0.3);
      ctx.restore();
    }
    ctx.restore();
  }
}

function drawParallax(ctx, p, t, charge, flare) {
  ctx.save();
  ctx.rotate(p.angle);
  const R = p.radius, W = p.halfWidth;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(1, side);
    ctx.beginPath();
    ctx.rect(-R, W, R * 2, R - W);
    ctx.clip();
    const plane = ctx.createLinearGradient(0, W, 0, R);
    plane.addColorStop(0, `rgba(71,236,255,${0.15 + charge * 0.13 + flare * 0.25})`);
    plane.addColorStop(0.12, 'rgba(65,104,181,0.23)');
    plane.addColorStop(0.6, 'rgba(59,25,105,0.24)');
    plane.addColorStop(1, 'rgba(5,10,29,0.08)');
    ctx.fillStyle = plane;
    ctx.fillRect(-R, W, R * 2, R - W);
    // Placas de espaço refratado, com energia correndo para a fenda.
    for (let i = 0; i < 16; i++) {
      const x = -R + i * R / 7.5;
      const reach = 45 + (i * 47 % 170);
      ctx.beginPath();
      ctx.moveTo(x - 30, W + reach);
      ctx.lineTo(x + 17, W + reach * 0.50);
      ctx.lineTo(x - 9, W + 16);
      ctx.lineTo(x + 12, W);
      ctx.strokeStyle = `rgba(117,177,255,${0.14 + flare * 0.3})`;
      ctx.lineWidth = i % 3 === 0 ? 1.8 : 0.8;
      ctx.stroke();
      const u = (t * 0.022 + i * 0.317) % 1;
      star(ctx, x - 9 + u * 21, W + 12 + (1 - u) * reach, 2 + flare * 4, '#b5f7ff');
    }
    ctx.restore();
    // Borda exata da faixa segura; distorções permanecem no lado perigoso.
    ctx.beginPath();
    ctx.moveTo(-R, side * W);
    ctx.lineTo(R, side * W);
    strokeLight(ctx, '#377fea', '#bdfbff', 1.5 + flare * 2);
    ctx.beginPath();
    for (let j = 0; j <= 48; j++) {
      const x = -R + j * R / 24;
      const y = side * (W + 5 + Math.abs(Math.sin(j * 2.1 + t * 0.13)) * (3 + charge * 6));
      if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    strokeLight(ctx, '#5c5df0', '#7bd9ff', 0.8 + flare);
  }
  ctx.restore();
}

function drawHorizon(ctx, p, t, charge, flare) {
  const outward = p.step % 2 !== 0;
  const boundary = p.splitRadius;
  const low = outward ? 0 : boundary, high = outward ? boundary : p.radius;
  ctx.save();
  if (outward) circle(ctx, boundary); else annulus(ctx, boundary, p.radius);
  ctx.fillStyle = radial(ctx, 0, p.radius, [
    [0, 'rgba(7,2,20,0.30)'], [0.45, 'rgba(104,22,112,0.22)'],
    [0.6, `rgba(255,88,143,${0.2 + charge * 0.17 + flare * 0.2})`],
    [0.82, 'rgba(92,30,143,0.18)'], [1, 'rgba(32,7,73,0.20)']
  ]);
  ctx.fill();
  ctx.clip();
  // Correntes concêntricas indicam a direção da maré sem setas de interface.
  for (let band = 0; band < 5; band++) {
    const u = (band / 5 + t * 0.006) % 1;
    const r = Math.max(1, low + (high - low) * (outward ? u : 1 - u));
    circle(ctx, r);
    ctx.strokeStyle = `rgba(235,105,197,${Math.sin(u * Math.PI) * (0.18 + charge * 0.18 + flare * 0.3)})`;
    ctx.lineWidth = 1.2 + u * 3;
    ctx.stroke();
  }
  for (let i = 0; i < 32; i++) {
    const a = i * TAU / 32 + t * 0.004;
    const u = (i * 0.381 + t * 0.009) % 1;
    const r = low + (high - low) * (outward ? u : 1 - u);
    const tail = Math.max(low + 1, Math.min(high, r + (outward ? -15 : 15)));
    ctx.beginPath();
    ctx.moveTo(Math.cos(a - 0.02) * tail, Math.sin(a - 0.02) * tail);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.strokeStyle = 'rgba(255,177,204,0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    star(ctx, Math.cos(a) * r, Math.sin(a) * r, 1.5 + flare * 3, '#ffc1e4');
  }
  ctx.restore();
  circle(ctx, boundary);
  strokeLight(ctx, '#da387e', '#ffccdb', 1.8 + flare * 2);
  for (let i = 0; i < 8; i++) {
    const a = i * TAU / 8 - t * 0.003;
    ctx.beginPath();
    ctx.arc(0, 0, boundary + (outward ? -7 : 7), a, a + 0.40);
    ctx.strokeStyle = '#db92ed';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawConstellation(ctx, p, t, charge, flare) {
  // Filamentos ligam as memórias; o brilho destaca o próximo eco, sem números.
  ctx.save();
  ctx.strokeStyle = 'rgba(113,173,219,0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = p.step; i < p.marks.length; i++) {
    const m = p.marks[i];
    if (i === p.step) ctx.moveTo(m.x - p.x, m.y - p.y);
    else ctx.lineTo(m.x - p.x, m.y - p.y);
  }
  ctx.stroke();
  for (let i = p.marks.length - 1; i >= p.step; i--) {
    const m = p.marks[i];
    const next = !p.recording && i === p.step;
    const firing = next && p.active;
    const color = next ? '#cd61f5' : '#419fc2';
    const light = firing ? '#fff1dc' : next ? '#f0b6ff' : '#92d9ed';
    ctx.save();
    ctx.translate(m.x - p.x, m.y - p.y);
    ctx.globalAlpha *= next ? 1 : 0.52;
    circle(ctx, m.radius);
    ctx.fillStyle = radial(ctx, 0, m.radius, [
      [0, firing ? `rgba(255,228,245,${0.35 + flare * 0.45})` : 'rgba(4,7,25,0.65)'],
      [0.35, next ? 'rgba(128,47,179,0.32)' : 'rgba(25,55,84,0.30)'],
      [0.8, 'rgba(25,14,57,0.24)'], [1, next ? 'rgba(211,99,248,0.38)' : 'rgba(81,168,194,0.13)']
    ]);
    ctx.fill();
    strokeLight(ctx, color, light, firing ? 2.8 : 1.2);
    // Órbitas partidas e sigilo astral substituem os círculos de interface.
    for (let ring = 0; ring < 2; ring++) {
      const rotation = t * 0.012 * (ring ? -1 : 1) + i;
      for (let arc = 0; arc < 3; arc++) {
        const a = rotation + arc * TAU / 3;
        ctx.beginPath();
        ctx.arc(0, 0, m.radius * (ring ? 0.72 : 0.9), a, a + 1.25);
        ctx.strokeStyle = light;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
    ctx.beginPath();
    for (let vertex = 0; vertex <= 6; vertex++) {
      const a = vertex * TAU / 6 + t * 0.003;
      const r = m.radius * 0.52;
      if (!vertex) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.strokeStyle = next ? 'rgba(233,164,255,0.5)' : 'rgba(107,190,215,0.3)';
    ctx.stroke();
    star(ctx, 0, 0, firing ? 14 + flare * 14 : next ? 6 + charge * 6 : 4, light);
    for (let mote = 0; mote < 6; mote++) {
      const a = mote * TAU / 6 - t * 0.01;
      const r = m.radius * (firing ? 0.42 + (1 - flare) * 0.5 : 0.79);
      star(ctx, Math.cos(a) * r, Math.sin(a) * r, firing ? 4 : 2, light);
    }
    ctx.restore();
  }
  ctx.restore();
}

export function drawArenaPattern(ctx, boss) {
  const p = boss.arenaPattern;
  if (!p || boss.phaseCinematic || ['PHASE_TRANSITION', 'DEATH_COLLAPSE'].includes(boss.actionState)) return;
  const t = p.visualTime || 0;
  const charge = p.recording ? 0 : p.active ? 1 : Math.min(1, p.elapsed / p.warning);
  const flare = p.active ? Math.pow(Math.max(0, 1 - p.elapsed / p.activeDuration), 0.6) : 0;
  ctx.save();
  ctx.translate(p.x - boss.x, p.y - boss.y);
  circle(ctx, p.radius);
  ctx.clip();
  ctx.setLineDash([]);
  if (p.skill === 'ECLIPSE_SECTORS') drawEclipse(ctx, p, t, charge, flare);
  else if (p.skill === 'PARALLAX_CORRIDOR') drawParallax(ctx, p, t, charge, flare);
  else if (p.skill === 'HORIZON_PULSE') drawHorizon(ctx, p, t, charge, flare);
  else if (p.skill === 'MEMORY_CONSTELLATION') drawConstellation(ctx, p, t, charge, flare);
  ctx.restore();
}
