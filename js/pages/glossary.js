import { $, $$, esc } from '../core/dom.js';
import { S, pick, atLeast, fmt, locale } from '../core/prefs.js';
import { glossary } from '../data/glossary.js';
import { findTopic } from '../data/topics/index.js';
import { pageHead } from '../components/common.js';

const s = S({
  title: ['Kamus istilah', 'Glossary'],
  heading: ['Kamus istilah biologi', 'Biology glossary'],
  sub: [
    'Arti kata-kata penting dengan bahasa yang mudah. Kata bergaris di materi dan kartu spesies juga bisa diklik.',
    'Key words explained simply. Underlined words in lessons and species cards can be clicked too.',
  ],
  search: ['Cari istilah', 'Search terms'],
  placeholder: ['Misalnya: fotosintesis, endemik, alel', 'For example: photosynthesis, endemic, allele'],
  count: ['istilah', 'terms'],
  none: ['Istilah tidak ditemukan.', 'No matching term.'],
  topic: ['Materi terkait', 'Related lesson'],
  more: ['Untuk SMA & kuliah', 'For high school & university'],
});

export const title = () => s.title;

const normalize = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function entry(g) {
  const topic = g.topic ? findTopic(g.topic) : null;
  return `<article class="term-entry" id="istilah-${esc(g.id.replace(/\s+/g, '-'))}" data-search="${esc(normalize([pick(g.term), g.id, ...(g.aliases || []), g.term[1]].join(' ')))}">
    <h3>${esc(pick(g.term))}${pick(g.term).toLowerCase() !== g.term[1].toLowerCase() ? ` <small lang="${document.documentElement.lang === 'id' ? 'en' : 'id'}">${esc(document.documentElement.lang === 'id' ? g.term[1] : g.term[0])}</small>` : ''}</h3>
    <p>${esc(pick(g.def))}</p>
    ${g.adv && atLeast('sma') ? `<p class="term-adv"><strong>${s.more}:</strong> ${esc(pick(g.adv))}</p>` : ''}
    ${topic ? `<a class="chip" href="/learn/${topic.id}">${topic.icon} ${s.topic}: ${esc(pick(topic.title))}</a>` : ''}
  </article>`;
}

export async function render(ctx) {
  const q = (ctx.params.get('q') || '').trim();
  const collator = new Intl.Collator(locale());
  const sorted = [...glossary].sort((a, b) => collator.compare(pick(a.term), pick(b.term)));
  const letters = [...new Set(sorted.map(g => normalize(pick(g.term))[0].toUpperCase()))];
  ctx.main.innerHTML = `${pageHead(s.heading, s.sub, 'BIOTALOKA / KAMUS')}
    <div class="glossary-workspace"><aside class="glossary-sidebar"><div class="glossary-tools"><label class="sr-only" for="glossary-q">${s.search}</label><input id="glossary-q" type="search" value="${esc(q)}" placeholder="${s.placeholder}" autocomplete="off"><span class="muted" id="glossary-count" aria-live="polite"></span></div>
    <nav class="alphabet" aria-label="A–Z">${letters.map(l => `<a href="#letter-${l}" data-letter="${l}">${l}</a>`).join('')}</nav>
    </aside><div class="glossary-content"><div id="glossary-list">${letters
      .map(
        l =>
          `<section class="letter-group" id="letter-${l}"><h2>${l}</h2>${sorted
            .filter(g => normalize(pick(g.term))[0].toUpperCase() === l)
            .map(entry)
            .join('')}</section>`
      )
      .join('')}</div>
    <p class="muted center" id="glossary-none" hidden>${s.none}</p></div></div>`;

  const apply = value => {
    const needle = normalize(value.trim());
    let shown = 0;
    $$('.term-entry').forEach(el => {
      const match = !needle || el.dataset.search.includes(needle);
      el.hidden = !match;
      if (match) shown++;
    });
    $$('.letter-group').forEach(sec => (sec.hidden = !sec.querySelector('.term-entry:not([hidden])')));
    $('#glossary-count').textContent = `${fmt(shown)} ${s.count}`;
    $('#glossary-none').hidden = shown > 0;
  };
  apply(q);
  ctx.on('input', '#glossary-q', (e, input) => apply(input.value));
  ctx.on('click', '[data-letter]', (event, a) => {
    event.preventDefault();
    document.getElementById(`letter-${a.dataset.letter}`)?.scrollIntoView({ behavior: 'smooth' });
  });
  if (q) {
    const exact = document.getElementById(`istilah-${q.replace(/\s+/g, '-')}`);
    exact?.scrollIntoView({ block: 'center' });
    exact?.classList.add('flash');
  }
}
