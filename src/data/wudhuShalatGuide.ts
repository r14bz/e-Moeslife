export interface GuideStep {
  id: string;
  number: string;
  title: string;
  badge: string;
  summary: string;
  movement?: string;
  arabic?: string;
  latin?: string;
  translation?: string;
  note?: string;
}

export interface ShalatIntention {
  id: string;
  name: string;
  rakaat: string;
  arabic: string;
  latin: string;
  translation: string;
}

export const WUDHU_RUKUN: ReadonlyArray<string> = [
  "Niat di dalam hati saat mulai membasuh wajah.",
  "Membasuh seluruh area wajah (dari tumbuhnya rambut kepala hingga dagu, dan antara kedua telinga).",
  "Membasuh kedua tangan hingga melewati kedua siku.",
  "Mengusap sebagian kepala (atau rambut kepala).",
  "Membasuh kedua kaki hingga melewati kedua mata kaki.",
  "Tertib (dilakukan berurutan sebagaimana rukun di atas).",
];

export const WUDHU_BATAL: ReadonlyArray<string> = [
  "Keluar sesuatu dari qubul atau dubur (kentut, buang air kecil, buang air besar).",
  "Hilang akal karena tidur nyenyak (kecuali duduk mantap yang tidak bergeser), pingsan, atau mabuk.",
  "Bersentuhan kulit antara laki-laki dan perempuan dewasa bukan mahram tanpa penghalang (menurut mazhab Syafi'i).",
  "Menyentuh kemaluan atau dubur dengan telapak tangan atau jari bagian dalam tanpa alas.",
];

