import { CHARACTERS } from '../config/characters.js';
import { AXE_BASE_RADIUS, AXE_SPIN_DIRECTION, getAxeCount } from '../config/axes.js';
import { drawKragdorAxe } from './heroes/kragdorAxe.js';

const axeSpriteCache = {};
function getAxeSprite(isEvolved, isBerserk) {
  const key = String(isEvolved) + '_' + String(isBerserk);
  if (axeSpriteCache[key]) return axeSpriteCache[key];
  // Resolução suficiente para ampliar a mesma arma no characterPreview.
  const off = document.createElement('canvas');
  off.width = off.height = 256;
  const c = off.getContext('2d');
  c.scale(4, 4);
  c.translate(32, 24);
  drawKragdorAxe(c, CHARACTERS.BARBARIAN.color, { isEvolved, isBerserk });
  axeSpriteCache[key] = off;
  return off;
}

export function drawKragdorAxes(c, state) {
  const count = getAxeCount(state);
  if (count === 0) return;
  const r = state.axeRadius || AXE_BASE_RADIUS;
  const isBerserk = (state.berserkTimer || 0) > 0;
  const isEvolved = !!state.evolvedAxe;

  // 1. Anel Guia Orbital
  c.strokeStyle = isEvolved
    ? 'rgba(230, 126, 34, 0.45)'
    : (isBerserk ? 'rgba(231, 76, 60, 0.40)' : 'rgba(241, 196, 15, 0.22)');
  c.lineWidth = isEvolved ? 3.0 : (isBerserk ? 2.5 : 1.8);
  c.beginPath();
  c.arc(state.x, state.y, r, 0, Math.PI * 2);
  c.stroke();

  // Sprite pré-renderizado de alta resolução do Machado
  const axeSprite = getAxeSprite(isEvolved, isBerserk);

  // 2. Renderização de cada Machado Nórdico e seu Rastro de Corte
  for (let i = 0; i < count; i++) {
    const angle = state.axeAngle + (i * (Math.PI * 2 / count));
    const ax = state.x + Math.cos(angle) * r;
    const ay = state.y + Math.sin(angle) * r;

    // 2.1 Esteira Dinâmica de Corte em Arco (1 único traço nítido e luminoso ao invés de 2 arcos pesados de 9px e 18px)
    const trailLength = isBerserk ? 0.65 : (isEvolved ? 0.52 : 0.38);
    const ribbonStart = angle - AXE_SPIN_DIRECTION * trailLength;

    c.strokeStyle = isBerserk
      ? 'rgba(231, 76, 60, 0.70)'
      : (isEvolved ? 'rgba(243, 156, 18, 0.65)' : 'rgba(241, 196, 15, 0.45)');
    c.lineWidth = isEvolved ? 4.5 : (isBerserk ? 4.0 : 3.0);
    c.beginPath();
    c.arc(state.x, state.y, r + 2, ribbonStart, angle, AXE_SPIN_DIRECTION < 0);
    c.stroke();

    // 2.2 Desenho Acelerado via Sprite Blit
    c.save();
    c.translate(ax, ay);
    c.rotate(angle + Math.PI / 2);
    const aScale = state.axeScale || 1.0;
    if (aScale !== 1.0) c.scale(aScale, aScale);
    c.drawImage(axeSprite, -32, -24, 64, 64);
    c.restore();
  }
}
