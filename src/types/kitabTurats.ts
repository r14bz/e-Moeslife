export interface ParagrafKitab {
  id: string;
  nomor: number;
  arab: string;
  arti: string;
}

export interface LembaranKitab {
  id: string;
  nomorLembaran: number;
  judulArab: string;
  judulLatin: string;
  dropdownLabel: string;
  paragraf: ParagrafKitab[];
}

export interface BabKitab {
  id: string;
  nomorBab: number;
  judulArab: string;
  judulLatin: string;
  rentangHalaman: string;
  paragraf: ParagrafKitab[];
}

export interface DataKitabTurats {
  id: string;
  judulArab: string;
  judulLatin: string;
  kategori: string;
  pengarang: string;
  totalLembaran: number;
  daftarLembaran: LembaranKitab[];
  daftarBab?: BabKitab[];
}
