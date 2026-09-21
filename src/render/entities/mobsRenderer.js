/**
 * src/render/entities/mobsRenderer.js
 * 
 * Renderizador das hordas de monstros, inimigos agonizantes e radar de minibosses.
 */
import { drawEnemyShape, drawDyingEnemyShape } from '../enemiesRenderer.js';

export function renderDyingEnemies(dyingEnemies, bounds) {
  const { viewLeft, viewRight, viewTop, viewBottom } = bounds;
  for (let i = 0; i < dyingEnemies.length; i++) {
    const de = dyingEnemies[i];
    if (de.x >= viewLeft && de.x <= viewRight && de.y >= viewTop && de.y <= viewBottom) {
      drawDyingEnemyShape(de);
    }
  }
}

export function renderEnemiesShadows(ctx, enemies, bounds, frameCount) {
  const { viewLeft, viewRight, viewTop, viewBottom } = bounds;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e || e.isBoss || e.isBossSubTarget) continue;
    if (e.x < viewLeft || e.x > viewRight || e.y < viewTop || e.y > viewBottom) continue;

    const isFlying = e.baseType === 'BAT' || e.baseType === 'NECRO';
    const shadowBob = e.baseType === 'BAT' ? Math.sin(frameCount * 0.42) * 1.2 : 0;
    const shadowR = e.baseType === 'ZOMBIE' ? e.radius * 1.38 : e.radius;
    const shadowY = e.y + shadowR * (isFlying ? 0.95 : 0.8) + shadowBob;

    const jumpAlt = Math.max(0, e.jumpZ || 0);
    const altRatio = Math.min(1, jumpAlt / 28);
    const shadowScale = Math.max(0.45, 1 - altRatio * 0.38);
    const shadowRx = Math.max(2.2, (shadowR * (isFlying ? 0.7 : 0.85) - shadowBob * 0.5) * shadowScale);
    const shadowRy = shadowRx * 0.38;

    ctx.moveTo(e.x + shadowRx, shadowY);
    ctx.ellipse(e.x, shadowY, shadowRx, shadowRy, 0, 0, Math.PI * 2);
  }
  ctx.fill();
}

export function renderEnemies(enemies, bounds) {
  const { viewLeft, viewRight, viewTop, viewBottom } = bounds;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.isBoss || (e.x >= viewLeft && e.x <= viewRight && e.y >= viewTop && e.y <= viewBottom)) {
      drawEnemyShape(e);
    }
  }
}

export function renderMinibossOffscreenRadar(ctx, enemies, camera, CAMERA_ZOOM, viewW, viewH, frameCount) {
  for (let i = 0; i < enemies.length; i++) {
    const mb = enemies[i];
    if (!mb || !mb.isMiniBoss || mb.hp <= 0) continue;

    const sx = (mb.x - camera.x) * CAMERA_ZOOM;
    const sy = (mb.y - camera.y) * CAMERA_ZOOM;
    const pad = 42;
    const isOffscreen = sx < pad || sx > viewW - pad || sy < pad || sy > viewH - pad;

    if (isOffscreen) {
      const centerX = viewW / 2;
      const centerY = viewH / 2;
      const angle = Math.atan2(sy - centerY, sx - centerX);
      const clampX = Math.max(pad, Math.min(viewW - pad, sx));
      const clampY = Math.max(pad, Math.min(viewH - pad, sy));
      const pulse = Math.sin(frameCount * 0.2) * 3;
      const arrowColor = mb.color || '#f39c12';

      ctx.save();
      ctx.translate(clampX, clampY);
      ctx.rotate(angle);

      // Seta indicadora de ameaça com pulso
      ctx.fillStyle = arrowColor;
      ctx.beginPath();
      ctx.moveTo(10 + pulse, 0);
      ctx.lineTo(-8, -9);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 9);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Ponto de alerta
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-1, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
