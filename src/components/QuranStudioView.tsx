import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
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
import { FooterDisclaimer } from "./FooterDisclaimer";

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
  const [doaQuery, setDoaQuery] = useState("");
  const [doaFilter, setDoaFilter] = useState<"all" | "saved">("all");
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
    setDoaLoading(true);
    equranFetch<EQuranDoaItem[]>(`${EQURAN_API}/doa`)
      .then((data) => {
        if (!active || !Array.isArray(data) || data.length === 0) return;
        const seen = new Set(CURATED_DAILY_PRAYERS.map((d) => normalizeDoaTitle(d.nama)));
        const extras = data.filter((item) => {
          const norm = normalizeDoaTitle(item.nama);
          if (!norm || seen.has(norm)) return false;
          seen.add(norm);
          return true;
        });
        if (extras.length > 0) {
          setDoaItems([...CURATED_DAILY_PRAYERS, ...extras]);
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
    if (!pendingScrollAyatRef.current) {
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      if (!q) return true;
      return [item.nama, item.grup, item.idn, item.tr, ...(item.tag || [])]
        .join(" ")
        .toLocaleLowerCase("id")
        .includes(q);
    });
  }, [doaItems, doaQuery, doaFilter, doaBookmarks]);

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
        const matchIdx = filteredDoa.findIndex((d) => normalizeDoaTitle(d.nama) === target);
        if (matchIdx >= 0) {
          setDoaFilter("all");
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

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 pt-4 sm:px-6">
      {/* Studio Header + Segmented Mode Tabs */}
      <div className="flex flex-col justify-between gap-3 border-b border-[#e2e8e4] pb-4 md:flex-row md:items-end dark:border-slate-800">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
            Studio Ibadah
          </p>
          <h1 className="font-display mt-0.5 text-xl font-semibold text-[#103d2c] sm:text-2xl dark:text-white">
            Al-Qur’an, Dzikir &amp; Do'a
          </h1>
        </div>

        <div
          className="no-scrollbar flex max-w-full overflow-x-auto rounded-xl border border-[#dce4df] bg-[#ffffff] p-1 dark:border-slate-800 dark:bg-[#111A27]"
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
                className={`min-h-[36px] flex-1 rounded-lg px-2.5 text-xs font-semibold whitespace-nowrap transition-colors sm:flex-none sm:px-3.5 ${
                  active
                    ? "bg-[#134a35] text-[#ffffff] dark:bg-[#E2B354] dark:text-[#0B111A]"
                    : "text-[#354c3e] hover:text-[#103d2c] dark:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Last-read Quran Resume Strip */}
      {isSurahMode && lastRead && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e2e8e4] bg-[#ffffff] px-4 py-2.5 dark:border-slate-800 dark:bg-[#111A27]">
          <div className="flex items-center gap-2 text-xs text-[#1d2c24] dark:text-slate-200">
            <BookmarkCheck className="h-4 w-4 shrink-0 text-[#134a35] dark:text-[#E2B354]" />
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
            className="min-h-[34px] rounded-lg bg-[#134a35] px-3 text-xs font-semibold text-[#ffffff] hover:bg-[#0e3928] dark:bg-[#E2B354] dark:text-[#0B111A]"
          >
            Lanjut ke Ayat {lastRead.ayatNumber}
          </button>
        </div>
      )}

      {/* Do'a Harian Paginated Studio View */}
      {activeTab === "doa" && (
        <div className="space-y-3.5">
          {/* Compact Filter & Directory Trigger Bar */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-[#e2e8e4] bg-[#ffffff] p-3 shadow-xs md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-[#111A27]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-semibold text-[#103d2c] sm:text-lg dark:text-white">
                  Do'a Harian
                </h2>
                <span className="font-mono-tabular text-[11px] font-semibold text-[#7c745f] dark:text-slate-400">
                  ({filteredDoa.length})
                </span>
                {doaLoading && (
                  <span className="text-[11px] font-medium text-[#7c745f] dark:text-slate-400">
                    · Menyelaraskan…
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setDoaDrawerOpen(true)}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-xl border border-[#dce4df] bg-[#f4f7f5] px-2.5 text-xs font-semibold text-[#174231] lg:hidden dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
              >
                <List className="h-3.5 w-3.5" />
                <span>Daftar Do'a</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">

              <div className="inline-flex rounded-xl border border-[#dce4df] bg-[#f4f7f5] p-0.5 dark:border-slate-700 dark:bg-[#162131]">
                <button
                  type="button"
                  onClick={() => {
                    setDoaFilter("all");
                    setActiveDoaIndex(0);
                    setDoaTurnDir("fade");
                  }}
                  className={`min-h-[34px] rounded-lg px-2.5 text-xs font-semibold ${
                    doaFilter === "all"
                      ? "bg-[#134a35] text-[#ffffff] dark:bg-[#E2B354] dark:text-[#0B111A]"
                      : "text-[#354c3e] dark:text-slate-300"
                  }`}
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
                  className={`min-h-[34px] rounded-lg px-2.5 text-xs font-semibold ${
                    doaFilter === "saved"
                      ? "bg-[#134a35] text-[#ffffff] dark:bg-[#E2B354] dark:text-[#0B111A]"
                      : "text-[#354c3e] dark:text-slate-300"
                  }`}
                >
                  Tersimpan ({doaBookmarks.length})
                </button>
              </div>

              <label className="relative flex min-h-[38px] w-full items-center md:w-60">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#7c745f] dark:text-slate-400" />
                <input
                  type="search"
                  value={doaQuery}
                  onChange={(e) => {
                    setDoaQuery(e.target.value);
                    setActiveDoaIndex(0);
                    setDoaTurnDir("fade");
                  }}
                  placeholder="Cari do'a atau kategori…"
                  aria-label="Cari do'a harian"
                  className="min-h-[38px] w-full rounded-xl border border-[#dce4df] bg-white pr-3.5 pl-9 text-xs outline-none focus:border-[#134a35] sm:text-sm dark:border-slate-700 dark:bg-[#162131] dark:focus:border-[#E2B354]"
                />
              </label>
            </div>
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
              className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-[#e2e8e4] bg-[#ffffff] p-4 transition-transform duration-200 lg:sticky lg:top-20 lg:z-10 lg:max-h-[calc(100vh-110px)] lg:w-auto lg:translate-x-0 lg:rounded-2xl lg:border ${
                doaDrawerOpen ? "translate-x-0" : "-translate-x-full"
              } dark:border-slate-800 dark:bg-[#111A27]`}
            >
              <div className="flex items-start justify-between gap-2 border-b border-[#e8eeea] pb-3 dark:border-slate-800">
                <div>
                  <p className="text-[11px] font-semibold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
                    Indeks Halaman
                  </p>
                  <h3 className="font-display mt-0.5 text-base font-semibold text-[#103d2c] dark:text-white">
                    Daftar Do'a Harian
                  </h3>
                  <p className="text-xs text-[#7c745f] dark:text-slate-400">
                    {filteredDoa.length} halaman do'a
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDoaDrawerOpen(false)}
                  aria-label="Tutup daftar do'a"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dce4df] text-[#174231] lg:hidden dark:border-slate-700 dark:text-slate-300"
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
                      className={`flex min-h-[42px] w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                        isActive
                          ? "bg-[#134a35] font-semibold text-[#ffffff] dark:bg-[#1D3557]"
                          : "text-[#354c3e] hover:bg-[#edf2ef] dark:text-slate-300 dark:hover:bg-[#172334]"
                      }`}
                    >
                      <span className="font-mono-tabular shrink-0 opacity-75">
                        {String(idx + 1).padStart(2, "0")}.
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="line-clamp-2 block">{item.nama || "Do'a Harian"}</span>
                        {item.grup && (
                          <span
                            className={`mt-0.5 block truncate text-[10px] ${
                              isActive ? "text-[#e5dcc4] dark:text-slate-300" : "text-[#7c745f] dark:text-slate-400"
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
                <div className="rounded-2xl border border-[#e2e8e4] bg-[#ffffff] p-8 text-center shadow-xs dark:border-slate-800 dark:bg-[#111A27]">
                  <p className="text-sm text-[#766f5d] dark:text-slate-400">
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
                        className={`scroll-mt-20 rounded-2xl border border-[#b7d3c3] bg-[#ffffff] p-5 shadow-sm ring-1 ring-[#134a35]/10 sm:p-7 dark:border-[#2a4562] dark:bg-[#111A27] dark:ring-[#E2B354]/15 page-enter-${doaTurnDir}`}
                      >
                        <div className="border-b border-[#e8eeea] pb-4 dark:border-slate-800">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-[#7c745f] dark:text-slate-400">
                                <span className="font-semibold text-[#9c7d3c] dark:text-[#E2B354]">
                                  {activeDoa.grup || "Do'a Harian"}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>
                                  Halaman {safeDoaIndex + 1} dari {filteredDoa.length}
                                </span>
                              </div>
                              <h3 className="font-display mt-1.5 text-xl font-semibold text-[#103d2c] sm:text-2xl dark:text-white">
                                {activeDoa.nama || "Do'a Harian"}
                              </h3>
                              {activeDoa.tentang && (
                                <p className="mt-1 text-xs text-[#7c745f] dark:text-slate-400">
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
                                    [activeDoa.nama, activeDoa.ar, activeDoa.tr, activeDoa.idn]
                                      .filter(Boolean)
                                      .join("\n\n")
                                  )
                                }
                                className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-[#dce4df] bg-[#f4f7f5] px-3 text-xs font-semibold text-[#174231] hover:bg-[#e6ede9] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
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
                                className={`inline-flex min-h-[36px] items-center gap-1 rounded-xl px-3 text-xs font-semibold ${
                                  isSaved
                                    ? "bg-[#134a35] text-[#ffffff] dark:bg-[#E2B354] dark:text-[#0B111A]"
                                    : "border border-[#dce4df] bg-[#f4f7f5] text-[#174231] hover:bg-[#e6ede9] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
                                }`}
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

                        {activeDoa.ar && (
                          <p
                            lang="ar"
                            dir="rtl"
                            className="arabic-classic-text mt-6 whitespace-pre-wrap text-right text-[#1c2b23] dark:text-[#EDF2F7]"
                          >
                            {activeDoa.ar}
                          </p>
                        )}
                        {activeDoa.tr && (
                          <p className="latin-reader-text mt-5 whitespace-pre-wrap text-[#7a6d56] italic dark:text-slate-400">
                            {activeDoa.tr}
                          </p>
                        )}
                        {activeDoa.idn && (
                          <p className="prose-reader-text mt-3 whitespace-pre-wrap text-[#2e3e34] dark:text-slate-300">
                            {activeDoa.idn}
                          </p>
                        )}
                      </article>

                      <nav
                        aria-label="Navigasi halaman do'a harian"
                        className="sticky bottom-3 z-20 mt-4 flex items-center justify-between gap-2 rounded-2xl border border-[#dce4df]/90 bg-[#ffffff]/95 p-2 shadow-lg backdrop-blur-md dark:border-slate-700/90 dark:bg-[#111A27]/95"
                      >
                        <button
                          type="button"
                          disabled={safeDoaIndex === 0}
                          onClick={() => goToDoa(safeDoaIndex - 1)}
                          className="inline-flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#dce4df] bg-[#ffffff] px-3 text-xs font-semibold text-[#174231] transition-colors hover:bg-[#edf2ef] disabled:opacity-40 dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200 dark:hover:bg-[#1E2C40]"
                        >
                          <ChevronLeft className="h-4 w-4 shrink-0" />
                          <span className="truncate">Do'a Sebelumnya</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.matchMedia("(min-width: 1024px)").matches) return;
                            setDoaDrawerOpen(true);
                          }}
                          aria-label="Buka daftar do'a harian"
                          className="font-mono-tabular inline-flex min-h-[42px] shrink-0 items-center justify-center rounded-xl px-2.5 text-xs font-semibold text-[#6f6652] transition-colors hover:bg-[#edf2ef] lg:cursor-default lg:hover:bg-transparent dark:text-slate-300 dark:hover:bg-[#162131] dark:lg:hover:bg-transparent"
                        >
                          {safeDoaIndex + 1} / {filteredDoa.length}
                        </button>

                        <button
                          type="button"
                          disabled={safeDoaIndex + 1 >= filteredDoa.length}
                          onClick={() => goToDoa(safeDoaIndex + 1)}
                          className="inline-flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#134a35] px-3 text-xs font-semibold text-[#ffffff] transition-colors hover:bg-[#0e3928] disabled:opacity-40 dark:bg-[#E2B354] dark:text-[#0B111A]"
                        >
                          <span className="truncate">Do'a Berikutnya</span>
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        </button>
                      </nav>
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
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-[#e2e8e4] bg-[#ffffff] p-3 shadow-xs sm:px-4 dark:border-slate-800 dark:bg-[#111A27]">
            <div>
              <h2 className="font-display text-base font-semibold text-[#103d2c] sm:text-lg dark:text-white">
                {activeTab === "dzikir" ? "Dzikir Ba'da Shalat" : "Rangkaian Tahlil"}
              </h2>
              <p className="text-xs text-[#606c64] dark:text-slate-400">
                Halaman {safeClassicIndex + 1} dari {classicPages.length} · Geser kanan/kiri untuk pindah
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setClassicDrawerOpen(true)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#dce4df] bg-[#f4f7f5] px-3 text-xs font-semibold text-[#174231] lg:hidden dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
              >
                <List className="h-3.5 w-3.5" />
                <span>Daftar</span>
              </button>

              {onOpenClassicCollection && (
                <button
                  type="button"
                  onClick={() => onOpenClassicCollection(activeTab)}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#134a35]/25 bg-[#ebf5ef] px-3 text-xs font-semibold text-[#134a35] transition-colors hover:bg-[#dceee3] dark:border-[#E2B354]/30 dark:bg-[#18283B] dark:text-[#E2B354]"
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
              className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-[#e2e8e4] bg-[#ffffff] p-4 transition-transform duration-200 lg:sticky lg:top-20 lg:z-10 lg:max-h-[calc(100vh-110px)] lg:w-auto lg:translate-x-0 lg:rounded-2xl lg:border ${
                classicDrawerOpen ? "translate-x-0" : "-translate-x-full"
              } dark:border-slate-800 dark:bg-[#111A27]`}
            >
              <div className="flex items-start justify-between gap-2 border-b border-[#e8eeea] pb-3 dark:border-slate-800">
                <div>
                  <p className="text-[11px] font-semibold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
                    Urutan Bacaan
                  </p>
                  <h3 className="font-display mt-0.5 text-base font-semibold text-[#103d2c] dark:text-white">
                    {activeTab === "dzikir" ? "Daftar Halaman Dzikir" : "Daftar Bagian Tahlil"}
                  </h3>
                  <p className="text-xs text-[#7c745f] dark:text-slate-400">
                    {classicPages.length} halaman
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setClassicDrawerOpen(false)}
                  aria-label="Tutup daftar bacaan"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dce4df] text-[#174231] lg:hidden dark:border-slate-700 dark:text-slate-300"
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
                      className={`flex min-h-[42px] w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                        isActive
                          ? "bg-[#134a35] font-semibold text-[#ffffff] dark:bg-[#1D3557]"
                          : "text-[#354c3e] hover:bg-[#edf2ef] dark:text-slate-300 dark:hover:bg-[#172334]"
                      }`}
                    >
                      <span className="font-mono-tabular shrink-0 opacity-75">
                        {String(idx + 1).padStart(2, "0")}.
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="line-clamp-2 block">{itemLabel}</span>
                        {activeTab === "dzikir" && (
                          <span
                            dir="rtl"
                            className={`font-arabic mt-0.5 block truncate text-xs ${
                              isActive
                                ? "text-[#e5dcc4] dark:text-slate-300"
                                : "text-[#7c745f] dark:text-slate-400"
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
                    className={`scroll-mt-20 rounded-2xl border border-[#b7d3c3] bg-[#ffffff] p-5 shadow-sm ring-1 ring-[#134a35]/10 sm:p-8 dark:border-[#2a4562] dark:bg-[#111A27] dark:ring-[#E2B354]/15 page-enter-${classicTurnDir}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e8eeea] pb-4 dark:border-slate-800">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#9c7d3c] dark:text-[#E2B354]">
                          {activeClassicPage.subtitle || activeTab.toUpperCase()} ·{" "}
                          {safeClassicIndex + 1} / {classicPages.length}
                        </p>
                        <h3 className="font-display mt-1 text-xl font-semibold text-[#103d2c] sm:text-2xl dark:text-white">
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
                        className="inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-xl border border-[#dce4df] bg-[#f4f7f5] px-3 text-xs font-semibold text-[#174231] hover:bg-[#e6ede9] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
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
                      lang="ar"
                      dir="rtl"
                      className="arabic-classic-text mt-6 whitespace-pre-wrap text-right text-[#1c2b23] dark:text-[#EDF2F7]"
                    >
                      {activeClassicPage.text}
                    </div>
                  </article>

                  <nav
                    aria-label="Navigasi halaman bacaan"
                    className="sticky bottom-3 z-20 mt-4 flex items-center justify-between gap-2 rounded-2xl border border-[#dce4df]/90 bg-[#ffffff]/95 p-2 shadow-lg backdrop-blur-md dark:border-slate-700/90 dark:bg-[#111A27]/95"
                  >
                    <button
                      type="button"
                      disabled={safeClassicIndex === 0}
                      onClick={() => goToClassic(safeClassicIndex - 1)}
                      className="inline-flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#dce4df] bg-[#ffffff] px-3 text-xs font-semibold text-[#174231] transition-colors hover:bg-[#edf2ef] disabled:opacity-40 dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200 dark:hover:bg-[#1E2C40]"
                    >
                      <ChevronLeft className="h-4 w-4 shrink-0" />
                      <span className="truncate">Sebelumnya</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.matchMedia("(min-width: 1024px)").matches) return;
                        setClassicDrawerOpen(true);
                      }}
                      aria-label="Buka daftar halaman"
                      className="font-mono-tabular inline-flex min-h-[42px] shrink-0 items-center justify-center rounded-xl px-2.5 text-xs font-semibold text-[#6f6652] transition-colors hover:bg-[#edf2ef] lg:cursor-default lg:hover:bg-transparent dark:text-slate-300 dark:hover:bg-[#162131] dark:lg:hover:bg-transparent"
                    >
                      {safeClassicIndex + 1} / {classicPages.length}
                    </button>

                    <button
                      type="button"
                      disabled={safeClassicIndex + 1 >= classicPages.length}
                      onClick={() => goToClassic(safeClassicIndex + 1)}
                      className="inline-flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#134a35] px-3 text-xs font-semibold text-[#ffffff] transition-colors hover:bg-[#0e3928] disabled:opacity-40 dark:bg-[#E2B354] dark:text-[#0B111A]"
                    >
                      <span className="truncate">Berikutnya</span>
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </button>
                  </nav>
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
            className={`${
              effectiveSurahNumber ? "hidden lg:flex" : "flex"
            } max-h-[75vh] flex-col rounded-2xl border border-[#e2e8e4] bg-[#ffffff] p-3.5 lg:sticky lg:top-20 dark:border-slate-800 dark:bg-[#111A27]`}
          >
            <label className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#7c745f] dark:text-slate-400" />
              <input
                type="search"
                value={surahQuery}
                onChange={(e) => setSurahQuery(e.target.value)}
                placeholder="Cari surah (1–114)…"
                aria-label="Cari surah"
                className="min-h-[38px] w-full rounded-xl border border-[#dce4df] bg-white pr-3 pl-9 text-xs outline-none focus:border-[#134a35] dark:border-slate-700 dark:bg-[#162131] dark:focus:border-[#E2B354]"
              />
            </label>

            {listLoading && <p className="py-8 text-center text-xs text-[#766f5d] dark:text-slate-400">Memuat daftar surah…</p>}
            {listError && <p className="py-8 text-center text-xs text-red-700 dark:text-red-400">{listError}</p>}

            <div className="mt-2.5 flex-1 space-y-1 overflow-y-auto pr-1">
              {filteredSurahs.map((s) => {
                const isSelected = effectiveSurahNumber === s.nomor;
                return (
                  <button
                    key={s.nomor}
                    type="button"
                    onClick={() => onChangeTab(activeTab, s.nomor)}
                    className={`flex min-h-[46px] w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left transition-colors ${
                      isSelected
                        ? "bg-[#134a35] text-[#ffffff] dark:bg-[#1D3557]"
                        : "hover:bg-[#edf2ef] dark:hover:bg-[#162233]"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`font-mono-tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                          isSelected
                            ? "bg-white/15 text-[#e7cf96] dark:text-[#E2B354]"
                            : "bg-[#edf2ef] text-[#103d2c] dark:bg-[#1A283B] dark:text-[#E2B354]"
                        }`}
                      >
                        {s.nomor}
                      </span>
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-semibold sm:text-sm">{s.namaLatin}</span>
                        <span
                          className={`block truncate text-[11px] ${
                            isSelected ? "text-[#e5dcc4] dark:text-slate-300" : "text-[#7c745f] dark:text-slate-400"
                          }`}
                        >
                          {s.arti} · {s.jumlahAyat} ayat
                        </span>
                      </div>
                    </div>
                    <span className="font-arabic shrink-0 text-base opacity-85">{s.nama}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Pane: Active Surah or Tafsir Detail */}
          <section className={`${!effectiveSurahNumber ? "hidden lg:block" : "block"} min-w-0`}>
            {!effectiveSurahNumber ? (
              <div className="rounded-2xl border border-dashed border-[#cbd6cf] bg-[#ffffff] p-10 text-center dark:border-slate-700 dark:bg-[#111A27]">
                <p className="font-arabic text-3xl text-[#9c7d3c] dark:text-[#E2B354]">
                  بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
                </p>
                <h2 className="font-display mt-3 text-lg font-semibold text-[#103d2c] dark:text-white">
                  Pilih surah dari daftar di samping
                </h2>
                <p className="mt-1 text-xs text-[#646053] sm:text-sm dark:text-slate-400">
                  Baca ayat Al-Qur’an, dengarkan murattal dari 6 qari, atau pelajari tafsirnya.
                </p>
              </div>
            ) : (
              <article
                key={`${activeTab}-${effectiveSurahNumber}-${detailLoading ? "loading" : "ready"}`}
                className={`rounded-2xl border border-[#e2e8e4] bg-[#ffffff] p-5 shadow-xs sm:p-7 dark:border-slate-800 dark:bg-[#111A27] page-enter-${
                  detailLoading ? "fade" : surahTurnDir
                }`}
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 lg:hidden">
                  <button
                    type="button"
                    onClick={() => onChangeTab(activeTab, undefined)}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#dce4df] bg-[#f4f7f5] px-3 text-xs font-semibold text-[#174231] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Daftar Surah</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={effectiveSurahNumber <= 1}
                      onClick={() => onChangeTab(activeTab, effectiveSurahNumber - 1)}
                      aria-label="Surah sebelumnya"
                      title="Surah sebelumnya"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dce4df] bg-[#f4f7f5] text-[#174231] hover:bg-[#e6ede9] disabled:opacity-35 dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={effectiveSurahNumber >= 114}
                      onClick={() => onChangeTab(activeTab, effectiveSurahNumber + 1)}
                      aria-label="Surah berikutnya"
                      title="Surah berikutnya"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#134a35] text-[#ffffff] hover:bg-[#0e3928] disabled:opacity-35 dark:bg-[#E2B354] dark:text-[#0B111A]"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {detailLoading && <p className="py-10 text-center text-sm text-[#766f5d] dark:text-slate-400">Memuat data…</p>}
                {detailError && (
                  <p className="py-10 text-center text-sm text-red-700 dark:text-red-400">{detailError}</p>
                )}

                {!detailLoading && !detailError && activeTab === "quran" && suratDetail && (
                  <>
                    <div className="border-b border-[#e8eeea] pb-4 dark:border-slate-800">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-[#7c745f] dark:text-slate-400">
                            {suratDetail.tempatTurun} · {suratDetail.jumlahAyat} ayat
                          </p>
                          <h2 className="font-display mt-0.5 text-xl font-semibold text-[#103d2c] sm:text-2xl dark:text-white">
                            {suratDetail.namaLatin} · <span className="font-arabic">{suratDetail.nama}</span>
                          </h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => onChangeTab("tafsir", suratDetail.nomor)}
                          className="min-h-[36px] rounded-xl border border-[#dce4df] bg-[#f4f7f5] px-3 text-xs font-semibold text-[#174231] hover:bg-[#e6ede9] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
                        >
                          Lihat Tafsir Surah Ini
                        </button>
                      </div>

                      {/* Audio Murattal Player Card (Neatly Organized 2-Row Layout) */}
                      <div className="mt-4 rounded-2xl border border-[#dce4df] bg-[#f8fbf9] p-3.5 sm:p-4 dark:border-slate-800 dark:bg-[#162131]">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e4ece7] pb-2.5 dark:border-slate-700/70">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#134a35] text-white dark:bg-[#E2B354] dark:text-[#0B111A]">
                              <Volume2 className="h-3.5 w-3.5" />
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-[#103d2c] dark:text-white">
                                Pemutar Murattal
                              </p>
                              <p className="text-[11px] text-[#606c64] dark:text-slate-400">
                                {isPlaying ? "Sedang diputar" : "Audio satu surah penuh"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-medium text-[#354c3e] dark:text-slate-300">
                            <label className="inline-flex cursor-pointer items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={showLatin}
                                onChange={(e) => setShowLatin(e.target.checked)}
                                className="h-4 w-4 accent-[#134a35] dark:accent-[#E2B354]"
                              />
                              <span>Latin</span>
                            </label>
                            <label className="inline-flex cursor-pointer items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={showTranslation}
                                onChange={(e) => setShowTranslation(e.target.checked)}
                                className="h-4 w-4 accent-[#134a35] dark:accent-[#E2B354]"
                              />
                              <span>Terjemahan</span>
                            </label>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <select
                            value={qariId}
                            onChange={(e) => setQariId(e.target.value)}
                            aria-label="Pilih qari"
                            className="min-h-[38px] w-full flex-1 rounded-xl border border-[#dce4df] bg-white px-3 text-xs font-medium text-[#1d2c24] outline-none focus:border-[#134a35] dark:border-slate-700 dark:bg-[#111A27] dark:text-slate-100"
                          >
                            {QARIS.map(([id, name]) => (
                              <option key={id} value={id}>
                                Qari: {name}
                              </option>
                            ))}
                          </select>

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
                              className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#134a35] px-4 text-xs font-semibold text-[#ffffff] whitespace-nowrap transition-colors hover:bg-[#0e3928] sm:flex-none dark:bg-[#E2B354] dark:text-[#0B111A]"
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
                              className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-[#dce4df] bg-[#ffffff] px-3 text-xs font-semibold text-[#174231] whitespace-nowrap transition-colors hover:bg-[#edf2ef] disabled:opacity-45 dark:border-slate-700 dark:bg-[#111A27] dark:text-slate-200"
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
                        <p className="mt-1.5 text-[11px] text-[#606c64] dark:text-slate-400">
                          {audioStatus}
                        </p>
                      </div>
                    </div>

                    <div className="divide-y divide-[#e8eeea] dark:divide-slate-800">
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
                            className={`py-4 ${
                              isBookmarked
                                ? "rounded-xl bg-[#f4f7f5]/60 px-3 dark:bg-[#172334]/60"
                                : ""
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-mono-tabular text-xs font-semibold text-[#95763a] dark:text-[#E2B354]">
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
                                  className="inline-flex min-h-[30px] items-center gap-1 rounded-lg border border-[#dce4df] bg-[#f4f7f5] px-2 text-[11px] font-semibold text-[#174231] hover:bg-[#e6ede9] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
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
                                  className={`inline-flex min-h-[30px] items-center gap-1 rounded-lg px-2 text-[11px] font-semibold ${
                                    isBookmarked
                                      ? "bg-[#134a35] text-[#ffffff] dark:bg-[#E2B354] dark:text-[#0B111A]"
                                      : "border border-[#dce4df] bg-[#f4f7f5] text-[#174231] hover:bg-[#e6ede9] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
                                  }`}
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
                              className="arabic-reader-text mt-3 text-right text-[#1c2b23] dark:text-[#EDF2F7]"
                            >
                              {ayat.teksArab}
                            </p>
                            {showLatin && (
                              <p className="latin-reader-text mt-2.5 text-[#7a6d56] italic dark:text-slate-400">
                                {ayat.teksLatin}
                              </p>
                            )}
                            {showTranslation && (
                              <p className="prose-reader-text mt-1.5 text-[#2e3e34] dark:text-slate-300">
                                {ayat.teksIndonesia}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {!detailLoading && !detailError && activeTab === "tafsir" && tafsirDetail && (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e8eeea] pb-4 dark:border-slate-800">
                      <div>
                        <p className="text-xs text-[#7c745f] dark:text-slate-400">Tafsir Al-Qur’an</p>
                        <h2 className="font-display mt-0.5 text-xl font-semibold text-[#103d2c] sm:text-2xl dark:text-white">
                          {tafsirDetail.namaLatin || `Tafsir Surah ${effectiveSurahNumber}`}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => onChangeTab("quran", effectiveSurahNumber)}
                        className="min-h-[36px] rounded-xl border border-[#dce4df] bg-[#f4f7f5] px-3 text-xs font-semibold text-[#174231] hover:bg-[#e6ede9] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
                      >
                        Buka Ayat & Murattal
                      </button>
                    </div>

                    <div className="divide-y divide-[#e8eeea] dark:divide-slate-800">
                      {(tafsirDetail.tafsir || []).map((item, idx) => {
                        const copyKey = `tafsir-${effectiveSurahNumber}-${idx}`;
                        const isCopied = copiedId === copyKey;
                        const bodyText = item.teks || item.tafsir || "";
                        return (
                          <div key={idx} className="py-4">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-mono-tabular text-xs font-semibold text-[#95763a] dark:text-[#E2B354]">
                                {item.ayat ? `Ayat ${item.ayat}` : "Tafsir"}
                              </h3>
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
                                className="inline-flex min-h-[30px] items-center gap-1 rounded-lg border border-[#dce4df] bg-[#f4f7f5] px-2 text-[11px] font-semibold text-[#174231] hover:bg-[#e6ede9] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
                              >
                                {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                <span>{isCopied ? "Tersalin" : "Salin"}</span>
                              </button>
                            </div>
                            <p className="prose-reader-text mt-2 whitespace-pre-wrap text-[#2e3e34] dark:text-slate-300">
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
              <nav
                aria-label="Navigasi antar surah"
                className="sticky bottom-3 z-20 mt-4 flex items-center justify-between gap-2 rounded-2xl border border-[#dce4df]/90 bg-[#ffffff]/95 p-2 shadow-lg backdrop-blur-md dark:border-slate-700/90 dark:bg-[#111A27]/95"
              >
                <button
                  type="button"
                  disabled={effectiveSurahNumber <= 1}
                  onClick={() => onChangeTab(activeTab, effectiveSurahNumber - 1)}
                  className="inline-flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#dce4df] bg-[#ffffff] px-3 text-xs font-semibold text-[#174231] transition-colors hover:bg-[#edf2ef] disabled:opacity-40 dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200 dark:hover:bg-[#1E2C40]"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  <span className="truncate">Surah Sebelumnya</span>
                </button>

                <span className="font-mono-tabular shrink-0 px-2 text-xs font-semibold text-[#6f6652] dark:text-slate-300">
                  {effectiveSurahNumber} / 114
                </span>

                <button
                  type="button"
                  disabled={effectiveSurahNumber >= 114}
                  onClick={() => onChangeTab(activeTab, effectiveSurahNumber + 1)}
                  className="inline-flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#134a35] px-3 text-xs font-semibold text-[#ffffff] transition-colors hover:bg-[#0e3928] disabled:opacity-40 dark:bg-[#E2B354] dark:text-[#0B111A]"
                >
                  <span className="truncate">Surah Berikutnya</span>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </button>
              </nav>
            )}
          </section>
        </div>
      )}

      <FooterDisclaimer variant="compact" />
    </div>
  );
};
