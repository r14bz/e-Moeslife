import { Capacitor } from "@capacitor/core";
import { fetchWithSwr, fetchWithTimeout } from "../services/fastCache";
import type {
  KitabViewPreferences,
  LocalBookMeta,
  NormalizedKitabChapter,
  StructuredBlock,
} from "../types/emoeslife";

// Diurutkan berjenjang & menonjolkan 10 kitab utama pada halaman awal
export const LOCAL_BOOKS: LocalBookMeta[] = [
  {
    file: "",
    slug: "aqidatul-awam",
    title: "Aqidatul Awam",
    category: "Aqidah",
    format: "aqidatul-awam",
    source: "local",
  },
  {
    file: "",
    slug: "tijan-darori",
    title: "Tijan Daruri",
    category: "Aqidah",
    format: "tijan-darori",
    source: "local",
  },
  {
    file: "",
    slug: "qathrul-ghaits",
    title: "Qathrul Ghaits",
    category: "Aqidah",
    format: "qathrul-ghaits",
    source: "local",
  },
  {
    file: "safinah-reading-library.json",
    slug: "safinah-reading-library",
    title: "Safinah An-Najah",
    category: "Fiqih",
    format: "structured",
    source: "local",
  },
  {
    file: "",
    slug: "kasyifatus-saja",
    title: "Kasyifatus Saja",
    category: "Fiqih",
    format: "turats",
    source: "local",
  },
  {
    file: "",
    slug: "bahjatul-wasail",
    title: "Bahjatul Wasa'il",
    category: "Fiqih",
    format: "turats",
    source: "local",
  },
  {
    file: "",
    slug: "qarib",
    title: "Fathul Qarib Al-Mujib",
    category: "Fiqih",
    format: "turats",
    source: "local",
  },
  {
    file: "",
    slug: "fathul-muin",
    title: "Fathul Mu’in",
    category: "Fiqih",
    format: "turats",
    source: "local",
  },
  {
    file: "",
    slug: "ajurumiyyah",
    title: "Matan Al-Ajurumiyyah",
    category: "Ilmu Alat",
    format: "jurumiyah",
    source: "local",
  },
  {
    file: "",
    slug: "alhikam",
    title: "Al-Hikam Al-Atha'iyyah",
    category: "Tasawuf",
    format: "turats",
    source: "local",
  },
  { file: "sullamut-taufiq.json", slug: "sullamut-taufiq", title: "Sullamut Taufiq", category: "Fiqih", source: "local" },
  {
    file: "",
    slug: "imriti",
    title: "Nadhom Imriti",
    category: "Ilmu Alat",
    format: "imrithi",
    source: "local",
  },
  {
    file: "",
    slug: "amtsilah-tashrifiyah",
    title: "Al-Amtsilah at-Tashrifiyah",
    category: "Ilmu Alat",
    format: "tashrif",
    source: "local",
  },
  {
    file: "",
    slug: "alfiyah",
    title: "Alfiyah Ibnu Malik",
    category: "Ilmu Alat",
    format: "alfiyah",
    source: "local",
  },
  { file: "taklim.json", slug: "taklim", title: "Ta’lim Al-Muta’allim", category: "Adab", source: "local" },
  {
    file: "",
    slug: "nashoihul",
    title: "Nashoihul Ibad",
    category: "Adab",
    format: "nashoihul-ibad",
    source: "local",
  },
  {
    file: "",
    slug: "baiquniyyah",
    title: "Mandhumah Al-Baiquniyyah",
    category: "Hadis",
    format: "baiquniyyah",
    source: "local",
  },
  { file: "arbain.json", slug: "arbain", title: "Arba’in Nawawi", category: "Hadis", source: "local" },
  { file: "bidayatul.json", slug: "bidayatul", title: "Bidayatul Hidayah", category: "Tasawuf", source: "local" },
  { file: "bulughul.json", slug: "bulughul", title: "Bulughul Maram", category: "Hadis", source: "local" },
  { file: "riyadhus.json", slug: "riyadhus", title: "Riyadhus Shalihin", category: "Hadis", source: "local" },
  { file: "izar.json", slug: "izar", title: "Fathul Izar", category: "Keluarga", source: "local" },
  { file: "uyun.json", slug: "uyun", title: "Qurrotul Uyun", category: "Keluarga", source: "local" },
  {
    file: "",
    slug: "uqudulujain",
    title: "Uqudulujain",
    category: "Keluarga",
    format: "uqudulujain",
    source: "local",
  },
  { file: "futuhul.json", slug: "futuhul", title: "Futuhul Ghaib", category: "Tasawuf", source: "local" },
  { file: "jalalain.json", slug: "jalalain", title: "Tafsir Jalalain", category: "Tafsir", source: "local" },
  { file: "muwatta.json", slug: "muwatta", title: "Muwatta Imam Malik", category: "Hadis", source: "local" },
  { file: "muslim.json", slug: "muslim", title: "Shahih Muslim", category: "Hadis", source: "local" },
  {
    file: "",
    slug: "bukhari",
    title: "Shahih Bukhari",
    category: "Hadis",
    format: "bukhari",
    source: "local",
  },
];

