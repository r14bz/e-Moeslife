import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Info,
  Languages,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import {
  EcodeApiError,
  fetchEcodeDetail,
  fetchEcodeList,
  fetchEcodeSummary,
  getCachedEcodeList,
  getCachedEcodeSummary,
  getCachedEcodeTranslation,
  hasTranslatableEcodeFields,
  searchEcodes,
  translateEcodeItem,
  type EcodeHalalStatus,
  type EcodeItem,
  type EcodeListMeta,
  type EcodeSummary,
  type EcodeTranslation,
} from "../services/ecodeService";
import { ThemedSelect } from "./ThemedSelect";
import { FooterDisclaimer } from "./FooterDisclaimer";

interface EcodeHalalViewProps {
  initialQuery?: string;
  onBackHome: () => void;
}

type StatusFilter = "" | "Halal" | "Doubtful" | "Haram";

const STATUS_META: Record<
  EcodeHalalStatus,
  {
    label: string;
    shortDesc: string;
    containerClass: string;
    textClass: string;
    icon: React.ReactNode;
  }
> = {
  halal: {
    label: "Halal",
    shortDesc: "Aman dikonsumsi (umumnya berasal dari bahan nabati, mineral, atau sintetis yang halal).",
    containerClass:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/70 dark:bg-emerald-950/50 dark:text-emerald-200",
    textClass: "text-emerald-700 dark:text-emerald-300",
    icon: <CheckCircle2 className="h-4 w-4 shrink-0" />,
  },
  doubtful: {
    label: "Diragukan (Syubhat)",
    shortDesc:
      "Status bergantung pada sumber bahan baku (bisa nabati atau hewani). Pastikan produk memiliki sertifikat halal resmi.",
    containerClass:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-200",
    textClass: "text-amber-700 dark:text-amber-300",
    icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
  },
  haram: {
    label: "Haram",
    shortDesc: "Berasal dari sumber atau proses yang diharamkan sehingga wajib dihindari oleh Muslim.",
    containerClass:
      "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800/70 dark:bg-rose-950/50 dark:text-rose-200",
    textClass: "text-rose-700 dark:text-rose-300",
    icon: <XCircle className="h-4 w-4 shrink-0" />,
  },
  unknown: {
    label: "Perlu Verifikasi",
    shortDesc: "Status belum terklasifikasi secara spesifik pada entri ini.",
    containerClass:
      "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200",
    textClass: "text-slate-600 dark:text-slate-300",
    icon: <Info className="h-4 w-4 shrink-0" />,
  },
};

const QUICK_CODES: ReadonlyArray<{ code: string; hint: string }> = [
  { code: "E100", hint: "Kurkumin" },
  { code: "E120", hint: "Karmin (Serangga)" },
  { code: "E322", hint: "Lesitin" },
  { code: "E428", hint: "Gelatin" },
  { code: "E471", hint: "Mono/Digliserida" },
  { code: "E621", hint: "MSG" },
];