export const WUDHU_STEPS: GuideStep[] = [
  {
    id: "wudhu-1",
    number: "01",
    title: "Basmalah, Niat & Mencuci Kedua Telapak Tangan",
    badge: "Sunnah & Pembuka",
    summary:
      "Mulai dengan membaca Bismillahirrahmanirrahim, membersihkan telapak tangan serta sela-sela jari sebanyak 3 kali sebelum memasukkan tangan ke wadah air.",
    movement: "Basuh kedua telapak tangan hingga pergelangan sambil menyela jari-jemari.",
    arabic: "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ",
    latin: "Bismillāhir-raḥmānir-raḥīm.",
    translation: "Dengan menyebut nama Allah Yang Maha Pengasih lagi Maha Penyayang.",
  },
  {
    id: "wudhu-2",
    number: "02",
    title: "Berkumur (Madhmadhah) & Istinsyaq",
    badge: "Sunnah",
    summary:
      "Berkumur sebanyak 3 kali untuk membersihkan rongga mulut, lalu menghirup air perlahan ke rongga hidung (istinsyaq) dan mengeluarkannya kembali (istintsar) sebanyak 3 kali.",
    movement: "Gunakan telapak tangan kanan untuk mengambil air ke mulut dan hidung, lalu keluarkan dengan tangan kiri.",
    note: "Bagi yang sedang berpuasa, tidak dianjurkan menghirup air terlalu dalam.",
  },
  {
    id: "wudhu-3",
    number: "03",
    title: "Niat Wudhu & Membasuh Seluruh Wajah",
    badge: "Rukun Wudhu 1 & 2",
    summary:
      "Bersamaan dengan menyentuhkan air ke wajah, hadirkan niat wudhu di dalam hati. Basuh wajah secara merata sebanyak 3 kali dari batas tumbuh rambut hingga bawah dagu dan dari telinga kanan ke telinga kiri.",
    movement: "Ratakan air ke seluruh kulit wajah, dahi, pelipis, pipi, dan janggut/dagu.",
    arabic: "نَوَيْتُ الْوُضُوْءَ لِرَفْعِ الْحَدَثِ الْأَصْغَرِ فَرْضًا لِلّٰهِ تَعَالٰى",
    latin: "Nawaitul-wuḍū'a liraf'il-ḥadaṡil-aṣgari farḍan lillāhi ta'ālā.",
    translation: "Aku berniat berwudhu untuk menghilangkan hadas kecil fardhu karena Allah Ta'ala.",
  },
  {
    id: "wudhu-4",
    number: "04",
    title: "Membasuh Kedua Tangan Hingga Siku",
    badge: "Rukun Wudhu 3",
    summary:
      "Basuh tangan kanan terlebih dahulu mulai dari ujung jari hingga melewati siku sebanyak 3 kali, lalu lanjutkan dengan tangan kiri sebanyak 3 kali.",
    movement: "Pastikan bagian lipatan siku dan sela-sela jari terbasuh sempurna. Lepaskan atau longgarkan cincin/jam tangan bila menghalangi air.",
  },
  {
    id: "wudhu-5",
    number: "05",
    title: "Mengusap Sebagian Kepala & Kedua Telinga",
    badge: "Rukun 4 & Sunnah",
    summary:
      "Usap kepala dengan tangan yang telah dibasahi air sebanyak 3 kali (diutamakan mengusap dari depan hingga tengkuk lalu kembali ke depan), kemudian usap bagian dalam dan luar kedua daun telinga.",
    movement: "Rukun wajibnya ialah mengusap sebagian rambut/kulit kepala; mengusap seluruh kepala dan kedua telinga adalah sunnah yang menyempurnakan.",
  },
  {
    id: "wudhu-6",
    number: "06",
    title: "Membasuh Kedua Kaki Hingga Mata Kaki",
    badge: "Rukun Wudhu 5 & 6",
    summary:
      "Basuh kaki kanan dimulai dari jari-jari kaki hingga melewati mata kaki sebanyak 3 kali sambil menyela jari kaki dengan kelingking, lalu lakukan hal yang sama pada kaki kiri secara tertib.",
    movement: "Pastikan area tumit belakang dan sela jari kaki terkena air seluruhnya.",
  },
  {
    id: "wudhu-7",
    number: "07",
    title: "Doa Setelah Wudhu",
    badge: "Penutup Sunnah",
    summary:
      "Setelah selesai berwudhu dengan tertib, disunnahkan menghadap kiblat dan membaca syahadat serta doa setelah wudhu.",
    arabic:
      "أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيْكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُوْلُهُ. اَللّٰهُمَّ اجْعَلْنِيْ مِنَ التَّوَّابِيْنَ وَاجْعَلْنِيْ مِنَ الْمُتَطَهِّرِيْنَ، وَجَعَلْنِيْ مِنْ عِبَادِكَ الصَّالِحِيْنَ",
    latin:
      "Asyhadu allā ilāha illallāhu waḥdahū lā syarīka lah, wa asyhadu anna Muḥammadan 'abduhū wa rasūluh. Allāhummaj'alnī minat-tawwābīna waj'alnī minal-mutaṭahhirīn, waj'alnī min 'ibādikaṣ-ṣāliḥīn.",
    translation:
      "Aku bersaksi tiada Tuhan selain Allah Yang Maha Esa tiada sekutu bagi-Nya, dan aku bersaksi bahwa Nabi Muhammad adalah hamba dan utusan-Nya. Ya Allah, jadikanlah aku termasuk golongan orang yang bertaubat, orang yang menyucikan diri, dan hamba-hamba-Mu yang saleh.",
  },
];

export const SHALAT_RUKUN: ReadonlyArray<string> = [
  "Niat di dalam hati saat takbiratul ihram.",
  "Berdiri tegak bagi yang mampu pada shalat fardhu.",
  "Takbiratul ihram (Allāhu Akbar).",
  "Membaca Surah Al-Fatihah pada setiap rakaat.",
  "Ruku' dengan thuma'ninah.",
  "I'tidal dengan thuma'ninah.",
  "Sujud dua kali setiap rakaat dengan thuma'ninah.",
  "Duduk di antara dua sujud dengan thuma'ninah.",
  "Duduk tasyahhud akhir.",
  "Membaca doa tasyahhud akhir.",
  "Membaca shalawat kepada Nabi Muhammad SAW pada tasyahhud akhir.",
  "Mengucapkan salam pertama sambil menoleh ke kanan.",
  "Tertib (berurutan sesuai urutan rukun).",
];