export const normalizeBookName = (value: string): string =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const CHUNK_TARGET_CHARS = 4000;
export const BATCH_BUDGET_CHARS = 8000;

export function chunkText(text: string, target = CHUNK_TARGET_CHARS): string[] {
  const source = String(text || "");
  if (!source) return [];
  if (source.length <= target) return [source];
  const parts = source.split(/(\n{2,})/);
  const chunks: string[] = [];
  let current = "";
  for (let i = 0; i < parts.length; i += 2) {
    const unit = parts[i] + (parts[i + 1] || "");
    if (current && current.length + unit.length > target) {
      chunks.push(current);
      current = "";
    }
    current += unit;
  }
  if (current) chunks.push(current);
  return chunks.flatMap((chunk) => {
    if (chunk.length <= target * 3) return [chunk];
    const lines = chunk.split(/(?<=\n)/);
    const pieces: string[] = [];
    let piece = "";
    for (const line of lines) {
      if (piece && piece.length + line.length > target) {
        pieces.push(piece);
        piece = "";
      }
      piece += line;
    }
    if (piece) pieces.push(piece);
    return pieces;
  });
}

export const KITAB_ARABIC_TITLES: Record<string, string> = {
  "tijan-darori": "تِيْجَانُ الدَّرَارِي",
  "qathrul-ghaits": "قَطْرُ الْغَيْثِ",
  "safinah-reading-library": "سَفِيْنَةُ النَّجَاةِ",
  "kasyifatus-saja": "كَاشِفَةُ السَّجَا",
  "bahjatul-wasail": "بَهْجَةُ الْوَسَائِلِ",
  "sullamut-taufiq": "سُلَّمُ التَّوْفِيْقِ",
  taklim: "تَعْلِيْمُ الْمُتَعَلِّمِ",
  nashoihul: "نَصَائِحُ الْعِبَادِ",
  arbain: "الْأَرْبَعُوْنَ النَّوَوِيَّةُ",
  bidayatul: "بِدَايَةُ الْهِدَايَةِ",
  qarib: "فَتْحُ الْقَرِيْبِ الْمُجِيْبِ",
  "fathul-muin": "فَتْحُ الْمُعِيْنِ",
  bulughul: "بُلُوْغُ الْمَرَامِ",
  riyadhus: "رِيَاضُ الصَّالِحِيْنَ",
  izar: "فَتْحُ الْإِزَارِ",
  uyun: "قُرَّةُ الْعُيُوْنِ",
  uqudulujain: "عُقُوْدُ اللُّجَيْنِ",
  alhikam: "اَلْحِكَمُ الْعَطَائِيَّةُ",
  futuhul: "فُتُوْحُ الْغَيْبِ",
  jalalain: "تَفْسِيْرُ الْجَلَالَيْنِ",
  muwatta: "مُوَطَّأُ الْإِمَامِ مَالِكٍ",
  muslim: "صَحِيْحُ مُسْلِمٍ",
  bukhari: "صَحِيْحُ الْبُخَارِيِّ",
};

const sanitizeText = (text: string): string =>
  String(text || "")
    .replace(/^\uFEFF/, "")
    .replace(/\u00AD/g, "")
    .replace(/\r\n?/g, "\n");

export const splitParagraphs = (text: string): string[] =>
  sanitizeText(text)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const stripHaraka = (text: string): string =>
  text.replace(/[\u064B-\u065F\u0670\u0640]/g, "").trim();

