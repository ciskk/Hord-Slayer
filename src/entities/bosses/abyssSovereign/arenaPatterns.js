// Geometria compartilhada entre colisão, avisos e execução; tempos em frames a 60 Hz.
export const ARENA_SKILLS = Object.freeze({
  ECLIPSE_SECTORS: 'Coroa do Eclipse',
  PARALLAX_CORRIDOR: 'Corredor de Paralaxe',
  HORIZON_PULSE: 'Maré do Horizonte',
  MEMORY_CONSTELLATION: 'Constelação de Ecos'
});

const TAU = Math.PI * 2;
const SECTOR = Math.PI / 3;
const PREPARATION_SCALE = 0.30;
const ECHO_SPEED = 1.5;
// Área = πr²: multiplicar o raio por √1,5 aumenta a área exatamente em 1,5x o tamanho original.
const ECHO_RADIUS = 54 * Math.sqrt(1.5);

export function selectSovereignSkill(boss, random = Math.random) {
  const skills = ['VOID_CRUCIFIX', 'RELATIVISTIC_SALVO', 'ABYSSAL_RIFTS',
    'DIMENSIONAL_CLEAVE', 'ECLIPSE_SECTORS', 'MEMORY_CONSTELLATION', 'THRESHOLD_BEAMS', 'INEXORABLE_HARVEST', 'ABYSSAL_CYCLONE', 'FOUR_COIL_SPIRAL'];
  if (boss.phase >= 2) skills.push('COSMIC_SUPERNOVA', 'VOID_WARP',
    'SINGULARITY_IMPLOSION', 'PARALLAX_CORRIDOR', 'HORIZON_PULSE');
  if (boss.phase >= 3) skills.push('ASTRAL_BARRAGE');

  // Uma execução de cada habilidade por rodada, sem ordem fixa nem repetição na virada.
  if (boss.attackDeckPhase !== boss.phase || !boss.attackDeck?.length) {
    boss.attackDeck = [...skills];
    for (let i = boss.attackDeck.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [boss.attackDeck[i], boss.attackDeck[j]] = [boss.attackDeck[j], boss.attackDeck[i]];
    }
    boss.attackDeckPhase = boss.phase;
    if (boss.attackDeck[0] === boss.lastUsedSkill) {
      [boss.attackDeck[0], boss.attackDeck[1]] = [boss.attackDeck[1], boss.attackDeck[0]];
    }
  }
  const skill = boss.attackDeck.shift();
  boss.lastUsedSkill = skill;
  return skill;
}

export function beginArenaPattern(boss, player) {
  const skill = boss.currentSkill;
  const radius = Math.min(boss.arenaRadius, boss.targetArenaRadius || boss.arenaRadius) - 8;
  const angle = Math.atan2(player.y - boss.arenaCenterY, player.x - boss.arenaCenterX);
  const echo = skill === 'MEMORY_CONSTELLATION';
  const pattern = {
    skill, x: boss.arenaCenterX, y: boss.arenaCenterY, radius,
    angle: skill === 'ECLIPSE_SECTORS' ? angle - SECTOR / 2 : angle,
    step: 0, steps: echo ? (boss.phase === 3 ? 5 : 4) : (boss.phase === 3 ? 3 : 2),
    // Redução de 70% aplicada a cada preparação, inclusive entre etapas.
    warning: (echo ? 66 : Math.ceil(radius * 0.25 + 40)) * PREPARATION_SCALE / (echo ? ECHO_SPEED : 1),
    elapsed: 0, visualTime: 0, active: false, activeDuration: 18 / (echo ? ECHO_SPEED : 1), hit: false,
    halfWidth: Math.max(100, radius * 0.24),
    innerRadius: Math.max(100, radius * 0.22),
    splitRadius: radius * 0.60,
    marks: [], recording: echo, recordTimer: 0, recordInterval: 26 * PREPARATION_SCALE / (echo ? ECHO_SPEED : 1),
    damage: Math.round(boss.damage * (echo ? 0.22 : 0.28))
  };
  boss.arenaPattern = pattern;
  // Os desafios de posicionamento suspendem a atração e a artilharia ambiente.
  boss.singularityOrbs = [];
  boss.singularityPulseTimer = 0;
  boss.orbSpawnTimer = 0;
  if (echo) recordMark(pattern, player);
  return pattern;
}

