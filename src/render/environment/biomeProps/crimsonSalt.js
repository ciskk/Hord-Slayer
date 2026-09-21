/**
 * src/render/environment/biomeProps/crimsonSalt.js
 * ARENA 2: DESERTO DE SAL CARMESIM (Arcadas de leviatã, cristais prismáticos e fendas arteriais).
 */
import { frameCount } from '../../../main.js';

export function drawCrimsonSaltProps(ctx, c, r, tileX, tileY, h, h2, h3) {
  // Monumento Macro: Arcada Costal de Leviatã Fossilizado
  if ((c + 4) % 9 === 0 && (r + 4) % 9 === 0) {
    const lx = tileX + 20;
    const ly = tileY + 18;

    ctx.fillStyle = 'rgba(30, 45, 60, 0.18)';
    ctx.beginPath();
    ctx.ellipse(lx + 32, ly + 42, 48, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(lx - 4, ly + 26, 68, 8);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(lx - 4, ly + 26, 68, 8);

    const ribOffsets = [4, 18, 34, 50];
    ribOffsets.forEach(ro => {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(lx + ro, ly + 26);
      ctx.quadraticCurveTo(lx + ro + 10, ly - 22, lx + ro + 20, ly + 26);
      ctx.stroke();

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(lx + ro, ly + 26);
      ctx.quadraticCurveTo(lx + ro + 10, ly - 22, lx + ro + 20, ly + 26);
      ctx.stroke();
    });
    return;
  }

  // Props Secundários: Cristais de Sal Gema Prismáticos
  if (h < 0.09) {
    const kx = tileX + 28 + (h2 * 32);
    const ky = tileY + 24 + (h3 * 30);

    ctx.fillStyle = 'rgba(25, 40, 55, 0.16)';
    ctx.beginPath();
    ctx.ellipse(kx + 4, ky + 18, 14, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(kx, ky + 16);
    ctx.lineTo(kx + 4, ky - 6);
    ctx.lineTo(kx + 9, ky + 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 184, 184, 0.55)';
    ctx.beginPath();
    ctx.moveTo(kx + 4, ky - 6);
    ctx.lineTo(kx + 9, ky + 16);
    ctx.lineTo(kx + 4, ky + 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(kx + 7, ky + 16);
    ctx.lineTo(kx + 14, ky + 2);
    ctx.lineTo(kx + 16, ky + 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

  } else if (h >= 0.09 && h < 0.18) {
    // Fenda Arterial de Sangue Borbulhante no Sal
    const fx = tileX + 30 + (h2 * 28);
    const fy = tileY + 28 + (h3 * 24);
    const pulse = Math.sin(frameCount * 0.14 + h * 10) * 1.5;

    ctx.fillStyle = '#800000';
    ctx.beginPath();
    ctx.ellipse(fx, fy, 16, 8, h * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = '#d63031';
    ctx.beginPath();
    ctx.arc(fx + 2, fy - 1, Math.max(1, 2.5 + pulse), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(fx + 1.2, fy - 2, 0.9, 0, Math.PI * 2);
    ctx.fill();

  } else if (h >= 0.18 && h < 0.35) {
    const px = tileX + 22 + (h2 * 46);
    const py = tileY + 20 + (h3 * 46);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + 12, py + 6);
    ctx.lineTo(px + 20, py - 4);
    ctx.moveTo(px + 12, py + 6);
    ctx.lineTo(px + 10, py + 18);
    ctx.stroke();
  }
}
