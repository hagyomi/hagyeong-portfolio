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
 const mode=process.argv[2] || 'before';
 const snapshots=[];
 for(const width of [390,768,1024,1440]) {
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<1024});
  await send('Page.navigate',{url:'http://127.0.0.1:4173/'});
  await sleep(1800);
  await evaluate('document.fonts.ready');
  snapshots.push(await evaluate(`(()=>{const props=['display','position','width','height','padding','margin','font-family','font-size','font-weight','line-height','letter-spacing','color','background-color','border','border-radius','gap','grid-template-columns','flex-direction','overflow'];return {width:innerWidth,styles:[...document.querySelectorAll('body *:not(script):not(source):not(.fill-char):not(canvas)')].map((el,i)=>{const s=getComputedStyle(el);return {key:el.tagName+'#'+el.id+'.'+el.className,values:props.map(p=>s.getPropertyValue(p))}}),duplicates:[...document.querySelectorAll('[id]')].map(e=>e.id).filter((id,i,a)=>a.indexOf(id)!==i),brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(h.slice(1))),chatbot:!!document.querySelector('.portfolio-chatbot'),overflow:document.documentElement.scrollWidth>innerWidth}})()`));
 }
 const filename=path.join(out,'css-structure-'+mode+'.json');
 await writeFile(filename,JSON.stringify(snapshots,null,2));
 if(mode==='after') {
  const before=JSON.parse(await readFile(path.join(out,'css-structure-before.json'),'utf8'));
  const differences=[];
  snapshots.forEach((snap,j)=>snap.styles.forEach((el,i)=>{const prev=before[j].styles[i];if(JSON.stringify(prev)!==JSON.stringify(el)) differences.push({width:snap.width,index:i,before:prev,after:el})}));
  await writeFile(path.join(out,'css-structure-differences.json'),JSON.stringify(differences,null,2));
  console.log(JSON.stringify({differences:differences.length,checks:snapshots.map(({styles,...rest})=>rest),exceptions,failed},null,2));
 } else console.log('Baseline saved: '+snapshots.length+' viewports');
} finally {ws?.close();browser.kill();}