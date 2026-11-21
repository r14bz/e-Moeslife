import type { ClassicSection } from "../data/sections";

export type ThemeMode = "light" | "dark";
export type ColorThemeId = "emerald" | "sapphire" | "teal" | "maroon" | "sepia";
export type FontSizeScale = "small" | "normal" | "large";
export type CollectionKind = "tahlil" | "yasin" | "rahman" | "dzikir";
export type QuranStudioTab = "quran" | "dzikir" | "doa" | "tahlil" | "tafsir";

export type AppRoute =
  | { view: "home" }
  | { view: "bacaan-hub" }
  | { view: "classic"; sectionIndex?: number; collection?: CollectionKind }
  | { view: "quran-studio"; tab: QuranStudioTab; surahNumber?: number; ayatNumber?: number; doaTitle?: string }
  | { view: "wudhu-shalat"; tab?: "wudhu" | "shalat" }
  | { view: "kitab-hub" }
  | { view: "local-kitab"; slug: string; chapterIndex?: number }
  | { view: "tashrif-kitab"; tab?: "istilahi" | "lughawi" }
  | { view: "alfiyah-kitab"; juz?: number; babIndex?: number }
  | { view: "imrithi-kitab"; babId?: string }
  | { view: "jurumiyah-kitab"; babId?: number }
  | { view: "aqidatul-awam-kitab"; babId?: string }
  | { view: "baiquniyyah-kitab"; babId?: string }
  | { view: "nashoihul-kitab"; babId?: string }
  | { view: "bukhari-kitab"; babId?: number }
  | { view: "uqudulujain-kitab"; babId?: number }
  | {
      view: "turats-kitab";
      slug: "qarib" | "fathul-muin" | "kasyifatus-saja" | "bahjatul-wasail" | "alhikam";
      babIndex?: number;
    }
  | { view: "qathrul-ghaits-kitab"; lembaranIndex?: number }
  | { view: "tijan-darori-kitab"; babId?: string }
  | { view: "api-kitab"; slug: string; title: string }
  | { view: "nearby-mosques" }
  | { view: "qibla" }
  | { view: "ecode-halal"; initialQuery?: string }
  | { view: "download" };

export interface ClassicPage extends ClassicSection {
  sectionIndex: number;
  continuation: boolean;
}

export interface PrayerLocation {
  provinsi: string;
  kabkota: string;
  label: string;
  timezone: string;
  zone: "WIB" | "WITA" | "WIT";
  manual?: boolean;
  detected?: boolean;
}

export interface DailyPrayerSchedule {
  tanggal: string | number;
  subuh: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  terbit?: string;
  imsak?: string;
  dhuha?: string;
  [key: string]: string | number | undefined;
}

export type SkyScene = "night" | "dawn" | "sunrise" | "day" | "afternoon" | "sunset";

export interface LocalBookMeta {
  file: string;
  slug: string;
  title: string;
  category: string;
  format?:
    | "structured"
    | "tashrif"
    | "alfiyah"
    | "imrithi"
    | "jurumiyah"
    | "aqidatul-awam"
    | "baiquniyyah"
    | "nashoihul-ibad"
    | "bukhari"
    | "uqudulujain"
    | "turats"
    | "qathrul-ghaits"
    | "tijan-darori";
  source: "local" | "api";
}

export interface StructuredBlock {
  type: "arabic" | "translation" | "translation-label" | "mixed";
  text: string;
}

export interface NormalizedKitabChapter {
  id?: string;
  title: string;
  arabic: string;
  latin: string;
  translation: string;
  chapterTitle?: string;
  chapterNumber?: string;
  blocks?: StructuredBlock[];
}

export interface KitabViewPreferences {
  paired?: "fold" | "classic";
  unpaired?: "both" | "arabic" | "translation";
}

export interface EQuranDoaItem {
  id?: number;
  nama?: string;
  grup?: string;
  ar?: string;
  tr?: string;
  idn?: string;
  tentang?: string;
  tag?: string[];
}

export interface EQuranSurahSummary {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
}

export interface EQuranAyat {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
}

export interface EQuranSurahDetail extends EQuranSurahSummary {
  audioFull?: Record<string, string>;
  ayat: EQuranAyat[];
}

export interface EQuranTafsirDetail {
  nomor: number;
  namaLatin: string;
  tafsir: Array<{ ayat?: number; teks?: string; tafsir?: string }>;
}
