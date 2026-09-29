import { getGraphicsProfile } from '../../core/responsive.js';

// Buffers estáticos para renderização de rastros balísticos (Zero Alocação no Hot Path)
const MAX_TRAIL_PTS = 32;
const _trailAllX = new Float32Array(MAX_TRAIL_PTS);
const _trailAllY = new Float32Array(MAX_TRAIL_PTS);
const _trailLeftX = new Float32Array(MAX_TRAIL_PTS);
const _trailLeftY = new Float32Array(MAX_TRAIL_PTS);
const _trailRightX = new Float32Array(MAX_TRAIL_PTS);
const _trailRightY = new Float32Array(MAX_TRAIL_PTS);

/** Draw the existing art at full quality or the budgeted presentation. */
export function drawStaffBullet(ctx, b, frameCount) {
  const profile = getGraphicsProfile();
  if (profile.simpleEffects) {
    drawSimpleStaffBullet(ctx, b, profile.staffTrailPoints);
    return;
  }
  const rad = b.radius || 9;
  const spin = frameCount * 0.25;

  // 1. RASTRO DE FOGO EM CAUDA DE COMETA FLUIDA (Continuous Flame Comet Ribbon - Zero Allocations)
  if (b.trail && b.trail.length > 0) {
    ctx.save();
    const trailLen = b.trail.length;
    const numPts = Math.min(MAX_TRAIL_PTS, trailLen + 1);
    _trailAllX[0] = b.x;
    _trailAllY[0] = b.y;
    for (let t = 0; t < trailLen && t + 1 < MAX_TRAIL_PTS; t++) {
      _trailAllX[t + 1] = b.trail[t].x;
      _trailAllY[t + 1] = b.trail[t].y;
    }

    if (numPts >= 2) {
      for (let t = 0; t < numPts; t++) {
        const ptx = _trailAllX[t];
        const pty = _trailAllY[t];
        const progress = t / (numPts - 1 || 1); // 0 (cabeça) -> 1 (ponta da cauda)
        const taper = Math.pow(1 - progress, 0.82);
        const currentW = (rad * 1.35) * taper;

        // Vetor tangencial e perpendicular
        let segAngle = b.angle || 0;
        if (t < numPts - 1) {
          segAngle = Math.atan2(_trailAllY[t + 1] - pty, _trailAllX[t + 1] - ptx);
        } else if (t > 0) {
          segAngle = Math.atan2(pty - _trailAllY[t - 1], ptx - _trailAllX[t - 1]);
        }

        // Ondulação térmica viva de labareda com o vento e deslocamento
        const wave = Math.sin(frameCount * 0.42 + t * 1.3) * (rad * 0.35 * taper);
        const perpX = -Math.sin(segAngle);
        const perpY = Math.cos(segAngle);

        _trailLeftX[t] = ptx + perpX * (currentW + wave);
        _trailLeftY[t] = pty + perpY * (currentW + wave);
        _trailRightX[t] = ptx - perpX * (currentW - wave);
        _trailRightY[t] = pty - perpY * (currentW - wave);
      }

      // A. Manto Externo de Fogo Vivo (Carmesim / Laranja Incandescente)
      ctx.beginPath();
      ctx.moveTo(_trailLeftX[0], _trailLeftY[0]);
      for (let i = 1; i < numPts; i++) ctx.lineTo(_trailLeftX[i], _trailLeftY[i]);
      for (let i = numPts - 1; i >= 0; i--) ctx.lineTo(_trailRightX[i], _trailRightY[i]);
      ctx.closePath();

      const tailGrad = ctx.createLinearGradient(
        b.x, b.y,
        _trailAllX[numPts - 1], _trailAllY[numPts - 1]
      );
      tailGrad.addColorStop(0, b.isEvolved ? 'rgba(231, 76, 60, 0.85)' : 'rgba(230, 126, 34, 0.85)');
      tailGrad.addColorStop(0.45, b.isEvolved ? 'rgba(214, 48, 49, 0.55)' : 'rgba(230, 80, 20, 0.55)');
      tailGrad.addColorStop(1, 'rgba(180, 30, 10, 0)');
      ctx.fillStyle = tailGrad;
      ctx.fill();

      // B. Núcleo Interno de Fogo Dourado
      ctx.beginPath();
      ctx.moveTo(
        b.x + (_trailLeftX[0] - b.x) * 0.65,
        b.y + (_trailLeftY[0] - b.y) * 0.65
      );
      for (let i = 1; i < numPts; i++) {
        ctx.lineTo(_trailAllX[i] + (_trailLeftX[i] - _trailAllX[i]) * 0.65, _trailAllY[i] + (_trailLeftY[i] - _trailAllY[i]) * 0.65);
      }
      for (let i = numPts - 1; i >= 0; i--) {
        ctx.lineTo(_trailAllX[i] + (_trailRightX[i] - _trailAllX[i]) * 0.65, _trailAllY[i] + (_trailRightY[i] - _trailAllY[i]) * 0.65);
      }
      ctx.closePath();

      const coreGrad = ctx.createLinearGradient(
        b.x, b.y,
        _trailAllX[numPts - 1], _trailAllY[numPts - 1]
      );
      coreGrad.addColorStop(0, 'rgba(255, 240, 150, 0.95)');
      coreGrad.addColorStop(0.35, 'rgba(241, 196, 15, 0.8)');
      coreGrad.addColorStop(0.8, 'rgba(230, 126, 34, 0.35)');
      coreGrad.addColorStop(1, 'rgba(231, 76, 60, 0)');
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // C. Espinha Dorsal de Plasma Branco de Alta Fusão
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = Math.max(1.2, rad * 0.35);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      const spineCut = Math.min(numPts, 6);
      for (let i = 1; i < spineCut; i++) {
        ctx.lineTo(_trailAllX[i], _trailAllY[i]);
      }
      ctx.stroke();

      // D. Brasas e Faíscas que se desprendem na esteira térmica
      for (let t = 1; t < numPts; t++) {
        const ptx = _trailAllX[t];
        const pty = _trailAllY[t];
        const progress = t / numPts;
        const sparkAngle = frameCount * 0.35 + t * 2.3;
        const sparkDist = (rad * 0.85) * Math.sin(sparkAngle);
        const sx = ptx + Math.cos(sparkAngle) * sparkDist;
        const sy = pty + Math.sin(sparkAngle) * sparkDist;
        const sSize = Math.max(0.8, rad * 0.28 * (1 - progress));
        ctx.fillStyle = (t % 2 === 0) 
          ? `rgba(255, 255, 255, ${0.85 * (1 - progress)})` 
          : `rgba(241, 196, 15, ${0.85 * (1 - progress)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, sSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.angle || 0);

  // 2. Halo Térmico Radial (Ambient Solar Corona)
  const coronaR = rad * 1.85;
  const orbHalo = ctx.createRadialGradient(0, 0, rad * 0.35, 0, 0, coronaR);
  orbHalo.addColorStop(0, b.isEvolved ? 'rgba(231, 76, 60, 0.60)' : 'rgba(243, 156, 18, 0.60)');
  orbHalo.addColorStop(0.55, b.isEvolved ? 'rgba(192, 57, 43, 0.30)' : 'rgba(230, 126, 34, 0.30)');
  orbHalo.addColorStop(1, 'rgba(230, 80, 20, 0)');
  ctx.fillStyle = orbHalo;
  ctx.beginPath();
  ctx.arc(0, 0, coronaR, 0, Math.PI * 2);
  ctx.fill();

  // 3. Manto de Labaredas em Gota Esculpidas no Contorno
  ctx.fillStyle = b.isEvolved ? '#e74c3c' : '#e67e22';
  ctx.beginPath();
  ctx.moveTo(rad * 1.5, 0);
  ctx.quadraticCurveTo(rad * 0.2, -rad * 1.3, -rad * 1.4, -rad * 0.45);
  ctx.lineTo(-rad * 1.85, 0);
  ctx.lineTo(-rad * 1.4, rad * 0.45);
  ctx.quadraticCurveTo(rad * 0.2, rad * 1.3, rad * 1.5, 0);
  ctx.closePath();
  ctx.fill();

  // 4. Manto Incandescente Amarelo-Ouro
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.ellipse(0, 0, rad * 0.95, rad * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();

  // 5. Núcleo Concentrado de Fusão Branca Solar
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(rad * 0.18, 0, rad * 0.52, rad * 0.40, 0, 0, Math.PI * 2);
  ctx.fill();

  // 6. Anéis Orbitais de Fogo e Plasma
  if (b.isEvolved) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, rad * 1.6, rad * 0.55, spin, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, rad * 1.6, rad * 0.55, -spin, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeStyle = 'rgba(255, 235, 120, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, rad * 1.35, rad * 0.48, spin, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();

}

// The two small sprites are independent of framebuffer DPR. Each contains its
// orb and halo; all projectiles share them instead of rebuilding gradients.
const simpleOrbSprites = [null, null];
const SIMPLE_ORB_SIZE = 128;

function getSimpleOrbSprite(isEvolved) {
  const index = isEvolved ? 1 : 0;
  if (simpleOrbSprites[index]) return simpleOrbSprites[index];
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIMPLE_ORB_SIZE;
  const spriteCtx = canvas.getContext('2d');
  if (!spriteCtx) return null;
  spriteCtx.translate(SIMPLE_ORB_SIZE / 2, SIMPLE_ORB_SIZE / 2);
  const radius = SIMPLE_ORB_SIZE / 4;
  const halo = spriteCtx.createRadialGradient(0, 0, radius * 0.35, 0, 0, radius * 1.85);
  halo.addColorStop(0, isEvolved ? 'rgba(231,76,60,0.6)' : 'rgba(243,156,18,0.6)');
  halo.addColorStop(1, 'rgba(230,80,20,0)');
  spriteCtx.fillStyle = halo;
  spriteCtx.beginPath();
  spriteCtx.arc(0, 0, radius * 1.85, 0, Math.PI * 2);
  spriteCtx.fill();
  spriteCtx.fillStyle = isEvolved ? '#e74c3c' : '#e67e22';
  spriteCtx.beginPath();
  spriteCtx.ellipse(0, 0, radius * 1.15, radius * 0.8, 0, 0, Math.PI * 2);
  spriteCtx.fill();
  spriteCtx.fillStyle = '#f1c40f';
  spriteCtx.beginPath();
  spriteCtx.ellipse(0, 0, radius * 0.8, radius * 0.5, 0, 0, Math.PI * 2);
  spriteCtx.fill();
  spriteCtx.fillStyle = '#ffffff';
  spriteCtx.beginPath();
  spriteCtx.ellipse(radius * 0.18, 0, radius * 0.4, radius * 0.28, 0, 0, Math.PI * 2);
  spriteCtx.fill();
  if (isEvolved) {
    spriteCtx.strokeStyle = '#f1c40f';
    spriteCtx.lineWidth = 3;
    spriteCtx.beginPath();
    spriteCtx.ellipse(0, 0, radius * 1.55, radius * 0.48, 0.35, 0, Math.PI * 2);
    spriteCtx.stroke();
  }
  simpleOrbSprites[index] = canvas;
  return canvas;
}

function drawSimpleStaffBullet(ctx, b, maxPoints) {
  const radius = b.radius || 9;
  ctx.save();
  const historyCount = Math.min(Math.max(0, maxPoints - 1), b.trail ? b.trail.length : 0);
  if (historyCount > 0) {
    ctx.strokeStyle = b.isEvolved ? 'rgba(231,76,60,0.7)' : 'rgba(230,126,34,0.7)';
    ctx.lineWidth = Math.max(1.2, radius * 0.8);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    for (let i = 0; i < historyCount; i++) ctx.lineTo(b.trail[i].x, b.trail[i].y);
    ctx.stroke();
  }
  ctx.translate(b.x, b.y);
  ctx.rotate(b.angle || 0);
  const sprite = getSimpleOrbSprite(!!b.isEvolved);
  if (sprite) {
    ctx.drawImage(sprite, -radius * 2, -radius * 2, radius * 4, radius * 4);
  } else {
    ctx.fillStyle = b.isEvolved ? '#e74c3c' : '#e67e22';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(radius * 0.18, 0, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

