import React, { useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { ArrowRight, CheckCircle2, CloudDownload, Search } from "lucide-react";
import type { LocalBookMeta } from "../types/emoeslife";
import { countCachedLocalKitabs, prefetchAllLocalKitabs } from "../hooks/usePWAInstall";
import { KitabCoverMini, getKitabSubtitle } from "./PesantrenCardMotifs";

interface KitabHubViewProps {
  localBooks: LocalBookMeta[];
  apiBooks: LocalBookMeta[];
  onOpenBook: (book: LocalBookMeta) => void;
}

export const KitabHubView: React.FC<KitabHubViewProps> = ({
  localBooks,
  apiBooks,
  onOpenBook,
}) => {
  const isNativeApp = Capacitor.isNativePlatform();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [cachedCount, setCachedCount] = useState(0);
  const [prefetching, setPrefetching] = useState(false);

  useEffect(() => {
    if (isNativeApp) return;
    countCachedLocalKitabs().then(setCachedCount);
  }, [isNativeApp]);

  const allBooks = useMemo(() => [...localBooks, ...apiBooks], [localBooks, apiBooks]);

  const CATEGORY_ORDER = ["Aqidah", "Fiqih", "Ilmu Alat", "Adab", "Hadis", "Tasawuf", "Keluarga", "Tafsir"];

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    allBooks.forEach((book) => {
      if (book.category) {
        counts.set(book.category, (counts.get(book.category) || 0) + 1);
      }
    });
    const ordered = CATEGORY_ORDER.filter((cat) => counts.has(cat));
    const extras = Array.from(counts.keys()).filter((cat) => !CATEGORY_ORDER.includes(cat));
    return [
      { name: "Semua", count: allBooks.length },
      ...[...ordered, ...extras].map((name) => ({ name, count: counts.get(name) || 0 })),
    ];
  }, [allBooks]);

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("id");
    return allBooks.filter((book) => {
      const catMatch = category === "Semua" || book.category === category;
      const textMatch =
        !q || `${book.title} ${book.category} ${book.slug}`.toLocaleLowerCase("id").includes(q);
      return catMatch && textMatch;
    });
  }, [allBooks, category, query]);

  const handlePrefetchAll = async () => {
    if (prefetching) return;
    setPrefetching(true);
    try {
      const totalSaved = await prefetchAllLocalKitabs((done) => setCachedCount(done));
      setCachedCount(totalSaved);
    } finally {
      setPrefetching(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 pt-4 sm:px-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#103d2c] sm:text-3xl dark:text-white">
            Perpustakaan Kitab Kuning
          </h1>
          <p className="mt-1 text-xs text-[#5e6a62] sm:text-sm dark:text-slate-300">
            Jelajahi {allBooks.length} kitab berjenjang dari pengetahuan dasar hingga lanjut dengan mode lipat terjemah.
          </p>
        </div>

        {!isNativeApp && (
          <button
            type="button"
            onClick={handlePrefetchAll}
            disabled={prefetching || cachedCount >= localBooks.length}
            className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 self-start rounded-xl border border-[#dce4df] bg-white px-3 text-xs font-semibold text-[#134a35] shadow-xs transition-colors hover:bg-[#f4f7f5] disabled:opacity-75 md:self-auto dark:border-slate-700 dark:bg-[#162131] dark:text-[#E2B354]"
          >
            {cachedCount >= localBooks.length ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <CloudDownload className="h-3.5 w-3.5" />
            )}
            <span>
              {prefetching
                ? `Mengunduh (${cachedCount}/${localBooks.length})…`
                : cachedCount >= localBooks.length
                ? `${localBooks.length} kitab siap offline`
                : `Simpan Offline (${cachedCount}/${localBooks.length})`}
            </span>
          </button>
        )}
      </div>

      {/* Rounded Search Input */}
      <label className="relative flex min-h-[44px] items-center">
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#6d7971] dark:text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama kitab atau pengarang..."
          aria-label="Cari nama kitab atau pengarang"
          className="min-h-[44px] w-full rounded-2xl border border-[#e2e8e4] bg-white pr-4 pl-10 text-xs text-[#1d2c24] shadow-xs outline-none placeholder:text-[#7f8b83] focus:border-[#134a35] sm:text-sm dark:border-slate-800 dark:bg-[#111A27] dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-[#E2B354]"
        />
      </label>

      {/* Tidy Category Filter Bar */}
      <div
        className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-[#e8eeea] bg-[#f8faf9] p-1.5 sm:flex-wrap dark:border-slate-800 dark:bg-[#0F1722]"
        role="tablist"
        aria-label="Filter kategori kitab"
      >
        {categories.map((cat) => {
          const active = category === cat.name;
          return (
            <button
              key={cat.name}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(cat.name)}
              className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[11px] font-semibold whitespace-nowrap transition-all sm:px-3 sm:text-xs ${
                active
                  ? "bg-[#134a35] text-white shadow-xs dark:bg-[#E2B354] dark:text-[#0B111A]"
                  : "bg-white text-[#354c3e] ring-1 ring-[#e2e8e4] hover:bg-[#edf2ef] dark:bg-[#162131] dark:text-slate-300 dark:ring-slate-700/70 dark:hover:bg-[#1D2B3F]"
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`font-mono-tabular text-[10px] ${
                  active ? "opacity-85" : "text-[#7a877f] dark:text-slate-400"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Compact Book Cover Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-4">
        {filteredBooks.map((book) => (
          <button
            key={`${book.source}-${book.slug}`}
            type="button"
            onClick={() => onOpenBook(book)}
            className="group flex min-h-[66px] items-center justify-between gap-2 rounded-2xl border border-[#e2e8e4] bg-white px-2.5 py-2.5 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#134a35] hover:shadow-sm sm:px-3 dark:border-slate-800 dark:bg-[#111A27] dark:hover:border-[#E2B354] dark:hover:bg-[#162233]"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <KitabCoverMini category={book.category} size="sm" />
              <div className="min-w-0">
                <span className="line-clamp-2 block text-xs font-semibold leading-snug text-[#103d2c] sm:text-[13px] dark:text-white">
                  {book.title}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-[#606c64] dark:text-slate-400">
                  {getKitabSubtitle(book)}
                </span>
              </div>
            </div>

            <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef4f0] text-[#134a35] transition-transform duration-200 group-hover:translate-x-0.5 sm:flex dark:bg-[#182942] dark:text-[#E2B354]">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>

      {!filteredBooks.length && (
        <p className="rounded-2xl border border-dashed border-[#cbd6cf] bg-white p-6 text-center text-xs text-[#606c64] dark:border-slate-700 dark:bg-[#111A27] dark:text-slate-400">
          Kitab tidak ditemukan. Coba kata kunci atau kategori lain.
        </p>
      )}
    </div>
  );
};
