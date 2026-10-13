// Prerenders every public page into dist/ as static HTML so that search engines (and readers without
// JavaScript) see real content: dist/species/inat-41967.html is served at /species/inat-41967 by
// Cloudflare Pages. Each file is the app shell (dist/index.html) with page-specific metadata and the
// <main> element filled with readable text and crawlable links. When the app boots it renders the
// same route over that content. Only files in the repository are read; nothing is fetched.
//   import { prerender } from './prerender.mjs';  →  { pages, urls: [{ loc, lastmod }] }
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const load = path => import(new URL(path, new URL('..', import.meta.url)).href);

const { SPECIES, GROUPS, DIETS, HABITATS } = await load('js/data/species.js');
const { GROUPS: TAXON_GROUPS } = await load('js/data/groups.js');
const { TOPICS, FIELDS, loadTopics } = await load('js/data/topics/index.js');
const { glossary } = await load('js/data/glossary.js');
const { PREHISTORIC, PERIODS } = await load('js/data/prehistoric.js');
const { ORGANIZATION, BRANCHES } = await load('js/data/biomap.js');
const { featured } = await load('js/data/featured.js');
const { snapshotEntry } = await load('js/services/snapshot.js');

const SITE_NAME = 'Biotaloka';
const DEFAULT_IMAGE = '/assets/brand/og-image.jpg';
const INDONESIA_PLACE = 6966;
const KINGDOMS = {
  1: 'Animalia',
  2: 'Archaea',
  3: 'Bacteria',
  4: 'Chromista',
  5: 'Fungi',
  6: 'Plantae',
  7: 'Protozoa',
};
const DOMAINS = { Eukarya: [1, 6, 5, 4, 7], Bacteria: [3], Archaea: [2] };
const DOMAIN_TEXT = {
  Eukarya: 'Makhluk hidup yang selnya memiliki inti sejati: hewan, tumbuhan, jamur, dan protista.',
  Bacteria: 'Makhluk bersel satu tanpa inti bermembran. Hidup di mana-mana, dari tanah sampai tubuh kita.',
  Archaea: 'Makhluk bersel satu tanpa inti yang berbeda dari bakteri; banyak hidup di lingkungan ekstrem.',
};
const RANKS = {
  DOMAIN: 'Domain',
  KINGDOM: 'Kerajaan',
  PHYLUM: 'Filum',
  CLASS: 'Kelas',
  ORDER: 'Ordo',
  FAMILY: 'Famili',
  GENUS: 'Genus',
  SPECIES: 'Spesies',
};
const IUCN = {
  LC: 'Risiko rendah (LC)',
  NT: 'Hampir terancam (NT)',
  VU: 'Rentan (VU)',
  EN: 'Terancam (EN)',
  CR: 'Kritis (CR)',
  EW: 'Punah di alam liar (EW)',
  EX: 'Punah (EX)',
  DD: 'Data kurang (DD)',
};
const LEVELS = [
  ['sd', 'SD'],
  ['smp', 'SMP'],
  ['sma', 'SMA'],
  ['kuliah', 'kuliah'],
];
const LABS = [
  [
    'photosynthesis',
    'Fotosintesis',
    'Ubah cahaya dan karbon dioksida, amati gelembung oksigen yang dihasilkan.',
  ],
  ['food', 'Aliran energi', 'Ikuti energi dari produsen ke konsumen dalam rantai makanan.'],
  ['osmosis', 'Osmosis', 'Lihat air berpindah menembus membran saat konsentrasi larutan berubah.'],
  ['enzyme', 'Kerja enzim', 'Uji pengaruh suhu dan pH pada kecepatan kerja enzim.'],
  ['mendel', 'Pewarisan sifat', 'Silangkan kacang ercis dan hitung perbandingan keturunannya.'],
  ['genetic', 'Kode genetik', 'Ubah urutan DNA dan baca protein yang terbentuk.'],
  ['selection', 'Seleksi alam', 'Amati populasi berubah warna ketika lingkungannya berubah.'],
  ['scale', 'Skala kehidupan', 'Bandingkan ukuran dari molekul sampai paus biru.'],
  ['lever', 'Tuas & capit', 'Pelajari prinsip tuas pada rangka dan capit hewan.'],
];
const SECTIONS = [
  ['/search', 'Jelajahi kehidupan', 'Cari spesies dari seluruh dunia dengan data GBIF dan iNaturalist.'],
  ['/tree', 'Pohon kehidupan', 'Telusuri kekerabatan dari domain sampai spesies.'],
  ['/learn', 'Belajar', `${TOPICS.length} materi biologi untuk SD, SMP, SMA, dan kuliah.`],
  ['/kamus', 'Kamus istilah', `${glossary.length} istilah biologi dengan penjelasan sederhana.`],
  ['/quiz', 'Kuis', 'Uji pemahaman dan kumpulkan lencana.'],
  ['/lab', 'Laboratorium virtual', 'Simulasi untuk mencoba hipotesis dan membaca bukti.'],
  ['/peta', 'Peta Biologi', 'Tingkat organisasi kehidupan dan cabang-cabang ilmu biologi.'],
  ['/purba', 'Kehidupan purba', 'Fosil dan makhluk yang pernah hidup di bumi.'],
  ['/compare', 'Bandingkan', 'Seberapa dekat kekerabatan dua makhluk hidup?'],
  ['/nearby', 'Di sekitarku', 'Makhluk hidup yang pernah diamati di dekat lokasimu.'],
  ['/guru', 'Ruang guru', 'Bahan ajar, lembar kerja, dan tugas untuk kelas.'],
  ['/about', 'Sumber & metode', 'Dari mana data Biotaloka berasal dan bagaimana kami memilihnya.'],
];

