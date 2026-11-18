import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  List,
  Maximize2,
  Minimize2,
  Search,
  X,
} from "lucide-react";
import type { LocalBookMeta, NormalizedKitabChapter } from "../types/emoeslife";
import {
  ARABIC_REGEX,
  type ChapterQueueItem,
  type KitabChapterViewMode,
  VIEW_LABELS,
  arrayAt,
  buildChapterQueue,
  normalizeChapter,
  parseStructuredSafinah,
  planBatch,
  readKitabViewPrefs,
  resolveView,
  writeKitabViewPref,
} from "../utils/kitabEngine";
import { readKitabLastChapter, writeKitabLastChapter } from "../services/preferences";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface LocalKitabViewProps {
  book: LocalBookMeta;
  initialChapterIndex?: number;
  focusMode: boolean;
  onToggleFocus: () => void;
  onBackToLibrary: () => void;
}

const SUBHEADING_LINE_RE =
  /^(?:MUQODDIMAH|Muqoddimah|Terjemah:?|Artinya:?|Catatan\s*:?|Derajat Hadits:?|Penjelasan:?|Hadits ke[- ]?\d+|HADITS KE[- ]?\d+|Al-Hikam Pasal \d+|RISALAH \d+|Fasal \d+[^\n]{0,60}|BAB [IVXLC\d]+[^\n]{0,60}|[A-Z][A-Z0-9\s,'"-]{3,50})$/;

const BADGE_PREFIX_RE = /^(?:No\.\s*Hadist:\s*\d+\.|\d+\.\d+\/\d+\.|\d{1,3}\.|\[Fasal\])\s*/i;

const ArabicBlock: React.FC<{ value: string; className?: string }> = ({ value, className = "" }) => {
  const lines = useMemo(
    () =>
      String(value || "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    [value]
  );

  const hasPoeticSplit = useMemo(() => lines.some((l) => /\s[*#]\s/.test(l)), [lines]);

  if (hasPoeticSplit) {
    return (
      <div dir="rtl" lang="ar" className={`space-y-2.5 ${className}`}>
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^\d+\.\s+/, "");
          if (/\s[*#]\s/.test(cleanLine)) {
            const [first, ...rest] = cleanLine.split(/\s[*#]\s/);
            const second = rest.join(" • ").trim();
            return (
              <div
                key={idx}
                className="grid grid-cols-1 gap-x-6 gap-y-1 rounded-xl bg-[#ffffff]/70 px-3 py-2 sm:grid-cols-2 dark:bg-[#152030]/60"
              >
                <p className="arabic-reader-text text-right text-[#1c2b23] dark:text-[#EDF2F7]">
                  {first.trim()}
                </p>
                <p className="arabic-reader-text text-right text-[#1c2b23] sm:text-left dark:text-[#EDF2F7]">
                  <span className="ml-2 text-xs text-[#9c7d3c] sm:hidden dark:text-[#E2B354]">✦</span>
                  {second}
                </p>
              </div>
            );
          }
          return (
            <p key={idx} className="arabic-reader-text text-right text-[#1c2b23] dark:text-[#EDF2F7]">
              {cleanLine}
            </p>
          );
        })}
      </div>
    );
  }

  return (
    <p
      lang="ar"
      dir="rtl"
      className={`arabic-reader-text whitespace-pre-wrap text-right text-[#1c2b23] dark:text-[#EDF2F7] ${className}`}
    >
      {value}
    </p>
  );
};

const MixedTranslation: React.FC<{ value: string }> = ({ value }) => {
  const paragraphs = useMemo(
    () =>
      String(value || "")
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
    [value]
  );

  return (
    <>
      {paragraphs.map((paragraph, idx) => {
        const arabicOnly = ARABIC_REGEX.test(paragraph) && !/[A-Za-z]/.test(paragraph);
        if (arabicOnly) {
          return <ArabicBlock key={idx} value={paragraph} className="my-3" />;
        }

        if (SUBHEADING_LINE_RE.test(paragraph) && paragraph.length <= 80) {
          return (
            <p
              key={idx}
              className="mt-4 mb-1.5 text-xs font-bold tracking-wider text-[#134a35] uppercase dark:text-[#E2B354]"
            >
              {paragraph}
            </p>
          );
        }

        const badgeMatch = paragraph.match(BADGE_PREFIX_RE);
        if (badgeMatch) {
          const badge = badgeMatch[0].trim();
          const body = paragraph.slice(badgeMatch[0].length).trim();
          return (
            <p
              key={idx}
              dir="auto"
              className="prose-reader-text my-3 whitespace-pre-wrap text-[#2e3e34] dark:text-slate-300"
            >
              <span className="font-mono-tabular mr-2 inline-block rounded-md bg-[#e6efe9] px-1.5 py-0.5 text-[11px] font-semibold text-[#134a35] dark:bg-[#192940] dark:text-[#E2B354]">
                {badge}
              </span>
              {body}
            </p>
          );
        }

        return (
          <p
            key={idx}
            dir="auto"
            className="prose-reader-text my-3 whitespace-pre-wrap text-[#2e3e34] dark:text-slate-300"
          >
            {paragraph}
          </p>
        );
      })}
    </>
  );
};

const PairCard: React.FC<{
  item: Extract<ChapterQueueItem, { kind: "pair" }>;
  forceOpenAll: boolean | null;
}> = ({ item, forceOpenAll }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceOpenAll !== null) setOpen(forceOpenAll);
  }, [forceOpenAll]);

  if (item.heading) {
    return (
      <div className="border-b border-[#e8eeea] py-4 dark:border-slate-800">
        <p className="text-center text-sm font-bold tracking-wide text-[#103d2c] sm:text-base dark:text-[#E2B354]">
          {item.translation}
        </p>
        {item.arabic && <ArabicBlock value={item.arabic} className="mt-3" />}
      </div>
    );
  }

  return (
    <div className="border-b border-[#e8eeea] py-4 dark:border-slate-800">
      <ArabicBlock value={item.arabic} />
      <div className="mt-2.5">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex min-h-[38px] items-center rounded-xl border border-[#dce4df] bg-[#f4f7f5] px-3.5 text-xs font-semibold text-[#174231] transition-colors hover:bg-[#e6ede9] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200 dark:hover:bg-[#1E2C40]"
        >
          {open ? "Sembunyikan terjemah" : "Lihat terjemah"}
        </button>
      </div>
      {open && (
        <div className="mt-3 rounded-xl bg-[#ffffff] px-4 py-3 dark:bg-[#162131]">
          <MixedTranslation value={item.translation} />
        </div>
      )}
    </div>
  );
};

export const LocalKitabView: React.FC<LocalKitabViewProps> = ({
  book,
  initialChapterIndex,
  focusMode,
  onToggleFocus,
  onBackToLibrary,
}) => {
  const [chapters, setChapters] = useState<NormalizedKitabChapter[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [turnDir, setTurnDir] = useState<"next" | "prev" | "fade">("fade");
  const [resumedFromSaved, setResumedFromSaved] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chapterQuery, setChapterQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewMode, setViewMode] = useState<KitabChapterViewMode>("both");
  const [foldOpenAll, setFoldOpenAll] = useState<boolean | null>(null);
  const [renderedCount, setRenderedCount] = useState(0);
  const sentinelRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setChapterQuery("");
    setResumedFromSaved(false);
    setTurnDir("fade");

    fetch(`/data/${book.file}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`File ${book.file} tidak dapat dimuat (${res.status}).`);
        return res.json();
      })
      .then((documentData) => {
        if (!active) return;
        let parsedChapters: NormalizedKitabChapter[];
        if (book.format === "structured") {
          parsedChapters = parseStructuredSafinah(documentData);
        } else {
          const raw = arrayAt(documentData);
          if (!raw.length) throw new Error(`Struktur naskah ${book.file} belum dikenali.`);
          parsedChapters = raw.map(normalizeChapter);
        }

        const hasExplicitIndex =
          typeof initialChapterIndex === "number" &&
          Number.isFinite(initialChapterIndex) &&
          initialChapterIndex >= 0;
        const targetIndex = hasExplicitIndex
          ? Math.min(Math.max(0, parsedChapters.length - 1), initialChapterIndex)
          : Math.min(Math.max(0, parsedChapters.length - 1), readKitabLastChapter(book.slug));
        setChapters(parsedChapters);
        setActiveIndex(targetIndex);
        setResumedFromSaved(!hasExplicitIndex && targetIndex > 0);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Naskah gagal dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [book, initialChapterIndex]);

  const activeChapter = chapters[activeIndex] || null;

  const resolvedView = useMemo(() => {
    if (!activeChapter || book.format === "structured") {
      return { options: [] as KitabChapterViewMode[], view: "both" as KitabChapterViewMode };
    }
    return resolveView(activeChapter, readKitabViewPrefs());
  }, [activeChapter, book.format, viewMode]);

  const fullQueue = useMemo(() => {
    if (!activeChapter || book.format === "structured") return [];
    const targetView = resolvedView.view === "classic" ? "both" : resolvedView.view;
    return buildChapterQueue(activeChapter, targetView);
  }, [activeChapter, book.format, resolvedView.view]);

  useEffect(() => {
    if (!activeChapter) return;
    window.scrollTo({ top: 0, behavior: "auto" });
    setFoldOpenAll(null);
    setViewMode(resolvedView.view);
    if (fullQueue.length > 0) {
      setRenderedCount(planBatch(fullQueue));
    } else {
      setRenderedCount(0);
    }
  }, [activeIndex, resolvedView.view, fullQueue.length]);

  useEffect(() => {
    if (!activeChapter || renderedCount >= fullQueue.length) return;
    const node = sentinelRef.current;
    if (!node) return;

    const loadMore = () => {
      setRenderedCount((prev) => {
        if (prev >= fullQueue.length) return prev;
        const remaining = fullQueue.slice(prev);
        return Math.min(fullQueue.length, prev + planBatch(remaining));
      });
    };

    if (typeof IntersectionObserver === "function") {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) loadMore();
        },
        { rootMargin: "1200px 0px" }
      );
      observer.observe(node);
      return () => observer.disconnect();
    }

    const onScroll = () => {
      if (node.getBoundingClientRect().top < window.innerHeight + 1200) loadMore();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [activeChapter, renderedCount, fullQueue]);

  const filteredChapterEntries = useMemo(() => {
    const q = chapterQuery.trim().toLocaleLowerCase("id");
    return chapters
      .map((ch, idx) => ({ ch, idx }))
      .filter(
        ({ ch }) =>
          !q ||
          ch.title.toLocaleLowerCase("id").includes(q) ||
          (ch.chapterTitle || "").toLocaleLowerCase("id").includes(q)
      );
  }, [chapters, chapterQuery]);

  const handleSelectViewOption = (option: KitabChapterViewMode) => {
    if (option === resolvedView.view) return;
    writeKitabViewPref(resolvedView.options.includes("fold") ? "paired" : "unpaired", option);
    setViewMode(option);
  };

  const selectChapter = (idx: number) => {
    setTurnDir(idx > activeIndex ? "next" : idx < activeIndex ? "prev" : "fade");
    setActiveIndex(idx);
    setResumedFromSaved(false);
    writeKitabLastChapter(book.slug, idx);
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const visibleQueue = fullQueue.slice(0, renderedCount);

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
            Mode Fokus · {book.title}
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

      {/* Split-Pane Workspace: Chapter Directory + Manuscript Reader */}
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

        {/* Chapter Sidebar / Drawer */}
        {!focusMode && (
          <aside
            className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-[#e2e8e4] bg-[#ffffff] p-4 transition-transform duration-200 lg:sticky lg:top-20 lg:z-10 lg:max-h-[calc(100vh-100px)] lg:w-auto lg:translate-x-0 lg:rounded-2xl lg:border ${
              drawerOpen ? "translate-x-0" : "-translate-x-full"
            } dark:border-slate-800 dark:bg-[#111A27]`}
          >
            <div className="flex items-start justify-between gap-2 border-b border-[#e8eeea] pb-3 dark:border-slate-800">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
                  {book.category}
                </p>
                <h2 className="font-display mt-0.5 text-base font-semibold text-[#103d2c] dark:text-white">
                  {book.title}
                </h2>
                <p className="text-xs text-[#7c745f] dark:text-slate-400">{chapters.length} bagian</p>
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

            <label className="relative mt-3 flex items-center">
              <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#7c745f] dark:text-slate-400" />
              <input
                type="search"
                value={chapterQuery}
                onChange={(e) => setChapterQuery(e.target.value)}
                placeholder="Cari bab…"
                aria-label="Cari bab kitab"
                className="min-h-[38px] w-full rounded-xl border border-[#dce4df] bg-white pr-3 pl-8 text-xs outline-none focus:border-[#134a35] dark:border-slate-700 dark:bg-[#162131] dark:focus:border-[#E2B354]"
              />
            </label>

            <div className="mt-3 flex-1 space-y-1 overflow-y-auto pr-1">
              {filteredChapterEntries.map(({ ch, idx }) => {
                const showBabHeading =
                  book.format === "structured" &&
                  (idx === 0 || chapters[idx - 1]?.chapterTitle !== ch.chapterTitle);
                const isActive = idx === activeIndex;
                return (
                  <React.Fragment key={idx}>
                    {showBabHeading && (
                      <p className="mt-3 mb-1 px-2 text-[11px] font-bold tracking-wide text-[#9c7d3c] uppercase dark:text-[#E2B354]">
                        {ch.chapterTitle}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => selectChapter(idx)}
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
                  </React.Fragment>
                );
              })}
            </div>
          </aside>
        )}

        {/* Active Manuscript Reading Canvas */}
        <section className={`min-w-0 ${focusMode ? "mx-auto w-full max-w-4xl" : ""}`}>
          <article
            key={`${book.slug}-${activeIndex}`}
            className={`rounded-2xl border border-[#e2e8e4] bg-[#ffffff] shadow-xs dark:border-slate-800 dark:bg-[#111A27] ${
              focusMode ? "p-4 sm:p-8" : "p-5 sm:p-7"
            } ${
              turnDir === "next"
                ? "page-enter-next"
                : turnDir === "prev"
                ? "page-enter-prev"
                : "page-enter-fade"
            }`}
          >
            {loading && <p className="py-12 text-center text-sm text-[#766f5d] dark:text-slate-400">Memuat naskah lokal…</p>}
            {error && <p className="py-12 text-center text-sm text-red-700 dark:text-red-400">{error}</p>}

            {!loading && !error && activeChapter && (
              <>
                <div className="border-b border-[#e8eeea] pb-4 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#7c745f] dark:text-slate-400">
                        <span>{book.title}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Bagian {activeIndex + 1} dari {chapters.length}
                        </span>
                        {resumedFromSaved && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-[#134a35] dark:text-[#E2B354]">
                              Melanjutkan bab terakhir
                            </span>
                          </>
                        )}
                        {book.format === "structured" && activeChapter.chapterTitle && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{activeChapter.chapterTitle}</span>
                          </>
                        )}
                      </div>

                      <h1 className="font-display mt-1.5 text-xl font-semibold text-[#103d2c] sm:text-2xl dark:text-white">
                        {activeChapter.title}
                      </h1>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        disabled={activeIndex === 0}
                        onClick={() => selectChapter(activeIndex - 1)}
                        aria-label={book.format === "structured" ? "Bagian sebelumnya" : "Bab sebelumnya"}
                        title={book.format === "structured" ? "Bagian sebelumnya" : "Bab sebelumnya"}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dce4df] bg-[#f4f7f5] text-[#174231] transition-colors hover:bg-[#e6ede9] disabled:opacity-35 dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={activeIndex >= chapters.length - 1}
                        onClick={() => selectChapter(activeIndex + 1)}
                        aria-label={book.format === "structured" ? "Bagian selanjutnya" : "Bab selanjutnya"}
                        title={book.format === "structured" ? "Bagian selanjutnya" : "Bab selanjutnya"}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#134a35] text-[#ffffff] transition-colors hover:bg-[#0e3928] disabled:opacity-35 dark:bg-[#E2B354] dark:text-[#0B111A]"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {resolvedView.options.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
                      {resolvedView.options.map((option) => {
                        const active = option === resolvedView.view;
                        return (
                          <button
                            key={option}
                            type="button"
                            aria-pressed={active}
                            onClick={() => handleSelectViewOption(option)}
                            className={`min-h-[38px] rounded-xl px-3 text-xs font-semibold transition-colors ${
                              active
                                ? "bg-[#134a35] text-[#ffffff] dark:bg-[#E2B354] dark:text-[#0B111A]"
                                : "border border-[#dce4df] bg-[#f4f7f5] text-[#174231] hover:bg-[#e6ede9] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
                            }`}
                          >
                            {VIEW_LABELS[option]}
                          </button>
                        );
                      })}

                      {resolvedView.view === "fold" && (
                        <button
                          type="button"
                          onClick={() => setFoldOpenAll((prev) => !(prev ?? false))}
                          className="ml-auto min-h-[38px] rounded-xl border border-[#dce4df] bg-[#f4f7f5] px-3 text-xs font-semibold text-[#174231] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
                        >
                          {foldOpenAll ? "Tutup semua" : "Buka semua"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {book.format === "structured" ? (
                  <div className="mt-5 space-y-3">
                    {(activeChapter.blocks || []).map((block, bIdx) => {
                      if (block.type === "translation-label") {
                        return (
                          <p
                            key={bIdx}
                            className="mt-5 border-t border-[#e8eeea] pt-4 text-xs font-bold tracking-wider text-[#9c7d3c] uppercase dark:border-slate-800 dark:text-[#E2B354]"
                          >
                            {block.text}
                          </p>
                        );
                      }
                      if (block.type === "arabic") {
                        const trimmed = block.text.trim();
                        const isSectionMarker = /^(?:فَصْلٌ|خَاتِمَةٌ)$/.test(trimmed);
                        if (isSectionMarker) {
                          return (
                            <div
                              key={bIdx}
                              dir="rtl"
                              lang="ar"
                              className={`flex justify-end ${
                                bIdx > 0 ? "mt-5 border-t border-[#e8eeea] pt-4 dark:border-slate-800" : ""
                              }`}
                            >
                              <span className="font-arabic inline-block rounded-lg border border-[#e3d9c3] bg-[#ffffff] px-3 py-0.5 text-lg font-bold text-[#134a35] dark:border-slate-700 dark:bg-[#162131] dark:text-[#E2B354]">
                                {trimmed}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <p
                            key={bIdx}
                            dir="rtl"
                            lang="ar"
                            className="arabic-reader-text whitespace-pre-wrap text-right text-[#1c2b23] dark:text-[#EDF2F7]"
                          >
                            {block.text}
                          </p>
                        );
                      }
                      if (block.type === "translation") {
                        return (
                          <p
                            key={bIdx}
                            dir="ltr"
                            className="prose-reader-text whitespace-pre-wrap text-[#2e3e34] italic dark:text-slate-300"
                          >
                            {block.text}
                          </p>
                        );
                      }
                      const segments = block.text.split(/([\u0600-\u06FF][\u0600-\u06FF\s\u064B-\u065F\u0670\u0610-\u061A\u06D6-\u06ED]*[\u0600-\u06FF\u064B-\u065F\u0670]?)/g);
                      return (
                        <p
                          key={bIdx}
                          dir="auto"
                          className="prose-reader-text whitespace-pre-wrap text-[#2e3e34] dark:text-slate-300"
                        >
                          {segments.map((seg, sIdx) =>
                            ARABIC_REGEX.test(seg) ? (
                              <span
                                key={sIdx}
                                lang="ar"
                                dir="rtl"
                                className="font-arabic mx-0.5 inline-block text-[1.15em] leading-relaxed text-[#134a35] dark:text-[#E2B354]"
                              >
                                {seg}
                              </span>
                            ) : (
                              <React.Fragment key={sIdx}>{seg}</React.Fragment>
                            )
                          )}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-5">
                    {visibleQueue.map((item, qIdx) => {
                      if (item.kind === "pair") {
                        return <PairCard key={qIdx} item={item} forceOpenAll={foldOpenAll} />;
                      }
                      if (item.kind === "translation") {
                        return <MixedTranslation key={qIdx} value={item.chunk} />;
                      }
                      if (item.kind === "arabic") {
                        return (
                          <ArabicBlock
                            key={qIdx}
                            value={item.chunk}
                            className={`${!item.first ? "mt-0" : "mt-3"} ${!item.last ? "mb-0" : "mb-5"}`}
                          />
                        );
                      }
                      return (
                        <p
                          key={qIdx}
                          dir="ltr"
                          className={`latin-reader-text text-[#7a6d56] italic dark:text-slate-400 whitespace-pre-wrap ${!item.first ? "mt-0" : "mt-3"} ${!item.last ? "mb-0" : "mb-5"}`}
                        >
                          {item.chunk}
                        </p>
                      );
                    })}

                    {renderedCount < fullQueue.length && (
                      <p ref={sentinelRef} className="pt-4 text-center text-xs text-[#7c745f] dark:text-slate-400">
                        Gulir untuk memuat lanjutan bab…
                      </p>
                    )}

                    {!activeChapter.arabic && !activeChapter.translation && !activeChapter.latin && (
                      <p className="py-6 text-sm text-[#7c745f] dark:text-slate-400">
                        Bagian ini tidak memiliki field teks yang dikenali. Naskah JSON asli tetap dipertahankan.
                      </p>
                    )}
                  </div>
                )}

              </>
            )}
          </article>

          {!loading && !error && activeChapter && (
            <nav
              aria-label="Navigasi antar halaman kitab"
              className="sticky bottom-3 z-20 mt-4 flex items-center justify-between gap-2 rounded-2xl border border-[#dce4df]/90 bg-[#ffffff]/95 p-2 shadow-lg backdrop-blur-md dark:border-slate-700/90 dark:bg-[#111A27]/95"
            >
              <button
                type="button"
                disabled={activeIndex === 0}
                onClick={() => selectChapter(activeIndex - 1)}
                className="inline-flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#dce4df] bg-[#ffffff] px-3 text-xs font-semibold text-[#174231] transition-colors hover:bg-[#edf2ef] disabled:opacity-40 dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200 dark:hover:bg-[#1E2C40]"
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {book.format === "structured" ? "Sebelumnya" : "Bab Sebelumnya"}
                </span>
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
                {activeIndex + 1} / {chapters.length}
              </button>

              <button
                type="button"
                disabled={activeIndex >= chapters.length - 1}
                onClick={() => selectChapter(activeIndex + 1)}
                className="inline-flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#134a35] px-3 text-xs font-semibold text-[#ffffff] transition-colors hover:bg-[#0e3928] disabled:opacity-40 dark:bg-[#E2B354] dark:text-[#0B111A]"
              >
                <span className="truncate">
                  {book.format === "structured" ? "Selanjutnya" : "Bab Selanjutnya"}
                </span>
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
