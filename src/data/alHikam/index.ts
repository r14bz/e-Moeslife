import type { DataKitabTurats } from '../../types/kitabTurats';
import { hkHal_001_050 } from './hal_001_050';
import { hkHal_051_100 } from './hal_051_100';
import { hkHal_101_150 } from './hal_101_150';
import { hkHal_151_200 } from './hal_151_200';
import { hkHal_201_250 } from './hal_201_250';
import { hkHal_251_275 } from './hal_251_275';

export const kitabAlHikam: DataKitabTurats = {
  id: 'al-hikam',
  judulArab: 'الْحِكَمُ الْعَطَائِيَّةُ',
  judulLatin: "Al-Hikam Al-Atha'iyyah",
  kategori: "Tasawuf",
  pengarang: "Syekh Ibnu Atha'illah As-Sakandari",
  totalLembaran: 275,
  daftarLembaran: [
  ...hkHal_001_050,
  ...hkHal_051_100,
  ...hkHal_101_150,
  ...hkHal_151_200,
  ...hkHal_201_250,
  ...hkHal_251_275,
  ],
};
