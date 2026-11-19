// src/data/jurumiyah/bagian1a-kalam-irab.ts

import type { JurumiyahBab } from '../../types/jurumiyah.types';

export const jurumiyahBagian1A: JurumiyahBab[] = [
  {
    id: 1,
    slug: 'al-kalam',
    judulArab: 'بَابُ الْكَلَامِ',
    judulLatin: 'Babul Kalam',
    judulIndo: 'Bab Kalam (Kalimat Sempurna dan Pembagian Kata)',
    ringkasan: 'Menjelaskan syarat kalam, tiga jenis kata dasar (isim, fi’il, huruf), serta tanda-tanda pengenalnya.',
    isi: [
      {
        id: 1,
        arab: 'اَلْكَلَامُ هُوَ اللَّفْظُ الْمُرَكَّبُ الْمُفِيدُ بِالْوَضْعِ.',
        terjemahan: 'Kalam adalah lafaz yang tersusun (minimal dua kata), memberikan pemahaman sempurna, dan disengaja menggunakan bahasa Arab.'
      },
      {
        id: 2,
        arab: 'وَأَقْسَامُهُ ثَلَاثَةٌ: اِسْمٌ، وَفِعْلٌ، وَحَرْفٌ جَاءَ لِمَعْنًى.',
        terjemahan: 'Bagian-bagian penyusun kalam ada tiga: isim (kata benda), fi’il (kata kerja), dan huruf yang memiliki makna.'
      },
      {
        id: 3,
        arab: 'فَالِاسْمُ يُعْرَفُ بِالْخَفْضِ، وَالتَّنْوِينِ، وَدُخُولِ الْأَلِفِ وَاللَّامِ، وَحُرُوفِ الْخَفْضِ وَهِيَ: مِنْ، وَإِلَى، وَعَنْ، وَعَلَى، وَفِي، وَرُبَّ، وَالْبَاءُ، وَالْكَافُ، وَاللَّامُ، وَحُرُوفِ الْقَسَمِ وَهِيَ: الْوَاوُ، وَالْبَاءُ، وَالتَّاءُ.',
        terjemahan: 'Isim dikenali dengan adanya khafadh (kasrah/jar), tanwin, masuknya alif dan lam (Al), serta masuknya huruf-huruf khafadh yaitu: min, ila, ‘an, ‘ala, fi, rubba, ba’, kaf, lam, dan huruf-huruf sumpah (qasam) yaitu: wawu, ba’, dan ta’.'
      },
      {
        id: 4,
        arab: 'وَالْفِعْلُ يُعْرَفُ بِقَدْ، وَالسِّينِ، وَسَوْفَ، وَتَاءِ التَّأْنِيثِ السَّاكِنَةِ.',
        terjemahan: 'Fi’il dikenali dengan masuknya huruf qad, sin, saufa, dan ta’ ta’nits yang sukun (tanda perempuan di akhir kata kerja).'
      },
      {
        id: 5,
        arab: 'وَالْحَرْفُ مَا لَا يَصْلُحُ مَعَهُ دَلِيلُ الِاسْمِ وَلَا دَلِيلُ الْفِعْلِ.',
        terjemahan: 'Huruf adalah kata yang tidak layak menerima tanda-tanda isim maupun tanda-tanda fi’il.'
      }
    ]
  },
  {
    id: 2,
    slug: 'al-irab',
    judulArab: 'بَابُ الْإِعْرَابِ',
    judulLatin: 'Babul I’rab',
    judulIndo: 'Bab I’rab (Perubahan Akhir Kata)',
    ringkasan: 'Definisi i’rab dan pembagian empat jenis perubahan akhir kata pada isim dan fi’il.',
    isi: [
      {
        id: 1,
        arab: 'اَلْإِعْرَابُ هُوَ تَغْيِيرُ أَوَاخِرِ الْكَلِمِ لِاخْتِلَافِ الْعَوَامِلِ الدَّاخِلَةِ عَلَيْهَا لَفْظًا أَوْ تَقْدِيرًا.',
        terjemahan: 'I’rab adalah perubahan keadaan akhir kata karena perbedaan amil (faktor yang memengaruhi) yang masuk kepadanya, baik perubahan secara tampak (lafzi) maupun diperkirakan (taqdiri).'
      },
      {
        id: 2,
        arab: 'وَأَقْسَامُهُ أَرْبَعَةٌ: رَفْعٌ، وَنَصْبٌ، وَخَفْضٌ، وَجَزْمٌ.',
        terjemahan: 'Pembagian i’rab ada empat: rafa’, nashab, khafadh (jar), dan jazm.'
      },
      {
        id: 3,
        arab: 'فَلِلْأَسْمَاءِ مِنْ ذَلِكَ الرَّفْعُ، وَالنَّصْبُ، وَالْخَفْضُ، وَلَا جَزْمَ فِيهَا.',
        terjemahan: 'Untuk golongan isim, bagian i’rabnya adalah rafa’, nashab, dan khafadh, serta tidak ada jazm padanya.'
      },
      {
        id: 4,
        arab: 'وَلِلْأَفْعَالِ مِنْ ذَلِكَ الرَّفْعُ، وَالنَّصْبُ، وَالْجَزْمُ، وَلَا خَفْضَ فِيهَا.',
        terjemahan: 'Untuk golongan fi’il, bagian i’rabnya adalah rafa’, nashab, dan jazm, serta tidak ada khafadh padanya.'
      }
    ]
  },
  {
    id: 3,
    slug: 'alamat-al-irab',
    judulArab: 'بَابُ مَعْرِفَةِ عَلَامَاتِ الْإِعْرَابِ',
    judulLatin: 'Babu Ma’rifati ‘Alamatil I’rab',
    judulIndo: 'Bab Mengenal Tanda-Tanda I’rab',
    ringkasan: 'Rincian tanda asli dan tanda cabang untuk rafa’, nashab, khafadh, dan jazm beserta tempat-tempatnya.',
    isi: [
      {
        id: 1,
        arab: 'لِلرَّفْعِ أَرْبَعُ عَلَامَاتٍ: الضَّمَّةُ، وَالْوَاوُ، وَالْأَلِفُ، وَالنُّونُ.',
        terjemahan: 'I’rab rafa’ memiliki empat tanda: dhammah, wawu, alif, dan nun.'
      },
      {
        id: 2,
        arab: 'فَأَمَّا الضَّمَّةُ فَتَكُونُ عَلَامَةً لِلرَّفْعِ فِي أَرْبَعَةِ مَوَاضِعَ: فِي الِاسْمِ الْمُفْرَدِ، وَجَمْعِ التَّكْسِيرِ، وَجَمْعِ الْمُؤَنَّثِ السَّالِمِ، وَالْفِعْلِ الْمُضَارِعِ الَّذِي لَمْ يَتَّصِلْ بِآخِرِهِ شَيْءٌ.',
        terjemahan: 'Dhammah menjadi tanda bagi rafa’ pada empat tempat: isim mufrad (tunggal), jamak taksir, jamak mu’annats salim, dan fi’il mudhari’ yang akhirnya tidak bersambung dengan sesuatu pun.'
      },
      {
        id: 3,
        arab: 'وَأَمَّا الْوَاوُ فَتَكُونُ عَلَامَةً لِلرَّفْعِ فِي مَوْضِعَيْنِ: فِي جَمْعِ الْمُذَكَّرِ السَّالِمِ، وَفِي الْأَسْمَاءِ الْخَمْسَةِ وَهِيَ: أَبُوكَ، وَأَخُوكَ، وَحَمُوكَ، وَفُوكَ، وَذُو مَالٍ.',
        terjemahan: 'Wawu menjadi tanda bagi rafa’ pada dua tempat: jamak mudzakkar salim dan asma’ul khamsah (isim yang lima), yaitu: abuka, akhuka, hamuka, fuka, dan dzu malin.'
      },
      {
        id: 4,
        arab: 'وَأَمَّا الْأَلِفُ فَتَكُونُ عَلَامَةً لِلرَّفْعِ فِي تَثْنِيَةِ الْأَسْمَاءِ خَاصَّةً.',
        terjemahan: 'Alif menjadi tanda bagi rafa’ khusus pada isim tatsniyah (kata benda bermakna ganda/dua).'
      },
      {
        id: 5,
        arab: 'وَأَمَّا النُّونُ فَتَكُونُ عَلَامَةً لِلرَّفْعِ فِي الْفِعْلِ الْمُضَارِعِ إِذَا اتَّصَلَ بِهِ ضَمِيرُ تَثْنِيَةٍ، أَوْ ضَمِيرُ جَمْعٍ، أَوْ ضَمِيرُ الْمُؤَنَّثَةِ الْمُخَاطَبَةِ.',
        terjemahan: 'Nun (tetapnya nun) menjadi tanda bagi rafa’ pada fi’il mudhari’ apabila bersambung dengan dhamir tatsniyah, dhamir jamak, atau dhamir mu’annatsah mukhathabah (af’alul khamsah).'
      },
      {
        id: 6,
        arab: 'وَلِلنَّصْبِ خَمْسُ عَلَامَاتٍ: الْفَتْحَةُ، وَالْأَلِفُ، وَالْكَسْرَةُ، وَالْيَاءُ، وَحَذْفُ النُّونِ.',
        terjemahan: 'I’rab nashab memiliki lima tanda: fathah, alif, kasrah, ya’, dan membuang nun.'
      },
      {
        id: 7,
        arab: 'فَأَمَّا الْفَتْحَةُ فَتَكُونُ عَلَامَةً لِلنَّصْبِ فِي ثَلَاثَةِ مَوَاضِعَ: فِي الِاسْمِ الْمُفْرَدِ، وَجَمْعِ التَّكْسِيرِ، وَالْفِعْلِ الْمُضَارِعِ إِذَا دَخَلَ عَلَيْهِ نَاصِبٌ وَلَمْ يَتَّصِلْ بِآخِرِهِ شَيْءٌ.',
        terjemahan: 'Fathah menjadi tanda bagi nashab pada tiga tempat: isim mufrad, jamak taksir, dan fi’il mudhari’ apabila kemasukan amil nashab serta akhirnya tidak bersambung dengan sesuatu pun.'
      },
      {
        id: 8,
        arab: 'وَأَمَّا الْأَلِفُ فَتَكُونُ عَلَامَةً لِلنَّصْبِ فِي الْأَسْمَاءِ الْخَمْسَةِ نَحْوَ: رَأَيْتُ أَبَاكَ وَأَخَاكَ وَمَا أَشْبَهَ ذَلِكَ.',
        terjemahan: 'Alif menjadi tanda bagi nashab pada asma’ul khamsah, contohnya: "Ra’aitu abaka wa akhaka" dan kata-kata yang menyerupainya.'
      },
      {
        id: 9,
        arab: 'وَأَمَّا الْكَسْرَةُ فَتَكُونُ عَلَامَةً لِلنَّصْبِ فِي جَمْعِ الْمُؤَنَّثِ السَّالِمِ.',
        terjemahan: 'Kasrah menjadi tanda bagi nashab pada jamak mu’annats salim.'
      },
      {
        id: 10,
        arab: 'وَأَمَّا الْيَاءُ فَتَكُونُ عَلَامَةً لِلنَّصْبِ فِي التَّثْنِيَةِ وَالْجَمْعِ.',
        terjemahan: 'Ya’ menjadi tanda bagi nashab pada isim tatsniyah dan jamak mudzakkar salim.'
      },
      {
        id: 11,
        arab: 'وَأَمَّا حَذْفُ النُّونِ فَيَكُونُ عَلَامَةً لِلنَّصْبِ فِي الْأَفْعَالِ الْخَمْسَةِ الَّتِي رَفْعُهَا بِثَبَاتِ النُّونِ.',
        terjemahan: 'Membuang nun menjadi tanda bagi nashab pada af’alul khamsah yang tanda rafa’-nya dengan menetapkan nun.'
      },
      {
        id: 12,
        arab: 'وَلِلْخَفْضِ ثَلَاثُ عَلَامَاتٍ: الْكَسْرَةُ، وَالْيَاءُ، وَالْفَتْحَةُ.',
        terjemahan: 'I’rab khafadh memiliki tiga tanda: kasrah, ya’, dan fathah.'
      },
      {
        id: 13,
        arab: 'فَأَمَّا الْكَسْرَةُ فَتَكُونُ عَلَامَةً لِلْخَفْضِ فِي ثَلَاثَةِ مَوَاضِعَ: فِي الِاسْمِ الْمُفْرَدِ الْمُنْصَرِفِ، وَجَمْعِ التَّكْسِيرِ الْمُنْصَرِفِ، وَفِي جَمْعِ الْمُؤَنَّثِ السَّالِمِ.',
        terjemahan: 'Kasrah menjadi tanda bagi khafadh pada tiga tempat: isim mufrad yang menerima tanwin (munsharif), jamak taksir yang munsharif, dan jamak mu’annats salim.'
      },
      {
        id: 14,
        arab: 'وَأَمَّا الْيَاءُ فَتَكُونُ عَلَامَةً لِلْخَفْضِ فِي ثَلَاثَةِ مَوَاضِعَ: فِي الْأَسْمَاءِ الْخَمْسَةِ، وَفِي التَّثْنِيَةِ، وَالْجَمْعِ.',
        terjemahan: 'Ya’ menjadi tanda bagi khafadh pada tiga tempat: asma’ul khamsah, isim tatsniyah, dan jamak mudzakkar salim.'
      },
      {
        id: 15,
        arab: 'وَأَمَّا الْفَتْحَةُ فَتَكُونُ عَلَامَةً لِلْخَفْضِ فِي الِاسْمِ الَّذِي لَا يَنْصَرِفُ.',
        terjemahan: 'Fathah menjadi tanda bagi khafadh pada isim ghairu munsharif (isim yang tidak menerima tanwin).'
      },
      {
        id: 16,
        arab: 'وَلِلْجَزْمِ عَلَامَتَانِ: السُّكُونُ، وَالْحَذْفُ.',
        terjemahan: 'I’rab jazm memiliki dua tanda: sukun dan membuang (hadzfu).'
      },
      {
        id: 17,
        arab: 'فَأَمَّا السُّكُونُ فَيَكُونُ عَلَامَةً لِلْجَزْمِ فِي الْفِعْلِ الْمُضَارِعِ الصَّحِيحِ الْآخِرِ.',
        terjemahan: 'Sukun menjadi tanda bagi jazm pada fi’il mudhari’ yang huruf akhirnya shahih (bukan huruf illat).'
      },
      {
        id: 18,
        arab: 'وَأَمَّا الْحَذْفُ فَيَكُونُ عَلَامَةً لِلْجَزْمِ فِي الْفِعْلِ الْمُضَارِعِ الْمُعْتَلِّ الْآخِرِ، وَفِي الْأَفْعَالِ الْخَمْسَةِ الَّتِي رَفْعُهَا بِثَبَاتِ النُّونِ.',
        terjemahan: 'Membuang menjadi tanda bagi jazm pada fi’il mudhari’ yang huruf akhirnya mu’tal (membuang huruf illat), serta pada af’alul khamsah yang tanda rafa’-nya dengan menetapkan nun.'
      }
    ]
  }
];
