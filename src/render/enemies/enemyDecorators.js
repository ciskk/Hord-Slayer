/**
 * src/render/enemies/enemyDecorators.js
 * 
 * Módulo especializado em decorators visuais transversais para monstros:
 * - Overlays de status (atordoamento, lentidão e auras/coroas de elite)
 * - HUD suspensa de Minibosses (barra de HP, moldura metálica e cast bar)
 * - Decorações de solo 2.5D (sombras elípticas, ondas de choque, miras de salto e fendas de emergência)
 * - Deformações cinemáticas (elevação em Z, squash elástico de antecipação e bounce de pouso)
 */
import { ctx, frameCount } from '../../state/gameState.js';
import { STALKER_DASH } from '../../config/stalkerDash.js';
import { isCrawler, orientCrawler } from '../../entities/enemies/crawlerLocomotion.js';
import { KRAGDOR_ULT } from '../../config/kragdorUlt.js';
import { drawKragdorAffliction } from '../kragdorUlt.js';
import { player } from '../../entities/player.js';

// The icon order is fixed. Reuse its eight possible combinations instead of
// allocating an array for every visible creature, including unaffected mobs.
const STATUS_ICON_COMBINATIONS = [
  [], ['poison'], ['fire'], ['poison', 'fire'],
  ['freeze'], ['poison', 'freeze'], ['fire', 'freeze'], ['poison', 'fire', 'freeze']
];
const SNOWFLAKE_ARMS = Array.from({ length: 6 }, (_, k) => {
  const ang = (k * Math.PI) / 3;
  const cos = Math.cos(ang), sin = Math.sin(ang);
  const bx = cos * 2.6, by = sin * 2.6;
  return {
    x: cos * 4.6, y: sin * 4.6, bx, by,
    barb1X: bx + Math.cos(ang + Math.PI * 0.25) * 1.6,
    barb1Y: by + Math.sin(ang + Math.PI * 0.25) * 1.6,
    barb2X: bx + Math.cos(ang - Math.PI * 0.25) * 1.6,
    barb2Y: by + Math.sin(ang - Math.PI * 0.25) * 1.6
  };
});

// Buffers offscreen pré-renderizados para os ícones de status (Zero GC, Zero Bézier por frame)
let skullCanvas = null;
let fireCanvas = null;
let snowflakeCanvas = null;

function renderPurpleSkullVector(targetCtx, x, y) {
  targetCtx.save();
  targetCtx.translate(x, y);

  // Fundo circular escuro com anel roxo radiante
  targetCtx.beginPath();
  targetCtx.arc(0, 0, 7.5, 0, Math.PI * 2);
  targetCtx.fillStyle = 'rgba(18, 10, 28, 0.92)';
  targetCtx.fill();
  targetCtx.strokeStyle = '#c084fc';
  targetCtx.lineWidth = 1.3;
  targetCtx.stroke();

  // Caixa craniana da caveira em roxo vívido
  targetCtx.fillStyle = '#a855f7';
  targetCtx.beginPath();
  targetCtx.arc(0, -1.2, 4.2, Math.PI * 0.95, Math.PI * 0.05, false);
  targetCtx.lineTo(2.2, 2.2);
  targetCtx.lineTo(1.6, 4.0);
  targetCtx.lineTo(-1.6, 4.0);
  targetCtx.lineTo(-2.2, 2.2);
  targetCtx.closePath();
  targetCtx.fill();

  // Brilho na testa
  targetCtx.fillStyle = '#e9d5ff';
  targetCtx.beginPath();
  targetCtx.arc(-1.2, -3.0, 1.2, 0, Math.PI * 2);
  targetCtx.fill();

  // Cavidades oculares escuras
  targetCtx.fillStyle = '#1e0538';
  targetCtx.beginPath();
  targetCtx.ellipse(-1.5, -0.6, 1.1, 1.4, -0.15, 0, Math.PI * 2);
  targetCtx.fill();
  targetCtx.beginPath();
  targetCtx.ellipse(1.5, -0.6, 1.1, 1.4, 0.15, 0, Math.PI * 2);
  targetCtx.fill();

  // Fossa nasal
  targetCtx.beginPath();
  targetCtx.moveTo(0, 1.2);
  targetCtx.lineTo(-0.6, 2.0);
  targetCtx.lineTo(0.6, 2.0);
  targetCtx.closePath();
  targetCtx.fill();

  // Dentes da mandíbula
  targetCtx.strokeStyle = '#1e0538';
  targetCtx.lineWidth = 0.8;
  targetCtx.beginPath();
  targetCtx.moveTo(-0.7, 2.8); targetCtx.lineTo(-0.7, 4.0);
  targetCtx.moveTo(0.7, 2.8); targetCtx.lineTo(0.7, 4.0);
  targetCtx.stroke();

  targetCtx.restore();
}

