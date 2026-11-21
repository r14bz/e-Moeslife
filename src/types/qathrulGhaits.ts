export interface ParagrafQathrulGhaits {
  id: string;
  nomor: number;
  arab: string;
  arti: string;
}

export interface LembaranQathrulGhaits {
  id: string;
  nomorLembaran: number;
  judulArab: string;
  judulLatin: string;
  dropdownLabel: string;
  paragraf: ParagrafQathrulGhaits[];
}

export interface KitabQathrulGhaits {
  id: string;
  judulArab: string;
  judulLatin: string;
  kategori: string;
  pengarang: string;
  totalLembaran: number;
  daftarLembaran: LembaranQathrulGhaits[];
}
