/**
 * src/render/ultButtonRenderer.js
 * 
 * Módulo especializado na renderização procedural e diegética do Botão de ULT (Habilidade Suprema).
 * Equivalente em profundidade e fidelidade visual ao joystickRenderer.js:
 * 
 * Implementa 5 arquiteturas completas e exclusivas para cada herói:
 * 1. CATHEDRAL (Sir Roland - O Paladino):
 *    - Eixo cruciforme sacro, vitral gótico rotativo, feixes de luz solar e motes de poeira estelar.
 * 2. VOLCANO (Ignis - A Piromante):
 *    - Câmara magmática fluida, convecção térmica, redemoinho de fogo e fagulhas incandescentes.
 * 3. VOID (Kael - O Andarilho Sombrio):
 *    - Singularity de vácuo gravitacional inverso, névoa abissal em espiral e filamentos elétricos ciano/ametista.
 * 4. PRIMAL (Kragdor - O Colosso Berserker):
 *    - Sangue arterial viscoso, batimento cardíaco visceral duplo (Lub-Dub anatômico), faíscas rubras e arcos de fúria.
 * 5. ALEMBIC (Valéria - A Alquimista Cáustica):
 *    - Caldeirão cáustico efervescente com bolhas mutagênicas, manômetro de pressão analógico vivo e jatos de vapor.
 * 
 * Recursos Técnicos:
 * - Micro-Canvas de 160x160 DPI-scaled operando em 60 FPS com Zero Garbage Collection.
 * - Projeção de halos e partículas que ultrapassam os limites do botão para manter visibilidade periférica no mobile.
 */

// Estado interno do renderizador
let ultCanvas = null;
let ultCtx = null;
let currentHeroKey = 'KNIGHT';
let lastProgress = 0;
let lastIsReady = false;

// Configuração do Canvas (Espaço de desenho 160x160 com centro em 80, 80)
const CANVAS_SIZE = 160;
const CENTER_X = 80;
const CENTER_Y = 80;
const BUTTON_RADIUS = 36; // Raio físico do medalhão

// A rotação animada é aplicada ao contexto; a geometria local destes raios é fixa.
const SOLAR_RAYS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i * Math.PI * 2) / 12;
  return { cos: Math.cos(angle), sin: Math.sin(angle), isMajor: i % 3 === 0 };
});

// Pools estáticos de partículas para Zero Garbage Collection
const MAX_PARTICLES = 36;
const particlePool = [];
for (let i = 0; i < MAX_PARTICLES; i++) {
  particlePool.push({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 2,
    life: 0,
    maxLife: 1,
    color: '#fff',
    alpha: 1,
    type: 'spark', // spark, smoke, bubble, steam
    extra: 0
  });
}

// Manômetro da Alquimista
let smoothGaugeAngle = 0;

// Shockwave / Flash de disparo
let triggerFlare = {
  active: false,
  radius: 0,
  maxRadius: 75,
  alpha: 0,
  color: '#ffffff'
};

/**
 * Aloca uma partícula do pool estático
 */
function spawnParticle(x, y, vx, vy, size, life, color, type = 'spark', extra = 0) {
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const p = particlePool[i];
    if (!p.active) {
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = vx;
      p.vy = vy;
      p.size = size;
      p.life = life;
      p.maxLife = life;
      p.color = color;
      p.alpha = 1;
      p.type = type;
      p.extra = extra;
      return p;
    }
  }
  return null;
}

/**
 * Atualiza partículas ativas
 */
function updateParticles(dtFactor = 1.0) {
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const p = particlePool[i];
    if (!p.active) continue;

    p.x += p.vx * dtFactor;
    p.y += p.vy * dtFactor;
    p.life -= 0.025 * dtFactor;

    if (p.type === 'bubble') {
      p.vx += Math.sin(p.life * 12) * 0.1;
      p.vy *= 0.98;
    } else if (p.type === 'steam') {
      p.size += 0.15;
      p.vx *= 0.94;
      p.vy *= 0.94;
    } else if (p.type === 'ember') {
      p.vx += (Math.random() - 0.5) * 0.15;
      p.vy -= 0.04; // Flutua para cima
    } else {
      p.vx *= 0.95;
      p.vy *= 0.95;
    }

    p.alpha = Math.max(0, p.life / p.maxLife);

    if (p.life <= 0) {
      p.active = false;
    }
  }

  // Atualização do Trigger Flare
  if (triggerFlare.active) {
    triggerFlare.radius += 3.8 * dtFactor;
    triggerFlare.alpha *= 0.90;
    if (triggerFlare.alpha < 0.02 || triggerFlare.radius >= triggerFlare.maxRadius) {
      triggerFlare.active = false;
    }
  }
}

