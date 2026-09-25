/**
 * src/ui/hudController.js
 * Gerenciador e Controlador Diegético de HUD de Combate.
 * Responsável pelo cache do DOM (Zero Layout Thrashing), Dirty Checking,
 * Decaimento da Barra Fantasma (Ghost Bar) do jogador e do chefe, e timer de sobrevivência.
 */
import { HERO_EMBLEMS_SVG, CHARACTER_PROFILES, HERO_ULT_CHASSIS_SVG } from '../config/heroProfiles.js';
import { CHARACTERS } from '../config/characters.js';
import { ARENA_PALETTES } from '../render/environment.js';
import { player, getPersistentGold, selectedHeroKey, triggerHeroSkill } from '../entities/player.js';
import { waveAnnouncement, frameCount, matchIntro, deathSequence } from '../state/gameState.js';
import { getTimeUntilNextWave, getEffectiveHordeSeconds, nextBossSpawnTime, currentBossIndex, BOSS_QUEUE } from '../systems/waves.js';
import { playSfx, triggerHaptic } from '../core/audio.js';
import { initUltButtonRenderer, renderUltButton, setUltHero, triggerUltBurst } from '../render/ultButtonRenderer.js';

let _cachedSkillContainer = null;
let _cachedSkillMask = null;
let _cachedSkillText = null;
let _cachedSkillRing = null;
let _lastSkillReady = null;
let _lastSkillDeg = -1;
let _lastSkillOffset = -1;
let _lastSkillTextStr = null;

const SKILL_RING_CIRCUMFERENCE = 166.5;

export function initSkillUI(onSkillTrigger = triggerHeroSkill) {
  initUltButtonRenderer();
  const skillContainer = document.getElementById('skill-btn-container');
  if (!skillContainer) return;

  const handleTrigger = (e) => {
    e.stopPropagation();
    if (matchIntro && matchIntro.active) return;
    if (player && player.skillCd <= 0) {
      triggerUltBurst(_lastHeroKey || selectedHeroKey);
    }
    if (typeof onSkillTrigger === 'function') onSkillTrigger({ ignoreCursor: true });
  };

  skillContainer.addEventListener('touchstart', e => {
    e.preventDefault();
    handleTrigger(e);
  }, { passive: false });

  skillContainer.addEventListener('click', e => {
    handleTrigger(e);
  });
}

export function updateSkillUI() {
  if (typeof document !== 'undefined' && document.body && document.body.classList.contains('boss-defeat-cinematic')) {
    return;
  }

  if (!_cachedSkillContainer) {
    _cachedSkillContainer = document.getElementById('skill-btn-container');
    _cachedSkillMask = document.getElementById('skill-cooldown-mask');
    _cachedSkillText = document.getElementById('skill-timer-text');
    _cachedSkillRing = document.getElementById('skill-progress-ring');
  }

  if (!_cachedSkillContainer || !_cachedSkillMask || !_cachedSkillText) return;

  // Renderiza os efeitos dinâmicos procedurais a 60 FPS no Micro-Canvas da ULT
  renderUltButton(player, frameCount);

  const isReady = player.skillCd <= 0;
  if (isReady) {
    if (_lastSkillReady !== true) {
      _lastSkillReady = true;
      _lastSkillDeg = 0;
      _lastSkillOffset = 0;
      _lastSkillTextStr = '';
      _cachedSkillMask.style.display = 'none';
      _cachedSkillText.innerText = '';
      if (_cachedSkillRing) _cachedSkillRing.style.strokeDashoffset = '0';
      _cachedSkillContainer.classList.add('ready');

      // Feedback acústico e haptics personalizados por herói
      const activeKey = _lastHeroKey || selectedHeroKey || 'KNIGHT';
      const profile = (CHARACTER_PROFILES && CHARACTER_PROFILES[activeKey]) || CHARACTER_PROFILES.KNIGHT;
      const readySfx = (profile && profile.ultProfile && profile.ultProfile.readySfx) ? profile.ultProfile.readySfx : 'holy_ready';
      const hapticType = (profile && profile.ultProfile && profile.ultProfile.haptic) ? profile.ultProfile.haptic : 'medium';

      try {
        playSfx(readySfx);
        triggerHaptic(hapticType);
      } catch (_) {}
    }
  } else {
    if (_lastSkillReady !== false) {
      _lastSkillReady = false;
      _cachedSkillMask.style.display = 'block';
      _cachedSkillContainer.classList.remove('ready');
    }
    const ratio = Math.max(0, Math.min(1, player.skillCd / player.skillMaxCd));

    // Anel SVG Circular de Energia (carrega no sentido horário até fechar o círculo)
    const offset = (ratio * SKILL_RING_CIRCUMFERENCE).toFixed(1);
    if (offset !== _lastSkillOffset) {
      _lastSkillOffset = offset;
      if (_cachedSkillRing) _cachedSkillRing.style.strokeDashoffset = offset;
    }

    const deg = Math.floor(ratio * 360);
    if (deg !== _lastSkillDeg) {
      _lastSkillDeg = deg;
      _cachedSkillMask.style.setProperty('--skill-deg', deg + 'deg');
    }
    const textStr = (player.skillCd / 60).toFixed(1) + 's';
    if (textStr !== _lastSkillTextStr) {
      _lastSkillTextStr = textStr;
      _cachedSkillText.innerText = textStr;
    }
  }
}


