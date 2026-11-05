import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const missing = [];
const reachable = new Set();
const visit = file => {
  if (reachable.has(file)) return;
  reachable.add(file);
  if (!/\.(html|css|js)$/.test(file)) return;
  const source = fs.readFileSync(path.join(root, file), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const values = [
    ...[...source.matchAll(/(?:src|href|poster)=["']([^"']+)["']/g)].map(m => m[1]),
    ...[...source.matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/g)].map(m => m[1]),
    ...[...source.matchAll(/["']([^"'\s]+\.(?:png|jpe?g|svg|webp|webm|mp4|pdf|woff2?|ttf|otf)(?:\?[^"'\s]*)?)["']/g)].map(m => m[1]),
    ...[...source.matchAll(/srcset=["']([^"']+)["']/g)].flatMap(m => m[1].split(',').map(v => v.trim().split(/\s+/)[0])),
  ];
  for (const value of new Set(values)) {
    if (!value || /^(?:[a-z]+:|\/\/|#)/i.test(value) || /[${}]/.test(value)) continue;
    const relative = decodeURIComponent(value.split(/[?#]/)[0]);
    const target = path.resolve(root, relative.startsWith('/') ? '.' + relative : path.join(path.dirname(file), relative));
    const local = path.relative(root, target).replaceAll('\\', '/');
    if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) missing.push(`${file}: ${value}`);
    else visit(local);
  }
};
visit('index.html');
const walk = directory => fs.readdirSync(path.join(root, directory), { withFileTypes: true })
  .flatMap(entry => entry.isDirectory() ? walk(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
const runtimeFiles = [
  ...fs.readdirSync(root).filter(file => /\.(html|css|js)$/.test(file)),
  ...['images', 'fonts', 'files', 'pages'].flatMap(walk).filter(file => !/\.(md|json)$/.test(file)),
];
const orphaned = runtimeFiles.filter(file => !reachable.has(file));
const css = [...reachable].filter(file => file.endsWith('.css')).map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
const tokens = fs.readFileSync(path.join(root, 'portfolio-tokens.css'), 'utf8');
const definitions = new Set([...tokens.matchAll(/(--pf-[\w-]+)\s*:/g)].map(match => match[1]));
const unknown = [...new Set([...css.matchAll(/var\((--pf-[\w-]+)/g)].map(match => match[1]))].filter(value => !definitions.has(value));
const tokenLinks = (html.match(/href="portfolio-tokens.css"/g) || []).length;
const adapterLinks = (html.match(/href="portfolio.css"/g) || []).length;
console.log(JSON.stringify({ missingAssets: missing, orphaned, reachableFiles: reachable.size, unknownTokens: unknown, tokenLinks, adapterLinks }, null, 2));
if (missing.length || orphaned.length || unknown.length || tokenLinks !== 1 || adapterLinks !== 1) process.exitCode = 1;
