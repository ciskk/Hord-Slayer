import { getCurrentWave, getEffectiveHordeSeconds, currentBossIndex } from '../../systems/waves.js';
import { getSavedWeaponName, getSavedPassivePresentation, getItemDefinition } from '../../i18n/contentPresentation.js';
import { getPauseEquipment } from '../pauseEquipment.js';
import { t, formatNumber } from '../../i18n/index.js';
/**
 * src/ui/modals/gameOverModal.js
 * Modais de Desfecho da Partida: Execução de Morte Intrínseca e Triunfo de Vitória.
 */
import { 
  gameState, 
  lastAttackerName, 
  deathContext,
  bossShockwaves, 
  voidVortices, 
  bossTelegraphs, 
  bossProjectiles 
} from '../../main.js';
import { bullets, enemyBullets, resetCollections } from '../../state/collections.js';
import { deathSequence, cinematicCamera, resetCameraZoom } from '../../state/gameState.js';
import { startDeathSequence } from '../../render/deathAnimation.js';
import { resetInput } from '../../core/input.js';
import { triggerHaptic, applyDeathAudioFilter, resetDeathAudioFilter, playSfx } from '../../core/audio.js';
import { recordRunStats, checkAndRecordBestRun, recordHeroRunStats } from '../../config/achievements.js';
import { BESTIARY_ENTRIES } from '../../config/bestiary.js';
import { renderIcon, WEAPON_ICONS } from '../icons.js';
import { player, getPersistentGold, addPersistentGold, selectedHeroKey } from '../../entities/player.js';
import { CHARACTERS } from '../../config/characters.js';
import { ITEMS } from '../../config/items.js';
import { openCharacterSelect, isMobileScreen } from './characterSelectModal.js';
import { startPlayerHpDepletion, snapPlayerHpToZero } from '../hudController.js';

import { evaluateVictory, victoryLedger } from './victoryResults.js';
import { frameCount } from '../../state/gameState.js';
import { autoFitElement } from '../../core/responsiveAutoFit.js';

let victorySettled = false;
let refreshVictoryPresentation = null;
let refreshDeathPresentation = null;
export function refreshResultsLanguage() {
  if (document.getElementById('death-modal')?.classList.contains('active')) refreshDeathPresentation?.();
  if (document.getElementById('victory-modal')?.classList.contains('active')) refreshVictoryPresentation?.();
}

let matchStartGold = 0;
export function markRunStartGold(gold) {
  victorySettled = false;
  matchStartGold = (typeof gold === 'number') ? gold : getPersistentGold();
}

/**
 * Animação fluida de contagem numérica ascendente para métricas da partida
 */
export function animateCountUp(element, targetValue, durationMs = 650) {
  if (!element) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.innerText = formatNumber(Number(targetValue));
    return;
  }
  const num = parseInt(targetValue, 10);
  if (isNaN(num) || num <= 0) {
    element.innerText = targetValue;
    return;
  }
  const startTime = performance.now();
  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentVal = Math.floor(easeProgress * num);
    element.innerText = formatNumber(currentVal);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.innerText = formatNumber(num);
    }
  }
  requestAnimationFrame(step);
}

/**
 * Avaliação de Desempenho e Rank da Partida (Grade System)
 */
export function calculateRunRank({ isVictory, wave, survivalSecs, kills, evolvedCount }) {
  if (isVictory) return evaluateVictory({ survivalSecs, kills, evolvedCount });
  if (wave >= 9) return { grade: 'A', title: t('match.rank.deathA'), color: '#9b59b6', stars: '★★★☆☆' };
  if (wave >= 6) return { grade: 'B', title: t('match.rank.deathB'), color: '#3498db', stars: '★★☆☆☆' };
  if (wave >= 3) return { grade: 'C', title: t('match.rank.deathC'), color: '#2ecc71', stars: '★☆☆☆☆' };
  return { grade: 'D', title: t('match.rank.deathD'), color: '#95a5a6', stars: '☆☆☆☆☆' };
}

/**
 * Vereditos Poéticos da Queda (Horror Grim Cyber-Gothic)
 */
export const DEATH_VERDICTS = Object.freeze(Array.from({ length: 81 }, (_, index) => 'match.death.verdict.' + index));

let deathKeydownHandler = null;

/**
 * Converte string 'mm:ss' em total de segundos para cálculo de score
 */
function parseTimeToSeconds(timeStr = '00:00') {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const min = parseInt(parts[0], 10) || 0;
    const sec = parseInt(parts[1], 10) || 0;
    return min * 60 + sec;
  }
  return 0;
}

/**
 * Coleta armas equipadas e passivas ativas do jogador para registro na Melhor Run
 */
