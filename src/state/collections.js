/**
 * src/state/collections.js
 * Central de Coleções e Entidades Ativas na Arena.
 * Módulo de dados puro sem dependência de sistemas de simulação.
 */

export const enemies = [];
export const props = [];
export const drops = [];
export const chests = [];
export const gems = [];

export const bullets = [];
export const enemyBullets = [];
export const acidPuddles = [];

export const bossTelegraphs = [];
export const bossProjectiles = [];
export const bossShockwaves = [];
export const voidVortices = [];

export let activeBoss = null;

export function setActiveBoss(boss) {
  activeBoss = boss;
}

export const MAX_CONCURRENT_ENEMY_BULLETS = 14;

export function canSpawnEnemyBullet(isBoss = false) {
  return isBoss || enemyBullets.length < MAX_CONCURRENT_ENEMY_BULLETS;
}

export function resetCollections() {
  enemies.length = 0;
  props.length = 0;
  drops.length = 0;
  chests.length = 0;
  gems.length = 0;
  bullets.length = 0;
  enemyBullets.length = 0;
  acidPuddles.length = 0;
  bossTelegraphs.length = 0;
  bossProjectiles.length = 0;
  bossShockwaves.length = 0;
  voidVortices.length = 0;
  activeBoss = null;
}
