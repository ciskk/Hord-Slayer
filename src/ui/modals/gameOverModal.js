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
import { resetInput } from '../../core/input.js';
import { triggerHaptic, applyDeathAudioFilter, resetDeathAudioFilter, playSfx } from '../../core/audio.js';
import { recordRunStats, checkAndRecordBestRun } from '../../config/achievements.js';
import { BESTIARY_ENTRIES } from '../../config/bestiary.js';
import { renderIcon, WEAPON_ICONS } from '../icons.js';
import { player, getPersistentGold, selectedHeroKey } from '../../entities/player.js';
import { CHARACTERS } from '../../config/characters.js';
import { ITEMS } from '../../config/items.js';
import { openCharacterSelect, isMobileScreen } from './characterSelectModal.js';

/**
 * Vereditos Poéticos da Queda (Horror Grim Cyber-Gothic)
 */
export const DEATH_VERDICTS = [
  "SUA CARNE ALIMENTA AS PROFUNDEZAS",
  "A ARENA BEBEU ATÉ SUA ÚLTIMA GOTA",
  "NÃO RESTOU ALMA PARA REIVINDICAR",
  "O ABISMO DEVOLVE APENAS OSSOS",
  "EXTINTO NO SILÊNCIO DA CRIPTA",
  "SEUS GRITOS ECOAM NO VÁCUO ETERNO",
  "A HORDA CONSAGRA SEU SACRIFÍCIO",
  "A MORTE NÃO TEVE PRESSA, APENAS PACIÊNCIA",
  "CINZAS AO PÓ, SANGUE À TERRA MALDITA",
  "VOCÊ FOI APENAS MAIS UM BANQUETE",
  "O CICLO EXIGE SANGUE E VOCÊ FOI A OFERENDA",
  "SUA CORAGEM NÃO PASSOU DE UMA ILUSÃO EFÊMERA",
  "A ESCURIDÃO FINALMENTE RECLAMOU O QUE É DELA",
  "SEU NOME FOI APAGADO DAS CRÔNICAS DESTE MUNDO",
  "NENHUMA PRECE ALCANÇA O FUNDO DESTE ABISMO",
  "O DESTINO TRIGNOU SEUS OSSOS SOB A LAMILHA",
  "SEU ÚLTIMO SUSPIRO SE PERDEU NA TORMENTA",
  "NEM MESMO OS VERMES LEMBRARÃO DE QUEM VOCÊ FOI",
  "A NOITE ETERNA DESCEU SOBRE SEUS OLHOS",
  "MAIS UMA LUZ APAGADA NA IMENSIDÃO DAS SOMBRAS",
  "O BANQUETE TERMINOU E VOCÊ FOI O PRATO PRINCIPAL",
  "A HORDA PISOTEOU SEUS ÚLTIMOS RESTOS",
  "SUA JORNADA CULMINOU NESTE TÚMULO ESQUECIDO",
  "A TERRA RANCOROSA TRAGOU SUAS MEMÓRIAS",
  "NADA SOBROU ALÉM DO CHEIRO DE ENXOFRE E SANGUE",
  "O ECO DA SUA DERROTA NUNCA CESSARÁ",
  "A ETERNIDADE É FRIA E REPLETA DE MONSTROS",
  "O PESO DA ARENA ESMAGOU SUAS ESPERANÇAS",
  "SUAS ARMAS REPOUSAM AO LADO DE SEU CADÁVER",
  "O ABISMO RIU DA SUA TENTATIVA DE RESISTIR",
  "RESTOU APENAS UM RASTRO DE POEIRA ESCARLATE",
  "A MORTE DECLAROU O SEU XEQUE-MATE FINAL",
  "SEU SACRIFÍCIO FOI VAIDOSO E INSIGNIFICANTE",
  "AS SOMBRAS FECHARAM O VÉU SOBRE SEU CORPO",
  "NENHUMA GLÓRIA AGUARDA OS QUE CAEM NESTA ARENA",
  "O SILÊNCIO REINOU ONDE ANTES HAVIA PULSO",
  "SUAS BRASAS SE APAGARAM NA NEVE NEGRA DO TÁRTARO",
  "A PRÓXIMA ONDA JÁ CAMINHA SOBRE O SEU TÚMULO",
  "UMA VIDA A MENOS PARA DESAFIAR O INEVITÁVEL",
  "O TRIBUNAL DAS SOMBRAS DECRETOU SUA EXTINÇÃO"
];

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
  const weapons = [];
  if (Array.isArray(player.weapons)) {
    player.weapons.forEach(w => {
      const type = w.type;
      const item = ITEMS[type];
      const isEvolved = !!(
        (type === 'SWORD' && player.evolvedSword) ||
        (type === 'AURA' && player.evolvedAura) ||
        (type === 'ORBITALS' && player.evolvedOrbitals) ||
        (type === 'AXE' && player.evolvedAxe) ||
        (type === 'STAFF' && player.evolvedStaff) ||
        (type === 'HAMMER' && player.evolvedHammer) ||
        (type === 'POTION' && player.evolvedPotion)
      );
      weapons.push({
        type,
        name: item ? item.name : type,
        level: w.count || 1,
        evolved: isEvolved,
        iconKey: WEAPON_ICONS[type] || 'sword'
      });
    });
  }

  const passives = [];
  if (player.damageCardCount) passives.push(`Poder Bruto (+${Math.round((player.damagePercentBonus || 0) * 100)}%)`);
  if (player.armorCardCount || player.hasArmorPassive) passives.push(`Armadura Rúnica (+${(player.armorCardCount || 1) * 30} HP)`);
  if (player.wingsCardCount || player.hasWingsPassive) passives.push(`Asas do Vento (+${player.speed.toFixed(1)} Vel)`);
  if (player.frostCardCount || (player.slowChance || 0) > 0) passives.push('Golpe Criogênico');
  if (player.orbitals > 0) passives.push('Bíblias Protetoras');
  if (player.auraLvl > 0) passives.push('Aura Sagrada');
  if (player.critCardCount || player.critChance > 0.05) passives.push(`Foco Letal (${Math.round(player.critChance * 100)}%)`);
  if (player.hasteCardCount || (player.cooldownReduction || 0) > 0) passives.push('Fúria Rápida');
  if (player.magnetCardCount) passives.push('Ímã Titânico');

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
    const lowerName = killerName.toLowerCase();
    bestiaryEntry = BESTIARY_ENTRIES.find(b => 
      b.name.toLowerCase() === lowerName || 
      lowerName.includes(b.name.toLowerCase()) || 
      b.name.toLowerCase().includes(lowerName)
    );
  }

  let tacticText = '';
  let threatLabel = 'LETALIDADE ALTA';
  let categoryLabel = 'ABOMINAÇÃO DA HORDA';
  let iconSvg = '';

  if (bestiaryEntry) {
    tacticText = bestiaryEntry.tactics;
    threatLabel = `AMEAÇA GRAU ${bestiaryEntry.threat || 3}`;
    if (bestiaryEntry.category === 'BOSS') {
      categoryLabel = 'CHEFE SUPREMO DO ABISMO';
      iconSvg = renderIcon('boss_crown', { size: 30, color: '#ffd166' });
    } else if (bestiaryEntry.category === 'MINIBOSS') {
      categoryLabel = 'MINI-CHEFE DEVASTADOR';
      iconSvg = renderIcon('skull', { size: 28, color: '#e67e22' });
    } else {
      categoryLabel = 'ABOMINAÇÃO DA HORDA';
      iconSvg = renderIcon('sword', { size: 28, color: '#ff4757' });
    }
  } else {
    // 2. Conselhos de Sobrevivência Contextuais para Perigos e Golpes Especiais
    switch (category) {
      case 'BOSS':
        categoryLabel = 'CHEFE SUPREMO DO ABISMO';
        threatLabel = 'PERIGO APOCALÍPTICO';
        iconSvg = renderIcon('boss_crown', { size: 30, color: '#ffd166' });
        tacticText = "Os ataques de chefes possuem telégrafos visuais no solo. Guarde a esquiva/dash para o momento em que a demarcação geométrica fechar.";
        break;

      case 'MINIBOSS':
        categoryLabel = 'MINI-CHEFE DEVASTADOR';
        threatLabel = 'AMEAÇA DEVASTADORA';
        iconSvg = renderIcon('skull', { size: 28, color: '#e67e22' });
        tacticText = "Mini-chefes possuem hiperarmadura e investidas velozes. Ataque em círculos concêntricos mantendo rota de fuga livre.";
        break;

      case 'PROJECTILE':
        categoryLabel = 'DISPARO BALÍSTICO PROFANO';
        threatLabel = 'PERIGO À DISTÂNCIA';
        iconSvg = `<svg class="killer-glyph" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#9b59b6" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="#9b59b6"/><line x1="12" y1="2" x2="12" y2="6" stroke="#9b59b6" stroke-width="2"/><line x1="12" y1="18" x2="12" y2="22" stroke="#9b59b6" stroke-width="2"/></svg>`;
        tacticText = "Monstros à distância atacam com base na sua trajetória. Mantenha movimentação em arco contínuo para que os tiros passem reto.";
        break;

      case 'HAZARD':
        categoryLabel = 'CATACLISMO AMBIENTAL';
        threatLabel = 'DANO CONTÍNUO';
        iconSvg = `<svg class="killer-glyph" viewBox="0 0 24 24"><path fill="#e74c3c" d="M12 2L1 21h22L12 2zm0 4l7.5 13h-15L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>`;
        tacticText = "Zonas de solo contaminado, miasmas e vórtices drenam vida aceleradamente. Ao avistar distorções no terreno, reposicione-se de imediato.";
        break;

      default:
        categoryLabel = 'ABOMINAÇÃO DA HORDA';
        threatLabel = 'ENXAME MORTAL';
        iconSvg = renderIcon('sword', { size: 28, color: '#ff4757' });
        tacticText = "Evite ser encurralado contra as extremidades da arena. Utilize o empurrão das armas para abrir brechas no cerco dos monstros.";
        break;
    }
  }

  return { tacticText, threatLabel, categoryLabel, iconSvg };
}

