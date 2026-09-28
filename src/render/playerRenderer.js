/**
 * src/render/playerRenderer.js
 * 
 * Módulo especializado na renderização do herói jogável, estados especiais
 * (phasing, invisibilidade, fúria berserk, investida sagrada, passo ígneo),
 * auras sagradas, bíblias orbitais e machados giratórios nórdicos.
 */
import { ctx, frameCount, bullets, matchIntro } from '../main.js';
import { deathSequence, gameState } from '../state/gameState.js';
import { HERO_SOUL_PALETTES } from './deathAnimation.js';
import { player, selectedHeroKey } from '../entities/player.js';
import { drawKragdorAxes } from './kragdorAxes.js';
import { drawKragdorRoar } from './kragdorUlt.js';
import { KRAGDOR_ULT } from '../config/kragdorUlt.js';
import { CHARACTERS } from '../config/characters.js';
import { renderHeroModel } from './heroes/index.js';
export { renderHeroModel } from './heroes/index.js';

/**
 * Renderiza a Aura Sagrada / Santuário Celestial com fade radial inverso,
 * alta transparência na arena, geometria sagrada tênue e ondas de purificação.
 */
const auraGradCache = {};

function getAuraGradient(c, isEvolved, radius) {
  const quantRadius = Math.round(radius / 8) * 8;
  const key = `${isEvolved ? 1 : 0}_${quantRadius}`;
  if (auraGradCache[key]) return auraGradCache[key];

  const grad = c.createRadialGradient(0, 0, 4, 0, 0, quantRadius);
  if (isEvolved) {
    grad.addColorStop(0.00, 'rgba(255, 245, 200, 0.22)');
    grad.addColorStop(0.20, 'rgba(255, 215, 0, 0.14)');
    grad.addColorStop(0.50, 'rgba(243, 156, 18, 0.05)');
    grad.addColorStop(0.80, 'rgba(241, 196, 15, 0.015)');
    grad.addColorStop(1.00, 'rgba(241, 196, 15, 0.00)');
  } else {
    grad.addColorStop(0.00, 'rgba(255, 240, 180, 0.16)');
    grad.addColorStop(0.25, 'rgba(255, 215, 0, 0.09)');
    grad.addColorStop(0.55, 'rgba(241, 196, 15, 0.03)');
    grad.addColorStop(0.85, 'rgba(241, 196, 15, 0.008)');
    grad.addColorStop(1.00, 'rgba(241, 196, 15, 0.00)');
  }
  auraGradCache[key] = grad;
  return grad;
}

