import React, { useEffect, useMemo, useRef, useState } from "react";
import { tijanDaroriData } from "../data/tijan-darori";
import type { TijanBab } from "../types/tijan-darori.types";
import { ThemedSelect } from "./ThemedSelect";
import { FloatingPageNav } from "./FloatingPageNav";

interface KitabTijanDaroriReaderProps {
  initialBabId?: string;
}

export const KitabTijanDaroriReader: React.FC<KitabTijanDaroriReaderProps> = ({
  initialBabId,
}) => {
  const defaultBabId = tijanDaroriData[0]?.id ?? "";
  const [selectedBabId, setSelectedBabId] = useState<string>(initialBabId || defaultBabId);
  const [openAllArti, setOpenAllArti] = useState<boolean>(false);
  const [openItemIds, setOpenItemIds] = useState<Record<string, boolean>>({});
  const readingCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const valid =
      initialBabId && tijanDaroriData.some((b) => b.id === initialBabId)
        ? initialBabId
        : defaultBabId;
    setSelectedBabId(valid);
    setOpenItemIds({});
  }, [initialBabId, defaultBabId]);

  const currentBabIndex = useMemo(
    () => tijanDaroriData.findIndex((b) => b.id === selectedBabId),
    [selectedBabId]
  );

  const activeBab: TijanBab | undefined =
    currentBabIndex >= 0 ? tijanDaroriData[currentBabIndex] : tijanDaroriData[0];

  const scrollToReadingCard = () => {
    window.requestAnimationFrame(() => {
      readingCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleSelectBab = (id: string) => {
    setSelectedBabId(id);
    setOpenItemIds({});
    scrollToReadingCard();
  };

  const toggleSingleTerjemahan = (itemId: string) => {
    setOpenItemIds((prev) => ({
      ...prev,
      [itemId]: !(prev[itemId] ?? openAllArti),
    }));
  };

  const handleToggleAll = () => {
    const nextState = !openAllArti;
    setOpenAllArti(nextState);
    setOpenItemIds({});
  };

  const goToBabByIndex = (index: number) => {
    if (index >= 0 && index < tijanDaroriData.length) {
      handleSelectBab(tijanDaroriData[index].id);
    }
  };

  return (
    <div
      style={{
        padding: "0.75rem",
        backgroundColor: "var(--tashrif-bg)",
        color: "var(--tashrif-text)",
      }}
      className="mx-auto max-w-2xl"
    >
      {/* Banner Header Hijau Zamrud */}
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
          تِيجَانُ الدَّرَارِي
        </h1>
        <p style={{ color: "var(--tashrif-panel-sub)" }} className="text-xs font-semibold">
          Kitab Tijan Daruri — Matan Syekh Ibrahim al-Bajuri &amp; Syarah Syekh Nawawi al-Bantani
        </p>
      </div>

      {/* Panel Kontrol Dropdown Bab & Tombol Buka Arti */}
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
        <div className="flex items-center gap-2.5">
          <ThemedSelect
            ariaLabel="Pilih Bab Kitab Tijan Daruri"
            kickerLabel="Daftar Bab Tijan Daruri"
            value={activeBab?.id ?? selectedBabId}
            onChange={(val) => handleSelectBab(String(val))}
            options={tijanDaroriData.map((bab) => ({
              value: bab.id,
              label: `Bab ${bab.nomorBab}. ${bab.judulBab}`,
            }))}
          />

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
            className="text-xs font-bold"
          >
            {openAllArti ? "Tutup Arti" : "Buka Arti"}
          </button>
        </div>

        <p
          style={{
            marginTop: "0.5rem",
            paddingLeft: "0.15rem",
            color: "var(--tashrif-muted)",
          }}
          className="text-[11px]"
        >
          Ketuk matan Arab untuk membuka atau menutup terjemahan &amp; syarah Nawawi
        </p>
      </div>

      {/* Bingkai Utama Kitab dengan Double Border */}
      {activeBab && (
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
              BAB {activeBab.nomorBab} / {tijanDaroriData.length} • {activeBab.items.length} PEMBAHASAN
            </span>
            {activeBab.judulBabArab && (
              <h2
                dir="rtl"
                lang="ar"
                style={{
                  color: "var(--tashrif-ink)",
                  lineHeight: "2.0",
                  marginBottom: "0.2rem",
                }}
                className="font-arabic text-xl font-bold sm:text-2xl"
              >
                {activeBab.judulBabArab}
              </h2>
            )}
            <p style={{ color: "var(--tashrif-muted)" }} className="text-xs font-semibold">
              {activeBab.judulBab}
            </p>
            {activeBab.deskripsiSingkat && (
              <p
                style={{ color: "var(--tashrif-muted)" }}
                className="mt-1 text-[11px] leading-relaxed opacity-85"
              >
                {activeBab.deskripsiSingkat}
              </p>
            )}
          </div>

          <div>
            {activeBab.items.map((item) => {
              const isOpen = openItemIds[item.id] ?? openAllArti;

              return (
                <div
                  key={item.id}
                  style={{ borderBottom: "1px solid var(--tashrif-border-cell)" }}
                  className="last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => toggleSingleTerjemahan(item.id)}
                    aria-expanded={isOpen}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                    }}
                    className="block w-full cursor-pointer px-3.5 py-3 text-left transition-colors hover:bg-[var(--tashrif-dropdown-hover)]"
                  >
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          style={{
                            backgroundColor: "var(--tashrif-wazan-bg)",
                            border: "1px solid var(--tashrif-border-cell)",
                            color: "var(--tashrif-accent)",
                          }}
                          className="inline-block rounded px-1.5 py-0.5 font-mono-tabular text-[11px] font-bold"
                        >
                          {item.urutan}
                        </span>
                        <span
                          style={{ color: "var(--tashrif-text)" }}
                          className="text-xs font-bold sm:text-[13px]"
                        >
                          {item.judul}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        {item.kelompokSifat && (
                          <span
                            style={{
                              backgroundColor: "var(--tashrif-wazan-bg)",
                              border: "1px solid var(--tashrif-border-cell)",
                              color: "var(--tashrif-accent)",
                            }}
                            className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                          >
                            {item.kelompokSifat}
                          </span>
                        )}
                        {item.lawanSifat && (
                          <span
                            style={{
                              border: "1px solid var(--tashrif-border-cell)",
                              color: "var(--tashrif-muted)",
                            }}
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                          >
                            Lawan: {item.lawanSifat}
                          </span>
                        )}
                      </div>
                    </div>

                    <p
                      dir="rtl"
                      lang="ar"
                      style={{
                        color: "var(--tashrif-ink)",
                        fontSize: "var(--arabic-reader-size)",
                        lineHeight: "2.05",
                      }}
                      className="font-arabic text-right break-words"
                    >
                      {item.matanArab}
                    </p>
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        borderTop: "1px dashed var(--tashrif-group-break)",
                        backgroundColor: "var(--tashrif-wazan-bg)",
                        color: "var(--tashrif-text)",
                      }}
                      className="space-y-2 px-3.5 py-2.5 text-xs leading-relaxed sm:text-[13px]"
                    >
                      <div>
                        <span
                          style={{ color: "var(--tashrif-accent)" }}
                          className="mr-1.5 font-mono-tabular font-bold"
                        >
                          [{item.urutan}]
                        </span>
                        {item.terjemahMatan}
                      </div>

                      {(item.syarahArab || item.penjelasanSyarah) && (
                        <div
                          style={{
                            borderTop: "1px dotted var(--tashrif-border-cell)",
                            color: "var(--tashrif-muted)",
                          }}
                          className="space-y-1.5 pt-2 text-[11.5px] leading-relaxed sm:text-xs"
                        >
                          <div
                            style={{ color: "var(--tashrif-accent)" }}
                            className="text-[11px] font-bold"
                          >
                            Syarah Syekh Nawawi al-Bantani:
                          </div>
                          {item.syarahArab && (
                            <p
                              dir="rtl"
                              lang="ar"
                              style={{
                                color: "var(--tashrif-ink)",
                                lineHeight: "1.95",
                              }}
                              className="font-arabic text-right text-base sm:text-lg"
                            >
                              {item.syarahArab}
                            </p>
                          )}
                          {item.penjelasanSyarah && <p>{item.penjelasanSyarah}</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigasi Mengambang Sebelumnya / Selanjutnya */}
      <FloatingPageNav
        ariaLabel="Navigasi antar bab Tijan Daruri"
        onPrev={() => goToBabByIndex(currentBabIndex - 1)}
        onNext={() => goToBabByIndex(currentBabIndex + 1)}
        canPrev={currentBabIndex > 0}
        canNext={currentBabIndex < tijanDaroriData.length - 1}
        centerText={`${Math.max(1, currentBabIndex + 1)} / ${tijanDaroriData.length}`}
      />
    </div>
  );
};

export default KitabTijanDaroriReader;
