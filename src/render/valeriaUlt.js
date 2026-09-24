/** Reagente Volátil — efeitos locais, determinísticos e limitados por quadro.
 * O timer existente dura 300 quadros (60 Hz). Nenhum efeito altera o combate.
 */
export const VALERIA_ULT_VISUAL_DURATION = 300;
const TAU = Math.PI * 2;

export function getValeriaPressure(timer, active = false) {
  if (!(timer > 0)) return active ? 1 : 0;
  const age = Math.max(0, VALERIA_ULT_VISUAL_DURATION - timer);
  return Math.min(1, timer / 30) * (.65 + .35 * Math.min(1, age / 12));
}

// Símbolo de destilação: gota, gargalo e travessa. Compartilhado pelo selo e vidro.
function distillationMark(c, x, y, size, color) {
  c.save(); c.translate(x, y); c.scale(size, size);
  c.strokeStyle = color; c.lineWidth = .65;
  c.beginPath(); c.moveTo(0, -4);
  c.bezierCurveTo(-1, -2, -3, 0, -2, 1.5);
  c.quadraticCurveTo(0, 4, 2, 1.5); c.quadraticCurveTo(3, 0, 0, -4);
  c.moveTo(-2.5, 4); c.lineTo(2.5, 4); c.moveTo(0, 2.5); c.lineTo(0, 5.5);
  c.stroke(); c.restore();
}

/** Plano do chão estável: não acompanha a respiração do corpo. */
export function drawValeriaSeal(c, t, pressure, detailed = false) {
  if (!(pressure > 0)) return;
  c.save(); c.translate(0, 15); c.scale(1, .38); c.globalAlpha *= pressure;
  const r = 26 + Math.sin(t * .07) * .6;
  const glow = c.createRadialGradient(0, 0, 7, 0, 0, 31);
  glow.addColorStop(0, '#33134600'); glow.addColorStop(.72, '#ac57d12c');
  glow.addColorStop(1, '#9c59d000');
  c.fillStyle = glow; c.beginPath(); c.arc(0, 0, 31, 0, TAU); c.fill();
  c.strokeStyle = '#b88bc3aa'; c.lineWidth = .8;
  c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
  c.rotate(t * .007);
  // Cinco câmaras ligadas por capilares: assinatura do bombardeio radial.
  for (let i = 0; i < 5; i++) {
    const a = i * TAU / 5;
    c.save(); c.rotate(a);
    c.strokeStyle = '#e3b87aa8'; c.lineWidth = .65;
    c.beginPath(); c.arc(0, 0, r - 3, -.4, .4); c.stroke();
    c.strokeStyle = '#c587e4bb'; c.beginPath();
    c.moveTo(8, 0); c.lineTo(17, 0); c.arc(20, 0, 3, Math.PI, Math.PI * 3); c.stroke();
    c.fillStyle = '#e8c9ff'; c.beginPath(); c.arc(20, 0, .8, 0, TAU); c.fill();
    if (detailed) {
      for (let n = -2; n <= 2; n++) {
        c.save(); c.rotate(n * .1); c.beginPath(); c.moveTo(r - 1, 0);
        c.lineTo(r - (n === 0 ? 2.5 : 1.7), 0); c.stroke(); c.restore();
      }
    }
    c.restore();
  }
  c.rotate(-t * .018);
  c.strokeStyle = '#dbaae599'; c.beginPath();
  c.arc(0, 0, 11, .3, 2.9); c.moveTo(-11, 0); c.arc(0, 0, 11, Math.PI, 5.9); c.stroke();
  distillationMark(c, 0, -1, 1.4, '#f0d8bcb3');
  c.restore();
}

