/** Clear silhouettes with the game's saturated, sharp-edged gothic finish. */
export const INK = '#0c101a';

export function beginCreature(ctx, e) {
  ctx.save();
  const radius = Number.isFinite(e.radius) && e.radius > 0 ? e.radius : 12;
  ctx.scale(radius, radius);
  ctx.lineJoin = 'miter';
  ctx.lineCap = 'butt';
  ctx.miterLimit = 3;
}

export function endCreature(ctx) { ctx.restore(); }

export function creaturePalette(e, body, shade, accent) {
  if (e.hitFlash > 0) return { body: '#ffffff', shade: '#c8e5ff', accent: '#ffffff', ink: INK, bone: '#ffffff' };
  return { body, shade, accent, ink: INK, bone: '#edf1fa' };
}

export function polygon(ctx, points, fill, outline = INK, width = 0.075) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (outline && width > 0) { ctx.strokeStyle = outline; ctx.lineWidth = width; ctx.stroke(); }
}

export function ellipse(ctx, x, y, rx, ry, fill, outline = INK, width = 0.075) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.001, rx), Math.max(0.001, ry), 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (outline && width > 0) { ctx.strokeStyle = outline; ctx.lineWidth = width; ctx.stroke(); }
}

/** Cut planes for armor, chitin and bone; round objects still use ellipse. */
export function facet(ctx, x, y, rx, ry, fill, outline = INK, width = 0.075) {
  polygon(ctx, [
    [x - rx * 0.55, y - ry], [x + rx * 0.45, y - ry],
    [x + rx, y - ry * 0.4], [x + rx, y + ry * 0.45],
    [x + rx * 0.45, y + ry], [x - rx * 0.55, y + ry],
    [x - rx, y + ry * 0.4], [x - rx, y - ry * 0.45]
  ], fill, outline, width);
}

export function stroke(ctx, points, color, width = 0.075) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

// Build normalized detail recipes once. Palette entries remain symbolic so hit
// flashes and slows use the live colors without allocating transformed points.
function buildMaterialDetails(material) {
  const details = [];
  const p = { bone: 'bone', shade: 'shade' };
  const line = (coords, color, weight) => details.push({ coords, color, weight });
  const patch = (coords, color) => details.push({ coords, color, weight: 0 });
  if (material === 'stone') {
    line([[.23,.12],[.32,.3],[.25,.46],[.41,.64]], p.shade, .032);
    line([[.31,.3],[.53,.25],[.6,.36]], p.shade, .025);
    line([[.73,.6],[.61,.72],[.66,.9]], p.shade, .035);
    for (let i = 0; i < 7; i++) {
      const x = .13 + (i * .237) % .74, y = .14 + (i * .319) % .7;
      patch([[x,y],[x+.035,y-.026],[x+.065,y+.014],[x+.016,y+.045]], i % 2 ? p.bone : p.shade);
    }
  } else if (material === 'metal' || material === 'rust') {
    line([[.12,.25],[.18,.75],[.76,.78]], p.shade, .035);
    line([[.15,.24],[.21,.72],[.75,.74]], p.bone, .018);
    for (const [x,y] of [[.23,.3],[.25,.65],[.71,.66]]) {
      details.push({ x, y, rivet: true });
    }
    line([[.51,.35],[.63,.27]], p.bone, .025);
    line([[.53,.4],[.67,.32]], p.bone, .016);
    if (material === 'rust') {
      patch([[.37,.46],[.54,.44],[.6,.6],[.49,.66],[.36,.59]], p.shade);
      patch([[.63,.12],[.76,.18],[.7,.3],[.59,.25]], p.shade);
      line([[.44,.56],[.47,.73]], p.shade, .025);
    }
  } else if (material === 'cloth') {
    for (let i = 0; i < 3; i++) {
      const x = .24 + i * .23;
      patch([[x,.2],[x+.08,.73],[x-.08,.94],[x-.035,.57]], p.shade);
      line([[x+.025,.23],[x+.1,.73]], p.bone, .017);
    }
    line([[.14,.81],[.42,.87],[.75,.8]], p.shade, .025);
  } else if (material === 'wood') {
    for (let i = 0; i < 3; i++) {
      const x = .2 + i * .3;
      line([[x,0],[x-.02,.4],[x+.025,.7],[x,1]], p.shade, .035);
      line([[x+.09,.1],[x+.07,.35],[x+.13,.54],[x+.1,.9]], p.bone, .02);
    }
    line([[.51,.48],[.46,.57],[.5,.68],[.54,.57],[.51,.48]], p.shade, .025);
  } else if (material === 'chitin') {
    for (let i = 0; i < 3; i++) {
      const y = .24 + i * .24;
      line([[.12,y],[.46,y+.11],[.85,y-.015]], p.shade, .045);
      line([[.14,y-.035],[.46,y+.075],[.83,y-.05]], p.bone, .02);
    }
  } else if (material === 'flesh') {
    line([[.24,.27],[.4,.39],[.33,.56]], p.shade, .04);
    line([[.62,.4],[.55,.63],[.66,.72]], p.shade, .032);
    for (let i = 0; i < 3; i++) {
      const y = .36 + i * .09;
      line([[.3,y],[.4,y+.03]], p.bone, .022);
    }
    patch([[.66,.18],[.8,.27],[.7,.34],[.62,.27]], p.shade);
  }
  return details;
}

