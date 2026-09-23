import { player, selectedHeroKey, registerWeaponInInventory, registerPassiveInInventory, addPersistentGold } from '../entities/player.js';
import { getAvailableSynergies } from './items.js';

export const upgradesPool = [
  // --- Aprimoramentos do Machado (Kragdor) ---
  {
    id: 'axe_speed',
    title: "Turbilhão Violento",
    rarity: "card-rare",
    badge: "Machado",
    desc: "Acelera sutilmente a órbita do machado e reforça o fio da lâmina",
    getStat: () => `+0.005 Vel Órbita / +4% Dano • Nv. ${((player.axeSpeedCount || 0) + 1)}`,
    stat: "+0.005 Vel Órbita / +4% Dano",
    apply: () => {
      player.axeSpeedCount = (player.axeSpeedCount || 0) + 1;
      player.axeSpinSpeed = (player.axeSpinSpeed || 0.085) + 0.005;
      const w = player.weapons.find(wp => wp.type === 'AXE');
      if (w) w.damageMult += 0.04;
    },
    isAvailable: () => !player.evolvedAxe && player.weapons.some(w => w.type === 'AXE')
  },
  {
    id: 'axe_extra',
    title: "Machado Adicional",
    rarity: "card-legendary",
    badge: "Machado",
    desc: "Adiciona +1 machado ao anel orbital que translada ao redor do bárbaro",
    getStat: () => `+1 Machado no Anel (${(player.axeCount || 1) + 1}/4)`,
    stat: "+1 Machado no Anel (Máx: 4)",
    apply: () => {
      player.axeCount = (player.axeCount || 1) + 1;
      const w = player.weapons.find(wp => wp.type === 'AXE');
      if (w) {
        w.count = player.axeCount;
      }
      registerWeaponInInventory('AXE', player.axeCount);
    },
    isAvailable: () => !player.evolvedAxe && player.weapons.some(w => w.type === 'AXE') && (player.axeCount || 1) < 4
  },
  {
    id: 'axe_radius',
    title: "Gume Pesado",
    rarity: "card-rare",
    badge: "Machado",
    desc: "Amplia o raio orbital do machado e o dano de impacto",
    getStat: () => (player.axeRadius || 56) < 120 ? `+6px Raio / +10% Dano • Nv. ${((player.axeRadiusCount || 0) + 1)}` : `+10% Dano do Machado • Nv. ${((player.axeRadiusCount || 0) + 1)}`,
    stat: "+6px Raio / +10% Dano",
    apply: () => {
      player.axeRadiusCount = (player.axeRadiusCount || 0) + 1;
      if ((player.axeRadius || 56) < 120) {
        player.axeRadius = Math.min(120, (player.axeRadius || 56) + 6);
      }
      const w = player.weapons.find(wp => wp.type === 'AXE');
      if (w) w.damageMult += 0.10;
    },
    isAvailable: () => !player.evolvedAxe && player.weapons.some(w => w.type === 'AXE')
  },

  // --- Aprimoramentos das Poções (Valéria) ---
  {
    id: 'potion_volley',
    title: "Salvo Alquímico",
    rarity: "card-legendary",
    badge: "Poção",
    desc: "Arremessa +1 frasco cáustico extra rigorosamente no mesmo epicentro da poça gigante",
    getStat: () => `+1 Frasco Concentrado (${(player.weapons.find(wp => wp.type === 'POTION')?.count || 1) + 1}/4)`,
    stat: "+1 Frasco Concentrado (Máx: 4)",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'POTION');
      if (w) {
        w.count += 1;
      }
      player.projectiles = (w ? w.count : 1);
      registerWeaponInInventory('POTION', w ? w.count : 1);
    },
    isAvailable: () => !player.evolvedPotion && player.weapons.some(w => w.type === 'POTION') && (player.weapons.find(wp => wp.type === 'POTION')?.count || 1) < 4
  },
  {
    id: 'potion_potency',
    title: "Superposição Cáustica",
    rarity: "card-rare",
    badge: "Poção",
    desc: "Aumenta o dano corrosivo e a área de contaminação das poças ácidas",
    getStat: () => `+5% Dano & +3% Área • Nv. ${((player.weapons.find(wp => wp.type === 'POTION')?.potencyCount || 0) + 1)}`,
    stat: "+5% Dano & +3% Área",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'POTION');
      if (w) {
        w.damageMult += 0.05;
        w.potencyCount = (w.potencyCount || 0) + 1;
        w.areaBonus = (w.areaBonus || 1.0) + 0.03;
      }
    },
    isAvailable: () => !player.evolvedPotion && player.weapons.some(w => w.type === 'POTION')
  },

  // --- Aprimoramentos do Cajado (Ignis) ---
  {
    id: 'staff_projectiles',
    title: "Cajado da Tormenta",
    rarity: "card-rare",
    badge: "Cajado",
    desc: "+1 Esfera mágica concentrada canalizada contra os alvos avistados",
    getStat: () => `+1 Orbe Místico (${(player.weapons.find(wp => wp.type === 'STAFF')?.count || 1) + 1}/5)`,
    stat: "+1 Orbe Místico (Máx: 5)",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'STAFF');
      if (w) {
        w.count += 1;
      }
      registerWeaponInInventory('STAFF', w ? w.count : 1);
    },
    isAvailable: () => !player.evolvedStaff && player.weapons.some(w => w.type === 'STAFF') && (player.weapons.find(wp => wp.type === 'STAFF')?.count || 1) < 5
  },
  {
    id: 'staff_pierce',
    title: "Poder da Fênix",
    rarity: "card-rare",
    badge: "Cajado",
    desc: "As esferas do cajado perfuram +1 inimigo e ampliam o rastro de queimadura",
    getStat: () => `+1 Perfuração Arcana (${(player.staffPierceBonus || 0) + 1}/3)`,
    stat: "+1 Perfuração Arcana (Máx: 3)",
    apply: () => {
      player.staffPierceBonus = (player.staffPierceBonus || 0) + 1;
      const w = player.weapons.find(wp => wp.type === 'STAFF');
      if (w) w.damageMult += 0.08;
    },
    isAvailable: () => !player.evolvedStaff && player.weapons.some(w => w.type === 'STAFF') && (player.staffPierceBonus || 0) < 3
  },

  // --- Aprimoramentos das Espadas (Kael) ---
  {
    id: 'sword_extra',
    title: "Lâminas Espirituais",
    rarity: "card-rare",
    badge: "Lâminas",
    desc: "+1 Espada espectral adicional arremessada contra oponentes avistados",
    getStat: () => `+1 Lâmina Espectral (${(player.weapons.find(wp => wp.type === 'SWORD')?.count || 1) + 1}/5)`,
    stat: "+1 Lâmina Espectral (Máx: 5)",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'SWORD');
      if (w) {
        w.count += 1;
      }
      player.projectiles = (w ? w.count : 1);
      registerWeaponInInventory('SWORD', w ? w.count : 1);
    },
    isAvailable: () => !player.evolvedSword && player.weapons.some(w => w.type === 'SWORD') && (player.weapons.find(wp => wp.type === 'SWORD')?.count || 1) < 5
  },
  {
    id: 'sword_speed',
    title: "Gume Astral",
    rarity: "card-rare",
    badge: "Lâminas",
    desc: "+6% de velocidade de voo e +8% de dano letal para as espadas teleguiadas",
    getStat: () => `+6% Voo & +8% Dano • Nv. ${((player.weapons.find(wp => wp.type === 'SWORD')?.swordSpeedCount || 0) + 1)}`,
    stat: "+6% Voo & +8% Dano",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'SWORD');
      if (w) {
        w.damageMult += 0.08;
        w.swordSpeedCount = (w.swordSpeedCount || 0) + 1;
        w.flightSpeedBonus = (w.flightSpeedBonus || 1.0) + 0.06;
      }
    },
    isAvailable: () => !player.evolvedSword && player.weapons.some(w => w.type === 'SWORD')
  },

  // --- Aprimoramentos do Martelo (Sir Roland) ---
  {
    id: 'hammer_crush',
    title: "Fenda Sísmica",
    rarity: "card-rare",
    badge: "Martelo",
    desc: "Aumenta o raio do impacto sísmico 360° em +24px e amplifica o estilhaço de rochas",
    getStat: () => `+24px Raio Sísmico (${(player.weapons.find(wp => wp.type === 'HAMMER')?.count || 1) + 1}/4)`,
    stat: "+24px Raio Sísmico (Máx: 4)",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'HAMMER');
      if (w) {
        w.count += 1;
        w.damageMult += 0.30;
      }
      registerWeaponInInventory('HAMMER', w ? w.count : 1);
    },
    isAvailable: () => !player.evolvedHammer && player.weapons.some(w => w.type === 'HAMMER') && (player.weapons.find(wp => wp.type === 'HAMMER')?.count || 1) < 4
  },
  {
    id: 'hammer_impact',
    title: "Golpe Demolidor",
    rarity: "card-rare",
    badge: "Martelo",
    desc: "O martelo golpeia com +12% de dano de esmagamento no epicentro e fissuras frontais",
    getStat: () => `+12% Dano Esmagador • Nv. ${((player.weapons.find(wp => wp.type === 'HAMMER')?.impactCount || 0) + 1)}`,
    stat: "+12% Dano Esmagador",
    apply: () => {
      const w = player.weapons.find(wp => wp.type === 'HAMMER');
      if (w) {
        w.damageMult += 0.12;
        w.impactCount = (w.impactCount || 0) + 1;
      }
    },
    isAvailable: () => !player.evolvedHammer && player.weapons.some(w => w.type === 'HAMMER')
  },

  // --- Passivas Universais de Atributos (Infinitas na Run) ---
  {
    id: 'frost_passive',
    title: "Golpe Criogênico",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "Aumenta a chance e a duração do congelamento que desacelera monstros atingidos",
    getStat: () => `+6% Lentidão / +0.25s • Nv. ${((player.frostCardCount || 0) + 1)}`,
    stat: "+6% Lentidão / +0.25s",
    apply: () => {
      player.frostCardCount = (player.frostCardCount || 0) + 1;
      player.slowChance = Math.min(0.75, (player.slowChance || 0) + 0.06);
      player.slowDurationBonus = (player.slowDurationBonus || 0) + 0.25;
      registerPassiveInInventory('frost_passive', 1, { stacks: player.frostCardCount });
    },
    isAvailable: () => true
  },
  {
    id: 'dmg',
    title: "Poder Bruto",
    rarity: "card-common",
    badge: "Passiva",
    desc: "Aumenta o dano global de todas as armas e habilidades do herói em +5%",
    getStat: () => `+5% Dano Global • Nv. ${((player.damageCardCount || 0) + 1)}`,
    stat: "+5% Dano Global",
    apply: () => { 
      player.damagePercentBonus = (player.damagePercentBonus || 0) + 0.05;
      player.damageCardCount = (player.damageCardCount || 0) + 1;
      player.hasPowerPassive = true; 
      registerPassiveInInventory('dmg', 1, { stacks: player.damageCardCount });
    },
    isAvailable: () => true
  },
  {
    id: 'haste',
    title: "Fúria Rápida",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "Acelera a cadência de ataque reduzindo a recarga das armas (ou converte em dano ao atingir o teto)",
    getStat: () => (player.cooldownReduction || 0) < 0.55 ? `-5% Recarga • Nv. ${((player.hasteCardCount || 0) + 1)}` : `+6% Dano de Armas • Nv. ${((player.hasteCardCount || 0) + 1)}`,
    stat: "-5% Recarga",
    apply: () => {
      player.hasteCardCount = (player.hasteCardCount || 0) + 1;
      if ((player.cooldownReduction || 0) < 0.55) {
        player.cooldownReduction = Math.min(0.55, (player.cooldownReduction || 0) + 0.05);
        player.attackCooldown = Math.max(10, Math.floor(player.attackCooldown * 0.95));
        player.weapons.forEach(w => {
          w.cooldown = Math.max(10, Math.floor(w.cooldown * 0.95));
        });
      } else {
        player.weapons.forEach(w => {
          w.damageMult += 0.06;
        });
      }
      registerPassiveInInventory('haste', 1, { stacks: player.hasteCardCount });
    },
    isAvailable: () => selectedHeroKey !== 'BARBARIAN'
  },
  {
    id: 'ult_cooldown',
    title: "Ímpeto Supremo",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "Acelera a convergência astral, reduzindo o tempo de recarga da habilidade suprema (ULT) em 5%",
    getStat: () => `-5% Recarga ULT • Nv. ${((player.ultCooldownCount || 0) + 1)}`,
    stat: "-5% Recarga ULT",
    apply: () => {
      player.ultCooldownCount = (player.ultCooldownCount || 0) + 1;
      player.skillMaxCd = Math.max(60, Math.round(player.skillMaxCd * 0.95));
      player.skillCd = Math.min(player.skillCd, player.skillMaxCd);
      registerPassiveInInventory('ult_cooldown', 1, { stacks: player.ultCooldownCount });
    },
    isAvailable: () => (player.skillMaxCd || 420) > 60
  },
  {
    id: 'wings',
    title: "Asas do Vento",
    rarity: "card-common",
    badge: "Passiva",
    desc: "Acelera a locomoção do herói de forma suave e controlada",
    getStat: () => `+0.18 Velocidade • Nv. ${((player.wingsCardCount || 0) + 1)}`,
    stat: "+0.18 Velocidade",
    apply: () => { 
      player.wingsCardCount = (player.wingsCardCount || 0) + 1;
      player.baseSpeed += 0.18; 
      player.speed = player.invisTimer > 0 ? player.baseSpeed * 2 : player.baseSpeed; 
      player.hasWingsPassive = true; 
      registerPassiveInInventory('wings', 1, { stacks: player.wingsCardCount });
    },
    isAvailable: () => true
  },
  {
    id: 'crit',
    title: "Foco Letal",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "Aumenta as chances e o multiplicador de dano dos acertos críticos",
    getStat: () => `+4% Chance / +0.10 Mult • Nv. ${((player.critCardCount || 0) + 1)}`,
    stat: "+4% Chance / +0.10 Mult",
    apply: () => { 
      player.critCardCount = (player.critCardCount || 0) + 1;
      player.critChance = Math.min(0.85, player.critChance + 0.04); 
      player.critMult += 0.10; 
      registerPassiveInInventory('crit', 1, { stacks: player.critCardCount });
    },
    isAvailable: () => true
  },
  {
    id: 'magnet',
    title: "Ímã Titânico",
    rarity: "card-common",
    badge: "Passiva",
    desc: "Aumenta o alcance de atração gravitacional de gemas e tesouros",
    getStat: () => `+30px Raio de Atração • Nv. ${((player.magnetCardCount || 0) + 1)}`,
    stat: "+30px Raio de Atração",
    apply: () => {
      player.magnetCardCount = (player.magnetCardCount || 0) + 1;
      player.magnet += 30;
      registerPassiveInInventory('magnet', 1, { stacks: player.magnetCardCount });
    },
    isAvailable: () => true
  },
  {
    id: 'aura',
    title: "Aura Sagrada",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "Campo sagrado de dano constante ao redor do herói",
    getStat: () => `+1 Nível de Aura (${player.auraLvl + 1}/5)`,
    stat: "+1 Nível de Aura (Máx: 5)",
    apply: () => {
      player.auraLvl += 1;
      registerWeaponInInventory('aura', player.auraLvl);
    },
    isAvailable: () => player.auraLvl < 5 && !player.evolvedAura
  },
  {
    id: 'orbitals',
    title: "Bíblias Protetoras",
    rarity: "card-rare",
    badge: "Passiva",
    desc: "Tomos celestiais giram em órbita protetora repelindo oponentes com impacto suave",
    getStat: () => `+1 Tomo Orbital (${player.orbitals + 1}/3)`,
    stat: "+1 Tomo Orbital (Máx: 3)",
    apply: () => {
      player.orbitals += 1;
      registerWeaponInInventory('orbitals', player.orbitals);
    },
    isAvailable: () => player.orbitals < 3 && !player.evolvedOrbitals
  },
  {
    id: 'armor',
    title: "Armadura Rúnica",
    rarity: "card-common",
    badge: "Passiva",
    desc: "Reforça a carcaça, eleva a vitalidade máxima e recupera a mesma quantia de vida",
    getStat: () => `+30 HP Máximo • Nv. ${((player.armorCardCount || 0) + 1)}`,
    stat: "+30 HP Máximo",
    apply: () => { 
      player.armorCardCount = (player.armorCardCount || 0) + 1;
      player.maxHp += 30; 
      player.hp += 30; 
      player.hasArmorPassive = true; 
      registerPassiveInInventory('armor', 1, { stacks: player.armorCardCount });
    },
    isAvailable: () => true
  },
  {
    id: 'heal',
    title: "Poção Alquímica",
    rarity: "card-common",
    badge: "Utilidade",
    desc: "Recupera imediatamente parte vital das feridas",
    getStat: () => "Cura 65% do HP",
    stat: "Cura 65% do HP",
    apply: () => player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.65 * (player.healingMultiplier !== undefined ? player.healingMultiplier : 1.0)),
    isAvailable: () => player.hp < player.maxHp * 0.95
  }
];