/** Vapor behind the silhouette. Hollow ribbons preserve the face and arena. */
export function drawValeriaVapor(c, t, bob, pressure, front = false, headroom = Infinity) {
  if (!(pressure > 0)) return;
  c.save(); c.globalAlpha *= pressure; c.lineCap = 'round';
  if (!front) {
    for (let i = 0; i < 4; i++) {
      const p = ((t * .012 + i * .25) % 1);
      const x = -9 - p * 8 + Math.sin(t * .04 + i * 2) * 3;
      const y = Math.max(-13 + bob - p * 19, -headroom + 3);
      c.save(); c.globalAlpha *= Math.sin(p * Math.PI) * .5;
      c.strokeStyle = i % 2 ? '#dfb3ef' : '#8752b5'; c.lineWidth = 1 + p * 3;
      c.beginPath(); c.moveTo(x + 3, y + 6);
      c.bezierCurveTo(x - 6, y + 4, x + 5, y - 5, x - 2, y - 2); c.stroke();
      c.restore();
    }
  }
  // Condensate follows a fixed helical trajectory; split by depth around the hero.
  for (let i = 0; i < 8; i++) {
    const p = (t * .006 + i / 8) % 1;
    const a = t * .026 + i * 2.39996;
    if ((Math.sin(a) > 0) !== front) continue;
    const x = Math.cos(a) * (19 + p * 5), y = 15 - p * 32 + Math.sin(a) * 4;
    c.save(); c.globalAlpha *= Math.sin(p * Math.PI) * .7;
    c.strokeStyle = '#d7a7e8'; c.lineWidth = .6;
    c.beginPath(); c.arc(x, y, .7 + p * .8, 0, TAU); c.stroke();
    c.fillStyle = '#f9e7db'; c.fillRect(x - .3, y - .7, .6, .6); c.restore();
  }
  c.restore();
}

/** Existing cloth path supplies the clipping mask, so etching follows the coat. */
export function drawValeriaReactiveCloth(c, t, pressure, detailed, bob, sway) {
  if (!(pressure > 0)) return;
  c.save(); c.clip(); c.globalAlpha *= pressure;
  const fold = c.createLinearGradient(-14, 0, 4, 8);
  fold.addColorStop(0, '#614b8066'); fold.addColorStop(.45, '#94cbb633');
  fold.addColorStop(.65, '#101b2544'); fold.addColorStop(1, '#c78be466');
  c.fillStyle = fold; c.fillRect(-20, bob, 25, 20);
  c.strokeStyle = '#bea67f'; c.lineWidth = detailed ? .3 : .5;
  c.beginPath();
  for (let i = 0; i < 3; i++) {
    const x = -5 + i * 2;
    c.moveTo(x, 3 + bob); c.lineTo(x - 3 - sway * .3, 9 + bob);
    c.lineTo(x - 2 - sway * .4, 11 + bob); c.lineTo(x - 5 - sway * .5, 16 + bob);
  }
  c.stroke();
  if (detailed) {
    c.strokeStyle = '#99b9a644'; c.lineWidth = .22; c.beginPath();
    for (let i = 0; i < 16; i++) {
      c.moveTo(-18, 2 + bob + i); c.lineTo(2, 4 + bob + i);
    }
    c.stroke();
  }
  c.fillStyle = '#eed1fb';
  for (let i = 0; i < 3; i++) {
    const p = (t * .015 + i / 3) % 1;
    c.fillRect(-5 + i * 2 - p * 5 - sway * .3, 3 + bob + p * 13, .6, 1);
  }
  c.restore();
}

