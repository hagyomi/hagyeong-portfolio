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
 await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});
 await send('Page.navigate',{url:'http://127.0.0.1:4173/'});await sleep(1600);
 for(const [index,fraction] of [[0,0],[1,.25],[2,.52],[3,.85]]){
 await evaluate(`(()=>{const s=document.querySelector('#shortForm');if(innerWidth>1023)scrollTo(0,s.offsetTop+(s.offsetHeight-innerHeight)*${fraction});else s.querySelectorAll('.work-detail__panel')[${index}].scrollIntoView();})()`);
 await sleep(2000);
 const result=await evaluate(`(()=>{const s=document.querySelector('#shortForm'),v=s.querySelectorAll('video')[${index-1}];return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,panel:${index},title:s.querySelectorAll('.work-detail__panel')[${index}].querySelector('h2,h3').textContent,video:v?{width:v.videoWidth,height:v.videoHeight,ready:v.readyState,duration:v.duration,time:v.currentTime,paused:v.paused,controls:v.controls,muted:v.muted,fit:getComputedStyle(v).objectFit,pointerEvents:getComputedStyle(v).pointerEvents,error:v.error?.message}:null,playing:[...s.querySelectorAll('video')].filter(v=>!v.paused).map(v=>v.currentSrc),broken:[...s.querySelectorAll('img')].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)};})()`);
 if(result.video){await sleep(600);result.video.advanced=await evaluate(`document.querySelectorAll('#shortForm video')[${index-1}].currentTime>${result.video.time}`);}
 report.push(result);
 const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(path.join(out,`ai-video-${width}-${index}.png`),Buffer.from(shot.data,'base64'));
 }
 }
 console.log(JSON.stringify({report,exceptions,failed},null,2));
 await writeFile(path.join(out,'ai-video-report.json'),JSON.stringify({report,exceptions,failed},null,2));
 if(exceptions.length||failed.length||report.some(r=>r.scrollWidth>r.viewport||r.broken.length||(r.video&&(!r.video.advanced||r.video.width!==1920||r.video.height!==1080||r.video.pointerEvents!=='auto'||!r.video.controls))))throw Error('AI VIDEO verification failed');
}finally{if(ws)ws.close();browser.kill();}