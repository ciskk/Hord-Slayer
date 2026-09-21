/**
 * src/render/entities/pickupsRenderer.js
 * 
 * Renderizador especializado de itens coletáveis no solo:
 * Gotas de cura/ímãs/relógios, Baús de tesouro (com God Rays e projeção 2.5D),
 * Orbes de XP lapidadas (Gems) com cintilação procedural,
 * e indicadores/radar periférico de baús fora da tela.
 */
import { getActiveBloodAltar } from '../../systems/worldEvents.js';
import { player } from '../../entities/player.js';
import { chests } from '../../state/collections.js';
import { frameCount } from '../../state/gameState.js';

const _chestWoodGradCache = {};
const _chestLidGradCache = {};

export function renderDrops(ctx, drops, bounds) {
  const { viewLeft, viewRight, viewTop, viewBottom } = bounds;
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i];
    if (d.x < viewLeft || d.x > viewRight || d.y < viewTop || d.y > viewBottom) continue;
    ctx.save();
    ctx.translate(d.x, d.y);
    if (d.life < 300 && Math.floor(d.life / 10) % 2 === 0) {
      ctx.restore();
      continue;
    }
    if (d.type === 'HEART') {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(-3, -2, 4, 0, Math.PI * 2);
      ctx.arc(3, -2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-7, -1);
      ctx.lineTo(7, -1);
      ctx.lineTo(0, 7);
      ctx.closePath();
      ctx.fill();
    } else if (d.type === 'MAGNET') {
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 6, Math.PI, 0);
      ctx.stroke();
    } else if (d.type === 'CLOCK') {
      ctx.fillStyle = '#00d2d3';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function renderChests(ctx, chests, bounds, frameCount) {
  const { viewLeft, viewRight, viewTop, viewBottom } = bounds;
  for (let i = 0; i < chests.length; i++) {
    const ch = chests[i];
    if (ch.x < viewLeft || ch.x > viewRight || ch.y < viewTop || ch.y > viewBottom) continue;

    const z = Math.min(0, ch.z || 0);
    const isMini = ch.tier === 'MINI_BOSS';
    const isAltarChest = ch.tier === 'LEGENDARY_ALTAR';
    const bw = isMini ? 22 : 26;
    const bh = isMini ? 16 : 19;
    const hw = bw / 2;
    const hh = bh / 2;

    // 1. Sombra elíptica no solo
    const shadowScale = Math.max(0.3, 1 - Math.abs(z) / 90);
    const shadowAlpha = Math.max(0.12, 0.45 * shadowScale);
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(ch.x, ch.y + 4, (ch.radius + 3) * shadowScale, ((ch.radius + 3) * 0.42) * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Feixes de Luz Místicos (God Rays) e Pulso Radiante quando em repouso
    if (ch.isResting) {
      const rayColor = isAltarChest ? 'rgba(255, 56, 56, 0.12)' : (isMini ? 'rgba(52, 152, 219, 0.07)' : 'rgba(241, 196, 15, 0.08)');
      const glowColor = isAltarChest ? 'rgba(255, 56, 56, 0.35)' : (isMini ? 'rgba(52, 152, 219, 0.22)' : 'rgba(241, 196, 15, 0.25)');
      const angleRot = frameCount * 0.012 + (ch.pulseOffset || 0);

      ctx.save();
      ctx.translate(ch.x, ch.y + 2);
      ctx.rotate(angleRot);
      ctx.fillStyle = rayColor;
      for (let r = 0; r < 6; r++) {
        const rayA = (r * Math.PI * 2) / 6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, ch.radius + 18, rayA - 0.22, rayA + 0.22);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      const pulse = Math.sin(frameCount * 0.08 + (ch.pulseOffset || 0)) * 2.2;
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(ch.x, ch.y + 2, ch.radius + 3 + pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Arte Procedural do Baú em Perspectiva 2.5D
    ctx.save();
    ctx.translate(ch.x, ch.y + z);

    // Caixa de madeira reforçada (reutiliza gradiente estático por tier)
    const tierKey = isAltarChest ? 'ALTAR' : (isMini ? 'MINI' : 'NORMAL');
    let woodGrad = _chestWoodGradCache[tierKey];
    if (!woodGrad) {
      woodGrad = ctx.createLinearGradient(-hw, -hh, -hw, hh);
      woodGrad.addColorStop(0, isAltarChest ? '#3d0c11' : '#542d18');
      woodGrad.addColorStop(0.5, isAltarChest ? '#25070a' : '#3a1e0f');
      woodGrad.addColorStop(1, isAltarChest ? '#120305' : '#241208');
      _chestWoodGradCache[tierKey] = woodGrad;
    }
    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh + 3, bw, bh - 3, 3);
    ctx.fill();
    ctx.strokeStyle = isAltarChest ? '#740b17' : '#1a0b04';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tampa arredondada superior (Lid, reutiliza gradiente estático)
    let lidGrad = _chestLidGradCache[tierKey];
    if (!lidGrad) {
      lidGrad = ctx.createLinearGradient(-hw, -hh - 4, -hw, -hh + 5);
      lidGrad.addColorStop(0, isAltarChest ? '#5c1017' : (isMini ? '#47535e' : '#733c1d'));
      lidGrad.addColorStop(0.5, isAltarChest ? '#3b0a0e' : (isMini ? '#2f3640' : '#542d18'));
      lidGrad.addColorStop(1, isAltarChest ? '#1c0507' : (isMini ? '#1e272e' : '#33190c'));
      _chestLidGradCache[tierKey] = lidGrad;
    }
    ctx.fillStyle = lidGrad;
    ctx.beginPath();
    ctx.roundRect(-hw - 1, -hh - 3, bw + 2, 7, [4, 4, 1, 1]);
    ctx.fill();
    ctx.strokeStyle = isAltarChest ? '#c0392b' : (isMini ? '#718093' : '#8d4b24');
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tiras verticais de aço reforçado
    const strapColor = isAltarChest ? '#c0392b' : (isMini ? '#718093' : '#d35400');
    const rivetColor = isAltarChest ? '#ff7675' : (isMini ? '#dcdde1' : '#f1c40f');
    const strapOffset = hw * 0.52;
    [-strapOffset, strapOffset].forEach(sx => {
      ctx.fillStyle = strapColor;
      ctx.fillRect(sx - 1.5, -hh - 3, 3, bh + 3);
      ctx.fillStyle = rivetColor;
      ctx.beginPath(); ctx.arc(sx, -hh - 1, 1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx, hh - 2, 1, 0, Math.PI * 2); ctx.fill();
    });

    // Friso horizontal da tampa
    ctx.fillStyle = isAltarChest ? '#ff4757' : (isMini ? '#bdc3c7' : '#f1c40f');
    ctx.fillRect(-hw - 1, -hh + 3, bw + 2, 2);

    // Fechadura em formato de brasão com gema
    ctx.fillStyle = isAltarChest ? '#962d22' : (isMini ? '#95a5a6' : '#f39c12');
    ctx.beginPath();
    ctx.roundRect(-3.5, -hh + 2, 7, 7, 2);
    ctx.fill();
    ctx.strokeStyle = isAltarChest ? '#ff7675' : (isMini ? '#dcdde1' : '#f1c40f');
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Gema mística no miolo da fechadura
    ctx.fillStyle = isAltarChest ? '#ff3838' : (isMini ? '#00cec9' : '#e74c3c');
    ctx.beginPath();
    ctx.arc(0, -hh + 5.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Ponto de luz na gema
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-0.6, -hh + 4.9, 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export function renderGems(ctx, gems, bounds, frameCount, player) {
  const { viewLeft, viewRight, viewTop, viewBottom } = bounds;
  for (let i = 0; i < gems.length; i++) {
    const g = gems[i];
    if (g.x < viewLeft || g.x > viewRight || g.y < viewTop || g.y > viewBottom) continue;

    const baseColor = g.color || (g.isSuper ? '#e056fd' : '#00d2d3');
    const baseR = g.radius || 4.5;
    const pulseOffset = g.pulseOffset || 0;
    const pulse = Math.sin(frameCount * 0.16 + pulseOffset) * (g.isSuper ? 2.2 : 1.2);
    const rad = Math.max(3, baseR + pulse);

    const gx = g.x;
    const gy = g.y;

    // 1. Halo Luminoso / Aura Radiante Pulsante
    let haloColor = 'rgba(0, 210, 211, 0.38)';
    if (g.isSuper) haloColor = 'rgba(224, 86, 253, 0.45)';
    else if (baseColor === '#f1c40f') haloColor = 'rgba(241, 196, 15, 0.40)';
    else if (baseColor === '#2ecc71') haloColor = 'rgba(46, 204, 113, 0.40)';

    ctx.fillStyle = haloColor;
    ctx.beginPath();
    ctx.arc(gx, gy, rad * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // 2. Geometria de Cristal Facetado em Losango / Gema Lapidada
    const rx = rad * 0.95;
    const ry = rad * 1.35;

    // Faceta Esquerda (Tom Base)
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(gx, gy - ry);
    ctx.lineTo(gx - rx, gy);
    ctx.lineTo(gx, gy + ry);
    ctx.closePath();
    ctx.fill();

    // Faceta Direita (Reflexo Lapidado Mais Claro)
    ctx.fillStyle = g.isSuper ? '#f3a4fc' : (baseColor === '#f1c40f' ? '#f9ca24' : (baseColor === '#2ecc71' ? '#55efc4' : '#81ecec'));
    ctx.beginPath();
    ctx.moveTo(gx, gy - ry);
    ctx.lineTo(gx + rx, gy);
    ctx.lineTo(gx, gy + ry);
    ctx.closePath();
    ctx.fill();

    // Borda Lapidada de Alto Contraste
    ctx.strokeStyle = g.isSuper ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(gx, gy - ry);
    ctx.lineTo(gx + rx, gy);
    ctx.lineTo(gx, gy + ry);
    ctx.lineTo(gx - rx, gy);
    ctx.closePath();
    ctx.stroke();

    // Núcleo Incandescente Central
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(gx, gy, rx * 0.32, ry * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Ponto Especular e Cintilação Estelar (Sparkle Glint)
    // LOD: quando há muitas gemas na tela (> 35), limita o glint cruzado a super gemas ou 1 a cada 3 gemas
    const allowGlint = gems.length <= 35 || g.isSuper || (i % 3 === 0);
    const glintPhase = allowGlint ? Math.sin(frameCount * 0.22 + pulseOffset) : -1;
    if (glintPhase > 0.3) {
      const glintSize = (g.isSuper ? 4.5 : 3.0) * glintPhase;
      ctx.fillStyle = '#ffffff';
      const glintCenterX = gx - rx * 0.22;
      const glintCenterY = gy - ry * 0.35;

      // Brilho em cruz de 4 pontas
      ctx.beginPath();
      ctx.moveTo(glintCenterX, glintCenterY - glintSize);
      ctx.lineTo(glintCenterX + glintSize * 0.28, glintCenterY);
      ctx.lineTo(glintCenterX, glintCenterY + glintSize);
      ctx.lineTo(glintCenterX - glintSize * 0.28, glintCenterY);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(glintCenterX - glintSize, glintCenterY);
      ctx.lineTo(glintCenterX, glintCenterY - glintSize * 0.28);
      ctx.lineTo(glintCenterX + glintSize, glintCenterY);
      ctx.lineTo(glintCenterX, glintCenterY + glintSize * 0.28);
      ctx.closePath();
      ctx.fill();
    }

    // 4. Detalhe Astral de Super Gemas: Fagulho Orbital Mágico
    if (g.isSuper) {
      const sparkAng = frameCount * 0.14 + pulseOffset;
      const sparkDist = rad * 1.8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(gx + Math.cos(sparkAng) * sparkDist, gy + Math.sin(sparkAng) * sparkDist, 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(gx, gy, sparkDist, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

export function drawPlayerChestArrows(ctx, chestsParam, playerParam, frameCountParam) {
  const p = playerParam || player;
  if (!p) return;
  const chList = chestsParam || chests;
  const fc = (typeof frameCountParam === 'number') ? frameCountParam : frameCount;

  const numChests = (chList && chList.length) || 0;
  const altar = getActiveBloodAltar();
  const hasAltar = altar && (altar.state === 'SPAWNED' || altar.state === 'ACTIVE');
  const totalTargets = numChests + (hasAltar ? 1 : 0);
  if (totalTargets === 0) return;

  for (let i = 0; i < totalTargets; i++) {
    const ch = i < numChests ? chList[i] : altar;
    const chTier = i < numChests ? ch.tier : 'ALTAR';
    const dx = ch.x - p.x;
    const dy = ch.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 0) continue;

    // Fade-out suave quando o jogador se aproxima do alvo (< 70px)
    const proximityAlpha = Math.max(0, Math.min(1, (dist - 40) / 30));
    if (proximityAlpha <= 0) continue;

    const angle = Math.atan2(dy, dx);
    const isAltar = chTier === 'ALTAR' || chTier === 'LEGENDARY_ALTAR';
    const isMini = chTier === 'MINI_BOSS';

    const primaryColor = isAltar ? '#ff3838' : (isMini ? '#00cec9' : '#f1c40f');
    const glowColor = isAltar ? 'rgba(255, 56, 56, 0.95)' : (isMini ? 'rgba(0, 206, 201, 0.85)' : 'rgba(241, 196, 15, 0.9)');
    const trailAlpha = (0.55 + Math.sin(frameCount * 0.12) * 0.25) * proximityAlpha;

    // 1. Feixe de Luz Místico saindo do jogador em direção ao alvo
    ctx.save();
    const startR = 18;
    const orbitR = 44 + Math.sin(frameCount * 0.15) * 3.5;
    const x1 = p.x + Math.cos(angle) * startR;
    const y1 = p.y + Math.sin(angle) * startR;
    const x2 = p.x + Math.cos(angle) * (orbitR - 6);
    const y2 = p.y + Math.sin(angle) * (orbitR - 6);

    const beamGrad = ctx.createLinearGradient(x1, y1, x2, y2);
    beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
    beamGrad.addColorStop(0.4, isAltar ? 'rgba(192, 57, 43, 0.5)' : (isMini ? 'rgba(9, 132, 227, 0.45)' : 'rgba(230, 126, 34, 0.45)'));
    beamGrad.addColorStop(0.85, primaryColor);
    beamGrad.addColorStop(1, '#ffffff');

    ctx.strokeStyle = beamGrad;
    ctx.lineWidth = isMini ? 2.2 : 2.8;
    ctx.lineCap = 'round';
    ctx.globalAlpha = trailAlpha;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();

    // 2. Seta Rúnica em Formato de Lança / Chevron na Órbita
    ctx.save();
    const arrowX = p.x + Math.cos(angle) * orbitR;
    const arrowY = p.y + Math.sin(angle) * orbitR;
    ctx.translate(arrowX, arrowY);
    ctx.rotate(angle);
    ctx.globalAlpha = (0.9 + Math.sin(frameCount * 0.18) * 0.1) * proximityAlpha;

    // Halo brilhante externo (Zero-cost glow)
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(11, 0);       // Ponta frontal
    ctx.lineTo(-7, -7);      // Aresta superior
    ctx.lineTo(-3, 0);       // Chanfro traseiro
    ctx.lineTo(-7, 7);       // Aresta inferior
    ctx.closePath();
    ctx.stroke();

    // Corpo pontiagudo da seta
    ctx.fillStyle = primaryColor;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Runa central de navegação
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-1, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Radar Periférico na Borda da Tela para Baús e Altar de Sangue Fora de Campo (Offscreen).
 * Exibe seta direcional na borda, badge estilizado e distância em metros até o objetivo.
 */

export function drawOffscreenChestRadar(ctx, chests, player, camera, CAMERA_ZOOM, viewW, viewH, frameCount) {
  if (!player) return;

  const targets = [];
  if (chests && chests.length > 0) {
    for (let i = 0; i < chests.length; i++) {
      targets.push({ x: chests[i].x, y: chests[i].y, tier: chests[i].tier });
    }
  }

  const altar = getActiveBloodAltar();
  if (altar && (altar.state === 'SPAWNED' || altar.state === 'ACTIVE')) {
    targets.push({ x: altar.x, y: altar.y, tier: 'ALTAR' });
  }

  if (targets.length === 0) return;

  for (let i = 0; i < targets.length; i++) {
    const ch = targets[i];
    const sx = (ch.x - camera.x) * CAMERA_ZOOM;
    const sy = (ch.y - camera.y) * CAMERA_ZOOM;
    const pad = 46;
    const isOffscreen = sx < pad || sx > viewW - pad || sy < pad || sy > viewH - pad;

    if (!isOffscreen) continue;

    const centerX = viewW / 2;
    const centerY = viewH / 2;
    const angle = Math.atan2(sy - centerY, sx - centerX);
    const clampX = Math.max(pad, Math.min(viewW - pad, sx));
    const clampY = Math.max(pad, Math.min(viewH - pad, sy));
    const isAltar = ch.tier === 'ALTAR' || ch.tier === 'LEGENDARY_ALTAR';
    const isMini = ch.tier === 'MINI_BOSS';

    const primaryColor = isAltar ? '#ff3838' : (isMini ? '#00cec9' : '#f1c40f');
    const glowColor = isAltar ? 'rgba(255, 56, 56, 0.95)' : (isMini ? 'rgba(0, 206, 201, 0.85)' : 'rgba(241, 196, 15, 0.9)');
    const pulse = Math.sin(frameCount * 0.16) * 3;

    const dx = ch.x - player.x;
    const dy = ch.y - player.y;
    const distMeters = Math.max(1, Math.round(Math.hypot(dx, dy) / 22));

    ctx.save();
    ctx.translate(clampX, clampY);

    // Seta periférica apontando para fora
    ctx.save();
    ctx.rotate(angle);

    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.moveTo(11 + pulse, 0);
    ctx.lineTo(-7, -8);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-7, 8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-1, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Badge com ícone e medidor de distância em metros
    const badgeDist = 26;
    const badgeX = -Math.cos(angle) * badgeDist;
    const badgeY = -Math.sin(angle) * badgeDist;

    ctx.save();
    ctx.translate(badgeX, badgeY);

    if (isAltar) {
      ctx.fillStyle = 'rgba(26, 6, 12, 0.94)';
      ctx.strokeStyle = '#ff3838';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-29, -10, 58, 20, 5);
      ctx.fill();
      ctx.stroke();

      // Ícone vetorial de gota de sangue (sem emojis)
      ctx.fillStyle = '#ff3838';
      ctx.beginPath();
      ctx.moveTo(-19, -4);
      ctx.bezierCurveTo(-22, 0, -22, 4, -19, 4);
      ctx.bezierCurveTo(-16, 4, -16, 0, -19, -4);
      ctx.fill();

      // Texto de identificação e distância
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${distMeters}m`, -11, 0.5);
    } else {
      ctx.fillStyle = 'rgba(10, 10, 16, 0.88)';
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(-22, -10, 44, 20, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = primaryColor;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${distMeters}m`, 0, 0.5);
    }

    ctx.restore();
    ctx.restore();
  }
}
