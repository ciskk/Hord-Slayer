/**
 * src/render/enemies/splitterRenderer.js
 * 
 * Renderizador procedural modular de Verme Divisor (SPLITTER).
 */
import { ctx, frameCount } from '../../main.js';

/**
 * Renderiza a forma viva de Verme Divisor.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // =========================================================================
  // 8 & 9. PARASITA DIVISOR & CÉLULA - Carapaça clivada e larva sanguessuga
  // =========================================================================
  const R_m = e.radius;
  const isMini = e.baseType === 'SPLITTER_MINI';
  const isSplitterStrike = e.combatState === 'STRIKE';
  const isHit = e.hitFlash > 0;

  if (isMini) {
    // === 9. PARASITA CÉLULA: Larva sanguessuga anelada com boca circular ===
    const contract = Math.sin(frameCount * 0.32) * 2.5;
    const fleshColor = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#006266');
    const bellyBlood = isHit ? '#ffffff' : '#8b0000';

    // 5 Anéis Musculares Carnosos (Squash & Stretch)
    for (let ring = 4; ring >= 0; ring--) {
      const rx = -R_m * 0.45 * ring + contract * 0.4;
      const rSize = R_m * (0.85 - ring * 0.12);
      ctx.fillStyle = ring >= 2 ? bellyBlood : fleshColor;
      ctx.beginPath();
      ctx.ellipse(rx, 0, rSize, rSize * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#004d40';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Ventosa Bucal Circular Aberta com Dentes Espirais (Gape dinâmico no salto)
    const isAirborne = (e.jumpZ || 0) > 0;
    const gapeMult = isAirborne ? 1.4 : 1.0;
    ctx.fillStyle = isAirborne ? '#2d0c1e' : '#1e0810';
    ctx.beginPath();
    ctx.ellipse(R_m * 0.35, 0, R_m * 0.45 * gapeMult, R_m * 0.55 * gapeMult, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3 Espinhos Córneos Afiados na Ventosa
    ctx.fillStyle = isAirborne ? '#ffffff' : '#f5f6fa';
    ctx.fillRect(R_m * 0.32, -4 * gapeMult, 2.5, 3);
    ctx.fillRect(R_m * 0.32, 2 * gapeMult, 2.5, 3);
    ctx.fillRect(R_m * (0.48 * gapeMult), -1, 3, 2.5);

    // Brilho predatório cáustico dentro da goela durante o bote
    if (isAirborne || e.leapState === 'windup') {
      ctx.fillStyle = '#00cec9';
      ctx.beginPath();
      ctx.arc(R_m * 0.28, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ganchos Ventrais Curtos
    ctx.strokeStyle = '#00a884';
    ctx.lineWidth = 1.5;
    for (let g = 0; g < 3; g++) {
      const gx = -R_m * 0.4 * g;
      ctx.beginPath();
      ctx.moveTo(gx, R_m * 0.4);
      ctx.lineTo(gx - 3, R_m * 0.75);
      ctx.stroke();
    }
  } else {
    // === 8. PARASITA DIVISOR: Carapaça clivada ao meio com sutura de carne ===
    const chitinDark = isHit ? '#ffffff' : (e.slowTimer > 0 ? '#74b9ff' : '#042825');
    const chitinMid = isHit ? '#ffffff' : '#08483f';
    const rawFlesh = isHit ? '#ffffff' : '#b33939';
    const podColor = 'rgba(0, 206, 201, 0.42)';

    // 1. Seis Pernas Artrópodes Articuladas (Coxa, Tíbia, Tarso)
    ctx.strokeStyle = isHit ? '#ffffff' : '#0e6251';
    ctx.lineWidth = 2.4;
    for (let p = 0; p < 3; p++) {
      const stepA = Math.sin(frameCount * 0.24 + p * 1.4) * 6;
      const px = -R_m * 0.35 + p * (R_m * 0.45);
      // Superior
      ctx.beginPath();
      ctx.moveTo(px, -R_m * 0.25);
      ctx.lineTo(px - 4, -R_m * 0.85 + stepA);
      ctx.lineTo(px + 4, -R_m * 1.35 + stepA);
      ctx.stroke();
      // Inferior
      ctx.beginPath();
      ctx.moveTo(px, R_m * 0.25);
      ctx.lineTo(px - 4, R_m * 0.85 - stepA);
      ctx.lineTo(px + 4, R_m * 1.35 - stepA);
      ctx.stroke();
    }

    // 2. Carapaça Bipartida: Placa Superior e Placa Inferior
    // Placa Dorsal Superior
    ctx.fillStyle = chitinMid;
    ctx.beginPath();
    ctx.ellipse(-R_m * 0.2, -R_m * 0.28, R_m * 0.7, R_m * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = chitinDark;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Placa Dorsal Inferior
    ctx.fillStyle = chitinMid;
    ctx.beginPath();
    ctx.ellipse(-R_m * 0.2, R_m * 0.28, R_m * 0.7, R_m * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3. A Sutura Longitudinal de Clivagem (Carne viva se rasgando ao meio)
    ctx.fillStyle = rawFlesh;
    ctx.fillRect(-R_m * 0.8, -3, R_m * 1.25, 6);

    // Fibras elásticas esticadas cruzando a sutura
    ctx.strokeStyle = '#ff6b81';
    ctx.lineWidth = 1.6;
    for (let f = 0; f < 4; f++) {
      const fx = -R_m * 0.7 + f * (R_m * 0.3);
      ctx.beginPath();
      ctx.moveTo(fx, -4);
      ctx.lineTo(fx + 3, 4);
      ctx.stroke();
    }

    // 4. Casulos de Ninhada no Dorso Traseiro com Silhuetas
    ctx.fillStyle = podColor;
    ctx.beginPath();
    ctx.arc(-R_m * 0.55, -R_m * 0.2, 5, 0, Math.PI * 2);
    ctx.arc(-R_m * 0.55, R_m * 0.2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(-R_m * 0.58, -R_m * 0.22, 2.5, 2.5);
    ctx.fillRect(-R_m * 0.58, R_m * 0.18, 2.5, 2.5);

    // 5. Três Quelíceras Mandibulares Articuladas
    const pinch = Math.sin(frameCount * 0.25) * 3.5;
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.moveTo(R_m * 0.45, -R_m * 0.28);
    ctx.lineTo(R_m * 1.1, -pinch);
    ctx.lineTo(R_m * 0.45, 0);
    ctx.lineTo(R_m * 1.1, pinch);
    ctx.lineTo(R_m * 0.45, R_m * 0.28);
    ctx.closePath();
    ctx.fill();

    // Gota de ácido das quelíceras
    ctx.fillStyle = '#00cec9';
    ctx.fillRect(R_m * 1.05, -1, 2.5, 3.5);
  }
}

/**
 * Renderiza a animação de morte em 3 fases de Verme Divisor.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  // Sutura dorsal racha ao meio, cascas se separam e ejetam gosma e vesículas
  const burst = t < 0.3 ? (1 + t * 1.8) : Math.max(0.05, 1.54 - (t - 0.3) * 2.1);
  ctx.scale(burst, burst);

  // Duas metades da carapaça se afastando
  ctx.fillStyle = '#08483f';
  ctx.beginPath();
  ctx.ellipse(-R * 0.35, -t * 12, R * 0.6, R * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-R * 0.35, t * 12, R * 0.6, R * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Projeção de fluido verde e vesículas
  ctx.fillStyle = '#2ecc71';
  for (let sl = 0; sl < 6; sl++) {
    const sa = sl * (Math.PI * 2 / 6) + t * 2.8;
    const sDist = R * (0.6 + t * 1.8);
    ctx.fillRect(Math.cos(sa) * sDist - 2.5, Math.sin(sa) * sDist - 2.5, 5, 5);
  }
}
