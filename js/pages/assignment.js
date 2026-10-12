import { esc, decodeData } from '../core/dom.js';
import { S, pick, LEVELS, fmtDate } from '../core/prefs.js';
import { ui } from '../i18n/ui.js';
import { findTopic } from '../data/topics/index.js';
import { pageHead, notice } from '../components/common.js';
import { icon } from '../components/icons.js';

const s = S({
  title: ['Tugas', 'Assignment'],
  invalid: [
    'Tautan tugas tidak valid atau rusak. Minta tautan baru kepada gurumu.',
    'This assignment link is invalid or damaged. Ask your teacher for a new one.',
  ],
  name: ['Nama', 'Name'],
  klass: ['Kelas', 'Class'],
  due: ['Batas waktu', 'Due'],
  level: ['Jenjang', 'Level'],
  instructions: ['Instruksi', 'Instructions'],
  lesson: ['Materi yang dipelajari', 'Lesson to study'],
  species: ['Spesies yang dipelajari', 'Species to study'],
  questions: ['Pertanyaan', 'Questions'],
  answer: ['Jawabanmu', 'Your answer'],
  saved: [
    'Jawaban tersimpan otomatis di perangkat ini. Untuk menyerahkan, cetak atau simpan sebagai PDF.',
    'Answers save automatically on this device. To hand in, print or save as PDF.',
  ],
  print: ['Cetak / simpan PDF', 'Print / save as PDF'],
  from: ['Tugas dari guru melalui BioTaxa', 'Assignment from your teacher via BioTaxa'],
});

export const title = () => s.title;

const clean = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
function validate(d) {
  if (!d || d.v !== 1) return null;
  return {
    t: clean(d.t, 120) || s.title,
    l: LEVELS.includes(d.l) ? d.l : '',
    tp: findTopic(clean(d.tp, 40)) ? clean(d.tp, 40) : '',
    due: /^\d{4}-\d{2}-\d{2}$/.test(d.due || '') ? d.due : '',
    i: clean(d.i, 1500),
    s: Array.isArray(d.s)
      ? d.s
          .filter(x => x && /^(inat-)?\d+$/.test(String(x.id)))
          .slice(0, 10)
          .map(x => ({ id: String(x.id), n: clean(x.n, 160) || String(x.id) }))
      : [],
    q: Array.isArray(d.q)
      ? d.q
          .filter(x => typeof x === 'string' && x.trim())
          .slice(0, 8)
          .map(x => x.slice(0, 300))
      : [],
  };
}

function hash(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = (h * 33) ^ text.charCodeAt(i);
  return (h >>> 0).toString(36);
}

export async function render(ctx) {
  const raw = ctx.params.get('d') || '';
  const data = validate(decodeData(raw));
  if (!data) {
    ctx.main.innerHTML = pageHead(s.title, '', 'BIOTAXA / TUGAS') + notice(s.invalid);
    return;
  }
  const key = `tugas-${hash(raw)}`;
  const topic = data.tp ? findTopic(data.tp) : null;
  ctx.main.innerHTML = `${pageHead(data.t, s.from, 'BIOTAXA / TUGAS')}
    <div class="assignment-meta">${data.l ? `<span class="tag">${s.level}: ${esc(ui[data.l])}</span>` : ''}${data.due ? `<span class="tag">${icon('clock')} ${s.due}: ${esc(fmtDate(`${data.due}T12:00:00`))}</span>` : ''}</div>
    <section class="card student-fields"><label class="field"><span>${s.name}</span><input type="text" data-note-key="${key}-name" data-note-label="${esc(data.t)} · ${s.name}" maxlength="80" autocomplete="name"></label><label class="field"><span>${s.klass}</span><input type="text" data-note-key="${key}-class" data-note-label="${esc(data.t)} · ${s.klass}" maxlength="40"></label></section>
    ${data.i ? `<section class="section"><h2>${s.instructions}</h2><p class="prose">${esc(data.i)}</p></section>` : ''}
    ${topic ? `<section class="section"><h2>${s.lesson}</h2><a class="topic-card" href="/learn/${topic.id}${data.l ? `?v=${data.l}` : ''}"><span class="topic-icon" aria-hidden="true">${topic.icon}</span><span class="topic-text"><strong>${esc(pick(topic.title))}</strong><small>${esc(pick(topic.summary))}</small></span></a></section>` : ''}
    ${data.s.length ? `<section class="section"><h2>${s.species}</h2><ol class="assignment-species">${data.s.map(x => `<li><a href="/species/${esc(x.id)}">${esc(x.n)} →</a></li>`).join('')}</ol></section>` : ''}
    ${data.q.length ? `<section class="section"><h2>${s.questions}</h2><ol class="assignment-questions">${data.q.map((q, i) => `<li><p>${esc(q)}</p><label class="sr-only" for="${key}-q${i}">${s.answer} ${i + 1}</label><textarea id="${key}-q${i}" data-note-key="${key}-q${i}" data-note-label="${esc(data.t)} · ${i + 1}" placeholder="${s.answer}…"></textarea></li>`).join('')}</ol><small data-note-status>${s.saved}</small></section>` : ''}
    <div class="actions"><button type="button" class="btn" data-print>${icon('print')} ${s.print}</button></div>`;
}