// ============================================================================
// CARTAS DO DESTINO (PACTOS AMALDIÇOADOS DE ALTO IMPACTO)
// ============================================================================
export const destinyCardsPool = [
  {
    id: 'destiny_berserker',
    isDestinyCard: true,
    title: "Pacto do Berserker",
    rarity: "card-cursed",
    badge: "Pacto Proibido",
    desc: "Sacrifica metade da vitalidade máxima em troca de fúria ofensiva avassaladora.",
    bonusText: "+65% Dano Global",
    penaltyText: "Vida Máxima reduzida em 50%",
    stat: "+65% Dano | -50% HP Máx",
    apply: () => {
      player.damagePercentBonus = (player.damagePercentBonus || 0) + 0.65;
      player.maxHp = Math.max(35, Math.round(player.maxHp * 0.50));
      player.hp = Math.min(player.hp, player.maxHp);
      player.destinyPacts = player.destinyPacts || [];
      player.destinyPacts.push({
        id: 'destiny_berserker',
        title: "Pacto do Berserker",
        bonus: "+65% Dano Global",
        penalty: "Vida Máxima -50%"
      });
    },
    isAvailable: () => !player.destinyPacts || !player.destinyPacts.some(p => p.id === 'destiny_berserker')
  },
  {
    id: 'destiny_titan',
    isDestinyCard: true,
    title: "Coração de Titã",
    rarity: "card-cursed",
    badge: "Pacto Proibido",
    desc: "Forja um corpo maciço e impenetrável que se arrasta pesadamente pela arena.",
    bonusText: "+195 HP Máximo",
    penaltyText: "-30% Velocidade de Movimento",
    stat: "+195 HP Máx | -30% Velocidade",
    apply: () => {
      player.maxHp += 195;
      player.hp += 195;
      player.baseSpeed = Math.max(1.2, player.baseSpeed * 0.70);
      player.speed = player.invisTimer > 0 ? player.baseSpeed * 2 : player.baseSpeed;
      player.destinyPacts = player.destinyPacts || [];
      player.destinyPacts.push({
        id: 'destiny_titan',
        title: "Coração de Titã",
        bonus: "+195 HP Máximo",
        penalty: "-30% Velocidade"
      });
    },
    isAvailable: () => !player.destinyPacts || !player.destinyPacts.some(p => p.id === 'destiny_titan')
  },
  {
    id: 'destiny_arcane_frenzy',
    isDestinyCard: true,
    title: "Tormenta Arcana",
    rarity: "card-cursed",
    badge: "Pacto Proibido",
    desc: "Armas atacam com velocidade frenética, mas o tempo de invulnerabilidade após sofrer dano cai pela metade e os inimigos causam mais dano.",
    bonusText: "-30% Recarga de Armas",
    penaltyText: "Tempo de Invulnerabilidade pós-dano -50% & Inimigos causam +25% Dano",
    stat: "-30% Recarga | Invulnerabilidade pós-dano -50% & Inimigos +25% Dano",
    apply: () => {
      player.cooldownReduction = Math.min(0.65, (player.cooldownReduction || 0) + 0.15);
      player.attackCooldown = Math.max(8, Math.floor(player.attackCooldown * 0.70));
      player.weapons.forEach(w => { w.cooldown = Math.max(8, Math.floor(w.cooldown * 0.70)); });
      player.iFramesDurationMult = (player.iFramesDurationMult || 1.0) * 0.5;
      player.damageTakenMultiplier = (player.damageTakenMultiplier || 1.0) * 1.25;
      player.destinyPacts = player.destinyPacts || [];
      player.destinyPacts.push({
        id: 'destiny_arcane_frenzy',
        title: "Tormenta Arcana",
        bonus: "-30% Recarga de Armas",
        penalty: "Tempo de Invulnerabilidade pós-dano -50% & Inimigos +25% Dano"
      });
    },
    isAvailable: () => !player.destinyPacts || !player.destinyPacts.some(p => p.id === 'destiny_arcane_frenzy')
  },
  {
    id: 'destiny_midas',
    isDestinyCard: true,
    title: "Cobiça Maldita de Midas",
    rarity: "card-cursed",
    badge: "Pacto Proibido",
    desc: "Multiplica o tesouro colhido e atrai essências de longe, mas os monstros atacam com ferocidade.",
    bonusText: "+100% Ouro & +150px Raio de Atração",
    penaltyText: "Monstros causam +30% de Dano",
    stat: "+100% Ouro & +150px Ímã | Inimigos +30% Dano",
    apply: () => {
      player.goldMultiplier = (player.goldMultiplier || 1.0) * 2.0;
      player.magnet += 150;
      player.damageTakenMultiplier = (player.damageTakenMultiplier || 1.0) * 1.30;
      player.destinyPacts = player.destinyPacts || [];
      player.destinyPacts.push({
        id: 'destiny_midas',
        title: "Cobiça Maldita de Midas",
        bonus: "+100% Ouro & +150px Ímã",
        penalty: "Inimigos +30% Dano"
      });
    },
    isAvailable: () => !player.destinyPacts || !player.destinyPacts.some(p => p.id === 'destiny_midas')
  },
  {
    id: 'destiny_executioner',
    isDestinyCard: true,
    title: "Olho do Algoz",
    rarity: "card-cursed",
    badge: "Pacto Proibido",
    desc: "Acertos críticos tornam-se devastadores, mas ataques não-críticos perdem potência.",
    bonusText: "+35% Chance Crítica & +0.70x Mult Crítico",
    penaltyText: "Dano não-crítico reduzido em 40%",
    stat: "+35% Crítico & +0.7x Mult | Dano Comum -40%",
    apply: () => {
      player.critChance = Math.min(0.95, (player.critChance || 0.15) + 0.35);
      player.critMult = (player.critMult || 1.5) + 0.70;
      player.nonCritDamageMult = (player.nonCritDamageMult || 1.0) * 0.60;
      player.destinyPacts = player.destinyPacts || [];
      player.destinyPacts.push({
        id: 'destiny_executioner',
        title: "Olho do Algoz",
        bonus: "+35% Crítico & +0.7x Mult",
        penalty: "Golpes Comuns -40%"
      });
    },
    isAvailable: () => !player.destinyPacts || !player.destinyPacts.some(p => p.id === 'destiny_executioner')
  },
  {
    id: 'destiny_spectral',
    isDestinyCard: true,
    title: "Dança Espectral",
    rarity: "card-cursed",
    badge: "Pacto Proibido",
    desc: "Passos velozes e ágeis para desviar da horda, ao custo da eficácia de curas na arena.",
    bonusText: "+35% Velocidade de Movimento",
    penaltyText: "Cura de itens e poções reduzida em 60%",
    stat: "+35% Velocidade | Curas do Mapa -60%",
    apply: () => {
      player.baseSpeed = player.baseSpeed * 1.35;
      player.speed = player.invisTimer > 0 ? player.baseSpeed * 2 : player.baseSpeed;
      player.healingMultiplier = (player.healingMultiplier || 1.0) * 0.40;
      player.destinyPacts = player.destinyPacts || [];
      player.destinyPacts.push({
        id: 'destiny_spectral',
        title: "Dança Espectral",
        bonus: "+35% Velocidade",
        penalty: "Curas do Mapa -60%"
      });
    },
    isAvailable: () => !player.destinyPacts || !player.destinyPacts.some(p => p.id === 'destiny_spectral')
  },
  {
    id: 'destiny_temporal_rift',
    isDestinyCard: true,
    title: "Pacto da Fenda Temporal",
    rarity: "card-cursed",
    badge: "Pacto Proibido",
    desc: "Dobra o fluxo temporal para recuperar sua habilidade suprema em ritmo vertiginoso, ao custo da potência destrutiva de todas as suas armas convencionais.",
    bonusText: "-40% Tempo de Recarga da ULT",
    penaltyText: "-25% Dano das Armas Convencionais",
    stat: "-40% Recarga ULT | Armas -25% Dano",
    apply: () => {
      player.skillMaxCd = Math.max(120, Math.round(player.skillMaxCd * 0.60));
      player.skillCd = Math.min(player.skillCd, player.skillMaxCd);
      player.damagePercentBonus = (player.damagePercentBonus || 0) - 0.25;
      player.destinyPacts = player.destinyPacts || [];
      player.destinyPacts.push({
        id: 'destiny_temporal_rift',
        title: "Pacto da Fenda Temporal",
        bonus: "-40% Recarga da ULT",
        penalty: "Armas -25% Dano"
      });
    },
    isAvailable: () => !player.destinyPacts || !player.destinyPacts.some(p => p.id === 'destiny_temporal_rift')
  }
];

