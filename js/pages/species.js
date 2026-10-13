import { $, $$, esc, link, plain, toast, download, copyText, seeded, shuffle } from '../core/dom.js';
import { currentURL, navigate } from '../core/router.js';
import { S, pick, lang, atLeast, atMost, fmt, fmtDate, byLevel } from '../core/prefs.js';
import { isSaved, toggleSaved, trackSpecies } from '../core/userdata.js';
import { ui, rankLabel } from '../i18n/ui.js';
import { API, commonNames } from '../services/api.js';
import { photoMarkup, bindImageFallbacks, curatedPhoto } from '../services/media.js';
import { describeStatus } from '../services/conservation.js';
import { createOccurrenceMap } from '../services/map.js';
import { GROUPS as SP_GROUPS, DIETS, HABITATS, findSpecies } from '../data/species.js';
import { GROUPS } from '../data/groups.js';
import { crumbs, loading, emptyState, listenButton, notice, routeURL } from '../components/common.js';
import { rich } from '../components/richtext.js';
import { refresh } from '../components/cards.js';
import { icon } from '../components/icons.js';

const s = S({
  title: ['Spesies', 'Species'],
  back: ['Kembali menjelajah', 'Back to exploring'],
  meet: ['Kenalan yuk!', 'Let’s meet!'],
  food: ['Makanannya', 'What it eats'],
  home: ['Rumahnya', 'Where it lives'],
  fun: ['Fakta seru', 'Fun fact'],
  size: ['Ukurannya', 'How big'],
  life: ['Umurnya', 'Lifespan'],
  diet: ['Cara makan', 'Diet'],
  habitat: ['Habitat', 'Habitat'],
  group: ['Kelompok', 'Group'],
  endemic: ['Hanya ada di Indonesia', 'Found only in Indonesia'],
  names: ['Nama', 'Names'],
  indonesian: ['Nama Indonesia', 'Indonesian name'],
  english: ['Nama Inggris', 'English name'],
  namesMissing: ['Belum tercatat', 'Not yet recorded'],
  accepted: ['Nama diterima', 'Accepted name'],
  tabs: ['Bagian halaman spesies', 'Species page sections'],
  tabOverview: { sd: ['Kenalan', 'Meet'], smp: ['Ringkasan', 'Overview'] },
  tabFacts: ['Cara hidup', 'Way of life'],
  tabMap: { sd: ['Di mana?', 'Where?'], smp: ['Peta temuan', 'Occurrence map'] },
  tabPhotos: { sd: ['Foto', 'Photos'], smp: ['Galeri', 'Gallery'] },
  tabStudy: { sd: ['Aktivitas', 'Activities'], smp: ['Belajar', 'Learn'] },
  tabData: ['Data & rujukan', 'Data & references'],
  loadingDetails: ['Melengkapi informasi dari sumber…', 'Adding information from the sources…'],
  loadFailed: ['Informasi tambahan belum dapat dimuat.', 'Additional information could not be loaded.'],
  overview: ['Mengenal spesies', 'Meet the species'],
  wikiMissing: [
    'Ringkasan Wikipedia belum tersedia. Gunakan tautan sumber untuk membaca lebih lanjut.',
    'A Wikipedia summary is unavailable. Follow the source links to read more.',
  ],
  noTranslation: [
    'Terjemahan belum tersedia; teks asli ditampilkan dengan penanda bahasa.',
    'No translation is available; the original text is shown with its language.',
  ],
  noCurated: [
    'Kartu sederhana untuk spesies ini belum tersedia. Kamu tetap bisa melihat foto, peta, dan ringkasan dari sumber.',
    'A simple card for this species is not available yet. You can still explore its photos, map and source summary.',
  ],
  whereFound: ['Di mana mereka ditemukan?', 'Where have they been found?'],
  interactiveMap: ['Peta interaktif', 'Interactive map'],
  worksheet: ['Lembar penjelajah', 'Explorer’s worksheet'],
  forClass: ['Untuk kelas dan tugas', 'For class and homework'],
  sourcesNotes: ['Sumber & catatan', 'Sources & notes'],
  updatedNote: [
    'Informasi mengikuti catatan sumber, bukan hasil pengukuran Biotaloka.',
    'Information follows source records, not measurements made by Biotaloka.',
  ],
  exactJoin: [
    'Identitas dicocokkan berdasarkan nama ilmiah yang sama.',
    'Identity matched using the same scientific name.',
  ],
  noJoin: [
    'Belum ada kecocokan nama ilmiah yang pasti di GBIF. Catatan iNaturalist tetap ditampilkan tanpa menggabungkan spesies lain.',
    'No exact scientific-name match in GBIF yet. The iNaturalist record is shown without merging another species.',
  ],
  partial: [
    'Sebagian sumber pelengkap tidak tersedia saat ini.',
    'Some supplementary sources are currently unavailable.',
  ],
  known: ['Yang diketahui dari sumber', 'What the sources tell us'],
  stillLearning: ['Belum ada uraian dari sumber', 'Not yet described by the sources'],
  stillLearningText: [
    'Bagian berikut belum memiliki uraian terverifikasi dari API. Bidang kosong tidak diisi dengan dugaan.',
    'These sections have no verified description from the APIs yet. Empty fields are not filled with guesses.',
  ],
  readFull: ['Baca uraian lengkap', 'Read the full description'],
  conservation: ['Status konservasi', 'Conservation status'],
  conservationUnknown: [
    'Status konservasi global belum tercatat pada sumber.',
    'No global conservation status is recorded in the sources.',
  ],
  distribution: ['Wilayah tercatat', 'Recorded regions'],
  distributionNote: [
    'Label wilayah mengikuti sumber dan dapat mencakup catatan historis. “Global” bukan berarti tersebar di seluruh dunia.',
    'Regions follow source labels and may include historical records. “Global” does not mean worldwide.',
  ],
  atlasIntro: [
    'Geser, perbesar, dan klik titik untuk membaca catatan asli. Titik menunjukkan temuan, bukan batas habitat.',
    'Pan, zoom and select a point to read the original record. Points are occurrences, not habitat boundaries.',
  ],
  mapRetry: ['Muat ulang temuan', 'Reload records'],
  records: ['Catatan temuan (cuplikan)', 'Occurrence records (sample)'],
  place: ['Wilayah', 'Place'],
  date: ['Tanggal', 'Date'],
  source: ['Sumber', 'Source'],
  photosCredit: [
    'Foto dari kontributor iNaturalist. Atribusi dan lisensi melekat pada setiap foto.',
    'Photographs by iNaturalist contributors. Each keeps its credit and licence.',
  ],
  imageMissing: ['Foto berlisensi belum tersedia', 'No openly licensed photo yet'],
  imageFailed: ['Foto gagal dimuat', 'The photo could not load'],
  enlarge: ['Perbesar foto', 'Enlarge photo'],
  photoCount: ['foto', 'photos'],
  worksheetIntro: [
    'Baca sumber, amati fotonya, lalu jelaskan dengan bahasamu sendiri.',
    'Read the sources, look at the photos, then explain in your own words.',
  ],
  quickQuiz: ['Kuis kilat', 'Quick quiz'],
  correct: ['Benar!', 'Correct!'],
  wrong: ['Belum tepat. Jawabannya:', 'Not quite. The answer is:'],
  qGroup: ['{name} termasuk kelompok…', '{name} belongs to which group?'],
  qDiet: ['Bagaimana {name} mendapatkan makanan?', 'How does {name} get its food?'],
  qHabitat: ['Di mana {name} biasanya hidup?', 'Where does {name} usually live?'],
  identifiers: ['Identitas & status nama', 'Identifiers & name status'],
  authorship: ['Penulis nama', 'Authorship'],
  status: ['Status', 'Status'],
  synonyms: ['Sinonim (GBIF)', 'Synonyms (GBIF)'],
  noSynonyms: ['Tidak ada sinonim tercatat.', 'No synonyms recorded.'],
  cite: ['Cara mengutip', 'How to cite'],
  citeNote: [
    'Selalu kutip sumber data asli beserta tanggal akses.',
    'Always cite the original data sources with an access date.',
  ],
  copyCitation: ['Salin sitasi', 'Copy citation'],
  bibtex: ['Unduh BibTeX', 'Download BibTeX'],
  ris: ['Unduh RIS', 'Download RIS'],
  csv: ['Unduh sampel temuan (CSV)', 'Download sample occurrences (CSV)'],
  csvNote: [
    'Berisi hingga 300 titik yang ditampilkan di peta. Untuk analisis penelitian, unduh data lengkap dari GBIF agar mendapat DOI.',
    'Contains up to 300 points shown on the map. For research, download the full dataset from GBIF to get a DOI.',
  ],
  gbifDownload: ['Buka unduhan lengkap di GBIF', 'Open the full download on GBIF'],
  databases: ['Basis data ilmiah', 'Scientific databases'],
  accessed: ['Diakses', 'Accessed'],
  compareHint: [
    'Perbandingan membutuhkan kecocokan di iNaturalist.',
    'Comparing needs an iNaturalist match.',
  ],
  wikiLabel: ['Wikipedia', 'Wikipedia'],
  otherNotes: ['Catatan lain dari sumber', 'Other notes from the sources'],
  cat: {
    habitat: ['Habitat & cara hidup', 'Habitat & ecology'],
    diet: ['Makanan & peran ekologi', 'Diet & ecological role'],
    morphology: ['Bentuk & ciri tubuh', 'Form & appearance'],
    behaviour: ['Perilaku & aktivitas', 'Behaviour & activity'],
    reproduction: ['Reproduksi & siklus hidup', 'Reproduction & life cycle'],
    conservationText: ['Ancaman & perlindungan', 'Threats & protection'],
    evolution: ['Evolusi & kekerabatan', 'Evolution & relationships'],
    notes: ['Catatan taksonomi', 'Taxonomic notes'],
  },
});

