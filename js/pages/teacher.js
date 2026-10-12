import { $, esc, copyText, toast, encodeData } from '../core/dom.js';
import { S, pick, level, role, LEVELS } from '../core/prefs.js';
import { ui } from '../i18n/ui.js';
import { TOPICS, FIELDS, findTopic, loadTopic, PHASES } from '../data/topics/index.js';
import { findSpecies } from '../data/species.js';
import { pageHead, notice, sectionNav } from '../components/common.js';
import { suggestField } from '../components/suggest.js';
import { modeLabel } from '../components/layout.js';
import { icon } from '../components/icons.js';

const s = S({
  title: ['Mode Guru', 'Teacher mode'],
  heading: ['Ruang guru BioTaxa', 'BioTaxa teacher space'],
  sub: [
    'Siapkan pelajaran, bagikan tugas lewat tautan, dan unduh modul ajar. Tanpa akun dan tanpa data siswa di server.',
    'Prepare lessons, share assignments by link and print lesson plans. No accounts and no student data on a server.',
  ],
  activate: ['Aktifkan Mode Guru', 'Turn on Teacher mode'],
  activeNote: [
    'Mode Guru aktif: catatan guru dan kunci jawaban terbuka di setiap materi.',
    'Teacher mode is on: teacher notes and answer keys open on every lesson.',
  ],
  tipsTitle: ['Cara memakai BioTaxa di kelas', 'Using BioTaxa in class'],
  builder: ['Buat tugas', 'Create an assignment'],
  taskSetup: ['Identitas tugas', 'Assignment details'],
  taskMaterials: ['Bahan belajar', 'Learning materials'],
  taskReview: ['Pertanyaan & bagikan', 'Questions & sharing'],
  builderIntro: [
    'Tugas disimpan di dalam tautan itu sendiri. Siswa membuka tautan, menjawab, lalu mencetak atau menyimpan PDF untuk diserahkan.',
    'The assignment lives inside the link itself. Students open it, answer, then print or save a PDF to hand in.',
  ],
  taskTitle: ['Judul tugas', 'Assignment title'],
  taskTitleDefault: ['Tugas IPA: Mengenal makhluk hidup', 'Science task: Getting to know living things'],
  forLevel: ['Untuk jenjang', 'For level'],
  topic: ['Materi (opsional)', 'Lesson (optional)'],
  none: ['— Tanpa materi —', '— No lesson —'],
  instructions: ['Instruksi', 'Instructions'],
  instructionsDefault: [
    'Buka setiap spesies, baca kartunya, lalu jawab pertanyaan di bawah dengan kalimatmu sendiri.',
    'Open each species, read its card, then answer the questions below in your own words.',
  ],
  species: ['Spesies (maksimal 10)', 'Species (up to 10)'],
  addSpecies: ['Ketik nama spesies lalu pilih dari saran', 'Type a species name and pick a suggestion'],
  fromTopic: ['Tambahkan spesies dari materi', 'Add species from the lesson'],
  questions: ['Pertanyaan (satu per baris, maksimal 8)', 'Questions (one per line, up to 8)'],
  due: ['Batas waktu (opsional)', 'Due date (optional)'],
  generate: ['Buat tautan tugas', 'Create assignment link'],
  link: ['Tautan tugas', 'Assignment link'],
  copy: ['Salin tautan', 'Copy link'],
  open: ['Buka pratinjau', 'Open preview'],
  tooLong: [
    'Tautan cukup panjang. Kurangi jumlah pertanyaan atau spesies agar mudah dibagikan.',
    'The link is long. Remove some questions or species so it is easier to share.',
  ],
  needSomething: [
    'Tambahkan minimal satu spesies atau satu pertanyaan.',
    'Add at least one species or one question.',
  ],
  remove: ['Hapus', 'Remove'],
  plans: ['Modul ajar & kunci jawaban', 'Lesson plans & answer keys'],
  plansIntro: [
    'Setiap materi memuat tujuan, langkah kegiatan, asesmen, kaitan kurikulum, dan kunci jawaban kuis. Buka lalu tekan “Cetak modul ajar”.',
    'Every lesson includes objectives, steps, assessment, curriculum link and quiz answers. Open one and press “Print lesson plan”.',
  ],
  privacy: ['Privasi siswa', 'Student privacy'],
  privacyText: [
    'BioTaxa tidak memiliki akun dan tidak mengumpulkan jawaban siswa. Jawaban tersimpan di perangkat masing-masing sampai dicetak atau disimpan sebagai PDF.',
    'BioTaxa has no accounts and does not collect student answers. Answers stay on each device until printed or saved as PDF.',
  ],
});