function harvestPlayerRunArsenal() {
  const equipped = getPauseEquipment(player);
  const weapons = equipped.map(w => {
    const item = getItemDefinition(w.type);
    return {
      type: w.type,
      name: item?.name || w.type,
      level: w.level || 1,
      evolved: !!w.evolved,
      iconKey: WEAPON_ICONS[w.type] || 'sword'
    };
  });

  const passives = [];
  const hasPassive = id => !!player.inventory?.passives?.has(id);
  if (player.damageCardCount || player.hasPowerPassive || hasPassive('dmg')) passives.push(`Poder Bruto (+${Math.round((player.damagePercentBonus || 0) * 100)}%)`);
  if (player.armorCardCount || player.hasArmorPassive || hasPassive('armor')) passives.push(`Armadura Rúnica (+${(player.armorCardCount || 1) * 30} HP)`);
  if (player.wingsCardCount || player.hasWingsPassive || hasPassive('wings')) passives.push(`Asas do Vento (+${(player.speed || 3.2).toFixed(1)} Vel)`);
  if (player.frostCardCount || (player.slowChance || 0) > 0 || hasPassive('frost_passive')) passives.push('Golpe Criogênico');
  if (player.critCardCount || player.critChance > 0.05 || hasPassive('crit')) passives.push(`Foco Letal (${Math.round((player.critChance || 0.1) * 100)}%)`);
  if (player.hasteCardCount || (player.cooldownReduction || 0) > 0 || hasPassive('haste')) passives.push('Fúria Rápida');
  if (player.ultCooldownCount || hasPassive('ult_cooldown')) passives.push('Ímpeto Supremo');
  if (player.magnetCardCount || hasPassive('magnet')) passives.push('Ímã Titânico');

  return { weapons, passives };
}

/**
 * Mapeia ícones e conselhos táticos inteligentes com base na criatura ou perigo fatal.
 */
function resolveDeathTacticsAndIcon(killerName, category, enemyType) {
  // 1. Busca por correspondência no Códice do Bestiário
  let bestiaryEntry = null;
  if (enemyType) {
    bestiaryEntry = BESTIARY_ENTRIES.find(b => b.id === enemyType);
  }
  if (!bestiaryEntry && killerName) {
    const cleanName = killerName.replace(/\s*\(Elite\)/i, '').trim().toLowerCase();
    bestiaryEntry = BESTIARY_ENTRIES.find(b => 
      b.name.toLowerCase() === cleanName || 
      cleanName.includes(b.name.toLowerCase()) || 
      b.name.toLowerCase().includes(cleanName)
    );
  }

  let finalKillerName = killerName || t('match.death.horde');
  if (bestiaryEntry) {
    const isElite = killerName && killerName.includes('(Elite)');
    finalKillerName = isElite ? `${bestiaryEntry.name} (Elite)` : bestiaryEntry.name;
  }

  const killerTitle = bestiaryEntry ? bestiaryEntry.title : (category === 'BOSS' ? t('match.death.sovereign') : (category === 'MINIBOSS' ? t('match.death.terror') : t('match.death.spawn')));
  const killerColor = bestiaryEntry?.color || (category === 'BOSS' ? '#8e44ad' : (category === 'MINIBOSS' ? '#e67e22' : '#ff4757'));

  let tacticText = '';
  let threatLabel = t('match.death.high');
  let categoryLabel = t('match.death.abomination');
  let iconSvg = '';

  if (bestiaryEntry) {
    tacticText = bestiaryEntry.tactics;
    threatLabel = t('match.death.threat', { number: bestiaryEntry.threat || 3 });
    if (bestiaryEntry.category === 'BOSS') {
      categoryLabel = t('match.death.boss');
      iconSvg = renderIcon('boss_crown', { size: 30, color: '#ffd166' });
    } else if (bestiaryEntry.category === 'MINIBOSS') {
      categoryLabel = t('match.death.mini');
      iconSvg = renderIcon('skull', { size: 28, color: '#e67e22' });
    } else {
      categoryLabel = t('match.death.abomination');
      if (bestiaryEntry.id === 'BAT') {
        iconSvg = `<svg class="killer-glyph" viewBox="0 0 24 24" style="color:${killerColor};"><path fill="currentColor" d="M12 4c-1.5 2-4 3-7 3-1.5 0-3-.5-4-1 0 5 3 9 7 9 1 0 2-.5 3-1 1 .5 2 1 3 1 4 0 7-4 7-9-1 .5-2.5 1-4 1-3 0-5.5-1-7-3zm-2 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>`;
      } else if (bestiaryEntry.id === 'GOLEM') {
        iconSvg = `<svg class="killer-glyph" viewBox="0 0 24 24" style="color:${killerColor};"><path fill="currentColor" d="M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 4l-5 3.5L8 8V6l5 3.5L18 6v2zm-6 9c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/></svg>`;
      } else if (bestiaryEntry.id === 'EXPLODER') {
        iconSvg = `<svg class="killer-glyph" viewBox="0 0 24 24" style="color:${killerColor};"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>`;
      } else if (bestiaryEntry.id === 'SHOOTER' || bestiaryEntry.id === 'SNIPER_CULTIST') {
        iconSvg = `<svg class="killer-glyph" viewBox="0 0 24 24" style="color:${killerColor};"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/><line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" stroke-width="2"/><line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" stroke-width="2"/><line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" stroke-width="2"/><line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2"/></svg>`;
      } else if (bestiaryEntry.id === 'SHIELDED' || bestiaryEntry.id === 'PHALANX_LEADER') {
        iconSvg = `<svg class="killer-glyph" viewBox="0 0 24 24" style="color:${killerColor};"><path fill="currentColor" d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>`;
      } else {
        iconSvg = renderIcon('skull', { size: 28, color: killerColor });
      }
    }
  } else {
    // 2. Conselhos de Sobrevivência Contextuais para Perigos e Golpes Especiais
    switch (category) {
      case 'BOSS':
        categoryLabel = t('match.death.boss');
        threatLabel = t('match.death.apocalypse');
        iconSvg = renderIcon('boss_crown', { size: 30, color: '#ffd166' });
        tacticText = t('match.death.tipBoss');
        break;

      case 'MINIBOSS':
        categoryLabel = t('match.death.mini');
        threatLabel = t('match.death.devastating');
        iconSvg = renderIcon('skull', { size: 28, color: '#e67e22' });
        tacticText = t('match.death.tipMini');
        break;

      case 'PROJECTILE':
        categoryLabel = t('match.death.projectile');
        threatLabel = t('match.death.ranged');
        iconSvg = `<svg class="killer-glyph" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#9b59b6" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="#9b59b6"/><line x1="12" y1="2" x2="12" y2="6" stroke="#9b59b6" stroke-width="2"/><line x1="12" y1="18" x2="12" y2="22" stroke="#9b59b6" stroke-width="2"/></svg>`;
        tacticText = t('match.death.tipProjectile');
        break;

      case 'HAZARD':
        categoryLabel = t('match.death.hazard');
        threatLabel = t('match.death.dot');
        iconSvg = `<svg class="killer-glyph" viewBox="0 0 24 24"><path fill="#e74c3c" d="M12 2L1 21h22L12 2zm0 4l7.5 13h-15L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>`;
        tacticText = t('match.death.tipHazard');
        break;

      default:
        categoryLabel = t('match.death.abomination');
        threatLabel = t('match.death.swarm');
        iconSvg = renderIcon('skull', { size: 28, color: '#ff4757' });
        tacticText = t('match.death.tipHorde');
        break;
    }
  }

  return { tacticText, threatLabel, categoryLabel, iconSvg, killerTitle, killerColor, finalKillerName };
}

