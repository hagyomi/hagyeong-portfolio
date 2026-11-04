import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const pages = ['index.html', ...fs.readdirSync(path.join(root, 'pages')).filter(name => name.endsWith('.html')).map(name => `pages/${name}`)];
const missing = [];
for (const page of pages) {
  const source = fs.readFileSync(path.join(root, page), 'utf8');
  const urls = [...source.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map(match => match[1].split(/[?#]/)[0])
    .filter(value => value && !/^[a-z]+:/i.test(value));
  for (const url of new Set(urls)) {
    if (!fs.existsSync(path.resolve(root, path.dirname(page), url))) missing.push(`${page}: ${url}`);
  }
}
const css = fs.readFileSync(path.join(root, 'portfolio.css'), 'utf8');
const tokens = fs.readFileSync(path.join(root, 'portfolio-tokens.css'), 'utf8');
const definitions = new Set([...tokens.matchAll(/(--pf-[\w-]+)\s*:/g)].map(match => match[1]));
const unknown = [...new Set([...css.matchAll(/var\((--pf-[\w-]+)/g)].map(match => match[1]))].filter(value => !definitions.has(value));
const tokenLinks = (html.match(/href="portfolio-tokens.css"/g) || []).length;
const adapterLinks = (html.match(/href="portfolio.css"/g) || []).length;
console.log(JSON.stringify({ missingHtmlAssets: missing, unknownTokens: unknown, tokenLinks, adapterLinks }, null, 2));
if (missing.length || unknown.length || tokenLinks !== 1 || adapterLinks !== 1) process.exitCode = 1;