export const title = () => s.title;

const QUESTIONS = {
  sd: [
    [
      'Gambar makhluk hidup ini. Tulis 3 ciri yang kamu lihat di fotonya.',
      'Draw this living thing. Write 3 features you can see in the photos.',
    ],
    ['Apa makanannya dan di mana ia tinggal?', 'What does it eat and where does it live?'],
    [
      'Mengapa makhluk hidup ini penting bagi alam? Bagaimana cara kita menjaganya?',
      'Why is it important to nature? How can we protect it?',
    ],
  ],
  smp: [
    [
      'Apa ciri organisme ini? Mana yang kamu amati sendiri dan mana yang berasal dari bacaan?',
      'What are its traits? Which did you observe and which came from reading?',
    ],
    [
      'Bagaimana organisme ini memperoleh energi dan berhubungan dengan organisme lain?',
      'How does it obtain energy and interact with other organisms?',
    ],
    [
      'Data apa yang belum tersedia? Sumber apa yang bisa membantu memeriksanya?',
      'What information is missing? Which sources could help check it?',
    ],
  ],
  sma: [
    [
      'Adaptasi apa yang membantunya bertahan di habitatnya? Hubungkan dengan seleksi alam.',
      'Which adaptations help it survive in its habitat? Link them to natural selection.',
    ],
    [
      'Analisis peta temuan: di mana data paling banyak, dan apa kemungkinan bias pengambilan datanya?',
      'Analyse the occurrence map: where are records concentrated, and what sampling biases are possible?',
    ],
    [
      'Apa status konservasinya dan ancaman utama apa yang disebutkan sumber?',
      'What is its conservation status and which main threats do the sources mention?',
    ],
  ],
  kuliah: [
    [
      'Periksa status nama dan sinonimnya. Apakah GBIF, iNaturalist, dan Catalogue of Life berbeda? Mengapa?',
      'Check its name status and synonyms. Do GBIF, iNaturalist and Catalogue of Life differ? Why?',
    ],
    [
      'Rumuskan satu pertanyaan penelitian yang dapat dijawab dengan data temuan spesies ini, beserta keterbatasannya.',
      'Frame one research question answerable with this species’ occurrence data, and its limitations.',
    ],
    ['Tulis sitasi lengkap untuk data yang kamu gunakan.', 'Write full citations for the data you used.'],
  ],
};

