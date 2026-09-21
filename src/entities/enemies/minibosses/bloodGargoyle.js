/**
 * src/entities/enemies/minibosses/bloodGargoyle.js
 * 
 * Controlador e FSM do Miniboss Gárgula de Sangue (BLOOD_GARGOYLE).
 */
import { safePlaySfx } from './common.js';

export const bloodGargoyleHandler = {
init(e) {
  e.skillCooldown = 85;
  e.diveBombCount = 0;
  e.isAirborne = false;
  e.isStoneForm = false;
  e.elevZ = 0;
},
update(e, dt, ctx, dist, angle) {
  const { player, bossTelegraphs, bossShockwaves, enemyBullets, createHitParticles } = ctx;

  // Habilidade especial única: Forma de Pedra aos <40% HP
  if (e.hp <= e.maxHp * 0.4 && !e.hasUsedStoneForm && e.actionState === 'CHASE') {
    e.hasUsedStoneForm = true;
    e.currentSkill = 'STONE_FORM';
    e.actionState = 'WINDUP';
    e.actionTimer = 62;
    e.actionMaxTimer = 62;
    e.isStoneForm = true;
    e.isAirborne = false;
    e.elevZ = 0;
    safePlaySfx('freeze');
    ctx.addDamageText(e.x, e.y, "PETRIFICAÇÃO!", true, '#7f8c8d');
    return;
  }

  if (e.actionState === 'CHASE') {
    e.isAirborne = false;
    e.elevZ = 0;
    // Movimento ágil de perseguição aérea (velocidade calibrada para 1.95)
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;

    e.skillCooldown -= dt;
    if (e.skillCooldown <= 0) {
      const rand = Math.random();
      if (rand < 0.55 || dist > 200) {
        // Rasante Predatório (Dive-Bomb) - Telégrafo mais justo (52f normal / 42f fúria)
        e.currentSkill = 'DIVE_BOMB';
        e.actionState = 'WINDUP';
        e.actionTimer = e.enraged ? 42 : 52;
        e.actionMaxTimer = e.actionTimer;
        e.targetX = player.x;
        e.targetY = player.y;
        e.isAirborne = true;
        e.elevZ = 0;
        safePlaySfx('warp');

        bossTelegraphs.push({
          type: 'FALLING_ROCK',
          x: e.targetX,
          y: e.targetY,
          radius: 52,
          timer: e.actionTimer,
          maxTimer: e.actionTimer,
          damage: Math.round(e.damage * 1.1),
          color: '#c0392b'
        });
      } else {
        // Vômito Hemático (Blood Volley) - Windup com tempo de reação (32f)
        e.currentSkill = 'BLOOD_VOLLEY';
        e.actionState = 'WINDUP';
        e.actionTimer = 32;
        e.actionMaxTimer = 32;
        e.aimAngle = angle;
        e.isAirborne = false;
        e.elevZ = 0;
        safePlaySfx('charge');
      }
    }
  } else if (e.actionState === 'WINDUP') {
    e.actionTimer -= dt;
    e.castProgress = 1 - (e.actionTimer / e.actionMaxTimer);

    if (e.currentSkill === 'STONE_FORM') {
      // Regeneração moderada de exatamente 8% ao longo da duração
      e.hp = Math.min(e.maxHp, e.hp + (e.maxHp * 0.08) * (dt / e.actionMaxTimer));
      if (Math.floor(dt * 60) % 6 === 0) {
        createHitParticles(e.x, e.y, '#95a5a6', 2);
      }
    } else if (e.currentSkill === 'DIVE_BOMB') {
      e.isAirborne = true;
      // Elevação 2.5D em arco senoidal (ascensão no início e mergulho predatório no final)
      e.elevZ = Math.sin(e.castProgress * Math.PI) * 48;

      // Desloca-se planando em direção ao ponto de impacto com velocidade controlada
      const toTargetAng = Math.atan2(e.targetY - e.y, e.targetX - e.x);
      e.x += Math.cos(toTargetAng) * e.speed * 1.6 * dt;
      e.y += Math.sin(toTargetAng) * e.speed * 1.6 * dt;

      // Partículas de rastro de vento e sangue cortando o ar
      if (Math.random() < 0.35) {
        createHitParticles(e.x + (Math.random() - 0.5) * 16, e.y - e.elevZ, '#c0392b', 1);
      }
    }

    if (e.actionTimer <= 0) {
      e.actionState = 'STRIKE';
    }
  } else if (e.actionState === 'STRIKE') {
    if (e.currentSkill === 'DIVE_BOMB') {
      e.isAirborne = false;
      e.elevZ = 0;
      e.x = e.targetX;
      e.y = e.targetY;
      safePlaySfx('boss');
      ctx.triggerShake(7);
      createHitParticles(e.x, e.y, '#c0392b', 14);

      bossShockwaves.push({
        x: e.x,
        y: e.y,
        radius: 10,
        maxRadius: 50,
        speed: 3.2,
        damage: Math.round(e.damage * 0.4),
        hitPlayer: false,
        colorRgb: '192, 57, 43'
      });

      // Dispersão calibrada de 3 projéteis de sangue mais lentos
      for (let k = 0; k < 3; k++) {
        const bAng = (k * (Math.PI * 2 / 3)) + Math.PI * 0.3;
        enemyBullets.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(bAng) * 2.8,
          vy: Math.sin(bAng) * 2.8,
          radius: 4.5,
          damage: Math.round(e.damage * 0.3),
          life: 65,
          bulletType: 'BLOOD',
          color: '#c0392b'
        });
      }
    } else if (e.currentSkill === 'BLOOD_VOLLEY') {
      safePlaySfx('shoot');
      createHitParticles(e.x, e.y, '#e74c3c', 8);
      // 3 projéteis em leque com velocidade reduzida (3.3)
      for (let k = -1; k <= 1; k++) {
        const bAng = e.aimAngle + k * 0.22;
        enemyBullets.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(bAng) * 3.3,
          vy: Math.sin(bAng) * 3.3,
          radius: 5.0,
          damage: Math.round(e.damage * 0.35),
          life: 75,
          bulletType: 'BLOOD',
          color: '#ff4757'
        });
      }
    } else if (e.currentSkill === 'STONE_FORM') {
      e.isStoneForm = false;
      safePlaySfx('crit');
      createHitParticles(e.x, e.y, '#2ecc71', 12);
    }

    e.actionState = 'RECOVERY';
    e.actionTimer = e.enraged ? 24 : 36;
  } else if (e.actionState === 'RECOVERY') {
    e.actionTimer -= dt;
    e.isAirborne = false;
    e.elevZ = 0;
    e.x += Math.cos(angle) * e.speed * 0.3 * dt;
    e.y += Math.sin(angle) * e.speed * 0.3 * dt;
    if (e.actionTimer <= 0) {
      e.actionState = 'CHASE';
      e.currentSkill = null;
      e.skillCooldown = e.enraged ? 60 : 85;
    }
  }
}
};