export const SHALAT_INTENTIONS: ShalatIntention[] = [
  {
    id: "subuh",
    name: "Shalat Subuh",
    rakaat: "2 Rakaat",
    arabic: "أُصَلِّيْ فَرْضَ الصُّبْحِ رَكْعَتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلّٰهِ تَعَالٰى",
    latin: "Uṣallī farḍaṣ-ṣubḥi rak'ataini mustaqbilal-qiblati adā'an lillāhi ta'ālā.",
    translation: "Saya berniat shalat fardhu Subuh dua rakaat menghadap kiblat karena Allah Ta'ala.",
  },
  {
    id: "dzuhur",
    name: "Shalat Dzuhur",
    rakaat: "4 Rakaat",
    arabic: "أُصَلِّيْ فَرْضَ الظُّهْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلّٰهِ تَعَالٰى",
    latin: "Uṣallī farḍaẓ-ẓuhri arba'a raka'ātin mustaqbilal-qiblati adā'an lillāhi ta'ālā.",
    translation: "Saya berniat shalat fardhu Dzuhur empat rakaat menghadap kiblat karena Allah Ta'ala.",
  },
  {
    id: "ashar",
    name: "Shalat Ashar",
    rakaat: "4 Rakaat",
    arabic: "أُصَلِّيْ فَرْضَ الْعَصْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلّٰهِ تَعَالٰى",
    latin: "Uṣallī farḍal-'aṣri arba'a raka'ātin mustaqbilal-qiblati adā'an lillāhi ta'ālā.",
    translation: "Saya berniat shalat fardhu Ashar empat rakaat menghadap kiblat karena Allah Ta'ala.",
  },
  {
    id: "maghrib",
    name: "Shalat Maghrib",
    rakaat: "3 Rakaat",
    arabic: "أُصَلِّيْ فَرْضَ الْمَغْرِبِ ثَلَاثَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلّٰهِ تَعَالٰى",
    latin: "Uṣallī farḍal-magribi ṡalāṡa raka'ātin mustaqbilal-qiblati adā'an lillāhi ta'ālā.",
    translation: "Saya berniat shalat fardhu Maghrib tiga rakaat menghadap kiblat karena Allah Ta'ala.",
  },
  {
    id: "isya",
    name: "Shalat Isya",
    rakaat: "4 Rakaat",
    arabic: "أُصَلِّيْ فَرْضَ الْعِشَاءِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلّٰهِ تَعَالٰى",
    latin: "Uṣallī farḍal-'isyā'i arba'a raka'ātin mustaqbilal-qiblati adā'an lillāhi ta'ālā.",
    translation: "Saya berniat shalat fardhu Isya empat rakaat menghadap kiblat karena Allah Ta'ala.",
  },
];

