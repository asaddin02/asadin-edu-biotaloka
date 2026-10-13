# Audit cakupan dan akurasi Biologi Biotaloka

Dokumen ini mencatat audit Biotaloka sebagai **ensiklopedia Biologi interaktif untuk SD sampai kuliah dan guru**. Audit dibuat dua kali: sebelum perubahan (bagian A) dan sesudahnya (bagian B). Tujuannya agar klaim kelengkapan selalu bisa dibuktikan dari isi repositori, bukan dari kesan tampilan.

Status yang dipakai: **COMPLETE**, **PARTIAL**, **MISSING**, **INCORRECT**, **UNSOURCED**, **OUTDATED**, **BROKEN**.

Tindakan yang dipakai: **KEEP** (benar), **EXPAND** (benar tetapi dangkal), **CORRECT** (salah), **IMPLEMENT** (belum ada), **VERIFY/SOURCE** (tidak bersumber).

---

## A. Audit awal (28 September 2026, versi 3.0.0)

### A.1 Cara audit

- Membaca seluruh kode (`js/core`, `js/pages`, `js/components`, `js/services`, `js/labs`) dan semua data kurasi (`js/data`).
- Mengukur isi materi dengan skrip: jumlah kata per jenjang, jumlah soal per jenjang, kelengkapan catatan guru.
- Mencocokkan kata kunci konsep biologi dengan teks materi, untuk membedakan konsep yang **dibahas** dari yang hanya **disebut**.
- Membaca ulang seluruh teks materi versi Indonesia di semua jenjang untuk mencari klaim yang keliru.
- Menjalankan `npm run data:check`, ESLint, dan 72 tes Playwright. Semuanya lulus.

### A.2 Arsitektur yang sudah ada (KEEP)

| Bagian | Isi | Penilaian |
| --- | --- | --- |
| Mode jenjang | SD, SMP, SMA, Kuliah, dan Guru; mengubah ukuran huruf, tab, teks, kuis | Kuat. Menjadi dasar lapisan materi |
| Taksonomi | Domain (lapisan panduan) → kingdom → … → spesies, langsung dari GBIF Backbone; 193 kelompok berpenjelasan ramah anak | Kuat dan jujur: tingkatan yang kosong tidak diisi, dan dinyatakan bukan filogeni berskala waktu |
| Halaman spesies | Kartu kurasi + GBIF + iNaturalist + Wikipedia; uraian sumber dikelompokkan (habitat, makanan, morfologi, perilaku, reproduksi, konservasi); bagian kosong ditandai "belum ada uraian" | Kuat. Tidak mengarang data |
| Mode Akademik | Author, sinonim, status nama, BibTeX/RIS, CSV, tautan NCBI/BOLD/IUCN/OTOL | Kuat |
| Foto | Setiap foto berlisensi + atribusi; foto NC bisa dimatikan; fallback bila gagal | Kuat |
| Peta | Titik temuan GBIF, dengan keterangan bahwa itu bukan peta sebaran | Kuat dan jujur |
| Kehidupan purba | 29 entri, garis waktu ICS, rentang PBDB | Akurat (diperiksa) |
| Validasi data | `scripts/check-data.mjs` memeriksa pasangan bahasa, istilah kamus, spesies, dan kuis | Kuat |

### A.3 Matriks audit awal

