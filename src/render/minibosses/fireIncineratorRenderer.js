/**
 * src/render/minibosses/fireIncineratorRenderer.js
 * 
 * Renderizador procedural modular do Miniboss Incinerador Instável (FIRE_INCINERATOR).
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

  const boilPulse = Math.sin(frameCount * 0.25) * 2;
  const boilerCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#d35400');

  // 1. Escapamentos Traseiros com Faíscas
  ctx.fillStyle = '#2d3436';
  ctx.fillRect(-R * 0.95, -R * 0.75, 8, 16);
  ctx.fillRect(-R * 0.95, R * 0.35, 8, 16);

  if (Math.floor(frameCount) % 2 === 0) {
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-R * 1.3 - Math.random() * 5, -R * 0.7 + (Math.random() - 0.5) * 8, 3.5, 3.5);
    ctx.fillRect(-R * 1.3 - Math.random() * 5, R * 0.4 + (Math.random() - 0.5) * 8, 3.5, 3.5);
  }

  // 2. Chassi Esférico da Caldeira
  ctx.fillStyle = boilerCol;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.82 + boilPulse * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 2.8;
  ctx.stroke();

  // 3. Ventre de Vidro Translúcido com Combustível Fervente
  ctx.fillStyle = '#1e272e';
  ctx.fillRect(R * 0.15, -R * 0.38, R * 0.5, R * 0.76);

  // Líquido Alquímico Borbulhante
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(R * 0.22, -R * 0.28, R * 0.36, R * 0.56);
  ctx.fillStyle = '#e74c3c';
  for (let b = 0; b < 3; b++) {
    const by = -R * 0.2 + ((frameCount * 1.5 + b * 8) % (R * 0.5));
    ctx.fillRect(R * 0.3 + b * 3, by, 2.5, 2.5);
  }

  // 4. Labareda Multicamadas do Lança-Chamas Ativo
  if (e.isFlamethrowing) {
    const fPulse = Math.sin(frameCount * 0.4) * 5;
    // Camada 1: Núcleo Branco/Azul Superquente
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(R * 0.65, 0);
    ctx.lineTo(R * 1.6 + fPulse, -R * 0.2);
    ctx.lineTo(R * 1.6 + fPulse, R * 0.2);
    ctx.closePath();
    ctx.fill();

    // Camada 2: Labareda Amarelo-Dourada
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.moveTo(R * 0.6, -R * 0.25);
    ctx.lineTo(R * 2.1 + fPulse, -R * 0.65);
    ctx.lineTo(R * 2.4 + fPulse, 0);
    ctx.lineTo(R * 2.1 + fPulse, R * 0.65);
    ctx.lineTo(R * 0.6, R * 0.25);
    ctx.closePath();
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

  // Fase 1: Caldeira estufa e vibra; rebites saltam
  // Fase 2: Costuras rompem com labareda vertical e vazamento de lava
  // Fase 3: Caldeirão colapsa num bloco de escória vulcânica negra
  const swell = 1 + Math.sin(t * Math.PI) * 0.35;
  ctx.scale(swell, swell);
  ctx.translate(0, t * 10);

  const boilerCol = '#d35400';

  // Chassi do caldeirão tombando
  ctx.fillStyle = t > 0.6 ? '#2d3436' : boilerCol;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Coluna vertical de fogo e lava ejetada
  if (t > 0.15) {
    ctx.fillStyle = t < 0.5 ? '#f1c40f' : '#e67e22';
    ctx.beginPath();
    ctx.moveTo(-R * 0.4, -R * 0.5);
    ctx.lineTo(0, -R * 0.5 - t * 28);
    ctx.lineTo(R * 0.4, -R * 0.5);
    ctx.closePath();
    ctx.fill();

    // Gotas de lava incandescentes espirrando
    ctx.fillStyle = '#ff7675';
    for (let dr = 0; dr < 6; dr++) {
      const dra = dr * 1.05 + t * 2.5;
      const drd = R * (0.6 + (t - 0.15) * 2.0);
      ctx.fillRect(Math.cos(dra) * drd - 2.5, Math.sin(dra) * (drd * 0.7) - 2.5, 5, 5);
    }
  }
}