/**
 * Inicializa o renderizador da ULT com o elemento canvas
 */
export function initUltButtonRenderer() {
  ultCanvas = document.getElementById('ult-fx-canvas');
  if (!ultCanvas) return;

  ultCtx = ultCanvas.getContext('2d', { alpha: true });
  if (!ultCtx) return;

  // Ajuste de DPI nítido
  const dpr = window.devicePixelRatio || 1;
  ultCanvas.width = CANVAS_SIZE * dpr;
  ultCanvas.height = CANVAS_SIZE * dpr;
  ultCtx.scale(dpr, dpr);
}

/**
 * Altera o herói ativo e reinicia os efeitos
 */
export function setUltHero(heroKey) {
  currentHeroKey = heroKey || 'KNIGHT';
  // Reseta partículas
  for (let i = 0; i < MAX_PARTICLES; i++) {
    particlePool[i].active = false;
  }
  smoothGaugeAngle = 0;
  triggerFlare.active = false;
}

/**
 * Dispara a onda de choque e ejeção física de partículas ao usar a ULT
 */
export function triggerUltBurst(heroKey) {
  const hero = heroKey || currentHeroKey;
  triggerFlare.active = true;
  triggerFlare.radius = 12;
  triggerFlare.alpha = 1.0;

  let burstColor = '#f1c40f';
  let pType = 'spark';

  if (hero === 'MAGE') {
    burstColor = '#e67e22';
    triggerFlare.color = '#ff7675';
    pType = 'ember';
  } else if (hero === 'ROGUE') {
    burstColor = '#a855f7';
    triggerFlare.color = '#38bdf8';
    pType = 'spark';
  } else if (hero === 'BARBARIAN') {
    burstColor = '#e74c3c';
    triggerFlare.color = '#ff7675';
    pType = 'spark';
  } else if (hero === 'ALCHEMIST') {
    burstColor = '#9b59b6';
    triggerFlare.color = '#d6a2e8';
    pType = 'bubble';
  } else {
    // KNIGHT
    burstColor = '#f1c40f';
    triggerFlare.color = '#ffffff';
    pType = 'spark';
  }

  // Emite faíscas radiais potentes além da borda
  const count = 18;
  for (let i = 0; i < count; i++) {
    const ang = (i * Math.PI * 2) / count + (Math.random() * 0.3 - 0.15);
    const spd = 2.2 + Math.random() * 3.5;
    spawnParticle(
      CENTER_X + Math.cos(ang) * (BUTTON_RADIUS - 4),
      CENTER_Y + Math.sin(ang) * (BUTTON_RADIUS - 4),
      Math.cos(ang) * spd,
      Math.sin(ang) * spd,
      2.0 + Math.random() * 2.5,
      0.8 + Math.random() * 0.4,
      burstColor,
      pType
    );
  }
}

/**
 * Loop mestre de renderização procedural da ULT
 */
export function renderUltButton(player, frameCount) {
  if (!ultCtx || !ultCanvas) {
    ultCanvas = document.getElementById('ult-fx-canvas');
    if (ultCanvas) {
      ultCtx = ultCanvas.getContext('2d', { alpha: true });
      const dpr = window.devicePixelRatio || 1;
      ultCanvas.width = CANVAS_SIZE * dpr;
      ultCanvas.height = CANVAS_SIZE * dpr;
      ultCtx.scale(dpr, dpr);
    } else {
      return;
    }
  }

  ultCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  updateParticles(1.0);

  const skillCd = player ? player.skillCd : 0;
  const maxCd = (player && player.skillMaxCd > 0) ? player.skillMaxCd : 400;
  const isReady = skillCd <= 0;
  const progress = Math.max(0, Math.min(1.0, 1.0 - (skillCd / maxCd)));

  lastProgress = progress;
  lastIsReady = isReady;

  // Renderização da arquitetura do herói selecionado
  switch (currentHeroKey) {
    case 'MAGE':
      drawVolcanoCore(ultCtx, progress, isReady, frameCount);
      break;
    case 'ROGUE':
    case 'WARRIOR':
      drawVoidEclipse(ultCtx, progress, isReady, frameCount);
      break;
    case 'BARBARIAN':
      drawPrimalBloodTotem(ultCtx, progress, isReady, frameCount);
      break;
    case 'ALCHEMIST':
      drawCausticCrucible(ultCtx, progress, isReady, frameCount);
      break;
    case 'KNIGHT':
    case 'PALADIN':
    default:
      drawSolarCathedral(ultCtx, progress, isReady, frameCount);
      break;
  }

  // Renderização das partículas ativas
  drawActiveParticles(ultCtx);

  // Renderização do Trigger Flare (Onda de choque)
  if (triggerFlare.active) {
    ultCtx.save();
    ultCtx.beginPath();
    ultCtx.arc(CENTER_X, CENTER_Y, triggerFlare.radius, 0, Math.PI * 2);
    ultCtx.strokeStyle = triggerFlare.color;
    ultCtx.lineWidth = 3.0;
    ultCtx.globalAlpha = triggerFlare.alpha;
    ultCtx.stroke();
    ultCtx.restore();
  }
}