const LANG_NAMES = {
  eng: ['Inggris', 'English'],
  en: ['Inggris', 'English'],
  ind: ['Indonesia', 'Indonesian'],
  id: ['Indonesia', 'Indonesian'],
  spa: ['Spanyol', 'Spanish'],
  fra: ['Prancis', 'French'],
  deu: ['Jerman', 'German'],
  por: ['Portugis', 'Portuguese'],
  nld: ['Belanda', 'Dutch'],
  zho: ['Tionghoa', 'Chinese'],
  jpn: ['Jepang', 'Japanese'],
};
const TYPE_GROUPS = [
  ['overview', ['general', 'summary', 'introduction', 'abstract', 'biology']],
  ['habitat', ['habitat', 'biology_ecology', 'ecology', 'habitat_and_ecology', 'ecological_significance']],
  ['diet', ['food_feeding', 'diet', 'feeding', 'trophic_strategy', 'food']],
  [
    'morphology',
    [
      'description',
      'morphology',
      'diagnostic',
      'diagnosis',
      'size',
      'identification',
      'look_alikes',
      'physical_description',
    ],
  ],
  ['behaviour', ['activity', 'behaviour', 'behavior', 'movements', 'dispersal']],
  ['reproduction', ['breeding', 'reproduction', 'life_cycle', 'lifecycle', 'development', 'cyclicity']],
  ['conservationText', ['conservation', 'threats', 'management', 'conservation_status', 'uses', 'use']],
  ['evolution', ['evolution', 'phylogeny', 'evolution_and_systematics']],
  ['notes', ['discussion', 'taxonomy', 'nomenclature', 'notes', 'remarks']],
];
const EXCLUDED = new Set([
  'materials_examined',
  'vernacular_names',
  'child_taxa',
  'type_locality',
  'etymology',
  'distribution',
  'references',
]);
const RANKS = ['domain', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'];
const SPECIES_RANKS = ['SPECIES', 'SUBSPECIES', 'VARIETY', 'FORM'];

let state = { data: null, panel: 'overview', mapView: null, mapHost: null, curated: null, occurrences: null };

const domainOf = x =>
  Number(x.kingdomKey) === 2
    ? 'Archaea'
    : Number(x.kingdomKey) === 3
      ? 'Bacteria'
      : [1, 4, 5, 6, 7].includes(Number(x.kingdomKey))
        ? 'Eukarya'
        : null;
const nameOf = x =>
  x.nameType === 'INFORMAL'
    ? x.scientificName || x.canonicalName
    : x.canonicalName || x.scientificName || ui.unknown;

function tabsFor() {
  const tabs = [['overview', s.tabOverview]];
  if (atLeast('smp')) tabs.push(['facts', s.tabFacts]);
  tabs.push(['map', s.tabMap]);
  tabs.push(['photos', s.tabPhotos]);
  tabs.push(['study', s.tabStudy]);
  if (atLeast('kuliah')) tabs.push(['data', s.tabData]);
  return tabs;
}

/* ---------- Source descriptions ---------- */
function groupDescriptions(data) {
  const seen = new Set();
  const out = {};
  for (const d of data.descriptions?.results || []) {
    const type = String(d.type || '')
      .toLowerCase()
      .trim();
    if (EXCLUDED.has(type)) continue;
    const text = plain(d.description);
    if (text.length < 40) continue;
    const key = text.slice(0, 200).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const group =
      TYPE_GROUPS.find(([, types]) => types.includes(type))?.[0] || (/^[a-z_]+$/.test(type) ? 'notes' : null);
    if (!group) continue;
    (out[group] ||= []).push({ ...d, text });
  }
  const preferred = d => (['id', 'ind'].includes(d.language) === (lang === 'id') ? 0 : 1);
  Object.values(out).forEach(list => list.sort((a, b) => preferred(a) - preferred(b)));
  return out;
}

function sourceDescription(d) {
  const code = String(d.language || '').toLowerCase();
  const langName = LANG_NAMES[code] ? pick(LANG_NAMES[code]) : code || ui.unknown;
  const htmlLang = ['id', 'ind'].includes(code) ? 'id' : ['en', 'eng'].includes(code) ? 'en' : '';
  const excerpt = d.text.length > 700 ? `${d.text.slice(0, 700)}…` : d.text;
  const needsTranslation = lang === 'id' && !['id', 'ind'].includes(code);
  const translate = needsTranslation
    ? ` · ${link(`https://translate.google.com/?sl=auto&tl=id&op=translate&text=${encodeURIComponent(d.text.slice(0, 1800))}`, ui.translate)}`
    : '';
  const sourceLink = d.sourceTaxonKey
    ? link(`https://www.gbif.org/species/${Number(d.sourceTaxonKey)}`, d.source || 'GBIF')
    : esc(d.source || 'GBIF');
  return `<div class="source-text"><p class="prose"${htmlLang ? ` lang="${htmlLang}"` : ''}>${esc(excerpt)}</p>${
    d.text.length > 700
      ? `<details><summary>${s.readFull}</summary><p class="prose"${htmlLang ? ` lang="${htmlLang}"` : ''}>${esc(d.text)}</p></details>`
      : ''
  }<small class="source-meta">${ui.sourceLanguage}: ${esc(langName)} · ${sourceLink}${translate}</small></div>`;
}

/* ---------- Curated card ---------- */
function curatedBlock(sp) {
  const diet = DIETS[sp.diet];
  const group = SP_GROUPS[sp.g];
  const rows = [
    ['food', s.food, sp.food],
    ['home', s.home, sp.home],
    ['size', s.size, sp.size],
    ['life', s.life, sp.life],
  ].filter(([, , v]) => v);
  return `<article class="curated-block" id="curated-read">
    <div class="curated-head"><span class="eyebrow">🌟 ${s.meet}</span>${listenButton('#curated-read-body', 'curated')}</div>
    <div id="curated-read-body">
      ${rich(pick(sp.about), { cls: 'lead' })}
      <dl class="fact-list">${rows.map(([k, label, v]) => `<div class="fact fact-${k}"><dt>${esc(label)}</dt><dd>${rich(pick(v), { cls: 'inline' })}</dd></div>`).join('')}</dl>
      <div class="fun-fact-box"><strong>💡 ${s.fun}</strong>${rich(pick(sp.fun), { cls: 'inline' })}</div>
    </div>
    <div class="specimen-tags">
      ${group ? `<span class="tag">${group.icon} ${esc(pick(group.name))}</span>` : ''}
      ${diet ? `<button type="button" class="tag term" data-term="${esc(diet.term)}">${esc(pick(diet.name))}</button>` : ''}
      ${(sp.hab || []).map(h => (HABITATS[h] ? `<span class="tag">${esc(pick(HABITATS[h]))}</span>` : '')).join('')}
    </div>
    <p class="source-meta">${ui.curated} · ${ui.curatedNote}</p>
  </article>`;
}

/* ---------- Quick quiz generated from curated fields ---------- */
function quickQuiz(sp) {
  const random = seeded([...sp.sci].reduce((a, c) => a + c.charCodeAt(0), 0));
  const name = pick(sp.name);
  const questions = [];
  const addQ = (prompt, correct, pool) => {
    const distractors = shuffle(
      pool.filter(x => x !== correct),
      random
    ).slice(0, 2);
    questions.push({ prompt, options: shuffle([correct, ...distractors], random), correct });
  };
  if (SP_GROUPS[sp.g])
    addQ(
      s.qGroup.replace('{name}', name),
      pick(SP_GROUPS[sp.g].name),
      Object.values(SP_GROUPS).map(g => pick(g.name))
    );
  if (DIETS[sp.diet])
    addQ(
      s.qDiet.replace('{name}', name),
      pick(DIETS[sp.diet].name),
      ['karnivora', 'herbivora', 'omnivora', 'produsen', 'pengurai', 'parasit', 'planktivora'].map(k =>
        pick(DIETS[k].name)
      )
    );
  if (sp.hab?.[0] && HABITATS[sp.hab[0]]) {
    const correct = pick(HABITATS[sp.hab[0]]);
    const wrongPool = Object.entries(HABITATS)
      .filter(([k]) => !sp.hab.includes(k))
      .map(([, v]) => pick(v));
    addQ(s.qHabitat.replace('{name}', name), correct, [correct, ...wrongPool]);
  }
  return `<section class="card quick-quiz"><h3>⚡ ${s.quickQuiz}</h3>${questions
    .map(
      (q, i) =>
        `<fieldset class="quiz-q" data-correct="${esc(q.correct)}"><legend>${i + 1}. ${esc(q.prompt)}</legend><div class="quiz-options">${q.options
          .map(
            o => `<button type="button" class="quiz-option" data-quick-answer="${esc(o)}">${esc(o)}</button>`
          )
          .join('')}</div><p class="quiz-feedback" role="status"></p></fieldset>`
    )
    .join('')}</section>`;
}

function worksheet(name, key) {
  const questions = byLevel(QUESTIONS);
  return `<section class="worksheet"><span class="eyebrow">${s.forClass}</span><h2>${s.worksheet} · <em>${esc(name)}</em></h2><p>${s.worksheetIntro}</p>
    <ol>${questions.map(q => `<li>${esc(pick(q))}</li>`).join('')}</ol>
    <label for="study-notes">${ui.notes}</label>
    <textarea id="study-notes" data-note-key="species-${esc(key)}" data-note-label="${esc(name)}" placeholder="${ui.notesHint}"></textarea>
    <small data-note-status>${ui.notesSaved}</small>
    <div class="actions"><button class="btn secondary" type="button" data-print>${icon('print')} ${ui.printSheet}</button></div></section>`;
}

/* ---------- Gallery ---------- */
function galleryStage(photo, name, index = 0) {
  return `<button type="button" class="gallery-stage${photo ? '' : ' no-photo'}" ${photo ? `data-photo="${index}" aria-label="${s.enlarge}: ${esc(name)}"` : 'disabled'}>${
    photo
      ? photoMarkup(photo, name, { hero: true })
      : `<div class="photo-placeholder"><span aria-hidden="true">◎</span><small>${s.imageMissing}</small></div>`
  }<span class="image-error-text">${s.imageFailed}</span>${photo ? `<span class="enlarge-icon" aria-hidden="true">⤢</span>` : ''}</button>`;
}

function wikiHTML(wiki) {
  if (!wiki) return `<p class="muted">${s.wikiMissing}</p>`;
  const page =
    wiki.content_urls?.desktop?.page ||
    `https://${wiki.language}.wikipedia.org/wiki/${encodeURIComponent(wiki.title)}`;
  const text = atMost('sd')
    ? (wiki.extract.match(/[^.!?]+[.!?]+/g) || [wiki.extract]).slice(0, 2).join(' ')
    : wiki.extract;
  return `<p class="prose wiki-text" lang="${esc(wiki.language)}">${esc(text)}</p><p class="source-meta">${s.wikiLabel} · ${esc(String(wiki.language).toUpperCase())} · ${link(page, ui.read)}</p>${wiki.language !== lang ? notice(s.noTranslation) : ''}`;
}

/** Photos from the sources, or the curated card's own photo when the sources offer none. */
function photoList(data) {
  const photos = data?.photo?.photos || [];
  if (photos.length) return photos;
  const own = curatedPhoto(state.curated?.photo);
  return own ? [own] : [];
}

/* ---------- Main render ---------- */
function renderPage(data, complete) {
  destroyMap();
  const x = data.taxon;
  const name = nameOf(x);
  const domain = domainOf(x);
  const names = commonNames(data);
  const photos = photoList(data);
  const sp = state.curated;
  const primary = (sp && pick(sp.name)) || data.photo?.taxon?.preferred_common_name || names[lang][0] || '';
  const inatId = data.photo?.taxon?.id;
  const gbif = data.gbifKey || (!String(x.key).startsWith('inat-') ? x.key : null);
  const status = describeStatus(data.photo?.taxon?.conservation_status);
  const tabs = tabsFor();
  if (!tabs.some(([id]) => id === state.panel)) state.panel = 'overview';
  const kidFirst = atMost('sd') && primary;

  const rankNodes = [...(data.parents || []), x];
  const classification = RANKS.map(rank => {
    const node = rankNodes.find(n => n.rank === rank.toUpperCase());
    const local = node && GROUPS[nameOf(node)] ? pick(GROUPS[nameOf(node)].name) : '';
    const value =
      rank === 'domain'
        ? domain
          ? `<a href="/tree/${domain}">${domain}</a>`
          : ui.unknown
        : node
          ? `<a href="${nodeURL(node)}">${esc(nameOf(node))}</a>${local ? `<small>${esc(local)}</small>` : ''}`
          : ui.unknown;
    return `<li><span>${esc(ui[rank])}</span><div>${value}</div></li>`;
  }).join('');

  const descriptions = groupDescriptions(data);
  const overviewText = descriptions.overview?.[0];
  const factKeys = [
    'habitat',
    'diet',
    'morphology',
    'behaviour',
    'reproduction',
    'conservationText',
    'evolution',
    ...(atLeast('kuliah') ? ['notes'] : []),
  ];
  const available = factKeys.filter(k => descriptions[k]?.length);
  const missing = factKeys.filter(k => !descriptions[k]?.length && k !== 'notes');

  const heroTitle = kidFirst
    ? `<h1 class="common-first">${esc(primary)}</h1><p class="sci-title">${esc(name)}</p>`
    : `<h1>${esc(name)}</h1>${primary && primary !== name ? `<p class="common-title">${esc(primary)}</p>` : ''}`;
  const conservationTag = status
    ? `<span class="tag status-tag tone-${status.tone}" title="${esc(status.kid)}">${status.icon} ${esc(status.name)}${atLeast('sma') ? ` · ${esc(status.code)}` : ''}</span>`
    : '';
  const main = $('#main');
  main.innerHTML = `<div class="detail-topbar"><a href="/search">← ${s.back}</a><span>${esc([domain, x.kingdom].filter(Boolean).join(' / '))}</span><span class="live-label"><i class="live-dot"></i>${esc(x.source || 'GBIF')}</span></div>
  <section class="species-hero">
    <div class="species-visual">${galleryStage(photos[0], primary || name)}${
      photos.length > 1
        ? `<div class="photo-strip">${photos
            .slice(1, 5)
            .map(
              (p, i) =>
                `<button type="button" data-photo="${i + 1}" aria-label="${s.enlarge} ${i + 2}"><img src="${esc(p.small || p.medium)}" alt="" loading="lazy" width="100" height="75"></button>`
            )
            .join(
              ''
            )}<button type="button" class="more-photos" data-panel-button="photos">${fmt(photos.length)}<small>${s.photoCount}</small></button></div>`
        : ''
    }</div>
    <div class="species-intro"><div class="species-identity">
      <span class="eyebrow">${esc(rankLabel(x.rank).toUpperCase())} / ${esc(x.kingdom || 'LIFE')}</span>
      ${heroTitle}</div><div class="species-details">
      ${sp?.end ? `<p class="endemic-badge">🇮🇩 ${s.endemic}</p>` : ''}
      ${x.nameType === 'INFORMAL' ? notice(`${ui.informal}: ${esc(x.scientificName)}`) : ''}
      ${atLeast('smp') ? `<dl class="names"><div><dt>${s.indonesian}</dt><dd>${esc(names.id.join(' · ') || (lang === 'id' && sp ? pick(sp.name) : '') || s.namesMissing)}</dd></div><div><dt>${s.english}</dt><dd>${esc(names.en.join(' · ') || (sp ? sp.name[1] : '') || s.namesMissing)}</dd></div></dl>` : ''}
      <div class="specimen-tags">${domain ? `<a class="tag" href="/tree/${domain}">${domain}</a>` : ''}${atLeast('smp') ? `<span class="tag">${esc(x.taxonomicStatus === 'ACCEPTED' ? s.accepted : x.taxonomicStatus || ui.species)}</span>` : ''}${conservationTag}</div>
      ${status && atMost('smp') ? `<p class="status-explain tone-${status.tone}">${status.icon} <strong>${esc(status.name)}</strong> — ${esc(status.kid)}</p>` : ''}
      <div class="actions">
        <button class="btn" type="button" data-save aria-pressed="${isSaved(x.key)}">${isSaved(x.key) ? `✓ ${ui.unsave}` : `＋ ${ui.save}`}</button>
        ${inatId ? `<a class="btn secondary" href="/compare?a=${Number(inatId)}">${icon('compare')} ${ui.compare}</a>` : ''}
        <button class="btn secondary" type="button" data-panel-button="map">${icon('map')} ${pick(s.tabMap)}</button>
      </div>
      <p class="source-meta">${s.accessed}: ${fmtDate(data.accessed)} · ${esc(x.authorship || x.source || 'GBIF Backbone')}</p>
    </div></div>
  </section>
  <div class="dossier-tabs" role="tablist" aria-label="${s.tabs}">${tabs
    .map(
      ([id, label]) =>
        `<button type="button" id="tab-${id}" role="tab" aria-controls="panel-${id}" aria-selected="${state.panel === id}" tabindex="${state.panel === id ? 0 : -1}" data-panel-button="${id}">${esc(pick(label))}${id === 'photos' && atLeast('smp') ? ` (${photos.length})` : ''}</button>`
    )
    .join('')}</div>
  ${complete ? '' : `<div id="dossier-status" class="inline-status" role="status">${s.loadingDetails}</div>`}

  <section id="panel-overview" class="dossier-panel" data-panel="overview" role="tabpanel" aria-labelledby="tab-overview">
    <div class="detail-grid"><div class="detail-body">
      ${sp ? curatedBlock(sp) : atMost('sd') ? notice(s.noCurated) : ''}
      <article class="overview-card"><h2>${s.overview}</h2><div id="wiki-summary">${data.wiki !== undefined ? wikiHTML(data.wiki) : `<p class="muted">${s.loadingDetails}</p>`}</div>
        ${overviewText && atLeast('sma') ? sourceDescription(overviewText) : ''}</article>
      <div class="overview-invites">
        <button type="button" class="card invitation" data-panel-button="map">${icon('map')}<div><h3>${s.whereFound}</h3><p>${s.interactiveMap}</p></div></button>
        <button type="button" class="card invitation" data-panel-button="study">${icon('book')}<div><h3>${s.worksheet}</h3><p>${sp ? s.quickQuiz : s.forClass}</p></div></button>
      </div>
      <details class="source-disclosure"><summary>${s.sourcesNotes}</summary><p>${s.updatedNote}</p>${x.source === 'iNaturalist' ? `<p>${gbif ? s.exactJoin : s.noJoin}</p>` : ''}
        <ul class="source-list">${gbif ? `<li>${link(`https://www.gbif.org/species/${gbif}`, `GBIF · ${name}`)}</li>` : ''}${inatId ? `<li>${link(`https://www.inaturalist.org/taxa/${Number(inatId)}`, 'iNaturalist')}</li>` : ''}<li>${link(`https://${lang}.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(name)}`, 'Wikipedia')}</li></ul>
        ${data.failed?.length ? `<p>${s.partial}</p>` : ''}</details>
    </div>
    <aside class="taxonomy-aside"><span class="eyebrow">${ui.tree}</span><ol class="taxonomy-list">${classification}</ol></aside></div>
  </section>

  ${
    atLeast('smp')
      ? `<section id="panel-facts" class="dossier-panel" data-panel="facts" role="tabpanel" aria-labelledby="tab-facts" hidden>
    <div class="section-head"><h2>${s.known}</h2><span class="source-meta">${s.updatedNote}</span></div>
    <section class="card conservation-card"><h3>${s.conservation}</h3>${status ? `<p class="status-explain tone-${status.tone}">${status.icon} <strong>${esc(status.name)} (${esc(status.code)})</strong> — ${esc(status.kid)}</p><small class="source-meta">${esc(status.authority)}${status.place ? ` · ${esc(status.place)}` : ''}${inatId ? ` · ${link(`https://www.inaturalist.org/taxa/${Number(inatId)}`, ui.read)}` : ''}</small>` : `<p class="muted">${s.conservationUnknown}</p>`}</section>
    ${available.length ? `<div class="trait-grid">${available.map(k => `<article class="card"><h3>${esc(pick(s.cat[k]))}</h3>${descriptions[k].slice(0, 3).map(sourceDescription).join('')}</article>`).join('')}</div>` : ''}
    ${missing.length ? `<div class="missing-data"><h3>${s.stillLearning}</h3><p>${s.stillLearningText}</p><div class="specimen-tags">${missing.map(k => `<span class="tag">${esc(pick(s.cat[k]))}</span>`).join('')}</div></div>` : ''}
  </section>`
      : ''
  }

  <section id="panel-map" class="dossier-panel" data-panel="map" role="tabpanel" aria-labelledby="tab-map" hidden>
    <div class="section-head"><div><h2>${s.whereFound}</h2><p>${s.atlasIntro}</p></div><button class="btn secondary" type="button" data-map-retry>${s.mapRetry}</button></div>
    <div id="occurrence-map" class="occurrence-map"></div><div id="occurrence-table"></div>
    <details class="source-disclosure"><summary>${s.distribution}</summary><p>${s.distributionNote}</p>${
      data.distributions?.results?.length
        ? `<ul>${data.distributions.results
            .slice(0, 20)
            .map(
              d =>
                `<li>${esc(d.locality || d.country || ui.unknown)}${d.status ? ` · ${esc(d.status)}` : ''}<small> — ${esc(d.source || 'GBIF')}</small></li>`
            )
            .join('')}</ul>`
        : `<p>${ui.unknown}</p>`
    }</details>
  </section>

  <section id="panel-photos" class="dossier-panel" data-panel="photos" role="tabpanel" aria-labelledby="tab-photos" hidden>
    <div class="section-head"><h2>${pick(s.tabPhotos)} · ${fmt(photos.length)}</h2><p>${s.photosCredit}</p></div>
    ${photos.length ? `<div class="photo-gallery">${photos.map((p, i) => `<figure>${galleryStage(p, primary || name, i)}<figcaption>${esc(p.attribution)} · ${link(p.source, String(p.license).toUpperCase())}</figcaption></figure>`).join('')}</div>` : emptyState(s.imageMissing, '')}
  </section>

  <section id="panel-study" class="dossier-panel" data-panel="study" role="tabpanel" aria-labelledby="tab-study" hidden>
    ${sp ? quickQuiz(sp) : ''}${worksheet(primary || name, x.key)}
  </section>

  ${atLeast('kuliah') ? `<section id="panel-data" class="dossier-panel" data-panel="data" role="tabpanel" aria-labelledby="tab-data" hidden>${dataPanel(data, name, gbif, inatId)}</section>` : ''}
  <dialog id="photo-dialog" class="photo-dialog" aria-label="${s.enlarge}"><button type="button" class="dialog-close" data-close-dialog aria-label="${ui.close}">×</button><div id="dialog-photo"></div></dialog>`;
  showPanel(state.panel);
  refresh(main);
}

function nodeURL(node) {
  if (node.inat) return `/search?taxon=${Number(node.inat)}&tname=${encodeURIComponent(nameOf(node))}`;
  const key = Number(node.key);
  return SPECIES_RANKS.includes(node.rank) ? `/species/${key}` : `/tree/${key}`;
}

/* ---------- University data panel ---------- */
function citations(name, gbif, inatId) {
  const today = new Date().toISOString().slice(0, 10);
  const year = new Date().getFullYear();
  const list = [];
  if (gbif)
    list.push({
      key: `gbif${gbif}`,
      text: `GBIF Secretariat (2023). GBIF Backbone Taxonomy. Checklist dataset https://doi.org/10.15468/39omei accessed via GBIF.org on ${today}. Taxon: ${name} (https://www.gbif.org/species/${gbif}).`,
      url: `https://www.gbif.org/species/${gbif}`,
      title: `${name} in GBIF Backbone Taxonomy`,
      org: 'GBIF Secretariat',
      doi: '10.15468/39omei',
    });
  if (inatId)
    list.push({
      key: `inat${inatId}`,
      text: `iNaturalist contributors (${year}). ${name}. iNaturalist. https://www.inaturalist.org/taxa/${inatId}. Accessed ${today}.`,
      url: `https://www.inaturalist.org/taxa/${inatId}`,
      title: `${name} taxon page`,
      org: 'iNaturalist',
    });
  list.push({
    key: 'biotaloka',
    text: `Biotaloka · Asadin Edu (${year}). ${name}. ${location.href}. Accessed ${today}.`,
    url: location.href,
    title: `${name} — Biotaloka`,
    org: 'Asadin Edu',
  });
  return list.map(c => ({ ...c, today, year }));
}

function dataPanel(data, name, gbif, inatId) {
  const x = data.taxon;
  const q = encodeURIComponent(name);
  const dbs = [
    gbif && ['GBIF', `https://www.gbif.org/species/${gbif}`],
    inatId && ['iNaturalist', `https://www.inaturalist.org/taxa/${inatId}`],
    ['Catalogue of Life', `https://www.catalogueoflife.org/data/search?q=${q}`],
    ['NCBI Taxonomy', `https://www.ncbi.nlm.nih.gov/taxonomy/?term=${q}`],
    ['NCBI GenBank', `https://www.ncbi.nlm.nih.gov/nuccore/?term=${q}%5BOrganism%5D`],
    ['BOLD Systems', `https://portal.boldsystems.org/result?query=${q}`],
    ['IUCN Red List', `https://www.iucnredlist.org/search?query=${q}`],
    ['Open Tree of Life', `https://tree.opentreeoflife.org/taxonomy/browse?name=${q}`],
    ['Biodiversity Heritage Library', `https://www.biodiversitylibrary.org/search?searchTerm=${q}`],
    ['Google Scholar', `https://scholar.google.com/scholar?q=%22${q}%22`],
  ].filter(Boolean);
  const cites = citations(name, gbif, inatId);
  return `<div class="data-grid">
    <section class="card"><h3>${s.identifiers}</h3><dl class="kv">
      <div><dt>${ui.species}</dt><dd><em>${esc(name)}</em></dd></div>
      <div><dt>${s.authorship}</dt><dd>${esc(x.authorship || x.scientificName || '—')}</dd></div>
      <div><dt>${s.status}</dt><dd>${esc(x.taxonomicStatus || '—')}${x.nameType ? ` · ${esc(x.nameType)}` : ''}</dd></div>
      <div><dt>GBIF key</dt><dd>${gbif ? esc(gbif) : '—'}</dd></div>
      <div><dt>iNaturalist ID</dt><dd>${inatId ? esc(inatId) : '—'}</dd></div>
    </dl><h4>${s.synonyms}</h4><div id="synonyms">${gbif ? `<p class="muted">${ui.loading}</p>` : `<p class="muted">—</p>`}</div></section>
    <section class="card"><h3>${s.cite}</h3><p class="muted">${s.citeNote}</p><ol class="citations">${cites.map(c => `<li>${esc(c.text)}</li>`).join('')}</ol>
      <div class="actions"><button type="button" class="btn secondary" data-copy-citation>${icon('link')} ${s.copyCitation}</button><button type="button" class="btn secondary" data-bibtex>${icon('download')} ${s.bibtex}</button><button type="button" class="btn secondary" data-ris>${icon('download')} ${s.ris}</button></div></section>
    <section class="card"><h3>CSV</h3><p class="muted">${s.csvNote}</p><div class="actions"><button type="button" class="btn secondary" data-csv>${icon('download')} ${s.csv}</button>${gbif ? link(`https://www.gbif.org/occurrence/search?taxon_key=${gbif}`, s.gbifDownload, { cls: 'btn ghost' }) : ''}</div></section>
    <section class="card"><h3>${s.databases}</h3><ul class="source-list">${dbs.map(([label, url]) => `<li>${link(url, label)}</li>`).join('')}</ul></section>
  </div>`;
}

async function loadSynonyms(gbif) {
  const box = $('#synonyms');
  if (!box || box.dataset.loaded) return;
  box.dataset.loaded = 'true';
  try {
    const data = await API.synonyms(gbif);
    const list = data.results || [];
    box.innerHTML = list.length
      ? `<ul class="plain-list">${list
          .slice(0, 30)
          .map(
            x => `<li><em>${esc(x.scientificName)}</em> <small>${esc(x.taxonomicStatus || '')}</small></li>`
          )
          .join('')}</ul>`
      : `<p class="muted">${s.noSynonyms}</p>`;
  } catch {
    box.innerHTML = `<p class="muted">${ui.error}</p>`;
  }
}

/* ---------- Panels, map and photo dialog ---------- */
function showPanel(panel) {
  if (!$(`[data-panel="${panel}"]`)) panel = 'overview';
  state.panel = panel;
  $$('[data-panel]').forEach(node => (node.hidden = node.dataset.panel !== panel));
  $$('[role=tab]').forEach(node => {
    const selected = node.dataset.panelButton === panel;
    node.setAttribute('aria-selected', String(selected));
    node.tabIndex = selected ? 0 : -1;
  });
  if (panel === 'map' && state.data) loadMap(state.data, state.token);
  if (panel === 'data' && state.data) {
    const gbif =
      state.data.gbifKey || (!String(state.data.taxon.key).startsWith('inat-') ? state.data.taxon.key : null);
    if (gbif) loadSynonyms(gbif);
  }
}

function destroyMap() {
  state.mapView?.destroy();
  state.mapView = null;
  state.mapHost = null;
}

async function loadMap(data, token, force = false) {
  const host = $('#occurrence-map');
  if (!host) return;
  if (state.mapHost === host && !force) return;
  destroyMap();
  state.mapHost = host;
  const view = await createOccurrenceMap(host, lang).catch(() => null);
  if (token !== state.token || !host.isConnected || state.mapHost !== host) {
    view?.destroy();
    return;
  }
  state.mapView = view;
  if (!view) {
    host.innerHTML = notice(s.loadFailed);
    return;
  }
  try {
    const records = await API.occurrences(data);
    if (token !== state.token || !host.isConnected || state.mapView !== view) return;
    state.occurrences = records;
    view.update(records);
    $('#occurrence-table').innerHTML = records.results?.length
      ? `<details class="source-disclosure"><summary>${s.records}</summary><div class="table-wrap"><table><thead><tr><th>${s.place}</th><th>${s.date}</th><th>${s.source}</th></tr></thead><tbody>${records.results
          .slice(0, 12)
          .map(
            p =>
              `<tr><td>${esc(p.country || ui.unknown)}</td><td>${esc(p.eventDate ? String(p.eventDate).slice(0, 10) : ui.unknown)}</td><td>${link(recordURL(records.provider, p.key), `${records.provider} #${p.key}`)}</td></tr>`
          )
          .join('')}</tbody></table></div></details>`
      : '';
  } catch {
    if (token === state.token && state.mapView === view) view.error();
  }
}

const recordURL = (provider, key) =>
  provider === 'iNaturalist'
    ? `https://www.inaturalist.org/observations/${Number(key)}`
    : `https://www.gbif.org/occurrence/${Number(key)}`;

function openPhoto(index) {
  const photo = photoList(state.data)[index];
  const dialog = $('#photo-dialog');
  if (!photo || !dialog) return;
  $('#dialog-photo').innerHTML =
    `<img src="${esc(photo.large)}" data-fallback="${esc(photo.medium)}" alt="${esc(nameOf(state.data.taxon))}"><p>${esc(photo.attribution)} · ${link(photo.source, String(photo.license).toUpperCase())}</p>`;
  bindImageFallbacks(dialog);
  dialog.showModal();
}

async function occurrenceCSV() {
  const data = state.occurrences || (await API.occurrences(state.data));
  state.occurrences = data;
  const header = [
    'provider',
    'record_id',
    'decimalLatitude',
    'decimalLongitude',
    'place',
    'eventDate',
    'coordinateUncertaintyInMeters',
    'source_url',
  ];
  const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = (data.results || []).map(p =>
    [
      data.provider,
      p.key,
      p.decimalLatitude,
      p.decimalLongitude,
      p.country,
      p.eventDate,
      p.coordinateUncertaintyInMeters,
      recordURL(data.provider, p.key),
    ]
      .map(cell)
      .join(',')
  );
  download(
    `${nameOf(state.data.taxon).replace(/\s+/g, '_')}_occurrences_sample.csv`,
    [header.join(','), ...rows].join('\n'),
    'text/csv'
  );
}

function exportCitations(kind) {
  const x = state.data.taxon;
  const name = nameOf(x);
  const gbif = state.data.gbifKey || (!String(x.key).startsWith('inat-') ? x.key : null);
  const list = citations(name, gbif, state.data.photo?.taxon?.id);
  if (kind === 'bib') {
    const bib = list
      .map(
        c =>
          `@misc{${c.key},\n  author = {{${c.org}}},\n  title = {${c.title}},\n  year = {${c.year}},\n  howpublished = {\\url{${c.url}}},${c.doi ? `\n  doi = {${c.doi}},` : ''}\n  note = {Accessed ${c.today}}\n}`
      )
      .join('\n\n');
    download(`${name.replace(/\s+/g, '_')}.bib`, bib, 'application/x-bibtex');
  } else {
    const ris = list
      .map(
        c =>
          `TY  - ELEC\nAU  - ${c.org}\nTI  - ${c.title}\nPY  - ${c.year}\nUR  - ${c.url}\n${c.doi ? `DO  - ${c.doi}\n` : ''}Y2  - ${c.today}\nER  - `
      )
      .join('\n');
    download(`${name.replace(/\s+/g, '_')}.ris`, ris, 'application/x-research-info-systems');
  }
}

export async function render(ctx) {
  const { id, params, main } = ctx;
  if (!/^(inat-)?\d+$/.test(id || '')) {
    navigate('/search', { replace: true });
    return;
  }
  // Re-rendering the same route (e.g. after a language change) keeps the open tab.
  const sameRoute = state.url === currentURL();
  state = {
    url: currentURL(),
    data: null,
    panel: (sameRoute && state.panel) || params.get('tab') || 'overview',
    mapView: null,
    mapHost: null,
    curated: null,
    occurrences: null,
    token: ctx.token,
  };
  ctx.cleanup(destroyMap);

  ctx.on('click', '[data-panel-button]', (e, b) => showPanel(b.dataset.panelButton));
  ctx.on('click', '[data-photo]', (e, b) => openPhoto(Number(b.dataset.photo)));
  ctx.on('click', '[data-map-retry]', () => state.data && loadMap(state.data, state.token, true));
  ctx.on('click', '[data-save]', (e, b) => {
    const x = state.data?.taxon;
    if (!x) return;
    const saved = toggleSaved({
      key: x.key,
      name: nameOf(x),
      common: state.curated ? pick(state.curated.name) : state.data.photo?.taxon?.preferred_common_name || '',
      kingdom: x.kingdom || '',
      photo: photoList(state.data)[0]?.medium || '',
    });
    if (saved === null) return toast(ui.storageFail);
    b.textContent = saved ? `✓ ${ui.unsave}` : `＋ ${ui.save}`;
    b.setAttribute('aria-pressed', String(saved));
    toast(ui.savedToast);
  });
  ctx.on('click', '[data-quick-answer]', (e, b) => {
    const fs = b.closest('.quiz-q');
    if (fs.dataset.done) return;
    fs.dataset.done = 'true';
    const right = b.dataset.quickAnswer === fs.dataset.correct;
    b.classList.add(right ? 'right' : 'wrong');
    fs.querySelectorAll('.quiz-option').forEach(o => {
      o.disabled = true;
      if (o.dataset.quickAnswer === fs.dataset.correct) o.classList.add('right');
    });
    fs.querySelector('.quiz-feedback').textContent = right
      ? `🎉 ${s.correct}`
      : `${s.wrong} ${fs.dataset.correct}`;
  });
  ctx.on('click', '[data-csv]', () => occurrenceCSV().catch(() => toast(ui.error)));
  ctx.on('click', '[data-bibtex]', () => exportCitations('bib'));
  ctx.on('click', '[data-ris]', () => exportCitations('ris'));
  ctx.on('click', '[data-copy-citation]', async () => {
    const text = $$('.citations li')
      .map(li => li.textContent)
      .join('\n');
    toast((await copyText(text)) ? ui.copied : ui.error);
  });
  ctx.on('keydown', '[role=tab]', (event, tab) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = $$('[role=tab]');
    const i = tabs.indexOf(tab);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus();
    showPanel(tabs[next].dataset.panelButton);
  });

  main.innerHTML = crumbs() + loading();
  const seed = await API.seed(id);
  if (!ctx.isCurrent()) return;
  if (!SPECIES_RANKS.includes(seed.taxon.rank)) {
    navigate(
      String(id).startsWith('inat-')
        ? routeURL('search', { taxon: id.slice(5), tname: nameOf(seed.taxon) })
        : `/tree/${seed.taxon.acceptedKey || seed.taxon.key}`,
      { replace: true }
    );
    return;
  }
  state.curated = findSpecies({
    id,
    sci: nameOf(seed.taxon),
    inat: seed.photo?.taxon?.id,
    gbif: String(id).startsWith('inat-') ? null : id,
  });
  state.data = seed;
  document.title = `${state.curated ? pick(state.curated.name) : nameOf(seed.taxon)} · Biotaloka`;
  renderPage(seed, false);
  try {
    const enriched = await API.enrich(seed, { inatId: state.curated?.inat });
    if (!ctx.isCurrent()) return;
    if (!state.curated)
      state.curated = findSpecies({
        sci: nameOf(enriched.taxon),
        inat: enriched.photo?.taxon?.id,
        gbif: enriched.gbifKey,
      });
    state.data = enriched;
    trackSpecies({
      key: enriched.taxon.key,
      name: nameOf(enriched.taxon),
      kingdom: enriched.taxon.kingdom || '',
    });
    renderPage(enriched, false);
    const wiki = await API.wikipedia(nameOf(enriched.taxon), enriched.photo?.taxon?.wikipedia_url).catch(
      () => null
    );
    if (!ctx.isCurrent()) return;
    enriched.wiki = wiki;
    const summary = $('#wiki-summary');
    if (summary) summary.innerHTML = wikiHTML(wiki);
    $('#dossier-status')?.remove();
  } catch (error) {
    if (!ctx.isCurrent()) return;
    const status = $('#dossier-status');
    if (status)
      status.innerHTML = `${s.loadFailed} <button class="chip" type="button" data-retry>${ui.retry}</button>`;
    console.warn('Biotaloka species enrichment failed:', error);
  }
}
