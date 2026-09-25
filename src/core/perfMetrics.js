/**
 * src/core/perfMetrics.js
 * 
 * Subsistema de Telemetria, Profiling e Benchmarking de Alta Precisão (Fase 1).
 * Instrumenta o loop de jogo medindo tempo de quadro, percentis (p50, p95, p99),
 * divisão de custos por subsistema e contadores de trabalho (colisões, atlas,
 * terreno e persistência) com impacto de medição virtualmente nulo (zero garbage collection).
 */

const HISTORY_SIZE = 1200; // ~20 segundos a 60 FPS

// Buffers circulares pré-alocados para tempos gerais
const _frameTimes = new Float32Array(HISTORY_SIZE);
const _updateTimes = new Float32Array(HISTORY_SIZE);
const _renderTimes = new Float32Array(HISTORY_SIZE);

// Histórico de subsistemas
const SUBSYSTEM_KEYS = [
  'physics',
  'enemies',
  'weapons',
  'projectiles',
  'fieldEffects',
  'pickups',
  'hazards',
  'hud',
  'terrain',
  'mobsRender',
  'effectsRender'
];

const _subsystemHistory = {};
const _subsystemStartTimes = {};
const _subsystemFrameValues = {};

SUBSYSTEM_KEYS.forEach(k => {
  _subsystemHistory[k] = new Float32Array(HISTORY_SIZE);
  _subsystemStartTimes[k] = 0;
  _subsystemFrameValues[k] = 0;
});

// Contadores do quadro atual
let _curCollisionCandidates = 0;
let _curSpriteHits = 0;
let _curSpriteBakes = 0;
let _curTerrainChunksBuilt = 0;
let _curPersistenceReads = 0;
let _curPersistenceWrites = 0;

// Histórico circular de contadores
const _histCollisionCandidates = new Uint32Array(HISTORY_SIZE);
const _histSpriteHits = new Uint16Array(HISTORY_SIZE);
const _histSpriteBakes = new Uint16Array(HISTORY_SIZE);
const _histTerrainChunks = new Uint16Array(HISTORY_SIZE);
const _histPersistenceReads = new Uint16Array(HISTORY_SIZE);
const _histPersistenceWrites = new Uint16Array(HISTORY_SIZE);

let _historyIndex = 0;
let _totalRecordedFrames = 0;
let _frameStartTime = 0;

// Estado do Benchmark Controlado
let _isBenchmarking = false;
let _benchmarkStartFrame = 0;
let _benchmarkDurationFrames = 0;
let _benchmarkScenarioName = '';
let _benchmarkOnComplete = null;
const _benchmarkHistory = [];

// Estado do Overlay HUD
let _isOverlayVisible = false;
let _overlayElement = null;
let _overlayLastUpdate = 0;

// Buffer de ordenação estático para percentis (Zero GC)
const _sortBuffer = new Float32Array(HISTORY_SIZE);

function computePercentile(dataArray, count, percentile) {
  if (count <= 0) return 0;
  const clampedCount = Math.min(count, dataArray.length);
  for (let i = 0; i < clampedCount; i++) {
    _sortBuffer[i] = dataArray[i];
  }
  const view = _sortBuffer.subarray(0, clampedCount);
  view.sort();
  const idx = Math.min(clampedCount - 1, Math.max(0, Math.floor((clampedCount - 1) * percentile)));
  return view[idx];
}

function computeAvg(dataArray, count) {
  if (count <= 0) return 0;
  const clampedCount = Math.min(count, dataArray.length);
  let sum = 0;
  for (let i = 0; i < clampedCount; i++) {
    sum += dataArray[i];
  }
  return sum / clampedCount;
}

