import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getCurrentWave, WAVE_THRESHOLDS } from '../src/systems/waves.js';
import { SQUAD_TYPES } from '../src/config/squads.js';
import {
  MAX_ENEMIES,
  spawnEncirclementRing,
  spawnMobCluster,
  FPS_HEAVY_ENEMY_TYPES,
  isFpsHeavyEnemyType,
  isDesertArena,
  createEnemy
} from '../src/entities/enemies/spawner.js';
import { swarmBehavior } from '../src/systems/enemyLifecycle/behaviors/swarm.js';
import { defaultChaseBehavior } from '../src/systems/enemyLifecycle/behaviors/defaultChase.js';
import { currentArenaTheme, setCurrentArenaTheme } from '../src/state/gameState.js';
import { enemies } from '../src/state/collections.js';

describe('Calibração e Mecânicas de Horda Massiva (Hord Slayer)', () => {

  test('as taxas de spawn (rate) devem ser intensas e rápidas (<= 48 frames em todas as ondas)', () => {
    const waveCheckTimes = [0, 30, 60, 100, 140, 180, 220, 260, 300, 350];
    let prevRate = Infinity;

    waveCheckTimes.forEach((seconds, idx) => {
      const wave = getCurrentWave(seconds);
      assert.ok(wave.rate <= 48, `Onda ${wave.index} rate (${wave.rate}) deve ser <= 48 frames (~0.8s)`);
      assert.ok(wave.rate <= prevRate, `Onda ${wave.index} rate (${wave.rate}) deve ser mais rápido ou igual à anterior (${prevRate})`);
      prevRate = wave.rate;
    });

    const finalWave = getCurrentWave(350);
    assert.equal(finalWave.rate, 16, 'Onda 10 deve ter spawn contínuo a cada 16 quadros (~0.26s)');
  });

  test('o tamanho dos clusters de monstros deve ser dobrado em todas as ondas', () => {
    const wave1 = getCurrentWave(10);
    assert.deepEqual(wave1.clusterSize, [8, 14], 'Onda 1 deve ter cluster dobrado de 8 a 14 monstros');

    const wave2 = getCurrentWave(30);
    assert.deepEqual(wave2.clusterSize, [12, 18], 'Onda 2 deve ter cluster dobrado de 12 a 18 monstros');

    const wave5 = getCurrentWave(140);
    assert.deepEqual(wave5.clusterSize, [16, 24], 'Onda 5 deve ter cluster dobrado de 16 a 24 monstros');

    const wave10 = getCurrentWave(340);
    assert.deepEqual(wave10.clusterSize, [22, 32], 'Onda 10 deve ter cluster denso de 22 a 32 monstros');
  });

  test('os esquadrões táticos (squads) devem ter contingentes ampliados', () => {
    assert.equal(SQUAD_TYPES.HORDE_SCOUT.members.length, 10, 'HORDE_SCOUT deve ter 10 zumbis');
    assert.equal(SQUAD_TYPES.HORDE_RUSH.members.length, 18, 'HORDE_RUSH deve ter 18 membros');
    assert.equal(SQUAD_TYPES.PHALANX.members.length, 12, 'PHALANX deve ter 12 membros com escudo duplo e flancos');
    assert.equal(SQUAD_TYPES.SWARM_PINCER.members.length, 20, 'SWARM_PINCER deve ter 20 morcegos em pinça dupla');
    assert.equal(SQUAD_TYPES.DISRUPTION.members.length, 12, 'DISRUPTION deve ter 12 membros');
    assert.equal(SQUAD_TYPES.SIEGE_BATTERY.members.length, 8, 'SIEGE_BATTERY deve ter 8 membros');
    assert.equal(SQUAD_TYPES.EXECUTION_SQUAD.members.length, 12, 'EXECUTION_SQUAD deve ter 12 membros');
    assert.equal(SQUAD_TYPES.DEATH_PROCESSION.members.length, 14, 'DEATH_PROCESSION deve ter 14 membros');
    assert.equal(SQUAD_TYPES.SNIPER_PINCER.members.length, 10, 'SNIPER_PINCER deve ter 10 membros');
    assert.equal(SQUAD_TYPES.AMBUSH_COVEN.members.length, 13, 'AMBUSH_COVEN deve ter 13 membros');
  });

  test('teto máximo de inimigos (MAX_ENEMIES) deve ser 250 para suportar hordas massivas', () => {
    assert.equal(MAX_ENEMIES, 250, 'MAX_ENEMIES deve estar calibrado para 250 entidades simultâneas');
  });

  test('função de cerco concêntrico (spawnEncirclementRing) deve existir e estar exportada', () => {
    assert.equal(typeof spawnEncirclementRing, 'function');
  });

  test('mobs de alto impacto em FPS devem ser devidamente identificados por isFpsHeavyEnemyType', () => {
    const requiredHeavyMobs = [
      'SHOOTER',
      'SNIPER_CULTIST',
      'NECRO',
      'TOLL_BELLRINGER',
      'PLAGUE_APOTHECARY',
      'RUNE_SCRIBE',
      'FORGE_PYREGUARD',
      'CRYPT_WEAVER',
      'MIRROR_BANSHEE'
    ];

    requiredHeavyMobs.forEach(type => {
      assert.ok(isFpsHeavyEnemyType(type), `${type} deve ser reconhecido como FPS-heavy`);
      assert.ok(FPS_HEAVY_ENEMY_TYPES.has(type), `${type} deve constar no set FPS_HEAVY_ENEMY_TYPES`);
    });

    assert.equal(isFpsHeavyEnemyType('ZOMBIE'), false, 'ZOMBIE não deve ser classificado como FPS-heavy');
    assert.equal(isFpsHeavyEnemyType('BAT'), false, 'BAT não deve ser classificado como FPS-heavy');
    assert.equal(isFpsHeavyEnemyType('GOLEM'), false, 'GOLEM não deve ser classificado como FPS-heavy');
  });

  test('mobs pesados (ex: TOLL_BELLRINGER, SHOOTER) nunca devem spawnar em hordas grandes (máx 2 por cluster)', () => {
    enemies.length = 0;

    // Testa repetidas vezes que, ao tentar spawnar 20 Bellringers ou Shooters em cluster,
    // nunca são gerados mais que 2 unidades do mob pesado
    for (let trial = 0; trial < 15; trial++) {
      enemies.length = 0;
      spawnMobCluster('TOLL_BELLRINGER', 20, 0);
      const bellringers = enemies.filter(e => e.baseType === 'TOLL_BELLRINGER');
      assert.ok(bellringers.length <= 2, `Cluster de 20 não pode conter mais que 2 TOLL_BELLRINGER (atual: ${bellringers.length})`);
    }

    for (let trial = 0; trial < 15; trial++) {
      enemies.length = 0;
      spawnMobCluster('SHOOTER', 20, 0);
      const shooters = enemies.filter(e => e.baseType === 'SHOOTER');
      assert.ok(shooters.length <= 2, `Cluster de 20 não pode conter mais que 2 SHOOTER (atual: ${shooters.length})`);
    }

    enemies.length = 0;
  });

  test('spawnEncirclementRing deve substituir automaticamente tipos FPS-heavy por infantaria zumbi', () => {
    enemies.length = 0;
    spawnEncirclementRing('TOLL_BELLRINGER', 16, 0);
    const bellringers = enemies.filter(e => e.baseType === 'TOLL_BELLRINGER');
    assert.equal(bellringers.length, 0, 'Anel concêntrico de 360° não pode conter nenhum TOLL_BELLRINGER');
    assert.ok(enemies.length > 0, 'Monstros devem ter spawnado como infantaria zumbi de massa');
    enemies.length = 0;
  });

  test('o Verme Sepulcral (STALKER) deve spawnar exclusivamente na arena do Deserto', () => {
    enemies.length = 0;

    // 1. No Cemitério (CEMETERY): não é deserto -> deve spawnar como Zumbi
    setCurrentArenaTheme('CEMETERY');
    assert.equal(isDesertArena(), false);
    spawnMobCluster('STALKER', 1, 0);
    assert.equal(enemies.filter(e => e.baseType === 'STALKER').length, 0, 'No Cemitério não deve haver STALKER');
    assert.equal(enemies.filter(e => e.baseType === 'ZOMBIE').length, 1, 'Deve ter sido substituído por Zumbi');

    // 2. No Deserto (DESERT): é deserto -> deve spawnar o STALKER normalmente
    enemies.length = 0;
    setCurrentArenaTheme('DESERT');
    assert.equal(isDesertArena(), true);
    spawnMobCluster('STALKER', 1, 0);
    assert.equal(enemies.filter(e => e.baseType === 'STALKER').length, 1, 'No Deserto deve spawnar o STALKER');

    // Restaura arena padrão
    setCurrentArenaTheme('CEMETERY');
    enemies.length = 0;
  });

  test('inimigos gerados devem possuir biometria única de movimento e desincronização de fase', () => {
    const mob1 = createEnemy('ZOMBIE', 0, 0);
    const mob2 = createEnemy('ZOMBIE', 0, 0);
    const bat1 = createEnemy('BAT', 0, 0);

    assert.ok(typeof mob1.phaseOffset === 'number' && mob1.phaseOffset >= 0 && mob1.phaseOffset <= Math.PI * 2);
    assert.ok(typeof mob1.wobbleFreq === 'number' && mob1.wobbleFreq > 0);
    assert.ok(typeof mob1.wobbleAmp === 'number' && mob1.wobbleAmp > 0);
    assert.ok(typeof bat1.diveThreshold === 'number' && bat1.diveThreshold > 50);

    // Mobs diferentes devem ter offsets de fase independentes (não idênticos)
    assert.notEqual(mob1.phaseOffset, mob2.phaseOffset, 'Inimigos consecutivos não devem ter a mesma fase');
  });

  test('inimigos da mesma espécie devem possuir variação orgânica de velocidade', () => {
    const speeds = new Set();
    for (let i = 0; i < 20; i++) {
      const mob = createEnemy('BAT', 0, 0);
      speeds.add(mob.speed);
    }
    // Em 20 morcegos gerados, deve haver velocidades distintas devido ao jitter (+/- 12%)
    assert.ok(speeds.size > 1, `Devem existir velocidades variadas na revoada (encontradas: ${speeds.size})`);
  });

  test('swarmBehavior e defaultChaseBehavior devem atualizar coordenadas com movimentação orgânica', () => {
    const bat = createEnemy('BAT', 100, 100);
    const zombie = createEnemy('ZOMBIE', 100, 100);
    const ctx = {
      player: { x: 0, y: 0 },
      frameCount: 120
    };

    const initialBatX = bat.x;
    swarmBehavior(bat, 1, Math.PI, bat.speed, ctx);
    assert.ok(!Number.isNaN(bat.x) && !Number.isNaN(bat.y));
    assert.notEqual(bat.x, initialBatX, 'O morcego deve ter se movimentado');

    const initialZombieX = zombie.x;
    defaultChaseBehavior(zombie, 1, Math.PI, zombie.speed, ctx);
    assert.ok(!Number.isNaN(zombie.x) && !Number.isNaN(zombie.y));
    assert.notEqual(zombie.x, initialZombieX, 'O zumbi deve ter se movimentado');
  });

});
