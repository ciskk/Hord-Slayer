/**
 * src/render/minibosses/phalanxLeaderRenderer.js
 * 
 * Renderizador procedural modular do Miniboss Centurião da Guarda (PHALANX_LEADER).
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

  const step = Math.sin(frameCount * 0.12) * 2;
  const steelCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#57606f');
  const steelDark = isHit ? '#ffffff' : '#2f3542';
  const goldTrim = isHit ? '#ffffff' : (isEnraged ? '#e74c3c' : '#f1c40f');
  const capeWave = Math.sin(frameCount * 0.15) * 5;

  // 1. Capa Romana Esfarrapada (Paludamentum) Balançando
  ctx.fillStyle = isHit ? '#ffffff' : (isEnraged ? '#781515' : '#8b0000');
  ctx.beginPath();
  ctx.moveTo(-R * 0.5, -R * 0.4 + step);
  ctx.quadraticCurveTo(-R * 1.1, -R * 0.1 + capeWave, -R * 1.35, R * 0.7 + capeWave);
  ctx.lineTo(-R * 0.8, R * 0.8 + step);
  ctx.quadraticCurveTo(-R * 0.6, R * 0.2, -R * 0.4, -R * 0.2 + step);
  ctx.closePath();
  ctx.fill();

  // 2. Lança Imperial de Cerco (SPEAR_THRUST)
  const isThrusting = (e.currentSkill === 'SPEAR_THRUST' && e.actionState === 'STRIKE');
  const spearReach = isThrusting ? R * 2.3 : R * 1.4;

  ctx.strokeStyle = isHit ? '#ffffff' : '#dfe4ea';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-R * 0.2, -R * 0.1 + step);
  ctx.lineTo(spearReach, -R * 0.45 + step);
  ctx.stroke();

  // Ponta de Lança Dourada com Barbela
  ctx.fillStyle = goldTrim;
  ctx.beginPath();
  ctx.moveTo(spearReach + R * 0.25, -R * 0.45 + step);
  ctx.lineTo(spearReach - R * 0.15, -R * 0.62 + step);
  ctx.lineTo(spearReach - R * 0.05, -R * 0.45 + step);
  ctx.lineTo(spearReach - R * 0.15, -R * 0.28 + step);
  ctx.closePath();
  ctx.fill();

  // 3. Peitoral de Armadura Blindada com Rebites
  ctx.fillStyle = steelCol;
  ctx.fillRect(-R * 0.55, -R * 0.45 + step, R * 0.85, R * 0.95);
  ctx.strokeStyle = steelDark;
  ctx.lineWidth = 2.2;
  ctx.strokeRect(-R * 0.55, -R * 0.45 + step, R * 0.85, R * 0.95);

  // 4. Elmo Coríntio com Penacho e Fenda em T
  ctx.fillStyle = steelDark;
  ctx.beginPath();
  ctx.arc(-R * 0.12, -R * 0.62 + step, R * 0.34, 0, Math.PI * 2);
  ctx.fill();

  // Penacho de Crina de Cavalo Vermelho
  ctx.fillStyle = isEnraged ? '#ff4757' : '#c0392b';
  ctx.beginPath();
  ctx.moveTo(-R * 0.35, -R * 0.75 + step);
  ctx.quadraticCurveTo(-R * 0.1, -R * 1.15 + step, R * 0.15, -R * 0.8 + step);
  ctx.lineTo(-R * 0.05, -R * 0.65 + step);
  ctx.closePath();
  ctx.fill();

  // Viseira em Fenda T com Brilho Sombrio
  ctx.fillStyle = goldTrim;
  ctx.fillRect(-R * 0.16, -R * 0.65 + step, 7, 2.5);
  ctx.fillRect(-R * 0.14, -R * 0.65 + step, 2.5, 6);

  // 5. Pavês Maciço de Torre (Escudo Frontal Ativo)
  const shX = R * 0.35;
  const shY = -R * 0.9 + step;
  const shW = R * 0.58;
  const shH = R * 1.8;

  ctx.fillStyle = steelDark;
  ctx.fillRect(shX, shY, shW, shH);
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 2.8;
  ctx.strokeRect(shX, shY, shW, shH);

  // Chanfro e Cruz Imperial em Relevo Dourado
  ctx.fillStyle = goldTrim;
  ctx.fillRect(shX + shW * 0.4, shY + shH * 0.15, 5, shH * 0.7);
  ctx.fillRect(shX + shW * 0.15, shY + shH * 0.45, shW * 0.7, 5);

  // Rebites de Bronze nos 4 Cantos do Escudo
  ctx.fillStyle = '#f39c12';
  ctx.fillRect(shX + 2, shY + 2, 3, 3);
  ctx.fillRect(shX + shW - 5, shY + 2, 3, 3);
  ctx.fillRect(shX + 2, shY + shH - 5, 3, 3);
  ctx.fillRect(shX + shW - 5, shY + shH - 5, 3, 3);

  // Efeito Ativo de Bloqueio/Deflexão Frontal
  if (e.shieldBlockFlash > 0 || (e.actionState === 'WINDUP' && e.currentSkill === 'SHIELD_CHARGE')) {
    ctx.strokeStyle = 'rgba(241, 196, 15, 0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(shX + shW * 0.5, shY + shH * 0.5, shH * 0.68, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();

    // Fagulhas de Deflexão de Projétil
    for (let spk = 0; spk < 4; spk++) {
      const sa = (Math.random() - 0.5) * Math.PI * 0.8;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(shX + shW + Math.cos(sa) * 12, shY + shH * 0.5 + Math.sin(sa) * 16, 2.5, 2.5);
    }
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

  // Fase 1: Escudo parte ao meio e tomba para a frente
  // Fase 2: Lança imperial quebra e elmo salta
  // Fase 3: O centurião cai de joelhos com capa esfarrapada
  const kneeDrop = t * 12;
  ctx.translate(0, kneeDrop);

  const steelCol = '#576574';
  const steelDark = '#2f3542';
  const goldTrim = isEnraged ? '#e74c3c' : '#f1c40f';

  // 1. Capa vermelha caindo no chão
  ctx.fillStyle = '#8b0000';
  ctx.beginPath();
  ctx.moveTo(-R * 0.5, -R * 0.4);
  ctx.quadraticCurveTo(-R * 1.1, R * 0.2 + t * 10, -R * 1.35, R * 0.7 + t * 12);
  ctx.lineTo(-R * 0.8, R * 0.8 + t * 12);
  ctx.closePath();
  ctx.fill();

  // 2. Peitoral metálico curvando para a frente
  ctx.save();
  ctx.rotate(t * 0.45);
  ctx.fillStyle = steelCol;
  ctx.fillRect(-R * 0.5, -R * 0.4, R * 0.8, R * 0.9);
  ctx.strokeStyle = steelDark;
  ctx.lineWidth = 2.0;
  ctx.strokeRect(-R * 0.5, -R * 0.4, R * 0.8, R * 0.9);
  ctx.restore();

  // 3. Duas metades do Pavês Imperial caindo separadas
  ctx.save();
  ctx.translate(R * 0.5 + t * 12, t * 10);
  ctx.rotate(t * 0.8);
  ctx.fillStyle = '#b71540';
  ctx.fillRect(0, -R * 0.9, R * 0.25, R * 0.85);
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, -R * 0.9, R * 0.25, R * 0.85);
  ctx.restore();

  ctx.save();
  ctx.translate(R * 0.5 + t * 18, t * 14);
  ctx.rotate(-t * 0.6);
  ctx.fillStyle = '#b71540';
  ctx.fillRect(0, 0, R * 0.25, R * 0.85);
  ctx.strokeRect(0, 0, R * 0.25, R * 0.85);
  ctx.restore();

  // 4. Lança de cerco partida
  ctx.strokeStyle = '#dfe4ea';
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.moveTo(-R * 0.2, 0);
  ctx.lineTo(R * 0.8, -R * 0.2 + t * 8);
  ctx.stroke();

  // 5. Elmo coríntio rolando
  ctx.save();
  ctx.translate(-R * 0.3 - t * 10, t * 10);
  ctx.rotate(-t * 1.6);
  ctx.fillStyle = steelDark;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = goldTrim;
  ctx.fillRect(-2, -R * 0.4, 4, 6);
  ctx.restore();
}