/** Copper pressure cage and illuminated sight glass, in backpack coordinates. */
export function drawValeriaPressureRig(c, t, pressure, detailed) {
  if (!(pressure > 0)) return;
  c.save(); c.globalAlpha *= pressure;
  const metal = c.createLinearGradient(-4, 0, 3, 1);
  metal.addColorStop(0, '#75483f'); metal.addColorStop(.35, '#c79269');
  metal.addColorStop(.5, '#ffe0b2'); metal.addColorStop(.7, '#967257'); metal.addColorStop(1, '#533b45');
  c.fillStyle = metal;
  for (let i = 0; i < 3; i++) { c.fillRect(-3.8, -5.8 + i * 6.3, 6.8, 1.1); }
  c.strokeStyle = '#ecb0ea'; c.lineWidth = .6;
  c.beginPath(); c.moveTo(-2.8, -4.3); c.lineTo(-2.8, 6.3); c.stroke();
  // A closed return hose channels the reagent into the shoulder valve.
  c.beginPath(); c.moveTo(1.5, -8.5);
  c.bezierCurveTo(7, -10, 8, -4, 5.5, -2); c.lineTo(5.5, 4);
  c.strokeStyle = '#201725'; c.lineWidth = 2.4; c.stroke();
  c.strokeStyle = metal; c.lineWidth = 1.2; c.stroke();
  c.strokeStyle = '#eed0f6'; c.lineWidth = .35; c.stroke();
  if (detailed) {
    c.strokeStyle = '#664351'; c.lineWidth = .35; c.beginPath();
    for (let i = 0; i < 5; i++) { c.moveTo(4.5, -.8 + i); c.lineTo(6.5, -.8 + i); }
    c.stroke();
  }
  // Spring-loaded relief valve, with a visible hot slit rather than a solid aura.
  const lift = .4 + (Math.sin(t * .19) * .5 + .5) * 1.2;
  c.fillStyle = '#e9b5ef'; c.fillRect(-2, -10 - lift, 2.8, lift);
  c.fillStyle = metal; c.fillRect(-2.8, -11 - lift, 4.5, 1);
  c.restore();
}

/** A proteção é erguida durante a reação; a lente mantém o olho jade visível. */
export function drawValeriaRespirator(c, bob, pressure, detailed) {
  if (!(pressure > 0)) return;
  c.save(); c.translate(0, bob); c.globalAlpha *= pressure;
  const brass = c.createLinearGradient(-4, -9, 5, -5);
  brass.addColorStop(0, '#835443'); brass.addColorStop(.45, '#efd0a2');
  brass.addColorStop(.65, '#b78a68'); brass.addColorStop(1, '#68453d');
  c.strokeStyle = '#624b40'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(-4.5, -9.4); c.lineTo(1, -7); c.stroke();
  c.fillStyle = '#253630'; c.strokeStyle = brass; c.lineWidth = .65;
  c.beginPath(); c.moveTo(-1, -8.1); c.lineTo(5.5, -8.1);
  c.lineTo(5.5, -5.4); c.lineTo(1.4, -4.5); c.lineTo(-1.5, -6); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = brass; c.beginPath(); c.ellipse(-.6, -6.7, 2.1, 1.8, -.25, 0, TAU); c.fill();
  c.fillStyle = '#30282f'; c.beginPath(); c.ellipse(-.6, -6.7, 1.4, 1.2, -.25, 0, TAU); c.fill();
  c.strokeStyle = '#ceabb1'; c.lineWidth = .4; c.beginPath();
  for (let i = 0; i < 3; i++) { c.moveTo(-1.4 + i * .7, -7.2); c.lineTo(-1.6 + i * .7, -6.1); }
  c.stroke();
  c.strokeStyle = brass; c.lineWidth = .65; c.beginPath();
  c.ellipse(3.5, -9.8, 2.7, 2.1, -.1, 0, TAU); c.stroke();
  c.strokeStyle = '#d2f3e699'; c.lineWidth = .35; c.beginPath();
  c.ellipse(3.5, -9.8, 2.2, 1.6, -.1, Math.PI, Math.PI * 1.6); c.stroke();
  c.fillStyle = '#a2c8bb'; c.fillRect(3.6, -6.5, 1.1, .6);
  if (detailed) {
    c.fillStyle = '#f9e3c2'; c.fillRect(5.3, -9.2, .35, .4); c.fillRect(2.1, -5.4, .4, .35);
    c.strokeStyle = '#a2826e'; c.lineWidth = .25; c.beginPath();
    c.moveTo(1.8, -7.3); c.lineTo(3.9, -7.5); c.moveTo(1.8, -6.6); c.lineTo(3, -6.7); c.stroke();
  }
  c.restore();
}

function flaskPath(c) {
  c.beginPath(); c.moveTo(-1.8, -6); c.lineTo(1.8, -6); c.lineTo(1.8, -3.5);
  c.lineTo(5.5, 3.8); c.quadraticCurveTo(6, 5.4, 4, 5.6);
  c.lineTo(-4, 5.6); c.quadraticCurveTo(-6, 5.4, -5.5, 3.8);
  c.lineTo(-1.8, -3.5); c.closePath();
}