let pendingDeathPayload = null;
let deathCountUpTimeout = null;

/**
 * Gatilho da Morte Intrínseca com Sequência Dramática e Zoom
 */
export function triggerDeath() {
  if ((deathSequence && deathSequence.active) || gameState.isDead) return;

  if (player) {
    player.hp = 0;
  }
  startPlayerHpDepletion();

  const pauseModal = document.getElementById('pause-modal');
  if (pauseModal) {
    pauseModal.classList.remove('active', 'closing');
    pauseModal.style.display = 'none';
  }
  const canvasElem = document.getElementById('game-canvas');
  if (canvasElem) canvasElem.classList.remove('canvas-stasis-frozen');
  resetInput();
  applyDeathAudioFilter();

  // Snapshot do algoz e do ataque letal no momento exato do impacto fatal
  pendingDeathPayload = {
    killerName: (deathContext && deathContext.name) ? deathContext.name : (lastAttackerName || t('match.death.horde')),
    killerCategory: (deathContext && deathContext.category) ? deathContext.category : 'HORDE',
    killerAttack: (deathContext && deathContext.attackName) ? deathContext.attackName : t('match.death.melee'),
    lethalDmg: (deathContext && deathContext.damage > 0) ? `-${deathContext.damage} Dano` : t('match.death.fatal'),
    enemyType: deathContext ? deathContext.enemyType : null,
    tacticTip: (deathContext && deathContext.tacticTip) ? deathContext.tacticTip : ''
  };

  // Dispara a sequência cinematográfica dramática (zoom, queda, evaporação e Nova)
  startDeathSequence(() => {
    openDeathModalReal();
  });
}

/**
 * Abertura e apresentação final do modal de Game Over
 */
