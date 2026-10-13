import { $, esc } from '../core/dom.js';
import { navigate } from '../core/router.js';
import { S, pick, fmt } from '../core/prefs.js';
import { trackVisit } from '../core/userdata.js';
import { ui } from '../i18n/ui.js';
import { API, PAGE_SIZE, groups } from '../services/api.js';
import {
  pageHead,
  loading,
  emptyState,
  errorState,
  pagination,
  routeURL,
  validPage,
  notice,
} from '../components/common.js';
import { visualCard, refresh } from '../components/cards.js';
import { icon } from '../components/icons.js';

const s = S({
  title: ['Di sekitarku', 'Near me'],
  heading: ['Siapa saja tetanggamu di alam?', 'Who are your nature neighbours?'],
  sub: [
    'Lihat makhluk hidup yang pernah diamati warga di sekitar rumah atau sekolahmu (data iNaturalist berkualitas riset).',
    'See living things people have observed around your home or school (research-grade iNaturalist data).',
  ],
  useLocation: ['Gunakan lokasiku', 'Use my location'],
  or: ['atau cari tempat', 'or search for a place'],
  placePlaceholder: ['Nama kota, sekolah, atau taman', 'City, school or park name'],
  find: ['Cari tempat', 'Find place'],
  radius: ['Jarak', 'Distance'],
  privacy: [
    'Privasi: lokasimu dibulatkan sekitar 1 km dan hanya dikirim ke iNaturalist untuk mencari pengamatan. Biotaloka tidak menyimpannya.',
    'Privacy: your location is rounded to about 1 km and only sent to iNaturalist to look up observations. Biotaloka does not store it.',
  ],
  locating: ['Mencari lokasimu…', 'Finding your location…'],
  denied: [
    'Izin lokasi ditolak atau tidak tersedia. Kamu tetap bisa mencari nama tempat.',
    'Location permission was denied or is unavailable. You can still search for a place name.',
  ],
  noPlaces: ['Tempat tidak ditemukan. Coba nama lain.', 'No place found. Try another name.'],
  choosePlace: ['Pilih tempat', 'Choose a place'],
  around: ['spesies teramati dalam radius {r} km', 'species observed within {r} km'],
  inPlace: ['spesies teramati di {p}', 'species observed in {p}'],
  hint: [
    'Tips: ajak teman sekelas mengamati dan memotret makhluk hidup di sekolah, lalu bandingkan dengan daftar ini.',
    'Tip: observe and photograph living things at school with classmates, then compare with this list.',
  ],
  start: ['Pilih lokasi untuk memulai.', 'Choose a location to begin.'],
  here: ['Lokasimu', 'Your location'],
});

export const title = () => s.title;

