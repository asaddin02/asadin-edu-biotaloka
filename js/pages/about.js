import { config } from '../config.js';
import { link } from '../core/dom.js';
import { S, pick } from '../core/prefs.js';
import { usingProxy } from '../services/api.js';
import { pageHead, notice, sectionNav } from '../components/common.js';

const s = S({
  title: ['Sumber & metode', 'Sources & methods'],
  heading: ['Rasa ingin tahu membutuhkan sumber yang baik.', 'Curiosity deserves good sources.'],
  sub: [
    'Biotaloka membaca data terbuka saat dibutuhkan dan memadukannya dengan materi kurasi. Tidak ada klaim bahwa semua spesies bumi sudah dikenal atau memiliki data lengkap.',
    'Biotaloka reads open data on demand and combines it with curated lessons. It does not claim that every species is known or fully documented.',
  ],
  sources: ['Sumber data', 'Data sources'],
  gbif: [
    'Klasifikasi, nama, deskripsi, dan catatan temuan. Satu tulang punggung klasifikasi menjaga navigasi konsisten; katalog lain dapat berbeda.',
    'Classification, names, descriptions and occurrences. One backbone keeps navigation consistent; other catalogues may differ.',
  ],
  inat: [
    'Foto berlisensi terbuka beserta atribusi, nama Indonesia, pencarian nama, dan pengamatan warga di Indonesia maupun dunia.',
    'Openly licensed photos with credits, Indonesian names, name search and community observations in Indonesia and worldwide.',
  ],
  wiki: [
    'Ringkasan dalam bahasa yang dipilih bila tersedia. Teks bahasa Inggris diberi label; isi eksternal tidak diterjemahkan otomatis.',
    'Summaries in the selected language when available. English text is labelled; external text is not machine-translated.',
  ],
  pbdb: [
    'Rentang umur catatan fosil untuk halaman Kehidupan purba.',
    'Fossil-record age ranges for the Prehistoric life page.',
  ],
  anage: [
    'Umur terpanjang yang pernah tercatat pada kartu hewan kurasi (Human Ageing Genomic Resources, CC BY 3.0).',
    'Longest recorded lifespans on curated animal cards (Human Ageing Genomic Resources, CC BY 3.0).',
  ],
  curated: ['Konten kurasi Biotaloka', 'Biotaloka curated content'],
  curatedText: [
    '111 kartu spesies, 12 materi dengan kuis dan catatan guru, lebih dari 100 istilah kamus, dan 29 makhluk purba ditulis dalam bahasa sederhana dari sumber terbuka. Konten ini berlisensi CC BY-SA 4.0 dan terbuka untuk koreksi.',
    '111 species cards, 12 lessons with quizzes and teacher notes, over 100 glossary terms and 29 prehistoric organisms, written in plain language from open sources. This content is licensed CC BY-SA 4.0 and open to corrections.',
  ],
  limits: ['Cakupan & keterbatasan', 'Coverage & limitations'],
  limitsText: [
    'Jumlah hasil adalah jumlah catatan pada indeks yang dipilih, bukan jumlah semua makhluk hidup. Titik di peta adalah sampel temuan, bukan batas sebaran. Layanan daring dapat berubah atau tidak tersedia. Bidang yang kosong ditandai, bukan diisi dengan angka buatan.',
    'Result counts are records in the chosen index, not all life on Earth. Map points are sample occurrences, not range limits. Online services may change or be unavailable. Missing fields are marked, not filled with invented values.',
  ],
  domains: [
    'Tiga domain adalah model pengantar yang umum. Penelitian filogenomik juga mendukung model dua domain yang menempatkan eukariota di dalam Archaea. Tidak semua arkea ekstremofil, dan “Protista” bukan satu kelompok alami.',
    'The three domains are a common introductory model. Phylogenomic research also supports a two-domain model with eukaryotes inside Archaea. Not all archaea are extremophiles, and “Protista” is not a natural group.',
  ],
  privacy: ['Privasi', 'Privacy'],
  licensing: ['Lisensi', 'Licensing'],
  licensingText: [
    'Kode sumber: MIT. Konten kurasi: CC BY-SA 4.0. Foto dan data eksternal mengikuti lisensi penyedianya dan atribusinya selalu ditampilkan. Foto beranda berlisensi CC0, CC BY, atau CC BY-SA.',
    'Source code: MIT. Curated content: CC BY-SA 4.0. External photos and data keep their providers’ licences and credits are always shown. Home-page photos are CC0, CC BY or CC BY-SA.',
  ],
  mediaPolicy: ['Kebijakan foto saat ini', 'Current photo policy'],
  mediaNC: [
    'foto berlisensi non-komersial (NC) ikut ditampilkan karena Biotaloka gratis.',
    'non-commercial (NC) photos are shown because Biotaloka is free.',
  ],
  mediaSafe: [
    'hanya foto CC0, CC BY, dan CC BY-SA yang ditampilkan.',
    'only CC0, CC BY and CC BY-SA photos are shown.',
  ],
  technical: ['Informasi teknis', 'Technical information'],
  version: ['Versi', 'Version'],
  proxy: ['Mode data', 'Data mode'],
  proxyOn: ['melalui server perantara dengan cache', 'through the caching proxy server'],
  proxyOff: ['langsung dari peramban ke penyedia data', 'directly from the browser to data providers'],
  feedback: ['Laporkan kesalahan atau beri saran', 'Report a mistake or suggest an improvement'],
  code: ['Kode sumber', 'Source code'],
  references: ['Rujukan ilmiah', 'Scientific references'],
});

