/**
 * src/config/kaelUlt.js
 * 
 * Parâmetros de timing e cinemática da Travessia Espectral de Kael (Manto de Fumaça).
 * Todos os tempos em quadros a 60 Hz. Compartilhados entre combate e prévia visual.
 */

export const KAEL_ULT = Object.freeze({
  duration: 180,           // 3.0s de travessia espectral a 60 FPS
  entryDuration: 11,       // ~180ms: abertura rápida da fissura e ruptura de entrada
  exitDuration: 16,        // ~260ms: recomposição da matéria e fechamento da fenda
  speedMult: 2.0,          // Multiplicador de velocidade no estado espectral
  trailSpacing: 18,        // Distância entre amostragens de ecos no cenário
  trailLife: 50,           // Vida dos ecos espectrais residuais
  hitFissureLife: 16       // Vida das micro-fissuras no impacto crítico
});

/**
 * Retorna as fases normalizadas da transição espectral baseadas no timer restante.
 * @param {number} timer invisTimer restante
 * @param {number} duration Duração total configurada
 */
export function getKaelPhaseProgress(timer, duration = KAEL_ULT.duration) {
  if (!(timer > 0)) {
    return {
      active: false,
      entryProgress: 1,
      exitProgress: 1,
      bodyAlpha: 1.0,
      phaseIntensity: 0,
      isEntering: false,
      isExiting: false
    };
  }

  const age = Math.max(0, duration - timer);
  const isEntering = age < KAEL_ULT.entryDuration;
  const entryProgress = Math.min(1, age / KAEL_ULT.entryDuration);

  const isExiting = timer < KAEL_ULT.exitDuration;
  const exitProgress = Math.max(0, Math.min(1, 1 - timer / KAEL_ULT.exitDuration));

  // Intensidade do estado espectral: 0 no início -> 1 no platô -> 0 na recomposição final
  let phaseIntensity = 1.0;
  if (isEntering) {
    phaseIntensity = entryProgress;
  } else if (isExiting) {
    phaseIntensity = Math.max(0, timer / KAEL_ULT.exitDuration);
  }

  // Opacidade do corpo: transiciona de 1.0 -> ~0.48 -> 1.0
  const bodyAlpha = 1.0 - phaseIntensity * 0.52;

  return {
    active: true,
    entryProgress,
    exitProgress,
    bodyAlpha,
    phaseIntensity,
    isEntering,
    isExiting
  };
}