export const BLESSING_UPGRADE = {
  id: 'blessing',
  title: "Bênção da Fortuna",
  rarity: "card-legendary",
  badge: "Recompensa",
  desc: "Todos os poderes conhecidos atingiram o apogeu! Recupera vitalidade e concede ouro da arena.",
  stat: "Cura 35% HP & +15 Ouro",
  apply: () => {
    player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.35);
    addPersistentGold(15);
  },
  isAvailable: () => true
};

export function getRandomUpgrades(count, options = true) {
  const allowDestiny = typeof options === 'boolean'
    ? options
    : (options?.allowDestiny !== undefined ? Boolean(options.allowDestiny) : true);

  const availableRegular = upgradesPool.filter(opt => opt.isAvailable());

  for (let i = availableRegular.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableRegular[i], availableRegular[j]] = [availableRegular[j], availableRegular[i]];
  }

  const selected = [];

  // Sorteio de Cartas do Destino (a partir do nível 4, ~22% de chance de 1 slot ser um Pacto Amaldiçoado)
  // Exclusivo de telas de upgrade; nunca são sorteadas se allowDestiny for falso (ex: baús de tesouro)
  if (allowDestiny) {
    const availableDestiny = destinyCardsPool.filter(opt => opt.isAvailable());
    const shouldRollDestiny = (player.level >= 4) && (availableDestiny.length > 0) && (Math.random() < 0.22);

    if (shouldRollDestiny) {
      const destinyIdx = Math.floor(Math.random() * availableDestiny.length);
      selected.push(availableDestiny[destinyIdx]);
    }
  }

  // Preenche as vagas restantes com as opções normais
  for (let i = 0; i < availableRegular.length && selected.length < count; i++) {
    selected.push(availableRegular[i]);
  }

  // Fallback: se o jogador já maximizou os upgrades disponíveis, completa as opções com a Bênção da Fortuna
  while (selected.length < count) {
    selected.push(BLESSING_UPGRADE);
  }

  // Embaralha para que a Carta do Destino não fique sempre no primeiro slot
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected;
}

