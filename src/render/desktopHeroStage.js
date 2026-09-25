/**
 * Cenário do altar no PC. A cantaria e o fundo são cacheados em resolução nativa;
 * apenas a névoa, os poucos grãos de luz e o halo usam o loop existente da prévia.
 */

let backdropCache = null;
let daisCache = null;

function cachedLayer(previous, key, width, height, dpr, draw) {
  if (previous?.key === key) return previous;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * dpr);
  canvas.height = Math.ceil(height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  draw(ctx);
  return { key, canvas };
}

function ellipse(c, x, y, rx, ry) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function glow(c, x, y, rx, ry, color, alpha) {
  c.save();
  c.translate(x, y);
  c.scale(rx, ry);
  const gradient = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'transparent');
  c.globalAlpha = alpha;
  c.fillStyle = gradient;
  c.fillRect(-1, -1, 2, 2);
  c.restore();
}

function drawBackdropStone(c, width, height, colors) {
  const cx = width / 2;
  const bg = c.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#04060b');
  bg.addColorStop(.5, '#0b101a');
  bg.addColorStop(1, '#05070c');
  c.fillStyle = bg;
  c.fillRect(0, 0, width, height);

  // Portais distantes: contornos quase perdidos na penumbra.
  for (let i = 2; i >= 0; i--) {
    const halfW = width * (.23 + i * .115);
    const springY = height * (.26 + i * .055);
    c.beginPath();
    c.moveTo(cx - halfW, height * .72);
    c.lineTo(cx - halfW, springY);
    c.bezierCurveTo(cx - halfW, springY * .55, cx - halfW * .22, height * .09, cx, height * .055);
    c.bezierCurveTo(cx + halfW * .22, height * .09, cx + halfW, springY * .55, cx + halfW, springY);
    c.lineTo(cx + halfW, height * .72);
    c.strokeStyle = '#121c2b';
    c.lineWidth = 9 - i * 2;
    c.stroke();
    c.strokeStyle = '#223043';
    c.globalAlpha = .26;
    c.lineWidth = 1;
    c.stroke();
    c.globalAlpha = 1;
  }

  glow(c, cx, height * .42, width * .62, height * .47, colors.primary, .085);
  glow(c, cx, height * .12, width * .20, height * .5, colors.primary, .055);

  // As bordas se fundem ao fundo global, sem moldura ao redor do cenário.
  const edge = c.createLinearGradient(0, 0, width, 0);
  edge.addColorStop(0, '#040508');
  edge.addColorStop(.16, '#04050800');
  edge.addColorStop(.84, '#04050800');
  edge.addColorStop(1, '#040508');
  c.fillStyle = edge;
  c.fillRect(0, 0, width, height);
}

