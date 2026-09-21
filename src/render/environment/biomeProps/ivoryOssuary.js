/**
 * src/render/environment/biomeProps/ivoryOssuary.js
 * ARENA 1: OSSÁRIO DE MARFIM (Candelabros góticos tombados, mosaicos de crânios, anjos decapitados).
 */
import { frameCount } from '../../../main.js';

const CANDLE_OFFSETS = [
  { dx: 10, dy: 18 },
  { dx: 24, dy: 14 },
  { dx: 48, dy: 20 },
  { dx: 62, dy: 32 },
  { dx: 46, dy: 42 },
  { dx: 24, dy: 44 }
];

export function drawIvoryOssuaryProps(ctx, c, r, tileX, tileY, h, h2, h3) {
  // Monumento Macro: Grande Candelabro Gótico de Ferro Negro Tombado
  if (c % 9 === 0 && r % 9 === 0) {
    const mx = tileX + 18;
    const my = tileY + 16;

    // Sombra translúcida no mármore claro
    ctx.fillStyle = 'rgba(40, 35, 30, 0.24)';
    ctx.beginPath();
    ctx.ellipse(mx + 36, my + 34, 46, 20, -0.18, 0, Math.PI * 2);
    ctx.fill();

    // Aro de ferro forjado negro
    ctx.strokeStyle = '#252024';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(mx + 36, my + 30, 38, 16, -0.18, 0, Math.PI * 2);
    ctx.stroke();

    // Raio central e correntes caídas
    ctx.strokeStyle = '#383236';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx + 8, my + 22);
    ctx.lineTo(mx + 64, my + 38);
    ctx.moveTo(mx + 22, my + 44);
    ctx.lineTo(mx + 50, my + 16);
    ctx.stroke();

    // 6 Velas de cera pálida acesas com chamas âmbar
    for (let idx = 0; idx < CANDLE_OFFSETS.length; idx++) {
      const cd = CANDLE_OFFSETS[idx];
      const cx = mx + cd.dx;
      const cy = my + cd.dy;
      const flicker = Math.sin(frameCount * 0.2 + idx * 1.5) * 1.4;
      ctx.fillStyle = '#ded8cb';
      ctx.fillRect(cx - 1.5, cy - 7, 3, 7);

      ctx.fillStyle = 'rgba(243, 156, 18, 0.22)';
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 8 + flicker, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(cx, cy - 9, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  // Props Secundários: Mosaico Ritual de Crânios no Piso
  if (h < 0.08) {
    const gx = tileX + 26 + (h2 * 34);
    const gy = tileY + 22 + (h3 * 28);

    ctx.strokeStyle = '#5a131e';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(gx + 12, gy + 12, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ece6d8';
    ctx.beginPath();
    ctx.arc(gx + 12, gy + 12, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a7d6d';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#2b2426';
    ctx.fillRect(gx + 9, gy + 10, 2.2, 2.5);
    ctx.fillRect(gx + 13, gy + 10, 2.2, 2.5);
    ctx.fillRect(gx + 11, gy + 14, 2, 2);

    const vx = gx + 22;
    const vy = gy + 4;
    const flick = Math.sin(frameCount * 0.18 + gx) * 1.2;
    ctx.fillStyle = '#ded8cb';
    ctx.fillRect(vx - 1, vy - 6, 2.5, 6);
    ctx.fillStyle = 'rgba(243, 156, 18, 0.28)';
    ctx.beginPath();
    ctx.arc(vx, vy - 8, 6 + flick, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(vx, vy - 8, 1.8, 0, Math.PI * 2);
    ctx.fill();

  } else if (h >= 0.08 && h < 0.16) {
    // Estátua Sacra Decapitada de Anjo em Mármore
    const sx = tileX + 32 + (h2 * 28);
    const sy = tileY + 20 + (h3 * 26);

    ctx.fillStyle = 'rgba(40, 35, 30, 0.25)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 30, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cdc5b4';
    ctx.fillRect(sx - 10, sy + 18, 20, 12);
    ctx.strokeStyle = '#9c907f';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(sx - 10, sy + 18, 20, 12);

    ctx.fillStyle = '#e8e2d4';
    ctx.beginPath();
    ctx.moveTo(sx - 7, sy + 18);
    ctx.lineTo(sx - 5, sy + 4);
    ctx.lineTo(sx + 5, sy + 4);
    ctx.lineTo(sx + 7, sy + 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#dcd5c4';
    ctx.beginPath();
    ctx.moveTo(sx - 5, sy + 6);
    ctx.lineTo(sx - 14, sy - 2);
    ctx.lineTo(sx - 6, sy + 12);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(sx + 5, sy + 6);
    ctx.lineTo(sx + 14, sy - 2);
    ctx.lineTo(sx + 6, sy + 12);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#241b1e';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sx - 1, sy + 4);
    ctx.lineTo(sx - 1, sy + 16);
    ctx.stroke();

  } else if (h >= 0.16 && h < 0.32) {
    // Inscrição Sacrílega Entalhada na Pedra & Cinzas Sagradas
    const rx = tileX + 24 + (h2 * 45);
    const ry = tileY + 24 + (h3 * 45);

    ctx.strokeStyle = '#bfa87a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 14, ry + 14);
    ctx.moveTo(rx + 14, ry);
    ctx.lineTo(rx, ry + 14);
    ctx.stroke();

    ctx.fillStyle = 'rgba(120, 110, 95, 0.18)';
    ctx.beginPath();
    ctx.ellipse(rx + 7, ry + 7, 18, 9, h, 0, Math.PI * 2);
    ctx.fill();
  }
}