export const title = () => s.title;

const TIPS = {
  sd: [
    [
      'Mulai dari “Spesies hari ini” di beranda sebagai pemantik 5 menit.',
      'Start with the home page “Species of the day” as a 5-minute hook.',
    ],
    ['Nyalakan tombol “Bacakan” untuk siswa kelas awal.', 'Use “Read aloud” for early readers.'],
    [
      'Main “Tebak siapa aku?” bersama di proyektor, lalu diskusikan fakta serunya.',
      'Play “Who am I?” together on a projector and discuss the fun facts.',
    ],
    [
      'Gunakan “Di sekitarku” untuk kegiatan mengamati di halaman sekolah.',
      'Use “Near me” for schoolyard observation.',
    ],
  ],
  smp: [
    [
      'Gunakan Pohon kehidupan untuk latihan klasifikasi bertahap.',
      'Use the Tree of life for step-by-step classification practice.',
    ],
    [
      'Tugaskan “Bandingkan” untuk dua spesies lalu minta siswa menulis persamaan dan perbedaan.',
      'Assign “Compare” for two species and ask for similarities and differences.',
    ],
    [
      'Pakai Laboratorium untuk melatih hipotesis dan variabel.',
      'Use the Laboratory to practise hypotheses and variables.',
    ],
  ],
  sma: [
    [
      'Analisis peta temuan dan diskusikan bias data citizen science.',
      'Analyse occurrence maps and discuss citizen-science data bias.',
    ],
    [
      'Gunakan simulasi seleksi alam dan pewarisan sifat sebagai data untuk laporan.',
      'Use the natural selection and heredity simulations as data for reports.',
    ],
    [
      'Minta siswa mengutip sumber dengan benar (GBIF, iNaturalist, Wikipedia).',
      'Ask students to cite sources properly (GBIF, iNaturalist, Wikipedia).',
    ],
  ],
  kuliah: [
    [
      'Aktifkan mode Kuliah untuk sinonim, sitasi BibTeX/RIS, dan unduhan CSV.',
      'Use University mode for synonyms, BibTeX/RIS citations and CSV downloads.',
    ],
    [
      'Arahkan mahasiswa ke unduhan GBIF ber-DOI untuk analisis yang dapat direproduksi.',
      'Point students to DOI-backed GBIF downloads for reproducible analysis.',
    ],
  ],
};

const DEFAULT_QUESTIONS = {
  sd: [
    [
      'Apa nama makhluk hidup ini dan di mana ia tinggal?',
      'What is this living thing called and where does it live?',
    ],
    ['Apa makanannya?', 'What does it eat?'],
    ['Tulis satu fakta seru yang kamu temukan.', 'Write one fun fact you found.'],
  ],
  smp: [
    [
      'Sebutkan klasifikasi spesies ini dari kingdom sampai genus.',
      'Give this species’ classification from kingdom to genus.',
    ],
    [
      'Bagaimana spesies ini mendapatkan energi dan berperan dalam ekosistem?',
      'How does it get energy and what is its role in the ecosystem?',
    ],
    [
      'Bandingkan dua spesies: apa persamaan dan perbedaannya?',
      'Compare two species: how are they alike and different?',
    ],
  ],
  sma: [
    [
      'Adaptasi apa yang membantu spesies ini bertahan? Kaitkan dengan seleksi alam.',
      'Which adaptations help this species survive? Link them to natural selection.',
    ],
    [
      'Analisis peta temuannya. Di mana data terkonsentrasi dan mengapa?',
      'Analyse its occurrence map. Where are records concentrated and why?',
    ],
    ['Apa status konservasinya dan ancaman utamanya?', 'What is its conservation status and main threats?'],
  ],
  kuliah: [
    [
      'Periksa status nama dan sinonim di GBIF dan Catalogue of Life.',
      'Check the name status and synonyms in GBIF and Catalogue of Life.',
    ],
    [
      'Rumuskan satu pertanyaan penelitian berbasis data temuan.',
      'Frame one research question based on occurrence data.',
    ],
    ['Tuliskan sitasi lengkap sumber data.', 'Write full citations for the data sources.'],
  ],
};

