/**
 * src/render/enemies/cryptWeaverRenderer.js
 * 
 * Renderizador procedural modular de Tecelã das Criptas (CRYPT_WEAVER).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Tecelã das Criptas.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 11. TECELÃ DAS CATACUMBAS - Quimera aracnídea fundida a crânio e mortalhas
  // =========================================================================
  const R_m = e.radius;
  const isHit = e.hitFlash > 0;
  const skullBone = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#95a5a6');
  const shroudCloth = isHit ? '#ffffff' : '#3d3d3d';
  const legColor = isHit ? '#ffffff' : '#1e272e';
  const legCycle = Math.sin(frameCount * 0.22);

  // 1. Seis Patas com Fêmures Nodosos e Cerdas Rígidas
  ctx.strokeStyle = legColor;
  ctx.lineWidth = 2.4;
  for (let leg = 0; leg < 3; leg++) {
    const lAngle = (leg - 1) * 0.48;
    const lPhase = (leg % 2 === 0 ? 1 : -1) * legCycle * 4;

    // Pata superior
    ctx.beginPath();
    ctx.moveTo(0, -R_m * 0.25);
    ctx.lineTo(Math.cos(lAngle - 1.2) * (R_m * 0.85), -R_m * 0.75 + lPhase);
    ctx.lineTo(Math.cos(lAngle - 1.2) * (R_m * 1.45), -R_m * 0.45 + lPhase * 0.5);
    ctx.stroke();

    // Cerdas pretas na tíbia
    ctx.fillStyle = '#111111';
    ctx.fillRect(Math.cos(lAngle - 1.2) * (R_m * 0.85) - 1, -R_m * 0.75 + lPhase - 2, 2.5, 4);

    // Pata inferior
    ctx.beginPath();
    ctx.moveTo(0, R_m * 0.25);
    ctx.lineTo(Math.cos(lAngle + 1.2) * (R_m * 0.85), R_m * 0.75 - lPhase);
    ctx.lineTo(Math.cos(lAngle + 1.2) * (R_m * 1.45), R_m * 0.45 - lPhase * 0.5);
    ctx.stroke();
    ctx.fillRect(Math.cos(lAngle + 1.2) * (R_m * 0.85) - 1, R_m * 0.75 - lPhase - 2, 2.5, 4);
  }

  // 2. Abdômen Traseiro Envolto em Tiras de Mortalha Fúnebre
  ctx.fillStyle = shroudCloth;
  ctx.beginPath();
  ctx.ellipse(-R_m * 0.52, 0, R_m * 0.72, R_m * 0.58, 0, 0, Math.PI * 2);
  ctx.fill();

  // Faixas e nós de mortalha
  ctx.strokeStyle = '#bdc3c7';
  ctx.lineWidth = 1.4;
  for (let sh = 0; sh < 3; sh++) {
    const sx = -R_m * 0.78 + sh * (R_m * 0.28);
    ctx.beginPath();
    ctx.moveTo(sx, -R_m * 0.45);
    ctx.lineTo(sx + 5, R_m * 0.45);
    ctx.stroke();
  }

  // Fiandeiras de espículas ósseas na ponta traseira
  ctx.fillStyle = skullBone;
  ctx.beginPath();
  ctx.moveTo(-R_m * 1.15, -3);
  ctx.lineTo(-R_m * 1.35, 0);
  ctx.lineTo(-R_m * 1.15, 3);
  ctx.closePath();
  ctx.fill();

  // 3. Cefalotórax Esculpido como Crânio Humano Invertido
  const cX = R_m * 0.22;
  ctx.fillStyle = skullBone;
  ctx.beginPath();
  ctx.ellipse(cX, 0, R_m * 0.45, R_m * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2d3436';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Órbitas oculares do crânio com aglomerado de 6 olhos vermelhos
  ctx.fillStyle = '#080808';
  ctx.beginPath();
  ctx.arc(cX + 2, -R_m * 0.18, 4.2, 0, Math.PI * 2);
  ctx.arc(cX + 2, R_m * 0.18, 4.2, 0, Math.PI * 2);
  ctx.fill();

  // Olhos vermelhos no fundo das órbitas
  ctx.fillStyle = '#ff1744';
  ctx.fillRect(cX + 1, -R_m * 0.22, 2.2, 2.2);
  ctx.fillRect(cX + 3, -R_m * 0.14, 2.2, 2.2);
  ctx.fillRect(cX + 1, R_m * 0.14, 2.2, 2.2);
  ctx.fillRect(cX + 3, R_m * 0.22, 2.2, 2.2);
}

/**
 * Renderiza a animação de morte em 3 fases de Tecelã das Criptas.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Crânio parte-se, 8 patas se curvam para dentro em espasmo e corpo vira
  ctx.translate(0, t * 10);
  ctx.rotate(t * 0.5);

  // Crânio partindo ao meio
  ctx.fillStyle = '#95a5a6';
  ctx.beginPath();
  ctx.arc(R * 0.2 - t * 4, 0, R * 0.38, 0, Math.PI * 2);
  ctx.arc(R * 0.2 + t * 4, 0, R * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Patas aracnídeas encolhendo em espasmo
  ctx.strokeStyle = '#1e272e';
  ctx.lineWidth = 2.0;
  for (let lp = -1; lp <= 1; lp += 2) {
    ctx.beginPath();
    ctx.moveTo(0, lp * R * 0.2);
    ctx.lineTo(-R * 0.6 * (1 - t * 0.7), lp * R * 0.6 * (1 - t * 0.7));
    ctx.stroke();
  }
}
