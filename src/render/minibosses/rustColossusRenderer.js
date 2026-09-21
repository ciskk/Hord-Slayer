/**
 * src/render/minibosses/rustColossusRenderer.js
 * 
 * Renderizador procedural modular do Miniboss Colosso Ferruginoso (RUST_COLOSSUS).
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

  const step = Math.sin(frameCount * 0.09) * 2.5;
  const rustBase = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#b33927');
  const rustDark = isHit ? '#ffffff' : '#533422';

  // 1. Chaminé Traseira com Fumaça e Fuligem
  ctx.fillStyle = '#2d3436';
  ctx.fillRect(-R * 0.7, -R * 1.05 + step, 9, 18);
  if (Math.floor(frameCount) % 3 === 0) {
    ctx.fillStyle = 'rgba(127, 140, 141, 0.75)';
    ctx.beginPath();
    ctx.arc(-R * 0.68 + (Math.random() - 0.5) * 6, -R * 1.25 + step, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Carcaça Maciça Blindada com Rebites
  ctx.fillStyle = rustBase;
  ctx.beginPath();
  ctx.moveTo(-R * 0.9, -R * 0.5 + step);
  ctx.lineTo(R * 0.9, -R * 0.5 + step);
  ctx.lineTo(R * 0.65, R * 0.75 + step);
  ctx.lineTo(-R * 0.65, R * 0.75 + step);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rustDark;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Rebites de Aço Escuro
  ctx.fillStyle = '#f7d794';
  for (let rv = -3; rv <= 3; rv++) {
    ctx.fillRect(rv * (R * 0.23) - 2, -R * 0.42 + step, 3.5, 3.5);
  }

  // 3. Correntes de Ferro Suspensas nos Ombros com Inércia
  ctx.strokeStyle = '#7f8c8d';
  ctx.lineWidth = 2.2;
  const chainSway = Math.sin(frameCount * 0.12) * 4;
  for (let c = -1; c <= 1; c += 2) {
    const cx = c * (R * 0.75);
    ctx.beginPath();
    ctx.moveTo(cx, -R * 0.4 + step);
    ctx.lineTo(cx + chainSway * c, R * 0.2 + step);
    ctx.stroke();
  }

  // 4. Fornalha Peitoral com Brasas Vivas e Grade de Ferro
  ctx.fillStyle = '#2d3436';
  ctx.fillRect(-R * 0.38, -R * 0.18 + step, R * 0.76, R * 0.54);

  // Núcleo de Fogo e Brasas
  const furnacePulse = (Math.sin(frameCount * 0.16) + 1) * 0.5;
  ctx.fillStyle = furnacePulse > 0.4 ? '#f1c40f' : '#e67e22';
  ctx.fillRect(-R * 0.3, -R * 0.12 + step, R * 0.6, R * 0.42);

  // Grade de Ferro Forjado
  ctx.strokeStyle = '#1e272e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-R * 0.12, -R * 0.12 + step);
  ctx.lineTo(-R * 0.12, R * 0.3 + step);
  ctx.moveTo(R * 0.12, -R * 0.12 + step);
  ctx.lineTo(R * 0.12, R * 0.3 + step);
  ctx.stroke();

  // 5. Rocha Vulcânica com Magma no Arremesso (BOULDER_TOSS)
  if (e.actionState === 'WINDUP' && e.currentSkill === 'BOULDER_TOSS') {
    const bRad = R * 0.7;
    const bY = -R * 1.55 + step;
    ctx.fillStyle = '#3d3d3d';
    ctx.beginPath();
    ctx.arc(0, bY, bRad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d35400';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Veias de Magma Fluido na Rocha
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-bRad * 0.5, bY - bRad * 0.3);
    ctx.lineTo(0, bY);
    ctx.lineTo(bRad * 0.4, bY + bRad * 0.4);
    ctx.stroke();
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

  // Fase 1: Chaminés expelem nuvem negra e fornalha abre com luz branca
  // Fase 2: Braços de pedra/ferro despencam em direções opostas
  // Fase 3: O torso de fornalha racha ao meio desabando em pilha de sucata
  ctx.translate(0, t * 14);

  const rustBase = '#b33927';
  const rustDark = '#533422';

  // Chaminés traseiras tombando e soltando fumaça densa
  ctx.fillStyle = '#2d3436';
  ctx.fillRect(-R * 0.8 - t * 8, -R * 0.9 - t * 4, 10, R * 0.6);
  ctx.fillRect(-R * 0.4 - t * 4, -R * 0.95 - t * 6, 10, R * 0.65);

  // Fumaça espessa de fuligem
  ctx.fillStyle = 'rgba(45, 52, 54, 0.75)';
  for (let f = 0; f < 4; f++) {
    const fa = f * 1.6 + t * 2;
    const fy = -R * 0.8 - t * 20 - f * 6;
    ctx.beginPath();
    ctx.arc(-R * 0.6 + Math.sin(fa) * 10, fy, 6 + f * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Torso rachando em dois blocos monolíticos
  ctx.fillStyle = rustBase;
  ctx.fillRect(-R * 0.8 - t * 10, -R * 0.4, R * 0.75, R * 0.9);
  ctx.fillRect(t * 10, -R * 0.4, R * 0.75, R * 0.9);
  ctx.strokeStyle = rustDark;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-R * 0.8 - t * 10, -R * 0.4, R * 0.75, R * 0.9);
  ctx.strokeRect(t * 10, -R * 0.4, R * 0.75, R * 0.9);

  // Braço esquerdo de rocha caindo
  ctx.save();
  ctx.translate(-R * 1.1 - t * 14, t * 8);
  ctx.rotate(-t * 0.8);
  ctx.fillStyle = '#636e72';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Fornalha incandescente esfriando no centro
  if (t < 0.7) {
    ctx.fillStyle = t < 0.35 ? '#ffffff' : '#d35400';
    ctx.beginPath();
    ctx.arc(0, -R * 0.1, R * 0.3 * (1 - t * 1.2), 0, Math.PI * 2);
    ctx.fill();
  }
}
