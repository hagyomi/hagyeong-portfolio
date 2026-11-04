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
 await send('Page.navigate',{url:'http://127.0.0.1:4173/'});await sleep(2000);
 for(let n=0;n<3;n++){
 await evaluate(`document.querySelectorAll('.event-card')[${n}].scrollIntoView({block:'center'})`);await sleep(600);
 const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(path.join(out,`event-${width}-${n}.png`),Buffer.from(shot.data,'base64'));
 }
 report.push(await evaluate(`({page:'main',width:innerWidth,scrollWidth:document.documentElement.scrollWidth,cards:document.querySelectorAll('.event-card').length,heading:document.querySelector('.event-pages__title').innerText,links:[...document.querySelectorAll('.event-card__actions a')].map(a=>a.getAttribute('href')),broken:[...document.querySelectorAll('#practice img')].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)})`));
 for(const key of ['laka','kamill','kombucha']){
 await send('Page.navigate',{url:'http://127.0.0.1:4173/pages/event-'+key+'.html'});await sleep(600);
 await evaluate(`Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{})}))`);
 const info=await evaluate(`({page:location.pathname,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,title:document.title,images:document.images.length,broken:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src),assetGeometry:[...document.images].map(i=>({src:i.getAttribute('src'),natural:[i.naturalWidth,i.naturalHeight],rendered:[i.clientWidth,i.clientHeight],ratioError:Math.abs(i.clientWidth/i.clientHeight-i.naturalWidth/i.naturalHeight)/(i.naturalWidth/i.naturalHeight)})),figma:document.querySelector('.event-detail-nav a:last-child').href})`);
 report.push(info);
 for(const [name,fraction] of [['top',0],['middle',.5],['bottom',1]]){
 await evaluate(`scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*${fraction})`);await sleep(150);
 const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(path.join(out,`event-${key}-${width}-${name}.png`),Buffer.from(shot.data,'base64'));
 }
 }
 }
 await writeFile(path.join(out,'event-report.json'),JSON.stringify({report,exceptions,failed},null,2));
 console.log(JSON.stringify({report:report.map(({assetGeometry,...r})=>({...r,maxRatioError:assetGeometry?Math.max(...assetGeometry.map(a=>a.ratioError)):null})),exceptions,failed},null,2));
 if(exceptions.length||failed.length||report.some(r=>r.scrollWidth>r.width||r.broken.length||(r.assetGeometry&&r.assetGeometry.some(a=>a.ratioError>.025))))throw Error('Event page validation failed');
}finally{if(ws)ws.close();browser.kill();}