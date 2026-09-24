// Regras compartilhadas pela simulação, renderização e prévia do machado.
export const AXE_MAX_COUNT = 3;
export const AXE_EVOLVED_COUNT = 4;
export const AXE_BASE_RADIUS = 56;
export const AXE_BASE_SPIN_SPEED = 0.085;
export const AXE_SPIN_DIRECTION = -1; // Anti-horário: o gume avança primeiro.

export function getAxeCount(state) {
  if (!(state.axeCount > 0)) return 0;
  return state.evolvedAxe ? AXE_EVOLVED_COUNT : Math.min(AXE_MAX_COUNT, state.axeCount);
}

export function getAxeSpinSpeed(state) {
  return (state.axeSpinSpeed || AXE_BASE_SPIN_SPEED) * (state.berserkTimer > 0 ? 2 : 1);
}
