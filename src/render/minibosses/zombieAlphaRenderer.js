/**
 * src/render/minibosses/zombieAlphaRenderer.js
 * 
 * Renderizador procedural modular do Miniboss Zumbi Alfa (ZOMBIE_ALPHA).
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

  const stepBob = Math.sin(frameCount * 0.14) * 3;
  const armSwing = Math.sin(frameCount * 0.14) * 6;
  const skinColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : (isEnraged ? '#15241b' : '#1e392a'));
  const skinShade = isHit ? '#ffffff' : (isEnraged ? '#0d1812' : '#14271c');
  const veinColor = isHit ? '#ffffff' : (isEnraged ? '#ff4757' : '#2ecc71');
  const boneColor = isHit ? '#ffffff' : '#dfe4ea';

  // 1. Tronco Curvado e Corcunda Muscular
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.moveTo(-R * 0.9, -R * 0.4 + stepBob);
  ctx.quadraticCurveTo(0, -R * 0.55 + stepBob, R * 0.85, -R * 0.35 + stepBob);
  ctx.lineTo(R * 0.6, R * 0.7 + stepBob);
  ctx.lineTo(-R * 0.6, R * 0.7 + stepBob);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = skinShade;
  ctx.lineWidth = 2.8;
  ctx.stroke();

  // 2. Coluna Vertebral Exposta no Dorso (5 Vértebras Ósseas)
  ctx.fillStyle = boneColor;
  ctx.strokeStyle = '#2f3542';
  ctx.lineWidth = 1.2;
  for (let v = 0; v < 5; v++) {
    const vy = -R * 0.35 + v * (R * 0.22) + stepBob;
    const vx = -R * 0.65 + Math.sin(v * 0.8) * 3;
    ctx.beginPath();
    ctx.ellipse(vx, vy, 4.5, 3.2, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 3. Feixes de Veias Pulsantes com Ritmo Cardíaco
  const pulseRate = isEnraged ? 0.35 : 0.18;
  const veinWidth = isEnraged ? 3.0 : 2.0;
  ctx.strokeStyle = veinColor;
  ctx.lineWidth = veinWidth;
  ctx.beginPath();
  ctx.moveTo(-R * 0.4, -R * 0.15 + stepBob);
  ctx.lineTo(-R * 0.1, R * 0.15 + stepBob);
  ctx.lineTo(R * 0.25, -R * 0.05 + stepBob);
  ctx.lineTo(R * 0.5, R * 0.35 + stepBob);
  ctx.stroke();

  // 4. Cabeça Massiva com Mandíbula Caída
  ctx.fillStyle = skinShade;
  ctx.beginPath();
  ctx.arc(R * 0.25, -R * 0.6 + stepBob, R * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0a140d';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Mandíbula e Dentes Amarelados
  ctx.fillStyle = '#0a140d';
  ctx.beginPath();
  ctx.rect(R * 0.2, -R * 0.48 + stepBob, R * 0.35, 6.5);
  ctx.fill();
  ctx.fillStyle = '#f1f2f6';
  ctx.fillRect(R * 0.26, -R * 0.48 + stepBob, 2.5, 4);
  ctx.fillRect(R * 0.36, -R * 0.48 + stepBob, 2.5, 4);
  ctx.fillRect(R * 0.46, -R * 0.48 + stepBob, 2.5, 4);

  // Olho Único em Fenda Néon
  ctx.fillStyle = isEnraged ? '#ff1744' : '#ff3838';
  ctx.fillRect(R * 0.32, -R * 0.7 + stepBob, isEnraged ? 6.5 : 5.0, 4.0);

  // Gotejamento de Bile Ácida Verde
  ctx.fillStyle = '#2ecc71';
  for (let d = 0; d < 3; d++) {
    const dropY = -R * 0.4 + ((frameCount * 1.8 + d * 14) % 24);
    const dropAlpha = 1 - (((frameCount * 1.8 + d * 14) % 24) / 24);
    ctx.save();
    ctx.globalAlpha = dropAlpha;
    ctx.beginPath();
    ctx.arc(R * 0.38 + d * 3, dropY + stepBob, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Efeito Visual de Rugido (HOWL)
  if (e.actionState === 'WINDUP' && e.currentSkill === 'HOWL') {
    const howlWave = (frameCount * 0.2) % 1;
    ctx.strokeStyle = `rgba(46, 204, 113, ${1 - howlWave})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(R * 0.4, -R * 0.58 + stepBob, 12 + howlWave * 30, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();
  }

  // 5. Braços e Garras com Poses de Bote (POUNCE)
  const isPouncing = e.currentSkill === 'POUNCE' && (e.actionState === 'WINDUP' || e.actionState === 'STRIKE');
  const armLift = isPouncing ? -R * 0.55 : armSwing;

  const f1X = R * 0.85;
  const f1Y = R * 0.2 + armLift + stepBob;
  const f2X = -R * 0.85;
  const f2Y = R * 0.2 - armLift + stepBob;

  ctx.fillStyle = skinColor;
  ctx.strokeStyle = skinShade;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(f1X, f1Y, R * 0.38, 0, Math.PI * 2);
  ctx.arc(f2X, f2Y, R * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Garras Triplas Recurvadas
  ctx.strokeStyle = isHit ? '#ffffff' : (isEnraged ? '#ff6b81' : '#ced6e0');
  ctx.lineWidth = 2.8;
  for (let g = -1; g <= 1; g++) {
    const gx1 = f1X + g * 5;
    const gy1 = f1Y + R * 0.2;
    ctx.beginPath();
    ctx.moveTo(gx1, gy1);
    ctx.lineTo(gx1 + 3, gy1 + R * 0.4);
    ctx.stroke();

    const gx2 = f2X + g * 5;
    const gy2 = f2Y + R * 0.2;
    ctx.beginPath();
    ctx.moveTo(gx2, gy2);
    ctx.lineTo(gx2 - 3, gy2 + R * 0.4);
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

  // Fase 1: Racha a coluna e arqueia o dorso
  // Fase 2: Jatos de sangue verde e estalo vertebral
  // Fase 3: Tombo pesado de frente com os braços esticados
  const fallPitch = t < 0.35 ? -t * 0.4 : (t - 0.35) * 1.1;
  ctx.rotate(fallPitch);
  ctx.translate(0, t * 14);

  const skinColor = isEnraged ? '#15241b' : '#1e392a';
  const skinShade = isEnraged ? '#0d1812' : '#14271c';
  const veinColor = isEnraged ? '#ff4757' : '#2ecc71';

  // Torso desabando
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.moveTo(-R * 0.9, -R * 0.4);
  ctx.quadraticCurveTo(0, -R * 0.55 + t * 4, R * 0.85, -R * 0.35 + t * 8);
  ctx.lineTo(R * 0.6, R * 0.7);
  ctx.lineTo(-R * 0.6, R * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = skinShade;
  ctx.lineWidth = 2.8;
  ctx.stroke();

  // Coluna vertebral se partindo (vértebras ejetadas)
  for (let v = 0; v < 5; v++) {
    const vDisplace = t > 0.35 ? (t - 0.35) * (v * 12 - 24) : 0;
    const vy = -R * 0.35 + v * (R * 0.22) + vDisplace * 0.4;
    const vx = -R * 0.65 + Math.sin(v * 0.8) * 3 + vDisplace;
    ctx.fillStyle = '#dfe4ea';
    ctx.beginPath();
    ctx.ellipse(vx, vy, 4.5, 3.2, -0.3 + t * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Erupção de bile verde esmeralda pelas veias rompidas
  if (t > 0.25) {
    ctx.fillStyle = veinColor;
    for (let b = 0; b < 6; b++) {
      const ba = b * 1.05 + t * 2.2;
      const bd = R * (0.4 + (t - 0.25) * 1.8);
      ctx.fillRect(Math.cos(ba) * bd - 2.5, Math.sin(ba) * (bd * 0.6) - 2.5, 5, 5);
    }
  }

  // Cabeça abatida
  ctx.fillStyle = skinShade;
  ctx.beginPath();
  ctx.arc(R * 0.25 + t * 6, -R * 0.6 + t * 12, R * 0.36, 0, Math.PI * 2);
  ctx.fill();
}
