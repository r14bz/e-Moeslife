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
import { FloatingPageNav } from "./FloatingPageNav";

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
        window.requestAnimationFrame(() => {
          paperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
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

  const scrollToPaperCard = useCallback(() => {
    window.requestAnimationFrame(() => {
      paperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

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
        scrollToPaperCard();
        return;
      }

      turningRef.current = true;
      setTurnClass(animate === "turn-next" ? "turn-out-next" : "turn-out-prev");
      scrollToPaperCard();

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
    [onPageChanged, scrollToPaperCard]
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

  const groupBannerMeta = useMemo(() => {
    switch (activeGroupKey) {
      case "yasin":
        return {
          arabic: "سُوْرَةُ يٰسٓ",
          title: "Surah Yasin — 83 Ayat",
        };
      case "rahman":
        return {
          arabic: "سُوْرَةُ الرَّحْمٰنِ",
          title: "Surah Ar-Rahman — 78 Ayat",
        };
      case "dzikir":
        return {
          arabic: "أَذْكَارُ بَعْدَ الصَّلَاةِ",
          title: "Dzikir & Wirid Ba'da Shalat",
        };
      default:
        return {
          arabic: "التَّهْلِيْلُ وَالتَّوَسُّلُ",
          title: "Rangkaian Tahlil, Tawasul & Doa",
        };
    }
  }, [activeGroupKey]);

  return (
    <div
      style={{
        backgroundColor: "var(--tashrif-bg)",
        color: "var(--tashrif-text)",
        minHeight: "100vh",
      }}
    >
      <div
        className={`mx-auto max-w-6xl ${
          focusMode ? "px-2.5 pt-2.5 pb-8 sm:px-6 sm:pt-4" : "px-3.5 pt-3.5 pb-12 sm:px-6"
        }`}
      >
        {/* Reader Top Action Bar */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 sm:mb-3.5">
          {focusMode ? (
            <p
              style={{ color: "var(--tashrif-muted)" }}
              className="min-w-0 truncate text-xs font-semibold"
            >
              Mode Fokus · {activePage?.title || "Bacaan Klasik"}
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onGoHome}
                style={{
                  border: "1px solid var(--tashrif-border-cell)",
                  backgroundColor: "var(--tashrif-paper)",
                  color: "var(--tashrif-text)",
                }}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold shadow-xs transition-colors hover:opacity-90"
              >
                <Home className="h-4 w-4" />
                <span>Beranda</span>
              </button>

              <button
                type="button"
                onClick={onOpenToc}
                style={{
                  border: "1px solid var(--tashrif-border-cell)",
                  backgroundColor: "var(--tashrif-paper)",
                  color: "var(--tashrif-text)",
                }}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold shadow-xs transition-colors hover:opacity-90 lg:hidden"
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
            style={
              focusMode
                ? {
                    border: "1px solid var(--tashrif-border-cell)",
                    backgroundColor: "var(--tashrif-paper)",
                    color: "var(--tashrif-accent)",
                  }
                : {
                    backgroundColor: "var(--tashrif-btn-bg)",
                    color: "var(--tashrif-btn-text)",
                  }
            }
            className={`inline-flex items-center gap-1.5 rounded-xl text-xs font-bold transition-colors ${
              focusMode ? "min-h-[36px] px-3" : "min-h-[40px] px-3.5"
            }`}
          >
            {focusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span>{focusMode ? "Keluar Fokus" : "Mode Fokus"}</span>
          </button>
        </div>

        {/* Banner Header Hijau Zamrud (Senada Pembaca Kitab) */}
        {!focusMode && (
          <div
            style={{
              backgroundColor: "var(--tashrif-panel-bg)",
              border: "1px solid var(--tashrif-panel-border)",
              borderRadius: "0.75rem",
            }}
            className="mb-4 px-3 py-3.5 text-center shadow-xs sm:mb-5"
          >
            <h1
              dir="rtl"
              lang="ar"
              style={{ color: "var(--tashrif-panel-bright)", lineHeight: "1.8" }}
              className="font-arabic text-2xl font-bold"
            >
              {groupBannerMeta.arabic}
            </h1>
            <p style={{ color: "var(--tashrif-panel-sub)" }} className="mt-0.5 text-xs font-semibold">
              {groupBannerMeta.title}
            </p>
          </div>
        )}

        <div
          className={`grid grid-cols-1 gap-5 ${
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
              style={{
                backgroundColor: "var(--tashrif-paper)",
                borderColor: "var(--tashrif-border-cell)",
              }}
              className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col justify-between border-r p-4 transition-transform duration-200 lg:sticky lg:top-20 lg:z-10 lg:max-h-[calc(100vh-100px)] lg:w-auto lg:translate-x-0 lg:rounded-xl lg:border ${
                tocOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="flex min-h-0 flex-1 flex-col">
                <div
                  style={{ borderBottom: "1px solid var(--tashrif-border-cell)" }}
                  className="flex items-start justify-between gap-2 pb-3.5"
                >
                  <div>
                    <p
                      style={{ color: "var(--tashrif-accent)" }}
                      className="font-mono-tabular text-[11px] font-bold tracking-wider uppercase"
                    >
                      Daftar Isi Klasik
                    </p>
                    <h2
                      style={{ color: "var(--tashrif-ink)" }}
                      className="font-display mt-0.5 text-base font-semibold"
                    >
                      Rangkaian Bacaan
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onCloseToc}
                    aria-label="Tutup daftar isi"
                    style={{
                      border: "1px solid var(--tashrif-border-cell)",
                      backgroundColor: "var(--tashrif-wazan-bg)",
                      color: "var(--tashrif-text)",
                    }}
                    className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-xl lg:hidden"
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
                        style={
                          isActive
                            ? {
                                backgroundColor: "var(--tashrif-btn-bg)",
                                color: "var(--tashrif-btn-text)",
                              }
                            : {
                                color: "var(--tashrif-text)",
                              }
                        }
                        className={`flex min-h-[40px] w-full items-center justify-between rounded-xl px-3 text-left text-xs font-semibold transition-colors ${
                          isActive ? "" : "hover:bg-[var(--tashrif-dropdown-hover)]"
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
                  <div
                    style={{ borderTop: "1px solid var(--tashrif-border-cell)" }}
                    className="mt-3.5 flex min-h-0 flex-1 flex-col pt-3"
                  >
                    <p
                      style={{ color: "var(--tashrif-accent)" }}
                      className="mb-1.5 font-mono-tabular text-[11px] font-bold tracking-wider uppercase"
                    >
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
                            style={
                              isCurrent
                                ? {
                                    backgroundColor: "var(--tashrif-wazan-bg)",
                                    color: "var(--tashrif-ink)",
                                    borderLeft: "2px solid var(--tashrif-border-strong)",
                                  }
                                : {
                                    color: "var(--tashrif-muted)",
                                  }
                            }
                            className={`flex min-h-[34px] w-full items-center rounded-lg px-2.5 py-1 text-left text-xs transition-colors ${
                              isCurrent
                                ? "font-bold"
                                : "hover:bg-[var(--tashrif-dropdown-hover)]"
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

              <div
                style={{ borderTop: "1px solid var(--tashrif-border-cell)" }}
                className="mt-4 pt-3.5"
              >
                <div
                  style={{ color: "var(--tashrif-muted)" }}
                  className="flex items-center justify-between text-xs font-medium"
                >
                  <span>Progres bacaan</span>
                  <strong
                    style={{ color: "var(--tashrif-accent)" }}
                    className="font-mono-tabular"
                  >
                    {progress.percent}%
                  </strong>
                </div>
                <div
                  style={{ backgroundColor: "var(--tashrif-wazan-bg)" }}
                  className="mt-2 h-2 overflow-hidden rounded-full"
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progress.percent}%`,
                      backgroundColor: "var(--tashrif-btn-bg)",
                    }}
                  />
                </div>
                <p
                  style={{ color: "var(--tashrif-muted)" }}
                  className="mt-2 text-[11px] leading-relaxed"
                >
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
              style={{
                backgroundColor: "var(--tashrif-paper)",
                border: "4px double var(--tashrif-border-strong)",
                borderRadius: "0.75rem",
              }}
              className={`scroll-mt-20 relative flex min-h-[500px] w-full flex-col justify-between overflow-hidden shadow-xs sm:min-h-[560px] ${
                focusMode ? "max-w-4xl" : "max-w-3xl"
              } ${turnClass}`}
            >
              {/* Subtle edge tap chevrons on desktop */}
              <button
                type="button"
                disabled={!canPrev}
                onClick={prev}
                aria-label="Halaman sebelumnya"
                title="Halaman sebelumnya"
                style={{ color: "var(--tashrif-accent)" }}
                className="absolute top-1/2 left-2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition-colors hover:bg-[var(--tashrif-dropdown-hover)] disabled:opacity-25 sm:flex"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                disabled={!canNext}
                onClick={next}
                aria-label="Halaman berikutnya"
                title="Halaman berikutnya"
                style={{ color: "var(--tashrif-accent)" }}
                className="absolute top-1/2 right-2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition-colors hover:bg-[var(--tashrif-dropdown-hover)] disabled:opacity-25 sm:flex"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div>
                {/* Kitab Manuscript Header Band */}
                <div
                  style={{
                    backgroundColor: "var(--tashrif-wazan-bg)",
                    borderBottom: "1px solid var(--tashrif-border-cell)",
                  }}
                  className="px-4 py-3.5 sm:px-10 sm:py-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={!canPrev}
                      onClick={prev}
                      aria-label="Halaman sebelumnya"
                      title="Halaman sebelumnya"
                      style={{
                        border: "1px solid var(--tashrif-border-cell)",
                        backgroundColor: "var(--tashrif-paper)",
                        color: "var(--tashrif-text)",
                      }}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-35 sm:hidden"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="min-w-0 flex-1 text-center">
                      <span
                        style={{ color: "var(--tashrif-accent)" }}
                        className="block font-mono-tabular text-[11px] font-bold tracking-wider uppercase"
                      >
                        HALAMAN {pageNumFormatted} · {bounds.end - bounds.start + 1} HAL
                      </span>
                      <h2
                        ref={titleRef}
                        style={{ color: "var(--tashrif-ink)" }}
                        className="font-display mt-0.5 text-lg font-semibold sm:text-xl"
                      >
                        {activePage?.title || "Memuat bacaan…"}
                      </h2>
                    </div>

                    <button
                      type="button"
                      disabled={!canNext}
                      onClick={next}
                      aria-label="Halaman berikutnya"
                      title="Halaman berikutnya"
                      style={{
                        backgroundColor: "var(--tashrif-btn-bg)",
                        color: "var(--tashrif-btn-text)",
                      }}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-35 sm:hidden"
                    >
                      <ChevronRight className="h-4 w-4" />
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

                {/* Arabic Body Text */}
                <div
                  className={
                    focusMode ? "px-4 py-5 sm:px-10 sm:py-7" : "px-5 py-6 sm:px-12 sm:py-8"
                  }
                >
                  <div
                    ref={textRef}
                    lang="ar"
                    dir="rtl"
                    style={{ color: "var(--tashrif-ink)" }}
                    className={`arabic-classic-text whitespace-pre-wrap ${
                      activePage?.quranSurah ? "text-justify" : "text-right"
                    }`}
                  >
                    {activePage?.text || ""}
                  </div>
                </div>
              </div>

              {/* Kitab Colophon Footer */}
              <div
                style={{
                  borderTop: "1px dashed var(--tashrif-group-break)",
                  backgroundColor: "var(--tashrif-row-alt)",
                }}
                className="px-4 py-3.5 text-center sm:px-10"
              >
                <p
                  style={{ color: "var(--tashrif-accent)" }}
                  className="font-arabic text-sm font-semibold"
                >
                  اقْرَؤُوا بِتَأَنٍّ وَحُضُورِ الْقَلْبِ
                </p>
                <p
                  style={{ color: "var(--tashrif-muted)" }}
                  className="font-mono-tabular mt-0.5 text-xs font-semibold"
                >
                  — {pageNumFormatted} —
                </p>
              </div>
            </div>

            {/* Ergonomic Floating Page Controls with Frosted Blur */}
            <FloatingPageNav
              maxWidthClass={focusMode ? "max-w-4xl" : "max-w-3xl"}
              onPrev={prev}
              onNext={next}
              canPrev={canPrev}
              canNext={canNext}
              prevLabel="Sebelumnya"
              nextLabel="Berikutnya"
              centerText={pageNumFormatted}
              ariaLabel="Navigasi antar halaman bacaan"
              extraCenterButton={
                !focusMode ? (
                  <button
                    type="button"
                    onClick={onGoHome}
                    aria-label="Kembali ke halaman awal"
                    title="Beranda"
                    style={{
                      border: "1px solid var(--tashrif-border-cell)",
                      backgroundColor: "var(--tashrif-wazan-bg)",
                      color: "var(--tashrif-accent)",
                    }}
                    className="inline-flex min-h-[42px] min-w-[42px] shrink-0 items-center justify-center rounded-xl transition-opacity hover:opacity-90"
                  >
                    <Home className="h-4 w-4" />
                  </button>
                ) : undefined
              }
            />

            {!focusMode && (
              <div className="w-full max-w-3xl">
                <FooterDisclaimer variant="compact" />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
