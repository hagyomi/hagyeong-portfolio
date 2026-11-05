import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Explicitly invoked snapshot downloader. Does not overwrite tokens or local overrides.
const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://persona1-pi.vercel.app/';
const queue = new Map();
const done = new Set();
const results = [];
function enqueue(value, base = origin) {
  if (!value || /[${}<>]/.test(value)) return;
  let url;
  try { url = new URL(value, base); } catch { return; }
  if (url.origin !== new URL(origin).origin) return;
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
  if (relative.split('/').includes('..') || !/\.(html|css|js|json|png|jpe?g|webp|gif|svg|ico|woff2?|otf|ttf|webm|mp4|pdf)$/i.test(relative)) return;
  if (!done.has(relative)) queue.set(relative, url.href);
}
function discover(source, url, relative) {
  if (relative.startsWith('vendor/')) return;
  const text = source.replace(/<!--[\s\S]*?-->/g, '');
  const pattern = /["'`(]([^"'`()\s<>]+\.(?:html|css|js|json|png|jpe?g|webp|gif|svg|ico|woff2?|otf|ttf|webm|mp4|pdf)(?:\?[^"'`()\s<>]*)?)["'`)]/gi;
  for (const match of text.matchAll(pattern)) {
    const value = match[1];
    enqueue(relative.endsWith('.js') && !value.includes('/') && /\.(png|webp|jpe?g|svg)$/.test(value) ? `images/${value}` : value, relative.endsWith('.json') ? origin : url);
  }
}
enqueue(origin);
while (queue.size) {
  const batch = [...queue.entries()].slice(0, 6);
  batch.forEach(([relative]) => { queue.delete(relative); done.add(relative); });
  await Promise.all(batch.map(async ([relative, url]) => {
    const target = path.join(root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    try {
      const existing = await stat(target).catch(() => null);
      if (!existing?.size) await run('curl.exe', ['--silent', '--show-error', '--location', '--fail', '--retry', '2', '--max-time', '180', url, '--output', target], { maxBuffer: 1024 * 1024 });
      const { size } = await stat(target);
      results.push({ path: relative, bytes: size });
      if (/\.(html|css|js|json)$/.test(relative)) discover(await readFile(target, 'utf8'), url, relative);
      console.log(`OK ${relative} (${size})`);
    } catch (error) {
      results.push({ path: relative, error: String(error.stderr || error.message).trim() });
      console.log(`FAILED ${relative}`);
    }
  }));
}
await writeFile(path.join(root, 'reference-assets.json'), JSON.stringify({ source: origin, downloadedAt: new Date().toISOString(), files: results }, null, 2) + '\n');
console.log(JSON.stringify({ downloaded: results.filter(x => !x.error).length, failed: results.filter(x => x.error).map(x => x.path), bytes: results.reduce((sum, x) => sum + (x.bytes || 0), 0) }));
