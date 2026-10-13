#!/usr/bin/env node
// Assembles dist/: the files a static host (Cloudflare Pages) should publish, plus the API snapshot,
// one prerendered HTML file per public page (scripts/prerender.mjs), sitemap.xml, 404.html and a
// _headers file with the same security policy as server/server.mjs.
//   npm run build:site                                   (also refreshes the sw.js precache list)
//   SITE_URL=https://biotaloka.example npm run build:site  absolute link-preview URLs for that address
// The Pages Function in functions/ is deployed from the project root by `wrangler pages deploy dist`.
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECURITY_HEADERS } from '../server/policy.mjs';
import { prerender } from './prerender.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const siteURL = (process.env.SITE_URL || '').replace(/\/+$/, '');
if (siteURL && !/^https:\/\/[^/]+$/.test(siteURL))
  throw new Error(`SITE_URL must look like https://example.org, got "${siteURL}"`);

const FILES = ['index.html', 'manifest.webmanifest', 'sw.js', 'robots.txt'];
const DIRS = ['css', 'js', 'assets'];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of FILES) await cp(join(root, file), join(dist, file));
for (const dir of DIRS)
  await cp(join(root, dir), join(dist, dir), { recursive: true, filter: src => !src.endsWith('.md') });

const snapshot = join(root, 'data', 'snapshot');
if (existsSync(join(snapshot, 'index.json')))
  await cp(snapshot, join(dist, 'data', 'snapshot'), { recursive: true });
else console.warn('No data/snapshot/ yet (run `npm run snapshot`); the site will call the APIs directly.');

// Link previews (WhatsApp, Facebook, X) need absolute URLs, which depend on the published address.
if (siteURL) {
  const path = join(dist, 'index.html');
  let html = await readFile(path, 'utf8');
  const image = '<meta property="og:image" content="/assets/brand/og-image.jpg" />';
  const type = '<meta property="og:type" content="website" />';
  if (!html.includes(image) || !html.includes(type))
    throw new Error('index.html Open Graph tags changed; update scripts/build-site.mjs');
  html = html
    .replace(image, `<meta property="og:image" content="${siteURL}/assets/brand/og-image.jpg" />`)
    .replace(
      type,
      `${type}\n    <meta property="og:url" content="${siteURL}/" />\n    <link rel="canonical" href="${siteURL}/" />`
    );
  await writeFile(path, html);
}

// Search engines. GOOGLE_SITE_VERIFICATION (the content of Search Console's meta tag, or the whole tag)
// proves ownership; the sitemap needs SITE_URL. Both are added to index.html before it becomes the
// shell of every prerendered page.
const verification = (process.env.GOOGLE_SITE_VERIFICATION || '').match(
  /(?:content="([^"]*)"|^\s*(\S+)\s*$)/
);
const verificationCode = verification?.[1] ?? verification?.[2] ?? '';
if (process.env.GOOGLE_SITE_VERIFICATION?.trim() && !/^[\w-]{20,100}$/.test(verificationCode))
  throw new Error('GOOGLE_SITE_VERIFICATION must be the content of the google-site-verification meta tag');
if (verificationCode) {
  const path = join(dist, 'index.html');
  const html = await readFile(path, 'utf8');
  await writeFile(
    path,
    html.replace(
      '</head>',
      `  <meta name="google-site-verification" content="${verificationCode}" />\n  </head>`
    )
  );
}
// One static HTML file per page (dist/species/inat-41967.html → /species/inat-41967), the sitemap of
// every indexable page, and 404.html: the app shell marked noindex, so unknown paths answer 404 while
// visitors still get the app (Cloudflare Pages serves 404.html for paths without a file).
const { pages, urls } = await prerender({ dist, siteURL });
if (siteURL) {
  await writeFile(
    join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map(u => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`)
      .join('\n')}\n</urlset>\n`
  );
  const robots = await readFile(join(dist, 'robots.txt'), 'utf8');
  await writeFile(join(dist, 'robots.txt'), `${robots.trimEnd()}\n\nSitemap: ${siteURL}/sitemap.xml\n`);
}

// Cloudflare Pages reads _headers for static files; the Function sets its own headers.
const headers = { ...SECURITY_HEADERS, 'Strict-Transport-Security': 'max-age=31536000' };
await writeFile(
  join(dist, '_headers'),
  `/*\n${Object.entries(headers)
    .map(([name, value]) => `  ${name}: ${value}`)
    .join('\n')}\n`
);

async function size(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await size(full);
      files += sub.files;
      bytes += sub.bytes;
    } else {
      files++;
      bytes += (await stat(full)).size;
    }
  }
  return { files, bytes };
}
const { files, bytes } = await size(dist);
console.log(
  `dist/: ${files} files, ${(bytes / 1048576).toFixed(1)} MB, ${pages} prerendered pages${
    siteURL ? `, ${urls.length} sitemap URLs for ${siteURL}` : ''
  }.`
);
