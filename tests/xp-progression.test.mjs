import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getNextLevelXp } from '../src/entities/player/player.js';

describe('Progressão de XP e Calibragem de Nível', () => {

  test('nível 1 deve iniciar fluido com requisito baixo (10 XP)', () => {
    const xp1 = getNextLevelXp(1);
    assert.equal(xp1, 10, 'Nível 1 deve exigir exatamente 10 XP para dinamismo inicial');
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

    // Valores calibrados
    assert.equal(xp1, 10);
    assert.equal(xp10, 61);
    assert.equal(xp30, 226);
    assert.equal(xp50, 442);
    assert.equal(xp70, 699);

    // Taxa de crescimento relativo entre faixas (demonstra inclinação progressivamente mais íngreme)
    const deltaEarly = (xp10 - xp1) / 9;      // Ganho médio de XP por nível entre 1 e 10 (~5.67 XP/lvl)
    const deltaLate = (xp70 - xp50) / 20;     // Ganho médio de XP por nível entre 50 e 70 (~12.85 XP/lvl)
    assert.ok(deltaLate > deltaEarly * 2, `O ganho marginal por nível na fase tardia (${deltaLate.toFixed(2)}) deve ser mais que o dobro da fase inicial (${deltaEarly.toFixed(2)})`);

    const ratio70to10 = xp70 / xp10;
    assert.ok(ratio70to10 > 11, `Razão Nível 70 / Nível 10 deve ser > 11x (atual: ${ratio70to10.toFixed(2)}x)`);
  });

  test('ao acumular o XP típico de zerar o jogo (~20.731 XP), o player deve atingir o nível 70', () => {
    const baselineRunXp = 20731; // Total acumulado na fórmula antiga ao atingir nível 90

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

    assert.equal(currentLevel, 70, `Com ${baselineRunXp} XP acumulados, o jogador deve atingir exatamente o Nível 70`);

    const totalToReach70 = (() => {
      let sum = 0;
      for (let l = 1; l < 70; l++) sum += getNextLevelXp(l);
      return sum;
    })();

    assert.equal(totalToReach70, 20702, 'Total para alcançar nível 70 deve ser 20.702 XP');
    assert.ok(Math.abs(baselineRunXp - totalToReach70) < 50, 'A diferença para o total de zerar a partida deve ser menor que 50 XP (< 0.2%)');
  });

});