function renderFireVector(targetCtx, x, y) {
  targetCtx.save();
  targetCtx.translate(x, y);

  // Fundo circular escuro com anel de fogo alaranjado
  targetCtx.beginPath();
  targetCtx.arc(0, 0, 7.5, 0, Math.PI * 2);
  targetCtx.fillStyle = 'rgba(28, 12, 6, 0.92)';
  targetCtx.fill();
  targetCtx.strokeStyle = '#ff793f';
  targetCtx.lineWidth = 1.3;
  targetCtx.stroke();

  // Chama externa (Vermelho-Alaranjada)
  targetCtx.fillStyle = '#ff4757';
  targetCtx.beginPath();
  targetCtx.moveTo(0, 4.8);
  targetCtx.bezierCurveTo(-4.2, 4.2, -4.6, 0.5, -2.5, -1.8);
  targetCtx.bezierCurveTo(-2.8, -0.2, -2.0, 0.4, -1.2, -0.5);
  targetCtx.bezierCurveTo(-1.8, -2.6, -0.5, -4.5, 0, -5.5);
  targetCtx.bezierCurveTo(0.6, -4.0, 1.8, -2.4, 1.5, -0.4);
  targetCtx.bezierCurveTo(2.4, 0.6, 3.2, -0.2, 2.8, -1.6);
  targetCtx.bezierCurveTo(4.6, 0.5, 4.2, 4.2, 0, 4.8);
  targetCtx.closePath();
  targetCtx.fill();

  // Chama intermediária (Laranja Dourado)
  targetCtx.fillStyle = '#ffa502';
  targetCtx.beginPath();
  targetCtx.moveTo(0, 4.2);
  targetCtx.bezierCurveTo(-2.8, 3.8, -3.0, 1.2, -1.5, -0.5);
  targetCtx.bezierCurveTo(-0.8, -2.0, 0.2, -3.2, 0, -4.0);
  targetCtx.bezierCurveTo(0.8, -2.6, 1.8, -1.2, 1.5, -0.5);
  targetCtx.bezierCurveTo(3.0, 1.2, 2.8, 3.8, 0, 4.2);
  targetCtx.closePath();
  targetCtx.fill();

  // Núcleo interno incandescente (Amarelo / Branco)
  targetCtx.fillStyle = '#ffeaa7';
  targetCtx.beginPath();
  targetCtx.moveTo(0, 3.6);
  targetCtx.bezierCurveTo(-1.6, 3.4, -1.8, 1.6, -0.6, 0.2);
  targetCtx.bezierCurveTo(0, -1.0, 0.3, -1.8, 0, -2.2);
  targetCtx.bezierCurveTo(0.5, -1.4, 1.2, 0.2, 0.6, 0.2);
  targetCtx.bezierCurveTo(1.8, 1.6, 1.6, 3.4, 0, 3.6);
  targetCtx.closePath();
  targetCtx.fill();

  targetCtx.restore();
}

function renderSnowflakeVector(targetCtx, x, y) {
  targetCtx.save();
  targetCtx.translate(x, y);

  // Fundo circular escuro com anel azul gelo
  targetCtx.beginPath();
  targetCtx.arc(0, 0, 7.5, 0, Math.PI * 2);
  targetCtx.fillStyle = 'rgba(6, 18, 30, 0.92)';
  targetCtx.fill();
  targetCtx.strokeStyle = '#74b9ff';
  targetCtx.lineWidth = 1.3;
  targetCtx.stroke();

  // Floco de neve radial de 6 pontas
  targetCtx.lineCap = 'round';
  targetCtx.strokeStyle = '#e3f4ff';
  targetCtx.lineWidth = 1.2;

  targetCtx.beginPath();
  for (let k = 0; k < SNOWFLAKE_ARMS.length; k++) {
    const arm = SNOWFLAKE_ARMS[k];
    targetCtx.moveTo(0, 0);
    targetCtx.lineTo(arm.x, arm.y);
    targetCtx.moveTo(arm.bx, arm.by);
    targetCtx.lineTo(arm.barb1X, arm.barb1Y);
    targetCtx.moveTo(arm.bx, arm.by);
    targetCtx.lineTo(arm.barb2X, arm.barb2Y);
  }
  targetCtx.stroke();

  // Cristal de diamante central
  targetCtx.fillStyle = '#74b9ff';
  targetCtx.beginPath();
  targetCtx.moveTo(0, -1.8);
  targetCtx.lineTo(1.8, 0);
  targetCtx.lineTo(0, 1.8);
  targetCtx.lineTo(-1.8, 0);
  targetCtx.closePath();
  targetCtx.fill();

  // Ponto brilhante central branco
  targetCtx.fillStyle = '#ffffff';
  targetCtx.beginPath();
  targetCtx.arc(0, 0, 0.8, 0, Math.PI * 2);
  targetCtx.fill();

  targetCtx.restore();
}