// Cache de nós estáticos do DOM para eliminar chamadas a document.getElementById e evitar Layout Thrashing
var hudDom = {
  hpVal: null,
  hpMaxVal: null,
  hpFill: null,
  hpGhostFill: null,
  hpPctVal: null,
  hpContainer: null,
  lvlVal: null,
  killsVal: null,
  xpVal: null,
  xpNextVal: null,
  xpFill: null,
  xpPctVal: null,
  goldVal: null,
  waveBanner: null,
  bossHud: null,
  bossHpGhostFill: null,
  bossHpFill: null,
  bossHpVal: null,
  timerVal: null,
  hudHeroCrest: null,
  hudHeroEmblem: null,
  hudHeroTitle: null,
  skillEmblemWrap: null,
  skillBtnContainer: null,
  hudRoot: null
};

export function ensureHudElementsCached() {
  if (!hudDom) {
    hudDom = {};
  }
  if (!hudDom.hpVal) {
    hudDom.hpVal = document.getElementById('hp-val');
    hudDom.hpMaxVal = document.getElementById('hp-max-val');
    hudDom.hpFill = document.getElementById('hp-fill');
    hudDom.hpGhostFill = document.getElementById('hp-ghost-fill');
    hudDom.hpPctVal = document.getElementById('hp-pct-val');
    hudDom.hpContainer = document.getElementById('hp-container');
    hudDom.lvlVal = document.getElementById('lvl-val');
    hudDom.killsVal = document.getElementById('kills-val');
    hudDom.xpVal = document.getElementById('xp-val');
    hudDom.xpNextVal = document.getElementById('xp-next-val');
    hudDom.xpFill = document.getElementById('xp-fill');
    hudDom.xpPctVal = document.getElementById('xp-pct-val');
    hudDom.goldVal = document.getElementById('gold-val');
    hudDom.waveBanner = document.getElementById('wave-banner');
    hudDom.bossHud = document.getElementById('boss-hud');
    hudDom.bossHpGhostFill = document.getElementById('boss-hp-ghost-fill');
    hudDom.bossHpFill = document.getElementById('boss-hp-fill');
    hudDom.bossHpVal = document.getElementById('boss-hp-val');
    hudDom.bossHpRaw = document.getElementById('boss-hp-raw');
    hudDom.bossPipNotches = Array.from(document.querySelectorAll('#boss-hud .boss-pip-notch'), element => ({
      element,
      threshold: Number(element.getAttribute('data-phase-pct') || 0)
    }));
    hudDom.timerVal = document.getElementById('timer-val');
    hudDom.bossTimerVal = document.getElementById('boss-timer-val');
    hudDom.bossTimerBadge = document.querySelector('.boss-timer-badge');
    hudDom.hudHeroCrest = document.getElementById('hud-hero-crest');
    hudDom.hudHeroEmblem = document.getElementById('hud-hero-emblem');
    hudDom.hudHeroTitle = document.getElementById('hud-hero-title');
    hudDom.skillEmblemWrap = document.getElementById('skill-emblem-wrap');
    hudDom.skillBtnContainer = document.getElementById('skill-btn-container');
    hudDom.waveCard = document.getElementById('hud-wave-card');
    hudDom.hudRoot = document.getElementById('hud');
  }
}

