import React, { useEffect, useMemo, useRef, useState } from "react";
import type {
  LocalBookMeta,
  NormalizedKitabChapter,
  StructuredBlock,
} from "../types/emoeslife";
import {
  ARABIC_REGEX,
  BATCH_BUDGET_CHARS,
  KITAB_ARABIC_TITLES,
  type PairedParagraph,
  arrayAt,
  chunkText,
  isBasmalah,
  normalizeChapter,
  pairParagraphs,
  parseStructuredSafinah,
  splitParagraphs,
} from "../utils/kitabEngine";
import { readKitabLastChapter, writeKitabLastChapter } from "../services/preferences";
import { FooterDisclaimer } from "./FooterDisclaimer";
import { KitabTopBar } from "./KitabTopBar";
import { ThemedSelect } from "./ThemedSelect";
import { FloatingPageNav } from "./FloatingPageNav";

interface LocalKitabViewProps {
  book: LocalBookMeta;
  initialChapterIndex?: number;
  focusMode: boolean;
  onToggleFocus: () => void;
  onBackToLibrary: () => void;
  onGoHome: () => void;
}

const SUBHEADING_LINE_RE =
  /^(?:MUQODDIMAH|Muqoddimah|Terjemah:?|Artinya:?|Catatan\s*:?|Pelajaran\s*:?|Syarah:?|Derajat Hadits:?|Penjelasan:?|Hadits ke[- ]?\d+|HADITS KE[- ]?\d+|Al-Hikam Pasal \d+|RISALAH \d+|Fasal \d+[^\n]{0,60}|BAB [IVXLC\d]+[^\n]{0,60}|[A-Z][A-Z0-9\s,'"-]{3,50})$/;

const BADGE_PREFIX_RE = /^(?:No\.\s*Hadist:\s*\d+\.|\d+\.\d+\/\d+\.|\d{1,4}\.|\[Fasal\])\s*/i;

const ArabicTextBlock: React.FC<{
  value: string;
  badge?: string | number;
  className?: string;
}> = ({ value, badge, className = "" }) => {
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
      <div dir="rtl" lang="ar" className={`space-y-2 ${className}`}>
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^\d+\.\s+/, "");
          if (/\s[*#]\s/.test(cleanLine)) {
            const [first, ...rest] = cleanLine.split(/\s[*#]\s/);
            const second = rest.join(" • ").trim();
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: "var(--tashrif-row-alt)",
                  border: "1px solid var(--tashrif-border-cell)",
                }}
                className="grid grid-cols-1 gap-x-5 gap-y-1 rounded-lg px-3 py-2 sm:grid-cols-2"
              >
                <p
                  style={{
                    color: "var(--tashrif-ink)",
                    fontSize: "var(--arabic-reader-size)",
                    lineHeight: "1.95",
                  }}
                  className="font-arabic text-right"
                >
                  {idx === 0 && badge !== undefined && (
                    <span
                      style={{
                        backgroundColor: "var(--tashrif-wazan-bg)",
                        border: "1px solid var(--tashrif-border-cell)",
                        color: "var(--tashrif-accent)",
                      }}
                      className="ml-2 inline-block rounded px-1.5 py-0.5 align-middle font-mono-tabular text-[11px] font-bold"
                    >
                      {badge}
                    </span>
                  )}
                  {first.trim()}
                </p>
                <p
                  style={{
                    color: "var(--tashrif-ink)",
                    fontSize: "var(--arabic-reader-size)",
                    lineHeight: "1.95",
                  }}
                  className="font-arabic text-right sm:text-left"
                >
                  {second}
                </p>
              </div>
            );
          }
          return (
            <p
              key={idx}
              style={{
                color: "var(--tashrif-ink)",
                fontSize: "var(--arabic-reader-size)",
                lineHeight: "2.05",
              }}
              className="font-arabic text-right break-words"
            >
              {idx === 0 && badge !== undefined && (
                <span
                  style={{
                    backgroundColor: "var(--tashrif-wazan-bg)",
                    border: "1px solid var(--tashrif-border-cell)",
                    color: "var(--tashrif-accent)",
                  }}
                  className="ml-2 inline-block rounded px-1.5 py-0.5 align-middle font-mono-tabular text-[11px] font-bold"
                >
                  {badge}
                </span>
              )}
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
      style={{
        color: "var(--tashrif-ink)",
        fontSize: "var(--arabic-reader-size)",
        lineHeight: "2.05",
      }}
      className={`font-arabic whitespace-pre-wrap text-right break-words ${className}`}
    >
      {badge !== undefined && (
        <span
          style={{
            backgroundColor: "var(--tashrif-wazan-bg)",
            border: "1px solid var(--tashrif-border-cell)",
            color: "var(--tashrif-accent)",
          }}
          className="ml-2 inline-block rounded px-1.5 py-0.5 align-middle font-mono-tabular text-[11px] font-bold"
        >
          {badge}
        </span>
      )}
      {value}
    </p>
  );
};

const MixedTranslation: React.FC<{ value: string; prefixBadge?: string | number }> = ({
  value,
  prefixBadge,
}) => {
  const paragraphs = useMemo(
    () =>
      String(value || "")
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
    [value]
  );

  return (
    <div className="space-y-2.5">
      {paragraphs.map((paragraph, idx) => {
        const arabicOnly = ARABIC_REGEX.test(paragraph) && !/[A-Za-z]/.test(paragraph);
        if (arabicOnly) {
          return <ArabicTextBlock key={idx} value={paragraph} className="my-1.5" />;
        }

        if (SUBHEADING_LINE_RE.test(paragraph) && paragraph.length <= 80) {
          return (
            <p
              key={idx}
              style={{ color: "var(--tashrif-accent)" }}
              className="pt-1 text-[11px] font-bold tracking-wider uppercase"
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
              style={{ color: "var(--tashrif-text)" }}
              className="prose-reader-text whitespace-pre-wrap leading-relaxed"
            >
              {idx === 0 && prefixBadge !== undefined && (
                <span
                  style={{ color: "var(--tashrif-accent)" }}
                  className="mr-1.5 font-mono-tabular font-bold"
                >
                  [{prefixBadge}]
                </span>
              )}
              <span
                style={{
                  backgroundColor: "var(--tashrif-paper)",
                  border: "1px solid var(--tashrif-border-cell)",
                  color: "var(--tashrif-accent)",
                }}
                className="font-mono-tabular mr-2 inline-block rounded px-1.5 py-0.5 text-[11px] font-bold"
              >
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
            style={{ color: "var(--tashrif-text)" }}
            className="prose-reader-text whitespace-pre-wrap leading-relaxed"
          >
            {idx === 0 && prefixBadge !== undefined && (
              <span
                style={{ color: "var(--tashrif-accent)" }}
                className="mr-1.5 font-mono-tabular font-bold"
              >
                [{prefixBadge}]
              </span>
            )}
            {paragraph}
          </p>
        );
      })}
    </div>
  );
};

const StructuredBlockRenderer: React.FC<{ block: StructuredBlock }> = ({ block }) => {
  if (block.type === "translation-label") {
    return (
      <p
        style={{ color: "var(--tashrif-accent)" }}
        className="pt-1 text-[11px] font-bold tracking-wider uppercase"
      >
        {block.text}
      </p>
    );
  }
  if (block.type === "arabic") {
    const trimmed = block.text.trim();
    if (/^(?:فَصْلٌ|خَاتِمَةٌ)$/.test(trimmed)) {
      return (
        <div dir="rtl" lang="ar" className="py-1 text-center">
          <span
            style={{
              backgroundColor: "var(--tashrif-wazan-bg)",
              border: "1px solid var(--tashrif-border-cell)",
              color: "var(--tashrif-accent)",
            }}
            className="font-arabic inline-block rounded-lg px-3 py-0.5 text-base font-bold"
          >
            {trimmed}
          </span>
        </div>
      );
    }
    return <ArabicTextBlock value={block.text} />;
  }
  if (block.type === "translation") {
    return (
      <p
        dir="ltr"
        style={{ color: "var(--tashrif-text)" }}
        className="prose-reader-text whitespace-pre-wrap leading-relaxed"
      >
        {block.text}
      </p>
    );
  }
  const segments = block.text.split(
    /([\u0600-\u06FF][\u0600-\u06FF\s\u064B-\u065F\u0670\u0610-\u061A\u06D6-\u06ED]*[\u0600-\u06FF\u064B-\u065F\u0670]?)/g
  );
  return (
    <p
      dir="auto"
      style={{ color: "var(--tashrif-text)" }}
      className="prose-reader-text whitespace-pre-wrap leading-relaxed"
    >
      {segments.map((seg, sIdx) =>
        ARABIC_REGEX.test(seg) ? (
          <span
            key={sIdx}
            lang="ar"
            dir="rtl"
            style={{ color: "var(--tashrif-accent)" }}
            className="font-arabic mx-0.5 inline-block text-[1.15em] leading-relaxed font-semibold"
          >
            {seg}
          </span>
        ) : (
          <React.Fragment key={sIdx}>{seg}</React.Fragment>
        )
      )}
    </p>
  );
};

function planPairedBatch(items: PairedParagraph[], start = 0, budget = BATCH_BUDGET_CHARS): number {
  let count = 0;
  let used = 0;
  while (start + count < items.length) {
    const item = items[start + count];
    const size = item.arabic.length + 140;
    if (count > 0 && used + size > budget) break;
    used += size;
    count += 1;
  }
  return count;
}

export const LocalKitabView: React.FC<LocalKitabViewProps> = ({
  book,
  initialChapterIndex,
  focusMode,
  onToggleFocus,
  onBackToLibrary,
  onGoHome,
}) => {
  const [chapters, setChapters] = useState<NormalizedKitabChapter[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [resumedFromSaved, setResumedFromSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openAllArti, setOpenAllArti] = useState(false);
  const [openItemIds, setOpenItemIds] = useState<Record<number, boolean>>({});
  const [renderedCount, setRenderedCount] = useState(0);
  const sentinelRef = useRef<HTMLParagraphElement | null>(null);
  const readingCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setResumedFromSaved(false);
    setOpenItemIds({});

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

  const pairedItems = useMemo(() => {
    if (!activeChapter) return null;
    return pairParagraphs(activeChapter, book.slug);
  }, [activeChapter, book.slug]);

  // Separate Safinah blocks when not 1-to-1 paired
  const structuredParts = useMemo(() => {
    if (!activeChapter?.blocks?.length || pairedItems) return null;
    const blocks = activeChapter.blocks;
    const labelIdx = blocks.findIndex((b) => b.type === "translation-label");
    if (labelIdx >= 0) {
      return {
        before: blocks.slice(0, labelIdx),
        after: blocks.slice(labelIdx + 1),
      };
    }
    return { before: blocks, after: [] as StructuredBlock[] };
  }, [activeChapter, pairedItems]);

  const arabicParagraphs = useMemo(
    () => (activeChapter && !pairedItems && !activeChapter.blocks?.length ? splitParagraphs(activeChapter.arabic) : []),
    [activeChapter, pairedItems]
  );

  const isOnlyBasmalah = useMemo(
    () => arabicParagraphs.length === 1 && isBasmalah(arabicParagraphs[0]),
    [arabicParagraphs]
  );

  const translationChunks = useMemo(() => {
    if (!activeChapter || pairedItems || activeChapter.blocks?.length) return [];
    return chunkText(activeChapter.translation, 5000);
  }, [activeChapter, pairedItems]);

  const hasFoldableContent = useMemo(() => {
    if (!activeChapter) return false;
    if (pairedItems && pairedItems.some((p) => !p.heading)) return true;
    if (structuredParts && structuredParts.before.length > 0 && structuredParts.after.length > 0) return true;
    if (!isOnlyBasmalah && arabicParagraphs.length > 0 && translationChunks.length > 0) return true;
    return false;
  }, [activeChapter, pairedItems, structuredParts, isOnlyBasmalah, arabicParagraphs.length, translationChunks.length]);

  useEffect(() => {
    if (!activeChapter) return;
    setOpenItemIds({});
    if (pairedItems) {
      setRenderedCount(planPairedBatch(pairedItems, 0));
    } else {
      setRenderedCount(0);
    }
  }, [activeIndex, activeChapter, pairedItems]);

  useEffect(() => {
    if (!pairedItems || renderedCount >= pairedItems.length) return;
    const node = sentinelRef.current;
    if (!node) return;

    const loadMore = () => {
      setRenderedCount((prev) => {
        if (prev >= pairedItems.length) return prev;
        return Math.min(pairedItems.length, prev + planPairedBatch(pairedItems, prev));
      });
    };

    if (typeof IntersectionObserver === "function") {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) loadMore();
        },
        { rootMargin: "1000px 0px" }
      );
      observer.observe(node);
      return () => observer.disconnect();
    }

    const onScroll = () => {
      if (node.getBoundingClientRect().top < window.innerHeight + 1000) loadMore();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pairedItems, renderedCount]);

  const selectChapter = (idx: number) => {
    if (idx < 0 || idx >= chapters.length) return;
    setActiveIndex(idx);
    setResumedFromSaved(false);
    setOpenItemIds({});
    writeKitabLastChapter(book.slug, idx);
    window.requestAnimationFrame(() => {
      readingCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const toggleSingleItem = (idx: number) => {
    setOpenItemIds((prev) => ({
      ...prev,
      [idx]: !(prev[idx] ?? openAllArti),
    }));
  };

  const handleToggleAll = () => {
    setOpenAllArti((prev) => !prev);
    setOpenItemIds({});
  };

  const visiblePairs = pairedItems ? pairedItems.slice(0, renderedCount) : [];
  const totalNonHeadingPoints = useMemo(
    () => (pairedItems ? pairedItems.filter((p) => !p.heading).length : 0),
    [pairedItems]
  );

  // Precompute 1-based point numbers excluding headings
  const pointNumbers = useMemo(() => {
    if (!pairedItems) return [];
    let counter = 0;
    return pairedItems.map((item) => {
      if (item.heading) return 0;
      counter += 1;
      return counter;
    });
  }, [pairedItems]);

  const arabicKitabTitle = KITAB_ARABIC_TITLES[book.slug] || book.title;

  return (
    <div style={{ backgroundColor: "var(--tashrif-bg)", minHeight: "100vh" }}>
      {/* Top Action Bar (seragam dengan Jurumiyah, Imrithi, Alfiyah, Tashrif) */}
      <KitabTopBar
        focusMode={focusMode}
        onToggleFocus={onToggleFocus}
        onBackToLibrary={onBackToLibrary}
        onGoHome={onGoHome}
      />

      <div
        style={{
          padding: "0.75rem",
          backgroundColor: "var(--tashrif-bg)",
          color: "var(--tashrif-text)",
        }}
        className="mx-auto max-w-2xl"
      >
        {/* 1. Banner Header Hijau Zamrud */}
        <div
          style={{
            padding: "0.95rem 0.75rem",
            marginBottom: "0.75rem",
            backgroundColor: "var(--tashrif-panel-bg)",
            border: "1px solid var(--tashrif-panel-border)",
            borderRadius: "0.75rem",
          }}
          className="text-center shadow-xs"
        >
          <h1
            dir="rtl"
            lang="ar"
            style={{
              color: "var(--tashrif-panel-bright)",
              lineHeight: "1.8",
              marginBottom: "0.15rem",
            }}
            className="font-arabic text-2xl font-bold"
          >
            {arabicKitabTitle}
          </h1>
          <p style={{ color: "var(--tashrif-panel-sub)" }} className="text-xs font-semibold">
            {book.title} · {book.category}
          </p>
        </div>

        {/* 2. Panel Kontrol Dropdown Bab & Tombol Buka Arti */}
        {!loading && !error && chapters.length > 0 && (
          <div
            style={{
              padding: "0.75rem",
              marginBottom: "0.85rem",
              backgroundColor: "var(--tashrif-paper)",
              border: "1px solid var(--tashrif-border-cell)",
              borderRadius: "0.75rem",
            }}
            className="shadow-xs"
          >
            <div className="flex items-center gap-2">
              <ThemedSelect
                ariaLabel={`Pilih Bab ${book.title}`}
                kickerLabel={`Daftar Bab ${book.title}`}
                value={activeIndex}
                onChange={(val) => selectChapter(Number(val))}
                options={chapters.map((ch, idx) => ({
                  value: idx,
                  label:
                    book.format === "structured" && ch.chapterNumber
                      ? `${ch.chapterNumber} · ${ch.title}`
                      : `${idx + 1}. ${ch.title}`,
                }))}
              />

              {hasFoldableContent && (
                <button
                  type="button"
                  onClick={handleToggleAll}
                  style={{
                    whiteSpace: "nowrap",
                    padding: "0.58rem 0.9rem",
                    backgroundColor: "var(--tashrif-btn-bg)",
                    color: "var(--tashrif-btn-text)",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                  }}
                  className="shrink-0 text-xs font-bold"
                >
                  {openAllArti ? "Tutup Arti" : "Buka Arti"}
                </button>
              )}
            </div>

            <p
              style={{
                marginTop: "0.5rem",
                paddingLeft: "0.15rem",
                color: "var(--tashrif-muted)",
              }}
              className="text-[11px]"
            >
              {hasFoldableContent
                ? "Ketuk poin matan Arab untuk membuka atau menutup arti"
                : `Menampilkan naskah bagian ${activeIndex + 1} dari ${chapters.length}`}
            </p>
          </div>
        )}

        {/* Loading / Error State */}
        {loading && (
          <div
            style={{
              backgroundColor: "var(--tashrif-paper)",
              border: "4px double var(--tashrif-border-strong)",
              borderRadius: "0.75rem",
              color: "var(--tashrif-muted)",
            }}
            className="mb-4 px-4 py-12 text-center text-xs font-medium"
          >
            Memuat naskah kitab…
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: "var(--tashrif-paper)",
              border: "4px double var(--tashrif-border-strong)",
              borderRadius: "0.75rem",
            }}
            className="mb-4 px-4 py-10 text-center text-xs font-semibold text-red-600 dark:text-red-400"
          >
            {error}
          </div>
        )}

        {/* 3. Bingkai Utama Kitab Kuning Klasik (Double Border) */}
        {!loading && !error && activeChapter && (
          <div
            ref={readingCardRef}
            style={{
              marginBottom: "0.95rem",
              backgroundColor: "var(--tashrif-paper)",
              border: "4px double var(--tashrif-border-strong)",
              borderRadius: "0.75rem",
            }}
            className="scroll-mt-20 overflow-hidden shadow-xs"
          >
            {/* Header Bab */}
            <div
              style={{
                borderBottom: "1px solid var(--tashrif-border-cell)",
                backgroundColor: "var(--tashrif-wazan-bg)",
                padding: "0.9rem 0.75rem",
              }}
              className="text-center"
            >
              <span
                style={{
                  color: "var(--tashrif-accent)",
                  letterSpacing: "0.06em",
                  marginBottom: "0.3rem",
                }}
                className="block font-mono-tabular text-[11px] font-bold uppercase"
              >
                {book.format === "structured" && activeChapter.chapterTitle
                  ? activeChapter.chapterTitle
                  : `BAB ${activeIndex + 1} / ${chapters.length}`}
                {totalNonHeadingPoints > 0 ? ` • ${totalNonHeadingPoints} POIN` : ""}
                {resumedFromSaved ? " • LANJUTAN TERAKHIR" : ""}
              </span>
              <h2
                style={{
                  color: "var(--tashrif-ink)",
                  marginBottom: "0.15rem",
                }}
                className="font-display text-lg font-bold sm:text-xl"
              >
                {activeChapter.title}
              </h2>
            </div>

            {/* Isi: Mode 1 — Paired Items (Jurumiyah-style interactive matan) */}
            {pairedItems && (
              <div>
                {visiblePairs.map((item, idx) => {
                  if (item.heading) {
                    return (
                      <div
                        key={idx}
                        style={{
                          borderBottom: "1px solid var(--tashrif-border-cell)",
                          backgroundColor: "var(--tashrif-row-alt)",
                        }}
                        className="px-3.5 py-2.5 text-center"
                      >
                        {item.arabic && (
                          <p
                            dir="rtl"
                            lang="ar"
                            style={{ color: "var(--tashrif-accent)", lineHeight: "1.9" }}
                            className="font-arabic text-base font-bold sm:text-lg"
                          >
                            {item.arabic}
                          </p>
                        )}
                        {item.translation && (
                          <p
                            style={{ color: "var(--tashrif-muted)" }}
                            className="mt-0.5 text-[11px] font-bold tracking-wide uppercase"
                          >
                            {item.translation}
                          </p>
                        )}
                      </div>
                    );
                  }

                  const isOpen = openItemIds[idx] ?? openAllArti;
                  const pointNo = pointNumbers[idx] || idx + 1;

                  return (
                    <div
                      key={idx}
                      style={{ borderBottom: "1px solid var(--tashrif-border-cell)" }}
                      className="last:border-b-0"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSingleItem(idx)}
                        aria-expanded={isOpen}
                        dir="rtl"
                        style={{
                          width: "100%",
                          textAlign: "right",
                          background: "transparent",
                          border: "none",
                        }}
                        className="block w-full cursor-pointer px-3.5 py-3 transition-colors hover:bg-emerald-900/5 dark:hover:bg-amber-400/5"
                      >
                        <ArabicTextBlock value={item.arabic} badge={pointNo} />
                      </button>

                      {isOpen && (
                        <div
                          style={{
                            borderTop: "1px dashed var(--tashrif-group-break)",
                            backgroundColor: "var(--tashrif-wazan-bg)",
                            color: "var(--tashrif-text)",
                          }}
                          className="px-3.5 py-2.5 text-xs leading-relaxed sm:text-[13px]"
                        >
                          <MixedTranslation value={item.translation} prefixBadge={pointNo} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {renderedCount < pairedItems.length && (
                  <p
                    ref={sentinelRef}
                    style={{ color: "var(--tashrif-muted)" }}
                    className="py-4 text-center text-xs"
                  >
                    Gulir untuk memuat lanjutan bab…
                  </p>
                )}
              </div>
            )}

            {/* Isi: Mode 2 — Safinah Unpaired Blocks (e.g. Tasydid Al-Fatihah / Laa Ilaaha Illallah) */}
            {!pairedItems && structuredParts && (
              <div>
                <button
                  type="button"
                  onClick={() => toggleSingleItem(0)}
                  aria-expanded={openItemIds[0] ?? openAllArti}
                  style={{
                    width: "100%",
                    textAlign: "right",
                    background: "transparent",
                    border: "none",
                  }}
                  className="block w-full cursor-pointer space-y-2.5 px-3.5 py-3 transition-colors hover:bg-emerald-900/5 dark:hover:bg-amber-400/5"
                >
                  {structuredParts.before.map((block, bIdx) => (
                    <StructuredBlockRenderer key={bIdx} block={block} />
                  ))}
                </button>

                {structuredParts.after.length > 0 && (openItemIds[0] ?? openAllArti) && (
                  <div
                    style={{
                      borderTop: "1px dashed var(--tashrif-group-break)",
                      backgroundColor: "var(--tashrif-wazan-bg)",
                      color: "var(--tashrif-text)",
                    }}
                    className="space-y-2.5 px-3.5 py-3 text-xs leading-relaxed sm:text-[13px]"
                  >
                    {structuredParts.after.map((block, bIdx) => (
                      <StructuredBlockRenderer key={bIdx} block={block} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Isi: Mode 3 — Unpaired Arabic + Translation OR Translation-Only */}
            {!pairedItems && !structuredParts && (
              <div>
                {arabicParagraphs.length > 0 && !isOnlyBasmalah && (
                  <button
                    type="button"
                    onClick={() => toggleSingleItem(0)}
                    aria-expanded={openItemIds[0] ?? openAllArti}
                    dir="rtl"
                    style={{
                      width: "100%",
                      textAlign: "right",
                      background: "transparent",
                      border: "none",
                    }}
                    className="block w-full cursor-pointer space-y-3 px-3.5 py-3.5 transition-colors hover:bg-emerald-900/5 dark:hover:bg-amber-400/5"
                  >
                    {arabicParagraphs.map((para, pIdx) => (
                      <ArabicTextBlock
                        key={pIdx}
                        value={para}
                        badge={arabicParagraphs.length > 1 ? pIdx + 1 : undefined}
                      />
                    ))}
                  </button>
                )}

                {isOnlyBasmalah && (
                  <div
                    style={{ borderBottom: "1px solid var(--tashrif-border-cell)" }}
                    className="px-3.5 py-3 text-center"
                  >
                    <p
                      dir="rtl"
                      lang="ar"
                      style={{
                        color: "var(--tashrif-ink)",
                        fontSize: "var(--arabic-reader-size)",
                        lineHeight: "2.0",
                      }}
                      className="font-arabic font-semibold"
                    >
                      {arabicParagraphs[0]}
                    </p>
                  </div>
                )}

                {translationChunks.length > 0 &&
                  (isOnlyBasmalah ||
                    arabicParagraphs.length === 0 ||
                    (openItemIds[0] ?? openAllArti)) && (
                    <div
                      style={
                        !isOnlyBasmalah && arabicParagraphs.length > 0
                          ? {
                              borderTop: "1px dashed var(--tashrif-group-break)",
                              backgroundColor: "var(--tashrif-wazan-bg)",
                              color: "var(--tashrif-text)",
                            }
                          : { color: "var(--tashrif-text)" }
                      }
                      className="space-y-3 px-3.5 py-3.5 text-xs leading-relaxed sm:text-[13px]"
                    >
                      {translationChunks.map((chunk, cIdx) => (
                        <MixedTranslation key={cIdx} value={chunk} />
                      ))}
                    </div>
                  )}

                {activeChapter.latin && (
                  <div
                    style={{
                      borderTop: "1px dashed var(--tashrif-border-cell)",
                      color: "var(--tashrif-muted)",
                    }}
                    className="px-3.5 py-3 text-xs italic whitespace-pre-wrap"
                  >
                    {activeChapter.latin}
                  </div>
                )}

                {!arabicParagraphs.length && !translationChunks.length && !activeChapter.latin && (
                  <p
                    style={{ color: "var(--tashrif-muted)" }}
                    className="px-4 py-8 text-center text-xs"
                  >
                    Bagian ini tidak memiliki field teks yang dikenali.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. Navigasi Mengambang Sebelumnya / Selanjutnya */}
        {!loading && !error && chapters.length > 0 && (
          <FloatingPageNav
            onPrev={() => selectChapter(activeIndex - 1)}
            onNext={() => selectChapter(activeIndex + 1)}
            canPrev={activeIndex > 0}
            canNext={activeIndex < chapters.length - 1}
            centerText={`${activeIndex + 1} / ${chapters.length}`}
            ariaLabel={`Navigasi antar bab ${book.title}`}
          />
        )}

        <FooterDisclaimer variant="compact" />
      </div>
    </div>
  );
};

export default LocalKitabView;
