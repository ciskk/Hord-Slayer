import { perfMetrics } from './perfMetrics.js';
import { graphicsDiagnostics } from './graphicsDiagnostics.js';
import { layoutMetrics, getGraphicsQuality, setGraphicsQuality } from './responsive.js';

/** Diagnostic UI: native lab builds or explicit ?diagnostics=1 in the browser. */
export async function initPerformanceLab(getGameContext) {
  const native = !!window.Capacitor?.isNativePlatform?.();
  const invoke = (method, options = {}) => window.Capacitor.nativePromise('PerformanceLab', method, options);
  let nativeInfo = null;
  if (native) {
    try { nativeInfo = await invoke('getInfo'); } catch (error) { console.warn('Performance lab unavailable', error); return; }
    if (!nativeInfo.diagnostics) return;
  } else if (new URLSearchParams(location.search).get('diagnostics') !== '1') return;

  let build = null;
  try {
    const response = await fetch('./build-info.json');
    if (response.ok) { const info = await response.json(); build = { schemaVersion: info.schemaVersion, contentHash: info.contentHash }; }
  } catch (_) { /* Source tree may not contain a build manifest. */ }
  const key = 'hord_performance_lab_reports_v2';
  let saved = [];
  try { const data = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(data)) saved = data.slice(-30); } catch (_) {}
  const context = () => ({
    build, native: nativeInfo, userAgent: navigator.userAgent,
    viewport: { width: innerWidth, height: innerHeight, nativeDpr: devicePixelRatio, renderDpr: layoutMetrics.dpr },
    quality: getGraphicsQuality(), graphicsExperiment: graphicsDiagnostics.mode, visibility: document.visibilityState,
    canvases: [...document.querySelectorAll('canvas')].map(c => ({ id: c.id, width: c.width, height: c.height })),
    game: getGameContext()
  });
  perfMetrics.setContextProvider(context);
  // Observe actual UI/game state. Entity counts stay in the samples, without
  // guessing that an arbitrary enemy threshold means a particular scenario.
  const detectScenario = () => {
    for (const [id, label] of [['upgrade-modal', 'Upgrade'], ['chest-modal', 'Baú']]) {
      const el = document.getElementById(id);
      if (el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden') return label;
    }
    const game = getGameContext();
    return !game.inMatch ? 'Menu / seleção de personagem' : game.paused ? 'Partida pausada' : 'Partida';
  };
  const launcher = document.createElement('button');
  launcher.id = 'performance-lab-launcher'; launcher.textContent = 'Teste APK';
  launcher.style.cssText = 'position:fixed;left:6px;top:40px;z-index:1000001;background:#142333;color:white;border:1px solid #70d4ff;border-radius:6px;padding:6px;font:12px sans-serif';
  const panel = document.createElement('section'); panel.id = 'performance-lab-panel'; panel.hidden = true;
  panel.style.cssText = 'position:fixed;inset:5% 4%;z-index:1000002;background:#101722;color:#fff;padding:16px;overflow:auto;font:14px/1.5 sans-serif;touch-action:pan-y;border:1px solid #70d4ff;border-radius:10px';
  panel.innerHTML = `<h2 style="margin:0">Comparação do APK</h2>
    <p>O teste registra callbacks e tempo de CPU. Não mede diretamente os quadros apresentados pela GPU.</p>
    <label>Ambiente <select id="lab-profile">
      <option value="legacy">A — camada forçada + Hz máximo (anterior)</option>
      <option value="layer-default">B — camada padrão + Hz máximo</option>
      <option value="standard">C — camada e frequência padrão</option>
      <option value="60">D — camada padrão, solicitar 60 Hz</option>
      <option value="120">E — camada padrão, solicitar 120 Hz</option>
    </select></label><br>
    <label>Qualidade <select id="lab-quality"><option value="performance">Econômico</option><option value="high">Alto</option><option value="native">Nativo</option></select></label><br>
    <label>Isolamento gráfico <select id="lab-graphics">
      <option value="corrected">1 — ULT respeita a qualidade (corrigido)</option>
      <option value="original">2 — ULT em resolução nativa (anterior)</option>
      <option value="ult-off">3 — Corrigido, sem animação da ULT</option>
      <option value="filters-off">4 — Corrigido, sem filtros CSS</option>
    </select></label>
    <p>Cenário automático: <strong id="lab-scenario"></strong><br>As mudanças durante o teste serão registradas.</p>
    <p id="lab-environment" style="white-space:pre-wrap;overflow-wrap:anywhere"></p>
    <p><button id="lab-start">Medir por 30 segundos</button> <button id="lab-close">Fechar</button></p>
    <p><button id="lab-export">Exportar resultados</button> <button id="lab-fullscreen">Tela cheia no navegador</button></p>
    <pre id="lab-results" style="white-space:pre-wrap;font:12px monospace"></pre>`;
  for (const element of panel.querySelectorAll('button,select')) element.style.cssText = 'font:inherit;max-width:100%;margin:4px 0;padding:8px;background:#21364a;color:white;border:1px solid #70d4ff;border-radius:5px';
  // Keep test interactions out of the game's touch/keyboard handlers.
  for (const element of [launcher, panel]) for (const event of ['touchstart', 'touchmove', 'touchend', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'keydown']) {
    element.addEventListener(event, e => e.stopPropagation());
  }
  document.body.append(launcher, panel);
  const experimentStyle = document.createElement('style');
  document.head.append(experimentStyle);
  panel.querySelector('#lab-graphics').onchange = e => {
    graphicsDiagnostics.mode = e.target.value;
    experimentStyle.textContent = e.target.value === 'filters-off'
      ? 'body *:not(#performance-lab-panel):not(#performance-lab-panel *),body *::before,body *::after{filter:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}'
      : e.target.value === 'ult-off' ? '#ult-fx-canvas{visibility:hidden!important}' : '';
    show();
  };
  const profile = panel.querySelector('#lab-profile');
  const quality = panel.querySelector('#lab-quality');
  const result = panel.querySelector('#lab-results');
  const environment = panel.querySelector('#lab-environment');
  let pending = false;
  let switchingProfile = false;
  const show = () => {
    panel.querySelector('#lab-scenario').textContent = detectScenario();
    profile.value = nativeInfo?.profile || 'standard'; profile.disabled = !native;
    quality.value = getGraphicsQuality();
    environment.textContent = native
      ? `${nativeInfo.model} · Android ${nativeInfo.android}\nWebView ${nativeInfo.webViewVersion}\nTela agora: ${nativeInfo.displayHz} Hz · camada: ${nativeInfo.viewLayerType}\n${nativeInfo.buildType} · perfil ${nativeInfo.profile}`
      : 'Chrome/navegador — use a mesma qualidade e cenário do APK.';
    environment.textContent += `\nBuffer: ${document.querySelector('#game-canvas')?.width} × ${document.querySelector('#game-canvas')?.height}\nBuild: ${build?.contentHash?.slice(0, 16) || 'sem manifesto'}`;
    const last = saved.at(-1);
    result.textContent = `${saved.length} relatórios salvos neste ambiente.\nIsolamento: ${graphicsDiagnostics.mode}\n` + (last?.stats
      ? `${last.scenario}: ${last.stats.fps} callbacks/s\np95 ${last.stats.frameTime.p95} ms · p99 ${last.stats.frameTime.p99} ms\nCPU ${last.stats.cpuTime.avg} ms · preview ${last.stats.preview.cpuTime.avg} ms\nEstado: ${last.reason}` : '');
  };
  const refresh = async () => { if (native) nativeInfo = await invoke('getInfo'); show(); };
  launcher.onclick = async () => { if (pending || perfMetrics.isBenchmarking()) return; panel.hidden = false; try { await refresh(); } catch (e) { result.textContent = e.message; } };
  panel.querySelector('#lab-close').onclick = () => { panel.hidden = true; };
  profile.onchange = async () => {
    switchingProfile = true;
    profile.disabled = true;
    try { await invoke('setProfile', { profile: profile.value }); await new Promise(resolve => setTimeout(resolve, 700)); await refresh(); }
    catch (e) { result.textContent = e.message; }
    finally { profile.disabled = !native; switchingProfile = false; }
  };
  quality.onchange = () => { setGraphicsQuality(quality.value); show(); };
  panel.querySelector('#lab-start').onclick = async () => {
    if (pending || switchingProfile || perfMetrics.isBenchmarking()) return;
    pending = true; panel.hidden = true; launcher.textContent = 'Preparando…';
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (document.hidden) return;
      await refresh();
      launcher.textContent = 'Medindo 30 s…';
      const scenarioSamples = [];
      const sampleStart = performance.now();
      const sampleScenario = () => scenarioSamples.push({ elapsedMs: Math.round(performance.now() - sampleStart), scenario: detectScenario(), game: getGameContext(), visibility: document.visibilityState });
      sampleScenario();
      const scenarioTimer = setInterval(sampleScenario, 250);
      perfMetrics.startBenchmark(30, scenarioSamples[0].scenario, async report => {
        clearInterval(scenarioTimer); sampleScenario();
        report.scenarioDetection = 'automatic-250ms';
        report.scenarioSamples = scenarioSamples;
        report.scenario = [...new Set(scenarioSamples.map(s => s.scenario))].join(' → ');
        pending = true;
        perfMetrics.setEnabled(false);
        try { if (native) report.nativeAfter = await invoke('getInfo'); } catch (e) { report.nativeReadError = e.message; }
        saved.push(report); saved = saved.slice(-30);
        let persistenceError = '';
        try { localStorage.setItem(key, JSON.stringify(saved)); } catch (e) { persistenceError = '\nNão foi possível salvar localmente; exporte agora.'; }
        pending = false; launcher.textContent = 'Teste APK';
        show(); result.textContent += persistenceError; panel.hidden = false;
      });
    } catch (e) { result.textContent = e.message; panel.hidden = false; }
    finally { pending = false; if (!perfMetrics.isBenchmarking()) launcher.textContent = 'Teste APK'; }
  };
  panel.querySelector('#lab-export').onclick = async () => {
    try {
      const json = JSON.stringify({ schemaVersion: 2, exportedAt: new Date().toISOString(), reports: saved }, null, 2);
      if (native) await invoke('shareReport', { json });
      else {
        const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        const a = document.createElement('a'); a.href = url; a.download = 'hord-performance.json'; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (e) { result.textContent = `Falha na exportação: ${e.message}`; }
  };
  const fullscreen = panel.querySelector('#lab-fullscreen');
  fullscreen.hidden = native || !document.documentElement.requestFullscreen;
  fullscreen.onclick = async () => {
    try { await document.documentElement.requestFullscreen(); await refresh(); }
    catch (e) { result.textContent = `Tela cheia indisponível: ${e.message}`; }
  };
  show();
}
