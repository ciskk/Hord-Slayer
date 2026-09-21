/**
 * src/render/enemies/zombieRenderer.js
 * 
 * Renderizador procedural modular de Zumbi Comum (ZOMBIE).
 */
import { ctx, frameCount } from '../../main.js';
import { player } from '../../entities/player.js';

/**
 * Renderiza a forma viva de Zumbi Comum.
 * O Canvas já está posicionado em (e.x, e.y) e escalado por e.facing.
 * @param {Object} e Entidade do monstro
   */
export function draw(e) {
  // Escala visual de renderização: Zumbi possui porte de antigo humano (90% da altura do player)
  const R_m = e.radius * 1.38;
  const isHit = e.hitFlash > 0;
  const walk = Math.sin(frameCount * 0.16);
  const isAttacking = e.combatState === 'WINDUP' || e.combatState === 'STRIKE';
  const variant = e.variant || 0;

  // Paletas temáticas por variante
  let skinBase = '#52734d';
  let skinShadow = '#31492c';
  let clothMain = '#3a3d40';
  let clothAccent = '#242628';

  if (variant === 1) {
    // Sucateiro Industrial
    skinBase = '#4d5d53';
    skinShadow = '#2d3731';
    clothMain = '#1e272e';
    clothAccent = '#485460';
  } else if (variant === 2) {
    // Contaminado Tóxico
    skinBase = '#2d5a27';
    skinShadow = '#163814';
    clothMain = '#808e9b';
    clothAccent = '#27ae60';
  } else if (variant === 3) {
    // Sentinela Decaído
    skinBase = '#576574';
    skinShadow = '#38424d';
    clothMain = '#5c1926';
    clothAccent = '#2f3542';
  }

  if (isHit) {
    skinBase = '#ffffff';
    skinShadow = '#ffffff';
    clothMain = '#ffffff';
    clothAccent = '#ffffff';
  } else if (e.slowTimer > 0) {
    skinBase = '#74b9ff';
  }

  // 1. Pernas com passada trôpega assimétrica (mancando)
  ctx.fillStyle = clothAccent;
  ctx.fillRect(-R_m * 0.4, R_m * 0.2 + walk * 2.5, 4.2, R_m * 0.7 - walk * 1.8);
  ctx.fillRect(-R_m * 0.1, R_m * 0.25 - walk * 2.2, 4.2, R_m * 0.65 + walk * 1.8);

  // 2. Torso Curvado / Silhueta Corcunda
  ctx.fillStyle = clothMain;
  ctx.beginPath();
  ctx.moveTo(-R_m * 0.65, -R_m * 0.15 + walk * 0.8);
  ctx.lineTo(R_m * 0.1, -R_m * 0.35 + walk * 0.8);
  ctx.lineTo(R_m * 0.3, R_m * 0.4);
  ctx.lineTo(-R_m * 0.45, R_m * 0.45);
  ctx.closePath();
  ctx.fill();

  // Detalhes de Peito por Variante
  if (variant === 0) {
    // Rasgos expondo costelas escuras
    ctx.fillStyle = skinShadow;
    ctx.fillRect(-R_m * 0.25, -R_m * 0.05 + walk * 0.8, 3, 7);
    ctx.fillRect(-R_m * 0.1, R_m * 0.05 + walk * 0.8, 2.5, 5);
  } else if (variant === 1) {
    // Correia de couro diagonal e fivela de sucata
    ctx.strokeStyle = '#8c7b75';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-R_m * 0.45, -R_m * 0.2 + walk * 0.8);
    ctx.lineTo(R_m * 0.15, R_m * 0.35 + walk * 0.8);
    ctx.stroke();
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(-R_m * 0.18, walk * 0.8, 2.5, 2.5);
  } else if (variant === 2) {
    // Veias tóxicas bioluminescentes
    ctx.strokeStyle = isHit ? '#ffffff' : '#2ecc71';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-R_m * 0.3, -R_m * 0.1 + walk * 0.8);
    ctx.lineTo(-R_m * 0.1, R_m * 0.15 + walk * 0.8);
    ctx.lineTo(R_m * 0.1, R_m * 0.05 + walk * 0.8);
    ctx.stroke();
  } else if (variant === 3) {
    // Ombreira de ferro militar no ombro traseiro
    ctx.fillStyle = isHit ? '#ffffff' : '#2f3542';
    ctx.fillRect(-R_m * 0.75, -R_m * 0.35 + walk * 0.8, R_m * 0.5, 4.5);
    ctx.strokeStyle = '#747d8c';
    ctx.lineWidth = 1;
    ctx.strokeRect(-R_m * 0.75, -R_m * 0.35 + walk * 0.8, R_m * 0.5, 4.5);
  }

  // 3. Cabeça e Pescoço Projetados à Frente
  const headX = R_m * 0.22;
  const headY = -R_m * 0.48 + walk * 1.2;

  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.ellipse(headX, headY, R_m * 0.36, R_m * 0.42, 0.18, 0, Math.PI * 2);
  ctx.fill();

  // Mandíbula e Boca Decrépita Aberta
  ctx.fillStyle = '#111111';
  ctx.fillRect(headX + 2, headY + 2, 3, 2.5);

  // Acessórios de Cabeça e Olhos por Variante
  if (variant === 0) {
    // Mechas de cabelo desgrenhado escuro
    ctx.fillStyle = '#1e272e';
    ctx.beginPath();
    ctx.moveTo(headX - 4, headY - 4);
    ctx.lineTo(headX - 1, headY - 6);
    ctx.lineTo(headX + 3, headY - 4);
    ctx.lineTo(headX + 1, headY - 1);
    ctx.fill();
    // Olhos esbranquiçados com ponto vermelho
    ctx.fillStyle = '#dfe4ea';
    ctx.fillRect(headX + 1.5, headY - 2, 2.5, 2.2);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(headX + 2.5, headY - 1.5, 1.2, 1.2);
  } else if (variant === 1) {
    // Chapa de ferro rebitada na testa
    ctx.fillStyle = isHit ? '#ffffff' : '#57606f';
    ctx.fillRect(headX - 3.5, headY - 5, 7.5, 3);
    ctx.fillStyle = '#2f3542';
    ctx.fillRect(headX - 2.5, headY - 4.2, 1.5, 1.5);
    ctx.fillRect(headX + 1.5, headY - 4.2, 1.5, 1.5);
    // Olho cibernético amarelado vivo
    ctx.fillStyle = isHit ? '#ffffff' : '#f1c40f';
    ctx.fillRect(headX + 2, headY - 1.5, 2.5, 2.2);
  } else if (variant === 2) {
    // Pústula de fungo/bioquímica pulsante na calota craniana
    const sporePulse = Math.sin(frameCount * 0.22) * 1.2;
    ctx.fillStyle = isHit ? '#ffffff' : '#2ecc71';
    ctx.beginPath();
    ctx.arc(headX - 1, headY - 5, Math.max(1, 2.8 + sporePulse), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a8e6cf';
    ctx.fillRect(headX - 1.5, headY - 5.5, 1.5, 1.5);
    // Olho leitoso esverdeado
    ctx.fillStyle = '#2ed573';
    ctx.fillRect(headX + 2, headY - 1.5, 2.2, 2);
  } else if (variant === 3) {
    // Capacete/Barrete de guarda amassado
    ctx.fillStyle = isHit ? '#ffffff' : '#2f3542';
    ctx.beginPath();
    ctx.moveTo(headX - 4.5, headY - 2.5);
    ctx.lineTo(headX + 5, headY - 4.5);
    ctx.lineTo(headX + 1, headY - 7);
    ctx.lineTo(headX - 3.5, headY - 6);
    ctx.closePath();
    ctx.fill();
    // Fresta de visão sombria com olhos vermelhos
    ctx.fillStyle = '#ff4757';
    ctx.fillRect(headX + 1.5, headY - 1.5, 2.8, 1.8);
  }

  // 4. Braços e Garras (Postura Dinâmica reativa a WINDUP e STRIKE)
  const armWindup = e.combatState === 'WINDUP';
  const armStrike = e.combatState === 'STRIKE';
  const baseReach = isAttacking ? R_m * 1.05 : R_m * 0.72;
  const reach1 = baseReach + (armStrike ? 6 : (armWindup ? -3 : 0));
  const reach2 = baseReach * 0.75 + (armStrike ? 4 : (armWindup ? -2 : 0));
  const lift1 = armWindup ? -R_m * 0.45 : (walk * 2.2);
  const lift2 = armWindup ? -R_m * 0.30 : (-walk * 1.8);

  // Braço Traseiro / Secundário
  ctx.fillStyle = skinShadow;
  ctx.fillRect(-R_m * 0.1, -R_m * 0.1 + lift2, reach2, 2.8);
  ctx.fillStyle = '#111111';
  ctx.fillRect(-R_m * 0.1 + reach2, -R_m * 0.1 + lift2 - 0.5, 2.2, 3.8);

  // Braço Principal Estendido para a Frente
  ctx.fillStyle = skinBase;
  ctx.fillRect(R_m * 0.05, -R_m * 0.22 + lift1, reach1, 3.4);

  if (variant === 1) {
    // Manopla de sucata amarrada no antebraço
    ctx.fillStyle = isHit ? '#ffffff' : '#747d8c';
    ctx.fillRect(R_m * 0.15, -R_m * 0.25 + lift1, reach1 * 0.5, 4.2);
  }

  // Mão e garras pontiagudas afiadas
  ctx.fillStyle = '#1e272e';
  ctx.fillRect(R_m * 0.05 + reach1, -R_m * 0.22 + lift1 - 1, 3.2, 5.2);
  ctx.fillStyle = armWindup ? '#ff4757' : '#dfe4ea';
  ctx.fillRect(R_m * 0.05 + reach1 + 2.5, -R_m * 0.22 + lift1, 1.5, 1.5);
  ctx.fillRect(R_m * 0.05 + reach1 + 2.5, -R_m * 0.22 + lift1 + 2.5, 1.5, 1.5);

  // Efeito Visual de Golpe: Rastro em Arco de Garras (Claw Swipe Ribbon Otimizado)
  if (armStrike) {
    ctx.strokeStyle = 'rgba(255, 71, 87, 0.85)';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(R_m * 0.3, 0, R_m * 1.25, -Math.PI * 0.38, Math.PI * 0.38);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 234, 167, 0.8)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(R_m * 0.35, 0, R_m * 1.4, -Math.PI * 0.28, Math.PI * 0.28);
    ctx.stroke();
  }
}

