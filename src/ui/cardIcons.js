/**
 * Card glyphs: one readable silhouette and, at most, one effect modifier.
 * Shared by level-ups and chests. No game-state imports or SVG IDs: safe to
 * repeat in the same document, including previews and reward inventories.
 */
const PALETTES = {
  steel: ['#e5edf7', '#7898bd'],
  ember: ['#ffd18a', '#e99052'],
  venom: ['#d8baff', '#a67de8'],
  astral: ['#b7efff', '#66b9dd'],
  frost: ['#d7f6ff', '#7ccfe8'],
  blood: ['#ffc2ba', '#eb786d'],
  gold: ['#ffe3a1', '#d5a85c'],
  life: ['#bdedca', '#6ebc92'],
  void: ['#e4d0ff', '#ae8adf']
};

const path = (d, fill = 'none', extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const circle = (x, y, r, fill = 'none', extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const group = (body, transform) => `<g transform="${transform}">${body}</g>`;
const plus = (x = 25, y = 8) => path(`M${x - 3} ${y}h6M${x} ${y - 3}v6`, 'none', 'stroke="var(--glyph-light)" stroke-width="2.5"');
const star = (x, y, r = 4) => path(`M${x} ${y - r}l${r * .3} ${r * .7} ${r * .7} ${r * .3}-${r * .7} ${r * .3}-${r * .3} ${r * .7}-${r * .3}-${r * .7}-${r * .7}-${r * .3} ${r * .7}-${r * .3}Z`, 'var(--glyph-light)');
const speed = path('M3 10h7M2 16h6M3 22h5', 'none', 'stroke="var(--glyph-tone)"');
const orbit = path('M7 6a12 12 0 1 0 20 16M23 3l3 5-6 1', 'none', 'stroke="var(--glyph-tone)"');
const expand = path('M3 10V3h7M22 3h7v7M3 22v7h7M29 22v7h-7', 'none', 'stroke="var(--glyph-tone)"');
const impact = path('M4 8l5 2M16 2v5M27 8l-5 2M5 25l5-3M27 25l-5-3', 'none', 'stroke="var(--glyph-tone)"');

// The shapes share their geometry across upgrades, pacts and evolutions.
const blade = path('M16 3l4 6v12h-8V9Z', 'var(--glyph-light)') +
  path('M16 8v11', 'none', 'stroke="var(--glyph-tone)" stroke-width="1.4"') +
  path('M9 22h14M16 23v6', 'none', 'stroke="var(--glyph-tone)" stroke-width="3"');
const axe = path('M16 4v24', 'none', 'stroke="var(--glyph-light)" stroke-width="3"') +
  path('M13 5C10 7 7 7 5 6v11c4 1 7-1 10-4h2c3 3 6 5 10 4V6c-2 1-5 1-8-1Z', 'var(--glyph-tone)') +
  path('M5 7v9M27 7v9', 'none', 'stroke="var(--glyph-light)"');
const hammer = path('M16 13v16', 'none', 'stroke="var(--glyph-tone)" stroke-width="3.5"') +
  path('M5 5h22v9H5Z', 'var(--glyph-tone)') +
  path('M5 5h4v9H5ZM23 5h4v9h-4Z', 'var(--glyph-light)') +
  path('M16 7l2 3-2 2-2-2Z', 'var(--glyph-light)', 'stroke="none"');
const flask = path('M12 3h8M13 4v7L6 23q-2 5 4 5h12q6 0 4-5l-7-12V4', 'none', 'stroke="var(--glyph-light)"') +
  path('M10 20h12l3 5q1 1-2 1H9q-3 0-2-1Z', 'var(--glyph-tone)', 'stroke="none"') +
  circle(15, 17, 1.4, 'var(--glyph-light)', 'stroke="none"');
const heart = path('M16 27S3 19 3 11a7 7 0 0 1 13-4 7 7 0 0 1 13 4c0 8-13 16-13 16Z', 'var(--glyph-tone)');
const boot = path('M12 5h10l-2 12 7 4q2 1 2 5H8v-7l3-3Z', 'var(--glyph-tone)') +
  path('M13 6h8M8 27h21M13 13h6', 'none', 'stroke="var(--glyph-light)"');
const hourglass = path('M9 4h14M9 28h14M10 5v5l5 6-5 6v5M22 5v5l-5 6 5 6v5', 'none', 'stroke="var(--glyph-light)"') +
  path('M12 8h8l-4 5ZM16 20l4 5h-8Z', 'var(--glyph-tone)', 'stroke="none"');
const book = path('M16 8Q10 4 4 7v18q6-3 12 1 6-4 12-1V7q-6-3-12 1Z', 'var(--glyph-tone)') +
  path('M16 9v15M8 11l4 1M20 12l4-1M8 16l4 1M20 17l4-1', 'none', 'stroke="var(--glyph-light)"');
const target = circle(16, 16, 9) + path('M16 3v6M16 23v6M3 16h6M23 16h6') +
  path('M16 12l3 4-3 4-3-4Z', 'var(--glyph-tone)', 'stroke="none"');
const damage = path('M16 3l3 8 8-4-4 9 6 4-10 1-3 8-3-8-10-1 6-4-4-9 8 4Z', 'var(--glyph-tone)') +
  path('M19 10l-6 7h5l-4 6', 'none', 'stroke="var(--glyph-light)" stroke-width="2.6"');
const coin = (x, y, r = 6) => circle(x, y, r, 'var(--glyph-tone)') +
  path(`M${x} ${y - 2.5}v5`, 'none', 'stroke="var(--glyph-light)"');
const aura = circle(16, 16, 11, 'none', 'stroke="var(--glyph-tone)"') +
  circle(16, 13, 3, 'var(--glyph-light)', 'stroke="none"') +
  path('M11 23v-3a5 5 0 0 1 10 0v3', 'var(--glyph-tone)') +
  path('M16 1v3M16 28v3M1 16h3M28 16h3');
const staff = path('M8 28l9-16', 'none', 'stroke="var(--glyph-tone)" stroke-width="3"') +
  path('M14 5q-4 7 3 8 7 0 7-7', 'none', 'stroke="var(--glyph-light)"') +
  circle(19, 6, 3, 'var(--glyph-tone)');

function glyph(palette, body, { pact = false, evolved = false } = {}) {
  const [light, tone] = PALETTES[palette];
  // A cut gemstone identifies pacts; a four-point glint identifies evolutions.
  const seal = pact
    ? path('M26 2l4 5-4 5-4-5Z', '#21152f', 'stroke="#d7b2ff" stroke-width="1.6"') + path('M26 5v3', 'none', 'stroke="#f0dbff" stroke-width="1.6"')
    : evolved ? star(26, 5, 4) : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="card-glyph${pact ? ' card-glyph--pact' : ''}${evolved ? ' card-glyph--evolved' : ''}" viewBox="0 0 32 32" fill="none" stroke="${light}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="--glyph-light:${light};--glyph-tone:${tone}">${body}${seal}</svg>`;
}

export const UPGRADE_ICONS = {
  // Weapons: repeated silhouettes = quantity; trails = speed; arrows = area.
  axe_speed: glyph('ember', orbit + group(axe, 'translate(4 4) scale(.75)')),
  axe_extra: glyph('ember', group(axe, 'translate(-1 5) scale(.72)') + group(axe, 'translate(10 9) scale(.65)') + plus()),
  axe_radius: glyph('ember', expand + group(axe, 'translate(5 5) scale(.69)')),
  potion_volley: glyph('venom', group(flask, 'translate(-1 6) scale(.7)') + group(flask, 'translate(10 10) scale(.66)') + plus()),
  potion_potency: glyph('venom', path('M4 25a12 5 0 1 0 24 0', 'none', 'stroke="var(--glyph-tone)"') + group(flask, 'translate(4 -1) scale(.75)') + path('M2 21v5h5M30 21v5h-5')),
  staff_projectiles: glyph('ember', group(staff, 'translate(-2 2) scale(.85)') + circle(26, 17, 3, 'var(--glyph-tone)') + circle(23, 26, 3, 'var(--glyph-tone)') + plus(26, 6)),
  staff_pierce: glyph('ember', path('M15 6v20M23 6v20', 'none', 'stroke="var(--glyph-tone)" stroke-width="3"') + path('M3 16h26m-5-4 5 4-5 4', 'none', 'stroke="var(--glyph-light)" stroke-width="2.5"') + circle(7, 16, 3, 'var(--glyph-light)')),
  sword_extra: glyph('astral', group(blade, 'translate(-3 6) scale(.72)') + group(blade, 'translate(8 8) scale(.72)') + plus()),
  sword_speed: glyph('astral', speed + group(blade, 'translate(5 2) rotate(35 16 16) scale(.78)')),
  hammer_crush: glyph('steel', path('M3 24q13 12 26 0M3 20l4 3M29 20l-4 3', 'none', 'stroke="var(--glyph-tone)"') + group(hammer, 'translate(4 -1) scale(.75)') + path('M16 21l-3 4 4 2-2 3')),
  hammer_impact: glyph('gold', impact + group(hammer, 'translate(5 2) rotate(35 12 14) scale(.75)')),

  // Attributes retain the same visual vocabulary in their pact variants.
  frost_passive: glyph('frost', path('M16 3v26M5 9l22 14M5 23 27 9M12 5l4 4 4-4M12 27l4-4 4 4M5 14l5-2-1-5M23 25l-1-5 5-2M5 18l5 2-1 5M23 7l-1 5 5 2') + circle(16, 16, 3, 'var(--glyph-tone)')),
  dmg: glyph('blood', damage),
  haste: glyph('gold', group(hourglass, 'translate(1 0) scale(.9)') + path('M24 12l5 4-5 4M3 12l5 4-5 4', 'none', 'stroke="var(--glyph-tone)"')),
  ult_cooldown: glyph('void', group(hourglass, 'translate(-2 0) scale(.95)') + star(25, 10, 5)),
  wings: glyph('astral', speed + group(boot, 'translate(3 1) scale(.88)')),
  crit: glyph('blood', target),
  magnet: glyph('astral', path('M7 6v12a9 9 0 0 0 18 0V6h-6v12a3 3 0 0 1-6 0V6Z', 'var(--glyph-tone)') + path('M7 10h6M19 10h6') + path('M16 2l2 3-2 3-2-3Z', 'var(--glyph-light)', 'stroke="none"')),
  aura: glyph('gold', aura),
  orbitals: glyph('void', path('M3 18C-1 9 16 0 27 5M29 14c4 9-13 18-24 13', 'none', 'stroke="var(--glyph-tone)"') + group(book, 'translate(4 5) scale(.75)') + circle(27, 6, 2.5, 'var(--glyph-light)')),
  armor: glyph('life', group(heart, 'translate(-1 3) scale(.85)') + path('M25 16V3m-4 4 4-4 4 4', 'none', 'stroke="var(--glyph-light)" stroke-width="2.5"')),
  heal: glyph('life', flask + path('M16 16v7M12.5 19.5h7', 'none', 'stroke="var(--glyph-light)" stroke-width="2.5"')),
  blessing: glyph('gold', coin(11, 22, 7) + group(heart, 'translate(14 0) scale(.5)') + star(8, 6, 4)),

  // Pacts show the benefit. Costs remain in the separate, explicit penalty row.
  destiny_berserker: glyph('blood', group(damage, 'translate(1 3) scale(.85)') + group(blade, 'translate(6 5) scale(.6)'), { pact: true }),
  destiny_titan: glyph('life', group(heart, 'translate(0 4) scale(.87)') + path('M10 17h8M14 13v8M6 26l4 3h10l4-3', 'none', 'stroke="var(--glyph-light)"'), { pact: true }),
  destiny_arcane_frenzy: glyph('void', group(hourglass, 'translate(-2 1) scale(.88)') + path('M22 15l6 4-6 4M3 12l4 4-4 4', 'none', 'stroke="var(--glyph-tone)" stroke-width="2.5"'), { pact: true }),
  destiny_midas: glyph('gold', coin(11, 20, 7) + coin(22, 24, 6) + path('M4 10Q11 1 20 7m-4-1 4 1-2-5', 'none', 'stroke="var(--glyph-light)"'), { pact: true }),
  destiny_executioner: glyph('blood', path('M2 18q13-17 28 0-15 17-28 0Z', 'var(--glyph-tone)') + circle(16, 18, 5, '#28121c') + path('M16 10v4M16 22v4M8 18h4M20 18h4') + circle(16, 18, 1, 'var(--glyph-light)', 'stroke="none"'), { pact: true }),
  destiny_spectral: glyph('astral', path('M2 13h7M3 19h5M2 25h4', 'none', 'stroke="var(--glyph-tone)"') + group(boot, 'translate(3 4) scale(.8)') + path('M11 7l4-4 3 4', 'none', 'stroke="var(--glyph-tone)"'), { pact: true }),
  destiny_temporal_rift: glyph('void', group(hourglass, 'translate(-3 1) scale(.9)') + star(25, 21, 5) + path('M3 5l3 7-3 6 3 9', 'none', 'stroke="var(--glyph-tone)"'), { pact: true }),

  // Evolutions preserve the original weapon and add a restrained exalted motif.
  evolved_sword: glyph('astral', path('M4 4l3 9-3 6 3 9M26 13l-3 6 3 9', 'none', 'stroke="var(--glyph-tone)"') + group(blade, 'translate(1 1) scale(.95)'), { evolved: true }),
  evolved_axe: glyph('blood', group(group(axe, 'translate(-1 5) rotate(-20 16 16) scale(.78)') + group(axe, 'translate(9 8) rotate(20 16 16) scale(.7)'), 'translate(2 2) scale(.86)'), { evolved: true }),
  evolved_potion: glyph('venom', path('M5 25q11 9 22 0', 'none', 'stroke="var(--glyph-tone)"') + group(flask, 'translate(3 0) scale(.8)') + circle(5, 15, 2, 'var(--glyph-tone)') + circle(27, 18, 2, 'var(--glyph-tone)'), { evolved: true }),
  evolved_hammer: glyph('gold', group(hammer, 'translate(2 1) scale(.88)') + path('M2 25l6-3 4 7 4-5 4 5 4-7 6 3', 'none', 'stroke="var(--glyph-tone)"'), { evolved: true }),
  evolved_staff: glyph('ember', path('M7 5C1 14 2 23 12 28M25 13q6 9-3 15', 'none', 'stroke="var(--glyph-tone)"') + group(staff, 'translate(2 1) scale(.9)'), { evolved: true }),
  evolved_orbitals: glyph('void', circle(16, 17, 12, 'none', 'stroke="var(--glyph-tone)"') + group(book, 'translate(5 6) scale(.68)') + circle(5, 11, 2.5, 'var(--glyph-light)') + circle(24, 26, 2.5, 'var(--glyph-light)'), { evolved: true }),
  evolved_aura: glyph('gold', group(aura, 'translate(3 4) scale(.8)') + path('M6 4l2 4M2 25l5-2M27 28l-3-4', 'none', 'stroke="var(--glyph-tone)"'), { evolved: true })
};

export const REWARD_ICONS = {
  blood_tribute: glyph('blood', group(heart, 'translate(-1 0) scale(.75)') + coin(23, 24, 6)),
  soul_transmutation: glyph('gold', coin(10, 22, 6) + coin(23, 22, 6) + star(16, 6, 4) + path('M16 12v3m0 0-5 2m5-2 5 2'))
};
