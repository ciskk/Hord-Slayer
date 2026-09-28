// Modelo único do machado: coldre dorsal, órbita da partida e prévia.
export function drawKragdorAxe(c, cCol = {}, { isEvolved = false, isBerserk = false } = {}) {
  const axeSteel = isEvolved ? '#b84a16' : (cCol.axeSteel || '#7f8c8d');
  const axeSteelLight = isEvolved ? '#ff9f43' : (cCol.axeSteelLight || '#b2bec3');
  const axeEdge = isEvolved ? '#fff1b8' : (cCol.axeEdge || '#f1c40f');
  const axeWood = cCol.axeWood || '#3d271d';
  const ironCol = cCol.iron || '#47535e';
  const brassCol = cCol.brass || '#f39c12';
  const leatherDark = cCol.leatherDark || '#1a120e';
  c.save();
  // Cabo de carvalho nórdico com ataduras de couro cruzadas
  c.fillStyle = axeWood;
  c.fillRect(-2, -6, 4, 32);
  c.strokeStyle = leatherDark;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-2, 3); c.lineTo(2, 6);
  c.moveTo(-2, 11); c.lineTo(2, 14);
  c.moveTo(-2, 19); c.lineTo(2, 22);
  c.stroke();

  // Pomo inferior reforçado com ferro e correia
  c.fillStyle = ironCol;
  c.fillRect(-2.5, 25, 5, 3.5);
  c.fillStyle = brassCol;
  c.fillRect(-1.5, 26, 3, 1.5);

  // Cabeça do Machado Colosso Nórdico (Lâmina Barbada Assimétrica)
  c.fillStyle = axeSteel;
  c.beginPath();
  c.moveTo(-2, -6);
  c.lineTo(-13, -15);
  c.lineTo(-17, -8);
  c.quadraticCurveTo(-14, 2, -18, 10);
  c.lineTo(-12, 6);
  c.lineTo(-2, 0);
  c.closePath();
  c.fill();
  c.strokeStyle = ironCol;
  c.lineWidth = 1.2;
  c.stroke();

  // Chanfro de aço claro polido
  c.fillStyle = axeSteelLight;
  c.beginPath();
  c.moveTo(-5, -6);
  c.lineTo(-12, -13);
  c.lineTo(-11, 4);
  c.lineTo(-5, 0);
  c.closePath();
  c.fill();

  // Gume dourado incandescente afiado
  c.strokeStyle = axeEdge;
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(-13, -15);
  c.lineTo(-17, -8);
  c.quadraticCurveTo(-14, 2, -18, 10);
  c.stroke();

  // Brilho especular branco no corte da lâmina
  c.strokeStyle = '#ffffff';
  c.lineWidth = 1.0;
  c.beginPath();
  c.moveTo(-14, -11);
  c.lineTo(-15, -4);
  c.stroke();

  // A runa de fúria se sobrepõe sem apagar o metal incandescente da evolução.
  if (isEvolved || isBerserk) {
    c.strokeStyle = isBerserk ? '#ff7675' : '#f39c12';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-10, -7);
    c.lineTo(-7, -4);
    c.lineTo(-10, -1);
    c.stroke();
  }
  c.restore();
}
