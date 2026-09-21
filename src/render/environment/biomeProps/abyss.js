/**
 * src/render/environment/biomeProps/abyss.js
 * BOSS 4: HORIZONTE DO VAZIO (Soberano do Abismo - Chefe Final)
 * Âncora dimensional rompida, olhos vivos do abismo que seguem o jogador, runas cósmicas.
 */
import { frameCount, camera, cameraViewW, cameraViewH } from '../../../main.js';
import { player } from '../../../entities/player.js';

export function drawAbyssProps(ctx, c, r, tileX, tileY, h, h2, h3) {
  // Monumento Macro: A Âncora Dimensional de Singularidade Rompida
  if ((c + 1) % 9 === 0 && (r + 5) % 9 === 0) {
    const ax = tileX + 16;
    const ay = tileY + 14;
    const pulse = Math.sin(frameCount * 0.1) * 2;

    // Sombra da âncora dimensional no vazio
    ctx.fillStyle = 'rgba(30, 10, 45, 0.45)';
    ctx.beginPath();
    ctx.ellipse(ax + 36, ay + 42, 48, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Haste da âncora dimensional
    ctx.fillStyle = '#2a123a';
    ctx.fillRect(ax + 32, ay - 14, 8, 52);
    ctx.strokeStyle = '#d980fa';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(ax + 32, ay - 14, 8, 52);

    // Braços curvos inferiores da âncora
    ctx.beginPath();
    ctx.arc(ax + 36, ay + 30, 24, 0, Math.PI);
    ctx.stroke();

    // Anel orbital flutuando em perspectiva
    ctx.strokeStyle = '#8e44ad';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(ax + 36, ay + 8, 30, 10, 0.2, 0, Math.PI * 2);
    ctx.stroke();

    // Singularidade no centro do monumento
    ctx.fillStyle = '#100319';
    ctx.beginPath();
    ctx.arc(ax + 36, ay + 8, 6 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    return;
  }

  // Props Secundários: Olhos Vivos do Abismo (Seguem o Jogador)
  if (h < 0.09) {
    const ex = tileX + 26 + (h2 * 34);
    const ey = tileY + 24 + (h3 * 30);

    // Ângulo em direção ao jogador para a pupila acompanhar a movimentação
    const eyeTargetX = player ? player.x : camera.x + cameraViewW / 2;
    const eyeTargetY = player ? player.y : camera.y + cameraViewH / 2;
    const pAng = Math.atan2(eyeTargetY - ey, eyeTargetX - ex);
    const pupDist = 3.2;
    const pupX = ex + Math.cos(pAng) * pupDist;
    const pupY = ey + Math.sin(pAng) * (pupDist * 0.6);

    // Contorno do olho cósmico no piso
    ctx.fillStyle = '#180724';
    ctx.beginPath();
    ctx.ellipse(ex, ey, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d980fa';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Íris fluorescente magenta
    ctx.fillStyle = '#8e44ad';
    ctx.beginPath();
    ctx.arc(pupX, pupY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Pupila vertical brilhante
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(pupX, pupY, 1.4, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

  } else if (h >= 0.09 && h < 0.18) {
    // Cristais de Matéria Escura Flutuantes
    const cx = tileX + 30 + (h2 * 28);
    const cy = tileY + 22 + (h3 * 28);
    const hover = Math.sin(frameCount * 0.12 + cx) * 2.8;

    ctx.fillStyle = 'rgba(25, 8, 35, 0.3)';
    ctx.beginPath();
    ctx.ellipse(cx + 4, cy + 18, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cristal levitando
    ctx.save();
    ctx.translate(0, hover);
    ctx.fillStyle = '#2c0e3e';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 14);
    ctx.lineTo(cx + 4, cy - 8);
    ctx.lineTo(cx + 9, cy + 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d980fa';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = 'rgba(224, 86, 253, 0.5)';
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy - 8);
    ctx.lineTo(cx + 9, cy + 14);
    ctx.lineTo(cx + 4, cy + 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

  } else if (h >= 0.18 && h < 0.33) {
    // Runas e Constelações de Entropia Cósmica
    const rx = tileX + 24 + (h2 * 45);
    const ry = tileY + 24 + (h3 * 45);

    ctx.strokeStyle = 'rgba(217, 128, 250, 0.6)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(rx + 10, ry + 10, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Triângulo estelar inscrito
    ctx.strokeStyle = '#8e44ad';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rx + 10, ry - 1);
    ctx.lineTo(rx + 19, ry + 16);
    ctx.lineTo(rx + 1, ry + 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ponto estelar brilhante
    const blink = Math.sin(frameCount * 0.15 + rx) > 0.5;
    if (blink) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(rx + 10, ry + 10, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
