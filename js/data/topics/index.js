// Curriculum topics. This index holds the light metadata that lists, search and the biology map
// need. The lesson itself (text for every level, quizzes, teacher notes) lives in
// js/data/topics/<id>.js and is loaded only when a lesson or its quiz is opened.
//
// To add a topic: create js/data/topics/<id>.js following an existing file, then add its
// metadata below, in learning order inside its field.
//
//   field   one of FIELDS (branch of biology the lesson belongs to)
//   levels  levels the lesson is recommended for; every level may still read any version
//   org     levels of biological organisation the lesson explains (see ORGANIZATION in biomap.js)

/** Branches of biology used to organise the lessons. Order = order on the Learn page. */
export const FIELDS = [
  {
    id: 'dasar',
    icon: '🔭',
    name: ['Dasar-dasar biologi', 'Foundations of biology'],
    desc: [
      'Apa itu hidup, bagaimana ilmuwan bekerja, dan bagaimana kehidupan tersusun dari molekul sampai biosfer.',
      'What life is, how scientists work, and how life is organised from molecules to the biosphere.',
    ],
  },
  {
    id: 'sel',
    icon: '🧫',
    name: ['Sel & molekul', 'Cells & molecules'],
    desc: [
      'Zat penyusun kehidupan, isi sel, energi sel, pembelahan sel, dan alur informasi DNA → RNA → protein.',
      'The chemistry of life, what is inside cells, cellular energy, cell division, and the DNA → RNA → protein flow.',
    ],
  },
  {
    id: 'genetika',
    icon: '🧬',
    name: ['Pertumbuhan, reproduksi, pewarisan & evolusi', 'Growth, reproduction, heredity & evolution'],
    desc: [
      'Bagaimana makhluk hidup tumbuh dan berkembang, berkembang biak, mewariskan sifat, dan berubah dari generasi ke generasi.',
      'How living things grow and develop, reproduce, pass on traits and change over generations.',
    ],
  },
  {
    id: 'keragaman',
    icon: '🌍',
    name: ['Keanekaragaman makhluk hidup', 'Diversity of life'],
    desc: [
      'Klasifikasi, virus, mikroba, protista, jamur, dunia hewan, serangga, vertebrata, kekayaan hayati Indonesia, dan kehidupan purba.',
      'Classification, viruses, microbes, protists, fungi, animal diversity, insects, vertebrates, Indonesia’s biodiversity and prehistoric life.',
    ],
  },
  {
    id: 'tumbuhan',
    icon: '🌿',
    name: ['Biologi tumbuhan', 'Plant biology'],
    desc: [
      'Bagian tubuh tumbuhan, jaringan dan pengangkutan, fotosintesis, pertumbuhan, dan keragaman tumbuhan.',
      'Plant organs, tissues and transport, photosynthesis, growth and plant diversity.',
    ],
  },
  {
    id: 'tubuh',
    icon: '🫀',
    name: ['Tubuh manusia & hewan', 'Human & animal body'],
    desc: [
      'Sistem organ: pencernaan, pernapasan, peredaran darah, ekskresi, gerak, saraf dan hormon, imun, serta reproduksi.',
      'Organ systems: digestion, breathing, circulation, excretion, movement, nerves and hormones, immunity and reproduction.',
    ],
  },
  {
    id: 'ekologi',
    icon: '🕸️',
    name: ['Ekologi & lingkungan', 'Ecology & environment'],
    desc: [
      'Hubungan makhluk hidup dengan lingkungannya, perilaku hewan, kehidupan laut, aliran energi, daur materi, dan perubahan lingkungan.',
      'How living things interact with their surroundings, animal behaviour, life in the sea, energy flow, nutrient cycles and environmental change.',
    ],
  },
  {
    id: 'terapan',
    icon: '⚗️',
    name: ['Biologi terapan', 'Applied biology'],
    desc: [
      'Memanfaatkan pengetahuan biologi untuk pangan, kesehatan, pengendalian penyakit, dan pengolahan data, beserta pertimbangan etikanya.',
      'Using biology for food, health, disease control and data analysis, and the ethical questions it raises.',
    ],
  },
];

