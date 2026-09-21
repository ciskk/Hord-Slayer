/**
 * src/render/enemies/golemRenderer.js
 * 
 * Renderizador procedural modular de Golem Pétreo (GOLEM).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Golem Pétreo.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 3. GOLEM DE CONCRETO - Monólito de cantaria sobreposta e ossário imperial
  // =========================================================================
  const R_m = e.radius;
  const isGolemWindup = e.combatState === 'WINDUP';
  const isGolemStrike = e.combatState === 'STRIKE';
  const missingHpRatio = Math.max(0, 1 - (e.hp / (e.maxHp || 1)));
  const isHit = e.hitFlash > 0;

  const stoneBase = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#2d3436');
  const stoneLight = isHit ? '#ffffff' : '#576574';
  const stoneDark = isHit ? '#ffffff' : '#1e272e';
  const rebarIron = isHit ? '#ffffff' : '#7f8c8d';
  const skullColor = isHit ? '#ffffff' : '#dfe4ea';
  const runeGlow = isHit ? '#ffffff' : (missingHpRatio > 0.5 ? '#ff4757' : (isGolemWindup ? '#ff3838' : '#f39c12'));

  // 1. Pilares de Sustentação Inferiores (Pernas de Alvenaria)
  const stepCycle = Math.sin(frameCount * 0.1);
  ctx.fillStyle = stoneBase;
  ctx.fillRect(-R_m * 0.72, R_m * 0.45 + stepCycle * 2.5, R_m * 0.5, R_m * 0.58);
  ctx.fillRect(R_m * 0.22, R_m * 0.45 - stepCycle * 2.5, R_m * 0.5, R_m * 0.58);
  ctx.strokeStyle = stoneDark;
  ctx.lineWidth = 2.4;
  ctx.strokeRect(-R_m * 0.72, R_m * 0.45 + stepCycle * 2.5, R_m * 0.5, R_m * 0.58);
  ctx.strokeRect(R_m * 0.22, R_m * 0.45 - stepCycle * 2.5, R_m * 0.5, R_m * 0.58);

  // Cintas de ferro forjado nas pernas
  ctx.fillStyle = rebarIron;
  ctx.fillRect(-R_m * 0.72, R_m * 0.65 + stepCycle * 2.5, R_m * 0.5, 3);
  ctx.fillRect(R_m * 0.22, R_m * 0.65 - stepCycle * 2.5, R_m * 0.5, 3);

  // 2. Torso Monolítico de Cantaria com Arestas Chanfradas
  ctx.fillStyle = stoneLight;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.95, -R_m * 0.45);
  ctx.lineTo(R_m * 0.95, -R_m * 0.48);
  ctx.lineTo(R_m * 0.65, R_m * 0.62);
  ctx.lineTo(-R_m * 0.65, R_m * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = stoneDark;
  ctx.lineWidth = 3.0;
  ctx.stroke();

  // 3. Nicho de Arco Gótico Romano Quebrado no Peito
  ctx.fillStyle = '#0f141a';
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.42, R_m * 0.45);
  ctx.lineTo(-R_m * 0.42, -R_m * 0.15);
  ctx.quadraticCurveTo(0, -R_m * 0.55, R_m * 0.42, -R_m * 0.15);
  ctx.lineTo(R_m * 0.42, R_m * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = stoneDark;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // 4. Três Crânios Petrificados Engastados no Nicho (O Ossário)
  for (let sk = -1; sk <= 1; sk++) {
    const skX = sk * (R_m * 0.26);
    const skY = (sk === 0 ? -R_m * 0.18 : R_m * 0.08);
    ctx.fillStyle = skullColor;
    ctx.beginPath();
    ctx.arc(skX, skY, 4.2, 0, Math.PI * 2);
    ctx.fill();
    // Órbitas oculares ocas
    ctx.fillStyle = '#111111';
    ctx.fillRect(skX - 2.5, skY - 1.5, 1.8, 1.8);
    ctx.fillRect(skX + 0.7, skY - 1.5, 1.8, 1.8);
  }

  // 5. Vergalhões de Ferro Quadrados em Zigue-Zague e Correntes
  ctx.strokeStyle = rebarIron;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.75, -R_m * 0.45);
  ctx.lineTo(-R_m * 1.05, -R_m * 0.85);
  ctx.lineTo(-R_m * 0.9, -R_m * 1.05);
  ctx.moveTo(R_m * 0.75, -R_m * 0.45);
  ctx.lineTo(R_m * 1.05, -R_m * 0.85);
  ctx.lineTo(R_m * 0.9, -R_m * 1.05);
  ctx.stroke();

  // Elos de correntes nos ombros
  ctx.strokeStyle = '#2f3542';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(-R_m * 0.85, -R_m * 0.55, 6, 0, Math.PI * 2);
  ctx.arc(R_m * 0.85, -R_m * 0.55, 6, 0, Math.PI * 2);
  ctx.stroke();

  // 6. Fissuras Tectônicas e Magma
  const crackPulse = (Math.sin(frameCount * 0.12) + 1) * 0.5;
  ctx.strokeStyle = (crackPulse > 0.4 || isGolemWindup) ? runeGlow : '#d35400';
  ctx.lineWidth = 2.2 + missingHpRatio * 2.5;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.15, -R_m * 0.35);
  ctx.lineTo(R_m * 0.18, -R_m * 0.05);
  ctx.lineTo(-R_m * 0.08, R_m * 0.22);
  ctx.lineTo(R_m * 0.25, R_m * 0.5);
  ctx.stroke();

  // 7. Cabeça de Bloco de Cantaria Encaixada no Peito
  ctx.fillStyle = stoneDark;
  ctx.fillRect(-R_m * 0.28, -R_m * 0.78, R_m * 0.56, R_m * 0.42);
  ctx.strokeStyle = stoneLight;
  ctx.lineWidth = 1.8;
  ctx.strokeRect(-R_m * 0.28, -R_m * 0.78, R_m * 0.56, R_m * 0.42);

  // Fenda Visor com Olhos de Fogo
  ctx.fillStyle = isGolemWindup ? '#ff2222' : runeGlow;
  ctx.fillRect(-R_m * 0.2, -R_m * 0.62, R_m * 0.4, 4);

  // 8. Braços Assimétricos: Coluna Romana e Punho de Laje Quadrada
  const fistBob = Math.sin(frameCount * 0.1) * (R_m * 0.22);
  const f1Y = isGolemWindup ? (-R_m * 0.65) : (isGolemStrike ? (R_m * 0.55) : (fistBob + 2));
  const f1X = isGolemWindup ? (-R_m * 0.45) : (isGolemStrike ? (R_m * 1.05) : (-R_m * 1.15));
  const f2Y = isGolemWindup ? (-R_m * 0.55) : (isGolemStrike ? (R_m * 0.55) : (-fistBob + 2));
  const f2X = isGolemWindup ? (R_m * 0.65) : (isGolemStrike ? (R_m * 1.35) : (R_m * 1.15));

  // Braço esquerdo: Coluna canelada
  ctx.fillStyle = stoneBase;
  ctx.fillRect(f1X - 6, f1Y - 12, 12, 24);
  ctx.strokeStyle = stoneDark;
  ctx.lineWidth = 1.8;
  ctx.strokeRect(f1X - 6, f1Y - 12, 12, 24);

  // Braço direito: Laje quadrada de calçamento com rebites
  ctx.fillStyle = stoneLight;
  ctx.fillRect(f2X - 10, f2Y - 10, 20, 20);
  ctx.strokeStyle = stoneDark;
  ctx.lineWidth = 2.4;
  ctx.strokeRect(f2X - 10, f2Y - 10, 20, 20);

  // Pregos de ferro na laje
  ctx.fillStyle = rebarIron;
  ctx.fillRect(f2X - 6, f2Y - 6, 3, 3);
  ctx.fillRect(f2X + 3, f2Y - 6, 3, 3);
  ctx.fillRect(f2X - 6, f2Y + 3, 3, 3);
  ctx.fillRect(f2X + 3, f2Y + 3, 3, 3);

  // Impacto Sísmico de Golpe no STRIKE
  if (isGolemStrike) {
    ctx.save();
    ctx.strokeStyle = 'rgba(230, 126, 34, 0.95)';
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.ellipse(R_m * 1.15, R_m * 0.5, R_m * 0.95, R_m * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(243, 156, 18, 0.45)';
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Renderiza a animação de morte em 3 fases de Golem Pétreo.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Fragmentação monolítica: corpo se parte em 4 blocos que despencam em direções opostas
  ctx.translate(0, t * 10);
  const splitDist = t * 12;

  // 4 Blocos de cantaria se separando
  ctx.fillStyle = '#2d3436';
  ctx.fillRect(-R * 0.85 - splitDist, -R * 0.6 - splitDist * 0.5, R * 0.75, R * 0.6);
  ctx.fillRect(splitDist * 0.5, -R * 0.6 - splitDist * 0.5, R * 0.75, R * 0.6);
  ctx.fillRect(-R * 0.85 - splitDist * 0.5, splitDist * 0.4, R * 0.75, R * 0.6);
  ctx.fillRect(splitDist, splitDist * 0.4, R * 0.75, R * 0.6);

  // Vergalhões de ferro torcidos
  ctx.strokeStyle = '#7f8c8d';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-R * 0.5, -R * 0.3);
  ctx.lineTo(-R * 0.9 - splitDist, -R * 0.7);
  ctx.moveTo(R * 0.5, -R * 0.3);
  ctx.lineTo(R * 0.9 + splitDist, -R * 0.7);
  ctx.stroke();

  // Crânios do ossário rolando
  ctx.fillStyle = '#dfe4ea';
  ctx.beginPath();
  ctx.arc(-splitDist * 0.8, -splitDist * 0.6, 3.8, 0, Math.PI * 2);
  ctx.arc(splitDist * 0.8, -splitDist * 0.4, 3.8, 0, Math.PI * 2);
  ctx.fill();

  // Poeira de impacto no solo
  if (t > 0.35) {
    ctx.fillStyle = 'rgba(127, 140, 141, 0.6)';
    for (let d = 0; d < 5; d++) {
      const da = d * 1.25 + t * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(da) * (splitDist + 8), R * 0.4 + Math.sin(da) * 5, 4 + d, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
