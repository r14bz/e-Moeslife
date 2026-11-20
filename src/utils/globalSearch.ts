import type { ClassicSection } from "../data/sections";
import type { EQuranDoaItem, EQuranSurahSummary, LocalBookMeta } from "../types/emoeslife";
import type { GuideStep, ShalatIntention } from "../data/wudhuShalatGuide";
import { arrayAt, normalizeChapter, parseStructuredSafinah } from "./kitabEngine";

export interface KitabSearchMatch {
  book: LocalBookMeta;
  chapterIndex: number;
  chapterTitle: string;
  snippet: string;
  matchedIn: "title" | "chapter" | "content";
}

export interface QuranSearchMatch {
  surahNumber: number;
  surahName: string;
  ayatNumber?: number;
  arabicName?: string;
  subtitle: string;
  snippet?: string;
}

export interface DoaSearchMatch {
  item: EQuranDoaItem;
  snippet: string;
}

export interface GuideSearchMatch {
  tab: "wudhu" | "shalat";
  title: string;
  subtitle: string;
  snippet: string;
}

export interface ClassicSearchMatch {
  sectionIndex: number;
  title: string;
  collection?: string;
  snippet: string;
}

export interface GlobalSearchResults {
  kitab: KitabSearchMatch[];
  quran: QuranSearchMatch[];
  doa: DoaSearchMatch[];
  guide: GuideSearchMatch[];
  classic: ClassicSearchMatch[];
  heavyBooksSearched: boolean;
  searching: boolean;
  searchingHeavy: boolean;
}

interface IndexedChapter {
  title: string;
  searchText: string;
  displayText: string;
}

const HEAVY_SLUGS = new Set(["bulughul", "muwatta", "jalalain", "muslim", "riyadhus"]);

// Module-level caches for instant repeated searches
const kitabChapterCache: Record<string, IndexedChapter[]> = {};
let surahListCache: EQuranSurahSummary[] | null = null;
let apiDoaCache: EQuranDoaItem[] | null = null;
let curatedDoaCache: EQuranDoaItem[] | null = null;
let guideDataCache: {
  wudhuSteps: GuideStep[];
  shalatIntentions: ShalatIntention[];
  shalatSteps: GuideStep[];
} | null = null;

async function getCuratedPrayers(): Promise<EQuranDoaItem[]> {
  if (curatedDoaCache) return curatedDoaCache;
  const { CURATED_DAILY_PRAYERS } = await import("../data/dailyPrayers");
  curatedDoaCache = CURATED_DAILY_PRAYERS;
  return curatedDoaCache;
}

async function getGuideData() {
  if (guideDataCache) return guideDataCache;
  const { WUDHU_STEPS, SHALAT_INTENTIONS, SHALAT_STEPS } = await import("../data/wudhuShalatGuide");
  guideDataCache = {
    wudhuSteps: WUDHU_STEPS,
    shalatIntentions: SHALAT_INTENTIONS,
    shalatSteps: SHALAT_STEPS,
  };
  return guideDataCache;
}

function buildSnippet(text: string, query: string, maxLen = 130): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const lower = clean.toLocaleLowerCase("id");
  const idx = lower.indexOf(query.toLocaleLowerCase("id"));
  if (idx < 0) return clean.slice(0, maxLen) + (clean.length > maxLen ? "…" : "");
  const start = Math.max(0, idx - 38);
  const end = Math.min(clean.length, idx + query.length + 78);
  return `${start > 0 ? "…" : ""}${clean.slice(start, end)}${end < clean.length ? "…" : ""}`;
}

