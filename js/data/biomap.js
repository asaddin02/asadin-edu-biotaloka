// The map of biology used by the "Peta Biologi" page and by search.
// Content license: CC BY-SA 4.0.
//
// ORGANIZATION  levels of biological organisation, smallest first. Lessons point here with `org`.
// BRANCHES      branches (sub-disciplines) of biology and where Biotaloka covers them.
//               `topics` = lessons that teach the branch's core ideas; `tree` = GBIF taxon key to
//               open in the tree of life ('root' = the tree's start page); `partial` = no dedicated
//               lesson yet, only the basics inside broader lessons (said openly in the UI).

const O = (id, icon, name, desc, example) => ({ id, icon, name, desc, example });

export const ORGANIZATION = [
  O(
    'molekul',
    '⚛️',
    ['Molekul', 'Molecule'],
    {
      sd: [
        'Butiran zat yang sangat-sangat kecil. Air, gula, dan lemak adalah contohnya.',
        'Tiny, tiny bits of matter. Water, sugar and fat are examples.',
      ],
      smp: [
        'Gabungan atom. Makhluk hidup tersusun atas air dan molekul organik: karbohidrat, lipid, protein, dan asam nukleat.',
        'Atoms joined together. Living things are made of water and organic molecules: carbohydrates, lipids, proteins and nucleic acids.',
      ],
      sma: [
        'Molekul belum hidup. Sifat hidup muncul ketika banyak molekul tersusun dan bekerja bersama di dalam sel.',
        'Molecules are not alive. Life emerges when many molecules are organised and work together inside a cell.',
      ],
    },
    ['DNA, glukosa, hemoglobin, klorofil', 'DNA, glucose, haemoglobin, chlorophyll']
  ),
  O(
    'organel',
    '🔵',
    ['Organel', 'Organelle'],
    {
      sd: [
        'Bagian-bagian kecil di dalam sel yang punya tugas masing-masing.',
        'Little parts inside a cell, each with its own job.',
      ],
      smp: [
        'Struktur di dalam sel dengan fungsi khusus, misalnya inti sel, mitokondria, ribosom, dan kloroplas.',
        'Structures inside a cell with special jobs, such as the nucleus, mitochondria, ribosomes and chloroplasts.',
      ],
      sma: [
        'Sebagian besar organel bermembran hanya ada pada eukariota. Ribosom ada di semua sel, termasuk prokariota.',
        'Most membrane-bound organelles occur only in eukaryotes. Ribosomes are found in every cell, prokaryotes included.',
      ],
    },
    ['Mitokondria, kloroplas, ribosom, inti sel', 'Mitochondria, chloroplasts, ribosomes, nucleus']
  ),
  O(
    'sel',
    '🧫',
    ['Sel', 'Cell'],
    {
      sd: [
        'Bagian terkecil yang hidup. Tubuhmu tersusun atas sangat banyak sel.',
        'The smallest living part. Your body is made of a huge number of cells.',
      ],
      smp: [
        'Unit struktural dan fungsional terkecil makhluk hidup. Pada bakteri dan amoeba, satu sel sudah merupakan satu organisme.',
        'The smallest structural and functional unit of life. In bacteria and amoebas, one cell is a whole organism.',
      ],
      sma: [
        'Tingkat terendah yang memiliki semua ciri hidup: metabolisme, homeostasis, reproduksi, dan pewarisan informasi genetik.',
        'The lowest level that shows every property of life: metabolism, homeostasis, reproduction and inherited genetic information.',
      ],
    },
    ['Sel darah merah, sel saraf, sel daun, bakteri', 'Red blood cell, nerve cell, leaf cell, bacterium']
  ),
  O(
    'jaringan',
    '🧶',
    ['Jaringan', 'Tissue'],
    {
      sd: [
        'Kumpulan sel yang mirip dan bekerja bersama, seperti daging (otot).',
        'A group of similar cells working together, like muscle.',
      ],
      smp: [
        'Sekelompok sel dengan bentuk dan fungsi sama. Hewan memiliki jaringan epitel, otot, saraf, dan ikat; tumbuhan memiliki jaringan meristem, epidermis, dasar, dan pengangkut.',
        'A group of cells with the same shape and job. Animals have epithelial, muscle, nerve and connective tissue; plants have meristem, epidermis, ground and vascular tissue.',
      ],
      sma: [
        'Sel dalam jaringan terhubung oleh matriks ekstraseluler dan sambungan antarsel. Spons tidak memiliki jaringan sejati.',
        'Cells in a tissue are linked by extracellular matrix and cell junctions. Sponges lack true tissues.',
      ],
    },
    ['Jaringan otot jantung, xilem, epidermis daun', 'Heart muscle, xylem, leaf epidermis']
  ),
  O(
    'organ',
    '🫀',
    ['Organ', 'Organ'],
    {
      sd: [
        'Bagian tubuh yang punya tugas, misalnya jantung, paru-paru, dan daun.',
        'A body part with a job, such as the heart, lungs or a leaf.',
      ],
      smp: [
        'Beberapa jaringan yang bekerja sama menjalankan satu fungsi. Jantung tersusun atas jaringan otot, saraf, ikat, dan epitel.',
        'Several tissues working together for one function. The heart contains muscle, nerve, connective and epithelial tissue.',
      ],
      sma: [
        'Fungsi organ bergantung pada susunan jaringannya; kerusakan satu jaringan dapat mengganggu seluruh organ.',
        'An organ’s function depends on how its tissues are arranged; damage to one tissue can impair the whole organ.',
      ],
    },
    ['Jantung, ginjal, lambung, daun, akar', 'Heart, kidney, stomach, leaf, root']
  ),
  O(
    'sistem-organ',
    '🔗',
    ['Sistem organ', 'Organ system'],
    {
      sd: [
        'Beberapa organ yang bekerja sama. Mulut, lambung, dan usus bersama-sama mencerna makanan.',
        'Several organs working together. Mouth, stomach and intestines digest food together.',
      ],
      smp: [
        'Kumpulan organ untuk satu tugas besar, misalnya sistem pencernaan, pernapasan, peredaran darah, dan saraf.',
        'Organs grouped for one big task, such as the digestive, respiratory, circulatory and nervous systems.',
      ],
      sma: [
        'Sistem organ saling bergantung. Pernapasan menyediakan oksigen yang diangkut peredaran darah ke sel untuk respirasi.',
        'Organ systems depend on each other. Breathing supplies oxygen that circulation carries to cells for respiration.',
      ],
    },
    ['Sistem pencernaan, sistem saraf, sistem akar', 'Digestive system, nervous system, root system']
  ),
  O(
    'organisme',
    '🦧',
    ['Organisme', 'Organism'],
    {
      sd: ['Satu makhluk hidup utuh, misalnya seekor kucing atau sebatang pohon.', 'One whole living thing, such as a cat or a tree.'],
      smp: [
        'Satu individu makhluk hidup. Bisa bersel satu (bakteri) atau bersel banyak (manusia, pohon).',
        'One individual living thing, either single-celled (a bacterium) or many-celled (a person, a tree).',
      ],
      sma: [
        'Tingkat tempat seleksi alam bekerja pada fenotipe. Beberapa kasus menyulitkan batas individu, seperti koloni karang dan rumpun bambu.',
        'The level at which natural selection acts on phenotypes. Some cases blur the individual, such as coral colonies and bamboo clumps.',
      ],
    },
    ['Seekor orangutan, sebatang pohon durian', 'One orangutan, one durian tree']
  ),
  O(
    'populasi',
    '👥',
    ['Populasi', 'Population'],
    {
      sd: [
        'Sekelompok makhluk hidup sejenis yang tinggal di tempat yang sama.',
        'A group of the same kind of living thing living in one place.',
      ],
      smp: [
        'Kumpulan individu satu spesies di suatu daerah pada waktu tertentu. Populasi punya ukuran, kepadatan, dan laju kelahiran.',
        'All individuals of one species in an area at one time. Populations have size, density and birth rate.',
      ],
      sma: [
        'Unit evolusi: frekuensi alel berubah pada populasi, bukan pada individu.',
        'The unit of evolution: allele frequencies change in populations, not in individuals.',
      ],
    },
    ['Semua orangutan Sumatra di Ekosistem Leuser', 'All Sumatran orangutans in the Leuser Ecosystem']
  ),
  O(
    'komunitas',
    '🐒',
    ['Komunitas', 'Community'],
    {
      sd: [
        'Semua jenis makhluk hidup yang tinggal bersama di satu tempat.',
        'All the kinds of living things that live together in one place.',
      ],
      smp: [
        'Kumpulan berbagai populasi yang saling berinteraksi: memangsa, bersaing, dan bersimbiosis.',
        'Many populations interacting: predation, competition and symbiosis.',
      ],
      sma: [
        'Struktur komunitas dijelaskan oleh kekayaan dan kemerataan spesies, jaring makanan, dan suksesi.',
        'Community structure is described by species richness and evenness, food webs and succession.',
      ],
    },
    ['Orangutan, harimau, burung rangkong, dan pohon di hutan Leuser', 'Orangutans, tigers, hornbills and trees in the Leuser forest']
  ),
  O(
    'ekosistem',
    '🏞️',
    ['Ekosistem', 'Ecosystem'],
    {
      sd: [
        'Makhluk hidup bersama tanah, air, udara, dan cahaya di sekitarnya.',
        'Living things together with the soil, water, air and light around them.',
      ],
      smp: [
        'Komunitas beserta lingkungan abiotiknya. Di dalamnya energi mengalir dan materi berdaur.',
        'A community plus its non-living surroundings, in which energy flows and matter cycles.',
      ],
      sma: [
        'Ekosistem dianalisis melalui produktivitas, efisiensi trofik, dan daur biogeokimia.',
        'Ecosystems are analysed through productivity, trophic efficiency and biogeochemical cycles.',
      ],
    },
    ['Hutan Leuser dengan tanah, sungai, dan iklimnya', 'The Leuser forest with its soil, rivers and climate']
  ),
  O(
    'bioma',
    '🌴',
    ['Bioma', 'Biome'],
    {
      sd: ['Wilayah besar dengan cuaca dan tumbuhan yang mirip, seperti hutan hujan atau gurun.', 'A large region with similar weather and plants, like rainforest or desert.'],
      smp: [
        'Kumpulan ekosistem di wilayah luas yang ditentukan terutama oleh iklim, misalnya hutan hujan tropis, sabana, gurun, dan tundra.',
        'Groups of ecosystems across a large region, set mainly by climate: tropical rainforest, savanna, desert, tundra.',
      ],
      sma: [
        'Batas bioma mengikuti suhu dan curah hujan. Bioma perairan dibedakan menurut salinitas, kedalaman, dan cahaya.',
        'Biome boundaries follow temperature and rainfall. Aquatic biomes differ in salinity, depth and light.',
      ],
    },
    ['Hutan hujan tropis Asia Tenggara', 'Southeast Asian tropical rainforest']
  ),
  O(
    'biosfer',
    '🌏',
    ['Biosfer', 'Biosphere'],
    {
      sd: ['Seluruh bagian bumi yang dihuni makhluk hidup.', 'Every part of Earth where living things are found.'],
      smp: [
        'Semua ekosistem di bumi: darat, laut, air tawar, dan lapisan udara yang dihuni kehidupan.',
        'All of Earth’s ecosystems: land, sea, fresh water and the air where life is found.',
      ],
      sma: [
        'Biosfer berinteraksi dengan atmosfer, hidrosfer, dan litosfer; kehidupan mengubah susunan udara dan iklim bumi.',
        'The biosphere interacts with the atmosphere, hydrosphere and lithosphere; life has changed Earth’s air and climate.',
      ],
    },
    ['Bumi', 'Earth']
  ),
];

