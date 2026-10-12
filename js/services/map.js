import { getJSON } from './api.js';
import { esc } from '../core/dom.js';
let library;
async function leaflet() {
  if (!library)
    library = import('../../assets/vendor/leaflet/leaflet.js').then(() => {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = '/assets/vendor/leaflet/leaflet.css';
      document.head.append(css);
      return globalThis.L || globalThis.leaflet;
    });
  return library;
}
export async function createOccurrenceMap(host, lang = 'id') {
  const L = await leaflet();
  if (!host.isConnected) return null;
  const en = lang === 'en';
  host.innerHTML = `<div class="map-toolbar"><span class="map-caption">${en ? 'WORLD ATLAS' : 'ATLAS DUNIA'}</span><div><button type="button" class="map-reset">${en ? 'World view' : 'Lihat dunia'} ↗</button><button type="button" class="map-fit">${en ? 'Fit records' : 'Lihat temuan'} ⌖</button></div></div><div class="geo-map" aria-label="${en ? 'Interactive occurrence map' : 'Peta temuan interaktif'}"></div><p class="map-status" role="status">${en ? 'Loading occurrence records…' : 'Memuat catatan temuan…'}</p><div class="map-legend"><span><i class="dot"></i> ${en ? 'Sample records' : 'Sampel temuan'}</span><span><i class="land-key"></i> ${en ? 'Land · Natural Earth' : 'Daratan · Natural Earth'}</span></div>`;
  const canvas = host.querySelector('.geo-map'),
    status = host.querySelector('.map-status');
  const map = L.map(canvas, {
    scrollWheelZoom: false,
    minZoom: 1,
    maxZoom: 13,
    worldCopyJump: false,
    zoomControl: true,
    zoomAnimation: false,
    fadeAnimation: false,
    maxBounds: [
      [-85, -185],
      [85, 185],
    ],
    maxBoundsViscosity: 0.8,
  }).setView([17, 12], 2);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com">Natural Earth</a>');
  map.createPane('atlas-land').style.zIndex = '250';
  const basemap = L.layerGroup().addTo(map),
    sample = L.layerGroup().addTo(map);
  const street = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    noWrap: true,
  });
  const layers = L.control
    .layers(
      {
        [en ? 'Atlas (available locally)' : 'Atlas (tersedia lokal)']: basemap,
        [en ? 'Street map (online)' : 'Peta jalan (daring)']: street,
      },
      { [en ? 'Sample records' : 'Sampel temuan']: sample },
      { collapsed: true }
    )
    .addTo(map);
  const elements = map.zoomControl.getContainer();
  elements.querySelector('.leaflet-control-zoom-in').setAttribute('aria-label', en ? 'Zoom in' : 'Perbesar');
  elements
    .querySelector('.leaflet-control-zoom-out')
    .setAttribute('aria-label', en ? 'Zoom out' : 'Perkecil');
  street.on('tileerror', () => {
    status.textContent = en
      ? 'Street tiles unavailable. Switch to Atlas for the local basemap.'
      : 'Peta jalan tidak tersedia. Pilih Atlas untuk peta dasar lokal.';
  });
  const resize = new ResizeObserver(() => map.invalidateSize({ pan: false }));
  resize.observe(canvas);
  let destroyed = false,
    bounds = null,
    density = null;
  host.querySelector('.map-reset').onclick = () => map.setView([17, 12], 2);
  host.querySelector('.map-fit').onclick = () => {
    if (bounds?.isValid()) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 5, animate: false });
  };
  getJSON('/assets/maps/world.geojson')
    .then(world => {
      if (destroyed) return;
      L.geoJSON(world, {
        pane: 'atlas-land',
        style: { color: '#aabaad', weight: 0.7, fillColor: '#e5eade', fillOpacity: 1 },
        onEachFeature: (feature, layer) => {
          const label = document.createElement('span');
          label.textContent = feature.properties.ADMIN;
          layer.bindTooltip(label, { sticky: true });
        },
      }).addTo(basemap);
      const labels = [
        [35, -104, 'AMERICA'],
        [-15, -57, en ? 'SOUTH AMERICA' : 'AMERIKA SELATAN'],
        [52, 23, en ? 'EUROPE' : 'EROPA'],
        [5, 22, en ? 'AFRICA' : 'AFRIKA'],
        [39, 94, 'ASIA'],
        [-24, 135, 'AUSTRALIA'],
      ];
      for (const [lat, lng, name] of labels)
        L.marker([lat, lng], {
          interactive: false,
          icon: L.divIcon({ className: 'continent-label', html: esc(name), iconSize: [110, 20] }),
        }).addTo(basemap);
      host.dataset.basemap = 'ready';
    })
    .catch(() => {
      if (!destroyed)
        status.textContent = en
          ? 'The local atlas could not load. Reload this page.'
          : 'Atlas lokal gagal dimuat. Muat ulang halaman.';
    });
  return {
    update(data) {
      if (destroyed) return;
      sample.clearLayers();
      if (density) {
        layers.removeLayer(density);
        map.removeLayer(density);
        density = null;
      }
      const points = (data.results || []).filter(
        p =>
          Number.isFinite(p.decimalLatitude) &&
          Number.isFinite(p.decimalLongitude) &&
          Math.abs(p.decimalLatitude) <= 90 &&
          Math.abs(p.decimalLongitude) <= 180
      );
      bounds = L.latLngBounds(points.map(p => [p.decimalLatitude, p.decimalLongitude]));
      for (const p of points) {
        const marker = L.circleMarker([p.decimalLatitude, p.decimalLongitude], {
          radius: 5,
          weight: 1.5,
          color: '#fff',
          fillColor: '#227756',
          fillOpacity: 0.8,
        }).addTo(sample);
        const root = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = p.country || (en ? 'Occurrence record' : 'Catatan temuan');
        root.append(title);
        const date = document.createElement('p');
        date.textContent = p.eventDate || (en ? 'Date unavailable' : 'Tanggal tidak tersedia');
        root.append(date);
        const a = document.createElement('a');
        a.href =
          data.provider === 'iNaturalist'
            ? `https://www.inaturalist.org/observations/${Number(p.key)}`
            : `https://www.gbif.org/occurrence/${Number(p.key)}`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = en ? 'Open source ↗' : 'Buka sumber ↗';
        root.append(a);
        marker.bindPopup(root);
      }
      if (points.length && bounds.isValid())
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 4, animate: false });
      host.querySelector('.map-fit').disabled = !points.length;
      const f = n => Number(n).toLocaleString(en ? 'en-US' : 'id-ID');
      status.textContent = points.length
        ? en
          ? `${f(points.length)} sample points from ${f(data.count)} coordinate records · ${data.provider}. Not a complete species range.`
          : `${f(points.length)} titik sampel dari ${f(data.count)} catatan berkoordinat · ${data.provider}. Bukan batas sebaran spesies.`
        : en
          ? 'No usable coordinates were returned. The atlas remains visible; no locations have been invented.'
          : 'Sumber belum mengembalikan koordinat yang bisa ditampilkan. Atlas tetap terlihat; lokasi tidak direkayasa.';
      if (data.provider === 'GBIF' && data.taxonKey && data.count > 0) {
        density = L.tileLayer(
          `https://api.gbif.org/v2/map/occurrence/density/{z}/{x}/{y}@1x.png?srs=EPSG%3A3857&taxonKey=${Number(data.taxonKey)}&style=green.point&hasGeospatialIssue=false`,
          {
            opacity: 0.8,
            maxNativeZoom: 12,
            noWrap: true,
            attribution: '<a href="https://www.gbif.org">GBIF</a>',
          }
        );
        layers.addOverlay(
          density,
          en ? 'All indexed records (GBIF density)' : 'Seluruh catatan terindeks (kepadatan GBIF)'
        );
        density.on('tileerror', () => {
          status.textContent = en
            ? 'Density tiles unavailable. Sample points are still available.'
            : 'Lapisan kepadatan tidak tersedia. Titik sampel tetap tersedia.';
        });
      }
      host.dataset.points = points.length;
      host.dataset.source = data.provider;
    },
    error() {
      if (!destroyed) {
        status.textContent = en
          ? 'The occurrence service is unavailable. This is not evidence of an empty range. Try again.'
          : 'Layanan temuan gagal dihubungi. Ini bukan berarti spesies tidak memiliki wilayah hidup. Coba lagi.';
        host.dataset.mapError = 'true';
      }
    },
    destroy() {
      destroyed = true;
      resize.disconnect();
      map.stop();
      map.remove();
    },
  };
}
