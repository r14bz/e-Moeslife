import type { NadhomBab, NadhomBait } from "../types/nadhom";

export const baiquniyyahBabs: NadhomBab[] = [
  {
    "id": "muqaddimah",
    "urutan": 1,
    "judulArab": "مُقَدِّمَةُ النَّظْمِ",
    "judulIndo": "Muqaddimah Nadhom",
    "rentangBait": [
      1,
      2
    ]
  },
  {
    "id": "shahih-hasan-dhaif",
    "urutan": 2,
    "judulArab": "الصَّحِيْحُ وَالْحَسَنُ وَالضَّعِيْفُ",
    "judulIndo": "Hadis Shahih, Hasan, dan Dha'if",
    "rentangBait": [
      3,
      6
    ]
  },
  {
    "id": "marfu-muttashil",
    "urutan": 3,
    "judulArab": "المَرْفُوْعُ وَالمَقْطُوْعُ وَالمُسْنَدُ وَالمُتَّصِلُ",
    "judulIndo": "Marfu', Maqthu', Musnad & Muttashil",
    "rentangBait": [
      7,
      10
    ]
  },
  {
    "id": "musalsal-masyhur",
    "urutan": 4,
    "judulArab": "المُسَلْسَلُ وَالعَزِيْزُ وَالمَشْهُوْرُ وَالمُعَنْعَنُ",
    "judulIndo": "Musalsal, 'Aziz, Masyhur & Mu'an'an",
    "rentangBait": [
      11,
      14
    ]
  },
  {
    "id": "mauquf-munqathi",
    "urutan": 5,
    "judulArab": "المَوْقُوْفُ وَالمُرْسَلُ وَالغَرِيْبُ وَالمُنْقَطِعُ",
    "judulIndo": "Mauquf, Mursal, Gharib & Munqathi'",
    "rentangBait": [
      15,
      19
    ]
  },
  {
    "id": "mudallas-fard",
    "urutan": 6,
    "judulArab": "المُدَلَّسُ وَالشَّاذُّ وَالمَقْلُوْبُ وَالفَرْدُ",
    "judulIndo": "Mudallas, Syadz, Maqlub & Fard",
    "rentangBait": [
      20,
      24
    ]
  },
  {
    "id": "mudhtharib-mudabbaj",
    "urutan": 7,
    "judulArab": "المُضْطَرِبُ وَالمُدْرَجُ وَالمُدَبَّجُ",
    "judulIndo": "Mudhtharib, Mudraj, Mudabbaj & Lafaz Perawi",
    "rentangBait": [
      25,
      29
    ]
  },
  {
    "id": "munkar-khatimah",
    "urutan": 8,
    "judulArab": "المُنْكَرُ وَالمَتْرُوْكُ وَالمَوْضُوْعُ وَالخَاتِمَةُ",
    "judulIndo": "Munkar, Matruk, Maudhu' & Penutup",
    "rentangBait": [
      30,
      34
    ]
  }
];