// Estados cacheados para Dirty Checking no loop principal
var _lastHeroKey = null;
var _lastHp = -1;
var _lastMaxHp = -1;
var _lastHpPct = -1;
let _lastGhostHp = -1;
let _lastLvl = -1;
let _lastKills = -1;
let _lastXp = -1;
let _lastNextXp = -1;
let _lastXpPct = -1;
let _lastGold = -1;
let _lastWaveBannerText = '';
let _lastWaveCardSuppressed = null;
let _lastBossHpPct = -1;
let _lastBossEnraged = null;
let _lastTimerStr = '';
let _lastTimerSeconds = null;
let _lastBossTimerRemaining = null;

let ghostHp = 120;
let ghostHpTimer = 0;

let bossGhostHp = 0;
let bossGhostHpTimer = 0;
let _lastBossGhostHp = -1;
let _lastBossActualHp = -1;
let _lastBossRawHpText = '';
let _lastBossRawHp = -1;
let _lastBossRawMaxHp = -1;
let _lastBossMaxHpText = '';
let _hitShakeTimer = null;
let _lastBossActive = false;

export function resetBossGhostHp() {
  bossGhostHp = 0;
  bossGhostHpTimer = 0;
  _lastBossGhostHp = 0;
  _lastBossHpPct = -1;
  _lastBossEnraged = null;
  _lastBossActualHp = -1;
  _lastBossRawHpText = '';
  _lastBossRawHp = -1;
  _lastBossRawMaxHp = -1;
  _lastBossMaxHpText = '';
  _lastBossActive = false;
  if (_hitShakeTimer) {
    clearTimeout(_hitShakeTimer);
    _hitShakeTimer = null;
  }
  if (hudDom && hudDom.bossHud) {
    hudDom.bossHud.classList.remove('hit-shake', 'hit-flash', 'enraged');
    hudDom.bossHud.style.display = 'none';
  }
  if (hudDom && hudDom.hudRoot) {
    hudDom.hudRoot.classList.remove('boss-active');
  }
}

