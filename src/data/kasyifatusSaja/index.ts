import type { DataKitabTurats } from '../../types/kitabTurats';
import { ksHal_001_050 } from './hal_001_050';
import { ksHal_051_100 } from './hal_051_100';
import { ksHal_101_150 } from './hal_101_150';
import { ksHal_151_200 } from './hal_151_200';
import { ksHal_201_250 } from './hal_201_250';
import { ksHal_251_300 } from './hal_251_300';
import { ksHal_301_350 } from './hal_301_350';
import { ksHal_351_400 } from './hal_351_400';
import { ksHal_401_450 } from './hal_401_450';
import { ksHal_451_460 } from './hal_451_460';

export const kitabKasyifatusSaja: DataKitabTurats = {
  id: 'kasyifatus-saja',
  judulArab: 'كَاشِفَةُ السَّجَا عَلَى سَفِيْنَةِ النَّجَا',
  judulLatin: "Kasyifatus Saja",
  kategori: "Fikih Syafi'i",
  pengarang: "Syekh Nawawi Al-Bantani",
  totalLembaran: 460,
  daftarLembaran: [
  ...ksHal_001_050,
  ...ksHal_051_100,
  ...ksHal_101_150,
  ...ksHal_151_200,
  ...ksHal_201_250,
  ...ksHal_251_300,
  ...ksHal_301_350,
  ...ksHal_351_400,
  ...ksHal_401_450,
  ...ksHal_451_460,
  ],
};
