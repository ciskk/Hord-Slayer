/**
 * src/render/enemies/batRenderer.js
 * 
 * Renderizador procedural modular de Morcego Vampírico (BAT).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Morcego Vampírico.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 1. MORCEGO CARMESIM - Gárgula-quiróptero esquelética com asas bi-articuladas
  // =========================================================================
  const R_m = e.radius;
  const isBatWindup = e.combatState === 'WINDUP';
  const isBatStrike = e.combatState === 'STRIKE';
  const wingCycle = Math.sin(frameCount * (isBatStrike ? 0.68 : 0.42));
  const wingY = wingCycle * (isBatWindup ? 2.8 : 4.8);
  const isHit = e.hitFlash > 0;

  const batFlesh = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#1a111a');
  const batBone = isHit ? '#ffffff' : '#3d1620';
  const membraneColor = isHit ? '#ffffff' : '#780c18';
  const membraneTorn = isHit ? '#ffffff' : '#4a0810';
  const clawColor = isHit ? '#ffffff' : '#dfe4ea';

  if (isBatWindup) {
    ctx.rotate(0.24); // Postura predatória de rasante inclinado
  }

  // 1. Patas Traseiras Atrofiadas Recolhidas com Garras em Foice
  ctx.strokeStyle = batBone;
  ctx.lineWidth = 1.0;
  for (let leg = -1; leg <= 1; leg += 2) {
    const lx = leg * (R_m * 0.28);
    const ly = R_m * 0.38;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + leg * 1.0, ly + R_m * 0.4);
    ctx.lineTo(lx + leg * 2.2, ly + R_m * 0.28);
    ctx.stroke();

    ctx.fillStyle = clawColor;
    ctx.beginPath();
    ctx.arc(lx + leg * 2.2, ly + R_m * 0.28, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Asas Bi-Articuladas com 4 Falanges Alongadas e Membranas Rasgadas
  for (let side = -1; side <= 1; side += 2) {
    const shoulderX = side * (R_m * 0.22);
    const shoulderY = -R_m * 0.15;
    const elbowX = side * (R_m * 0.85);
    const elbowY = -R_m * 0.65 + wingY * 0.45;
    const wristX = side * (R_m * 1.55);
    const wristY = -R_m * 1.1 + wingY;

    // Falanges estendidas da asa
    const f1X = side * (R_m * 2.15);
    const f1Y = -R_m * 0.95 + wingY * 1.15;
    const f2X = side * (R_m * 1.95);
    const f2Y = -R_m * 0.28 + wingY * 0.85;
    const f3X = side * (R_m * 1.45);
    const f3Y = R_m * 0.35 + wingY * 0.6;
    const f4X = side * (R_m * 0.88);
    const f4Y = R_m * 0.62 + wingY * 0.35;

    // Membrana Alar Gótica com Recortes Parabólicos Rasgados
    ctx.fillStyle = membraneColor;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(elbowX, elbowY);
    ctx.lineTo(wristX, wristY);
    ctx.lineTo(f1X, f1Y);
    ctx.quadraticCurveTo(side * (R_m * 1.95), -R_m * 0.55 + wingY, f2X, f2Y);
    ctx.quadraticCurveTo(side * (R_m * 1.6), R_m * 0.05 + wingY * 0.7, f3X, f3Y);
    ctx.quadraticCurveTo(side * (R_m * 1.1), R_m * 0.45 + wingY * 0.45, f4X, f4Y);
    ctx.quadraticCurveTo(side * (R_m * 0.4), R_m * 0.45, side * (R_m * 0.15), R_m * 0.35);
    ctx.closePath();
    ctx.fill();

    // Camada de Sombra das Membranas Rasgadas
    ctx.fillStyle = membraneTorn;
    ctx.beginPath();
    ctx.moveTo(f1X, f1Y);
    ctx.quadraticCurveTo(side * (R_m * 1.85), -R_m * 0.65 + wingY, f2X, f2Y);
    ctx.lineTo(f2X - side * 1.0, f2Y - 1.5);
    ctx.closePath();
    ctx.fill();

    // Nervuras e Falanges Ósseas
    ctx.strokeStyle = batBone;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(elbowX, elbowY);
    ctx.lineTo(wristX, wristY);
    ctx.lineTo(f1X, f1Y);
    ctx.moveTo(wristX, wristY);
    ctx.lineTo(f2X, f2Y);
    ctx.moveTo(wristX, wristY);
    ctx.lineTo(f3X, f3Y);
    ctx.moveTo(wristX, wristY);
    ctx.lineTo(f4X, f4Y);
    ctx.stroke();

    // Veias Escuras Ramificadas na Asa
    ctx.strokeStyle = isHit ? '#ffffff' : '#3d080e';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(elbowX, elbowY);
    ctx.lineTo(side * (R_m * 1.25), -R_m * 0.25 + wingY * 0.65);
    ctx.lineTo(side * (R_m * 1.55), -R_m * 0.15 + wingY * 0.75);
    ctx.stroke();

    // Garra do Polegar no Pulso
    ctx.fillStyle = clawColor;
    ctx.beginPath();
    ctx.moveTo(wristX, wristY);
    ctx.lineTo(wristX + side * 1.8, wristY - 1.8);
    ctx.lineTo(wristX + side * 0.6, wristY + 0.6);
    ctx.closePath();
    ctx.fill();
  }

  // 3. Tronco Esquelético com Caixa Torácica Marcada
  ctx.fillStyle = batFlesh;
  ctx.beginPath();
  ctx.moveTo(0, -R_m * 0.45);
  ctx.quadraticCurveTo(R_m * 0.38, 0, R_m * 0.22, R_m * 0.48);
  ctx.lineTo(-R_m * 0.22, R_m * 0.48);
  ctx.quadraticCurveTo(-R_m * 0.38, 0, 0, -R_m * 0.45);
  ctx.closePath();
  ctx.fill();

  // Costelas Esqueléticas Salientes
  ctx.strokeStyle = isHit ? '#ffffff' : '#2b131e';
  ctx.lineWidth = 0.8;
  for (let r = 0; r < 3; r++) {
    const ry = -R_m * 0.2 + r * (R_m * 0.18);
    ctx.beginPath();
    ctx.moveTo(-R_m * 0.22, ry);
    ctx.lineTo(R_m * 0.22, ry);
    ctx.stroke();
  }

  // 4. Cabeça, Focinho com Pregas Nasais e Orelhas com Tragus
  const headY = -R_m * 0.48;
  ctx.fillStyle = batFlesh;
  ctx.beginPath();
  ctx.ellipse(0, headY, R_m * 0.42, R_m * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();

  // Orelhas Góticas Pontudas com Recorte Interno (Tragus)
  for (let ear = -1; ear <= 1; ear += 2) {
    ctx.fillStyle = batFlesh;
    ctx.beginPath();
    ctx.moveTo(ear * (R_m * 0.2), headY - R_m * 0.15);
    ctx.lineTo(ear * (R_m * 0.58), headY - R_m * 0.95);
    ctx.lineTo(ear * (R_m * 0.42), headY - R_m * 0.45);
    ctx.lineTo(ear * (R_m * 0.08), headY - R_m * 0.25);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isHit ? '#ffffff' : '#52121d';
    ctx.beginPath();
    ctx.moveTo(ear * (R_m * 0.25), headY - R_m * 0.25);
    ctx.lineTo(ear * (R_m * 0.48), headY - R_m * 0.75);
    ctx.lineTo(ear * (R_m * 0.35), headY - R_m * 0.4);
    ctx.closePath();
    ctx.fill();
  }

  // Focinho de Morcego-Vampiro em Ferradura
  ctx.fillStyle = isHit ? '#ffffff' : '#2c0c16';
  ctx.beginPath();
  ctx.arc(0, headY - 0.5, 1.6, -Math.PI * 0.85, -Math.PI * 0.15);
  ctx.stroke();

  // Olhos Rubis Incandescentes
  ctx.fillStyle = (isBatWindup || isBatStrike) ? '#ffffff' : '#ff1744';
  ctx.fillRect(-R_m * 0.22, headY - 1.5, 1.5, 1.2);
  ctx.fillRect(R_m * 0.06, headY - 1.5, 1.5, 1.2);

  // Boca Aberta e Presas Longas Curvadas para Baixo
  ctx.fillStyle = '#080104';
  ctx.fillRect(-R_m * 0.2, headY + 1.2, R_m * 0.4, 1.6);

  ctx.fillStyle = clawColor;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.18, headY + 1.2);
  ctx.lineTo(-R_m * 0.14, headY + 3.8);
  ctx.lineTo(-R_m * 0.08, headY + 1.2);
  ctx.moveTo(R_m * 0.08, headY + 1.2);
  ctx.lineTo(R_m * 0.14, headY + 3.8);
  ctx.lineTo(R_m * 0.18, headY + 1.2);
  ctx.fill();

  // Ondas Ultrassônicas no STRIKE
  if (isBatStrike) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 71, 87, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(R_m * 0.6, 0, R_m * 0.75, -0.65, 0.65);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(R_m * 1.0, 0, R_m * 1.15, -0.55, 0.55);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Renderiza a animação de morte em 3 fases de Morcego Vampírico.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Falanges travam, mergulho em espiral com rotação acelerada e névoa carmesim
  ctx.translate(0, t * 10);
  ctx.rotate(t * 1.4);
  ctx.scale(Math.max(0.05, 1 - t * 0.7), Math.max(0.05, 1 - t * 0.8));

  // Membranas murchando
  ctx.fillStyle = '#4a0810';
  ctx.beginPath();
  ctx.moveTo(-R * 1.5 * (1 - t * 0.6), -R * 0.5);
  ctx.lineTo(0, -R * 0.2);
  ctx.lineTo(R * 1.5 * (1 - t * 0.6), -R * 0.5);
  ctx.lineTo(0, R * 0.4);
  ctx.closePath();
  ctx.fill();

  // Esqueleto de morcego quebrado
  ctx.strokeStyle = '#2b131e';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(-R * 1.1 * (1 - t * 0.5), -R * 0.4);
  ctx.lineTo(0, 0);
  ctx.lineTo(R * 1.1 * (1 - t * 0.5), -R * 0.4);
  ctx.stroke();

  // Névoa carmesim dispersando
  if (t > 0.3) {
    ctx.fillStyle = 'rgba(255, 71, 87, 0.65)';
    for (let b = 0; b < 4; b++) {
      const ba = b * 1.57 + t * 2;
      ctx.fillRect(Math.cos(ba) * (R * 0.8 * t) - 1, Math.sin(ba) * (R * 0.8 * t) - 1, 2.5, 2.5);
    }
  }
}
