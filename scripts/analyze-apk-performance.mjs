/** Local Android/WebView profiler. Node >=22; no npm dependencies. */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const seconds = Number(option('--seconds', '30'));
if (!Number.isFinite(seconds) || seconds < 3 || seconds > 60) throw Error('--seconds: 3 a 60');
const pkg = 'com.hordslayer.game';
const adbPath = process.env.ANDROID_HOME ? path.join(process.env.ANDROID_HOME, 'platform-tools', 'adb.exe') : path.join(process.env.LOCALAPPDATA, 'Android/Sdk/platform-tools/adb.exe');
let serial = option('--serial', '');
async function adb(...argv) { return (await run(adbPath, [...(serial ? ['-s', serial] : []), ...argv], { timeout: 20000, maxBuffer: 32 * 1024 * 1024 })).stdout.trim(); }
if (!serial) {
  const devices = (await adb('devices')).split('\n').filter(x => /\tdevice\s*$/.test(x)).map(x => x.split('\t')[0]);
  if (devices.length !== 1) throw Error('Conecte um aparelho/emulador ou use --serial.');
  serial = devices[0];
}
const out = path.join(root, 'dist/android-investigation/deep', new Date().toISOString().replace(/[:.]/g, '-'));
await mkdir(out, { recursive: true });
const save = (name, value) => writeFile(path.join(out, name), typeof value === 'string' ? value : JSON.stringify(value, null, 2));
const errors = [];
async function snapshot(label) {
  await Promise.all([
    ['gfx', 'gfxinfo', pkg, 'framestats'], ['memory', 'meminfo', pkg],
    ['thermal', 'thermalservice'], ['cpu', 'cpuinfo'], ['surface', 'SurfaceFlinger'],
  ].map(async ([name, ...a]) => { try { await save(`${label}-${name}.txt`, await adb('shell', 'dumpsys', ...a)); } catch (e) { errors.push(`${label}-${name}: ${e.message}`); } }));
}
class CDP {
  constructor(ws) {
    this.ws = ws; this.seq = 0; this.pending = new Map(); this.listeners = new Map();
    ws.addEventListener('message', e => {
      const m = JSON.parse(e.data);
      if (m.id) { const p = this.pending.get(m.id); if (p) { clearTimeout(p.timer); this.pending.delete(m.id); m.error ? p.reject(Error(JSON.stringify(m.error))) : p.resolve(m.result); } }
      else for (const f of this.listeners.get(m.method) || []) f(m.params);
    });
    ws.addEventListener('close', () => { for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(Error('WebView desconectada')); } this.pending.clear(); });
  }
  on(name, f) { this.listeners.set(name, [...(this.listeners.get(name) || []), f]); }
  send(method, params = {}) { return new Promise((resolve, reject) => { const id = ++this.seq; const timer = setTimeout(() => { this.pending.delete(id); reject(Error(`Timeout: ${method}`)); }, 20000); this.pending.set(id, { resolve, reject, timer }); this.ws.send(JSON.stringify({ id, method, params })); }); }
  async evaluate(expression) { const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; }
}
const summarize = xs => { const a = xs.filter(Number.isFinite).sort((x,y)=>x-y); return { count: a.length, avg: a.length ? a.reduce((x,y)=>x+y,0)/a.length : null, p95: a.length ? a[Math.ceil(a.length*.95)-1] : null }; };
let port, cdp, tracing = false, profiling = false, started = false;
try {
  let pid = await adb('shell', 'pidof', '-s', pkg).catch(() => '');
  if (!pid) { await adb('shell', 'am', 'start', '-n', `${pkg}/.MainActivity`); await new Promise(r => setTimeout(r, 3000)); pid = await adb('shell', 'pidof', '-s', pkg); }
  const sockets = await adb('shell', 'cat', '/proc/net/unix');
  const socket = `webview_devtools_remote_${pid}`;
  if (!sockets.includes('@' + socket)) throw Error('WebView sem depuracao remota. Use o APK debug e deixe o jogo aberto.');
  port = await adb('forward', 'tcp:0', `localabstract:${socket}`);
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = pages.find(p => p.type === 'page' && /^https?:\/\/localhost(?:\/|$)/.test(p.url));
  if (!page) throw Error('Pagina local do jogo nao encontrada.');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  cdp = new CDP(ws);
  await snapshot('before');
  const native = await cdp.evaluate(`window.Capacitor.nativePromise('PerformanceLab','getInfo',{})`);
  await save('environment.json', { serial, native, seconds, capturedAt: new Date().toISOString() });
  const events = [];
  cdp.on('Tracing.dataCollected', p => { for (const e of p.value) events.push(e); });
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 1000 });
  await cdp.send('Profiler.start'); profiling = true;
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,v8,blink,cc,gpu,disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' }); tracing = true;
  await cdp.evaluate(`(async () => {
    if (!window.perfMetrics || window.perfMetrics.isBenchmarking() || window.__apkDeep) throw Error('Outra medicao ativa; termine-a primeiro.');
    const { gameState } = await import('/src/state/gameState.js');
    window.__apkDeep = { wasEnabled: perfMetrics.isEnabled(), frames: [], longTasks: [], contexts: [], running: true, previous: null };
    const s = window.__apkDeep;
    perfMetrics.setEnabled(true); perfMetrics.reset();
    perfMetrics.startBenchmark(${seconds}, 'Captura profunda: estado automatico');
    try { s.observer = new PerformanceObserver(list => { for (const e of list.getEntries()) s.longTasks.push({start:e.startTime,duration:e.duration}); }); s.observer.observe({type:'longtask',buffered:false}); } catch {}
    function frame(t) { if (!s.running) return; if (s.previous !== null) s.frames.push(t-s.previous); s.previous=t; s.raf=requestAnimationFrame(frame); } s.raf=requestAnimationFrame(frame);
    s.timer=setInterval(() => { s.contexts.push({time:performance.now(),visibility:document.visibilityState,inMatch:gameState.isInMatch,paused:gameState.isPaused,dead:gameState.isDead,stats:perfMetrics.getStats(60)}); },1000);
    return true;
  })()`); started = true;
  console.log(`Coletando ${seconds}s. Use o jogo normalmente; nao abra o painel Teste APK. Pasta: ${out}`);
  await new Promise(r => setTimeout(r, seconds * 1000));
  const measurement = await cdp.evaluate(`(() => { const s=window.__apkDeep; s.running=false; cancelAnimationFrame(s.raf); clearInterval(s.timer); s.observer?.disconnect(); const report=perfMetrics.isBenchmarking()?perfMetrics.finishBenchmark('capture-ended'):perfMetrics.getBenchmarkHistory().at(-1); const result={frames:s.frames,longTasks:s.longTasks,contexts:s.contexts,report}; perfMetrics.setEnabled(s.wasEnabled); delete window.__apkDeep; return result; })()`); started = false;
  const { profile } = await cdp.send('Profiler.stop'); profiling = false;
  await Promise.all([save('cpu.cpuprofile', profile), save('measurement.json', measurement)]);
  const traceDone = new Promise(resolve => { const t = setTimeout(()=>resolve(false),20000); cdp.on('Tracing.tracingComplete', () => { clearTimeout(t); resolve(true); }); });
  await cdp.send('Tracing.end').catch(e => errors.push(e.message)); tracing = false;
  if (!await traceDone) errors.push('Trace Chromium parcial: termino nao confirmado. Nao interpretar ausencia de eventos como ausencia de custo.');
  await Promise.all([save('trace.json', {traceEvents: events}), save('cpu.cpuprofile', profile), save('measurement.json', measurement)]);
  await snapshot('after');
  const nodes = new Map(profile.nodes.map(n => [n.id,n]));
  const weights = new Map();
  for (let i=0;i<(profile.samples || []).length;i++) weights.set(profile.samples[i], (weights.get(profile.samples[i]) || 0) + (profile.timeDeltas?.[i] || 0)/1000);
  const functions = [...weights].map(([id,ms]) => ({ms,...nodes.get(id)?.callFrame})).sort((a,b)=>b.ms-a.ms);
  const grouped = new Map();
  for (const e of events) if (e.ph === 'X' && e.dur > 0) { const key=`${e.pid}/${e.tid} ${e.name}`; const g=grouped.get(key)||{name:e.name,pid:e.pid,tid:e.tid,count:0,totalMs:0,maxMs:0}; g.count++; g.totalMs+=e.dur/1000; g.maxMs=Math.max(g.maxMs,e.dur/1000); grouped.set(key,g); }
  const traceGroups=[...grouped.values()].sort((a,b)=>b.totalMs-a.totalMs);
  const cadence=summarize(measurement.frames), cpu=measurement.report?.stats?.cpuTime;
  const findings=[];
  if (measurement.report?.environmentStart?.game?.inMatch) findings.push('Cenario inicial detectado: partida (independente do rotulo manual).');
  else findings.push('Cenario inicial: fora de partida ou contexto indisponivel; consultar measurement.json.');
  if (native.viewHardwareAccelerated) findings.push('WebView confirma aceleracao por hardware ativa. Isso nao prova ausencia de gargalo grafico.');
  if (cpu && cadence.avg > 25 && cpu.avg < cadence.avg*.5) findings.push('Cadencia lenta com tempo medio do loop JS menor que metade do intervalo. O loop instrumentado nao explica sozinho a espera; examinar pintura, composicao, outras tarefas e escalonamento. GPU ainda nao comprovada.');
  if (cpu && cpu.p95 > 1000/native.displayHz) findings.push('O loop JS excede o orcamento da tela em pelo menos parte dos quadros; ha picos de CPU a investigar.');
  if (measurement.contexts.some(c=>c.visibility!=='visible')) findings.push('Captura inclui app oculto: nao usar como comparacao continua de FPS.');
  const raster = traceGroups.find(g => /RasterDecoderImpl::DoEndRaster/.test(g.name));
  if (raster) findings.push(`Rasterizacao na thread do servico grafico: ${raster.totalMs.toFixed(1)} ms acumulados; maior evento ${raster.maxMs.toFixed(1)} ms. Inclui possiveis esperas, nao e tempo exclusivo de execucao na GPU. ${raster.maxMs > 1000/native.displayHz ? 'Ha eventos acima do orcamento de um quadro; este caminho merece investigacao prioritaria.' : ''}`);
  findings.push(`Tarefas longas da WebView (>50ms): ${measurement.longTasks.length}.`);
  findings.push('Nao ha atribuicao causal automatica definitiva: tempos do trace podem se sobrepor; rasterizacao nao equivale a tempo de GPU.');
  const summary={cadence,cpu,longTasks:summarize(measurement.longTasks.map(e=>e.duration)),findings,functions:functions.slice(0,30),traceGroups:traceGroups.slice(0,60),errors};
  await save('summary.json',summary);
  await save('RELATORIO.md', `# Diagnostico local do APK\n\n${findings.map(x=>'- '+x).join('\n')}\n\nCadencia: ${cadence.avg ? (1000/cadence.avg).toFixed(1) : '?'} callbacks/s. Intervalo p95: ${cadence.p95?.toFixed(1)} ms.\n\n## Funcoes por tempo exclusivo amostrado\n\n|Funcao|Arquivo|ms amostrados|\n|---|---|---:|\n${functions.slice(0,20).map(f=>`|${f.functionName||'(anonima)'}|${f.url||'(interno)'}:${(f.lineNumber??-1)+1}|${f.ms.toFixed(1)}|`).join('\n')}\n\n## Evidencias\n\n- cpu.cpuprofile: abrir no painel Performance/JavaScript Profiler do DevTools.\n- trace.json: trace Chromium, sem screenshots.\n- before/after: estado Android, memoria, CPU, temperatura e SurfaceFlinger. gfxinfo nao e FPS do Canvas.\n- measurement.json: cadencia, tarefas longas, subsistemas e contexto real.\n\nInstrumentacao tem custo; compare capturas com as mesmas opcoes. Resultados do emulador nao identificam automaticamente o gargalo de outro celular.\n\nFalhas parciais: ${errors.join('; ') || 'nenhuma'}.\n`);
  console.log(findings.join('\n')); console.log(`Relatorio: ${path.join(out,'RELATORIO.md')}`);
} finally {
  if (cdp) {
    if (started) await cdp.evaluate(`(() => {const s=window.__apkDeep;if(s){s.running=false;cancelAnimationFrame(s.raf);clearInterval(s.timer);s.observer?.disconnect();perfMetrics.finishBenchmark('capture-aborted');perfMetrics.setEnabled(s.wasEnabled);delete window.__apkDeep;}})()`).catch(()=>{});
    if (profiling) await cdp.send('Profiler.stop').catch(()=>{});
    if (tracing) await cdp.send('Tracing.end').catch(()=>{});
    cdp.ws.close();
  }
  if (port) await adb('forward','--remove',`tcp:${port}`).catch(()=>{});
}