async function getBookChapters(book: LocalBookMeta, signal?: AbortSignal): Promise<IndexedChapter[]> {
  if (kitabChapterCache[book.slug]) return kitabChapterCache[book.slug];

  if (book.format === "tashrif") {
    const [{ KITAB_TASHRIF_DATA }, { TASHRIF_LUGHAWI_DATA }] = await Promise.all([
      import("../data/kitabTashrifData"),
      import("../data/tashrifLughawiData"),
    ]);
    const istilahiChapters: IndexedChapter[] = KITAB_TASHRIF_DATA.map((bab) => {
      const words = bab.rows
        .flatMap((row) => row.items.map(([arab, arti]) => `${arab} ${arti}`))
        .join(" ");
      const title = `Istilahi · ${bab.judulIndo}`;
      const displayText = `${bab.kategori} · ${bab.judulArab} · ${words}`;
      return {
        title,
        displayText,
        searchText: `${title} ${bab.kategori} ${bab.judulArab} ${words}`.toLocaleLowerCase("id"),
      };
    });
    const lughawiChapters: IndexedChapter[] = TASHRIF_LUGHAWI_DATA.map((bab) => {
      const cells = bab.rows
        .flatMap((row) => [row.rowLabelIndo, row.rowLabelArab, ...row.cells])
        .join(" ");
      const title = `Lughawi · ${bab.judulIndo}`;
      const displayText = `${bab.halamanKitab} · ${bab.judulArab} · ${cells}`;
      return {
        title,
        displayText,
        searchText: `${title} ${bab.halamanKitab} ${bab.judulArab} ${cells}`.toLocaleLowerCase("id"),
      };
    });
    const indexed = [...istilahiChapters, ...lughawiChapters];
    kitabChapterCache[book.slug] = indexed;
    return indexed;
  }

  if (book.format === "alfiyah") {
    const { ALFIYAH_DATA } = await import("../data/alfiyah");
    const indexed: IndexedChapter[] = ALFIYAH_DATA.flatMap((juz) =>
      juz.babList.map((bab) => {
        const baitsText = bab.baitList
          .map((bait) => `${bait.shadr} ${bait.ajuz} ${bait.terjemahan}`)
          .join(" ");
        const title = `${bab.judulIndo}`;
        const displayText = `${juz.judul} · ${bab.judulArab} · ${baitsText}`;
        return {
          title,
          displayText,
          searchText: `${title} ${juz.judul} ${bab.judulArab} ${baitsText}`.toLocaleLowerCase("id"),
        };
      })
    );
    kitabChapterCache[book.slug] = indexed;
    return indexed;
  }

  if (book.format === "imrithi") {
    const { allImrithiBaits, imrithiBabs } = await import("../data/imrithi");
    const indexed: IndexedChapter[] = imrithiBabs.map((bab) => {
      const baitsText = allImrithiBaits
        .filter((bait) => bait.babId === bab.id)
        .map((bait) => `${bait.shadr} ${bait.ajuz} ${bait.terjemah} ${bait.catatan || ""}`)
        .join(" ");
      const title = `${bab.urutan}. ${bab.judulIndo}`;
      const displayText = `${bab.judulArab} · ${baitsText}`;
      return {
        title,
        displayText,
        searchText: `${title} ${bab.judulArab} ${baitsText}`.toLocaleLowerCase("id"),
      };
    });
    kitabChapterCache[book.slug] = indexed;
    return indexed;
  }

  if (book.format === "jurumiyah") {
    const { semuaBabJurumiyah } = await import("../data/jurumiyah");
    const indexed: IndexedChapter[] = semuaBabJurumiyah.map((bab) => {
      const matanText = bab.isi
        .map((item) => `${item.arab} ${item.terjemahan} ${item.catatan || ""}`)
        .join(" ");
      const title = `${bab.id}. ${bab.judulIndo}`;
      const displayText = `${bab.judulArab} · ${bab.judulLatin} · ${bab.ringkasan || ""} · ${matanText}`;
      return {
        title,
        displayText,
        searchText: `${title} ${bab.judulArab} ${bab.judulLatin} ${bab.ringkasan || ""} ${matanText}`.toLocaleLowerCase("id"),
      };
    });
    kitabChapterCache[book.slug] = indexed;
    return indexed;
  }

  if (book.format === "aqidatul-awam") {
    const { aqidatulAwamBabs, aqidatulAwamBaits } = await import("../data/aqidatulAwam");
    const indexed: IndexedChapter[] = aqidatulAwamBabs.map((bab) => {
      const baitsText = aqidatulAwamBaits
        .filter((bait) => bait.babId === bab.id)
        .map((bait) => `${bait.shadr} ${bait.ajuz} ${bait.terjemah} ${bait.syarah || ""}`)
        .join(" ");
      const title = `${bab.urutan}. ${bab.judulIndo}`;
      const displayText = `${bab.judulArab} · ${baitsText}`;
      return {
        title,
        displayText,
        searchText: `${title} ${bab.judulArab} ${baitsText}`.toLocaleLowerCase("id"),
      };
    });
    kitabChapterCache[book.slug] = indexed;
    return indexed;
  }

  if (book.format === "baiquniyyah") {
    const { baiquniyyahBabs, baiquniyyahBaits } = await import("../data/baiquniyyah");
    const indexed: IndexedChapter[] = baiquniyyahBabs.map((bab) => {
      const baitsText = baiquniyyahBaits
        .filter((bait) => bait.babId === bab.id)
        .map((bait) => `${bait.shadr} ${bait.ajuz} ${bait.terjemah} ${bait.catatan || ""}`)
        .join(" ");
      const title = `${bab.urutan}. ${bab.judulIndo}`;
      const displayText = `${bab.judulArab} · ${baitsText}`;
      return {
        title,
        displayText,
        searchText: `${title} ${bab.judulArab} ${baitsText}`.toLocaleLowerCase("id"),
      };
    });
    kitabChapterCache[book.slug] = indexed;
    return indexed;
  }

  if (book.format === "nashoihul-ibad") {
    const { kitabNashoihulIbad } = await import("../data/nashoihul-ibad");
    const indexed: IndexedChapter[] = kitabNashoihulIbad.map((bab) => {
      const maqalahText = bab.daftarMaqalah
        .map((m) => {
          const poinText = (m.poinPerkara || [])
            .map((p) => `${p.arab} ${p.latin || ""} ${p.arti} ${p.penjelasan || ""}`)
            .join(" ");
          return `${m.sumber || ""} ${m.arabUtama} ${m.latinUtama || ""} ${m.terjemahUtama} ${poinText} ${m.syarah || ""}`;
        })
        .join(" ");
      const title = bab.judulIndonesia;
      const displayText = `${bab.judulArab} · ${bab.judulLatin} · ${bab.deskripsiSingkat || ""} · ${maqalahText}`;
      return {
        title,
        displayText,
        searchText: `${title} ${bab.judulArab} ${bab.judulLatin} ${bab.deskripsiSingkat || ""} ${maqalahText}`.toLocaleLowerCase("id"),
      };
    });
    kitabChapterCache[book.slug] = indexed;
    return indexed;
  }

  if (book.format === "bukhari") {
    const { semuaBabBukhari } = await import("../data/bukhari");
    const indexed: IndexedChapter[] = semuaBabBukhari.map((bab) => {
      const hadisText = bab.isi
        .map((item) => `${item.sanadRingkas || ""} ${item.arab} ${item.terjemahan} ${item.catatan || ""}`)
        .join(" ");
      const title = `${bab.id}. ${bab.judulIndo || bab.judulLatin || bab.kitabLatin || `Bab ${bab.id}`}`;
      const displayText = `${bab.judulArab} · ${bab.judulLatin} · ${bab.ringkasan || ""} · ${hadisText}`;
      return {
        title,
        displayText,
        searchText: `${title} ${bab.judulArab} ${bab.judulLatin} ${bab.ringkasan || ""} ${hadisText}`.toLocaleLowerCase("id"),
      };
    });
    kitabChapterCache[book.slug] = indexed;
    return indexed;
  }

  if (book.format === "uqudulujain") {
    const { semuaBabUqudulujain } = await import("../data/uqudulujain");
    const indexed: IndexedChapter[] = semuaBabUqudulujain.map((bab) => {
      const itemsText = bab.isi
        .map((item) => `${item.sanadRingkas || ""} ${item.arab} ${item.terjemahan} ${item.catatan || ""}`)
        .join(" ");
      const title = `${bab.id}. ${bab.judulIndo}`;
      const displayText = `${bab.judulArab || ""} · ${bab.ringkasan || ""} · ${itemsText}`;
      return {
        title,
        displayText,
        searchText: `${title} ${bab.judulArab || ""} ${bab.ringkasan || ""} ${itemsText}`.toLocaleLowerCase("id"),
      };
    });
    kitabChapterCache[book.slug] = indexed;
    return indexed;
  }

  if (book.source !== "local" || !book.file) return [];

  const res = await fetch(`/data/${book.file}`, { signal });
  if (!res.ok) return [];
  const doc = await res.json();

  let indexed: IndexedChapter[] = [];
  if (book.format === "structured") {
    const parsed = parseStructuredSafinah(doc);
    indexed = parsed.map((ch) => {
      const blocksText = (ch.blocks || []).map((b) => b.text || "").join(" ");
      const title = ch.chapterTitle ? `${ch.chapterTitle} — ${ch.title}` : ch.title;
      const displayText = blocksText || title;
      return {
        title,
        displayText,
        searchText: `${title} ${displayText}`.toLocaleLowerCase("id"),
      };
    });
  } else {
    const raw = arrayAt(doc);
    indexed = raw.map((item, idx) => {
      const ch = normalizeChapter(item, idx);
      const displayText = [ch.translation, ch.latin, ch.arabic].filter(Boolean).join(" ");
      return {
        title: ch.title,
        displayText,
        searchText: `${ch.title} ${displayText}`.toLocaleLowerCase("id"),
      };
    });
  }

  kitabChapterCache[book.slug] = indexed;
  return indexed;
}

