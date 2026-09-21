/**
 * src/render/heroes/index.js
 * 
 * Despachante unificado de renderização procedural de heróis de Hord.io.
 * Mapeia cada chave de classe para seu renderizador modular dedicado.
 */
import { CHARACTERS } from '../../config/characters.js';
import { drawRolandModel, drawRolandHammerModel } from './rolandRenderer.js';
import { drawKragdorModel } from './kragdorRenderer.js';
import { drawValeriaModel } from './valeriaRenderer.js';
import { drawIgnisModel } from './ignisRenderer.js';
import { drawKaelModel } from './kaelRenderer.js';

export {
  drawRolandModel,
  drawRolandHammerModel,
  drawKragdorModel,
  drawValeriaModel,
  drawIgnisModel,
  drawKaelModel
};

/**
 * Renderiza proceduralmente o personagem jogável selecionado e seus efeitos corporais.
 * @param {CanvasRenderingContext2D} c Contexto de renderização
 * @param {string} heroKey Identificador do herói ('KNIGHT' | 'BARBARIAN' | 'ALCHEMIST' | 'MAGE' | 'ROGUE')
 * @param {Object} state Estado do modelo para animação, postura e efeitos
 */
export function renderHeroModel(c, heroKey, state = {}) {
  const charDef = CHARACTERS[heroKey] || CHARACTERS.KNIGHT;
  const x = state.x || 0;
  const y = state.y || 0;
  const facing = state.facing !== undefined ? state.facing : 1;
  const scale = state.scale !== undefined ? state.scale : 1;
  const isMoving = !!state.isMoving;
  const walkCycle = state.walkCycle || 0;
  const tFrame = state.tFrame !== undefined ? state.tFrame : (state.frameCount !== undefined ? state.frameCount : (typeof frameCount !== 'undefined' ? frameCount : 0));
  const berserkTimer = state.berserkTimer || 0;
  const invisTimer = state.invisTimer || 0;
  const radius = state.radius || 14;
  const dashDuration = state.dashDuration || 0;
  const ignisDashDuration = state.ignisDashDuration || 0;
  const staffCastTimer = state.staffCastTimer || 0;
  const potionThrowTimer = state.potionThrowTimer || 0;
  const alchemistSkillTimer = state.alchemistSkillTimer || 0;
  const iFrames = state.iFrames || 0;
  const isRetaliating = state.isRetaliating !== undefined ? state.isRetaliating : (iFrames > 12);
  const hammerProgress = state.hammerProgress !== undefined ? state.hammerProgress : (state.isHammerAttacking ? 0.45 : -1);
  const isHammerAttacking = hammerProgress >= 0 && hammerProgress <= 1.0;
  const evolvedHammer = !!(state.evolvedHammer || state.isEvolvedHammer);
  const isBerserk = state.isBerserk !== undefined ? state.isBerserk : (berserkTimer > 0);
  const fluidColor = state.fluidColor || (state.evolvedPotion ? '#a29bfe' : '#9b59b6');
  const isCasting = state.isCasting !== undefined ? state.isCasting : (staffCastTimer > 0 || !!state.isStaffCasting);
  const isPhasing = state.isPhasing !== undefined ? state.isPhasing : (invisTimer > 0 || !!state.isPhasing);
  const isAttacking = !!state.isSwordAttacking;
  const isThrowing = state.isThrowing !== undefined ? state.isThrowing : (potionThrowTimer > 0 || !!state.isThrowingPotion);
  const isAlchemistSkill = state.isAlchemistSkill !== undefined ? state.isAlchemistSkill : (alchemistSkillTimer > 0);
  const isAlchemistCombat = !!state.isAlchemistCombat;
  const isDashing = state.isDashing !== undefined ? state.isDashing : (dashDuration > 0 || ignisDashDuration > 0);

  const isDying = !!state.isDying;
  const fallProgress = state.fallProgress || 0;
  const evaporateProgress = state.evaporateProgress || 0;

  c.save();
  c.translate(x, y);

  // Sombra no solo desacoplada (permanece diegética na horizontal e alarga ao deitar)
  if (state.showShadow !== false) {
    const shadowStretch = isDying ? (1.0 + fallProgress * 0.75) : 1.0;
    const shadowAlpha = 0.45;
    c.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    c.beginPath();
    c.ellipse(0, 15 + (isDying ? fallProgress * 2 : 0), 14 * shadowStretch, 6 * (isDying ? (1 - fallProgress * 0.2) : 1), 0, 0, Math.PI * 2);
    c.fill();
  }

  c.scale(facing * scale, scale);

  // Animação de Colapso e Corpo Prostrado no Solo
  if (isDying) {
    const fallDir = -1; // tomba para trás
    const fallAngle = fallProgress * (Math.PI * 0.44) * fallDir;
    const sinkY = fallProgress * 12;
    const squishY = 1.0 - (fallProgress * 0.32);

    c.translate(0, sinkY);
    c.rotate(fallAngle);
    c.scale(1.0, squishY);

    if (evaporateProgress > 0) {
      // O corpo do herói permanece deitado no solo; a evaporação adiciona luminescência de alma
      if (state.soulColor) {
        c.shadowColor = state.soulColor;
        c.shadowBlur = 12 * Math.min(1.0, evaporateProgress * 1.5);
      }
    }
  }

  if (berserkTimer > 0 || isBerserk) {
    const bPulse = Math.sin(tFrame * 0.3) * 4;
    c.strokeStyle = 'rgba(231, 76, 60, 0.8)';
    c.lineWidth = 3.5;
    c.beginPath();
    c.arc(0, 2, radius + 10 + bPulse, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = 'rgba(230, 126, 34, 0.22)';
    c.fill();
  }

  if (invisTimer > 0) {
    c.globalAlpha = 0.45;
  }

  const bob = isDying ? 0 : (isMoving ? Math.sin(walkCycle * 2) * 2.5 : Math.sin(tFrame * 0.05) * 0.8);
  const legSwing = isDying ? 0 : (isMoving ? Math.sin(walkCycle) * 5.5 : 0);
  const capeWave = isDying ? 0 : (isMoving ? Math.sin(walkCycle) * 4 : Math.sin(tFrame * 0.08) * 1.5);

  const heroOptions = {
    bob, legSwing, capeWave, tFrame,
    isMoving, walkCycle, scale, facing, radius,
    isDashing, isRetaliating, isHammerAttacking, evolvedHammer, hammerProgress,
    isBerserk, berserkTimer,
    isThrowing, isAlchemistSkill, isAlchemistCombat, alchemistSkillTimer, fluidColor,
    isCasting, staffCastTimer,
    isPhasing, isAttacking
  };

  if (heroKey === 'KNIGHT') {
    drawRolandModel(c, charDef, state, heroOptions);
  } else if (heroKey === 'BARBARIAN') {
    drawKragdorModel(c, charDef, state, heroOptions);
  } else if (heroKey === 'ALCHEMIST') {
    drawValeriaModel(c, charDef, state, heroOptions);
  } else if (heroKey === 'MAGE') {
    drawIgnisModel(c, charDef, state, heroOptions);
  } else if (heroKey === 'ROGUE') {
    drawKaelModel(c, charDef, state, bob, legSwing, capeWave, tFrame, isPhasing, isAttacking);
  } else {
    // Fallback genérico para chaves de heróis não mapeadas
    c.fillStyle = charDef.color.cape || '#7f8c8d';
    c.beginPath();
    c.moveTo(-4, -2 + bob);
    c.lineTo(-12 - Math.abs(capeWave), 13 + bob);
    c.lineTo(-2, 14 + bob);
    c.lineTo(2, -2 + bob);
    c.closePath();
    c.fill();

    c.fillStyle = '#1e1b18';
    c.fillRect(-6 - legSwing * 0.4, 7 + bob, 4, 7);
    c.fillRect(2 + legSwing * 0.4, 7 + bob, 4, 7);

    c.fillStyle = charDef.color.armor || '#95a5a6';
    c.fillRect(-8, -4 + bob, 16, 12);
  }

  c.restore();
}
