/**
 * src/render/minibosses/seismicSmasherRenderer.js
 * 
 * Renderizador procedural modular do Miniboss Demolidor Sísmico (SEISMIC_SMASHER).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva do Miniboss.
 * @param {Object} e Entidade do Miniboss
 */
export function draw(e) {
  const R = e.radius;
  const isHit = e.hitFlash > 0;
  const isEnraged = !!e.enraged;
  const eliteColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : (e.color || '#f39c12'));

  const step = Math.sin(frameCount * 0.1) * 2;
  const isCharging = (e.actionState === 'WINDUP' || (e.slamTimer && e.slamTimer > 80));
  const vibrate = isCharging ? (Math.random() - 0.5) * 5 : 0;
  const mechCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#4b6584');
  const mechDark = isHit ? '#ffffff' : '#2c3e50';

  // 1. Chassi Hexagonal Blindado
  ctx.fillStyle = mechCol;
  ctx.beginPath();
  ctx.moveTo(-R * 0.8, -R * 0.5 + step);
  ctx.lineTo(R * 0.8, -R * 0.5 + step);
  ctx.lineTo(R * 0.55, R * 0.65 + step);
  ctx.lineTo(-R * 0.55, R * 0.65 + step);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = mechDark;
  ctx.lineWidth = 3;
  ctx.stroke();

  // 2. Visor Industrial com Fenda Incandescente
  ctx.fillStyle = '#1e272e';
  ctx.fillRect(-R * 0.3, -R * 0.85 + step, R * 0.6, R * 0.38);
  ctx.fillStyle = isCharging ? '#f1c40f' : (isEnraged ? '#ff4757' : '#e67e22');
  ctx.fillRect(-R * 0.22, -R * 0.72 + step, R * 0.44, 4);

  // 3. Braços com Pistões Hidráulicos Ativos
  const hammerLift = isCharging ? -R * 0.85 : R * 0.15;
  const h1X = R * 0.9 + vibrate;
  const h1Y = hammerLift + step + vibrate;
  const h2X = -R * 0.9 + vibrate;
  const h2Y = hammerLift + step - vibrate;

  // Cilindros Cromados dos Pistões
  ctx.strokeStyle = '#dfe4ea';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(R * 0.4, 0);
  ctx.lineTo(h1X, h1Y);
  ctx.moveTo(-R * 0.4, 0);
  ctx.lineTo(h2X, h2Y);
  ctx.stroke();

  // 4. Cabeças de Martelo Vulcânicas com Fissuras de Magma
  const drawHammerHead = (hx, hy) => {
    ctx.fillStyle = isHit ? '#ffffff' : '#2f3542';
    ctx.fillRect(hx - 10, hy - 16, 20, 32);
    ctx.strokeStyle = isCharging ? '#f1c40f' : '#7f8c8d';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(hx - 10, hy - 16, 20, 32);

    // Fissura de Ferro Fundido Incandescente no Martelo
    ctx.strokeStyle = isCharging ? '#ffffff' : '#f39c12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx - 6, hy - 10);
    ctx.lineTo(hx + 2, hy);
    ctx.lineTo(hx - 4, hy + 10);
    ctx.stroke();
  };

  drawHammerHead(h1X, h1Y);
  drawHammerHead(h2X, h2Y);

  // 5. Escape de Vapor Pressurizado e Fagulhas
  if (isCharging) {
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(h1X + (Math.random() - 0.5) * 24, h1Y + (Math.random() - 0.5) * 24, 3.5, 3.5);
    ctx.fillRect(h2X + (Math.random() - 0.5) * 24, h2Y + (Math.random() - 0.5) * 24, 3.5, 3.5);
  }
  if (e.actionState === 'STRIKE') {
    // Lufada cônica de vapor branco
    ctx.fillStyle = 'rgba(236, 240, 241, 0.7)';
    ctx.beginPath();
    ctx.arc(0, R * 0.7, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Renderiza a animação de morte em 3 fases do Miniboss.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 */
export function drawDying(de, t) {
  const R = de.radius;
  const isEnraged = !!de.enraged;
  const eliteColor = isEnraged ? '#ff4757' : (de.color || '#f39c12');
  const bodyAlpha = Math.max(0, 1 - Math.max(0, (t - 0.75) / 0.25));

  // Fase 1: Tremor violento de curto-circuito e pistões descontrolados
  // Fase 2: Explosão de vapor sob pressão e óleo
  // Fase 3: As pernas colapsam e a cabeça do martelo crava na terra
  const shudder = t < 0.45 ? (Math.sin(t * 50) * (1 - t) * 6) : 0;
  ctx.translate(shudder, t * 12);

  const mechCol = '#4b6584';
  const mechDark = '#2c3e50';

  // Chassi principal abatido
  ctx.fillStyle = mechCol;
  ctx.fillRect(-R * 0.75, -R * 0.5, R * 1.5, R * 0.9);
  ctx.strokeStyle = mechDark;
  ctx.lineWidth = 2.4;
  ctx.strokeRect(-R * 0.75, -R * 0.5, R * 1.5, R * 0.9);

  // Martelo pneumático dianteiro despencando e cravando no solo
  ctx.save();
  ctx.translate(R * 0.6 + t * 8, t * 10);
  ctx.rotate(t * 0.7);
  ctx.fillStyle = '#1e272e';
  ctx.fillRect(-6, -R * 0.7, 12, R * 1.4);
  ctx.fillStyle = '#f39c12';
  ctx.fillRect(-8, R * 0.4, 16, 12);
  ctx.restore();

  // Jatos de vapor branco de alta pressão e estilhaços de faísca
  if (t > 0.2) {
    ctx.fillStyle = 'rgba(236, 240, 241, 0.8)';
    for (let s = 0; s < 5; s++) {
      const sa = s * 1.25 + t * 3;
      const sd = R * (0.3 + (t - 0.2) * 1.8);
      ctx.beginPath();
      ctx.arc(Math.cos(sa) * sd, -R * 0.4 + Math.sin(sa) * (sd * 0.7), 4 + s * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(R * 0.2 + (Math.random() - 0.5) * 12, -R * 0.2 + (Math.random() - 0.5) * 12, 3, 3);
  }
}