| Area | Yang sudah ada | Status | Yang kurang | Yang keliru | Tindakan |
| --- | --- | --- | --- | --- | --- |
| **Dasar biologi**: ciri kehidupan | Topik `ciri` (SD, SMP, SMA) | PARTIAL | Versi kuliah | — | EXPAND |
| Metode ilmiah | Hanya istilah `hipotesis` dan `variabel` | MISSING | Topik kerja ilmiah untuk semua jenjang | — | IMPLEMENT |
| Tingkat organisasi (molekul → biosfer) | Satu kalimat di `ekosistem` | MISSING | Topik dan peta organisasi kehidupan | — | IMPLEMENT |
| Homeostasis, metabolisme | Disebut di `ciri` | MISSING | Pembahasan mekanisme | — | IMPLEMENT |
| **Biologi sel**: struktur sel | Topik `sel` | PARTIAL | Organel dibahas singkat | — | EXPAND |
| Transpor membran | Di `sel` (SMA) dan lab osmosis | PARTIAL | Endositosis/eksositosis | — | EXPAND |
| Respirasi sel | Hanya istilah | MISSING | Glikolisis, siklus Krebs, rantai elektron, fermentasi | — | IMPLEMENT |
| Siklus sel, mitosis, meiosis, apoptosis | Satu kalimat di `sel` | MISSING | Topik pembelahan sel | — | IMPLEMENT |
| Sinyal sel | Satu kalimat (kuliah) | PARTIAL | — | — | EXPAND |
| **Biologi molekuler**: DNA, RNA, replikasi, transkripsi, translasi, ekspresi gen, epigenetika | Istilah `dna`, `gen`, `kromosom`, `mutasi` | MISSING | Seluruh alur DNA → RNA → protein | — | IMPLEMENT |
| Molekul kehidupan dan enzim | Tidak ada | MISSING | Karbohidrat, lipid, protein, asam nukleat, enzim | — | IMPLEMENT |
| **Genetika** | Topik `pewarisan` (SMP–kuliah) | PARTIAL | Kaitan dengan meiosis dan DNA | — | EXPAND |
| **Evolusi** | Topik `evolusi`, `adaptasi` | PARTIAL | Versi kuliah `adaptasi` | "berlumut pucat" pada kasus *Biston betularia* seharusnya lumut kerak (liken) | CORRECT, EXPAND |
| **Taksonomi & sistematika** | Topik `klasifikasi`, pohon GBIF | COMPLETE | — | — | KEEP |
| **Keanekaragaman organisme**: hewan | Kartu kurasi: 26 mamalia, 13 burung, 7 reptil, **1 amfibi**, 8 ikan, 7 serangga, 1 laba-laba, 3 krustasea, 3 moluska, 3 invertebrata lain | PARTIAL | Tidak ada spons, karang, cacing pipih, cacing gilig, teripang, kalajengking; amfibi hanya 1; tidak ada materi dunia hewan (filum, rancangan tubuh) | — | IMPLEMENT, EXPAND |
| Tumbuhan | 22 kartu, hampir semua tumbuhan berbunga | PARTIAL | **Tidak ada** gimnosperma, lumut sejati, alga; materi struktur tumbuhan (akar, batang, daun, jaringan, transpor, hormon) tidak ada | — | IMPLEMENT |
| Jamur | 5 kartu, dibahas sedikit di `mikroorganisme` | PARTIAL | Materi biologi jamur (hifa, reproduksi, divisi, peran) | — | IMPLEMENT |
| Mikroorganisme | Topik `mikroorganisme` (SD–SMA), 5 bakteri, 3 arkea, 4 protista | PARTIAL | Versi kuliah | — | EXPAND |
| Virus | Dibahas di `mikroorganisme`; tidak masuk pohon kehidupan | PARTIAL | Topik khusus yang menjelaskan mengapa virus bukan organisme seluler | — | IMPLEMENT |
| **Fisiologi / tubuh manusia**: pencernaan, pernapasan, peredaran darah, ekskresi, gerak, saraf, hormon, indra, imun, reproduksi | **Tidak ada satu pun topik** | MISSING | Seluruh sistem organ untuk semua jenjang | — | IMPLEMENT (prioritas tertinggi: inti kurikulum SD–SMA) |
| **Ekologi**: ekosistem, rantai/jaring makanan, daur biogeokimia, interaksi | Topik `ekosistem` | COMPLETE | Ekologi populasi di SMA | — | KEEP, EXPAND |
| Perubahan lingkungan, pencemaran, iklim | Disebut di `keanekaragaman` | PARTIAL | Topik khusus | "hutan dan lamun mengurangi efek rumah kaca": yang dikurangi adalah peningkatan efek rumah kaca | CORRECT, IMPLEMENT |
| Konservasi | `keanekaragaman`, status IUCN | COMPLETE | — | — | KEEP |
| **Bioteknologi** | Satu paragraf di `mikroorganisme` | MISSING | Topik konvensional → modern (PCR, rekayasa genetika, CRISPR), etika | — | IMPLEMENT |
| Kehidupan purba | Topik `purba`, halaman garis waktu | PARTIAL | Versi kuliah | "stromatolit dari sianobakteri" ±3,5 miliar tahun lalu: pembentuk stromatolit tertua belum dapat dipastikan sianobakteri | CORRECT, EXPAND |
| **Cabang biologi** (zoologi, botani, mikologi, entomologi, dst.) | Tidak dijelaskan di mana pun | MISSING | Peta cabang ilmu dan tautan ke materi yang relevan | — | IMPLEMENT |
| **Ontologi / peta pengetahuan** | 12 topik dalam satu daftar datar | MISSING | Pengelompokan per bidang, tautan tingkat organisasi → materi | — | IMPLEMENT |
| **Kedalaman materi** | 86–150 kata per jenjang per topik | PARTIAL | Materi terlalu singkat untuk dipakai sebagai bahan ajar utama | — | EXPAND |
| **Lapisan per jenjang** | 6 dari 12 topik tanpa versi kuliah; ringkasan poin kunci tidak ada | PARTIAL | Versi kuliah; poin kunci per jenjang | — | IMPLEMENT |
| **Kuis** | 76 soal; kuliah hanya 1–2 soal per topik | PARTIAL | Soal kuliah dan soal untuk topik baru | — | EXPAND |
| **Materi guru** | Tujuan, langkah, asesmen, kunci jawaban | PARTIAL | Tujuan untuk kuliah **tidak ada di semua topik**; tidak ada daftar miskonsepsi | — | IMPLEMENT |
| **Pencarian** | Nama organisme (iNaturalist, GBIF) | PARTIAL | Materi, konsep, dan istilah kamus tidak bisa dicari dari kotak pencarian | — | IMPLEMENT |
| **Kartu spesies**: deskripsi, makanan, habitat, ukuran | 111 kartu | PARTIAL | Umur hanya 1 kartu; perilaku, reproduksi, pemangsa, dan peran ekologis bergantung pada uraian GBIF bila ada | — | KEEP (bagian kosong sudah ditandai "belum ada uraian") |
| Sumber per kartu spesies | Label "kurasi Biotaloka" | UNSOURCED | Rujukan per kartu | — | VERIFY/SOURCE (bertahap) |
| Foto kartu | 109/111 berfoto, semua berlisensi dan beratribusi | COMPLETE | 2 mikroba tanpa foto terbuka | — | KEEP |
| Kamus | 103 istilah | PARTIAL | Istilah fisiologi, molekuler, dan bioteknologi | — | EXPAND |
| Laboratorium | 7 simulasi | PARTIAL | Tidak ada model untuk kode genetik atau enzim | — | IMPLEMENT (bila waktu cukup) |
| Responsif, aksesibilitas, offline | Diuji 320–1440 px, axe, PWA | COMPLETE | — | — | KEEP |

