/**
 * src/render/entities/propsRenderer.js
 * 
 * Renderizador de objetos destrutíveis do cenário (barris, caixas).
 */
export function renderProps(ctx, props, bounds) {
  const { viewLeft, viewRight, viewTop, viewBottom } = bounds;
  for (let i = 0; i < props.length; i++) {
    const p = props[i];
    if (p.x < viewLeft || p.x > viewRight || p.y < viewTop || p.y > viewBottom) continue;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = p.hitFlash > 0 ? '#fff' : '#7f8c8d';
    ctx.fillRect(-7, -7, 14, 14);
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-7, -7, 14, 14);
    ctx.restore();
  }
}
