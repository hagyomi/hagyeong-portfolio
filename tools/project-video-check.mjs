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
 await send('Page.navigate',{url:'http://127.0.0.1:4173/'});await sleep(2500);
 for(const [index,fraction] of [[0,0],[1,.35],[2,.8]]){
 await evaluate(`(()=>{const section=document.querySelector('#workDetail3');if(innerWidth>1023)scrollTo(0,section.offsetTop+(section.offsetHeight-innerHeight)*${fraction});else section.querySelectorAll('.work-detail__panel')[${index}].scrollIntoView();})()`);
 await sleep(2500);
 const before=await evaluate(`[...document.querySelectorAll('#workDetail3 video')].map(v=>v.currentTime)`);
 await sleep(1200);
 report.push(await evaluate(`(()=>{const v=document.querySelectorAll('#workDetail3 video')[${index}];return {viewport:innerWidth,index:${index},time:v.currentTime,advanced:v.currentTime>${before[index]},paused:v.paused,ready:v.readyState,error:v.error?.message,width:v.videoWidth,height:v.videoHeight,duration:v.duration,fit:getComputedStyle(v).objectFit,transform:getComputedStyle(v).transform,box:{width:v.clientWidth,height:v.clientHeight},screen:(()=>{const e=v.closest('.work-scenes__device-screen');return e?{width:e.clientWidth,height:e.clientHeight,top:getComputedStyle(e).top}:null})(),frames:v.getVideoPlaybackQuality().totalVideoFrames,muted:v.muted,loop:v.loop};})()`));
 if(width===390 && index>0){const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(path.join(out,'video-'+index+'.png'),Buffer.from(shot.data,'base64'));}
 }
 }
 console.log(JSON.stringify({report,exceptions,failed},null,2));
 await writeFile(path.join(out,'video-report.json'),JSON.stringify({report,exceptions,failed},null,2));
}finally{if(ws)ws.close();browser.kill();}