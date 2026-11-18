export type CellTuple = [arab: string, arti: string];

export interface TashrifRowData {
  isWazan?: boolean;
  items: CellTuple[];
}

export interface TashrifBabData {
  id: string;
  kategori:
    | 'Tsulatsi Mujarrad'
    | 'Tsulatsi Mazid'
    | 'Rubai Mujarrad'
    | 'Rubai Mazid'
    | 'Mulhaq Rubai Mujarrad'
    | 'Mulhaq Rubai Mazid';
  judulArab: string;
  judulIndo: string;
  hasIsimAlat: boolean;
  rows: TashrifRowData[];
}

export const COLS_12: string[] = [
  "Fi'il Madhi", "Fi'il Mudhari'", "Mashdar", "Mashdar Mim",
  "Dhomir Munfashil", "Isim Fa'il", "Isim Isyarah", "Isim Maf'ul",
  "Fi'il Amr", "Fi'il Nahi", "Isim Zaman & Makan", "Isim Alat"
];

export const COLS_11: string[] = [
  "Fi'il Madhi", "Fi'il Mudhari'", "Mashdar", "Mashdar Mim",
  "Dhomir Munfashil", "Isim Fa'il", "Isim Isyarah", "Isim Maf'ul",
  "Fi'il Amr", "Fi'il Nahi", "Isim Zaman & Makan"
];
