import { $, esc } from '../core/dom.js';
import { navigate } from '../core/router.js';
import { S, pick, atMost, atLeast, fmt } from '../core/prefs.js';
import { ui, rankLabel } from '../i18n/ui.js';
import { API, scientificName, KINGDOM_KEYS } from '../services/api.js';
import { photosOf, photoMarkup } from '../services/media.js';
import { GROUPS, SHORTCUTS } from '../data/groups.js';
import {
  pageHead,
  crumbs,
  loading,
  emptyState,
  pagination,
  routeURL,
  validPage,
  notice,
} from '../components/common.js';
import { refresh } from '../components/cards.js';
import { icon } from '../components/icons.js';
import { domainCards } from './home.js';

const s = S({
  title: ['Pohon kehidupan', 'Tree of life'],
  heading: ['Setiap cabang punya cerita.', 'Every branch has a story.'],
  sub: [
    'Pilih satu pintu, lalu ikuti cabangnya dari kelompok besar sampai ke satu spesies.',
    'Choose a doorway, then follow its branches from big groups down to one species.',
  ],
  note: [
    'Domain adalah lapisan panduan Biotaloka. Cabang berikutnya mengikuti GBIF Backbone; tingkatan yang tidak tercatat tidak dibuat-buat. Ini klasifikasi, bukan pohon filogenetik berskala waktu.',
    'Domains are Biotaloka’s learning layer. Deeper branches follow the GBIF Backbone; missing ranks are not invented. This is a classification, not a time-scaled phylogeny.',
  ],
  children: ['Kelompok di dalamnya', 'Groups inside'],
  childSpecies: ['Spesies di dalamnya', 'Species inside'],
  noChildren: [
    'Tidak ada turunan yang tercatat pada sumber ini.',
    'No children are recorded in this source.',
  ],
  others: ['Tampilkan {n} kelompok lainnya', 'Show {n} more groups'],
  othersHint: [
    'Termasuk kelompok fosil dan kelompok yang posisinya belum pasti di katalog.',
    'Includes fossil groups and groups whose placement is still uncertain in the catalogue.',
  ],
  hideOthers: ['Sembunyikan kelompok lainnya', 'Hide other groups'],
  shortcuts: ['Pintasan populer', 'Popular shortcuts'],
  photos: ['Lihat foto anggotanya', 'See photos of its members'],
  youAreHere: ['Kamu di sini', 'You are here'],
  ladder: ['Tangga klasifikasi', 'Classification ladder'],
  kingdoms: ['Kingdom di dalam domain ini', 'Kingdoms in this domain'],
  rank: {
    KINGDOM: [
      'Kelompok besar makhluk hidup. Pembagian kingdom bisa berbeda antarsistem klasifikasi.',
      'A broad group of organisms. Kingdom divisions differ between systems.',
    ],
    PHYLUM: [
      'Garis keturunan besar dengan rancangan tubuh dasar yang sama.',
      'A major lineage sharing a basic body plan.',
    ],
    CLASS: [
      'Kelompok di bawah filum. Bandingkan ciri utama anggotanya.',
      'A group within a phylum. Compare its members’ key features.',
    ],
    ORDER: [
      'Kelompok di bawah kelas, yang terbagi lagi menjadi famili.',
      'A group within a class, divided into families.',
    ],
    FAMILY: ['Kumpulan genus yang berkerabat.', 'A set of related genera.'],
    GENUS: [
      'Bagian pertama nama ilmiah. Berisi satu atau lebih spesies.',
      'The first part of a scientific name. It holds one or more species.',
    ],
  },
});

export const title = () => s.title;

const DOMAINS = { Eukarya: [1, 6, 5, 4, 7], Bacteria: [3], Archaea: [2] };
const KINGDOM_NAMES = Object.fromEntries(Object.entries(KINGDOM_KEYS).map(([n, k]) => [k, n]));
const RANK_ORDER = ['DOMAIN', 'KINGDOM', 'PHYLUM', 'CLASS', 'ORDER', 'FAMILY', 'GENUS', 'SPECIES'];
const rankIndex = r => {
  const i = RANK_ORDER.indexOf(r);
  return i < 0 ? 99 : i;
};
const domainOf = x =>
  Number(x.kingdomKey) === 2
    ? 'Archaea'
    : Number(x.kingdomKey) === 3
      ? 'Bacteria'
      : [1, 4, 5, 6, 7].includes(Number(x.kingdomKey))
        ? 'Eukarya'
        : null;
