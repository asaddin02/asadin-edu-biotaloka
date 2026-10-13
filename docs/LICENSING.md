# Lisensi, foto, data, dan monetisasi

Dokumen ini menjelaskan apa yang boleh dilakukan dengan setiap bagian Biotaloka, dan langkah yang perlu diambil **sebelum** Biotaloka dimonetisasi (iklan, langganan, fitur berbayar, sponsor berbayar yang tampil di aplikasi, dan sejenisnya).

## Ringkasan

| Bagian | Lisensi | Boleh untuk komersial? |
|---|---|---|
| Kode sumber (`js/`, `css/`, `server/`, `scripts/`, `sw.js`, `index.html`) | MIT | Ya |
| Konten kurasi (`js/data/`) | CC BY-SA 4.0 | Ya, dengan atribusi dan share-alike |
| Foto beranda (`assets/portraits/`) | CC0 / CC BY / CC BY-SA (lihat `js/data/featured.js`) | Ya, dengan atribusi |
| Foto dari iNaturalist yang tampil saat aplikasi berjalan | Mengikuti lisensi tiap foto | Tergantung pengaturan (lihat di bawah) |
| Foto dalam kartu kurasi (`photo` di `species.js`) | Mengikuti lisensi tiap foto (sebagian besar CC0/BY/BY-SA) | Tergantung pengaturan |
| Data GBIF | Per dataset: CC0, CC BY 4.0, atau CC BY-NC 4.0 | Periksa dataset; kutip GBIF |
| Data iNaturalist (observasi) | Per observasi; API tunduk pada ketentuan iNaturalist | Tampilkan dengan atribusi |
| Wikipedia | CC BY-SA 4.0 | Ya, dengan atribusi dan share-alike |
| Paleobiology Database | CC BY 4.0 | Ya, dengan atribusi |
| Umur terpanjang tercatat pada kartu kurasi (`life`), dari AnAge / Human Ageing Genomic Resources | CC BY 3.0 | Ya, dengan menyebut HAGR (de Magalhães dkk., 2024, *Nucleic Acids Research* 52:D900–D908) |
| Tiga foto mikroba dalam kartu kurasi dari Wikimedia Commons | CC BY 4.0 / CC BY-SA 4.0 (atribusi di `photo.attribution`, tautan di `photo.source`) | Ya, dengan atribusi |
| Peta dasar Natural Earth | Domain publik | Ya |
| Ubin OpenStreetMap | ODbL; ikuti kebijakan penggunaan ubin OSM | Ya, dengan atribusi; hindari lalu lintas berat |
| Leaflet | BSD-2-Clause | Ya |

## Kebijakan foto non-komersial (NC)

Banyak foto di iNaturalist berlisensi **CC BY-NC** (non-komersial). Akses gratis, status pendidikan, atau donasi sukarela **tidak otomatis menjamin** penggunaan sesuai klausul NC. Penilaian bergantung pada tujuan dan konteks penggunaan. Iklan, langganan, hadiah untuk donatur, serta sponsor berbayar memerlukan peninjauan khusus. Lihat [FAQ resmi Creative Commons](https://creativecommons.org/faq/#does-my-use-violate-the-noncommercial-clause-of-the-licenses).

Biotaloka menyediakan satu sakelar di `js/config.js`:

```js
allowNonCommercialMedia: true, // ubah menjadi false sebelum monetisasi
```

Jika diubah menjadi `false`, aplikasi hanya menampilkan foto **CC0, CC BY, dan CC BY-SA**. Foto NC diganti tampilan “foto berlisensi belum tersedia”. Semua foto beranda sudah aman-komersial.

## Daftar periksa sebelum monetisasi

1. Ubah `allowNonCommercialMedia` menjadi `false` lalu jalankan `npm run build`.
2. Ganti foto NC pada kartu kurasi. Per 24 September 2026, 31 dari 111 kartu di `js/data/species.js` memakai foto CC BY-NC, BY-NC-SA, atau BY-NC-ND. Setelah langkah 1, foto-foto itu tidak tampil. Hapus field `photo` pada kartu tersebut, lalu jalankan `npm run data:check -- --resolve`. Skrip akan mencari foto CC0/CC BY/CC BY-SA terlebih dahulu. Kartu yang masih mendapat foto NC perlu dicarikan foto pengganti secara manual.
3. Pastikan atribusi foto tetap terlihat (sudah otomatis di setiap kartu dan galeri).
4. Tinjau apakah dataset GBIF yang ditampilkan berlisensi CC BY-NC. Untuk analisis atau produk turunan berbayar, gunakan unduhan GBIF ber-DOI dan saring lisensinya.
5. Hubungi iNaturalist bila lalu lintas API besar atau bila model bisnis bergantung pada data mereka. Gunakan server proxy Biotaloka (`server/server.mjs`) agar permintaan tetap sopan (≈1 per detik) dan ter-cache.
6. Jangan memuat ubin OpenStreetMap secara massal. Pertimbangkan penyedia ubin komersial bila lalu lintas tinggi.
7. Pertahankan halaman **Sumber & metode** dan **Privasi**. Bila menambah iklan atau analitik, perbarui kebijakan privasi, terutama karena penggunanya anak-anak. Pertimbangkan regulasi perlindungan data pribadi yang berlaku (misalnya UU PDP di Indonesia).
8. Konten kurasi CC BY-SA tetap boleh dipakai secara komersial. Namun adaptasinya harus dibagikan dengan lisensi yang sama.

## Model monetisasi yang selaras dengan open source

- **Donasi** (misalnya Saweria, Trakteer, GitHub Sponsors). Halaman `/dukung` dapat dibuka dari footer atau bagian dukungan di beranda. Isi `donateURL` di `js/config.js` dengan URL HTTPS akun donasi milik pengelola yang sudah diverifikasi. Tombol membuka layanan eksternal; aplikasi tidak memproses pembayaran. Jika URL kosong atau tidak valid, halaman menyatakan donasi uang belum tersedia. Donasi sukarela tidak memberikan akses eksklusif, nilai, atau lencana.
- **Sponsor institusi atau CSR** untuk biaya server dan penulisan konten, dengan pengakuan di halaman Sumber & metode.
- **Layanan untuk sekolah**: pelatihan guru, instalasi server lokal/offline, atau paket lembar kerja cetak.
- **Fitur sekolah berbayar di masa depan**, misalnya dasbor kelas dengan akun. Bagian ini membutuhkan backend dan kebijakan privasi anak yang ketat. Inti Biotaloka tetap gratis dan terbuka.

Dokumen ini bukan nasihat hukum. Bila ragu, konsultasikan dengan ahli hukum kekayaan intelektual.
