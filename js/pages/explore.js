import { config } from '../config.js';
import { $, esc } from '../core/dom.js';
import { currentURL, navigate } from '../core/router.js';
import { S, fmt, pick } from '../core/prefs.js';
import { read, write, KEYS } from '../core/storage.js';
import { ui, rankLabel } from '../i18n/ui.js';
import { API, PAGE_SIZE, groups, KINGDOM_KEYS } from '../services/api.js';
import { photosOf, photoMarkup } from '../services/media.js';
import {
  loading,
  emptyState,
  errorState,
  pagination,
  routeURL,
  validPage,
  notice,
} from '../components/common.js';
import { visualCard, taxonCard, refresh, iconicIcon } from '../components/cards.js';
import { suggestField } from '../components/suggest.js';
import { icon, brandImage } from '../components/icons.js';
import { searchKnowledge, lessonsMentioning } from '../services/localsearch.js';

const s = S({
  title: ['Jelajahi kehidupan', 'Explore life'],
  heading: ['Ada dunia baru di setiap penemuan.', 'A new world in every discovery.'],
  intro: [
    'Cari nama sehari-hari atau nama ilmiah, pilih kelompok, lalu ikuti rasa ingin tahumu.',
    'Search everyday or scientific names, pick a group, and follow your curiosity.',
  ],
  groups: ['Pilih kelompok', 'Choose a group'],
  visual: ['Galeri foto', 'Photo gallery'],
  index: ['Indeks taksonomi', 'Taxonomic index'],
  scope: ['Cakupan', 'Scope'],
  indonesia: ['Indonesia', 'Indonesia'],
  world: ['Seluruh dunia', 'Worldwide'],
  matches: ['kecocokan nama', 'name matches'],
  speciesIndonesia: ['spesies tercatat di Indonesia', 'species recorded in Indonesia'],
  speciesWorld: ['spesies terindeks di iNaturalist', 'species indexed on iNaturalist'],
  gbifResults: ['spesies pada indeks GBIF', 'species in the GBIF index'],
  matchedGroups: ['Kelompok yang cocok', 'Matching groups'],
  matchedGroupsHint: [
    'Buka kelompok untuk melihat semua anggotanya.',
    'Open a group to see all its members.',
  ],
  top30: [
    'Menampilkan kecocokan teratas. Persempit kata kunci atau buka salah satu kelompok di atas untuk hasil lainnya.',
    'Showing the top matches. Narrow your words or open one of the groups above for more.',
  ],
  noSpecies: ['Belum ada spesies yang cocok dengan kata itu.', 'No species match that word yet.'],
  tryIndex: ['Cari di indeks taksonomi GBIF', 'Search the GBIF taxonomic index'],
  fallbackWorld: [
    'Belum ada catatan dari Indonesia untuk kelompok ini. Menampilkan data seluruh dunia.',
    'No records from Indonesia for this group yet. Showing worldwide data.',
  ],
  browsing: ['Kelompok', 'Group'],
  clear: ['Hapus filter', 'Clear filter'],
  galleryHintId: [
    'Diurutkan dari spesies yang paling sering diamati di Indonesia (pengamatan berkualitas riset di iNaturalist).',
    'Sorted by the species most often observed in Indonesia (research-grade iNaturalist observations).',
  ],
  galleryHintWorld: [
    'Diurutkan menurut banyaknya observasi di iNaturalist di seluruh dunia.',
    'Sorted by the number of iNaturalist observations worldwide.',
  ],
  searchHint: [
    'Diurutkan menurut kecocokan nama. Nama Indonesia mengikuti catatan iNaturalist.',
    'Sorted by name match. Indonesian names follow iNaturalist records.',
  ],
  indexHint: [
    'Indeks GBIF menjangkau catatan taksonomi yang lebih luas. Nama umum dan foto tidak selalu tersedia.',
    'The GBIF index reaches a wider set of taxonomic records. Common names and photos are not always available.',
  ],
  allKingdoms: ['Semua kingdom', 'All kingdoms'],
  pageLimit: [
    'Untuk hasil lebih jauh, persempit pencarian atau pilih kelompok lain.',
    'For deeper results, narrow your search or choose another group.',
  ],
  live: ['Data langsung', 'Live data'],
  knowledge: ['Materi & konsep', 'Lessons & concepts'],
  knowledgeHint: [
    'Dari materi, kamus, dan Peta Biologi BioTaxa. Tetap tersedia tanpa internet.',
    'From BioTaxa’s lessons, glossary and Map of Biology. Available offline too.',
  ],
  mentioned: ['Juga dibahas di materi', 'Also discussed in'],
  typeTopic: ['Materi', 'Lesson'],
  typeTerm: ['Istilah', 'Term'],
  typeBranch: ['Cabang biologi', 'Branch of biology'],
  typeLevel: ['Tingkat organisasi', 'Level of organisation'],
});