const friendlyFirst = () => atMost('smp');

function ladder(current) {
  const index = rankIndex(current);
  return `<ol class="rank-ladder" aria-label="${s.ladder}">${RANK_ORDER.map(
    (r, i) =>
      `<li class="${i < index ? 'done' : i === index ? 'here' : ''}"${i === index ? ' aria-current="step"' : ''}><span>${esc(rankLabel(r))}</span>${i === index ? `<small>${s.youAreHere}</small>` : ''}</li>`
  ).join('')}</ol>`;
}

function childCard(x) {
  const name = scientificName(x);
  const info = GROUPS[name];
  const species = ['SPECIES', 'SUBSPECIES'].includes(x.rank);
  const href = species ? `/species/${Number(x.key)}` : `/tree/${Number(x.key)}`;
  const local = info ? pick(info.name) : '';
  const titleText = local && friendlyFirst() ? local : name;
  const second = local && friendlyFirst() ? name : local;
  return `<a class="card taxon-card group-card${info ? ' curated' : ''}" data-scientific="${esc(name)}" href="${href}">
    <div class="group-card-top">${info ? `<span class="group-icon" aria-hidden="true">${info.icon}</span>` : ''}<span class="badge">${esc(rankLabel(x.rank))}</span>${x.extinct ? ` <span class="badge muted-badge">†</span>` : ''}</div>
    <h3 class="${titleText === name ? 'sci' : ''}">${esc(titleText)}</h3>${second ? `<p class="${second === name ? 'latin' : 'card-sub strong'}">${esc(second)}</p>` : ''}
    ${info ? `<p class="card-sub">${esc(pick(info.desc))}</p>` : x.vernacularName && atLeast('sma') ? `<p class="card-sub">${esc(x.vernacularName)}</p>` : ''}
    <div class="card-link"><span>${esc(species ? ui.species : ui.open)}</span>${icon('arrow')}</div></a>`;
}

function kingdomCard(key) {
  const name = KINGDOM_NAMES[key];
  return childCard({ key, canonicalName: name, scientificName: name, rank: 'KINGDOM' });
}

