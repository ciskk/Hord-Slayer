import { t, formatNumber } from '../i18n/index.js';
import { MONOLITH_CONFIG } from '../entities/bosses/abyssalMonolith/constants.js';
import { REAPER_CONFIG } from '../entities/bosses/supremeReaper/constants.js';
import { VAMPIRE_CONFIG } from '../entities/bosses/vampireLord/constants.js';

const sequences = {
  1: [[2, VAMPIRE_CONFIG.ENRAGE_HP_RATIO, 'hasEnraged', 'match.phase.rage', '#e74c3c']],
  2: [[2, MONOLITH_CONFIG.P2_HP_RATIO, 'hasTransitionedP2', 'match.phase.magma', '#ff9f43'],
      [3, MONOLITH_CONFIG.P3_HP_RATIO, 'isPhase3', 'match.phase.fusion', '#ff4757']],
  3: [[2, REAPER_CONFIG.ENRAGE_HP_RATIO, 'hasEnraged', 'match.phase.reaper', '#a29bfe'],
      [3, REAPER_CONFIG.PHASE3_HP_RATIO, 'isPhase3', 'match.phase.dance', '#dfe6e9']],
  4: [[2, 0.70, 'hasTriggeredPhase2', 'match.phase.horizon', '#e84393'],
      [3, 0.30, 'hasTriggeredPhase3', 'match.phase.singularity', '#00cec9']]
};