export function drawDesktopStageBackground(c, width, height, colors, time, dpr) {
  const key = `${width}:${height}:${dpr}:${colors.primary}`;
  backdropCache = cachedLayer(backdropCache, key, width, height, dpr,
    ctx => drawBackdropStone(ctx, width, height, colors));
  c.drawImage(backdropCache.canvas, 0, 0, width, height);

  // Respiração de luz em ciclo lento, sem alterar o contraste do personagem.
  glow(c, width * .5, height * .39, width * .38, height * .34,
    colors.primary, .045 + Math.sin(time * .28) * .012);
  for (let i = 0; i < 14; i++) {
    const phase = i * 2.39996;
    const progress = (i / 14 + time * (.008 + (i % 3) * .0015)) % 1;
    const x = width * (.12 + ((i * .618034) % 1) * .76) + Math.sin(time * .19 + phase) * 12;
    const y = height * (.84 - progress * .7);
    const alpha = Math.sin(progress * Math.PI) * (.13 + (i % 4) * .04);
    glow(c, x, y, 4, 4, colors.primary, alpha * .35);
    c.globalAlpha = alpha;
    c.fillStyle = i % 3 === 0 ? '#cbd5df' : colors.primary;
    c.beginPath();
    c.arc(x, y, .7 + (i % 3) * .25, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
}

function frontFace(c, x, y, rx, ry, depth) {
  c.beginPath();
  c.ellipse(x, y + depth, rx, ry, 0, 0, Math.PI);
  c.ellipse(x, y, rx, ry, 0, Math.PI, 0, true);
  c.closePath();
}

function drawRune(c, x, y, size, variant) {
  c.beginPath();
  c.moveTo(x, y - size);
  c.lineTo(x - size * .6, y);
  c.lineTo(x, y + size);
  c.lineTo(x + size * .6, y);
  c.closePath();
  if (variant % 2 === 0) {
    c.moveTo(x, y - size * 1.4);
    c.lineTo(x, y + size * 1.4);
  } else {
    c.moveTo(x - size, y);
    c.lineTo(x + size, y);
  }
  c.stroke();
}

function drawStoneStair(c, x, y, rx, ry, depth, tier, colors) {
  // Face vertical: luz central, laterais frias e sombra sob a borda do degrau.
  frontFace(c, x, y, rx, ry, depth);
  const face = c.createLinearGradient(x - rx, 0, x + rx, 0);
  face.addColorStop(0, '#060910');
  face.addColorStop(.35, '#18202c');
  face.addColorStop(.65, '#131a25');
  face.addColorStop(1, '#05070d');
  c.fillStyle = face;
  c.fill();
  c.save();
  c.clip();
  glow(c, x - rx * .12, y + ry, rx * .8, depth * 2, colors.primary, .10 / (1 + tier * .18));

  const joints = 18;
  for (let j = 1; j < joints; j++) {
    const a = Math.PI * ((j + (tier % 2) * .5) / joints);
    const px = x + Math.cos(a) * rx;
    const py = y + Math.sin(a) * ry;
    c.strokeStyle = '#02040ae0';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(px, py + depth);
    c.stroke();
    c.strokeStyle = '#98abc21b';
    c.lineWidth = .7;
    c.beginPath();
    c.moveTo(px + 2, py + 2);
    c.lineTo(px + 2, py + depth - 2);
    c.stroke();

    if (j % 3 === 1 && Math.sin(a) > .45) {
      const runeX = x + Math.cos(a + .055) * rx;
      const runeY = y + Math.sin(a + .055) * ry + depth * .53;
      c.strokeStyle = `${colors.primary}52`;
      c.lineWidth = .8;
      drawRune(c, runeX, runeY, Math.min(3.5, depth * .23), j + tier);
    }
  }
  c.restore();

  // Laje superior de basalto, iluminada a partir do selo de invocação.
  ellipse(c, x, y, rx, ry);
  const top = c.createLinearGradient(x - rx * .6, y - ry, x + rx * .5, y + ry);
  top.addColorStop(0, '#202b39');
  top.addColorStop(.48, '#171f2b');
  top.addColorStop(1, '#0c111a');
  c.fillStyle = top;
  c.fill();
  c.save();
  c.clip();
  glow(c, x, y - ry * .2, rx * .95, ry * 1.8, colors.primary, .09 / (1 + tier * .2));

  // Assentamento radial, veios e lascas estáveis (sem ruído aleatório por frame).
  for (let j = 0; j < 28; j++) {
    const a = (j / 28) * Math.PI * 2 + (tier % 2) * .08;
    c.strokeStyle = '#02050b85';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * rx * .73, y + Math.sin(a) * ry * .73);
    c.lineTo(x + Math.cos(a + .005) * rx, y + Math.sin(a + .005) * ry);
    c.stroke();
    const seed = Math.sin(j * 73.13 + tier * 17.7);
    const px = x + Math.cos(a + .05) * rx * .94;
    const py = y + Math.sin(a + .05) * ry * .94;
    c.strokeStyle = seed > 0 ? '#8b9fb822' : '#02050b80';
    c.lineWidth = .65;
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(px + 6 + seed * 5, py + 1.5);
    c.lineTo(px + 10 + seed * 4, py + 1);
    c.stroke();
  }
  c.restore();

  // Chanfro duplo: reflexo frio na pedra e incrustação elemental fina.
  const rim = c.createLinearGradient(x - rx, y, x + rx, y);
  rim.addColorStop(0, '#74869d12');
  rim.addColorStop(.35, '#b8c7d352');
  rim.addColorStop(.7, '#697c9332');
  rim.addColorStop(1, '#45566d08');
  c.strokeStyle = rim;
  c.lineWidth = 1.5;
  ellipse(c, x, y, rx, ry);
  c.stroke();
  c.strokeStyle = `${colors.primary}${tier === 0 ? '78' : '32'}`;
  c.lineWidth = tier === 0 ? 1.5 : .8;
  ellipse(c, x, y, rx * .976, ry * .976);
  c.stroke();
  c.strokeStyle = '#020309bb';
  c.lineWidth = 2.5;
  c.beginPath();
  c.ellipse(x, y + depth, rx, ry, 0, .02, Math.PI - .02);
  c.stroke();
}

export function drawDesktopDais(c, width, height, x, y, rx, ry, colors, dpr) {
  const key = `${width}:${height}:${dpr}:${x}:${y}:${rx}:${ry}:${colors.primary}`;
  daisCache = cachedLayer(daisCache, key, width, height, dpr, ctx => {
    const remaining = Math.max(80, height - y - ry);
    const count = Math.max(5, Math.min(10, Math.ceil(remaining / 32)));
    // O último degrau ultrapassa o viewport para a pedra alcançar a borda da tela.
    const rise = (remaining + 28) / count;
    for (let i = count; i >= 0; i--) {
      const stepRx = rx * (1 + i * .17);
      const stepRy = ry + i * 3;
      const stepY = y + i * (rise - 3);
      drawStoneStair(ctx, x, stepY, stepRx, stepRy,
        i === 0 ? Math.min(22, rise * .62) : rise * .52, i, colors);
    }
    // Sombra periférica, mantendo a leitura do centro dos degraus.
    const shade = ctx.createLinearGradient(0, 0, width, 0);
    shade.addColorStop(0, '#020409aa');
    shade.addColorStop(.23, '#02040900');
    shade.addColorStop(.77, '#02040900');
    shade.addColorStop(1, '#020409aa');
    ctx.fillStyle = shade;
    ctx.fillRect(0, y - ry, width, height - y + ry);
  });
  c.drawImage(daisCache.canvas, 0, 0, width, height);
}

export function drawDesktopGroundMist(c, width, height, footY, colors, time) {
  // Volumes achatados, lentos e transparentes, que passam sobre os degraus.
  for (let i = 0; i < 6; i++) {
    const phase = i * 1.7;
    const x = width * (.13 + i * .145) + Math.sin(time * .12 + phase) * width * .10;
    const y = footY + (height - footY) * (.25 + (i % 3) * .23) + Math.cos(time * .17 + phase) * 7;
    glow(c, x, y, width * .38, 20 + i * 3, '#8093ad', .05);
    glow(c, x, y - 3, width * .25, 15 + i * 2, colors.primary, .025);
  }
}