/**
 * Retorna upgrades aleatórios específicos para baús (exclui estritamente Cartas de Pacto).
 * @param {number} count Quantidade de upgrades a sortear.
 * @returns {Array} Lista de upgrades elegíveis para baús.
 */
export function getRandomChestUpgrades(count) {
  return getRandomUpgrades(count, { allowDestiny: false });
}

export function checkSynergies() {
  return getAvailableSynergies(player);
}

/**
 * Concede N níveis e upgrades aleatórios imediatos ao herói (Console Dev W+5).
 * Ativa automaticamente evoluções de armas/sinergias e restaura vida cheia.
 * @param {number} count Quantidade de níveis a conceder (1 a 100).
 */
export function grantLevels(count = 50) {
  const targetLevels = Math.max(1, Math.min(100, Math.floor(count)));

  for (let i = 0; i < targetLevels; i++) {
    // 1. Aplica qualquer sinergia/fusão disponível
    const synergies = checkSynergies();
    if (synergies && synergies.length > 0) {
      synergies[0].apply();
    }

    // 2. Coleta os upgrades disponíveis no momento
    const available = upgradesPool.filter(opt => opt.isAvailable());
    if (available.length > 0) {
      const randIdx = Math.floor(Math.random() * available.length);
      available[randIdx].apply();
    } else {
      BLESSING_UPGRADE.apply();
    }

    player.level++;
  }

  // 3. Aplica quaisquer sinergias pendentes que foram desbloqueadas
  const finalSynergies = checkSynergies();
  if (finalSynergies && finalSynergies.length > 0) {
    finalSynergies.forEach(syn => syn.apply());
  }

  // 4. Recalcula curva de XP para o novo nível
  player.nextXp = 12 + (player.level * 7) + Math.floor(Math.pow(player.level, 1.28));
  player.xp = 0;

  // 5. Restaura vida máxima total do herói
  player.hp = player.maxHp;
}

export function grant50Upgrades() {
  grantLevels(50);
}