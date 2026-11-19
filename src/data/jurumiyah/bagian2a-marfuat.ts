// src/data/jurumiyah/bagian2a-marfuat.ts

import type { JurumiyahBab } from '../../types/jurumiyah.types';

export const jurumiyahBagian2A: JurumiyahBab[] = [
  {
    id: 6,
    slug: 'marfuatul-asma',
    judulArab: 'بَابُ مَرْفُوعَاتِ الْأَسْمَاءِ',
    judulLatin: 'Babu Marfu’atil Asma’',
    judulIndo: 'Bab Isim-Isim yang Dibaca Rafa’',
    ringkasan: 'Daftar tujuh kelompok kata benda (isim) yang kedudukannya wajib dibaca rafa’.',
    isi: [
      {
        id: 1,
        arab: 'اَلْمَرْفُوعَاتُ سَبْعَةٌ وَهِيَ: الْفَاعِلُ، وَالْمَفْعُولُ الَّذِي لَمْ يُسَمَّ فَاعِلُهُ، وَالْمُبْتَدَأُ وَخَبَرُهُ، وَاسْمُ كَانَ وَأَخَوَاتِهَا، وَخَبَرُ إِنَّ وَأَخَوَاتِهَا، وَالتَّابِعُ لِلْمَرْفُوعِ وَهُوَ أَرْبَعَةُ أَشْيَاءَ: النَّعْتُ، وَالْعَطْفُ، وَالتَّوْكِيدُ، وَالْبَدَلُ.',
        terjemahan: 'Isim-isim yang dibaca rafa’ ada tujuh macam, yaitu: fa’il (subjek), maf’ul yang tidak disebutkan fa’il-nya (naibul fa’il), mubtada’ dan khabarnya, isim kana dan saudara-saudaranya, khabar inna dan saudara-saudaranya, serta tabi’ (pengikut) bagi lafaz yang rafa’ yang terdiri dari empat hal: na’at, ‘athaf, taukid, dan badal.'
      }
    ]
  },
  {
    id: 7,
    slug: 'al-fail',
    judulArab: 'بَابُ الْفَاعِلِ',
    judulLatin: 'Babul Fa’il',
    judulIndo: 'Bab Fa’il (Pelaku / Subjek)',
    ringkasan: 'Definisi fa’il serta pembagiannya menjadi isim zhahir (tampak) dan isim dhamir (kata ganti).',
    isi: [
      {
        id: 1,
        arab: 'اَلْفَاعِلُ هُوَ الِاسْمُ الْمَرْفُوعُ الْمَذْكُورُ قَبْلَهُ فِعْلُهُ.',
        terjemahan: 'Fa’il adalah isim yang dibaca rafa’ yang disebutkan fi’il-nya (kata kerjanya) sebelum isim tersebut.'
      },
      {
        id: 2,
        arab: 'وَهُوَ عَلَى قِسْمَيْنِ: ظَاهِرٌ، وَمُضْمَرٌ.',
        terjemahan: 'Fa’il terbagi menjadi dua bagian: zhahir (kata benda tampak) dan mudhmar (kata ganti / dhamir).'
      },
      {
        id: 3,
        arab: 'فَالظَّاهِرُ نَحْوَ قَوْلِكَ: قَامَ زَيْدٌ، وَيَقُومُ زَيْدٌ، وَقَامَ الزَّيْدَانِ، وَيَقُومُ الزَّيْدَانِ، وَقَامَ الزَّيْدُونَ، وَيَقُومُ الزَّيْدُونَ، وَقَامَ الرِّجَالُ، وَيَقُومُ الرِّجَالُ، وَقَامَتْ هِنْدٌ، وَتَقُومُ هِنْدٌ، وَقَامَتِ الْهِنْدَانِ، وَتَقُومُ الْهِنْدَانِ، وَقَامَتِ الْهِنْدَاتُ، وَتَقُومُ الْهِنْدَاتُ، وَقَامَتِ الْهُنُودُ، وَتَقُومُ الْهُنُودُ، وَقَامَ أَخُوكَ، وَيَقُومُ أَخُوكَ، وَقَامَ غُلَامِي، وَيَقُومُ غُلَامِي، وَمَا أَشْبَهَ ذَلِكَ.',
        terjemahan: 'Fa’il zhahir contohnya ucapanmu: Qama Zaidun (Zaid telah berdiri), Yaqumu Zaidun, Qamaz-Zaidani, Yaqumuz-Zaidani, Qamaz-Zaiduna, Yaqumuz-Zaiduna, Qamar-Rijalu, Yaqumur-Rijalu, Qamat Hindun, Taqumu Hindun, Qamatil-Hindani, Taqumul-Hindani, Qamatil-Hindatu, Taqumul-Hindatu, Qamatil-Hunudu, Taqumul-Hunudu, Qama Akhuka, Yaqumu Akhuka, Qama Ghulami, Yaqumu Ghulami, dan contoh lain yang serupa.'
      },
      {
        id: 4,
        arab: 'وَالْمُضْمَرُ اثْنَا عَشَرَ نَحْوَ قَوْلِكَ: ضَرَبْتُ، وَضَرَبْنَا، وَضَرَبْتَ، وَضَرَبْتِ، وَضَرَبْتُمَا، وَضَرَبْتُمْ، وَضَرَبْتُنَّ، وَضَرَبَ، وَضَرَبَتْ، وَضَرَبَا، وَضَرَبُوا، وَضَرَبْنَ.',
        terjemahan: 'Fa’il mudhmar (dhamir) ada dua belas, contohnya ucapanmu: Dharabtu (aku telah memukul), Dharabna (kami), Dharabta (kamu lk), Dharabti (kamu pr), Dharabtuma (kalian berdua), Dharabtum (kalian lk), Dharabtunna (kalian pr), Dharaba (dia lk), Dharabat (dia pr), Dharaba (mereka berdua), Dharabu (mereka lk), dan Dharabna (mereka pr).'
      }
    ]
  },
  {
    id: 8,
    slug: 'naibul-fail',
    judulArab: 'بَابُ الْمَفْعُولِ الَّذِي لَمْ يُسَمَّ فَاعِلُهُ',
    judulLatin: 'Babul Maf’ul Alladzi Lam Yusamma Fa’iluhu',
    judulIndo: 'Bab Naibul Fa’il (Pengganti Pelaku / Kalimat Pasif)',
    ringkasan: 'Aturan mengubah fi’il aktif menjadi pasif (majhul) dan memosisikan objek sebagai pengganti subjek.',
    isi: [
      {
        id: 1,
        arab: 'وَهُوَ الِاسْمُ الْمَرْفُوعُ الَّذِي لَمْ يُذْكَرْ مَعَهُ فَاعِلُهُ.',
        terjemahan: 'Naibul fa’il adalah isim yang dibaca rafa’ yang tidak disebutkan bersamanya pelaku (fa’il) perbuatannya.'
      },
      {
        id: 2,
        arab: 'فَإِنْ كَانَ الْفِعْلُ مَاضِيًا ضُمَّ أَوَّلُهُ وَكُسِرَ مَا قَبْلَ آخِرِهِ، وَإِنْ كَانَ مُضَارِعًا ضُمَّ أَوَّلُهُ وَفُتِحَ مَا قَبْلَ آخِرِهِ.',
        terjemahan: 'Apabila fi’il-nya berupa fi’il madhi, maka huruf pertamanya didhammahkan dan huruf sebelum akhirnya dikasrahkan. Apabila berupa fi’il mudhari’, maka huruf pertamanya didhammahkan dan huruf sebelum akhirnya difathahkan.'
      },
      {
        id: 3,
        arab: 'وَهُوَ عَلَى قِسْمَيْنِ: ظَاهِرٌ، وَمُضْمَرٌ.',
        terjemahan: 'Naibul fa’il terbagi menjadi dua bagian: zhahir dan mudhmar.'
      },
      {
        id: 4,
        arab: 'فَالظَّاهِرُ نَحْوَ قَوْلِكَ: ضُرِبَ زَيْدٌ، وَيُضْرَبُ زَيْدٌ، وَأُكْرِمَ عَمْرٌو، وَيُكْرَمُ عَمْرٌو.',
        terjemahan: 'Naibul fa’il zhahir contohnya ucapanmu: Dhuriba Zaidun (Zaid telah dipukul), Yudhribu Zaidun (Zaid sedang/akan dipukul), Ukrima ‘Amrun (‘Amr telah dimuliakan), dan Yukramu ‘Amrun (‘Amr sedang/akan dimuliakan).'
      },
      {
        id: 5,
        arab: 'وَالْمُضْمَرُ اثْنَا عَشَرَ نَحْوَ قَوْلِكَ: ضُرِبْتُ، وَضُرِبْنَا، وَضُرِبْتَ، وَضُرِبْتِ، وَضُرِبْتُمَا، وَضُرِبْتُمْ، وَضُرِبْتُنَّ، وَضُرِبَ، وَضُرِبَتْ، وَضُرِبَا، وَضُرِبُوا، وَضُرِبْنَ.',
        terjemahan: 'Naibul fa’il mudhmar ada dua belas, contohnya ucapanmu: Dhuribtu (aku dipukul), Dhuribna, Dhuribta, Dhuribti, Dhuribtuma, Dhuribtum, Dhuribtunna, Dhuriba, Dhuribat, Dhuriba, Dhuribu, dan Dhuribna.'
      }
    ]
  },
  {
    id: 9,
    slug: 'mubtada-khabar',
    judulArab: 'بَابُ الْمُبْتَدَأِ وَالْخَبَرِ',
    judulLatin: 'Babul Mubtada’ wal Khabar',
    judulIndo: 'Bab Mubtada’ dan Khabar (Subjek dan Predikat Nominal)',
    ringkasan: 'Definisi mubtada’ dan khabar beserta pembagian jenis-jenis keduanya.',
    isi: [
      {
        id: 1,
        arab: 'اَلْمُبْتَدَأُ هُوَ الِاسْمُ الْمَرْفُوعُ الْعَارِي عَنِ الْعَوَامِلِ اللَّفْظِيَّةِ.',
        terjemahan: 'Mubtada’ adalah isim yang dibaca rafa’ yang sunyi (terbebas) dari amil-amil lafzhi.'
      },
      {
        id: 2,
        arab: 'وَالْخَبَرُ هُوَ الِاسْمُ الْمَرْفُوعُ الْمُسْنَدُ إِلَيْهِ، نَحْوَ قَوْلِكَ: زَيْدٌ قَائِمٌ، وَالزَّيْدَانِ قَائِمَانِ، وَالزَّيْدُونَ قَائِمُونَ.',
        terjemahan: 'Khabar adalah isim yang dibaca rafa’ yang disandarkan kepada mubtada’, contohnya ucapanmu: Zaidun qa’imun (Zaid itu berdiri), Az-Zaidani qa’imani, dan Az-Zaiduna qa’imuna.'
      },
      {
        id: 3,
        arab: 'وَالْمُبْتَدَأُ قِسْمَانِ: ظَاهِرٌ، وَمُضْمَرٌ.',
        terjemahan: 'Mubtada’ terbagi menjadi dua bagian: zhahir dan mudhmar.'
      },
      {
        id: 4,
        arab: 'فَالظَّاهِرُ مَا تَقَدَّمَ ذِكْرُهُ.',
        terjemahan: 'Mubtada’ zhahir adalah seperti contoh-contoh yang telah disebutkan sebelumnya (seperti Zaidun, Az-Zaidani, Az-Zaiduna).'
      },
      {
        id: 5,
        arab: 'وَالْمُضْمَرُ اثْنَا عَشَرَ وَهِيَ: أَنَا، وَنَحْنُ، وَأَنْتَ، وَأَنْتِ، وَأَنْتُمَا، وَأَنْتُمْ، وَأَنْتُنَّ، وَهُوَ، وَهِيَ، وَهُمَا، وَهُمْ، وَهُنَّ، نَحْوَ قَوْلِكَ: أَنَا قَائِمٌ، وَنَحْنُ قَائِمُونَ، وَمَا أَشْبَهَ ذَلِكَ.',
        terjemahan: 'Mubtada’ mudhmar ada dua belas, yaitu: ana, nahnu, anta, anti, antuma, antum, antunna, huwa, hiya, huma, hum, dan hunna. Contohnya ucapanmu: Ana qa’imun (saya berdiri), Nahnu qa’imuna (kami berdiri), dan contoh lain yang serupa.'
      },
      {
        id: 6,
        arab: 'وَالْخَبَرُ قِسْمَانِ: مُفْرَدٌ، وَغَيْرُ مُفْرَدٍ.',
        terjemahan: 'Khabar terbagi menjadi dua bagian: mufrad (tunggal/bukan kalimat) dan ghairu mufrad (bukan mufrad).'
      },
      {
        id: 7,
        arab: 'فَالْمُفْرَدُ نَحْوَ: زَيْدٌ قَائِمٌ. وَغَيْرُ الْمُفْرَدِ أَرْبَعَةُ أَشْيَاءَ: الْجَارُّ وَالْمَجْرُورُ، وَالظَّرْفُ، وَالْفِعْلُ مَعَ فَاعِلِهِ، وَالْمُبْتَدَأُ مَعَ خَبَرِهِ، نَحْوَ قَوْلِكَ: زَيْدٌ فِي الدَّارِ، وَزَيْدٌ عِنْدَكَ، وَزَيْدٌ قَامَ أَبُوهُ، وَزَيْدٌ جَارِيَتُهُ ذَاهِبَةٌ.',
        terjemahan: 'Khabar mufrad contohnya: Zaidun qa’imun. Sedangkan khabar ghairu mufrad ada empat macam: jar dan majrur, zharaf, fi’il beserta fa’il-nya, serta mubtada’ beserta khabarnya. Contohnya ucapanmu: Zaidun fid-dari (Zaid di dalam rumah), Zaidun ‘indaka (Zaid di sisimu), Zaidun qama abuhu (Zaid itu ayahnya telah berdiri), dan Zaidun jariyatuhu dzahibah (Zaid itu budak perempuannya pergi).'
      }
    ]
  }
];
