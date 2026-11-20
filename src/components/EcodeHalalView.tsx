import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Info,
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
  searchEcodes,
  type EcodeHalalStatus,
  type EcodeItem,
  type EcodeListMeta,
  type EcodeSummary,
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
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery.trim());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const [summary, setSummary] = useState<EcodeSummary | null>(null);
  const [items, setItems] = useState<EcodeItem[]>([]);
  const [meta, setMeta] = useState<EcodeListMeta>({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isUnconfigured, setIsUnconfigured] = useState<boolean>(false);
  const [reloadTick, setReloadTick] = useState<number>(0);

  const [selectedItem, setSelectedItem] = useState<EcodeItem | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string>("");

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
    setLoading(true);
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

  const handleCopyItem = async (item: EcodeItem) => {
    const statusLabel = STATUS_META[item.halalStatus].label;
    const text = [
      `${item.code} — ${item.name}`,
      `Status Halal: ${statusLabel}`,
      `Kategori: ${item.type}`,
      item.halalReason ? `Alasan Status: ${item.halalReason}` : "",
      item.description ? `Keterangan: ${item.description}` : "",
      item.source ? `Sumber: ${item.source}` : "",
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
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#dce4df] bg-white px-3.5 text-xs font-semibold text-[#103d2c] shadow-xs transition-colors hover:bg-[#f4f7f5] dark:border-slate-800 dark:bg-[#111A27] dark:text-slate-200 dark:hover:bg-[#192638]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Beranda</span>
        </button>

        <button
          type="button"
          onClick={() => setReloadTick((t) => t + 1)}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#dce4df] bg-white px-3.5 text-xs font-semibold text-[#354c3e] shadow-xs transition-colors hover:border-[#134a35] hover:text-[#103d2c] dark:border-slate-800 dark:bg-[#111A27] dark:text-slate-300 dark:hover:border-[#E2B354] dark:hover:text-[#E2B354]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* Hero Header */}
      <section className="rounded-2xl border border-[#0f3b2a] bg-gradient-to-br from-[#0f3d2b] via-[#134a35] to-[#1b5e44] p-5 text-white shadow-xs sm:p-6 dark:border-[#243B55] dark:from-[#102336] dark:via-[#152D46] dark:to-[#1B3A59]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold tracking-wider text-[#f3d99d] uppercase dark:text-[#E2B354]">
              Panduan Konsumsi Muslim
            </p>
            <h1 className="font-display mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Cek Status Halal E-Code
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-[#e3ebe5] sm:text-sm dark:text-slate-300">
              Periksa kode bahan tambahan pangan (E100–E1521) pada label kemasan makanan atau minuman
              untuk mengetahui status kehalalannya: Halal, Diragukan (Syubhat), atau Haram.
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#e6c98e]/35 bg-white/10 text-[#f3d99d]">
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
                ? "border-[#134a35] bg-[#f4f8f5] dark:border-[#E2B354] dark:bg-[#162336]"
                : "border-[#e2e8e4] bg-white hover:border-[#b7d3c3] dark:border-slate-800 dark:bg-[#111A27]"
            }`}
          >
            <span className="block text-[11px] font-medium text-[#5e6a62] dark:text-slate-400">
              Total Kode E
            </span>
            <span className="font-mono-tabular mt-1 block text-xl font-bold text-[#103d2c] sm:text-2xl dark:text-white">
              {summary.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusSelect("Halal")}
            className={`rounded-2xl border p-3.5 text-left transition-colors ${
              statusFilter === "Halal"
                ? "border-emerald-600 bg-emerald-50/70 dark:border-emerald-500 dark:bg-emerald-950/40"
                : "border-[#e2e8e4] bg-white hover:border-emerald-300 dark:border-slate-800 dark:bg-[#111A27]"
            }`}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Halal</span>
            </span>
            <span className="font-mono-tabular mt-1 block text-xl font-bold text-[#103d2c] sm:text-2xl dark:text-white">
              {summary.halal}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusSelect("Doubtful")}
            className={`rounded-2xl border p-3.5 text-left transition-colors ${
              statusFilter === "Doubtful"
                ? "border-amber-600 bg-amber-50/70 dark:border-amber-500 dark:bg-amber-950/40"
                : "border-[#e2e8e4] bg-white hover:border-amber-300 dark:border-slate-800 dark:bg-[#111A27]"
            }`}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Diragukan</span>
            </span>
            <span className="font-mono-tabular mt-1 block text-xl font-bold text-[#103d2c] sm:text-2xl dark:text-white">
              {summary.doubtful}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusSelect("Haram")}
            className={`rounded-2xl border p-3.5 text-left transition-colors ${
              statusFilter === "Haram"
                ? "border-rose-600 bg-rose-50/70 dark:border-rose-500 dark:bg-rose-950/40"
                : "border-[#e2e8e4] bg-white hover:border-rose-300 dark:border-slate-800 dark:bg-[#111A27]"
            }`}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
              <XCircle className="h-3.5 w-3.5" />
              <span>Haram</span>
            </span>
            <span className="font-mono-tabular mt-1 block text-xl font-bold text-[#103d2c] sm:text-2xl dark:text-white">
              {summary.haram}
            </span>
          </button>
        </section>
      )}

      {/* Search & Filters */}
      <section className="space-y-3 rounded-2xl border border-[#e2e8e4] bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#111A27]">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-7">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#6d7971] dark:text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode E atau nama bahan (mis. E120, E441, gelatin, lecithin)…"
              aria-label="Cari kode E atau nama bahan"
              className="min-h-[44px] w-full rounded-xl border border-[#dce4df] bg-[#f8faf9] pr-10 pl-10 text-xs text-[#1d2c24] outline-none placeholder:text-[#7f8b83] focus:border-[#134a35] focus:bg-white sm:text-sm dark:border-slate-700 dark:bg-[#152030] dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-[#E2B354]"
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
                className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#5e6a62] hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/10"
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
        <div className="flex flex-col gap-2.5 border-t border-[#edf2ef] pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div
            role="tablist"
            aria-label="Filter status kehalalan"
            className="flex flex-wrap gap-1 rounded-xl bg-[#f4f7f5] p-1 dark:bg-[#152030]"
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
                      ? "bg-[#134a35] text-white shadow-xs dark:bg-[#E2B354] dark:text-[#0B111A]"
                      : "text-[#354c3e] hover:text-[#103d2c] dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-[#5e6a62] dark:text-slate-400">
              Cek cepat:
            </span>
            {QUICK_CODES.map((sample) => (
              <button
                key={sample.code}
                type="button"
                onClick={() => void handleQuickCodeClick(sample.code)}
                title={sample.hint}
                className="font-mono-tabular min-h-[34px] rounded-lg border border-[#dce4df] bg-white px-2.5 text-[11px] font-semibold text-[#134a35] transition-colors hover:border-[#134a35] hover:bg-[#f4f8f5] dark:border-slate-700 dark:bg-[#162131] dark:text-[#E2B354] dark:hover:border-[#E2B354]"
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
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#134a35] px-4 text-xs font-semibold text-white hover:bg-[#0e3928] dark:bg-[#E2B354] dark:text-[#0B111A]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border border-[#e2e8e4] bg-white p-8 dark:border-slate-800 dark:bg-[#111A27]">
          <Loader2 className="h-6 w-6 animate-spin text-[#134a35] dark:text-[#E2B354]" />
          <p className="text-xs font-medium text-[#5e6a62] dark:text-slate-400">
            Memuat data status halal E-Code…
          </p>
        </div>
      )}

      {/* Results Grid */}
      {!loading && !error && (
        <>
          <div className="flex items-center justify-between text-xs text-[#5e6a62] dark:text-slate-400">
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
            <div className="rounded-2xl border border-[#e2e8e4] bg-white p-8 text-center dark:border-slate-800 dark:bg-[#111A27]">
              <p className="text-sm font-semibold text-[#103d2c] dark:text-white">
                Tidak ada E-Code yang cocok
              </p>
              <p className="mt-1 text-xs text-[#5e6a62] dark:text-slate-400">
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
                    className="group flex flex-col justify-between gap-2.5 rounded-2xl border border-[#e2e8e4] bg-white p-4 text-left shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#134a35] hover:shadow-sm dark:border-slate-800 dark:bg-[#111A27] dark:hover:border-[#E2B354]"
                  >
                    <div className="flex w-full items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono-tabular font-bold text-[#134a35] dark:text-[#E2B354]">
                            {item.code}
                          </span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                            ·
                          </span>
                          <span className="truncate text-[#5e6a62] dark:text-slate-400">
                            {item.type}
                          </span>
                        </div>
                        <h2 className="mt-1 text-sm font-semibold text-[#103d2c] group-hover:text-[#134a35] sm:text-base dark:text-white dark:group-hover:text-[#E2B354]">
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
                      <p className="line-clamp-2 text-xs leading-relaxed text-[#5e6a62] dark:text-slate-300">
                        {item.halalReason || item.description}
                      </p>
                    )}

                    <div className="flex w-full items-center justify-between border-t border-[#f0f4f1] pt-2 text-[11px] text-[#6d7971] dark:border-slate-800/80 dark:text-slate-400">
                      <span>{item.source ? `Sumber: ${item.source}` : "Ketuk untuk detail lengkap"}</span>
                      <span className="font-semibold text-[#134a35] dark:text-[#E2B354]">
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
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#e2e8e4] bg-white px-4 py-3 dark:border-slate-800 dark:bg-[#111A27]">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#dce4df] bg-[#f8faf9] px-3.5 text-xs font-semibold text-[#103d2c] transition-colors hover:bg-[#edf3ef] disabled:opacity-40 dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Sebelumnya</span>
              </button>

              <span className="font-mono-tabular text-xs font-semibold text-[#5e6a62] dark:text-slate-300">
                Halaman {page} / {meta.totalPages}
              </span>

              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#134a35] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#0e3928] disabled:opacity-40 dark:bg-[#E2B354] dark:text-[#0B111A]"
              >
                <span>Berikutnya</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={() => setSelectedItem(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ecode-detail-title"
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-t-3xl border border-[#dce4df] bg-white shadow-2xl sm:rounded-3xl dark:border-slate-700 dark:bg-[#111A27]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#e8eeea] bg-[#f6f9f7] px-5 py-4 dark:border-slate-800 dark:bg-[#152030]">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-[#5e6a62] dark:text-slate-400">
                  <span className="font-mono-tabular font-bold text-[#134a35] dark:text-[#E2B354]">
                    {selectedItem.code}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedItem.type}</span>
                </div>
                <h2
                  id="ecode-detail-title"
                  className="font-display mt-0.5 text-xl font-semibold text-[#103d2c] dark:text-white"
                >
                  {selectedItem.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                aria-label="Tutup detail E-Code"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dce4df] bg-white text-[#354c3e] hover:bg-[#edf3ef] dark:border-slate-700 dark:bg-[#111A27] dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[75vh] space-y-4 overflow-y-auto p-5">
              {/* Status Callout */}
              {(() => {
                const st = STATUS_META[selectedItem.halalStatus];
                return (
                  <div className={`rounded-2xl border p-4 ${st.containerClass}`}>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      {st.icon}
                      <span>Status Kehalalan: {st.label}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed opacity-95">
                      {selectedItem.halalReason || st.shortDesc}
                    </p>
                  </div>
                );
              })()}

              {detailLoading && (
                <div className="flex items-center gap-2 text-xs text-[#5e6a62] dark:text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Memuat detail tambahan…</span>
                </div>
              )}

              {selectedItem.description && (
                <div>
                  <h3 className="text-xs font-semibold tracking-wide text-[#5e6a62] uppercase dark:text-slate-400">
                    Keterangan &amp; Fungsi Bahan
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#1d2c24] dark:text-slate-200">
                    {selectedItem.description}
                  </p>
                </div>
              )}

              {selectedItem.source && (
                <div>
                  <h3 className="text-xs font-semibold tracking-wide text-[#5e6a62] uppercase dark:text-slate-400">
                    Kemungkinan Sumber Bahan
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#1d2c24] dark:text-slate-200">
                    {selectedItem.source}
                  </p>
                </div>
              )}

              {selectedItem.note && (
                <div>
                  <h3 className="text-xs font-semibold tracking-wide text-[#5e6a62] uppercase dark:text-slate-400">
                    Catatan Tambahan
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#1d2c24] dark:text-slate-200">
                    {selectedItem.note}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e8eeea] pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => void handleCopyItem(selectedItem)}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#dce4df] bg-[#f8faf9] px-4 text-xs font-semibold text-[#103d2c] hover:bg-[#edf3ef] dark:border-slate-700 dark:bg-[#162131] dark:text-slate-200"
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
                  className="min-h-[42px] rounded-xl bg-[#134a35] px-5 text-xs font-semibold text-white hover:bg-[#0e3928] dark:bg-[#E2B354] dark:text-[#0B111A]"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FooterDisclaimer variant="compact" />
    </div>
  );
};
