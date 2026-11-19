export interface NadhomBait {
  id: number;
  babId: string;
  shadr: string;
  ajuz: string;
  terjemah: string;
  catatan?: string;
  syarah?: string;
}

export interface NadhomBab {
  id: string;
  urutan: number;
  judulArab: string;
  judulIndo: string;
  rentangBait: [number, number];
}