function recordMark(pattern, player) {
  const radius = ECHO_RADIUS;
  const dx = player.x - pattern.x;
  const dy = player.y - pattern.y;
  const dist = Math.hypot(dx, dy) || 1;
  const scale = Math.min(1, (pattern.radius - radius - 20) / dist);
  pattern.marks.push({ x: pattern.x + dx * scale, y: pattern.y + dy * scale, radius });
}

export function cancelArenaPattern(boss) {
  boss.arenaPattern = null;
}

// A hitbox inteira precisa caber na área segura; fora da arena nunca há dano deste padrão.
export function arenaPatternHits(pattern, player) {
  const dx = player.x - pattern.x;
  const dy = player.y - pattern.y;
  const distance = Math.hypot(dx, dy);
  const body = player.radius || 14;
  if (distance > pattern.radius + body) return false;
  switch (pattern.skill) {
    case 'ECLIPSE_SECTORS': {
      if (distance + body < pattern.innerRadius) return false;
      const angle = ((Math.atan2(dy, dx) - pattern.angle) % TAU + TAU) % TAU;
      const margin = Math.asin(Math.min(1, body / Math.max(distance, 1)));
      const local = angle % (SECTOR * 2);
      return local < SECTOR + margin || local > SECTOR * 2 - margin;
    }
    case 'PARALLAX_CORRIDOR':
      return Math.abs(-dx * Math.sin(pattern.angle) + dy * Math.cos(pattern.angle)) + body > pattern.halfWidth;
    case 'HORIZON_PULSE':
      return pattern.step % 2 === 0
        ? distance + body > pattern.splitRadius
        : distance - body < pattern.splitRadius;
    case 'MEMORY_CONSTELLATION': {
      const mark = pattern.marks[pattern.step];
      return !!mark && Math.hypot(player.x - mark.x, player.y - mark.y) < mark.radius + body;
    }
    default: return false;
  }
}

export function updateArenaPattern(boss, dt, player, onHit, onPulse = () => {}) {
  const p = boss.arenaPattern;
  if (!p) return true;
  if (boss.hp <= 0 || boss.isStaggered || !['WINDUP', 'CASTING'].includes(boss.actionState)) {
    cancelArenaPattern(boss);
    return true;
  }

  p.visualTime += dt * (p.skill === 'MEMORY_CONSTELLATION' ? ECHO_SPEED : 1);
  if (p.recording) {
    p.recordTimer += dt;
    // No catch-up de marcas: cada posição precisa ter sido realmente observada.
    if (p.recordTimer >= p.recordInterval) {
      p.recordTimer = 0;
      if (p.marks.length < p.steps) recordMark(p, player);
      else { p.recording = false; p.elapsed = 0; }
    }
    return false;
  }

  p.elapsed += dt;
  if (!p.active && p.elapsed >= p.warning) {
    p.active = true;
    p.elapsed = 0;
    p.hit = false;
    onPulse(p);
  }
  if (p.active) {
    // iFrames também é renovado pela câmera: só a proteção de chefe/ULT evita estes golpes.
    if (!p.hit && !(player.bossIFrames > 0 || player.dashDuration > 0 || player.ignisDashDuration > 0 || player.invisTimer > 0)
      && arenaPatternHits(p, player)) {
      p.hit = true;
      onHit(p.damage, ARENA_SKILLS[p.skill]);
    }
    if (p.elapsed >= p.activeDuration) {
      p.step++;
      if (p.step >= p.steps) {
        cancelArenaPattern(boss);
        return true;
      }
      p.active = false;
      p.elapsed = 0;
      // A nova orientação só aparece depois que o perigo anterior terminou.
      if (p.skill === 'ECLIPSE_SECTORS') p.angle += SECTOR;
      if (p.skill === 'PARALLAX_CORRIDOR') p.angle += Math.PI / 3;
      // As posições restantes já estavam visíveis durante toda a gravação.
      if (p.skill === 'MEMORY_CONSTELLATION') p.warning = 32 * PREPARATION_SCALE / ECHO_SPEED;
    }
  }
  return false;
}
