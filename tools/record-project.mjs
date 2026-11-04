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
 const key=process.argv[2];
 const sites={newera:{url:'https://hagyomi.github.io/newear/',speed:360},touslesjours:{url:'https://hagyomi.github.io/Touslesjours/',speed:320}};
 const site=sites[key];if(!site)throw Error('Use newera or touslesjours');
 const width=1600,height=1004,fps=25;
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:site.url});await sleep(6000);
 const distance=await evaluate(`(async()=>{document.documentElement.style.scrollBehavior='auto';const style=document.createElement('style');style.textContent='html,body{scrollbar-width:none!important}::-webkit-scrollbar{display:none!important}';document.head.append(style);document.querySelectorAll('img').forEach(i=>i.loading='eager');await Promise.race([Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,15000))]);await document.fonts.ready;scrollTo(0,0);return document.documentElement.scrollHeight-innerHeight;})()`);
 await sleep(1200);
 const scrollFrames=Math.ceil(distance/site.speed*fps),hold=2*fps,total=scrollFrames+hold*2;
 const output=path.join(out,key+'-hq.webm');
 const encoder=spawn(path.join(out,'ffmpeg.exe'),['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-vcodec','png','-i','pipe:0','-an','-c:v','libvpx-vp9','-crf','20','-b:v','0','-deadline','good','-cpu-used','4','-row-mt','1','-threads','4','-pix_fmt','yuv420p',output],{windowsHide:true,stdio:['pipe','ignore','pipe']});
 let encoderError='';encoder.stderr.on('data',d=>encoderError+=d);
 const finished=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('exit',code=>code===0?resolve():reject(Error('FFmpeg '+code+': '+encoderError)));});
 const started=Date.now();
 for(let n=0;n<total;n++){
   const progress=Math.min(1,Math.max(0,(n-hold)/scrollFrames));
   await evaluate(`scrollTo(0,${Math.round(distance*progress)})`);
   await sleep(20);
   const frame=await send('Page.captureScreenshot',{format:'png',fromSurface:true,optimizeForSpeed:true});
   if(!encoder.stdin.write(Buffer.from(frame.data,'base64')))await new Promise(r=>encoder.stdin.once('drain',r));
   if(n%125===0)console.log(JSON.stringify({key,frame:n,total,percent:Math.round(n/total*100),elapsed:Math.round((Date.now()-started)/1000)}));
 }
 encoder.stdin.end();await finished;
 const {copyFile,stat}=await import('node:fs/promises');
 const destination=path.join(root,'images',key,'site-recording.webm');await copyFile(output,destination);
 const report={key,width,height,fps,frames:total,duration:total/fps,scrollPixelsPerSecond:site.speed,bytes:(await stat(destination)).size,exceptions,failed:failed.filter(x=>!x.url.endsWith('favicon.ico'))};
 await writeFile(path.join(out,key+'-recording-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(ws)ws.close();browser.kill();}