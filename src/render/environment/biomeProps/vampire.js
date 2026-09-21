/**
 * src/render/environment/biomeProps/vampire.js
 * BOSS 1: SALÃO CARMESIM (Lorde Vampírico)
 * Trono de veludo vermelho caído, sarcófagos imperiais de ônix, espelhos profanados e cálices de sangue.
 */
import { frameCount } from '../../../main.js';

export function drawVampireProps(ctx, c, r, tileX, tileY, h, h2, h3) {
  // Monumento Macro: Trono Caído & Sarcófago Imperial Aberto
  if (c % 9 === 0 && r % 9 === 0) {
    const vx = tileX + 16;
    const vy = tileY + 14;

    // Sombra no mármore carmesim
    ctx.fillStyle = 'rgba(25, 4, 8, 0.38)';
    ctx.beginPath();
    ctx.ellipse(vx + 38, vy + 40, 48, 18, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Sarcófago de ônix aberto tombado
    ctx.fillStyle = '#1c070c';
    ctx.fillRect(vx + 2, vy + 20, 52, 22);
    ctx.strokeStyle = '#b38f4d';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(vx + 2, vy + 20, 52, 22);

    // Forro interno acolchoado de veludo vermelho
    ctx.fillStyle = '#780f22';
    ctx.fillRect(vx + 6, vy + 23, 44, 16);

    // Encosto do Trono gótico em asa de morcego
    ctx.fillStyle = '#300812';
    ctx.beginPath();
    ctx.moveTo(vx + 36, vy + 20);
    ctx.lineTo(vx + 24, vy - 12);
    ctx.lineTo(vx + 38, vy - 4);
    ctx.lineTo(vx + 52, vy - 12);
    ctx.lineTo(vx + 44, vy + 20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b38f4d';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Cálices de ouro caídos derramando sangue
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(vx + 60, vy + 32, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9e1b32';
    ctx.beginPath();
    ctx.ellipse(vx + 66, vy + 34, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // Props Secundários: Espelhos de Ouro Profanados (sem reflexo)
  if (h < 0.08) {
    const mx = tileX + 26 + (h2 * 32);
    const my = tileY + 22 + (h3 * 28);

    ctx.fillStyle = 'rgba(25, 4, 8, 0.28)';
    ctx.fillRect(mx - 8, my - 6, 18, 26);

    // Moldura barroca de ouro
    ctx.fillStyle = '#b38f4d';
    ctx.fillRect(mx - 9, my - 7, 20, 28);
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(mx - 9, my - 7, 20, 28);

    // Vidro espelhado vazio translúcido
    ctx.fillStyle = 'rgba(220, 230, 240, 0.45)';
    ctx.fillRect(mx - 6, my - 4, 14, 22);

    // Mancha e escorrido de sangue fresco
    ctx.fillStyle = '#9e1b32';
    ctx.beginPath();
    ctx.moveTo(mx - 3, my - 4);
    ctx.lineTo(mx + 3, my + 4);
    ctx.lineTo(mx + 5, my + 14);
    ctx.lineTo(mx + 2, my + 14);
    ctx.lineTo(mx - 1, my);
    ctx.closePath();
    ctx.fill();

  } else if (h >= 0.08 && h < 0.17) {
    // Castiçal Duplo de Bronze com Velas Negras e Chamas Carmesins
    const cx = tileX + 32 + (h2 * 28);
    const cy = tileY + 22 + (h3 * 28);
    const flick = Math.sin(frameCount * 0.2 + cx) * 1.5;

    ctx.fillStyle = 'rgba(25, 4, 8, 0.25)';
    ctx.beginPath();
    ctx.ellipse(cx + 6, cy + 26, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Suporte de bronze
    ctx.fillStyle = '#7a602f';
    ctx.fillRect(cx + 4, cy + 12, 4, 14);
    ctx.fillRect(cx - 2, cy + 10, 16, 3);

    // 2 Velas Negras
    [-2, 10].forEach(ox => {
      ctx.fillStyle = '#1c0d12';
      ctx.fillRect(cx + ox, cy + 2, 4, 9);

      // Cera vermelha escorrendo
      ctx.fillStyle = '#9e1b32';
      ctx.fillRect(cx + ox + 1, cy + 6, 2, 5);

      // Chama cor de sangue
      ctx.fillStyle = 'rgba(255, 71, 87, 0.3)';
      ctx.beginPath();
      ctx.arc(cx + ox + 2, cy - 1, 6 + flick, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.arc(cx + ox + 2, cy - 1, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx + ox + 2, cy - 2, 1, 0, Math.PI * 2);
      ctx.fill();
    });

  } else if (h >= 0.17 && h < 0.32) {
    // Selo Heráldico Vampírico no Mármore
    const sx = tileX + 24 + (h2 * 44);
    const sy = tileY + 22 + (h3 * 44);

    ctx.strokeStyle = '#b38f4d';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(sx + 10, sy + 10, 13, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#9e1b32';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sx + 10, sy - 1);
    ctx.lineTo(sx + 10, sy + 21);
    ctx.moveTo(sx + 2, sy + 6);
    ctx.lineTo(sx + 18, sy + 6);
    ctx.stroke();
  }
}
