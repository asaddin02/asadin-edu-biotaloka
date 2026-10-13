# Berkontribusi ke Biotaloka

Terima kasih sudah ingin membantu. Biotaloka dipakai anak SD sampai mahasiswa, jadi dua hal paling penting: **isinya benar** dan **mudah dipahami**. Kontribusi tidak harus berupa kode. Guru, dosen, penerjemah, dan fotografer alam sama-sama dibutuhkan.

English summary at the [end of this file](#english-summary).

## Cara paling mudah

- **Menemukan fakta keliru atau ingin mengusulkan spesies, istilah, atau soal kuis?** Buka issue dengan templat "Koreksi atau usulan konten". Sertakan sumbernya.
- **Menemukan bug?** Buka issue dengan templat "Laporan masalah".
- **Masalah keamanan?** Jangan buka issue publik. Ikuti [SECURITY.md](SECURITY.md).

## Menyiapkan proyek

Butuh Node.js 20 atau lebih baru, Python 3 (server statis untuk tes), dan Google Chrome atau Chromium.

```bash
npm ci
npm run dev          # http://127.0.0.1:8085 dengan proxy API dan log
npm run check        # lint, validasi konten, precache, dan semua tes browser
```

Tidak ada bundler. Berkas di `js/` dimuat langsung oleh peramban sebagai ES module. Simpan berkas, lalu muat ulang halaman.

## Menambah atau memperbaiki konten

Semua konten kurasi ada di `js/data/` dan berlisensi **CC BY-SA 4.0**. Setiap teks ditulis berpasangan `[Bahasa Indonesia, English]`. Kalau Anda hanya bisa menulis satu bahasa, tetap kirim pull request dan minta bantuan terjemahan di deskripsinya. Pemeriksaan otomatis baru lulus setelah kedua bahasa terisi.

### Aturan konten

1. **Wajib bersumber.** Gunakan buku pelajaran, jurnal, IUCN, GBIF, OpenStax, atau situs lembaga ilmiah. Cantumkan sumbernya di deskripsi pull request.
2. **Bahasa sesuai jenjang.** Teks SD memakai kalimat pendek dan kata sehari-hari. Istilah teknis ditandai `[[istilah]]` supaya bisa diklik dan dijelaskan kamus.
3. **Jangan mengarang angka.** Kalau ukuran, umur, atau jumlah populasi tidak pasti, tulis rentang dan kata "sekitar", atau kosongkan.
4. **Aman untuk anak.** Tidak ada konten menakutkan yang berlebihan, dan tidak ada ajakan menyentuh atau mengambil satwa liar.
5. **Foto berlisensi terbuka.** Utamakan CC0, CC BY, atau CC BY-SA, lengkap dengan atribusi. Lihat [docs/LICENSING.md](docs/LICENSING.md).

### Kartu spesies (`js/data/species.js`)

Tambahkan satu entri. Cukup isi nama ilmiah dan teksnya. ID dan foto bisa dicari otomatis:

```js
{
  sci: 'Tarsius tarsier',
  g: 'mamalia',            // kelompok untuk pelajar, lihat GROUPS di berkas yang sama
  diet: 'insektivora',     // lihat DIETS
  hab: ['hutan'],          // lihat HABITATS
  end: 1,                  // 1 = hanya ada di Indonesia (endemik)
  name: ['Tarsius', 'Spectral tarsier'],
  about: ['…', '…'],
  food: ['…', '…'],
  home: ['…', '…'],
  fun: ['…', '…'],
  size: ['…', '…'],
},
```

Lalu jalankan:

```bash
npm run data:check -- --resolve
```

Perintah ini membutuhkan internet. Hasilnya:

- `id`, `inat`, `gbif`, dan satu foto berlisensi terbuka (mengutamakan CC0/CC BY/CC BY-SA) terisi otomatis.
- Semua konten langsung divalidasi: kolom wajib lengkap dan setiap istilah `[[...]]` ada di kamus.

Setelah itu, cukup `npm run data:check` untuk memeriksa ulang.

### Istilah kamus (`js/data/glossary.js`)

`def` adalah definisi sederhana untuk semua jenjang. `adv` (opsional) adalah penjelasan lanjutan untuk SMA dan kuliah. `id` harus huruf kecil dan dipakai oleh penanda `[[id]]` atau `[[id|teks tampil]]`.

### Materi dan kuis (`js/data/topics/`)

Satu berkas per topik berisi isi materi. Metadata ringan (bidang, ikon, jenjang yang disarankan, tingkat organisasi, judul, ringkasan) ada di `js/data/topics/index.js`, sehingga daftar materi, pencarian, dan Peta Biologi tidak perlu memuat seluruh isi. Salin topik yang sudah ada sebagai contoh, lalu tambahkan metadatanya di `index.js` sesuai urutan belajar dalam bidangnya.

Metadata di `js/data/topics/index.js`:

| Kolom              | Isi                                                                           |
| ------------------ | ----------------------------------------------------------------------------- |
| `field`            | Salah satu bidang di `FIELDS` (misalnya `sel`, `tubuh`, `ekologi`)            |
| `levels`           | Jenjang yang disarankan: `sd`, `smp`, `sma`, `kuliah`                         |
| `org`              | Tingkat organisasi yang dibahas (lihat `ORGANIZATION` di `js/data/biomap.js`) |
| `title`, `summary` | `[Indonesia, English]`                                                        |

Isi berkas topik:

| Kolom      | Isi                                                                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `body`     | Teks untuk keempat lapisan (`sd`, `smp`, `sma`, `kuliah`). Tulis sesuai jenjang: SD sederhana, SMP standar, SMA lanjutan, kuliah mendalam    |
| `key`      | Poin kunci per jenjang, berupa daftar `- `                                                                                                   |
| `activity` | Kegiatan per jenjang                                                                                                                         |
| `quiz`     | `{ lv, q, a, c, why }`: jenjang, pertanyaan, pilihan jawaban, indeks jawaban benar (mulai 0), dan penjelasan. Teks kuis tidak memakai markup |
| `teacher`  | `goals` per jenjang, `time`, `steps`, `assess`, dan `misconceptions` (anggapan keliru beserta konsep yang benar)                             |
| `species`  | Nama ilmiah kartu spesies terkait                                                                                                            |
| `related`  | ID topik terkait                                                                                                                             |
| `read`     | Bacaan lanjutan `{ label, url, lv }`; periksa bahwa tautannya hidup                                                                          |
| `lab`      | ID simulasi terkait di `js/labs/` (opsional)                                                                                                 |

Markup teks materi: paragraf dipisah baris kosong, `**tebal**`, `*miring*`, `[[istilah]]` atau `[[istilah|teks tampil]]`, daftar `- `, dan daftar bernomor `1. `. Satu blok boleh diawali kalimat pengantar lalu diikuti baris daftar.

Jalankan `npm run data:check` setelah menambah materi. Validator memeriksa pasangan bahasa, keempat lapisan, poin kunci, jumlah soal per jenjang, tujuan guru, miskonsepsi, istilah kamus, kartu spesies, dan simulasi yang dirujuk.

### Kelompok takson dan kehidupan purba

- `js/data/groups.js` berisi nama ramah anak untuk kelompok GBIF (misalnya Chordata → "Hewan bertulang belakang & kerabatnya"). `p` yang lebih besar tampil lebih dulu di Pohon kehidupan.
- `js/data/prehistoric.js` berisi periode geologi (mengikuti International Chronostratigraphic Chart) dan makhluk purba. `pbdb` adalah nama yang dicari langsung di Paleobiology Database.

## Menulis kode

- **Tanpa dependensi runtime.** Aplikasi dan `server/server.mjs` hanya memakai API bawaan peramban dan Node. Paket npm hanya untuk pengembangan.
- **Halaman** ada di `js/pages/`. Setiap modul mengekspor `title()` dan `render(ctx)`, lalu didaftarkan di `js/core/router.js`. Pasang event lewat `ctx.on(type, selector, fn)`. Jangan pakai atribut `onclick`, karena Content Security Policy akan memblokirnya. Setelah `await`, periksa `ctx.isCurrent()` supaya respons yang terlambat tidak menimpa halaman baru.
- **Teks antarmuka** ditulis dengan `S({ key: ['Indonesia', 'English'] })` dari `js/core/prefs.js`. Teks bersama ada di `js/i18n/ui.js`.
- **Keamanan HTML.** Teks dari API selalu melewati `esc()` sebelum masuk ke `innerHTML`.
- **Data API.** Semua permintaan lewat `getJSON()` di `js/services/api.js`, yang memeriksa snapshot lebih dulu. Snapshot membuang beberapa field takson iNaturalist yang tidak dipakai (`UNUSED_TAXON_FIELDS` di `js/services/snapshot.js`). Jika kode Anda mulai membaca salah satu field itu, hapus field tersebut dari daftar.
- **Simulasi** ada di `js/labs/` dan didaftarkan di `LABS` pada `js/pages/lab.js`.
- **Service worker.** Setelah mengubah berkas di `index.html`, `css/`, `js/`, atau ikon, jalankan `npm run build`. Perintah ini memperbarui daftar precache di `sw.js`. CI menolak `sw.js` yang tidak diperbarui.
- **Tes.** Tes browser ada di `tests/*.spec.js` dan memakai respons palsu dari `tests/helpers.js`, jadi tidak butuh internet. `npm run smoke` menguji layanan sungguhan dan membuat ulang screenshot di `docs/screenshots/`. `npm run preview:cloudflare` menjalankan situs beserta edge cache dengan runtime Cloudflare.
- **Format.** `npm run format` menjalankan Prettier, dan `npm run lint` harus lulus.

## Pull request

1. Buat branch dari `main`.
2. Buat perubahan kecil dan fokus. Satu PR sebaiknya berisi satu topik.
3. Jalankan `npm run check`.
4. Isi daftar periksa di templat PR, termasuk sumber untuk perubahan konten.

Dengan mengirim kontribusi, Anda setuju kode dilisensikan **MIT** dan konten di `js/data/` dilisensikan **CC BY-SA 4.0**. Semua kontributor diharapkan mengikuti [Kode Etik](CODE_OF_CONDUCT.md).

## English summary

- Content lives in `js/data/` (CC BY-SA 4.0). Every string is a pair `[Indonesian, English]`. If you can only write one language, open the PR anyway and ask for help with the translation; the automated checks pass once both languages are filled in.
- Content must cite trustworthy sources, suit the learner level, never invent numbers, and stay child-safe. Photos should be CC0, CC BY or CC BY-SA with attribution.
- New species cards need only `sci` plus text. `npm run data:check -- --resolve` fills in identifiers and an openly licensed photo, then validates all content.
- Code has no runtime dependencies and no bundler. Pages export `title()` and `render(ctx)`, use `ctx.on()` instead of inline handlers (CSP), and escape API text with `esc()`. API calls go through `getJSON()`, which checks the static snapshot first; if you start reading an iNaturalist taxon field listed in `UNUSED_TAXON_FIELDS` (`js/services/snapshot.js`), remove it from that list.
- After changing app files, run `npm run build` to refresh the service worker precache. Before opening a PR, run `npm run check`.
- Code contributions are MIT. Content contributions are CC BY-SA 4.0. Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).
