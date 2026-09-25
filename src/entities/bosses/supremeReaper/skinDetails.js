// Additive ornaments for the original skin. Coordinates are in unscaled body space.
export function drawReaperRegalia(ctx, e, bob, frame, vulnerable, enraged, phase3, collapse = 0) {
  const time = frame * 0.035;
  const metal = vulnerable ? '#657577' : phase3 ? '#e4d4ef' : enraged ? '#d79586' : '#d7bd77';
  const light = vulnerable ? '#788889' : phase3 ? '#fff1ff' : enraged ? '#ff637c' : '#81ecec';
  ctx.save();
  ctx.translate(0, bob + collapse * 10);
  ctx.globalAlpha *= vulnerable ? 0.45 : 0.88;
  ctx.lineJoin = 'round';

  // Layered shoulder reliquaries: engraved plates, rivets and suspended chains.
  for (const side of [-1, 1]) {
    ctx.save(); ctx.scale(side, 1);
    const plate = ctx.createLinearGradient(15, -32, 34, -13);
    plate.addColorStop(0, '#394350'); plate.addColorStop(0.5, '#111d28'); plate.addColorStop(1, '#26343e');
    ctx.fillStyle = plate; ctx.strokeStyle = metal; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(14, -30); ctx.lineTo(24, -35); ctx.lineTo(36, -24);
    ctx.lineTo(30, -13); ctx.lineTo(18, -18); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(19, -28); ctx.lineTo(24, -31); ctx.lineTo(31, -24);
    ctx.lineTo(27, -19); ctx.lineTo(21, -21); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = metal;
    for (const [x, y] of [[18, -29], [31, -24], [28, -16]]) {
      ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(24, -28);
    ctx.lineTo(27, -24); ctx.lineTo(24, -20); ctx.lineTo(22, -24); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = metal; ctx.lineWidth = 0.75;
    const sway = Math.sin(time + side) * 2;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.ellipse(30 + sway * i / 6, -12 + i * 4, 1.5, 2.6, -0.15, 0, Math.PI * 2); ctx.stroke();
    }
    // Tiny hourglass hanging from the armor, distinct from the soul lanterns.
    ctx.translate(30 + sway, 15);
    ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(3, -4); ctx.lineTo(-3, 4);
    ctx.lineTo(3, 4); ctx.closePath(); ctx.stroke();
    ctx.restore();
  }

  // Embroidered panels follow the existing robe, leaving the ribcage visible.
  for (const side of [-1, 1]) {
    ctx.save(); ctx.scale(side, 1);
    ctx.strokeStyle = metal; ctx.lineWidth = 0.65;
    ctx.beginPath(); ctx.moveTo(13, -7); ctx.quadraticCurveTo(19, 17, 22, 39); ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const y = 2 + i * 7, x = 15 + i * 1.3 + Math.sin(time + i * 0.4) * 0.7;
      ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.lineTo(x + 2.7, y);
      ctx.lineTo(x, y + 2); ctx.lineTo(x - 2.7, y); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = light; ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
    }
    // Etching along the original hood; never covers its skull or eyes.
    ctx.beginPath(); ctx.moveTo(5, -57); ctx.lineTo(16, -48);
    ctx.lineTo(18, -28); ctx.stroke();
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(16.5, -44 + i * 4); ctx.lineTo(19, -43 + i * 4); ctx.stroke();
    }
    ctx.restore();
  }

  // Phase I: a gilded pectoral astrolabe framing, rather than replacing, the core.
  ctx.strokeStyle = metal; ctx.lineWidth = 0.85;
  ctx.beginPath(); ctx.ellipse(0, -6, 14, 18, 0, 0.15, Math.PI - 0.15); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const angle = 0.25 + i * (Math.PI - 0.5) / 4;
    const x = Math.cos(angle) * 14, y = -6 + Math.sin(angle) * 18;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x * 1.15, y + 3); ctx.stroke();
  }

  // Phase II: the engraved armor cracks open and the robe vents crimson embers.
  if (enraged) {
    ctx.strokeStyle = light; ctx.lineWidth = 1.1;
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(side * 20, -31); ctx.lineTo(side * 23, -26);
      ctx.lineTo(side * 20, -23); ctx.lineTo(side * 28, -17); ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const p = (time * 0.35 + i / 4) % 1;
        ctx.save(); ctx.globalAlpha *= (1 - p) * 0.65; ctx.fillStyle = light;
        const x = side * (24 + Math.sin(i + time) * 4), y = 43 - p * 26;
        ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + 1.4, y);
        ctx.lineTo(x, y + 2); ctx.lineTo(x - 1.4, y); ctx.closePath(); ctx.fill(); ctx.restore();
      }
    }
  }

  // Phase III: floating fragments of the breastplate and a second broken crown.
  if (phase3) {
    for (let i = 0; i < 6; i++) {
      const a = time * 0.35 + i * Math.PI / 3;
      const x = Math.cos(a) * 22, y = -7 + Math.sin(a) * 12;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = '#3c1834'; ctx.strokeStyle = '#ffb9d5'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(3, 0); ctx.lineTo(0, 5); ctx.lineTo(-2, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.strokeStyle = '#e4c7ef'; ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + 0.2 + i * (Math.PI - 0.4) / 6;
      const x = Math.cos(a) * 29, y = -52 + Math.sin(a) * 22;
      ctx.beginPath(); ctx.moveTo(x * 0.94, y + 3); ctx.lineTo(x, y - 5 - (i % 2) * 3);
      ctx.lineTo(x * 1.06, y + 2); ctx.stroke();
    }
  }
  ctx.restore();
}
