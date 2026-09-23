/** Frames de simulação (60/s); compartilhados entre IA, poeira e alerta vermelho. */
export const STALKER_DASH = Object.freeze({
  chase: 81,
  windup: 12, // 200 ms a 60 frames de simulação por segundo.
  duration: 16,
  recovery: 42,
  speedMultiplier: 3.4,
  spawnMinDistance: 90,
  spawnMaxDistance: 130
});
