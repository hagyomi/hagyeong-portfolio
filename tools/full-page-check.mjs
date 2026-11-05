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
  const report = { pages: [], sections: [], interactions: [], videos: [], links: [], exceptions, failed };
  const checks = [];
  const assert = (ok, message) => { if (!ok) checks.push(message); };
  const origin = 'http://127.0.0.1:4173';
  const pageFiles = ['index.html', ...(await (await import('node:fs/promises')).readdir(path.join(root,'pages'))).filter(f => f.endsWith('.html')).map(f => 'pages/' + f)];
  const screenshot = async name => { const shot = await send('Page.captureScreenshot',{format:'png'}); await writeFile(path.join(out,'full-'+name+'.png'),Buffer.from(shot.data,'base64')); };
  const navigate = async (file,width) => {
    await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<1024});
    await send('Page.navigate',{url:origin+'/'+file});
    for(let i=0;i<60;i++){await sleep(100);if(await evaluate('document.readyState === "complete"'))break;}
    await evaluate('document.fonts.ready.then(()=>true)'); await sleep(500);
  };
  const interactionsOnly=process.argv.includes('--interactions-only');
  for(const width of interactionsOnly?[]:[390,768,1024,1440]) {
    for(const file of pageFiles) {
      console.log('Checking '+width+' '+file);
      await navigate(file,width);
      // Load every lazy image and exercise each section's scroll observers.
      const sections = await evaluate(`Array.from(document.querySelectorAll('main > section,main > footer')).map((e,i)=>({i,id:e.id,cls:e.className}))`);
      for(const section of sections){
        await evaluate(`document.querySelectorAll('main > section,main > footer')[${section.i}].scrollIntoView({behavior:'instant',block:'start'})`);
        await sleep(file==='index.html'?160:80);
        if(file==='index.html') {
          const state=await evaluate(`({width:innerWidth,section:${JSON.stringify(section.id||section.cls)},overflow:document.documentElement.scrollWidth>innerWidth})`);
          report.sections.push(state); assert(!state.overflow,file+' '+width+' section overflow '+state.section);
          if([390,1440].includes(width)&&['workDetail3','workTouslesjours','shortForm','practice','skill','about','contact'].includes(section.id)) await screenshot(width+'-'+section.id);
        }
      }
      await evaluate(`Promise.all(Array.from(document.images).map(i=>{i.loading='eager';return Promise.race([i.decode().catch(()=>null),new Promise(resolve=>setTimeout(resolve,10000))])}))`);
      const state=await evaluate(`(()=>{const ids=Array.from(document.querySelectorAll('[id]')).map(e=>e.id);return {title:document.title,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,images:document.images.length,brokenImages:Array.from(document.images).filter(i=>!i.naturalWidth).map(i=>i.getAttribute('src')),duplicates:ids.filter((id,i)=>ids.indexOf(id)!==i),anchors:Array.from(document.querySelectorAll('a[href^="#"]')).map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(decodeURIComponent(h.slice(1))))};})()`);
      report.pages.push({file,...state}); assert(state.scrollWidth<=width,file+' '+width+' overflow');assert(!state.brokenImages.length,file+' broken images');assert(!state.duplicates.length&&!state.anchors.length,file+' invalid IDs/anchors');
      await evaluate('scrollTo({top:0,behavior:"instant"})');await sleep(250);
      if([390,1440].includes(width))await screenshot(width+'-'+file.replaceAll('/','-'));
      if(file==='index.html') {
        if(width<1024){
          await evaluate('document.getElementById("hamburgerBtn").click()');await sleep(100);
          const menu=await evaluate('({open:document.getElementById("hamburgerBtn").getAttribute("aria-expanded"),inert:document.getElementById("mobileNav").inert})');
          assert(menu.open==='true'&&!menu.inert,'Mobile menu did not open');
          await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});
          const closed=await evaluate('document.getElementById("hamburgerBtn").getAttribute("aria-expanded")==="false"&&document.getElementById("mobileNav").inert');assert(closed,'Escape did not close menu');report.interactions.push({width,menu,closed});
        }
        const accordion=await evaluate(`(()=>{const list=Array.from(document.querySelectorAll('.quick-qa__question'));return list.map(q=>{q.click();const open=q.getAttribute('aria-expanded')==='true';q.click();return {open,closed:q.getAttribute('aria-expanded')==='false',controls:!!document.getElementById(q.getAttribute('aria-controls'))}})})()`);
        assert(accordion.every(q=>q.open&&q.closed&&q.controls),'Q&A failed');report.interactions.push({width,accordion});
        // Check actual playback advancement rather than only the play() promise.
        for(const selector of ['#workDetail3 video','#workTouslesjours video','[data-ai-video]']) {
          const count=await evaluate(`document.querySelectorAll('${selector}').length`);
          for(let i=0;i<count;i++){
            await evaluate(`(()=>{const v=document.querySelectorAll('${selector}')[${i}];v.closest('section').scrollIntoView({behavior:'instant'});v.muted=true;return Promise.race([v.play().then(()=>true).catch(()=>false),new Promise(resolve=>setTimeout(()=>resolve(false),4000))])})()`);
            const time=await evaluate(`document.querySelectorAll('${selector}')[${i}].currentTime`);await sleep(350);
            const video=await evaluate(`(()=>{const v=document.querySelectorAll('${selector}')[${i}];return {src:v.currentSrc,ready:v.readyState,error:v.error?.message||null,advanced:v.currentTime>${time},width:v.videoWidth,height:v.videoHeight}})()`);
            report.videos.push({width,...video});assert(!video.error&&video.ready>=2&&video.advanced,'Video failed '+video.src+' at '+width);
          }
        }
        for(const target of ['work','skill','about','contact','intro']){
          await evaluate(`document.querySelector('.nav__link[data-nav="${target}"]').click()`);await sleep(850);
          const nav=await evaluate(`({active:document.querySelector('.nav__link.is-active')?.dataset.nav,scrollY})`);report.interactions.push({width,target,...nav});assert(nav.active===target,'Navigation failed '+target+' '+width);
        }
      }
    }
  }
  // Resolve links, posters, srcset and CSS assets through the browser, including cross-page hashes.
  await navigate('index.html',1440);
  const links=await evaluate(`(async()=>{const results=[];for(const file of ${JSON.stringify(pageFiles)}){const url=new URL(file,location.origin+'/');const text=await fetch(url).then(r=>r.text());const doc=new DOMParser().parseFromString(text,'text/html');for(const a of doc.querySelectorAll('a[href]')){const target=new URL(a.getAttribute('href'),url);if(target.origin!==location.origin||!/^https?:$/.test(target.protocol))continue;const response=await fetch(target,{method:'GET'});let anchor=true;if(target.hash&&response.headers.get('content-type')?.includes('text/html')){const linked=new DOMParser().parseFromString(await response.text(),'text/html');anchor=!!linked.getElementById(decodeURIComponent(target.hash.slice(1)));}results.push({from:file,url:target.pathname+target.hash,status:response.status,anchor});}}return results;})()`);
  report.links=links;assert(links.every(l=>l.status===200&&l.anchor),'Broken local links');
  report.previews=[];
  for(const width of [390,1440]) {
    await navigate('index.html',width);
    for(const key of ['pawly','coffee','saekomdalkom']) {
      await evaluate(`document.querySelector('a[href="#film-${key}"]').click()`);await sleep(900);
      const jump=await evaluate(`(()=>{const s=document.getElementById('film-${key}'),v=s.querySelector('video');return {focused:document.activeElement===s.querySelector('h3'),playing:!v.paused}})()`);
      report.previews.push({width,key,...jump});assert(jump.focused&&jump.playing,'Preview jump failed '+key+' '+width);
    }
  }
  await navigate('index.html',1440);
  await evaluate(`document.querySelector('.nav__link[data-nav="skill"]').click()`);await sleep(1300);
  const cardTransforms=()=>evaluate(`Array.from(document.querySelectorAll('.skill-content__carousel-card')).map(e=>e.style.transform)`);
  const beforeWheel=await cardTransforms();
  await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:720,y:450,deltaY:450,deltaX:0});await sleep(600);
  const afterWheel=await cardTransforms();
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown'});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowDown',code:'ArrowDown'});await sleep(600);
  const afterKey=await cardTransforms();
  report.skill={cards:afterKey.length,wheelChanged:JSON.stringify(beforeWheel)!==JSON.stringify(afterWheel),keyChanged:JSON.stringify(afterWheel)!==JSON.stringify(afterKey)};
  assert(report.skill.cards===13&&report.skill.wheelChanged&&report.skill.keyChanged,'Skill carousel input failed');
  await evaluate(`document.querySelector('.site-footer__top').click()`);await sleep(1400);
  report.backToTop=await evaluate('scrollY<3');assert(report.backToTop,'Back to top failed');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await navigate('index.html',390);
  report.reducedMotion=await evaluate(`getComputedStyle(document.querySelector('.hero-word>span')).animationName`);assert(report.reducedMotion==='none','Reduced motion hero still animates');
  assert(!exceptions.length,'Browser exceptions');assert(!failed.length,'HTTP errors');
  report.errors=checks;await writeFile(path.join(out,interactionsOnly?'interaction-report.json':'full-page-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({pages:report.pages.length,sectionChecks:report.sections.length,videos:report.videos.length,links:links.length,previews:report.previews,skill:report.skill,backToTop:report.backToTop,errors:checks,exceptions,failed},null,2));
  if(checks.length)process.exitCode=1;
} finally {ws?.close();browser.kill();}
