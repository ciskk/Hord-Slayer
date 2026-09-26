/**
 * src/render/heroTransition.js
 * 
 * Transição Elemental Cinética (Hero Shifting & Materialization)
 * Ritual diegético de invocação ancestral no topo do Altar dos Condenados.
 * 
 * Coreografia Temporal (420ms - 500ms):
 * 1. 0ms - 140ms:   Ruptura e Dissolução (Saída com assinatura elemental)
 * 2. 140ms - 220ms: O Vácuo Suspenso (Distorção de calor/lente e sucção mística)
 * 3. 220ms - 340ms: O Impacto Vertical (God Ray denso, impacto às 260ms na laje,
 *                   clarão incandescente, choque 360°, tranco na roseta)
 * 4. 340ms - 500ms: A Apoteose (Materialização, pose de impacto e emergência)
 * 5. Fast-Switching Inteligente com colapso imediato para o feixe do novo herói
 */

import { CHARACTERS } from '../config/characters.js';
import { playSfx, triggerHaptic, applyVacuumAudioFilter } from '../core/audio.js';
import { renderHeroModel } from './heroes/index.js';

export const HERO_ELEMENTAL_THEMES = {
  KNIGHT: {
    primary: '#f1c40f',
    secondary: '#f39c12',
    accent: '#ffffff',
    glow: 'rgba(241, 196, 15, 0.45)',
    element: 'holy'
  },
  MAGE: {
    primary: '#ff7675',
    secondary: '#e67e22',
    accent: '#ffa502',
    glow: 'rgba(255, 118, 117, 0.48)',
    element: 'fire'
  },
  ROGUE: {
    primary: '#a855f7',
    secondary: '#6c5ce7',
    accent: '#c084fc',
    glow: 'rgba(168, 85, 247, 0.48)',
    element: 'shadow'
  },
  BARBARIAN: {
    primary: '#e74c3c',
    secondary: '#c0392b',
    accent: '#f39c12',
    glow: 'rgba(231, 76, 60, 0.52)',
    element: 'blood'
  },
  ALCHEMIST: {
    primary: '#9b59b6',
    secondary: '#2ecc71',
    accent: '#00f5d4',
    glow: 'rgba(155, 89, 182, 0.48)',
    element: 'acid'
  }
};

// Constantes de Cadência e Timing (ms)
export const TIMING = {
  TOTAL: 500,
  DISSOLUTION_END: 140,
  VACUUM_END: 220,
  IMPACT_TRIGGER: 260,
  DESCEND_END: 340,
  MIST_RETURN_MS: 2000
};

// Estado da Transição
class HeroTransitionController {
  constructor() {
    this.active = false;
    this.elapsedMs = 0;
    this.fromHeroKey = 'KNIGHT';
    this.toHeroKey = 'KNIGHT';
    this.facing = 1;
    this.scale = 6.6;
    this.onSwapCallback = null;
    this.hasSwappedHero = false;

    // Dinâmica de Altar & Cenário
    this.mistDisplacement = 0; // -0.2 (sucção) a 1.0 (arremesso), decaindo em 2s
    this.rosetteRecoil = 0;     // Tranco inercial angular (rad)
    this.rosetteRecoilVel = 0;
    this.screenShake = 0;       // Shake local em pixels
    this.atmosphericFlashAlpha = 0;
    this.runeOverloadProgress = 0; // Cascata das ley-lines

    // Pools de Partículas e Entidades Efêmeras
    this.particles = [];
    this.shockwaves = [];
    this.faithShields = [];
    this.phoenixFeathers = [];
    this.shadowRavens = [];
    this.chemicalBubbles = [];
    this.glassShards = [];
  }

  /**
   * Inicia o ritual de invocação entre dois campeões
   */
  start(fromKey, toKey, facing = 1, scale = 6.6, onHeroSwap = null) {
    if (!CHARACTERS[toKey]) return;

    // Regra de Interrupção Inteligente (Fast-Switching)
    if (this.active) {
      this.fastSwitch(toKey, onHeroSwap);
      return;
    }

    if (fromKey === toKey) return;

    this.active = true;
    this.elapsedMs = 0;
    this.fromHeroKey = fromKey;
    this.toHeroKey = toKey;
    this.facing = facing;
    this.scale = scale;
    this.onSwapCallback = onHeroSwap;
    this.hasSwappedHero = false;

    this.particles = [];
    this.shockwaves = [];
    this.faithShields = [];
    this.phoenixFeathers = [];
    this.shadowRavens = [];
    this.chemicalBubbles = [];
    this.glassShards = [];

    // Áudio e Háptica do Desvanecimento
    const dissolveSfx = `altar_dissolve_${fromKey.toLowerCase()}`;
    try { playSfx(dissolveSfx); } catch (e) {}
    triggerHaptic('light');

    // Inicializa partículas de dissolução do herói de saída
    this.spawnDissolutionParticles(fromKey);
  }

