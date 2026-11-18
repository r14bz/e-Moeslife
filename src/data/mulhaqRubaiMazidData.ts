import type { TashrifBabData } from '../types/tashrif';

// Halaman 32-33 Kitab Asli: Mulhaq bi Tadahraja (7 Wazan berurutan dalam 1 tabel)
export const MULHAQ_TADAHRAJA_DATA: TashrifBabData[] = [
  {
    id: 'mrb-mazid-tadahraja',
    kategori: 'Mulhaq Rubai Mazid',
    judulArab: 'مُلْحَقُ تَدَحْرَجَ (٧ أَوْزَانٍ)',
    judulIndo: 'Mulhaq Tadahraja (7 Wazan Sesuai Kitab Asli)',
    hasIsimAlat: false,
    rows: [
      // 1. Tafa'lala - Tajalbaba
      { isWazan: true, items: [['تَفَعْلَلَ','Telah berbuat'],['يَتَفَعْلَلُ','Sedang berbuat'],['تَفَعْلُلًا','Perbuatan'],['وَمُتَفَعْلَلًا','Dan perbuatan'],['فَهُوَ','Maka dia'],['مُتَفَعْلِلٌ','Yang berbuat'],['وَذَاكَ','Dan itu'],['مُتَفَعْلَلٌ','Yang diperbuat'],['تَفَعْلَلْ','Berbuatlah!'],['لَا تَتَفَعْلَلْ','Jangan berbuat!'],['مُتَفَعْلَلٌ','Waktu/tempat']] },
      { items: [['تَجَلْبَبَ','Telah berjilbab'],['يَتَجَلْبَبُ','Sedang berjilbab'],['تَجَلْبُبًا','Pemakaian jilbab'],['وَمُتَجَلْبَبًا','Dan pemakaian jilbab'],['فَهُوَ','Maka dia'],['مُتَجَلْبِبٌ','Yang berjilbab'],['وَذَاكَ','Dan itu'],['مُتَجَلْبَبٌ','Yang dipakaikan jilbab'],['تَجَلْبَبْ','Berjilbablah!'],['لَا تَتَجَلْبَبْ','Jangan berjilbab!'],['مُتَجَلْبَبٌ','Waktu/tempat']] },

      // 2. Tafau'ala - Tajauraba
      { isWazan: true, items: [['تَفَوْعَلَ','Telah berbuat'],['يَتَفَوْعَلُ','Sedang berbuat'],['تَفَوْعُلًا','Perbuatan'],['وَمُتَفَوْعَلًا','Dan perbuatan'],['فَهُوَ','Maka dia'],['مُتَفَوْعِلٌ','Yang berbuat'],['وَذَاكَ','Dan itu'],['مُتَفَوْعَلٌ','Yang diperbuat'],['تَفَوْعَلْ','Berbuatlah!'],['لَا تَتَفَوْعَلْ','Jangan berbuat!'],['مُتَفَوْعَلٌ','Waktu/tempat']] },
      { items: [['تَجَوْرَبَ','Telah memakai kaus kaki'],['يَتَجَوْرَبُ','Sedang memakai kaus kaki'],['تَجَوْرُبًا','Pemakaian kaus kaki'],['وَمُتَجَوْرَبًا','Dan pemakaian kaus kaki'],['فَهُوَ','Maka dia'],['مُتَجَوْرِبٌ','Yang memakai kaus kaki'],['وَذَاكَ','Dan itu'],['مُتَجَوْرَبٌ','Kaus kaki yang dipakai'],['تَجَوْرَبْ','Pakailah kaus kaki!'],['لَا تَتَجَوْرَبْ','Jangan memakai kaus kaki!'],['مُتَجَوْرَبٌ','Waktu/tempat']] },

      // 3. Tamaf'ala - Tamaskana
      { isWazan: true, items: [['تَمَفْعَلَ','Telah berbuat'],['يَتَمَفْعَلُ','Sedang berbuat'],['تَمَفْعُلًا','Perbuatan'],['وَمُتَمَفْعَلًا','Dan perbuatan'],['فَهُوَ','Maka dia'],['مُتَمَفْعِلٌ','Yang berbuat'],['وَذَاكَ','Dan itu'],['مُتَمَفْعَلٌ','Yang diperbuat'],['تَمَفْعَلْ','Berbuatlah!'],['لَا تَتَمَفْعَلْ','Jangan berbuat!'],['مُتَمَفْعَلٌ','Waktu/tempat']] },
      { items: [['تَمَسْكَنَ','Telah merendah/berlagak miskin'],['يَتَمَسْكَنُ','Sedang merendah/berlagak miskin'],['تَمَسْكُنًا','Perbuatan merendah'],['وَمُتَمَسْكَنًا','Dan perbuatan merendah'],['فَهُوَ','Maka dia'],['مُتَمَسْكِنٌ','Yang merendah'],['وَذَاكَ','Dan itu'],['مُتَمَسْكَنٌ','Kiasan'],['تَمَسْكَنْ','Merendahlah!'],['لَا تَتَمَسْكَنْ','Jangan berlagak miskin!'],['مُتَمَسْكَنٌ','Waktu/tempat']] },

      // 4. Tafai'ala - Tasyaithana
      { isWazan: true, items: [['تَفَيْعَلَ','Telah berbuat'],['يَتَفَيْعَلُ','Sedang berbuat'],['تَفَيْعُلًا','Perbuatan'],['وَمُتَفَيْعَلًا','Dan perbuatan'],['فَهُوَ','Maka dia'],['مُتَفَيْعِلٌ','Yang berbuat'],['وَذَاكَ','Dan itu'],['مُتَفَيْعَلٌ','Yang diperbuat'],['تَفَيْعَلْ','Berbuatlah!'],['لَا تَتَفَيْعَلْ','Jangan berbuat!'],['مُتَفَيْعَلٌ','Waktu/tempat']] },
      { items: [['تَشَيْطَنَ','Telah berperilaku setan'],['يَتَشَيْطَنُ','Sedang berperilaku setan'],['تَشَيْطُنًا','Perilaku setan'],['وَمُتَشَيْطَنًا','Dan perilaku setan'],['فَهُوَ','Maka dia'],['مُتَشَيْطِنٌ','Yang berperilaku setan'],['وَذَاكَ','Dan itu'],['مُتَشَيْطَنٌ','Kiasan'],['تَشَيْطَنْ','Berperilakulah!'],['لَا تَتَشَيْطَنْ','Jangan berperilaku setan!'],['مُتَشَيْطَنٌ','Waktu/tempat']] },

      // 5. Tafa'wala - Tarahwaka
      { isWazan: true, items: [['تَفَعْوَلَ','Telah berbuat'],['يَتَفَعْوَلُ','Sedang berbuat'],['تَفَعْوُلًا','Perbuatan'],['وَمُتَفَعْوَلًا','Dan perbuatan'],['فَهُوَ','Maka dia'],['مُتَفَعْوِلٌ','Yang berbuat'],['وَذَاكَ','Dan itu'],['مُتَفَعْوَلٌ','Yang diperbuat'],['تَفَعْوَلْ','Berbuatlah!'],['لَا تَتَفَعْوَلْ','Jangan berbuat!'],['مُتَفَعْوَلٌ','Waktu/tempat']] },
      { items: [['تَرَهْوَكَ','Telah berjalan berlenggok'],['يَتَرَهْوَكُ','Sedang berjalan berlenggok'],['تَرَهْوُكًا','Jalan berlenggok'],['وَمُتَرَهْوَكًا','Dan jalan berlenggok'],['فَهُوَ','Maka dia'],['مُتَرَهْوِكٌ','Yang berjalan berlenggok'],['وَذَاكَ','Dan itu'],['مُتَرَهْوَكٌ','Kiasan'],['تَرَهْوَكْ','Berjalanlah!'],['لَا تَتَرَهْوَكْ','Jangan berjalan berlenggok!'],['مُتَرَهْوَكٌ','Waktu/tempat']] },

      // 6. Tafa'yala - Tasyaryafa
      { isWazan: true, items: [['تَفَعْيَلَ','Telah berbuat'],['يَتَفَعْيَلُ','Sedang berbuat'],['تَفَعْيُلًا','Perbuatan'],['وَمُتَفَعْيَلًا','Dan perbuatan'],['فَهُوَ','Maka dia'],['مُتَفَعْيِلٌ','Yang berbuat'],['وَذَاكَ','Dan itu'],['مُتَفَعْيَلٌ','Yang diperbuat'],['تَفَعْيَلْ','Berbuatlah!'],['لَا تَتَفَعْيَلْ','Jangan berbuat!'],['مُتَفَعْيَلٌ','Waktu/tempat']] },
      { items: [['تَشَرْيَفَ','Telah menjadi tinggi/mulia'],['يَتَشَرْيَفُ','Sedang menjadi tinggi'],['تَشَرْيُفًا','Kemuliaan'],['وَمُتَشَرْيَفًا','Dan kemuliaan'],['فَهُوَ','Maka dia'],['مُتَشَرْيِفٌ','Yang mulia'],['وَذَاكَ','Dan itu'],['مُتَشَرْيَفٌ','Kiasan'],['تَشَرْيَفْ','Muliakanlah diri!'],['لَا تَتَشَرْيَفْ','Jangan menyombongkan diri!'],['مُتَشَرْيَفٌ','Waktu/tempat']] },

      // 7. Tafa'laa - Tasalqaa
      { isWazan: true, items: [['تَفَعْلَى','Telah berbuat'],['يَتَفَعْلَى','Sedang berbuat'],['تَفَعْلِيًا','Perbuatan'],['وَمُتَفَعْلًى','Dan perbuatan'],['فَهُوَ','Maka dia'],['مُتَفَعْلٍ','Yang berbuat'],['وَذَاكَ','Dan itu'],['مُتَفَعْلًى','Yang diperbuat'],['تَفَعْلَ','Berbuatlah!'],['لَا تَتَفَعْلَ','Jangan berbuat!'],['مُتَفَعْلًى','Waktu/tempat']] },
      { items: [['تَسَلْقَى','Telah tidur telentang'],['يَتَسَلْقَى','Sedang tidur telentang'],['تَسَلْقِيًا','Tidur telentang'],['وَمُتَسَلْقًى','Dan tidur telentang'],['فَهُوَ','Maka dia'],['مُتَسَلْقٍ','Yang tidur telentang'],['وَذَاكَ','Dan itu'],['مُتَسَلْقًى','Kiasan'],['تَسَلْقَ','Tidurlah telentang!'],['لَا تَتَسَلْقَ','Jangan tidur telentang!'],['مُتَسَلْقًى','Waktu/tempat']] }
    ]
  }
];

