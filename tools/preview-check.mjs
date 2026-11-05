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
  const navigate = async (width, height, mobile = false) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
    await sleep(1800);
    await evaluate('document.fonts.ready.then(()=>true)');
    await sleep(1200);
  };
  const screenshot = async name => {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(path.join(out, `${name}.png`), Buffer.from(result.data, 'base64'));
  };
  const report = {};
  await navigate(1440, 1000);
  report.desktop = await evaluate(`({title:document.title, viewport:innerWidth, width:document.documentElement.scrollWidth, heroSize:getComputedStyle(document.querySelector('.hero__title')).fontSize, headerBg:getComputedStyle(document.querySelector('.header__inner')).backgroundColor, fontsLoaded:document.fonts.check('16px "Neue Montreal"') && document.fonts.check('16px "Cardinal Fruit"'), brokenImages:[...document.images].filter(i=>i.getAttribute('src')&&i.complete&&!i.naturalWidth).map(i=>i.getAttribute('src'))})`);
  await screenshot('desktop-hero');
  report.tokenApplied = await evaluate(`(()=>{const h=document.querySelector('.hero__title');document.documentElement.style.setProperty('--pf-hero-size','80px');const works=getComputedStyle(h).fontSize==='80px';document.documentElement.style.removeProperty('--pf-hero-size');return works;})()`);
  await evaluate(`document.querySelector('.nav__link[data-nav="work"]').click()`);
  await sleep(1800);
  await screenshot('desktop-work');
  report.work = await evaluate(`({scrollY,active:document.querySelector('.nav__link.is-active')?.textContent,heading:document.querySelector('#work h2')?.textContent})`);
  report.qa = await evaluate(`(()=>{const q=document.querySelector('.quick-qa__question');q.click();return {expanded:q.getAttribute('aria-expanded'),hidden:q.closest('article').querySelector('.quick-qa__answer').hidden};})()`);
  report.chatbot = await evaluate(`(()=>{document.querySelector('.portfolio-chatbot__toggle').click();return {open:!document.querySelector('#portfolioChatbotPanel').hidden,focused:document.activeElement.id};})()`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
  report.chatbotClosed = await evaluate(`document.querySelector('#portfolioChatbotPanel').hidden`);

  await navigate(390, 844, true);
  report.mobile = await evaluate(`({viewport:innerWidth,width:document.documentElement.scrollWidth,heroSize:getComputedStyle(document.querySelector('.hero__title')).fontSize,nav:getComputedStyle(document.querySelector('.nav')).display,menu:getComputedStyle(document.querySelector('.hamburger')).display,menuInert:document.querySelector('#mobileNav').inert})`);
  await screenshot('mobile-hero');
  await evaluate(`document.querySelector('#hamburgerBtn').click()`);
  await sleep(350);
  await screenshot('mobile-menu');
  report.mobileMenu = await evaluate(`({expanded:document.querySelector('#hamburgerBtn').getAttribute('aria-expanded'),inert:document.querySelector('#mobileNav').inert})`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await sleep(50);
  report.mobileMenuClosed = await evaluate(`({expanded:document.querySelector('#hamburgerBtn').getAttribute('aria-expanded'),focused:document.activeElement.id})`);
  await evaluate(`document.querySelector('#work').scrollIntoView()`);
  await sleep(1200);
  await screenshot('mobile-work');
  report.mobileWork = await evaluate(`({width:document.documentElement.scrollWidth,trackTransform:getComputedStyle(document.querySelector('.work-detail__track')).transform,bodySize:getComputedStyle(document.querySelector('.reference-cover-meta>p')).fontSize})`);
  await navigate(768, 1024, true);
  report.tablet = await evaluate(`({viewport:innerWidth,width:document.documentElement.scrollWidth,nav:getComputedStyle(document.querySelector('.nav')).display})`);
  await screenshot('tablet-hero');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await navigate(390, 844, true);
  report.reducedMotion = await evaluate(`({animation:getComputedStyle(document.querySelector('.hero-word>span')).animationName,transform:getComputedStyle(document.querySelector('.hero__title-line')).transform})`);
  report.subpages = [];
  for (const page of ['event-laka', 'event-kamill', 'event-kombucha']) {
    await send('Page.navigate', { url: `http://127.0.0.1:4173/pages/${page}.html` });
    await sleep(1000);
    for (let attempt = 0; attempt < 40; attempt++) {
      const ready = await evaluate(`document.readyState === 'complete' && getComputedStyle(document.documentElement).getPropertyValue('--pf-target-min').trim() !== ''`);
      if (ready) break;
      await sleep(200);
    }
    const state = await evaluate(`({title:document.title,viewport:innerWidth,width:document.documentElement.scrollWidth,heading:document.querySelector('h1')?.textContent,token:getComputedStyle(document.documentElement).getPropertyValue('--pf-target-min').trim()})`);
    report.subpages.push({ page, ...state });
  }
  report.exceptions = [...new Set(exceptions)];
  report.failedRequests = [...new Map(failed.map(x => [x.url, x])).values()];
  await writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  await send('Browser.close');
  ws.close();
  if (report.exceptions.length || report.failedRequests.length || !report.tokenApplied || report.desktop.brokenImages.length || report.mobile.width > report.mobile.viewport || report.subpages.some(page => !page.token || page.width > page.viewport)) process.exitCode = 1;
} finally {
  ws?.close();
  browser.kill();
}
