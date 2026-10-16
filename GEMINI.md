# Tugas Gemini: memperkaya materi Biotaloka

> Berkas ini adalah instruksi tugas untuk Gemini. Baca seluruhnya di awal setiap sesi, lalu baca `materi-gemini/README.md` (kalau sudah ada) untuk melanjutkan dari tempat sesi sebelumnya berhenti.

Repo: https://github.com/asaddin02/asadin-edu-biotaloka
Situs: https://biotaloka.asadinedu.com

## Latar

Biotaloka adalah atlas makhluk hidup dan materi biologi dalam bahasa Indonesia dan Inggris, untuk SD sampai kuliah dan guru. Isinya:

- 41 materi;
- 160 kartu spesies;
- kamus istilah;
- peta cabang biologi.

**Masih banyak yang kurang**, misalnya:

- beberapa cabang biologi belum punya materi: neurosains dasar, sinyal sel, fisiologi hewan komparatif, fisiologi tumbuhan lanjut;
- beberapa kelompok makhluk baru punya sedikit kartu, seperti arkea, laba-laba dan kalajengking, serta alga;
- spesies endemik Indonesia masih sedikit;
- banyak kartu spesies belum punya data umur maksimum.

Tugasmu: **riset sebebas dan seluas mungkin, lalu tulis materi biologi selengkap-lengkapnya di satu folder baru.** Kamu cukup menulis materinya. Setelah itu, Claude Code memindahkan materimu ke struktur data Biotaloka supaya tampil di situs, dan Codex merapikan tampilannya.

## Cari sendiri apa yang kurang

- Jelajahi situsnya dan isi repo, terutama:
  - `js/data/topics/*.js` (materi);
  - `js/data/species.js` (kartu spesies);
  - `js/data/glossary.js` (kamus);
  - `js/data/biomap.js` (peta cabang).
- Baca juga `docs/AUDIT-BIOLOGY.md`, terutama bagian B.5.
- Yang bisa kamu tulis, misalnya:
  - **materi baru** untuk cabang yang belum ada, dan **perdalaman** materi yang masih tipis;
  - **kartu spesies baru:** nama, deskripsi, makanan, habitat, ukuran, fakta menarik, status IUCN, dan endemik atau tidak. Utamakan kelompok yang tipis dan spesies Indonesia;
  - **umur maksimum** spesies yang sudah ada, dari basis data AnAge;
  - **istilah kamus baru**.

## Tempat menulis

Tulis semuanya di folder **`materi-gemini/`** di akar repo, dalam Markdown. Susunan yang disarankan (boleh kamu kembangkan):

```
materi-gemini/
  README.md            status, daftar isi, dan catatan untuk Claude
  materi/              satu berkas per materi
  spesies/             satu berkas per spesies, atau per kelompok
  kamus/
```

Untuk materi, tulis per jenjang (SD, SMP, SMA, kuliah). Setiap materi sebaiknya memuat:

- poin kunci;
- kegiatan atau percobaan aman;
- spesies contoh;
- soal pilihan ganda dengan kunci;
- catatan untuk guru: tujuan, langkah, penilaian, miskonsepsi;
- bacaan lanjutan.

## Beberapa aturan saja

1. **Bahasa Indonesia** yang baku sebagai bahasa utama. Kalau sempat, sertakan versi bahasa Inggris (ejaan British); kalau tidak, Claude yang menerjemahkan.
2. Teks untuk anak harus aman. Jangan menakut-nakuti berlebihan, dan jangan menyuruh menyentuh atau mengambil satwa liar.
3. **Tulis dengan kata-katamu sendiri.** Jangan menyalin teks dari situs lain.
4. **Setiap berkas ditutup dengan bagian "Sumber"** berisi tautan halaman yang benar-benar kamu baca. Utamakan:
   - OpenStax Biology 2e;
   - IUCN Red List;
   - GBIF dan iNaturalist;
   - AnAge (genomics.senescence.info);
   - museum, lembaga penelitian (LIPI/BRIN, KLHK), dan universitas.
5. Angka seperti ukuran, umur, dan jumlah ditulis persis seperti kata sumbernya. Spesies hanya disebut endemik kalau sumbernya menyatakan begitu.
6. Kalau ragu akan suatu fakta, tandai dengan `> Perlu dicek:` daripada menebak.
7. **Hanya tulis di dalam `materi-gemini/`.** Jangan mengubah berkas atau folder lain di repo.
8. Commit ke cabang **`gemini/materi`**, bukan `main`. Folder ini tidak ikut ter-deploy ke situs.

## Status dan tanda selesai

Baris pertama `materi-gemini/README.md` selalu berisi status:

- `Status: BERJALAN`, selama kamu masih menambah materi;
- `Status: SELESAI`, **hanya kalau menurutmu informasinya sudah lebih dari cukup**.

Claude baru mulai mengecek dan memindahkan materi ke situs setelah status berubah menjadi `SELESAI`. Jadi tidak perlu terburu-buru: lanjutkan riset di sesi berikutnya sampai kamu sendiri yakin materinya lengkap.

README juga berisi:

- daftar semua berkas;
- yang belum sempat ditulis;
- semua tanda `Perlu dicek`;
- catatan sampai mana sesi terakhir berhenti.
