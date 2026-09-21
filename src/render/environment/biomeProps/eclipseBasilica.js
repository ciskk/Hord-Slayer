/**
 * src/render/environment/biomeProps/eclipseBasilica.js
 * ARENA 3: BASÍLICA DO ECLIPSE (Rosácea monumental, vitrais estilhaçados, runas de prata líquida).
 */
import { frameCount } from '../../../main.js';

export function drawEclipseBasilicaProps(ctx, c, r, tileX, tileY, h, h2, h3) {
  // Monumento Macro: Rosácea Gótica Monumental Desmoronada
  if ((c + 2) % 9 === 0 && (r + 6) % 9 === 0) {
    const rx = tileX + 16;
    const ry = tileY + 16;

    ctx.fillStyle = 'rgba(20, 30, 45, 0.3)';
    ctx.beginPath();
    ctx.ellipse(rx + 36, ry + 36, 44, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#748796';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(rx + 36, ry + 32, 28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(rx + 36, ry + 32, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#dfe6e9';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    const shards = [
      { x: rx + 24, y: ry + 22, col: '#e74c3c' },
      { x: rx + 48, y: ry + 20, col: '#0984e3' },
      { x: rx + 22, y: ry + 40, col: '#f1c40f' },
      { x: rx + 46, y: ry + 44, col: '#2ecc71' }
    ];
    shards.forEach(sh => {
      ctx.fillStyle = sh.col;
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(sh.x + 6, sh.y + 2);
      ctx.lineTo(sh.x + 3, sh.y + 7);
      ctx.closePath();
      ctx.fill();
    });
    return;
  }

  // Props Secundários: Cacos de Vitrais Sacros Refletindo Luz do Eclipse
  if (h < 0.09) {
    const vx = tileX + 26 + (h2 * 35);
    const vy = tileY + 24 + (h3 * 30);

    ctx.fillStyle = '#0984e3';
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx + 9, vy + 4);
    ctx.lineTo(vx + 4, vy + 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(vx + 11, vy + 3);
    ctx.lineTo(vx + 18, vy + 7);
    ctx.lineTo(vx + 14, vy + 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.moveTo(vx + 3, vy + 14);
    ctx.lineTo(vx + 8, vy + 18);
    ctx.lineTo(vx + 1, vy + 19);
    ctx.closePath();
    ctx.fill();

    const glint = Math.sin(frameCount * 0.15 + vx) > 0.7;
    if (glint) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(vx + 5, vy + 3, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (h >= 0.09 && h < 0.17) {
    const mx = tileX + 30 + (h2 * 28);
    const my = tileY + 22 + (h3 * 28);

    ctx.fillStyle = 'rgba(20, 30, 40, 0.28)';
    ctx.fillRect(mx - 8, my - 6, 16, 22);

    ctx.fillStyle = '#d5e2ea';
    ctx.fillRect(mx - 7, my - 5, 14, 20);
    ctx.strokeStyle = '#546574';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(mx - 7, my - 5, 14, 20);

    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx - 3, my);
    ctx.lineTo(mx + 4, my + 6);
    ctx.lineTo(mx - 5, my + 10);
    ctx.moveTo(mx + 4, my + 6);
    ctx.lineTo(mx + 6, my + 14);
    ctx.stroke();

  } else if (h >= 0.17 && h < 0.32) {
    const ax = tileX + 24 + (h2 * 45);
    const ay = tileY + 24 + (h3 * 45);

    ctx.strokeStyle = 'rgba(116, 185, 255, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(ax + 10, ay + 10, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ax + 10, ay + 10, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#dfe6e9';
    ctx.fillRect(ax + 8.5, ay + 6, 3, 8);
    ctx.fillRect(ax + 6, ay + 8.5, 8, 3);
  }
}