const T = (id, field, icon, levels, org, title, summary) => ({ id, field, icon, levels, org, title, summary });
const ALL = ['sd', 'smp', 'sma', 'kuliah'];
const UPPER = ['smp', 'sma', 'kuliah'];

export const TOPICS = [
  // Foundations
  T(
    'ciri',
    'dasar',
    '🌱',
    ALL,
    ['organisme'],
    ['Ciri-ciri makhluk hidup', 'What makes something alive?'],
    [
      'Apa bedanya kucing, pohon, dan batu? Kenali tanda-tanda kehidupan.',
      'How is a cat different from a tree or a rock? Discover the signs of life.',
    ]
  ),
  T(
    'metode-ilmiah',
    'dasar',
    '🔭',
    ALL,
    [],
    ['Metode ilmiah: cara ilmuwan bekerja', 'The scientific method: how scientists work'],
    [
      'Bertanya, menduga, menguji, lalu menyimpulkan: cara kita tahu sesuatu itu benar.',
      'Ask, predict, test, conclude: how we find out what is true.',
    ]
  ),
  T(
    'organisasi',
    'dasar',
    '🪜',
    ALL,
    [],
    ['Tingkat organisasi kehidupan', 'Levels of biological organisation'],
    [
      'Dari molekul, sel, organ, sampai biosfer: kehidupan tersusun bertingkat.',
      'From molecules and cells to organs and the biosphere: life is built in levels.',
    ]
  ),
  // Cells & molecules
  T(
    'molekul',
    'sel',
    '⚛️',
    UPPER,
    ['molekul'],
    ['Molekul kehidupan & enzim', 'Molecules of life & enzymes'],
    [
      'Air, karbohidrat, lemak, protein, dan asam nukleat: bahan penyusun semua makhluk hidup.',
      'Water, carbohydrates, fats, proteins and nucleic acids: the building blocks of every living thing.',
    ]
  ),
  T(
    'sel',
    'sel',
    '🧫',
    UPPER,
    ['organel', 'sel'],
    ['Sel: unit kehidupan', 'Cells: the units of life'],
    [
      'Semua makhluk hidup tersusun atas sel. Apa saja isinya dan bagaimana bekerja?',
      'All living things are made of cells. What is inside, and how do they work?',
    ]
  ),
  T(
    'metabolisme',
    'sel',
    '🔋',
    UPPER,
    ['molekul', 'organel', 'sel'],
    ['Metabolisme & respirasi sel', 'Metabolism & cellular respiration'],
    [
      'Bagaimana sel mengubah makanan menjadi energi yang bisa dipakai?',
      'How do cells turn food into usable energy?',
    ]
  ),
  T(
    'pembelahan-sel',
    'sel',
    '➗',
    UPPER,
    ['sel'],
    ['Pembelahan sel: mitosis & meiosis', 'Cell division: mitosis & meiosis'],
    [
      'Satu sel menjadi dua: cara tubuh tumbuh, memperbaiki luka, dan membentuk sel kelamin.',
      'One cell becomes two: how bodies grow, heal and make sex cells.',
    ]
  ),
  T(
    'dna-protein',
    'sel',
    '🔡',
    UPPER,
    ['molekul', 'organel'],
    ['DNA, gen & protein', 'DNA, genes & proteins'],
    [
      'Bagaimana urutan huruf DNA dibaca sel untuk membuat protein?',
      'How do cells read the letters of DNA to build proteins?',
    ]
  ),
  // Reproduction, heredity & evolution
  T(
    'perkembangbiakan',
    'genetika',
    '🥚',
    ALL,
    ['organisme', 'populasi'],
    ['Perkembangbiakan & siklus hidup', 'Reproduction & life cycles'],
    [
      'Bertelur, melahirkan, bertunas, atau membelah diri — semua cara untuk berlanjut.',
      'Eggs, live birth, budding or splitting — every way life carries on.',
    ]
  ),
  T(
    'pertumbuhan',
    'genetika',
    '📏',
    ALL,
    ['sel', 'jaringan', 'organ', 'organisme'],
    ['Pertumbuhan & perkembangan', 'Growth & development'],
    [
      'Dari biji menjadi pohon, dari zigot menjadi manusia: bagaimana makhluk hidup tumbuh dan berkembang.',
      'From seed to tree and zygote to person: how living things grow and develop.',
    ]
  ),
  T(
    'pewarisan',
    'genetika',
    '🧬',
    UPPER,
    ['organisme', 'populasi'],
    ['Pewarisan sifat', 'Heredity'],
    [
      'Mengapa anak mirip orang tuanya? Dari gen, alel, hingga persilangan Mendel.',
      'Why do children resemble their parents? Genes, alleles and Mendel’s crosses.',
    ]
  ),
  T(
    'evolusi',
    'genetika',
    '🌳',
    UPPER,
    ['populasi', 'biosfer'],
    ['Evolusi & seleksi alam', 'Evolution & natural selection'],
    [
      'Bagaimana makhluk hidup berubah dari generasi ke generasi dan berkerabat satu sama lain?',
      'How do living things change over generations and come to be related?',
    ]
  ),
  T(
    'adaptasi',
    'genetika',
    '🦎',
    ALL,
    ['organisme', 'populasi'],
    ['Adaptasi', 'Adaptation'],
    [
      'Paruh, kulit, perilaku: cara makhluk hidup cocok dengan tempat tinggalnya.',
      'Beaks, skins and behaviours: how living things fit their homes.',
    ]
  ),
  // Diversity of life
  T(
    'klasifikasi',
    'keragaman',
    '🗂️',
    ALL,
    ['organisme'],
    ['Klasifikasi & nama ilmiah', 'Classification & scientific names'],
    [
      'Bagaimana ilmuwan mengelompokkan jutaan makhluk hidup dan memberinya nama?',
      'How do scientists group millions of living things and name them?',
    ]
  ),
  T(
    'virus',
    'keragaman',
    '💠',
    UPPER,
    [],
    ['Virus: di batas kehidupan', 'Viruses: at the edge of life'],
    [
      'Bukan sel, tetapi bisa memperbanyak diri di dalam sel. Apa sebenarnya virus?',
      'Not cells, yet able to multiply inside cells. What exactly is a virus?',
    ]
  ),
  T(
    'mikroorganisme',
    'keragaman',
    '🦠',
    ALL,
    ['sel', 'organisme', 'komunitas'],
    ['Mikroorganisme', 'Microorganisms'],
    [
      'Makhluk terkecil yang membuat tempe, menyuburkan tanah, dan kadang membuat kita sakit.',
      'The tiniest life that makes tempeh, feeds the soil and sometimes makes us ill.',
    ]
  ),
  T(
    'protista',
    'keragaman',
    '🔬',
    ['smp', 'sma', 'kuliah'],
    ['sel', 'organisme'],
    ['Protista: kehidupan bersel satu yang beragam', 'Protists: diverse single-celled life'],
    [
      'Amoeba, Paramecium, alga, dan Plasmodium penyebab malaria.',
      'Amoebas, Paramecium, algae and the malaria parasite Plasmodium.',
    ]
  ),
  T(
    'jamur',
    'keragaman',
    '🍄',
    ALL,
    ['organisme'],
    ['Jamur: pengurai dan penyerap', 'Fungi: decomposers and absorbers'],
    [
      'Bukan tumbuhan, bukan hewan: jamur payung, kapang tempe, ragi roti, dan kerabatnya.',
      'Neither plant nor animal: mushrooms, tempeh mould, baker’s yeast and their relatives.',
    ]
  ),
  T(
    'dunia-hewan',
    'keragaman',
    '🐾',
    ALL,
    ['jaringan', 'organisme'],
    ['Dunia hewan: dari spons sampai mamalia', 'Animal diversity: from sponges to mammals'],
    [
      'Kenali kelompok besar hewan dan rancangan tubuhnya, dari yang tanpa jaringan sampai bertulang belakang.',
      'Meet the major animal groups and their body plans, from animals without tissues to vertebrates.',
    ]
  ),
  T(
    'serangga',
    'keragaman',
    '🦋',
    ALL,
    ['organisme', 'populasi'],
    ['Serangga & artropoda', 'Insects & arthropods'],
    [
      'Hewan berkaki beruas: serangga, laba-laba, udang, dan lipan, beserta metamorfosisnya.',
      'Animals with jointed legs: insects, spiders, shrimps and centipedes, and their metamorphosis.',
    ]
  ),
  T(
    'vertebrata',
    'keragaman',
    '🐸',
    ALL,
    ['sistem-organ', 'organisme'],
    ['Hewan bertulang belakang', 'Vertebrates'],
    [
      'Ikan, amfibi, reptil, burung, dan mamalia: ciri, kekerabatan, dan adaptasinya.',
      'Fish, amphibians, reptiles, birds and mammals: features, relationships and adaptations.',
    ]
  ),
  T(
    'keanekaragaman',
    'keragaman',
    '🇮🇩',
    ALL,
    ['populasi', 'ekosistem', 'biosfer'],
    ['Keanekaragaman hayati Indonesia', 'Indonesia’s biodiversity'],
    [
      'Negeri kepulauan dengan satwa dan tumbuhan yang tidak ada di tempat lain — dan cara menjaganya.',
      'An island nation with wildlife found nowhere else — and how to protect it.',
    ]
  ),
  T(
    'purba',
    'keragaman',
    '🦖',
    ALL,
    ['biosfer'],
    ['Fosil & kehidupan purba', 'Fossils & prehistoric life'],
    [
      'Dinosaurus, trilobit, dan manusia purba Jawa: membaca kisah bumi dari batuan.',
      'Dinosaurs, trilobites and ancient humans of Java: reading Earth’s story in rock.',
    ]
  ),
  // Plant biology
  T(
    'tumbuhan',
    'tumbuhan',
    '🍃',
    ALL,
    ['jaringan', 'organ', 'sistem-organ'],
    ['Struktur & fungsi tumbuhan', 'Plant structure & function'],
    [
      'Akar, batang, daun, bunga, buah, dan biji: tugas setiap bagian dan cara tumbuhan tumbuh.',
      'Roots, stems, leaves, flowers, fruits and seeds: what each part does and how plants grow.',
    ]
  ),
  T(
    'fotosintesis',
    'tumbuhan',
    '☀️',
    ALL,
    ['organel', 'sel', 'ekosistem'],
    ['Tumbuhan & fotosintesis', 'Plants & photosynthesis'],
    [
      'Bagaimana tumbuhan “memasak” makanannya sendiri dengan cahaya matahari?',
      'How do plants “cook” their own food with sunlight?',
    ]
  ),
  T(
    'dunia-tumbuhan',
    'tumbuhan',
    '🌿',
    ALL,
    ['organisme'],
    ['Dunia tumbuhan: dari lumut sampai bunga', 'Plant diversity: from mosses to flowers'],
    [
      'Lumut, paku, tumbuhan berbiji terbuka, dan tumbuhan berbunga: bagaimana tumbuhan menaklukkan daratan.',
      'Mosses, ferns, conifers and flowering plants: how plants conquered the land.',
    ]
  ),
  // Human & animal body
  T(
    'pencernaan',
    'tubuh',
    '🍽️',
    ALL,
    ['organ', 'sistem-organ'],
    ['Makanan & sistem pencernaan', 'Food & the digestive system'],
    [
      'Perjalanan makanan dari mulut sampai usus, dan zat gizi yang dibutuhkan tubuh.',
      'The journey of food from mouth to gut, and the nutrients the body needs.',
    ]
  ),
  T(
    'pernapasan',
    'tubuh',
    '🌬️',
    ALL,
    ['organ', 'sistem-organ'],
    ['Sistem pernapasan', 'The respiratory system'],
    [
      'Mengapa kita perlu bernapas, dan bagaimana oksigen sampai ke setiap sel?',
      'Why do we breathe, and how does oxygen reach every cell?',
    ]
  ),
  T(
    'peredaran-darah',
    'tubuh',
    '❤️',
    ALL,
    ['jaringan', 'organ', 'sistem-organ'],
    ['Jantung & peredaran darah', 'The heart & circulation'],
    [
      'Jantung, pembuluh darah, dan darah: sistem pengangkut tubuh.',
      'Heart, blood vessels and blood: the body’s delivery system.',
    ]
  ),
  T(
    'ekskresi',
    'tubuh',
    '💧',
    ALL,
    ['organ', 'sistem-organ', 'organisme'],
    ['Ekskresi & homeostasis', 'Excretion & homeostasis'],
    [
      'Ginjal, kulit, paru-paru, dan hati membuang zat sisa dan menjaga tubuh tetap seimbang.',
      'Kidneys, skin, lungs and liver remove wastes and keep the body in balance.',
    ]
  ),
  T(
    'gerak',
    'tubuh',
    '🦴',
    ALL,
    ['jaringan', 'organ', 'sistem-organ'],
    ['Rangka, otot & gerak', 'Bones, muscles & movement'],
    [
      'Tulang, sendi, dan otot bekerja sama agar kita bisa berdiri, berlari, dan menulis.',
      'Bones, joints and muscles work together so we can stand, run and write.',
    ]
  ),
  T(
    'koordinasi',
    'tubuh',
    '🧠',
    ALL,
    ['sel', 'organ', 'sistem-organ'],
    ['Saraf, hormon & indra', 'Nerves, hormones & senses'],
    [
      'Bagaimana tubuh merasakan, berpikir, dan menanggapi: sistem saraf, hormon, dan alat indra.',
      'How the body senses, thinks and responds: nerves, hormones and sense organs.',
    ]
  ),
  T(
    'imun',
    'tubuh',
    '🛡️',
    ALL,
    ['sel', 'sistem-organ'],
    ['Sistem imun: pertahanan tubuh', 'The immune system: body defences'],
    [
      'Kulit, sel darah putih, antibodi, dan vaksin: cara tubuh melawan kuman.',
      'Skin, white blood cells, antibodies and vaccines: how the body fights germs.',
    ]
  ),
  T(
    'reproduksi-manusia',
    'tubuh',
    '👶',
    ALL,
    ['sel', 'organ', 'sistem-organ'],
    ['Reproduksi & tumbuh kembang manusia', 'Human reproduction & development'],
    [
      'Dari sel telur yang dibuahi sampai dewasa: tahap-tahap tumbuh kembang manusia.',
      'From a fertilised egg to adulthood: the stages of human growth and development.',
    ]
  ),
  // Ecology & environment
  T(
    'ekosistem',
    'ekologi',
    '🕸️',
    ALL,
    ['populasi', 'komunitas', 'ekosistem', 'bioma'],
    ['Ekosistem & rantai makanan', 'Ecosystems & food chains'],
    [
      'Siapa memakan siapa? Ikuti aliran energi dari matahari sampai pengurai.',
      'Who eats whom? Follow energy from the sun to the decomposers.',
    ]
  ),
  T(
    'perilaku',
    'ekologi',
    '🐝',
    ALL,
    ['organisme', 'populasi', 'komunitas'],
    ['Perilaku hewan', 'Animal behaviour'],
    [
      'Insting, belajar, komunikasi, dan kehidupan sosial hewan.',
      'Instinct, learning, communication and social life in animals.',
    ]
  ),
  T(
    'laut',
    'ekologi',
    '🌊',
    ALL,
    ['komunitas', 'ekosistem', 'bioma'],
    ['Kehidupan laut', 'Life in the sea'],
    [
      'Plankton, terumbu karang, zona laut, dan cara menjaga laut Indonesia.',
      'Plankton, coral reefs, ocean zones and caring for Indonesia’s seas.',
    ]
  ),
  T(
    'perubahan-lingkungan',
    'ekologi',
    '🌡️',
    ALL,
    ['ekosistem', 'bioma', 'biosfer'],
    ['Perubahan lingkungan & pelestarian', 'Environmental change & stewardship'],
    [
      'Pencemaran, sampah, perubahan iklim, dan apa yang bisa kita lakukan.',
      'Pollution, waste, climate change and what we can do about them.',
    ]
  ),
  // Applied biology
  T(
    'bioteknologi',
    'terapan',
    '⚗️',
    ALL,
    ['molekul', 'sel'],
    ['Bioteknologi', 'Biotechnology'],
    [
      'Dari tempe sampai vaksin dan CRISPR: memanfaatkan makhluk hidup untuk kebutuhan manusia.',
      'From tempeh to vaccines and CRISPR: putting living things to work for people.',
    ]
  ),
  T(
    'parasit',
    'terapan',
    '🦟',
    ALL,
    ['organisme', 'populasi'],
    ['Parasit & penyakit tropis', 'Parasites & tropical diseases'],
    [
      'Kutu, cacing, dan Plasmodium: cara hidup parasit dan cara mencegah penyakitnya.',
      'Lice, worms and Plasmodium: how parasites live and how to prevent the diseases they cause.',
    ]
  ),
  T(
    'bioinformatika',
    'terapan',
    '💻',
    ['smp', 'sma', 'kuliah'],
    ['molekul'],
    ['Bioinformatika & data biologi', 'Bioinformatics & biological data'],
    [
      'Komputer, DNA, dan data pengamatan: cara ilmuwan mengolah informasi kehidupan.',
      'Computers, DNA and observation data: how scientists handle the information of life.',
    ]
  ),
];

