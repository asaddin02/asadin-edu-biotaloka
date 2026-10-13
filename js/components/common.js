// Small building blocks shared by pages.
import { esc } from '../core/dom.js';
import { fmt, pick } from '../core/prefs.js';
import { ui } from '../i18n/ui.js';
import { brandImage, icon } from './icons.js';

export function pageHead(title, subtitle = '', eyebrow = 'BIOTALOKA', { brand = true } = {}) {
  return `<header class="page-head">${brand ? brandImage('page-brand') : ''}<span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</header>`;
}

export function loading(message = ui.loading) {
  return `<div class="status" role="status">${brandImage('loading-brand')}<span class="spinner" aria-hidden="true"></span><p>${esc(message)}</p></div>`;
}

export function errorState(message = ui.error, hint = ui.errorHint) {
  return `<div class="status" role="alert"><h3>${esc(message)}</h3><p>${esc(hint)}</p><button class="btn" type="button" data-retry>${ui.retry}</button></div>`;
}

export function emptyState(message = ui.empty, hint = ui.emptyHint) {
  return `<div class="status">${brandImage('empty-brand')}<h3>${esc(message)}</h3>${hint ? `<p>${esc(hint)}</p>` : ''}</div>`;
}

export function crumbs(items = [], label = ui.tree, root = { name: ui.tree, url: '/tree' }) {
  return `<nav class="breadcrumbs" aria-label="${esc(label)}"><a href="${root.url}">${esc(root.name)}</a>${items
    .map(x => `<span aria-hidden="true">›</span><a href="${esc(x.url)}">${esc(x.name)}</a>`)
    .join('')}</nav>`;
}

export function pagination(page, hasNext, url, totalPages) {
  const prev =
    page > 1
      ? `<a class="btn secondary" href="${url(page - 1)}">← ${ui.prev}</a>`
      : `<button class="btn secondary" type="button" disabled>${ui.prev}</button>`;
  const next = hasNext
    ? `<a class="btn secondary" href="${url(page + 1)}">${ui.next} →</a>`
    : `<button class="btn secondary" type="button" disabled>${ui.next}</button>`;
  return `<nav class="pagination" aria-label="${ui.page}">${prev}<span>${ui.page} ${fmt(page)}${totalPages ? ` / ${fmt(totalPages)}` : ''}</span>${next}</nav>`;
}

export function listenButton(targetSelector, id) {
  return `<button class="btn ghost listen" type="button" data-speak="${esc(targetSelector)}" data-speak-id="${esc(id)}" hidden>${icon('speaker')}<span>${ui.listen}</span></button>`;
}

export function notice(html, tone = '') {
  return `<div class="notice${tone ? ` notice-${tone}` : ''}">${html}</div>`;
}

export const routeURL = (path, params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  );
  const q = new URLSearchParams(clean).toString();
  return `/${path}${q ? `?${q}` : ''}`;
};

export function validPage(value, max = 4167) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : 1;
}

/** In-page navigation never reloads the route or discards unfinished answers. */
export function sectionNav(items) {
  return `<nav class="section-nav" aria-label="${pick(['Di halaman ini', 'On this page'])}"><span class="eyebrow">${pick(['Di halaman ini', 'On this page'])}</span>${items.map(([id, label], i) => `<a href="${esc(location.pathname + location.search)}#${esc(id)}" data-jump="${esc(id)}"><span aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>${esc(label)}</a>`).join('')}</nav>`;
}
