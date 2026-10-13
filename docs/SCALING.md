# Skala: dari satu kelas sampai puluhan ribu pengguna

Dokumen ini menjelaskan bagaimana Biotaloka tetap berjalan ketika banyak orang membukanya bersamaan, apa batasnya, dan kapan perlu bertindak.

## Di mana batasnya

Aplikasi Biotaloka sendiri (HTML, JavaScript, materi, kuis, kamus, lab, dan teks kartu spesies) adalah file statis. Di Cloudflare Pages, permintaan ke file statis gratis dan tidak dibatasi (*"Requests to static assets are free and unlimited"*), jadi bagian ini tidak menjadi masalah pada skala berapa pun.

Batasnya ada pada layanan data yang dipanggil aplikasi, terutama iNaturalist. Kebijakan resmi mereka, dari spesifikasi API-nya:

> "we throttle API usage to a max of 100 requests per minute, though we ask that you try to keep it to 60 requests per minute or lower, and to keep under 10,000 requests per day. If we notice usage that has serious impact on our performance we may institute blocks without notification."

Batas ini dihitung per alamat IP. Satu halaman Biotaloka memicu sekitar 1–3 permintaan ke iNaturalist. Bagi satu orang di rumah, jatah itu jauh dari habis. Masalahnya muncul bila banyak orang berbagi satu IP (lab sekolah, Wi-Fi sekolah, dan sebagian pengguna seluler yang berada di balik CGNAT), atau bila total lalu lintas dari Biotaloka cukup besar sehingga membebani iNaturalist.

GBIF lebih longgar, tetapi tetap perlu dipakai secara wajar.

## Tiga lapis di Cloudflare Pages

Setiap permintaan data melewati lapis-lapis berikut, berurutan:

| Lapis | Isi | Kapasitas | Bila tidak tersedia |
|---|---|---|---|
| 1. Snapshot API (`data/snapshot/`) | Respons untuk galeri Indonesia dan dunia, 111 spesies kurasi, pencarian umum, pohon kehidupan, dan kehidupan purba, dalam dua bahasa. Direkam setiap malam oleh [scripts/build-snapshot.mjs](../scripts/build-snapshot.mjs) | Tanpa batas (file statis dari CDN) | Lanjut ke lapis 2 |
| 2. Edge cache (`/api/*`) | Permintaan lain, disimpan di cache Cloudflare per data center selama 15–60 menit | Gratis 100.000 permintaan per hari. Paket Workers Paid mulai US$5 per bulan untuk 10 juta permintaan | Aplikasi beralih ke lapis 3 selama 60 detik |
| 3. API langsung dari browser | GBIF dan iNaturalist dari IP masing-masing pengguna | Sesuai batas per IP di atas | Pesan "sumber sedang tidak tersedia" dengan tombol coba lagi |

Aturan yang membuat lapisan ini aman:

- Snapshot hanya dipakai bila URL-nya persis sama dengan yang diminta aplikasi. Setiap file menyimpan URL aslinya, jadi tabrakan hash tidak mungkin menyajikan data yang salah.
- Edge cache hanya meneruskan endpoint baca yang terdaftar di [server/policy.mjs](../server/policy.mjs), aturan yang sama dengan server Node.
- Jika edge cache menjawab 429, 5xx, atau tidak bisa dihubungi, aplikasi langsung bertanya ke sumber dan tidak memakai edge cache selama 60 detik. Hal yang sama berlaku bila kuota harian Cloudflare habis. Kuota direset setiap tengah malam UTC (pukul 07.00 WIB).
- Materi, kuis, kamus, lab, dan kartu spesies kurasi tetap berjalan walaupun semua API sedang bermasalah.

## Perkiraan kapasitas

| Situasi | Perkiraan |
|---|---|
| Ribuan pengguna, sebagian besar membuka halaman populer | Sebagian besar dilayani snapshot dan CDN. Permintaan ke iNaturalist tetap rendah |
| Satu sekolah dengan satu IP | Aman. Permintaan lewat Cloudflare, bukan dari IP sekolah |
| Kuota edge cache gratis habis (sekitar 100.000 permintaan API per hari di luar snapshot) | Aplikasi tetap jalan lewat API langsung. Pertimbangkan paket Workers Paid |
| Puluhan ribu pengguna aktif setiap hari | Hubungi iNaturalist dan GBIF (lihat di bawah), dan pertimbangkan basis data sendiri |