/**
 * 1. SIR ROLAND: CUSTÓDIA SACRA DA CATEDRAL SOLAR
 */
function drawSolarCathedral(ctx, progress, isReady, frameCount) {
  const rotAngle = frameCount * 0.012;

  // Halos periféricos além do polegar
  const haloR = isReady ? (BUTTON_RADIUS + 14 + Math.sin(frameCount * 0.08) * 3) : (BUTTON_RADIUS + 4);
  const haloGrad = ctx.createRadialGradient(CENTER_X, CENTER_Y, BUTTON_RADIUS - 6, CENTER_X, CENTER_Y, haloR);
  haloGrad.addColorStop(0, isReady ? 'rgba(255, 240, 179, 0.45)' : 'rgba(241, 196, 15, 0.12)');
  haloGrad.addColorStop(1, 'rgba(241, 196, 15, 0.00)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, haloR, 0, Math.PI * 2);
  ctx.fill();

  // Feixes de luz solar giratórios (Raios de monstrance)
  const rayMaxL = isReady ? (BUTTON_RADIUS + 18) : (BUTTON_RADIUS * progress + 2);
  ctx.save();
  ctx.translate(CENTER_X, CENTER_Y);
  ctx.rotate(rotAngle);
  for (const { cos, sin, isMajor } of SOLAR_RAYS) {
    const len = isMajor ? rayMaxL : rayMaxL * 0.72;
    const alpha = isReady ? (isMajor ? 0.65 : 0.35) : (progress * 0.25);

    ctx.strokeStyle = isMajor ? '#fff0b3' : '#d4af37';
    ctx.lineWidth = isMajor ? 1.8 : 1.0;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(cos * (BUTTON_RADIUS - 12), sin * (BUTTON_RADIUS - 12));
    ctx.lineTo(cos * len, sin * len);
    ctx.stroke();
  }
  ctx.restore();

  // Emissão de motes de poeira estelar sagrada
  if (isReady && frameCount % 6 === 0) {
    const ang = Math.random() * Math.PI * 2;
    const dist = BUTTON_RADIUS - 6 + Math.random() * 14;
    spawnParticle(
      CENTER_X + Math.cos(ang) * dist,
      CENTER_Y + Math.sin(ang) * dist,
      (Math.random() - 0.5) * 0.5,
      -0.6 - Math.random() * 0.8,
      1.5 + Math.random() * 1.5,
      0.9,
      Math.random() > 0.4 ? '#fff1cf' : '#f1c40f',
      'spark'
    );
  }
}

/**
 * 2. IGNIS: FORNALHA DAS CINZAS CELESTES
 */
function drawVolcanoCore(ctx, progress, isReady, frameCount) {
  // Halo térmico incandescente que extravasa a borda
  const pulse = Math.sin(frameCount * 0.12);
  const haloR = isReady ? (BUTTON_RADIUS + 16 + pulse * 4) : (BUTTON_RADIUS + 6);
  const haloGrad = ctx.createRadialGradient(CENTER_X, CENTER_Y, BUTTON_RADIUS - 8, CENTER_X, CENTER_Y, haloR);
  haloGrad.addColorStop(0, isReady ? 'rgba(255, 107, 107, 0.55)' : 'rgba(230, 126, 34, 0.18)');
  haloGrad.addColorStop(0.6, isReady ? 'rgba(230, 126, 34, 0.25)' : 'rgba(211, 84, 0, 0.08)');
  haloGrad.addColorStop(1, 'rgba(230, 126, 34, 0.00)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, haloR, 0, Math.PI * 2);
  ctx.fill();

  // Câmara de Magma Fluido (Sobe em nível e borbulha)
  const coreR = BUTTON_RADIUS - 10;
  ctx.save();
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, coreR, 0, Math.PI * 2);
  ctx.clip();

  // Fundo de obsidiana aquecida
  ctx.fillStyle = '#14080a';
  ctx.fillRect(CENTER_X - coreR, CENTER_Y - coreR, coreR * 2, coreR * 2);

  // Nível da lava subindo
  const lavaLevelY = CENTER_Y + coreR - (progress * coreR * 2);
  const waveAmp = isReady ? 3.0 : 1.8;
  const waveFreq = 0.18;
  const t = frameCount * waveFreq;

  ctx.beginPath();
  ctx.moveTo(CENTER_X - coreR, CENTER_Y + coreR + 4);
  for (let x = CENTER_X - coreR; x <= CENTER_X + coreR; x += 3) {
    const wave = Math.sin(x * 0.15 + t) * waveAmp;
    ctx.lineTo(x, lavaLevelY + wave);
  }
  ctx.lineTo(CENTER_X + coreR, CENTER_Y + coreR + 4);
  ctx.closePath();

  const lavaGrad = ctx.createLinearGradient(0, lavaLevelY, 0, CENTER_Y + coreR);
  lavaGrad.addColorStop(0, '#ffffff');
  lavaGrad.addColorStop(0.15, '#f1c40f');
  lavaGrad.addColorStop(0.55, '#e67e22');
  lavaGrad.addColorStop(1, '#962d1d');
  ctx.fillStyle = lavaGrad;
  ctx.fill();
  ctx.restore();

  // Emissão de brasas vivas e fagulhas
  const spawnRate = isReady ? 3 : 8;
  if (frameCount % spawnRate === 0) {
    const ang = Math.random() * Math.PI * 2;
    const dist = coreR * Math.random();
    spawnParticle(
      CENTER_X + Math.cos(ang) * dist,
      lavaLevelY + (Math.random() * 8 - 4),
      (Math.random() - 0.5) * 1.2,
      -1.2 - Math.random() * 1.5,
      1.8 + Math.random() * 1.6,
      0.75 + Math.random() * 0.3,
      Math.random() > 0.5 ? '#f39c12' : '#ff4757',
      'ember'
    );
  }
}

/**
 * 3. KAEL: SELO DO VÁCUO ASTRAL
 */
function drawVoidEclipse(ctx, progress, isReady, frameCount) {
  // Halo espectral de sombra e vácuo violeta/ciano
  const pulse = Math.sin(frameCount * 0.08);
  const haloR = isReady ? (BUTTON_RADIUS + 15 + pulse * 3) : (BUTTON_RADIUS + 4);
  const haloGrad = ctx.createRadialGradient(CENTER_X, CENTER_Y, BUTTON_RADIUS - 8, CENTER_X, CENTER_Y, haloR);
  haloGrad.addColorStop(0, isReady ? 'rgba(168, 85, 247, 0.45)' : 'rgba(56, 189, 248, 0.15)');
  haloGrad.addColorStop(0.5, isReady ? 'rgba(56, 189, 248, 0.22)' : 'rgba(168, 85, 247, 0.05)');
  haloGrad.addColorStop(1, 'rgba(12, 10, 24, 0.00)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, haloR, 0, Math.PI * 2);
  ctx.fill();

  // Anel de Vácuo em Rotação Inversa (Espiral gravitacional)
  const coreR = BUTTON_RADIUS - 9;
  ctx.save();
  ctx.translate(CENTER_X, CENTER_Y);
  const spiralAng = -frameCount * 0.025;
  ctx.rotate(spiralAng);

  const arms = 3;
  for (let a = 0; a < arms; a++) {
    const baseA = (a * Math.PI * 2) / arms;
    ctx.strokeStyle = a % 2 === 0 ? 'rgba(192, 132, 252, 0.5)' : 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let r = 5; r <= coreR; r += 3) {
      const theta = baseA + (r / coreR) * (progress * 2.5);
      const px = Math.cos(theta) * r;
      const py = Math.sin(theta) * r;
      if (r === 5) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Partículas de fumaça sendo sugadas para o centro (Vácuo)
  if (frameCount % 4 === 0) {
    const ang = Math.random() * Math.PI * 2;
    const startD = coreR + 6 + Math.random() * 12;
    const spd = 1.4 + Math.random() * 1.2;
    spawnParticle(
      CENTER_X + Math.cos(ang) * startD,
      CENTER_Y + Math.sin(ang) * startD,
      -Math.cos(ang) * spd,
      -Math.sin(ang) * spd,
      1.6 + Math.random() * 1.4,
      0.65,
      Math.random() > 0.4 ? '#c084fc' : '#38bdf8',
      'spark'
    );
  }
}

/**
 * 4. KRAGDOR: TOTEM SANGRENTO DOS ANCESTRAIS
 */
function drawPrimalBloodTotem(ctx, progress, isReady, frameCount) {
  // Batimento Cardíaco Visceral (Lub-Dub anatômico duplo) no Ready
  let heartScale = 1.0;
  if (isReady) {
    const cycle = (frameCount % 60) / 60; // 60 frames = 1 ciclo cardíaco
    if (cycle < 0.12) {
      // 1º Batimento (Lub)
      heartScale = 1.0 + Math.sin((cycle / 0.12) * Math.PI) * 0.10;
    } else if (cycle > 0.18 && cycle < 0.34) {
      // 2º Batimento (Dub) - mais expressivo
      heartScale = 1.0 + Math.sin(((cycle - 0.18) / 0.16) * Math.PI) * 0.18;
    }
  }

  // Halo de Sangue e Fúria
  const haloR = (BUTTON_RADIUS + 12) * heartScale;
  const haloGrad = ctx.createRadialGradient(CENTER_X, CENTER_Y, BUTTON_RADIUS - 8, CENTER_X, CENTER_Y, haloR);
  haloGrad.addColorStop(0, isReady ? 'rgba(231, 76, 60, 0.65)' : 'rgba(192, 57, 43, 0.20)');
  haloGrad.addColorStop(0.6, isReady ? 'rgba(214, 48, 49, 0.28)' : 'rgba(142, 68, 173, 0.08)');
  haloGrad.addColorStop(1, 'rgba(44, 10, 12, 0.00)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, haloR, 0, Math.PI * 2);
  ctx.fill();

  // Menisco de Sangue Viscoso preenchendo a câmara
  const coreR = (BUTTON_RADIUS - 10) * heartScale;
  ctx.save();
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, coreR, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = '#1c0709';
  ctx.fillRect(CENTER_X - coreR, CENTER_Y - coreR, coreR * 2, coreR * 2);

  const fillH = progress * coreR * 2;
  const bloodY = CENTER_Y + coreR - fillH;

  const bloodGrad = ctx.createLinearGradient(0, bloodY, 0, CENTER_Y + coreR);
  bloodGrad.addColorStop(0, '#ff7675');
  bloodGrad.addColorStop(0.3, '#d63031');
  bloodGrad.addColorStop(1, '#4a080a');

  ctx.fillStyle = bloodGrad;
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, coreR, 0, Math.PI * 2);
  ctx.fill();

  // Veias Rúnicas pulsantes no sangue
  if (progress > 0.4) {
    ctx.strokeStyle = isReady ? 'rgba(255, 234, 167, 0.65)' : 'rgba(241, 196, 15, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(CENTER_X - 10, CENTER_Y + 12);
    ctx.lineTo(CENTER_X, CENTER_Y - 4);
    ctx.lineTo(CENTER_X + 12, CENTER_Y + 8);
    ctx.stroke();
  }
  ctx.restore();

  // Faíscas de Sangue e Impacto Feroz
  if (isReady && (frameCount % 60 === 2 || frameCount % 60 === 13)) {
    for (let i = 0; i < 4; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 1.8 + Math.random() * 2.2;
      spawnParticle(
        CENTER_X + Math.cos(ang) * coreR,
        CENTER_Y + Math.sin(ang) * coreR,
        Math.cos(ang) * spd,
        Math.sin(ang) * spd,
        2.0 + Math.random() * 1.5,
        0.6,
        Math.random() > 0.3 ? '#ff7675' : '#f1c40f',
        'spark'
      );
    }
  }
}

/**
 * 5. VALÉRIA: RETORTA DE ALTA PRESSÃO ALQUÍMICA
 */
function drawCausticCrucible(ctx, progress, isReady, frameCount) {
  // Halo Químico de Bioluminescência Cáustica Roxa
  const pulse = Math.sin(frameCount * 0.10);
  const haloR = isReady ? (BUTTON_RADIUS + 15 + pulse * 3) : (BUTTON_RADIUS + 5);
  const haloGrad = ctx.createRadialGradient(CENTER_X, CENTER_Y, BUTTON_RADIUS - 8, CENTER_X, CENTER_Y, haloR);
  haloGrad.addColorStop(0, isReady ? 'rgba(168, 85, 247, 0.60)' : 'rgba(142, 68, 173, 0.20)');
  haloGrad.addColorStop(0.55, isReady ? 'rgba(214, 162, 232, 0.35)' : 'rgba(108, 33, 138, 0.08)');
  haloGrad.addColorStop(1, 'rgba(20, 8, 28, 0.00)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, haloR, 0, Math.PI * 2);
  ctx.fill();

  // Câmara de Vidro com Veneno Mutagênico Roxo
  const coreR = BUTTON_RADIUS - 10;
  ctx.save();
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, coreR, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = '#14081c';
  ctx.fillRect(CENTER_X - coreR, CENTER_Y - coreR, coreR * 2, coreR * 2);

  // Líquido mutagênico roxo
  const fluidY = CENTER_Y + coreR - (progress * coreR * 1.9);
  const acidGrad = ctx.createLinearGradient(0, fluidY, 0, CENTER_Y + coreR);
  acidGrad.addColorStop(0, '#f3e8ff');
  acidGrad.addColorStop(0.2, '#d6a2e8');
  acidGrad.addColorStop(0.55, '#9b59b6');
  acidGrad.addColorStop(0.85, '#6c218a');
  acidGrad.addColorStop(1, '#2c0b38');
  ctx.fillStyle = acidGrad;
  ctx.fillRect(CENTER_X - coreR, fluidY, coreR * 2, coreR * 2);
  ctx.restore();

  // Manômetro Mecânico de Pressão (Agulha analógica no anel periférico)
  const targetAngle = progress * 240; // 0 a 240 graus
  smoothGaugeAngle += (targetAngle - smoothGaugeAngle) * 0.15;
  if (isReady) {
    smoothGaugeAngle += (Math.random() - 0.5) * 5; // Trepidação na zona vermelha
  }

  // Agulha do Manômetro (Projetada no canto superior)
  const needleRad = ((smoothGaugeAngle - 120) * Math.PI) / 180;
  const needleLen = BUTTON_RADIUS - 2;
  const nx = CENTER_X + Math.cos(needleRad) * needleLen;
  const ny = CENTER_Y + Math.sin(needleRad) * needleLen;

  ctx.save();
  ctx.strokeStyle = isReady ? '#ff3838' : '#e67e22';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(CENTER_X, CENTER_Y);
  ctx.lineTo(nx, ny);
  ctx.stroke();

  // Ponta fosforescente da agulha
  ctx.fillStyle = isReady ? '#ffffff' : '#f1c40f';
  ctx.beginPath();
  ctx.arc(nx, ny, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Efervescência de bolhas de veneno roxo
  if (frameCount % 4 === 0) {
    const bx = CENTER_X + (Math.random() * (coreR * 1.4) - coreR * 0.7);
    const by = CENTER_Y + coreR - 2;
    spawnParticle(
      bx,
      by,
      (Math.random() - 0.5) * 0.3,
      -1.1 - Math.random() * 0.9,
      1.8 + Math.random() * 1.8,
      0.8,
      Math.random() > 0.4 ? '#d6a2e8' : '#a29bfe',
      'bubble'
    );
  }

  // Jatos de vapor no estado Ready (Válvula de alívio)
  if (isReady && frameCount % 6 === 0) {
    // Escape esquerdo
    spawnParticle(
      CENTER_X - BUTTON_RADIUS + 2,
      CENTER_Y,
      -1.6 - Math.random() * 1.2,
      (Math.random() - 0.5) * 0.6,
      2.5,
      0.65,
      '#f5e6ff',
      'steam'
    );
    // Escape direito
    spawnParticle(
      CENTER_X + BUTTON_RADIUS - 2,
      CENTER_Y,
      1.6 + Math.random() * 1.2,
      (Math.random() - 0.5) * 0.6,
      2.5,
      0.65,
      '#f5e6ff',
      'steam'
    );
  }
}

/**
 * Desenha todas as partículas ativas da pool
 */
function drawActiveParticles(ctx) {
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const p = particlePool[i];
    if (!p.active) continue;

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;

    if (p.type === 'bubble') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.stroke();

      // Ponto de brilho de vidro
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'steam') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