export function openDeathModalReal() {
  gameState.isDead = true;
  snapPlayerHpToZero();

  // 1. Congelamento e Desfoque Cinemático da Arena
  const gameCanvas = document.getElementById('game-canvas');
  if (gameCanvas) {
    gameCanvas.classList.add('canvas-death-frozen');
  }

  // 2. Vinheta Vermelha Necrótica de Fundo
  const bloodFilter = document.getElementById('blood-screen-filter');
  if (bloodFilter) {
    bloodFilter.classList.add('active');
  }

  // 3. Sorteio Dinâmico do Veredito
  const verdictKey = DEATH_VERDICTS[Math.floor(Math.random() * DEATH_VERDICTS.length)];
  const randomVerdict = t(verdictKey);
  const survivalSeconds = Math.max(0, Math.floor(frameCount / 60));
  const survivalTime = String(Math.floor(survivalSeconds / 60)).padStart(2, '0') + ':' + String(survivalSeconds % 60).padStart(2, '0');
  const currentWaveNum = getCurrentWave(getEffectiveHordeSeconds(survivalSeconds)).index;


  // 4. Resolução da Causa Mortis (O Algoz e Golpe Fatal)
  const killerName = pendingDeathPayload ? pendingDeathPayload.killerName : ((deathContext && deathContext.name) ? deathContext.name : (lastAttackerName || t('match.death.horde')));
  const killerCategory = pendingDeathPayload ? pendingDeathPayload.killerCategory : ((deathContext && deathContext.category) ? deathContext.category : 'HORDE');
  const killerAttack = pendingDeathPayload ? pendingDeathPayload.killerAttack : ((deathContext && deathContext.attackName) ? deathContext.attackName : t('match.death.melee'));
  const lethalDmg = pendingDeathPayload ? pendingDeathPayload.lethalDmg : ((deathContext && deathContext.damage > 0) ? `-${deathContext.damage} Dano` : t('match.death.fatal'));
  const enemyType = pendingDeathPayload ? pendingDeathPayload.enemyType : (deathContext ? deathContext.enemyType : null);

  const renderDeathDetails = () => {
    const titleElem = document.getElementById('death-verdict-title');
    if (titleElem) {
      titleElem.innerText = t(verdictKey);
    }

    const { tacticText, threatLabel, categoryLabel, iconSvg, killerTitle, killerColor, finalKillerName } = resolveDeathTacticsAndIcon(killerName, killerCategory, enemyType);

  const emblemElem = document.getElementById('death-killer-emblem');
  if (emblemElem && iconSvg) {
    emblemElem.innerHTML = iconSvg;
    if (killerColor) {
      emblemElem.style.borderColor = killerColor;
      emblemElem.style.boxShadow = `inset 0 0 15px rgba(0, 0, 0, 0.9), 0 0 18px ${killerColor}40`;
    }
  }

  const categoryBadge = document.getElementById('death-category-badge');
  if (categoryBadge) {
    categoryBadge.innerText = categoryLabel;
  }

  const threatIndicator = document.getElementById('death-threat-indicator');
  if (threatIndicator) {
    threatIndicator.innerHTML = `${renderIcon('warning', { size: 13, color: '#f39c12', style: 'vertical-align:-2px;margin-right:4px;' })} ${threatLabel}`;
  }

  const killerNameElem = document.getElementById('death-killer-name');
  if (killerNameElem) {
    killerNameElem.innerText = finalKillerName || killerName;
  }

  const killerTitleElem = document.getElementById('death-killer-title');
  if (killerTitleElem) {
    killerTitleElem.innerText = killerTitle || '';
    killerTitleElem.style.display = killerTitle ? 'block' : 'none';
  }

  const attackNameElem = document.getElementById('death-attack-name');
  if (attackNameElem) {
    attackNameElem.innerText = killerAttack;
  }

  const lethalDamageElem = document.getElementById('death-lethal-damage');
  if (lethalDamageElem) {
    const maxHp = (player && player.maxHp) ? player.maxHp : 100;
    const rawDmgMatch = String(lethalDmg).match(/\d+/);
    const dmgVal = rawDmgMatch ? parseInt(rawDmgMatch[0], 10) : 0;
    let formattedDmg = lethalDmg;
    if (dmgVal > 0) {
      const pct = Math.min(100, Math.round((dmgVal / maxHp) * 100));
      formattedDmg = t('match.death.damage', { amount: dmgVal, percent: pct });
    }
    lethalDamageElem.innerText = formattedDmg;
  }

  const tacticDescElem = document.getElementById('death-tactic-text');
  if (tacticDescElem) {
    tacticDescElem.innerText = (pendingDeathPayload && pendingDeathPayload.tacticTip) || (deathContext && deathContext.tacticTip) || tacticText;
  }

  // 5. Estatísticas da Partida (Biometria em Badges Transparentes)
  const waveText = t('wave.title', { number: currentWaveNum });
  const metricsStream = document.getElementById('death-metrics-stream');
  if (metricsStream) {
    metricsStream.innerHTML = `
      <div class="death-metric-pill">
        <div class="death-pill-header">
          <svg class="death-pill-icon" viewBox="0 0 24 24" style="color:#ffd166;"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          <span class="death-pill-label">${t('match.results.survival')}</span>
        </div>
        <span class="death-pill-value">${survivalTime}</span>
      </div>

      <div class="death-metric-pill">
        <div class="death-pill-header">
          ${renderIcon('wave_swords', { size: 12, color: '#f1c40f' })}
          <span class="death-pill-label">${t('match.results.horde')}</span>
        </div>
        <span class="death-pill-value">${waveText}</span>
      </div>

      <div class="death-metric-pill">
        <div class="death-pill-header">
          ${renderIcon('skull', { size: 12, color: '#ff4757' })}
          <span class="death-pill-label">${t('match.results.kills')}</span>
        </div>
        <span class="death-pill-value highlight-crimson" id="death-kills-val">0</span>
      </div>

      <div class="death-metric-pill">
        <div class="death-pill-header">
          ${renderIcon('sparkle', { size: 12, color: '#f1c40f' })}
          <span class="death-pill-label">${t('match.results.power')}</span>
        </div>
        <span class="death-pill-value">${t('match.common.level', { number: player.level })}</span>
      </div>

      <div class="death-metric-pill">
        <div class="death-pill-header">
          ${renderIcon('gold', { size: 12, color: '#f1c40f' })}
          <span class="death-pill-label">${t('match.results.souls')}</span>
        </div>
        <span class="death-pill-value highlight-gold" id="death-souls-val">0</span>
      </div>
    `;
  }

  };
  const waveText = t('wave.title', { number: currentWaveNum });
  // 6. Conquistas Desbloqueadas e Registro de Melhor Run nesta Jornada
  const currentHeroDef = CHARACTERS[selectedHeroKey] || CHARACTERS.KNIGHT;
  const { weapons: playerWeapons, passives: playerPassives } = harvestPlayerRunArsenal();
  const survivalSecs = parseTimeToSeconds(survivalTime);
  const evolvedCount = playerWeapons.filter(w => w.evolved).length;

  const newlyUnlocked = recordRunStats({
    kills: gameState.kills,
    survivalSeconds: survivalSecs,
    level: player.level,
    wave: currentWaveNum,
    evolvedWeaponsCount: evolvedCount,
    runFinished: true
  });

  // Gravação individual do herói selecionado
  recordHeroRunStats(selectedHeroKey, {
    seconds: survivalSecs,
    timeStr: survivalTime,
    kills: gameState.kills,
    isVictory: false
  });

  // Avaliação e gravação da Melhor Run
  const recordResult = checkAndRecordBestRun({
    heroKey: selectedHeroKey,
    heroName: currentHeroDef.name || 'Sir Roland',
    heroTitle: currentHeroDef.title || 'O Paladino',
    isVictory: false,
    wave: currentWaveNum,
    highestWave: currentWaveNum,
    waveText: waveText || `Onda ${currentWaveNum}`,
    time: survivalTime,
    timeStr: survivalTime,
    seconds: survivalSecs,
    kills: gameState.kills,
    level: player.level,
    souls: Math.max(0, getPersistentGold() - matchStartGold),
    weapons: playerWeapons,
    passives: playerPassives,
    bossesDefeated: Array.from({ length: currentBossIndex }, (_, i) => i + 1),
    verdictTitle: `ÚLTIMO SUSPIRO NA ONDA ${currentWaveNum}`,
    verdictSub: killerName ? `Caiu perante ${killerName}` : randomVerdict
  });

  if (recordResult && recordResult.bestRun) {
    recordRunStats({ score: recordResult.bestRun.score });
  }

  const renderDeathArsenal = () => {
  // 6.5. Arsenal Resumido da Partida (Linha Compacta de Armas & Evoluções)
  const arsenalContainer = document.getElementById('death-arsenal-container');
  const arsenalStrip = document.getElementById('death-arsenal-strip');
  if (arsenalContainer && arsenalStrip) {
    if (playerWeapons && playerWeapons.length > 0) {
      arsenalStrip.innerHTML = playerWeapons.map(w => `
        <div class="death-arsenal-pill ${w.evolved ? 'is-evolved' : ''}" title="${getSavedWeaponName(w)} (${w.evolved ? t('match.results.evolved') : t('match.common.level', { number: w.level })})">
          ${renderIcon(w.iconKey || 'sword', { size: 13, color: w.evolved ? '#ffd166' : '#ecf0f1' })}
          <span class="death-arsenal-pill-name">${getSavedWeaponName(w)}</span>
          <span class="death-arsenal-pill-lvl">${w.evolved ? '★' : t('match.common.level', { number: w.level })}</span>
        </div>
      `).join('');
      arsenalContainer.style.display = 'flex';
    } else {
      arsenalContainer.style.display = 'none';
    }
  }

  const achContainer = document.getElementById('death-achievements-container');
  if (achContainer) {
    let html = '';
    if (recordResult && recordResult.isNewRecord) {
      html += `
        <div class="death-ach-card" style="border-color: rgba(241, 196, 15, 0.6); background: linear-gradient(135deg, rgba(35, 26, 15, 0.95) 0%, rgba(18, 14, 10, 0.98) 100%);">
          <div class="death-ach-header" style="color: #ffd166;">
            ${renderIcon('boss_crown', { size: 12, color: '#ffd166' })} ${t('match.results.recordSimple')}
          </div>
          <div class="death-ach-item" style="color: #f1f5f9;">
            ${t('match.results.recordScore', { number: formatNumber(recordResult.bestRun.score) })}
          </div>
        </div>
      `;
    }
    if (newlyUnlocked && newlyUnlocked.length > 0) {
      html += `
        <div class="death-ach-card">
          <div class="death-ach-header">
            ${renderIcon('sparkle', { size: 12, color: '#ffd166' })} ${t('match.results.unlocked')}
          </div>
          ${newlyUnlocked.map(a => `
            <div class="death-ach-item">
              <b>${a.title}</b>: ${a.heroTitle ? t('match.results.awakened', { hero: a.heroTitle }) : a.desc}
            </div>
          `).join('')}
        </div>
      `;
    }
    achContainer.innerHTML = html;
  }

  };
  refreshDeathPresentation = () => {
    renderDeathDetails();
    renderDeathArsenal();
    const kills = document.getElementById('death-kills-val');
    const souls = document.getElementById('death-souls-val');
    if (kills) kills.textContent = formatNumber(gameState.kills);
    if (souls) souls.textContent = formatNumber(getPersistentGold());
  };
  refreshDeathPresentation();

  // 7. Registro de Teclas de Atalho (Espaço ou Enter para Renascer no PC)
  if (deathKeydownHandler) {
    window.removeEventListener('keydown', deathKeydownHandler);
  }
  deathKeydownHandler = (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      const restartBtn = document.getElementById('restart-death-btn');
      if (restartBtn) restartBtn.click();
    }
  };
  window.addEventListener('keydown', deathKeydownHandler);

  // 8. Exibição da Interface Intrínseca com Detecção Responsiva Mobile
  const modal = document.getElementById('death-modal');
  if (modal) {
    modal.classList.toggle('is-mobile-device', isMobileScreen());
    modal.classList.remove('modal-hidden', 'closing');
    modal.classList.add('active');
    modal.style.removeProperty('display');
    modal.style.display = 'flex';
  }

  // 9. Disparo de Contagem Numérica Animada sincronizada com o assentamento das métricas
  if (deathCountUpTimeout) {
    clearTimeout(deathCountUpTimeout);
  }
  deathCountUpTimeout = setTimeout(() => {
    deathCountUpTimeout = null;
    if (!gameState.isDead) return;
    animateCountUp(document.getElementById('death-kills-val'), gameState.kills, 850);
    animateCountUp(document.getElementById('death-souls-val'), getPersistentGold(), 1000);
  }, 1650);
}

