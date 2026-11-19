export interface PoinPerkara {
  nomor?: number;
  arab: string;
  latin?: string;
  arti: string;
  penjelasan?: string;
}

export interface MaqalahItem {
  id: string;
  nomorMaqalah: number;
  sumber?: string;
  arabUtama: string;
  latinUtama?: string;
  terjemahUtama: string;
  poinPerkara?: PoinPerkara[];
  syarah?: string;
}

export interface BabNashoihulIbad {
  id: string;
  nomorBab: number;
  judulArab: string;
  judulLatin: string;
  judulIndonesia: string;
  deskripsiSingkat?: string;
  daftarMaqalah: MaqalahItem[];
}