### A.4 Temuan akurasi ilmiah

Teks yang ada umumnya akurat dan hati-hati. Klaim yang perlu dikoreksi:

1. `adaptasi` (SMA): contoh *Biston betularia* menyebut "batang berlumut pucat". Pada kasus klasik, yang pucat adalah **lumut kerak (liken)** di batang pohon.
2. `fotosintesis` (SMA): "mengurangi efek rumah kaca". Efek rumah kaca alami diperlukan kehidupan; hutan dan lamun mengurangi **peningkatan** efek rumah kaca (penumpukan CO₂).
3. `purba` (SMP): "stromatolit dari sianobakteri" ±3,5 miliar tahun lalu. Stromatolit tertua dibentuk komunitas mikroba yang identitasnya masih diperdebatkan. Peran sianobakteri paling jelas terlihat pada naiknya oksigen sekitar 2,4 miliar tahun lalu.

Taksonomi 111 kartu diperiksa terhadap nama yang kini diterima (misalnya *Malayopython reticulatus*, *Lissachatina fulica*, *Mobula birostris*, *Duttaphrynus melanostictus*). Tidak ditemukan nama usang yang salah.

### A.5 Prioritas perbaikan

1. **Fisiologi tubuh manusia** (MISSING, inti kurikulum SD–SMA).
2. **Sel dan molekul**: molekul kehidupan, enzim dan metabolisme, respirasi sel, pembelahan sel, DNA → protein.
3. **Keanekaragaman**: dunia hewan, dunia tumbuhan, struktur tumbuhan, jamur, virus.
4. **Dasar, ekologi, dan terapan**: metode ilmiah, tingkat organisasi, perubahan lingkungan, bioteknologi.
5. **Topik lama**: versi kuliah, tujuan guru untuk semua jenjang, miskonsepsi, poin kunci, koreksi A.4.
6. **Arsitektur**: bidang biologi (ontologi), Peta Biologi, pencarian materi dan istilah.
7. **Kartu spesies**: mengisi celah taksonomi (amfibi, gimnosperma, lumut, alga, cnidaria, echinodermata, cacing, organisme model).

