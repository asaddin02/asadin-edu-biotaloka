#!/usr/bin/env node
// Biotaloka production server: static files + caching proxy for GBIF and iNaturalist.
// No dependencies. Node 20+.
//
// Why a proxy? A whole classroom usually shares one public IP address. iNaturalist asks clients to
// stay near one request per second, so 30 pupils browsing at once would be throttled. The proxy
// caches responses and paces upstream requests for everyone.
//
// Environment: PORT (8080) · HOST (0.0.0.0) · INAT_INTERVAL_MS (1000) · CACHE_MAX_ENTRIES (3000)
//              CLIENT_LIMIT_PER_MIN (240) · TRUST_PROXY (0) · HSTS=1 (behind HTTPS) · LOG=1 · USER_AGENT
//              PROXY=0 serves files only (/api/* answers 404, as on plain static hosting); the tests use it.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, brotliCompressSync, constants as zlib } from 'node:zlib';
import { DEFAULT_USER_AGENT, SECURITY_HEADERS as BASE_HEADERS, UPSTREAM, route } from './policy.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const INAT_INTERVAL = Number(process.env.INAT_INTERVAL_MS || 1000);
const CACHE_MAX = Number(process.env.CACHE_MAX_ENTRIES || 3000);
const CLIENT_LIMIT = Number(process.env.CLIENT_LIMIT_PER_MIN || 240);
// Number of reverse proxies in front of this server (usually 1 behind nginx, Caddy or a PaaS router).
// X-Forwarded-For is ignored when 0, because any client can write that header.
const TRUST_PROXY = Number(process.env.TRUST_PROXY || 0);
const USER_AGENT = process.env.USER_AGENT || DEFAULT_USER_AGENT;
const LOG = process.env.LOG === '1';
const PROXY = process.env.PROXY !== '0';
const VERSION = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8')).version;

const SECURITY_HEADERS = {
  ...BASE_HEADERS,
  ...(process.env.HSTS === '1' ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' } : {}),
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.geojson': 'application/geo+json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
};
const COMPRESSIBLE = /^(text\/|application\/(json|geo\+json|manifest\+json|javascript))|image\/svg/;
const PUBLIC_PATHS = [
  /^\/$/,
  /^\/index\.html$/,
  /^\/manifest\.webmanifest$/,
  /^\/sw\.js$/,
  /^\/robots\.txt$/,
  /^\/css\//,
  /^\/js\//,
  /^\/assets\//,
  /^\/data\/snapshot\//,
];

/* ---------- Static files ---------- */
const compressed = new Map();

function pick(req, body, type, key) {
  const accept = String(req.headers['accept-encoding'] || '');
  if (!COMPRESSIBLE.test(type) || body.length < 1024) return { body, encoding: null };
  const encoding = /\bbr\b/.test(accept) ? 'br' : /\bgzip\b/.test(accept) ? 'gzip' : null;
  if (!encoding) return { body, encoding: null };
  const cacheKey = `${key}|${encoding}`;
  if (!compressed.has(cacheKey)) {
    const out =
      encoding === 'br'
        ? brotliCompressSync(body, { params: { [zlib.BROTLI_PARAM_QUALITY]: 9 } })
        : gzipSync(body, { level: 9 });
    compressed.set(cacheKey, out);
  }
  return { body: compressed.get(cacheKey), encoding };
}

/** App pages (/species/inat-41967, /learn/sel): paths made of plain segments, without a file name. */
const isPage = pathname => /^\/(?:[\w%-]+(?:\/[\w%-]+)*)?$/.test(pathname) && !pathname.startsWith('/api/');

async function serveStatic(req, res, pathname) {
  if (pathname === '/' || isPage(pathname)) pathname = '/index.html';
  if (!PUBLIC_PATHS.some(re => re.test(pathname)))
    return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
  const file = normalize(join(ROOT, decodeURIComponent(pathname)));
  if (!file.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep))
    return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
  let info;
  try {
    info = await stat(file);
    if (!info.isFile()) throw new Error('not a file');
  } catch {
    return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
  }
  const etag = `W/"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`;
  const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
  const volatile =
    /\/(index\.html|sw\.js)$/.test(file) ||
    /\.(js|css|webmanifest)$/.test(file) ||
    pathname.startsWith('/data/snapshot/');
  const headers = {
    ...SECURITY_HEADERS,
    'Content-Type': type,
    ETag: etag,
    'Cache-Control': volatile ? 'no-cache' : 'public, max-age=604800',
    Vary: 'Accept-Encoding',
  };
  if (pathname === '/sw.js') headers['Service-Worker-Allowed'] = '/';
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers);
    return res.end();
  }
  const raw = await readFile(file);
  const { body, encoding } = pick(req, raw, type, `${file}|${etag}`);
  if (encoding) headers['Content-Encoding'] = encoding;
  headers['Content-Length'] = body.length;
  res.writeHead(200, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}