const leadingNumber = (paragraph: string): number | null => {
  const match = paragraph.match(/^\s*(?:No\.\s*Hadist:\s*)?(\d+)(?:\.\d+\/\d+)?[.)]\s/i);
  return match ? Number(match[1]) : null;
};

const isIntroHeader = (paragraph: string): boolean => {
  if (leadingNumber(paragraph) !== null) return false;
  return paragraph.length <= 120 && !/[.!?]$/.test(paragraph.trim());
};

export const isBasmalah = (paragraph: string): boolean =>
  /^بسم\s+الله\s+الرحمن\s+الرحيم$/.test(stripHaraka(paragraph));

const isArabicSectionMarker = (paragraph: string): boolean =>
  /^(?:فَصْلٌ|خَاتِمَةٌ|فصل|خاتمة)$/.test(paragraph.trim()) ||
  /^(?:فصل|خاتمة)$/.test(stripHaraka(paragraph));

export interface PairedParagraph {
  arabic: string;
  translation: string;
  heading: boolean;
}

export function pairSafinahBlocks(blocks: StructuredBlock[]): PairedParagraph[] | null {
  if (!Array.isArray(blocks) || !blocks.length) return null;
  const labelIndex = blocks.findIndex((b) => b.type === "translation-label");
  if (labelIndex < 0) return null;

  const before = blocks.slice(0, labelIndex);
  const after = blocks.slice(labelIndex + 1);
  if (
    before.some((b) => b.type !== "arabic") ||
    after.some((b) => b.type !== "translation")
  ) {
    return null;
  }

  const out: PairedParagraph[] = [];
  const contentArabic: Array<{ text: string; insertHeadingBefore?: string }> = [];
  let pendingMarker: string | undefined;

  for (const block of before) {
    const text = block.text.trim();
    if (!text) continue;
    if (isArabicSectionMarker(text)) {
      pendingMarker = text;
    } else {
      contentArabic.push({ text, insertHeadingBefore: pendingMarker });
      pendingMarker = undefined;
    }
  }

  if (!contentArabic.length || contentArabic.length !== after.length) {
    return null;
  }

  for (let i = 0; i < contentArabic.length; i += 1) {
    const arItem = contentArabic[i];
    if (arItem.insertHeadingBefore) {
      out.push({
        arabic: arItem.insertHeadingBefore,
        translation: "",
        heading: true,
      });
    }
    out.push({
      arabic: arItem.text,
      translation: after[i].text.trim(),
      heading: false,
    });
  }
  return out;
}

