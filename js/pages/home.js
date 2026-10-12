import { esc, dayNumber } from '../core/dom.js';
import { navigate } from '../core/router.js';
import { S, pick, levelChosen, level, role } from '../core/prefs.js';
import { ui } from '../i18n/ui.js';
import { TOPICS, FIELDS } from '../data/topics/index.js';
import { featured } from '../data/featured.js';
import { icon, brandImage } from '../components/icons.js';
import { modeOptions } from '../components/layout.js';
import { listenButton } from '../components/common.js';
import { suggestField } from '../components/suggest.js';
import { curatedPhoto, photoMarkup } from '../services/media.js';
import { rich } from '../components/richtext.js';
import { refresh } from '../components/cards.js';

const s = S({
  title: ['Beranda', 'Home'],
  heroTop: ['ATLAS KEHIDUPAN TERBUKA', 'AN OPEN ATLAS OF LIFE'],
  hero: ['Dunia hidup.<br><em>Rasa ingin tahu.</em>', 'Life on Earth.<br><em>Endless wonder.</em>'],
  heroSub: [
    'Kenali makhluk hidup, temukan hubungan di alam, dan belajar lewat eksperimen. Petualangan biologi dimulai dari rasa ingin tahumu.',
    'Meet living things, discover connections in nature, and learn through experiments. Your biology adventure starts with curiosity.',
  ],
  searchQuick: ['Cari makhluk hidup atau materi…', 'Find an organism or lesson…'],
  searchGo: ['Cari', 'Search'],
  exploreBtn: ['Jelajahi kehidupan', 'Explore life'],
  heroNote: ['3 domain · jutaan spesies · 2 bahasa', '3 domains · millions of species · 2 languages'],
  modeTop: ['MULAI DI SINI', 'START HERE'],
  modeTitle: ['Siapa yang sedang belajar?', 'Who is learning today?'],
  modeText: [
    'Pilih mode agar bahasa, ukuran huruf, dan kegiatan sesuai jenjangmu. Bisa diganti kapan saja lewat tombol mode di atas.',
    'Choose a mode so wording, text size and activities fit your level. Change it anytime with the mode button above.',
  ],
  today: ['SPESIES HARI INI', 'SPECIES OF THE DAY'],
  todayMore: ['Kenali lebih jauh', 'Meet it'],
  funFact: ['Fakta seru', 'Fun fact'],
  todayLoading: ['Menyiapkan spesies hari ini…', 'Preparing today’s species…'],
  featuredTop: ['KENALAN PERTAMA', 'FIRST ENCOUNTERS'],
  featuredTitle: ['Keajaiban dari Nusantara', 'Wonders of the archipelago'],
  featuredSub: [
    'Satwa, tumbuhan, dan jamur yang menunggu untuk dikenal.',
    'Animals, plants and fungi waiting to be discovered.',
  ],
  viewAll: ['Jelajahi semua', 'Explore everything'],
  doTop: ['MAU BELAJAR APA HARI INI?', 'WHAT WILL YOU LEARN TODAY?'],
  doTitle: ['Belajar dengan mencoba', 'Learn by doing'],
  lessons: ['Materi pelajaran', 'Lessons'],
  lessonsText: [
    '{n} materi dalam {fields} bidang, sesuai jenjangmu.',
    '{n} lessons across {fields} fields, adapted to your level.',
  ],
  biomap: ['Peta Biologi', 'Map of Biology'],
  quiz: ['Kuis & tebak foto', 'Quizzes & photo game'],
  quizText: ['Uji dirimu dan kumpulkan lencana.', 'Test yourself and earn badges.'],
  compare: ['Bandingkan dua spesies', 'Compare two species'],
  compareText: ['Seberapa dekat harimau dengan kucing?', 'How close is a tiger to a cat?'],
  nearby: ['Di sekitarku', 'Near me'],
  nearbyText: ['Makhluk hidup yang pernah ditemukan di dekatmu.', 'Living things recorded near you.'],
  purba: ['Kehidupan purba', 'Prehistoric life'],
  purbaText: ['Dari trilobit sampai manusia Flores.', 'From trilobites to the Flores people.'],
  lab: ['Laboratorium virtual', 'Virtual laboratory'],
  labText: [
    'Fotosintesis, pewarisan sifat, seleksi alam, dan lainnya.',
    'Photosynthesis, heredity, natural selection and more.',
  ],
  journey: ['DARI KELOMPOK BESAR KE SPESIES', 'FROM BROAD GROUPS TO SPECIES'],
  journeyTitle: ['Semua terhubung dalam pohon kehidupan.', 'All connected in the tree of life.'],
  journeyText: [
    'Telusuri satu cabang setiap langkah, dari domain sampai spesies.',
    'Follow one branch at a time, from domain to species.',
  ],
  what: ['Apa itu BioTaxa?', 'What is BioTaxa?'],
  whatText: [
    'BioTaxa adalah ruang belajar keanekaragaman hayati yang gratis dan terbuka. Data langsung dari GBIF, iNaturalist, Wikipedia, dan Paleobiology Database dipadukan dengan materi kurasi berbahasa sederhana.',
    'BioTaxa is a free, open space to learn about biodiversity. Live data from GBIF, iNaturalist, Wikipedia and the Paleobiology Database is combined with curated, plain-language lessons.',
  ],
  sourcesLine: ['Nama & data mengikuti sumber terbuka', 'Names & data follow open sources'],
  teacherTop: ['UNTUK GURU', 'FOR TEACHERS'],
  teacherTitle: ['Siapkan pelajaran dalam hitungan menit', 'Prepare a lesson in minutes'],
  teacherText: [
    'Modul ajar per topik, kunci jawaban, dan tugas yang bisa dibagikan lewat tautan — tanpa akun.',
    'Lesson plans per topic, answer keys and assignments shared by link — no account needed.',
  ],
  teacherBtn: ['Buka Mode Guru', 'Open Teacher mode'],
  support: ['Suka belajar di BioTaxa?', 'Enjoy learning with BioTaxa?'],
  supportText: [
    'Bantu ruang belajar ini terus berkembang. Dukungan bersifat sukarela; belajar tetap gratis.',
    'Help this learning space grow. Support is voluntary; learning stays free.',
  ],
  examples: ['Coba telusuri', 'Try exploring'],
  ready: ['Ruang belajarmu', 'Your learning space'],
  change: ['Ganti jenjang', 'Change level'],
  continue: ['Mulai belajar', 'Start learning'],
  domain: ['Domain', 'Domain'],
  Eukarya: [
    'Sel dengan inti sejati: hewan, tumbuhan, jamur, dan banyak makhluk mikroskopis.',
    'Cells with a true nucleus: animals, plants, fungi and many microscopic organisms.',
  ],
  Bacteria: [
    'Bersel tunggal tanpa inti bermembran. Ada di tanah, air, dan tubuh kita.',
    'Single cells without a membrane-bound nucleus, in soil, water and our bodies.',
  ],
  Archaea: [
    'Tanpa inti bermembran, dengan ciri molekuler khas. Dari laut hingga sumber air panas.',
    'No membrane-bound nucleus, with distinctive molecular features. From oceans to hot springs.',
  ],
});

