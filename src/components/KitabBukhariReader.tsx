import React, { useEffect, useMemo, useRef, useState } from "react";
import { daftarBabBukhari, semuaBabBukhari } from "../data/bukhari";
import type { BukhariBab } from "../types/bukhari.types";
import { ThemedSelect } from "./ThemedSelect";
import { FloatingPageNav } from "./FloatingPageNav";

interface KitabBukhariReaderProps {
  initialBabId?: number;
}

export const KitabBukhariReader: React.FC<KitabBukhariReaderProps> = ({
  initialBabId = 1,
}) => {
  const defaultBabId = semuaBabBukhari[0]?.id ?? 1;
  const [selectedBabId, setSelectedBabId] = useState<number>(initialBabId || defaultBabId);
  const [openAllArti, setOpenAllArti] = useState<boolean>(false);
  const [openItemIds, setOpenItemIds] = useState<Record<number, boolean>>({});
  const readingCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const valid = semuaBabBukhari.some((b) => b.id === initialBabId)
      ? initialBabId
      : defaultBabId;
    setSelectedBabId(valid);
    setOpenItemIds({});
  }, [initialBabId, defaultBabId]);

  const currentBabIndex = useMemo(
    () => semuaBabBukhari.findIndex((b) => b.id === selectedBabId),
    [selectedBabId]
  );

  const activeBab: BukhariBab | undefined =
    currentBabIndex >= 0 ? semuaBabBukhari[currentBabIndex] : semuaBabBukhari[0];

  const scrollToReadingCard = () => {
    window.requestAnimationFrame(() => {
      readingCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleSelectBab = (id: number) => {
    setSelectedBabId(id);
    setOpenItemIds({});
    scrollToReadingCard();
  };

  const toggleSingleTerjemahan = (itemId: number) => {
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
    if (index >= 0 && index < semuaBabBukhari.length) {
      handleSelectBab(semuaBabBukhari[index].id);
    }
  };

  const activeJudulIndo = activeBab
    ? activeBab.judulIndo || activeBab.judulLatin || activeBab.kitabLatin || `Bab ${activeBab.id}`
    : "";

  return (
    <div
      style={{
        padding: "0.75rem",
        backgroundColor: "var(--tashrif-bg)",
        color: "var(--tashrif-text)",
      }}
      className="mx-auto max-w-2xl"
    >
      {/* Banner Header Hijau Zamrud (Senada Jurumiyah & Nashoihul Ibad) */}
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
          صَحِيحُ الْبُخَارِيِّ
        </h1>
        <p style={{ color: "var(--tashrif-panel-sub)" }} className="text-xs font-semibold">
          Kitab Shahih al-Bukhari — Ringkasan {daftarBabBukhari.length} Bab
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
            ariaLabel="Pilih Bab Kitab Shahih al-Bukhari"
            kickerLabel="Daftar Bab Shahih Bukhari"
            value={activeBab?.id ?? selectedBabId}
            onChange={(val) => handleSelectBab(Number(val))}
            options={daftarBabBukhari.map((bab) => ({
              value: bab.id,
              label: `${bab.id}. ${bab.judulIndo || bab.judulLatin || bab.kitabLatin || `Bab ${bab.id}`}`,
              sublabel: bab.judulLatin && bab.judulIndo ? bab.judulLatin : undefined,
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
          Ketuk hadis untuk membuka arti, sanad &amp; catatan
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
              BAB {activeBab.id} • {activeBab.isi.length} HADIS
            </span>
            {activeBab.judulArab && (
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
                {activeBab.judulArab}
              </h2>
            )}
            {activeBab.judulLatin && (
              <p style={{ color: "var(--tashrif-muted)" }} className="text-xs font-semibold">
                {activeBab.judulLatin}
              </p>
            )}
            <p style={{ color: "var(--tashrif-muted)" }} className="mt-0.5 text-[11px] font-medium opacity-95">
              {activeJudulIndo}
            </p>
            {activeBab.ringkasan && (
              <p style={{ color: "var(--tashrif-muted)" }} className="mt-1 text-[11px] leading-relaxed opacity-85">
                {activeBab.ringkasan}
              </p>
            )}
          </div>

          <div>
            {activeBab.isi.map((item) => {
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
                    dir="rtl"
                    style={{
                      width: "100%",
                      textAlign: "right",
                      background: "transparent",
                      border: "none",
                    }}
                    className="block w-full cursor-pointer px-3.5 py-3 transition-colors hover:bg-emerald-900/5 dark:hover:bg-amber-400/5"
                  >
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
                      <span
                        style={{
                          backgroundColor: "var(--tashrif-wazan-bg)",
                          border: "1px solid var(--tashrif-border-cell)",
                          color: "var(--tashrif-accent)",
                        }}
                        className="ml-2 inline-block rounded px-1.5 py-0.5 align-middle font-mono-tabular text-[11px] font-bold"
                      >
                        {item.id}
                      </span>
                      {item.arab}
                    </p>
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
                      {(item.noHadis || item.sanadRingkas) && (
                        <div
                          style={{ color: "var(--tashrif-accent)" }}
                          className="mb-1 text-[11px] font-bold"
                        >
                          {item.noHadis ? `HR. Bukhari No. ${item.noHadis}` : ""}
                          {item.noHadis && item.sanadRingkas ? " · " : ""}
                          {item.sanadRingkas || ""}
                        </div>
                      )}

                      <div>
                        <span
                          style={{ color: "var(--tashrif-accent)" }}
                          className="mr-1.5 font-mono-tabular font-bold"
                        >
                          [{item.id}]
                        </span>
                        {item.terjemahan}
                      </div>

                      {item.catatan && (
                        <div
                          style={{
                            borderTop: "1px dotted var(--tashrif-border-cell)",
                            color: "var(--tashrif-muted)",
                          }}
                          className="mt-1.5 pt-1.5 text-[11px] leading-relaxed"
                        >
                          <strong style={{ color: "var(--tashrif-accent)" }}>Catatan:</strong>{" "}
                          {item.catatan}
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
        ariaLabel="Navigasi antar bab Shahih Bukhari"
        onPrev={() => goToBabByIndex(currentBabIndex - 1)}
        onNext={() => goToBabByIndex(currentBabIndex + 1)}
        canPrev={currentBabIndex > 0}
        canNext={currentBabIndex < semuaBabBukhari.length - 1}
        centerText={`${Math.max(1, currentBabIndex + 1)} / ${semuaBabBukhari.length}`}
      />
    </div>
  );
};

export default KitabBukhariReader;