export function pairParagraphs(
  chapter: NormalizedKitabChapter,
  bookSlug?: string
): PairedParagraph[] | null {
  if (chapter.blocks?.length) {
    return pairSafinahBlocks(chapter.blocks);
  }
  if (chapter.latin) return null;
  const arabic = splitParagraphs(chapter.arabic);
  const translation = splitParagraphs(chapter.translation);
  if (!arabic.length || !translation.length) return null;

  if (bookSlug === "arbain") {
    const cleanedTrans =
      /^Hadits ke\s*\d+/i.test(translation[0]) && translation.length > 1
        ? translation.slice(1)
        : translation;
    return [
      {
        arabic: arabic.join("\n\n"),
        translation: cleanedTrans.join("\n\n"),
        heading: false,
      },
    ];
  }

  if (bookSlug === "alhikam" && !isBasmalah(arabic.join(" "))) {
    const cleanedTrans =
      /^Al-Hikam Pasal\s*\d+/i.test(translation[0]) && translation.length > 1
        ? translation.slice(1)
        : translation;
    return [
      {
        arabic: arabic.join("\n\n"),
        translation: cleanedTrans.join("\n\n"),
        heading: false,
      },
    ];
  }

  if (arabic.length < 2 || translation.length < 2) return null;

  // Peel up to 3 short non-numbered header paragraphs at the top of translation (e.g., "Hadits Shahih Muslim", "Kitab Iman", Surah name)
  let headerCount = 0;
  while (
    headerCount < 3 &&
    headerCount < translation.length - 1 &&
    isIntroHeader(translation[headerCount])
  ) {
    headerCount += 1;
  }

  const headers = translation.slice(0, headerCount);
  const transBody = translation.slice(headerCount);

  // Case 1: Arabic has a leading Basmalah and transBody matches the remaining verses (e.g. Tafsir Jalalain)
  if (
    arabic.length === transBody.length + 1 &&
    isBasmalah(arabic[0]) &&
    transBody.some((p) => leadingNumber(p) !== null)
  ) {
    const out: PairedParagraph[] = [
      {
        arabic: arabic[0],
        translation: headers.join(" · ") || "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
        heading: true,
      },
    ];
    for (let i = 0; i < transBody.length; i += 1) {
      out.push({
        arabic: arabic[i + 1],
        translation: transBody[i],
        heading: false,
      });
    }
    return out;
  }

  // Case 2: Equal counts after peeling headers (e.g. Shahih Muslim where 54/56 books have 2 intro header lines)
  if (arabic.length === transBody.length && arabic.length >= 2) {
    const hasNumbering = transBody.some((p) => leadingNumber(p) !== null);
    if (hasNumbering) {
      const out: PairedParagraph[] = [];
      if (headers.length > 0) {
        out.push({
          arabic: "",
          translation: headers.join(" · "),
          heading: true,
        });
      }
      for (let i = 0; i < arabic.length; i += 1) {
        out.push({
          arabic: arabic[i],
          translation: transBody[i],
          heading: false,
        });
      }
      return out;
    }
  }

  // Case 3: Direct 1..N numbering on equal length arrays
  if (arabic.length === translation.length) {
    const direct = translation.every((paragraph, index) => leadingNumber(paragraph) === index + 1);
    const withHeading =
      leadingNumber(translation[0]) === null &&
      translation.slice(1).every((paragraph, index) => leadingNumber(paragraph) === index + 1);
    if (direct || withHeading) {
      return arabic.map((paragraph, index) => ({
        arabic: paragraph,
        translation: translation[index],
        heading: withHeading && index === 0,
      }));
    }
  }

  // Case 4: Equal-length paragraph pairing for structured prose kitabs (e.g. Sullamut Taufiq)
  if (
    bookSlug === "sullamut-taufiq" &&
    arabic.length === translation.length &&
    !isBasmalah(arabic[0])
  ) {
    return arabic.map((paragraph, index) => {
      const plain = stripHaraka(paragraph);
      const isHeading =
        paragraph.length <= 90 &&
        /^(?:باب|فصل|خاتمة|قاعدة)\b/.test(plain);
      return {
        arabic: paragraph,
        translation: translation[index],
        heading: isHeading,
      };
    });
  }

  return null;
}

export type KitabChapterViewMode = "fold" | "classic" | "both" | "arabic" | "translation";

export const VIEW_LABELS: Record<KitabChapterViewMode, string> = {
  fold: "Lipat terjemah",
  classic: "Seperti semula",
  both: "Keduanya",
  arabic: "Arab saja",
  translation: "Terjemah saja",
};

export function resolveView(
  chapter: NormalizedKitabChapter,
  prefs: KitabViewPreferences = {},
  bookSlug?: string
): { options: KitabChapterViewMode[]; view: KitabChapterViewMode } {
  if (pairParagraphs(chapter, bookSlug)) {
    return {
      options: ["fold", "classic"],
      view: prefs.paired === "classic" ? "classic" : "fold",
    };
  }
  if (chapter.arabic && chapter.translation) {
    const unpairedOptions: KitabChapterViewMode[] = ["both", "arabic", "translation"];
    return {
      options: unpairedOptions,
      view: prefs.unpaired && ["both", "arabic", "translation"].includes(prefs.unpaired) ? prefs.unpaired : "both",
    };
  }
  return { options: [], view: "both" };
}

export type ChapterQueueItem =
  | {
      kind: "pair";
      heading: boolean;
      arabic: string;
      translation: string;
      size: number;
      first: boolean;
      last: boolean;
    }
  | {
      kind: "arabic" | "latin" | "translation";
      chunk: string;
      first: boolean;
      last: boolean;
    };