export const SHALAT_STEPS: GuideStep[] = [
  {
    id: "shalat-1",
    number: "01",
    title: "Berdiri Tegak, Niat & Takbiratul Ihram",
    badge: "Rukun 1–3",
    summary:
      "Berdiri menghadap kiblat dengan pandangan mengarah ke tempat sujud. Angkat kedua tangan sejajar bahu atau daun telinga seraya mengucapkan 'Allāhu Akbar' sambil menghadirkan niat shalat di dalam hati.",
    movement: "Setelah takbir, bersedekaplah dengan meletakkan tangan kanan di atas pergelangan tangan kiri di antara dada dan pusar.",
    arabic: "اَللّٰهُ أَكْبَرُ",
    latin: "Allāhu Akbar.",
    translation: "Allah Mahabesar.",
  },
  {
    id: "shalat-2",
    number: "02",
    title: "Membaca Doa Iftitah",
    badge: "Sunnah Hai'at",
    summary:
      "Dibaca pelan (sirr) pada rakaat pertama setelah takbiratul ihram sebelum membaca Surah Al-Fatihah.",
    arabic:
      "اَللّٰهُ أَكْبَرُ كَبِيْرًا وَالْحَمْدُ لِلّٰهِ كَثِيْرًا وَسُبْحَانَ اللّٰهِ بُكْرَةً وَأَصِيْلًا. إِنِّيْ وَجَّهْتُ وَجْهِيَ لِلَّذِيْ فَطَرَ السَّمٰوٰتِ وَالْأَرْضَ حَنِيْفًا مُسْلِمًا وَمَا أَنَا مِنَ الْمُشْرِكِيْنَ. إِنَّ صَلَاتِيْ وَنُسُكِيْ وَمَحْيَايَ وَمَمَاتِيْ لِلّٰهِ رَبِّ الْعٰلَمِيْنَ. لَا شَرِيْكَ لَهُ وَبِذٰلِكَ أُمِرْتُ وَأَنَا مِنَ الْمُسْلِمِيْنَ",
    latin:
      "Allāhu akbaru kabīran wal-ḥamdu lillāhi kaṡīran wa subḥānallāhi bukratan wa aṣīlā. Innī wajjahtu wajhiya lillażī faṭaras-samāwāti wal-arḍa ḥanīfan musliman wa mā ana minal-musyrikīn. Inna ṣalātī wa nusukī wa maḥyāya wa mamātī lillāhi rabbil-'ālamīn. Lā syarīka lahū wa biżālika umirtu wa ana minal-muslimīn.",
    translation:
      "Allah Mahabesar lagi sempurna kebesaran-Nya, segala puji bagi Allah dengan pujian yang banyak, Mahasuci Allah sepanjang pagi dan petang. Sungguh aku hadapkan wajahku kepada Tuhan yang menciptakan langit dan bumi dengan tulus dan berserah diri, dan aku bukan termasuk golongan musyrik. Sesungguhnya shalatku, ibadahku, hidupku, dan matiku hanyalah untuk Allah Tuhan semesta alam. Tiada sekutu bagi-Nya; demikianlah aku diperintahkan dan aku termasuk orang-orang muslim.",
  },
  {
    id: "shalat-3",
    number: "03",
    title: "Membaca Surah Al-Fatihah & Surah Pendek",
    badge: "Rukun 4",
    summary:
      "Membaca Al-Fatihah adalah rukun pada setiap rakaat. Pada rakaat pertama dan kedua, dilanjutkan dengan membaca ayat atau surah pendek Al-Qur'an.",
    arabic:
      "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ ۝ اَلْحَمْدُ لِلّٰهِ رَبِّ الْعٰلَمِيْنَ ۝ الرَّحْمٰنِ الرَّحِيْمِ ۝ مٰلِكِ يَوْمِ الدِّيْنِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِيْنُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيْمَ ۝ صِرَاطَ الَّذِيْنَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوْبِ عَلَيْهِمْ وَلَا الضَّالِّيْنَ ۝",
    latin:
      "Bismillāhir-raḥmānir-raḥīm. Al-ḥamdu lillāhi rabbil-'ālamīn. Ar-raḥmānir-raḥīm. Māliki yaumid-dīn. Iyyāka na'budu wa iyyāka nasta'īn. Ihdinaṣ-ṣirāṭal-mustaqīm. Ṣirāṭallażīna an'amta 'alaihim gairil-magḍūbi 'alaihim wa laḍ-ḍāllīn. (Āmīn)",
    translation:
      "Dengan menyebut nama Allah Yang Maha Pengasih lagi Maha Penyayang. Segala puji bagi Allah Tuhan semesta alam. Yang Maha Pengasih lagi Maha Penyayang. Pemilik hari pembalasan. Hanya kepada-Mu kami menyembah dan hanya kepada-Mu kami memohon pertolongan. Tunjukilah kami jalan yang lurus, yakni jalan orang-orang yang telah Engkau beri nikmat, bukan jalan mereka yang dimurkai dan bukan pula jalan mereka yang sesat.",
  },
  {
    id: "shalat-4",
    number: "04",
    title: "Ruku' dengan Thuma'ninah",
    badge: "Rukun 5",
    summary:
      "Bungkukkan badan hingga punggung dan kepala rata (sejajar 90 derajat), kedua telapak tangan memegang lutut dengan jari agak direnggangkan. Tunggu sejenak (thuma'ninah) lalu baca tasbih ruku' sebanyak 3 kali.",
    arabic: "سُبْحَانَ رَبِّيَ الْعَظِيْمِ وَبِحَمْدِهِ (٣×)",
    latin: "Subḥāna rabbiyal-'aẓīmi wa biḥamdih (3×).",
    translation: "Mahasuci Tuhanku Yang Maha Agung dan segala puji bagi-Nya.",
  },
  {
    id: "shalat-5",
    number: "05",
    title: "I'tidal (Bangkit dari Ruku')",
    badge: "Rukun 6",
    summary:
      "Bangkit berdiri tegak kembali sambil mengangkat kedua tangan sebagaimana saat takbiratul ihram dan membaca tasmi', lalu membaca tahmid i'tidal dengan tenang.",
    arabic:
      "سَمِعَ اللّٰهُ لِمَنْ حَمِدَهُ. رَبَّنَا لَكَ الْحَمْدُ مِلْءُ السَّمٰوٰتِ وَمِلْءُ الْأَرْضِ وَمِلْءُ مَا شِئْتَ مِنْ شَيْءٍ بَعْدُ",
    latin:
      "Sami'allāhu liman ḥamidah. Rabbanā lakal-ḥamdu mil'us-samāwāti wa mil'ul-arḍi wa mil'u mā syi'ta min syai'in ba'du.",
    translation:
      "Allah Maha Mendengar orang yang memuji-Nya. Wahai Tuhan kami, bagi-Mu segala puji sepenuh langit, sepenuh bumi, dan sepenuh segala sesuatu yang Engkau kehendaki sesudahnya.",
    note: "Pada rakaat kedua Shalat Subuh (menurut mazhab Syafi'i), dilanjutkan membaca Doa Qunut sebelum turun bersujud.",
  },
  {
    id: "shalat-qunut",
    number: "06",
    title: "Doa Qunut (Shalat Subuh)",
    badge: "Sunnah Ab'ad (Subuh)",
    summary:
      "Dibaca pada rakaat kedua Shalat Subuh setelah bangkit dari ruku' (i'tidal) sebelum turun sujud, seraya mengangkat kedua telapak tangan menghadap ke atas.",
    movement: "Berdiri tegak i'tidal sambil mengangkat kedua telapak tangan sejajar dada atau bahu menghadap ke atas, tanpa mengusap wajah setelah selesai berdoa.",
    arabic:
      "اَللّٰهُمَّ اهْدِنِيْ فِيْمَنْ هَدَيْتَ، وَعَافِنِيْ فِيْمَنْ عَافَيْتَ، وَتَوَلَّنِيْ فِيْمَنْ تَوَلَّيْتَ، وَبَارِكْ لِيْ فِيْمَا أَعْطَيْتَ، وَقِنِيْ شَرَّ مَا قَضَيْتَ، فَإِنَّكَ تَقْضِيْ وَلَا يُقْضٰى عَلَيْكَ، وَإِنَّهُ لَا يَذِلُّ مَنْ وَالَيْتَ، وَلَا يَعِزُّ مَنْ عَادَيْتَ، تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ، فَلَكَ الْحَمْدُ عَلٰى مَا قَضَيْتَ، أَسْتَغْفِرُكَ وَأَتُوْبُ إِلَيْكَ، وَصَلَّى اللّٰهُ عَلٰى سَيِّدِنَا مُحَمَّدٍ النَّبِيِّ الْأُمِّيِّ وَعَلٰى آلِهِ وَصَحْبِهِ وَسَلَّمَ",
    latin:
      "Allāhummahdinī fīman hadait, wa 'āfinī fīman 'āfait, wa tawallanī fīman tawallait, wa bārik lī fīmā a'ṭait, wa qinī syarra mā qaḍait, fa innaka taqḍī wa lā yuqḍā 'alaik, wa innahū lā yażillu man wālait, wa lā ya'izzu man 'ādait, tabārakta rabbanā wa ta'ālait, falakal-ḥamdu 'alā mā qaḍait, astaghfiruka wa atūbu ilaik, wa ṣallallāhu 'alā sayyidinā Muḥammadinin-nabiyyil-ummiyyi wa 'alā ālihī wa ṣaḥbihī wa sallam.",
    translation:
      "Ya Allah, berilah aku petunjuk bersama orang-orang yang telah Engkau beri petunjuk; berilah aku kesehatan bersama orang-orang yang telah Engkau beri kesehatan; lindungilah aku bersama orang-orang yang telah Engkau lindungi; berkahilah bagiku apa-apa yang telah Engkau karuniakan; dan jauhkanlah aku dari keburukan apa yang telah Engkau tetapkan. Sungguh Engkau yang memutuskan dan tidak ada yang dapat memutuskan atas-Mu; sesungguhnya tidak akan hina orang yang Engkau pimpin dan tidak akan mulia orang yang Engkau musuhi. Mahaberkah Engkau wahai Tuhan kami dan Mahatinggi Engkau. Maka bagi-Mu segala puji atas apa yang telah Engkau tetapkan; aku memohon ampun dan bertaubat kepada-Mu. Semoga Allah melimpahkan rahmat dan salam kepada junjungan kami Nabi Muhammad, nabi yang ummi, beserta keluarga dan para sahabatnya.",
    note: "Jika shalat berjamaah sebagai imam, lafaz tunggal ('nī' / 'lī') dibaca jamak ('ihdinā, 'āfinā, tawallanā, bārik lanā, qinā'), dan makmum mengaminkannya.",
  },
  {
    id: "shalat-6",
    number: "07",
    title: "Sujud Pertama & Kedua",
    badge: "Rukun 7",
    summary:
      "Turun bertumpu dengan kedua lutut lalu meletakkan tujuh anggota sujud ke sajadah: dahi dan hidung menempel, kedua telapak tangan sejajar bahu/telinga, kedua lutut, dan ujung jari kedua kaki menghadap kiblat. Baca tasbih sujud 3 kali.",
    movement: "Pastikan siku terangkat (tidak menempel ke lantai) dan perut agak renggang dari paha.",
    arabic: "سُبْحَانَ رَبِّيَ الْأَعْلٰى وَبِحَمْدِهِ (٣×)",
    latin: "Subḥāna rabbiyal-a'lā wa biḥamdih (3×).",
    translation: "Mahasuci Tuhanku Yang Maha Tinggi dan segala puji bagi-Nya.",
  },
  {
    id: "shalat-7",
    number: "08",
    title: "Duduk di Antara Dua Sujud",
    badge: "Rukun 8",
    summary:
      "Bangun dari sujud pertama lalu duduk iftirasy (duduk di atas kaki kiri sedangkan telapak kaki kanan ditegakkan). Letakkan kedua telapak tangan di atas paha dekat lutut, lalu baca doa dengan tenang.",
    arabic:
      "رَبِّ اغْفِرْ لِيْ وَارْحَمْنِيْ وَاجْبُرْنِيْ وَارْفَعْنِيْ وَارْزُقْنِيْ وَاهْدِنِيْ وَعَافِنِيْ وَاعْفُ عَنِّيْ",
    latin:
      "Rabbighfirlī warḥamnī wajburnī warfa'nī warzuqnī wahdinī wa 'āfinī wa'fu 'annī.",
    translation:
      "Ya Tuhanku, ampunilah aku, rahmatilah aku, cukupkanlah kekuranganku, angkatlah derajatku, berilah aku rezeki, tunjukilah aku, sehatkanlah aku, dan maafkanlah aku.",
  },
  {
    id: "shalat-8",
    number: "09",
    title: "Tasyahhud Awal (Rakaat Kedua Shalat 3/4 Rakaat)",
    badge: "Sunnah Ab'ad",
    summary:
      "Pada rakaat kedua shalat Dzuhur, Ashar, Maghrib, dan Isya, duduk iftirasy sambil meletakkan tangan di atas paha, jari tangan kanan mengepal selain telunjuk yang menunjuk saat membaca 'illallāh'.",
    arabic:
      "اَلتَّحِيَّاتُ الْمُبَارَكَاتُ الصَّلَوَاتُ الطَّيِّبَاتُ لِلّٰهِ. اَلسَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ. اَلسَّلَامُ عَلَيْنَا وَعَلٰى عِبَادِ اللّٰهِ الصَّالِحِيْنَ. أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُوْلُ اللّٰهِ. اَللّٰهُمَّ صَلِّ عَلٰى سَيِّدِنَا مُحَمَّدٍ",
    latin:
      "At-taḥiyyātul-mubārakātuṣ-ṣalawātuṭ-ṭayyibātu lillāh. As-salāmu 'alaika ayyuhan-nabiyyu wa raḥmatullāhi wa barakātuh. As-salāmu 'alainā wa 'alā 'ibādillāhiṣ-ṣāliḥīn. Asyhadu allā ilāha illallāhu wa asyhadu anna Muḥammadar-rasūlullāh. Allāhumma ṣalli 'alā sayyidinā Muḥammad.",
    translation:
      "Segala kehormatan, keberkahan, rahmat, dan kebaikan adalah milik Allah. Semoga keselamatan, rahmat Allah, dan berkah-Nya tercurah kepadamu wahai Nabi. Semoga keselamatan juga tercurah kepada kami dan hamba-hamba Allah yang saleh. Aku bersaksi bahwa tiada Tuhan selain Allah, dan aku bersaksi bahwa Nabi Muhammad adalah utusan Allah. Ya Allah, limpahkanlah rahmat kepada junjungan kami Nabi Muhammad.",
  },
  {
    id: "shalat-9",
    number: "10",
    title: "Tasyahhud Akhir & Shalawat Ibrahimiyah",
    badge: "Rukun 9–11",
    summary:
      "Pada rakaat terakhir, duduk tawarruk (pantat kiri menyentuh lantai, kaki kiri dimasukkan di bawah betis kanan, kaki kanan ditegakkan). Baca tasyahhud beserta shalawat Ibrahimiyah lengkap.",
    arabic:
      "اَللّٰهُمَّ صَلِّ عَلٰى سَيِّدِنَا مُحَمَّدٍ وَعَلٰى آلِ سَيِّدِنَا مُحَمَّدٍ كَمَا صَلَّيْتَ عَلٰى سَيِّدِنَا إِبْرَاهِيْمَ وَعَلٰى آلِ سَيِّدِنَا إِبْرَاهِيْمَ، وَبَارِكْ عَلٰى سَيِّدِنَا مُحَمَّدٍ وَعَلٰى آلِ سَيِّدِنَا مُحَمَّدٍ كَمَا بَارَكْتَ عَلٰى سَيِّدِنَا إِبْرَاهِيْمَ وَعَلٰى آلِ سَيِّدِنَا إِبْرَاهِيْمَ فِي الْعٰلَمِيْنَ إِنَّكَ حَمِيْدٌ مَجِيْدٌ",
    latin:
      "Allāhumma ṣalli 'alā sayyidinā Muḥammad wa 'alā āli sayyidinā Muḥammad kamā ṣallaita 'alā sayyidinā Ibrāhīm wa 'alā āli sayyidinā Ibrāhīm, wa bārik 'alā sayyidinā Muḥammad wa 'alā āli sayyidinā Muḥammad kamā bārakta 'alā sayyidinā Ibrāhīm wa 'alā āli sayyidinā Ibrāhīm fil-'ālamīna innaka ḥamīdum-majīd.",
    translation:
      "Ya Allah, limpahkanlah rahmat kepada junjungan kami Nabi Muhammad dan keluarganya sebagaimana Engkau limpahkan rahmat kepada Nabi Ibrahim dan keluarganya. Dan berkahilah Nabi Muhammad dan keluarganya sebagaimana Engkau berkahi Nabi Ibrahim dan keluarganya di seluruh alam. Sungguh Engkau Maha Terpuji lagi Maha Mulia.",
    note: "Sebelum salam, sangat dianjurkan membaca doa perlindungan dari siksa kubur, neraka, fitnah hidup dan mati, serta fitnah Dajjal.",
  },
  {
    id: "shalat-10",
    number: "11",
    title: "Salam ke Kanan & ke Kiri",
    badge: "Rukun 12–13",
    summary:
      "Menoleh ke bahu kanan hingga pipi kanan tampak dari belakang sambil mengucapkan salam pertama (wajib), kemudian menoleh ke bahu kiri sambil mengucapkan salam kedua (sunnah).",
    arabic: "اَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللّٰهِ",
    latin: "As-salāmu 'alaikum wa raḥmatullāh.",
    translation: "Semoga keselamatan dan rahmat Allah tercurah atas kalian.",
  },
];
