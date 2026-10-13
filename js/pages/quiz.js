import { $, esc, shuffle } from '../core/dom.js';
import { S, pick, level, atLeast, fmt } from '../core/prefs.js';
import { getProgress, trackQuiz } from '../core/userdata.js';
import { TOPICS, findTopic, loadTopic, loadTopics } from '../data/topics/index.js';
import { pageHead, notice, loading } from '../components/common.js';
import { quizMarkup, bindQuiz, questionsForLevel } from '../components/quiz.js';
import { catalogTools, catalogGroups, bindCatalog } from '../components/catalog.js';
import { rich } from '../components/richtext.js';
import { refresh } from '../components/cards.js';
import { curatedPhoto, photoMarkup } from '../services/media.js';

const s = S({
  title: ['Kuis', 'Quizzes'],
  heading: ['Uji dirimu, kumpulkan lencana!', 'Test yourself, collect badges!'],
  sub: [
    'Kuis materi bisa dikerjakan tanpa internet. Tebak foto memerlukan koneksi untuk memuat gambar.',
    'Lesson quizzes work offline. The photo game needs a connection to load pictures.',
  ],
  photoTitle: ['Tebak siapa aku?', 'Who am I?'],
  photoText: [
    'Lihat fotonya, lalu pilih nama yang benar. 10 ronde.',
    'Look at the photo and pick the right name. 10 rounds.',
  ],
  start: ['Mulai', 'Start'],
  topicQuizzes: ['Kuis per materi', 'Lesson quizzes'],
  best: ['Nilai terbaik', 'Best score'],
  round: ['Ronde', 'Round'],
  of: ['dari', 'of'],
  right: ['Benar!', 'Correct!'],
  wrong: ['Belum tepat. Ini adalah', 'Not quite. This is'],
  next: ['Lanjut', 'Next'],
  finish: ['Lihat hasil', 'See results'],
  score: ['Skormu', 'Your score'],
  again: ['Main lagi', 'Play again'],
  back: ['Semua kuis', 'All quizzes'],
  fact: ['Tahukah kamu?', 'Did you know?'],
  open: ['Kenali spesies ini', 'Meet this species'],
  lesson: ['Baca materinya', 'Read the lesson'],
  great: ['Hebat! Kamu penjelajah sejati.', 'Brilliant! You are a true explorer.'],
  good: ['Bagus! Kenali lagi spesies yang terlewat.', 'Good! Revisit the species you missed.'],
  keep: [
    'Ayo coba lagi. Setiap penjelajah belajar dari kesalahan.',
    'Try again. Every explorer learns from mistakes.',
  ],
  questions: ['soal', 'questions'],
  imageFailed: [
    'Foto gagal dimuat. Tebak dari petunjuk berikut:',
    'The photo failed to load. Guess from this clue:',
  ],
});

export const title = route =>
  route?.id && route.id !== 'foto' && findTopic(route.id)
    ? `${s.title} · ${pick(findTopic(route.id).title)}`
    : s.title;

let game = null;

function optionLabel(sp) {
  if (level === 'kuliah') return `<em>${esc(sp.sci)}</em>`;
  if (atLeast('sma')) return `${esc(pick(sp.name))} <em>${esc(sp.sci)}</em>`;
  return esc(pick(sp.name));
}

async function newGame() {
  const { SPECIES } = await import('../data/species.js');
  const pool = SPECIES.filter(sp => curatedPhoto(sp.photo));
  const rounds = shuffle(pool)
    .slice(0, 10)
    .map(answer => {
      const others = shuffle(pool.filter(sp => sp !== answer)).slice(0, 3);
      return { answer, options: shuffle([answer, ...others]), picked: null };
    });
  game = { rounds, index: 0 };
}

