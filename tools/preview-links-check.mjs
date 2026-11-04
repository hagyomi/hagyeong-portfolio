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
 await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<500});await send('Page.navigate',{url:'http://127.0.0.1:4173/'});await sleep(1600);await evaluate('document.fonts.ready');
 for(const key of ['pawly','coffee','saekomdalkom']){
 await evaluate(`window.scrollTo({top:document.querySelector('#shortForm').offsetTop,behavior:'instant'})`);await sleep(400);
 if(width===1440){const rect=await evaluate(`(()=>{const r=document.querySelector('a[href="#film-${key}"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mouseMoved',...rect});await sleep(300);const hover=await evaluate(`(()=>{const a=document.querySelector('a[href="#film-${key}"]');return {dark:getComputedStyle(a,'::after').opacity,label:getComputedStyle(a.querySelector('.ai-video-preview__label')).opacity}})()`);if(Number(hover.dark)<.9||Number(hover.label)<.9)throw Error('Hover failed '+key);}
 await evaluate(`document.querySelector('a[href="#film-${key}"]').click()`);await sleep(700);
 const result=await evaluate(`(()=>{const s=document.getElementById('film-${key}'),r=s.getBoundingClientRect(),v=s.querySelector('video');return {width:innerWidth,key:'${key}',left:r.left,right:r.right,top:r.top,focused:document.activeElement===s.querySelector('h3'),playing:!v.paused,scrollWidth:document.documentElement.scrollWidth};})()`);report.push(result);
 if(!result.focused||!result.playing||(width>1023&&(result.left < -3||result.right>width+3))||(width<1024&&Math.abs(result.top)>3))throw Error('Jump failed '+key);
 }
 }
 console.log(JSON.stringify({report,exceptions,failed},null,2));
 await writeFile(path.join(out,'preview-links-report.json'),JSON.stringify({report,exceptions,failed},null,2));
}finally{if(ws)ws.close();browser.kill();}