import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Library, Loader2, Search } from "lucide-react";
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
  continueLabel?: string;
  localBooks: LocalBookMeta[];
  apiBooks: LocalBookMeta[];
  onContinueReading?: () => void;
  onOpenCollection: (kind: CollectionKind) => void;
  onOpenSectionIndex: (sectionIndex: number) => void;
  onNavigate: (route: AppRoute) => void;
  onOpenBook: (book: LocalBookMeta, chapterIndex?: number) => void;
}

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

  const allBooks = useMemo(() => [...localBooks, ...apiBooks], [localBooks, apiBooks]);
  const featuredBooks = useMemo(() => allBooks.slice(0, 10), [allBooks]);

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
    {
      id: "qibla",
      title: "Arah Kiblat",
      onClick: () => onNavigate({ view: "qibla" }),
    },
    {
      id: "ecode",
      title: "Cek Halal E-Code",
      onClick: () => onNavigate({ view: "ecode-halal" }),
    },
    {
      id: "mosque",
      title: "Masjid & Mushala",
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
        <label className="relative flex min-h-[44px] items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-[var(--theme-muted)]" />
          <input
            type="search"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="Cari isi kitab (mis. zakat, wudhu, niat), ayat Al-Qur’an, do'a, atau dzikir…"
            aria-label="Cari menyeluruh di Al-Qur'an, Kitab Kuning, Do'a, dan Panduan"
            className="min-h-[44px] w-full rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] pr-4 pl-10 text-xs text-[var(--theme-ink)] shadow-xs outline-none placeholder:text-[var(--theme-muted)] focus:border-[var(--theme-primary)] sm:text-sm"
          />
        </label>

        {searchResults && (
          <div className="mt-2.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-3.5 shadow-xs sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--theme-border-soft)] pb-2">
              <p className="text-[11px] font-semibold text-[var(--theme-muted)]">
                Hasil pencarian untuk <span className="text-[var(--theme-heading)]">“{quickQuery.trim()}”</span> ({totalResultCount})
              </p>
              {searchResults.searching && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--theme-tint-text)]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Memindai naskah…</span>
                </span>
              )}
            </div>

            <div className="space-y-4">
              {/* 1. Kitab Kuning Results */}
              {searchResults.kitab.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-[var(--theme-accent)] uppercase">
                    Kitab Kuning ({searchResults.kitab.length})
                  </p>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {searchResults.kitab.map((m, idx) => (
                      <button
                        key={`${m.book.slug}-${m.chapterIndex}-${idx}`}
                        type="button"
                        onClick={() => onOpenBook(m.book, m.chapterIndex)}
                        className="flex flex-col justify-between rounded-xl border border-[var(--theme-border-soft)] bg-[var(--theme-card)] px-3 py-2 text-left transition-colors hover:border-[var(--theme-primary)] hover:bg-[var(--theme-card-alt)]"
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-[var(--theme-heading)]">
                            {m.book.title}
                          </span>
                          <span className="shrink-0 rounded-md bg-[var(--theme-tint-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--theme-tint-text)]">
                            {m.book.category}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] font-medium text-[var(--theme-nav-muted)]">
                          {m.chapterTitle}
                        </p>
                        {m.snippet && (
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--theme-muted)]">
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
                  <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-[var(--theme-accent)] uppercase">
                    Panduan Wudhu &amp; Shalat ({searchResults.guide.length})
                  </p>
                  <div className="divide-y divide-[var(--theme-border-soft)]">
                    {searchResults.guide.map((g, idx) => (
                      <button
                        key={`${g.tab}-${idx}`}
                        type="button"
                        onClick={() => onNavigate({ view: "wudhu-shalat", tab: g.tab })}
                        className="group flex w-full items-center justify-between gap-3 py-2 text-left"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[var(--theme-heading)] group-hover:text-[var(--theme-tint-text)]">
                            {g.title}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--theme-muted)]">
                            {g.snippet}
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--theme-muted)] group-hover:text-[var(--theme-tint-text)]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Al-Qur'an Results */}
              {searchResults.quran.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-[var(--theme-accent)] uppercase">
                    Al-Qur’an ({searchResults.quran.length})
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
                        className="group flex w-full items-center justify-between gap-3 py-2 text-left"
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
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--theme-muted)] group-hover:text-[var(--theme-tint-text)]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Do'a Harian Results */}
              {searchResults.doa.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-[var(--theme-accent)] uppercase">
                    Do'a Harian ({searchResults.doa.length})
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
                        className="group flex w-full items-center justify-between gap-3 py-2 text-left"
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
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--theme-muted)] group-hover:text-[var(--theme-tint-text)]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Bacaan & Zikir Klasik */}
              {searchResults.classic.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-[var(--theme-accent)] uppercase">
                    Bacaan &amp; Zikir Klasik ({searchResults.classic.length})
                  </p>
                  <div className="divide-y divide-[var(--theme-border-soft)]">
                    {searchResults.classic.map((c) => (
                      <button
                        key={c.sectionIndex}
                        type="button"
                        onClick={() => onOpenSectionIndex(c.sectionIndex)}
                        className="group flex w-full items-center justify-between gap-3 py-2 text-left"
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
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--theme-muted)] group-hover:text-[var(--theme-tint-text)]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!searchResults.searching && totalResultCount === 0 && (
                <p className="py-2 text-center text-xs text-[var(--theme-muted)]">
                  Belum ditemukan hasil langsung untuk "{quickQuery.trim()}".
                </p>
              )}

              {!includeHeavyBooks && quickQuery.trim().length >= 2 && (
                <div className="border-t border-[var(--theme-border-soft)] pt-2.5 text-center">
                  <button
                    type="button"
                    onClick={() => setIncludeHeavyBooks(true)}
                    className="inline-flex min-h-[34px] items-center gap-1.5 rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card-alt)] px-3.5 text-[11px] font-semibold text-[var(--theme-tint-text)] transition-colors hover:bg-[var(--theme-tint-bg)]"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>
                      Cari juga di kitab besar (Bulughul, Fathul Mu'in, Fathul Qarib, Kasyifatus Saja, Muslim, dll.)
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
