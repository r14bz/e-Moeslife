export interface LughawiMatrixRow {
  rowLabelArab: string;
  rowLabelIndo: string;
  cells: string[];
}

export interface LughawiBabData {
  id: string;
  direction: 'vertical' | 'horizontal';
  kategori: string;
  judulArab: string;
  judulIndo: string;
  halamanKitab: string;
  colHeadersArab: string[];
  colHeadersIndo: string[];
  rows: LughawiMatrixRow[];
}

export const TASHRIF_LUGHAWI_DATA: LughawiBabData[] = [
  // =========================================================
  // 1. HAL. 36-37: FI\'IL MADHI MA\'LUM (SHAHIH, MUDHA\'AF, AJWAF)
  // =========================================================
  {
    id: 'lg-01-madhi-malum-1',
    direction: 'vertical',
    kategori: "Fi\'il Madhi Ma\'lum",
    judulArab: 'اَلْفِعْلُ الْمَاضِي الْمَبْنِيُّ لِلْفَاعِلِ (١)',
    judulIndo: "Fi\'il Madhi Ma\'lum (Shahih, Mudha\'af & Ajwaf)",
    halamanKitab: 'Hal. 36-37',
    colHeadersArab: ['الوزن', 'صحيح', 'مضاعف', 'مضاعف ٤', 'مزيد', 'أجوف واوي', 'أجوف يائي', 'أجوف ٤', 'أجوف ٥'],
    colHeadersIndo: ['Wazan', 'Shahih', "Mudha\'af", "Mudha\'af 4", 'Mazid', 'Ajwaf Wawi', "Ajwaf Ya\'i", 'Ajwaf 4', 'Ajwaf 5'],
    rows: [
      { rowLabelArab: 'هُوَ', rowLabelIndo: 'Ghaib (lk) 1', cells: ['فَعَلَ', 'نَصَرَ', 'مَدَّ', 'عَضَّ', 'اِفْعَلَلَّ', 'صَانَ', 'بَاعَ', 'خَافَ', 'طَالَ'] },
      { rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaib (lk) 2', cells: ['فَعَلَا', 'نَصَرَا', 'مَدَّا', 'عَضَّا', 'اِفْعَلَلَّا', 'صَانَا', 'بَاعَا', 'خَافَا', 'طَالَا'] },
      { rowLabelArab: 'هُمْ', rowLabelIndo: 'Ghaib (lk) 3+', cells: ['فَعَلُوْا', 'نَصَرُوْا', 'مَدُّوْا', 'عَضُّوْا', 'اِفْعَلَلُّوْا', 'صَانُوْا', 'بَاعُوْا', 'خَافُوْا', 'طَالُوْا'] },
      { rowLabelArab: 'هِيَ', rowLabelIndo: 'Ghaibah (pr) 1', cells: ['فَعَلَتْ', 'نَصَرَتْ', 'مَدَّتْ', 'عَضَّتْ', 'اِفْعَلَلَّتْ', 'صَانَتْ', 'بَاعَتْ', 'خَافَتْ', 'طَالَتْ'] },
      { rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaibah (pr) 2', cells: ['فَعَلَتَا', 'نَصَرَتَا', 'مَدَّتَا', 'عَضَّتَا', 'اِفْعَلَلَّتَا', 'صَانَتَا', 'بَاعَتَا', 'خَافَتَا', 'طَالَتَا'] },
      { rowLabelArab: 'هُنَّ', rowLabelIndo: 'Ghaibah (pr) 3+', cells: ['فَعَلْنَ', 'نَصَرْنَ', 'مَدَدْنَ', 'عَضِضْنَ', 'اِفْعَلَلْنَ', 'صُنَّ', 'بِعْنَ', 'خِفْنَ', 'طُلْنَ'] },
      { rowLabelArab: 'أَنْتَ', rowLabelIndo: 'Mukhathab (lk) 1', cells: ['فَعَلْتَ', 'نَصَرْتَ', 'مَدَدْتَ', 'عَضِضْتَ', 'اِفْعَلَلْتَ', 'صُنْتَ', 'بِعْتَ', 'خِفْتَ', 'طُلْتَ'] },
      { rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Mukhathab (lk) 2', cells: ['فَعَلْتُمَا', 'نَصَرْتُمَا', 'مَدَدْتُمَا', 'عَضِضْتُمَا', 'اِفْعَلَلْتُمَا', 'صُنْتُمَا', 'بِعْتُمَا', 'خِفْتُمَا', 'طُلْتُمَا'] },
      { rowLabelArab: 'أَنْتُمْ', rowLabelIndo: 'Mukhathab (lk) 3+', cells: ['فَعَلْتُمْ', 'نَصَرْتُمْ', 'مَدَدْتُمْ', 'عَضِضْتُمْ', 'اِفْعَلَلْتُمْ', 'صُنْتُمْ', 'بِعْتُمْ', 'خِفْتُمْ', 'طُلْتُمْ'] },
      { rowLabelArab: 'أَنْتِ', rowLabelIndo: 'Mukhathabah (pr) 1', cells: ['فَعَلْتِ', 'نَصَرْتِ', 'مَدَدْتِ', 'عَضِضْتِ', 'اِفْعَلَلْتِ', 'صُنْتِ', 'بِعْتِ', 'خِفْتِ', 'طُلْتِ'] },
      { rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Mukhathabah (pr) 2', cells: ['فَعَلْتُمَا', 'نَصَرْتُمَا', 'مَدَدْتُمَا', 'عَضِضْتُمَا', 'اِفْعَلَلْتُمَا', 'صُنْتُمَا', 'بِعْتُمَا', 'خِفْتُمَا', 'طُلْتُمَا'] },
      { rowLabelArab: 'أَنْتُنَّ', rowLabelIndo: 'Mukhathabah (pr) 3+', cells: ['فَعَلْتُنَّ', 'نَصَرْتُنَّ', 'مَدَدْتُنَّ', 'عَضِضْتُنَّ', 'اِفْعَلَلْتُنَّ', 'صُنْتُنَّ', 'بِعْتُنَّ', 'خِفْتُنَّ', 'طُلْتُنَّ'] },
      { rowLabelArab: 'أَنَا', rowLabelIndo: 'Mutakallim 1', cells: ['فَعَلْتُ', 'نَصَرْتُ', 'مَدَدْتُ', 'عَضِضْتُ', 'اِفْعَلَلْتُ', 'صُنْتُ', 'بِعْتُ', 'خِفْتُ', 'طُلْتُ'] },
      { rowLabelArab: 'نَحْنُ', rowLabelIndo: 'Mutakallim 2+', cells: ['فَعَلْنَا', 'نَصَرْنَا', 'مَدَدْنَا', 'عَضِضْنَا', 'اِفْعَلَلْنَا', 'صُنَّا', 'بِعْنَا', 'خِفْنَا', 'طُلْنَا'] },
    ],
  },

  // =========================================================
  // 2. HAL. 38: FI\'IL MADHI MA\'LUM NAQISH
  // =========================================================
  {
    id: 'lg-02-madhi-malum-naqish',
    direction: 'vertical',
    kategori: "Fi\'il Madhi Ma\'lum (Naqish)",
    judulArab: 'اَلْفِعْلُ الْمَاضِي النَّاقِصُ لِلْفَاعِلِ',
    judulIndo: "Fi\'il Madhi Ma\'lum Bina' Naqish",
    halamanKitab: 'Hal. 38',
    colHeadersArab: ['الوزن', 'ناقص واوي', 'ناقص يائي', 'ناقص ٤', 'ناقص ٥'],
    colHeadersIndo: ['Wazan', 'Naqish Wawi', "Naqish Ya\'i", 'Naqish Bab 4', 'Naqish Bab 5'],
    rows: [
      { rowLabelArab: 'هُوَ', rowLabelIndo: 'Ghaib (lk) 1', cells: ['فَعَلَ', 'غَزَا', 'رَمَى', 'رَضِيَ', 'سَرُوَ'] },
      { rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaib (lk) 2', cells: ['فَعَلَا', 'غَزَوَا', 'رَمَيَا', 'رَضِيَا', 'سَرُوَا'] },
      { rowLabelArab: 'هُمْ', rowLabelIndo: 'Ghaib (lk) 3+', cells: ['فَعَلُوْا', 'غَزَوْا', 'رَمَوْا', 'رَضُوْا', 'سَرُوْا'] },
      { rowLabelArab: 'هِيَ', rowLabelIndo: 'Ghaibah (pr) 1', cells: ['فَعَلَتْ', 'غَزَتْ', 'رَمَتْ', 'رَضِيَتْ', 'سَرُوَتْ'] },
      { rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaibah (pr) 2', cells: ['فَعَلَتَا', 'غَزَتَا', 'رَمَتَا', 'رَضِيَتَا', 'سَرُوَتَا'] },
      { rowLabelArab: 'هُنَّ', rowLabelIndo: 'Ghaibah (pr) 3+', cells: ['فَعَلْنَ', 'غَزَوْنَ', 'رَمَيْنَ', 'رَضِيْنَ', 'سَرُوْنَ'] },
      { rowLabelArab: 'أَنْتَ', rowLabelIndo: 'Mukhathab (lk) 1', cells: ['فَعَلْتَ', 'غَزَوْتَ', 'رَمَيْتَ', 'رَضِيْتَ', 'سَرُوْتَ'] },
      { rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Mukhathab (lk) 2', cells: ['فَعَلْتُمَا', 'غَزَوْتُمَا', 'رَمَيْتُمَا', 'رَضِيْتُمَا', 'سَرُوْتُمَا'] },
      { rowLabelArab: 'أَنْتُمْ', rowLabelIndo: 'Mukhathab (lk) 3+', cells: ['فَعَلْتُمْ', 'غَزَوْتُمْ', 'رَمَيْتُمْ', 'رَضِيْتُمْ', 'سَرُوْتُمْ'] },
      { rowLabelArab: 'أَنْتِ', rowLabelIndo: 'Mukhathabah (pr) 1', cells: ['فَعَلْتِ', 'غَزَوْتِ', 'رَمَيْتِ', 'رَضِيْتِ', 'سَرُوْتِ'] },
      { rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Mukhathabah (pr) 2', cells: ['فَعَلْتُمَا', 'غَزَوْتُمَا', 'رَمَيْتُمَا', 'رَضِيْتُمَا', 'سَرُوْتُمَا'] },
      { rowLabelArab: 'أَنْتُنَّ', rowLabelIndo: 'Mukhathabah (pr) 3+', cells: ['فَعَلْتُنَّ', 'غَزَوْتُنَّ', 'رَمَيْتُنَّ', 'رَضِيْتُنَّ', 'سَرُوْتُنَّ'] },
      { rowLabelArab: 'أَنَا', rowLabelIndo: 'Mutakallim 1', cells: ['فَعَلْتُ', 'غَزَوْتُ', 'رَمَيْتُ', 'رَضِيْتُ', 'سَرُوْتُ'] },
      { rowLabelArab: 'نَحْنُ', rowLabelIndo: 'Mutakallim 2+', cells: ['فَعَلْنَا', 'غَزَوْنَا', 'رَمَيْنَا', 'رَضِيْنَا', 'سَرُوْنَا'] },
    ],
  },

  // =========================================================
  // 3. HAL. 38-39: FI\'IL MADHI MAJHUL
  // =========================================================
  {
    id: 'lg-03-madhi-majhul',
    direction: 'vertical',
    kategori: "Fi\'il Madhi Majhul",
    judulArab: 'اَلْفِعْلُ الْمَاضِي الْمَبْنِيُّ لِلْمَفْعُوْلِ',
    judulIndo: "Fi\'il Madhi Majhul (Pasif - 14 Dhomir)",
    halamanKitab: 'Hal. 38-39',
    colHeadersArab: ['الوزن', 'مضاعف', 'أجوف واوي', 'أجوف يائي', 'ناقص'],
    colHeadersIndo: ['Wazan', "Mudha\'af", 'Ajwaf Wawi', "Ajwaf Ya\'i", 'Naqish'],
    rows: [
      { rowLabelArab: 'هُوَ', rowLabelIndo: 'Ghaib (lk) 1', cells: ['فُعِلَ', 'مُدَّ', 'صِيْنَ', 'بِيْعَ', 'غُزِيَ'] },
      { rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaib (lk) 2', cells: ['فُعِلَا', 'مُدَّا', 'صِيْنَا', 'بِيْعَا', 'غُزِيَا'] },
      { rowLabelArab: 'هُمْ', rowLabelIndo: 'Ghaib (lk) 3+', cells: ['فُعِلُوْا', 'مُدُّوْا', 'صِيْنُوْا', 'بِيْعُوْا', 'غُزُوْا'] },
      { rowLabelArab: 'هِيَ', rowLabelIndo: 'Ghaibah (pr) 1', cells: ['فُعِلَتْ', 'مُدَّتْ', 'صِيْنَتْ', 'بِيْعَتْ', 'غُزِيَتْ'] },
      { rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaibah (pr) 2', cells: ['فُعِلَتَا', 'مُدَّتَا', 'صِيْنَتَا', 'بِيْعَتَا', 'غُزِيَتَا'] },
      { rowLabelArab: 'هُنَّ', rowLabelIndo: 'Ghaibah (pr) 3+', cells: ['فُعِلْنَ', 'مُدِدْنَ', 'صِنَّ', 'بِعْنَ', 'غُزِيْنَ'] },
      { rowLabelArab: 'أَنْتَ', rowLabelIndo: 'Mukhathab (lk) 1', cells: ['فُعِلْتَ', 'مُدِدْتَ', 'صِنْتَ', 'بِعْتَ', 'غُزِيْتَ'] },
      { rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Mukhathab (lk) 2', cells: ['فُعِلْتُمَا', 'مُدِدْتُمَا', 'صِنْتُمَا', 'بِعْتُمَا', 'غُزِيْتُمَا'] },
      { rowLabelArab: 'أَنْتُمْ', rowLabelIndo: 'Mukhathab (lk) 3+', cells: ['فُعِلْتُمْ', 'مُدِدْتُمْ', 'صِنْتُمْ', 'بِعْتُمْ', 'غُزِيْتُمْ'] },
      { rowLabelArab: 'أَنْتِ', rowLabelIndo: 'Mukhathabah (pr) 1', cells: ['فُعِلْتِ', 'مُدِدْتِ', 'صِنْتِ', 'بِعْتِ', 'غُزِيْتِ'] },
      { rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Mukhathabah (pr) 2', cells: ['فُعِلْتُمَا', 'مُدِدْتُمَا', 'صِنْتُمَا', 'بِعْتُمَا', 'غُزِيْتُمَا'] },
      { rowLabelArab: 'أَنْتُنَّ', rowLabelIndo: 'Mukhathabah (pr) 3+', cells: ['فُعِلْتُنَّ', 'مُدِدْتُنَّ', 'صِنْتُنَّ', 'بِعْتُنَّ', 'غُزِيْتُنَّ'] },
      { rowLabelArab: 'أَنَا', rowLabelIndo: 'Mutakallim 1', cells: ['فُعِلْتُ', 'مُدِدْتُ', 'صِنْتُ', 'بِعْتُ', 'غُزِيْتُ'] },
      { rowLabelArab: 'نَحْنُ', rowLabelIndo: 'Mutakallim 2+', cells: ['فُعِلْنَا', 'مُدِدْنَا', 'صِنَّا', 'بِعْنَا', 'غُزِيْنَا'] },
    ],
  },

  // =========================================================
  // 4. HAL. 40-41: FI\'IL MUDHARI' MA\'LUM
  // =========================================================
  {
    id: 'lg-04-mudhari-malum',
    direction: 'vertical',
    kategori: "Fi\'il Mudhari' Ma\'lum",
    judulArab: 'اَلْفِعْلُ الْمُضَارِعُ الْمَبْنِيُّ لِلْفَاعِلِ',
    judulIndo: "Fi\'il Mudhari' Ma\'lum (Semua Bina' - 14 Dhomir)",
    halamanKitab: 'Hal. 40-41',
    colHeadersArab: ['الوزن', 'صحيح', 'مضاعف', 'مزيد', 'أجوف و', 'أجوف ي', 'أجوف ٤', 'ناقص و', 'ناقص ي', 'ناقص ٤'],
    colHeadersIndo: ['Wazan', 'Shahih', "Mudha\'af", 'Mazid', 'Ajwaf W', 'Ajwaf Y', 'Ajwaf 4', 'Naqish W', 'Naqish Y', 'Naqish 4'],
    rows: [
      { rowLabelArab: 'هُوَ', rowLabelIndo: 'Ghaib (lk) 1', cells: ['يَفْعَلُ', 'يَنْصُرُ', 'يَمُدُّ', 'يَفْعَلِلُّ', 'يَصُوْنُ', 'يَبِيْعُ', 'يَخَافُ', 'يَغْزُوْ', 'يَرْمِيْ', 'يَرْضَى'] },
{ rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaib (lk) 2', cells: ['يَفْعَلَانِ', 'يَنْصُرَانِ', 'يَمُدَّانِ', 'يَفْعَلِلَّانِ', 'يَصُوْنَانِ', 'يَبِيْعَانِ', 'يَخَافَانِ', 'يَغْزُوَانِ', 'يَرْمِيَانِ', 'يَرْضَيَانِ'] },
{ rowLabelArab: 'هُمْ', rowLabelIndo: 'Ghaib (lk) 3+', cells: ['يَفْعَلُوْنَ', 'يَنْصُرُوْنَ', 'يَمُدُّوْنَ', 'يَفْعَلِلُّوْنَ', 'يَصُوْنُوْنَ', 'يَبِيْعُوْنَ', 'يَخَافُوْنَ', 'يَغْزُوْنَ', 'يَرْمُوْنَ', 'يَرْضَوْنَ'] },
{ rowLabelArab: 'هِيَ', rowLabelIndo: 'Ghaibah (pr) 1', cells: ['تَفْعَلُ', 'تَنْصُرُ', 'تَمُدُّ', 'تَفْعَلِلُّ', 'تَصُوْنُ', 'تَبِيْعُ', 'تَخَافُ', 'تَغْزُوْ', 'تَرْمِيْ', 'تَرْضَى'] },
{ rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaibah (pr) 2', cells: ['تَفْعَلَانِ', 'تَنْصُرَانِ', 'تَمُدَّانِ', 'تَفْعَلِلَّانِ', 'تَصُوْنَانِ', 'تَبِيْعَانِ', 'تَخَافَانِ', 'تَغْزُوَانِ', 'تَرْمِيَانِ', 'تَرْضَيَانِ'] },
{ rowLabelArab: 'هُنَّ', rowLabelIndo: 'Ghaibah (pr) 3+', cells: ['يَفْعَلْنَ', 'يَنْصُرْنَ', 'يَمْدُدْنَ', 'يَفْعَلِلْنَ', 'يَصُنَّ', 'يَبِعْنَ', 'يَخَفْنَ', 'يَغْزُوْنَ', 'يَرْمِيْنَ', 'يَرْضَيْنَ'] },
{ rowLabelArab: 'أَنْتَ', rowLabelIndo: 'Mukhathab (lk) 1', cells: ['تَفْعَلُ', 'تَنْصُرُ', 'تَمُدُّ', 'تَفْعَلِلُّ', 'تَصُوْنُ', 'تَبِيْعُ', 'تَخَافُ', 'تَغْزُوْ', 'تَرْمِيْ', 'تَرْضَى'] },
{ rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Mukhathab (lk) 2', cells: ['تَفْعَلَانِ', 'تَنْصُرَانِ', 'تَمُدَّانِ', 'تَفْعَلِلَّانِ', 'تَصُوْنَانِ', 'تَبِيْعَانِ', 'تَخَافَانِ', 'تَغْزُوَانِ', 'تَرْمِيَانِ', 'تَرْضَيَانِ'] },
{ rowLabelArab: 'أَنْتُمْ', rowLabelIndo: 'Mukhathab (lk) 3+', cells: ['تَفْعَلُوْنَ', 'تَنْصُرُوْنَ', 'تَمُدُّوْنَ', 'تَفْعَلِلُّوْنَ', 'تَصُوْنُوْنَ', 'تَبِيْعُوْنَ', 'تَخَافُوْنَ', 'تَغْزُوْنَ', 'تَرْمُوْنَ', 'تَرْضَوْنَ'] },
{ rowLabelArab: 'أَنْتِ', rowLabelIndo: 'Mukhathabah (pr) 1', cells: ['تَفْعَلِيْنَ', 'تَنْصُرِيْنَ', 'تَمُدِّيْنَ', 'تَفْعَلِلِّيْنَ', 'تَصُوْنِيْنَ', 'تَبِيْعِيْنَ', 'تَخَافِيْنَ', 'تَغْزِيْنَ', 'تَرْمِيْنَ', 'تَرْضَيْنَ'] },
{ rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Mukhathabah (pr) 2', cells: ['تَفْعَلَانِ', 'تَنْصُرَانِ', 'تَمُدَّانِ', 'تَفْعَلِلَّانِ', 'تَصُوْنَانِ', 'تَبِيْعَانِ', 'تَخَافَانِ', 'تَغْزُوَانِ', 'تَرْمِيَانِ', 'تَرْضَيَانِ'] },
{ rowLabelArab: 'أَنْتُنَّ', rowLabelIndo: 'Mukhathabah (pr) 3+', cells: ['تَفْعَلْنَ', 'تَنْصُرْنَ', 'تَمْدُدْنَ', 'تَفْعَلِلْنَ', 'تَصُنَّ', 'تَبِعْنَ', 'تَخَفْنَ', 'تَغْزُوْنَ', 'تَرْمِيْنَ', 'تَرْضَيْنَ'] },
{ rowLabelArab: 'أَنَا', rowLabelIndo: 'Mutakallim 1', cells: ['أَفْعَلُ', 'أَنْصُرُ', 'أَمُدُّ', 'أَفْعَلِلُّ', 'أَصُوْنُ', 'أَبِيْعُ', 'أَخَافُ', 'أَغْزُوْ', 'أَرْمِيْ', 'أَرْضَى'] },
{ rowLabelArab: 'نَحْنُ', rowLabelIndo: 'Mutakallim 2+', cells: ['نَفْعَلُ', 'نَنْصُرُ', 'نَمُدُّ', 'نَفْعَلِلُّ', 'نَصُوْنُ', 'نَبِيْعُ', 'نَخَافُ', 'نَغْزُوْ', 'نَرْمِيْ', 'نَرْضَى'] },
],
},

// =========================================================
// 5. HAL. 42: FI\'IL MUDHARI' MAJHUL
// =========================================================
{
id: 'lg-05-mudhari-majhul',
direction: 'vertical',
kategori: "Fi\'il Mudhari' Majhul",
judulArab: 'اَلْفِعْلُ الْمُضَارِعُ الْمَبْنِيُّ لِلْمَفْعُوْلِ',
judulIndo: "Fi\'il Mudhari' Majhul (Pasif - 14 Dhomir)",
halamanKitab: 'Hal. 42',
colHeadersArab: ['الوزن', 'مضاعف', 'أجوف واوي', 'ناقص'],
colHeadersIndo: ['Wazan', "Mudha\'af", 'Ajwaf Wawi', 'Naqish'],
rows: [
{ rowLabelArab: 'هُوَ', rowLabelIndo: 'Ghaib (lk) 1', cells: ['يُفْعَلُ', 'يُمَدُّ', 'يُصَانُ', 'يُغْزَى'] },
{ rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaib (lk) 2', cells: ['يُفْعَلَانِ', 'يُمَدَّانِ', 'يُصَانَانِ', 'يُغْزَيَانِ'] },
{ rowLabelArab: 'هُمْ', rowLabelIndo: 'Ghaib (lk) 3+', cells: ['يُفْعَلُوْنَ', 'يُمَدُّوْنَ', 'يُصَانُوْنَ', 'يُغْزَوْنَ'] },
{ rowLabelArab: 'هِيَ', rowLabelIndo: 'Ghaibah (pr) 1', cells: ['تُفْعَلُ', 'تُمَدُّ', 'تُصَانُ', 'تُغْزَى'] },
{ rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaibah (pr) 2', cells: ['تُفْعَلَانِ', 'تُمَدَّانِ', 'تُصَانَانِ', 'تُغْزَيَانِ'] },
{ rowLabelArab: 'هُنَّ', rowLabelIndo: 'Ghaibah (pr) 3+', cells: ['يُفْعَلْنَ', 'يُمْدَدْنَ', 'يُصَنَّ', 'يُغْزَيْنَ'] },
{ rowLabelArab: 'أَنْتَ', rowLabelIndo: 'Mukhathab (lk) 1', cells: ['تُفْعَلُ', 'تُمَدُّ', 'تُصَانُ', 'تُغْزَى'] },
{ rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Mukhathab (lk) 2', cells: ['تُفْعَلَانِ', 'تُمَدَّانِ', 'تُصَانَانِ', 'تُغْزَيَانِ'] },
{ rowLabelArab: 'أَنْتُمْ', rowLabelIndo: 'Mukhathab (lk) 3+', cells: ['تُفْعَلُوْنَ', 'تُمَدُّوْنَ', 'تُصَانُوْنَ', 'تُغْزَوْنَ'] },
{ rowLabelArab: 'أَنْتِ', rowLabelIndo: 'Mukhathabah (pr) 1', cells: ['تُفْعَلِيْنَ', 'تُمَدِّيْنَ', 'تُصَانِيْنَ', 'تُغْزَيْنَ'] },
{ rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Mukhathabah (pr) 2', cells: ['تُفْعَلَانِ', 'تُمَدَّانِ', 'تُصَانَانِ', 'تُغْزَيَانِ'] },
{ rowLabelArab: 'أَنْتُنَّ', rowLabelIndo: 'Mukhathabah (pr) 3+', cells: ['تُفْعَلْنَ', 'تُمْدَدْنَ', 'تُصَنَّ', 'تُغْزَيْنَ'] },
{ rowLabelArab: 'أَنَا', rowLabelIndo: 'Mutakallim 1', cells: ['أُفْعَلُ', 'أُمَدُّ', 'أُصَانُ', 'أُغْزَى'] },
{ rowLabelArab: 'نَحْنُ', rowLabelIndo: 'Mutakallim 2+', cells: ['نُفْعَلُ', 'نُمَدُّ', 'نُصَانُ', 'نُغْزَى'] },
],
},

// =========================================================
// 6. HAL. 43-44: FI\'IL MUDHARI' + NUN TAUKID TSAQILAH & KHAFIFAH
// =========================================================
{
id: 'lg-06-mudhari-taukid',
direction: 'vertical',
kategori: "Mudhari' + Nun Taukid",
judulArab: 'اَلْمُضَارِعُ الْمُؤَكَّدُ بِالنُّوْنِ الثَّقِيْلَةِ وَالْخَفِيْفَةِ',
judulIndo: "Fi\'il Mudhari' dengan Nun Taukid Tsaqilah & Khafifah",
halamanKitab: 'Hal. 43-44',
colHeadersArab: ['ثقيلة أجوف', 'ثقيلة ناقص و', 'ثقيلة ناقص ي', 'ثقيلة ناقص ٤', 'خفيفة ناقص و', 'خفيفة ناقص ي', 'خفيفة ناقص ٤'],
colHeadersIndo: ['Tsaqilah Ajwaf', 'Tsaqilah Naqish W', 'Tsaqilah Naqish Y', 'Tsaqilah Naqish 4', 'Khafifah Naqish W', 'Khafifah Naqish Y', 'Khafifah Naqish 4'],
rows: [
{ rowLabelArab: 'هُوَ', rowLabelIndo: 'Ghaib (lk) 1', cells: ['يَصُوْنَنَّ', 'يَغْزُوَنَّ', 'يَرْمِيَنَّ', 'يَرْضَيَنَّ', 'يَغْزُوَنْ', 'يَرْمِيَنْ', 'يَرْضَيَنْ'] },
{ rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaib (lk) 2', cells: ['يَصُوْنَانِّ', 'يَغْزُوَانِّ', 'يَرْمِيَانِّ', 'يَرْضَيَانِّ', '-', '-', '-'] },
{ rowLabelArab: 'هُمْ', rowLabelIndo: 'Ghaib (lk) 3+', cells: ['يَصُوْنُنَّ', 'يَغْزُنَّ', 'يَرْمُنَّ', 'يَرْضَوُنَّ', 'يَغْزُنْ', 'يَرْمُنْ', 'يَرْضَوُنْ'] },
{ rowLabelArab: 'هِيَ', rowLabelIndo: 'Ghaibah (pr) 1', cells: ['تَصُوْنَنَّ', 'تَغْزُوَنَّ', 'تَرْمِيَنَّ', 'تَرْضَيَنَّ', 'تَغْزُوَنْ', 'تَرْمِيَنْ', 'تَرْضَيَنْ'] },
{ rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaibah (pr) 2', cells: ['تَصُوْنَانِّ', 'تَغْزُوَانِّ', 'تَرْمِيَانِّ', 'تَرْضَيَانِّ', '-', '-', '-'] },
{ rowLabelArab: 'هُنَّ', rowLabelIndo: 'Ghaibah (pr) 3+', cells: ['يَصُنَّانِّ', 'يَغْزُوْنَانِّ', 'يَرْمِيْنَانِّ', 'يَرْضَيْنَانِّ', '-', '-', '-'] },
{ rowLabelArab: 'أَنْتَ', rowLabelIndo: 'Mukhathab (lk) 1', cells: ['تَصُوْنَنَّ', 'تَغْزُوَنَّ', 'تَرْمِيَنَّ', 'تَرْضَيَنَّ', 'تَغْزُوَنْ', 'تَرْمِيَنْ', 'تَرْضَيَنْ'] },
{ rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Mukhathab (lk) 2', cells: ['تَصُوْنَانِّ', 'تَغْزُوَانِّ', 'تَرْمِيَانِّ', 'تَرْضَيَانِّ', '-', '-', '-'] },
{ rowLabelArab: 'أَنْتُمْ', rowLabelIndo: 'Mukhathab (lk) 3+', cells: ['تَصُوْنُنَّ', 'تَغْزُنَّ', 'تَرْمُنَّ', 'تَرْضَوُنَّ', 'تَغْزُنْ', 'تَرْمُنْ', 'تَرْضَوُنْ'] },
{ rowLabelArab: 'أَنْتِ', rowLabelIndo: 'Mukhathabah (pr) 1', cells: ['تَصُوْنِنَّ', 'تَغْزِنَّ', 'تَرْمِنَّ', 'تَرْضَيِنَّ', 'تَغْزِنْ', 'تَرْمِنْ', 'تَرْضَيِنْ'] },
{ rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Mukhathabah (pr) 2', cells: ['تَصُوْنَانِّ', 'تَغْزُوَانِّ', 'تَرْمِيَانِّ', 'تَرْضَيَانِّ', '-', '-', '-'] },
{ rowLabelArab: 'أَنْتُنَّ', rowLabelIndo: 'Mukhathabah (pr) 3+', cells: ['تَصُنَّانِّ', 'تَغْزُوْنَانِّ', 'تَرْمِيْنَانِّ', 'تَرْضَيْنَانِّ', '-', '-', '-'] },
{ rowLabelArab: 'أَنَا', rowLabelIndo: 'Mutakallim 1', cells: ['أَصُوْنَنَّ', 'أَغْزُوَنَّ', 'أَرْمِيَنَّ', 'أَرْضَيَنَّ', 'أَغْزُوَنْ', 'أَرْمِيَنْ', 'أَرْضَيَنْ'] },
{ rowLabelArab: 'نَحْنُ', rowLabelIndo: 'Mutakallim 2+', cells: ['نَصُوْنَنَّ', 'نَغْزُوَنَّ', 'نَرْمِيَنَّ', 'نَرْضَيَنَّ', 'نَغْزُوَنْ', 'نَرْمِيَنْ', 'نَرْضَيَنْ'] },
],
},

// =========================================================
// 7. HAL. 44-46: FI\'IL AMR MA\'LUM & MAJHUL (GHAIB & HADIR)
// =========================================================
{
id: 'lg-07-amr-malum-majhul',
direction: 'vertical',
kategori: "Fi\'il Amr (Ghaib & Hadir)",
judulArab: 'فِعْلُ الْأَمْرِ لِلْغَائِبِ وَالْحَاضِرِ وَالْمَجْهُوْلِ',
judulIndo: "Fi\'il Amr Ma\'lum (Ghaib & Hadir) & Amr Majhul",
halamanKitab: 'Hal. 44-46',
colHeadersArab: ['الوزن', 'مضاعف', 'مثال', 'أجوف و', 'أجوف ي', 'ناقص و', 'ناقص ي', 'مجهول'],
colHeadersIndo: ['Wazan', "Mudha\'af", 'Mitsal', 'Ajwaf W', 'Ajwaf Y', 'Naqish W', 'Naqish Y', 'Amr Majhul'],
rows: [
{ rowLabelArab: 'هُوَ', rowLabelIndo: 'Ghaib (lk) 1', cells: ['لِيَفْعَلْ', 'لِيَمُدَّ', 'لِيَعِدْ', 'لِيَصُنْ', 'لِيَبِعْ', 'لِيَغْزُ', 'لِيَرْمِ', 'لِيُرْمَ'] },
{ rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaib (lk) 2', cells: ['لِيَفْعَلَا', 'لِيَمُدَّا', 'لِيَعِدَا', 'لِيَصُوْنَا', 'لِيَبِيْعَا', 'لِيَغْزُوَا', 'لِيَرْمِيَا', 'لِيُرْمَيَا'] },
{ rowLabelArab: 'هُمْ', rowLabelIndo: 'Ghaib (lk) 3+', cells: ['لِيَفْعَلُوْا', 'لِيَمُدُّوْا', 'لِيَعِدُوْا', 'لِيَصُوْنُوْا', 'لِيَبِيْعُوْا', 'لِيَغْزُوْا', 'لِيَرْمُوْا', 'لِيُرْمَوْا'] },
{ rowLabelArab: 'هِيَ', rowLabelIndo: 'Ghaibah (pr) 1', cells: ['لِتَفْعَلْ', 'لِتَمُدَّ', 'لِتَعِدْ', 'لِتَصُنْ', 'لِتَبِعْ', 'لِتَغْزُ', 'لِتَرْمِ', 'لِتُرْمَ'] },
{ rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaibah (pr) 2', cells: ['لِتَفْعَلَا', 'لِتَمُدَّا', 'لِتَعِدَا', 'لِتَصُوْنَا', 'لِتَبِيْعَا', 'لِتَغْزُوَا', 'لِتَرْمِيَا', 'لِتُرْمَيَا'] },
{ rowLabelArab: 'هُنَّ', rowLabelIndo: 'Ghaibah (pr) 3+', cells: ['لِيَفْعَلْنَ', 'لِيَمْدُدْنَ', 'لِيَعِدْنَ', 'لِيَصُنَّ', 'لِيَبِعْنَ', 'لِيَغْزُوْنَ', 'لِيَرْمِيْنَ', 'لِيُرْمَيْنَ'] },
{ rowLabelArab: 'أَنْتَ', rowLabelIndo: 'Hadir (lk) 1', cells: ['اِفْعَلْ', 'مُدَّ', 'عِدْ', 'صُنْ', 'بِعْ', 'اُغْزُ', 'اِرْمِ', 'لِتُرْمَ'] },
{ rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Hadir (lk) 2', cells: ['اِفْعَلَا', 'مُدَّا', 'عِدَا', 'صُوْنَا', 'بِيْعَا', 'اُغْزُوَا', 'اِرْمِيَا', 'لِتُرْمَيَا'] },
{ rowLabelArab: 'أَنْتُمْ', rowLabelIndo: 'Hadir (lk) 3+', cells: ['اِفْعَلُوْا', 'مُدُّوْا', 'عِدُوْا', 'صُوْنُوْا', 'بِيْعُوْا', 'اُغْزُوْا', 'اِرْمُوْا', 'لِتُرْمَوْا'] },
{ rowLabelArab: 'أَنْتِ', rowLabelIndo: 'Hadir (pr) 1', cells: ['اِفْعَلِيْ', 'مُدِّيْ', 'عِدِيْ', 'صُوْنِيْ', 'بِيْعِيْ', 'اُغْزِيْ', 'اِرْمِيْ', 'لِتُرْمَيْ'] },
{ rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Hadir (pr) 2', cells: ['اِفْعَلَا', 'مُدَّا', 'عِدَا', 'صُوْنَا', 'بِيْعَا', 'اُغْزُوَا', 'اِرْمِيَا', 'لِتُرْمَيَا'] },
{ rowLabelArab: 'أَنْتُنَّ', rowLabelIndo: 'Hadir (pr) 3+', cells: ['اِفْعَلْنَ', 'اُمْدُدْنَ', 'عِدْنَ', 'صُنَّ', 'بِعْنَ', 'اُغْزُوْنَ', 'اِرْمِيْنَ', 'لِتُرْمَيْنَ'] },
{ rowLabelArab: 'أَنَا', rowLabelIndo: 'Mutakallim 1', cells: ['-', '-', '-', '-', '-', '-', '-', 'لِأُرْمَ'] },
{ rowLabelArab: 'نَحْنُ', rowLabelIndo: 'Mutakallim 2+', cells: ['-', '-', '-', '-', '-', '-', '-', 'لِنُرْمَ'] },
],
},

// =========================================================
// 8. HAL. 46-48: FI\'IL AMR + NUN TAUKID TSAQILAH & KHAFIFAH
// =========================================================
{
id: 'lg-08-amr-taukid',
direction: 'vertical',
kategori: "Fi\'il Amr + Nun Taukid",
judulArab: 'فِعْلُ الْأَمْرِ الْمُؤَكَّدُ بِالنُّوْنِ الثَّقِيْلَةِ وَالْخَفِيْفَةِ',
judulIndo: "Fi\'il Amr dengan Nun Taukid Tsaqilah & Khafifah",
halamanKitab: 'Hal. 46-48',
colHeadersArab: ['مثال و', 'مثال', 'أجوف و', 'أجوف ي', 'ناقص و', 'ناقص ي', 'خفيفة لفيف', 'خفيفة أجوف'],
colHeadersIndo: ['Tsaqilah', 'Tsaqilah 2', 'Ajwaf W', 'Ajwaf Y', 'Naqish W', 'Naqish Y', 'Khafifah Lafif', 'Khafifah Ajwaf'],
rows: [
{ rowLabelArab: 'هُوَ', rowLabelIndo: 'Ghaib (lk) 1', cells: ['لِيَقَعَنَّ', 'لِيَعِدَنَّ', 'لِيَصُوْنَنَّ', 'لِيَبِيْعَنَّ', 'لِيَغْزُوَنَّ', 'لِيَرْمِيَنَّ', 'لِيَلِيَنْ', 'لِيَكُنْ'] },
{ rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaib (lk) 2', cells: ['لِيَقَعَانِّ', 'لِيَعِدَانِّ', 'لِيَصُوْنَانِّ', 'لِيَبِيْعَانِّ', 'لِيَغْزُوَانِّ', 'لِيَرْمِيَانِّ', '-', '-'] },
{ rowLabelArab: 'هُمْ', rowLabelIndo: 'Ghaib (lk) 3+', cells: ['لِيَقَعُنَّ', 'لِيَعِدُنَّ', 'لِيَصُوْنُنَّ', 'لِيَبِيْعُنَّ', 'لِيَغْزُنَّ', 'لِيَرْمُنَّ', 'لِيَلُنْ', 'لِيَكُوْنُنْ'] },
{ rowLabelArab: 'هِيَ', rowLabelIndo: 'Ghaibah (pr) 1', cells: ['لِتَقَعَنَّ', 'لِتَعِدَنَّ', 'لِتَصُوْنَنَّ', 'لِتَبِيْعَنَّ', 'لِتَغْزُوَنَّ', 'لِتَرْمِيَنَّ', 'لِتَلِيَنْ', 'لِتَكُنْ'] },
{ rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaibah (pr) 2', cells: ['لِتَقَعَانِّ', 'لِتَعِدَانِّ', 'لِتَصُوْنَانِّ', 'لِتَبِيْعَانِّ', 'لِتَغْزُوَانِّ', 'لِتَرْمِيَانِّ', '-', '-'] },
{ rowLabelArab: 'هُنَّ', rowLabelIndo: 'Ghaibah (pr) 3+', cells: ['لِيَقَعْنَانِّ', 'لِيَعِدْنَانِّ', 'لِيَصُنَّانِّ', 'لِيَبِعْنَانِّ', 'لِيَغْزُوْنَانِّ', 'لِيَرْمِيْنَانِّ', '-', '-'] },
{ rowLabelArab: 'أَنْتَ', rowLabelIndo: 'Hadir (lk) 1', cells: ['قَعَنَّ', 'عِدَنَّ', 'صُوْنَنَّ', 'بِيْعَنَّ', 'اُغْزُوَنَّ', 'اِرْمِيَنَّ', 'لِيَنْ', 'كُنْ'] },
{ rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Hadir (lk) 2', cells: ['قَعَانِّ', 'عِدَانِّ', 'صُوْنَانِّ', 'بِيْعَانِّ', 'اُغْزُوَانِّ', 'اِرْمِيَانِّ', '-', '-'] },
{ rowLabelArab: 'أَنْتُمْ', rowLabelIndo: 'Hadir (lk) 3+', cells: ['قَعُنَّ', 'عِدُنَّ', 'صُوْنُنَّ', 'بِيْعُنَّ', 'اُغْزُنَّ', 'اِرْمُنَّ', 'لُنْ', 'كُوْنُنْ'] },
{ rowLabelArab: 'أَنْتِ', rowLabelIndo: 'Hadir (pr) 1', cells: ['قَعِنَّ', 'عِدِنَّ', 'صُوْنِنَّ', 'بِيْعِنَّ', 'اُغْزِنَّ', 'اِرْمِنَّ', 'لِنْ', 'كُوْنِنْ'] },
{ rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Hadir (pr) 2', cells: ['قَعَانِّ', 'عِدَانِّ', 'صُوْنَانِّ', 'بِيْعَانِّ', 'اُغْزُوَانِّ', 'اِرْمِيَانِّ', '-', '-'] },
{ rowLabelArab: 'أَنْتُنَّ', rowLabelIndo: 'Hadir (pr) 3+', cells: ['قَعْنَانِّ', 'عِدْنَانِّ', 'صُنَّانِّ', 'بِعْنَانِّ', 'اُغْزُوْنَانِّ', 'اِرْمِيْنَانِّ', '-', '-'] },
],
},

// =========================================================
// 9. HAL. 48-49: FI\'IL NAHI (14 DHOMIR)
// =========================================================
{
id: 'lg-09-fiil-nahi',
direction: 'vertical',
kategori: "Fi\'il Nahi",
judulArab: 'فِعْلُ النَّهْيِ الْمُتَّصِلُ بِضَمِيْرِ رَفْعٍ',
judulIndo: "Fi\'il Nahi (Larangan - 14 Dhomir)",
halamanKitab: 'Hal. 48-49',
colHeadersArab: ['الوزن', 'مزيد', 'صحيح', 'منفعل', 'ناقص ٤'],
colHeadersIndo: ['Wazan', 'Mazid', 'Shahih', "Munfa\'il", 'Naqish 4'],
rows: [
{ rowLabelArab: 'هُوَ', rowLabelIndo: 'Ghaib (lk) 1', cells: ['لَا يَفْعَلْ', 'لَا يَفْعَلِلْ', 'لَا يَضْرِبْ', 'لَا يَنْقَدْ', 'لَا يَخْشَ'] },
{ rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaib (lk) 2', cells: ['لَا يَفْعَلَا', 'لَا يَفْعَلِلَّا', 'لَا يَضْرِبَا', 'لَا يَنْقَادَا', 'لَا يَخْشَيَا'] },
{ rowLabelArab: 'هُمْ', rowLabelIndo: 'Ghaib (lk) 3+', cells: ['لَا يَفْعَلُوْا', 'لَا يَفْعَلِلُّوْا', 'لَا يَضْرِبُوْا', 'لَا يَنْقَادُوْا', 'لَا يَخْشَوْا'] },
{ rowLabelArab: 'هِيَ', rowLabelIndo: 'Ghaibah (pr) 1', cells: ['لَا تَفْعَلْ', 'لَا تَفْعَلِلْ', 'لَا تَضْرِبْ', 'لَا تَنْقَدْ', 'لَا تَخْشَ'] },
{ rowLabelArab: 'هُمَا', rowLabelIndo: 'Ghaibah (pr) 2', cells: ['لَا تَفْعَلَا', 'لَا تَفْعَلِلَّا', 'لَا تَضْرِبَا', 'لَا تَنْقَادَا', 'لَا تَخْشَيَا'] },
{ rowLabelArab: 'هُنَّ', rowLabelIndo: 'Ghaibah (pr) 3+', cells: ['لَا يَفْعَلْنَ', 'لَا يَفْعَلِلْنَ', 'لَا يَضْرِبْنَ', 'لَا يَنْقَدْنَ', 'لَا يَخْشَيْنَ'] },
{ rowLabelArab: 'أَنْتَ', rowLabelIndo: 'Mukhathab (lk) 1', cells: ['لَا تَفْعَلْ', 'لَا تَفْعَلِلْ', 'لَا تَضْرِبْ', 'لَا تَنْقَدْ', 'لَا تَخْشَ'] },
{ rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Mukhathab (lk) 2', cells: ['لَا تَفْعَلَا', 'لَا تَفْعَلِلَّا', 'لَا تَضْرِبَا', 'لَا تَنْقَادَا', 'لَا تَخْشَيَا'] },
{ rowLabelArab: 'أَنْتُمْ', rowLabelIndo: 'Mukhathab (lk) 3+', cells: ['لَا تَفْعَلُوْا', 'لَا تَفْعَلِلُّوْا', 'لَا تَضْرِبُوْا', 'لَا تَنْقَادُوْا', 'لَا تَخْشَوْا'] },
{ rowLabelArab: 'أَنْتِ', rowLabelIndo: 'Mukhathabah (pr) 1', cells: ['لَا تَفْعَلِيْ', 'لَا تَفْعَلِلِّيْ', 'لَا تَضْرِبِيْ', 'لَا تَنْقَادِيْ', 'لَا تَخْشَيْ'] },
{ rowLabelArab: 'أَنْتُمَا', rowLabelIndo: 'Mukhathabah (pr) 2', cells: ['لَا تَفْعَلَا', 'لَا تَفْعَلِلَّا', 'لَا تَضْرِبَا', 'لَا تَنْقَادَا', 'لَا تَخْشَيَا'] },
{ rowLabelArab: 'أَنْتُنَّ', rowLabelIndo: 'Mukhathabah (pr) 3+', cells: ['لَا تَفْعَلْنَ', 'لَا تَفْعَلِلْنَ', 'لَا تَضْرِبْنَ', 'لَا تَنْقَدْنَ', 'لَا تَخْشَيْنَ'] },
{ rowLabelArab: 'أَنَا', rowLabelIndo: 'Mutakallim 1', cells: ['لَا أَفْعَلْ', 'لَا أَفْعَلِلْ', 'لَا أَضْرِبْ', 'لَا أَنْقَدْ', 'لَا أَخْشَ'] },
{ rowLabelArab: 'نَحْنُ', rowLabelIndo: 'Mutakallim 2+', cells: ['لَا نَفْعَلْ', 'لَا نَفْعَلِلْ', 'لَا نَضْرِبْ', 'لَا نَنْقَدْ', 'لَا نَخْشَ'] },
],
},

// =========================================================
// 10. HAL. 49-50: DHAMIR MUTTASHIL, MUNFASHIL & ISYARAH
// =========================================================
{
id: 'lg-10-dhamir-isyarah',
direction: 'vertical',
kategori: 'Dhamir & Isyarah',
judulArab: 'اَلضَّمِيْرُ الْمُتَّصِلُ وَالْمُنْفَصِلُ وَالْإِشَارَةُ',
judulIndo: "Dhamir Nashab pada Fi\'il, Dhamir Munfashil & Isyarah",
halamanKitab: 'Hal. 49-50',
colHeadersArab: ['ماضٍ متصل', 'مضارع متصل', 'محل رفع', 'محل نصب', 'محل جر', 'الإشارة'],
colHeadersIndo: ['Madhi + Dhamir', "Mudhari' + Dhamir", "Rafa'", 'Nashab', 'Jarr', 'Isyarah'],
rows: [
{ rowLabelArab: 'مفرد مذكر غائب', rowLabelIndo: 'Ghaib (lk) 1', cells: ['ضَرَبَهُ', 'يَضْرِبُهُ', 'هُوَ', 'إِيَّاهُ', 'بِهِ', 'ذَا'] },
{ rowLabelArab: 'تثنية مذكر غائب', rowLabelIndo: 'Ghaib (lk) 2', cells: ['ضَرَبَهُمَا', 'يَضْرِبُهُمَا', 'هُمَا', 'إِيَّاهُمَا', 'بِهِمَا', 'ذَانِ'] },
{ rowLabelArab: 'جمع مذكر غائب', rowLabelIndo: 'Ghaib (lk) 3+', cells: ['ضَرَبَهُمْ', 'يَضْرِبُهُمْ', 'هُمْ', 'إِيَّاهُمْ', 'بِهِمْ', 'أُوْلَاءِ'] },
{ rowLabelArab: 'مفرد مؤنث غائبة', rowLabelIndo: 'Ghaibah (pr) 1', cells: ['ضَرَبَهَا', 'يَضْرِبُهَا', 'هِيَ', 'إِيَّاهَا', 'بِهَا', 'تَا'] },
{ rowLabelArab: 'تثنية مؤنث غائبة', rowLabelIndo: 'Ghaibah (pr) 2', cells: ['ضَرَبَهُمَا', 'يَضْرِبُهُمَا', 'هُمَا', 'إِيَّاهُمَا', 'بِهِمَا', 'تَانِ'] },
{ rowLabelArab: 'جمع مؤنث غائبة', rowLabelIndo: 'Ghaibah (pr) 3+', cells: ['ضَرَبَهُنَّ', 'يَضْرِبُهُنَّ', 'هُنَّ', 'إِيَّاهُنَّ', 'بِهِنَّ', 'أُوْلَاءِ'] },
{ rowLabelArab: 'مفرد مذكر مخاطب', rowLabelIndo: 'Mukhathab (lk) 1', cells: ['ضَرَبَكَ', 'يَضْرِبُكَ', 'أَنْتَ', 'إِيَّاكَ', 'بِكَ', '-'] },
{ rowLabelArab: 'تثنية مذكر مخاطب', rowLabelIndo: 'Mukhathab (lk) 2', cells: ['ضَرَبَكُمَا', 'يَضْرِبُكُمَا', 'أَنْتُمَا', 'إِيَّاكُمَا', 'بِكُمَا', '-'] },
{ rowLabelArab: 'جمع مذكر مخاطب', rowLabelIndo: 'Mukhathab (lk) 3+', cells: ['ضَرَبَكُمْ', 'يَضْرِبُكُمْ', 'أَنْتُمْ', 'إِيَّاكُمْ', 'بِكُمْ', '-'] },
{ rowLabelArab: 'مفرد مؤنث مخاطبة', rowLabelIndo: 'Mukhathabah (pr) 1', cells: ['ضَرَبَكِ', 'يَضْرِبُكِ', 'أَنْتِ', 'إِيَّاكِ', 'بِكِ', '-'] },
{ rowLabelArab: 'تثنية مؤنث مخاطبة', rowLabelIndo: 'Mukhathabah (pr) 2', cells: ['ضَرَبَكُمَا', 'يَضْرِبُكُمَا', 'أَنْتُمَا', 'إِيَّاكُمَا', 'بِكُمَا', '-'] },
{ rowLabelArab: 'جمع مؤنث مخاطبة', rowLabelIndo: 'Mukhathabah (pr) 3+', cells: ['ضَرَبَكُنَّ', 'يَضْرِبُكُنَّ', 'أَنْتُنَّ', 'إِيَّاكُنَّ', 'بِكُنَّ', '-'] },
{ rowLabelArab: 'متكلم وحده', rowLabelIndo: 'Mutakallim 1', cells: ['ضَرَبَنِيْ', 'يَضْرِبُنِيْ', 'أَنَا', 'إِيَّايَ', 'بِيْ', '-'] },
{ rowLabelArab: 'متكلم مع الغير', rowLabelIndo: 'Mutakallim 2+', cells: ['ضَرَبَنَا', 'يَضْرِبُنَا', 'نَحْنُ', 'إِيَّانَا', 'بِنَا', '-'] },
],
},

// BAB 11 (Hal. 51-53 PDF - Kanan ke Kiri)
{
id: 'lg-11-isim-fail-maful',
direction: 'vertical',
kategori: "Isim Fa\'il & Maf\'ul (Atas ke Bawah)",
judulArab: 'تَصْرِيْفُ اسْمِ الْفَاعِلِ وَاسْمِ الْمَفْعُوْلِ',
judulIndo: "Isim Fa\'il & Isim Maf\'ul (Dibaca Kanan ke Kiri per Bina')",
halamanKitab: 'Hal. 51-53',
colHeadersArab: ['الوزن', 'مضاعف', 'أجوف و', 'أجوف ي', 'مثال و', 'ناقص و', 'لفيف مفروق', 'مزيد'],
colHeadersIndo: ['Wazan', "Mudha\'af", 'Ajwaf Wawi', "Ajwaf Ya\'i", 'Mitsal Wawi', 'Naqish Wawi', 'Lafif Mafruq', 'Mazid'],
rows: [
{ rowLabelArab: 'مفرد مذكر', rowLabelIndo: "Isim Fa\'il Tunggal (lk)", cells: ['فَاعِلٌ', 'مَادٌّ', 'صَائِنٌ', 'بَائِعٌ', 'وَاعِدٌ', 'غَازٍ', 'وَاقٍ', 'مُعْطٍ'] },
{ rowLabelArab: 'تثنية مذكر', rowLabelIndo: "Isim Fa\'il Ganda (lk)", cells: ['فَاعِلَانِ', 'مَادَّانِ', 'صَائِنَانِ', 'بَائِعَانِ', 'وَاعِدَانِ', 'غَازِيَانِ', 'وَاقِيَانِ', 'مُعْطِيَانِ'] },
{ rowLabelArab: 'جمع مذكر سالم', rowLabelIndo: "Isim Fa\'il Jamak (lk)", cells: ['فَاعِلُوْنَ', 'مَادُّوْنَ', 'صَائِنُوْنَ', 'بَائِعُوْنَ', 'وَاعِدُوْنَ', 'غَازُوْنَ', 'وَاقُوْنَ', 'مُعْطُوْنَ'] },
{ rowLabelArab: 'جمع تكسير', rowLabelIndo: 'Jamak Taksir (فُعَّال)', cells: ['فُعَّالٌ', 'مُدَّادٌ', 'صُوَّانٌ', 'بُيَّاعٌ', 'وُعَّادٌ', 'غُزَّاءٌ', 'وُقَّاءٌ', '-'] },
{ rowLabelArab: 'مفرد مؤنث', rowLabelIndo: "Isim Fa\'il Tunggal (pr)", cells: ['فَاعِلَةٌ', 'مَادَّةٌ', 'صَائِنَةٌ', 'بَائِعَةٌ', 'وَاعِدَةٌ', 'غَازِيَةٌ', 'وَاقِيَةٌ', 'مُعْطِيَةٌ'] },
{ rowLabelArab: 'تثنية مؤنث', rowLabelIndo: "Isim Fa\'il Ganda (pr)", cells: ['فَاعِلَتَانِ', 'مَادَّتَانِ', 'صَائِنَتَانِ', 'بَائِعَتَانِ', 'وَاعِدَتَانِ', 'غَازِيَتَانِ', 'وَاقِيَتَانِ', 'مُعْطِيَتَانِ'] },
{ rowLabelArab: 'جمع مؤنث سالم', rowLabelIndo: "Isim Fa\'il Jamak (pr)", cells: ['فَاعِلَاتٌ', 'مَادَّاتٌ', 'صَائِنَاتٌ', 'بَائِعَاتٌ', 'وَاعِدَاتٌ', 'غَازِيَاتٌ', 'وَاقِيَاتٌ', 'مُعْطِيَاتٌ'] },
{ rowLabelArab: 'اسم المفعول (مذكر)', rowLabelIndo: "Isim Maf\'ul Tunggal (lk)", cells: ['مَفْعُوْلٌ', 'مَمْدُوْدٌ', 'مَصُوْنٌ', 'مَبِيْعٌ', 'مَوْعُوْدٌ', 'مَغْزُوٌّ', 'مَوْقِيٌّ', 'مُعْطًى'] },
{ rowLabelArab: 'اسم المفعول (مؤنث)', rowLabelIndo: "Isim Maf\'ul Tunggal (pr)", cells: ['مَفْعُوْلَةٌ', 'مَمْدُوْدَةٌ', 'مَصُوْنَةٌ', 'مَبِيْعَةٌ', 'مَوْعُوْدَةٌ', 'مَغْزُوَّةٌ', 'مَوْقِيَّةٌ', 'مُعْطَاةٌ'] },
],
},

// BAB 12 (Hal. 54-55 PDF - Kanan ke Kiri)
{
id: 'lg-12-shifah-zaman-alat',
direction: 'vertical',
kategori: 'Shifah Musyabbahah & Zaman/Alat',
judulArab: 'الصِّفَةُ الْمُشَبَّهَةُ وَأَسْمَاءُ الزَّمَانِ وَالْمَكَانِ وَالْآلَةِ',
judulIndo: 'Shifah Musyabbahah, Zaman, Makan & Alat (Atas ke Bawah)',
halamanKitab: 'Hal. 54-55',
colHeadersArab: ['فَعَلٌ', 'فَعِيْلٌ', 'أَفْعَلُ (لون)', 'فَعْلَانُ', 'مَكَانٌ', 'مَكَانُ الْكَثْرَةِ', 'مِفْعَلٌ (آلة)', 'مِفْعَالٌ (آلة)'],
colHeadersIndo: ['Bagus', 'Mulia', 'Kuning', 'Haus', 'Tempat Pukul', 'Hutan Singa', 'Alat Panjang', 'Lampu'],
rows: [
{ rowLabelArab: 'مفرد مذكر', rowLabelIndo: 'Tunggal (lk)', cells: ['حَسَنٌ', 'سَرِيٌّ', 'أَصْفَرُ', 'عَطْشَانُ', 'مَضْرِبٌ', 'مَأْسَدَةٌ', 'مِمَدٌّ', 'مِصْبَاحٌ'] },
{ rowLabelArab: 'تثنية مذكر', rowLabelIndo: 'Ganda (lk)', cells: ['حَسَنَانِ', 'سَرِيَّانِ', 'أَصْفَرَانِ', 'عَطْشَانَانِ', 'مَضْرِبَانِ', 'مَأْسَدَتَانِ', 'مِمَدَّانِ', 'مِصْبَاحَانِ'] },
{ rowLabelArab: 'جمع مذكر', rowLabelIndo: 'Jamak (lk)', cells: ['حَسَنُوْنَ', 'سَرَاةٌ', 'صُفْرٌ', 'عِطَاشٌ', 'مَضَارِبُ', 'مَآسِدُ', 'مَمَادُّ', 'مَصَابِيْحُ'] },
{ rowLabelArab: 'مفرد مؤنث', rowLabelIndo: 'Tunggal (pr)', cells: ['حَسَنَةٌ', 'سَرِيَّةٌ', 'صَفْرَاءُ', 'عَطْشَى', '-', 'مَدْرَسَةٌ', 'مِدَقَّةٌ', 'مِصْفَاةٌ'] },
{ rowLabelArab: 'تثنية مؤنث', rowLabelIndo: 'Ganda (pr)', cells: ['حَسَنَتَانِ', 'سَرِيَّتَانِ', 'صَفْرَاوَانِ', 'عَطْشَيَانِ', '-', 'مَدْرَسَتَانِ', 'مِدَقَّتَانِ', 'مِصْفَاتَانِ'] },
{ rowLabelArab: 'جمع مؤنث', rowLabelIndo: 'Jamak (pr)', cells: ['حَسَنَاتٌ', 'سَرِيَّاتٌ', 'صُفْرٌ', 'عِطَاشٌ', '-', 'مَدَارِسُ', 'مَدَاقُّ', 'مَصَافٍ'] },
],
},

// BAB 13 (Hal. 56-58 PDF - Bab Muhimmah Penutup Kitab)
  {
    id: "lg-13-muhimmah-56",
    direction: "vertical",
    kategori: "Bab Muhimmah (Penutup)",
    judulArab: "مُهِمَّةٌ (١) - فَائٍ إِلَى طَوِيْلٍ",
    judulIndo: "Bab Muhimmah Bagian 1 (6 Kata Pertama)",
    halamanKitab: "Hal. 56",
    colHeadersArab: ["فَاءٍ", "رَاءٍ", "قَوِيٌّ", "ضَخْمٌ", "شُجَاعٌ", "طَوِيْلٌ"],
    colHeadersIndo: ["Yang kembali", "Yang melihat", "Yang kuat", "Yang besar", "Yang berani", "Yang panjang"],
    rows: [
      { rowLabelArab: "مفرد مذكر", rowLabelIndo: "Tunggal (lk)", cells: ["فَاءٍ", "رَاءٍ", "قَوِيٌّ", "ضَخْمٌ", "شُجَاعٌ", "طَوِيْلٌ"] },
      { rowLabelArab: "تثنية مذكر", rowLabelIndo: "Ganda (lk)", cells: ["فَائِيَانِ", "رَائِيَانِ", "قَوِيَّانِ", "ضَخْمَانِ", "شُجَاعَانِ", "طَوِيْلَانِ"] },
      { rowLabelArab: "جمع مذكر سالم", rowLabelIndo: "Jamak Salim (lk)", cells: ["فَاؤُوْنَ", "رَاؤُوْنَ", "-", "-", "شُجَاعُوْنَ", "-"] },
      { rowLabelArab: "جمع تكسير (١)", rowLabelIndo: "Jamak Taksir 1", cells: ["وَفْيَاءُ", "وَرُؤَاءُ", "أَقْوِيَاءُ", "ضِخَامٌ", "وَشُجْعَانٌ", "وَطِوَالٌ"] },
      { rowLabelArab: "جمع تكسير (٢)", rowLabelIndo: "Jamak Taksir 2", cells: ["وَفِيٌّ / وَفْيَاةٌ", "وَرُؤًى / وَرُؤَاةٌ", "-", "-", "-", "-"] },
      { rowLabelArab: "مفرد مؤنث", rowLabelIndo: "Tunggal (pr)", cells: ["فَائِيَةٌ", "رَائِيَةٌ", "قَوِيَّةٌ", "ضَخْمَةٌ", "شُجَاعَةٌ", "طَوِيْلَةٌ"] },
      { rowLabelArab: "تثنية مؤنث", rowLabelIndo: "Ganda (pr)", cells: ["فَائِيَتَانِ", "رَائِيَتَانِ", "قَوِيَّتَانِ", "ضَخْمَتَانِ", "شُجَاعَتَانِ", "طَوِيْلَتَانِ"] },
      { rowLabelArab: "جمع مؤنث سالم", rowLabelIndo: "Jamak Salim (pr)", cells: ["فَائِيَاتٌ", "رَائِيَاتٌ", "قَوِيَّاتٌ", "ضَخْمَاتٌ", "شُجَاعَاتٌ", "طَوِيْلَاتٌ"] },
      { rowLabelArab: "جمع تكسير مؤنث", rowLabelIndo: "Jamak Taksir (pr)", cells: ["وَفَوَايَا", "وَرَوَاءٍ", "وَقَوَايَا", "-", "وَشِجَاعٌ", "وَطِوَالٌ"] },
    ],
  },
  {
    id: "lg-14-muhimmah-57",
    direction: "vertical",
    kategori: "Bab Muhimmah (Penutup)",
    judulArab: "مُهِمَّةٌ (٢) - رَيَّانُ إِلَى بَرِيْءٌ",
    judulIndo: "Bab Muhimmah Bagian 2 (6 Kata Lanjutan)",
    halamanKitab: "Hal. 57",
    colHeadersArab: ["رَيَّانُ", "أَدِيْبٌ", "وَجِيْهٌ", "لَئِيْمٌ", "بَطِيْءٌ", "بَرِيْءٌ"],
    colHeadersIndo: ["Yang segar/puas", "Yang beradab", "Yang terhormat", "Yang tercela", "Yang lambat", "Yang bebas/suci"],
    rows: [
      { rowLabelArab: "مفرد مذكر", rowLabelIndo: "Tunggal (lk)", cells: ["رَيَّانُ", "أَدِيْبٌ", "وَجِيْهٌ", "لَئِيْمٌ", "بَطِيْءٌ", "بَرِيْءٌ"] },
      { rowLabelArab: "تثنية مذكر", rowLabelIndo: "Ganda (lk)", cells: ["رَيَّانَانِ", "أَدِيْبَانِ", "وَجِيْهَانِ", "لَئِيْمَانِ", "بَطِيْئَانِ", "بَرِيْئَانِ"] },
      { rowLabelArab: "جمع مذكر سالم", rowLabelIndo: "Jamak Salim (lk)", cells: ["-", "-", "-", "-", "-", "-"] },
      { rowLabelArab: "جمع تكسير", rowLabelIndo: "Jamak Taksir (lk)", cells: ["رِوَاءٌ", "أُدَبَاءُ", "وُجَهَاءُ", "لُؤَمَاءُ", "بِطَاءٌ", "بُرَآءُ"] },
      { rowLabelArab: "مفرد مؤنث", rowLabelIndo: "Tunggal (pr)", cells: ["رَيَّا", "أَدِيْبَةٌ", "وَجِيْهَةٌ", "لَئِيْمَةٌ", "بَطِيْئَةٌ", "بَرِيْئَةٌ"] },
      { rowLabelArab: "تثنية مؤنث", rowLabelIndo: "Ganda (pr)", cells: ["رَيَّانِ", "أَدِيْبَتَانِ", "وَجِيْهَتَانِ", "لَئِيْمَتَانِ", "بَطِيْئَتَانِ", "بَرِيْئَتَانِ"] },
      { rowLabelArab: "جمع مؤنث سالم", rowLabelIndo: "Jamak Salim (pr)", cells: ["-", "أَدِيْبَاتٌ", "وَجِيْهَاتٌ", "-", "بَطِيْئَاتٌ", "بَرِيْئَاتٌ"] },
      { rowLabelArab: "جمع تكسير مؤنث", rowLabelIndo: "Jamak Taksir (pr)", cells: ["وَرِوَاءٌ", "-", "-", "لِئَامٌ", "-", "وَبَرَايَا"] },
    ],
  },
  {
    id: "lg-15-muhimmah-58",
    direction: "vertical",
    kategori: "Bab Muhimmah (Penutup)",
    judulArab: "مُهِمَّةٌ (٣) - جَبَانٌ إِلَى مَيْمُوْنٌ",
    judulIndo: "Bab Muhimmah Bagian 3 (5 Kata Penutup Kitab)",
    halamanKitab: "Hal. 58",
    colHeadersArab: ["جَبَانٌ", "وَقُوْرٌ", "وَجِلٌ", "وَجٍ", "مَيْمُوْنٌ"],
    colHeadersIndo: ["Yang penakut", "Yang berwibawa", "Yang takut", "Yang lecet kaki", "Yang diberkahi"],
    rows: [
      { rowLabelArab: "مفرد مذكر", rowLabelIndo: "Tunggal (lk)", cells: ["جَبَانٌ", "وَقُوْرٌ", "وَجِلٌ", "وَجٍ", "مَيْمُوْنٌ"] },
      { rowLabelArab: "تثنية مذكر", rowLabelIndo: "Ganda (lk)", cells: ["جَبَانَانِ", "وَقُوْرَانِ", "وَجِلَانِ", "وَجِيَانِ", "مَيْمُوْنَانِ"] },
      { rowLabelArab: "جمع مذكر سالم", rowLabelIndo: "Jamak Salim (lk)", cells: ["-", "-", "وَجِلُوْنَ", "وَجُوْنَ", "مَيْمُوْنُوْنَ"] },
      { rowLabelArab: "جمع تكسير", rowLabelIndo: "Jamak Taksir (lk)", cells: ["جُبَنَاءُ", "وُقُرٌ", "-", "-", "-"] },
      { rowLabelArab: "مفرد مؤنث", rowLabelIndo: "Tunggal (pr)", cells: ["جَبَانَةٌ", "وَقُوْرٌ", "وَجِلَةٌ", "وَجِيَةٌ", "مَيْمُوْنَةٌ"] },
      { rowLabelArab: "تثنية مؤنث", rowLabelIndo: "Ganda (pr)", cells: ["جَبَانَتَانِ", "وَقُوْرَانِ", "وَجِلَتَانِ", "وَجِيَتَانِ", "مَيْمُوْنَتَانِ"] },
      { rowLabelArab: "جمع مؤنث سالم", rowLabelIndo: "Jamak Salim (pr)", cells: ["جَبَانَاتٌ", "-", "وَجِلَاتٌ", "وَجِيَاتٌ", "مَيْمُوْنَاتٌ"] },
      { rowLabelArab: "جمع تكسير مؤنث", rowLabelIndo: "Jamak Taksir (pr)", cells: ["-", "وُقُرٌ", "-", "-", "-"] },
    ],
  },
];