const B = (id, name, desc, topics, extra = {}) => ({ id, name, desc, topics, ...extra });

export const BRANCHES = [
  B(
    'biologi-sel',
    ['Biologi sel', 'Cell biology'],
    ['Struktur, fungsi, dan pembelahan sel.', 'The structure, function and division of cells.'],
    ['sel', 'metabolisme', 'pembelahan-sel']
  ),
  B(
    'biologi-molekuler',
    ['Biologi molekuler', 'Molecular biology'],
    [
      'Molekul kehidupan dan alur informasi DNA → RNA → protein.',
      'The molecules of life and the DNA → RNA → protein flow of information.',
    ],
    ['molekul', 'dna-protein']
  ),
  B('biokimia', ['Biokimia', 'Biochemistry'], ['Reaksi kimia di dalam makhluk hidup.', 'The chemistry of living things.'], [
    'molekul',
    'metabolisme',
    'fotosintesis',
  ]),
  B(
    'genetika',
    ['Genetika', 'Genetics'],
    ['Gen, pewarisan sifat, dan variasi.', 'Genes, heredity and variation.'],
    ['pewarisan', 'dna-protein', 'pembelahan-sel']
  ),
  B(
    'biologi-evolusi',
    ['Biologi evolusi', 'Evolutionary biology'],
    ['Perubahan makhluk hidup dan kekerabatannya.', 'How life changes and how organisms are related.'],
    ['evolusi', 'adaptasi', 'purba']
  ),
  B(
    'sistematika',
    ['Taksonomi & sistematika', 'Taxonomy & systematics'],
    ['Memberi nama, mengelompokkan, dan menyusun kekerabatan.', 'Naming, grouping and reconstructing relationships.'],
    ['klasifikasi'],
    { tree: 'root' }
  ),
  B(
    'ekologi',
    ['Ekologi', 'Ecology'],
    ['Hubungan makhluk hidup dengan lingkungannya.', 'How organisms interact with their environment.'],
    ['ekosistem', 'perubahan-lingkungan']
  ),
  B(
    'biologi-konservasi',
    ['Biologi konservasi', 'Conservation biology'],
    ['Menjaga keanekaragaman hayati.', 'Protecting biodiversity.'],
    ['keanekaragaman', 'perubahan-lingkungan']
  ),
  B(
    'biogeografi',
    ['Biogeografi', 'Biogeography'],
    ['Mengapa makhluk hidup tersebar di tempat tertentu.', 'Why organisms live where they do.'],
    ['keanekaragaman', 'evolusi']
  ),
  B('zoologi', ['Zoologi', 'Zoology'], ['Ilmu tentang hewan.', 'The study of animals.'], ['dunia-hewan', 'serangga', 'vertebrata'], { tree: 1 }),
  B('botani', ['Botani', 'Botany'], ['Ilmu tentang tumbuhan.', 'The study of plants.'], ['tumbuhan', 'dunia-tumbuhan', 'fotosintesis'], {
    tree: 6,
  }),
  B(
    'mikrobiologi',
    ['Mikrobiologi', 'Microbiology'],
    ['Ilmu tentang bakteri, arkea, protista, dan jamur mikroskopis.', 'The study of bacteria, archaea, protists and microscopic fungi.'],
    ['mikroorganisme', 'protista'],
    { tree: 3 }
  ),
  B('virologi', ['Virologi', 'Virology'], ['Ilmu tentang virus.', 'The study of viruses.'], ['virus']),
  B('mikologi', ['Mikologi', 'Mycology'], ['Ilmu tentang jamur.', 'The study of fungi.'], ['jamur'], { tree: 5 }),
  B('entomologi', ['Entomologi', 'Entomology'], ['Ilmu tentang serangga.', 'The study of insects.'], ['serangga', 'dunia-hewan'], {
    tree: 216,
  }),
  B('ornitologi', ['Ornitologi', 'Ornithology'], ['Ilmu tentang burung.', 'The study of birds.'], ['vertebrata', 'dunia-hewan'], {
    tree: 212,
  }),
  B('iktiologi', ['Iktiologi', 'Ichthyology'], ['Ilmu tentang ikan.', 'The study of fishes.'], ['vertebrata', 'laut'], {
    tree: 204,
  }),
  B(
    'herpetologi',
    ['Herpetologi', 'Herpetology'],
    ['Ilmu tentang amfibi dan reptil.', 'The study of amphibians and reptiles.'],
    ['vertebrata', 'dunia-hewan'],
    { tree: 131 }
  ),
  B('mamalogi', ['Mamalogi', 'Mammalogy'], ['Ilmu tentang mamalia.', 'The study of mammals.'], ['vertebrata', 'dunia-hewan'], {
    tree: 359,
  }),
  B(
    'biologi-laut',
    ['Biologi laut', 'Marine biology'],
    ['Kehidupan di laut, dari plankton sampai terumbu karang.', 'Life in the sea, from plankton to coral reefs.'],
    ['laut', 'ekosistem', 'keanekaragaman'],
    { tree: 43 }
  ),
  B(
    'fisiologi',
    ['Fisiologi', 'Physiology'],
    ['Cara kerja tubuh makhluk hidup.', 'How living bodies work.'],
    ['pencernaan', 'pernapasan', 'peredaran-darah', 'ekskresi', 'gerak', 'koordinasi']
  ),
  B('anatomi', ['Anatomi', 'Anatomy'], ['Susunan tubuh makhluk hidup.', 'The structure of living bodies.'], [
    'gerak',
    'tumbuhan',
    'dunia-hewan',
  ]),
  B(
    'neurosains',
    ['Neurosains', 'Neuroscience'],
    ['Sistem saraf dan otak.', 'The nervous system and brain.'],
    ['koordinasi', 'perilaku'],
    { partial: true }
  ),
  B('imunologi', ['Imunologi', 'Immunology'], ['Sistem pertahanan tubuh.', 'The body’s defence system.'], ['imun']),
  B(
    'biologi-perkembangan',
    ['Biologi perkembangan', 'Developmental biology'],
    ['Bagaimana satu sel zigot tumbuh menjadi organisme utuh.', 'How one fertilised egg grows into a whole organism.'],
    ['pertumbuhan', 'reproduksi-manusia', 'perkembangbiakan']
  ),
  B(
    'parasitologi',
    ['Parasitologi', 'Parasitology'],
    ['Parasit dan hubungannya dengan inang.', 'Parasites and their hosts.'],
    ['parasit', 'protista', 'imun'],
    { tree: 108 }
  ),
  B('paleontologi', ['Paleontologi', 'Palaeontology'], ['Kehidupan purba dari fosil.', 'Ancient life from fossils.'], ['purba']),
  B(
    'etologi',
    ['Etologi', 'Ethology'],
    ['Perilaku hewan.', 'Animal behaviour.'],
    ['perilaku', 'adaptasi']
  ),
  B(
    'bioteknologi',
    ['Bioteknologi', 'Biotechnology'],
    ['Memanfaatkan makhluk hidup untuk kebutuhan manusia.', 'Putting living things to work for people.'],
    ['bioteknologi']
  ),
  B(
    'bioinformatika',
    ['Bioinformatika', 'Bioinformatics'],
    ['Mengolah data biologi dengan komputer.', 'Analysing biological data with computers.'],
    ['bioinformatika', 'dna-protein']
  ),
];
