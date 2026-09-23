import { drawBossPhaseCinematic } from '../systems/bossPhaseCinematic.js';
/**
 * src/render/renderer.js
 * 
 * Orquestrador principal do pipeline gráfico de renderização.
 * Gerencia a câmera, screen shake, proporção DPR, composição de camadas
 * e despacho para os renderizadores modulares especializados.
 */
import { stick } from '../core/input.js';
import { renderEnvironment, ARENA_PALETTES } from './environment.js';
import { drawEnemyShape, drawDyingEnemyShape } from './enemiesRenderer.js';
import { drawPlayerCharacter, drawPlayerEquipment } from './playerRenderer.js';
import { generateGroundCracks, drawDetailedGroundCracks, drawGroundCraters } from './groundCracks.js';
import { drawBossVictoryOverlay } from '../entities/bosses/abyssSovereign/render.js';
import { getHudBottom, layoutMetrics } from '../core/responsive.js';
import { player, selectedHeroKey } from '../entities/player.js';
import { CHARACTERS } from '../config/characters.js';
import {
  gameState,
  ctx,
  bannerCanvas,
  bannerCtx,
  dpr,
  viewW,
  viewH,
  CAMERA_ZOOM,
  cameraViewW,
  cameraViewH,
  camera,
  screenShake,
  props,
  drops,
  chests,
  gems,
  acidPuddles,
  bossTelegraphs,
  bossProjectiles,
  bossShockwaves,
  activeBoss,
  bullets,
  enemyBullets,
  enemies,
  dyingEnemies,
  particles,
  damageTexts,
  frameCount,
  waveAnnouncement,
  cinematicCamera,
  matchIntro,
  currentArenaTheme
} from '../main.js';
import { deathSequence } from '../state/gameState.js';
import { renderDeathSequenceWorld, renderDeathSequenceOverlay } from './deathAnimation.js';
import { getActiveBloodAltar } from '../systems/worldEvents.js';
import { drawBloodAltarWorld } from './worldEvents/bloodAltarRenderer.js';
import { renderProps } from './entities/propsRenderer.js';
import { 
  renderDrops, 
  renderChests, 
  renderGems, 
  drawPlayerChestArrows, 
  drawOffscreenChestRadar 
} from './entities/pickupsRenderer.js';
import { 
  renderAcidPuddles, 
  renderBossTelegraphs, 
  renderBossShockwaves, 
  renderBossProjectiles 
} from './entities/hazardsRenderer.js';
import { 
  renderEnemiesShadows,
  renderDyingEnemies, 
  renderEnemies, 
  renderMinibossOffscreenRadar 
} from './entities/mobsRenderer.js';


// Reexportações para assegurar total retrocompatibilidade
export { drawEnemyShape } from './enemiesRenderer.js';
export { drawPlayerCharacter } from './playerRenderer.js';
export { drawBloodAltarWorld } from './worldEvents/bloodAltarRenderer.js';

// Cache do layout de texto do banner de onda (Zero Layout Thrashing e Zero measureText contínuo)
let cachedWaveAnnouncementIndex = -1;
let cachedWaveTitleText = '';
let cachedWaveFontSize = 18;

// Buffers estáticos para renderização de rastros balísticos (Zero Alocação no Hot Path)
const MAX_TRAIL_PTS = 32;
const _trailAllX = new Float32Array(MAX_TRAIL_PTS);
const _trailAllY = new Float32Array(MAX_TRAIL_PTS);
const _trailLeftX = new Float32Array(MAX_TRAIL_PTS);
const _trailLeftY = new Float32Array(MAX_TRAIL_PTS);
const _trailRightX = new Float32Array(MAX_TRAIL_PTS);
const _trailRightY = new Float32Array(MAX_TRAIL_PTS);



/**
 * Renderiza a sobreposição cinematográfica de início de partida:
 * 1. Vinheta teatral radial com foco no herói que se dissipa na arena.
 * 2. Cartão de apresentação gótico (Tema da Arena, Nome do Herói, Alcunha e indicação de controle).
 */