---

## B. Audit akhir (28 September 2026, setelah perubahan)

### B.1 Cara audit ulang

- Mengukur ulang seluruh materi dengan skrip yang sama: kata per jenjang, soal per jenjang, poin kunci, tujuan guru, miskonsepsi, bacaan.
- Mencocokkan sekitar 100 kata kunci dari daftar periksa prompt audit (sel, molekuler, genetika, evolusi, taksonomi, fisiologi, ekologi, keanekaragaman), ditambah sekitar 40 kata kunci kurikulum (protista, organogenesis, struktur tubuh serangga, perilaku bawaan, toksoplasmosis, skabies, penjajaran urutan, dan lainnya) dengan teks materi. Hasil akhir: **tidak ada konsep yang hilang**. Putaran-putaran sebelumnya masih menemukan celah (peroksisom, eksositosis, gen terpaut, seleksi seksual, penulis nama, sinonim, subspesies, protista, organogenesis, perilaku hewan, dan lainnya); semuanya kemudian ditambahkan.
- Memeriksa semua tautan bacaan: 91 tautan unik, 88 menjawab HTTP 200. Tiga lainnya (doi.org → PNAS, UNESCO, IUCN Red List) menolak akses otomatis (403); DOI Woese dkk. (1990) diverifikasi lewat Crossref, dan dua lainnya adalah situs resmi.
- Membuka halaman di Chrome pada lebar 390, 1024, dan 1280 px dalam mode SD, SMP, SMA, dan Guru, dalam bahasa Indonesia dan Inggris, serta memeriksa galat konsol dan luapan horizontal.
- Menjalankan `npm run check`: ESLint, Prettier, validasi data, cek build service worker, dan seluruh tes Playwright.

### B.2 Angka awal dan akhir

Semua angka dihitung dari isi repositori (awal = commit `abc94a9`).