export const title = () => s.title;

function heroTile(item, cls) {
  const photo = { large: item.image, medium: item.image, attribution: item.credit };
  return `<a class="hero-photo ${cls}" href="/species/${esc(item.id)}"><img src="${esc(item.image)}" alt="${esc(pick(item.name))}" width="${item.width}" height="${item.height}"${cls === 'hero-primary' ? ' fetchpriority="high"' : ' loading="lazy"'}>
    <span class="hero-photo-caption"><strong>${esc(pick(item.name))}</strong><em>${esc(item.sci)}</em></span><span class="photo-credit">${esc(photo.attribution)}</span></a>`;
}

function featuredCard(item) {
  return `<article class="discovery-card"><a href="/species/${esc(item.id)}" class="discovery-link">
    <div class="media-frame"><img src="${esc(item.image)}" alt="${esc(pick(item.name))}" loading="lazy" width="${item.width}" height="${item.height}"><span class="photo-credit">${esc(item.credit)}</span></div>
    <div class="discovery-body"><h3>${esc(pick(item.name))}</h3><p class="latin">${esc(item.sci)}</p></div></a>
    <a class="image-license" href="${esc(item.source)}" target="_blank" rel="noopener noreferrer">${esc(item.license.toUpperCase())} ↗</a></article>`;
}

