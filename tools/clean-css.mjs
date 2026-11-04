import fs from 'node:fs';
import path from 'node:path';

// Conservative cleanup: retain cascade order, breakpoints and fallback values.
// Only retired component selectors and byte-equivalent repeated rules are removed.
const root = path.resolve(import.meta.dirname, '..');
const files = ['style.css', 'student.css', 'reference-alignment.css', 'portfolio.css'];
const retired = /\.(?:portfolio-chatbot|about-transition|gallery-interaction|ready-cta)(?:__[\w-]+|--[\w-]+)?(?![\w-])/;
const stats = { retiredSelectors: 0, duplicateRules: 0, duplicateDeclarations: 0 };

function scan(text, start, delimiters) {
  let quote = '', round = 0, square = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = ''; continue; }
    if (c === '/' && text[i + 1] === '*') { const end = text.indexOf('*/', i + 2); if (end < 0) throw Error('Unclosed comment'); i = end + 1; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '(') round++; else if (c === ')') round--;
    if (c === '[') square++; else if (c === ']') square--;
    if (!round && !square && delimiters.includes(c)) return i;
  }
  return text.length;
}
function closeBrace(text, open) {
  let depth = 1, cursor = open + 1;
  while (cursor < text.length) {
    const at = scan(text, cursor, '{}');
    if (at === text.length) break;
    depth += text[at] === '{' ? 1 : -1;
    if (!depth) return at;
    cursor = at + 1;
  }
  throw Error('Unclosed CSS rule');
}
function split(text, delimiter) {
  const parts = []; let cursor = 0;
  while (cursor < text.length) { const at = scan(text, cursor, delimiter); parts.push(text.slice(cursor, at)); cursor = at + 1; }
  return parts;
}
function parse(text, context = '', seen = new Map()) {
  const nodes = []; let cursor = 0;
  while (cursor < text.length) {
    const at = scan(text, cursor, '{;');
    if (at === text.length) { nodes.push({ raw: text.slice(cursor) }); break; }
    if (text[at] === ';') { nodes.push({ raw: text.slice(cursor, at + 1) }); cursor = at + 1; continue; }
    const end = closeBrace(text, at);
    const prelude = text.slice(cursor, at);
    const trivia = prelude.match(/^(?:\s|\/\*[\s\S]*?\*\/)* */)[0];
    let selector = prelude.slice(trivia.length).trim();
    const node = { trivia, selector, body: text.slice(at + 1, end) };
    nodes.push(node);
    if (/^@(media|supports|container|layer|scope)\b/i.test(selector)) {
      node.children = parse(node.body, context + '|' + selector, seen);
    } else if (!selector.startsWith('@')) {
      const selectors = split(selector, ',');
      const keep = selectors.filter(s => !retired.test(s));
      stats.retiredSelectors += selectors.length - keep.length;
      if (!keep.length) node.removed = true;
      else {
        if (keep.length !== selectors.length) node.selector = keep.map(s => s.trim()).join(',\n');
        const key = context + '|' + node.selector.replace(/\s+/g, ' ') + '|' + node.body.trim();
        if (seen.has(key)) { seen.get(key).removed = true; stats.duplicateRules++; }
        seen.set(key, node);
        const declarations = split(node.body, ';');
        const values = new Set();
        let changed = false;
        for (let i = declarations.length - 1; i >= 0; i--) {
          const normalized = declarations[i].replace(/\/\*[\s\S]*?\*\//g, '').trim();
          if (!normalized.includes(':')) continue;
          if (values.has(normalized)) { declarations[i] = ''; stats.duplicateDeclarations++; changed = true; }
          values.add(normalized);
        }
        if (changed) node.body = declarations.filter(Boolean).join(';') + ';';
      }
    }
    cursor = end + 1;
  }
  return nodes;
}
function serialize(nodes) {
  return nodes.map(node => {
    if ('raw' in node) return node.raw;
    if (node.removed) return node.trivia;
    const body = node.children ? serialize(node.children) : node.body;
    if (node.children && !body.replace(/\/\*[\s\S]*?\*\//g, '').trim()) return node.trivia;
    return node.trivia + node.selector + ' {' + body + '}';
  }).join('');
}
const report = [];
for (const file of files) {
  const target = path.join(root, file);
  const source = fs.readFileSync(target, 'utf8');
  const previousCount = Object.values(stats).reduce((sum, count) => sum + count, 0);
  const result = serialize(parse(source)).replace(/(?:\r?\n[\t ]*){4,}/g, '\n\n\n');
  const changed = Object.values(stats).reduce((sum, count) => sum + count, 0) !== previousCount;
  if (changed) fs.writeFileSync(target, result);
  report.push({ file, before: Buffer.byteLength(source), after: Buffer.byteLength(changed ? result : source) });
}
console.log(JSON.stringify({ ...stats, files: report }, null, 2));
