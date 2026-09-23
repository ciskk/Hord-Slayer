/**
 * src/render/deathAnimation.js
 * 
 * Orquestrador da Sequência Dramática de Morte do Jogador.
 * Controla aproximação de câmera, colapso corporal no chão, evaporação espectral
 * em partículas de alma e transição de alto impacto visual para o Game Over.
 */

import { 
  gameState,
  deathSequence, 
  resetDeathSequenceState,
  camera, 
  setCameraZoom, 
  baseCameraZoom, 
  cameraViewW, 
  cameraViewH, 
  cinematicCamera, 
  triggerShake, 
  frameCount 
} from '../state/gameState.js';
import { player, selectedHeroKey } from '../entities/player.js';
import { playSfx, triggerHaptic } from '../core/audio.js';
import { CHARACTERS } from '../config/characters.js';
import { snapPlayerHpToZero } from '../ui/hudController.js';
import { enemies, activeBoss, bullets, enemyBullets, bossProjectiles } from '../state/collections.js';
import { dyingEnemies } from '../systems/combat.js';
import { clearSpatialGrid } from '../core/spatialGrid.js';

// Partículas ativas da sequência de morte (poeira, almas, fagulhas)
const deathParticles = [];
// Ondas de choque no solo (impacto da queda e Nova de alma)
const deathShockwaves = [];
// Arma caída no solo
let droppedWeapon = null;
// Callback para abertura final do modal de morte
let onDeathCompleteCallback = null;
// Flag indicando se o impacto da queda já disparou som/poeira
let hasImpactedGround = false;
// Flag indicando se a Nova de Alma já detonou
let hasNovaTriggered = false;

/**
 * Paleta temática de alma e luz por classe de herói
 */
export const HERO_SOUL_PALETTES = {
  KNIGHT: {
    primary: '#e74c3c',    // Carmesim escarlate
    secondary: '#ff4757',  // Fagulha vermelha
    core: '#ff7675',
    glow: 'rgba(231, 76, 60, 0.45)',
    smoke: 'rgba(180, 20, 30, 0.18)'
  },
  BARBARIAN: {
    primary: '#c0392b',    // Vermelho sangue escuro
    secondary: '#ff4757',
    core: '#ff7675',
    glow: 'rgba(192, 57, 43, 0.45)',
    smoke: 'rgba(180, 20, 30, 0.18)'
  },
  MAGE: {
    primary: '#e74c3c',    // Brasa rubi viva
    secondary: '#ff5252',
    core: '#ff7979',
    glow: 'rgba(231, 76, 60, 0.45)',
    smoke: 'rgba(180, 20, 30, 0.18)'
  },
  ALCHEMIST: {
    primary: '#d63031',    // Carmesim reagente
    secondary: '#ff4757',
    core: '#ff7675',
    glow: 'rgba(214, 48, 49, 0.45)',
    smoke: 'rgba(180, 20, 30, 0.18)'
  },
  ROGUE: {
    primary: '#e74c3c',    // Lampejo vermelho sombrio
    secondary: '#ff3838',
    core: '#ff7675',
    glow: 'rgba(231, 76, 60, 0.45)',
    smoke: 'rgba(180, 20, 30, 0.18)'
  }
};

/**
 * Retorna a paleta de alma do herói ativo
 */
function getHeroPalette() {
  return HERO_SOUL_PALETTES[selectedHeroKey] || HERO_SOUL_PALETTES.KNIGHT;
}

/**
 * Inicia a Sequência Dramática de Morte
 * @param {Function} onComplete Callback chamado ao final da transição (abertura da tela de Game Over)
 */
