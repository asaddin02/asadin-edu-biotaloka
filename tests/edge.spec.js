// Unit tests for the Cloudflare Pages Function (functions/api/[[path]].js), run in Node with a
// stand-in for the Workers cache and upstream fetch.
import { test, expect } from '@playwright/test';
import { onRequest } from '../functions/api/[[path]].js';

test.describe.configure({ mode: 'serial' });

let upstreamCalls;
let upstreamStatus;
const realFetch = globalThis.fetch;
const realCaches = globalThis.caches;

test.beforeEach(() => {
  upstreamCalls = [];
  upstreamStatus = 200;
  const store = new Map();
  globalThis.caches = {
    default: {
      match: async req => store.get(req.url)?.clone(),
      put: async (req, res) => void store.set(req.url, res),
    },
  };
  globalThis.fetch = async (url, init) => {
    upstreamCalls.push({ url, agent: init.headers['User-Agent'] });
    return new Response(JSON.stringify({ results: [{ id: 1 }] }), {
      status: upstreamStatus,
      headers: { 'Content-Type': 'application/json' },
    });
  };
});
test.afterEach(() => {
  globalThis.fetch = realFetch;
  globalThis.caches = realCaches;
});

async function call(path, { method = 'GET', env = {} } = {}) {
  const url = new URL(`https://biotaloka.asadinedu.com/api/${path}`);
  const pending = [];
  const response = await onRequest({
    request: new Request(url, { method }),
    params: { path: url.pathname.slice(5).split('/') },
    env,
    waitUntil: p => pending.push(p),
  });
  await Promise.all(pending);
  return response;
}

test('health announces an edge proxy', async () => {
  const res = await call('health');
  expect(await res.json()).toMatchObject({ ok: true, proxy: true, edge: true });
});

test('only known read-only endpoints are forwarded', async () => {
  expect((await call('inat/v1/users/me')).status).toBe(403);
  expect((await call('gbif/v1/occurrence/download/request')).status).toBe(403);
  expect((await call('elsewhere/v1/x')).status).toBe(404);
  expect((await call('inat/v1/taxa/1', { method: 'POST' })).status).toBe(405);
  expect(upstreamCalls).toEqual([]);
});

test('the first request fills the edge cache and the next one is served from it', async () => {
  const first = await call('inat/v1/taxa/41967?locale=id');
  expect(first.headers.get('x-cache')).toBe('MISS');
  expect(first.headers.get('cache-control')).toBe('public, max-age=300');
  expect(upstreamCalls).toEqual([
    {
      url: 'https://api.inaturalist.org/v1/taxa/41967?locale=id',
      agent: expect.stringContaining('github.com/asaddin02/asadin-edu-biotaloka'),
    },
  ]);
  const second = await call('inat/v1/taxa/41967?locale=id');
  expect(second.headers.get('x-cache')).toBe('HIT');
  expect(await second.json()).toEqual({ results: [{ id: 1 }] });
  expect(upstreamCalls).toHaveLength(1);
  await call('inat/v1/taxa/41967?locale=en');
  expect(upstreamCalls).toHaveLength(2);
});

test('rate limits and outages are passed on, never cached', async () => {
  upstreamStatus = 429;
  const limited = await call('inat/v1/taxa/autocomplete?q=hiu');
  expect(limited.status).toBe(429);
  expect(limited.headers.get('retry-after')).toBe('60');
  upstreamStatus = 503;
  expect((await call('inat/v1/taxa/autocomplete?q=hiu')).status).toBe(502);
  upstreamStatus = 200;
  expect((await call('inat/v1/taxa/autocomplete?q=hiu')).headers.get('x-cache')).toBe('MISS');
  expect(upstreamCalls).toHaveLength(3);
});

test('the User-Agent can be set per deployment', async () => {
  await call('gbif/v1/species/5219416', { env: { USER_AGENT: 'Biotaloka (school.example)' } });
  expect(upstreamCalls[0]).toEqual({
    url: 'https://api.gbif.org/v1/species/5219416',
    agent: 'Biotaloka (school.example)',
  });
});