/* ---------- Helpers ---------- */
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ESCAPES[c]);
const id = pair => (Array.isArray(pair) ? pair[0] : pair || '');
const en = pair => (Array.isArray(pair) ? pair[1] : '');
const stripTags = html =>
  String(html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
/** Meta descriptions: one plain sentence or two, at most ~160 characters. */
function summary(text, max = 160) {
  const plain = stripTags(
    String(text || '').replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_, k, l) => l || k)
  )
    .replace(/\*\*?/g, '')
    .replace(/^- /gm, '');
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 80))}…`;
}
const termURL = key => `/kamus#istilah-${esc(key.trim().toLowerCase().replace(/\s+/g, '-'))}`;
function inline(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(
      /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g,
      (_, key, label) => `<a href="${termURL(key)}">${label || key}</a>`
    );
}
/** The curated-text markup (paragraphs, "- " bullets, **bold**, [[term]]) as plain HTML. */
function rich(text) {
  return String(text || '')
    .trim()
    .split(/\n{2,}/)
    .map(block => {
      const lines = block.split('\n');
      const out = [];
      let para = [];
      let list = [];
      const flush = () => {
        if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
        if (list.length) out.push(`<ul>${list.map(l => `<li>${inline(l)}</li>`).join('')}</ul>`);
        para = [];
        list = [];
      };
      for (const line of lines) {
        const bullet = line.match(/^\s*(?:-|\d+[.)])\s+(.*)$/);
        if (bullet) {
          if (para.length) flush();
          list.push(bullet[1]);
        } else {
          if (list.length) flush();
          para.push(line.trim());
        }
      }
      flush();
      return out.join('');
    })
    .join('');
}
const link = (href, label) => `<a href="${esc(href)}">${esc(label)}</a>`;
const list = items => `<ul>${items.map(x => `<li>${x}</li>`).join('')}</ul>`;
const dl = rows =>
  `<dl class="facts">${rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`)
    .join('')}</dl>`;
const head = (eyebrow, title, sub = '') =>
  `<header class="page-head"><span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(title)}</h1>${sub ? `<p>${sub}</p>` : ''}</header>`;
const section = (title, html, attrs = '') =>
  html ? `<section class="section"${attrs}><h2>${esc(title)}</h2>${html}</section>` : '';
const crumbs = items =>
  `<nav class="breadcrumbs" aria-label="Jejak halaman">${[['/', 'Beranda'], ...items]
    .map(([href, label], i) => `${i ? '<span aria-hidden="true">›</span>' : ''}${link(href, label)}`)
    .join('')}</nav>`;
const explore = () =>
  `<nav class="section" aria-label="Bagian Biotaloka"><h2>Jelajahi Biotaloka</h2>${list(
    SECTIONS.map(([href, label]) => link(href, label))
  )}</nav>`;
const speciesURL = s => `/species/${s.id}`;
const speciesLink = s => link(speciesURL(s), `${id(s.name)} (${s.sci})`);
const topicLink = t => link(`/learn/${t.id}`, id(t.title));

/* ---------- Snapshot (recorded API responses, no network) ---------- */
const snapshotDir = join(root, 'data', 'snapshot');
async function recorded(url) {
  const entry = snapshotEntry(url);
  const file = join(snapshotDir, `${entry.key}.json`);
  if (!existsSync(file)) return null;
  try {
    const data = JSON.parse(await readFile(file, 'utf8'));
    return data.u === entry.href ? data.d : null;
  } catch {
    return null;
  }
}
const inatTaxon = async inat =>
  inat
    ? (
        await recorded(
          `https://api.inaturalist.org/v1/taxa/${inat}?locale=id&preferred_place_id=${INDONESIA_PLACE}&all_names=true`
        )
      )?.results?.[0] || null
    : null;
const gbifTaxon = async key => (key ? recorded(`https://api.gbif.org/v1/species/${key}?`) : null);
const gbifParents = async key => (await recorded(`https://api.gbif.org/v1/species/${key}/parents?`)) || null;

/* ---------- Last-modified dates for the sitemap ---------- */
const dates = new Map();
async function modified(file) {
  if (dates.has(file)) return dates.get(file);
  let date = '';
  try {
    date = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    /* not a git checkout */
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    try {
      date = (await stat(join(root, file))).mtime.toISOString().slice(0, 10);
    } catch {
      date = new Date().toISOString().slice(0, 10);
    }
  }
  dates.set(file, date);
  return date;
}
const latest = async files => (await Promise.all(files.map(modified))).sort().at(-1);

/* ---------- Pages ---------- */
const bySci = new Map(SPECIES.map(s => [s.sci.toLowerCase(), s]));
/** Species card id → GBIF kingdom key, filled from the snapshot before pages are built. */
const byKingdom = new Map();
const byGroup = g => SPECIES.filter(s => s.g === g);
const topicsFor = (topics, sci) =>
  topics.filter(t => (t.species || []).some(x => x.toLowerCase() === sci.toLowerCase()));

