/**
 * src/render/environment/biomeProps/monolith.js
 * BOSS 2: CALDEIRA TECTÔNICA (Monólito Abissal)
 * Obelisco quebrado levitando, gêiseres de magma, fendas sísmicas e fragmentos de obsidiana.
 */
import { frameCount } from '../../../main.js';

export function drawMonolithProps(ctx, c, r, tileX, tileY, h, h2, h3) {
  // Monumento Macro: Obelisco Primordial Quebrado em Levitação
  if ((c + 3) % 9 === 0 && (r + 3) % 9 === 0) {
    const ox = tileX + 18;
    const oy = tileY + 16;
    const hover = Math.sin(frameCount * 0.08) * 3;

    // Sombra do monólito no solo vulcânico
    ctx.fillStyle = 'rgba(20, 15, 10, 0.42)';
    ctx.beginPath();
    ctx.ellipse(ox + 36, oy + 44, 46, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Base de basalto cravada na terra
    ctx.fillStyle = '#322d2a';
    ctx.beginPath();
    ctx.moveTo(ox + 12, oy + 42);
    ctx.lineTo(ox + 26, oy + 16);
    ctx.lineTo(ox + 46, oy + 16);
    ctx.lineTo(ox + 60, oy + 42);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Topo quebrado levitando sobre a base
    ctx.save();
    ctx.translate(0, hover);
    ctx.fillStyle = '#453f3a';
    ctx.beginPath();
    ctx.moveTo(ox + 22, oy + 10);
    ctx.lineTo(ox + 36, oy - 20);
    ctx.lineTo(ox + 50, oy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Glifo de fogo no núcleo
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(ox + 36, oy + 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Fenda com magma sob a rocha
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(ox + 24, oy + 38, 24, 4);
    return;
  }

  // Props Secundários: Gêiseres de Fumaça e Lava
  if (h < 0.09) {
    const gx = tileX + 28 + (h2 * 32);
    const gy = tileY + 24 + (h3 * 30);
    const pulse = Math.sin(frameCount * 0.16 + gx) * 1.8;

    // Cratera cônica de rocha
    ctx.fillStyle = '#282320';
    ctx.beginPath();
    ctx.ellipse(gx + 4, gy + 8, 15, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d35400';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Miolo de lava crepitante
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(gx + 4, gy + 7, Math.max(1, 3.5 + pulse), 0, Math.PI * 2);
    ctx.fill();

    // Pequena fagulha subindo
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.arc(gx + 4, gy - 2 - (pulse * 2), 1.5, 0, Math.PI * 2);
    ctx.fill();

  } else if (h >= 0.09 && h < 0.18) {
    // Fragmentos de Obsidiana Pontiaguda
    const kx = tileX + 30 + (h2 * 28);
    const ky = tileY + 22 + (h3 * 28);

    ctx.fillStyle = 'rgba(20, 10, 5, 0.35)';
    ctx.beginPath();
    ctx.ellipse(kx + 4, ky + 16, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lâmina de obsidiana negra
    ctx.fillStyle = '#1c1816';
    ctx.beginPath();
    ctx.moveTo(kx, ky + 14);
    ctx.lineTo(kx + 5, ky - 8);
    ctx.lineTo(kx + 9, ky + 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 1;
    ctx.stroke();

  } else if (h >= 0.18 && h < 0.34) {
    // Fissuras Tectônicas Sísmicas com Magma
    const fx = tileX + 22 + (h2 * 46);
    const fy = tileY + 22 + (h3 * 46);

    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + 10, fy + 8);
    ctx.lineTo(fx + 22, fy + 4);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(fx + 2, fy + 1);
    ctx.lineTo(fx + 10, fy + 8);
    ctx.lineTo(fx + 20, fy + 4);
    ctx.stroke();
  }
}