| Ukuran | Awal | Akhir |
| --- | --- | --- |
| Topik materi | 12, satu daftar datar | **41**, dalam 8 bidang biologi |
| Topik dengan keempat lapisan (SD, SMP, SMA, Kuliah) | 6 dari 12 | **41 dari 41** |
| Rata-rata kata per topik (SD / SMP / SMA / Kuliah) | 90 / 122 / 125 / 100 | **138 / 216 / 238 / 236** |
| Poin kunci per jenjang | tidak ada | 41 topik × 4 jenjang |
| Tujuan guru (SD / SMP / SMA / Kuliah) | 9 / 12 / 12 / 0 | **41 / 41 / 41 / 41** |
| Miskonsepsi beserta konsep yang benar | 0 | **158** |
| Soal kuis (total; SD / SMP / SMA / Kuliah) | 76; 29 / 48 / 44 / 11 | **476; 110 / 188 / 195 / 131** |
| Bacaan lanjutan | 24 | **108** |
| Istilah kamus | 103 | **213** (124 dengan penjelasan lanjutan) |
| Kartu spesies kurasi | 111 | **160** |
| Kartu dengan foto berlisensi terbuka | 109 | **159** |
| Kartu dengan data umur | 1 | **39** (36 dari AnAge) |
| Simulasi laboratorium | 7 | **9** |
| Cabang ilmu dengan materi khusus | tidak dipetakan | **29 dari 30** (neurosains baru dasar-dasarnya) |
| Pencarian | nama organisme saja | organisme, materi, istilah, dan tingkat organisasi |
| Tes otomatis | 72 | **82** |

### B.3 Matriks audit akhir