function homePage(topics) {
  const groups = Object.entries(GROUPS)
    .map(([key, g]) => ({ key, g, members: byGroup(key) }))
    .filter(x => x.members.length);
  const body = `${head('BIOTALOKA · ASADIN EDU', 'Atlas kehidupan untuk SD sampai kuliah', 'Biotaloka adalah ensiklopedia biologi terbuka dan gratis dalam bahasa Indonesia dan Inggris. Jelajahi spesies, pohon kehidupan, materi pelajaran per jenjang, kuis, laboratorium virtual, dan alat bantu untuk guru. Datanya berasal dari GBIF, iNaturalist, Wikipedia, dan Paleobiology Database.')}
    ${section('Mulai dari sini', list(SECTIONS.map(([href, label, text]) => `${link(href, label)} — ${esc(text)}`)))}
    ${section(
      'Spesies pilihan',
      `<ul class="portrait-list">${featured
        .map(
          f =>
            `<li><a href="${esc(`/species/${f.id}`)}"><img src="${esc(f.image)}" alt="${esc(id(f.name))}" width="${f.width}" height="${f.height}" loading="lazy"> ${esc(id(f.name))} <em>(${esc(f.sci)})</em></a><br><small>${esc(f.credit)}</small></li>`
        )
        .join('')}</ul>`
    )}
    ${section(
      `${SPECIES.length} kartu spesies`,
      `<p>Setiap kartu menjelaskan ciri, makanan, tempat hidup, dan fakta menarik dalam bahasa yang sederhana, lalu menautkannya ke data ilmiah terbaru.</p>${groups
        .map(({ g, members }) => `<h3>${esc(id(g.name))}</h3>${list(members.map(speciesLink))}`)
        .join('')}`
    )}
    ${section(
      `${TOPICS.length} materi biologi`,
      FIELDS.map(f => {
        const inField = topics.filter(t => t.field === f.id);
        return inField.length
          ? `<h3>${esc(id(f.name))}</h3><p>${esc(id(f.desc))}</p>${list(inField.map(t => `${topicLink(t)} — ${esc(id(t.summary))}`))}`
          : '';
      }).join('')
    )}
    ${section('Kehidupan purba', `<p>${esc(PREHISTORIC.length)} makhluk purba dari stromatolit sampai mamalia zaman es, diurutkan pada garis waktu geologi.</p><p>${link('/purba', 'Buka garis waktu kehidupan purba')}</p>`)}`;
  return {
    route: '/',
    page: 'home',
    title: 'Biotaloka · Atlas Kehidupan untuk SD sampai Kuliah',
    description:
      'Biotaloka: atlas kehidupan terbuka dan gratis dalam bahasa Indonesia dan Inggris. Jelajahi spesies, pohon kehidupan, materi biologi per jenjang, kuis, laboratorium virtual, dan alat untuk guru.',
    body,
    files: ['js/data/species.js', 'js/data/topics/index.js', 'js/data/featured.js', 'index.html'],
    jsonLd: [
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        inLanguage: 'id',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: '{site}/search?q={search_term_string}' },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

async function speciesPage(sp, topics, treeKeys) {
  const [inat, gbif] = await Promise.all([inatTaxon(sp.inat), gbifTaxon(sp.gbif)]);
  const name = id(sp.name);
  const group = GROUPS[sp.g];
  const diet = DIETS[sp.diet];
  const habitats = (sp.hab || []).map(h => id(HABITATS[h])).filter(Boolean);
  const status = inat?.conservation_status?.status?.toUpperCase();
  const photo = sp.photo?.url
    ? `<figure class="media-frame"><img src="${esc(sp.photo.url)}" alt="${esc(name)} (${esc(sp.sci)})" loading="lazy" width="500" height="375"><figcaption class="photo-credit">${esc(sp.photo.attribution || sp.photo.license || '')}</figcaption></figure>`
    : '';
  const ranks = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus'];
  const taxonomy = gbif
    ? ranks
        .filter(r => gbif[r])
        .map(r => {
          const key = gbif[`${r}Key`];
          const label = `${RANKS[r.toUpperCase()]}: ${gbif[r]}`;
          return key && treeKeys.has(Number(key)) ? link(`/tree/${key}`, label) : esc(label);
        })
    : (inat?.ancestors || [])
        .filter(a => ranks.includes(a.rank))
        .map(a => esc(`${RANKS[a.rank.toUpperCase()]}: ${a.name}`));
  const wiki = stripTags(inat?.wikipedia_summary);
  const related = topicsFor(topics, sp.sci);
  const siblings = byGroup(sp.g)
    .filter(s => s !== sp)
    .slice(0, 8);
  const body = `${crumbs([
    ['/search', 'Jelajahi'],
    ...(group ? [[`/search?q=${encodeURIComponent(id(group.name))}`, id(group.name)]] : []),
    [speciesURL(sp), name],
  ])}
    ${head(`SPESIES · ${id(group?.name) || 'MAKHLUK HIDUP'}`, name, `<em class="latin">${esc(sp.sci)}</em>${en(sp.name) ? ` · ${esc(en(sp.name))}` : ''}`)}
    ${photo}
    ${section('Tentang', rich(id(sp.about)))}
    ${section(
      'Fakta singkat',
      dl([
        ['Nama ilmiah', `<em>${esc(sp.sci)}</em>`],
        ['Nama Inggris', esc(en(sp.name))],
        ['Kelompok', group ? esc(id(group.name)) : ''],
        ['Makanan', diet ? esc(id(diet.name)) : ''],
        ['Habitat', esc(habitats.join(', '))],
        ['Ukuran', sp.size ? esc(id(sp.size)) : ''],
        ['Umur', sp.life ? esc(id(sp.life)) : ''],
        ['Persebaran', sp.end ? 'Endemik: hanya ditemukan di Indonesia' : ''],
        ['Status IUCN', status && IUCN[status] ? esc(IUCN[status]) : ''],
        [
          'Pengamatan di iNaturalist',
          inat?.observations_count ? esc(new Intl.NumberFormat('id-ID').format(inat.observations_count)) : '',
        ],
      ])
    )}
    ${section('Apa yang dimakan?', rich(id(sp.food)))}
    ${section('Di mana hidupnya?', rich(id(sp.home)))}
    ${section('Tahukah kamu?', rich(id(sp.fun)))}
    ${taxonomy.length ? section('Klasifikasi', `<ol class="taxonomy">${taxonomy.map(t => `<li>${t}</li>`).join('')}<li>${esc(`Spesies: ${sp.sci}`)}</li></ol><p>${link('/tree', 'Lihat pohon kehidupan')}</p>`) : ''}
    ${wiki ? section('Ringkasan Wikipedia', `<p>${esc(wiki)}</p><p class="muted small">Sumber: ${inat?.wikipedia_url ? `<a href="${esc(inat.wikipedia_url)}" rel="noopener noreferrer">Wikipedia</a>` : 'Wikipedia'} (CC BY-SA 4.0).</p>`) : ''}
    ${related.length ? section('Materi terkait', list(related.map(topicLink))) : ''}
    ${siblings.length ? section(`Spesies lain: ${id(group.name)}`, list(siblings.map(speciesLink))) : ''}
    ${section('Sumber data', `<p>Teks kartu ditulis tim Biotaloka (CC BY-SA 4.0). Taksonomi dari GBIF Backbone Taxonomy${sp.gbif ? ` (<a href="https://www.gbif.org/species/${esc(sp.gbif)}" rel="noopener noreferrer">GBIF ${esc(sp.gbif)}</a>)` : ''}; foto, nama umum, dan status konservasi dari iNaturalist${sp.inat ? ` (<a href="https://www.inaturalist.org/taxa/${esc(sp.inat)}" rel="noopener noreferrer">taksa ${esc(sp.inat)}</a>)` : ''}.</p>`)}
    ${explore()}`;
  const taxon = {
    '@type': 'Taxon',
    name,
    scientificName: sp.sci,
    alternateName: [en(sp.name)].filter(Boolean),
    taxonRank: 'species',
    ...(gbif?.genus ? { parentTaxon: { '@type': 'Taxon', name: gbif.genus, taxonRank: 'genus' } } : {}),
    ...(sp.photo?.url ? { image: sp.photo.url } : {}),
    ...(sp.gbif ? { sameAs: [`https://www.gbif.org/species/${sp.gbif}`] } : {}),
  };
  return {
    route: speciesURL(sp),
    page: 'species',
    title: `${name} (${sp.sci}) · Spesies`,
    description: summary(`${name} (${sp.sci}): ${id(sp.about)}`),
    image: sp.photo?.url,
    body,
    files: ['js/data/species.js'],
    jsonLd: [taxon],
  };
}

function learnIndex(topics) {
  const body = `${crumbs([['/learn', 'Belajar']])}
    ${head('BIOTALOKA / LEARN', 'Belajar dengan caramu.', `${esc(String(TOPICS.length))} materi biologi, masing-masing ditulis dalam empat lapisan kedalaman: SD, SMP, SMA, dan kuliah. Setiap materi punya poin kunci, aktivitas, kuis, spesies contoh, dan catatan untuk guru.`)}
    ${FIELDS.map(f => {
      const inField = topics.filter(t => t.field === f.id);
      return inField.length
        ? section(
            `${f.icon} ${id(f.name)}`,
            `<p>${esc(id(f.desc))}</p>${list(inField.map(t => `${topicLink(t)} — ${esc(id(t.summary))}`))}`,
            ` id="bidang-${esc(f.id)}"`
          )
        : '';
    }).join('')}
    ${section('Lanjutkan dengan', list([link('/quiz', 'Kuis per materi'), link('/lab', 'Laboratorium virtual'), link('/peta', 'Peta Biologi'), link('/kamus', 'Kamus istilah'), link('/guru', 'Ruang guru')]))}`;
  return {
    route: '/learn',
    page: 'learn',
    title: 'Belajar biologi: materi SD, SMP, SMA, dan kuliah',
    description: `${TOPICS.length} materi biologi dalam bahasa Indonesia, dari ciri makhluk hidup sampai bioinformatika, dengan poin kunci, kuis, dan spesies contoh.`,
    body,
    files: ['js/data/topics/index.js'],
  };
}

function topicPage(t, topics) {
  const field = FIELDS.find(f => f.id === t.field);
  const examples = (t.species || []).map(sci => bySci.get(sci.toLowerCase())).filter(Boolean);
  const related = (t.related || []).map(r => topics.find(x => x.id === r)).filter(Boolean);
  const lab = LABS.find(([labId]) => labId === t.lab);
  const body = `${crumbs([
    ['/learn', 'Belajar'],
    ...(field ? [[`/learn#bidang-${field.id}`, id(field.name)]] : []),
    [`/learn/${t.id}`, id(t.title)],
  ])}
    ${head(`MATERI · ${id(field?.name) || 'BIOLOGI'}`, id(t.title), esc(id(t.summary)))}
    <p class="muted small">Jenjang yang disarankan: ${esc((t.levels || []).map(l => LEVELS.find(([k]) => k === l)?.[1] || l).join(', '))}.</p>
    ${LEVELS.map(([lv, label]) =>
      t.body?.[lv]
        ? section(
            `Penjelasan untuk ${label}`,
            `${rich(id(t.body[lv]))}${t.key?.[lv] ? `<h3>Poin kunci</h3>${rich(id(t.key[lv]))}` : ''}${t.activity?.[lv] ? `<h3>Aktivitas</h3><p>${esc(id(t.activity[lv]))}</p>` : ''}`,
            ` id="jenjang-${lv}"`
          )
        : ''
    ).join('')}
    ${examples.length ? section('Spesies contoh', list(examples.map(speciesLink))) : ''}
    ${related.length ? section('Materi terkait', list(related.map(topicLink))) : ''}
    ${section(
      'Berlatih',
      list([
        link(`/quiz/${t.id}`, `Kuis: ${id(t.title)}`),
        ...(lab ? [link(`/lab/${lab[0]}`, `Laboratorium: ${lab[1]}`)] : []),
        link('/kamus', 'Kamus istilah biologi'),
      ])
    )}
    ${
      t.read?.length
        ? section(
            'Bacaan lanjutan',
            list(t.read.map(r => `<a href="${esc(r.url)}" rel="noopener noreferrer">${esc(r.label)}</a>`))
          )
        : ''
    }
    ${explore()}`;
  return {
    route: `/learn/${t.id}`,
    page: 'learn',
    title: `${id(t.title)} · Materi biologi`,
    description: summary(id(t.summary)),
    body,
    files: [`js/data/topics/${t.id}.js`, 'js/data/topics/index.js'],
    jsonLd: [
      {
        '@type': 'Article',
        headline: id(t.title),
        description: id(t.summary),
        inLanguage: 'id',
        author: { '@type': 'Organization', name: 'Biotaloka · Asadin Edu' },
        license: 'https://creativecommons.org/licenses/by-sa/4.0/',
        educationalLevel: (t.levels || []).join(', '),
      },
    ],
  };
}

function glossaryPage() {
  const sorted = [...glossary].sort((a, b) => id(a.term).localeCompare(id(b.term), 'id'));
  const letters = [...new Set(sorted.map(g => id(g.term)[0].toUpperCase()))];
  const body = `${crumbs([['/kamus', 'Kamus istilah']])}
    ${head('BIOTALOKA / KAMUS', 'Kamus istilah biologi', `${esc(String(glossary.length))} istilah dengan definisi sederhana untuk semua jenjang dan penjelasan lanjutan untuk SMA dan kuliah.`)}
    ${letters
      .map(
        l =>
          `<section class="letter-group" id="letter-${esc(l)}"><h2>${esc(l)}</h2>${sorted
            .filter(g => id(g.term)[0].toUpperCase() === l)
            .map(
              g =>
                `<article class="term-entry" id="istilah-${esc(g.id.replace(/\s+/g, '-'))}"><h3>${esc(id(g.term))}${en(g.term) ? ` <small class="muted">· ${esc(en(g.term))}</small>` : ''}</h3><p>${esc(id(g.def))}</p>${g.adv ? `<p class="muted">${esc(id(g.adv))}</p>` : ''}${g.topic && TOPICS.some(t => t.id === g.topic) ? `<p class="small">${link(`/learn/${g.topic}`, `Materi: ${id(TOPICS.find(t => t.id === g.topic).title)}`)}</p>` : ''}</article>`
            )
            .join('')}</section>`
      )
      .join('')}
    ${explore()}`;
  return {
    route: '/kamus',
    page: 'kamus',
    title: 'Kamus istilah biologi',
    description: `${glossary.length} istilah biologi dari adaptasi sampai zigot, dijelaskan dengan bahasa sederhana dan ditautkan ke materi pelajaran.`,
    body,
    files: ['js/data/glossary.js'],
  };
}

function prehistoricPage() {
  const age = range => {
    if (!Array.isArray(range)) return 'punah pada masa modern';
    const [from, to] = range;
    return to === 0 ? `${from} juta tahun lalu sampai sekarang` : `${from}–${to} juta tahun lalu`;
  };
  const body = `${crumbs([['/purba', 'Kehidupan purba']])}
    ${head('BIOTALOKA / PURBA', 'Menjelajah 3,5 miliar tahun kehidupan.', `${esc(String(PREHISTORIC.length))} makhluk purba pada garis waktu geologi, dari bangunan sianobakteri pertama sampai mamalia zaman es. Rentang fosil dibandingkan dengan catatan Paleobiology Database.`)}
    ${section('Periode geologi', list(PERIODS.map(p => `<strong>${esc(id(p.name))}</strong>: ${esc(age([p.from, p.to]))}`)))}
    ${PERIODS.map(p => {
      const items = PREHISTORIC.filter(x => x.period === p.id);
      return items.length
        ? section(
            `${id(p.name)} (${age([p.from, p.to])})`,
            items
              .map(x => {
                const living = x.inat ? SPECIES.find(s => Number(s.inat) === Number(x.inat)) : null;
                return `<article class="card" id="fosil-${esc(x.id)}"><h3>${esc(x.icon || '')} ${esc(id(x.name))}</h3><p class="muted small">${esc(id(x.group))} · ${esc(age(x.est))}</p><p>${esc(id(x.desc))}</p>${x.found ? `<p><strong>Ditemukan di:</strong> ${esc(id(x.found))}</p>` : ''}${living ? `<p>${link(speciesURL(living), `Masih hidup: ${id(living.name)}`)}</p>` : ''}${x.wiki ? `<p class="small"><a href="https://en.wikipedia.org/wiki/${esc(x.wiki)}" rel="noopener noreferrer">Wikipedia: ${esc(x.wiki)}</a></p>` : ''}</article>`;
              })
              .join(''),
            ` id="periode-${esc(p.id)}"`
          )
        : '';
    }).join('')}
    ${section('Pelajari lebih lanjut', list([link('/learn/purba', 'Materi: kehidupan purba dan fosil'), link('/learn/evolusi', 'Materi: evolusi & seleksi alam'), link('/tree', 'Pohon kehidupan')]))}
    ${explore()}`;
  return {
    route: '/purba',
    page: 'purba',
    title: 'Kehidupan purba: garis waktu fosil',
    description: `${PREHISTORIC.length} makhluk purba dari stromatolit sampai mamut pada garis waktu ${PERIODS.length} periode geologi, dengan penjelasan sederhana.`,
    body,
    files: ['js/data/prehistoric.js'],
  };
}

function biomapPage(topics) {
  const topicById = Object.fromEntries(topics.map(t => [t.id, t]));
  const body = `${crumbs([['/peta', 'Peta Biologi']])}
    ${head('BIOTALOKA / PETA', 'Peta Biologi', 'Dua cara melihat ilmu hayat: tingkat organisasi kehidupan dari molekul sampai biosfer, dan cabang-cabang biologi beserta materi Biotaloka yang membahasnya.')}
    ${section(
      'Tingkat organisasi kehidupan',
      `<ol class="organization">${ORGANIZATION.map(o => {
        const desc = o.desc?.smp || o.desc?.sd || [];
        const lessons = topics.filter(t => (t.org || []).includes(o.id));
        return `<li id="tingkat-${esc(o.id)}"><h3>${esc(o.icon || '')} ${esc(id(o.name))}</h3><p>${esc(id(desc))}</p>${o.example ? `<p class="muted small">Contoh: ${esc(id(o.example))}</p>` : ''}${lessons.length ? `<p class="small">Materi: ${lessons.map(topicLink).join(', ')}</p>` : ''}</li>`;
      }).join('')}</ol>`
    )}
    ${section(
      'Cabang-cabang biologi',
      list(
        BRANCHES.map(b => {
          const lessons = (b.topics || []).map(x => topicById[x]).filter(Boolean);
          const tree = b.tree === 'root' ? '/tree' : b.tree ? `/tree/${b.tree}` : '';
          return `<article id="cabang-${esc(b.id)}"><h3>${esc(id(b.name))}</h3><p>${esc(id(b.desc))}</p>${lessons.length ? `<p class="small">Materi: ${lessons.map(topicLink).join(', ')}</p>` : ''}${b.partial ? '<p class="muted small">Belum ada materi khusus; dasar-dasarnya ada di materi yang lebih luas.</p>' : ''}${tree ? `<p class="small">${link(tree, 'Lihat di pohon kehidupan')}</p>` : ''}</article>`;
        })
      )
    )}
    ${explore()}`;
  return {
    route: '/peta',
    page: 'peta',
    title: 'Peta Biologi: tingkat organisasi dan cabang ilmu',
    description: `${ORGANIZATION.length} tingkat organisasi kehidupan dari molekul sampai biosfer dan ${BRANCHES.length} cabang biologi, ditautkan ke materi Biotaloka.`,
    body,
    files: ['js/data/biomap.js'],
  };
}

const kingdomInfo = key => TAXON_GROUPS[KINGDOMS[key]] || null;
const kingdomLink = key =>
  link(`/tree/${key}`, `${id(kingdomInfo(key)?.name) || KINGDOMS[key]} (${KINGDOMS[key]})`);

function treeIndex() {
  const body = `${crumbs([['/tree', 'Pohon kehidupan']])}
    ${head('BIOTALOKA / ATLAS', 'Setiap cabang punya cerita.', 'Pohon kehidupan menyusun semua makhluk hidup menurut kekerabatannya: tiga domain, lalu kerajaan, filum, kelas, ordo, famili, genus, dan spesies. Data taksonomi berasal dari GBIF Backbone Taxonomy.')}
    ${Object.entries(DOMAINS)
      .map(([domain, keys]) =>
        section(
          `Domain ${domain}`,
          `<p>${esc(DOMAIN_TEXT[domain])}</p>${list(keys.map(kingdomLink))}<p>${link(`/tree/${domain}`, `Buka domain ${domain}`)}</p>`
        )
      )
      .join('')}
    ${section('Cara membaca pohon', '<p>Semakin dekat dua cabang bertemu, semakin dekat kekerabatannya. Nama ilmiah selalu terdiri dari dua kata: genus dan penunjuk spesies, misalnya <em>Panthera tigris</em> untuk harimau.</p><p>Pelajari: ' + link('/learn/klasifikasi', 'Klasifikasi & nama ilmiah') + ' · ' + link('/learn/evolusi', 'Evolusi & seleksi alam') + '</p>')}
    ${explore()}`;
  return {
    route: '/tree',
    page: 'tree',
    title: 'Pohon kehidupan: domain, kerajaan, dan kekerabatan',
    description:
      'Telusuri pohon kehidupan dari tiga domain (Eukarya, Bacteria, Archaea) sampai spesies dengan data GBIF Backbone Taxonomy.',
    body,
    files: ['js/data/groups.js', 'js/pages/tree.js'],
  };
}

function domainPage(domain) {
  const body = `${crumbs([
    ['/tree', 'Pohon kehidupan'],
    [`/tree/${domain}`, domain],
  ])}
    ${head('DOMAIN', domain, esc(DOMAIN_TEXT[domain]))}
    ${section('Kerajaan dalam domain ini', list(DOMAINS[domain].map(k => `${kingdomLink(k)} — ${esc(id(kingdomInfo(k)?.desc))}`)))}
    ${explore()}`;
  return {
    route: `/tree/${domain}`,
    page: 'tree',
    title: `Domain ${domain} · Pohon kehidupan`,
    description: `${DOMAIN_TEXT[domain]} Kerajaan: ${DOMAINS[domain].map(k => KINGDOMS[k]).join(', ')}.`,
    body,
    files: ['js/data/groups.js', 'js/pages/tree.js'],
  };
}

const sciName = x => (x.nameType === 'INFORMAL' ? x.scientificName : x.canonicalName || x.scientificName);
const domainOf = x =>
  Number(x.kingdomKey) === 2
    ? 'Archaea'
    : Number(x.kingdomKey) === 3
      ? 'Bacteria'
      : [1, 4, 5, 6, 7].includes(Number(x.kingdomKey))
        ? 'Eukarya'
        : '';

/** A higher taxon (kingdom, phylum, ...) whose record and children are in the snapshot. */
async function taxonPage(node, children, treeKeys) {
  const name = sciName(node);
  const info = TAXON_GROUPS[name];
  const parents = (await gbifParents(node.key)) || [];
  const domain = domainOf(node);
  const rank = RANKS[node.rank] || node.rank;
  const path = [
    ['/tree', 'Pohon kehidupan'],
    ...(domain ? [[`/tree/${domain}`, domain]] : []),
    ...parents.map(p => [`/tree/${p.key}`, id(TAXON_GROUPS[sciName(p)]?.name) || sciName(p)]),
    [`/tree/${node.key}`, id(info?.name) || name],
  ];
  const parentCrumbs = path.filter(
    ([href]) => !/^\/tree\/\d+$/.test(href) || treeKeys.has(Number(href.slice(6)))
  );
  const members =
    node.rank === 'KINGDOM' ? SPECIES.filter(s => byKingdom.get(String(s.id)) === Number(node.key)) : [];
  const body = `${crumbs(parentCrumbs)}
    ${head(rank.toUpperCase(), id(info?.name) || name, `<em class="latin">${esc(name)}</em>${info ? ` — ${esc(id(info.desc))}` : ''}`)}
    ${section(
      `Kelompok di dalam ${id(info?.name) || name}`,
      list(
        children.map(c => {
          const cName = sciName(c);
          const cInfo = TAXON_GROUPS[cName];
          const label = `${cInfo ? `${id(cInfo.name)} (${cName})` : cName} · ${RANKS[c.rank] || c.rank}`;
          return `${treeKeys.has(Number(c.key)) ? link(`/tree/${c.key}`, label) : esc(label)}${cInfo ? ` — ${esc(id(cInfo.desc))}` : ''}`;
        })
      )
    )}
    ${members.length ? section('Kartu spesies dalam kelompok ini', list(members.map(speciesLink))) : ''}
    ${section('Sumber', `<p>Taksonomi dari <a href="https://www.gbif.org/species/${esc(node.key)}" rel="noopener noreferrer">GBIF Backbone Taxonomy</a>. Nama dan penjelasan Indonesia ditulis tim Biotaloka (CC BY-SA 4.0).</p>`)}
    ${explore()}`;
  return {
    route: `/tree/${node.key}`,
    page: 'tree',
    title: `${id(info?.name) || name} (${name}) · ${rank}`,
    description: summary(
      `${id(info?.name) || name} (${name}), ${rank.toLowerCase()} dengan ${children.length} kelompok di dalamnya. ${id(info?.desc) || ''}`
    ),
    body,
    files: ['js/data/groups.js', 'js/pages/tree.js'],
    jsonLd: [
      { '@type': 'Taxon', name: id(info?.name) || name, scientificName: name, taxonRank: rank.toLowerCase() },
    ],
  };
}
function quizIndex(topics) {
  const body = `${crumbs([['/quiz', 'Kuis']])}
    ${head('BIOTALOKA / QUIZ', 'Uji dirimu, kumpulkan lencana!', 'Setiap materi punya kuis dengan pertanyaan yang disesuaikan dengan jenjangmu. Ada juga kuis foto: tebak spesies dari gambarnya.')}
    ${section('Kuis foto', `<p>${link('/quiz/foto', 'Tebak spesies dari fotonya')}</p>`)}
    ${FIELDS.map(f => {
      const inField = topics.filter(t => t.field === f.id);
      return inField.length
        ? section(id(f.name), list(inField.map(t => link(`/quiz/${t.id}`, `Kuis: ${id(t.title)}`))))
        : '';
    }).join('')}
    ${explore()}`;
  return {
    route: '/quiz',
    page: 'quiz',
    title: 'Kuis biologi per materi',
    description: `Kuis biologi untuk ${TOPICS.length} materi dan kuis foto spesies, dengan pertanyaan yang disesuaikan untuk SD, SMP, SMA, dan kuliah.`,
    body,
    files: ['js/data/topics/index.js'],
  };
}

function quizPage(t) {
  const body = `${crumbs([
    ['/quiz', 'Kuis'],
    [`/quiz/${t.id}`, id(t.title)],
  ])}
    ${head('KUIS', `Kuis: ${id(t.title)}`, esc(id(t.summary)))}
    <p>Kuis ini berisi ${esc(String((t.quiz || []).length))} pertanyaan dan membutuhkan JavaScript. Baca dulu materinya: ${topicLink(t)}.</p>
    ${explore()}`;
  return {
    route: `/quiz/${t.id}`,
    page: 'quiz',
    title: `Kuis: ${id(t.title)}`,
    description: summary(`Kuis ${id(t.title)}: ${id(t.summary)}`),
    body,
    files: [`js/data/topics/${t.id}.js`],
  };
}

function labIndex() {
  const body = `${crumbs([['/lab', 'Laboratorium']])}
    ${head('BIOTALOKA / LAB', 'Rasa ingin tahu, bertemu eksperimen.', 'Laboratorium virtual untuk membuat hipotesis, mengubah variabel, dan membaca bukti. Semua simulasi adalah model pembelajaran yang disederhanakan.')}
    ${section('Simulasi', list(LABS.map(([labId, name, text]) => `${link(`/lab/${labId}`, name)} — ${esc(text)}`)))}
    ${explore()}`;
  return {
    route: '/lab',
    page: 'lab',
    title: 'Laboratorium virtual biologi',
    description: `${LABS.length} simulasi biologi: fotosintesis, osmosis, enzim, pewarisan sifat, kode genetik, seleksi alam, dan lainnya.`,
    body,
    files: ['js/pages/lab.js'],
  };
}

function labPage([labId, name, text]) {
  const body = `${crumbs([
    ['/lab', 'Laboratorium'],
    [`/lab/${labId}`, name],
  ])}
    ${head('SIMULASI PEMBELAJARAN', name, esc(text))}
    <p>Simulasi ini berjalan di peramban dan membutuhkan JavaScript. ${link('/lab', 'Lihat semua simulasi')}.</p>
    ${explore()}`;
  return {
    route: `/lab/${labId}`,
    page: 'lab',
    title: `${name} · Laboratorium virtual`,
    description: text,
    body,
    files: [`js/labs/${labId}.js`],
  };
}

/** Pages whose content comes from the visitor or live APIs: a readable shell with links. */
function shellPage(route, page, { eyebrow, title, heading, description, html = '', noindex = false, files }) {
  const body = `${crumbs([[route, title]])}${head(eyebrow, heading, esc(description))}${html}${explore()}`;
  return { route, page, title, description, body, noindex, files: files || [`js/pages/${page}.js`] };
}

function shells() {
  return [
    shellPage('/search', 'search', {
      eyebrow: 'BIOTALOKA / JELAJAHI',
      title: 'Jelajahi kehidupan',
      heading: 'Ada dunia baru di setiap penemuan.',
      description:
        'Cari spesies apa pun dengan nama Indonesia, Inggris, atau ilmiah. Galeri foto dari iNaturalist dan indeks nama dari GBIF untuk Indonesia dan dunia.',
      html: section(
        'Mulai dari kelompok',
        list(
          Object.entries(GROUPS)
            .filter(([key]) => byGroup(key).length)
            .map(
              ([key, g]) =>
                `${link(`/search?q=${encodeURIComponent(id(g.name))}`, id(g.name))} · ${byGroup(key).slice(0, 3).map(speciesLink).join(', ')}`
            )
        )
      ),
      files: ['js/pages/explore.js'],
    }),
    shellPage('/compare', 'compare', {
      eyebrow: 'BIOTALOKA / COMPARE',
      title: 'Bandingkan dua makhluk hidup',
      heading: 'Seberapa dekat kekerabatan mereka?',
      description:
        'Pilih dua makhluk hidup dan lihat di tingkat mana silsilah mereka bertemu: kerajaan, filum, kelas, ordo, famili, atau genus.',
      html: section(
        'Contoh',
        list([
          link('/compare?a=41967&b=118552', 'Harimau dan kucing'),
          link('/compare?a=39449&b=41967', 'Komodo dan harimau'),
        ])
      ),
    }),
    shellPage('/nearby', 'nearby', {
      eyebrow: 'BIOTALOKA / NEARBY',
      title: 'Makhluk hidup di sekitarku',
      heading: 'Siapa saja tetanggamu di alam?',
      description:
        'Temukan spesies yang pernah diamati di dekat lokasimu berdasarkan data pengamatan iNaturalist. Lokasi hanya dipakai di perangkatmu.',
    }),
    shellPage('/about', 'about', {
      eyebrow: 'BIOTALOKA / SUMBER',
      title: 'Sumber & metode',
      heading: 'Rasa ingin tahu membutuhkan sumber yang baik.',
      description:
        'Biotaloka menggabungkan data terbuka dari GBIF, iNaturalist, Wikipedia, dan Paleobiology Database dengan teks kurasi tim Biotaloka (CC BY-SA 4.0).',
      html: `${section('Sumber data', list(['<strong>GBIF Backbone Taxonomy</strong> — taksonomi, nama ilmiah, dan sinonim.', '<strong>iNaturalist</strong> — foto berlisensi terbuka, nama umum, dan status konservasi IUCN.', '<strong>Wikipedia</strong> — ringkasan ensiklopedis (CC BY-SA).', '<strong>Paleobiology Database</strong> — rentang fosil makhluk purba.']))}
        ${section('Konten kurasi', `<p>Kartu spesies, materi pelajaran, kamus, dan garis waktu purba ditulis tim Biotaloka dan dilisensikan CC BY-SA 4.0. Kode sumber berlisensi MIT.</p>`)}
        ${section('Privasi', '<p>Biotaloka tidak memakai akun, iklan, atau pelacak. Pilihan jenjang, catatan, koleksi, dan lencana disimpan hanya di perangkatmu. Lokasi untuk fitur “Di sekitarku” diminta saat dipakai dan tidak dikirim ke Biotaloka.</p>', ' id="privasi"')}`,
    }),
    shellPage('/dukung', 'dukung', {
      eyebrow: 'BIOTALOKA / SUPPORT',
      title: 'Dukung Biotaloka',
      heading: 'Bantu rasa ingin tahu terus tumbuh.',
      description:
        'Biotaloka gratis dan terbuka. Dukung dengan membagikannya ke kelas, melaporkan kesalahan, menyumbang konten, atau donasi sukarela.',
      files: ['js/pages/support.js'],
    }),
    shellPage('/guru', 'guru', {
      eyebrow: 'BIOTALOKA / GURU',
      title: 'Ruang guru',
      heading: 'Ruang guru Biotaloka',
      description:
        'Bahan ajar per materi, lembar kerja yang bisa dicetak, dan pembuat tautan tugas untuk murid, dipetakan ke fase Kurikulum Merdeka.',
      html: section(
        'Materi dengan catatan guru',
        list(TOPICS.map(t => link(`/guru?topic=${t.id}`, id(t.title))))
      ),
      files: ['js/pages/teacher.js'],
    }),
    shellPage('/tugas', 'tugas', {
      eyebrow: 'BIOTALOKA / TUGAS',
      title: 'Tugas',
      heading: 'Tugas dari gurumu',
      description:
        'Halaman ini menampilkan tugas yang dibagikan guru melalui tautan. Buka tautan lengkap dari gurumu.',
      noindex: true,
      files: ['js/pages/assignment.js'],
    }),
    shellPage('/saved', 'saved', {
      eyebrow: 'BIOTALOKA / KOLEKSI',
      title: 'Koleksi',
      heading: 'Penemuan kecil, koleksi pribadi.',
      description: 'Spesies yang kamu simpan, catatan, dan lencana, tersimpan hanya di perangkat ini.',
      noindex: true,
    }),
  ];
}

/* ---------- Assembly ---------- */
function replaceOrInsert(html, pattern, replacement, anchor) {
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return anchor ? html.replace(anchor, `${anchor}\n    ${replacement}`) : html;
}

function assemble(shell, page, siteURL) {
  const url = siteURL ? `${siteURL}${page.route}` : page.route;
  const title = page.route === '/' ? page.title : `${page.title} · ${SITE_NAME}`;
  const image = page.image || (siteURL ? `${siteURL}${DEFAULT_IMAGE}` : DEFAULT_IMAGE);
  let html = shell
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${esc(page.description)}" />`
    )
    .replace(
      /<meta property="og:title" content="[^"]*" \/>/,
      `<meta property="og:title" content="${esc(title)}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${esc(page.description)}" />`
    )
    .replace(
      /<meta property="og:image" content="[^"]*" \/>/,
      `<meta property="og:image" content="${esc(image)}" />`
    );
  // The brand image is 1200×630; a species photo has its own size.
  if (page.image) html = html.replace(/\s*<meta property="og:image:(width|height)" content="\d+" \/>/g, '');
  const type = '<meta property="og:type" content="website" />';
  if (siteURL) {
    html = replaceOrInsert(
      html,
      /<meta property="og:url" content="[^"]*" \/>/,
      `<meta property="og:url" content="${esc(url)}" />`,
      type
    );
    html = replaceOrInsert(
      html,
      /<link rel="canonical" href="[^"]*" \/>/,
      `<link rel="canonical" href="${esc(url)}" />`,
      type
    );
  }
  if (page.noindex) html = html.replace('</head>', '  <meta name="robots" content="noindex" />\n  </head>');
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [...page.body.matchAll(/<nav class="breadcrumbs"[^>]*>([\s\S]*?)<\/nav>/g)]
      .flatMap(m => [...m[1].matchAll(/<a href="([^"]*)">([^<]*)<\/a>/g)])
      .map(([, href, name], i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: name
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"'),
        item: siteURL ? `${siteURL}${href.replace(/#.*$/, '')}` : href,
      })),
  };
  const graph = [...(page.jsonLd || []), ...(breadcrumb.itemListElement.length ? [breadcrumb] : [])].map(
    x => ({
      '@context': 'https://schema.org',
      ...JSON.parse(JSON.stringify(x).replace(/\{site\}/g, siteURL || '')),
      ...(x['@type'] !== 'BreadcrumbList' ? { url } : {}),
    })
  );
  if (graph.length)
    html = html.replace(
      '</head>',
      `  <script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>\n  </head>`
    );
  return html.replace(
    /<main id="main" tabindex="-1">[\s\S]*?<\/main>/,
    `<main id="main" tabindex="-1" data-page="${esc(page.page)}">\n${page.body}\n    </main>`
  );
}

