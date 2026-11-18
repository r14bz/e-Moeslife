import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  List,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { firstText, kitabApiRequest, pickKitabArray } from "../utils/kitabEngine";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface ApiKitabViewProps {
  slug: string;
  title: string;
  focusMode: boolean;
  onToggleFocus: () => void;
  onBackToLibrary: () => void;
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

  const openChapter = async (entry: ApiChapterEntry, idx: number, sourceList: ApiChapterEntry[]) => {
    setTurnDir(idx > activeIndex ? "next" : idx < activeIndex ? "prev" : "fade");
    setActiveIndex(idx);
    setActiveSourceList(sourceList);
    setDrawerOpen(false);
    setChapterLoading(true);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          <p className="min-w-0 truncate text-xs font-semibold text-[#5e6a62] dark:text-slate-400">
            Mode Fokus · {title}
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToLibrary}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#dce4df] bg-[#ffffff] px-3 text-xs font-semibold text-[#174231] hover:bg-[#edf2ef] dark:border-slate-800 dark:bg-[#111A27] dark:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Perpustakaan</span>
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#dce4df] bg-[#ffffff] px-3 text-xs font-semibold text-[#174231] lg:hidden dark:border-slate-800 dark:bg-[#111A27] dark:text-slate-200"
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
                ? "min-h-[36px] border border-[#dce4df] bg-[#ffffff] px-3 text-xs text-[#174231] hover:bg-[#edf2ef] dark:border-slate-700 dark:bg-[#111A27] dark:text-[#E2B354]"
                : "min-h-[40px] bg-[#134a35] px-3 text-xs text-[#ffffff] hover:bg-[#0e3928] dark:bg-[#E2B354] dark:text-[#0B111A]"
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
            className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-[#e2e8e4] bg-[#ffffff] p-4 transition-transform duration-200 lg:sticky lg:top-20 lg:z-10 lg:max-h-[calc(100vh-100px)] lg:w-auto lg:translate-x-0 lg:rounded-2xl lg:border ${
              drawerOpen ? "translate-x-0" : "-translate-x-full"
            } dark:border-slate-800 dark:bg-[#111A27]`}
          >
            <div className="flex items-start justify-between gap-2 border-b border-[#e8eeea] pb-3 dark:border-slate-800">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
                  Katalog Online
                </p>
                <h2 className="font-display mt-0.5 text-base font-semibold text-[#103d2c] dark:text-white">
                  {title}
                </h2>
                <p className="text-xs text-[#7c745f] dark:text-slate-400">{chapters.length} bab</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Tutup daftar bab"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dce4df] text-[#174231] lg:hidden dark:border-slate-700 dark:text-slate-300"
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
                        ? "bg-[#134a35] font-semibold text-[#ffffff] dark:bg-[#1D3557]"
                        : "text-[#354c3e] hover:bg-[#edf2ef] dark:text-slate-300 dark:hover:bg-[#172334]"
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
            key={`${slug}-${activeIndex}-${chapterLoading ? "loading" : "ready"}`}
            className={`rounded-2xl border border-[#e2e8e4] bg-[#ffffff] shadow-xs dark:border-slate-800 dark:bg-[#111A27] page-enter-${
              chapterLoading ? "fade" : turnDir
            } ${focusMode ? "p-4 sm:p-8" : "p-5 sm:p-7"}`}
          >
            {(loading || chapterLoading) && (
              <p className="py-12 text-center text-sm text-[#766f5d] dark:text-slate-400">Memuat data kitab…</p>
            )}

            {error && !loading && (
              <div className="py-10 text-center">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {!loading && !chapterLoading && !error && activeEntry && (
              <>
                <div className="border-b border-[#e8eeea] pb-4 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#7c745f] dark:text-slate-400">
                        <span>{title}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Bab {activeIndex + 1} dari {currentList.length}
                        </span>
                      </div>
                      <h1 className="font-display mt-1.5 text-xl font-semibold text-[#103d2c] sm:text-2xl dark:text-white">
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
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dce4df] bg-[#f4f7f5] text-[#174231] transition-colors hover:bg-[#e6ede9] disabled:opacity-35 dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={activeIndex + 1 >= currentList.length}
                        onClick={() => openChapter(currentList[activeIndex + 1], activeIndex + 1, currentList)}
                        aria-label="Bab berikutnya"
                        title="Bab berikutnya"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#134a35] text-[#ffffff] transition-colors hover:bg-[#0e3928] disabled:opacity-35 dark:bg-[#E2B354] dark:text-[#0B111A]"
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
                    className="arabic-reader-text mt-5 whitespace-pre-wrap text-right text-[#1c2b23] dark:text-[#EDF2F7]"
                  >
                    {arabicText}
                  </p>
                )}
                {latinText && (
                  <p className="latin-reader-text mt-4 whitespace-pre-wrap text-[#7a6d56] italic dark:text-slate-400">
                    {latinText}
                  </p>
                )}
                {indoText && (
                  <p className="prose-reader-text mt-4 whitespace-pre-wrap text-[#2e3e34] dark:text-slate-300">
                    {indoText}
                  </p>
                )}
                {refText && (
                  <p className="mt-4 text-xs text-[#7c745f] dark:text-slate-400">Referensi: {refText}</p>
                )}
              </>
            )}
          </article>

          {!loading && !chapterLoading && !error && activeEntry && (
            <nav
              aria-label="Navigasi antar bab kitab"
              className="sticky bottom-3 z-20 mt-4 flex items-center justify-between gap-2 rounded-2xl border border-[#dce4df]/90 bg-[#ffffff]/95 p-2 shadow-lg backdrop-blur-md dark:border-slate-700/90 dark:bg-[#111A27]/95"
            >
              <button
                type="button"
                disabled={activeIndex === 0}
                onClick={() => openChapter(currentList[activeIndex - 1], activeIndex - 1, currentList)}
                className="inline-flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#dce4df] bg-[#ffffff] px-3 text-xs font-semibold text-[#174231] transition-colors hover:bg-[#edf2ef] disabled:opacity-40 dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200 dark:hover:bg-[#1E2C40]"
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">Bab Sebelumnya</span>
              </button>

              <button
                type="button"
                disabled={focusMode}
                onClick={() => {
                  if (focusMode || window.matchMedia("(min-width: 1024px)").matches) return;
                  setDrawerOpen(true);
                }}
                aria-label="Daftar bab kitab"
                className="font-mono-tabular inline-flex min-h-[42px] shrink-0 items-center justify-center rounded-xl px-2.5 text-xs font-semibold text-[#6f6652] transition-colors hover:bg-[#edf2ef] disabled:hover:bg-transparent lg:cursor-default lg:hover:bg-transparent dark:text-slate-300 dark:hover:bg-[#162131] dark:disabled:hover:bg-transparent dark:lg:hover:bg-transparent"
              >
                {activeIndex + 1} / {currentList.length}
              </button>

              <button
                type="button"
                disabled={activeIndex + 1 >= currentList.length}
                onClick={() => openChapter(currentList[activeIndex + 1], activeIndex + 1, currentList)}
                className="inline-flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#134a35] px-3 text-xs font-semibold text-[#ffffff] transition-colors hover:bg-[#0e3928] disabled:opacity-40 dark:bg-[#E2B354] dark:text-[#0B111A]"
              >
                <span className="truncate">Bab Berikutnya</span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </button>
            </nav>
          )}

          {!focusMode && <FooterDisclaimer variant="compact" />}
        </section>
      </div>
    </div>
  );
};