export const baiquniyyahBaits: NadhomBait[] = [
  {
    "id": 1,
    "babId": "muqaddimah",
    "shadr": "أَبْدَأُ بِالْحَمْدِ مُصَلِّيًا عَلَى",
    "ajuz": "مُحَمَّدٍ خَيْرِ نَبِيٍّ أُرْسِلَا",
    "terjemah": "Aku memulai dengan memuji Allah seraya bershalawat kepada Nabi Muhammad, sebaik-baik nabi yang telah diutus."
  },
  {
    "id": 2,
    "babId": "muqaddimah",
    "shadr": "وَذِيْ مِنَ أَقْسَامِ الْحَدِيْثِ عِدَّةْ",
    "ajuz": "وَكُلُّ وَاحِدٍ أَتَى وَحَدَّهْ",
    "terjemah": "Inilah beberapa pembagian istilah hadis yang berjumlah cukup banyak, dan masing-masing bagian disebutkan beserta definisinya.",
    "catatan": "Kitab Al-Mandhumah Al-Baiquniyyah disusun oleh Imam Umar bin Muhammad Al-Baiquni (wafat sekitar 1080 H). Nadhom berjumlah 34 bait ini menjadi rujukan dasar Ilmu Musthalah Hadis di pesantren."
  },
  {
    "id": 3,
    "babId": "shahih-hasan-dhaif",
    "shadr": "أَوَّلُهَا الصَّحِيْحُ وَهْوَ مَا اتَّصَلْ",
    "ajuz": "إِسْنَادُهُ وَلَمْ يُشَذَّ أَوْ يُعَلْ",
    "terjemah": "Pembagian pertama adalah Hadis Shahih, yaitu hadis yang bersambung sanadnya serta tidak syadz (janggal) dan tidak ber-'illat (cacat tersembunyi)."
  },
  {
    "id": 4,
    "babId": "shahih-hasan-dhaif",
    "shadr": "يَرْوِيْهِ عَدْلٌ ضَابِطٌ عَنْ مِثْلِهِ",
    "ajuz": "مُعْتَمَدٌ فِيْ ضَبْطِهِ وَنَقْلِهِ",
    "terjemah": "Diriwayatkan oleh perawi yang adil dan dhabit (kuat hafalan/catatannya) dari perawi yang semisal dengannya, serta diakui keakuratan hafalan dan penukilannya.",
    "catatan": "5 syarat Hadis Shahih: sanad bersambung, perawi adil, perawi dhabit, tidak syadz, dan tidak ber-'illat."
  },
  {
    "id": 5,
    "babId": "shahih-hasan-dhaif",
    "shadr": "وَالْحَسَنُ الْمَعْرُوْفُ طُرْقًا وَغَدَتْ",
    "ajuz": "رِجَالُهُ لَا كَالصَّحِيْحِ اشْتَهَرَتْ",
    "terjemah": "Sedangkan Hadis Hasan adalah hadis yang diketahui jalur periwayatannya, namun para perawinya tidak semasyhur kekuatan hafalan perawi Hadis Shahih (sedikit lebih ringan dhabit-nya)."
  },
  {
    "id": 6,
    "babId": "shahih-hasan-dhaif",
    "shadr": "وَكُلُّ مَا عَنْ رُتْبَةِ الْحُسْنِ قَصَرْ",
    "ajuz": "فَهْوَ الضَّعِيْفُ وَهْوَ أَقْسَامًا كَثُرْ",
    "terjemah": "Adapun setiap hadis yang kurang dari derajat Hadis Hasan, maka itulah Hadis Dha'if (lemah), dan pembagiannya sangat banyak."
  },
  {
    "id": 7,
    "babId": "marfu-muttashil",
    "shadr": "وَمَا أُضِيْفَ لِلنَّبِيِّ الْمَرْفُوْعُ",
    "ajuz": "وَمَا لِتَابِعٍ هُوَ الْمَقْطُوْعُ",
    "terjemah": "Hadis yang disandarkan kepada Nabi Muhammad ﷺ disebut Marfu', sedangkan perkataan atau perbuatan yang disandarkan kepada tabi'in disebut Maqthu'."
  },
  {
    "id": 8,
    "babId": "marfu-muttashil",
    "shadr": "وَالْمُسْنَدُ الْمُتَّصِلُ الْإِسْنَادِ مِنْ",
    "ajuz": "رَاوِيْهِ حَتَّى الْمُصْطَفَى وَلَمْ يَبِنْ",
    "terjemah": "Hadis Musnad adalah hadis yang bersambung sanadnya dari perawi terakhir hingga sampai kepada Nabi Al-Mushthafa ﷺ tanpa terputus."
  },
  {
    "id": 9,
    "babId": "marfu-muttashil",
    "shadr": "وَمَا بِسَمْعِ كُلِّ رَاوٍ يَتَّصِلْ",
    "ajuz": "إِسْنَادُهُ لِلْمُصْطَفَى فَالْمُتَّصِلْ",
    "terjemah": "Setiap hadis yang sanadnya bersambung melalui pendengaran langsung setiap perawi hingga kepada Al-Mushthafa ﷺ (atau hingga sahabat), maka disebut Muttashil."
  },
  {
    "id": 10,
    "babId": "marfu-muttashil",
    "shadr": "مُسَلْسَلٌ قُلْ مَا عَلَى وَصْفٍ أَتَى",
    "ajuz": "مِثْلُ أَمَا وَاللّٰهِ أَنْبَانِي الْفَتَى",
    "terjemah": "Katakanlah bahwa hadis Musalsal adalah hadis yang diriwayatkan secara berantai di atas sifat atau keadaan tertentu, seperti ucapan perawi: 'Demi Allah, seorang pemuda telah memberitahukan kepadaku...' secara turun-temurun."
  },
  {
    "id": 11,
    "babId": "musalsal-masyhur",
    "shadr": "كَذَاكَ قَدْ حَدَّثَنِيْهِ قَائِمًا",
    "ajuz": "أَوْ بَعْدَ أَنْ حَدَّثَنِيْ تَبَسَّمَا",
    "terjemah": "Demikian pula (musalsal dalam perbuatan), seperti perawi berkata: 'Ia meriwayatkan hadis ini kepadaku sambil berdiri,' atau 'Setelah menyampaikan hadis kepadaku, ia tersenyum.'"
  },
  {
    "id": 12,
    "babId": "musalsal-masyhur",
    "shadr": "عَزِيْزُ مَرْوِيِّ اثْنَيْنِ أَوْ ثَلَاثَهْ",
    "ajuz": "مَشْهُوْرُ مَرْوِيِّ فَوْقَ مَا ثَلَاثَهْ",
    "terjemah": "Hadis 'Aziz adalah hadis yang diriwayatkan oleh dua atau tiga orang perawi (pada tiap tingkatan sanad). Sedangkan Hadis Masyhur adalah hadis yang diriwayatkan lebih dari tiga orang."
  },
  {
    "id": 13,
    "babId": "musalsal-masyhur",
    "shadr": "مُعَنْعَنٌ كَعَنْ سَعِيْدٍ عَنْ كَرَمْ",
    "ajuz": "وَمُبْهَمٌ مَا فِيْهِ رَاوٍ لَمْ يُسَمْ",
    "terjemah": "Hadis Mu'an'an adalah hadis yang memakai redaksi 'an (dari), seperti 'dari Sa'id, dari Karam'. Sedangkan Hadis Mubham adalah hadis yang di dalam sanadnya terdapat perawi yang tidak disebutkan namanya."
  },
  {
    "id": 14,
    "babId": "musalsal-masyhur",
    "shadr": "وَكُلُّ مَا قَلَّتْ رِجَالُهُ عَلَا",
    "ajuz": "وَضِدُّهُ ذَاكَ الَّذِيْ قَدْ نَزَلَا",
    "terjemah": "Setiap hadis yang sedikit jumlah perawi dalam sanadnya disebut sanad 'Ali (tinggi), dan kebalikannya (banyak jumlah perawinya) disebut sanad Nazil (rendah)."
  },
  {
    "id": 15,
    "babId": "mauquf-munqathi",
    "shadr": "وَمَا أَضَفْتَهُ إِلَى الْأَصْحَابِ مِنْ",
    "ajuz": "قَوْلٍ وَفِعْلٍ فَهْوَ مَوْقُوْفٌ زُكِنْ",
    "terjemah": "Hadis yang engkau sandarkan kepada para sahabat, baik berupa perkataan maupun perbuatan, dikenal dengan istilah Hadis Mauquf."
  },
  {
    "id": 16,
    "babId": "mauquf-munqathi",
    "shadr": "وَمُرْسَلٌ مِنْهُ الصَّحَابِيُّ سَقَطْ",
    "ajuz": "وَقُلْ غَرِيْبٌ مَا رَوَى رَاوٍ فَقَطْ",
    "terjemah": "Hadis Mursal adalah hadis yang gugur penyebutan sahabatnya (tabi'in langsung menyandarkan kepada Nabi ﷺ). Dan sebutlah Gharib untuk hadis yang hanya diriwayatkan oleh seorang perawi saja."
  },
  {
    "id": 17,
    "babId": "mauquf-munqathi",
    "shadr": "وَكُلُّ مَا لَمْ يَتَّصِلْ بِحَالِ",
    "ajuz": "إِسْنَادُهُ مُنْقَطِعُ الْأَوْصَالِ",
    "terjemah": "Setiap hadis yang sanadnya tidak bersambung dengan keadaan apa pun, disebut Munqathi' (terputus sambungannya)."
  },
  {
    "id": 18,
    "babId": "mauquf-munqathi",
    "shadr": "وَالْمُعْضَلُ السَّاقِطُ مِنْهُ اثْنَانِ",
    "ajuz": "وَمَا أَتَى مُدَلَّسًا نَوْعَانِ",
    "terjemah": "Hadis Mu'dhal adalah hadis yang gugur darinya dua orang perawi secara berturut-turut; adapun hadis yang datang secara mudallas (disamarkan) terbagi dua macam."
  },
  {
    "id": 19,
    "babId": "mauquf-munqathi",
    "shadr": "الْأَوَّلُ الْإِسْقَاطُ لِلشَّيْخِ وَأَنْ",
    "ajuz": "يَنْقُلَ عَمَّنْ فَوْقَهُ بِعَنْ وَأَنْ",
    "terjemah": "Yang pertama (tadlis isnad) adalah menggugurkan nama gurunya lalu meriwayatkan dari guru di atas gurunya dengan lafaz 'an atau anna.",
    "catatan": "Tadlis Isnad terjadi saat perawi memakai shighat yang mengesankan mendengar langsung dari guru di atasnya padahal ia melewatkan gurunya."
  },
  {
    "id": 20,
    "babId": "mudallas-fard",
    "shadr": "وَالثَّانِ لَا يُسْقِطُهُ لَكِنْ يَصِفْ",
    "ajuz": "أَوْصَافَهُ بِمَا بِهِ لَا يَنْعَرِفْ",
    "terjemah": "Macam kedua (tadlis syuyukh) yaitu ia tidak menggugurkan nama gurunya, tetapi menyebut sifat-sifat gurunya dengan sebutan yang membuat guru itu tidak dikenal."
  },
  {
    "id": 21,
    "babId": "mudallas-fard",
    "shadr": "وَمَا يُخَالِفْ ثِقَةٌ فِيْهِ الْمَلَا",
    "ajuz": "فَالشَّاذُّ وَالْمَقْلُوْبُ قِسْمَانِ تَلَا",
    "terjemah": "Hadis yang perawi tsiqahnya menyelisihi riwayat jamaah perawi lain yang lebih kuat disebut Syadz; setelahnya ada Hadis Maqlub yang terbagi dua macam."
  },
  {
    "id": 22,
    "babId": "mudallas-fard",
    "shadr": "إِبْدَالُ رَاوٍ مَا بِرَاوٍ قِسْمُ",
    "ajuz": "وَقَلْبُ إِسْنَادٍ لِمَتْنٍ قِسْمُ",
    "terjemah": "Yaitu menukar nama satu perawi dengan perawi lain (dalam sanad), atau membalik sanad untuk suatu matan."
  },
  {
    "id": 23,
    "babId": "mudallas-fard",
    "shadr": "وَالْفَرْدُ مَا قَيَّدْتَهُ بِثِقَةِ",
    "ajuz": "أَوْ جَمْعٍ أَوْ قَصْرٍ عَلَى رِوَايَةِ",
    "terjemah": "Hadis Fard adalah hadis yang engkau batasi keunikannya pada satu perawi tsiqah, atau pada penduduk negeri tertentu, atau terbatas pada satu jalur riwayat saja."
  },
  {
    "id": 24,
    "babId": "mudallas-fard",
    "shadr": "وَمَا بِعِلَّةٍ غُمُوْضٍ أَوْ خَفَا",
    "ajuz": "مُعَلَّلٌ عِنْدَهُمُ قَدْ عُرِفَا",
    "terjemah": "Hadis yang mengandung cacat tersembunyi atau samar di kalangan ahli hadis dikenal sebagai Hadis Mu'allal."
  },
  {
    "id": 25,
    "babId": "mudhtharib-mudabbaj",
    "shadr": "وَذُو اخْتِلَافِ سَنَدٍ أَوْ مَتْنِ",
    "ajuz": "مُضْطَرِبٌ عِنْدَ أُهَيْلِ الْفَنِّ",
    "terjemah": "Hadis yang memiliki perselisihan pada sanad atau matannya (yang sama kuat dan tidak bisa dikompromikan) disebut Mudhtharib menurut para ahli hadis."
  },
  {
    "id": 26,
    "babId": "mudhtharib-mudabbaj",
    "shadr": "وَالْمُدْرَجَاتُ فِي الْحَدِيْثِ مَا أَتَتْ",
    "ajuz": "مِنْ بَعْضِ أَلْفَاظِ الرُّوَاةِ اتَّصَلَتْ",
    "terjemah": "Mudrajat dalam hadis adalah sisipan sebagian ucapan perawi yang bersambung ke dalam teks matan hadis sehingga disangka bagian hadis."
  },
  {
    "id": 27,
    "babId": "mudhtharib-mudabbaj",
    "shadr": "وَمَا رَوَى كُلُّ قَرِيْنٍ عَنْ أَخِهْ",
    "ajuz": "مُدَبَّجٌ فَاعْرِفْهُ حَقًّا وَانْتَخِهْ",
    "terjemah": "Riwayat antara dua perawi yang sebaya saling meriwayatkan satu sama lain disebut Mudabbaj; ketahuilah istilah ini dengan baik dan banggalah mempelajarinya."
  },
  {
    "id": 28,
    "babId": "mudhtharib-mudabbaj",
    "shadr": "مُتَّفِقٌ لَفْظًا وَخَطًّا مُتَّفِقْ",
    "ajuz": "وَضِدُّهُ فِيْمَا ذَكَرْنَا الْمُفْتَرِقْ",
    "terjemah": "Muttafiq adalah nama perawi yang sama lafaz dan tulisannya (namun orangnya berbeda), kebalikannya disebut Muftariq (berbeda lafaz dan tulisannya)."
  },
  {
    "id": 29,
    "babId": "mudhtharib-mudabbaj",
    "shadr": "مُؤْتَلِفٌ مُتَّفِقُ الْخَطِّ فَقَطْ",
    "ajuz": "وَضِدُّهُ مُخْتَلِفٌ فَاخْشَ الْغَلَطْ",
    "terjemah": "Mu'talif adalah yang sama tulisannya saja namun berbeda cara bacanya, sedangkan kebalikannya disebut Mukhtalif, maka berhati-hatilah dari kesalahan."
  },
  {
    "id": 30,
    "babId": "munkar-khatimah",
    "shadr": "وَالْمُنْكَرُ الْفَرْدُ بِهِ رَاوٍ غَدَا",
    "ajuz": "تَعْدِيْلُهُ لَا يَحْمِلُ التَّفَرُّدَا",
    "terjemah": "Hadis Munkar adalah hadis yang diriwayatkan sendirian oleh seorang perawi yang derajat keadilannya tidak cukup kuat untuk menanggung kesendirian riwayatnya (atau menyelisihi perawi tsiqah)."
  },
  {
    "id": 31,
    "babId": "munkar-khatimah",
    "shadr": "مَتْرُوْكُهُ مَا وَاحِدٌ بِهِ انْفَرَدْ",
    "ajuz": "وَأَجْمَعُوْا لِضَعْفِهِ فَهْوَ كَرَدْ",
    "terjemah": "Hadis Matruk adalah hadis yang diriwayatkan sendirian oleh perawi yang disepakati kelemahannya (atau tertuduh berdusta), sehingga riwayatnya tertolak."
  },
  {
    "id": 32,
    "babId": "munkar-khatimah",
    "shadr": "وَالْكَذِبُ الْمُخْتَلَقُ الْمَصْنُوْعُ",
    "ajuz": "عَلَى النَّبِيِّ فَذٰلِكَ الْمَوْضُوْعُ",
    "terjemah": "Adapun kedustaan yang dibuat-buat lalu disandarkan atas nama Nabi ﷺ, itulah Hadis Maudhu' (palsu)."
  },
  {
    "id": 33,
    "babId": "munkar-khatimah",
    "shadr": "وَقَدْ أَتَتْ كَالْجَوْهَرِ الْمَكْنُوْنِ",
    "ajuz": "سَمَّيْتُهَا مَنْظُوْمَةَ الْبَيْقُوْنِيْ",
    "terjemah": "Nadhom ini telah tersusun bagaikan permata yang tersimpan rapi; aku menamakannya Mandhumah Al-Baiquniyyah."
  },
  {
    "id": 34,
    "babId": "munkar-khatimah",
    "shadr": "فَوْقَ الثَّلَاثِيْنَ بِأَرْبَعٍ أَتَتْ",
    "ajuz": "أَقْسَامُهَا تَمَّتْ بِخَيْرٍ خُتِمَتْ",
    "terjemah": "Jumlah baitnya tiga puluh empat; segala pembagiannya telah selesai dan ditutup dengan kebaikan."
  }
];