function ensureStatusIconCanvases() {
  if (typeof document === 'undefined') return;
  if (!skullCanvas) {
    skullCanvas = document.createElement('canvas');
    skullCanvas.width = 24;
    skullCanvas.height = 24;
    const sCtx = skullCanvas.getContext('2d');
    renderPurpleSkullVector(sCtx, 12, 12);
  }
  if (!fireCanvas) {
    fireCanvas = document.createElement('canvas');
    fireCanvas.width = 24;
    fireCanvas.height = 24;
    const fCtx = fireCanvas.getContext('2d');
    renderFireVector(fCtx, 12, 12);
  }
  if (!snowflakeCanvas) {
    snowflakeCanvas = document.createElement('canvas');
    snowflakeCanvas.width = 24;
    snowflakeCanvas.height = 24;
    const sfCtx = snowflakeCanvas.getContext('2d');
    renderSnowflakeVector(sfCtx, 12, 12);
  }
}

/**
 * Renderiza o ícone de Caveira Roxa para envenenamento (veneno roxo da Valéria).
 */
export function drawPurpleSkullIcon(ctx, x, y) {
  ensureStatusIconCanvases();
  if (skullCanvas) {
    ctx.drawImage(skullCanvas, Math.round(x - 12), Math.round(y - 12));
  } else {
    renderPurpleSkullVector(ctx, x, y);
  }
}

/**
 * Renderiza o ícone de Fogo para queimadura ígnea contínua.
 */
export function drawFireIcon(ctx, x, y) {
  ensureStatusIconCanvases();
  if (fireCanvas) {
    ctx.drawImage(fireCanvas, Math.round(x - 12), Math.round(y - 12));
  } else {
    renderFireVector(ctx, x, y);
  }
}

/**
 * Renderiza o ícone de Floco de Neve para congelamento (Golpe Criogênico).
 */
export function drawSnowflakeIcon(ctx, x, y) {
  ensureStatusIconCanvases();
  if (snowflakeCanvas) {
    ctx.drawImage(snowflakeCanvas, Math.round(x - 12), Math.round(y - 12));
  } else {
    renderSnowflakeVector(ctx, x, y);
  }
}

/**
 * Renderiza overlays de status sobre a criatura (Stun, Slow, Elite Auras & Crown).
 * @param {Object} e Entidade do inimigo
 */
