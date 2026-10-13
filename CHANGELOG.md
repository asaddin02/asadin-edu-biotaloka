# Riwayat perubahan / Changelog

## Nama baru: Biotaloka — 13 Oktober 2026

- Berganti nama menjadi **Biotaloka** dan pindah ke https://biotaloka.pages.dev. Data yang tersimpan di browser pada alamat lama tidak ikut pindah: ekspor cadangan di situs lama, lalu impor di alamat baru.

## Penyesuaian UI/UX setelah perluasan materi — 28 September 2026

- Katalog materi dan kuis memiliki pencarian, filter delapan bidang, jumlah hasil, serta keadaan kosong dengan tombol atur ulang. Filter tetap tersimpan saat memuat ulang, kembali dari materi, dan berganti bahasa.
- Kartu materi lebih ringkas; pintasan kegiatan dapat dijangkau langsung dari banner mode belajar.
- Peta Biologi mengikuti tata letak atlas dengan navigasi samping di desktop, kartu bidang dan cabang yang konsisten, serta tautan materi tambahan yang dapat dibuka sesuai kebutuhan.
- Menu simulasi dapat digeser pada ponsel dan tablet; pilihan aktif tetap terlihat. Simulasi kode genetik memakai ruang hasil selebar panel agar urutan DNA, RNA, dan protein lebih mudah dibaca.
- Beranda menghitung jumlah materi dan bidang langsung dari data, memperkenalkan pencarian materi, dan menyediakan pintasan Peta Biologi.
- Palet toska–mint–lime, tipografi editorial, dukungan dua bahasa, ukuran teks per jenjang, dan akses keyboard mengikuti antarmuka sebelumnya.

## Audit dan perluasan cakupan Biologi — 28 September 2026

Audit lengkap cakupan dan akurasi materi dicatat di [`docs/AUDIT-BIOLOGY.md`](docs/AUDIT-BIOLOGY.md) (audit awal dan audit akhir).

### Ditambahkan

- **29 topik baru**, sehingga menjadi 41 topik dalam 8 bidang biologi: metode ilmiah, tingkat organisasi kehidupan, molekul kehidupan & enzim, metabolisme & respirasi sel, pembelahan sel, DNA-gen-protein, pertumbuhan & perkembangan, virus, protista, jamur, dunia hewan, serangga & artropoda, hewan bertulang belakang, dunia tumbuhan, struktur & fungsi tumbuhan, sistem pencernaan, pernapasan, peredaran darah, ekskresi & homeostasis, gerak, koordinasi (saraf, hormon, indra), imun, reproduksi manusia, perilaku hewan, kehidupan laut, perubahan lingkungan, bioteknologi, parasit & penyakit tropis, serta bioinformatika & data biologi.
- Setiap topik ditulis dalam empat lapisan (SD Sederhana, SMP Standar, SMA Lanjutan, Kuliah Mendalam) dengan poin kunci per jenjang. Catatan guru memuat tujuan untuk keempat jenjang, daftar miskonsepsi beserta konsep yang benar, dan tabel diferensiasi per jenjang.
- **Peta Biologi** (`#/peta`): 12 tingkat organisasi kehidupan, 30 cabang ilmu biologi, tautan ke materi, dan cakupan konten yang dihitung langsung dari data. Hanya neurosains yang masih ditandai "baru dasar-dasarnya".
- **Pencarian materi dan konsep**: kotak saran dan halaman hasil kini juga menemukan topik, istilah kamus, dan tingkat organisasi, termasuk saat API organisme tidak dapat dihubungi.
- **Dua simulasi baru**: kode genetik (transkripsi dan translasi urutan gen β-globin manusia dari NCBI, termasuk mutasi sel sabit) dan kerja enzim (suhu, pH, denaturasi).
- **49 kartu spesies baru** (total 160) untuk kelompok yang sebelumnya kosong atau tipis: amfibi, spons, karang, ubur-ubur, bulu babi, teripang, cacing pipih, cacing gilig, pacet, kalajengking, tungau, lipan, kaki seribu, belangkas, rayap, belalang, kupu-kupu sayap burung, kutu rambut, udang windu, kepiting bakau, keong mas, gurita, ekidna dan kuskus Papua, gimnosperma, lumut, paku air, lamun, alga hijau dan merah, protista (jamur lendir, _Toxoplasma_, _Phytophthora_, _Volvox_), kapang, bakteri, serta organisme model (_Drosophila_, _C. elegans_, _Arabidopsis_). Kelompok baru "Alga".
- **Umur terpanjang yang tercatat** ditambahkan pada 36 kartu hewan (kini 39 kartu memiliki data umur), dari database AnAge (Human Ageing Genomic Resources, CC BY 3.0), hanya untuk catatan berkualitas "acceptable" atau "high".
- **110 istilah kamus baru** (total 213) untuk fisiologi, biologi molekuler, taksonomi, ekologi, perilaku, parasitologi, dan bioteknologi.
- **400 soal kuis baru** (total 476), termasuk soal tingkat kuliah untuk semua topik.

