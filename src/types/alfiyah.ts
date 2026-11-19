export interface AlfiyahBait {
  id: number;
  shadr: string;      // Baris pertama (صَدْر)
  ajuz: string;       // Baris kedua (عَجُز)
  terjemahan: string; // Terjemahan bahasa Indonesia
}

export interface AlfiyahBab {
  babId: string;
  judulArab: string;
  judulIndo: string;
  baitList: AlfiyahBait[];
}

export interface AlfiyahJuz {
  juz: number;
  judul: string;
  rentangBait: string;
  babList: AlfiyahBab[];
}
