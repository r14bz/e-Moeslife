import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Home,
  List,
  Maximize2,
  Pause,
  Play,
  Search,
  Square,
  Volume2,
  X,
} from "lucide-react";
import type { ClassicSection } from "../data/sections";
import type {
  CollectionKind,
  EQuranDoaItem,
  EQuranSurahDetail,
  EQuranSurahSummary,
  EQuranTafsirDetail,
  QuranStudioTab,
} from "../types/emoeslife";
import {
  type QuranLastReadBookmark,
  readDoaBookmarks,
  readQuranLastRead,
  toggleDoaBookmark,
  writeQuranLastRead,
} from "../services/preferences";
import { prepareReadingSections } from "../utils/readerEngine";
import { CURATED_DAILY_PRAYERS } from "../data/dailyPrayers";
import {
  fetchAllSanusiDoaAndDzikir,
  type SanusiDoaCategory,
} from "../services/doaApiService";
import { FooterDisclaimer } from "./FooterDisclaimer";
import { ThemedSelect } from "./ThemedSelect";
import { FloatingPageNav } from "./FloatingPageNav";

const EQURAN_API = "https://equran.id/api";

const QARIS: ReadonlyArray<[string, string]> = [
  ["01", "Abdullah Al-Juhany"],
  ["02", "Abdul Muhsin Al-Qasim"],
  ["03", "Abdurrahman As-Sudais"],
  ["04", "Ibrahim Al-Dossari"],
  ["05", "Misyari Rasyid Al-Afasy"],
  ["06", "Yasser Al-Dosari"],
];

async function equranFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Layanan belum dapat diakses (${response.status}).`);
  const json = (await response.json()) as {
    code?: number;
    status?: string;
    message?: string;
    data?: T;
  };
  if (json.code && json.code !== 200) throw new Error(json.message || "Data tidak tersedia.");
  if (json.status && !["success", "sukses"].includes(String(json.status).toLowerCase())) {
    throw new Error(json.message || "Data tidak tersedia.");
  }
  return (json.data ?? json) as T;
}

function normalizeDoaTitle(text?: string): string {
  return String(text || "")
    .toLocaleLowerCase("id")
    .replace(/do['’`]?a/g, "doa")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface StudioClassicPage {
  title: string;
  subtitle?: string;
  text: string;
}

interface QuranStudioViewProps {
  activeTab: QuranStudioTab;
  selectedSurah?: number;
  initialAyatNumber?: number;
  initialDoaTitle?: string;
  sections: ClassicSection[];
  pageLayout: Record<number, string>;
  onChangeTab: (tab: QuranStudioTab, surahNumber?: number) => void;
  onOpenClassicCollection?: (kind: CollectionKind) => void;
  onBackHome?: () => void;
}

