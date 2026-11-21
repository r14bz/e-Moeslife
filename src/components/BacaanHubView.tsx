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
      meta: "Tata cara, niat & Qunut",
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
    <div
      style={{
        backgroundColor: "var(--tashrif-bg)",
        color: "var(--tashrif-text)",
        minHeight: "100vh",
      }}
    >
      <div className="mx-auto max-w-6xl space-y-5 px-3.5 pt-3.5 pb-10 sm:px-6">
        {/* Banner Header Hijau Zamrud (Senada Pembaca Kitab) */}
        <div
          style={{
            backgroundColor: "var(--tashrif-panel-bg)",
            border: "1px solid var(--tashrif-panel-border)",
            borderRadius: "0.75rem",
          }}
          className="px-3.5 py-4 text-center shadow-xs"
        >
          <h1
            dir="rtl"
            lang="ar"
            style={{ color: "var(--tashrif-panel-bright)", lineHeight: "1.8" }}
            className="font-arabic text-2xl font-bold sm:text-[1.65rem]"
          >
            الأَوْرَادُ وَالأَذْكَارُ وَالتَّهْلِيْلُ
          </h1>
          <p style={{ color: "var(--tashrif-panel-sub)" }} className="mt-0.5 text-xs font-semibold">
            Bacaan &amp; Zikir Klasik — Tahlil, Yasin, Wudhu &amp; Shalat, dan Wirid Harian
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
                style={{
                  backgroundColor: "var(--tashrif-paper)",
                  border: "1px solid var(--tashrif-border-cell)",
                }}
                className="group flex min-h-[72px] items-center justify-between gap-2.5 rounded-xl px-3 py-3 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm sm:px-3.5"
              >
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-[1.04] sm:h-11 sm:w-11 ${visual.boxClass}`}
                  >
                    {visual.icon}
                  </span>
                  <div className="min-w-0">
                    <h2
                      style={{ color: "var(--tashrif-ink)" }}
                      className="line-clamp-2 text-xs font-semibold leading-snug sm:text-sm"
                    >
                      {card.title}
                    </h2>
                    <p style={{ color: "var(--tashrif-muted)" }} className="mt-0.5 truncate text-[11px]">
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
          <div
            style={{
              backgroundColor: "var(--tashrif-paper)",
              border: "1px solid var(--tashrif-border-cell)",
            }}
            className="flex flex-col justify-between gap-2.5 rounded-xl p-3 shadow-xs md:flex-row md:items-center"
          >
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
                  style={
                    activeGroupKey === tab.id
                      ? {
                          backgroundColor: "var(--tashrif-btn-bg)",
                          color: "var(--tashrif-btn-text)",
                        }
                      : {
                          border: "1px solid var(--tashrif-border-cell)",
                          backgroundColor: "var(--tashrif-row-alt)",
                          color: "var(--tashrif-text)",
                        }
                  }
                  className="min-h-[36px] rounded-lg px-3 text-xs font-bold whitespace-nowrap transition-colors"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <label className="relative flex min-h-[40px] w-full items-center md:w-72">
              <Search
                style={{ color: "var(--tashrif-muted)" }}
                className="pointer-events-none absolute left-3 h-4 w-4"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari bagian bacaan..."
                aria-label="Cari bacaan"
                style={{
                  border: "1.5px solid var(--tashrif-border-strong)",
                  backgroundColor: "var(--tashrif-control-bg)",
                  color: "var(--tashrif-text)",
                }}
                className="min-h-[40px] w-full rounded-lg pr-3.5 pl-9 text-xs font-medium outline-none sm:text-sm"
              />
            </label>
          </div>

          <div className="space-y-4">
            {indexGroups.map((group) => (
              <div
                key={group.key}
                style={{
                  backgroundColor: "var(--tashrif-paper)",
                  border: "4px double var(--tashrif-border-strong)",
                  borderRadius: "0.75rem",
                }}
                className="overflow-hidden shadow-xs"
              >
                <div
                  style={{
                    backgroundColor: "var(--tashrif-wazan-bg)",
                    borderBottom: "1px solid var(--tashrif-border-cell)",
                  }}
                  className="flex items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      style={{
                        backgroundColor: "var(--tashrif-panel-bg)",
                        border: "1px solid var(--tashrif-panel-border)",
                        color: "var(--tashrif-panel-bright)",
                      }}
                      className="font-arabic flex h-8 w-8 items-center justify-center rounded-lg text-sm"
                    >
                      {group.symbol}
                    </span>
                    <div>
                      <h3
                        style={{ color: "var(--tashrif-ink)" }}
                        className="text-xs font-bold sm:text-sm"
                      >
                        {group.title}
                      </h3>
                      <p style={{ color: "var(--tashrif-muted)" }} className="text-[11px]">
                        {group.sub}
                      </p>
                    </div>
                  </div>
                  <span
                    style={{ color: "var(--tashrif-accent)" }}
                    className="font-mono-tabular text-[11px] font-bold uppercase"
                  >
                    {String(group.entries.length).padStart(2, "0")} bagian
                  </span>
                </div>

                <div>
                  {group.entries.map(({ s, i }, j) => (
                    <button
                      key={`${group.key}-${i}`}
                      type="button"
                      onClick={() => onOpenSectionIndex(i)}
                      style={{ borderBottom: "1px solid var(--tashrif-border-cell)" }}
                      className="flex min-h-[46px] w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[var(--tashrif-dropdown-hover)]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          style={{
                            backgroundColor: "var(--tashrif-wazan-bg)",
                            border: "1px solid var(--tashrif-border-cell)",
                            color: "var(--tashrif-accent)",
                          }}
                          className="font-mono-tabular inline-block w-7 shrink-0 rounded py-0.5 text-center text-[11px] font-bold"
                        >
                          {String(j + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <span
                            style={{ color: "var(--tashrif-ink)" }}
                            className="block truncate text-xs font-semibold sm:text-sm"
                          >
                            {s.title || "Bagian bacaan"}
                          </span>
                          <span style={{ color: "var(--tashrif-muted)" }} className="block text-[11px]">
                            {s.quranSurah
                              ? s.isBismillah
                                ? "Pembuka surah"
                                : "Ayat Al-Qur’an"
                              : "Doa dan zikir"}
                          </span>
                        </div>
                      </div>
                      <ArrowUpRight
                        style={{ color: "var(--tashrif-accent)" }}
                        className="h-3.5 w-3.5 shrink-0"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {!indexGroups.length && (
              <p
                style={{
                  border: "1px dashed var(--tashrif-group-break)",
                  backgroundColor: "var(--tashrif-paper)",
                  color: "var(--tashrif-muted)",
                }}
                className="rounded-xl p-6 text-center text-xs"
              >
                Bacaan tidak ditemukan. Coba kata kunci lain.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