export function buildChapterQueue(
  chapter: NormalizedKitabChapter,
  view: KitabChapterViewMode = "both",
  bookSlug?: string
): ChapterQueueItem[] {
  const pairs = view === "fold" ? pairParagraphs(chapter, bookSlug) : null;
  if (pairs) {
    return pairs.map((pair, index) => ({
      kind: "pair",
      heading: pair.heading,
      arabic: pair.arabic,
      translation: pair.translation,
      size: pair.arabic.length + 120,
      first: index === 0,
      last: index === pairs.length - 1,
    }));
  }
  const queue: ChapterQueueItem[] = [];
  const entries: Array<["arabic" | "latin" | "translation", string]> = [
    ["arabic", chapter.arabic],
    ["latin", chapter.latin],
    ["translation", chapter.translation],
  ];
  entries
    .filter(([kind]) => (view === "arabic" ? kind !== "translation" : view === "translation" ? kind === "translation" : true))
    .forEach(([kind, text]) => {
      const chunks = chunkText(text);
      chunks.forEach((chunk, index) =>
        queue.push({ kind, chunk, first: index === 0, last: index === chunks.length - 1 })
      );
    });
  return queue;
}

export function planBatch(queue: ChapterQueueItem[], budget = BATCH_BUDGET_CHARS): number {
  let count = 0;
  let used = 0;
  const sizeOf = (item: ChapterQueueItem) => (item.kind === "pair" ? item.size : item.chunk.length);
  while (count < queue.length && (count === 0 || used + sizeOf(queue[count]) <= budget)) {
    used += sizeOf(queue[count]);
    count += 1;
  }
  return count;
}

const VIEW_PREF_KEY = "e-moeslife:kitab-view:v1";

export function readKitabViewPrefs(): KitabViewPreferences {
  try {
    return (JSON.parse(localStorage.getItem(VIEW_PREF_KEY) || "{}") || {}) as KitabViewPreferences;
  } catch {
    return {};
  }
}

export function writeKitabViewPref(name: "paired" | "unpaired", value: string): void {
  try {
    localStorage.setItem(VIEW_PREF_KEY, JSON.stringify({ ...readKitabViewPrefs(), [name]: value }));
  } catch {
    // ignore storage errors
  }
}

export const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const ARABIC_KEYS = [
  "arabic",
  "arab",
  "teks_arab",
  "teksArab",
  "teks_arabic",
  "arabic_text",
  "arabicText",
  "arab_text",
  "isi_arab",
  "naskah_arab",
  "matan",
  "text_ar",
];
const LATIN_KEYS = ["latin", "teks_latin", "transliterasi"];
const TRANSLATION_KEYS = [
  "translation",
  "terjemahan",
  "teks_indonesia",
  "teksIndonesia",
  "indonesia",
  "terjemah",
  "arti",
  "makna",
  "content",
  "isi",
  "konten",
  "text_id",
];
const TITLE_KEYS = ["title", "judul", "nama_bab", "judul_bab", "nama", "name", "bab", "chapter"];

export function arrayAt(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  for (const key of [
    "chapters",
    "bab",
    "daftar_bab",
    "sections",
    "items",
    "contents",
    "data",
    "list",
    "hadis",
    "hadiths",
    "tafsir",
  ]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  for (const child of Object.values(record)) {
    if (child && typeof child === "object" && !Array.isArray(child)) {
      const nested = arrayAt(child);
      if (nested.length) return nested;
    }
  }
  return [];
}

const asText = (value: unknown): string =>
  typeof value === "string" ? value : typeof value === "number" ? String(value) : "";

function findField(item: unknown, keys: string[], depth = 0): string {
  if (!item || typeof item !== "object" || depth > 3) return "";
  const record = item as Record<string, unknown>;
  for (const key of keys) {
    const value = asText(record[key]);
    if (value.trim()) return value;
  }
  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      const found = findField(value, keys, depth + 1);
      if (found.trim()) return found;
    }
  }
  return "";
}