export function drawMatchIntroOverlay(ctx, viewW, viewH, matchIntro, frameCount) {
  if (!matchIntro || !matchIntro.active) return;

  const progress = matchIntro.zoomProgress || 0;
  const timer = matchIntro.timer || 0;

  // 1. Vinheta Teatral Cinematográfica: foco de luz no herói que se expande e desvanece
  const vignetteAlpha = Math.max(0, (1 - progress) * 0.72);
  if (vignetteAlpha > 0.01) {
    ctx.save();
    const cx = viewW / 2;
    const cy = viewH / 2;
    const maxDim = Math.max(viewW, viewH);
    const innerR = Math.max(60, maxDim * 0.12);
    const outerR = maxDim * 0.68;
    const vigGrad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
    vigGrad.addColorStop(0, 'rgba(4, 6, 10, 0)');
    vigGrad.addColorStop(0.5, `rgba(6, 8, 14, ${vignetteAlpha * 0.42})`);
    vigGrad.addColorStop(1, `rgba(2, 3, 6, ${vignetteAlpha})`);
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.restore();
  }

  // 2. Cartão de Apresentação Gótico (Arena + Herói)
  let textAlpha = 0;
  if (timer < 22) {
    textAlpha = timer / 22;
  } else if (progress < 0.65) {
    textAlpha = 1.0;
  } else if (progress < 0.95) {
    textAlpha = Math.max(0, (0.95 - progress) / 0.30);
  }

  if (textAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = textAlpha;

    const heroDef = CHARACTERS[selectedHeroKey] || CHARACTERS.KNIGHT;
    const arenaPal = ARENA_PALETTES[currentArenaTheme] || ARENA_PALETTES.IVORY_OSSUARY;

    const isCompactH = viewH < 520;
    // Posição no terço inferior da tela, perfeitamente emoldurado no letterbox
    const driftY = progress * 12;
    const baseY = Math.floor(viewH * (isCompactH ? 0.76 : 0.73)) + driftY;
    const centerX = viewW / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // A. Linha superior dourada: Tema da Arena com ornamentos
    const arenaLabel = `— ${arenaPal.name.toUpperCase()} —`;
    ctx.font = `bold ${isCompactH ? 10.5 : 12}px "Cinzel", Georgia, serif`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillText(arenaLabel, centerX + 1, baseY - (isCompactH ? 24 : 30) + 1);
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(arenaLabel, centerX, baseY - (isCompactH ? 24 : 30));

    // B. Nome do Herói em destaque imperial
    const heroName = heroDef.name.toUpperCase();
    const heroFontSize = isCompactH ? 20 : 26;
    ctx.font = `900 ${heroFontSize}px "Cinzel Decorative", "Cinzel", Georgia, serif`;
    // Sombra de contraste
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillText(heroName, centerX + 1.5, baseY + 1.5);
    // Halo dourado sutil
    ctx.fillStyle = 'rgba(241, 196, 15, 0.35)';
    ctx.fillText(heroName, centerX, baseY + 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(heroName, centerX, baseY);

    // C. Alcunha / Subtítulo do Herói
    const heroSubtitle = heroDef.title || heroDef.role || 'SOBREVIVENTE';
    ctx.font = `italic ${isCompactH ? 10.5 : 12}px sans-serif`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillText(heroSubtitle, centerX + 1, baseY + (isCompactH ? 21 : 26) + 1);
    ctx.fillStyle = '#dfe4ea';
    ctx.fillText(heroSubtitle, centerX, baseY + (isCompactH ? 21 : 26));

    // D. Indicador não-intrusivo de movimentação livre
    if (timer > 25 && progress < 0.60) {
      const hintPulse = 0.35 + Math.sin(frameCount * 0.08) * 0.25;
      ctx.font = '10px sans-serif';
      ctx.fillStyle = `rgba(223, 228, 234, ${hintPulse * textAlpha})`;
      ctx.fillText('[ Mova ou toque para iniciar ]', centerX, baseY + (isCompactH ? 40 : 48));
    }

    ctx.restore();
  }
}

let _isBannerCanvasDirty = false;

/**
 * Pipeline principal de renderização do quadro (Frame Render Loop).
 */
export function render() {
  const hasActiveBossTitle = (activeBoss && activeBoss.titleTimer > 0) || (enemies && enemies.some(e => e.isBoss && e.titleTimer > 0));
  const hasWaveAnnouncement = waveAnnouncement && waveAnnouncement.timer > 0;
  const isBannerActive = hasActiveBossTitle || hasWaveAnnouncement;

  if (bannerCtx && bannerCanvas) {
    if (isBannerActive || _isBannerCanvasDirty) {
      bannerCtx.clearRect(0, 0, bannerCanvas.width, bannerCanvas.height);
      _isBannerCanvasDirty = isBannerActive;
    }
  }

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, viewW, viewH);

  const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;
  const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;

  ctx.save();
  // Aplica a aproximação de câmera (~20% menor FOV)
  ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);

  // Quantização inteira da posição da câmera: elimina o anti-aliasing cinzento de subpixel no mobile,
  // mantendo coordenadas contínuas de ponto flutuante durante a transição cinematográfica de zoom
  const isIntroActive = matchIntro && matchIntro.active;
  const isDeathActive = deathSequence && deathSequence.active;
  const isContinuousCam = isIntroActive || isDeathActive || !!(activeBoss && activeBoss.phaseCinematic);
  const renderCamX = isContinuousCam ? (-camera.x + shakeX) : Math.round(-camera.x + shakeX);
  const renderCamY = isContinuousCam ? (-camera.y + shakeY) : Math.round(-camera.y + shakeY);
  ctx.translate(renderCamX, renderCamY);

  renderEnvironment(ctx);



  const pad = 60;
  const viewLeft = camera.x - pad;
  const viewRight = camera.x + cameraViewW + pad;
  const viewTop = camera.y - pad;
  const viewBottom = camera.y + cameraViewH + pad;

  // 0. Renderização Diegética do Altar de Sangue no Solo da Arena
  drawBloodAltarWorld(ctx, getActiveBloodAltar());


  const bounds = { viewLeft, viewRight, viewTop, viewBottom };
  renderProps(ctx, props, bounds);
  renderDrops(ctx, drops, bounds);
  renderChests(ctx, chests, bounds, frameCount);

  // 0. Fendas Tectônicas e Crateras Persistentes de Sir Roland (duram 5.5s com fade out gradual no solo)
  drawGroundCraters(ctx, viewLeft, viewRight, viewTop, viewBottom);

  // 1. Renderização das poças ativas no solo (Ácido / Alquimia / Fogo) - no chão, abaixo das orbes de XP

  renderAcidPuddles(ctx, acidPuddles, bounds, frameCount);
  renderGems(ctx, gems, bounds, frameCount, player);

  // Renderiza auras, bíblias protetoras e machados giratórios do jogador
  drawPlayerEquipment();

  const isDeathSeqActive = !!(deathSequence && deathSequence.active);
  const projAlpha = isDeathSeqActive
    ? (deathSequence.projectileFadeAlpha !== undefined ? deathSequence.projectileFadeAlpha : 1.0)
    : (gameState && gameState.isDead ? 0 : 1.0);

  if (projAlpha > 0.001) {
    if (projAlpha < 1.0) {
      ctx.save();
      ctx.globalAlpha = projAlpha;
    }

    renderBossTelegraphs(ctx, bossTelegraphs, frameCount);
    renderBossShockwaves(ctx, bossShockwaves, activeBoss, frameCount);
    renderBossProjectiles(ctx, bossProjectiles, frameCount);

    for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];

    if (b.type === 'HAMMER_SLAM') {
      const progress = 1 - (b.life / b.maxLife);
      const alpha = Math.max(0, b.life / b.maxLife);

      ctx.save();
      ctx.translate(b.x, b.y);

      if (progress < 0.32) {
        // FASE 1: WINDUP - Glifo de Carga e Solo Rúnico Sagrado Concentrando Luz
        const windT = progress / 0.32;
        const gatherR = 32 * (1 - windT * 0.4);
        ctx.strokeStyle = `rgba(241, 196, 15, ${windT * 0.65})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, gatherR, 0, Math.PI * 2);
        ctx.stroke();

        // Raios de luz convergindo ao ponto de esmagamento
        for (let r = 0; r < 4; r++) {
          const rAng = b.angle + (r * Math.PI * 0.5) + windT * 0.8;
          ctx.strokeStyle = `rgba(255, 235, 150, ${windT * 0.75})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(Math.cos(rAng) * (gatherR + 14), Math.sin(rAng) * (gatherR + 14));
          ctx.lineTo(Math.cos(rAng) * 5, Math.sin(rAng) * 5);
          ctx.stroke();
        }
      } else {
        // IMPACTO SÍSMICO IMEDIATO: Anel de choque estelar dourado e nítido
        // (Sem disco branco sólido opaco que cega a tela e polui a visão em alta cadência)
        const impactP = (progress - 0.32) / 0.68;
        const flashAlpha = Math.max(0, 1 - impactP * 3.2);
        if (flashAlpha > 0) {
          const shockRingR = b.radius * (0.25 + impactP * 0.75);

          // Anel principal de choque sagrado
          ctx.strokeStyle = b.isEvolved ? `rgba(243, 156, 18, ${flashAlpha * 0.85})` : `rgba(241, 196, 15, ${flashAlpha * 0.80})`;
          ctx.lineWidth = Math.max(1.5, 3.2 * (1 - impactP * 0.7));
          ctx.beginPath();
          ctx.arc(0, 0, shockRingR, 0, Math.PI * 2);
          ctx.stroke();

          // Filete fino interno celestial
          ctx.strokeStyle = `rgba(255, 255, 255, ${flashAlpha * 0.75})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, shockRingR * 0.88, 0, Math.PI * 2);
          ctx.stroke();

          // Ponto de luz concentrado rápido apenas no início exato do choque
          if (impactP < 0.20) {
            const burstAlpha = (1 - impactP / 0.20) * 0.45;
            ctx.fillStyle = `rgba(255, 255, 255, ${burstAlpha})`;
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.restore();
      continue;
    }

    if (b.x < viewLeft || b.x > viewRight || b.y < viewTop || b.y > viewBottom) continue;

    if (b.type === 'STAFF') {
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
      continue;
    }

    if (b.type === 'POTION') {
      // Rastro de vapor e gotículas cáusticas em arco
      if (b.trail && b.trail.length > 0) {
        for (let t = 0; t < b.trail.length; t++) {
          const pt = b.trail[t];
          const tAlpha = (1 - t / b.trail.length) * 0.40;
          ctx.fillStyle = b.isEvolved ? `rgba(162, 155, 254, ${tAlpha})` : `rgba(155, 89, 182, ${tAlpha})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, (b.radius * 0.65) * (1 - t / b.trail.length * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle || 0);

      const acidCol = b.isEvolved ? '#a29bfe' : '#9b59b6';
      const r = b.radius || 8;

      // Halo luminoso do reagente químico volátil violeta
      ctx.fillStyle = b.isEvolved ? 'rgba(162, 155, 254, 0.32)' : 'rgba(155, 89, 182, 0.32)';
      ctx.beginPath();
      ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
      ctx.fill();

      // Vidro exterior do frasco de laboratório (formato cônico / retorta)
      ctx.fillStyle = 'rgba(235, 255, 248, 0.82)';
      ctx.beginPath();
      ctx.moveTo(-r * 0.35, -r * 0.95);
      ctx.lineTo(r * 0.35, -r * 0.95);
      ctx.lineTo(r * 0.35, -r * 0.35);
      ctx.quadraticCurveTo(r * 0.95, -r * 0.05, r * 0.95, r * 0.35);
      ctx.arc(0, r * 0.35, r * 0.95, 0, Math.PI);
      ctx.quadraticCurveTo(-r * 0.95, -r * 0.05, -r * 0.35, -r * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Líquido Ácido Fluorescente preenchendo a base
      ctx.fillStyle = acidCol;
      ctx.beginPath();
      ctx.arc(0, r * 0.35, r * 0.78, 0.15, Math.PI - 0.15);
      ctx.closePath();
      ctx.fill();

      // Gargalo de latão e rolha de cortiça
      ctx.fillStyle = '#d4a373';
      ctx.fillRect(-r * 0.42, -r * 0.85, r * 0.84, 2);
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(-r * 0.32, -r * 1.3, r * 0.64, r * 0.5);

      // Reflexo especular no bojo do vidro
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(0, r * 0.35, r * 0.6, -Math.PI * 0.7, -Math.PI * 0.3);
      ctx.stroke();

      ctx.restore();
      continue;
    }

    if (b.type === 'SWORD') {
      if (b.trail) {
        for (let t = 0; t < b.trail.length; t++) {
          const pt = b.trail[t];
          const tAlpha = (1 - t / b.trail.length) * 0.42;
          ctx.fillStyle = b.isEvolved ? `rgba(241, 196, 15, ${tAlpha})` : `rgba(168, 85, 247, ${tAlpha})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, b.radius * (1 - t / b.trail.length * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle || 0);

      // Halo translúcido espectral
      ctx.fillStyle = b.isEvolved ? 'rgba(241, 196, 15, 0.35)' : 'rgba(168, 85, 247, 0.35)';
      ctx.beginPath();
      if (b.isEvolved) {
        ctx.moveTo(18, 0);
        ctx.lineTo(-10, -7.5);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-10, 7.5);
      } else {
        ctx.moveTo(14, 0);
        ctx.lineTo(-8, -5.5);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-8, 5.5);
      }
      ctx.closePath();
      ctx.fill();

      // Corpo da Lâmina Espiritual
      ctx.fillStyle = b.isEvolved ? '#f1c40f' : '#7c3aed';
      ctx.beginPath();
      if (b.isEvolved) {
        ctx.moveTo(16, 0);
        ctx.lineTo(-9, -6);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-9, 6);
      } else {
        ctx.moveTo(12, 0);
        ctx.lineTo(-7, -4.5);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-7, 4.5);
      }
      ctx.closePath();
      ctx.fill();

      // Núcleo incandescente branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -1, 6, 2);
      ctx.restore();
      continue;
    }
  }

  for (let i = 0; i < enemyBullets.length; i++) {
    const eb = enemyBullets[i];
    if (eb.x < viewLeft || eb.x > viewRight || eb.y < viewTop || eb.y > viewBottom) continue;

    const bType = eb.bulletType || 'DEFAULT';
    ctx.save();
    ctx.translate(eb.x, eb.y);

    if (bType === 'TECH') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);
      // Rastro de Plasma Carmesim
      ctx.fillStyle = 'rgba(255, 71, 87, 0.45)';
      ctx.fillRect(-12, -2.5, 16, 5);
      // Núcleo Energético Vermelho
      ctx.fillStyle = '#ff4757';
      ctx.fillRect(-8, -1.8, 12, 3.6);
      // Centro Incandescente
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -1, 7, 2);
      ctx.fillStyle = '#ff6b81';
      ctx.fillRect(4, -1.5, 3, 3);
    } else if (bType === 'FIRE_SHRAPNEL') {
      ctx.rotate(frameCount * 0.18 + eb.x);
      // Rastro de fumaça cinzenta
      ctx.fillStyle = 'rgba(45, 52, 54, 0.4)';
      ctx.beginPath();
      ctx.arc(-8, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // Fragmento de Brasa Incandescente
      ctx.fillStyle = '#d35400';
      ctx.beginPath();
      ctx.moveTo(-5, -4);
      ctx.lineTo(5, -2);
      ctx.lineTo(3, 5);
      ctx.lineTo(-4, 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -1, 2, 2);
    } else if (bType === 'BASALT_LANCE') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);

      // Rastro incandescente de magma e brasas
      const tailGrad = ctx.createLinearGradient(-22, 0, 8, 0);
      tailGrad.addColorStop(0, 'rgba(230, 126, 34, 0)');
      tailGrad.addColorStop(0.5, 'rgba(231, 76, 60, 0.55)');
      tailGrad.addColorStop(0.85, 'rgba(243, 156, 18, 0.85)');
      tailGrad.addColorStop(1, '#ffffff');
      ctx.fillStyle = tailGrad;
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(8, 0);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();

      // Corpo da Lança de Basalto (losango afiado de rocha e magma)
      ctx.fillStyle = '#1e272e';
      ctx.strokeStyle = '#e67e22';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-2, -5);
      ctx.lineTo(-12, 0);
      ctx.lineTo(-2, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Núcleo de lava superaquecido central
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-1, -2.5);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-1, 2.5);
      ctx.closePath();
      ctx.fill();

      // Ponto especular branco na ponta perfurante
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (bType === 'CHAOS') {
      const cPulse = Math.sin(frameCount * 0.25) * 1.5;
      // Halo do Caos Pulsante
      ctx.fillStyle = 'rgba(142, 68, 173, 0.55)';
      ctx.beginPath();
      ctx.arc(0, 0, eb.radius + 2.5 + cPulse, 0, Math.PI * 2);
      ctx.fill();
      // Núcleo Abissal
      ctx.fillStyle = '#090810';
      ctx.beginPath();
      ctx.arc(0, 0, eb.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      // Fagulho Orbital
      const fAng = frameCount * 0.15;
      ctx.fillStyle = '#ff7675';
      ctx.fillRect(Math.cos(fAng) * (eb.radius + 1) - 1.5, Math.sin(fAng) * (eb.radius + 1) - 1.5, 3, 3);
    } else if (bType === 'ABYSSAL_BOLT') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);
      // Rastro de Vácuo e Plasma Ciano
      const grad = ctx.createLinearGradient(-16, 0, 8, 0);
      grad.addColorStop(0, 'rgba(142, 68, 173, 0)');
      grad.addColorStop(0.4, 'rgba(142, 68, 173, 0.55)');
      grad.addColorStop(0.8, 'rgba(0, 206, 201, 0.85)');
      grad.addColorStop(1, '#ffffff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(4, -3.5);
      ctx.lineTo(10, 0);
      ctx.lineTo(4, 3.5);
      ctx.closePath();
      ctx.fill();
      // Núcleo Incandescente
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (bType === 'COSMIC_BOLT') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);
      // Cauda Estelar Superaquecida
      ctx.fillStyle = 'rgba(232, 67, 147, 0.45)';
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(2, -4);
      ctx.lineTo(8, 0);
      ctx.lineTo(2, 4);
      ctx.closePath();
      ctx.fill();
      // Agulha de Plasma Branco/Ciano
      ctx.strokeStyle = '#81ecec';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (bType === 'VAMPIRE_BAT') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);

      // Rastro de fumaça e névoa carmesim
      const tailGrad = ctx.createLinearGradient(-18, 0, 0, 0);
      tailGrad.addColorStop(0, 'rgba(40, 2, 8, 0)');
      tailGrad.addColorStop(0.6, 'rgba(142, 68, 173, 0.4)');
      tailGrad.addColorStop(1, 'rgba(255, 23, 68, 0.7)');
      ctx.fillStyle = tailGrad;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(2, 0);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();

      // Morcego espectral animado (batimento de asas)
      const flap = Math.sin(frameCount * 0.5 + (eb.x * 0.1)) * 6;
      ctx.fillStyle = '#120206';
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-2, -9 + flap);
      ctx.lineTo(-5, -2);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-5, 2);
      ctx.lineTo(-2, 9 - flap);
      ctx.closePath();
      ctx.fill();

      // Borda das asas em sangue brilhante
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Olhos vermelhos brilhantes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, -2, 1.5, 1.5);
      ctx.fillRect(3, 1, 1.5, 1.5);
    } else if (bType === 'BLOOD_ORB') {
      const bPulse = Math.sin(frameCount * 0.28 + (eb.x * 0.05)) * 1.8;
      const orbR = eb.radius + bPulse;

      // Halo pulsante exterior
      const haloGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, orbR * 1.8);
      haloGrad.addColorStop(0, 'rgba(255, 0, 85, 0.9)');
      haloGrad.addColorStop(0.4, 'rgba(200, 15, 45, 0.6)');
      haloGrad.addColorStop(0.8, 'rgba(80, 5, 20, 0.3)');
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(0, 0, orbR * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Núcleo denso de sangue carmesim
      ctx.fillStyle = '#200207';
      ctx.beginPath();
      ctx.arc(0, 0, orbR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Anel rúnico orbital
      const rAng = frameCount * 0.15;
      ctx.strokeStyle = 'rgba(255, 107, 129, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, orbR * 1.35, orbR * 0.55, rAng, 0, Math.PI * 2);
      ctx.stroke();

      // Ponto especular branco no núcleo
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-orbR * 0.35, -orbR * 0.35, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (bType === 'BLOOD_CLAW') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);

      // Rastro de corte translúcido
      const cGrad = ctx.createLinearGradient(-16, 0, 10, 0);
      cGrad.addColorStop(0, 'rgba(255, 23, 68, 0)');
      cGrad.addColorStop(0.5, 'rgba(180, 10, 35, 0.65)');
      cGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.quadraticCurveTo(-4, -8, 8, 0);
      ctx.quadraticCurveTo(-4, 8, -16, 0);
      ctx.fill();

      // Lâmina curvada afiada em forma de garra
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-4, -6);
      ctx.quadraticCurveTo(0, 0, -4, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else if (bType === 'BLOOD_DAGGER') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);

      // Adaga de cristal de sangue giratória
      const spin = frameCount * 0.22;
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-2, -5 * Math.cos(spin));
      ctx.lineTo(-10, 0);
      ctx.lineTo(-2, 5 * Math.cos(spin));
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Guarda e pomo
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-3, -3.5, 2, 7);
      ctx.fillRect(-11, -1.5, 3, 3);
    } else if (bType === 'SHADOW_ORB') {
      const oPulse = Math.sin(frameCount * 0.2 + (eb.x * 0.05)) * 1.5;
      const orbR = (eb.radius || 6.5) + oPulse;

      // Halo pulsante exterior sombrio
      ctx.fillStyle = 'rgba(155, 89, 182, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, orbR * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Núcleo abissal
      ctx.fillStyle = '#1e082b';
      ctx.beginPath();
      ctx.arc(0, 0, orbR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a29bfe';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Olho / pupila fantasmagórica
      ctx.fillStyle = '#00cec9';
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, orbR * 0.7, frameCount * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -1, 2, 2);
    } else if (bType === 'ACID_SPIT') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);

      // Rastro de gosma cáustica vermelha
      ctx.fillStyle = 'rgba(255, 71, 87, 0.45)';
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(-2, -3.5);
      ctx.lineTo(6, 0);
      ctx.lineTo(-2, 3.5);
      ctx.closePath();
      ctx.fill();

      // Gota ácida escarlate incandescente
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.ellipse(2, 0, 5.5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
    } else if (bType === 'SNIPER_ARROW') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);

      // Rastro de vácuo cintilante e estilhaços de éter
      const arrowGrad = ctx.createLinearGradient(-26, 0, 8, 0);
      arrowGrad.addColorStop(0, 'rgba(156, 136, 255, 0)');
      arrowGrad.addColorStop(0.5, 'rgba(162, 155, 254, 0.45)');
      arrowGrad.addColorStop(1, 'rgba(224, 86, 253, 0.9)');
      ctx.fillStyle = arrowGrad;
      ctx.beginPath();
      ctx.moveTo(-26, 0);
      ctx.lineTo(-4, -2.5);
      ctx.lineTo(8, 0);
      ctx.lineTo(-4, 2.5);
      ctx.closePath();
      ctx.fill();

      // Haste de osso entalhada com runas
      ctx.strokeStyle = '#dfe4ea';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();

      // Fletching de penas astrais
      ctx.fillStyle = '#a29bfe';
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(-22, -4);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-22, 4);
      ctx.closePath();
      ctx.fill();

      // Ponta de cristal de éter facetada
      ctx.fillStyle = '#e056fd';
      ctx.beginPath();
      ctx.moveTo(8, -4);
      ctx.lineTo(16, 0);
      ctx.lineTo(8, 4);
      ctx.lineTo(6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Núcleo incandescente estelar
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, -1, 3, 2);
    } else if (bType === 'CHAIN_HOOK') {
      // Elos de corrente desenhados a partir da posição do monstro lançador
      const parentX = eb.parentEntity ? eb.parentEntity.x : eb.parentX;
      const parentY = eb.parentEntity ? eb.parentEntity.y : eb.parentY;
      if (parentX !== undefined && parentY !== undefined) {
        const pRelX = parentX - eb.x;
        const pRelY = parentY - eb.y;
        const chainLen = Math.hypot(pRelX, pRelY);
        if (chainLen > 4) {
          ctx.save();
          // Linha guia de aço escuro
          ctx.strokeStyle = '#2d3436';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(pRelX, pRelY);
          ctx.lineTo(0, 0);
          ctx.stroke();

          // Elos metálicos ovais intercalados
          const linkDist = 11;
          const totalLinks = Math.floor(chainLen / linkDist);
          ctx.strokeStyle = '#95a5a6';
          ctx.lineWidth = 2.0;
          for (let l = 1; l < totalLinks; l++) {
            const frac = l / totalLinks;
            const lx = pRelX * (1 - frac);
            const ly = pRelY * (1 - frac);
            ctx.strokeRect(lx - 2.5, ly - 2.5, 5, 5);
          }
          ctx.restore();
        }
      }

      // Gancho de açougueiro pesado girando em direção ao vetor de movimento
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);

      // Haste da manilha de fixação
      ctx.fillStyle = '#576574';
      ctx.fillRect(-8, -2.5, 6, 5);
      ctx.strokeStyle = '#2f3542';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-8, -2.5, 6, 5);

      // Corpo maciço do gancho curvo de ferro
      ctx.fillStyle = '#dfe4ea';
      ctx.beginPath();
      ctx.moveTo(-2, -3);
      ctx.lineTo(8, -3);
      ctx.quadraticCurveTo(14, -2, 14, 5);
      ctx.quadraticCurveTo(12, 12, 2, 11);
      ctx.lineTo(5, 7);
      ctx.quadraticCurveTo(9, 7, 9, 3);
      ctx.lineTo(-2, 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Ponta farpada afiada e mancha de sangue fresco
      ctx.fillStyle = '#b33939';
      ctx.beginPath();
      ctx.moveTo(2, 11);
      ctx.lineTo(8, 14);
      ctx.lineTo(5, 7);
      ctx.closePath();
      ctx.fill();
    } else if (bType === 'WEB_COCOON') {
      const spin = frameCount * 0.22 + eb.x;
      ctx.rotate(spin);

      // Fios de seda soltos em espiral
      ctx.strokeStyle = 'rgba(223, 228, 234, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, (eb.radius || 7) + 3, 0, Math.PI * 1.5);
      ctx.stroke();

      // Núcleo denso do casulo de mortalha fúnebre
      ctx.fillStyle = '#b2bec3';
      ctx.beginPath();
      ctx.ellipse(0, 0, (eb.radius || 7), (eb.radius || 7) * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#636e72';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Bandagens transversais entrecruzadas
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-5, -4);
      ctx.lineTo(5, 4);
      ctx.moveTo(-5, 4);
      ctx.lineTo(5, -4);
      ctx.stroke();

      // Gotículas de secreção venenosa aderente
      ctx.fillStyle = '#16a085';
      ctx.fillRect(-2, -2, 4, 4);
    } else if (bType === 'THORN_SPIKE' || bType === 'CHITIN_SPIKE') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);

      // Rastro de perfuração sombria
      ctx.fillStyle = 'rgba(142, 68, 173, 0.45)';
      ctx.fillRect(-10, -2, 12, 4);

      // Agulha cirúrgica de ferro negro
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.moveTo(-8, -2.5);
      ctx.lineTo(9, 0);
      ctx.lineTo(-8, 2.5);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#9b59b6';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Brilho especular de corte de ametista
      ctx.fillStyle = '#e056fd';
      ctx.fillRect(2, -0.8, 5, 1.6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, -0.6, 2, 1.2);
    } else if (bType === 'SWARM_HORNET' || bType === 'BAT') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);

      // Batimento rápido de asas membranosas
      const flap = Math.sin(frameCount * 0.75 + eb.x) * 6;
      ctx.fillStyle = 'rgba(178, 190, 195, 0.6)';
      ctx.beginPath();
      ctx.ellipse(-2, -6 + flap * 0.3, 4, Math.abs(flap) + 2, -0.4, 0, Math.PI * 2);
      ctx.ellipse(-2, 6 - flap * 0.3, 4, Math.abs(flap) + 2, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Corpo da vespa parasita em quitina esmeralda
      ctx.fillStyle = '#16a085';
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0e6251';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Ferrão afiado gotejante
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.moveTo(5, -1.5);
      ctx.lineTo(10, 0);
      ctx.lineTo(5, 1.5);
      ctx.closePath();
      ctx.fill();

      // Olhos facetados carmesins
      ctx.fillStyle = '#ff4757';
      ctx.fillRect(2, -2, 1.5, 1.5);
      ctx.fillRect(2, 0.5, 1.5, 1.5);
    } else if (bType === 'BLOOD') {
      const bAng = Math.atan2(eb.vy || 0, eb.vx || 0);
      ctx.rotate(bAng);

      // Rastro de corte de sangue translúcido
      const cGrad = ctx.createLinearGradient(-16, 0, 10, 0);
      cGrad.addColorStop(0, 'rgba(255, 23, 68, 0)');
      cGrad.addColorStop(0.5, 'rgba(180, 10, 35, 0.65)');
      cGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.quadraticCurveTo(-4, -8, 8, 0);
      ctx.quadraticCurveTo(-4, 8, -16, 0);
      ctx.fill();

      // Lâmina curvada de cristal de sangue
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-4, -6);
      ctx.quadraticCurveTo(0, 0, -4, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else if (bType === 'BOULDER') {
      const bRad = eb.radius || 12;
      const arcProgress = eb.maxLife ? Math.max(0, Math.min(1, 1 - (eb.life / eb.maxLife))) : 0.5;
      const arcHeight = Math.sin(arcProgress * Math.PI) * 36;

      // 1. Sombra desacoplada no solo
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      const shadowScale = Math.max(0.4, 1 - (arcHeight / 60));
      ctx.beginPath();
      ctx.ellipse(0, arcHeight, bRad * shadowScale * 1.25, bRad * shadowScale * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Elevação balística no plano Z
      ctx.translate(0, -arcHeight);
      const spin = frameCount * 0.14 + (eb.x * 0.05);
      ctx.rotate(spin);

      // 3. Rocha Basáltica com Facetas Angulares
      ctx.fillStyle = '#2d3436';
      ctx.beginPath();
      ctx.moveTo(-bRad, -bRad * 0.4);
      ctx.lineTo(-bRad * 0.4, -bRad);
      ctx.lineTo(bRad * 0.6, -bRad * 0.8);
      ctx.lineTo(bRad, -bRad * 0.2);
      ctx.lineTo(bRad * 0.8, bRad * 0.7);
      ctx.lineTo(-bRad * 0.2, bRad);
      ctx.lineTo(-bRad * 0.9, bRad * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // 4. Fissuras de Magma Incandescente
      ctx.strokeStyle = '#d35400';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-bRad * 0.6, -bRad * 0.2);
      ctx.lineTo(0, 0);
      ctx.lineTo(bRad * 0.5, bRad * 0.3);
      ctx.moveTo(0, 0);
      ctx.lineTo(bRad * 0.2, -bRad * 0.6);
      ctx.stroke();

      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-bRad * 0.3, -bRad * 0.1);
      ctx.lineTo(0, 0);
      ctx.lineTo(bRad * 0.3, bRad * 0.15);
      ctx.stroke();

      // 5. Núcleo Térmico Central
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(0, 0, bRad * 0.25, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Projétil Padrão Polido (Ruby Shard)
      ctx.fillStyle = '#ff7675';
      ctx.beginPath();
      ctx.arc(0, 0, eb.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d63031';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-eb.radius * 0.35, -eb.radius * 0.35, Math.max(1, eb.radius * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

    if (projAlpha < 1.0) {
      ctx.restore();
    }
  }

  const isBossBattle = !!(deathSequence && deathSequence.isBossBattle);
  const mobAlpha = (isDeathSeqActive && !isBossBattle)
    ? (deathSequence.mobFadeAlpha !== undefined ? deathSequence.mobFadeAlpha : 1.0)
    : ((gameState && gameState.isDead && !isBossBattle) ? 0 : 1.0);

  // Defesa em profundidade: garante opacidade integral antes de desenhar entidades e jogador
  ctx.globalAlpha = 1.0;

  if (mobAlpha > 0.001) {
    if (mobAlpha < 1.0) {
      ctx.save();
      ctx.globalAlpha = mobAlpha;
    }
    renderEnemiesShadows(ctx, enemies, bounds, frameCount);
    renderDyingEnemies(dyingEnemies, bounds);
    renderEnemies(enemies, bounds);
    if (mobAlpha < 1.0) {
      ctx.restore();
    }
  }

  drawPlayerCharacter();
  renderDeathSequenceWorld(ctx);
  drawPlayerChestArrows(ctx, chests, player, frameCount);

  const combatFxAlpha = isDeathSeqActive ? projAlpha : 1.0;
  if (combatFxAlpha > 0.001) {
    if (combatFxAlpha < 1.0) {
      ctx.save();
      ctx.globalAlpha = combatFxAlpha;
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.x >= viewLeft && p.x <= viewRight && p.y >= viewTop && p.y <= viewBottom) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
      }
    }

    if (damageTexts.length > 0) {
      ctx.textAlign = 'center';
      for (let i = 0; i < damageTexts.length; i++) {
        const dtItem = damageTexts[i];
        if (dtItem.x < viewLeft || dtItem.x > viewRight || dtItem.y < viewTop || dtItem.y > viewBottom) continue;
        const alpha = Math.max(0, dtItem.life / dtItem.maxLife);
        ctx.fillStyle = dtItem.color;
        ctx.globalAlpha = alpha;
        ctx.font = dtItem.isCrit ? 'bold 16px sans-serif' : 'bold 12px sans-serif';
        if (dtItem.isCrit) {
          ctx.strokeStyle = '#d35400';
          ctx.lineWidth = 2.5;
          ctx.strokeText(dtItem.text, dtItem.x, dtItem.y);
        }
        ctx.fillText(dtItem.text, dtItem.x, dtItem.y);
      }
      ctx.globalAlpha = 1.0;
    }
    if (combatFxAlpha < 1.0) {
      ctx.restore();
    }
  }

  ctx.restore();

  if (mobAlpha > 0.001) {
    if (mobAlpha < 1.0) {
      ctx.save();
      ctx.globalAlpha = mobAlpha;
      renderMinibossOffscreenRadar(ctx, enemies, camera, CAMERA_ZOOM, viewW, viewH, frameCount);
      ctx.restore();
    } else {
      renderMinibossOffscreenRadar(ctx, enemies, camera, CAMERA_ZOOM, viewW, viewH, frameCount);
    }
  }

  // Radar Periférico de Baús de Miniboss e Boss Fora de Tela
  drawOffscreenChestRadar(ctx, chests, player, camera, CAMERA_ZOOM, viewW, viewH, frameCount);

  // 2. Banner Cinematográfico de Transição de Onda (In-Game Wave Announcement)
  if (waveAnnouncement && waveAnnouncement.timer > 0) {
    const maxT = waveAnnouncement.maxTimer || 180;
    const progress = 1 - (waveAnnouncement.timer / maxT);
    const inRatio = Math.min(1.0, Math.max(0, progress / 0.16));
    const inEase = inRatio * inRatio * (3 - 2 * inRatio);
    const outRatio = Math.min(1.0, Math.max(0, (1 - progress) / 0.18));
    const outEase = outRatio * outRatio * (3 - 2 * outRatio);
    const alpha = inEase * outEase;
    if (alpha > 0.001) {
      const isCompactH = layoutMetrics.isCompactHeight || viewH < 520;
      const hudBottom = getHudBottom();
      const bannerW = Math.min(560, Math.floor(viewW * 0.92));
      const bannerH = isCompactH ? 42 : 52;
      const bx = (viewW - bannerW) / 2;
      
      // Ancoragem dinâmica: SEMPRE abaixo da base do HUD com margem de segurança garantida
      const safeTop = hudBottom + (isCompactH ? 8 : 14);
      const by = Math.max(safeTop, Math.floor(viewH * (isCompactH ? 0.12 : 0.15)));

      // Asas de fade lateral estendido
      const fadeWing = isCompactH ? 50 : 120;
      const totalW = bannerW + fadeWing * 2;
      const startX = bx - fadeWing;
      const endX = bx + bannerW + fadeWing;

      // Transição suave de movimento
      const animOffsetY = (1 - inEase) * -8 + (1 - outEase) * -6;

      const targetCtx = bannerCtx || ctx;
      targetCtx.save();
      if (bannerCtx && targetCtx === bannerCtx) {
        targetCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      targetCtx.globalAlpha = alpha;
      targetCtx.translate(0, animOffsetY);

      // Fundo do Banner Gótico Sombrio com Fade Estendido nas Laterais
      const bgGrad = targetCtx.createLinearGradient(startX, by, endX, by);
      bgGrad.addColorStop(0, 'rgba(10, 12, 16, 0)');
      bgGrad.addColorStop(0.14, 'rgba(12, 14, 20, 0.25)');
      bgGrad.addColorStop(0.28, 'rgba(14, 18, 28, 0.90)');
      bgGrad.addColorStop(0.50, 'rgba(16, 20, 32, 0.96)');
      bgGrad.addColorStop(0.72, 'rgba(14, 18, 28, 0.90)');
      bgGrad.addColorStop(0.86, 'rgba(12, 14, 20, 0.25)');
      bgGrad.addColorStop(1, 'rgba(10, 12, 16, 0)');
      targetCtx.fillStyle = bgGrad;
      targetCtx.fillRect(startX, by, totalW, bannerH);

      // Linhas de friso douradas superior e inferior com pontas suaves
      const borderGrad = targetCtx.createLinearGradient(startX, by, endX, by);
      borderGrad.addColorStop(0, 'rgba(241, 196, 15, 0)');
      borderGrad.addColorStop(0.20, 'rgba(241, 196, 15, 0.65)');
      borderGrad.addColorStop(0.50, 'rgba(255, 234, 167, 1)');
      borderGrad.addColorStop(0.80, 'rgba(241, 196, 15, 0.65)');
      borderGrad.addColorStop(1, 'rgba(241, 196, 15, 0)');
      targetCtx.strokeStyle = borderGrad;
      targetCtx.lineWidth = 1.6;
      targetCtx.lineCap = 'round';
      targetCtx.beginPath();
      targetCtx.moveTo(startX + fadeWing * 0.3, by);
      targetCtx.lineTo(endX - fadeWing * 0.3, by);
      targetCtx.moveTo(startX + fadeWing * 0.3, by + bannerH);
      targetCtx.lineTo(endX - fadeWing * 0.3, by + bannerH);
      targetCtx.stroke();

      // Texto Centralizado com Auto-Scaling Cacheado (Zero recalculo por frame)
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';

      if (cachedWaveAnnouncementIndex !== waveAnnouncement.index) {
        cachedWaveAnnouncementIndex = waveAnnouncement.index;
        const waveTitle = (waveAnnouncement.name || '').toUpperCase();
        cachedWaveTitleText = `⚜ ${waveTitle} ⚜`;
        let fontSize = isCompactH ? 14 : 18;
        targetCtx.font = `bold ${fontSize}px "Cinzel", "Cinzel Decorative", Georgia, serif`;
        let textWidth = targetCtx.measureText(cachedWaveTitleText).width;
        const maxTextWidth = bannerW - 32;

        while (textWidth > maxTextWidth && fontSize > 11) {
          fontSize -= 1;
          targetCtx.font = `bold ${fontSize}px "Cinzel", "Cinzel Decorative", Georgia, serif`;
          textWidth = targetCtx.measureText(cachedWaveTitleText).width;
        }
        cachedWaveFontSize = fontSize;
      }

      targetCtx.font = `bold ${cachedWaveFontSize}px "Cinzel", "Cinzel Decorative", Georgia, serif`;
      const titleX = viewW / 2;
      const titleY = by + (isCompactH ? 15 : 20);

      // Efeito de Glow Dourado em Camadas (Zero-cost shadow - sem ativação do pipeline de shadowBlur)
      targetCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      targetCtx.fillText(cachedWaveTitleText, titleX + 1, titleY + 1.5);
      targetCtx.fillStyle = 'rgba(241, 196, 15, 0.35)';
      targetCtx.fillText(cachedWaveTitleText, titleX, titleY + 1);
      targetCtx.fillStyle = '#f1c40f';
      targetCtx.fillText(cachedWaveTitleText, titleX, titleY);

      // Subtítulo descritivo
      if (!isCompactH || viewH > 370) {
        targetCtx.font = 'italic 10.5px sans-serif';
        targetCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        targetCtx.fillText("Sobreviva à maré crescente de horrores", titleX + 1, by + (isCompactH ? 30 : 38));
        targetCtx.fillStyle = '#dfe4ea';
        targetCtx.fillText("Sobreviva à maré crescente de horrores", titleX, by + (isCompactH ? 29 : 37));
      }

      targetCtx.restore();
    }
  }

  if (stick.active) {
    ctx.save();
    
    // 1. Base externa do joystick
    const isSat = stick.isSaturated;
    const baseColor = isSat ? 'rgba(241, 196, 15, ' : 'rgba(129, 236, 236, ';
    
    // Fundo translúcido sutil
    ctx.fillStyle = 'rgba(10, 12, 18, 0.35)';
    ctx.beginPath();
    ctx.arc(stick.startX, stick.startY, stick.radius, 0, Math.PI * 2);
    ctx.fill();

    // Anel externo
    ctx.strokeStyle = `${baseColor}0.38)`;
    ctx.lineWidth = isSat ? 2.5 : 1.8;
    ctx.beginPath();
    ctx.arc(stick.startX, stick.startY, stick.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Círculo pontilhado da zona morta interna
    const innerDeadzone = stick.radius * 0.12;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(stick.startX, stick.startY, innerDeadzone, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Linha do vetor de direção
    if (stick.normMag > 0.08) {
      ctx.strokeStyle = `${baseColor}0.45)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(stick.startX, stick.startY);
      ctx.lineTo(stick.curX, stick.curY);
      ctx.stroke();
    }

    // 3. Knob do Polegar
    const knobRadius = isSat ? 22 : 19;
    const knobGrad = ctx.createRadialGradient(
      stick.curX - 3, stick.curY - 3, 2,
      stick.curX, stick.curY, knobRadius
    );
    if (isSat) {
      knobGrad.addColorStop(0, '#ffffff');
      knobGrad.addColorStop(0.4, '#f1c40f');
      knobGrad.addColorStop(1, 'rgba(211, 84, 0, 0.85)');
    } else {
      knobGrad.addColorStop(0, '#ffffff');
      knobGrad.addColorStop(0.4, '#74b9ff');
      knobGrad.addColorStop(1, 'rgba(9, 132, 227, 0.75)');
    }

    ctx.fillStyle = knobGrad;
    ctx.beginPath();
    ctx.arc(stick.curX, stick.curY, knobRadius, 0, Math.PI * 2);
    ctx.fill();

    // Borda do Knob
    ctx.strokeStyle = isSat ? '#ffeaa7' : '#dfe6e9';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  // 3. Overlay Cósmico de Vitória do Boss Final (Banner Dourado + Fade-Out da Tela)
  // Renderizado na camada superior absoluta para que nunca seja sobreposto pelo jogador ou projéteis
  const sovereignBoss = (activeBoss && activeBoss.bossId === 4) 
    ? activeBoss 
    : enemies.find(en => en && en.bossId === 4);
  if (sovereignBoss && (sovereignBoss.showGoldenBanner || sovereignBoss.fadeAlpha > 0)) {
    drawBossVictoryOverlay(ctx, sovereignBoss, frameCount);
  }

  // 4. Overlay de Introdução Cinematográfica (Vinheta Teatral e Cartão do Herói/Arena)
  if (matchIntro && matchIntro.active) {
    drawMatchIntroOverlay(ctx, viewW, viewH, matchIntro, frameCount);
  }

  // 4.1 Overlay da Sequência de Morte (Spotlight fúnebre e Flash necrótico da Nova)
  if ((deathSequence && deathSequence.active) || gameState.isDead) {
    renderDeathSequenceOverlay(ctx, viewW, viewH);
  }

  drawBossPhaseCinematic(ctx, activeBoss, viewW, viewH, camera, CAMERA_ZOOM);

  // 5. Barras Pretas de Cinema (Letterbox) durante a intro do Boss ou início de partida
  if (cinematicCamera && cinematicCamera.letterboxProgress > 0.005) {
    const barHeight = Math.floor(viewH * 0.11 * cinematicCamera.letterboxProgress);
    ctx.fillStyle = '#000000';
    // Barra Superior
    ctx.fillRect(0, 0, viewW, barHeight);
    // Barra Inferior
    ctx.fillRect(0, viewH - barHeight, viewW, barHeight);

    // Friso dourado gótico na borda interna das barras
    ctx.strokeStyle = `rgba(241, 196, 15, ${0.65 * cinematicCamera.letterboxProgress})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, barHeight);
    ctx.lineTo(viewW, barHeight);
    ctx.moveTo(0, viewH - barHeight);
    ctx.lineTo(viewW, viewH - barHeight);
    ctx.stroke();
  }

  ctx.restore();
}
// Reexportações para assegurar total retrocompatibilidade modular
export {
  renderProps,
  renderDrops,
  renderChests,
  renderGems,
  drawPlayerChestArrows,
  drawOffscreenChestRadar,
  renderAcidPuddles,
  renderBossTelegraphs,
  renderBossShockwaves,
  renderBossProjectiles,
  renderEnemiesShadows,
  renderDyingEnemies,
  renderEnemies,
  renderMinibossOffscreenRadar
};
