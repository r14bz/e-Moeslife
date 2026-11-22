import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BookOpen, Library, Loader2, Search, Sparkles, X } from "lucide-react";
import type { ClassicSection } from "../data/sections";
import type { AppRoute, CollectionKind, LocalBookMeta } from "../types/emoeslife";
import {
  type GlobalSearchResults,
  runDeepGlobalSearch,
  runInstantGlobalSearch,
} from "../utils/globalSearch";
import { PrayerBanner } from "./PrayerBanner";
import { FooterDisclaimer } from "./FooterDisclaimer";
import {
  COLLECTION_VISUALS,
  KitabCoverMini,
  type CollectionIconId,
} from "./PesantrenCardMotifs";
import { prefetchBookIntent, prefetchRouteView } from "../utils/routePrefetch";

interface HomeViewProps {
  sections: ClassicSection[];
  continueLabel?: string;
  localBooks: LocalBookMeta[];
  apiBooks: LocalBookMeta[];
  onContinueReading?: () => void;
  onOpenCollection: (kind: CollectionKind) => void;
  onOpenSectionIndex: (sectionIndex: number) => void;
  onNavigate: (route: AppRoute) => void;
  onOpenBook: (book: LocalBookMeta, chapterIndex?: number) => void;
}

type SearchCategoryFilter = "all" | "kitab" | "guide" | "quran" | "doa" | "classic";

const QUICK_SEARCH_TOPICS: ReadonlyArray<string> = [
  "Shalat",
  "Wudhu",
  "Zakat",
  "Puasa",
  "Doa Tidur",
  "Yasin",
  "Istighfar",
  "Tahlil",
];

