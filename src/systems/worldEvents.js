/**
 * src/systems/worldEvents.js
 * Subsistema Modular de Eventos Dinâmicos e Risco vs. Recompensa na Arena:
 * - Altar de Sangue procedimental com feixe místico carmesim
 * - Círculo ritual de contenção com tolerância de 1,5 segundos
 * - Modificador de velocidade da horda (2.0x) e spawn acelerado
 * - Canalização por tecla (E / Espaço) e toque mobile (segurar 1s com anel de progresso)
 * - Recompensa de Baú Lendário Garantido (LEGENDARY_ALTAR)
 */

import { playSfx, triggerHaptic } from '../core/audio.js';
import { addDamageText, createHitParticles } from './combat.js';

export const BLOOD_ALTAR_PACTS = [
  {
    id: 'horde_frenzy',
    name: "Pacto da Horda Rubra",
    desc: "A velocidade da horda é dobrada durante 10 segundos dentro do círculo ritual.",
    duration: 10.0,
    radius: 190,
    outOfBoundsGrace: 1.5,
    enemySpeedMult: 2.0,
    spawnRateMult: 1.5,
    rewardTier: 'LEGENDARY_ALTAR'
  }
];

export let activeBloodAltar = null;
export let isAltarBlockingBoss = false;
let nextAltarSpawnSeconds = 100; // Primeiro altar surge ~100s de partida
let isPlayerChanneling = false;
var touchBtnInitialized = false;

export function getActiveBloodAltar() {
  return activeBloodAltar;
}

export function isBossBlockedByWorldEvent() {
  return Boolean(isAltarBlockingBoss || (activeBloodAltar && activeBloodAltar.state === 'ACTIVE'));
}

export function onAltarChestCollected() {
  isAltarBlockingBoss = false;
}

export function getWorldEventEnemySpeedMult() {
  if (activeBloodAltar && activeBloodAltar.state === 'ACTIVE') {
    return activeBloodAltar.pact.enemySpeedMult || 2.0;
  }
  return 1.0;
}

export function getWorldEventSpawnRateMult() {
  if (activeBloodAltar && activeBloodAltar.state === 'ACTIVE') {
    return activeBloodAltar.pact.spawnRateMult || 1.5;
  }
  return 1.0;
}

export function setPlayerChannelingAltar(val) {
  isPlayerChanneling = !!val;
}

export function resetWorldEvents() {
  activeBloodAltar = null;
  isAltarBlockingBoss = false;
  nextAltarSpawnSeconds = 95 + Math.floor(Math.random() * 25);
  isPlayerChanneling = false;
  updateBloodAltarHUD(null);
}

export function spawnBloodAltar(player, pactIndex = 0, customDist = null) {
  const pact = BLOOD_ALTAR_PACTS[pactIndex] || BLOOD_ALTAR_PACTS[0];
  const angle = Math.random() * Math.PI * 2;
  const dist = customDist !== null ? customDist : (580 + Math.random() * 140); // ~600px de distância por padrão

  activeBloodAltar = {
    id: 'blood_altar_' + Date.now(),
    x: player.x + Math.cos(angle) * dist,
    y: player.y + Math.sin(angle) * dist,
    radius: 26, // Raio de colisão/base do monólito
    interactRadius: 65,
    ritualRadius: pact.radius,
    state: 'SPAWNED', // 'SPAWNED' | 'ACTIVE' | 'COMPLETED' | 'FAILED'
    timer: pact.duration,
    maxTimer: pact.duration,
    outOfCircleGrace: pact.outOfBoundsGrace,
    maxGrace: pact.outOfBoundsGrace,
    channelProgress: 0, // 0.0 a 1.0 (segurar 1 segundo)
    channelRequiredTime: 1.0,
    isWarning: false,
    lifeTime: 120, // 120 segundos para expirar se ignorado
    pact: pact,
    runesAngle: 0,
    beaconHeight: 1800,
    fadeAlpha: 1.0,
    pulseOffset: Math.random() * Math.PI * 2
  };

  playSfx('warp');
  try { triggerHaptic('medium'); } catch (_) {}
}