export function applyHeroVisuals(heroKey) {
  ensureHudElementsCached();
  let activeKey = heroKey;
  if (!activeKey) {
    try {
      activeKey = selectedHeroKey;
    } catch (_) {
      activeKey = 'KNIGHT';
    }
  }
  if (!activeKey) activeKey = 'KNIGHT';
  _lastHeroKey = activeKey;
  const heroEmblems = (typeof HERO_EMBLEMS_SVG !== 'undefined' && HERO_EMBLEMS_SVG) ? HERO_EMBLEMS_SVG : {};
  const heroProfiles = (typeof CHARACTER_PROFILES !== 'undefined' && CHARACTER_PROFILES) ? CHARACTER_PROFILES : {};
  const characters = (typeof CHARACTERS !== 'undefined' && CHARACTERS) ? CHARACTERS : {};

  const heroEmblemSvg = heroEmblems[activeKey] || heroEmblems.KNIGHT || '';
  const heroProfile = heroProfiles[activeKey] || heroProfiles.KNIGHT || { themeColor: '#f1c40f' };
  const heroChar = characters[activeKey] || characters.KNIGHT || { title: 'O SOBREVIVENTE' };

  const crestEl = hudDom.hudHeroEmblem || document.getElementById('hud-hero-emblem');
  if (crestEl) {
    crestEl.innerHTML = heroEmblemSvg;
  }
  const titleEl = hudDom.hudHeroTitle || document.getElementById('hud-hero-title');
  if (titleEl) {
    titleEl.innerText = (heroChar.title || 'O SOBREVIVENTE').toUpperCase();
  }
  const emblemWrap = hudDom.skillEmblemWrap || document.getElementById('skill-emblem-wrap');
  if (emblemWrap) {
    emblemWrap.innerHTML = heroEmblemSvg;
  }

  // Atualização dinâmica do Chassis SVG exclusivo da ULT
  const ultChassisSvg = heroProfile.chassisSvg || (HERO_ULT_CHASSIS_SVG && (HERO_ULT_CHASSIS_SVG[activeKey] || HERO_ULT_CHASSIS_SVG.KNIGHT));
  const chassisSlot = document.getElementById('skill-chassis-slot');
  if (chassisSlot && ultChassisSvg) {
    chassisSlot.innerHTML = ultChassisSvg;
    _cachedSkillRing = document.getElementById('skill-progress-ring');
  }

  const skillBtn = hudDom.skillBtnContainer || document.getElementById('skill-btn-container');
  if (skillBtn) {
    skillBtn.classList.remove('hero-knight', 'hero-mage', 'hero-rogue', 'hero-barbarian', 'hero-alchemist');
    const heroCssClass = (heroProfile.ultProfile && heroProfile.ultProfile.cssClass) || ('hero-' + activeKey.toLowerCase());
    skillBtn.classList.add(heroCssClass);
    skillBtn.style.setProperty('--skill-theme-color', heroProfile.themeColor);
  }

  const keyBadge = document.getElementById('skill-key-badge');
  if (keyBadge && heroProfile.ultProfile && heroProfile.ultProfile.keyBadge) {
    keyBadge.innerText = heroProfile.ultProfile.keyBadge;
  }

  // Notifica o renderizador procedural de ULT sobre a troca de herói
  setUltHero(activeKey);

  const hudRoot = hudDom.hudRoot || document.getElementById('hud');
  if (hudRoot) {
    hudRoot.style.setProperty('--hero-theme-color', heroProfile.themeColor);
  }
}

export function syncHudHero() {
  applyHeroVisuals();
}

export function resetHUD(initialHp = 120) {
  ghostHp = initialHp;
  ghostHpTimer = 0;
  resetBossGhostHp();

  _lastHp = -1;
  _lastMaxHp = -1;
  _lastHpPct = -1;
  _lastGhostHp = -1;
  _lastLvl = -1;
  _lastKills = -1;
  _lastXp = -1;
  _lastNextXp = -1;
  _lastXpPct = -1;
  _lastGold = -1;
  _lastWaveBannerText = '';
  _lastWaveCardSuppressed = null;
  _lastBossHpPct = -1;
  _lastBossEnraged = null;
  _lastTimerStr = '';
  _lastTimerSeconds = null;
  _lastBossTimerRemaining = null;
  _lastHeroKey = null;

  if (hudDom && hudDom.waveCard) {
    hudDom.waveCard.classList.remove('banner-suppressed');
  }

  applyHeroVisuals();
}