Angka ini perkiraan. Pantau pemakaian yang sebenarnya di dashboard Cloudflare (**Workers & Pages → proyek → Metrics**). Header `X-Cache: HIT` atau `MISS` pada respons `/api/` menunjukkan apakah edge cache bekerja.

## Snapshot terakhir yang diukur

Pengukuran 24 September 2026 (`npm run snapshot`, di komputer pengembang):

| Ukuran | Nilai |
|---|---|
| Halaman yang dikunjungi perekam | 706 (galeri 12 kelompok × Indonesia/dunia × 2 halaman, 111 spesies, 154 kata pencarian bahasa Indonesia dan 156 bahasa Inggris, 19 tingkat pohon kehidupan, kehidupan purba; dalam dua bahasa) |
| Waktu | 25 menit, 0 halaman gagal |
| Respons tersimpan | 1.987 (iNaturalist 1.280, GBIF 706, PBDB 1) |
| Permintaan ke iNaturalist per malam | Sekitar 1.300, dengan jeda 1,1 detik (sekitar 54 per menit) |
| Ukuran | 63 MB mentah, 5,6 MB setelah kompresi. Median 1,6 KB per file, terbesar 27 KB |

Pada uji dengan runtime Cloudflare lokal, galeri, halaman spesies kurasi, pohon kehidupan, kehidupan purba, dan halaman bandingkan dilayani seluruhnya dari snapshot tanpa satu pun permintaan ke iNaturalist atau GBIF.

## Kapan menghubungi iNaturalist dan GBIF

iNaturalist dan GBIF adalah lembaga nirlaba. Keduanya terbuka untuk proyek pendidikan, tetapi perlu tahu lebih dulu bila lalu lintasnya besar. Hubungi mereka ketika:

- Metrics Cloudflare menunjukkan edge cache rutin melewati 100.000 permintaan per hari, atau
- Biotaloka mulai dipakai secara resmi oleh banyak sekolah atau dinas pendidikan.

Kontak: iNaturalist di help@inaturalist.org, GBIF di helpdesk@gbif.org. Contoh email:

```text
Subject: Biotaloka – open-source biodiversity education app for Indonesian schools

Hello,

I maintain Biotaloka (https://github.com/asaddin02/asadin-edu-biotaloka), a free, open-source,
bilingual (Indonesian/English) biodiversity learning app for primary school to university
students and their teachers. It uses the <iNaturalist / GBIF> API for species search,
galleries and taxon pages, always with photo attribution and licences shown.

To keep our load low we:
- serve the most requested responses from a nightly static snapshot (about <N> requests
  per night, paced at under one request per second),
- cache all other responses at the edge (Cloudflare) for 15–60 minutes,
- identify ourselves with the User-Agent "Biotaloka/3 (+https://github.com/asaddin02/asadin-edu-biotaloka)".

We currently see about <number> visitors per day and expect <number> as more schools
join. Could you let us know whether this usage is acceptable, and whether you would
prefer us to use a data export or a different approach?

Thank you for making this data available to learners.

<name>
<contact>
```

## Langkah berikutnya bila masih kurang

- **Tambah cakupan snapshot.** Tambahkan halaman yang sering dibuka ke daftar di `scripts/build-snapshot.mjs` (misalnya galeri halaman 3, atau kata pencarian yang sering muncul). Ukur dulu dari metrics.
- **Basis data sendiri.** GBIF menyediakan unduhan data ber-DOI, dan iNaturalist menyediakan ekspor data terbuka. Keduanya bisa dimuat ke basis data milik Biotaloka. Ini butuh server dan biaya bulanan, jadi cocok ditutup dengan sponsor atau program sekolah berbayar (lihat [LICENSING.md](LICENSING.md)).