### Diperluas

- Enam topik lama yang paling ringkas (sel, pewarisan, evolusi, klasifikasi, ekosistem, keanekaragaman) diperluas di keempat jenjang: organel lengkap, endositosis/eksositosis, gen terpaut dan pewarisan terpaut X, seleksi seksual, isolasi reproduksi, penulis nama, sinonim dan subspesies, ekologi populasi dan komunitas, serta indeks keanekaragaman.
- Topik lama mendapat versi kuliah, poin kunci, miskonsepsi, dan daftar materi terkait yang dikurasi.

### Diperbaiki

- Teks materi yang diawali kalimat pengantar lalu daftar (misalnya "Tanda-tandanya:" diikuti "- Bernapas") sebelumnya tampil menyatu dalam satu paragraf dengan tanda "-". Kini tampil sebagai daftar; daftar bernomor juga didukung.
- Halaman spesies memakai foto kartu kurasi bila iNaturalist tidak memiliki foto berlisensi terbuka. Tiga mikroba (_Mycobacterium tuberculosis_, _Methanobrevibacter smithii_, _Toxoplasma gondii_) mendapat foto berlisensi terbuka dari Wikimedia Commons.
- Koreksi ilmiah: contoh _Biston betularia_ (batang pucat berlumut kerak atau liken, bukan berlumut), "mengurangi peningkatan efek rumah kaca", dan pembentuk stromatolit tertua yang belum dapat dipastikan sianobakteri. Definisi istilah gen dan mitokondria diperjelas.
- Tabel diferensiasi guru tampil bertumpuk di ponsel, bukan terpotong ke samping.
- Tabel kodon pada simulasi kode genetik dapat difokus dan digeser dengan keyboard.

## Pembaruan UI/UX — 25 September 2026

- Halaman dukungan menyediakan kanal Indonesia dan internasional yang dapat dikonfigurasi terpisah, beserta bantuan transaksi. Ajakan kontribusi kode diganti dengan penggunaan Biotaloka dalam kegiatan belajar.

- Halaman dukungan sukarela `#/dukung`, tautan footer dan bagian dukungan beranda; pembayaran melalui URL HTTPS eksternal yang dikonfigurasi pengelola. Status belum tersedia ditampilkan jika tujuan donasi belum diisi.

- Aturan sticky navbar dibatasi ke `#header` agar judul halaman tidak menutupi navigasi saat scroll; diuji pada desktop, tablet, dan ponsel.

- Target mode guru kini berupa empat pilihan radio yang selalu terlihat, menggantikan dropdown agar cukup sekali klik atau tap.
- Palet antarmuka disegarkan menjadi toska, mint, lime, dan aksen warna per halaman dengan kontras teks yang diuji.

- Pembaruan PWA yang sudah menunggu tetap ditawarkan setelah halaman dimuat ulang; pemasangan cache baru mengambil aset terbaru dari jaringan.

- Identitas buku-daun hasil generate AI diterapkan ke seluruh logo, favicon, ikon instalasi, dan pratinjau tautan.
- Palet hijau hutan dan latar hangat, judul editorial, tata letak foto baru, kartu serta permukaan bacaan yang konsisten.
- Tata letak khusus halaman: panel filter jelajah, katalog materi dan kegiatan, navigasi laboratorium, formulir guru bertahap, kamus dengan indeks alfabet, jalur taksonomi, koleksi, kuis, serta navigasi bagian. Panel desktop berubah menjadi susunan vertikal atau kontrol geser pada ponsel/tablet.
- Detail spesies di ponsel mengurutkan nama, foto, lalu informasi dan tindakan; tabel perbandingan menyesuaikan layar sempit.
- Draf tugas guru tetap tersimpan dalam sesi saat mode berubah; navigasi bagian tidak memuat ulang halaman.
- Beranda memprioritaskan kegiatan belajar, menyertakan contoh pencarian dan pintasan sesuai jenjang.
- Dialog mode mempertahankan dropdown serta fokus saat target guru berubah; memilih guru dari beranda langsung membuka pengaturan target.
- Respons pencarian yang terlambat tidak lagi membuka saran setelah pengguna menghapus teks, menekan Escape, atau Tab.
- Arsip implementasi versi 1/2 yang tidak digunakan dihapus; riwayatnya tetap tersedia di Git.
- Tes regresi mencakup dropdown guru, fokus keyboard, kunjungan pertama, dan pembatalan saran pencarian.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/). Versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [3.0.0] — 2026-09-24

Perombakan besar agar Biotaloka bisa dipakai siswa SD sampai mahasiswa serta guru, dan siap diterbitkan sebagai proyek open source.

### Ditambahkan

