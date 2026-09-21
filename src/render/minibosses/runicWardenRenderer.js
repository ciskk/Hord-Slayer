/**
 * src/render/minibosses/runicWardenRenderer.js
 * 
 * Renderizador procedural modular do Miniboss Guardião Rúnico (RUNIC_WARDEN).
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

  const stoneCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#2c3e50');

  // 1. Torso Central Monolítico de Basalto
  ctx.fillStyle = stoneCol;
  ctx.beginPath();
  ctx.moveTo(0, -R * 0.9);
  ctx.lineTo(R * 0.75, -R * 0.35);
  ctx.lineTo(R * 0.6, R * 0.8);
  ctx.lineTo(-R * 0.6, R * 0.8);
  ctx.lineTo(-R * 0.75, -R * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0984e3';
  ctx.lineWidth = 2.8;
  ctx.stroke();

  // 2. Ombreiras Levitantes Desconectadas
  for (let s = -1; s <= 1; s += 2) {
    const shX = s * (R * 0.95);
    const shY = -R * 0.35 + Math.sin(frameCount * 0.1 + s) * 3;
    ctx.fillStyle = stoneCol;
    ctx.fillRect(shX - 6, shY - 10, 12, 20);
    ctx.strokeStyle = '#74b9ff';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(shX - 6, shY - 10, 12, 20);

    // Filamento Elétrico Unindo a Ombreira ao Torso
    ctx.strokeStyle = '#00d2d3';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(s * (R * 0.5), -R * 0.2);
    ctx.lineTo(shX, shY);
    ctx.stroke();
  }

  // 3. Glifos Nórdicos Incisos no Peito com Pulso de Mana
  const manaPulse = (Math.sin(frameCount * 0.15) + 1) * 2;
  ctx.fillStyle = isHit ? '#ffffff' : '#00d2d3';
  ctx.beginPath();
  ctx.moveTo(0, -R * 0.35 - manaPulse);
  ctx.lineTo(R * 0.3 + manaPulse, 0);
  ctx.lineTo(0, R * 0.35 + manaPulse);
  ctx.lineTo(-R * 0.3 - manaPulse, 0);
  ctx.closePath();
  ctx.fill();

  // 4. Glifos Orbitais com Cúpula de Força Hexagonal
  const rSpeed = (e.actionState === 'WINDUP' ? 0.08 : 0.035);
  for (let r = 0; r < 3; r++) {
    const rAng = frameCount * rSpeed + (r * Math.PI * 2 / 3);
    const rx = Math.cos(rAng) * (R * 1.4);
    const ry = Math.sin(rAng) * (R * 0.85);

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(frameCount * 0.05);
    ctx.fillStyle = 'rgba(9, 132, 227, 0.45)';
    ctx.strokeStyle = '#74b9ff';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    for (let h = 0; h < 6; h++) {
      const ha = h * Math.PI / 3;
      const hx = Math.cos(ha) * 8.5;
      const hy = Math.sin(ha) * 8.5;
      if (h === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
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

  // Fase 1: Escudos de safira orbitais quebram em prismas de vidro azul
  // Fase 2: Runas no monólito apagam progressivamente
  // Fase 3: O corpo central de basalto racha em pilares que tombam
  ctx.translate(0, t * 12);

  const stoneCol = '#2c3e50';

  // Fragmentos de cristais de barreira se dispersando
  ctx.fillStyle = '#0984e3';
  for (let cr = 0; cr < 6; cr++) {
    const cra = cr * (Math.PI / 3) + t * 2.2;
    const crd = R * (0.8 + t * 1.8);
    ctx.beginPath();
    ctx.moveTo(Math.cos(cra) * crd, Math.sin(cra) * crd);
    ctx.lineTo(Math.cos(cra + 0.3) * (crd + 6), Math.sin(cra + 0.3) * (crd + 6));
    ctx.lineTo(Math.cos(cra - 0.2) * (crd + 5), Math.sin(cra - 0.2) * (crd + 5));
    ctx.closePath();
    ctx.fill();
  }

  // Torso de basalto partindo em dois menires
  ctx.fillStyle = stoneCol;
  ctx.fillRect(-R * 0.65 - t * 8, -R * 0.6, R * 0.6, R * 1.2);
  ctx.fillRect(t * 8, -R * 0.6, R * 0.6, R * 1.2);
  ctx.strokeStyle = '#1e272e';
  ctx.lineWidth = 2.2;
  ctx.strokeRect(-R * 0.65 - t * 8, -R * 0.6, R * 0.6, R * 1.2);
  ctx.strokeRect(t * 8, -R * 0.6, R * 0.6, R * 1.2);

  // Runas apagando do topo à base
  if (t < 0.6) {
    ctx.strokeStyle = '#00d2d3';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-R * 0.3, -R * 0.1);
    ctx.lineTo(0, R * 0.2);
    ctx.lineTo(R * 0.3, -R * 0.1);
    ctx.stroke();
  }
}