async function getSurahList(signal?: AbortSignal): Promise<EQuranSurahSummary[]> {
  if (surahListCache) return surahListCache;
  const res = await fetch("https://equran.id/api/v2/surat", { signal });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: EQuranSurahSummary[] };
  const list = Array.isArray(json.data) ? json.data : [];
  surahListCache = list;
  return list;
}

async function getAllDoaItems(signal?: AbortSignal): Promise<EQuranDoaItem[]> {
  if (apiDoaCache) return apiDoaCache;
  const curated = await getCuratedPrayers();
  try {
    const res = await fetch("https://equran.id/api/doa", { signal });
    if (!res.ok) return curated;
    const json = (await res.json()) as { data?: EQuranDoaItem[] } | EQuranDoaItem[];
    const arr = Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : [];
    const seen = new Set(curated.map((d) => (d.nama || "").toLocaleLowerCase("id")));
    const merged = [
      ...curated,
      ...arr.filter((item) => item.nama && !seen.has(item.nama.toLocaleLowerCase("id"))),
    ];
    apiDoaCache = merged;
    return merged;
  } catch {
    return curated;
  }
}

function searchGuideData(
  data: {
    wudhuSteps: GuideStep[];
    shalatIntentions: ShalatIntention[];
    shalatSteps: GuideStep[];
  },
  q: string
): GuideSearchMatch[] {
  const guide: GuideSearchMatch[] = [];
  for (const step of data.wudhuSteps) {
    const hay = `${step.title} ${step.badge} ${step.summary} ${step.latin || ""} ${step.translation || ""}`.toLocaleLowerCase("id");
    if (hay.includes(q)) {
      guide.push({
        tab: "wudhu",
        title: `Wudhu · ${step.title}`,
        subtitle: step.badge,
        snippet: buildSnippet(step.translation || step.summary, q),
      });
    }
  }
  for (const intent of data.shalatIntentions) {
    const hay = `${intent.name} ${intent.rakaat} ${intent.latin} ${intent.translation}`.toLocaleLowerCase("id");
    if (hay.includes(q)) {
      guide.push({
        tab: "shalat",
        title: `Niat ${intent.name}`,
        subtitle: intent.rakaat,
        snippet: buildSnippet(intent.translation, q),
      });
    }
  }
  for (const step of data.shalatSteps) {
    const hay = `${step.title} ${step.badge} ${step.summary} ${step.latin || ""} ${step.translation || ""}`.toLocaleLowerCase("id");
    if (hay.includes(q)) {
      guide.push({
        tab: "shalat",
        title: `Shalat · ${step.title}`,
        subtitle: step.badge,
        snippet: buildSnippet(step.translation || step.summary, q),
      });
    }
  }
  return guide.slice(0, 5);
}

