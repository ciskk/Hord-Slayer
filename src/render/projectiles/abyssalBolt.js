/** Visual compartilhado pelo Disparo Relativístico e pela Espiral dos Quatro Horizontes. */
export function drawAbyssalBolt(ctx, angle, radius = 5.5) {
  ctx.save();
  ctx.rotate(angle);
  const scale = radius / 5.5;
  ctx.scale(scale, scale);

  // Rastro de vácuo e plasma ciano.
  const grad = ctx.createLinearGradient(-16, 0, 8, 0);
  grad.addColorStop(0, 'rgba(142, 68, 173, 0)');
  grad.addColorStop(0.4, 'rgba(142, 68, 173, 0.55)');
  grad.addColorStop(0.8, 'rgba(0, 206, 201, 0.85)');
  grad.addColorStop(1, '#ffffff');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(4, -3.5);
  ctx.lineTo(10, 0);
  ctx.lineTo(4, 3.5);
  ctx.closePath();
  ctx.fill();

  // Núcleo incandescente.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(4, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