export function startDeathSequence(onComplete) {
  if (deathSequence.active) return;

  onDeathCompleteCallback = onComplete;
  deathSequence.active = true;
  deathSequence.timer = 0;
  deathSequence.phase = 'COLLAPSE';
  deathSequence.fallProgress = 0;
  deathSequence.evaporateProgress = 0;
  deathSequence.transitionFlash = 0;
  deathSequence.skipped = false;
  deathSequence.startZoom = baseCameraZoom;
  deathSequence.targetZoomMult = 2.38;

  // Detecta se a morte ocorreu durante uma batalha contra Boss
  const isBossBattle = !!activeBoss || (enemies && enemies.some(e => e && (e.isBoss || e.isBossSubTarget)));
  deathSequence.isBossBattle = isBossBattle;
  deathSequence.mobFadeAlpha = 1.0;
  deathSequence.projectileFadeAlpha = 1.0;

  hasImpactedGround = false;
  hasNovaTriggered = false;
  deathParticles.length = 0;
  deathShockwaves.length = 0;

  // Ativa o letterbox cinematográfico
  cinematicCamera.isCinematic = true;

  // Zera velocidade do herói e remove estados ativos de combate
  player.vx = 0;
  player.vy = 0;
  player.isMoving = false;
  player.dashDuration = 0;
  player.ignisDashDuration = 0;
  player.staffCastTimer = 0;
  player.potionThrowTimer = 0;
  player.alchemistSkillTimer = 0;

  // Configuração da arma largada no solo ao iniciar a queda
  droppedWeapon = {
    heroKey: selectedHeroKey,
    x: player.x + (player.facing || 1) * 8,
    y: player.y + 6,
    angle: (player.facing || 1) * 0.72,
    alpha: 1.0,
    evolved: !!(
      (selectedHeroKey === 'KNIGHT' && player.evolvedHammer) ||
      (selectedHeroKey === 'BARBARIAN' && player.evolvedAxe) ||
      (selectedHeroKey === 'MAGE' && player.evolvedStaff) ||
      (selectedHeroKey === 'ALCHEMIST' && player.evolvedPotion) ||
      (selectedHeroKey === 'ROGUE' && player.evolvedSword)
    )
  };

  // Dispara o primeiro batimento cardíaco fúnebre e vibração tátil
  playSfx('death_heartbeat');
  triggerHaptic('heavy');
}

/**
 * Atualiza o estado da animação de morte a cada quadro
 * @param {number} dt Delta time
 */