export function drawEnemyStatusOverlays(e) {
  const hasRoarMark = e.roarMarkTimer > 0 && e.isVulnerable && e.vulnerableTimer > 0;
  const isAiming = !(e.stunTimer > 0) && (e.combatState === 'WINDUP' || e.lanceState === 'aim' || e.flameState === 'aim' || e.dashState === 'aim');
  const statusMask = (((e.acidBurnTimer > 0) || ((e.acidStacks || 0) > 0 && (e.acidStackTimer || 0) > 0)) ? 1 : 0)
    | ((e.fireBurnTimer || 0) > 0 ? 2 : 0)
    | ((e.freezeTimer || 0) > 0 ? 4 : 0);
  if (!hasRoarMark && !(e.stunTimer > 0) && !(e.isVulnerable && e.vulnerableTimer > 0)
    && !e.isElite && !isAiming && statusMask === 0) return;

  ctx.save();
  if (hasRoarMark) drawKragdorAffliction(ctx, e, frameCount);
  // Status marks occupy separate regions; the creature silhouette stays clear.
  if (e.stunTimer > 0 && !hasRoarMark) {
    ctx.fillStyle = '#ead07d';
    const y = -e.radius * 1.35 - 7;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc((i ? 1 : -1) * 5, y + Math.sin(frameCount * 0.15 + i * Math.PI) * 2, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (e.isVulnerable && e.vulnerableTimer > 0 && !hasRoarMark) {
    ctx.strokeStyle = '#ed8476'; ctx.lineWidth = 1.8;
    const r = e.radius + 4;
    ctx.beginPath();
    for (const side of [-1, 1]) {
      ctx.moveTo(side * (r - 2), -4); ctx.lineTo(side * r, -4);
      ctx.lineTo(side * r, 4); ctx.lineTo(side * (r - 2), 4);
    }
    ctx.stroke();
  }
  if (e.isElite) {
    const color = e.eliteMod === 'HASTE' ? '#ead07d' : e.eliteMod === 'TOXIC' ? '#85c980' : e.eliteMod === 'FROST' ? '#95d4e8' : '#80c8bf';
    const y = -e.radius * 1.35 - (e.stunTimer > 0 ? 17 : 7);
    ctx.fillStyle = color;ctx.strokeStyle = '#11151b';ctx.lineWidth = 1.3;
    ctx.beginPath();ctx.moveTo(-6,y+3);ctx.lineTo(-7,y-3);
    ctx.lineTo(-2,y);ctx.lineTo(0,y-5);ctx.lineTo(2,y);
    ctx.lineTo(7,y-3);ctx.lineTo(6,y+3);ctx.closePath();ctx.fill();ctx.stroke();
  }
  // Alerta suspenso vermelho que carrega visualmente durante a preparação do golpe
  if (isAiming) {
    let prog = 0;
    if (e.combatState === 'WINDUP') {
      const maxF = (e.attackWindupFrames && e.attackWindupFrames > 0) ? e.attackWindupFrames : 20;
      prog = Math.min(1, Math.max(0, 1 - ((e.attackTimer || 0) / maxF)));
    } else if (e.lanceState === 'aim') {
      prog = Math.min(1, Math.max(0, 1 - ((e.lanceTimer || 0) / 20)));
    } else if (e.flameState === 'aim') {
      prog = Math.min(1, Math.max(0, 1 - ((e.flameTimer || 0) / 23)));
    } else if (e.dashState === 'aim') {
      prog = Math.min(1, Math.max(0, (e.dashTimer || 0) / STALKER_DASH.windup));
    }
    const pulse = prog > 0.82 ? Math.sin(frameCount * 0.45) * 1.5 : 0;
    const y = -e.radius * 1.35 - (e.stunTimer > 0 ? 21 : (e.isElite ? 19 : 9)) + pulse;

    ctx.save();
    ctx.scale(e.facing || 1, 1); // Anula o espelhamento do corpo para manter o glifo alinhado
    // Fundo escuro do marcador
    ctx.fillStyle = 'rgba(15, 12, 14, 0.88)';
    ctx.strokeStyle = prog > 0.85 ? '#ffffff' : '#ff4757';
    ctx.lineWidth = 1.2;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(-3.5, y - 9, 7, 10, 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(-3.5, y - 9, 7, 10);
      ctx.strokeRect(-3.5, y - 9, 7, 10);
    }
    // Barra interna que preenche em vermelho de baixo para cima conforme o ataque carrega
    const fillH = 7.5 * prog;
    ctx.fillStyle = prog > 0.85 ? '#ffffff' : '#ff4757';
    ctx.fillRect(-2, y + 0.2 - fillH, 4, fillH);
    ctx.restore();
  }

  // --- Ícones de Status sobre a Cabeça do Monstro ---
  const activeStatusIcons = STATUS_ICON_COMBINATIONS[statusMask];

  if (activeStatusIcons.length > 0) {
    ctx.save();
    // Anula o espelhamento do corpo para manter os glifos orientados corretamente
    ctx.scale(e.facing || 1, 1);

    const r = Number.isFinite(e.radius) && e.radius > 0 ? e.radius : 12;
    let iconY = -r * 1.35 - 11;

    if (isAiming) iconY -= 14;
    if (e.isElite) iconY -= 11;
    if (e.stunTimer > 0) iconY -= 9;
    if (e.isMiniBoss) iconY = -r * 1.5 - 28;

    const gap = 17;
    const totalW = (activeStatusIcons.length - 1) * gap;
    const startX = -totalW / 2;

    for (let i = 0; i < activeStatusIcons.length; i++) {
      const iconX = startX + i * gap;
      const bob = Math.sin(frameCount * 0.12 + i * 1.5) * 1.5;
      const type = activeStatusIcons[i];
      if (type === 'poison') {
        drawPurpleSkullIcon(ctx, iconX, iconY + bob);
      } else if (type === 'fire') {
        drawFireIcon(ctx, iconX, iconY + bob);
      } else if (type === 'freeze') {
        drawSnowflakeIcon(ctx, iconX, iconY + bob);
      }
    }

    ctx.restore();
  }
  ctx.restore();
}
/**
 * Renderiza a interface suspensa de Miniboss (Barra de HP, Nome Dourado e Cast Bar).
 * @param {Object} e Entidade do Miniboss
 */
export function drawMiniBossHpOverlay(e) {
  const barW = 64;
  const barH = 6;
  const hpPct = Math.max(0, Math.min(1, e.hp / (e.maxHp || e.hp || 1)));
  const offsetY = -e.radius * 1.5 - 16;

  ctx.save();
  ctx.scale(e.facing || 1, 1); // Cancel the body mirroring for readable text.
  // 1. Nome Dourado Estilizado do Miniboss
  ctx.font = "bold 9px 'Cinzel', 'Outfit', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  const bossTitle = (e.enraged ? "⚡ " : "★ ") + (e.name ? e.name.toUpperCase() : "MINIBOSS");
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillText(bossTitle, 0, offsetY - 2);
  ctx.fillStyle = e.enraged ? '#ff4757' : '#f1c40f';
  ctx.fillText(bossTitle, 0, offsetY - 3);

  // 2. Fundo e Barra de Vida Elite
  ctx.fillStyle = 'rgba(10, 12, 16, 0.9)';
  ctx.fillRect(-barW / 2, offsetY, barW, barH);
  
  ctx.fillStyle = e.enraged ? '#e74c3c' : (e.isStoneForm ? '#95a5a6' : '#f39c12');
  ctx.fillRect(-barW / 2, offsetY, barW * hpPct, barH);
  
  ctx.strokeStyle = e.enraged ? '#ff6b81' : '#f1c40f';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-barW / 2, offsetY, barW, barH);

  // 3. Barra de Conjuração (Cast Bar) em tempo real durante o WINDUP
  if (e.actionState === 'WINDUP' && e.castProgress !== undefined) {
    const castW = barW - 6;
    const castH = 3.5;
    const castY = offsetY + barH + 3;
    const prog = Math.max(0, Math.min(1, e.castProgress));

    ctx.fillStyle = 'rgba(15, 15, 20, 0.85)';
    ctx.fillRect(-castW / 2, castY, castW, castH);
    ctx.fillStyle = '#00cec9';
    ctx.fillRect(-castW / 2, castY, castW * prog, castH);
    ctx.strokeStyle = '#81ecec';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-castW / 2, castY, castW, castH);
  }

  ctx.restore();
}