export function normalizeChapter(item: unknown, index: number): NormalizedKitabChapter {
  if (typeof item === "string") {
    return {
      title: `Bagian ${index + 1}`,
      arabic: ARABIC_REGEX.test(item) ? item : "",
      translation: ARABIC_REGEX.test(item) ? "" : item,
      latin: "",
    };
  }
  const title = sanitizeText(findField(item, TITLE_KEYS)).trim() || `Bagian ${index + 1}`;
  let arabic = sanitizeText(findField(item, ARABIC_KEYS)).trim();
  const latin = sanitizeText(findField(item, LATIN_KEYS)).trim();
  let translation = sanitizeText(findField(item, TRANSLATION_KEYS)).trim();
  if (!arabic || !translation) {
    const generic = sanitizeText(findField(item, ["text", "teks", "body", "paragraph"])).trim();
    if (generic) {
      if (ARABIC_REGEX.test(generic) && !arabic) arabic = generic;
      else if (!translation) translation = generic;
    }
  }
  if (arabic && !ARABIC_REGEX.test(arabic)) {
    if (!translation) translation = arabic;
    arabic = "";
  }
  const idVal = typeof (item as Record<string, unknown>)?.id === "string" ? String((item as Record<string, unknown>).id) : undefined;
  return { id: idVal, title, arabic, latin, translation };
}

export function parseStructuredSafinah(documentData: {
  chapters?: Array<{
    number?: string;
    title?: string;
    sections?: Array<{ title?: string; blocks?: StructuredBlock[] }>;
  }>;
}): NormalizedKitabChapter[] {
  if (!Array.isArray(documentData.chapters) || !documentData.chapters.length) {
    throw new Error("Struktur BAB Safinah belum dikenali.");
  }
  const chapters = documentData.chapters.flatMap((bab, babIndex) =>
    (Array.isArray(bab.sections) ? bab.sections : []).map((section, sectionIndex) => ({
      title: section.title || `Bagian ${sectionIndex + 1}`,
      chapterTitle: bab.title || `BAB ${babIndex + 1}`,
      chapterNumber: bab.number || String(babIndex + 1),
      blocks: Array.isArray(section.blocks) ? section.blocks : [],
      arabic: "",
      latin: "",
      translation: "",
    }))
  );
  if (!chapters.length) throw new Error("Naskah Safinah belum memiliki bagian bacaan.");
  return chapters;
}

export function firstText(item: unknown, keys: string[], fallback = ""): string {
  const usable = (value: unknown): string => {
    if (typeof value === "string" || typeof value === "number") return String(value).trim();
    if (Array.isArray(value)) return value.map((part) => usable(part)).filter(Boolean).join("\n");
    return "";
  };
  const record = item as Record<string, unknown> | null;
  for (const key of keys) {
    const value = usable(record?.[key]);
    if (value) return value;
  }
  const visit = (value: unknown, depth = 0): string => {
    if (!value || typeof value !== "object" || depth > 4) return "";
    const obj = value as Record<string, unknown>;
    for (const key of keys) {
      const found = usable(obj[key]);
      if (found) return found;
    }
    for (const child of Object.values(obj)) {
      const found = visit(child, depth + 1);
      if (found) return found;
    }
    return "";
  };
  return visit(item) || fallback;
}

export function pickKitabArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  if (!value || typeof value !== "object") return [];
  const obj = value as Record<string, unknown>;
  for (const key of [
    "kitab",
    "kitabs",
    "daftar_kitab",
    "books",
    "items",
    "results",
    "bab",
    "daftar_bab",
    "chapters",
    "data",
    "list",
  ]) {
    if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
  }
  return [];
}

function unwrapPayload(value: unknown): unknown {
  let current = value;
  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    const obj = current as Record<string, unknown>;
    const next = obj.data ?? obj.result ?? obj.response;
    if (!next || next === current) break;
    current = next;
  }
  return current;
}

export async function kitabApiRequest(params: Record<string, string>): Promise<unknown> {
  const query = new URLSearchParams(params);
  const sortedKey = Array.from(query.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  return fetchWithSwr({
    key: `kitab-api:${sortedKey}`,
    freshTtlMs: 24 * 60 * 60 * 1000,
    staleTtlMs: 7 * 24 * 60 * 60 * 1000,
    fetcher: async () => {
      const endpoint = Capacitor.isNativePlatform()
        ? "https://e-moeslife.vercel.app/api/kitab"
        : "/api/kitab";
      const response = await fetchWithTimeout(
        `${endpoint}?${query.toString()}`,
        {
          headers: { Accept: "application/json" },
        },
        12000
      );
      const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok || json.status === "error" || json.success === false) {
        throw new Error(
          String(json.message || json.detail || `Layanan kitab belum dapat diakses (${response.status}).`)
        );
      }
      return unwrapPayload(json);
    },
  });
}