const MATERIAL_BEVELS = [
  { coords: [[0,0],[1,0],[.76,.16],[.18,.22],[0,.65]], color: 'bone', weight: 0 },
  { coords: [[.77,.12],[1,0],[1,1],[0,1],[.17,.82],[.75,.8]], color: 'shade', weight: 0 }
];
const MATERIAL_DETAILS = new Map();
for (const material of ['stone', 'metal', 'rust', 'cloth', 'wood', 'chitin', 'flesh']) {
  MATERIAL_DETAILS.set(material, buildMaterialDetails(material));
}

function drawMaterialDetail(ctx, detail, p, left, top, w, h) {
  if (detail.rivet) {
    const px = left + detail.x * w, py = top + detail.y * h;
    ellipse(ctx, px, py, .038, .038, p.ink, null);
    // Rivet highlights use absolute offsets, independent of the polygon size.
    ctx.beginPath();
    ctx.moveTo(px - .014, py - .011);
    ctx.lineTo(px + .013, py - .011);
    ctx.strokeStyle = p.bone;
    ctx.lineWidth = .02;
    ctx.stroke();
    return;
  }

  const coords = detail.coords;
  ctx.beginPath();
  ctx.moveTo(left + coords[0][0] * w, top + coords[0][1] * h);
  for (let i = 1; i < coords.length; i++) {
    ctx.lineTo(left + coords[i][0] * w, top + coords[i][1] * h);
  }
  if (detail.weight > 0) {
    ctx.strokeStyle = p[detail.color];
    ctx.lineWidth = detail.weight;
    ctx.stroke();
  } else {
    ctx.closePath();
    if (p[detail.color]) {
      ctx.fillStyle = p[detail.color];
      ctx.fill();
    }
  }
}

/** Material detail stays inside the existing silhouette, with no per-frame noise.
 * Reuse normalized recipes and emit the original Canvas commands directly;
 * no temporary arrays, point objects or closures are created per polygon.
 */
export function materialPolygon(ctx, points, p, material, outline = INK, width = .075) {
  polygon(ctx, points, p.body, outline, width);
  ctx.save();
  ctx.clip();
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  for (let i = 0; i < points.length; i++) {
    const x = points[i][0], y = points[i][1];
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  }
  const w = Math.max(.01, right - left), h = Math.max(.01, bottom - top);
  // Preserve clipping, opacity and draw order, including the second base path.
  ctx.globalAlpha *= .3;
  for (let i = 0; i < MATERIAL_BEVELS.length; i++) {
    drawMaterialDetail(ctx, MATERIAL_BEVELS[i], p, left, top, w, h);
  }
  ctx.restore();
  ctx.save();
  polygon(ctx, points, null, null); ctx.clip();
  ctx.globalAlpha *= .55;
  const details = MATERIAL_DETAILS.get(material);
  if (details) {
    for (let i = 0; i < details.length; i++) {
      drawMaterialDetail(ctx, details[i], p, left, top, w, h);
    }
  }
  ctx.restore();
}

/** Keep the redesigned body recognizable throughout the existing death timeline. */
export function drawCreatureDeath(ctx, de, progress, draw, kind = 'fall') {
  const t = Math.max(0, Math.min(1, progress));
  const collapse = Math.max(0, Math.min(1, (t - 0.14) / 0.64));
  const radius = de.radius || 12;
  ctx.save();
  // Global death dispatcher owns residue, lifetime and final fade.
  if (kind === 'dissolve') {
    ctx.translate(0, -radius * collapse * 0.35);
    ctx.scale(1 - collapse * 0.25, 1 + collapse * 0.12);
    ctx.globalAlpha *= 1 - collapse * 0.7;
  } else if (kind === 'burst') {
    ctx.translate(0, radius * collapse * 0.48);
    ctx.scale(1 + Math.sin(t * Math.PI) * 0.16, Math.max(0.15, 1 - collapse * 0.82));
  } else if (kind === 'crumble') {
    ctx.translate(0, radius * collapse * 0.65);
    ctx.scale(1 + collapse * 0.15, Math.max(0.16, 1 - collapse * 0.78));
  } else {
    ctx.translate(-radius * Math.sin(t * Math.PI) * 0.12, radius * collapse * 0.42);
    ctx.rotate(-collapse * 1.25);
    ctx.scale(1, 1 - collapse * 0.2);
  }
  draw({ ...de, deathPose: t, hitFlash: t < 0.1 ? 1 : 0, slowTimer: 0,
    combatState: 'DEAD', actionState: 'DEAD', isCharging: false, isFlamethrowing: false,
    isFiring: false, summonTimer: 0, shootTimer: 0, sniperCharge: 0, castProgress: 0 });
  ctx.restore();
}