| Area | Status awal | Status akhir | Bukti / catatan |
| --- | --- | --- | --- |
| Ciri kehidupan | PARTIAL | COMPLETE | `ciri`, empat lapisan |
| Metode ilmiah | MISSING | COMPLETE | Topik `metode-ilmiah` |
| Tingkat organisasi (molekul → biosfer) | MISSING | COMPLETE | Topik `organisasi` dan Peta Biologi (12 tingkat) |
| Homeostasis, metabolisme | MISSING | COMPLETE | `ekskresi` (homeostasis, umpan balik), `metabolisme` |
| Struktur sel dan organel | PARTIAL | COMPLETE | `sel` diperluas: RE, Golgi, lisosom, vakuola, peroksisom, sitoskeleton, sentrosom |
| Transpor membran | PARTIAL | COMPLETE | Difusi, osmosis, transpor aktif, endositosis, eksositosis, tonisitas; lab osmosis |
| Respirasi sel, fotosintesis | MISSING / PARTIAL | COMPLETE | `metabolisme`, `fotosintesis` |
| Siklus sel, mitosis, meiosis, apoptosis | MISSING | COMPLETE | `pembelahan-sel` |
| Sinyal sel | PARTIAL | PARTIAL | Dibahas di `koordinasi` dan `sel` (kuliah); belum ada topik khusus |
| Biologi molekuler | MISSING | COMPLETE | `dna-protein` dan lab Kode genetik (urutan HBB dari NCBI) |
| Molekul kehidupan dan enzim | MISSING | COMPLETE | `molekul` dan lab Kerja enzim |
| Genetika | PARTIAL | COMPLETE | `pewarisan`: Mendel, gen terpaut, pewarisan terpaut X, silsilah, epistasis, Hardy–Weinberg, heritabilitas |
| Pertumbuhan dan perkembangan | PARTIAL | COMPLETE | Topik `pertumbuhan`: perkecambahan, hormon tumbuhan, embriogenesis, organogenesis, metamorfosis, tengkes, Hox, iPSC |
| Evolusi | PARTIAL, 1 INCORRECT | COMPLETE | Seleksi alam dan seksual, hanyutan, aliran gen, spesiasi, isolasi reproduksi, konvergensi; koreksi *Biston* |
| Taksonomi dan sistematika | COMPLETE | COMPLETE | Ditambah penulis nama, sinonim, subspesies, status nama, aturan kode nomenklatur |
| Hewan | PARTIAL | COMPLETE | `dunia-hewan`, `serangga`, `vertebrata`; kartu mencakup semua filum hewan utama |
| Tumbuhan | PARTIAL | COMPLETE | `tumbuhan`, `dunia-tumbuhan`, `pertumbuhan`; kartu lumut, paku air, gimnosperma, lamun |
| Jamur | PARTIAL | COMPLETE | Topik `jamur`; 8 kartu |
| Protista | MISSING | COMPLETE | Topik `protista`; 8 kartu protista dan 3 kartu alga |
| Mikroorganisme | PARTIAL | COMPLETE | `mikroorganisme` versi kuliah; kartu bakteri, arkea, protista |
| Virus | PARTIAL | COMPLETE | Topik `virus` menjelaskan mengapa virus bukan organisme seluler; virus sengaja tidak dimasukkan ke pohon kehidupan |
| Fisiologi tubuh manusia | MISSING | COMPLETE | 8 topik: pencernaan, pernapasan, peredaran darah, ekskresi, gerak, koordinasi, imun, reproduksi |
| Perilaku hewan | MISSING | COMPLETE | Topik `perilaku`: bawaan dan belajar, komunikasi, perilaku sosial, empat pertanyaan Tinbergen |
| Parasitologi dan penyakit tropis | PARTIAL | COMPLETE | Topik `parasit`: malaria, cacingan, filariasis, toksoplasmosis, skabies, One Health |
| Ekologi | COMPLETE | COMPLETE | Ditambah ekologi populasi (J/S, daya dukung), komunitas (relung, spesies kunci), suksesi |
| Biologi laut | PARTIAL | COMPLETE | Topik `laut`: zona laut, plankton-nekton-bentos, adaptasi, upwelling, Arlindo, pengasaman |
| Perubahan lingkungan | PARTIAL, 1 INCORRECT | COMPLETE | Topik `perubahan-lingkungan`; koreksi efek rumah kaca |
| Konservasi | COMPLETE | COMPLETE | Ditambah in situ/ex situ, indeks Shannon–Wiener, target 30×30 |
| Bioteknologi | MISSING | COMPLETE | Topik `bioteknologi` (konvensional → PCR, rekayasa genetika, CRISPR, etika) |
| Bioinformatika | MISSING | COMPLETE | Topik `bioinformatika`: basis data, barcode DNA, BLAST, genomik, etika data |
| Kehidupan purba | PARTIAL, 1 INCORRECT | COMPLETE | Versi kuliah; koreksi stromatolit |
| Cabang biologi | MISSING | COMPLETE (1 PARTIAL) | 30 cabang di Peta Biologi; 29 punya materi khusus, neurosains dibahas di `koordinasi` dan `perilaku` |
| Ontologi / peta pengetahuan | MISSING | COMPLETE | 8 bidang, 12 tingkat organisasi, tautan ke materi, materi terkait yang dikurasi |
| Lapisan per jenjang | PARTIAL | COMPLETE | 41/41 topik × 4 lapisan, poin kunci, tabel diferensiasi guru |
| Kuis | PARTIAL | COMPLETE | Setiap topik ≥ 3 soal untuk tiap jenjang yang disarankan |
| Materi guru | PARTIAL | COMPLETE | Tujuan empat jenjang, langkah, asesmen, miskonsepsi, kunci jawaban, modul cetak |
| Pencarian | PARTIAL | COMPLETE | Saran dan hasil mencakup materi dan istilah, juga saat API organisme tidak terjangkau |
| Kartu spesies: kolom isi | PARTIAL | PARTIAL | Umur pada 39 kartu; pemangsa, mangsa, perilaku, dan siklus hidup mengandalkan uraian GBIF |
| Sumber per kartu spesies | UNSOURCED | UNSOURCED | Belum dikerjakan (lihat B.5); data umur sudah bersumber AnAge |
| Foto kartu | COMPLETE | COMPLETE | 159/160 berfoto berlisensi terbuka; halaman spesies memakai foto kartu bila iNaturalist tidak punya |
| Kamus | PARTIAL | COMPLETE | 213 istilah tanpa duplikat alias |
| Laboratorium | PARTIAL | COMPLETE | 9 simulasi |
| Tampilan daftar di materi | (tidak terdeteksi) | COMPLETE | Ditemukan **BROKEN** pada audit akhir: 202 blok "kalimat pengantar + daftar" tampil sebagai satu paragraf; renderer diperbaiki dan diuji |
| Responsif, aksesibilitas, offline | COMPLETE | COMPLETE | Tabel diferensiasi guru dibuat bertumpuk di ponsel; tabel kodon dapat difokus keyboard |

