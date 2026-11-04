import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const files = ['index.html', ...fs.readdirSync(path.join(root, 'pages')).filter(f => f.endsWith('.html')).map(f => 'pages/' + f)];
const errors = [];
const voidTags = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
for (const file of files) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const content = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const stack = [];
  for (const match of content.matchAll(/<(\/?)([a-z][\w:-]*)\b[^>]*>/gi)) {
    const tag = match[2].toLowerCase();
    if (voidTags.has(tag)) continue;
    if (match[1]) {
      if (stack.pop() !== tag) errors.push(`${file}: mismatched closing ${tag}`);
    } else if (!match[0].endsWith('/>')) stack.push(tag);
  }
  if (stack.length) errors.push(`${file}: unclosed ${stack.join(', ')}`);
  const ids = [...content.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  for (const id of ids.filter((id, i) => ids.indexOf(id) !== i)) errors.push(`${file}: duplicate id ${id}`);
}
const cssFiles = [...fs.readdirSync(root).filter(f => f.endsWith('.css')), ...fs.readdirSync(path.join(root, 'pages')).filter(f => f.endsWith('.css')).map(f => 'pages/' + f)];
for (const file of cssFiles) {
  const source = fs.readFileSync(path.join(root, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of source.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)) {
    const url = match[1];
    if (/^(?:data:|https?:|\/\/|#)/.test(url)) continue;
    const resolved = path.resolve(root, path.dirname(file), decodeURIComponent(url.split(/[?#]/)[0]));
    if (!fs.existsSync(resolved)) errors.push(`${file}: missing CSS asset ${url}`);
  }
}
console.log(JSON.stringify({ htmlFiles: files.length, cssFiles: cssFiles.length, errors }, null, 2));
if (errors.length) process.exitCode = 1;