const TYPE_LABEL = { topic: 'typeTopic', term: 'typeTerm', branch: 'typeBranch', level: 'typeLevel' };

/** Lessons, glossary terms and concepts matching the search words. Never blocks species results. */
async function knowledgeResults(ctx, q) {
  const box = $('#knowledge');
  if (!box || !q) return;
  try {
    const found = await searchKnowledge(q, { limit: 8 });
    if (!ctx.isCurrent()) return;
    const card = x =>
      `<a class="knowledge-card" href="${esc(x.href)}"><span class="knowledge-icon" aria-hidden="true">${x.icon}</span><span><small>${esc(s[TYPE_LABEL[x.type]] || '')}</small><strong>${esc(x.title)}</strong><span class="muted">${esc(x.sub)}</span></span></a>`;
    const draw = mentions =>
      found.length || mentions.length
        ? `<section class="knowledge-results" aria-labelledby="knowledge-title"><h2 id="knowledge-title">${s.knowledge}</h2><p class="muted small">${s.knowledgeHint}</p>${found.length ? `<div class="knowledge-grid">${found.map(card).join('')}</div>` : ''}${mentions.length ? `<p class="mention-line"><strong>${s.mentioned}:</strong> ${mentions.map(m => `<a class="chip" href="${esc(m.href)}"><span aria-hidden="true">${m.icon}</span> ${esc(m.title)}</a>`).join(' ')}</p>` : ''}</section>`
        : '';
    box.innerHTML = draw([]);
    const mentions = await lessonsMentioning(q, {
      exclude: found.filter(x => x.type === 'topic').map(x => x.id),
    }).catch(() => []);
    if (ctx.isCurrent()) box.innerHTML = draw(mentions);
  } catch {
    /* Species search still works without the knowledge index. */
  }
}

export const title = () => s.title;

