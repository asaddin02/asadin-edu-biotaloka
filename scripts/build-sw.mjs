#!/usr/bin/env node
// Regenerates the precache list and version in sw.js from the files on disk.
// Run after changing any app file:  npm run build   (CI runs `npm run build:check`)
import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const include = [
  'index.html',
  'manifest.webmanifest',
  'css',
  'js',
  'assets/brand/biotaloka-mark.png',
  'assets/brand/icon-192.png',
  'assets/brand/icon-512.png',
  'assets/brand/icon-maskable-512.png',
  'assets/brand/apple-touch-icon.png',
  'assets/brand/favicon-48.png',
];
// Large assets are cached on first use instead of at install time.

async function walk(path) {
  const full = join(root, path);
  const info = await stat(full);
  if (info.isFile()) return [path];
  const entries = await readdir(full, { withFileTypes: true });
  const nested = await Promise.all(entries.map(e => walk(join(path, e.name))));
  return nested.flat();
}

const files = (await Promise.all(include.map(walk)))
  .flat()
  .filter(f => !/\.(map|md)$/.test(f))
  .sort();
const hash = createHash('sha256');
for (const f of files) hash.update(f).update(await readFile(join(root, f)));
const version = hash.digest('hex').slice(0, 12);
const list = ['./', ...files.map(f => relative(root, join(root, f)).split('\\').join('/'))];

const swPath = join(root, 'sw.js');
const sw = await readFile(swPath, 'utf8');
const block = `// @precache-start\nconst VERSION = '${version}';\nconst PRECACHE = [\n${list.map(f => `  '${f}',`).join('\n')}\n];\n// @precache-end`;
const next = sw.replace(/\/\/ @precache-start[\s\S]*?\/\/ @precache-end/, block);
if (!/\/\/ @precache-start/.test(sw)) throw new Error('Precache markers not found in sw.js');
if (process.argv.includes('--check')) {
  if (next !== sw) {
    console.error('sw.js is out of date. Run `npm run build` and commit the result.');
    process.exit(1);
  }
  console.log(`sw.js is up to date (version ${version}).`);
  process.exit(0);
}
await writeFile(swPath, next);
const bytes = (await Promise.all(files.map(f => stat(join(root, f)).then(s => s.size)))).reduce(
  (a, b) => a + b,
  0
);
console.log(`sw.js: ${list.length} files, ${(bytes / 1024).toFixed(0)} KB, version ${version}`);