  /**
   * Fast-Switching: Pula dissolução e vácuo, colapsa partículas no feixe descendente
   */
  fastSwitch(newToKey, onHeroSwap = null) {
    this.toHeroKey = newToKey;
    if (onHeroSwap) this.onSwapCallback = onHeroSwap;

    // Colapso gravitacional instantâneo de partículas pendentes no feixe
    for (let p of this.particles) {
      p.vx = -p.x * 0.25;
      p.vy = -p.y * 0.25;
      p.life = Math.max(p.life, p.maxLife * 0.7);
    }

    // Salta diretamente para a fase de impacto/materialização
    this.elapsedMs = TIMING.VACUUM_END + 20; // 240ms (preparando o feixe)
    this.hasSwappedHero = false;
  }

  /**
   * Atualiza a física, cadência e efeitos a cada frame
   */
  update(dtSeconds) {
    const dtMs = dtSeconds * 1000;

    // Decaimento do retorno suave da névoa ao longo de 2 segundos
    if (this.mistDisplacement > 0) {
      this.mistDisplacement = Math.max(0, this.mistDisplacement - dtSeconds / (TIMING.MIST_RETURN_MS / 1000));
    } else if (this.mistDisplacement < 0 && !this.active) {
      this.mistDisplacement = Math.min(0, this.mistDisplacement + dtSeconds * 2.0);
    }

    // Tranco Angular na Roseta (Sistema mola-amortecedor inercial)
    if (Math.abs(this.rosetteRecoil) > 0.001 || Math.abs(this.rosetteRecoilVel) > 0.001) {
      const spring = -32.0;
      const damp = -7.5;
      const accel = spring * this.rosetteRecoil + damp * this.rosetteRecoilVel;
      this.rosetteRecoilVel += accel * dtSeconds;
      this.rosetteRecoil += this.rosetteRecoilVel * dtSeconds;
      if (Math.abs(this.rosetteRecoil) < 0.0005 && Math.abs(this.rosetteRecoilVel) < 0.0005) {
        this.rosetteRecoil = 0;
        this.rosetteRecoilVel = 0;
      }
    }

    // Screen shake local
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dtSeconds * 34);
    }

    // Flash atmosférico
    if (this.atmosphericFlashAlpha > 0) {
      this.atmosphericFlashAlpha = Math.max(0, this.atmosphericFlashAlpha - dtSeconds * 3.2);
    }

    // Sobrecarga rúnica das ley-lines
    if (this.runeOverloadProgress > 0) {
      this.runeOverloadProgress = Math.min(1.0, this.runeOverloadProgress + dtSeconds * 2.4);
      if (this.runeOverloadProgress >= 1.0) {
        this.runeOverloadProgress = 0;
      }
    }

    // Atualiza partículas ativas
    this.updateParticles(dtSeconds);

    if (!this.active) return;

    const prevMs = this.elapsedMs;
    this.elapsedMs += dtMs;

    // Disparos sincronizados da coreografia temporal

    // 140ms: O Vácuo Suspenso
    if (prevMs < TIMING.DISSOLUTION_END && this.elapsedMs >= TIMING.DISSOLUTION_END) {
      this.mistDisplacement = -0.22; // Sucção mística puxando a névoa para o centro
      applyVacuumAudioFilter(80);    // Corte abrupto nas frequências agudas por ~80ms
    }

    // 260ms: O Impacto Vertical (Descida Colidindo na Laje)
    if (prevMs < TIMING.IMPACT_TRIGGER && this.elapsedMs >= TIMING.IMPACT_TRIGGER) {
      this.triggerImpact();
    }

    // 500ms: Conclusão da Transição
    if (this.elapsedMs >= TIMING.TOTAL) {
      this.active = false;
      this.elapsedMs = TIMING.TOTAL;
    }
  }

  /**
   * Disparo físico do impacto vertical no centro da laje de sacrifício
   */
  triggerImpact() {
    if (!this.hasSwappedHero) {
      this.hasSwappedHero = true;
      if (typeof this.onSwapCallback === 'function') {
        this.onSwapCallback(this.toHeroKey);
      }
    }

    // 1. Áudio: Stone thud ressonante + assinatura elemental do novo herói
    try {
      playSfx('altar_stone_thud');
      playSfx(`altar_materialize_${this.toHeroKey.toLowerCase()}`);
    } catch (e) {}

    // 2. Resposta Háptica Firme
    triggerHaptic('heavy');

    // 3. Screen Shake de Impacto (Kragdor mais brutal)
    this.screenShake = this.toHeroKey === 'BARBARIAN' ? 10.5 : 5.8;

    // 4. Expulsão da Névoa Rasteira em 360° (limpando o topo do pedestal)
    this.mistDisplacement = 1.0;

    // 5. Tranco Angular na Roseta do Astrolábio (Micro-recuo inercial celeste)
    this.rosetteRecoil = -0.16;
    this.rosetteRecoilVel = 1.8;

    // 6. Iluminação Atmosférica de Fundo
    this.atmosphericFlashAlpha = 0.52;

    // 7. Sobrecarga Rúnica das Ley-lines (Cascata a partir do centro)
    this.runeOverloadProgress = 0.01;

    // 8. Ondas de Choque e Entidades de Materialização
    this.spawnImpactEntities(this.toHeroKey);
  }

  /**
   * Gera partículas elementais de dissolução para o herói de saída
   */
  spawnDissolutionParticles(heroKey) {
    const theme = HERO_ELEMENTAL_THEMES[heroKey] || HERO_ELEMENTAL_THEMES.KNIGHT;
    const count = 38;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 1.2 + Math.random() * 3.8;

      if (heroKey === 'KNIGHT') {
        // Roland: Lascas poligonais de prisma e poeira dourada cintilante
        this.particles.push({
          type: 'prism_shard',
          x: (Math.random() - 0.5) * 28,
          y: (Math.random() - 0.5) * 44 - 6,
          vx: Math.cos(angle) * speed * 0.9,
          vy: -Math.abs(Math.sin(angle) * speed) - 1.8, // Ascensão aos arcos góticos
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.18,
          size: 3.5 + Math.random() * 4.5,
          color: Math.random() > 0.35 ? theme.primary : '#ffffff',
          alpha: 0.95,
          life: 0,
          maxLife: 28 + Math.random() * 18
        });
      } else if (heroKey === 'MAGE') {
        // Ignis: Labaredas em vórtice térmico ascendente e cinzas
        this.particles.push({
          type: 'fire_vortex',
          x: (Math.random() - 0.5) * 24,
          y: (Math.random() - 0.5) * 40 - 4,
          vx: (Math.random() - 0.5) * 1.8,
          vy: -2.2 - Math.random() * 3.5,
          angularVel: 0.08 + Math.random() * 0.12,
          radius: 12 + Math.random() * 20,
          angle: Math.random() * Math.PI * 2,
          size: 3.0 + Math.random() * 4.0,
          color: Math.random() > 0.4 ? theme.primary : '#ffa502',
          alpha: 1.0,
          life: 0,
          maxLife: 26 + Math.random() * 16,
          isAsh: Math.random() > 0.75
        });
      } else if (heroKey === 'ROGUE') {
        // Kael: Gotas de tinta negra, lâminas roxas e revoada de corvos de sombra
        const isRaven = i < 6;
        this.particles.push({
          type: isRaven ? 'shadow_raven' : 'ink_droplet',
          x: (Math.random() - 0.5) * 24,
          y: (Math.random() - 0.5) * 36 - 6,
          vx: (isRaven ? (i % 2 === 0 ? 1 : -1) * (2.0 + Math.random() * 2.5) : (Math.random() - 0.5) * 2.2),
          vy: isRaven ? -1.8 - Math.random() * 2.0 : -0.8 - Math.random() * 2.0,
          size: isRaven ? 8 + Math.random() * 4 : 3.5 + Math.random() * 4.5,
          color: isRaven ? '#070913' : (Math.random() > 0.4 ? theme.primary : '#1e1b4b'),
          alpha: 0.92,
          wingPhase: Math.random() * Math.PI * 2,
          life: 0,
          maxLife: isRaven ? 35 + Math.random() * 15 : 24 + Math.random() * 14
        });
      } else if (heroKey === 'BARBARIAN') {
        // Kragdor: Estilhaços de ferro forjado, faíscas avermelhadas e poeira
        this.particles.push({
          type: 'iron_shard',
          x: (Math.random() - 0.5) * 30,
          y: (Math.random() - 0.5) * 44 - 6,
          vx: Math.cos(angle) * (speed + 2.5),
          vy: Math.sin(angle) * (speed + 1.5) - 1.2,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.28,
          size: 3.0 + Math.random() * 5.0,
          color: Math.random() > 0.5 ? '#e74c3c' : (Math.random() > 0.5 ? '#d35400' : '#4a4a4a'),
          alpha: 1.0,
          life: 0,
          maxLife: 24 + Math.random() * 16
        });
      } else if (heroKey === 'ALCHEMIST') {
        // Valeria: Efervescência química, bolhas ácidas e vapor esmeralda
        this.particles.push({
          type: 'acid_bubble',
          x: (Math.random() - 0.5) * 26,
          y: (Math.random() - 0.5) * 40 - 6,
          vx: (Math.random() - 0.5) * 1.6,
          vy: -1.2 - Math.random() * 2.6,
          wobblePhase: Math.random() * Math.PI * 2,
          size: 3.5 + Math.random() * 5.5,
          color: Math.random() > 0.45 ? '#2ecc71' : '#9b59b6',
          alpha: 0.88,
          life: 0,
          maxLife: 26 + Math.random() * 18
        });
      }
    }
  }

  /**
   * Gera entidades e feixes de materialização no impacto do novo herói
   */
  spawnImpactEntities(heroKey) {
    const theme = HERO_ELEMENTAL_THEMES[heroKey] || HERO_ELEMENTAL_THEMES.KNIGHT;

    // 1. Onda de choque expansiva comum
    this.shockwaves.push({
      radius: 10,
      maxRadius: 260,
      alpha: 1.0,
      speed: 12.0,
      color: theme.primary
    });

    // 2. Entidades específicas da assinatura elemental
    if (heroKey === 'KNIGHT') {
      // Roland: Anel de escudos de fé que se expande e se retrai para o peito
      this.faithShields = [];
      const shieldCount = 6;
      for (let s = 0; s < shieldCount; s++) {
        this.faithShields.push({
          angle: (s / shieldCount) * Math.PI * 2,
          maxDist: 78,
          currentDist: 0,
          size: 14,
          alpha: 0.95
        });
      }
    } else if (heroKey === 'MAGE') {
      // Ignis: Coluna de chamas e asas de fênix abrindo-se
      this.phoenixFeathers = [];
      for (let f = 0; f < 18; f++) {
        const side = f % 2 === 0 ? 1 : -1;
        this.phoenixFeathers.push({
          side,
          progress: 0,
          len: 30 + Math.random() * 45,
          angleOffset: (Math.random() - 0.5) * 0.4,
          color: Math.random() > 0.4 ? '#ff7675' : '#ffa502'
        });
      }
    } else if (heroKey === 'ALCHEMIST') {
      // Valeria: Frascos estilhaçados e nuvens de vapor esmeralda rasteiro
      this.chemicalBubbles = [];
      for (let b = 0; b < 24; b++) {
        this.chemicalBubbles.push({
          x: (Math.random() - 0.5) * 70,
          y: 6 + Math.random() * 12,
          vx: (Math.random() - 0.5) * 3.8,
          vy: -0.6 - Math.random() * 1.5,
          size: 6.0 + Math.random() * 12.0,
          color: Math.random() > 0.5 ? '#2ecc71' : '#a29bfe',
          alpha: 0.85,
          life: 0,
          maxLife: 42 + Math.random() * 20
        });
      }
    }
  }

  /**
   * Atualização contínua das partículas ativas
   */
  updateParticles(dtSeconds) {
    const dt = dtSeconds * 60;

    // Atualiza partículas elementais
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      const lifeProgress = p.life / p.maxLife;

      if (p.type === 'prism_shard') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.rotSpeed * dt;
        p.alpha = Math.max(0, 1 - lifeProgress);
      } else if (p.type === 'fire_vortex') {
        p.angle += p.angularVel * dt;
        p.radius = Math.max(2, p.radius - 0.25 * dt);
        p.x = Math.cos(p.angle) * p.radius;
        p.y += p.vy * dt;
        p.alpha = Math.max(0, 1 - lifeProgress);
      } else if (p.type === 'shadow_raven') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.wingPhase += 0.35 * dt;
        p.alpha = Math.max(0, 1 - lifeProgress);
      } else if (p.type === 'ink_droplet') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.size += 0.15 * dt;
        p.alpha = Math.max(0, 1 - lifeProgress);
      } else if (p.type === 'iron_shard') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.18 * dt; // Gravidade
        p.rot += p.rotSpeed * dt;
        p.alpha = Math.max(0, 1 - lifeProgress);
      } else if (p.type === 'acid_bubble') {
        p.wobblePhase += 0.15 * dt;
        p.x += (p.vx + Math.sin(p.wobblePhase) * 0.5) * dt;
        p.y += p.vy * dt;
        p.alpha = Math.max(0, 1 - lifeProgress);
      }
    }

    // Ondas de choque
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed * dt;
      sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
      if (sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Névoa química de Valeria
    for (let i = this.chemicalBubbles.length - 1; i >= 0; i--) {
      const b = this.chemicalBubbles[i];
      b.life += dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.size += 0.25 * dt;
      b.alpha = Math.max(0, (1 - b.life / b.maxLife) * 0.75);
      if (b.life >= b.maxLife) {
        this.chemicalBubbles.splice(i, 1);
      }
    }
  }

  // Getters para integração diegética de cenário e Altar
  isTransitionActive() { return this.active; }
  getPhase() {
    if (!this.active) return 'none';
    if (this.elapsedMs < TIMING.DISSOLUTION_END) return 'dissolution';
    if (this.elapsedMs < TIMING.VACUUM_END) return 'vacuum';
    if (this.elapsedMs < TIMING.DESCEND_END) return 'descend';
    return 'materialization';
  }
  getMistDisplacement() { return this.mistDisplacement; }
  getRosetteRecoil() { return this.rosetteRecoil; }
  getRuneOverloadProgress() { return this.runeOverloadProgress; }
  getAtmosphericFlashAlpha() { return this.atmosphericFlashAlpha; }
  getShakeOffset() {
    if (this.screenShake <= 0) return { sx: 0, sy: 0 };
    return {
      sx: (Math.random() - 0.5) * this.screenShake,
      sy: (Math.random() - 0.5) * this.screenShake
    };
  }
}

