import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Home,
  List,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { firstText, kitabApiRequest, pickKitabArray } from "../utils/kitabEngine";
import { FooterDisclaimer } from "./FooterDisclaimer";
import { FloatingPageNav } from "./FloatingPageNav";

interface ApiKitabViewProps {
  slug: string;
  title: string;
  focusMode: boolean;
  onToggleFocus: () => void;
  onBackToLibrary: () => void;
  onGoHome: () => void;
}

interface ApiChapterEntry {
  number: string;
  title: string;
  arabic?: string;
  latin?: string;
  content?: string;
}

export const ApiKitabView: React.FC<ApiKitabViewProps> = ({
  slug,
  title,
  focusMode,
  onToggleFocus,
  onBackToLibrary,
  onGoHome,
}) => {
  const [chapters, setChapters] = useState<ApiChapterEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [activeSourceList, setActiveSourceList] = useState<ApiChapterEntry[]>([]);
  const [chapterData, setChapterData] = useState<Record<string, unknown> | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [error, setError] = useState("");
  const [turnDir, setTurnDir] = useState<"next" | "prev" | "fade">("fade");
  const readingCardRef = useRef<HTMLElement | null>(null);

  const openChapter = async (entry: ApiChapterEntry, idx: number, sourceList: ApiChapterEntry[]) => {
    setTurnDir(idx > activeIndex ? "next" : idx < activeIndex ? "prev" : "fade");
    setActiveIndex(idx);
    setActiveSourceList(sourceList);
    setDrawerOpen(false);
    setChapterLoading(true);
    setError("");
    window.requestAnimationFrame(() => {
      readingCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    try {
      const res = await kitabApiRequest({ action: "chapter", slug, nomor: entry.number });
      setChapterData((res || {}) as Record<string, unknown>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat isi bab.");
    } finally {
      setChapterLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setChapterData(null);
    setTurnDir("fade");

    kitabApiRequest({ action: "detail", slug, page: "1", limit: "100" })
      .then(async (detail) => {
        if (!active) return;
        const list: ApiChapterEntry[] = pickKitabArray(detail).map((item, idx) => ({
          number: firstText(item, ["nomor", "no", "bab", "number", "id"], String(idx + 1)),
          title: firstText(item, ["judul", "nama_bab", "title", "nama", "bab"], `Bab ${idx + 1}`),
        }));
        setChapters(list);
        if (list.length > 0) {
          setActiveIndex(0);
          setActiveSourceList(list);
          try {
            const firstChapter = await kitabApiRequest({ action: "chapter", slug, nomor: list[0].number });
            if (active) setChapterData((firstChapter || {}) as Record<string, unknown>);
          } catch {
            // Keep list ready even if chapter fetch fails
          }
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Gagal memuat daftar bab kitab.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const arabicText = chapterData
    ? firstText(chapterData, [
        "teks_arab",
        "teksArab",
        "teks_arabic",
        "arab",
        "arabic",
        "arabic_text",
        "arabicText",
        "arab_text",
        "isi_arab",
        "naskah_arab",
        "naskah",
      ])
    : "";
  const latinText = chapterData ? firstText(chapterData, ["teks_latin", "latin", "transliterasi"]) : "";
  const indoText = chapterData
    ? firstText(chapterData, ["teks_indonesia", "terjemahan", "indonesia", "terjemah", "isi", "konten", "content", "body"])
    : "";
  const refText = chapterData ? firstText(chapterData, ["sumber", "referensi", "reference"]) : "";

  const currentList = activeSourceList.length ? activeSourceList : chapters;
  const activeEntry = currentList[activeIndex];

  return (
    <div
      className={`mx-auto max-w-6xl ${
        focusMode ? "px-2.5 pt-2.5 pb-8 sm:px-6 sm:pt-4" : "px-4 pt-4 pb-12 sm:px-6"
      }`}
    >
      {/* Top Action Bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 sm:mb-4">
        {focusMode ? (
          <p className="min-w-0 truncate text-xs font-semibold text-[var(--theme-muted)]">
            Mode Fokus · {title}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onBackToLibrary}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card)] px-3 text-xs font-semibold text-[var(--theme-nav-muted)] hover:bg-[var(--theme-card-alt)]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Perpustakaan</span>
            </button>

            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card)] px-3 text-xs font-semibold text-[var(--theme-nav-muted)] hover:bg-[var(--theme-card-alt)]"
            >
              <Home className="h-4 w-4" />
              <span>Beranda</span>
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card)] px-3 text-xs font-semibold text-[var(--theme-nav-muted)] lg:hidden"
            >
              <List className="h-4 w-4" />
              <span>Daftar Bab ({chapters.length})</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleFocus}
            title={focusMode ? "Keluar mode fokus" : "Mode fokus membaca"}
            className={`inline-flex items-center gap-1.5 rounded-xl font-semibold transition-colors ${
              focusMode
                ? "min-h-[36px] border border-[var(--theme-border-strong)] bg-[var(--theme-card)] px-3 text-xs text-[var(--theme-primary)] hover:bg-[var(--theme-card-alt)]"
                : "min-h-[40px] bg-[var(--theme-primary)] px-3 text-xs text-[var(--theme-primary-text)] hover:bg-[var(--theme-primary-hover)]"
            }`}
          >
            {focusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className={focusMode ? "inline" : "hidden sm:inline"}>
              {focusMode ? "Keluar Fokus" : "Mode Fokus"}
            </span>
          </button>
        </div>
      </div>

      {/* Split-Pane Workspace */}
      <div
        className={`grid grid-cols-1 gap-6 ${
          focusMode ? "" : "lg:grid-cols-[290px_minmax(0,1fr)] lg:items-start"
        }`}
      >
        {drawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
        )}

        {!focusMode && (
          <aside
            className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-[var(--theme-border)] bg-[var(--theme-card)] p-4 transition-transform duration-200 lg:sticky lg:top-20 lg:z-10 lg:max-h-[calc(100vh-100px)] lg:w-auto lg:translate-x-0 lg:rounded-2xl lg:border ${
              drawerOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-start justify-between gap-2 border-b border-[var(--theme-border-soft)] pb-3">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[var(--theme-accent)] uppercase">
                  Katalog Online
                </p>
                <h2 className="font-display mt-0.5 text-base font-semibold text-[var(--theme-heading)]">
                  {title}
                </h2>
                <p className="text-xs text-[var(--theme-muted)]">{chapters.length} bab</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Tutup daftar bab"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--theme-border-strong)] text-[var(--theme-nav-muted)] lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex-1 space-y-1 overflow-y-auto pr-1">
              {chapters.map((ch, idx) => {
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={`${ch.number}-${idx}`}
                    type="button"
                    onClick={() => openChapter(ch, idx, chapters)}
                    className={`flex min-h-[38px] w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                      isActive
                        ? "bg-[var(--theme-sidebar-active)] font-semibold text-[var(--theme-sidebar-active-text)]"
                        : "text-[var(--theme-nav-muted)] hover:bg-[var(--theme-tint-bg)]"
                    }`}
                  >
                    <span className="font-mono-tabular shrink-0 opacity-70">
                      {String(idx + 1).padStart(2, "0")}.
                    </span>
                    <span className="line-clamp-2">{ch.title}</span>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Active Canvas */}
        <section className={`min-w-0 ${focusMode ? "mx-auto w-full max-w-4xl" : ""}`}>
          <article
            ref={readingCardRef}
            key={`${slug}-${activeIndex}-${chapterLoading ? "loading" : "ready"}`}
            className={`scroll-mt-20 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] shadow-xs page-enter-${
              chapterLoading ? "fade" : turnDir
            } ${focusMode ? "p-4 sm:p-8" : "p-5 sm:p-7"}`}
          >
            {(loading || chapterLoading) && (
              <p className="py-12 text-center text-sm text-[var(--theme-muted)]">Memuat data kitab…</p>
            )}

            {error && !loading && (
              <div className="py-10 text-center">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {!loading && !chapterLoading && !error && activeEntry && (
              <>
                <div className="border-b border-[var(--theme-border-soft)] pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--theme-muted)]">
                        <span>{title}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Bab {activeIndex + 1} dari {currentList.length}
                        </span>
                      </div>
                      <h1 className="font-display mt-1.5 text-xl font-semibold text-[var(--theme-heading)] sm:text-2xl">
                        {activeEntry.title || `Bab ${activeIndex + 1}`}
                      </h1>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        disabled={activeIndex === 0}
                        onClick={() => openChapter(currentList[activeIndex - 1], activeIndex - 1, currentList)}
                        aria-label="Bab sebelumnya"
                        title="Bab sebelumnya"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card-alt)] text-[var(--theme-nav-muted)] transition-colors hover:bg-[var(--theme-tint-bg)] disabled:opacity-35"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={activeIndex + 1 >= currentList.length}
                        onClick={() => openChapter(currentList[activeIndex + 1], activeIndex + 1, currentList)}
                        aria-label="Bab berikutnya"
                        title="Bab berikutnya"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--theme-primary)] text-[var(--theme-primary-text)] transition-colors hover:bg-[var(--theme-primary-hover)] disabled:opacity-35"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {arabicText && (
                  <p
                    lang="ar"
                    dir="rtl"
                    className="arabic-reader-text mt-5 whitespace-pre-wrap text-right text-[var(--tashrif-ink)]"
                  >
                    {arabicText}
                  </p>
                )}
                {latinText && (
                  <p className="latin-reader-text mt-4 whitespace-pre-wrap text-[var(--theme-muted)] italic">
                    {latinText}
                  </p>
                )}
                {indoText && (
                  <p className="prose-reader-text mt-4 whitespace-pre-wrap text-[var(--theme-ink)]">
                    {indoText}
                  </p>
                )}
                {refText && (
                  <p className="mt-4 text-xs text-[var(--theme-muted)]">Referensi: {refText}</p>
                )}
              </>
            )}
          </article>

          {!loading && !chapterLoading && !error && activeEntry && (
            <FloatingPageNav
              onPrev={() => openChapter(currentList[activeIndex - 1], activeIndex - 1, currentList)}
              onNext={() => openChapter(currentList[activeIndex + 1], activeIndex + 1, currentList)}
              canPrev={activeIndex > 0}
              canNext={activeIndex + 1 < currentList.length}
              prevLabel="Bab Sebelumnya"
              nextLabel="Bab Berikutnya"
              centerText={`${activeIndex + 1} / ${currentList.length}`}
              ariaLabel="Navigasi antar bab kitab"
              onCenterClick={
                focusMode
                  ? undefined
                  : () => {
                      if (window.matchMedia("(min-width: 1024px)").matches) return;
                      setDrawerOpen(true);
                    }
              }
              centerAriaLabel="Daftar bab kitab"
            />
          )}

          {!focusMode && <FooterDisclaimer variant="compact" />}
        </section>
      </div>
    </div>
  );
};