export async function render(ctx) {
  const { params, main } = ctx;
  const lat = Number(params.get('lat'));
  const lng = Number(params.get('lng'));
  const hasCoords =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    params.has('lat') &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180;
  const place = /^\d+$/.test(params.get('place') || '') ? params.get('place') : '';
  const pname = (params.get('pname') || '').slice(0, 120);
  const radius = [1, 5, 10, 25].includes(Number(params.get('radius'))) ? Number(params.get('radius')) : 5;
  const group = groups.some(g => g.id === params.get('group')) ? params.get('group') : 'all';
  const page = validPage(params.get('page'), 100);
  const g = groups.find(x => x.id === group);
  const base = { lat: hasCoords ? lat : '', lng: hasCoords ? lng : '', place, pname, radius, group };

  main.innerHTML = `${pageHead(s.heading, s.sub, 'BIOTALOKA / NEARBY')}
    <div class="nearby-workspace"><section class="nearby-tools card">
      <button type="button" class="btn" data-locate>${icon('nearby')} ${s.useLocation}</button>
      <form id="place-form" class="place-form" role="search"><label for="place-q">${s.or}</label><div class="inline-field"><input id="place-q" name="q" value="${esc(pname)}" placeholder="${s.placePlaceholder}" maxlength="80" autocomplete="off"><button type="submit" class="btn secondary">${s.find}</button></div></form>
      <div id="place-results"></div>
      ${hasCoords ? `<div class="segmented" role="group" aria-label="${s.radius}">${[1, 5, 10, 25].map(r => `<a href="${routeURL('nearby', { ...base, radius: r, page: '' })}" class="${r === radius ? 'selected' : ''}"${r === radius ? ' aria-current="true"' : ''}>${r} km</a>`).join('')}</div>` : ''}
      <p class="muted small">🔒 ${s.privacy}</p>
    </section>
    <div class="nearby-content">${hasCoords || place ? `<nav class="group-pills" aria-label="${ui.explore}">${groups.map(x => `<a class="group-pill${x.id === group ? ' selected' : ''}" href="${routeURL('nearby', { ...base, group: x.id, page: '' })}"><span aria-hidden="true">${x.icon}</span>${esc(pick(x.label))}</a>`).join('')}</nav>` : ''}
    <div id="results" aria-live="polite">${hasCoords || place ? loading() : `<p class="muted center">${s.start}</p>`}</div>
    ${hasCoords || place ? notice(s.hint) : ''}</div></div>`;

  ctx.on('click', '[data-locate]', () => {
    const results = $('#results');
    if (!navigator.geolocation) {
      results.innerHTML = notice(s.denied);
      return;
    }
    results.innerHTML = loading(s.locating);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const round = n => Math.round(n * 100) / 100;
        navigate(
          routeURL('nearby', {
            lat: round(pos.coords.latitude),
            lng: round(pos.coords.longitude),
            radius,
            group,
            pname: s.here,
          })
        );
      },
      () => {
        if (ctx.isCurrent()) results.innerHTML = notice(s.denied);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  });
  ctx.on('submit', '#place-form', async event => {
    event.preventDefault();
    const q = String(new FormData(event.target).get('q') || '').trim();
    if (!q) return;
    const box = $('#place-results');
    box.innerHTML = loading();
    try {
      const data = await API.places(q);
      if (!ctx.isCurrent()) return;
      const list = data.results || [];
      box.innerHTML = list.length
        ? `<h3 class="small-title">${s.choosePlace}</h3><div class="chips">${list.map(p => `<a class="chip" href="${routeURL('nearby', { place: p.id, pname: p.display_name || p.name, group })}">${esc(p.display_name || p.name)}</a>`).join('')}</div>`
        : notice(s.noPlaces);
    } catch {
      if (ctx.isCurrent()) box.innerHTML = errorState();
    }
  });

  if (!hasCoords && !place) return;
  const results = $('#results');
  try {
    const data = await API.speciesCounts({
      lat: hasCoords ? lat : '',
      lng: hasCoords ? lng : '',
      radius: hasCoords ? radius : '',
      placeId: place,
      taxonId: g?.taxon || '',
      page,
    });
    if (!ctx.isCurrent()) return;
    const total = data.total_results || 0;
    const taxa = (data.results || []).map(r => ({ ...r.taxon, _count: r.count }));
    const label = hasCoords ? s.around.replace('{r}', radius) : s.inPlace.replace('{p}', pname || place);
    results.innerHTML = `<div class="result-head"><span><strong>${fmt(total)}</strong> ${esc(label)}</span><span>${ui.page} ${fmt(page)}</span></div>${
      taxa.length
        ? `<div class="discovery-grid">${taxa.map(t => visualCard(t, { count: t._count, countLabel: 'nearby' })).join('')}</div>`
        : emptyState()
    }${pagination(page, page * PAGE_SIZE < total, p => routeURL('nearby', { ...base, page: p }), Math.min(100, Math.ceil(total / PAGE_SIZE)))}`;
    refresh(results);
    trackVisit('nearby');
  } catch (error) {
    if (ctx.isCurrent()) results.innerHTML = errorState();
    console.warn('Biotaloka nearby failed:', error);
  }
}