export function startPlayerHpDepletion() {
  ensureHudElementsCached();
  if (player) {
    player.hp = 0;
  }
  _lastHp = 0;
  _lastHpPct = 0;
  if (hudDom.hpVal) hudDom.hpVal.innerText = '0';
  if (hudDom.hpPctVal) hudDom.hpPctVal.innerText = '0%';
  if (hudDom.hpFill) hudDom.hpFill.style.width = '0%';
  if (hudDom.hpContainer) {
    hudDom.hpContainer.classList.remove('critical', 'hp-micro-shake');
    requestAnimationFrame(() => {
      if (hudDom.hpContainer) {
        hudDom.hpContainer.classList.add('hp-micro-shake');
      }
    });
  }
  if (ghostHp <= 0 && player && player.maxHp > 0) {
    ghostHp = player.maxHp;
  }
  ghostHpTimer = 0;
}

export function snapPlayerHpToZero() {
  ghostHp = 0;
  ghostHpTimer = 0;
  _lastHp = 0;
  _lastGhostHp = 0;
  _lastHpPct = 0;
  ensureHudElementsCached();
  if (hudDom.hpVal) hudDom.hpVal.innerText = '0';
  if (hudDom.hpPctVal) hudDom.hpPctVal.innerText = '0%';
  if (hudDom.hpFill) hudDom.hpFill.style.width = '0%';
  if (hudDom.hpGhostFill) hudDom.hpGhostFill.style.width = '0%';
  if (hudDom.hpContainer) {
    hudDom.hpContainer.classList.remove('critical');
  }
}

export function isGhostHpDraining() {
  return ghostHp > 0;
}

