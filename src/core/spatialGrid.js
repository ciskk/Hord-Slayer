export const SPATIAL_CELL_SIZE = 75;
export const spatialGrid = new Map();

// Pool estático de listas para reuso total de memória (Zero Garbage Collection)
const arrayPool = [];

// Buffer estático reutilizável para consultas de vizinhos sem criar novos arrays
export const neighborIndicesBuffer = [];

// Physics consumes whole cells synchronously. Keep this separate from the
// flattened query buffer used by weapons and effects (including nested queries).
const neighborCellsBuffer = [];

// Hash numérico inteiro único em 32-bit (elimina alocação de strings como chave de Map)
export function getGridKey(cx, cy) {
  return (cx + 16384) * 32768 + (cy + 16384);
}

export function clearSpatialGrid() {
  for (const list of spatialGrid.values()) {
    list.length = 0;
    arrayPool.push(list);
  }
  spatialGrid.clear();
}

export function rebuildSpatialGrid(enemies) {
  clearSpatialGrid();
  const count = enemies.length;
  for (let i = 0; i < count; i++) {
    const e = enemies[i];
    if (e && e.hp > 0) {
      insertIntoGrid(e, i);
    }
  }
}

export function insertIntoGrid(e, index) {
  const cx = Math.floor(e.x / SPATIAL_CELL_SIZE);
  const cy = Math.floor(e.y / SPATIAL_CELL_SIZE);
  const key = getGridKey(cx, cy);
  let list = spatialGrid.get(key);
  if (!list) {
    list = arrayPool.pop() || [];
    spatialGrid.set(key, list);
  }
  list.push(index);
  e.gridCx = cx;
  e.gridCy = cy;
}

export function getNeighborIndices(x, y, radius, targetArray = null) {
  const target = targetArray || neighborIndicesBuffer;
  target.length = 0;
  const minCx = Math.floor((x - radius) / SPATIAL_CELL_SIZE);
  const maxCx = Math.floor((x + radius) / SPATIAL_CELL_SIZE);
  const minCy = Math.floor((y - radius) / SPATIAL_CELL_SIZE);
  const maxCy = Math.floor((y + radius) / SPATIAL_CELL_SIZE);

  for (let cx = minCx; cx <= maxCx; cx++) {
    const colOffset = (cx + 16384) * 32768;
    for (let cy = minCy; cy <= maxCy; cy++) {
      const key = colOffset + (cy + 16384);
      const list = spatialGrid.get(key);
      if (list) {
        for (let i = 0; i < list.length; i++) {
          target.push(list[i]);
        }
      }
    }
  }
  return target;
}

/**
 * Same cell order as getNeighborIndices, without copying every enemy index.
 * The returned buffer and its cell lists are borrowed until the next query or
 * grid rebuild; callers must consume them synchronously without mutating them.
 */
export function getNeighborCells(x, y, radius) {
  neighborCellsBuffer.length = 0;
  const minCx = Math.floor((x - radius) / SPATIAL_CELL_SIZE);
  const maxCx = Math.floor((x + radius) / SPATIAL_CELL_SIZE);
  const minCy = Math.floor((y - radius) / SPATIAL_CELL_SIZE);
  const maxCy = Math.floor((y + radius) / SPATIAL_CELL_SIZE);

  for (let cx = minCx; cx <= maxCx; cx++) {
    const colOffset = (cx + 16384) * 32768;
    for (let cy = minCy; cy <= maxCy; cy++) {
      const list = spatialGrid.get(colOffset + (cy + 16384));
      if (list) neighborCellsBuffer.push(list);
    }
  }
  return neighborCellsBuffer;
}

/**
 * Itera diretamente pelos índices de vizinhos sem achatar ou copiar para arrays intermediários.
 * Mantém exatamente a mesma ordem de travessia das células e dos índices.
 * @param {number} x - Coordenada X central
 * @param {number} y - Coordenada Y central
 * @param {number} radius - Raio de busca
 * @param {Function} callback - Função invocada com o índice (index). Se retornar false, interrompe a busca.
 */
export function forEachNeighborIndex(x, y, radius, callback) {
  const minCx = Math.floor((x - radius) / SPATIAL_CELL_SIZE);
  const maxCx = Math.floor((x + radius) / SPATIAL_CELL_SIZE);
  const minCy = Math.floor((y - radius) / SPATIAL_CELL_SIZE);
  const maxCy = Math.floor((y + radius) / SPATIAL_CELL_SIZE);

  for (let cx = minCx; cx <= maxCx; cx++) {
    const colOffset = (cx + 16384) * 32768;
    for (let cy = minCy; cy <= maxCy; cy++) {
      const list = spatialGrid.get(colOffset + (cy + 16384));
      if (list) {
        const len = list.length;
        for (let i = 0; i < len; i++) {
          if (callback(list[i]) === false) return;
        }
      }
    }
  }
}

/**
 * Itera diretamente sobre as listas de células vizinhas sem cópias.
 * @param {number} x - Coordenada X central
 * @param {number} y - Coordenada Y central
 * @param {number} radius - Raio de busca
 * @param {Function} callback - Invocada com a lista da célula. Se retornar false, interrompe.
 */
export function forEachNeighborCell(x, y, radius, callback) {
  const minCx = Math.floor((x - radius) / SPATIAL_CELL_SIZE);
  const maxCx = Math.floor((x + radius) / SPATIAL_CELL_SIZE);
  const minCy = Math.floor((y - radius) / SPATIAL_CELL_SIZE);
  const maxCy = Math.floor((y + radius) / SPATIAL_CELL_SIZE);

  for (let cx = minCx; cx <= maxCx; cx++) {
    const colOffset = (cx + 16384) * 32768;
    for (let cy = minCy; cy <= maxCy; cy++) {
      const list = spatialGrid.get(colOffset + (cy + 16384));
      if (list && list.length > 0) {
        if (callback(list) === false) return;
      }
    }
  }
}