export const perfMetrics = {
  /**
   * Inicia a medição do quadro atual.
   * Chamado no início do loop(now).
   */
  beginFrame(now) {
    _frameStartTime = now || performance.now();
    _curCollisionCandidates = 0;
    _curSpriteHits = 0;
    _curSpriteBakes = 0;
    _curTerrainChunksBuilt = 0;
    _curPersistenceReads = 0;
    _curPersistenceWrites = 0;

    for (let i = 0; i < SUBSYSTEM_KEYS.length; i++) {
      _subsystemFrameValues[SUBSYSTEM_KEYS[i]] = 0;
    }
  },

  /**
   * Inicia a cronometragem de um subsistema específico.
   * @param {string} name 
   */
  beginMeasure(name) {
    _subsystemStartTimes[name] = performance.now();
  },

  /**
   * Finaliza a cronometragem de um subsistema e acumula no quadro.
   * @param {string} name 
   */
  endMeasure(name) {
    const elapsed = performance.now() - (_subsystemStartTimes[name] || 0);
    _subsystemFrameValues[name] = (_subsystemFrameValues[name] || 0) + elapsed;
  },

  /**
   * Finaliza a medição do quadro atual e armazena nos buffers circulares.
   * Chamado ao término da execução do loop.
   */
  endFrame(now) {
    const frameEnd = now || performance.now();
    const frameDuration = Math.max(0.01, frameEnd - _frameStartTime);
    const idx = _historyIndex % HISTORY_SIZE;

    _frameTimes[idx] = frameDuration;
    _updateTimes[idx] = _subsystemFrameValues['update'] || 0;
    _renderTimes[idx] = _subsystemFrameValues['render'] || 0;

    // Registra subsistemas
    for (let i = 0; i < SUBSYSTEM_KEYS.length; i++) {
      const key = SUBSYSTEM_KEYS[i];
      _subsystemHistory[key][idx] = _subsystemFrameValues[key] || 0;
    }

    // Registra contadores
    _histCollisionCandidates[idx] = _curCollisionCandidates;
    _histSpriteHits[idx] = _curSpriteHits;
    _histSpriteBakes[idx] = _curSpriteBakes;
    _histTerrainChunks[idx] = _curTerrainChunksBuilt;
    _histPersistenceReads[idx] = _curPersistenceReads;
    _histPersistenceWrites[idx] = _curPersistenceWrites;

    _historyIndex++;
    _totalRecordedFrames++;

    // Gerenciamento do Benchmark ativo
    if (_isBenchmarking) {
      const elapsedFrames = _totalRecordedFrames - _benchmarkStartFrame;
      if (elapsedFrames >= _benchmarkDurationFrames) {
        perfMetrics.finishBenchmark();
      }
    }

    // Atualização throttled do Overlay visual (a cada 8 quadros ~130ms)
    if (_isOverlayVisible && frameEnd - _overlayLastUpdate > 130) {
      _overlayLastUpdate = frameEnd;
      perfMetrics.updateOverlayDOM();
    }
  },

  // --- Contadores Granulares de Trabalho ---

  countCollisionCandidate(amount = 1) {
    _curCollisionCandidates += amount;
  },

  countSpriteHit() {
    _curSpriteHits++;
  },

  countSpriteBake() {
    _curSpriteBakes++;
  },

  countTerrainChunk() {
    _curTerrainChunksBuilt++;
  },

  countPersistenceRead() {
    _curPersistenceReads++;
  },

  countPersistenceWrite() {
    _curPersistenceWrites++;
  },

  // --- Consulta de Métricas Estatísticas ---

  /**
   * Calcula as estatísticas consolidadas para a janela recente de quadros.
   * @param {number} windowFrames Número de quadros da janela (padrão 600 ~10s)
   */
  getStats(windowFrames = 600) {
    const count = Math.min(windowFrames, Math.min(_totalRecordedFrames, HISTORY_SIZE));
    if (count <= 0) {
      return null;
    }

    // Coleta dos dados mais recentes da janela
    const fTimes = new Float32Array(count);
    const uTimes = new Float32Array(count);
    const rTimes = new Float32Array(count);
    const subAvgs = {};
    SUBSYSTEM_KEYS.forEach(k => { subAvgs[k] = 0; });

    let totalCollisions = 0;
    let totalSpriteHits = 0;
    let totalSpriteBakes = 0;
    let totalTerrainChunks = 0;
    let totalReads = 0;
    let totalWrites = 0;

    const startIdx = (_historyIndex - count + HISTORY_SIZE * 10) % HISTORY_SIZE;
    for (let i = 0; i < count; i++) {
      const p = (startIdx + i) % HISTORY_SIZE;
      fTimes[i] = _frameTimes[p];
      uTimes[i] = _updateTimes[p];
      rTimes[i] = _renderTimes[p];

      for (let s = 0; s < SUBSYSTEM_KEYS.length; s++) {
        const key = SUBSYSTEM_KEYS[s];
        subAvgs[key] += _subsystemHistory[key][p];
      }

      totalCollisions += _histCollisionCandidates[p];
      totalSpriteHits += _histSpriteHits[p];
      totalSpriteBakes += _histSpriteBakes[p];
      totalTerrainChunks += _histTerrainChunks[p];
      totalReads += _histPersistenceReads[p];
      totalWrites += _histPersistenceWrites[p];
    }

    SUBSYSTEM_KEYS.forEach(k => { subAvgs[k] = +(subAvgs[k] / count).toFixed(3); });

    const avgFrameTime = computeAvg(fTimes, count);
    const p50FrameTime = computePercentile(fTimes, count, 0.50);
    const p95FrameTime = computePercentile(fTimes, count, 0.95);
    const p99FrameTime = computePercentile(fTimes, count, 0.99);

    const avgUpdateTime = computeAvg(uTimes, count);
    const p95UpdateTime = computePercentile(uTimes, count, 0.95);
    const avgRenderTime = computeAvg(rTimes, count);
    const p95RenderTime = computePercentile(rTimes, count, 0.95);

    const fps = avgFrameTime > 0 ? Math.min(120, +(1000 / avgFrameTime).toFixed(1)) : 60;
    const fps1PctLow = p99FrameTime > 0 ? +(1000 / p99FrameTime).toFixed(1) : fps;
    const spriteTotal = totalSpriteHits + totalSpriteBakes;
    const spriteHitRate = spriteTotal > 0 ? +((totalSpriteHits / spriteTotal) * 100).toFixed(1) : 100;

    let heapUsedMB = 0;
    if (typeof performance !== 'undefined' && performance.memory && performance.memory.usedJSHeapSize) {
      heapUsedMB = +(performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
    }

    return {
      samples: count,
      fps,
      fps1PctLow,
      frameTime: {
        avg: +avgFrameTime.toFixed(2),
        p50: +p50FrameTime.toFixed(2),
        p95: +p95FrameTime.toFixed(2),
        p99: +p99FrameTime.toFixed(2)
      },
      updateTime: {
        avg: +avgUpdateTime.toFixed(2),
        p95: +p95UpdateTime.toFixed(2)
      },
      renderTime: {
        avg: +avgRenderTime.toFixed(2),
        p95: +p95RenderTime.toFixed(2)
      },
      subsystems: subAvgs,
      counters: {
        collisionsPerFrame: Math.round(totalCollisions / count),
        spriteHitRatePct: spriteHitRate,
        spriteBakesTotal: totalSpriteBakes,
        spriteBakesPerSec: +((totalSpriteBakes / (count / 60))).toFixed(1),
        terrainChunksTotal: totalTerrainChunks,
        persistenceReadsPerSec: +((totalReads / (count / 60))).toFixed(1),
        persistenceWritesPerSec: +((totalWrites / (count / 60))).toFixed(1)
      },
      memory: {
        heapUsedMB
      }
    };
  },

  // --- Modo Benchmark Controlado ---

  /**
   * Dispara uma gravação padronizada de benchmark por N segundos.
   * @param {number} durationSeconds Duração em segundos (padrão 10)
   * @param {string} scenarioName Nome do cenário ('HORDE', 'VALERIA', 'BOSS', etc.)
   * @param {Function} onComplete Callback opcional executado ao finalizar
   */
  startBenchmark(durationSeconds = 10, scenarioName = 'MANUAL', onComplete = null) {
    const durationFrames = Math.max(60, Math.round(durationSeconds * 60));
    _isBenchmarking = true;
    _benchmarkStartFrame = _totalRecordedFrames;
    _benchmarkDurationFrames = durationFrames;
    _benchmarkScenarioName = scenarioName;
    _benchmarkOnComplete = onComplete;

    console.log(`%c[BENCHMARK INICIADO] Cenário: ${scenarioName} | Duração: ${durationSeconds}s (${durationFrames} quadros)...`, 'color: #3498db; font-weight: bold;');
  },

  finishBenchmark() {
    _isBenchmarking = false;
    const stats = perfMetrics.getStats(_benchmarkDurationFrames);
    const report = {
      scenario: _benchmarkScenarioName,
      timestamp: new Date().toISOString(),
      durationFrames: _benchmarkDurationFrames,
      stats
    };

    _benchmarkHistory.push(report);

    console.log(`%c[BENCHMARK CONCLUÍDO] Cenário: ${_benchmarkScenarioName}`, 'color: #2ecc71; font-weight: bold; font-size: 14px;');
    perfMetrics.logSummary(stats, _benchmarkScenarioName);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hordio-benchmark-complete', { detail: report }));
    }

    if (typeof _benchmarkOnComplete === 'function') {
      _benchmarkOnComplete(report);
    }

    return report;
  },

  getBenchmarkHistory() {
    return _benchmarkHistory;
  },

  /**
   * Imprime no console uma tabela formatada de alta legibilidade.
   */
  logSummary(customStats = null, title = 'Status Atual') {
    const s = customStats || perfMetrics.getStats(600);
    if (!s) {
      console.warn('[perfMetrics] Dados insuficientes coletados.');
      return;
    }

    console.group(`📊 Hord.io Baseline de Desempenho: ${title}`);
    console.log(`Amostras: ${s.samples} quadros | FPS Médio: ${s.fps} (1% Low: ${s.fps1PctLow}) | Heap: ${s.memory.heapUsedMB || 'N/A'} MB`);
    
    console.table({
      'Frame Time (ms)': { 'Médio': s.frameTime.avg, 'p50': s.frameTime.p50, 'p95': s.frameTime.p95, 'p99': s.frameTime.p99 },
      'Update Time (ms)': { 'Médio': s.updateTime.avg, 'p95': s.updateTime.p95 },
      'Render Time (ms)': { 'Médio': s.renderTime.avg, 'p95': s.renderTime.p95 }
    });

    console.table({
      'Física': `${s.subsystems.physics} ms`,
      'IA Inimigos': `${s.subsystems.enemies} ms`,
      'Armas': `${s.subsystems.weapons} ms`,
      'Projéteis / Poças': `${s.subsystems.projectiles} ms`,
      'Efeitos de Campo': `${s.subsystems.fieldEffects} ms`,
      'Coletáveis': `${s.subsystems.pickups} ms`,
      'Perigos / Boss': `${s.subsystems.hazards} ms`,
      'HUD': `${s.subsystems.hud} ms`,
      'Render Terreno': `${s.subsystems.terrain} ms`,
      'Render Inimigos': `${s.subsystems.mobsRender} ms`,
      'Render Efeitos': `${s.subsystems.effectsRender} ms`
    });

    console.table({
      'Candidatos Colisão / frame': s.counters.collisionsPerFrame,
      'Sprite Cache Hit Rate': `${s.counters.spriteHitRatePct}%`,
      'Sprite Bakes (Total)': s.counters.spriteBakesTotal,
      'Sprite Bakes / seg': s.counters.spriteBakesPerSec,
      'Chunks Terreno (Total)': s.counters.terrainChunksTotal,
      'Persistência Leituras / seg': s.counters.persistenceReadsPerSec,
      'Persistência Escritas / seg': s.counters.persistenceWritesPerSec
    });
    console.groupEnd();
  },

  // --- Overlay de Diagnóstico HUD (Ativado via F3) ---

  toggleOverlay() {
    _isOverlayVisible = !_isOverlayVisible;
    if (_isOverlayVisible) {
      perfMetrics.ensureOverlayDOM();
      if (_overlayElement) _overlayElement.style.display = 'block';
    } else if (_overlayElement) {
      _overlayElement.style.display = 'none';
    }
    return _isOverlayVisible;
  },

  ensureOverlayDOM() {
    if (_overlayElement || typeof document === 'undefined') return;

    _overlayElement = document.createElement('div');
    _overlayElement.id = 'perf-metrics-overlay';
    _overlayElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(10, 14, 20, 0.88);
      border: 1px solid rgba(241, 196, 15, 0.4);
      border-radius: 6px;
      color: #ecf0f1;
      font-family: monospace;
      font-size: 11px;
      line-height: 1.35;
      padding: 8px 12px;
      z-index: 999999;
      pointer-events: auto;
      user-select: none;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
      min-width: 210px;
    `;

    _overlayElement.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(241, 196, 15, 0.3); padding-bottom: 4px; margin-bottom: 6px;">
        <span style="font-weight: bold; color: #f1c40f;">PERF METRICS (F3)</span>
        <button id="perf-btn-bench" style="background: #27ae60; border: none; border-radius: 3px; color: #fff; font-size: 9px; padding: 2px 6px; cursor: pointer;">Bench 10s</button>
      </div>
      <div id="perf-overlay-content">Aguardando dados...</div>
    `;

    document.body.appendChild(_overlayElement);

    const btn = _overlayElement.querySelector('#perf-btn-bench');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        perfMetrics.startBenchmark(10, 'OVERLAY_TRIGGERED');
      });
    }
  },

  updateOverlayDOM() {
    if (!_overlayElement) return;
    const content = _overlayElement.querySelector('#perf-overlay-content');
    if (!content) return;

    const s = perfMetrics.getStats(240);
    if (!s) return;

    const fpsColor = s.fps >= 55 ? '#2ecc71' : (s.fps >= 35 ? '#f39c12' : '#e74c3c');
    const p99Color = s.frameTime.p99 <= 16.67 ? '#2ecc71' : (s.frameTime.p99 <= 28 ? '#f39c12' : '#e74c3c');

    content.innerHTML = `
      <div><span style="color: ${fpsColor}; font-weight: bold; font-size: 13px;">${s.fps} FPS</span> <span style="color: #7f8c8d;">(1% low: ${s.fps1PctLow})</span></div>
      <div>Frame: <b>${s.frameTime.avg}ms</b> | p95: <b>${s.frameTime.p95}ms</b> | p99: <b style="color: ${p99Color};">${s.frameTime.p99}ms</b></div>
      <div style="color: #bdc3c7; font-size: 10px; margin-top: 3px;">
        Upd: ${s.updateTime.avg}ms | Rnd: ${s.renderTime.avg}ms
      </div>
      <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 4px; padding-top: 3px; font-size: 10px;">
        Colisões: <b>${s.counters.collisionsPerFrame}</b>/f<br>
        Atlas: <b>${s.counters.spriteHitRatePct}%</b> hit (${s.counters.spriteBakesPerSec} bakes/s)<br>
        Terreno: <b>${s.counters.terrainChunksTotal}</b> chunks<br>
        I/O Disco: <b>${s.counters.persistenceReadsPerSec}</b> R/s | <b>${s.counters.persistenceWritesPerSec}</b> W/s<br>
        Heap: <b>${s.memory.heapUsedMB || 'N/A'} MB</b>
      </div>
      ${_isBenchmarking ? '<div style="margin-top: 5px; color: #e74c3c; font-weight: bold; animation: blink 1s infinite;">● GRAVANDO BENCHMARK...</div>' : ''}
    `;
  }
};

// Exposição global no window para uso interativo pelo desenvolvedor
if (typeof window !== 'undefined') {
  window.perfMetrics = perfMetrics;
  window.addEventListener('keydown', (e) => {
    if (e.code === 'F3') {
      e.preventDefault();
      perfMetrics.toggleOverlay();
    }
  });
}