export function updateHUD(dt, { gameState, activeBoss, currentArenaTheme, seconds, currentWave }) {
  if (typeof document !== 'undefined' && document.body && document.body.classList.contains('boss-defeat-cinematic')) {
    return;
  }

  // Atualização Visual do HUD de HP com Decaimento da Barra Fantasma (Ghost Bar)
  const targetHp = Math.max(0, player.hp);
  if (targetHp < ghostHp) {
    ghostHpTimer += dt;
    const isFatal = targetHp <= 0 || (deathSequence && deathSequence.active) || (gameState && gameState.isDead);
    const delayThreshold = isFatal ? 12 : 20;
    if (ghostHpTimer > delayThreshold) {
      const drainSpeed = isFatal 
        ? Math.max(2.5, ((player.maxHp || 120) / 40)) * dt 
        : 1.8 * dt;
      ghostHp = Math.max(0, ghostHp - drainSpeed);
    }
  } else {
    ghostHp = targetHp;
    ghostHpTimer = 0;
  }

  ensureHudElementsCached();

  // Sincronização Dinâmica do Herói (Brasão no HUD + Ícone Específico de ULT)
  let currentHero = 'KNIGHT';
  try {
    currentHero = selectedHeroKey || 'KNIGHT';
  } catch (_) {
    currentHero = _lastHeroKey || 'KNIGHT';
  }
  if (currentHero !== _lastHeroKey) {
    applyHeroVisuals(currentHero);
  }

  // Dirty Checking do HUD de Vida
  const currentHp = Math.max(0, Math.ceil(player.hp));
  if (currentHp !== _lastHp) {
    if (currentHp < _lastHp && _lastHp > 0 && hudDom.hpContainer) {
      hudDom.hpContainer.classList.remove('hp-micro-shake');
      requestAnimationFrame(() => {
        if (hudDom.hpContainer) {
          hudDom.hpContainer.classList.add('hp-micro-shake');
        }
      });
    }
    _lastHp = currentHp;
    if (hudDom.hpVal) hudDom.hpVal.innerText = currentHp;
  }

  if (player.maxHp !== _lastMaxHp) {
    _lastMaxHp = player.maxHp;
    if (hudDom.hpMaxVal) hudDom.hpMaxVal.innerText = player.maxHp;
  }

  const hpPct = Math.max(0, Math.min(100, Math.round((currentHp / player.maxHp) * 100)));
  if (hpPct !== _lastHpPct || (currentHp === 0 && hudDom.hpFill && hudDom.hpFill.style.width !== '0%')) {
    _lastHpPct = hpPct;
    if (hudDom.hpPctVal) hudDom.hpPctVal.innerText = `${hpPct}%`;
    if (hudDom.hpFill) hudDom.hpFill.style.width = currentHp <= 0 ? '0%' : `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
    if (hudDom.hpContainer) {
      if (hpPct <= 30 && player.hp > 0) {
        hudDom.hpContainer.classList.add('critical');
      } else {
        hudDom.hpContainer.classList.remove('critical');
      }
    }
  }

  const targetGhostHp = Math.max(0, ghostHp);
  const roundedGhostHp = Math.round(targetGhostHp);
  if (roundedGhostHp !== _lastGhostHp || (targetGhostHp === 0 && _lastGhostHp !== 0)) {
    _lastGhostHp = roundedGhostHp;
    if (hudDom.hpGhostFill) {
      hudDom.hpGhostFill.style.width = targetGhostHp <= 0 ? '0%' : `${Math.max(0, (targetGhostHp / player.maxHp) * 100)}%`;
    }
  }
  if (targetGhostHp <= 0 && hudDom.hpGhostFill && hudDom.hpGhostFill.style.width !== '0%') {
    hudDom.hpGhostFill.style.width = '0%';
  }

  // Dirty Checking de Nível, Kills e Progressão de XP
  if (player.level !== _lastLvl) {
    _lastLvl = player.level;
    if (hudDom.lvlVal) hudDom.lvlVal.innerText = player.level;
  }

  if (gameState.kills !== _lastKills) {
    _lastKills = gameState.kills;
    if (hudDom.killsVal) hudDom.killsVal.innerText = gameState.kills;
  }

  const curXp = Math.floor(player.xp);
  if (curXp !== _lastXp) {
    _lastXp = curXp;
    if (hudDom.xpVal) hudDom.xpVal.innerText = curXp;
  }

  if (player.nextXp !== _lastNextXp) {
    _lastNextXp = player.nextXp;
    if (hudDom.xpNextVal) hudDom.xpNextVal.innerText = player.nextXp;
  }

  const xpPct = Math.min(100, Math.round((player.xp / player.nextXp) * 100));
  if (xpPct !== _lastXpPct) {
    _lastXpPct = xpPct;
    if (hudDom.xpPctVal) hudDom.xpPctVal.innerText = `${xpPct}%`;
    if (hudDom.xpFill) hudDom.xpFill.style.width = `${Math.min(100, (player.xp / player.nextXp) * 100)}%`;
  }

  const currentPersistentGold = getPersistentGold();
  if (currentPersistentGold !== _lastGold) {
    _lastGold = currentPersistentGold;
    if (hudDom.goldVal) hudDom.goldVal.innerText = currentPersistentGold;
  }
  
  let targetWaveBannerText = '';
  if (gameState.isWavePaused && !activeBoss) {
    targetWaveBannerText = "ABRA O BAÚ PARA CONTINUAR!";
  } else if (activeBoss) {
    const arenaName = ARENA_PALETTES[currentArenaTheme]?.name || '';
    targetWaveBannerText = `${activeBoss.name} • ${arenaName}`;
  } else {
    const arenaName = ARENA_PALETTES[currentArenaTheme]?.name;
    targetWaveBannerText = arenaName ? `${currentWave.name} • ${arenaName}` : (currentWave?.name || '');
  }

  if (targetWaveBannerText !== _lastWaveBannerText) {
    _lastWaveBannerText = targetWaveBannerText;
    if (hudDom.waveBanner) hudDom.waveBanner.innerText = targetWaveBannerText;
  }

  // Sincronização coordenada do retângulo do HUD com o banner de entrada da horda:
  // 1. 1 segundo antes de o banner começar: inicia fade out suave
  // 2. Durante toda a exibição do banner (fade in, permanência e fade out): permanece oculto
  // 3. Assim que o banner terminar o fade out: inicia fade in suave de retorno
  let isWaveCardSuppressed = false;
  if (waveAnnouncement && waveAnnouncement.timer > 0) {
    isWaveCardSuppressed = true;
  } else if (!activeBoss && gameState && gameState.isInMatch) {
    const exactHordeSeconds = getEffectiveHordeSeconds(frameCount / 60);
    const timeUntilNext = getTimeUntilNextWave(exactHordeSeconds);
    if (timeUntilNext <= 1.0 && timeUntilNext > 0) {
      isWaveCardSuppressed = true;
    }
  }

  if (isWaveCardSuppressed !== _lastWaveCardSuppressed) {
    _lastWaveCardSuppressed = isWaveCardSuppressed;
    if (hudDom.waveCard) {
      hudDom.waveCard.classList.toggle('banner-suppressed', isWaveCardSuppressed);
    }
  }

  updateSkillUI();

  // Alternância suave do modo de chefe no HUD
  const isBossActive = !!activeBoss;
  if (isBossActive !== _lastBossActive) {
    _lastBossActive = isBossActive;
    if (hudDom.hudRoot) {
      hudDom.hudRoot.classList.toggle('boss-active', isBossActive);
    }
    if (!isBossActive && hudDom.bossHud) {
      hudDom.bossHud.classList.remove('hit-shake', 'hit-flash', 'enraged');
      setTimeout(() => {
        if (!_lastBossActive && hudDom.bossHud) {
          hudDom.bossHud.style.display = 'none';
        }
      }, 350);
    }
  }

  if (activeBoss) {
    const bossHpPct = Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100);
    const roundedBossHpPct = Math.ceil(bossHpPct);

    // Garante que o container tenha o ID do chefe para carregar o tema visual correspondente
    if (hudDom.bossHud) {
      const bossIdStr = String(activeBoss.bossId || 1);
      if (hudDom.bossHud.getAttribute('data-boss-id') !== bossIdStr) {
        hudDom.bossHud.setAttribute('data-boss-id', bossIdStr);
      }
    }

    // Inicializa ghostHp se desatualizado ou inicial
    if (bossGhostHp <= 0 || bossGhostHp > activeBoss.maxHp) {
      bossGhostHp = activeBoss.hp;
    }

    // Reação de Impacto e Dano (Hit-Shake e Hit-Flash)
    if (_lastBossActualHp > 0 && activeBoss.hp < _lastBossActualHp - 0.5) {
      if (hudDom.bossHud) {
        hudDom.bossHud.classList.add('hit-shake', 'hit-flash');
        if (_hitShakeTimer) clearTimeout(_hitShakeTimer);
        _hitShakeTimer = setTimeout(() => {
          if (hudDom.bossHud) {
            hudDom.bossHud.classList.remove('hit-shake', 'hit-flash');
          }
        }, 150);
      }
    }
    _lastBossActualHp = activeBoss.hp;

    // Atualiza leitura de HP numérico detalhado
    if (hudDom.bossHpRaw) {
      const curHp = Math.max(0, Math.ceil(activeBoss.hp));
      const maxHp = Math.ceil(activeBoss.maxHp);
      if (curHp !== _lastBossRawHp || maxHp !== _lastBossRawMaxHp) {
        if (maxHp !== _lastBossRawMaxHp) {
          _lastBossMaxHpText = maxHp.toLocaleString('pt-BR');
        }
        _lastBossRawHp = curHp;
        _lastBossRawMaxHp = maxHp;
        const rawText = `${curHp.toLocaleString('pt-BR')} / ${_lastBossMaxHpText} HP`;
        if (rawText !== _lastBossRawHpText) {
          _lastBossRawHpText = rawText;
          hudDom.bossHpRaw.innerText = rawText;
        }
      }
    }

    // Atualiza estado das gemas rúnicas de fase (25%, 50%, 75%)
    if (hudDom.bossPipNotches && hudDom.bossPipNotches.length) {
      for (const { element, threshold } of hudDom.bossPipNotches) {
        const extinguished = bossHpPct < threshold;
        if (element.classList.contains('extinguished') !== extinguished) {
          element.classList.toggle('extinguished', extinguished);
        }
      }
    }

    if (activeBoss.hp < bossGhostHp) {
      bossGhostHpTimer += dt;
      if (bossGhostHpTimer > 18) {
        bossGhostHp = Math.max(activeBoss.hp, bossGhostHp - (activeBoss.maxHp * 0.015) * dt);
      }
    } else {
      bossGhostHp = activeBoss.hp;
      bossGhostHpTimer = 0;
    }

    const bossGhostHpPct = Math.max(0, (bossGhostHp / activeBoss.maxHp) * 100);

    if (bossHpPct !== _lastBossHpPct || activeBoss.isEnraged !== _lastBossEnraged) {
      _lastBossHpPct = bossHpPct;
      _lastBossEnraged = activeBoss.isEnraged;

      if (hudDom.bossHpFill) {
        hudDom.bossHpFill.style.width = `${bossHpPct}%`;
        // Deixamos os gradientes visuais serem controlados pelos seletores CSS avançados
        hudDom.bossHpFill.style.background = '';
        hudDom.bossHpFill.style.boxShadow = '';
      }
      if (hudDom.bossHud) {
        if (activeBoss.isEnraged) {
          hudDom.bossHud.classList.add('enraged');
        } else {
          hudDom.bossHud.classList.remove('enraged');
        }
      }
      if (hudDom.bossHpVal) hudDom.bossHpVal.innerText = `${roundedBossHpPct}%`;
    }

    const roundedBossGhost = Math.round(bossGhostHpPct);
    if (roundedBossGhost !== _lastBossGhostHp) {
      _lastBossGhostHp = roundedBossGhost;
      if (hudDom.bossHpGhostFill) {
        hudDom.bossHpGhostFill.style.width = `${bossGhostHpPct}%`;
      }
    }
  } else {
    if (hudDom.bossHud && hudDom.bossHud.style.display !== 'none' && !_lastBossActive) {
      hudDom.bossHud.style.display = 'none';
      _lastBossHpPct = -1;
      _lastBossGhostHp = -1;
    }
  }

  if (seconds !== _lastTimerSeconds) {
    _lastTimerSeconds = seconds;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    const currentTimerStr = `${m}:${s}`;
    if (currentTimerStr !== _lastTimerStr) {
      _lastTimerStr = currentTimerStr;
      if (hudDom.timerVal) hudDom.timerVal.innerText = currentTimerStr;
    }
  }

  if (hudDom.bossTimerVal && hudDom.bossTimerBadge) {
    if (activeBoss || currentBossIndex >= BOSS_QUEUE.length) {
      if (hudDom.bossTimerBadge.style.display !== 'none') hudDom.bossTimerBadge.style.display = 'none';
    } else {
      if (hudDom.bossTimerBadge.style.display === 'none') hudDom.bossTimerBadge.style.display = 'flex';
      const timeRemaining = Math.max(0, nextBossSpawnTime - seconds);
      if (timeRemaining !== _lastBossTimerRemaining) {
        _lastBossTimerRemaining = timeRemaining;
        const bm = String(Math.floor(timeRemaining / 60)).padStart(2, '0');
        const bs = String(timeRemaining % 60).padStart(2, '0');
        hudDom.bossTimerVal.innerText = `${bm}:${bs}`;
      }
      
      // Efeito de pulso quando faltar pouco tempo (10 segundos)
      const isUrgent = timeRemaining <= 10 && timeRemaining > 0;
      if (hudDom.bossTimerBadge.classList.contains('urgent-pulse') !== isUrgent) {
        hudDom.bossTimerBadge.classList.toggle('urgent-pulse', isUrgent);
      }
    }
  }
}