- **Lima mode**: Penjelajah Cilik (SD), Peneliti Muda (SMP), Ilmuwan (SMA), Akademik (Kuliah), dan Guru. Pilihan mode tersimpan, dan mode mengubah ukuran huruf, bahasa, materi, tab, serta kegiatan.
- 111 kartu spesies kurasi berbahasa sederhana dalam bahasa Indonesia dan Inggris.
- 12 topik materi sesuai Kurikulum Merdeka dengan teks per jenjang, 76 soal kuis, kegiatan, catatan guru, dan bacaan lanjutan.
- Kamus 103 istilah. Istilah bisa diklik langsung dari materi dan kartu spesies.
- Halaman baru: Kuis (tebak foto dan kuis materi), Bandingkan, Di sekitarku, Kehidupan purba (garis waktu dan PBDB), Kamus, Guru (tugas lewat tautan dan modul ajar cetak), serta Paspor Penjelajah dengan 12 lencana.
- Empat simulasi baru: fotosintesis, persilangan Mendel, seleksi alam, dan skala kehidupan.
- Tombol **Bacakan** memakai suara bawaan peramban.
- Mode Akademik: sinonim, author, sitasi BibTeX, unduh data temuan (CSV), serta tautan ke NCBI, GenBank, BOLD, IUCN, dan Open Tree of Life.
- PWA: bisa dipasang dan dipakai offline.
- Siap terbit di **Cloudflare Pages**. Workflow Deploy berjalan setelah CI lulus. Snapshot API untuk halaman populer diperbarui setiap malam, edge cache (Pages Function) melayani permintaan lain, dan `_headers` memasang header keamanan. Pratinjau tautan memakai URL lengkap (`og:url`, `og:image`).
- Aplikasi otomatis beralih ke API langsung selama 60 detik bila proxy atau edge cache sibuk, gagal, atau kuotanya habis.
- `server/server.mjs`: server produksi tanpa dependensi dengan proxy cache untuk GBIF dan iNaturalist, pengatur jeda permintaan, batas per klien, header keamanan, dan kompresi.
- Dockerfile, GitHub Actions CI, Dependabot, templat issue dan pull request.
- `npm run data:check` untuk memvalidasi konten, dan `--resolve` untuk mengisi ID serta foto spesies baru secara otomatis.
- 56 tes Playwright deterministik (termasuk aksesibilitas axe, tampilan 320–1440 px, CSP, dan offline), serta smoke test terhadap API sungguhan.
- LICENSE (MIT), LICENSE-CONTENT (CC BY-SA 4.0), panduan lisensi dan monetisasi, panduan skala, CONTRIBUTING, CODE_OF_CONDUCT, dan SECURITY.

### Diubah

- Pencarian memakai autocomplete iNaturalist, sehingga hasilnya relevan dengan kata yang diketik ("hiu" → hiu, bukan kucing hutan). Kelompok seperti famili juga bisa ditemukan ("nyamuk" → Culicidae).
- Galeri menampilkan makhluk hidup yang tercatat di Indonesia lebih dulu.
- Pohon kehidupan mendahulukan kelompok yang dikenal anak, dengan nama dan penjelasan ramah anak.
- Status konservasi dijelaskan dengan kata-kata, misalnya "Kritis, hampir punah".
- Ukuran huruf minimum dinaikkan. Navigasi bawah juga dipakai di tablet.
- Koleksi, catatan, progres, dan buku eksperimen tersimpan di perangkat dan tidak hilang saat halaman dimuat ulang.
- Kode dipecah menjadi modul per halaman yang dimuat saat dibutuhkan, dan dirapikan dengan Prettier dan ESLint.
- Foto beranda diganti dengan foto berlisensi CC0, CC BY, dan CC BY-SA. Foto berlisensi NC bisa dimatikan dengan satu pengaturan sebelum monetisasi.

### Diperbaiki

- Bagian "Bentuk & adaptasi" dan "Ukuran & usia" di halaman spesies menampilkan teks yang sama.
- Potongan teks sumber seperti "(Fig. 151)" muncul di deskripsi.
- Foto utama halaman spesies meminta alamat `…/undefined` sebelum jatuh ke ukuran sedang. Sekarang foto langsung memakai ukuran besar.
- `robots.txt` kini melarang crawler mengakses `/api/` dan `/data/`, yang bisa menghabiskan kuota.
- Tautan "Lewati ke konten" untuk pengguna keyboard dan pembaca layar membuka halaman "tidak ditemukan", karena `#main` dibaca sebagai rute. Sekarang tautan itu hanya memindahkan fokus ke konten.
- Batas permintaan per klien di server bisa dilewati dengan header `X-Forwarded-For` palsu. Header itu kini hanya dipercaya bila `TRUST_PROXY` diatur.

### Dihapus

- Screenshot, laporan, dan dokumen versi 2 di `docs/`. Kode dan dokumen versi 2 dipindahkan ke `archive/`.

## [2.0.0] — 2026-09-23

Versi sebelumnya: penelusuran taksonomi GBIF, galeri iNaturalist, dossier spesies dengan peta, antarmuka dua bahasa, dan tiga simulasi laboratorium. Implementasi lama tersedia dalam riwayat Git.