const byId = new Map(TOPICS.map(t => [t.id, t]));
/** Topic metadata (no lesson text). */
export const findTopic = id => byId.get(id) || null;
export const topicsInField = field => TOPICS.filter(t => t.field === field);

const cache = new Map();
/** Full lesson: metadata merged with js/data/topics/<id>.js. Resolves null for unknown ids. */
export function loadTopic(id) {
  const meta = findTopic(id);
  if (!meta) return Promise.resolve(null);
  if (!cache.has(id))
    cache.set(
      id,
      import(`./${id}.js`).then(
        mod => ({ ...mod.default, ...meta }),
        error => {
          cache.delete(id);
          throw error;
        }
      )
    );
  return cache.get(id);
}
export const loadTopics = (list = TOPICS) => Promise.all(list.map(t => loadTopic(t.id)));

/** Kurikulum Merdeka phases for each Biotaloka level (indicative mapping). */
export const PHASES = {
  sd: ['Fase A–C · SD kelas 1–6 (IPAS)', 'Phases A–C · Grades 1–6 (IPAS)'],
  smp: ['Fase D · SMP kelas 7–9 (IPA)', 'Phase D · Grades 7–9 (Science)'],
  sma: ['Fase E–F · SMA kelas 10–12 (Biologi)', 'Phases E–F · Grades 10–12 (Biology)'],
  kuliah: ['Perguruan tinggi · Biologi dasar', 'University · Introductory biology'],
};

/** Every lesson is written in four layers of depth, one per level. */
export const LAYERS = {
  sd: ['Sederhana', 'Simple'],
  smp: ['Standar', 'Standard'],
  sma: ['Lanjutan', 'Advanced'],
  kuliah: ['Mendalam', 'Deep dive'],
};