/**
 * Renderiza sombras, telegrafias e alertas de emergência no solo.
 * @param {Object} e Entidade do monstro comum
 * @returns {number} shadowY Posição Y da sombra para sincronização
 */
export function drawCommonEnemyGroundDecorations(e) {
  // Sombra base agora é renderizada de forma agrupada (batched) em renderEnemiesShadows para máxima performance.
  const isFlying = e.baseType === 'BAT' || e.baseType === 'NECRO';
  const shadowBob = e.baseType === 'BAT' ? Math.sin(frameCount * 0.42) * 1.2 : 0;
  const shadowR = e.baseType === 'ZOMBIE' ? e.radius * 1.38 : e.radius;
  const shadowY = shadowR * (isFlying ? 0.95 : 0.8) + shadowBob;

  // Onda de Choque de Aterrissagem Cáustica no Solo
  if (e.landingSplashTimer > 0) {
    const splashProg = 1 - (e.landingSplashTimer / 16);
    const splashR = e.radius * (1.1 + splashProg * 1.6);
    ctx.save();
    ctx.strokeStyle = `rgba(0, 206, 201, ${0.85 * (1 - splashProg)})`;
    ctx.lineWidth = 2.4 * (1 - splashProg * 0.6);
    ctx.beginPath();
    ctx.ellipse(0, shadowY, splashR, splashR * 0.46, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(46, 204, 113, ${0.75 * (1 - splashProg)})`;
    for (let sp = 0; sp < 4; sp++) {
      const spA = sp * (Math.PI * 0.5) + splashProg * 0.8;
      const spDist = splashR * 0.85;
      ctx.fillRect(Math.cos(spA) * spDist - 1.5, shadowY + Math.sin(spA) * (spDist * 0.45) - 1.5, 3, 3);
    }
    ctx.restore();
  }

  // Telegrafia Direcional Pontilhada durante a Antecipação do Salto (Windup)
  if (e.leapState === 'windup') {
    const windupProg = Math.min(1, (e.leapTimer || 0) / (e.leapDuration || 12));
    const targetDist = Math.min(145, (e.leapSpeed || 9) * 14);
    const targetX = Math.cos(e.leapAngle || 0) * targetDist * (e.facing || 1);
    const targetY = shadowY + Math.sin(e.leapAngle || 0) * targetDist * 0.55;

    ctx.save();
    ctx.strokeStyle = `rgba(0, 206, 201, ${0.4 + windupProg * 0.55})`;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -frameCount * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, shadowY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    const targetRadius = (e.radius + 6) * (0.8 + windupProg * 0.4);
    ctx.strokeStyle = `rgba(255, 71, 87, ${0.65 + windupProg * 0.35})`;
    ctx.fillStyle = `rgba(0, 206, 201, ${0.12 + windupProg * 0.18})`;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(targetX, targetY, targetRadius, targetRadius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(targetX - 4, targetY);
    ctx.lineTo(targetX + 4, targetY);
    ctx.moveTo(targetX, targetY - 3);
    ctx.lineTo(targetX, targetY + 3);
    ctx.stroke();
    ctx.restore();
  }

  // 1.1 Telegrafia e Alerta de Emergência do Solo (Zumbis vs Vermes Cáusticos)
  if (e.emergeTimer > 0) {
    const emergeDuration = e.emergeDuration || 26;
    const progress = Math.max(0, Math.min(1, 1 - (e.emergeTimer / emergeDuration)));
    const groundRadius = e.radius * 1.5;
    const pulseAlert = Math.sin(frameCount * 0.3) * 2;
    const isWorm = e.baseType === 'SPLITTER' || e.baseType === 'SPLITTER_MINI' || e.baseType === 'TRAIL_CRAWLER';

    ctx.save();
    if (isWorm) {
      const bileRadius = groundRadius * 1.35;
      const bilePulse = Math.sin(frameCount * 0.28) * 2;

      ctx.fillStyle = '#021814';
      ctx.beginPath();
      ctx.ellipse(0, shadowY, bileRadius * 0.88, bileRadius * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#0e5344';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.ellipse(0, shadowY, bileRadius * 0.95, bileRadius * 0.46, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#1abc9c';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let t = 0; t < 7; t++) {
        const tAng = t * (Math.PI * 2 / 7) + 0.18;
        const tLen = bileRadius * (0.55 + ((t * 3) % 4) * 0.18);
        ctx.moveTo(0, shadowY);
        ctx.quadraticCurveTo(
          Math.cos(tAng + 0.3) * (tLen * 0.6),
          shadowY + Math.sin(tAng + 0.3) * (tLen * 0.3),
          Math.cos(tAng) * tLen,
          shadowY + Math.sin(tAng) * (tLen * 0.48)
        );
      }
      ctx.stroke();

      ctx.strokeStyle = `rgba(0, 206, 201, ${0.6 + progress * 0.4})`;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(0, shadowY, groundRadius + bilePulse, (groundRadius + bilePulse) * 0.48, 0, -Math.PI * 0.5, -Math.PI * 0.5 + progress * Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(0, 206, 201, ${0.1 + (1 - progress) * 0.22})`;
      ctx.beginPath();
      ctx.ellipse(0, shadowY, groundRadius + bilePulse, (groundRadius + bilePulse) * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let b = 0; b < 4; b++) {
        const bA = frameCount * 0.15 + b * 1.57;
        const bDist = groundRadius * (0.42 + (b % 2) * 0.35);
        const bR = 2.2 + Math.sin(frameCount * 0.3 + b * 2) * 1.2;
        ctx.fillStyle = b % 2 === 0 ? '#2ecc71' : '#00cec9';
        ctx.beginPath();
        ctx.arc(Math.cos(bA) * bDist, shadowY + Math.sin(bA) * (bDist * 0.45), Math.max(1, bR), 0, Math.PI * 2);
        ctx.fill();
      }

      if (progress < 0.88) {
        const alertY = shadowY - e.radius - 12 + Math.sin(frameCount * 0.25) * 2;
        ctx.fillStyle = '#00cec9';
        ctx.beginPath();
        ctx.moveTo(-5, alertY - 5);
        ctx.lineTo(-1, alertY);
        ctx.lineTo(-4, alertY + 5);
        ctx.lineTo(-6, alertY + 2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(5, alertY - 5);
        ctx.lineTo(1, alertY);
        ctx.lineTo(4, alertY + 5);
        ctx.lineTo(6, alertY + 2);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#1c1510';
      ctx.beginPath();
      ctx.ellipse(0, shadowY, groundRadius * 0.85, groundRadius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(231, 76, 60, ${0.5 + progress * 0.5})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, shadowY, groundRadius + pulseAlert, (groundRadius + pulseAlert) * 0.5, 0, -Math.PI * 0.5, -Math.PI * 0.5 + progress * Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#533b28';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let cr = 0; cr < 6; cr++) {
        const crAng = cr * (Math.PI / 3) + 0.25;
        const crLen = groundRadius * (0.6 + (cr % 3) * 0.25);
        ctx.moveTo(0, shadowY);
        ctx.lineTo(Math.cos(crAng) * crLen, shadowY + Math.sin(crAng) * (crLen * 0.5));
      }
      ctx.stroke();

      ctx.fillStyle = '#3a2717';
      for (let cl = 0; cl < 5; cl++) {
        const clAng = cl * 1.25 + frameCount * 0.05;
        const clDist = groundRadius * 0.65;
        ctx.fillRect(Math.cos(clAng) * clDist - 2, shadowY + Math.sin(clAng) * (clDist * 0.5) - 2, 4, 3);
      }

      if (progress < 0.85) {
        const alertY = shadowY - e.radius - 10 + Math.sin(frameCount * 0.2) * 2;
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.moveTo(0, alertY - 6);
        ctx.lineTo(4, alertY + 2);
        ctx.lineTo(-4, alertY + 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-0.8, alertY - 3, 1.6, 3);
        ctx.fillRect(-0.8, alertY + 1, 1.6, 1.5);
      }
    }
    ctx.restore();
  }

  // 1.2 Telegrafia de Carga Predatória Ativa no Solo (Demolidor, Golem, Vermes)
  if (e.isCharging && e.chargeWindupTimer > 0) {
    const windupMax = e.chargeWindupMax || 35;
    const windupRatio = Math.max(0, Math.min(1, 1 - (e.chargeWindupTimer / windupMax)));
    const threatR = e.radius * 2.2;

    ctx.save();
    ctx.rotate(e.chargeAngle || 0);

    const warnGrad = ctx.createRadialGradient(0, shadowY, 4, 0, shadowY, threatR);
    warnGrad.addColorStop(0, 'rgba(255, 71, 87, 0.45)');
    warnGrad.addColorStop(0.75, 'rgba(255, 71, 87, 0.18)');
    warnGrad.addColorStop(1, 'rgba(255, 71, 87, 0.0)');
    ctx.fillStyle = warnGrad;
    ctx.beginPath();
    ctx.arc(0, shadowY, threatR, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.lineTo(0, shadowY);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 71, 87, ${0.6 + windupRatio * 0.4})`;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, shadowY, threatR, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, shadowY, threatR * Math.max(0.2, windupRatio), -Math.PI * 0.42, Math.PI * 0.42);
    ctx.stroke();

    ctx.restore();
  }

  return shadowY;
}

/**
 * Aplica as transformações matriciais de elevação em Z e deformações dinâmicas de squash/bounce.
 * @param {Object} e Entidade do monstro comum
 */
export function applyKinematicDeformations(e) {
  if (isCrawler(e)) {
    // Altitude stays vertical on screen; squash follows the creature's own axis.
    ctx.translate(0, -Math.max(0, e.jumpZ || 0));
    orientCrawler(ctx, e);
    if (e.jumpZ > 0) ctx.scale(1.28, 0.78);
    else if (e.leapState === 'windup') {
      const tension = Math.sin(Math.min(1, (e.leapTimer || 0) / (e.leapDuration || 12)) * Math.PI);
      ctx.scale(1 - tension * 0.22, 1 + tension * 0.18);
    } else if (e.leapState === 'landing') {
      const impact = 1 - Math.min(1, (e.leapTimer || 0) / (e.leapDuration || 8));
      ctx.scale(1 + impact * 0.35, 1 - impact * 0.3);
    }
    return;
  }
  if (e.roarMarkTimer > KRAGDOR_ULT.vulnerableDuration - 18) {
    const age = KRAGDOR_ULT.vulnerableDuration - e.roarMarkTimer;
    const recoil = Math.sin(age * 0.85) * (1 - age / 18);
    ctx.translate(recoil * 1.8, 0);
    ctx.rotate(recoil * 0.065);
  }
  if (e.jumpZ > 0) {
    ctx.translate(0, -e.jumpZ);
    ctx.scale(1.28, 0.78);
    if (e.baseType === 'SPLITTER_MINI') {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#00cec9';
      ctx.beginPath();
      ctx.arc(-e.radius * 0.7, 0, e.radius * 0.75, 0, Math.PI * 2);
      ctx.arc(-e.radius * 1.3, 0, e.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (e.leapState === 'windup') {
    const windupProg = Math.min(1, (e.leapTimer || 0) / (e.leapDuration || 12));
    const squashScale = 1 + Math.sin(windupProg * Math.PI) * 0.28;
    const stretchY = 1 - Math.sin(windupProg * Math.PI) * 0.28;
    const tensionJitter = (Math.random() - 0.5) * 1.5;
    ctx.translate(tensionJitter, 0);
    ctx.scale(squashScale, stretchY);
  } else if (e.leapState === 'landing') {
    const landProg = Math.min(1, (e.leapTimer || 0) / (e.leapDuration || 8));
    const bounceX = 1 + (1 - landProg) * 0.35;
    const bounceY = 1 - (1 - landProg) * 0.30;
    ctx.scale(bounceX, bounceY);
  }
}

let lastTelegraphFrame = -1;
let telegraphsDrawnThisFrame = 0;
const MAX_TELEGRAPH_RENDERS_PER_FRAME = 6;

/**
 * Renderiza a telegrafia visual vermelha que carrega visualmente no solo durante o ataque do mob.
 * - Cone Direcional de Perigo: preenche dinamicamente em vermelho luminoso (0% a 100%) em direção ao alvo.
 * - Anel Radial Circular 360° na Base: indicador no chão com medidor e ponto guia iluminado.
 * - Clarão de Impacto (Strike): efeito visual de corte carmesim no ápice do ataque.
 * @param {Object} e Entidade do monstro atacante
 */
export function drawEnemyAttackTelegraph(e) {
  if (!e || e.stunTimer > 0) return;

  let isAttacking = false;
  let progress = 0;
  let isStrike = false;
  let attackAngle = 0;
  let attackRange = 0;

  if (e.combatState === 'WINDUP') {
    isAttacking = true;
    const maxFrames = (e.attackWindupFrames && e.attackWindupFrames > 0) ? e.attackWindupFrames : 20;
    const curTimer = Math.max(0, e.attackTimer !== undefined ? e.attackTimer : 0);
    progress = Math.min(1, Math.max(0, 1 - (curTimer / maxFrames)));
    const reach = e.attackRange !== undefined ? e.attackRange : 7;
    attackRange = (player && player.radius ? player.radius : 14) + e.radius + reach;
  } else if (e.combatState === 'STRIKE') {
    isAttacking = true;
    isStrike = true;
    progress = 1.0;
    attackAngle = e.attackAngle !== undefined ? e.attackAngle : (player ? Math.atan2(player.y - e.y, player.x - e.x) : (e.facing === -1 ? Math.PI : 0));
    const reach = e.attackRange !== undefined ? e.attackRange : 7;
    attackRange = (player && player.radius ? player.radius : 14) + e.radius + reach;
  } else if (e.lanceState === 'aim') {
    isAttacking = true;
    progress = Math.min(1, Math.max(0, 1 - ((e.lanceTimer || 0) / 20)));
    attackAngle = e.lanceAngle !== undefined ? e.lanceAngle : (player ? Math.atan2(player.y - e.y, player.x - e.x) : 0);
    attackRange = 85;
  } else if (e.flameState === 'aim') {
    isAttacking = true;
    progress = Math.min(1, Math.max(0, 1 - ((e.flameTimer || 0) / 23)));
    attackAngle = e.flameAngle !== undefined ? e.flameAngle : (player ? Math.atan2(player.y - e.y, player.x - e.x) : 0);
    attackRange = 85;
  } else if (e.dashState === 'aim') {
    isAttacking = true;
    progress = Math.min(1, Math.max(0, (e.dashTimer || 0) / STALKER_DASH.windup));
    attackAngle = e.dashAngle !== undefined ? e.dashAngle : (player ? Math.atan2(player.y - e.y, player.x - e.x) : 0);
    attackRange = 95;
  } else if (e.actionState === 'WINDUP' && !e.isBoss) {
    isAttacking = true;
    progress = e.castProgress !== undefined ? e.castProgress : Math.min(1, Math.max(0, 1 - ((e.actionTimer || 0) / (e.actionMaxTimer || 20))));
    attackAngle = e.pounceAngle !== undefined ? e.pounceAngle : (player ? Math.atan2(player.y - e.y, player.x - e.x) : (e.facing === -1 ? Math.PI : 0));
    attackRange = e.radius * 2.4 + 25;
  }

  if (!isAttacking) return;

  // LOD de Telegrafia: limita o teto de telegrafias simultâneas de monstros comuns para preservar FPS e legibilidade
  if (frameCount !== lastTelegraphFrame) {
    lastTelegraphFrame = frameCount;
    telegraphsDrawnThisFrame = 0;
  }
  const isPriority = e.isBoss || e.isMiniBoss || e.isElite;
  if (!isPriority && telegraphsDrawnThisFrame >= MAX_TELEGRAPH_RENDERS_PER_FRAME) {
    return;
  }
  if (!isPriority) telegraphsDrawnThisFrame++;

  ctx.save();
  // Neutraliza o scale(e.facing, 1) para rotações angulares no espaço global do mundo
  if ((e.facing || 1) === -1) {
    ctx.scale(-1, 1);
  }

  // 1. CONE DIRECIONAL DE PERIGO NO SOLO
  const arcHalf = Math.PI * 0.42;
  const startAng = attackAngle - arcHalf;
  const endAng = attackAngle + arcHalf;
  const maxR = Math.max(e.radius + 10, attackRange);

  // A. Área total telegrafada de perigo (Background avermelhado translúcido)
  ctx.fillStyle = 'rgba(231, 76, 60, 0.08)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, maxR, startAng, endAng);
  ctx.closePath();
  ctx.fill();

  // Borda delimitadora sólida com baixa opacidade (Zero pipeline flush de setLineDash)
  ctx.strokeStyle = 'rgba(255, 71, 87, 0.38)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(0, 0, maxR, startAng, endAng);
  ctx.stroke();

  // Raios delimitadores laterais
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(startAng) * maxR, Math.sin(startAng) * maxR);
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(endAng) * maxR, Math.sin(endAng) * maxR);
  ctx.stroke();

  // B. PREENCHIMENTO VERMELHO QUE CARREGA VISUALMENTE
  const currentR = Math.max(e.radius * 0.6, maxR * Math.max(0.06, progress));

  if (!isStrike) {
    // Preenchimento carmesim volumétrico avançando radialmente (Zero alocações de gradiente por quadro)
    ctx.fillStyle = `rgba(231, 76, 60, ${0.18 + progress * 0.36})`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, currentR, startAng, endAng);
    ctx.closePath();
    ctx.fill();

    // Frente de onda vermelha carregando
    const isImminent = progress > 0.82;
    ctx.strokeStyle = isImminent ? '#ffffff' : '#ff4757';
    ctx.lineWidth = isImminent ? 3.0 : 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, currentR, startAng, endAng);
    ctx.stroke();

    // Faixa interna de alta energia na iminência do golpe
    if (isImminent) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(0, 0, currentR * 0.94, startAng, endAng);
      ctx.stroke();
    }
  } else {
    // CLARÃO / CORTE DE IMPACTO DO GOLPE (STRIKE)
    ctx.fillStyle = 'rgba(255, 71, 87, 0.58)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, maxR, startAng, endAng);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.arc(0, 0, maxR, startAng, endAng);
    ctx.stroke();
  }

  // 2. ANEL DE CARGA RADIAL 360° NA BASE DO MOB
  const ringR = Math.max(10, e.radius + 4);
  const startRingAng = -Math.PI * 0.5; // Topo (12 horas)
  const sweepAng = progress * Math.PI * 2;

  // Trilho de fundo do anel
  ctx.strokeStyle = 'rgba(255, 71, 87, 0.25)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, ringR, 0, Math.PI * 2);
  ctx.stroke();

  // Arco vermelho preenchendo no sentido horário
  if (sweepAng > 0) {
    const isRingFull = progress > 0.82;
    ctx.strokeStyle = isRingFull ? '#ffffff' : '#ff4757';
    ctx.lineWidth = isRingFull ? 2.6 : 2.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, ringR, startRingAng, startRingAng + sweepAng);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // Ponto luminoso guia na cabeça da barra de carga
    const tipX = Math.cos(startRingAng + sweepAng) * ringR;
    const tipY = Math.sin(startRingAng + sweepAng) * ringR;
    ctx.fillStyle = isRingFull ? '#ffffff' : '#ff6b81';
    ctx.beginPath();
    ctx.arc(tipX, tipY, isRingFull ? 2.6 : 2.0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
