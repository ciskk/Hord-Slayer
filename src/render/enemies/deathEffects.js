import { getEnemyDeathProfile } from '../../config/enemyDeaths.js';

/** Resíduos locais, sem projéteis, alocações por frame ou alteração do combate. */
export function drawDeathResidue(ctx, de, t) {
  const { material, color } = getEnemyDeathProfile(de);
  const R = de.radius;
  const count = de.isMiniBoss ? 10 : 5;
  const spread = Math.max(0, (t - 0.18) / 0.82);
  const fade = Math.max(0, 1 - Math.max(0, (t - 0.65) / 0.35));
  const baseAlpha = ctx.globalAlpha;

  // Sombra que se espalha no chão enquanto o corpo perde sustentação.
  ctx.globalAlpha = baseAlpha * 0.22 * (1 - t);
  ctx.fillStyle = '#080a10';
  ctx.beginPath();
  ctx.ellipse(0, R * 0.8, R * (0.8 + t * 0.6), R * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  if (spread <= 0 || fade <= 0) {
    ctx.globalAlpha = baseAlpha;
    return;
  }

  ctx.globalAlpha = baseAlpha * fade * 0.75;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;

  for (let i = 0; i < count; i++) {
    // Trajetórias estáveis mesmo ao pausar ou mudar a taxa de quadros.
    const angle = i * 2.39996 + (de.hitAngle || 0);
    const distance = R * (0.5 + spread * (1.1 + (i % 3) * 0.4));
    const x = Math.cos(angle) * distance;
    const airborne = material === 'ember' || material === 'mist' || material === 'rune';
    const y = Math.sin(angle) * distance * 0.45
      + (airborne ? -spread * R * 1.6 : R * (spread * spread - spread * 0.7));
    const size = (de.isMiniBoss ? 3 : 1.8) * (1 - spread * 0.55);

    if (material === 'rune') {
      ctx.beginPath();
      ctx.moveTo(x, y - size * 1.8);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size * 1.8);
      ctx.lineTo(x - size, y);
      ctx.closePath();
      ctx.stroke();
    } else if (material === 'metal' || material === 'stone') {
      // Rotação geométrica direta sem overhead de save/translate/rotate/restore
      const rot = angle + spread * 4;
      const cosA = Math.cos(rot);
      const sinA = Math.sin(rot);
      const hw = size;
      const hh = size * 0.5;
      ctx.beginPath();
      ctx.moveTo(x - hw * cosA + hh * sinA, y - hw * sinA - hh * cosA);
      ctx.lineTo(x + hw * cosA + hh * sinA, y + hw * sinA - hh * cosA);
      ctx.lineTo(x + hw * cosA - hh * sinA, y + hw * sinA + hh * cosA);
      ctx.lineTo(x - hw * cosA - hh * sinA, y - hw * sinA + hh * cosA);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, material === 'mist' || material === 'dust' ? size * (1 + spread * 2) : size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = baseAlpha;
}