/**
 * Gatilho da Morte Intrínseca com Congelamento e Desfoque da Arena
 */
export function triggerDeath() {
  gameState.isDead = true;
  const pauseModal = document.getElementById('pause-modal');
  if (pauseModal) {
    pauseModal.classList.remove('active', 'closing');
    pauseModal.style.display = 'none';
  }
  const canvasElem = document.getElementById('game-canvas');
  if (canvasElem) canvasElem.classList.remove('canvas-stasis-frozen');
  resetInput();
  triggerHaptic('heavy');
  applyDeathAudioFilter();
  playSfx('death_heartbeat');

  setTimeout(() => {
    playSfx('tombstone_slam');
  }, 300);

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
  const randomVerdict = DEATH_VERDICTS[Math.floor(Math.random() * DEATH_VERDICTS.length)];
  const titleElem = document.getElementById('death-verdict-title');
  if (titleElem) {
    titleElem.innerText = randomVerdict;
  }

  // 4. Resolução da Causa Mortis (O Algoz e Golpe Fatal)
  const killerName = (deathContext && deathContext.name) ? deathContext.name : (lastAttackerName || 'A Horda do Abismo');
  const killerCategory = (deathContext && deathContext.category) ? deathContext.category : 'HORDE';
  const killerAttack = (deathContext && deathContext.attackName) ? deathContext.attackName : 'Golpe Melee Fatal';
  const lethalDmg = (deathContext && deathContext.damage > 0) ? `-${deathContext.damage} Dano` : 'Golpe Fatal';
  const enemyType = deathContext ? deathContext.enemyType : null;

  const { tacticText, threatLabel, categoryLabel, iconSvg } = resolveDeathTacticsAndIcon(killerName, killerCategory, enemyType);

  const emblemElem = document.getElementById('death-killer-emblem');
  if (emblemElem && iconSvg) {
    emblemElem.innerHTML = iconSvg;
  }

  const categoryBadge = document.getElementById('death-category-badge');
  if (categoryBadge) {
    categoryBadge.innerText = categoryLabel;
  }

  const threatIndicator = document.getElementById('death-threat-indicator');
  if (threatIndicator) {
    threatIndicator.innerHTML = `⚠️ ${threatLabel}`;
  }

  const killerNameElem = document.getElementById('death-killer-name');
  if (killerNameElem) {
    killerNameElem.innerText = killerName;
  }

  const attackNameElem = document.getElementById('death-attack-name');
  if (attackNameElem) {
    attackNameElem.innerText = killerAttack;
  }

  const lethalDamageElem = document.getElementById('death-lethal-damage');
  if (lethalDamageElem) {
    lethalDamageElem.innerText = lethalDmg;
  }

  const tacticDescElem = document.getElementById('death-tactic-text');
  if (tacticDescElem) {
    tacticDescElem.innerText = tacticText;
  }

  // 5. Estatísticas da Partida (Biometria em Badges Transparentes)
  const timerElem = document.getElementById('timer-val');
  const survivalTime = timerElem ? timerElem.innerText : '00:00';

  const waveElem = document.getElementById('wave-banner');
  const waveText = waveElem ? waveElem.innerText.split(':')[0] : 'Horda';

/**
 * Animação fluida de contagem numérica ascendente para métricas da partida
 */
function animateCountUp(element, targetValue, durationMs = 650) {
  if (!element) return;
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
    element.innerText = currentVal;
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.innerText = num;
    }
  }
  requestAnimationFrame(step);
}

  const metricsStream = document.getElementById('death-metrics-stream');
  if (metricsStream) {
    metricsStream.innerHTML = `
      <div class="death-metric-pill">
        <div class="death-pill-header">
          <svg class="death-pill-icon" viewBox="0 0 24 24" style="color:#ffd166;"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          <span class="death-pill-label">SOBREVIVÊNCIA</span>
        </div>
        <span class="death-pill-value">${survivalTime}</span>
      </div>

      <div class="death-metric-pill">
        <div class="death-pill-header">
          ${renderIcon('wave_swords', { size: 12, color: '#f1c40f' })}
          <span class="death-pill-label">HORDA</span>
        </div>
        <span class="death-pill-value">${waveText}</span>
      </div>

      <div class="death-metric-pill">
        <div class="death-pill-header">
          ${renderIcon('skull', { size: 12, color: '#ff4757' })}
          <span class="death-pill-label">ABATES</span>
        </div>
        <span class="death-pill-value highlight-crimson" id="death-kills-val">0</span>
      </div>

      <div class="death-metric-pill">
        <div class="death-pill-header">
          ${renderIcon('sparkle', { size: 12, color: '#f1c40f' })}
          <span class="death-pill-label">PODER</span>
        </div>
        <span class="death-pill-value">Nv. ${player.level}</span>
      </div>

      <div class="death-metric-pill">
        <div class="death-pill-header">
          ${renderIcon('gold', { size: 12, color: '#f1c40f' })}
          <span class="death-pill-label">ALMAS</span>
        </div>
        <span class="death-pill-value highlight-gold" id="death-souls-val">0</span>
      </div>
    `;
  }

  // 6. Conquistas Desbloqueadas e Registro de Melhor Run nesta Jornada
  const newlyUnlocked = recordRunStats({
    kills: gameState.kills,
    runFinished: true
  });

  // Avaliação e gravação da Melhor Run
  const waveMatch = (waveText || '').match(/\d+/);
  const currentWaveNum = waveMatch ? parseInt(waveMatch[0], 10) : 1;
  const currentHeroDef = CHARACTERS[selectedHeroKey] || CHARACTERS.KNIGHT;
  const { weapons: playerWeapons, passives: playerPassives } = harvestPlayerRunArsenal();

  const recordResult = checkAndRecordBestRun({
    heroKey: selectedHeroKey,
    heroName: currentHeroDef.name || 'Sir Roland',
    heroTitle: currentHeroDef.title || 'O Paladino',
    isVictory: false,
    wave: currentWaveNum,
    waveText: waveText || `Onda ${currentWaveNum}`,
    time: survivalTime,
    seconds: parseTimeToSeconds(survivalTime),
    kills: gameState.kills,
    level: player.level,
    souls: getPersistentGold(),
    weapons: playerWeapons,
    passives: playerPassives,
    verdictTitle: `ÚLTIMO SUSPIRO NA ONDA ${currentWaveNum}`,
    verdictSub: killerName ? `Caiu perante ${killerName}` : randomVerdict
  });

  const achContainer = document.getElementById('death-achievements-container');
  if (achContainer) {
    let html = '';
    if (recordResult && recordResult.isNewRecord) {
      html += `
        <div class="death-ach-card" style="border-color: rgba(241, 196, 15, 0.6); background: linear-gradient(135deg, rgba(35, 26, 15, 0.95) 0%, rgba(18, 14, 10, 0.98) 100%);">
          <div class="death-ach-header" style="color: #ffd166;">
            ${renderIcon('boss_crown', { size: 12, color: '#ffd166' })} NOVO RECORDE HISTÓRICO!
          </div>
          <div class="death-ach-item" style="color: #f1f5f9;">
            Sua crônica foi consagrada no <b>Monumento do Grimório</b> com <b>${recordResult.bestRun.score.toLocaleString('pt-BR')} Pontos</b>!
          </div>
        </div>
      `;
    }
    if (newlyUnlocked && newlyUnlocked.length > 0) {
      html += `
        <div class="death-ach-card">
          <div class="death-ach-header">
            ${renderIcon('sparkle', { size: 12, color: '#ffd166' })} CONQUISTA DESBLOQUEADA!
          </div>
          ${newlyUnlocked.map(a => `
            <div class="death-ach-item">
              <b>${a.title}</b>: ${a.heroTitle ? `Despertou <b>${a.heroTitle}</b> no Altar!` : a.desc}
            </div>
          `).join('')}
        </div>
      `;
    }
    achContainer.innerHTML = html;
  }

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
    modal.classList.add('active');
    modal.style.display = 'flex';
  }

  // 9. Disparo de Contagem Numérica Animada
  requestAnimationFrame(() => {
    animateCountUp(document.getElementById('death-kills-val'), gameState.kills, 600);
    animateCountUp(document.getElementById('death-souls-val'), getPersistentGold(), 700);
  });
}

