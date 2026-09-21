/**
 * src/render/minibosses/chaosHeraldRenderer.js
 * 
 * Renderizador procedural modular do Miniboss Arauto do Caos (CHAOS_HERALD).
 */
import { ctx, frameCount } from '../../main.js';
import { player } from '../../entities/player.js';

/**
 * Renderiza a forma viva do Miniboss.
 * @param {Object} e Entidade do Miniboss
 */
export function draw(e) {
  const R = e.radius;
  const isHit = e.hitFlash > 0;
  const isEnraged = !!e.enraged;
  const eliteColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : (e.color || '#f39c12'));

  const chaosWave = Math.sin(frameCount * 0.16) * 6;
  const demonCol = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : (isEnraged ? '#d63031' : '#961b1b'));

  // 1. 4 Tentáculos Abissais com Ventosas
  ctx.strokeStyle = demonCol;
  ctx.lineWidth = isEnraged ? 4.8 : 3.8;
  for (let t = 0; t < 4; t++) {
    const tWave = Math.sin(frameCount * 0.18 + t * 1.5) * 9;
    const tx = (t - 1.5) * (R * 0.42);
    ctx.beginPath();
    ctx.moveTo(tx, R * 0.4);
    ctx.quadraticCurveTo(tx + tWave, R * 0.85, tx - tWave * 0.5, R * 1.3);
    ctx.stroke();

    // Ventosa Carmesim
    ctx.fillStyle = '#ff4757';
    ctx.fillRect(tx + tWave * 0.5 - 2, R * 0.85, 4, 4);
  }

  // 2. Torso Demoníaco Esférico
  ctx.fillStyle = demonCol;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.76, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2c0c16';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 3. Chifres Longos de Obsidiana com Labaredas nas Pontas
  ctx.strokeStyle = isEnraged ? '#ff4757' : '#1e080d';
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(-R * 0.4, -R * 0.4);
  ctx.quadraticCurveTo(-R * 0.95, -R * 1.15 + chaosWave, -R * 1.45, -R * 0.85);
  ctx.moveTo(R * 0.4, -R * 0.4);
  ctx.quadraticCurveTo(R * 0.95, -R * 1.15 + chaosWave, R * 1.45, -R * 0.85);
  ctx.moveTo(-R * 0.25, -R * 0.65);
  ctx.quadraticCurveTo(-R * 0.65, -R * 1.45, -R * 0.8, -R * 1.7);
  ctx.moveTo(R * 0.25, -R * 0.65);
  ctx.quadraticCurveTo(R * 0.65, -R * 1.45, R * 0.8, -R * 1.7);
  ctx.stroke();

  // 4. Olho do Caos com Rastreamento Óptico Dinâmico do Jogador
  const eyeR = R * 0.35 + Math.sin(frameCount * 0.12) * (isEnraged ? 4 : 2);
  ctx.fillStyle = isEnraged ? '#ff1744' : '#ff4757';
  ctx.beginPath();
  ctx.arc(0, -R * 0.05, eyeR, 0, Math.PI * 2);
  ctx.fill();

  // Cálculo do Olhar Relativo na Direção do Jogador
  let lookAngle = 0;
  if (player && typeof player.x === 'number') {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    lookAngle = Math.atan2(dy, dx) - (e.facing === -1 ? Math.PI : 0);
  }
  const pupilDist = eyeR * 0.4;
  const pupilX = Math.cos(lookAngle) * pupilDist;
  const pupilY = -R * 0.05 + Math.sin(lookAngle) * pupilDist;

  // Pupila em Fenda Demoníaca Vertical
  ctx.fillStyle = '#0a0104';
  ctx.beginPath();
  ctx.ellipse(pupilX, pupilY, 3.5, eyeR * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
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

  // Fase 1: 4 tentáculos abissais desintegram das pontas para a base
  // Fase 2: Olhos caóticos estouram em filamentos de éter rubro
  // Fase 3: Torso demoníaco torce sobre si mesmo sugado para fenda abissal
  const twist = t * Math.PI * 1.5;
  ctx.rotate(twist * 0.15);

  const demonCol = isEnraged ? '#d63031' : '#961b1b';

  // 4 Tentáculos encurtando e se desfazendo em brasas
  ctx.strokeStyle = demonCol;
  ctx.lineWidth = Math.max(1, 3.5 * (1 - t * 0.7));
  for (let tk = 0; tk < 4; tk++) {
    const ta = tk * (Math.PI / 2) + t * 1.5;
    const reach = R * (1.2 * Math.max(0.1, 1 - t * 0.9));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(ta + 0.4) * (reach * 0.6), Math.sin(ta + 0.4) * (reach * 0.6), Math.cos(ta) * reach, Math.sin(ta) * reach);
    ctx.stroke();
  }

  // Corpo demoníaco central torcendo e contraindo
  const bodyScale = Math.max(0.05, 1 - t * 0.9);
  ctx.scale(bodyScale, bodyScale);
  ctx.fillStyle = demonCol;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Olhos caóticos explodindo em filamentos rubros
  if (t > 0.25) {
    ctx.fillStyle = '#ff4757';
    for (let eye = 0; eye < 8; eye++) {
      const ea = eye * (Math.PI / 4) + t * 3;
      const ed = R * (0.4 + (t - 0.25) * 2.2);
      ctx.fillRect(Math.cos(ea) * ed - 2.5, Math.sin(ea) * ed - 2.5, 5, 5);
    }
  }
}
