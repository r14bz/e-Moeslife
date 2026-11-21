import type { DataKitabTurats } from '../../types/kitabTurats';
import { fmHal_001_050 } from './hal_001_050';
import { fmHal_051_100 } from './hal_051_100';
import { fmHal_101_150 } from './hal_101_150';
import { fmHal_151_200 } from './hal_151_200';
import { fmHal_201_250 } from './hal_201_250';
import { fmHal_251_300 } from './hal_251_300';
import { fmHal_301_350 } from './hal_301_350';
import { fmHal_351_400 } from './hal_351_400';
import { fmHal_401_450 } from './hal_401_450';
import { fmHal_451_500 } from './hal_451_500';
import { fmHal_501_550 } from './hal_501_550';
import { fmHal_551_600 } from './hal_551_600';
import { fmHal_601_650 } from './hal_601_650';
import { fmHal_651_700 } from './hal_651_700';
import { fmHal_701_750 } from './hal_701_750';
import { fmHal_751_800 } from './hal_751_800';
import { fmHal_801_830 } from './hal_801_830';

export const kitabFathulMuin: DataKitabTurats = {
  id: 'fathul-muin',
  judulArab: 'فَتْحُ الْمُعِيْنِ بِشَرْحِ قُرَّةِ الْعَيْنِ بِمُهِمَّاتِ الدِّيْنِ',
  judulLatin: "Fathul Mu’in",
  kategori: "Fikih Syafi'i",
  pengarang: 'Syaikh Zainuddin Al-Malibari',
  totalLembaran: 830,
  daftarLembaran: [
  ...fmHal_001_050,
  ...fmHal_051_100,
  ...fmHal_101_150,
  ...fmHal_151_200,
  ...fmHal_201_250,
  ...fmHal_251_300,
  ...fmHal_301_350,
  ...fmHal_351_400,
  ...fmHal_401_450,
  ...fmHal_451_500,
  ...fmHal_501_550,
  ...fmHal_551_600,
  ...fmHal_601_650,
  ...fmHal_651_700,
  ...fmHal_701_750,
  ...fmHal_751_800,
  ...fmHal_801_830,
  ],
};