function hexToRgba(hex, alpha) {
  if (!hex || !hex.startsWith('#')) return `rgba(231, 76, 60, ${alpha})`;
  const clean = hex.replace('#', '');
  let r, g, b;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else {
    const num = parseInt(clean, 16);
    r = (num >> 16) & 255;
    g = (num >> 8) & 255;
    b = num & 255;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function isBossPhaseReady(boss, phase) {
  return (boss.cinematicCompletedPhase || 1) >= phase;
}

/**
 * Atualiza o relógio da transição cinematográfica de fases.
 * Executa uma progressão orquestrada em 3 Atos com Slow Motion e metamorfose contínua da skin.
 */
export function updateBossPhaseCinematic(boss, dt, context = {}) {
  if (!boss || boss.hp <= 0 || boss.actionState === 'DEATH_COLLAPSE') return false;

  if (!boss.phaseCinematic) {
    if (boss.actionState === 'SPAWN_INTRO' || /TRANSITION/.test(boss.actionState)) return false;
    const next = (sequences[boss.bossId] || []).find(([, , flag]) => !boss[flag]);
    if (!next || isBossPhaseReady(boss, next[0])) return false;
    const ratio = boss.hp / boss.maxHp;
    if (!(boss.bossId === 4 ? ratio <= next[1] : ratio < next[1])) return false;

    boss.phaseCinematic = {
      phase: next[0],
      hpRatio: next[1],
      flag: next[2],
      title: t(next[3]),
      color: next[4],
      elapsed: 0,
      duration: next[0] === 3 ? 180 : 160,
      morphProgress: 0,
      shockwaveTriggered: false
    };
    boss.transformationProgress = 0;
  }

  const sequence = boss.phaseCinematic;
  sequence.elapsed = Math.min(sequence.duration, sequence.elapsed + Math.max(0, dt));
  const p = sequence.elapsed / sequence.duration;

  // Curva de Metamorfose Visual em Slow Motion:
  // Ato 1 (0% a 20%): Preparação / Foco da câmera em slow motion. morph = 0.
  // Ato 2 (20% a 75%): Metamorfose visual ativa contínua. morph progride de 0.0 a 1.0 (smoothstep).
  // Ato 3 (75% a 100%): Clímax alcançado. Nova skin 100% manifesta (morph = 1.0).
  let morph = 0;
  if (p >= 0.20 && p <= 0.75) {
    const t = (p - 0.20) / 0.55;
    morph = t * t * (3 - 2 * t);
  } else if (p > 0.75) {
    morph = 1.0;
  }

  sequence.morphProgress = morph;
  boss.transformationProgress = morph;

  // Estabiliza movimento do chefe para foco central durante a transformação
  boss.vx = (boss.vx || 0) * 0.85;
  boss.vy = (boss.vy || 0) * 0.85;

  // Pulso de Detonação e Onda de Choque no Clímax (p >= 0.75)
  if (p >= 0.75 && !sequence.shockwaveTriggered) {
    sequence.shockwaveTriggered = true;
    if (context.triggerShake) context.triggerShake(14);
    if (context.playSfx) context.playSfx('boss');
    if (context.triggerHaptic) context.triggerHaptic('heavy');
    if (context.bossShockwaves) {
      context.bossShockwaves.push({
        x: boss.x,
        y: boss.y,
        radius: 18,
        maxRadius: 320,
        speed: 4.8,
        damage: 0,
        colorRgb: sequence.color.startsWith('#') 
          ? hexToRgba(sequence.color, 1).replace('rgba(', '').replace(', 1)', '')
          : '255, 71, 87',
        hitPlayer: false
      });
    }
    if (context.createHitParticles) {
      for (let i = 0; i < 26; i++) {
        context.createHitParticles(boss.x, boss.y, sequence.color, 1.6);
      }
    }
  }

  // Finalização da transição
  if (sequence.elapsed >= sequence.duration) {
    boss.cinematicCompletedPhase = sequence.phase;
    boss.transformationProgress = 1.0;
    boss.phaseCinematic = null;
  }

  return true;
}

export function drawBossPhaseCinematic(ctx, boss, w, h, camera, zoom) {
  const s = boss?.phaseCinematic;
  if (!s) return;

  const p = s.elapsed / s.duration;
  const morph = s.morphProgress || 0;
  const isCompact = h < 520 || w < 600;

  ctx.save();

  // 1. EFEITOS CINEMATOGRÁFICOS EM COORDENADAS DE TELA AO REDOR DO CHEFE
  if (camera && zoom && boss) {
    const bx = (boss.x - camera.x) * zoom;
    const by = (boss.y - camera.y) * zoom;

    // Vinheta Theatrical Radial com foco no chefe
    const vignetteAlpha = Math.sin(p * Math.PI) * 0.42;
    const maxVignetteR = Math.max(w, h) * 0.75;
    const vigGrad = ctx.createRadialGradient(bx, by, 80 * zoom, bx, by, maxVignetteR);
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(0.55, `rgba(0, 0, 0, ${vignetteAlpha * 0.5})`);
    vigGrad.addColorStop(1, `rgba(0, 0, 0, ${vignetteAlpha * 0.95})`);
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);

    // Aura Cósmica de Metamorfose pulsando em Slow Motion em torno do corpo do chefe
    const auraR = (boss.radius || 45) * zoom * (1.1 + morph * 0.9 + Math.sin(s.elapsed * 0.08) * 0.15);
    const auraGrad = ctx.createRadialGradient(bx, by, 10, bx, by, auraR);
    auraGrad.addColorStop(0, hexToRgba(s.color, 0.45 * Math.sin(p * Math.PI)));
    auraGrad.addColorStop(0.65, hexToRgba(s.color, 0.20 * Math.sin(p * Math.PI)));
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(bx, by, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Anéis rúnicos concêntricos girando lentamente e contraindo no chefe
    if (morph > 0.05 && morph < 0.95) {
      const ringAlpha = Math.sin(morph * Math.PI) * 0.65;
      const ringRot = s.elapsed * 0.025;
      const ringR = auraR * 1.05;

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(ringRot);
      ctx.strokeStyle = hexToRgba(s.color, ringAlpha);
      ctx.lineWidth = 1.8;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, ringR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.rotate(-ringRot * 2);
      ctx.strokeStyle = hexToRgba('#ffffff', ringAlpha * 0.75);
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, ringR * 0.78, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 2. LETREIRO E TIPOGRAFIA CINEMATOGRÁFICA
  let textAlpha = 0;
  if (p < 0.15) {
    textAlpha = p / 0.15;
  } else if (p < 0.80) {
    textAlpha = 1.0;
  } else {
    textAlpha = Math.max(0, (1 - p) / 0.20);
  }
  textAlpha = textAlpha * textAlpha * (3 - 2 * textAlpha);

  ctx.globalAlpha = textAlpha;
  ctx.textAlign = 'center';

  const cy = h * (isCompact ? 0.81 : 0.77);

  // Sub-crachá / Subtítulo: ◆ FASE X ◆
  ctx.font = `bold ${isCompact ? 10 : 12}px sans-serif`;
  ctx.letterSpacing = '3px';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = s.color;
  ctx.shadowBlur = 8;
  ctx.fillText(t('match.canvas.phase', { number: s.phase }), w / 2, cy - (isCompact ? 18 : 22));

  // Título Principal com Brilho Gótico
  const fontSize = Math.max(16, Math.min(isCompact ? 24 : 32, Math.floor(w / 22)));
  ctx.font = `bold ${fontSize}px Georgia, serif`;
  ctx.shadowColor = s.color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = s.color;
  ctx.fillText(s.title, w / 2, cy + 6, w * 0.88);

  // Linha divisória ornamental dourada sob o título
  ctx.shadowBlur = 4;
  const lineW = Math.min(isCompact ? 160 : 240, w * 0.50) * Math.min(1.0, p * 2.5);
  ctx.strokeStyle = hexToRgba(s.color, 0.7);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w / 2 - lineW / 2, cy + 18);
  ctx.lineTo(w / 2 + lineW / 2, cy + 18);
  ctx.stroke();

  // Losango central na linha
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(w / 2, cy + 18, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
