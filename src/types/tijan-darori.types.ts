export type KategoriAqidah = 
  | 'muqaddimah'
  | 'wajib-allah'
  | 'mustahil-allah'
  | 'jaiz-allah'
  | 'wajib-rasul'
  | 'mustahil-rasul'
  | 'jaiz-rasul'
  | 'khatimah';

export type KelompokSifatWajib = 
  | 'Sifat Nafsiyah'
  | 'Sifat Salbiyah'
  | 'Sifat Ma’ani'
  | 'Sifat Ma’nawiyah';

export interface TijanItem {
  id: string;
  urutan: number;
  kategori: KategoriAqidah;
  kelompokSifat?: KelompokSifatWajib;
  judul: string;
  judulArab?: string;
  matanArab: string;      // 100% Verbatim Matan Al-Bajuri
  terjemahMatan: string;  // Terjemahan literal matan
  syarahArab?: string;    // Kutipan Syarah Syekh Nawawi al-Bantani
  penjelasanSyarah: string;
  lawanSifat?: string;
}

export interface TijanBab {
  id: string;
  nomorBab: number;
  judulBab: string;
  judulBabArab: string;
  deskripsiSingkat: string;
  items: TijanItem[];
}
