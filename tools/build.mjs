import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'dist');
// Only the generated directory inside this checkout is replaced.
if (path.dirname(output) !== root || path.basename(output) !== 'dist') throw Error('Invalid output directory');
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });
const entries = await fs.readdir(root, { withFileTypes: true });
const directories = new Set(['assets', 'files', 'fonts', 'images', 'pages', 'vendor']);
for (const entry of entries) {
  if ((entry.isFile() && /\.(html|css|js)$/.test(entry.name)) || (entry.isDirectory() && directories.has(entry.name))) {
    await fs.cp(path.join(root, entry.name), path.join(output, entry.name), { recursive: true });
  }
}
console.log('Static site built in dist/');