export function updateDeathSequence(dt) {
  if (!deathSequence.active) return;

  deathSequence.timer += dt;
  const t = deathSequence.timer;

  // ==========================================
  // 0. FADEOUT E REMOÇÃO DE PROJÉTEIS E MOBS
  // ==========================================
  // Fadeout suave dos projéteis durante o colapso inicial (~45 frames)
  const projProg = Math.min(1.0, t / 45);
  const easedProj = projProg * projProg * (3 - 2 * projProg);
  deathSequence.projectileFadeAlpha = Math.max(0, 1.0 - easedProj);

  if (t >= 45) {
    if (bullets.length > 0) bullets.length = 0;
    if (enemyBullets.length > 0) enemyBullets.length = 0;
    if (bossProjectiles.length > 0) bossProjectiles.length = 0;
  }

  // Se não for batalha de chefe, fadeout suave dos monstros até perto do final da animação (~115 frames)
  if (!deathSequence.isBossBattle) {
    const mobProg = Math.min(1.0, t / 115);
    const easedMob = mobProg * mobProg * (3 - 2 * mobProg);
    deathSequence.mobFadeAlpha = Math.max(0, 1.0 - easedMob);

    if (t >= 115) {
      if (enemies.length > 0) enemies.length = 0;
      if (dyingEnemies.length > 0) dyingEnemies.length = 0;
      clearSpatialGrid();
    }
  } else {
    deathSequence.mobFadeAlpha = 1.0;
  }

  // ==========================================
  // 1. CÂMERA: Panning Centrado & Zoom Dramático
  // ==========================================
  const targetCamX = player.x - cameraViewW / 2;
  const targetCamY = player.y - cameraViewH / 2;
  
  // Interpolação suave e contínua sem subpixel snapping
  const camPanSpeed = 1 - Math.pow(1 - 0.14, dt);
  camera.x += (targetCamX - camera.x) * camPanSpeed;
  camera.y += (targetCamY - camera.y) * camPanSpeed;

  // Zoom suave: transição em curva cúbica acelerada
  const zoomDuration = 80;
  const rawZoomProg = Math.min(1.0, t / zoomDuration);
  const easedZoom = rawZoomProg * rawZoomProg * (3 - 2 * rawZoomProg);
  deathSequence.zoomProgress = easedZoom;

  const curZoom = deathSequence.startZoom + (deathSequence.startZoom * (deathSequence.targetZoomMult - 1.0)) * easedZoom;
  setCameraZoom(curZoom);

  // Barras de cinema (Letterbox)
  cinematicCamera.letterboxProgress += (1.0 - cinematicCamera.letterboxProgress) * (1 - Math.pow(1 - 0.10, dt));

  // ==========================================
  // 2. FASE 1: QUEDA NO CHÃO (0 a 50 frames)
  // ==========================================
  if (t < 52) {
    deathSequence.phase = 'COLLAPSE';
    const fallRatio = Math.min(1.0, t / 46);
    // Gravidade exponencial no colapso
    deathSequence.fallProgress = Math.pow(fallRatio, 1.85);

    // Momento exato do impacto com o solo
    if (t >= 44 && !hasImpactedGround) {
      hasImpactedGround = true;
      playSfx('death_collapse');
      triggerShake(6);
      triggerHaptic('medium');

      // 1. Onda de impacto plana no solo
      deathShockwaves.push({
        x: player.x,
        y: player.y + 14,
        radius: 8,
        maxRadius: 42,
        life: 24,
        maxLife: 24,
        color: 'rgba(255, 255, 255, 0.65)'
      });

      // 2. Poeira de terra/pedra radial
      for (let i = 0; i < 14; i++) {
        const ang = (i / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const spd = 1.2 + Math.random() * 2.2;
        deathParticles.push({
          x: player.x + Math.cos(ang) * 4,
          y: player.y + 14 + Math.sin(ang) * 2,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd * 0.5,
          size: 2.2 + Math.random() * 2.5,
          life: 25 + Math.random() * 15,
          maxLife: 40,
          color: 'rgba(180, 160, 140, 0.65)',
          type: 'dust'
        });
      }
    }
  } 
  // ==========================================
  // 3. FASE 2: EVAPORAÇÃO ESPECTRAL (50 a 135)
  // ==========================================
  else if (t < 135) {
    deathSequence.phase = 'EVAPORATE';
    deathSequence.fallProgress = 1.0;

    const evapRatio = Math.min(1.0, (t - 50) / 80);
    deathSequence.evaporateProgress = evapRatio;

    // A arma caída permanece estirada ao lado do herói no chão
    if (droppedWeapon) {
      droppedWeapon.alpha = 1.0;
    }

    // Disparo do som etéreo de evaporação
    if (t >= 56 && t < 58) {
      playSfx('death_evaporate');
    }

    // Emissão contínua de minúsculas partículas vermelhas ascendentes
    const palette = getHeroPalette();
    const spawnCount = Math.floor(2.0 * dt) + (Math.random() < 0.4 ? 1 : 0);

    for (let p = 0; p < spawnCount; p++) {
      const offsetX = (Math.random() - 0.5) * 22;
      const offsetY = (Math.random() - 0.5) * 12 + 6;
      const isCoreSpark = Math.random() < 0.3;

      deathParticles.push({
        x: player.x + offsetX,
        y: player.y + offsetY,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.9 - Math.random() * 1.8,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.07 + Math.random() * 0.05,
        swayAmp: 0.4 + Math.random() * 0.6,
        size: isCoreSpark ? (1.2 + Math.random() * 0.6) : (0.7 + Math.random() * 0.6), // Minúsculas partículas: 0.7px a 1.8px
        life: 40 + Math.random() * 30,
        maxLife: 70,
        color: isCoreSpark ? '#ff4757' : '#c0392b',
        coreColor: '#ff6b81',
        type: 'soul',
        isCoreSpark
      });
    }

    // Vapores espectrais sutis em carmesim escuro
    if (Math.random() < 0.25 * dt) {
      deathParticles.push({
        x: player.x + (Math.random() - 0.5) * 16,
        y: player.y + 6,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.6 - Math.random() * 0.8,
        size: 5 + Math.random() * 6,
        growRate: 0.2,
        life: 45,
        maxLife: 45,
        color: 'rgba(150, 20, 25, 0.16)',
        type: 'smoke'
      });
    }
  } 
  // ==========================================
  // 4. FASE 3: NOVA DE ALMA & TRANSIÇÃO FINAL (135 a 165)
  // ==========================================
  else {
    deathSequence.phase = 'TRANSITION';
    deathSequence.fallProgress = 1.0;
    deathSequence.evaporateProgress = 1.0;

    // Detonação imediata da Nova de Alma
    if (!hasNovaTriggered) {
      hasNovaTriggered = true;
      playSfx('death_nova');
      playSfx('tombstone_slam');
      playSfx('bell_toll', 0.85);
      triggerShake(11);
      triggerHaptic('heavy');
      deathSequence.transitionFlash = 1.0;

      const palette = getHeroPalette();

      // 1. Onda de choque expansiva carmesim
      deathShockwaves.push({
        x: player.x,
        y: player.y + 4,
        radius: 8,
        maxRadius: 160,
        life: 28,
        maxLife: 28,
        color: '#e74c3c',
        lineWidth: 2.5
      });

      // Onda de choque secundária interna vermelha viva
      deathShockwaves.push({
        x: player.x,
        y: player.y + 4,
        radius: 4,
        maxRadius: 110,
        life: 22,
        maxLife: 22,
        color: '#ff4757',
        lineWidth: 1.6
      });

      // 2. Estouro radial de minúsculas fagulhas vermelhas
      for (let i = 0; i < 28; i++) {
        const ang = (i / 28) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
        const spd = 2.4 + Math.random() * 3.6;
        deathParticles.push({
          x: player.x,
          y: player.y + 4,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          drag: 0.93,
          size: 0.9 + Math.random() * 0.9, // Minúsculas fagulhas vermelhas: 0.9px a 1.8px
          life: 28 + Math.random() * 16,
          maxLife: 44,
          color: i % 2 === 0 ? '#ff3838' : '#c0392b',
          coreColor: '#ff6b81',
          type: 'nova_spark'
        });
      }
    }

    // Decaimento suave do flash da tela
    if (deathSequence.transitionFlash > 0) {
      deathSequence.transitionFlash = Math.max(0, deathSequence.transitionFlash - 0.032 * dt);
    }

    // Conclusão e abertura triunfal do modal de morte
    if (t >= deathSequence.duration) {
      finishDeathSequence();
    }
  }

  // ==========================================
  // 5. ATUALIZAÇÃO FÍSICA DAS PARTÍCULAS E ONDAS
  // ==========================================
  for (let i = deathParticles.length - 1; i >= 0; i--) {
    const p = deathParticles[i];
    p.life -= dt;
    if (p.life <= 0) {
      deathParticles.splice(i, 1);
      continue;
    }

    if (p.type === 'soul') {
      p.swayPhase += p.swaySpeed * dt;
      p.x += Math.sin(p.swayPhase) * p.swayAmp * dt;
      p.y += p.vy * dt;
      // Leve aceleração para cima conforme sobe aos céus
      p.vy -= 0.02 * dt;
    } else if (p.type === 'smoke') {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size += p.growRate * dt;
    } else if (p.type === 'nova_spark') {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= p.drag;
      p.vy *= p.drag;
    } else {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
    }
  }

  for (let i = deathShockwaves.length - 1; i >= 0; i--) {
    const sw = deathShockwaves[i];
    sw.life -= dt;
    if (sw.life <= 0) {
      deathShockwaves.splice(i, 1);
      continue;
    }
    const prog = 1 - (sw.life / sw.maxLife);
    sw.curRadius = sw.radius + (sw.maxRadius - sw.radius) * prog;
  }
}

/**
 * Renderiza os elementos do mundo da sequência de morte (no espaço da arena):
 * Poeira, arma caída, ondas de choque no solo e partículas de alma.
 * @param {CanvasRenderingContext2D} ctx Contexto de renderização do jogo
 */
export function renderDeathSequenceWorld(ctx) {
  if (!deathSequence.active && !gameState.isDead && deathParticles.length === 0 && deathShockwaves.length === 0 && !droppedWeapon) return;

  ctx.save();

  // 1. Ondas de Choque no Solo (Impacto da Queda & Nova de Alma)
  for (let i = 0; i < deathShockwaves.length; i++) {
    const sw = deathShockwaves[i];
    const alpha = Math.max(0, sw.life / sw.maxLife);
    ctx.save();
    ctx.strokeStyle = sw.color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = (sw.lineWidth || 2.0) * (sw.life / sw.maxLife);
    ctx.beginPath();
    // Projeção elíptica no solo para perspectiva diegética
    ctx.ellipse(sw.x, sw.y, sw.curRadius, sw.curRadius * 0.65, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Arma caída ao lado do corpo no chão
  if (droppedWeapon && droppedWeapon.alpha > 0.01) {
    renderFallenWeapon(ctx, droppedWeapon);
  }

  // 3. Partículas de Poeira e Vapores Espectrais (Camada Inferior)
  for (let i = 0; i < deathParticles.length; i++) {
    const p = deathParticles[i];
    if (p.type === 'dust' || p.type === 'smoke') {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 4. Minúsculas Partículas de Alma Vermelha e Fagulhas da Nova
  for (let i = 0; i < deathParticles.length; i++) {
    const p = deathParticles[i];
    if (p.type === 'soul' || p.type === 'nova_spark') {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;

      // Ponto nítido e minúsculo vermelho
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Micro núcleo central sutil para fagulhas maiores
      if (p.size > 1.3) {
        ctx.fillStyle = p.coreColor || '#ff7675';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Renderiza a arma que escorregou das mãos do herói ao solo
 */
function renderFallenWeapon(ctx, w) {
  ctx.save();
  ctx.translate(w.x, w.y);
  ctx.rotate(w.angle);
  ctx.globalAlpha = w.alpha;

  if (w.heroKey === 'KNIGHT') {
    // Martelo de guerra deitado no chão
    ctx.fillStyle = '#3d271d'; // Cabo
    ctx.fillRect(-2, -10, 4, 22);
    ctx.fillStyle = w.evolved ? '#7f1d1d' : '#475569'; // Cabeça de ferro
    ctx.fillRect(-7, -18, 14, 9);
    ctx.fillStyle = w.evolved ? '#ff4757' : '#c0392b'; // Runa carmesim extinta
    ctx.fillRect(-2, -16, 4, 5);
  } else if (w.heroKey === 'BARBARIAN') {
    // Machado nórdico cravado de lado
    ctx.fillStyle = '#3d271d'; // Cabo
    ctx.fillRect(-2, -12, 4, 24);
    ctx.fillStyle = w.evolved ? '#d35400' : '#7f8c8d'; // Lâmina
    ctx.beginPath();
    ctx.arc(6, -8, 10, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.lineTo(0, -8);
    ctx.closePath();
    ctx.fill();
  } else if (w.heroKey === 'MAGE') {
    // Cajado de fogo no solo com brasa moribunda
    ctx.fillStyle = '#2c1e14';
    ctx.fillRect(-1.5, -14, 3, 28);
    ctx.fillStyle = w.evolved ? '#e74c3c' : '#e67e22';
    ctx.beginPath();
    ctx.arc(0, -16, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (w.heroKey === 'ALCHEMIST') {
    // Frasco alquímico esvaziado
    ctx.fillStyle = 'rgba(235, 255, 248, 0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(-1.5, -7, 3, 3);
  } else {
    // Adaga do ladino fincada no chão
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-1.5, 2, 3, 8);
    ctx.fillStyle = w.evolved ? '#f1c40f' : '#bdc3c7';
    ctx.beginPath();
    ctx.moveTo(-3, 2);
    ctx.lineTo(3, 2);
    ctx.lineTo(0, -12);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Renderiza sobreposições de tela cheia (Overlay Screen Space):
 * Vinheta tipo holofote (*spotlight*) e flash necrótico da Nova de Alma.
 * @param {CanvasRenderingContext2D} ctx Contexto de renderização
 * @param {number} viewW Largura da viewport
 * @param {number} viewH Altura da viewport
 */
export function renderDeathSequenceOverlay(ctx, viewW, viewH) {
  if (!deathSequence.active && !gameState.isDead) return;

  const cx = viewW / 2;
  const cy = viewH / 2;
  const maxDim = Math.max(viewW, viewH);

  // 1. Vinheta Cinematográfica Spotlight (Ilumina o herói, escurece a arena)
  const spotAlpha = gameState.isDead ? 0.85 : Math.min(0.85, (deathSequence.timer / 30) * 0.85);
  if (spotAlpha > 0.01) {
    ctx.save();
    const innerR = Math.max(45, maxDim * 0.08);
    const outerR = maxDim * 0.62;
    const vigGrad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
    vigGrad.addColorStop(0, 'rgba(4, 2, 6, 0)');
    vigGrad.addColorStop(0.45, `rgba(8, 3, 10, ${spotAlpha * 0.55})`);
    vigGrad.addColorStop(1, `rgba(2, 1, 4, ${spotAlpha})`);
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.restore();
  }

  // 2. Flash Necrótico de Transição da Nova de Alma
  if (deathSequence.transitionFlash > 0.01) {
    ctx.save();
    const flashAlpha = deathSequence.transitionFlash;
    const flashGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, maxDim * 0.7);
    flashGrad.addColorStop(0, `rgba(255, 235, 235, ${flashAlpha * 0.95})`);
    flashGrad.addColorStop(0.35, `rgba(231, 76, 60, ${flashAlpha * 0.75})`);
    flashGrad.addColorStop(0.75, `rgba(18, 4, 8, ${flashAlpha * 0.85})`);
    flashGrad.addColorStop(1, `rgba(5, 1, 3, ${flashAlpha * 0.95})`);
    ctx.fillStyle = flashGrad;
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.restore();
  }
}

/**
 * Pula a animação de morte e transiciona imediatamente para o modal
 */
export function skipDeathSequence() {
  if (!deathSequence.active || deathSequence.skipped) return;
  deathSequence.skipped = true;
  deathSequence.projectileFadeAlpha = 0;
  bullets.length = 0;
  enemyBullets.length = 0;
  bossProjectiles.length = 0;

  if (!deathSequence.isBossBattle) {
    deathSequence.mobFadeAlpha = 0;
    enemies.length = 0;
    dyingEnemies.length = 0;
    clearSpatialGrid();
  }

  snapPlayerHpToZero();
  finishDeathSequence();
}

/**
 * Conclui a sequência de morte e entrega o fluxo para a tela de Game Over
 */
function finishDeathSequence() {
  deathSequence.active = false;
  deathSequence.phase = 'TRANSITION';
  deathSequence.fallProgress = 1.0;
  deathSequence.evaporateProgress = 1.0;
  deathSequence.projectileFadeAlpha = 0;
  bullets.length = 0;
  enemyBullets.length = 0;
  bossProjectiles.length = 0;

  if (!deathSequence.isBossBattle) {
    deathSequence.mobFadeAlpha = 0;
    enemies.length = 0;
    dyingEnemies.length = 0;
    clearSpatialGrid();
  }

  if (typeof onDeathCompleteCallback === 'function') {
    const cb = onDeathCompleteCallback;
    onDeathCompleteCallback = null;
    cb();
  }
}

/**
 * Limpa todos os efeitos e dados da animação de morte ao reiniciar a partida
 */
export function resetDeathSequence() {
  resetDeathSequenceState();
  deathParticles.length = 0;
  deathShockwaves.length = 0;
  droppedWeapon = null;
  onDeathCompleteCallback = null;
  hasImpactedGround = false;
  hasNovaTriggered = false;
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (deathSequence.active && deathSequence.timer > 15) {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        skipDeathSequence();
      }
    }
  });

  window.addEventListener('pointerdown', () => {
    if (deathSequence.active && deathSequence.timer > 15) {
      skipDeathSequence();
    }
  });
}
