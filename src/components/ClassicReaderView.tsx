import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  List,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import type { ClassicSection } from "../data/sections";
import type { ClassicPage, FontSizeScale } from "../types/emoeslife";
import {
  CONTENTS_GROUPS,
  completeSectionStarts,
  getPageProgress,
  getReadingGroup,
  getReadingGroupBounds,
  getSwipeDirection,
  prepareReadingSections,
  splitSectionForScreen,
} from "../utils/readerEngine";
import { writePreference } from "../services/preferences";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface ClassicReaderViewProps {
  sections: ClassicSection[];
  pageLayout: Record<number, string>;
  fontSize: FontSizeScale;
  initialSectionIndex: number | null;
  initialPageIndex: number;
  tocOpen: boolean;
  focusMode: boolean;
  onToggleFocus: () => void;
  onOpenToc: () => void;
  onCloseToc: () => void;
  onGoHome: () => void;
  onPageChanged: (page: ClassicPage | undefined) => void;
}

export const ClassicReaderView: React.FC<ClassicReaderViewProps> = ({
  sections,
  pageLayout,
  fontSize,
  initialSectionIndex,
  initialPageIndex,
  tocOpen,
  focusMode,
  onToggleFocus,
  onOpenToc,
  onCloseToc,
  onGoHome,
  onPageChanged,
}) => {
  const [pages, setPages] = useState<ClassicPage[]>([]);
  const [sectionStarts, setSectionStarts] = useState<number[]>([]);
  const [index, setIndex] = useState(initialPageIndex);
  const [turnClass, setTurnClass] = useState("");

  const paperRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);

  const indexRef = useRef(index);
  indexRef.current = index;
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const turningRef = useRef(false);
  const queuedTurnRef = useRef<"next" | "prev" | null>(null);
  const pendingSectionRef = useRef<number | null>(initialSectionIndex);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    if (initialSectionIndex === null) return;
    if (pagesRef.current.length > 0) {
      const mapped = sectionStarts[initialSectionIndex];
      const start =
        Number.isInteger(mapped) && pagesRef.current[mapped]?.sectionIndex === initialSectionIndex
          ? mapped
          : pagesRef.current.findIndex((p) => p.sectionIndex === initialSectionIndex);
      if (start >= 0) {
        setIndex(start);
        writePreference("page", start);
        onPageChanged(pagesRef.current[start]);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
    pendingSectionRef.current = initialSectionIndex;
  }, [initialSectionIndex, sectionStarts]);

  const rebuildPages = useCallback(() => {
    const paper = paperRef.current;
    const titleEl = titleRef.current;
    const textEl = textRef.current;
    if (!paper || !titleEl || !textEl) return;

    const currentPages = pagesRef.current;
    const currentIdx = indexRef.current;
    const currentPage = currentPages[currentIdx];
    const currentSection = currentPage?.sectionIndex;
    const currentSectionOffset =
      currentSection === undefined
        ? 0
        : currentPages.slice(0, currentIdx).filter((p) => p.sectionIndex === currentSection).length;

    const available = Math.max(240, Math.min(540, window.innerHeight - 290));
    const width = Math.max(220, textEl.clientWidth || paper.clientWidth - 48);

    const nextPages: ClassicPage[] = [];
    const nextStarts: Array<number | undefined> = [];
    const readingSections = prepareReadingSections(sections, pageLayout);

    readingSections.forEach((s) => {
      const origIdx = s.originalIndex;
      nextStarts[origIdx] = nextPages.length;
      nextPages.push(...splitSectionForScreen(s, origIdx, available, width, textEl));
    });

    const completedStarts = completeSectionStarts(nextStarts, sections.length);
    setPages(nextPages);
    setSectionStarts(completedStarts);

    let targetIndex = Math.min(initialPageIndex, Math.max(0, nextPages.length - 1));
    if (pendingSectionRef.current !== null) {
      const targetSec = pendingSectionRef.current;
      pendingSectionRef.current = null;
      targetIndex = Math.max(0, completedStarts[targetSec] ?? 0);
    } else if (currentSection !== undefined) {
      const matching = nextPages.reduce<number[]>((acc, p, pIdx) => {
        if (p.sectionIndex === currentSection) acc.push(pIdx);
        return acc;
      }, []);
      if (matching.length) {
        targetIndex = matching[Math.min(currentSectionOffset, matching.length - 1)];
      }
    }

    setIndex(targetIndex);
    writePreference("page", targetIndex);
    onPageChanged(nextPages[targetIndex]);
  }, [sections, pageLayout, initialPageIndex, onPageChanged]);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(rebuildPages);
    return () => window.cancelAnimationFrame(frame);
  }, [rebuildPages, fontSize, focusMode]);

  useEffect(() => {
    let timer: number | undefined;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(rebuildPages, 220);
    };
    window.addEventListener("resize", onResize);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => window.setTimeout(rebuildPages, 80));
    }
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [rebuildPages]);

  const goToPage = useCallback(
    (requestedIndex: number, animate: "" | "turn-next" | "turn-prev" = "") => {
      const currentPages = pagesRef.current;
      if (!currentPages.length) return;
      if (turningRef.current && animate) return;
      const target = Math.max(0, Math.min(requestedIndex, currentPages.length - 1));

      if (!animate) {
        setIndex(target);
        writePreference("page", target);
        onPageChanged(currentPages[target]);
        return;
      }

      turningRef.current = true;
      setTurnClass(animate === "turn-next" ? "turn-out-next" : "turn-out-prev");

      window.setTimeout(() => {
        setIndex(target);
        writePreference("page", target);
        onPageChanged(currentPages[target]);
        setTurnClass(animate === "turn-next" ? "turn-in-next" : "turn-in-prev");

        window.setTimeout(() => {
          setTurnClass("");
          turningRef.current = false;
          const queued = queuedTurnRef.current;
          queuedTurnRef.current = null;
          if (queued === "next") next();
          else if (queued === "prev") prev();
        }, 270);
      }, 155);
    },
    [onPageChanged]
  );

  const next = useCallback(() => {
    const currentPages = pagesRef.current;
    const currentIdx = indexRef.current;
    if (turningRef.current) {
      queuedTurnRef.current = "next";
      return;
    }
    if (
      currentIdx >= currentPages.length - 1 ||
      getReadingGroup(currentPages[currentIdx + 1]) !== getReadingGroup(currentPages[currentIdx])
    ) {
      return;
    }
    goToPage(currentIdx + 1, "turn-next");
  }, [goToPage]);

  const prev = useCallback(() => {
    const currentPages = pagesRef.current;
    const currentIdx = indexRef.current;
    if (turningRef.current) {
      queuedTurnRef.current = "prev";
      return;
    }
    if (
      currentIdx <= 0 ||
      getReadingGroup(currentPages[currentIdx - 1]) !== getReadingGroup(currentPages[currentIdx])
    ) {
      return;
    }
    goToPage(currentIdx - 1, "turn-prev");
  }, [goToPage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev]);

  const activePage = pages[index];
  const activeGroupKey = activePage ? getReadingGroup(activePage) : "tahlil";
  const bounds = getReadingGroupBounds(pages, index);
  const progress = getPageProgress(index, bounds);
  const sectionFirst = activePage
    ? pages.findIndex((p) => getReadingGroup(p) === getReadingGroup(activePage))
    : 0;
  const pageNumFormatted = String(Math.max(1, index - Math.max(0, sectionFirst) + 1)).padStart(2, "0");
  const canPrev = index > bounds.start;
  const canNext = index < bounds.end;

  const activeGroupSections = useMemo(() => {
    const groupObj = CONTENTS_GROUPS.find((g) => g.key === activeGroupKey);
    if (!groupObj) return [];
    return sections
      .map((s, idx) => ({ s, idx }))
      .filter(({ s }) => groupObj.matches(s) && Boolean(s.title));
  }, [sections, activeGroupKey]);

  return (
    <div
      className={`mx-auto max-w-6xl ${
        focusMode ? "px-2.5 pt-2.5 pb-8 sm:px-6 sm:pt-4" : "px-4 pt-4 pb-12 sm:px-6"
      }`}
    >
      {/* Reader Top Action Bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 sm:mb-4">
        {focusMode ? (
          <p className="min-w-0 truncate text-xs font-semibold text-[#5e6a62] dark:text-slate-400">
            Mode Fokus · {activePage?.title || "Bacaan Klasik"}
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#dce4df] bg-[#ffffff] px-3 text-xs font-semibold text-[#174231] hover:bg-[#edf2ef] dark:border-slate-800 dark:bg-[#111A27] dark:text-slate-200 dark:hover:bg-[#162233]"
            >
              <Home className="h-4 w-4" />
              <span>Beranda</span>
            </button>

            <button
              type="button"
              onClick={onOpenToc}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#dce4df] bg-[#ffffff] px-3 text-xs font-semibold text-[#174231] lg:hidden dark:border-slate-800 dark:bg-[#111A27] dark:text-slate-200"
            >
              <List className="h-4 w-4" />
              <span>Daftar Isi</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleFocus}
          title={focusMode ? "Keluar mode fokus" : "Mode fokus membaca"}
          className={`inline-flex items-center gap-1.5 rounded-xl font-semibold transition-colors ${
            focusMode
              ? "min-h-[36px] border border-[#dce4df] bg-[#ffffff] px-3 text-xs text-[#174231] hover:bg-[#edf2ef] dark:border-slate-700 dark:bg-[#111A27] dark:text-[#E2B354]"
              : "min-h-[40px] bg-[#134a35] px-3.5 text-xs text-[#ffffff] hover:bg-[#0e3928] dark:bg-[#E2B354] dark:text-[#0B111A]"
          }`}
        >
          {focusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          <span>{focusMode ? "Keluar Fokus" : "Mode Fokus"}</span>
        </button>
      </div>

      <div
        className={`grid grid-cols-1 gap-6 ${
          focusMode ? "" : "lg:grid-cols-[290px_minmax(0,1fr)] lg:items-start"
        }`}
      >
        {/* Mobile Backdrop */}
        {tocOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
            onClick={onCloseToc}
            aria-hidden="true"
          />
        )}

        {/* Sidebar / Slide-over Daftar Isi */}
        {!focusMode && (
          <aside
            className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col justify-between border-r border-[#e2e8e4] bg-[#ffffff] p-4 transition-transform duration-200 lg:sticky lg:top-20 lg:z-10 lg:max-h-[calc(100vh-100px)] lg:w-auto lg:translate-x-0 lg:rounded-2xl lg:border ${
              tocOpen ? "translate-x-0" : "-translate-x-full"
            } dark:border-slate-800 dark:bg-[#111A27]`}
          >
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2 border-b border-[#e8eeea] pb-3.5 dark:border-slate-800">
                <div>
                  <p className="text-[11px] font-semibold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
                    Daftar Isi Klasik
                  </p>
                  <h2 className="font-display mt-0.5 text-base font-semibold text-[#103d2c] dark:text-white">
                    Rangkaian Bacaan
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onCloseToc}
                  aria-label="Tutup daftar isi"
                  className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-xl border border-[#dce4df] bg-[#f4f7f5] text-[#174231] lg:hidden dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="mt-3 space-y-1" aria-label="Kelompok bacaan klasik">
                {CONTENTS_GROUPS.map((group, groupIndex) => {
                  const firstSec = sections.findIndex(group.matches);
                  if (firstSec < 0) return null;
                  const isActive = activePage ? group.matches(activePage) : false;
                  return (
                    <button
                      key={group.key}
                      type="button"
                      onClick={() => {
                        goToPage(Math.max(0, sectionStarts[firstSec] ?? 0));
                        onCloseToc();
                      }}
                      className={`flex min-h-[40px] w-full items-center justify-between rounded-xl px-3 text-left text-xs font-semibold transition-colors ${
                        isActive
                          ? "bg-[#134a35] text-[#ffffff] dark:bg-[#1D3557]"
                          : "text-[#354c3e] hover:bg-[#edf2ef] dark:text-slate-300 dark:hover:bg-[#172334]"
                      }`}
                    >
                      <span>
                        {groupIndex + 1}. {group.title}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Active Group Sub-section Jump List */}
              {activeGroupSections.length > 1 && (
                <div className="mt-3.5 flex min-h-0 flex-1 flex-col border-t border-[#e8eeea] pt-3 dark:border-slate-800">
                  <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-[#7c745f] uppercase dark:text-slate-400">
                    Bagian dalam bacaan ini
                  </p>
                  <div className="flex-1 space-y-0.5 overflow-y-auto pr-1">
                    {activeGroupSections.map(({ s, idx }) => {
                      const isCurrent = activePage?.sectionIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            goToPage(Math.max(0, sectionStarts[idx] ?? 0));
                            onCloseToc();
                          }}
                          className={`flex min-h-[34px] w-full items-center rounded-lg px-2.5 py-1 text-left text-xs transition-colors ${
                            isCurrent
                              ? "bg-[#134a35]/10 font-semibold text-[#103d2c] dark:bg-[#E2B354]/20 dark:text-[#E2B354]"
                              : "text-[#646053] hover:bg-[#edf2ef]/70 hover:text-[#103d2c] dark:text-slate-400 dark:hover:bg-[#172334] dark:hover:text-slate-200"
                          }`}
                        >
                          <span className="truncate">{s.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-[#e8eeea] pt-3.5 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-medium text-[#646053] dark:text-slate-400">
                <span>Progres bacaan</span>
                <strong className="font-mono-tabular text-[#103d2c] dark:text-[#E2B354]">
                  {progress.percent}%
                </strong>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8dfc8] dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-[#134a35] transition-all duration-300 dark:bg-[#E2B354]"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-[#7c745f] dark:text-slate-400">
                Posisi bacaan tersimpan otomatis di perangkat ini.
              </p>
            </div>
          </aside>
        )}

        {/* Main Manuscript Paper Spread */}
        <section className="flex min-w-0 flex-col items-center">
          <div
            ref={paperRef}
            onTouchStart={(e) => {
              if (e.touches.length !== 1 || tocOpen) return;
              touchStartRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                time: Date.now(),
              };
            }}
            onTouchEnd={(e) => {
              const start = touchStartRef.current;
              touchStartRef.current = null;
              if (!start || !e.changedTouches.length || turningRef.current) return;
              const direction = getSwipeDirection({
                dx: e.changedTouches[0].clientX - start.x,
                dy: e.changedTouches[0].clientY - start.y,
                duration: Date.now() - start.time,
              });
              if (direction === "next") next();
              else if (direction === "prev") prev();
            }}
            aria-label="Halaman bacaan. Geser ke kiri untuk halaman berikutnya, geser ke kanan untuk halaman sebelumnya."
            className={`relative flex min-h-[500px] w-full flex-col justify-between rounded-2xl border border-[#e2e8e4] bg-[#ffffff] shadow-xs sm:min-h-[560px] sm:px-10 sm:py-9 dark:border-slate-800 dark:bg-[#111A27] ${
              focusMode ? "max-w-4xl px-4 py-5" : "max-w-3xl px-6 py-7"
            } ${turnClass}`}
          >
            {/* Subtle edge tap chevrons */}
            <button
              type="button"
              disabled={!canPrev}
              onClick={prev}
              aria-label="Halaman sebelumnya"
              title="Halaman sebelumnya"
              className="absolute top-1/2 left-2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-[#8c784c] transition-colors hover:bg-[#f2ebda] disabled:opacity-25 sm:flex dark:text-slate-400 dark:hover:bg-[#1A283A] dark:hover:text-[#E2B354]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              disabled={!canNext}
              onClick={next}
              aria-label="Halaman berikutnya"
              title="Halaman berikutnya"
              className="absolute top-1/2 right-2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-[#8c784c] transition-colors hover:bg-[#f2ebda] disabled:opacity-25 sm:flex dark:text-slate-400 dark:hover:bg-[#1A283A] dark:hover:text-[#E2B354]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={!canPrev}
                  onClick={prev}
                  aria-label="Halaman sebelumnya"
                  title="Halaman sebelumnya"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#dce4df] bg-[#f4f7f5] text-[#174231] transition-colors hover:bg-[#e6ede9] disabled:opacity-35 sm:hidden dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h2
                  ref={titleRef}
                  className="font-display flex-1 text-center text-lg font-semibold text-[#103d2c] sm:text-xl dark:text-white"
                >
                  {activePage?.title || "Memuat bacaan…"}
                </h2>
                <button
                  type="button"
                  disabled={!canNext}
                  onClick={next}
                  aria-label="Halaman berikutnya"
                  title="Halaman berikutnya"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#134a35] text-[#ffffff] transition-colors hover:bg-[#0e3928] disabled:opacity-35 sm:hidden dark:bg-[#E2B354] dark:text-[#0B111A]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mx-auto my-3.5 flex items-center justify-center gap-3 text-[#b8934a] dark:text-[#E2B354]" aria-hidden="true">
                <span className="h-px w-12 bg-[#dfd4ba] dark:bg-slate-800" />
                <span className="font-arabic text-sm">۞</span>
                <span className="h-px w-12 bg-[#dfd4ba] dark:bg-slate-800" />
              </div>

              <div
                ref={textRef}
                lang="ar"
                dir="rtl"
                className={`arabic-classic-text whitespace-pre-wrap text-[#1e2d24] dark:text-[#EDF2F7] ${
                  activePage?.quranSurah ? "text-justify" : "text-right"
                }`}
              >
                {activePage?.text || ""}
              </div>
            </div>

            <div className="mt-7 border-t border-[#efe7d5] pt-4 text-center dark:border-slate-800">
              <p className="font-arabic text-sm text-[#8a7548] dark:text-[#E2B354]">
                اقْرَؤُوا بِتَأَنٍّ وَحُضُورِ الْقَلْبِ
              </p>
              <p className="font-mono-tabular mt-1 text-xs font-medium text-[#7c745f] dark:text-slate-400">
                — {pageNumFormatted} —
              </p>
            </div>
          </div>

          {/* Ergonomic Sticky Page Controls */}
          <nav
            aria-label="Navigasi antar halaman bacaan"
            className={`sticky bottom-3 z-20 mt-4 flex w-full items-center justify-between gap-2 rounded-2xl border border-[#dce4df]/90 bg-[#ffffff]/95 p-2 shadow-lg backdrop-blur-md dark:border-slate-700/90 dark:bg-[#111A27]/95 ${
              focusMode ? "max-w-4xl" : "max-w-3xl"
            }`}
          >
            <button
              type="button"
              disabled={!canPrev}
              onClick={prev}
              className="inline-flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#dce4df] bg-[#ffffff] px-3 text-xs font-semibold text-[#174231] transition-colors hover:bg-[#edf2ef] disabled:opacity-40 sm:text-sm dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200 dark:hover:bg-[#1E2C40]"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="truncate">Sebelumnya</span>
            </button>

            {!focusMode && (
              <button
                type="button"
                onClick={onGoHome}
                aria-label="Kembali ke halaman awal"
                title="Halaman awal"
                className="inline-flex min-h-[42px] min-w-[42px] shrink-0 items-center justify-center rounded-xl border border-[#dce4df] bg-[#ffffff] text-[#174231] transition-colors hover:bg-[#edf2ef] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200 dark:hover:bg-[#1E2C40]"
              >
                <Home className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              disabled={!canNext}
              onClick={next}
              className="inline-flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#134a35] px-3 text-xs font-semibold text-[#ffffff] transition-colors hover:bg-[#0e3928] disabled:opacity-40 sm:text-sm dark:bg-[#E2B354] dark:text-[#0B111A]"
            >
              <span className="truncate">Berikutnya</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>
          </nav>

          {!focusMode && (
            <div className="w-full max-w-3xl">
              <FooterDisclaimer variant="compact" />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