/** Faceted reaction vessel: moving meniscus, suspended bubbles and brass cradle. */
export function drawValeriaVolatileFlask(c, t, pressure, evolved, detailed) {
  c.save(); c.lineJoin = 'round';
  const halo = c.createRadialGradient(0, 1, 1, 0, 1, 10);
  halo.addColorStop(0, '#d293ee55'); halo.addColorStop(1, '#853db500');
  c.globalAlpha *= pressure; c.fillStyle = halo;
  c.beginPath(); c.arc(0, 1, 10, 0, TAU); c.fill();
  c.restore(); c.save();
  const glass = c.createLinearGradient(-6, -2, 6, 3);
  glass.addColorStop(0, '#33424e'); glass.addColorStop(.18, '#a9bec9');
  glass.addColorStop(.32, '#3c364f'); glass.addColorStop(.78, '#29273f'); glass.addColorStop(1, '#b8dad4');
  flaskPath(c); c.fillStyle = glass; c.fill();
  c.strokeStyle = '#d4b4ca'; c.lineWidth = .65; c.stroke();
  c.save(); c.clip();
  const liquid = c.createLinearGradient(0, -1, 0, 6);
  liquid.addColorStop(0, evolved ? '#e0b8fb' : '#de9bea');
  liquid.addColorStop(.25, evolved ? '#9e80ee' : '#ab4fc7'); liquid.addColorStop(1, '#532566');
  const slosh = Math.sin(t * .14) * .6;
  c.fillStyle = liquid; c.beginPath(); c.moveTo(-6, -.8 + slosh);
  c.quadraticCurveTo(0, -1.5 - slosh, 6, -.8 - slosh); c.lineTo(6, 7); c.lineTo(-6, 7); c.fill();
  c.strokeStyle = '#f5d6ff'; c.lineWidth = .55; c.beginPath();
  c.moveTo(-4, -.8 + slosh); c.quadraticCurveTo(0, -1.5 - slosh, 4, -.8 - slosh); c.stroke();
  c.strokeStyle = '#efd3f1'; c.lineWidth = .4;
  for (let i = 0; i < (detailed ? 6 : 3); i++) {
    const p = (t * .018 + i * .173) % 1;
    const x = Math.sin(i * 2.4) * 3;
    c.beginPath(); c.arc(x, 4.8 - p * 5.2, .25 + p * .35, 0, TAU); c.stroke();
  }
  c.fillStyle = '#f0e5ff33'; c.beginPath(); c.moveTo(-1.2, -5.5);
  c.lineTo(-3, 5.7); c.lineTo(-1.5, 5.7); c.lineTo(0, -5.5); c.fill();
  c.restore();
  c.strokeStyle = '#f3eee2'; c.lineWidth = .65; c.beginPath();
  c.moveTo(-2.9, -1.5); c.lineTo(-4.7, 3.5); c.moveTo(4.7, 3.8); c.lineTo(4.2, 4.6); c.stroke();
  // Copper shoulders, machined collar and stopper crown.
  const brass = c.createLinearGradient(-5, 0, 5, 1);
  brass.addColorStop(0, '#7c5145'); brass.addColorStop(.4, '#f0cea1'); brass.addColorStop(1, '#aa7557');
  c.fillStyle = brass; c.fillRect(-2.4, -6.1, 4.8, 1.2); c.fillRect(-1.7, -8, 3.4, 1.9);
  c.strokeStyle = brass; c.lineWidth = .9; c.beginPath();
  c.moveTo(-2, -4); c.lineTo(-4.7, 3.9); c.lineTo(-3.8, 5.6);
  c.lineTo(3.8, 5.6); c.lineTo(4.7, 3.9); c.lineTo(2, -4); c.stroke();
  distillationMark(c, .6, 1.6, .43, '#f9dfba');
  if (detailed) {
    c.strokeStyle = '#e4c5e9aa'; c.lineWidth = .25; c.beginPath();
    for (let i = 0; i < 4; i++) { c.moveTo(2.4 + i * .3, i); c.lineTo(3.1 + i * .3, i); }
    c.stroke();
  }
  c.restore();
}
