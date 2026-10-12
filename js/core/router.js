// Path router with lazily loaded pages: /species/inat-41967, /learn/adaptasi, /search?q=... and
// /about#privasi (a normal fragment). Every navigation gets a token so that late responses from a
// previous page can never overwrite the current one. Old "#/..." links are converted at startup.
import { $ } from './dom.js';

const pages = {
  home: () => import('../pages/home.js'),
  search: () => import('../pages/explore.js'),
  tree: () => import('../pages/tree.js'),
  species: () => import('../pages/species.js'),
  learn: () => import('../pages/learn.js'),
  peta: () => import('../pages/biomap.js'),
  lab: () => import('../pages/lab.js'),
  quiz: () => import('../pages/quiz.js'),
  compare: () => import('../pages/compare.js'),
  nearby: () => import('../pages/nearby.js'),
  purba: () => import('../pages/prehistoric.js'),
  kamus: () => import('../pages/glossary.js'),
  saved: () => import('../pages/saved.js'),
  guru: () => import('../pages/teacher.js'),
  tugas: () => import('../pages/assignment.js'),
  about: () => import('../pages/about.js'),
  dukung: () => import('../pages/support.js'),
};

let epoch = 0;
let cleanups = [];
const scoped = [];
const hooks = { before: () => {}, after: () => {}, error: () => {} };
/** Path and query of the page currently shown; a fragment-only change must not re-render. */
let shown = null;

export const isCurrent = token => token === epoch;
export function configureRouter(options) {
  Object.assign(hooks, options);
}

/** Path, query and fragment of the current page, e.g. "/search?q=kucing". */
export const currentURL = () => location.pathname + location.search;

/** "#/about#privasi" → "/about#privasi"; other values are returned unchanged. */
export function fromLegacy(href) {
  const text = String(href || '');
  if (!text.startsWith('#/')) return text;
  const path = text.slice(1);
  return path === '/home' || path.startsWith('/home?') || path.startsWith('/home#')
    ? path.replace(/^\/home/, '/')
    : path;
}

export function parseRoute(url = location.pathname + location.search + location.hash) {
  const body = fromLegacy(url) || '/';
  const anchorAt = body.indexOf('#');
  const route = anchorAt >= 0 ? body.slice(0, anchorAt) : body;
  const anchor = anchorAt >= 0 ? body.slice(anchorAt + 1) : '';
  const [raw, query = ''] = route.split('?');
  // A prerendered file opened by its name (/learn/sel.html on a plain file server) is the same page.
  const [first = '', ...rest] = raw
    .replace(/^\//, '')
    .replace(/\/+$/, '')
    .replace(/\.html$/, '')
    .split('/');
  const page = first === '' || first === 'home' || first === 'index.html' ? 'home' : first;
  let id;
  try {
    id = rest.length ? decodeURIComponent(rest.join('/')) : undefined;
  } catch {
    id = rest.join('/');
  }
  return { page, id, params: new URLSearchParams(query), anchor };
}

/** Event handlers that live only while the current page is shown. */
function on(type, selector, fn) {
  scoped.push({ type, selector, fn });
}
function dispatch(event) {
  for (const h of [...scoped]) {
    if (h.type !== event.type) continue;
    const target = event.target instanceof Element ? event.target.closest(h.selector) : null;
    if (target) h.fn(event, target);
  }
}
['click', 'input', 'change', 'submit', 'keydown', 'suggest-pick'].forEach(type =>
  document.addEventListener(type, dispatch)
);
document.addEventListener('toggle', dispatch, true);

export async function render() {
  const token = ++epoch;
  cleanups.forEach(fn => {
    try {
      fn();
    } catch {
      /* ignore cleanup errors */
    }
  });
  cleanups = [];
  scoped.length = 0;
  const route = parseRoute();
  shown = currentURL();
  const main = $('#main');
  const known = pages[route.page];
  hooks.before(route);
  if (!known) {
    main.innerHTML = '';
    hooks.error(route, null, true);
    return;
  }
  try {
    const mod = await known();
    if (token !== epoch) return;
    main.dataset.page = route.page;
    await mod.render({
      ...route,
      main,
      token,
      isCurrent: () => token === epoch,
      on,
      cleanup: fn => cleanups.push(fn),
    });
    if (token !== epoch) return;
    document.title = `${mod.title ? mod.title(route) : 'BioTaxa'} · BioTaxa`;
    hooks.after(route, main);
  } catch (error) {
    if (token !== epoch) return;
    console.warn('BioTaxa render failed:', error);
    hooks.error(route, error, false);
  }
}

function afterNavigation() {
  return render().then(() => {
    if (!parseRoute().anchor) $('#main')?.focus({ preventScroll: true });
  });
}

/** Go to an app URL ("/learn/sel", "/search?q=kucing", or a legacy "#/..." link) without reloading. */
export function navigate(href, { replace = false } = {}) {
  const url = new URL(fromLegacy(href), location.href);
  if (url.origin !== location.origin) {
    location.assign(url.href);
    return Promise.resolve();
  }
  history[replace ? 'replaceState' : 'pushState'](null, '', url.href);
  window.scrollTo(0, 0);
  return afterNavigation();
}

/** Links handled by the app: same-origin, no modifier keys, no target or download. */
function appLink(event) {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const a = event.target instanceof Element ? event.target.closest('a[href]') : null;
  if (!a || a.target || a.hasAttribute('download') || a.getAttribute('rel')?.includes('external'))
    return null;
  const raw = a.getAttribute('href') || '';
  // Plain fragments (#main, #letter-a) scroll inside the page; "#/..." is a legacy app link.
  if (raw.startsWith('#') && !raw.startsWith('#/')) return null;
  const url = new URL(fromLegacy(raw), location.href);
  if (url.origin !== location.origin) return null;
  // Files (sw.js, assets) and the API are not pages.
  if (/\.[a-z0-9]+$/i.test(url.pathname) || url.pathname.startsWith('/api/')) return null;
  return url;
}

/** Intercepts link clicks and the back/forward buttons. Call once, after other click handlers. */
export function startRouter() {
  if (location.hash.startsWith('#/')) history.replaceState(null, '', fromLegacy(location.hash));
  document.addEventListener('click', event => {
    const url = appLink(event);
    if (!url) return;
    event.preventDefault();
    const samePage = url.pathname + url.search === currentURL();
    history.pushState(null, '', url.href);
    if (samePage && url.hash) {
      document.getElementById(url.hash.slice(1))?.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
    afterNavigation();
  });
  window.addEventListener('popstate', () => {
    if (location.hash.startsWith('#/')) history.replaceState(null, '', fromLegacy(location.hash));
    // Chrome also fires popstate for fragment changes; the page itself is unchanged then.
    if (currentURL() === shown) {
      const { anchor } = parseRoute();
      if (anchor) document.getElementById(anchor)?.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
    afterNavigation();
  });
}
