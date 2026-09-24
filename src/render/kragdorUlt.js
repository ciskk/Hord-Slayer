import { KRAGDOR_ULT } from '../config/kragdorUlt.js';

const TAU = Math.PI * 2;

// Selo de presas e chifres: a mesma assinatura no rugido, no herói e nas vítimas.
function drawAncestralSeal(c, x, y, size, alpha) {
  c.save();
  c.translate(x, y);
  c.scale(size, size);
  c.globalAlpha *= alpha;
  c.lineJoin = 'round';
  c.strokeStyle = '#f5c786';
  c.fillStyle = 'rgba(101, 24, 24, 0.42)';
  c.lineWidth = 0.85;
  c.beginPath();
  c.moveTo(-6, -4); c.lineTo(-12, -11); c.lineTo(-10, -3);
  c.lineTo(-6, 0); c.lineTo(-4, 7); c.lineTo(0, 11);
  c.lineTo(4, 7); c.lineTo(6, 0); c.lineTo(10, -3);
  c.lineTo(12, -11); c.lineTo(6, -4); c.lineTo(0, -6);
  c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = '#fff0ce';
  c.lineWidth = 1.25;
  c.beginPath();
  c.moveTo(-6, -1); c.lineTo(-2, 1);
  c.moveTo(6, -1); c.lineTo(2, 1);
  c.moveTo(-3, 4); c.lineTo(-2, 8);
  c.moveTo(3, 4); c.lineTo(2, 8);
  c.stroke();
  c.restore();
}

