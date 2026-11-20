import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, Library, Loader2, MapPin, Search } from "lucide-react";
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

interface HomeViewProps {
  sections: ClassicSection[];
  continueLabel: string;
  localBooks: LocalBookMeta[];
  apiBooks: LocalBookMeta[];
  onContinueReading: () => void;
  onOpenCollection: (kind: CollectionKind) => void;
  onOpenSectionIndex: (sectionIndex: number) => void;
  onNavigate: (route: AppRoute) => void;
  onOpenBook: (book: LocalBookMeta, chapterIndex?: number) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  sections,
  continueLabel,
  localBooks,
  apiBooks,
  onContinueReading,
  onOpenCollection,
  onOpenSectionIndex,
  onNavigate,
  onOpenBook,
}) => {
  const [quickQuery, setQuickQuery] = useState("");
  const [includeHeavyBooks, setIncludeHeavyBooks] = useState(false);
  const [searchResults, setSearchResults] = useState<GlobalSearchResults | null>(null);

  const allBooks = useMemo(() => [...localBooks, ...apiBooks], [localBooks, apiBooks]);
  const featuredBooks = useMemo(() => allBooks.slice(0, 8), [allBooks]);

  useEffect(() => {
    const q = quickQuery.trim();
    if (!q) {
      setSearchResults(null);
      setIncludeHeavyBooks(false);
      return;
    }

    const instant = runInstantGlobalSearch({ query: q, sections, books: allBooks });
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
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [quickQuery, includeHeavyBooks, allBooks, sections]);

  const totalResultCount = searchResults
    ? searchResults.kitab.length +
      searchResults.quran.length +
      searchResults.doa.length +
      searchResults.guide.length +
      searchResults.classic.length
    : 0;

  const secondaryCollections: Array<{ id: CollectionIconId; title: string; onClick: () => void }> = [
    { id: "yasin", title: "Surah Yasin", onClick: () => onOpenCollection("yasin") },
    {
      id: "wudhu-shalat",
      title: "Wudhu & Shalat",
      onClick: () => onNavigate({ view: "wudhu-shalat", tab: "wudhu" }),
    },
    { id: "dzikir", title: "Dzikir Ba'da Shalat", onClick: () => onOpenCollection("dzikir") },
    { id: "doa", title: "Do'a Harian", onClick: () => onNavigate({ view: "quran-studio", tab: "doa" }) },
    {
      id: "tafsir",
      title: "Tafsir Al-Qur’an",
      onClick: () => onNavigate({ view: "quran-studio", tab: "tafsir" }),
    },
    { id: "kitab", title: "Kitab Kuning", onClick: () => onNavigate({ view: "kitab-hub" }) },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pt-4 sm:px-6">
      {/* Split Hero: Prayer Banner + Quick Action Tiles */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-7">
          <PrayerBanner />
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:col-span-5 lg:grid-cols-1">
          {/* Card 1: Lanjutkan bacaan */}
          <button
            type="button"
            onClick={onContinueReading}
            className="group flex items-center justify-between gap-2.5 rounded-2xl border border-[#dce4df] bg-[#f5f8f6] px-3 py-3 text-left shadow-xs transition-all hover:border-[#134a35] hover:bg-white dark:border-slate-800 dark:bg-[#111A27] dark:hover:border-[#E2B354]"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e3efe8] text-[#134a35] dark:bg-[#192940] dark:text-[#E2B354]">
                <ArrowUpRight className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <span className="block truncate text-xs font-semibold text-[#103d2c] sm:text-sm dark:text-white">
                  Lanjutkan bacaan
                </span>
                <span className="block truncate text-[11px] text-[#5e6a62] dark:text-slate-300">
                  {continueLabel}
                </span>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#134a35] transition-transform group-hover:translate-x-0.5 dark:text-[#E2B354]" />
          </button>

          {/* Card 2: Cari Masjid & Mushala Terdekat (Google Maps) */}
          <button
            type="button"
            onClick={() => onNavigate({ view: "nearby-mosques" })}
            className="group flex items-center justify-between gap-2.5 rounded-2xl border border-[#e2e8e4] bg-white px-3 py-3 text-left shadow-xs transition-all hover:border-[#134a35] hover:bg-[#f8fbf9] dark:border-slate-800 dark:bg-[#111A27] dark:hover:border-[#E2B354]"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#134a35] text-white dark:bg-[#E2B354] dark:text-[#0B111A]">
                <MapPin className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <span className="block truncate text-xs font-semibold text-[#103d2c] sm:text-sm dark:text-white">
                  Masjid &amp; Mushala
                </span>
                <span className="block truncate text-[11px] text-[#5e6a62] dark:text-slate-300">
                  Cari terdekat · Google Maps
                </span>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#134a35] transition-transform group-hover:translate-x-0.5 dark:text-[#E2B354]" />
          </button>

          {/* Desktop Quick Preview Shortcut */}
          <button
            type="button"
            onClick={() => onNavigate({ view: "bacaan-hub" })}
            className="hidden items-center justify-between gap-2.5 rounded-2xl border border-[#e2e8e4] bg-white px-3 py-3 text-left shadow-xs transition-colors hover:border-[#134a35] hover:bg-[#f8fbf9] lg:flex dark:border-slate-800 dark:bg-[#111A27] dark:hover:border-[#E2B354]"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e8d9b4] bg-[#fbf5e6] text-[#8d6820] dark:border-[#42351b] dark:bg-[#272011] dark:text-[#E2B354]">
                <Library className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-[#103d2c] dark:text-white">
                  Daftar Isi Bacaan Klasik
                </span>
                <span className="block text-[11px] text-[#5e6a62] dark:text-slate-300">
                  Lompat ke tawasul, ayat, atau doa penutup
                </span>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#134a35] dark:text-[#E2B354]" />
          </button>
        </div>
      </section>

      {/* Ibadah Sehari-hari — Bento Modern */}
      <section aria-labelledby="heading-collections">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
              Ibadah Sehari-hari
            </p>
            <h2
              id="heading-collections"
              className="font-display mt-0.5 text-xl font-semibold text-[#103d2c] sm:text-2xl dark:text-white"
            >
              Bacaan &amp; Amalan Harian
            </h2>
            <p className="mt-0.5 text-xs text-[#5e6a62] dark:text-slate-300">
              Pilih bacaan utama atau jelajahi koleksi lainnya.
            </p>
          </div>
          <span className="font-mono-tabular shrink-0 text-xs font-semibold text-[#5e6a62] dark:text-slate-400">
            08 koleksi
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-12">
          {/* Highlight 1: Al-Qur'an & Murattal */}
          <button
            type="button"
            onClick={() => onNavigate({ view: "quran-studio", tab: "quran" })}
            className="group relative col-span-1 flex min-h-[72px] items-center justify-between gap-2 overflow-hidden rounded-2xl border border-[#0f3b2a] bg-gradient-to-br from-[#0f3d2b] via-[#134a35] to-[#1b5e44] px-2.5 py-2.5 text-left text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:min-h-[78px] sm:gap-2.5 sm:px-4 sm:py-3 lg:col-span-6 dark:border-[#1E354D] dark:from-[#102336] dark:via-[#152D46] dark:to-[#1B3A59]"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full border border-[#e6c98e]/20"
            />
            <div className="relative flex min-w-0 items-center gap-2 sm:gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-[#f3d99d] sm:h-10 sm:w-10">
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
            <span className="relative hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-[#f3d99d] transition-transform duration-200 group-hover:translate-x-0.5 sm:flex sm:h-8 sm:w-8">
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </button>

          {/* Highlight 2: Rangkaian Tahlil */}
          <button
            type="button"
            onClick={() => onOpenCollection("tahlil")}
            className="group relative col-span-1 flex min-h-[72px] items-center justify-between gap-2 overflow-hidden rounded-2xl border border-[#b7d3c3] bg-white px-2.5 py-2.5 text-left shadow-xs ring-1 ring-[#134a35]/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#134a35] hover:shadow-md sm:min-h-[78px] sm:gap-2.5 sm:px-4 sm:py-3 lg:col-span-6 dark:border-[#2a4562] dark:bg-[#111A27] dark:ring-[#E2B354]/15 dark:hover:border-[#E2B354]"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full border border-[#134a35]/10 dark:border-[#E2B354]/15"
            />
            <div className="relative flex min-w-0 items-center gap-2 sm:gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#cde2d7] bg-[#ebf5ef] text-[#134a35] sm:h-10 sm:w-10 dark:border-[#1f4235] dark:bg-[#142b23] dark:text-[#74d6ab]">
                {COLLECTION_VISUALS.tahlil.icon}
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-[12.5px] leading-tight font-semibold text-[#103d2c] sm:text-base dark:text-white">
                  Rangkaian Tahlil
                </h3>
                <p className="mt-0.5 truncate text-[10.5px] leading-tight text-[#5e6a62] sm:text-xs dark:text-slate-400">
                  Tawasul, tahlil &amp; doa
                </p>
              </div>
            </div>
            <span className="relative hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef5f1] text-[#134a35] transition-transform duration-200 group-hover:translate-x-0.5 sm:flex sm:h-8 sm:w-8 dark:bg-[#182942] dark:text-[#E2B354]">
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </button>

          {/* 6 Compact Clean White Cards */}
          {secondaryCollections.map((item) => {
            const visual = COLLECTION_VISUALS[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="group col-span-1 flex min-h-[68px] items-center justify-between gap-2 rounded-2xl border border-[#e2e8e4] bg-white px-2.5 py-2 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#134a35] hover:shadow-sm sm:min-h-[72px] sm:px-3.5 sm:py-3 lg:col-span-4 dark:border-slate-800 dark:bg-[#111A27] dark:hover:border-[#E2B354] dark:hover:bg-[#162233]"
              >
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-[1.04] sm:h-10 sm:w-10 ${visual.boxClass}`}
                  >
                    {visual.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-semibold leading-tight text-[#103d2c] sm:text-sm dark:text-white">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[10.5px] leading-tight text-[#606c64] sm:text-[11px] dark:text-slate-400">
                      {visual.subtitle}
                    </span>
                  </div>
                </div>

                <span
                  className={`hidden h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5 sm:flex ${visual.arrowClass}`}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Deep Global Search Across Kitab Kuning Contents, Al-Qur'an, Do'a, Wudhu/Shalat & Bacaan */}
      <section aria-label="Pencarian cepat menyeluruh">
        <label className="relative flex min-h-[44px] items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#6d7971] dark:text-slate-400" />
          <input
            type="search"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="Cari isi kitab (mis. zakat, wudhu, niat), ayat Al-Qur’an, do'a, atau dzikir…"
            aria-label="Cari menyeluruh di Al-Qur'an, Kitab Kuning, Do'a, dan Panduan"
            className="min-h-[44px] w-full rounded-2xl border border-[#e2e8e4] bg-white pr-4 pl-10 text-xs text-[#1d2c24] shadow-xs outline-none placeholder:text-[#7f8b83] focus:border-[#134a35] sm:text-sm dark:border-slate-800 dark:bg-[#111A27] dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-[#E2B354]"
          />
        </label>

        {searchResults && (
          <div className="mt-2.5 rounded-2xl border border-[#e2e8e4] bg-white p-3.5 shadow-xs sm:p-4 dark:border-slate-800 dark:bg-[#111A27]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#edf2ef] pb-2 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-[#5e6a62] dark:text-slate-300">
                Hasil pencarian untuk <span className="text-[#103d2c] dark:text-white">“{quickQuery.trim()}”</span> ({totalResultCount})
              </p>
              {searchResults.searching && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-[#134a35] dark:text-[#E2B354]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Memindai naskah…</span>
                </span>
              )}
            </div>

            <div className="space-y-4">
              {/* 1. Kitab Kuning Results */}
              {searchResults.kitab.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-[#9c7d3c] uppercase dark:text-[#E2B354]">
                    Kitab Kuning ({searchResults.kitab.length})
                  </p>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {searchResults.kitab.map((m) => (
                      <button
                        key={`${m.book.slug}-${m.chapterIndex}`}
                        type="button"
                        onClick={() => onOpenBook(m.book, m.chapterIndex)}
                        className="flex flex-col justify-between rounded-xl border border-[#e8eeea] bg-white px-3 py-2 text-left transition-colors hover:border-[#134a35] hover:bg-[#f4f8f5] dark:border-slate-800 dark:bg-[#131D2B] dark:hover:border-[#E2B354]"
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-[#103d2c] dark:text-white">
                            {m.book.title}
                          </span>
                          <span className="shrink-0 rounded-md bg-[#eef4f0] px-1.5 py-0.5 text-[10px] font-medium text-[#134a35] dark:bg-[#192940] dark:text-[#E2B354]">
                            {m.book.category}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] font-medium text-[#354c3e] dark:text-slate-200">
                          {m.chapterTitle}
                        </p>
                        {m.snippet && (
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-[#606c64] dark:text-slate-400">
                            {m.snippet}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Panduan Wudhu & Shalat */}
              {searchResults.guide.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-[#9c7d3c] uppercase dark:text-[#E2B354]">
                    Panduan Wudhu &amp; Shalat ({searchResults.guide.length})
                  </p>
                  <div className="divide-y divide-[#edf2ef] dark:divide-slate-800">
                    {searchResults.guide.map((g, idx) => (
                      <button
                        key={`${g.tab}-${idx}`}
                        type="button"
                        onClick={() => onNavigate({ view: "wudhu-shalat", tab: g.tab })}
                        className="flex w-full items-center justify-between gap-3 py-2 text-left hover:text-[#134a35] dark:hover:text-[#E2B354]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#103d2c] dark:text-white">
                            {g.title}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-[#606c64] dark:text-slate-400">
                            {g.snippet}
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#6d7971] dark:text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Al-Qur'an Results */}
              {searchResults.quran.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-[#9c7d3c] uppercase dark:text-[#E2B354]">
                    Al-Qur’an ({searchResults.quran.length})
                  </p>
                  <div className="divide-y divide-[#edf2ef] dark:divide-slate-800">
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
                        className="flex w-full items-center justify-between gap-3 py-2 text-left hover:text-[#134a35] dark:hover:text-[#E2B354]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#103d2c] dark:text-white">
                            {qItem.subtitle}
                          </p>
                          {qItem.snippet && (
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-[#606c64] dark:text-slate-400">
                              {qItem.snippet}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#6d7971] dark:text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Do'a Harian Results */}
              {searchResults.doa.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-[#9c7d3c] uppercase dark:text-[#E2B354]">
                    Do'a Harian ({searchResults.doa.length})
                  </p>
                  <div className="divide-y divide-[#edf2ef] dark:divide-slate-800">
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
                        className="flex w-full items-center justify-between gap-3 py-2 text-left hover:text-[#134a35] dark:hover:text-[#E2B354]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#103d2c] dark:text-white">
                            {d.item.nama}{" "}
                            {d.item.grup && (
                              <span className="font-normal text-[#7c745f] dark:text-slate-400">
                                · {d.item.grup}
                              </span>
                            )}
                          </p>
                          {d.snippet && (
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-[#606c64] dark:text-slate-400">
                              {d.snippet}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#6d7971] dark:text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Bacaan & Zikir Klasik */}
              {searchResults.classic.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-[#9c7d3c] uppercase dark:text-[#E2B354]">
                    Bacaan &amp; Zikir Klasik ({searchResults.classic.length})
                  </p>
                  <div className="divide-y divide-[#edf2ef] dark:divide-slate-800">
                    {searchResults.classic.map((c) => (
                      <button
                        key={c.sectionIndex}
                        type="button"
                        onClick={() => onOpenSectionIndex(c.sectionIndex)}
                        className="flex w-full items-center justify-between gap-3 py-2 text-left hover:text-[#134a35] dark:hover:text-[#E2B354]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#103d2c] dark:text-white">
                            {c.title}
                          </p>
                          {c.snippet && (
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-[#606c64] dark:text-slate-400">
                              {c.snippet}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#6d7971] dark:text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!searchResults.searching && totalResultCount === 0 && (
                <p className="py-2 text-center text-xs text-[#606c64] dark:text-slate-400">
                  Belum ditemukan hasil langsung untuk "{quickQuery.trim()}".
                </p>
              )}

              {!includeHeavyBooks && quickQuery.trim().length >= 2 && (
                <div className="border-t border-[#edf2ef] pt-2.5 text-center dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIncludeHeavyBooks(true)}
                    className="inline-flex min-h-[34px] items-center gap-1.5 rounded-xl border border-[#dce4df] bg-[#f5f8f6] px-3.5 text-[11px] font-semibold text-[#134a35] transition-colors hover:bg-[#e7f0eb] dark:border-slate-700 dark:bg-[#162131] dark:text-[#E2B354] dark:hover:bg-[#1E2C40]"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>
                      Cari juga di Bulughul, Riyadhus Shalihin, Muslim, Muwatta &amp; Jalalain
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Rak Kitab Kuning Pilihan */}
      <section aria-labelledby="heading-featured-kitab">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
              Perpustakaan Digital
            </p>
            <h2
              id="heading-featured-kitab"
              className="font-display mt-0.5 text-lg font-semibold text-[#103d2c] sm:text-xl dark:text-white"
            >
              Rak Kitab Kuning
            </h2>
          </div>
          <span className="font-mono-tabular shrink-0 text-xs font-semibold text-[#5e6a62] dark:text-slate-400">
            {allBooks.length} kitab
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {featuredBooks.map((book) => (
            <button
              key={`${book.source}-${book.slug}`}
              type="button"
              onClick={() => onOpenBook(book)}
              className="group flex min-h-[68px] items-center justify-between gap-2 rounded-2xl border border-[#e2e8e4] bg-white px-2.5 py-2.5 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#134a35] hover:shadow-sm sm:px-3 dark:border-slate-800 dark:bg-[#111A27] dark:hover:border-[#E2B354] dark:hover:bg-[#162233]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <KitabCoverMini category={book.category} size="sm" />
                <div className="min-w-0">
                  <span className="line-clamp-2 block text-xs font-semibold leading-snug text-[#103d2c] sm:text-[13px] dark:text-white">
                    {book.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-[#606c64] dark:text-slate-400">
                    {book.category}
                  </span>
                </div>
              </div>

              <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef4f0] text-[#134a35] transition-transform duration-200 group-hover:translate-x-0.5 sm:flex dark:bg-[#182942] dark:text-[#E2B354]">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onNavigate({ view: "kitab-hub" })}
          className="group relative mt-2.5 flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border border-[#0f3b2a] bg-gradient-to-r from-[#0f3d2b] via-[#134a35] to-[#1b5e44] px-3.5 py-3 text-left text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:px-4 dark:border-[#2a4562] dark:bg-gradient-to-r dark:from-[#102336] dark:via-[#152d46] dark:to-[#1b3a59]"
        >
          <div className="relative flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e6c98e]/30 bg-white/10 text-[#f3d99d] dark:border-[#E2B354]/30 dark:bg-white/5 dark:text-[#E2B354]">
              <Library className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-white sm:text-sm">
                Tampilkan semua kitab
              </span>
              <span className="block truncate text-[11px] text-[#e3ebe5] dark:text-slate-300">
                Jelajahi seluruh {allBooks.length} kitab kuning lokal (100% offline)
              </span>
            </div>
          </div>

          <div className="relative flex shrink-0 items-center gap-2">
            <span className="hidden text-xs font-semibold text-[#f3d99d] sm:inline dark:text-[#E2B354]">
              Buka perpustakaan
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[#f3d99d] transition-transform duration-200 group-hover:translate-x-0.5 dark:bg-white/10 dark:text-[#E2B354]">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </button>
      </section>

      <FooterDisclaimer />
    </div>
  );
};