/**
 * Limpeza e Retorno ao Altar de Personagens
 */
export function finalizeVictoryAndReturnToMenu() {
  gameState.isWon = true;
  gameState.isPaused = false;
  resetInput();

  recordRunStats({
    kills: gameState.kills,
    wave: 10,
    bossDefeated: 4,
    runFinished: true
  });

  const timerElem = document.getElementById('timer-val');
  const survivalTime = timerElem ? timerElem.innerText : '00:00';
  const currentHeroDef = CHARACTERS[selectedHeroKey] || CHARACTERS.KNIGHT;
  const { weapons: playerWeapons, passives: playerPassives } = harvestPlayerRunArsenal();

  checkAndRecordBestRun({
    heroKey: selectedHeroKey,
    heroName: currentHeroDef.name || 'Sir Roland',
    heroTitle: currentHeroDef.title || 'O Paladino',
    isVictory: true,
    wave: 10,
    waveText: 'Onda 10 (Vitória Suprema)',
    time: survivalTime,
    seconds: parseTimeToSeconds(survivalTime),
    kills: gameState.kills,
    level: player.level,
    souls: getPersistentGold(),
    weapons: playerWeapons,
    passives: playerPassives,
    verdictTitle: 'VITÓRIA SUPREMA ABSOLUTA',
    verdictSub: 'Expurgou o Soberano do Abismo e consagrou a luz eterna'
  });

  bullets.length = 0;
  enemyBullets.length = 0;
  bossTelegraphs.length = 0;
  bossProjectiles.length = 0;
  bossShockwaves.length = 0;
  voidVortices.length = 0;

  const bossHud = document.getElementById('boss-hud');
  if (bossHud) bossHud.style.display = 'none';

  const modal = document.getElementById('victory-modal');
  if (modal) modal.style.display = 'none';

  const gameCanvas = document.getElementById('game-canvas');
  if (gameCanvas) gameCanvas.classList.remove('canvas-death-frozen');

  if (deathKeydownHandler) {
    window.removeEventListener('keydown', deathKeydownHandler);
    deathKeydownHandler = null;
  }

  // Retorna triunfalmente ao menu de seleção de personagens
  openCharacterSelect();

  setTimeout(() => {
    const fadeOverlay = document.getElementById('victory-fade-overlay');
    if (fadeOverlay) {
      fadeOverlay.classList.remove('active');
      fadeOverlay.style.opacity = '0';
    }
  }, 400);
}

export function closeDeathModal() {
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

export function triggerVictory() {
  finalizeVictoryAndReturnToMenu();
}
