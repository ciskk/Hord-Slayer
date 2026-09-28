import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateCrowdFlanking,
  applyCrowdFlanking,
  CROWD_FLANK_CONFIG
} from '../src/systems/enemyLifecycle/crowdFlanking.js';
import { createEnemy } from '../src/entities/enemies/spawner.js';
import { defaultChaseBehavior } from '../src/systems/enemyLifecycle/behaviors/defaultChase.js';
import { swarmBehavior } from '../src/systems/enemyLifecycle/behaviors/swarm.js';

describe('Inteligência Coletiva: Flanqueamento Tático de Horda (Crowd Flanking)', () => {

  test('monstro com caminho frontal desimpedido deve manter perseguição direta sem ativar flanqueamento', () => {
    const mob = createEnemy('ZOMBIE', 0, 0);
    const enemies = [mob];

    evaluateCrowdFlanking(mob, 0, 150, null, enemies, true);

    assert.equal(mob.flankTimer, 0, 'Timer de flanco deve permanecer 0 quando não há aliados à frente');
    assert.equal(mob.flankDir, 0, 'Direção de flanco deve permanecer neutra');

    const ctx = { player: { x: 150, y: 0 }, enemies, frameCount: 0 };
    const effectiveAngle = applyCrowdFlanking(mob, 0, ctx, 1);
    assert.equal(effectiveAngle, 0, 'O ângulo efetivo não deve sofrer deflexão sem congestão');
  });

  test('monstro bloqueado por 2 ou mais aliados à frente deve ativar manobra de flanqueamento', () => {
    const mob = createEnemy('ZOMBIE', 0, 0);
    // Aliados posicionados exatamente à frente no eixo X (jogador em x=200, y=0)
    const ally1 = createEnemy('ZOMBIE', 35, 0);
    const ally2 = createEnemy('ZOMBIE', 55, 0);
    const enemies = [mob, ally1, ally2];

    evaluateCrowdFlanking(mob, 0, 200, null, enemies, true);

    assert.ok(mob.flankTimer > 0, `flankTimer deve ser ativado (atual: ${mob.flankTimer})`);
    assert.ok(mob.flankDir === 1 || mob.flankDir === -1, 'flankDir deve ser -1 ou +1');
  });

  test('deve escolher contornar pela esquerda se o lado direito estiver congestionado', () => {
    const mob = createEnemy('ZOMBIE', 0, 0);
    // Aliados à frente ligeiramente inclinados para a direita (+Y na tela)
    const ally1 = createEnemy('ZOMBIE', 35, 8);
    const ally2 = createEnemy('ZOMBIE', 55, 12);
    const ally3 = createEnemy('ZOMBIE', 50, 20);
    const enemies = [mob, ally1, ally2, ally3];

    evaluateCrowdFlanking(mob, 0, 200, null, enemies, true);

    assert.equal(mob.flankDir, -1, 'Com congestionamento à direita, o mob deve flanquear pela esquerda (-1)');
    assert.ok(mob.flankTimer > 0);
  });

  test('deve escolher contornar pela direita se o lado esquerdo estiver congestionado', () => {
    const mob = createEnemy('ZOMBIE', 0, 0);
    // Aliados à frente inclinados para a esquerda (-Y na tela)
    const ally1 = createEnemy('ZOMBIE', 35, -8);
    const ally2 = createEnemy('ZOMBIE', 55, -12);
    const ally3 = createEnemy('ZOMBIE', 50, -20);
    const enemies = [mob, ally1, ally2, ally3];

    evaluateCrowdFlanking(mob, 0, 200, null, enemies, true);

    assert.equal(mob.flankDir, 1, 'Com congestionamento à esquerda, o mob deve flanquear pela direita (+1)');
    assert.ok(mob.flankTimer > 0);
  });

  test('quando os dois lados estão equilibrados, deve usar o flankBias individual do monstro', () => {
    const mob = createEnemy('ZOMBIE', 0, 0);
    mob.flankBias = -1;

    // Aliados perfeitamente simétricos
    const ally1 = createEnemy('ZOMBIE', 35, 0);
    const ally2 = createEnemy('ZOMBIE', 55, 0);
    const enemies = [mob, ally1, ally2];

    evaluateCrowdFlanking(mob, 0, 200, null, enemies, true);

    assert.equal(mob.flankDir, -1, 'Deve respeitar o flankBias configurado no mob');
  });

  test('ao se aproximar do jogador (< 45px), o desvio de flanco deve diminuir para permitir o ataque melee', () => {
    const mob = createEnemy('ZOMBIE', 0, 0);
    mob.flankTimer = 20;
    mob.flankDir = 1;
    mob.flankAngleOffset = CROWD_FLANK_CONFIG.deflectionAngle;

    const ctxNear = { player: { x: 30, y: 0 }, frameCount: 1 };
    const nearAngle = applyCrowdFlanking(mob, 0, ctxNear, 1);

    // À distância de 30px, o desvio efetivo deve ser amortecido
    assert.ok(nearAngle < CROWD_FLANK_CONFIG.deflectionAngle, 'Desvio deve ser amortecido próximo do alvo');

    const ctxPointBlank = { player: { x: 10, y: 0 }, frameCount: 1 };
    const pointBlankAngle = applyCrowdFlanking(mob, 0, ctxPointBlank, 1);
    assert.equal(pointBlankAngle, 0, 'A menos de 18px do jogador, o desvio deve ser zero (foco no bote)');
  });

  test('mobs de escudo pesado (SHIELDED) devem ter canFlank=false e não desviar da linha de frente', () => {
    const shieldMob = createEnemy('SHIELDED', 0, 0);
    assert.equal(shieldMob.canFlank, false, 'Monstros com escudo devem ter canFlank=false');

    const ally1 = createEnemy('ZOMBIE', 30, 0);
    const ally2 = createEnemy('ZOMBIE', 50, 0);
    const enemies = [shieldMob, ally1, ally2];

    evaluateCrowdFlanking(shieldMob, 0, 200, 0, enemies);
    assert.equal(shieldMob.flankTimer, 0, 'Monstros com escudo não devem ativar timer de flanco');

    const ctx = { player: { x: 200, y: 0 }, enemies, frameCount: 0 };
    const angle = applyCrowdFlanking(shieldMob, 0, ctx, 1);
    assert.equal(angle, 0, 'Monstros com escudo não sofrem deflexão angular');
  });

  test('morcegos aéreos não devem bloquear monstros terrestres', () => {
    const zombie = createEnemy('ZOMBIE', 0, 0);
    const bat1 = createEnemy('BAT', 30, 0);
    const bat2 = createEnemy('BAT', 50, 0);
    const enemies = [zombie, bat1, bat2];

    evaluateCrowdFlanking(zombie, 0, 200, 0, enemies);
    assert.equal(zombie.flankTimer, 0, 'Morcegos voando não devem causar bloqueio de avanço para zumbis terrestres');
  });

  test('defaultChaseBehavior e swarmBehavior devem navegar em horda densa sem produzir valores inválidos (NaN)', () => {
    const zombie = createEnemy('ZOMBIE', 0, 0);
    const bat = createEnemy('BAT', 0, 0);
    const allies = [
      createEnemy('ZOMBIE', 25, 0),
      createEnemy('ZOMBIE', 45, 0),
      createEnemy('ZOMBIE', 35, 10)
    ];
    const enemies = [zombie, bat, ...allies];
    const ctx = {
      player: { x: 200, y: 0 },
      enemies,
      frameCount: 16
    };

    // Executa múltiplos frames simulando movimento na multidão
    for (let f = 0; f < 30; f++) {
      ctx.frameCount = f;
      defaultChaseBehavior(zombie, 1, 0, zombie.speed, ctx);
      swarmBehavior(bat, 1, 0, bat.speed, ctx);

      assert.ok(!Number.isNaN(zombie.x) && !Number.isNaN(zombie.y), `Zombie coords devem ser números válidos no frame ${f}`);
      assert.ok(!Number.isNaN(bat.x) && !Number.isNaN(bat.y), `Bat coords devem ser números válidos no frame ${f}`);
    }

    assert.ok(zombie.x > 0, 'Zumbi deve ter progredido em direção ao alvo');
    assert.ok(bat.x > 0, 'Morcego deve ter progredido em direção ao alvo');
  });

});
