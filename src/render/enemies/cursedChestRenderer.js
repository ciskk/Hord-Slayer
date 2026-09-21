/**
 * src/render/enemies/cursedChestRenderer.js
 * 
 * Renderizador procedural modular de Baú Amaldiçoado (CURSED_CHEST).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Baú Amaldiçoado.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 24. MÍMICO DE ÉTER - Relicário amaldiçoado com presas de madeira e raízes
  // =========================================================================
  const R_m = e.radius;
  const isHit = e.hitFlash > 0;
  const woodOak = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#3e2718');
  const woodDark = isHit ? '#ffffff' : '#1e120a';
  const brassTrim = isHit ? '#ffffff' : '#d4af37';
  const rootColor = isHit ? '#ffffff' : '#140c06';
  const isAwake = e.isAwakeMimic;

  if (!isAwake) {
    // === MODO DISFARÇADO: Baú com Olho Secreto na Fechadura ===
    const breathe = Math.sin(frameCount * 0.12) * 1.0;

    // Pranchas de carvalho negro
    ctx.fillStyle = woodOak;
    ctx.fillRect(-R_m * 0.75, -R_m * 0.55 + breathe, R_m * 1.5, R_m * 1.1);

    // Veios de madeira entalhados
    ctx.strokeStyle = woodDark;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-R_m * 0.75, breathe);
    ctx.lineTo(R_m * 0.75, breathe);
    ctx.stroke();

    // Cantoneiras de ferro rebitadas nos cantos
    ctx.fillStyle = '#2f3542';
    ctx.fillRect(-R_m * 0.75, -R_m * 0.55 + breathe, 6, 6);
    ctx.fillRect(R_m * 0.75 - 6, -R_m * 0.55 + breathe, 6, 6);
    ctx.fillRect(-R_m * 0.75, R_m * 0.55 - 6 + breathe, 6, 6);
    ctx.fillRect(R_m * 0.75 - 6, R_m * 0.55 - 6 + breathe, 6, 6);

    // Tranca pesada de bronze
    ctx.fillStyle = brassTrim;
    ctx.fillRect(-4, -4 + breathe, 8, 8);

    // Olho secreto piscando na fresta da fechadura
    const blink = Math.sin(frameCount * 0.08);
    if (blink > 0.4) {
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(-1.5, -2 + breathe, 3, 4);
    } else {
      ctx.fillStyle = '#111111';
      ctx.fillRect(-1, -1.5 + breathe, 2, 3);
    }
  } else {
    // === MODO DESPERTO: Bocarra cavernosa com presas de madeira e patas ===
    const bite = Math.sin(frameCount * 0.38) * 5;
    const tongueWave = Math.sin(frameCount * 0.3) * 6;

    // 1. Quatro Patas de Raízes e Vigas Lascadas Galopando
    ctx.strokeStyle = rootColor;
    ctx.lineWidth = 3.2;
    for (let leg = -1; leg <= 1; leg += 2) {
      const lWave = Math.sin(frameCount * 0.35 + leg) * 6;
      // Pata Dianteira
      ctx.beginPath();
      ctx.moveTo(leg * (R_m * 0.4), R_m * 0.45);
      ctx.lineTo(leg * (R_m * 0.7) + lWave, R_m * 0.85);
      ctx.lineTo(leg * (R_m * 0.85) + lWave, R_m * 1.25);
      ctx.stroke();
      // Pata Traseira
      ctx.beginPath();
      ctx.moveTo(-leg * (R_m * 0.4), R_m * 0.45);
      ctx.lineTo(-leg * (R_m * 0.7) - lWave, R_m * 0.85);
      ctx.lineTo(-leg * (R_m * 0.85) - lWave, R_m * 1.25);
      ctx.stroke();
    }

    // 2. Base Inferior do Baú com Dentes de Pregos Enferrujados
    ctx.fillStyle = woodOak;
    ctx.fillRect(-R_m * 0.75, 0, R_m * 1.5, R_m * 0.65);
    ctx.strokeStyle = woodDark;
    ctx.lineWidth = 2.2;
    ctx.strokeRect(-R_m * 0.75, 0, R_m * 1.5, R_m * 0.65);

    // Dentes inferiores de madeira lascada
    ctx.fillStyle = '#f5f6fa';
    for (let dt = 0; dt < 5; dt++) {
      const dtx = -R_m * 0.6 + dt * (R_m * 0.3);
      ctx.beginPath();
      ctx.moveTo(dtx, 0);
      ctx.lineTo(dtx + 3, -6);
      ctx.lineTo(dtx + 6, 0);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Garganta Profunda e Língua Muscular Bifurcada
    ctx.fillStyle = '#4a0033';
    ctx.fillRect(-R_m * 0.6, -4, R_m * 1.2, 8);

    // Língua grossa chicoteante
    ctx.fillStyle = '#ff4757';
    ctx.beginPath();
    ctx.moveTo(R_m * 0.2, -2);
    ctx.quadraticCurveTo(R_m * 0.8, -4 + tongueWave, R_m * 1.45, tongueWave);
    ctx.lineTo(R_m * 1.25, 3 + tongueWave);
    ctx.lineTo(R_m * 0.2, 3);
    ctx.closePath();
    ctx.fill();

    // 4. Tampa Superior Escancarada em Ângulo com Dentes Superiores
    ctx.save();
    ctx.translate(-R_m * 0.65, -2);
    ctx.rotate(-0.62 + bite * 0.05);

    ctx.fillStyle = woodOak;
    ctx.fillRect(0, -R_m * 0.6, R_m * 1.45, R_m * 0.6);
    ctx.strokeStyle = woodDark;
    ctx.lineWidth = 2.0;
    ctx.strokeRect(0, -R_m * 0.6, R_m * 1.45, R_m * 0.6);

    // Dentes superiores pontiagudos
    ctx.fillStyle = '#f5f6fa';
    for (let dt = 0; dt < 5; dt++) {
      const dtx = 4 + dt * (R_m * 0.28);
      ctx.beginPath();
      ctx.moveTo(dtx, 0);
      ctx.lineTo(dtx + 3.5, 7);
      ctx.lineTo(dtx + 7, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * Renderiza a animação de morte em 3 fases de Baú Amaldiçoado.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Tábuas de carvalho se partem, dentes e dobradiças saltam e língua derrete
  ctx.translate(0, t * 8);
  ctx.scale(1 + t * 0.2, Math.max(0.08, 1 - t * 0.85));

  // Tábuas partindo
  ctx.fillStyle = '#3e2718';
  ctx.fillRect(-R * 0.8 - t * 8, -R * 0.35, R * 0.75, R * 0.65);
  ctx.fillRect(t * 8, -R * 0.35, R * 0.75, R * 0.65);

  // Dentes e pregos espalhados
  ctx.fillStyle = '#dfe4ea';
  for (let n = 0; n < 5; n++) {
    const na = n * 1.25 + t * 3;
    ctx.fillRect(Math.cos(na) * (R * 0.8) - 2, Math.sin(na) * (R * 0.8) - 2, 4, 4);
  }
}