export const heroTransition = new HeroTransitionController();

/**
 * ============================================================================
 * RENDERIZADORES PROCEDURAIS DOS 4 MICROMOMENTOS DA TRANSIÇÃO
 * ============================================================================
 */

/**
 * 1. Renderiza a Fase 1: Ruptura e Dissolução do Herói de Saída
 */
export function renderHeroDissolution(c, centerX, centerY, scale, facing, colors) {
  const t = heroTransition.elapsedMs;
  const progress = Math.max(0, Math.min(1, t / TIMING.DISSOLUTION_END));
  const alpha = 1 - progress;
  const heroKey = heroTransition.fromHeroKey;

  c.save();
  c.translate(centerX, centerY);

  // Sobrecarga luminosa nas bordas antes de romper a forma física
  const edgeOverload = Math.sin(progress * Math.PI) * 0.85;
  if (edgeOverload > 0.05) {
    c.save();
    c.globalAlpha = edgeOverload * 0.75;
    const glowGrad = c.createRadialGradient(0, -scale * 2, 4, 0, -scale * 2, scale * 12);
    glowGrad.addColorStop(0, '#ffffff');
    glowGrad.addColorStop(0.4, colors.primary);
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    c.fillStyle = glowGrad;
    c.beginPath();
    c.arc(0, -scale * 2, scale * 12, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  // Renderiza silhueta do herói com fade out e leve elevação
  c.save();
  c.globalAlpha = alpha;
  const liftY = -progress * scale * 2.4;
  c.translate(0, liftY);

  const heroState = {
    x: 0,
    y: 0,
    facing,
    scale,
    effectHeadroom: 25,
    isMoving: false,
    walkCycle: 0,
    frameCount: t * 0.1,
    radius: Math.round(scale * 4.2),
    showShadow: false
  };

  renderHeroModel(c, heroKey, heroState);
  c.restore();

  // Partículas de dissolução relativas ao centro do herói
  renderDissolutionParticlePool(c, scale);

  c.restore();
}

function renderDissolutionParticlePool(c, scale) {
  for (let p of heroTransition.particles) {
    c.save();
    c.globalAlpha = p.alpha;
    c.fillStyle = p.color;
    c.strokeStyle = p.color;

    if (p.type === 'prism_shard') {
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.beginPath();
      c.moveTo(0, -p.size);
      c.lineTo(p.size * 0.7, p.size * 0.6);
      c.lineTo(-p.size * 0.7, p.size * 0.6);
      c.closePath();
      c.fill();
      c.lineWidth = 1.0;
      c.stroke();
    } else if (p.type === 'fire_vortex') {
      c.translate(p.x, p.y);
      c.beginPath();
      c.arc(0, 0, p.size * (1 - p.life / p.maxLife), 0, Math.PI * 2);
      c.fill();
    } else if (p.type === 'shadow_raven') {
      c.translate(p.x, p.y);
      const flap = Math.sin(p.wingPhase) * 4.5;
      c.beginPath();
      c.moveTo(-p.size, flap);
      c.lineTo(0, -2);
      c.lineTo(p.size, flap);
      c.lineTo(0, 3);
      c.closePath();
      c.fill();
    } else if (p.type === 'ink_droplet') {
      c.beginPath();
      c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      c.fill();
    } else if (p.type === 'iron_shard') {
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size * 1.5);
    } else if (p.type === 'acid_bubble') {
      c.beginPath();
      c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#ffffff';
      c.lineWidth = 0.8;
      c.stroke();
    }

    c.restore();
  }
}

/**
 * 2. Renderiza a Fase 2: O Vácuo Suspenso (140ms a 220ms)
 * Pedestal vazio com ar trêmulo e distorção de calor/lente gravitacional
 */
export function renderHeroVacuum(c, centerX, centerY, scale, colors) {
  const t = heroTransition.elapsedMs;
  const vacuumTime = (t - TIMING.DISSOLUTION_END) / (TIMING.VACUUM_END - TIMING.DISSOLUTION_END);
  const breath = Math.sin(vacuumTime * Math.PI);

  c.save();
  c.translate(centerX, centerY - scale * 2);

  // 1. Distorção Gravitacional e Anéis de Calor Efémeros
  for (let ring = 0; ring < 3; ring++) {
    const ringPhase = (vacuumTime * 1.8 + ring * 0.35) % 1.0;
    const ringRadius = (scale * 3.5) + ringPhase * scale * 9.0;
    const ringAlpha = (1 - ringPhase) * 0.32 * breath;

    c.save();
    c.scale(1, 0.45); // Perspectiva do pedestal
    c.strokeStyle = '#ffffff';
    c.lineWidth = 1.2;
    c.globalAlpha = ringAlpha * 0.7;
    c.beginPath();
    c.arc(0, 0, ringRadius, 0, Math.PI * 2);
    c.stroke();

    c.strokeStyle = colors.primary;
    c.lineWidth = 2.4;
    c.globalAlpha = ringAlpha * 0.5;
    c.stroke();
    c.restore();
  }

  // 2. Linhas de tremor térmico vertical (Heat Shimmer Distortion)
  c.save();
  c.lineWidth = 1.0;
  for (let l = -3; l <= 3; l++) {
    const lx = l * scale * 2.8;
    const wobble = Math.sin(t * 0.08 + l * 1.4) * 3.2;
    c.strokeStyle = `${colors.primary}22`;
    c.globalAlpha = 0.28 * breath;
    c.beginPath();
    c.moveTo(lx, scale * 10);
    c.quadraticCurveTo(lx + wobble, 0, lx - wobble, -scale * 12);
    c.stroke();
  }
  c.restore();

  // Partículas residuais sendo atraídas para o núcleo de sucção
  renderDissolutionParticlePool(c, scale);

  c.restore();
}

/**
 * 3. Renderiza a Fase 3: O Impacto Vertical (220ms a 340ms)
 * Feixe de luz focal denso (God Ray), projétil elemental e impacto na laje às 260ms
 */
export function renderHeroImpactDescend(c, width, height, centerX, centerY, footY, scale, colors) {
  const t = heroTransition.elapsedMs;
  const toKey = heroTransition.toHeroKey;
  const theme = HERO_ELEMENTAL_THEMES[toKey] || HERO_ELEMENTAL_THEMES.KNIGHT;

  c.save();

  // 1. O Feixe de Luz Vertical Denso (God Ray Focal) da Abóbada
  const beamWidth = Math.min(260, Math.max(70, scale * 16));
  const beamProgress = Math.max(0, Math.min(1, (t - TIMING.VACUUM_END) / 50));
  const beamTopY = -40;
  const beamBottomY = footY;

  c.save();
  const godRay = c.createLinearGradient(centerX - beamWidth / 2, 0, centerX + beamWidth / 2, 0);
  godRay.addColorStop(0, 'rgba(0, 0, 0, 0)');
  godRay.addColorStop(0.3, `${theme.primary}26`);
  godRay.addColorStop(0.46, `${theme.primary}88`);
  godRay.addColorStop(0.50, '#ffffff'); // Núcleo branco incandescente
  godRay.addColorStop(0.54, `${theme.primary}88`);
  godRay.addColorStop(0.7, `${theme.primary}26`);
  godRay.addColorStop(1, 'rgba(0, 0, 0, 0)');

  c.fillStyle = godRay;
  c.globalAlpha = beamProgress * 0.95;
  c.fillRect(centerX - beamWidth / 2, beamTopY, beamWidth, beamBottomY - beamTopY);
  c.restore();

  // 2. Projétil de Descida Específico (220ms - 260ms)
  if (t < TIMING.IMPACT_TRIGGER) {
    const dropProgress = (t - TIMING.VACUUM_END) / (TIMING.IMPACT_TRIGGER - TIMING.VACUUM_END);
    const dropY = beamTopY + (footY - beamTopY) * dropProgress;

    c.save();
    c.translate(centerX, dropY);

    if (toKey === 'KNIGHT') {
      // Roland: Relâmpago de luz solar pura (Bloom em camadas sem overhead de shadowBlur)
      c.beginPath();
      c.moveTo(0, -60);
      c.lineTo(-6, -30);
      c.lineTo(8, 0);
      // Halo difuso externo
      c.strokeStyle = 'rgba(241, 196, 15, 0.35)';
      c.lineWidth = 10;
      c.stroke();
      // Núcleo de ouro incandescente
      c.strokeStyle = 'rgba(241, 196, 15, 0.85)';
      c.lineWidth = 5;
      c.stroke();
      // Núcleo de luz pura branca
      c.strokeStyle = '#ffffff';
      c.lineWidth = 2.4;
      c.stroke();
    } else if (toKey === 'MAGE') {
      // Ignis: Gota de fogo líquido rasgando o ar
      const dropGrad = c.createLinearGradient(0, -50, 0, 10);
      dropGrad.addColorStop(0, 'rgba(255, 118, 117, 0)');
      dropGrad.addColorStop(0.6, '#ff7675');
      dropGrad.addColorStop(1, '#ffa502');
      c.fillStyle = dropGrad;
      c.beginPath();
      c.ellipse(0, 0, 7, 26, 0, 0, Math.PI * 2);
      c.fill();
    } else if (toKey === 'ROGUE') {
      // Kael: Fenda dimensional e feixe espectral violeta
      c.strokeStyle = '#c084fc';
      c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(0, -70);
      c.lineTo(0, 10);
      c.stroke();
    } else if (toKey === 'BARBARIAN') {
      // Kragdor: Meteoro incandescente com rastro de rocha vulcânica
      c.fillStyle = '#f39c12';
      c.beginPath();
      c.arc(0, 0, 14, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(0, 0, 6, 0, Math.PI * 2);
      c.fill();
    } else if (toKey === 'ALCHEMIST') {
      // Valeria: Três frascos translúcidos caindo em arco convergente
      const colors3 = ['#2ecc71', '#9b59b6', '#f39c12'];
      [-14, 0, 14].forEach((xOff, idx) => {
        c.fillStyle = colors3[idx];
        c.fillRect(xOff - 3, -12, 6, 14);
      });
    }
    c.restore();
  }

  // 3. Clarão incandescente na laje no momento do impacto (260ms - 340ms)
  if (t >= TIMING.IMPACT_TRIGGER) {
    const postImpact = (t - TIMING.IMPACT_TRIGGER) / (TIMING.DESCEND_END - TIMING.IMPACT_TRIGGER);
    const flashAlpha = Math.max(0, (1 - postImpact) * 0.95);

    c.save();
    c.translate(centerX, footY);
    c.scale(1, 0.35); // Perspectiva da laje
    const impactGlow = c.createRadialGradient(0, 0, 5, 0, 0, scale * 26);
    impactGlow.addColorStop(0, '#ffffff');
    impactGlow.addColorStop(0.3, theme.primary);
    impactGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    c.fillStyle = impactGlow;
    c.globalAlpha = flashAlpha;
    c.beginPath();
    c.arc(0, 0, scale * 26, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  // Ondas de choque do impacto
  renderShockwaves(c, centerX, footY);

  c.restore();
}

/**
 * 4. Renderiza a Fase 4: A Apoteose (Materialização 340ms a 500ms)
 * Feixe colapsa no corpo do herói, pose de impacto erguendo o olhar e assinatura elemental
 */
export function renderHeroMaterialization(c, centerX, centerY, footY, scale, facing, colors) {
  const t = heroTransition.elapsedMs;
  const toKey = heroTransition.toHeroKey;
  const theme = HERO_ELEMENTAL_THEMES[toKey] || HERO_ELEMENTAL_THEMES.KNIGHT;
  const matProgress = Math.max(0, Math.min(1, (t - TIMING.DESCEND_END) / (TIMING.TOTAL - TIMING.DESCEND_END)));

  c.save();
  c.translate(centerX, centerY);

  // 1. Squash & Stretch na Aterrissagem (Pose de impacto subindo suavemente)
  const landingSquash = Math.sin((1 - matProgress) * Math.PI * 0.5) * 0.16;
  const crouchY = (1 - matProgress) * scale * 1.8;
  c.translate(0, crouchY);
  c.scale(1 + landingSquash * 0.8, 1 - landingSquash);

  // 2. Colapso do feixe de luz focal em centelhas
  if (matProgress < 0.65) {
    const beamCollapse = (1 - matProgress / 0.65);
    c.save();
    c.fillStyle = `${theme.primary}55`;
    c.fillRect(-scale * 2 * beamCollapse, -scale * 24, scale * 4 * beamCollapse, scale * 26);
    c.restore();
  }

  // 3. Renderização Específica do Modelo do Herói na Invocação
  c.save();
  c.globalAlpha = Math.min(1.0, 0.4 + matProgress * 0.6);

  const heroState = {
    x: 0,
    y: 0,
    facing,
    scale,
    effectHeadroom: 25,
    isMoving: false,
    walkCycle: 0,
    frameCount: t * 0.1,
    radius: Math.round(scale * 4.2),
    showShadow: false
  };

  renderHeroModel(c, toKey, heroState);
  c.restore();

  // 4. Assinatura Elemental Específica da Materialização
  renderHeroElementalApotheosis(c, toKey, scale, matProgress, theme);

  c.restore();
}

/**
 * Detalhes da apoteose elemental de cada campeão
 */
function renderHeroElementalApotheosis(c, heroKey, scale, progress, theme) {
  if (heroKey === 'KNIGHT') {
    // Roland: Anel de escudos translúcidos de fé expandindo e retraindo para o peito
    const shieldDist = Math.sin(progress * Math.PI) * 58;
    const shieldAlpha = Math.sin(progress * Math.PI) * 0.85;

    c.save();
    c.globalAlpha = shieldAlpha;
    const shieldCount = 6;
    for (let i = 0; i < shieldCount; i++) {
      const a = (i / shieldCount) * Math.PI * 2;
      const sx = Math.cos(a) * shieldDist;
      const sy = Math.sin(a) * shieldDist * 0.45 - scale * 2;

      c.save();
      c.translate(sx, sy);
      c.strokeStyle = '#f1c40f';
      c.lineWidth = 1.4;
      c.fillStyle = 'rgba(241, 196, 15, 0.18)';
      c.beginPath();
      c.moveTo(-6, -8);
      c.lineTo(6, -8);
      c.lineTo(6, 2);
      c.lineTo(0, 9);
      c.lineTo(-6, 2);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    }
    c.restore();
  } else if (heroKey === 'MAGE') {
    // Ignis: Coluna de chamas abrindo em asas de fênix
    const wingSpan = progress * scale * 14;
    const wingAlpha = Math.sin(progress * Math.PI) * 0.90;

    c.save();
    c.globalAlpha = wingAlpha;
    [-1, 1].forEach(side => {
      c.save();
      c.scale(side, 1);
      const flameWing = c.createLinearGradient(0, -scale * 2, wingSpan, -scale * 8);
      flameWing.addColorStop(0, '#ff7675');
      flameWing.addColorStop(0.5, '#ffa502');
      flameWing.addColorStop(1, 'rgba(255, 118, 117, 0)');
      c.fillStyle = flameWing;
      c.beginPath();
      c.moveTo(0, -scale * 2);
      c.quadraticCurveTo(wingSpan * 0.5, -scale * 10, wingSpan, -scale * 6);
      c.quadraticCurveTo(wingSpan * 0.4, -scale * 2, 0, scale * 3);
      c.fill();
      c.restore();
    });
    c.restore();
  } else if (heroKey === 'ROGUE') {
    // Kael: Filamentos de trevas emergindo do abismo e brilho metálico de adagas cruzadas
    const slashAlpha = Math.sin(progress * Math.PI) * 0.92;
    if (slashAlpha > 0.1) {
      c.save();
      c.globalAlpha = slashAlpha;
      // Corte em X com brilho em camadas (sem ativação do pipeline de shadowBlur)
      c.beginPath();
      c.moveTo(-22, -scale * 5); c.lineTo(22, scale * 2);
      c.moveTo(22, -scale * 5); c.lineTo(-22, scale * 2);
      c.strokeStyle = 'rgba(192, 132, 252, 0.40)';
      c.lineWidth = 8;
      c.stroke();
      c.strokeStyle = 'rgba(192, 132, 252, 0.85)';
      c.lineWidth = 4;
      c.stroke();
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.8;
      c.stroke();
      c.restore();
    }
  } else if (heroKey === 'BARBARIAN') {
    // Kragdor: Coroa de faíscas rubras e machados orbitais presentes no impacto
    const sparkAlpha = Math.sin(progress * Math.PI) * 0.95;
    c.save();
    c.globalAlpha = sparkAlpha;
    c.strokeStyle = '#e74c3c';
    c.lineWidth = 1.8;
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const r1 = scale * 8;
      const r2 = scale * (11 + (k % 2) * 3);
      c.beginPath();
      c.moveTo(Math.cos(a) * r1, Math.sin(a) * r1 * 0.4 + scale * 4);
      c.lineTo(Math.cos(a) * r2, Math.sin(a) * r2 * 0.4 + scale * 4);
      c.stroke();
    }
    c.restore();
  } else if (heroKey === 'ALCHEMIST') {
    // Valeria: Névoa espessa luminescente esmeralda se assentando ao chão
    for (let b of heroTransition.chemicalBubbles) {
      c.save();
      c.globalAlpha = b.alpha;
      c.fillStyle = b.color;
      c.beginPath();
      c.ellipse(b.x, b.y + scale * 5, b.size * 1.5, b.size * 0.6, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }
}

function renderShockwaves(c, cx, cy) {
  for (let sw of heroTransition.shockwaves) {
    c.save();
    c.translate(cx, cy);
    c.scale(1, 0.38); // Perspectiva isométrica do pedestal
    c.strokeStyle = sw.color;
    c.lineWidth = 3.5 * sw.alpha;
    c.globalAlpha = sw.alpha * 0.75;
    c.beginPath();
    c.arc(0, 0, sw.radius, 0, Math.PI * 2);
    c.stroke();

    c.strokeStyle = '#ffffff';
    c.lineWidth = 1.4 * sw.alpha;
    c.globalAlpha = sw.alpha * 0.95;
    c.stroke();
    c.restore();
  }
}
