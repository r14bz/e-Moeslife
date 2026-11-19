// src/data/jurumiyah/index.ts

import type { JurumiyahBab, DaftarBabJurumiyah } from '../../types/jurumiyah.types';
import { jurumiyahBagian1A } from './bagian1a-kalam-irab';
import { jurumiyahBagian1B } from './bagian1b-afal';
import { jurumiyahBagian2A } from './bagian2a-marfuat';
import { jurumiyahBagian2B } from './bagian2b-awamil-tawabi';
import { jurumiyahBagian3A } from './bagian3a-taukid-manshubat';
import { jurumiyahBagian3B } from './bagian3b-mashdar-zharaf-hal-tamyiz';
import { jurumiyahBagian4A } from './bagian4a-istitsna-la-munada';
import { jurumiyahBagian4B } from './bagian4b-maful-makhfudhat';

export const semuaBabJurumiyah: JurumiyahBab[] = [
  ...jurumiyahBagian1A,
  ...jurumiyahBagian1B,
  ...jurumiyahBagian2A,
  ...jurumiyahBagian2B,
  ...jurumiyahBagian3A,
  ...jurumiyahBagian3B,
  ...jurumiyahBagian4A,
  ...jurumiyahBagian4B,
];

export const daftarBabJurumiyah: DaftarBabJurumiyah[] = semuaBabJurumiyah.map((bab) => ({
  id: bab.id,
  slug: bab.slug,
  judulArab: bab.judulArab,
  judulLatin: bab.judulLatin,
  judulIndo: bab.judulIndo,
  jumlahParagraf: bab.isi.length,
}));