/**
 * Renderiza a animação de morte em 3 fases de Zumbi Comum.
 * @param {Object} de Entidade agonizante em dyingEnemies
 * @param {number} t Progresso normalizado de morte (0 a 1)
 * @param {number} R Raio de colisão da criatura
 */
export function drawDying(de, t, R) {
  const v = de.variant || 0;
  R = de.radius * 1.38;
  // Fase 1: Impacto joga o torso para trás; Fase 2: Joelhos dobram e desaba; Fase 3: Dissolução cadavérica
  const fallAngle = t < 0.35 ? -t * 0.8 : (-0.28 - (t - 0.35) * 1.3);
  ctx.rotate(fallAngle);
  ctx.translate(0, t * 10);
  ctx.scale(1 + t * 0.12, Math.max(0.08, 1 - t * 0.75));

  let bodyCol = '#3a3d40';
  let skinCol = '#52734d';
  if (v === 1) { bodyCol = '#1e272e'; skinCol = '#4d5d53'; }
  else if (v === 2) { bodyCol = '#808e9b'; skinCol = '#2d5a27'; }
  else if (v === 3) { bodyCol = '#5c1926'; skinCol = '#576574'; }

  // Pernas trôpegas tombadas
  ctx.fillStyle = '#242628';
  ctx.fillRect(-R * 0.4, R * 0.3, 4.2, R * 0.5 * (1 - t * 0.5));
  ctx.fillRect(-R * 0.1, R * 0.35, 4.2, R * 0.45 * (1 - t * 0.5));

  // Torso desabando
  ctx.fillStyle = bodyCol;
  ctx.fillRect(-R * 0.55, -R * 0.35, R * 0.85, R * 0.7);

  // Cabeça inclinada
  ctx.fillStyle = skinCol;
  ctx.beginPath();
  ctx.arc(R * 0.22, -R * 0.48 + t * 4, R * 0.36, 0, Math.PI * 2);
  ctx.fill();

  // Detalhe de resíduo terminal específico da variante
  if (v === 1) {
    // Chapa de sucata se soltando com faíscas
    ctx.fillStyle = '#747d8c';
    ctx.fillRect(R * 0.1 + t * 6, -R * 0.55 + t * 4, 7, 3);
    if (t > 0.2 && t < 0.6) {
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(R * 0.3 + (Math.random() - 0.5) * 6, -R * 0.6 + (Math.random() - 0.5) * 6, 2.5, 2.5);
    }
  } else if (v === 2) {
    // Pústula tóxica estourando e soltando fumaça verde
    if (t > 0.25) {
      ctx.fillStyle = 'rgba(46, 204, 113, 0.7)';
      for (let p = 0; p < 3; p++) {
        const pa = p * 1.8 + t * 3;
        ctx.beginPath();
        ctx.arc(R * 0.15 + Math.cos(pa) * (R * 0.6 * t), -R * 0.5 + Math.sin(pa) * (R * 0.4 * t), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (v === 3) {
    // Ombreira de ferro caindo pesada
    ctx.save();
    ctx.translate(-R * 0.7 - t * 10, t * 8);
    ctx.rotate(-t * 1.5);
    ctx.fillStyle = '#2f3542';
    ctx.fillRect(0, 0, 6, 5);
    ctx.restore();
  }
}