/** Onda de pressão ancorada no local da ativação, sem alterar câmera ou escala. */
export function drawKragdorRoar(c, { x, y, age, radius = KRAGDOR_ULT.radius }) {
  if (age < 0 || age >= KRAGDOR_ULT.waveDuration) return;
  const life = age / KRAGDOR_ULT.waveDuration;
  c.save();
  c.translate(x, y);
  c.lineJoin = 'round';

  // Duas frentes sônicas: borda de marfim, corpo carmesim e interior transparente.
  for (let wave = 0; wave < 2; wave++) {
    const p = Math.max(0, Math.min(1, (age - wave * 7) / (KRAGDOR_ULT.waveDuration - 7)));
    if (age < wave * 7 || p >= 1) continue;
    const r = radius * (0.10 + 0.90 * (1 - Math.pow(1 - p, 2)));
    const alpha = Math.pow(1 - p, 1.2) * (wave ? 0.5 : 0.85);
    c.beginPath();
    for (let i = 0; i <= 64; i++) {
      const a = i / 64 * TAU;
      const ripple = Math.sin(a * 12 + age * 0.20) * (1 - p) * radius * 0.012;
      const px = Math.cos(a) * (r + ripple), py = Math.sin(a) * (r + ripple);
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    c.strokeStyle = `rgba(160, 42, 32, ${alpha * 0.4})`;
    c.lineWidth = 11 * (1 - p) + 2; c.stroke();
    c.strokeStyle = `rgba(255, 207, 145, ${alpha})`;
    c.lineWidth = 2.2 * (1 - p) + 0.6; c.stroke();
  }

  // Fissuras curtas e lascas expulsas pelo brado, geradas sem partículas persistentes.
  const expansion = 1 - Math.pow(1 - life, 3);
  for (let i = 0; i < 12; i++) {
    const a = i * TAU / 12 + 0.12;
    const distance = radius * (0.16 + expansion * 0.74);
    c.save(); c.rotate(a);
    c.strokeStyle = `rgba(242, 126, 76, ${(1 - life) * 0.55})`;
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(distance * 0.55, 0); c.lineTo(distance * 0.72, -3);
    c.lineTo(distance * 0.82, 2); c.lineTo(distance, 0); c.stroke();
    c.fillStyle = `rgba(255, 225, 173, ${(1 - life) * 0.8})`;
    c.fillRect(distance, -1.3, 3 + (i % 3), 2.6);
    c.restore();
  }

  // Inscrições no limite da onda tornam o raio do rugido legível por um instante.
  const runeAlpha = Math.sin(Math.PI * life) * 0.65;
  for (let i = 0; i < 8; i++) {
    const a = i * TAU / 8;
    c.save();
    c.translate(Math.cos(a) * radius * 0.9, Math.sin(a) * radius * 0.9);
    c.rotate(a + Math.PI / 2);
    c.strokeStyle = `rgba(248, 197, 119, ${runeAlpha})`;
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(0, -5); c.lineTo(0, 5);
    c.moveTo(-4, -3); c.lineTo(0, 0); c.lineTo(4, -3);
    c.stroke(); c.restore();
  }
  c.restore();
}

/** Manifestação ancestral e brasas em coordenadas locais do modelo do herói. */
export function drawKragdorFury(c, timer, tFrame, bob, headroom = Infinity) {
  if (!(timer > 0)) return;
  const age = KRAGDOR_ULT.duration - timer;
  const fade = Math.min(1, timer / 30);
  const burst = Math.max(0, 1 - age / KRAGDOR_ULT.waveDuration);
  c.save();
  c.globalAlpha *= fade;

  // Selo espectral ergue-se atrás do campeão durante a liberação do rugido.
  if (burst > 0) {
    const size = 2.0 + (1 - burst) * 0.5;
    const y = Math.max(-12 - (1 - burst) * 9 + bob, -headroom + size * 11);
    drawAncestralSeal(c, 0, y, size, burst * 0.8);
  }
  c.strokeStyle = 'rgba(210, 64, 44, 0.65)';
  c.lineWidth = 1.3;
  c.beginPath();
  c.ellipse(0, 15 + bob, 21, 6, 0, 0, TAU); c.stroke();
  c.strokeStyle = 'rgba(255, 201, 126, 0.85)';
  c.lineWidth = 0.7;
  for (let i = 0; i < 3; i++) {
    const a = -tFrame * 0.035 + i * TAU / 3;
    c.beginPath(); c.ellipse(0, 15 + bob, 23, 7, 0, a, a + 0.65); c.stroke();
  }

  // Fios ascendentes nas laterais preservam a leitura do corpo e das tatuagens.
  for (let i = 0; i < 8; i++) {
    const p = ((age * 0.024 + i / 8) % 1 + 1) % 1;
    const side = i % 2 ? 1 : -1;
    const x = side * (15 + Math.sin(i * 2.4 + p * 3) * 3);
    const y = 12 - p * 40 + bob;
    c.strokeStyle = `rgba(255, ${Math.round(115 + p * 90)}, 100, ${Math.sin(p * Math.PI) * 0.7})`;
    c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(x, y + 4); c.lineTo(x - side, y); c.stroke();
  }
  c.restore();
}

/** Impacto, atordoamento e marca de vulnerabilidade exclusivos do Rugido Ancestral. */
export function drawKragdorAffliction(c, e, tFrame) {
  if (!(e.roarMarkTimer > 0 && e.isVulnerable && e.vulnerableTimer > 0)) return;
  const age = KRAGDOR_ULT.vulnerableDuration - e.roarMarkTimer;
  const fade = Math.min(1, e.roarMarkTimer / 24, e.vulnerableTimer / 24);
  const r = (e.radius || 14) + 5;
  c.save();
  c.globalAlpha *= fade;

  // Estilhaços de pressão no primeiro impacto.
  if (age < 22) {
    const p = age / 22;
    c.strokeStyle = `rgba(255, 220, 160, ${1 - p})`;
    c.lineWidth = 2 * (1 - p) + 0.5;
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6;
      c.beginPath();
      c.moveTo(Math.cos(a) * (r + p * 10), Math.sin(a) * (r + p * 10));
      c.lineTo(Math.cos(a) * (r + 6 + p * 18), Math.sin(a) * (r + 6 + p * 18));
      c.stroke();
    }
  }

  // Três marcas de garras em cada flanco persistem somente durante a vulnerabilidade.
  c.strokeStyle = `rgba(241, 113, 78, ${0.65 + Math.sin(tFrame * 0.10) * 0.15})`;
  c.lineWidth = 1.6;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(side * (r + 1 + i * 2), -7 + i * 4);
      c.lineTo(side * (r - 2 + i * 2), -2 + i * 4); c.stroke();
    }
  }
  const markerY = -r * 1.35 - (e.isElite || e.isMiniBoss ? 19 : 9);
  drawAncestralSeal(c, 0, markerY, 0.48, 0.9);
  if (e.stunTimer > 0) {
    c.strokeStyle = 'rgba(255, 218, 158, 0.7)';
    c.lineWidth = 0.9;
    c.beginPath(); c.ellipse(0, markerY, 11, 4, 0, 0, TAU); c.stroke();
    for (let i = 0; i < 3; i++) {
      const a = tFrame * 0.13 + i * TAU / 3;
      c.fillStyle = '#fff0cb';
      c.fillRect(Math.cos(a) * 11 - 1, markerY + Math.sin(a) * 4 - 1, 2, 2);
    }
  }
  c.restore();
}