function renderGame() {
  const box = $('#photo-game');
  if (!box || !game) return;
  const done = game.index >= game.rounds.length;
  if (done) {
    const score = game.rounds.filter(r => r.picked === r.answer).length;
    const ratio = score / game.rounds.length;
    trackQuiz('photo', ratio);
    box.innerHTML = `<div class="quiz-result big"><strong>${s.score}: ${fmt(score)} / ${fmt(game.rounds.length)}</strong><p>${ratio >= 0.8 ? `⭐ ${s.great}` : ratio >= 0.5 ? s.good : s.keep}</p>
      <ul class="missed">${game.rounds
        .filter(r => r.picked !== r.answer)
        .map(
          r =>
            `<li><a href="/species/${esc(r.answer.id)}">${esc(pick(r.answer.name))}</a> <em>${esc(r.answer.sci)}</em></li>`
        )
        .join('')}</ul>
      <div class="actions"><button type="button" class="btn" data-game-new>${s.again}</button><a class="btn secondary" href="/quiz">${s.back}</a></div></div>`;
    return;
  }
  const round = game.rounds[game.index];
  const photo = curatedPhoto(round.answer.photo);
  const answered = round.picked !== null;
  box.innerHTML = `<p class="quiz-num">${s.round} ${game.index + 1} ${s.of} ${game.rounds.length}</p>
    <div class="game-photo media-frame">${photoMarkup(photo, '')}<span class="image-error-text">${s.imageFailed} ${esc(pick(round.answer.home))}</span></div>
    <div class="quiz-options grid-2">${round.options
      .map(sp => {
        const cls = answered ? (sp === round.answer ? ' right' : sp === round.picked ? ' wrong' : '') : '';
        return `<button type="button" class="quiz-option${cls}" data-game-pick="${esc(sp.id)}"${answered ? ' disabled' : ''}>${optionLabel(sp)}</button>`;
      })
      .join('')}</div>
    ${
      answered
        ? `<div class="game-feedback" role="status"><p><strong>${round.picked === round.answer ? `🎉 ${s.right}` : `${s.wrong} ${esc(pick(round.answer.name))}.`}</strong></p><p><strong>${s.fact}</strong> ${rich(pick(round.answer.fun), { cls: 'inline' })}</p>
      <div class="actions"><button type="button" class="btn" data-game-next>${game.index + 1 === game.rounds.length ? s.finish : s.next} →</button><a class="btn ghost" href="/species/${esc(round.answer.id)}">${s.open} ↗</a></div></div>`
        : ''
    }`;
  refresh(box);
  if (answered) box.querySelector('[data-game-next]')?.focus();
}

export async function render(ctx) {
  const { id, main } = ctx;
  if (id === 'foto') {
    main.innerHTML = `${pageHead(s.photoTitle, s.photoText, 'BIOTALOKA / QUIZ')}<section class="photo-game card" id="photo-game" aria-live="polite"></section>`;
    await newGame();
    if (!ctx.isCurrent()) return;
    renderGame();
    ctx.on('click', '[data-game-pick]', (e, b) => {
      const round = game.rounds[game.index];
      if (round.picked) return;
      round.picked = round.options.find(sp => sp.id === b.dataset.gamePick);
      renderGame();
    });
    ctx.on('click', '[data-game-next]', () => {
      game.index++;
      renderGame();
      $('#photo-game')?.scrollIntoView({ block: 'start' });
    });
    ctx.on('click', '[data-game-new]', async () => {
      await newGame();
      renderGame();
    });
    return;
  }
  if (id && findTopic(id)) {
    main.innerHTML = loading();
    const topic = await loadTopic(id);
    if (!ctx.isCurrent()) return;
    main.innerHTML = `${pageHead(pick(topic.title), pick(topic.summary), `${s.title.toUpperCase()} / ${topic.icon}`)}
      ${quizMarkup(`topic-${topic.id}`, questionsForLevel(topic.quiz), { seed: TOPICS.findIndex(t => t.id === topic.id) + 7 })}
      <p class="actions"><a class="btn secondary" href="/learn/${topic.id}">${s.lesson}</a><a class="btn ghost" href="/quiz">${s.back}</a></p>`;
    bindQuiz(ctx.on);
    return;
  }
  if (id) {
    main.innerHTML = notice(s.back) + `<a class="btn" href="/quiz">${s.back}</a>`;
    return;
  }
  const progress = getProgress();
  main.innerHTML = loading();
  const topics = await loadTopics(TOPICS.filter(t => t.levels.includes(level)));
  if (!ctx.isCurrent()) return;
  main.innerHTML = `${pageHead(s.heading, s.sub, 'BIOTALOKA / QUIZ')}
    <div class="quiz-workspace"><a class="feature-card" href="/quiz/foto"><span class="feature-emoji" aria-hidden="true">📸</span><span><strong>${s.photoTitle}</strong><small>${s.photoText}</small>${progress.quizzes.photo ? `<span class="done">⭐ ${s.best}: ${fmt(Math.round(progress.quizzes.photo.best * 100))}%</span>` : ''}</span><span class="btn">${s.start} →</span></a>
    <section class="section lesson-catalog"><h2>${s.topicQuizzes}</h2>${catalogTools()}${catalogGroups(
      topics,
      t => {
        const best = progress.quizzes[`topic-${t.id}`]?.best;
        return `<a class="topic-card" data-topic="${t.id}" href="/quiz/${t.id}"><span class="topic-icon" aria-hidden="true">${t.icon}</span><span class="topic-text"><strong>${esc(pick(t.title))}</strong><small>${fmt(questionsForLevel(t.quiz).length)} ${s.questions}</small>${best != null ? `<span class="done">⭐ ${fmt(Math.round(best * 100))}%</span>` : ''}</span></a>`;
      }
    )}</section></div>`;
  bindCatalog(ctx, topics);
}
