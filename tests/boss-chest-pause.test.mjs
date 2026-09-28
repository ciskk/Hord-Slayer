import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkMiniBossSchedule,
  checkBossSchedule,
  miniBossSchedule,
  resetMiniBossSchedule,
  resetBossSchedule,
  onBossDefeated,
  onBossChestCollected,
  nextBossSpawnTime,
  wavePauseStartTime
} from '../src/systems/waves.js';
import { gameState, setIsWavePaused } from '../src/state/gameState.js';
import { activeBoss, enemies, chests } from '../src/state/collections.js';
import { spawnMiniBoss } from '../src/entities/enemies/spawner.js';
import { updatePickups } from '../src/systems/pickups.js';

describe('Correções de Spawn e Baú de Chefes (Bug 1 e Bug 2)', () => {

  beforeEach(() => {
    resetBossSchedule();
    resetMiniBossSchedule();
    setIsWavePaused(false);
    enemies.length = 0;
    chests.length = 0;
  });

  test('BUG 1: ao derrotar o chefe (isWavePaused=true, activeBoss=null), minibosses não devem spawnar na arena', () => {
    // Simula morte do chefe: activeBoss é nulo, mas a onda está pausada aguardando abertura do baú
    setIsWavePaused(true);

    // O tempo avançou até 150s (momento em que múltiplos minibosses já deveriam ter spawnado na horda normal)
    checkMiniBossSchedule(150);

    const spawnedMinibosses = miniBossSchedule.filter(entry => entry.spawned);
    assert.equal(spawnedMinibosses.length, 0, 'Nenhum miniboss agendado pode spawnar enquanto a onda estiver pausada pós-boss');

    // Tentativa direta de spawnMiniBoss deve ser bloqueada
    const directSpawn = spawnMiniBoss('BLOOD_GARGOYLE');
    assert.equal(directSpawn, null, 'spawnMiniBoss deve retornar null enquanto gameState.isWavePaused for true');

    // Novo chefe também não deve ser disparado enquanto a onda estiver pausada
    checkBossSchedule(500);
    assert.equal(enemies.filter(e => e.isBoss).length, 0, 'Novo boss não pode surgir enquanto o anterior aguarda abertura de baú');
  });

  test('BUG 2: coletar um baú de miniboss (tier="MINI_BOSS") NÃO deve retomar o spawn de hordas (isWavePaused deve permanecer true)', () => {
    // Estado pós-derrota do chefe: horda pausada aguardando baú do chefe
    setIsWavePaused(true);
    assert.equal(gameState.isWavePaused, true);

    const player = { x: 100, y: 100, radius: 15, magnet: 50 };
    // Cria um baú de miniboss resting no mesmo local do player
    chests.push({
      x: 100,
      y: 100,
      z: 0,
      radius: 12,
      tier: 'MINI_BOSS',
      isResting: true,
      sparkleTimer: 0
    });

    // Simula ciclo de coleta de pickups
    updatePickups(1, {
      player,
      enemies,
      gems: [],
      props: [],
      drops: [],
      chests,
      gameState,
      frameCount: 600,
      cameraViewW: 800,
      cameraViewH: 600,
      triggerShake: () => {},
      setFreezeTimer: () => {},
      setIsWavePaused,
      resetSpawnTimer: () => {},
      setLastAttackerName: () => {}
    });

    // O baú foi consumido/aberto
    assert.equal(chests.length, 0, 'Baú de miniboss deve ser consumido pelo jogador');
    // MAS a onda DEVE CONTINUAR PAUSADA
    assert.equal(gameState.isWavePaused, true, 'isWavePaused deve continuar TRUE após abrir baú de MINIBOSS');
  });

  test('BUG 2: apenas abrir o baú dropado por chefes (tier="BOSS") deve retomar o spawn de hordas e compensar o tempo de espera', () => {
    // 1. Simula início e término da luta contra o Boss
    onBossDefeated(80); // Chefe derrotado em 80s
    setIsWavePaused(true);
    assert.equal(gameState.isWavePaused, true);
    assert.equal(wavePauseStartTime, 80);

    const scheduledTimeBefore = miniBossSchedule[0].time;

    const player = { x: 200, y: 200, radius: 15, magnet: 50 };
    chests.push({
      x: 200,
      y: 200,
      z: 0,
      radius: 16,
      tier: 'BOSS',
      isResting: true,
      sparkleTimer: 0
    });

    // 2. Jogador pega o baú do Chefe aos 110s (30s de espera na arena limpa)
    updatePickups(1, {
      player,
      enemies,
      gems: [],
      props: [],
      drops: [],
      chests,
      gameState,
      frameCount: 110 * 60,
      cameraViewW: 800,
      cameraViewH: 600,
      triggerShake: () => {},
      setFreezeTimer: () => {},
      setIsWavePaused,
      resetSpawnTimer: () => {},
      setLastAttackerName: () => {}
    });

    assert.equal(chests.length, 0, 'Baú do chefe deve ser consumido');
    assert.equal(gameState.isWavePaused, false, 'isWavePaused deve ser FALSE após abrir baú de CHEFE');

    // 3. Os minibosses subsequentes devem ter seu tempo postergado pelos 30s de espera
    const scheduledTimeAfter = miniBossSchedule[0].time;
    assert.equal(scheduledTimeAfter, scheduledTimeBefore + 30, 'O agendamento do miniboss deve ser postergado pelo tempo de espera do baú');
  });

});
