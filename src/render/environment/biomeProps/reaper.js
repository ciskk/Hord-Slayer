/**
 * src/render/environment/biomeProps/reaper.js
 * BOSS 3: NECRÓPOLE ESPECTRAL (Ceifador Supremo)
 * Portal de correntes espectrais, lanternas fúnebres de alma, gelo com mãos fantasmagóricas.
 */
import { frameCount } from '../../../main.js';

export function drawReaperProps(ctx, c, r, tileX, tileY, h, h2, h3) {
  // Monumento Macro: Portal das Almas & Correntes Colossais
  if ((c + 5) % 9 === 0 && (r + 2) % 9 === 0) {
    const rx = tileX + 16;
    const ry = tileY + 14;
    const glow = Math.sin(frameCount * 0.12) * 2;

    // Sombra fria no gelo
    ctx.fillStyle = 'rgba(10, 30, 40, 0.35)';
    ctx.beginPath();
    ctx.ellipse(rx + 36, ry + 42, 46, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Arco Gótico de Ferro Congelado
    ctx.fillStyle = '#223844';
    ctx.beginPath();
    ctx.moveTo(rx + 12, ry + 42);
    ctx.lineTo(rx + 16, ry + 6);
    ctx.lineTo(rx + 36, ry - 18);
    ctx.lineTo(rx + 56, ry + 6);
    ctx.lineTo(rx + 60, ry + 42);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#81ecec';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Vão do portal emitindo luz espectral de alma
    ctx.fillStyle = 'rgba(0, 206, 201, 0.28)';
    ctx.beginPath();
    ctx.moveTo(rx + 22, ry + 42);
    ctx.lineTo(rx + 24, ry + 12);
    ctx.lineTo(rx + 36, ry - 4);
    ctx.lineTo(rx + 48, ry + 12);
    ctx.lineTo(rx + 50, ry + 42);
    ctx.closePath();
    ctx.fill();

    // Correntes colossais cruzando o portal
    ctx.strokeStyle = '#051820';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(rx + 16, ry + 14);
    ctx.lineTo(rx + 56, ry + 36);
    ctx.moveTo(rx + 56, ry + 14);
    ctx.lineTo(rx + 16, ry + 36);
    ctx.stroke();

    // Chama fátua central
    ctx.fillStyle = '#00cec9';
    ctx.beginPath();
    ctx.arc(rx + 36, ry + 16, 4 + glow, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(rx + 36, ry + 16, 1.8, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // Props Secundários: Lanternas de Almas em Estacas de Gelo
  if (h < 0.09) {
    const lx = tileX + 28 + (h2 * 32);
    const ly = tileY + 22 + (h3 * 30);
    const flick = Math.sin(frameCount * 0.2 + lx) * 1.6;

    ctx.fillStyle = 'rgba(10, 30, 40, 0.28)';
    ctx.beginPath();
    ctx.ellipse(lx + 4, ly + 24, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Estaca de ferro
    ctx.fillStyle = '#1e323d';
    ctx.fillRect(lx + 3, ly + 4, 3, 20);

    // Gaiola da lanterna
    ctx.fillStyle = '#2a4452';
    ctx.fillRect(lx - 2, ly - 6, 13, 11);
    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(lx - 2, ly - 6, 13, 11);

    // Fogo-fátuo de alma ciano
    ctx.fillStyle = 'rgba(0, 206, 201, 0.35)';
    ctx.beginPath();
    ctx.arc(lx + 4.5, ly - 1, 6 + flick, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00cec9';
    ctx.beginPath();
    ctx.arc(lx + 4.5, ly - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(lx + 4.5, ly - 1.5, 1.2, 0, Math.PI * 2);
    ctx.fill();

  } else if (h >= 0.09 && h < 0.17) {
    // Lápides de Ardósia Congelada com Geada
    const tx = tileX + 30 + (h2 * 28);
    const ty = tileY + 22 + (h3 * 28);

    ctx.fillStyle = 'rgba(10, 25, 35, 0.25)';
    ctx.beginPath();
    ctx.ellipse(tx + 6, ty + 20, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3c5464';
    ctx.beginPath();
    ctx.arc(tx + 6, ty + 6, 8, Math.PI, 0);
    ctx.lineTo(tx + 14, ty + 20);
    ctx.lineTo(tx - 2, ty + 20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#dff9fb';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Cruz espectral entalhada
    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tx + 6, ty + 2);
    ctx.lineTo(tx + 6, ty + 14);
    ctx.moveTo(tx + 2, ty + 6);
    ctx.lineTo(tx + 10, ty + 6);
    ctx.stroke();

  } else if (h >= 0.17 && h < 0.33) {
    // Fendas de Gelo com Mãos Espectrais Presas
    const fx = tileX + 22 + (h2 * 45);
    const fy = tileY + 22 + (h3 * 45);

    ctx.strokeStyle = '#81ecec';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + 14, fy + 12);
    ctx.lineTo(fx + 24, fy + 8);
    ctx.stroke();

    // Silhueta translúcida de mão espectral
    ctx.strokeStyle = 'rgba(0, 206, 201, 0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fx + 10, fy + 8);
    ctx.lineTo(fx + 10, fy + 2);
    ctx.moveTo(fx + 12, fy + 8);
    ctx.lineTo(fx + 13, fy + 1);
    ctx.moveTo(fx + 14, fy + 9);
    ctx.lineTo(fx + 16, fy + 3);
    ctx.stroke();
  }
}