### B.4 Koreksi ilmiah dan verifikasi

1. `adaptasi`: kasus *Biston betularia* kini menyebut batang pucat berlumut kerak (liken).
2. `fotosintesis`: hutan dan lamun mengurangi **peningkatan** efek rumah kaca, bukan efek rumah kaca itu sendiri.
3. `purba`: pembentuk stromatolit tertua dinyatakan belum pasti; peran sianobakteri dikaitkan dengan naiknya oksigen sekitar 2,4 miliar tahun lalu.
4. Kamus: `gen` kini didefinisikan sebagai petunjuk untuk membuat satu protein (penjelasan lanjutannya menyebut RNA fungsional), bukan satu “perintah sifat”; `mitokondria` **melepaskan** energi dari makanan, bukan “menghasilkan” energi.
5. Draf kartu spesies diperiksa sebelum digabung: warna karang “sebagian besar” dari alga simbion; sikas sudah ada **sebelum** zaman dinosaurus; sebaran *Physalia* ditulis “samudra hangat”; galur industri penisilin juga mencakup *Penicillium rubens*; kelaparan Irlandia ditulis “1840-an”; nama lokal yang tidak dapat dipastikan dihapus; *Drosophila melanogaster* dan *Pomacea canaliculata* memakai takson iNaturalist tingkat spesies, bukan takson “complex”; *Physarum polycephalum* dicatat bersama nama barunya di iNaturalist, *Badhamia polycephala*.
6. Angka dan fakta kunci diverifikasi ke sumber: efikasi Wolbachia di Yogyakarta (77,1%; Utarini dkk., NEJM 2021), urutan HBB (NCBI NM_000518.5), umur terpanjang dari AnAge Build 15 (hanya catatan berkualitas "acceptable" atau "high"), serta lisensi dan pembuat tiga foto Wikimedia Commons. Foto *Thermus aquaticus* di Commons tidak dipakai karena tidak mencantumkan pembuat maupun deskripsi.

### B.5 Yang masih belum tersedia dan keterbatasan

Kekurangan informasi yang tersisa:

1. **Sumber per kartu spesies.** Teks kartu kurasi (deskripsi, makanan, habitat, fakta seru) belum mencantumkan rujukan per fakta. Halaman spesies sudah menampilkan data GBIF, iNaturalist, dan Wikipedia beserta atribusinya, dan data umur sudah bersumber AnAge.
2. **Kolom kartu spesies.** Umur tercatat pada 39 dari 160 kartu; hewan lain belum ada di AnAge atau datanya dinilai kurang andal. Pemangsa, mangsa, perilaku, dan siklus hidup tidak dikurasi per kartu; halaman spesies menampilkannya hanya bila GBIF memiliki uraian, dan menandai bagian kosong sebagai “belum ada uraian”.
3. **Topik khusus yang belum ada**: neurosains (dibahas di `koordinasi` dan `perilaku`), sinyal sel, fisiologi hewan komparatif, dan fisiologi tumbuhan lanjut.
4. **Foto**: *Thermus aquaticus* belum memiliki foto berlisensi terbuka yang asal-usulnya jelas.

Bukan kekurangan informasi, tetapi perlu ditangani saat pengembangan berikutnya:

5. **Jumlah kartu per kelompok** tetap contoh perwakilan (misalnya arkea 3, laba-laba & kalajengking 3, alga 3). Jelajahi dan Pohon kehidupan menampilkan data langsung GBIF/iNaturalist untuk semua spesies yang tercatat di sana.
6. **Kaitan kurikulum** pada catatan guru bersifat indikatif dan belum dicocokkan kata per kata dengan dokumen Capaian Pembelajaran resmi.
7. **Telaah manusia.** Materi baru ditulis dan diperiksa dengan bantuan AI serta dicocokkan dengan sumber untuk angka dan klaim kunci, tetapi belum ditelaah guru biologi atau ahli.
