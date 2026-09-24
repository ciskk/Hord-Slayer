// Tempos em frames de simulação (60 Hz). Compartilhados com a prévia visual.
export const KRAGDOR_ULT = Object.freeze({
  duration: 240,
  radius: 220,
  stunDuration: 90,
  vulnerableDuration: 180,
  waveDuration: 48,
  poseDuration: 36
});

export function getKragdorRoarPose(timer) {
  if (!(timer > 0)) return 0;
  const age = Math.max(0, KRAGDOR_ULT.duration - timer);
  return Math.min(1, age / 4) * Math.pow(Math.max(0, 1 - age / KRAGDOR_ULT.poseDuration), 0.7);
}
