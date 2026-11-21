import type { DataKitabTurats } from '../../types/kitabTurats';
import { fqHal_001_050 } from './hal_001_050';
import { fqHal_051_100 } from './hal_051_100';
import { fqHal_101_150 } from './hal_101_150';
import { fqHal_151_200 } from './hal_151_200';
import { fqHal_201_250 } from './hal_201_250';
import { fqHal_251_300 } from './hal_251_300';
import { fqHal_301_350 } from './hal_301_350';
import { fqHal_351_384 } from './hal_351_384';

export const kitabFathulQarib: DataKitabTurats = {
  id: 'fathul-qarib',
  judulArab: 'فَتْحُ الْقَرِيْبِ الْمُجِيْبِ فِي شَرْحِ أَلْفَاظِ التَّقْرِيْبِ',
  judulLatin: 'Fathul Qarib Al-Mujib',
  kategori: "Fikih Syafi'i",
  pengarang: 'Ibnu Qasim Al-Ghazi',
  totalLembaran: 384,
  daftarLembaran: [
  ...fqHal_001_050,
  ...fqHal_051_100,
  ...fqHal_101_150,
  ...fqHal_151_200,
  ...fqHal_201_250,
  ...fqHal_251_300,
  ...fqHal_301_350,
  ...fqHal_351_384,
  ],
};
