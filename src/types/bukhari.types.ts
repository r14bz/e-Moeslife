export interface BukhariHadis {
  id: number;
  noHadis?: number;
  sanadRingkas?: string;
  arab: string;
  terjemahan: string;
  catatan?: string;
}

export interface BukhariBab {
  id: number;
  slug: string;
  kitabLatin?: string;
  judulArab: string;
  judulLatin: string;
  judulIndo: string;
  ringkasan: string;
  isi: BukhariHadis[];
}

export interface DaftarBabBukhari {
  id: number;
  slug: string;
  kitabLatin?: string;
  judulArab: string;
  judulLatin: string;
  judulIndo: string;
  jumlahHadis: number;
}