/* ---------- Caching proxy ---------- */
const cache = new Map();
const inflight = new Map();
let inatQueue = Promise.resolve();
let lastInat = 0;

function remember(key, entry) {
  cache.delete(key);
  cache.set(key, entry);
  while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
}

function paceINat() {
  const turn = inatQueue.then(async () => {
    const wait = Math.max(0, lastInat + INAT_INTERVAL - Date.now());
    if (wait) await new Promise(r => setTimeout(r, wait));
    lastInat = Date.now();
  });
  inatQueue = turn.catch(() => {});
  return turn;
}

async function upstream(provider, path, search) {
  const url = `${UPSTREAM[provider].base}${path}${search}`;
  const hit = cache.get(url);
  if (hit && hit.expires > Date.now()) return { ...hit, cache: 'HIT' };
  if (inflight.has(url)) return inflight.get(url);
  const task = (async () => {
    if (provider === 'inat') await paceINat();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: controller.signal,
      });
      const body = Buffer.from(await response.arrayBuffer());
      const entry = {
        status: response.status,
        type: response.headers.get('content-type') || 'application/json',
        body,
        expires: Date.now() + UPSTREAM[provider].ttl(path),
      };
      if (response.ok) remember(url, entry);
      else if (hit) return { ...hit, cache: 'STALE' };
      return { ...entry, cache: 'MISS' };
    } catch (error) {
      if (hit) return { ...hit, cache: 'STALE' };
      throw error;
    } finally {
      clearTimeout(timer);
    }
  })();
  inflight.set(url, task);
  try {
    return await task;
  } finally {
    inflight.delete(url);
  }
}

/* ---------- Per-client rate limit ---------- */
const clients = new Map();
/** The address seen by the outermost trusted proxy; entries further left are client-supplied. */
function clientAddress(req) {
  const socket = req.socket.remoteAddress || '';
  if (!TRUST_PROXY) return socket;
  const hops = String(req.headers['x-forwarded-for'] || '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  return hops[hops.length - TRUST_PROXY] || hops[0] || socket;
}
function allowed(req) {
  const ip = clientAddress(req);
  const now = Date.now();
  const entry = clients.get(ip) || { start: now, count: 0 };
  if (now - entry.start > 60e3) {
    entry.start = now;
    entry.count = 0;
  }
  entry.count++;
  clients.set(ip, entry);
  if (clients.size > 10000) clients.clear();
  return entry.count <= CLIENT_LIMIT;
}

async function serveAPI(req, res, pathname, search) {
  if (pathname === '/api/health')
    return sendJSON(res, 200, { ok: true, proxy: true, version: VERSION, cached: cache.size });
  const { provider, path, error } = route(pathname.slice('/api/'.length));
  if (error === 404) return sendJSON(res, 404, { error: 'Unknown endpoint' });
  if (error === 403) return sendJSON(res, 403, { error: 'Endpoint not allowed' });
  if (!allowed(req))
    return sendJSON(res, 429, { error: 'Too many requests. Please slow down.' }, { 'Retry-After': '30' });
  if (search.length > 2000) return sendJSON(res, 414, { error: 'Query too long' });
  try {
    const result = await upstream(provider, path, search);
    const { body, encoding } = pick(req, result.body, result.type, `${provider}${path}${search}`);
    res.writeHead(result.status, {
      ...SECURITY_HEADERS,
      'Content-Type': result.type,
      'Cache-Control': 'public, max-age=300',
      'X-Cache': result.cache,
      Vary: 'Accept-Encoding',
      ...(encoding ? { 'Content-Encoding': encoding } : {}),
      'Content-Length': body.length,
    });
    res.end(body);
  } catch (error) {
    sendJSON(res, 502, { error: 'Upstream unavailable' });
    if (LOG) console.error('upstream error', provider, path, error.message);
  }
}

/* ---------- Helpers ---------- */
function send(res, status, text, type) {
  res.writeHead(status, { ...SECURITY_HEADERS, 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(text);
}
function sendJSON(res, status, data, extra = {}) {
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extra,
  });
  res.end(JSON.stringify(data));
}

const server = createServer(async (req, res) => {
  const started = Date.now();
  try {
    if (!['GET', 'HEAD'].includes(req.method))
      return send(res, 405, 'Method not allowed', 'text/plain; charset=utf-8');
    const { pathname, search } = new URL(req.url, 'http://localhost');
    if (pathname.startsWith('/api/')) {
      if (PROXY) await serveAPI(req, res, pathname, search);
      else sendJSON(res, 404, { error: 'No proxy on this server' });
    } else await serveStatic(req, res, pathname);
  } catch (error) {
    if (!res.headersSent) send(res, 500, 'Internal error', 'text/plain; charset=utf-8');
    console.error(error);
  } finally {
    if (LOG) console.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - started}ms`);
  }
});

server.listen(PORT, HOST, () =>
  console.log(`Biotaloka ${VERSION} on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`)
);
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