export async function render(ctx) {
  const { id, params, main } = ctx;
  if (!id) {
    main.innerHTML = pageHead(s.heading, s.sub, 'BIOTALOKA / ATLAS') + domainCards() + notice(s.note);
    return;
  }
  if (DOMAINS[id]) {
    main.innerHTML =
      crumbs([{ name: id, url: `/tree/${id}` }]) +
      pageHead(
        id,
        pick(
          {
            Eukarya: ['Sel dengan inti sejati.', 'Cells with a true nucleus.'],
            Bacteria: [
              'Bersel satu tanpa inti bermembran.',
              'Single cells without a membrane-bound nucleus.',
            ],
            Archaea: [
              'Bersel satu tanpa inti, berbeda dari bakteri.',
              'Single cells without a nucleus, distinct from bacteria.',
            ],
          }[id]
        ),
        ui.domain.toUpperCase()
      ) +
      ladder('DOMAIN') +
      `<h2 class="list-title">${s.kingdoms}</h2><div class="taxon-grid">${DOMAINS[id].map(kingdomCard).join('')}</div>` +
      notice(s.note);
    return;
  }
  if (!/^\d+$/.test(id)) {
    navigate('/tree', { replace: true });
    return;
  }
  const page = validPage(params.get('page'), 1000);
  main.innerHTML = crumbs() + loading();
  const [node, parents, children] = await Promise.all([
    API.taxon(id),
    API.parents(id),
    API.children(id, page, 100),
  ]);
  if (!ctx.isCurrent()) return;
  if (['SPECIES', 'SUBSPECIES'].includes(node.rank)) {
    navigate(`/species/${node.key}`, { replace: true });
    return;
  }
  const name = scientificName(node);
  const info = GROUPS[name];
  const domain = domainOf(node);
  const path = [
    ...(domain ? [{ name: domain, url: `/tree/${domain}` }] : []),
    ...parents.map(p => ({
      name:
        pick(GROUPS[scientificName(p)]?.name) && friendlyFirst()
          ? pick(GROUPS[scientificName(p)].name)
          : scientificName(p),
      url: `/tree/${p.key}`,
    })),
    { name: info && friendlyFirst() ? pick(info.name) : name, url: `/tree/${node.key}` },
  ];
  const heading = info && friendlyFirst() ? pick(info.name) : name;
  const subtitle = [
    info && friendlyFirst() ? name : info ? pick(info.name) : '',
    info ? pick(info.desc) : pick(s.rank[node.rank] ? s.rank[node.rank] : ''),
  ]
    .filter(Boolean)
    .join(' — ');

  const list = [...(children.results || [])].filter(c => c.taxonomicStatus !== 'DOUBTFUL' || atLeast('sma'));
  list.sort(
    (a, b) =>
      (GROUPS[scientificName(b)]?.p || 0) - (GROUPS[scientificName(a)]?.p || 0) ||
      rankIndex(a.rank) - rankIndex(b.rank) ||
      scientificName(a).localeCompare(scientificName(b))
  );
  const curated = list.filter(c => GROUPS[scientificName(c)]);
  const hideOthers = friendlyFirst() && curated.length > 0 && params.get('all') !== '1';
  const primary = hideOthers ? curated : list;
  const others = hideOthers ? list.filter(c => !GROUPS[scientificName(c)]) : [];
  const allSpecies = list.length && list.every(c => ['SPECIES', 'SUBSPECIES'].includes(c.rank));
  const shortcuts = SHORTCUTS[name] || [];

  main.innerHTML = `${crumbs(path)}${pageHead(heading, subtitle, rankLabel(node.rank).toUpperCase())}
    <div class="tree-workspace"><aside class="tree-position">${ladder(node.rank)}</aside><div class="tree-children">
    <div class="actions"><a class="btn secondary" id="group-photos" href="${routeURL('search', { q: name })}">${icon('camera')} ${s.photos}</a></div>
    ${shortcuts.length ? `<section class="shortcuts"><h2 class="list-title">${s.shortcuts}</h2><div class="chips">${shortcuts.map(x => `<a class="chip big" href="${routeURL('search', { taxon: x.inat, tname: pick(x.name) })}"><span aria-hidden="true">${x.icon}</span><strong>${esc(pick(x.name))}</strong><small>${esc(pick(x.note))}</small></a>`).join('')}</div></section>` : ''}
    <h2 class="list-title">${allSpecies ? s.childSpecies : s.children}${children.results?.length ? ` <small>(${fmt(list.length)}${children.endOfRecords ? '' : '+'})</small>` : ''}</h2>
    ${primary.length ? `<div class="taxon-grid">${primary.map(childCard).join('')}</div>` : emptyState(s.noChildren, '')}
    ${others.length ? `<details class="more-groups"><summary>${s.others.replace('{n}', fmt(others.length))}</summary><p class="muted">${s.othersHint}</p><div class="taxon-grid">${others.map(childCard).join('')}</div></details>` : ''}
    ${pagination(page, !children.endOfRecords && children.results?.length > 0, p => routeURL(`tree/${id}`, { page: p }))}
    ${notice(s.note)}</div></div>`;
  refresh(main);
  hydrate(ctx, name);
}

/** Photos and iNaturalist links for child groups, matched by identical scientific names. */
async function hydrate(ctx, name) {
  try {
    const parent = await API.inatByName(name);
    if (!ctx.isCurrent() || !parent) return;
    const photosLink = $('#group-photos');
    if (photosLink)
      photosLink.href = routeURL('search', { taxon: parent.id, tname: parent.preferred_common_name || name });
    const kids = await API.inatChildren(parent.id);
    if (!ctx.isCurrent()) return;
    const byName = new Map(kids.map(k => [k.name.toLowerCase(), k]));
    document.querySelectorAll('.group-card').forEach(card => {
      const match = byName.get(String(card.dataset.scientific).toLowerCase());
      const photo = photosOf(match)[0];
      if (!match) return;
      if (
        !card.querySelector('.card-sub') &&
        match.preferred_common_name &&
        match.preferred_common_name.toLowerCase() !== match.name.toLowerCase()
      ) {
        card
          .querySelector('h3')
          ?.insertAdjacentHTML(
            'afterend',
            `<p class="card-sub strong">${esc(match.preferred_common_name)}</p>`
          );
      }
      if (photo && !card.classList.contains('has-photo')) {
        const frame = document.createElement('div');
        frame.className = 'media-frame index-photo';
        frame.innerHTML = photoMarkup(photo, match.preferred_common_name || match.name);
        card.prepend(frame);
        card.classList.add('has-photo');
      }
    });
    refresh($('#main'));
  } catch {
    /* Tree navigation never depends on photos. */
  }
}
