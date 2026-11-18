export interface IlalEntry {
  asal: string;
  bina: string;
  kaidah: string;
  penjelasan: string;
}

export const ILAL_DICTIONARY: Record<string, IlalEntry> = {
  // 1. BINA\' MUDHA\'AF (IDGHAM)
  'مَدَّ': {
    asal: 'مَدَدَ',
    bina: "Mudha\'af Tsulatsi",
    kaidah: 'Idgham Wajib',
    penjelasan: 'Asalnya مَدَدَ. Huruf dal pertama disukunkan lalu diidghamkan (dimasukkan) ke dal kedua karena dua huruf sejenis bertemu dalam satu kata.'
  },
  'يَمُدُّ': {
    asal: 'يَمْدُدُ',
    bina: "Mudha\'af Tsulatsi",
    kaidah: 'Naql & Idgham',
    penjelasan: 'Asalnya يَمْدُدُ. Harakat dhammah pada dal pertama dipindah ke mim (يَمُدْدُ), lalu dua dal diidghamkan.'
  },
  'مُدَّ': {
    asal: 'اُمْدُدْ',
    bina: "Mudha\'af Tsulatsi",
    kaidah: 'Naql, Hadzf Hamzah & Idgham',
    penjelasan: 'Asalnya اُمْدُدْ. Dhammah dal dipindah ke mim, hamzah washal dibuang karena mim sudah berharakat, lalu dal pertama diidghamkan.'
  },
  'فَرَّ': {
    asal: 'فَرَرَ',
    bina: "Mudha\'af Tsulatsi",
    kaidah: 'Idgham Wajib',
    penjelasan: 'Asalnya فَرَرَ. Huruf ra pertama disukunkan lalu diidghamkan ke ra kedua.'
  },
  'يَفِرُّ': {
    asal: 'يَفْرِرُ',
    bina: "Mudha\'af Tsulatsi",
    kaidah: 'Naql & Idgham',
    penjelasan: 'Asalnya يَفْرِرُ. Harakat kasrah ra pertama dipindah ke fa, lalu dua ra diidghamkan.'
  },
  'عَضَّ': {
    asal: 'عَضِضَ',
    bina: "Mudha\'af Tsulatsi (Bab 4)",
    kaidah: 'Iskan & Idgham',
    penjelasan: 'Asalnya عَضِضَ. Huruf dhad pertama disukunkan lalu diidghamkan ke dhad kedua.'
  },
  'اِمْتَدَّ': {
    asal: 'اِمْتَدَدَ',
    bina: "Mudha\'af Mazid (Ifta\'ala)",
    kaidah: 'Idgham Wajib',
    penjelasan: 'Asalnya اِمْتَدَدَ. Huruf dal pertama disukunkan lalu diidghamkan ke dal kedua.'
  },
  'اِحْمَرَّ': {
    asal: 'اِحْمَرَرَ',
    bina: "Mudha\'af Mazid (If\'alla)",
    kaidah: 'Idgham Wajib',
    penjelasan: 'Asalnya اِحْمَرَرَ. Huruf ra pertama disukunkan lalu diidghamkan ke ra kedua.'
  },

  // 2. BINA\' AJWAF (QALB, ISKAN & HADZF)
  'صَانَ': {
    asal: 'صَوَنَ',
    bina: 'Ajwaf Wawi',
    kaidah: 'Qalb (Wawu menjadi Alif)',
    penjelasan: 'Asalnya صَوَنَ. Huruf wawu berharakat jatuh setelah huruf berharakat fathah, maka wawu diganti menjadi alif.'
  },
  'يَصُوْنُ': {
    asal: 'يَصْوُنُ',
    bina: 'Ajwaf Wawi',
    kaidah: 'Iskan / Naql Harakat',
    penjelasan: 'Asalnya يَصْوُنُ. Harakat dhammah pada wawu dipindah ke huruf shad yang sukun demi meringankan bacaan.'
  },
  'صُنْ': {
    asal: 'اُصْوُنْ',
    bina: 'Ajwaf Wawi',
    kaidah: 'Naql & Hadzf (Iltiqa Sakinain)',
    penjelasan: 'Asalnya اُصْوُنْ. Dhammah wawu dipindah ke shad, hamzah washal dibuang, lalu wawu dibuang karena bertemu dua sukun (wawu dan nun).'
  },
  'صُنْتُ': {
    asal: 'صَوَنْتُ',
    bina: 'Ajwaf Wawi',
    kaidah: 'Qalb, Hadzf & Dhammah Fa Fi\'il',
    penjelasan: 'Asalnya صَوَنْتُ -> صَانْتُ. Alif dibuang karena bertemu sukun nun, lalu shad didhammahkan sebagai petunjuk bahwa huruf yang dibuang adalah wawu.'
  },
  'صُنَّ': {
    asal: 'صَوَنْنَ',
    bina: 'Ajwaf Wawi',
    kaidah: 'Hadzf & Idgham Nun',
    penjelasan: 'Asalnya صَوَنْنَ. Wawu dibuang karena bertemu sukun dan shad didhammahkan, lalu dua nun diidghamkan.'
  },
  'صِيْنَ': {
    asal: 'صُوِنَ',
    bina: 'Ajwaf Wawi (Majhul)',
    kaidah: 'Naql & Qalb (Wawu menjadi Ya)',
    penjelasan: 'Asalnya صُوِنَ. Kasrah wawu dipindah ke shad sehingga wawu sukun jatuh setelah kasrah, maka wawu diganti ya.'
  },
  'بَاعَ': {
    asal: 'بَيَعَ',
    bina: "Ajwaf Ya\'i",
    kaidah: 'Qalb (Ya menjadi Alif)',
    penjelasan: 'Asalnya بَيَعَ. Huruf ya berharakat jatuh setelah fathah, maka ya diganti menjadi alif.'
  },
  'يَبِيْعُ': {
    asal: 'يَبْيِعُ',
    bina: "Ajwaf Ya\'i",
    kaidah: 'Naql Harakat',
    penjelasan: 'Asalnya يَبْيِعُ. Harakat kasrah pada ya dipindah ke huruf ba yang sukun.'
  },
  'بِعْ': {
    asal: 'اِبْيِعْ',
    bina: "Ajwaf Ya\'i",
    kaidah: 'Naql & Hadzf (Iltiqa Sakinain)',
    penjelasan: 'Asalnya اِبْيِعْ. Kasrah ya dipindah ke ba, hamzah washal dibuang, lalu ya dibuang karena bertemu dua sukun.'
  },
  'بِعْتُ': {
    asal: 'بَيَعْتُ',
    bina: "Ajwaf Ya\'i",
    kaidah: 'Qalb, Hadzf & Kasrah Fa Fi\'il',
    penjelasan: 'Asalnya بَيَعْتُ -> بَاعْتُ. Alif dibuang karena bertemu sukun ain, lalu ba dikasrahkan sebagai petunjuk huruf ya yang dibuang.'
  },
  'بِيْعَ': {
    asal: 'بُيِعَ',
    bina: "Ajwaf Ya\'i (Majhul)",
    kaidah: 'Naql Harakat',
    penjelasan: 'Asalnya بُيِعَ. Harakat kasrah pada ya dipindah ke ba setelah dhammahnya dibuang.'
  },
  'سَارَ': {
    asal: 'سَيَرَ',
    bina: "Ajwaf Ya\'i",
    kaidah: 'Qalb (Ya menjadi Alif)',
    penjelasan: 'Asalnya سَيَرَ. Huruf ya berharakat jatuh setelah fathah, maka diganti alif.'
  },
  'سِرْ': {
    asal: 'اِسْيِرْ',
    bina: "Ajwaf Ya\'i",
    kaidah: 'Naql & Hadzf',
    penjelasan: 'Asalnya اِسْيِرْ. Kasrah ya dipindah ke sin, hamzah washal dibuang, dan ya dibuang karena bertemu dua sukun.'
  },
  'خَافَ': {
    asal: 'خَوِفَ',
    bina: 'Ajwaf Wawi (Bab 4)',
    kaidah: 'Qalb (Wawu menjadi Alif)',
    penjelasan: 'Asalnya خَوِفَ. Wawu berharakat jatuh setelah fathah, maka diganti alif.'
  },
  'يَخَافُ': {
    asal: 'يَخْوَفُ',
    bina: 'Ajwaf Wawi (Bab 4)',
    kaidah: 'Naql & Qalb',
    penjelasan: 'Asalnya يَخْوَفُ. Fathah wawu dipindah ke kha (يَخَوْفُ), lalu wawu diganti alif karena berharakat pada asalnya dan jatuh setelah fathah.'
  },
  'خَفْ': {
    asal: 'اِخْوَفْ',
    bina: 'Ajwaf Wawi (Bab 4)',
    kaidah: 'Naql, Qalb & Hadzf',
    penjelasan: 'Asalnya اِخْوَفْ -> خَافْ. Alif dibuang karena bertemu fa sukun sehingga menjadi خَفْ.'
  },
  'خِفْتُ': {
    asal: 'خَوِفْتُ',
    bina: 'Ajwaf Wawi (Bab 4)',
    kaidah: 'Hadzf & Kasrah Fa Fi\'il',
    penjelasan: 'Asalnya خَوِفْتُ. Alif/wawu dibuang karena bertemu sukun, dan kha dikasrahkan sebagai petunjuk harakat kasrah asli ain fi\'il.'
  },
  'طَالَ': {
    asal: 'طَوُلَ',
    bina: 'Ajwaf Wawi (Bab 5)',
    kaidah: 'Qalb (Wawu menjadi Alif)',
    penjelasan: 'Asalnya طَوُلَ. Wawu berharakat jatuh setelah fathah, maka diganti alif.'
  },
  'طُلْتُ': {
    asal: 'طَوُلْتُ',
    bina: 'Ajwaf Wawi (Bab 5)',
    kaidah: 'Hadzf & Dhammah Fa Fi\'il',
    penjelasan: 'Asalnya طَوُلْتُ. Wawu dibuang karena bertemu sukun, dan tha didhammahkan sesuai harakat asli ain fi\'il.'
  },
  'أَجَابَ': {
    asal: 'أَجْوَبَ',
    bina: 'Ajwaf Mazid (Af\'ala)',
    kaidah: 'Naql & Qalb',
    penjelasan: 'Asalnya أَجْوَبَ. Fathah wawu dipindah ke jim yang sukun, lalu wawu diganti alif.'
  },
  'اِخْتَارَ': {
    asal: 'اِخْتَيَرَ',
    bina: 'Ajwaf Mazid (Ifta\'ala)',
    kaidah: 'Qalb (Ya menjadi Alif)',
    penjelasan: 'Asalnya اِخْتَيَرَ. Huruf ya berharakat jatuh setelah fathah, maka diganti alif.'
  },
  'اِنْقَادَ': {
    asal: 'اِنْقَوَدَ',
    bina: 'Ajwaf Mazid (Infa\'ala)',
    kaidah: 'Qalb (Wawu menjadi Alif)',
    penjelasan: 'Asalnya اِنْقَوَدَ. Wawu berharakat jatuh setelah fathah, maka diganti alif.'
  },

  // 3. BINA\' MITSAL (HADZF & IBDAL)
  'يَعِدُ': {
    asal: 'يَوْعِدُ',
    bina: 'Mitsal Wawi',
    kaidah: 'Hadzf Wawu',
    penjelasan: 'Asalnya يَوْعِدُ. Huruf wawu dibuang karena terjepit di antara huruf mudhara\'ah berharakat fathah dan ain fi\'il berharakat kasrah.'
  },
  'عِدْ': {
    asal: 'اِوْعِدْ',
    bina: 'Mitsal Wawi',
    kaidah: 'Hadzf Wawu & Hamzah Washal',
    penjelasan: 'Asalnya اِوْعِدْ. Wawu dibuang mengikuti mudhari\'-nya (يَعِدُ), lalu hamzah washal dibuang karena ain fi\'il sudah berharakat.'
  },
  'يَضَعُ': {
    asal: 'يَوْضَعُ',
    bina: 'Mitsal Wawi (Bab 3)',
    kaidah: 'Hadzf Wawu',
    penjelasan: 'Asalnya يَوْضَعُ. Wawu dibuang karena asalnya kasrah (يَوْضِعُ) lalu difathahkan karena huruf halaq (ع).'
  },
  'ضَعْ': {
    asal: 'اِوْضَعْ',
    bina: 'Mitsal Wawi (Bab 3)',
    kaidah: 'Hadzf Wawu & Hamzah Washal',
    penjelasan: 'Asalnya اِوْضَعْ. Wawu dibuang mengikuti mudhari\'-nya (يَضَعُ), lalu hamzah washal dibuang.'
  },
  'اِتَّصَلَ': {
    asal: 'اِوْتَصَلَ',
    bina: 'Mitsal Mazid (Ifta\'ala)',
    kaidah: 'Ibdal Wawu menjadi Ta & Idgham',
    penjelasan: 'Asalnya اِوْتَصَلَ. Huruf wawu sukun jatuh sebelum ta ifti\'al, maka wawu diganti ta lalu diidghamkan ke ta kedua.'
  },
  'اِتَّقَى': {
    asal: 'اِوْتَقَى',
    bina: 'Lafif Mafruq Mazid (Ifta\'ala)',
    kaidah: 'Ibdal & Qalb',
    penjelasan: 'Asalnya اِوْتَقَيَ. Wawu diganti ta dan diidghamkan, sedangkan ya di akhir diganti alif layyinah.'
  },

  // 4. BINA\' NAQISH & LAFIF
  'غَزَا': {
    asal: 'غَزَوَ',
    bina: 'Naqish Wawi',
    kaidah: 'Qalb (Wawu menjadi Alif)',
    penjelasan: 'Asalnya غَزَوَ. Huruf wawu berharakat di akhir kata jatuh setelah fathah, maka diganti menjadi alif.'
  },
  'يَغْزُوْ': {
    asal: 'يَغْزُوُ',
    bina: 'Naqish Wawi',
    kaidah: 'Iskan (Dhammah Berat)',
    penjelasan: 'Asalnya يَغْزُوُ. Harakat dhammah pada wawu di akhir kata dibuang karena terasa berat diucapkan.'
  },
  'اُغْزُ': {
    asal: 'اُغْزُوْ',
    bina: 'Naqish Wawi',
    kaidah: 'Hadzf Huruf Illat',
    penjelasan: 'Asalnya اُغْزُوْ. Fi\'il amr mabni dengan membuang huruf illat (wawu) di akhir kata.'
  },
  'غَازٍ': {
    asal: 'غَازِوٌ',
    bina: 'Naqish Wawi (Isim Fa\'il)',
    kaidah: 'Qalb, Iskan & Hadzf Ya',
    penjelasan: 'Asalnya غَازِوٌ -> غَازِيٌ -> غَازِيْن. Wawu diganti ya karena jatuh setelah kasrah, dhammahnya dibuang, lalu ya dibuang karena bertemu tanwin sukun.'
  },
  'رَمَى': {
    asal: 'رَمَيَ',
    bina: "Naqish Ya\'i",
    kaidah: 'Qalb (Ya menjadi Alif)',
    penjelasan: 'Asalnya رَمَيَ. Huruf ya berharakat jatuh setelah fathah di akhir kata, maka diganti alif layyinah.'
  },
  'يَرْمِيْ': {
    asal: 'يَرْمِيُ',
    bina: "Naqish Ya\'i",
    kaidah: 'Iskan (Dhammah Berat)',
    penjelasan: 'Asalnya يَرْمِيُ. Harakat dhammah pada ya di akhir kata dibuang karena berat diucapkan.'
  },
  'اِرْمِ': {
    asal: 'اِرْمِيْ',
    bina: "Naqish Ya\'i",
    kaidah: 'Hadzf Huruf Illat',
penjelasan: 'Asalnya اِرْمِيْ. Huruf illat ya dibuang sebagai tanda bina\' fi\'il amr.'
},
'قِ': {
asal: 'اِوْقِيْ',
bina: 'Lafif Mafruq',
kaidah: 'Hadzf Awal & Akhir',
penjelasan: 'Asalnya اِوْقِيْ. Wawu di awal dibuang mengikuti mudhari\' (يَقِيْ), hamzah washal dibuang, dan ya di akhir dibuang sebagai tanda amr sehingga tersisa satu huruf (قِ).'
},
'رَضِيَ': {
asal: 'رَضِوَ',
bina: 'Naqish Wawi (Bab 4)',
kaidah: 'Qalb (Wawu menjadi Ya)',
penjelasan: 'Asalnya رَضِوَ. Wawu di akhir kata jatuh setelah harakat kasrah, maka wawu diganti menjadi ya.'
},
'يَرْضَى': {
asal: 'يَرْضَوُ',
bina: 'Naqish Wawi (Bab 4)',
kaidah: 'Qalb (Wawu menjadi Alif)',
penjelasan: 'Asalnya يَرْضَوُ. Wawu berharakat jatuh setelah fathah di akhir kata, maka diganti alif layyinah.'
},
'مَغْزُوٌّ': {
asal: 'مَغْزُوْوٌ',
bina: 'Naqish Wawi (Isim Maf\'ul)',
kaidah: 'Idgham Dua Wawu',
penjelasan: 'Asalnya مَغْزُوْوٌ. Wawu maf\'ul bertemu dengan wawu lam fi\'il, maka keduanya diidghamkan.'
},
'مَرْمِيٌّ': {
asal: 'مَرْمُوْيٌ',
bina: "Naqish Ya\'i (Isim Maf\'ul)",
kaidah: 'Qalb & Idgham',
penjelasan: 'Asalnya مَرْمُوْيٌ. Wawu maf\'ul dan ya berkumpul dalam satu kata dan huruf pertamanya sukun, maka wawu diganti ya lalu diidghamkan.'
},
// 5. BINA\' MAHMUZ
'آمَنَ': {
asal: 'أَأْمَنَ',
bina: 'Mahmuz Fa Mazid (Af\'ala)',
kaidah: 'Ibdal Hamzah menjadi Alif',
penjelasan: 'Asalnya أَأْمَنَ. Dua hamzah bertemu di awal kata dan yang kedua sukun, maka hamzah kedua diganti alif mad.'
},
'إِيْمَانًا': {
asal: 'إِئْمَانًا',
bina: 'Mahmuz Fa (Mashdar)',
kaidah: 'Ibdal Hamzah menjadi Ya',
penjelasan: 'Asalnya إِئْمَانًا. Hamzah kedua sukun jatuh setelah hamzah kasrah, maka diganti menjadi ya.'
},
'اِيْجَلْ': {
asal: 'اِوْجَلْ',
bina: 'Mitsal Wawi (Bab 4)',
kaidah: 'Ibdal Wawu menjadi Ya',
penjelasan: 'Asalnya اِوْجَلْ. Huruf wawu sukun jatuh setelah hamzah washal berharakat kasrah, maka wawu diganti menjadi ya.'
}
};

// Fungsi pencarian cerdas yang mencocokkan teks persis maupun tanpa harakat tambahan
export function findIlalNote(arabWord: string): IlalEntry | null {
if (!arabWord) return null;
const cleaned = arabWord.trim();
if (ILAL_DICTIONARY[cleaned]) {
return ILAL_DICTIONARY[cleaned];
}
// Jika sel berisi dua kata (misal: "لَا تَصُنْ"), cek kata kedua
const parts = cleaned.split(/\s+/);
for (const part of parts) {
if (ILAL_DICTIONARY[part]) {
return ILAL_DICTIONARY[part];
}
}
return null;
}