export const EcodeHalalView: React.FC<EcodeHalalViewProps> = ({
  initialQuery = "",
  onBackHome,
}) => {
  const initialEcodeList = useMemo(
    () => (initialQuery.trim() ? null : getCachedEcodeList({ status: "", type: "", page: 1, limit: 20 })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery.trim());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const [summary, setSummary] = useState<EcodeSummary | null>(() => getCachedEcodeSummary());
  const [items, setItems] = useState<EcodeItem[]>(() => initialEcodeList?.items || []);
  const [meta, setMeta] = useState<EcodeListMeta>(
    () =>
      initialEcodeList?.meta || {
        page: 1,
        perPage: 20,
        total: 0,
        totalPages: 1,
      }
  );

  const [loading, setLoading] = useState<boolean>(() => !initialEcodeList);
  const [error, setError] = useState<string>("");
  const [isUnconfigured, setIsUnconfigured] = useState<boolean>(false);
  const [reloadTick, setReloadTick] = useState<number>(0);

  const [selectedItem, setSelectedItem] = useState<EcodeItem | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string>("");
  const [translation, setTranslation] = useState<EcodeTranslation | null>(null);
  const [translating, setTranslating] = useState<boolean>(false);
  const [translateError, setTranslateError] = useState<boolean>(false);
  const [showOriginalText, setShowOriginalText] = useState<boolean>(false);
  const [translateRetryTick, setTranslateRetryTick] = useState<number>(0);

  useEffect(() => {
    if (!selectedItem) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedItem(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedItem]);

  useEffect(() => {
    setShowOriginalText(false);
    setTranslateError(false);
  }, [selectedItem?.code]);

  useEffect(() => {
    if (!selectedItem || !hasTranslatableEcodeFields(selectedItem)) {
      setTranslation(null);
      setTranslating(false);
      setTranslateError(false);
      return;
    }

    const cached = getCachedEcodeTranslation(selectedItem);
    if (cached) {
      setTranslation(cached);
      setTranslating(false);
      setTranslateError(false);
      return;
    }

    const controller = new AbortController();
    setTranslation(null);
    setTranslating(true);
    setTranslateError(false);

    translateEcodeItem(selectedItem, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setTranslation(res);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setTranslateError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setTranslating(false);
        }
      });

    return () => controller.abort();
  }, [
    selectedItem?.code,
    selectedItem?.description,
    selectedItem?.source,
    selectedItem?.note,
    selectedItem?.halalReason,
    translateRetryTick,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    fetchEcodeSummary(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setSummary(data);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof EcodeApiError && err.unconfigured) {
          setIsUnconfigured(true);
        }
      });

    return () => controller.abort();
  }, [reloadTick]);

  useEffect(() => {
    const controller = new AbortController();
    const cachedPage = !debouncedQuery
      ? getCachedEcodeList({ status: statusFilter, type: typeFilter, page, limit: 20 })
      : null;

    if (cachedPage) {
      setItems(cachedPage.items);
      setMeta(cachedPage.meta);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError("");

    const task = debouncedQuery
      ? searchEcodes(debouncedQuery, { page, limit: 20 }, controller.signal)
      : fetchEcodeList(
          { status: statusFilter, type: typeFilter, page, limit: 20 },
          controller.signal
        );

    task
      .then((res) => {
        if (controller.signal.aborted) return;
        setItems(res.items);
        setMeta(res.meta);
        setIsUnconfigured(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (cachedPage) return;
        if (err instanceof EcodeApiError) {
          setIsUnconfigured(err.unconfigured);
          setError(err.message);
        } else {
          setError("Tidak dapat memuat daftar E-Code Halal saat ini. Periksa koneksi internet Anda.");
        }
        setItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery, statusFilter, typeFilter, page, reloadTick]);

  const displayedItems = useMemo(() => {
    if (!debouncedQuery) return items;
    return items.filter((item) => {
      if (statusFilter && item.halalStatus !== statusFilter.toLowerCase()) return false;
      if (typeFilter && item.type.toLowerCase() !== typeFilter.toLowerCase()) return false;
      return true;
    });
  }, [items, debouncedQuery, statusFilter, typeFilter]);

  const categoryOptions = useMemo(() => {
    const opts = [{ value: "", label: "Semua Kategori Bahan" }];
    if (summary?.types?.length) {
      for (const t of summary.types) {
        opts.push({
          value: t.type,
          label: t.count > 0 ? `${t.type} (${t.count})` : t.type,
        });
      }
    }
    return opts;
  }, [summary]);

  const openItemDetail = useCallback(async (item: EcodeItem) => {
    setSelectedItem(item);
    if (!item.code || item.code === "E-Code") return;
    setDetailLoading(true);
    try {
      const full = await fetchEcodeDetail(item.code);
      setSelectedItem((current) =>
        current?.code === item.code
          ? {
              ...item,
              ...full,
              description: full.description || item.description,
              halalReason: full.halalReason || item.halalReason,
              source: full.source || item.source,
              note: full.note || item.note,
            }
          : current
      );
    } catch {
      // Tetap tampilkan data ringkas yang sudah ada
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleCopyItem = async (
    item: EcodeItem,
    resolvedFields: {
      halalReason?: string;
      description?: string;
      source?: string;
      note?: string;
    }
  ) => {
    const statusLabel = STATUS_META[item.halalStatus].label;
    const text = [
      `${item.code} — ${item.name}`,
      `Status Halal: ${statusLabel}`,
      `Kategori: ${item.type}`,
      resolvedFields.halalReason ? `Alasan Status: ${resolvedFields.halalReason}` : "",
      resolvedFields.description ? `Keterangan: ${resolvedFields.description}` : "",
      resolvedFields.source ? `Sumber: ${resolvedFields.source}` : "",
      resolvedFields.note ? `Catatan: ${resolvedFields.note}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(item.code);
      window.setTimeout(() => setCopiedCode((prev) => (prev === item.code ? "" : prev)), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleStatusSelect = (next: StatusFilter) => {
    setStatusFilter(next);
    setPage(1);
  };

  const handleQuickCodeClick = async (code: string) => {
    setQuery(code);
    setDebouncedQuery(code);
    setPage(1);
    try {
      const detail = await fetchEcodeDetail(code);
      setSelectedItem(detail);
    } catch {
      // Pencarian di bawah tetap berjalan
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 pt-4 pb-8 sm:px-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card)] px-3.5 text-xs font-semibold text-[var(--theme-heading)] shadow-xs transition-colors hover:bg-[var(--theme-card-alt)]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Beranda</span>
        </button>

        <button
          type="button"
          onClick={() => setReloadTick((t) => t + 1)}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card)] px-3.5 text-xs font-semibold text-[var(--theme-nav-muted)] shadow-xs transition-colors hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* Hero Header */}
      <section className="rounded-2xl border border-[var(--theme-hero-border)] bg-gradient-to-br from-[var(--theme-primary-from)] via-[var(--theme-primary-via)] to-[var(--theme-primary-to)] p-5 text-white shadow-xs sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold tracking-wider text-[var(--theme-hero-eyebrow)] uppercase">
              Panduan Konsumsi Muslim
            </p>
            <h1 className="font-display mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Cek Status Halal E-Code
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--theme-hero-sub)] sm:text-sm">
              Periksa kode bahan tambahan pangan (E100–E1521) pada label kemasan makanan atau minuman
              untuk mengetahui status kehalalannya: Halal, Diragukan (Syubhat), atau Haram.
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-[var(--theme-hero-eyebrow)]">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>
      </section>

      {/* Summary Stats Strip (4-column KPI strip) */}
      {summary && summary.total > 0 && (
        <section aria-label="Ringkasan database E-Code Halal" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => handleStatusSelect("")}
            className={`rounded-2xl border p-3.5 text-left transition-colors ${
              statusFilter === ""
                ? "border-[var(--theme-primary)] bg-[var(--theme-tint-bg)]"
                : "border-[var(--theme-border)] bg-[var(--theme-card)] hover:border-[var(--theme-tint-border)]"
            }`}
          >
            <span className="block text-[11px] font-medium text-[var(--theme-muted)]">
              Total Kode E
            </span>
            <span className="font-mono-tabular mt-1 block text-xl font-bold text-[var(--theme-heading)] sm:text-2xl">
              {summary.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusSelect("Halal")}
            className={`rounded-2xl border p-3.5 text-left transition-colors ${
              statusFilter === "Halal"
                ? "border-emerald-600 bg-emerald-50/70 dark:border-emerald-500 dark:bg-emerald-950/40"
                : "border-[var(--theme-border)] bg-[var(--theme-card)] hover:border-emerald-400"
            }`}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Halal</span>
            </span>
            <span className="font-mono-tabular mt-1 block text-xl font-bold text-[var(--theme-heading)] sm:text-2xl">
              {summary.halal}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusSelect("Doubtful")}
            className={`rounded-2xl border p-3.5 text-left transition-colors ${
              statusFilter === "Doubtful"
                ? "border-amber-600 bg-amber-50/70 dark:border-amber-500 dark:bg-amber-950/40"
                : "border-[var(--theme-border)] bg-[var(--theme-card)] hover:border-amber-400"
            }`}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Diragukan</span>
            </span>
            <span className="font-mono-tabular mt-1 block text-xl font-bold text-[var(--theme-heading)] sm:text-2xl">
              {summary.doubtful}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusSelect("Haram")}
            className={`rounded-2xl border p-3.5 text-left transition-colors ${
              statusFilter === "Haram"
                ? "border-rose-600 bg-rose-50/70 dark:border-rose-500 dark:bg-rose-950/40"
                : "border-[var(--theme-border)] bg-[var(--theme-card)] hover:border-rose-400"
            }`}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
              <XCircle className="h-3.5 w-3.5" />
              <span>Haram</span>
            </span>
            <span className="font-mono-tabular mt-1 block text-xl font-bold text-[var(--theme-heading)] sm:text-2xl">
              {summary.haram}
            </span>
          </button>
        </section>
      )}

      {/* Search & Filters */}
      <section className="space-y-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-7">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--theme-muted)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode E atau nama bahan (mis. E120, E441, gelatin, lecithin)…"
              aria-label="Cari kode E atau nama bahan"
              className="min-h-[44px] w-full rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card-alt)] pr-10 pl-10 text-xs text-[var(--theme-ink)] outline-none placeholder:text-[var(--theme-muted)] focus:border-[var(--theme-primary)] focus:bg-[var(--theme-card)] sm:text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setDebouncedQuery("");
                  setPage(1);
                }}
                aria-label="Hapus pencarian"
                className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--theme-muted)] hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="lg:col-span-5">
            <ThemedSelect
              ariaLabel="Filter kategori bahan tambahan"
              value={typeFilter}
              options={categoryOptions}
              onChange={(val) => {
                setTypeFilter(val);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Status Segmented Tabs & Quick E-Codes */}
        <div className="flex flex-col gap-2.5 border-t border-[var(--theme-border-soft)] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Filter status kehalalan"
            className="flex flex-wrap gap-1 rounded-xl bg-[var(--theme-card-alt)] p-1"
          >
            {(
              [
                { id: "", label: "Semua" },
                { id: "Halal", label: "Halal" },
                { id: "Doubtful", label: "Diragukan" },
                { id: "Haram", label: "Haram" },
              ] as const
            ).map((opt) => {
              const active = statusFilter === opt.id;
              return (
                <button
                  key={opt.id || "all"}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleStatusSelect(opt.id)}
                  className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? "bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs"
                      : "text-[var(--theme-nav-muted)] hover:text-[var(--theme-heading)]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-[var(--theme-muted)]">
              Cek cepat:
            </span>
            {QUICK_CODES.map((sample) => (
              <button
                key={sample.code}
                type="button"
                onClick={() => void handleQuickCodeClick(sample.code)}
                title={sample.hint}
                className="font-mono-tabular min-h-[34px] rounded-lg border border-[var(--theme-border-strong)] bg-[var(--theme-card)] px-2.5 text-[11px] font-semibold text-[var(--theme-primary)] transition-colors hover:border-[var(--theme-primary)] hover:bg-[var(--theme-tint-bg)]"
              >
                {sample.code}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Configuration Notice / Error Banner */}
      {isUnconfigured && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
            <div>
              <p className="font-semibold">Kunci API Server Belum Terpasang</p>
              <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
                Fitur Cek Status Halal E-Code memerlukan environment variable{" "}
                <code className="font-mono-tabular font-semibold">AHMADSANUSI_API_KEY</code> pada
                konfigurasi server atau Vercel Environment Variables agar data dari layanan Ahmad
                Sanusi dapat dimuat secara aman.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && !isUnconfigured && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-6 text-center dark:border-rose-800/60 dark:bg-rose-950/30">
          <p className="text-sm font-medium text-rose-800 dark:text-rose-200">{error}</p>
          <button
            type="button"
            onClick={() => setReloadTick((t) => t + 1)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[var(--theme-primary)] px-4 text-xs font-semibold text-[var(--theme-primary-text)] hover:bg-[var(--theme-primary-hover)]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-8">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--theme-primary)]" />
          <p className="text-xs font-medium text-[var(--theme-muted)]">
            Memuat data status halal E-Code…
          </p>
        </div>
      )}

      {/* Results Grid */}
      {!loading && !error && (
        <>
          <div className="flex items-center justify-between text-xs text-[var(--theme-muted)]">
            <span>
              {debouncedQuery
                ? `Hasil pencarian "${debouncedQuery}"`
                : "Daftar Kode Bahan Tambahan Pangan (E-Code)"}
            </span>
            <span className="font-mono-tabular font-semibold">
              {displayedItems.length} ditampilkan · Total {meta.total}
            </span>
          </div>

          {displayedItems.length === 0 ? (
            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-8 text-center">
              <p className="text-sm font-semibold text-[var(--theme-heading)]">
                Tidak ada E-Code yang cocok
              </p>
              <p className="mt-1 text-xs text-[var(--theme-muted)]">
                Coba kata kunci lain seperti <span className="font-mono-tabular">E120</span>,{" "}
                <span className="font-mono-tabular">E441</span>, atau reset filter status dan kategori.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {displayedItems.map((item) => {
                const st = STATUS_META[item.halalStatus];
                return (
                  <button
                    key={`${item.code}-${item.name}`}
                    type="button"
                    onClick={() => void openItemDetail(item)}
                    className="group flex flex-col justify-between gap-2.5 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4 text-left shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--theme-primary)] hover:shadow-sm"
                  >
                    <div className="flex w-full items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono-tabular font-bold text-[var(--theme-primary)]">
                            {item.code}
                          </span>
                          <span aria-hidden="true" className="text-[var(--theme-border-strong)]">
                            ·
                          </span>
                          <span className="truncate text-[var(--theme-muted)]">
                            {item.type}
                          </span>
                        </div>
                        <h2 className="mt-1 text-sm font-semibold text-[var(--theme-heading)] group-hover:text-[var(--theme-primary)] sm:text-base">
                          {item.name}
                        </h2>
                      </div>

                      <div
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${st.containerClass}`}
                      >
                        {st.icon}
                        <span className="whitespace-nowrap">{st.label}</span>
                      </div>
                    </div>

                    {(item.halalReason || item.description) && (
                      <p className="line-clamp-2 text-xs leading-relaxed text-[var(--theme-muted)]">
                        {item.halalReason || item.description}
                      </p>
                    )}

                    <div className="flex w-full items-center justify-between border-t border-[var(--theme-border-soft)] pt-2 text-[11px] text-[var(--theme-muted)]">
                      <span>{item.source ? `Sumber: ${item.source}` : "Ketuk untuk detail lengkap"}</span>
                      <span className="font-semibold text-[var(--theme-primary)]">
                        Detail →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] px-4 py-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card-alt)] px-3.5 text-xs font-semibold text-[var(--theme-heading)] transition-colors hover:bg-[var(--theme-tint-bg)] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Sebelumnya</span>
              </button>

              <span className="font-mono-tabular text-xs font-semibold text-[var(--theme-muted)]">
                Halaman {page} / {meta.totalPages}
              </span>

              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[var(--theme-primary)] px-3.5 text-xs font-semibold text-[var(--theme-primary-text)] transition-colors hover:bg-[var(--theme-primary-hover)] disabled:opacity-40"
              >
                <span>Berikutnya</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedItem &&
        createPortal(
          <div
            className="modal-backdrop-enter fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-xs sm:items-center sm:p-4"
            onClick={() => setSelectedItem(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ecode-detail-title"
          >
            <div
              className="modal-card-enter w-full max-w-lg overflow-hidden rounded-t-3xl border border-[var(--theme-border-strong)] bg-[var(--theme-card)] shadow-2xl sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--theme-border-soft)] bg-[var(--theme-card-alt)] px-5 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-[var(--theme-muted)]">
                  <span className="font-mono-tabular font-bold text-[var(--theme-primary)]">
                    {selectedItem.code}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedItem.type}</span>
                </div>
                <h2
                  id="ecode-detail-title"
                  className="font-display mt-0.5 text-xl font-semibold text-[var(--theme-heading)]"
                >
                  {selectedItem.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                aria-label="Tutup detail E-Code"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card)] text-[var(--theme-nav-muted)] hover:bg-[var(--theme-tint-bg)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[75vh] space-y-4 overflow-y-auto p-5">
              {(() => {
                const canTranslate = hasTranslatableEcodeFields(selectedItem);
                const isTranslatedView = Boolean(translation) && !showOriginalText;
                const activeHalalReason =
                  (isTranslatedView ? translation?.halalReason : undefined) || selectedItem.halalReason;
                const activeDescription =
                  (isTranslatedView ? translation?.description : undefined) || selectedItem.description;
                const activeSource =
                  (isTranslatedView ? translation?.source : undefined) || selectedItem.source;
                const activeNote =
                  (isTranslatedView ? translation?.note : undefined) || selectedItem.note;
                const st = STATUS_META[selectedItem.halalStatus];

                return (
                  <>
                    {/* Status Callout */}
                    <div className={`rounded-2xl border p-4 ${st.containerClass}`}>
                      <div className="flex items-center gap-2 text-sm font-bold">
                        {st.icon}
                        <span>Status Kehalalan: {st.label}</span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed opacity-95">
                        {activeHalalReason || st.shortDesc}
                      </p>
                    </div>

                    {detailLoading && (
                      <div className="flex items-center gap-2 text-xs text-[var(--theme-muted)]">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Memuat detail tambahan…</span>
                      </div>
                    )}

                    {canTranslate && (
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--theme-border-soft)] pb-3">
                        <div className="flex items-center gap-2 text-xs text-[var(--theme-muted)]">
                          {translating ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--theme-primary)]" />
                              <span>Menerjemahkan keterangan ke Bahasa Indonesia…</span>
                            </>
                          ) : translateError && !translation ? (
                            <span>Terjemahan otomatis belum tersedia</span>
                          ) : isTranslatedView ? (
                            <span>Bahasa Indonesia (terjemahan otomatis)</span>
                          ) : (
                            <span>Teks asli sumber data (Bahasa Inggris)</span>
                          )}
                        </div>

                        {translateError && !translation ? (
                          <button
                            type="button"
                            onClick={() => setTranslateRetryTick((t) => t + 1)}
                            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card-alt)] px-3 text-xs font-semibold whitespace-nowrap shrink-0 text-[var(--theme-primary)] transition-colors hover:border-[var(--theme-primary)] hover:bg-[var(--theme-tint-bg)]"
                          >
                            <Languages className="h-3.5 w-3.5" />
                            <span>Terjemahkan (ID)</span>
                          </button>
                        ) : translation ? (
                          <button
                            type="button"
                            onClick={() => setShowOriginalText((prev) => !prev)}
                            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card-alt)] px-3 text-xs font-semibold whitespace-nowrap shrink-0 text-[var(--theme-heading)] transition-colors hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)]"
                          >
                            <Languages className="h-3.5 w-3.5 text-[var(--theme-primary)]" />
                            <span>{isTranslatedView ? "Lihat Teks Asli (EN)" : "Terjemahkan (ID)"}</span>
                          </button>
                        ) : null}
                      </div>
                    )}

                    {activeDescription && (
                      <div>
                        <h3 className="text-xs font-semibold text-[var(--theme-muted)]">
                          Keterangan &amp; Fungsi Bahan
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--theme-ink)]">
                          {activeDescription}
                        </p>
                      </div>
                    )}

                    {activeSource && (
                      <div>
                        <h3 className="text-xs font-semibold text-[var(--theme-muted)]">
                          Kemungkinan Sumber Bahan
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--theme-ink)]">
                          {activeSource}
                        </p>
                      </div>
                    )}

                    {activeNote && (
                      <div>
                        <h3 className="text-xs font-semibold text-[var(--theme-muted)]">
                          Catatan Tambahan
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--theme-ink)]">
                          {activeNote}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--theme-border-soft)] pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopyItem(selectedItem, {
                            halalReason: activeHalalReason,
                            description: activeDescription,
                            source: activeSource,
                            note: activeNote,
                          })
                        }
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-card-alt)] px-4 text-xs font-semibold whitespace-nowrap shrink-0 text-[var(--theme-heading)] hover:bg-[var(--theme-tint-bg)]"
                      >
                        {copiedCode === selectedItem.code ? (
                          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span>{copiedCode === selectedItem.code ? "Informasi Tersalin" : "Salin Info"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedItem(null)}
                        className="min-h-[44px] rounded-xl bg-[var(--theme-primary)] px-5 text-xs font-semibold whitespace-nowrap shrink-0 text-[var(--theme-primary-text)] hover:bg-[var(--theme-primary-hover)]"
                      >
                        Tutup
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
          </div>,
          document.body
        )}

      <FooterDisclaimer variant="compact" />
    </div>
  );
};
