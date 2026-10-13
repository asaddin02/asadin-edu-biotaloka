export default {
  id: 'bioinformatika',
  body: {
    sd: [
      `Ilmuwan biologi mengumpulkan sangat banyak catatan: foto hewan dan tumbuhan, tempat mereka ditemukan, dan “kode kehidupan” di dalam sel. Catatan sebanyak itu disimpan dan diolah dengan **komputer**. Ilmu yang memakai komputer untuk mempelajari data biologi disebut **[[bioinformatika]]**.

Contoh yang bisa kamu lihat langsung:
- Di **Biotaloka**, foto dan catatan makhluk hidup diambil dari iNaturalist dan GBIF, tempat orang di seluruh dunia berbagi pengamatan.
- Setiap foto yang diunggah dengan tanggal dan lokasi membantu ilmuwan mengetahui di mana suatu hewan atau tumbuhan hidup.

Di dalam setiap sel ada [[dna|DNA]], petunjuk kehidupan yang ditulis dengan empat huruf: **A, T, G, dan C**. Makhluk yang berkerabat dekat memiliki urutan huruf yang lebih mirip. Komputer membantu membandingkan jutaan huruf itu dengan cepat.

Kamu juga bisa menjadi ilmuwan warga: foto makhluk hidup di sekitarmu, catat tempat dan waktunya, lalu bagikan dengan bantuan orang tua atau guru.`,
      `Biologists collect huge numbers of records: photos of animals and plants, where they were found, and the “code of life” inside cells. So many records are stored and analysed with **computers**. The science of using computers to study biological data is called **[[bioinformatika|bioinformatics]]**.

Examples you can see yourself:
- In **Biotaloka**, photos and records of living things come from iNaturalist and GBIF, where people all over the world share observations.
- Every photo uploaded with a date and place helps scientists learn where an animal or plant lives.

Inside every cell is [[dna|DNA]], the instructions for life written with four letters: **A, T, G and C**. Closely related living things have more similar letter sequences. Computers help compare millions of these letters quickly.

You can be a citizen scientist too: photograph living things around you, note the place and time, and share them with help from a parent or teacher.`,
    ],
    smp: [
      `**[[bioinformatika|Bioinformatika]]** memadukan biologi, komputer, dan statistika untuk menyimpan, mencari, dan menganalisis data biologi. Beberapa jenis data dan basis datanya:
- **Urutan DNA dan protein**: GenBank (dikelola NCBI) menyimpan urutan dari seluruh dunia dan terbuka untuk umum.
- **Data kehadiran spesies**: GBIF menghimpun catatan spesimen museum dan pengamatan dari banyak lembaga; iNaturalist menampung foto pengamatan warga yang diidentifikasi bersama.
- **Struktur protein**: Protein Data Bank menyimpan bentuk tiga dimensi protein.

**Barcode DNA** memakai potongan gen pendek yang standar untuk mengenali spesies, seperti kode batang pada barang di toko. Untuk hewan biasanya dipakai gen mitokondria COI, untuk tumbuhan gen kloroplas *rbcL* dan *matK*, dan untuk jamur daerah ITS. Barcode DNA membantu mengenali ikan yang dijual dengan nama palsu, telur atau larva yang sulit dikenali, dan bahan satwa dilindungi yang diperdagangkan.

**Membandingkan urutan**: semakin banyak huruf yang sama antara dua urutan DNA, semakin dekat kekerabatannya. Dari perbandingan itu komputer dapat menyusun pohon kekerabatan.

**Data yang baik** memerlukan catatan yang lengkap dan jujur: nama spesies, tanggal, lokasi, foto, dan siapa pengamatnya. Data dari warga (citizen science) sangat berguna, tetapi perlu diperiksa karena ada kemungkinan salah identifikasi dan lebih banyak data dari tempat yang mudah dijangkau.`,
      `**[[bioinformatika|Bioinformatics]]** combines biology, computing and statistics to store, search and analyse biological data. Some kinds of data and their databases:
- **DNA and protein sequences**: GenBank (run by NCBI) stores sequences from around the world and is open to everyone.
- **Species occurrence data**: GBIF gathers museum specimen records and observations from many institutions; iNaturalist holds citizens’ photo observations identified by the community.
- **Protein structures**: the Protein Data Bank stores the 3D shapes of proteins.

**DNA barcoding** uses a short, standard piece of a gene to identify species, like a barcode on goods in a shop. Animals usually use the mitochondrial COI gene, plants the chloroplast genes *rbcL* and *matK*, and fungi the ITS region. DNA barcodes help identify fish sold under false names, eggs or larvae that are hard to recognise, and trafficked products from protected animals.

**Comparing sequences**: the more letters two DNA sequences share, the closer the relationship. From such comparisons, computers can build family trees.

**Good data** needs complete, honest records: species name, date, place, photo and who observed it. Citizen-science data are very useful but need checking, because misidentifications happen and more data come from easy-to-reach places.`,
    ],
    sma: [
      `**Penjajaran urutan (sequence alignment)** menyusun dua atau lebih urutan DNA atau protein berdampingan agar posisi yang sepadan dapat dibandingkan. Perbedaan dapat berupa substitusi (huruf berganti) atau celah (sisipan atau hilangnya huruf). Program **BLAST** mencari urutan yang mirip di basis data raksasa dalam hitungan detik dan melaporkan persentase kesamaan serta nilai E, yaitu perkiraan berapa kali kecocokan setara dapat muncul secara kebetulan.

**Dari urutan ke pohon kekerabatan**: urutan yang dijajarkan dianalisis untuk menyusun pohon filogenetik. Metode sederhana menghitung jarak (banyaknya perbedaan), sedangkan metode lanjut memakai model evolusi dan statistika. Cara ini dipakai untuk menentukan kekerabatan spesies, asal wabah, dan penyebaran varian virus.

**Genomik**: Proyek Genom Manusia dinyatakan selesai pada 2003, dan urutan genom manusia yang benar-benar lengkap dari ujung ke ujung (telomere-to-telomere) baru diterbitkan pada 2022. Genom manusia memuat sekitar 3 miliar pasang basa, tetapi hanya sekitar 20.000 gen pengode protein. Genom banyak organisme model, seperti *E. coli*, ragi, *C. elegans*, *Drosophila*, dan *Arabidopsis*, menjadi pembanding penting.

**Struktur protein**: bentuk protein menentukan fungsinya. Program AlphaFold, yang ikut diganjar Nobel Kimia 2024, dapat memperkirakan struktur banyak protein dari urutan asam aminonya dengan akurasi tinggi, tetapi hasil prediksi tetap perlu diuji dengan eksperimen.

**Etika data**: data genom manusia bersifat pribadi dan dapat mengungkap informasi tentang keluarga. Penggunaannya memerlukan persetujuan, perlindungan privasi, dan pembagian manfaat yang adil, termasuk bagi negara asal sumber daya genetik seperti Indonesia.`,
      `**Sequence alignment** lines up two or more DNA or protein sequences so that corresponding positions can be compared. Differences can be substitutions (a letter changes) or gaps (letters inserted or lost). The **BLAST** program searches huge databases for similar sequences in seconds, reporting percent identity and an E-value, the expected number of equally good matches by chance.

**From sequences to trees**: aligned sequences are analysed to build phylogenetic trees. Simple methods count distances (the number of differences), while advanced methods use evolutionary models and statistics. This approach is used to work out species relationships, the origin of outbreaks and the spread of virus variants.

**Genomics**: the Human Genome Project was declared complete in 2003, and a truly complete, end-to-end (telomere-to-telomere) human genome sequence was only published in 2022. The human genome contains about 3 billion base pairs but only about 20,000 protein-coding genes. The genomes of model organisms, such as *E. coli*, yeast, *C. elegans*, *Drosophila* and *Arabidopsis*, are important points of comparison.

**Protein structure**: a protein’s shape determines its function. AlphaFold, recognised in the 2024 Nobel Prize in Chemistry, can predict the structures of many proteins from their amino acid sequences with high accuracy, but predictions still need testing by experiment.

**Data ethics**: human genome data are personal and can reveal information about relatives. Their use requires consent, privacy protection and fair benefit sharing, including for countries of origin of genetic resources such as Indonesia.`,
    ],
    kuliah: [
      `**Algoritma penjajaran**: Needleman–Wunsch (1970) melakukan penjajaran global dan Smith–Waterman (1981) penjajaran lokal, keduanya dengan pemrograman dinamis yang dijamin optimal tetapi lambat untuk basis data besar. BLAST (1990) memakai heuristik “seed-and-extend” sehingga jauh lebih cepat. Skor bergantung pada matriks substitusi (misalnya BLOSUM62 untuk protein) dan penalti celah; nilai E bergantung pada ukuran basis data.

**Sekuensing generasi baru**: platform bacaan pendek (misalnya Illumina) menghasilkan miliaran bacaan ratusan basa dengan galat rendah, sedangkan platform bacaan panjang (Oxford Nanopore, PacBio) menghasilkan bacaan puluhan ribu basa yang memudahkan perakitan daerah berulang. Perakitan genom de novo umumnya memakai graf de Bruijn untuk bacaan pendek dan graf tumpang tindih untuk bacaan panjang. Kualitas rakitan dinilai dengan N50 dan kelengkapan gen ortolog (BUSCO).

**Metagenomik dan eDNA**: DNA langsung dari sampel lingkungan (tanah, air, usus) memungkinkan survei komunitas mikroba dan hewan tanpa membiakkan atau menangkapnya, tetapi rentan kontaminasi dan bergantung pada kelengkapan basis data rujukan.

**Filogenetika dan analisis evolusi**: kemungkinan maksimum dan inferensi Bayes dengan model substitusi, jam molekuler terkalibrasi fosil, dan filodinamika untuk melacak penyebaran patogen, seperti surveilans genom SARS-CoV-2 selama pandemi.

**Reproduksibilitas dan tata kelola data**: prinsip FAIR (Findable, Accessible, Interoperable, Reusable), pengutipan dataset dengan DOI (misalnya unduhan GBIF), versi perangkat lunak dan alur kerja yang terdokumentasi, serta kepatuhan pada Protokol Nagoya tentang akses dan pembagian manfaat sumber daya genetik.`,
      `**Alignment algorithms**: Needleman–Wunsch (1970) performs global alignment and Smith–Waterman (1981) local alignment, both by dynamic programming that is guaranteed optimal but slow for large databases. BLAST (1990) uses a seed-and-extend heuristic and is far faster. Scores depend on substitution matrices (such as BLOSUM62 for proteins) and gap penalties; E-values depend on database size.

**Next-generation sequencing**: short-read platforms (such as Illumina) produce billions of reads of a few hundred bases with low error, while long-read platforms (Oxford Nanopore, PacBio) produce reads of tens of thousands of bases that make repetitive regions easier to assemble. De novo genome assembly typically uses de Bruijn graphs for short reads and overlap graphs for long reads. Assembly quality is judged by N50 and the completeness of conserved orthologous genes (BUSCO).

**Metagenomics and eDNA**: DNA taken straight from environmental samples (soil, water, gut) allows surveys of microbial and animal communities without culturing or catching them, but it is prone to contamination and depends on complete reference databases.

**Phylogenetics and evolutionary analysis**: maximum likelihood and Bayesian inference with substitution models, fossil-calibrated molecular clocks, and phylodynamics to track pathogen spread, such as SARS-CoV-2 genomic surveillance during the pandemic.

**Reproducibility and data governance**: the FAIR principles (Findable, Accessible, Interoperable, Reusable), dataset citation with DOIs (such as GBIF downloads), documented software versions and workflows, and compliance with the Nagoya Protocol on access to genetic resources and benefit sharing.`,
    ],
  },
  key: {
    sd: [
      '- Bioinformatika memakai komputer untuk mempelajari data makhluk hidup.\n- DNA ditulis dengan empat huruf: A, T, G, C.\n- Foto pengamatan yang bertanggal dan berlokasi membantu ilmuwan.',
      '- Bioinformatics uses computers to study data about living things.\n- DNA is written with four letters: A, T, G, C.\n- Dated, located observation photos help scientists.',
    ],
    smp: [
      '- Basis data: GenBank (urutan DNA), GBIF dan iNaturalist (kehadiran spesies), PDB (struktur protein).\n- Barcode DNA: COI untuk hewan, rbcL dan matK untuk tumbuhan, ITS untuk jamur.\n- Data warga berguna tetapi perlu diperiksa.',
      '- Databases: GenBank (DNA sequences), GBIF and iNaturalist (occurrences), PDB (protein structures).\n- DNA barcodes: COI for animals, rbcL and matK for plants, ITS for fungi.\n- Citizen data are useful but need checking.',
    ],
    sma: [
      '- Penjajaran urutan dan BLAST: persentase kesamaan dan nilai E.\n- Genom manusia: sekitar 3 miliar pasang basa, sekitar 20.000 gen pengode protein.\n- AlphaFold memperkirakan struktur protein; data genom memerlukan etika.',
      '- Sequence alignment and BLAST: percent identity and E-value.\n- Human genome: about 3 billion base pairs, about 20,000 protein-coding genes.\n- AlphaFold predicts protein structures; genome data require ethics.',
    ],
    kuliah: [
      '- Needleman–Wunsch, Smith–Waterman, dan heuristik BLAST.\n- Bacaan pendek vs panjang; perakitan de Bruijn; N50 dan BUSCO.\n- FAIR, DOI dataset, dan Protokol Nagoya.',
      '- Needleman–Wunsch, Smith–Waterman and the BLAST heuristic.\n- Short vs long reads; de Bruijn assembly; N50 and BUSCO.\n- FAIR, dataset DOIs and the Nagoya Protocol.',
    ],
  },
  activity: {
    sd: [
      'Bersama guru, foto lima makhluk hidup di halaman sekolah. Catat nama, tanggal, jam, dan tempatnya di tabel. Bandingkan dengan pengamatan di Biotaloka bagian “Di sekitarku”.',
      'With your teacher, photograph five living things in the school grounds. Record the name, date, time and place in a table. Compare them with observations in Biotaloka’s “Near me” section.',
    ],
    smp: [
      'Bandingkan dua urutan DNA pendek (misalnya 30 huruf) yang disediakan guru. Hitung huruf yang sama dan berbeda, lalu hitung persentase kesamaannya. Ulangi untuk tiga pasangan dan susun urutan kekerabatannya.',
      'Compare two short DNA sequences (about 30 letters) provided by the teacher. Count matching and differing letters and work out the percent identity. Repeat for three pairs and rank how closely related they are.',
    ],
    sma: [
      'Ambil urutan gen β-globin dari laboratorium Kode Genetik Biotaloka, lalu jalankan pencarian BLAST di situs NCBI. Catat spesies dengan kecocokan tertinggi, persentase kesamaan, dan nilai E, lalu jelaskan artinya.',
      'Take the β-globin gene sequence from Biotaloka’s Genetic Code lab and run a BLAST search on the NCBI website. Record the top-matching species, percent identity and E-value, and explain what they mean.',
    ],
    kuliah: [
      'Unduh data kehadiran satu spesies Indonesia dari GBIF dengan DOI unduhan. Bersihkan data (koordinat mencurigakan, duplikat, catatan tanpa tanggal), dokumentasikan setiap langkah, lalu tulis kutipan dataset yang benar.',
      'Download occurrence data for one Indonesian species from GBIF with a download DOI. Clean the data (suspicious coordinates, duplicates, undated records), document every step and write a correct dataset citation.',
    ],
  },
  species: [
    'Homo sapiens',
    'Escherichia coli',
    'Saccharomyces cerevisiae',
    'Caenorhabditis elegans',
    'Drosophila melanogaster',
    'Arabidopsis thaliana',
  ],
  related: ['dna-protein', 'bioteknologi', 'klasifikasi', 'evolusi', 'metode-ilmiah'],
  lab: 'genetic',
  quiz: [
    {
      lv: ['sd'],
      q: ['DNA ditulis dengan empat huruf, yaitu…', 'DNA is written with four letters:'],
      a: [
        ['A, B, C, D', 'A, B, C, D'],
        ['A, T, G, C', 'A, T, G, C'],
        ['X, Y, Z, W', 'X, Y, Z, W'],
        ['K, L, M, N', 'K, L, M, N'],
      ],
      c: 1,
      why: ['Keempat huruf itu adalah basa adenin, timin, guanin, dan sitosin.', 'The four letters stand for the bases adenine, thymine, guanine and cytosine.'],
    },
    {
      lv: ['sd'],
      q: ['Agar foto pengamatan hewan berguna bagi ilmuwan, sebaiknya dilengkapi…', 'To make an animal photo useful to scientists, add…'],
      a: [
        ['Stiker lucu', 'Funny stickers'],
        ['Tanggal dan lokasi pengamatan', 'The date and place of the observation'],
        ['Filter warna', 'Colour filters'],
        ['Musik', 'Music'],
      ],
      c: 1,
      why: ['Tanggal dan lokasi membantu ilmuwan mengetahui kapan dan di mana spesies itu hidup.', 'The date and place tell scientists when and where the species lives.'],
    },
    {
      lv: ['sd', 'smp'],
      q: ['Dua makhluk hidup yang berkerabat dekat biasanya memiliki urutan DNA yang…', 'Two closely related living things usually have DNA sequences that are…'],
      a: [
        ['Sangat mirip', 'Very similar'],
        ['Sama sekali berbeda', 'Completely different'],
        ['Tidak memiliki huruf', 'Letter-free'],
        ['Lebih pendek', 'Shorter'],
      ],
      c: 0,
      why: ['Kerabat dekat berbagi nenek moyang yang baru, sehingga perbedaan urutannya sedikit.', 'Close relatives share a recent ancestor, so their sequences differ little.'],
    },
    {
      lv: ['smp'],
      q: ['Barcode DNA yang umum dipakai untuk mengenali spesies hewan adalah gen…', 'The DNA barcode commonly used to identify animal species is the gene…'],
      a: [
        ['COI mitokondria', 'Mitochondrial COI'],
        ['Klorofil', 'Chlorophyll'],
        ['Insulin', 'Insulin'],
        ['Keratin', 'Keratin'],
      ],
      c: 0,
      why: ['Potongan gen COI cukup bervariasi antarspesies hewan tetapi mirip di dalam satu spesies.', 'The COI fragment varies between animal species but is similar within a species.'],
    },
    {
      lv: ['smp'],
      q: ['Basis data yang menghimpun catatan kehadiran spesies dari museum dan pengamat di seluruh dunia adalah…', 'The database that gathers species occurrence records from museums and observers worldwide is…'],
      a: [
        ['GBIF', 'GBIF'],
        ['Protein Data Bank', 'Protein Data Bank'],
        ['Kamus bahasa', 'A language dictionary'],
        ['Peta jalan', 'A road map'],
      ],
      c: 0,
      why: ['GBIF (Global Biodiversity Information Facility) adalah salah satu sumber data Biotaloka.', 'GBIF (the Global Biodiversity Information Facility) is one of Biotaloka’s data sources.'],
    },
    {
      lv: ['smp', 'sma'],
      q: ['Mengapa data pengamatan warga perlu diperiksa sebelum dipakai untuk penelitian?', 'Why must citizen observation data be checked before research use?'],
      a: [
        ['Karena warga tidak boleh mengamati alam', 'Because citizens may not observe nature'],
        ['Karena ada kemungkinan salah identifikasi dan bias lokasi', 'Because of possible misidentification and location bias'],
        ['Karena foto selalu palsu', 'Because photos are always fake'],
        ['Karena komputer tidak bisa membacanya', 'Because computers cannot read them'],
      ],
      c: 1,
      why: ['Data warga sangat berharga, tetapi lebih banyak berasal dari tempat mudah dijangkau dan kadang salah nama.', 'Citizen data are valuable but cluster in accessible places and are sometimes misnamed.'],
    },
    {
      lv: ['sma'],
      q: ['Dalam hasil BLAST, nilai E yang sangat kecil berarti…', 'In BLAST results, a very small E-value means…'],
      a: [
        ['Kecocokan itu kemungkinan besar hanya kebetulan', 'The match is probably just chance'],
        ['Kecocokan itu sangat kecil kemungkinannya terjadi secara kebetulan', 'The match is very unlikely to be due to chance'],
        ['Urutan itu salah', 'The sequence is wrong'],
        ['Urutan itu sangat pendek', 'The sequence is very short'],
      ],
      c: 1,
      why: ['Nilai E adalah perkiraan banyaknya kecocokan setara yang muncul secara acak dalam basis data sebesar itu.', 'The E-value estimates how many equally good matches would appear by chance in a database that size.'],
    },
    {
      lv: ['sma'],
      q: ['Genom manusia memuat sekitar berapa gen pengode protein?', 'About how many protein-coding genes does the human genome contain?'],
      a: [
        ['Sekitar 200', 'About 200'],
        ['Sekitar 20.000', 'About 20,000'],
        ['Sekitar 3 miliar', 'About 3 billion'],
        ['Sekitar 1 juta', 'About 1 million'],
      ],
      c: 1,
      why: ['Tiga miliar adalah jumlah pasangan basa, bukan jumlah gen.', 'Three billion is the number of base pairs, not genes.'],
    },
    {
      lv: ['sma', 'kuliah'],
      q: ['AlphaFold terutama digunakan untuk…', 'AlphaFold is mainly used to…'],
      a: [
        ['Mengurutkan DNA', 'Sequence DNA'],
        ['Memperkirakan struktur tiga dimensi protein dari urutan asam aminonya', 'Predict a protein’s 3D structure from its amino acid sequence'],
        ['Menghitung jumlah spesies', 'Count species'],
        ['Membuat vaksin tanpa uji', 'Make vaccines without testing'],
      ],
      c: 1,
      why: ['Prediksi struktur mempercepat penelitian, tetapi tetap perlu dikonfirmasi eksperimen.', 'Structure prediction speeds research but still needs experimental confirmation.'],
    },
    {
      lv: ['kuliah'],
      q: ['Perbedaan utama algoritma Smith–Waterman dan Needleman–Wunsch adalah…', 'The main difference between Smith–Waterman and Needleman–Wunsch is that…'],
      a: [
        ['Smith–Waterman mencari penjajaran lokal, Needleman–Wunsch penjajaran global', 'Smith–Waterman finds local alignments, Needleman–Wunsch global ones'],
        ['Smith–Waterman hanya untuk protein', 'Smith–Waterman works only for proteins'],
        ['Needleman–Wunsch tidak memakai pemrograman dinamis', 'Needleman–Wunsch does not use dynamic programming'],
        ['Keduanya heuristik', 'Both are heuristics'],
      ],
      c: 0,
      why: ['Keduanya memakai pemrograman dinamis; BLAST-lah yang heuristik.', 'Both use dynamic programming; BLAST is the heuristic.'],
    },
    {
      lv: ['kuliah'],
      q: ['Keunggulan utama sekuensing bacaan panjang untuk perakitan genom adalah…', 'The main advantage of long-read sequencing for genome assembly is that it…'],
      a: [
        ['Tidak pernah salah', 'Never makes errors'],
        ['Dapat melintasi daerah berulang sehingga rakitan lebih utuh', 'Spans repetitive regions, giving more complete assemblies'],
        ['Tidak memerlukan komputer', 'Needs no computers'],
        ['Selalu lebih murah', 'Is always cheaper'],
      ],
      c: 1,
      why: ['Daerah berulang yang lebih panjang dari bacaan pendek membuat rakitan terputus-putus.', 'Repeats longer than short reads break assemblies into pieces.'],
    },
    {
      lv: ['kuliah'],
      q: ['Prinsip FAIR dalam pengelolaan data berarti data harus…', 'The FAIR principles mean data should be…'],
      a: [
        ['Gratis dan anonim saja', 'Just free and anonymous'],
        ['Mudah ditemukan, dapat diakses, dapat dipadukan, dan dapat dipakai ulang', 'Findable, Accessible, Interoperable and Reusable'],
        ['Disimpan di satu komputer', 'Kept on one computer'],
        ['Selalu dirahasiakan', 'Always kept secret'],
      ],
      c: 1,
      why: ['FAIR tidak sama dengan “terbuka tanpa syarat”; data sensitif tetap dapat dibatasi aksesnya.', 'FAIR is not the same as “open without conditions”; sensitive data can still have restricted access.'],
    },
  ],
  teacher: {
    goals: {
      sd: [
        'Peserta didik dapat menjelaskan bahwa ilmuwan memakai komputer untuk menyimpan catatan makhluk hidup dan dapat membuat catatan pengamatan yang lengkap.',
        'Learners can explain that scientists use computers to store records of living things and can make complete observation records.',
      ],
      smp: [
        'Peserta didik dapat menyebutkan jenis data biologi dan basis datanya, menjelaskan barcode DNA, dan menilai kualitas data warga.',
        'Learners can name kinds of biological data and their databases, explain DNA barcoding and judge the quality of citizen data.',
      ],
      sma: [
        'Peserta didik dapat menafsirkan hasil penjajaran urutan dan BLAST, menjelaskan dasar genomik, dan membahas etika data genom.',
        'Learners can interpret sequence alignments and BLAST results, explain genomics basics and discuss genome-data ethics.',
      ],
      kuliah: [
        'Mahasiswa dapat membandingkan algoritma penjajaran, strategi sekuensing dan perakitan, serta menerapkan prinsip data yang dapat direproduksi.',
        'Students can compare alignment algorithms, sequencing and assembly strategies, and apply reproducible data practices.',
      ],
    },
    time: ['2 × 40 menit (sebaiknya di laboratorium komputer)', '2 × 40 minutes (ideally in a computer lab)'],
    steps: [
      ['Pemantik: tunjukkan satu pengamatan iNaturalist dan tanyakan informasi apa saja yang tercatat.', 'Hook: show one iNaturalist observation and ask what information it records.'],
      ['Latihan membandingkan urutan DNA pendek secara manual.', 'Practise comparing short DNA sequences by hand.'],
      ['Penjelasan basis data dan alat bioinformatika sesuai jenjang.', 'Explain databases and bioinformatics tools at the right depth.'],
      ['Praktik BLAST atau eksplorasi data GBIF.', 'Hands-on BLAST or GBIF data exploration.'],
      ['Kuis dan refleksi tentang etika dan kualitas data.', 'Quiz and reflection on ethics and data quality.'],
    ],
    assess: [
      ['Tabel catatan pengamatan yang lengkap.', 'A complete observation record table.'],
      ['Perhitungan persentase kesamaan dan pohon kekerabatan sederhana.', 'Percent-identity calculations and a simple tree.'],
      ['Laporan hasil BLAST beserta penafsirannya.', 'A BLAST report with interpretation.'],
    ],
    misconceptions: [
      {
        wrong: ['Bioinformatika hanya untuk ahli komputer.', 'Bioinformatics is only for computer experts.'],
        right: [
          'Banyak alat bioinformatika dapat dipakai melalui situs web, dan pertanyaan biologinya tetap menjadi inti analisis.',
          'Many bioinformatics tools run in a web browser, and the biological question remains at the heart of the analysis.',
        ],
      },
      {
        wrong: ['Semakin banyak gen, semakin rumit makhluk hidupnya.', 'More genes means a more complex organism.'],
        right: [
          'Manusia memiliki sekitar 20.000 gen pengode protein, tidak jauh berbeda dari cacing C. elegans; kerumitan lebih banyak ditentukan pengaturan gen.',
          'Humans have about 20,000 protein-coding genes, not far from the worm C. elegans; complexity depends more on gene regulation.',
        ],
      },
      {
        wrong: ['Hasil BLAST teratas pasti nama spesies yang benar.', 'The top BLAST hit is always the correct species.'],
        right: [
          'Hasil bergantung pada kelengkapan dan ketepatan basis data. Urutan rujukan dapat salah label atau spesiesnya belum ada.',
          'Results depend on database completeness and accuracy. Reference sequences can be mislabelled or the species may be missing.',
        ],
      },
      {
        wrong: ['Data yang terbuka boleh dipakai tanpa menyebut sumbernya.', 'Open data can be used without citing the source.'],
        right: [
          'Data terbuka tetap harus dikutip sesuai lisensinya, misalnya dengan DOI unduhan GBIF.',
          'Open data must still be cited according to its licence, for example with a GBIF download DOI.',
        ],
      },
    ],
  },
  read: [
    { label: 'OpenStax Biology 2e · Ch. 17 Biotechnology and Genomics', url: 'https://openstax.org/books/biology-2e/pages/17-introduction', lv: 'sma' },
    { label: 'NCBI BLAST', url: 'https://blast.ncbi.nlm.nih.gov/Blast.cgi', lv: 'sma' },
    { label: 'NCBI GenBank', url: 'https://www.ncbi.nlm.nih.gov/genbank/', lv: 'sma' },
    { label: 'BOLD Systems · DNA barcodes', url: 'https://boldsystems.org/', lv: 'kuliah' },
    { label: 'Nobel Prize in Chemistry 2024 · Protein structure', url: 'https://www.nobelprize.org/prizes/chemistry/2024/summary/', lv: 'kuliah' },
  ],
};
