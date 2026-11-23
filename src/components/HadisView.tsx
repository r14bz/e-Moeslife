import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Hash,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  fetchDailyHadis,
  fetchHadisBooks,
  fetchHadisDetail,
  fetchHadisList,
  formatHadisKitabName,
  getCachedDailyHadis,
  getCachedHadisBooks,
  getCachedHadisList,
  HadisApiError,
  searchHadis,
  type HadisBookMeta,
  type HadisItem,
} from "../services/hadisService";
import { ThemedSelect } from "./ThemedSelect";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface HadisViewProps {
  onBackHome: () => void;
}

const QUICK_TOPICS: ReadonlyArray<string> = [
  "niat",
  "shalat",
  "puasa",
  "sedekah",
  "sabar",
  "akhlak",
  "orang tua",
  "ilmu",
];

const DEFAULT_KITAB_SLUG = "shahih_bukhari";

export const HadisView: React.FC<HadisViewProps> = ({ onBackHome }) => {
  const initialListCache = useMemo(() => getCachedHadisList(DEFAULT_KITAB_SLUG, 1, 15), []);
  const [books, setBooks] = useState<HadisBookMeta[]>(() => getCachedHadisBooks() || []);
  const [dailyHadis, setDailyHadis] = useState<HadisItem | null>(() => getCachedDailyHadis());
  const [dailyExpanded, setDailyExpanded] = useState<boolean>(false);

  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [selectedKitab, setSelectedKitab] = useState<string>("");
  const [browseKitab, setBrowseKitab] = useState<string>(DEFAULT_KITAB_SLUG);
  const [jumpNomor, setJumpNomor] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const [items, setItems] = useState<HadisItem[]>(() => initialListCache?.items || []);
  const [total, setTotal] = useState<number>(() => initialListCache?.total || 0);
  const [totalPages, setTotalPages] = useState<number>(() => initialListCache?.totalPages || 1);
  const [loading, setLoading] = useState<boolean>(() => !initialListCache);
  const [error, setError] = useState<string>("");
  const [isUnconfigured, setIsUnconfigured] = useState<boolean>(false);
  const [reloadTick, setReloadTick] = useState<number>(0);

  const [selectedHadis, setSelectedHadis] = useState<HadisItem | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string>("");
  const [pageTurnDir, setPageTurnDir] = useState<"next" | "prev" | "fade">("fade");
  const [detailTurnDir, setDetailTurnDir] = useState<"next" | "prev" | "fade">("fade");

  const resultsTopRef = useRef<HTMLDivElement | null>(null);
  const booksRef = useRef<HadisBookMeta[]>(books);
  booksRef.current = books;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([
      fetchHadisBooks(controller.signal),
      fetchDailyHadis(booksRef.current, controller.signal),
    ]).then(([booksRes, dailyRes]) => {
      if (controller.signal.aborted) return;
      if (booksRes.status === "fulfilled") {
        setBooks(booksRes.value);
      } else if (booksRes.reason instanceof HadisApiError && booksRes.reason.unconfigured) {
        setIsUnconfigured(true);
      }
      if (dailyRes.status === "fulfilled") {
        setDailyHadis(dailyRes.value);
      }
    });
    return () => controller.abort();
  }, [reloadTick]);

  const isSearchMode = debouncedQuery.length >= 3;

  useEffect(() => {
    const controller = new AbortController();
    const activeKitab = isSearchMode ? selectedKitab : selectedKitab || browseKitab;
    const cachedPage = !isSearchMode
      ? getCachedHadisList(activeKitab || DEFAULT_KITAB_SLUG, page, 15)
      : null;

    if (cachedPage) {
      setItems(cachedPage.items);
      setTotal(cachedPage.total);
      setTotalPages(cachedPage.totalPages);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError("");

    const task = isSearchMode
      ? searchHadis(
          debouncedQuery,
          { kitab: selectedKitab || undefined, page, limit: 15, books: booksRef.current },
          controller.signal
        )
      : fetchHadisList(
          { kitab: activeKitab || DEFAULT_KITAB_SLUG, page, limit: 15, books: booksRef.current },
          controller.signal
        );

    task
      .then((res) => {
        if (controller.signal.aborted) return;
        setItems(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof HadisApiError && err.unconfigured) {
          setIsUnconfigured(true);
        }
        if (!cachedPage) {
          setError(err instanceof Error ? err.message : "Gagal memuat daftar hadis.");
          setItems([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [isSearchMode, debouncedQuery, selectedKitab, browseKitab, page, reloadTick]);

  const totalHadisCount = useMemo(
    () => books.reduce((sum, b) => sum + (b.jumlah || 0), 0),
    [books]
  );

  const handleCopyHadis = useCallback((item: HadisItem, key: string) => {
    const text = [
      `${item.kitabNama || formatHadisKitabName(item.kitab)} No. ${item.nomor}`,
      item.arab,
      item.terjemah,
    ]
      .filter(Boolean)
      .join("\n\n");
    if (!text) return;
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopiedKey(key);
        window.setTimeout(() => {
          setCopiedKey((prev) => (prev === key ? "" : prev));
        }, 2000);
      })
      .catch(() => undefined);
  }, []);

  const openDetail = useCallback(
    async (kitab: string, nomor: number, dir: "next" | "prev" | "fade" = "fade") => {
      setDetailTurnDir(dir);
      setDetailLoading(true);
      setDetailError("");
      try {
        const detail = await fetchHadisDetail(kitab, nomor, books);
        setSelectedHadis(detail);
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : "Hadis tidak ditemukan.");
      } finally {
        setDetailLoading(false);
      }
    },
    [books]
  );

  const handleJumpByNumber = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number.parseInt(jumpNomor.trim(), 10);
    if (!Number.isInteger(num) || num < 1) return;
    const targetKitab = selectedKitab || browseKitab || DEFAULT_KITAB_SLUG;
    void openDetail(targetKitab, num, "fade");
  };

  const handleChangePage = (nextPage: number) => {
    setPageTurnDir(nextPage > page ? "next" : nextPage < page ? "prev" : "fade");
    setPage(nextPage);
    window.requestAnimationFrame(() => {
      resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const kitabFilterOptions = useMemo(() => {
    if (isSearchMode) {
      return [
        {
          value: "",
          label: `Semua Kitab (${books.length || 10} kitab)`,
        },
        ...books.map((b) => ({
          value: b.slug,
          label: `${b.nama} (${b.jumlah.toLocaleString("id-ID")})`,
        })),
      ];
    }
    const list =
      books.length > 0
        ? books
        : [
            { slug: "shahih_bukhari", nama: "Shahih Bukhari", jumlah: 7008 },
            { slug: "shahih_muslim", nama: "Shahih Muslim", jumlah: 5362 },
            { slug: "sunan_abu_daud", nama: "Sunan Abu Daud", jumlah: 4590 },
            { slug: "sunan_tirmidzi", nama: "Sunan Tirmidzi", jumlah: 3891 },
            { slug: "sunan_nasai", nama: "Sunan Nasa'i", jumlah: 5662 },
            { slug: "sunan_ibnu_majah", nama: "Sunan Ibnu Majah", jumlah: 4332 },
            { slug: "musnad_ahmad", nama: "Musnad Ahmad", jumlah: 26363 },
            { slug: "musnad_syafii", nama: "Musnad Syafi'i", jumlah: 1800 },
            { slug: "riyadhus_shalihin", nama: "Riyadhus Shalihin", jumlah: 371 },
            { slug: "riyadhus_shalihin_arab", nama: "Riyadhus Shalihin (Arab)", jumlah: 850 },
          ];
    return list.map((b) => ({
      value: b.slug,
      label: `${b.nama} (${b.jumlah.toLocaleString("id-ID")})`,
    }));
  }, [books, isSearchMode]);

  const activeKitabSlug = isSearchMode ? selectedKitab : selectedKitab || browseKitab;
  const activeKitabTitle = activeKitabSlug
    ? formatHadisKitabName(activeKitabSlug, books)
    : "Semua Kitab Hadis";

  return (
    <div
      style={{
        backgroundColor: "var(--tashrif-bg)",
        color: "var(--tashrif-text)",
        minHeight: "100vh",
      }}
    >
      <div className="mx-auto max-w-6xl space-y-4 px-3.5 pt-3.5 pb-12 sm:px-6">
        {/* Top Back Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBackHome}
            style={{
              backgroundColor: "var(--tashrif-paper)",
              border: "1px solid var(--tashrif-border-cell)",
              color: "var(--tashrif-text)",
            }}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold shadow-xs transition-colors hover:bg-[var(--tashrif-dropdown-hover)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Beranda</span>
          </button>

          {totalHadisCount > 0 && (
            <span
              style={{
                backgroundColor: "var(--tashrif-wazan-bg)",
                border: "1px solid var(--tashrif-border-cell)",
                color: "var(--tashrif-accent)",
              }}
              className="font-mono-tabular rounded-lg px-2.5 py-1 text-[11px] font-bold"
            >
              {totalHadisCount.toLocaleString("id-ID")} Hadis · {books.length} Kitab
            </span>
          )}
        </div>

        {/* Hero Banner (Kitab Aesthetic) */}
        <div
          style={{
            backgroundColor: "var(--tashrif-panel-bg)",
            border: "1px solid var(--tashrif-panel-border)",
            borderRadius: "0.75rem",
          }}
          className="px-4 py-5 text-center shadow-xs sm:px-6"
        >
          <p
            dir="rtl"
            lang="ar"
            style={{ color: "var(--tashrif-panel-bright)", lineHeight: "1.8" }}
            className="font-arabic text-2xl font-bold sm:text-[1.7rem]"
          >
            البَحْثُ فِي الأَحَادِيثِ النَّبَوِيَّةِ
          </p>
          <h1 className="font-display mt-1 text-lg font-semibold text-white sm:text-xl">
            Pencarian Hadis Nabawi
          </h1>
          <p
            style={{ color: "var(--tashrif-panel-sub)" }}
            className="mx-auto mt-1 max-w-2xl text-xs leading-relaxed"
          >
            Telusuri puluhan ribu hadis lengkap dengan teks Arab &amp; terjemahan bahasa Indonesia dari 10 kitab hadis rujukan utama.
          </p>
        </div>

        {/* Hadis Hari Ini Highlight */}
        {dailyHadis && !isSearchMode && (
          <section
            style={{
              backgroundColor: "var(--tashrif-paper)",
              border: "1.5px solid var(--tashrif-border-strong)",
            }}
            className="rounded-xl p-3.5 shadow-xs sm:p-4"
            aria-label="Hadis Hari Ini"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  style={{
                    backgroundColor: "var(--tashrif-btn-bg)",
                    color: "var(--tashrif-btn-text)",
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p
                    style={{ color: "var(--tashrif-accent)" }}
                    className="text-[10px] font-bold tracking-wider uppercase"
                  >
                    Hadis Hari Ini
                  </p>
                  <p style={{ color: "var(--tashrif-ink)" }} className="text-xs font-bold sm:text-sm">
                    {dailyHadis.kitabNama} · No. {dailyHadis.nomor}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopyHadis(dailyHadis, "daily")}
                  style={{
                    border: "1px solid var(--tashrif-border-cell)",
                    backgroundColor: "var(--tashrif-wazan-bg)",
                    color: "var(--tashrif-text)",
                  }}
                  className="inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold"
                >
                  {copiedKey === "daily" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copiedKey === "daily" ? "Tersalin" : "Salin"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDailyExpanded((prev) => !prev)}
                  style={{
                    backgroundColor: "var(--tashrif-btn-bg)",
                    color: "var(--tashrif-btn-text)",
                  }}
                  className="min-h-[32px] rounded-lg px-2.5 text-[11px] font-bold"
                >
                  {dailyExpanded ? "Ringkas" : "Baca Lengkap"}
                </button>
              </div>
            </div>

            {dailyHadis.arab && (
              <p
                dir="rtl"
                lang="ar"
                style={{ color: "var(--tashrif-ink)" }}
                className={`font-arabic mt-3 text-right text-lg leading-[2] sm:text-xl ${
                  dailyExpanded ? "" : "line-clamp-2"
                }`}
              >
                {dailyHadis.arab}
              </p>
            )}
            {dailyHadis.terjemah && (
              <p
                style={{ color: "var(--tashrif-text)" }}
                className={`mt-2 text-xs leading-relaxed sm:text-sm ${
                  dailyExpanded ? "" : "line-clamp-3"
                }`}
              >
                {dailyHadis.terjemah}
              </p>
            )}
          </section>
        )}

        {/* Search, Kitab Filter & Jump by Number */}
        <section
          style={{
            backgroundColor: "var(--tashrif-paper)",
            border: "1px solid var(--tashrif-border-cell)",
          }}
          className="space-y-3 rounded-xl p-3.5 shadow-xs sm:p-4"
        >
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-[minmax(0,1fr)_250px]">
            <label className="relative flex min-h-[42px] items-center">
              <Search
                style={{ color: "var(--tashrif-muted)" }}
                className="pointer-events-none absolute left-3 h-4 w-4"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari terjemahan hadis (min. 3 huruf, mis. niat, shalat, sabar)…"
                aria-label="Cari hadis berdasarkan terjemahan"
                style={{
                  border: "1.5px solid var(--tashrif-border-strong)",
                  backgroundColor: "var(--tashrif-control-bg)",
                  color: "var(--tashrif-text)",
                }}
                className="min-h-[42px] w-full rounded-xl pr-3.5 pl-9 text-xs font-medium outline-none sm:text-sm"
              />
            </label>

            <ThemedSelect
              ariaLabel="Pilih Kitab Hadis"
              kickerLabel="Filter Kitab Hadis"
              value={isSearchMode ? selectedKitab : selectedKitab || browseKitab}
              onChange={(val) => {
                const slug = String(val);
                if (isSearchMode) {
                  setSelectedKitab(slug);
                } else {
                  setSelectedKitab(slug);
                  setBrowseKitab(slug || DEFAULT_KITAB_SLUG);
                }
                setPage(1);
              }}
              options={kitabFilterOptions}
            />
          </div>

          {query.trim().length > 0 && query.trim().length < 3 && (
            <p style={{ color: "var(--tashrif-accent)" }} className="text-[11px] font-medium">
              Ketik minimal 3 karakter untuk mencari di seluruh terjemahan hadis.
            </p>
          )}

          {/* Quick Search Topics + Direct Number Lookup */}
          <div className="flex flex-col justify-between gap-2.5 border-t border-[var(--tashrif-border-cell)] pt-2.5 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                style={{ color: "var(--tashrif-muted)" }}
                className="mr-1 text-[11px] font-semibold"
              >
                Topik cepat:
              </span>
              {QUICK_TOPICS.map((topic) => {
                const active = query.trim().toLowerCase() === topic;
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setQuery(active ? "" : topic)}
                    style={
                      active
                        ? {
                            backgroundColor: "var(--tashrif-btn-bg)",
                            color: "var(--tashrif-btn-text)",
                          }
                        : {
                            border: "1px solid var(--tashrif-border-cell)",
                            backgroundColor: "var(--tashrif-wazan-bg)",
                            color: "var(--tashrif-text)",
                          }
                    }
                    className="min-h-[30px] rounded-lg px-2.5 text-[11px] font-semibold capitalize transition-colors"
                  >
                    {topic}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleJumpByNumber} className="flex shrink-0 items-center gap-1.5">
              <label className="relative flex items-center">
                <Hash
                  style={{ color: "var(--tashrif-muted)" }}
                  className="pointer-events-none absolute left-2.5 h-3.5 w-3.5"
                />
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={jumpNomor}
                  onChange={(e) => setJumpNomor(e.target.value)}
                  placeholder="No. Hadis"
                  aria-label="Buka nomor hadis tertentu"
                  style={{
                    border: "1px solid var(--tashrif-border-strong)",
                    backgroundColor: "var(--tashrif-control-bg)",
                    color: "var(--tashrif-text)",
                  }}
                  className="font-mono-tabular min-h-[34px] w-28 rounded-lg pr-2 pl-7 text-xs font-medium outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={!jumpNomor.trim()}
                style={{
                  backgroundColor: "var(--tashrif-btn-bg)",
                  color: "var(--tashrif-btn-text)",
                }}
                className="min-h-[34px] rounded-lg px-3 text-[11px] font-bold disabled:opacity-45"
              >
                Buka
              </button>
            </form>
          </div>
        </section>

        {/* Results Section */}
        <div ref={resultsTopRef} className="scroll-mt-20 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div>
              <h2
                style={{ color: "var(--tashrif-ink)" }}
                className="font-display text-base font-semibold sm:text-lg"
              >
                {isSearchMode
                  ? `Hasil Pencarian “${debouncedQuery}”`
                  : activeKitabTitle}
              </h2>
              <p style={{ color: "var(--tashrif-muted)" }} className="text-xs">
                {loading
                  ? "Memuat hadis…"
                  : `${total.toLocaleString("id-ID")} hadis ditemukan · Halaman ${page} dari ${totalPages}`}
              </p>
            </div>
            {isSearchMode && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedKitab("");
                }}
                style={{
                  border: "1px solid var(--tashrif-border-cell)",
                  backgroundColor: "var(--tashrif-paper)",
                  color: "var(--tashrif-text)",
                }}
                className="inline-flex min-h-[34px] items-center gap-1 rounded-lg px-2.5 text-xs font-semibold"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset pencarian</span>
              </button>
            )}
          </div>

          {loading && (
            <div
              style={{
                backgroundColor: "var(--tashrif-paper)",
                border: "1px solid var(--tashrif-border-cell)",
                color: "var(--tashrif-muted)",
              }}
              className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-xl p-8 text-xs font-semibold"
            >
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Mengambil data hadis…</span>
            </div>
          )}

          {!loading && error && (
            <div
              style={{
                backgroundColor: "var(--tashrif-paper)",
                border: "1px solid var(--tashrif-border-strong)",
              }}
              className="space-y-3 rounded-xl p-6 text-center"
            >
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 sm:text-sm">
                {error}
              </p>
              {isUnconfigured && (
                <p style={{ color: "var(--tashrif-muted)" }} className="text-xs">
                  Pastikan AHMADSANUSI_API_KEY telah diatur pada server API.
                </p>
              )}
              <button
                type="button"
                onClick={() => setReloadTick((n) => n + 1)}
                style={{
                  backgroundColor: "var(--tashrif-btn-bg)",
                  color: "var(--tashrif-btn-text)",
                }}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-4 text-xs font-bold"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Coba Lagi</span>
              </button>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div
              style={{
                backgroundColor: "var(--tashrif-paper)",
                border: "1px dashed var(--tashrif-group-break)",
                color: "var(--tashrif-muted)",
              }}
              className="rounded-xl p-8 text-center text-xs sm:text-sm"
            >
              Tidak ditemukan hadis yang cocok dengan kata kunci tersebut. Coba kata kunci lain seperti <em>niat</em>, <em>shalat</em>, atau <em>sedekah</em>.
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div
              key={`${activeKitabSlug || "all"}-${debouncedQuery}-${page}`}
              className={`space-y-3 page-enter-${pageTurnDir}`}
            >
              {items.map((item, idx) => {
                const itemKey = `${item.kitab}-${item.nomor}-${idx}`;
                const isCopied = copiedKey === itemKey;
                return (
                  <article
                    key={itemKey}
                    style={{
                      backgroundColor: "var(--tashrif-paper)",
                      border: "1.5px solid var(--tashrif-border-cell)",
                    }}
                    className="overflow-hidden rounded-xl shadow-xs transition-colors hover:border-[var(--tashrif-border-strong)]"
                  >
                    <div
                      style={{
                        backgroundColor: "var(--tashrif-wazan-bg)",
                        borderBottom: "1px solid var(--tashrif-border-cell)",
                      }}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen
                          style={{ color: "var(--tashrif-accent)" }}
                          className="h-3.5 w-3.5 shrink-0"
                        />
                        <span
                          style={{ color: "var(--tashrif-ink)" }}
                          className="text-xs font-bold sm:text-sm"
                        >
                          {item.kitabNama}
                        </span>
                        <span
                          style={{
                            backgroundColor: "var(--tashrif-paper)",
                            border: "1px solid var(--tashrif-border-cell)",
                            color: "var(--tashrif-accent)",
                          }}
                          className="font-mono-tabular rounded-md px-2 py-0.5 text-[11px] font-bold"
                        >
                          No. {item.nomor}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyHadis(item, itemKey)}
                          style={{
                            border: "1px solid var(--tashrif-border-cell)",
                            backgroundColor: "var(--tashrif-paper)",
                            color: "var(--tashrif-text)",
                          }}
                          className="inline-flex min-h-[30px] items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold hover:opacity-90"
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
                          onClick={() => {
                            setDetailTurnDir("fade");
                            setSelectedHadis(item);
                          }}
                          style={{
                            backgroundColor: "var(--tashrif-btn-bg)",
                            color: "var(--tashrif-btn-text)",
                          }}
                          className="min-h-[30px] rounded-lg px-2.5 text-[11px] font-bold hover:opacity-90"
                        >
                          Baca Detail
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 px-4 py-4 sm:px-5">
                      {item.arab && (
                        <p
                          dir="rtl"
                          lang="ar"
                          style={{ color: "var(--tashrif-ink)" }}
                          className="arabic-classic-text line-clamp-4 text-right whitespace-pre-wrap"
                        >
                          {item.arab}
                        </p>
                      )}
                      {item.terjemah ? (
                        <p
                          style={{
                            color: "var(--tashrif-text)",
                            borderTop: item.arab ? "1px dashed var(--tashrif-group-break)" : undefined,
                          }}
                          className={`prose-reader-text line-clamp-4 whitespace-pre-wrap ${
                            item.arab ? "pt-3" : ""
                          }`}
                        >
                          {item.terjemah}
                        </p>
                      ) : (
                        <p
                          style={{ color: "var(--tashrif-muted)" }}
                          className="text-xs italic"
                        >
                          Teks pada edisi kitab ini tersedia dalam bahasa Arab.
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div
              style={{
                backgroundColor: "var(--tashrif-paper)",
                border: "1px solid var(--tashrif-border-cell)",
              }}
              className="flex items-center justify-between gap-2 rounded-xl px-4 py-2.5 shadow-xs"
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => handleChangePage(page - 1)}
                style={{
                  border: "1px solid var(--tashrif-border-cell)",
                  backgroundColor: "var(--tashrif-wazan-bg)",
                  color: "var(--tashrif-text)",
                }}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-3 text-xs font-bold disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Sebelumnya</span>
              </button>

              <span
                style={{ color: "var(--tashrif-accent)" }}
                className="font-mono-tabular text-xs font-bold"
              >
                {page} / {totalPages.toLocaleString("id-ID")}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => handleChangePage(page + 1)}
                style={{
                  backgroundColor: "var(--tashrif-btn-bg)",
                  color: "var(--tashrif-btn-text)",
                }}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-3 text-xs font-bold disabled:opacity-40"
              >
                <span>Berikutnya</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Full Hadith Detail Modal */}
        {(selectedHadis || detailLoading || detailError) &&
          createPortal(
            <div
              className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3.5 backdrop-blur-xs sm:p-6"
              onClick={() => {
                setSelectedHadis(null);
                setDetailError("");
              }}
            >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Detail Hadis"
              style={{
                backgroundColor: "var(--tashrif-paper)",
                border: "2px solid var(--tashrif-border-strong)",
                color: "var(--tashrif-text)",
              }}
              className="modal-card-enter flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  backgroundColor: "var(--tashrif-wazan-bg)",
                  borderBottom: "1px solid var(--tashrif-border-cell)",
                }}
                className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
              >
                <div>
                  <p
                    style={{ color: "var(--tashrif-accent)" }}
                    className="font-mono-tabular text-[11px] font-bold uppercase"
                  >
                    Rujukan Hadis
                  </p>
                  <h3 style={{ color: "var(--tashrif-ink)" }} className="font-display text-base font-semibold sm:text-lg">
                    {selectedHadis
                      ? `${selectedHadis.kitabNama} · No. ${selectedHadis.nomor}`
                      : "Memuat Hadis…"}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  {selectedHadis && (
                    <button
                      type="button"
                      onClick={() => handleCopyHadis(selectedHadis, "modal")}
                      style={{
                        border: "1px solid var(--tashrif-border-cell)",
                        backgroundColor: "var(--tashrif-paper)",
                        color: "var(--tashrif-text)",
                      }}
                      className="inline-flex min-h-[34px] items-center gap-1 rounded-lg px-2.5 text-xs font-bold"
                    >
                      {copiedKey === "modal" ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedKey === "modal" ? "Tersalin" : "Salin"}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHadis(null);
                      setDetailError("");
                    }}
                    aria-label="Tutup"
                    style={{
                      border: "1px solid var(--tashrif-border-cell)",
                      backgroundColor: "var(--tashrif-paper)",
                      color: "var(--tashrif-text)",
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                {detailLoading && (
                  <div className="flex items-center justify-center gap-2 py-12 text-xs font-semibold">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memuat teks hadis…</span>
                  </div>
                )}

                {!detailLoading && detailError && (
                  <p className="py-8 text-center text-xs font-semibold text-red-700 dark:text-red-400">
                    {detailError}
                  </p>
                )}

                {!detailLoading && !detailError && selectedHadis && (
                  <div
                    key={`${selectedHadis.kitab}-${selectedHadis.nomor}`}
                    className={`space-y-4 page-enter-${detailTurnDir}`}
                  >
                    {selectedHadis.arab && (
                      <p
                        dir="rtl"
                        lang="ar"
                        style={{ color: "var(--tashrif-ink)" }}
                        className="arabic-classic-text whitespace-pre-wrap text-right"
                      >
                        {selectedHadis.arab}
                      </p>
                    )}

                    {selectedHadis.terjemah ? (
                      <div
                        style={{
                          borderTop: selectedHadis.arab
                            ? "1px dashed var(--tashrif-group-break)"
                            : undefined,
                          backgroundColor: "var(--tashrif-wazan-bg)",
                        }}
                        className="rounded-xl p-4"
                      >
                        <p
                          style={{ color: "var(--tashrif-accent)" }}
                          className="mb-1.5 text-[11px] font-bold tracking-wider uppercase"
                        >
                          Terjemahan
                        </p>
                        <p
                          style={{ color: "var(--tashrif-text)" }}
                          className="prose-reader-text whitespace-pre-wrap"
                        >
                          {selectedHadis.terjemah}
                        </p>
                      </div>
                    ) : (
                      <p style={{ color: "var(--tashrif-muted)" }} className="text-xs italic">
                        Terjemahan bahasa Indonesia tidak tersedia pada entri kitab ini.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {selectedHadis && (
                <div
                  style={{
                    borderTop: "1px solid var(--tashrif-border-cell)",
                    backgroundColor: "var(--tashrif-row-alt)",
                  }}
                  className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5"
                >
                  <button
                    type="button"
                    disabled={detailLoading || selectedHadis.nomor <= 1}
                    onClick={() => void openDetail(selectedHadis.kitab, selectedHadis.nomor - 1, "prev")}
                    style={{
                      border: "1px solid var(--tashrif-border-cell)",
                      backgroundColor: "var(--tashrif-paper)",
                      color: "var(--tashrif-text)",
                    }}
                    className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-3 text-xs font-bold disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>No. {Math.max(1, selectedHadis.nomor - 1)}</span>
                  </button>

                  <span
                    style={{ color: "var(--tashrif-muted)" }}
                    className="font-mono-tabular text-xs font-semibold"
                  >
                    Hadis #{selectedHadis.nomor}
                  </span>

                  <button
                    type="button"
                    disabled={detailLoading}
                    onClick={() => void openDetail(selectedHadis.kitab, selectedHadis.nomor + 1, "next")}
                    style={{
                      backgroundColor: "var(--tashrif-btn-bg)",
                      color: "var(--tashrif-btn-text)",
                    }}
                    className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-3 text-xs font-bold disabled:opacity-40"
                  >
                    <span>No. {selectedHadis.nomor + 1}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

        <FooterDisclaimer />
      </div>
    </div>
  );
};
