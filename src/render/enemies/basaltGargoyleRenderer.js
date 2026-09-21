/**
 * src/render/enemies/basaltGargoyleRenderer.js
 * 
 * Renderizador procedural modular de Gárgula Basáltica (BASALT_GARGOYLE).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Gárgula Basáltica.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 13. GÁRGULA DE BASALTO - Carranca gótica de cantaria monolítica e chifres
  // =========================================================================
  const R_m = e.radius;
  const isHit = e.hitFlash > 0;
  const stoneMain = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : (e.isStoneForm ? '#95a5a6' : '#57606f'));
  const stoneDark = isHit ? '#ffffff' : '#2f3542';
  const stoneDeep = isHit ? '#ffffff' : '#1e272e';
  const magmaVein = isHit ? '#ffffff' : '#e67e22';

  if (e.isStoneForm) {
    // === MODO ESTÁTUA: Altar Monolítico Fechado com Cruz Imperial Quebrada ===
    ctx.fillStyle = stoneMain;
    ctx.beginPath();
    ctx.moveTo(-R_m * 0.75, -R_m * 0.95);
    ctx.lineTo(R_m * 0.75, -R_m * 0.95);
    ctx.lineTo(R_m * 0.85, R_m * 0.85);
    ctx.lineTo(-R_m * 0.85, R_m * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = stoneDeep;
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // Asas fechadas formando a face do altar
    ctx.fillStyle = stoneDark;
    ctx.beginPath();
    ctx.moveTo(-R_m * 0.65, -R_m * 0.85);
    ctx.lineTo(0, R_m * 0.65);
    ctx.lineTo(-R_m * 0.7, R_m * 0.75);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(R_m * 0.65, -R_m * 0.85);
    ctx.lineTo(0, R_m * 0.65);
    ctx.lineTo(R_m * 0.7, R_m * 0.75);
    ctx.closePath();
    ctx.fill();

    // Cruz Imperial Quebrada Esculpida
    ctx.strokeStyle = magmaVein;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -R_m * 0.65);
    ctx.lineTo(0, R_m * 0.45);
    ctx.moveTo(-R_m * 0.35, -R_m * 0.2);
    ctx.lineTo(R_m * 0.35, -R_m * 0.2);
    ctx.stroke();
  } else {
    // === MODO VOO: Carranca Gótica com Asas de Acanto e Chifres Espiralados ===
    const wingFlap = Math.sin(frameCount * 0.32) * (R_m * 0.48);

    // 1. Asas Esculpidas em Folhas de Acanto com Nervuras de Pedra
    for (let side = -1; side <= 1; side += 2) {
      ctx.fillStyle = stoneDark;
      ctx.beginPath();
      ctx.moveTo(0, -R_m * 0.2);
      // Cotovelo da asa
      const elbowX = side * (R_m * 1.1);
      const elbowY = -R_m * 0.95 + wingFlap * 0.6;
      // Pontas em folha de acanto
      const tipX = side * (R_m * 1.75);
      const tipY = -R_m * 0.8 + wingFlap;
      ctx.lineTo(elbowX, elbowY);
      ctx.lineTo(tipX, tipY);
      ctx.quadraticCurveTo(side * (R_m * 1.4), 0 + wingFlap * 0.5, side * (R_m * 1.1), R_m * 0.4);
      ctx.quadraticCurveTo(side * (R_m * 0.6), R_m * 0.2, 0, R_m * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = stoneDeep;
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Garra de cantaria no cotovelo alar
      ctx.fillStyle = stoneMain;
      ctx.beginPath();
      ctx.moveTo(elbowX, elbowY);
      ctx.lineTo(elbowX + side * 4, elbowY - 4);
      ctx.lineTo(elbowX + side * 1, elbowY + 3);
      ctx.closePath();
      ctx.fill();
    }

    // 2. Torso Bestial Leonino com Costelas Esculpidas
    ctx.fillStyle = stoneMain;
    ctx.beginPath();
    ctx.moveTo(-R_m * 0.45, -R_m * 0.3);
    ctx.quadraticCurveTo(0, -R_m * 0.4, R_m * 0.45, -R_m * 0.3);
    ctx.lineTo(R_m * 0.3, R_m * 0.6);
    ctx.lineTo(-R_m * 0.3, R_m * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = stoneDeep;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Costelas entalhadas no basalto
    ctx.strokeStyle = stoneDeep;
    ctx.lineWidth = 1.4;
    for (let r = 0; r < 3; r++) {
      const ry = -R_m * 0.1 + r * (R_m * 0.18);
      ctx.beginPath();
      ctx.moveTo(-R_m * 0.28, ry);
      ctx.lineTo(R_m * 0.28, ry);
      ctx.stroke();
    }

    // 3. Cabeça de Carranca com Chifres Espiralados de Bode
    const hY = -R_m * 0.52;
    ctx.fillStyle = stoneMain;
    ctx.beginPath();
    ctx.arc(0, hY, R_m * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = stoneDeep;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Chifres espiralados de cantaria
    for (let ch = -1; ch <= 1; ch += 2) {
      ctx.fillStyle = stoneDark;
      ctx.beginPath();
      ctx.moveTo(ch * (R_m * 0.2), hY - R_m * 0.2);
      ctx.quadraticCurveTo(ch * (R_m * 0.65), hY - R_m * 0.85, ch * (R_m * 0.85), hY - R_m * 0.45);
      ctx.lineTo(ch * (R_m * 0.55), hY - R_m * 0.35);
      ctx.closePath();
      ctx.fill();
    }

    // Focinho e Presas de Cantaria
    ctx.fillStyle = stoneDeep;
    ctx.fillRect(-R_m * 0.18, hY + 2, R_m * 0.36, 4);

    ctx.fillStyle = '#dfe4ea';
    ctx.fillRect(-R_m * 0.15, hY + 3, 2.5, 3);
    ctx.fillRect(R_m * 0.05, hY + 3, 2.5, 3);

    // Olhos de Brasa Vulcânica
    ctx.fillStyle = magmaVein;
    ctx.fillRect(-R_m * 0.2, hY - 4, 3.2, 2.5);
    ctx.fillRect(R_m * 0.05, hY - 4, 3.2, 2.5);
  }
}

/**
 * Renderiza a animação de morte em 3 fases de Gárgula Basáltica.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Veias de magma esfriam para preto, corpo petrifica e quebra em blocos de basalto
  ctx.translate(0, t * 12);
  ctx.scale(1 + t * 0.2, Math.max(0.08, 1 - t * 0.85));

  const stoneCol = t > 0.4 ? '#2f3542' : '#57606f';
  ctx.fillStyle = stoneCol;

  // Asas de pedra partindo
  ctx.fillRect(-R * 1.2 - t * 10, -R * 0.4, R * 0.6, R * 0.5);
  ctx.fillRect(R * 0.6 + t * 10, -R * 0.4, R * 0.6, R * 0.5);

  // Cabeça de cantaria caindo
  ctx.beginPath();
  ctx.arc(0, t * 8, R * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Faíscas de magma esfriando
  if (t < 0.6) {
    ctx.fillStyle = '#e67e22';
    ctx.fillRect((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, 3.5, 3.5);
  }
}