// Halaman 34-35 Kitab Asli: Mulhaq bi Ihranjama (2 Wazan dalam 1 tabel: If'anlala, Iq'ansasa, If'anlaa, Islanqaa)
export const MULHAQ_IHRANJAMA_DATA: TashrifBabData[] = [
  {
    id: 'mrb-mazid-ihranjama',
    kategori: 'Mulhaq Rubai Mazid',
    judulArab: 'مُلْحَقُ اِحْرَنْجَمَ (اِفْعَنْلَلَ - اِفْعَنْلَى)',
    judulIndo: 'Mulhaq Ihranjama (If’anlala & If’anlaa)',
    hasIsimAlat: false,
    rows: [
      { isWazan: true, items: [['اِفْعَنْلَلَ','Telah berbuat'],['يَفْعَنْلِلُ','Sedang berbuat'],['اِفْعِنْلَالًا','Perbuatan'],['وَمُفْعَنْلَلًا','Dan perbuatan'],['فَهُوَ','Maka dia'],['مُفْعَنْلِلٌ','Yang berbuat'],['وَذَاكَ','Dan itu'],['مُفْعَنْلَلٌ','Kiasan'],['اِفْعَنْلِلْ','Berbuatlah!'],['لَا تَفْعَنْلِلْ','Jangan berbuat!'],['مُفْعَنْلَلٌ','Waktu/tempat']] },
      { items: [['اِقْعَنْسَسَ','Telah membusungkan dada'],['يَقْعَنْسِسُ','Sedang membusungkan dada'],['اِقْعِنْسَاسًا','Pembusungan dada'],['وَمُقْعَنْسَسًا','Dan pembusungan dada'],['فَهُوَ','Maka dia'],['مُقْعَنْسِسٌ','Yang membusungkan dada'],['وَذَاكَ','Dan itu'],['مُقْعَنْسَسٌ','Kiasan'],['اِقْعَنْسِسْ','Busungkan dada!'],['لَا تَقْعَنْسِسْ','Jangan membusungkan dada!'],['مُقْعَنْسَسٌ','Waktu/tempat']] },
      { isWazan: true, items: [['اِفْعَنْلَى','Telah berbuat'],['يَفْعَنْلِي','Sedang berbuat'],['اِفْعِنْلَاءً','Perbuatan'],['وَمُفْعَنْلًى','Dan perbuatan'],['فَهُوَ','Maka dia'],['مُفْعَنْلٍ','Yang berbuat'],['وَذَاكَ','Dan itu'],['مُفْعَنْلًى','Kiasan'],['اِفْعَنْلِ','Berbuatlah!'],['لَا تَفْعَنْلِ','Jangan berbuat!'],['مُفْعَنْلًى','Waktu/tempat']] },
      { items: [['اِسْلَنْقَى','Telah tidur telentang'],['يَسْلَنْقِي','Sedang tidur telentang'],['اِسْلِنْقَاءً','Tidur telentang'],['وَمُسْلَنْقًى','Dan tidur telentang'],['فَهُوَ','Maka dia'],['مُسْلَنْقٍ','Yang tidur telentang'],['وَذَاكَ','Dan itu'],['مُسْلَنْقًى','Kiasan'],['اِسْلَنْقِ','Tidurlah telentang!'],['لَا تَسْلَنْقِ','Jangan tidur telentang!'],['مُسْلَنْقًى','Waktu/tempat']] }
    ]
  }
];

export const MULHAQ_RUBAI_MAZID_DATA: TashrifBabData[] = [
  ...MULHAQ_TADAHRAJA_DATA,
  ...MULHAQ_IHRANJAMA_DATA
];