export function updateWorldEvents(dt, {
  player,
  enemies,
  gameState,
  frameCount,
  activeBoss,
  spawnChest,
  triggerShake,
  setLastAttackerName
}) {
  const currentSeconds = Math.floor(frameCount / 60);

  // 1. Spawner de Altares Dinâmicos
  if (!activeBloodAltar && !activeBoss && gameState.isInMatch && !gameState.isDead && !gameState.isWon) {
    if (currentSeconds >= nextAltarSpawnSeconds) {
      spawnBloodAltar(player, 0);
      nextAltarSpawnSeconds = currentSeconds + (160 + Math.floor(Math.random() * 50));
    }
  }

  if (!gameState.isInMatch || gameState.isDead || gameState.isWon) {
    updateBloodAltarHUD(null);
    return;
  }

  if (!activeBloodAltar) {
    updateBloodAltarHUD(null);
    return;
  }

  const altar = activeBloodAltar;
  const dx = player.x - altar.x;
  const dy = player.y - altar.y;
  const distToPlayer = Math.hypot(dx, dy);

  altar.runesAngle += 0.018 * dt;

  // 2. Estado SPAWNED: Aguardando Interação do Jogador
  if (altar.state === 'SPAWNED') {
    altar.lifeTime -= dt / 60;
    if (altar.lifeTime <= 0) {
      // Expirou sem interação
      activeBloodAltar = null;
      updateBloodAltarHUD(null);
      return;
    }

    const inRange = distToPlayer <= altar.interactRadius;

    if (inRange && isPlayerChanneling) {
      altar.channelProgress = Math.min(1.0, altar.channelProgress + (dt / 60) / altar.channelRequiredTime);
      if (Math.floor(frameCount) % 10 === 0) {
        createHitParticles(altar.x + (Math.random() - 0.5) * 20, altar.y + (Math.random() - 0.5) * 20, '#ff3838', 2);
        try { triggerHaptic('light'); } catch (_) {}
      }

      if (altar.channelProgress >= 1.0) {
        // Ativação do Pacto de Sangue!
        altar.state = 'ACTIVE';
        isAltarBlockingBoss = true;
        altar.timer = altar.maxTimer;
        altar.outOfCircleGrace = altar.maxGrace;
        altar.channelProgress = 0;
        triggerShake(14);
        playSfx('warp');
        try { triggerHaptic('heavy'); } catch (_) {}
        addDamageText(altar.x, altar.y - 30, "PACTO DE SANGUE SELADO!", true, "#ff3838");
      }
    } else {
      altar.channelProgress = Math.max(0, altar.channelProgress - (dt / 60) * 2.5);
    }

    updateBloodAltarHUD({
      state: 'SPAWNED',
      inRange,
      channelProgress: altar.channelProgress,
      name: altar.pact.name,
      desc: altar.pact.desc
    });
  }

  // 3. Estado ACTIVE: Desafio do Pacto de Sangue
  else if (altar.state === 'ACTIVE') {
    altar.timer -= dt / 60;

    const isInside = distToPlayer <= altar.ritualRadius;

    if (!isInside) {
      altar.isWarning = true;
      altar.outOfCircleGrace -= dt / 60;
      if (Math.floor(frameCount) % 18 === 0) {
        playSfx('hit');
        try { triggerHaptic('medium'); } catch (_) {}
      }

      if (altar.outOfCircleGrace <= 0) {
        // Quebra do Pacto por abandono do círculo!
        altar.state = 'FAILED';
        isAltarBlockingBoss = false;
        altar.fadeTimer = 2.0;
        triggerShake(8);
        playSfx('kill');
        addDamageText(altar.x, altar.y - 20, "PACTO QUEBRADO!", true, "#8e44ad");
      }
    } else {
      altar.isWarning = false;
      // Recuperação gradual da tolerância se estiver dentro
      altar.outOfCircleGrace = Math.min(altar.maxGrace, altar.outOfCircleGrace + (dt / 60) * 0.9);
    }

    // Partículas rúnicas periódicas no perímetro
    if (Math.floor(frameCount) % 6 === 0) {
      const pAngle = Math.random() * Math.PI * 2;
      const px = altar.x + Math.cos(pAngle) * altar.ritualRadius;
      const py = altar.y + Math.sin(pAngle) * altar.ritualRadius;
      createHitParticles(px, py, altar.isWarning ? '#ff3838' : '#e74c3c', 1);
    }

    // Conclusão com Sucesso!
    if (altar.timer <= 0) {
      altar.state = 'COMPLETED';
      altar.fadeTimer = 3.0;
      triggerShake(16);
      playSfx('chest_fanfare');
      try { triggerHaptic('heavy'); } catch (_) {}
      addDamageText(altar.x, altar.y - 30, "DESAFIO CUMPRIDO!", true, "#ffd166");

      // Detonação sagrada / choque de sangue que repele monstros normais
      enemies.forEach(e => {
        if (!e.isBoss && !e.isMiniBoss) {
          const edx = e.x - altar.x;
          const edy = e.y - altar.y;
          const edist = Math.hypot(edx, edy);
          if (edist < 340) {
            const pushAng = Math.atan2(edy, edx);
            e.pushVx = Math.cos(pushAng) * 22;
            e.pushVy = Math.sin(pushAng) * 22;
            e.hp -= 180;
            e.hitFlash = 6;
            createHitParticles(e.x, e.y, '#ffd166', 4);
          }
        }
      });

      // Dropa o Baú Lendário Garantido no Altar
      if (typeof spawnChest === 'function') {
        spawnChest(altar.x, altar.y, 'LEGENDARY_ALTAR');
      }
    }

    updateBloodAltarHUD({
      state: 'ACTIVE',
      timer: Math.max(0, altar.timer),
      maxTimer: altar.maxTimer,
      isWarning: altar.isWarning,
      graceLeft: Math.max(0, altar.outOfCircleGrace)
    });
  }

  // 4. Estados FINAIS: COMPLETED ou FAILED
  else if (altar.state === 'COMPLETED' || altar.state === 'FAILED') {
    altar.fadeTimer -= dt / 60;
    altar.fadeAlpha = Math.max(0, altar.fadeTimer / 2.0);

    if (altar.fadeTimer <= 0) {
      activeBloodAltar = null;
      updateBloodAltarHUD(null);
    } else {
      updateBloodAltarHUD({
        state: altar.state
      });
    }
  }
}