let chosen = [];
let draft = null;

function speciesChips() {
  return chosen.length
    ? `<ul class="picked-list">${chosen.map((x, i) => `<li class="chip">${esc(x.n)} <button type="button" class="icon-button" data-remove-species="${i}" aria-label="${s.remove} ${esc(x.n)}">×</button></li>`).join('')}</ul>`
    : '';
}

function defaultQuestions(l) {
  return (DEFAULT_QUESTIONS[l] || DEFAULT_QUESTIONS.smp).map(q => pick(q)).join('\n');
}

export async function render(ctx) {
  const presetTopic = findTopic(ctx.params.get('topic') || '');
  const restoreDraft = draft?.preset === (presetTopic?.id || '');
  chosen = restoreDraft ? [...draft.chosen] : [];
  const tips = TIPS[level] || TIPS.smp;
  ctx.main.innerHTML = `${pageHead(s.heading, s.sub, 'BIOTAXA / GURU')}
    ${role === 'teacher' ? notice(`✓ ${s.activeNote}`) : `<p><button type="button" class="btn" data-set-mode="teacher">${icon('teacher')} ${s.activate}</button></p>`}
    ${sectionNav([
      ['builder', s.builder],
      ['teacher-plans', s.plans],
    ])}
    <div class="teacher-workspace"><aside class="teacher-context"><div class="teacher-mode"><span class="eyebrow">${ui.mode}</span><strong>${esc(modeLabel())}</strong><button type="button" class="btn secondary" data-open-mode>${s.forLevel} →</button></div>
    <details class="teacher-tips"${matchMedia('(min-width: 801px)').matches ? ' open' : ''}><summary>${s.tipsTitle}</summary><ul class="tip-list">${tips.map(t => `<li>${esc(pick(t))}</li>`).join('')}</ul></details></aside>
    <section class="card builder" id="builder"><h2>${icon('link')} ${s.builder}</h2><p class="muted">${s.builderIntro}</p>
      <form id="assignment-form" class="form-grid">
        <div class="form-step wide"><span>01</span><h3>${s.taskSetup}</h3></div>
        <label class="field wide"><span>${s.taskTitle}</span><input name="t" maxlength="120" value="${esc(presetTopic ? pick(presetTopic.title) : s.taskTitleDefault)}"></label>
        <label class="field"><span>${s.forLevel}</span><select name="l">${LEVELS.map(l => `<option value="${l}"${l === level ? ' selected' : ''}>${esc(ui[`${l}Long`])}</option>`).join('')}</select></label>
        <label class="field"><span>${s.topic}</span><select name="tp"><option value="">${s.none}</option>${FIELDS.map(
          f =>
            `<optgroup label="${esc(pick(f.name))}">${TOPICS.filter(t => t.field === f.id)
              .map(
                t =>
                  `<option value="${t.id}"${presetTopic?.id === t.id ? ' selected' : ''}>${t.icon} ${esc(pick(t.title))}</option>`
              )
              .join('')}</optgroup>`
        ).join('')}</select></label>
        <label class="field"><span>${s.due}</span><input name="due" type="date"></label>
        <div class="form-step wide"><span>02</span><h3>${s.taskMaterials}</h3></div>
        <label class="field wide"><span>${s.instructions}</span><textarea name="i" maxlength="1500" rows="3">${esc(s.instructionsDefault)}</textarea></label>
        <div class="field wide"><span id="species-label">${s.species}</span>${suggestField({ id: 'assign-species', name: 'sp', placeholder: s.addSpecies, label: s.species, mode: 'pick', rank: 'species' })}<div id="picked">${speciesChips()}</div><button type="button" class="btn ghost small" data-from-topic>${s.fromTopic}</button></div>
        <div class="form-step wide"><span>03</span><h3>${s.taskReview}</h3></div>
        <label class="field wide"><span>${s.questions}</span><textarea name="q" rows="5" maxlength="2400">${esc(defaultQuestions(level))}</textarea></label>
        <div class="actions wide"><button type="submit" class="btn">${icon('link')} ${s.generate}</button></div>
      </form>
      <div id="assignment-output" aria-live="polite"></div>
    </section>
    </div><section class="section" id="teacher-plans"><h2>${s.plans}</h2><p class="muted">${s.plansIntro}</p>${FIELDS.map(
      f =>
        `<section class="field-group"><div class="field-head"><span class="field-icon" aria-hidden="true">${f.icon}</span><div><h3>${esc(pick(f.name))}</h3></div></div><div class="topic-grid">${TOPICS.filter(
          t => t.field === f.id
        )
          .map(
            t =>
              `<a class="topic-card" href="/learn/${t.id}"><span class="topic-icon" aria-hidden="true">${t.icon}</span><span class="topic-text"><strong>${esc(pick(t.title))}</strong><small>${t.levels.map(l => esc(pick(PHASES[l]).split('·')[0].trim())).join(' · ')}</small></span></a>`
          )
          .join('')}</div></section>`
    ).join('')}</section>
    <section class="section">${notice(`<strong>🔒 ${s.privacy}.</strong> ${s.privacyText}`)}</section>`;

  const form = $('#assignment-form');
  if (restoreDraft) {
    for (const [name, value] of draft.fields) {
      const field = form.elements.namedItem(name);
      if (field) field.value = value;
    }
  }
  ctx.cleanup(() => {
    draft = { preset: presetTopic?.id || '', fields: [...new FormData(form)], chosen: [...chosen] };
  });

  const refreshChips = () => ($('#picked').innerHTML = speciesChips());
  ctx.on('suggest-pick', '#assign-species', (event, input) => {
    if (chosen.length >= 10 || chosen.some(x => x.id === `inat-${event.detail.id}`)) return;
    chosen.push({
      id: `inat-${event.detail.id}`,
      n: event.detail.common ? `${event.detail.common} (${event.detail.name})` : event.detail.name,
    });
    input.value = '';
    refreshChips();
  });
  ctx.on('click', '[data-remove-species]', (e, b) => {
    chosen.splice(Number(b.dataset.removeSpecies), 1);
    refreshChips();
  });
  ctx.on('click', '[data-from-topic]', async () => {
    const id = $('[name=tp]').value;
    if (!findTopic(id)) return;
    const topic = await loadTopic(id);
    if (!ctx.isCurrent()) return;
    for (const sci of topic.species || []) {
      const sp = findSpecies({ sci });
      if (sp && chosen.length < 10 && !chosen.some(x => x.id === sp.id))
        chosen.push({ id: sp.id, n: `${pick(sp.name)} (${sp.sci})` });
    }
    refreshChips();
  });
  ctx.on('change', '[name=l]', (e, select) => {
    const area = $('[name=q]');
    if (area && Object.values(DEFAULT_QUESTIONS).some(d => d.map(q => pick(q)).join('\n') === area.value))
      area.value = defaultQuestions(select.value);
  });
  ctx.on('submit', '#assignment-form', event => {
    event.preventDefault();
    const data = new FormData(event.target);
    const questions = String(data.get('q') || '')
      .split('\n')
      .map(x => x.trim())
      .filter(Boolean)
      .slice(0, 8)
      .map(x => x.slice(0, 300));
    if (!chosen.length && !questions.length) {
      $('#assignment-output').innerHTML = notice(s.needSomething);
      return;
    }
    const payload = {
      v: 1,
      t: String(data.get('t') || '').slice(0, 120),
      l: data.get('l'),
      tp: data.get('tp') || undefined,
      due: data.get('due') || undefined,
      i: String(data.get('i') || '').slice(0, 1500),
      s: chosen,
      q: questions,
    };
    const url = `${location.origin}/tugas?d=${encodeData(payload)}`;
    $('#assignment-output').innerHTML =
      `<label class="field"><span>${s.link}</span><input readonly value="${esc(url)}" id="assignment-url"></label>
      <div class="actions"><button type="button" class="btn" data-copy-link>${icon('link')} ${s.copy}</button><a class="btn secondary" href="${esc(url)}" target="_blank" rel="noopener">${s.open} ↗</a></div>${url.length > 4000 ? notice(s.tooLong) : ''}`;
    $('#assignment-url').select();
  });
  ctx.on('click', '[data-copy-link]', async () =>
    toast((await copyText($('#assignment-url').value)) ? ui.copied : ui.error)
  );
}