/** Which higher taxa can get a page: every GBIF key with a record and a children list in the snapshot. */
async function treeNodes() {
  const nodes = new Map();
  if (!existsSync(snapshotDir)) return nodes;
  const files = (await readdir(snapshotDir)).filter(f => f.endsWith('.json') && f !== 'index.json');
  const records = new Map();
  const children = new Map();
  for (const file of files) {
    let data;
    try {
      data = JSON.parse(await readFile(join(snapshotDir, file), 'utf8'));
    } catch {
      continue;
    }
    const m = String(data.u || '').match(/^https:\/\/api\.gbif\.org\/v1\/species\/(\d+)(\/children)?\?(.*)$/);
    if (!m) continue;
    if (m[2] && /^limit=100&offset=0$/.test(m[3])) children.set(Number(m[1]), data.d?.results || []);
    else if (!m[2] && m[3] === '' && data.d?.key) records.set(Number(m[1]), data.d);
  }
  for (const [key, kids] of children) {
    const node = records.get(key);
    if (node && !['SPECIES', 'SUBSPECIES'].includes(node.rank) && kids.length)
      nodes.set(key, { node, children: kids });
  }
  return nodes;
}

export async function prerender({ dist, siteURL = '' }) {
  const shell = await readFile(join(dist, 'index.html'), 'utf8');
  const topics = (await loadTopics()).filter(Boolean);
  const tree = await treeNodes();
  const treeKeys = new Set(tree.keys());
  for (const sp of SPECIES) {
    const record = sp.gbif ? await gbifTaxon(sp.gbif) : null;
    if (record?.kingdomKey) byKingdom.set(String(sp.id), Number(record.kingdomKey));
  }

  const pages = [
    homePage(topics),
    ...(await Promise.all(SPECIES.map(sp => speciesPage(sp, topics, treeKeys)))),
    learnIndex(topics),
    ...topics.map(t => topicPage(t, topics)),
    glossaryPage(),
    prehistoricPage(),
    biomapPage(topics),
    treeIndex(),
    ...Object.keys(DOMAINS).map(domainPage),
    ...(await Promise.all(
      [...tree.values()].map(({ node, children }) => taxonPage(node, children, treeKeys))
    )),
    quizIndex(topics),
    ...topics.map(quizPage),
    labIndex(),
    ...LABS.map(labPage),
    ...shells(),
  ];

  const urls = [];
  for (const page of pages) {
    const file = page.route === '/' ? join(dist, 'index.html') : join(dist, `${page.route.slice(1)}.html`);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, assemble(shell, page, siteURL));
    if (!page.noindex && siteURL)
      urls.push({ loc: `${siteURL}${page.route}`, lastmod: await latest(page.files || ['index.html']) });
  }

  // Unknown paths: Cloudflare Pages answers 404 with this file, which boots the app so that species
  // found through live search (not prerendered) still open for visitors.
  const notFound = assemble(
    shell,
    {
      route: '/404',
      page: 'home',
      title: 'Halaman tidak ditemukan',
      description: 'Alamat ini tidak ada di Biotaloka.',
      noindex: true,
      body: `${head('BIOTALOKA', 'Halaman tidak ditemukan', 'Alamat ini tidak ada di Biotaloka, atau halamannya sedang dimuat.')}<p><a class="btn" href="/">Kembali ke beranda Biotaloka</a></p>${explore()}`,
    },
    ''
  )
    .replace(/\s*<meta property="og:url" content="[^"]*" \/>/, '')
    .replace(/\s*<link rel="canonical" href="[^"]*" \/>/, '');
  await writeFile(join(dist, '404.html'), notFound);

  return { pages: pages.length, urls };
}