/**
 * Atualiza os elementos de UI do Altar de Sangue (HUD e Botão Mobile).
 */
export function updateBloodAltarHUD(data) {
  const banner = document.getElementById('blood-altar-hud');
  const fill = document.getElementById('blood-altar-fill');
  const status = document.getElementById('blood-altar-status');
  const timerEl = document.getElementById('blood-altar-timer');
  const mobileBtn = document.getElementById('blood-altar-touch-btn');
  const mobileCircle = document.getElementById('blood-altar-touch-circle');
  const hud = document.getElementById('hud');

  if (!data) {
    if (hud) hud.classList.remove('altar-active');
    if (banner) {
      banner.style.display = 'none';
      banner.classList.remove('is-warning', 'is-climax', 'is-completed', 'is-failed');
    }
    if (mobileBtn) mobileBtn.style.display = 'none';
    return;
  }

  // Interação Inicial (SPAWNED)
  if (data.state === 'SPAWNED') {
    if (hud) hud.classList.remove('altar-active');
    if (banner) {
      banner.style.display = 'none';
      banner.classList.remove('is-warning', 'is-climax', 'is-completed', 'is-failed');
    }

    if (mobileBtn) {
      if (data.inRange) {
        mobileBtn.style.display = 'flex';
        const progress = Math.max(0, Math.min(1, data.channelProgress || 0));
        const radius = (mobileCircle && mobileCircle.r && mobileCircle.r.baseVal) ? mobileCircle.r.baseVal.value : 31;
        const circ = 2 * Math.PI * radius;
        const dashOffset = circ * (1 - progress);
        if (mobileCircle) {
          mobileCircle.style.strokeDasharray = `${circ}`;
          mobileCircle.style.strokeDashoffset = `${dashOffset}`;
        }
        if (progress > 0) {
          mobileBtn.classList.add('is-channeling');
        } else {
          mobileBtn.classList.remove('is-channeling');
        }
      } else {
        mobileBtn.style.display = 'none';
        mobileBtn.classList.remove('is-channeling');
      }
    }
  }

  // Desafio Ativo (ACTIVE)
  else if (data.state === 'ACTIVE') {
    if (mobileBtn) {
      mobileBtn.style.display = 'none';
      mobileBtn.classList.remove('is-channeling');
    }

    if (hud) hud.classList.add('altar-active');

    if (banner) {
      banner.style.display = 'inline-flex';
      banner.classList.remove('is-completed', 'is-failed');
      const timeLeft = Math.max(0, data.timer);
      const pct = Math.max(0, Math.min(100, (timeLeft / data.maxTimer) * 100));
      
      if (timerEl) {
        timerEl.textContent = `${timeLeft.toFixed(1)}s`;
      }

      if (timeLeft <= 3.0) {
        banner.classList.add('is-climax');
      } else {
        banner.classList.remove('is-climax');
      }

      if (fill) {
        fill.style.width = `${pct}%`;
        fill.style.background = data.isWarning 
          ? 'linear-gradient(90deg, #ff1744 0%, #ff5252 100%)' 
          : (timeLeft <= 3.0 
              ? 'linear-gradient(90deg, #f39c12 0%, #f1c40f 100%)' 
              : 'linear-gradient(90deg, #c0392b 0%, #ff3838 100%)');
      }

      if (data.isWarning) {
        banner.classList.add('is-warning');
        if (status) {
          status.innerHTML = `
            <span class="altar-warning-alert">
              <svg viewBox="0 0 24 24" class="altar-status-icon warning-icon"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
              FORA DO CÍRCULO! <b>${data.graceLeft.toFixed(1)}s</b>
            </span>
          `;
        }
      } else {
        banner.classList.remove('is-warning');
        if (status) {
          status.innerHTML = '';
        }
      }
    }
  }

  // Concluído ou Falhado
  else if (data.state === 'COMPLETED') {
    if (mobileBtn) mobileBtn.style.display = 'none';
    if (hud) hud.classList.add('altar-active');
    if (banner) {
      banner.style.display = 'inline-flex';
      banner.classList.add('is-completed');
      banner.classList.remove('is-warning', 'is-climax', 'is-failed');
      if (timerEl) timerEl.textContent = '0.0s';
      if (status) {
        status.innerHTML = `
          <span style="color:#ffd166; font-weight:800; letter-spacing:0.5px; display:inline-flex; align-items:center; gap:4px;">
            <svg viewBox="0 0 24 24" class="altar-status-icon" style="color:#ffd166;"><path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            PACTO CUMPRIDO!
          </span>
        `;
      }
      if (fill) {
        fill.style.width = '100%';
        fill.style.background = 'linear-gradient(90deg, #f39c12 0%, #ffd166 100%)';
      }
    }
  } else if (data.state === 'FAILED') {
    if (mobileBtn) mobileBtn.style.display = 'none';
    if (hud) hud.classList.add('altar-active');
    if (banner) {
      banner.style.display = 'inline-flex';
      banner.classList.add('is-failed');
      banner.classList.remove('is-warning', 'is-climax', 'is-completed');
      if (timerEl) timerEl.textContent = '0.0s';
      if (status) {
        status.innerHTML = `
          <span style="color:#e056fd; font-weight:800; letter-spacing:0.5px; display:inline-flex; align-items:center; gap:4px;">
            <svg viewBox="0 0 24 24" class="altar-status-icon" style="color:#e056fd;"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            PACTO QUEBRADO!
          </span>
        `;
      }
      if (fill) fill.style.width = '0%';
    }
  }
}

/**
 * Inicializa os ouvintes de toque e clique do botão de canalização mobile.
 */
export function initWorldEventsUI() {
  if (touchBtnInitialized) return;
  const btn = document.getElementById('blood-altar-touch-btn');
  if (!btn) return;
  touchBtnInitialized = true;

  const startChannel = e => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    setPlayerChannelingAltar(true);
    btn.classList.add('is-channeling');
  };

  const stopChannel = e => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    setPlayerChannelingAltar(false);
    btn.classList.remove('is-channeling');
  };

  btn.addEventListener('touchstart', startChannel, { passive: false });
  btn.addEventListener('touchend', stopChannel, { passive: false });
  btn.addEventListener('touchcancel', stopChannel, { passive: false });
  btn.addEventListener('pointerdown', startChannel);
  btn.addEventListener('pointerup', stopChannel);
  btn.addEventListener('pointercancel', stopChannel);
  btn.addEventListener('pointerleave', stopChannel);
  btn.addEventListener('contextmenu', e => e.preventDefault());
}
