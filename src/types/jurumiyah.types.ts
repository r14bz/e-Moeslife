export interface JurumiyahParagraf {
  id: number;
  arab: string;
  terjemahan: string;
  catatan?: string;
}

export interface JurumiyahBab {
  id: number;
  slug: string;
  judulArab: string;
  judulLatin: string;
  judulIndo: string;
  ringkasan?: string;
  isi: JurumiyahParagraf[];
}

export interface DaftarBabJurumiyah {
  id: number;
  slug: string;
  judulArab: string;
  judulLatin: string;
  judulIndo: string;
  jumlahParagraf: number;
}