export const HomeView: React.FC<HomeViewProps> = ({
  sections,
  localBooks,
  apiBooks,
  onOpenCollection,
  onOpenSectionIndex,
  onNavigate,
  onOpenBook,
}) => {
  const [quickQuery, setQuickQuery] = useState("");
  const [includeHeavyBooks, setIncludeHeavyBooks] = useState(false);
  const [searchResults, setSearchResults] = useState<GlobalSearchResults | null>(null);
  const [activeFilter, setActiveFilter] = useState<SearchCategoryFilter>("all");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allBooks = useMemo(() => [...localBooks, ...apiBooks], [localBooks, apiBooks]);
  const featuredBooks = useMemo(() => allBooks.slice(0, 10), [allBooks]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const q = quickQuery.trim();
    if (!q) {
      setSearchResults(null);
      setIncludeHeavyBooks(false);
      setActiveFilter("all");
      return;
    }

    const instant = runInstantGlobalSearch({ query: q, sections, books: allBooks });
    if (q.length < 2) {
      setSearchResults({
        ...instant,
        heavyBooksSearched: false,
        searching: false,
        searchingHeavy: false,
      });
      return;
    }

    setSearchResults({
      ...instant,
      heavyBooksSearched: includeHeavyBooks,
      searching: true,
      searchingHeavy: includeHeavyBooks,
    });

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void runDeepGlobalSearch({
        query: q,
        books: allBooks,
        sections,
        includeHeavyBooks,
        signal: controller.signal,
        onUpdate: (partial) => {
          if (!controller.signal.aborted) {
            setSearchResults(partial);
          }
        },
      });
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [quickQuery, includeHeavyBooks, allBooks, sections]);

  const clearSearch = () => {
    setQuickQuery("");
    setSearchResults(null);
    setIncludeHeavyBooks(false);
    setActiveFilter("all");
    searchInputRef.current?.focus();
  };

  const trimmedQuery = quickQuery.trim();
  const totalResultCount = searchResults
    ? searchResults.kitab.length +
      searchResults.quran.length +
      searchResults.doa.length +
      searchResults.guide.length +
      searchResults.classic.length
    : 0;

  const filterTabs = useMemo(() => {
    if (!searchResults || totalResultCount === 0) return [];
    const tabs: Array<{ id: SearchCategoryFilter; label: string; count: number }> = [
      { id: "all", label: "Semua", count: totalResultCount },
    ];
    if (searchResults.kitab.length > 0) {
      tabs.push({ id: "kitab", label: "Kitab", count: searchResults.kitab.length });
    }
    if (searchResults.guide.length > 0) {
      tabs.push({ id: "guide", label: "Panduan", count: searchResults.guide.length });
    }
    if (searchResults.quran.length > 0) {
      tabs.push({ id: "quran", label: "Al-Qur’an", count: searchResults.quran.length });
    }
    if (searchResults.doa.length > 0) {
      tabs.push({ id: "doa", label: "Do’a", count: searchResults.doa.length });
    }
    if (searchResults.classic.length > 0) {
      tabs.push({ id: "classic", label: "Zikir", count: searchResults.classic.length });
    }
    return tabs.length > 2 ? tabs : [];
  }, [searchResults, totalResultCount]);

  const effectiveFilter: SearchCategoryFilter =
    activeFilter === "all" || filterTabs.some((t) => t.id === activeFilter) ? activeFilter : "all";

  const secondaryCollections: Array<{
    id: CollectionIconId;
    title: string;
    prefetchView?: AppRoute["view"];
    onClick: () => void;
  }> = [
    {
      id: "hadis",
      title: "Pencarian Hadis",
      prefetchView: "hadis",
      onClick: () => onNavigate({ view: "hadis" }),
    },
    {
      id: "wudhu-shalat",
      title: "Wudhu & Shalat",
      prefetchView: "wudhu-shalat",
      onClick: () => onNavigate({ view: "wudhu-shalat", tab: "wudhu" }),
    },
    {
      id: "dzikir",
      title: "Dzikir Ba'da Shalat",
      prefetchView: "classic",
      onClick: () => onOpenCollection("dzikir"),
    },
    {
      id: "doa",
      title: "Do'a Harian",
      prefetchView: "quran-studio",
      onClick: () => onNavigate({ view: "quran-studio", tab: "doa" }),
    },
    {
      id: "tafsir",
      title: "Tafsir Al-Qur’an",
      prefetchView: "quran-studio",
      onClick: () => onNavigate({ view: "quran-studio", tab: "tafsir" }),
    },
    {
      id: "qibla",
      title: "Arah Kiblat",
      prefetchView: "qibla",
      onClick: () => onNavigate({ view: "qibla" }),
    },
    {
      id: "ecode",
      title: "Cek Halal E-Code",
      prefetchView: "ecode-halal",
      onClick: () => onNavigate({ view: "ecode-halal" }),
    },
    {
      id: "mosque",
      title: "Masjid & Mushala",
      prefetchView: "nearby-mosques",
      onClick: () => onNavigate({ view: "nearby-mosques" }),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pt-4 sm:px-6">
      {/* Prayer Schedule Banner */}
      <section aria-label="Jadwal waktu shalat">
        <PrayerBanner />
      </section>

      {/* Deep Global Search Directly Below Prayer Schedule */}
      <section aria-label="Pencarian cepat menyeluruh">
        <div className="overflow-hidden rounded-2xl border border-[var(--theme-border-strong)] bg-[var(--theme-card)] shadow-sm transition-all duration-200 focus-within:border-[var(--theme-primary)] focus-within:shadow-md focus-within:ring-2 focus-within:ring-[var(--theme-primary)]/15">
          {/* Input Row */}
          <div className="flex items-center gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--theme-tint-border)] bg-[var(--theme-tint-bg)] text-[var(--theme-tint-text)]"
            >
              {searchResults?.searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </span>

            <input
              ref={searchInputRef}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && quickQuery) {
                  e.preventDefault();
                  clearSearch();
                }
              }}
              placeholder="Cari isi kitab, ayat Al-Qur’an, do’a, atau panduan ibadah…"
              aria-label="Cari menyeluruh di Al-Qur'an, Kitab Kuning, Do'a, dan Panduan"
              className="min-h-[42px] min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[var(--theme-heading)] outline-none placeholder:font-normal placeholder:text-[var(--theme-muted)] sm:text-sm"
            />

            {quickQuery ? (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Hapus pencarian"
                className="inline-flex min-h-[38px] min-w-[38px] shrink-0 items-center justify-center rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-alt)] text-[var(--theme-nav-muted)] transition-colors hover:border-[var(--theme-primary)] hover:bg-[var(--theme-tint-bg)] hover:text-[var(--theme-tint-text)]"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <span className="text-[11px] font-medium text-[var(--theme-muted)]">
                  Tekan{" "}
                  <kbd className="rounded-md border border-[var(--theme-border-strong)] bg-[var(--theme-card-alt)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--theme-heading)]">
                    /
                  </kbd>
                </span>
              </div>
            )}
          </div>

          {/* Quick Discovery Strip */}
          <div className="border-t border-[var(--theme-border-soft)] bg-[var(--theme-card-alt)]/65 px-3 py-2 sm:px-3.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
                <span className="inline-flex shrink-0 items-center gap-1 pr-1 text-[11px] font-semibold text-[var(--theme-accent)]">
                  <Sparkles className="h-3 w-3" />
                  <span>Topik:</span>
                </span>
                {QUICK_SEARCH_TOPICS.map((topic) => {
                  const isActiveTopic = trimmedQuery.toLocaleLowerCase("id") === topic.toLocaleLowerCase("id");
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => {
                        setActiveFilter("all");
                        setQuickQuery(topic);
                      }}
                      className={`inline-flex min-h-[32px] shrink-0 items-center rounded-xl border px-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                        isActiveTopic
                          ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-[var(--theme-primary-text)]"
                          : "border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-nav-muted)] hover:border-[var(--theme-primary)] hover:bg-[var(--theme-tint-bg)] hover:text-[var(--theme-tint-text)]"
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>

              <p className="hidden shrink-0 text-[11px] text-[var(--theme-muted)] lg:block">
                Kitab Kuning · Al-Qur’an · Do’a · Panduan · Zikir
              </p>
            </div>
          </div>
        </div>

        {searchResults && (
          <div className="panel-enter-fade mt-2.5 rounded-2xl border border-[var(--theme-border-strong)] bg-[var(--theme-card)] p-3.5 shadow-sm sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--theme-border-soft)] pb-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold text-[var(--theme-muted)]">
                  Hasil untuk{" "}
                  <span className="text-[var(--theme-heading)]">“{trimmedQuery}”</span>{" "}
                  <span className="font-mono-tabular">({totalResultCount})</span>
                </p>
                {searchResults.searching && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--theme-tint-text)]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>
                      {searchResults.searchingHeavy
                        ? "Memindai kitab besar…"
                        : "Memindai pustaka…"}
                    </span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={clearSearch}
                className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card-alt)] px-2.5 text-[11px] font-semibold text-[var(--theme-nav-muted)] transition-colors hover:border-[var(--theme-primary)] hover:text-[var(--theme-tint-text)]"
              >
                <X className="h-3 w-3" />
                <span>Tutup</span>
              </button>
            </div>

            {trimmedQuery.length === 1 && (
              <p className="mb-3 rounded-xl border border-[var(--theme-border-soft)] bg-[var(--theme-card-alt)] px-3 py-2 text-[11.5px] text-[var(--theme-muted)]">
                Ketik minimal <strong className="text-[var(--theme-heading)]">2 huruf</strong> untuk
                memindai seluruh isi kitab kuning, ayat Al-Qur’an, dan koleksi do’a.
              </p>
            )}

            {filterTabs.length > 0 && (
              <div className="no-scrollbar mb-3.5 flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {filterTabs.map((tab) => {
                  const selected = effectiveFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFilter(tab.id)}
                      className={`inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                        selected
                          ? "border-[var(--theme-primary)] bg-[var(--theme-primary)] text-[var(--theme-primary-text)]"
                          : "border-[var(--theme-border)] bg-[var(--theme-card-alt)] text-[var(--theme-nav-muted)] hover:border-[var(--theme-primary)] hover:bg-[var(--theme-tint-bg)] hover:text-[var(--theme-tint-text)]"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="font-mono-tabular text-[11px] opacity-80">{tab.count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="space-y-4">
              {/* 1. Kitab Kuning Results */}
              {(effectiveFilter === "all" || effectiveFilter === "kitab") &&
                searchResults.kitab.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold tracking-wider text-[var(--theme-accent)] uppercase">
                      Kitab Kuning ·{" "}
                      <span className="font-mono-tabular">{searchResults.kitab.length}</span>
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {searchResults.kitab.map((m, idx) => (
                        <button
                          key={`${m.book.slug}-${m.chapterIndex}-${idx}`}
                          type="button"
                          onClick={() => onOpenBook(m.book, m.chapterIndex)}
                          onPointerEnter={() => prefetchBookIntent(m.book)}
                          onTouchStart={() => prefetchBookIntent(m.book)}
                          className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-alt)]/55 px-3 py-2.5 text-left transition-colors hover:border-[var(--theme-primary)] hover:bg-[var(--theme-tint-bg)]/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-[var(--theme-heading)] group-hover:text-[var(--theme-tint-text)]">
                              {m.book.title}{" "}
                              <span className="font-normal text-[var(--theme-muted)]">
                                · {m.book.category}
                              </span>
                            </p>
                            <p className="mt-0.5 truncate text-[11px] font-medium text-[var(--theme-nav-muted)]">
                              {m.chapterTitle}
                            </p>
                            {m.snippet && (
                              <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--theme-muted)]">
                                {m.snippet}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--theme-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--theme-tint-text)]" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* 2. Panduan Wudhu & Shalat */}
              {(effectiveFilter === "all" || effectiveFilter === "guide") &&
                searchResults.guide.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-[var(--theme-accent)] uppercase">
                      Panduan Wudhu &amp; Shalat ·{" "}
                      <span className="font-mono-tabular">{searchResults.guide.length}</span>
                    </p>
                    <div className="divide-y divide-[var(--theme-border-soft)]">
                      {searchResults.guide.map((g, idx) => (
                        <button
                          key={`${g.tab}-${idx}`}
                          type="button"
                          onClick={() => onNavigate({ view: "wudhu-shalat", tab: g.tab })}
                          onPointerEnter={() => prefetchRouteView("wudhu-shalat")}
                          onTouchStart={() => prefetchRouteView("wudhu-shalat")}
                          className="group flex min-h-[48px] w-full items-center justify-between gap-3 py-2 text-left"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-[var(--theme-heading)] group-hover:text-[var(--theme-tint-text)]">
                              {g.title}
                            </p>
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--theme-muted)]">
                              {g.snippet}
                            </p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--theme-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--theme-tint-text)]" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* 3. Al-Qur'an Results */}
              {(effectiveFilter === "all" || effectiveFilter === "quran") &&
                searchResults.quran.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-[var(--theme-accent)] uppercase">
                      Al-Qur’an ·{" "}
                      <span className="font-mono-tabular">{searchResults.quran.length}</span>
                    </p>
                    <div className="divide-y divide-[var(--theme-border-soft)]">
                      {searchResults.quran.map((qItem, idx) => (
                        <button
                          key={`${qItem.surahNumber}-${qItem.ayatNumber || 0}-${idx}`}
                          type="button"
                          onClick={() =>
                            onNavigate({
                              view: "quran-studio",
                              tab: "quran",
                              surahNumber: qItem.surahNumber,
                              ayatNumber: qItem.ayatNumber,
                            })
                          }
                          onPointerEnter={() => prefetchRouteView("quran-studio")}
                          onTouchStart={() => prefetchRouteView("quran-studio")}
                          className="group flex min-h-[48px] w-full items-center justify-between gap-3 py-2 text-left"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-[var(--theme-heading)] group-hover:text-[var(--theme-tint-text)]">
                              {qItem.subtitle}
                            </p>
                            {qItem.snippet && (
                              <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--theme-muted)]">
                                {qItem.snippet}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--theme-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--theme-tint-text)]" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* 4. Do'a Harian Results */}
              {(effectiveFilter === "all" || effectiveFilter === "doa") &&
                searchResults.doa.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-[var(--theme-accent)] uppercase">
                      Do’a Harian ·{" "}
                      <span className="font-mono-tabular">{searchResults.doa.length}</span>
                    </p>
                    <div className="divide-y divide-[var(--theme-border-soft)]">
                      {searchResults.doa.map((d, idx) => (
                        <button
                          key={`${d.item.id ?? d.item.nama ?? idx}`}
                          type="button"
                          onClick={() =>
                            onNavigate({
                              view: "quran-studio",
                              tab: "doa",
                              doaTitle: d.item.nama,
                            })
                          }
                          onPointerEnter={() => prefetchRouteView("quran-studio")}
                          onTouchStart={() => prefetchRouteView("quran-studio")}
                          className="group flex min-h-[48px] w-full items-center justify-between gap-3 py-2 text-left"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-[var(--theme-heading)] group-hover:text-[var(--theme-tint-text)]">
                              {d.item.nama}{" "}
                              {d.item.grup && (
                                <span className="font-normal text-[var(--theme-muted)]">
                                  · {d.item.grup}
                                </span>
                              )}
                            </p>
                            {d.snippet && (
                              <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--theme-muted)]">
                                {d.snippet}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--theme-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--theme-tint-text)]" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* 5. Bacaan & Zikir Klasik */}
              {(effectiveFilter === "all" || effectiveFilter === "classic") &&
                searchResults.classic.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-[var(--theme-accent)] uppercase">
                      Bacaan &amp; Zikir Klasik ·{" "}
                      <span className="font-mono-tabular">{searchResults.classic.length}</span>
                    </p>
                    <div className="divide-y divide-[var(--theme-border-soft)]">
                      {searchResults.classic.map((c) => (
                        <button
                          key={c.sectionIndex}
                          type="button"
                          onClick={() => onOpenSectionIndex(c.sectionIndex)}
                          onPointerEnter={() => prefetchRouteView("classic")}
                          onTouchStart={() => prefetchRouteView("classic")}
                          className="group flex min-h-[48px] w-full items-center justify-between gap-3 py-2 text-left"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-[var(--theme-heading)] group-hover:text-[var(--theme-tint-text)]">
                              {c.title}
                            </p>
                            {c.snippet && (
                              <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--theme-muted)]">
                                {c.snippet}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--theme-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--theme-tint-text)]" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {!searchResults.searching && totalResultCount === 0 && (
                <div className="rounded-xl border border-[var(--theme-border-soft)] bg-[var(--theme-card-alt)] px-4 py-4 text-center">
                  <p className="text-xs font-medium text-[var(--theme-heading)]">
                    Belum ditemukan hasil langsung untuk “{trimmedQuery}”.
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--theme-muted)]">
                    Coba kata kunci lain atau lanjutkan pencarian langsung ke koleksi Hadis.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate({ view: "hadis" })}
                      onPointerEnter={() => prefetchRouteView("hadis")}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[var(--theme-primary)] px-3.5 text-xs font-semibold text-[var(--theme-primary-text)] transition-colors hover:bg-[var(--theme-primary-hover)]"
                    >
                      <span>Buka Pencarian Hadis</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {!includeHeavyBooks && trimmedQuery.length >= 2 && (
                <div className="border-t border-[var(--theme-border-soft)] pt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setIncludeHeavyBooks(true)}
                    className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card-alt)] px-4 text-xs font-semibold text-[var(--theme-tint-text)] transition-colors hover:border-[var(--theme-primary)] hover:bg-[var(--theme-tint-bg)]"
                  >
                    <Search className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Perluas ke kitab besar (Bulughul, Fathul Mu’in, Fathul Qarib, Muslim, dll.)
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Ibadah Sehari-hari — Bento Modern */}
      <section aria-labelledby="heading-collections">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-[var(--theme-accent)] uppercase">
              Ibadah Sehari-hari
            </p>
            <h2
              id="heading-collections"
              className="font-display mt-0.5 text-xl font-semibold text-[var(--theme-heading)] sm:text-2xl"
            >
              Bacaan &amp; Amalan Harian
            </h2>
            <p className="mt-0.5 text-xs text-[var(--theme-muted)]">
              Pilih bacaan utama atau jelajahi koleksi lainnya.
            </p>
          </div>
          <span className="font-mono-tabular shrink-0 text-xs font-semibold text-[var(--theme-muted)]">
            10 koleksi
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-12">
          {/* Highlight 1: Al-Qur'an & Murattal */}
          <button
            type="button"
            onClick={() => onNavigate({ view: "quran-studio", tab: "quran" })}
            onPointerEnter={() => prefetchRouteView("quran-studio")}
            onTouchStart={() => prefetchRouteView("quran-studio")}
            className="group relative col-span-1 flex min-h-[72px] items-center justify-between gap-2 overflow-hidden rounded-2xl border border-[var(--theme-hero-border)] bg-gradient-to-br from-[var(--theme-primary-from)] via-[var(--theme-primary-via)] to-[var(--theme-primary-to)] px-2.5 py-2.5 text-left text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:min-h-[78px] sm:gap-2.5 sm:px-4 sm:py-3 lg:col-span-6"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full border border-white/15"
            />
            <div className="relative flex min-w-0 items-center gap-2 sm:gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-[var(--theme-hero-eyebrow)] sm:h-10 sm:w-10">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-[12.5px] leading-tight font-semibold text-white sm:text-base">
                  Al-Qur’an &amp; Murattal
                </h3>
                <p className="mt-0.5 truncate text-[10.5px] leading-tight text-white/80 sm:text-xs">
                  30 juz &amp; audio qari
                </p>
              </div>
            </div>
            <span className="relative hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-[var(--theme-hero-eyebrow)] transition-transform duration-200 group-hover:translate-x-0.5 sm:flex sm:h-8 sm:w-8">
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </button>

          {/* Highlight 2: Rangkaian Tahlil */}
          <button
            type="button"
            onClick={() => onOpenCollection("tahlil")}
            onPointerEnter={() => prefetchRouteView("classic")}
            onTouchStart={() => prefetchRouteView("classic")}
            className="group relative col-span-1 flex min-h-[72px] items-center justify-between gap-2 overflow-hidden rounded-2xl border border-[var(--theme-tint-border)] bg-[var(--theme-card)] px-2.5 py-2.5 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--theme-primary)] hover:shadow-md sm:min-h-[78px] sm:gap-2.5 sm:px-4 sm:py-3 lg:col-span-6"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full border border-[var(--theme-tint-border)] opacity-60"
            />
            <div className="relative flex min-w-0 items-center gap-2 sm:gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--theme-tint-border)] bg-[var(--theme-tint-bg)] text-[var(--theme-tint-text)] sm:h-10 sm:w-10">
                {COLLECTION_VISUALS.tahlil.icon}
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-[12.5px] leading-tight font-semibold text-[var(--theme-heading)] sm:text-base">
                  Rangkaian Tahlil
                </h3>
                <p className="mt-0.5 truncate text-[10.5px] leading-tight text-[var(--theme-muted)] sm:text-xs">
                  Tawasul, tahlil &amp; doa
                </p>
              </div>
            </div>
            <span className="relative hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--theme-tint-bg)] text-[var(--theme-tint-text)] transition-transform duration-200 group-hover:translate-x-0.5 sm:flex sm:h-8 sm:w-8">
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </button>

          {/* 8 Compact Clean Cards (4x2 on desktop, 2x4 on mobile) */}
          {secondaryCollections.map((item) => {
            const visual = COLLECTION_VISUALS[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                onPointerEnter={() => item.prefetchView && prefetchRouteView(item.prefetchView)}
                onTouchStart={() => item.prefetchView && prefetchRouteView(item.prefetchView)}
                className="group col-span-1 flex min-h-[68px] items-center justify-between gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] px-2.5 py-2 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--theme-primary)] hover:bg-[var(--theme-card-alt)] hover:shadow-sm sm:min-h-[72px] sm:px-3.5 sm:py-3 lg:col-span-3 lg:px-3"
              >
                <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-[1.04] sm:h-10 sm:w-10 ${visual.boxClass}`}
                  >
                    {visual.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-semibold leading-tight text-[var(--theme-heading)] sm:text-sm lg:text-[13px]">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[10.5px] leading-tight text-[var(--theme-muted)] sm:text-[11px]">
                      {visual.subtitle}
                    </span>
                  </div>
                </div>

                <span
                  className={`hidden h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5 sm:flex lg:hidden xl:flex ${visual.arrowClass}`}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Rak Kitab Kuning Pilihan */}
      <section aria-labelledby="heading-featured-kitab">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-[var(--theme-accent)] uppercase">
              Perpustakaan Digital
            </p>
            <h2
              id="heading-featured-kitab"
              className="font-display mt-0.5 text-lg font-semibold text-[var(--theme-heading)] sm:text-xl"
            >
              Rak Kitab Kuning
            </h2>
          </div>
          <span className="font-mono-tabular shrink-0 text-xs font-semibold text-[var(--theme-muted)]">
            {allBooks.length} kitab
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
          {featuredBooks.map((book) => (
            <button
              key={`${book.source}-${book.slug}`}
              type="button"
              onClick={() => onOpenBook(book)}
              onPointerEnter={() => prefetchBookIntent(book)}
              onTouchStart={() => prefetchBookIntent(book)}
              onFocus={() => prefetchBookIntent(book)}
              className="group flex min-h-[68px] items-center justify-between gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] px-2.5 py-2.5 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--theme-primary)] hover:bg-[var(--theme-card-alt)] hover:shadow-sm sm:px-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <KitabCoverMini category={book.category} size="sm" />
                <div className="min-w-0">
                  <span className="line-clamp-2 block text-xs font-semibold leading-snug text-[var(--theme-heading)] sm:text-[13px]">
                    {book.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-[var(--theme-muted)]">
                    {book.category}
                  </span>
                </div>
              </div>

              <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--theme-tint-bg)] text-[var(--theme-tint-text)] transition-transform duration-200 group-hover:translate-x-0.5 sm:flex lg:hidden 2xl:flex">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onNavigate({ view: "kitab-hub" })}
          onPointerEnter={() => prefetchRouteView("kitab-hub")}
          onTouchStart={() => prefetchRouteView("kitab-hub")}
          className="group relative mt-2.5 flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border border-[var(--theme-hero-border)] bg-gradient-to-r from-[var(--theme-primary-from)] via-[var(--theme-primary-via)] to-[var(--theme-primary-to)] px-3.5 py-3 text-left text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:px-4"
        >
          <div className="relative flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-[var(--theme-hero-eyebrow)]">
              <Library className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-white sm:text-sm">
                Tampilkan semua kitab
              </span>
              <span className="block truncate text-[11px] text-[var(--theme-hero-sub)]">
                Jelajahi seluruh {allBooks.length} kitab kuning lokal (100% offline)
              </span>
            </div>
          </div>

          <div className="relative flex shrink-0 items-center gap-2">
            <span className="hidden text-xs font-semibold text-[var(--theme-hero-eyebrow)] sm:inline">
              Buka perpustakaan
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[var(--theme-hero-eyebrow)] transition-transform duration-200 group-hover:translate-x-0.5">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </button>
      </section>

      <FooterDisclaimer />
    </div>
  );
};
