import type {
  UqudulujainBab,
  DaftarBabUqudulujain,
} from '../../types/uqudulujain.types';
import { uqudulujainBagian1 } from './bagian1-hak-suami-istri';
import { uqudulujainBagian2 } from './bagian2-adab-keluarga';
import { uqudulujainBagian3 } from './bagian3-keutamaan-dan-doa';
import { uqudulujainBagian4 } from './bagian4-hak-anak-dan-musyawarah';
import { uqudulujainBagian5 } from './bagian5-syukur-dan-rahasia';
import { uqudulujainBagian6 } from './bagian6-adab-luar-rumah-dan-berhias';
import { uqudulujainBagian7 } from './bagian7-silaturahmi-dan-berkah';
import { uqudulujainBagian8 } from './bagian8-bakti-dan-istiqamah';
import { uqudulujainBagian9 } from './bagian9-keharmonisan-dan-khatimah';
import { uqudulujainBagian10 } from './bagian10-adab-rumah-tangga-lanjutan';
import { uqudulujainBagian11 } from './bagian11-adab-keluarga-dan-khatimah';
import { uqudulujainBagian12 } from './bagian12-adab-keluarga';
import { uqudulujainBagian13 } from './bagian13-adab-keluarga';
import { uqudulujainBagian14 } from './bagian14-adab-keluarga';
import { uqudulujainBagian15 } from './bagian15-adab-keluarga';
import { uqudulujainBagian16 } from './bagian16-adab-keluarga';
import { uqudulujainBagian17 } from './bagian17-adab-keluarga';
import { uqudulujainBagian18 } from './bagian18-adab-keluarga';
import { uqudulujainBagian19 } from './bagian19-adab-keluarga';
import { uqudulujainBagian20 } from './bagian20-khatimah-dan-doa';
import { uqudulujainBagian21 } from './bagian21-remaja-finansial-teladan';
import { uqudulujainBagian22 } from './bagian22-penutup-paripurna';

export const semuaBabUqudulujain: UqudulujainBab[] = [
  ...uqudulujainBagian1,
  ...uqudulujainBagian2,
  ...uqudulujainBagian3,
  ...uqudulujainBagian4,
  ...uqudulujainBagian5,
  ...uqudulujainBagian6,
  ...uqudulujainBagian7,
  ...uqudulujainBagian8,
  ...uqudulujainBagian9,
  ...uqudulujainBagian10,
  ...uqudulujainBagian11,
  ...uqudulujainBagian12,
  ...uqudulujainBagian13,
  ...uqudulujainBagian14,
  ...uqudulujainBagian15,
  ...uqudulujainBagian16,
  ...uqudulujainBagian17,
  ...uqudulujainBagian18,
  ...uqudulujainBagian19,
  ...uqudulujainBagian20,
  ...uqudulujainBagian21,
  ...uqudulujainBagian22,
];

export const daftarBabUqudulujain: DaftarBabUqudulujain[] =
  semuaBabUqudulujain.map((bab) => ({
    id: bab.id,
    slug: bab.slug,
    judulArab: bab.judulArab,
    judulIndo: bab.judulIndo,
    jumlahItem: bab.isi.length,
  }));
