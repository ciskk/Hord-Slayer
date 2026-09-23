/** Small, deterministic Canvas ornaments shared by the five hero skins.
 * Geometry stays in model space so it follows facing, death and walk transforms.
 * No extra animation loops, textures or world-space effects are allocated here.
 */
export function skinGradient(c, x, y, width, height, dark, mid, light) {
  const gradient = c.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, dark);
  gradient.addColorStop(0.42, mid);
  gradient.addColorStop(0.62, light);
  gradient.addColorStop(1, mid);
  return gradient;
}

export function skinPolygon(c, points, fill, edge, width = 0.5) {
  c.save();
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (edge) { c.strokeStyle = edge; c.lineWidth = width; c.stroke(); }
  c.restore();
}

export function skinLine(c, points, color, width = 0.45) {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.stroke();
  c.restore();
}

export function skinGem(c, x, y, radius, dark, light, metal) {
  skinPolygon(c, [[x, y-radius], [x+radius*.8,y], [x,y+radius], [x-radius*.8,y]], dark, metal, .5);
  skinPolygon(c, [[x,y-radius*.68], [x+radius*.55,y], [x,y+radius*.2]], light);
  skinPolygon(c, [[x,y-radius*.68], [x,y+radius*.2], [x-radius*.55,y]], '#ffffff88');
}

/** A sewn branch, used as laurel, phoenix barb or botanical embroidery. */
export function skinSprig(c, x, y, length, angle, color, detailed = false) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  skinLine(c, [[0,0], [.3,-length*.45], [0,-length]], color, detailed ? .32 : .5);
  const count = detailed ? 4 : 2;
  for (let i = 1; i <= count; i++) {
    const py = -length * i / (count+1);
    for (const side of [-1, 1]) {
      skinPolygon(c, [[.15,py+.7], [side*1.3,py-.6], [side*.7,py-1.1], [0,py]], color);
    }
  }
  c.restore();
}