export function drawPlayerAura() {
  if (player.auraLvl <= 0 && !player.evolvedAura) return;

  const isEvolved = !!player.evolvedAura;
  const baseRadius = (isEvolved ? 150 : 65) + player.auraLvl * 18;
  const breathing = Math.sin(frameCount * 0.05) * 2.5;
  const auraRadius = Math.max(10, baseRadius + breathing);

  ctx.save();
  ctx.translate(player.x, player.y);

  // 1. Campo de Luz Celestial com Gradiente Radial em Cache
  const auraGrad = getAuraGradient(ctx, isEvolved, auraRadius);
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
  ctx.fill();

  // 2. Anel Periférico Delicado com Traço Tênue (Não ofusca o piso da arena)
  ctx.strokeStyle = isEvolved ? 'rgba(241, 196, 15, 0.28)' : 'rgba(241, 196, 15, 0.18)';
  ctx.lineWidth = isEvolved ? 1.6 : 1.0;
  ctx.beginPath();
  ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Anel Rúnico Interno Tênue e Marcadores Cardeais Celestes
  const innerRingR = auraRadius * (isEvolved ? 0.82 : 0.86);
  ctx.save();
  ctx.setLineDash([3, 9]);
  ctx.strokeStyle = isEvolved ? 'rgba(255, 215, 0, 0.14)' : 'rgba(241, 196, 15, 0.09)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, innerRingR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 4 nós cardeais celestes rotacionando lentamente em harmonia
  const cardAngle = frameCount * 0.008;
  for (let k = 0; k < 4; k++) {
    const ang = cardAngle + (k * Math.PI / 2);
    const nx = Math.cos(ang) * auraRadius;
    const ny = Math.sin(ang) * auraRadius;
    ctx.fillStyle = isEvolved ? 'rgba(255, 235, 150, 0.35)' : 'rgba(241, 196, 15, 0.25)';
    ctx.beginPath();
    ctx.arc(nx, ny, isEvolved ? 2.2 : 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Pulso de Purificação / Onda de Dano Sincronizada com o Tick
  if (player.auraTickFlash && player.auraTickFlash > 0.01) {
    const flashProgress = 1 - player.auraTickFlash;
    const waveRadius = auraRadius * (0.25 + flashProgress * 0.75);
    const waveAlpha = player.auraTickFlash * (isEvolved ? 0.35 : 0.22);
    ctx.strokeStyle = isEvolved ? `rgba(255, 235, 150, ${waveAlpha})` : `rgba(241, 196, 15, ${waveAlpha})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 5. Centelhas Divinas Flutuantes (Otimizadas: 2 a 4 faíscas)
  const sparkCount = isEvolved ? 4 : 2;
  for (let s = 0; s < sparkCount; s++) {
    const seed = s * 73.13;
    const sparkDist = ((frameCount * 0.45 + seed * 19) % (auraRadius * 0.72)) + 14;
    const sparkAng = seed + Math.sin(frameCount * 0.015 + s) * 0.6;
    const sx = Math.cos(sparkAng) * sparkDist;
    const sy = Math.sin(sparkAng) * sparkDist - ((frameCount * 0.3 + seed) % 18);
    const lifeRatio = sparkDist / (auraRadius * 0.72);
    const sparkAlpha = Math.sin(lifeRatio * Math.PI) * (isEvolved ? 0.32 : 0.20);
    if (sparkAlpha > 0.02) {
      ctx.fillStyle = isEvolved ? `rgba(255, 250, 200, ${sparkAlpha})` : `rgba(255, 235, 160, ${sparkAlpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, isEvolved ? 1.4 : 1.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 6. Santuário Celestial (Detalhe exclusivo da Evolução: Runa Estelar no Solo)
  if (isEvolved) {
    ctx.save();
    ctx.rotate(frameCount * 0.003);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.06)';
    ctx.lineWidth = 0.8;
    const starR = auraRadius * 0.38;
    ctx.beginPath();
    for (let p = 0; p < 8; p++) {
      const a1 = p * Math.PI / 4;
      const sr = p % 2 === 0 ? starR : starR * 0.55;
      const px = Math.cos(a1) * sr;
      const py = Math.sin(a1) * sr;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

// Cache estático de sprites pré-renderizados para Tomos Orbitais
const bookSpriteCache = {};

function getBookSprite(isEvolved) {
  const key = isEvolved ? 1 : 0;
  if (bookSpriteCache[key]) return bookSpriteCache[key];

  const off = document.createElement('canvas');
  off.width = 128;
  off.height = 128;
  const c = off.getContext('2d');
  if (c) {
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
  }
  
  c.save();
  c.scale(2, 2);
  c.translate(32, 32);

  const bookW = isEvolved ? 26 : 22;
  const bookH = isEvolved ? 18 : 15;
  const halfW = bookW / 2;
  const halfH = bookH / 2;
  const haloRadius = isEvolved ? 26 : 20;

  // Halo de Luz Sagrada ao redor do livro
  const haloGrad = c.createRadialGradient(0, 0, 2, 0, 0, haloRadius);
  haloGrad.addColorStop(0, isEvolved ? 'rgba(241, 196, 15, 0.35)' : 'rgba(52, 152, 219, 0.30)');
  haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  c.fillStyle = haloGrad;
  c.beginPath();
  c.arc(0, 0, haloRadius, 0, Math.PI * 2);
  c.fill();

  // 1. Capa de Couro Mística Externa (ângulo aberto)
  c.fillStyle = isEvolved ? '#b7791f' : '#1b3a4b';
  c.beginPath();
  c.roundRect(-halfW - 1, -halfH - 1, bookW + 2, bookH + 2, 2);
  c.fill();
  c.strokeStyle = isEvolved ? '#f1c40f' : '#3498db';
  c.lineWidth = 1;
  c.stroke();

  // 2. Páginas de Pergaminho Abertas
  // Página Esquerda
  const pageGradLeft = c.createLinearGradient(-halfW, 0, 0, 0);
  pageGradLeft.addColorStop(0, '#e8e2d5');
  pageGradLeft.addColorStop(1, '#fcfbfa');
  c.fillStyle = pageGradLeft;
  c.beginPath();
  c.roundRect(-halfW, -halfH, halfW - 0.5, bookH, [2, 0, 0, 2]);
  c.fill();

  // Página Direita
  const pageGradRight = c.createLinearGradient(0, 0, halfW, 0);
  pageGradRight.addColorStop(0, '#fcfbfa');
  pageGradRight.addColorStop(1, '#e8e2d5');
  c.fillStyle = pageGradRight;
  c.beginPath();
  c.roundRect(0.5, -halfH, halfW - 0.5, bookH, [0, 2, 2, 0]);
  c.fill();

  // 3. Linhas de Encantamento / Texto Rúnico
  c.strokeStyle = isEvolved ? 'rgba(217, 119, 6, 0.45)' : 'rgba(41, 128, 185, 0.40)';
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-halfW + 2, -3); c.lineTo(-2, -3);
  c.moveTo(-halfW + 2, 0);  c.lineTo(-2, 0);
  c.moveTo(-halfW + 2, 3);  c.lineTo(-2, 3);
  c.moveTo(2, -3); c.lineTo(halfW - 2, -3);
  c.moveTo(2, 0);  c.lineTo(halfW - 2, 0);
  c.moveTo(2, 3);  c.lineTo(halfW - 2, 3);
  c.stroke();

  // 4. Lombada Central
  c.fillStyle = isEvolved ? '#78350f' : '#0f172a';
  c.fillRect(-0.75, -halfH - 1, 1.5, bookH + 2);

  // 5. Cruz Sagrada / Runa Luminosa
  c.fillStyle = isEvolved ? '#fef08a' : '#38bdf8';
  c.fillRect(-0.75, -4, 1.5, 8);
  c.fillRect(-3, -2, 6, 1.5);

  // Ponto de luz divino
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(0, -1.25, 1, 0, Math.PI * 2);
  c.fill();

  c.restore();
  bookSpriteCache[key] = off;
  return off;
}

/**
 * Renderiza as Bíblias Astrais / Livros Orbitais em translação circular.
 */
export function drawPlayerOrbitals() {
  if (player.orbitals <= 0) return;

  const orbDist = player.evolvedOrbitals ? 88 : 72;
  const isEvolved = !!player.evolvedOrbitals;

  // 1. Anel Guia Orbital Celestial
  ctx.strokeStyle = isEvolved 
    ? 'rgba(241, 196, 15, 0.28)' 
    : 'rgba(52, 152, 219, 0.20)';
  ctx.lineWidth = isEvolved ? 2.2 : 1.4;
  ctx.beginPath();
  ctx.arc(player.x, player.y, orbDist, 0, Math.PI * 2);
  ctx.stroke();

  // Anel pontilhado rúnico sutil no entorno
  ctx.save();
  ctx.setLineDash([4, 8]);
  ctx.strokeStyle = isEvolved 
    ? 'rgba(243, 156, 18, 0.18)' 
    : 'rgba(41, 128, 185, 0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(player.x, player.y, orbDist + (isEvolved ? 6 : 4), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 2. Vínculo Harmônico Celestial entre os Tomos (Tríade Sagrada)
  if (player.orbitals === 3) {
    ctx.save();
    ctx.strokeStyle = isEvolved ? 'rgba(241, 196, 15, 0.16)' : 'rgba(52, 152, 219, 0.12)';
    ctx.lineWidth = isEvolved ? 1.4 : 1.0;
    ctx.beginPath();
    for (let oIdx = 0; oIdx < 3; oIdx++) {
      const a = player.orbitalAngle + (oIdx * (Math.PI * 2 / 3));
      const bx = player.x + Math.cos(a) * orbDist;
      const by = player.y + Math.sin(a) * orbDist;
      if (oIdx === 0) ctx.moveTo(bx, by);
      else ctx.lineTo(bx, by);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  } else if (player.orbitals === 2) {
    ctx.save();
    ctx.strokeStyle = isEvolved ? 'rgba(241, 196, 15, 0.14)' : 'rgba(52, 152, 219, 0.10)';
    ctx.lineWidth = 1.0;
    const a1 = player.orbitalAngle;
    const a2 = player.orbitalAngle + Math.PI;
    ctx.beginPath();
    ctx.moveTo(player.x + Math.cos(a1) * orbDist, player.y + Math.sin(a1) * orbDist);
    ctx.lineTo(player.x + Math.cos(a2) * orbDist, player.y + Math.sin(a2) * orbDist);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Renderização de Cada Tomo Celestial Aberto e seus Rastros (Via Sprite Cache)
  const bookSprite = getBookSprite(isEvolved);

  for (let oIdx = 0; oIdx < player.orbitals; oIdx++) {
    const angle = player.orbitalAngle + (oIdx * (Math.PI * 2 / player.orbitals));
    const ox = player.x + Math.cos(angle) * orbDist;
    const oy = player.y + Math.sin(angle) * orbDist;

    // Rastro Estelar conciso atrás do tomo (2 passos otimizados sem flood de arcos)
    const trailLength = isEvolved ? 0.36 : 0.22;
    for (let s = 1; s <= 2; s++) {
      const tAngle = angle - (trailLength * (s / 2));
      const tx = player.x + Math.cos(tAngle) * orbDist;
      const ty = player.y + Math.sin(tAngle) * orbDist;
      const alpha = (1 - s / 2.5) * (isEvolved ? 0.30 : 0.20);
      ctx.fillStyle = isEvolved 
        ? `rgba(241, 196, 15, ${alpha})` 
        : `rgba(0, 206, 201, ${alpha})`;
      ctx.beginPath();
      ctx.arc(tx, ty, (isEvolved ? 5.5 : 4.0) * (1 - s / 2.5), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(angle + Math.PI / 2);
    ctx.drawImage(bookSprite, -32, -32, 64, 64);
    ctx.restore();
  }
}

/**
 * Renderiza os Machados Giratórios Nórdicos de Kragdor, arcos de corte otimizados
 * e blit acelerado via Sprite Cache pré-renderizado.
 */
export function drawSpinningAxes() {
  drawKragdorAxes(ctx, player);
}

/**
 * Renderiza todos os equipamentos orbitais e auras ativas do jogador.
 */
export function drawPlayerEquipment() {
  if (matchIntro && matchIntro.active) return;
  if (deathSequence && deathSequence.active) return;
  if (gameState && gameState.isDead) return;
  if (selectedHeroKey === 'BARBARIAN' && player.berserkTimer > 0) {
    drawKragdorRoar(ctx, {
      x: player.roarOriginX, y: player.roarOriginY,
      age: KRAGDOR_ULT.duration - player.berserkTimer
    });
  }
  drawPlayerAura();
  drawPlayerOrbitals();
  drawSpinningAxes();
}


/**
 * Renderiza proceduralmente o personagem jogável selecionado na arena de combate.
 */
export function drawPlayerCharacter() {
  const isIntro = !!(matchIntro && matchIntro.active);
  const isDying = !!(deathSequence && deathSequence.active) || !!(gameState && gameState.isDead);

  const isRoaring = selectedHeroKey === 'BARBARIAN' && player.berserkTimer > KRAGDOR_ULT.duration - KRAGDOR_ULT.poseDuration;
  const isHolyCharge = selectedHeroKey === 'KNIGHT' && player.dashDuration > 0;
  const isFireStep = selectedHeroKey === 'MAGE' && player.ignisDashDuration > 0;
  const isInvulnBlink = !isIntro && !isDying && !isRoaring && !isHolyCharge && !isFireStep && player.iFrames > 0 && Math.floor(player.iFrames / 4) % 2 === 0;

  ctx.save();
  if (isInvulnBlink) {
    ctx.globalAlpha = 0.35;
  }

  const soulPal = HERO_SOUL_PALETTES[selectedHeroKey] || HERO_SOUL_PALETTES.KNIGHT;
  const fallProgress = (deathSequence && deathSequence.active) ? deathSequence.fallProgress : ((gameState && gameState.isDead) ? 1.0 : 0);
  const evaporateProgress = (deathSequence && deathSequence.active) ? deathSequence.evaporateProgress : 0;

  renderHeroModel(ctx, selectedHeroKey, {
    x: player.x,
    y: player.y,
    facing: player.facing,
    showDorsalAxe: false,
    scale: 1,
    isDying,
    fallProgress,
    evaporateProgress,
    soulColor: soulPal.primary,
    isMoving: (isIntro || isDying) ? false : player.isMoving,
    walkCycle: (isIntro || isDying) ? 0 : player.walkCycle,
    frameCount: (isIntro || isDying) ? 0 : frameCount,
    berserkTimer: (isIntro || isDying) ? 0 : player.berserkTimer,
    invisTimer: (isIntro || isDying) ? 0 : player.invisTimer,
    dashDuration: (isIntro || isDying) ? 0 : player.dashDuration,
    dashVx: player.dashVx,
    dashVy: player.dashVy,
    ignisDashDuration: (isIntro || isDying) ? 0 : player.ignisDashDuration,
    ignisDashVx: player.ignisDashVx,
    ignisDashVy: player.ignisDashVy,
    staffCastTimer: (isIntro || isDying) ? 0 : player.staffCastTimer,
    isPhasing: (isIntro || isDying) ? false : player.isPhasing,
    evolvedPotion: player.evolvedPotion,
    evolvedAxe: player.evolvedAxe,
    evolvedStaff: player.evolvedStaff,
    evolvedSword: player.evolvedSword,
    iFrames: (isIntro || isDying) ? 0 : player.iFrames,
    isRetaliating: (isIntro || isDying) ? false : undefined,
    isDashing: (isIntro || isDying) ? false : undefined,
    radius: player.radius,
    hammerProgress: (isIntro || isDying) ? -1 : (() => {
      const hb = bullets.find(b => b.type === 'HAMMER_SLAM');
      return hb ? Math.max(0, Math.min(1, 1 - (hb.life / hb.maxLife))) : -1;
    })(),
    isHammerAttacking: (isIntro || isDying) ? false : bullets.some(b => b.type === 'HAMMER_SLAM' && b.life > 0),
    evolvedHammer: player.evolvedHammer,
    isStaffCasting: (isIntro || isDying) ? false : bullets.some(b => b.type === 'STAFF' && b.life > 48),
    isSwordAttacking: (isIntro || isDying) ? false : bullets.some(b => b.type === 'SWORD' && b.life > 45),
    potionThrowTimer: (isIntro || isDying) ? 0 : (player.potionThrowTimer || 0),
    alchemistSkillTimer: (isIntro || isDying) ? 0 : (player.alchemistSkillTimer || 0),
    isThrowingPotion: (isIntro || isDying) ? false : ((player.potionThrowTimer > 0) || bullets.some(b => b.type === 'POTION' && b.life > 18)),
    isAlchemistSkill: (isIntro || isDying) ? false : (player.alchemistSkillTimer > 0)
  });

  ctx.restore();
}