export const QuranStudioView: React.FC<QuranStudioViewProps> = ({
  activeTab,
  selectedSurah,
  initialAyatNumber,
  initialDoaTitle,
  sections,
  pageLayout,
  onChangeTab,
  onOpenClassicCollection,
  onBackHome,
}) => {
  const isSurahMode = activeTab === "quran" || activeTab === "tafsir";
  const isClassicMode = activeTab === "dzikir" || activeTab === "tahlil";

  const [surahs, setSurahs] = useState<EQuranSurahSummary[]>([]);
  const [surahQuery, setSurahQuery] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  const [suratDetail, setSuratDetail] = useState<EQuranSurahDetail | null>(null);
  const [tafsirDetail, setTafsirDetail] = useState<EQuranTafsirDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [qariId, setQariId] = useState("01");
  const [showLatin, setShowLatin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [audioStatus, setAudioStatus] = useState("Pilih qari, lalu tekan Putar untuk mendengarkan satu surah.");
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasSrc, setHasSrc] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [doaItems, setDoaItems] = useState<EQuranDoaItem[]>(() => [...CURATED_DAILY_PRAYERS]);
  const [sanusiCategories, setSanusiCategories] = useState<SanusiDoaCategory[]>([]);
  const [doaQuery, setDoaQuery] = useState("");
  const [doaFilter, setDoaFilter] = useState<"all" | "saved">("all");
  const [doaCategoryFilter, setDoaCategoryFilter] = useState<string>("all");
  const [doaLoading, setDoaLoading] = useState(false);
  const [activeDoaIndex, setActiveDoaIndex] = useState(0);
  const [doaTurnDir, setDoaTurnDir] = useState<"next" | "prev" | "fade">("fade");
  const [doaDrawerOpen, setDoaDrawerOpen] = useState(false);
  const doaFetchedRef = useRef(false);
  const doaTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const doaCardRef = useRef<HTMLElement | null>(null);

  const [classicIndex, setClassicIndex] = useState(0);
  const [classicTurnDir, setClassicTurnDir] = useState<"next" | "prev" | "fade">("fade");
  const [classicDrawerOpen, setClassicDrawerOpen] = useState(false);
  const classicTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const classicCardRef = useRef<HTMLElement | null>(null);

  const [lastRead, setLastRead] = useState<QuranLastReadBookmark | null>(() => readQuranLastRead());
  const [doaBookmarks, setDoaBookmarks] = useState<string[]>(() => readDoaBookmarks());
  const [copiedId, setCopiedId] = useState<string>("");
  const pendingScrollAyatRef = useRef<number | null>(initialAyatNumber ?? null);

  useEffect(() => {
    if (typeof initialAyatNumber === "number" && initialAyatNumber > 0) {
      pendingScrollAyatRef.current = initialAyatNumber;
    }
  }, [initialAyatNumber, selectedSurah]);

  const [surahTurnDir, setSurahTurnDir] = useState<"next" | "prev" | "fade">("fade");
  const prevSurahRef = useRef<{ tab: QuranStudioTab; surah?: number }>({
    tab: activeTab,
    surah: selectedSurah,
  });
  const surahCardRef = useRef<HTMLElement | null>(null);
  const skipSurahCardScrollRef = useRef<boolean>(false);

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(key);
      window.setTimeout(() => setCopiedId((prev) => (prev === key ? "" : prev)), 2000);
    } catch {
      // ignore clipboard restrictions
    }
  };

  useEffect(() => {
    if (!isSurahMode || surahs.length > 0) return;
    let active = true;
    setListLoading(true);
    setListError("");
    equranFetch<EQuranSurahSummary[]>(`${EQURAN_API}/v2/surat`)
      .then((data) => {
        if (active) setSurahs(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setListError(err instanceof Error ? err.message : "Gagal memuat daftar surah.");
      })
      .finally(() => {
        if (active) setListLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeTab, surahs.length]);

  useEffect(() => {
    if (activeTab !== "doa" || doaFetchedRef.current) return;
    doaFetchedRef.current = true;
    let active = true;
    const controller = new AbortController();
    setDoaLoading(true);

    Promise.allSettled([
      equranFetch<EQuranDoaItem[]>(`${EQURAN_API}/doa`),
      fetchAllSanusiDoaAndDzikir(controller.signal),
    ])
      .then(([equranRes, sanusiRes]) => {
        if (!active) return;

        const merged = CURATED_DAILY_PRAYERS.map((item) => ({ ...item }));
        const indexByTitle = new Map<string, number>();
        merged.forEach((item, idx) => {
          const norm = normalizeDoaTitle(item.nama);
          if (norm) indexByTitle.set(norm, idx);
        });

        const addOrMerge = (incoming: EQuranDoaItem) => {
          const norm = normalizeDoaTitle(incoming.nama);
          if (!norm) return;
          const existingIdx = indexByTitle.get(norm);
          if (existingIdx !== undefined) {
            const existing = merged[existingIdx];
            merged[existingIdx] = {
              ...existing,
              ar: existing.ar || incoming.ar,
              tr: existing.tr || incoming.tr,
              idn: existing.idn || incoming.idn,
              grup: existing.grup || incoming.grup,
              kategoriSlug: existing.kategoriSlug || incoming.kategoriSlug,
              fawaid: existing.fawaid || incoming.fawaid,
              catatan: existing.catatan || incoming.catatan,
              sumber: existing.sumber || incoming.sumber,
              tentang: existing.tentang || incoming.tentang,
            };
            return;
          }
          indexByTitle.set(norm, merged.length);
          merged.push(incoming);
        };

        if (equranRes.status === "fulfilled" && Array.isArray(equranRes.value)) {
          equranRes.value.forEach(addOrMerge);
        }

        if (sanusiRes.status === "fulfilled") {
          setSanusiCategories(sanusiRes.value.categories);
          sanusiRes.value.items.forEach(addOrMerge);
        }

        if (merged.length > CURATED_DAILY_PRAYERS.length) {
          setDoaItems(merged);
        }
      })
      .catch(() => {
        // Keep curated daily prayers available offline without interrupting the reader
      })
      .finally(() => {
        if (active) setDoaLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [activeTab]);

  const effectiveSurahNumber = selectedSurah;

  useEffect(() => {
    const prev = prevSurahRef.current;
    if (prev.tab === activeTab && prev.surah === effectiveSurahNumber) return;
    if (
      prev.tab === activeTab &&
      typeof prev.surah === "number" &&
      typeof effectiveSurahNumber === "number"
    ) {
      setSurahTurnDir(
        effectiveSurahNumber > prev.surah ? "next" : effectiveSurahNumber < prev.surah ? "prev" : "fade"
      );
    } else {
      setSurahTurnDir("fade");
    }
    prevSurahRef.current = { tab: activeTab, surah: effectiveSurahNumber };
  }, [activeTab, effectiveSurahNumber]);

  useEffect(() => {
    if (!effectiveSurahNumber || !isSurahMode) return;
    let active = true;
    setDetailLoading(true);
    setDetailError("");
    if (pendingScrollAyatRef.current) {
      skipSurahCardScrollRef.current = true;
    } else {
      skipSurahCardScrollRef.current = false;
      window.requestAnimationFrame(() => {
        surahCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    if (activeTab === "quran") {
      equranFetch<EQuranSurahDetail>(`${EQURAN_API}/v2/surat/${effectiveSurahNumber}`)
        .then((data) => {
          if (active) {
            setSuratDetail(data);
            setIsPlaying(false);
            setHasSrc(false);
            setAudioStatus("Pilih qari, lalu tekan Putar satu surah.");
            if (pendingScrollAyatRef.current) {
              const targetAyat = pendingScrollAyatRef.current;
              pendingScrollAyatRef.current = null;
              window.setTimeout(() => {
                document.getElementById(`ayat-${targetAyat}`)?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }, 120);
            }
          }
        })
        .catch((err) => {
          if (active) setDetailError(err instanceof Error ? err.message : "Gagal memuat surah.");
        })
        .finally(() => {
          if (active) setDetailLoading(false);
        });
    } else if (activeTab === "tafsir") {
      equranFetch<EQuranTafsirDetail>(`${EQURAN_API}/v2/tafsir/${effectiveSurahNumber}`)
        .then((data) => {
          if (active) setTafsirDetail(data);
        })
        .catch((err) => {
          if (active) setDetailError(err instanceof Error ? err.message : "Gagal memuat tafsir.");
        })
        .finally(() => {
          if (active) setDetailLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [effectiveSurahNumber, activeTab]);

  useEffect(() => {
    if (!isSurahMode || !effectiveSurahNumber || detailLoading || detailError) return;
    if (skipSurahCardScrollRef.current || pendingScrollAyatRef.current) {
      skipSurahCardScrollRef.current = false;
      return;
    }
    window.requestAnimationFrame(() => {
      surahCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [isSurahMode, effectiveSurahNumber, activeTab, detailLoading, detailError]);

  const filteredSurahs = useMemo(() => {
    const q = surahQuery.trim().toLocaleLowerCase("id");
    if (!q) return surahs;
    return surahs.filter(
      (s) =>
        String(s.nomor).includes(q) ||
        String(s.namaLatin || "").toLocaleLowerCase("id").includes(q) ||
        String(s.arti || "").toLocaleLowerCase("id").includes(q)
    );
  }, [surahs, surahQuery]);

  const doaBookmarkKey = (item: EQuranDoaItem, idx: number) =>
    String(item.id ?? item.nama ?? idx);

  const filteredDoa = useMemo(() => {
    const q = doaQuery.trim().toLocaleLowerCase("id");
    return doaItems.filter((item, idx) => {
      const key = doaBookmarkKey(item, idx);
      if (doaFilter === "saved" && !doaBookmarks.includes(key)) return false;
      if (doaCategoryFilter !== "all" && item.kategoriSlug !== doaCategoryFilter) return false;
      if (!q) return true;
      return [
        item.nama,
        item.grup,
        item.idn,
        item.tr,
        item.fawaid,
        item.catatan,
        item.sumber,
        ...(item.tag || []),
      ]
        .join(" ")
        .toLocaleLowerCase("id")
        .includes(q);
    });
  }, [doaItems, doaQuery, doaFilter, doaCategoryFilter, doaBookmarks]);

  const safeDoaIndex =
    filteredDoa.length > 0 ? Math.min(activeDoaIndex, filteredDoa.length - 1) : 0;
  const activeDoa = filteredDoa[safeDoaIndex];

  const focusDoaCard = useCallback(() => {
    window.requestAnimationFrame(() => {
      doaCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const goToDoa = useCallback(
    (nextIndex: number) => {
      if (!filteredDoa.length) return;
      const clamped = Math.max(0, Math.min(nextIndex, filteredDoa.length - 1));
      setDoaTurnDir(clamped > safeDoaIndex ? "next" : clamped < safeDoaIndex ? "prev" : "fade");
      setActiveDoaIndex(clamped);
      setDoaDrawerOpen(false);
      focusDoaCard();
    },
    [filteredDoa.length, safeDoaIndex, focusDoaCard]
  );

  useEffect(() => {
    if (activeTab === "doa" && filteredDoa.length > 0) {
      if (initialDoaTitle) {
        const target = normalizeDoaTitle(initialDoaTitle);
        const matchIdx = doaItems.findIndex((d) => normalizeDoaTitle(d.nama) === target);
        if (matchIdx >= 0) {
          setDoaFilter("all");
          setDoaCategoryFilter("all");
          setDoaQuery("");
          setActiveDoaIndex(matchIdx);
          setDoaTurnDir("fade");
        }
      }
      const t = window.setTimeout(() => focusDoaCard(), 80);
      return () => window.clearTimeout(t);
    }
  }, [activeTab, initialDoaTitle]); // focus card automatically when entering Do'a tab or deep-linking

  // Dzikir & Tahlil structured pages inside Studio Ibadah
  const classicPages = useMemo<StudioClassicPage[]>(() => {
    if (activeTab === "dzikir") {
      const prepared = prepareReadingSections(sections, pageLayout).filter(
        (s) => s.collection === "dzikir"
      );
      const pagesOut: StudioClassicPage[] = [];
      prepared.forEach((sec) => {
        const rawText =
          typeof sec.pageLayoutText === "string" && sec.pageLayoutText.includes("[[HALAMAN BARU]]")
            ? sec.pageLayoutText
            : sec.text;
        if (rawText.includes("[[HALAMAN BARU]]")) {
          const chunks = rawText
            .split(/\n[ \t]*\[\[HALAMAN BARU\]\][ \t]*\n/u)
            .map((chunk) => chunk.trim())
            .filter(Boolean);
          chunks.forEach((chunk, idx) => {
            pagesOut.push({
              title: `Dzikir Ba'da Shalat`,
              subtitle: `Bagian ${idx + 1}`,
              text: chunk,
            });
          });
        } else {
          pagesOut.push({
            title: sec.title,
            text: sec.text,
          });
        }
      });
      return pagesOut;
    }

    if (activeTab === "tahlil") {
      return sections
        .filter((s) => !s.quranSurah && !s.collection)
        .map((s) => ({
          title: s.title,
          subtitle: "Rangkaian Tahlil",
          text: s.text,
        }));
    }

    return [];
  }, [activeTab, sections, pageLayout]);

  useEffect(() => {
    if (isClassicMode) {
      setClassicIndex(0);
      setClassicTurnDir("fade");
      setClassicDrawerOpen(false);
    }
  }, [activeTab, isClassicMode]);

  const safeClassicIndex =
    classicPages.length > 0 ? Math.min(classicIndex, classicPages.length - 1) : 0;
  const activeClassicPage = classicPages[safeClassicIndex];

  const goToClassic = useCallback(
    (nextIndex: number) => {
      if (!classicPages.length) return;
      const clamped = Math.max(0, Math.min(nextIndex, classicPages.length - 1));
      setClassicTurnDir(clamped > safeClassicIndex ? "next" : clamped < safeClassicIndex ? "prev" : "fade");
      setClassicIndex(clamped);
      setClassicDrawerOpen(false);
      window.requestAnimationFrame(() => {
        classicCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [classicPages.length, safeClassicIndex]
  );

  useEffect(() => {
    if (activeTab !== "doa" && !isClassicMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (activeTab === "doa") goToDoa(safeDoaIndex + 1);
        else goToClassic(safeClassicIndex + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (activeTab === "doa") goToDoa(safeDoaIndex - 1);
        else goToClassic(safeClassicIndex - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTab, isClassicMode, goToDoa, safeDoaIndex, goToClassic, safeClassicIndex]);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio || !suratDetail) return;
    const url = suratDetail.audioFull?.[qariId];
    if (!url) {
      setAudioStatus("Rekaman untuk qari ini belum tersedia pada surah yang dipilih.");
      return;
    }
    if (audio.src !== url) {
      audio.src = url;
      setHasSrc(true);
    }
    if (audio.ended) audio.currentTime = 0;
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setAudioStatus("Audio tidak dapat diputar. Periksa koneksi internet lalu coba lagi."));
  };

  const handleBookmarkAyat = (ayatNumber: number) => {
    if (!suratDetail) return;
    const next: QuranLastReadBookmark = {
      surahNumber: suratDetail.nomor,
      surahName: suratDetail.namaLatin,
      ayatNumber,
      savedAt: new Date().toISOString(),
    };
    setLastRead(next);
    writeQuranLastRead(next);
  };

  const studioBannerMeta = useMemo(() => {
    switch (activeTab) {
      case "tafsir":
        return {
          arabic: "تَفْسِيْرُ الْقُرْآنِ الْكَرِيْمِ",
          title: "Tafsir Al-Qur'an — Kemenag RI Per Surah & Ayat",
        };
      case "doa":
        return {
          arabic: "الأَدْعِيَةُ وَالأَذْكَارُ الْيَوْمِيَّةُ",
          title: "Do'a & Dzikir Harian — Bacaan Arab, Latin, Terjemahan & Keutamaan",
        };
      case "dzikir":
        return {
          arabic: "أَذْكَارُ بَعْدَ الصَّلَاةِ",
          title: "Dzikir & Wirid Ba'da Shalat",
        };
      case "tahlil":
        return {
          arabic: "التَّهْلِيْلُ وَالتَّوَسُّلُ",
          title: "Rangkaian Tahlil, Tawasul & Doa",
        };
      default:
        return {
          arabic: "الْقُرْآنُ الْكَرِيْمُ",
          title: "Al-Qur'an & Murattal — 30 Juz & 6 Qari Pilihan",
        };
    }
  }, [activeTab]);

  return (
    <div
      style={{
        backgroundColor: "var(--tashrif-bg)",
        color: "var(--tashrif-text)",
        minHeight: "100vh",
      }}
    >
      <div className="mx-auto max-w-6xl space-y-4 px-3.5 pt-3.5 pb-10 sm:px-6">
        {/* Banner Header Hijau Zamrud (Senada Pembaca Kitab) */}
        <div
          style={{
            backgroundColor: "var(--tashrif-panel-bg)",
            border: "1px solid var(--tashrif-panel-border)",
            borderRadius: "0.75rem",
          }}
          className="px-3.5 py-4 text-center shadow-xs"
        >
          <h1
            dir="rtl"
            lang="ar"
            style={{ color: "var(--tashrif-panel-bright)", lineHeight: "1.8" }}
            className="font-arabic text-2xl font-bold sm:text-[1.65rem]"
          >
            {studioBannerMeta.arabic}
          </h1>
          <p style={{ color: "var(--tashrif-panel-sub)" }} className="mt-0.5 text-xs font-semibold">
            {studioBannerMeta.title}
          </p>
        </div>

        {/* Segmented Mode Tabs */}
        <div
          style={{
            border: "1px solid var(--tashrif-border-cell)",
            backgroundColor: "var(--tashrif-paper)",
          }}
          className="no-scrollbar flex w-full overflow-x-auto rounded-xl p-1 shadow-xs"
          role="tablist"
          aria-label="Mode Studio Ibadah"
        >
          {(
            [
              { id: "quran", label: "Al-Qur'an" },
              { id: "dzikir", label: "Dzikir" },
              { id: "doa", label: "Do'a" },
              { id: "tahlil", label: "Tahlil" },
              { id: "tafsir", label: "Tafsir" },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            const keepsSurah = tab.id === "quran" || tab.id === "tafsir";
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeTab(tab.id, keepsSurah ? effectiveSurahNumber : undefined)}
                style={
                  active
                    ? {
                        backgroundColor: "var(--tashrif-btn-bg)",
                        color: "var(--tashrif-btn-text)",
                      }
                    : { color: "var(--tashrif-text)" }
                }
                className="min-h-[38px] flex-1 rounded-lg px-2.5 text-xs font-bold whitespace-nowrap transition-colors sm:px-3.5"
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Last-read Quran Resume Strip */}
        {isSurahMode && lastRead && (
          <div
            style={{
              border: "1px solid var(--tashrif-border-cell)",
              backgroundColor: "var(--tashrif-paper)",
            }}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-2.5 shadow-xs"
          >
            <div style={{ color: "var(--tashrif-text)" }} className="flex items-center gap-2 text-xs">
              <BookmarkCheck
                style={{ color: "var(--tashrif-accent)" }}
                className="h-4 w-4 shrink-0"
              />
              <span>
                Terakhir dibaca: <strong>QS. {lastRead.surahName}</strong> · Ayat {lastRead.ayatNumber}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                pendingScrollAyatRef.current = lastRead.ayatNumber;
                onChangeTab("quran", lastRead.surahNumber);
              }}
              style={{
                backgroundColor: "var(--tashrif-btn-bg)",
                color: "var(--tashrif-btn-text)",
              }}
              className="min-h-[36px] rounded-lg px-3 text-xs font-bold transition-colors hover:opacity-90"
            >
              Lanjut ke Ayat {lastRead.ayatNumber}
            </button>
          </div>
        )}

        {/* Do'a Harian Paginated Studio View */}
        {activeTab === "doa" && (
          <div className="space-y-4">
            <div
              style={{
                border: "1px solid var(--tashrif-border-cell)",
                backgroundColor: "var(--tashrif-paper)",
              }}
              className="space-y-3 rounded-xl p-3 shadow-xs"
            >
              <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h2
                      style={{ color: "var(--tashrif-ink)" }}
                      className="font-display text-base font-semibold sm:text-lg"
                    >
                      Do'a &amp; Dzikir Harian
                    </h2>
                    <span
                      style={{ color: "var(--tashrif-accent)" }}
                      className="font-mono-tabular text-xs font-bold"
                    >
                      ({filteredDoa.length})
                    </span>
                    {doaLoading && (
                      <span
                        style={{ color: "var(--tashrif-muted)" }}
                        className="text-[11px] font-medium"
                      >
                        · Memuat koleksi do'a &amp; dzikir…
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setDoaDrawerOpen(true)}
                    style={{
                      border: "1px solid var(--tashrif-border-cell)",
                      backgroundColor: "var(--tashrif-wazan-bg)",
                      color: "var(--tashrif-text)",
                    }}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold lg:hidden"
                  >
                    <List className="h-3.5 w-3.5" />
                    <span>Daftar Do'a</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div
                    style={{
                      border: "1px solid var(--tashrif-border-cell)",
                      backgroundColor: "var(--tashrif-row-alt)",
                    }}
                    className="inline-flex rounded-lg p-0.5"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setDoaFilter("all");
                        setActiveDoaIndex(0);
                        setDoaTurnDir("fade");
                      }}
                      style={
                        doaFilter === "all"
                          ? {
                              backgroundColor: "var(--tashrif-btn-bg)",
                              color: "var(--tashrif-btn-text)",
                            }
                          : { color: "var(--tashrif-text)" }
                      }
                      className="min-h-[34px] rounded-md px-2.5 text-xs font-bold transition-colors"
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDoaFilter("saved");
                        setActiveDoaIndex(0);
                        setDoaTurnDir("fade");
                      }}
                      style={
                        doaFilter === "saved"
                          ? {
                              backgroundColor: "var(--tashrif-btn-bg)",
                              color: "var(--tashrif-btn-text)",
                            }
                          : { color: "var(--tashrif-text)" }
                      }
                      className="min-h-[34px] rounded-md px-2.5 text-xs font-bold transition-colors"
                    >
                      Tersimpan ({doaBookmarks.length})
                    </button>
                  </div>

                  <label className="relative flex min-h-[38px] w-full items-center md:w-64">
                    <Search
                      style={{ color: "var(--tashrif-muted)" }}
                      className="pointer-events-none absolute left-3 h-4 w-4"
                    />
                    <input
                      type="search"
                      value={doaQuery}
                      onChange={(e) => {
                        setDoaQuery(e.target.value);
                        setActiveDoaIndex(0);
                        setDoaTurnDir("fade");
                      }}
                      placeholder="Cari do'a, dzikir, atau sumber…"
                      aria-label="Cari do'a harian dan dzikir"
                      style={{
                        border: "1.5px solid var(--tashrif-border-strong)",
                        backgroundColor: "var(--tashrif-control-bg)",
                        color: "var(--tashrif-text)",
                      }}
                      className="min-h-[38px] w-full rounded-lg pr-3.5 pl-9 text-xs font-medium outline-none sm:text-sm"
                    />
                  </label>
                </div>
              </div>

              {sanusiCategories.length > 0 && (
                <div
                  style={{ borderTop: "1px dashed var(--tashrif-border-cell)" }}
                  className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pt-2.5"
                  role="group"
                  aria-label="Filter kategori do'a & dzikir"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setDoaCategoryFilter("all");
                      setActiveDoaIndex(0);
                      setDoaTurnDir("fade");
                    }}
                    style={
                      doaCategoryFilter === "all"
                        ? {
                            backgroundColor: "var(--tashrif-btn-bg)",
                            color: "var(--tashrif-btn-text)",
                          }
                        : {
                            border: "1px solid var(--tashrif-border-cell)",
                            backgroundColor: "var(--tashrif-row-alt)",
                            color: "var(--tashrif-text)",
                          }
                    }
                    className="min-h-[32px] shrink-0 rounded-lg px-2.5 text-xs font-bold transition-colors"
                  >
                    Semua Kategori
                  </button>
                  {sanusiCategories.map((cat) => {
                    const active = doaCategoryFilter === cat.slug;
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => {
                          setDoaCategoryFilter(cat.slug);
                          setActiveDoaIndex(0);
                          setDoaTurnDir("fade");
                        }}
                        style={
                          active
                            ? {
                                backgroundColor: "var(--tashrif-btn-bg)",
                                color: "var(--tashrif-btn-text)",
                              }
                            : {
                                border: "1px solid var(--tashrif-border-cell)",
                                backgroundColor: "var(--tashrif-row-alt)",
                                color: "var(--tashrif-text)",
                              }
                        }
                        className="min-h-[32px] shrink-0 rounded-lg px-2.5 text-xs font-semibold transition-colors"
                      >
                        {cat.nama}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-start">
              {doaDrawerOpen && (
                <div
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
                  onClick={() => setDoaDrawerOpen(false)}
                  aria-hidden="true"
                />
              )}

              {/* Do'a Directory Sidebar / Mobile Drawer */}
              <aside
                style={{
                  backgroundColor: "var(--tashrif-paper)",
                  borderColor: "var(--tashrif-border-cell)",
                }}
                className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r p-4 transition-transform duration-200 lg:sticky lg:top-20 lg:z-10 lg:max-h-[calc(100vh-110px)] lg:w-auto lg:translate-x-0 lg:rounded-xl lg:border ${
                  doaDrawerOpen ? "translate-x-0" : "-translate-x-full"
                }`}
              >
                <div
                  style={{ borderBottom: "1px solid var(--tashrif-border-cell)" }}
                  className="flex items-start justify-between gap-2 pb-3"
                >
                  <div>
                    <p
                      style={{ color: "var(--tashrif-accent)" }}
                      className="font-mono-tabular text-[11px] font-bold tracking-wider uppercase"
                    >
                      Indeks Halaman
                    </p>
                    <h3
                      style={{ color: "var(--tashrif-ink)" }}
                      className="font-display mt-0.5 text-base font-semibold"
                    >
                      Daftar Do'a Harian
                    </h3>
                    <p style={{ color: "var(--tashrif-muted)" }} className="text-xs">
                      {filteredDoa.length} halaman do'a
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDoaDrawerOpen(false)}
                    aria-label="Tutup daftar do'a"
                    style={{
                      border: "1px solid var(--tashrif-border-cell)",
                      backgroundColor: "var(--tashrif-wazan-bg)",
                      color: "var(--tashrif-text)",
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg lg:hidden"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex-1 space-y-1 overflow-y-auto pr-1">
                  {filteredDoa.map((item, idx) => {
                    const isActive = idx === safeDoaIndex;
                    const itemKey = doaBookmarkKey(item, idx);
                    return (
                      <button
                        key={`${itemKey}-${idx}`}
                        type="button"
                        onClick={() => goToDoa(idx)}
                        style={
                          isActive
                            ? {
                                backgroundColor: "var(--tashrif-btn-bg)",
                                color: "var(--tashrif-btn-text)",
                              }
                            : { color: "var(--tashrif-text)" }
                        }
                        className={`flex min-h-[42px] w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                          isActive
                            ? "font-bold"
                            : "hover:bg-[var(--tashrif-dropdown-hover)]"
                        }`}
                      >
                        <span className="font-mono-tabular shrink-0 opacity-80">
                          {String(idx + 1).padStart(2, "0")}.
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="line-clamp-2 block">{item.nama || "Do'a Harian"}</span>
                          {item.grup && (
                            <span
                              style={!isActive ? { color: "var(--tashrif-muted)" } : undefined}
                              className={`mt-0.5 block truncate text-[10px] ${
                                isActive ? "opacity-85" : ""
                              }`}
                            >
                              {item.grup}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              {/* Single-Prayer Reader Pane */}
              <section className="min-w-0">
                {!activeDoa ? (
                  <div
                    style={{
                      border: "1px dashed var(--tashrif-group-break)",
                      backgroundColor: "var(--tashrif-paper)",
                      color: "var(--tashrif-muted)",
                    }}
                    className="rounded-xl p-8 text-center shadow-xs"
                  >
                    <p className="text-sm">
                      {doaFilter === "saved"
                        ? "Belum ada do'a yang disimpan ke daftar penanda."
                        : "Tidak ada do'a yang cocok dengan pencarian Anda."}
                    </p>
                  </div>
                ) : (
                  (() => {
                    const key = doaBookmarkKey(activeDoa, safeDoaIndex);
                    const isSaved = doaBookmarks.includes(key);
                    const isCopied = copiedId === `doa-${key}`;
                    return (
                      <>
                        <article
                          ref={doaCardRef}
                          key={`doa-${key}-${safeDoaIndex}`}
                          onTouchStart={(e) => {
                            const touch = e.changedTouches[0];
                            if (touch) doaTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
                          }}
                          onTouchEnd={(e) => {
                            const start = doaTouchStartRef.current;
                            doaTouchStartRef.current = null;
                            const touch = e.changedTouches[0];
                            if (!start || !touch) return;
                            const dx = touch.clientX - start.x;
                            const dy = touch.clientY - start.y;
                            if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.25) {
                              goToDoa(dx < 0 ? safeDoaIndex + 1 : safeDoaIndex - 1);
                            }
                          }}
                          style={{
                            backgroundColor: "var(--tashrif-paper)",
                            border: "4px double var(--tashrif-border-strong)",
                            borderRadius: "0.75rem",
                          }}
                          className={`scroll-mt-20 overflow-hidden shadow-xs page-enter-${doaTurnDir}`}
                        >
                          {/* Tinted Kitab Header Band */}
                          <div
                            style={{
                              backgroundColor: "var(--tashrif-wazan-bg)",
                              borderBottom: "1px solid var(--tashrif-border-cell)",
                            }}
                            className="px-4 py-4 sm:px-6"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p
                                  style={{ color: "var(--tashrif-accent)" }}
                                  className="font-mono-tabular text-[11px] font-bold tracking-wider uppercase"
                                >
                                  {(activeDoa.grup || "Do'a Harian").toUpperCase()} · HALAMAN{" "}
                                  {safeDoaIndex + 1} / {filteredDoa.length}
                                </p>
                                <h3
                                  style={{ color: "var(--tashrif-ink)" }}
                                  className="font-display mt-1 text-xl font-semibold sm:text-2xl"
                                >
                                  {activeDoa.nama || "Do'a Harian"}
                                </h3>
                                {!activeDoa.fawaid &&
                                  !activeDoa.catatan &&
                                  !activeDoa.sumber &&
                                  activeDoa.tentang && (
                                    <p
                                      style={{ color: "var(--tashrif-muted)" }}
                                      className="mt-1 text-xs"
                                    >
                                      {activeDoa.tentang}
                                    </p>
                                  )}
                              </div>

                              <div className="flex shrink-0 items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyText(
                                      `doa-${key}`,
                                      [
                                        activeDoa.nama,
                                        activeDoa.ar,
                                        activeDoa.tr,
                                        activeDoa.idn,
                                        activeDoa.fawaid ? `Keutamaan: ${activeDoa.fawaid}` : "",
                                        activeDoa.sumber ? `Sumber: ${activeDoa.sumber}` : "",
                                      ]
                                        .filter(Boolean)
                                        .join("\n\n")
                                    )
                                  }
                                  style={{
                                    border: "1px solid var(--tashrif-border-cell)",
                                    backgroundColor: "var(--tashrif-paper)",
                                    color: "var(--tashrif-text)",
                                  }}
                                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors hover:opacity-90"
                                >
                                  {isCopied ? (
                                    <Check className="h-3.5 w-3.5" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                  <span>{isCopied ? "Tersalin" : "Salin"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDoaBookmarks(toggleDoaBookmark(key))}
                                  style={
                                    isSaved
                                      ? {
                                          backgroundColor: "var(--tashrif-btn-bg)",
                                          color: "var(--tashrif-btn-text)",
                                        }
                                      : {
                                          border: "1px solid var(--tashrif-border-cell)",
                                          backgroundColor: "var(--tashrif-paper)",
                                          color: "var(--tashrif-text)",
                                        }
                                  }
                                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors hover:opacity-90"
                                >
                                  {isSaved ? (
                                    <BookmarkCheck className="h-3.5 w-3.5" />
                                  ) : (
                                    <Bookmark className="h-3.5 w-3.5" />
                                  )}
                                  <span>{isSaved ? "Tersimpan" : "Simpan"}</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Arabic Text */}
                          <div className="px-4 py-5 sm:px-7 sm:py-6">
                            {activeDoa.ar && (
                              <p
                                lang="ar"
                                dir="rtl"
                                style={{ color: "var(--tashrif-ink)" }}
                                className="arabic-classic-text whitespace-pre-wrap text-right"
                              >
                                {activeDoa.ar}
                              </p>
                            )}
                          </div>

                          {/* Dashed Bilingual Panel (Latin, Terjemahan & Keterangan Sanusi API) */}
                          {(activeDoa.tr ||
                            activeDoa.idn ||
                            activeDoa.fawaid ||
                            activeDoa.catatan ||
                            activeDoa.sumber) && (
                            <div
                              style={{
                                borderTop: "1px dashed var(--tashrif-group-break)",
                                backgroundColor: "var(--tashrif-wazan-bg)",
                              }}
                              className="space-y-3 px-4 py-4 sm:px-7 sm:py-5"
                            >
                              {activeDoa.tr && (
                                <p
                                  style={{ color: "var(--tashrif-muted)" }}
                                  className="latin-reader-text whitespace-pre-wrap italic"
                                >
                                  {activeDoa.tr}
                                </p>
                              )}
                              {activeDoa.idn && (
                                <p
                                  style={{ color: "var(--tashrif-text)" }}
                                  className="prose-reader-text whitespace-pre-wrap font-medium"
                                >
                                  {activeDoa.idn}
                                </p>
                              )}
                              {(activeDoa.fawaid || activeDoa.catatan || activeDoa.sumber) && (
                                <div
                                  style={{
                                    borderTop: "1px solid var(--tashrif-border-cell)",
                                    color: "var(--tashrif-muted)",
                                  }}
                                  className="space-y-1.5 pt-3 text-xs leading-relaxed"
                                >
                                  {activeDoa.fawaid && (
                                    <p>
                                      <strong style={{ color: "var(--tashrif-ink)" }}>
                                        Keutamaan / Fawaid:{" "}
                                      </strong>
                                      {activeDoa.fawaid}
                                    </p>
                                  )}
                                  {activeDoa.catatan && (
                                    <p>
                                      <strong style={{ color: "var(--tashrif-ink)" }}>
                                        Catatan:{" "}
                                      </strong>
                                      {activeDoa.catatan}
                                    </p>
                                  )}
                                  {activeDoa.sumber && (
                                    <p>
                                      <strong style={{ color: "var(--tashrif-accent)" }}>
                                        Sumber:{" "}
                                      </strong>
                                      {activeDoa.sumber}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </article>

                        <FloatingPageNav
                          onPrev={() => goToDoa(safeDoaIndex - 1)}
                          onNext={() => goToDoa(safeDoaIndex + 1)}
                          canPrev={safeDoaIndex > 0}
                          canNext={safeDoaIndex + 1 < filteredDoa.length}
                          prevLabel="Do'a Sebelumnya"
                          nextLabel="Do'a Berikutnya"
                          centerText={`${safeDoaIndex + 1} / ${filteredDoa.length}`}
                          ariaLabel="Navigasi halaman do'a harian"
                          onCenterClick={() => {
                            if (window.matchMedia("(min-width: 1024px)").matches) return;
                            setDoaDrawerOpen(true);
                          }}
                          centerAriaLabel="Buka daftar do'a harian"
                        />
                      </>
                    );
                  })()
                )}
              </section>
            </div>
          </div>
        )}

        {/* Dzikir Ba'da Shalat & Rangkaian Tahlil Studio Tabs */}
        {isClassicMode && (
          <div className="space-y-4">
            <div
              style={{
                border: "1px solid var(--tashrif-border-cell)",
                backgroundColor: "var(--tashrif-paper)",
              }}
              className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl p-3 shadow-xs sm:px-4"
            >
              <div>
                <h2
                  style={{ color: "var(--tashrif-ink)" }}
                  className="font-display text-base font-semibold sm:text-lg"
                >
                  {activeTab === "dzikir" ? "Dzikir Ba'da Shalat" : "Rangkaian Tahlil"}
                </h2>
                <p style={{ color: "var(--tashrif-muted)" }} className="text-xs">
                  Halaman {safeClassicIndex + 1} dari {classicPages.length} · Geser kanan/kiri untuk pindah
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setClassicDrawerOpen(true)}
                  style={{
                    border: "1px solid var(--tashrif-border-cell)",
                    backgroundColor: "var(--tashrif-wazan-bg)",
                    color: "var(--tashrif-text)",
                  }}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold lg:hidden"
                >
                  <List className="h-3.5 w-3.5" />
                  <span>Daftar</span>
                </button>

                {onOpenClassicCollection && (
                  <button
                    type="button"
                    onClick={() => onOpenClassicCollection(activeTab)}
                    style={{
                      backgroundColor: "var(--tashrif-btn-bg)",
                      color: "var(--tashrif-btn-text)",
                    }}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors hover:opacity-90"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Ruang Baca Fokus</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-start">
              {classicDrawerOpen && (
                <div
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
                  onClick={() => setClassicDrawerOpen(false)}
                  aria-hidden="true"
                />
              )}

              <aside
                style={{
                  backgroundColor: "var(--tashrif-paper)",
                  borderColor: "var(--tashrif-border-cell)",
                }}
                className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r p-4 transition-transform duration-200 lg:sticky lg:top-20 lg:z-10 lg:max-h-[calc(100vh-110px)] lg:w-auto lg:translate-x-0 lg:rounded-xl lg:border ${
                  classicDrawerOpen ? "translate-x-0" : "-translate-x-full"
                }`}
              >
                <div
                  style={{ borderBottom: "1px solid var(--tashrif-border-cell)" }}
                  className="flex items-start justify-between gap-2 pb-3"
                >
                  <div>
                    <p
                      style={{ color: "var(--tashrif-accent)" }}
                      className="font-mono-tabular text-[11px] font-bold tracking-wider uppercase"
                    >
                      Urutan Bacaan
                    </p>
                    <h3
                      style={{ color: "var(--tashrif-ink)" }}
                      className="font-display mt-0.5 text-base font-semibold"
                    >
                      {activeTab === "dzikir" ? "Daftar Halaman Dzikir" : "Daftar Bagian Tahlil"}
                    </h3>
                    <p style={{ color: "var(--tashrif-muted)" }} className="text-xs">
                      {classicPages.length} halaman
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClassicDrawerOpen(false)}
                    aria-label="Tutup daftar bacaan"
                    style={{
                      border: "1px solid var(--tashrif-border-cell)",
                      backgroundColor: "var(--tashrif-wazan-bg)",
                      color: "var(--tashrif-text)",
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg lg:hidden"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex-1 space-y-1 overflow-y-auto pr-1">
                  {classicPages.map((pg, idx) => {
                    const isActive = idx === safeClassicIndex;
                    const firstLine =
                      pg.text.split("\n").find((l) => l.trim().length > 0)?.trim() || pg.title;
                    const itemLabel =
                      activeTab === "dzikir" ? `Halaman ${idx + 1}` : pg.title;
                    return (
                      <button
                        key={`${activeTab}-nav-${idx}`}
                        type="button"
                        onClick={() => goToClassic(idx)}
                        style={
                          isActive
                            ? {
                                backgroundColor: "var(--tashrif-btn-bg)",
                                color: "var(--tashrif-btn-text)",
                              }
                            : { color: "var(--tashrif-text)" }
                        }
                        className={`flex min-h-[42px] w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                          isActive
                            ? "font-bold"
                            : "hover:bg-[var(--tashrif-dropdown-hover)]"
                        }`}
                      >
                        <span className="font-mono-tabular shrink-0 opacity-80">
                          {String(idx + 1).padStart(2, "0")}.
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="line-clamp-2 block">{itemLabel}</span>
                          {activeTab === "dzikir" && (
                            <span
                              dir="rtl"
                              style={!isActive ? { color: "var(--tashrif-muted)" } : undefined}
                              className={`font-arabic mt-0.5 block truncate text-xs ${
                                isActive ? "opacity-85" : ""
                              }`}
                            >
                              {firstLine}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <section className="min-w-0">
                {activeClassicPage && (
                  <>
                    <article
                      ref={classicCardRef}
                      key={`${activeTab}-${safeClassicIndex}`}
                      onTouchStart={(e) => {
                        const touch = e.changedTouches[0];
                        if (touch) classicTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
                      }}
                      onTouchEnd={(e) => {
                        const start = classicTouchStartRef.current;
                        classicTouchStartRef.current = null;
                        const touch = e.changedTouches[0];
                        if (!start || !touch) return;
                        const dx = touch.clientX - start.x;
                        const dy = touch.clientY - start.y;
                        if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.25) {
                          goToClassic(dx < 0 ? safeClassicIndex + 1 : safeClassicIndex - 1);
                        }
                      }}
                      style={{
                        backgroundColor: "var(--tashrif-paper)",
                        border: "4px double var(--tashrif-border-strong)",
                        borderRadius: "0.75rem",
                      }}
                      className={`scroll-mt-20 overflow-hidden shadow-xs page-enter-${classicTurnDir}`}
                    >
                      {/* Tinted Kitab Header Band */}
                      <div
                        style={{
                          backgroundColor: "var(--tashrif-wazan-bg)",
                          borderBottom: "1px solid var(--tashrif-border-cell)",
                        }}
                        className="px-4 py-4 sm:px-7"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p
                              style={{ color: "var(--tashrif-accent)" }}
                              className="font-mono-tabular text-[11px] font-bold tracking-wider uppercase"
                            >
                              {(activeClassicPage.subtitle || activeTab).toUpperCase()} ·{" "}
                              {safeClassicIndex + 1} / {classicPages.length}
                            </p>
                            <h3
                              style={{ color: "var(--tashrif-ink)" }}
                              className="font-display mt-1 text-xl font-semibold sm:text-2xl"
                            >
                              {activeClassicPage.title}
                            </h3>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                `${activeTab}-${safeClassicIndex}`,
                                `${activeClassicPage.title}\n\n${activeClassicPage.text}`
                              )
                            }
                            style={{
                              border: "1px solid var(--tashrif-border-cell)",
                              backgroundColor: "var(--tashrif-paper)",
                              color: "var(--tashrif-text)",
                            }}
                            className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors hover:opacity-90"
                          >
                            {copiedId === `${activeTab}-${safeClassicIndex}` ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            <span>
                              {copiedId === `${activeTab}-${safeClassicIndex}` ? "Tersalin" : "Salin"}
                            </span>
                          </button>
                        </div>

                        <div
                          className="mx-auto mt-2.5 flex items-center justify-center gap-3"
                          style={{ color: "var(--tashrif-accent)" }}
                          aria-hidden="true"
                        >
                          <span
                            className="h-px w-12"
                            style={{ backgroundColor: "var(--tashrif-border-cell)" }}
                          />
                          <span className="font-arabic text-sm">۞</span>
                          <span
                            className="h-px w-12"
                            style={{ backgroundColor: "var(--tashrif-border-cell)" }}
                          />
                        </div>
                      </div>

                      <div
                        lang="ar"
                        dir="rtl"
                        style={{ color: "var(--tashrif-ink)" }}
                        className="arabic-classic-text whitespace-pre-wrap px-4 py-6 text-right sm:px-8 sm:py-7"
                      >
                        {activeClassicPage.text}
                      </div>

                      <div
                        style={{
                          borderTop: "1px dashed var(--tashrif-group-break)",
                          backgroundColor: "var(--tashrif-row-alt)",
                        }}
                        className="px-4 py-3 text-center"
                      >
                        <p
                          style={{ color: "var(--tashrif-accent)" }}
                          className="font-arabic text-sm font-semibold"
                        >
                          اقْرَؤُوا بِتَأَنٍّ وَحُضُورِ الْقَلْبِ
                        </p>
                      </div>
                    </article>

                    <FloatingPageNav
                      onPrev={() => goToClassic(safeClassicIndex - 1)}
                      onNext={() => goToClassic(safeClassicIndex + 1)}
                      canPrev={safeClassicIndex > 0}
                      canNext={safeClassicIndex + 1 < classicPages.length}
                      prevLabel="Sebelumnya"
                      nextLabel="Berikutnya"
                      centerText={`${safeClassicIndex + 1} / ${classicPages.length}`}
                      ariaLabel="Navigasi halaman bacaan"
                      onCenterClick={() => {
                        if (window.matchMedia("(min-width: 1024px)").matches) return;
                        setClassicDrawerOpen(true);
                      }}
                      centerAriaLabel="Buka daftar halaman"
                    />
                  </>
                )}
              </section>
            </div>
          </div>
        )}

        {/* Split-Pane Surah Directory + Active Surah / Tafsir Reader */}
        {isSurahMode && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
            {/* Surah Directory */}
            <aside
              style={{
                backgroundColor: "var(--tashrif-paper)",
                border: "1px solid var(--tashrif-border-cell)",
              }}
              className={`${
                effectiveSurahNumber ? "hidden lg:flex" : "flex"
              } max-h-[75vh] flex-col rounded-xl p-3.5 shadow-xs lg:sticky lg:top-20`}
            >
              <label className="relative flex items-center">
                <Search
                  style={{ color: "var(--tashrif-muted)" }}
                  className="pointer-events-none absolute left-3 h-4 w-4"
                />
                <input
                  type="search"
                  value={surahQuery}
                  onChange={(e) => setSurahQuery(e.target.value)}
                  placeholder="Cari surah (1–114)…"
                  aria-label="Cari surah"
                  style={{
                    border: "1.5px solid var(--tashrif-border-strong)",
                    backgroundColor: "var(--tashrif-control-bg)",
                    color: "var(--tashrif-text)",
                  }}
                  className="min-h-[38px] w-full rounded-lg pr-3 pl-9 text-xs font-medium outline-none"
                />
              </label>

              {listLoading && (
                <p style={{ color: "var(--tashrif-muted)" }} className="py-8 text-center text-xs">
                  Memuat daftar surah…
                </p>
              )}
              {listError && (
                <p className="py-8 text-center text-xs text-red-700 dark:text-red-400">
                  {listError}
                </p>
              )}

              <div className="mt-2.5 flex-1 space-y-1 overflow-y-auto pr-1">
                {filteredSurahs.map((s) => {
                  const isSelected = effectiveSurahNumber === s.nomor;
                  return (
                    <button
                      key={s.nomor}
                      type="button"
                      onClick={() => onChangeTab(activeTab, s.nomor)}
                      style={
                        isSelected
                          ? {
                              backgroundColor: "var(--tashrif-btn-bg)",
                              color: "var(--tashrif-btn-text)",
                            }
                          : { color: "var(--tashrif-text)" }
                      }
                      className={`flex min-h-[46px] w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                        isSelected ? "" : "hover:bg-[var(--tashrif-dropdown-hover)]"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          style={
                            isSelected
                              ? {
                                  backgroundColor: "rgba(255,255,255,0.18)",
                                  color: "var(--tashrif-btn-text)",
                                }
                              : {
                                  backgroundColor: "var(--tashrif-wazan-bg)",
                                  border: "1px solid var(--tashrif-border-cell)",
                                  color: "var(--tashrif-accent)",
                                }
                          }
                          className="font-mono-tabular flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold"
                        >
                          {s.nomor}
                        </span>
                        <div className="min-w-0">
                          <span className="block truncate text-xs font-bold sm:text-sm">
                            {s.namaLatin}
                          </span>
                          <span
                            style={!isSelected ? { color: "var(--tashrif-muted)" } : undefined}
                            className={`block truncate text-[11px] ${
                              isSelected ? "opacity-85" : ""
                            }`}
                          >
                            {s.arti} · {s.jumlahAyat} ayat
                          </span>
                        </div>
                      </div>
                      <span className="font-arabic shrink-0 text-base opacity-90">{s.nama}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Right Pane: Active Surah or Tafsir Detail */}
            <section className={`${!effectiveSurahNumber ? "hidden lg:block" : "block"} min-w-0`}>
              {!effectiveSurahNumber ? (
                <div
                  style={{
                    border: "4px double var(--tashrif-border-strong)",
                    backgroundColor: "var(--tashrif-paper)",
                  }}
                  className="rounded-xl p-10 text-center shadow-xs"
                >
                  <p
                    style={{ color: "var(--tashrif-accent)" }}
                    className="font-arabic text-3xl font-bold"
                  >
                    بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
                  </p>
                  <h2
                    style={{ color: "var(--tashrif-ink)" }}
                    className="font-display mt-3 text-lg font-semibold"
                  >
                    Pilih surah dari daftar di samping
                  </h2>
                  <p style={{ color: "var(--tashrif-muted)" }} className="mt-1 text-xs sm:text-sm">
                    Baca ayat Al-Qur’an, dengarkan murattal dari 6 qari, atau pelajari tafsirnya.
                  </p>
                </div>
              ) : (
                <article
                  ref={surahCardRef}
                  key={`${activeTab}-${effectiveSurahNumber}-${detailLoading ? "loading" : "ready"}`}
                  style={{
                    backgroundColor: "var(--tashrif-paper)",
                    border: "4px double var(--tashrif-border-strong)",
                    borderRadius: "0.75rem",
                  }}
                  className={`scroll-mt-20 overflow-hidden shadow-xs page-enter-${
                    detailLoading ? "fade" : surahTurnDir
                  }`}
                >
                  {/* Surah Directory, Beranda Return & Quick Nav */}
                  <div
                    style={{
                      borderBottom: "1px solid var(--tashrif-border-cell)",
                      backgroundColor: "var(--tashrif-row-alt)",
                    }}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onChangeTab(activeTab, undefined)}
                        style={{
                          border: "1px solid var(--tashrif-border-cell)",
                          backgroundColor: "var(--tashrif-paper)",
                          color: "var(--tashrif-text)",
                        }}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold lg:hidden"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Daftar Surah</span>
                      </button>

                      {onBackHome && (
                        <button
                          type="button"
                          onClick={onBackHome}
                          style={{
                            border: "1px solid var(--tashrif-border-cell)",
                            backgroundColor: "var(--tashrif-paper)",
                            color: "var(--tashrif-text)",
                          }}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-opacity hover:opacity-90"
                        >
                          <Home className="h-4 w-4" />
                          <span>Beranda</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={effectiveSurahNumber <= 1}
                        onClick={() => onChangeTab(activeTab, effectiveSurahNumber - 1)}
                        aria-label="Surah sebelumnya"
                        title="Surah sebelumnya"
                        style={{
                          border: "1px solid var(--tashrif-border-cell)",
                          backgroundColor: "var(--tashrif-paper)",
                          color: "var(--tashrif-text)",
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg disabled:opacity-35"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={effectiveSurahNumber >= 114}
                        onClick={() => onChangeTab(activeTab, effectiveSurahNumber + 1)}
                        aria-label="Surah berikutnya"
                        title="Surah berikutnya"
                        style={{
                          backgroundColor: "var(--tashrif-btn-bg)",
                          color: "var(--tashrif-btn-text)",
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg disabled:opacity-35"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {detailLoading && (
                    <p
                      style={{ color: "var(--tashrif-muted)" }}
                      className="py-12 text-center text-sm"
                    >
                      Memuat data…
                    </p>
                  )}
                  {detailError && (
                    <p className="py-12 text-center text-sm text-red-700 dark:text-red-400">
                      {detailError}
                    </p>
                  )}

                  {!detailLoading && !detailError && activeTab === "quran" && suratDetail && (
                    <>
                      {/* Tinted Surah Header Band */}
                      <div
                        style={{
                          backgroundColor: "var(--tashrif-wazan-bg)",
                          borderBottom: "1px solid var(--tashrif-border-cell)",
                        }}
                        className="px-4 py-4 sm:px-6"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p
                              style={{ color: "var(--tashrif-accent)" }}
                              className="font-mono-tabular text-[11px] font-bold tracking-wider uppercase"
                            >
                              SURAH KE-{suratDetail.nomor} · {suratDetail.tempatTurun.toUpperCase()} ·{" "}
                              {suratDetail.jumlahAyat} AYAT
                            </p>
                            <h2
                              style={{ color: "var(--tashrif-ink)" }}
                              className="font-display mt-0.5 text-xl font-semibold sm:text-2xl"
                            >
                              {suratDetail.namaLatin} ·{" "}
                              <span className="font-arabic">{suratDetail.nama}</span>
                            </h2>
                          </div>
                          <button
                            type="button"
                            onClick={() => onChangeTab("tafsir", suratDetail.nomor)}
                            style={{
                              border: "1px solid var(--tashrif-border-cell)",
                              backgroundColor: "var(--tashrif-paper)",
                              color: "var(--tashrif-text)",
                            }}
                            className="min-h-[36px] rounded-lg px-3 text-xs font-bold transition-colors hover:opacity-90"
                          >
                            Lihat Tafsir Surah Ini
                          </button>
                        </div>

                        {/* Audio Murattal Player Card */}
                        <div
                          style={{
                            border: "1px solid var(--tashrif-border-cell)",
                            backgroundColor: "var(--tashrif-paper)",
                          }}
                          className="mt-4 rounded-xl p-3.5 sm:p-4"
                        >
                          <div
                            style={{ borderBottom: "1px solid var(--tashrif-border-cell)" }}
                            className="flex flex-wrap items-center justify-between gap-2 pb-2.5"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                style={{
                                  backgroundColor: "var(--tashrif-btn-bg)",
                                  color: "var(--tashrif-btn-text)",
                                }}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                              >
                                <Volume2 className="h-3.5 w-3.5" />
                              </span>
                              <div>
                                <p
                                  style={{ color: "var(--tashrif-ink)" }}
                                  className="text-xs font-bold"
                                >
                                  Pemutar Murattal
                                </p>
                                <p style={{ color: "var(--tashrif-muted)" }} className="text-[11px]">
                                  {isPlaying ? "Sedang diputar" : "Audio satu surah penuh"}
                                </p>
                              </div>
                            </div>

                            <div
                              style={{ color: "var(--tashrif-text)" }}
                              className="flex items-center gap-3 text-xs font-semibold"
                            >
                              <label className="inline-flex cursor-pointer items-center gap-1.5">
                                <input
                                  type="checkbox"
                                  checked={showLatin}
                                  onChange={(e) => setShowLatin(e.target.checked)}
                                  className="h-4 w-4 accent-[var(--theme-primary)]"
                                />
                                <span>Latin</span>
                              </label>
                              <label className="inline-flex cursor-pointer items-center gap-1.5">
                                <input
                                  type="checkbox"
                                  checked={showTranslation}
                                  onChange={(e) => setShowTranslation(e.target.checked)}
                                  className="h-4 w-4 accent-[var(--theme-primary)]"
                                />
                                <span>Terjemahan</span>
                              </label>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <ThemedSelect
                              className="w-full sm:flex-1"
                              ariaLabel="Pilih qari"
                              kickerLabel="Pilih Qari Murattal"
                              value={qariId}
                              onChange={(val) => setQariId(String(val))}
                              options={QARIS.map(([id, name]) => ({
                                value: id,
                                label: `Qari: ${name}`,
                              }))}
                            />

                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isPlaying) {
                                    audioRef.current?.pause();
                                    setIsPlaying(false);
                                  } else {
                                    handlePlay();
                                  }
                                }}
                                style={{
                                  backgroundColor: "var(--tashrif-btn-bg)",
                                  color: "var(--tashrif-btn-text)",
                                }}
                                className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-bold whitespace-nowrap transition-colors hover:opacity-90 sm:flex-none"
                              >
                                {isPlaying ? (
                                  <>
                                    <Pause className="h-3.5 w-3.5 shrink-0" />
                                    <span>Jeda</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-3.5 w-3.5 shrink-0" />
                                    <span>Putar Surah</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                disabled={!hasSrc}
                                onClick={() => {
                                  const audio = audioRef.current;
                                  if (!audio) return;
                                  audio.pause();
                                  audio.currentTime = 0;
                                  setIsPlaying(false);
                                }}
                                aria-label="Hentikan audio"
                                style={{
                                  border: "1px solid var(--tashrif-border-cell)",
                                  backgroundColor: "var(--tashrif-paper)",
                                  color: "var(--tashrif-text)",
                                }}
                                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold whitespace-nowrap transition-colors hover:opacity-90 disabled:opacity-45"
                              >
                                <Square className="h-3.5 w-3.5 shrink-0" />
                                <span>Stop</span>
                              </button>
                            </div>
                          </div>

                          <audio
                            ref={audioRef}
                            controls
                            preload="metadata"
                            aria-label="Pemutar murattal satu surah"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => setIsPlaying(false)}
                            onError={() => {
                              if (audioRef.current?.src) {
                                setAudioStatus(
                                  "Rekaman murattal gagal dimuat. Periksa koneksi internet atau pilih qari lain."
                                );
                              }
                            }}
                            className="mt-3 h-9 w-full"
                          />
                          <p style={{ color: "var(--tashrif-muted)" }} className="mt-1.5 text-[11px]">
                            {audioStatus}
                          </p>
                        </div>
                      </div>

                      {/* Daftar Ayat */}
                      <div>
                        {(suratDetail.ayat || []).map((ayat) => {
                          const isBookmarked =
                            lastRead?.surahNumber === suratDetail.nomor &&
                            lastRead?.ayatNumber === ayat.nomorAyat;
                          const copyKey = `ayat-${suratDetail.nomor}-${ayat.nomorAyat}`;
                          const isCopied = copiedId === copyKey;
                          return (
                            <div
                              key={ayat.nomorAyat}
                              id={`ayat-${ayat.nomorAyat}`}
                              style={{
                                borderBottom: "1px solid var(--tashrif-border-cell)",
                                backgroundColor: isBookmarked
                                  ? "var(--tashrif-row-alt)"
                                  : "transparent",
                              }}
                              className="last:border-b-0"
                            >
                              <div className="px-4 py-4 sm:px-6">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span
                                    style={{
                                      backgroundColor: "var(--tashrif-wazan-bg)",
                                      border: "1px solid var(--tashrif-border-cell)",
                                      color: "var(--tashrif-accent)",
                                    }}
                                    className="inline-block rounded px-2 py-0.5 font-mono-tabular text-[11px] font-bold"
                                  >
                                    Ayat {ayat.nomorAyat}
                                  </span>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        copyText(
                                          copyKey,
                                          [
                                            `QS. ${suratDetail.namaLatin} : ${ayat.nomorAyat}`,
                                            ayat.teksArab,
                                            ayat.teksLatin,
                                            ayat.teksIndonesia,
                                          ].join("\n\n")
                                        )
                                      }
                                      style={{
                                        border: "1px solid var(--tashrif-border-cell)",
                                        backgroundColor: "var(--tashrif-row-alt)",
                                        color: "var(--tashrif-text)",
                                      }}
                                      className="inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition-colors hover:opacity-90"
                                    >
                                      {isCopied ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                      <span>{isCopied ? "Tersalin" : "Salin"}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleBookmarkAyat(ayat.nomorAyat)}
                                      style={
                                        isBookmarked
                                          ? {
                                              backgroundColor: "var(--tashrif-btn-bg)",
                                              color: "var(--tashrif-btn-text)",
                                            }
                                          : {
                                              border: "1px solid var(--tashrif-border-cell)",
                                              backgroundColor: "var(--tashrif-row-alt)",
                                              color: "var(--tashrif-text)",
                                            }
                                      }
                                      className="inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition-colors hover:opacity-90"
                                    >
                                      {isBookmarked ? (
                                        <BookmarkCheck className="h-3 w-3" />
                                      ) : (
                                        <Bookmark className="h-3 w-3" />
                                      )}
                                      <span>{isBookmarked ? "Terakhir dibaca" : "Tandai"}</span>
                                    </button>
                                  </div>
                                </div>

                                <p
                                  lang="ar"
                                  dir="rtl"
                                  style={{ color: "var(--tashrif-ink)" }}
                                  className="arabic-reader-text mt-3 text-right"
                                >
                                  {ayat.teksArab}
                                </p>
                              </div>

                              {(showLatin || showTranslation) && (
                                <div
                                  style={{
                                    borderTop: "1px dashed var(--tashrif-group-break)",
                                    backgroundColor: "var(--tashrif-wazan-bg)",
                                  }}
                                  className="space-y-1.5 px-4 py-3 sm:px-6"
                                >
                                  {showLatin && (
                                    <p
                                      style={{ color: "var(--tashrif-muted)" }}
                                      className="latin-reader-text italic"
                                    >
                                      {ayat.teksLatin}
                                    </p>
                                  )}
                                  {showTranslation && (
                                    <p
                                      style={{ color: "var(--tashrif-text)" }}
                                      className="prose-reader-text font-medium"
                                    >
                                      <span
                                        style={{ color: "var(--tashrif-accent)" }}
                                        className="mr-1.5 font-mono-tabular font-bold"
                                      >
                                        [{ayat.nomorAyat}]
                                      </span>
                                      {ayat.teksIndonesia}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {!detailLoading && !detailError && activeTab === "tafsir" && tafsirDetail && (
                    <>
                      {/* Tinted Tafsir Header Band */}
                      <div
                        style={{
                          backgroundColor: "var(--tashrif-wazan-bg)",
                          borderBottom: "1px solid var(--tashrif-border-cell)",
                        }}
                        className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-6"
                      >
                        <div>
                          <p
                            style={{ color: "var(--tashrif-accent)" }}
                            className="font-mono-tabular text-[11px] font-bold tracking-wider uppercase"
                          >
                            TAFSIR AL-QUR’AN · SURAH KE-{effectiveSurahNumber}
                          </p>
                          <h2
                            style={{ color: "var(--tashrif-ink)" }}
                            className="font-display mt-0.5 text-xl font-semibold sm:text-2xl"
                          >
                            {tafsirDetail.namaLatin || `Tafsir Surah ${effectiveSurahNumber}`}
                          </h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => onChangeTab("quran", effectiveSurahNumber)}
                          style={{
                            border: "1px solid var(--tashrif-border-cell)",
                            backgroundColor: "var(--tashrif-paper)",
                            color: "var(--tashrif-text)",
                          }}
                          className="min-h-[36px] rounded-lg px-3 text-xs font-bold transition-colors hover:opacity-90"
                        >
                          Buka Ayat &amp; Murattal
                        </button>
                      </div>

                      <div>
                        {(tafsirDetail.tafsir || []).map((item, idx) => {
                          const copyKey = `tafsir-${effectiveSurahNumber}-${idx}`;
                          const isCopied = copiedId === copyKey;
                          const bodyText = item.teks || item.tafsir || "";
                          return (
                            <div
                              key={idx}
                              style={{ borderBottom: "1px solid var(--tashrif-border-cell)" }}
                              className="px-4 py-4 last:border-b-0 sm:px-6"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  style={{
                                    backgroundColor: "var(--tashrif-wazan-bg)",
                                    border: "1px solid var(--tashrif-border-cell)",
                                    color: "var(--tashrif-accent)",
                                  }}
                                  className="inline-block rounded px-2 py-0.5 font-mono-tabular text-[11px] font-bold"
                                >
                                  {item.ayat ? `Ayat ${item.ayat}` : "Tafsir"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyText(
                                      copyKey,
                                      `Tafsir ${tafsirDetail.namaLatin} ${
                                        item.ayat ? `Ayat ${item.ayat}` : ""
                                      }\n\n${bodyText}`
                                    )
                                  }
                                  style={{
                                    border: "1px solid var(--tashrif-border-cell)",
                                    backgroundColor: "var(--tashrif-row-alt)",
                                    color: "var(--tashrif-text)",
                                  }}
                                  className="inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition-colors hover:opacity-90"
                                >
                                  {isCopied ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                  <span>{isCopied ? "Tersalin" : "Salin"}</span>
                                </button>
                              </div>
                              <p
                                style={{ color: "var(--tashrif-text)" }}
                                className="prose-reader-text mt-2.5 whitespace-pre-wrap"
                              >
                                {bodyText}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </article>
              )}

              {effectiveSurahNumber && (
                <FloatingPageNav
                  onPrev={() => onChangeTab(activeTab, effectiveSurahNumber - 1)}
                  onNext={() => onChangeTab(activeTab, effectiveSurahNumber + 1)}
                  canPrev={effectiveSurahNumber > 1}
                  canNext={effectiveSurahNumber < 114}
                  prevLabel="Surah Sebelumnya"
                  nextLabel="Surah Berikutnya"
                  centerText={`${effectiveSurahNumber} / 114`}
                  ariaLabel="Navigasi antar surah"
                />
              )}
            </section>
          </div>
        )}

        <FooterDisclaimer variant="compact" />
      </div>
    </div>
  );
};
