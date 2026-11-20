import type { BukhariBab, DaftarBabBukhari } from '../../types/bukhari.types';
import { bukhariBagian1 } from './bagian1-ibadah-bersuci';
import { bukhariBagian2 } from './bagian2-zakat-haji-puasa';
import { bukhariBagian3 } from './bagian3-muamalah-akad-hak';
import { bukhariBagian4 } from './bagian4-jihad-sejarah-keluarga';
import { bukhariBagian5 } from './bagian5-adab-fitnah-tauhid';

export const semuaBabBukhari: BukhariBab[] = [
  ...bukhariBagian1,
  ...bukhariBagian2,
  ...bukhariBagian3,
  ...bukhariBagian4,
  ...bukhariBagian5,
];

export const daftarBabBukhari: DaftarBabBukhari[] = semuaBabBukhari.map((bab) => ({
  id: bab.id,
  slug: bab.slug,
  kitabLatin: bab.kitabLatin,
  judulArab: bab.judulArab,
  judulLatin: bab.judulLatin,
  judulIndo: bab.judulIndo,
  jumlahHadis: bab.isi.length,
}));
