import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getNextLevelXp } from '../src/entities/player/player.js';

describe('Progressão de XP e Calibragem de Nível', () => {

  test('nível 1 deve iniciar com requisito calibrado em 2x (20 XP)', () => {
    const xp1 = getNextLevelXp(1);
    assert.equal(xp1, 20, 'Nível 1 deve exigir exatamente 20 XP com dificuldade 2x');
  });

  test('requisito de XP deve ser estritamente crescente e gerar números inteiros válidos', () => {
    let prevReq = 0;

    for (let lvl = 1; lvl <= 100; lvl++) {
      const req = getNextLevelXp(lvl);
      assert.ok(req > prevReq, `Requisito no nível ${lvl} (${req}) deve ser estritamente maior que no nível anterior (${prevReq})`);
      assert.ok(Number.isInteger(req), `Requisito no nível ${lvl} deve ser um número inteiro`);
      assert.ok(req >= 1, `Requisito no nível ${lvl} deve ser positivo`);
      prevReq = req;
    }
  });

  test('facilidade deve diminuir progressivamente mais (curva mais íngreme em níveis altos)', () => {
    const xp1 = getNextLevelXp(1);
    const xp10 = getNextLevelXp(10);
    const xp30 = getNextLevelXp(30);
    const xp50 = getNextLevelXp(50);
    const xp70 = getNextLevelXp(70);

    // Valores calibrados com dificuldade 2x (dobro de XP)
    assert.equal(xp1, 20);
    assert.equal(xp10, 121);
    assert.equal(xp30, 452);
    assert.equal(xp50, 884);
    assert.equal(xp70, 1397);

    // Taxa de crescimento relativo entre faixas (demonstra inclinação progressivamente mais íngreme)
    const deltaEarly = (xp10 - xp1) / 9;      // Ganho médio de XP por nível entre 1 e 10 (~11.22 XP/lvl)
    const deltaLate = (xp70 - xp50) / 20;     // Ganho médio de XP por nível entre 50 e 70 (~25.65 XP/lvl)
    assert.ok(deltaLate > deltaEarly * 2, `O ganho marginal por nível na fase tardia (${deltaLate.toFixed(2)}) deve ser mais que o dobro da fase inicial (${deltaEarly.toFixed(2)})`);

    const ratio70to10 = xp70 / xp10;
    assert.ok(ratio70to10 > 11, `Razão Nível 70 / Nível 10 deve ser > 11x (atual: ${ratio70to10.toFixed(2)}x)`);
  });

  test('com a dificuldade 2x de XP, alcançar o nível 70 exige ~41.4k XP (ou nível 52 com ~20.7k XP)', () => {
    const baselineRunXp = 20731; // Total acumulado na partida

    let accumulatedXp = 0;
    let currentLevel = 1;

    while (true) {
      const needed = getNextLevelXp(currentLevel);
      if (accumulatedXp + needed > baselineRunXp) {
        break;
      }
      accumulatedXp += needed;
      currentLevel++;
    }

    assert.equal(currentLevel, 52, `Com ${baselineRunXp} XP acumulados e dificuldade 2x, o jogador atinge o nível 52`);

    const totalToReach70 = (() => {
      let sum = 0;
      for (let l = 1; l < 70; l++) sum += getNextLevelXp(l);
      return sum;
    })();

    assert.equal(totalToReach70, 41367, 'Total para alcançar nível 70 deve ser 41.367 XP (dobro exato da curva anterior)');
    assert.ok(Math.abs(baselineRunXp * 2 - totalToReach70) < 100, 'A diferença para o dobro do total da partida deve ser mínima (< 0.25%)');
  });

});
