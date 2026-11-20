export interface UqudulujainItem {
  id: number;
  noRef?: number | string;
  sanadRingkas?: string;
  arab: string;
  terjemahan: string;
  catatan?: string;
}

export interface UqudulujainBab {
  id: number;
  slug: string;
  judulArab?: string;
  judulIndo: string;
  ringkasan?: string;
  isi: UqudulujainItem[];
}

export interface DaftarBabUqudulujain {
  id: number;
  slug: string;
  judulArab?: string;
  judulIndo: string;
  jumlahItem: number;
}
