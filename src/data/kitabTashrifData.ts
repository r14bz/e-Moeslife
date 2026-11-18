import type { TashrifBabData } from '../types/tashrif';
import { BAB_1_DATA } from './bab1Data';
import { TSULATSI_MUJARRAD_2_TO_6 } from './tsulatsiMujarrad2to6';
import {
RUBAI_MUJARRAD_DATA,
RUBAI_MAZID_BAB_1,
RUBAI_MAZID_BAB_2,
RUBAI_MAZID_BAB_3
} from './rubaiData';
import { MULHAQ_RUBAI_MUJARRAD_DATA } from './mulhaqRubaiMujarradData';
import { TSULATSI_MAZID_DATA } from './tsulatsiMazidData';
import {
MULHAQ_TADAHRAJA_DATA,
MULHAQ_IHRANJAMA_DATA
} from './mulhaqRubaiMazidData';
export const KITAB_TASHRIF_DATA: TashrifBabData[] = [
BAB_1_DATA,
...TSULATSI_MUJARRAD_2_TO_6,
...RUBAI_MUJARRAD_DATA,
...MULHAQ_RUBAI_MUJARRAD_DATA,
...TSULATSI_MAZID_DATA,
RUBAI_MAZID_BAB_1,
...MULHAQ_TADAHRAJA_DATA,
RUBAI_MAZID_BAB_2,
...MULHAQ_IHRANJAMA_DATA,
RUBAI_MAZID_BAB_3
];
