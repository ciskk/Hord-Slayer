// Velocidade em pixels por frame de simulação (60 Hz).
const MAX_PUSH_SPEED = 8;
const PUSH_FRICTION = 0.82;
// Todos os inimigos de um update recebem o mesmo dt. Reutiliza exatamente a
// mesma potência e soma geométrica, inclusive quando o FPS varia entre updates.
let cachedDt = NaN;
let cachedFriction = 0;
let cachedTravel = 0;

/** Integra o recuo sem saltos por acúmulo de impactos ou variação de FPS. */
export function integrateEnemyKnockback(e, dt) {
  if (!(dt > 0) || !Number.isFinite(dt)) return;
  let vx = Number.isFinite(e.pushVx) ? e.pushVx : 0;
  let vy = Number.isFinite(e.pushVy) ? e.pushVy : 0;
  if (dt !== cachedDt) {
    cachedDt = dt;
    cachedFriction = Math.pow(PUSH_FRICTION, dt);
    cachedTravel = (1 - cachedFriction) / (1 - PUSH_FRICTION);
  }
  const friction = cachedFriction;
  const travel = cachedTravel;
  if (vx === 0 && vy === 0) {
    // Mantém inclusive a aritmética de +/-0 das posições originais.
    e.x += vx * travel;
    e.y += vy * travel;
    e.pushVx = 0;
    e.pushVy = 0;
    return;
  }
  const speed = Math.hypot(vx, vy);
  if (speed > MAX_PUSH_SPEED) {
    // Limite vetorial: diagonais mantêm a direção e o mesmo teto de velocidade.
    const scale = MAX_PUSH_SPEED / speed;
    vx *= scale;
    vy *= scale;
  }
  // Soma geométrica fracionária: dt=1 mantém a física original; dividir um
  // intervalo em vários updates produz o mesmo deslocamento e velocidade.
  e.x += vx * travel;
  e.y += vy * travel;
  e.pushVx = vx * friction;
  e.pushVy = vy * friction;
  if (Math.hypot(e.pushVx, e.pushVy) < 0.05) {
    e.pushVx = 0;
    e.pushVy = 0;
  }
}
