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
    element.innerText = Number(targetValue).toLocaleString('pt-BR');
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
    element.innerText = currentVal.toLocaleString('pt-BR');
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.innerText = num.toLocaleString('pt-BR');
    }
  }
  requestAnimationFrame(step);
}

/**
 * Avaliação de Desempenho e Rank da Partida (Grade System)
 */
export function calculateRunRank({ isVictory, wave, survivalSecs, kills, evolvedCount }) {
  if (isVictory) return evaluateVictory({ survivalSecs, kills, evolvedCount });
  if (wave >= 9) return { grade: 'A', title: 'VETERANO DAS PROFUNDEZAS', color: '#9b59b6', stars: '★★★☆☆' };
  if (wave >= 6) return { grade: 'B', title: 'GUERREIRO RESILIENTE', color: '#3498db', stars: '★★☆☆☆' };
  if (wave >= 3) return { grade: 'C', title: 'SOBREVIVENTE APRENDIZ', color: '#2ecc71', stars: '★☆☆☆☆' };
  return { grade: 'D', title: 'INICIADO CAÍDO', color: '#95a5a6', stars: '☆☆☆☆☆' };
}

/**
 * Vereditos Poéticos da Queda (Horror Grim Cyber-Gothic)
 */
export const DEATH_VERDICTS = [
  "JUNTE-SE AO SANGUE DOS INFELIZES",
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
  "O TRIBUNAL DAS SOMBRAS DECRETOU SUA EXTINÇÃO",
  "A TERRA NUNCA DEVOLVE O QUE DEVORA",
  "SUAS VEIAS SE TORNARAM RIOS DE LODO",
  "O BARRO ESCURO BEBE SEU ÚLTIMO CALOR",
  "SEUS OSSOS FINALMENTE ENCONTRARAM IGUAIS",
  "NEM A POEIRA SE LEMBRARÁ DO SEU NOME",
  "SUA CARCAÇA É O ADUBO DO PRÓXIMO CICLO",
  "RESTOU APENAS A MARCA TÍPIDA DO SEU COLAPSO",
  "A ARENA NÃO SE ENGASGA COM NENHUM GUERREIRO",
  "CADA GOTA DERRAMADA FOI UM TRIBUTO AO VÁCUO",
  "CARNE MACIA ENTRE MANDÍBULAS DE FERRO",
  "NENHUM DEUS SE INCLINOU PARA OUVIR SEU CHORO",
  "SUA ESPADA REPOUSA MAIS RÁPIDA QUE SUA CORAGEM",
  "A GLÓRIA É UM FARRAPO QUE O SANGUE DILUI",
  "VALENTES E COVARDES QUEBRAM COM O MESMO SOM",
  "TANTAS HORAS DE LUTA POR UM TÚMULO SEM NOME",
  "SUA LENDA MORREU ANTES DE ATINGIR A AURORA",
  "O ORGULHO FOI O PRIMEIRO A SANGRAR",
  "NÃO HÁ LÁGRIMAS NA CRIPTA DOS AMBICIOSOS",
  "AS ESTRELAS FECHARAM OS OLHOS PARA A SUA QUEDA",
  "SEUS JURAMENTOS APAGARAM-SE ANTES DO SEU PULSO",
  "A ESCURIDÃO FINALMENTE ENCONTROU O SEU SILÊNCIO",
  "O ABISMO NÃO PISCA PARA OS MORTOS",
  "APAGUE-SE NA FRIALDADE DO NADA",
  "NÃO HÁ ALVORADA PARA QUEM SE PERDE NESTE CHÃO",
  "O SOPRO DA VIDA ERA APENAS UMA BRASA CONDENADA",
  "AS SOMBRAS RECOLHERAM CADA PEDAÇO DA SUA LUZ",
  "VOCÊ É MAIS UMA MANCHA NA PEDRA ETERNA",
  "O VÁCUO NÃO GUARDA LEMBRANÇAS",
  "ATÉ O SEU MEDO FOI ASFIXIADO",
  "O HORIZONTE ENGOLIU SUA ÚLTIMA ESPERANÇA",
  "OS PÉS DA HORDA ESMAGAM O QUE RESTOU DE TI",
  "MAIS UM CONDENADO A DORMIR ENTRE AS RAÍZES",
  "O ENXAME NUNCA PERGUNTA QUEM VOCÊ FOI",
  "SEU FIM É APENAS O PRINCÍPIO DE MAIS UMA ONDA",
  "OS ABUTRES DO ABISMO NÃO SABEM O QUE É PRESSA",
  "VOCÊ TROPEÇOU NOS OSSOS DE QUEM VEIO ANTES",
  "O CICLO DE DENTES E GARRAS NÃO CONHECE PIEDADE",
  "SEU NOME AFUNDA ONDE OS OLHOS NÃO ALCANÇAM",
  "O PESO DE MIL GARRAS SELOU SEU DESTINO",
  "BEM-VINDO AO ABRAÇO DOS CONDENADOS"
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
  const arsenal = new Map((player.weapons || []).map(w => [w.type, { ...w, level: w.count || 1 }]));
  for (const [type, item] of player.inventory?.weapons || []) {
    arsenal.set(type, { ...arsenal.get(type), ...item, type });
  }
  if (arsenal.size) {
    arsenal.forEach(w => {
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
        level: w.level || w.count || 1,
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
  if (player.critCardCount || player.critChance > 0.05) passives.push(`Foco Letal (${Math.round(player.critChance * 100)}%)`);
  if (player.hasteCardCount || (player.cooldownReduction || 0) > 0) passives.push('Fúria Rápida');
  if (player.ultCooldownCount) passives.push('Ímpeto Supremo');
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
    const cleanName = killerName.replace(/\s*\(Elite\)/i, '').trim().toLowerCase();
    bestiaryEntry = BESTIARY_ENTRIES.find(b => 
      b.name.toLowerCase() === cleanName || 
      cleanName.includes(b.name.toLowerCase()) || 
      b.name.toLowerCase().includes(cleanName)
    );
  }

  let finalKillerName = killerName || 'A Horda do Abismo';
  if (bestiaryEntry) {
    const isElite = killerName && killerName.includes('(Elite)');
    finalKillerName = isElite ? `${bestiaryEntry.name} (Elite)` : bestiaryEntry.name;
  }

  const killerTitle = bestiaryEntry ? bestiaryEntry.title : (category === 'BOSS' ? 'Soberano do Abismo' : (category === 'MINIBOSS' ? 'Terror da Arena' : 'Cria das Sombras'));
  const killerColor = bestiaryEntry?.color || (category === 'BOSS' ? '#8e44ad' : (category === 'MINIBOSS' ? '#e67e22' : '#ff4757'));

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
        iconSvg = renderIcon('skull', { size: 28, color: '#ff4757' });
        tacticText = "Evite ser encurralado contra as extremidades da arena. Utilize o empurrão das armas para abrir brechas no cerco dos monstros.";
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
    killerName: (deathContext && deathContext.name) ? deathContext.name : (lastAttackerName || 'A Horda do Abismo'),
    killerCategory: (deathContext && deathContext.category) ? deathContext.category : 'HORDE',
    killerAttack: (deathContext && deathContext.attackName) ? deathContext.attackName : 'Golpe Melee Fatal',
    lethalDmg: (deathContext && deathContext.damage > 0) ? `-${deathContext.damage} Dano` : 'Golpe Fatal',
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
  const randomVerdict = DEATH_VERDICTS[Math.floor(Math.random() * DEATH_VERDICTS.length)];
  const titleElem = document.getElementById('death-verdict-title');
  if (titleElem) {
    titleElem.innerText = randomVerdict;
  }

  // 4. Resolução da Causa Mortis (O Algoz e Golpe Fatal)
  const killerName = pendingDeathPayload ? pendingDeathPayload.killerName : ((deathContext && deathContext.name) ? deathContext.name : (lastAttackerName || 'A Horda do Abismo'));
  const killerCategory = pendingDeathPayload ? pendingDeathPayload.killerCategory : ((deathContext && deathContext.category) ? deathContext.category : 'HORDE');
  const killerAttack = pendingDeathPayload ? pendingDeathPayload.killerAttack : ((deathContext && deathContext.attackName) ? deathContext.attackName : 'Golpe Melee Fatal');
  const lethalDmg = pendingDeathPayload ? pendingDeathPayload.lethalDmg : ((deathContext && deathContext.damage > 0) ? `-${deathContext.damage} Dano` : 'Golpe Fatal');
  const enemyType = pendingDeathPayload ? pendingDeathPayload.enemyType : (deathContext ? deathContext.enemyType : null);

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
      formattedDmg = `-${dmgVal} Dano (${pct}% do HP)`;
    }
    lethalDamageElem.innerText = formattedDmg;
  }

  const tacticDescElem = document.getElementById('death-tactic-text');
  if (tacticDescElem) {
    tacticDescElem.innerText = (pendingDeathPayload && pendingDeathPayload.tacticTip) || (deathContext && deathContext.tacticTip) || tacticText;
  }

  // 5. Estatísticas da Partida (Biometria em Badges Transparentes)
  const timerElem = document.getElementById('timer-val');
  const survivalTime = (timerElem && typeof timerElem.innerText === 'string' && timerElem.innerText.trim()) ? timerElem.innerText.trim() : '00:00';

  const waveElem = document.getElementById('wave-banner');
  const rawWaveStr = (waveElem && typeof waveElem.innerText === 'string') ? waveElem.innerText : '';
  const waveText = rawWaveStr.includes(':') ? rawWaveStr.split(':')[0].trim() : (rawWaveStr.trim() || 'Horda');


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
  const waveMatch = (waveText || '').match(/\d+/);
  const currentWaveNum = waveMatch ? parseInt(waveMatch[0], 10) : 1;
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
    waveText: waveText || `Onda ${currentWaveNum}`,
    time: survivalTime,
    seconds: survivalSecs,
    kills: gameState.kills,
    level: player.level,
    souls: getPersistentGold(),
    weapons: playerWeapons,
    passives: playerPassives,
    verdictTitle: `ÚLTIMO SUSPIRO NA ONDA ${currentWaveNum}`,
    verdictSub: killerName ? `Caiu perante ${killerName}` : randomVerdict
  });

  if (recordResult && recordResult.bestRun) {
    recordRunStats({ score: recordResult.bestRun.score });
  }

  // 6.5. Arsenal Resumido da Partida (Linha Compacta de Armas & Evoluções)
  const arsenalContainer = document.getElementById('death-arsenal-container');
  const arsenalStrip = document.getElementById('death-arsenal-strip');
  if (arsenalContainer && arsenalStrip) {
    if (playerWeapons && playerWeapons.length > 0) {
      arsenalStrip.innerHTML = playerWeapons.map(w => `
        <div class="death-arsenal-pill ${w.evolved ? 'is-evolved' : ''}" title="${w.name} (${w.evolved ? 'Evoluída' : `Nv. ${w.level}`})">
          ${renderIcon(w.iconKey || 'sword', { size: 13, color: w.evolved ? '#ffd166' : '#ecf0f1' })}
          <span class="death-arsenal-pill-name">${w.name}</span>
          <span class="death-arsenal-pill-lvl">${w.evolved ? '★' : `Nv.${w.level}`}</span>
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
  const bossVictoryBonus = 1500;
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
      souls: getPersistentGold(),
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

  const ledger = victoryLedger(matchStartGold, beforeBonus, getPersistentGold(), bossVictoryBonus);
  const totalEarnedInRun = ledger.total;

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
  if (waveSoulsElem) waveSoulsElem.innerText = `+${ledger.collected.toLocaleString('pt-BR')}`;

  const killsSoulsElem = document.getElementById('victory-kills-souls');
  if (killsSoulsElem) killsSoulsElem.innerText = `+${ledger.achievements.toLocaleString('pt-BR')}`;

  const bossSoulsElem = document.getElementById('victory-boss-souls');
  if (bossSoulsElem) bossSoulsElem.innerText = `+${bossVictoryBonus.toLocaleString('pt-BR')}`;

  const totalSoulsElem = document.getElementById('victory-total-earned-souls');
  if (totalSoulsElem) totalSoulsElem.innerText = `+${totalEarnedInRun.toLocaleString('pt-BR')} almas`;

  const vaultSoulsElem = document.getElementById('victory-vault-gold');
  if (vaultSoulsElem) vaultSoulsElem.innerText = getPersistentGold().toLocaleString('pt-BR');

  const talentsBtnBadge = document.getElementById('victory-talents-souls-badge');
  if (talentsBtnBadge) talentsBtnBadge.innerText = `+${totalEarnedInRun.toLocaleString('pt-BR')} almas`;

  // 10. Biometria da Partida (5 Badges)
  const metricsStream = document.getElementById('victory-metrics-stream');
  if (metricsStream) {
    metricsStream.innerHTML = `
      <div class="victory-metric-pill">
        <div class="victory-pill-header">
          <svg class="death-pill-icon" viewBox="0 0 24 24" width="12" height="12" style="color:#ffd166;"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" stroke-width="2"/></svg>
          <span>SOBREVIVÊNCIA</span>
        </div>
        <span class="victory-pill-value">${survivalTime}</span>
      </div>

      <div class="victory-metric-pill">
        <div class="victory-pill-header">
          ${renderIcon('wave_swords', { size: 12, color: '#f1c40f' })}
          <span>HORDA</span>
        </div>
        <span class="victory-pill-value highlight-gold">Onda 10 ★</span>
      </div>

      <div class="victory-metric-pill">
        <div class="victory-pill-header">
          ${renderIcon('skull', { size: 12, color: '#ff4757' })}
          <span>ABATES</span>
        </div>
        <span class="victory-pill-value highlight-crimson" id="victory-kills-val">0</span>
      </div>

      <div class="victory-metric-pill">
        <div class="victory-pill-header">
          ${renderIcon('sparkle', { size: 12, color: '#f1c40f' })}
          <span>PODER</span>
        </div>
        <span class="victory-pill-value">Nv. ${player.level}</span>
      </div>

      <div class="victory-metric-pill">
        <div class="victory-pill-header">
          ${renderIcon('boss_crown', { size: 12, color: '#ffd166' })}
          <span>CHEFES</span>
        </div>
        <span class="victory-pill-value highlight-gold">4 / 4 PURGADOS</span>
      </div>
    `;
  }

  // 11. Vitrine do Arsenal: Armas e Passivas
  const heroNameElem = document.getElementById('victory-hero-name');
  if (heroNameElem) {
    heroNameElem.innerText = `${currentHeroDef.name || 'Sir Roland'} • Nv. ${player.level}`;
  }

  const evolvedCounterElem = document.getElementById('victory-evolved-counter');
  if (evolvedCounterElem) {
    evolvedCounterElem.innerText = `${evolvedCount} Arma${evolvedCount !== 1 ? 's' : ''} Evoluída${evolvedCount !== 1 ? 's' : ''}`;
  }

  const weaponsContainer = document.getElementById('victory-weapons-container');
  if (weaponsContainer) {
    if (playerWeapons.length === 0) {
      weaponsContainer.innerHTML = '<span style="font-size:11px;color:#888;">Nenhuma arma registrada</span>';
    } else {
      weaponsContainer.innerHTML = playerWeapons.map(w => `
        <div class="build-weapon-card ${w.evolved ? 'is-evolved' : ''}">
          <div class="build-weapon-icon-box">
            ${renderIcon(w.iconKey || 'sword', { size: 20, color: w.evolved ? '#ffd166' : '#ecf0f1' })}
          </div>
          <div class="build-weapon-info">
            <span class="build-weapon-name" title="${w.name}">${w.name}</span>
            <div class="build-weapon-status">
              <span class="build-weapon-lvl">${w.evolved ? 'Nv. MAX' : `Nv. ${w.level}`}</span>
              ${w.evolved ? '<span class="build-weapon-badge-evolved">★ EVOLUÍDA</span>' : ''}
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  const passivesContainer = document.getElementById('victory-passives-container');
  if (passivesContainer) {
    if (playerPassives.length === 0) {
      passivesContainer.innerHTML = '<span class="build-passive-pill" style="opacity:0.6;">Sem bênçãos passivas ativas</span>';
    } else {
      passivesContainer.innerHTML = playerPassives.map(p => `
        <span class="build-passive-pill">${p}</span>
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
            ${renderIcon('boss_crown', { size: 14, color: '#ffd166' })} NOVO RECORDE HISTÓRICO SUPREMO!
          </div>
          <div class="death-ach-item" style="color: #f1f5f9;">
            Sua vitória consagrou <b>${recordResult.bestRun.score.toLocaleString('pt-BR')} Pontos</b> no Monumento do Grimório!
          </div>
        </div>
      `;
    }
    if (newlyUnlocked && newlyUnlocked.length > 0) {
      achHtml += `
        <div class="death-ach-card" style="border-color: rgba(46, 204, 113, 0.6);">
          <div class="death-ach-header" style="color: #2ecc71;">
            ${renderIcon('sparkle', { size: 14, color: '#2ecc71' })} CONQUISTAS DESBLOQUEADAS!
          </div>
          ${newlyUnlocked.map(a => `
            <div class="death-ach-item">
              <b>${a.title}</b>: ${a.heroTitle ? `Despertou <b>${a.heroTitle}</b> no Altar!` : a.desc}
            </div>
          `).join('')}
        </div>
      `;
    }
    achContainer.innerHTML = achHtml ? `<details class="victory-honors"><summary>${renderIcon('sparkle', { size: 14, color: '#ffd166' })}<span>${recordResult?.isNewBest ? 'Novo recorde pessoal' : 'Honras da partida'}${newlyUnlocked.length ? ' · ' + newlyUnlocked.length + ' conquistas desbloqueadas' : ''}</span><span class="victory-honors-hint">VER</span></summary><div class="victory-honors-content">${achHtml}</div></details>` : '';
  }

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