export function runInstantGlobalSearch({
  query,
  sections,
  books,
}: {
  query: string;
  sections: ClassicSection[];
  books: LocalBookMeta[];
}): Omit<GlobalSearchResults, "heavyBooksSearched" | "searching" | "searchingHeavy"> {
  const q = query.trim().toLocaleLowerCase("id");
  if (!q) {
    return { kitab: [], quran: [], doa: [], guide: [], classic: [] };
  }

  const kitab: KitabSearchMatch[] = [];
  for (const book of books) {
    const titleHit = `${book.title} ${book.category}`.toLocaleLowerCase("id").includes(q);
    if (titleHit) {
      kitab.push({
        book,
        chapterIndex: 0,
        chapterTitle: book.category,
        snippet: `Buka kitab ${book.title} (${book.category})`,
        matchedIn: "title",
      });
    }
    const cached = kitabChapterCache[book.slug];
    if (cached) {
      let bookMatches = 0;
      for (let i = 0; i < cached.length && bookMatches < 2; i += 1) {
        const ch = cached[i];
        if (ch.title.toLocaleLowerCase("id").includes(q)) {
          kitab.push({
            book,
            chapterIndex: i,
            chapterTitle: ch.title,
            snippet: buildSnippet(ch.displayText, q) || ch.title,
            matchedIn: "chapter",
          });
          bookMatches += 1;
        } else if (ch.searchText.includes(q)) {
          kitab.push({
            book,
            chapterIndex: i,
            chapterTitle: ch.title,
            snippet: buildSnippet(ch.displayText, q),
            matchedIn: "content",
          });
          bookMatches += 1;
        }
      }
    }
  }

  const guide = guideDataCache ? searchGuideData(guideDataCache, q) : [];

  const doaList = apiDoaCache || curatedDoaCache || [];
  const doa: DoaSearchMatch[] = [];
  for (const item of doaList) {
    const hay = [item.nama, item.grup, item.tentang, item.tr, item.idn, ...(item.tag || [])]
      .join(" ")
      .toLocaleLowerCase("id");
    if (hay.includes(q)) {
      doa.push({
        item,
        snippet: buildSnippet(item.idn || item.tr || item.grup || "", q),
      });
    }
    if (doa.length >= 6) break;
  }

  const quran: QuranSearchMatch[] = [];
  if (surahListCache) {
    for (const s of surahListCache) {
      const hay = `${s.nomor} ${s.namaLatin} ${s.arti} ${s.tempatTurun}`.toLocaleLowerCase("id");
      if (hay.includes(q)) {
        quran.push({
          surahNumber: s.nomor,
          surahName: s.namaLatin,
          arabicName: s.nama,
          subtitle: `QS. ${s.namaLatin} · ${s.arti} (${s.jumlahAyat} ayat)`,
        });
      }
      if (quran.length >= 6) break;
    }
  }

  const classic: ClassicSearchMatch[] = [];
  for (let i = 0; i < sections.length; i += 1) {
    const sec = sections[i];
    const hay = `${sec.title || ""} ${sec.text || ""}`.toLocaleLowerCase("id");
    if (hay.includes(q)) {
      classic.push({
        sectionIndex: i,
        title: sec.title || `Bagian ${i + 1}`,
        collection: sec.collection,
        snippet: buildSnippet(sec.text || sec.title || "", q),
      });
    }
    if (classic.length >= 6) break;
  }

  return {
    kitab: kitab.slice(0, 12),
    quran,
    doa,
    guide: guide.slice(0, 5),
    classic,
  };
}