function actionCard(href, iconName, title, text, tone) {
  return `<a class="action-card tone-${tone}" href="${href}"><span class="action-icon">${icon(iconName)}</span><span><strong>${esc(title)}</strong><small>${esc(text)}</small></span></a>`;
}

const DOMAINS = [
  { id: 'Eukarya', art: 0 },
  { id: 'Bacteria', art: 1 },
  { id: 'Archaea', art: 2 },
];
export function domainCards(labelOpen = ui.open) {
  return `<div class="grid domain-grid">${DOMAINS.map(
    (
      d,
      i
    ) => `<a href="/tree/${d.id}" class="card domain-card"><span class="eyebrow">0${i + 1} / ${s.domain.toUpperCase()}</span>
      <div class="domain-art domain-art-${d.art}" aria-hidden="true"><i></i><i></i><i></i><span data-n="0${i + 1}"></span></div>
      <h3>${d.id}</h3><p>${s[d.id]}</p><div class="card-link">${esc(labelOpen)} ${d.id}${icon('arrow')}</div></a>`
  ).join('')}</div>`;
}

export async function render(ctx) {
  const [main1, bird, moth, ...rest] = featured;
  const hero = `<section class="hero">
    <div class="hero-copy">
      <span class="eyebrow pill"><i class="live-dot"></i>${s.heroTop}</span>
      <h1>${s.hero}</h1>
      <p>${s.heroSub}</p>
      <form class="hero-search" id="hero-search" role="search">
        <span aria-hidden="true">${icon('search')}</span>
        ${suggestField({ id: 'hero-q', placeholder: s.searchQuick, label: ui.search })}
        <button type="submit" class="btn accent">${s.searchGo}</button>
      </form>
      <div class="search-examples"><span>${s.examples}</span><a href="/search?q=orangutan">Orangutan</a><a href="/search?q=Rafflesia">Rafflesia</a><a href="/search?q=jamur">${pick(['Jamur', 'Fungi'])}</a></div>
      <div class="hero-links"><a class="btn" href="/search">${s.exploreBtn} ${icon('arrow')}</a><a class="text-link" href="/tree">${ui.tree} →</a><a class="text-link" href="/peta">${s.biomap} →</a></div>
      <p class="hero-footnote">${s.heroNote}</p>
    </div>
    <div class="hero-mosaic"><div class="atlas-grid" aria-hidden="true"></div>${heroTile(main1, 'hero-primary')}${heroTile(bird, 'hero-secondary')}${heroTile(moth, 'hero-tertiary')}
      <div class="explorer-seal" aria-hidden="true">${brandImage()}<span>STAY<br>CURIOUS</span></div></div>
  </section>`;

  const modeStrip = levelChosen
    ? `<section class="learning-welcome"><div><span class="eyebrow">${s.ready}</span><h2>${role === 'teacher' ? ui.teacher + ' · ' : ''}${ui[`${level}Long`]}</h2><p>${ui[`${level}Hint`]}</p></div><div class="actions"><button type="button" class="btn secondary" data-open-mode>${s.change}</button><a class="btn" href="${role === 'teacher' ? '/guru' : '/learn'}">${s.continue} ${icon('arrow')}</a></div></section>`
    : `<section class="mode-strip" aria-labelledby="mode-strip-title"><div><span class="eyebrow">${s.modeTop}</span><h2 id="mode-strip-title">${s.modeTitle}</h2><p>${s.modeText}</p></div>${modeOptions({ compact: true })}</section>`;

  const today = `<section class="today-card" id="today" aria-live="polite"><div class="status inline"><span class="spinner" aria-hidden="true"></span> ${s.todayLoading}</div></section>`;

  const actions = `<section class="section"><div class="section-head"><div><span class="eyebrow">${s.doTop}</span><h2>${s.doTitle}</h2></div></div>
    <div class="action-grid">
      ${actionCard('/learn', 'book', s.lessons, s.lessonsText.replace('{n}', TOPICS.length).replace('{fields}', FIELDS.length), 'mint')}
      ${actionCard('/quiz', 'quiz', s.quiz, s.quizText, 'lime')}
      ${actionCard('/compare', 'compare', s.compare, s.compareText, 'lilac')}
      ${actionCard('/nearby', 'nearby', s.nearby, s.nearbyText, 'sky')}
      ${actionCard('/purba', 'fossil', s.purba, s.purbaText, 'apricot')}
      ${actionCard('/lab', 'lab', s.lab, s.labText, 'blue')}
    </div></section>`;

  const featuredSection = `<section class="section"><div class="section-head"><div><span class="eyebrow">${s.featuredTop}</span><h2>${s.featuredTitle}</h2><p>${s.featuredSub}</p></div><a class="text-link" href="/search">${s.viewAll} →</a></div>
    <div class="discovery-grid featured-grid">${rest.map(featuredCard).join('')}</div></section>`;

  const domains = `<section class="section domains-section"><div class="section-head"><div><span class="eyebrow">${s.journey}</span><h2>${s.journeyTitle}</h2></div><p>${s.journeyText}</p></div>${domainCards()}</section>`;

  const teacher =
    role === 'teacher' || level === 'kuliah'
      ? ''
      : `<section class="teacher-banner"><div><span class="eyebrow">${s.teacherTop}</span><h2>${s.teacherTitle}</h2><p>${s.teacherText}</p><a class="btn dark" href="/guru">${s.teacherBtn} →</a></div><div class="teacher-art" aria-hidden="true">${icon('teacher')}</div></section>`;

  const about = `<section class="section learning-section"><div class="section-head"><h2>${s.what}</h2><p>${s.whatText}</p></div>
    <div class="discovery-strip"><span>${s.sourcesLine}</span><strong>GBIF</strong><strong>iNaturalist</strong><strong>Wikipedia</strong><strong>PBDB</strong><a href="/about">${ui.about} →</a></div></section>`;

  const support = `<section class="support-banner"><div><h2>${s.support}</h2><p>${s.supportText}</p></div><a class="btn secondary" href="/dukung">${ui.donate} →</a></section>`;
  ctx.main.innerHTML =
    hero + modeStrip + actions + today + featuredSection + domains + teacher + about + support;

  ctx.on('submit', '#hero-search', event => {
    event.preventDefault();
    const q = String(new FormData(event.target).get('q') || '').trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  });

  // The curated list is loaded after the page is visible.
  const { SPECIES } = await import('../data/species.js');
  if (!ctx.isCurrent()) return;
  const withPhoto = SPECIES.filter(sp => curatedPhoto(sp.photo));
  const sp = withPhoto[dayNumber() % withPhoto.length];
  const photo = curatedPhoto(sp.photo);
  const node = document.getElementById('today');
  node.innerHTML = `<div class="today-photo media-frame">${photoMarkup(photo, pick(sp.name))}</div>
    <div class="today-body" id="today-body"><span class="eyebrow">☀️ ${s.today}</span><h2>${esc(pick(sp.name))}</h2><p class="latin">${esc(sp.sci)}</p>
      <div class="today-text">${rich(pick(sp.about))}<p class="fun-fact"><strong>${s.funFact}:</strong> ${rich(pick(sp.fun), { cls: 'inline' }).replace(/^<p class="inline">|<\/p>$/g, '')}</p></div>
      <div class="actions"><a class="btn" href="/species/${esc(sp.id)}">${s.todayMore} →</a>${listenButton('#today-body', 'today')}</div></div>`;
  refresh(node);
}