export const title = () => s.title;

const PRIVACY = [
  ['Tidak ada akun, iklan, pelacak, atau analitik.', 'No accounts, ads, trackers or analytics.'],
  [
    'Koleksi, catatan, progres, lencana, dan buku eksperimen disimpan hanya di peramban ini (localStorage). Kamu bisa mengekspor atau menghapusnya di halaman Koleksi.',
    'Collection, notes, progress, badges and experiment notebook are stored only in this browser (localStorage). You can export or delete them on the Collection page.',
  ],
  [
    'Kata pencarian dan nama spesies dikirim ke GBIF, iNaturalist, Wikipedia, atau PBDB untuk mengambil data.',
    'Search words and species names are sent to GBIF, iNaturalist, Wikipedia or PBDB to fetch data.',
  ],
  [
    'Fitur “Di sekitarku” membulatkan lokasi sekitar 1 km sebelum dikirim ke iNaturalist, dan tidak menyimpannya.',
    '“Near me” rounds your location to about 1 km before sending it to iNaturalist, and does not store it.',
  ],
  [
    'Fitur “Bacakan” memakai mesin suara bawaan perangkat.',
    '“Read aloud” uses your device’s built-in speech engine.',
  ],
];

export async function render(ctx) {
  const card = (name, text, url) =>
    `<article class="card"><h3>${name}</h3><p>${text}</p>${link(url, name)}</article>`;
  ctx.main.innerHTML = `${pageHead(s.heading, s.sub, 'BIOTALOKA / SUMBER')}
    <div class="about-workspace">${sectionNav([
      ['about-sources', s.sources],
      ['about-curated', s.curated],
      ['about-limits', s.limits],
      ['privasi', s.privacy],
      ['about-license', s.licensing],
    ])}<div class="about-content"><h2 class="list-title" id="about-sources">${s.sources}</h2>
    <div class="grid">
      ${card('GBIF', s.gbif, 'https://www.gbif.org/')}
      ${card('iNaturalist', s.inat, 'https://www.inaturalist.org/')}
      ${card('Wikipedia', s.wiki, 'https://www.wikipedia.org/')}
      ${card('Paleobiology Database', s.pbdb, 'https://paleobiodb.org/')}
      ${card('AnAge', s.anage, 'https://genomics.senescence.info/species/')}
    </div>
    <section class="section" id="about-curated"><h2>${s.curated}</h2><p>${s.curatedText}</p>${config.feedbackURL ? `<p>${link(config.feedbackURL, s.feedback, { cls: 'btn secondary' })}</p>` : ''}</section>
    <section class="section" id="about-limits"><h2>${s.limits}</h2><p>${s.limitsText}</p>${notice(s.domains)}
      <h3>${s.references}</h3><ul class="source-list">
        <li>${link('https://doi.org/10.1073/pnas.87.12.4576', 'Woese, Kandler & Wheelis (1990) · Towards a natural system of organisms')}</li>
        <li>${link('https://doi.org/10.1038/nature12779', 'Williams et al. (2013) · An archaeal origin of eukaryotes supports only two primary domains of life')}</li>
        <li>${link('https://doi.org/10.15468/39omei', 'GBIF Secretariat · GBIF Backbone Taxonomy')}</li>
        <li>${link('https://openstax.org/details/books/biology-2e', 'OpenStax · Biology 2e (CC BY 4.0)')}</li>
      </ul></section>
    <section class="section" id="privasi"><h2>🔒 ${s.privacy}</h2><ul class="tip-list">${PRIVACY.map(p => `<li>${pick(p)}</li>`).join('')}</ul></section>
    <section class="section" id="about-license"><h2>${s.licensing}</h2><p>${s.licensingText}</p><p><strong>${s.mediaPolicy}:</strong> ${config.allowNonCommercialMedia ? s.mediaNC : s.mediaSafe}</p></section>
    <section class="section"><h2>${s.technical}</h2><dl class="kv"><div><dt>${s.version}</dt><dd>${config.version}</dd></div><div><dt>${s.proxy}</dt><dd>${usingProxy() ? s.proxyOn : s.proxyOff}</dd></div></dl>${config.repositoryURL ? `<p>${link(config.repositoryURL, s.code)}</p>` : ''}</section></div></div>`;
}
