/**
 * src/render/environment/biomeProps/cemetery.js
 * CENÁRIO DO CEMITÉRIO NOTURNO / INDUSTRIAL (Lápides ancestrais, cruzes de ferro, mausoléus).
 */
export function drawCemeteryProps(ctx, c, r, tileX, tileY, h, h2, h3) {
  if (c % 9 === 0 && r % 9 === 0) {
    const mx = tileX + 16;
    const my = tileY + 12;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(mx + 36, my + 64, 44, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1c2420';
    ctx.fillRect(mx, my, 72, 60);
    ctx.strokeStyle = '#2d3b34';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(mx, my, 72, 60);
    return;
  }

  if (h < 0.08) {
    const gx = tileX + 24 + (h2 * 36);
    const gy = tileY + 20 + (h3 * 28);
    ctx.fillStyle = '#202924';
    ctx.beginPath();
    ctx.arc(gx + 12, gy + 12, 12, Math.PI, 0);
    ctx.lineTo(gx + 24, gy + 34);
    ctx.lineTo(gx, gy + 34);
    ctx.closePath();
    ctx.fill();
  }
}