export async function runDeepGlobalSearch({
  query,
  books,
  sections,
  includeHeavyBooks,
  signal,
  onUpdate,
}: {
  query: string;
  books: LocalBookMeta[];
  sections: ClassicSection[];
  includeHeavyBooks: boolean;
  signal: AbortSignal;
  onUpdate: (partial: GlobalSearchResults) => void;
}): Promise<void> {
  const q = query.trim().toLocaleLowerCase("id");
  if (!q) return;

  const base = runInstantGlobalSearch({ query, sections, books });
  const kitabMatches = new Map<string, KitabSearchMatch>();
  base.kitab.forEach((m) => kitabMatches.set(`${m.book.slug}:${m.chapterIndex}`, m));

  let currentQuran = [...base.quran];
  let currentDoa = [...base.doa];
  let currentGuide = [...base.guide];

  const emit = (searching: boolean, searchingHeavy = false) => {
    if (signal.aborted) return;
    onUpdate({
      kitab: Array.from(kitabMatches.values()).slice(0, 16),
      quran: currentQuran.slice(0, 10),
      doa: currentDoa.slice(0, 8),
      guide: currentGuide,
      classic: base.classic,
      heavyBooksSearched: includeHeavyBooks,
      searching,
      searchingHeavy,
    });
  };

  emit(true, includeHeavyBooks);

  const guideTask = (async () => {
    try {
      const data = await getGuideData();
      if (signal.aborted) return;
      currentGuide = searchGuideData(data, q);
      emit(true, includeHeavyBooks);
    } catch {
      // ignore
    }
  })();

  // 1. Fetch & search Surah metadata + Indonesian verse translation (if >= 3 chars)
  const quranTask = (async () => {
    try {
      const list = await getSurahList(signal);
      if (signal.aborted) return;
      const seen = new Set<string>();
      const nextQuran: QuranSearchMatch[] = [];

      for (const s of list) {
        const hay = `${s.nomor} ${s.namaLatin} ${s.arti}`.toLocaleLowerCase("id");
        if (hay.includes(q)) {
          const key = `${s.nomor}:0`;
          seen.add(key);
          nextQuran.push({
            surahNumber: s.nomor,
            surahName: s.namaLatin,
            arabicName: s.nama,
            subtitle: `Surah ${s.nomor} · ${s.arti} (${s.jumlahAyat} ayat)`,
          });
        }
        if (nextQuran.length >= 6) break;
      }

      if (q.length >= 3) {
        const res = await fetch(
          `https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/id.indonesian`,
          { signal }
        );
        if (res.ok) {
          const payload = (await res.json()) as {
            data?: {
              matches?: Array<{
                numberInSurah?: number;
                text?: string;
                surah?: { number?: number; englishName?: string };
              }>;
            };
          };
          const matches = payload.data?.matches || [];
          for (const m of matches.slice(0, 6)) {
            const surahNo = m.surah?.number;
            const ayatNo = m.numberInSurah;
            if (!surahNo || !ayatNo) continue;
            const key = `${surahNo}:${ayatNo}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const meta = list.find((s) => s.nomor === surahNo);
            nextQuran.push({
              surahNumber: surahNo,
              surahName: meta?.namaLatin || m.surah?.englishName || `Surah ${surahNo}`,
              arabicName: meta?.nama,
              ayatNumber: ayatNo,
              subtitle: `QS. ${meta?.namaLatin || surahNo} · Ayat ${ayatNo}`,
              snippet: buildSnippet(m.text || "", q),
            });
          }
        }
      }

      currentQuran = nextQuran;
      emit(true, includeHeavyBooks);
    } catch {
      // Ignore network errors silently; cached / offline items stay visible
    }
  })();

  // 2. Merge Do'a Harian API items into cache & re-match
  const doaTask = (async () => {
    try {
      const merged = await getAllDoaItems(signal);
      if (signal.aborted) return;
      const matches: DoaSearchMatch[] = [];
      for (const item of merged) {
        const hay = [item.nama, item.grup, item.tentang, item.tr, item.idn, ...(item.tag || [])]
          .join(" ")
          .toLocaleLowerCase("id");
        if (hay.includes(q)) {
          matches.push({
            item,
            snippet: buildSnippet(item.idn || item.tr || item.grup || "", q),
          });
        }
        if (matches.length >= 8) break;
      }
      currentDoa = matches;
      emit(true, includeHeavyBooks);
    } catch {
      // fallback already populated
    }
  })();

  // 3. Scan Kitab Kuning local books (fast batch first, heavy only when requested)
  const kitabTask = (async () => {
    const localBooks = books.filter(
      (b) => b.source === "local" && (includeHeavyBooks || !HEAVY_SLUGS.has(b.slug))
    );

    const scanBook = async (book: LocalBookMeta) => {
      try {
        const chapters = await getBookChapters(book, signal);
        if (signal.aborted) return;
        let perBook = 0;
        for (let i = 0; i < chapters.length && perBook < 2; i += 1) {
          const ch = chapters[i];
          const titleHit = ch.title.toLocaleLowerCase("id").includes(q);
          const bodyHit = !titleHit && ch.searchText.includes(q);
          if (titleHit || bodyHit) {
            kitabMatches.set(`${book.slug}:${i}`, {
              book,
              chapterIndex: i,
              chapterTitle: ch.title,
              snippet: buildSnippet(ch.displayText, q) || ch.title,
              matchedIn: titleHit ? "chapter" : "content",
            });
            perBook += 1;
          }
        }
      } catch {
        // ignore single file read failure
      }
    };

    const BATCH = 4;
    for (let idx = 0; idx < localBooks.length; idx += BATCH) {
      if (signal.aborted) return;
      await Promise.all(localBooks.slice(idx, idx + BATCH).map(scanBook));
      emit(true, includeHeavyBooks);
    }
  })();

  await Promise.allSettled([guideTask, quranTask, doaTask, kitabTask]);
  emit(false, false);
}
