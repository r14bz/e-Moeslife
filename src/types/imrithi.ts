export interface ImrithiBait {
  id: number;
  babId: string;
  shadr: string;
  ajuz: string;
  terjemah: string;
  catatan?: string;
}

export interface ImrithiBab {
  id: string;
  urutan: number;
  judulArab: string;
  judulIndo: string;
  rentangBait: [number, number];
}