/**
 * Abertura e Apresentação Monumental do Triunfo de Vitória Suprema (Boss Final Purgado)
 */
let victoryCountUpTimeout = null;
let victoryKeydownHandler = null;

export function openVictoryModalReal() {
  if (victorySettled) return;
  victorySettled = true;
  gameState.isWon = true;
  gameState.isDead = false;
  gameState.isPaused = false;
  resetInput();

  // 1. Limpeza segura das coleções de projéteis e entidades
  try {
    resetCollections();
  } catch (e) {
    bullets.length = 0;
    enemyBullets.length = 0;
    bossTelegraphs.length = 0;
    bossProjectiles.length = 0;
    bossShockwaves.length = 0;
    voidVortices.length = 0;
  }

  // 2. Toca Fanfarra Triunfal e Vibração Háptica Poderosa
  try {
    playSfx('victory');
  } catch (e) {}
  triggerHaptic('heavy');

  // 3. Garante que o canvas não mantenha efeito de congelamento ou desfoque
  const gameCanvas = document.getElementById('game-canvas');
  if (gameCanvas) {
    gameCanvas.classList.remove('canvas-death-frozen');
  }

  // 4. Mantém o overlay de fade ativo para garantir fundo totalmente preto
  const fadeOverlay = document.getElementById('victory-fade-overlay');
  if (fadeOverlay) {
    fadeOverlay.classList.add('active');
    fadeOverlay.style.removeProperty('display');
    fadeOverlay.style.display = 'block';
    fadeOverlay.style.opacity = '1';
  }

  const bossHud = document.getElementById('boss-hud');
  if (bossHud) bossHud.style.display = 'none';

  resetCameraZoom();
  cinematicCamera.isCinematic = false;
  cinematicCamera.letterboxProgress = 0;

  // 5. Coleta de Biometria da Partida
  const survivalSecs = Math.max(0, Math.floor(frameCount / 60));
  const survivalTime = String(Math.floor(survivalSecs / 60)).padStart(2, '0') + ':' + String(survivalSecs % 60).padStart(2, '0');
  const currentHeroDef = CHARACTERS[selectedHeroKey] || CHARACTERS.KNIGHT;
  const { weapons: playerWeapons, passives: playerPassives } = harvestPlayerRunArsenal();
  const evolvedCount = playerWeapons.filter(w => w.evolved).length;

  // 6. Concessão do Bônus Sagrado de Vitória (+1.500 Almas Permanentes)
  const bossVictoryBonus = Math.round(1500 * (player.goldMultiplier ?? 1));
  const beforeBonus = getPersistentGold();

  // Credita o bônus permanente no banco do jogador
  addPersistentGold(bossVictoryBonus);

  // 7. Registro de Conquistas e Melhor Run da Carreira
  let recordResult = null;
  let newlyUnlocked = [];
  try {
    newlyUnlocked = recordRunStats({
      kills: gameState.kills,
      runKills: gameState.kills,
      wave: 10,
      bossDefeated: 4,
      survivalSeconds: survivalSecs,
      level: player.level,
      evolvedWeaponsCount: evolvedCount,
      runFinished: true
    }) || [];

    recordHeroRunStats(selectedHeroKey, {
      seconds: survivalSecs,
      timeStr: survivalTime,
      kills: gameState.kills,
      isVictory: true,
      level: player.level,
      wave: 10
    });

    const ledger = victoryLedger(matchStartGold, beforeBonus, getPersistentGold(), bossVictoryBonus);
    const totalEarnedInRun = ledger.total;

    recordResult = checkAndRecordBestRun({
      heroKey: selectedHeroKey,
      heroName: currentHeroDef.name || 'Sir Roland',
      heroTitle: currentHeroDef.title || 'O Paladino',
      isVictory: true,
      wave: 10,
      waveText: 'Onda 10 (Vitória Suprema)',
      time: survivalTime,
      timeStr: survivalTime,
      highestWave: 10,
      bossesDefeated: [1, 2, 3, 4],
      seconds: survivalSecs,
      kills: gameState.kills,
      level: player.level,
      souls: totalEarnedInRun,
      weapons: playerWeapons,
      passives: playerPassives,
      verdictTitle: 'VITÓRIA SUPREMA ABSOLUTA',
      verdictSub: 'Expurgou o Soberano do Abismo e consagrou a luz eterna'
    });

    if (recordResult && recordResult.bestRun) {
      newlyUnlocked.push(...(recordRunStats({ score: recordResult.bestRun.score }) || []));
    }
  } catch (err) {
    console.warn('Aviso ao gravar estatísticas da vitória:', err);
  }

  refreshVictoryPresentation = () => {
    const honorsOpen = document.querySelector('.victory-honors')?.open;
  // 8. Cálculo e Apresentação do Rank Stamped
  const rank = calculateRunRank({
    isVictory: true,
    wave: 10,
    survivalSecs,
    kills: gameState.kills,
    evolvedCount
  });

  const rankGradeElem = document.getElementById('victory-rank-grade');
  if (rankGradeElem) {
    rankGradeElem.innerText = rank.grade;
    rankGradeElem.style.color = rank.color;
  }
  const rankStarsElem = document.getElementById('victory-rank-stars');
  if (rankStarsElem) rankStarsElem.innerText = rank.stars;
  const rankTitleElem = document.getElementById('victory-rank-title');
  if (rankTitleElem) rankTitleElem.innerText = rank.title;

  document.getElementById('victory-score').textContent = rank.score;
  document.getElementById('victory-rank-card').style.setProperty('--rank-color', rank.color);

  // 9. Preenchimento do Extrato de Almas Ganhas
  const waveSoulsElem = document.getElementById('victory-waves-souls');
  if (waveSoulsElem) waveSoulsElem.innerText = `+${formatNumber(ledger.collected)}`;

  const killsSoulsElem = document.getElementById('victory-kills-souls');
  if (killsSoulsElem) killsSoulsElem.innerText = `+${formatNumber(ledger.achievements)}`;

  const bossSoulsElem = document.getElementById('victory-boss-souls');
  if (bossSoulsElem) bossSoulsElem.innerText = `+${formatNumber(bossVictoryBonus)}`;

  const totalSoulsElem = document.getElementById('victory-total-earned-souls');
  if (totalSoulsElem) totalSoulsElem.innerText = t('match.results.soulsEarned', { number: formatNumber(totalEarnedInRun) });

  const vaultSoulsElem = document.getElementById('victory-vault-gold');
  if (vaultSoulsElem) vaultSoulsElem.innerText = formatNumber(getPersistentGold());

  const talentsBtnBadge = document.getElementById('victory-talents-souls-badge');
  if (talentsBtnBadge) talentsBtnBadge.innerText = t('match.results.soulsEarned', { number: formatNumber(totalEarnedInRun) });

  // 10. Biometria da Partida (5 Badges)
  const metricsStream = document.getElementById('victory-metrics-stream');
  if (metricsStream) {
    metricsStream.innerHTML = `
      <div class="victory-metric-pill">
        <div class="victory-pill-header">
          <svg class="death-pill-icon" viewBox="0 0 24 24" width="12" height="12" style="color:#ffd166;"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          <span>${t('match.results.survival')}</span>
        </div>
        <span class="victory-pill-value">${survivalTime}</span>
      </div>

      <div class="victory-metric-pill">
        <div class="victory-pill-header">
          ${renderIcon('wave_swords', { size: 12, color: '#f1c40f' })}
          <span>${t('match.results.horde')}</span>
        </div>
        <span class="victory-pill-value highlight-gold">${t('wave.title', { number: 10 })} ★</span>
      </div>

      <div class="victory-metric-pill">
        <div class="victory-pill-header">
          ${renderIcon('skull', { size: 12, color: '#ff4757' })}
          <span>${t('match.results.kills')}</span>
        </div>
        <span class="victory-pill-value highlight-crimson" id="victory-kills-val">0</span>
      </div>

      <div class="victory-metric-pill">
        <div class="victory-pill-header">
          ${renderIcon('sparkle', { size: 12, color: '#f1c40f' })}
          <span>${t('match.results.power')}</span>
        </div>
        <span class="victory-pill-value">${t('match.common.level', { number: player.level })}</span>
      </div>

      <div class="victory-metric-pill">
        <div class="victory-pill-header">
          ${renderIcon('boss_crown', { size: 12, color: '#ffd166' })}
          <span>${t('match.results.bosses')}</span>
        </div>
        <span class="victory-pill-value highlight-gold">${t('match.results.purged')}</span>
      </div>
    `;
  }

  // 11. Vitrine do Arsenal: Armas e Passivas
  const heroNameElem = document.getElementById('victory-hero-name');
  if (heroNameElem) {
    heroNameElem.innerText = `${currentHeroDef.name || 'Sir Roland'} • ${t('match.common.level', { number: player.level })}`;
  }

  const evolvedCounterElem = document.getElementById('victory-evolved-counter');
  if (evolvedCounterElem) {
    evolvedCounterElem.innerText = t('match.results.evolvedCount', { count: evolvedCount });
  }

  const weaponsContainer = document.getElementById('victory-weapons-container');
  if (weaponsContainer) {
    if (playerWeapons.length === 0) {
      weaponsContainer.innerHTML = `<span style="font-size:11px;color:#888;">${t('match.results.emptyWeapons')}</span>`;
    } else {
      weaponsContainer.innerHTML = playerWeapons.map(w => `
        <div class="build-weapon-card ${w.evolved ? 'is-evolved' : ''}">
          <div class="build-weapon-icon-box">
            ${renderIcon(w.iconKey || 'sword', { size: 20, color: w.evolved ? '#ffd166' : '#ecf0f1' })}
          </div>
          <div class="build-weapon-info">
            <span class="build-weapon-name" title="${getSavedWeaponName(w)}">${getSavedWeaponName(w)}</span>
            <div class="build-weapon-status">
              <span class="build-weapon-lvl">${w.evolved ? t('match.common.level', { number: 'MAX' }) : t('match.common.level', { number: w.level })}</span>
              ${w.evolved ? `<span class="build-weapon-badge-evolved">${t('match.results.evolvedBadge')}</span>` : ''}
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  const passivesContainer = document.getElementById('victory-passives-container');
  if (passivesContainer) {
    if (playerPassives.length === 0) {
      passivesContainer.innerHTML = `<span class="build-passive-pill" style="opacity:0.6;">${t('match.results.emptyPassives')}</span>`;
    } else {
      passivesContainer.innerHTML = playerPassives.map(p => `
        <span class="build-passive-pill">${getSavedPassivePresentation(p)?.name || p}</span>
      `).join('');
    }
  }

  // 12. Conquistas e Recordes
  const achContainer = document.getElementById('victory-achievements-container');
  if (achContainer) {
    let achHtml = '';
    if (recordResult && recordResult.isNewBest) {
      achHtml += `
        <div class="death-ach-card" style="border-color: rgba(241, 196, 15, 0.7); background: linear-gradient(135deg, rgba(40, 30, 10, 0.95) 0%, rgba(20, 15, 5, 0.98) 100%);">
          <div class="death-ach-header" style="color: #ffd166;">
            ${renderIcon('boss_crown', { size: 14, color: '#ffd166' })} ${t('match.results.record')}
          </div>
          <div class="death-ach-item" style="color: #f1f5f9;">
            ${t('match.results.recordScore', { number: formatNumber(recordResult.bestRun.score) })}
          </div>
        </div>
      `;
    }
    if (newlyUnlocked && newlyUnlocked.length > 0) {
      achHtml += `
        <div class="death-ach-card" style="border-color: rgba(46, 204, 113, 0.6);">
          <div class="death-ach-header" style="color: #2ecc71;">
            ${renderIcon('sparkle', { size: 14, color: '#2ecc71' })} ${t('match.results.unlocked')}
          </div>
          ${newlyUnlocked.map(a => `
            <div class="death-ach-item">
              <b>${a.title}</b>: ${a.heroTitle ? t('match.results.awakened', { hero: a.heroTitle }) : a.desc}
            </div>
          `).join('')}
        </div>
      `;
    }
    achContainer.innerHTML = achHtml ? `<details class="victory-honors"><summary>${renderIcon('sparkle', { size: 14, color: '#ffd166' })}<span>${recordResult?.isNewBest ? t('match.results.personal') : t('match.results.honors')}${newlyUnlocked.length ? ' · ' + t('match.results.unlockCount', { count: newlyUnlocked.length }) : ''}</span><span class="victory-honors-hint">${t('match.results.view')}</span></summary><div class="victory-honors-content">${achHtml}</div></details>` : '';
  }

    const honors = document.querySelector('.victory-honors');
    if (honors && honorsOpen) honors.open = true;
    const kills = document.getElementById('victory-kills-val');
    if (kills) kills.textContent = formatNumber(gameState.kills);
  };
  refreshVictoryPresentation();

  // 13. Teclas de Atalho (Espaço ou Enter para Reiniciar no PC)
  if (victoryKeydownHandler) {
    window.removeEventListener('keydown', victoryKeydownHandler);
  }
  const victoryInputReadyAt = performance.now() + 1000;
  victoryKeydownHandler = (e) => {
    const modal = document.getElementById('victory-modal');
    if (!modal?.classList.contains('active') || e.repeat) return;
    if (e.code === 'Tab') {
      const controls = [...modal.querySelectorAll('button, summary')];
      const first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === modal)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (e.target.closest?.('button, summary, input, select, textarea')) return;
    if (performance.now() < victoryInputReadyAt) return;
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      const restartBtn = document.getElementById('restart-victory-btn');
      if (restartBtn) restartBtn.click();
    }
  };
  window.addEventListener('keydown', victoryKeydownHandler);

  // 14. Exibição da Interface com Detecção Mobile
  const modal = document.getElementById('victory-modal');
  if (modal) {
    modal.classList.toggle('is-mobile-device', isMobileScreen());
    modal.classList.remove('modal-hidden', 'closing');
    modal.classList.add('active');
    modal.style.removeProperty('display');
    modal.style.display = 'flex';
    modal.scrollTop = 0;
    const fitVictory = () => { autoFitElement(modal); modal.scrollTop = 0; modal.scrollLeft = 0; };
    modal.querySelectorAll('details').forEach(detail => { detail.ontoggle = fitVictory; });
    fitVictory();
    document.fonts?.ready.then(() => { if (modal.classList.contains('active')) fitVictory(); });
    modal.focus({ preventScroll: true });
  }

  // 15. Contagem Numérica Animada
  if (victoryCountUpTimeout) {
    clearTimeout(victoryCountUpTimeout);
  }
  victoryCountUpTimeout = setTimeout(() => {
    victoryCountUpTimeout = null;
    if (!gameState.isWon) return;
    animateCountUp(document.getElementById('victory-kills-val'), gameState.kills, 850);
  }, 400);
}

export function finalizeVictoryAndReturnToMenu() {
  openVictoryModalReal();
}

export function closeDeathModal() {
  pendingDeathPayload = null;
  if (deathCountUpTimeout) {
    clearTimeout(deathCountUpTimeout);
    deathCountUpTimeout = null;
  }
  if (deathKeydownHandler) {
    window.removeEventListener('keydown', deathKeydownHandler);
    deathKeydownHandler = null;
  }
  const modal = document.getElementById('death-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.setProperty('display', 'none', 'important');
    modal.style.display = 'none';
  }
}

export function closeVictoryModal() {
  if (victoryCountUpTimeout) {
    clearTimeout(victoryCountUpTimeout);
    victoryCountUpTimeout = null;
  }
  if (victoryKeydownHandler) {
    window.removeEventListener('keydown', victoryKeydownHandler);
    victoryKeydownHandler = null;
  }
  const modal = document.getElementById('victory-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.setProperty('display', 'none', 'important');
    modal.style.display = 'none';
  }
  const fadeOverlay = document.getElementById('victory-fade-overlay');
  if (fadeOverlay) {
    fadeOverlay.classList.remove('active');
    fadeOverlay.style.opacity = '0';
    fadeOverlay.style.display = 'none';
  }
  const gameCanvas = document.getElementById('game-canvas');
  if (gameCanvas) {
    gameCanvas.classList.remove('canvas-death-frozen');
  }
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.remove('boss-defeat-cinematic');
    const hud = document.getElementById('hud');
    if (hud) hud.classList.remove('hud-cinematic-death');
    const skillBtn = document.getElementById('skill-btn-container');
    if (skillBtn) skillBtn.classList.remove('hud-cinematic-death');
  }
  resetCameraZoom();
  cinematicCamera.isCinematic = false;
  cinematicCamera.letterboxProgress = 0;
}

export function triggerVictory() {
  openVictoryModalReal();
}
