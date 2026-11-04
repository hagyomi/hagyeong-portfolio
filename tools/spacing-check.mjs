import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Dependency-free browser QA via the Chrome DevTools Protocol.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '.local-preview');
await mkdir(out, { recursive: true });
const profile = path.join(out, `browser-${Date.now()}`);
const executable = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = spawn(executable, ['--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws;
try {
  let port;
  for (let i = 0; i < 100; i++) {
    const file = await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8').catch(() => '');
    if (file) { port = Number(file.split('\n')[0]); break; }
    await sleep(200);
  }
  if (!port) throw Error('Browser debugging endpoint did not start');
  const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
  ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map(), exceptions = [], failed = [];
  ws.onmessage = event => {
    const data = JSON.parse(event.data);
    if (data.id) {
      const callback = pending.get(data.id);
      if (callback) { pending.delete(data.id); data.error ? callback.reject(Error(JSON.stringify(data.error))) : callback.resolve(data.result); }
    }
    if (data.method === 'Runtime.exceptionThrown') exceptions.push(data.params.exceptionDetails.text + ': ' + (data.params.exceptionDetails.exception?.description || ''));
    if (data.method === 'Network.responseReceived' && data.params.response.status >= 400) failed.push({ url: data.params.response.url, status: data.params.response.status });
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const key = ++id;
    pending.set(key, { resolve, reject });
    ws.send(JSON.stringify({ id: key, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || 'Evaluation failed');
    return result.result.value;
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
 const report=[];
 for(const width of [1440,390]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});await send('Page.navigate',{url:'http://127.0.0.1:4173/'});await sleep(2000);await evaluate('document.fonts.ready');
 report.push(await evaluate(`(()=>{const ref=document.querySelector('#workDetail3'),ai=document.querySelector('#shortForm');const top=(root,selectors)=>Math.min(...[...root.querySelectorAll(selectors)].map(e=>e.getBoundingClientRect().top))-root.getBoundingClientRect().top;return {width:innerWidth,webGap:top(ref,'.reference-cover-devices,.reference-cover-info'),aiGap:top(ai,'.shortform-cover-posters,.shortform-cover>.shortform-copy'),eventGap:top(document.querySelector('.event-pages'),'.event-card:first-child .event-card__preview'),scrollWidth:document.documentElement.scrollWidth};})()`));
 await evaluate('document.querySelector("#shortForm").scrollIntoView()');await sleep(500);const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(path.join(out,'ai-gap-'+width+'.png'),Buffer.from(shot.data,'base64'));
 }
 console.log(JSON.stringify({report,exceptions,failed},null,2));
 if(report.some(r=>Math.abs(r.webGap-r.aiGap)>2||Math.abs(r.webGap-r.eventGap)>2))throw Error('Spacing mismatch');
}finally{if(ws)ws.close();browser.kill();}