export async function render(ctx) {
  const { params, main } = ctx;
  const q = (params.get('q') || '').trim().slice(0, 120);
  const page = validPage(params.get('page'), 400);
  const source = params.get('source') === 'index' ? 'index' : 'visual';
  const group = groups.some(g => g.id === params.get('group')) ? params.get('group') : 'all';
  const taxon = /^\d+$/.test(params.get('taxon') || '') ? params.get('taxon') : '';
  const tname = (params.get('tname') || '').slice(0, 120);
  let scope = params.get('scope');
  if (scope === 'id' || scope === 'world') write(KEYS.scope, scope);
  else scope = read(KEYS.scope, 'id') === 'world' ? 'world' : 'id';
  const kingdom = /^\d+$/.test(params.get('kingdom') || '') ? params.get('kingdom') : '';
  const g = groups.find(x => x.id === group);

  const link = (extra = {}) =>
    routeURL('search', { q, source, group, scope, taxon, tname, kingdom, ...extra });
  const pills = groups
    .map(
      x =>
        `<a class="group-pill${x.id === group && !taxon ? ' selected' : ''}" href="${routeURL('search', { q, source, group: x.id, scope, kingdom: source === 'index' ? x.kingdom || '' : '' })}"${x.id === group && !taxon ? ' aria-current="true"' : ''}><span aria-hidden="true">${x.icon}</span>${esc(pick(x.label))}</a>`
    )
    .join('');
  const kingdoms = Object.entries(KINGDOM_KEYS);

  main.innerHTML = `<div class="explore-heading"><div><span class="eyebrow">BIOTAXA / ${s.title.toUpperCase()}</span><h1>${s.heading}</h1><p>${s.intro}</p></div><span class="explore-stamp" aria-hidden="true">${brandImage()}</span></div>
    <form class="search-form" id="search-form" role="search">
      <span class="search-symbol" aria-hidden="true">${icon('search')}</span>
      ${suggestField({ id: 'explore-q', value: q, placeholder: ui.searchPlaceholder, label: ui.search })}
      ${source === 'index' ? `<select name="kingdom" aria-label="${ui.kingdom}"><option value="">${s.allKingdoms}</option>${kingdoms.map(([n, k]) => `<option value="${k}"${String(k) === kingdom ? ' selected' : ''}>${n}</option>`).join('')}</select>` : ''}
      <button class="btn" type="submit">${ui.search}</button>
    </form>
    <div class="explore-workspace"><aside class="explore-sidebar"><h2 class="small-title">${s.groups}</h2><nav class="group-pills" aria-label="${s.groups}">${pills}</nav></aside><div class="explore-content">
    <div class="catalog-tools">
      <div class="segmented" role="group" aria-label="${ui.explore}">
        <a href="${link({ source: 'visual', kingdom: '', page: '' })}" class="${source === 'visual' ? 'selected' : ''}"${source === 'visual' ? ' aria-current="true"' : ''}>▦ ${s.visual}</a>
        <a href="${link({ source: 'index', kingdom: g?.kingdom || '', page: '' })}" class="${source === 'index' ? 'selected' : ''}"${source === 'index' ? ' aria-current="true"' : ''}>☷ ${s.index}</a>
      </div>
      ${source === 'visual' && !q ? `<div class="segmented" role="group" aria-label="${s.scope}"><a href="${link({ scope: 'id', page: '' })}" class="${scope === 'id' ? 'selected' : ''}"${scope === 'id' ? ' aria-current="true"' : ''}>🇮🇩 ${s.indonesia}</a><a href="${link({ scope: 'world', page: '' })}" class="${scope === 'world' ? 'selected' : ''}"${scope === 'world' ? ' aria-current="true"' : ''}>${icon('globe')} ${s.world}</a></div>` : ''}
      <span class="live-label"><i class="live-dot"></i> ${s.live} · ${source === 'visual' ? 'iNaturalist' : 'GBIF'}</span>
    </div>
    ${taxon ? `<div class="filter-chip-row"><span class="filter-chip">${s.browsing}: <strong>${esc(tname || taxon)}</strong> <a href="${link({ taxon: '', tname: '', page: '' })}" aria-label="${s.clear}">×</a></span></div>` : ''}
    <div id="knowledge"></div>
    <div id="matched-groups"></div>
    <div id="results" aria-live="polite">${loading()}</div>
    <p class="catalog-footnote">${source === 'index' ? s.indexHint : q ? s.searchHint : scope === 'id' ? s.galleryHintId : s.galleryHintWorld}</p></div></div>`;

  ctx.on('submit', '#search-form', event => {
    event.preventDefault();
    const data = new FormData(event.target);
    const next = routeURL('search', {
      q: String(data.get('q') || '').trim(),
      source,
      group,
      scope,
      kingdom: data.get('kingdom') || kingdom,
    });
    if (currentURL() === next) ctx.isCurrent() && render(ctx);
    else navigate(next);
  });

  const results = $('#results');
  if (q) knowledgeResults(ctx, q);
  try {
    if (source === 'index') await indexResults(ctx, { q, page, kingdom, results, link });
    else if (q) await searchResults(ctx, { q, taxonId: taxon || g?.taxon || '', results, link });
    else await browseResults(ctx, { scope, page, taxonId: taxon || g?.taxon || '', results, link });
  } catch (error) {
    if (ctx.isCurrent()) results.innerHTML = errorState();
    console.warn('BioTaxa explore failed:', error);
  }
}

async function searchResults(ctx, { q, taxonId, results, link }) {
  const species = await API.autocomplete(q, { rank: 'species', taxonId });
  if (!ctx.isCurrent()) return;
  const list = species.results || [];
  results.innerHTML = `<div class="result-head"><span><strong>${fmt(list.length)}</strong> ${s.matches} · “${esc(q)}”</span></div>${
    list.length
      ? `<div class="discovery-grid">${list.map(t => visualCard(t)).join('')}</div>${species.total_results > list.length ? notice(s.top30) : ''}`
      : `${emptyState(s.noSpecies)}<p class="center"><a class="btn secondary" href="${link({ source: 'index', page: '' })}">${s.tryIndex} →</a></p>`
  }`;
  refresh(results);
  hydratePhotos(ctx, list);
  // Group matches (e.g. “nyamuk” → family Culicidae) help young learners who type a group name.
  const all = await API.autocomplete(q, { taxonId, perPage: 12 }).catch(() => null);
  if (!ctx.isCurrent() || !all) return;
  const higher = (all.results || [])
    .filter(t => !['species', 'subspecies', 'variety', 'form', 'hybrid'].includes(t.rank))
    .slice(0, 8);
  if (!higher.length) return;
  const box = $('#matched-groups');
  box.innerHTML = `<section class="matched-groups" aria-label="${s.matchedGroups}"><h2>${s.matchedGroups}</h2><p class="muted">${s.matchedGroupsHint}</p><div class="chips">${higher
    .map(
      t =>
        `<a class="chip big" href="${routeURL('search', { taxon: t.id, tname: t.preferred_common_name || t.name })}"><span aria-hidden="true">${iconicIcon(t.iconic_taxon_name)}</span><strong>${esc(t.preferred_common_name || t.name)}</strong><em>${esc(t.name)}</em><small>${esc(rankLabel(t.rank))}</small></a>`
    )
    .join('')}</div></section>`;
}

