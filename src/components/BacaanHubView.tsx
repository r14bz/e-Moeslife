import React, { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Search } from "lucide-react";
import type { ClassicSection } from "../data/sections";
import type { CollectionKind } from "../types/emoeslife";
import { filterReadingSections } from "../utils/readerEngine";
import { COLLECTION_VISUALS } from "./PesantrenCardMotifs";

interface BacaanHubViewProps {
  sections: ClassicSection[];
  onOpenCollection: (kind: CollectionKind) => void;
  onOpenSectionIndex: (sectionIndex: number) => void;
  onOpenWudhuShalat: () => void;
}

export const BacaanHubView: React.FC<BacaanHubViewProps> = ({
  sections,
  onOpenCollection,
  onOpenSectionIndex,
  onOpenWudhuShalat,
}) => {
  const [query, setQuery] = useState("");
  const [activeGroupKey, setActiveGroupKey] = useState<"all" | CollectionKind>("all");

  const tahlilCount = useMemo(
    () => sections.filter((s) => !s.quranSurah && !s.collection).length,
    [sections]
  );

  const indexGroups = useMemo(() => {
    const groups = [
      {
        key: "tahlil" as const,
        title: "Rangkaian Tahlil",
        sub: "Doa, zikir, tawasul, dan penutup",
        filter: (s: ClassicSection) => !s.quranSurah && !s.collection,
        symbol: "۞",
      },
      {
        key: "dzikir" as const,
        title: "Dzikir Ba'da Shalat",
        sub: "Istighfar, dzikir, ayat pilihan, dan doa",
        filter: (s: ClassicSection) => s.collection === "dzikir",
        symbol: "۞",
      },
      {
        key: "yasin" as const,
        title: "Surah Yasin",
        sub: "Surah ke-36 · Al-Qur’an",
        filter: (s: ClassicSection) => s.quranSurah === 36,
        symbol: "٣٦",
      },
      {
        key: "rahman" as const,
        title: "Surah Ar-Rahman",
        sub: "Surah ke-55 · Al-Qur’an",
        filter: (s: ClassicSection) => s.quranSurah === 55,
        symbol: "٥٥",
      },
    ];
    return groups
      .filter((g) => activeGroupKey === "all" || g.key === activeGroupKey)
      .map((group) => ({
        ...group,
        entries: filterReadingSections(sections, query, group.filter),
      }))
      .filter((group) => group.entries.length > 0);
  }, [sections, query, activeGroupKey]);

  const cards = [
    {
      id: "tahlil" as const,
      title: "Rangkaian Tahlil",
      meta: `${tahlilCount} bagian`,
      onClick: () => onOpenCollection("tahlil"),
    },
    {
      id: "yasin" as const,
      title: "Surah Yasin",
      meta: "83 ayat",
      onClick: () => onOpenCollection("yasin"),
    },
    {
      id: "wudhu-shalat" as const,
      title: "Wudhu & Shalat",
      meta: "Tata cara & gambar",
      onClick: onOpenWudhuShalat,
    },
    {
      id: "dzikir" as const,
      title: "Dzikir Ba'da Shalat",
      meta: "Wirid harian",
      onClick: () => onOpenCollection("dzikir"),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 pt-4 sm:px-6">
      <div className="border-b border-[#e2e8e4] pb-3.5 dark:border-slate-800">
        <p className="text-[11px] font-semibold tracking-wider text-[#9c7d3c] uppercase dark:text-[#E2B354]">
          Koleksi Utama
        </p>
        <h1 className="font-display mt-0.5 text-xl font-semibold text-[#103d2c] sm:text-2xl dark:text-white">
          Bacaan & Zikir Klasik
        </h1>
        <p className="mt-1 text-xs text-[#5e6a62] sm:text-sm dark:text-slate-300">
          Pilih rangkaian utama atau lompat langsung ke bagian bacaan tertentu di daftar isi.
        </p>
      </div>

      {/* 4 Primary Collection Cards matching Pesantren emblems */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {cards.map((card) => {
          const visual = COLLECTION_VISUALS[card.id];
          return (
            <button
              key={card.id}
              type="button"
              onClick={card.onClick}
              className="group flex min-h-[72px] items-center justify-between gap-2.5 rounded-2xl border border-[#e2e8e4] bg-white px-3 py-3 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#134a35] hover:shadow-sm sm:px-3.5 dark:border-slate-800 dark:bg-[#111A27] dark:hover:border-[#E2B354] dark:hover:bg-[#162233]"
            >
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-[1.04] sm:h-11 sm:w-11 ${visual.boxClass}`}
                >
                  {visual.icon}
                </span>
                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-xs font-semibold leading-snug text-[#103d2c] sm:text-sm dark:text-white">
                    {card.title}
                  </h2>
                  <p className="mt-0.5 truncate text-[11px] text-[#606c64] dark:text-slate-400">
                    {card.meta}
                  </p>
                </div>
              </div>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5 ${visual.arrowClass}`}
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Filter + Searchable Complete Index */}
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-2.5 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter kelompok bacaan">
            {(
              [
                { id: "all", label: "Semua" },
                { id: "tahlil", label: "Tahlil" },
                { id: "dzikir", label: "Dzikir" },
                { id: "yasin", label: "Yasin" },
                { id: "rahman", label: "Ar-Rahman" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeGroupKey === tab.id}
                onClick={() => setActiveGroupKey(tab.id)}
                className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeGroupKey === tab.id
                    ? "bg-[#134a35] text-white dark:bg-[#E2B354] dark:text-[#0B111A]"
                    : "border border-[#dce4df] bg-white text-[#354c3e] hover:bg-[#f4f7f5] dark:border-slate-800 dark:bg-[#111A27] dark:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label className="relative flex min-h-[40px] w-full items-center md:w-72">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#6d7971] dark:text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari bagian bacaan..."
              aria-label="Cari bacaan"
              className="min-h-[40px] w-full rounded-2xl border border-[#e2e8e4] bg-white pr-3.5 pl-9 text-xs outline-none focus:border-[#134a35] sm:text-sm dark:border-slate-800 dark:bg-[#111A27] dark:focus:border-[#E2B354]"
            />
          </label>
        </div>

        <div className="space-y-5">
          {indexGroups.map((group) => (
            <div key={group.key}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#103d2c] font-arabic text-xs text-[#e7cf96] dark:bg-[#1D3557] dark:text-[#E2B354]">
                    {group.symbol}
                  </span>
                  <div>
                    <h3 className="text-xs font-semibold text-[#103d2c] sm:text-sm dark:text-white">
                      {group.title}
                    </h3>
                    <p className="text-[11px] text-[#606c64] dark:text-slate-400">{group.sub}</p>
                  </div>
                </div>
                <span className="font-mono-tabular text-[11px] font-medium text-[#606c64] dark:text-slate-400">
                  {String(group.entries.length).padStart(2, "0")} bagian
                </span>
              </div>

              <div className="divide-y divide-[#edf2ef] overflow-hidden rounded-2xl border border-[#e2e8e4] bg-white shadow-xs dark:divide-slate-800 dark:border-slate-800 dark:bg-[#111A27]">
                {group.entries.map(({ s, i }, j) => (
                  <button
                    key={`${group.key}-${i}`}
                    type="button"
                    onClick={() => onOpenSectionIndex(i)}
                    className="flex min-h-[44px] w-full items-center justify-between gap-3 px-3.5 py-2 text-left transition-colors hover:bg-[#f4f8f5] dark:hover:bg-[#162233]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="font-mono-tabular w-5 shrink-0 text-[11px] font-semibold text-[#9c7d3c] dark:text-[#E2B354]">
                        {String(j + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-medium text-[#103d2c] sm:text-sm dark:text-slate-100">
                          {s.title || "Bagian bacaan"}
                        </span>
                        <span className="block text-[11px] text-[#606c64] dark:text-slate-400">
                          {s.quranSurah
                            ? s.isBismillah
                              ? "Pembuka surah"
                              : "Ayat Al-Qur’an"
                            : "Doa dan zikir"}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#6d7971] dark:text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          {!indexGroups.length && (
            <p className="rounded-2xl border border-dashed border-[#cbd6cf] bg-white p-6 text-center text-xs text-[#606c64] dark:border-slate-700 dark:bg-[#111A27] dark:text-slate-400">
              Bacaan tidak ditemukan. Coba kata kunci lain.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};
