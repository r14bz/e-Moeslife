import { TijanBab } from '../../types/tijan-darori.types';
import { babMuqaddimah } from './01-muqaddimah';
import { babSifatWajibAllah } from './02-sifat-wajib-allah';
import { babSifatMustahilJaizAllah } from './03-sifat-mustahil-jaiz-allah';
import { babSifatRasul } from './04-sifat-rasul';
import { babKhatimahNasab } from './05-khatimah-nasab';

export const tijanDaroriData: TijanBab[] = [
  babMuqaddimah,
  babSifatWajibAllah,
  babSifatMustahilJaizAllah,
  babSifatRasul,
  babKhatimahNasab,
];

export * from '../../types/tijan-darori.types';