async function browseResults(ctx, { scope, page, taxonId, results, link }) {
  let data;
  let effectiveScope = scope;
  let fellBack = false;
  if (scope === 'id') {
    data = await API.speciesCounts({ placeId: config.indonesiaPlaceId, taxonId, page });
    if (!ctx.isCurrent()) return;
    if (!data.total_results && page === 1) {
      fellBack = true;
      effectiveScope = 'world';
    }
  }
  if (effectiveScope === 'world') {
    data = await API.browseWorld({ taxonId, page });
    if (!ctx.isCurrent()) return;
  }
  const taxa =
    scope === 'id' && !fellBack
      ? (data.results || []).map(r => ({ ...r.taxon, _count: r.count }))
      : data.results || [];
  const total = data.total_results || 0;
  const maxPages = Math.min(400, Math.ceil(total / PAGE_SIZE));
  results.innerHTML = `${fellBack ? notice(s.fallbackWorld) : ''}<div class="result-head"><span><strong>${fmt(total)}</strong> ${effectiveScope === 'id' ? s.speciesIndonesia : s.speciesWorld}</span><span>${ui.page} ${fmt(page)}</span></div>${
    taxa.length
      ? `<div class="discovery-grid">${taxa.map(t => visualCard(t, effectiveScope === 'id' ? { count: t._count, countLabel: 'indonesia' } : {})).join('')}</div>`
      : emptyState()
  }${pagination(page, page < maxPages, p => link({ page: p }), maxPages)}${page >= 400 ? notice(s.pageLimit) : ''}`;
  refresh(results);
  hydratePhotos(ctx, taxa);
}

async function indexResults(ctx, { q, page, kingdom, results, link }) {
  let resolved = q;
  if (q) resolved = await API.resolveCommon(q);
  if (!ctx.isCurrent()) return;
  const data = await API.search(resolved, page, kingdom);
  if (!ctx.isCurrent()) return;
  const total = Math.min(data.count || 0, 100000);
  results.innerHTML = `<div class="result-head"><span><strong>${fmt(data.count || 0)}</strong> ${s.gbifResults}${q ? ` · “${esc(q)}”` : ''}</span><span>${resolved !== q ? `${esc(resolved)} · ` : ''}GBIF Backbone</span></div>${
    data.results?.length
      ? `<div class="taxon-grid">${data.results.map(x => taxonCard(x)).join('')}</div>`
      : emptyState()
  }${pagination(page, !data.endOfRecords && data.results?.length > 0 && page * PAGE_SIZE < total, p => link({ page: p }), Math.ceil(total / PAGE_SIZE))}`;
  refresh(results);
  if (resolved) hydrateIndexPhotos(ctx, resolved);
}

/** Some list results lack licensed photos; fetch full records for those. */
async function hydratePhotos(ctx, items) {
  const missing = items.filter(x => !photosOf(x).length).map(x => x.id);
  if (!missing.length) return;
  const target = $('#results');
  target.dataset.hydrating = 'true';
  try {
    const enriched = await API.inatByIds(missing);
    if (!ctx.isCurrent()) return;
    for (const t of enriched) {
      if (!photosOf(t).length) continue;
      const card = document.querySelector(`[data-taxon="${Number(t.id)}"] .media-frame`);
      if (!card) continue;
      card.classList.remove('no-photo');
      card.innerHTML = `${photoMarkup(photosOf(t)[0], t.preferred_common_name || t.name)}${card.querySelector('.media-badge')?.outerHTML || ''}<span class="image-error-text"></span>`;
    }
    refresh(target);
  } catch {
    /* Honest no-photo states remain usable. */
  } finally {
    if (target.isConnected) target.dataset.hydrating = 'false';
  }
}

async function hydrateIndexPhotos(ctx, query) {
  try {
    const response = await API.autocomplete(query, { rank: 'species' });
    if (!ctx.isCurrent()) return;
    const matches = new Map((response.results || []).map(x => [x.name.toLowerCase(), x]));
    document.querySelectorAll('.taxon-card').forEach(card => {
      const x = matches.get(String(card.dataset.scientific).toLowerCase());
      const photo = photosOf(x)[0];
      if (!photo || card.classList.contains('has-photo')) return;
      const frame = document.createElement('div');
      frame.className = 'media-frame index-photo';
      frame.innerHTML = photoMarkup(photo, x.name);
      card.prepend(frame);
      card.classList.add('has-photo');
    });
    refresh($('#results'));
  } catch {
    /* The GBIF index never depends on the photo provider. */
  }
}
